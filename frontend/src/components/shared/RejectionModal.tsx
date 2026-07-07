import { Modal, Form, Input } from 'antd';
import { useState } from 'react';

interface RejectionModalProps {
  visible: boolean;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function RejectionModal({ visible, loading, onConfirm, onCancel }: RejectionModalProps) {
  const [form] = Form.useForm();
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim().length < 10) {
      return;
    }
    onConfirm(reason);
    setReason('');
    form.resetFields();
  };

  const handleCancel = () => {
    setReason('');
    form.resetFields();
    onCancel();
  };

  const isValid = reason.trim().length >= 10;

  return (
    <Modal
      title="Từ chối phê duyệt"
      open={visible}
      onCancel={handleCancel}
      okText="Xác nhận từ chối"
      cancelText="Hủy"
      okButtonProps={{ danger: true, loading, disabled: !isValid }}
      onOk={handleConfirm}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Lý do từ chối"
          required
          help={reason.length < 10 ? `Tối thiểu 10 ký tự (${reason.length}/10)` : ''}
          validateStatus={reason.length < 10 && reason.length > 0 ? 'error' : ''}
        >
          <Input.TextArea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
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
