import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import '../styles/DuelCapstone.css'

export default function CapstoneGallery() {
  const [projects, setProjects] = useState([])
  const [selected, setSelected] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Submit form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    system_prompt: '',
    eval_suite: '',
    documentation: '',
  })

  // Review form
  const [reviewForm, setReviewForm] = useState({ score: '', feedback: '' })

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('sort', sortBy)
      const { data } = await api.get(`/capstone/gallery?${params}`)
      setProjects(data)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sortBy])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const submitProject = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      let evalSuite = []
      if (form.eval_suite.trim()) {
        try { evalSuite = JSON.parse(form.eval_suite) } catch { evalSuite = [] }
      }
      await api.post('/capstone/submit', {
        title: form.title,
        description: form.description,
        system_prompt: form.system_prompt,
        eval_suite: evalSuite,
        documentation: form.documentation,
      })
      setShowForm(false)
      setForm({ title: '', description: '', system_prompt: '', eval_suite: '', documentation: '' })
      fetchProjects()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to submit project')
    }
  }

  const submitReview = async (projectId) => {
    if (!reviewForm.score || !reviewForm.feedback) return
    try {
      const { data } = await api.post(`/capstone/${projectId}/review`, {
        score: parseFloat(reviewForm.score),
        feedback: reviewForm.feedback,
      })
      setSelected(data)
      setReviewForm({ score: '', feedback: '' })
      fetchProjects()
    } catch {
      /* ignore */
    }
  }

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="capstone-page">
      <h1>Capstone Gallery</h1>

      {/* Toolbar */}
      <div className="capstone-toolbar">
        <div className="capstone-filters">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Projects</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date">Sort by Date</option>
            <option value="score">Sort by Score</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Submit Your Project
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--accent-red)', marginBottom: 16, fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Project grid */}
      <div className="capstone-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="capstone-card" style={{ opacity: 0.5 }}>
              <div className="capstone-card-header">
                <div style={{ width: '60%', height: 16, background: 'var(--bg-tertiary)', borderRadius: 4 }} />
              </div>
              <div style={{ width: '100%', height: 48, background: 'var(--bg-tertiary)', borderRadius: 4 }} />
            </div>
          ))
        ) : projects.length === 0 ? (
          <div className="capstone-empty">
            <p>No projects yet. Be the first to submit!</p>
          </div>
        ) : (
          projects.map(p => (
            <div key={p.id} className="capstone-card" onClick={() => setSelected(p)}>
              <div className="capstone-card-header">
                <span className="capstone-card-title">{p.title}</span>
                <span className={`capstone-status-badge ${p.status}`}>{p.status}</span>
              </div>
              <p className="capstone-card-desc">{p.description}</p>
              <div className="capstone-card-footer">
                <span>User #{p.user_id}</span>
                {p.score != null && (
                  <span className="capstone-card-score">{Math.round(p.score * 100)}%</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Project detail modal */}
      {selected && (
        <div className="capstone-modal-overlay" onClick={() => setSelected(null)}>
          <div className="capstone-modal" onClick={e => e.stopPropagation()}>
            <div className="capstone-modal-header">
              <div>
                <h2>{selected.title}</h2>
                <span className={`capstone-status-badge ${selected.status}`} style={{ marginTop: 6, display: 'inline-block' }}>
                  {selected.status}
                </span>
              </div>
              <button className="capstone-modal-close" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="capstone-section">
              <h3>Description</h3>
              <p>{selected.description}</p>
            </div>

            <div className="capstone-section">
              <h3>System Prompt</h3>
              <pre>{selected.system_prompt}</pre>
            </div>

            {/* Stats */}
            <div className="capstone-section">
              <h3>Summary</h3>
              <div className="capstone-stats-row">
                <div className="capstone-stat">
                  <span className="stat-label">Test Cases</span>
                  <span className="stat-value">{(selected.eval_suite || []).length}</span>
                </div>
                <div className="capstone-stat">
                  <span className="stat-label">Score</span>
                  <span className="stat-value" style={{ color: 'var(--accent-green)' }}>
                    {selected.score != null ? `${Math.round(selected.score * 100)}%` : '—'}
                  </span>
                </div>
                <div className="capstone-stat">
                  <span className="stat-label">Reviews</span>
                  <span className="stat-value">{(selected.peer_reviews || []).length}</span>
                </div>
                <div className="capstone-stat">
                  <span className="stat-label">Submitted</span>
                  <span className="stat-value" style={{ fontSize: '0.85rem' }}>
                    {formatDate(selected.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {selected.documentation && (
              <div className="capstone-section">
                <h3>Documentation</h3>
                <pre>{selected.documentation}</pre>
              </div>
            )}

            {/* Peer reviews */}
            {(selected.peer_reviews || []).length > 0 && (
              <div className="capstone-section">
                <h3>Peer Reviews</h3>
                {selected.peer_reviews.map((r, i) => (
                  <div key={i} className="peer-review-item">
                    <div className="review-score">Score: {Math.round(r.score * 100)}%</div>
                    <div className="review-feedback">{r.feedback}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit review */}
            <div className="capstone-section">
              <h3>Submit Review</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <label style={{ flex: '0 0 100px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Score (0-1)
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={reviewForm.score}
                    onChange={e => setReviewForm(f => ({ ...f, score: e.target.value }))}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--text-primary)',
                      padding: '8px',
                      width: '100%',
                      marginTop: 4,
                    }}
                  />
                </label>
                <label style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Feedback
                  <input
                    type="text"
                    value={reviewForm.feedback}
                    onChange={e => setReviewForm(f => ({ ...f, feedback: e.target.value }))}
                    placeholder="Write your review..."
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--text-primary)',
                      padding: '8px',
                      width: '100%',
                      marginTop: 4,
                    }}
                  />
                </label>
                <button
                  className="btn btn-primary"
                  onClick={() => submitReview(selected.id)}
                  disabled={!reviewForm.score || !reviewForm.feedback}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit project modal */}
      {showForm && (
        <div className="capstone-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="capstone-modal" onClick={e => e.stopPropagation()}>
            <div className="capstone-modal-header">
              <h2>Submit Capstone Project</h2>
              <button className="capstone-modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form className="capstone-form" onSubmit={submitProject}>
              <label>
                Project Title
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="My Awesome Prompt System"
                />
              </label>
              <label>
                Description
                <textarea
                  required
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what your system does..."
                  style={{ fontFamily: 'inherit' }}
                />
              </label>
              <label>
                System Prompt
                <textarea
                  required
                  value={form.system_prompt}
                  onChange={e => setForm(f => ({ ...f, system_prompt: e.target.value }))}
                  placeholder="You are a..."
                />
              </label>
              <label>
                Eval Suite (JSON array, optional)
                <textarea
                  value={form.eval_suite}
                  onChange={e => setForm(f => ({ ...f, eval_suite: e.target.value }))}
                  placeholder='[{"input": "...", "expected": "..."}]'
                  rows={3}
                />
              </label>
              <label>
                Documentation (optional)
                <textarea
                  value={form.documentation}
                  onChange={e => setForm(f => ({ ...f, documentation: e.target.value }))}
                  placeholder="Architecture, design decisions, etc."
                  style={{ fontFamily: 'inherit' }}
                  rows={4}
                />
              </label>
              <div className="capstone-form-actions">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
