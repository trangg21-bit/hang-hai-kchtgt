import type React from 'react';
import type { FormInstance, Rule } from 'antd/es/form';
import type { Organization } from '../../../services/organizationService';

/**
 * Các loại trường hỗ trợ bởi DynamicFormSidebar.
 * Tuân thủ quy tắc erasableSyntaxOnly: dùng const object + type alias thay cho enum.
 */
export const FormFieldType = {
  Text: 'text',
  Number: 'number',
  Select: 'select',
  TreeSelect: 'treeSelect',
  Date: 'date',
  Year: 'year',
  TextArea: 'textarea',
  Custom: 'custom',
  Readonly: 'readonly',
} as const;

export type FormFieldType = (typeof FormFieldType)[keyof typeof FormFieldType];

/** Cấu hình mục lựa chọn dropdown */
export interface SelectOptionItem {
  label: React.ReactNode;
  value: string | number | boolean;
  disabled?: boolean;
  [key: string]: unknown;
}

/**
 * Cấu hình từng trường nhập liệu trong form (tương tự FormFieldConfig của mefobase-core)
 */
export interface FormFieldConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Tên thuộc tính trong form */
  name: string;
  /** Nhãn hiển thị */
  label: React.ReactNode;
  /** Loại trường nhập liệu */
  type: FormFieldType;
  /** Bắt buộc nhập (tự sinh validation rule nếu chưa cấu hình rules) */
  required?: boolean;
  /** Danh sách validation rules mở rộng */
  rules?: Rule[];
  /** Placeholder hiển thị */
  placeholder?: string;
  /** Vô hiệu hóa trường */
  disabled?: boolean;
  /** Chế độ chỉ đọc */
  readOnly?: boolean;
  /** Số cột lưới Ant Design (1 - 24, mặc định 12 cho form 2 cột) */
  colSpan?: number;
  /** Giá trị khởi tạo */
  initialValue?: unknown;
  /** Danh sách lựa chọn cho type = 'select' */
  options?: SelectOptionItem[];
  /** Cho phép xóa giá trị */
  allowClear?: boolean;
  /** Bật tìm kiếm trong select */
  showSearch?: boolean;
  /** Giá trị nhỏ nhất (cho type = 'number') */
  min?: number;
  /** Giá trị lớn nhất (cho type = 'number') */
  max?: number;
  /** Hàm định dạng số hiển thị */
  formatter?: (value: unknown) => string;
  /** Hàm parse số từ chuỗi nhập vào */
  parser?: (value: string | undefined) => unknown;
  /** Định dạng ngày hiển thị (VD: 'DD/MM/YYYY', 'YYYY') */
  format?: string;
  /** Chế độ chọn ngày (VD: 'date', 'year', 'month') */
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year';
  /** Props tùy biến cho DatePicker */
  datePickerProps?: Record<string, unknown>;
  /** Số dòng hiển thị cho type = 'textarea' */
  rows?: number;
  /** Danh sách đơn vị cây cho type = 'treeSelect' */
  organizations?: Organization[];
  /** Props tùy biến cho OrgUnitTreeSelect */
  treeSelectProps?: Record<string, unknown>;
  /** Callback tính toán giá trị tự động (cho computed/readonly fields) */
  computedValue?: (form: FormInstance<T>, values: T) => unknown;
  /** Định dạng hiển thị giá trị chỉ đọc */
  valueFormatter?: (value: unknown) => React.ReactNode;
  /** Render thành phần tùy biến (cho type = 'custom') */
  customRender?: (context: {
    form: FormInstance<T>;
    field: FormFieldConfig<T>;
    values: T;
  }) => React.ReactNode;
  /** Ẩn trường điều kiện */
  hidden?: boolean | ((form: FormInstance<T>, values: T) => boolean);
  /** Danh sách các trường phụ thuộc để re-render / re-validate */
  dependencies?: string[];
  /** Style inline cho container Form.Item */
  itemStyle?: React.CSSProperties;
  /** Style inline cho ô input / control */
  controlStyle?: React.CSSProperties;
}

