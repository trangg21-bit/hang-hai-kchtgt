import type React from 'react';

/** Khóa trạng thái phê duyệt chuẩn 8 tab */
export type ApprovalStatusKey =
  | 'all'
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED_LEVEL1'
  | 'APPROVED'
  | 'REJECTED_LEVEL1'
  | 'REJECTED_LEVEL2'
  | 'ARCHIVED'
  | string;

/** Cấu hình từng tab trạng thái */
export interface CommonStatusTabItem {
  /** Mã định danh tab */
  key: string;
  /** Nhãn hiển thị của tab */
  label: string;
  /** Mã màu semantic hiển thị badge */
  color: string;
  /** Số lượng bản ghi */
  count?: number;
  /** Trạng thái active hiện tại */
  active?: boolean;
  /** Giá trị gửi lên API search (undefined cho 'all') */
  queryStatus?: string;
}

/** Props của component CommonStatusTabs */
export interface CommonStatusTabsProps {
  /** Tab đang được chọn (mặc định 'all') */
  activeKey?: string;
  /** Callback khi người dùng chuyển tab (trả về tabKey và queryStatus để truyền vào filter API) */
  onChange?: (key: string, queryStatus?: string) => void;
  /** Bảng số lượng bản ghi theo từng trạng thái (từ API count hoặc state) */
  counts?: Record<string, number>;
  /** Danh sách dữ liệu bản ghi để component tự động gom nhóm tính số lượng (nếu không truyền counts) */
  dataSource?: readonly Record<string, unknown>[];
  /** Tên trường trạng thái trong dataSource để tự động đếm (mặc định 'approvalStatus') */
  statusField?: string;
  /** Danh sách cấu hình tab tùy biến (nếu muốn thay thế 8 tab mặc định) */
  customTabs?: CommonStatusTabItem[];
  /** Tự động ẩn tab nếu số lượng = 0 (mặc định false) */
  hideZeroCount?: boolean;
  /** Class CSS tùy biến */
  className?: string;
  /** Style inline cho thanh tab container */
  style?: React.CSSProperties;
}

/**
 * Danh sách 8 tab trạng thái phê duyệt chuẩn hệ thống Hàng hải KCHTGT (chuẩn Quản lý khu neo đậu)
 * 1. Tất cả (#0E6FD6)
 * 2. Lưu tạm (#93A3B3)
 * 3. Chờ phê duyệt cấp Cảng vụ/Chi cục (#204E9C)
 * 4. Chờ phê duyệt cấp Cục (#EDA100)
 * 5. Đã phê duyệt (#1BAF7A)
 * 6. Từ chối cấp Cảng vụ/Chi cục (#E34948)
 * 7. Từ chối cấp Cục (#E34948)
 * 8. Đã xóa (#E34948)
 */
export const STANDARD_APPROVAL_TABS: readonly Omit<CommonStatusTabItem, 'count' | 'active'>[] = [
  {
    key: 'all',
    label: 'Tất cả',
    color: '#0E6FD6',
    queryStatus: undefined,
  },
  {
    key: 'DRAFT',
    label: 'Lưu tạm',
    color: '#93A3B3',
    queryStatus: 'DRAFT',
  },
  {
    key: 'PENDING_APPROVAL',
    label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
    color: '#204E9C',
    queryStatus: 'PENDING_APPROVAL',
  },
  {
    key: 'APPROVED_LEVEL1',
    label: 'Chờ phê duyệt cấp Cục',
    color: '#EDA100',
    queryStatus: 'APPROVED_LEVEL1',
  },
  {
    key: 'APPROVED',
    label: 'Đã phê duyệt',
    color: '#1BAF7A',
    queryStatus: 'APPROVED',
  },
  {
    key: 'REJECTED_LEVEL1',
    label: 'Từ chối cấp Cảng vụ/Chi cục',
    color: '#E34948',
    queryStatus: 'REJECTED_LEVEL1',
  },
  {
    key: 'REJECTED_LEVEL2',
    label: 'Từ chối cấp Cục',
    color: '#E34948',
    queryStatus: 'REJECTED_LEVEL2',
  },
  {
    key: 'ARCHIVED',
    label: 'Đã xóa',
    color: '#E34948',
    queryStatus: 'ARCHIVED',
  },
];
