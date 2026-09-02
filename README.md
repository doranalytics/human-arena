# Human Arena

A training environment shaped like Claude. People learn to use modern AI by completing timed challenges inside a chat interface the arena controls, so it can watch what they click (model choice, web search, research, files, connectors, skills, projects), not just what they type. Duolingo for AI fluency.

Everyone enters the arena as themselves, working at **Halden Outdoor Co.**, a fictional 124-person outdoor gear company. Its inbox, Drive, data warehouse and calendar are synthetic, so nothing can go wrong: click anything.

## What is in v0

| Feature | Where |
|---|---|
| Claude-like chat UI: sidebar, greeting, composer, streaming markdown replies | `src/components/{sidebar,chat-view,composer,message}.tsx` |
| Files and images in the composer (drag, paste, + menu) | `composer.tsx`, `api/chat` inlines text files, passes images/PDFs through |
| Model and effort picker (Fast/Smart, Low/Medium/High). Both slots run Haiku for now | `src/lib/models.ts` |
| Web search (Anthropic server-side web search tool) and Research mode (multi-search, sectioned report) | `src/app/api/chat/route.ts` |
| Synthetic connectors: Gmail, Drive, Data Warehouse, Calendar, each with tools | `src/lib/connectors.ts`, `src/lib/connector-tools.ts`, data in `src/lib/company/` |
| Skills: five built-in, create your own, invoke with `/name` | `src/lib/skills.ts`, `dialogs/skills.tsx` |
| Projects: instructions and text files that every chat inside inherits | `project-view.tsx` |
| Arena: 10 challenges, timer, hints (each costs 15%), behavior tracking, Haiku grading against a hidden key, result modal, badges | `src/lib/arena/*`, `dialogs/challenges.tsx`, `topbar.tsx` |
| Leaderboard (all time, this week), settings, magic-link sign-in | `dialogs/leaderboard.tsx`, `dialogs/settings.tsx`, `supabase/migrations` |

Deferred on purpose: voice, cowork/agent mode, executable skills, design and slides, the ChatGPT skin (the settings toggle is there, disabled).

## How a challenge works

1. **Start a challenge** (top right) lists them. The brief explains the ask, the time box, the points, and how many things the arena will check. Fixture files download from the brief.
2. **Start the clock** opens a fresh chat. The top bar shows the timer, a Hint button and Submit.
3. Everything the learner does is logged as events (`src/lib/types.ts`, `ArenaEventType`): messages, model/effort changes, search and research toggles, attachments, connector connections and uses, skill invocations, project creation.
4. **Submit** sends the attempt's chats and events to `/api/arena/submit`. Behaviors are verified from the event log (no model). Checks are graded by Haiku from the transcript against the hidden key in `src/lib/arena/keys.ts`. Points = base x speed x hint penalty, only on a full pass.
5. A toast and a result modal show what the arena saw, what the reply needed, feedback and badges.

Add a challenge: append to `src/lib/arena/challenges.ts` and its key to `keys.ts`. Behaviors reference event types; checks are free text for the grader.

## Run it

```
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev
```

Without `ANTHROPIC_API_KEY` the app runs in **demo mode**: canned streamed replies that echo the settings that reached the server, and a grader that passes everything. Good for clicking through the UI.

Without Supabase env the app runs in **guest mode**: chats, projects, skills and results live in the browser, the leaderboard shows a sample board plus you. Sign-in is hidden.

## Deploy on Vercel

1. Import this repo in Vercel. Framework preset: Next.js. No build settings to change.
2. Environment variables: `ANTHROPIC_API_KEY` (required for real replies). Optional: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
3. For the board: create a Supabase project, run `supabase/migrations/20260902000000_arena.sql` in the SQL editor, set Auth > URL configuration > Site URL to the Vercel URL and add `https://<your-domain>/auth/callback` to the redirect list.

## Origin

Built on 2 Sep 2026 as the successor to `doranalytics/ai-certified-next`, whose Supabase pattern, tiers and grader shape it carries over. The product decisions behind it are in that repo's `docs/HUMAN-ARENA.md`.

## Costs and models

Chat and grading both run `claude-haiku-4-5`. Web search is Anthropic's server-side tool ($10 per 1,000 searches). Research mode allows up to 10 searches per turn. Swap models in `src/lib/models.ts` (Smart slot) and `src/lib/arena/grader.ts`.

## Known v0 limits

- Event tracking happens in the browser and is trusted by the server. Fine for learning, not for prizes. Move the event log server-side when it matters.
- Chats and projects are not synced to Supabase; only scored results are.
- PDF attachments go to the model as documents; text files are inlined; other binaries are rejected by the model.
