/**
 * Token Manager - Handles proactive token refresh scheduling
 * Refreshes tokens before they expire to prevent failed requests
 */

export class TokenManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private expirationTime: number | null = null;
  private readonly REFRESH_BUFFER_MS = 30000; // Refresh 30 seconds before expiration

  /**
   * Schedule a proactive token refresh based on expiration time
   */
  scheduleProactiveRefresh(
    expiresInMs: number,
    refreshCallback: () => Promise<void>
  ) {
    // Clear existing timer
    this.cancelScheduledRefresh();

    // Calculate refresh time (expiration - buffer)
    const refreshInMs = Math.max(
      expiresInMs - this.REFRESH_BUFFER_MS,
      1000 // Minimum 1 second
    );

    this.expirationTime = Date.now() + expiresInMs;

    console.debug(
      `[TokenManager] Scheduled refresh in ${Math.round(refreshInMs / 1000)}s`
    );

    this.refreshTimer = setTimeout(async () => {
      try {
        console.debug("[TokenManager] Executing proactive refresh");
        await refreshCallback();
      } catch (error) {
        console.error("[TokenManager] Proactive refresh failed:", error);
        // Will fall back to reactive refresh on next 401
      }
    }, refreshInMs);
  }

  /**
   * Cancel scheduled refresh
   */
  cancelScheduledRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.expirationTime = null;
  }

  /**
   * Get time until expiration (in milliseconds)
   */
  getTimeUntilExpiration(): number | null {
    if (!this.expirationTime) return null;
    return Math.max(0, this.expirationTime - Date.now());
  }

  /**
   * Check if token is expired or will expire soon
   */
  isExpiringSoon(thresholdMs: number = 60000): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration();
    if (timeUntilExpiration === null) return false;
    return timeUntilExpiration < thresholdMs;
  }
}
