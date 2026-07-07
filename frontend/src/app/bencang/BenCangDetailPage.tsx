import { useState, useCallback, useEffect } from 'react';
import { Card, Button, Typography, Tag, Space, Divider } from 'antd';
import { UploadOutlined, DownloadOutlined, ArrowLeftOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined, CopyOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { benCangCRUD, benCangApproval } from '../../services/cangbenService';
import type { BenCang } from '../../types/cangben';
import { APPROVAL_STATUS_MAP, ACTIVITY_STATUS_MAP } from '../../types/cangben';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { DeleteConfirmation } from '../../components/ConfirmModal';
import toast from '../../components/ToastNotification';
import { giayToApi } from '../giayto/api';
import type { GiayTo } from '../giayto/types';

const { Title, Text } = Typography;

export default function BenCangDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<BenCang | null>(null);
  const [files, setFiles] = useState<GiayTo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await benCangCRUD.findById(id);
      setEntity(data);
      const fileRes = await giayToApi.listByEntity('ben-cang', id, { page: 1, size: 20 });
      setFiles(fileRes.data);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải thông tin bến cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleteLoading(true);
    try {
      await benCangCRUD.delete(id);
      toast.success('Đã xóa bến cảng');
      setShowDeleteModal(false);
      navigate('/bencang');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await benCangApproval.approve(id);
      toast.success('Đã phê duyệt bến cảng');
      const updated = await benCangCRUD.findById(id);
      setEntity(updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  };

  const handleReject = async () => {
    if (!id) return;
    const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
    if (reason === null || reason.length < 10) {
      if (reason === null) return;
      toast.warning('Lý do từ chối tối thiểu 10 ký tự');
      return;
    }
    try {
      await benCangApproval.reject(id, reason);
      toast.success('Đã từ chối bến cảng');
      const updated = await benCangCRUD.findById(id);
      setEntity(updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào clipboard');
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState message={error?.message || 'Không thể tải thông tin'} onRetry={() => navigate(-1)} />;
  if (!entity) return <ErrorState message="Không tìm thấy bến cảng" onRetry={() => navigate(-1)} />;

  const canEdit = true;
  const canDelete = entity.trangThaiPheDuyet === 'CHO_PHE_DUYET' || entity.trangThaiPheDuyet === 'TU_CHOI';
  const canApprove = entity.trangThaiPheDuyet === 'CHO_PHE_DUYET';
  const canReject = entity.trangThaiPheDuyet === 'CHO_PHE_DUYET';

  const getField = (label: string, value: string | number | undefined, extra?: string) => (
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ display: 'block', marginBottom: 2 }}>{label}</Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text strong>{value || '—'}</Text>
        {extra && <Text type="secondary">{extra}</Text>}
        {typeof value === 'string' && value.length > 0 && (
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(value)} />
        )}
      </div>
    </div>
  );

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bencang')}>Quay lại</Button>
          <Title level={5} style={{ margin: 0 }}>
            {entity.maBen} — {entity.tenBen}
          </Title>
        </Space>
      </Card>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 600px' }}>
          {/* Info Card */}
          <Card title="Thông tin chung" style={{ marginBottom: 16 }}>
            {getField('Mã bến', entity.maBen, '(duy nhất, không thay đổi được)')}
            {getField('Tên bến', entity.tenBen)}
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 2 }}>Cảng biển chủ</Text>
              <span
                style={{ color: '#1677ff', cursor: 'pointer' }}
                onClick={() => navigate(`/cangbien/${entity.cangBienId}`)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/cangbien/${entity.cangBienId}`); }}
              >
                {entity.cangBienId?.slice(0, 8)}…
              </span>
              <Text type="secondary"> ({entity.cangBienId})</Text>
            </div>
            {getField('Tuyến đường thủy', entity.tuyenDuongThuy)}
          </Card>

          {/* Geo Card */}
          <Card title="Thông tin địa lý" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 32 }}>
              {getField('Vĩ độ', entity.viDo, entity.viDo !== undefined ? '(WGS84: -90 ~ 90)' : '')}
              {getField('Kinh độ', entity.kinhDo, entity.kinhDo !== undefined ? '(WGS84: -180 ~ 180)' : '')}
            </div>
            {entity.viDo !== undefined && entity.kinhDo !== undefined ? (
              <Text type="secondary">📍 Bản đồ: {entity.viDo}, {entity.kinhDo}</Text>
            ) : (
              <Text type="secondary">Chưa có thông tin GPS</Text>
            )}
          </Card>

          {/* Stats Card */}
          <Card title="Thông số kỹ thuật" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 32 }}>
              {getField('Chiều dài', entity.chieuDai, 'm')}
              {getField('Chiều rộng', entity.chieuRong, 'm')}
            </div>
            {getField('Loại bến', entity.loaiBen)}
            {getField('Độ sâu luồng', entity.doSauLuong, 'm')}
          </Card>
        </div>

        <div style={{ flex: '1 1 300px' }}>
          {/* Status Card */}
          <Card title="Trạng thái" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">Trạng thái hoạt động</Text>
              <div style={{ marginTop: 4 }}>
                {entity.trangThaiHoatDong && (
                  <Tag color={ACTIVITY_STATUS_MAP[entity.trangThaiHoatDong as keyof typeof ACTIVITY_STATUS_MAP]?.color || 'default'}>
                    {ACTIVITY_STATUS_MAP[entity.trangThaiHoatDong as keyof typeof ACTIVITY_STATUS_MAP]?.label || entity.trangThaiHoatDong}
                  </Tag>
                )}
              </div>
            </div>
            <Divider />
            <div>
              <Text type="secondary">Trạng thái phê duyệt</Text>
              <div style={{ marginTop: 4 }}>
                <Tag color={APPROVAL_STATUS_MAP[entity.trangThaiPheDuyet as keyof typeof APPROVAL_STATUS_MAP]?.color || 'default'}>
                  {APPROVAL_STATUS_MAP[entity.trangThaiPheDuyet as keyof typeof APPROVAL_STATUS_MAP]?.label || entity.trangThaiPheDuyet}
                </Tag>
              </div>
            </div>
          </Card>

          {/* Documents Section */}
          <Card title="Tài liệu đính kèm" style={{ marginBottom: 16 }}>
            {files.length === 0 ? (
              <EmptyState description="Không có tài liệu đính kèm" />
            ) : (
              <div>
                {files.map((f) => (
                  <div key={f.id} style={{ marginBottom: 8 }}>
                    <Text>{f.fileName}</Text>
                    <br />
                    <Text type="secondary">{f.fileSize} bytes — {new Date(f.createdAt).toLocaleString('vi-VN')}</Text>
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => window.open(giayToApi.downloadUrl(f.minioKey), '_blank')}
                      style={{ marginLeft: 8 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Audit Card */}
          <Card title="Thông tin nhật ký" style={{ marginBottom: 16 }}>
            {getField('Người tạo', entity.createdBy)}
            {getField('Ngày tạo', entity.createdAt ? new Date(entity.createdAt).toLocaleString('vi-VN') : null)}
            {getField('Người cập nhật', entity.updatedBy)}
            {getField('Cập nhật lần cuối', entity.updatedAt ? new Date(entity.updatedAt).toLocaleString('vi-VN') : null)}
            {entity.orgUnitId && getField('Org Unit', entity.orgUnitId)}
          </Card>
        </div>
      </div>

      {/* Action Footer */}
      <Card style={{ marginTop: 16 }}>
        <Space wrap>
          <Button icon={<UploadOutlined />} onClick={() => navigate(`/giayto/upload/ben-cang/${entity.id}`)}>
            Upload Giấy tờ
          </Button>
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => navigate(`/bencang/${entity.id}/edit`)}>
              Chỉnh sửa
            </Button>
          )}
          {canDelete && (
            <Button danger icon={<DeleteOutlined />} onClick={() => setShowDeleteModal(true)}>
              Xóa
            </Button>
          )}
          {canApprove && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApprove}>
              Phê duyệt
            </Button>
          )}
          {canReject && (
            <Button danger icon={<CloseCircleOutlined />} onClick={handleReject}>
              Từ chối
            </Button>
          )}
          <Button icon={<HistoryOutlined />} onClick={() => navigate(`/bencang/${entity.id}/history`)}>
            Lịch sử
          </Button>
        </Space>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        open={showDeleteModal}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        confirmLoading={deleteLoading}
        itemName={entity.maBen}
      />
    </>
  );
}
