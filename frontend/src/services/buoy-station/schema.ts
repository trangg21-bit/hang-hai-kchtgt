// ── BuoyStation feature schema — shared constants + zod validation ──
// Chuẩn cấu trúc /services/buoy/schema.ts: mọi OPTIONS/MAP dùng chung tập trung
// tại đây (Form + List + Detail + Lịch sử import chung, không khai báo trùng).

import { z } from 'zod';
import { BUOY_TYPE_OPTIONS, BUOY_TYPE_MAP } from '../../types/beacon';
import {
  statusOperational, statusAttention, statusCritical, statusDraft, actionPrimary, textTertiary,
} from '../../tokens';

export { BUOY_TYPE_OPTIONS, BUOY_TYPE_MAP };

// ── Options ────────────────────────────────────────────────────────────

export const COLOR_OPTIONS = [
  { value: 'RED', label: 'Đỏ' }, { value: 'GREEN', label: 'Xanh lá' },
  { value: 'BLACK_RED', label: 'Đen + Đỏ' }, { value: 'BLACK_YELLOW', label: 'Đen + Vàng' },
  { value: 'WHITE', label: 'Trắng' }, { value: 'YELLOW', label: 'Vàng' }, { value: 'ORANGE', label: 'Cam' },
];
export const SHAPE_OPTIONS = [
  { value: 'CAN', label: 'Hình trụ' }, { value: 'CONE', label: 'Hình nón' },
  { value: 'SPAR', label: 'Trụ' }, { value: 'BELL', label: 'Chuông' },
  { value: 'BUCKET', label: 'Gáo' }, { value: 'TUBULAR', label: 'Ống' },
];
export const LIGHT_CHAR_OPTIONS = [
  { value: 'FL', label: 'FL - Chớp đơn' }, { value: 'FL(2)', label: 'FL(2) - Chớp nhóm 2' },
  { value: 'FL(3)', label: 'FL(3) - Chớp nhóm 3' }, { value: 'Iso', label: 'Iso - Đồng pha' },
  { value: 'Q', label: 'Q - Chớp nhanh' }, { value: 'VQ', label: 'VQ - Chớp rất nhanh' },
  { value: 'Oc', label: 'Oc - Huyền phù' }, { value: 'F', label: 'F - Cố định' },
];
export const GEOMETRY_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];
export const COORD_SYS_OPTIONS = [
  { value: 'WGS84', label: 'WGS-84' },
  { value: 'VN2000', label: 'VN-2000' },
];
export const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

// ── Label maps (hiển thị + lịch sử) ───────────────────────────────────

export const COLOR_MAP: Record<string, string> = {
  RED: 'Đỏ', GREEN: 'Xanh lá', BLACK_RED: 'Đen+Đỏ', BLACK_YELLOW: 'Đen+Vàng',
  WHITE: 'Trắng', YELLOW: 'Vàng', ORANGE: 'Cam',
};
export const SHAPE_MAP: Record<string, string> = {
  CAN: 'Hình trụ', CONE: 'Hình nón', SPAR: 'Trụ', BELL: 'Chuông',
  BUCKET: 'Gáo', TUBULAR: 'Ống',
};
export const LIGHT_MAP: Record<string, string> = {
  FL: 'FL - Chớp đơn', 'FL(2)': 'FL(2) - Chớp nhóm 2', 'FL(3)': 'FL(3) - Chớp nhóm 3',
  Iso: 'Iso - Đồng pha', Q: 'Q - Chớp nhanh', VQ: 'VQ - Chớp rất nhanh',
  Oc: 'Oc - Huyền phù', F: 'F - Cố định',
};
export const GEO_MAP: Record<string, string> = {
  POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng',
};
export const COORD_MAP: Record<string, string> = { WGS84: 'WGS-84', VN2000: 'VN-2000' };

// ── Trạng thái phê duyệt (cùng quy ước Quản lý phao tiêu) ─────────────

export const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_L1: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED_L2: { color: statusAttention, label: 'Đã phê duyệt' },
  PUBLISHED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_L1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_L2: { color: statusCritical, label: 'Từ chối cấp cục' },
  DELETED: { color: textTertiary, label: 'Đã xóa' },
};

export const APPROVAL_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Lưu tạm' },
  { value: 'PENDING_APPROVAL', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  { value: 'APPROVED_L1', label: 'Chờ phê duyệt cấp cục' },
  { value: 'PUBLISHED', label: 'Đã phê duyệt' },
  { value: 'REJECTED', label: 'Từ chối cấp Cảng vụ/Chi cục' },
  { value: 'REJECTED_L1', label: 'Từ chối cấp Cảng vụ/Chi cục' },
  { value: 'REJECTED_L2', label: 'Từ chối cấp cục' },
];

export const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  { key: 'APPROVED_L1', label: 'Chờ phê duyệt cấp cục', color: statusAttention },
  { key: 'PUBLISHED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED_L1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  { key: 'REJECTED_L2', label: 'Từ chối cấp cục', color: statusCritical },
];

// ── Nhãn trường cho lịch sử thay đổi ──────────────────────────────────

export const STATION_FIELD_MAP: Record<string, string> = {
  name: 'Tên nhà trạm', code: 'Mã nhà trạm', type: 'Loại',
  color: 'Màu sắc', shape: 'Hình dạng', lightCharacteristic: 'Đặc tính ánh sáng',
  range: 'Tầm xa', description: 'Mô tả', unitId: 'Đơn vị quản lý',
  operatingOrgId: 'ĐV khai thác', portId: 'Cảng biển', waterwayId: 'Tuyến đường thủy',
  waterwayRouteId: 'Tuyến luồng', province: 'Tỉnh/TP', address: 'Địa chỉ',
  constructionDate: 'Thời điểm XD', totalArea: 'Tổng diện tích', usableArea: 'Diện tích SD',
  staffCount: 'Nhân sự', lastMaintenanceYear: 'Năm BT gần nhất', note: 'Ghi chú',
  geometryType: 'Loại đối tượng', icon: 'Biểu tượng', coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị', lastInspectionDate: 'KT gần nhất',
  nextInspectionDate: 'KT kế tiếp', lastRepairDate: 'Sửa chữa gần nhất',
  condition: 'Tình trạng', isActive: 'Hoạt động', status: 'Trạng thái', approvalStatus: 'Trạng thái duyệt',
  rejectionReason: 'Lý do từ chối', approvalLevel: 'Cấp duyệt',
  approvedDate: 'Ngày duyệt', approvedBy: 'Người duyệt',
  level1ApprovedBy: 'Người duyệt Cảng vụ', level1ApprovedDate: 'Ngày duyệt Cảng vụ',
  level2ApprovedBy: 'Người duyệt Cục', level2ApprovedDate: 'Ngày duyệt Cục',
  sentApprovedBy: 'Người gửi duyệt', sentApprovedDate: 'Ngày gửi duyệt',
  createdByName: 'Người tạo', updatedByName: 'Người cập nhật',
  spatialId: 'Vị trí GIS', provinceId: 'Tỉnh/TP',
};

// ── Zod validation (chuẩn /services/buoy/schema.ts) ───────────────────

export const rejectSchema = z.object({
  rejectReason: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập lý do từ chối')
    .min(10, 'Lý do từ chối tối thiểu 10 ký tự')
    .max(500, 'Lý do từ chối tối đa 500 ký tự'),
});

export type RejectFormValues = z.infer<typeof rejectSchema>;

export const deleteConfirmSchema = z
  .string()
  .trim()
  .min(1, 'Nhập đúng tên nhà trạm hoặc gõ "XÓA" để xác nhận');
