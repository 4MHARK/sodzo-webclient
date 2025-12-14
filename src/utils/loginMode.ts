/**
 * Login Mode Management
 * Manages whether user is logging in as "User" (requires API key) or "Admin" (no API key)
 */

export type LoginMode = "user" | "admin";

const LOGIN_MODE_KEY = "saby:login_mode";

/**
 * Get current login mode from localStorage
 * Defaults to "user" if not set
 */
export function getLoginMode(): LoginMode {
  if (typeof window === "undefined") return "user";

  try {
    const stored = localStorage.getItem(LOGIN_MODE_KEY);
    return stored === "admin" || stored === "user" ? stored : "user";
  } catch {
    return "user";
  }
}

/**
 * Set login mode in localStorage
 */
export function setLoginMode(mode: LoginMode): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(LOGIN_MODE_KEY, mode);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[LoginMode] Failed to save login mode:", error);
    }
  }
}

/**
 * Check if API key should be added to login request
 * Returns true for "user" mode, false for "admin" mode
 */
export function shouldAddApiKeyToLogin(): boolean {
  return getLoginMode() === "user";
}

/**
 * Get login mode synchronously (for use in interceptors)
 */
export function getLoginModeSync(): LoginMode {
  if (typeof window === "undefined") return "user";

  try {
    const stored = localStorage.getItem(LOGIN_MODE_KEY);
    return stored === "admin" || stored === "user" ? stored : "user";
  } catch {
    return "user";
  }
}

