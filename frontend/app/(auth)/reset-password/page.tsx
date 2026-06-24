'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type');
    const code = params.get('code');

    const supabase = createClient();

    // Preferred flow: token_hash from the recovery email. This does not depend
    // on a PKCE code verifier, so it works across browsers and devices.
    if (tokenHash) {
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: (type as 'recovery') || 'recovery' })
        .then(({ error }) => {
          if (error) {
            setError('This reset link is invalid or has expired. Please request a new one.');
          } else {
            setReady(true);
          }
        });
      return;
    }

    // Fallback: PKCE code flow (older links). Requires the code verifier that
    // was stored when the reset was requested in this browser.
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError('This reset link is invalid or has expired. Please request a new one.');
        } else {
          setReady(true);
        }
      });
      return;
    }

    setError('No reset link found. Please request a new password reset.');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push('/login?message=Password+updated+successfully');
  };

  if (!ready && !error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-sm text-foreground/60">Verifying reset link...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !ready) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link invalid</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push('/forgot-password')}>
            Request a new link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Enter and confirm your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
