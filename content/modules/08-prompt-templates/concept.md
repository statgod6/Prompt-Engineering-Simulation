# Module 8: Prompt Templates

## Introduction

As you build more prompts, you'll notice patterns. The customer service prompt you wrote for refunds looks almost identical to the one for shipping issues — just a few words change. **Prompt templates** solve this by creating reusable prompt blueprints with **variable slots** that get filled in at runtime.

Templates are the bridge between one-off prompt engineering and **scalable, production-grade prompt systems**. They save time, enforce consistency, and make your prompts maintainable.

---

## What Is a Prompt Template?

A prompt template is a prompt with **placeholders** that get replaced with actual values before being sent to the LLM:

### Basic Example

**Template:**
```
Translate the following {{source_language}} text to {{target_language}}.
Maintain the same tone and formality level.

Text: {{input_text}}
```

**Filled in:**
```
Translate the following English text to Spanish.
Maintain the same tone and formality level.

Text: Thank you for your purchase. Your order will ship within 2 business days.
```

The double curly braces `{{variable_name}}` are the most common syntax for template variables, used by Jinja2, Mustache, Handlebars, and many prompt engineering frameworks.

---

## Variable Syntax Conventions

Different systems use different variable markers:

| Syntax | Used By | Example |
|--------|---------|---------|
| `{{variable}}` | Jinja2, Mustache, LangChain | `{{customer_name}}` |
| `{variable}` | Python f-strings, LangChain | `{customer_name}` |
| `${variable}` | Shell, JavaScript template literals | `${customer_name}` |
| `<variable>` | XML-style templates | `<customer_name>` |
| `[variable]` | Informal/manual templates | `[customer_name]` |

> **Tip:** Stick with `{{double_curly_braces}}` — it's the most widely supported and least likely to conflict with the prompt content itself.

---

## Template Design Patterns

### Pattern 1: Simple Substitution

The most basic pattern — swap in values:

```
Write a {{length}} {{content_type}} about {{topic}} for a {{audience}} audience.

Tone: {{tone}}
```

**Variables:**
- `length`: "500-word", "short", "comprehensive"
- `content_type`: "blog post", "email", "report"
- `topic`: any subject
- `audience`: "technical", "executive", "general public"
- `tone`: "professional", "casual", "academic"

### Pattern 2: Conditional Sections

Some parts of the template only apply under certain conditions:

```
You are a customer service agent for {{company_name}}.

Respond to the customer's message below.

{{#if is_premium_customer}}
This is a PREMIUM customer. Use their name, be extra courteous,
and offer priority resolution. Aim to resolve in one interaction.
{{else}}
Follow standard support procedures. Be friendly and professional.
{{/if}}

{{#if previous_interactions}}
Previous interaction history:
{{previous_interactions}}
{{/if}}

Customer message: {{customer_message}}
```

### Pattern 3: Iterative Sections

Loop over a list to build dynamic prompt sections:

```
Review the following code changes and provide feedback on each file:

{{#each files}}
### File: {{this.filename}}
```{{this.language}}
{{this.diff}}
```

{{/each}}

For each file, comment on:
1. Code quality
2. Potential bugs
3. Performance concerns
```

### Pattern 4: Role + Task + Format

A template that separates the three core prompt components:

```
# Role
You are a {{role}} with expertise in {{domain}}.

# Task
{{task_description}}

# Input
{{input_data}}

# Output Format
Return your response as {{output_format}}.
{{#if example_output}}

Example:
{{example_output}}
{{/if}}

# Constraints
{{#each constraints}}
- {{this}}
{{/each}}
```

### Pattern 5: Dynamic Few-Shot

Inject different examples based on the task type:

```
{{task_instruction}}

{{#each examples}}
Example {{@index}}:
Input: {{this.input}}
Output: {{this.output}}

{{/each}}

Now process this:
Input: {{actual_input}}
Output:
```

---

## Building a Reusable Prompt Library

As your template collection grows, organize them systematically:

### Directory Structure

```
prompts/
├── customer_support/
│   ├── ticket_response.yaml
│   ├── escalation_summary.yaml
│   └── satisfaction_survey.yaml
├── content/
│   ├── blog_post.yaml
│   ├── product_description.yaml
│   └── social_media.yaml
├── data/
│   ├── extraction.yaml
│   ├── classification.yaml
│   └── summarization.yaml
└── shared/
    ├── output_formats.yaml
    └── safety_instructions.yaml
```

### Template File Format

Store templates in YAML for readability:

