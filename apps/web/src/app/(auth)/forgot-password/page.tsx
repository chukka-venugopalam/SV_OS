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
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authClient.forgotPassword(email);
      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        {isSent ? (
          <>
            <div className="bg-success-50 dark:bg-success-950/30 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <CheckCircle2 className="text-success-600 dark:text-success-400 h-6 w-6" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              If an account exists for {email}, you&apos;ll receive a password reset link shortly.
            </CardDescription>
          </>
        ) : (
          <>
            <div className="bg-primary-50 dark:bg-primary-950 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <Mail className="text-primary-600 dark:text-primary-400 h-6 w-6" />
            </div>
            <CardTitle>Forgot password?</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a reset link.
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400 rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => {
                  setIsSent(false);
                  setError(null);
                }}
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
              >
                try again
              </button>
            </p>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
