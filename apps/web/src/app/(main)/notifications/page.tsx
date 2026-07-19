'use client';

import { Card, CardContent, Button, Badge, Skeleton, EmptyState } from '@sv-os/ui';
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/use-system';

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  info: 'bg-info-50 text-info-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
};

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const { data: unread } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = notifications?.items ?? [];

  return (
    <Shell>
      <PageHeader
        title="Notifications"
        description="Stay informed about system events and updates"
        breadcrumbs={[{ label: 'System', href: '/health' }, { label: 'Notifications' }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-4 w-4" /> Mark All Read
            </Button>
          </div>
        }
      />

      {/* Unread Count */}
      {unread && unread.count > 0 && (
        <div className="bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm">
          <Bell className="h-4 w-4" />
          You have {unread.count} unread notification{unread.count !== 1 ? 's' : ''}
        </div>
      )}

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.notification_id} className={n.read ? 'opacity-60' : ''}>
              <CardContent className="flex items-start gap-4 p-4">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeColors[n.type] ?? typeColors.info}`}
                >
                  {typeIcons[n.type] ?? typeIcons.info}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {n.title}
                    </p>
                    {!n.read && (
                      <Badge variant="info" size="sm">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">{n.body}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markRead.mutate(n.notification_id)}
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Bell className="h-12 w-12" />}
              title="No notifications"
              description="You're all caught up! Notifications will appear here when events occur."
            />
          </CardContent>
        </Card>
      )}
    </Shell>
  );
}
