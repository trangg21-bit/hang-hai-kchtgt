import { useEffect, useState } from 'react';
import { Card, Button, Space, Typography, Tag, Row, Col, Input } from 'antd';
import toast from '../../components/ToastNotification';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { borderDefault, statusAttention, statusCritical, textPrimary, textSecondary, textTertiary, spaceMd, fontSizeMd, fontSizeSm, radiusPill } from '../../tokens';
import { fetchCangBienById, deleteCangBien, fetchPortChildren } from './api';
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
  const [childrenInfo, setChildrenInfo] = useState<{ berths: number; waterZones: number } | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        const [res, children] = await Promise.all([
          fetchCangBienById(id),
          fetchPortChildren(id).catch(() => ({ berths: 0, waterZones: 0 })),
        ]);
        setData(res);
        setChildrenInfo(children);
        if (children.berths > 0 || children.waterZones > 0) {
          setBlocked(true);
        }
      } catch {
        toast.error('Không thể tải thông tin cảng biển');
        navigate('/Port');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id || !data) return;
    if (confirmText !== data.portName) {
      toast.error('Vui lòng nhập chính xác tên cảng biển để xác nhận');
      return;
    }
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
    return <div style={{ padding: 40, textAlign: 'center', color: textSecondary }}>Đang tải...</div>;
  }

  // ── Blocked: has children ─────────────────────────────────────────
  if (blocked && childrenInfo) {
    return (
      <>
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/Port/${id}`)}>Quay lại</Button>
            <Typography.Title level={5} style={{ margin: 0, color: statusCritical }}>
              Không thể xóa — {data.portCode}
            </Typography.Title>
          </Space>
        </Card>
        <Card style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: 32 }}>
          <Typography.Text style={{ color: statusCritical, fontSize: fontSizeMd }}>
            Cảng này có {childrenInfo.berths} bến cảng và {childrenInfo.waterZones} vùng nước liên kết, không thể xóa.
          </Typography.Text>
          <br /><br />
          <Typography.Text style={{ color: textSecondary, fontSize: fontSizeSm }}>
            Vui lòng xóa các bến cảng và vùng nước trực thuộc trước khi xóa cảng biển này.
          </Typography.Text>
          <br /><br />
          <Button type="primary" onClick={() => navigate(`/Port/${id}`)}
            style={{ borderRadius: radiusPill, height: 40 }}>
            Quay lại thông tin cảng
          </Button>
        </Card>
      </>
    );
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/Port/${id}`)}>Quay lại</Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Xác nhận xóa — {data.portCode}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Thông tin cảng */}
        <Card size="small" title="Thông tin cảng biển" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Mã cảng</Typography.Text>
              <br />
              <Tag color="cyan">{data.portCode}</Tag>
            </Col>
            <Col span={12}>
              <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Tên cảng</Typography.Text>
              <br />
              <Typography.Text style={{ fontSize: fontSizeMd }}>{data.portName}</Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Tỉnh/Thành phố</Typography.Text>
              <br />
              <Typography.Text style={{ fontSize: fontSizeMd }}>{data.province || '—'}</Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Tạo bởi</Typography.Text>
              <br />
              <Typography.Text style={{ fontSize: fontSizeMd }}>{data.createdBy || '—'}</Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Ngày tạo</Typography.Text>
              <br />
              <Typography.Text style={{ fontSize: fontSizeMd }}>{formatDate(data.createdAt)}</Typography.Text>
            </Col>
          </Row>
        </Card>

        {/* Warning */}
        <Card size="small" style={{ marginBottom: spaceMd, borderColor: statusAttention, backgroundColor: `${statusAttention}08` }}>
          <Typography.Text style={{ color: statusAttention, fontSize: fontSizeSm }}>
            Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ trong hệ thống.
          </Typography.Text>
        </Card>

        {/* Confirm by typing port name */}
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8, color: textPrimary, fontSize: fontSizeMd }}>
            Nhập <strong style={{ color: statusCritical }}>{data.portName}</strong> để xác nhận xóa:
          </Typography.Text>
          <Input
            placeholder="Nhập tên cảng biển để xác nhận..."
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            style={{ borderRadius: radiusPill, height: 40 }}
          />
          {confirmText && confirmText !== data.portName && (
            <span style={{ color: statusCritical, fontSize: fontSizeSm }}>Tên không khớp</span>
          )}
          {confirmText === data.portName && (
            <span style={{ color: '#1BAF7A', fontSize: fontSizeSm }}>Đã xác nhận</span>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${borderDefault}`, paddingTop: 16 }}>
          <Space>
            <Button onClick={() => navigate(`/Port/${id}`)}
              style={{ borderRadius: radiusPill, height: 40, borderColor: borderDefault, color: textSecondary }}>
              Hủy
            </Button>
            <Button
              type="primary"
              danger
              onClick={handleDelete}
              loading={submitting}
              disabled={confirmText !== data.portName}
              style={{ borderRadius: radiusPill, height: 40 }}
            >
              Xóa cảng biển
            </Button>
          </Space>
        </div>
      </Card>
    </>
  );
}
