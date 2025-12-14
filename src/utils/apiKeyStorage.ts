/**
 * Global API Key Storage Utility
 *
 * Stores and retrieves API key securely in IndexedDB (via Dexie.js).
 * The API key is stored in a proper database and persists across all sessions.
 * Can sync with server for cross-device access.
 */

import { db, ApiKey } from "./dbService";

/**
 * Save API key to IndexedDB
 * This persists across browser sessions, restarts, and page refreshes
 * Can be synced with server for cross-device access
 */
export async function saveApiKey(
  apiKey: string,
  name?: string,
  environment: string = "production"
): Promise<void> {
  if (!apiKey.trim()) {
    throw new Error("API key cannot be empty");
  }

  try {
    // Ensure database is open
    if (db.isOpen() === false) {
      await db.open();
    }

    // Check if there's an existing API key (active or inactive)
    const existingKeys = await db.apiKeys.toArray();

    if (existingKeys.length > 0) {
      // Find the most recent key (or active key if exists)
      const activeKey = existingKeys.find((key) => key.isActive === true);
      const keyToUpdate = activeKey || existingKeys[0]; // Use active key or first one

      if (keyToUpdate.id) {
        // Update existing key instead of creating new one
        await db.apiKeys.update(keyToUpdate.id, {
          key: apiKey.trim(),
          name: name || keyToUpdate.name || "Default API Key",
          environment: environment,
          updatedAt: new Date(),
          isActive: true,
          lastUsed: new Date(),
        });

        // Delete all other keys (cleanup)
        const keysToDelete = existingKeys.filter(
          (key) => key.id !== keyToUpdate.id
        );
        for (const key of keysToDelete) {
          if (key.id) {
            await db.apiKeys.delete(key.id);
          }
        }

        if (import.meta.env.DEV) {
          console.log(
            "[APIKeyStorage] ✅ API key updated in IndexedDB (replaced existing)"
          );
        }
      }
    } else {
      // No existing keys - create new one
      await db.apiKeys.add({
        key: apiKey.trim(),
        name: name || "Default API Key",
        environment: environment,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        lastUsed: new Date(),
      });

      if (import.meta.env.DEV) {
        console.log(
          "[APIKeyStorage] ✅ API key created in IndexedDB (first key)"
        );
      }
    }

    // Update memory cache immediately
    updateApiKeyCache(apiKey.trim());

    if (import.meta.env.DEV) {
      console.log("[APIKeyStorage] ✅ API key cache updated");
    }
  } catch (error) {
    console.error("[APIKeyStorage] Failed to save API key:", error);
    throw new Error("Failed to save API key to database");
  }
}

/**
 * Get active API key from IndexedDB
 * Returns the currently active API key
 */
