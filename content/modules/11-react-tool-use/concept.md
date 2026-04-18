# Module 11: ReAct Framework & Tool Use

## Introduction

Language models are remarkably good at reasoning—but they can't **do** anything on their own. They can't browse the web, run calculations with guaranteed precision, or execute code. The **ReAct framework** (Reasoning + Acting) bridges this gap by teaching models to **think about what tool to use, use it, observe the result, and continue reasoning**.

This module covers:

- The ReAct framework: interleaving thought and action
- Writing effective tool descriptions in prompts
- Tool selection patterns for multi-tool environments
- Function calling basics and JSON output for tool use
- Multi-tool orchestration strategies
- Error handling when tools fail

---

## What Is ReAct?

**ReAct** (Yao et al., 2022) stands for **Reasoning + Acting**. It's a prompting framework where the model alternates between:

1. **Thought** — reasoning about what to do next
2. **Action** — selecting and invoking a tool
3. **Observation** — processing the tool's result
4. **Repeat** — until the task is complete

### The ReAct Loop

```
Question: "What is the population of France divided by 3?"

Thought 1: I need to find the current population of France.
            This requires looking up current data, so I should use search.
Action 1:   search("current population of France")
Observation 1: France has a population of approximately 68.2 million (2024).

Thought 2: Now I need to divide 68.2 million by 3.
            This is a math calculation, so I should use calculator.
Action 2:   calculator("68200000 / 3")
Observation 2: 22733333.33

Thought 3: I now have the answer.
Final Answer: The population of France divided by 3 is approximately 22,733,333.
```

### Why ReAct Matters

Without ReAct, models either:
- **Reason without acting**: Think through a problem but hallucinate facts or fumble arithmetic
- **Act without reasoning**: Call tools randomly without a coherent strategy

ReAct combines both, giving you the model's analytical ability **plus** the reliability of external tools.

> **Tip:** Think of ReAct as giving the model a toolkit and teaching it to think out loud about which tool to grab. The "thinking out loud" part is what makes it work—it forces structured decision-making.

---

## Tool Descriptions: The Foundation

The quality of tool selection depends almost entirely on how well you **describe your tools** to the model. A vague description leads to wrong tool choices. A precise description leads to accurate ones.

### Anatomy of a Good Tool Description

```markdown
## Available Tools

### calculator
- **Purpose**: Perform mathematical calculations with exact precision
- **Use when**: The task involves arithmetic, algebra, unit conversions,
  percentages, or any numerical computation
- **Input format**: A mathematical expression as a string (e.g., "25 * 0.18")
- **Output**: The numerical result
- **Do NOT use for**: Estimations, date calculations, or non-math tasks

### search
- **Purpose**: Look up current, real-time, or factual information
- **Use when**: The question asks about current events, specific facts,
  people, places, statistics, or anything that requires up-to-date knowledge
- **Input format**: A search query string (e.g., "Nobel Prize Physics 2024 winner")
- **Output**: Relevant search results with snippets
- **Do NOT use for**: Calculations, code execution, or opinion questions

### code_runner
- **Purpose**: Write and execute Python code
- **Use when**: The task requires generating code, running algorithms,
  data processing, or demonstrating programming output
- **Input format**: Python code as a string
- **Output**: The stdout/stderr output of the executed code
- **Do NOT use for**: Simple math (use calculator), factual lookups (use search)
```

### What Makes Descriptions Effective

| Element | Why It Matters | Example |
|---------|---------------|---------|
| Clear purpose | Model understands the tool's role | "Perform mathematical calculations" |
| "Use when" triggers | Model knows when to select it | "When the task involves arithmetic" |
| Input format | Model formats the input correctly | "A mathematical expression as a string" |
| "Do NOT use" boundaries | Prevents incorrect selection | "Do NOT use for date calculations" |
| Output description | Model knows what to expect back | "The numerical result" |

### Common Mistakes in Tool Descriptions

**Too vague:**
```
calculator: Does math stuff
```

**Too technical:**
```
calculator: IEEE 754 double-precision floating-point arithmetic engine
supporting infix notation with operator precedence
```

**Just right:**
```
calculator: Evaluates mathematical expressions and returns the exact
numerical result. Use for arithmetic, percentages, and conversions.
Input: math expression string. Output: number.
```

