# Standup Spark

## The Problem

I personally lose time at the end of a development session trying to turn scattered notes, ticket fragments, and half-finished sentences into a useful standup update. The friction is small but repetitive: I either write a vague “worked on stuff” message or spend 15 minutes reconstructing the context. Standup Spark is for developers and small teams who have the same problem. Success means pasting the rough notes once and receiving a concise update that is ready to share, without inventing progress or blockers.

## What It Does

The user pastes rough engineering notes into the frontend. The backend sends those notes to an AI model with a structured prompt, which transforms them into three honest sections: Yesterday, Today, and Blockers. The frontend displays the result and lets the user copy it as a plain-text update. If the backend is running without a key during local setup, a clearly labelled deterministic demo fallback keeps the interface testable without pretending it used AI.

## AI Integration

**API:** OpenRouter

**Model:** `openai/gpt-4o-mini`

**Location:** `backend/server.js` → `generateStandup()` function. Prompt construction is kept in `buildPrompt()` in the same backend file so the browser never sees the provider endpoint or API key.

**What the AI does:** It converts unstructured work notes into a concise JSON standup update with yesterday, today, and blockers fields, while explicitly prohibiting invented details.

## What I Intentionally Excluded

I intentionally excluded user accounts and a database because the core value is a quick, private, session-based transformation; persistence would add setup and data-retention decisions without improving the first-use experience. I excluded Slack and Jira integrations because the product should first prove that the note-to-update transformation is useful before adding OAuth and external permissions. I also excluded automatic scheduled reminders because this assignment is about reducing writing friction when the user already has notes, not creating another notification system.

## Monthly Cost Calculation

Model: `openai/gpt-4o-mini`

Input: `$0.15` per 1M tokens

Output: `$0.60` per 1M tokens

Average tokens per call: approximately 600 input + 400 output.

Cost per call: `(600 / 1,000,000 × $0.15) + (400 / 1,000,000 × $0.60) = $0.000090 + $0.000240 = $0.000330`.

Expected monthly calls: `300`.

**Monthly total: `300 × $0.000330 = $0.099`, approximately `$0.10/month`.**

## Live Deployment

**Frontend:** Add the published frontend URL here after enabling GitHub Pages or a static host.

**Backend:** Add the published backend URL here after deploying the `backend` directory to a Node host and setting `OPENROUTER_API_KEY` and `FRONTEND_URL`.

## Local Setup

```bash
cd backend
npm install
cp .env.example .env
npm start
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The backend reads `OPENROUTER_API_KEY` only from the environment. Never commit `.env`.

## Verification

The backend health check is available at `/health`. The generation route is `POST /api/standup` with a JSON body such as `{ "notes": "Fixed the cache bug\nNeed design feedback" }`.