export async function getApiKey(): Promise<string | null> {
  try {
    // Ensure database is open
    if (db.isOpen() === false) {
      await db.open();
    }

    // Query for active key - use filter instead of where().equals() for boolean
    const activeKey = await db.apiKeys
      .filter((key) => key.isActive === true)
      .first();

    if (activeKey) {
      // Update last used timestamp
      if (activeKey.id) {
        await db.apiKeys.update(activeKey.id, {
          lastUsed: new Date(),
        });
      }
      return activeKey.key;
    }

    return null;
  } catch (error) {
    console.error("[APIKeyStorage] Failed to get API key:", error);
    // Fallback to localStorage if IndexedDB fails
    if (typeof window !== "undefined") {
      try {
        const legacyKey = localStorage.getItem("saby:global_api_key");
        if (legacyKey) {
          return legacyKey;
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  }
}

/**
 * Get API key synchronously (for use in interceptors)
 * Returns cached key immediately without async overhead
 * Note: This may return null if database isn't ready yet
 */
export function getApiKeySync(): string | null {
  // For synchronous access, we'll use a simple cache
  // The async getApiKey() will update this cache
  if (typeof window !== "undefined") {
    try {
      const cached = (window as any).__apiKeyCache;

      // Debug logging
      if (import.meta.env.DEV) {
        console.debug("[getApiKeySync] Cache check:", {
          hasCache: !!cached,
          cacheValue: cached ? `${cached.substring(0, 10)}...` : "null",
        });
      }

      // Fallback: try localStorage if cache is empty (for migration/backup)
      if (!cached) {
        try {
          const legacyKey = localStorage.getItem("saby:global_api_key");
          if (legacyKey) {
            console.warn("[getApiKeySync] Using legacy localStorage key");
            // Update cache for next time
            (window as any).__apiKeyCache = legacyKey;
            return legacyKey;
          }
        } catch (e) {
          // ignore localStorage errors
        }
      }

      return cached || null;
    } catch (error) {
      console.error("[getApiKeySync] Error:", error);
      return null;
    }
  }
  return null;
}

/**
 * Update the synchronous cache (called after async getApiKey)
 */
export function updateApiKeyCache(key: string | null): void {
  if (typeof window !== "undefined") {
    (window as any).__apiKeyCache = key;
    if (import.meta.env.DEV) {
      console.debug("[updateApiKeyCache] Cache updated:", {
        hasKey: !!key,
        keyPreview: key ? `${key.substring(0, 10)}...` : "null",
      });
    }
  }
}

/**
 * Get all API keys (for management UI)
 */
export async function getAllApiKeys(): Promise<ApiKey[]> {
  try {
    // Ensure database is open
    if (db.isOpen() === false) {
      await db.open();
    }
    return await db.apiKeys.orderBy("createdAt").reverse().toArray();
  } catch (error) {
    console.error("[APIKeyStorage] Failed to get all API keys:", error);
    return [];
  }
}

/**
 * Remove API key from database
 */
export async function removeApiKey(id: number): Promise<void> {
  try {
    await db.apiKeys.delete(id);
    if (import.meta.env.DEV) {
      console.log("[APIKeyStorage] API key removed from database");
    }
  } catch (error) {
    console.error("[APIKeyStorage] Failed to remove API key:", error);
    throw error;
  }
}

/**
 * Check if API key exists
 */
export async function hasApiKey(): Promise<boolean> {
  try {
    const key = await getApiKey();
    return key !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Clear all API keys
 */
export async function clearApiKeys(): Promise<void> {
  try {
    await db.apiKeys.clear();
    updateApiKeyCache(null);
    if (import.meta.env.DEV) {
      console.log("[APIKeyStorage] ✅ All API keys cleared");
    }
  } catch (error) {
    console.error("[APIKeyStorage] Failed to clear API keys:", error);
  }
}

/**
 * Clean up old/inactive API keys (keeps only the active one)
 */
export async function cleanupApiKeys(): Promise<void> {
  try {
    if (db.isOpen() === false) {
      await db.open();
    }

    const allKeys = await db.apiKeys.toArray();
    const activeKey = allKeys.find((key) => key.isActive === true);

    // Delete all keys except the active one
    const keysToDelete = activeKey
      ? allKeys.filter((key) => key.id !== activeKey.id)
      : allKeys;

    for (const key of keysToDelete) {
      if (key.id) {
        await db.apiKeys.delete(key.id);
      }
    }

    if (import.meta.env.DEV && keysToDelete.length > 0) {
      console.log(
        `[APIKeyStorage] ✅ Cleaned up ${keysToDelete.length} old API key(s)`
      );
    }
  } catch (error) {
    console.error("[APIKeyStorage] Failed to cleanup API keys:", error);
  }
}

/**
 * Sync API key from server (DEPRECATED - Not used)
 *
 * NOTE: API keys are generated on the server and saved to IndexedDB by admin.
 * No server fetch is needed - the key is already available locally.
 *
 * This function is kept for potential future use but is not currently called.
 *
 * @deprecated Not used - API key is stored locally in IndexedDB
 */
export async function syncApiKeyFromServer(apiInstance: any): Promise<void> {
  try {
    const response = await apiInstance.get("/user/api-key");
    if (response.data?.apiKey) {
      const serverKey = response.data.apiKey;
      const localKey = await getApiKey();

      // Only update if server key is different
      if (serverKey !== localKey) {
        await saveApiKey(serverKey, "Server Synced", "production");
        // saveApiKey already updates cache, but ensure it's set
        updateApiKeyCache(serverKey);

        console.log(
          "[APIKeyStorage] ✅ API key synced from server (cross-device)",
          {
            keyPreview: `${serverKey.substring(0, 10)}...`,
            wasUpdated: true,
          }
        );
      } else {
        console.log(
          "[APIKeyStorage] ℹ️ Server API key matches local key - no update needed"
        );
      }
    }
  } catch (error: any) {
    // If 404, server doesn't have API key - that's okay
    if (error.response?.status !== 404) {
      console.warn(
        "[APIKeyStorage] ⚠️ Failed to sync API key from server:",
        error
      );
    } else {
      console.log(
        "[APIKeyStorage] ℹ️ Server has no API key (404) - using local key"
      );
    }
  }
}

/**
 * Debug utility to check API key state across all storage layers
 */
export async function debugApiKeyState() {
  const state = {
    cache: null as string | null,
    localStorage: null as string | null,
    indexedDB: null as string | null,
    activeKeys: [] as ApiKey[],
  };

  try {
    state.cache = (window as any).__apiKeyCache || null;
  } catch (e) {
    // ignore
  }

  try {
    state.localStorage = localStorage.getItem("saby:global_api_key");
  } catch (e) {
    // ignore
  }

  try {
    state.indexedDB = await getApiKey();
    state.activeKeys = await getAllApiKeys();
  } catch (e) {
    console.error("[debugApiKeyState] Error:", e);
  }

  console.table({
    Cache: state.cache ? "✅ Set" : "❌ Empty",
    localStorage: state.localStorage ? "✅ Set" : "❌ Empty",
    IndexedDB: state.indexedDB ? "✅ Set" : "❌ Empty",
    "Active Keys Count": state.activeKeys.length,
  });

  return state;
}

// NOTE: Cache initialization moved to initializeDatabase() in dbService.ts
// This ensures database is ready before loading API key into cache
// Module-level initialization caused race conditions
