import { parseWktToCoordinates } from '../../utils/gisGeometry';

export interface GisLocationLike {
  geometryType?: string;
  coordinates?: string;
}

/**
 * Phân tích tọa độ GIS của Khu neo đậu từ chuỗi WKT hoặc object GIS location.
 * Sử dụng parseWktToCoordinates chuẩn hóa (hỗ trợ SRID, POINT, LINESTRING, POLYGON, MULTIPOINT).
 */
export const parseGisCoordinates = (
  gisLocation: GisLocationLike | string | undefined | null
): Array<{ latitude: number; longitude: number }> => {
  if (!gisLocation) return [];
  const rawWkt = typeof gisLocation === 'string' ? gisLocation : gisLocation.coordinates;
  if (!rawWkt || typeof rawWkt !== 'string' || !rawWkt.trim()) return [];
  return parseWktToCoordinates(rawWkt);
};
