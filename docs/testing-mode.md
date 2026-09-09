# Open testing

`src/lib/testing-mode.ts` currently enables guest play without mandatory signup. The learning onboarding is enabled. Optional email-code signup is available after a lesson; set `TESTING_MODE` to `false` to require authenticated access.

The first profile request creates a guest member and a signed, HttpOnly, host-only cookie lasting 90 days. The existing server-side attempt ownership, saved conversation, rubric and streak logic is unchanged. Guests retain progress in the same browser; clearing cookies or switching browsers starts a separate guest. Existing verified sessions keep their existing member and progress.

Guest rows have no `auth_id` and use `guest-<member UUID>@guests.howto-ai.invalid` as an internal identifier, never a contact email. They do not create Supabase Auth users, send emails, query membership sources, or receive paid access. The signature is domain-separated and uses the existing server-only service secret. Changing that secret invalidates guest cookies.

The verified signup flow transfers the signed guest’s learning progress into the verified account. Never attach a real account based on an unverified email. See `docs/learning-prototype.md` for the lesson and membership review flow. Guest cookies are ignored when testing mode is off.

Verification: `npm test`, plus `node --env-file=.env.local --import tsx scripts/verify-guests.ts` against the deployed app. The integration script creates and removes its own guest/verified fixtures and never sends email.
