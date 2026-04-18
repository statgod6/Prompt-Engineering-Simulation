import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import DuelPanel from '../components/DuelPanel'
import '../styles/DuelCapstone.css'

export default function DuelArena() {
  const [duels, setDuels] = useState([])
  const [activeDuel, setActiveDuel] = useState(null)
  const [moduleId, setModuleId] = useState(1)
  const [maxRounds, setMaxRounds] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDuels = useCallback(async () => {
    try {
      const { data } = await api.get('/duel/active')
      setDuels(data)
    } catch {
      /* ignore */
    }
  }, [])

  const fetchDuel = useCallback(async (id) => {
    try {
      const { data } = await api.get(`/duel/${id}`)
      setActiveDuel(data)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => { fetchDuels() }, [fetchDuels])

  const createDuel = async () => {
    setError(null)
    try {
      const { data } = await api.post('/duel/create', {
        module_id: moduleId,
        max_rounds: maxRounds,
      })
      setActiveDuel(data)
      fetchDuels()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create duel')
    }
  }

  const joinDuel = async (id) => {
    setError(null)
    try {
      const { data } = await api.post(`/duel/${id}/join`)
      setActiveDuel(data)
      fetchDuels()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to join duel')
    }
  }

  const submitPrompt = async (role, prompt) => {
    if (!activeDuel) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post(`/duel/${activeDuel.id}/submit`, {
        role,
        prompt,
      })
      // Refresh duel state
      await fetchDuel(activeDuel.id)
      return data
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  const leaveDuel = () => {
    setActiveDuel(null)
    fetchDuels()
  }

  // Active duel view
  if (activeDuel && activeDuel.status !== 'waiting') {
    const rounds = activeDuel.rounds || []
    const isComplete = activeDuel.status === 'completed'

    return (
      <div className="duel-page">
        <div className="duel-header">
          <div className="duel-header-left">
            <h1>Duel Arena</h1>
            <span className={`duel-list-status ${activeDuel.status}`}>
              {activeDuel.status}
            </span>
          </div>
          <button className="btn" onClick={leaveDuel}>
            ← Back to Lobby
          </button>
        </div>

        {/* Winner announcement */}
        {isComplete && (
          <div className="duel-winner">
            <div className="winner-confetti">🎉🏆🎉</div>
            <h2>Duel Complete!</h2>
            <p className="winner-name">
              {activeDuel.winner_id
                ? `Player ${activeDuel.winner_id} Wins!`
                : "It's a Tie!"}
            </p>
          </div>
        )}

        {/* Round indicator */}
        <div className="duel-round-indicator">
          <span className="round-label">
            Round {Math.min(activeDuel.current_round, activeDuel.max_rounds)} / {activeDuel.max_rounds}
          </span>
          <div className="duel-round-dots">
            {Array.from({ length: activeDuel.max_rounds }, (_, i) => {
              const roundNum = i + 1
              let cls = ''
              if (roundNum < activeDuel.current_round || isComplete) cls = 'completed'
              else if (roundNum === activeDuel.current_round && !isComplete) cls = 'current'
              return <span key={i} className={`round-dot ${cls}`} />
            })}
          </div>
        </div>

        {/* Score bar */}
        <div className="duel-score-bar">
          <div className="duel-score-side red">
            <span className="score-label">Red Team</span>
            <span className="score-value">{activeDuel.creator_score}</span>
          </div>
          <span className="score-vs">VS</span>
          <div className="duel-score-side blue">
            <span className="score-label">Blue Team</span>
            <span className="score-value">{activeDuel.opponent_score}</span>
          </div>
        </div>

        {/* Split panels */}
        {!isComplete && (
          <div className="duel-split">
            <DuelPanel
              role="attacker"
              onSubmit={(p) => submitPrompt('attacker', p)}
              rounds={rounds}
              loading={loading}
            />
            <DuelPanel
              role="defender"
              onSubmit={(p) => submitPrompt('defender', p)}
              rounds={rounds}
              loading={loading}
            />
          </div>
        )}

        {/* Round results */}
        {rounds.filter(r => r.attack_output).length > 0 && (
          <div className="capstone-section">
            <h3>Round Results</h3>
            {rounds
              .filter(r => r.attack_output)
              .map((r) => (
                <div key={r.id} className="round-history-item" style={{ marginBottom: 8 }}>
                  <span>Round {r.round_number}</span>
                  <span
                    className={`round-result-tag ${r.attack_succeeded ? 'success' : 'defended'}`}
                  >
                    {r.attack_succeeded ? '🗡️ Attack Succeeded' : '🛡️ Defense Held'}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    )
  }

  // Lobby view
  return (
    <div className="duel-page">
      <h1>Duel Arena</h1>

      {error && (
        <div style={{ color: 'var(--accent-red)', marginBottom: 16, fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Create new duel */}
      <div className="duel-header">
        <div className="duel-header-left">
          <select value={moduleId} onChange={e => setModuleId(Number(e.target.value))}>
            {Array.from({ length: 20 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Module {i + 1}</option>
            ))}
          </select>
          <select value={maxRounds} onChange={e => setMaxRounds(Number(e.target.value))}>
            {[3, 5, 7, 10].map(n => (
              <option key={n} value={n}>{n} Rounds</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={createDuel}>
          Create New Duel
        </button>
      </div>

      {/* Waiting duel card (just created) */}
      {activeDuel && activeDuel.status === 'waiting' && (
        <div className="duel-list-item" style={{ marginBottom: 16, borderColor: 'var(--accent-yellow)' }}>
          <div className="duel-list-meta">
            <span>Your Duel — Module {activeDuel.module_id}</span>
            <span>Waiting for opponent... ({activeDuel.max_rounds} rounds)</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => joinDuel(activeDuel.id)}>
              Simulate Opponent
            </button>
            <button className="btn" onClick={leaveDuel}>Cancel</button>
          </div>
        </div>
      )}

      {/* Active duels list */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>Active Duels</h2>
      <div className="duel-list">
        {duels.length === 0 ? (
          <div className="duel-empty">
            No active duels. Create one to get started!
          </div>
        ) : (
          duels.map(d => (
            <div key={d.id} className="duel-list-item">
              <div className="duel-list-meta">
                <span>Duel #{d.id} — Module {d.module_id}</span>
                <span>{d.max_rounds} rounds • Score: {d.creator_score} - {d.opponent_score}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`duel-list-status ${d.status}`}>{d.status}</span>
                {d.status === 'waiting' && (
                  <button className="btn btn-primary" onClick={() => joinDuel(d.id)}>Join</button>
                )}
                {d.status === 'active' && (
                  <button className="btn" onClick={() => fetchDuel(d.id)}>Resume</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
