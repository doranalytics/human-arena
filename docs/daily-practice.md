# Daily practice

Three independent records:

- Habit: one saved, passing challenge per account-local date. Hints, slow completions and optional replays qualify. Opening the app, starting or failing a challenge does not. Missing a day resets only the current streak; best streak, skills and scores survive.
- Capability: existing passed challenges and earned skill badges. Completing the entire curriculum still guarantees AI-Native. No streak points or skill decay.
- Competition: existing best-per-challenge scores for the selected period. The weekly board displays lifetime levels and real members only. Failed reads produce an unavailable state, never sample competitors.

`recommendPractice` prefers an unfinished challenge with an unearned skill, then any remaining unfinished challenge in curriculum order. It ignores the old time estimates. The library stays open, and completing a recommendation reveals another one rather than imposing a daily limit. Once all challenges are complete, the UI offers optional review without pretending that review is new material. More fresh days of learning will require reviewed curriculum additions.

The learner's browser supplies an IANA timezone at their first challenge start after this release. The server validates it and saves it once per account. Other devices cannot change it. API clients without a valid timezone use UTC. The database records the completion day in the same transaction as the grade, with a unique `(member_id, local_date)` key. Clients cannot insert or edit practice days. Existing results are not backfilled into invented local dates.

Current streak includes a run ending yesterday until the learner has had all of today to continue. Calendar date arithmetic handles daylight saving changes. Best streak reads paginate the ledger. History refreshes on focus and local day rollover; failures do not clear stored practice days or invalidate saved grades.

Results keep the public action/check labels, including frozen answer labels for older attempts. Success shows the capability, skill pills and a compact practice acknowledgement; scoring details are secondary. An incomplete attempt shows its completed criteria count and the first missing criterion. Both outcomes close the graded thread, retain it in the sidebar, and open a fresh draft.

This release does not change challenge definitions, grading contracts, point formulas, hint deductions or the model. The `minutes` fields remain internal legacy scoring parameters; they are no longer presented as completion estimates. Calibrating competitive time bonuses should be a separate versioned change using observed completion times.

Verification: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. After deploying and applying `20260908000000_daily_practice.sql`, run `node --env-file=.env.local --import tsx scripts/verify-practice.ts`. This creates and removes disposable fixtures, sends no email and tests failed/passed grades, hinted/slow completions, concurrency, duplicate submissions, timezone persistence, access restrictions, restoration, replay scoring and weekly/lifetime separation. Its scripted conversation fixtures verify persistence, not the model's response quality; browser QA should also complete a real challenge.
