import { useState } from 'react';
import { Button, Input, Typography, Alert } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { deleteScada } from '../api';
import toast from '../../components/ToastNotification';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  colors,
  fontSizeMd,
  fontSizeLg,
  fontWeightBold,
  textPrimary,
  textSecondary,
  statusCritical,
  borderDefault,
  radiusPill,
  spaceMd,
  spaceFormField,
} from '../../tokens';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ScadaDeleteConfirm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [device, setDevice] = useState<{ id: string; deviceCode: string; deviceName: string } | null>(null);
  const [confirmText, setConfirmText] = useState('');

  if (!id) {
    navigate('/scada');
    return null;
  }

  return (
    <div style={{ padding: spaceMd, maxWidth: 600, margin: '0 auto' }}>
      <Title level={3} style={{ color: colors.sidebarBg }}>
        Xác nhận xóa hệ thống SCADA
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
              await deleteScada(id);
              toast.success('Xóa hệ thống SCADA thành công');
              navigate('/scada');
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
          onClick={() => navigate('/scada')}
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
              await deleteScada(id);
              toast.success('Xóa hệ thống SCADA thành công');
              navigate('/scada');
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

export default ScadaDeleteConfirm;
