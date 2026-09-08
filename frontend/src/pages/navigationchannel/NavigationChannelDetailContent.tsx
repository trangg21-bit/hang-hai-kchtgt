import { useState, useMemo } from 'react';
import { Tabs, Button, Modal, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BankOutlined,
  SlidersOutlined,
  FileTextOutlined,
  AuditOutlined,
  EnvironmentOutlined,
  FileOutlined,
  DownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  colors,
  DRAWER_TABLE_SCROLL_Y,
  actionPrimary,
  statusOperational,
  statusCritical,
  statusAttention,
  statusDraft,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  surfaceCard,
  radiusPill,
  radiusSm,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceXl,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontWeightMedium,
  fontWeightBold,
  primaryButtonStyle,
} from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { CONDITION_STATUS_MAP } from '../../types/navigationChannel';
import type {
  NavigationChannelResponse,
  ChannelRouteDetailResponse,
  NavigationChannelCoordinateResponse,
  NavigationChannelAttachment,
} from '../../types/navigationChannel';
import { getProvinceNameById } from '../../types/common';

// ── Màu pill cho Tình trạng hoạt động (#8) — đồng bộ NavigationChannelList ──
const CONDITION_COLOR_MAP: Record<string, string> = {
  OPERATIONAL: statusOperational,
  STOPPED: statusCritical,
  MAINTENANCE: statusAttention,
  UNDER_CONSTRUCTION: statusDraft,
};

const ROUTE_TYPE_MAP: Record<number, string> = { 1: 'Công cộng', 2: 'Chuyên dùng' };

const GEOMETRY_TYPE_MAP: Record<string, string> = {
  POINT: 'Điểm',
  LINE: 'Đường',
  POLYGON: 'Vùng',
};

const ddToDms = (dd: number): { d: number; m: number; s: number } => {
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Number(((mFloat - m) * 60).toFixed(2));
  return { d, m, s };
};

const fmtDms = (dd?: number | null): string => {
  if (dd === null || dd === undefined || Number.isNaN(dd)) return '—';
  const { d, m, s } = ddToDms(dd);
  return `${d}° ${m}' ${s}"`;
};

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—');
const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
const fmtMonthYear = (v?: string | null): string => (v ? dayjs(v).format('MM/YYYY') : '—');
const fmtNum = (v?: number | null, unit?: string): string =>
  v === null || v === undefined || Number.isNaN(v) ? '—' : `${v}${unit ? ` ${unit}` : ''}`;

type AttachmentRow = NavigationChannelAttachment & { uploadedBy?: string; uploadedAt?: string };

interface NavigationChannelDetailContentProps {
  record: NavigationChannelResponse;
  userMap?: Map<string, string>;
}

/** Pill badge cho tình trạng hoạt động — chuẩn Pill Badge (cấm antd Tag). */
const ConditionPill = ({ status }: { status?: string | null }) => {
  const s = status || '';
  const color = CONDITION_COLOR_MAP[s] || textTertiary;
  const label = CONDITION_STATUS_MAP[s as keyof typeof CONDITION_STATUS_MAP] || s || '—';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        background: `${color}15`,
        border: `1px solid ${color}40`,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

/** Một ô nhãn + giá trị trong lưới 2 cột. */
const InfoField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: spaceSm, minWidth: 0, alignItems: 'baseline' }}>
    <span style={{ color: textSecondary, fontSize: fontSizeSm, fontWeight: fontWeightMedium, flexShrink: 0, minWidth: 150 }}>
      {label}
    </span>
    <span style={{ color: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightMedium, wordBreak: 'break-word', minWidth: 0 }}>
      {value}
    </span>
  </div>
);

/** Section accordion — tiêu đề có toggle mở/gập. */
const Section = ({
  icon,
  title,
  defaultOpen = true,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: surfaceCard,
        border: `1px solid ${borderDefault}`,
        borderRadius: radiusSm,
        marginBottom: spaceMd,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: spaceSm,
          padding: `${spaceSm}px ${spaceMd}px`,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {icon}
        <span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeMd, flex: 1, textAlign: 'left' }}>
          {title}
        </span>
        {badge}
        {open ? (
          <DownOutlined style={{ color: textTertiary, fontSize: fontSizeSm, transform: 'rotate(180deg)' }} />
        ) : (
          <DownOutlined style={{ color: textTertiary, fontSize: fontSizeSm }} />
        )}
      </button>
      {open && <div style={{ padding: `0 ${spaceMd}px ${spaceMd}px ${spaceMd}px` }}>{children}</div>}
    </div>
  );
};

