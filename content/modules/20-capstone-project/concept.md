# Module 20: Capstone Project

## Introduction

Congratulations — you've made it to the capstone. Over the previous 19 modules, you've learned the full spectrum of prompt engineering: from basic prompt anatomy to system prompt architecture, from chain-of-thought reasoning to agentic pipelines, from output formatting to security hardening.

Now it's time to put it all together. In this capstone, you'll design a **complete, production-grade prompt-driven application** from scratch — including the system prompt, evaluation suite, security review, and documentation.

> **Tip:** The capstone is intentionally open-ended. Choose a project that excites you. The best capstone projects solve real problems and demonstrate mastery across multiple techniques.

---

## Capstone Requirements

Your capstone project must demonstrate competency across five core areas:

| Area | Weight | What You'll Build |
|------|:------:|------------------|
| System Prompt Design | 30% | Complete system prompt with persona, rules, tools, safety |
| Evaluation Suite | 25% | 10+ test cases with rubrics and scoring criteria |
| Security Review | 15% | 5+ attack tests with defenses documented |
| Documentation | 15% | Architecture decisions, design rationale, known limitations |
| Innovation | 15% | Creative application of techniques, novel combinations |

---

## Project Types

Choose one of these project types, or propose your own:

### 1. AI Tutor

Build an AI tutor for a specific subject (math, programming, language, science).

**Requirements:**
- Adaptive difficulty based on student responses
- Socratic questioning — guides students rather than giving answers
- Progress tracking across topics
- Multiple explanation strategies (visual, step-by-step, analogy-based)

**Key techniques:** Chain-of-thought, few-shot examples, state machine prompting, persona design

```
Example scope: "An AI Python tutor that teaches beginners
through interactive coding exercises. It should detect
common mistakes, provide hints before answers, and adapt
the difficulty based on student performance."
```

**Evaluation focus:** Pedagogical accuracy, hint quality, difficulty adaptation, refusal to give direct answers when hinting is more appropriate.

### 2. Code Review Bot

Build an AI code reviewer that provides actionable feedback on code submissions.

**Requirements:**
- Supports at least 2 programming languages
- Reviews for: bugs, performance, security, readability, best practices
- Provides severity ratings (critical, warning, info)
- Suggests specific fixes with code examples
- Handles code of varying quality (clean, messy, adversarial)

**Key techniques:** Structured output, few-shot examples, chain-of-thought analysis, tool definitions

```
Example scope: "A code review bot for Python and JavaScript
that analyzes pull requests, identifies issues ranked by
severity, and provides inline fix suggestions with
explanations of why the change is needed."
```

**Evaluation focus:** Issue detection accuracy, false positive rate, fix quality, handling of edge cases (empty files, very long files, obfuscated code).

### 3. Legal Document Analyzer

Build an AI that analyzes legal documents and extracts key information.

**Requirements:**
- Identifies document type (contract, NDA, terms of service, lease)
- Extracts key clauses, dates, parties, obligations
- Flags potentially concerning clauses
- Provides plain-English summaries
- Includes confidence levels and caveats

**Key techniques:** Structured extraction, chain-of-thought reasoning, output formatting, safety guardrails (legal disclaimer)

```
Example scope: "An AI legal analyzer that reads rental lease
agreements, extracts key terms (rent, deposit, duration,
restrictions), flags unusual clauses, and produces a
tenant-friendly summary with risk ratings."
```

**Evaluation focus:** Extraction accuracy, identification of risky clauses, appropriate disclaimers, handling of ambiguous language.

### 4. Content Moderator

Build an AI content moderation system for a social media platform.

**Requirements:**
- Classifies content into categories (safe, warning, violation)
- Handles multiple content types (text posts, comments, profile bios)
- Considers context and nuance (satire, quotes, educational content)
- Provides reasoning for each decision
- Supports appeals process

**Key techniques:** Classification, few-shot calibration, instruction hierarchy, edge case handling, security hardening

```
Example scope: "A content moderation system that reviews
social media posts, classifies them on a safety scale,
identifies specific policy violations, and handles nuanced
cases like satire, news reporting, and educational content
about sensitive topics."
```

**Evaluation focus:** Accuracy across content types, false positive/negative rates, nuance handling (satire vs. genuine hate), consistency across similar cases.

### 5. Medical Triage Assistant

Build an AI that performs initial medical symptom assessment.

**Requirements:**
- Collects symptoms through structured conversation
- Suggests urgency level (emergency, urgent, routine, self-care)
- Provides basic information (NOT diagnosis)
- Includes strong safety disclaimers
- Knows when to recommend immediate emergency care

**Key techniques:** State machine prompting, safety guardrails, structured data collection, escalation rules

```
Example scope: "A medical triage assistant that asks
structured questions about symptoms, assesses urgency level,
provides basic self-care information for minor issues, and
firmly directs users to emergency services when symptoms
suggest serious conditions. MUST include prominent disclaimers
that this is NOT a substitute for medical advice."
```

