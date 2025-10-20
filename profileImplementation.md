# profileImplementation.md

# Profile implementation and fetching (frontend)

This document explains how the frontend fetches, displays, and protects user profile data using the API at `https://api-staging.saby.ai/v1`.

All examples use Axios, React Context (the AuthContext pattern in this repository), and TypeScript. The profile endpoint is dynamic: `/user/{id}` where `id` is returned in the login response.

## Overview

After a successful login the API returns a `user.id` and access token. The frontend fetches the profile data from `/user/{id}` using the access token supplied in the `Authorization: Bearer <token>` header. Access tokens are injected automatically by the shared Axios instance via an interceptor.

Base URL

```
https://api-staging.saby.ai/v1
```

## Endpoint description

GET /user/{id}

Request example

```http
GET /user/c6a1b2d3-4e5f-6a7b-8c9d-0123456789ab HTTP/1.1
Host: api-staging.saby.ai
Authorization: Bearer <access-token>
Accept: application/json
```

Successful response example

```json
HTTP/1.1 200 OK
{
  "id": "c6a1b2d3-4e5f-6a7b-8c9d-0123456789ab",
  "email": "user@example.com",
  "name": "Jane Doe",
  "avatarUrl": "https://cdn.example.com/avatars/abcd.png",
  "metadata": { "timezone": "UTC", "locale": "en-US" }
}
```

Fields may vary by server version. The `id` field is canonical and should match the `user.id` returned at login.

## Fetching profile (code)

This example uses the existing `AuthContext` which exposes a configured `api` instance (Axios) and `state.user` where the `user.id` is available.

```ts
// src/hooks/useProfile.ts
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type Profile = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
};

export function useProfile() {
  const { state, api } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const userId = state.user?.id;
    if (!userId || !api) return;

    setLoading(true);
    setError(null);

    api.get<Profile>(`/user/${userId}`)
      .then((res) => {
        if (!mounted) return;
        setProfile(res.data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err as Error);
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [state.user?.id, api]);

  return { profile, loading, error };
}
```

Summary: `useProfile` fetches `/user/{id}` using the `api` instance. It handles loading, error, and cancellation when the component unmounts.

## Integration in React (Profile page)

A minimal production-oriented `ProfilePage` that consumes `useProfile`. It includes loading, error handling, and safe rendering practices.

```tsx
// src/pages/ProfilePage.tsx
import React from 'react';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';

export const ProfilePage: React.FC = () => {
  const { profile, loading, error } = useProfile();
  const { logout } = useAuth();

  if (loading) return <div>Loading profile…</div>;
  if (error) {
    return (
      <div>
        <p>Unable to load profile.</p>
        <pre>{String(error)}</pre>
        <button onClick={() => logout()}>Sign out</button>
      </div>
    );
  }

  if (!profile) return <div>No profile available</div>;

  return (
    <section>
      <img src={profile.avatarUrl} alt={`${profile.name ?? 'User'} avatar`} width={96} height={96} />
      <h1>{profile.name ?? profile.email}</h1>
      <p>{profile.email}</p>
      <div>
        <h2>Metadata</h2>
        <pre>{JSON.stringify(profile.metadata ?? {}, null, 2)}</pre>
      </div>
    </section>
  );
};
```

Summary: The `ProfilePage` relies on `useProfile` and uses `logout` as a fallback when profile fetch fails due to auth issues.

## Protecting the profile route (PrivateRoute pattern)

Use a route guard to prevent access to authenticated routes when the user is unauthenticated. This example uses React Router v6-style semantics.

```tsx
// src/components/RequireAuth.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { state } = useAuth();
  const location = useLocation();

  // If no user or no access token in memory, redirect to /login
  if (!state.user || !state.accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};
```

Usage in routes (React Router v6):

```tsx
// in your router setup
// <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
```

Summary: `RequireAuth` checks `AuthContext` and redirects to `/login` if the user is not authenticated.

## Production practices and considerations

- Caching: For frequently-read profile data, implement client-side caching with stale-while-revalidate patterns (SWR, React Query) to reduce load and improve UX. Ensure cache invalidation on logout or profile update.
- Optimistic updates: For profile edits, use optimistic UI updates combined with server-side validation and conflict handling.
- Token verification: Rely on the API to validate tokens server-side. The client should treat 401/403 as authoritative and trigger refresh or logout accordingly.
- Sanitization: Treat all server-provided strings as untrusted. Escape or sanitize when injecting into HTML. Avoid dangerouslySetInnerHTML unless content is sanitized server-side.
- Fail-safe logout: If profile fetch returns 401, trigger the refresh flow automatically. If refresh fails, call `logout()` and redirect to login.
- Minimal storage: Do not persist full profile object in localStorage unless absolutely necessary; prefer in-memory cache or a dedicated cached storage with explicit invalidation.
- Error reporting: Surface user-friendly messages in the UI and send structured error telemetry (without tokens) to your monitoring system.

✅ Tip: Use a library like React Query or SWR with your Axios instance to simplify caching, background refresh, and retry logic. They integrate well with the interceptor-based auth flow described in `auth.md`.

## Example: Update profile (secure PATCH)

```ts
// src/services/profileService.ts
import { useAuth } from '../contexts/AuthContext';

type UpdatePayload = { name?: string; avatarUrl?: string };

export async function updateProfile(api: ReturnType<typeof useAuth>['api'], id: string, payload: UpdatePayload) {
  // Use PATCH when changing partial resource fields
  const sanitized: UpdatePayload = {
    // do light client-side sanitization if required
    name: payload.name?.trim(),
    avatarUrl: payload.avatarUrl,
  };

  const res = await api!.patch(`/user/${id}`, sanitized);
  return res.data;
}
```

Summary: Use PATCH for partial updates. Sanitize inputs client-side and validate server-side.

## Final notes

- The profile path `/user/{id}` is canonical. Always derive `id` from the server `user.id` returned during login.
- Keep profile fetch logic resilient: handle token refresh, network errors, and component unmounts.
- Centralize API logic and token management in `AuthContext` + shared Axios instance to avoid duplicated behavior.

---

Created for the Saby frontend. Update examples to match any server schema changes.
