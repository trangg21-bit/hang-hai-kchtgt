import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Descriptions } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { approveCctv, rejectCctv, fetchCctvById } from '../api';
import type { CctvResponse } from '../types';
import toast from '../../components/ToastNotification';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  colors,
  fontSizeMd,
  fontSizeLg,
  fontWeightBold,
  textPrimary,
  textSecondary,
  actionPrimary,
  borderDefault,
  radiusPill,
  spaceMd,
} from '../../tokens';

const { Title, Text } = Typography;

const CctvApprovePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CctvResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchCctvById(id);
        setRecord(data);
      } catch (error) {
        toast.error('Không thể tải thông tin');
        navigate('/cctv');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleApprove = async () => {
    if (!id || !record) return;
    try {
      await approveForm.validateFields();
      setSubmitting(true);
      await approveCctv(id);
      toast.success('Phê duyệt hệ thống CCTV thành công');
      navigate('/cctv');
    } catch (error: any) {
      if (error.errorFields) return; // Form validation error
      toast.error(error.response?.data?.message || 'Lỗi khi phê duyệt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!id || !record) return;
    try {
      const { reason, confirmed } = await rejectForm.validateFields();
      setSubmitting(true);
      await rejectCctv(id, reason);
      toast.success('Từ chối hệ thống CCTV thành công');
      navigate('/cctv');
    } catch (error: any) {
      if (error.errorFields) return; // Form validation error
      toast.error(error.response?.data?.message || 'Lỗi khi từ chối');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!record) return <div>Không tìm thấy dữ liệu</div>;

  return (
    <div style={{ padding: spaceMd }}>
      <Title level={3} style={{ color: colors.sidebarBg }}>
        Phê duyệt hệ thống CCTV: {record.deviceCode}
      </Title>

      <Descriptions bordered column={1} style={{ marginBottom: spaceMd }}>
        <Descriptions.Item label="Mã thiết bị">{record.deviceCode}</Descriptions.Item>
        <Descriptions.Item label="Tên thiết bị">{record.deviceName}</Descriptions.Item>
        <Descriptions.Item label="Model">{record.model || '—'}</Descriptions.Item>
        <Descriptions.Item label="Hãng sản xuất">{record.manufacturer || '—'}</Descriptions.Item>
        <Descriptions.Item label="Số lượng">{record.quantity}</Descriptions.Item>
        <Descriptions.Item label="Đơn vị quản lý">{record.orgUnitName || '—'}</Descriptions.Item>
        <Descriptions.Item label="Địa điểm chi tiết">{record.detailedLocation || '—'}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái hiện tại">
          {record.approvalStatus === 'APPROVED' && 'Đã phê duyệt'}
          {record.approvalStatus === 'PENDING' && 'Chờ phê duyệt'}
          {record.approvalStatus === 'REJECTED' && 'Đã từ chối'}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ display: 'flex', gap: spaceMd }}>
        <div style={{ flex: 1 }}>
          <Title level={5}>Phê duyệt</Title>
          <Form form={approveForm} layout="vertical">
            <Form.Item
              name="confirmed"
              valuePropName="checked"
              rules={[{ required: true, message: 'Bạn cần xác nhận hành động này' }]}
            >
              <label style={{ cursor: 'pointer' }}>
                <input type="checkbox" /> Tôi xác nhận phê duyệt hệ thống CCTV này
              </label>
            </Form.Item>
            <Button
              type="primary"
              htmlType="button"
              onClick={handleApprove}
              loading={submitting}
              style={{ borderRadius: radiusPill }}
            >
              Phê duyệt
            </Button>
          </Form>
        </div>

        <div style={{ flex: 1 }}>
          <Title level={5}>Từ chối</Title>
          <Form form={rejectForm} layout="vertical">
            <Form.Item
              name="reason"
              label="Lý do từ chối"
              rules={[
                { required: true, message: 'Vui lòng nhập lý do từ chối' },
                { min: 10, message: 'Lý do từ chối tối thiểu 10 ký tự' },
              ]}
            >
              <Input.TextArea rows={4} placeholder="Nhập lý do từ chối..." />
            </Form.Item>
            <Form.Item
              name="confirmed"
              valuePropName="checked"
              rules={[{ required: true, message: 'Bạn cần xác nhận hành động này' }]}
            >
              <label style={{ cursor: 'pointer' }}>
                <input type="checkbox" /> Tôi xác nhận từ chối hệ thống CCTV này
              </label>
            </Form.Item>
            <Button
              danger
              htmlType="button"
              onClick={handleReject}
              loading={submitting}
              style={{ borderRadius: radiusPill }}
            >
              Từ chối
            </Button>
          </Form>
        </div>
      </div>

      <div style={{ marginTop: spaceMd }}>
        <Button onClick={() => navigate('/cctv')} style={{ borderRadius: radiusPill }}>
          Quay lại
        </Button>
      </div>
    </div>
  );
};

export default CctvApprovePage;
