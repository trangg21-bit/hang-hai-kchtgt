import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, Button, Modal, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BankOutlined,
  SlidersOutlined,
  FileTextOutlined,
  AuditOutlined,
  EnvironmentOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  colors,
  DRAWER_TABLE_SCROLL_Y,
  actionPrimary,
  statusOperational,
  statusCritical,
  statusAttention,
  textPrimary,
  textTertiary,
  surfaceCard,
  fontSizeMd,
  fontWeightBold,
  outlineButtonStyle,
  statusBadgeStyle,
} from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import InfrastructureAttachmentTab, { triggerBlobDownload } from '../../components/shared/InfrastructureAttachmentTab';
import type { InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import { CONDITION_STATUS_MAP } from '../../types/navigationChannel';
import type {
  NavigationChannelResponse,
  ChannelRouteDetailResponse,
} from '../../types/navigationChannel';
import { getProvinceNameById } from '../../types/common';
import { userService } from '../../services/userService';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import { symbolService } from '../../services/symbolService';
import { parseWktToCoordinates } from '../../utils/gisGeometry';
import { DEFAULT_CHANNEL_GIS_SYMBOLS } from './NavigationChannelForm';
import toast from '../../components/ToastNotification';

// Cache tên cán bộ theo id ở mức module (như UserResolver) — tránh gọi lại /users/{id}
// mỗi lần mở drawer cho cùng một cán bộ.
const actorNameCache: Record<string, string> = {};

// ── Types ──────────────────────────────────────────────────────────────────

interface CoordinateItem {
  id?: string;
  sequenceNo?: number;
  longitude: number;
  latitude: number;
}

interface OperationPlanItem {
  id?: string;
  planCode?: string;
  code?: string;
  planName?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  start?: string;
  end?: string;
}

interface IncidentItem {
  id?: string;
  incidentCode?: string;
  code?: string;
  incidentType?: string;
  type?: string;
  location?: string;
  incidentLocation?: string;
  incidentTime?: string;
  time?: string;
}

// ── Mapping & Helper Functions ─────────────────────────────────────────────

const CONDITION_COLOR_MAP: Record<string, string> = {
  OPERATIONAL: statusOperational,
  NOT_YET_OPERATIONAL: statusAttention,
  SUSPENDED: statusCritical,
  STOPPED: statusCritical,
  MAINTENANCE: statusAttention,
  UNDER_CONSTRUCTION: statusAttention,
};

const ROUTE_TYPE_MAP: Record<number, string> = { 1: 'Công cộng', 2: 'Chuyên dùng' };

const GEOMETRY_TYPE_MAP: Record<string, string> = {
  POINT: 'Đối tượng điểm',
  LINE: 'Đối tượng đường',
  POLYGON: 'Đối tượng vùng',
};

const COORD_SYS_MAP: Record<number | string, string> = {
  1: 'WGS-84',
  2: 'VN-2000',
  'WGS-84': 'WGS-84',
  'VN-2000': 'VN-2000',
};

const ddToDms = (dd: number): { d: number; m: number; s: number } => {
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Number(((mFloat - m) * 60).toFixed(2));
  return { d, m, s };
};

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const d = dayjs(dateStr);
    return d.isValid() ? d.format('DD/MM/YYYY HH:mm:ss') : dateStr;
  } catch {
    return dateStr;
  }
}

function formatDateOnly(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const d = dayjs(dateStr);
    return d.isValid() ? d.format('DD/MM/YYYY') : dateStr;
  } catch {
    return dateStr;
  }
}

function formatMonthYear(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const d = dayjs(dateStr);
    return d.isValid() ? d.format('MM/YYYY') : dateStr;
  } catch {
    return dateStr;
  }
}

function formatOperationTableDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = dayjs(dateStr);
    return d.isValid() ? d.format('DD/MM/YYYY HH:mm:ss') : '';
  } catch {
    return '';
  }
}

const formatNumber = (v: number | string | null | undefined): string | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 6 });
};

/** Pill badge cho tình trạng hoạt động — chuẩn Pill Badge */
const ConditionPill = ({ status }: { status?: string | number | null }) => {
  if (status === null || status === undefined || status === '') return null;
  const key = String(status);
  const color = CONDITION_COLOR_MAP[key] || textTertiary;
  const label = CONDITION_STATUS_MAP[key as keyof typeof CONDITION_STATUS_MAP] || key;
  return <span style={statusBadgeStyle(color)}>{label}</span>;
};

// ── Types & Styles — Chuẩn màn /beacon-stations & /berth ─────────────────────

type DetailRow = { label: string; value: React.ReactNode; span?: boolean };

const detailSectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '12px 18px 8px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const detailSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
  cursor: 'pointer',
  userSelect: 'none',
};

const detailSectionTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: 14,
};

const berthOperationBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const tabBarStyle: React.CSSProperties = {
  marginBottom: 0,
  paddingTop: 0,
  position: 'sticky',
  top: 0,
  zIndex: 1,
  background: surfaceCard,
};

