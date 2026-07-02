import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, message, Tag } from 'antd';
import { ArrowLeftOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { cauCangCRUD, cauCangApproval } from '../../services/cangbenService';
import type { CreateCauCangRequest, UpdateCauCangRequest } from '../../types/cangben';
import {
  BECBANG_STATUS_MAP,
  type CangBenStatus,
} from '../../types/cangben';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

export default function CauCangForm() {
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
          const data = await cauCangCRUD.findById(id!);
          setEntityData({ status: data.trangThaiPheDuyet as CangBenStatus });
          form.setFieldsValue({
            maCau: data.maCau,
            tenCau: data.tenCau,
            benCangId: data.benCangId,
            chieuDai: data.chieuDai,
            taiTrong: data.taiTrong,
            loaiCau: data.loaiCau,
            trangThaiHoatDong: data.trangThaiHoatDong,
          });
        } catch {
          toast.error('Không thể tải thông tin cầu cảng');
          navigate('/caucang');
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
        await cauCangCRUD.update(payload);
        toast.success('Đã cập nhật cầu cảng');
      } else {
        const payload: CreateCauCangRequest = {
          maCau: values.maCau,
          tenCau: values.tenCau,
          benCangId: values.benCangId,
          chieuDai: values.chieuDai,
          taiTrong: values.taiTrong,
          loaiCau: values.loaiCau,
          trangThaiHoatDong: values.trangThaiHoatDong,
          trangThaiPheDuyet: 'DRAFT',
          orgUnitId: '',
        };
        await cauCangCRUD.create(payload);
        toast.success('Đã tạo cầu cảng');
      }

      navigate('/caucang');
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
      await cauCangCRUD.delete(id);
      toast.success('Đã xóa cầu cảng');
      navigate('/caucang');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleSubmitApproval = useCallback(async () => {
    if (!id) return;
    try {
      await cauCangApproval.approve(id);
      toast.success('Đã gửi duyệt cầu cảng');
      navigate('/caucang');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL1 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await cauCangApproval.approve(id);
      toast.success('Đã phê duyệt cấp 1');
      navigate('/caucang');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL2 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await cauCangApproval.approve(id);
      toast.success('Đã phê duyệt cấp 2');
      navigate('/caucang');
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
      await cauCangApproval.reject(id, reason);
      toast.success('Đã từ chối');
      navigate('/caucang');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/caucang')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa cầu cảng' : 'Thêm cầu cảng mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <FormField
              type="text"
              name="maCau"
              label="Mã cầu"
              required
              placeholder="VD: CC-HAIPHONG-001"
              help="Mã định danh duy nhất cho cầu cảng"
            />
          )}

          {isEdit && (
            <FormField
              type="text"
              name="maCau"
              label="Mã cầu"
              disabled
            />
          )}

          <FormField
            type="text"
            name="tenCau"
            label="Tên cầu cảng"
            required
            placeholder="VD: Cầu cảng số 1"
          />

          <FormField
            type="text"
            name="benCangId"
            label="ID Bến cảng"
            placeholder="Nhập ID bến cảng cha"
            help="ID của bến cảng chứa cầu này"
          />

           <FormField
             type="number"
             name="chieuDai"
             label="Chiều dài (m)"
             required
             min={0}
             step={0.01}
             placeholder="VD: 100.0"
             help="Chiều dài cầu cảng tính bằng mét"
           />

           <FormField
             type="number"
             name="taiTrong"
             label="Tải trọng (tấn)"
             required
             min={0}
             step={0.01}
             placeholder="VD: 500.0"
             help="Tải trọng tối đa tính bằng tấn"
           />

           <FormField
             type="select"
             name="loaiCau"
             label="Loại cầu"
             required
             options={[
               { label: 'Cầu tàu thẳng', value: 'STRAIGHT' },
               { label: 'Cầu tàu góc', value: 'ANGLED' },
               { label: 'Cầu tàu dạng chữ T', value: 'T_SHAPED' },
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
                {isEdit ? 'Cập nhật' : 'Tạo cầu cảng'}
              </Button>
              <Button onClick={() => navigate('/caucang')}>Hủy</Button>
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
              onClick={() => navigate(`/history?entityId=${id}&type=CAU_CANG`)}
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
