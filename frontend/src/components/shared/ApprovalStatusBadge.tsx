import {
  statusAttention,
  statusOperational,
  statusCritical,
  statusDraft,
  textTertiary,
  radiusPill,
} from '../../tokens';
import { normalizeApprovalStatus } from '../../utils/approvalEditPolicy';

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

export default function ApprovalStatusBadge({ status, size = 'default' }: ApprovalStatusBadgeProps) {
  // Chuẩn hóa mã legacy (PROPOSED, PUBLISHED, APPROVED_L1, NHAP, CHO_PHE_DUYET...)
  // trước khi tra nhãn, để không màn nào hiển thị ra mã thô.
  const normalized = normalizeApprovalStatus(status);
  const config = APPROVAL_STATUS_STYLE[normalized] || { label: status || '—', color: textTertiary };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'small' ? '1px 8px' : '2px 10px',
        borderRadius: radiusPill,
        fontSize: size === 'small' ? '12px' : '13px',
        fontWeight: 500,
        background: `${config.color}15`,
        color: config.color,
        border: `1px solid ${config.color}40`,
        marginLeft: -6,
      }}
    >
      {config.label}
    </span>
  );
}
