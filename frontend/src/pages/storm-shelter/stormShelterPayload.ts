import {
  actionPrimary,
  statusAttention,
  statusCritical,
  statusDraft,
  statusOperational,
} from '../../tokens';
import { parseWktToCoordinates } from '../../utils/gisGeometry';

export interface GisLocationLike {
  geometryType?: string;
  coordinates?: string;
}

export const STORM_SHELTER_CLASSIFICATION_OPTIONS = [
  { value: 'Tránh bão', label: 'Tránh bão' },
  { value: 'Trú bão', label: 'Trú bão' },
  { value: 'Tránh, trú bão', label: 'Tránh, trú bão' },
];

export const DEFAULT_APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PROPOSED: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  CHO_PHE_DUYET: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusAttention, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp Cục' },
};

export const DEFAULT_OPERATIONAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
  NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
  HIEN_HANH: { color: statusOperational, label: 'Hiện hành' },
  TAM_NGUNG: { color: statusCritical, label: 'Tạm ngừng' },
  DANG_KHAI_THAC: { color: statusOperational, label: 'Đang khai thác/vận hành' },
  CHUA_KHAI_THAC: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  DUNG_KHAI_THAC: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

/**
 * Phân tích tọa độ GIS của Khu tránh, trú bão từ chuỗi WKT hoặc object GIS location.
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

/**
 * Các trường nghiệp vụ cho phép xóa trắng (không bắt buộc ở form Chỉnh sửa).
 * Không đưa vào đây: orgUnitId, portId, stormShelterName, provinceId (bắt buộc),
 * stormShelterCode (không có trong DTO cập nhật, mã sinh tự động, input disabled).
 */
export const CLEARABLE_STORM_SHELTER_FIELDS: ReadonlySet<string> = new Set([
  'detailedLocation',
  'shapeDescription',
  'area',
  'designWaterDepth',
  'currentWaterDepth',
  'bottomElevationDesign',
  'maxVesselDWT',
  'activeStormShelterCount',
  'publishedStormShelterCount',
  'underInvestmentStormShelterCount',
  'remarks',
  'publicDecision',
  'investmentAgreement',
  'openingAnnouncementDate',
  'navigationChannelId',
  'buoyStationId',
  'classification',
]);

export interface NormalizeClearedFieldsOptions {
  isEdit: boolean;
  clearable?: ReadonlySet<string>;
}

/**
 * Chuẩn hóa object payload gửi lên máy chủ cho Khu tránh, trú bão:
 * Khi isEdit = true, các trường xóa trắng (undefined) trong danh sách clearable sẽ được set null
 * để backend FieldPresenceTrackedRequest ghi nhận và xóa dữ liệu tương ứng.
 */
export function normalizeClearedFields<T extends Record<string, unknown>>(
  payload: T,
  options: NormalizeClearedFieldsOptions,
): Record<string, unknown> {
  const clearable = options.clearable ?? CLEARABLE_STORM_SHELTER_FIELDS;
  const out: Record<string, unknown> = {};

  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    if (value !== undefined) {
      out[key] = value;
      return;
    }
    if (options.isEdit && clearable.has(key)) {
      out[key] = null;
      return;
    }
  });

  return out;
}