> **Tip:** Write tool descriptions as if explaining to a smart intern on their first day. Specific enough to be useful, simple enough to be unambiguous.

---

## Tool Selection Patterns

When multiple tools are available, the model must decide which one to use. There are several patterns for structuring this decision.

### Pattern 1: Decision Tree

Guide the model through a series of yes/no questions:

```markdown
To select the right tool, follow this decision tree:

1. Does the task require a NUMERICAL CALCULATION?
   → Yes: Use **calculator**
   → No: Continue to step 2

2. Does the task require CURRENT or FACTUAL information?
   → Yes: Use **search**
   → No: Continue to step 3

3. Does the task require WRITING or RUNNING code?
   → Yes: Use **code_runner**
   → No: Answer directly from your knowledge
```

### Pattern 2: Keyword Matching

Associate tools with trigger words:

```markdown
Tool selection guide:
- **calculator**: "calculate", "how much", "what is [number] × [number]",
  "percentage", "convert", "sum", "average"
- **search**: "who", "when", "current", "latest", "recent", "what happened",
  "where is", "stock price", "weather"
- **code_runner**: "write a function", "program", "script", "sort",
  "algorithm", "code", "output of"
```

### Pattern 3: Example-Based (Few-Shot)

Show the model examples of correct tool selection:

```markdown
Examples:

Q: "What is 47 * 89?"
Tool: calculator
Input: "47 * 89"

Q: "Who is the current CEO of Apple?"
Tool: search
Input: "current CEO of Apple"

Q: "Write a Python function to reverse a linked list"
Tool: code_runner
Input: "def reverse_linked_list(head): ..."
```

### Pattern 4: Explicit JSON Output

Force structured output for reliable parsing:

```markdown
For every question, output your tool selection as JSON:

{
  "reasoning": "Why I chose this tool",
  "tool": "calculator|search|code_runner",
  "input": "The input to pass to the tool"
}
```

---

## Function Calling Basics

Modern LLM APIs support **function calling** (also called "tool use") natively. Instead of hoping the model outputs the right format, you define functions in the API request and the model outputs structured calls.

### How Function Calling Works

```
1. You define available functions in the API request
2. The model decides if/which function to call
3. The model returns a structured function call (not free text)
4. Your code executes the function
5. You send the result back to the model
6. The model incorporates the result into its response
```

### Defining Functions (OpenAI Format)

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "calculator",
        "description": "Evaluate a mathematical expression and return the result",
        "parameters": {
          "type": "object",
          "properties": {
            "expression": {
              "type": "string",
              "description": "The mathematical expression to evaluate, e.g. '25 * 0.18'"
            }
          },
          "required": ["expression"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "search",
        "description": "Search for current information on the web",
        "parameters": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "The search query"
            }
          },
          "required": ["query"]
        }
      }
    }
  ]
}
```

### Prompt-Based vs. API Function Calling

| Feature | Prompt-Based Tool Use | API Function Calling |
|---------|----------------------|---------------------|
| Output format | Free text (parse JSON yourself) | Structured (guaranteed schema) |
| Reliability | May produce invalid JSON | Always valid structure |
| Flexibility | Works with any model | Requires API support |
| Multi-tool | Harder to manage | Built-in support |
| Transparency | Full reasoning visible | Reasoning may be hidden |

> **Tip:** Use API function calling when available for reliability. Fall back to prompt-based tool use when you need transparency or work with models that don't support function calling.

---

## When to Use Which Tool

A critical skill in tool-use prompting is teaching the model to recognize **ambiguous cases**—queries that could reasonably go to multiple tools.

### Clear-Cut Cases

| Query | Tool | Why |
|-------|------|-----|
| "What is 47 × 89 + 156?" | calculator | Pure arithmetic |
| "Who won the 2024 Nobel Prize?" | search | Current factual info |
| "Write a sorting algorithm in Python" | code_runner | Code generation |

### Ambiguous Cases

| Query | Best Tool | Why (Not the Other) |
|-------|-----------|-------------------|
| "What's 15% tip on $67.50?" | calculator | Math, not a lookup |
| "How many days between Jan 1 and Mar 15?" | calculator OR code_runner | Simple enough for calculator, but code is more reliable for dates |
| "What's the GDP of Japan in USD?" | search | Factual data that changes, not a calculation |
| "Calculate the Fibonacci sequence up to 100" | code_runner | Iterative algorithm, not a single expression |
| "What is the square root of 2 to 10 decimal places?" | calculator | Precise math, though code also works |

### Teaching the Model to Handle Ambiguity

```markdown
IMPORTANT: Some queries could use multiple tools. Follow these priority rules:

