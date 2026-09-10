export type LngLat = [number, number];
export type EditableGeometryType = 'Point' | 'LineString' | 'Polygon';

export interface EditableCoordinateRow {
  lng: number;
  lat: number;
}

export interface MapGeometryLocation {
  /** Tọa độ tâm theo thứ tự GeoJSON: [kinh độ, vĩ độ]. */
  center: LngLat;
  /** Toàn bộ điểm hợp lệ của hình học, dùng để focus vừa phạm vi đối tượng. */
  coordinates: LngLat[];
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface MapHitGeometry {
  type: EditableGeometryType;
  coordinates: LngLat | LngLat[] | LngLat[][];
}

export interface MapGeometryHitTarget<T> {
  geometry: MapHitGeometry;
  value: T;
}

export interface MapGeometryHit<T> extends MapGeometryHitTarget<T> {
  distance: number;
}

export interface MapGeometryBounds {
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
}

export const VIETNAM_MAP_BOUNDS = {
  minLongitude: 95,
  maxLongitude: 120,
  minLatitude: 5,
  maxLatitude: 26,
} as const;

export const isVietnamMapCoordinate = ([longitude, latitude]: LngLat): boolean => (
  longitude >= VIETNAM_MAP_BOUNDS.minLongitude
  && longitude <= VIETNAM_MAP_BOUNDS.maxLongitude
  && latitude >= VIETNAM_MAP_BOUNDS.minLatitude
  && latitude <= VIETNAM_MAP_BOUNDS.maxLatitude
);

interface GeoJsonGeometryLike {
  type?: unknown;
  coordinates?: unknown;
  geometry?: unknown;
  geometries?: unknown;
  features?: unknown;
}

const isLngLat = (value: unknown): value is LngLat => {
  if (!Array.isArray(value) || value.length < 2) return false;
  const longitude = Number(value[0]);
  const latitude = Number(value[1]);
  return Number.isFinite(longitude)
    && Number.isFinite(latitude)
    && longitude >= -180
    && longitude <= 180
    && latitude >= -90
    && latitude <= 90;
};

export const normalizePointCoordinates = (value: unknown): LngLat | null => {
  if (!isLngLat(value)) return null;
  return [Number(value[0]), Number(value[1])];
};

export const normalizeLineCoordinates = (value: unknown): LngLat[] | null => {
  if (!Array.isArray(value) || value.length < 2) return null;
  const coordinates = value.map(normalizePointCoordinates);
  if (coordinates.some((coordinate) => coordinate === null)) return null;
  return coordinates as LngLat[];
};

export const normalizePolygonCoordinates = (value: unknown): LngLat[][] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const rings = value.map((ring) => normalizeLineCoordinates(ring));
  if (rings.some((ring) => ring === null || ring.length < 3)) return null;
  return rings as LngLat[][];
};

const parseCoordinatePair = (value: string): LngLat | null => {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 2) return null;
  return normalizePointCoordinates([Number(parts[0]), Number(parts[1])]);
};

