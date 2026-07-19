'use client';

import {
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Progress,
} from '@sv-os/ui';
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  FileText,
  Archive,
  Eye,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';
import {
  useImportJobs,
  useStartImport,
  useExportJobs,
  useStartExport,
  useVersioningStatistics,
} from '@/hooks/use-versioning';

const FORMATS = [
  { value: 'json', label: 'JSON', icon: FileJson },
  { value: 'yaml', label: 'YAML', icon: FileText },
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { value: 'zip', label: 'ZIP Archive', icon: Archive },
];

export default function ImportExportPage() {
  const [exportFormat, setExportFormat] = useState('json');
  const [exportTarget, setExportTarget] = useState('full_graph');
  const { data: imports, isLoading: importsLoading } = useImportJobs();
  const { data: exports, isLoading: exportsLoading } = useExportJobs();
  const startImport = useStartImport();
  const startExport = useStartExport();

  return (
    <Shell>
      <PageHeader
        title="Import / Export Center"
        description="Manage graph data imports and exports"
        breadcrumbs={[{ label: 'System', href: '/health' }, { label: 'Import/Export' }]}
      />

      {/* Quick Actions */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Export */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-primary-50 text-primary-600 flex h-10 w-10 items-center justify-center rounded-lg">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Export Graph</h3>
                <p className="text-xs text-neutral-500">Export graph data in various formats</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                {FORMATS.map((f) => (
                  <Button
                    key={f.value}
                    variant={exportFormat === f.value ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setExportFormat(f.value)}
                  >
                    <f.icon className="h-3.5 w-3.5" /> {f.label}
                  </Button>
                ))}
              </div>
              <Select value={exportTarget} onValueChange={setExportTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_graph">Full Graph</SelectItem>
                  <SelectItem value="subgraph">Subgraph</SelectItem>
                  <SelectItem value="career_graph">Career Graph</SelectItem>
                  <SelectItem value="dependency_chain">Dependency Chain</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="w-full gap-2"
                onClick={() => startExport.mutate({ format: exportFormat, target: exportTarget })}
              >
                <Download className="h-4 w-4" /> Start Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-success-50 text-success-600 flex h-10 w-10 items-center justify-center rounded-lg">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Import Data</h3>
                <p className="text-xs text-neutral-500">Import nodes, edges, and relationships</p>
              </div>
            </div>
            <p className="mb-4 text-xs text-neutral-500">
              Upload JSON, YAML, or CSV files to import graph data. Imports are validated and can be
              rolled back.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => startImport.mutate({ source: 'manual', payload: {} })}
              >
                <Upload className="h-4 w-4" /> Quick Import
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => startImport.mutate({ source: 'manual', payload: {}, dryRun: true })}
              >
                <Eye className="h-4 w-4" /> Dry Run
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Imports */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Recent Imports
        </h2>
        {importsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : imports?.items && imports.items.length > 0 ? (
          <Card>
            <CardContent className="divide-y p-2">
              {imports.items.slice(0, 5).map((job) => (
                <div key={job.import_id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{job.source} import</p>
                    <p className="text-xs text-neutral-400">
                      {job.imported_items}/{job.total_items} items
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {job.status === 'running' && (
                      <Progress value={job.progress} size="sm" className="w-24" />
                    )}
                    <Badge
                      variant={
                        job.status === 'completed'
                          ? 'success'
                          : job.status === 'failed'
                            ? 'danger'
                            : 'info'
                      }
                      size="sm"
                    >
                      {job.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-neutral-400">
              No recent imports
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Exports */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Recent Exports
        </h2>
        {exportsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : exports?.items && exports.items.length > 0 ? (
          <Card>
            <CardContent className="divide-y p-2">
              {exports.items.slice(0, 5).map((job) => (
                <div key={job.export_id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileJson className="h-4 w-4 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium">
                        {job.format.toUpperCase()} — {job.target}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {job.file_size ? `${(job.file_size / 1024).toFixed(1)} KB` : 'Pending'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      job.status === 'completed'
                        ? 'success'
                        : job.status === 'failed'
                          ? 'danger'
                          : 'info'
                    }
                    size="sm"
                  >
                    {job.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-neutral-400">
              No recent exports
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/versions">
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" /> Version History
          </Button>
        </Link>
        <Link href="/health">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> System Health
          </Button>
        </Link>
      </div>
    </Shell>
  );
}
