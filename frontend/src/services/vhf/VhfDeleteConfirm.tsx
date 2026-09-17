import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deleteVhf, fetchVhfById } from './api';
import toast from '../../components/ToastNotification';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import type { VhfResponse } from './types';

const VhfDeleteConfirm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [device, setDevice] = useState<VhfResponse | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/vhf');
      return;
    }
    fetchVhfById(id)
      .then((res) => setDevice(res))
      .catch(() => navigate('/vhf'));
  }, [id, navigate]);

  if (!id) return null;

  return (
    <DeleteConfirmModal
      open={true}
      onCancel={() => navigate('/vhf')}
      onConfirm={async () => {
        if (submitting) return;
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
      itemType="hệ thống thông tin liên lạc VHF"
      itemName={device?.deviceName}
      itemCode={device?.deviceCode}
    />
  );
};

export default VhfDeleteConfirm;