/**
 * Cấu hình nhóm trường (Section) trong form
 */
export interface FormSectionConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Định danh duy nhất của section */
  key?: string;
  /** Tiêu đề section */
  title?: React.ReactNode;
  /** Icon tiêu đề */
  icon?: React.ReactNode;
  /** Danh sách trường trong section */
  fields: FormFieldConfig<T>[];
  /** Thành phần bổ sung góc phải header section */
  headerExtra?: React.ReactNode;
  /** Style inline cho section box */
  style?: React.CSSProperties;
  /** Ẩn section điều kiện */
  hidden?: boolean | ((form: FormInstance<T>, values: T) => boolean);
}

/**
 * Cấu hình Tab trong form
 */
export interface FormTabConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Mã định danh tab */
  key: string;
  /** Tiêu đề tab */
  label: React.ReactNode;
  /** Icon tiêu đề tab */
  icon?: React.ReactNode;
  /** Các section trong tab */
  sections?: FormSectionConfig<T>[];
  /** Các field trực tiếp trong tab nếu không chia section */
  fields?: FormFieldConfig<T>[];
  /** Nội dung tùy biến hoàn toàn cho tab (vd: danh sách tệp đính kèm) */
  customContent?: React.ReactNode | ((context: { form: FormInstance<T>; values: T }) => React.ReactNode);
}

/**
 * Cấu hình nút hành động ở footer sidebar
 */
export interface FormSidebarAction {
  /** Key hành động */
  key: string;
  /** Nhãn nút */
  label: React.ReactNode;
  /** Loại nút Ant Design */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  /** Biến thể style ngữ nghĩa */
  variant?: 'primary' | 'outline' | 'success' | 'danger' | 'default';
  /** Icon nút */
  icon?: React.ReactNode;
  /** Trạng thái loading */
  loading?: boolean;
  /** Vô hiệu hóa nút */
  disabled?: boolean;
  /** Ẩn nút */
  hidden?: boolean;
  /** Callback click */
  onClick?: () => void | Promise<void>;
  /** Class CSS tùy biến */
  className?: string;
  /** Style inline tùy biến */
  style?: React.CSSProperties;
}

/**
 * Props cho component DynamicFormSidebar
 */
export interface DynamicFormSidebarProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Trạng thái hiển thị drawer */
  open: boolean;
  /** Tiêu đề drawer */
  title: React.ReactNode;
  /** Callback đóng drawer */
  onClose: () => void;
  /** Instance của form (nếu không truyền sẽ dùng form nội bộ) */
  form?: FormInstance<T>;
  /** Giá trị ban đầu của form */
  initialValues?: Partial<T>;
  /** Chiều rộng drawer hoặc size responsive ('sm' | 'md' | 'lg' | 'xl' | 'full' | number | string) */
  width?: string | number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | string | number;
  /** Cấu hình các tab */
  tabs?: FormTabConfig<T>[];
  /** Cấu hình các section (nếu form không chia tab) */
  sections?: FormSectionConfig<T>[];
  /** Cấu hình các field phẳng (nếu form không chia tab và không chia section) */
  fields?: FormFieldConfig<T>[];
  /** Danh sách nút hành động ở chân drawer */
  footerActions?: FormSidebarAction[];
  /** Căn chỉnh vị trí các nút ở chân drawer: 'center' (mặc định), 'left', 'right' */
  footerAlign?: 'left' | 'center' | 'right';
  /** Custom footer node (ghi đè footerActions nếu truyền) */
  footer?: React.ReactNode;
  /** Callback submit form */
  onSubmit?: (values: T) => void | Promise<void>;
  /** Callback khi bất kỳ trường nào thay đổi */
  onValuesChange?: (changedValues: Partial<T>, allValues: T) => void;
  /** Hủy component con khi ẩn drawer */
  destroyOnClose?: boolean;
  /** Class CSS root của drawer */
  rootClassName?: string;
  /** Class CSS của drawer */
  className?: string;
  /** Trạng thái loading toàn form */
  loading?: boolean;
}