**Evaluation focus:** Triage accuracy (especially for serious conditions), safety of advice, appropriate disclaimers, handling of anxiety and emotional distress, refusal to diagnose.

> **Warning:** Medical AI projects require extreme caution. Your system must NEVER diagnose, prescribe, or replace professional medical advice. Safety guardrails are the highest priority.

### 6. Propose Your Own

Have a different idea? You can propose your own project type. It must:
- Involve a non-trivial system prompt (200+ tokens)
- Require at least 2 different prompt engineering techniques
- Have clear success criteria that can be evaluated
- Include safety considerations

---

## Deliverables Breakdown

### Deliverable 1: System Prompt (30%)

Your system prompt must include:

```markdown
## System Prompt Checklist
- [ ] Persona definition (name, role, expertise, tone)
- [ ] Instruction hierarchy (priority ordering)
- [ ] Rules (MUST do, MAY do, MUST NOT do)
- [ ] Tool definitions (if applicable)
- [ ] Safety guardrails (input filtering, output validation)
- [ ] Examples (2-3 diverse few-shot examples)
- [ ] Sandwich defense (critical rules at start AND end)
- [ ] Edge case handling instructions
- [ ] Escalation rules (when to defer/refuse)
```

**Grading rubric:**

| Criterion | Excellent (5) | Good (3-4) | Needs Work (1-2) |
|-----------|--------------|------------|-----------------|
| Completeness | All layers present | Most layers present | Missing key layers |
| Clarity | Unambiguous instructions | Mostly clear | Vague or contradictory |
| Robustness | Handles edge cases well | Handles common cases | Breaks on unusual input |
| Technique use | Uses 4+ techniques | Uses 2-3 techniques | Uses 1 technique |
| Production-ready | Deployable as-is | Needs minor refinement | Needs significant work |

### Deliverable 2: Evaluation Suite (25%)

Your eval suite must include:

```markdown
## Evaluation Suite Checklist
- [ ] At least 10 test cases total
- [ ] Category distribution:
  - [ ] 5+ standard/happy path cases
  - [ ] 3+ edge cases
  - [ ] 2+ adversarial cases
- [ ] Each test case has:
  - [ ] Unique ID
  - [ ] Input (user message or scenario)
  - [ ] Expected behavior (what the AI should do)
  - [ ] Category label
  - [ ] Difficulty rating
- [ ] Scoring rubric with dimensions and weights
- [ ] Pass/fail threshold defined
```

**Grading rubric:**

| Criterion | Excellent (5) | Good (3-4) | Needs Work (1-2) |
|-----------|--------------|------------|-----------------|
| Coverage | Tests all behaviors | Tests most behaviors | Missing key scenarios |
| Edge cases | Creative, realistic | Standard edge cases | Obvious cases only |
| Rubric quality | Specific, measurable | Mostly clear criteria | Vague criteria |
| Adversarial tests | Sophisticated attacks | Basic injection tests | No adversarial tests |

### Deliverable 3: Security Review (15%)

Your security review must include:

```markdown
## Security Review Checklist
- [ ] 5+ attack test cases:
  - [ ] 2+ prompt injection attempts
  - [ ] 1+ jailbreak attempt
  - [ ] 1+ system prompt extraction attempt
  - [ ] 1+ data exfiltration attempt
- [ ] Each attack test has:
  - [ ] Attack description
  - [ ] Attack input
  - [ ] Expected defense behavior
  - [ ] Actual result (pass/fail)
- [ ] Defense strategies documented
- [ ] Severity ratings for any vulnerabilities found
- [ ] Remediation plan for failures
```

### Deliverable 4: Documentation (15%)

Your documentation must explain:

```markdown
## Documentation Checklist
- [ ] Project overview (what it does, who it's for)
- [ ] Architecture decisions (why you chose each technique)
- [ ] Design rationale for key choices:
  - [ ] Why this persona?
  - [ ] Why these rules and priorities?
  - [ ] Why these tools (if applicable)?
  - [ ] Why these safety guardrails?
- [ ] Known limitations (what the system can't do)
- [ ] Future improvements (what you'd add with more time)
```

### Deliverable 5: Innovation (15%)

Demonstrate creative application of techniques. This could include:
- Novel combination of techniques not covered in a single module
- Creative tool definitions or agent loop designs
- Innovative evaluation approaches
- Cross-domain technique application
- Particularly elegant system prompt architecture

---

## Submission Format

Submit your capstone as a single structured response with these sections:

```
# Capstone Project: [Your Project Name]

## 1. Project Overview
[Brief description]

## 2. System Prompt
[Complete system prompt]

## 3. Evaluation Suite
[10+ test cases with rubrics]

## 4. Security Review
[5+ attack tests with results]

## 5. Design Documentation
[Architecture decisions and rationale]

## 6. Innovation Notes
[What makes your approach unique]
```

---

## Peer Review Process

After submission, your capstone may be evaluated by peers. Here's the peer review framework:

