import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deleteScada, fetchScadaById } from './api';
import toast from '../../components/ToastNotification';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import type { ScadaResponse } from './types';

const ScadaDeleteConfirm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [device, setDevice] = useState<ScadaResponse | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/scada');
      return;
    }
    fetchScadaById(id)
      .then((res) => setDevice(res))
      .catch(() => navigate('/scada'));
  }, [id, navigate]);

  if (!id) return null;

  return (
    <DeleteConfirmModal
      open={true}
      onCancel={() => navigate('/scada')}
      onConfirm={async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
          await deleteScada(id);
          toast.success('Xóa hệ thống SCADA thành công');
          navigate('/scada');
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(err?.response?.data?.message || 'Lỗi khi xóa hệ thống SCADA');
        } finally {
          setSubmitting(false);
        }
      }}
      loading={submitting}
      itemType="hệ thống SCADA"
      itemName={device?.deviceName}
      itemCode={device?.deviceCode}
    />
  );
};

export default ScadaDeleteConfirm;

