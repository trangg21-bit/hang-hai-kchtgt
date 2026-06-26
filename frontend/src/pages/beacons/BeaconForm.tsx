import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, message, Tag } from 'antd';
import { ArrowLeftOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { beaconLightCRUD, approval } from '../../services/beaconService';
import type { CreateBeaconLightRequest, UpdateBeaconLightRequest } from '../../types/beacon';
import {
  BEACON_LIGHT_TYPE_OPTIONS,
  BEACON_STATUS_MAP,
  type BeaconStatus,
} from '../../types/beacon';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

export default function BeaconForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [entityData, setEntityData] = useState<{ status: BeaconStatus } | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await beaconLightCRUD.findById(id!);
          setEntityData({ status: data.status });
          form.setFieldsValue({
            name: data.name,
            code: data.code,
            type: data.type,
            longitude: data.longitude,
            latitude: data.latitude,
            lightRange: data.lightRange,
            lightColor: data.lightColor,
            description: data.description,
          });
        } catch {
          toast.error('Không thể tải thông tin đèn biển');
          navigate('/beacons');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

          // WGS84 validation
          if (values.latitude < -90 || values.latitude > 90) {
            message.error('Vĩ độ phải từ -90 đến 90');
            return;
          }
          if (values.longitude < -180 || values.longitude > 180) {
            message.error('Kinh độ phải từ -180 đến 180');
            return;
          }
          if (values.lightRange < 0.01 || values.lightRange > 60) {
            message.error('Bán kính chiếu sáng phải từ 0.01 đến 60');
            return;
          }

      setSubmitting(true);

      if (isEdit) {
          const payload: UpdateBeaconLightRequest = {
            name: values.name,
            type: values.type,
            longitude: values.longitude,
            latitude: values.latitude,
            lightRange: values.lightRange,
            lightColor: values.lightColor,
            description: values.description,
          };
        await beaconLightCRUD.update(id!, payload);
        toast.success('Đã cập nhật đèn biển');
      } else {
          const payload: CreateBeaconLightRequest = {
            name: values.name,
            code: values.code,
            type: values.type,
            longitude: values.longitude,
            latitude: values.latitude,
            lightRange: values.lightRange,
            lightColor: values.lightColor,
            description: values.description,
          };
        await beaconLightCRUD.create(payload);
        toast.success('Đã tạo đèn biển');
      }

      navigate('/beacons');
    } catch {
      // validation errors or API errors (handled globally by Axios interceptor in api.ts)
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const confirmed = window.confirm('Bạn có chắc muốn xóa đèn biển này?');
    if (!confirmed) return;
    try {
      await beaconLightCRUD.delete(id);
      toast.success('Đã xóa đèn biển');
      navigate('/beacons');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleSubmitApproval = useCallback(async () => {
    if (!id) return;
    try {
      await approval.submitForApproval(id);
      toast.success('Đã gửi duyệt đèn biển');
      navigate('/beacons');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL1 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await approval.approveL1(id, approverId);
      toast.success('Đã phê duyệt cấp 1');
      navigate('/beacons');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL2 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await approval.approveL2(id, approverId);
      toast.success('Đã phê duyệt cấp 2');
      navigate('/beacons');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleReject = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    const reason = window.prompt('Lý do từ chối:', '');
    if (reason === null) return;
    try {
      setRejectLoading(true);
      await approval.reject(id, reason, approverId);
      toast.success('Đã từ chối');
      navigate('/beacons');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/beacons')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa đèn biển' : 'Thêm đèn biển mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <FormField
              type="text"
              name="code"
              label="Mã đèn biển"
              required
              placeholder="VD: BL-HAIPHONG-001"
              help="Mã định danh duy nhất cho đèn biển"
            />
          )}

          {isEdit && (
            <FormField
              type="text"
              name="code"
              label="Mã đèn biển"
              disabled
            />
          )}

          <FormField
            type="text"
            name="name"
            label="Tên đèn biển"
            required
            placeholder="VD: Đèn biển Hải Phòng"
          />

          <FormField
            type="select"
            name="type"
            label="Loại đèn biển"
            required
            options={BEACON_LIGHT_TYPE_OPTIONS}
            disabled={isEdit && (entityData?.status === 'APPROVED_L2' || entityData?.status === 'PUBLISHED')}
          />

           <Row style={{ display: 'flex', gap: 16 }}>
             <Col style={{ flex: 1 }}>
               <FormField
                 type="number"
                 name="longitude"
                 label="Kinh độ (Longitude)"
                 required
                 min={-180}
                 max={180}
                 step={0.0001}
                 placeholder="-106.7"
                 help="WGS84: -180 ~ 180"
               />
             </Col>
             <Col style={{ flex: 1 }}>
               <FormField
                 type="number"
                 name="latitude"
                 label="Vĩ độ (Latitude)"
                 required
                 min={-90}
                 max={90}
                 step={0.0001}
                 placeholder="20.9"
                 help="WGS84: -90 ~ 90"
               />
             </Col>
           </Row>

           <FormField
             type="number"
             name="lightRange"
             label="Bán kính chiếu sáng (Light Range, km)"
             required
             min={0.01}
             max={60}
             step={0.01}
             placeholder="VD: 5.0"
             help="Bán kính chiếu sáng: 0.01 ~ 60 km"
           />

           <FormField
             type="text"
             name="lightColor"
             label="Màu ánh sáng"
             placeholder="VD: Trắng, Đỏ, Xanh..."
           />

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả về đèn biển..."
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? 'Cập nhật' : 'Tạo đèn biển'}
              </Button>
              <Button onClick={() => navigate('/beacons')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Approval actions — shown only when editing */}
      {isEdit && entityData && (
        <Card style={{ maxWidth: 700, margin: '0 auto' }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thao tác phê duyệt
          </Typography.Text>
          <Space wrap>
            <Tag color={BEACON_STATUS_MAP[entityData.status]?.color || 'default'}>
              {BEACON_STATUS_MAP[entityData.status]?.label || entityData.status}
            </Tag>

            <Button
              type="dashed"
              onClick={() => navigate(`/history?entityId=${id}&type=BEACON_LIGHT`)}
            >
              Lịch sử thay đổi
            </Button>

            {entityData.status === 'DRAFT' && (
              <Button
                icon={<SendOutlined />}
                onClick={handleSubmitApproval}
              >
                Gửi duyệt
              </Button>
            )}

            {entityData.status === 'PENDING_APPROVAL' && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleApproveL1}
                >
                  Phê duyệt L1
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={rejectLoading}
                  onClick={handleReject}
                >
                  Từ chối
                </Button>
              </>
            )}

            {entityData.status === 'APPROVED_L1' && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleApproveL2}
                >
                  Phê duyệt L2
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={rejectLoading}
                  onClick={handleReject}
                >
                  Từ chối
                </Button>
              </>
            )}

            {entityData.status === 'DRAFT' && (
              <Button
                danger
                onClick={handleDelete}
              >
                Xóa
              </Button>
            )}
          </Space>
        </Card>
      )}
    </>
  );
}
