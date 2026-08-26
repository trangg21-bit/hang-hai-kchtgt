/**
 * Nhãn tab chuẩn cho form thêm/sửa hồ sơ KCHT.
 *
 * Đây là bộ từ vựng đang dùng trên phần lớn màn hình (đếm trên mã nguồn:
 * "File đính kèm" 23 chỗ, "Thông tin chung" 18 chỗ, "Thông tin vị trí" 16 chỗ).
 * Khai báo tập trung để các màn mới không tự đặt tên khác ("Vị trí & GIS",
 * "Tệp đính kèm", "Thông tin cơ bản"...) hay tự đánh số thứ tự vào nhãn tab —
 * không màn nào trong hệ thống đánh số cả.
 */
export const FORM_TAB_LABEL = {
  /** Tab đầu tiên: đơn vị quản lý, mã, tên, địa điểm, tình trạng... */
  GENERAL: 'Thông tin chung',
  /** Thông số kỹ thuật riêng của từng loại tài sản. */
  TECHNICAL: 'Thông tin kỹ thuật',
  /** Thông số thiết bị (dùng cho loại tài sản thiên về thiết bị). */
  DEVICE: 'Thông tin thiết bị',
  /** Các thông tin còn lại chưa xếp vào nhóm nào. */
  OTHER: 'Thông tin khác',
  /** Tọa độ, loại đối tượng, biểu tượng bản đồ, hệ quy chiếu. */
  LOCATION: 'Thông tin vị trí',
  /** Tệp tài liệu đính kèm. */
  ATTACHMENTS: 'File đính kèm',
  /** Nhật ký thay đổi và vết phê duyệt 2 cấp. */
  HISTORY: 'Lịch sử & Phê duyệt',
} as const;

export type FormTabLabel = typeof FORM_TAB_LABEL[keyof typeof FORM_TAB_LABEL];
