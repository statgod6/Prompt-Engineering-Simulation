import re
import json
import asyncio
import logging
import unicodedata
from typing import Optional

import jsonschema as jsonschema_lib

from .openrouter import openrouter_client
from .llm_judge import llm_judge

logger = logging.getLogger(__name__)


def _normalize(text: str) -> str:
    """Normalize text for comparison: lowercase, strip, collapse whitespace, normalize unicode."""
    text = unicodedata.normalize("NFKC", text)
    text = text.strip().lower()
    text = re.sub(r"\s+", " ", text)
    return text


class EvaluationEngine:
    """Core evaluation engine supporting multiple scoring methods."""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def evaluate(
        self,
        output: str,
        test_case: dict,
        scoring_config: dict,
    ) -> dict:
        """
        Evaluate a single output against a test case.

        Args:
            output: The LLM's output text
            test_case: {"input": "...", "expected_output": "...", ...}
            scoring_config: {"methods": [...], "dimensions": [...], "pass_threshold": 0.7, ...}

        Returns:
            {"scores": {...}, "composite": float, "passed": bool, "details": {...}, "reasoning": {...}}
        """
        methods = scoring_config.get("methods", ["llm_judge"])
        dimensions = scoring_config.get("dimensions", ["accuracy"])
        pass_threshold = scoring_config.get("pass_threshold", 0.7)
        weights = scoring_config.get("weights")
        rubric = scoring_config.get("rubric")
        schema = scoring_config.get("json_schema")
        expected = test_case.get("expected_output", "")

        scores: dict[str, float] = {}
        reasoning: dict[str, str] = {}
        details: dict[str, object] = {}

        for method in methods:
            if method == "exact_match":
                score = self.exact_match(output, expected)
                scores["exact_match"] = score
                reasoning["exact_match"] = "Exact match passed" if score == 1.0 else "Exact match failed"

            elif method == "regex_match":
                pattern = (test_case.get("metadata") or {}).get("regex_pattern", expected)
                score = self.regex_match(output, pattern)
                scores["regex_match"] = score
                reasoning["regex_match"] = "Regex matched" if score == 1.0 else "Regex did not match"

            elif method == "json_schema":
                score = self.json_schema_validate(output, schema or {})
                scores["format_compliance"] = score
                reasoning["format_compliance"] = (
                    "JSON schema fully valid" if score == 1.0
                    else f"JSON schema partially valid ({score:.0%})"
                )

            elif method == "semantic_similarity":
                score = await self.semantic_similarity(output, expected)
                scores["semantic_similarity"] = score
                reasoning["semantic_similarity"] = f"Semantic similarity score: {score:.2f}"

            elif method == "llm_judge":
                result = await self.llm_judge(output, test_case, rubric=rubric, dimensions=dimensions)
                scores.update(result.get("scores", {}))
                reasoning.update(result.get("reasoning", {}))

            else:
                logger.warning("Unknown scoring method: %s", method)

        composite = self.compute_composite(scores, weights)
        passed = composite >= pass_threshold

        return {
            "scores": scores,
            "composite": round(composite, 4),
            "passed": passed,
            "details": details or None,
            "reasoning": reasoning or None,
        }

    async def evaluate_batch(
        self,
        outputs: list[str],
        test_cases: list[dict],
        scoring_config: dict,
    ) -> dict:
        """Evaluate multiple outputs against multiple test cases. Returns aggregate scores."""
        tasks = [
            self.evaluate(output, tc, scoring_config)
            for output, tc in zip(outputs, test_cases)
        ]
        individual_results = await asyncio.gather(*tasks)

        # Aggregate scores across all results
        all_dims: set[str] = set()
        for r in individual_results:
            all_dims.update(r["scores"].keys())

        aggregate_scores: dict[str, float] = {}
        for dim in all_dims:
            values = [r["scores"][dim] for r in individual_results if dim in r["scores"]]
            aggregate_scores[dim] = round(sum(values) / len(values), 4) if values else 0.0

        pass_threshold = scoring_config.get("pass_threshold", 0.7)
        weights = scoring_config.get("weights")
        composite = self.compute_composite(aggregate_scores, weights)
        num_passed = sum(1 for r in individual_results if r["passed"])
        total = len(individual_results)

        return {
            "individual_results": individual_results,
            "aggregate_scores": aggregate_scores,
            "composite": round(composite, 4),
            "passed": composite >= pass_threshold,
            "pass_rate": round(num_passed / total, 4) if total else 0.0,
        }

    # ------------------------------------------------------------------
    # Individual scoring methods
    # ------------------------------------------------------------------

    def exact_match(self, output: str, expected: str) -> float:
        """Case-insensitive exact match. Returns 1.0 or 0.0."""
        if not expected:
            return 0.0
        # Try raw comparison first
        if output.strip() == expected.strip():
            return 1.0
        # Try normalized comparison
        if _normalize(output) == _normalize(expected):
            return 1.0
        return 0.0

    def regex_match(self, output: str, pattern: str) -> float:
        """Check if output matches regex pattern. Returns 1.0 or 0.0."""
        if not pattern:
            return 0.0
        try:
            return 1.0 if re.search(pattern, output, re.IGNORECASE | re.DOTALL) else 0.0
        except re.error as e:
            logger.warning("Invalid regex pattern '%s': %s", pattern, e)
            return 0.0

    def json_schema_validate(self, output: str, schema: dict) -> float:
        """
        Validate output is valid JSON matching the schema.
        Returns 0.0-1.0 based on field compliance (partial credit).
        """
        # Step 1: parse JSON
        try:
            data = json.loads(output)
        except json.JSONDecodeError:
            return 0.0

        if not schema:
            return 1.0  # Valid JSON, no schema to check

        # Step 2: full validation
        validator = jsonschema_lib.Draft7Validator(schema)
        errors = list(validator.iter_errors(data))
        if not errors:
            return 1.0

        # Step 3: partial credit based on required fields
        required = schema.get("required", [])
        properties = schema.get("properties", {})
        total_fields = len(required) if required else len(properties)
        if total_fields == 0:
            return 0.0

        # Count which required fields are present and individually valid
        failed_fields: set[str] = set()
        for err in errors:
            # Top-level path gives the offending field
            if err.path:
                failed_fields.add(str(err.path[0]))
            elif err.validator == "required":
                # missing required fields
                for field in err.validator_value:
                    if field not in (data if isinstance(data, dict) else {}):
                        failed_fields.add(field)

        valid_count = max(0, total_fields - len(failed_fields))
        return round(valid_count / total_fields, 4)

    async def semantic_similarity(self, output: str, reference: str) -> float:
        """Use LLM to judge semantic similarity. Returns 0.0-1.0."""
        if not reference:
            return 0.0

        prompt = (
            "Rate the semantic similarity between the following two texts on a scale from 0.0 to 1.0.\n"
            "0.0 = completely unrelated, 1.0 = identical meaning.\n\n"
            f"Text A:\n{reference}\n\n"
            f"Text B:\n{output}\n\n"
            "Respond with ONLY a single number between 0.0 and 1.0, nothing else."
        )

        try:
            response = await openrouter_client.chat_completion(
                model="openai/gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=16,
            )
            score_text = response["content"].strip()
            score = float(score_text)
            return max(0.0, min(1.0, score))
        except Exception as e:
            logger.error("Semantic similarity call failed: %s", e)
            return 0.0

    async def llm_judge(
        self,
        output: str,
        test_case: dict,
        rubric: str | None = None,
        dimensions: list[str] | None = None,
    ) -> dict:
        """Use LLM as judge to score output on multiple dimensions."""
        dims = dimensions or ["accuracy"]
        return await llm_judge.judge(output, test_case, dims, rubric=rubric)

    def compute_composite(self, scores: dict[str, float], weights: dict | None = None) -> float:
        """Compute weighted average composite score from dimension scores."""
        if not scores:
            return 0.0

        if weights:
            total_weight = 0.0
            weighted_sum = 0.0
            for dim, score in scores.items():
                w = weights.get(dim, 1.0)
                weighted_sum += score * w
                total_weight += w
            return round(weighted_sum / total_weight, 4) if total_weight else 0.0

        # Default: equal weights
        return round(sum(scores.values()) / len(scores), 4)


# Singleton instance
evaluation_engine = EvaluationEngine()
