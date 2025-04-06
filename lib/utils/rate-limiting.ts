/**
 * Simple client-side rate limiting utility
 * 
 * This provides a basic rate limiting mechanism to prevent excessive API calls
 * from the client side. For production, this should be supplemented with
 * server-side rate limiting as well.
 */

type RateLimitOptions = {
  /** Maximum number of calls allowed in the time window */
  maxCalls: number;
  /** Time window in milliseconds */
  timeWindow: number;
  /** Optional storage key prefix */
  keyPrefix?: string;
}

// Default options
const DEFAULT_OPTIONS: RateLimitOptions = {
  maxCalls: 5,
  timeWindow: 60000, // 1 minute
  keyPrefix: 'rate_limit_'
}

/**
 * Checks if a function call would exceed the rate limit
 * 
 * @param key Unique identifier for the rate limited function
 * @param options Rate limiting options
 * @returns Boolean indicating if the call is allowed
 */
export function isRateLimited(key: string, options: Partial<RateLimitOptions> = {}): boolean {
  // Only run in browser environment
  if (typeof window === 'undefined') return false;
  
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const storageKey = `${opts.keyPrefix}${key}`;
  
  try {
    // Get current rate limit data
    const stored = localStorage.getItem(storageKey);
    const now = Date.now();
    
    if (!stored) {
      // First call, initialize rate limit data
      const data = {
        calls: 1,
        timestamp: now
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
      return false;
    }
    
    // Parse stored data
    const data = JSON.parse(stored);
    
    // Check if time window has passed
    if (now - data.timestamp > opts.timeWindow) {
      // Reset counter for new time window
      const newData = {
        calls: 1,
        timestamp: now
      };
      localStorage.setItem(storageKey, JSON.stringify(newData));
      return false;
    }
    
    // If already at max calls, rate limit is exceeded
    if (data.calls >= opts.maxCalls) {
      return true;
    }
    
    // Increment call counter
    data.calls += 1;
    localStorage.setItem(storageKey, JSON.stringify(data));
    return false;
    
  } catch (error) {
    // If any error occurs, default to not rate limiting
    console.error('Rate limiting error:', error);
    return false;
  }
}

/**
 * Creates a rate-limited version of a function
 * 
 * @param fn Function to rate limit
 * @param key Unique identifier for the rate limited function
 * @param options Rate limiting options
 * @param onLimitExceeded Callback when rate limit is exceeded
 * @returns Rate limited function
 */
export function rateLimit<T extends (...args: any[]) => any>(
  fn: T,
  key: string,
  options: Partial<RateLimitOptions> = {},
  onLimitExceeded?: () => void
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    if (isRateLimited(key, options)) {
      if (onLimitExceeded) {
        onLimitExceeded();
      }
      return undefined;
    }
    
    return fn(...args);
  };
}