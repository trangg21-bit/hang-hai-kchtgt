import { useState } from 'react';
import { Button, Input, Typography } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { deleteVhf } from '../api';
import toast from '../../components/ToastNotification';
import {
  colors,
  fontSizeMd,
  textSecondary,
  borderDefault,
  radiusPill,
} from '../../themetokenchk';
import { ExclamationCircleOutlined } from '@ant-design/icons';

// Clone từ services/cctv/CctvDeleteConfirm.tsx — Quản lý hệ thống thông tin liên lạc VHF

const { Title, Text } = Typography;

const VhfDeleteConfirm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [device] = useState<{ id: string; deviceCode: string; deviceName: string } | null>(null);
  const [confirmText, setConfirmText] = useState('');

  if (!id) {
    navigate('/vhf');
    return null;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <ExclamationCircleOutlined style={{ color: colors.error, fontSize: 20 }} />
        <Title level={4} style={{ margin: 0 }}>Xác nhận xóa hệ thống thông tin liên lạc VHF</Title>
      </div>
      <Text style={{ color: textSecondary, fontSize: fontSizeMd }}>
        Hành động này không thể hoàn tác. Nhập tên thiết bị hoặc "XÓA" để xác nhận.
      </Text>
      <div style={{ marginTop: 16, maxWidth: 420 }}>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder='Nhập tên thiết bị hoặc "XÓA"'
          style={{ borderRadius: radiusPill, height: 40 }}
        />
      </div>
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Button
          onClick={() => navigate('/vhf')}
          style={{ borderRadius: radiusPill, height: 40, border: `1px solid ${borderDefault}`, color: textSecondary }}
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
              await deleteVhf(id);
              toast.success('Xóa hệ thống thông tin liên lạc VHF thành công');
              navigate('/vhf');
            } catch (error: unknown) {
              const err = error as { response?: { data?: { message?: string } } };
              toast.error(err.response?.data?.message || 'Lỗi khi xóa');
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

export default VhfDeleteConfirm;
