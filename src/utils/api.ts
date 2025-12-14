import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { getApiKeySync } from "./apiKeyStorage";
import { db } from "./dbService";
import { getLoginModeSync, shouldAddApiKeyToLogin } from "./loginMode";

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

const LOCAL_REFRESH_KEY =
  import.meta.env.VITE_REFRESH_TOKEN_KEY || "saby:refresh_token";

// RefreshResponse type was removed because we accept multiple response shapes from the API

export function createAPI(
  getAccessToken?: () => string | null,
  setAccessToken?: (t: string | null) => void,
  getRefreshToken?: () => string | null,
  onAuthFailure?: () => void,
  onAuthSuccess?: (response: any) => void,
  onVerificationNeeded?: (email?: string) => void
): AxiosInstance {
  const api = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
    // Send cookies (HttpOnly access/refresh cookies) by default. Backend must allow credentials via CORS.
    withCredentials: true,
  });

  // Attach Authorization header from in-memory access token if present.
  // Also attach global API key conditionally based on login mode (for login requests).
  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    try {
      // First, attach access token if available (takes priority)
      const token = getAccessToken ? getAccessToken() : null;
      if (token && config.headers) {
        (config.headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${token}`;
      }

      // If no access token, conditionally attach global API key based on login mode
      // API key is only added for "user" mode login requests, not for "admin" mode
      if (!token && config.headers) {
        // Check if this is a login request
        // Match various login endpoint formats (relative, absolute, with/without base)
        const url = config.url || "";
        const authEndpoint = API_ENDPOINTS.AUTH || "/auth/login";
        const isLoginRequest =
          url.includes("/auth/login") ||
          url === authEndpoint ||
          url.endsWith("/auth/login") ||
          url.includes("auth/login") ||
          (authEndpoint.startsWith("/") && url.endsWith(authEndpoint)) ||
          (authEndpoint.startsWith("/") &&
            url.includes(authEndpoint.replace("/", "")));

        // Debug logging for login requests
        if (isLoginRequest) {
          const loginMode = getLoginModeSync();
          const shouldAdd = shouldAddApiKeyToLogin();
          const apiKey = getApiKeySync();

          console.log("[API Interceptor] Login Request Debug:", {
            url: config.url,
            loginMode,
            shouldAddApiKey: shouldAdd,
            hasApiKey: !!apiKey,
            apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : "none",
          });
        }

        // Only add API key if:
        // 1. It's a login request AND
        // 2. Login mode is "user" (not "admin")
        if (isLoginRequest && shouldAddApiKeyToLogin()) {
          // Try cache first (fast, synchronous)
          let globalApiKey = getApiKeySync();

          // Fallback: if cache is empty, fetch from IndexedDB asynchronously
          if (!globalApiKey) {
            console.warn(
              "[API Interceptor] ⚠️ Cache empty, attempting async fetch from IndexedDB..."
            );
            try {
              // Use dynamic import with Promise chain to avoid esbuild async/await issues
              const apiKeyModule = await import("./apiKeyStorage");
              const fetchedKey = await apiKeyModule.getApiKey();

              if (fetchedKey) {
                apiKeyModule.updateApiKeyCache(fetchedKey);
                globalApiKey = fetchedKey;
                console.log(
                  "[API Interceptor] ✅ Fetched and cached API key from IndexedDB"
                );
              }
            } catch (error) {
              console.error(
                "[API Interceptor] ❌ Failed to fetch API key from IndexedDB:",
                error
              );
            }
          }

          if (globalApiKey) {
            // Add API key as a custom header
            (config.headers as Record<string, string>)["X-API-Key"] =
              globalApiKey;

            console.log(
              "[API Interceptor] ✅ Added API key to login request (User mode)",
              {
                header: "X-API-Key",
                keyPreview: `${globalApiKey.substring(0, 10)}...`,
                source:
                  getApiKeySync() === globalApiKey ? "cache" : "IndexedDB",
              }
            );
          } else {
            console.error(
              "[API Interceptor] ❌ No API key available for login! Check Admin Settings."
            );
          }
        } else if (isLoginRequest && !shouldAddApiKeyToLogin()) {
          // Admin mode - don't add API key
          console.log(
            "[API Interceptor] ⏭️ Skipping API key for login request (Admin mode)"
          );
        } else {
          // Not a login request - add API key if available (for other unauthenticated calls)
          const globalApiKey = getApiKeySync();
          if (globalApiKey) {
            (config.headers as Record<string, string>)["X-API-Key"] =
              globalApiKey;
          }
        }
      }

      // Track request start time for duration calculation
      (config as any).metadata = {
        startTime: Date.now(),
      };
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
      // Backend requires refreshToken in the body. Check if we have one available.
      const refreshToken = getRefreshToken ? getRefreshToken() : null;
      // Temporary fallback: if we don't have an in-memory refresh token but a legacy localStorage key exists,
      // include it in the body. This helps during migration; we avoid writing to localStorage in new code paths.
      const legacy =
        typeof localStorage !== "undefined"
          ? localStorage.getItem(LOCAL_REFRESH_KEY)
          : null;

      // If no refreshToken is available, don't attempt refresh - backend requires it
      if (!refreshToken && !legacy) {
        const err: any = new Error("No refresh token available");
        err.status = 401;
        throw err;
      }

      const body = refreshToken ? { refreshToken } : { refreshToken: legacy };

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

  // Helper function to check if error indicates verification needed
  const isVerificationNeeded = (error: AxiosError): boolean => {
    const errorData = error.response?.data as any;
    const errorMessage = (
      errorData?.message ||
      errorData?.error ||
      error.message ||
      ""
    ).toLowerCase();

    // Check for verification-related keywords
    const verificationKeywords = [
      "verify",
      "verification",
      "otp",
      "unverified",
      "not verified",
      "account not verified",
      "email not verified",
      "please verify",
      "verification required",
    ];

    const hasVerificationKeyword = verificationKeywords.some((keyword) =>
      errorMessage.includes(keyword)
    );

    // Check for specific error codes that indicate verification needed
    const verificationErrorCode =
      errorData?.code === "ACCOUNT_NOT_VERIFIED" ||
      errorData?.code === "VERIFICATION_REQUIRED" ||
      errorData?.errorCode === "ACCOUNT_NOT_VERIFIED";

    // Check if response indicates verification needed
    const requiresVerification =
      errorData?.requiresVerification === true ||
      errorData?.verificationRequired === true;

    return (
      hasVerificationKeyword || verificationErrorCode || requiresVerification
    );
  };

  // Helper function to check if error indicates API key approval needed
  const isApiKeyApprovalNeeded = (error: AxiosError): boolean => {
    const errorData = error.response?.data as any;

    // Check response status - 403 often indicates API key issues
    const isForbidden = error.response?.status === 403;

    // Get error message from various possible locations
    const errorMessage = (
      errorData?.message ||
      errorData?.error ||
      errorData?.msg ||
      error.message ||
      ""
    ).toLowerCase();

    // Check for API key approval-related keywords (case-insensitive)
    const approvalKeywords = [
      "pending approval",
      "api key.*pending",
      "wait for.*approval",
      "sabyuser approval",
      "approval.*required",
      "key.*pending",
      "production api key is pending",
      "please wait for.*approval",
    ];

    const hasApprovalKeyword = approvalKeywords.some((keyword) => {
      const regex = new RegExp(keyword, "i");
      return regex.test(errorMessage);
    });

    // Check for specific error codes
    const approvalErrorCode =
      errorData?.code === "API_KEY_PENDING_APPROVAL" ||
      errorData?.errorCode === "API_KEY_PENDING_APPROVAL" ||
      errorData?.code === "API_KEY_APPROVAL_REQUIRED";

    // Also check if it's a 403 and message contains "api key"
    const isApiKeyError =
      isForbidden &&
      (errorMessage.includes("api key") ||
        errorMessage.includes("apikey") ||
        errorMessage.includes("api-key"));

    const result = hasApprovalKeyword || approvalErrorCode || isApiKeyError;

    if (import.meta.env.DEV && result) {
      console.debug("[isApiKeyApprovalNeeded] Detected approval error:", {
        status: error.response?.status,
        message: errorMessage,
        hasKeyword: hasApprovalKeyword,
        hasCode: approvalErrorCode,
        isApiKeyError,
      });
    }

    return result;
  };

  api.interceptors.response.use(
    async (res) => {
      // Log successful API call to database
      try {
        const config = res.config as any;
        const duration = config.metadata?.startTime
          ? Date.now() - config.metadata.startTime
          : undefined;

        await db.apiCalls.add({
          endpoint: res.config.url || "",
          method: (res.config.method || "GET").toUpperCase(),
          status: res.status,
          statusText: res.statusText,
          responseBody: res.data,
          timestamp: new Date(),
          duration: duration,
        });
      } catch (error) {
        // Silently fail logging - don't break API calls
        if (import.meta.env.DEV) {
          console.warn("[API] Failed to log API call:", error);
        }
      }
      return res;
    },
    async (err: AxiosError & { config?: CustomRequestConfig }) => {
      // Log failed API call to database
      try {
        const config = err.config as any;
        const duration = config?.metadata?.startTime
          ? Date.now() - config.metadata.startTime
          : undefined;

        await db.apiCalls.add({
          endpoint: err.config?.url || "",
          method: (err.config?.method || "GET").toUpperCase(),
          status: err.response?.status || 0,
          statusText: err.response?.statusText || "Network Error",
          error: err.message,
          timestamp: new Date(),
          duration: duration,
        });
      } catch (error) {
        // Silently fail logging - don't break error handling
        if (import.meta.env.DEV) {
          console.warn("[API] Failed to log API call error:", error);
        }
      }
      const originalConfig = err.config;
      if (!originalConfig) return Promise.reject(err);

      // Check if error indicates API key approval needed (FIRST - before any other checks)
      // This MUST prevent authentication - check multiple ways to ensure detection
      const errorData = err.response?.data as any;
      const errorMessage = (
        errorData?.message ||
        errorData?.error ||
        errorData?.msg ||
        err.message ||
        ""
      ).toLowerCase();

      const is403 = err.response?.status === 403;
      const hasApprovalMessage =
        errorMessage.includes("pending approval") ||
        (errorMessage.includes("wait for") &&
          errorMessage.includes("approval")) ||
        errorMessage.includes("sabyuser approval");

      // Check if this is an API key approval error
      if (isApiKeyApprovalNeeded(err) || (is403 && hasApprovalMessage)) {
        const finalErrorMessage =
          errorData?.message ||
          errorData?.error ||
          errorData?.msg ||
          "This production API key is pending approval. Please wait for SabyUser approval before using it.";

        console.error(
          "[API Interceptor] ❌ API KEY APPROVAL REQUIRED - BLOCKING AUTHENTICATION",
          {
            status: err.response?.status,
            message: finalErrorMessage,
            url: err.config?.url,
            isLoginRequest: err.config?.url?.includes("/auth/login"),
          }
        );

        // CRITICAL: Reject immediately - this prevents login from succeeding
        const approvalError: any = new Error(finalErrorMessage);
        approvalError.isApiKeyApprovalNeeded = true;
        approvalError.status = err.response?.status || 403;
        approvalError.response = err.response;
        approvalError.config = err.config;

        // Ensure this error is not caught by token refresh logic
        return Promise.reject(approvalError);
      }

      // Check if 401 error indicates verification needed (before attempting refresh)
      if (err.response?.status === 401 && isVerificationNeeded(err)) {
        const errorData = err.response?.data as any;
        const email = errorData?.email || errorData?.user?.email || undefined;

        // Notify that verification is needed
        if (typeof onVerificationNeeded === "function") {
          try {
            onVerificationNeeded(email);
          } catch (e) {
            // ignore errors from callback
          }
        }

        // Reject with a specific error that can be caught by components
        const verificationError: any = new Error(
          errorData?.message || "Account verification required"
        );
        verificationError.isVerificationNeeded = true;
        verificationError.email = email;
        return Promise.reject(verificationError);
      }

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
          // Update Authorization header with new token
          const newToken = getAccessToken ? getAccessToken() : null;
          if (newToken && originalConfig.headers) {
            (originalConfig.headers as Record<string, string>)[
              "Authorization"
            ] = `Bearer ${newToken}`;
          }
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
    }
  );

  // Expose guarded refresh helper for callers (e.g., AuthContext startup restore) to avoid bypassing cooldown/backoff
  (api as any)._doRefresh = doRefresh;

  // Store onAuthSuccess callback for later updates
  (api as any)._onAuthSuccess = onAuthSuccess;
  (api as any)._setAuthSuccessCallback = (cb: (response: any) => void) => {
    (api as any)._onAuthSuccess = cb;
  };

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
