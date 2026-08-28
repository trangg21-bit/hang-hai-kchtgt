import {
  statusAttention,
  statusOperational,
  statusCritical,
  statusDraft,
  textTertiary,
} from '../../tokens';
import { normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import { useThemeToken } from '../../context/ThemeTokenContext';

export type ApprovalStatusType = 'PROPOSED' | 'PENDING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | string;

interface ApprovalStatusBadgeProps {
  status: ApprovalStatusType;
  size?: 'default' | 'small';
}

/**
 * Nhãn + màu chuẩn của 7 trạng thái phê duyệt (approval-2-level-spec.md mục 3.1).
 *
 * Đây là nguồn duy nhất cho nhãn trạng thái trên toàn hệ thống. Màn hình nào cần
 * nhãn/màu (badge, bộ lọc, tab, xuất Excel, nhật ký) đều lấy từ đây, KHÔNG tự khai
 * map riêng — trước đây mỗi màn một map nên phát sinh nhãn lệch ("Nháp", "Chờ phê
 * duyệt", "Đã phê duyệt") và thiếu mã khiến giao diện lòi ra chuỗi thô kiểu
 * `REJECTED_LEVEL1`.
 */
export const APPROVAL_STATUS_STYLE: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Lưu tạm', color: statusDraft },
  PENDING_APPROVAL: { label: 'Chờ Cảng vụ duyệt', color: statusAttention },
  APPROVED_LEVEL1: { label: 'Chờ Cục duyệt', color: '#0284C7' },
  REJECTED_LEVEL1: { label: 'Cảng vụ trả về', color: statusCritical },
  REJECTED_LEVEL2: { label: 'Cục trả về', color: statusCritical },
  APPROVED: { label: 'Đã duyệt', color: statusOperational },
  ARCHIVED: { label: 'Đã xóa', color: textTertiary },
};

/** Nhãn tiếng Việt của một mã trạng thái (chấp nhận cả mã legacy). */
export function approvalStatusLabel(status?: string | null): string {
  if (!status) return '—';
  return APPROVAL_STATUS_STYLE[normalizeApprovalStatus(status)]?.label || String(status);
}

/** Màu semantic của một mã trạng thái (chấp nhận cả mã legacy). */
export function approvalStatusColor(status?: string | null): string {
  if (!status) return textTertiary;
  return APPROVAL_STATUS_STYLE[normalizeApprovalStatus(status)]?.color || textTertiary;
}

/** Danh sách option cho bộ lọc/dropdown trạng thái — đúng thứ tự vòng đời hồ sơ. */
export const APPROVAL_STATUS_OPTIONS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED_LEVEL1',
  'APPROVED',
  'REJECTED_LEVEL1',
  'REJECTED_LEVEL2',
].map((value) => ({ value, label: APPROVAL_STATUS_STYLE[value].label }));

/** Trạng thái → tên token màu, để badge đổi theo bộ theme đang áp. */
const STATUS_COLOR_TOKEN: Record<string, 'statusDraft' | 'statusAttention' | 'statusInfo' | 'statusCritical' | 'statusOperational' | 'textTertiary'> = {
  DRAFT: 'statusDraft',
  PENDING_APPROVAL: 'statusAttention',
  APPROVED_LEVEL1: 'statusInfo',
  REJECTED_LEVEL1: 'statusCritical',
  REJECTED_LEVEL2: 'statusCritical',
  APPROVED: 'statusOperational',
  ARCHIVED: 'textTertiary',
};

export default function ApprovalStatusBadge({ status, size = 'default' }: ApprovalStatusBadgeProps) {
  const t = useThemeToken();
  // Chuẩn hóa mã legacy (PROPOSED, PUBLISHED, APPROVED_L1, NHAP, CHO_PHE_DUYET...)
  // trước khi tra nhãn, để không màn nào hiển thị ra mã thô.
  const normalized = normalizeApprovalStatus(status);
  const base = APPROVAL_STATUS_STYLE[normalized];
  // Nhãn vẫn lấy từ bảng chuẩn dùng chung; riêng MÀU đi qua theme đang áp.
  const config = {
    label: base?.label ?? (status || '—'),
    color: t[STATUS_COLOR_TOKEN[normalized] ?? 'textTertiary'],
  };

  return (
    <span
      style={{
        ...t.statusBadgeStyle(config.color),
        ...(size === 'small' ? { padding: '1px 8px', fontSize: t.fontSizeMd - 1 } : null),
      }}
    >
      {config.label}
    </span>
  );
}
