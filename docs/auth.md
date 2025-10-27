```markdown
# auth.md

# Authentication (frontend integration)

This document describes the production-grade authentication strategy used by the Saby React + TypeScript frontend when talking to the remote API at https://api-staging.saby.ai/v1.

The guidance here assumes a stateless frontend that uses token-based authentication (JWT-like tokens): a short-lived access token kept in memory and a longer-lived refresh token stored in secure, persistent storage.

Base URL

```
https://api-staging.saby.ai/v1
```

✅ Tip: All API calls must use HTTPS. The examples below use Axios, React Context, and TypeScript.

## Overview

This app is stateless: user session state is maintained using tokens issued by the API. The server is authoritative for token verification and refresh. The frontend stores the access token only in memory (React Context) and the refresh token in localStorage to allow persistent, recoverable sessions across browser restarts.

This approach balances security and UX: access tokens are short-lived and never persisted to disk, minimizing leak surface; refresh tokens are used to transparently re-acquire access tokens when needed.

⚠️ Note: Storing refresh tokens in localStorage has trade-offs. It is acceptable for single-page apps when combined with HTTPS, secure server controls (rotation, revocation), and short refresh lifetimes. Consider HttpOnly cookies for higher security requirements.

## Endpoints

This section documents the endpoints used by the frontend for authentication. All requests use the base URL shown above.

1) POST /auth/login

Request

```http
POST /auth/login HTTP/1.1
Host: api-staging.saby.ai
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "<user-supplied-password>"
}
```

Response (successful)

```json
HTTP/1.1 200 OK
{
  "user": {
    "id": "c6a1b2d3-4e5f-6a7b-8c9d-0123456789ab",
    "email": "user@example.com",
    "name": "Jane Doe"
  },
  "access": {
    "token": "eyJhbGci...access-token...",
    "expiresIn": 300
  },
  "refresh": {
    "token": "9c8a7b6...refresh-token...",
    "expiresIn": 1209600
  }
}
```

Fields:
- `user.id` — canonical user identifier (used to fetch profile).
- `access.token` — short-lived token used for API calls (kept in memory).
- `refresh.token` — longer-lived token used to obtain new access tokens (persisted).

2) POST /auth/refresh (optional server endpoint)

Request

```http
POST /auth/refresh HTTP/1.1
Host: api-staging.saby.ai
Content-Type: application/json

{
  "refresh_token": "9c8a7b6...refresh-token..."
}
```

Response

```json
HTTP/1.1 200 OK
{
  "access": { "token": "new-access-token", "expiresIn": 300 },
  "refresh": { "token": "rotated-refresh-token", "expiresIn": 1209600 }
}
```

✅ Tip: The server may or may not rotate the refresh token. Your client should update the stored refresh token on every successful refresh response when the API returns a new one.

## Login flow (frontend responsibilities)

1. User submits credentials to `POST /auth/login`.
2. On success: save `refresh.token` in localStorage, place `access.token` and `user` into React Auth Context (memory).
3. From then on, all API requests include `Authorization: Bearer <access.token>`.
4. If a request receives HTTP 401, the client tries to refresh the access token using the stored refresh token and retries the failed request once.
5. If refresh fails (expired/invalid refresh), the client clears auth state and redirects to login.

## Token handling strategy (explicit)

- Access token: stored only in memory (React Context). Never saved to localStorage or sessionStorage.
- Refresh token: stored in `localStorage` under a single dedicated key, e.g. `saby:refresh_token`.
- All authenticated requests include the access token in the `Authorization` header.
- On 401 responses, the Axios interceptor will attempt a refresh and replay the original request. Only one concurrent refresh is allowed (queue other requests until refresh completes).

✅ Tip: Keep the refresh logic centralized inside the Axios instance to avoid duplicating error handling across components.

## Implementation steps (code)

Below are production-ready excerpts demonstrating how to wire Axios, React Context, and token refresh. Adapt naming and file locations to fit your project.

1) Axios instance with interceptors (src/utils/api.ts)

```ts
// src/utils/api.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

export const API_BASE = 'https://api-staging.saby.ai/v1';

type RefreshResponse = { access: { token: string; expiresIn?: number }; refresh?: { token: string } };

