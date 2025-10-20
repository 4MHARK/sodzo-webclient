import { createContext, useContext, useState, ReactNode, useCallback, useRef } from "react";
import axios from 'axios';
import { createAPI } from "../utils/api";
import type { AxiosInstance } from 'axios';

// User model derived from /auth/login and GET /user/{id}
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
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

const REFRESH_KEY = 'saby:refresh_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null); // access token stays in memory only

  // setTokens will be called by the API refresh flow to update access and refresh tokens
  const setTokens = useCallback((tokens: { access?: string | null; refresh?: string | null }) => {
    if (tokens.access !== undefined) {
      setTokenState(tokens.access ?? null);
    }
    if (tokens.refresh !== undefined) {
      if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
      else localStorage.removeItem(REFRESH_KEY);
    }
  }, []);

  const getAccessToken = useCallback(() => token, [token]);

  // create stable api instance and keep as ref
  const apiRef = useRef<AxiosInstance | null>(null);
  if (!apiRef.current) apiRef.current = createAPI(getAccessToken, setTokens);

  const logout = useCallback(() => {
    // Attempt to notify backend (fire-and-forget). Some APIs require server-side logout to revoke refresh tokens.
    // include refresh token in logout request body in case the server requires it
    try {
      const refresh = localStorage.getItem(REFRESH_KEY);
      apiRef.current?.post('/auth/logout', { refresh_token: refresh }).catch(() => {});
    } catch {
      // ignore
    }

    // Clear persisted tokens/user used by other contexts and storage
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    // Clear in-memory state
    setUser(null);
    setTokenState(null);
  }, []);

  // Provide setToken for compatibility with existing components (like AuthModal)
  const setToken = useCallback((t: string | null) => {
    setTokens({ access: t });
  }, [setTokens]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const resp = await apiRef.current!.post('/auth/login', { email, password });
        // Support multiple response shapes
        const data = resp.data;
        const userResp: User | undefined = data.user ?? data;

        // access token may be in multiple shapes: data.tokens.access.token, data.access.token or data.access_token
        const accessToken: string | null =
          data.tokens?.access?.token ?? data.access?.token ?? data.access_token ?? null;

        // refresh token may be in data.tokens.refresh.token or data.refresh.token or data.refresh_token
        const refreshToken: string | null =
          data.tokens?.refresh?.token ?? data.refresh?.token ?? data.refresh_token ?? null;

        // set tokens via setTokens which will persist the refresh token and set in-memory access token
        setTokens({ access: accessToken, refresh: refreshToken });

        // set state
        setUser(userResp ?? null);

        return userResp ?? ({} as User);
      } catch (err: unknown) {
        // Normalize error message for callers
        let message = 'Login failed';
        if (axios.isAxiosError(err)) {
          message = err.response?.data?.message ?? err.message ?? message;
        } else if (err instanceof Error) message = err.message;
        throw new Error(message);
      }
    },
    [setToken]
  );

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
