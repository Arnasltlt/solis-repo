/**
 * Safely serializes data to be passed from Server Components to Client Components.
 * Next.js requires data to be serializable when passing from server to client components.
 *
 * This function ensures that:
 * - Dates are converted to ISO strings
 * - Undefined values are converted to null
 * - BigInts are converted to strings
 * - Other objects are deeply cloned to remove custom prototypes
 * - Handles circular references and non-serializable objects gracefully
 *
 * @param data The data to serialize
 * @returns A safely serialized version of the data
 */
export function serializeForClient<T>(data: T): T {
  try {
    // Use a custom replacer function to handle special cases
    const replacer = (key: string, value: any) => {
      // Handle undefined values
      if (value === undefined) {
        return null;
      }

      // Handle BigInt values
      if (typeof value === 'bigint') {
        return value.toString();
      }

      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }

      // Handle functions (convert to null)
      if (typeof value === 'function') {
        return null;
      }

      // Handle symbols (convert to string)
      if (typeof value === 'symbol') {
        return value.toString();
      }

      // Handle objects with circular references
      if (value && typeof value === 'object') {
        // Remove any non-serializable properties
        try {
          // Test if the object is serializable
          JSON.stringify(value);
          return value;
        } catch (e) {
          // If not serializable, return a simplified version
          if (Array.isArray(value)) {
            return value.filter(item => {
              try {
                JSON.stringify(item);
                return true;
              } catch {
                return false;
              }
            });
          } else {
            // For objects, try to extract serializable properties
            const cleanObj: any = {};
            for (const [k, v] of Object.entries(value)) {
              try {
                JSON.stringify(v);
                cleanObj[k] = v;
              } catch {
                // Skip non-serializable properties
                cleanObj[k] = null;
              }
            }
            return cleanObj;
          }
        }
      }

      return value;
    };

    return JSON.parse(JSON.stringify(data, replacer)) as T;
  } catch (error) {
    console.error('Error in serializeForClient:', error);
    // Return a safe fallback
    return {} as T;
  }
}

/**
 * Specialized serializer for Supabase Session objects
 * Since Session objects can contain non-serializable properties or prototypes,
 * this function extracts only the necessary data.
 * 
 * @param session Supabase Session object or null
 * @returns A plain object with session data that can be passed to client components
 */
export function serializeSession(session: any | null) {
  if (!session) return null;
  
  try {
    // Extract only the essential properties we need from the session
    // and ensure all nested values are JSON-serializable primitives
    const safe = {
      access_token: session.access_token ?? null,
      refresh_token: session.refresh_token ?? null,
      expires_at: session.expires_at ?? null,
      expires_in: session.expires_in ?? null,
      token_type: session.token_type ?? null,
      user: session.user ? {
        id: session.user.id ?? null,
        email: session.user.email ?? null,
        role: session.user.role ?? null,
        app_metadata: serializeForClient(session.user.app_metadata ?? {}),
        user_metadata: serializeForClient(session.user.user_metadata ?? {}),
        created_at: session.user.created_at ?? null,
        updated_at: session.user.updated_at ?? null,
      } : null
    }
    return serializeForClient(safe)
  } catch (e) {
    console.error("Error serializing session:", e);
    return null;
  }
} 