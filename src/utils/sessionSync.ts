/**
 * Session Synchronization - Sync auth state across browser tabs
 * Uses BroadcastChannel API for cross-tab communication
 */

export interface SessionSyncEvent {
  type: "TOKEN_REFRESHED" | "LOGOUT" | "LOGIN";
  payload?: {
    accessToken?: string;
    expiresIn?: number; // seconds
    refreshToken?: string;
    user?: any;
  };
  timestamp: number;
}

export class SessionSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: SessionSyncEvent) => void> = new Set();

  constructor(channelName: string = "auth-sync") {
    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(channelName);
      this.channel.onmessage = (event: MessageEvent) => {
        if (event.data && event.data.type) {
          this.listeners.forEach((listener) => listener(event.data));
        }
      };
    } else {
      console.warn(
        "[SessionSync] BroadcastChannel not supported, cross-tab sync disabled"
      );
    }
  }

  /**
   * Broadcast token refresh to other tabs
   */
  broadcastRefresh(tokens: {
    accessToken?: string;
    expiresIn?: number;
    refreshToken?: string;
  }) {
    if (!this.channel) return;

    this.channel.postMessage({
      type: "TOKEN_REFRESHED",
      payload: tokens,
      timestamp: Date.now(),
    } as SessionSyncEvent);
  }

  /**
   * Listen for token refreshes from other tabs
   */
  onRefresh(
    callback: (tokens: {
      accessToken?: string;
      expiresIn?: number;
      refreshToken?: string;
    }) => void
  ): () => void {
    const listener = (event: SessionSyncEvent) => {
      if (event.type === "TOKEN_REFRESHED" && event.payload) {
        callback(event.payload);
      }
    };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Broadcast logout to other tabs
   */
  broadcastLogout() {
    if (!this.channel) return;

    this.channel.postMessage({
      type: "LOGOUT",
      timestamp: Date.now(),
    } as SessionSyncEvent);
  }

  /**
   * Listen for logout from other tabs
   */
  onLogout(callback: () => void): () => void {
    const listener = (event: SessionSyncEvent) => {
      if (event.type === "LOGOUT") {
        callback();
      }
    };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Broadcast login to other tabs
   */
  broadcastLogin(tokens: {
    accessToken?: string;
    expiresIn?: number;
    refreshToken?: string;
    user?: any;
  }) {
    if (!this.channel) return;

    this.channel.postMessage({
      type: "LOGIN",
      payload: tokens,
      timestamp: Date.now(),
    } as SessionSyncEvent);
  }

  /**
   * Listen for login from other tabs
   */
  onLogin(
    callback: (tokens: {
      accessToken?: string;
      expiresIn?: number;
      refreshToken?: string;
      user?: any;
    }) => void
  ): () => void {
    const listener = (event: SessionSyncEvent) => {
      if (event.type === "LOGIN" && event.payload) {
        callback(event.payload);
      }
    };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Close the channel
   */
  close() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}
