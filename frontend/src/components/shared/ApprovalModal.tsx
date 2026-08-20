import { Modal, Form, Input } from 'antd';
import { useState, useEffect } from 'react';

interface ApprovalModalProps {
  visible: boolean;
  level: 'c1' | 'c2';
  loading?: boolean;
  onConfirm: (content: string) => void;
  onCancel: () => void;
}

export default function ApprovalModal({
  visible,
  level,
  loading,
  onConfirm,
  onCancel,
}: ApprovalModalProps) {
  const [form] = Form.useForm();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (visible) {
      setContent('');
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirm(content.trim() || 'Đã phê duyệt');
    setContent('');
    form.resetFields();
  };

  const handleCancel = () => {
    setContent('');
    form.resetFields();
    onCancel();
  };

  const title = level === 'c1' ? 'Phê duyệt cấp 1 (Cảng vụ/Chi cục)' : 'Phê duyệt cấp 2 (Cục)';

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleCancel}
      okText="Xác nhận phê duyệt"
      cancelText="Hủy"
      okButtonProps={{ type: 'primary', loading }}
      onOk={handleConfirm}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Nội dung / Ý kiến phê duyệt">
          <Input.TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung / ý kiến phê duyệt..."
            rows={4}
            maxLength={500}
            autoFocus
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
