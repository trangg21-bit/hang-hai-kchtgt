import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Collapse, Alert, Spin, Typography, Divider } from 'antd';
import {
  EditOutlined, CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined,
  ArrowLeftOutlined, DownloadOutlined, PrinterOutlined
} from '@ant-design/icons';
import { fetchCauCangById, approveCauCang, rejectCauCang } from '../app/pier/api';
import type { Pier } from '../app/pier/types';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';
import toast from '../components/ToastNotification';
import { textPrimary, textSecondary, textTertiary, surfaceCard, actionPrimary, spaceMd, spaceFormField, radiusPill, fontSizeMd, cardStyle, badgeBaseStyle, actionStyle, metaStyle } from '../tokens';
import { colors } from '../theme';

const { Text, Title } = Typography;

const STATUS_TAG_COLORS: Record<string, string> = {
  HIEN_HANH: 'green', TAM_NGUNG: 'orange',
  PENDING: 'gold', APPROVED: 'blue', REJECTED: 'red',
};
const STATUS_LABELS: Record<string, string> = {
  HIEN_HANH: 'Hiện hành', TAM_NGUNG: 'Tạm ngừng',
  PENDING: 'Chờ phê duyệt', APPROVED: 'Đã phê duyệt', REJECTED: 'Từ chối',
};

export default function PierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pier, setPier] = useState<Pier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try { const data = await fetchCauCangById(id); setPier(data); }
    catch (e) { setError(e instanceof Error ? e : new Error('Lỗi tải dữ liệu')); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, [id]);

  const handleApprove = async () => {
    if (!pier) return;
    try { await approveCauCang(pier.id); toast.success('Phê duyệt thành công'); loadData(); }
    catch (e: any) { toast.error(e?.message || 'Lỗi phê duyệt'); }
  };
  const handleReject = async () => {
    if (!pier) return;
    const reason = prompt('Nhập lý do từ chối (tối thiểu 10 ký tự):');
    if (!reason || reason.trim().length < 10) { if (reason !== null) toast.warning('Lý do tối thiểu 10 ký tự'); return; }
    try { await rejectCauCang(pier.id, reason); toast.success('Đã từ chối'); loadData(); }
    catch (e: any) { toast.error(e?.message || 'Lỗi từ chối'); }
  };

  if (loading) return <div style={{ padding: spaceMd }}><LoadingSkeleton /></div>;
  if (error || !pier) return <div style={{ padding: spaceMd }}><ErrorState message={error?.message || 'Không tìm thấy cầu cảng'} onRetry={loadData} /></div>;

  const isPending = pier.approvalStatus === 'PENDING';
  const isApproved = pier.approvalStatus === 'APPROVED';

  const alertMap: Record<string, { type: 'warning' | 'success' | 'error'; message: string }> = {
    PENDING: { type: 'warning', message: 'Cầu cảng chưa được phê duyệt, không khả dụng trong các module khác.' },
    APPROVED: { type: 'success', message: 'Cầu cảng đã được phê duyệt, đang khả dụng.' },
    REJECTED: { type: 'error', message: 'Cầu cảng đã bị từ chối, cần sửa và gửi duyệt lại.' },
  };
  const alert = alertMap[pier.approvalStatus];

  const collapseItems = [
    { key: 'basic', label: 'Thông tin cơ bản', children: (
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Mã cầu cảng"><Tag color="cyan">{pier.pierCode}</Tag></Descriptions.Item>
        <Descriptions.Item label="Tên cầu cảng">{pier.pierName}</Descriptions.Item>
        <Descriptions.Item label="Thuộc bến cảng">{pier.tenBenCang || pier.berthId?.slice(0,8) + '…'}</Descriptions.Item>
        <Descriptions.Item label="Chiều dài (m)">{pier.length != null ? pier.length : '—'}</Descriptions.Item>
        <Descriptions.Item label="Tải trọng (tấn)">{pier.taiTrong != null ? pier.taiTrong : '—'}</Descriptions.Item>
        <Descriptions.Item label="Loại cầu">{pier.loaiCau || '—'}</Descriptions.Item>
      </Descriptions>
    )},
    { key: 'status', label: 'Trạng thái', children: (
      <Space direction="vertical" size="small">
        <Space><Text type="secondary">Trạng thái hoạt động:</Text><Tag color={STATUS_TAG_COLORS[pier.operationalStatus]}>{STATUS_LABELS[pier.operationalStatus]}</Tag></Space>
        <Space><Text type="secondary">Trạng thái phê duyệt:</Text><Tag color={STATUS_TAG_COLORS[pier.approvalStatus]}>{STATUS_LABELS[pier.approvalStatus]}</Tag></Space>
      </Space>
    )},
    { key: 'gis', label: 'Thông tin GIS', children: (
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Loại hình học">{pier.loaiHinhHoc || '—'}</Descriptions.Item>
        <Descriptions.Item label="Tọa độ">{pier.toaDo || '—'}</Descriptions.Item>
        <Descriptions.Item label="Biểu tượng">{pier.bieuTuongId || '—'}</Descriptions.Item>
      </Descriptions>
    )},
    { key: 'meta', label: 'Metadata', children: (
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Ngày tạo">{pier.createdAt ? new Date(pier.createdAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
        <Descriptions.Item label="Ngày cập nhật">{pier.updatedAt ? new Date(pier.updatedAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
      </Descriptions>
    )},
  ];

  return (
    <div style={{ padding: spaceMd }}>
      {/* Breadcrumb header */}
      <div style={{ marginBottom: spaceMd }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ color: textSecondary, padding: 0 }}>Quay lại</Button>
        <Title level={4} style={{ margin: '8px 0 0', color: textPrimary }}>{pier.pierName}</Title>
        <Text style={{ color: textTertiary, fontSize: 13 }}>Mã: {pier.pierCode}</Text>
      </div>

      {/* Status alert */}
      {alert && <Alert type={alert.type} message={alert.message} showIcon style={{ marginBottom: spaceMd, borderRadius: 8 }} />}

      {/* Info cards */}
      <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
        <Collapse items={collapseItems} defaultActiveKey={['basic', 'status']} />
      </Card>

      {/* Action bar */}
      <Card style={{ ...cardStyle }}>
        <Space wrap>
          <Button icon={<EditOutlined />} style={{ borderRadius: radiusPill, color: actionPrimary, borderColor: actionPrimary }} onClick={() => navigate(`/piers/edit/${pier.id}`)}>Chỉnh sửa</Button>
          {isPending && <Button icon={<CheckCircleOutlined />} type="primary" style={{ borderRadius: radiusPill, background: '#52c41a', borderColor: '#52c41a' }} onClick={handleApprove}>Phê duyệt</Button>}
          {isPending && <Button icon={<CloseCircleOutlined />} danger style={{ borderRadius: radiusPill }} onClick={handleReject}>Từ chối</Button>}
          <Button icon={<HistoryOutlined />} style={{ borderRadius: radiusPill, color: textSecondary, borderColor: textSecondary }}>Lịch sử</Button>
        </Space>
      </Card>
    </div>
  );
}
