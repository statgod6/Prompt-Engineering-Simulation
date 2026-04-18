# Module 1: What Is Prompt Engineering?

## Learning Objectives

By the end of this module, you will:

- Understand what Large Language Models are and how they work at a high level
- Know what tokens are and how text is broken into tokens
- Understand context windows and their practical limits
- Grasp how LLMs generate text through next-token prediction
- Know what temperature is and how it affects outputs
- Define prompt engineering and articulate why it matters
- Describe the prompt → model → output pipeline
- Dispel common misconceptions about LLMs

---

## 1. What Is a Large Language Model?

A **Large Language Model (LLM)** is a neural network trained on massive amounts of text data — books, articles, websites, code repositories, and more — to understand and generate human language.

Think of an LLM as an extraordinarily sophisticated **autocomplete engine**. When you type a message on your phone, your keyboard predicts the next word. An LLM does the same thing, but at a vastly more capable level — it can write essays, answer questions, translate languages, write code, and reason through problems.

### Key Characteristics

| Property | Description |
|---|---|
| **Parameters** | The "knobs" the model has learned to tune. GPT-4 has hundreds of billions. |
| **Training data** | Terabytes of text from the internet, books, code, and more. |
| **Architecture** | Nearly all modern LLMs use the **Transformer** architecture (introduced in 2017). |
| **Pre-training** | Models learn language patterns through unsupervised learning on raw text. |
| **Fine-tuning** | Additional training on specific tasks or human feedback (RLHF). |

### Popular LLMs

```
Model Family       Organization     Notable For
─────────────────────────────────────────────────
GPT-4 / GPT-4o    OpenAI           General-purpose, strong reasoning
Claude 3.5        Anthropic        Safety-focused, long context
Llama 3           Meta             Open-weight, community ecosystem
Gemini Pro        Google           Multimodal, large context
Mistral Large     Mistral AI       Efficient, strong multilingual
```

> **Key Insight:** LLMs don't "know" things the way humans do. They've learned statistical patterns in language. They predict what text is likely to come next based on what they've seen during training.

---

## 2. Tokens and Tokenization

### What Is a Token?

A **token** is the fundamental unit of text that an LLM processes. Before the model sees your text, it's broken into tokens — small chunks that might be words, parts of words, or even individual characters.

### How Tokenization Works

Tokenization converts your text into a sequence of numerical IDs that the model can process:

```
Your text:       "Hello, how are you today?"
Tokenized:       ["Hello", ",", " how", " are", " you", " today", "?"]
Token IDs:       [9906, 11, 1268, 527, 499, 3432, 30]
Token count:     7 tokens
```

### Tokenization Examples

Different texts tokenize differently. Here's how various inputs break down:

```
Input: "Hello"
Tokens: ["Hello"]                     → 1 token

Input: "Hello, world!"
Tokens: ["Hello", ",", " world", "!"] → 4 tokens

Input: "antidisestablishmentarianism"
Tokens: ["anti", "dis", "establish", "ment", "arian", "ism"] → 6 tokens

Input: "こんにちは"
Tokens: ["こん", "にち", "は"]         → 3 tokens (non-Latin text often uses more tokens)

Input: "def fibonacci(n):"
Tokens: ["def", " fibonacci", "(", "n", "):"]  → 5 tokens
```

### Why Tokens Matter

1. **Cost**: API pricing is per token (input + output). A 1,000-word essay ≈ 1,300-1,500 tokens.
2. **Context limits**: Models have a maximum token limit for input + output combined.
3. **Speed**: More tokens = longer generation time.

### Rules of Thumb for English Text

```
┌──────────────────────────────────────────┐
│  1 token ≈ 4 characters                 │
│  1 token ≈ 0.75 words                   │
│  100 tokens ≈ 75 words                  │
│  1,000 words ≈ 1,300 tokens             │
│  1 page of text ≈ 500-600 tokens        │
└──────────────────────────────────────────┘
```

> **Tip:** Many LLM providers offer a tokenizer tool. OpenAI's [tiktoken](https://github.com/openai/tiktoken) library lets you count tokens programmatically. Use it to estimate costs before sending large prompts.

### Code: Counting Tokens with Python

```python
import tiktoken

encoder = tiktoken.encoding_for_model("gpt-4o")

text = "Prompt engineering is the art of communicating with AI."
tokens = encoder.encode(text)

print(f"Text: {text}")
print(f"Tokens: {tokens}")
print(f"Token count: {len(tokens)}")
# Output:
# Text: Prompt engineering is the art of communicating with AI.
# Tokens: [36062, 15009, 374, 279, 1989, 315, communicating, 449, 15592, 13]
# Token count: 10
```

