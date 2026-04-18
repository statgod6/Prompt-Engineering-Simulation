# Module 10: Self-Consistency & Multi-Completion Verification

## Introduction

What if you could get **three second opinions** every time you asked a question—and then pick the best one? That's the core idea behind **self-consistency**, one of the most powerful yet underused techniques in prompt engineering.

Traditional prompting follows a single path: one prompt → one response. But language models are stochastic—the same prompt at non-zero temperature can produce different answers each time. Self-consistency exploits this property by **generating multiple completions and aggregating them** to arrive at a more reliable result.

This module covers:

- Why single-shot answers are unreliable for complex tasks
- The generate-then-verify paradigm
- Self-consistency sampling and majority voting
- Temperature diversity for exploration
- Verification prompts that evaluate candidate answers
- When (and when not) to use multiple completions

---

## The Problem with Single-Shot Prompting

When you send a prompt and accept the first response, you're rolling a single die. For simple factual lookups, that's often fine. But for tasks involving reasoning, math, code generation, or nuanced analysis, a single completion can:

1. **Choose the wrong reasoning path** and commit to it
2. **Make arithmetic or logical errors** that compound
3. **Hallucinate** with total confidence
4. **Miss edge cases** that a different reasoning trace would catch

> **Tip:** Think of single-shot prompting like asking one person for directions. Self-consistency is like asking three people and going with the majority.

### A Concrete Example

**Question:** "If a store has a 25% off sale, and you have a 10% coupon applied after the sale price, what do you pay on a $80 item?"

A single completion might:
- Correctly compute: $80 × 0.75 = $60, then $60 × 0.90 = **$54** ✓
- Incorrectly add discounts: $80 × 0.65 = **$52** ✗
- Reverse the order: $80 × 0.90 = $72, then $72 × 0.75 = **$54** ✓ (same answer, different path)

With three completions, you'd likely see $54 appear twice and $52 once—majority vote gives the correct answer.

---

## Generate-Then-Verify: The Core Pattern

The **generate-then-verify** pattern separates answer creation from answer evaluation:

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Generate    │ ──▶ │  Verify     │ ──▶ │  Select      │
│  N answers   │     │  each one   │     │  best answer │
└─────────────┘     └─────────────┘     └──────────────┘
```

### Step 1: Generate Multiple Candidates

Send the same prompt N times (typically 3-5) with moderate temperature:

```
Prompt: "Solve this step by step: [problem]"
Temperature: 0.7-0.9
N completions: 3-5
```

### Step 2: Verify Each Candidate

Use a separate prompt (or the same model) to evaluate each response:

```
Prompt: "Here are three proposed answers to [problem].
Evaluate each for correctness, then select the best one.

Answer A: [completion_1]
Answer B: [completion_2]
Answer C: [completion_3]

Which answer is correct and why?"
Temperature: 0.0-0.2 (low, for deterministic evaluation)
```

### Step 3: Select the Final Answer

Choose based on:
- **Majority vote** (most common answer)
- **Verifier selection** (the verification prompt picks the best)
- **Confidence weighting** (factor in model confidence if available)

---

## Self-Consistency Sampling

Self-consistency, introduced by Wang et al. (2022), is a specific implementation of generate-then-verify for **chain-of-thought reasoning**:

1. Prompt the model with a chain-of-thought example
2. Sample multiple reasoning paths at temperature > 0
3. Extract the final answer from each path
4. Take the **majority vote** across all final answers

### Why It Works

Different reasoning paths can lead to different (and sometimes wrong) conclusions. But correct reasoning paths tend to converge on the same answer, while incorrect paths diverge randomly. By voting, the correct answer gets reinforced while errors cancel out.

### Pseudocode

```python
def self_consistency(prompt, n_samples=5, temperature=0.7):
    """
    Generate multiple chain-of-thought responses and
    return the most common final answer.
    """
    answers = []

    for i in range(n_samples):
        response = llm.complete(
            prompt=prompt,
            temperature=temperature,
            max_tokens=1024
        )
        # Extract just the final answer from the reasoning chain
        final_answer = extract_answer(response)
        answers.append(final_answer)

    # Majority vote
    answer_counts = Counter(answers)
    best_answer = answer_counts.most_common(1)[0][0]

    return best_answer, answer_counts
