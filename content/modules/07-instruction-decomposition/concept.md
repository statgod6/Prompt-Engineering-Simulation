# Module 7: Instruction Decomposition

## Introduction

As tasks get more complex, single prompts start to fail. Asking an LLM to "analyze a company, evaluate its finances, assess the competitive landscape, identify risks, and write an investment memo" in one shot produces mediocre results — the model spreads its attention too thin and cuts corners everywhere.

**Instruction decomposition** is the art of breaking a complex task into a **pipeline of focused sub-prompts**, where each step does one thing well and passes its output to the next step. This is the difference between amateur prompting and production-grade prompt engineering.

---

## Why Decompose?

### The Single-Prompt Problem

Consider asking an LLM to do everything at once:

```
Analyze the following company and produce a complete investment memo
covering overview, financials, competitive landscape, risks, and
recommendation.

Company: [5 pages of company data]
```

Problems with this approach:

| Issue | What Happens |
|-------|-------------|
| **Attention dilution** | Model skims each section instead of going deep |
| **Context overload** | Important details get lost in a long prompt |
| **Quality inconsistency** | Some sections are good, others are shallow |
| **Debugging difficulty** | When the output is wrong, which part failed? |
| **No intermediate checkpoints** | Can't verify progress along the way |
| **Token limits** | Complex tasks may exceed context windows |

### The Decomposed Approach

Instead, break it into a pipeline:

```
Step 1: Extract company overview → structured summary
Step 2: Analyze financials → financial assessment
Step 3: Map competitive landscape → competitive analysis
Step 4: Identify risks → risk register
Step 5: Synthesize recommendation → investment thesis
Step 6: Format everything → polished memo
```

Each step is **focused**, **testable**, and **improvable** independently.

---

## Sequential Chaining

The most common decomposition pattern: **output of Step A becomes input for Step B**.

### How It Works

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Step 1:    │    │   Step 2:    │    │   Step 3:    │
│   Extract    │───▶│   Analyze    │───▶│   Recommend  │
│   raw data   │    │   patterns   │    │   action     │
└──────────────┘    └──────────────┘    └──────────────┘
     input              middle              output
```

### Example: Blog Post Pipeline

**Step 1: Research & Outline**
```
Given the topic "{{topic}}", create a detailed outline for a blog post.
Include:
- A compelling title
- 5-7 main sections with brief descriptions
- Key points to cover in each section
- Suggested examples or data points

Output as a structured outline.
```

**Step 2: Draft Each Section**
```
Using the outline below, write the full content for section "{{section_title}}".

Outline: {{step1_output}}

Requirements:
- 200-300 words per section
- Include concrete examples
- Use conversational but authoritative tone
- End with a transition to the next section
```

**Step 3: Edit & Polish**
```
Review and edit the following blog post draft. Fix:
- Grammar and spelling errors
- Awkward transitions between sections
- Repetitive phrasing
- Ensure consistent tone throughout
- Add a compelling introduction and conclusion

Draft: {{step2_output}}
```

### Implementation in Code

```python
import openai

def chain_prompts(steps: list[dict], initial_input: str) -> str:
    """Execute a chain of prompts sequentially."""
    current_input = initial_input

    for i, step in enumerate(steps):
        prompt = step["prompt"].replace("{{input}}", current_input)
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": step.get("system", "")},
                {"role": "user", "content": prompt}
            ],
            max_tokens=step.get("max_tokens", 1024)
        )
        current_input = response.choices[0].message.content
        print(f"Step {i+1} ({step['name']}): {len(current_input)} chars")

    return current_input
```

---

## Parallel Decomposition

Not all sub-tasks depend on each other. When steps are **independent**, run them in parallel for speed:

### When to Parallelize

```
                    ┌──────────────┐
               ┌───▶│  Sentiment   │───┐
               │    │  Analysis    │   │
┌──────────┐   │    └──────────────┘   │    ┌──────────────┐
│  Input:  │───┤    ┌──────────────┐   ├───▶│   Combine    │
│  Review  │   ├───▶│  Key Themes  │───┤    │   Results    │
│  Text    │   │    │  Extraction  │   │    └──────────────┘
└──────────┘   │    └──────────────┘   │
               │    ┌──────────────┐   │
               └───▶│  Entity      │───┘
                    │  Detection   │
                    └──────────────┘
```

Sentiment analysis, theme extraction, and entity detection are **independent** — they all read the same input and don't need each other's output.

### Example: Product Review Analysis

**Parallel Step A: Sentiment**
```
Analyze the sentiment of this product review. Return ONLY a JSON object:
{"overall": "positive|negative|mixed", "score": 0.0-1.0, "emotions": []}

