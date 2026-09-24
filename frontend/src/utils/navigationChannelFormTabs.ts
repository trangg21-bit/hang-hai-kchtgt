/**
 * Bản đồ "trường dữ liệu → tab" cho form Luồng hàng hải.
 *
 * Dùng chung cho 2 màn cùng cụm menu:
 *  - /navigation-channel     → pages/navigationchannel/NavigationChannelForm.tsx
 *  - /navigation-channel-chk → pages/navigationchannelchk/NavigationChannelChkForm.tsx
 *
 * Mục đích: khi submit mà validate thất bại, xác định tab đang chứa trường bắt buộc bị bỏ trống
 * (lỗi đầu tiên) để form tự chuyển tab + cuộn tới ô lỗi — cùng hành vi với /beacon-station
 * (BeaconStationForm: dựa vào errorFields của validate rồi setActiveTabKey).
 *
 * Quy ước: chỉ tab "location" mới được suy ra từ tên trường; mọi trường còn lại thuộc tab mặc định
 * của form đang xét (form chính = "basic-info", drawer tuyến luồng = "general"). Nhờ vậy resolver
 * không bao giờ trả về key tab không tồn tại khi form được bổ sung trường mới.
 */

/** Tab mặc định của form chính (Thông tin chung). */
export const MAIN_FORM_DEFAULT_TAB = 'basic-info';

/** Tab mặc định của drawer "Tuyến luồng" bên trong form. */
export const ROUTE_DRAWER_DEFAULT_TAB = 'general';

/** Tab chứa nhóm trường tọa độ / biểu tượng bản đồ. */
export const LOCATION_TAB_KEY = 'location';

/** Tên trường thuộc tab vị trí (đúng theo Form.Item name="..." của 2 form). */
const LOCATION_TAB_FIELDS: readonly string[] = [
  'geometryType',
  'mapIconId',
  // Alias biểu tượng bản đồ: drawer tuyến luồng set song song symbolId ↔ mapIconId.
  'symbolId',
  'coordinateReferenceSystem',
  'displayRule',
];

const LOCATION_TAB_FIELD_SET = new Set<string>(LOCATION_TAB_FIELDS);

/**
 * errorFields của Ant Design ở dạng tối thiểu mà code này cần.
 * Khai báo lỏng (mọi field optional) để ValidateErrorEntity của antd gán vào được
 * mà không phải import type nội bộ của antd/rc-field-form.
 */
export interface FormErrorField {
  name?: Array<string | number>;
  errors?: string[];
}

export interface FormFinishFailedInfo {
  errorFields?: FormErrorField[];
}

/** Tab chứa trường lỗi của form chính: vị trí ↔ thông tin chung. */
export function resolveMainFormTabForField(fieldName: unknown): string {
  return LOCATION_TAB_FIELD_SET.has(String(fieldName ?? '')) ? LOCATION_TAB_KEY : MAIN_FORM_DEFAULT_TAB;
}

export type RouteDrawerTabKey = 'general' | 'location';

/** Tab chứa trường lỗi của drawer tuyến luồng: vị trí ↔ thông tin chung. */
export function resolveRouteDrawerTabForField(fieldName: unknown): RouteDrawerTabKey {
  return LOCATION_TAB_FIELD_SET.has(String(fieldName ?? '')) ? LOCATION_TAB_KEY : ROUTE_DRAWER_DEFAULT_TAB;
}

/** Tên trường (cấp 1) của lỗi ĐẦU TIÊN; chuỗi rỗng khi không có lỗi nào. */
export function firstErrorFieldName(errorFields?: FormErrorField[]): string {
  const first = errorFields?.[0];
  if (!first || !Array.isArray(first.name) || first.name.length === 0) return '';
  return String(first.name[0]);
}

/** Thông điệp lỗi hiển thị cho người dùng; luôn có giá trị (rơi về câu dự phòng). */
export function firstErrorMessage(
  errorFields?: FormErrorField[],
  fallback = 'Vui lòng kiểm tra lại các trường bắt buộc còn trống',
): string {
  return errorFields?.[0]?.errors?.[0] || fallback;
}
