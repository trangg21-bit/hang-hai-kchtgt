import React, { useState, useMemo } from 'react';
import { Tabs, Button, Modal, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BankOutlined,
  SlidersOutlined,
  FileTextOutlined,
  AuditOutlined,
  EnvironmentOutlined,
  FileOutlined,
  DownloadOutlined,
  EyeOutlined,
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
  statusDraft,
  textPrimary,
  textSecondary,
  textTertiary,
  surfaceCard,
  radiusPill,
  fontSizeSm,
  fontSizeLg,
  fontWeightBold,
  primaryButtonStyle,
  statusBadgeStyle,
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

const fontSizeMd = 13.5;

// ── Style cho thẻ phân nhóm (Section Card) chuẩn Bến cảng ──
const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '12px 18px 8px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

// ── Màu pill cho Tình trạng hoạt động (#8) ──
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
  if (dd === null || dd === undefined || Number.isNaN(dd)) return '';
  const { d, m, s } = ddToDms(dd);
  return `${d}° ${m}' ${s}"`;
};

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '');
const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '');
const fmtMonthYear = (v?: string | null): string => (v ? dayjs(v).format('MM/YYYY') : '');
const fmtNum = (v?: number | null, unit?: string): string =>
  v === null || v === undefined || Number.isNaN(v) ? '' : `${v.toLocaleString('vi-VN')}${unit ? ` ${unit}` : ''}`;

type AttachmentRow = NavigationChannelAttachment & { uploadedBy?: string; uploadedAt?: string; filePath?: string };

export interface NavigationChannelDetailContentProps {
  record: NavigationChannelResponse;
  userMap?: Map<string, string>;
  onClose?: () => void;
}

