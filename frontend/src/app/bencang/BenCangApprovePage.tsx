import { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Space, Typography, Card, Divider, Tag, Form } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { benCangCRUD, benCangApproval } from '../../services/cangbenService';
import type { BenCang } from '../../types/cangben';
import { APPROVAL_STATUS_MAP } from '../../types/cangben';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { z } from 'zod';
import { approveSchema, rejectSchema } from './schema';

const { Text } = Typography;

export default function BenCangApprovePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<BenCang | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'approve' | 'reject'>('approve');
  const [formValues, setFormValues] = useState({ reason: '', confirmed: false });

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    (async () => {
      try {
        const data = await benCangCRUD.findById(id);
        setEntity(data);
      } catch (err: unknown) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Không thể tải thông tin bến cảng'));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleOpenModal = useCallback(() => {
    setFormValues({ reason: '', confirmed: false });
    setActiveTab('approve');
    setModalOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!id) return;

    // Validate confirm checkbox
    try {
      approveSchema.parse({ confirmed: formValues.confirmed });
    } catch {
      toast.warning('Bạn cần xác nhận hành động này');
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === 'approve') {
        await benCangApproval.approve(id);
        toast.success('Phê duyệt bến cảng thành công');
        setModalOpen(false);
        const updated = await benCangCRUD.findById(id);
        setEntity(updated);
        navigate(`/bencang/${id}`);
      } else {
        // Validate reject reason
        rejectSchema.parse({ reason: formValues.reason, confirmed: formValues.confirmed });
        await benCangApproval.reject(id, formValues.reason);
        toast.success('Từ chối bến cảng thành công');
        setModalOpen(false);
        const updated = await benCangCRUD.findById(id);
        setEntity(updated);
        navigate(`/bencang/${id}`);
      }
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  }, [id, activeTab, formValues, navigate]);

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState message={error?.message || 'Không thể tải thông tin'} onRetry={() => navigate(-1)} />;
  if (!entity) return <ErrorState message="Không tìm thấy bến cảng" onRetry={() => navigate(-1)} />;

  return (
    <>
      {/* Approve/Reject trigger */}
      <Card style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleOpenModal}>
          Phê duyệt / Từ chối
        </Button>
      </Card>

      {/* Entity Summary */}
      <Card style={{ marginBottom: 16, maxWidth: 800, margin: '0 auto' }}>
        <Typography.Title level={5}>{entity.maBen} — {entity.tenBen}</Typography.Title>
        <Row gutter={16}>
          <Col span={12}>
            <Text type="secondary">Mã bến:</Text><br />
            <Text strong>{entity.maBen}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">Tên bến:</Text><br />
            <Text strong>{entity.tenBen}</Text>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Text type="secondary">Cảng biển chủ:</Text><br />
            <Text>{entity.cangBienId}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">Tuyến đường thủy:</Text><br />
            <Text>{entity.tuyenDuongThuy || '—'}</Text>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Text type="secondary">Chiều dài (m):</Text><br />
            <Text>{entity.chieuDai?.toFixed(2) || '—'}</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Chiều rộng (m):</Text><br />
            <Text>{entity.chieuRong?.toFixed(2) || '—'}</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Loại bến:</Text><br />
            <Text>{entity.loaiBen || '—'}</Text>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Text type="secondary">Độ sâu luồng (m):</Text><br />
            <Text>{entity.doSauLuong?.toFixed(2) || '—'}</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Vĩ độ:</Text><br />
            <Text>{entity.viDo?.toFixed(6) || '—'}</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Kinh độ:</Text><br />
            <Text>{entity.kinhDo?.toFixed(6) || '—'}</Text>
          </Col>
        </Row>
        <Divider />
        <Text type="secondary">Phê duyệt hiện tại:</Text>{' '}
        <Tag color={APPROVAL_STATUS_MAP[entity.trangThaiPheDuyet as keyof typeof APPROVAL_STATUS_MAP]?.color || 'default'}>
          {APPROVAL_STATUS_MAP[entity.trangThaiPheDuyet as keyof typeof APPROVAL_STATUS_MAP]?.label || entity.trangThaiPheDuyet}
        </Tag>
      </Card>

      {/* Approval Modal */}
      <Modal
        open={modalOpen}
        title="Phê duyệt / Từ chối bến cảng"
        onCancel={() => { setModalOpen(false); setFormValues({ reason: '', confirmed: false }); }}
        onOk={handleConfirm}
        confirmLoading={submitting}
        centered
        width={600}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Tab Switcher */}
          <Space direction="vertical">
            <Button
              type={activeTab === 'approve' ? 'primary' : 'default'}
              onClick={() => setActiveTab('approve')}
            >
              ✅ Phê duyệt
            </Button>
            <Button
              type={activeTab === 'reject' ? 'primary' : 'default'}
              onClick={() => setActiveTab('reject')}
            >
              ❌ Từ chối
            </Button>
          </Space>

          {/* Approval Form */}
          <Form layout="vertical">
            {activeTab === 'reject' && (
              <Form.Item
                label="Lý do từ chối"
                required
                rules={[
                  { required: true, message: 'Lý do từ chối không được để trống' },
                  { min: 10, message: 'Lý do từ chối tối thiểu 10 ký tự' },
                  { max: 500, message: 'Lý do từ chối tối đa 500 ký tự' },
                ]}
                help="Tối thiểu 10 ký tự, tối đa 500 ký tự"
              >
                <textarea
                  rows={4}
                  style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}
                  placeholder="Nhập lý do từ chối..."
                  value={formValues.reason}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, reason: e.target.value }))}
                />
              </Form.Item>
            )}

            <Form.Item>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={formValues.confirmed}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, confirmed: e.target.checked }))}
                />
                Tôi xác nhận hành động này
              </label>
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </>
  );
}
