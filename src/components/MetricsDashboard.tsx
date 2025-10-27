import React, { useState, useEffect } from "react";
import {
  Activity,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useDataContext } from "../contexts/IntelligentContexts";

interface MetricsDashboardProps {
  className?: string;
}

export function MetricsDashboard({ className = "" }: MetricsDashboardProps) {
  const {
    cacheStats,
    syncStatus,
    isOnline,
    getMetrics,
    clearCache,
    forceSync,
  } = useDataContext();
  const [metrics, setMetrics] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, [getMetrics]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-600";
      case "offline":
        return "text-red-600";
      case "syncing":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "offline":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "syncing":
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Data Management Metrics
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <Activity
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Cache Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cache
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {cacheStats.size}/{cacheStats.maxSize}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round((cacheStats.size / cacheStats.maxSize) * 100)}% used
            </div>
          </div>

          {/* Network Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Network
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {isOnline ? "Online" : "Offline"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {metrics?.network?.connectionType || "Unknown"}
            </div>
          </div>

          {/* Sync Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(syncStatus.isOnline ? "online" : "offline")}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sync
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {syncStatus.pendingOperations}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              pending operations
            </div>
          </div>

          {/* Last Sync */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Sync
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {syncStatus.lastSync ? formatTime(syncStatus.lastSync) : "Never"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {syncStatus.lastSync
                ? `${Math.round(
                    (Date.now() - syncStatus.lastSync) / 1000
                  )}s ago`
                : "No sync"}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={forceSync}
              disabled={!isOnline}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
              <RefreshCw className="w-4 h-4 mr-2" />
              Force Sync
            </button>
            <button
              onClick={clearCache}
              className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {metrics?.api?.queuedRequests || 0} queued requests
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-4">
            {/* Cache Details */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Cache Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Size:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {cacheStats.size} entries
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Max Size:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {cacheStats.maxSize} entries
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Pending Ops:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {cacheStats.pendingOperations}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Last Sync:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {cacheStats.lastSync
                      ? formatTime(cacheStats.lastSync)
                      : "Never"}
                  </span>
                </div>
              </div>
            </div>

            {/* Network Details */}
            {metrics?.network && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Network Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Connection:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {metrics.network.connectionType || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Downlink:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {metrics.network.downlink
                        ? `${metrics.network.downlink} Mbps`
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* API Metrics */}
            {metrics?.api && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  API Metrics
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Queued Requests:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {metrics.api.queuedRequests}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Cache Hit Rate:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {metrics.api.cacheHitRate
                        ? `${metrics.api.cacheHitRate}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for status bar
export function CompactMetricsBar() {
  const { cacheStats, syncStatus, isOnline } = useDataContext();

  return (
    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex items-center space-x-1">
        <Database className="w-3 h-3" />
        <span>
          {cacheStats.size}/{cacheStats.maxSize}
        </span>
      </div>
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Wifi className="w-3 h-3 text-green-600" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-600" />
        )}
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>
      <div className="flex items-center space-x-1">
        <RefreshCw className="w-3 h-3" />
        <span>{syncStatus.pendingOperations}</span>
      </div>
    </div>
  );
}
