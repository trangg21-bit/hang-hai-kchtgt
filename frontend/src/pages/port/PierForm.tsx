import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, message, Tag } from 'antd';
import { ArrowLeftOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { pierCRUD, pierApproval, berthCRUD } from '../../services/portService';
import type { CreateCauCangRequest, UpdateCauCangRequest } from '../../types/port';
import { BECBANG_STATUS_MAP, type CangBenStatus } from '../../types/port';
import FormField from '../../components/FormField';
import { radiusPill, fontSizeMd, borderDefault, textSecondary, actionPrimary } from '../../tokens';
import toast from '../../components/ToastNotification';

export default function PierForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [entityData, setEntityData] = useState<{ status: CangBenStatus } | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [benCangOptions, setBenCangOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await berthCRUD.search({ page: 1, pageSize: 1000 });
        setBenCangOptions((res.data || []).map((bc: any) => ({ value: bc.id, label: bc.berthName })));
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await pierCRUD.findById(id!);
          setEntityData({ status: data.approvalStatus as CangBenStatus });
          form.setFieldsValue({
            pierCode: data.pierCode,
            pierName: data.pierName,
            berthId: data.berthId,
            length: data.length,
            taiTrong: data.taiTrong,
            loaiCau: data.loaiCau,
            operationalStatus: data.operationalStatus,
          });
        } catch {
          toast.error('Không thể tải thông tin cầu cảng');
          navigate('/Pier');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateCauCangRequest & { id: string } = {
          ...values,
          id: id!,
        };
        await pierCRUD.update(payload);
        toast.success('Đã cập nhật cầu cảng');
      } else {
        const payload: CreateCauCangRequest = {
          pierCode: values.pierCode,
          pierName: values.pierName,
          berthId: values.berthId,
          length: values.length,
          taiTrong: values.taiTrong,
          loaiCau: values.loaiCau,
          operationalStatus: values.operationalStatus,
          approvalStatus: 'DRAFT',
        };
        await pierCRUD.create(payload);
        toast.success('Đã tạo cầu cảng');
      }

      navigate('/Pier');
    } catch {
      // validation errors or API errors (handled globally by Axios interceptor in api.ts)
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const confirmed = window.confirm('Bạn có chắc muốn xóa cầu cảng này?');
    if (!confirmed) return;
    try {
      await pierCRUD.delete(id);
      toast.success('Đã xóa cầu cảng');
      navigate('/Pier');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleSubmitApproval = useCallback(async () => {
    if (!id) return;
    try {
      await pierApproval.approve(id);
      toast.success('Đã gửi duyệt cầu cảng');
      navigate('/Pier');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL1 = useCallback(async () => {
    if (!id) return;
    try {
      await pierApproval.approve(id);
      toast.success('Đã phê duyệt cấp 1');
      navigate('/Pier');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL2 = useCallback(async () => {
    if (!id) return;
    try {
      await pierApproval.approve(id);
      toast.success('Đã phê duyệt cấp 2');
      navigate('/Pier');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleReject = useCallback(async () => {
    if (!id) return;
    const reason = window.prompt('Lý do từ chối:', '');
    if (reason === null) return;
    try {
      setRejectLoading(true);
      await pierApproval.reject(id, reason);
      toast.success('Đã từ chối');
      navigate('/Pier');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    } finally {
      setRejectLoading(false);
    }
  }, [id, navigate]);

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/Pier')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa cầu cảng' : 'Thêm cầu cảng mới'}
          </Typography.Title>
        </Space>
      </Card>

      {/* Approval status tag for edit mode */}
      {isEdit && entityData && (
        <Card style={{ maxWidth: 800, margin: '0 auto', marginBottom: 16, padding: '12px 24px' }}>
          <Space>
            <Typography.Text strong>Trạng thái phê duyệt:</Typography.Text>
            <Tag color={BECBANG_STATUS_MAP[entityData.status]?.color || 'default'}>
              {BECBANG_STATUS_MAP[entityData.status]?.label || entityData.status}
            </Tag>
          </Space>
        </Card>
      )}

      <Card style={{ maxWidth: 800, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <FormField
              type="text"
              name="pierCode"
              label="Mã cầu"
              required
              placeholder="VD: CC-HAIPHONG-001"
              help="Mã định danh duy nhất cho cầu cảng"
            />
          )}
          {isEdit && (
            <FormField
              type="text"
              name="pierCode"
              label="Mã cầu"
              disabled
            />
          )}

          <FormField
            type="text"
            name="pierName"
            label="Tên cầu cảng"
            required
            placeholder="VD: Cầu cảng số 1"
          />

          <FormField
            type="select"
            name="berthId"
            label="Bến cảng"
            placeholder="Chọn bến cảng cha"
            options={benCangOptions}
            help="Chọn bến cảng chứa cầu này"
          />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <FormField
                type="number"
                name="length"
                label="Chiều dài (m)"
                min={0}
                step={0.01}
                placeholder="VD: 100.0"
                help="Chiều dài cầu cảng tính bằng mét"
              />
            </Col>
            <Col xs={24} md={12}>
              <FormField
                type="number"
                name="taiTrong"
                label="Tải trọng (tấn)"
                min={0}
                step={0.01}
                placeholder="VD: 500.0"
                help="Tải trọng tối đa tính bằng tấn"
              />
            </Col>
          </Row>

          <FormField
            type="text"
            name="loaiCau"
            label="Loại cầu"
            placeholder="VD: Cầu tàu thẳng, Cầu tàu góc..."
            disabled={isEdit && (entityData?.status === 'APPROVED_L2' || entityData?.status === 'PUBLISHED')}
          />

          <FormField
            type="select"
            name="operationalStatus"
            label="Trạng thái hoạt động"
            options={[
              { label: 'Hiện hành', value: 'HIEN_HANH' },
              { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
            ]}
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>
                {isEdit ? 'Cập nhật' : 'Tạo cầu cảng'}
              </Button>
              <Button onClick={() => navigate('/Pier')} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Approval actions — shown only when editing */}
      {isEdit && entityData && (
        <Card style={{ maxWidth: 800, margin: '0 auto' }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thao tác phê duyệt
          </Typography.Text>
          <Space wrap>
            <Button type="dashed" onClick={() => navigate(`/history?entityId=${id}&type=CAU_CANG`)}>Lịch sử thay đổi</Button>
            {entityData.status === 'DRAFT' && (
              <Button icon={<SendOutlined />} onClick={handleSubmitApproval}>Gửi duyệt</Button>
            )}
            {entityData.status === 'PENDING_APPROVAL' && (
              <>
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApproveL1}>Phê duyệt L1</Button>
                <Button danger icon={<CloseCircleOutlined />} loading={rejectLoading} onClick={handleReject}>Từ chối</Button>
              </>
            )}
            {entityData.status === 'APPROVED_L1' && (
              <>
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApproveL2}>Phê duyệt L2</Button>
                <Button danger icon={<CloseCircleOutlined />} loading={rejectLoading} onClick={handleReject}>Từ chối</Button>
              </>
            )}
            {entityData.status === 'DRAFT' && (
              <Button danger onClick={handleDelete}>Xóa</Button>
            )}
          </Space>
        </Card>
      )}
    </>
  );
}
