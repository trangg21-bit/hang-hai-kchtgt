import React from 'react';

/**
 * Các loại định dạng cột chuẩn được hỗ trợ bởi CommonTable.
 * Tương thích theo pattern TableColumnType của mefobase-core,
 * được mở rộng cho React + Ant Design của dự án Hàng hải KCHTGT.
 */
export const TableColumnType = {
  /** Văn bản thông thường, tự động cắt dấu ba chấm ... và hiển thị tooltip khi hover */
  Text: 'text',
  /** Văn bản mô tả dài, cắt dấu ba chấm kèm tooltip */
  Description: 'description',
  /**
   * Cột hiển thị 2 dòng (Two-line cell chuẩn màn KCHT):
   * Dòng 1: Tiêu đề in đậm (ví dụ Tên tài sản)
   * Dòng 2: Mã/thông tin phụ mờ (ví dụ Mã tài sản, Thời gian)
   */
  TwoLine: 'twoLine',
  /** Cột hiển thị Pill Badge bo tròn 2 đầu (radiusPill 999px) theo chuẩn UI Hàng hải */
  Status: 'status',
  /** Định dạng ngày tháng: DD/MM/YYYY */
  Date: 'date',
  /** Định dạng ngày giờ: DD/MM/YYYY HH:mm:ss */
  DateTime: 'datetime',
  /** Định dạng số thuần */
  Number: 'number',
  /** Định dạng số có dấu phân cách hàng nghìn (1,000 / 1.000) */
  NumberFormatted: 'numberFormatted',
  /** Định dạng tiền tệ VNĐ (ví dụ: 1.500.000 đ) */
  Money: 'money',
  /** Custom render tự do qua JSX template / render function */
  Template: 'template',
} as const;

export type TableColumnType = (typeof TableColumnType)[keyof typeof TableColumnType];

/**
 * Cấu hình cho từng cột của CommonTable.
 */
export interface TableColumnOption<T = Record<string, unknown>> {
  /** Loại cột hiển thị */
  type: TableColumnType;
  /**
   * Tiêu đề hiển thị trên header cột.
   * Có thể truyền string, hàm trả về string hoặc ReactNode.
   * Header luôn được cấp đủ bề rộng hiển thị 100% chữ, tuyệt đối không bị cắt "...".
   */
  title: string | (() => string) | React.ReactNode;
  /** Nhãn cột (alias cho title) */
  label?: string;
  /** Tên trường dữ liệu trong object bản ghi */
  dataIndex?: keyof T | string;
  /** Tên trường phụ hiển thị ở dòng 2 (cho TwoLine) */
  subField?: string;
  /** Tên trường phụ (alias cho subField) */
  subDataIndex?: string;
  /** Format ngày giờ hiển thị cho dòng phụ (TwoLine) */
  subFormat?: string;
  /** Hàm trích xuất giá trị chính từ bản ghi (dùng khi dữ liệu phức tạp hoặc cần tính toán) */
  valueRef?: (row: T, index?: number) => unknown;
  /**
   * Hàm trích xuất giá trị dòng 2 (chỉ dùng cho type: TwoLine).
   * Ví dụ: trích xuất mã tài sản khi dòng 1 là tên tài sản.
   */
  subValueRef?: (row: T, index?: number) => unknown;
  /** Bề rộng cột cố định (px hoặc '250px'). Sẽ tự động mở rộng nếu nhỏ hơn độ rộng tiêu đề */
  width?: number | string;
  /** Bề rộng tối thiểu */
  minWidth?: number;
  /** Bề rộng tối đa */
  maxWidth?: number;
  /** Căn lề nội dung: trái (mặc định), giữa, phải */
  align?: 'left' | 'center' | 'right';
  /** Cho phép sắp xếp cột */
  allowSort?: boolean;
  /** Tên trường gửi lên server khi sắp xếp (mặc định bằng dataIndex) */
  sortField?: string;
  /** Sorter function client-side (nếu tự sắp xếp) hoặc boolean */
  sorter?: boolean | ((a: T, b: T) => number);
  /** Chữ in đậm */
  bold?: boolean;
  /** Hiển thị tooltip khi rê chuột vào (mặc định true) */
  showTooltip?: boolean;
  /** Cắt ngắn văn bản nếu tràn ô (mặc định true) */
  ellipsis?: boolean;
  /**
   * Bản đồ ánh xạ giá trị trạng thái -> nhãn hiển thị và màu semantic.
   * Dùng cho type: Status.
   */
  statusMapping?: Record<string, { label: string; color: string }> | Array<{
    value: unknown;
    label?: string;
    color?: string;
    colorClass?: string;
  }>;
  /** Ánh xạ dữ liệu chung */
  dataMapping?: Array<{
    value: unknown;
    label?: string;
    color?: string;
  }>;
  /** Custom render function linh hoạt */
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  /** Sự kiện click vào ô (ví dụ click vào Tên để mở Drawer chi tiết) */
  onClick?: (row: T) => void;
  /** Hàm sinh tooltip title tùy biến cho ô */
  cellTitle?: (row: T) => string;
  /** Ẩn cột theo điều kiện */
  hide?: boolean | ((row?: T) => boolean);
  /** Cố định cột sang trái hoặc phải */
  fixed?: 'left' | 'right';
  /** Custom class cho ô nội dung */
  customClass?: (row?: T) => string;
  /** Custom class cho ô header */
  customClassHeader?: () => string;
  /** Chuỗi format ngày tháng (mặc định 'DD/MM/YYYY' cho Date, 'DD/MM/YYYY HH:mm:ss' cho DateTime) */
  format?: string;
}

