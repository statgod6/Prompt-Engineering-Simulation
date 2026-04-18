# Module 2: The Anatomy of a Good Prompt

## Learning Objectives

By the end of this module, you will:

- Identify the four core components of an effective prompt
- Analyze weak prompts and diagnose specific problems
- Transform vague prompts into precise, actionable ones
- Recognize and avoid common prompt anti-patterns
- Apply a prompt improvement checklist to any prompt

---

## 1. The Four Components of a Prompt

Every effective prompt is built from four components. Not every prompt needs all four, but understanding each one lets you deliberately choose what to include.

```
┌─────────────────────────────────────────────────────────┐
│                  THE PROMPT BLUEPRINT                    │
│                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────┐   │
│  │ INSTRUCTION  │  │ What do you want the model to   │   │
│  │              │  │ DO? The verb, the task, the goal │   │
│  └─────────────┘  └─────────────────────────────────┘   │
│                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────┐   │
│  │ CONTEXT      │  │ What BACKGROUND does the model  │   │
│  │              │  │ need? Role, audience, situation  │   │
│  └─────────────┘  └─────────────────────────────────┘   │
│                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────┐   │
│  │ INPUT DATA   │  │ What MATERIAL should the model  │   │
│  │              │  │ work with? Text, data, examples  │   │
│  └─────────────┘  └─────────────────────────────────┘   │
│                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────┐   │
│  │ OUTPUT FORMAT│  │ What SHAPE should the answer    │   │
│  │              │  │ take? JSON, list, table, length  │   │
│  └─────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### Component 1: Instruction

The **instruction** is the core task — the verb that tells the model what to do.

**Weak instructions:**
```
"Dogs"                          → What about dogs?
"Something about marketing"     → Do what with marketing?
"Help"                          → Help with what?
```

**Strong instructions:**
```
"Summarize the following article in 3 bullet points"
"Translate this paragraph from English to Spanish"
"Compare and contrast these two approaches"
"Generate 10 product names for a sustainable water bottle brand"
"Debug the following Python function and explain the fix"
```

> **Tip:** Start your instruction with a strong action verb: Summarize, Translate, List, Compare, Analyze, Generate, Explain, Rewrite, Classify, Extract.

### Component 2: Context

**Context** provides the background the model needs to do the task well. This includes:

- **Role/persona**: "You are a senior data scientist..."
- **Audience**: "...writing for non-technical executives"
- **Situation**: "...during a quarterly review meeting"
- **Constraints**: "...in a company that uses only open-source tools"

**Without context:**
```
Prompt: "Explain machine learning"
Output: A generic, medium-depth explanation aimed at nobody in particular
```

**With context:**
```
Prompt: "You are a computer science professor. Explain machine learning 
to a class of first-year biology students who have no programming 
experience. Use biological analogies where possible."
Output: A tailored explanation using evolution, natural selection, and 
neural pathways as analogies — perfectly suited for the audience
```

### Component 3: Input Data

**Input data** is the raw material the model should work with. This could be:

- Text to summarize or translate
- Data to analyze
- Code to debug
- A conversation to continue
- A document to extract information from

**Example:**
```
Prompt: "Extract all email addresses from the following text:

Dear team, please contact john.doe@example.com for project updates. 
For billing questions, reach out to billing@company.org. The new 
intern's email is sarah.j@startup.io and the contractor can be 
reached at mike_wilson@freelance.net."
```

> **Tip:** Clearly separate input data from instructions using delimiters like triple backticks (```), XML tags (`<text>...</text>`), or clear labels ("INPUT:", "TEXT:", "DATA:").

### Component 4: Output Format

**Output format** tells the model exactly what shape the answer should take.

**Unspecified format:**
```
Prompt: "List the planets in our solar system"
Output: "The planets in our solar system are Mercury, Venus, Earth, 
Mars, Jupiter, Saturn, Uranus, and Neptune. Mercury is the closest..."
(Goes on for 3 paragraphs you didn't ask for)
```

