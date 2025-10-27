import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

// Vite env: use VITE_API_BASE for flexible dev/prod bases.
// For local development we recommend setting VITE_API_BASE=/v1 and using the Vite proxy (see vite.config.ts).
// Prefer explicit VITE_API_BASE, otherwise use a dev-relative path when in development
// so the Vite proxy forwards requests to the staging API and avoids CORS.
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ??
  (import.meta.env.DEV ? "/v1" : "https://api-dev.saby.ai/v1");

// API Endpoints from environment variables
export const API_ENDPOINTS = {
  AUTH: import.meta.env.VITE_API_AUTH_ENDPOINT || "/auth/login",
  REFRESH: import.meta.env.VITE_API_REFRESH_ENDPOINT || "/auth/refresh-tokens",
  LOGOUT: import.meta.env.VITE_API_LOGOUT_ENDPOINT || "/auth/logout",
  USER: import.meta.env.VITE_API_USER_ENDPOINT || "/user",
  NODE: import.meta.env.VITE_API_NODE_ENDPOINT || "/node",
  FORMS: import.meta.env.VITE_API_FORMS_ENDPOINT || "/project-forms",
};

const LOCAL_REFRESH_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || "saby:refresh_token";

// RefreshResponse type was removed because we accept multiple response shapes from the API

