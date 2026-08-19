import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, Tag } from 'antd';
import { ArrowLeftOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { waterZoneCRUD, waterZoneApproval, portCRUD } from '../../services/portService';
import type { CreateVungNuocRequest, UpdateVungNuocRequest } from '../../types/port';
import { BECBANG_STATUS_MAP, type CangBenStatus } from '../../types/port';
import FormField from '../../components/FormField';
import { radiusPill, fontSizeMd, borderDefault, textSecondary, actionPrimary } from '../../tokens';
import toast, { message } from '../../components/ToastNotification';

export default function WaterZoneForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [entityData, setEntityData] = useState<{ status: CangBenStatus } | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [cangBienOptions, setCangBienOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await portCRUD.search({ page: 1, pageSize: 1000 });
        setCangBienOptions((res.data || []).map((cb: any) => ({ value: cb.id, label: cb.portName })));
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await waterZoneCRUD.findById(id!);
          setEntityData({ status: data.approvalStatus as CangBenStatus });
          form.setFieldsValue({
            waterZoneCode: data.waterZoneCode,
            waterZoneName: data.waterZoneName,
            portId: data.portId,
            area: data.area,
            doSauMax: data.doSauMax,
            doSauTrungBinh: data.doSauTrungBinh,
            loaiVungNuoc: data.loaiVungNuoc,
            operationalStatus: data.operationalStatus,
          });
        } catch {
          toast.error('Không thể tải thông tin vùng nước');
          navigate('/WaterZone');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateVungNuocRequest & { id: string } = {
          ...values,
          id: id!,
        };
        await waterZoneCRUD.update(payload);
        toast.success('Đã cập nhật vùng nước');
      } else {
        const payload: CreateVungNuocRequest = {
          waterZoneCode: values.waterZoneCode,
          waterZoneName: values.waterZoneName,
          portId: values.portId,
          area: values.area,
          doSauMax: values.doSauMax,
          doSauTrungBinh: values.doSauTrungBinh,
          loaiVungNuoc: values.loaiVungNuoc,
          operationalStatus: values.operationalStatus,
          approvalStatus: 'DRAFT',
        };
        await waterZoneCRUD.create(payload);
        toast.success('Đã tạo vùng nước');
      }

      navigate('/WaterZone');
    } catch {
      // validation errors or API errors (handled globally by Axios interceptor in api.ts)
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const confirmed = window.confirm('Bạn có chắc muốn xóa vùng nước này?');
    if (!confirmed) return;
    try {
      await waterZoneCRUD.delete(id);
      toast.success('Đã xóa vùng nước');
      navigate('/WaterZone');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleSubmitApproval = useCallback(async () => {
    if (!id) return;
    try {
      await waterZoneApproval.approve(id);
      toast.success('Đã gửi duyệt vùng nước');
      navigate('/WaterZone');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL1 = useCallback(async () => {
    if (!id) return;
    try {
      await waterZoneApproval.approve(id);
      toast.success('Đã phê duyệt cấp 1');
      navigate('/WaterZone');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL2 = useCallback(async () => {
    if (!id) return;
    try {
      await waterZoneApproval.approve(id);
      toast.success('Đã phê duyệt cấp 2');
      navigate('/WaterZone');
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
      await waterZoneApproval.reject(id, reason);
      toast.success('Đã từ chối');
      navigate('/WaterZone');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/WaterZone')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa vùng nước' : 'Thêm vùng nước mới'}
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
              name="waterZoneCode"
              label="Mã vùng nước"
              required
              placeholder="VD: VN-HAIPHONG-001"
              help="Mã định danh duy nhất cho vùng nước"
            />
          )}
          {isEdit && (
            <FormField
              type="text"
              name="waterZoneCode"
              label="Mã vùng nước"
              disabled
            />
          )}

          <FormField
            type="text"
            name="waterZoneName"
            label="Tên vùng nước"
            required
            placeholder="VD: Vùng nước cảng Hải Phòng"
          />

          <FormField
            type="select"
            name="portId"
            label="Cảng biển"
            placeholder="Chọn cảng biển cha"
            options={cangBienOptions}
            help="Chọn cảng biển chứa vùng nước này"
          />

          <FormField
            type="text"
            name="loaiVungNuoc"
            label="Loại vùng nước"
            placeholder="Nhập loại vùng nước"
            maxLength={100}
          />

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <FormField
                type="number"
                name="area"
                label="Diện tích (m²)"
                min={0}
                step={0.01}
                placeholder="VD: 100000.0"
                help="Diện tích vùng nước tính bằng mét vuông"
              />
            </Col>
            <Col xs={24} md={8}>
              <FormField
                type="number"
                name="doSauMax"
                label="Độ sâu tối đa (m)"
                min={0}
                step={0.01}
                placeholder="VD: 15.0"
                help="Độ sâu tối đa của vùng nước"
              />
            </Col>
            <Col xs={24} md={8}>
              <FormField
                type="number"
                name="doSauTrungBinh"
                label="Độ sâu trung bình (m)"
                min={0}
                step={0.01}
                placeholder="VD: 10.0"
                help="Độ sâu trung bình của vùng nước"
              />
            </Col>
          </Row>

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
                {isEdit ? 'Cập nhật' : 'Tạo vùng nước'}
              </Button>
              <Button onClick={() => navigate('/WaterZone')} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
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
            <Button type="dashed" onClick={() => navigate(`/history?entityId=${id}&type=VUNG_NUOC`)}>Lịch sử thay đổi</Button>
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
