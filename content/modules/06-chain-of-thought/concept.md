# Module 6: Chain-of-Thought Prompting

## Introduction

When you ask an LLM "What is 247 × 18?", it might get it wrong. But when you ask it to **think step by step**, accuracy jumps dramatically. This isn't magic — it's **Chain-of-Thought (CoT) prompting**, one of the most important techniques in modern prompt engineering.

CoT works because it forces the model to allocate computation to intermediate reasoning steps rather than jumping directly to an answer. This module covers when, how, and why to use it — and critically, when it doesn't help.

---

## What Is Chain-of-Thought?

Chain-of-Thought prompting is a technique where you instruct the model to **show its reasoning process** before arriving at a final answer. Instead of producing just the answer, the model generates a sequence of logical steps.

### Without CoT (Direct Prompting)

```
Q: A store has 45 apples. They sell 18 in the morning and receive a shipment
of 30 in the afternoon. How many apples do they have at the end of the day?

A: 57
```

### With CoT

```
Q: A store has 45 apples. They sell 18 in the morning and receive a shipment
of 30 in the afternoon. How many apples do they have at the end of the day?

A: Let me work through this step by step.
1. Start: 45 apples
2. After morning sales: 45 - 18 = 27 apples
3. After afternoon shipment: 27 + 30 = 57 apples

The store has 57 apples at the end of the day.
```

Both arrive at 57, but the CoT version is **verifiable** — you can check each step. For harder problems, the CoT version is also more likely to be correct.

---

## The Magic Phrase: "Let's Think Step by Step"

The seminal paper by Kojima et al. (2022) showed that simply appending **"Let's think step by step"** to a prompt dramatically improved reasoning performance across multiple benchmarks.

### Zero-Shot CoT

This is the simplest form — no examples needed, just the instruction to reason:

```
Q: If a train travels at 60 mph for 2.5 hours, then at 80 mph for 1.5 hours,
what is the total distance traveled?

Let's think step by step.
```

**Model output:**
```
Step 1: Calculate distance at 60 mph
Distance = Speed × Time = 60 × 2.5 = 150 miles

Step 2: Calculate distance at 80 mph
Distance = Speed × Time = 80 × 1.5 = 120 miles

Step 3: Calculate total distance
Total = 150 + 120 = 270 miles

The total distance traveled is 270 miles.
```

### Variations of the Trigger Phrase

Different phrasings work, with slightly different effects:

| Phrase | Effect |
|--------|--------|
| "Let's think step by step" | General-purpose, widely effective |
| "Think through this carefully" | Slightly more deliberate |
| "Walk me through your reasoning" | More conversational, detailed |
| "Break this down into steps" | Emphasizes decomposition |
| "Show your work" | Math-focused, familiar framing |
| "Reason about this before answering" | Encourages deeper analysis |
| "First, let's analyze the problem" | Starts with problem understanding |

> **Tip:** "Let's think step by step" remains the most studied and reliably effective trigger phrase. When in doubt, use it.

---

## Few-Shot CoT

While zero-shot CoT just adds a reasoning instruction, **few-shot CoT** provides complete examples of reasoning chains:

```
Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls.
Each can has 3 tennis balls. How many tennis balls does he have now?
A: Roger started with 5 balls. He bought 2 cans of 3 balls each,
so 2 × 3 = 6 new balls. Total: 5 + 6 = 11 tennis balls.

Q: The cafeteria had 23 apples. If they used 20 to make lunch and
bought 6 more, how many apples do they have?
A: The cafeteria started with 23 apples. They used 20, leaving
23 - 20 = 3 apples. Then they bought 6 more: 3 + 6 = 9 apples.

Q: A farmer has 3 fields. Each field has 12 rows of corn, and each
row has 8 stalks. How many corn stalks does the farmer have total?
A:
```

The model learns the **pattern of reasoning** from the examples and applies it to the new question.

### Zero-Shot vs Few-Shot CoT: When to Use Which

| Scenario | Use Zero-Shot CoT | Use Few-Shot CoT |
|----------|-------------------|------------------|
| Quick prototyping | Yes | No |
| Complex multi-step math | Maybe | Yes |
| Domain-specific reasoning | No | Yes |
| Token budget is tight | Yes | No |
| Consistent output format needed | No | Yes |
| Novel problem types | Yes | No |

---

## When CoT Helps

CoT is most effective for tasks that require **multi-step reasoning**:

### 1. Arithmetic Word Problems

```
Without CoT: "There are 15 cars in a parking lot. 6 more arrive and then
3 leave. How many are there?" → Often correct (simple)

With CoT benefit: "A factory produces 1,247 widgets per day. On Monday,
they had 3,891 in stock. By Friday, they shipped 4,520 and produced for
4 full days. How many do they have?" → CoT significantly improves accuracy
```

### 2. Logic Puzzles