---

## 3. Context Windows and Their Limits

### What Is a Context Window?

The **context window** is the maximum number of tokens a model can process in a single request — this includes both your input (prompt) and the model's output (response) combined.

```
┌─────────────────────────────────────────────────────┐
│                  CONTEXT WINDOW                      │
│                                                     │
│  ┌──────────────────┐  ┌────────────────────────┐   │
│  │   YOUR PROMPT     │  │   MODEL'S RESPONSE     │   │
│  │   (input tokens)  │  │   (output tokens)      │   │
│  └──────────────────┘  └────────────────────────┘   │
│                                                     │
│  input_tokens + output_tokens ≤ context_window      │
└─────────────────────────────────────────────────────┘
```

### Context Window Sizes (2024-2025)

```
Model               Context Window    Approx. Pages
────────────────────────────────────────────────────
GPT-4o              128K tokens       ~200 pages
Claude 3.5 Sonnet   200K tokens       ~300 pages
Llama 3 70B         8K tokens         ~12 pages
Gemini 1.5 Pro      1M tokens         ~1,500 pages
Mistral Large       32K tokens        ~50 pages
```

### Practical Implications

**What fits in 128K tokens?**
- A full novel (~80,000 words)
- An entire codebase of a small application
- Hundreds of pages of documentation

**What DOESN'T fit?**
- The entire Wikipedia
- A full legal discovery dump
- Very large codebases

### The "Lost in the Middle" Problem

Research shows that LLMs pay most attention to the **beginning** and **end** of the context window, and tend to "forget" information in the middle.

```
Attention Level:

High  █████                              █████
      ████                                ████
Med   ███                                  ███
      ██            ██  ██                  ██
Low   █         ████████████                 █
      ─────────────────────────────────────────
      Beginning      Middle              End
      of prompt                      of prompt
```

> **Tip:** Place your most important instructions at the **beginning** and **end** of your prompt. Don't bury critical information in the middle of a long context.

---

## 4. How LLMs Generate Text

### Next-Token Prediction

At its core, an LLM does one thing: given a sequence of tokens, it predicts the **probability distribution** for the next token.

```
Input:  "The capital of France is"

Model's probability distribution for next token:
  "Paris"      → 92.3%
  "a"          → 2.1%
  "known"      → 1.4%
  "the"        → 0.8%
  "located"    → 0.6%
  ... thousands of other tokens with tiny probabilities
```

The model then **samples** from this distribution (influenced by temperature — more on that below), selects one token, appends it, and repeats:

```
Step 1: "The capital of France is" → selects "Paris"
Step 2: "The capital of France is Paris" → selects ","
Step 3: "The capital of France is Paris," → selects " which"
Step 4: "The capital of France is Paris, which" → selects " is"
...and so on until a stop condition is met.
```

### The Autoregressive Loop

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Input tokens  ──→  [LLM]  ──→  Next token    │
│        ↑                              │         │
│        │                              │         │
│        └──────── append ◄─────────────┘         │
│                                                 │
│   Repeat until: max_tokens reached OR           │
│                 stop token generated OR          │
│                 stop sequence matched            │
└─────────────────────────────────────────────────┘
```

### Important Consequences

1. **No backtracking**: The model writes left-to-right, one token at a time. It cannot go back and revise earlier tokens.
2. **No planning ahead**: The model doesn't outline an answer first, then write it. Each token decision is made based only on what came before.
3. **Order matters**: The same set of instructions in a different order can produce different results.

> **Key Insight:** This is why prompt engineering matters so much. The model is a sophisticated pattern-completion engine. The better your prompt sets up the pattern, the better the completion will be.

---

## 5. Temperature: Controlling Randomness

### What Is Temperature?

**Temperature** is a parameter that controls how "random" or "creative" the model's token selection is. It adjusts the probability distribution before sampling.

### How Temperature Works

```
Original probabilities for next token after "The best programming language is":

Token          Raw Prob    Temp=0     Temp=0.7   Temp=1.0   Temp=2.0
──────────────────────────────────────────────────────────────────────
"Python"       45%         100%*      58%        45%        28%
"JavaScript"   25%         0%         22%        25%        22%
"C"            10%         0%         9%         10%        14%
"Rust"         8%          0%         5%         8%         13%
"Java"         5%          0%         3%         5%         10%
"Go"           3%          0%         1%         3%         7%
"COBOL"        0.1%        0%         0%         0.1%       2%
other          3.9%        0%         2%         3.9%       4%

