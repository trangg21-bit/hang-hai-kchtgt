import { useEffect, useState, useCallback } from 'react';
import { Card, Button, Space, Tag, Typography, Row, Col, Table, Modal, Input } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import toast from '../../components/ToastNotification';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchCangBienById, deleteCangBien, approveCangBien, rejectCangBien, fetchPortChildren } from './api';
import type { CangBienResponse } from './types';
import { PORT_STATUS_MAP } from '../../types/port';
import type { PortStatusValue } from '../../types/port';
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

// ── PortStatus badge renderer ───────────────────────────────────────

function renderPortStatusBadge(status: string | null | undefined): React.ReactNode {
  if (!status) return <span style={{ color: textTertiary }}>—</span>;
  const s = PORT_STATUS_MAP[status as PortStatusValue];
  if (!s) return <Tag>{status}</Tag>;
  return (
    <span style={{
      display: 'inline-flex', padding: '2px 10px', borderRadius: 999,
      fontSize: fontSizeMd, fontWeight: fontWeightMedium,
      background: `${s.color}15`, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

function formatCoord(val: number | null | undefined, precision = 6): string {
  if (val == null) return '—';
  return `${val >= 0 ? '+' : ''}${val.toFixed(precision)}`;
}

export default function PortDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CangBienResponse | null>(null);
  const [files, setFiles] = useState<GiayTo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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
  const [berths, setBerths] = useState<Berth[]>([]);
  const [waterZones, setWaterZones] = useState<WaterZone[]>([]);
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
      setBerths(bcRes.data || []);
      setTotalBenCangs(bcRes.total);
      setWaterZones(vnRes.data || []);
      setTotalVungNuocs(vnRes.total);
    } catch {
      // silent
    } finally {
      setChildrenLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadChildren(); }, [loadChildren]);

  // ── Delete handler with children check ────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!data) return;
    try {
      const children = await fetchPortChildren(data.id);
      if (children.berths > 0 || children.waterZones > 0) {
        toast.error(`Cảng này có ${children.berths} bến cảng và ${children.waterZones} vùng nước liên kết, không thể xóa`);
        return;
      }
    } catch {
      // allow
    }
    let inputValue = '';
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: (
        <div>
          <p>Vui lòng nhập <strong>{data.portName}</strong> để xác nhận xóa cảng biển này.</p>
          <Input
            placeholder="Nhập tên cảng biển"
            onChange={(e) => { inputValue = e.target.value; }}
            style={{ marginTop: 8 }}
          />
        </div>
      ),
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        if (inputValue !== data.portName) {
          toast.error('Tên cảng biển không khớp, vui lòng thử lại');
          throw new Error('Name mismatch');
        }
        try {
          await deleteCangBien(data.id);
          toast.success('Đã xóa thành công');
          navigate('/Port');
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
        }
      },
    });
  }, [data, navigate]);

  // ── Approve handler ───────────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!data) return;
    Modal.confirm({
      title: 'Xác nhận phê duyệt',
      content: `Phê duyệt cảng biển "${data.portName}"?`,
      okText: 'Phê duyệt',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await approveCangBien(data.id);
          toast.success('Phê duyệt thành công');
          loadData();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
        }
      },
    });
  }, [data, loadData]);

  // ── Reject handler ────────────────────────────────────────────────
  const handleRejectClick = useCallback(() => {
    if (!data) return;
    setRejectReason('');
    setRejectModalVisible(true);
  }, [data]);

  const handleRejectConfirm = useCallback(async () => {
    if (!data) return;
    if (rejectReason.trim().length < 10) {
      toast.error('Lý do từ chối tối thiểu 10 ký tự');
      return;
    }
    try {
      await rejectCangBien(data.id, rejectReason.trim());
      toast.success('Từ chối thành công');
      setRejectModalVisible(false);
      setRejectReason('');
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [data, rejectReason, loadData]);

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: textSecondary }}>Đang tải...</div>;
  if (isError || !data) {
    return (
      <Card>
        <p>Không tìm thấy cảng biển với ID {id}.</p>
        <Button onClick={() => navigate('/Port')}>Quay lại danh sách</Button>
      </Card>
    );
  }

  const portStatus = data.portStatus || '';
  const isDraft = portStatus === 'NHAP';
  const isPending = portStatus === 'CHO_PHE_DUYET';
  const isDeleted = portStatus === 'DA_XOA';

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
        {/* Status badge */}
        <Col xs={24}>
          <Card size="small" style={{ border: `1px solid ${borderDefault}`, padding: '8px 16px' }}>
            <Space>
              <Typography.Text strong style={{ fontSize: fontSizeMd }}>Trạng thái:</Typography.Text>
              {renderPortStatusBadge(portStatus)}
            </Space>
          </Card>
        </Col>

        {/* Info Card */}
        <Col xs={24} md={16}>
          <Card title="Thông tin chung" style={{ height: '100%' }}>
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Mã cảng</Typography.Text>
                <br />
                <Tag color="cyan" style={{ fontSize: fontSizeMd }}>{data.portCode}</Tag>
              </Col>
              <Col xs={24} sm={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Tên cảng</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.portName}</Typography.Text>
              </Col>
              <Col xs={24} sm={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Đơn vị quản lý</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.managingUnitId || data.orgUnitId || '—'}</Typography.Text>
              </Col>
              <Col xs={24} sm={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Tỉnh/Thành phố</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.province || '—'}</Typography.Text>
              </Col>
              <Col xs={24} sm={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Địa điểm chi tiết</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.detailedLocation || '—'}</Typography.Text>
              </Col>
              <Col xs={24} sm={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Phân cấp</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.portClass != null ? `Loại ${['I', 'II', 'III'][data.portClass - 1] || data.portClass}` : '—'}</Typography.Text>
              </Col>
              <Col xs={24} sm={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Nhóm cảng biển</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.portGroup ? `Nhóm ${data.portGroup}` : '—'}</Typography.Text>
              </Col>
              <Col xs={24} sm={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Phạm vi vùng nước</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.waterAreaScope || '—'}</Typography.Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Stats Card */}
        <Col xs={24} md={8}>
          <Card title="Chỉ số tổng hợp" style={{ height: '100%' }}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Diện tích</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold }}>
                  {data.area != null ? `${data.area.toFixed(2)} km²` : '—'}
                </Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Sức chứa</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold }}>
                  {data.maxVesselCapacity != null ? `${data.maxVesselCapacity} DWT` : '—'}
                </Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Tổng số bến</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.totalBerth ?? '—'}</Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Bến phao</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.buoyBerthCount ?? '—'}</Typography.Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* GPS Coordinates Section */}
        {data.portCoordinates && data.portCoordinates.length > 0 && (
          <Col xs={24}>
            <Card title="Tọa độ GPS">
              {data.portCoordinates.map((c, idx) => (
                <Row key={c.id || idx} gutter={16} style={{ marginBottom: 4 }}>
                  <Col>
                    <span style={{ color: textTertiary, fontSize: fontSizeSm }}>{idx + 1}. </span>
                  </Col>
                  <Col>
                    <Typography.Text style={{ fontFamily: 'monospace', fontSize: fontSizeMd }}>
                      Vĩ độ: {formatCoord(c.latitude)}
                    </Typography.Text>
                  </Col>
                  <Col>
                    <Typography.Text style={{ fontFamily: 'monospace', fontSize: fontSizeMd }}>
                      Kinh độ: {formatCoord(c.longitude)}
                    </Typography.Text>
                  </Col>
                </Row>
              ))}
            </Card>
          </Col>
        )}

        {/* Infrastructures Section */}
        {data.portInfrastructures && data.portInfrastructures.length > 0 && (
          <Col xs={24}>
            <Card title="Công trình KCHT">
              {data.portInfrastructures.map((inf, idx) => (
                <Row key={inf.id || idx} gutter={16} style={{ marginBottom: 4 }}>
                  <Col><span style={{ color: textTertiary, fontSize: fontSizeSm }}>{inf.sequenceNumber}.</span></Col>
                  <Col flex="auto"><Typography.Text style={{ fontSize: fontSizeMd }}>{inf.infrastructureName}</Typography.Text></Col>
                  <Col><Typography.Text style={{ fontSize: fontSizeMd, color: textSecondary }}>x{inf.quantity}</Typography.Text></Col>
                </Row>
              ))}
            </Card>
          </Col>
        )}

        {/* GIS Card */}
        <Col xs={24} md={16}>
          <Card title="Thông tin GIS">
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={6}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Loại đối tượng</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>
                  {data.loaiHinhHoc === 'POINT' ? 'Điểm' : data.loaiHinhHoc === 'LINE' ? 'Đường' : data.loaiHinhHoc === 'POLYGON' ? 'Vùng' : data.loaiHinhHoc || '—'}
                </Typography.Text>
              </Col>
              <Col xs={24} sm={6}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Hệ quy chiếu</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.coordinateSystem ?? '—'}</Typography.Text>
              </Col>
              <Col xs={24} sm={6}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Quy tắc hiển thị</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.displayRule ?? '—'}</Typography.Text>
              </Col>
              <Col xs={24} sm={6}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Biểu tượng</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeMd }}>{data.mapSymbolId || '—'}</Typography.Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Audit Card */}
        <Col xs={24} md={8}>
          <Card title="Thông tin hệ thống" style={{ height: '100%' }}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Tạo bởi</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeSm }}>{data.createdBy || '—'}</Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Cập nhật bởi</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeSm }}>{data.updatedBy || '—'}</Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Ngày tạo</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeSm }}>{formatDate(data.createdAt)}</Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text style={{ color: textTertiary, fontSize: fontSizeSm }}>Ngày cập nhật</Typography.Text>
                <br />
                <Typography.Text style={{ fontSize: fontSizeSm }}>{formatDate(data.updatedAt)}</Typography.Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Attachments */}
        <Col xs={24}>
          <Card title="File đính kèm">
            {files.length === 0 ? (
              <EmptyState description="Không có file đính kèm" />
            ) : (
              <div>
                {files.map((f) => (
                  <div key={f.id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Typography.Text style={{ fontSize: fontSizeMd }}>{f.fileName}</Typography.Text>
                      <br />
                      <Typography.Text type="secondary" style={{ fontSize: fontSizeSm }}>
                        {(f.fileSize / 1024).toFixed(1)} KB — {formatDate(f.createdAt)}
                      </Typography.Text>
                    </div>
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => window.open(documentApi.downloadUrl(f.minioKey), '_blank')}
                      />
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* Ghi chú */}
        {(data.notes || data.remarks) && (
          <Col xs={24}>
            <Card title="Ghi chú">
              <Typography.Text style={{ fontSize: fontSizeMd }}>{data.notes || data.remarks}</Typography.Text>
            </Card>
          </Col>
        )}

        {/* ── Bến cảng trực thuộc ── */}
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
            ) : berths.length === 0 ? (
              <EmptyState description="Không có bến cảng trực thuộc" />
            ) : (
              <>
                <Table<Berth>
                  dataSource={berths}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  showHeader={false}
                  columns={[
                    { dataIndex: 'berthCode', width: 120, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: fontSizeSm, color: textSecondary }}>{v}</span> },
                    { dataIndex: 'berthName', ellipsis: true, render: (v: string, r: Berth) => <Link to={`/Berth/${r.id}`} style={{ color: actionPrimary, fontWeight: fontWeightMedium, textDecoration: 'none' }}>{v}</Link> },
                    { dataIndex: 'berthType', width: 140, render: (v: string) => v ? <span style={{ fontSize: fontSizeSm, color: textSecondary, padding: `2px ${spaceSm}px`, borderRadius: radiusPill, background: 'rgba(11,46,79,0.04)' }}>{v}</span> : <span style={{ color: textTertiary, fontSize: fontSizeSm }}>—</span> },
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

        {/* ── Vùng nước trực thuộc ── */}
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
            ) : waterZones.length === 0 ? (
              <EmptyState description="Không có vùng nước trực thuộc" />
            ) : (
              <>
                <Table<WaterZone>
                  dataSource={waterZones}
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
              {!isDeleted && (
                <Button icon={<EditOutlined />} onClick={() => navigate(`/Port/${data.id}/edit`)}>
                  Chỉnh sửa
                </Button>
              )}
              {isDraft && (
                <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
                  Xóa
                </Button>
              )}
              {isPending && (
                <>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApprove}>
                    Phê duyệt
                  </Button>
                  <Button danger icon={<CloseCircleOutlined />} onClick={handleRejectClick}>
                    Từ chối
                  </Button>
                </>
              )}
              {isDraft && (
                <Button icon={<CheckCircleOutlined />} onClick={handleApprove}>
                  Gửi duyệt
                </Button>
              )}
              <Button icon={<HistoryOutlined />} onClick={() => navigate(`/Port/${data.id}/history`)}>
                Lịch sử
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* ── Reject Modal ── */}
      <Modal
        title="Từ chối cảng biển"
        open={rejectModalVisible}
        onCancel={() => { setRejectModalVisible(false); setRejectReason(''); }}
        onOk={handleRejectConfirm}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, disabled: rejectReason.trim().length < 10 }}
      >
        <div style={{ marginBottom: 12 }}>
          <Typography.Text>Lý do từ chối (tối thiểu 10 ký tự):</Typography.Text>
        </div>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối..."
          maxLength={500}
          showCount
        />
        {rejectReason.trim().length > 0 && rejectReason.trim().length < 10 && (
          <Typography.Text type="danger" style={{ fontSize: 13 }}>
            Lý do từ chối tối thiểu 10 ký tự
          </Typography.Text>
        )}
      </Modal>
    </>
  );
}
