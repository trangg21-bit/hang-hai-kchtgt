import {
  statusDraft,
  statusAttention,
  statusOperational,
  statusCritical,
  actionPrimary,
} from '../../../themetokenchk';

/**
 * Bản đồ ánh xạ màu trạng thái phê duyệt chuẩn hệ thống Hàng hải KCHTGT.
 */
export const APPROVAL_STATUS_MAP: Record<string, { label: string; color: string }> = {
  ALL: { label: 'Tất cả', color: actionPrimary },
  DRAFT: { label: 'Lưu tạm', color: statusDraft },
  PENDING_APPROVAL: { label: 'Chờ Cảng vụ duyệt', color: statusAttention },
  APPROVED_LEVEL1: { label: 'Chờ Cục duyệt', color: '#0284C7' },
  APPROVED: { label: 'Đã duyệt', color: statusOperational },
  REJECTED_LEVEL1: { label: 'Cảng vụ từ chối', color: statusCritical },
  REJECTED_LEVEL2: { label: 'Cục từ chối', color: statusCritical },
  REJECTED: { label: 'Từ chối', color: statusCritical },
};

/** Alias tương thích cho APPROVAL_STATUS_MAP */
export const APPROVAL_MAP = APPROVAL_STATUS_MAP;

/**
 * Bản đồ ánh xạ tình trạng tài sản.
 */
export const ASSET_CONDITION_MAP: Record<string, { label: string; color: string }> = {
  TOT: { label: 'Tốt', color: statusOperational },
  'Tốt': { label: 'Tốt', color: statusOperational },
  HU_HONG_CAN_SUA_CHUA: { label: 'Hư hỏng cần sửa chữa', color: statusAttention },
  'Hư hỏng cần sửa chữa': { label: 'Hư hỏng cần sửa chữa', color: statusAttention },
  'Hư hỏng cục bộ': { label: 'Hư hỏng cục bộ', color: statusAttention },
  KHONG_SU_DUNG_DUOC: { label: 'Không sử dụng được', color: statusCritical },
  'Không sử dụng được': { label: 'Không sử dụng được', color: statusCritical },
  'Hư hỏng nặng': { label: 'Hư hỏng nặng', color: statusCritical },
};

/**
 * Bản đồ ánh xạ hiện trạng sử dụng tài sản.
 */
export const ASSET_USAGE_STATUS_MAP: Record<string, { label: string; color: string }> = {
  DANG_SU_DUNG: { label: 'Đang sử dụng', color: statusOperational },
  'Đang sử dụng': { label: 'Đang sử dụng', color: statusOperational },
  TAM_DUNG_SU_DUNG: { label: 'Tạm dừng sử dụng', color: statusCritical },
  'Tạm dừng sử dụng': { label: 'Tạm dừng sử dụng', color: statusCritical },
  CHUA_SU_DUNG: { label: 'Chưa sử dụng', color: statusDraft },
  'Chưa sử dụng': { label: 'Chưa sử dụng', color: statusDraft },
};

/**
 * Tổng hợp toàn bộ bản đồ trạng thái mặc định tiện ích cho toàn hệ thống.
 */
export const DEFAULT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  ...APPROVAL_STATUS_MAP,
  ...ASSET_CONDITION_MAP,
  ...ASSET_USAGE_STATUS_MAP,
};