export function createAPI(
  getAccessToken?: () => string | null,
  setAccessToken?: (t: string | null) => void,
  getRefreshToken?: () => string | null,
  onAuthFailure?: () => void,
): AxiosInstance {
  const api = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
    // Send cookies (HttpOnly access/refresh cookies) by default. Backend must allow credentials via CORS.
    withCredentials: true,
  });

  // Attach Authorization header from in-memory access token if present.
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    try {
      const token = getAccessToken ? getAccessToken() : null;
      if (token && config.headers) {
        (config.headers as Record<string, string>)["Authorization"] =
          `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  });

  // We intentionally do NOT attach Authorization headers or read tokens from storage.
  // All tokens are managed by the browser (HttpOnly cookies) and by the backend.
  type CustomRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

  // Single-refresh queue to avoid concurrent refresh requests
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
    config: CustomRequestConfig;
  }> = [];

  // Cooldown/backoff for 429 responses to avoid spamming the refresh endpoint
  let refreshCooldownUntil = 0; // timestamp ms until which we won't attempt refresh
  let refreshBackoffMs = 10000; // initial backoff 10s
  const REFRESH_BACKOFF_MAX = 120000; // max 2 minutes

  const inCooldown = () => Date.now() < refreshCooldownUntil;

  // doRefresh is the single place that actually calls the refresh endpoint and applies backoff on 429
  const doRefresh = async () => {
    if (inCooldown()) {
      const err: any = new Error("Refresh cooldown");
      err.status = 429;
      throw err;
    }
    try {
      // Prefer cookie-based refresh (empty body, with credentials). If the server requires a refresh token
      // in the body and we have one available via getRefreshToken, include it as a fallback.
      const refreshToken = getRefreshToken ? getRefreshToken() : null;
      // Temporary fallback: if we don't have an in-memory refresh token but a legacy localStorage key exists,
      // include it in the body. This helps during migration; we avoid writing to localStorage in new code paths.
      const legacy =
        typeof localStorage !== "undefined"
          ? localStorage.getItem(LOCAL_REFRESH_KEY)
          : null;
      const body = refreshToken
        ? { refreshToken }
        : legacy
          ? { refreshToken: legacy }
          : {};
      const resp = await axios.post(
        `${API_BASE}${API_ENDPOINTS.REFRESH}`,
        body,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      // reset backoff on success
      refreshBackoffMs = 10000;
      refreshCooldownUntil = 0;
      return resp;
    } catch (e: any) {
      const status = e?.response?.status ?? null;
      if (status === 429) {
        // apply exponential backoff
        refreshCooldownUntil = Date.now() + refreshBackoffMs;
        refreshBackoffMs = Math.min(refreshBackoffMs * 2, REFRESH_BACKOFF_MAX);
      }
      throw e;
    }
  };

  const processQueue = (error: unknown) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) return reject(error);
      resolve();
    });
    failedQueue = [];
  };

  api.interceptors.response.use(
    (res) => res,
    async (err: AxiosError & { config?: CustomRequestConfig }) => {
      const originalConfig = err.config;
      if (!originalConfig) return Promise.reject(err);

      // On 401 attempt one refresh (cookie-based). If it fails, call onAuthFailure (logout) and reject.
      if (err.response?.status === 401 && !originalConfig._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject, config: originalConfig });
          }).then(() => api.request(originalConfig));
        }

        originalConfig._retry = true;
        isRefreshing = true;

        try {
          // Use the guarded doRefresh which applies cooldown/backoff on 429
          const resp = await doRefresh();

          // If the server returns a new access token in the response body, update in-memory token.
          try {
            const data = resp && resp.data ? (resp.data as any) : null;
            const newAccess =
              data?.access?.token ??
              data?.tokens?.access?.token ??
              data?.access_token ??
              data?.token ??
              null;
            if (newAccess && typeof setAccessToken === "function")
              setAccessToken(newAccess);
          } catch (e) {
            // ignore parsing errors
          }

          processQueue(null);
          isRefreshing = false;

          // Retry the original request once after refresh
          return api.request(originalConfig);
        } catch (refreshErr) {
          processQueue(refreshErr);
          isRefreshing = false;

          // Notify caller to clear session state (frontend should clear in-memory user state)
          try {
            if (typeof onAuthFailure === "function") onAuthFailure();
          } catch (e) {
            // ignore errors from callback
          }

          return Promise.reject(refreshErr);
        }
      }

      return Promise.reject(err);
    },
  );

  // Expose guarded refresh helper for callers (e.g., AuthContext startup restore) to avoid bypassing cooldown/backoff
  (api as any)._doRefresh = doRefresh;

  return api;
}

// DEV helper: call from browser console to check whether cookie-based refresh works.
/* Usage (in browser console):
   await window.__checkAuthCookie()
   -> logs a clear message about whether a cookie-based refresh succeeded or failed
*/
if (import.meta.env.DEV) {
  // attach a small helper to window for manual testing
  (window as any).__checkAuthCookie = async () => {
    try {
      console.debug(
        "[debug] checking cookie-based refresh at",
        `${API_BASE}${API_ENDPOINTS.REFRESH}`
      );
      // try cookie-based refresh (empty body, withCredentials true)
      const resp = await fetch(`${API_BASE}${API_ENDPOINTS.REFRESH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (!resp.ok) {
        if (resp.status === 401) {
          console.warn(
            "[debug] cookie-refresh failed: 401 Unauthorized — cookie missing or invalid",
          );
        } else if (resp.status === 404) {
          console.warn("[debug] cookie-refresh endpoint not found (404)");
        } else {
          console.warn(
            "[debug] cookie-refresh returned",
            resp.status,
            await resp.text(),
          );
        }
        return { ok: false, status: resp.status };
      }

      const data = await resp.json().catch(() => null);
      // If the server indicates a new access token (or success), report success
      const hasAccess = !!(
        data?.access ||
        data?.tokens?.access ||
        data?.access_token ||
        data?.token
      );
      if (hasAccess) {
        console.log(
          "[debug] cookie-refresh succeeded — cookies are working and server returned new tokens",
        );
      } else {
        console.log(
          "[debug] cookie-refresh succeeded (200) — server did not return token in body; server may be using cookies to rotate refresh token",
        );
      }
      return { ok: true, status: resp.status, data };
    } catch (err) {
      console.error("[debug] cookie-refresh request failed", err);
      return { ok: false, error: err };
    }
  };
}