### Peer Review Rubric

```markdown
## Peer Review Form

Reviewer: _______________
Project: _______________

### System Prompt (30 points)
- Persona clarity: __/5
- Rule completeness: __/5
- Tool definitions (if applicable): __/5
- Safety guardrails: __/5
- Examples quality: __/5
- Overall architecture: __/5

### Evaluation Suite (25 points)
- Test case coverage: __/5
- Edge case creativity: __/5
- Rubric specificity: __/5
- Adversarial tests: __/5
- Overall thoroughness: __/5

### Security Review (15 points)
- Attack diversity: __/5
- Defense effectiveness: __/5
- Severity assessment: __/5

### Documentation (15 points)
- Decision rationale: __/5
- Known limitations honesty: __/5
- Writing clarity: __/5

### Innovation (15 points)
- Technique creativity: __/5
- Novel combinations: __/5
- Practical value: __/5

### Total: __/100
### Strengths:
### Areas for Improvement:
### One Suggestion:
```

---

## Tips for a Strong Capstone

### 1. Start with the Evaluation Suite
Design your test cases first. This forces you to think about what "success" looks like before building the system prompt. It's much easier to build toward defined success criteria.

### 2. Iterate on the System Prompt
Don't try to write the perfect system prompt in one pass. Write a draft, run your test cases, fix failures, and repeat. Most production prompts go through 5-10 iterations.

### 3. Red Team Your Own Work
Before submitting your security review, actually try to break your system. Be creative. The best capstones show evidence of iterative hardening.

### 4. Document Your Failures
The documentation section shouldn't just list successes. Explain what didn't work and why. Honest discussion of limitations demonstrates deeper understanding.

### 5. Keep It Realistic
Choose a scope you can execute well. A focused, polished project beats an ambitious but sloppy one. It's better to build an excellent code reviewer for one language than a mediocre one for five.

### 6. Show Your Technique Stack
Your system prompt should demonstrate techniques from multiple modules:
- Persona design (Module 15)
- Safety guardrails (Module 17)
- Chain-of-thought reasoning (Module 6)
- Output formatting (Module 5)
- Few-shot examples (Module 3)
- Evaluation methodology (Module 16)

---

## Example Capstone Structure: AI Code Review Bot

Here's a condensed example to illustrate the expected quality and structure:

```markdown
# Capstone: CodeGuard — AI Code Review Bot

## Project Overview
CodeGuard is a code review bot for Python that analyzes code
submissions and provides actionable feedback on bugs, performance,
security, readability, and best practices.

## System Prompt (abbreviated)
<persona>
You are CodeGuard, a senior software engineer specializing in
Python code review. 10+ years experience. Direct but constructive.
</persona>

<rules>
MUST: Flag security vulnerabilities as CRITICAL
MUST: Provide fix suggestions with code examples
MUST NOT: Rewrite entire functions without explaining why
MUST NOT: Suggest style changes without functional benefit
</rules>

<output_format>
## Review Summary
Severity counts: X critical, Y warning, Z info

## Issues Found
### [CRITICAL/WARNING/INFO] Issue Title
- Line(s): X-Y
- Problem: description
- Fix: suggested code
- Why: explanation
</output_format>

## Evaluation Suite
10 test cases covering: clean code (should find nothing),
buggy code (should find bugs), insecure code (should flag
security), stylistic issues, edge cases (empty file, binary
file, 10000-line file)

## Security Review
5 attack tests: prompt injection in code comments, malicious
code that tries to execute, system prompt extraction via code
that prints instructions, jailbreak via "debug mode" request

## Design Documentation
- Chose senior engineer persona for authoritative, constructive tone
- Severity system matches GitHub code review conventions
- Sandwich defense against injection in code comments
- Output format designed for integration with PR tools
```

---

## Grading Scale

| Grade | Score | Description |
|:-----:|:-----:|-------------|
| A+ | 95-100 | Exceptional — production-ready, innovative, thorough |
| A | 85-94 | Excellent — complete, well-tested, polished |
| B | 75-84 | Good — solid work with minor gaps |
| C | 65-74 | Adequate — meets basic requirements but lacks depth |
| D | 55-64 | Below average — significant gaps in deliverables |
| F | < 55 | Incomplete — missing major deliverables |

---

## Summary

| Deliverable | Key Focus |
|------------|-----------|
| System Prompt | Layered architecture with all 5 layers (persona, rules, tools, safety, examples) |
| Evaluation Suite | 10+ diverse test cases with measurable rubrics |
| Security Review | 5+ attack tests demonstrating defense-in-depth |
| Documentation | Honest, clear rationale for every design decision |
| Innovation | Creative technique combinations and novel applications |

---

## Final Note

The capstone is your portfolio piece. It demonstrates not just that you can write prompts, but that you can **engineer** them — designing, testing, securing, and documenting prompt-driven systems that are ready for the real world.

Good luck, and ship something you're proud of.
