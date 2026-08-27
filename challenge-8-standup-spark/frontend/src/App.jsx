import { useMemo, useState } from 'react'
import './styles.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const example = `- Fixed the stale cache bug in the dashboard
- Added a loading state to the export button
- Waiting for design feedback on the empty state`

function App() {
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const canSubmit = useMemo(() => notes.trim().length > 0 && !loading, [notes, loading])

  async function generateStandup(event) {
    event.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch(`${API_URL}/api/standup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not generate your update.')
      setResult(data)
    } catch (err) {
      setError(err.message || 'Could not connect to Standup Spark.')
    } finally {
      setLoading(false)
    }
  }

  async function copyUpdate() {
    if (!result) return
    const text = `Yesterday: ${result.yesterday}\nToday: ${result.today}\nBlockers: ${result.blockers}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="shell">
      <nav className="nav"><div className="brand"><span className="brand-mark">✦</span> Standup Spark</div><span className="nav-note">Less time writing. More time shipping.</span></nav>
      <section className="hero"><p className="eyebrow">DAILY ENGINEERING COMPANION</p><h1>Turn scattered notes into a <em>standup you’re proud of.</em></h1><p className="subhead">Paste the fragments from your day. Get a clear, honest update for your team in seconds.</p></section>
      <section className="workspace">
        <form className="card input-card" onSubmit={generateStandup}>
          <div className="card-heading"><div><span className="step">01</span><h2>Your rough notes</h2></div><span className="hint">{notes.length}/4000</span></div>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What did you work on? Any blockers? No need to make it pretty..." maxLength={4000} />
          <button className="example" type="button" onClick={() => setNotes(example)}>Try an example <span>↗</span></button>
          <button className="primary" type="submit" disabled={!canSubmit}>{loading ? <><span className="spinner" /> Shaping your update…</> : <>Generate my standup <span>→</span></>}</button>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
        <div className="card output-card">
          <div className="card-heading"><div><span className="step">02</span><h2>Your clear update</h2></div>{result && <button className="copy" onClick={copyUpdate}>{copied ? 'Copied' : 'Copy update'}</button>}</div>
          {!result && !loading && <div className="empty"><div className="empty-icon">✧</div><p>Your update will appear here.</p><span>We’ll keep it concise, specific, and true to your notes.</span></div>}
          {loading && <div className="empty loading-copy"><div className="pulse" /><p>Finding the signal…</p><span>Organising your notes into a thoughtful update.</span></div>}
          {result && <div className="result"><Output label="Yesterday" value={result.yesterday} /><Output label="Today" value={result.today} /><Output label="Blockers" value={result.blockers} />{result.demo && <p className="demo-note">Demo mode is active. Add an OpenRouter key on the backend for AI-generated phrasing.</p>}</div>}
        </div>
      </section>
      <footer><span>Built for the “what did I do yesterday?” moment.</span><span>Private by default · No accounts required</span></footer>
    </main>
  )
}

function Output({ label, value }) { return <div className="output-row"><span className="output-label">{label}</span><p>{value}</p></div> }
export default App
