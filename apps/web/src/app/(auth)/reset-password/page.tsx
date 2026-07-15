'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@sv-os/ui';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { authClient } from '@/lib/auth-client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const mountedRef = useRef(true);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await authClient.resetPassword(token, password);
      if (mountedRef.current) {
        setIsSuccess(true);
        setTimeout(() => {
          if (mountedRef.current) router.push('/login');
        }, 3000);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Invalid or expired reset link');
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Invalid reset link</CardTitle>
          <CardDescription>This password reset link is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link
            href="/forgot-password"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
          >
            Request a new reset link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        {isSuccess ? (
          <>
            <div className="bg-success-50 dark:bg-success-950/30 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <CheckCircle2 className="text-success-600 dark:text-success-400 h-6 w-6" />
            </div>
            <CardTitle>Password reset!</CardTitle>
            <CardDescription>
              Your password has been reset successfully. Redirecting to sign in...
            </CardDescription>
          </>
        ) : (
          <>
            <div className="bg-primary-50 dark:bg-primary-950 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <KeyRound className="text-primary-600 dark:text-primary-400 h-6 w-6" />
            </div>
            <CardTitle>Set new password</CardTitle>
            <CardDescription>Enter your new password below.</CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400 rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
            >
              Sign in with your new password
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
