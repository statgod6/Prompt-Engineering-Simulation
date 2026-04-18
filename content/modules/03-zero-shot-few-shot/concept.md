# Module 3: Zero-Shot and Few-Shot Prompting

## Learning Objectives

By the end of this module, you will:

- Understand the difference between zero-shot, one-shot, and few-shot prompting
- Know when to use each approach
- Design effective few-shot examples that maximize model accuracy
- Recognize when few-shot prompting helps and when it hurts
- Apply the "Example Ladder" framework to systematically improve prompts

---

## 1. Zero-Shot Prompting

### Definition

**Zero-shot prompting** means giving the model a task with **no examples** — just the instruction. You're relying entirely on the model's pre-training knowledge to understand what you want.

### Example

```
Prompt:
  Classify the following movie review as "positive" or "negative".

  Review: "The cinematography was breathtaking, but the plot felt 
  rushed and the ending left me unsatisfied."

  Sentiment:
```

```
Output:
  negative
```

The model knows what sentiment classification is from its training data. You didn't need to show it any examples — it understood the task from the instruction alone.

### When Zero-Shot Works Well

```
✅ Tasks the model has seen extensively in training:
   • Sentiment analysis
   • Translation
   • Summarization
   • Simple Q&A
   • Grammar correction
   • Code generation for common patterns

✅ When your task is clearly described:
   • "Translate this English text to French"
   • "Is this email spam or not spam?"
   • "What is the capital of Japan?"
```

### When Zero-Shot Falls Short

```
❌ Custom classification schemas:
   "Classify as tier-1, tier-2, or tier-3 support ticket"
   (Model doesn't know YOUR tier definitions)

❌ Specific output formats:
   "Return results in our internal report format"
   (Model has never seen your format)

❌ Domain-specific tasks:
   "Tag this medical note with ICD-10 codes"
   (Needs examples to understand the coding system)

❌ Nuanced judgments:
   "Is this joke appropriate for our brand?"
   (Model doesn't know your brand guidelines)
```

---

## 2. One-Shot Prompting

### Definition

**One-shot prompting** adds a **single example** before the actual task. This one example helps the model understand the pattern you expect.

### Example

```
Prompt:
  Classify the sentiment of movie reviews.

  Example:
  Review: "An absolute masterpiece. Every scene was perfect."
  Sentiment: positive

  Now classify this:
  Review: "I walked out halfway through. Terrible acting."
  Sentiment:
```

```
Output:
  negative
```

### The Power of One Example

One example can communicate:

1. **The format** you want (e.g., just the label, not a paragraph)
2. **The labels** available (e.g., "positive" not "good" or "favorable")
3. **The granularity** (e.g., just "positive"/"negative", not a detailed analysis)
4. **The style** of reasoning (e.g., direct answer, no explanation)

### One-Shot vs. Zero-Shot Comparison

```
ZERO-SHOT:
  Prompt:  "Classify this review as positive or negative:
            'The food was okay but the service was slow.'"
  Output:  "The review is mostly negative. While the reviewer found 
            the food acceptable, they were dissatisfied with the 
            service speed. I would classify this as negative."

ONE-SHOT:
  Prompt:  "Classify movie reviews.
            
            Review: 'Loved every minute!' → positive
            
            Review: 'The food was okay but the service was slow.' →"
  Output:  "negative"
```

Notice how the one-shot version taught the model to:
- Return just the label (not a paragraph)
- Use the exact format (label after →)
- Skip the explanation

---

## 3. Few-Shot Prompting

### Definition

**Few-shot prompting** provides **3-5 examples** (sometimes more) to establish a strong pattern for the model to follow.

### Example: Email Classification

```
Prompt:
  Classify each email into exactly one category: 
  billing, technical, sales, or general.

  Email: "I was charged twice for my subscription last month."
  Category: billing

  Email: "The app crashes every time I try to upload a file larger 
  than 10MB."
  Category: technical

  Email: "Do you offer enterprise pricing for teams over 500?"
  Category: sales

  Email: "What are your office hours?"
  Category: general

  Email: "My invoice shows a different amount than what was quoted."
  Category:
```

```
Output:
  billing
```

### Why Few-Shot Works

Each example teaches the model more about the pattern:

```
Example 1:  "Here's what the task looks like"
Example 2:  "Here's another case — notice the pattern?"
Example 3:  "Here's an edge case to watch for"
Example 4:  "And here's a different category"
Example 5:  "Now you've seen the full range"
```

The model builds an increasingly accurate internal representation of:
- What the possible outputs are
- What features distinguish each category
- What format to use
- How confident to be

---

## 4. The Example Ladder

The **Example Ladder** is a framework for understanding how accuracy improves as you add more examples:

