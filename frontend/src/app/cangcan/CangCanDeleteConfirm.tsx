import { useEffect, useState } from 'react';
import { Card, Button, Typography, Space, Alert, Checkbox } from 'antd';
import { WarningOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { CangCan } from './types';
import { fetchCangCanById, deleteCangCan } from './api';
import toast from '../../components/ToastNotification';

export default function CangCanDeleteConfirm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CangCan | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCangCanById(id)
      .then(setData)
      .catch(() => { toast.error('Không thể tải thông tin cảng cạn'); navigate('/cangcan'); });
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id || !confirmed) return;
    try {
      setLoading(true);
      await deleteCangCan(id);
      toast.success('Xóa thành công');
      navigate('/cangcan');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/cangcan/${id}`)}>Quay lại</Button>
          <Space>
            <WarningOutlined style={{ color: '#faad14', fontSize: 24 }} />
            <Typography.Title level={5} style={{ margin: 0 }}>Xác nhận xóa</Typography.Title>
          </Space>
        </Space>
      </Card>

      <Card style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div><Typography.Text type="secondary">Mã cảng cạn: </Typography.Text><Typography.Text strong>{data.maCangCan}</Typography.Text></div>
            <div><Typography.Text type="secondary">Tên cảng cạn: </Typography.Text><Typography.Text>{data.tenCangCan}</Typography.Text></div>
            <div><Typography.Text type="secondary">Tỉnh/thành phố: </Typography.Text><Typography.Text>{data.tinhThanhPho || '—'}</Typography.Text></div>
          </Space>
        </div>

        <Alert
          message="Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ trong hệ thống."
          type="warning" showIcon style={{ marginBottom: 16 }}
        />

        <Checkbox
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          aria-label="Tôi xác nhận muốn xóa cảng cạn này"
        >
          Tôi xác nhận muốn xóa cảng cạn này
        </Checkbox>

        <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button onClick={() => navigate(`/cangcan/${id}`)}>Hủy</Button>
          <Button type="primary" danger icon={<DeleteOutlined />} loading={loading} disabled={!confirmed} onClick={handleDelete}>
            Xóa
          </Button>
        </Space>
      </Card>
    </>
  );
}
