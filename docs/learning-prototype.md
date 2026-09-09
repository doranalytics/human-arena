# Incremental learning prototype

Two ten-exercise lessons share a public instruction/criterion contract across Claude and ChatGPT training surfaces. Surface selection changes presentation, not the configured model provider or membership. Existing challenge library remains available.

## Data and grading

`lesson_runs` is service-role only. The server retrieves conversation history, evaluates the current step, and uses a revision and expiring claim to serialize concurrent submissions. A request ID makes lost-response retries idempotent. Choice answers are deterministic; chat answers use the existing Luna model configuration with separate response and assessment calls. Assessment checks learner behavior against the visible criterion. No exact-output word-count requirements are introduced.

`commit_lesson_step` commits progression and, only on the final step, creates a single scored result. Existing result-triggered practice days and leaderboards apply. Lessons award 60 or 100 points independent of time and hints. Completed lessons can be viewed but not farmed for repeat scores. Pausing disables chat; completed steps and history persist server-side. Unsaved composer text persists locally per member/lesson/step.

## Onboarding and membership

Onboarding v3 asks surface, interests, experience, motivation, commitment, and starting choice. Forecasts describe intended capabilities, not time guarantees. Both entry lessons are selectable, with no mandatory prerequisite. Guided future builds are described as future; existing challenges are available now.

Guest play remains enabled. Optional Supabase email-code signup is restored after the lesson. The signed guest cookie is merged into a verified account through a server-only transaction after `claim_member`, preserving lesson results, practice, and onboarding. Existing accounts retain their previous progress.

The subscription offer links to Ruben's Substack. A lookup uses the verified account email; unresolved checks create a private `membership_reviews` row. No purchase click or user-supplied paid flag grants eligibility. Review requests are stored in Supabase; there is no automatic staff notification or new admin UI. Manual review must update the entitlement through the established membership system, not merely change the request label. SMTP delivery still depends on the existing Supabase mail configuration.

Promotion permission is stored separately as `members.promotion_opt_in`. Weekly winner selection remains an operational process; public social links do not themselves authorize promotion. No dollar-value or audience-size claims were added to the onboarding offer.

## Demo boundaries

This is not a comprehensive placement test. Images, artifacts, coding surfaces, full guided build paths, and new advanced lessons are not implemented by this prototype. Existing legacy challenges retain their existing explicit-submit grading and timer behavior. The new lesson player completes automatically and has no speed penalty. The account selection is a training UI, not a connection to the learner's actual Claude or ChatGPT account.
