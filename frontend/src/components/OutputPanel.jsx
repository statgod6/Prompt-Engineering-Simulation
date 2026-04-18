import { useState, useRef, useEffect } from 'react'
import '../styles/SimulationComponents.css'

export default function OutputPanel({
  output = '',
  loading = false,
  streaming = false,
  model = '',
  responseTime = null,
  tokenCount = null,
  onClear,
}) {
  const [wordWrap, setWordWrap] = useState(true)
  const [copied, setCopied] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const outputRef = useRef(null)
  const streamIndex = useRef(0)

  // Handle streaming effect
  useEffect(() => {
    if (!streaming || !output) {
      setDisplayedText(output)
      streamIndex.current = output?.length || 0
      return
    }

    if (streamIndex.current >= output.length) {
      setDisplayedText(output)
      return
    }

    const timer = setInterval(() => {
      streamIndex.current = Math.min(streamIndex.current + 3, output.length)
      setDisplayedText(output.slice(0, streamIndex.current))
      if (streamIndex.current >= output.length) clearInterval(timer)
    }, 16)

    return () => clearInterval(timer)
  }, [output, streaming])

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (outputRef.current && (streaming || loading)) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [displayedText, loading, streaming])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const handleClear = () => {
    setDisplayedText('')
    streamIndex.current = 0
    onClear?.()
  }

  const isEmpty = !output && !loading

  return (
    <div className="output-panel">
      <div className="output-panel__header">
        <div className="output-panel__meta">
          {model && <span className="output-panel__model">{model}</span>}
          {responseTime != null && (
            <span className="output-panel__time">{responseTime}ms</span>
          )}
          {tokenCount != null && (
            <span className="output-panel__tokens">{tokenCount} tokens</span>
          )}
        </div>
        <div className="output-panel__actions">
          <button
            className="output-panel__action-btn"
            onClick={() => setWordWrap(w => !w)}
            title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
            type="button"
          >
            {wordWrap ? '↩' : '→'}
          </button>
          <button
            className="output-panel__action-btn"
            onClick={handleCopy}
            disabled={!output}
            title="Copy to clipboard"
            type="button"
          >
            {copied ? '✓' : '⧉'}
          </button>
          <button
            className="output-panel__action-btn"
            onClick={handleClear}
            disabled={isEmpty}
            title="Clear output"
            type="button"
          >
            ✕
          </button>
        </div>
      </div>

      <div
        className={`output-panel__body ${wordWrap ? 'output-panel__body--wrap' : ''}`}
        ref={outputRef}
      >
        {loading && !output ? (
          <div className="output-panel__loading">
            <span className="output-panel__dot" />
            <span className="output-panel__dot" />
            <span className="output-panel__dot" />
          </div>
        ) : isEmpty ? (
          <div className="output-panel__empty">
            Run your prompt to see output here
          </div>
        ) : (
          <pre className="output-panel__text">{streaming ? displayedText : output}</pre>
        )}
      </div>
    </div>
  )
}
