/**
 * Giá trị 4 trường GIS của Phao, tiêu (tab GIS) khi LƯU.
 *
 * Bối cảnh: `geometryType` / `mapSymbolId` / `coordinateSystem` / `displayRule` nằm trong
 * tab GIS của Drawer, nên Form.Item của chúng **chỉ mount khi người dùng mở tab GIS**.
 * Vì vậy `values.x === undefined` mang HAI nghĩa hoàn toàn khác nhau:
 *
 *   1. Người dùng chưa từng mở tab GIS ⇒ field chưa mount, giá trị rỗng KHÔNG phải là xóa
 *      ⇒ phải GIỮ giá trị đang có của bản ghi.
 *   2. Người dùng đã mở tab GIS rồi xóa trắng ⇒ đó LÀ ý định xóa
 *      ⇒ phải gửi rỗng để server ghi `null` xuống DB.
 *
 * Bản cũ dùng `values.x || editingRecord.x` cho cả hai trường hợp, nên xóa trắng một trong
 * 4 trường này bị khôi phục âm thầm về giá trị cũ — đúng lỗi
 * "xóa trắng trường mà dữ liệu không hề thay đổi".
 */

/** true nếu giá trị form rỗng (undefined/null/chuỗi chỉ có khoảng trắng). */
export function isClearedValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
}

/**
 * @param formValue  giá trị hiện tại trên form (từ `form.validateFields()`)
 * @param storedValue giá trị đang có của bản ghi (nguồn dự phòng khi field chưa mount)
 * @param gisTabTouched người dùng đã mở tab GIS trong phiên chỉnh sửa này chưa
 * @returns giá trị sẽ gửi lên; `undefined` = gửi rỗng/đã xóa trắng
 */
export function resolveGisFieldValue<T>(
  formValue: T | null | undefined,
  storedValue: T | null | undefined,
  gisTabTouched: boolean,
): T | undefined {
  if (!isClearedValue(formValue)) return formValue as T;
  // Form rỗng: chỉ coi là "đã xóa trắng" khi tab GIS đã được mở.
  return gisTabTouched ? undefined : (storedValue ?? undefined);
}
