import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Vite env: use VITE_API_BASE for flexible dev/prod bases.
// For local development we recommend setting VITE_API_BASE=/v1 and using the Vite proxy (see vite.config.ts).
// Prefer explicit VITE_API_BASE, otherwise use a dev-relative path when in development
// so the Vite proxy forwards requests to the staging API and avoids CORS.
export const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? (import.meta.env.DEV ? '/v1' : 'https://api-staging.saby.ai/v1');
const REFRESH_KEY = 'saby:refresh_token';

type RefreshResponse = {
  access: { token: string; expiresIn?: number };
  refresh?: { token: string } | null;
};

export function createAPI(
  getAccessToken: () => string | null,
  setTokens: (tokens: { access?: string | null; refresh?: string | null }) => void
): AxiosInstance {
  const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,
  });

  // Attach access token to requests
  type CustomRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

  api.interceptors.request.use((config: CustomRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      // headers may be AxiosHeaders; assign Authorization in a compatible way
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  // Single-refresh queue
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
    config: CustomRequestConfig;
  }> = [];

  const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) return reject(error);
      if (token && config.headers) (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      resolve(api.request(config));
    });
    failedQueue = [];
  };

  api.interceptors.response.use(
    (res) => res,
    async (err: AxiosError & { config?: CustomRequestConfig }) => {
      const originalConfig = err.config;
      if (!originalConfig) return Promise.reject(err);

      if (err.response?.status === 401 && !originalConfig._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject, config: originalConfig });
          });
        }

        originalConfig._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem(REFRESH_KEY);
          if (!refreshToken) throw new Error('No refresh token available');

          const resp = await axios.post<RefreshResponse>(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const newAccess = resp.data.access.token;
          const newRefresh = resp.data.refresh?.token ?? null;

          setTokens({ access: newAccess, refresh: newRefresh });

          processQueue(null, newAccess);
          isRefreshing = false;

          if (originalConfig.headers) (originalConfig.headers as Record<string, string>)['Authorization'] = `Bearer ${newAccess}`;
          return api.request(originalConfig);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          // clear persisted refresh token
          localStorage.removeItem(REFRESH_KEY);
          return Promise.reject(refreshErr);
        }
      }

      return Promise.reject(err);
    }
  );

  return api;
}
