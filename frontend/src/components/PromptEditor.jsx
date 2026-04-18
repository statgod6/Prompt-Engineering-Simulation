import { useState, useCallback, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import '../styles/SimulationComponents.css'

const TABS = [
  { key: 'system', label: 'System', placeholder: 'Enter system instructions...' },
  { key: 'user', label: 'User', placeholder: 'Write your prompt here...' },
  { key: 'assistant', label: 'Assistant', placeholder: 'Pre-fill assistant response...' },
]

const minHeightExtension = EditorView.theme({
  '&': { minHeight: '200px' },
  '.cm-content, .cm-gutter': { minHeight: '200px' },
  '.cm-scroller': { overflow: 'auto' },
})

export function getMessagesArray(systemPrompt, userPrompt, assistantPrompt) {
  const messages = []
  if (systemPrompt?.trim()) messages.push({ role: 'system', content: systemPrompt.trim() })
  if (userPrompt?.trim()) messages.push({ role: 'user', content: userPrompt.trim() })
  if (assistantPrompt?.trim()) messages.push({ role: 'assistant', content: assistantPrompt.trim() })
  return messages
}

export default function PromptEditor({
  systemPrompt = '',
  userPrompt = '',
  assistantPrompt = '',
  onSystemChange,
  onUserChange,
  onAssistantChange,
  readOnly = false,
}) {
  const [activeTab, setActiveTab] = useState('user')

  const values = useMemo(() => ({
    system: systemPrompt,
    user: userPrompt,
    assistant: assistantPrompt,
  }), [systemPrompt, userPrompt, assistantPrompt])

  const handlers = useMemo(() => ({
    system: onSystemChange,
    user: onUserChange,
    assistant: onAssistantChange,
  }), [onSystemChange, onUserChange, onAssistantChange])

  const extensions = useMemo(() => [
    EditorView.lineWrapping,
    minHeightExtension,
  ], [])

  const handleChange = useCallback((val) => {
    handlers[activeTab]?.(val)
  }, [activeTab, handlers])

  const currentTab = TABS.find(t => t.key === activeTab)

  return (
    <div className="prompt-editor">
      <div className="prompt-editor__tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`prompt-editor__tab ${activeTab === tab.key ? 'prompt-editor__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key !== 'user' && <span className="prompt-editor__tab-optional">optional</span>}
          </button>
        ))}
      </div>
      <div className="prompt-editor__body">
        <CodeMirror
          value={values[activeTab]}
          onChange={handleChange}
          theme={oneDark}
          placeholder={currentTab.placeholder}
          readOnly={readOnly}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
          }}
          extensions={extensions}
        />
      </div>
    </div>
  )
}
