import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute - Route guard that ensures user is authenticated
 * Redirects to login if not authenticated
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, authState, user, getAccessToken, getRefreshToken } =
    useAuth();
  const location = useLocation();

  // Track navigation and token state
  useEffect(() => {
    const accessToken = getAccessToken ? getAccessToken() : null;
    const refreshToken = getRefreshToken ? getRefreshToken() : null;
    const refreshTokenInStorage = (() => {
      try {
        return typeof window !== "undefined"
          ? localStorage.getItem("saby:refresh_token")
          : null;
      } catch {
        return null;
      }
    })();

    console.log("[🔍 TOKEN TRACK] Navigation to protected route:", {
      path: location.pathname,
      accessToken: {
        exists: !!accessToken,
        value: accessToken ? `${accessToken.substring(0, 20)}...` : null,
      },
      refreshToken: {
        inMemory: {
          exists: !!refreshToken,
          value: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
        },
        inLocalStorage: {
          exists: !!refreshTokenInStorage,
          value: refreshTokenInStorage
            ? `${refreshTokenInStorage.substring(0, 20)}...`
            : null,
        },
      },
      authState,
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
    });
  }, [
    location.pathname,
    authState,
    isAuthenticated,
    user,
    getAccessToken,
    getRefreshToken,
  ]);

  // If session expired or logging out, redirect immediately (highest priority)
  if (authState === "SESSION_EXPIRED" || authState === "LOGGING_OUT") {
    return <Navigate to="/" replace />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Store the attempted location so we can redirect back after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If authenticated but user.id is missing, show loading (user data still loading)
  if (!user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading user data...
          </p>
        </div>
      </div>
    );
  }

  // If refreshing, show loading state
  if (authState === "REFRESHING") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Refreshing session...
          </p>
        </div>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}
