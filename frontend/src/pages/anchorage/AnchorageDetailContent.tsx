import { useState } from 'react';
import { Tabs, Button, Modal, Drawer, Tooltip } from 'antd';
import {
  AuditOutlined, BankOutlined, DownloadOutlined, DownOutlined, EnvironmentOutlined, EyeOutlined,
  FileImageOutlined, FileOutlined, FileTextOutlined, RightOutlined, SlidersOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import {
  detailLabelStyle, generalScrollerStyle, sectionBoxStyle,
  sectionHeaderStyle, sectionTitleStyle,
} from '../../components/detail-drawer/detailSkin';
import { colors, DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import {
  actionPrimary, textTertiary, textPrimary, surfaceCard, borderDefault,
  fontSizeSm, fontSizeLg, fontWeightBold, fontWeightMedium,
  spaceSm, spaceMd, spaceFormField,
  outlineButtonStyle, primaryButtonStyle, statusBadgeStyle,
  drawerTitleStyle, drawerCloseBtnStyle,
} from '../../themetokenchk';
import type { Anchorage } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';
import { fmtNum } from '../../utils/numFmt';

// Đồng bộ cỡ chữ 13.5px toàn màn chi tiết theo chuẩn PierDetailContent / BerthDetailContent
const fontSizeMd = 13.5;

interface AttachmentFile {
  id: string;
  fileName?: string;
  name?: string;
  fileSize?: number;
  size?: number;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt?: string;
  uploadedDate?: string;
  createdAt?: string;
  url?: string;
}

interface DetailTableRow {
  id?: string;
  name?: string;
  code?: string;
  planCode?: string;
  planName?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  start?: string;
  end?: string;
  incidentCode?: string;
  incidentType?: string;
  location?: string;
  incidentTime?: string;
  time?: string;
  type?: string;
}

export interface AnchorageDetailContentProps {
  selectedRecord: Anchorage;
  orgMap: Map<string, string>;
  organizations?: Array<{ id: string; name: string; parentId?: string }>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  portOptions: Array<{ value: string; label: string }>;
  portMap?: Map<string, string>;
  buoyStationMap?: Map<string, string>;
  userMap: Map<string, string>;
  detailFiles: AttachmentFile[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  operationalStyleMap: Record<string, { color: string; label: string }>;
  waterwayMap?: Map<string, string>;
  operationPlanList?: DetailTableRow[];
  maintenancePlanList?: DetailTableRow[];
  incidentList?: DetailTableRow[];
}

function formatDateOnly(d: string | null | undefined): string {
  if (!d) return '';
  try { return dayjs(d).format('DD/MM/YYYY'); } catch { return String(d); }
}

function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '';
  try { return dayjs(d).format('DD/MM/YYYY HH:mm:ss'); } catch { return String(d); }
}

const formatNumericDisplay = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  return fmtNum(value) || String(value);
};

const isImageFile = (fileName?: string): boolean => {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff'].includes(ext || '');
};

// Parse tọa độ GPS: ưu tiên WKT (coordinates) từ backend — hỗ trợ POINT/MULTIPOINT/LINESTRING/POLYGON;
// fallback sang latitude/longitude (backend chỉ parse được cho POINT).
const parseGisCoordinates = (record: any): Array<{ lat: number; lng: number }> => {
  const wkt = record?.coordinates;
  const out: Array<{ lat: number; lng: number }> = [];
  if (wkt && typeof wkt === 'string' && wkt.trim()) {
    try {
      if (wkt.startsWith('LINESTRING(')) {
        const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/);
        if (m) m[1].split(',').forEach((p: string) => { const [lng, lat] = p.trim().split(/\s+/); if (!isNaN(Number(lat))) out.push({ lng: Number(lng), lat: Number(lat) }); });
      }
      if (out.length === 0 && wkt.startsWith('POLYGON((')) {
        const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/);
        if (m) {
          const pts = m[1].split(',').map((p: string) => { const [lng, lat] = p.trim().split(/\s+/); return { lng: Number(lng), lat: Number(lat) }; }).filter(c => !isNaN(c.lat));
          if (pts.length > 1 && pts[0].lng === pts[pts.length - 1].lng) pts.pop();
          pts.forEach(p => { out.push(p); });
        }
      }
      if (out.length === 0) {
        const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/);
        if (mm) mm[1].split('),(').forEach((pt: string) => { const [lng, lat] = pt.replace(/[()]/g, '').trim().split(/\s+/); if (!isNaN(Number(lat))) out.push({ lng: Number(lng), lat: Number(lat) }); });
      }
      if (out.length === 0) {
        const pm = wkt.match(/POINT\s*\(([\d.-]+)\s+([\d.-]+)\)/);
        if (pm) out.push({ lng: Number(pm[1]), lat: Number(pm[2]) });
      }
    } catch { /* ignore */ }
  }
  if (out.length === 0 && record?.latitude != null && record?.longitude != null) {
    out.push({ lat: Number(record.latitude), lng: Number(record.longitude) });
  }
  return out;
};

