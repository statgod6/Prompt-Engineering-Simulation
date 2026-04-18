# Module 18: Agentic Prompting

## Introduction

Traditional prompting is a single turn: you send a prompt, you get a response. **Agentic prompting** breaks this model. Instead of one-shot interactions, you design prompts that drive **autonomous loops** — systems that observe, think, act, and repeat until a complex goal is achieved.

AI agents are the next frontier of prompt engineering. They combine LLMs with tools, memory, and planning to accomplish multi-step tasks that no single prompt could handle alone.

> **Tip:** An agent is just a prompt in a loop with access to tools. Master the prompt, and you master the agent.

---

## What Makes an Agent Different?

| Characteristic | Traditional Prompting | Agentic Prompting |
|---------------|----------------------|-------------------|
| Turns | Single turn (or few) | Multi-turn loop |
| Decision-making | User decides next step | Agent decides next step |
| Tool use | Optional | Core capability |
| Memory | No persistent memory | Maintains working memory |
| Planning | No planning | Plans and re-plans |
| Error handling | Fails silently | Detects and recovers |
| Output | Final answer | Actions + final answer |

---

## The Agent Loop

Every AI agent follows a fundamental loop, regardless of complexity:

```
┌──────────────────────────────────────────┐
│                AGENT LOOP                 │
│                                           │
│   ┌─────────┐                             │
│   │ OBSERVE │ ← Receive input / results   │
│   └────┬────┘                             │
│        │                                  │
│   ┌────▼────┐                             │
│   │  THINK  │ ← Reason about next step    │
│   └────┬────┘                             │
│        │                                  │
│   ┌────▼────┐                             │
│   │   ACT   │ ← Execute tool / respond    │
│   └────┬────┘                             │
│        │                                  │
│   ┌────▼────┐                             │
│   │  CHECK  │ ← Is the goal achieved?     │
│   └────┬────┘                             │
│        │                                  │
│    No  │  Yes → Return final answer       │
│        │                                  │
│        └──────→ Back to OBSERVE           │
└──────────────────────────────────────────┘
```

### Phase 1: Observe

The agent receives information — the initial task, tool outputs, error messages, or new context.

```
OBSERVATION:
User request: "Plan a 5-day trip to Japan for 2 people, budget $3000"
Previous actions: None (first iteration)
Available tools: search_destinations, find_flights, find_hotels, create_budget
```

### Phase 2: Think

The agent reasons about what to do next. This is where chain-of-thought meets planning.

```
THOUGHT:
The user wants a 5-day Japan trip for 2 people with a $3000 budget.
I need to:
1. First, search for popular destinations in Japan that fit the interests
2. Then find flights and hotels within budget
3. Create a day-by-day itinerary
4. Verify total cost is under $3000

Let me start with step 1 — searching for destinations.
I'll focus on food and history since those are the stated interests.
```

### Phase 3: Act

The agent executes a tool call, generates a response, or takes some action.

```
ACTION: search_destinations
Parameters: {
  "country": "Japan",
  "interests": ["food", "history"],
  "duration_days": 5
}
```

### Phase 4: Check

The agent evaluates whether the goal is complete or another iteration is needed.

```
CHECK:
- Destination search complete ✓
- Flights found? Not yet
- Hotels found? Not yet
- Budget created? Not yet
- Itinerary generated? Not yet

Status: CONTINUE — need to find flights next.
```

---

## ReAct: The Foundation Pattern

**ReAct** (Reasoning + Acting) is the most widely used agentic prompting pattern. It interleaves reasoning traces with actions in a structured format.

### ReAct Prompt Template

```
You are a helpful assistant with access to the following tools:

{tool_descriptions}

To use a tool, respond with:
Thought: [your reasoning about what to do next]
Action: [tool_name]
Action Input: [parameters as JSON]

After receiving tool results, you'll see:
Observation: [tool output]

Then continue with another Thought/Action cycle, or provide the final answer:
Thought: [final reasoning]
Final Answer: [your complete response to the user]

IMPORTANT:
- Always think before acting
- Use tools when you need real information — never guess
- You can use multiple tools in sequence
- When you have enough information, provide the Final Answer
```

### ReAct Example: Travel Planning