/** Chuyển WKT điểm/đường/vùng sang tọa độ GeoJSON và loại bỏ hình học không hợp lệ. */
export const parseWktToCoords = (value: string): LngLat | LngLat[] | LngLat[][] | null => {
  const wkt = String(value || '')
    .trim()
    .replace(/^SRID=\d+\s*;/i, '')
    .trim();
  if (!wkt || /\bEMPTY\s*$/i.test(wkt)) return null;

  if (/^POINT\s*\(/i.test(wkt)) {
    const match = wkt.match(/^POINT\s*\(([^)]+)\)\s*$/i);
    return match ? parseCoordinatePair(match[1]) : null;
  }

  // Some legacy GIS records store polygon vertices as MULTIPOINT even though
  // the accompanying geometry type is POLYGON. Keep all vertices so the map
  // can still draw the area and use it as a click target.
  if (/^MULTIPOINT\s*\(/i.test(wkt)) {
    const match = wkt.match(/^MULTIPOINT\s*\((.*)\)\s*$/i);
    if (!match) return null;
    const coordinates = match[1]
      .replace(/[()]/g, '')
      .split(',')
      .map(parseCoordinatePair);
    return normalizeLineCoordinates(coordinates);
  }

  if (/^LINESTRING\s*\(/i.test(wkt)) {
    const match = wkt.match(/^LINESTRING\s*\(([^)]+)\)\s*$/i);
    if (!match) return null;
    return normalizeLineCoordinates(match[1].split(',').map(parseCoordinatePair));
  }

  if (/^POLYGON\s*\(/i.test(wkt)) {
    const match = wkt.match(/^POLYGON\s*\(\s*\((.*)\)\s*\)\s*$/i);
    if (!match) return null;
    const rings = match[1]
      .split(/\)\s*,\s*\(/)
      .map((ring) => ring.split(',').map(parseCoordinatePair));
    return normalizePolygonCoordinates(rings);
  }

  return null;
};

/**
 * Convert GeoJSON, including multi-geometries and collections, to the simple
 * geometries used by the shared screen-space map hit tester.
 */
export const geoJsonToMapHitGeometries = (value: unknown): MapHitGeometry[] => {
  if (!value || typeof value !== 'object') return [];
  const geometry = value as GeoJsonGeometryLike;
  const type = String(geometry.type ?? '').toUpperCase();

  if (type === 'FEATURE') return geoJsonToMapHitGeometries(geometry.geometry);
  if (type === 'FEATURECOLLECTION') {
    return Array.isArray(geometry.features)
      ? geometry.features.flatMap(geoJsonToMapHitGeometries)
      : [];
  }
  if (type === 'GEOMETRYCOLLECTION') {
    return Array.isArray(geometry.geometries)
      ? geometry.geometries.flatMap(geoJsonToMapHitGeometries)
      : [];
  }

  if (type === 'POINT') {
    const coordinates = normalizePointCoordinates(geometry.coordinates);
    return coordinates ? [{ type: 'Point', coordinates }] : [];
  }
  if (type === 'MULTIPOINT') {
    if (!Array.isArray(geometry.coordinates)) return [];
    return geometry.coordinates.flatMap((coordinate) => {
      const normalized = normalizePointCoordinates(coordinate);
      return normalized ? [{ type: 'Point' as const, coordinates: normalized }] : [];
    });
  }
  if (type === 'LINESTRING') {
    const coordinates = normalizeLineCoordinates(geometry.coordinates);
    return coordinates ? [{ type: 'LineString', coordinates }] : [];
  }
  if (type === 'MULTILINESTRING') {
    if (!Array.isArray(geometry.coordinates)) return [];
    return geometry.coordinates.flatMap((coordinates) => {
      const normalized = normalizeLineCoordinates(coordinates);
      return normalized ? [{ type: 'LineString' as const, coordinates: normalized }] : [];
    });
  }
  if (type === 'POLYGON') {
    const coordinates = normalizePolygonCoordinates(geometry.coordinates);
    return coordinates ? [{ type: 'Polygon', coordinates }] : [];
  }
  if (type === 'MULTIPOLYGON') {
    if (!Array.isArray(geometry.coordinates)) return [];
    return geometry.coordinates.flatMap((coordinates) => {
      const normalized = normalizePolygonCoordinates(coordinates);
      return normalized ? [{ type: 'Polygon' as const, coordinates: normalized }] : [];
    });
  }

  return [];
};

export const getMapHitGeometryBounds = (
  geometry: MapHitGeometry,
): MapGeometryBounds | null => {
  const coordinates = flattenGeometryCoordinates(geometry.coordinates);
  if (coordinates.length === 0) return null;
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  return {
    minLongitude: Math.min(...longitudes),
    minLatitude: Math.min(...latitudes),
    maxLongitude: Math.max(...longitudes),
    maxLatitude: Math.max(...latitudes),
  };
};

const flattenGeometryCoordinates = (
  value: LngLat | LngLat[] | LngLat[][] | null,
): LngLat[] => {
  if (!value) return [];
  const point = normalizePointCoordinates(value);
  if (point) return [point];

  const line = normalizeLineCoordinates(value);
  if (line) return line;

  const polygon = normalizePolygonCoordinates(value);
  return polygon?.flat() || [];
};

export const everyMapHitGeometryCoordinate = (
  geometry: MapHitGeometry,
  predicate: (coordinate: LngLat) => boolean,
): boolean => {
  const coordinates = flattenGeometryCoordinates(geometry.coordinates);
  return coordinates.length > 0 && coordinates.every(predicate);
};

const distanceToSegment = (
  point: ScreenPoint,
  start: ScreenPoint,
  end: ScreenPoint,
): number => {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  if (deltaX === 0 && deltaY === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const position = Math.max(0, Math.min(1, (
    ((point.x - start.x) * deltaX) + ((point.y - start.y) * deltaY)
  ) / ((deltaX * deltaX) + (deltaY * deltaY))));
  const closestX = start.x + (position * deltaX);
  const closestY = start.y + (position * deltaY);
  return Math.hypot(point.x - closestX, point.y - closestY);
};

const getLineDistance = (point: ScreenPoint, coordinates: ScreenPoint[]): number => {
  let minimumDistance = Number.POSITIVE_INFINITY;
  for (let index = 1; index < coordinates.length; index += 1) {
    minimumDistance = Math.min(
      minimumDistance,
      distanceToSegment(point, coordinates[index - 1], coordinates[index]),
    );
  }
  return minimumDistance;
};

const isPointInRing = (point: ScreenPoint, ring: ScreenPoint[]): boolean => {
  let inside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current, current += 1) {
    const currentPoint = ring[current];
    const previousPoint = ring[previous];
    const crossesLatitude = (currentPoint.y > point.y) !== (previousPoint.y > point.y);
    const intersectionX = (
      ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y))
      / ((previousPoint.y - currentPoint.y) || Number.EPSILON)
    ) + currentPoint.x;
    if (crossesLatitude && point.x < intersectionX) inside = !inside;
  }
  return inside;
};