/** Lưới 2 cột thông tin. */
const InfoGrid = ({ rows }: { rows: Array<{ label: string; value: React.ReactNode }> }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: `${spaceMd}px ${spaceXl}px`,
    }}
  >
    {rows.map((r) => (
      <InfoField key={r.label} label={r.label} value={r.value} />
    ))}
  </div>
);

export default function NavigationChannelDetailContent({
  record,
  userMap,
}: NavigationChannelDetailContentProps) {
  const [gisOpen, setGisOpen] = useState(false);

  const coordinates = useMemo(
    () =>
      (Array.isArray(record?.coordinates) ? record.coordinates : []).map((c) => ({
        id: c.id,
        sequenceNo: c.sequenceNo,
        longitude: Number(c.longitude),
        latitude: Number(c.latitude),
      })),
    [record],
  );

  const routeDetails = useMemo(
    () => (Array.isArray(record?.routeDetails) ? record.routeDetails : []),
    [record],
  );

  const attachments = useMemo<AttachmentRow[]>(
    () => (Array.isArray(record?.attachments) ? record.attachments as AttachmentRow[] : []),
    [record],
  );

  const gisView = useMemo(() => {
    const pts = coordinates.filter((c) => !Number.isNaN(c.longitude) && !Number.isNaN(c.latitude));
    if (pts.length === 0) return { geometryType: 'POINT', coordinates: '' };
    if (pts.length === 1)
      return { geometryType: 'POINT', coordinates: `POINT(${pts[0].longitude} ${pts[0].latitude})` };
    return {
      geometryType: 'LINE',
      coordinates: `LINESTRING(${pts.map((p) => `${p.longitude} ${p.latitude}`).join(', ')})`,
    };
  }, [coordinates]);

  const actorName = (id?: string | null): string => {
    if (!id) return '—';
    return userMap?.get(id) || id;
  };

  const provinceName = record.provinceId !== undefined && record.provinceId !== null
    ? getProvinceNameById(record.provinceId)
    : undefined;

  // ── Tab 1: Thông tin chung ─────────────────────────────────────────
  const basicRows = [
    { label: 'Mã luồng hàng hải', value: record.channelCode || '—' },
    { label: 'Tên luồng hàng hải', value: record.channelName || '—' },
    { label: 'Đơn vị quản lý', value: record.orgUnitName || '—' },
    { label: 'Thuộc cảng biển', value: record.seaportName || '—' },
    { label: 'Địa điểm (Tỉnh/TP)', value: provinceName || '—' },
    { label: 'Địa điểm chi tiết', value: record.detailedLocation || '—' },
    { label: 'Tình trạng', value: <ConditionPill status={record.conditionStatus} /> },
    { label: 'Trạm quản lý luồng', value: record.managementStation || '—' },
    { label: 'Số lượng trạm', value: fmtNum(record.stationCount) },
    { label: 'Số lượng nhân sự tại trạm', value: fmtNum(record.stationStaffCount) },
    { label: 'Diện tích trạm (m²)', value: fmtNum(record.stationAreaSquareMeters) },
    { label: 'Số lượng phao', value: fmtNum(record.buoyCount) },
    { label: 'Số lượng tiêu', value: fmtNum(record.beaconCount) },
    { label: 'Ghi chú', value: record.notes || '—' },
  ];

  const technicalRows = [
    { label: 'Hệ quy chiếu', value: record.coordinateReferenceSystem || '—' },
    {
      label: 'Loại đối tượng GIS',
      value: GEOMETRY_TYPE_MAP[record.geometryType || ''] || record.geometryType || '—',
    },
    { label: 'Quy tắc hiển thị', value: record.displayRule || '—' },
    { label: 'Phạm vi bảo vệ luồng (m)', value: fmtNum(record.protectionScopeMeters) },
    { label: 'Ghi chú phạm vi bảo vệ', value: record.protectionNotes || '—' },
    { label: 'Sửa chữa trạm gần nhất', value: fmtMonthYear(record.latestStationRepairMonth) },
    { label: 'Năm bảo trì gần nhất', value: fmtNum(record.latestMaintenanceYear) },
    { label: 'KL nạo vét (m³)', value: fmtNum(record.latestDredgingVolumeCubicMeters) },
  ];

  const announcementRows = [
    { label: 'Số quyết định công bố', value: record.announcementDecisionNumber || '—' },
    { label: 'Ngày ra quyết định', value: fmtDate(record.announcementDecisionDate) },
    { label: 'Đơn vị ra quyết định', value: record.announcementDecisionIssuer || '—' },
  ];

  const approvalRows = [
    { label: 'Trạng thái phê duyệt', value: record.approvalStatus ? <ApprovalStatusBadge status={record.approvalStatus} /> : '—' },
    { label: 'Cán bộ gửi phê duyệt', value: actorName(record.submittedBy) },
    { label: 'Thời gian gửi phê duyệt', value: fmtDateTime(record.submittedAt) },
    { label: 'Cán bộ cập nhật cuối', value: actorName(record.updatedBy) },
    { label: 'Thời gian cập nhật', value: fmtDateTime(record.updatedAt) },
    { label: 'Cán bộ tạo', value: actorName(record.createdBy) },
    { label: 'Thời gian tạo', value: fmtDateTime(record.createdAt) },
  ];

  // ── Tab 2: Thông tin vị trí ────────────────────────────────────────
  const coordinateColumns: ColumnsType<NavigationChannelCoordinateResponse> = [
    {
      title: 'STT',
      dataIndex: 'sequenceNo',
      width: 60,
      align: 'center',
      render: (_: unknown, __: unknown, i: number) => i + 1,
    },
    {
      title: 'Kinh độ DMS',
      dataIndex: 'longitude',
      width: 240,
      render: (v: number) => <span style={{ color: textPrimary }}>{fmtDms(v)}</span>,
    },
    {
      title: 'Vĩ độ DMS',
      dataIndex: 'latitude',
      width: 240,
      render: (v: number) => <span style={{ color: textPrimary }}>{fmtDms(v)}</span>,
    },
    {
      title: 'Độ thập phân',
      dataIndex: 'decimal',
      width: 180,
      render: (_: unknown, rec: NavigationChannelCoordinateResponse) => (
        <span style={{ color: textSecondary, fontSize: fontSizeSm }}>
          {rec.longitude}, {rec.latitude}
        </span>
      ),
    },
  ];

  // ── Tab 3: File đính kèm ───────────────────────────────────────────
  const attachmentColumns: ColumnsType<AttachmentRow> = [
    {
      title: 'STT',
      dataIndex: 'idx',
      width: 50,
      align: 'center',
      render: (_: unknown, __: unknown, i: number) => i + 1,
    },
    {
      title: 'Tên tài liệu',
      dataIndex: 'fileName',
      width: 320,
      render: (name: string) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: spaceXs, maxWidth: '100%' }}>
          <FileOutlined style={{ color: actionPrimary }} />
          <Tooltip title={name}>
            <span style={{ color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          </Tooltip>
        </span>
      ),
    },
    {
      title: 'Dung lượng',
      dataIndex: 'fileSize',
      width: 110,
      render: (size?: number) => {
        if (!size) return '—';
        return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(size / 1024)} KB`;
      },
    },
    {
      title: 'Người tải lên',
      dataIndex: 'uploadedBy',
      width: 150,
      render: (id?: string) => actorName(id),
    },
    {
      title: 'Ngày tải lên',
      dataIndex: 'uploadedAt',
      width: 170,
      render: (v?: string) => fmtDateTime(v),
    },
  ];

  // ── Tab 4: Tuyến luồng ─────────────────────────────────────────────
  const routeColumns: ColumnsType<ChannelRouteDetailResponse> = [
    { title: 'STT', dataIndex: 'sequenceNo', width: 50, align: 'center' },
    { title: 'Phân loại tuyến', dataIndex: 'routeClassification', width: 140, render: (v?: string) => v || '—' },
    {
      title: 'Mã tuyến',
      dataIndex: 'routeCode',
      width: 120,
      render: (v?: string) => <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>{v || '—'}</span>,
    },
    {
      title: 'Tên tuyến luồng',
      dataIndex: 'routeName',
      width: 200,
      render: (v?: string) => <span style={{ color: textPrimary, fontWeight: fontWeightBold }}>{v || '—'}</span>,
    },
    {
      title: 'Loại tuyến',
      dataIndex: 'routeType',
      width: 120,
      render: (v?: number) => (v === undefined || v === null ? '—' : ROUTE_TYPE_MAP[v] || '—'),
    },
    { title: 'Cấp luồng', dataIndex: 'routeGrade', width: 100, render: (v?: number) => (v === undefined || v === null ? '—' : String(v)) },
    {
      title: 'Chiều dài (km)',
      dataIndex: 'channelLengthKilometers',
      width: 110,
      align: 'right',
      render: (v?: number) => fmtNum(v),
    },
    {
      title: 'Độ sâu thiết kế (m)',
      dataIndex: 'designDepthMeters',
      width: 130,
      align: 'right',
      render: (v?: number) => fmtNum(v),
    },
    {
      title: 'Độ sâu hiện trạng (m)',
      dataIndex: 'currentDepthMeters',
      width: 130,
      align: 'right',
      render: (v?: number) => fmtNum(v),
    },
    {
      title: 'Bề rộng thiết kế (m)',
      dataIndex: 'maximumDesignWidthMeters',
      width: 140,
      align: 'right',
      render: (_: unknown, rec: ChannelRouteDetailResponse) =>
        rec.maximumDesignWidthMeters !== undefined && rec.minimumDesignWidthMeters !== undefined
          ? `${rec.minimumDesignWidthMeters}–${rec.maximumDesignWidthMeters}`
          : fmtNum(rec.maximumDesignWidthMeters ?? rec.minimumDesignWidthMeters),
    },
    {
      title: 'Bán kính cong nhỏ nhất (m)',
      dataIndex: 'minimumCurveRadiusMeters',
      width: 160,
      align: 'right',
      render: (v?: number) => fmtNum(v),
    },
    {
      title: 'Vị trí vũng quay tàu',
      dataIndex: 'turningBasinLocation',
      width: 160,
      render: (v?: string) => v || '—',
    },
    {
      title: 'Bán kính vũng quay (m)',
      dataIndex: 'turningBasinRadiusMeters',
      width: 140,
      align: 'right',
      render: (v?: number) => fmtNum(v),
    },
  ];

  // ── Tab 5: Vận hành & bảo trì ──────────────────────────────────────
  const hasOperation =
    record.operationPlanCode || record.operationPlanName || record.operationStartDate || record.operationEndDate;
  const hasMaintenance =
    record.maintenancePlanCode || record.maintenancePlanName || record.maintenanceStartTime || record.maintenanceEndTime;
  const hasIncident = record.incidentCode || record.incidentType || record.incidentLocation || record.incidentTime;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs
        defaultActiveKey="general"
        items={[
          {
            key: 'general',
            label: 'Thông tin chung',
            children: (
              <div style={{ overflowY: 'auto', maxHeight: DRAWER_TABLE_SCROLL_Y.detailView, paddingRight: spaceXs }}>
                <Section icon={<BankOutlined style={{ color: actionPrimary }} />} title="Thông tin cơ bản & Quản lý vận hành">
                  <InfoGrid rows={basicRows} />
                </Section>
                <Section icon={<SlidersOutlined style={{ color: actionPrimary }} />} title="Thông số kỹ thuật & Khai thác">
                  <InfoGrid rows={technicalRows} />
                </Section>
                <Section
                  icon={<FileTextOutlined style={{ color: actionPrimary }} />}
                  title="Thông tin công bố mở, đưa vào sử dụng"
                >
                  <InfoGrid rows={announcementRows} />
                </Section>
                <Section
                  icon={<AuditOutlined style={{ color: actionPrimary }} />}
                  title="Thông tin phê duyệt"
                  defaultOpen={false}
                  badge={
                    record.approvalStatus ? (
                      <ApprovalStatusBadge status={record.approvalStatus} size="small" />
                    ) : undefined
                  }
                >
                  <InfoGrid rows={approvalRows} />
                </Section>
              </div>
            ),
          },
          {
            key: 'location',
            label: 'Thông tin vị trí',
            children: (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spaceSm }}>
                  <Button
                    icon={<EnvironmentOutlined />}
                    onClick={() => setGisOpen(true)}
                    disabled={coordinates.length === 0}
                    style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 32 }}
                  >
                    Xem vị trí trên bản đồ
                  </Button>
                </div>
                <DetailTable
                  scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
                  dataSource={coordinates}
                  rowKey={(r) => String(r.id ?? r.sequenceNo ?? `${r.longitude}-${r.latitude}`)}
                  columns={coordinateColumns}
                  emptyText="Chưa có tọa độ GIS"
                />
              </div>
            ),
          },
          {
            key: 'files',
            label: `File đính kèm (${attachments.length})`,
            children: (
              <DetailTable
                scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
                dataSource={attachments}
                rowKey={(r) => String(r.id ?? r.fileName)}
                columns={attachmentColumns}
                emptyText="Chưa có tài liệu đính kèm"
              />
            ),
          },
          {
            key: 'routes',
            label: 'Tuyến luồng',
            children: (
              <DetailTable
                scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
                dataSource={routeDetails}
                rowKey={(r) => String(r.id ?? r.sequenceNo)}
                columns={routeColumns}
                emptyText="Chưa có phân đoạn tuyến luồng"
              />
            ),
          },
          {
            key: 'operation',
            label: 'Vận hành & bảo trì',
            children: (
              <div style={{ overflowY: 'auto', maxHeight: DRAWER_TABLE_SCROLL_Y.detailView, paddingRight: spaceXs }}>
                <Section icon={<SlidersOutlined style={{ color: actionPrimary }} />} title="Thông tin vận hành khai thác">
                  {hasOperation ? (
                    <InfoGrid
                      rows={[
                        { label: 'Mã kế hoạch vận hành', value: record.operationPlanCode || '—' },
                        { label: 'Tên kế hoạch vận hành', value: record.operationPlanName || '—' },
                        { label: 'Ngày bắt đầu', value: fmtDate(record.operationStartDate) },
                        { label: 'Ngày kết thúc', value: fmtDate(record.operationEndDate) },
                      ]}
                    />
                  ) : (
                    <div style={{ color: textTertiary, fontSize: fontSizeMd, padding: `${spaceMd}px 0` }}>Chưa có dữ liệu vận hành khai thác</div>
                  )}
                </Section>
                <Section icon={<BankOutlined style={{ color: actionPrimary }} />} title="Thông tin bảo trì & nạo vét">
                  {hasMaintenance ? (
                    <InfoGrid
                      rows={[
                        { label: 'Mã kế hoạch bảo trì', value: record.maintenancePlanCode || '—' },
                        { label: 'Tên kế hoạch bảo trì', value: record.maintenancePlanName || '—' },
                        { label: 'Năm bảo trì gần nhất', value: fmtNum(record.latestMaintenanceYear) },
                        { label: 'KL nạo vét (m³)', value: fmtNum(record.latestDredgingVolumeCubicMeters, 'm³') },
                        { label: 'Thời gian bắt đầu', value: fmtDateTime(record.maintenanceStartTime) },
                        { label: 'Thời gian kết thúc', value: fmtDateTime(record.maintenanceEndTime) },
                      ]}
                    />
                  ) : (
                    <div style={{ color: textTertiary, fontSize: fontSizeMd, padding: `${spaceMd}px 0` }}>Chưa có dữ liệu bảo trì & nạo vét</div>
                  )}
                </Section>
                <Section icon={<AuditOutlined style={{ color: actionPrimary }} />} title="Lịch sử sự cố & cảnh báo">
                  {hasIncident ? (
                    <InfoGrid
                      rows={[
                        { label: 'Mã sự cố', value: record.incidentCode || '—' },
                        { label: 'Loại sự cố', value: record.incidentType || '—' },
                        { label: 'Vị trí sự cố', value: record.incidentLocation || '—' },
                        { label: 'Thời gian sự cố', value: fmtDateTime(record.incidentTime) },
                      ]}
                    />
                  ) : (
                    <div style={{ color: textTertiary, fontSize: fontSizeMd, padding: `${spaceMd}px 0` }}>Chưa có sự cố nào được ghi nhận</div>
                  )}
                </Section>
              </div>
            ),
          },
        ]}
        style={{ flex: 1, minHeight: 0 }}
        tabBarStyle={{ position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      />

      {/* ── Bản đồ GIS xem vị trí (read-only) ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: spaceSm }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              Xem vị trí trên bản đồ chuyên dụng
            </span>
          </div>
        }
        open={gisOpen}
        onCancel={() => setGisOpen(false)}
        destroyOnClose
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button key="close" type="primary" onClick={() => setGisOpen(false)} style={{ ...primaryButtonStyle }}>
            Đóng
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline
            defaultGeometryType={(gisView.geometryType as 'POINT' | 'LINE' | 'POLYGON') || 'POINT'}
            disabled
            height={520}
            value={{ geometryType: gisView.geometryType as 'POINT' | 'LINE' | 'POLYGON', coordinates: gisView.coordinates }}
          />
        </div>
      </Modal>
    </div>
  );
}
