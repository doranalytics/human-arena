# How to AI Games

A Claude-style AI training workspace with two areas:

- **Playground:** untimed prompting practice and feature exercises, with optional pointers to the real workspace controls. Practice completion does not award competitive points.
- **Arena:** timed challenges involving files, connectors, skills, or Cowork. Arena contains the leaderboard and scored results.

Production: https://howto-ai-games.vercel.app/

## Current entry flow

Five onboarding screens introduce the product, collect interests, proficiency (a five-bar scale) and goals, then explain both areas once as the learner chooses. Choosing Playground opens the untimed “Create a skill” exercise directly in the chat sandbox with optional pointers; choosing Arena opens its challenge list. Both remain available from the mode switch. There is no daily commitment, required lesson order, ChatGPT surface, or sign-in gate while testing. “Review onboarding” reopens the flow.

Playground currently has nine exercises in `src/lib/playground.ts`. All use the actual chat workspace. Prompt chips fill the composer for the learner to edit or send. Feature exercises check observable actions and completed replies; these are practice markers, not assessments of output quality.

Arena exposes six challenges selected in `src/lib/game-mode.ts`. The same allowlist is enforced by the start and submission endpoints. Legacy challenge definitions and historical results remain available for saved work, but retired prompt-only challenges cannot be started for points. Instructions and grading still use the existing versioned challenge contract.

Switching areas closes an active attempt and retains its chat. Finishing practice or submitting an Arena result closes that session and returns to its area. Retired active attempts are closed when old browser state loads.

## Workspace

Chat supports files, images, dictation, model settings, web search, research, projects, custom instructions, skills and Cowork. Fast and Smart both use Luna; selecting Smart defaults to higher effort. A Claude fallback remains for installations without an OpenAI key; see `src/lib/models.ts` for configuration. Failed replies can be retried with the original prompt and attachments. Submission waits for the latest reply to finish, so a connection error does not become a failed grade.

The assistant starts without company context. Connected sources are synthetic training data. Email sending is simulated. Saved schedules support manual test runs; no background scheduler is running. The practice instructions explain those boundaries.

## Development

```sh
npm install
cp .env.example .env.local
npm run dev
```

Configure the existing child project's Supabase and AI provider credentials locally. Never commit `.env.local` or copy the parent platform's database configuration into this project.

```sh
npm run typecheck
npm test
npm run build
```

Mode, practice-completion, migration and history-repair tests live in `tests/game-modes.test.ts` and `tests/chat-history.test.ts`. Other tests cover the existing grading and account boundaries.

## Deployment and persistence

Deploy to the existing Vercel project identified by `.vercel/project.json`, using the same production URL. Do not create a replacement project.

Supabase stores member/onboarding records, Arena attempts, authoritative Arena conversations and scores. Chats, projects, custom skills, schedules and Playground completion also use member-scoped browser storage. Clear or migrate that data deliberately rather than silently discarding it.

Arena combines server-recorded conversations with client-reported workspace actions. The latter are not a fully tamper-resistant proof of work. The Playground/Arena split does not change that existing limitation.

## Origin

Originally built as Human Arena, based on `doranalytics/ai-certified-next`. The current product is How to AI Games.
