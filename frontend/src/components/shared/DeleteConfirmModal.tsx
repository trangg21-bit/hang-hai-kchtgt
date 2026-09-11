import React from 'react';
import { Modal, Button } from 'antd';
import { DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import {
  sidebarBg,
  textPrimary,
  textSecondary,
  statusCritical,
  fontSizeLg,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  radiusPill,
  outlineButtonStyle,
  spaceSm,
  DELETE_MODAL_WIDTH,
} from '../../themetokenchk';

export interface DeleteConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  itemType?: string; // Ví dụ: "bến cảng", "cầu cảng"...
  itemName?: string; // Ví dụ: "Bến cảng Thuận An"
  itemCode?: string; // Ví dụ: "G17.43.09.000001-BC-000003"
  description?: string;
}

/**
 * DeleteConfirmModal — Popup xác nhận xóa dữ liệu chuẩn hệ thống.
 * 
 * Loại bỏ thao tác bắt buộc gõ chữ "XÓA".
 * Cung cấp thông tin trực quan: tên bản ghi, mã bản ghi, cảnh báo dữ liệu không thể hoàn tác,
 * cùng 2 nút thao tác chuẩn [Hủy] và [Xác nhận xóa].
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  onCancel,
  onConfirm,
  loading = false,
  title,
  itemType = 'bản ghi',
  itemName,
  itemCode,
  description,
}) => {
  const displayTitle = title || `Xác nhận xóa ${itemType}`;

  return (
    <Modal
      open={open}
      onCancel={loading ? undefined : onCancel}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `${statusCritical}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DeleteOutlined style={{ color: statusCritical, fontSize: 18 }} />
          </div>
          <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            {displayTitle}
          </span>
        </div>
      }
      footer={[
        <Button
          key="cancel"
          disabled={loading}
          onClick={onCancel}
          style={{
            ...outlineButtonStyle,
            borderRadius: radiusPill,
            height: 40,
            fontSize: fontSizeMd,
            padding: '0 24px',
          }}
        >
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          danger
          loading={loading}
          onClick={onConfirm}
          style={{
            borderRadius: radiusPill,
            height: 40,
            fontSize: fontSizeMd,
            padding: '0 24px',
            background: statusCritical,
            borderColor: statusCritical,
          }}
        >
          Xác nhận xóa
        </Button>,
      ]}
      width={DELETE_MODAL_WIDTH}
      centered
      destroyOnHidden
    >
      <div style={{ paddingTop: spaceSm, paddingBottom: spaceSm }}>
        <p style={{ fontSize: fontSizeMd, color: textPrimary, lineHeight: 1.6, marginBottom: 12 }}>
          Bạn có chắc chắn muốn xóa {itemType}{' '}
          {itemName ? (
            <strong style={{ color: sidebarBg }}>"{itemName}"</strong>
          ) : null}
          {itemCode ? <span style={{ color: textSecondary }}> (Mã: {itemCode})</span> : null}
          {' '}không?
        </p>
        <div
          style={{
            padding: '10px 14px',
            background: `${statusCritical}0D`,
            border: `1px solid ${statusCritical}33`,
            borderRadius: 8,
            color: statusCritical,
            fontSize: fontSizeSm + 0.5,
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <ExclamationCircleFilled style={{ marginTop: 2, flexShrink: 0 }} />
          <span>
            {description || 'Hành động này không thể hoàn tác. Toàn bộ dữ liệu liên quan sẽ bị xóa hoàn toàn khỏi hệ thống.'}
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
