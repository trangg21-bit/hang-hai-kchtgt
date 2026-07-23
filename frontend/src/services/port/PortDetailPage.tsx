import { useEffect, useState, useCallback } from 'react';
import { Card, Button, Space, Tag, Typography, Row, Col, Popconfirm, Table } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import toast from '../../components/ToastNotification';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchCangBienById, deleteCangBien, approveCangBien, rejectCangBien } from './api';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from './schema';
import type { CangBienResponse } from './types';
import { documentApi } from '../../app/document/api';
import type { GiayTo } from '../../app/document/types';
import EmptyState from '../../components/EmptyState';
import { berthCRUD, waterZoneCRUD } from '../../services/portService';
import type { Berth, WaterZone } from '../../types/port';
import { VUNGNUOOC_LOAI_MAP } from '../../types/port';
import {
  textPrimary, textSecondary, textTertiary,
  statusOperational, statusAttention, actionPrimary,
  borderDefault,
  spaceMd, spaceSm,
  fontSizeSm, fontSizeMd,
  fontWeightMedium, fontWeightBold,
  radiusPill,
} from '../../tokens';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

export default function PortDetailPage() {
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
      const fileRes = await documentApi.listByEntity('port', id, { page: 1, size: 20 });
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

  // ── Child entities ────────────────────────────────────────────────
  const [benCangs, setBenCangs] = useState<Berth[]>([]);
  const [vungNuocs, setVungNuocs] = useState<WaterZone[]>([]);
  const [totalBenCangs, setTotalBenCangs] = useState(0);
  const [totalVungNuocs, setTotalVungNuocs] = useState(0);
  const [childrenLoading, setChildrenLoading] = useState(false);

  const loadChildren = useCallback(async () => {
    if (!id) return;
    setChildrenLoading(true);
    try {
      const [bcRes, vnRes] = await Promise.all([
        berthCRUD.search({ portId: id, pageSize: 5 }),
        waterZoneCRUD.findAll({ portId: id, size: 5 }),
      ]);
      setBenCangs(bcRes.data || []);
      setTotalBenCangs(bcRes.total);
      setVungNuocs(vnRes.data || []);
      setTotalVungNuocs(vnRes.total);
    } catch {
      // silent — children are supplementary
    } finally {
      setChildrenLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadChildren(); }, [loadChildren]);

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (isError || !data) {
    return (
      <Card>
        <p>Không tìm thấy cảng biển với ID {id}.</p>
        <Button onClick={() => navigate('/Port')}>Quay lại danh sách</Button>
      </Card>
    );
  }

  const gpsPaired = data.viDo != null && data.kinhDo != null;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/Port')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {data.portCode} — {data.portName}
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
                <Tag color="cyan">{data.portCode}</Tag>
              </Col>
              <Col span={12}>
                <Typography.Text strong>Tên cảng:</Typography.Text>
                <br />
                <Typography.Text>{data.portName}</Typography.Text>
              </Col>
              <Col span={24}>
                <Typography.Text strong>Tỉnh/thành phố:</Typography.Text>
                <br />
                <Typography.Text>{data.province || '—'}</Typography.Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Stats Card */}
        <Col xs={24} md={8}>
          <Card title="Thống kê">
            <Typography.Text strong>Diện tích (m²):</Typography.Text>
            <br />
            <Typography.Text>{data.area != null ? data.area.toFixed(2) : '—'}</Typography.Text>
            <br />
            <Typography.Text strong>Khả năng tiếp nhận:</Typography.Text>
            <br />
            <Typography.Text>{data.khaNangTiepNhan != null ? data.khaNangTiepNhan.toFixed(2) : '—'}</Typography.Text>
          </Card>
        </Col>

        {/* Geo Card */}
        <Col xs={24} md={16}>
          <Card title="Thông tin địa lý & GIS">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Typography.Text strong>Loại đối tượng:</Typography.Text>{' '}
                <Typography.Text>
                  {data.loaiHinhHoc === 'POINT' ? 'Đối tượng điểm'
                    : data.loaiHinhHoc === 'LINE' ? 'Đối tượng đường'
                      : data.loaiHinhHoc === 'POLYGON' ? 'Đối tượng vùng'
                        : data.loaiHinhHoc || 'Đối tượng điểm'}
                </Typography.Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Status Card */}
        <Col xs={24} md={8}>
          <Card title="Trạng thái">
            <Typography.Text strong>Trạng thái hoạt động:</Typography.Text>
            <br />
            {data.operationalStatus && (
              <Tag color={trangThaiHoatDongBadge(data.operationalStatus).color}>
                {trangThaiHoatDongBadge(data.operationalStatus).label}
              </Tag>
            )}
            <br />
            <Typography.Text strong>Trạng thái phê duyệt:</Typography.Text>
            <br />
            {data.approvalStatus && (
              <Tag color={trangThaiPheDuyetBadge(data.approvalStatus).color}>
                {trangThaiPheDuyetBadge(data.approvalStatus).label}
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
                      onClick={() => window.open(documentApi.downloadUrl(f.minioKey), '_blank')}
                      style={{ marginLeft: 8 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* ── Bến cảng trực thuộc ────────────────────────────────────── */}
        <Col xs={24}>
          <Card
            title={
              <span style={{ color: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightBold }}>
                Bến cảng trực thuộc
                {!childrenLoading && <span style={{ color: textTertiary, fontWeight: fontWeightMedium, fontSize: fontSizeSm, marginLeft: spaceSm }}>({totalBenCangs})</span>}
              </span>
            }
            style={{ border: `1px solid ${borderDefault}` }}
          >
            {childrenLoading ? (
              <div style={{ textAlign: 'center', padding: spaceMd * 2, color: textTertiary, fontSize: fontSizeSm }}>Đang tải...</div>
            ) : benCangs.length === 0 ? (
              <EmptyState description="Không có bến cảng trực thuộc" />
            ) : (
              <>
                <Table<Berth>
                  dataSource={benCangs}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  showHeader={false}
                  columns={[
                    { dataIndex: 'berthCode', width: 120, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: fontSizeSm, color: textSecondary }}>{v}</span> },
                    { dataIndex: 'berthName', ellipsis: true, render: (v: string, r: Berth) => <Link to={`/Berth/${r.id}`} style={{ color: actionPrimary, fontWeight: fontWeightMedium, textDecoration: 'none' }}>{v}</Link> },
                    { dataIndex: 'loaiBen', width: 140, render: (v: string) => v ? <span style={{ fontSize: fontSizeSm, color: textSecondary, padding: `2px ${spaceSm}px`, borderRadius: radiusPill, background: 'rgba(11,46,79,0.04)' }}>{v}</span> : <span style={{ color: textTertiary, fontSize: fontSizeSm }}>—</span> },
                    { dataIndex: 'operationalStatus', width: 120, render: (v: string) => v === 'HIEN_HANH' ? <span style={{ fontSize: fontSizeSm, color: statusOperational, fontWeight: fontWeightMedium }}>● Hoạt động</span> : <span style={{ fontSize: fontSizeSm, color: statusAttention, fontWeight: fontWeightMedium }}>● Tạm ngừng</span> },
                  ]}
                />
                {totalBenCangs > 5 && (
                  <div style={{ textAlign: 'right', marginTop: spaceSm }}>
                    <Link to={`/Berth?portId=${id}`} style={{ color: actionPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeSm, textDecoration: 'none' }}>Xem tất cả {totalBenCangs} bến cảng →</Link>
                  </div>
                )}
              </>
            )}
          </Card>
        </Col>

        {/* ── Vùng nước trực thuộc ──────────────────────────────────── */}
        <Col xs={24}>
          <Card
            title={
              <span style={{ color: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightBold }}>
                Vùng nước trực thuộc
                {!childrenLoading && <span style={{ color: textTertiary, fontWeight: fontWeightMedium, fontSize: fontSizeSm, marginLeft: spaceSm }}>({totalVungNuocs})</span>}
              </span>
            }
            style={{ border: `1px solid ${borderDefault}` }}
          >
            {childrenLoading ? (
              <div style={{ textAlign: 'center', padding: spaceMd * 2, color: textTertiary, fontSize: fontSizeSm }}>Đang tải...</div>
            ) : vungNuocs.length === 0 ? (
              <EmptyState description="Không có vùng nước trực thuộc" />
            ) : (
              <>
                <Table<WaterZone>
                  dataSource={vungNuocs}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  showHeader={false}
                  columns={[
                    { dataIndex: 'waterZoneCode', width: 120, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: fontSizeSm, color: textSecondary }}>{v}</span> },
                    { dataIndex: 'waterZoneName', ellipsis: true, render: (v: string, r: WaterZone) => <Link to={`/WaterZone/${r.id}`} style={{ color: actionPrimary, fontWeight: fontWeightMedium, textDecoration: 'none' }}>{v}</Link> },
                    { dataIndex: 'loaiVungNuoc', width: 160, render: (v: string) => { const label = VUNGNUOOC_LOAI_MAP[v as keyof typeof VUNGNUOOC_LOAI_MAP]?.label || v; return <span style={{ fontSize: fontSizeSm, color: textSecondary, padding: `2px ${spaceSm}px`, borderRadius: radiusPill, background: 'rgba(11,46,79,0.04)' }}>{label}</span>; } },
                    { dataIndex: 'area', width: 100, render: (v: number) => v != null ? <span style={{ fontSize: fontSizeSm, color: textSecondary }}>{v.toLocaleString('vi-VN')} m²</span> : <span style={{ color: textTertiary, fontSize: fontSizeSm }}>—</span> },
                  ]}
                />
                {totalVungNuocs > 5 && (
                  <div style={{ textAlign: 'right', marginTop: spaceSm }}>
                    <Link to={`/WaterZone?portId=${id}`} style={{ color: actionPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeSm, textDecoration: 'none' }}>Xem tất cả {totalVungNuocs} vùng nước →</Link>
                  </div>
                )}
              </>
            )}
          </Card>
        </Col>

        {/* Action Footer */}
        <Col xs={24}>
          <Card>
            <Space wrap>
              <Button icon={<UploadOutlined />} onClick={() => navigate(`/document/upload/port/${data.id}`)}>
                Upload Giấy tờ
              </Button>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/Port/${data.id}/edit`)}>
                Chỉnh sửa
              </Button>
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa cảng biển "${data.portName}"?`}
                okText="Xóa"
                okType="danger"
                cancelText="Hủy"
                onConfirm={async () => {
                  try {
                    await deleteCangBien(data.id);
                    toast.success('Xóa thành công');
                    navigate('/Port');
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
                  }
                }}
              >
                <Button danger icon={<DeleteOutlined />}>Xóa</Button>
              </Popconfirm>
              {data.approvalStatus === 'CHO_PHE_DUYET' && (
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
                        if (reason != null) toast.error('Lý do từ chối tối thiểu 10 ký tự');
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
              <Button icon={<HistoryOutlined />} onClick={() => navigate(`/Port/${data.id}/history`)}>
                Lịch sử
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  );
}
