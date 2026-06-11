---
name: project-forgot-password-fix
description: Forgot password flow is broken — blocked on Supabase redirect URL config; pick up here tomorrow
metadata:
  type: project
---

## Status: BLOCKED — needs Supabase redirect URL configured

The forgot password flow is coded and working but the email link redirects to the wrong place because Supabase's allowed redirect URLs haven't been updated yet in the running instance.

**Why:** config.toml changes require a Supabase restart, but `npx supabase start` was failing with a 502 error (edge_runtime + analytics crashing on Windows). Those are now disabled in config.toml. The Studio UI fix was attempted but user couldn't find "URL Configuration" — it may be under Authentication → Settings instead.

---

## What's already done (code is correct)

- [forgot-password/page.tsx](frontend/app/(auth)/forgot-password/page.tsx) — sends reset email with `redirectTo = http://localhost:3000/reset-password`
- [reset-password/page.tsx](frontend/app/(auth)/reset-password/page.tsx) — reads `?code=` from URL, calls `supabase.auth.exchangeCodeForSession(code)` in browser, then shows new password form
- [auth/callback/route.ts](frontend/app/auth/callback/route.ts) — exists but no longer used for password reset
- [login/page.tsx](frontend/app/(auth)/login/page.tsx) — has "Forgot password?" link, reads `?message`/`?error` via useEffect (not useSearchParams)
- [config.toml](supabase/config.toml) — site_url changed to `http://localhost:3000`, redirect URLs updated, edge_runtime and analytics disabled, email rate limit raised to 100/hr

---

## Tomorrow's fix plan

**Option A — Supabase Studio (fastest, no restart needed):**
1. Open `http://localhost:54333`
2. Find auth URL settings — try:
   - Authentication → Settings (NOT URL Configuration)
   - OR Project Settings (gear icon bottom-left) → Auth
3. Set **Site URL** = `http://localhost:3000`
4. Add to **Redirect URLs** = `http://localhost:3000/reset-password`
5. Save

**Option B — Restart Supabase (applies config.toml):**
```bash
npx supabase stop
npx supabase start
```
Should work now that edge_runtime and analytics are disabled in config.toml.

---

## Full flow to test after fix

1. Go to `http://localhost:3000/forgot-password`
2. Enter email → Send reset link
3. Open `http://localhost:54324` (Mailpit — local email inbox)
4. Find email → click the reset link
5. Lands on `/reset-password?code=XXXX` → exchange happens in browser → form appears
6. Enter new password → redirected to `/login` with success message

---

## Key files
- [supabase/config.toml](supabase/config.toml) — auth section, lines ~150-160
- [forgot-password/page.tsx](frontend/app/(auth)/forgot-password/page.tsx)
- [reset-password/page.tsx](frontend/app/(auth)/reset-password/page.tsx)
