export type StationGeometryType = 'POINT' | 'LINE' | 'POLYGON';

/**
 * Existing GIS WKT is authoritative. Some legacy records have stale geometry
 * metadata, so re-saving an unrelated field must not alter their geometry.
 */
export const resolveStationGeometryType = (
  geometryType?: unknown,
  coordinates?: unknown,
): StationGeometryType | undefined => {
  const wkt = typeof coordinates === 'string' ? coordinates.trim().toUpperCase() : '';
  if (/^(MULTI)?LINESTRING\s*\(/.test(wkt)) return 'LINE';
  if (/^(MULTI)?POLYGON\s*\(/.test(wkt)) return 'POLYGON';
  if (/^(MULTI)?POINT\s*\(/.test(wkt)) return 'POINT';

  const type = typeof geometryType === 'string' ? geometryType.trim().toUpperCase() : '';
  if (type.includes('LINE')) return 'LINE';
  if (type.includes('POLYGON')) return 'POLYGON';
  if (type.includes('POINT')) return 'POINT';
  return undefined;
};