const getRingBoundaryDistance = (point: ScreenPoint, ring: ScreenPoint[]): number => {
  if (ring.length < 2) return Number.POSITIVE_INFINITY;
  const closedRing = ring[0].x === ring[ring.length - 1].x
    && ring[0].y === ring[ring.length - 1].y
    ? ring
    : [...ring, ring[0]];
  return getLineDistance(point, closedRing);
};

const getGeometryTypePriority = (type: EditableGeometryType): number => {
  if (type === 'Point') return 0;
  if (type === 'LineString') return 1;
  return 2;
};

/**
 * Hit-test currently rendered geometries in screen pixels. Keeping this
 * independent from Leaflet panes prevents one full-screen Canvas from making
 * the other data sources unreachable.
 */
export const findMapGeometryHits = <T>(
  clickPoint: ScreenPoint,
  targets: MapGeometryHitTarget<T>[],
  project: (coordinate: LngLat) => ScreenPoint,
  tolerance = 8,
): MapGeometryHit<T>[] => targets
  .map((target): MapGeometryHit<T> | null => {
    const { geometry } = target;

    if (geometry.type === 'Point') {
      const coordinate = normalizePointCoordinates(geometry.coordinates);
      if (!coordinate) return null;
      const projectedPoint = project(coordinate);
      const distance = Math.hypot(
        clickPoint.x - projectedPoint.x,
        clickPoint.y - projectedPoint.y,
      );
      return distance <= tolerance ? { ...target, distance } : null;
    }

    if (geometry.type === 'LineString') {
      const coordinates = normalizeLineCoordinates(geometry.coordinates);
      if (!coordinates) return null;
      const distance = getLineDistance(clickPoint, coordinates.map(project));
      return distance <= tolerance ? { ...target, distance } : null;
    }

    const rings = normalizePolygonCoordinates(geometry.coordinates);
    if (!rings) return null;
    const projectedRings = rings.map((ring) => ring.map(project));
    const isInsideOuterRing = isPointInRing(clickPoint, projectedRings[0]);
    const isInsideHole = projectedRings.slice(1).some((ring) => isPointInRing(clickPoint, ring));
    const boundaryDistance = Math.min(
      ...projectedRings.map((ring) => getRingBoundaryDistance(clickPoint, ring)),
    );
    if ((isInsideOuterRing && !isInsideHole) || boundaryDistance <= tolerance) {
      return { ...target, distance: isInsideOuterRing && !isInsideHole ? 0 : boundaryDistance };
    }
    return null;
  })
  .filter((hit): hit is MapGeometryHit<T> => hit !== null)
  .sort((left, right) => (
    getGeometryTypePriority(left.geometry.type) - getGeometryTypePriority(right.geometry.type)
    || left.distance - right.distance
  ));

