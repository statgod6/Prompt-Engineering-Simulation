# Module 16: Evaluation and Benchmarking

## Introduction

"If you can't measure it, you can't improve it." This principle, borrowed from engineering, is the foundation of professional prompt engineering. Without rigorous evaluation, you're guessing — and guessing doesn't scale.

This module teaches you to build evaluation frameworks that measure prompt quality objectively, compare variants scientifically, and ensure your prompts perform reliably in production.

> **Tip:** The best prompt engineers spend as much time building evaluation suites as they do writing prompts. Eval is not an afterthought — it's the core of the craft.

---

## Why Evaluation Matters

### The Problem with Vibes-Based Testing

Most people evaluate prompts by running them a few times, reading the outputs, and deciding "this looks good." This approach fails because:

1. **LLMs are non-deterministic** — The same prompt can produce different outputs each run
2. **Human judgment is inconsistent** — Your assessment changes based on mood, fatigue, and expectations
3. **Edge cases are invisible** — A prompt that works on 5 test inputs may fail on the 6th
4. **Comparison is subjective** — "Prompt A feels better than Prompt B" is not actionable data

### What Rigorous Evaluation Provides

| Benefit | Description |
|---------|-------------|
| **Reproducibility** | Same test suite, same results, every time |
| **Objectivity** | Scores replace gut feelings |
| **Regression detection** | Catch when changes break existing behavior |
| **Confidence** | Deploy to production knowing exactly how your prompt performs |
| **Communication** | Show stakeholders numbers, not anecdotes |

---

## Quality Metrics for LLM Outputs

### Categorical Metrics

These measure whether the output meets binary or categorical criteria:

| Metric | What It Measures | Example |
|--------|-----------------|---------|
| **Accuracy** | Factual correctness | "Is the capital of France correctly stated as Paris?" |
| **Relevance** | Answers the actual question | "Does this response address the user's refund request?" |
| **Format compliance** | Follows structural requirements | "Is the output valid JSON with all required fields?" |
| **Safety** | No harmful or prohibited content | "Does the output avoid revealing PII?" |
| **Completeness** | All requested information present | "Does the summary cover all 5 key points?" |

### Continuous Metrics

These measure quality on a scale:

| Metric | Scale | What It Measures |
|--------|-------|-----------------|
| **Coherence** | 1-5 | Logical flow and readability |
| **Helpfulness** | 1-5 | How useful the response is to the user |
| **Conciseness** | 1-5 | Appropriate length (not too verbose, not too terse) |
| **Tone match** | 1-5 | Alignment with desired communication style |
| **Creativity** | 1-5 | Novelty and originality (when desired) |

### Automated Metrics

These can be computed programmatically:

```python
# Exact match
def exact_match(output, expected):
    return output.strip().lower() == expected.strip().lower()

# Contains required keywords
def keyword_coverage(output, required_keywords):
    found = sum(1 for kw in required_keywords if kw.lower() in output.lower())
    return found / len(required_keywords)

# JSON schema validation
def schema_compliance(output, schema):
    try:
        data = json.loads(output)
        jsonschema.validate(data, schema)
        return 1.0
    except (json.JSONDecodeError, jsonschema.ValidationError):
        return 0.0

# Length within bounds
def length_compliance(output, min_words, max_words):
    word_count = len(output.split())
    return min_words <= word_count <= max_words

# Semantic similarity (using embeddings)
def semantic_similarity(output, reference, model):
    emb_output = model.encode(output)
    emb_reference = model.encode(reference)
    return cosine_similarity(emb_output, emb_reference)
```

> **Tip:** Start with automated metrics for what can be measured programmatically (format, length, keywords), then use LLM-as-judge for subjective quality dimensions.

---

## Evaluation Dataset Design

### Principles of Good Eval Datasets

A well-designed evaluation dataset is:

1. **Representative** — Covers the full range of expected inputs
2. **Balanced** — Proportional representation of different categories
3. **Diverse** — Includes variety in length, complexity, tone, and domain
4. **Edge-case inclusive** — Deliberately tests boundary conditions
5. **Labeled** — Each case has clear expected behavior or reference output
6. **Versioned** — Tracked over time as requirements evolve

### Dataset Structure

```json
{
  "dataset_name": "product_description_eval_v2",
  "version": "2.1.0",
  "created_date": "2025-03-15",
  "categories": {
    "standard": { "count": 25, "description": "Normal product inputs" },
    "edge_case": { "count": 10, "description": "Unusual or tricky inputs" },
    "adversarial": { "count": 5, "description": "Inputs designed to cause failures" },
    "multilingual": { "count": 5, "description": "Non-English product data" },
    "minimal_info": { "count": 5, "description": "Sparse input data" }
  },
  "total_cases": 50,
  "test_cases": [...]
}
```

