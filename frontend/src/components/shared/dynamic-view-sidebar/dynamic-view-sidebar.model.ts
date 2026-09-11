import type React from 'react';

/**
 * Các loại trường hiển thị trong DynamicViewSidebar.
 * Tuân thủ quy tắc erasableSyntaxOnly: dùng const object + type alias thay cho enum.
 */
export const ViewFieldType = {
  Text: 'text',
  Number: 'number',
  Money: 'money',
  Date: 'date',
  DateTime: 'datetime',
  Badge: 'badge',
  Tag: 'tag',
  Custom: 'custom',
} as const;

export type ViewFieldType = (typeof ViewFieldType)[keyof typeof ViewFieldType];

/**
 * Cấu hình từng trường thông tin hiển thị dạng Label: Value
 */
export interface ViewFieldConfig<T = Record<string, unknown>> {
  /** Tên thuộc tính trong dữ liệu bản ghi */
  name?: string | number | keyof T;
  /** Nhãn tiêu đề trường (tự động thêm dấu hai chấm ':' phía sau) */
  label: React.ReactNode;
  /** Loại dữ liệu để tự động định dạng */
  type?: ViewFieldType;
  /** Độ rộng cột lưới (12 = 1/2 hàng 2 cột, 24 = full 1 hàng ngang) */
  colSpan?: 12 | 24 | number;
  /** Hàm trích xuất giá trị tùy biến từ bản ghi */
  value?: (record: T) => unknown;
  /** Hàm render tùy biến toàn bộ giá trị hiển thị */
  render?: (value: unknown, record: T) => React.ReactNode;
  /** Màu cho badge khi type = 'badge' */
  badgeColor?: string | ((value: unknown, record: T) => string);
  /** Đơn vị tiền tệ hoặc hậu tố hiển thị phía sau (vd: 'VNĐ', 'm²', 'tháng') */
  suffix?: React.ReactNode;
  /** Tiền tố hiển thị phía trước */
  prefix?: React.ReactNode;
  /** Ẩn trường theo điều kiện */
  hidden?: boolean | ((record: T) => boolean);
  /** Class CSS tùy biến */
  className?: string;
  /** Style inline tùy biến cho dòng hiển thị */
  style?: React.CSSProperties;
}

/**
 * Cấu hình nhóm thông tin (Section) trong màn hình Xem chi tiết
 */
export interface ViewSectionConfig<T = Record<string, unknown>> {
  /** Định danh duy nhất */
  key?: string;
  /** Tiêu đề nhóm */
  title?: React.ReactNode;
  /** Icon tiêu đề */
  icon?: React.ReactNode;
  /** Cho phép thu gọn / mở rộng section */
  collapsible?: boolean;
  /** Trạng thái thu gọn mặc định */
  defaultCollapsed?: boolean;
  /** Danh sách các trường hiển thị trong nhóm */
  fields: ViewFieldConfig<T>[];
  /** Thành phần bổ sung góc phải header section */
  headerExtra?: React.ReactNode | ((record: T) => React.ReactNode);
  /** Ẩn section theo điều kiện */
  hidden?: boolean | ((record: T) => boolean);
  /** Style inline tùy biến cho thẻ Section */
  style?: React.CSSProperties;
}

/**
 * Cấu hình Tab trong màn hình Xem chi tiết
 */
export interface ViewTabConfig<T = Record<string, unknown>> {
  /** Mã định danh tab */
  key: string;
  /** Tiêu đề tab */
  label: React.ReactNode;
  /** Icon tiêu đề tab */
  icon?: React.ReactNode;
  /** Số lượng đếm trên tab (vd: Hồ sơ tài sản (2)) */
  badgeCount?: number;
  /** Danh sách các section trong tab */
  sections?: ViewSectionConfig<T>[];
  /** Danh sách trường hiển thị trực tiếp nếu không chia section */
  fields?: ViewFieldConfig<T>[];
  /** Nội dung tùy biến hoàn toàn cho tab (vd: bảng phụ, đính kèm file) */
  customContent?: React.ReactNode | ((record: T) => React.ReactNode);
  /** Ẩn tab theo điều kiện */
  hidden?: boolean | ((record: T) => boolean);
}

/**
 * Props cho component DynamicViewSidebar
 */
export interface DynamicViewSidebarProps<T = Record<string, unknown>> {
  /** Trạng thái mở drawer */
  open: boolean;
  /** Tiêu đề drawer */
  title: React.ReactNode;
  /** Dữ liệu bản ghi đang xem */
  record?: T;
  /** Callback đóng drawer */
  onClose: () => void;
  /** Chiều rộng drawer hoặc size responsive */
  width?: string | number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | string | number;
  /** Cấu hình các tab */
  tabs?: ViewTabConfig<T>[];
  /** Cấu hình các section (nếu không chia tab) */
  sections?: ViewSectionConfig<T>[];
  /** Cấu hình các trường (nếu không chia tab và không chia section) */
  fields?: ViewFieldConfig<T>[];
  /** Thành phần chân drawer (mặc định null) */
  footer?: React.ReactNode;
  /** Trạng thái loading toàn drawer */
  loading?: boolean;
  /** Class CSS root của drawer */
  rootClassName?: string;
  /** Class CSS của drawer */
  className?: string;
}