```yaml
# prompts/customer_support/ticket_response.yaml
id: cs-ticket-response-v3
name: Customer Support Ticket Response
version: "3.0"
author: prompt-engineering-team
created: 2024-06-15
updated: 2024-09-20

description: >
  Generates a professional response to customer support tickets.
  Handles 10 ticket types with consistent formatting.

variables:
  ticket_type:
    type: enum
    values: [refund, shipping, technical, billing, cancellation,
             upgrade, complaint, feedback, warranty, account]
    required: true
  customer_name:
    type: string
    required: false
    default: "Valued Customer"
  order_id:
    type: string
    required: false
  customer_message:
    type: string
    required: true
  priority:
    type: enum
    values: [low, medium, high, urgent]
    default: medium

system_prompt: >
  You are a customer service representative for TechCo.
  Be empathetic, professional, and solution-oriented.
  Always aim to resolve the issue in one interaction.

user_prompt: |
  Respond to this {{ticket_type}} support ticket.

  Customer: {{customer_name}}
  {{#if order_id}}Order: {{order_id}}{{/if}}
  Priority: {{priority}}

  Customer's message:
  {{customer_message}}

  Guidelines:
  - Acknowledge their concern specifically
  - Provide a clear resolution or next step
  - Include relevant policy information
  - Keep response under 200 words
  - End with an offer for further help

model_config:
  model: gpt-4o
  temperature: 0.3
  max_tokens: 512
```

---

## Template Versioning

As prompts evolve, version control becomes critical:

### Why Version Templates?

1. **Reproducibility** — Know exactly which prompt produced which output
2. **Rollback** — Revert to a previous version if a new one underperforms
3. **A/B testing** — Compare versions to measure improvement
4. **Audit trail** — Track who changed what and when

### Versioning Strategy

```yaml
# Semantic versioning for prompts
# MAJOR.MINOR.PATCH

# v1.0.0 — Initial template
# v1.1.0 — Added handling for edge case X
# v1.2.0 — Improved tone for complaint tickets
# v2.0.0 — Complete restructure, new output format (breaking change)
# v2.0.1 — Fixed typo in instructions
```

### Version in Practice

```python
class PromptTemplateRegistry:
    """Central registry for versioned prompt templates."""

    def __init__(self):
        self.templates = {}

    def register(self, template_id: str, version: str, template: str):
        key = f"{template_id}@{version}"
        self.templates[key] = template

    def get(self, template_id: str, version: str = "latest") -> str:
        if version == "latest":
            # Find highest version for this template_id
            versions = [k for k in self.templates if k.startswith(template_id)]
            key = sorted(versions)[-1]
        else:
            key = f"{template_id}@{version}"
        return self.templates[key]

# Usage
registry = PromptTemplateRegistry()
registry.register("cs-ticket", "1.0.0", "You are a support agent...")
registry.register("cs-ticket", "2.0.0", "You are a senior support agent...")

prompt = registry.get("cs-ticket", "latest")  # Returns v2.0.0
prompt = registry.get("cs-ticket", "1.0.0")   # Returns v1.0.0
```

---

## When Templates Save Time vs. Add Complexity

### Templates Save Time When:

- You have **10+ similar prompts** that differ in just a few variables
- Multiple team members need to use the same prompts
- You need **consistent output format** across different inputs
- The prompt is used **in production** and needs to be maintained
- You run **A/B tests** on prompt variations

### Templates Add Complexity When:

- You're **prototyping** and the prompt changes every iteration
- The task is a **one-off** that won't be repeated
- Variables would make the prompt **harder to read** than just writing it out
- The template has so many conditionals that it becomes a **mini programming language**
- You're overengineering a simple prompt

### Complexity Warning Signs

```
❌ Template with 15+ variables → Too many degrees of freedom
❌ 5+ nested conditionals → Write separate templates instead
❌ Template longer than 1000 words → Break into sub-templates
❌ Variables that change the fundamental task → These are different prompts
```

> **Tip:** A good rule of thumb: if a template has more conditional logic than actual prompt text, it's time to split it into multiple simpler templates.

---

## Practical Implementation

### Python with Simple String Formatting

```python
def fill_template(template: str, variables: dict) -> str:
    """Simple template filling with {{variable}} syntax."""
    result = template
    for key, value in variables.items():
        result = result.replace(f"{{{{{key}}}}}", str(value))
    return result

# Usage
template = """You are a {{role}} at {{company}}.
Help the customer with their {{issue_type}} issue.

Customer says: {{message}}"""

prompt = fill_template(template, {
    "role": "senior support engineer",
    "company": "CloudCorp",
    "issue_type": "billing",
    "message": "I was charged twice for my subscription"
})
```

