import { useEffect, useState, useCallback } from 'react';
import {
  Card, Button, Space, Tag, Typography, Row, Col, Popconfirm, Table,
  Tabs, Breadcrumb, Spin, Divider, Descriptions, Modal,
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

import { usePermissionStore } from '../../store/permissionStore';
import { organizationService } from '../../services/organizationService';
import { symbolService } from '../symbolService';
import type { Symbol } from '../symbolService';
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
import { colors } from '../../theme';

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
  HIEN_HANH: { color: statusOperational, label: 'Hiện hành' },
  TAM_NGUNG: { color: statusAttention, label: 'Tạm ngừng' },
};

const STATUS_APPROVAL_LABEL: Record<string, { color: string; label: string }> = {
  CHO_PHE_DUYET: { color: statusAttention, label: 'Chờ phê duyệt' },
  DUOC_PHE_DUYET: { color: statusOperational, label: 'Được phê duyệt' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
};

const GIS_OBJECT_TYPE_LABEL: Record<string, string> = {
  POINT: 'Đối tượng điểm',
  LINE: 'Đối tượng đường',
  POLYGON: 'Đối tượng vùng',
};

// ── Styled label helpers ────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontSize: fontSizeMd,
  fontWeight: fontWeightBold,
  marginBottom: 4,
  display: 'block',
};

const valueStyle: React.CSSProperties = {
  color: textPrimary,
  fontSize: fontSizeMd,
  fontWeight: fontWeightNormal,
};

const groupTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontSize: fontSizeLg,
  fontWeight: fontWeightBold,
  marginBottom: spaceMd,
  paddingBottom: spaceSm,
  borderBottom: `1px solid ${borderDefault}`,
  display: 'flex',
  alignItems: 'center',
  gap: spaceSm,
};