/**
 * Chuẩn hóa vị trí dùng chung cho marker và thao tác focus trên bản đồ.
 * Ưu tiên hình học WKT; latitude/longitude chỉ là dữ liệu dự phòng cho bản ghi cũ.
 */
export const resolveMapGeometryLocation = (
  coordinatesWkt?: string | null,
  longitude?: unknown,
  latitude?: unknown,
): MapGeometryLocation | null => {
  const coordinates = flattenGeometryCoordinates(
    coordinatesWkt ? parseWktToCoords(coordinatesWkt) : null,
  );
  const hasFallbackValues = longitude !== undefined
    && longitude !== null
    && longitude !== ''
    && latitude !== undefined
    && latitude !== null
    && latitude !== '';
  const fallbackPoint = hasFallbackValues
    ? normalizePointCoordinates([Number(longitude), Number(latitude)])
    : null;
  const resolvedCoordinates = coordinates.length > 0
    ? coordinates
    : (fallbackPoint ? [fallbackPoint] : []);

  if (resolvedCoordinates.length === 0) return null;

  const longitudes = resolvedCoordinates.map(([lng]) => lng);
  const latitudes = resolvedCoordinates.map(([, lat]) => lat);
  const center: LngLat = [
    (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
  ];

  return { center, coordinates: resolvedCoordinates };
};

export const geometryCoordinatesToRows = (
  geometryType: EditableGeometryType,
  value: unknown,
): EditableCoordinateRow[] => {
  if (geometryType === 'Point') {
    const coordinate = normalizePointCoordinates(value);
    return coordinate ? [{ lng: coordinate[0], lat: coordinate[1] }] : [];
  }
  if (geometryType === 'LineString') {
    const coordinates = normalizeLineCoordinates(value);
    return coordinates?.map(([lng, lat]) => ({ lng, lat })) || [];
  }
  const rings = normalizePolygonCoordinates(value);
  if (!rings?.[0]) return [];
  const vertices = [...rings[0]];
  const first = vertices[0];
  const last = vertices[vertices.length - 1];
  if (vertices.length > 1 && first[0] === last[0] && first[1] === last[1]) {
    vertices.pop();
  }
  return vertices.map(([lng, lat]) => ({ lng, lat }));
};

export const coordinateRowsToWkt = (
  geometryType: EditableGeometryType,
  rows: readonly EditableCoordinateRow[],
): string | null => {
  const coordinates = rows.map((row) => normalizePointCoordinates([Number(row?.lng), Number(row?.lat)]));
  if (coordinates.some((coordinate) => coordinate === null)) return null;
  const validCoordinates = coordinates as LngLat[];

  if (geometryType === 'Point') {
    if (validCoordinates.length !== 1) return null;
    return `POINT(${validCoordinates[0][0].toFixed(6)} ${validCoordinates[0][1].toFixed(6)})`;
  }

  if (geometryType === 'LineString') {
    if (validCoordinates.length < 2) return null;
    return `LINESTRING(${validCoordinates.map(([lng, lat]) => `${lng.toFixed(6)} ${lat.toFixed(6)}`).join(', ')})`;
  }

  const uniqueVertices = new Set(validCoordinates.map(([lng, lat]) => `${lng},${lat}`));
  if (uniqueVertices.size < 3) return null;
  const closedCoordinates = [...validCoordinates];
  const first = closedCoordinates[0];
  const last = closedCoordinates[closedCoordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    closedCoordinates.push([...first]);
  }
  return `POLYGON((${closedCoordinates.map(([lng, lat]) => `${lng.toFixed(6)} ${lat.toFixed(6)}`).join(', ')}))`;
};

export interface CoordinateItem {
  latitude: number | null;
  longitude: number | null;
}

export interface DmsCoordinateItem {
  latD?: number | null;
  latM?: number | null;
  latS?: number | null;
  lngD?: number | null;
  lngM?: number | null;
  lngS?: number | null;
}

export interface DmsValidationResult {
  valid: boolean;
  errorMessage?: string;
  validCoords: Array<{ latitude: number; longitude: number }>;
}

export const GEOMETRY_POINT_COUNT: Record<string, number> = {
  POINT: 1,
  LINE: 2,
  POLYGON: 3,
};

/**
 * Validate chi tiết từng dòng tọa độ GPS dạng DMS (Độ/Phút/Giây):
 * - Nếu người dùng đã bắt đầu nhập một dòng tọa độ, bắt buộc phải nhập đủ Độ, Phút, Giây cho cả Vĩ độ và Kinh độ.
 * - Kiểm tra dải giá trị hợp lệ (Vĩ độ: 0-90°, Phút/Giây: 0-59.99'; Kinh độ: 0-180°, Phút/Giây: 0-59.99').
 * - Kiểm tra số lượng tọa độ tối thiểu và tối đa theo loại đối tượng (POINT: đúng 1, LINE: >= 2, POLYGON: >= 3).
 */
export const validateDmsCoordinates = (
  coordinateList: DmsCoordinateItem[],
  geometryType?: string,
): DmsValidationResult => {
  for (let i = 0; i < coordinateList.length; i++) {
    const c = coordinateList[i];
    const hasAnyLat = c.latD != null || c.latM != null || c.latS != null;
    const hasAnyLng = c.lngD != null || c.lngM != null || c.lngS != null;
    const isStarted = hasAnyLat || hasAnyLng;

    if (isStarted) {
      const missing: string[] = [];
      if (c.latD == null) missing.push('Độ (Vĩ độ)');
      if (c.latM == null) missing.push('Phút (Vĩ độ)');
      if (c.latS == null) missing.push('Giây (Vĩ độ)');
      if (c.lngD == null) missing.push('Độ (Kinh độ)');
      if (c.lngM == null) missing.push('Phút (Kinh độ)');
      if (c.lngS == null) missing.push('Giây (Kinh độ)');

      if (missing.length > 0) {
        return {
          valid: false,
          errorMessage: `Tọa độ GPS dòng ${i + 1} chưa nhập đầy đủ: thiếu ${missing.join(', ')}`,
          validCoords: [],
        };
      }

      if (c.latD! < 0 || c.latD! > 90) {
        return { valid: false, errorMessage: `Tọa độ GPS dòng ${i + 1}: Vĩ độ (Độ) phải trong khoảng 0 - 90`, validCoords: [] };
      }
      if (c.latM! < 0 || c.latM! > 59) {
        return { valid: false, errorMessage: `Tọa độ GPS dòng ${i + 1}: Vĩ độ (Phút) phải trong khoảng 0 - 59`, validCoords: [] };
      }
      if (c.latS! < 0 || c.latS! >= 60) {
        return { valid: false, errorMessage: `Tọa độ GPS dòng ${i + 1}: Vĩ độ (Giây) phải trong khoảng 0 - 59.99`, validCoords: [] };
      }
      if (c.lngD! < 0 || c.lngD! > 180) {
        return { valid: false, errorMessage: `Tọa độ GPS dòng ${i + 1}: Kinh độ (Độ) phải trong khoảng 0 - 180`, validCoords: [] };
      }
      if (c.lngM! < 0 || c.lngM! > 59) {
        return { valid: false, errorMessage: `Tọa độ GPS dòng ${i + 1}: Kinh độ (Phút) phải trong khoảng 0 - 59`, validCoords: [] };
      }
      if (c.lngS! < 0 || c.lngS! >= 60) {
        return { valid: false, errorMessage: `Tọa độ GPS dòng ${i + 1}: Kinh độ (Giây) phải trong khoảng 0 - 59.99`, validCoords: [] };
      }
    }
  }

  const validCoords = coordinateList
    .filter((c) => c.latD != null && c.latM != null && c.latS != null && c.lngD != null && c.lngM != null && c.lngS != null)
    .map((c) => ({
      latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
      longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
    }));

  if (geometryType) {
    const geom = String(geometryType).toUpperCase();
    if (geom === 'POINT') {
      if (validCoords.length === 0) {
        return { valid: false, errorMessage: 'Đối tượng điểm (Point) cần ít nhất 1 tọa độ GPS hợp lệ', validCoords };
      }
    } else if (geom === 'LINE' || geom === 'LINESTRING') {
      if (validCoords.length < 2) {
        return { valid: false, errorMessage: 'Đối tượng đường (Line) cần ít nhất 2 tọa độ GPS hợp lệ', validCoords };
      }
    } else if (geom === 'POLYGON') {
      if (validCoords.length < 3) {
        return { valid: false, errorMessage: 'Đối tượng vùng (Polygon) cần ít nhất 3 tọa độ GPS hợp lệ', validCoords };
      }
    }
  }

  return { valid: true, validCoords };
};

/**
 * Phân tích chuỗi WKT thành danh sách tọa độ (kinh độ, vĩ độ) linh hoạt đa định dạng hình học.
 */
export const parseWktToCoordinates = (wkt?: string): { latitude: number; longitude: number }[] => {
  if (!wkt) return [];
  const normalizedWkt = wkt.trim().replace(/^SRID=\d+\s*;/i, '').trim();
  if (!normalizedWkt) return [];

  // Hỗ trợ JSON array: [lng, lat] hoặc [[lng, lat], ...] hoặc [{latitude, longitude}, ...]
  if (normalizedWkt.startsWith('[') || normalizedWkt.startsWith('{')) {
    try {
      const parsed = JSON.parse(normalizedWkt);
      if (Array.isArray(parsed)) {
        if (parsed.length >= 2 && typeof parsed[0] === 'number' && typeof parsed[1] === 'number') {
          return [{ longitude: Number(parsed[0]), latitude: Number(parsed[1]) }];
        }
        const out: { latitude: number; longitude: number }[] = [];
        for (const item of parsed) {
          if (Array.isArray(item) && item.length >= 2) {
            out.push({ longitude: Number(item[0]), latitude: Number(item[1]) });
          } else if (item && typeof item === 'object') {
            const lat = Number(item.latitude ?? item.lat);
            const lng = Number(item.longitude ?? item.lng);
            if (!isNaN(lat) && !isNaN(lng)) out.push({ latitude: lat, longitude: lng });
          }
        }
        if (out.length > 0) return out;
      } else if (parsed && typeof parsed === 'object') {
        const coords = parsed.coordinates;
        if (Array.isArray(coords)) {
          if (coords.length >= 2 && typeof coords[0] === 'number') {
            return [{ longitude: Number(coords[0]), latitude: Number(coords[1]) }];
          }
        }
      }
    } catch {}
  }

  const coordinates = flattenGeometryCoordinates(parseWktToCoords(normalizedWkt))
    .map(([longitude, latitude]) => ({ latitude, longitude }));

  // WKT polygon rings repeat the first vertex at the end. The coordinate
  // editors display only user-entered vertices, so remove that closing copy.
  if (/^POLYGON\s*\(/i.test(normalizedWkt) && coordinates.length > 1) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first.latitude === last.latitude && first.longitude === last.longitude) {
      coordinates.pop();
    }
  }

  return coordinates;
};

