import { Modal, Space, Typography, Card, Descriptions } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import type { VungNuoc } from './types';

/**
 * VungNuocDeleteConfirm — reusable delete confirmation modal.
 * Used by VungNuocDetailPage and VungNuocListPage.
 */
interface VungNuocDeleteConfirmProps {
  open: boolean;
  data: VungNuoc;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
}

export default function VungNuocDeleteConfirm({
  open,
  data,
  onConfirm,
  onCancel,
  confirmLoading,
}: VungNuocDeleteConfirmProps) {
  return (
    <Modal
      open={open}
      title="Xác nhận xóa"
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={confirmLoading}
      centered
      width={480}
      icon={<WarningOutlined style={{ color: '#fa8c16' }} />}
      okButtonProps={{ danger: true }}
      okText="Xóa"
      cancelText="Hủy"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* DeleteInfoCard */}
        <Card size="small">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã vùng nước">
              <Typography.Text strong>{data.maVungNuoc}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tên vùng nước">{data.tenVungNuoc}</Descriptions.Item>
            <Descriptions.Item label="Cảng biển chủ">{data.cangBienId}</Descriptions.Item>
            <Descriptions.Item label="Loại vùng nước">
              {data.loaiVungNuoc || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Người tạo">{data.createdBy}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {new Date(data.createdAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* WarningCallout */}
        <Typography.Text type="warning">
          ⚠️ Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ.
        </Typography.Text>

        {/* CheckboxConfirm */}
        <Typography.Text>
          Tôi xác nhận muốn xóa vùng nước này
        </Typography.Text>
      </Space>
    </Modal>
  );
}