Review: {{input}}
```

**Parallel Step B: Key Themes**
```
Extract the 3-5 key themes discussed in this product review.
Return as a JSON array of strings.

Review: {{input}}
```

**Parallel Step C: Entities**
```
Extract all product names, brand names, and feature mentions from this review.
Return as JSON: {"products": [], "brands": [], "features": []}

Review: {{input}}
```

**Combination Step:**
```
Combine these three analyses into a comprehensive review summary:

Sentiment: {{step_a_output}}
Key Themes: {{step_b_output}}
Entities: {{step_c_output}}
Original Review: {{input}}

Write a 2-3 paragraph executive summary.
```

### Implementation

```python
import asyncio
import openai

async def parallel_steps(steps: list[dict], input_text: str) -> list[str]:
    """Run multiple prompts in parallel."""
    client = openai.AsyncOpenAI()

    async def run_step(step):
        prompt = step["prompt"].replace("{{input}}", input_text)
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=step.get("max_tokens", 512)
        )
        return response.choices[0].message.content

    results = await asyncio.gather(*[run_step(s) for s in steps])
    return results
```

---

## Hybrid Decomposition

Most real-world pipelines combine sequential and parallel steps:

```
Step 1 (Sequential): Extract raw data
    │
    ├── Step 2a (Parallel): Financial analysis
    ├── Step 2b (Parallel): Competitive analysis
    ├── Step 2c (Parallel): Risk assessment
    │
Step 3 (Sequential): Synthesize into recommendation
Step 4 (Sequential): Format as final memo
```

---

## When to Chain vs. When to Use One Prompt

### Use a Single Prompt When:

- The task is straightforward (one clear objective)
- All information fits comfortably in context
- Output quality is acceptable in one pass
- Latency matters more than quality
- The task has fewer than 3 distinct sub-tasks

### Use Decomposition When:

- The task has **3+ distinct phases** (extract → analyze → synthesize)
- Single-prompt output quality is inconsistent
- You need to **debug or improve specific steps** independently
- Different steps need **different models** (e.g., fast model for extraction, powerful model for analysis)
- You need **intermediate checkpoints** for validation
- The task exceeds the model's context window
- Different steps have **different temperature requirements** (0.0 for extraction, 0.7 for creative writing)

### Decision Flowchart

```
Is the task simple and single-objective?
  ├── Yes → Use one prompt
  └── No → Does it have 3+ distinct phases?
        ├── Yes → Decompose into pipeline
        └── No → Can quality improve with two passes?
              ├── Yes → Use two-step chain (draft → refine)
              └── No → Use one prompt with detailed instructions
```

---

## Practical Examples

### Example 1: Customer Email Response Pipeline

**Step 1: Classify**
```
Classify this customer email into ONE category:
billing, technical_support, shipping, refund, complaint, general_inquiry

Email: {{input}}

Return ONLY the category name.
```

**Step 2: Extract Details**
```
Extract structured information from this {{category}} email:
- Customer name (if mentioned)
- Order number (if mentioned)
- Specific issue description
- Urgency level (low/medium/high)
- Sentiment (positive/neutral/negative)

Email: {{input}}

Return as JSON.
```

**Step 3: Draft Response**
```
Draft a professional customer service response for this {{category}} issue.

Customer details: {{step2_output}}
Original email: {{input}}

Requirements:
- Acknowledge the customer's concern
- Provide specific next steps
- Be empathetic but efficient
- Include relevant policy information
- Keep under 200 words
```

**Step 4: Quality Check**
```
Review this customer service email response for:
1. Does it address the customer's specific concern?
2. Is the tone appropriate (empathetic, professional)?
3. Are the next steps clear and actionable?
4. Is there any information that could be incorrect?
5. Is it under 200 words?

If any issues found, rewrite the response fixing them.
Otherwise, return the response as-is.

Response: {{step3_output}}
```

### Example 2: Code Review Pipeline

**Step 1: Parse & Understand**
```
Analyze this code and provide:
1. Language and framework
2. What the code does (2-3 sentences)
3. List of all functions/methods with their purposes
4. External dependencies used

Code:
{{input}}
```

**Step 2: Find Issues (Parallel branches)**

Branch A — Security:
```
Review this code for security vulnerabilities:
- SQL injection, XSS, CSRF
- Hardcoded credentials or secrets
- Insecure data handling
- Missing input validation

Code context: {{step1_output}}
Code: {{input}}
```

Branch B — Performance:
```
Review this code for performance issues:
- N+1 queries, unnecessary loops
- Memory leaks, unbounded growth
- Missing caching opportunities
- Inefficient algorithms

