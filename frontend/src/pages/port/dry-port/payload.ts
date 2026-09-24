/**
 * Hợp đồng gửi dữ liệu khi LƯU màn Cảng cạn (`/dry-port`).
 *
 * Cùng chuẩn đã chốt cho `/port` — `/berth` — `/pier` (xem comment `clearableText` /
 * `clearableNumber` / `clearableUuid` trong `frontend/src/services/port/PortListPage.tsx`):
 *
 *   Ô bị xóa trắng BẮT BUỘC đi kèm request dưới dạng `null` tường minh.
 *
 * Lý do: `JSON.stringify` loại bỏ hoàn toàn key có giá trị `undefined` khỏi body, nên server
 * không phân biệt được "người dùng đã xóa trắng trường" với "trường không được gửi";
 * `DryPortService.update()` chỉ ghi `null` khi `isFieldPresent(field)` = true — tức key phải
 * CÓ mặt trong body. Bỏ key ⇒ thao tác xóa bị bỏ qua âm thầm mà API vẫn trả về thành công
 * — đúng lỗi "xóa trắng trường mà dữ liệu không hề thay đổi".
 */

/** Trường định danh / bắt buộc — KHÔNG bao giờ được null hoá (tránh mất dữ liệu). */
export const DRY_PORT_REQUIRED_FIELDS: ReadonlySet<string> = new Set([
  'dryPortCode', // mã sinh tự động, input disabled, BE coi là bất biến
  'dryPortName', // bắt buộc
  'orgUnitId', // bắt buộc (input disabled ở chế độ sửa); NULL ⇒ user cấp đơn vị thấy 0 bản ghi
  'provinceId', // bắt buộc
  'portStatus', // bắt buộc (nullable = false ở DB)
]);

export interface NormalizeDryPortPayloadOptions {
  isEdit: boolean;
}

/**
 * Chuẩn hoá payload trước khi gửi `PUT /v1/dry-ports`.
 * Trả về object MỚI (không mutate đầu vào).
 *
 * - `isEdit = true`: mọi trường KHÔNG thuộc nhóm định danh/bắt buộc mà có giá trị `undefined`
 *   sẽ được gửi tường minh thành `null` ("đã xóa trắng").
 * - `isEdit = false` (tạo mới): giữ nguyên hành vi cũ — bỏ key `undefined` để không ghi `null` thừa.
 */
export function normalizeDryPortPayload(
  payload: Record<string, unknown>,
  options: NormalizeDryPortPayloadOptions,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    if (value !== undefined) {
      out[key] = value;
      return;
    }
    if (options.isEdit && !DRY_PORT_REQUIRED_FIELDS.has(key)) {
      out[key] = null;
      return;
    }
    // Tạo mới, hoặc trường định danh/bắt buộc: bỏ key (giữ nguyên hành vi cũ).
  });

  return out;
}

/** Giá trị `operationalStatus` (enum OperationalStatus) tương ứng với `portStatus` 0/1/2. */
export type OperationalStatusName = 'NOT_YET_OPERATIONAL' | 'OPERATIONAL' | 'SUSPENDED';

/**
 * `portStatus` (Integer, PORT_STATUS_OPTIONS: 0/1/2) và `operationalStatus`
 * (enum OperationalStatus: NOT_YET_OPERATIONAL=0 / OPERATIONAL=1 / SUSPENDED=2) là CÙNG một
 * miền 3 trạng thái.
 *
 * Vì sao phải gửi kèm: badge "Tình trạng hoạt động" ở màn danh sách (`DryPortListPage.tsx`)
 * và drawer chi tiết (`DryPortDetailContent.tsx`) gọi
 * `trangThaiHoatDongBadge(record.portStatus, record.operationalStatus)` — và hàm này
 * (dry-port/schema.ts) ƯU TIÊN `operationalStatus`: chỉ khi `operationalStatus` rỗng mới
 * xét tới `portStatus`. Form trước đây chỉ gửi `portStatus`, không bao giờ gửi
 * `operationalStatus`, nên cột `operational_status` giữ nguyên giá trị cũ và người dùng
 * sửa "Tình trạng" xong vẫn thấy badge y như cũ.
 */
export function mapPortStatusToOperationalStatus(
  portStatus: unknown,
): OperationalStatusName | null {
  if (portStatus === null || portStatus === undefined || portStatus === '') return null;
  const n = typeof portStatus === 'number' ? portStatus : Number(String(portStatus).trim());
  if (Number.isNaN(n)) return null;
  if (n === 1) return 'OPERATIONAL';
  if (n === 2) return 'SUSPENDED';
  return 'NOT_YET_OPERATIONAL';
}