1. If the query is PURELY mathematical (no external data needed),
   use calculator
2. If the query requires CURRENT/FACTUAL data, use search —
   even if math is also involved (search first, then calculate)
3. If the query requires WRITING or RUNNING code, or involves
   ITERATIVE/COMPLEX logic, use code_runner
4. If you're unsure, explain your reasoning and pick the most
   specific tool for the core task
```

---

## Multi-Tool Orchestration

Real-world tasks often require **multiple tools in sequence**. The model must plan a multi-step approach and chain tool calls together.

### Sequential Tool Use

```
Question: "What is 15% of Japan's GDP?"

Thought 1: I need Japan's GDP first. That's a factual lookup.
Action 1:  search("Japan GDP 2024 USD")
Observation 1: Japan's GDP is approximately $4.2 trillion.

Thought 2: Now I calculate 15% of $4.2 trillion.
Action 2:  calculator("4200000000000 * 0.15")
Observation 2: 630000000000

Final Answer: 15% of Japan's GDP is approximately $630 billion.
```

### Parallel Tool Use

Some tasks can call multiple tools simultaneously:

```
Question: "Compare the populations of France and Germany."

Thought: I need both populations. I can search for both at once.
Action 1a: search("population of France 2024")
Action 1b: search("population of Germany 2024")
Observation 1a: France: ~68.2 million
Observation 1b: Germany: ~84.5 million

Thought 2: Now I can compare.
Final Answer: Germany (84.5M) has about 16.3 million more people than France (68.2M).
```

### Orchestration Prompt Template

```markdown
You have access to the following tools: {{tool_descriptions}}

For complex questions that require multiple steps:
1. Plan your approach BEFORE calling any tools
2. Call tools one at a time (or in parallel if independent)
3. After each tool result, reassess your plan
4. If a tool returns an error, try an alternative approach
5. Combine all results into a final answer

Always show your planning as "Thought:" before each "Action:".
```

---

## Error Handling in Tool Use

Tools fail. APIs time out. Search returns irrelevant results. Calculator gets invalid expressions. Robust tool-use prompts must handle these cases.

### Common Tool Failures

| Tool | Failure Mode | Recovery Strategy |
|------|-------------|-------------------|
| search | No relevant results | Rephrase query, try broader terms |
| search | Outdated information | Note the date, flag uncertainty |
| calculator | Invalid expression | Fix syntax, simplify expression |
| calculator | Division by zero | Check inputs, handle edge case |
| code_runner | Syntax error | Debug and retry |
| code_runner | Timeout | Simplify algorithm, reduce input size |

### Error Handling Prompt Pattern

```markdown
IMPORTANT: If a tool returns an error or unexpected result:

1. DO NOT give up immediately
2. Analyze the error message
3. Try one of these recovery strategies:
   a. Rephrase the input and try again
   b. Try a different tool that could accomplish the same goal
   c. Break the task into smaller sub-tasks
   d. If all tools fail, answer from your knowledge but clearly
      state: "Note: I could not verify this with tools."

Never silently ignore tool errors. Always acknowledge and explain
what happened.
```

### Retry Logic

```markdown
When a tool call fails:

Attempt 1: Try the original approach
→ If error: Analyze what went wrong

Attempt 2: Modify the input (fix syntax, rephrase query)
→ If error: Try a different tool

Attempt 3: Use a completely different approach
→ If error: Answer from knowledge with a disclaimer

Maximum 3 attempts per tool. Do not enter infinite loops.
```

---

## Building Effective ReAct Prompts

### The Complete ReAct System Prompt

```markdown
You are an AI assistant with access to external tools. For every question,
follow this process:

## Available Tools
{{tool_descriptions}}

## Process
1. **Thought**: Analyze the question. What information or computation
   do you need? Which tool is most appropriate?
2. **Action**: Call the selected tool with appropriate input
3. **Observation**: Read the tool's response
4. **Repeat** steps 1-3 if more steps are needed
5. **Final Answer**: Synthesize all observations into a complete answer

