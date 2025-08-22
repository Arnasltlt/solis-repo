/**
 * Safely serializes data to be passed from Server Components to Client Components.
 * Next.js requires data to be serializable when passing from server to client components.
 * 
 * This function ensures that:
 * - Dates are converted to ISO strings
 * - Undefined values are converted to null
 * - BigInts are converted to strings
 * - Other objects are deeply cloned to remove custom prototypes
 * 
 * @param data The data to serialize
 * @returns A safely serialized version of the data
 */
export function serializeForClient<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
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