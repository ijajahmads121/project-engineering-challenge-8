import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
const PORT = process.env.PORT || 3000
const MODEL = 'openai/gpt-4o-mini'
const MAX_INPUT = 4000

app.use(cors({ origin: process.env.FRONTEND_URL || true }))
app.use(express.json({ limit: '64kb' }))

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'standup-spark' }))

function buildPrompt(notes) {
  return [
    {
      role: 'system',
      content: 'You are Standup Spark, an engineering communication assistant. Turn rough work notes into a concise, honest daily standup update. Return valid JSON with exactly these string keys: yesterday, today, blockers. Keep each value to one or two clear sentences. Never invent work, metrics, or blockers; if none are provided, say None.'
    },
    {
      role: 'user',
      content: `Here are my rough notes from today:\n\n${notes}`
    }
  ]
}

function localFallback(notes) {
  const lines = notes.split(/\n+/).map((line) => line.replace(/^[-*•]\s*/, '').trim()).filter(Boolean)
  const first = lines[0] || 'Reviewed the work in progress.'
  const second = lines[1] || 'Continue with the next focused task.'
  return {
    yesterday: first,
    today: second,
    blockers: 'None reported.'
  }
}

async function generateStandup(notes) {
  if (!process.env.OPENROUTER_API_KEY) return { ...localFallback(notes), demo: true }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'Standup Spark'
      },
      body: JSON.stringify({ model: MODEL, messages: buildPrompt(notes), max_tokens: 400, temperature: 0.2 }),
      signal: controller.signal
    })
    const data = await response.json()
    if (!response.ok || !data.choices?.[0]?.message?.content) throw new Error('AI provider returned an invalid response')
    const content = data.choices[0].message.content.replace(/^```json\s*|\s*```$/g, '').trim()
    const parsed = JSON.parse(content)
    console.log('[AI_USAGE]', JSON.stringify({ model: MODEL, ...data.usage, timestamp: new Date().toISOString() }))
    return { yesterday: parsed.yesterday, today: parsed.today, blockers: parsed.blockers, demo: false }
  } finally {
    clearTimeout(timeout)
  }
}

app.post('/api/standup', async (req, res) => {
  const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : ''
  if (!notes) return res.status(400).json({ error: 'Please add at least one work note.' })
  if (notes.length > MAX_INPUT) return res.status(413).json({ error: `Please keep notes under ${MAX_INPUT} characters.` })
  try {
    res.json({ success: true, ...await generateStandup(notes) })
  } catch (error) {
    console.error('[AI_ERROR]', error.message)
    res.status(502).json({ error: 'The AI service is temporarily unavailable. Please try again.' })
  }
})

app.listen(PORT, () => console.log(`Standup Spark backend listening on ${PORT}`))