**Specified format:**
```
Prompt: "List the planets in our solar system. Return ONLY a numbered 
list with the planet name and its distance from the sun in AU. 
No additional text."
Output:
1. Mercury — 0.39 AU
2. Venus — 0.72 AU
3. Earth — 1.00 AU
4. Mars — 1.52 AU
5. Jupiter — 5.20 AU
6. Saturn — 9.54 AU
7. Uranus — 19.19 AU
8. Neptune — 30.07 AU
```

**Common output format specifications:**
```
• "Return as JSON with keys: name, age, city"
• "Use a markdown table with columns: Feature, Pros, Cons"
• "Respond in exactly 3 bullet points"
• "Keep your response under 100 words"
• "Format as a numbered list"
• "Return only the answer, no explanation"
• "Use this template: [Name] is a [role] who [action]"
```

---

## 2. Putting It All Together

Here's a prompt that uses all four components:

```
[CONTEXT]
You are a senior nutritionist writing for a health-conscious cooking blog. 
Your audience is busy professionals aged 25-40 who want to eat healthier 
but have limited time to cook.

[INSTRUCTION]
Create a weekly meal prep plan for breakfasts.

[INPUT DATA]
Dietary constraints: No dairy, no gluten. Budget: under $50/week.
Available prep time: 2 hours on Sunday.
Kitchen equipment: Oven, stovetop, blender, basic utensils.

[OUTPUT FORMAT]
Return a markdown table with columns:
| Day | Meal | Prep Time | Calories | Key Nutrients |

Include a "Shopping List" section at the end grouped by grocery 
store section (Produce, Protein, Pantry). Keep the total plan 
under 300 words.
```

> **Key Insight:** You don't always need all four components. A simple factual question ("What year was the Eiffel Tower built?") needs only an instruction. But the more complex or specific your needs, the more components you should include.

---

## 3. Weak vs. Strong Prompts: Side-by-Side Comparison

### Pair 1: Writing Task

| Weak Prompt | Strong Prompt |
|---|---|
| "Write about dogs" | "Write a 200-word blog post about the three most common health issues in Golden Retrievers, targeting first-time dog owners. Include one preventive tip for each issue. Use a friendly, non-medical tone." |
| **Problem:** No task specificity, no audience, no length, no angle | **Why it works:** Specific topic, word count, audience, structure, tone |

### Pair 2: Summarization

| Weak Prompt | Strong Prompt |
|---|---|
| "Summarize this" | "Summarize the following article in exactly 3 bullet points. Each bullet should be one sentence. Focus on the key findings, not the methodology. Write for a non-technical audience.\n\n---\n[article text here]" |
| **Problem:** No length, no format, no focus area, no audience | **Why it works:** Exact format, focus area specified, audience defined, input clearly delimited |

### Pair 3: Code Generation

| Weak Prompt | Strong Prompt |
|---|---|
| "Give me code" | "Write a Python function called `validate_email` that takes a string and returns True if it's a valid email address, False otherwise. Use regex. Include type hints. Handle edge cases: empty string, missing @, multiple @, missing domain. Add a docstring with 3 usage examples. Do not use any external libraries." |
| **Problem:** No language, no task, no requirements, no constraints | **Why it works:** Language, function name, input/output, method, edge cases, documentation requirements, dependency constraints |

### Pair 4: Data Extraction

| Weak Prompt | Strong Prompt |
|---|---|
| "Make it better" | "Rewrite the following product description to be more compelling for online shoppers. Increase urgency by adding a time-limited offer. Keep the word count between 50-75 words. Maintain all factual claims. Target audience: tech-savvy millennials.\n\nOriginal: [text here]" |
| **Problem:** "Better" how? Better for whom? Better in what way? | **Why it works:** Clear definition of "better," specific tactics, word count, audience, constraints |

### Pair 5: Translation

| Weak Prompt | Strong Prompt |
|---|---|
| "Translate" | "Translate the following English marketing email into formal Brazilian Portuguese (pt-BR). Preserve the persuasive tone but adapt cultural references for a Brazilian audience. Keep all product names and brand terms in English. Flag any phrases that don't translate well with [NOTE: ...].\n\nEmail:\n[text here]" |
| **Problem:** Translate what? From/to what language? What register? | **Why it works:** Source/target language, register, cultural adaptation, handling of proper nouns, edge case protocol |

