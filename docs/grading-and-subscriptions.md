# Grading and subscriptions

## The grading contract

`src/lib/arena/challenges.ts` is the single source for the instructions, visible completion checks and action requirements. `ChallengeCriteria` renders those same criteria. Private keys supply reference facts only; they must never add a requirement.

A signed-in attempt freezes the full challenge and reference facts when it starts. Later curriculum edits apply to new attempts. Results retain the criteria labels and version that were actually used. Starting or submitting a challenge requires a verified email account.

Luna evaluates semantic checks. Exact ten-word counting runs in code. Action checks use the messages, effective per-turn settings, successful tool results and relevant workspace state. Failed tools and toggles that were never used do not count. Summaries can omit secondary details. Graders must accept equivalent wording, units and valid methods.

Signed-in conversations are recorded on the server. Submission ignores replacement assistant text sent by the browser. Grading claims an attempt, then saves its result and completion atomically. Repeated submissions return the saved result. A grading or saving error keeps the attempt open. The latest result is shown even if an earlier attempt earned a better score; the best score remains on the board.

The timer shows elapsed time only. Speed and hints still affect points. Completing all current challenges guarantees AI-Native even at the minimum score.

## Subscription source

Subscription purchase and billing belong on https://ruben.substack.com/subscribe. There is no Stripe integration in this app. **The Games upgrade offer is currently disabled because there is no verified new-purchase-to-access connection.** Challenges remain free, and existing confirmed paid status is preserved. Paid status enables full leaderboard recognition and weekly winner eligibility under the existing How to AI offer.

The server matches the authenticated member's normalized email against AI Certified's existing `members.is_paid` field and, when configured, the Circle community API. Either source can grant membership; see [Circle setup](circle-membership.md). Onboarding and profile requests cannot self-assign paid status. Existing confirmed subscribers can manage their subscription; new purchase and recheck prompts are hidden while upgrades are disabled.

Required server-only deployment variables:

- `SUBSTACK_MEMBERS_SUPABASE_URL`: the existing AI Certified Supabase project URL.
- `SUBSTACK_MEMBERS_SERVICE_ROLE_KEY`: the credential used only by the server for that lookup.

The app reads the parent database and caches Substack status separately in `members.substack_paid`; effective membership also includes Circle access. It does not modify the parent. When lookup is unavailable it preserves the last confirmed local status and reports verification unavailable.

This is a stored subscriber list, not a live Substack billing webhook. No functioning import schedule or new-subscription feed has been verified. New purchases and cancellations therefore have no guaranteed path into this app. Rechecking in the game cannot fix stale source data. Before enabling upgrades or awarding a weekly prize, establish the current paid subscriber source and verify the complete access lifecycle.

## Verification and remaining limits

- `npm test`: contract uniqueness, grading IDs, turn evidence, tool failures, all eight action-only challenges, exact counting, lifecycle isolation, history integrity, scoring and onboarding validation.
- `scripts/eval-rubrics.ts`: valid and invalid transcript fixtures for all 38 semantic challenges. Runs real Luna calls and writes `verify/rubric-evals.json`; it does not change member data. Run with `node --env-file=.env.local --conditions=react-server --import tsx scripts/eval-rubrics.ts`.
- `scripts/verify-backend.ts`: disposable authenticated account, onboarding, subscriber lookup, real AI response, server history, grading persistence, replay, restored badges and final workspace actions. Run against a local production server on port 3218 with `node --env-file=.env.local --import tsx scripts/verify-backend.ts`. Test rows are deleted afterward.

These checks reduce rubric drift, but do not prove perfect judgment on every possible learner response. Workspace gestures remain client-reported: this is not a complete anti-cheat system. Working projects, skills and schedules remain browser-local. Account onboarding and membership are described in [Accounts and onboarding](accounts-and-onboarding.md). Scheduled tasks are practice runs started with Run now, not background jobs. A hard runtime termination during streaming can leave a pending attempt requiring recovery; ordinary model/setup failures clear the pending state.
