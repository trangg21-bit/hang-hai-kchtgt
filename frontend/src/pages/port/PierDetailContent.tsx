import { useState } from 'react';
import { Tabs, Select, Tooltip, Button, Modal } from 'antd';
import {
  AuditOutlined, BankOutlined, DownloadOutlined, DownOutlined, EnvironmentOutlined, EyeOutlined,
  FileImageOutlined,
  FileOutlined, FileTextOutlined, RightOutlined, SlidersOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import {
  detailLabelStyle, generalScrollerStyle, sectionBoxStyle,
  sectionHeaderStyle, sectionTitleStyle,
} from '../../components/detail-drawer/detailSkin';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import {
  colors,
  actionPrimary, textTertiary, surfaceCard,
  fontSizeSm, fontSizeLg, fontWeightBold,
  spaceSm, spaceMd, spaceFormField, radiusPill,
  outlineButtonStyle, primaryButtonStyle, statusBadgeStyle,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';

// Đồng bộ cỡ chữ 13.5px toàn màn chi tiết như Bến cảng (BerthDetailContent.tsx)
// — theme fontSizeMd mặc định = 13 nên header 'Tọa độ GPS' nhỏ hơn.
const fontSizeMd = 13.5;

const isImageFile = (fileName?: string): boolean => {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff'].includes(ext || '');
};
import type { Pier } from '../../types/port';
import { fmtNum } from '../../utils/numFmt';
import { formatOperationalFunction } from '../../constants/operationalFunction';

interface AttachmentFile {
  id: string;
  fileName?: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

interface DetailTableRow {
  id?: string;
  name?: string;
  code?: string;
  infraName?: string;
  infraType?: string;
  structureType?: string;
  type?: string;
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
}

interface PierDetail extends Pier {
  coordinateSystem?: number;
  latitude?: number;
  longitude?: number;
  portAuthorityApprovalContent?: string;
  departmentApprovalContent?: string;
}

export interface PierDetailContentProps {
  selectedRecord: PierDetail;
  orgMap: Map<string, string>;
  portMap: Map<string, string>;
  berthOptions: Array<{ value: string; label: string }>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  detailFiles: AttachmentFile[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  operationalStyleMap: Record<string, { color: string; label: string }>;
  userMap: Map<string, string>;
  waterwayMap?: Map<string, string>;
  berthDetail?: { berthCode?: string; berthName?: string } | null;
  organizations: Array<{ id: string; name: string; code?: string; parentId?: string }>;
  infrastructureList?: DetailTableRow[];
  operationPlanList?: DetailTableRow[];
  maintenancePlanList?: DetailTableRow[];
  incidentList?: DetailTableRow[];
  onViewInfraDetail?: (id: string) => void;
}


function formatDateOnly(d: string | null | undefined): string {
  if (!d) return '';
  try { return dayjs(d).format('DD/MM/YYYY'); } catch { return d; }
}

function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '';
  try { return dayjs(d).format('DD/MM/YYYY HH:mm:ss'); } catch { return d; }
}

/** Định dạng Tháng/Năm (MM/YYYY) — lưu chuỗi "MM/YYYY" không qua dayjs (dayjs không parse MM/YYYY → "Invalid Date"). */
function formatMonthYear(d: string | null | undefined): string {
  if (!d) return '';
  const t = String(d).trim();
  if (/^\d{1,2}\/\d{4}$/.test(t)) return t;                 // "07/2026" giữ nguyên
  const num = Number(t);                                    // đôi khi backend gửi số thứ tự (miền thời gian)
  if (Number.isFinite(num) && num >= 190000 && num <= 999912) {
    const m = Math.floor(num / 10000); const y = num % 10000;
    if (m >= 1 && m <= 12) return `${String(m).padStart(2, '0')}/${y}`;
  }
  return '';
}

const constructionGradeLabel = (grade?: number): string => {
  const labels: Record<number, string> = {
    1: 'Cấp đặc biệt', 2: 'Cấp 1', 3: 'Cấp 2', 4: 'Cấp 3', 5: 'Cấp 4',
  };
  return grade != null ? labels[grade] || String(grade) : '';
};

const structureTypeLabel = (type?: number): string => {
  const labels: Record<number, string> = {
    1: 'Kết cấu bệ cọc cao', 2: 'Kết cấu cường từ', 3: 'Kết cấu trọng lực', 4: 'Kết cấu khác',
  };
  return type != null ? labels[type] || String(type) : '';
};

const formatNumericDisplay = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  return fmtNum(value) || String(value);
};

// Loại kết cấu hạ tầng thuộc cầu cảng (đọc-only, dữ liệu từ infrastructureList)
const PIER_INFRA_TYPE_OPTIONS = [{ value: 'COSO_SUACHUA', label: 'Cơ sở sửa chữa, đóng tàu' }];

// Parse tọa độ GPS: ưu tiên WKT (coordinates) từ backend — hỗ trợ POINT/MULTIPOINT/LINESTRING/POLYGON;
// fallback sang latitude/longitude (backend chỉ parse được cho POINT).
const parseGisCoordinates = (record: PierDetail): Array<{ lat: number; lng: number }> => {
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

export default function PierDetailContent({
  selectedRecord, orgMap, portMap, berthOptions, symbolMap, symbolImageMap,
  detailFiles, ddToDms, approvalStyleMap, operationalStyleMap,
  userMap, waterwayMap, berthDetail,
  infrastructureList = [],
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
  onViewInfraDetail,
}: PierDetailContentProps) {
  const r = selectedRecord;
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [athhPlanOpen, setAthhPlanOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [mooringScopeOpen, setMooringScopeOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [infraTypeFilter, setInfraTypeFilter] = useState<string>('');
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<any>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const res = await api.get(`/v1/piers/${r.id}/attachments/${fileId}/download`, { responseType: 'blob' });
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
        const res = await api.get(`/v1/piers/${r.id}/attachments/${file.id}/download`, { responseType: 'blob' });
        setPreviewImageUrl(window.URL.createObjectURL(new Blob([res.data])));
      }
    } catch {
      toast.error('Không thể tải hình ảnh để xem chi tiết');
    } finally {
      setPreviewLoading(false);
    }
  };
  const infraRows = [...infrastructureList].filter((it) => {
    if (!infraTypeFilter || infraTypeFilter === 'ALL') return true;
    const t = it?.infraType ?? it?.structureType ?? it?.type;
    if (t === undefined || t === null || t === '') return true;
    return String(t).toUpperCase() === infraTypeFilter.toUpperCase();
  });

  const berthLabel = berthOptions.find(o => o.value === r.berthId)?.label || r.berthName || r.berthId || '';
  const portLabel = r.portId ? (portMap.get(r.portId) || r.portId) : '';

  const coords = parseGisCoordinates(r);

  return (
    <>
    <style>{`
      .pier-detail-content-wrapper,
      .pier-detail-content-wrapper .chk-detail-label,
      .pier-detail-content-wrapper .chk-detail-value,
      .pier-detail-content-wrapper .ant-table,
      .pier-detail-content-wrapper .ant-table-cell,
      .pier-detail-content-wrapper .ant-table-thead > tr > th,
      .pier-detail-content-wrapper .ant-tabs-tab,
      .pier-detail-content-wrapper .ant-btn,
      .pier-detail-content-wrapper .ant-select,
      .pier-detail-content-wrapper .ant-select-selection-item,
      .pier-detail-content-wrapper .ant-select-item {
        font-size: 13.5px !important;
      }

      .pier-detail-content-wrapper .chk-detail-row {
        display: flex !important;
        align-items: flex-start !important;
        min-height: 36px !important;
        padding: 7px 0 !important;
        border-bottom: 1px solid #f1f5f9 !important;
        line-height: 1.5 !important;
        gap: 10px !important;
      }
      .pier-detail-content-wrapper .chk-detail-row--full { grid-column: 1 / -1 !important; }
      .pier-detail-content-wrapper .chk-detail-label,
      .pier-detail-content-wrapper .sec-col1-label,
      .pier-detail-content-wrapper .chk-detail-row .sec-col1-label,
      .pier-detail-content-wrapper .chk-detail-row--full .chk-detail-label {
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
      .pier-detail-content-wrapper .chk-detail-row .sec-col2-label {
        width: 250px !important;
        min-width: 250px !important;
        max-width: 250px !important;
        flex-shrink: 0 !important;
        align-self: flex-start !important;
        white-space: normal !important;
      }
      .pier-detail-content-wrapper .chk-detail-label::after {
        content: ':' !important;
        margin-left: 1px !important;
        margin-right: 4px !important;
      }
      .pier-detail-content-wrapper .chk-detail-row.chk-detail-row--pier-code .chk-detail-label,
      .pier-detail-content-wrapper .chk-detail-label.sec-pier-code-label {
        width: auto !important;
        min-width: auto !important;
        max-width: none !important;
        flex-shrink: 0 !important;
      }
      .pier-detail-content-wrapper .chk-detail-row.chk-detail-row--pier-code .chk-detail-value {
        margin-left: 28px !important;
        justify-content: flex-start !important;
      }
      .pier-detail-content-wrapper .chk-detail-value {
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
      .pier-detail-content-wrapper .chk-detail-grid {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
        column-gap: 28px !important;
        row-gap: 0 !important;
        align-items: stretch !important;
      }

      /* Khi dữ liệu dài, tự xuống dòng trong đúng ô value — tránh đè lên cột/hàng kế tiếp */
      .pier-detail-content-wrapper .chk-detail-row {
        align-items: flex-start !important;
        min-height: 36px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: visible !important;
      }
      .pier-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-label {
        width: auto !important;
        min-width: auto !important;
        max-width: none !important;
        flex-shrink: 0 !important;
      }
      .pier-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-value {
        flex: 1 1 auto !important;
        min-width: 0 !important;
        justify-content: flex-start !important;
        white-space: nowrap !important;
      }
      .pier-detail-content-wrapper .chk-detail-row .chk-detail-label {
        align-self: flex-start !important;
        white-space: normal !important;
        line-height: 1.5 !important;
      }

      @media (max-width: 960px) {
        .pier-detail-content-wrapper .chk-detail-grid {
          grid-template-columns: 1fr !important;
          column-gap: 0 !important;
        }
        .pier-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 !important;
        }
        .pier-detail-content-wrapper .chk-detail-label,
        .pier-detail-content-wrapper .sec-col1-label,
        .pier-detail-content-wrapper .chk-detail-row .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
        }
      }

      @media (max-width: 640px) {
        .pier-detail-content-wrapper .chk-detail-row {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 3px !important;
          padding: 6px 0 !important;
        }
        .pier-detail-content-wrapper .chk-detail-label,
        .pier-detail-content-wrapper .sec-col1-label,
        .pier-detail-content-wrapper .chk-detail-row .sec-col2-label {
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
        }
        .pier-detail-content-wrapper .chk-detail-value {
          width: 100% !important;
          min-width: 100% !important;
        }
      }
    `}</style>
    <div className="pier-detail-content-wrapper">
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={generalScrollerStyle}>
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}><BankOutlined style={{ color: actionPrimary }} /><span>Thông tin cơ bản & Quản lý vận hành</span></div>
                </div>
                <div className="chk-detail-grid">
                  {[
                    ['Mã cầu cảng', <span key="pierCode" style={{ ...statusBadgeStyle(actionPrimary), whiteSpace: 'nowrap' }}>{r.pierCode || ''}</span>],
                    ['Tên cầu cảng', <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{r.pierName || ''}</span>],
                    ['Đơn vị quản lý', <span style={{ fontWeight: fontWeightBold }}>{orgMap.get(r.orgUnitId || '') || r.orgUnitId || ''}</span>],
                    ['Thuộc cảng biển', <span style={{ fontWeight: fontWeightBold }}>{portLabel}</span>],
                    ['Thuộc bến cảng', berthLabel],
                    ['Thuộc luồng hàng hải', waterwayMap?.get(r.navigationChannelId || '') || r.navigationChannelId || ''],
                    ['Địa điểm (Tỉnh/Thành Phố)', r.province || ''],
                    ['Tình trạng', (() => { const s = r.operationalStatus; const b = s && operationalStyleMap[s]; return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : ''; })()],
                  ].map(([label, value], index) => {
                    const isPierCode = label === 'Mã cầu cảng';
                    const isLongCode = isPierCode && ((r.pierCode || '').trim().length > 20);
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

              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Thông số kỹ thuật & Năng lực khai thác</span></div>
                </div>
                <div className="chk-detail-grid">
                  {[
                    ['Phân cấp công trình', constructionGradeLabel(r.constructionGrade)],
                    ['Loại kết cấu cầu cảng', structureTypeLabel(r.structureType)],
                    ['Công năng khai thác', formatOperationalFunction(r.operationalFunction, '')],
                    ['Chiều dài (m)', formatNumericDisplay(r.length)],
                    ['Chiều rộng (m)', formatNumericDisplay(r.width)],
                    ['Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)', formatNumericDisplay(r.currentWaterDepth)],
                    ['Cao độ đáy bến thiết kế', formatNumericDisplay(r.designBedElevation)],
                    ['Cỡ tàu khai thác theo công bố (DWT)', formatNumericDisplay(r.publishedVesselDWT)],
                    ['Thời điểm phê duyệt quy trình bảo trì công trình', formatMonthYear(r.maintenanceApprovalDate)],
                    ['Thời điểm được chấp thuận hồ sơ báo cáo đánh giá ATCT (gần nhất)', formatMonthYear(r.safetyAssessmentDate)],
                    ['Thời điểm kiểm định gần nhất', formatMonthYear(r.lastInspectionDate)],
                    ['Sản lượng hàng thông qua', r.cargoThroughput != null ? `${formatNumericDisplay(r.cargoThroughput)} tấn` : ''],
                    ['Số lượng cầu cảng đang khai thác', formatNumericDisplay(r.operatingPierCount)],
                    ['Số lượng cầu cảng đã công bố', formatNumericDisplay(r.publishedPierCount)],
                    ['Số lượng cầu cảng đang được thỏa thuận đầu tư xây dựng', formatNumericDisplay(r.investmentAgreementPierCount)],
                    ['Tiếp nhận tàu có trọng tải lớn hơn thông số tại quyết định công bố', r.receivesLargeVessel ? 'Có' : 'Không'],
                  ].map(([label, value], index) => (
                    <div key={label as string} className="chk-detail-row">
                      <span className={`chk-detail-label ${index % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{label}</span>
                      <span className="chk-detail-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...sectionBoxStyle, padding: athhPlanOpen ? sectionBoxStyle.padding : spaceMd }}>
                <div onClick={() => setAthhPlanOpen(!athhPlanOpen)} style={{ ...sectionHeaderStyle, marginBottom: athhPlanOpen ? spaceMd : 0, paddingBottom: athhPlanOpen ? spaceSm : 0, borderBottom: athhPlanOpen ? sectionHeaderStyle.borderBottom : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><FileTextOutlined style={{ color: actionPrimary }} /><span>Thông tin phương án bảo đảm ATHH đã duyệt</span></div>
                  {athhPlanOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {athhPlanOpen && <div className="chk-detail-grid">
                  {[['Số văn bản', r.documentNumber ? formatNumericDisplay(r.documentNumber) : ''], ['Ngày văn bản', formatDateOnly(r.documentDate)]].map(([label, value], index) => (
                    <div key={label} className="chk-detail-row"><span className={`chk-detail-label ${index === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{label}</span><span className="chk-detail-value">{value}</span></div>
                  ))}
                </div>}
              </div>

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
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.openingDecision || ''}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Văn bản thỏa thuận đầu tư xây dựng</span>
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.investmentAgreementDoc || ''}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ ...sectionBoxStyle, padding: mooringScopeOpen ? sectionBoxStyle.padding : spaceMd }}>
                <div onClick={() => setMooringScopeOpen(!mooringScopeOpen)} style={{ ...sectionHeaderStyle, marginBottom: mooringScopeOpen ? spaceMd : 0, paddingBottom: mooringScopeOpen ? spaceSm : 0, borderBottom: mooringScopeOpen ? sectionHeaderStyle.borderBottom : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><FileTextOutlined style={{ color: actionPrimary }} /><span>Phạm vi khu nước neo buộc tàu</span></div>
                  {mooringScopeOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {mooringScopeOpen && <div className="chk-detail-grid"><div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label sec-col1-label">Phạm vi khu nước neo buộc tàu</span><span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.waterAreaNeutralScope || ''}</span></div></div>}
              </div>

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
                        <div className={`chk-detail-row chk-detail-row--full ${isPendingPortAuthority ? 'chk-detail-row--compact' : ''}`}>
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
                      <span className="chk-detail-label sec-col1-label">Cán bộ cập nhật</span>
                      <span className="chk-detail-value">
                        {userMap.get(r.updatedBy || '') || r.updatedBy ? (
                          <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.updatedBy || '') || r.updatedBy}</span>
                        ) : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Ngày cập nhật</span>
                      <span className="chk-detail-value">{fmtDateTime(r.updatedAt)}</span>
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
                    ['Loại đối tượng', (() => { const gt = String(r.geometryType || ''); const labels: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }; return labels[gt] || gt || ''; })()],
                    ['Biểu tượng', (() => { const symbolId = r.mapSymbolId || r.bieuTuongId || ''; const name = symbolMap.get(symbolId) || symbolId || ''; const image = symbolImageMap.get(symbolId); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: spaceSm }}>{image ? <img src={image} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{name}</span>; })()],
                    ['Hệ quy chiếu', r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : ''],
                    ['Quy tắc hiển thị', (r.geometryType || r.coordinates || r.latitude != null || r.longitude != null) ? 'Độ, phút, giây (DMS)' : ''],
                  ].map(([label, value], index) => (
                    <div key={label as string} className="chk-detail-row"><span className={`chk-detail-label ${index % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{label}</span><span className="chk-detail-value">{value}</span></div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: spaceMd }}>
                <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                  <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>Tọa độ GPS ({coords.length})</span>
                  <Button icon={<EnvironmentOutlined style={{ color: actionPrimary }} />} onClick={() => setGisModalOpen(true)} style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Xem vị trí trên bản đồ</Button>
                </div>
                <DetailTable dataSource={coords.map((point) => ({ ...point }))} emptyText="Chưa có tọa độ GPS nào" scrollY={DRAWER_TABLE_SCROLL_Y.detailGis} columns={[
                  { title: 'STT', width: 50, align: 'center' as const },
                  { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_value, record) => { const dms = ddToDms(record.lat); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                  { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_value, record) => { const dms = ddToDms(record.lng); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                ]} />
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
                  { title: 'STT', width: 50, align: 'center' as const, render: (_: any, __: any, idx: number) => idx + 1 },
                  {
                    title: 'Tên tài liệu',
                    dataIndex: 'fileName',
                    key: 'fileName',
                    render: (v: string, rec: any) => {
                      const isImg = isImageFile(v);
                      return (
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: spaceSm, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', color: actionPrimary, fontWeight: fontWeightBold }}
                          title={isImg ? `${v} (Nhấp để xem chi tiết ảnh)` : `${v} (Nhấp để tải xuống)`}
                          onClick={() => { if (isImg) handlePreviewImage(rec); else handleDownloadFile(rec.id, v); }}
                        >
                          {isImg ? <FileImageOutlined style={{ color: actionPrimary, flexShrink: 0 }} /> : <FileOutlined style={{ color: textTertiary, flexShrink: 0 }} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || ''}</span>
                        </span>
                      );
                    },
                  },
                  { title: 'Dung lượng', dataIndex: 'fileSize', key: 'fileSize', width: 120, align: 'left' as const, render: (v: number) => v ? (v > 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(2)} MB` : `${(v / 1024).toFixed(1)} KB`) : '' },
                  { title: 'Người tải lên', dataIndex: 'uploadedBy', key: 'uploadedBy', width: 180, render: (v: string, item: any) => item?.uploadedByName || (item?.uploadedBy ? userMap?.get(item.uploadedBy) || item.uploadedBy : '') || userMap?.get(v) || v || '' },
                  { title: 'Ngày tải lên', dataIndex: 'uploadedAt', key: 'uploadedAt', width: 150, align: 'left' as const, render: (v: string, item: any) => { const d = v || item?.uploadedDate || item?.createdDate; return d ? dayjs(d).format('DD/MM/YYYY HH:mm') : ''; } },
                  {
                    title: 'Thao tác',
                    key: 'actions',
                    width: 90,
                    align: 'center' as const,
                    render: (_: any, rec: any) => {
                      const isImg = isImageFile(rec.fileName);
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
                            <Button type="text" size="small" icon={<DownloadOutlined style={{ color: actionPrimary, fontSize: 16 }} />} onClick={() => handleDownloadFile(rec.id, rec.fileName)} style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} />
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
                    <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>{previewImageFile?.fileName || 'Xem chi tiết hình ảnh'}</span>
                  </div>
                }
                open={previewModalOpen}
                onCancel={() => setPreviewModalOpen(false)}
                footer={[
                  <Button key="download" icon={<DownloadOutlined />} onClick={() => previewImageFile && handleDownloadFile(previewImageFile.id, previewImageFile.fileName)} style={{ borderRadius: 999 }}>Tải xuống</Button>,
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
          key: 'infra', label: 'Kết cấu hạ tầng',
          children: (
            <div style={{ paddingTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spaceMd, marginBottom: spaceSm }}>
                <span style={{ ...detailLabelStyle, display: 'inline-block' }}>Kết cấu hạ tầng thuộc cầu cảng</span>
                <Select placeholder="Chọn loại kết cấu hạ tầng" allowClear value={infraTypeFilter || undefined} onChange={(value: string | undefined) => setInfraTypeFilter(value || '')} options={PIER_INFRA_TYPE_OPTIONS} style={{ width: 260, borderRadius: radiusPill, height: 40 }} />
              </div>
                <DetailTable
                dataSource={infraRows}
                emptyText="Chưa có dữ liệu"
                rowKey={(rec) => rec.id || rec.infraName || rec.name || ''}
                scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
                columns={[
                  { title: 'STT', width: 50, align: 'center' as const },
                    {
                      title: 'Loại kết cấu hạ tầng',
                      dataIndex: 'infraType',
                      key: 'type',
                      width: 220,
                      render: (_: any, rec: any) => {
                        const vt = rec?.infraType ?? rec?.type ?? rec?.structureType ?? '';
                        const opt = PIER_INFRA_TYPE_OPTIONS.find((o) => String(o.value) === String(vt));
                        const label = opt?.label || (vt ? String(vt) : '');
                        return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary }}>{label}</span>;
                      },
                    },
                    { title: 'Tên kết cấu hạ tầng', dataIndex: 'infraName', key: 'name', render: (v, rec) => <span style={{ fontSize: fontSizeMd, color: actionPrimary, cursor: 'pointer', fontWeight: fontWeightBold }} onClick={() => rec.id && onViewInfraDetail?.(rec.id)}>{v || rec.name || ''}</span> },
                  { title: 'Thao tác', key: 'actions', width: 100, align: 'center' as const, render: (_v, rec) => (
                    <Tooltip title="Xem chi tiết">
                      <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: actionPrimary, fontSize: fontSizeMd }}
                        onClick={() => rec.id && onViewInfraDetail?.(rec.id)} />
                    </Tooltip>
                  ) },
                ]}
                />
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
                      { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'left' as const, render: (v) => fmtDateTime(v || rec.time || null) },
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
              const rawWkt = r.coordinates || '';
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
    </div>
    </>
  );
}
