/**
 * Versioning & Import/Export API client.
 */
import { apiClient } from './api-client';

export interface GraphSnapshot {
  version_id: string;
  timestamp: string;
  author: string;
  checksum: string;
  node_count: number;
  edge_count: number;
  notes: string;
  tags: string[];
  parent_version_id: string | null;
  branch: string;
}

export interface VersionDiff {
  version_id_a: string;
  version_id_b: string;
  added_nodes: number;
  removed_nodes: number;
  modified_nodes: number;
  added_edges: number;
  removed_edges: number;
  modified_edges: number;
  added: Array<{ id: string; type: string }>;
  removed: Array<{ id: string; type: string }>;
  modified: Array<{ id: string; type: string }>;
  summary: string;
}

export interface ImportJob {
  import_id: string;
  source: string;
  status: string;
  progress: number;
  total_items: number;
  imported_items: number;
  errors: number;
  started_at: string;
  completed_at: string | null;
  summary: Record<string, unknown>;
}

export interface ExportJob {
  export_id: string;
  format: string;
  target: string;
  status: string;
  progress: number;
  file_size: number;
  started_at: string;
  completed_at: string | null;
  download_url: string;
}

export const versioningClient = {
  // Versions
  listVersions: (branch?: string, limit = 20) =>
    apiClient.get<{ items: GraphSnapshot[]; total: number }>('/versions', {
      params: { branch, limit },
    }),
  getVersion: (versionId: string) => apiClient.get<GraphSnapshot>(`/versions/${versionId}`),
  createSnapshot: (notes?: string, tags?: string, author = 'system') =>
    apiClient.post<GraphSnapshot>('/snapshot', { notes, tags, author }),
  restoreSnapshot: (versionId: string) =>
    apiClient.post<GraphSnapshot>('/restore', { version_id: versionId }),
  rollback: (versionId: string) =>
    apiClient.post<GraphSnapshot>('/rollback', { version_id: versionId }),
  compareVersions: (versionIdA: string, versionIdB: string) =>
    apiClient.post<VersionDiff>('/compare', {
      version_id_a: versionIdA,
      version_id_b: versionIdB,
    }),
  diffVersion: (versionId: string) =>
    apiClient.post<VersionDiff>('/diff', { version_id: versionId }),
  getLatestVersion: () => apiClient.get<GraphSnapshot>('/versions/latest'),
  deleteVersion: (versionId: string) => apiClient.delete(`/versions/${versionId}`),
  getVersionStatistics: () => apiClient.get('/versions/statistics'),

  // Import
  startImport: (source: string, payload: Record<string, unknown>, dryRun = false) =>
    apiClient.post<ImportJob>('/import', { source, payload, dry_run: dryRun }),
  validateImport: (payload: Record<string, unknown>) => apiClient.post('/import/validate', payload),
  dryRunImport: (source: string, payload: Record<string, unknown>) =>
    apiClient.post<ImportJob>('/import/dry-run', { source, payload }),
  cancelImport: (importId: string) => apiClient.post(`/import/cancel`, { import_id: importId }),
  listImportJobs: (status?: string, limit = 20) =>
    apiClient.get<{ items: ImportJob[]; total: number }>('/import/jobs', {
      params: { status, limit },
    }),
  getImportJob: (importId: string) => apiClient.get<ImportJob>(`/import/jobs/${importId}`),
  getImportStatistics: () => apiClient.get('/import/statistics'),

  // Export
  startExport: (format: string, target: string, options?: Record<string, unknown>) =>
    apiClient.post<ExportJob>('/export', { format, target, options }),
  listExportJobs: (status?: string, limit = 20) =>
    apiClient.get<{ items: ExportJob[]; total: number }>('/export/jobs', {
      params: { status, limit },
    }),
  getExportJob: (exportId: string) => apiClient.get<ExportJob>(`/export/jobs/${exportId}`),
  downloadExport: (exportId: string) =>
    apiClient.get(`/export/download/${exportId}`, { skipAuth: false }),
  getExportStatistics: () => apiClient.get('/export/statistics'),
};
