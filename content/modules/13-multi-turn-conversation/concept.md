# Module 13: Multi-Turn Conversation Design

## Introduction

Most real-world LLM applications aren't single-shot prompts—they're **conversations**. Chatbots, virtual assistants, interview systems, tutoring apps, and customer support agents all require the model to maintain coherent context across multiple turns. And this is surprisingly hard to get right.

Multi-turn conversation design is where prompt engineering meets **system design**. You're not just writing a prompt—you're designing a state machine, a memory system, and a conversation flow controller all at once.

This module covers:

- Multi-turn conversation fundamentals
- Context management across turns
- Memory summarization techniques
- State tracking patterns
- Conversation flow control
- Handling topic switches gracefully
- Designing conversation endings
- Managing the context window efficiently

---

## How Multi-Turn Conversations Work

In a multi-turn conversation, each new message from the user is sent to the model along with the **entire conversation history**:

```
Turn 1:
  System: "You are a helpful assistant."
  User: "What's the weather like?"
  Assistant: "I'd be happy to help! Could you tell me your location?"

Turn 2:
  System: "You are a helpful assistant."
  User: "What's the weather like?"
  Assistant: "I'd be happy to help! Could you tell me your location?"
  User: "I'm in New York."                        ← NEW
  Assistant: "It's currently 72°F in New York..."  ← NEW
```

### The Key Insight

LLMs don't actually "remember" anything. Every turn, the model reads the **entire conversation from scratch** and generates the next response. What looks like memory is actually **context window management**.

This has critical implications:

| Property | Implication |
|----------|------------|
| No persistent memory | Everything must be in the context window |
| Full re-read each turn | Long conversations get expensive |
| Context window limits | Old messages eventually get dropped |
| No implicit state | State must be explicitly tracked |

> **Tip:** The model doesn't "remember" turn 3 when it's on turn 10. It **re-reads** turns 1-9 every single time. This means conversation quality depends entirely on what's in the context window.

---

## Context Management Across Turns

As conversations grow, you face a fundamental tension: you want the model to remember everything, but the context window is finite. Here are the strategies.

### Strategy 1: Full History

Include the complete conversation history every turn.

```python
messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": "Turn 1 message"},
    {"role": "assistant", "content": "Turn 1 response"},
    {"role": "user", "content": "Turn 2 message"},
    {"role": "assistant", "content": "Turn 2 response"},
    # ... all turns ...
    {"role": "user", "content": "Current message"},
]
```

**Pros:** Complete context, nothing lost
**Cons:** Hits context limits on long conversations, expensive

**Best for:** Short conversations (< 20 turns), high-stakes interactions

### Strategy 2: Sliding Window

Keep only the last N turns:

```python
def sliding_window(messages, window_size=10):
    system = messages[0]  # Always keep system prompt
    recent = messages[-(window_size * 2):]  # Last N turn pairs
    return [system] + recent
```

**Pros:** Constant context size, predictable cost
**Cons:** Loses early context, model may forget earlier agreements

**Best for:** Long conversations where recent context matters most

### Strategy 3: Summarization

Periodically summarize older turns and replace them with the summary:

```python
messages = [
    {"role": "system", "content": system_prompt},
    {"role": "system", "content": "Summary of turns 1-10: The user asked about..."},
    {"role": "user", "content": "Turn 11 message"},
    {"role": "assistant", "content": "Turn 11 response"},
    # ... recent turns ...
]
```

**Pros:** Retains key information, manageable context size
**Cons:** Summarization can lose nuance, adds processing step

**Best for:** Long conversations where early context is important

### Strategy 4: Hybrid (Recommended)

Combine summarization for old turns with full history for recent turns:

```
┌───────────────────────────────────────────────┐
│ System Prompt                                  │
├───────────────────────────────────────────────┤
│ Summary of turns 1-20                          │
├───────────────────────────────────────────────┤
│ Current State: {key tracking variables}        │
├───────────────────────────────────────────────┤
│ Turn 21 (full)                                 │
│ Turn 22 (full)                                 │
│ Turn 23 (full)                                 │
│ Turn 24 (full)                                 │
│ Turn 25 (full) ← current turn                  │
└───────────────────────────────────────────────┘
```

---

## Memory Summarization

When conversations get long, you need to compress old turns into summaries. This is an art form.

### Summarization Prompt

```markdown
Summarize the following conversation segment concisely.
Preserve:
- Key decisions made
- Important facts shared by the user
- Agreements or commitments made by the assistant
- Any unresolved questions or pending items

Do NOT include:
- Pleasantries or small talk
- Repeated information
- Verbose explanations

Conversation to summarize:
{{old_turns}}

Summary:
```

### What to Keep vs. Discard

| Keep | Discard |
|------|---------|
| User's name and preferences | Greetings and pleasantries |
| Decisions and agreements | Repeated clarifications |
| Key facts and data points | Thinking-out-loud content |
| Open questions | Already-resolved questions |
| Important constraints | Filler conversation |

### Incremental Summarization

Instead of summarizing all at once, update the summary incrementally:

