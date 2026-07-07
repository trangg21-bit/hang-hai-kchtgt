import { useState, useCallback, useEffect } from 'react';
import { Card, Typography, Row, Col, Space, Button, Tag, Checkbox } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { fetchCauCangById, deleteCauCang } from './api';
import type { CauCang } from './types';
import { cauCangDeleteSchema } from './schema';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  'HIEN_HANH': { color: 'green', label: 'Hiện hành' },
  'TAM_NGUNG': { color: 'gold', label: 'Tạm ngừng' },
};

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  'CHO_PHE_DUYET': { color: 'gold', label: 'Chờ phê duyệt' },
  'DUOC_PHE_DUYET': { color: 'green', label: 'Được phê duyệt' },
  'TU_CHOI': { color: 'red', label: 'Từ chối' },
};

export default function CauCangDeleteConfirm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<CauCang | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    (async () => {
      try {
        const data = await fetchCauCangById(id);
        setEntity(data);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      cauCangDeleteSchema.parse({ confirmed });
      if (!confirmed) {
        toast.warning('Bạn cần xác nhận để xóa');
        setSubmitting(false);
        return;
      }
      await deleteCauCang(id);
      toast.success('Xóa cầu cảng thành công');
      navigate('/caucang');
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Bạn cần xác nhận để xóa') {
        toast.warning(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  }, [id, confirmed, navigate]);

  if (isLoading) return <LoadingSkeleton rows={10} />;
  if (isError) return <ErrorState message="Không tìm thấy cầu cảng để xóa" onRetry={() => navigate('/caucang')} />;
  if (!entity) return null;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/caucang/${id}`)}>Quay lại</Button>
          <Typography.Title level={5} style={{ margin: 0 }}>Xác nhận xóa cầu cảng</Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 560, margin: '0 auto', marginBottom: 16 }}>
        {/* Delete Info Card */}
        <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
          Mã cầu: {entity.maCau}
        </Typography.Text>
        <Typography.Text style={{ display: 'block', marginBottom: 12 }}>
          Tên cầu: {entity.tenCau}
        </Typography.Text>

        <Row gutter={[16, 8]}>
          <Col span={8}>
            <Typography.Text type="secondary">Bến cảng chủ:</Typography.Text>
            <br />
            <Typography.Text>{entity.benCangId}</Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">Chiều dài:</Typography.Text>
            <br />
            <Typography.Text>{entity.chieuDai !== null ? `${entity.chieuDai.toFixed(2)} m` : '—'}</Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">Tải trọng:</Typography.Text>
            <br />
            <Typography.Text>{entity.taiTrong !== null ? `${entity.taiTrong.toFixed(2)} tấn` : '—'}</Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">Loại cầu:</Typography.Text>
            <br />
            <Typography.Text>{entity.loaiCau || '—'}</Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">Trạng thái HĐ:</Typography.Text>
            <br />
            <Tag color={STATUS_MAP[entity.trangThaiHoatDong]?.color}>
              {STATUS_MAP[entity.trangThaiHoatDong]?.label}
            </Tag>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">Phê duyệt:</Typography.Text>
            <br />
            <Tag color={APPROVAL_MAP[entity.trangThaiPheDuyet]?.color}>
              {APPROVAL_MAP[entity.trangThaiPheDuyet]?.label}
            </Tag>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">Người tạo:</Typography.Text>
            <br />
            <Typography.Text>{entity.createdBy || '—'}</Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary">Ngày tạo:</Typography.Text>
            <br />
            <Typography.Text>{entity.createdAt ? new Date(entity.createdAt).toLocaleString('vi-VN') : '—'}</Typography.Text>
          </Col>
        </Row>

        {/* Warning Callout */}
        <div
          style={{
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: 6,
            padding: '12px 16px',
            marginTop: 16,
          }}
        >
          <Typography.Text type="warning">
            ⚠️ Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ.
          </Typography.Text>
        </div>

        {/* Checkbox Confirm */}
        <div style={{ marginTop: 16 }}>
          <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}>
            Tôi xác nhận muốn xóa cầu cảng này
          </Checkbox>
        </div>
      </Card>

      {/* Footer */}
      <Card>
        <Space>
          <Button onClick={() => navigate(`/caucang/${id}`)}>Hủy</Button>
          <Button
            danger
            loading={submitting}
            disabled={!confirmed || submitting}
            onClick={handleDelete}
          >
            Xóa cầu cảng
          </Button>
        </Space>
      </Card>
    </>
  );
}
