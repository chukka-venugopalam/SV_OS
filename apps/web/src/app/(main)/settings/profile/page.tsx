'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Avatar,
  Skeleton,
} from '@sv-os/ui';
import { ArrowLeft, Save, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Shell } from '@/components/shared/shell';
import { useUpdateProfile } from '@/hooks/use-auth';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';

export default function ProfileSettingsPage() {
  const { user, isLoading } = useAuth();
  const updateProfile = useUpdateProfile();
  const { addToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({ display_name: displayName || null, bio: bio || null });
      addToast('Profile updated successfully', 'success');
    } catch {
      addToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Shell maxWidth="2xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell maxWidth="2xl">
      <Link
        href="/settings"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to settings
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        Profile Settings
      </h1>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center gap-4">
            <Avatar
              fallback={user?.display_name ?? user?.username ?? 'U'}
              size="xl"
              className="ring-2 ring-neutral-200 dark:ring-neutral-700"
            />
            <div>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {user?.display_name ?? user?.username}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