```

### When Self-Consistency Shines

| Task Type | Single-Shot Accuracy | Self-Consistency (5 samples) | Improvement |
|-----------|---------------------|------------------------------|-------------|
| Arithmetic word problems | ~72% | ~86% | +14% |
| Multi-step reasoning | ~65% | ~81% | +16% |
| Commonsense QA | ~78% | ~85% | +7% |
| Code debugging | ~58% | ~74% | +16% |

> **Tip:** Self-consistency provides the biggest gains on tasks where **reasoning is required** but the final answer is **verifiable** (math, logic, code output).

---

## Majority Voting: The Simplest Aggregation

Majority voting is the most common aggregation strategy. After generating N completions, count how often each unique answer appears and pick the most frequent one.

### Implementation Details

```python
from collections import Counter

def majority_vote(answers):
    """
    Simple majority voting across candidate answers.
    Returns the most common answer and confidence score.
    """
    if not answers:
        raise ValueError("No answers to vote on")

    counter = Counter(answers)
    total = len(answers)

    # Most common answer
    winner, count = counter.most_common(1)[0]
    confidence = count / total

    return {
        "answer": winner,
        "confidence": confidence,
        "vote_distribution": dict(counter),
        "unanimous": len(counter) == 1
    }
```

### Handling Ties

When two answers have equal votes:

1. **Use the verification prompt** as a tiebreaker
2. **Increase N** and regenerate
3. **Lower temperature** for an additional "deciding vote"
4. **Default to the first occurrence** (simplest, least reliable)

### Normalized Matching

Raw string comparison often fails. "42", "42.0", "The answer is 42", and "forty-two" are all the same answer. Normalize before voting:

```python
def normalize_answer(answer):
    """Normalize an answer for comparison."""
    answer = answer.strip().lower()
    # Remove common prefixes
    for prefix in ["the answer is", "result:", "answer:"]:
        if answer.startswith(prefix):
            answer = answer[len(prefix):].strip()
    # Try numeric normalization
    try:
        return str(float(answer))
    except ValueError:
        return answer
```

---

## Temperature Diversity for Exploration

Temperature controls how "creative" or "random" the model's outputs are:

| Temperature | Behavior | Use Case |
|-------------|----------|----------|
| 0.0 | Deterministic, always picks the highest-probability token | Factual lookups, evaluation |
| 0.3-0.5 | Slightly varied, mostly predictable | Light exploration |
| 0.7-0.9 | Diverse reasoning paths, different approaches | Self-consistency sampling |
| 1.0+ | Highly random, may produce incoherent outputs | Creative brainstorming only |

### The Sweet Spot: 0.7-0.9

For self-consistency, you want enough diversity to explore different reasoning paths **without** degrading quality. Research suggests:

- **Temperature 0.7**: Good for math and logic (paths differ but stay coherent)
- **Temperature 0.8**: Good general-purpose diversity
- **Temperature 0.9**: Good for creative or open-ended tasks

### Mixed Temperature Strategy

An advanced technique uses **different temperatures** for different samples:

```python
def diverse_sampling(prompt, temperatures=[0.5, 0.7, 0.9, 0.7, 0.5]):
    """
    Sample with varied temperatures for maximum path diversity
    while keeping some samples more grounded.
    """
    responses = []
    for temp in temperatures:
        response = llm.complete(prompt=prompt, temperature=temp)
        responses.append(response)
    return responses
```

This ensures you get some "safe" completions (low temp) alongside more exploratory ones (high temp).

---

## Verification Prompts

A **verification prompt** is a separate prompt that evaluates candidate answers. Instead of just counting votes, you ask the model to **reason about which answer is correct**.

### Basic Verification Prompt

```markdown
You are a careful evaluator. Below are three candidate answers to a question.

**Question:** {question}

**Answer A:** {answer_1}
**Answer B:** {answer_2}
**Answer C:** {answer_3}

For each answer:
1. Check the reasoning step by step
2. Identify any errors or assumptions
3. Rate confidence (high/medium/low)

