import { actionPrimary, statusAttention, statusOperational, statusCritical, statusDraft, textTertiary, radiusPill } from '../../tokens';

export type ApprovalStatusType = 'PROPOSED' | 'PENDING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | string;

interface ApprovalStatusBadgeProps {
  status: ApprovalStatusType;
  size?: 'default' | 'small';
}

const STATUS_STYLE_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp', color: textTertiary },
  PROPOSED: { label: 'Nháp', color: statusDraft },
  PENDING: { label: 'Chờ phê duyệt', color: statusAttention },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt', color: statusAttention },
  APPROVED_LEVEL1: { label: 'Đã duyệt C1', color: actionPrimary },
  APPROVED_LEVEL2: { label: 'Đã phê duyệt', color: statusOperational },
  APPROVED: { label: 'Đã phê duyệt', color: statusOperational },
  REJECTED: { label: 'Từ chối', color: statusCritical },
};

export default function ApprovalStatusBadge({ status, size = 'default' }: ApprovalStatusBadgeProps) {
  const config = STATUS_STYLE_MAP[status] || { label: status || '—', color: textTertiary };

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
