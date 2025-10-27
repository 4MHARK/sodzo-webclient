// Simple EventEmitter implementation for browser
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((l) => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach((listener) => listener(...args));
  }

  removeAllListeners() {
    this.events = {};
  }
}

// Types for our data management system
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: number;
  lastModified: number;
  etag?: string;
  dependencies?: string[]; // Related cache keys
}

export interface DataOperation {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE" | "READ";
  endpoint: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: "high" | "medium" | "low";
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingOperations: number;
  conflicts: DataOperation[];
}

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  enablePersistence: boolean;
  enableOfflineMode: boolean;
  syncInterval: number;
  retryDelay: number;
  maxRetries: number;
}

// Default configuration
const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Maximum number of cache entries
  enablePersistence: true,
  enableOfflineMode: true,
  syncInterval: 30 * 1000, // 30 seconds
  retryDelay: 1000, // 1 second
  maxRetries: 3,
};

export class DataManager extends EventEmitter {
  private cache = new Map<string, CacheEntry>();
  private operationQueue: DataOperation[] = [];
  private syncStatus: SyncStatus;
  private config: CacheConfig;
  private isOnline = navigator.onLine;
  private syncTimer?: NodeJS.Timeout;
  private persistenceKey = "sodzo_data_cache";

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.syncStatus = {
      isOnline: this.isOnline,
      lastSync: Date.now(),
      pendingOperations: 0,
      conflicts: [],
    };

