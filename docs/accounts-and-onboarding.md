# Accounts and onboarding

The welcome flow explains AI practice, the challenge/feedback loop and the weekly winner feature on Ruben’s LinkedIn and Substack. Two short questions collect experience and intended use. Account creation uses a Supabase email code entered in the same window; there is no guest-completion shortcut. Onboarding ends in the workspace, without creating an attempt or opening a challenge. An animated arrow points to the actual Challenges button until the member opens the library or dismisses it. Reduced-motion users see a static arrow.

Signup is presented as mandatory: `Sign up to play`, an email field and `Sign up`. It is not offered as an optional way to save progress. The form does not ask learners to identify an account tier or know which community they belong to. Standard/Premium remain internal entitlement names; the interface describes what the person can do.

After email verification, the app checks whichever membership records are available. Confirmed access is preserved. **New membership upgrades are disabled** (`MEMBERSHIP_UPGRADES_ENABLED=false`): non-members see “Coming soon” and can start playing for free, without a purchase link or a misleading recheck action. The offer code is retained for when the connection is working. Opening checkout never grants access.

## Membership is not operationally connected yet

The current backend can store entitlements, read the older AI Certified `members.is_paid` field, and import Circle data once configured. That is not a new-purchase integration. The 2026-09-07 audit found no Circle credentials, zero Circle membership rows and zero sync runs. The old subscriber table is not a live billing feed. Test fixtures demonstrate entitlement logic only; they do not demonstrate real subscriber import or purchase fulfillment.

Before enabling upgrades, establish a trusted source for existing paid subscribers, connect the existing Circle community, and verify that new purchases and cancellations update Games by the verified account email. A current Substack subscriber CSV can supply an initial snapshot, but periodic imports are an operational process and must not be presented as instant activation. Whether new Substack subscriptions already create Circle membership still needs confirmation. Leave the paid offer off until an actual purchase-to-access path is verified.

## Persisted account state

- Supabase Auth owns email identity and confirmation. Email confirmation is enabled in the hosted auth settings. `claim_member` also requires a confirmed email before claiming an imported profile.
- `members.onboarding` stores the answers and onboarding version 2. `onboarded_at` records completion. Existing version 1 accounts see the revised explanation once.
- `members.challenge_guide_seen_at` stores pointer dismissal across visits and devices.
- `members.account_tier` is a generated column: `is_paid=true` means `premium`, otherwise `standard`. Only the existing server-controlled Circle/Substack entitlement flow changes the source value. Profile and onboarding payloads cannot grant Premium.
- Standard includes free challenges, saved scores and leaderboard points. Premium adds full leaderboard recognition and weekly winner eligibility. New purchases go to `https://ruben.substack.com/subscribe`; existing Circle members do not need another purchase.
- Chat, transcription, challenge start and submission require verified accounts on the server. A localStorage flag cannot bypass this requirement.

Onboarding drafts survive refreshes in the same browser for 48 hours and are matched to the verified email. Completing setup clears the draft. Profiles, onboarding and scored attempts are stored online; working projects, skills and schedules remain browser-local as before.

### Email codes and old links

`POST /api/auth/signin` requests an email code with a stateless public Supabase client. Both the confirmation and magic-link email templates must use `supabase/templates/email-code.html`, which includes `{{ .Token }}` and no sign-in link. Hosted settings use `mailer_templates_confirmation_content` and `mailer_templates_magic_link_content`; patch only these templates, their subjects and the six-digit/one-hour OTP settings, without replacing unrelated auth configuration.

`POST /api/auth/verify` verifies the email/code with Supabase, creates session cookies in that browser and calls `claim_member`. Supabase enforces code expiry, one-time use and rate limits. A verified session can retry claiming its own profile after a lost response. New signup and returning-account sign-in share the same form. Codes and sessions are never saved in the draft or placed in URLs.

The old PKCE links required a verifier cookie from the browser where signup began. Opening one in another browser could not create a session there, and clicking “I’ve verified my email” in the original browser only rechecked its unchanged session. `/auth/callback` still accepts valid legacy links (including their flow ID), while failures offer code signup with a persistent explanation. Old local drafts retain their answers and request a new code. Completed onboarding is restored from the member profile when signing into any browser.

## Email delivery configuration still required

At implementation time this Supabase project and the older AI Certified project both had **no custom SMTP sender configured**. The built-in sender is restricted and rate-limited; it is not a production public-signup service. Before admitting public signups, configure Supabase Authentication → Email → SMTP with the approved provider’s host, port, username, password and verified sender address. No email provider account or paid plan has been purchased, and no mailing-list subscription is created by signing in.

Circle recognition additionally requires the existing `CIRCLE_API_TOKEN` / community setup described in [Circle membership](circle-membership.md). This release does not claim to have imported Circle members or verified production email delivery without those credentials.

## Verification

- `scripts/verify-accounts.ts` creates disposable Supabase accounts and checks anonymous-route rejection, email verification, Standard/Premium state, RLS, onboarding persistence, absence of auto-started attempts, pointer persistence and attempted client escalation. Fixtures are removed and no emails are sent.
- `scripts/verify-email-auth.ts` uses real Supabase signup and returning-account OTPs with isolated browser cookie jars. It checks invalid codes, mismatched emails, one-time use, legacy link recovery, cookie-session creation, retry safety, account identity and restored onboarding. Run with `node --env-file=.env.local --import tsx scripts/verify-email-auth.ts`; set `VERIFY_ORIGIN=https://howto-ai-games.vercel.app` to verify production. Admin-generated codes avoid sending test emails; inbox delivery must be checked separately once SMTP is connected.
- `scripts/verify-backend.ts` covers authenticated onboarding, chat, grading and stored results.
- Browser QA covers welcome content, code entry, an invalid code, persistence across reopening the page, the verified account summary, entering the blank workspace and the challenge arrow. A disposable local proxy replaces email delivery with admin-generated OTPs; verification, sessions, onboarding and profile requests use the real app and Supabase. This is not an inbox-delivery test.

Run against the local production server: `node --env-file=.env.local --import tsx scripts/verify-accounts.ts`. Set `VERIFY_ORIGIN=https://howto-ai-games.vercel.app` for the live account check.
