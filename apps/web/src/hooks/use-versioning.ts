'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { versioningClient } from '@/lib/versioning-client';

export const versioningKeys = {
  all: ['versioning'] as const,
  versions: (branch?: string) => ['versioning', 'versions', branch] as const,
  version: (id: string) => ['versioning', 'version', id] as const,
  imports: (status?: string) => ['versioning', 'imports', status] as const,
  importJob: (id: string) => ['versioning', 'import', id] as const,
  exports: (status?: string) => ['versioning', 'exports', status] as const,
  exportJob: (id: string) => ['versioning', 'export', id] as const,
  statistics: ['versioning', 'statistics'] as const,
};

export function useVersions(branch?: string) {
  return useQuery({
    queryKey: versioningKeys.versions(branch),
    queryFn: async () => {
      const response = await versioningClient.listVersions(branch);
      return response.data;
    },
    staleTime: 30_000,
  });
}

export function useVersion(versionId: string | null) {
  return useQuery({
    queryKey: versioningKeys.version(versionId ?? ''),
    queryFn: async () => {
      if (!versionId) return null;
      const response = await versioningClient.getVersion(versionId);
      return response.data;
    },
    enabled: !!versionId,
    staleTime: 60_000,
  });
}

export function useCreateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ notes, tags }: { notes?: string; tags?: string }) => {
      const response = await versioningClient.createSnapshot(notes, tags);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: versioningKeys.versions() }),
  });
}

export function useRestoreSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      const response = await versioningClient.restoreSnapshot(versionId);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: versioningKeys.all }),
  });
}

export function useRollback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      const response = await versioningClient.rollback(versionId);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: versioningKeys.all }),
  });
}

export function useCompareVersions() {
  return useMutation({
    mutationFn: async ({ a, b }: { a: string; b: string }) => {
      const response = await versioningClient.compareVersions(a, b);
      return response.data;
    },
  });
}

export function useVersionDiff() {
  return useMutation({
    mutationFn: async (versionId: string) => {
      const response = await versioningClient.diffVersion(versionId);
      return response.data;
    },
  });
}

export function useImportJobs(status?: string) {
  return useQuery({
    queryKey: versioningKeys.imports(status),
    queryFn: async () => {
      const response = await versioningClient.listImportJobs(status);
      return response.data;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useImportJob(importId: string | null) {
  return useQuery({
    queryKey: versioningKeys.importJob(importId ?? ''),
    queryFn: async () => {
      if (!importId) return null;
      const response = await versioningClient.getImportJob(importId);
      return response.data;
    },
    enabled: !!importId,
    refetchInterval: 5000,
  });
}

export function useStartImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      source,
      payload,
      dryRun,
    }: {
      source: string;
      payload: Record<string, unknown>;
      dryRun?: boolean;
    }) => {
      const response = await versioningClient.startImport(source, payload, dryRun);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: versioningKeys.imports() }),
  });
}

export function useExportJobs(status?: string) {
  return useQuery({
    queryKey: versioningKeys.exports(status),
    queryFn: async () => {
      const response = await versioningClient.listExportJobs(status);
      return response.data;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useExportJob(exportId: string | null) {
  return useQuery({
    queryKey: versioningKeys.exportJob(exportId ?? ''),
    queryFn: async () => {
      if (!exportId) return null;
      const response = await versioningClient.getExportJob(exportId);
      return response.data;
    },
    enabled: !!exportId,
    refetchInterval: 5000,
  });
}

export function useStartExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      format,
      target,
      options,
    }: {
      format: string;
      target: string;
      options?: Record<string, unknown>;
    }) => {
      const response = await versioningClient.startExport(format, target, options);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: versioningKeys.exports() }),
  });
}

export function useVersioningStatistics() {
  return useQuery({
    queryKey: versioningKeys.statistics,
    queryFn: async () => {
      const [vStats, iStats, eStats] = await Promise.all([
        versioningClient.getVersionStatistics(),
        versioningClient.getImportStatistics(),
        versioningClient.getExportStatistics(),
      ]);
      return { versions: vStats.data, imports: iStats.data, exports: eStats.data };
    },
    staleTime: 60_000,
  });
}
