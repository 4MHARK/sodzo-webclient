import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from "react";
import axios from 'axios';
import { createAPI, API_ENDPOINTS } from "../utils/api";
import type { AxiosInstance } from 'axios';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null); // access token stays in memory only
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
  const setAccessToken = useCallback((t: string | null) => setTokenStateSafe(t), [setTokenStateSafe]);
  // Keep refresh token in memory only (do not persist to localStorage).
  const refreshTokenRef = useRef<string | null>(null);
  const getRefreshToken = useCallback(() => refreshTokenRef.current, []);
  if (!apiRef.current) apiRef.current = createAPI(getAccessToken, setAccessToken, getRefreshToken, () => {
    // onAuthFailure: clear in-memory user/token so UI updates to logged-out state
    setUser(null);
    setTokenStateSafe(null);
  });

  // On mount, attempt a silent refresh to let the backend re-establish a session from cookies.
  // Run this only once using useEffect and a guard ref to avoid spamming the refresh endpoint.
  const restoreRunRef = useRef(false);
  useEffect(() => {
    if (restoreRunRef.current) return;
    restoreRunRef.current = true;

    if (!user) {
      // Use the api's guarded refresh helper so startup doesn't bypass backoff/cooldown
      try {
        const doRefresh = (apiRef.current as any)?._doRefresh as (() => Promise<any>) | undefined;
        if (doRefresh) {
          doRefresh().then((resp) => {
            const data = resp?.data as any;
            const userResp = data?.user ?? null;
            const accessToken = data?.access?.token ?? data?.tokens?.access?.token ?? data?.access_token ?? data?.token ?? null;
            const newRefresh = data?.refresh?.token ?? data?.tokens?.refresh?.token ?? data?.refresh_token ?? data?.refreshToken ?? null;
            if (userResp) setUser(userResp);
            if (accessToken) setTokenStateSafe(accessToken);
            if (newRefresh) refreshTokenRef.current = newRefresh;
          }).catch(() => {
            // ignore; user remains unauthenticated
          });
        } else {
          // Fallback: call refresh endpoint directly
          apiRef.current
            ?.post(API_ENDPOINTS.REFRESH, {}, { withCredentials: true })
            .then((resp) => {
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
              if (userResp) setUser(userResp);
              if (accessToken) setTokenStateSafe(accessToken);
              if (newRefresh) refreshTokenRef.current = newRefresh;
            })
            .catch(() => {
              // ignore
            });
        }
      } catch (e) {
        // swallow
      }
    }
  }, [user]);

  const logout = useCallback(() => {
    // Notify backend so it can clear its cookies.
    try {
      const body = refreshTokenRef.current ? { refreshToken: refreshTokenRef.current } : {};
      apiRef.current
        ?.post(API_ENDPOINTS.LOGOUT, body, { withCredentials: true })
        .catch(() => {});
    } catch {
      apiRef.current
        ?.post(API_ENDPOINTS.LOGOUT, {}, { withCredentials: true })
        .catch(() => {});
    }

    // Clear only in-memory state. Do not attempt to read/clear tokens from localStorage; cookies are cleared by the server.
    setUser(null);
    setTokenStateSafe(null);
  }, [setTokenStateSafe]);

  // Provide setToken for compatibility with existing components (like AuthModal)
  const setToken = useCallback((t: string | null) => {
    setTokenStateSafe(t);
  }, [setTokenStateSafe]);

  const login = useCallback(async (email: string, password: string) => {
    try {
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
      
      if (accessToken) setTokenStateSafe(accessToken);
      if (newRefresh) {
        refreshTokenRef.current = newRefresh;
        console.log("💾 Refresh token stored in memory");
      }

      setUser(userResp ?? null);
      return userResp ?? ({} as User);
    } catch (err: unknown) {
      let message = 'Login failed';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message ?? err.message ?? message;
      } else if (err instanceof Error) message = err.message;
      throw new Error(message);
    }
  }, [setTokenStateSafe]);

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken, login, logout, api: apiRef.current! }}>
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
