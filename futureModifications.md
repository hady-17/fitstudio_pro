# Future Modifications

Tracks scoped-but-not-yet-built changes that came up during development, with enough
context to pick them up later without re-deriving the reasoning.

---

## 1. Auto-create a linked auth account when a client is created

**Problem:** When a trainer/owner creates a client via
`POST /api/studios/:studioId/sessions` → `POST /api/studios/:studioId/clients`,
`clients.user_id` only gets linked to a `profiles` row if a profile with a matching
email *already exists* (`findProfileByEmail` in
[clients.service.ts](backend/src/modules/clients/clients.service.ts#L191)). In the
common case — a brand-new client who has never signed up — `user_id` stays `null`
forever (or until the client signs up themselves and calls
`POST /api/auth/link-client-profile`). This means most clients never get a portal
account unless they self-register with a matching email.

**Why this isn't a small fix:** `profiles.id` is a foreign key to `auth.users.id`
(see migration `20260523083145_create_core_tables.sql`), and a trigger
(`handle_new_user`, migration `20260523103847_auto_create_profile_on_signup.sql`)
auto-creates the `profiles` row whenever an `auth.users` row appears. So you cannot
create a bare profile — you must create a real **Supabase Auth user** via the admin
API, which is a product decision (every client gets a real login).

**Decided approach (confirmed with user):**
- When `createClient` runs and `findProfileByEmail` finds no match (and an email was
  provided), create a Supabase Auth user via `supabaseAdmin.auth.admin.createUser()`:
  - `email`: the client's email
  - `password`: a fixed default, **`fitstudio@123@`**
  - `email_confirm: true` (no confirmation email — email delivery isn't wired up yet, see [[Phase 8.6]])
  - `user_metadata: { full_name, must_change_password: true }`
- The `handle_new_user` trigger fires automatically and creates the `profiles` row;
  use its `id` as `linkedProfile.id` for the rest of the existing flow
  (`client.user_id`, `ensureClientStudioMembership`)
- The client must change this default password on first login. Implementation:
  - `GET /api/auth/me` should surface `mustChangePassword` from
    `req.user.user_metadata?.must_change_password` (no extra DB call — `req.user`
    already comes from `supabaseAdmin.auth.getUser(token)` in
    [auth.middleware.ts](backend/src/middleware/auth.middleware.ts))
  - Add `POST /api/auth/change-password` (`{ newPassword }`, validated, min 8 chars):
    `supabaseAdmin.auth.admin.updateUserById(userId, { password, user_metadata: { ...existing, must_change_password: false } })`
  - Frontend (Phase 9) should check `mustChangePassword` after login and force a
    password-reset screen before letting the user into the app

**Touches:**
- `backend/src/modules/clients/clients.service.ts` — `createClient` (replace the
  "find or leave null" step with "find, or create-and-link")
- `backend/src/modules/auth/` — new `auth.schema.ts` (currently doesn't exist),
  `changePassword` service fn, controller, route; `getMe` response shape
- Existing `linkClientProfile` flow (`POST /api/auth/link-client-profile`) stays as
  a fallback for any pre-existing clients with `user_id = null`

**Open question for later:** should *every* client get an account immediately, or
should this become an opt-in "invite to portal" action instead (so trainers aren't
forced to manage logins for clients who'll never use the app)? The user picked
"auto-create immediately" for now — revisit if it causes account-management noise
once there are real studios using this.

---

## 2. Phase 8.6 — Email delivery & AI weekly summaries

Already captured as a full phase in `fitstudio-pro-mvp-mvc-scalable-plan.md`
(section "Phase 8.6 - Email Delivery and AI Weekly Summaries") and in the
`project-backend-progress` memory. Summary: Phase 8.5 ships in-app `notifications`
rows only; no email is actually sent and no AI summary is generated — the
`EMAIL_API_KEY`/`EMAIL_FROM`/`AI_API_KEY`/`AI_MODEL` env vars and `emails` /
`weekly-summaries` BullMQ queues / `ai_summaries` table exist but nothing consumes
them. Needs: pick an email provider (Resend/Postmark/SendGrid) and an AI provider,
wire up queue processors in `worker/`, then the full notification loop (in-app +
email + AI summary) can be tested end-to-end.

**Note:** item 1 above (`email_confirm: true`, no invite email sent) deliberately
sidesteps Phase 8.6 — once an email provider is chosen, consider switching the
auto-created client account to `inviteUserByEmail()` instead of `createUser()` with
a fixed password, so clients get a proper "set your password" email rather than a
shared default password.
