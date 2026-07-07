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

    // Fallback: try common array field names
    for (const key of ['results', 'items', 'data']) {
      if (Array.isArray(obj[key])) {
        return obj[key] as T[];
      }
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
  if (typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    const total = obj.totalElements ?? obj.total ?? obj.itemCount;
    if (typeof total === 'number') return total;
    if (typeof total === 'bigint') return Number(total);
  }
  return defaultTotal;
}
