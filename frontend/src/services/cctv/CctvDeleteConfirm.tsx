import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deleteCctv, fetchCctvById } from './api';
import toast from '../../components/ToastNotification';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import type { CctvResponse } from './types';

const CctvDeleteConfirm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [device, setDevice] = useState<CctvResponse | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/cctv');
      return;
    }
    fetchCctvById(id)
      .then((res) => setDevice(res))
      .catch(() => navigate('/cctv'));
  }, [id, navigate]);

  if (!id) return null;

  return (
    <DeleteConfirmModal
      open={true}
      onCancel={() => navigate('/cctv')}
      onConfirm={async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
          await deleteCctv(id);
          toast.success('Xóa hệ thống CCTV thành công');
          navigate('/cctv');
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(err?.response?.data?.message || 'Lỗi khi xóa');
        } finally {
          setSubmitting(false);
        }
      }}
      loading={submitting}
      itemType="hệ thống CCTV"
      itemName={device?.deviceName}
      itemCode={device?.deviceCode}
    />
  );
};

export default CctvDeleteConfirm;