### Python with Jinja2 (Advanced)

```python
from jinja2 import Template

template = Template("""You are a customer service representative.

{% if is_premium %}
PREMIUM CUSTOMER — prioritize and personalize.
{% endif %}

Respond to this {{ ticket_type }} ticket:
{{ customer_message }}

{% if previous_tickets %}
Previous interactions:
{% for ticket in previous_tickets %}
- {{ ticket.date }}: {{ ticket.summary }}
{% endfor %}
{% endif %}

Keep response under {{ max_words }} words.""")

prompt = template.render(
    is_premium=True,
    ticket_type="refund",
    customer_message="I need a refund for order #12345",
    previous_tickets=[
        {"date": "2024-01-15", "summary": "Shipping delay inquiry"},
        {"date": "2024-02-20", "summary": "Product exchange"}
    ],
    max_words=200
)
```

### LangChain Templates

```python
from langchain.prompts import PromptTemplate

template = PromptTemplate(
    input_variables=["product", "audience", "tone"],
    template="""Write a product description for {{product}}.

Target audience: {{audience}}
Tone: {{tone}}

Include: key features, benefits, and a call to action."""
)

prompt = template.format(
    product="noise-canceling headphones",
    audience="audiophiles aged 25-40",
    tone="enthusiastic but not over-the-top"
)
```

---

## Template Testing and Validation

### Variable Validation

Always validate that required variables are present:

```python
import re

def validate_template(template: str, variables: dict) -> list[str]:
    """Check that all template variables are provided."""
    # Find all {{variable}} placeholders
    required = set(re.findall(r'\{\{(\w+)\}\}', template))
    provided = set(variables.keys())

    errors = []
    missing = required - provided
    unused = provided - required

    if missing:
        errors.append(f"Missing variables: {missing}")
    if unused:
        errors.append(f"Warning — unused variables: {unused}")

    return errors
```

### Output Consistency Testing

Test that the same template produces consistent outputs across different variable values:

```python
def test_template_consistency(template, test_cases):
    """Verify template produces consistent quality across test cases."""
    results = []
    for case in test_cases:
        prompt = fill_template(template, case["variables"])
        output = call_llm(prompt)
        results.append({
            "case": case["name"],
            "output_length": len(output),
            "has_required_sections": check_sections(output, case["expected_sections"]),
            "format_valid": validate_format(output, case["expected_format"])
        })
    return results
```

---

## Common Mistakes

### Mistake 1: Overloaded Templates

```
❌ One template with 20 variables and 10 conditionals for every use case
✅ 3-4 focused templates, each handling a specific scenario well
```

### Mistake 2: Variables That Change the Task

```
❌ {{task}}: "write a poem" vs "analyze financial data"
   These are fundamentally different prompts, not template variations

✅ {{ticket_type}}: "refund" vs "shipping" vs "billing"
   Same task structure, different specifics
```

### Mistake 3: No Default Values

```
❌ "Dear {{customer_name}}" → Renders as "Dear " if name is missing

✅ "Dear {{customer_name | default('Valued Customer')}}"
   → Falls back gracefully
```

### Mistake 4: Untested Variable Combinations

A template might work for `ticket_type=refund` but break for `ticket_type=warranty` because the instructions don't apply. Test all valid combinations.

---

## Summary

Prompt templates transform ad-hoc prompts into reusable, scalable assets:

1. **Use `{{variables}}`** for parts that change between invocations
2. **Design patterns** — simple substitution, conditionals, loops, role+task+format
3. **Build a library** — organize templates by domain with YAML definitions
4. **Version control** — track changes, enable rollback and A/B testing
5. **Know the limits** — don't over-template; split complex templates instead
6. **Validate and test** — check variables, test all combinations, verify consistency

In the simulation lab, you'll create a single template that handles 10 different customer support scenarios — experiencing the power and constraints of parameterized prompting.

---

## Further Reading

- [Jinja2 Template Designer Documentation](https://jinja.palletsprojects.com/en/3.1.x/templates/)
- [LangChain: Prompt Templates](https://python.langchain.com/docs/concepts/prompt_templates/)
- [Guidance by Microsoft](https://github.com/guidance-ai/guidance) — Constrained template-based generation
- [Prompt Management Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) — Anthropic's prompt engineering guide
