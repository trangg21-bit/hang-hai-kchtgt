import { useEffect, useState, useCallback } from 'react';
import { Card, Button, Space, Tag, Typography, Row, Col, Popconfirm } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import toast from '../../components/ToastNotification';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCangBienById, deleteCangBien, approveCangBien, rejectCangBien } from './api';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from './schema';
import type { CangBienResponse } from './types';
import { giayToApi } from '../../app/giayto/api';
import type { GiayTo } from '../../app/giayto/types';
import EmptyState from '../../components/EmptyState';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

export default function CangBienDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CangBienResponse | null>(null);
  const [files, setFiles] = useState<GiayTo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchCangBienById(id);
      setData(res);
      const fileRes = await giayToApi.listByEntity('cang-bien', id, { page: 1, size: 20 });
      setFiles(fileRes.data);
    } catch (err: unknown) {
      setIsError(true);
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin cảng biển';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (isError || !data) {
    return (
      <Card>
        <p>Không tìm thấy cảng biển với ID {id}.</p>
        <Button onClick={() => navigate('/cangbien')}>Quay lại danh sách</Button>
      </Card>
    );
  }

  const gpsPaired = data.viDo !== null && data.kinhDo !== null;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cangbien')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {data.maCang} — {data.tenCang}
          </Typography.Title>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Info Card */}
        <Col xs={24} md={16}>
          <Card title="Thông tin chung">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Typography.Text strong>Mã cảng:</Typography.Text>
                <br />
                <Tag color="cyan">{data.maCang}</Tag>
              </Col>
              <Col span={12}>
                <Typography.Text strong>Tên cảng:</Typography.Text>
                <br />
                <Typography.Text>{data.tenCang}</Typography.Text>
              </Col>
              <Col span={24}>
                <Typography.Text strong>Tỉnh/thành phố:</Typography.Text>
                <br />
                <Typography.Text>{data.tinhThanhPho || '—'}</Typography.Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Stats Card */}
        <Col xs={24} md={8}>
          <Card title="Thống kê">
            <Typography.Text strong>Diện tích (m²):</Typography.Text>
            <br />
            <Typography.Text>{data.dienTich !== null ? data.dienTich.toFixed(2) : '—'}</Typography.Text>
            <br />
            <Typography.Text strong>Khả năng tiếp nhận:</Typography.Text>
            <br />
            <Typography.Text>{data.khaNangTiepNhan !== null ? data.khaNangTiepNhan.toFixed(2) : '—'}</Typography.Text>
          </Card>
        </Col>

        {/* Geo Card */}
        <Col xs={24} md={16}>
          <Card title="Thông tin địa lý">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Typography.Text strong>Vĩ độ:</Typography.Text>
                <br />
                <Typography.Text>{data.viDo !== null ? data.viDo.toFixed(6) : '—'}</Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text strong>Kinh độ:</Typography.Text>
                <br />
                <Typography.Text>{data.kinhDo !== null ? data.kinhDo.toFixed(6) : '—'}</Typography.Text>
              </Col>
            </Row>
            {gpsPaired ? (
              <Card size="small" style={{ marginTop: 8 }}>
                <Typography.Text type="secondary">Đã đăng ký GPS — Vĩ độ {data.viDo?.toFixed(6)}, Kinh độ {data.kinhDo?.toFixed(6)}</Typography.Text>
              </Card>
            ) : (
              <Card size="small" style={{ marginTop: 8 }} type="inner">
                <Typography.Text type="secondary">Chưa có thông tin GPS</Typography.Text>
              </Card>
            )}
          </Card>
        </Col>

        {/* Status Card */}
        <Col xs={24} md={8}>
          <Card title="Trạng thái">
            <Typography.Text strong>Trạng thái hoạt động:</Typography.Text>
            <br />
            {data.trangThaiHoatDong && (
              <Tag color={trangThaiHoatDongBadge(data.trangThaiHoatDong).color}>
                {trangThaiHoatDongBadge(data.trangThaiHoatDong).label}
              </Tag>
            )}
            <br />
            <Typography.Text strong>Trạng thái phê duyệt:</Typography.Text>
            <br />
            {data.trangThaiPheDuyet && (
              <Tag color={trangThaiPheDuyetBadge(data.trangThaiPheDuyet).color}>
                {trangThaiPheDuyetBadge(data.trangThaiPheDuyet).label}
              </Tag>
            )}
          </Card>
        </Col>

        {/* Audit Card */}
        <Col xs={24}>
          <Card title="Thông tin audit">
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Typography.Text strong>Tạo bởi:</Typography.Text>
                <br />
                <Typography.Text>{data.createdBy || '—'}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text strong>Cập nhật bởi:</Typography.Text>
                <br />
                <Typography.Text>{data.updatedBy || '—'}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text strong>Ngày tạo:</Typography.Text>
                <br />
                <Typography.Text>{formatDate(data.createdAt)}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text strong>Cập nhật:</Typography.Text>
                <br />
                <Typography.Text>{formatDate(data.updatedAt)}</Typography.Text>
              </Col>
              <Col span={8}>
                <Typography.Text strong>Org Unit ID:</Typography.Text>
                <br />
                <Typography.Text>{data.orgUnitId || '—'}</Typography.Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Documents Section */}
        <Col xs={24}>
          <Card title="Tài liệu đính kèm">
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

        {/* Action Footer */}
        <Col xs={24}>
          <Card>
            <Space wrap>
              <Button icon={<UploadOutlined />} onClick={() => navigate(`/giayto/upload/cang-bien/${data.id}`)}>
                Upload Giấy tờ
              </Button>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/cangbien/${data.id}/edit`)}>
                Chỉnh sửa
              </Button>
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa cảng biển "${data.tenCang}"?`}
                okText="Xóa"
                okType="danger"
                cancelText="Hủy"
                onConfirm={async () => {
                  try {
                    await deleteCangBien(data.id);
                    toast.success('Xóa thành công');
                    navigate('/cangbien');
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
                  }
                }}
              >
                <Button danger icon={<DeleteOutlined />}>Xóa</Button>
              </Popconfirm>
              {data.trangThaiPheDuyet === 'CHỜ_PHE_DUYỆT' && (
                <>
                  <Popconfirm
                    title="Phê duyệt cảng biển này?"
                    okText="Phê duyệt"
                    cancelText="Hủy"
                    onConfirm={async () => {
                      try {
                        await approveCangBien(data.id);
                        toast.success('Phê duyệt thành công');
                        loadData();
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
                      }
                    }}
                  >
                    <Button type="primary" icon={<CheckCircleOutlined />}>Phê duyệt</Button>
                  </Popconfirm>
                  <Popconfirm
                    title="Từ chối cảng biển này?"
                    okText="Từ chối"
                    cancelText="Hủy"
                    onConfirm={async () => {
                      const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
                      if (reason === null || reason.length < 10) {
                        if (reason !== null) toast.error('Lý do từ chối tối thiểu 10 ký tự');
                        return;
                      }
                      try {
                        await rejectCangBien(data.id, reason);
                        toast.success('Từ chối thành công');
                        loadData();
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
                      }
                    }}
                  >
                    <Button danger icon={<CloseCircleOutlined />}>Từ chối</Button>
                  </Popconfirm>
                </>
              )}
              <Button icon={<HistoryOutlined />} onClick={() => navigate(`/cangbien/${data.id}/history`)}>
                Lịch sử
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  );
}