### Building a Balanced Dataset

Follow this distribution for a 50-case eval suite:

| Category | Percentage | Count | Examples |
|----------|-----------|-------|----------|
| Standard / Happy path | 50% | 25 | Typical product inputs with full data |
| Edge cases | 20% | 10 | Missing fields, very long text, special characters |
| Adversarial | 10% | 5 | Injection attempts, contradictory data, gibberish |
| Diversity stress tests | 10% | 5 | Multi-language, unusual categories, niche products |
| Minimal inputs | 10% | 5 | Bare minimum data to test graceful handling |

### Test Case Anatomy

Each test case should include:

```json
{
  "id": "eval-001",
  "category": "standard",
  "difficulty": "easy",
  "input": {
    "product_name": "Wireless Noise-Canceling Headphones",
    "brand": "SoundMax",
    "price": 149.99,
    "features": ["Active noise cancellation", "40hr battery", "Bluetooth 5.3"],
    "target_audience": "commuters and remote workers"
  },
  "expected_output": {
    "min_length_words": 50,
    "max_length_words": 150,
    "required_keywords": ["noise-canceling", "battery", "Bluetooth"],
    "required_sections": ["headline", "description", "key_features"],
    "tone": "professional, enthusiastic",
    "format": "markdown"
  },
  "reference_output": "## SoundMax Wireless Noise-Canceling Headphones\n\nEscape the noise...",
  "scoring_rubric": {
    "accuracy": "All product details correctly represented",
    "completeness": "Headline, description, and features all present",
    "persuasiveness": "Compelling language targeting commuters/remote workers",
    "format": "Valid markdown with proper heading hierarchy"
  }
}
```

---

## A/B Testing Prompts

### The Scientific Approach

A/B testing prompts follows the same methodology as A/B testing in product development:

1. **Hypothesis**: "Adding few-shot examples will improve output quality by 15%"
2. **Control**: Current prompt (Variant A)
3. **Treatment**: Modified prompt (Variant B)
4. **Metric**: Quality score from eval suite
5. **Sample size**: Run both variants against the full eval dataset
6. **Analysis**: Statistical comparison of results

### A/B Testing Workflow

```
Step 1: Define your evaluation metric(s)
Step 2: Establish baseline — run Variant A against eval suite
Step 3: Create Variant B with one specific change
Step 4: Run Variant B against the SAME eval suite
Step 5: Compare results with statistical tests
Step 6: If significant improvement, adopt Variant B as new baseline
Step 7: Repeat with next hypothesis
```

> **Tip:** Only change ONE thing between variants. If you change the persona AND the examples AND the format instructions simultaneously, you won't know which change caused the improvement.

### Example A/B Test

```
Variant A (baseline):
"Write a product description for the following item."

Variant B (with format instructions):
"Write a product description for the following item.
Format: Start with a catchy headline, then 2-3 sentences of description,
then a bullet list of key features."

Variant C (with persona + format):
"You are an expert e-commerce copywriter with 10 years of experience.
Write a product description for the following item.
Format: Start with a catchy headline, then 2-3 sentences of description,
then a bullet list of key features."
```

**Results (hypothetical):**

| Metric | Variant A | Variant B | Variant C |
|--------|-----------|-----------|-----------|
| Format compliance | 45% | 89% | 92% |
| Persuasiveness (1-5) | 3.2 | 3.4 | 4.1 |
| Accuracy | 91% | 90% | 93% |
| Avg. word count | 87 | 102 | 118 |
| **Overall score** | **0.62** | **0.74** | **0.83** |

Conclusion: Variant C is the winner. The persona added persuasive quality on top of format compliance.

---

## LLM-as-Judge Methodology

### What Is LLM-as-Judge?

LLM-as-judge uses a language model to evaluate the output of another language model (or the same model). It's like hiring a senior reviewer to grade junior work.

### Why Use LLM-as-Judge?

| Method | Pros | Cons |
|--------|------|------|
| Human evaluation | Gold standard accuracy | Expensive, slow, inconsistent |
| Automated metrics | Fast, cheap, consistent | Limited to surface-level quality |
| **LLM-as-judge** | **Fast, nuanced, scalable** | **Requires careful calibration** |

### Building a Judge Prompt

