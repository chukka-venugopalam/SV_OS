'use client';

import { Card, CardContent, Button, Badge, Skeleton, EmptyState } from '@sv-os/ui';
import { History, RotateCcw, Download, Upload, Eye, ArrowLeft, GitBranch, Tag } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';
import {
  useVersions,
  useCreateSnapshot,
  useRestoreSnapshot,
  useRollback,
  useVersioningStatistics,
} from '@/hooks/use-versioning';

export default function VersionsPage() {
  const [branch, setBranch] = useState('main');
  const { data: versions, isLoading } = useVersions(branch);
  const qStats = useVersioningStatistics();
  const stats = qStats.data as Record<string, Record<string, number>> | undefined;
  const createSnapshot = useCreateSnapshot();
  const restoreSnapshot = useRestoreSnapshot();
  const rollback = useRollback();

  const items = versions?.items ?? [];
  const total = versions?.total ?? 0;

  return (
    <Shell>
      <PageHeader
        title="Version History"
        description="Manage graph snapshots, versions, and rollbacks"
        breadcrumbs={[{ label: 'System', href: '/health' }, { label: 'Versions' }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => createSnapshot.mutate({})}
            >
              <Upload className="h-4 w-4" /> Create Snapshot
            </Button>
            <Link href="/import-export">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Import/Export
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-neutral-500">Total Versions</p>
              <p className="text-xl font-bold">{stats?.versions?.total ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-neutral-500">Total Imports</p>
              <p className="text-xl font-bold">{stats?.imports?.total_imports ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-neutral-500">Total Exports</p>
              <p className="text-xl font-bold">{stats?.exports?.total_exports ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branch selector */}
      <div className="mb-4 flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-neutral-400" />
        {['main', 'develop', 'experimental'].map((b) => (
          <Button
            key={b}
            variant={branch === b ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBranch(b)}
          >
            {b}
          </Button>
        ))}
      </div>

      {/* Version List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((v) => (
            <Card key={v.version_id} className="group">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="bg-primary-50 text-primary-600 flex h-10 w-10 items-center justify-center rounded-lg">
                  <History className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      v{total - items.indexOf(v)} — {new Date(v.timestamp).toLocaleDateString()}
                    </p>
                    <Badge variant="secondary" size="sm">
                      {v.branch}
                    </Badge>
                    {v.tags?.length > 0 && <Tag className="h-3 w-3 text-neutral-400" />}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">{v.notes || 'No description'}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {v.node_count} nodes · {v.checksum?.slice(0, 12)}…
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restoreSnapshot.mutate(v.version_id)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => rollback.mutate(v.version_id)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<History className="h-12 w-12" />}
              title="No versions yet"
              description="Create a snapshot to start tracking graph versions"
            />
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex gap-3">
        <Link href="/import-export">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Import/Export Center
          </Button>
        </Link>
        <Link href="/health">
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" /> System Health
          </Button>
        </Link>
      </div>
    </Shell>
  );
}
