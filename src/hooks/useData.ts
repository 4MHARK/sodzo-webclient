import { useState, useEffect, useCallback, useRef } from "react";
import { dataManager, CacheEntry } from "../utils/dataManager";
import { apiClient, RequestConfig } from "../utils/intelligentAPIClient";

export interface UseDataOptions<T> {
  endpoint: string;
  params?: any;
  config?: RequestConfig;
  dependencies?: any[];
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
  isStale: boolean;
  lastUpdated: number | null;
}

// Hook for fetching data with intelligent caching
export function useData<T>(options: UseDataOptions<T>): UseDataResult<T> {
  const {
    endpoint,
    params,
    config,
    dependencies = [],
    enabled = true,
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheKeyRef = useRef<string>("");

  // Generate cache key
  const generateCacheKey = useCallback(() => {
    const paramString = params ? JSON.stringify(params) : "";
    return `${endpoint}:${paramString}`;
  }, [endpoint, params]);

  // Fetch data function
  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const requestConfig: RequestConfig = {
          ...config,
          cache: {
            ...config?.cache,
            forceRefresh,
          },
          signal: abortControllerRef.current.signal,
        };

        const result = await apiClient.get<T>(endpoint, params, requestConfig);

        setData(result);
        setLastUpdated(Date.now());
        setIsStale(false);
        onSuccess?.(result);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err);
          onError?.(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [endpoint, params, config, enabled, onSuccess, onError]
  );

  // Invalidate cache
  const invalidate = useCallback(() => {
    const cacheKey = generateCacheKey();
    dataManager.emit("invalidate_cache", [cacheKey]);
    setIsStale(true);
  }, [generateCacheKey]);

  // Refetch data
  const refetch = useCallback(
    () => fetchData(true),
    [endpoint, params, config, enabled]
  );

  // Initial fetch
  useEffect(() => {
    cacheKeyRef.current = generateCacheKey();
    fetchData();
  }, [endpoint, params, enabled, ...dependencies]);

  // Handle window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (isStale) {
        fetchData(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchOnWindowFocus, isStale, endpoint, params, enabled]);

  // Handle reconnection
  useEffect(() => {
    if (!refetchOnReconnect) return;

    const handleOnline = () => {
      fetchData(true);
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refetchOnReconnect, endpoint, params, enabled]);

  // Listen for cache updates
  useEffect(() => {
    const handleCacheUpdate = (event: { key: string; data: any }) => {
      if (event.key === cacheKeyRef.current) {
        setData(event.data);
        setLastUpdated(Date.now());
        setIsStale(false);
      }
    };

    dataManager.on("cache_set", handleCacheUpdate);
    return () => dataManager.off("cache_set", handleCacheUpdate);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    isStale,
    lastUpdated,
  };
}

// Hook for mutations with optimistic updates
export interface UseMutationOptions<TData, TVariables> {
  endpoint: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  optimistic?: boolean;
  rollbackOnError?: boolean;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  onMutate?: (variables: TVariables) => void;
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

export function useMutation<TData, TVariables = any>(
  options: UseMutationOptions<TData, TVariables>
): UseMutationResult<TData, TVariables> {
  const {
    endpoint,
    method = "POST",
    optimistic = true,
    rollbackOnError = true,
    onSuccess,
    onError,
    onMutate,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setLoading(true);
      setError(null);
      onMutate?.(variables);

      try {
        const requestConfig: RequestConfig = {
          optimistic,
          rollbackOnError,
        };

        let result: TData;

        switch (method) {
          case "POST":
            result = await apiClient.post<TData>(
              endpoint,
              variables,
              requestConfig
            );
            break;
          case "PUT":
            result = await apiClient.put<TData>(
              endpoint,
              variables,
              requestConfig
            );
            break;
          case "PATCH":
            result = await apiClient.patch<TData>(
              endpoint,
              variables,
              requestConfig
            );
            break;
          case "DELETE":
            result = await apiClient.delete<TData>(endpoint, requestConfig);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err: any) {
        setError(err);
        onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      endpoint,
      method,
      optimistic,
      rollbackOnError,
      onSuccess,
      onError,
      onMutate,
    ]
  );

  const mutateAsync = mutate;

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    mutate,
    mutateAsync,
    loading,
    error,
    data,
    reset,
  };
}

// Hook for real-time data synchronization
export interface UseRealtimeOptions<T> {
  endpoint: string;
  params?: any;
  interval?: number;
  enabled?: boolean;
  onUpdate?: (data: T) => void;
}

export function useRealtime<T>(options: UseRealtimeOptions<T>) {
  const {
    endpoint,
    params,
    interval = 30000, // 30 seconds
    enabled = true,
    onUpdate,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncData = useCallback(async () => {
    try {
      const result = await apiClient.get<T>(endpoint, params, {
        cache: { forceRefresh: true },
      });

      setData(result);
      setLastSync(Date.now());
      onUpdate?.(result);
    } catch (error) {
      console.error("Realtime sync failed:", error);
    }
  }, [endpoint, params, onUpdate]);

  useEffect(() => {
    if (!enabled) return;

    // Initial sync
    syncData();

    // Set up interval
    intervalRef.current = setInterval(syncData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, syncData]);

  return {
    data,
    lastSync,
    syncData,
  };
}

// Hook for cache management
export function useCache() {
  const [cacheStats, setCacheStats] = useState(dataManager.getCacheStats());
  const [syncStatus, setSyncStatus] = useState(dataManager.getSyncStatus());

  useEffect(() => {
    const updateStats = () => {
      setCacheStats(dataManager.getCacheStats());
      setSyncStatus(dataManager.getSyncStatus());
    };

    // Update stats periodically
    const interval = setInterval(updateStats, 5000);

    // Listen for cache events
    dataManager.on("cache_set", updateStats);
    dataManager.on("cache_cleared", updateStats);
    dataManager.on("sync_complete", updateStats);

    return () => {
      clearInterval(interval);
      dataManager.off("cache_set", updateStats);
      dataManager.off("cache_cleared", updateStats);
      dataManager.off("sync_complete", updateStats);
    };
  }, []);

  const clearCache = useCallback(() => {
    dataManager.clearCache();
  }, []);

  const forceSync = useCallback(async () => {
    await dataManager.syncData();
  }, []);

  return {
    cacheStats,
    syncStatus,
    clearCache,
    forceSync,
  };
}