* At temp=0, the highest-probability token is ALWAYS selected
```

### Temperature Spectrum

```
Temperature 0.0 ──────────────── 1.0 ──────────────── 2.0
            │                     │                     │
       Deterministic         Balanced              Chaotic
       Always picks the      Natural mix of        Wild, unexpected
       most likely token     predictability         token choices
            │                 & variety              │
       Best for:             Best for:          Best for:
       • Facts               • General chat      • Brainstorming
       • Math                • Creative writing   • Poetry
       • Code                • Explanations       • Nothing else
       • Classification      • Most tasks           (usually)
```

### Temperature in Practice

**Temperature 0 — Deterministic:**
```
Prompt: "What is 2 + 2?"
Response: "2 + 2 = 4."
(Run it 100 times → same answer every time)
```

**Temperature 0.7 — Balanced (default for most APIs):**
```
Prompt: "Write a one-sentence story about a cat."
Run 1: "The old tabby cat watched the rain from the windowsill, 
        remembering summers long past."
Run 2: "A curious calico named Muffin discovered that the neighbor's 
        garden held the most extraordinary mice."
Run 3: "In the quiet of midnight, the black cat slipped through the 
        moonlit alley on velvet paws."
```

**Temperature 2.0 — Chaotic:**
```
Prompt: "Write a one-sentence story about a cat."
Run 1: "Feline orchestrations beneath copper lanterns while 
        mushrooms debate territorial fiscal policy."
(Grammatically questionable, semantically bizarre)
```

> **Tip:** For most prompt engineering tasks, use **temperature 0** when you need consistent, reproducible results (classification, extraction, factual Q&A) and **temperature 0.5-0.8** when you want some creative variety.

---

## 6. What Is Prompt Engineering?

### Definition

**Prompt engineering** is the practice of designing, structuring, and iterating on the text inputs (prompts) given to a Large Language Model to elicit the desired output.

It's the bridge between what you want and what the model produces.

### Why It Matters

```
Without Prompt Engineering          With Prompt Engineering
─────────────────────────          ────────────────────────
"Write about dogs"                  "Write a 200-word informative
                                     paragraph about the history
 → Generic, rambling essay           of dog domestication, citing
   about dogs in general             the latest archaeological
                                     evidence. Use a scientific
                                     tone suitable for a college
                                     biology textbook."

                                     → Focused, well-structured
                                       paragraph with specific
                                       historical details
```

### The Core Skill

Prompt engineering is fundamentally about **communication**. The model is an incredibly capable tool, but it has no mind-reading ability. You must:

1. **Be specific** about what you want
2. **Provide context** the model needs
3. **Define the format** of the output
4. **Set constraints** and boundaries
5. **Iterate** when the output isn't right

### Who Uses Prompt Engineering?

```
Role                    Use Case
────────────────────────────────────────────────────
Software developers     Code generation, debugging, documentation
Data scientists         Data analysis, visualization, interpretation
Content writers         Drafting, editing, brainstorming
Researchers             Literature review, summarization, analysis
Business analysts       Report generation, data extraction
Customer support        Response templates, knowledge bases
Product managers        PRD writing, feature spec generation
Educators               Curriculum design, quiz generation
```

---

## 7. The Prompt → Model → Output Pipeline

### The Full Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│   PROMPT     │────→│   MODEL      │────→│   OUTPUT     │
│              │     │              │     │              │
│ • System msg │     │ • Weights    │     │ • Response   │
│ • User msg   │     │ • Temperature│     │ • Tokens used│
│ • Examples   │     │ • Max tokens │     │ • Finish     │
│ • Context    │     │ • Top-p      │     │   reason     │
│              │     │ • Model ID   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                                          
   You control           You configure        You evaluate
   the content           the behavior         the quality
```

### What You Control

**In the prompt (biggest lever):**
- The instructions, context, and examples you provide
- The format and structure of your request
- The constraints you set

**In the parameters:**
- `temperature` — randomness (0 to 2)
- `max_tokens` — maximum output length
- `top_p` — nucleus sampling threshold
- `model` — which LLM to use
- `stop` — sequences that halt generation

### A Real API Call

```python
import openai

response = openai.chat.completions.create(
    model="gpt-4o",
    temperature=0,
    max_tokens=500,
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant that explains "
                       "concepts in simple terms."
        },
        {
            "role": "user",
            "content": "What is photosynthesis? Explain in 3 sentences."
        }
    ]
)

print(response.choices[0].message.content)
# "Photosynthesis is the process by which plants convert sunlight,
#  water, and carbon dioxide into glucose and oxygen. It takes place
#  primarily in the leaves, using a green pigment called chlorophyll
#  to capture light energy. This process is essential for life on
#  Earth, as it produces the oxygen we breathe and forms the base
#  of most food chains."
```

