import React from 'react';
import { Modal, Button } from 'antd';
import { LogoutOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import {
  sidebarBg,
  textPrimary,
  statusCritical,
  statusAttention,
  fontSizeLg,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  radiusPill,
  outlineButtonStyle,
  spaceSm,
} from '../../themetokenchk';

export interface LogoutConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  userName?: string;
}

/**
 * LogoutConfirmModal — Popup xác nhận đăng xuất chuẩn hệ thống.
 * 
 * Hiển thị thông báo xác nhận khi người dùng thao tác đăng xuất trên Topbar,
 * bảo đảm không xảy ra việc đăng xuất nhầm làm mất phiên làm việc.
 */
export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  open,
  onCancel,
  onConfirm,
  loading = false,
  userName,
}) => {
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
              background: `${statusAttention}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LogoutOutlined style={{ color: statusAttention, fontSize: 18 }} />
          </div>
          <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            Xác nhận đăng xuất
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
          Đăng xuất
        </Button>,
      ]}
      width={460}
      centered
      destroyOnClose
    >
      <div style={{ paddingTop: spaceSm, paddingBottom: spaceSm }}>
        <p style={{ fontSize: fontSizeMd, color: textPrimary, lineHeight: 1.6, marginBottom: 12 }}>
          Bạn có chắc chắn muốn đăng xuất khỏi hệ thống
          {userName ? (
            <>
              {' '}(tài khoản <strong style={{ color: sidebarBg }}>{userName}</strong>)
            </>
          ) : null}
          {' '}không?
        </p>
        <div
          style={{
            padding: '10px 14px',
            background: `${statusAttention}0D`,
            border: `1px solid ${statusAttention}33`,
            borderRadius: 8,
            color: '#B77400',
            fontSize: fontSizeSm + 0.5,
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <ExclamationCircleFilled style={{ marginTop: 2, flexShrink: 0 }} />
          <span>
            Phiên làm việc hiện tại sẽ kết thúc. Mọi dữ liệu đang nhập dở chưa lưu sẽ không được bảo lưu.
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutConfirmModal;
