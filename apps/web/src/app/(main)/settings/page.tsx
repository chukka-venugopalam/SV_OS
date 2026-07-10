'use client';

import { Card, CardContent } from '@sv-os/ui';
import { User, Palette, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';


const settingsSections = [
  {
    title: 'Profile',
    description: 'Manage your personal information',
    icon: <User className="h-5 w-5" />,
    href: '/settings/profile',
    color: 'text-primary-500 bg-primary-50 dark:bg-primary-950/30',
  },
  {
    title: 'Preferences',
    description: 'Theme, font size, and display settings',
    icon: <Palette className="h-5 w-5" />,
    href: '/settings/preferences',
    color: 'text-info-500 bg-info-50 dark:bg-info-950/30',
  },
  {
    title: 'Account',
    description: 'Password, email, and security settings',
    icon: <Shield className="h-5 w-5" />,
    href: '/settings/account',
    color: 'text-warning-500 bg-warning-50 dark:bg-warning-950/30',
  },
];

export default function SettingsPage() {
  return (
    <Shell maxWidth="2xl">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
        breadcrumbs={[{ label: 'Settings' }]}
      />

      <div className="space-y-3">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${section.color}`}
                >
                  {section.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {section.title}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {section.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-300 transition-transform group-hover:translate-x-0.5 dark:text-neutral-600" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
