# 🌸 Saksham — Mental Wellness Companion for Exam Warriors

> A production-quality, AI-powered mental wellness tracker for students preparing for NEET, JEE, CUET, CAT, GATE, and UPSC.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini-1.5%20Flash-orange?logo=google)](https://ai.google.dev)
[![Tests](https://img.shields.io/badge/Tests-Vitest-green?logo=vitest)](https://vitest.dev)

---

## ✨ What is Saksham?

Saksham (Sanskrit: सक्षम, meaning "capable") is a compassionate mental wellness companion that understands the unique pressures of Indian competitive exam preparation — peer comparison, parental expectations, mock test anxiety, and sleep deprivation.

Unlike generic wellness apps, Saksham uses an **insight engine** that analyzes your journal entries to detect hidden stress patterns specific to exam culture, then injects those findings into Gemini's context to generate truly personalized coping strategies.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 14 App Router                     │
│                                                                  │
│  Pages (Client)              API Routes (Server-only)            │
│  ┌──────────────┐            ┌──────────────────────────────┐   │
│  │ / (Home)     │──POST────▶│ /api/journal                 │   │
│  │ /journal     │──GET─────▶│ /api/insights                │   │
│  │ /insights    │──POST────▶│ /api/chat                    │   │
│  │ /chat        │──GET/POST▶│ /api/mood                    │   │
│  │ /mindfulness │──GET/POST▶│ /api/mindfulness             │   │
│  └──────────────┘            └──────────┬───────────────────┘   │
│                                          │                       │
│  ┌───────────────────────────────────────▼──────────────────┐   │
│  │                  Orchestration Layer                       │   │
│  │                                                            │   │
│  │  1. lib/safety/guard.ts  ──▶ screenForCrisis()           │   │
│  │     RUNS FIRST — bypasses LLM on crisis detection        │   │
│  │                                                            │   │
│  │  2. lib/insights/        ──▶ extractTriggers()           │   │
│  │     triggers.ts               detectPatterns()            │   │
│  │     Pure functions, deterministic, unit-tested            │   │
│  │                                                            │   │
│  │  3. lib/ai/gemini.ts     ──▶ generateReflection()        │   │
│  │     Injects insight context — personalized, not generic   │   │
│  │                                                            │   │
│  │  4. lib/db/              ──▶ Vercel Postgres              │   │
│  │     Drizzle ORM, typed queries, 5 tables                  │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

Session: httpOnly cookie → anonymous ID → no PII stored
API Key: Server-side only → never in client bundle
```

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- A [Vercel account](https://vercel.com) with a linked Postgres database
- A [Google AI Studio](https://aistudio.google.com) API key

### 1. Clone & Install

```bash
git clone <repo-url>
cd PromptWarsSaksham
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key (server-side only) |
| `POSTGRES_URL` | ✅ | Vercel Postgres connection string |
| `SESSION_SECRET` | ✅ | 32+ character random string for session signing |
| `DEMO_SECRET` | Optional | Secret header for seeding in production |

### 3. Database Setup

```bash
# Generate migrations from schema
npm run db:generate

# Apply migrations to your database
npm run db:migrate
```

### 4. Seed Demo Data (for judges/demo)

```bash
# In development (no secret needed)
curl -X POST http://localhost:3000/api/seed

# The demo session ID is: demo-saksham-judge-2024
# Visit /insights to see immediately populated dashboard
```

### 5. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

### 6. Run Tests

```bash
npm test
# Tests cover: extractTriggers, detectPatterns, screenForCrisis
```

---

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx           # Root layout with nav + footer
│   ├── page.tsx             # Home page
│   ├── journal/page.tsx     # Daily journal
│   ├── insights/page.tsx    # Insights dashboard
│   ├── chat/page.tsx        # Companion chat
│   ├── mindfulness/page.tsx # Mindfulness exercises
│   └── api/
│       ├── journal/         # Journal CRUD + AI reflection
│       ├── mood/            # Mood logging + pattern detection
│       ├── insights/        # Full insight pipeline
│       ├── chat/            # Safety guard + companion chat
│       ├── mindfulness/     # Exercise recommendations
│       └── seed/            # Demo data seeder
├── components/
│   ├── Navigation.tsx       # Accessible top nav
│   ├── CrisisAlert.tsx      # Helpline display component
│   ├── MoodChart.tsx        # Recharts mood trend
│   ├── TriggerCard.tsx      # Stress trigger + coping card
│   ├── ChatBubble.tsx       # Chat message bubble
│   └── BreathingExercise.tsx # Animated mindfulness
├── lib/
│   ├── db/
│   │   ├── schema.ts        # Drizzle table definitions
│   │   ├── index.ts         # DB client singleton
│   │   └── queries.ts       # Typed query helpers
│   ├── safety/
│   │   └── guard.ts         # ⚠️ Crisis screening (runs first)
│   ├── insights/
│   │   ├── triggers.ts      # extractTriggers() pure function
│   │   ├── patterns.ts      # detectPatterns() pure function
│   │   └── index.ts         # buildInsightContext()
│   ├── ai/
│   │   └── gemini.ts        # Gemini integration (server only)
│   ├── session.ts           # Anonymous session management
│   └── rate-limit.ts        # Token bucket rate limiter
└── tests/
    ├── insights.test.ts     # Trigger + pattern detection tests
    └── safety.test.ts       # Crisis guard tests
```

---

## 🔒 Auth Boundary

Saksham uses **anonymous sessions** — no email, password, or OAuth required.

- A cryptographically random session ID (`nanoid`) is generated on first visit
- Stored in an `httpOnly`, `SameSite=Strict`, `Secure` cookie
- This cookie is the **sole identity token** — never exposed to JavaScript
- No PII (name, email, phone) is stored anywhere in the database
- Sessions expire after 90 days

**Limitation:** Sessions are not portable across browsers or devices. Clearing cookies resets your data. This is intentional — it prioritizes privacy over persistence.

---

## ⚠️ Safety Architecture

The crisis safety guard (`lib/safety/guard.ts`) is the **most important feature** in this codebase.

```
Every journal entry or chat message:
    │
    ▼
screenForCrisis(text)
    │
    ├── isCrisis: true  → Return pre-written response + helplines
    │                     NEVER call the LLM
    │
    └── isCrisis: false → Proceed to Gemini
```

**Why not let the LLM handle crisis responses?**
LLMs can be unpredictable, tone-deaf, or even harmful in high-stakes mental health situations. The pre-written responses are carefully crafted, reviewed, and include India-specific helplines that the LLM might not know or might get wrong.

**India-specific helplines included:**
| Helpline | Number | Available |
|---|---|---|
| Tele-MANAS (Govt.) | 14416 | 24/7, free, multiple languages |
| iCall (TISS) | 9152987821 | Mon–Sat, 8am–10pm |
| AASRA | 9820466627 | 24/7 |
| Vandrevala Foundation | 1860-2662-345 | 24/7 |

---

## 🧠 Insight Engine

The insight engine (`lib/insights/`) is what makes Saksham different from a generic mood tracker.

### `extractTriggers(entries: JournalEntry[]): DetectedTrigger[]`
Analyzes journal text using a keyword taxonomy to detect recurring stress themes:

| Category | What it detects |
|---|---|
| `exam_dates` | Anxiety about upcoming exams, deadlines, results |
| `peer_comparison` | Comparison with classmates, toppers, rank anxiety |
| `sleep` | Sleep deprivation, insomnia, exhaustion |
| `parental_pressure` | Family expectations, fear of disappointing |
| `mock_scores` | Poor test scores, score fluctuations |
| `time_pressure` | Syllabus coverage anxiety, not enough time |
| `self_doubt` | Imposter syndrome, confidence erosion |

Each trigger is scored using frequency × recency weighting. Recent entries count more.

### `detectPatterns(moodLogs: MoodLog[]): DetectedPattern[]`
Uses statistical analysis on mood log history:
- **Linear regression** to detect declining/improving trends
- **Consecutive low detection** (3+ days ≤ 2/5 → sustained low mood)
- **Standard deviation** to detect volatility

Both functions are **pure** — no network calls, no side effects, deterministic, fully unit-testable.

---

## 🤖 AI Service

`lib/ai/gemini.ts` injects the insight engine's output into every Gemini prompt:

```typescript
// Example context injected into Gemini:
// "Student context:
//  - Current mood: 2/5
//  - Top stress triggers detected:
//    • Peer Comparison (mentioned in 4 entries, confidence: 82%)
//    • Parental Pressure (mentioned in 3 entries, confidence: 75%)"
```

This means coping strategies are never generic — they reference the student's actual detected patterns.

The system prompt explicitly frames Gemini as a **non-clinical companion** that never diagnoses.

---

## 🧪 Tests

```bash
npm test
```

Tests are located in `tests/` and use Vitest. They cover pure functions only (no mocking needed):

- `tests/safety.test.ts` — 20+ tests for crisis detection (English + Hindi, edge cases)
- `tests/insights.test.ts` — Tests for all 7 trigger categories + 5 pattern types

---

## 🚢 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Link to project and pull env vars
vercel link
vercel env pull

# Deploy
vercel --prod
```

Make sure to set all env vars in the Vercel dashboard before deploying.

---

## 🎯 How This Maps to the Challenge

| Challenge Requirement | Implementation |
|---|---|
| GenAI-powered wellness tracker | Gemini 1.5 Flash via `@google/generative-ai` |
| Uncovers hidden patterns | `extractTriggers()` — 7 exam-specific categories |
| Context-aware AI responses | `buildInsightContext()` injected into every prompt |
| Safety — never freelances crisis | `screenForCrisis()` runs first, bypasses LLM |
| India-specific | Hindi transliterations, Indian exam names, local helplines |
| Clean architecture | Strict layer separation: data / insight / AI / API / UI |
| Secure | httpOnly cookies, rate limiting, no client-side secrets |
| Testable | Pure functions with comprehensive Vitest coverage |
| Accessible | ARIA labels, semantic HTML, keyboard navigation throughout |

---

## 📄 License

MIT — Built for the Prompt Wars challenge.
