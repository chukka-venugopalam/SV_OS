import { apiClient } from './api-client';

export interface PlatformStatusResponse {
  success: boolean;
  message: string;
  data: {
    status: string;
    environment: string;
    features: Record<string, boolean>;
    engines: string[];
    capabilities: string[];
    plugins: string[];
    initialized: boolean;
  };
  errors: string[] | null;
  timestamp: string;
  request_id: string;
}

export async function getPlatformStatus() {
  return apiClient.get<PlatformStatusResponse['data']>('/platform/status');
}
