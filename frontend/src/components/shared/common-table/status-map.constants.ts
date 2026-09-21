import {
  actionPrimary,
  statusAttention,
  statusCritical,
  statusDraft,
  statusOperational,
} from '../../../themetokenchk';

/**
 * Bản đồ ánh xạ màu trạng thái phê duyệt chuẩn hệ thống Hàng hải KCHTGT (chuẩn Khu neo đậu).
 */
export const APPROVAL_STATUS_MAP: Record<string, { label: string; color: string }> = {
  ALL: { label: 'Tất cả', color: actionPrimary },
  all: { label: 'Tất cả', color: actionPrimary },
  'Tất cả': { label: 'Tất cả', color: actionPrimary },
  DRAFT: { label: 'Lưu tạm', color: statusDraft },
  NHAP: { label: 'Lưu tạm', color: statusDraft },
  LUU_TAM: { label: 'Lưu tạm', color: statusDraft },
  'Lưu tạm': { label: 'Lưu tạm', color: statusDraft },
  'LƯU TẠM': { label: 'Lưu tạm', color: statusDraft },
  PENDING: { label: 'Chờ phê duyệt', color: actionPrimary },
  pending: { label: 'Chờ phê duyệt', color: actionPrimary },
  WAITING: { label: 'Chờ phê duyệt', color: actionPrimary },
  waiting: { label: 'Chờ phê duyệt', color: actionPrimary },
  CHO_DUYET: { label: 'Chờ phê duyệt', color: actionPrimary },
  cho_duyet: { label: 'Chờ phê duyệt', color: actionPrimary },
  SUBMITTED: { label: 'Chờ phê duyệt', color: actionPrimary },
  submitted: { label: 'Chờ phê duyệt', color: actionPrimary },
  PROPOSED: { label: 'Chờ phê duyệt', color: actionPrimary },
  proposed: { label: 'Chờ phê duyệt', color: actionPrimary },
  '1': { label: 'Chờ phê duyệt', color: actionPrimary },
  'Chờ phê duyệt': { label: 'Chờ phê duyệt', color: actionPrimary },
  'CHỜ PHÊ DUYỆT': { label: 'Chờ phê duyệt', color: actionPrimary },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  PENDING_LEVEL1: { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  CHO_PHE_DUYET: { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  CHO_DUYET_CAP_1: { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  'Chờ phê duyệt cấp Cảng vụ/Chi cục': { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  'CHỜ PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC': { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  APPROVED_LEVEL1: { label: 'Chờ phê duyệt cấp Cục', color: statusAttention },
  PENDING_LEVEL2: { label: 'Chờ phê duyệt cấp Cục', color: statusAttention },
  CHO_DUYET_CAP_2: { label: 'Chờ phê duyệt cấp Cục', color: statusAttention },
  CHO_PHE_DUYET_CAP_CUC: { label: 'Chờ phê duyệt cấp Cục', color: statusAttention },
  CHO_CUC_DUYET: { label: 'Chờ phê duyệt cấp Cục', color: statusAttention },
  PENDING_DEPARTMENT: { label: 'Chờ phê duyệt cấp Cục', color: statusAttention },
  APPROVED: { label: 'Đã phê duyệt', color: statusOperational },
  APPROVED_LEVEL2: { label: 'Đã phê duyệt', color: statusOperational },
  DA_PHE_DUYET: { label: 'Đã phê duyệt', color: statusOperational },
  DA_DUYET: { label: 'Đã phê duyệt', color: statusOperational },
  '2': { label: 'Đã phê duyệt', color: statusOperational },
  COMPLETED: { label: 'Đã phê duyệt', color: statusOperational },
  'Đã phê duyệt': { label: 'Đã phê duyệt', color: statusOperational },
  'ĐÃ PHÊ DUYỆT': { label: 'Đã phê duyệt', color: statusOperational },
  REJECTED_LEVEL1: { label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  TU_CHOI_CAP_1: { label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  'Từ chối cấp Cảng vụ/Chi cục': { label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  'TỪ CHỐI CẤP CẢNG VỤ/CHI CỤC': { label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  REJECTED_LEVEL2: { label: 'Từ chối cấp Cục', color: statusCritical },
  TU_CHOI_CAP_2: { label: 'Từ chối cấp Cục', color: statusCritical },
  'Từ chối cấp Cục': { label: 'Từ chối cấp Cục', color: statusCritical },
  'TỪ CHỐI CẤP CỤC': { label: 'Từ chối cấp Cục', color: statusCritical },
  REJECTED: { label: 'Từ chối', color: statusCritical },
  TU_CHOI: { label: 'Từ chối', color: statusCritical },
  '3': { label: 'Từ chối', color: statusCritical },
  'Từ chối': { label: 'Từ chối', color: statusCritical },
  'TỪ CHỐI': { label: 'Từ chối', color: statusCritical },
  ARCHIVED: { label: 'Đã xóa', color: statusCritical },
  DA_XOA: { label: 'Đã xóa', color: statusCritical },
  DELETED: { label: 'Đã xóa', color: statusCritical },
  'Đã xóa': { label: 'Đã xóa', color: statusCritical },
  'ĐÃ XÓA': { label: 'Đã xóa', color: statusCritical },
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
