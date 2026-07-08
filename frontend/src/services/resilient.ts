/**
 * Resilient extraction from Axios ApiResponse<T>.
 * Handles: backend null, missing .data, wrong shape (object vs array).
 */

/**
 * Extract an array of T from an Axios response body.
 * Handles: null/undefined, direct array, object with known array fields.
 */
export function toArray<T>(response: unknown, expectedArrayField?: string): T[] {
  if (!response) return [];

  // Direct array (e.g. list response)
  if (Array.isArray(response)) return response as T[];

  // Object with known field (e.g. { results: [], totalElements: 0 })
  if (typeof response === 'object') {
    const obj = response as Record<string, unknown>;

    // Try expected array field first
    if (expectedArrayField && Array.isArray(obj[expectedArrayField])) {
      return obj[expectedArrayField] as T[];
    }

    // Try common array fields at this level (except 'data' to avoid wrong extraction if data is wrapper)
    for (const key of ['results', 'items', 'content']) {
      if (Array.isArray(obj[key])) {
        return obj[key] as T[];
      }
    }

    // If 'data' is an array, return it
    if (Array.isArray(obj['data'])) {
      return obj['data'] as T[];
    }

    // If 'data' is an object wrapper, recursively search inside it
    if (obj['data'] && typeof obj['data'] === 'object') {
      return toArray<T>(obj['data'], expectedArrayField);
    }
  }

  return [];
}

/**
 * Safe single-object extraction from Axios ApiResponse<T>.
 * Returns null when response is nullish or is an array.
 */
export function toSingle<T>(response: unknown): T | null {
  if (!response) return null;
  
  if (typeof response === 'object' && !Array.isArray(response)) {
    const obj = response as Record<string, unknown>;
    // If it's a wrapper, try to extract from 'data' field
    if ('success' in obj && 'data' in obj && obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return obj.data as T;
    }
    return response as T;
  }
  return null;
}

/**
 * Safe total count extraction from paginated response.
 * Falls back to defaultTotal when no known field is found.
 */
export function toTotalCount(response: unknown, defaultTotal: number = 0): number {
  if (!response) return defaultTotal;

  // If it's a direct array, the total count is its length
  if (Array.isArray(response)) {
    return response.length;
  }

  if (typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    const total = obj.totalElements ?? obj.total ?? obj.itemCount;
    if (typeof total === 'number') return total;
    if (typeof total === 'bigint') return Number(total);

    // Recursively check 'data' field if it is a wrapper object
    if (obj['data'] && typeof obj['data'] === 'object') {
      return toTotalCount(obj['data'], defaultTotal);
    }
  }
  return defaultTotal;
}