```markdown
You are an expert evaluator assessing the quality of AI-generated
product descriptions. Rate the following output on each dimension
using a 1-5 scale.

## Evaluation Criteria

### Accuracy (1-5)
1: Contains factual errors or fabricated details
2: Mostly accurate with minor errors
3: Accurate but generic
4: Accurate with good product-specific details
5: Perfectly accurate, highlights unique selling points

### Format Compliance (1-5)
1: No recognizable structure
2: Partial structure, missing required sections
3: Has structure but doesn't match specification
4: Follows format with minor deviations
5: Perfectly matches the required format

### Persuasiveness (1-5)
1: Dry, reads like a spec sheet
2: Slightly engaging but mostly factual
3: Moderately persuasive
4: Compelling with good call-to-action
5: Highly persuasive, creates desire to purchase

## Input
{input}

## Output to Evaluate
{output}

## Reference Output (for comparison)
{reference}

Respond in this exact JSON format:
{
  "accuracy": { "score": <1-5>, "reasoning": "<brief explanation>" },
  "format_compliance": { "score": <1-5>, "reasoning": "<brief explanation>" },
  "persuasiveness": { "score": <1-5>, "reasoning": "<brief explanation>" },
  "overall_score": <weighted average>,
  "pass": <true/false based on threshold>
}
```

### Calibrating the Judge

The judge model needs calibration to ensure consistent scoring:

1. **Create anchor examples**: Write outputs that represent each score level (1-5)
2. **Test inter-rater reliability**: Run the same eval 10 times and check score consistency
3. **Compare with human judgment**: Have humans rate 20 cases, compare with LLM scores
4. **Adjust rubric wording**: Tighten criteria if scores are too generous or too harsh

```python
# Check judge consistency
scores = []
for _ in range(10):
    score = run_judge(test_input, test_output)
    scores.append(score)

mean_score = statistics.mean(scores)
std_dev = statistics.stdev(scores)
print(f"Mean: {mean_score:.2f}, StdDev: {std_dev:.2f}")
# Target: StdDev < 0.3 for a reliable judge
```

> **Tip:** Use a stronger model as judge than the model being evaluated. If you're evaluating GPT-4o outputs, use Claude 3.5 Sonnet as judge (or vice versa) to reduce self-evaluation bias.

---

## Building Evaluation Suites

### Eval Suite Architecture

```
eval_suite/
├── config.json          # Suite metadata and scoring weights
├── datasets/
│   ├── standard.json    # Standard test cases
│   ├── edge_cases.json  # Edge case test cases
│   └── adversarial.json # Adversarial test cases
├── rubrics/
│   ├── accuracy.md      # Scoring rubric for accuracy
│   ├── format.md        # Scoring rubric for format
│   └── tone.md          # Scoring rubric for tone
├── baselines/
│   ├── variant_a.json   # Baseline scores for reference
│   └── variant_b.json   # Comparison scores
└── reports/
    └── 2025-03-15.json  # Evaluation run results
```

### Running an Evaluation

```python
def run_evaluation(prompt_variant, eval_suite, judge_model):
    results = []

    for test_case in eval_suite["test_cases"]:
        # Step 1: Generate output using the prompt variant
        output = generate(
            model=test_case.get("model", "gpt-4o"),
            system_prompt=prompt_variant,
            user_input=test_case["input"]
        )

        # Step 2: Run automated checks
        auto_scores = {
            "format_valid": check_format(output, test_case["expected_format"]),
            "length_ok": check_length(output, test_case["min_words"], test_case["max_words"]),
            "keywords_present": check_keywords(output, test_case["required_keywords"])
        }

        # Step 3: Run LLM judge
        judge_scores = run_judge(
            model=judge_model,
            input_data=test_case["input"],
            output=output,
            reference=test_case.get("reference_output"),
            rubric=eval_suite["rubric"]
        )

        # Step 4: Combine scores
        results.append({
            "test_case_id": test_case["id"],
            "output": output,
            "auto_scores": auto_scores,
            "judge_scores": judge_scores,
            "pass": judge_scores["overall_score"] >= eval_suite["pass_threshold"]
        })

    return aggregate_results(results)
```

### Aggregating Results

```python
def aggregate_results(results):
    total = len(results)
    passed = sum(1 for r in results if r["pass"])

    dimension_scores = {}
    for dim in ["accuracy", "format_compliance", "persuasiveness"]:
        scores = [r["judge_scores"][dim]["score"] for r in results]
        dimension_scores[dim] = {
            "mean": statistics.mean(scores),
            "median": statistics.median(scores),
            "std_dev": statistics.stdev(scores),
            "min": min(scores),
            "max": max(scores)
        }

    return {
        "pass_rate": passed / total,
        "total_cases": total,
        "passed": passed,
        "failed": total - passed,
        "dimension_scores": dimension_scores,
        "timestamp": datetime.now().isoformat()
    }
```

