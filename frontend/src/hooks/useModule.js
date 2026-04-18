import { useState, useEffect } from 'react'
import api from '../api/client'

/** Map a snake_case API module object to the camelCase shape the UI expects. */
function normalizeModule(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    number: raw.number,
    title: raw.title ?? '',
    part: raw.part,
    partTitle: raw.partTitle ?? raw.part_title ?? '',
    description: raw.description ?? '',
    passThreshold: Number(raw.passThreshold ?? raw.pass_threshold ?? 0.7),
    unlockAfter: raw.unlockAfter ?? raw.unlock_after ?? null,
    status: raw.status ?? 'available',
    bestScore: Number(raw.bestScore ?? raw.best_score ?? 0),
    attempts: Number(raw.attempts ?? 0),
    timeSpent: Number(raw.timeSpent ?? raw.time_spent ?? 0),
  }
}

/** Normalize a simulation response. */
function normalizeSimulation(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    simId: raw.simId ?? raw.sim_id ?? '',
    title: raw.title ?? '',
    type: raw.type ?? 'build_to_spec',
    instructions: raw.instructions ?? '',
    configJson: raw.configJson ?? raw.config_json ?? null,
    default_model: raw.default_model ?? 'openai/gpt-4o',
    allowedModels: raw.allowedModels ?? raw.allowed_models ?? null,
    testCaseCount: raw.testCaseCount ?? raw.test_case_count ?? raw.configJson?.test_cases?.length ?? raw.config_json?.test_cases?.length ?? 0,
    conceptContent: raw.conceptContent ?? raw.concept_content ?? '',
  }
}

export function useModule(moduleId) {
  const [module, setModule] = useState(null)
  const [simulation, setSimulation] = useState(null)
  const [concept, setConcept] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchModule = async () => {
      setLoading(true)
      setError(null)
      try {
        const [modRes, simRes] = await Promise.all([
          api.get(`/modules/${moduleId}`),
          api.get(`/modules/${moduleId}/simulation`)
        ])

        // ModuleDetailResponse wraps: { module, simulation, concept_content }
        const detail = modRes.data
        const rawModule = detail.module ?? detail
        setModule(normalizeModule(rawModule))

        // Simulation: prefer the detail wrapper, fall back to direct sim endpoint
        const rawSim = detail.simulation ?? simRes.data?.simulation ?? simRes.data
        setSimulation(normalizeSimulation(rawSim))

        setConcept(
          detail.concept_content ??
          simRes.data?.concept_content ??
          rawModule.concept_content ??
          ''
        )
      } catch (err) {
        // Mock data fallback for development
        setModule(getMockModule(moduleId))
        setSimulation(getMockSimulation(moduleId))
        setConcept(getMockConcept())
      } finally {
        setLoading(false)
      }
    }
    if (moduleId) fetchModule()
  }, [moduleId])

  return { module, simulation, concept, loading, error }
}

