import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deleteVtsAssist, fetchVtsAssistById } from './api';
import toast from '../../components/ToastNotification';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import type { VtsAssistResponse } from './types';

const VtsAssistDeleteConfirm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [device, setDevice] = useState<VtsAssistResponse | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/vts-assist');
      return;
    }
    fetchVtsAssistById(id)
      .then((res) => setDevice(res))
      .catch(() => navigate('/vts-assist'));
  }, [id, navigate]);

  if (!id) return null;

  return (
    <DeleteConfirmModal
      open={true}
      onCancel={() => navigate('/vts-assist')}
      onConfirm={async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
          await deleteVtsAssist(id);
          toast.success('Xóa hệ thống phụ trợ VTS thành công');
          navigate('/vts-assist');
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(err?.response?.data?.message || 'Lỗi khi xóa hệ thống phụ trợ VTS');
        } finally {
          setSubmitting(false);
        }
      }}
      loading={submitting}
      itemType="hệ thống phụ trợ VTS"
      itemName={device?.deviceName}
      itemCode={device?.deviceCode}
    />
  );
};

export default VtsAssistDeleteConfirm;