/**
 * Cấu hình hành động trên từng dòng (Action Menu / Button).
 */
export interface TableActionOption<T = Record<string, unknown>> {
  /** Tên hành động hiển thị trên menu */
  title?: string;
  /** Nhãn hành động (alias cho title) */
  label?: string;
  /** Icon Ant Design */
  icon?: React.ReactNode;
  /** URL ảnh icon */
  iconSrc?: string;
  /** Hành động nguy hiểm (chữ đỏ, ví dụ nút Xóa) */
  danger?: boolean;
  /** Vô hiệu hóa hành động */
  disabled?: boolean | ((row: T) => boolean);
  /** Ẩn hành động theo điều kiện bản ghi hoặc quyền */
  hide?: (row: T) => boolean;
  /** Hàm xử lý khi người dùng chọn hành động */
  executeAsync?: (row: T) => void | Promise<void>;
  /** Hàm xử lý khi click (alias cho executeAsync) */
  onClick?: (row: T) => void | Promise<void>;
  /** Custom class CSS cho action */
  customClass?: string;
}

/**
 * Request tìm kiếm / phân trang chuẩn tương thích mefobase-core.
 */
export class BaseSearchRequest {
  maxResultCount: number = 20;
  skipCount: number = 0;
  sorting?: string = '';
  [key: string]: unknown;

  constructor(init?: Partial<BaseSearchRequest>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}

/**
 * Response kết quả tìm kiếm / phân trang chuẩn tương thích mefobase-core.
 */
export class BaseSearchResponse<T = Record<string, unknown>> {
  totalCount: number;
  items: T[];
  pageSize?: number;
  pageIndex?: number;

