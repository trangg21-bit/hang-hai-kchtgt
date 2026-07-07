import { useState, useCallback, useEffect } from 'react';
import { Card, Typography, Row, Col, Space, Button, Tag, Divider, Popconfirm } from 'antd';
import { UploadOutlined, DownloadOutlined, ArrowLeftOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { fetchCauCangById, deleteCauCang, rejectCauCang } from './api';
import type { CauCang } from './types';
import { giayToApi } from '../giayto/api';
import type { GiayTo } from '../giayto/types';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  'HIEN_HANH': { color: 'green', label: 'Hiện hành' },
  'TAM_NGUNG': { color: 'gold', label: 'Tạm ngừng' },
};

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  'CHO_PHE_DUYET': { color: 'gold', label: 'Chờ phê duyệt' },
  'DUOC_PHE_DUYET': { color: 'green', label: 'Được phê duyệt' },
  'TU_CHOI': { color: 'red', label: 'Từ chối' },
};

export default function CauCangDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<CauCang | null>(null);
  const [files, setFiles] = useState<GiayTo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    (async () => {
      try {
        const data = await fetchCauCangById(id);
        setEntity(data);
        const fileRes = await giayToApi.listByEntity('cau-cang', id, { page: 1, size: 20 });
        setFiles(fileRes.data);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteCauCang(id);
      toast.success('Đã xóa cầu cảng');
      navigate('/caucang');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleReject = useCallback(async () => {
    if (!id) return;
    const reason = window.prompt('Lý do từ chối:', '');
    if (reason === null || reason.trim().length < 10) {
      if (reason === null) return;
      toast.warning('Lý do từ chối tối thiểu 10 ký tự');
      return;
    }
    try {
      await rejectCauCang(id, reason);
      toast.success('Đã từ chối cầu cảng');
      navigate('/caucang');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [id, navigate]);

  if (isLoading) return <LoadingSkeleton rows={10} />;
  if (isError) return <ErrorState message="Không tìm thấy cầu cảng" onRetry={() => navigate('/caucang')} />;
  if (!entity) return null;

  const { maCau, tenCau, benCangId, chieuDai, taiTrong, loaiCau, trangThaiHoatDong, trangThaiPheDuyet, createdBy, updatedBy, createdAt, updatedAt } = entity;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/caucang')}>Quay lại</Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {maCau} — {tenCau}
          </Typography.Title>
          <Tag color={STATUS_MAP[trangThaiHoatDong]?.color}>{STATUS_MAP[trangThaiHoatDong]?.label}</Tag>
          <Tag color={APPROVAL_MAP[trangThaiPheDuyet]?.color}>{APPROVAL_MAP[trangThaiPheDuyet]?.label}</Tag>
        </Space>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Left column — Info + Stats */}
        <Col xs={24} md={16}>
          <Card title="Thông tin chung" size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Typography.Text type="secondary">Mã cầu:</Typography.Text>
                <br />
                <Typography.Text strong style={{ fontSize: 18 }}>{maCau}</Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text type="secondary">Tên cầu:</Typography.Text>
                <br />
                <Typography.Text strong>{tenCau}</Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text type="secondary">Bến cảng chủ:</Typography.Text>
                <br />
                <span style={{ color: '#1677ff', cursor: 'pointer' }} onClick={() => navigate(`/bencang/${benCangId}`)}>
                  {benCangId}
                </span>
              </Col>
            </Row>
          </Card>

          <Card title="Thông số" size="small" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Typography.Text type="secondary">Chiều dài:</Typography.Text>
                <br />
                <Typography.Text strong>{chieuDai !== null ? `${chieuDai.toFixed(2)} m` : '—'}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">Tải trọng:</Typography.Text>
                <br />
                <Typography.Text strong>{taiTrong !== null ? `${taiTrong.toFixed(2)} tấn` : '—'}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">Loại cầu:</Typography.Text>
                <br />
                <Typography.Text>{loaiCau || '—'}</Typography.Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right column — Status */}
        <Col xs={24} md={8}>
          <Card title="Trạng thái" size="small">
            <div style={{ marginBottom: 16 }}>
              <Typography.Text type="secondary">Trạng thái hoạt động:</Typography.Text>
              <br />
              <Tag color={STATUS_MAP[trangThaiHoatDong]?.color} style={{ marginTop: 4 }}>
                {STATUS_MAP[trangThaiHoatDong]?.label}
              </Tag>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <Typography.Text type="secondary">Trạng thái phê duyệt:</Typography.Text>
              <br />
              <Tag color={APPROVAL_MAP[trangThaiPheDuyet]?.color} style={{ marginTop: 4 }}>
                {APPROVAL_MAP[trangThaiPheDuyet]?.label}
              </Tag>
            </div>
          </Card>
        </Col>

        {/* Bottom — Audit */}
        <Col xs={24}>
          <Card title="Thông tin hệ thống" size="small">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Typography.Text type="secondary">Người tạo:</Typography.Text>
                <br />
                <Typography.Text>{createdBy || '—'}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">Ngày tạo:</Typography.Text>
                <br />
                <Typography.Text>{createdAt ? new Date(createdAt).toLocaleString('vi-VN') : '—'}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">Cập nhật bởi:</Typography.Text>
                <br />
                <Typography.Text>{updatedBy || '—'}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">Ngày cập nhật:</Typography.Text>
                <br />
                <Typography.Text>{updatedAt ? new Date(updatedAt).toLocaleString('vi-VN') : '—'}</Typography.Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Documents Section */}
        <Col xs={24}>
          <Card title="Tài liệu đính kèm" size="small">
            {files.length === 0 ? (
              <EmptyState description="Không có tài liệu đính kèm" />
            ) : (
              <div>
                {files.map((f) => (
                  <div key={f.id} style={{ marginBottom: 8 }}>
                    <Typography.Text>{f.fileName}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">{f.fileSize} bytes — {new Date(f.createdAt).toLocaleString('vi-VN')}</Typography.Text>
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
        </Col>
      </Row>

      {/* Action Footer */}
      <Card style={{ marginTop: 16 }}>
        <Space wrap>
          <Button icon={<UploadOutlined />} onClick={() => navigate(`/giayto/upload/cau-cang/${id}`)}>
            Upload Giấy tờ
          </Button>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/caucang/${id}/edit`)}>Sửa</Button>
          <Popconfirm
            title="Xác nhận xóa"
            description={`Bạn có chắc chắn muốn xóa cầu cảng "${maCau}"? Dữ liệu sẽ được ẩn nhưng vẫn được lưu trữ.`}
            okText="Xóa"
            okType="danger"
            cancelText="Hủy"
            onConfirm={handleDelete}
          >
            <Button danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
          {trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
            <>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => navigate(`/caucang/${id}/approve`)}>
                Phê duyệt
              </Button>
              <Button danger icon={<ArrowLeftOutlined />} onClick={handleReject}>Từ chối</Button>
            </>
          )}
          <Button onClick={() => navigate(`/caucang/${id}/history`)}>Lịch sử</Button>
        </Space>
      </Card>
    </>
  );
}