```
User: "Find me a good sushi restaurant in Tokyo near Shibuya station"

Thought: I need to search for sushi restaurants near Shibuya, Tokyo.
Let me use the restaurant search tool.
Action: search_restaurants
Action Input: {"query": "sushi", "location": "Shibuya, Tokyo", "cuisine": "japanese"}

Observation: Found 3 results:
1. Sushi Dai - Rating 4.8, Price $$$$, 0.3km from Shibuya
2. Midori Sushi - Rating 4.6, Price $$, 0.1km from Shibuya
3. Genki Sushi - Rating 4.2, Price $, 0.5km from Shibuya

Thought: I have three options. The user asked for "good" sushi,
so I should recommend based on quality. Sushi Dai has the highest
rating but is expensive. Midori Sushi is well-rated and more
affordable. Let me provide both options.

Final Answer: Here are two great sushi options near Shibuya Station:

1. **Midori Sushi** (0.1km away) — Rating 4.6/5, moderate pricing ($$).
   Closest to the station and excellent value.
2. **Sushi Dai** (0.3km away) — Rating 4.8/5, premium pricing ($$$$).
   The highest-rated option if you want an exceptional experience.

I'd recommend Midori Sushi for the best balance of quality and
convenience. Would you like me to help with anything else for
your Tokyo trip?
```

---

## Multi-Agent Orchestration

Complex tasks often benefit from **multiple specialized agents** working together, each with their own expertise and system prompt.

### Architecture Patterns

#### Pattern 1: Sequential Pipeline

Agents process tasks in a fixed order, each passing results to the next.

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Research  │───▶│ Analysis │───▶│ Writing  │───▶│ Review   │
│  Agent    │    │  Agent   │    │  Agent   │    │  Agent   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**Use when:** Tasks have natural sequential stages (research → draft → edit → publish).

#### Pattern 2: Hub and Spoke (Orchestrator)

A central orchestrator delegates tasks to specialist agents.

```
                    ┌──────────────┐
                    │ Orchestrator │
                    │    Agent     │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼────┐ ┌────▼────┐
        │ Research   │ │ Code   │ │ Design  │
        │ Specialist │ │ Writer │ │ Reviewer│
        └───────────┘ └────────┘ └─────────┘
```

**Use when:** The task can be decomposed into independent sub-tasks.

#### Pattern 3: Debate / Consensus

Multiple agents argue different perspectives, then a judge agent synthesizes.

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Agent A   │     │ Agent B   │     │ Agent C   │
│ (Pro)     │     │ (Con)     │     │ (Neutral) │
└─────┬─────┘     └─────┬─────┘     └─────┬─────┘
      │                 │                 │
      └─────────────────┼─────────────────┘
                        │
                  ┌─────▼─────┐
                  │   Judge   │
                  │   Agent   │
                  └───────────┘
```

**Use when:** Decisions benefit from diverse perspectives (legal analysis, strategy planning).

### Orchestrator Prompt Example

```
You are an orchestrator agent managing a team of specialists.

Available specialists:
- researcher: Expert at finding and summarizing information
- coder: Expert at writing and debugging code
- reviewer: Expert at quality review and finding issues

For each user request:
1. Analyze the task and break it into sub-tasks
2. Assign each sub-task to the appropriate specialist
3. Collect and synthesize results
4. Deliver the final answer

To delegate, use:
Thought: [your plan]
Delegate: [specialist_name]
Task: [specific sub-task description]
Context: [any relevant context from previous steps]

After receiving the specialist's response:
Result: [specialist output]

Continue delegating or provide:
Final Answer: [synthesized response]
```

---

## Tool Chaining

Agents often need to use multiple tools in sequence, where the output of one tool becomes the input for the next.

### Designing Tool Chain Prompts

```
You have access to these tools (use in any order, chain as needed):

1. web_search(query) → Returns search results with snippets
2. read_page(url) → Returns full text content of a URL
3. extract_data(text, schema) → Extracts structured data from text
4. calculate(expression) → Evaluates math expressions
5. compose_email(to, subject, body) → Drafts an email

Rules for tool chaining:
- You may use the OUTPUT of one tool as INPUT to another
- Plan your tool chain BEFORE executing
- If a tool fails, try an alternative approach
- Explain your reasoning at each step