Then select the best answer and explain why.

**Best answer:**
```

### Structured Verification

For more rigorous evaluation, ask for structured output:

```markdown
Evaluate these candidate answers. For each, output JSON:

{
  "evaluation": [
    {
      "answer_id": "A",
      "reasoning_valid": true/false,
      "errors_found": ["list of errors"],
      "confidence": 0.0-1.0
    }
  ],
  "best_answer": "A/B/C",
  "explanation": "why this answer is best"
}
```

### Self-Verification vs. Cross-Verification

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| Self-verification | Same model verifies its own outputs | Simple, no extra setup | May repeat its own biases |
| Cross-verification | Different model verifies | Catches model-specific errors | Slower, more expensive |
| Human-in-the-loop | Human verifies when confidence is low | Most reliable | Doesn't scale |

> **Tip:** Use self-verification as a first pass. If confidence is low (close vote or verifier is uncertain), escalate to cross-verification or human review.

---

## Building a Complete Pipeline

Here's how to build a full self-consistency pipeline:

### Architecture

```
User Question
      │
      ▼
┌─────────────────┐
│ Step 1: Generate │  (temperature=0.8, n=3)
│ 3 CoT responses │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 2: Verify   │  (temperature=0.0)
│ Pick best answer │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 3: Compare  │
│ Against ground   │
│ truth (if avail) │
└────────┬────────┘
         │
         ▼
   Final Answer
   + Confidence
```

### Full Implementation

```python
import json
from collections import Counter

class SelfConsistencyPipeline:
    def __init__(self, client, model="openai/gpt-4o"):
        self.client = client
        self.model = model

    def generate_candidates(self, question, n=3, temperature=0.8):
        """Step 1: Generate N candidate answers."""
        prompt = f"""Solve this problem step by step.
Show your complete reasoning, then provide a final answer.

Question: {question}

Think through this carefully:"""

        candidates = []
        for _ in range(n):
            response = self.client.complete(
                model=self.model,
                prompt=prompt,
                temperature=temperature,
                max_tokens=1024
            )
            candidates.append(response)
        return candidates

    def verify_and_select(self, question, candidates):
        """Step 2: Verify candidates and select the best."""
        candidate_text = "\n\n".join(
            f"--- Candidate {i+1} ---\n{c}"
            for i, c in enumerate(candidates)
        )

        prompt = f"""You are a careful evaluator. Review these candidate
answers to the question below.

Question: {question}

{candidate_text}

For each candidate:
1. Check the reasoning for errors
2. Verify any calculations
3. Assess overall correctness

Then select the BEST answer. Output JSON:
{{
  "best_candidate": <number>,
  "final_answer": "<the correct answer>",
  "confidence": <0.0-1.0>,
  "reasoning": "<why you chose this>"
}}"""

        response = self.client.complete(
            model=self.model,
            prompt=prompt,
            temperature=0.0,
            max_tokens=512
        )
        return json.loads(response)

    def compare_to_ground_truth(self, selected, ground_truth):
        """Step 3: Compare selected answer to ground truth."""
        return {
            "selected_answer": selected["final_answer"],
            "ground_truth": ground_truth,
            "match": normalize(selected["final_answer"]) == normalize(ground_truth),
            "confidence": selected["confidence"]
        }

    def run(self, question, ground_truth=None):
        """Run the full pipeline."""
        candidates = self.generate_candidates(question)
        selection = self.verify_and_select(question, candidates)

        result = {
            "question": question,
            "candidates": candidates,
            "selection": selection
        }

        if ground_truth:
            result["evaluation"] = self.compare_to_ground_truth(
                selection, ground_truth
            )

        return result
