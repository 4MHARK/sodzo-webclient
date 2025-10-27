import { useState, useCallback } from "react";
import { useData, useMutation, useCache } from "../hooks/useData";
import { useDataContext } from "../contexts/IntelligentContexts";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS } from "../utils/api";
import {
  MetricsDashboard,
  CompactMetricsBar,
} from "../components/MetricsDashboard";
import { RefreshCw, Database, Wifi, Activity } from "lucide-react";

export default function DataManagementTest() {
  const { user: authUser, token } = useAuth();

  // Only enable data fetching when authenticated
  const isAuthenticated = !!(authUser && token);

  const [testEndpoint, setTestEndpoint] = useState(
    isAuthenticated
      ? `${API_ENDPOINTS.USER}/${authUser?.id}`
      : API_ENDPOINTS.USER
  );
  const [testData, setTestData] = useState(
    '{"name": "Test User", "email": "test@example.com"}'
  );

  // Memoized callbacks to prevent infinite re-renders
  const onUserSuccess = useCallback((data: any) => {
    console.log("✅ User data loaded:", data);
  }, []);

  const onUserError = useCallback((error: any) => {
    console.error("❌ User data error:", error);
  }, []);

  const onUpdateSuccess = useCallback((data: any) => {
    console.log("✅ User updated successfully:", data);
  }, []);

  const onUpdateError = useCallback((error: any) => {
    console.error("❌ User update failed:", error);
  }, []);

  // Test data fetching with caching
  const {
    data: userData,
    loading: userLoading,
    error: userError,
    refetch: refetchUser,
    invalidate: invalidateUser,
    isStale: userStale,
    lastUpdated: userLastUpdated,
  } = useData({
    endpoint: testEndpoint,
    config: {
      cache: { ttl: 2 * 60 * 1000 }, // 2 minutes
    },
    enabled: isAuthenticated, // Only fetch when authenticated
    onSuccess: onUserSuccess,
    onError: onUserError,
  });

  // Test mutation with optimistic updates
  const {
    mutate: updateUser,
    loading: updateLoading,
    error: updateError,
  } = useMutation({
    endpoint: isAuthenticated
      ? `${API_ENDPOINTS.USER}/${authUser?.id}`
      : API_ENDPOINTS.USER,
    method: "PATCH",
    optimistic: true,
    rollbackOnError: true,
    onSuccess: onUpdateSuccess,
    onError: onUpdateError,
  });

  // Cache management
  const { cacheStats, syncStatus, clearCache, forceSync } = useCache();
  const { isOnline, getMetrics } = useDataContext();

  const handleTestFetch = () => {
    refetchUser();
  };

  const handleTestUpdate = () => {
    try {
      const updateData = JSON.parse(testData);
      updateUser(updateData);
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };

  const handleTestInvalidate = () => {
    invalidateUser();
  };

  const handleTestMetrics = () => {
    const metrics = getMetrics();
    console.log("📊 Current Metrics:", metrics);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🚀 Intelligent Data Management Test
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Test the Redis-like caching, optimistic updates, and offline
              support
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <CompactMetricsBar />
          </div>
        </div>
      </div>

      {/* Authentication Status */}
      {!isAuthenticated && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Authentication Required
            </span>
          </div>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
            Please log in to test the intelligent data management system. API
            calls are disabled when not authenticated.
          </p>
        </div>
      )}

      {/* Quick Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cache
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {cacheStats.size}/{cacheStats.maxSize}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round((cacheStats.size / cacheStats.maxSize) * 100)}% used
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <Wifi
              className={`w-5 h-5 ${
                isOnline ? "text-green-600" : "text-red-600"
              }`}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Network
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {isOnline ? "Online" : "Offline"}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {syncStatus.pendingOperations} pending ops
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sync
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {syncStatus.lastSync
              ? `${Math.round((Date.now() - syncStatus.lastSync) / 1000)}s`
              : "Never"}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last sync
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw
              className={`w-5 h-5 ${
                userStale ? "text-yellow-600" : "text-green-600"
              }`}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Data
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {userStale ? "Stale" : "Fresh"}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {userLastUpdated
              ? `${Math.round((Date.now() - userLastUpdated) / 1000)}s ago`
              : "Never"}
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🧪 Test Controls
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Fetching Tests */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Data Fetching Tests
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Endpoint
              </label>
              <input
                type="text"
                value={testEndpoint}
                onChange={(e) => setTestEndpoint(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder={API_ENDPOINTS.USER}
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleTestFetch}
                disabled={userLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${
                    userLoading ? "animate-spin" : ""
                  }`}
                />
                {userLoading ? "Loading..." : "Fetch Data"}
              </button>

              <button
                onClick={handleTestInvalidate}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                Invalidate Cache
              </button>
            </div>

            {userError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  Error: {userError.message}
                </p>
              </div>
            )}

            {userData && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-sm font-medium mb-2">
                  ✅ Data loaded successfully
                </p>
                <pre className="text-xs text-green-700 dark:text-green-300 overflow-auto">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Mutation Tests */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Mutation Tests
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Data (JSON)
              </label>
              <textarea
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder='{"name": "Updated User", "email": "updated@example.com"}'
              />
            </div>

            <button
              onClick={handleTestUpdate}
              disabled={updateLoading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors">
              <RefreshCw
                className={`w-4 h-4 mr-2 ${
                  updateLoading ? "animate-spin" : ""
                }`}
              />
              {updateLoading ? "Updating..." : "Test Optimistic Update"}
            </button>

            {updateError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  Update Error: {updateError.message}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Utility Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleTestMetrics}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              📊 Log Metrics to Console
            </button>

            <button
              onClick={forceSync}
              disabled={!isOnline}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors">
              🔄 Force Sync
            </button>

            <button
              onClick={clearCache}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              🗑️ Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <MetricsDashboard />

      {/* Console Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          🖥️ Console Testing
        </h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
          Open your browser's developer console to see detailed logs and test
          the data management system:
        </p>
        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p>
            • <code>window.dataManager.getCacheStats()</code> - View cache
            statistics
          </p>
          <p>
            • <code>window.dataManager.syncData()</code> - Force data
            synchronization
          </p>
          <p>
            • <code>window.dataManager.clearCache()</code> - Clear all cached
            data
          </p>
          <p>
            • <code>window.apiClient.getMetrics()</code> - View API client
            metrics
          </p>
        </div>
      </div>
    </div>
  );
}
