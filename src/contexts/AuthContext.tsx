import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
} from "react";
import axios from "axios";
import { createAPI, API_ENDPOINTS } from "../utils/api";
import type { AxiosInstance } from "axios";
import { TokenManager } from "../utils/tokenManager";
import { extractExpirationFromResponse } from "../utils/tokenUtils";
import { SessionSync } from "../utils/sessionSync";
import OTPVerificationModal from "../components/Modals/OTPVerificationModal";
import { getSecondsUntilReset } from "../utils/rateLimit";
import { detectMobileLoginIssues } from "../utils/mobileUtils";

// User model derived from /auth/login and GET /user/{id}
interface User {
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
  showVerificationModal: boolean;
  verificationEmail?: string;
  verificationPhoneNumber?: string;
  setShowVerificationModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null); // access token stays in memory only
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<
    string | undefined
  >(undefined);
  const [verificationPhoneNumber, setVerificationPhoneNumber] = useState<
    string | undefined
  >(undefined);
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

  // Token manager for proactive refresh scheduling
  const tokenManagerRef = useRef(new TokenManager());

  // Session sync for cross-tab communication
  const sessionSyncRef = useRef(new SessionSync());

  /**
   * Handle successful authentication (login or refresh)
   * Schedules proactive refresh and syncs across tabs
   */
  const handleSuccessfulAuth = useCallback(
    (response: any) => {
      const data = response?.data || response;
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

      // Update state
      if (userResp) setUser(userResp);
      if (accessToken) setTokenStateSafe(accessToken);
      if (newRefresh) refreshTokenRef.current = newRefresh;

      // Extract expiration and schedule proactive refresh
      const expiresIn = extractExpirationFromResponse(response);
      if (expiresIn) {
        tokenManagerRef.current.scheduleProactiveRefresh(
          expiresIn * 1000, // Convert to milliseconds
          async () => {
            // Proactive refresh callback
            try {
              const doRefresh = (apiRef.current as any)?._doRefresh as
                | (() => Promise<any>)
                | undefined;
              if (doRefresh) {
                const refreshResp = await doRefresh();
                handleSuccessfulAuth(refreshResp);
              }
            } catch (error) {
              console.error("[AuthContext] Proactive refresh failed:", error);
              // Will fall back to reactive refresh on next 401
            }
          }
        );
      }

      // Broadcast to other tabs
      if (accessToken && expiresIn) {
        sessionSyncRef.current.broadcastRefresh({
          accessToken,
          expiresIn,
          refreshToken: newRefresh || undefined,
        });
      }
    },
    [setTokenStateSafe]
  );

  // Handle verification needed callback
  const handleVerificationNeeded = useCallback((email?: string) => {
    setVerificationEmail(email);
    setShowVerificationModal(true);
  }, []);

  // Handle verification completion
  const handleVerificationComplete = useCallback(async () => {
    setShowVerificationModal(false);
    // After verification, try to refresh the session or reload user data
    try {
      const doRefresh = (apiRef.current as any)?._doRefresh as
        | (() => Promise<any>)
        | undefined;
      if (doRefresh) {
        const resp = await doRefresh();
        handleSuccessfulAuth(resp);
      }
    } catch (e) {
      // If refresh fails, user may need to login again
      if (import.meta.env.DEV) {
        console.debug(
          "[AuthContext] Verification complete but refresh failed:",
          e
        );
      }
    }
  }, [handleSuccessfulAuth]);

  if (!apiRef.current) {
    apiRef.current = createAPI(
      getAccessToken,
      setAccessToken,
      getRefreshToken,
      () => {
        // onAuthFailure: clear in-memory user/token so UI updates to logged-out state
        setUser(null);
        setTokenStateSafe(null);
        tokenManagerRef.current.cancelScheduledRefresh();
        sessionSyncRef.current.broadcastLogout();
      },
      handleSuccessfulAuth, // onAuthSuccess: called after successful refresh in interceptor
      handleVerificationNeeded // onVerificationNeeded: called when account verification is required
    );
  } else {
    // Update the auth success callback if API already exists
    const api = apiRef.current as any;
    if (api._setAuthSuccessCallback) {
      api._setAuthSuccessCallback(handleSuccessfulAuth);
    }
  }

  // Update callback whenever handleSuccessfulAuth changes
  useEffect(() => {
    if (apiRef.current) {
      const api = apiRef.current as any;
      if (api._setAuthSuccessCallback) {
        api._setAuthSuccessCallback(handleSuccessfulAuth);
      }
    }
  }, [handleSuccessfulAuth]);

  // On mount, attempt a silent refresh to let the backend re-establish a session from cookies.
  // Run this only once using useEffect and a guard ref to avoid spamming the refresh endpoint.
  const restoreRunRef = useRef(false);
  useEffect(() => {
    if (restoreRunRef.current) return;
    restoreRunRef.current = true;

    if (!user) {
      // Use the api's guarded refresh helper so startup doesn't bypass backoff/cooldown
      try {
        // Check if we have a refreshToken before attempting refresh
        const refreshToken = refreshTokenRef.current;
        let legacy: string | null = null;
        try {
          if (typeof localStorage !== "undefined") {
            legacy = localStorage.getItem("saby:refresh_token");
          }
        } catch (e) {
          // localStorage may be unavailable on some mobile browsers
          if (import.meta.env.DEV) {
            console.debug(
              "[AuthContext] localStorage unavailable for refresh token"
            );
          }
        }

        // Don't attempt refresh if no refreshToken is available - backend requires it
        if (!refreshToken && !legacy) {
          return; // User remains unauthenticated, no refresh token available
        }

        const doRefresh = (apiRef.current as any)?._doRefresh as
          | (() => Promise<any>)
          | undefined;
        if (doRefresh) {
          doRefresh()
            .then((resp) => {
              handleSuccessfulAuth(resp);
            })
            .catch(() => {
              // ignore; user remains unauthenticated
            });
        } else {
          // Fallback: call refresh endpoint directly
          // Include refresh token in body (backend requires it)
          const body = refreshToken
            ? { refreshToken }
            : { refreshToken: legacy };

          apiRef.current
            ?.post(API_ENDPOINTS.REFRESH, body, { withCredentials: true })
            .then((resp) => {
              handleSuccessfulAuth(resp);
            })
            .catch(() => {
              // ignore
            });
        }
      } catch (e) {
        // swallow
      }
    }
  }, [user, handleSuccessfulAuth]);

  const logout = useCallback(() => {
    // Notify backend so it can clear its cookies.
    try {
      const body = refreshTokenRef.current
        ? { refreshToken: refreshTokenRef.current }
        : {};
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
    tokenManagerRef.current.cancelScheduledRefresh();
    sessionSyncRef.current.broadcastLogout();
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
        // Check for mobile-specific issues before attempting login (safely)
        try {
          const mobileIssues = detectMobileLoginIssues();
          if (mobileIssues.isMobile) {
            if (import.meta.env.DEV) {
              console.debug("[AuthContext] Mobile login attempt:", {
                userAgent:
                  typeof navigator !== "undefined"
                    ? navigator.userAgent
                    : "unknown",
                cookieEnabled: mobileIssues.cookiesEnabled,
                localStorageAvailable: mobileIssues.localStorageAvailable,
                issues: mobileIssues.issues,
              });
            }

            // Warn user if there are known issues
            if (mobileIssues.issues.length > 0 && import.meta.env.DEV) {
              console.warn(
                "[AuthContext] Potential mobile login issues detected:",
                mobileIssues.issues
              );
            }
          }
        } catch (mobileCheckError) {
          // If mobile detection fails, continue with login anyway
          if (import.meta.env.DEV) {
            console.warn(
              "[AuthContext] Mobile detection failed, continuing with login:",
              mobileCheckError
            );
          }
        }

        // In cookie-only mode the backend should set HttpOnly cookies on successful login.
        if (import.meta.env.DEV) {
          console.debug("[AuthContext] Attempting login:", {
            endpoint: API_ENDPOINTS.AUTH,
            baseURL: apiRef.current?.defaults?.baseURL,
            fullURL: `${apiRef.current?.defaults?.baseURL || ""}${
              API_ENDPOINTS.AUTH
            }`,
            email: email.substring(0, 3) + "***", // Partial email for logging
          });
        }

        const resp = await apiRef.current!.post(
          API_ENDPOINTS.AUTH,
          { email, password },
          { withCredentials: true }
        );

        // Removed: API key approval error checking
        // API keys are no longer part of authentication flow

        const data = resp.data as any;
        const userResp: User | undefined = data.user ?? data ?? null;

        // Handle successful authentication (schedules proactive refresh, syncs tabs)
        handleSuccessfulAuth(resp);

        setUser(userResp ?? null);

        // API key is stored in IndexedDB (generated on server, saved by admin)
        // No need to fetch from server - key is already available locally

        return userResp ?? ({} as User);
      } catch (err: unknown) {
        // Enhanced error logging for mobile debugging
        const userAgent =
          typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
        const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
        const errorDetails: any = {
          error: err,
          isAxiosError: axios.isAxiosError(err),
          status: axios.isAxiosError(err) ? err.response?.status : undefined,
          message: err instanceof Error ? err.message : String(err),
          isMobile,
          userAgent: userAgent,
          cookieEnabled:
            typeof navigator !== "undefined" ? navigator.cookieEnabled : false,
        };

        if (axios.isAxiosError(err)) {
          errorDetails.responseData = err.response?.data;
          errorDetails.responseHeaders = err.response?.headers;
          // Check for CORS errors which are common on mobile
          if (!err.response && err.request) {
            errorDetails.networkError = true;
            errorDetails.corsIssue = "Possible CORS or network issue";
          }
        }

        console.error("[AuthContext] Login error caught:", errorDetails);
        // Check if error indicates API key approval needed
        if (
          err &&
          typeof err === "object" &&
          ("isApiKeyApprovalNeeded" in err ||
            (axios.isAxiosError(err) &&
              err.response?.data &&
              typeof err.response.data === "object" &&
              "message" in err.response.data &&
              typeof err.response.data.message === "string" &&
              err.response.data.message
                .toLowerCase()
                .includes("pending approval")))
        ) {
          const approvalErr = err as any;
          const errorMessage =
            approvalErr.message ||
            approvalErr.response?.data?.message ||
            "This production API key is pending approval. Please wait for SabyUser approval before using it.";

          console.error(
            "[AuthContext] API key approval required:",
            errorMessage
          );
          throw new Error(errorMessage);
        }

        // Handle rate limit errors
        if (axios.isAxiosError(err) && err.response?.status === 429) {
          const rateLimitError = err as any;
          const rateLimitInfo = rateLimitError.rateLimitInfo;
          const retryAfter =
            rateLimitError.retryAfter ||
            (rateLimitInfo ? getSecondsUntilReset(rateLimitInfo) : 900);

          let errorMessage = "Too many login attempts. ";
          if (retryAfter > 0) {
            const minutes = Math.ceil(retryAfter / 60);
            errorMessage += `Please try again in ${minutes} minute${
              minutes !== 1 ? "s" : ""
            }.`;
          } else {
            errorMessage += "Please try again later.";
          }

          // Store rate limit info for UI display
          const enhancedError: any = new Error(errorMessage);
          enhancedError.isRateLimitError = true;
          enhancedError.retryAfter = retryAfter;
          enhancedError.rateLimitInfo = rateLimitInfo;

          throw enhancedError;
        }

        // Check if error indicates verification needed
        if (err && typeof err === "object" && "isVerificationNeeded" in err) {
          const verificationErr = err as any;
          setVerificationEmail(verificationErr.email || email);
          setVerificationPhoneNumber(
            verificationErr.phoneNumber || verificationErr.phone
          );
          setShowVerificationModal(true);
          throw new Error("Account verification required");
        }

        let message = "Login failed";
        if (axios.isAxiosError(err)) {
          const errorData = err.response?.data as any;
          const errorMessage = errorData?.message || err.message || message;

          // Check if error message indicates API key approval needed
          const approvalKeywords = [
            "pending approval",
            "api key.*pending",
            "wait for.*approval",
            "sabyuser approval",
          ];
          const needsApproval = approvalKeywords.some((keyword) => {
            const regex = new RegExp(keyword, "i");
            return regex.test(errorMessage);
          });

          if (needsApproval) {
            console.error(
              "[AuthContext] API key approval required:",
              errorMessage
            );
            throw new Error(errorMessage);
          }

          // Check if error message indicates verification needed
          const verificationKeywords = [
            "verify",
            "verification",
            "otp",
            "unverified",
            "not verified",
          ];
          const needsVerification = verificationKeywords.some((keyword) =>
            errorMessage.toLowerCase().includes(keyword)
          );

          if (needsVerification) {
            setVerificationEmail(errorData?.email || email);
            setVerificationPhoneNumber(
              errorData?.phoneNumber || errorData?.phone
            );
            setShowVerificationModal(true);
            throw new Error("Account verification required");
          }

          message = errorMessage;
        } else if (err instanceof Error) message = err.message;
        throw new Error(message);
      }
    },
    [handleSuccessfulAuth]
  );

  // Listen for cross-tab events
  useEffect(() => {
    const sessionSync = sessionSyncRef.current;

    // Listen for token refreshes from other tabs
    const unsubRefresh = sessionSync.onRefresh((tokens) => {
      if (tokens.accessToken) {
        setTokenStateSafe(tokens.accessToken);
        // Reschedule proactive refresh if expiration provided
        if (tokens.expiresIn) {
          tokenManagerRef.current.scheduleProactiveRefresh(
            tokens.expiresIn * 1000,
            async () => {
              try {
                const doRefresh = (apiRef.current as any)?._doRefresh as
                  | (() => Promise<any>)
                  | undefined;
                if (doRefresh) {
                  const refreshResp = await doRefresh();
                  handleSuccessfulAuth(refreshResp);
                }
              } catch (error) {
                console.error("[AuthContext] Cross-tab refresh failed:", error);
              }
            }
          );
        }
      }
      if (tokens.refreshToken) {
        refreshTokenRef.current = tokens.refreshToken;
      }
    });

    // Listen for logout from other tabs
    const unsubLogout = sessionSync.onLogout(() => {
      setUser(null);
      setTokenStateSafe(null);
      tokenManagerRef.current.cancelScheduledRefresh();
    });

    return () => {
      unsubRefresh();
      unsubLogout();
    };
  }, [setTokenStateSafe, handleSuccessfulAuth]);

  // Setup visibility-based refresh (refresh when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const timeUntilExpiration =
          tokenManagerRef.current.getTimeUntilExpiration();

        // If token expires in less than 1 minute, refresh now
        if (timeUntilExpiration !== null && timeUntilExpiration < 60000) {
          try {
            const doRefresh = (apiRef.current as any)?._doRefresh as
              | (() => Promise<any>)
              | undefined;
            if (doRefresh) {
              const refreshResp = await doRefresh();
              handleSuccessfulAuth(refreshResp);
            }
          } catch (error) {
            console.error("[AuthContext] Visibility refresh failed:", error);
            // Will fall back to reactive refresh on next 401
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleSuccessfulAuth]);

  // Add debug helpers in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).__authDebug = {
        getToken: () => tokenRef.current,
        getExpiration: () => tokenManagerRef.current.getTimeUntilExpiration(),
        forceRefresh: async () => {
          try {
            const doRefresh = (apiRef.current as any)?._doRefresh as
              | (() => Promise<any>)
              | undefined;
            if (doRefresh) {
              const refreshResp = await doRefresh();
              handleSuccessfulAuth(refreshResp);
              return { success: true, response: refreshResp };
            }
            return { success: false, error: "doRefresh not available" };
          } catch (error) {
            return { success: false, error };
          }
        },
        getRefreshCooldown: () => {
          // This would require exposing cooldown state from api.ts
          return "Check api interceptor state";
        },
      };
    }
  }, [handleSuccessfulAuth]);

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
        showVerificationModal,
        verificationEmail,
        verificationPhoneNumber,
        setShowVerificationModal,
      }}>
      {children}
      <OTPVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        email={verificationEmail}
        phoneNumber={verificationPhoneNumber}
        onVerified={handleVerificationComplete}
      />
    </AuthContext.Provider>
  );
};

// Export types and hook at the end to fix Fast Refresh
export type { User };

/**
 * Custom hook to access auth context
 * Must be used within AuthProvider
 */
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export { useAuth };
