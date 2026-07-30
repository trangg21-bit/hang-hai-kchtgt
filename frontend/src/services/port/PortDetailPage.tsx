import { useEffect, useState, useCallback } from 'react';
import {
  Card, Button, Space, Tag, Typography, Row, Col, Popconfirm, Table,
  Tabs, Breadcrumb, Spin, Divider,
} from 'antd';
import {
  UploadOutlined, DownloadOutlined, ArrowLeftOutlined,
  EditOutlined, DeleteOutlined, CheckCircleOutlined,
  CloseCircleOutlined, HistoryOutlined,
  EnvironmentOutlined, ApartmentOutlined, FileOutlined,
  InfoCircleOutlined, AimOutlined,
} from '@ant-design/icons';
import toast from '../../components/ToastNotification';
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
import { usePermissionStore } from '../../store/permissionStore';
import {
  textPrimary, textSecondary, textTertiary,
  statusOperational, statusAttention, statusCritical, statusDraft,
  actionPrimary, actionHover,
  borderDefault, surfaceCard, surfacePage,
  spaceMd, spaceSm, spaceLg, spaceXl, spaceFormField,
  fontSizeSm, fontSizeMd, fontSizeLg, fontSizeXl,
  fontWeightNormal, fontWeightMedium, fontWeightBold,
  radiusPill, radiusLg, radiusMd,
  cardStyle, dividerStyle, metaStyle,
} from '../../tokens';

// ── Helpers ─────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

function formatNumber(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val)) return '—';
  return val.toLocaleString('vi-VN');
}

function formatArea(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val)) return '—';
  return `${val.toLocaleString('vi-VN')} m²`;
}

function formatLength(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val)) return '—';
  return `${val.toLocaleString('vi-VN')} m`;
}

const STATUS_OPERATIONAL_LABEL: Record<string, { color: string; label: string }> = {
  HIEN_HANH: { color: '#1BAF7A', label: 'Hiện hành' },
  TAM_NGUNG: { color: '#EDA100', label: 'Tạm ngừng' },
};

const STATUS_APPROVAL_LABEL: Record<string, { color: string; label: string }> = {
  CHO_PHE_DUYET: { color: '#EDA100', label: 'Chờ phê duyệt' },
  DUOC_PHE_DUYET: { color: '#1BAF7A', label: 'Được phê duyệt' },
  TU_CHOI: { color: '#E34948', label: 'Từ chối' },
};

const GIS_OBJECT_TYPE_LABEL: Record<string, string> = {
  POINT: 'Đối tượng điểm',
  LINE: 'Đối tượng đường',
  POLYGON: 'Đối tượng vùng',
};

// ── Styled label helpers ────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  color: textSecondary,
  fontSize: fontSizeSm,
  fontWeight: fontWeightMedium,
  marginBottom: 4,
  display: 'block',
};

const valueStyle: React.CSSProperties = {
  color: textPrimary,
  fontSize: fontSizeMd,
  fontWeight: fontWeightNormal,
};

const groupTitleStyle: React.CSSProperties = {
  color: textPrimary,
  fontSize: fontSizeLg,
  fontWeight: fontWeightBold,
  marginBottom: spaceMd,
  paddingBottom: spaceSm,
  borderBottom: `1px solid ${borderDefault}`,
};

// ── Stat card for summary numbers ───────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div style={{
      background: surfaceCard,
      border: `0.5px solid ${borderDefault}`,
      borderRadius: radiusMd,
      padding: `${spaceSm}px ${spaceMd}px`,
      display: 'flex',
      alignItems: 'center',
      gap: spaceSm,
    }}>
      {icon && <span style={{ color: textTertiary, fontSize: 20 }}>{icon}</span>}
      <div>
        <div style={{ color: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightBold }}>{value}</div>
        <div style={{ color: textTertiary, fontSize: fontSizeSm }}>{label}</div>
      </div>
    </div>
  );
}

// ── Section group wrapper ───────────────────────────────────────────

function SectionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: spaceLg }}>
      <Typography.Text style={groupTitleStyle}>{title}</Typography.Text>
      <div style={{ padding: `0 ${spaceSm}px` }}>
        {children}
      </div>
    </div>
  );
}

// ── Info row for label+value pairs ──────────────────────────────────

function InfoRow({ label, value, span }: { label: string; value: React.ReactNode; span?: number }) {
  return (
    <Col xs={24} sm={12} md={span || 8} lg={span || 6}>
      <div style={{ marginBottom: spaceMd }}>
        <Typography.Text style={labelStyle}>{label}</Typography.Text>
        <div style={valueStyle}>{value}</div>
      </div>
    </Col>
  );
}

