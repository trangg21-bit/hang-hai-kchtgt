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
 * ConfirmModal — hi?n th? modal xác nh?n tru?c khi th?c hi?n hành d?ng nguy hi?m
 * nhu xóa (delete) ho?c khóa (lock) tài kho?n.
 */
export default function ConfirmModal({
  open,
  title,
  content,
  confirmLoading,
  onConfirm,
  onCancel,
  confirmText = 'Xác nh?n',
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
 * DeleteConfirmation — modal xác nh?n xóa v?i n?i dung m?c d?nh.
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
      title="Xác nh?n xóa"
      content={
        itemName
          ? B?n có ch?c mu?n xóa m?c ""? Hành d?ng này không th? hoàn tác.
          : 'B?n có ch?c mu?n th?c hi?n hành d?ng này? Hành d?ng này không th? hoàn tác.'
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
 * LockConfirmation — modal xác nh?n khóa tài kho?n.
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
      title="Xác nh?n khóa"
      content={
        itemName
          ? B?n có ch?c mu?n khóa ""? Ngu?i dùng s? không th? dang nh?p.
          : 'B?n có ch?c mu?n khóa m?c này?'
      }
      confirmLoading={confirmLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
      icon={<LockOutlined style={{ color: '#fa8c16' }} />}
      confirmText="Khóa"
      danger
    />
  );
}
