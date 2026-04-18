# Module 5: Output Formatting & Structured Data

## Introduction

One of the most powerful — and most frustrating — aspects of working with LLMs is getting them to produce output in a **specific, predictable format**. Whether you need valid JSON for an API, a Markdown table for documentation, or CSV rows for a spreadsheet, the difference between a useful response and a broken pipeline often comes down to how precisely you specify the output format.

This module teaches you to **control the shape of LLM output** with surgical precision.

---

## Why Output Formatting Matters

In production systems, LLM output almost never goes directly to a human reader. It flows into:

- **Parsers** that expect valid JSON or XML
- **Databases** that need structured rows
- **APIs** that require specific schemas
- **Downstream prompts** that consume prior output as input

If the format is wrong — even slightly — the entire pipeline breaks. A missing comma in JSON, an extra column in CSV, or a hallucinated field name can crash applications.

> **Tip:** Think of output formatting as a **contract** between your prompt and the rest of your system. The more precise the contract, the more reliable the system.

---

## Format 1: JSON Output

JSON is the most common structured output format for LLM applications. It's machine-readable, widely supported, and maps naturally to programming language objects.

### Basic JSON Prompting

```
Convert the following product review into a JSON object with keys:
"sentiment" (positive/negative/neutral), "rating" (1-5), and "summary" (one sentence).

Review: "This blender is incredible! It crushes ice like nothing and the
cleanup is so easy. Best $60 I've ever spent."
```

**Expected output:**
```json
{
  "sentiment": "positive",
  "rating": 5,
  "summary": "An excellent blender that crushes ice easily and is simple to clean."
}
```

### Schema Enforcement

The most reliable way to get valid JSON is to **show the exact schema** you expect:

```
Extract product information and return ONLY a valid JSON object.
Do not include any text before or after the JSON.

Required schema:
{
  "name": "string",
  "category": "string (one of: electronics, clothing, food, books, home)",
  "price": "number (USD, no dollar sign)",
  "features": ["string", "string", "..."],
  "rating": "number (1.0-5.0, one decimal)",
  "in_stock": "boolean"
}

Product description: {{input}}
```

### Common JSON Failures and Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| Trailing comma after last element | LLM mimics JavaScript style | Add "Output valid JSON per RFC 8259" |
| Wrapped in markdown code block | LLM adds ` ```json ` wrapper | Add "Output raw JSON only, no code blocks" |
| Extra explanatory text | LLM adds "Here is the JSON:" | Add "Return ONLY the JSON object, nothing else" |
| Single quotes instead of double | LLM uses Python dict syntax | Add "Use double quotes for all strings" |
| Missing required fields | LLM omits fields it deems empty | Add "Include ALL fields, use null for unknown values" |
| Nested objects when flat expected | LLM over-structures | Show exact flat schema example |

> **Tip:** Always include the phrase **"Return ONLY valid JSON"** and provide a concrete schema example. These two techniques together solve 90% of formatting issues.

### Typed Fields

Be explicit about types to prevent coercion issues:

```
{
  "price": 29.99,        // number, NOT string "29.99"
  "in_stock": true,       // boolean, NOT string "true"
  "tags": ["sale", "new"] // array, NOT string "sale, new"
}
```

---

## Format 2: Markdown Output

Markdown is ideal when the output will be rendered in a web UI, documentation system, or chat interface.

### Controlling Markdown Structure

```
Write a product comparison in Markdown format using:
- An H2 heading for the title
- A comparison table with columns: Feature | Product A | Product B
- Bold text for the winner in each row
- A "Verdict" section at the end with a blockquote summary
```

**Expected output:**
```markdown
## Wireless Earbuds Comparison

| Feature | AirPods Pro | Sony WF-1000XM5 |
|---------|------------|------------------|
| Price | $249 | **$228** |
| Battery | 6 hours | **8 hours** |
| ANC | **Excellent** | Excellent |
| Weight | **5.3g** | 5.9g |

### Verdict