```
Accuracy
  │
  │                                          ●─── 5-shot (93%)
95│                                    ●─────
  │                              ●─────       (diminishing returns)
90│                        ●─────
  │                  ●─────               ●─── 3-shot (90%)
85│            ●─────
  │      ●─────
80│●─────                            ●─── 1-shot (82%)
  │
75│                             ●─── 0-shot (76%)
  │
70│
  └──────────────────────────────────────────────
    0-shot    1-shot    3-shot    5-shot    10-shot
                Number of Examples
```

### Key Observations

1. **Biggest jump**: Zero-shot → one-shot (teaches format + basic pattern)
2. **Sweet spot**: 3-5 examples (covers main categories + edge cases)
3. **Diminishing returns**: Beyond 5-7 examples, accuracy gains flatten
4. **Potential decline**: Too many examples can actually hurt (see Section 6)

### When to Climb the Ladder

| Situation | Recommended Approach |
|---|---|
| Simple, well-known task | Zero-shot |
| Need specific output format | One-shot |
| Multiple categories/classes | 3-shot (one per category) |
| Nuanced/ambiguous cases | 5-shot (include edge cases) |
| Critical accuracy requirement | 5+ shot with diverse examples |

---

## 5. Best Practices for Selecting Few-Shot Examples

### Practice 1: Cover All Categories

If you have 4 possible outputs, include at least one example of each:

```
✅ Good: One example each of positive, negative, neutral, mixed
❌ Bad:  Three positive examples and one negative
         (Model becomes biased toward "positive")
```

### Practice 2: Include Edge Cases

Don't just pick the easy examples — include the tricky ones:

```
Easy:     "I LOVE this product!!!" → positive       (obvious)
Easy:     "Terrible. Broken. Useless." → negative   (obvious)
Edge:     "It's fine, I guess." → neutral            (ambiguous)
Edge:     "Best worst decision I ever made" → mixed  (complex)
Tricky:   "Yeah, 'great' service. Thanks." → negative (sarcastic)
```

### Practice 3: Match the Distribution

Your examples should roughly match the distribution of real data:

```
If your actual data is:
  60% billing, 20% technical, 15% sales, 5% general

Your examples should NOT be:
  1 billing, 1 technical, 1 sales, 1 general (equal distribution)

Better:
  3 billing, 1 technical, 1 sales (matches reality)
```

### Practice 4: Use Diverse Examples

Within each category, vary the examples:

```
❌ All similar:
  "I love it!" → positive
  "I really love it!" → positive
  "Love this so much!" → positive

✅ Diverse:
  "The quality exceeded my expectations" → positive
  "Fast shipping and great customer service" → positive
  "It's not perfect, but honestly it's really good" → positive
```

### Practice 5: Order Matters

Research suggests the order of examples can affect performance:

```
Recommended ordering strategies:
1. Random shuffle (reduces order bias)
2. Most similar to the test case last (recency effect)
3. Alternating categories (prevents runs)

Avoid:
- All examples of one category grouped together
- Always putting the "easy" examples first
```

### Practice 6: Format Consistency

Every example must use the exact same format:

```
✅ Consistent:
  Input: "text here" → Category: positive
  Input: "text here" → Category: negative
  Input: "text here" → Category: neutral

❌ Inconsistent:
  "text here" is positive
  Input: "text here" → negative
  The text "text here" → Category: neutral
```

---

## 6. When Few-Shot Hurts

Few-shot prompting isn't always better. Here's when it can backfire:

### Problem 1: Token Waste

Each example consumes tokens from your context window:

```
Example calculation:
  System prompt:     100 tokens
  5 few-shot examples: 500 tokens (100 each)
  Actual input:      200 tokens
  ─────────────────────────────
  Total input:       800 tokens

For a model with 8K context window:
  That's 10% of your context spent on examples.
  For a model with 128K: negligible.
```

> **Rule of thumb:** If your examples consume more than 20% of the context window, consider whether they're all necessary.

### Problem 2: Overfitting to Examples

The model may latch onto irrelevant patterns in your examples:

```
Examples:
  "The red car is fast" → positive
  "The blue car is slow" → negative
  "The red bike is great" → positive

Test: "The blue house is beautiful"
Model output: negative  ← WRONG! It learned "blue = negative"
```

**Fix:** Ensure your examples don't have spurious correlations (color, length, specific words that correlate with the label but shouldn't).

### Problem 3: Format Lock-In

If all your examples are short, the model may produce short outputs even when the test case warrants a longer answer:

```
Examples:
  Q: "What is 2+2?" → "4"
  Q: "Capital of France?" → "Paris"
  Q: "Largest ocean?" → "Pacific"

Test: "Explain the theory of relativity"
Model: "E=mc²"  ← Too short! Model learned to give one-word answers
```

**Fix:** Include at least one example with a longer, detailed response if your task might require it.

### Problem 4: Example Contradictions

If your examples are inconsistent, the model gets confused:

```
❌ Contradictory:
  "The movie was okay" → positive
  "The food was okay" → negative
  
  (Why is "okay" positive in one and negative in the other?)
```

