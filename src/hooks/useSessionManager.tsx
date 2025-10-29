import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { AlertTriangle, Clock } from "lucide-react";

interface SessionManagerOptions {
  warningTimeMinutes?: number; // Time before expiry to show warning
  checkIntervalSeconds?: number; // How often to check token expiry
  enableWarnings?: boolean; // Enable/disable warnings
}

interface TokenInfo {
  exp?: number; // Expiration timestamp
  iat?: number; // Issued at timestamp
  userId?: string;
}

export const useSessionManager = (options: SessionManagerOptions = {}) => {
  const {
    warningTimeMinutes = 5, // Default 5 minutes warning
    checkIntervalSeconds = 30, // Check every 30 seconds
    enableWarnings = true,
  } = options;

  const { token, logout, isAuthenticated } = useAuth();
  const warningShownRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Decode JWT token to get expiration info
  const decodeToken = useCallback((token: string): TokenInfo | null => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.warn("Failed to decode token:", error);
      return null;
    }
  }, []);

  // Calculate time until token expires
  const getTimeUntilExpiry = useCallback(
    (token: string): number | null => {
      const tokenInfo = decodeToken(token);
      if (!tokenInfo?.exp) return null;

      const now = Math.floor(Date.now() / 1000);
      return tokenInfo.exp - now;
    },
    [decodeToken]
  );

  // Show expiry warning
  const showExpiryWarning = useCallback(
    (minutesLeft: number) => {
      if (!enableWarnings || warningShownRef.current) return;

      warningShownRef.current = true;

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-orange-200 dark:border-orange-700`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Session Expiring Soon
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Your session will expire in {minutesLeft} minute
                    {minutesLeft !== 1 ? "s" : ""}. Please save your work and
                    refresh the page to extend your session.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    window.location.reload();
                  }}
                  className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors">
                  Refresh Session
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    logout();
                  }}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>
        ),
        {
          duration: Infinity, // Don't auto-dismiss
          position: "top-center",
        }
      );
    },
    [enableWarnings, logout]
  );

  // Check token expiry
  const checkTokenExpiry = useCallback(() => {
    if (!token || !isAuthenticated) {
      warningShownRef.current = false;
      return;
    }

    const timeUntilExpiry = getTimeUntilExpiry(token);
    if (timeUntilExpiry === null) return;

    const minutesLeft = Math.floor(timeUntilExpiry / 60);

    // Show warning if within warning time
    if (minutesLeft <= warningTimeMinutes && minutesLeft > 0) {
      showExpiryWarning(minutesLeft);
    }

    // Auto-logout if expired
    if (timeUntilExpiry <= 0) {
      console.log("🚨 Token expired - logging out");
      toast.error("Your session has expired. Please log in again.");
      logout();
    }
  }, [
    token,
    isAuthenticated,
    getTimeUntilExpiry,
    warningTimeMinutes,
    showExpiryWarning,
    logout,
  ]);

  // Start/stop session monitoring
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      warningShownRef.current = false;
      return;
    }

    // Initial check
    checkTokenExpiry();

    // Set up interval
    intervalRef.current = setInterval(
      checkTokenExpiry,
      checkIntervalSeconds * 1000
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, token, checkTokenExpiry, checkIntervalSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    checkTokenExpiry,
    getTimeUntilExpiry: token ? () => getTimeUntilExpiry(token) : null,
  };
};

// Hook for components that need to show session status
export const useSessionStatus = () => {
  const { token, isAuthenticated } = useAuth();
  const { getTimeUntilExpiry } = useSessionManager();

  const getSessionInfo = () => {
    if (!token || !isAuthenticated) {
      return { isActive: false, minutesLeft: 0 };
    }

    const timeUntilExpiry = getTimeUntilExpiry?.();
    if (timeUntilExpiry === null) {
      return { isActive: true, minutesLeft: null };
    }

    const minutesLeft = Math.floor(timeUntilExpiry / 60);
    return {
      isActive: timeUntilExpiry > 0,
      minutesLeft: Math.max(0, minutesLeft),
      secondsLeft: Math.max(0, timeUntilExpiry),
    };
  };

  return getSessionInfo();
};

// Component for displaying session status in UI
export const SessionStatusIndicator = () => {
  const sessionInfo = useSessionStatus();

  if (!sessionInfo.isActive) {
    return (
      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
        <Clock className="w-4 h-4" />
        <span className="text-sm">Session Expired</span>
      </div>
    );
  }

  if (sessionInfo.minutesLeft === null) {
    return (
      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
        <Clock className="w-4 h-4" />
        <span className="text-sm">Session Active</span>
      </div>
    );
  }

  const isWarning = sessionInfo.minutesLeft <= 5;
  const colorClass = isWarning
    ? "text-orange-600 dark:text-orange-400"
    : "text-green-600 dark:text-green-400";

  return (
    <div className={`flex items-center space-x-2 ${colorClass}`}>
      <Clock className="w-4 h-4" />
      <span className="text-sm">
        {sessionInfo.minutesLeft > 0
          ? `${sessionInfo.minutesLeft}m left`
          : `${sessionInfo.secondsLeft}s left`}
      </span>
    </div>
  );
};

export default useSessionManager;
