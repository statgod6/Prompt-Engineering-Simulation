# Module 12: RAG Prompting — Retrieval-Augmented Generation

## Introduction

Language models know a lot—but they don't know **your** data. They can't read your company's internal wiki, your product documentation, or the PDF you uploaded five minutes ago. **Retrieval-Augmented Generation (RAG)** solves this by injecting relevant documents directly into the prompt, grounding the model's responses in **your** information.

RAG is one of the most commercially important prompt engineering patterns. It powers chatbots that answer from knowledge bases, search engines with AI summaries, and enterprise assistants that reason over internal documents.

This module covers:

- What RAG is and why it matters
- Context injection techniques
- Document grounding and citation requirements
- Hallucination reduction strategies
- Chunk sizing and relevance scoring
- "Answer only from provided documents" patterns
- Common failure modes and how to prevent them

---

## What Is RAG?

**Retrieval-Augmented Generation** is a two-step process:

1. **Retrieve** — Find relevant documents or passages from a knowledge base
2. **Generate** — Feed those documents to the LLM as context, and ask it to answer based on them

```
User Question
      │
      ▼
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Retrieval   │ ──▶ │  Augment    │ ──▶ │  Generate    │
│  (search KB) │     │  (inject    │     │  (LLM answer │
│              │     │   into      │     │   grounded   │
│              │     │   prompt)   │     │   in docs)   │
└─────────────┘     └─────────────┘     └──────────────┘
```

### Why Not Just Use the Model's Knowledge?

| Limitation | RAG Solution |
|-----------|-------------|
| Training data is stale (cutoff date) | Retrieve up-to-date documents |
| No access to private/internal data | Retrieve from your own knowledge base |
| Hallucinations on specific facts | Ground answers in retrieved documents |
| No source attribution | Cite specific documents and passages |
| Generic answers | Provide domain-specific context |

> **Tip:** Think of RAG as giving the model an "open-book exam" instead of a "closed-book exam." The model still does the reasoning, but it has your documents to reference.

---

## Context Injection Techniques

Context injection is the art of inserting retrieved documents into the prompt effectively. How you structure the injected context significantly impacts answer quality.

### Technique 1: Simple Document Dump

The most basic approach—paste documents directly:

```markdown
Answer the following question based on the provided documents.

Documents:
---
[Document 1 full text]
---
[Document 2 full text]
---

Question: {{user_question}}
Answer:
```

**Pros:** Simple, works for small document sets
**Cons:** No structure, hard for the model to reference specific docs

### Technique 2: Numbered & Labeled Documents

Add structure for better citation:

```markdown
Answer the question using ONLY the information in the documents below.
Cite your sources using [Doc X] notation.

[Doc 1] Title: Employee Leave Policy
Content: Employees are entitled to 20 days of paid leave per year...

[Doc 2] Title: Remote Work Guidelines
Content: Employees may work remotely up to 3 days per week...

[Doc 3] Title: Benefits Overview
Content: The company provides health insurance for all full-time...

Question: {{user_question}}
Answer (cite sources):
```

**Pros:** Easy citation, model can reference by number
**Cons:** Takes more tokens, document titles help but aren't always available

### Technique 3: Relevance-Ranked Injection

Place the most relevant documents first:

```markdown
The following documents are ranked by relevance to your question.
Document 1 is most relevant, Document N is least relevant.

[Doc 1 — Relevance: 0.95] ...
[Doc 2 — Relevance: 0.87] ...
[Doc 3 — Relevance: 0.72] ...

Use the most relevant documents to answer. Ignore documents
that aren't related to the question.

Question: {{user_question}}
```

**Pros:** Model prioritizes high-relevance content
**Cons:** Relevance scores may be inaccurate

### Technique 4: Structured Metadata

Include rich metadata for precise grounding:

