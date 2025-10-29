import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { Loader2, Shield, AlertCircle } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactElement;
  fallback?: React.ReactElement;
  redirectTo?: string;
  showLoading?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  fallback,
  redirectTo = "/",
  showLoading = true,
}) => {
  const { user, token } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (showLoading && (user === undefined || token === undefined)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Verifying Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we check your session...
          </p>
        </motion.div>
      </div>
    );
  }

  // If no user or token, redirect to login
  if (!user || !token) {
    // If custom fallback is provided, use it
    if (fallback) {
      return fallback;
    }

    // Default redirect to login with return URL
    return (
      <Navigate to={redirectTo} replace state={{ from: location.pathname }} />
    );
  }

  // User is authenticated, render children
  return children;
};

// Higher-order component version for easier usage
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<RequireAuthProps, "children">
) => {
  const WrappedComponent = (props: P) => (
    <RequireAuth {...options}>
      <Component {...props} />
    </RequireAuth>
  );

  WrappedComponent.displayName = `withAuth(${
    Component.displayName || Component.name
  })`;
  return WrappedComponent;
};

// Error boundary for authentication failures
export const AuthErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactElement;
}> = ({ children, fallback }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes("auth") ||
        event.error?.message?.includes("token")
      ) {
        setHasError(true);
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error with your authentication. Please try logging in
            again.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

// Loading component for authentication checks
export const AuthLoading: React.FC<{ message?: string }> = ({
  message = "Verifying your session...",
}) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      <div className="flex items-center justify-center mb-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {message}
      </h2>
      <div className="flex items-center justify-center space-x-2">
        <Shield className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Securing your session
        </span>
      </div>
    </motion.div>
  </div>
);

export default RequireAuth;
