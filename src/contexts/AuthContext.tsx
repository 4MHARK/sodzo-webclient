import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from "react";
import axios from 'axios';
import { createAPI, API_ENDPOINTS, LOCAL_REFRESH_KEY } from "../utils/api";
import type { AxiosInstance } from "axios";
import { dataManager } from "../utils/dataManager";

// User model derived from /auth/login and GET /user/{id}
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // access token in memory
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  api: AxiosInstance;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null); // access token stays in memory only
  const [isLoading, setIsLoading] = useState(true); // Track loading state
  // Keep a ref for the access token so createAPI's request interceptor can read a stable reference
  const tokenRef = useRef<string | null>(null);
  // In cookie-only mode we do not persist refresh tokens in localStorage.
  // Access tokens are not exposed to JS if backend marks them HttpOnly as well.
  // We keep an in-memory `user` and optionally the access token if server returns it in responses,
  // but we never persist tokens in localStorage or read cookies from JS.

  const setTokenStateSafe = useCallback((t: string | null) => {
    tokenRef.current = t;
    setTokenState(t);
  }, []);

  // create stable api instance and keep as ref. Provide get/set access token callbacks and
  // an onAuthFailure callback that the API layer will call if a refresh attempt fails.
  const apiRef = useRef<AxiosInstance | null>(null);
  // Stable getter that reads the ref value (not a render-bound closure)
  const getAccessToken = useCallback(() => tokenRef.current, []);
  const setAccessToken = useCallback(
    (t: string | null) => setTokenStateSafe(t),
    [setTokenStateSafe]
  );
  // Keep refresh token in memory only (do not persist to localStorage).
  const refreshTokenRef = useRef<string | null>(null);
  const getRefreshToken = useCallback(() => refreshTokenRef.current, []);
  if (!apiRef.current)
    apiRef.current = createAPI(
      getAccessToken,
      setAccessToken,
      getRefreshToken,
      () => {
        // onAuthFailure: clear in-memory user/token so UI updates to logged-out state
        console.log("🚨 Authentication failed - clearing session");
        setUser(null);
        setTokenStateSafe(null);
        setIsLoading(false);

        // Clear all intelligent data cache
        dataManager.clearCache();
        console.log("🧹 Cleared intelligent data cache");
      }
    );

  // On mount, attempt a silent refresh to let the backend re-establish a session from cookies.
  // Run this only once using useEffect and a guard ref to avoid spamming the refresh endpoint.
  const restoreRunRef = useRef(false);
  useEffect(() => {
    if (restoreRunRef.current) return;
    restoreRunRef.current = true;

    // Check for refresh token in localStorage and restore to memory if needed
    const storedRefreshToken =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(LOCAL_REFRESH_KEY)
        : null;
    if (storedRefreshToken && !refreshTokenRef.current) {
      refreshTokenRef.current = storedRefreshToken;
      console.log("💾 Restored refresh token from localStorage to memory");
    }

    // Only attempt silent refresh if we have a refresh token available (in-memory or localStorage)
    const hasRefreshToken = refreshTokenRef.current || storedRefreshToken;

    console.log("🔍 Session restore check:", {
      user: !!user,
      refreshTokenInMemory: !!refreshTokenRef.current,
      refreshTokenInStorage: !!storedRefreshToken,
      hasRefreshToken: !!hasRefreshToken,
    });

    if (!user && hasRefreshToken) {
      console.log(
        "🔄 Attempting silent refresh on app startup - refresh token available"
      );
      // Use the api's guarded refresh helper so startup doesn't bypass backoff/cooldown
      try {
        const doRefresh = (apiRef.current as any)?._doRefresh as
          | (() => Promise<any>)
          | undefined;
        if (doRefresh) {
          doRefresh()
            .then((resp) => {
              const data = resp?.data as any;
              const userResp = data?.user ?? null;
              const accessToken =
                data?.access?.token ??
                data?.tokens?.access?.token ??
                data?.access_token ??
                data?.token ??
                null;
              const newRefresh =
                data?.refresh?.token ??
                data?.tokens?.refresh?.token ??
                data?.refresh_token ??
                data?.refreshToken ??
                null;
              if (userResp) {
                setUser(userResp);
                console.log(
                  "✅ Silent refresh successful - user authenticated"
                );
              }
              if (accessToken) setTokenStateSafe(accessToken);
              if (newRefresh) {
                refreshTokenRef.current = newRefresh;
                // Also store in localStorage for persistence across browser refreshes
                if (typeof localStorage !== "undefined") {
                  localStorage.setItem(LOCAL_REFRESH_KEY, newRefresh);
                  console.log("💾 Refresh token stored in localStorage");
                }
              }
              setIsLoading(false);
            })
            .catch(() => {
              console.log(
                "❌ Silent refresh failed - user remains unauthenticated"
              );
              setIsLoading(false);
            });
        } else {
          // Fallback: call refresh endpoint directly
          const refreshToken = refreshTokenRef.current;
          const body = refreshToken ? { refreshToken } : {};
          console.log("🔄 Fallback refresh request body:", body);
          console.log("🔄 Fallback refresh endpoint:", API_ENDPOINTS.REFRESH);
          console.log("🔄 Fallback refresh token available:", !!refreshToken);
          console.log(
            "🔄 Fallback refresh token value:",
            refreshToken ? `${refreshToken.substring(0, 20)}...` : "null"
          );
          console.log("🔄 Fallback refresh request headers:", {
            "Content-Type": "application/json",
          });

          apiRef.current
            ?.post(API_ENDPOINTS.REFRESH, body, {
              withCredentials: true,
              headers: { "Content-Type": "application/json" },
            })
            .then((resp) => {
              console.log(
                "✅ Fallback refresh request successful:",
                resp.status
              );
              const data = resp.data as any;
              const userResp = data?.user ?? null;
              const accessToken =
                data?.access?.token ??
                data?.tokens?.access?.token ??
                data?.access_token ??
                data?.token ??
                null;
              const newRefresh =
                data?.refresh?.token ??
                data?.tokens?.refresh?.token ??
                data?.refresh_token ??
                data?.refreshToken ??
                null;
              if (userResp) {
                setUser(userResp);
                console.log(
                  "✅ Silent refresh successful - user authenticated"
                );
              }
              if (accessToken) setTokenStateSafe(accessToken);
              if (newRefresh) {
                refreshTokenRef.current = newRefresh;
                // Also store in localStorage for persistence across browser refreshes
                if (typeof localStorage !== "undefined") {
                  localStorage.setItem(LOCAL_REFRESH_KEY, newRefresh);
                  console.log(
                    "💾 Refresh token stored in localStorage (fallback)"
                  );
                }
              }
              setIsLoading(false);
            })
            .catch((error) => {
              console.log(
                "❌ Fallback refresh request failed:",
                error.response?.status,
                error.message
              );
              console.log(
                "❌ Fallback refresh error details:",
                error.response?.data
              );
              setIsLoading(false);
            });
        }
      } catch (e) {
        console.log("❌ Silent refresh error - user remains unauthenticated");
        setIsLoading(false);
      }
    } else if (!user && !hasRefreshToken) {
      console.log(
        "🚫 No silent refresh attempted - no refresh token available"
      );
      setIsLoading(false);
    } else {
      console.log("🚫 No silent refresh needed - user already authenticated");
      setIsLoading(false);
    }
  }, [user]);

  const logout = useCallback(() => {
    console.log("🚪 Logging out user");
    console.log(
      "🚪 Current refresh token:",
      refreshTokenRef.current
        ? `${refreshTokenRef.current.substring(0, 20)}...`
        : "null"
    );

    // Notify backend so it can clear its cookies.
    try {
      const body = refreshTokenRef.current
        ? { refreshToken: refreshTokenRef.current }
        : {};
      console.log("🚪 Logout request body:", body);
      console.log("🚪 Logout endpoint:", API_ENDPOINTS.LOGOUT);
      console.log("🚪 Logout request headers:", {
        "Content-Type": "application/json",
      });

      apiRef.current
        ?.post(API_ENDPOINTS.LOGOUT, body, {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          console.log("✅ Logout request successful:", response.status);
        })
        .catch((error) => {
          console.log(
            "❌ Logout request failed:",
            error.response?.status,
            error.message
          );
        });
    } catch (error) {
      console.log("❌ Logout request error:", error);
      apiRef.current
        ?.post(
          API_ENDPOINTS.LOGOUT,
          {},
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        )
        .then((response) => {
          console.log(
            "✅ Fallback logout request successful:",
            response.status
          );
        })
        .catch((error) => {
          console.log(
            "❌ Fallback logout request failed:",
            error.response?.status,
            error.message
          );
        });
    }

    // Clear only in-memory state. Do not attempt to read/clear tokens from localStorage; cookies are cleared by the server.
    setUser(null);
    setTokenStateSafe(null);
    setIsLoading(false);

    // Clear all intelligent data cache
    dataManager.clearCache();
    console.log("🧹 Cleared intelligent data cache on logout");

    // Clear refresh token
    refreshTokenRef.current = null;

    // Also clear from localStorage
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(LOCAL_REFRESH_KEY);
      console.log("🧹 Refresh token cleared from localStorage");
    }
  }, [setTokenStateSafe]);

  // Provide setToken for compatibility with existing components (like AuthModal)
  const setToken = useCallback(
    (t: string | null) => {
      setTokenStateSafe(t);
    },
    [setTokenStateSafe]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        console.log("🔐 Attempting login for:", email);

        // In cookie-only mode the backend should set HttpOnly cookies on successful login.
        const resp = await apiRef.current!.post(
          API_ENDPOINTS.AUTH,
          { email, password },
          { withCredentials: true }
        );
        const data = resp.data as any;
        const userResp: User | undefined = data.user ?? data ?? null;

        // Backend may return a non-HttpOnly access token in the body (optional). Keep it in memory if provided.
        const accessToken =
          data?.access?.token ??
          data?.tokens?.access?.token ??
          data?.access_token ??
          data?.token ??
          null;
        const newRefresh =
          data?.refresh?.token ??
          data?.tokens?.refresh?.token ??
          data?.refresh_token ??
          data?.refreshToken ??
          null;

        console.log(
          "🔑 Login response - Access token:",
          accessToken ? `${accessToken.substring(0, 20)}...` : "null"
        );
        console.log(
          "🔑 Login response - Refresh token:",
          newRefresh ? `${newRefresh.substring(0, 20)}...` : "null"
        );

        if (accessToken) {
          setTokenStateSafe(accessToken);
          console.log("💾 Access token stored in memory");
        }
        if (newRefresh) {
          refreshTokenRef.current = newRefresh;
          // Also store in localStorage for persistence across browser refreshes
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(LOCAL_REFRESH_KEY, newRefresh);
            console.log("💾 Refresh token stored in localStorage (login)");
          }
          console.log("💾 Refresh token stored in memory");
          console.log(
            "💾 Refresh token ref value:",
            refreshTokenRef.current
              ? `${refreshTokenRef.current.substring(0, 20)}...`
              : "null"
          );
        }

        setUser(userResp ?? null);
        setIsLoading(false);
        console.log("✅ Login successful for:", email);
        return userResp ?? ({} as User);
      } catch (err: unknown) {
        setIsLoading(false);
        let message = "Login failed";
        if (axios.isAxiosError(err)) {
          message = err.response?.data?.message ?? err.message ?? message;
        } else if (err instanceof Error) message = err.message;
        console.log("❌ Login failed:", message);
        throw new Error(message);
      }
    },
    [setTokenStateSafe]
  );

  // Computed values
  const isAuthenticated = !!(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
        login,
        logout,
        api: apiRef.current!,
        isAuthenticated,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
