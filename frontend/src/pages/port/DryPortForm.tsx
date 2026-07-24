import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, message, Tag } from 'antd';
import { ArrowLeftOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { dryPortCRUD, dryPortApproval } from '../../services/portService';
import type { CreateCangCanRequest, UpdateCangCanRequest } from '../../types/port';
import { BECBANG_STATUS_MAP, type CangBenStatus } from '../../types/port';
import FormField from '../../components/FormField';
import { radiusPill, fontSizeMd, borderDefault, textSecondary, actionPrimary } from '../../tokens';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';

export default function DryPortForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [entityData, setEntityData] = useState<{ status: CangBenStatus } | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await dryPortCRUD.findById(id!);
          setEntityData({ status: data.approvalStatus as CangBenStatus });
          form.setFieldsValue({
            dryPortCode: data.dryPortCode,
            dryPortName: data.dryPortName,
            province: data.province,
            viDo: data.viDo,
            kinhDo: data.kinhDo,
            area: data.area,
            congSuatTEU: data.congSuatTEU,
            operationalStatus: data.operationalStatus,
          });
        } catch {
          toast.error('Không thể tải thông tin cảng cạn');
          navigate('/DryPort');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      // GPS pair constraint: both or neither
      const hasViDo = values.viDo !== undefined && values.viDo !== null && values.viDo !== '';
      const hasKinhDo = values.kinhDo !== undefined && values.kinhDo !== null && values.kinhDo !== '';
      if (hasViDo !== hasKinhDo) {
        message.error('Vui lòng nhập cả Vĩ độ và Kinh độ hoặc bỏ qua cả hai');
        return;
      }
      if (hasViDo && (values.viDo < -90 || values.viDo > 90)) {
        message.error('Vĩ độ phải từ -90 đến 90');
        return;
      }
      if (hasKinhDo && (values.kinhDo < -180 || values.kinhDo > 180)) {
        message.error('Kinh độ phải từ -180 đến 180');
        return;
      }

      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateCangCanRequest & { id: string } = {
          ...values,
          id: id!,
        };
        await dryPortCRUD.update(payload);
        toast.success('Đã cập nhật cảng cạn');
      } else {
        const payload: CreateCangCanRequest = {
          dryPortCode: values.dryPortCode,
          dryPortName: values.dryPortName,
          province: values.province,
          viDo: values.viDo,
          kinhDo: values.kinhDo,
          area: values.area,
          congSuatTEU: values.congSuatTEU,
          operationalStatus: values.operationalStatus,
          approvalStatus: 'DRAFT',
          orgUnitId: '',
        };
        await dryPortCRUD.create(payload);
        toast.success('Đã tạo cảng cạn');
      }

      navigate('/DryPort');
    } catch {
      // validation errors or API errors (handled globally by Axios interceptor in api.ts)
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const confirmed = window.confirm('Bạn có chắc muốn xóa cảng cạn này?');
    if (!confirmed) return;
    try {
      await dryPortCRUD.delete(id);
      toast.success('Đã xóa cảng cạn');
      navigate('/DryPort');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleSubmitApproval = useCallback(async () => {
    if (!id) return;
    try {
      await dryPortApproval.approve(id);
      toast.success('Đã gửi duyệt cảng cạn');
      navigate('/DryPort');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL1 = useCallback(async () => {
    if (!id) return;
    try {
      await dryPortApproval.approve(id);
      toast.success('Đã phê duyệt cấp 1');
      navigate('/DryPort');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL2 = useCallback(async () => {
    if (!id) return;
    try {
      await dryPortApproval.approve(id);
      toast.success('Đã phê duyệt cấp 2');
      navigate('/DryPort');
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
      await dryPortApproval.reject(id, reason);
      toast.success('Đã từ chối');
      navigate('/DryPort');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/DryPort')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa cảng cạn' : 'Thêm cảng cạn mới'}
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
              name="dryPortCode"
              label="Mã cảng cạn"
              required
              placeholder="VD: CC-HAIPHONG-001"
              help="Mã định danh duy nhất cho cảng cạn"
            />
          )}
          {isEdit && (
            <FormField
              type="text"
              name="dryPortCode"
              label="Mã cảng cạn"
              disabled
            />
          )}

          <FormField
            type="text"
            name="dryPortName"
            label="Tên cảng cạn"
            required
            placeholder="VD: Cảng cạn Nội Bài"
          />

          <FormField
            type="select"
            name="province"
            label="Tỉnh / Thành phố"
            placeholder="Chọn tỉnh/thành phố..."
            options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))}
          />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <FormField
                type="number"
                name="viDo"
                label="Vĩ độ (Latitude)"
                min={-90}
                max={90}
                step={0.0001}
                placeholder="21.0"
                help="WGS84: -90 ~ 90"
              />
            </Col>
            <Col xs={24} md={12}>
              <FormField
                type="number"
                name="kinhDo"
                label="Kinh độ (Longitude)"
                min={-180}
                max={180}
                step={0.0001}
                placeholder="105.8"
                help="WGS84: -180 ~ 180"
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <FormField
                type="number"
                name="area"
                label="Diện tích (m²)"
                min={0}
                step={0.01}
                placeholder="VD: 50000.0"
                help="Diện tích cảng cạn tính bằng mét vuông"
              />
            </Col>
            <Col xs={24} md={12}>
              <FormField
                type="number"
                name="congSuatTEU"
                label="Công suất (TEU)"
                min={0}
                step={1}
                placeholder="VD: 100000"
                help="Công suất xử lý container tính bằng TEU"
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
                {isEdit ? 'Cập nhật' : 'Tạo cảng cạn'}
              </Button>
              <Button onClick={() => navigate('/DryPort')} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
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
            <Button type="dashed" onClick={() => navigate(`/history?entityId=${id}&type=CANG_CAN`)}>Lịch sử thay đổi</Button>
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
