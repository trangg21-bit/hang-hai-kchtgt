/**
 * Resilient extraction from an Axios ApiResponse<T>.
 *
 * The backend wraps every payload in an envelope: { success, message, data, timestamp }.
 * `res.data` (the axios body) is therefore the ENVELOPE, and the real payload lives at
 * `res.data.data`, which may be:
 *   - a plain array        (e.g. List<T> endpoints)
 *   - a Spring Page        ({ content: [...], totalElements, ... })
 *   - a custom search box  ({ results: [...], totalElements, ... })
 *   - a single entity      (getById)
 *
 * These helpers unwrap the envelope first, then normalise the shape, so callers can
 * safely pass `res.data` regardless of which of the above the endpoint returns.
 */

/** Unwrap the ApiResponse envelope { success, message, data, timestamp } -> its `data`. */
function unwrapEnvelope(response: unknown): unknown {
  if (
    response &&
    typeof response === 'object' &&
    !Array.isArray(response) &&
    'data' in (response as Record<string, unknown>) &&
    ('success' in (response as Record<string, unknown>) ||
      'timestamp' in (response as Record<string, unknown>) ||
      'message' in (response as Record<string, unknown>))
  ) {
    return (response as Record<string, unknown>).data;
  }
  return response;
}

/**
 * Extract an array of T from an Axios response body.
 * Handles: envelope, null/undefined, direct array, Spring Page (.content),
 * custom search (.results), and misc (.items/.data).
 */
export function toArray<T>(response: unknown, expectedArrayField?: string): T[] {
  const payload = unwrapEnvelope(response);
  if (!payload) return [];

  // Direct array (e.g. List<T> response)
  if (Array.isArray(payload)) return payload as T[];

  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;

    // Try expected array field first
    if (expectedArrayField && Array.isArray(obj[expectedArrayField])) {
      return obj[expectedArrayField] as T[];
    }

    // Fallback: 'content' = Spring Page, 'results' = custom search box, then misc.
    for (const key of ['content', 'results', 'items', 'data']) {
      if (Array.isArray(obj[key])) {
        return obj[key] as T[];
      }
    }
  }

  return [];
}

/**
 * Safe single-object extraction from an Axios ApiResponse<T>.
 * Returns null when the (unwrapped) payload is nullish or is an array.
 */
export function toSingle<T>(response: unknown): T | null {
  const payload = unwrapEnvelope(response);
  if (!payload) return null;
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as T;
  }
  return null;
}

/**
 * Safe total count extraction from a paginated response.
 * Falls back to defaultTotal when no known field is found.
 */
export function toTotalCount(response: unknown, defaultTotal: number = 0): number {
  const payload = unwrapEnvelope(response);
  if (!payload || typeof payload !== 'object') return defaultTotal;
  const obj = payload as Record<string, unknown>;
  const total = obj.totalElements ?? obj.total ?? obj.itemCount;
  if (typeof total === 'number') return total;
  if (typeof total === 'bigint') return Number(total);
  return defaultTotal;
}
