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
