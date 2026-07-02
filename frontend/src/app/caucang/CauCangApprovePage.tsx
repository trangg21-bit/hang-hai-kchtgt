import { useState, useCallback, useEffect } from 'react';
import { Card, Typography, Row, Col, Space, Button, Tag, Input, Divider, Checkbox } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { fetchCauCangById, approveCauCang, rejectCauCang } from './api';
import type { CauCang } from './types';
import { cauCangApproveSchema } from './schema';

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  'CHO_PHE_DUYET': { color: 'gold', label: 'Chờ phê duyệt' },
  'DUOC_PHE_DUYET': { color: 'green', label: 'Được phê duyệt' },
  'TU_CHOI': { color: 'red', label: 'Từ chối' },
};

type Tab = 'APPROVE' | 'REJECT';

export default function CauCangApprovePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<CauCang | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('APPROVE');
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
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

  const handleSubmit = useCallback(async () => {
    if (!id || !entity) return;
    setSubmitting(true);

    try {
      if (activeTab === 'APPROVE') {
        cauCangApproveSchema.parse({ confirmed });
        if (!confirmed) {
          toast.warning('Bạn cần xác nhận hành động này');
          setSubmitting(false);
          return;
        }
        await approveCauCang(id);
        toast.success('Phê duyệt cầu cảng thành công');
        navigate(`/caucang/${id}`);
      } else {
        // REJECT
        const reasonTrimmed = reason.trim();
        if (reasonTrimmed.length < 10) {
          toast.warning('Lý do từ chối tối thiểu 10 ký tự');
          setSubmitting(false);
          return;
        }
        if (!confirmed) {
          toast.warning('Bạn cần xác nhận hành động này');
          setSubmitting(false);
          return;
        }
        await rejectCauCang(id, reasonTrimmed);
        toast.success('Từ chối cầu cảng thành công');
        navigate(`/caucang/${id}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  }, [id, entity, activeTab, reason, confirmed, navigate]);

  if (isLoading) return <LoadingSkeleton rows={10} />;
  if (isError) return <ErrorState message="Không tìm thấy cầu cảng để phê duyệt" onRetry={() => navigate('/caucang')} />;
  if (!entity) return null;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/caucang/${id}`)}>Quay lại</Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Phê duyệt — {entity.maCau} — {entity.tenCau}
          </Typography.Title>
          <Tag color={APPROVAL_MAP[entity.trangThaiPheDuyet]?.color}>
            {APPROVAL_MAP[entity.trangThaiPheDuyet]?.label}
          </Tag>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto', marginBottom: 16 }}>
        {/* Approval Summary Card */}
        <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>Thông tin cầu cảng</Typography.Text>
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <Typography.Text type="secondary">Mã cầu:</Typography.Text>
            <br />
            <Typography.Text strong>{entity.maCau}</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Tên cầu:</Typography.Text>
            <br />
            <Typography.Text>{entity.tenCau}</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Bến cảng chủ:</Typography.Text>
            <br />
            <Typography.Text>{entity.benCangId}</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Loại cầu:</Typography.Text>
            <br />
            <Typography.Text>{entity.loaiCau || '—'}</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Chiều dài:</Typography.Text>
            <br />
            <Typography.Text>{entity.chieuDai !== null ? `${entity.chieuDai.toFixed(2)} m` : '—'}</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Tải trọng:</Typography.Text>
            <br />
            <Typography.Text>{entity.taiTrong !== null ? `${entity.taiTrong.toFixed(2)} tấn` : '—'}</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Người tạo:</Typography.Text>
            <br />
            <Typography.Text>{entity.createdBy || '—'}</Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text type="secondary">Ngày tạo:</Typography.Text>
            <br />
            <Typography.Text>{entity.createdAt ? new Date(entity.createdAt).toLocaleString('vi-VN') : '—'}</Typography.Text>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        {/* Tab Switcher */}
        <Space size="large">
          <Button
            type={activeTab === 'APPROVE' ? 'primary' : 'default'}
            icon={<CheckCircleOutlined />}
            onClick={() => setActiveTab('APPROVE')}
          >
            Phê duyệt
          </Button>
          <Button
            type={activeTab === 'REJECT' ? 'primary' : 'default'}
            danger={activeTab === 'REJECT'}
            icon={<CloseCircleOutlined />}
            onClick={() => setActiveTab('REJECT')}
          >
            Từ chối
          </Button>
        </Space>

        <Divider style={{ margin: '16px 0' }} />

        {/* Approval Form */}
        {activeTab === 'APPROVE' ? (
          <>
            <Typography.Text type="secondary">Xác nhận phê duyệt:</Typography.Text>
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do phê duyệt (tối thiểu 10 ký tự)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled
            />
            <div style={{ marginTop: 12 }}>
              <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}>
                Tôi xác nhận phê duyệt cầu cảng này
              </Checkbox>
            </div>
          </>
        ) : (
          <>
            <Typography.Text type="secondary">Lý do từ chối:</Typography.Text>
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự, tối đa 500 ký tự)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {reason.length > 0 && reason.length < 10 && (
              <Typography.Text type="warning" style={{ fontSize: 12, marginTop: 4 }}>
                Lý do từ chối tối thiểu 10 ký tự
              </Typography.Text>
            )}
            <div style={{ marginTop: 12 }}>
              <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}>
                Tôi xác nhận từ chối cầu cảng này
              </Checkbox>
            </div>
          </>
        )}
      </Card>

      {/* Footer */}
      <Card>
        <Space>
          <Button onClick={() => navigate(`/caucang/${id}`)}>Hủy</Button>
          <Button
            type={activeTab === 'APPROVE' ? 'primary' : 'default'}
            danger={activeTab === 'REJECT'}
            icon={activeTab === 'APPROVE' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            loading={submitting}
            disabled={submitting || (activeTab === 'REJECT' && reason.length < 10) || !confirmed}
            onClick={handleSubmit}
          >
            {activeTab === 'APPROVE' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
          </Button>
        </Space>
      </Card>
    </>
  );
}
