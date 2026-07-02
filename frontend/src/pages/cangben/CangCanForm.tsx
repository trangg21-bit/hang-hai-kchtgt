import { useState, useCallback, useEffect } from 'react';
import { Card, Form, Button, Space, Typography, Row, Col, message, Tag } from 'antd';
import { ArrowLeftOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { cangCanCRUD, cangCanApproval } from '../../services/cangbenService';
import type { CreateCangCanRequest, UpdateCangCanRequest } from '../../types/cangben';
import {
  BECBANG_STATUS_MAP,
  type CangBenStatus,
} from '../../types/cangben';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';

export default function CangCanForm() {
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
          const data = await cangCanCRUD.findById(id!);
          setEntityData({ status: data.trangThaiPheDuyet as CangBenStatus });
          form.setFieldsValue({
            maCangCan: data.maCangCan,
            tenCangCan: data.tenCangCan,
            tinhThanhPho: data.tinhThanhPho,
            viDo: data.viDo,
            kinhDo: data.kinhDo,
            dienTich: data.dienTich,
            congSuatTEU: data.congSuatTEU,
            trangThaiHoatDong: data.trangThaiHoatDong,
          });
        } catch {
          toast.error('Không thể tải thông tin cảng cạn');
          navigate('/cangcan');
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
        const payload: UpdateCangCanRequest & { id: string } = {
          ...values,
          id: id!,
        };
        await cangCanCRUD.update(payload);
        toast.success('Đã cập nhật cảng cạn');
      } else {
        const payload: CreateCangCanRequest = {
          maCangCan: values.maCangCan,
          tenCangCan: values.tenCangCan,
          tinhThanhPho: values.tinhThanhPho,
          viDo: values.viDo,
          kinhDo: values.kinhDo,
          dienTich: values.dienTich,
          congSuatTEU: values.congSuatTEU,
          trangThaiHoatDong: values.trangThaiHoatDong,
          trangThaiPheDuyet: 'DRAFT',
          orgUnitId: '',
        };
        await cangCanCRUD.create(payload);
        toast.success('Đã tạo cảng cạn');
      }

      navigate('/cangcan');
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
      await cangCanCRUD.delete(id);
      toast.success('Đã xóa cảng cạn');
      navigate('/cangcan');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleSubmitApproval = useCallback(async () => {
    if (!id) return;
    try {
      await cangCanApproval.approve(id);
      toast.success('Đã gửi duyệt cảng cạn');
      navigate('/cangcan');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL1 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await cangCanApproval.approve(id);
      toast.success('Đã phê duyệt cấp 1');
      navigate('/cangcan');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, navigate]);

  const handleApproveL2 = useCallback(async () => {
    if (!id) return;
    const approverId = localStorage.getItem('user_id') || '1';
    try {
      await cangCanApproval.approve(id);
      toast.success('Đã phê duyệt cấp 2');
      navigate('/cangcan');
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
      await cangCanApproval.reject(id, reason);
      toast.success('Đã từ chối');
      navigate('/cangcan');
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cangcan')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa cảng cạn' : 'Thêm cảng cạn mới'}
          </Typography.Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 700, margin: '0 auto', marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!isEdit && (
            <FormField
              type="text"
              name="maCangCan"
              label="Mã cảng cạn"
              required
              placeholder="VD: CC-HAIPHONG-001"
              help="Mã định danh duy nhất cho cảng cạn"
            />
          )}

          {isEdit && (
            <FormField
              type="text"
              name="maCangCan"
              label="Mã cảng cạn"
              disabled
            />
          )}

          <FormField
            type="text"
            name="tenCangCan"
            label="Tên cảng cạn"
            required
            placeholder="VD: Cảng cạn Nội Bài"
          />

          <FormField
            type="text"
            name="tinhThanhPho"
            label="Tỉnh / Thành phố"
            required
            placeholder="VD: Hà Nội"
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
                 placeholder="21.0"
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
                 placeholder="105.8"
                 help="WGS84: -180 ~ 180"
               />
             </Col>
           </Row>

           <FormField
             type="number"
             name="dienTich"
             label="Diện tích (m²)"
             required
             min={0}
             step={0.01}
             placeholder="VD: 50000.0"
             help="Diện tích cảng cạn tính bằng mét vuông"
           />

           <FormField
             type="number"
             name="congSuatTEU"
             label="Công suất (TEU)"
             required
             min={0}
             step={1}
             placeholder="VD: 100000"
             help="Công suất xử lý container tính bằng TEU"
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
                {isEdit ? 'Cập nhật' : 'Tạo cảng cạn'}
              </Button>
              <Button onClick={() => navigate('/cangcan')}>Hủy</Button>
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
              onClick={() => navigate(`/history?entityId=${id}&type=CANG_CAN`)}
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