---

## 8. Common Misconceptions

### Misconception 1: "LLMs understand what they're saying"

**Reality:** LLMs produce statistically likely text based on patterns in training data. They don't have understanding, beliefs, or consciousness. A model can write a convincing essay about quantum physics without "understanding" quantum physics.

### Misconception 2: "More text = better prompt"

**Reality:** Longer prompts aren't inherently better. A concise, well-structured prompt often outperforms a verbose one. Extra text can actually confuse the model or dilute your instructions.

### Misconception 3: "The model remembers previous conversations"

**Reality:** Each API call is independent. The model has **no memory** between requests unless you explicitly include previous conversation history in the prompt. Chat interfaces simulate memory by resending the conversation each time.

### Misconception 4: "There's one perfect prompt for every task"

**Reality:** Prompt engineering is iterative. Different models respond differently to the same prompt. What works for GPT-4o might not work for Llama 3. You must test and adapt.

### Misconception 5: "LLMs are always confident and correct"

**Reality:** LLMs can generate confident-sounding text that is completely wrong — this is called **hallucination**. Always verify factual claims, especially for critical applications.

### Misconception 6: "Prompt engineering is just about being polite"

**Reality:** While politeness doesn't hurt, prompt engineering is about **structure, clarity, and precision**. Saying "please" doesn't improve output quality; being specific about format, constraints, and expectations does.

---

## 9. Key Terminology Glossary

| Term | Definition |
|---|---|
| **LLM** | Large Language Model — a neural network trained on vast text data to generate language |
| **Token** | The smallest unit of text processed by an LLM (~4 characters in English) |
| **Tokenization** | The process of converting text into tokens |
| **Context window** | Maximum number of tokens (input + output) a model can handle per request |
| **Temperature** | Parameter controlling output randomness (0 = deterministic, 2 = chaotic) |
| **Top-p (nucleus sampling)** | Alternative to temperature; selects from the smallest set of tokens whose cumulative probability exceeds p |
| **Max tokens** | The maximum number of tokens the model will generate in its response |
| **Prompt** | The text input you send to the model |
| **Completion** | The text output the model generates |
| **System message** | A special instruction that sets the model's behavior and persona |
| **User message** | The actual request or question from the user |
| **Hallucination** | When a model generates confident but factually incorrect information |
| **Fine-tuning** | Additional training of a model on specific data for specialized tasks |
| **RLHF** | Reinforcement Learning from Human Feedback — training technique used to align models |
| **Inference** | The process of running a trained model to generate output |
| **Latency** | Time between sending a prompt and receiving the first token of the response |
| **Streaming** | Receiving the model's response token by token as it's generated |
| **Stop sequence** | A specific string that tells the model to stop generating |
| **Zero-shot** | Prompting without examples |
| **Few-shot** | Prompting with examples included in the prompt |

---

## Exercises

### Exercise 1: Token Estimation
Estimate the token count for the following texts, then check using a tokenizer tool:
1. "Hello, world!"
2. "The quick brown fox jumps over the lazy dog."
3. A 500-word email you've written

### Exercise 2: Temperature Exploration
Using the simulation lab, try the prompt "Write a haiku about programming" at:
- Temperature 0 (run 3 times — are results identical?)
- Temperature 0.7 (run 3 times — how much variation?)
- Temperature 1.5 (run 3 times — what happens?)

### Exercise 3: Spot the Misconception
Identify what's wrong with each claim:
1. "I asked ChatGPT yesterday and it remembered my name today without me telling it."
2. "My prompt is 5 pages long so it must be really good."
3. "The AI said it's 95% confident, so it's probably right."

---

## Summary

```
┌──────────────────────────────────────────────────────────┐
│                    MODULE 1 RECAP                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  LLMs = sophisticated pattern-completion engines         │
│                                                          │
│  Tokens = smallest text units (~4 chars each)            │
│                                                          │
│  Context window = max tokens per request (input+output)  │
│                                                          │
│  Generation = next-token prediction, one at a time       │
│                                                          │
│  Temperature = randomness control (0→2)                  │
│                                                          │
│  Prompt engineering = designing inputs for desired        │
│  outputs through structure, clarity, and iteration       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

> **Next Module:** Now that you understand the fundamentals, Module 2 dives into the **anatomy of a good prompt** — the four components that make prompts effective.