## Output Format
Always use this exact format:

Thought: [your reasoning about what to do next]
Action: [tool_name]("[input]")
Observation: [tool result will appear here]
... (repeat as needed)
Final Answer: [your complete answer]

## Rules
- Always think BEFORE acting
- Use the most specific tool for each sub-task
- If a tool fails, try an alternative approach
- Cite which tools you used in your final answer
- Never make up tool results — wait for actual observations
```

### ReAct vs. Other Approaches

| Approach | Reasoning | Tool Use | Transparency |
|----------|-----------|----------|-------------|
| Direct prompting | Internal only | None | Low |
| Chain-of-thought | Explicit steps | None | High |
| Tool use (no reasoning) | Implicit | Yes | Low |
| **ReAct** | **Explicit steps** | **Yes** | **High** |

> **Tip:** ReAct's biggest advantage is **debuggability**. When something goes wrong, you can see exactly where the reasoning or tool selection failed.

---

## Real-World Applications

### Customer Support Bot

```
Tools: [knowledge_base_search, ticket_create, order_lookup, escalate_to_human]

User: "My order #12345 hasn't arrived and it's been 2 weeks."

Thought: Customer is asking about an order. I should look it up first.
Action: order_lookup("12345")
Observation: Order #12345 - Shipped 14 days ago, tracking shows "In Transit"

Thought: The order is delayed. I should check the knowledge base for
         the delay policy.
Action: knowledge_base_search("shipping delay policy refund")
Observation: Policy: Orders not delivered within 10 business days are
             eligible for reshipment or refund.

Thought: This order qualifies for resolution. I should offer options.
Final Answer: I found your order #12345 — it shipped 14 days ago but
              is still in transit. Per our policy, you're eligible for
              either a reshipment or a full refund. Which would you prefer?
```

### Data Analysis Assistant

```
Tools: [sql_query, chart_generator, statistics_calculator]

User: "Show me the sales trend for Q1 2024"

Thought: I need to query the database for Q1 2024 sales data.
Action: sql_query("SELECT date, SUM(amount) as daily_sales
                   FROM sales WHERE date BETWEEN '2024-01-01'
                   AND '2024-03-31' GROUP BY date ORDER BY date")
Observation: [31 rows of daily sales data...]

Thought: Now I should visualize this as a trend chart.
Action: chart_generator({"type": "line", "data": [results],
                         "title": "Q1 2024 Daily Sales"})
Observation: [Chart generated successfully]

Final Answer: Here's the Q1 2024 sales trend. Key observations:
- January started strong at $45K/day
- February dipped to ~$38K/day
- March recovered to $52K/day, the highest in the quarter
```

---

## Common Pitfalls

### 1. Tool Description Overlap

If two tools have overlapping descriptions, the model will randomly choose between them. Make boundaries explicit.

### 2. Missing "When NOT to Use" Guidance

Without negative examples, models over-use tools. Always specify what each tool is NOT for.

### 3. No Error Recovery Instructions

Without explicit error handling, models either hallucinate results or give up entirely when a tool fails.

### 4. Forgetting the "Thought" Step

If you skip the reasoning step, the model jumps to tool calls without planning—leading to inefficient tool chains and wrong selections.

### 5. Not Validating JSON Output

When using prompt-based tool use, always validate the JSON output before passing it to your tool execution layer.

---

## Summary

| Concept | Key Takeaway |
|---------|--------------|
| ReAct framework | Interleave Thought → Action → Observation for reliable tool use |
| Tool descriptions | Be specific: purpose, when to use, input format, boundaries |
| Tool selection | Use decision trees, keyword matching, or few-shot examples |
| Function calling | Prefer API-native function calling for reliability |
| Multi-tool orchestration | Plan multi-step approaches, handle dependencies |
| Error handling | Retry with modifications, fall back gracefully |

> **Key Insight:** The model's reasoning ability is the "brain" and tools are the "hands." ReAct connects them with a structured thinking process that makes tool use transparent, debuggable, and reliable.

---

## What's Next?

In the simulation for this module, you'll build a tool-selection prompt that correctly routes queries to the right tool (calculator, search, or code_runner) and outputs structured JSON. You'll test it against 15 diverse queries—from clear-cut math problems to ambiguous multi-domain questions.
