import { useState, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useModule } from '../hooks/useModule'
import { useRun } from '../hooks/useRun'
import { useEvaluate } from '../hooks/useEvaluate'
import PromptEditor, { getMessagesArray } from '../components/PromptEditor'
import ModelSelector from '../components/ModelSelector'
import OutputPanel from '../components/OutputPanel'
import ParameterControls, { DEFAULT_PARAMS } from '../components/ParameterControls'
import TokenCounter from '../components/TokenCounter'
import ScorePanel from '../components/ScorePanel'
import TestCaseRunner from '../components/TestCaseRunner'
import TimerWidget from '../components/TimerWidget'
import '../styles/SimulationWorkspace.css'

const TYPE_LABELS = {
  free_lab: 'Free Lab',
  fix_the_prompt: 'Fix the Prompt',
  build_to_spec: 'Build to Spec',
  adversarial: 'Adversarial',
  pipeline: 'Pipeline',
  speed_run: 'Speed Run',
  token_budget: 'Token Budget',
  explore: 'Explore',
  creative: 'Creative',
  debug: 'Debug',
}

export default function SimulationWorkspace() {
  const { id } = useParams()
  const { module: mod, simulation, loading: moduleLoading, error: moduleError } = useModule(id)
  const { output, loading: runLoading, error: runError, responseTime, tokenCount, runPrompt, clearOutput } = useRun()
  const { score, loading: evalLoading, evaluate } = useEvaluate()

  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [assistantPrompt, setAssistantPrompt] = useState('')
  const [model, setModel] = useState('openai/gpt-4o')
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [pipelineStep, setPipelineStep] = useState(0)
  const [pipelineOutputs, setPipelineOutputs] = useState([])
  const [timerActive, setTimerActive] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Initialize prompts from simulation config
  const simType = simulation?.type || 'free_lab'
  const testCases = simulation?.test_cases || simulation?.testCases || []
  const timeLimitSeconds = simType === 'speed_run' ? (simulation?.time_limit || 300) : null
  const tokenBudget = simType === 'token_budget' ? (simulation?.token_budget || 500) : null
  const pipelineSteps = simulation?.steps || []

  // Pre-load broken prompt for fix_the_prompt
  const brokenPrompt = simulation?.broken_prompt || simulation?.default_prompt || ''
  const referenceOutput = simulation?.reference_output || ''

  // Compute input text for token counter
  const inputText = useMemo(
    () => [systemPrompt, userPrompt, assistantPrompt].filter(Boolean).join('\n'),
    [systemPrompt, userPrompt, assistantPrompt]
  )

  const handleRun = useCallback(async () => {
    const messages = getMessagesArray(systemPrompt, userPrompt, assistantPrompt)
    if (!messages.length) return

    setTimerActive(true)
    try {
      const result = await runPrompt({
        model,
        messages,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        topP: params.topP,
        frequencyPenalty: params.frequencyPenalty,
        presencePenalty: params.presencePenalty,
        simulationId: simulation?.id,
      })

      // Auto-evaluate if simulation has scoring config
      if (simulation?.scoring || simulation?.test_cases?.length) {
        await evaluate({
          output: result.content,
          testCase: simulation.test_cases?.[0],
          scoring: simulation.scoring,
          simulationId: simulation.id,
        })
      }
    } catch {
      // Error already set in useRun hook
    }
  }, [systemPrompt, userPrompt, assistantPrompt, model, params, simulation, runPrompt, evaluate])

  const handleSubmitBest = useCallback(() => {
    setSubmitted(true)
    // In production: POST to /api/progress to update module score
  }, [])

  const handleTestsComplete = useCallback((results) => {
    const passCount = results.filter(r => r.status === 'pass').length
    const passRate = passCount / results.length
    // Could trigger evaluation with aggregate results
    console.log(`Tests complete: ${passCount}/${results.length} passed (${Math.round(passRate * 100)}%)`)
  }, [])

  const handleClear = useCallback(() => {
    clearOutput()
  }, [clearOutput])

  // Loading state
  if (moduleLoading) {
    return (
      <div className="sim-workspace">
        <div className="sim-workspace__loading">Loading simulation...</div>
      </div>
    )
  }

  // Error state
  if (moduleError) {
    return (
      <div className="sim-workspace">
        <div className="sim-workspace__error">
          <span>Failed to load simulation</span>
          <Link to={`/modules/${id}`} className="sim-workspace__back">Back to Module</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="sim-workspace">
      {/* === Top Bar === */}
      <div className="sim-workspace__topbar">
        <Link to={`/modules/${id}`} className="sim-workspace__back">← Back</Link>

        <div className="sim-workspace__info">
          <span className="sim-workspace__module-title">{mod?.title || `Module ${id}`}</span>
          <span className="sim-workspace__sim-name">{simulation?.title || 'Simulation'}</span>
        </div>

        <span className="sim-workspace__type-badge">{TYPE_LABELS[simType] || simType}</span>

        <div className="sim-workspace__topbar-right">
          <ModelSelector selectedModel={model} onModelChange={setModel} />
          <TokenCounter inputText={inputText} model={model} maxTokens={params.maxTokens} />

          {timeLimitSeconds && (
            <TimerWidget
              timeLimitSeconds={timeLimitSeconds}
              onTimeUp={() => setTimerActive(false)}
              active={timerActive}
            />
          )}

          {tokenBudget && (
            <div className="sim-workspace__token-budget">
              Budget: {tokenBudget} tokens
            </div>
          )}

          <button
            className={`sim-workspace__run-btn ${runLoading ? 'sim-workspace__run-btn--loading' : ''}`}
            onClick={handleRun}
            disabled={runLoading}
            type="button"
          >
            {runLoading ? <span className="sim-workspace__run-spinner" /> : '▶'}
            {runLoading ? 'Running...' : 'Run'}
          </button>

          {score && !submitted && (
            <button
              className="sim-workspace__submit-btn"
              onClick={handleSubmitBest}
              type="button"
            >
              Submit Best Attempt
            </button>
          )}
        </div>
      </div>

      {/* === Main Area === */}
      <div className="sim-workspace__main">
        {/* Left Panel */}
        <div className="sim-workspace__left">
          {/* Instructions banner for build_to_spec / adversarial */}
          {(simType === 'build_to_spec' || simType === 'adversarial') && simulation?.instructions && (
            <div className="sim-workspace__instructions">
              <strong>Instructions:</strong> {simulation.instructions}
            </div>
          )}

          {/* Reference output for fix_the_prompt */}
          {simType === 'fix_the_prompt' && referenceOutput && (
            <div className="sim-workspace__reference">
              <div className="sim-workspace__reference-label">Original (Broken) Output</div>
              <div className="sim-workspace__reference-text">{referenceOutput}</div>
            </div>
          )}

          {/* Pipeline step tabs */}
          {simType === 'pipeline' && pipelineSteps.length > 0 && (
            <div className="sim-workspace__pipeline-tabs">
              {pipelineSteps.map((step, i) => (
                <button
                  key={i}
                  className={`sim-workspace__pipeline-tab ${i === pipelineStep ? 'sim-workspace__pipeline-tab--active' : ''}`}
                  onClick={() => setPipelineStep(i)}
                  type="button"
                >
                  Step {i + 1}: {step.name || `Step ${i + 1}`}
                </button>
              ))}
            </div>
          )}

          <PromptEditor
            systemPrompt={simType === 'fix_the_prompt' && !systemPrompt ? brokenPrompt : systemPrompt}
            userPrompt={userPrompt}
            assistantPrompt={assistantPrompt}
            onSystemChange={setSystemPrompt}
            onUserChange={setUserPrompt}
            onAssistantChange={setAssistantPrompt}
          />

          <ParameterControls params={params} onChange={setParams} />
        </div>

        {/* Right Panel */}
        <div className="sim-workspace__right">
          <OutputPanel
            output={output}
            loading={runLoading}
            streaming={runLoading}
            model={model}
            responseTime={responseTime}
            tokenCount={tokenCount?.total}
            onClear={handleClear}
          />

          <ScorePanel
            score={score}
            passThreshold={mod?.passThreshold || 0.7}
            loading={evalLoading}
          />
        </div>
      </div>

      {/* === Bottom Bar: Test Case Runner === */}
      {(simType === 'build_to_spec' || simType === 'adversarial' || testCases.length > 0) && (
        <TestCaseRunner
          testCases={testCases}
          prompt={{ system: systemPrompt, user: userPrompt, assistant: assistantPrompt }}
          model={model}
          params={params}
          onComplete={handleTestsComplete}
        />
      )}
    </div>
  )
}
