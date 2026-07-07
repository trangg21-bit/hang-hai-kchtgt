import { Space, Button, Tooltip } from 'antd';
import { useState } from 'react';
import RejectionModal from './RejectionModal';

export type ApprovalStatus = 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

interface ApprovalActionBarProps {
  currentStatus: ApprovalStatus | string;
  permissions: string[];
  entityPermissionPrefix: string;
  currentUserId?: string;
  nguoiPheDuyetC1?: string;
  onAction: (action: 'approveC1' | 'approveC2' | 'reject' | 'delete', payload?: Record<string, unknown>) => void;
  loading?: boolean;
}

export default function ApprovalActionBar({
  currentStatus,
  permissions,
  entityPermissionPrefix,
  currentUserId,
  nguoiPheDuyetC1,
  onAction,
  loading = false,
}: ApprovalActionBarProps) {
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  const hasPermission = (perm: string): boolean => permissions.includes(perm);

  // C1 stage: PROPOSED or REJECTED
  const isC1Stage = currentStatus === 'PROPOSED' || currentStatus === 'REJECTED';
  const canApproveC1 = isC1Stage && hasPermission(`${entityPermissionPrefix}:approvec1`);
  const canRejectAtC1 = isC1Stage && hasPermission(`${entityPermissionPrefix}:approvec1`);

  // C2 stage: UNDER_REVIEW
  const isC2Stage = currentStatus === 'UNDER_REVIEW';
  const canApproveC2 = isC2Stage && hasPermission(`${entityPermissionPrefix}:approvec2`);
  const canRejectAtC2 =
    isC2Stage &&
    (hasPermission(`${entityPermissionPrefix}:approvec1`) || hasPermission(`${entityPermissionPrefix}:approvec2`));

  const canDelete = currentStatus === 'APPROVED' && hasPermission(`${entityPermissionPrefix}:delete`);

  // Self-approval guard: disable C2 button if current user is the C1 approver
  const isSelfApprovalC2 = !!(canApproveC2 && currentUserId && nguoiPheDuyetC1 === currentUserId);

  // Determine which rejection handler to use
  const canReject = canRejectAtC1 || canRejectAtC2;

  const handleRejectConfirm = (reason: string) => {
    setRejectModalVisible(false);
    onAction('reject', { lyDo: reason });
  };

  return (
    <>
      <Space wrap style={{ marginTop: '20px' }}>
        {canApproveC1 && (
          <Button type="primary" style={{ background: '#52c41a' }} onClick={() => onAction('approveC1')} loading={loading}>
            Phê duyệt C1
          </Button>
        )}

        {canApproveC2 && (
          <Tooltip title={isSelfApprovalC2 ? 'Bạn không thể tự phê duyệt hồ sơ do mình xét duyệt C1' : ''}>
            <Button
              type="primary"
              style={{ background: '#1890ff' }}
              onClick={() => onAction('approveC2')}
              loading={loading}
              disabled={isSelfApprovalC2}
            >
              Phê duyệt C2
            </Button>
          </Tooltip>
        )}

        {canReject && (
          <Button danger onClick={() => setRejectModalVisible(true)} loading={loading}>
            Từ chối
          </Button>
        )}

        {canDelete && (
          <Button danger onClick={() => onAction('delete')} loading={loading}>
            Xóa
          </Button>
        )}
      </Space>

      <RejectionModal
        visible={rejectModalVisible}
        loading={loading}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectModalVisible(false)}
      />
    </>
  );
}