/**
 * Chuyển danh sách tọa độ sang WKT, bảo toàn điểm đơn lẻ khi đang chuyển đổi giữa các loại đối tượng.
 */
export const serializeCoordinatesToWkt = (
  coords: { latitude: number | null; longitude: number | null }[],
  geomType: string = 'POINT'
): string => {
  const valid = coords.filter((c) => c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude));
  if (valid.length === 0) return '';
  const type = (geomType || 'POINT').toUpperCase();
  if (type === 'POINT' || valid.length === 1) {
    if (valid.length > 1) {
      return `MULTIPOINT (${valid.map((c) => `(${c.longitude} ${c.latitude})`).join(', ')})`;
    }
    return `POINT (${valid[0].longitude} ${valid[0].latitude})`;
  } else if (type === 'LINE' || type === 'LINESTRING') {
    return `LINESTRING (${valid.map((c) => `${c.longitude} ${c.latitude}`).join(', ')})`;
  } else if (type === 'POLYGON') {
    if (valid.length < 3) {
      return `LINESTRING (${valid.map((c) => `${c.longitude} ${c.latitude}`).join(', ')})`;
    }
    const pts = [...valid];
    if (pts[0].latitude !== pts[pts.length - 1].latitude || pts[0].longitude !== pts[pts.length - 1].longitude) {
      pts.push(pts[0]);
    }
    return `POLYGON ((${pts.map((c) => `${c.longitude} ${c.latitude}`).join(', ')}))`;
  }
  return `POINT (${valid[0].longitude} ${valid[0].latitude})`;
};

