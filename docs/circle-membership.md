# Circle membership sync

Existing Circle community members receive the same membership recognition and weekly winner eligibility as paid Substack subscribers. New subscriptions still route exclusively to https://ruben.substack.com/subscribe.

## Initial setup

1. Create a dedicated **Admin API** token in Circle → Developers → Tokens. Headless member tokens are a different API.
2. Store it as `CIRCLE_API_TOKEN` in this app's server environment. Never use a `NEXT_PUBLIC_` prefix.
3. Inspect its community using `node --env-file=.env.local --conditions=react-server --import tsx scripts/sync-circle.ts --inspect`. Confirm the returned name is How to AI, then set `CIRCLE_COMMUNITY_ID` to its ID. All subsequent responses must match that community.
4. Run `node --env-file=.env.local --conditions=react-server --import tsx scripts/sync-circle.ts` for the first import. The command prints counts only, not member emails or credentials.
5. Configure those variables plus a random `CRON_SECRET` in Vercel production and redeploy. The authorized `/api/internal/circle-sync` endpoint can run an immediate full import. It returns `not_configured` until both Circle variables are set.

## Behavior

- Full refresh daily at 07:15 UTC, via Vercel Cron.
- On sign-in/profile load, check the member's email against Circle if its stored check is older than six hours or missing. The Account **Check membership** button refreshes sooner, with a one-minute cache to limit repeated requests.
- Read every page of Admin API v2 `/community_members?status=all`. Circle's status filter distinguishes confirmed profiles from invitations; it does not measure recent activity. Both are read, and the member record's `active` flag determines access. Leads are not members.
- Only a complete, consistently paginated snapshot is applied. API errors, rate limits, changed totals, duplicate records and malformed results leave existing access in place. The import is capped at 25,000 records; larger communities require a batched implementation.
- Import email, name and photo into new member profiles. Existing names, photos, sign-ins, onboarding and scores are preserved. No auth users, passwords, welcome emails or Circle invites are created.
- Members sign in with the email used in Circle; the existing auth callback claims their imported profile automatically.
- Record Circle membership separately from `substack_paid`. Effective `is_paid` means either source grants access. A Substack miss cannot remove Circle access; a Circle removal cannot remove confirmed Substack access.
- Deactivated/deleted members disappear from a complete snapshot or return inactive/not found on a direct lookup. Their Circle entitlement is removed. A verified email change removes Circle access from the previous email. Fresher individual lookups win over an older full snapshot.
- Keep the last confirmed status through outages. This implies removal propagation is bounded by refreshes and source availability, not instantaneous webhook delivery.

`circle_sync_runs` records successful and failed imports with counts and sanitized errors. `circle_memberships` and the sync log have RLS and no browser read/write policies. All import and membership RPCs are service-role-only. The parent AI Certified database remains read-only.

Circle API calls consume the community's API allowance. Daily pagination and cached individual lookups limit usage; inspect the actual usage after the first import. This integration never purchases a Circle plan or increases its limits.

## Verification

`npm test` covers API authentication, pagination, normalization, wrong communities, mismatched email, missing members and unavailable APIs. `scripts/verify-circle-db.ts` exercises atomic imports, source independence and identity preservation with temporary fixtures. It refuses to run once real Circle membership data exists, and deletes its temporary rows afterward.

The initial live import requires the real Circle token and confirmed community ID. A configured route or a passing fixture test alone does not mean community members were imported.

Official references: [Admin API](https://api.circle.so/apis/admin-api), [OpenAPI contract](https://api-headless.circle.so/api/admin/v2/swagger.yaml), [API usage](https://help.circle.so/p/sso-and-integrations/api/monitor-your-api-usage).