---

## Statistical Significance

### Why Statistics Matter

Running Prompt A and Prompt B each once and comparing scores is meaningless. You need statistical rigor to know if a difference is real or just noise.

### Key Concepts

| Concept | Definition | In Prompt Evaluation Context |
|---------|-----------|------------------------------|
| **P-value** | Probability of seeing results this extreme by chance | P < 0.05 means the improvement is likely real |
| **Confidence interval** | Range where the true score likely falls | "Accuracy is 0.85 ± 0.03 (95% CI)" |
| **Effect size** | Magnitude of the difference | "Prompt B scores 0.12 higher on average" |
| **Sample size** | Number of test cases | More cases = more reliable results |
| **Power** | Ability to detect a real difference | Need enough test cases to detect small improvements |

### Minimum Sample Sizes

| Desired Detectable Difference | Recommended Min. Cases |
|-------------------------------|----------------------|
| Large (>20% improvement) | 20 test cases |
| Medium (10-20% improvement) | 50 test cases |
| Small (5-10% improvement) | 100 test cases |
| Tiny (<5% improvement) | 200+ test cases |

### Running Statistical Tests

```python
from scipy import stats

# Paired t-test: Compare two prompt variants on the same test cases
def compare_variants(scores_a, scores_b):
    t_stat, p_value = stats.ttest_rel(scores_a, scores_b)

    mean_diff = statistics.mean(scores_b) - statistics.mean(scores_a)
    pooled_std = statistics.stdev([b - a for a, b in zip(scores_a, scores_b)])
    cohens_d = mean_diff / pooled_std if pooled_std > 0 else 0

    return {
        "mean_a": statistics.mean(scores_a),
        "mean_b": statistics.mean(scores_b),
        "mean_difference": mean_diff,
        "t_statistic": t_stat,
        "p_value": p_value,
        "significant": p_value < 0.05,
        "effect_size_cohens_d": cohens_d,
        "interpretation": interpret_effect_size(cohens_d)
    }

def interpret_effect_size(d):
    if abs(d) < 0.2: return "negligible"
    elif abs(d) < 0.5: return "small"
    elif abs(d) < 0.8: return "medium"
    else: return "large"
```

> **Tip:** Always use a paired test (like paired t-test or Wilcoxon signed-rank) when comparing prompts on the same test cases. This accounts for case-specific difficulty.

---

## Common Evaluation Pitfalls

### 1. Teaching to the Test
**Problem:** Optimizing the prompt to score well on the eval suite without generalizing.
**Solution:** Hold out 20% of cases as a validation set. Never optimize against the validation set.

### 2. Judge Bias
**Problem:** The LLM judge systematically favors certain styles or lengths.
**Solution:** Calibrate with human ratings. Rotate judge models. Use blind evaluation (judge doesn't know which variant it's scoring).

### 3. Metric Gaming
**Problem:** The prompt generates outputs that technically satisfy metrics but aren't actually good.
**Solution:** Include holistic quality dimensions alongside specific metrics. Have humans spot-check high-scoring outputs.

### 4. Insufficient Diversity
**Problem:** The eval suite only tests easy cases, giving inflated scores.
**Solution:** Deliberately include adversarial, edge, and minimal-input cases. Track performance by category.

### 5. Ignoring Variance
**Problem:** Reporting only average scores hides inconsistency.
**Solution:** Always report standard deviation. A prompt scoring 4.0 ± 0.3 is better than one scoring 4.2 ± 1.1.

---

## Summary

| Concept | Key Takeaway |
|---------|-------------|
| Quality metrics | Combine automated checks (format, length) with LLM-as-judge (quality, tone) |
| Eval dataset design | Balance coverage: 50% standard, 20% edge, 10% adversarial, 20% diversity |
| A/B testing | Change one variable at a time, measure against the same eval suite |
| LLM-as-judge | Build detailed rubrics, calibrate with human ratings, use stronger judge models |
| Statistical significance | Use paired tests, report p-values AND effect sizes, ensure sufficient sample size |
| Eval suites | Version control, automate runs, track regressions over time |

---

## What's Next

In the simulation, you'll design a 50-case evaluation suite for a product description generator, create scoring rubrics, and benchmark three prompt variants against your suite.