**Fix:** Ensure your examples are internally consistent. If "okay" is neutral in your schema, label it neutral in all examples.

---

## 7. Comparison Table: Zero vs. One vs. Few Shot

| Aspect | Zero-Shot | One-Shot | Few-Shot (3-5) |
|---|---|---|---|
| **Examples needed** | 0 | 1 | 3-5 |
| **Token cost** | Lowest | Low | Moderate |
| **Setup time** | None | Minimal | Some effort |
| **Format control** | Low | Good | Excellent |
| **Accuracy (typical)** | Good | Better | Best |
| **Edge case handling** | Poor | Fair | Good |
| **Risk of overfitting** | None | Low | Moderate |
| **Best for** | Common tasks | Format teaching | Classification, extraction |
| **Worst for** | Custom schemas | Complex tasks | Token-limited contexts |

### Decision Flowchart

```
                    Start
                      │
                      ▼
          ┌─────────────────────┐
          │ Is this a common,    │
          │ well-defined task?   │──── Yes ──→ Try ZERO-SHOT first
          └─────────────────────┘
                      │ No
                      ▼
          ┌─────────────────────┐
          │ Do you mainly need   │
          │ format control?      │──── Yes ──→ Try ONE-SHOT
          └─────────────────────┘
                      │ No
                      ▼
          ┌─────────────────────┐
          │ Are there multiple   │
          │ categories or edge   │──── Yes ──→ Use FEW-SHOT (3-5)
          │ cases to cover?      │
          └─────────────────────┘
                      │ No
                      ▼
          ┌─────────────────────┐
          │ Is accuracy critical │
          │ for production use?  │──── Yes ──→ Use FEW-SHOT (5+)
          └─────────────────────┘              + systematic testing
                      │ No
                      ▼
              Start with ONE-SHOT
              and iterate as needed
```

---

## 8. Advanced Few-Shot Techniques

### Chain-of-Thought Few-Shot

Instead of just showing input → output, show the reasoning:

```
Standard few-shot:
  "The movie was surprisingly good despite bad reviews" → positive

Chain-of-thought few-shot:
  "The movie was surprisingly good despite bad reviews"
  Reasoning: The key word is "surprisingly good" which is positive. 
  "Despite bad reviews" is a concession, not the main sentiment. 
  The overall feeling expressed is positive.
  → positive
```

This teaches the model HOW to think, not just WHAT to output.

### Dynamic Few-Shot Selection

Instead of using the same examples for every input, select examples that are most similar to the current input:

```
If input is about food:
  Use food-related examples

If input is about technology:
  Use technology-related examples

If input is sarcastic:
  Use sarcastic examples
```

This technique is especially powerful when combined with embedding-based similarity search.

### Negative Examples

Show the model what NOT to do:

```
✅ Correct: 
  "The package arrived on Tuesday" → neutral
  (This is a factual statement with no sentiment)

❌ Incorrect: 
  "The package arrived on Tuesday" → positive
  (Don't assume arrival = satisfaction. Stick to expressed sentiment.)
```

---

## Exercises

### Exercise 1: The Escalation Challenge

Start with a zero-shot prompt for this task: "Classify customer support emails as urgent, normal, or low priority."

Test it on these inputs:
1. "My account has been hacked and someone is making purchases!"
2. "Can you update my billing address?"
3. "Just wanted to say thanks for great service last week."
4. "The site is completely down. None of our 500 employees can work."
5. "When does the summer sale start?"

Now add 1, 3, and 5 examples. Does accuracy improve at each level?

### Exercise 2: Spot the Bad Examples

What's wrong with this few-shot prompt?

```
Classify as spam or not-spam:

"Buy now! Limited offer!" → spam
"AMAZING DEAL click here" → spam
"FREE money no catch" → spam
"Meeting tomorrow at 3pm" → not-spam

Now classify: "Hey, check out this new restaurant downtown!"
```

### Exercise 3: Build Your Own Classifier

Using the Example Ladder approach, build a 5-shot prompt that classifies restaurant reviews into: "food", "service", "ambiance", "value", or "overall". Test it on 10 reviews you write yourself.

---

## Summary

```
┌──────────────────────────────────────────────────────────┐
│                    MODULE 3 RECAP                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Zero-shot: No examples. Good for common tasks.          │
│                                                          │
│  One-shot: 1 example. Great for teaching format.         │
│                                                          │
│  Few-shot: 3-5 examples. Best for classification and     │
│    tasks with multiple categories or edge cases.         │
│                                                          │
│  The Example Ladder: Biggest gain is 0→1 shot.          │
│  Diminishing returns after 5 examples.                   │
│                                                          │
│  Choose examples wisely: diverse, representative,        │
│  consistent, and including edge cases.                   │
│                                                          │
│  Watch out for: token waste, overfitting to examples,    │
│  format lock-in, and contradictory examples.             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

> **Next Module:** Module 4 explores **role and persona prompting** — how to use system messages and personas to dramatically change model behavior.
