/**
 * Token Utilities - Extract token expiration and other info
 */

/**
 * Extract expiration time from API response
 * Supports multiple response formats
 */
export function extractExpirationFromResponse(response: any): number | null {
  // Try to get expiration from response (in seconds)
  const expiresIn =
    response?.data?.expiresIn ||
    response?.data?.access?.expires ||
    response?.data?.tokens?.access?.expires ||
    response?.data?.expires_in ||
    null;

  if (expiresIn) {
    return typeof expiresIn === "string" ? parseInt(expiresIn) : expiresIn;
  }

  // Try to extract from JWT token if provided
  const token =
    response?.data?.access?.token ||
    response?.data?.tokens?.access?.token ||
    response?.data?.access_token ||
    response?.data?.token ||
    null;

  if (token) {
    return extractExpirationFromJWT(token);
  }

  return null;
}

/**
 * Extract expiration time from JWT token
 * Returns seconds until expiration, or null if not found/invalid
 */
export function extractExpirationFromJWT(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      // Not a valid JWT format
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;
      const secondsUntilExpiration = expirationTime - now;

      // Return null if already expired
      return secondsUntilExpiration > 0 ? secondsUntilExpiration : null;
    }
  } catch (e) {
    // Invalid JWT or parsing error
    console.debug("[TokenUtils] Failed to parse JWT:", e);
  }

  return null;
}

/**
 * Check if a JWT token is expired
 */
export function isJWTExpired(token: string): boolean {
  const expiration = extractExpirationFromJWT(token);
  return expiration === null || expiration <= 0;
}
