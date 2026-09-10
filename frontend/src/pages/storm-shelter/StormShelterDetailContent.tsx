import { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, Button, Modal, Tooltip, Drawer } from 'antd';

const getFilterSearchTopY = (): number => {
  if (typeof window === 'undefined') return 0;
  const filterFooter = document.querySelector('.filter-action-footer');
  if (filterFooter) {
    const rect = filterFooter.getBoundingClientRect();
    if (rect.top > 0) return Math.round(rect.top);
  }
  const searchBtn = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === 'Tìm kiếm' && !b.closest('.ant-drawer')
  );
  if (searchBtn && searchBtn.parentElement) {
    const rect = searchBtn.parentElement.getBoundingClientRect();
    if (rect.top > 0) return Math.round(rect.top);
  }
  return Math.round(window.innerHeight - 89);
};

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
  drawerTitleStyle, drawerProps, drawerCloseBtnStyle,
} from '../../themetokenchk';
import type { StormShelterArea } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';
import { fmtNum } from '../../utils/numFmt';

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

export interface StormShelterDetailContentProps {
  selectedRecord: StormShelterArea;
  orgMap: Map<string, string>;
  organizations?: Array<{ id: string; name: string; parentId?: string }>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  portOptions: Array<{ value: string; label: string }>;
  portMap?: Map<string, string>;
  buoyStationMap?: Map<string, string>;
  waterwayMap?: Map<string, string>;
  waterwayOptions?: Array<{ value: string; label: string }>;
  userMap: Map<string, string>;
  detailFiles: AttachmentFile[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  operationalStyleMap: Record<string, { color: string; label: string }>;
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

export default function StormShelterDetailContent({
  selectedRecord,
  orgMap,
  symbolMap,
  symbolImageMap,
  portOptions,
  portMap = new Map(),
  buoyStationMap = new Map(),
  waterwayMap = new Map(),
  waterwayOptions = [],
  userMap,
  detailFiles,
  ddToDms,
  approvalStyleMap,
  operationalStyleMap,
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
}: StormShelterDetailContentProps) {
  const r = selectedRecord;

  const renderDmsText = (dd: number | null | undefined, isLat: boolean): string => {
    if (dd == null || isNaN(Number(dd))) return '';
    const dms = ddToDms(Number(dd));
    return `${dms.d}° ${dms.m}' ${dms.s}" ${isLat ? 'N' : 'E'}`;
  };

  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [waterAreaOpen, setWaterAreaOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

  const [viewingWaterArea, setViewingWaterArea] = useState<any | null>(null);
  const [viewingMapParamsOpen, setViewingMapParamsOpen] = useState(true);
  const [viewingAnchorPointsOpen, setViewingAnchorPointsOpen] = useState(true);

  const viewingAnchorBoxRef = useRef<HTMLDivElement>(null);
  const [viewingAnchorBoxHeight, setViewingAnchorBoxHeight] = useState<number | undefined>();

  const updateViewingAnchorBoxHeight = useCallback(() => {
    if (!viewingWaterArea || !viewingAnchorPointsOpen || !viewingAnchorBoxRef.current) return;
    const targetY = getFilterSearchTopY();
    const boxRect = viewingAnchorBoxRef.current.getBoundingClientRect();
    if (boxRect.top > 0) {
      const h = Math.round(targetY - boxRect.top);
      setViewingAnchorBoxHeight(Math.max(230, h));
    }
  }, [viewingWaterArea, viewingAnchorPointsOpen]);

  useEffect(() => {
    if (!viewingWaterArea || !viewingAnchorPointsOpen) return;
    updateViewingAnchorBoxHeight();
    const t1 = setTimeout(updateViewingAnchorBoxHeight, 60);
    const t2 = setTimeout(updateViewingAnchorBoxHeight, 180);
    const t3 = setTimeout(updateViewingAnchorBoxHeight, 350);
    window.addEventListener('resize', updateViewingAnchorBoxHeight);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', updateViewingAnchorBoxHeight);
    };
  }, [viewingWaterArea, viewingAnchorPointsOpen, viewingMapParamsOpen, updateViewingAnchorBoxHeight]);

  const viewingAnchorTableScrollY = viewingAnchorBoxHeight ? Math.max(70, viewingAnchorBoxHeight - 148) : 'calc(100vh - 500px)';
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<any>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const res = await api.get(`/v1/storm-shelter/${r.id}/attachments/${fileId}/download`, { responseType: 'blob' });
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
        const res = await api.get(`/v1/storm-shelter/${r.id}/attachments/${file.id}/download`, { responseType: 'blob' });
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
  const waterwayLabel = waterwayMap?.get(r.navigationChannelId || '') || waterwayOptions.find(o => o.value === r.navigationChannelId)?.label || r.navigationChannelId || '';
  const provinceLabel = (r as any).province || (r.provinceId ? (VIETNAM_PROVINCES[Number(r.provinceId) - 1] || String(r.provinceId)) : '');

  return (
    <>
    <style>{`
      .storm-shelter-detail-content-wrapper,
      .storm-shelter-detail-content-wrapper .chk-detail-label,
      .storm-shelter-detail-content-wrapper .chk-detail-value,
      .storm-shelter-detail-content-wrapper .ant-table,
      .storm-shelter-detail-content-wrapper .ant-table-cell,
      .storm-shelter-detail-content-wrapper .ant-table-thead > tr > th,
      .storm-shelter-detail-content-wrapper .ant-tabs-tab,
      .storm-shelter-detail-content-wrapper .ant-btn,
      .storm-shelter-detail-content-wrapper .ant-select,
      .storm-shelter-detail-content-wrapper .ant-select-selection-item,
      .storm-shelter-detail-content-wrapper .ant-select-item {
        font-size: 13.5px !important;
      }

      .storm-shelter-detail-content-wrapper .chk-detail-row {
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
      .storm-shelter-detail-content-wrapper .chk-detail-row:last-child {
        border-bottom: none !important;
      }
      .storm-shelter-detail-content-wrapper .chk-detail-row--full { grid-column: 1 / -1 !important; }
      .storm-shelter-detail-content-wrapper .chk-detail-label,
      .storm-shelter-detail-content-wrapper .sec-col1-label,
      .storm-shelter-detail-content-wrapper .chk-detail-row .sec-col1-label,
      .storm-shelter-detail-content-wrapper .chk-detail-row--full .chk-detail-label {
        width: 215px !important;
        min-width: 215px !important;
        max-width: 215px !important;
        flex-shrink: 0 !important;
        color: ${colors.sidebarBg} !important;
        font-weight: 600 !important;
        font-size: 13.5px !important;
        text-align: left !important;
        line-height: 1.5 !important;
        align-self: flex-start !important;
        white-space: normal !important;
      }
      .storm-shelter-detail-content-wrapper .chk-detail-row--full .chk-detail-label {
        width: auto !important;
        min-width: 220px !important;
        max-width: 320px !important;
        white-space: nowrap !important;
      }
      .storm-shelter-detail-content-wrapper .chk-detail-row .sec-col2-label {
        width: 250px !important;
        min-width: 250px !important;
        max-width: 250px !important;
        flex-shrink: 0 !important;
        align-self: flex-start !important;
        white-space: normal !important;
      }
      .storm-shelter-detail-content-wrapper .chk-detail-label::after {
        content: ':' !important;
        margin-left: 1px !important;
        margin-right: 4px !important;
      }
      .storm-shelter-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-label {
        width: auto !important;
        min-width: auto !important;
        max-width: none !important;
        flex-shrink: 0 !important;
      }
      .storm-shelter-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-value {
        flex: 1 1 auto !important;
        min-width: 0 !important;
        justify-content: flex-start !important;
        white-space: nowrap !important;
      }
      .storm-shelter-detail-content-wrapper .chk-detail-value {
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
      .storm-shelter-detail-content-wrapper .chk-detail-grid {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
        column-gap: 28px !important;
        row-gap: 0 !important;
        align-items: stretch !important;
      }

      @media (max-width: 960px) {
        .storm-shelter-detail-content-wrapper .chk-detail-grid {
          grid-template-columns: 1fr !important;
          column-gap: 0 !important;
        }
        .storm-shelter-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 !important;
        }
        .storm-shelter-detail-content-wrapper .chk-detail-label,
        .storm-shelter-detail-content-wrapper .sec-col1-label,
        .storm-shelter-detail-content-wrapper .chk-detail-row .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
        }
      }

      @media (max-width: 640px) {
        .storm-shelter-detail-content-wrapper .chk-detail-row {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 3px !important;
          padding: 6px 0 !important;
        }
        .storm-shelter-detail-content-wrapper .chk-detail-label,
        .storm-shelter-detail-content-wrapper .sec-col1-label,
        .storm-shelter-detail-content-wrapper .chk-detail-row .sec-col2-label {
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
        }
        .storm-shelter-detail-content-wrapper .chk-detail-value {
          width: 100% !important;
          min-width: 100% !important;
        }
      }
    `}</style>
    <div className="storm-shelter-detail-content-wrapper">
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
                    ['Mã khu tránh, trú bão', <span key="code" style={{ ...statusBadgeStyle(actionPrimary), whiteSpace: 'nowrap' }}>{r.stormShelterCode || ''}</span>],
                    ['Tên khu tránh, trú bão', <span key="name" style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{r.stormShelterName || ''}</span>],
                    ['Đơn vị quản lý', <span key="org" style={{ fontWeight: fontWeightBold }}>{orgMap.get(r.orgUnitId || '') || r.orgUnitId || ''}</span>],
                    ['Thuộc cảng biển', <span key="port" style={{ fontWeight: fontWeightBold }}>{portLabel}</span>],
                    ['Thuộc bến phao', buoyLabel],
                    ['Thuộc luồng hàng hải', waterwayLabel],
                    ['Địa điểm (Tỉnh/Thành Phố)', provinceLabel],
                    ['Tình trạng', (() => {
                      const s = r.operationalStatus;
                      const b = s && operationalStyleMap[s];
                      return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : '';
                    })()],
                  ].map(([label, value], index) => {
                    const isCode = label === 'Mã khu tránh, trú bão';
                    const isLongCode = isCode && ((r.stormShelterCode || '').trim().length > 20);
                    return (
                      <div key={label as string} className={`chk-detail-row ${isLongCode ? 'chk-detail-row--compact' : ''}`}>
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
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Thông số kỹ thuật & Năng lực khai thác</span></div>
                </div>
                <div className="chk-detail-grid">
                  {[
                    ['Hình dạng', r.shapeDescription || ''],
                    ['Diện tích (ha)', formatNumericDisplay(r.area)],
                    ['Độ sâu khu nước theo thiết kế (m)', formatNumericDisplay(r.designWaterDepth)],
                    ['Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)', formatNumericDisplay(r.currentWaterDepth)],
                    ['Cao độ đáy bến thiết kế', formatNumericDisplay(r.bottomElevationDesign)],
                    ['Cỡ tàu khai thác theo công bố (DWT)', formatNumericDisplay(r.maxVesselDWT)],
                    ['Số lượng khu tránh, trú bão đang khai thác', formatNumericDisplay(r.activeStormShelterCount)],
                    ['Số lượng khu tránh, trú bão đã công bố', formatNumericDisplay(r.publishedStormShelterCount)],
                    ['Phân loại', r.classification || ''],
                    ['Số lượng khu tránh, trú bão đang được thỏa thuận đầu tư xây dựng', formatNumericDisplay(r.underInvestmentStormShelterCount)],
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
              </div>

              {/* Section 3: Thông tin công bố mở, đưa vào sử dụng */}
              <div style={{ ...sectionBoxStyle, padding: announcementOpen ? sectionBoxStyle.padding : spaceMd }}>
                <div onClick={() => setAnnouncementOpen(!announcementOpen)} style={{ ...sectionHeaderStyle, marginBottom: announcementOpen ? spaceMd : 0, paddingBottom: announcementOpen ? spaceSm : 0, borderBottom: announcementOpen ? sectionHeaderStyle.borderBottom : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><FileTextOutlined style={{ color: actionPrimary }} /><span>Thông tin công bố mở, đưa vào sử dụng</span></div>
                  {announcementOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {announcementOpen && (
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Thời điểm công bố mở, đưa vào sử dụng</span>
                      <span className="chk-detail-value">{formatDateOnly(r.openingAnnouncementDate)}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Quyết định công bố/ Văn bản cho phép khai thác</span>
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.publicDecision || (r as any).openingDecision || ''}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Văn bản thỏa thuận đầu tư xây dựng</span>
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.investmentAgreement || (r as any).investmentAgreementDoc || ''}</span>
                    </div>
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
                  <>
                    {(r as any).waterAreaNeutralScope && (
                      <div className="chk-detail-grid" style={{ marginBottom: (Array.isArray(r.mooringWaterAreas) && r.mooringWaterAreas.length > 0) ? spaceSm : 0 }}>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-col1-label">Phạm vi khu nước neo buộc tàu</span>
                          <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{(r as any).waterAreaNeutralScope}</span>
                        </div>
                      </div>
                    )}
                    <DetailTable
                      size="small"
                      dataSource={(Array.isArray(r.mooringWaterAreas) ? r.mooringWaterAreas : []).map((wa, i) => ({ ...wa, key: i }))}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(rec: any) => rec.key}
                      scrollY={130}
                      pageSize={5}
                      pageSizeOptions={[5, 10, 20]}
                      columns={[
                        { title: 'STT', width: 50, align: 'center' as const },
                        {
                          title: 'Phạm vi khu nước neo buộc tàu',
                          dataIndex: 'description',
                          key: 'description',
                          render: (d?: string, rec?: any) => (
                            <a
                              style={{
                                fontSize: fontSizeMd,
                                color: actionPrimary,
                                fontWeight: fontWeightBold,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                cursor: 'pointer',
                              }}
                              title={d || ''}
                              onClick={() => setViewingWaterArea(rec)}
                            >
                              {d || ''}
                            </a>
                          ),
                        },
                        {
                          title: 'Thao tác',
                          key: 'actions',
                          width: 100,
                          align: 'center' as const,
                          render: (_v: any, rec: any) => (
                            <Tooltip title="Xem chi tiết điểm neo">
                              <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined />}
                                style={{ color: actionPrimary, fontSize: fontSizeMd }}
                                onClick={() => setViewingWaterArea(rec)}
                              />
                            </Tooltip>
                          ),
                        },
                      ]}
                    />
                  </>
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
                    {(() => {
                      const isPendingPortAuthority = r.approvalStatus === 'PENDING_APPROVAL' || r.approvalStatus === 'CHO_PHE_DUYET' || approvalStyleMap[r.approvalStatus || '']?.label === 'Chờ phê duyệt cấp Cảng vụ/Chi cục';
                      return (
                        <div className={`chk-detail-row ${isPendingPortAuthority ? 'chk-detail-row--compact' : ''}`}>
                          <span className="chk-detail-label sec-col1-label">Trạng thái</span>
                          <span className="chk-detail-value">
                            {r.approvalStatus && approvalStyleMap[r.approvalStatus] ? (
                              <span style={statusBadgeStyle(approvalStyleMap[r.approvalStatus].color)}>
                                {approvalStyleMap[r.approvalStatus].label}
                              </span>
                            ) : ''}
                          </span>
                        </div>
                      );
                    })()}
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
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.portAuthorityApprovalContent || ''}</span>
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
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.departmentApprovalContent || ''}</span>
                    </div>
                    {r.rejectionReason && (
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label" style={{ color: '#E34948' }}>Lý do từ chối</span>
                        <span className="chk-detail-value" style={{ color: '#E34948', fontWeight: fontWeightBold }}>{r.rejectionReason}</span>
                      </div>
                    )}
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
                    ['Biểu tượng', (() => { const symbolId = r.mapSymbolId || (r as any).bieuTuongId || ''; const name = symbolMap.get(symbolId) || symbolId || ''; const image = symbolImageMap.get(symbolId); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: spaceSm }}>{image ? <img src={image} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{name}</span>; })()],
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
                    { title: 'STT', width: 50, align: 'center' as const },
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
                <span style={detailLabelStyle}>File đính kèm</span>
              </div>
              <DetailTable
                dataSource={detailFiles.map((f) => ({ ...f }))}
                emptyText="Chưa có tài liệu đính kèm"
                scrollY={detailFiles.length === 0 ? undefined : DRAWER_TABLE_SCROLL_Y.detailView}
                columns={[
                  { title: 'STT', width: 50, align: 'center' as const },
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
                    align: 'left' as const,
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
                    align: 'left' as const,
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
                      { title: 'STT', width: 50, align: 'center' as const },
                      { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v, rec) => v || rec.code || '' },
                      { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v, rec) => v || rec.name || '' },
                      { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'start', width: 150, align: 'left' as const, render: (v, rec) => fmtDateTime(v || rec.startTime || rec.start || null) },
                      { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'end', width: 150, align: 'left' as const, render: (v, rec) => fmtDateTime(v || rec.endTime || rec.end || null) },
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
                      { title: 'STT', width: 50, align: 'center' as const },
                      { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v, rec) => v || rec.code || '' },
                      { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v, rec) => v || rec.name || '' },
                      { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'start', width: 150, align: 'left' as const, render: (v, rec) => fmtDateTime(v || rec.start || rec.startDate || null) },
                      { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'end', width: 150, align: 'left' as const, render: (v, rec) => fmtDateTime(v || rec.end || rec.endDate || null) },
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
                      { title: 'STT', width: 50, align: 'center' as const },
                      { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v, rec) => v || rec.code || '' },
                      { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v, rec) => v || rec.type || '' },
                      { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v) => v || '' },
                      { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'left' as const, render: (v, rec) => fmtDateTime(v || rec.time || null) },
                    ]}
                  />
                )}
              </div>
            </div>
          ),
        },
      ]}
    />

    {/* GIS Location Selector Modal — xem vị trí trên bản đồ chuyên dụng */}
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
      {...drawerProps}
      rootClassName="storm-shelter-drawer-scope"
      className="storm-shelter-drawer-scope"
      size={1000}
      title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chi tiết thông tin khu nước neo buộc tàu</span>}
      open={!!viewingWaterArea}
      onClose={() => setViewingWaterArea(null)}
      destroyOnClose
      push={false}
      extra={<Button type="text" onClick={() => setViewingWaterArea(null)} style={drawerCloseBtnStyle}>✕</Button>}
      footer={null}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '0 24px 12px 24px' },
      }}
    >
      {viewingWaterArea && (
        <div className="storm-shelter-detail-content-wrapper">
          <style>{`
            .storm-shelter-detail-content-wrapper,
            .storm-shelter-detail-content-wrapper .chk-detail-label,
            .storm-shelter-detail-content-wrapper .chk-detail-value {
              font-size: 13.5px !important;
            }
            .storm-shelter-detail-content-wrapper .chk-detail-grid {
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
              column-gap: 28px !important;
              row-gap: 0 !important;
              align-items: stretch !important;
            }
            .storm-shelter-detail-content-wrapper .chk-detail-row {
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
            .storm-shelter-detail-content-wrapper .chk-detail-row:last-child {
              border-bottom: none !important;
            }
            .storm-shelter-detail-content-wrapper .chk-detail-row--full {
              grid-column: 1 / -1 !important;
            }
            .storm-shelter-detail-content-wrapper .chk-detail-label,
            .storm-shelter-detail-content-wrapper .sec-col1-label,
            .storm-shelter-detail-content-wrapper .chk-detail-row .sec-col1-label,
            .storm-shelter-detail-content-wrapper .chk-detail-row--full .chk-detail-label {
              width: 215px !important;
              min-width: 215px !important;
              max-width: 215px !important;
              flex-shrink: 0 !important;
              color: ${colors.sidebarBg} !important;
              font-weight: 600 !important;
              font-size: 13.5px !important;
              text-align: left !important;
              line-height: 1.5 !important;
              align-self: flex-start !important;
              white-space: normal !important;
            }
            .storm-shelter-detail-content-wrapper .chk-detail-row--full .chk-detail-label {
              width: auto !important;
              min-width: 220px !important;
              max-width: 320px !important;
              white-space: nowrap !important;
            }
            .storm-shelter-detail-content-wrapper .chk-detail-row .sec-col2-label {
              width: 250px !important;
              min-width: 250px !important;
              max-width: 250px !important;
              flex-shrink: 0 !important;
              color: ${colors.sidebarBg} !important;
              font-weight: 600 !important;
              font-size: 13.5px !important;
              text-align: left !important;
              line-height: 1.5 !important;
              align-self: flex-start !important;
              white-space: normal !important;
            }
            .storm-shelter-detail-content-wrapper .chk-detail-label::after {
              content: ':' !important;
              margin-left: 1px !important;
              margin-right: 4px !important;
            }
            .storm-shelter-detail-content-wrapper .chk-detail-value {
              flex: 1 1 auto !important;
              color: #1e293b !important;
              font-size: 13.5px !important;
              font-weight: 500 !important;
              line-height: 1.5 !important;
              min-width: 0 !important;
              word-break: break-word !important;
            }
          `}</style>

          <div style={{ ...generalScrollerStyle, maxHeight: 'calc(100vh - 72px)', paddingTop: 10, paddingRight: 4, overflowY: 'auto', overflowX: 'hidden' }}>
            {/* Box 1: Thông số đối tượng bản đồ */}
            <div style={{ ...sectionBoxStyle, padding: viewingMapParamsOpen ? sectionBoxStyle.padding : '12px 18px' }}>
              <div
                onClick={() => setViewingMapParamsOpen(!viewingMapParamsOpen)}
                style={{
                  ...sectionHeaderStyle,
                  marginBottom: viewingMapParamsOpen ? 10 : 0,
                  paddingBottom: viewingMapParamsOpen ? 8 : 0,
                  borderBottom: viewingMapParamsOpen ? sectionHeaderStyle.borderBottom : 'none',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={sectionTitleStyle}>
                  <EnvironmentOutlined style={{ color: actionPrimary }} />
                  <span>Thông số đối tượng bản đồ</span>
                </div>
                {viewingMapParamsOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
              </div>
              {viewingMapParamsOpen && (
                <div className="chk-detail-grid">
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label sec-col1-label">Phạm vi khu nước neo buộc tàu</span>
                    <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 110, overflowY: 'auto' }}>
                      {viewingWaterArea.description || ''}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col1-label">Loại đối tượng</span>
                    <span className="chk-detail-value">
                      {(() => {
                        const m: Record<string, string> = {
                          POINT: 'Đối tượng điểm',
                          LINE: 'Đối tượng đường',
                          POLYGON: 'Đối tượng vùng',
                        };
                        return viewingWaterArea.geometryType ? m[viewingWaterArea.geometryType] || viewingWaterArea.geometryType : '';
                      })()}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col2-label">Biểu tượng</span>
                    <span className="chk-detail-value">
                      {(() => {
                        const symName = symbolMap.get(viewingWaterArea.mapSymbolId || '') || viewingWaterArea.mapSymbolId || '';
                        const symImg = symbolImageMap.get(viewingWaterArea.mapSymbolId || '');
                        const symImgSrc = symImg ? (symImg.startsWith('data:') ? symImg : `data:image/png;base64,${symImg}`) : undefined;
                        return symName ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            {symImgSrc ? (
                              <img
                                src={symImgSrc}
                                alt=""
                                style={{ width: 22, height: 22, objectFit: 'contain' }}
                              />
                            ) : null}
                            {symName}
                          </span>
                        ) : '';
                      })()}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col1-label">Hệ quy chiếu</span>
                    <span className="chk-detail-value">
                      {viewingWaterArea.coordinateSystem === 1
                        ? 'WGS-84'
                        : viewingWaterArea.coordinateSystem === 2
                        ? 'VN-2000'
                        : (viewingWaterArea.coordinateSystem || '')}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col2-label">Quy tắc hiển thị</span>
                    <span className="chk-detail-value">
                      {viewingWaterArea.displayRule || 'Độ, phút, giây (DMS)'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Box 2: Tọa độ điểm neo */}
            <div
              ref={viewingAnchorBoxRef}
              style={{
                ...sectionBoxStyle,
                padding: viewingAnchorPointsOpen ? sectionBoxStyle.padding : '12px 18px',
                height: viewingAnchorPointsOpen ? (viewingAnchorBoxHeight ? `${viewingAnchorBoxHeight}px` : undefined) : 'auto',
                minHeight: viewingAnchorPointsOpen ? 230 : undefined,
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                marginBottom: 0,
              }}
            >
              <div
                onClick={() => setViewingAnchorPointsOpen(!viewingAnchorPointsOpen)}
                style={{
                  ...sectionHeaderStyle,
                  marginBottom: viewingAnchorPointsOpen ? 10 : 0,
                  paddingBottom: viewingAnchorPointsOpen ? 8 : 0,
                  borderBottom: viewingAnchorPointsOpen ? sectionHeaderStyle.borderBottom : 'none',
                  cursor: 'pointer',
                  userSelect: 'none',
                  flexShrink: 0,
                }}
              >
                <div style={sectionTitleStyle}>
                  <EnvironmentOutlined style={{ color: actionPrimary }} />
                  <span>Tọa độ điểm neo ({(viewingWaterArea.anchorPoints || []).length})</span>
                </div>
                {viewingAnchorPointsOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
              </div>
              {viewingAnchorPointsOpen && (
                <DetailTable
                  size="small"
                  scroll={{ x: 590 }}
                  pageSize={10}
                  pageSizeOptions={[5, 10, 20, 50]}
                  dataSource={(Array.isArray(viewingWaterArea.anchorPoints) ? viewingWaterArea.anchorPoints : []).map((p: any, i: number) => ({ ...p, key: i }))}
                  emptyText="Chưa có dữ liệu tọa độ điểm neo"
                  rowKey={(rec: any) => rec.key}
                  scrollY={viewingAnchorTableScrollY}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                  columns={[
                    {
                      title: 'STT',
                      width: 50,
                      align: 'center' as const,
                      render: (_: unknown, __: unknown, idx: number) => idx + 1,
                    },
                    {
                      title: 'Tên điểm neo',
                      dataIndex: 'name',
                      key: 'name',
                      width: 180,
                      render: (name?: string) => (
                        <span
                          style={{
                            fontSize: fontSizeMd,
                            color: textPrimary,
                            fontWeight: fontWeightBold,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          }}
                          title={name || ''}
                        >
                          {name || ''}
                        </span>
                      ),
                    },
                    {
                      title: 'Vĩ độ (Latitude - N)',
                      key: 'lat',
                      width: 180,
                      align: 'center' as const,
                      render: (_v: unknown, rec: any) => renderDmsText(rec.latitude, true),
                    },
                    {
                      title: 'Kinh độ (Longitude - E)',
                      key: 'lng',
                      width: 180,
                      align: 'center' as const,
                      render: (_v: unknown, rec: any) => renderDmsText(rec.longitude, false),
                    },
                  ]}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Drawer>
    </div>
    </>
  );
}
