import { Modal, Form, Input } from 'antd';
import { useState, useEffect } from 'react';
import {
  sidebarBg,
  fontWeightBold,
  fontSizeLg,
  fontSizeMd,
  primaryButtonStyle,
  outlineButtonStyle,
  textAreaStyle,
} from '../../themetokenchk';

interface ApprovalModalProps {
  visible?: boolean;
  open?: boolean;
  level?: 'c1' | 'c2';
  loading?: boolean;
  onConfirm?: (content: string) => void;
  onOk?: (content: string) => void;
  onCancel: () => void;
  title?: string;
  actionType?: 'approve' | 'reject';
  targetName?: string;
}

export default function ApprovalModal({
  visible,
  open,
  level = 'c1',
  loading,
  onConfirm,
  onOk,
  onCancel,
  title: customTitle,
}: ApprovalModalProps) {
  const isModalOpen = open !== undefined ? open : !!visible;
  const [form] = Form.useForm();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isModalOpen) {
      setContent('');
      form.resetFields();
    }
  }, [isModalOpen, form]);

  const handleConfirm = () => {
    const text = content.trim() || 'Đã phê duyệt';
    if (onConfirm) onConfirm(text);
    if (onOk) onOk(text);
    setContent('');
    form.resetFields();
  };

  const handleCancel = () => {
    setContent('');
    form.resetFields();
    onCancel();
  };

  const title = customTitle || (level === 'c1' ? 'Phê duyệt cấp Cảng vụ/Chi cục' : 'Phê duyệt cấp Cục');

  return (
    <Modal
      title={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{title}</span>}
      open={isModalOpen}
      onCancel={handleCancel}
      okText="Xác nhận phê duyệt"
      cancelText="Hủy"
      width={520}
      style={{ top: 120 }}
      okButtonProps={{ style: { ...primaryButtonStyle, height: 38, padding: '0 20px' }, loading }}
      cancelButtonProps={{ style: { ...outlineButtonStyle, height: 38, padding: '0 20px' } }}
      onOk={handleConfirm}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Nội dung / Ý kiến phê duyệt</span>}
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung / ý kiến phê duyệt..."
            rows={3}
            maxLength={500}
            autoFocus
            showCount
            style={textAreaStyle}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