### Pair 6: Analysis

| Weak Prompt | Strong Prompt |
|---|---|
| "Analyze this data" | "Analyze the following monthly sales data for Q1 2025. Identify: (1) the top 3 performing products by revenue, (2) any month-over-month growth trends, (3) products with declining sales. Present findings in a markdown table, followed by a 100-word executive summary with one actionable recommendation.\n\nData:\n[CSV data here]" |
| **Problem:** Analyze how? What to look for? What output? | **Why it works:** Specific analyses requested, numbered structure, output format defined, actionable ending |

---

## 4. The "Garbage In, Garbage Out" Principle

This principle from computer science applies perfectly to prompt engineering:

```
  Low-quality prompt  ──→  Low-quality output
  ────────────────────────────────────────────
  "Write something"   ──→  Generic, rambling text

  High-quality prompt ──→  High-quality output
  ────────────────────────────────────────────
  "Write a 100-word    ──→  Focused, formatted,
   product description       persuasive copy
   for [product] aimed
   at [audience] in
   [tone] format..."
```

### The Effort-Quality Curve

```
Output Quality
    │
100%│                                    ●────────
    │                              ●─────
    │                        ●─────
 75%│                  ●─────
    │            ●─────
    │       ●────
 50%│  ●────
    │●──
 25%│
    │
  0%│──────────────────────────────────────────────
    0%       25%       50%       75%      100%
                   Prompt Effort

The first 25% of effort gets you from 0% to ~50% quality.
The next 25% gets you to ~75%.
Diminishing returns set in, but the gap between good and 
great often matters most for production use cases.
```

> **Key Insight:** You don't always need a perfect prompt. For quick, one-off tasks, a "good enough" prompt (50-75% effort) is fine. For production systems that will run thousands of times, invest in the last 25% — it compounds.

---

## 5. Common Prompt Anti-Patterns

### Anti-Pattern 1: The Vague Prompt
```
❌ "Help me with my project"
✅ "Review the following Python function for potential bugs. List each 
    bug with the line number, what's wrong, and how to fix it."
```
**Problem:** The model has to guess what "help" means.

### Anti-Pattern 2: The Overloaded Prompt
```
❌ "Write a blog post about AI, then translate it to Spanish, then 
    create a tweet thread from it, then generate 5 image prompts for 
    each section, and also write a press release version."

✅ Break it into 5 separate prompts, each focused on one task.
```
**Problem:** Too many tasks in one prompt leads to mediocre results on all of them. The model loses focus.

### Anti-Pattern 3: The Contradictory Prompt
```
❌ "Write a detailed technical analysis in 2 sentences. Include 
    comprehensive examples but keep it brief. Use formal language 
    but make it fun and casual."

✅ "Write a 2-sentence technical summary of [topic]. Use formal 
    but accessible language."
```
**Problem:** Contradictory requirements force the model to compromise on everything.

### Anti-Pattern 4: The Implicit Assumption
```
❌ "Fix this" (with no code or context provided)
❌ "Continue where we left off" (in a new conversation)
❌ "Use the usual format" (the model doesn't know your usual format)

✅ Always include the material the model needs to work with. 
   Never assume the model "remembers" or "knows" your preferences.
```
**Problem:** The model doesn't have access to your mental context.

### Anti-Pattern 5: The Kitchen Sink
```
❌ "I was thinking about maybe writing something, like perhaps 
    a blog post or maybe an article, about machine learning or 
    AI in general, or maybe specifically about neural networks, 
    and I was wondering if you could help me brainstorm some 
    ideas or maybe just write a draft or outline or something 
    that might work for a technical audience or maybe a general 
    audience, I'm not really sure yet..."

✅ "Brainstorm 5 blog post ideas about practical applications of 
    neural networks. For each idea, give a title and a 1-sentence 
    description. Target audience: developers with basic ML knowledge."
```
**Problem:** Rambling prompts dilute the signal. The model tries to address every half-formed thought instead of executing one clear task.

