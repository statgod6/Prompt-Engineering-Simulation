import { useState } from 'react'

export default function DuelPanel({ role, onSubmit, rounds, loading }) {
  const [prompt, setPrompt] = useState('')
  const isAttacker = role === 'attacker'

  const handleSubmit = () => {
    if (!prompt.trim()) return
    onSubmit(prompt.trim())
    setPrompt('')
  }

  const pastRounds = (rounds || []).filter(r => r.attack_output)

  return (
    <div className={`duel-panel ${isAttacker ? 'attacker' : 'defender'}`}>
      <div className="duel-panel-header">
        <span className={`role-badge ${isAttacker ? 'attacker' : 'defender'}`}>
          {isAttacker ? '🗡️ Attacker' : '🛡️ Defender'}
        </span>
      </div>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder={
          isAttacker
            ? 'Write your injection attack prompt...'
            : 'Write your defense system prompt...'
        }
        disabled={loading}
      />

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={loading || !prompt.trim()}
      >
        {loading ? 'Processing...' : `Submit ${isAttacker ? 'Attack' : 'Defense'}`}
      </button>

      {pastRounds.length > 0 && (
        <div className="round-history">
          <span className="round-history-title">Round History</span>
          {pastRounds.map((r) => (
            <div key={r.id || r.round_number} className="round-history-item">
              <span>Round {r.round_number}</span>
              <span
                className={`round-result-tag ${r.attack_succeeded ? 'success' : 'defended'}`}
              >
                {r.attack_succeeded ? 'Breached' : 'Defended'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