/** Pill badge cho tình trạng hoạt động — chuẩn Pill Badge */
const ConditionPill = ({ status }: { status?: string | null }) => {
  const s = status || '';
  if (!s) return null;
  const color = CONDITION_COLOR_MAP[s] || textTertiary;
  const label = CONDITION_STATUS_MAP[s as keyof typeof CONDITION_STATUS_MAP] || s || '';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: 500,
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

export default function NavigationChannelDetailContent({
  record,
  userMap,
}: NavigationChannelDetailContentProps) {
  const r = record;
  const [gisOpen, setGisOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const coordinates = useMemo(
    () =>
      (Array.isArray(r?.coordinates) ? r.coordinates : []).map((c) => ({
        id: c.id,
        sequenceNo: c.sequenceNo,
        longitude: Number(c.longitude),
        latitude: Number(c.latitude),
      })),
    [r],
  );

  const routeDetails = useMemo(
    () => (Array.isArray(r?.routeDetails) ? r.routeDetails : []),
    [r],
  );

  const attachments = useMemo<AttachmentRow[]>(
    () => (Array.isArray(r?.attachments) ? (r.attachments as AttachmentRow[]) : []),
    [r],
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
    if (!id) return '';
    return userMap?.get(id) || id || '';
  };

  const provinceName =
    r.provinceId !== undefined && r.provinceId !== null
      ? getProvinceNameById(r.provinceId) || ''
      : '';

  const isImageFile = (fileName?: string) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext);
  };

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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%' }}>
          <FileOutlined style={{ color: actionPrimary }} />
          <Tooltip title={name}>
            <span style={{ color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name || ''}
            </span>
          </Tooltip>
        </span>
      ),
    },
    {
      title: 'Dung lượng',
      dataIndex: 'fileSize',
      width: 110,
      render: (size?: number) => {
        if (!size) return '';
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
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_: unknown, rec: AttachmentRow) => {
        const isImg = isImageFile(rec.fileName);
        const url = rec.filePath || rec.fileUrl || rec.fileName || '';
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {isImg ? (
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: actionPrimary }} />}
                onClick={() => setPreviewImage(url)}
                title="Xem ảnh"
              />
            ) : (
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined style={{ color: actionPrimary }} />}
                onClick={() => {
                  if (url) window.open(url, '_blank');
                }}
                title="Tải xuống"
              />
            )}
          </div>
        );
      },
    },
  ];

  // ── Tab 4: Tuyến luồng ─────────────────────────────────────────────
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
      render: (v?: string) => v || '',
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
  const operationList = useMemo(() => {
    if (!r.operationPlanCode && !r.operationPlanName && !r.operationStartDate && !r.operationEndDate) return [];
    return [
      {
        planCode: r.operationPlanCode || '',
        planName: r.operationPlanName || '',
        startDate: r.operationStartDate || '',
        endDate: r.operationEndDate || '',
      },
    ];
  }, [r]);

  const maintenanceList = useMemo(() => {
    if (!r.maintenancePlanCode && !r.maintenancePlanName && !r.maintenanceStartTime && !r.maintenanceEndTime) return [];
    return [
      {
        planCode: r.maintenancePlanCode || '',
        planName: r.maintenancePlanName || '',
        startDate: r.maintenanceStartTime || '',
        endDate: r.maintenanceEndTime || '',
      },
    ];
  }, [r]);

  const incidentList = useMemo(() => {
    if (!r.incidentCode && !r.incidentType && !r.incidentLocation && !r.incidentTime) return [];
    return [
      {
        incidentCode: r.incidentCode || '',
        incidentType: r.incidentType || '',
        incidentLocation: r.incidentLocation || '',
        incidentTime: r.incidentTime || '',
      },
    ];
  }, [r]);

  return (
    <div className="channel-detail-content-wrapper">
      <style>{`
        .channel-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .channel-detail-content-wrapper,
        .channel-detail-content-wrapper .chk-detail-label,
        .channel-detail-content-wrapper .chk-detail-value,
        .channel-detail-content-wrapper .ant-table,
        .channel-detail-content-wrapper .ant-table-cell,
        .channel-detail-content-wrapper .ant-table-thead > tr > th,
        .channel-detail-content-wrapper .ant-tabs-tab,
        .channel-detail-content-wrapper .ant-btn {
          font-size: 13.5px !important;
        }

        .channel-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .channel-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .channel-detail-content-wrapper .chk-detail-row:last-child {
          border-bottom: none !important;
        }

        .channel-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .channel-detail-content-wrapper .chk-detail-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
          color: ${colors.sidebarBg} !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          text-align: left !important;
          line-height: 1.5 !important;
        }

        .channel-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .channel-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .channel-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .channel-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
        }
      `}</style>

      <Tabs
        defaultActiveKey="general"
        tabBarStyle={{
          marginBottom: 0,
          paddingTop: 0,
          position: 'sticky',
          top: 0,
          zIndex: 1,
          background: surfaceCard,
        }}
        items={[
          {
            key: 'general',
            label: 'Thông tin chung',
            children: (
              <div
                style={{
                  paddingTop: 6,
                  paddingRight: 4,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  maxHeight: 'calc(100vh - 190px)',
                  minHeight: 350,
                }}
              >
                {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <BankOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin cơ bản & Quản lý vận hành</span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Mã luồng hàng hải</span>
                      <span className="chk-detail-value">
                        {r.channelCode ? <span style={statusBadgeStyle(actionPrimary)}>{r.channelCode}</span> : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Tên luồng hàng hải</span>
                      <span className="chk-detail-value" style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
                        {r.channelName || ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Đơn vị quản lý</span>
                      <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>
                        {r.orgUnitName || ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Thuộc cảng biển</span>
                      <span className="chk-detail-value">{r.seaportName || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Đơn vị vận hành</span>
                      <span className="chk-detail-value">{r.operatingUnitId || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Địa điểm (Tỉnh/TP)</span>
                      <span className="chk-detail-value">{provinceName}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Địa điểm chi tiết</span>
                      <span className="chk-detail-value">{r.detailedLocation || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Tình trạng</span>
                      <span className="chk-detail-value">
                        <ConditionPill status={r.conditionStatus} />
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Trạng thái</span>
                      <span className="chk-detail-value">
                        {r.approvalStatus ? <ApprovalStatusBadge status={r.approvalStatus} /> : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Trạm quản lý luồng</span>
                      <span className="chk-detail-value">{r.managementStation || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Số lượng trạm</span>
                      <span className="chk-detail-value">{fmtNum(r.stationCount)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Số lượng nhân sự tại trạm</span>
                      <span className="chk-detail-value">{fmtNum(r.stationStaffCount)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Diện tích trạm (m²)</span>
                      <span className="chk-detail-value">{fmtNum(r.stationAreaSquareMeters)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Số lượng phao</span>
                      <span className="chk-detail-value">{fmtNum(r.buoyCount)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Số lượng tiêu</span>
                      <span className="chk-detail-value">{fmtNum(r.beaconCount)}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label">Ghi chú</span>
                      <span className="chk-detail-value">{r.notes || ''}</span>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Thông số kỹ thuật & Năng lực khai thác ── */}
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Thông số kỹ thuật & Năng lực khai thác</span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Hệ quy chiếu</span>
                      <span className="chk-detail-value">{r.coordinateReferenceSystem || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Loại đối tượng GIS</span>
                      <span className="chk-detail-value">
                        {GEOMETRY_TYPE_MAP[r.geometryType || ''] || r.geometryType || ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Quy tắc hiển thị</span>
                      <span className="chk-detail-value">{r.displayRule || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Phạm vi bảo vệ luồng (m)</span>
                      <span className="chk-detail-value">{fmtNum(r.protectionScopeMeters)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Sửa chữa trạm gần nhất</span>
                      <span className="chk-detail-value">{fmtMonthYear(r.latestStationRepairMonth)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Năm bảo trì gần nhất</span>
                      <span className="chk-detail-value">{fmtNum(r.latestMaintenanceYear)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">KL nạo vét (m³)</span>
                      <span className="chk-detail-value">{fmtNum(r.latestDredgingVolumeCubicMeters)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Ghi chú phạm vi bảo vệ</span>
                      <span className="chk-detail-value">{r.protectionNotes || ''}</span>
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Thông tin công bố mở, đưa vào sử dụng (Collapsible) ── */}
                <div style={sectionBoxStyle}>
                  <div
                    style={{ ...sectionHeaderStyle, cursor: 'pointer', marginBottom: announcementOpen ? 10 : 0, borderBottom: announcementOpen ? '1px solid #f1f5f9' : 'none' }}
                    onClick={() => setAnnouncementOpen(!announcementOpen)}
                  >
                    <div style={sectionTitleStyle}>
                      <FileTextOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin công bố mở, đưa vào sử dụng</span>
                    </div>
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {announcementOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {announcementOpen && (
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Số quyết định công bố</span>
                        <span className="chk-detail-value">{r.announcementDecisionNumber || ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Ngày ra quyết định</span>
                        <span className="chk-detail-value">{fmtDate(r.announcementDecisionDate)}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label">Đơn vị ra quyết định</span>
                        <span className="chk-detail-value">{r.announcementDecisionIssuer || ''}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 4: Thông tin phê duyệt (Collapsible) ── */}
                <div style={sectionBoxStyle}>
                  <div
                    style={{ ...sectionHeaderStyle, cursor: 'pointer', marginBottom: approvalOpen ? 10 : 0, borderBottom: approvalOpen ? '1px solid #f1f5f9' : 'none' }}
                    onClick={() => setApprovalOpen(!approvalOpen)}
                  >
                    <div style={sectionTitleStyle}>
                      <AuditOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin phê duyệt</span>
                    </div>
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {approvalOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {approvalOpen && (
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Cán bộ cập nhật</span>
                        <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>
                          {actorName(r.updatedBy)}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Ngày cập nhật</span>
                        <span className="chk-detail-value">{fmtDateTime(r.updatedAt)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Cán bộ gửi phê duyệt</span>
                        <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>
                          {actorName(r.submittedBy)}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Ngày gửi phê duyệt</span>
                        <span className="chk-detail-value">{fmtDateTime(r.submittedAt)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Cán bộ duyệt cấp Cảng vụ</span>
                        <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>
                          {actorName(r.level1ApprovedBy)}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Ngày duyệt cấp Cảng vụ</span>
                        <span className="chk-detail-value">{fmtDateTime(r.level1ApprovedAt)}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label">Nội dung duyệt cấp Cảng vụ</span>
                        <span className="chk-detail-value">{r.level1ApprovalContent || ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Cán bộ duyệt cấp Cục</span>
                        <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>
                          {actorName(r.level2ApprovedBy)}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Ngày duyệt cấp Cục</span>
                        <span className="chk-detail-value">{fmtDateTime(r.level2ApprovedAt)}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label">Nội dung duyệt cấp Cục</span>
                        <span className="chk-detail-value">{r.level2ApprovalContent || ''}</span>
                      </div>
                      {r.rejectionReason && (
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label" style={{ color: statusCritical }}>
                            Lý do từ chối
                          </span>
                          <span className="chk-detail-value" style={{ color: statusCritical }}>
                            {r.rejectionReason}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'location',
            label: `Thông tin vị trí (${coordinates.length})`,
            children: (
              <div>
                <div style={{ marginBottom: 10 }}>
                  <Button
                    type="primary"
                    icon={<EnvironmentOutlined />}
                    onClick={() => setGisOpen(true)}
                    style={{ ...primaryButtonStyle, height: 32, fontSize: fontSizeMd, borderRadius: radiusPill }}
                  >
                    Xem vị trí trên bản đồ chuyên dụng
                  </Button>
                </div>
                <DetailTable<NavigationChannelCoordinateResponse>
                  dataSource={coordinates}
                  columns={coordinateColumns}
                  rowKey="id"
                  scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
                  emptyText="Chưa có dữ liệu tọa độ"
                />
              </div>
            ),
          },
          {
            key: 'files',
            label: `File đính kèm (${attachments.length})`,
            children: (
              <DetailTable<AttachmentRow>
                dataSource={attachments}
                columns={attachmentColumns}
                rowKey="id"
                scrollY={DRAWER_TABLE_SCROLL_Y.pureTable}
                emptyText="Chưa có tài liệu đính kèm"
              />
            ),
          },
          {
            key: 'routes',
            label: `Tuyến luồng (${routeDetails.length})`,
            children: (
              <DetailTable<ChannelRouteDetailResponse>
                dataSource={routeDetails}
                columns={routeColumns}
                rowKey="id"
                scrollY={DRAWER_TABLE_SCROLL_Y.pureTable}
                emptyText="Chưa có phân đoạn tuyến luồng"
              />
            ),
          },
          {
            key: 'operationMaintenance',
            label: 'Vận hành & bảo trì',
            children: (
              <div
                style={{
                  paddingTop: 6,
                  paddingRight: 4,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  maxHeight: 'calc(100vh - 190px)',
                  minHeight: 350,
                }}
              >
                {/* ── Kế hoạch vận hành ── */}
                <div style={sectionBoxStyle}>
                  <div
                    style={{ ...sectionHeaderStyle, cursor: 'pointer', marginBottom: operationOpen ? 10 : 0, borderBottom: operationOpen ? '1px solid #f1f5f9' : 'none' }}
                    onClick={() => setOperationOpen(!operationOpen)}
                  >
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Kế hoạch vận hành</span>
                    </div>
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {operationOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {operationOpen && (
                    <DetailTable
                      dataSource={operationList}
                      columns={[
                        { title: 'STT', width: 50, align: 'center', render: (_: unknown, __: unknown, i: number) => i + 1 },
                        { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'planCode', render: (v: string) => v || '' },
                        { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'planName', render: (v: string) => v || '' },
                        { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'startDate', width: 140, align: 'center', render: (v: string) => fmtDate(v) },
                        { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate', width: 140, align: 'center', render: (v: string) => fmtDate(v) },
                      ]}
                      rowKey="planCode"
                      emptyText="Chưa có dữ liệu kế hoạch vận hành"
                    />
                  )}
                </div>

                {/* ── Kế hoạch bảo trì ── */}
                <div style={sectionBoxStyle}>
                  <div
                    style={{ ...sectionHeaderStyle, cursor: 'pointer', marginBottom: maintenanceOpen ? 10 : 0, borderBottom: maintenanceOpen ? '1px solid #f1f5f9' : 'none' }}
                    onClick={() => setMaintenanceOpen(!maintenanceOpen)}
                  >
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Kế hoạch bảo trì</span>
                    </div>
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {maintenanceOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {maintenanceOpen && (
                    <DetailTable
                      dataSource={maintenanceList}
                      columns={[
                        { title: 'STT', width: 50, align: 'center', render: (_: unknown, __: unknown, i: number) => i + 1 },
                        { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'planCode', render: (v: string) => v || '' },
                        { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'planName', render: (v: string) => v || '' },
                        { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'startDate', width: 140, align: 'center', render: (v: string) => fmtDate(v) },
                        { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate', width: 140, align: 'center', render: (v: string) => fmtDate(v) },
                      ]}
                      rowKey="planCode"
                      emptyText="Chưa có dữ liệu kế hoạch bảo trì"
                    />
                  )}
                </div>

                {/* ── Lịch sử sự cố ── */}
                <div style={sectionBoxStyle}>
                  <div
                    style={{ ...sectionHeaderStyle, cursor: 'pointer', marginBottom: incidentOpen ? 10 : 0, borderBottom: incidentOpen ? '1px solid #f1f5f9' : 'none' }}
                    onClick={() => setIncidentOpen(!incidentOpen)}
                  >
                    <div style={sectionTitleStyle}>
                      <AuditOutlined style={{ color: actionPrimary }} />
                      <span>Lịch sử sự cố & cảnh báo</span>
                    </div>
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {incidentOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {incidentOpen && (
                    <DetailTable
                      dataSource={incidentList}
                      columns={[
                        { title: 'STT', width: 50, align: 'center', render: (_: unknown, __: unknown, i: number) => i + 1 },
                        { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string) => v || '' },
                        { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string) => v || '' },
                        { title: 'Địa điểm', dataIndex: 'incidentLocation', key: 'location', render: (v: string) => v || '' },
                        { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 160, align: 'center', render: (v: string) => fmtDateTime(v) },
                      ]}
                      rowKey="incidentCode"
                      emptyText="Chưa có ghi nhận sự cố"
                    />
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* ── Modal xem vị trí GIS ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            value={{
              geometryType: gisView.geometryType as 'POINT' | 'LINE' | 'POLYGON',
              coordinates: gisView.coordinates,
            }}
          />
        </div>
      </Modal>

      {/* ── Modal xem ảnh phóng to ── */}
      <Modal
        open={!!previewImage}
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            Xem trước hình ảnh
          </span>
        }
        footer={null}
        onCancel={() => setPreviewImage(null)}
        destroyOnClose
        width={800}
      >
        {previewImage && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <img
              src={previewImage}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