### Anti-Pattern 6: The No-Format Prompt
```
❌ "Compare React and Vue"
   (Output: 500-word essay that's hard to scan)

✅ "Compare React and Vue in a markdown table with these rows: 
    Learning Curve, Performance, Ecosystem, Community Size, 
    Best For. Keep each cell to 10 words or fewer."
```
**Problem:** Without format instructions, the model defaults to paragraphs — which are often not what you need.

---

## 6. Prompt Improvement Checklist

Use this checklist when writing or reviewing any prompt:

```
┌─────────────────────────────────────────────────────────┐
│              PROMPT IMPROVEMENT CHECKLIST                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  □ Does it have a clear ACTION VERB?                    │
│    (Summarize, List, Compare, Generate, Analyze...)     │
│                                                         │
│  □ Is the TASK specific and unambiguous?                │
│    (Could someone else understand exactly what I want?) │
│                                                         │
│  □ Is the CONTEXT sufficient?                           │
│    (Role, audience, situation — as needed)              │
│                                                         │
│  □ Is the INPUT DATA clearly provided and delimited?    │
│    (Using ```, XML tags, or clear labels)               │
│                                                         │
│  □ Is the OUTPUT FORMAT specified?                      │
│    (JSON, table, bullet list, length, structure)        │
│                                                         │
│  □ Are there any CONTRADICTIONS?                        │
│    ("Be detailed" + "Keep it short")                    │
│                                                         │
│  □ Is it ONE task or should it be SPLIT?                │
│    (Multiple tasks → multiple prompts)                  │
│                                                         │
│  □ Are CONSTRAINTS explicit?                            │
│    (What NOT to do, length limits, style rules)         │
│                                                         │
│  □ Would an EXAMPLE help clarify expectations?          │
│    (Show the model what "good" looks like)              │
│                                                         │
│  □ Is there anything IMPLICIT I should make EXPLICIT?   │
│    (Assumptions, background knowledge, preferences)     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Real-World Examples Across Different Tasks

### Example 1: Customer Support Email

```
You are a customer support agent for TechGadget Inc. A customer 
is frustrated because their wireless headphones disconnected during 
an important call.

Write a response email that:
1. Acknowledges their frustration empathetically
2. Provides 3 specific troubleshooting steps
3. Offers a replacement if steps don't work
4. Includes a 15% discount code for the inconvenience

Tone: Professional but warm. 
Length: 150-200 words.
Sign off as "Jamie, Customer Success Team"
```

### Example 2: Data Transformation

```
Convert the following CSV data into a JSON array. Each row becomes 
an object. Use camelCase for keys. Convert empty cells to null. 
Parse dates into ISO 8601 format (YYYY-MM-DD). Numbers should be 
actual numbers, not strings.

CSV:
name,age,email,join_date,score
Alice,30,alice@test.com,2024-01-15,95.5
Bob,,bob@test.com,2024-02-20,
Charlie,25,,2024-03-10,88.0
```

**Expected output:**
```json
[
  {
    "name": "Alice",
    "age": 30,
    "email": "alice@test.com",
    "joinDate": "2024-01-15",
    "score": 95.5
  },
  {
    "name": "Bob",
    "age": null,
    "email": "bob@test.com",
    "joinDate": "2024-02-20",
    "score": null
  },
  {
    "name": "Charlie",
    "age": 25,
    "email": null,
    "joinDate": "2024-03-10",
    "score": 88.0
  }
]
```

### Example 3: Code Review

```
Review the following Python function. For each issue found, provide:
- Line reference
- Severity (critical/warning/style)
- Description of the problem
- Suggested fix with code

Focus on: bugs, security issues, performance problems, and 
Python best practices. Ignore minor style preferences.

```python
def get_user_data(user_id):
    import requests
    url = "http://api.example.com/users/" + user_id
    response = requests.get(url)
    data = eval(response.text)
    password = data['password']
    return data
