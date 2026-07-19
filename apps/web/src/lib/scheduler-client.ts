/**
 * Scheduler, Analytics, Plugin, Notification API client.
 */
import { apiClient } from './api-client';

export interface ScheduledJob {
  id: string;
  name: string;
  job_type: string;
  cron_expression: string;
  status: string;
  priority: number;
  last_error: string | null;
  duration_ms: number;
  created_at: string;
}

export interface SystemMetrics {
  total_nodes: number;
  total_edges: number;
  total_engines: number;
  active_engines: number;
  total_events: number;
  uptime_hours: number;
  cache_hit_rate: number;
  snapshot_count: number;
}

export interface PluginInfo {
  plugin_id: string;
  name: string;
  version: string;
  status: string;
  capabilities: string[];
  dependencies: string[];
  error_message: string | null;
}

export interface NotificationInfo {
  notification_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface AuditEntry {
  entry_id: string;
  timestamp: string;
  category: string;
  action: string;
  actor: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
}

export const systemClient = {
  // Scheduler
  listJobs: (status?: string, limit = 50) =>
    apiClient.get<{ items: ScheduledJob[]; total: number }>('/scheduler/jobs', {
      params: { status, limit },
    }),
  getJob: (jobId: string) => apiClient.get<ScheduledJob>(`/scheduler/jobs/${jobId}`),
  scheduleOnce: (name: string, delay?: number) =>
    apiClient.post<ScheduledJob>('/scheduler/schedule', {
      name,
      delay_seconds: delay,
      job_type: 'once',
    }),
  scheduleCron: (name: string, cronExpression: string) =>
    apiClient.post<ScheduledJob>('/scheduler/schedule', {
      name,
      cron_expression: cronExpression,
      job_type: 'cron',
    }),
  cancelJob: (jobId: string) => apiClient.post(`/scheduler/cancel`, { job_id: jobId }),
  pauseJob: (jobId: string) => apiClient.post(`/scheduler/pause`, { job_id: jobId }),
  resumeJob: (jobId: string) => apiClient.post(`/scheduler/resume`, { job_id: jobId }),
  getSchedulerStatistics: () => apiClient.get('/scheduler/statistics'),

  // Analytics
  getSystemMetrics: () => apiClient.get<SystemMetrics>('/analytics/metrics'),
  getGraphAnalytics: () => apiClient.get('/analytics/graph'),
  getPlatformAnalytics: () => apiClient.get('/analytics/platform'),
  getFullSnapshot: () => apiClient.get('/analytics/snapshot'),
  getAnalyticsSummary: () => apiClient.get('/analytics/summary'),

  // Plugins
  listPlugins: (status?: string) =>
    apiClient.get<{ items: PluginInfo[]; total: number }>('/plugins', {
      params: { status },
    }),
  getPlugin: (pluginId: string) => apiClient.get<PluginInfo>(`/plugins/${pluginId}`),
  registerPlugin: (name: string, version: string, capabilities?: string[]) =>
    apiClient.post<PluginInfo>('/plugins/register', { name, version, capabilities }),
  enablePlugin: (pluginId: string) => apiClient.post(`/plugins/${pluginId}/enable`),
  disablePlugin: (pluginId: string) => apiClient.post(`/plugins/${pluginId}/disable`),
  unloadPlugin: (pluginId: string) => apiClient.post(`/plugins/${pluginId}/unload`),
  getPluginStatistics: () => apiClient.get('/plugins/statistics'),

  // Notifications
  getNotifications: (unreadOnly = false, limit = 50) =>
    apiClient.get<{ items: NotificationInfo[]; count: number }>('/notifications', {
      params: { unread_only: unreadOnly, limit },
    }),
  getUnreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count'),
  markRead: (notificationId: string) => apiClient.post(`/notifications/${notificationId}/read`),
  markAllRead: () => apiClient.post('/notifications/mark-all-read'),
  deleteNotification: (notificationId: string) =>
    apiClient.delete(`/notifications/${notificationId}`),
  getNotificationStatistics: () => apiClient.get('/notifications/statistics'),

  // Audit
  queryAuditLog: (category?: string, actor?: string, limit = 50, offset = 0) =>
    apiClient.get<{ items: AuditEntry[]; total: number }>('/audit/log', {
      params: { category, actor, limit, offset },
    }),
  getAuditEntry: (entryId: string) => apiClient.get<AuditEntry>(`/audit/log/${entryId}`),
  getAuditStatistics: () => apiClient.get('/audit/statistics'),

  // Health
  getEngineHealth: () => apiClient.get('/health/checks'),
  getSystemHealth: () => apiClient.get('/health'),
};
