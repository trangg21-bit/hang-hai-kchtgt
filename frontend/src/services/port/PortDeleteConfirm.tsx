import { useEffect, useState } from 'react';
import { Card, Button, Input, Space, Typography, Tag, Row, Col } from 'antd';
import toast from '../../components/ToastNotification';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { borderDefault, statusAttention, spaceMd } from '../../tokens';
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

export default function PortDeleteConfirm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CangBienResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetchCangBienById(id);
        setData(res);

        // Check child guard
        try {
          const childRes = await fetch(`/api/v1/ports/${id}/children`);
          const json = await childRes.json();
          if (json.data?.hasChildren) {
            toast.error(`Không thể xóa: Cảng có ${json.data.berthCount} bến cảng và ${json.data.waterZoneCount} vùng nước liên kết`);
            navigate('/Port');
            return;
          }
        } catch (e) {
          // Nếu API chưa có (mới thêm), bỏ qua
        }
      } catch (err) {
        console.error('Failed to fetch Port:', err);
        navigate('/port');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, navigate]);

  const isConfirmValid = (): boolean => {
    const trimmed = confirmText.trim();
    return trimmed === data?.portName || trimmed === 'XÓA';
  };

  const handleDelete = async () => {
    if (!isConfirmValid()) {
      toast.error('Vui lòng nhập đúng tên cảng hoặc gõ "XÓA" để xác nhận');
      return;
    }
    if (!id) return;
    setSubmitting(true);
    try {
      await deleteCangBien(id);
      toast.success('Đã xóa thành công');
      navigate('/Port');
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
          <Button onClick={() => navigate(`/port/${id}`)}>Quay lại</Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Xác nhận xóa — {data.portCode}
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
              <Tag color="cyan">{data.portCode}</Tag>
            </Col>
            <Col span={12}>
              <Typography.Text strong>Tên cảng:</Typography.Text>
              <br />
              <Typography.Text>{data.portName}</Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text strong>Tỉnh/thành phố:</Typography.Text>
              <br />
              <Typography.Text>{data.province || '—'}</Typography.Text>
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
        <Card size="small" style={{ marginBottom: spaceMd, borderColor: statusAttention, backgroundColor: `${statusAttention}10` }}>
          <Typography.Text type="warning">
            ⚠️ Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ trong hệ thống.
          </Typography.Text>
        </Card>

        {/* Confirm — type port name or "XÓA" */}
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            Nhập tên cảng hoặc gõ "XÓA" để xác nhận:
          </Typography.Text>
          <Input
            placeholder="Nhập tên cảng hoặc XÓA"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            style={{ borderRadius: 999, height: 40 }}
          />
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${borderDefault}`, paddingTop: 16 }}>
          <Space>
            <Button onClick={() => navigate(`/port/${id}`)}>Hủy</Button>
            <Button
              type="primary"
              danger
              onClick={handleDelete}
              loading={submitting}
              disabled={!isConfirmValid()}
            >
              Xóa
            </Button>
          </Space>
        </div>
      </Card>
    </>
  );
}
