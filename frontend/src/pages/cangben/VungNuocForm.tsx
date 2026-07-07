import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, message, Tag } from 'antd';
import { ArrowLeftOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { vungNuocCRUD, vungNuocApproval } from '../../services/cangbenService';
import type { CreateVungNuocRequest, UpdateVungNuocRequest } from '../../types/cangben';
import {
  BECBANG_STATUS_MAP,
  type CangBenStatus,
} from '../../types/cangben';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

export default function VungNuocForm() {
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
          const data = await vungNuocCRUD.findById(id!);
          setEntityData({ status: data.trangThaiPheDuyet as CangBenStatus });
          form.setFieldsValue({
            maVungNuoc: data.maVungNuoc,
            tenVungNuoc: data.tenVungNuoc,
            cangBienId: data.cangBienId,
            dienTich: data.dienTich,
            doSauMax: data.doSauMax,
            doSauTrungBinh: data.doSauTrungBinh,
            loaiVungNuoc: data.loaiVungNuoc,
            trangThaiHoatDong: data.trangThaiHoatDong,
          });
        } catch {
          toast.error('Không thể tải thông tin vùng nước');
          navigate('/vungnuoc');
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
        await vungNuocCRUD.update(payload);
        toast.success('Đã cập nhật vùng nước');
      } else {
        const payload: CreateVungNuocRequest = {
          maVungNuoc: values.maVungNuoc,
          tenVungNuoc: values.tenVungNuoc,
          cangBienId: values.cangBienId,
          dienTich: values.dienTich,
          doSauMax: values.doSauMax,
          doSauTrungBinh: values.doSauTrungBinh,
          loaiVungNuoc: values.loaiVungNuoc,
          trangThaiHoatDong: values.trangThaiHoatDong,
          trangThaiPheDuyet: 'DRAFT',
          orgUnitId: '',
        };
        await vungNuocCRUD.create(payload);
        toast.success('Đã tạo vùng nước');
      }

      navigate('/vungnuoc');
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
      await vungNuocCRUD.delete(id);
      toast.success('Đã xóa vùng nước');
      navigate('/vungnuoc');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleSubmitApproval = useCallback(async () => {
    if (!id) return;
    try {
      await vungNuocApproval.approve(id);
      toast.success('Đã gửi duyệt vùng nước');
      navigate('/vungnuoc');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL1 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await vungNuocApproval.approve(id);
      toast.success('Đã phê duyệt cấp 1');
      navigate('/vungnuoc');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL2 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await vungNuocApproval.approve(id);
      toast.success('Đã phê duyệt cấp 2');
      navigate('/vungnuoc');
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
      await vungNuocApproval.reject(id, reason);
      toast.success('Đã từ chối');
      navigate('/vungnuoc');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/vungnuoc')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa vùng nước' : 'Thêm vùng nước mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <FormField
              type="text"
              name="maVungNuoc"
              label="Mã vùng nước"
              required
              placeholder="VD: VN-HAIPHONG-001"
              help="Mã định danh duy nhất cho vùng nước"
            />
          )}

          {isEdit && (
            <FormField
              type="text"
              name="maVungNuoc"
              label="Mã vùng nước"
              disabled
            />
          )}

          <FormField
            type="text"
            name="tenVungNuoc"
            label="Tên vùng nước"
            required
            placeholder="VD: Vùng nước cảng Hải Phòng"
          />

          <FormField
            type="text"
            name="cangBienId"
            label="ID Cảng biển"
            placeholder="Nhập ID cảng biển cha"
            help="ID của cảng biển chứa vùng nước này"
          />

           <FormField
             type="number"
             name="dienTich"
             label="Diện tích (m²)"
             required
             min={0}
             step={0.01}
             placeholder="VD: 100000.0"
             help="Diện tích vùng nước tính bằng mét vuông"
           />

           <FormField
             type="number"
             name="doSauMax"
             label="Độ sâu tối đa (m)"
             required
             min={0}
             step={0.01}
             placeholder="VD: 15.0"
             help="Độ sâu tối đa của vùng nước"
           />

           <FormField
             type="number"
             name="doSauTrungBinh"
             label="Độ sâu trung bình (m)"
             required
             min={0}
             step={0.01}
             placeholder="VD: 10.0"
             help="Độ sâu trung bình của vùng nước"
           />

           <FormField
             type="select"
             name="loaiVungNuoc"
             label="Loại vùng nước"
             required
             options={[
               { label: 'Vùng nước cảng', value: 'PORT' },
               { label: 'Vùng nước cảng cạn', value: 'INLAND_PORT' },
               { label: 'Vùng nước cảng biển', value: 'SEA_PORT' },
             ]}
             disabled={isEdit && (entityData?.status === 'APPROVED_L2' || entityData?.status === 'PUBLISHED')}
           />

           <FormField
             type="select"
             name="trangThaiHoatDong"
             label="Trạng thái hoạt động"
             required
             options={[
               { label: 'Hoạt động', value: 'ACTIVE' },
               { label: 'Ngừng hoạt động', value: 'INACTIVE' },
               { label: 'Bảo trì', value: 'MAINTENANCE' },
             ]}
           />

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEdit ? 'Cập nhật' : 'Tạo vùng nước'}
              </Button>
              <Button onClick={() => navigate('/vungnuoc')}>Hủy</Button>
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
            <Tag color={BECBANG_STATUS_MAP[entityData.status]?.color || 'default'}>
              {BECBANG_STATUS_MAP[entityData.status]?.label || entityData.status}
            </Tag>

            <Button
              type="dashed"
              onClick={() => navigate(`/history?entityId=${id}&type=VUNG_NUOC`)}
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
