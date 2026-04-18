# Module 19: Multimodal Prompting

## Introduction

Language models are no longer text-only. Modern vision-language models (VLMs) like GPT-4o, Claude 3.5 Sonnet, and Gemini Pro can process **images alongside text**, opening entirely new categories of applications: visual Q&A, document analysis, image-to-code, product tagging, accessibility descriptions, and more.

Multimodal prompting is the art of writing prompts that effectively combine text instructions with visual inputs to extract maximum value from these models.

> **Tip:** The best multimodal prompts tell the model exactly **what to look for** in the image and **how to structure** the output. Vague prompts like "describe this image" waste the model's capability.

---

## Vision Model Capabilities

### What Vision Models Can Do

| Capability | Description | Example Use Case |
|-----------|-------------|-----------------|
| Object identification | Recognize and name objects | Product cataloging |
| Text extraction (OCR) | Read text in images | Receipt scanning, form processing |
| Spatial reasoning | Understand object positions and relationships | UI analysis, floor plan review |
| Style analysis | Identify visual styles, colors, themes | Brand consistency checking |
| Counting | Count objects (with limitations) | Inventory verification |
| Comparison | Compare multiple images | A/B design testing |
| Chart/graph reading | Extract data from visualizations | Report digitization |
| Code from UI | Generate code from screenshots | UI-to-code conversion |
| Damage assessment | Identify defects or damage | Insurance claims, QA |
| Emotion/expression | Read facial expressions (with ethical caveats) | UX research |

### Current Limitations

Understanding what vision models **cannot** do reliably is just as important:

| Limitation | Description | Workaround |
|-----------|-------------|-----------|
| Fine-grained counting | Counting 50+ objects accurately | Ask for estimates or ranges |
| Small text | Reading tiny or blurry text | Crop and enlarge the relevant area |
| Spatial precision | Exact pixel coordinates | Use relative descriptions ("top-left") |
| 3D understanding | Depth perception, 3D reconstruction | Provide multiple angles |
| Temporal reasoning | Sequence from a single image | Provide multiple frames |
| Hallucination | Describing objects that aren't there | Ask for confidence levels |
| Cultural context | Nuanced cultural interpretation | Provide context in the prompt |

> **Warning:** Vision models can hallucinate details, especially when asked to read small text or count many objects. Always include confidence indicators in your prompt design.

---

## Image + Text Prompting Fundamentals

### The Multimodal Prompt Structure

A multimodal prompt has three components:

```
┌─────────────────────────────────┐
│  1. TASK INSTRUCTION (text)     │
│     What to do with the image    │
├─────────────────────────────────┤
│  2. IMAGE INPUT                  │
│     The visual data              │
├─────────────────────────────────┤
│  3. OUTPUT SPECIFICATION (text)  │
│     How to format the response   │
└─────────────────────────────────┘
```

### Basic vs. Advanced Prompting

**Basic (vague):**
```
What's in this image?
```

**Advanced (specific):**
```
Analyze this product photograph and extract the following information:

1. Product category (e.g., electronics, clothing, furniture)
2. Primary color(s)
3. Brand name (if visible)
4. Condition (new, used, damaged)
5. Estimated dimensions (relative to visible reference objects)
6. Key features visible in the image
7. Suggested tags for an e-commerce listing (5-10 tags)

Format your response as JSON with these exact keys:
{
  "category": "...",
  "colors": ["..."],
  "brand": "..." or null,
  "condition": "new|used|damaged",
  "dimensions": "...",
  "features": ["..."],
  "tags": ["..."],
  "confidence": 0.0-1.0
}
```

The advanced version produces structured, actionable output suitable for automated processing.

---

## Image Analysis Patterns

### Pattern 1: Structured Extraction

Extract specific data points from an image into a defined schema.