Example chain:
web_search("best laptops 2025") → read_page(top_result_url) →
extract_data(page_text, laptop_specs_schema) → calculate(price comparison)
```

### Error Recovery in Tool Chains

```
When a tool call fails:
1. Analyze the error message
2. Determine if the error is:
   a. Retryable (timeout, rate limit) → Retry once with same parameters
   b. Fixable (bad parameters) → Fix parameters and retry
   c. Fatal (tool unavailable, permission denied) → Use alternative approach
3. If no alternative exists, explain the limitation to the user
4. NEVER fabricate data to replace a failed tool call
```

---

## Planning Prompts

Effective agents plan before acting. Planning prompts break complex goals into manageable steps.

### Plan-and-Execute Pattern

```
You are a planning agent. Given a complex task, create a detailed
execution plan BEFORE taking any actions.

## Planning Phase
For each task, first output a plan in this format:

GOAL: [restate the user's goal]
CONSTRAINTS: [budget, time, preferences, requirements]
PLAN:
Step 1: [action] — Tool: [tool_name] — Purpose: [why this step]
Step 2: [action] — Tool: [tool_name] — Purpose: [why this step]
...
Step N: [action] — Tool: [tool_name] — Purpose: [why this step]
DEPENDENCIES: [which steps depend on others]
RISKS: [what could go wrong and fallback plans]

## Execution Phase
Execute each step, updating the plan if new information changes
the optimal approach. After each step, briefly assess:
- Was the step successful?
- Does the plan need adjustment?
- What's the next step?

## Completion
When all steps are done, synthesize results into a final answer.
```

### Adaptive Replanning

Plans often need to change mid-execution. Teach agents to adapt:

```
After each action, evaluate:
1. Did the result match expectations?
2. Has new information emerged that changes the plan?
3. Are remaining steps still valid?

If the plan needs adjustment:
REPLAN:
- Reason: [why the plan changed]
- Original next step: [what was planned]
- New next step: [what to do instead]
- Impact on remaining steps: [what else changes]
```

---

## Memory Management in Agents

Agents that run for many iterations need memory management — the context window has limits.

### Types of Agent Memory

| Memory Type | Purpose | Implementation | Persistence |
|------------|---------|----------------|-------------|
| Working Memory | Current task state | Context window | Per-session |
| Short-Term Memory | Recent observations | Sliding window | Per-session |
| Long-Term Memory | Learned facts | External database | Cross-session |
| Episodic Memory | Past experiences | Vector store | Cross-session |

### Working Memory Prompt

```
## Working Memory
Maintain a running summary of your progress. Update after each action.

Current state:
- Task: {original_task}
- Progress: {completed_steps} / {total_steps}
- Key findings so far: {summarized_findings}
- Next action: {planned_next_step}
- Blockers: {any_issues}

When your context gets long, COMPRESS your working memory:
- Summarize completed steps into key findings
- Drop raw tool outputs after extracting relevant data
- Keep only the information needed for remaining steps
```

### Memory Compression

```
When your conversation exceeds 3000 tokens of history:
1. Summarize all previous observations into a concise "State Summary"
2. Keep only the last 2 tool outputs in full
3. Retain the original task and current plan
4. Drop intermediate reasoning traces

FORMAT:
=== STATE SUMMARY (compressed at step {N}) ===
Original task: [task]
Completed: [brief list of what's done]
Key data: [essential findings]
Current step: [what to do next]
=== END SUMMARY ===
```

---

## Building Agent Systems: Step by Step

### Step 1: Define the Agent's Purpose

```markdown
## Agent Specification

Name: TravelBot
Purpose: Plan complete trips based on user preferences
Scope: Destination research, flights, hotels, itineraries, budgets
Out of scope: Booking transactions, visa applications

## Decision Authority
- Can decide: destinations, daily schedules, restaurant suggestions
- Must confirm: budget allocation, hotel selection, flight selection
- Cannot do: make purchases, access personal accounts
```

### Step 2: Define Available Tools

```markdown
## Tool Registry

### search_destinations
- Input: country, interests[], duration_days
- Output: List of recommended cities/regions with descriptions
- Rate limit: 5 calls per session
- Fallback: Use cached popular destinations

### find_flights
- Input: origin, destination, dates, passengers, budget_max
- Output: Top 5 flight options with prices and details
- Rate limit: 3 calls per session
- Fallback: Suggest flexible dates if no results

### find_hotels
- Input: city, checkin_date, checkout_date, guests, budget_per_night
- Output: Top 5 hotel options with prices and ratings
- Rate limit: 3 calls per session

### create_budget
- Input: items[] with {category, description, amount}
- Output: Budget breakdown with total and remaining

### generate_itinerary
- Input: destination, days, interests[], key_bookings[]
- Output: Day-by-day schedule with times and descriptions
```

### Step 3: Define the Agent Loop

```markdown
## Agent Loop Specification

### Iteration 1: Research
- Search destinations based on user preferences
- Present options and get user confirmation

### Iteration 2: Logistics
- Find flights within budget
- Find hotels within budget
- Calculate remaining budget for activities

### Iteration 3: Planning
- Generate day-by-day itinerary
- Include meals, activities, transportation

### Iteration 4: Review
- Create full budget breakdown
- Verify total under budget limit
- Present complete plan for user approval

### Error Handling
- Tool failure: Retry once, then use fallback
- Over budget: Suggest alternatives, adjust hotel/flight tier
- No results: Expand search criteria or suggest different dates
```

### Step 4: Compose the Agent Prompt

```
You are TravelBot, an expert travel planning agent.

## Your Mission
Help users plan complete, budget-friendly trips. You have access
to search and planning tools. Work iteratively:

1. UNDERSTAND the user's needs (destination, budget, dates, interests)
2. RESEARCH destinations and options using your tools
3. PLAN logistics (flights, hotels) within budget
4. CREATE a detailed day-by-day itinerary
5. REVIEW the complete plan and present it

## Tools
{tool_descriptions}

## Rules
- Always confirm key decisions with the user before proceeding
- Never exceed the stated budget
- Present 2-3 options at each decision point
- If a tool fails, explain and offer alternatives
- Track spending against budget at every step

## Output Format
Use this format for each iteration:

THOUGHT: [what I'm thinking and planning]
ACTION: [tool_name]({parameters})
OBSERVATION: [tool result]
... (repeat as needed)
RESPONSE: [what I'm telling the user]
```

---

## Common Pitfalls

### 1. Infinite Loops
**Problem:** Agent keeps calling tools without making progress.
**Solution:** Set a maximum iteration count (e.g., 10 iterations). Add a "progress check" after each iteration.

### 2. Tool Overuse
**Problem:** Agent calls tools for information it already has.
**Solution:** Instruct the agent to check working memory before calling tools: "Only call a tool if you don't already have the needed information."

### 3. Hallucinated Tool Calls
**Problem:** Agent invents tools that don't exist or uses wrong parameter formats.
**Solution:** List tools explicitly with exact parameter schemas. Add: "ONLY use tools listed above. If no tool matches your need, say so."

### 4. Lost Context
**Problem:** After many iterations, the agent forgets the original goal.
**Solution:** Include the original task in every iteration's context. Use working memory compression to keep the task visible.

### 5. No Error Recovery
**Problem:** Agent breaks when a tool returns an error.
**Solution:** Include explicit error handling instructions: "If a tool returns an error, analyze the error, adjust parameters, and retry once. If it fails again, use an alternative approach."

---

## Summary

| Concept | Key Takeaway |
|---------|-------------|
| Agent Loop | Observe → Think → Act → Check → Repeat |
| ReAct Pattern | Interleave reasoning traces with tool actions |
| Multi-Agent | Specialized agents collaborating via orchestration patterns |
| Tool Chaining | Output of one tool feeds into the next |
| Planning | Plan before acting; replan when new information arrives |
| Memory | Compress context as conversations grow; use external storage for persistence |
| Error Recovery | Define fallback strategies for every tool and decision point |

---

## What's Next

In the simulation, you'll build a travel planning agent with 4 pipeline steps: search destinations, find flights and hotels, create a budget, and generate a complete itinerary. Your agent will be tested with a real planning request.