```

---

## When to Use Self-Consistency (and When Not To)

### Use Self-Consistency When:

- **Tasks have verifiable answers** (math, logic, code output, factual questions)
- **Reasoning is required** (multi-step problems where errors compound)
- **Stakes are high** (the cost of a wrong answer outweighs the cost of extra API calls)
- **You need confidence estimates** (the vote distribution tells you how sure the model is)
- **Single-shot performance is below your threshold** (try single-shot first!)

### Don't Use Self-Consistency When:

- **Tasks are purely creative** (there's no "correct" answer to vote on)
- **Latency is critical** (N completions take N times as long, unless parallelized)
- **Cost is a hard constraint** (3-5× the API cost per question)
- **The task is trivial** (simple lookups don't benefit from multiple samples)
- **Temperature 0 already gives consistent results** (no diversity = no benefit)

### Cost-Benefit Analysis

| Approach | API Calls | Latency | Accuracy Gain |
|----------|-----------|---------|---------------|
| Single-shot (temp=0) | 1 | Fast | Baseline |
| Self-consistency (N=3) | 3-4 | 3-4× | +8-15% |
| Self-consistency (N=5) | 5-6 | 5-6× | +10-18% |
| Self-consistency (N=10) | 10-11 | 10-11× | +12-20% (diminishing) |

> **Tip:** N=3 with verification provides the best cost/accuracy tradeoff for most tasks. Going beyond N=5 shows diminishing returns.

---

## Advanced Techniques

### Weighted Voting

Instead of equal votes, weight each answer by the model's confidence:

```python
def weighted_vote(candidates_with_confidence):
    """
    Weight votes by model confidence.
    Input: list of (answer, confidence) tuples
    """
    scores = {}
    for answer, confidence in candidates_with_confidence:
        normalized = normalize_answer(answer)
        scores[normalized] = scores.get(normalized, 0) + confidence

    best = max(scores, key=scores.get)
    return best, scores
```

### Cascading Consistency

Start with N=3. If the vote is unanimous, accept. If not, generate more samples:

```python
def cascading_consistency(prompt, max_rounds=3):
    """Adaptive sampling — generate more only when needed."""
    all_answers = []

    for round_num in range(max_rounds):
        new_answers = generate_n(prompt, n=3, temperature=0.8)
        all_answers.extend(new_answers)

        vote_result = majority_vote(all_answers)

        # If confidence is high enough, stop early
        if vote_result["confidence"] >= 0.7:
            return vote_result

    # Return best we have after all rounds
    return majority_vote(all_answers)
```

### Domain-Specific Verification

For specialized domains, add domain-specific checks:

```python
# Math: verify by re-computing
# Code: verify by executing
# Facts: verify against known databases
# Logic: verify by checking each inference step

DOMAIN_VERIFIERS = {
    "math": verify_math_answer,
    "code": execute_and_check,
    "logic": check_inference_chain,
    "factual": lookup_knowledge_base,
}
```

---

## Common Pitfalls

### 1. Not Normalizing Answers Before Voting

"42", "42.0", and "The answer is 42" should all be counted as the same vote.

### 2. Using Temperature 0 for Sampling

Temperature 0 is deterministic—you'll get the same answer N times. Always use temperature ≥ 0.5 for the generation step.

### 3. Too Few Samples

N=2 gives you a coin flip on disagreement. Use at least N=3 for meaningful voting.

### 4. Ignoring the Vote Distribution

A 3-0 unanimous vote is much more reliable than a 2-1 split. Use the distribution as a confidence signal.

### 5. Applying Self-Consistency to Creative Tasks

There's no "correct" poem. Self-consistency only helps when answers can be objectively compared.

---

## Summary

| Concept | Key Takeaway |
|---------|--------------|
| Self-consistency | Sample multiple reasoning paths, vote on the final answer |
| Majority voting | Simplest aggregation—count occurrences, pick the most common |
| Temperature diversity | Use 0.7-0.9 for sampling, 0.0 for verification |
| Verification prompts | Separate prompt that evaluates and selects the best candidate |
| Generate-then-verify | Two-stage pipeline: create candidates, then evaluate them |
| Cost tradeoff | N=3 with verification is the sweet spot for most tasks |

> **Key Insight:** Self-consistency transforms a probabilistic system into a more deterministic one by leveraging the law of large numbers. Correct answers cluster; errors scatter.

---

## What's Next?

In the simulation for this module, you'll build a complete 3-step self-consistency pipeline: generate multiple answers, write a verification prompt to pick the best one, and measure accuracy against ground truth. You'll see firsthand how multi-completion verification outperforms single-shot prompting on reasoning tasks.