```markdown
<document id="1" source="HR Policy Manual" section="3.2"
  last_updated="2024-01-15" author="HR Department">
Employees are entitled to 20 days of paid leave per year.
Unused leave may be carried over up to 5 days.
</document>

<document id="2" source="IT Security Guide" section="5.1"
  last_updated="2024-03-01" author="IT Department">
All passwords must be at least 12 characters and include
uppercase, lowercase, numbers, and special characters.
</document>
```

**Pros:** Maximum context for accurate citation, enables source verification
**Cons:** Token-heavy, requires structured document storage

---

## Document Grounding

**Grounding** means forcing the model to base its answers exclusively on the provided documents, rather than its training data. This is essential for accuracy and trustworthiness.

### The Grounding Instruction

The single most important line in a RAG prompt:

```markdown
Answer ONLY based on the information provided in the documents above.
If the answer is not contained in the documents, say "I don't have
enough information to answer this question."
```

### Why Grounding Is Hard

Models **want to be helpful**. When they don't find an answer in the documents, their default behavior is to fill in the gap from training data—which looks plausible but may be wrong. You must **explicitly override** this behavior.

### Grounding Strength Levels

| Level | Instruction | Strictness |
|-------|------------|------------|
| Soft | "Prefer information from the documents" | Low — will supplement from training data |
| Medium | "Base your answer on the documents. If unsure, say so." | Medium — mostly grounded |
| Strict | "Answer ONLY from the documents. If the answer is not in the documents, say 'I don't know.' Do NOT use any outside knowledge." | High — refuse to answer without evidence |
| Ultra-strict | "Quote the exact passage that supports your answer. If no passage supports it, refuse to answer." | Maximum — requires verbatim evidence |

> **Tip:** For enterprise applications, always use strict or ultra-strict grounding. A confident wrong answer is far more dangerous than an honest "I don't know."

### Testing Grounding Effectiveness

Include test questions that are **not** in the documents. A well-grounded model will refuse to answer them. A poorly grounded model will hallucinate an answer.

```
Documents: [Only about company HR policies]

Test: "What is the capital of France?"
Expected (grounded): "This question is not covered by the provided documents."
Bad (ungrounded): "The capital of France is Paris."
```

---

## Citation Requirements

Citations turn RAG from "trust me" into "here's my source." They enable users to verify answers and build trust.

### Citation Formats

**Inline citations:**
```
Employees receive 20 days of paid leave per year [Doc 1].
Remote work is available up to 3 days per week [Doc 2].
```

**Footnote citations:**
```
Employees receive 20 days of paid leave per year.¹
Remote work is available up to 3 days per week.²

Sources:
¹ Employee Leave Policy, Section 3.2
² Remote Work Guidelines, Section 1.1
```

**Quoted citations:**
```
According to the Employee Leave Policy: "Employees are entitled
to 20 days of paid leave per year. Unused leave may be carried
over up to 5 days."
```

### Citation Prompt Pattern

```markdown
Rules for citations:
1. Every factual claim MUST include a citation in [Doc X] format
2. If combining information from multiple documents, cite all sources
3. Direct quotes should use quotation marks with the source
4. If you cannot cite a source for a claim, do not make the claim
5. It is better to give a shorter, fully-cited answer than a longer
   uncited one
```

---

## Hallucination Reduction

Hallucination in RAG happens when the model generates information that is **not in the provided documents**. This is the #1 failure mode and the hardest to eliminate.

### Types of RAG Hallucination