```
You are a product data extraction specialist. Analyze the provided
product image and extract structured metadata.

## Extraction Schema
{
  "product_name": "descriptive name based on what you see",
  "category": "one of: electronics, clothing, home, food, beauty, sports, other",
  "subcategory": "more specific category",
  "colors": ["list of dominant colors"],
  "material": "estimated material (metal, plastic, fabric, wood, etc.)",
  "brand": "brand name if visible, null otherwise",
  "text_on_product": ["any readable text on the product"],
  "condition": "new | like_new | used | damaged",
  "key_features": ["list of 3-5 visible features"],
  "tags": ["8-12 descriptive tags for search/SEO"],
  "confidence": {
    "overall": 0.0-1.0,
    "brand_detection": 0.0-1.0,
    "text_reading": 0.0-1.0
  }
}

## Rules
- Only extract information that is VISIBLE in the image
- If something is unclear, set confidence lower and add a note
- Do not hallucinate features that aren't visible
- For text: quote exactly what you can read. Mark unclear characters with [?]
- Return ONLY valid JSON, no additional commentary
```

### Pattern 2: Comparative Analysis

Compare two or more images systematically.

```
You will be shown two product images labeled A and B.
Compare them across the following dimensions:

| Dimension | Image A | Image B | Winner |
|-----------|---------|---------|--------|
| Visual appeal | | | |
| Color scheme | | | |
| Text readability | | | |
| Brand visibility | | | |
| Product clarity | | | |
| Background quality | | | |
| Professional grade | | | |

After the table, provide:
1. Overall recommendation: Which image should be used as the primary listing photo?
2. Specific improvements for the weaker image
3. Any issues in either image (blurry, poorly lit, wrong angle)
```

### Pattern 3: Chain-of-Thought Visual Reasoning

Guide the model through step-by-step visual analysis.

```
Analyze this image step by step:

Step 1 — SCAN: What objects are visible? List everything you can identify.
Step 2 — FOCUS: What is the main subject of the image?
Step 3 — DETAIL: Describe the main subject's key attributes (color, size, condition, text).
Step 4 — CONTEXT: What does the environment/background tell you?
Step 5 — INFER: What can you reasonably infer about this product's purpose, price range, and target audience?
Step 6 — EXTRACT: Output the structured data in the required JSON format.

Show your reasoning for each step before the final output.
```

### Pattern 4: Region-Specific Analysis

Direct the model's attention to specific areas of the image.

```
Focus on these specific regions of the image:

1. TOP-LEFT QUADRANT: Is there a logo or brand name? If yes, read it exactly.
2. CENTER: What is the main product? Describe its form factor and color.
3. BOTTOM: Is there any text (price tag, description, barcode)? Transcribe it.
4. BACKGROUND: What's behind the product? (studio, lifestyle setting, outdoor)

For each region, rate your confidence (high/medium/low) that you've
correctly identified the content.
```

### Pattern 5: Conditional Analysis

Handle different image types with a single prompt.

```
First, classify this image into one of these categories:
- PRODUCT_PHOTO: A single product on a clean background
- LIFESTYLE_SHOT: Product in a real-world setting
- INFOGRAPHIC: Image with charts, graphs, or data
- DOCUMENT: Scanned text document
- SCREENSHOT: Software or website screenshot
- OTHER: None of the above

Then, based on the category, extract the appropriate data:

If PRODUCT_PHOTO → Extract: product name, colors, features, condition
If LIFESTYLE_SHOT → Extract: product name, setting description, mood, target audience
If INFOGRAPHIC → Extract: title, key data points, trends, source
If DOCUMENT → Extract: full text (OCR), document type, key information
If SCREENSHOT → Extract: application name, visible UI elements, any error messages
If OTHER → Describe the image and suggest what data could be extracted
```

---

## Structured Extraction from Images

### Building Extraction Pipelines

For production systems, image analysis is often part of a larger pipeline:

```
┌───────────┐    ┌────────────┐    ┌──────────────┐    ┌──────────┐
│ Image      │───▶│ VLM        │───▶│ JSON         │───▶│ Database │
│ Upload     │    │ Extraction │    │ Validation   │    │ Storage  │
└───────────┘    └────────────┘    └──────────────┘    └──────────┘
```

### Schema-Driven Extraction Prompt

```
You are a data extraction API. Given a product image, return ONLY
a valid JSON object matching this exact schema. No commentary.

Schema:
{
  "product": {
    "name": "string — descriptive product name",
    "sku": "string | null — product code if visible",
    "category": "enum: electronics|clothing|home|food|beauty|sports|other",
    "price": {
      "amount": "number | null",
      "currency": "string | null"
    }
  },
  "visual": {
    "primary_color": "string",
    "secondary_colors": ["string"],
    "material": "string",
    "condition": "enum: new|used|damaged|unknown"
  },
  "text_detected": [
    {
      "content": "string — exact text",
      "location": "string — where on the image",
      "confidence": "number 0-1"
    }
  ],
  "tags": ["string — 8-12 search-friendly tags"],
  "metadata": {
    "image_quality": "enum: high|medium|low",
    "background_type": "enum: studio|lifestyle|outdoor|plain|other",
    "overall_confidence": "number 0-1"
  }
}

Rules:
- Return ONLY the JSON object, no markdown fences, no explanation
- Use null for any field you cannot determine from the image
- Never guess or hallucinate — mark uncertain fields with lower confidence
- Text detection: quote EXACTLY what you see, use [?] for unclear characters
```

### Handling Extraction Errors

```
After extraction, validate the output:

1. Is the JSON syntactically valid?
2. Are all required fields present?
3. Are enum values within allowed options?
4. Is the confidence above 0.5 for critical fields?
5. Does the extracted data make logical sense?
   (e.g., a "laptop" shouldn't have material "fabric")

If validation fails on any field, flag it:
{
  "validation_warnings": [
    {"field": "product.price", "issue": "Price detected but partially obscured"},
    {"field": "visual.material", "issue": "Cannot determine material from this angle"}
  ]
}
```

---

## Comparing Vision Models

Different models have different strengths for multimodal tasks:

| Model | OCR Quality | Spatial Reasoning | Structured Output | Speed | Best For |
|-------|:-----------:|:-----------------:|:-----------------:|:-----:|----------|
| GPT-4o | Excellent | Very Good | Excellent | Fast | General analysis, JSON extraction |
| Claude 3.5 Sonnet | Very Good | Excellent | Excellent | Fast | Detailed reasoning, comparisons |
| Gemini Pro | Good | Good | Good | Very Fast | Quick analysis, high volume |
| LLaVA (open) | Moderate | Moderate | Moderate | Varies | On-premise, privacy-sensitive |

### Model Selection Guidelines

```
Choose your model based on the task:

HIGH ACCURACY NEEDED (medical images, legal documents):
→ GPT-4o or Claude 3.5 Sonnet with chain-of-thought reasoning

HIGH VOLUME / LOW COST (product tagging, content moderation):
→ Gemini Pro or GPT-4o-mini with simple extraction prompts

PRIVACY-SENSITIVE (personal documents, health records):
→ Self-hosted open models (LLaVA, InternVL)

COMPLEX REASONING (technical diagrams, multi-step analysis):
→ Claude 3.5 Sonnet with step-by-step reasoning

REAL-TIME PROCESSING (live video frames, robotics):
→ Gemini Flash or GPT-4o-mini for speed
```

---

## Practical Use Cases

### Use Case 1: E-Commerce Product Listing

```
Analyze this product photo and generate a complete e-commerce listing:

1. Product title (max 80 characters, SEO-optimized)
2. Short description (2-3 sentences, benefit-focused)
3. Bullet-point features (5 items)
4. Suggested category path (e.g., "Electronics > Audio > Headphones")
5. Search tags (10 keywords)
6. Alt text for accessibility (max 125 characters)

Target marketplace: Amazon
Target audience: Based on what you see, infer the likely buyer persona.
```

