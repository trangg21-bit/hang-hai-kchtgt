import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, message, Tag } from 'antd';
import { ArrowLeftOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { portCRUD, portApproval } from '../../services/portService';
import type { CreateCangBienRequest, UpdateCangBienRequest } from '../../types/port';
import { BECBANG_STATUS_MAP } from '../../types/port';
import FormField from '../../components/FormField';
import { radiusPill, fontSizeMd, borderDefault, textSecondary, actionPrimary } from '../../tokens';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';

export default function PortForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [entityData, setEntityData] = useState<{ approvalStatus: string } | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await portCRUD.findById(id!);
          setEntityData({ approvalStatus: data.approvalStatus });
          form.setFieldsValue({
            portCode: data.portCode,
            portName: data.portName,
            province: data.province,
            latitude: data.latitude,
            longitude: data.longitude,
            area: data.area,
            khaNangTiepNhan: data.khaNangTiepNhan,
            operationalStatus: data.operationalStatus,
          });
        } catch {
          toast.error('Không thể tải thông tin cảng biển');
          navigate('/Port');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      // GPS pair constraint: both or neither
      const hasViDo = values.latitude !== undefined && values.latitude !== null && values.latitude !== '';
      const hasKinhDo = values.longitude !== undefined && values.longitude !== null && values.longitude !== '';
      if (hasViDo !== hasKinhDo) {
        message.error('Vui lòng nhập cả Vĩ độ và Kinh độ hoặc bỏ qua cả hai');
        return;
      }
      if (hasViDo && (values.latitude < -90 || values.latitude > 90)) {
        message.error('Vĩ độ phải từ -90 đến 90');
        return;
      }
      if (hasKinhDo && (values.longitude < -180 || values.longitude > 180)) {
        message.error('Kinh độ phải từ -180 đến 180');
        return;
      }

      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateCangBienRequest = {
          portName: values.portName,
          province: values.province,
          latitude: values.latitude,
          longitude: values.longitude,
          area: values.area,
          khaNangTiepNhan: values.khaNangTiepNhan,
          operationalStatus: values.operationalStatus,
        };
        await portCRUD.update({ ...payload, id: id! });
        toast.success('Đã cập nhật cảng biển');
      } else {
        const payload: CreateCangBienRequest = {
          portCode: values.portCode,
          portName: values.portName,
          province: values.province,
          latitude: values.latitude,
          longitude: values.longitude,
          area: values.area,
          khaNangTiepNhan: values.khaNangTiepNhan,
          operationalStatus: values.operationalStatus,
          approvalStatus: 'DRAFT',
          orgUnitId: '',
        };
        await portCRUD.create(payload);
        toast.success('Đã tạo cảng biển');
      }

      navigate('/Port');
    } catch {
      // validation errors or API errors (handled globally by Axios interceptor in api.ts)
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const confirmed = window.confirm('Bạn có chắc muốn xóa cảng biển này?');
    if (!confirmed) return;
    try {
      await portCRUD.delete(id);
      toast.success('Đã xóa cảng biển');
      navigate('/Port');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleSubmitApproval = useCallback(async () => {
    if (!id) return;
    try {
      await portApproval.approve(id);
      toast.success('Đã gửi duyệt cảng biển');
      navigate('/Port');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL1 = useCallback(async () => {
    if (!id) return;
    try {
      await portApproval.approve(id);
      toast.success('Đã phê duyệt cấp 1');
      navigate('/Port');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL2 = useCallback(async () => {
    if (!id) return;
    try {
      await portApproval.approve(id);
      toast.success('Đã phê duyệt cấp 2');
      navigate('/Port');
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
      await portApproval.reject(id, reason);
      toast.success('Đã từ chối');
      navigate('/Port');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/Port')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa cảng biển' : 'Thêm cảng biển mới'}
          </Typography.Title>
        </Space>
      </Card>

      {/* Approval status tag for edit mode */}
      {isEdit && entityData && (
        <Card style={{ maxWidth: 800, margin: '0 auto', marginBottom: 16, padding: '12px 24px' }}>
          <Space>
            <Typography.Text strong>Trạng thái phê duyệt:</Typography.Text>
            <Tag color={BECBANG_STATUS_MAP[entityData.approvalStatus as keyof typeof BECBANG_STATUS_MAP]?.color || 'default'}>
              {BECBANG_STATUS_MAP[entityData.approvalStatus as keyof typeof BECBANG_STATUS_MAP]?.label || entityData.approvalStatus}
            </Tag>
          </Space>
        </Card>
      )}

      <Card style={{ maxWidth: 800, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <FormField
              type="text"
              name="portCode"
              label="Mã cảng"
              required
              placeholder="VD: CB-HAIPHONG-001"
              help="Mã định danh duy nhất cho cảng biển"
            />
          )}
          {isEdit && (
            <FormField
              type="text"
              name="portCode"
              label="Mã cảng"
              disabled
            />
          )}

          <FormField
            type="text"
            name="portName"
            label="Tên cảng biển"
            required
            placeholder="VD: Cảng biển Hải Phòng"
          />

          <FormField
            type="select"
            name="province"
            label="Tỉnh/thành phố"
            placeholder="Chọn tỉnh/thành phố..."
            options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))}
          />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <FormField
                type="number"
                name="latitude"
                label="Vĩ độ (Latitude)"
                min={-90}
                max={90}
                step={0.0001}
                placeholder="20.9"
                help="WGS84: -90 ~ 90"
              />
            </Col>
            <Col xs={24} md={12}>
              <FormField
                type="number"
                name="longitude"
                label="Kinh độ (Longitude)"
                min={-180}
                max={180}
                step={0.0001}
                placeholder="-106.7"
                help="WGS84: -180 ~ 180"
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <FormField
                type="number"
                name="area"
                label="Diện tích (km²)"
                min={0}
                step={0.01}
                placeholder="VD: 100.0"
                help="Diện tích cảng biển"
              />
            </Col>
            <Col xs={24} md={12}>
              <FormField
                type="number"
                name="khaNangTiepNhan"
                label="Khả năng tiếp nhận (TEU/năm)"
                min={0}
                step={1}
                placeholder="VD: 500000"
                help="Khả năng tiếp nhận container hàng năm"
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
                {isEdit ? 'Cập nhật' : 'Tạo cảng biển'}
              </Button>
              <Button onClick={() => navigate('/Port')} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
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
            <Button
              type="dashed"
              onClick={() => navigate(`/history?entityId=${id}&type=CANG_BIE`)}
            >
              Lịch sử thay đổi
            </Button>
            {entityData.approvalStatus === 'DRAFT' && (
              <Button icon={<SendOutlined />} onClick={handleSubmitApproval}>Gửi duyệt</Button>
            )}
            {entityData.approvalStatus === 'PENDING_APPROVAL' && (
              <>
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApproveL1}>Phê duyệt L1</Button>
                <Button danger icon={<CloseCircleOutlined />} loading={rejectLoading} onClick={handleReject}>Từ chối</Button>
              </>
            )}
            {entityData.approvalStatus === 'APPROVED_L1' && (
              <>
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApproveL2}>Phê duyệt L2</Button>
                <Button danger icon={<CloseCircleOutlined />} loading={rejectLoading} onClick={handleReject}>Từ chối</Button>
              </>
            )}
            {entityData.approvalStatus === 'DRAFT' && (
              <Button danger onClick={handleDelete}>Xóa</Button>
            )}
          </Space>
        </Card>
      )}
    </>
  );
}
