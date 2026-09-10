import type React from 'react';
import type { OrgUnitTreeOption } from '../../org-unit/OrgUnitTreeSelect';

/** Loại trường dữ liệu lọc */
export type FilterFieldType =
  | 'text'
  | 'select'
  | 'treeSelect'
  | 'date'
  | 'dateRange'
  | 'number'
  | 'numberRange'
  | 'checkbox'
  | 'template';

/** Cấu hình mục chọn cho dropdown select */
export interface SelectOptionItem {
  label: React.ReactNode;
  value: string | number | boolean;
  disabled?: boolean;
  [key: string]: unknown;
}

/** Cấu hình từng trường bộ lọc */
export interface FilterOption<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Tên trường / key gửi lên backend */
  key: string;
  /** Tiêu đề hiển thị của trường */
  label: string;
  /** Loại trường nhập liệu */
  type: FilterFieldType;
  /** Placeholder gợi ý (văn bản đơn hoặc mảng [từ ngày, đến ngày]) */
  placeholder?: string | [string, string];
  /** Danh sách lựa chọn cho type = 'select' */
  options?: SelectOptionItem[];
  /** Danh sách đơn vị cây cho type = 'treeSelect' hoặc trường đơn vị quản lý */
  organizations?: OrgUnitTreeOption[];
  /** Giá trị mặc định */
  defaultValue?: unknown;
  /** Vô hiệu hóa trường */
  disabled?: boolean;
  /** Ẩn trường (hỗ trợ hàm điều kiện dựa theo giá trị bộ lọc hiện tại) */
  hidden?: boolean | ((values: T) => boolean);
  /** Bắt buộc chọn / nhập */
  required?: boolean;
  /** Cho phép xóa giá trị (mặc định true) */
  allowClear?: boolean;
  /** Bật tìm kiếm trong dropdown (mặc định true) */
  showSearch?: boolean;
  /** Đánh dấu trường thuộc bộ lọc nâng cao (chỉ hiển thị khi mở nút phễu) */
  isAdvanced?: boolean;
  /** Component tùy biến cho type = 'template' */
  customComponent?:
    | React.ReactNode
    | ((context: {
        value: unknown;
        onChange: (value: unknown) => void;
        values: T;
        disabled?: boolean;
      }) => React.ReactNode);
  /** Class CSS tùy biến cho container trường */
  className?: string;
  /** Style inline tùy biến cho container trường */
  style?: React.CSSProperties;
  /** Props bổ sung cho Input Ant Design */
  inputProps?: Record<string, unknown>;
  /** Props bổ sung cho Select Ant Design */
  selectProps?: Record<string, unknown>;
  /** Props bổ sung cho TreeSelect / OrgUnitTreeSelect */
  treeSelectProps?: Record<string, unknown>;
  /** Props bổ sung cho DatePicker / RangePicker */
  dateProps?: Record<string, unknown>;
  /** Callback kích hoạt khi giá trị của trường thay đổi */
  onValueChange?: (value: unknown, allValues: T) => void;
}

/** Cấu hình nút điều khiển ở thanh footer bộ lọc */
export interface FilterControlOption<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Loại nút điều khiển */
  type: 'reset' | 'search' | 'advance' | 'custom';
  /** Nhãn hiển thị trên nút */
  label?: string;
  /** Icon hiển thị */
  icon?: React.ReactNode;
  /** Tooltip khi hover */
  tooltip?: string;
  /** Vô hiệu hóa nút */
  disabled?: boolean | ((values: T) => boolean);
  /** Ẩn nút */
  hide?: boolean | ((values: T) => boolean);
  /** Hành động khi click nút */
  action?: (filterValues: T) => void;
  /** Class CSS cho nút */
  className?: string;
  /** Style inline cho nút */
  style?: React.CSSProperties;
}

/** Cấu hình tổng thể cho TableFilter (tương đương FilterAndControlConfig của mefobase-core) */
export interface FilterAndControlConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Danh sách các trường bộ lọc */
  filters: FilterOption<T>[];
  /** Danh sách các nút điều khiển (mặc định: Reset tròn + Search viên thuốc + Advance toggle tròn) */
  controls?: FilterControlOption<T>[];
  /** Callback khi bấm tìm kiếm hoặc enter */
  search?: (filterParams: T) => void;
  /** Callback khi bấm làm mới */
  reset?: () => void;
  /** Callback khi có bất kỳ giá trị nào thay đổi */
  onValuesChange?: (changedKey: string, value: unknown, allValues: T) => void;
  /** Bật chức năng lọc nâng cao với nút toggle phễu */
  enableAdvancedFilters?: boolean;
  /** Ẩn nút toggle phễu lọc nâng cao ở thanh footer */
  hideFilterToggle?: boolean;
  /** Ẩn toàn bộ thanh điều khiển (chỉ hiển thị các trường nhập) */
  hideControls?: boolean;
  /** Khoảng cách đẩy xuống từ đỉnh container (px) */
  filterTopOffset?: number;
  /** Trạng thái loading khi đang tìm kiếm */
  loading?: boolean;
  /** Class CSS tùy biến */
  className?: string;
  /** Style inline cho container filter */
  style?: React.CSSProperties;
}

/** Ref handle điều khiển TableFilter từ component cha */
export interface TableFilterRef<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Lấy giá trị hiện tại của bộ lọc */
  getValues: () => T;
  /** Thiết lập giá trị cho các trường */
  setValues: (values: Partial<T>) => void;
  /** Đặt lại bộ lọc về mặc định */
  reset: () => void;
  /** Kích hoạt tìm kiếm */
  submit: () => void;
}
