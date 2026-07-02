import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Row,
  Col,
  Divider,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { CangCan } from './types';
import {
  TRANG_THAI_HOAT_DONG_MAP,
  TRANG_THAI_PHE_DUYET_MAP,
} from './types';
import toast from '../../components/ToastNotification';
import { fetchCangCanById, deleteCangCan, approveCangCan, rejectCangCan } from './api';
import { giayToApi } from '../giayto/api';
import type { GiayTo } from '../giayto/types';
import EmptyState from '../../components/EmptyState';

export default function CangCanDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CangCan | null>(null);
  const [files, setFiles] = useState<GiayTo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchCangCanById(id);
      setData(res);
      const fileRes = await giayToApi.listByEntity('cang-can', id, { page: 1, size: 20 });
      setFiles(fileRes.data);
    } catch (err: unknown) {
      setIsError(true);
      toast.error(err instanceof Error ? err.message : 'Không thể tải thông tin cảng cạn');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteCangCan(id);
      toast.success('Đã xóa cảng cạn');
      navigate('/cangcan');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [id, navigate]);

  const handleApprove = useCallback(async () => {
    if (!id) return;
    try {
      await approveCangCan(id);
      toast.success('Phê duyệt cảng cạn thành công');
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    }
  }, [id, loadData]);

  const handleReject = useCallback(async () => {
    if (!id) return;
    const reason = window.prompt('Lý do từ chối:', '');
    if (reason === null || reason.length < 10) {
      toast.warning('Lý do từ chối tối thiểu 10 ký tự.');
      return;
    }
    try {
      await rejectCangCan(id, reason);
      toast.success('Đã từ chối');
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [id, loadData]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Đã sao chép mã cảng cạn');
  }, []);

  const isLoadingGps = data?.viDo != null && data?.kinhDo != null;

  if (isLoading) {
    return <Typography.Text>Đang tải...</Typography.Text>;
  }

  if (isError || !data) {
    return (
      <Card>
        <Typography.Text>Không tìm thấy cảng cạn.</Typography.Text>
        <Button type="link" onClick={() => navigate('/cangcan')}>Quay lại danh sách</Button>
      </Card>
    );
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cangcan')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {data.maCangCan} — {data.tenCangCan}
          </Typography.Title>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Left column — 2/3 */}
        <Col xs={24} md={16}>
          {/* Info Card */}
          <Card title="Thông tin chung" size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Typography.Text strong>Mã cảng cạn</Typography.Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Typography.Text strong style={{ fontSize: 18 }}>{data.maCangCan}</Typography.Text>
                  <Tooltip title="Sao chép">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(data.maCangCan)}
                    />
                  </Tooltip>
                </div>
              </Col>
              <Col span={12}>
                <Typography.Text strong>Tên cảng cạn</Typography.Text>
                <Typography.Text style={{ display: 'block', marginTop: 4 }}>{data.tenCangCan}</Typography.Text>
              </Col>
              <Col span={24}>
                <Typography.Text strong>Tỉnh/thành phố</Typography.Text>
                <Typography.Text style={{ display: 'block', marginTop: 4 }}>{data.tinhThanhPho || '—'}</Typography.Text>
              </Col>
            </Row>
          </Card>

          {/* Geo Card */}
          <Card title="Thông tin GPS" size="small" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Typography.Text strong>
                  <EnvironmentOutlined /> Vĩ độ
                </Typography.Text>
                <Typography.Text style={{ display: 'block', marginTop: 4 }}>
                  {data.viDo != null ? data.viDo.toFixed(6) : '—'}
                </Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text strong>
                  <EnvironmentOutlined /> Kinh độ
                </Typography.Text>
                <Typography.Text style={{ display: 'block', marginTop: 4 }}>
                  {data.kinhDo != null ? data.kinhDo.toFixed(6) : '—'}
                </Typography.Text>
              </Col>
            </Row>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              {isLoadingGps ? 'Thông tin GPS đã được cung cấp đầy đủ' : 'Chưa có thông tin GPS'}
            </Typography.Text>
            {isLoadingGps && (
              <Card style={{ marginTop: 8, background: '#f5f5f5' }} size="small">
                <Typography.Text type="secondary">
                  [Bản đồ] Vị trí: {data.viDo.toFixed(6)}, {data.kinhDo.toFixed(6)}
                </Typography.Text>
              </Card>
            )}
          </Card>

          {/* Stats Card */}
          <Card title="Thống kê" size="small" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Typography.Text strong>Diện tích</Typography.Text>
                <Typography.Text style={{ display: 'block', marginTop: 4 }}>
                  {data.dienTich?.toFixed(2) || '—'} m²
                </Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text strong>Công suất TEU</Typography.Text>
                <Typography.Text style={{ display: 'block', marginTop: 4 }}>
                  {data.congSuatTEU != null ? data.congSuatTEU.toFixed(2) : '—'} TEU
                </Typography.Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right column — 1/3 */}
        <Col xs={24} md={8}>
          {/* Status Card */}
          <Card title="Trạng thái" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Typography.Text strong>Trạng thái hoạt động</Typography.Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color={TRANG_THAI_HOAT_DONG_MAP[data.trangThaiHoatDong]?.color}>
                    {TRANG_THAI_HOAT_DONG_MAP[data.trangThaiHoatDong]?.label || data.trangThaiHoatDong}
                  </Tag>
                </div>
              </div>
              <Divider style={{ margin: 0 }} />
              <div>
                <Typography.Text strong>Trạng thái phê duyệt</Typography.Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color={TRANG_THAI_PHE_DUYET_MAP[data.trangThaiPheDuyet]?.color}>
                    {TRANG_THAI_PHE_DUYET_MAP[data.trangThaiPheDuyet]?.label || data.trangThaiPheDuyet}
                  </Tag>
                </div>
              </div>
            </Space>
          </Card>

          {/* Audit Card */}
          <Card title="Thông tin kiểm soát" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <Typography.Text type="secondary">Người tạo</Typography.Text>
                <Typography.Text>{data.createdBy || '—'}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Ngày tạo</Typography.Text>
                <Typography.Text>{data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : '—'}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Người cập nhật</Typography.Text>
                <Typography.Text>{data.updatedBy || '—'}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Ngày cập nhật</Typography.Text>
                <Typography.Text>{data.updatedAt ? new Date(data.updatedAt).toLocaleString('vi-VN') : '—'}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Đơn vị</Typography.Text>
                <Typography.Text>{data.orgUnitId || '—'}</Typography.Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Documents Section */}
      <Card style={{ marginTop: 16 }}>
        <Typography.Text strong>Tài liệu đính kèm</Typography.Text>
        <div style={{ marginTop: 12 }}>
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
        </div>
      </Card>

      {/* Action Footer */}
      <Card style={{ marginTop: 16 }}>
        <Typography.Text strong>Thao tác</Typography.Text>
        <div style={{ marginTop: 12 }}>
          <Space wrap>
            <Button icon={<UploadOutlined />} onClick={() => navigate(`/giayto/upload/cang-can/${data.id}`)}>
              Upload Giấy tờ
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/cangcan/${data.id}/edit`)}
            >
              Sửa
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              Xóa
            </Button>
            {data.trangThaiPheDuyet === 'CHỜ_PHE_DUYỆT' && (
              <>
                <Popconfirm
                  title="Phê duyệt cảng cạn?"
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={handleApprove}
                >
                  <Button type="primary" icon={<CheckCircleOutlined />}>
                    Phê duyệt
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="Từ chối?"
                  description="Bạn sẽ cần nhập lý do từ chối."
                  okText="Từ chối"
                  cancelText="Hủy"
                  onConfirm={handleReject}
                >
                  <Button danger icon={<CloseCircleOutlined />}>
                    Từ chối
                  </Button>
                </Popconfirm>
              </>
            )}
            <Button
              icon={<HistoryOutlined />}
              onClick={() => navigate(`/cangcan/${data.id}/history`)}
            >
              Lịch sử
            </Button>
          </Space>
        </div>
      </Card>
    </>
  );
}