```
All bloops are razzles. All razzles are lazzles.
Are all bloops lazzles?

Without CoT: "Yes" (might be right, but reasoning is opaque)
With CoT:
- All bloops are razzles (given)
- All razzles are lazzles (given)
- Since all bloops are razzles, and all razzles are lazzles...
- Therefore all bloops are lazzles. Yes.
```

### 3. Multi-Step Reasoning

```
Is the following argument valid?

Premise 1: If it rains, the ground gets wet.
Premise 2: The ground is wet.
Conclusion: It rained.

With CoT, the model correctly identifies this as the "affirming the consequent"
fallacy — the ground could be wet from a sprinkler.
```

### 4. Code Debugging

```
What's wrong with this code?

def factorial(n):
    if n == 0:
        return 0
    return n * factorial(n-1)

With CoT: "Let me trace through factorial(3):
- factorial(3) = 3 × factorial(2)
- factorial(2) = 2 × factorial(1)
- factorial(1) = 1 × factorial(0)
- factorial(0) = 0 ← This is wrong! Should return 1.
- So factorial(1) = 1 × 0 = 0, and everything cascades to 0.
The base case should return 1, not 0."
```

### 5. Planning and Strategy

```
You have 3 tasks: A takes 2 hours, B takes 4 hours (depends on A),
C takes 1 hour (independent). How should you schedule them to minimize
total time?

CoT helps the model reason about dependencies and parallelism:
- C is independent → start immediately
- A must finish before B → A then B = 6 hours
- C runs parallel to A → total = max(1, 2+4) = 6 hours
```

---

## When CoT Doesn't Help (or Hurts)

CoT is **not universally beneficial**. It can actually degrade performance in certain cases:

### 1. Simple Factual Recall

```
❌ CoT adds nothing:
"What is the capital of France? Let's think step by step."
→ Wastes tokens, doesn't improve accuracy
```

### 2. Tasks Requiring Intuition Over Logic

```
❌ CoT can hurt:
"Write a haiku about autumn."
→ Forcing step-by-step reasoning makes the output feel mechanical
```

### 3. Pattern Recognition Tasks

```
❌ CoT adds noise:
"Is this email spam or not spam?"
→ Simple classification doesn't benefit from lengthy reasoning
```

### 4. Very Easy Problems

```
❌ Overthinking:
"What is 2 + 3? Let's think step by step."
→ The model might add unnecessary complexity and even make errors
```

### 5. Latency-Sensitive Applications

CoT generates **significantly more tokens** than direct answers. If you're building a real-time system (e.g., autocomplete, chatbot), CoT adds latency:

| Approach | Typical Output Tokens | Latency |
|----------|----------------------|---------|
| Direct answer | 5-20 tokens | Fast |
| Zero-shot CoT | 50-200 tokens | 3-10x slower |
| Few-shot CoT | 100-500 tokens | 5-20x slower |

> **Tip:** If you need CoT reasoning but fast responses, consider a two-pass approach: use CoT in a background call and stream just the final answer to the user.

---

## Reasoning Traces

The intermediate steps in CoT are called **reasoning traces**. They're valuable beyond just accuracy:

### Debugging
When the model gets a wrong answer, the trace shows you **where** the reasoning went wrong:

```
Q: A store offers 20% off a $50 item, then an additional 10% off
the sale price. What's the final price?

Trace:
1. Original price: $50
2. 20% off: $50 × 0.20 = $10 discount → $40
3. Additional 10% off: $50 × 0.10 = $5 discount → $35  ← ERROR HERE
   (Should be 10% of $40, not $50)
```

### Auditability
In regulated industries, you need to show **why** a decision was made. CoT provides an audit trail.

### Teaching
CoT traces help students understand not just the answer but the **method**. This makes CoT-enhanced LLMs powerful tutoring tools.

---

## Self-Consistency with CoT

**Self-consistency** (Wang et al., 2022) is an advanced technique that combines CoT with majority voting:

1. Generate **multiple** CoT reasoning paths for the same question (using temperature > 0)
2. Extract the final answer from each path
3. Take the **majority vote** as the final answer

### Example

```
Problem: "If a shirt costs $25 and is marked down by 15%, then taxed at 8%,
what's the final price?"

Path 1: $25 × 0.85 = $21.25 → $21.25 × 1.08 = $22.95 ✓
Path 2: $25 - $3.75 = $21.25 → $21.25 + $1.70 = $22.95 ✓
Path 3: $25 × 0.85 = $21.25 → $21.25 × 0.08 = $1.70 → $22.95 ✓
Path 4: $25 - 15% = $21.25 → + 8% tax = $22.95 ✓
Path 5: $25 × (1 - 0.15) × (1 + 0.08) = $22.95 ✓

Majority answer: $22.95 (5/5 consensus → high confidence)
```

When paths disagree, the majority vote is **far more reliable** than any single path.

### Implementation Pattern

