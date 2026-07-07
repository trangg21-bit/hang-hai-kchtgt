import { useState, useCallback, useEffect } from 'react';
import { Button, Space, Tag, Card, Typography, Row, Col, Descriptions, Modal, Input, Checkbox } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { vungNuocApi } from './api';
import { giayToApi } from '../giayto/api';
import type { VungNuoc } from './types';
import type { GiayTo } from '../giayto/types';
import {
  VUNGNUOC_HOAT_DONG_MAP,
  VUNGNUOC_PHE_DUYET_MAP,
} from './types';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import ConfirmModal from '../../components/ConfirmModal';
import toast from '../../components/ToastNotification';

export default function VungNuocDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VungNuoc | null>(null);
  const [files, setFiles] = useState<GiayTo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveMode, setApproveMode] = useState<'approve' | 'reject'>('approve');
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await vungNuocApi.findById(id);
      setData(res);
      const fileRes = await giayToApi.listByEntity('vung-nuoc', id, { page: 1, size: 20 });
      setFiles(fileRes.data);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải thông tin vùng nước'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await vungNuocApi.delete(id);
      toast.success('Đã xóa vùng nước thành công');
      navigate('/vungnuoc');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
    setDeleteOpen(false);
  }, [id, navigate]);

  const handleApproveAction = useCallback(async () => {
    if (!id) return;
    if (approveMode === 'reject' && rejectReason.length < 10) {
      toast.warning('Lý do từ chối tối thiểu 10 ký tự');
      return;
    }
    try {
      if (approveMode === 'approve') {
        await vungNuocApi.approve(id);
        toast.success('Đã phê duyệt vùng nước thành công');
      } else {
        await vungNuocApi.reject(id, rejectReason);
        toast.success('Đã từ chối vùng nước');
      }
      setApproveOpen(false);
      setRejectReason('');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
    }
  }, [id, approveMode, rejectReason, fetchData]);

  if (isLoading) return <LoadingSkeleton rows={6} type="card" />;
  if (isError || !data) {
    return (
      <ErrorState
        message={error?.message || 'Không tìm thấy vùng nước'}
        onRetry={fetchData}
        showHome
      />
    );
  }

  const hoatDongInfo = VUNGNUOC_HOAT_DONG_MAP[data.trangThaiHoatDong] || { color: 'default', label: data.trangThaiHoatDong };
  const pheDuyetInfo = VUNGNUOC_PHE_DUYET_MAP[data.trangThaiPheDuyet] || { color: 'default', label: data.trangThaiPheDuyet };

  return (
    <>
      {/* PageHeader */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/vungnuoc')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {data.maVungNuoc} — {data.tenVungNuoc}
          </Typography.Title>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Left column: Info + Stats */}
        <Col xs={24} lg={16}>
          {/* InfoCard */}
          <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Mã vùng nước">
                <Typography.Text strong copyable>{data.maVungNuoc}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tên vùng nước">{data.tenVungNuoc}</Descriptions.Item>
              <Descriptions.Item label="Cảng biển chủ">
                <Button type="link" size="small" onClick={() => navigate(`/cangbien/${data.cangBienId}`)}>
                  {data.cangBienId}
                </Button>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* StatsCard */}
          <Card title="Thông tin kỹ thuật" style={{ marginBottom: 16 }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Diện tích">
                {data.dienTich?.toFixed(2) || '—'} m²
              </Descriptions.Item>
              <Descriptions.Item label="Độ sâu tối đa">
                {data.doSauMax?.toFixed(2) || '—'} m
              </Descriptions.Item>
              <Descriptions.Item label="Độ sâu trung bình">
                {data.doSauTrungBinh?.toFixed(2) || '—'} m
              </Descriptions.Item>
              <Descriptions.Item label="Loại vùng nước">
                {data.loaiVungNuoc || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* DocumentsSection */}
          <Card title="Tài liệu đính kèm">
            {files.length === 0 ? (
              <EmptyState description="Không có tài liệu đính kèm" />
            ) : (
              <DataTable<GiayTo>
                columns={([
                  { title: 'Tên file', dataIndex: 'fileName', ellipsis: true },
                  {
                    title: 'Kích thước',
                    dataIndex: 'fileSize',
                    width: 120,
                    render: (v: number) => {
                      if (v >= 1048576) return `${(v / 1048576).toFixed(1)} MB`;
                      if (v >= 1024) return `${(v / 1024).toFixed(1)} KB`;
                      return `${v} bytes`;
                    },
                  },
                  { title: 'Loại', dataIndex: 'mimeType', width: 140 },
                  { title: 'Ngày upload', dataIndex: 'createdAt', width: 160, render: (v: string) => new Date(v).toLocaleString('vi-VN') },
                  {
                    title: 'Tải về',
                    key: 'download',
                    width: 80,
                    render: (_: unknown, record: GiayTo) => (
                      <Button
                        type="text"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => window.open(giayToApi.downloadUrl(record.minioKey), '_blank')}
                      />
                    ),
                  },
                ]) as any}
                dataSource={files}
                rowKey="id"
                pagination={{
                  current: 1,
                  pageSize: 20,
                  total: files.length,
                  showSizeChanger: false,
                }}
              />
            )}
          </Card>
        </Col>

        {/* Right column: Status + Audit */}
        <Col xs={24} lg={8}>
          {/* StatusCard */}
          <Card title="Trạng thái" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Typography.Text type="secondary">Hoạt động: </Typography.Text>
                <Tag color={hoatDongInfo.color}>{hoatDongInfo.label}</Tag>
              </div>
              <div>
                <Typography.Text type="secondary">Phê duyệt: </Typography.Text>
                <Tag color={pheDuyetInfo.color}>{pheDuyetInfo.label}</Tag>
              </div>
            </Space>
          </Card>

          {/* AuditCard */}
          <Card title="Thông tin hệ thống">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Người tạo">{data.createdBy}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{new Date(data.createdAt).toLocaleString('vi-VN')}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật bởi">{data.updatedBy}</Descriptions.Item>
              <Descriptions.Item label="Ngày cập nhật">{new Date(data.updatedAt).toLocaleString('vi-VN')}</Descriptions.Item>
              {data.orgUnitId && (
                <Descriptions.Item label="Đơn vị orgUnit">{data.orgUnitId}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* ActionFooter */}
      <Card style={{ marginTop: 16 }}>
        <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
          Thao tác
        </Typography.Text>
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/vungnuoc/${id}/edit`)}>
            Sửa
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteOpen(true)}>
            Xóa
          </Button>
          {data.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => { setApproveMode('approve'); setApproveOpen(true); }}
              >
                Phê duyệt
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => { setApproveMode('reject'); setRejectReason(''); setApproveOpen(true); }}
              >
                Từ chối
              </Button>
            </>
          )}
          <Button icon={<HistoryOutlined />} onClick={() => navigate(`/vungnuoc/${id}/history`)}>
            Lịch sử thay đổi
          </Button>
        </Space>
      </Card>

      {/* DeleteConfirmModal */}
      <ConfirmModal
        open={deleteOpen}
        title="Xác nhận xóa"
        content={`Bạn có chắc muốn xóa vùng nước "${data.tenVungNuoc}"? Dữ liệu sẽ được ẩn nhưng vẫn được lưu trữ.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        danger
        confirmText="Xóa"
      />

      {/* ApproveRejectModal */}
      <Modal
        open={approveOpen}
        title="Phê duyệt / Từ chối Vùng nước"
        onCancel={() => { setApproveOpen(false); setRejectReason(''); setApproveMode('approve'); }}
        onOk={handleApproveAction}
        okText="Xác nhận"
        cancelText="Hủy"
        centered
        width={600}
        okButtonProps={{
          disabled: approveMode === 'reject' && rejectReason.length < 10,
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Tabs: Phê duyệt / Từ chối */}
          <Space>
            <Button
              type={approveMode === 'approve' ? 'primary' : 'default'}
              onClick={() => setApproveMode('approve')}
            >
              ✅ Phê duyệt
            </Button>
            <Button
              type={approveMode === 'reject' ? 'primary' : 'default'}
              danger={approveMode === 'reject'}
              onClick={() => setApproveMode('reject')}
            >
              ❌ Từ chối
            </Button>
          </Space>

          {/* ApprovalSummaryCard */}
          <Card size="small" title="Thông tin vùng nước">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Mã">{data.maVungNuoc}</Descriptions.Item>
              <Descriptions.Item label="Tên">{data.tenVungNuoc}</Descriptions.Item>
              <Descriptions.Item label="Diện tích">{data.dienTich?.toFixed(2) || '—'} m²</Descriptions.Item>
              <Descriptions.Item label="Độ sâu tối đa">{data.doSauMax?.toFixed(2) || '—'} m</Descriptions.Item>
              <Descriptions.Item label="Độ sâu trung bình">{data.doSauTrungBinh?.toFixed(2) || '—'} m</Descriptions.Item>
              <Descriptions.Item label="Loại vùng nước">{data.loaiVungNuoc || '—'}</Descriptions.Item>
              <Descriptions.Item label="Người tạo">{data.createdBy}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{new Date(data.createdAt).toLocaleString('vi-VN')}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* ApprovalForm */}
          {approveMode === 'reject' && (
            <>
              <div>
                <Typography.Text strong>Lý do từ chối </Typography.Text>
                <Typography.Text type="secondary">(tối thiểu 10 ký tự)</Typography.Text>
              </div>
              <Input.TextArea
                rows={4}
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </>
          )}

          <Checkbox
            checked={true}
            disabled
          >
            Tôi xác nhận hành động này
          </Checkbox>
        </Space>
      </Modal>
    </>
  );
}
