import { useEffect, useState } from 'react';
import { Card, Button, Space, Typography, Tag, Row, Col } from 'antd';
import toast from '../../components/ToastNotification';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCangBienById, deleteCangBien } from './api';
import type { CangBienResponse } from './types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

export default function CangBienDeleteConfirm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CangBienResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetchCangBienById(id);
        setData(res);
      } catch (err) {
        console.error('Failed to fetch CangBien:', err);
        toast.error('Không thể tải thông tin cảng biển');
        navigate('/cangbien');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirmChecked) {
      toast.error('Bạn cần xác nhận để xóa');
      return;
    }
    if (!id) return;
    setSubmitting(true);
    try {
      await deleteCangBien(id);
      toast.success('Xóa thành công');
      navigate('/cangbien');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !data) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button onClick={() => navigate(`/cangbien/${id}`)}>Quay lại</Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Xác nhận xóa — {data.maCang}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Info Card */}
        <Card size="small" title="Thông tin cảng biển" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Typography.Text strong>Mã cảng:</Typography.Text>
              <br />
              <Tag color="cyan">{data.maCang}</Tag>
            </Col>
            <Col span={12}>
              <Typography.Text strong>Tên cảng:</Typography.Text>
              <br />
              <Typography.Text>{data.tenCang}</Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text strong>Tỉnh/thành phố:</Typography.Text>
              <br />
              <Typography.Text>{data.tinhThanhPho || '—'}</Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text strong>Tạo bởi:</Typography.Text>
              <br />
              <Typography.Text>{data.createdBy || '—'}</Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text strong>Ngày tạo:</Typography.Text>
              <br />
              <Typography.Text>{formatDate(data.createdAt)}</Typography.Text>
            </Col>
          </Row>
        </Card>

        {/* Warning */}
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fff7e6', borderColor: '#ffd591' }}>
          <Typography.Text type="warning">
            ⚠️ Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ trong hệ thống.
          </Typography.Text>
        </Card>

        {/* Confirm */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              aria-label="Tôi xác nhận muốn xóa cảng biển này"
            />
            <Typography.Text>Tôi xác nhận muốn xóa cảng biển này</Typography.Text>
          </Space>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <Space>
            <Button onClick={() => navigate(`/cangbien/${id}`)}>Hủy</Button>
            <Button
              type="primary"
              danger
              onClick={handleDelete}
              loading={submitting}
              disabled={!confirmChecked}
            >
              Xóa
            </Button>
          </Space>
        </div>
      </Card>
    </>
  );
}
