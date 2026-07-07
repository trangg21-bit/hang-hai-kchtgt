import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, message, Tag } from 'antd';
import { ArrowLeftOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { cangBienCRUD, cangBienApproval } from '../../services/cangbenService';
import type { CreateCangBienRequest, UpdateCangBienRequest } from '../../types/cangben';
import { BECBANG_STATUS_MAP } from '../../types/cangben';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

export default function CangBienForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [entityData, setEntityData] = useState<{ status: string } | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const data = await cangBienCRUD.findById(id!);
          setEntityData({ status: data.trangThaiPheDuyet });
          form.setFieldsValue({
            maCang: data.maCang,
            tenCang: data.tenCang,
            tinhThanhPho: data.tinhThanhPho,
            viDo: data.viDo,
            kinhDo: data.kinhDo,
            dienTich: data.dienTich,
            khaNangTiepNhan: data.khaNangTiepNhan,
            trangThaiHoatDong: data.trangThaiHoatDong,
          });
        } catch {
          toast.error('Không thể tải thông tin cảng biển');
          navigate('/cangbien');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      // WGS84 validation
      if (values.viDo < -90 || values.viDo > 90) {
        message.error('Vĩ độ phải từ -90 đến 90');
        return;
      }
      if (values.kinhDo < -180 || values.kinhDo > 180) {
        message.error('Kinh độ phải từ -180 đến 180');
        return;
      }

      setSubmitting(true);

      if (isEdit) {
        const payload: UpdateCangBienRequest = {
          tenCang: values.tenCang,
          tinhThanhPho: values.tinhThanhPho,
          viDo: values.viDo,
          kinhDo: values.kinhDo,
          dienTich: values.dienTich,
          khaNangTiepNhan: values.khaNangTiepNhan,
          trangThaiHoatDong: values.trangThaiHoatDong,
        };
        await cangBienCRUD.update({ ...payload, id: id! });
        toast.success('Đã cập nhật cảng biển');
      } else {
        const payload: CreateCangBienRequest = {
          maCang: values.maCang,
          tenCang: values.tenCang,
          tinhThanhPho: values.tinhThanhPho,
          viDo: values.viDo,
          kinhDo: values.kinhDo,
          dienTich: values.dienTich,
          khaNangTiepNhan: values.khaNangTiepNhan,
          trangThaiHoatDong: values.trangThaiHoatDong,
          trangThaiPheDuyet: 'DRAFT',
          orgUnitId: '',
        };
        await cangBienCRUD.create(payload);
        toast.success('Đã tạo cảng biển');
      }

      navigate('/cangbien');
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
      await cangBienCRUD.delete(id);
      toast.success('Đã xóa cảng biển');
      navigate('/cangbien');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleSubmitApproval = useCallback(async () => {
    if (!id) return;
    try {
      await cangBienApproval.approve(id);
      toast.success('Đã gửi duyệt cảng biển');
      navigate('/cangbien');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL1 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await cangBienApproval.approve(id);
      toast.success('Đã phê duyệt cấp 1');
      navigate('/cangbien');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL2 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await cangBienApproval.approve(id);
      toast.success('Đã phê duyệt cấp 2');
      navigate('/cangbien');
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
      await cangBienApproval.reject(id, reason);
      toast.success('Đã từ chối');
      navigate('/cangbien');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cangbien')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa cảng biển' : 'Thêm cảng biển mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <FormField
              type="text"
              name="maCang"
              label="Mã cảng"
              required
              placeholder="VD: CB-HAIPHONG-001"
              help="Mã định danh duy nhất cho cảng biển"
            />
          )}

          {isEdit && (
            <FormField
              type="text"
              name="maCang"
              label="Mã cảng"
              disabled
            />
          )}

          <FormField
            type="text"
            name="tenCang"
            label="Tên cảng biển"
            required
            placeholder="VD: Cảng biển Hải Phòng"
          />

          <FormField
            type="text"
            name="tinhThanhPho"
            label="Tỉnh/thành phố"
            placeholder="VD: Hải Phòng"
          />

          <Row style={{ display: 'flex', gap: 16 }}>
            <Col style={{ flex: 1 }}>
              <FormField
                type="number"
                name="kinhDo"
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
                name="viDo"
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
            name="dienTich"
            label="Diện tích (km²)"
            required
            min={0}
            step={0.01}
            placeholder="VD: 100.0"
            help="Diện tích cảng biển"
          />

          <FormField
            type="number"
            name="khaNangTiepNhan"
            label="Khả năng tiếp nhận (TEU/năm)"
            required
            min={0}
            step={1}
            placeholder="VD: 500000"
            help="Khả năng tiếp nhận container hàng năm"
          />

          <FormField
            type="select"
            name="trangThaiHoatDong"
            label="Trạng thái hoạt động"
            options={[
              { label: 'Hoạt động', value: 'ACTIVE' },
              { label: 'Tạm ngừng', value: 'SUSPENDED' },
              { label: 'Ngừng hoạt động', value: 'INACTIVE' },
            ]}
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? 'Cập nhật' : 'Tạo cảng biển'}
              </Button>
              <Button onClick={() => navigate('/cangbien')}>Hủy</Button>
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
            <Tag color={BECBANG_STATUS_MAP[entityData.status as keyof typeof BECBANG_STATUS_MAP]?.color || 'default'}>
              {BECBANG_STATUS_MAP[entityData.status as keyof typeof BECBANG_STATUS_MAP]?.label || entityData.status}
            </Tag>

            <Button
              type="dashed"
              onClick={() => navigate(`/history?entityId=${id}&type=CANG_BIE`)}
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