export function createAPI(onAccessTokenExpired: () => string | null, setTokens: (tokens: { access?: string; refresh?: string | null }) => void) {
  const api: AxiosInstance = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false, // we use bearer tokens
  });

  // Attach access token from memory (caller provided getter)
  api.interceptors.request.use((config: AxiosRequestConfig) => {
    const token = onAccessTokenExpired();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Refresh handling: queue requests while refresh is in-flight
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (err: any) => void;
    config: AxiosRequestConfig;
  }> = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        resolve(api.request(config));
      }
    });
    failedQueue = [];
  };

  api.interceptors.response.use(
    (res) => res,
    async (err: AxiosError & { config?: AxiosRequestConfig }) => {
      const originalConfig = err.config;
      if (!originalConfig) return Promise.reject(err);

      // If unauthorized, attempt a refresh
      if (err.response && err.response.status === 401 && !originalConfig._retry) {
        if (isRefreshing) {
          // queue the request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject, config: originalConfig });
          });
        }

        originalConfig._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('saby:refresh_token');
          if (!refreshToken) throw new Error('No refresh token available');

          const resp = await axios.post<RefreshResponse>(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
          const newAccess = resp.data.access.token;
          const newRefresh = resp.data.refresh?.token ?? null;

          // Update client state via setter provided by caller
          setTokens({ access: newAccess, refresh: newRefresh });

          processQueue(null, newAccess);
          isRefreshing = false;

          if (originalConfig.headers) {
            originalConfig.headers.Authorization = `Bearer ${newAccess}`;
          }
          return api.request(originalConfig);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          // Let the caller handle sign-out
          return Promise.reject(refreshErr);
        }
      }

      return Promise.reject(err);
    }
  );

  return api;
}
```

Summary: this creates an Axios instance that reads an access token via a provided getter, attempts a refresh on 401, queues concurrent requests, and uses a setter callback to persist rotated tokens.

2) AuthContext (src/contexts/AuthContext.tsx)

```ts
// src/contexts/AuthContext.tsx
import React, { createContext, useCallback, useContext, useState } from 'react';
import { createAPI } from '../utils/api';

type User = { id: string; email: string; name?: string } | null;

type AuthState = {
  user: User;
  accessToken: string | null;
};

type AuthContextType = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  api: ReturnType<typeof createAPI> | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const setTokens = useCallback((tokens: { access?: string; refresh?: string | null }) => {
    if (tokens.access) setAccessToken(tokens.access);
    if (tokens.refresh !== undefined) {
      if (tokens.refresh) localStorage.setItem('saby:refresh_token', tokens.refresh);
      else localStorage.removeItem('saby:refresh_token');
    }
  }, []);

  const getAccess = useCallback(() => accessToken, [accessToken]);

  // create API instance bound to this context
  const api = createAPI(getAccess, setTokens);

  const login = useCallback(async (email: string, password: string) => {
    const resp = await api.post('/auth/login', { email, password });
    const { user: u, access, refresh } = resp.data;
    setUser(u);
    setTokens({ access: access.token, refresh: refresh?.token ?? null });
  }, [api, setTokens]);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('saby:refresh_token');
    // Optionally notify server about logout
  }, []);

  return (
    <AuthContext.Provider value={{ state: { user, accessToken }, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

Summary: `AuthProvider` manages `user` and `accessToken` in memory, stores refresh tokens in localStorage, and exposes `api`, `login`, and `logout`.

3) Login, Logout usage (short example)

```tsx
// src/pages/Auth.tsx (fragment)
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    // on success, AuthContext will have user and tokens
  };

  return (
    <form onSubmit={submit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Sign in</button>
    </form>
  );
};
```

Summary: Call `login()` from the AuthContext; on success the context holds the user and tokens.

## Security notes

- Do not store full user objects or access tokens in localStorage/sessionStorage. Keep minimal persistent state (only the refresh token) and the rest in memory.
- Use HTTPS exclusively. Never send tokens over plaintext.
- Consider server-driven token rotation and revocation to minimize risk.
- Clear the refresh token from storage on logout.
- Implement server-side protections (rate limiting, anomalous refresh detection) — client must assume the server enforces these protections.

⚠️ Note: LocalStorage is accessible to any script running on the page. Audit all third-party scripts and CSP configuration accordingly.

## Expected developer actions

- Use `useAuth()` to access `api` and `state.user`.
- Protect routes by checking `state.user` and `state.accessToken`.
- Do not read or write `localStorage['saby:refresh_token']` outside the AuthContext. Use the provided API.
- Handle errors returned from `login()` and `api` requests; show UX-specific messages and prevent leaking server error details to users.

✅ Tip: For pages/components that require authentication, build a small `RequireAuth` wrapper that reads `state.user`; if not present, redirect to `/login` and preserve the attempted route for redirect after login.

## Appendix: constants and keys

- Refresh token key: `saby:refresh_token`
- Access token: kept in memory and exposed via `useAuth().state.accessToken`

---

Created for the Saby frontend. Follow server API changes and update `API_BASE` if staging/production differs.

```
