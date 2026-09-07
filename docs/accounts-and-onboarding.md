# Accounts and onboarding

The welcome flow explains AI practice, the challenge/feedback loop and the weekly winner feature on Ruben’s LinkedIn and Substack. Two short questions collect experience and intended use. Account creation uses a Supabase email verification link; there is no guest-completion shortcut. Onboarding ends in the workspace, without creating an attempt or opening a challenge. An animated arrow points to the actual Challenges button until the member opens the library or dismisses it. Reduced-motion users see a static arrow.

Signup is presented as mandatory: `Sign up to play`, an email field and `Sign up`. It is not offered as an optional way to save progress. The form does not ask learners to identify an account tier or know which community they belong to. Standard/Premium remain internal entitlement names; the interface describes what the person can do.

After email verification, the app automatically checks existing community and subscriber records. Members with confirmed access see the weekly competition included. Otherwise, the offer explains that a paid How to AI subscription on Ruben’s Substack adds weekly winner eligibility and a public leaderboard profile with their full name, photo and social links. `Start playing` retains every free challenge, saved progress and points. Opening checkout does not grant access. Returning members can check access again. Winning the weekly competition is required for the feature; subscribing alone does not promise exposure.

## Persisted account state

- Supabase Auth owns email identity and confirmation. Email confirmation is enabled in the hosted auth settings. `claim_member` also requires a confirmed email before claiming an imported profile.
- `members.onboarding` stores the answers and onboarding version 2. `onboarded_at` records completion. Existing version 1 accounts see the revised explanation once.
- `members.challenge_guide_seen_at` stores pointer dismissal across visits and devices.
- `members.account_tier` is a generated column: `is_paid=true` means `premium`, otherwise `standard`. Only the existing server-controlled Circle/Substack entitlement flow changes the source value. Profile and onboarding payloads cannot grant Premium.
- Standard includes free challenges, saved scores and leaderboard points. Premium adds full leaderboard recognition and weekly winner eligibility. New purchases go to `https://ruben.substack.com/subscribe`; existing Circle members do not need another purchase.
- Chat, transcription, challenge start and submission require verified accounts on the server. A localStorage flag cannot bypass this requirement.

Onboarding drafts survive the email-link round trip in the same browser for 48 hours and are matched to the verified email. Completing setup clears the draft. Profiles, onboarding and scored attempts are stored online; working projects, skills and schedules remain browser-local as before.

## Email delivery configuration still required

At implementation time this Supabase project and the older AI Certified project both had **no custom SMTP sender configured**. The built-in sender is restricted and rate-limited; it is not a production public-signup service. Before admitting public signups, configure Supabase Authentication → Email → SMTP with the approved provider’s host, port, username, password and verified sender address. No email provider account or paid plan has been purchased, and no mailing-list subscription is created by signing in.

Circle recognition additionally requires the existing `CIRCLE_API_TOKEN` / community setup described in [Circle membership](circle-membership.md). This release does not claim to have imported Circle members or verified production email delivery without those credentials.

## Verification

- `scripts/verify-accounts.ts` creates disposable Supabase accounts and checks anonymous-route rejection, email verification, Standard/Premium state, RLS, onboarding persistence, absence of auto-started attempts, pointer persistence and attempted client escalation. Fixtures are removed and no emails are sent.
- `scripts/verify-backend.ts` covers authenticated onboarding, chat, grading and stored results.
- Browser QA covers welcome content, input validation, verified account summary, entering the blank workspace, arrow animation and dismissing it by opening Challenges. Generated test links exercise the real callback without sending messages.

Run against the local production server: `node --env-file=.env.local --import tsx scripts/verify-accounts.ts`. Set `VERIFY_ORIGIN=https://howto-ai-games.vercel.app` for the live account check.
