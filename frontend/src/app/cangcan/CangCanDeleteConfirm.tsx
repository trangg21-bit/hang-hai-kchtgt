import { useState } from 'react';
import { Modal, Button, Typography, Space, Alert, Checkbox, Form } from 'antd';
import { WarningOutlined, DeleteOutlined } from '@ant-design/icons';
import type { CangCan } from './types';
import { deleteCangCan } from './api';

interface CangCanDeleteConfirmProps {
  open: boolean;
  data: CangCan | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CangCanDeleteConfirm({
  open,
  data,
  onClose,
  onConfirm,
}: CangCanDeleteConfirmProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!data) return;
    const confirmed = form.getFieldValue('confirmed');
    if (confirmed !== true) return;

    try {
      setLoading(true);
      await deleteCangCan(data.id);
      Modal.success({
        title: 'Xóa thành công',
        content: `Cảng cạn "${data.maCangCan}" đã được xóa.`,
        onOk: () => { onClose(); onConfirm(); },
      });
    } catch (err: unknown) {
      Modal.error({
        title: 'Xóa thất bại',
        content: err instanceof Error ? err.message : 'Có lỗi xảy ra',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!data) return null;

  return (
    <Modal
      open={open}
      title={null}
      onCancel={onClose}
      footer={null}
      centered
      width={480}
      destroyOnClose
    >
      {/* Header */}
      <Space style={{ marginBottom: 16 }}>
        <WarningOutlined style={{ color: '#faad14', fontSize: 24 }} />
        <Typography.Title level={5} style={{ margin: 0 }}>
          Xác nhận xóa
        </Typography.Title>
      </Space>

      {/* Info Card */}
      <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div>
            <Typography.Text type="secondary">Mã cảng cạn</Typography.Text>
            <Typography.Text strong>{data.maCangCan}</Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary">Tên cảng cạn</Typography.Text>
            <Typography.Text>{data.tenCangCan}</Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary">Tỉnh/thành phố</Typography.Text>
            <Typography.Text>{data.tinhThanhPho || '—'}</Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary">Người tạo</Typography.Text>
            <Typography.Text>{data.createdBy || '—'}</Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary">Ngày tạo</Typography.Text>
            <Typography.Text>{data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : '—'}</Typography.Text>
          </div>
        </Space>
      </div>

      {/* Warning */}
      <Alert
        message="Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ trong hệ thống."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Checkbox */}
      <Form form={form}>
        <Form.Item
          name="confirmed"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value === true
                  ? Promise.resolve()
                  : Promise.reject(new Error('Bạn cần xác nhận để xóa')),
            },
          ]}
        >
          <Checkbox>Tôi xác nhận muốn xóa cảng cạn này</Checkbox>
        </Form.Item>
      </Form>

      {/* Footer */}
      <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          loading={loading}
          disabled={form.getFieldValue('confirmed') !== true}
          onClick={handleDelete}
        >
          Xóa
        </Button>
      </Space>
    </Modal>
  );
}