### Use Case 2: Accessibility Description

```
Write an image alt-text and extended description for a visually
impaired user. Follow WCAG 2.1 guidelines:

1. Alt text (max 125 characters): Convey the essential information
2. Extended description (2-4 sentences): Provide full context

Rules:
- Describe what IS in the image, not what you think it means
- Mention colors, text, and spatial layout
- For people: describe actions, not identity judgments
- For data visualizations: describe the data, not just "a chart"
- Be specific: "a red circle" not "a shape"
```

### Use Case 3: Document Analysis

```
This is a scanned document. Please:

1. CLASSIFY the document type (invoice, receipt, letter, form, contract, other)
2. EXTRACT all readable text, maintaining layout structure
3. IDENTIFY key fields based on document type:
   - Invoice: vendor, date, line items, total, payment terms
   - Receipt: store, date, items, total, payment method
   - Form: form title, fields with values, signatures
4. FLAG any areas where text is unclear or partially obscured

Output as structured JSON with confidence scores for each extracted field.
```

---

## Best Practices

### 1. Be Specific About What to Look For
- **Bad:** "What's in this image?"
- **Good:** "Identify the brand, model, color, and condition of the electronic device in this image."

### 2. Define the Output Format Explicitly
- Always specify JSON schema, table format, or structured template
- Include examples of expected output when possible

### 3. Use Chain-of-Thought for Complex Analysis
- Guide the model through step-by-step reasoning
- Ask it to describe what it sees before making inferences

### 4. Handle Uncertainty Explicitly
- Always ask for confidence scores
- Instruct the model to say "unclear" rather than guess
- Include null options in your schema for uncertain fields

### 5. Provide Context When Available
- Tell the model what kind of image to expect
- Provide domain context (e.g., "this is a medical X-ray" vs. just "analyze this image")

### 6. Validate Outputs Programmatically
- Parse JSON outputs and validate against schema
- Check for hallucination indicators (very high confidence on ambiguous images)
- Cross-reference extracted text with OCR tools when accuracy is critical

---

## Common Pitfalls

### 1. Over-Relying on Vision for Text
**Problem:** Using VLMs for OCR tasks where dedicated OCR tools are better.
**Solution:** For pure text extraction, use OCR first, then VLM for interpretation.

### 2. Ignoring Image Quality
**Problem:** Sending blurry, dark, or cropped images and expecting perfect analysis.
**Solution:** Preprocess images (resize, enhance, crop to region of interest) before sending.

### 3. Not Setting Confidence Thresholds
**Problem:** Treating all VLM outputs as equally reliable.
**Solution:** Require confidence scores and route low-confidence outputs to human review.

### 4. Single-Prompt Overload
**Problem:** Asking the model to do too many things in one prompt.
**Solution:** Break complex analysis into multiple focused prompts (detect → classify → extract → validate).

### 5. Forgetting Ethical Considerations
**Problem:** Using vision models for facial analysis, surveillance, or biased categorization.
**Solution:** Always consider privacy, consent, and bias. Never use vision models to infer protected characteristics.

---

## Summary

| Concept | Key Takeaway |
|---------|-------------|
| Multimodal Prompts | Combine text instructions with image input and output specification |
| Structured Extraction | Use JSON schemas to get consistent, parseable output |
| Chain-of-Thought Vision | Guide step-by-step analysis for complex images |
| Region-Specific Analysis | Direct attention to specific areas for better accuracy |
| Confidence Scores | Always include uncertainty indicators in extraction pipelines |
| Model Selection | Choose models based on task requirements (accuracy vs. speed vs. privacy) |
| Validation | Always validate VLM outputs — they hallucinate, especially on small text |

---

## What's Next

In the simulation, you'll write prompts that analyze product images (provided as text descriptions) and extract structured metadata. You'll be scored on extraction accuracy and JSON format compliance across 10 diverse product scenarios.