/**
 * Kế thừa thông minh danh sách tọa độ khi người dùng thay đổi Loại đối tượng hình học.
 */
export const adjustCoordinateListForGeometry = (
  prevCoords: { latitude: number | null; longitude: number | null }[],
  newGeomType: string
): { latitude: number | null; longitude: number | null }[] => {
  const geom = (newGeomType || 'POINT').toUpperCase();
  const minCount = GEOMETRY_POINT_COUNT[geom] ?? (geom.includes('LINE') ? 2 : (geom.includes('POLYGON') ? 3 : 1));

  const base = (prevCoords && prevCoords.length > 0)
    ? [...prevCoords]
    : [{ latitude: null, longitude: null }];

  if (geom === 'POINT') {
    return [base[0]];
  }

  // Count actually filled points
  const filledCount = base.filter((c) => c.latitude != null || c.longitude != null).length;
  const targetCount = Math.max(minCount, filledCount);
  const trimmed = base.slice(0, targetCount);

  if (trimmed.length >= minCount) return trimmed;
  const added = Array.from({ length: minCount - trimmed.length }, () => ({ latitude: null, longitude: null }));
  return [...trimmed, ...added];
};


export function ddToDms(dd: number | null | undefined): { d: number | null; m: number | null; s: number | null } {
  if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
  const abs = Math.abs(dd);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
  let m = Math.floor(mFloat);
  let sFloat = (mFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  const s = Math.round(sFloat * 10000) / 10000;
  return { d, m, s };
}

export function dmsToDd(d: number | null | undefined, m: number | null | undefined, s: number | null | undefined): number | null {
  if (d == null && m == null && s == null) return null;
  const deg = d || 0;
  const min = m || 0;
  const sec = s || 0;
  const sign = deg < 0 ? -1 : 1;
  return sign * (Math.abs(deg) + min / 60 + sec / 3600);
}

