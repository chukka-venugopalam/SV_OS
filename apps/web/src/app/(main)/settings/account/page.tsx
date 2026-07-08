'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Shield, KeyRound } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useChangePassword } from '@/hooks/use-auth';
import { Shell } from '@/components/shared/shell';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Skeleton,
  Badge,
} from '@sv-os/ui';
import { useToast } from '@/providers/toast-provider';
import { formatDate } from '@/lib/formatters';

export default function AccountSettingsPage() {
  const { user, isLoading } = useAuth();
  const changePassword = useChangePassword();
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      addToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      addToast('Failed to change password', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Shell maxWidth="2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-64 w-full rounded-xl" />
      </Shell>
    );
  }

  return (
    <Shell maxWidth="2xl">
      <Link href="/settings" className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300">
        <ArrowLeft className="h-4 w-4" />
        Back to settings
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-50">Account Settings</h1>

      <div className="space-y-4">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary-500" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-neutral-500 dark:text-neutral-400">Email</Label>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user?.email}</p>
              </div>
              <div>
                <Label className="text-xs text-neutral-500 dark:text-neutral-400">Username</Label>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user?.username}</p>
              </div>
              <div>
                <Label className="text-xs text-neutral-500 dark:text-neutral-400">Role</Label>
                <Badge variant="secondary" size="sm" className="capitalize mt-0.5">{user?.role}</Badge>
              </div>
              {user?.created_at && (
                <div>
                  <Label className="text-xs text-neutral-500 dark:text-neutral-400">Member since</Label>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{formatDate(user.created_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4 text-warning-500" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required minLength={8} autoComplete="current-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <Button type="submit" disabled={isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? 'Changing...' : 'Change password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