> The Sony WF-1000XM5 offers better value with longer battery life,
> while AirPods Pro edges ahead in noise cancellation and ecosystem integration.
```

### Markdown Formatting Tips

- Specify **heading levels** (`##` vs `###`) to control hierarchy
- Request **tables** explicitly — LLMs default to bullet lists
- Use "Format as a Markdown checklist" for task-oriented output
- Specify whether to use `**bold**` or `*italic*` for emphasis

---

## Format 3: CSV Output

CSV is useful when output needs to flow into spreadsheets or data processing pipelines.

### CSV Prompting Pattern

```
Convert the following sales data into CSV format.
- First row must be the header
- Use comma as delimiter
- Wrap fields containing commas in double quotes
- Date format: YYYY-MM-DD
- No trailing newline

Sales report: [input data here]
```

**Expected output:**
```csv
date,product,quantity,price,customer
2024-03-15,Widget Pro,50,29.99,Acme Corp
2024-03-15,"Widget Pro, Deluxe Edition",12,49.99,Globex Inc
2024-03-16,Basic Widget,200,9.99,Initech
```

### CSV Pitfalls

| Issue | Solution |
|-------|----------|
| Inconsistent delimiters | Specify "comma-separated" explicitly |
| Missing header row | Add "First row must be column headers" |
| Fields with commas break parsing | Add "Wrap fields containing commas in double quotes" |
| Newlines inside fields | Add "No line breaks within fields" |
| Inconsistent quoting | Add "Only quote fields that contain commas" |

---

## Format 4: XML Output

XML is common in enterprise integrations, SOAP APIs, and configuration files.

### XML Prompting Pattern

```
Convert the following employee record into valid XML.
- Root element: <employee>
- Use camelCase for element names
- Include an "id" attribute on the root element
- Self-close empty elements
- No XML declaration or namespace

Employee: John Smith, Engineering department, Senior Developer, started 2019-06-15
```

**Expected output:**
```xml
<employee id="emp-001">
  <firstName>John</firstName>
  <lastName>Smith</lastName>
  <department>Engineering</department>
  <title>Senior Developer</title>
  <startDate>2019-06-15</startDate>
</employee>
```

### XML Tips

- Always specify whether to include the XML declaration (`<?xml version="1.0"?>`)
- Define whether attributes or child elements should be used for properties
- Specify naming convention: camelCase, snake_case, or PascalCase
- Note whether CDATA sections are needed for text content

---

## Format 5: YAML Output

YAML is popular for configuration files, Kubernetes manifests, and human-readable data serialization.

### YAML Prompting Pattern

```
Convert the following deployment configuration into valid YAML.
- Use 2-space indentation
- Use block style for multi-line strings (|)
- Use flow style for short arrays
- No document markers (---)

App: web-frontend, 3 replicas, port 8080, image: myapp:v2.1,
environment variables: NODE_ENV=production, API_URL=https://api.example.com
```

**Expected output:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-frontend
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: web-frontend
          image: myapp:v2.1
          ports:
            - containerPort: 8080
          env:
            - name: NODE_ENV
              value: production
            - name: API_URL
              value: https://api.example.com
