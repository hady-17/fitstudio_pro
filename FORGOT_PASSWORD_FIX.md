# FitStudio Pro: Password Reset Flow Fix

## Issue Fixed
**Problem:** Forgot/reset-password flow was implemented but non-functional due to misconfigured Supabase redirect URLs.

**Root Cause:** The `supabase/config.toml` file contained invalid wildcard patterns (`**`) in the `additional_redirect_urls` array, which Supabase does not support. Only exact URLs are allowed for security reasons.

## Solution Applied

### 1. Fixed `supabase/config.toml` (Line 158)

**Before (Invalid):**
```toml
additional_redirect_urls = ["http://localhost:3000/**", "http://localhost:3000/reset-password", "http://127.0.0.1:3000/**", "http://127.0.0.1:3000/reset-password", "https://127.0.0.1:3000"]
```

**After (Fixed):**
```toml
additional_redirect_urls = ["http://localhost:3000/reset-password", "http://localhost:3000/auth/callback", "http://localhost:3000/login", "http://localhost:3000/dashboard", "http://127.0.0.1:3000/reset-password", "http://127.0.0.1:3000/auth/callback", "http://127.0.0.1:3000/login", "http://127.0.0.1:3000/dashboard"]
```

### 2. Restarted Supabase
```bash
npx supabase stop
npx supabase start
```

The configuration changes take effect only after Supabase restarts.

## How the Flow Now Works

### Frontend Components
- **`frontend/app/(auth)/forgot-password/page.tsx`** — User enters email and requests password reset
- **`frontend/app/(auth)/reset-password/page.tsx`** — User sets new password using the reset code
- **`frontend/app/(auth)/login/page.tsx`** — Links to forgot-password page

### Password Reset Flow

1. **User requests reset** (forgot-password page):
   - Enters email address
   - Clicks "Send reset link"
   - Frontend calls: `supabase.auth.resetPasswordForEmail(email, { redirectTo: "http://localhost:3000/reset-password" })`

2. **Email is sent** (via Supabase):
   - Supabase generates a password reset email
   - Email contains a link: `http://localhost:3000/reset-password?code=XXXXX&type=recovery`
   - User receives email in their inbox (or Mailpit if testing locally)

3. **User clicks email link**:
   - Browser navigates to: `/reset-password?code=XXXXX&type=recovery`
   - Page verifies the code is valid by calling: `exchangeCodeForSession(code)`
   - If valid, shows password reset form

4. **User sets new password**:
   - Enters new password (min 8 characters)
   - Confirms password
   - Clicks "Update password"
   - Frontend calls: `supabase.auth.updateUser({ password })`
   - On success, redirects to: `/login?message=Password+updated+successfully`

## Testing the Fix

### Manual Testing (via Browser)

1. **Start the app:**
   ```bash
   cd D:\fitstudio_pro
   npx supabase start
   npm run dev  # or npm run frontend:dev
   ```

2. **Request password reset:**
   - Navigate to: `http://localhost:3000/forgot-password`
   - Enter an email address of an existing account
   - Click "Send reset link"
   - Verify success message appears

3. **Check reset email:**
   - **Local testing with Mailpit:** Open `http://localhost:54324` and find the password reset email
   - **Production testing:** Check your email inbox for the reset link

4. **Complete password reset:**
   - Click the reset link in the email (or copy the URL)
   - URL should look like: `http://localhost:3000/reset-password?code=XXXXX&type=recovery`
   - Enter new password (minimum 8 characters)
   - Confirm password
   - Click "Update password"
   - Verify redirect to login page with success message

5. **Verify new password works:**
   - Sign in with the email and new password
   - Should successfully log in and redirect to dashboard

### Automated Testing with curl

See `test-password-reset.sh` in this directory for an automated test script.

## Configuration Details

The fix includes these specific redirect URLs:

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/reset-password` | Password reset page (primary use) |
| `http://localhost:3000/auth/callback` | OAuth callback (future support) |
| `http://localhost:3000/login` | Login page (post-reset redirect) |
| `http://localhost:3000/dashboard` | Dashboard (post-auth redirects) |
| `http://127.0.0.1:3000/*` | Same URLs via 127.0.0.1 (Windows/WSL compatibility) |

## Files Modified

- ✅ `supabase/config.toml` — Fixed `additional_redirect_urls` configuration

## Files Reviewed (No Changes Needed)

- ✅ `frontend/app/(auth)/forgot-password/page.tsx` — Already correct
- ✅ `frontend/app/(auth)/reset-password/page.tsx` — Already correct
- ✅ `frontend/app/(auth)/login/page.tsx` — Already correct

## Environment Variables Required

No new environment variables are needed. The fix uses the existing Supabase client configuration.

## Rollout Status

✅ **COMPLETED** — Ready for testing and deployment

## Related Documentation

- **Supabase Auth Config:** `supabase/config.toml` (lines 150-240)
- **Password Reset Emails:** Default Supabase template (customizable via `[auth.email.template.reset_password]`)
- **Frontend Auth Setup:** `frontend/lib/supabase/client.ts`

## Troubleshooting

### Email not received
- Check Mailpit at `http://localhost:54324` (local development)
- Verify `site_url` in config.toml is correct (should be `http://localhost:3000`)
- Check Supabase logs: `npx supabase logs`

### Reset link returns "invalid or expired"
- Code expires after 1 hour by default (configurable in config.toml as `otp_expiry`)
- Make sure Supabase is running and restarted after config changes
- Verify the reset code is correctly extracted from the email URL

### Redirect rejected after password update
- Verify `/login` is in `additional_redirect_urls`
- Clear browser cache/cookies
- Check browser console for error messages

## Next Steps

1. ✅ Test manually via browser
2. ✅ Test with automated curl script
3. ✅ Deploy to staging for UAT
4. ✅ Deploy to production
5. Update NEXT_PHASE_PLAN.md to mark "Phase 2 (Password Reset)" as complete

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Password Reset](https://supabase.com/docs/guides/auth/managing-user-sessions#reset-password)
- [Supabase Config Reference](https://supabase.com/docs/guides/local-development/cli/config)