  constructor(totalCount: number, items: T[], pageSize?: number, pageIndex?: number) {
    this.totalCount = totalCount;
    this.items = [...(items || [])];
    this.pageSize = pageSize;
    this.pageIndex = pageIndex;
  }
}

/**
 * Cấu hình bảng tổng thể TableOption — Tương thích hoàn toàn kiến trúc mefobase-core.
 */
export interface TableOption<T = Record<string, unknown>> {
  /** Danh sách cấu hình các cột chính hiển thị trên bảng (chuẩn mefobase-core) */
  mainColumns: TableColumnOption<T>[];
  /**
   * Danh sách hành động trên dòng (xem chi tiết, sửa, xóa...).
   * Có thể truyền mảng tĩnh hoặc hàm trả về mảng dựa trên từng bản ghi.
   */
  actions?: TableActionOption<T>[] | ((row: T) => TableActionOption<T>[]);
  /**
   * Hiển thị action dưới dạng dropdown menu 3 chấm tròn (mặc định: true).
   * Nếu false: hiển thị các nút bấm trực tiếp trên cột.
   */
  isDropdownAction?: boolean;
  /** Ẩn cột STT tự động (mặc định: false — luôn tự động sinh cột STT liên tục qua các trang) */
  hideSttColumn?: boolean;
  /** Ẩn cột hành động (mặc định: false) */
  hideActionColumn?: boolean;
  /** Bật tính năng chọn dòng qua checkbox */
  enableSelection?: boolean;
  /** Chế độ chọn: 'single' (chỉ chọn 1) hoặc 'multiple' (chọn nhiều - mặc định) */
  selectionMode?: 'single' | 'multiple';
  /** Tên trường khóa duy nhất để định danh bản ghi (mặc định 'id') */
  dataKey?: keyof T | string;
  /** Danh sách các bản ghi đã chọn (hoặc bản ghi đơn nếu single) */
  selectedItems?: T[] | T;
  /** Callback khi danh sách chọn thay đổi */
  selectionChange?: (items: T[] | T) => void;
  /** Hàm lọc cho phép/không cho phép chọn dòng cụ thể */
  customSelectionFilter?: (row: T) => boolean;
  /** Cấu hình sắp xếp mặc định */
  defaultSort?: {
    field: string;
    order?: 'ascend' | 'descend' | 1 | -1;
  };
  /**
   * Service Provider tự động gọi API lấy dữ liệu (Pattern chuẩn mefobase-core).
   * Khi truyền serviceProvider, CommonTable sẽ tự động xử lý paging, sorting và reload.
   */
  serviceProvider?: {
    searchAsync: (request: BaseSearchRequest) => Promise<BaseSearchResponse<T> | { items: T[]; totalCount: number }>;
  };
  /** Không tự động gọi API khi khởi tạo lần đầu (mặc định false) */
  disableInitialSearch?: boolean;
  /** Bật phân trang tích hợp (mặc định true) */
  enablePaging?: boolean;
  /** Số bản ghi trên mỗi trang mặc định (mặc định 20) */
  pageSize?: number;
  /** Các tùy chọn số bản ghi trên trang (mặc định [20, 50, 100, 5000]) */
  pageSizeOptions?: number[];
  /** Chiều cao offset tính từ đỉnh màn hình để khóa cứng chiều cao cuộn (ví dụ: calc(100vh - 300px)) */
  offset?: number;
  /** Cấu hình cuộn (x: 'max-content', y: scrollY) */
  scroll?: { x?: number | string; y?: number | string };
  /** Kẻ viền bảng */
  bordered?: boolean;
  /** Nội dung rỗng tùy biến */
  emptyText?: React.ReactNode;
}

/**
 * Interface cho ref điều khiển CommonTable từ bên ngoài.
 */
export interface CommonTableRef<T = Record<string, unknown>> {
  /** Tải lại dữ liệu (tùy chọn reset về trang 1) */
  reload: (resetPaging?: boolean) => Promise<void>;
  /** Lấy danh sách bản ghi đang được chọn */
  getSelectedItems: () => T[];
  /** Đặt danh sách bản ghi được chọn */
  setSelectedItems: (items: T[]) => void;
  /** Chuyển sang trang chỉ định */
  setPage: (page: number) => void;
  /** Đặt kích thước trang */
  setPageSize: (size: number) => void;
  /** Lấy trang hiện tại */
  getCurrentPage: () => number;
  /** Lấy kích thước trang hiện tại */
  getPageSize: () => number;
  /** Lấy tổng số bản ghi */
  getTotal: () => number;
  /** Lấy toàn bộ bản ghi đang hiển thị trên trang */
  getRecords: () => T[];
  /** Cập nhật bộ lọc tìm kiếm và tải lại */
  setFilters: (filters: Record<string, unknown>) => void;
}
