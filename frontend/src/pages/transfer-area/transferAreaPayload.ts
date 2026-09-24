/**
 * Chuẩn hoá payload gửi lên `PUT /v1/transfer-area` (màn Khu chuyển tải).
 *
 * Bối cảnh (nguyên nhân gốc của lỗi "xóa trắng trường không lưu được"):
 * Backend phân biệt "người dùng đã xóa trắng trường" với "trường không được gửi"
 * bằng `FieldPresenceTrackedRequest.isFieldPresent(...)` — chỉ khi key có mặt trong
 * body (kể cả giá trị `null`) thì `TransferAreaService.update()` mới ghi `null` xuống DB.
 * Vì vậy nếu frontend **bỏ hẳn key** khi giá trị rỗng/không xác định thì server hiểu là
 * "không đụng tới trường này" và giữ nguyên giá trị cũ ⇒ xóa trắng trở thành no-op.
 *
 * Đây đúng là lớp lỗi đã ghi nhận cho `/berth` và `/port` trong `docs/JOURNAL.md`.
 *
 * Quy tắc:
 * - `isEdit = true`  → mọi trường NGHIỆP VỤ CÓ THỂ XÓA TRẮNG nhận `undefined` sẽ được
 *   gửi tường minh thành `null` ("đã xóa trắng").
 * - `isEdit = false` (tạo mới) → giữ nguyên hành vi cũ: bỏ key undefined để không ghi
 *   `null` thừa vào bản ghi mới.
 * - Trường định danh / bắt buộc (`orgUnitId`, `portId`, `transferAreaName`, `provinceId`)
 *   TUYỆT ĐỐI không bao giờ bị biến thành `null` — vẫn bỏ key, tránh mất dữ liệu.
 */
import { parseWktToCoordinates } from '../../utils/gisGeometry';

export const parseGisCoordinates = (
  gisLocation: { geometryType?: string; coordinates?: string } | undefined | null,
): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  return parseWktToCoordinates(wkt);
};

/**
 * Các trường nghiệp vụ cho phép xóa trắng (không bắt buộc ở form Chỉnh sửa).
 * Không đưa vào đây: orgUnitId, portId, transferAreaName, provinceId (bắt buộc),
 * transferAreaCode (không có trong DTO cập nhật, mã sinh tự động, input disabled).
 */
export const CLEARABLE_TRANSFER_AREA_FIELDS: ReadonlySet<string> = new Set([
  'detailedLocation',
  'shapeDescription',
  'area',
  'designWaterDepth',
  'currentWaterDepth',
  'bottomElevationDesign',
  'maxVesselDWT',
  'activeTransferCount',
  'publishedTransferCount',
  'underInvestmentTransferCount',
  'remarks',
  'publicDecision',
  'investmentAgreement',
  'openingAnnouncementDate',
  'activityStartDate',
  'activityEndDate',
]);

export interface NormalizeClearedFieldsOptions {
  isEdit: boolean;
  /** Mặc định dùng CLEARABLE_TRANSFER_AREA_FIELDS. */
  clearable?: ReadonlySet<string>;
}

/**
 * Trả về object MỚI đã chuẩn hoá (không mutate tham số đầu vào — thuần, dễ test).
 */
export function normalizeClearedFields<T extends Record<string, unknown>>(
  payload: T,
  options: NormalizeClearedFieldsOptions,
): Record<string, unknown> {
  const clearable = options.clearable ?? CLEARABLE_TRANSFER_AREA_FIELDS;
  const out: Record<string, unknown> = {};

  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    if (value !== undefined) {
      out[key] = value;
      return;
    }
    // undefined = người dùng đã xóa trắng (hoặc bản ghi chưa có giá trị).
    // Ở chế độ sửa: gửi tường minh null để server ghi rỗng.
    if (options.isEdit && clearable.has(key)) {
      out[key] = null;
      return;
    }
    // Tạo mới, hoặc trường định danh/bắt buộc: bỏ key (giữ nguyên hành vi cũ).
  });

  return out;
}
