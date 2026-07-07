import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, message, Tag } from 'antd';
import { ArrowLeftOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { benCangCRUD, benCangApproval } from '../../services/cangbenService';
import type { CreateBenCangRequest, UpdateBenCangRequest } from '../../types/cangben';
import {
  BECBANG_STATUS_MAP,
  type CangBenStatus,
} from '../../types/cangben';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

export default function BenCangForm() {
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
          const data = await benCangCRUD.findById(id!);
          setEntityData({ status: data.trangThaiPheDuyet as CangBenStatus });
          form.setFieldsValue({
            maBen: data.maBen,
            tenBen: data.tenBen,
            cangBienId: data.cangBienId,
            tuyenDuongThuy: data.tuyenDuongThuy,
            viDo: data.viDo,
            kinhDo: data.kinhDo,
            chieuDai: data.chieuDai,
            chieuRong: data.chieuRong,
            loaiBen: data.loaiBen,
            doSauLuong: data.doSauLuong,
            trangThaiHoatDong: data.trangThaiHoatDong,
          });
        } catch {
          toast.error('Không thể tải thông tin bến cảng');
          navigate('/bencang');
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
        const payload: UpdateBenCangRequest & { id: string } = {
          ...values,
          id: id!,
        };
        await benCangCRUD.update(payload);
        toast.success('Đã cập nhật bến cảng');
      } else {
        const payload: CreateBenCangRequest = {
          maBen: values.maBen,
          tenBen: values.tenBen,
          cangBienId: values.cangBienId,
          tuyenDuongThuy: values.tuyenDuongThuy,
          viDo: values.viDo,
          kinhDo: values.kinhDo,
          chieuDai: values.chieuDai,
          chieuRong: values.chieuRong,
          loaiBen: values.loaiBen,
          doSauLuong: values.doSauLuong,
          trangThaiHoatDong: values.trangThaiHoatDong,
          trangThaiPheDuyet: 'DRAFT',
          orgUnitId: '',
        };
        await benCangCRUD.create(payload);
        toast.success('Đã tạo bến cảng');
      }

      navigate('/bencang');
    } catch {
      // validation errors or API errors (handled globally by Axios interceptor in api.ts)
    } finally {
      setSubmitting(false);
    }
  }, [isEdit, id, form, navigate]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    const confirmed = window.confirm('Bạn có chắc muốn xóa bến cảng này?');
    if (!confirmed) return;
    try {
      await benCangCRUD.delete(id);
      toast.success('Đã xóa bến cảng');
      navigate('/bencang');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleSubmitApproval = useCallback(async () => {
    if (!id) return;
    try {
      await benCangApproval.approve(id);
      toast.success('Đã gửi duyệt bến cảng');
      navigate('/bencang');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL1 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await benCangApproval.approve(id);
      toast.success('Đã phê duyệt cấp 1');
      navigate('/bencang');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL2 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await benCangApproval.approve(id);
      toast.success('Đã phê duyệt cấp 2');
      navigate('/bencang');
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
      await benCangApproval.reject(id, reason);
      toast.success('Đã từ chối');
      navigate('/bencang');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bencang')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa bến cảng' : 'Thêm bến cảng mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <FormField
              type="text"
              name="maBen"
              label="Mã bến"
              required
              placeholder="VD: BC-HAIPHONG-001"
              help="Mã định danh duy nhất cho bến cảng"
            />
          )}

          {isEdit && (
            <FormField
              type="text"
              name="maBen"
              label="Mã bến"
              disabled
            />
          )}

          <FormField
            type="text"
            name="tenBen"
            label="Tên bến cảng"
            required
            placeholder="VD: Bến cảng Hải Phòng"
          />

          <FormField
            type="text"
            name="cangBienId"
            label="ID Cảng biển"
            placeholder="Nhập ID cảng biển cha"
            help="ID của cảng biển chứa bến này"
          />

          <FormField
            type="text"
            name="tuyenDuongThuy"
            label="Tuyến đường thủy"
            placeholder="VD: Tuyến sông Bạch Đằng"
          />

           <Row style={{ display: 'flex', gap: 16 }}>
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
           </Row>

           <FormField
             type="number"
             name="chieuDai"
             label="Chiều dài (m)"
             required
             min={0}
             step={0.01}
             placeholder="VD: 200.0"
             help="Chiều dài bến tính bằng mét"
           />

           <FormField
             type="number"
             name="chieuRong"
             label="Chiều rộng (m)"
             required
             min={0}
             step={0.01}
             placeholder="VD: 30.0"
             help="Chiều rộng bến tính bằng mét"
           />

           <FormField
             type="select"
             name="loaiBen"
             label="Loại bến"
             required
             options={[
               { label: 'Bến nước', value: 'WATER' },
               { label: 'Bên bờ', value: 'SHORE' },
               { label: 'Đập chắn', value: 'BREAKWATER' },
             ]}
             disabled={isEdit && (entityData?.status === 'APPROVED_L2' || entityData?.status === 'PUBLISHED')}
           />

           <FormField
             type="number"
             name="doSauLuong"
             label="Độ sâu luồng (m)"
             required
             min={0}
             step={0.01}
             placeholder="VD: 12.5"
             help="Độ sâu luồng tính bằng mét"
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
                {isEdit ? 'Cập nhật' : 'Tạo bến cảng'}
              </Button>
              <Button onClick={() => navigate('/bencang')}>Hủy</Button>
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
              onClick={() => navigate(`/history?entityId=${id}&type=BEN_CANG`)}
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
