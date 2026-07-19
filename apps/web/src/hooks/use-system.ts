'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { systemClient } from '@/lib/scheduler-client';

export const systemKeys = {
  all: ['system'] as const,
  jobs: (status?: string) => ['system', 'scheduler', 'jobs', status] as const,
  job: (id: string) => ['system', 'scheduler', 'job', id] as const,
  analytics: ['system', 'analytics'] as const,
  metrics: ['system', 'analytics', 'metrics'] as const,
  plugins: (status?: string) => ['system', 'plugins', status] as const,
  plugin: (id: string) => ['system', 'plugin', id] as const,
  notifications: (unreadOnly?: boolean) => ['system', 'notifications', unreadOnly] as const,
  unreadCount: ['system', 'notifications', 'unread'] as const,
  audit: (category?: string) => ['system', 'audit', category] as const,
  auditEntry: (id: string) => ['system', 'audit', 'entry', id] as const,
  health: ['system', 'health'] as const,
};

export function useJobs(status?: string) {
  return useQuery({
    queryKey: systemKeys.jobs(status),
    queryFn: async () => {
      const response = await systemClient.listJobs(status);
      return response.data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: systemKeys.job(jobId ?? ''),
    queryFn: async () => {
      if (!jobId) return null;
      const response = await systemClient.getJob(jobId);
      return response.data;
    },
    enabled: !!jobId,
    staleTime: 10_000,
  });
}

export function useScheduleOnce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, delay }: { name: string; delay?: number }) => {
      const response = await systemClient.scheduleOnce(name, delay);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: systemKeys.jobs() }),
  });
}

export function useCancelJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      await systemClient.cancelJob(jobId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: systemKeys.jobs() }),
  });
}

export function useSystemMetrics() {
  return useQuery({
    queryKey: systemKeys.metrics,
    queryFn: async () => {
      const response = await systemClient.getSystemMetrics();
      return response.data;
    },
    staleTime: 30_000,
  });
}

export function useAnalyticsSnapshot() {
  return useQuery({
    queryKey: systemKeys.analytics,
    queryFn: async () => {
      const response = await systemClient.getFullSnapshot();
      return response.data;
    },
    staleTime: 60_000,
  });
}

export function usePlugins(status?: string) {
  return useQuery({
    queryKey: systemKeys.plugins(status),
    queryFn: async () => {
      const response = await systemClient.listPlugins(status);
      return response.data;
    },
    staleTime: 60_000,
  });
}

export function usePlugin(pluginId: string | null) {
  return useQuery({
    queryKey: systemKeys.plugin(pluginId ?? ''),
    queryFn: async () => {
      if (!pluginId) return null;
      const response = await systemClient.getPlugin(pluginId);
      return response.data;
    },
    enabled: !!pluginId,
    staleTime: 60_000,
  });
}

export function useRegisterPlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      version,
      capabilities,
    }: {
      name: string;
      version: string;
      capabilities?: string[];
    }) => {
      const response = await systemClient.registerPlugin(name, version, capabilities);
      return response.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: systemKeys.plugins() }),
  });
}

export function useEnablePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pluginId: string) => {
      await systemClient.enablePlugin(pluginId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: systemKeys.plugins() }),
  });
}

export function useDisablePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pluginId: string) => {
      await systemClient.disablePlugin(pluginId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: systemKeys.plugins() }),
  });
}

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: systemKeys.notifications(unreadOnly),
    queryFn: async () => {
      const response = await systemClient.getNotifications(unreadOnly);
      return response.data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: systemKeys.unreadCount,
    queryFn: async () => {
      const response = await systemClient.getUnreadCount();
      return response.data;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await systemClient.markRead(notificationId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: systemKeys.notifications() });
      qc.invalidateQueries({ queryKey: systemKeys.unreadCount });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await systemClient.markAllRead();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: systemKeys.notifications() });
      qc.invalidateQueries({ queryKey: systemKeys.unreadCount });
    },
  });
}

export function useAuditLog(category?: string, limit = 50) {
  return useQuery({
    queryKey: systemKeys.audit(category),
    queryFn: async () => {
      const response = await systemClient.queryAuditLog(category, undefined, limit);
      return response.data;
    },
    staleTime: 30_000,
  });
}

export function useAuditEntry(entryId: string | null) {
  return useQuery({
    queryKey: systemKeys.auditEntry(entryId ?? ''),
    queryFn: async () => {
      if (!entryId) return null;
      const response = await systemClient.getAuditEntry(entryId);
      return response.data;
    },
    enabled: !!entryId,
    staleTime: 120_000,
  });
}

export function useEngineHealth() {
  return useQuery({
    queryKey: systemKeys.health,
    queryFn: async () => {
      const response = await systemClient.getEngineHealth();
      return response.data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
