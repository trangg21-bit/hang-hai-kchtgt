import { useState } from 'react';
import { Button, Input, Typography, Alert } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { deleteCctv } from '../api';
import toast from '../../components/ToastNotification';
import {
  colors,
  fontSizeMd,
  textPrimary,
  textSecondary,
  borderDefault,
  radiusPill,
  spaceMd,
  spaceFormField,
} from '../../themetokenchk';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const CctvDeleteConfirm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [device] = useState<{ id: string; deviceCode: string; deviceName: string } | null>(null);
  const [confirmText, setConfirmText] = useState('');

  if (!id) {
    navigate('/cctv');
    return null;
  }

  return (
    <div style={{ padding: spaceMd, maxWidth: 600, margin: '0 auto' }}>
      <Title level={3} style={{ color: colors.sidebarBg }}>
        Xác nhận xóa hệ thống CCTV
      </Title>

      <Alert
        message="Hành động này không thể hoàn tác"
        type="warning"
        showIcon
        icon={<ExclamationCircleOutlined />}
        style={{ marginBottom: spaceFormField, borderRadius: radiusPill }}
      />

      <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
        Vui lòng nhập <strong>tên thiết bị</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
      </p>

      <div style={{ marginBottom: spaceFormField }}>
        <Text style={{ color: textSecondary, display: 'block', marginBottom: spaceMd }}>
          Hệ thống: <strong style={{ color: textPrimary }}>{device?.deviceName || 'Đang tải...'}</strong>
        </Text>
        <Input
          placeholder="Nhập tên thiết bị hoặc XÓA"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          onPressEnter={async () => {
            if (!device || submitting) return;
            if (confirmText !== 'XÓA' && confirmText !== device.deviceName) {
              toast.error('Vui lòng nhập đúng tên thiết bị hoặc "XÓA" để xác nhận');
              return;
            }
            setSubmitting(true);
            try {
              await deleteCctv(id);
              toast.success('Xóa hệ thống CCTV thành công');
              navigate('/cctv');
            } catch (error: any) {
              toast.error(error.response?.data?.message || 'Lỗi khi xóa');
            } finally {
              setSubmitting(false);
            }
          }}
          style={{ borderRadius: radiusPill, height: 40 }}
          autoFocus
        />
      </div>

      <div style={{ display: 'flex', gap: spaceMd }}>
        <Button
          onClick={() => navigate('/cctv')}
          style={{ borderRadius: radiusPill, height: 40, borderColor: borderDefault, color: textSecondary }}
        >
          Hủy
        </Button>
        <Button
          type="primary"
          danger
          onClick={async () => {
            if (!device || submitting) return;
            if (confirmText !== 'XÓA' && confirmText !== device.deviceName) {
              toast.error('Vui lòng nhập đúng tên thiết bị hoặc "XÓA" để xác nhận');
              return;
            }
            setSubmitting(true);
            try {
              await deleteCctv(id);
              toast.success('Xóa hệ thống CCTV thành công');
              navigate('/cctv');
            } catch (error: any) {
              toast.error(error.response?.data?.message || 'Lỗi khi xóa');
            } finally {
              setSubmitting(false);
            }
          }}
          loading={submitting}
          style={{ borderRadius: radiusPill, height: 40 }}
        >
          Xác nhận xóa
        </Button>
      </div>
    </div>
  );
};

export default CctvDeleteConfirm;