```python
def update_summary(existing_summary, new_turns):
    prompt = f"""Here is an existing conversation summary:
{existing_summary}

Here are new turns to incorporate:
{new_turns}

Update the summary to include the new information.
Keep it concise but complete. Remove anything that's
no longer relevant given the new turns."""

    return llm.complete(prompt)
```

> **Tip:** Summarize every 5-10 turns rather than waiting until the context window fills up. Frequent small summaries preserve more detail than one big summary.

---

## State Tracking

State tracking is the practice of maintaining structured data about the conversation's current status. Instead of relying on the model to infer state from conversation history, you **explicitly track it**.

### What to Track

| State Variable | Example |
|---------------|---------|
| User info gathered | name: "Alice", role: "Senior Engineer" |
| Topics covered | ["experience", "system design", "NOT: behavioral"] |
| Decisions made | ["Proceed with technical round", "Skip coding exercise"] |
| Current phase | "technical_questions" |
| Items pending | ["Ask about team leadership", "Follow up on Python experience"] |

### State as a System Message

Inject the current state as a system message at each turn:

```markdown
## Current Conversation State
```json
{
  "phase": "technical_interview",
  "turn_number": 7,
  "topics_covered": ["background", "python_experience", "system_design"],
  "topics_remaining": ["behavioral", "culture_fit"],
  "candidate_info": {
    "name": "Alice Chen",
    "role_applied": "Senior Software Engineer",
    "years_experience": 8
  },
  "assessment_so_far": {
    "technical_skill": "strong",
    "communication": "excellent",
    "areas_to_probe": ["leadership experience", "conflict resolution"]
  }
}
```

### Updating State

After each turn, update the state:

```python
def update_state(state, user_message, assistant_response):
    prompt = f"""Given the current conversation state and the latest exchange,
update the state JSON.

Current state:
{json.dumps(state, indent=2)}

User said: {user_message}
Assistant said: {assistant_response}

Output the updated state as JSON only:"""

    updated = llm.complete(prompt, temperature=0)
    return json.loads(updated)
```

---

## Conversation Flow Control

In structured conversations (interviews, surveys, guided processes), you need to control the conversation's flow—what topic comes next, when to transition, and when to end.

### Linear Flow

Topics follow a fixed sequence:

```markdown
Follow this conversation structure:
1. Greeting and introduction (1-2 turns)
2. Background questions (2-3 turns)
3. Technical assessment (4-5 turns)
4. Behavioral questions (2-3 turns)
5. Candidate's questions (1-2 turns)
6. Closing and next steps (1 turn)

You are currently on step {{current_step}}.
After completing the required turns for this step,
transition to the next step naturally.
```

### Conditional Flow

Topics depend on previous answers:

```markdown
After the technical assessment:
- If the candidate scored HIGH: Move to advanced architecture questions
- If the candidate scored MEDIUM: Ask clarifying technical questions
- If the candidate scored LOW: Transition to behavioral (skip advanced)
```

### Flow Control Prompt Pattern

```markdown
## Conversation Flow Rules

You are conducting a structured conversation with these phases:
{{phase_descriptions}}

Current phase: {{current_phase}}
Turns in current phase: {{turns_in_phase}}
Maximum turns for this phase: {{max_turns}}

