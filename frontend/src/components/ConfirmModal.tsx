import { Modal, Button, Space, Typography } from 'antd';
import { WarningOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  content: ReactNode;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  icon?: ReactNode;
}

/**
 * ConfirmModal � hi?n th? modal x�c nh?n tru?c khi th?c hi?n h�nh d?ng nguy hi?m
 * nhu x�a (delete) ho?c kh�a (lock) t�i kho?n.
 */
export default function ConfirmModal({
  open,
  title,
  content,
  confirmLoading,
  onConfirm,
  onCancel,
  confirmText = 'X�c nh?n',
  cancelText = 'H?y b?',
  danger = true,
  icon,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={confirmLoading}
      centered
      width={480}
      okButtonProps={{ danger }}
      okText={confirmText}
      cancelText={cancelText}
      icon={icon || <WarningOutlined style={{ color: '#faad14' }} />}
    >
      <Typography.Text style={{ fontSize: 15 }}>{content}</Typography.Text>
    </Modal>
  );
}

/**
 * DeleteConfirmation � modal x�c nh?n x�a v?i n?i dung m?c d?nh.
 */
export function DeleteConfirmation({
  open,
  onConfirm,
  onCancel,
  confirmLoading,
  itemName,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
  itemName?: string;
}) {
  return (
    <ConfirmModal
      open={open}
      title="Xác nhận xóa"
      content={
        itemName
          ? `Bạn có chắc muốn xóa mục "${itemName}"? Hành động này không thể hoàn tác.`
          : 'Bạn có chắc muốn thực hiện hành động này? Hành động này không thể hoàn tác.'
      }
      confirmLoading={confirmLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
      danger
      icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
      confirmText="Xóa"
    />
  );
}

/**
 * LockConfirmation – modal xác nhận khóa tài khoản.
 */
export function LockConfirmation({
  open,
  onConfirm,
  onCancel,
  confirmLoading,
  itemName,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
  itemName?: string;
}) {
  return (
    <ConfirmModal
      open={open}
      title="Xác nhận khóa"
      content={
        itemName
          ? `Bạn có chắc muốn khóa "${itemName}"? Người dùng sẽ không thể đăng nhập.`
          : 'Bạn có chắc muốn khóa mục này?'
      }
      confirmLoading={confirmLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
      icon={<LockOutlined style={{ color: '#fa8c16' }} />}
      danger
    />
  );
}