// Comprehensive mock data for dev
function getMockModule(id) {
  const numId = Number(id)
  const modules = {
    1: { id: 1, number: 1, title: 'What is Prompt Engineering?', part: 1, partTitle: 'Foundations', passThreshold: 0.7, bestScore: 0.95, attempts: 3, timeSpent: 2340, status: 'completed' },
    2: { id: 2, number: 2, title: 'Anatomy of a Good Prompt', part: 1, partTitle: 'Foundations', passThreshold: 0.7, bestScore: 0.82, attempts: 2, timeSpent: 1800, status: 'completed' },
    3: { id: 3, number: 3, title: 'Zero-Shot & Few-Shot Prompting', part: 1, partTitle: 'Foundations', passThreshold: 0.7, bestScore: 0, attempts: 0, timeSpent: 0, status: 'available' },
    4: { id: 4, number: 4, title: 'Role & Persona Prompting', part: 1, partTitle: 'Foundations', passThreshold: 0.7, bestScore: 0, attempts: 0, timeSpent: 0, status: 'available' },
    5: { id: 5, number: 5, title: 'Output Formatting', part: 2, partTitle: 'Core Techniques', passThreshold: 0.7, bestScore: 0, attempts: 0, timeSpent: 0, status: 'locked' },
    6: { id: 6, number: 6, title: 'Chain-of-Thought Prompting', part: 2, partTitle: 'Core Techniques', passThreshold: 0.75, bestScore: 0, attempts: 0, timeSpent: 0, status: 'locked' },
    10: { id: 10, number: 10, title: 'Self-Consistency', part: 3, partTitle: 'Advanced Methods', passThreshold: 0.8, bestScore: 0, attempts: 0, timeSpent: 0, status: 'locked' },
    15: { id: 15, number: 15, title: 'System Prompt Architecture', part: 4, partTitle: 'Production & Ops', passThreshold: 0.8, bestScore: 0, attempts: 0, timeSpent: 0, status: 'locked' },
  }
  return modules[numId] || {
    id: numId,
    number: numId,
    title: `Module ${numId}`,
    part: Math.ceil(numId / 5),
    partTitle: ['Foundations', 'Core Techniques', 'Advanced Methods', 'Production & Ops'][Math.ceil(numId / 5) - 1] || 'Foundations',
    passThreshold: 0.7,
    bestScore: 0,
    attempts: 0,
    timeSpent: 0,
    status: 'available',
  }
}

function getMockSimulation(id) {
  const simTitles = {
    1: 'The Prompt Awakens',
    2: 'Anatomy Lab',
    3: 'The Example Ladder',
    4: 'The Persona Workshop',
    5: 'Format Factory',
    6: 'Chain Reaction',
  }
  const simTypes = {
    1: 'explore',
    2: 'build_to_spec',
    3: 'build_to_spec',
    4: 'creative',
    5: 'build_to_spec',
    6: 'debug',
  }
  const numId = Number(id)
  return {
    id: `sim-${String(numId).padStart(2, '0')}`,
    title: simTitles[numId] || 'The Example Ladder',
    type: simTypes[numId] || 'build_to_spec',
    instructions: 'Build a sentiment classifier prompt. Start with zero-shot, then add examples progressively to improve accuracy across edge cases.',
    default_model: 'openai/gpt-4o',
    testCaseCount: 20,
  }
}

function getMockConcept() {
  return `## Introduction

Prompt engineering is the practice of designing and refining inputs to large language models (LLMs) to elicit desired outputs. It sits at the intersection of art and science — requiring both creative intuition and systematic experimentation.

### Why It Matters

As LLMs become integral to software systems, the quality of prompts directly impacts:

- **Accuracy** — Getting correct, relevant responses
- **Consistency** — Producing reliable outputs across inputs
- **Efficiency** — Minimizing token usage and API costs
- **Safety** — Avoiding harmful or biased outputs

### Zero-Shot Prompting

Zero-shot prompting means giving the model a task without any examples. You rely entirely on the model's pre-trained knowledge.

\`\`\`python
prompt = """Classify the sentiment of the following review as 
positive, negative, or neutral.

Review: "The battery life is amazing but the screen is too dim."
Sentiment:"""
\`\`\`

The model must infer the task structure from the instruction alone.

### Few-Shot Prompting

Few-shot prompting provides examples before the actual task, helping the model understand the expected format and reasoning pattern.

\`\`\`python
prompt = """Classify sentiment as positive, negative, or neutral.

Review: "I love this product!" → positive
Review: "Terrible experience." → negative  
Review: "It's okay, nothing special." → neutral
Review: "The battery life is amazing but the screen is too dim."
Sentiment:"""
\`\`\`

> **Tip:** Start with 2-3 diverse examples that cover different cases. More examples aren't always better — quality and diversity matter more than quantity.

### When to Use Each

| Approach | Best For | Trade-offs |
|----------|----------|------------|
| Zero-shot | Simple, well-defined tasks | May lack consistency |
| Few-shot | Complex or ambiguous tasks | Uses more tokens |
| One-shot | Quick format demonstration | Limited coverage |

### Key Takeaways

1. Zero-shot works well when the task is unambiguous
2. Few-shot examples act as implicit instructions
3. Example selection significantly impacts output quality
4. Balance between example count and token budget`
}
