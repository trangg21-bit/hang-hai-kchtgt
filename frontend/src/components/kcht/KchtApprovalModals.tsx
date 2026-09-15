import React, { useState, useEffect } from 'react';
import { Modal, Input } from 'antd';
import ApprovalModal from '../shared/ApprovalModal';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';
import toast from '../ToastNotification';
import {
  sidebarBg,
  fontWeightBold,
  fontSizeLg,
  fontSizeMd,
  statusCritical,
  outlineButtonStyle,
  radiusPill,
  spaceFormField,
  textAreaStyle,
} from '../../themetokenchk';

// ── KchtRejectModal: Modal từ chối phê duyệt chuẩn hóa ─────────────────────────
export interface KchtRejectModalProps {
  open: boolean;
  level?: 'c1' | 'c2';
  approvalLevels?: 1 | 2;
  loading?: boolean;
  title?: string;
  onConfirm: (reason: string) => void | Promise<void>;
  onCancel: () => void;
}

export const KchtRejectModal: React.FC<KchtRejectModalProps> = ({
  open,
  level = 'c1',
  approvalLevels = 2,
  loading = false,
  title: customTitle,
  onConfirm,
  onCancel,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  const handleOk = async () => {
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length < 10) {
      toast.error('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    await onConfirm(trimmed);
  };

  const title =
    customTitle ||
    (approvalLevels === 1
      ? 'Từ chối phê duyệt'
      : level === 'c1'
      ? 'Từ chối cấp Cảng vụ/Chi cục'
      : 'Từ chối cấp Cục');

  return (
    <Modal
      title={
        <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
          {title}
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={loading ? undefined : onCancel}
      okText="Từ chối"
      cancelText="Hủy"
      confirmLoading={loading}
      okButtonProps={{
        danger: true,
        style: {
          borderRadius: radiusPill,
          height: 38,
          padding: '0 20px',
          background: statusCritical,
          borderColor: statusCritical,
        },
      }}
      cancelButtonProps={{
        style: { ...outlineButtonStyle, borderRadius: radiusPill, height: 38, padding: '0 20px' },
      }}
      width={520}
      style={{ top: 120 }}
      destroyOnClose
    >
      <div style={{ marginTop: 12 }}>
        <p style={{ marginBottom: spaceFormField, fontSize: fontSizeMd, color: '#475569' }}>
          Nhập lý do từ chối (tối thiểu 10 ký tự):
        </p>
        <Input.TextArea
          rows={3}
          maxLength={500}
          showCount
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nhập chi tiết lý do từ chối phê duyệt..."
          style={textAreaStyle}
        />
      </div>
    </Modal>
  );
};

// ── KchtApprovalModals: Bộ modal dùng chung toàn diện (Phê duyệt, Từ chối, Xóa) ─
export interface KchtApprovalModalsProps {
  // Phê duyệt
  approveOpen?: boolean;
  approveLevel?: 'c1' | 'c2';
  approvalLevels?: 1 | 2;
  approveLoading?: boolean;
  onApproveConfirm?: (content: string) => void | Promise<void>;
  onApproveCancel?: () => void;

  // Từ chối
  rejectOpen?: boolean;
  rejectLevel?: 'c1' | 'c2';
  rejectLoading?: boolean;
  onRejectConfirm?: (reason: string) => void | Promise<void>;
  onRejectCancel?: () => void;

  // Xóa
  deleteOpen?: boolean;
  deleteLoading?: boolean;
  deletingItemType?: string;
  deletingItemName?: string;
  deletingItemCode?: string;
  deleteDescription?: string;
  onDeleteConfirm?: () => void | Promise<void>;
  onDeleteCancel?: () => void;
}

export const KchtApprovalModals: React.FC<KchtApprovalModalsProps> = ({
  approveOpen = false,
  approveLevel = 'c1',
  approvalLevels = 2,
  approveLoading = false,
  onApproveConfirm,
  onApproveCancel,

  rejectOpen = false,
  rejectLevel = 'c1',
  rejectLoading = false,
  onRejectConfirm,
  onRejectCancel,

  deleteOpen = false,
  deleteLoading = false,
  deletingItemType = 'bản ghi',
  deletingItemName,
  deletingItemCode,
  deleteDescription,
  onDeleteConfirm,
  onDeleteCancel,
}) => {
  return (
    <>
      {/* 1. Modal Phê duyệt */}
      {approveOpen && onApproveConfirm && onApproveCancel && (
        <ApprovalModal
          open={approveOpen}
          level={approveLevel}
          title={approvalLevels === 1 ? 'Xác nhận phê duyệt' : undefined}
          loading={approveLoading}
          onConfirm={onApproveConfirm}
          onCancel={onApproveCancel}
        />
      )}

      {/* 2. Modal Từ chối */}
      {rejectOpen && onRejectConfirm && onRejectCancel && (
        <KchtRejectModal
          open={rejectOpen}
          level={rejectLevel}
          approvalLevels={approvalLevels}
          loading={rejectLoading}
          onConfirm={onRejectConfirm}
          onCancel={onRejectCancel}
        />
      )}

      {/* 3. Modal Xác nhận Xóa */}
      {deleteOpen && onDeleteConfirm && onDeleteCancel && (
        <DeleteConfirmModal
          open={deleteOpen}
          loading={deleteLoading}
          itemType={deletingItemType}
          itemName={deletingItemName}
          itemCode={deletingItemCode}
          description={deleteDescription}
          onConfirm={onDeleteConfirm}
          onCancel={onDeleteCancel}
        />
      )}
    </>
  );
};

export default KchtApprovalModals;
