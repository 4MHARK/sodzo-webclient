/**
 * Client-Side Database Service
 *
 * Uses Dexie.js (IndexedDB wrapper) to store:
 * - API keys and configuration
 * - API call logs
 * - Calendar events
 * - Project forms and submissions
 * - Node hierarchy
 * - User cache
 * - Server response cache
 */

import Dexie, { Table } from "dexie";

// ==================== Type Definitions ====================

export interface ApiKey {
  id?: number;
  key: string;
  name?: string;
  environment?: string; // 'production', 'staging', 'development'
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastUsed?: Date;
  syncedAt?: Date; // Last sync with server
}

export interface ApiCall {
  id?: number;
  endpoint: string;
  method: string;
  status: number;
  statusText: string;
  requestBody?: any;
  responseBody?: any;
  timestamp: Date;
  duration?: number;
  error?: string;
  retryCount?: number;
}

export interface ApiConfig {
  id?: number;
  key: string;
  value: any;
  updatedAt: Date;
}

export interface CalendarEvent {
  id?: number;
  serverId?: string; // ID from server
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  type?: string;
  status?: string;
  attendees?: Array<{ userId: string; name: string; status: string }>;
  recurrence?: {
    frequency: string;
    interval: number;
    endDate?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date; // Last sync with server
}

export interface FormElement {
  id: string;
  type: string;
  properties: {
    label?: string;
    placeholder?: string;
    options?: string[];
    required?: boolean;
    validation?: any;
    [key: string]: any;
  };
}

export interface FormSubmission {
  id?: number;
  serverId?: string;
  formId: string;
  values: Record<string, any>;
  submittedAt: Date;
  submittedBy?: string;
  syncedAt?: Date;
}

export interface ProjectForm {
  id?: number;
  serverId?: string; // ID from server
  projectId: string;
  projectName?: string;
  name: string;
  description?: string;
  elements: FormElement[]; // Form structure
  submissions?: FormSubmission[]; // Form submissions
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export interface Node {
  id?: number;
  serverId?: string; // ID from server
  nodeId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  level?: {
    id: string;
    name: string;
  };
  structure?: {
    id: string;
    name: string;
  };
  parent?: string | { id: string; name: string };
  parentId?: string; // For easier queries
  children?: Node[]; // Nested children
  hierarchy?: any; // Full hierarchy data
  profile?: Record<string, any>;
  customFields?: Record<string, any>;
  isMain?: boolean;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export interface CachedUser {
  id?: number;
  serverId: string; // User ID from server
  email: string;
  firstname: string;
  lastname: string;
  avatar?: string;
  roles?: string[];
  profile?: Record<string, any>;
  customFields?: Record<string, any>;
  data: any; // Full user object
  cachedAt: Date;
  syncedAt?: Date;
}

export interface ServerCache {
  id?: number;
  cacheKey: string; // e.g., 'users/123', 'nodes/hierarchy'
  endpoint: string;
  method: string;
  data: any; // Cached response data
  expiresAt?: Date;
  cachedAt: Date;
}

// ==================== Database Class ====================

class AppDatabase extends Dexie {
  // Table declarations
  apiKeys!: Table<ApiKey, number>;
  apiCalls!: Table<ApiCall, number>;
  apiConfig!: Table<ApiConfig, number>;
  calendarEvents!: Table<CalendarEvent, number>;
  projectForms!: Table<ProjectForm, number>;
  nodes!: Table<Node, number>;
  users!: Table<CachedUser, number>;
  serverCache!: Table<ServerCache, number>;

  constructor() {
    super("SabyWebClientDB");

    // Define database schema
    // Note: Boolean fields like isActive cannot be directly indexed in IndexedDB
    // We'll use filter() queries instead of where().equals() for boolean fields
    this.version(1).stores({
      // API Management
      // isActive is not indexed (booleans can't be indexed), use filter() queries
      apiKeys: "++id, key, environment, createdAt, syncedAt",
      apiCalls: "++id, endpoint, method, status, timestamp",
      apiConfig: "++id, key, updatedAt",

      // Calendar & Events
      calendarEvents:
        "++id, serverId, startDate, endDate, type, status, syncedAt",

      // Project Forms
      projectForms: "++id, serverId, projectId, name, syncedAt",

      // Node Hierarchy (with indexes for fast queries)
      // isActive and isMain are not indexed (booleans), use filter() queries
      nodes: "++id, serverId, nodeId, parentId, name, syncedAt",

      // User Cache
      users: "++id, serverId, email, cachedAt, syncedAt",

      // General Server Cache
      serverCache: "++id, cacheKey, endpoint, expiresAt, cachedAt",
    });
  }
}

// ==================== Database Instance ====================

export const db = new AppDatabase();

// ==================== Database Initialization ====================

/**
 * Initialize database and migrate data from localStorage if needed
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Step 1: Open database
    await db.open();

    // Step 2: Migrate API key from localStorage if exists
    if (typeof window !== "undefined") {
      const legacyKey = localStorage.getItem("saby:global_api_key");
      if (legacyKey) {
        // Check if we already have an active key using filter
        const existingKey = await db.apiKeys
          .filter((key) => key.isActive === true)
          .first();

        if (!existingKey) {
          // Migrate to IndexedDB
          await db.apiKeys.add({
            key: legacyKey,
            name: "Migrated from localStorage",
            environment: "production",
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          });

          // Remove from localStorage after migration
          localStorage.removeItem("saby:global_api_key");
          if (import.meta.env.DEV) {
            console.log("[DB] Migrated API key from localStorage to IndexedDB");
          }
        }
      }
    }

    // Step 3: Initialize API key cache AFTER database is ready
    // This ensures cache is populated before any API calls
    try {
      const { getApiKey, updateApiKeyCache } = await import("./apiKeyStorage");
      const apiKey = await getApiKey();
      updateApiKeyCache(apiKey);

      console.log("[DB] ✅ API key cache initialized:", {
        hasKey: !!apiKey,
        keyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : "none",
      });
    } catch (error) {
      console.warn("[DB] ⚠️ Failed to initialize API key cache:", error);
      // Don't throw - app can continue without cache (fallback will handle it)
    }

    if (import.meta.env.DEV) {
      console.log("[DB] Database initialized successfully");
    }
  } catch (error) {
    console.error("[DB] Failed to initialize database:", error);
    throw error;
  }
}

// ==================== Helper Functions ====================

/**
 * Clear all data from database (use with caution)
 */
export async function clearDatabase(): Promise<void> {
  await Promise.all([
    db.apiKeys.clear(),
    db.apiCalls.clear(),
    db.apiConfig.clear(),
    db.calendarEvents.clear(),
    db.projectForms.clear(),
    db.nodes.clear(),
    db.users.clear(),
    db.serverCache.clear(),
  ]);
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<Record<string, number>> {
  return {
    apiKeys: await db.apiKeys.count(),
    apiCalls: await db.apiCalls.count(),
    apiConfig: await db.apiConfig.count(),
    calendarEvents: await db.calendarEvents.count(),
    projectForms: await db.projectForms.count(),
    nodes: await db.nodes.count(),
    users: await db.users.count(),
    serverCache: await db.serverCache.count(),
  };
}