// ── Stat card for summary numbers ───────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card
      size="small"
      style={{
        border: `0.5px solid ${borderDefault}`,
        borderRadius: radiusMd,
        transition: 'box-shadow 0.2s',
      }}
      styles={{ body: { padding: `${spaceSm}px ${spaceMd}px` } }}
      hoverable
    >
      <Space size={spaceSm}>
        {icon && <span style={{ color: actionPrimary, fontSize: fontSizeXl }}>{icon}</span>}
        <div>
          <div style={{ color: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightBold }}>{value}</div>
          <div style={{ color: textTertiary, fontSize: fontSizeSm }}>{label}</div>
        </div>
      </Space>
    </Card>
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
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);

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

  // ── Load orgUnits & symbols for name resolution ──────────────────
  useEffect(() => {
    (async () => {
      try { const r = await organizationService.list({ pageSize: 1000 }); setOrgUnits(r.data || []); } catch {}
    })();
    (async () => {
      try { const s = await symbolService.list(); setSymbols(s || []); } catch {}
    })();
  }, []);

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

  const getSymbolName = (sid: string | null) => {
    if (!sid) return '—';
    const s = symbols.find((x: Symbol) => x.id === sid);
    return s ? s.name : sid.substring(0, 8) + '…';
  };
  const isAdmin = hasPermission('admin:manage');

  return (
    <Modal
      title={
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
          Chi tiết cảng biển: {data.portName}
        </span>
      }
      open
      onCancel={() => navigate('/Port')}
      styles={{ body: { paddingTop: 0 } }}
      footer={[
        <Button
          key="close"
          onClick={() => navigate('/Port')}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}
        >
          Đóng
        </Button>,
        canEdit ? (
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/Port/${data.id}/edit`)}
            style={{ background: actionPrimary, borderColor: actionPrimary, borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          >
            Chỉnh sửa
          </Button>
        ) : null,
        canDelete ? (
          <Button
            key="delete"
            danger
            icon={<DeleteOutlined />}
            onClick={async () => {
              try {
                await deleteCangBien(data.id);
                toast.success('Xóa thành công');
                navigate('/Port');
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
              }
            }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          >
            Xóa
          </Button>
        ) : null,
      ].filter(Boolean)}
      width={800}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '8px 0' }}>
        {renderGeneralTab(data, berths, totalBenCangs, waterZones, totalVungNuocs, files, childrenLoading, id!, navigate, getSymbolName, isAdmin)}
      </div>
    </Modal>
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
  getSymbolName: (id: string | null) => string,
  isAdmin: boolean,
) {
  const phanCapLabel = (v: number | null) => {
    if (v == null) return '—';
    if (v === 5) return 'Cấp đặc biệt';
    return `Cấp ${v}`;
  };
  const collapseItems = [
    {
      key: 'general',
      label: '1. Thông tin chung',
      children: (
        <Row gutter={[spaceMd, 0]}>
          <InfoRow
            label="Mã cảng"
            value={<Tag color={colors.primary} style={{ borderRadius: radiusPill, margin: 0 }}>{data.portCode}</Tag>}
          />
          <InfoRow label="Tên cảng" value={data.portName} />
          <InfoRow label="Đơn vị quản lý" value={data.orgUnitName || '—'} />
          <InfoRow label="Nhóm cảng" value={data.portGroup != null ? `Nhóm ${data.portGroup}` : '—'} />
          <InfoRow label="Tỉnh/Thành phố" value={data.province || '—'} />
          <InfoRow label="Địa điểm chi tiết" value={data.detailedLocation || '—'} span={12} />
          <InfoRow label="Phân cấp" value={phanCapLabel(data.portClass)} />
          <InfoRow label="Diện tích (km²)" value={data.area != null ? `${data.area.toLocaleString('vi-VN')}` : '—'} />
          <InfoRow label="KN tiếp nhận (tấn/năm)" value={data.maxVesselCapacity != null ? data.maxVesselCapacity.toLocaleString('vi-VN') : '—'} />
          <InfoRow label="Phạm vi vùng nước" value={data.waterAreaScope || '—'} span={12} />
        </Row>
      ),
    },
    {
      key: 'stats',
      label: '2. Chỉ số tổng hợp',
      children: (
        <>
          <Row gutter={[spaceSm, spaceSm]}>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Bến cảng" value={formatNumber(data.totalBerths)} icon={<ApartmentOutlined />} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Khu neo đậu/chuyển tải" value={formatNumber(data.totalAnchoragesTransshipment)} icon={<AimOutlined />} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Tuyến luồng công cộng" value={formatNumber(data.totalPublicChannels)} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Tuyến luồng chuyên dụng" value={formatNumber(data.totalDedicatedChannels)} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Chiều dài luồng CC" value={formatLength(data.totalPublicChannelLength)} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Chiều dài luồng CD" value={formatLength(data.totalDedicatedChannelLength)} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Phao tiêu/báo hiệu" value={formatNumber(data.totalBuoysBeacons)} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Đê kè" value={formatNumber(data.totalDikes)} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Chiều dài đê kè" value={formatLength(data.totalDikeLength)} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Đèn biển/đăng tiêu" value={formatNumber(data.totalLighthouses)} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Bến phao" value={formatNumber(data.buoyBerthCount)} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Khu neo đậu" value={formatNumber(data.anchorageCount)} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Khu chuyển tải" value={formatNumber(data.transshipmentCount)} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <StatCard label="Các khu nước khác" value={data.otherWaterAreas ? 'Có' : '—'} />
            </Col>
          </Row>
          {data.otherWaterAreas && (
            <Row style={{ marginTop: spaceSm }}>
              <Col span={24}>
                <Typography.Text style={{ color: textSecondary, fontSize: fontSizeSm }}>
                  <InfoCircleOutlined style={{ marginRight: spaceXs }} />
                  {data.otherWaterAreas}
                </Typography.Text>
              </Col>
            </Row>
          )}
        </>
      ),
    },
    {
      key: 'gis',
      label: '3. Thông tin GIS',
      children: (
        <Row gutter={[spaceMd, 0]}>
          <InfoRow
            label="Loại đối tượng"
            value={GIS_OBJECT_TYPE_LABEL[data.geometryType || ''] || data.geometryType || 'Đối tượng điểm'}
          />
          <InfoRow label="Biểu tượng" value={getSymbolName(data.mapSymbolId)} />
          <InfoRow label="Hệ quy chiếu" value={data.coordinateSystem === 1 ? 'WGS-84' : data.coordinateSystem === 2 ? 'VN-2000' : data.coordinateSystem != null ? String(data.coordinateSystem) : '—'} />
          <InfoRow label="Quy tắc hiển thị" value={data.displayRule != null ? String(data.displayRule) : '—'} />
        </Row>
      ),
    },
    {
      key: 'gps',
      label: '4. Tọa độ GPS',
      children: ((data as any).coordinateList && (data as any).coordinateList.length > 0) ? (
        <Table
          dataSource={(data as any).coordinateList}
          rowKey={(r: any, i: number) => `${i}`}
          pagination={false}
          size="small"
          columns={[
            { title: 'STT', width: 60, render: (_: any, __: any, i: number) => i + 1 },
            { title: 'Vĩ độ', dataIndex: 'latitude', render: (v: number) => v?.toFixed(6) },
            { title: 'Kinh độ', dataIndex: 'longitude', render: (v: number) => v?.toFixed(6) },
          ]}
        />
      ) : data.latitude != null && data.longitude != null ? (
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
      ),
    },
    {
      key: 'infra',
      label: '5. Công trình KCHT trực thuộc',
      children: childrenLoading ? (
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
                  render: (v: string) => v || '—',
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
      ),
    },
    {
      key: 'files',
      label: '6. File đính kèm',
      children: (
        <>
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
        </>
      ),
    },
    {
      key: 'notes',
      label: '7. Ghi chú & Trạng thái',
      children: (
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
        </Row>
      ),
    },
  ];

  if (isAdmin) {
    collapseItems.push({
      key: 'audit',
      label: '8. Thông tin kiểm toán',
      children: (
        <Col xs={24}>
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
                <div style={{ color: textPrimary, fontSize: fontSizeSm }}>{data.createdByName || data.createdBy || '—'}</div>
              </Col>
              <Col xs={12} md={6}>
                <Typography.Text style={metaStyle}>Ngày tạo</Typography.Text>
                <div style={{ color: textPrimary, fontSize: fontSizeSm }}>{formatDate(data.createdAt)}</div>
              </Col>
              <Col xs={12} md={6}>
                <Typography.Text style={metaStyle}>Người cập nhật</Typography.Text>
                <div style={{ color: textPrimary, fontSize: fontSizeSm }}>{data.updatedByName || data.updatedBy || '—'}</div>
              </Col>
              <Col xs={12} md={6}>
                <Typography.Text style={metaStyle}>Ngày cập nhật</Typography.Text>
                <div style={{ color: textPrimary, fontSize: fontSizeSm }}>{formatDate(data.updatedAt)}</div>
              </Col>
            </Row>
          </Card>
        </Col>
      ),
    });
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      <Collapse
        defaultActiveKey={['general', 'stats', 'gis', 'gps', 'infra', 'files', 'notes', 'audit']}
        size="small"
        style={{ background: 'transparent' }}
        items={collapseItems}
      />
    </div>
  );
}