| Type | Description | Example |
|------|-------------|---------|
| Fabricated facts | Inventing information not in any document | "The policy was updated in March" (no date mentioned) |
| Source confusion | Attributing info to the wrong document | "According to Doc 3..." (actually from Doc 1) |
| Extrapolation | Drawing conclusions beyond what documents state | "This implies that..." (documents don't imply this) |
| Blending | Mixing document info with training data | Correct doc info + fabricated details |

### Reduction Strategies

#### 1. Explicit Refusal Instructions

```markdown
CRITICAL: If the documents do not contain enough information to
fully answer the question, you MUST respond with:
"Based on the provided documents, I cannot answer this question."

Do NOT attempt to fill in gaps with your own knowledge.
Do NOT speculate or infer beyond what is explicitly stated.
```

#### 2. Quote-First Pattern

Force the model to find the quote before answering:

```markdown
Step 1: Find the relevant passage(s) in the documents
Step 2: Quote the passage(s) verbatim
Step 3: Answer the question based ONLY on those quoted passages

If you cannot find a relevant passage in Step 1, stop and say
"No relevant information found in the provided documents."
```

#### 3. Confidence Flagging

```markdown
For each part of your answer, indicate confidence:
- [HIGH] — directly stated in a document with citation
- [MEDIUM] — inferred from combining multiple documents
- [LOW] — partially supported but requires some interpretation

Never include information you would rate below [MEDIUM].
```

#### 4. Verification Questions

After the model generates an answer, ask it to self-verify:

```markdown
Now review your answer:
1. Is every claim supported by a specific document?
2. Did you add any information not in the documents?
3. Are all citations accurate?

If you find unsupported claims, remove them and note what
information is missing.
```

> **Tip:** The quote-first pattern is the most effective single technique for reducing hallucinations. It forces evidence before synthesis.

---

## Chunk Sizing

Documents are typically too long to fit entirely in a prompt. **Chunking** is the process of breaking documents into smaller pieces for retrieval.

### Chunk Size Tradeoffs

| Chunk Size | Pros | Cons |
|-----------|------|------|
| Small (100-200 tokens) | Precise retrieval, less noise | May lose context, sentence fragments |
| Medium (300-500 tokens) | Good balance of precision and context | Standard choice |
| Large (500-1000 tokens) | More context per chunk | May include irrelevant content, fewer chunks fit |
| Full document | Complete context | Often too large, dilutes relevance |

### Chunking Strategies

#### Fixed-Size Chunking
Split every N tokens with overlap:
```python
def fixed_chunk(text, chunk_size=400, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks
```

#### Semantic Chunking
Split at natural boundaries (paragraphs, sections, headings):
```python
def semantic_chunk(text):
    # Split at section headings or double newlines
    sections = re.split(r'\n#{1,3}\s|\n\n', text)
    return [s.strip() for s in sections if s.strip()]
```

#### Sentence-Window Chunking
Retrieve a sentence, but include surrounding sentences for context:
```python
def sentence_window(sentences, target_idx, window=2):
    start = max(0, target_idx - window)
    end = min(len(sentences), target_idx + window + 1)
    return " ".join(sentences[start:end])
```

### How Many Chunks to Retrieve?

| Context Window | Recommended Chunks | Why |
|---------------|-------------------|-----|
| 4K tokens | 3-5 chunks | Leave room for instructions + answer |
| 8K tokens | 5-10 chunks | Good balance |
| 32K tokens | 10-20 chunks | Lots of space, but more noise risk |
| 128K tokens | 20-50 chunks | Risk of "lost in the middle" problem |

> **Tip:** More chunks isn't always better. Research shows models tend to **ignore information in the middle** of long contexts (the "lost in the middle" phenomenon). Place the most important chunks at the beginning and end.

---

## Relevance Scoring

Not all retrieved documents are equally useful. **Relevance scoring** ranks documents so you can inject the most useful ones and skip the noise.

### Common Scoring Methods

| Method | How It Works | Strengths |
|--------|-------------|-----------|
| BM25 | Term frequency matching | Fast, good for keyword queries |
| Cosine similarity | Vector distance between embeddings | Good semantic matching |
| Cross-encoder | Model scores query-document pairs | Most accurate, slowest |
| Hybrid | BM25 + semantic combined | Best of both worlds |

### Relevance Threshold

Set a minimum relevance score to avoid injecting irrelevant documents:

```python
def filter_chunks(chunks, scores, threshold=0.5):
    """Only include chunks above the relevance threshold."""
    return [
        chunk for chunk, score in zip(chunks, scores)
        if score >= threshold
    ]
```

### Reranking

After initial retrieval, use a reranker to improve ordering:

```
Step 1: BM25 retrieves top 20 candidates (fast, broad)
Step 2: Cross-encoder reranks to top 5 (slow, precise)
Step 3: Top 5 injected into the prompt
```

---

## "Answer Only from Documents" Patterns

This is the most critical pattern in RAG prompting. Here are battle-tested templates:

### The Standard RAG Prompt

```markdown
You are a helpful assistant that answers questions based on provided documents.

## Rules
1. Answer ONLY using information from the documents below
2. Cite sources using [Doc X] format for every claim
3. If the answer is not in the documents, respond: "I don't have
   information about this in the provided documents."
4. Do not use any knowledge from your training data
5. If a question is only partially answerable, answer what you can
   and note what information is missing

## Documents
{{documents}}

## Question
{{question}}

## Answer
```

### The Strict Grounding Prompt

```markdown
You are a document-grounded question answering system.

ABSOLUTE RULES (never break these):
- You may ONLY reference information explicitly stated in the documents
- Every sentence in your answer must have a [Doc X] citation
- If no document contains the answer, respond EXACTLY with:
  "The provided documents do not contain this information."
- Never begin with "Based on my knowledge" or similar phrases
- Never add context, background, or explanations beyond what the
  documents state

## Documents
{{documents}}

## Question
{{question}}

## Cited Answer
```

### The Multi-Document Synthesis Prompt

For questions requiring information from multiple documents:

```markdown
You are a research assistant. Answer the question by synthesizing
information across the provided documents.

## Instructions
1. Read ALL documents before answering
2. If the answer requires combining information from multiple
   documents, do so and cite each source
3. Use the format: "According to [Doc X] and [Doc Y], ..."
4. If documents contain conflicting information, note the
   discrepancy and cite both sources
5. If the answer is not fully covered by the documents, state
   what is known and what is missing

## Documents
{{documents}}

## Question
{{question}}

## Synthesized Answer
```

---

## Common Failure Modes

### 1. The Helpful Hallucinator

**Problem:** Model answers from training data when documents don't have the answer.
**Fix:** Ultra-strict grounding instructions + test with unanswerable questions.

### 2. The Citation Faker

**Problem:** Model cites "[Doc 3]" but the information is actually from Doc 1 (or made up).
**Fix:** Quote-first pattern + structured document labels.

### 3. The Over-Retriever

**Problem:** Too many documents injected, model gets confused by noise.
**Fix:** Higher relevance threshold + fewer, more targeted chunks.

### 4. The Lost-in-the-Middle

**Problem:** Model ignores information in the middle of long contexts.
**Fix:** Place critical info at beginning/end + limit total chunks.

### 5. The Partial Answerer

**Problem:** Model answers with only part of the available information, missing details from other documents.
**Fix:** Explicit instruction to "read ALL documents before answering" + synthesis instructions.

---

## Summary

| Concept | Key Takeaway |
|---------|--------------|
| RAG | Retrieve documents, inject into prompt, generate grounded answers |
| Context injection | Structure documents with labels, numbers, metadata |
| Document grounding | "Answer ONLY from documents" — override the model's helpfulness |
| Citation | Every claim needs a source; use [Doc X] notation |
| Hallucination reduction | Quote-first pattern is the most effective single technique |
| Chunk sizing | 300-500 tokens per chunk is the sweet spot |
| Relevance scoring | Filter out low-relevance chunks to reduce noise |

> **Key Insight:** The hardest part of RAG isn't retrieval—it's getting the model to **stay grounded**. A model that says "I don't know" when it doesn't know is far more valuable than one that confidently hallucinates.

---

## What's Next?

In the simulation for this module, you'll build a RAG prompt that answers questions exclusively from provided documents, cites sources properly, and correctly refuses to answer when the information isn't available. You'll face a mix of answerable, partially answerable, and unanswerable questions.
