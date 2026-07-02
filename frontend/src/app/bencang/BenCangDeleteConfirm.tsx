import { useState, useCallback, useEffect } from 'react';
import { Card, Button, Space, Typography, Divider } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { benCangCRUD } from '../../services/cangbenService';
import type { BenCang } from '../../types/cangben';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import { DeleteConfirmation } from '../../components/ConfirmModal';
import toast from '../../components/ToastNotification';

const { Title, Text } = Typography;

export default function BenCangDeleteConfirmPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<BenCang | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    (async () => {
      try {
        const data = await benCangCRUD.findById(id);
        setEntity(data);
      } catch (err: unknown) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Không thể tải thông tin bến cảng'));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await benCangCRUD.delete(id);
      toast.success('Xóa bến cảng thành công');
      setShowModal(false);
      navigate('/bencang');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  }, [id, navigate]);

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (isError) return <ErrorState message={error?.message || 'Không thể tải thông tin'} onRetry={() => navigate(-1)} />;
  if (!entity) return <ErrorState message="Không tìm thấy bến cảng" onRetry={() => navigate(-1)} />;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/bencang/${id}`)}>Quay lại</Button>
          <Title level={5} style={{ margin: 0 }}>Xác nhận xóa bến cảng</Title>
        </Space>
      </Card>

      <Card style={{ maxWidth: 600, margin: '0 auto', marginBottom: 16 }}>
        <Title level={5}>Thông tin bến cảng</Title>
        <Divider />

        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">Mã bến:</Text> <Text strong>{entity.maBen}</Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">Tên bến:</Text> <Text strong>{entity.tenBen}</Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">Cảng biển chủ:</Text> <Text>{entity.cangBienId}</Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">Tuyến đường thủy:</Text> <Text>{entity.tuyenDuongThuy || '—'}</Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">Người tạo:</Text> <Text>{entity.createdBy || '—'}</Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">Ngày tạo:</Text>{' '}
          <Text>{entity.createdAt ? new Date(entity.createdAt).toLocaleString('vi-VN') : '—'}</Text>
        </div>

        <Divider />

        <Card style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
          <Text type="warning">⚠️ Dữ liệu sẽ được ẩn (soft-delete) nhưng vẫn được lưu trữ.</Text>
        </Card>
      </Card>

      <Card style={{ maxWidth: 600, margin: '0 auto' }}>
        <Space>
          <Button onClick={() => navigate(`/bencang/${id}`)}>Hủy</Button>
          <Button type="primary" danger icon={<DeleteOutlined />} onClick={() => setShowModal(true)}>
            Xác nhận xóa
          </Button>
        </Space>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        open={showModal}
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
        confirmLoading={deleting}
        itemName={entity.maBen}
      />
    </>
  );
}
