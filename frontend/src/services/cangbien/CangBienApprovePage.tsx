import { useEffect, useState } from 'react';
import { Card, Button, Space, Typography, Tag, Row, Col, Form, Checkbox, Input } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCangBienById, approveCangBien, rejectCangBien } from './api';
import { trangThaiPheDuyetBadge } from './schema';
import type { CangBienResponse } from './types';
import toast from '../../components/ToastNotification';

type TabType = 'approve' | 'reject';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

export default function CangBienApprovePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CangBienResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('approve');
  const [submitting, setSubmitting] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reasonError, setReasonError] = useState('');

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

  if (isLoading || !data) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  }

  const validateReason = (): boolean => {
    if (tab !== 'reject') return true;
    if (!rejectReason || rejectReason.length < 10) {
      setReasonError('Lý do từ chối tối thiểu 10 ký tự');
      return false;
    }
    if (rejectReason.length > 500) {
      setReasonError('Lý do từ chối tối đa 500 ký tự');
      return false;
    }
    setReasonError('');
    return true;
  };

  const handleConfirm = async () => {
    if (!confirmChecked) {
      toast.error('Bạn cần xác nhận hành động này');
      return;
    }
    if (tab === 'reject' && !validateReason()) return;

    setSubmitting(true);
    try {
      if (tab === 'approve') {
        await approveCangBien(data.id);
        toast.success('Phê duyệt thành công');
      } else {
        await rejectCangBien(data.id, rejectReason);
        toast.success('Từ chối thành công');
      }
      navigate(`/cangbien/${data.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tab === 'approve' ? 'Phê duyệt thất bại' : 'Từ chối thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button onClick={() => navigate(`/cangbien/${data.id}`)}>Quay lại</Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Phê duyệt — {data.maCang} — {data.tenCang}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Summary */}
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
            {data.viDo !== null && data.kinhDo !== null && (
              <>
                <Col span={12}>
                  <Typography.Text strong>Vĩ độ:</Typography.Text>
                  <br />
                  <Typography.Text>{data.viDo.toFixed(6)}</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text strong>Kinh độ:</Typography.Text>
                  <br />
                  <Typography.Text>{data.kinhDo.toFixed(6)}</Typography.Text>
                </Col>
              </>
            )}
            <Col span={12}>
              <Typography.Text strong>Diện tích (m²):</Typography.Text>
              <br />
              <Typography.Text>{data.dienTich !== null ? data.dienTich.toFixed(2) : '—'}</Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text strong>Khả năng tiếp nhận:</Typography.Text>
              <br />
              <Typography.Text>{data.khaNangTiepNhan !== null ? data.khaNangTiepNhan.toFixed(2) : '—'}</Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text strong>Trạng thái phê duyệt:</Typography.Text>
              <br />
              <Tag color={trangThaiPheDuyetBadge(data.trangThaiPheDuyet || '').color}>
                {trangThaiPheDuyetBadge(data.trangThaiPheDuyet || '').label}
              </Tag>
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

        {/* Tab Switcher */}
        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Button type={tab === 'approve' ? 'primary' : 'default'} onClick={() => { setTab('approve'); setConfirmChecked(false); }} style={{ flex: 1 }}>
            ✅ Phê duyệt
          </Button>
          <Button type={tab === 'reject' ? 'primary' : 'default'} danger={tab === 'reject'} onClick={() => { setTab('reject'); setConfirmChecked(false); }} style={{ flex: 1 }}>
            ❌ Từ chối
          </Button>
        </Space.Compact>

        {/* Approval Form */}
        {tab === 'approve' ? (
          <Form layout="vertical">
            <Form.Item label="Xác nhận">
              <Space>
                <Checkbox checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)}>
                  Tôi xác nhận hành động này
                </Checkbox>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <Form layout="vertical">
            <Form.Item
              label="Lý do từ chối *"
              validateStatus={reasonError ? 'error' : ''}
              help={reasonError}
            >
              <Input.TextArea
                rows={4}
                value={rejectReason}
                onChange={(e) => { setRejectReason(e.target.value); setReasonError(''); }}
                placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)"
                aria-label="Lý do từ chối"
              />
            </Form.Item>
            <Form.Item label="Xác nhận">
              <Space>
                <Checkbox checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)}>
                  Tôi xác nhận hành động này
                </Checkbox>
              </Space>
            </Form.Item>
          </Form>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 8 }}>
          <Space>
            <Button onClick={() => navigate(`/cangbien/${data.id}`)}>Hủy</Button>
            <Button
              type="primary"
              danger={tab === 'reject'}
              onClick={handleConfirm}
              loading={submitting}
              disabled={!confirmChecked}
            >
              {tab === 'approve' ? 'Phê duyệt' : 'Từ chối'}
            </Button>
          </Space>
        </div>
      </Card>
    </>
  );
}