TRANSITION RULES:
- Move to the next phase when: {{transition_condition}}
- If the user tries to skip ahead: gently redirect to the current phase
- If the user goes off-topic: acknowledge briefly, then return to the flow
- Never repeat a phase that has been completed
```

---

## Handling Topic Switches

Users don't follow scripts. They change topics mid-conversation, bring up previous topics, and ask tangential questions. Your prompt must handle this gracefully.

### The Topic Switch Taxonomy

| Switch Type | Example | Best Response |
|-------------|---------|--------------|
| Relevant digression | "Actually, about that Python question..." | Allow it, then return |
| Off-topic question | "What's for lunch?" | Brief acknowledgment, redirect |
| Return to earlier topic | "Going back to the system design..." | Welcome it, pick up context |
| Complete non-sequitur | "Do you like cats?" | Polite redirect |

### Handling Pattern

```markdown
If the user changes topic mid-conversation:
1. ACKNOWLEDGE what they said (don't ignore it)
2. RESPOND briefly if it's a quick question
3. BRIDGE back to the current conversation flow
4. TRACK that this topic was raised (in case they want to return)

Example:
User: "Actually, before we continue — is there parking at the office?"
You: "Great question! Yes, we offer free parking in the garage on
     levels 2-4. Now, back to your experience with microservices —
     you mentioned you worked on a migration project?"
```

---

## Graceful Conversation Endings

Knowing when and how to end a conversation is as important as starting one.

### Ending Triggers

| Trigger | Example |
|---------|---------|
| All topics covered | Interview complete, all questions asked |
| User signals done | "That's all I needed, thanks" |
| Turn limit reached | Maximum conversation length hit |
| Task completed | User's problem is solved |
| Dead end | Conversation isn't progressing |

### The Graceful Exit Prompt

```markdown
When ending the conversation:
1. Summarize what was covered
2. Note any open items or next steps
3. Thank the user / candidate
4. Provide a clear conclusion

DO NOT:
- End abruptly without summary
- Leave open questions unaddressed
- Make promises you can't keep
- Drag the conversation beyond its natural end
```

### Exit Summary Template

```markdown
## Conversation Summary

**Topics Covered:**
{{list_of_topics}}

**Key Outcomes:**
{{decisions_made}}

**Next Steps:**
{{action_items}}

**Open Questions:**
{{unresolved_items}}
```

---

## Designing the Interview Bot (Case Study)

Let's design a multi-turn interview bot step by step, combining all the patterns from this module.

### System Prompt Architecture

```
┌─────────────────────────────────────────────────┐
│ 1. Role & Persona                                │
│    "You are an experienced technical interviewer" │
├─────────────────────────────────────────────────┤
│ 2. Interview Structure                            │
│    Phases, turn counts, transition rules          │
├─────────────────────────────────────────────────┤
│ 3. Question Bank                                  │
│    Categories of questions to draw from           │
├─────────────────────────────────────────────────┤
│ 4. Evaluation Criteria                            │
│    What to assess and how                        │
├─────────────────────────────────────────────────┤
│ 5. Flow Control Rules                            │
│    Topic switches, redirects, pacing             │
├─────────────────────────────────────────────────┤
│ 6. State Tracking Instructions                   │
│    What to track and how to update               │
├─────────────────────────────────────────────────┤
│ 7. Closing Instructions                          │
│    How to end and produce final assessment       │
└─────────────────────────────────────────────────┘
```

### Interview Phases

| Phase | Turns | Purpose |
|-------|-------|---------|
| Introduction | 1-2 | Welcome, set expectations |
| Background | 2-3 | Work history, current role |
| Technical: Language | 2-3 | Programming knowledge |
| Technical: System Design | 3-4 | Architecture skills |
| Behavioral | 2-3 | Soft skills, teamwork |
| Candidate Questions | 1-2 | Their questions about the role |
| Closing | 1 | Summary and next steps |

### Adaptive Questioning

The bot should **follow up** based on answers, not just read from a script:

```markdown
Follow-up rules:
- If the candidate gives a SHORT answer: ask for more detail
  "Could you elaborate on that? What specific challenges did you face?"
- If the candidate gives a STRONG answer: go deeper
  "That's interesting. How would you modify that approach for 10x scale?"
- If the candidate STRUGGLES: offer a hint, then move on
  "Let me rephrase: what data structure would you use here?"
- If the candidate goes OFF-TOPIC: gently redirect
  "That's a great point about [topic]. Let's come back to [current question]."
```

### Final Assessment

At the end, the bot should produce a structured assessment:

```markdown
After the interview is complete, produce a final assessment:

## Interview Assessment — {{candidate_name}}

### Technical Skills
- Programming: [1-5] — {{evidence}}
- System Design: [1-5] — {{evidence}}
- Problem Solving: [1-5] — {{evidence}}

### Soft Skills
- Communication: [1-5] — {{evidence}}
- Collaboration: [1-5] — {{evidence}}

### Overall Recommendation
[Strong Hire / Hire / Borderline / No Hire]

### Key Strengths
- {{strength_1}}
- {{strength_2}}

### Areas of Concern
- {{concern_1}}
- {{concern_2}}

### Notes for Next Round
{{notes}}
```

---

## Common Pitfalls

### 1. Context Window Overflow

**Problem:** Conversation gets too long, old turns drop off silently.
**Fix:** Implement summarization before hitting limits. Track token count.

### 2. Character Drift

**Problem:** The model gradually loses its persona over many turns.
**Fix:** Reinforce the persona in the system prompt and periodically in state updates.

### 3. Repetitive Questions

**Problem:** The model asks the same question twice because it "forgot."
**Fix:** State tracking — maintain a list of topics already covered.

### 4. No Exit Strategy

**Problem:** The conversation goes on forever without resolution.
**Fix:** Define explicit exit conditions and a maximum turn count.

### 5. Ignoring User Signals

**Problem:** User says "I think that's it" but the model continues asking questions.
**Fix:** Add explicit instructions to detect and respect exit signals.

---

## Summary

| Concept | Key Takeaway |
|---------|--------------|
| Context management | The model re-reads everything each turn — manage what's in the window |
| Memory summarization | Compress old turns; keep decisions, discard pleasantries |
| State tracking | Explicit JSON state is more reliable than implicit context |
| Flow control | Define phases, transition rules, and maximum turns per phase |
| Topic switches | Acknowledge, respond briefly, bridge back to the flow |
| Graceful endings | Summarize, note next steps, provide clear closure |

> **Key Insight:** Multi-turn conversations are stateless at the model level. Every illusion of memory, flow, and continuity comes from how you structure the context window. Design accordingly.

---

## What's Next?

In the simulation for this module, you'll design a complete job interview bot that conducts a 15-turn technical interview. The bot must ask relevant questions, follow up based on answers, track topics covered, and produce a final assessment. You'll see how system prompt design, state tracking, and flow control come together in a real multi-turn application.