const renderDetailRowsTwoCol = (rows: DetailRow[]) => {
  let colIndex = 0;
  return (
    <div className="chk-detail-grid" style={{ paddingTop: 4 }}>
      {rows.map((row) => {
        let labelCls: string;
        if (row.span) {
          labelCls = 'sec-full-label';
          colIndex = 0;
        } else {
          labelCls = colIndex % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label';
          colIndex += 1;
        }
        return (
          <div key={row.label} className={row.span ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
            <span className={`chk-detail-label ${labelCls}`}>{row.label}</span>
            <span className="chk-detail-value">{row.value}</span>
          </div>
        );
      })}
    </div>
  );
};

const renderDetailSectionCard = (opts: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  matchBerthOperationStyle?: boolean;
}) => {
  const matchBerthOperationStyle = opts.matchBerthOperationStyle === true;
  const boxStyle = matchBerthOperationStyle
    ? { ...detailSectionBoxStyle, ...berthOperationBoxStyle }
    : detailSectionBoxStyle;
  const cardPadding = opts.open
    ? matchBerthOperationStyle
      ? '12px 18px 12px 18px'
      : '14px 18px'
    : '10px 18px';
  const openHeaderMarginBottom = matchBerthOperationStyle ? 12 : 8;
  return (
    <div style={{ ...boxStyle, padding: cardPadding }}>
      <div
        onClick={opts.onToggle}
        style={{
          ...detailSectionHeaderStyle,
          borderBottom: opts.open ? '1px solid #f1f5f9' : 'none',
          paddingBottom: opts.open ? 8 : 0,
          marginBottom: opts.open ? openHeaderMarginBottom : 0,
        }}
      >
        <div style={detailSectionTitleStyle}>
          {opts.icon}
          <span>{opts.title}</span>
        </div>
        <span style={{ color: actionPrimary, fontSize: 12 }}>
          {opts.open ? <DownOutlined /> : <RightOutlined />}
        </span>
      </div>
      {opts.open ? <div>{opts.children}</div> : null}
    </div>
  );
};

// ── Props ──────────────────────────────────────────────────────────────────