    this.initializeEventListeners();
    this.loadFromPersistence();
    this.startSyncTimer();
  }

  // Initialize event listeners for online/offline status
  private initializeEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncStatus.isOnline = true;
      this.emit("online");
      this.processPendingOperations();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.syncStatus.isOnline = false;
      this.emit("offline");
    });

    // Listen for visibility changes to sync when tab becomes active
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.isOnline) {
        this.syncData();
      }
    });
  }

  // Load cached data from localStorage
  private loadFromPersistence() {
    if (!this.config.enablePersistence) return;

    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data.cache || []);
        this.operationQueue = data.operationQueue || [];
        this.syncStatus = { ...this.syncStatus, ...data.syncStatus };
      }
    } catch (error) {
      console.warn("Failed to load cached data:", error);
    }
  }

  // Save data to localStorage
  private saveToPersistence() {
    if (!this.config.enablePersistence) return;

    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        operationQueue: this.operationQueue,
        syncStatus: this.syncStatus,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.persistenceKey, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save cached data:", error);
    }
  }

  // Generate cache key from endpoint and parameters
  private generateCacheKey(endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : "";
    return `${endpoint}:${paramString}`;
  }

  // Check if cache entry is valid
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Clean expired cache entries
  private cleanExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Manage cache size
  private manageCacheSize() {
    if (this.cache.size <= this.config.maxSize) return;

    // Remove oldest entries
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, this.cache.size - this.config.maxSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  // Get data from cache or API
  async get<T>(
    endpoint: string,
    params?: any,
    options?: {
      ttl?: number;
      forceRefresh?: boolean;
      apiCall?: () => Promise<T>;
    }
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(endpoint, params);
    const cached = this.cache.get(cacheKey);

    // Return cached data if valid and not forcing refresh
    if (cached && this.isCacheValid(cached) && !options?.forceRefresh) {
      this.emit("cache_hit", { key: cacheKey, endpoint });
      return cached.data;
    }

    // Make API call if provided
    if (options?.apiCall) {
      try {
        this.emit("api_call_start", { endpoint, params });
        const data = await options.apiCall();

        // Cache the result
        this.setCache(cacheKey, data, options.ttl);
        this.emit("api_call_success", { endpoint, params, data });

        return data;
      } catch (error) {
        this.emit("api_call_error", { endpoint, params, error });

        // Return stale data if available
        if (cached) {
          this.emit("stale_data_used", { key: cacheKey, endpoint });
          return cached.data;
        }

        throw error;
      }
    }

    // If no API call provided and no cached data, throw error
    throw new Error(`No cached data and no API call provided for ${endpoint}`);
  }

  // Set data in cache
  setCache<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      version: 1,
      lastModified: Date.now(),
    };

    this.cache.set(key, entry);
    this.manageCacheSize();
    this.saveToPersistence();

    this.emit("cache_set", { key, data });
  }

  // Update data with optimistic updates
  async update<T>(
    endpoint: string,
    data: T,
    options?: {
      optimistic?: boolean;
      rollbackOnError?: boolean;
      apiCall?: (data: T) => Promise<T>;
    }
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(endpoint);
    const originalData = this.cache.get(cacheKey)?.data;

    // Optimistic update
    if (options?.optimistic !== false) {
      this.setCache(cacheKey, data);
      this.emit("optimistic_update", { key: cacheKey, data });
    }

    // Queue API operation
    const operation: DataOperation = {
      id: `${endpoint}_${Date.now()}`,
      type: "UPDATE",
      endpoint,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      priority: "high",
    };

    this.addToQueue(operation);

    // Make API call if online
    if (this.isOnline && options?.apiCall) {
      try {
        const result = await options.apiCall(data);
        this.setCache(cacheKey, result);
        this.removeFromQueue(operation.id);
        this.emit("update_success", { key: cacheKey, data: result });
        return result;
      } catch (error) {
        // Rollback on error
        if (options?.rollbackOnError !== false && originalData) {
          this.setCache(cacheKey, originalData);
          this.emit("rollback", { key: cacheKey, originalData });
        }
        throw error;
      }
    }

    return data;
  }

  // Delete data with optimistic updates
  async delete(
    endpoint: string,
    options?: {
      optimistic?: boolean;
      rollbackOnError?: boolean;
      apiCall?: () => Promise<void>;
    }
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(endpoint);
    const originalData = this.cache.get(cacheKey)?.data;

    // Optimistic delete
    if (options?.optimistic !== false) {
      this.cache.delete(cacheKey);
      this.emit("optimistic_delete", { key: cacheKey });
    }

    // Queue API operation
    const operation: DataOperation = {
      id: `${endpoint}_${Date.now()}`,
      type: "DELETE",
      endpoint,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      priority: "high",
    };

    this.addToQueue(operation);

    // Make API call if online
    if (this.isOnline && options?.apiCall) {
      try {
        await options.apiCall();
        this.removeFromQueue(operation.id);
        this.emit("delete_success", { key: cacheKey });
      } catch (error) {
        // Rollback on error
        if (options?.rollbackOnError !== false && originalData) {
          this.setCache(cacheKey, originalData);
          this.emit("rollback", { key: cacheKey, originalData });
        }
        throw error;
      }
    }
  }

  // Add operation to queue
  private addToQueue(operation: DataOperation): void {
    this.operationQueue.push(operation);
    this.syncStatus.pendingOperations = this.operationQueue.length;
    this.saveToPersistence();
  }

  // Remove operation from queue
  private removeFromQueue(operationId: string): void {
    this.operationQueue = this.operationQueue.filter(
      (op) => op.id !== operationId
    );
    this.syncStatus.pendingOperations = this.operationQueue.length;
    this.saveToPersistence();
  }

  // Process pending operations
  private async processPendingOperations(): Promise<void> {
    if (!this.isOnline || this.operationQueue.length === 0) return;

    const operations = [...this.operationQueue];
    this.operationQueue = [];

    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        this.emit("operation_success", operation);
      } catch (error) {
        if (operation.retryCount < operation.maxRetries) {
          operation.retryCount++;
          this.operationQueue.push(operation);
          this.emit("operation_retry", { operation, error });
        } else {
          this.emit("operation_failed", { operation, error });
        }
      }
    }

    this.syncStatus.pendingOperations = this.operationQueue.length;
    this.saveToPersistence();
  }

  // Execute a single operation
  private async executeOperation(operation: DataOperation): Promise<void> {
    // This would be implemented based on your specific API structure
    // For now, we'll emit an event that can be handled by the API layer
    this.emit("execute_operation", operation);
  }

  // Start sync timer
  private startSyncTimer(): void {
    if (this.syncTimer) clearInterval(this.syncTimer);

    this.syncTimer = setInterval(() => {
      if (this.isOnline) {
        this.syncData();
      }
    }, this.config.syncInterval);
  }

  // Sync data with server
  async syncData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      this.cleanExpiredCache();
      await this.processPendingOperations();
      this.syncStatus.lastSync = Date.now();
      this.emit("sync_complete");
    } catch (error) {
      this.emit("sync_error", error);
    }
  }

  // Clear all cached data
  clearCache(): void {
    this.cache.clear();
    this.operationQueue = [];
    this.syncStatus.pendingOperations = 0;
    this.saveToPersistence();
    this.emit("cache_cleared");
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      pendingOperations: this.operationQueue.length,
      lastSync: this.syncStatus.lastSync,
      isOnline: this.isOnline,
    };
  }

  // Get sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Destroy the data manager
  destroy(): void {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.removeAllListeners();
    this.saveToPersistence();
  }
}

// Singleton instance
export const dataManager = new DataManager();

// Expose to window for debugging in development
if (import.meta.env.DEV) {
  (window as any).dataManager = dataManager;
}