// ── Placeholder tab content ─────────────────────────────────────────

function PlaceholderTab({ tabName }: { tabName: string }) {
  return (
    <Card style={{ textAlign: 'center', padding: spaceXl * 2 }}>
      <InfoCircleOutlined style={{ fontSize: 48, color: textTertiary, marginBottom: spaceMd }} />
      <Typography.Title level={4} style={{ color: textSecondary, marginTop: spaceMd }}>
        {tabName}
      </Typography.Title>
      <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>
        Tính năng đang được phát triển. Vui lòng quay lại sau.
      </Typography.Text>
    </Card>
  );
}

// ── Main component ──────────────────────────────────────────────────

export default function PortDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hasPermission = usePermissionStore((s) => s.hasPermission);

  const [data, setData] = useState<CangBienResponse | null>(null);
  const [files, setFiles] = useState<GiayTo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // ── Load main data + attachments ──────────────────────────────────

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchCangBienById(id);
      setData(res);
      const fileRes = await documentApi.listByEntity('port', id, { page: 1, size: 50 });
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
      // silent — children are supplementary
    } finally {
      setChildrenLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadChildren(); }, [loadChildren]);

  // ── Loading / Error states ────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ padding: spaceXl * 2, textAlign: 'center' }}>
        <Spin size="large" tip="Đang tải thông tin cảng biển..." />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ padding: spaceLg }}>
        <Breadcrumb
          items={[
            { title: <Link to="/Port">Quản lý cảng biển</Link> },
            { title: 'Chi tiết cảng' },
          ]}
          style={{ marginBottom: spaceMd }}
        />
        <Card>
          <EmptyState
            description={`Không tìm thấy cảng biển với ID "${id}".`}
            ctaText="Quay lại danh sách"
            onCta={() => navigate('/Port')}
          />
        </Card>
      </div>
    );
  }

  // ── Permission checks ─────────────────────────────────────────────

  const canEdit = hasPermission('port:update');
  const canDelete = hasPermission('port:delete');
  const canApprove = hasPermission('port:approve');
  const canViewHistory = hasPermission('port:read');

  // ── Breadcrumb items ──────────────────────────────────────────────

  const breadcrumbItems = [
    { title: <Link to="/Port">Quản lý cảng biển</Link> },
    { title: `Chi tiết cảng ${data.portCode}` },
  ];

  // ── Tab items ─────────────────────────────────────────────────────

  const tabItems = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: renderGeneralTab(data, berths, totalBenCangs, waterZones, totalVungNuocs, files, childrenLoading, id!, navigate),
    },
    { key: 'infrastructure', label: 'Kết cấu hạ tầng khác', children: <PlaceholderTab tabName="Kết cấu hạ tầng khác" /> },
    { key: 'planning', label: 'Thông tin quy hoạch', children: <PlaceholderTab tabName="Thông tin quy hoạch" /> },
    { key: 'operation', label: 'Vận hành khai thác', children: <PlaceholderTab tabName="Vận hành khai thác" /> },
    { key: 'maintenance', label: 'Bảo trì', children: <PlaceholderTab tabName="Bảo trì" /> },
    { key: 'incidents', label: 'Sự cố', children: <PlaceholderTab tabName="Sự cố" /> },
  ];

  return (
    <div style={{ padding: spaceLg, background: surfacePage, minHeight: '100vh' }}>
      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <Breadcrumb items={breadcrumbItems} style={{ marginBottom: spaceMd }} />

      {/* ── Header card ─────────────────────────────────────────── */}
      <Card
        style={{
          marginBottom: spaceMd,
          borderRadius: radiusLg,
          border: `0.5px solid ${borderDefault}`,
        }}
        styles={{ body: { padding: `${spaceMd}px ${spaceLg}px` } }}
      >
        <Row align="middle" justify="space-between" wrap>
          <Col>
            <Space size="middle">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/Port')}
                style={{ borderRadius: radiusPill }}
              >
                Quay lại
              </Button>
              <div>
                <Typography.Title level={4} style={{ margin: 0, color: textPrimary }}>
                  {data.portCode} — {data.portName}
                </Typography.Title>
                <Space style={{ marginTop: spaceXs }}>
                  {data.operationalStatus && (
                    <Tag color={trangThaiHoatDongBadge(data.operationalStatus).color}>
                      {trangThaiHoatDongBadge(data.operationalStatus).label}
                    </Tag>
                  )}
                  {data.approvalStatus && (
                    <Tag color={trangThaiPheDuyetBadge(data.approvalStatus).color}>
                      {trangThaiPheDuyetBadge(data.approvalStatus).label}
                    </Tag>
                  )}
                  {data.province && <Tag>{data.province}</Tag>}
                </Space>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ── Action toolbar ──────────────────────────────────────────── */}
      <Card
        style={{
          marginBottom: spaceMd,
          borderRadius: radiusLg,
          border: `0.5px solid ${borderDefault}`,
        }}
        styles={{ body: { padding: `${spaceSm}px ${spaceLg}px` } }}
      >
        <Row justify="space-between" align="middle" wrap>
          <Col>
            <Typography.Text style={{ color: textSecondary, fontSize: fontSizeSm }}>
              Cập nhật lần cuối: {formatDate(data.updatedAt)}
            </Typography.Text>
          </Col>
          <Col>
            <Space wrap size="small">
              {canEdit && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/Port/${data.id}/edit`)}
                  style={{ borderRadius: radiusPill }}
                >
                  Chỉnh sửa
                </Button>
              )}
              {canDelete && (
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
                  <Button danger icon={<DeleteOutlined />} style={{ borderRadius: radiusPill }}>
                    Xóa
                  </Button>
                </Popconfirm>
              )}
              {data.approvalStatus === 'CHO_PHE_DUYET' && (
                <>
                  {canApprove && (
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
                      <Button type="primary" icon={<CheckCircleOutlined />} style={{ borderRadius: radiusPill }}>
                        Phê duyệt
                      </Button>
                    </Popconfirm>
                  )}
                  {canApprove && (
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
                      <Button danger icon={<CloseCircleOutlined />} style={{ borderRadius: radiusPill }}>
                        Từ chối
                      </Button>
                    </Popconfirm>
                  )}
                </>
              )}
              {canViewHistory && (
                <Button
                  icon={<HistoryOutlined />}
                  onClick={() => navigate(`/Port/${data.id}/history`)}
                  style={{ borderRadius: radiusPill }}
                >
                  Lịch sử
                </Button>
              )}
              <Button
                icon={<UploadOutlined />}
                onClick={() => navigate(`/document/upload/port/${data.id}`)}
                style={{ borderRadius: radiusPill }}
              >
                Upload tài liệu
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <Card
        style={{
          borderRadius: radiusLg,
          border: `0.5px solid ${borderDefault}`,
        }}
        styles={{ body: { padding: `${spaceMd}px ${spaceLg}px` } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          style={{ color: textPrimary }}
        />
      </Card>
    </div>
  );
}

// ── Tab: Thông tin chung ────────────────────────────────────────────

function renderGeneralTab(
  data: CangBienResponse,
  berths: Berth[],
  totalBenCangs: number,
  waterZones: WaterZone[],
  totalVungNuocs: number,
  files: GiayTo[],
  childrenLoading: boolean,
  portId: string,
  navigate: ReturnType<typeof useNavigate>,
) {
  return (
    <div style={{ maxWidth: 1200 }}>
      {/* ── Group 1: Thông tin chung (8 fields) ──────────────────── */}
      <SectionGroup title="1. Thông tin chung">
        <Row gutter={[spaceMd, 0]}>
          <InfoRow
            label="Mã cảng"
            value={<Tag color="cyan" style={{ borderRadius: radiusPill, margin: 0 }}>{data.portCode}</Tag>}
          />
          <InfoRow label="Tên cảng" value={data.portName} />
          <InfoRow label="Đơn vị quản lý" value={data.orgUnitId || '—'} />
          <InfoRow label="Nhóm cảng" value={data.portGroup != null ? `Nhóm ${data.portGroup}` : '—'} />
          <InfoRow label="Tỉnh/Thành phố" value={data.province || '—'} />
          <InfoRow label="Địa điểm chi tiết" value={data.diaDiemChiTiet || '—'} span={12} />
          <InfoRow label="Phân cấp" value={data.phanCap != null ? `Cấp ${data.phanCap}` : '—'} />
          <InfoRow label="Phạm vi vùng nước" value={data.phamViVungNuoc || '—'} span={12} />
        </Row>
      </SectionGroup>

      <Divider style={dividerStyle} />

      {/* ── Group 2: Chỉ số tổng hợp (14 fields) ─────────────────── */}
      <SectionGroup title="2. Chỉ số tổng hợp">
        <Row gutter={[spaceSm, spaceSm]}>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Bến cảng" value={formatNumber(data.tongSoBenCang)} icon={<ApartmentOutlined />} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Khu neo đậu/chuyển tải" value={formatNumber(data.tongSoKhuNeoDauChuyenTai)} icon={<AimOutlined />} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Tuyến luồng công cộng" value={formatNumber(data.tongSoTuyenLuongCongCong)} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Tuyến luồng chuyên dụng" value={formatNumber(data.tongSoTuyenLuongChuyenDung)} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Chiều dài luồng CC" value={formatLength(data.tongChieuDaiLuongCongCong)} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Chiều dài luồng CD" value={formatLength(data.tongChieuDaiLuongChuyenDung)} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Phao tiêu/báo hiệu" value={formatNumber(data.tongSoPhaoTieuBaoHieu)} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Đê kè" value={formatNumber(data.tongSoDeKe)} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Chiều dài đê kè" value={formatLength(data.tongChieuDaiDeKe)} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Đèn biển/đăng tiêu" value={formatNumber(data.tongSoDenBienDangTieu)} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Bến phao" value={formatNumber(data.quantityBenPhao)} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Khu neo đậu" value={formatNumber(data.quantityKhuNeoDau)} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Khu chuyển tải" value={formatNumber(data.quantityKhuChuyenTai)} />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <StatCard label="Các khu nước khác" value={data.cacKhuNuocKhac ? 'Có' : '—'} />
          </Col>
        </Row>
        {data.cacKhuNuocKhac && (
          <Row style={{ marginTop: spaceSm }}>
            <Col span={24}>
              <Typography.Text style={{ color: textSecondary, fontSize: fontSizeSm }}>
                <InfoCircleOutlined style={{ marginRight: spaceXs }} />
                {data.cacKhuNuocKhac}
              </Typography.Text>
            </Col>
          </Row>
        )}
      </SectionGroup>

      <Divider style={dividerStyle} />

      {/* ── Group 3: GIS (4 fields) ──────────────────────────────── */}
      <SectionGroup title="3. Thông tin GIS">
        <Row gutter={[spaceMd, 0]}>
          <InfoRow
            label="Loại đối tượng"
            value={GIS_OBJECT_TYPE_LABEL[data.loaiHinhHoc || ''] || data.loaiHinhHoc || 'Đối tượng điểm'}
          />
          <InfoRow label="Mã biểu tượng" value={data.bieuTuongId || '—'} />
          <InfoRow label="Hệ quy chiếu" value={data.heQuyChieu != null ? `EPSG:${data.heQuyChieu}` : '—'} />
          <InfoRow label="Quy tắc hiển thị" value={data.quyTacHienThi != null ? String(data.quyTacHienThi) : '—'} />
        </Row>
      </SectionGroup>

      <Divider style={dividerStyle} />

      {/* ── Group 4: Tọa độ GPS ───────────────────────────────────── */}
      <SectionGroup title="4. Tọa độ GPS">
        {data.latitude != null && data.longitude != null ? (
          <Row gutter={[spaceMd, 0]}>
            <InfoRow
              label="Vĩ độ (Latitude)"
              value={<code style={{ fontSize: fontSizeMd, color: textPrimary }}>{data.latitude.toFixed(6)}</code>}
            />
            <InfoRow
              label="Kinh độ (Longitude)"
              value={<code style={{ fontSize: fontSizeMd, color: textPrimary }}>{data.longitude.toFixed(6)}</code>}
            />
            <Col xs={24}>
              <div style={{ marginTop: spaceSm }}>
                <a
                  href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: actionPrimary, fontSize: fontSizeSm }}
                >
                  <EnvironmentOutlined style={{ marginRight: spaceXs }} />
                  Xem trên Google Maps
                </a>
              </div>
            </Col>
          </Row>
        ) : (
          <EmptyState description="Chưa có dữ liệu tọa độ GPS" />
        )}
      </SectionGroup>

      <Divider style={dividerStyle} />

      {/* ── Group 5: Công trình KCHT ───────────────────────────────── */}
      <SectionGroup title="5. Công trình KCHT trực thuộc">
        {childrenLoading ? (
          <div style={{ textAlign: 'center', padding: spaceMd * 2 }}>
            <Spin tip="Đang tải..." />
          </div>
        ) : (
          <>
            {/* Berths */}
            <Typography.Text style={{ ...labelStyle, marginTop: spaceSm }}>
              Bến cảng trực thuộc ({totalBenCangs})
            </Typography.Text>
            {berths.length === 0 ? (
              <EmptyState description="Không có bến cảng trực thuộc" />
            ) : (
              <Table<Berth>
                dataSource={berths}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Mã bến', dataIndex: 'berthCode', width: 120, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: fontSizeSm, color: textSecondary }}>{v}</span> },
                  {
                    title: 'Tên bến', dataIndex: 'berthName', ellipsis: true,
                    render: (v: string, r: Berth) => (
                      <Link to={`/Berth/${r.id}`} style={{ color: actionPrimary, fontWeight: fontWeightMedium, textDecoration: 'none' }}>{v}</Link>
                    ),
                  },
                  {
                    title: 'Loại bến', dataIndex: 'berthType', width: 140,
                    render: (v: string) => v
                      ? <Tag style={{ borderRadius: radiusPill }}>{v}</Tag>
                      : <span style={{ color: textTertiary, fontSize: fontSizeSm }}>—</span>,
                  },
                  {
                    title: 'Trạng thái', dataIndex: 'operationalStatus', width: 120,
                    render: (v: string) => {
                      const s = STATUS_OPERATIONAL_LABEL[v];
                      return <Tag color={s?.color}>{s?.label || v || '—'}</Tag>;
                    },
                  },
                ]}
              />
            )}
            {totalBenCangs > 5 && (
              <div style={{ textAlign: 'right', marginTop: spaceSm }}>
                <Link to={`/Berth?portId=${portId}`} style={{ color: actionPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeSm }}>
                  Xem tất cả {totalBenCangs} bến cảng →
                </Link>
              </div>
            )}

            <Divider style={dividerStyle} />

            {/* Water zones */}
            <Typography.Text style={{ ...labelStyle, marginTop: spaceSm }}>
              Vùng nước trực thuộc ({totalVungNuocs})
            </Typography.Text>
            {waterZones.length === 0 ? (
              <EmptyState description="Không có vùng nước trực thuộc" />
            ) : (
              <Table<WaterZone>
                dataSource={waterZones}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Mã vùng', dataIndex: 'waterZoneCode', width: 120, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: fontSizeSm, color: textSecondary }}>{v}</span> },
                  {
                    title: 'Tên vùng nước', dataIndex: 'waterZoneName', ellipsis: true,
                    render: (v: string, r: WaterZone) => (
                      <Link to={`/WaterZone/${r.id}`} style={{ color: actionPrimary, fontWeight: fontWeightMedium, textDecoration: 'none' }}>{v}</Link>
                    ),
                  },
                  {
                    title: 'Loại vùng nước', dataIndex: 'loaiVungNuoc', width: 160,
                    render: (v: string) => {
                      const label = VUNGNUOOC_LOAI_MAP[v as keyof typeof VUNGNUOOC_LOAI_MAP]?.label || v;
                      return <Tag style={{ borderRadius: radiusPill }}>{label}</Tag>;
                    },
                  },
                  {
                    title: 'Diện tích', dataIndex: 'area', width: 120,
                    render: (v: number) => v != null
                      ? <span style={{ fontSize: fontSizeSm }}>{v.toLocaleString('vi-VN')} m²</span>
                      : <span style={{ color: textTertiary }}>—</span>,
                  },
                ]}
              />
            )}
            {totalVungNuocs > 5 && (
              <div style={{ textAlign: 'right', marginTop: spaceSm }}>
                <Link to={`/WaterZone?portId=${portId}`} style={{ color: actionPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeSm }}>
                  Xem tất cả {totalVungNuocs} vùng nước →
                </Link>
              </div>
            )}
          </>
        )}
      </SectionGroup>

      <Divider style={dividerStyle} />

      {/* ── Group 6: File đính kèm ───────────────────────────────── */}
      <SectionGroup title="6. File đính kèm">
        {files.length === 0 ? (
          <EmptyState description="Không có tài liệu đính kèm" />
        ) : (
          <Row gutter={[spaceSm, spaceSm]}>
            {files.map((f) => (
              <Col xs={24} sm={12} md={8} lg={6} key={f.id}>
                <Card
                  size="small"
                  style={{
                    border: `0.5px solid ${borderDefault}`,
                    borderRadius: radiusMd,
                  }}
                  styles={{ body: { padding: `${spaceSm}px ${spaceMd}px` } }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size={4}>
                    <Space>
                      <FileOutlined style={{ color: actionPrimary }} />
                      <Typography.Text
                        ellipsis
                        style={{ maxWidth: 160, fontSize: fontSizeSm, color: textPrimary }}
                      >
                        {f.fileName}
                      </Typography.Text>
                    </Space>
                    <Typography.Text style={metaStyle}>
                      {(f.fileSize / 1024).toFixed(1)} KB — {formatDate(f.createdAt)}
                    </Typography.Text>
                    <Button
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => window.open(documentApi.downloadUrl(f.minioKey), '_blank')}
                      style={{ padding: 0, height: 'auto', color: actionPrimary, fontSize: fontSizeSm }}
                    >
                      Tải xuống
                    </Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
        <div style={{ marginTop: spaceSm }}>
          <Button
            icon={<UploadOutlined />}
            size="small"
            onClick={() => navigate(`/document/upload/port/${portId}`)}
            style={{ borderRadius: radiusPill }}
          >
            Upload tài liệu
          </Button>
        </div>
      </SectionGroup>

      <Divider style={dividerStyle} />

      {/* ── Group 7: Ghi chú & Trạng thái & Audit ────────────────── */}
      <SectionGroup title="7. Ghi chú & Trạng thái & Audit">
        <Row gutter={[spaceMd, spaceMd]}>
          {/* Notes */}
          <Col xs={24}>
            <Typography.Text style={labelStyle}>Ghi chú</Typography.Text>
            <div style={{
              background: surfaceCard,
              border: `0.5px solid ${borderDefault}`,
              borderRadius: radiusMd,
              padding: spaceMd,
              minHeight: 60,
              color: textPrimary,
              fontSize: fontSizeMd,
            }}>
              {data.remarks || '—'}
            </div>
          </Col>

          {/* Status badges */}
          <Col xs={24} sm={12}>
            <Typography.Text style={labelStyle}>Trạng thái hoạt động</Typography.Text>
            <div>
              {data.operationalStatus ? (
                <Tag
                  color={trangThaiHoatDongBadge(data.operationalStatus).color}
                  style={{ borderRadius: radiusPill, padding: '2px 12px', fontSize: fontSizeMd }}
                >
                  {trangThaiHoatDongBadge(data.operationalStatus).label}
                </Tag>
              ) : (
                <Typography.Text style={{ color: textTertiary }}>—</Typography.Text>
              )}
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <Typography.Text style={labelStyle}>Trạng thái phê duyệt</Typography.Text>
            <div>
              {data.approvalStatus ? (
                <Tag
                  color={trangThaiPheDuyetBadge(data.approvalStatus).color}
                  style={{ borderRadius: radiusPill, padding: '2px 12px', fontSize: fontSizeMd }}
                >
                  {trangThaiPheDuyetBadge(data.approvalStatus).label}
                </Tag>
              ) : (
                <Typography.Text style={{ color: textTertiary }}>—</Typography.Text>
              )}
            </div>
          </Col>

          {/* Audit */}
          <Col xs={24}>
            <Typography.Text style={{ ...labelStyle, marginTop: spaceSm }}>Thông tin kiểm toán</Typography.Text>
            <Card
              size="small"
              style={{
                border: `0.5px solid ${borderDefault}`,
                borderRadius: radiusMd,
                background: surfaceCard,
              }}
              styles={{ body: { padding: `${spaceSm}px ${spaceMd}px` } }}
            >
              <Row gutter={[spaceMd, spaceSm]}>
                <Col xs={12} md={6}>
                  <Typography.Text style={metaStyle}>Người tạo</Typography.Text>
                  <div style={{ color: textPrimary, fontSize: fontSizeSm }}>{data.createdBy || '—'}</div>
                </Col>
                <Col xs={12} md={6}>
                  <Typography.Text style={metaStyle}>Ngày tạo</Typography.Text>
                  <div style={{ color: textPrimary, fontSize: fontSizeSm }}>{formatDate(data.createdAt)}</div>
                </Col>
                <Col xs={12} md={6}>
                  <Typography.Text style={metaStyle}>Người cập nhật</Typography.Text>
                  <div style={{ color: textPrimary, fontSize: fontSizeSm }}>{data.updatedBy || '—'}</div>
                </Col>
                <Col xs={12} md={6}>
                  <Typography.Text style={metaStyle}>Ngày cập nhật</Typography.Text>
                  <div style={{ color: textPrimary, fontSize: fontSizeSm }}>{formatDate(data.updatedAt)}</div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </SectionGroup>
    </div>
  );
}