```

### Example 4: Content Strategy

```
You are a content strategist for a B2B SaaS company that sells 
project management software to mid-size engineering teams (50-200 
employees).

Generate a content calendar for the next 4 weeks. For each week, 
provide:
- 1 blog post (title + 30-word description)
- 2 social media posts (LinkedIn-style, under 200 characters each)
- 1 email newsletter topic (subject line + 1-sentence summary)

Theme for this month: "Reducing meeting overload"
Avoid: Generic productivity tips, references to competitors
Include: Data points or statistics where relevant
Format: Markdown table grouped by week
```

### Example 5: Technical Documentation

```
Write API documentation for the following endpoint. Follow the 
OpenAPI style. Include:
- Endpoint description (1-2 sentences)
- HTTP method and path
- Request parameters (path, query, body) with types and descriptions
- Response schema with example
- Error responses (400, 401, 404, 500)
- One curl example and one Python requests example

Endpoint behavior: Takes a user ID, returns their profile. 
Supports optional "fields" query param to select specific fields.
Requires Bearer token auth. Rate limited to 100 req/min.
Path: GET /api/v2/users/{user_id}
```

---

## 8. The Iterative Prompt Development Process

Great prompts rarely emerge fully formed. They're refined through iteration:

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Draft v1 │────→│ Test it   │────→│ Analyze  │────→│ Improve  │
│          │     │           │     │ output   │     │ prompt   │
└─────────┘     └──────────┘     └──────────┘     └────┬─────┘
     ↑                                                   │
     └───────────────────────────────────────────────────┘
                    Repeat until satisfied
```

### Iteration Example

**Version 1:**
```
Summarize this article.
```
*Problem: Output is 300 words, way too long.*

**Version 2:**
```
Summarize this article in 3 sentences.
```
*Problem: Summary misses the key finding.*

**Version 3:**
```
Summarize this article in 3 sentences. The first sentence should 
state the main finding. The second should explain the methodology. 
The third should note the limitations.
```
*Problem: Too technical for the intended audience.*

**Version 4 (final):**
```
Summarize this article in 3 sentences for a general audience with 
no scientific background. Sentence 1: main discovery in plain 
language. Sentence 2: how they figured it out (avoid jargon). 
Sentence 3: why it matters for everyday people.
```
*Output is exactly what was needed.*

> **Tip:** Keep a log of your prompt iterations. What you learn from each failure is valuable knowledge for future prompts.

---

## Exercises

### Exercise 1: Component Identification
For each prompt below, identify which of the four components (Instruction, Context, Input Data, Output Format) are present and which are missing:

1. "Translate this to French: 'Good morning, how are you?'"
2. "You are a fitness coach. Help me."
3. "Analyze the following and return JSON: [data]"
4. "What's the weather like?"

### Exercise 2: Prompt Improvement
Take each weak prompt and rewrite it using all four components:
1. "Write about climate change"
2. "Fix my code"
3. "Make a presentation"

### Exercise 3: Anti-Pattern Detection
Identify the anti-pattern in each prompt:
1. "Write a comprehensive but very brief overview with detailed examples but keep it minimal"
2. "You know what I want, just do the usual thing"
3. "Summarize this article AND translate it to 5 languages AND create a quiz AND write social media posts about it"

---

## Summary

```
┌──────────────────────────────────────────────────────────┐
│                    MODULE 2 RECAP                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Four components: Instruction + Context +                │
│                   Input Data + Output Format              │
│                                                          │
│  Strong prompts are: Specific, unambiguous, formatted    │
│                                                          │
│  Anti-patterns to avoid: Vague, overloaded,              │
│    contradictory, implicit, kitchen sink, no-format      │
│                                                          │
│  Garbage in → garbage out (prompt quality = output       │
│  quality)                                                │
│                                                          │
│  Prompts are iterative — expect to refine 3-5 times     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

> **Next Module:** Module 3 introduces **zero-shot and few-shot prompting** — the technique of including examples in your prompt to dramatically improve accuracy.
