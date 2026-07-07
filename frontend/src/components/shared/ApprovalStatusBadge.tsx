import { Tag } from 'antd';

export type ApprovalStatusType = 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

interface ApprovalStatusBadgeProps {
  status: ApprovalStatusType | string;
  size?: 'default' | 'small';
}

const STATUS_MAP: Record<ApprovalStatusType | string, { color: string; label: string }> = {
  PROPOSED: { color: 'default', label: 'Chờ duyệt' },
  UNDER_REVIEW: { color: 'processing', label: 'Đang xem xét' },
  APPROVED: { color: 'success', label: 'Đã phê duyệt' },
  REJECTED: { color: 'error', label: 'Từ chối' },
};

export default function ApprovalStatusBadge({ status, size = 'default' }: ApprovalStatusBadgeProps) {
  const config = STATUS_MAP[status] || { color: 'default', label: status };

  return (
    <Tag color={config.color} style={{ fontSize: size === 'small' ? '12px' : '14px' }}>
      {config.label}
    </Tag>
  );
}