Code context: {{step1_output}}
Code: {{input}}
```

Branch C — Best Practices:
```
Review this code for best practice violations:
- SOLID principles
- Error handling
- Code organization
- Naming conventions
- Missing tests

Code context: {{step1_output}}
Code: {{input}}
```

**Step 3: Compile Review**
```
Compile a code review from these analyses:

Code Overview: {{step1_output}}
Security Review: {{branch_a_output}}
Performance Review: {{branch_b_output}}
Best Practices Review: {{branch_c_output}}

Format as a code review with:
- Executive summary (2-3 sentences)
- Critical issues (must fix before merge)
- Suggestions (nice to have)
- Positive observations
- Overall recommendation: APPROVE / REQUEST_CHANGES / REJECT
```

---

## Design Principles for Pipelines

### 1. Each Step Should Have a Single Responsibility

```
❌ Bad: "Extract data and analyze trends and format report"
✅ Good: Step 1: Extract → Step 2: Analyze → Step 3: Format
```

### 2. Define Clear Input/Output Contracts

Each step should specify exactly what it receives and produces:

```
Step 2: Financial Analysis
  Input: JSON with fields {revenue, costs, growth_rate, ...}
  Output: JSON with fields {assessment, key_metrics, concerns, ...}
```

### 3. Use Structured Formats Between Steps

Pass JSON or structured text between steps — not free-form prose:

```
❌ Bad: Step 1 outputs a paragraph → Step 2 tries to parse it
✅ Good: Step 1 outputs JSON → Step 2 reads specific fields
```

### 4. Include Error Handling

What happens if a step fails or produces unexpected output?

```
Step 2: Analyze the financial data below.
If the data is incomplete or malformed, return:
{"error": "description of what's missing", "partial_analysis": {...}}
```

### 5. Keep Steps Independent When Possible

Design steps so they can be tested, debugged, and improved in isolation:

```
✅ Each step can be run independently with sample input
✅ Each step's output can be validated before proceeding
✅ Individual steps can be swapped to a different model
```

### 6. Consider Token Budgets

Each step consumes tokens. Plan your pipeline's total cost:

```
Step 1: ~500 input + ~300 output = 800 tokens
Step 2: ~800 input + ~500 output = 1,300 tokens
Step 3: ~1,300 input + ~200 output = 1,500 tokens
Total: ~3,600 tokens (vs. ~2,000 for single prompt)
```

> **Tip:** Decomposition trades tokens for quality. A 3-step pipeline may cost 2x the tokens but produce 5x better output. The ROI is almost always worth it for complex tasks.

---

## Anti-Patterns

### 1. Over-Decomposition

Breaking a simple task into too many tiny steps:

```
❌ Step 1: Read the sentence
   Step 2: Identify the subject
   Step 3: Identify the verb
   Step 4: Identify the object
   Step 5: Determine sentiment of subject
   Step 6: ...

✅ Just: "Analyze the sentiment of this sentence."
```

### 2. Lossy Handoffs

When one step summarizes too aggressively, losing information the next step needs:

```
❌ Step 1 output: "The company is doing well" (lost all the numbers)
   Step 2: "Analyze the financial details" (what details?)

✅ Step 1 output: {"revenue": "$5.2M", "growth": "23%", "margin": "18%", ...}
   Step 2: Can work with specific numbers
```

### 3. Circular Dependencies

Steps that depend on each other's output:

```
❌ Step A needs Step B's output, Step B needs Step A's output
✅ Restructure so dependencies flow in one direction
```

---

## Summary

Instruction decomposition transforms complex, unreliable single prompts into robust, debuggable pipelines:

1. **Sequential chaining** — Output of A feeds into B feeds into C
2. **Parallel decomposition** — Independent steps run simultaneously
3. **Hybrid pipelines** — Combine sequential and parallel as needed
4. **Clear contracts** — Define input/output format for each step
5. **Single responsibility** — Each step does one thing well
6. **Test independently** — Debug and improve steps in isolation

In the simulation lab, you'll build a complete investment memo pipeline from raw company data, experiencing firsthand how decomposition dramatically improves output quality.

---

## Further Reading

- [LangChain: Chains and Pipelines](https://python.langchain.com/docs/how_to/#use-cases) — Framework for building prompt chains
- [DSPy: Programming—not prompting—LMs](https://github.com/stanfordnlp/dspy) — Declarative prompt pipelines
- [Prompt Chaining Patterns](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-prompts) — Anthropic's guide to chaining
