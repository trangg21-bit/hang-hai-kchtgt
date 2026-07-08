import { useEffect, useState } from 'react';
import { Card, Button, Space, Typography, Alert, Checkbox, Descriptions } from 'antd';
import { WarningOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { VungNuoc } from './types';
import { vungNuocApi } from './api';
import toast from '../../components/ToastNotification';

export default function VungNuocDeleteConfirm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VungNuoc | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    vungNuocApi.findById(id)
      .then(setData)
      .catch(() => { toast.error('Không thể tải thông tin vùng nước'); navigate('/vungnuoc'); });
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id || !confirmed) return;
    try {
      setLoading(true);
      await vungNuocApi.delete(id);
      toast.success('Xóa thành công');
      navigate('/vungnuoc');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/vungnuoc/${id}`)}>Quay lại</Button>
          <Space>
            <WarningOutlined style={{ color: '#faad14', fontSize: 24 }} />
            <Typography.Title level={5} style={{ margin: 0 }}>Xác nhận xóa</Typography.Title>
          </Space>
        </Space>
      </Card>

      <Card style={{ maxWidth: 600, margin: '0 auto' }}>
        <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Mã vùng nước"><Typography.Text strong>{data.maVungNuoc}</Typography.Text></Descriptions.Item>
          <Descriptions.Item label="Tên vùng nước">{data.tenVungNuoc}</Descriptions.Item>
          <Descriptions.Item label="Loại vùng nước">{data.loaiVungNuoc || '—'}</Descriptions.Item>
        </Descriptions>

        <Alert
          message="Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ trong hệ thống."
          type="warning" showIcon style={{ marginBottom: 16 }}
        />

        <Checkbox
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          aria-label="Tôi xác nhận muốn xóa vùng nước này"
        >
          Tôi xác nhận muốn xóa vùng nước này
        </Checkbox>

        <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button onClick={() => navigate(`/vungnuoc/${id}`)}>Hủy</Button>
          <Button type="primary" danger icon={<DeleteOutlined />} loading={loading} disabled={!confirmed} onClick={handleDelete}>
            Xóa
          </Button>
        </Space>
      </Card>
    </>
  );
}