export interface NavigationChannelDetailContentProps {
  record: NavigationChannelResponse;
  userMap?: Map<string, string>;
  orgMap?: Map<string, string>;
  seaportMap?: Map<string, string>;
  seaportOptions?: { id: string; portCode?: string; portName?: string }[];
  symbols?: any[];
  defaultTabKey?: string;
  onClose?: () => void;
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function NavigationChannelDetailContent({
  record,
  userMap,
  orgMap,
  seaportMap,
  seaportOptions,
  symbols,
  defaultTabKey,
}: NavigationChannelDetailContentProps) {
  const r = record;
  const rawRecord = r as Record<string, unknown>;
  const [activeTabKey, setActiveTabKey] = useState(defaultTabKey || 'general');
  const [detailTechOpen, setDetailTechOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [routesOpen, setRoutesOpen] = useState(true);
  const [opsOperationOpen, setOpsOperationOpen] = useState(true);
  const [opsMaintenanceOpen, setOpsMaintenanceOpen] = useState(true);
  const [opsIncidentOpen, setOpsIncidentOpen] = useState(true);
  const [gisModalOpen, setGisModalOpen] = useState(false);

  const coordinates = useMemo<CoordinateItem[]>(() => {
    let rawList: any[] = [];
    if (Array.isArray((r as any).coordinateList) && (r as any).coordinateList.length > 0) {
      rawList = (r as any).coordinateList;
    } else if (Array.isArray(r.coordinates) && r.coordinates.length > 0) {
      rawList = r.coordinates;
    } else if (typeof r.coordinates === 'string' && r.coordinates.trim()) {
      rawList = parseWktToCoordinates(r.coordinates);
    }
    return rawList.map((c, idx) => ({
      id: c.id || String(idx + 1),
      sequenceNo: c.sequenceNo ?? (idx + 1),
      longitude: Number(c.longitude),
      latitude: Number(c.latitude),
    }));
  }, [r.coordinates, (r as any).coordinateList]);

  const routeDetails = useMemo(
    () => (Array.isArray(r.routeDetails) ? r.routeDetails : []),
    [r.routeDetails],
  );

  const detailFiles = useMemo<InfrastructureAttachmentItem[]>(() => {
    const list = Array.isArray(r.attachments) ? r.attachments : [];
    return list.map((a, idx) => ({
      id: a.id || String(idx),
      fileName: a.fileName || `Tệp ${idx + 1}`,
      fileSize: a.fileSize,
      uploadedBy: a.uploadedBy,
      uploadedAt: a.uploadedAt,
      filePath: a.filePath,
      url: (a as Record<string, unknown>).fileUrl as string | undefined || a.filePath,
    }));
  }, [r.attachments]);

  const gisView = useMemo(() => {
    const pts = coordinates.filter((c) => !Number.isNaN(c.longitude) && !Number.isNaN(c.latitude));
    if (pts.length === 0) {
      if (typeof r.coordinates === 'string' && r.coordinates.trim()) {
        const geom =
          r.geometryType ||
          (r.coordinates.toUpperCase().startsWith('LINE')
            ? 'LINE'
            : r.coordinates.toUpperCase().startsWith('POLY')
              ? 'POLYGON'
              : 'POINT');
        return { geometryType: geom, coordinates: r.coordinates };
      }
      return { geometryType: 'POINT', coordinates: '' };
    }
    if (pts.length === 1)
      return { geometryType: 'POINT', coordinates: `POINT(${pts[0].longitude} ${pts[0].latitude})` };
    return {
      geometryType: 'LINE',
      coordinates: `LINESTRING(${pts.map((p) => `${p.longitude} ${p.latitude}`).join(', ')})`,
    };
  }, [coordinates, r.coordinates, r.geometryType]);

  // Biểu tượng GIS — mirror /vts-operation-center
  const [localSymbols, setLocalSymbols] = useState<any[]>([]);
  const symId = r.mapIconId || (r as any).mapSymbolId || (r as any).symbolId || '';

  useEffect(() => {
    let isMounted = true;
    if (symbols && symbols.length > 0) {
      setLocalSymbols(symbols);
    } else {
      symbolService
        .getAll()
        .then((items) => {
          if (isMounted) setLocalSymbols(items && items.length > 0 ? items : DEFAULT_CHANNEL_GIS_SYMBOLS);
        })
        .catch(() => {
          if (isMounted) setLocalSymbols(DEFAULT_CHANNEL_GIS_SYMBOLS);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [symbols]);

  // Tự động tải biểu tượng nếu chưa có trong danh mục (chuẩn /vts-operation-center)
  useEffect(() => {
    if (!symId) return;
    const exists = localSymbols.some((s) => String(s.id) === String(symId) || String(s.code) === String(symId));
    if (!exists) {
      const fallbackName = (r as any).symbolName;
      const fallbackCode = (r as any).symbolCode;
      const fallbackImage = (r as any).symbolImage;
      if (fallbackName) {
        setLocalSymbols((prev) => [...prev, { id: String(symId), name: fallbackName, code: fallbackCode, image: fallbackImage }]);
      } else {
        symbolService
          .getById(String(symId))
          .then((s) => {
            if (s) {
              setLocalSymbols((prev) => {
                if (prev.some((item) => String(item.id) === String(s.id))) return prev;
                return [...prev, s];
              });
            }
          })
          .catch(() => {
            setLocalSymbols((prev) => {
              if (prev.some((item) => String(item.id) === String(symId))) return prev;
              return [...prev, { id: String(symId), name: 'Biểu tượng luồng hàng hải', code: 'CHANNEL', image: '' }];
            });
          });
      }
    }
  }, [symId, localSymbols, r]);

  const allSymbols = useMemo(() => {
    const combined = [...(symbols || []), ...localSymbols, ...DEFAULT_CHANNEL_GIS_SYMBOLS];
    const map = new Map<string, any>();
    combined.forEach((s) => {
      if (s?.id && !map.has(String(s.id))) map.set(String(s.id), s);
      if (s?.code && !map.has(String(s.code))) map.set(String(s.code), s);
    });
    return Array.from(map.values());
  }, [symbols, localSymbols]);

  const matchedSymbol = useMemo(() => {
    if (!symId) return null;
    return allSymbols.find((s) => String(s.id) === String(symId) || String(s.code) === String(symId)) || null;
  }, [symId, allSymbols]);

  const symbolNode = useMemo(() => {
    if (!symId) return null;
    const symName = matchedSymbol?.name || (r as any).symbolName || matchedSymbol?.code || (r as any).symbolCode || 'Luồng hàng hải';
    const rawImg = matchedSymbol?.image || (r as any).symbolImage;
    const symImg = rawImg
      ? rawImg.startsWith('data:') || rawImg.startsWith('http') || rawImg.startsWith('/')
        ? rawImg
        : `data:image/png;base64,${rawImg}`
      : undefined;

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {symImg ? (
          <img
            src={symImg}
            alt=""
            style={{ width: 20, height: 20, objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}
        <span style={{ color: textPrimary, fontWeight: 500 }}>{symName}</span>
      </span>
    );
  }, [symId, matchedSymbol, r]);

  // userMap (prop) chỉ chứa tối đa 100 tài khoản mới nhất — UserController.list cap
  // size bằng MAX_PAGE_SIZE = 100 — nên cán bộ gửi phê duyệt / cấp duyệt cũ hơn bị
  // thiếu và trước đây UI rơi về hiển thị chính UUID. Tra bổ sung qua /users/{id}.
  const [resolvedActorNames, setResolvedActorNames] = useState<Record<string, string>>({});

  const pendingActorIds = useMemo(
    () =>
      [r.submittedBy, r.approverLevel1 || r.level1ApprovedBy, r.approverLevel2 || r.level2ApprovedBy, r.updatedBy, r.createdBy]
        .filter((id): id is string => !!id && !userMap?.has(id) && !actorNameCache[id]),
    [r.submittedBy, r.approverLevel1, r.level1ApprovedBy, r.approverLevel2, r.level2ApprovedBy, r.updatedBy, r.createdBy, userMap],
  );

  useEffect(() => {
    if (pendingActorIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const found = await Promise.all(
        pendingActorIds.map(async (id) => {
          try {
            const res = await userService.getById(id);
            const name = res.data?.fullName || res.data?.username;
            return name ? ([id, name] as const) : null;
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      const patch: Record<string, string> = {};
      found.forEach((entry) => {
        if (entry) {
          actorNameCache[entry[0]] = entry[1];
          patch[entry[0]] = entry[1];
        }
      });
      if (Object.keys(patch).length > 0) setResolvedActorNames((prev) => ({ ...prev, ...patch }));
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingActorIds]);

  const actorName = (id?: string | null): string => {
    if (!id) return '';
    return userMap?.get(id) || resolvedActorNames[id] || actorNameCache[id] || id || '';
  };

  const unitName = r.orgUnitName || (r.orgUnitId ? orgMap?.get(r.orgUnitId) : null) || null;
  // Đơn vị vận hành không còn tồn tại trong danh mục đơn vị → null (trống), KHÔNG rơi về UUID thô của CSDL
  const opUnitName =
    r.operatingUnitName || (r.operatingUnitId ? orgMap?.get(r.operatingUnitId) : null) || null;
  const portName =
    r.seaportName ||
    (r.seaportId
      ? seaportOptions?.find((p) => p.id === r.seaportId)?.portName || seaportMap?.get(r.seaportId)
      : null) ||
    null;
  const provinceName =
    r.provinceId !== undefined && r.provinceId !== null
      ? getProvinceNameById(Number(r.provinceId)) || null
      : null;

  // ── Tab 1: Rows Definition ─────────────────────────────────────────

  const detailBasicRows: DetailRow[] = [
    {
      label: 'Mã luồng hàng hải',
      value: r.channelCode ? <span style={statusBadgeStyle(actionPrimary)}>{r.channelCode}</span> : null,
    },
    {
      label: 'Tên luồng hàng hải',
      value: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold }}>{r.channelName || null}</span>,
    },
    {
      label: 'Đơn vị quản lý',
      value: <span style={{ fontWeight: fontWeightBold, color: textPrimary }}>{unitName}</span>,
    },
    {
      label: 'Thuộc cảng biển',
      value: portName,
    },
    {
      label: 'Đơn vị vận hành',
      value: opUnitName,
    },
    {
      label: 'Địa điểm (Tỉnh/TP)',
      value: provinceName,
    },
    {
      label: 'Địa điểm chi tiết',
      value: r.detailedLocation || null,
      span: true,
    },
    {
      label: 'Tình trạng',
      value: <ConditionPill status={r.conditionStatus} />,
    },
    {
      label: 'Trạm quản lý luồng',
      value: r.managementStation || null,
    },
    {
      label: 'Số lượng trạm',
      value: formatNumber(r.stationCount),
    },
    {
      label: 'Số lượng nhân sự tại trạm',
      value: formatNumber(r.stationStaffCount),
    },
    {
      label: 'Diện tích trạm (m²)',
      value: formatNumber(r.stationAreaSquareMeters),
    },
    {
      label: 'Số lượng phao',
      value: formatNumber(r.buoyCount),
    },
    {
      label: 'Số lượng tiêu',
      value: formatNumber(r.beaconCount),
    },
    {
      label: 'Ghi chú',
      value: r.notes || null,
      span: true,
    },
  ];

  const detailTechnicalRows: DetailRow[] = [
    {
      label: 'Phạm vi bảo vệ luồng (m)',
      value: formatNumber(r.protectionScopeMeters),
    },
    {
      label: 'KL nạo vét (m³)',
      value: formatNumber(r.latestDredgingVolumeCubicMeters),
    },
    {
      label: 'Sửa chữa trạm gần nhất',
      value: formatMonthYear(r.latestStationRepairMonth),
    },
    {
      label: 'Năm bảo trì gần nhất',
      value: r.latestMaintenanceYear ? String(r.latestMaintenanceYear) : null,
    },
    {
      label: 'Ghi chú phạm vi bảo vệ',
      value: r.protectionNotes || null,
      span: true,
    },
  ];

  const detailAnnouncementRows: DetailRow[] = [
    {
      label: 'Số quyết định công bố',
      value: r.announcementDecisionNumber || null,
    },
    {
      label: 'Ngày ra quyết định',
      value: formatDateOnly(r.announcementDecisionDate),
    },
    {
      label: 'Đơn vị ra quyết định',
      value: r.announcementDecisionIssuer || null,
      span: true,
    },
  ];

  const detailHandlingRows: DetailRow[] = [
    {
      label: 'Trạng thái',
      span: true,
      value: (() => {
        const isDel = Boolean(
          r.deletedAt ||
          r.deletedBy ||
          r.approvalStatus === 'ARCHIVED' ||
          rawRecord.status === 'ARCHIVED' ||
          rawRecord.status === 'DELETED'
        );
        if (isDel) {
          return <span style={statusBadgeStyle(statusCritical)}>Đã xóa</span>;
        }
        return r.approvalStatus ? <ApprovalStatusBadge status={r.approvalStatus} /> : null;
      })(),
    },
    {
      label: 'Cán bộ cập nhật',
      value: <span style={{ fontWeight: fontWeightBold }}>{actorName(r.updatedBy) || null}</span>,
    },
    {
      label: 'Ngày cập nhật',
      value: formatDate(r.updatedAt || r.createdAt),
    },
    {
      label: 'Cán bộ gửi phê duyệt',
      value: <span style={{ fontWeight: fontWeightBold }}>{actorName(r.submittedBy) || null}</span>,
    },
    {
      label: 'Ngày gửi phê duyệt',
      value: formatDate(r.submittedAt),
    },
    {
      label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
      value: <span style={{ fontWeight: fontWeightBold }}>{actorName(r.approverLevel1 || r.level1ApprovedBy) || null}</span>,
    },
    {
      label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục',
      value: formatDate(r.approvedDateLevel1 || r.level1ApprovedAt),
    },
    {
      label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
      value: r.level1ApprovalContent || null,
      span: true,
    },
    {
      label: 'Cán bộ phê duyệt cấp Cục',
      value: <span style={{ fontWeight: fontWeightBold }}>{actorName(r.approverLevel2 || r.level2ApprovedBy) || null}</span>,
    },
    {
      label: 'Ngày phê duyệt cấp Cục',
      value: formatDate(r.approvedDateLevel2 || r.level2ApprovedAt),
    },
    {
      label: 'Nội dung phê duyệt cấp Cục',
      value: r.level2ApprovalContent || null,
      span: true,
    },
    ...(r.rejectionReason
      ? [
          {
            label: 'Lý do từ chối',
            value: <span style={{ color: statusCritical }}>{r.rejectionReason}</span>,
            span: true,
          } as DetailRow,
        ]
      : []),
  ];

  // ── Tab 2: GIS Meta Rows ───────────────────────────────────────────

  const detailGisMetaRows: DetailRow[] = [
    {
      label: 'Loại đối tượng',
      value: GEOMETRY_TYPE_MAP[r.geometryType || ''] || r.geometryType || '',
    },
    {
      label: 'Biểu tượng',
      value: symbolNode || (symId ? String(symId) : '—'),
    },
    {
      label: 'Hệ quy chiếu',
      value: (r.coordinateReferenceSystem && COORD_SYS_MAP[r.coordinateReferenceSystem]) || r.coordinateReferenceSystem || 'WGS-84',
    },
    {
      label: 'Quy tắc hiển thị',
      value: r.displayRule || (coordinates.length > 0 ? 'Độ, phút, giây (DMS)' : ''),
    },
  ];

  // ── Tab 4: Tuyến luồng Columns ──────────────────────────────────────

  const routeColumns: ColumnsType<ChannelRouteDetailResponse> = [
    { title: 'STT', dataIndex: 'sequenceNo', width: 50, align: 'center', render: (_: unknown, __: unknown, i: number) => i + 1 },
    { title: 'Phân loại tuyến', dataIndex: 'routeClassification', width: 140, render: (v?: string) => v || '' },
    {
      title: 'Mã tuyến',
      dataIndex: 'routeCode',
      width: 120,
      render: (v?: string) => <span style={{ fontWeight: 500, color: textPrimary }}>{v || ''}</span>,
    },
    {
      title: 'Tên tuyến luồng',
      dataIndex: 'routeName',
      width: 200,
      render: (v?: string) => <span style={{ color: textPrimary, fontWeight: fontWeightBold }}>{v || ''}</span>,
    },
    {
      title: 'Loại tuyến',
      dataIndex: 'routeType',
      width: 120,
      render: (v?: number) => (v === undefined || v === null ? '' : ROUTE_TYPE_MAP[v] || ''),
    },
    { title: 'Cấp luồng', dataIndex: 'routeGrade', width: 100, render: (v?: number) => (v === undefined || v === null ? '' : String(v)) },
    {
      title: 'Chiều dài (km)',
      dataIndex: 'channelLengthKilometers',
      width: 110,
      align: 'right',
      render: (v?: number) => formatNumber(v),
    },
    {
      title: 'Độ sâu thiết kế (m)',
      dataIndex: 'designDepthMeters',
      width: 130,
      align: 'right',
      render: (v?: number) => formatNumber(v),
    },
    {
      title: 'Độ sâu hiện trạng (m)',
      dataIndex: 'currentDepthMeters',
      width: 130,
      align: 'right',
      render: (v?: number) => formatNumber(v),
    },
    {
      title: 'Bề rộng thiết kế (m)',
      dataIndex: 'maximumDesignWidthMeters',
      width: 140,
      align: 'right',
      render: (_: unknown, rec: ChannelRouteDetailResponse) =>
        rec.maximumDesignWidthMeters !== undefined && rec.minimumDesignWidthMeters !== undefined
          ? `${rec.minimumDesignWidthMeters}–${rec.maximumDesignWidthMeters}`
          : formatNumber(rec.maximumDesignWidthMeters ?? rec.minimumDesignWidthMeters),
    },
    {
      title: 'Bán kính cong nhỏ nhất (m)',
      dataIndex: 'minimumCurveRadiusMeters',
      width: 160,
      align: 'right',
      render: (v?: number) => formatNumber(v),
    },
    {
      title: 'Vị trí vũng quay tàu',
      dataIndex: 'turningBasinLocation',
      width: 160,
      render: (v?: string) => v || '',
    },
    {
      title: 'Bán kính vũng quay (m)',
      dataIndex: 'turningBasinRadiusMeters',
      width: 140,
      align: 'right',
      render: (v?: number) => formatNumber(v),
    },
  ];

  // ── Tab 5: Lists Definition ────────────────────────────────────────

  const operationList = useMemo<OperationPlanItem[]>(() => {
    if (Array.isArray(rawRecord.operationPlanList) && rawRecord.operationPlanList.length > 0) {
      return rawRecord.operationPlanList as OperationPlanItem[];
    }
    if (!r.operationPlanCode && !r.operationPlanName && !r.operationStartDate && !r.operationEndDate) return [];
    return [
      {
        planCode: r.operationPlanCode || '',
        planName: r.operationPlanName || '',
        startDate: r.operationStartDate || '',
        endDate: r.operationEndDate || '',
      },
    ];
  }, [r, rawRecord]);

  const maintenanceList = useMemo<OperationPlanItem[]>(() => {
    if (Array.isArray(rawRecord.maintenancePlanList) && rawRecord.maintenancePlanList.length > 0) {
      return rawRecord.maintenancePlanList as OperationPlanItem[];
    }
    if (!r.maintenancePlanCode && !r.maintenancePlanName && !r.maintenanceStartTime && !r.maintenanceEndTime) return [];
    return [
      {
        planCode: r.maintenancePlanCode || '',
        planName: r.maintenancePlanName || '',
        startTime: r.maintenanceStartTime || '',
        endTime: r.maintenanceEndTime || '',
        startDate: r.maintenanceStartTime || '',
        endDate: r.maintenanceEndTime || '',
      },
    ];
  }, [r, rawRecord]);

  const incidentList = useMemo<IncidentItem[]>(() => {
    if (Array.isArray(rawRecord.incidentList) && rawRecord.incidentList.length > 0) {
      return rawRecord.incidentList as IncidentItem[];
    }
    if (!r.incidentCode && !r.incidentType && !r.incidentLocation && !r.incidentTime) return [];
    return [
      {
        incidentCode: r.incidentCode || '',
        incidentType: r.incidentType || '',
        location: r.incidentLocation || '',
        incidentTime: r.incidentTime || '',
      },
    ];
  }, [r, rawRecord]);

  // ── Tab Items ──────────────────────────────────────────────────────

  const detailTabItems = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
          <div style={detailSectionBoxStyle}>
            <div style={{ ...detailSectionHeaderStyle, cursor: 'default' }}>
              <div style={detailSectionTitleStyle}>
                <BankOutlined style={{ color: actionPrimary }} />
                <span>Thông tin cơ bản & Quản lý vận hành</span>
              </div>
            </div>
            {renderDetailRowsTwoCol(detailBasicRows)}
          </div>

          {renderDetailSectionCard({
            title: 'Thông số kỹ thuật & Năng lực khai thác',
            icon: <SlidersOutlined style={{ color: actionPrimary }} />,
            open: detailTechOpen,
            onToggle: () => setDetailTechOpen((v) => !v),
            children: renderDetailRowsTwoCol(detailTechnicalRows),
          })}

          {renderDetailSectionCard({
            title: 'Thông tin công bố mở, đưa vào sử dụng',
            icon: <FileTextOutlined style={{ color: actionPrimary }} />,
            open: announcementOpen,
            onToggle: () => setAnnouncementOpen((v) => !v),
            children: renderDetailRowsTwoCol(detailAnnouncementRows),
          })}

          {renderDetailSectionCard({
            title: 'Thông tin phê duyệt',
            icon: <AuditOutlined style={{ color: actionPrimary }} />,
            open: approvalOpen,
            onToggle: () => setApprovalOpen((v) => !v),
            children: renderDetailRowsTwoCol(detailHandlingRows),
          })}
        </div>
      ),
    },
    {
      key: 'gis',
      label: `Thông tin vị trí (${coordinates.length})`,
      forceRender: true,
      children: (
        <DetailTable
          scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
          dataSource={coordinates}
          emptyHeightAuto
          emptyText="Chưa có tọa độ GPS nào"
          headerNode={
            <>
              <div style={{ paddingTop: 6 }}>
                <div
                  style={{
                    padding: '12px 18px 8px 18px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                    marginBottom: 14,
                  }}
                >
                  <div className="chk-detail-grid">
                    {detailGisMetaRows.map((row, i) => (
                      <div key={row.label} className="chk-detail-row">
                        <span className={`chk-detail-label ${i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{row.label}</span>
                        <span className="chk-detail-value">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                  <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>
                    Tọa độ GPS ({coordinates.length})
                  </span>
                  <Button
                    icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                    onClick={() => setGisModalOpen(true)}
                    style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeMd, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Xem vị trí trên bản đồ
                  </Button>
                </div>
              </div>
            </>
          }
          columns={[
            {
              title: 'STT',
              width: 50,
              align: 'center' as const,
              render: (_: unknown, __: unknown, i: number) => i + 1,
            },
            {
              title: 'Vĩ độ (Latitude - N)',
              key: 'lat',
              render: (_: unknown, rec: CoordinateItem) => {
                const dms = ddToDms(rec.latitude);
                return `${dms.d}° ${dms.m}' ${dms.s}" N`;
              },
            },
            {
              title: 'Kinh độ (Longitude - E)',
              key: 'lng',
              render: (_: unknown, rec: CoordinateItem) => {
                const dms = ddToDms(rec.longitude);
                return `${dms.d}° ${dms.m}' ${dms.s}" E`;
              },
            },
          ]}
        />
      ),
    },
    {
      key: 'files',
      label: `File đính kèm (${detailFiles.length})`,
      forceRender: true,
      children: (
        <div style={{ paddingTop: 6 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 13.5 }}>File đính kèm</span>
          </div>
          <InfrastructureAttachmentTab
            attachments={detailFiles}
            readonly={true}
            readonlyBerthLayout={true}
            userMap={userMap}
            onDownload={(attachmentId, fileName) => {
              if (r?.id) {
                navigationChannelCRUD
                  .downloadAttachment(r.id, attachmentId)
                  .then((blob) => triggerBlobDownload(blob, fileName))
                  .catch(() => toast.error('Không thể tải xuống tệp đính kèm'));
                return;
              }
              const file = detailFiles.find((f) => f.id === attachmentId);
              const url = file?.filePath || file?.url || '';
              if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                window.open(url, '_blank');
              } else if (url) {
                triggerBlobDownload(url, fileName);
              }
            }}
            loadReadonlyPreviewImage={(attachmentId) => {
              const entityId = r?.id;
              return entityId
                ? navigationChannelCRUD.downloadAttachment(entityId, attachmentId)
                : Promise.reject(new Error('Chưa xác định được bản ghi luồng hàng hải để tải tệp đính kèm'));
            }}
            loadPreviewAttachment={(attachmentId) => {
              const entityId = r?.id;
              return entityId
                ? navigationChannelCRUD.downloadAttachment(entityId, attachmentId)
                : Promise.reject(new Error('Chưa xác định được bản ghi luồng hàng hải để tải tệp đính kèm'));
            }}
            scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
          />
        </div>
      ),
    },
    {
      key: 'routes',
      label: `Tuyến luồng (${routeDetails.length})`,
      children: (
        <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
          {renderDetailSectionCard({
            title: 'Thông tin phân đoạn tuyến luồng',
            icon: <SlidersOutlined style={{ color: actionPrimary }} />,
            open: routesOpen,
            onToggle: () => setRoutesOpen((v) => !v),
            matchBerthOperationStyle: true,
            children: (
              <DetailTable<ChannelRouteDetailResponse>
                dataSource={routeDetails}
                emptyText="Chưa có dữ liệu"
                rowKey={(it: ChannelRouteDetailResponse) => it.id || it.routeCode || it.routeName}
                scrollY={DRAWER_TABLE_SCROLL_Y.pureTable}
                columns={routeColumns}
              />
            ),
          })}
        </div>
      ),
    },
    {
      key: 'operationMaintenance',
      label: 'Vận hành & bảo trì',
      children: (
        <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
          {/* ── Section Vận hành ── */}
          {renderDetailSectionCard({
            title: 'Thông tin vận hành khai thác',
            icon: <SlidersOutlined style={{ color: actionPrimary }} />,
            open: opsOperationOpen,
            onToggle: () => setOpsOperationOpen((v) => !v),
            matchBerthOperationStyle: true,
            children: (
              <DetailTable<OperationPlanItem>
                scrollY={160}
                dataSource={operationList}
                emptyText="Chưa có dữ liệu"
                rowKey={(it: OperationPlanItem) => it.id || it.planCode || it.code || 'op-key'}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã kế hoạch', dataIndex: 'planCode', render: (v: unknown, rec: OperationPlanItem) => String(v || rec?.code || '') },
                  { title: 'Tên kế hoạch', dataIndex: 'planName', render: (v: unknown, rec: OperationPlanItem) => String(v || rec?.name || '') },
                  { title: 'Ngày bắt đầu', dataIndex: 'startDate', width: 150, align: 'center' as const, render: (v: unknown, rec: OperationPlanItem) => formatOperationTableDateTime((v || rec?.startTime || rec?.start || null) as string | null) },
                  { title: 'Ngày kết thúc', dataIndex: 'endDate', width: 150, align: 'center' as const, render: (v: unknown, rec: OperationPlanItem) => formatOperationTableDateTime((v || rec?.endTime || rec?.end || null) as string | null) },
                ]}
              />
            ),
          })}

          {/* ── Section Bảo trì ── */}
          {renderDetailSectionCard({
            title: 'Thông tin bảo trì',
            icon: <SlidersOutlined style={{ color: actionPrimary }} />,
            open: opsMaintenanceOpen,
            onToggle: () => setOpsMaintenanceOpen((v) => !v),
            matchBerthOperationStyle: true,
            children: (
              <DetailTable<OperationPlanItem>
                scrollY={160}
                dataSource={maintenanceList}
                emptyText="Chưa có dữ liệu"
                rowKey={(it: OperationPlanItem) => it.id || it.planCode || it.code || 'maint-key'}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã kế hoạch', dataIndex: 'planCode', render: (v: unknown, rec: OperationPlanItem) => String(v || rec?.code || '') },
                  { title: 'Tên kế hoạch', dataIndex: 'planName', render: (v: unknown, rec: OperationPlanItem) => String(v || rec?.name || '') },
                  { title: 'Thời gian bắt đầu', dataIndex: 'startTime', width: 150, align: 'center' as const, render: (v: unknown, rec: OperationPlanItem) => formatOperationTableDateTime((v || rec?.start || rec?.startDate || null) as string | null) },
                  { title: 'Thời gian kết thúc', dataIndex: 'endTime', width: 150, align: 'center' as const, render: (v: unknown, rec: OperationPlanItem) => formatOperationTableDateTime((v || rec?.end || rec?.endDate || null) as string | null) },
                ]}
              />
            ),
          })}

          {/* ── Section Sự cố ── */}
          {renderDetailSectionCard({
            title: 'Thông tin sự cố',
            icon: <SlidersOutlined style={{ color: actionPrimary }} />,
            open: opsIncidentOpen,
            onToggle: () => setOpsIncidentOpen((v) => !v),
            matchBerthOperationStyle: true,
            children: (
              <DetailTable<IncidentItem>
                scrollY={160}
                dataSource={incidentList}
                emptyText="Chưa có dữ liệu"
                rowKey={(it: IncidentItem) => it.id || it.incidentCode || it.code || 'inc-key'}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã sự cố', dataIndex: 'incidentCode', render: (v: unknown, it: IncidentItem) => String(v || it?.code || '') },
                  { title: 'Loại sự cố', dataIndex: 'incidentType', render: (v: unknown, it: IncidentItem) => String(v || it?.type || '') },
                  { title: 'Địa điểm', dataIndex: 'location', render: (v: unknown) => String(v || '') },
                  { title: 'Thời gian', dataIndex: 'incidentTime', width: 150, align: 'center' as const, render: (v: unknown, it: IncidentItem) => formatOperationTableDateTime((v || it?.time || null) as string | null) },
                ]}
              />
            ),
          })}
        </div>
      ),
    },
  ];

  return (
    <div className="chk-detail-tabs">
      <style>{`
        .chk-detail-tabs .ant-tabs-tab {
          font-size: 13.5px !important;
        }
        .chk-detail-tabs .ant-table,
        .chk-detail-tabs .ant-table-cell,
        .chk-detail-tabs .ant-table-thead > tr > th,
        .chk-detail-tabs .ant-table-tbody > tr > td {
          font-size: 13.5px !important;
        }
        .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }
        .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }
        .chk-detail-row:last-child {
          border-bottom: none !important;
        }
        .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }
        .chk-detail-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          text-align: left !important;
          line-height: 1.5 !important;
        }
        .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }
        .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }
        .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }
        .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }
        .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }
        @media (max-width: 960px) {
          .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .chk-detail-label,
          .sec-col1-label,
          .sec-col2-label,
          .sec-full-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }
        @media (max-width: 640px) {
          .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .chk-detail-label,
          .sec-col1-label,
          .sec-col2-label,
          .sec-full-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .chk-detail-value {
            width: 100% !important;
          }
        }
      `}</style>

      <Tabs
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        tabBarStyle={tabBarStyle}
        items={detailTabItems}
      />

      {/* ── Modal xem vị trí GIS ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: 16 }}>
              Xem vị trí trên bản đồ chuyên dụng
            </span>
          </div>
        }
        open={gisModalOpen}
        onCancel={() => setGisModalOpen(false)}
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={null}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline
            height={560}
            disabled
            value={{
              geometryType: (r?.geometryType as 'POINT' | 'LINE' | 'POLYGON') || (gisView.geometryType as 'POINT' | 'LINE' | 'POLYGON') || 'POINT',
              coordinates: gisView.coordinates || '',
              symbolId: r?.mapIconId || r?.mapSymbolId || undefined,
            }}
            defaultGeometryType={(r?.geometryType as 'POINT' | 'LINE' | 'POLYGON') || (gisView.geometryType as 'POINT' | 'LINE' | 'POLYGON') || 'POINT'}
          />
        </div>
      </Modal>
    </div>
  );
}