```python
import openai

def self_consistent_cot(question, n_paths=5, temperature=0.7):
    """Generate multiple CoT paths and return majority answer."""
    answers = []
    for _ in range(n_paths):
        response = openai.chat.completions.create(
            model="gpt-4o",
            temperature=temperature,
            messages=[
                {"role": "system", "content": "Solve the problem step by step. "
                 "End with 'ANSWER: <your answer>'"},
                {"role": "user", "content": question}
            ]
        )
        # Extract answer after "ANSWER:"
        text = response.choices[0].message.content
        answer = text.split("ANSWER:")[-1].strip()
        answers.append(answer)

    # Return majority vote
    from collections import Counter
    return Counter(answers).most_common(1)[0][0]
```

---

## Advanced CoT Patterns

### Tree of Thought (ToT)

Instead of a single linear chain, explore **multiple reasoning branches** at each step and evaluate which branch is most promising:

```
Problem: "Find a path in a maze"

Step 1: Three possible first moves → Go right, Go down, Go left
  - Evaluate each: Right hits a wall ✗, Down opens up ✓, Left is backwards ✗
Step 2: From "Down" — two options → Continue down, Go right
  - Evaluate each: Down is dead end ✗, Right opens up ✓
...
```

### Structured CoT with Labels

For consistent output, label each step:

```
UNDERSTANDING: [restate the problem]
APPROACH: [describe the method]
STEP 1: [first calculation/reasoning]
STEP 2: [second calculation/reasoning]
...
VERIFICATION: [check the answer]
ANSWER: [final answer]
```

### CoT with Verification

Add an explicit verification step:

```
Solve this problem step by step. After reaching an answer,
verify it by working backwards or using an alternative method.
If the verification fails, redo the calculation.
```

---

## Practical Tips for Using CoT

### 1. Place CoT Instructions at the End

```
✅ Good:
"[Problem description]. Let's think step by step."

❌ Less effective:
"Let's think step by step. [Problem description]."
```

### 2. Separate Reasoning from Answer

```
"Solve the problem step by step. Put your reasoning in a
<reasoning> block and your final answer in an <answer> block."
```

This makes it easy to programmatically extract just the answer.

### 3. Control Reasoning Depth

```
Brief: "Think through this in 2-3 steps."
Detailed: "Walk through your complete reasoning process, showing all
intermediate calculations."
```

### 4. Combine with Role Prompting

```
"You are a math professor who always shows complete working.
Solve this problem, showing every step clearly."
```

### 5. Use CoT for Complex Extraction

CoT isn't just for math — it helps with complex information extraction:

```
"Extract all action items from this meeting transcript. Think through
the transcript chronologically, identifying who committed to what, with
what deadline. Then compile your findings into a structured list."
```

---

## CoT Performance Benchmarks

Research shows CoT's impact varies by task type and model size:

| Task Type | Without CoT | With CoT | Improvement |
|-----------|------------|----------|-------------|
| Arithmetic (GSM8K) | ~55% | ~80% | +25 points |
| Commonsense reasoning | ~70% | ~78% | +8 points |
| Symbolic reasoning | ~15% | ~65% | +50 points |
| Simple factual QA | ~85% | ~83% | -2 points (worse!) |
| Multi-step logic | ~40% | ~72% | +32 points |

> **Tip:** CoT benefits scale with model size. Smaller models (< 10B parameters) often don't benefit from CoT and may even perform worse. CoT is most effective with large, capable models like GPT-4, Claude 3.5, and Llama 3 70B.

---

## Common Mistakes

### Mistake 1: Using CoT for Everything

```
❌ "What color is the sky? Let's think step by step."
→ Unnecessary overhead for simple retrieval
```

### Mistake 2: Not Extracting the Final Answer

```
❌ Using the full CoT output (including reasoning) as the answer
✅ Parse out just the final answer: "End with ANSWER: [value]"
```

### Mistake 3: Not Verifying the Reasoning

```
❌ Trusting CoT blindly — models can produce confident but wrong reasoning
✅ Use self-consistency or explicit verification steps
```

### Mistake 4: Few-Shot Examples with Wrong Reasoning

```
❌ Providing examples where the steps are incorrect (model learns bad patterns)
✅ Verify every reasoning step in your few-shot examples is correct
```

---

## Summary

Chain-of-Thought prompting transforms LLMs from answer-generators into reasoning engines:

1. **Zero-shot CoT** — Just add "Let's think step by step"
2. **Few-shot CoT** — Provide examples of complete reasoning chains
3. **Self-consistency** — Multiple reasoning paths + majority vote
4. **Use CoT when** — Math, logic, multi-step reasoning, debugging
5. **Skip CoT when** — Simple facts, creative writing, classification, speed-critical apps
6. **Extract answers** — Separate reasoning from final answer for programmatic use

In the simulation lab, you'll see firsthand how adding CoT to math and logic prompts dramatically improves accuracy.

---

## Further Reading

- [Wei et al., 2022: Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903)
- [Kojima et al., 2022: Large Language Models are Zero-Shot Reasoners](https://arxiv.org/abs/2205.11916)
- [Wang et al., 2022: Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171)
- [Yao et al., 2023: Tree of Thoughts](https://arxiv.org/abs/2305.10601)
