import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deleteTransmission, fetchTransmissionById } from './api';
import toast from '../../components/ToastNotification';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import type { TransmissionResponse } from './types';

const TransmissionDeleteConfirm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [device, setDevice] = useState<TransmissionResponse | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/transmission');
      return;
    }
    fetchTransmissionById(id)
      .then((res) => setDevice(res))
      .catch(() => navigate('/transmission'));
  }, [id, navigate]);

  if (!id) return null;

  return (
    <DeleteConfirmModal
      open={true}
      onCancel={() => navigate('/transmission')}
      onConfirm={async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
          await deleteTransmission(id);
          toast.success('Xóa hệ thống truyền dẫn thành công');
          navigate('/transmission');
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(err?.response?.data?.message || 'Lỗi khi xóa hệ thống truyền dẫn');
        } finally {
          setSubmitting(false);
        }
      }}
      loading={submitting}
      itemType="hệ thống truyền dẫn"
      itemName={device?.deviceName}
      itemCode={device?.deviceCode}
    />
  );
};

export default TransmissionDeleteConfirm;