```

### YAML Pitfalls

| Issue | Solution |
|-------|----------|
| Tabs instead of spaces | Specify "Use spaces, not tabs" |
| Inconsistent indentation | Specify "Use exactly 2-space indentation" |
| Strings not quoted when needed | Add "Quote strings containing special chars: :, #, {, }" |
| Boolean coercion (yes/no → true/false) | Add "Use true/false for booleans, not yes/no" |

---

## Schema Enforcement Techniques

Beyond specifying format, you can enforce **structure** through several techniques:

### 1. Provide a Complete Example

The most reliable technique. Show the exact output shape:

```
Return a JSON object exactly like this example (with different values):
{
  "title": "Example Product",
  "price": 19.99,
  "tags": ["example", "demo"],
  "available": true
}
```

### 2. Field-by-Field Specification

When the schema is complex, define each field:

```
Return a JSON object with these fields:
- "id" (string): Unique identifier, format "PROD-XXXX"
- "name" (string): Product name, max 100 characters
- "price" (number): Price in USD, two decimal places
- "categories" (array of strings): 1-3 category labels
- "metadata" (object): Contains "created_at" (ISO 8601) and "source" (string)
```

### 3. Negative Examples

Show what NOT to do:

```
❌ WRONG (don't include explanatory text):
Here is the JSON for the product:
{"name": "Widget"}

✅ CORRECT (raw JSON only):
{"name": "Widget", "price": 9.99, "in_stock": true}
```

### 4. Validation Instructions

Tell the model to self-validate:

```
Before outputting, verify:
1. The JSON is valid (no trailing commas, proper quoting)
2. All 6 required fields are present
3. "price" is a number, not a string
4. "features" is an array with at least 1 item
5. "in_stock" is a boolean (true/false), not a string
```

### 5. System Message Anchoring

When using chat APIs, put format requirements in the system message:

```
System: You are a data extraction API. You ALWAYS respond with valid JSON
matching the provided schema. Never include explanatory text, markdown
formatting, or code block markers. Only output the raw JSON object.

User: Extract product info from: "The new iPhone 15 Pro starts at $999..."
```

---

## Choosing the Right Format

| Use Case | Recommended Format | Why |
|----------|-------------------|-----|
| API responses | JSON | Universal parser support, typed fields |
| Config files | YAML | Human-readable, supports comments (sort of) |
| Spreadsheet data | CSV | Direct import to Excel/Sheets |
| Enterprise integrations | XML | Schema validation, namespaces |
| Documentation / UI | Markdown | Renders beautifully, easy to write |
| Data interchange | JSON | Smallest size, fastest parsing |
| Complex nested configs | YAML or JSON | Both handle nesting well |

---

## Combining Formats

Sometimes you need **mixed-format output** — for example, a JSON response that contains Markdown in a field:

```
Return a JSON object where the "description" field contains Markdown-formatted text:
{
  "product": "Widget Pro",
  "description": "## Features\n- **Fast** processing\n- Easy setup\n- 24/7 support"
}
```

> **Tip:** When embedding one format inside another, be explicit about escaping rules. Markdown inside JSON requires escaped newlines (`\n`) and escaped quotes.

---

## Practical Checklist for Output Formatting

When writing a prompt that requires structured output:

1. **State the format explicitly** — "Return valid JSON" not "return structured data"
2. **Show the exact schema** — Don't describe it abstractly; show a concrete example
3. **Specify every field** — Name, type, constraints, whether required or optional
4. **Add negative constraints** — "No markdown code blocks", "No explanatory text"
5. **Include edge case handling** — "Use null for unknown values", "Use empty array [] if no items"
6. **Request self-validation** — "Verify the output is valid before returning"
7. **Test with varied inputs** — A prompt that works for one input may break for another

---

## Common Mistakes

### Mistake 1: Vague Format Requests

```
❌ "Return the data in a structured format"
✅ "Return a JSON object with keys: name (string), age (integer), active (boolean)"
```

### Mistake 2: Not Handling Edge Cases

```
❌ "Extract the price from the text"
✅ "Extract the price as a number. If no price is found, return null.
    If multiple prices exist, return the first one.
    Remove currency symbols and commas (e.g., $1,299.99 → 1299.99)"
```

### Mistake 3: Forgetting Wrapper Suppression

```
❌ Just asking for JSON (model returns ```json ... ```)
✅ "Return ONLY the raw JSON object. Do not wrap in code blocks
    or add any text before or after the JSON."
```

---

## Summary

Output formatting is the bridge between natural language AI and structured software systems. The key principles are:

1. **Be explicit** — Specify exact format, schema, and constraints
2. **Show examples** — Concrete examples beat abstract descriptions
3. **Handle edges** — Define behavior for missing, null, or ambiguous data
4. **Validate** — Ask the model to check its own output
5. **Choose wisely** — Match the format to your downstream consumer

In the simulation lab, you'll practice turning free-form product descriptions into perfectly-structured JSON objects that pass schema validation.

---

## Further Reading

- [OpenAI: JSON Mode](https://platform.openai.com/docs/guides/text-generation) — Built-in JSON mode for GPT models
- [Instructor Library](https://github.com/jxnl/instructor) — Structured output extraction with Pydantic
- [Outlines](https://github.com/outlines-dev/outlines) — Constrained generation for guaranteed valid output
- [JSON Schema Specification](https://json-schema.org/) — Formal schema definition standard
