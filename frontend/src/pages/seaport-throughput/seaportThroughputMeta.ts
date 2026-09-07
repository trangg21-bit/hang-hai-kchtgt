/**
 * Bộ meta dùng chung cho màn hình Sản lượng cảng biển (M-028 / F-301 seaport_throughput).
 * EN identifiers / VI labels — theo feature-brief §2 (29 trường) + design-plan §2.3.
 */
import {
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  statusInfo,
  textTertiary,
  actionPrimary,
} from '../../themetokenchk';
import type { SeaportApprovalStatus } from '../../services/seaportThroughputService';

export interface ThroughputFieldDef {
  /** Tên trường EN (khớp DTO camelCase của 24 cột DECIMAL). */
  name: string;
  /** Nhãn tiếng Việt hiển thị trên form/xem chi tiết. */
  label: string;
  /** Số nguyên (passenger_trips) hay số thập phân (chỉ tiêu tấn). */
  integer?: boolean;
}

export interface ThroughputGroupDef {
  key: string;
  title: string;
  fields: ThroughputFieldDef[];
}

const cargoLabels: Array<{ suffix: string; tonLabel: string; tonKmLabel: string }> = [
  { suffix: 'Container', tonLabel: 'Hàng container (Tấn)', tonKmLabel: 'Hàng container (Tấn - Km)' },
  { suffix: 'Dry', tonLabel: 'Hàng khô (Tấn)', tonKmLabel: 'Hàng khô (Tấn - Km)' },
  { suffix: 'Liquid', tonLabel: 'Hàng lỏng (Tấn)', tonKmLabel: 'Hàng lỏng (Tấn - Km)' },
  { suffix: 'Other', tonLabel: 'Hàng khác (Tấn)', tonKmLabel: 'Hàng khác (Tấn - Km)' },
];

const groupFields = (prefix: 'domestic' | 'foreign' | 'route'): ThroughputFieldDef[] =>
  cargoLabels.flatMap((c) => [
    { name: `${prefix}${c.suffix}Ton`, label: c.tonLabel },
    { name: `${prefix}${c.suffix}TonKm`, label: c.tonKmLabel },
  ]);

/** 3 nhóm chỉ tiêu × 8 ô InputDecimal — khớp feature-brief §2 STT 4–27. */
export const THROUGHPUT_GROUPS: ThroughputGroupDef[] = [
  { key: 'domestic', title: 'Sản lượng vận tải trong nước', fields: groupFields('domestic') },
  { key: 'foreign', title: 'Sản lượng vận tải nước ngoài', fields: groupFields('foreign') },
  { key: 'route', title: 'Sản lượng theo tuyến vận chuyển', fields: groupFields('route') },
];

/** Danh sách phẳng 24 trường DECIMAL (dùng để gán mặc định 0 / chuẩn hóa payload). */
export const NUMBER_FIELD_NAMES: string[] = THROUGHPUT_GROUPS.flatMap((g) =>
  g.fields.map((f) => f.name),
);

export const PASSENGER_FIELD: ThroughputFieldDef = { name: 'passengerTrips', label: 'Lượt hành khách', integer: true };
export const NOTE_LABEL = 'Ghi chú';
export const ORG_LABEL = 'Đơn vị quản lý';
export const MONTH_LABEL = 'Thời gian tổng hợp sản lượng';

export interface StatusMeta {
  label: string;
  color: string;
}

/** Nhãn badge module (map local — design-plan §2.3). */
export const STATUS_META: Record<SeaportApprovalStatus, StatusMeta> = {
  DRAFT: { label: 'Lưu tạm', color: statusDraft },
  PENDING_APPROVAL: { label: 'Chờ Cảng vụ duyệt', color: statusAttention },
  APPROVED_LEVEL1: { label: 'Chờ Cục duyệt', color: statusInfo },
  APPROVED: { label: 'Ban hành', color: statusOperational },
  REJECTED_LEVEL1: { label: 'Từ chối Cảng vụ', color: statusCritical },
  REJECTED_LEVEL2: { label: 'Từ chối Cục', color: statusCritical },
  ARCHIVED: { label: 'Đã xóa', color: textTertiary },
};

export type ThroughputTabKey = 'all' | SeaportApprovalStatus | 'REJECTED';

export interface ThroughputTabDef {
  key: ThroughputTabKey;
  label: string;
  color: string;
  /** Giá trị lọc approvalStatus gửi lên API. */
  queryStatus?: SeaportApprovalStatus | 'REJECTED';
}

/** 6 tab chuẩn: Tất cả = tổng 5 tab con; Từ chối gộp 2 cấp. */
export const TAB_DEFS: ThroughputTabDef[] = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft, queryStatus: 'DRAFT' },
  { key: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt', color: statusAttention, queryStatus: 'PENDING_APPROVAL' },
  { key: 'APPROVED_LEVEL1', label: 'Chờ Cục duyệt', color: statusInfo, queryStatus: 'APPROVED_LEVEL1' },
  { key: 'APPROVED', label: 'Ban hành', color: statusOperational, queryStatus: 'APPROVED' },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical, queryStatus: 'REJECTED' },
];

/** Trạng thái nào cho phép Sửa / Xóa / Gửi phê duyệt từ màn danh sách. */
export const EDITABLE_STATUSES: SeaportApprovalStatus[] = ['DRAFT', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2'];

/** Bản đồ tên trường EN → nhãn VI dùng cho Lịch sử thay đổi. */
export const HISTORY_FIELD_LABELS: Record<string, string> = {
  orgUnitId: ORG_LABEL,
  reportMonth: MONTH_LABEL,
  note: NOTE_LABEL,
  passengerTrips: PASSENGER_FIELD.label,
  approvalStatus: 'Trạng thái phê duyệt',
  submissionReason: 'Lý do gửi phê duyệt',
  ...Object.fromEntries(
    THROUGHPUT_GROUPS.flatMap((g) => g.fields.map((f) => [f.name, f.label] as const)),
  ),
};