export default function AnchorageDetailContent({
  selectedRecord,
  orgMap,
  symbolMap,
  symbolImageMap,
  portOptions,
  portMap = new Map(),
  buoyStationMap = new Map(),
  userMap,
  detailFiles,
  ddToDms,
  approvalStyleMap,
  operationalStyleMap,
  waterwayMap = new Map<string, string>(),
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
}: AnchorageDetailContentProps) {
  const r = selectedRecord;

  const renderDmsText = (dd: number | null | undefined, isLat: boolean): string => {
    if (dd == null || isNaN(Number(dd))) return '';
    const dms = ddToDms(Number(dd));
    return `${dms.d}° ${dms.m}' ${dms.s}" ${isLat ? 'N' : 'E'}`;
  };

  const [technicalOpen, setTechnicalOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [waterAreaOpen, setWaterAreaOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

  const [viewingWaterArea, setViewingWaterArea] = useState<any | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<any>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const res = await api.get(`/v1/anchorage/${r.id}/attachments/${fileId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(`Không thể tải xuống tệp: ${fileName}`);
    }
  };

  const handlePreviewImage = async (file: any) => {
    setPreviewImageFile(file);
    setPreviewImageUrl('');
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    try {
      if (file.url) {
        setPreviewImageUrl(file.url);
      } else {
        const res = await api.get(`/v1/anchorage/${r.id}/attachments/${file.id}/download`, { responseType: 'blob' });
        setPreviewImageUrl(window.URL.createObjectURL(new Blob([res.data])));
      }
    } catch {
      toast.error('Không thể tải hình ảnh để xem chi tiết');
    } finally {
      setPreviewLoading(false);
    }
  };

  const coords = parseGisCoordinates(r);
  const portLabel = r.portId ? (portMap.get(r.portId) || portOptions.find(o => o.value === r.portId)?.label || r.portId) : '';
  const buoyLabel = r.buoyStationName || (r.buoyStationId ? buoyStationMap.get(r.buoyStationId) || r.buoyStationId : '');
  const provinceLabel = r.provinceId ? (VIETNAM_PROVINCES[Number(r.provinceId) - 1] || String(r.provinceId)) : '';

  return (
    <>
    <style>{`
      .anchorage-detail-content-wrapper,
      .anchorage-detail-content-wrapper .chk-detail-label,
      .anchorage-detail-content-wrapper .chk-detail-value,
      .anchorage-detail-content-wrapper .ant-table,
      .anchorage-detail-content-wrapper .ant-table-cell,
      .anchorage-detail-content-wrapper .ant-table-thead > tr > th,
      .anchorage-detail-content-wrapper .ant-tabs-tab,
      .anchorage-detail-content-wrapper .ant-btn,
      .anchorage-detail-content-wrapper .ant-select,
      .anchorage-detail-content-wrapper .ant-select-selection-item,
      .anchorage-detail-content-wrapper .ant-select-item {
        font-size: 13.5px !important;
      }

      .anchorage-detail-content-wrapper .chk-detail-row {
        display: flex !important;
        align-items: flex-start !important;
        min-height: 36px !important;
        padding: 7px 0 !important;
        border-bottom: 1px solid #f1f5f9 !important;
        line-height: 1.5 !important;
        gap: 10px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: visible !important;
      }
      .anchorage-detail-content-wrapper .chk-detail-row--full { grid-column: 1 / -1 !important; }
      .anchorage-detail-content-wrapper .chk-detail-label,
      .anchorage-detail-content-wrapper .sec-col1-label,
      .anchorage-detail-content-wrapper .chk-detail-row .sec-col1-label,
      .anchorage-detail-content-wrapper .chk-detail-row--full .chk-detail-label {
        width: 215px !important;
        min-width: 215px !important;
        max-width: 215px !important;
        flex-shrink: 0 !important;
        color: #12468c !important;
        font-weight: 600 !important;
        font-size: 13.5px !important;
        text-align: left !important;
        line-height: 1.5 !important;
        align-self: flex-start !important;
        white-space: normal !important;
      }
      .anchorage-detail-content-wrapper .chk-detail-row .sec-col2-label {
        width: 250px !important;
        min-width: 250px !important;
        max-width: 250px !important;
        flex-shrink: 0 !important;
        align-self: flex-start !important;
        white-space: normal !important;
      }
      .anchorage-detail-content-wrapper .chk-detail-label::after {
        content: ':' !important;
        margin-left: 1px !important;
        margin-right: 4px !important;
      }
      .anchorage-detail-content-wrapper .chk-detail-row.chk-detail-row--code .chk-detail-label {
        width: auto !important;
        min-width: auto !important;
        max-width: none !important;
        flex-shrink: 0 !important;
      }
      .anchorage-detail-content-wrapper .chk-detail-row.chk-detail-row--code .chk-detail-value {
        margin-left: 28px !important;
        justify-content: flex-start !important;
      }
      .anchorage-detail-content-wrapper .chk-detail-value {
        color: #1e293b !important;
        font-size: 13.5px !important;
        flex: 1 1 auto !important;
        min-width: 0 !important;
        max-width: 100% !important;
        text-align: left !important;
        line-height: 1.5 !important;
        display: flex !important;
        align-items: flex-start !important;
        align-self: flex-start !important;
        word-break: break-word !important;
      }
      .anchorage-detail-content-wrapper .chk-detail-grid {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
        column-gap: 28px !important;
        row-gap: 0 !important;
        align-items: stretch !important;
      }

      @media (max-width: 960px) {
        .anchorage-detail-content-wrapper .chk-detail-grid {
          grid-template-columns: 1fr !important;
          column-gap: 0 !important;
        }
        .anchorage-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 !important;
        }
        .anchorage-detail-content-wrapper .chk-detail-label,
        .anchorage-detail-content-wrapper .sec-col1-label,
        .anchorage-detail-content-wrapper .chk-detail-row .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
        }
      }

      @media (max-width: 640px) {
        .anchorage-detail-content-wrapper .chk-detail-row {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 3px !important;
          padding: 6px 0 !important;
        }
        .anchorage-detail-content-wrapper .chk-detail-label,
        .anchorage-detail-content-wrapper .sec-col1-label,
        .anchorage-detail-content-wrapper .chk-detail-row .sec-col2-label {
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
        }
        .anchorage-detail-content-wrapper .chk-detail-value {
          width: 100% !important;
          min-width: 100% !important;
        }
      }
    `}</style>
    <div className="anchorage-detail-content-wrapper">
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={generalScrollerStyle}>
              {/* Section 1: Thông tin cơ bản & Quản lý vận hành */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}><BankOutlined style={{ color: actionPrimary }} /><span>Thông tin cơ bản & Quản lý vận hành</span></div>
                </div>
                <div className="chk-detail-grid">
                  {[
                    ['Mã khu neo đậu', <span key="code" style={{ ...statusBadgeStyle(actionPrimary), whiteSpace: 'nowrap' }}>{r.anchorageCode || ''}</span>],
                    ['Tên khu neo đậu', <span key="name" style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{r.anchorageName || ''}</span>],
                    ['Đơn vị quản lý', <span key="org" style={{ fontWeight: fontWeightBold }}>{orgMap.get(r.orgUnitId || '') || r.orgUnitId || ''}</span>],
                    ['Thuộc cảng biển', <span key="port" style={{ fontWeight: fontWeightBold }}>{portLabel}</span>],
                    ['Thuộc bến phao', buoyLabel],
                    ['Thuộc luồng hàng hải', waterwayMap?.get(r.navigationChannelId || '') || r.navigationChannelId || ''],
                    ['Địa điểm (Tỉnh/Thành phố)', provinceLabel],
                    ['Tình trạng', (() => {
                      const s = r.operationalStatus;
                      const b = s && operationalStyleMap[s];
                      return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : '';
                    })()],
                  ].map(([label, value], index) => {
                    const isCode = label === 'Mã khu neo đậu';
                    const isLongCode = isCode && ((r.anchorageCode || '').trim().length > 20);
                    return (
                      <div key={label as string} className={`chk-detail-row ${isLongCode ? 'chk-detail-row--code' : ''}`}>
                        <span className={`chk-detail-label ${index % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{label}</span>
                        <span className="chk-detail-value">{value}</span>
                      </div>
                    );
                  })}
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label sec-col1-label">Địa điểm chi tiết</span>
                    <span className="chk-detail-value">{r.detailedLocation || ''}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Thông số kỹ thuật & Năng lực khai thác */}
              <div style={{ ...sectionBoxStyle, padding: technicalOpen ? sectionBoxStyle.padding : spaceMd }}>
                <div onClick={() => setTechnicalOpen(!technicalOpen)} style={{ ...sectionHeaderStyle, marginBottom: technicalOpen ? spaceMd : 0, paddingBottom: technicalOpen ? spaceSm : 0, borderBottom: technicalOpen ? sectionHeaderStyle.borderBottom : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Thông số kỹ thuật & Năng lực khai thác</span></div>
                  {technicalOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {technicalOpen && (
                  <div className="chk-detail-grid">
                    {[
                      ['Hình dạng', r.shapeDescription || ''],
                      ['Diện tích (ha)', formatNumericDisplay(r.area)],
                      ['Độ sâu khu nước theo thiết kế (m)', formatNumericDisplay(r.designWaterDepth)],
                      ['Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)', formatNumericDisplay(r.currentWaterDepth)],
                      ['Cao độ đáy bến thiết kế', formatNumericDisplay(r.bottomElevationDesign)],
                      ['Cỡ tàu khai thác theo công bố (DWT)', formatNumericDisplay(r.maxVesselDWT)],
                      ['Số lượng khu neo đậu đang khai thác', formatNumericDisplay(r.activeAnchorageCount)],
                      ['Số lượng khu neo đậu đã công bố', formatNumericDisplay(r.publishedAnchorageCount)],
                      ['Số lượng khu neo đậu đang được thỏa thuận đầu tư xây dựng', formatNumericDisplay(r.underInvestmentAnchorageCount)],
                    ].map(([label, value], index) => (
                      <div key={label as string} className="chk-detail-row">
                        <span className={`chk-detail-label ${index % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{label}</span>
                        <span className="chk-detail-value">{value}</span>
                      </div>
                    ))}
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Ghi chú</span>
                      <span className="chk-detail-value">{r.remarks || ''}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Thông tin công bố mở, đưa vào sử dụng */}
              <div style={{ ...sectionBoxStyle, padding: announcementOpen ? sectionBoxStyle.padding : spaceMd }}>
                <div onClick={() => setAnnouncementOpen(!announcementOpen)} style={{ ...sectionHeaderStyle, marginBottom: announcementOpen ? spaceMd : 0, paddingBottom: announcementOpen ? spaceSm : 0, borderBottom: announcementOpen ? sectionHeaderStyle.borderBottom : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><FileTextOutlined style={{ color: actionPrimary }} /><span>Thông tin công bố mở, đưa vào sử dụng</span></div>
                  {announcementOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {announcementOpen && (
                  <div className="chk-detail-grid">
                    {[
                      ['Thời điểm công bố mở, đưa vào sử dụng', formatDateOnly(r.openingAnnouncementDate)],
                      ['Quyết định công bố/ Văn bản cho phép khai thác', r.publicDecision || ''],
                      ['Văn bản thỏa thuận đầu tư xây dựng', r.investmentAgreement || ''],
                    ].map(([label, value], index) => (
                      <div key={label} className={`chk-detail-row ${index === 2 ? 'chk-detail-row--full' : ''}`}>
                        <span className={`chk-detail-label ${index % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{label}</span>
                        <span className="chk-detail-value">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Thông tin khu nước neo buộc tàu */}
              <div style={{ ...sectionBoxStyle, padding: waterAreaOpen ? sectionBoxStyle.padding : spaceMd }}>
                <div onClick={() => setWaterAreaOpen(!waterAreaOpen)} style={{ ...sectionHeaderStyle, marginBottom: waterAreaOpen ? spaceMd : 0, paddingBottom: waterAreaOpen ? spaceSm : 0, borderBottom: waterAreaOpen ? sectionHeaderStyle.borderBottom : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><FileTextOutlined style={{ color: actionPrimary }} /><span>Thông tin khu nước neo buộc tàu</span></div>
                  {waterAreaOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {waterAreaOpen && (
                  <div style={{ marginTop: 4 }}>
                    <DetailTable
                      dataSource={(Array.isArray(r.mooringWaterAreas) ? r.mooringWaterAreas : []).map((wa, i) => ({ ...wa, key: i }))}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(rec: any) => rec.key}
                      scroll={{ x: 600 }}
                      columns={[
                        { title: 'STT', width: 60 },
                        { title: 'Phạm vi khu nước neo buộc tàu', dataIndex: 'description', key: 'description', render: (d?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{d || ''}</span> },
                        {
                          title: 'Thao tác', key: 'actions', width: 100, align: 'center' as const,
                          render: (_v: any, rec: any) => (
                            <Tooltip title="Xem chi tiết điểm neo">
                              <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: actionPrimary, fontSize: fontSizeMd }} onClick={() => setViewingWaterArea(rec)} />
                            </Tooltip>
                          ),
                        },
                      ]}
                    />
                  </div>
                )}
              </div>

              {/* Section 5: Thông tin phê duyệt (Nằm trong Tab Thông tin chung theo quy chuẩn AGENTS.md) */}
              <div style={{ ...sectionBoxStyle, padding: approvalOpen ? sectionBoxStyle.padding : spaceMd }}>
                <div onClick={() => setApprovalOpen(!approvalOpen)} style={{ ...sectionHeaderStyle, marginBottom: approvalOpen ? spaceMd : 0, paddingBottom: approvalOpen ? spaceSm : 0, borderBottom: approvalOpen ? sectionHeaderStyle.borderBottom : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><AuditOutlined style={{ color: actionPrimary }} /><span>Thông tin phê duyệt</span></div>
                  {approvalOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {approvalOpen && (
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Trạng thái</span>
                      <span className="chk-detail-value">
                        {r.approvalStatus && approvalStyleMap[r.approvalStatus] ? (
                          <span style={statusBadgeStyle(approvalStyleMap[r.approvalStatus].color)}>
                            {approvalStyleMap[r.approvalStatus].label}
                          </span>
                        ) : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Cán bộ cập nhật</span>
                      <span className="chk-detail-value">
                        {userMap.get(r.updatedBy || '') || r.updatedBy ? (
                          <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.updatedBy || '') || r.updatedBy}</span>
                        ) : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Cán bộ gửi phê duyệt</span>
                      <span className="chk-detail-value">
                        {userMap.get(r.submittedForApprovalBy || '') || r.submittedForApprovalBy ? (
                          <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.submittedForApprovalBy || '') || r.submittedForApprovalBy}</span>
                        ) : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Ngày gửi phê duyệt</span>
                      <span className="chk-detail-value">{fmtDateTime(r.submittedForApprovalAt)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
                      <span className="chk-detail-value">
                        {userMap.get(r.portAuthorityApprovedBy || '') || r.portAuthorityApprovedBy ? (
                          <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.portAuthorityApprovedBy || '') || r.portAuthorityApprovedBy}</span>
                        ) : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
                      <span className="chk-detail-value">{fmtDateTime(r.portAuthorityApprovedAt)}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cảng vụ/Chi cục</span>
                      <span className="chk-detail-value">{r.portAuthorityApprovalContent || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cục</span>
                      <span className="chk-detail-value">
                        {userMap.get(r.departmentApprovedBy || '') || r.departmentApprovedBy ? (
                          <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.departmentApprovedBy || '') || r.departmentApprovedBy}</span>
                        ) : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cục</span>
                      <span className="chk-detail-value">{fmtDateTime(r.departmentApprovedAt)}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cục</span>
                      <span className="chk-detail-value">{r.departmentApprovalContent || ''}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ),
        },
        {
          key: 'gis', label: `Thông tin vị trí (${coords.length})`,
          children: (
            <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
              <div style={sectionBoxStyle}>
                <div className="chk-detail-grid">
                  {[
                    ['Loại đối tượng', (() => { const gt = String((r as any).geometryType || ''); const labels: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }; return labels[gt] || gt || ''; })()],
                    ['Biểu tượng', (() => { const symbolId = r.mapSymbolId || ''; const name = symbolMap.get(symbolId) || symbolId || ''; const image = symbolImageMap.get(symbolId); return name ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: spaceSm }}>{image ? <img src={image} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{name}</span> : ''; })()],
                    ['Hệ quy chiếu', r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : (r.coordinateSystem || '')],
                    ['Quy tắc hiển thị', ((r as any).geometryType || (r as any).coordinates || (r as any).latitude != null || (r as any).longitude != null) ? 'Độ, phút, giây (DMS)' : ''],
                  ].map(([label, value], index) => (
                    <div key={label as string} className="chk-detail-row">
                      <span className={`chk-detail-label ${index % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{label}</span>
                      <span className="chk-detail-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: spaceMd }}>
                <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                  <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>Tọa độ GPS ({coords.length})</span>
                  <Button icon={<EnvironmentOutlined style={{ color: actionPrimary }} />} onClick={() => setGisModalOpen(true)} style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Xem vị trí trên bản đồ</Button>
                </div>
                <DetailTable
                  dataSource={coords.map((point) => ({ ...point }))}
                  emptyText="Chưa có tọa độ GPS nào"
                  scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                  columns={[
                    { title: 'STT', width: 60 },
                    { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_value, record) => renderDmsText(record.lat, true) },
                    { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_value, record) => renderDmsText(record.lng, false) },
                  ]}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'files', label: `File đính kèm (${detailFiles.length})`,
          children: (
            <div style={{ paddingTop: 6 }}>
              <div style={{ marginBottom: spaceSm }}>
                <span style={detailLabelStyle}>Danh sách tài liệu đính kèm</span>
              </div>
              <DetailTable
                dataSource={detailFiles.map((f) => ({ ...f }))}
                emptyText="Chưa có tài liệu đính kèm"
                scrollY={detailFiles.length === 0 ? undefined : DRAWER_TABLE_SCROLL_Y.detailView}
                columns={[
                  { title: 'STT', width: 60 },
                  {
                    title: 'Tên tài liệu',
                    dataIndex: 'fileName',
                    key: 'fileName',
                    render: (v: string, rec: any) => {
                      const fname = v || rec.name || '';
                      const isImg = isImageFile(fname);
                      return (
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: spaceSm, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', color: actionPrimary, fontWeight: fontWeightBold }}
                          title={isImg ? `${fname} (Nhấp để xem chi tiết ảnh)` : `${fname} (Nhấp để tải xuống)`}
                          onClick={() => { if (isImg) handlePreviewImage(rec); else handleDownloadFile(rec.id, fname); }}
                        >
                          {isImg ? <FileImageOutlined style={{ color: actionPrimary, flexShrink: 0 }} /> : <FileOutlined style={{ color: textTertiary, flexShrink: 0 }} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fname}</span>
                        </span>
                      );
                    },
                  },
                  {
                    title: 'Dung lượng',
                    dataIndex: 'fileSize',
                    key: 'fileSize',
                    width: 120,
                    align: 'right' as const,
                    render: (v: number, rec: any) => {
                      const sz = v || rec.size || 0;
                      return sz ? (sz > 1024 * 1024 ? `${(sz / (1024 * 1024)).toFixed(2)} MB` : `${(sz / 1024).toFixed(1)} KB`) : '';
                    },
                  },
                  {
                    title: 'Người tải lên',
                    dataIndex: 'uploadedBy',
                    key: 'uploadedBy',
                    width: 180,
                    render: (v: string, rec: any) => userMap.get(v) || rec.uploadedByName || v || '',
                  },
                  {
                    title: 'Ngày tải lên',
                    dataIndex: 'uploadedAt',
                    key: 'uploadedAt',
                    width: 150,
                    align: 'center' as const,
                    render: (v: string, rec: any) => {
                      const dt = v || rec.uploadedDate || rec.createdAt;
                      return dt ? dayjs(dt).format('DD/MM/YYYY HH:mm') : '';
                    },
                  },
                  {
                    title: 'Thao tác',
                    key: 'actions',
                    width: 90,
                    align: 'center' as const,
                    render: (_: any, rec: any) => {
                      const fname = rec.fileName || rec.name || 'attachment';
                      const isImg = isImageFile(fname);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {isImg ? (
                            <Tooltip title="Xem chi tiết ảnh">
                              <Button type="text" size="small" icon={<EyeOutlined style={{ color: actionPrimary, fontSize: 16 }} />} onClick={() => handlePreviewImage(rec)} style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} />
                            </Tooltip>
                          ) : (
                            <span style={{ width: 28, height: 28, display: 'inline-block' }} />
                          )}
                          <Tooltip title="Tải xuống tệp">
                            <Button type="text" size="small" icon={<DownloadOutlined style={{ color: actionPrimary, fontSize: 16 }} />} onClick={() => handleDownloadFile(rec.id, fname)} style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} />
                          </Tooltip>
                        </div>
                      );
                    },
                  },
                ]}
              />
              <Modal
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileImageOutlined style={{ color: actionPrimary, fontSize: 18 }} />
                    <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>{previewImageFile?.fileName || previewImageFile?.name || 'Xem chi tiết hình ảnh'}</span>
                  </div>
                }
                open={previewModalOpen}
                onCancel={() => setPreviewModalOpen(false)}
                footer={[
                  <Button key="download" icon={<DownloadOutlined />} onClick={() => previewImageFile && handleDownloadFile(previewImageFile.id, previewImageFile.fileName || previewImageFile.name)} style={{ borderRadius: 999 }}>Tải xuống</Button>,
                  <Button key="close" type="primary" onClick={() => setPreviewModalOpen(false)} style={{ borderRadius: 999, background: actionPrimary, borderColor: actionPrimary }}>Đóng</Button>,
                ]}
                width="min(800px, 90vw)"
                centered
                destroyOnClose
              >
                <div style={{ textAlign: 'center', padding: '16px 0', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8 }}>
                  {previewLoading ? (
                    <div style={{ color: textTertiary }}>Đang tải hình ảnh...</div>
                  ) : previewImageUrl ? (
                    <img src={previewImageUrl} alt={previewImageFile?.fileName || 'Ảnh đính kèm'} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} />
                  ) : null}
                </div>
              </Modal>
            </div>
          ),
        },
        {
          key: 'operationMaintenance', label: 'Vận hành & bảo trì',
          children: (
            <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
              <div style={{ ...sectionBoxStyle, padding: operationOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setOperationOpen(!operationOpen)} style={{ ...sectionHeaderStyle, marginBottom: operationOpen ? spaceMd : 0, paddingBottom: operationOpen ? spaceSm : 0, borderBottom: operationOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Thông tin vận hành khai thác</span></div>
                  {operationOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {operationOpen && (
                  <DetailTable
                    dataSource={operationPlanList}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(rec) => rec.id || rec.planCode || rec.code || ''}
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 60 },
                      { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v, rec) => v || rec.code || '' },
                      { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v, rec) => v || rec.name || '' },
                      { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'start', width: 160, align: 'center' as const, render: (v, rec) => fmtDateTime(v || rec.startTime || rec.start || null) },
                      { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'end', width: 160, align: 'center' as const, render: (v, rec) => fmtDateTime(v || rec.endTime || rec.end || null) },
                    ]}
                  />
                )}
              </div>
              <div style={{ ...sectionBoxStyle, padding: maintenanceOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setMaintenanceOpen(!maintenanceOpen)} style={{ ...sectionHeaderStyle, marginBottom: maintenanceOpen ? spaceMd : 0, paddingBottom: maintenanceOpen ? spaceSm : 0, borderBottom: maintenanceOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Thông tin bảo trì</span></div>
                  {maintenanceOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {maintenanceOpen && (
                  <DetailTable
                    dataSource={maintenancePlanList}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(rec) => rec.id || rec.planCode || rec.code || ''}
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 60 },
                      { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v, rec) => v || rec.code || '' },
                      { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v, rec) => v || rec.name || '' },
                      { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'start', width: 160, align: 'center' as const, render: (v, rec) => fmtDateTime(v || rec.start || rec.startDate || null) },
                      { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'end', width: 160, align: 'center' as const, render: (v, rec) => fmtDateTime(v || rec.end || rec.endDate || null) },
                    ]}
                  />
                )}
              </div>
              <div style={{ ...sectionBoxStyle, padding: incidentOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setIncidentOpen(!incidentOpen)} style={{ ...sectionHeaderStyle, marginBottom: incidentOpen ? spaceMd : 0, paddingBottom: incidentOpen ? spaceSm : 0, borderBottom: incidentOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Thông tin sự cố</span></div>
                  {incidentOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {incidentOpen && (
                  <DetailTable
                    dataSource={incidentList}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(rec) => rec.id || rec.incidentCode || rec.code || ''}
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 60 },
                      { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v, rec) => v || rec.code || '' },
                      { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v, rec) => v || rec.type || '' },
                      { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v) => v || '' },
                      { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 160, align: 'center' as const, render: (v, rec) => fmtDateTime(v || rec.time || null) },
                    ]}
                  />
                )}
              </div>
            </div>
          ),
        },
      ]}
    />

    {/* GIS Location Selector Modal — xem vị trí trên bản đồ chuyên dụng (chuẩn VTS CHK) */}
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EnvironmentOutlined style={{ color: actionPrimary }} />
          <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
            Xem vị trí trên bản đồ chuyên dụng
          </span>
        </div>
      }
      open={gisModalOpen}
      onCancel={() => setGisModalOpen(false)}
      destroyOnClose
      width="94vw"
      style={{ top: 20, maxWidth: '1400px' }}
      footer={[
        <Button key="close" type="primary" onClick={() => setGisModalOpen(false)} style={{ ...primaryButtonStyle, height: 36 }}>
          Đóng
        </Button>,
      ]}
    >
      <div style={{ padding: '8px 0' }}>
        <GisLocationSelector
          inline={true}
          defaultGeometryType="POINT"
          disabled
          height={520}
          value={(() => {
            const pts = parseGisCoordinates(r);
            if (pts.length > 0) {
              const rawWkt = (r as any).coordinates || '';
              let geom: 'POINT' | 'LINE' | 'POLYGON' = 'POINT';
              let coordinates: string;
              if (rawWkt.startsWith('LINESTRING')) {
                geom = 'LINE';
                coordinates = `LINESTRING(${pts.map(p => `${p.lng} ${p.lat}`).join(', ')})`;
              } else if (rawWkt.startsWith('POLYGON')) {
                geom = 'POLYGON';
                coordinates = `POLYGON((${pts.map(p => `${p.lng} ${p.lat}`).join(', ')}))`;
              } else if (pts.length > 1) {
                coordinates = `MULTIPOINT(${pts.map(p => `(${p.lng} ${p.lat})`).join(',')})`;
              } else {
                coordinates = `POINT(${pts[0].lng} ${pts[0].lat})`;
              }
              return { geometryType: geom, coordinates };
            }
            return undefined;
          })()}
        />
      </div>
    </Modal>

    {/* ── Drawer chi tiết khu nước neo buộc tàu (không đẩy Drawer cha) ── */}
    <Drawer
      title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chi tiết thông tin khu nước neo buộc tàu</span>}
      width={900}
      placement="right"
      open={!!viewingWaterArea}
      onClose={() => setViewingWaterArea(null)}
      destroyOnHidden
      push={false}
      closable={false}
      extra={<Button type="text" onClick={() => setViewingWaterArea(null)} style={drawerCloseBtnStyle}>✕</Button>}
      styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }}
    >
      {viewingWaterArea && (
        <div style={{ paddingTop: 3 }}>
          <div className="chk-detail-grid">
            <div className="chk-detail-row chk-detail-row--full">
              <span className="chk-detail-label sec-col1-label">Phạm vi khu nước neo buộc tàu</span>
              <span className="chk-detail-value">{viewingWaterArea.description || ''}</span>
            </div>
          </div>
          <div style={{ marginBottom: spaceMd, marginTop: spaceMd }}>
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>Vị trí cụ thể điểm neo</span>
          </div>
          <div className="chk-detail-grid">
            {[
              ['Loại đối tượng', (() => { const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }; return viewingWaterArea.geometryType ? m[viewingWaterArea.geometryType] || viewingWaterArea.geometryType : ''; })()],
              ['Biểu tượng', (() => { const symName = symbolMap.get(viewingWaterArea.mapSymbolId || '') || viewingWaterArea.mapSymbolId || ''; const symImg = symbolImageMap.get(viewingWaterArea.mapSymbolId || ''); return symName ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span> : ''; })()],
              ['Hệ quy chiếu', viewingWaterArea.coordinateSystem === 1 ? 'WGS-84' : viewingWaterArea.coordinateSystem === 2 ? 'VN-2000' : (viewingWaterArea.coordinateSystem || '')],
              ['Quy tắc hiển thị', viewingWaterArea.displayRule || ''],
            ].map(([label, value], i) => (
              <div key={i} className="chk-detail-row">
                <span className={`chk-detail-label ${i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{label}</span>
                <span className="chk-detail-value">{value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: spaceSm }}>
            <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Tọa độ điểm neo</span>
            <DetailTable
              dataSource={(Array.isArray(viewingWaterArea.anchorPoints) ? viewingWaterArea.anchorPoints : []).map((p: any, i: number) => ({ ...p, key: i }))}
              emptyText="Không có điểm neo"
              rowKey={(rec: any) => rec.key}
              tableLayout="fixed"
              columns={[
                { title: 'STT', width: 60 },
                { title: 'Tên điểm neo', dataIndex: 'name', key: 'name', width: 350, render: (name?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={name || ''}>{name || ''}</span> },
                { title: 'Vĩ độ (N)', key: 'lat', width: 205, align: 'center' as const, render: (_v: any, rec: any) => renderDmsText(rec.latitude, true) },
                { title: 'Kinh độ (E)', key: 'lng', width: 205, align: 'center' as const, render: (_v: any, rec: any) => renderDmsText(rec.longitude, false) },
              ]}
            />
          </div>
        </div>
      )}
    </Drawer>
    </div>
    </>
  );
}
