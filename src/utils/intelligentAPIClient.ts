import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { dataManager, DataOperation } from "./dataManager";

export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  enableCaching: boolean;
  enableOfflineMode: boolean;
  retryAttempts: number;
  retryDelay: number;
  useMainAPI?: boolean; // Flag to indicate if using main API instance
}

export interface CacheConfig {
  ttl?: number;
  forceRefresh?: boolean;
  dependencies?: string[];
}

export interface RequestConfig extends AxiosRequestConfig {
  cache?: CacheConfig;
  optimistic?: boolean;
  rollbackOnError?: boolean;
}

export class IntelligentAPIClient {
  private axiosInstance: AxiosInstance;
  private config: APIClientConfig;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private authToken: string | null = null;

  constructor(config: APIClientConfig, apiInstance?: AxiosInstance) {
    this.config = config;

    // Use provided API instance (with refresh logic) or create a basic one
    if (apiInstance) {
      this.axiosInstance = apiInstance;
      this.config.useMainAPI = true; // Mark that we're using the main API instance
    } else {
      this.axiosInstance = axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout,
        headers: {
          "Content-Type": "application/json",
        },
      });
      this.config.useMainAPI = false; // Mark that we're using our own instance
    }

    this.setupInterceptors();
    this.setupDataManagerIntegration();
  }

  // Method to set the authentication token
  setAuthToken(token: string | null) {
    this.authToken = token;
    console.log(
      "🔑 API Client token updated:",
      token ? `${token.substring(0, 20)}...` : "null"
    );
  }

  private setupInterceptors() {
    // Request interceptor - only add monitoring, not auth tokens
    // Auth tokens are handled by the main API instance when provided
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add request timestamp for monitoring
        (config as any).requestStartTime = Date.now();

        // Only log if we're not using the main API instance (which handles auth automatically)
        if (!this.config.useMainAPI) {
          if (this.authToken) {
            config.headers.Authorization = `Bearer ${this.authToken}`;
            console.log(
              "🔐 Adding authorization header to request:",
              config.url
            );
          } else {
            console.log("⚠️ No auth token available for request:", config.url);
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const requestTime =
          Date.now() - (response.config as any).requestStartTime;

        // Emit metrics
        dataManager.emit("api_metrics", {
          endpoint: response.config.url,
          method: response.config.method,
          status: response.status,
          requestTime,
          dataSize: JSON.stringify(response.data).length,
        });

        return response;
      },
      (error) => {
        const requestTime =
          Date.now() - (error.config as any)?.requestStartTime;

        dataManager.emit("api_error", {
          endpoint: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          requestTime,
          error: error.message,
        });

        return Promise.reject(error);
      }
    );
  }

  private setupDataManagerIntegration() {
    // Listen for operation execution requests
    dataManager.on("execute_operation", async (operation: DataOperation) => {
      await this.executeQueuedOperation(operation);
    });

    // Listen for cache invalidation requests
    dataManager.on("invalidate_cache", (keys: string[]) => {
      keys.forEach((key) => {
        const [endpoint] = key.split(":");
        this.invalidateCacheForEndpoint(endpoint);
      });
    });
  }

  // GET request with intelligent caching
  async get<T>(
    endpoint: string,
    params?: any,
    config?: RequestConfig
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(endpoint, params);

    // Check if request is already in progress (deduplication)
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    const requestPromise = this.executeRequest<T>(
      "GET",
      endpoint,
      params,
      config
    );
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  // POST request with optimistic updates
  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.executeRequest<T>("POST", endpoint, data, config);
  }

  // PUT request with optimistic updates
  async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.executeRequest<T>("PUT", endpoint, data, config);
  }

  // PATCH request with optimistic updates
  async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.executeRequest<T>("PATCH", endpoint, data, config);
  }

  // DELETE request with optimistic updates
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.executeRequest<T>("DELETE", endpoint, undefined, config);
  }

  // Core request execution method
  private async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    const cacheConfig = config?.cache;
    const isReadOperation = method === "GET";

    // For GET requests, try cache first
    if (isReadOperation && this.config.enableCaching) {
      try {
        const cachedData = await dataManager.get<T>(endpoint, data, {
          ttl: cacheConfig?.ttl,
          forceRefresh: cacheConfig?.forceRefresh,
          apiCall: () => this.makeAPICall<T>(method, endpoint, data, config),
        });
        return cachedData;
      } catch (error) {
        // If cache fails, fall through to API call
        console.warn("Cache retrieval failed, falling back to API:", error);
      }
    }

    // Make API call
    return this.makeAPICall<T>(method, endpoint, data, config);
  }

  // Make actual API call
  private async makeAPICall<T>(
    method: string,
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    const axiosConfig: AxiosRequestConfig = {
      ...config,
      method: method.toLowerCase() as any,
      url: endpoint,
      data: method !== "GET" ? data : undefined,
      params: method === "GET" ? data : undefined,
    };

    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request(
        axiosConfig
      );

      // Cache successful responses
      if (this.config.enableCaching && method === "GET") {
        const cacheKey = this.generateCacheKey(endpoint, data);
        dataManager.setCache(cacheKey, response.data, config?.cache?.ttl);
      }

      return response.data;
    } catch (error) {
      // Handle offline mode
      if (!navigator.onLine && this.config.enableOfflineMode) {
        throw new Error(
          "Network unavailable. Operation queued for later sync."
        );
      }

      throw error;
    }
  }

  // Execute queued operations (for offline sync)
  private async executeQueuedOperation(
    operation: DataOperation
  ): Promise<void> {
    try {
      switch (operation.type) {
        case "CREATE":
          await this.post(operation.endpoint, operation.data);
          break;
        case "UPDATE":
          await this.put(operation.endpoint, operation.data);
          break;
        case "DELETE":
          await this.delete(operation.endpoint);
          break;
        default:
          console.warn("Unknown operation type:", operation.type);
      }
    } catch (error) {
      throw new Error(`Failed to execute operation ${operation.id}: ${error}`);
    }
  }

  // Generate cache key
  private generateCacheKey(endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : "";
    return `${endpoint}:${paramString}`;
  }

  // Invalidate cache for specific endpoint
  private invalidateCacheForEndpoint(endpoint: string): void {
    // This would need to be implemented based on your cache structure
    // For now, we'll emit an event that can be handled by the data manager
    dataManager.emit("invalidate_endpoint", endpoint);
  }

  // Batch requests for efficiency
  async batch<T>(
    requests: Array<{
      method: string;
      endpoint: string;
      data?: any;
      config?: RequestConfig;
    }>
  ): Promise<T[]> {
    const promises = requests.map((req) =>
      this.executeRequest<T>(req.method, req.endpoint, req.data, req.config)
    );

    return Promise.all(promises);
  }

  // Get request metrics
  getMetrics() {
    return {
      queuedRequests: this.requestQueue.size,
      cacheStats: dataManager.getCacheStats(),
      syncStatus: dataManager.getSyncStatus(),
    };
  }

  // Clear all caches
  clearCache(): void {
    dataManager.clearCache();
  }

  // Force sync all pending operations
  async forceSync(): Promise<void> {
    await dataManager.syncData();
  }
}

// Factory function to create API client instances
export function createAPIClient(
  config: Partial<APIClientConfig> = {},
  apiInstance?: AxiosInstance
): IntelligentAPIClient {
  const defaultConfig: APIClientConfig = {
    baseURL: import.meta.env.VITE_API_BASE || "/v1",
    timeout: 10000,
    enableCaching: true,
    enableOfflineMode: true,
    retryAttempts: 3,
    retryDelay: 1000,
    ...config,
  };

  return new IntelligentAPIClient(defaultConfig, apiInstance);
}

// Default API client instance
export const apiClient = createAPIClient();

// Expose to window for debugging in development
if (import.meta.env.DEV) {
  (window as any).apiClient = apiClient;
}
