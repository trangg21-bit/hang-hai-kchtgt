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
  approvalPermissionStyle?: 'legacy' | 'documented';
  onAction: (action: 'approveC1' | 'approveC2' | 'reject' | 'delete', payload?: Record<string, unknown>) => void;
  loading?: boolean;
}

export default function ApprovalActionBar({
  currentStatus,
  permissions,
  entityPermissionPrefix,
  currentUserId,
  nguoiPheDuyetC1,
  approvalPermissionStyle = 'legacy',
  onAction,
  loading = false,
}: ApprovalActionBarProps) {
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  const hasPermission = (perm: string): boolean => permissions.includes(perm);

  const approvalPermission = (level: 'c1' | 'c2') => approvalPermissionStyle === 'documented'
    ? `${entityPermissionPrefix}:approve:${level}`
    : `${entityPermissionPrefix}:approve${level}`;

  // C1 is available only for PROPOSED. REJECTED must be edited and resubmitted first.
  const isC1Stage = currentStatus === 'PROPOSED';
  const canApproveC1 = isC1Stage && hasPermission(approvalPermission('c1'));
  const canRejectAtC1 = isC1Stage && hasPermission(approvalPermission('c1'));

  // C2 stage: UNDER_REVIEW
  const isC2Stage = currentStatus === 'UNDER_REVIEW';
  const canApproveC2 = isC2Stage && hasPermission(approvalPermission('c2'));
  const canRejectAtC2 =
    isC2Stage &&
    !(currentUserId && nguoiPheDuyetC1 === currentUserId) &&
    (hasPermission(approvalPermission('c1')) || hasPermission(approvalPermission('c2')));

  const canDelete = currentStatus === 'APPROVED' && hasPermission(`${entityPermissionPrefix}:delete`);

  // C2 must always be performed by a different user than C1.
  const isSelfApprovalC2 = !!(
    canApproveC2 &&
    currentUserId &&
    nguoiPheDuyetC1 === currentUserId
  );

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
