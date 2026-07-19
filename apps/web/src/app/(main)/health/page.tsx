'use client';

import { Card, CardContent, Badge, Skeleton } from '@sv-os/ui';
import { Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';
import { useEngineHealth, useSystemMetrics, useAnalyticsSnapshot } from '@/hooks/use-system';
import { cn } from '@/lib';

export default function HealthDashboardPage() {
  const { data: health, isLoading: healthLoading } = useEngineHealth();
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();
  const { data: snapshot } = useAnalyticsSnapshot();

  const checks =
    (health as Record<string, { healthy: boolean; message?: string }> | undefined) ?? {};
  const checkEntries = Object.entries(checks);
  const healthyCount = checkEntries.filter(([, c]) => (c as { healthy: boolean }).healthy).length;
  const degradedCount = checkEntries.filter(([, c]) => !(c as { healthy: boolean }).healthy).length;

  return (
    <Shell>
      <PageHeader
        title="System Health"
        description="Monitor engine health, metrics, and platform status"
        breadcrumbs={[{ label: 'System', href: '/health' }, { label: 'Health' }]}
      />

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  degradedCount > 0
                    ? 'bg-warning-50 text-warning-600'
                    : 'bg-success-50 text-success-600',
                )}
              >
                {degradedCount > 0 ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-xs text-neutral-500">Status</p>
                <p className="text-sm font-semibold">
                  {healthLoading ? '...' : degradedCount > 0 ? 'Degraded' : 'Healthy'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-info-50 text-info-600 flex h-10 w-10 items-center justify-center rounded-lg">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Engines</p>
                <p className="text-sm font-semibold">
                  {metricsLoading ? '...' : (metrics?.active_engines ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary-50 text-primary-600 flex h-10 w-10 items-center justify-center rounded-lg">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Events</p>
                <p className="text-sm font-semibold">
                  {(snapshot as Record<string, Record<string, number>> | undefined)?.platform
                    ?.total_events_published ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-50 text-neutral-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Uptime</p>
                <p className="text-sm font-semibold">{metrics?.uptime_hours ?? 0}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engine Health Checks */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Engine Health Checks
        </h2>
        {healthLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="divide-y divide-neutral-100 p-2 dark:divide-neutral-800">
              {checkEntries.map(([name, chk]) => {
                const check = chk as { healthy: boolean; message?: string };
                return (
                  <div key={name} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {check.healthy ? (
                        <CheckCircle2 className="text-success-500 h-4 w-4" />
                      ) : (
                        <XCircle className="text-error-500 h-4 w-4" />
                      )}
                      <span className="text-sm font-medium capitalize text-neutral-900 dark:text-neutral-100">
                        {name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {check.message && (
                        <span className="text-xs text-neutral-400">{check.message}</span>
                      )}
                      <Badge variant={check.healthy ? 'success' : 'danger'} size="sm">
                        {check.healthy ? 'Healthy' : 'Degraded'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* System Metrics */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          System Metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: 'Knowledge Nodes',
              value:
                (snapshot as Record<string, Record<string, number>> | undefined)?.graph
                  ?.node_count ?? 0,
            },
            {
              label: 'Connections',
              value:
                (snapshot as Record<string, Record<string, number>> | undefined)?.graph
                  ?.edge_count ?? 0,
            },
            {
              label: 'Graph Density',
              value: `${(((snapshot as Record<string, Record<string, number>> | undefined)?.graph?.density ?? 0) * 100).toFixed(2)}%`,
            },
            {
              label: 'Cache Hit Rate',
              value: `${(((snapshot as Record<string, Record<string, number>> | undefined)?.platform?.cache_hit_rate ?? 0) * 100).toFixed(1)}%`,
            },
            {
              label: 'Total Assessments',
              value:
                (snapshot as Record<string, Record<string, number>> | undefined)?.assessment
                  ?.total_assessments ?? 0,
            },
            {
              label: 'Total Careers',
              value:
                (snapshot as Record<string, Record<string, number>> | undefined)?.career
                  ?.total_careers ?? 0,
            },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4">
                <p className="text-xs text-neutral-500">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
