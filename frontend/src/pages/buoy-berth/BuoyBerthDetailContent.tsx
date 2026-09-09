import { useState, useEffect } from 'react';
import { Tabs, Select, Tooltip, Button, Modal } from 'antd';
import {
  AuditOutlined,
  BankOutlined,
  DownloadOutlined,
  DownOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileOutlined,
  FileTextOutlined,
  RightOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import {
  detailLabelStyle,
  generalScrollerStyle,
  sectionBoxStyle,
  sectionHeaderStyle,
  sectionTitleStyle,
} from '../../components/detail-drawer/detailSkin';
import { colors, DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { fmtNum } from '../../utils/numFmt';
import {
  textTertiary,
  surfaceCard,
  fontSizeSm,
  fontSizeLg,
  fontWeightMedium,
  fontWeightBold,
  spaceSm,
  spaceMd,
  spaceFormField,
  actionPrimary,
  outlineButtonStyle,
  primaryButtonStyle,
  statusBadgeStyle,
  statusOperational,
  statusAttention,
  statusCritical,
  radiusPill,
} from '../../themetokenchk';
import type { BuoyBerth } from '../../types/port';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { VIETNAM_PROVINCES } from '../../types/common';
import { resolveOrgLevel2Name } from '../../components/org-unit';
import type { Organization } from '../../services/organizationService';

// Đồng bộ cỡ chữ 13.5px toàn màn chi tiết như Cầu cảng (PierDetailContent.tsx)
// — theme fontSizeMd mặc định = 13 nên header 'Tọa độ GPS' nhỏ hơn.
const fontSizeMd = 13.5;

export interface BuoyBerthDetailContentProps {
  selectedRecord: BuoyBerth | null;
  orgMap: Map<string, string>;
  organizations: Organization[];
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  portOptions: Array<{ value: string; label: string }>;
  waterwayOptions?: Array<{ value: string; label: string }>;
  waterwayMap?: Map<string, string>;
  userMap: Map<string, string>;
  detailFiles: any[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  infrastructureList?: any[];
  onViewInfraDetail?: (id: string) => void;
  operationPlanList?: any[];
  maintenancePlanList?: any[];
  incidentList?: any[];
}

// Parse tọa độ GPS: ưu tiên WKT (coordinates) từ backend — hỗ trợ POINT/MULTIPOINT/LINESTRING/POLYGON;
// fallback sang latitude/longitude (backend chỉ parse được cho POINT).
const parseGisCoordinates = (record: any): Array<{ lat: number; lng: number }> => {
  const wkt = record?.coordinates || record?.geometry;
  const out: Array<{ lat: number; lng: number }> = [];
  if (wkt && typeof wkt === 'string' && wkt.trim()) {
    try {
      const upper = wkt.trim().toUpperCase();
      if (upper.startsWith('LINESTRING')) {
        const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/i);
        if (m) m[1].split(',').forEach((p: string) => { const [lng, lat] = p.trim().split(/\s+/); if (!isNaN(Number(lat))) out.push({ lng: Number(lng), lat: Number(lat) }); });
      }
      if (out.length === 0 && upper.startsWith('POLYGON')) {
        const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
        if (m) {
          const pts = m[1].split(',').map((p: string) => { const [lng, lat] = p.trim().split(/\s+/); return { lng: Number(lng), lat: Number(lat) }; }).filter(c => !isNaN(c.lat));
          if (pts.length > 1 && pts[0].lng === pts[pts.length - 1].lng) pts.pop();
          pts.forEach(p => { out.push(p); });
        }
      }
      if (out.length === 0) {
        const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/i);
        if (mm) mm[1].split('),(').forEach((pt: string) => { const [lng, lat] = pt.replace(/[()]/g, '').trim().split(/\s+/); if (!isNaN(Number(lat))) out.push({ lng: Number(lng), lat: Number(lat) }); });
      }
      if (out.length === 0) {
        const pm = wkt.match(/POINT\s*\(([\d.-]+)\s+([\d.-]+)\)/i);
        if (pm) out.push({ lng: Number(pm[1]), lat: Number(pm[2]) });
      }
    } catch { /* ignore */ }
  }
  if (out.length === 0 && record?.latitude != null && record?.longitude != null) {
    out.push({ lat: Number(record.latitude), lng: Number(record.longitude) });
  }
  return out;
};

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '');
const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '');
const fmtMonth = (v?: string | null): string => {
  if (!v) return '';
  const t = String(v).trim();
  if (/^\d{1,2}\/\d{4}$/.test(t)) return t;
  try {
    const d = dayjs(v);
    return d.isValid() ? d.format('MM/YYYY') : t;
  } catch {
    return t;
  }
};
const fmtNumber = (v: number | string | null | undefined): string => (v != null && (v as any) !== '' ? fmtNum(v as any) : '');

const isImageFile = (fileName?: string): boolean => {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff'].includes(ext || '');
};

const BUOY_INFRA_TYPE_OPTIONS = [
  { value: 'ANCHORAGE', label: 'Khu neo đậu' },
  { value: 'STORM_SHELTER', label: 'Khu tránh, trú bão' },
];

export default function BuoyBerthDetailContent({
  selectedRecord,
  orgMap,
  organizations = [],
  symbolMap,
  symbolImageMap,
  portOptions,
  waterwayOptions = [],
  waterwayMap,
  userMap,
  detailFiles,
  ddToDms,
  approvalStyleMap,
  infrastructureList = [],
  onViewInfraDetail,
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
}: BuoyBerthDetailContentProps) {
  const r = selectedRecord;
  const [infraTypeFilter, setInfraTypeFilter] = useState<string>('');
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [mooringScopeOpen, setMooringScopeOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);

  // Xem chi tiết ảnh & tải tệp đính kèm
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<any>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const res = await api.get(`/v1/buoy-berth/${r.id}/attachments/${fileId}/download`, { responseType: 'blob' });
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
        const res = await api.get(`/v1/buoy-berth/${r.id}/attachments/${file.id}/download`, { responseType: 'blob' });
        setPreviewImageUrl(window.URL.createObjectURL(new Blob([res.data])));
      }
    } catch {
      toast.error('Không thể tải hình ảnh để xem chi tiết');
    } finally {
      setPreviewLoading(false);
    }
  };

  const [extraWaterwayName, setExtraWaterwayName] = useState<string>('');
  useEffect(() => {
    if (!r.waterwayId) return;
    if (waterwayMap?.has(r.waterwayId)) return;
    if (waterwayOptions.some((o) => o.value === r.waterwayId)) return;
    navigationChannelCRUD.getById(r.waterwayId)
      .then((c) => setExtraWaterwayName(c?.channelName || c?.channelCode || ''))
      .catch(() => {});
  }, [r.waterwayId, waterwayMap, waterwayOptions]);

  const orgName = resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(r.orgUnitId || '') || r.orgUnitId || '';
  const portName = portOptions.find((o) => o.value === r.portId)?.label || r.portId || '';
  const waterwayName = (waterwayMap && r.waterwayId ? waterwayMap.get(r.waterwayId) : undefined)
    || waterwayOptions.find((o) => o.value === r.waterwayId)?.label
    || extraWaterwayName
    || r.waterwayId
    || '';
  const provinceName = r.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '' : '';
  const operatingOrgName = DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === r.operatingOrgId)?.name || (r as any).operatingOrgName || r.operatingOrgId || '';
  const coords = parseGisCoordinates(r);

  const filteredInfraList = infrastructureList.filter((rec: any) => {
    if (!infraTypeFilter) return true;
    const vt = rec?.infraType ?? rec?.type ?? rec?.structureType ?? '';
    return String(vt) === String(infraTypeFilter);
  });

  return (
    <>
      <style>{`
        .buoy-berth-detail-content-wrapper,
        .buoy-berth-detail-content-wrapper .chk-detail-label,
        .buoy-berth-detail-content-wrapper .chk-detail-value,
        .buoy-berth-detail-content-wrapper .ant-table,
        .buoy-berth-detail-content-wrapper .ant-table-cell,
        .buoy-berth-detail-content-wrapper .ant-table-thead > tr > th,
        .buoy-berth-detail-content-wrapper .ant-tabs-tab,
        .buoy-berth-detail-content-wrapper .ant-btn,
        .buoy-berth-detail-content-wrapper .ant-select,
        .buoy-berth-detail-content-wrapper .ant-select-selection-item,
        .buoy-berth-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .buoy-berth-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }
        .buoy-berth-detail-content-wrapper .chk-detail-row--full { grid-column: 1 / -1 !important; }
        .buoy-berth-detail-content-wrapper .chk-detail-label,
        .buoy-berth-detail-content-wrapper .sec-col1-label,
        .buoy-berth-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .buoy-berth-detail-content-wrapper .chk-detail-row--full .chk-detail-label {
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
        .buoy-berth-detail-content-wrapper .chk-detail-row .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
          align-self: flex-start !important;
          white-space: normal !important;
        }
        .buoy-berth-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }
        .buoy-berth-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-label {
          width: auto !important;
          min-width: auto !important;
          max-width: none !important;
          flex-shrink: 0 !important;
        }
        .buoy-berth-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-value {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          justify-content: flex-start !important;
          white-space: nowrap !important;
        }
        .buoy-berth-detail-content-wrapper .chk-detail-value {
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
        .buoy-berth-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
          align-items: stretch !important;
        }

        /* Khi dữ liệu dài, tự xuống dòng trong đúng ô value — tránh đè lên cột/hàng kế tiếp */
        .buoy-berth-detail-content-wrapper .chk-detail-row {
          align-items: flex-start !important;
          min-height: 36px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }
        .buoy-berth-detail-content-wrapper .chk-detail-row .chk-detail-label {
          align-self: flex-start !important;
          white-space: normal !important;
          line-height: 1.5 !important;
        }

        @media (max-width: 960px) {
          .buoy-berth-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .buoy-berth-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .buoy-berth-detail-content-wrapper .chk-detail-label,
          .buoy-berth-detail-content-wrapper .sec-col1-label,
          .buoy-berth-detail-content-wrapper .chk-detail-row .sec-col2-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }

        @media (max-width: 640px) {
          .buoy-berth-detail-content-wrapper .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .buoy-berth-detail-content-wrapper .chk-detail-label,
          .buoy-berth-detail-content-wrapper .sec-col1-label,
          .buoy-berth-detail-content-wrapper .chk-detail-row .sec-col2-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .buoy-berth-detail-content-wrapper .chk-detail-value {
            width: 100% !important;
            min-width: 100% !important;
          }
        }
      `}</style>

      <div className="buoy-berth-detail-content-wrapper">
        <Tabs
          defaultActiveKey="general"
          tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
          items={[
            {
              key: 'general',
              label: 'Thông tin chung',
              children: (
                <div style={generalScrollerStyle}>
                  {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
                  <div style={sectionBoxStyle}>
                    <div style={sectionHeaderStyle}>
                      <div style={sectionTitleStyle}>
                        <BankOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin cơ bản & Quản lý vận hành</span>
                      </div>
                    </div>
                    <div className="chk-detail-grid">
                      {(() => {
                        const isLongCode = ((r.buoyBerthCode || '').trim().length >= 18);
                        return (
                          <div className={`chk-detail-row ${isLongCode ? 'chk-detail-row--compact' : ''}`}>
                            <span className="chk-detail-label sec-col1-label">Mã bến phao</span>
                            <span className="chk-detail-value">
                              {r.buoyBerthCode ? <span style={{ ...statusBadgeStyle(actionPrimary), whiteSpace: 'nowrap' }}>{r.buoyBerthCode}</span> : ''}
                            </span>
                          </div>
                        );
                      })()}
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Tên bến phao</span>
                        <span className="chk-detail-value">
                          {r.buoyBerthName ? <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{r.buoyBerthName}</span> : ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Đơn vị quản lý</span>
                        <span className="chk-detail-value">
                          {orgName ? <span style={{ fontWeight: fontWeightBold }}>{orgName}</span> : ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Thuộc cảng biển</span>
                        <span className="chk-detail-value">
                          {portName ? <span style={{ fontWeight: fontWeightBold }}>{portName}</span> : ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Đơn vị khai thác</span>
                        <span className="chk-detail-value">{operatingOrgName}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Thuộc luồng hàng hải</span>
                        <span className="chk-detail-value">{waterwayName}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Địa điểm (Tỉnh/TP)</span>
                        <span className="chk-detail-value">{provinceName}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Tình trạng</span>
                        <span className="chk-detail-value">
                          {(() => {
                            const s = r.operationalStatus;
                            const m: Record<string, { color: string; label: string }> = {
                              OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/Vận hành' },
                              NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/Vận hành' },
                              SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/Vận hành' },
                            };
                            const b = s && m[s];
                            return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : '';
                          })()}
                        </span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label">Địa điểm chi tiết</span>
                        <span className="chk-detail-value">{r.detailedLocation || (r as any).locationDetail || ''}</span>
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
                        <span className="chk-detail-label sec-col1-label">Phân cấp công trình</span>
                        <span className="chk-detail-value">{r.classification || ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Độ sâu khu nước hiện tại (m)</span>
                        <span className="chk-detail-value">{fmtNumber(r.currentWaterDepth)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Trọng tải tàu lớn nhất theo thiết kế (DWT)</span>
                        <span className="chk-detail-value">{fmtNumber((r as any).designedVesselDWT || r.maxVesselDWT)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Trọng tải tàu lớn nhất theo công bố (DWT)</span>
                        <span className="chk-detail-value">{fmtNumber(r.maxVesselDWT)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Cỡ tàu khai thác theo quy hoạch</span>
                        <span className="chk-detail-value">{fmtNumber(r.plannedVesselDWT)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Khả năng tiếp nhận cỡ tàu theo thiết kế</span>
                        <span className="chk-detail-value">{(r as any).designShipReceivingCapacity || ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Khả năng tiếp nhận cỡ tàu theo công bố</span>
                        <span className="chk-detail-value">{(r as any).publishedShipReceivingCapacity || ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Chiều dài tàu lớn nhất (m)</span>
                        <span className="chk-detail-value">{fmtNumber((r as any).maxVesselLength)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Mớn nước tàu lớn nhất (m)</span>
                        <span className="chk-detail-value">{fmtNumber((r as any).maxVesselDraft)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Bán kính quay trở tàu (m)</span>
                        <span className="chk-detail-value">{fmtNumber((r as any).turningBasinRadius)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Cao trình đỉnh công trình (m)</span>
                        <span className="chk-detail-value">{fmtNumber((r as any).topElevation || r.bottomElevationDesign)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Vùng đón trả hoa tiêu</span>
                        <span className="chk-detail-value">{(r as any).pilotBoardingArea || ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Loại hàng hóa bốc dỡ</span>
                        <span className="chk-detail-value">{(r as any).cargoType || ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Năng lực thông qua thiết kế</span>
                        <span className="chk-detail-value">{r.designCapacity != null ? `${fmtNumber(r.designCapacity)} tấn/năm` : ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Sản lượng hàng thông qua</span>
                        <span className="chk-detail-value">{r.cargoThroughput != null ? `${fmtNumber(r.cargoThroughput)} tấn/năm` : ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Thời điểm đăng kiểm gần nhất</span>
                        <span className="chk-detail-value">{fmtMonth(r.lastInspectionDate)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Thời điểm đăng kiểm tiếp theo</span>
                        <span className="chk-detail-value">{fmtDate(r.nextInspectionDate)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Thời hạn khai thác</span>
                        <span className="chk-detail-value">{fmtDate(r.operationExpiryDate)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Thời gian bắt đầu xây dựng</span>
                        <span className="chk-detail-value">{fmtDate((r as any).constructionStartDate)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Thời gian hoàn thành xây dựng</span>
                        <span className="chk-detail-value">{fmtDate((r as any).constructionEndDate)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Thời điểm bắt đầu đưa vào sử dụng</span>
                        <span className="chk-detail-value">{fmtDate((r as any).operationStartDate || r.openingAnnouncementDate)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Năm khai thác</span>
                        <span className="chk-detail-value">{(r as any).operationYear || ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Số lượng bến phao đang khai thác</span>
                        <span className="chk-detail-value">{fmtNumber(r.activeBuoyBerthCount)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Số lượng bến phao đã công bố</span>
                        <span className="chk-detail-value">{fmtNumber(r.publishedBuoyBerthCount)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Số lượng bến phao đang thỏa thuận đầu tư</span>
                        <span className="chk-detail-value">{fmtNumber(r.underInvestmentBuoyBerthCount)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cao độ đáy bến thiết kế</span>
                        <span className="chk-detail-value">{fmtNumber(r.bottomElevationDesign)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Section 3: Thông tin công bố mở, đưa vào sử dụng ── */}
                  <div style={{ ...sectionBoxStyle, padding: announcementOpen ? sectionBoxStyle.padding : spaceMd }}>
                    <div
                      onClick={() => setAnnouncementOpen(!announcementOpen)}
                      style={{
                        ...sectionHeaderStyle,
                        marginBottom: announcementOpen ? spaceMd : 0,
                        paddingBottom: announcementOpen ? spaceSm : 0,
                        borderBottom: announcementOpen ? sectionHeaderStyle.borderBottom : 'none',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={sectionTitleStyle}>
                        <FileTextOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin công bố mở, đưa vào sử dụng</span>
                      </div>
                      {announcementOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                    </div>
                    {announcementOpen && (
                      <div className="chk-detail-grid">
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-col1-label">Thời điểm công bố mở, đưa vào sử dụng</span>
                          <span className="chk-detail-value">{fmtDate(r.openingAnnouncementDate)}</span>
                        </div>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-col1-label">Quyết định công bố/ Văn bản cho phép khai thác</span>
                          <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {r.publicDecision || (r as any).openingDecision || ''}
                          </span>
                        </div>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-col1-label">Văn bản thỏa thuận đầu tư xây dựng</span>
                          <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {r.investmentAgreement || ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Section 4: Phạm vi khu nước neo buộc tàu ── */}
                  <div style={{ ...sectionBoxStyle, padding: mooringScopeOpen ? sectionBoxStyle.padding : spaceMd }}>
                    <div
                      onClick={() => setMooringScopeOpen(!mooringScopeOpen)}
                      style={{
                        ...sectionHeaderStyle,
                        marginBottom: mooringScopeOpen ? spaceMd : 0,
                        paddingBottom: mooringScopeOpen ? spaceSm : 0,
                        borderBottom: mooringScopeOpen ? sectionHeaderStyle.borderBottom : 'none',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={sectionTitleStyle}>
                        <FileTextOutlined style={{ color: actionPrimary }} />
                        <span>Phạm vi khu nước neo buộc tàu</span>
                      </div>
                      {mooringScopeOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                    </div>
                    {mooringScopeOpen && (
                      <div className="chk-detail-grid">
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-col1-label">Phạm vi khu nước neo buộc tàu</span>
                          <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {r.mooringWaterAreaScope || ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Section 5: Thông tin phê duyệt (Toggle chuẩn AGENTS.md) ── */}
                  <div style={{ ...sectionBoxStyle, padding: approvalOpen ? sectionBoxStyle.padding : spaceMd }}>
                    <div
                      onClick={() => setApprovalOpen(!approvalOpen)}
                      style={{
                        ...sectionHeaderStyle,
                        marginBottom: approvalOpen ? spaceMd : 0,
                        paddingBottom: approvalOpen ? spaceSm : 0,
                        borderBottom: approvalOpen ? sectionHeaderStyle.borderBottom : 'none',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={sectionTitleStyle}>
                        <AuditOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin phê duyệt</span>
                      </div>
                      {approvalOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                    </div>
                    {approvalOpen && (
                      <div className="chk-detail-grid">
                        {(() => {
                          const isPendingPortAuthority =
                            r.approvalStatus === 'PENDING_APPROVAL' ||
                            r.approvalStatus === 'CHO_PHE_DUYET' ||
                            r.approvalStatus === 'PROPOSED' ||
                            approvalStyleMap[r.approvalStatus || '']?.label === 'Chờ phê duyệt cấp Cảng vụ/Chi cục' ||
                            approvalStyleMap[r.approvalStatus || '']?.label?.toLowerCase().includes('chi cục');
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
                            {userMap.get((r as any).updatedBy || '') || (r as any).updatedBy ? (
                              <span style={{ fontWeight: fontWeightBold }}>{userMap.get((r as any).updatedBy || '') || (r as any).updatedBy}</span>
                            ) : ''}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label sec-col1-label">Cán bộ gửi phê duyệt</span>
                          <span className="chk-detail-value">
                            {userMap.get((r as any).submittedForApprovalBy || '') || (r as any).submittedForApprovalBy ? (
                              <span style={{ fontWeight: fontWeightBold }}>{userMap.get((r as any).submittedForApprovalBy || '') || (r as any).submittedForApprovalBy}</span>
                            ) : ''}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label sec-col2-label">Ngày gửi phê duyệt</span>
                          <span className="chk-detail-value">{fmtDateTime((r as any).submittedForApprovalAt)}</span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
                          <span className="chk-detail-value">
                            {userMap.get((r as any).portAuthorityApprovedBy || '') || (r as any).portAuthorityApprovedBy ? (
                              <span style={{ fontWeight: fontWeightBold }}>{userMap.get((r as any).portAuthorityApprovedBy || '') || (r as any).portAuthorityApprovedBy}</span>
                            ) : ''}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
                          <span className="chk-detail-value">{fmtDateTime((r as any).portAuthorityApprovedAt)}</span>
                        </div>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cảng vụ/Chi cục</span>
                          <span className="chk-detail-value">{(r as any).portAuthorityApprovalContent || ''}</span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cục</span>
                          <span className="chk-detail-value">
                            {userMap.get((r as any).departmentApprovedBy || '') || (r as any).departmentApprovedBy ? (
                              <span style={{ fontWeight: fontWeightBold }}>{userMap.get((r as any).departmentApprovedBy || '') || (r as any).departmentApprovedBy}</span>
                            ) : ''}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cục</span>
                          <span className="chk-detail-value">{fmtDateTime((r as any).departmentApprovedAt)}</span>
                        </div>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cục</span>
                          <span className="chk-detail-value">{(r as any).departmentApprovalContent || ''}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'gis',
              label: `Thông tin vị trí (${coords.length})`,
              children: (
                <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                  <div style={sectionBoxStyle}>
                    <div className="chk-detail-grid">
                      {[
                        ['Loại đối tượng', (() => {
                          let gt = String(r.geometryType || '');
                          if (!gt) {
                            const rawWkt = String(r.coordinates || '').trim().toUpperCase();
                            if (rawWkt.startsWith('LINESTRING')) gt = 'LINE';
                            else if (rawWkt.startsWith('POLYGON')) gt = 'POLYGON';
                            else if (rawWkt.startsWith('POINT') || (r.latitude != null && r.longitude != null) || coords.length > 0) gt = 'POINT';
                          }
                          const labels: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };
                          return labels[gt] || gt || '';
                        })()],
                        ['Biểu tượng', (() => {
                          const symbolId = r.mapSymbolId || (r as any).bieuTuongId || '';
                          const name = symbolMap.get(symbolId) || symbolId || '';
                          const image = symbolImageMap.get(symbolId);
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: spaceSm }}>
                              {image ? <img src={image} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}
                              {name}
                            </span>
                          );
                        })()],
                        ['Hệ quy chiếu', r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : (coords.length > 0 ? 'WGS-84' : '')],
                        ['Quy tắc hiển thị', (r.geometryType || r.coordinates || r.latitude != null || r.longitude != null || coords.length > 0) ? 'Độ, phút, giây (DMS)' : ''],
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
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                        Tọa độ GPS ({coords.length})
                      </span>
                      <Button
                        icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                        onClick={() => setGisModalOpen(true)}
                        style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Xem vị trí trên bản đồ
                      </Button>
                    </div>
                    <DetailTable
                      dataSource={coords.map((point) => ({ ...point }))}
                      emptyText="Chưa có tọa độ GPS nào"
                      scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                      columns={[
                        { title: 'STT', width: 50 },
                        { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_value, record) => { const dms = ddToDms(record.lat); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                        { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_value, record) => { const dms = ddToDms(record.lng); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                      ]}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: 'files',
              label: `File đính kèm (${detailFiles.length})`,
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
                      { title: 'STT', width: 50 },
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
                      { title: 'Dung lượng', dataIndex: 'fileSize', key: 'fileSize', width: 120, align: 'right' as const, render: (v: number) => v ? (v > 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(2)} MB` : `${(v / 1024).toFixed(1)} KB`) : '' },
                      { title: 'Người tải lên', dataIndex: 'uploadedBy', key: 'uploadedBy', width: 180, render: (v: string, rec: any) => userMap.get(v || rec.createdBy || '') || v || rec.createdBy || '' },
                      { title: 'Ngày tải lên', dataIndex: 'uploadedAt', key: 'uploadedAt', width: 135, align: 'center' as const, render: (v: string, rec: any) => (v || rec.createdAt) ? dayjs(v || rec.createdAt).format('DD/MM/YYYY HH:mm') : '' },
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
              key: 'infra',
              label: 'Kết cấu hạ tầng',
              children: (
                <div style={{ paddingTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spaceMd, marginBottom: spaceSm }}>
                    <span style={{ ...detailLabelStyle, display: 'inline-block' }}>Kết cấu hạ tầng thuộc bến phao</span>
                    <Select
                      placeholder="Chọn loại kết cấu hạ tầng"
                      allowClear
                      value={infraTypeFilter || undefined}
                      onChange={(value: string | undefined) => setInfraTypeFilter(value || '')}
                      options={BUOY_INFRA_TYPE_OPTIONS}
                      style={{ width: 260, borderRadius: radiusPill, height: 40 }}
                    />
                  </div>
                  <DetailTable
                    dataSource={filteredInfraList}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(rec: any) => rec.id || rec.infraName || rec.name || ''}
                    scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
                    columns={[
                      { title: 'STT', width: 50 },
                      {
                        title: 'Loại kết cấu hạ tầng',
                        dataIndex: 'infraType',
                        key: 'type',
                        width: 220,
                        render: (_: any, rec: any) => {
                          const vt = rec?.infraType ?? rec?.type ?? rec?.structureType ?? '';
                          const opt = BUOY_INFRA_TYPE_OPTIONS.find((o) => String(o.value) === String(vt));
                          const label = opt?.label || (vt ? String(vt) : '');
                          return (
                            <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary }}>
                              {label}
                            </span>
                          );
                        },
                      },
                      {
                        title: 'Tên kết cấu hạ tầng',
                        dataIndex: 'infraName',
                        key: 'name',
                        render: (v: string, rec: any) => (
                          <span
                            style={{ fontSize: fontSizeMd, color: actionPrimary, cursor: 'pointer', fontWeight: fontWeightBold }}
                            onClick={() => rec.id && onViewInfraDetail?.(rec.id)}
                          >
                            {v || rec.name || ''}
                          </span>
                        ),
                      },
                      {
                        title: 'Thao tác',
                        key: 'actions',
                        width: 100,
                        align: 'center' as const,
                        render: (_v: any, rec: any) => (
                          <Tooltip title="Xem chi tiết">
                            <Button
                              type="text"
                              size="small"
                              icon={<EyeOutlined />}
                              style={{ color: actionPrimary, fontSize: fontSizeMd }}
                              onClick={() => rec.id && onViewInfraDetail?.(rec.id)}
                            />
                          </Tooltip>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'operationMaintenance',
              label: 'Vận hành & bảo trì',
              children: (
                <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
                  {/* ── Section Vận hành ── */}
                  <div style={{ ...sectionBoxStyle, padding: operationOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                    <div
                      onClick={() => setOperationOpen(!operationOpen)}
                      style={{
                        ...sectionHeaderStyle,
                        marginBottom: operationOpen ? spaceMd : 0,
                        paddingBottom: operationOpen ? spaceSm : 0,
                        borderBottom: operationOpen ? '1px solid #f1f5f9' : 'none',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={sectionTitleStyle}>
                        <SlidersOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin vận hành khai thác</span>
                      </div>
                      {operationOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                    </div>
                    {operationOpen && (
                      <DetailTable
                        dataSource={operationPlanList}
                        emptyText="Chưa có dữ liệu"
                        rowKey={(rec: any) => rec.id || rec.planCode || rec.code || ''}
                        scrollY={160}
                        columns={[
                          { title: 'STT', width: 50 },
                          { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                          { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                          { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.startTime || rec.start || null) },
                          { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.endTime || rec.end || null) },
                        ]}
                      />
                    )}
                  </div>

                  {/* ── Section Bảo trì ── */}
                  <div style={{ ...sectionBoxStyle, padding: maintenanceOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                    <div
                      onClick={() => setMaintenanceOpen(!maintenanceOpen)}
                      style={{
                        ...sectionHeaderStyle,
                        marginBottom: maintenanceOpen ? spaceMd : 0,
                        paddingBottom: maintenanceOpen ? spaceSm : 0,
                        borderBottom: maintenanceOpen ? '1px solid #f1f5f9' : 'none',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={sectionTitleStyle}>
                        <SlidersOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin bảo trì</span>
                      </div>
                      {maintenanceOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                    </div>
                    {maintenanceOpen && (
                      <DetailTable
                        dataSource={maintenancePlanList}
                        emptyText="Chưa có dữ liệu"
                        rowKey={(rec: any) => rec.id || rec.planCode || rec.code || ''}
                        scrollY={160}
                        columns={[
                          { title: 'STT', width: 50 },
                          { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                          { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                          { title: 'Thời gian bắt đầu', dataIndex: 'startDate', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.startTime || rec.start || null) },
                          { title: 'Thời gian kết thúc', dataIndex: 'endDate', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.endTime || rec.end || null) },
                        ]}
                      />
                    )}
                  </div>

                  {/* ── Section Sự cố ── */}
                  <div style={{ ...sectionBoxStyle, padding: incidentOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                    <div
                      onClick={() => setIncidentOpen(!incidentOpen)}
                      style={{
                        ...sectionHeaderStyle,
                        marginBottom: incidentOpen ? spaceMd : 0,
                        paddingBottom: incidentOpen ? spaceSm : 0,
                        borderBottom: incidentOpen ? '1px solid #f1f5f9' : 'none',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={sectionTitleStyle}>
                        <SlidersOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin sự cố</span>
                      </div>
                      {incidentOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                    </div>
                    {incidentOpen && (
                      <DetailTable
                        dataSource={incidentList}
                        emptyText="Chưa có dữ liệu"
                        rowKey={(rec: any) => rec.id || rec.incidentCode || rec.code || ''}
                        scrollY={160}
                        columns={[
                          { title: 'STT', width: 50 },
                          { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                          { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec.type || '' },
                          { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string, rec: any) => v || rec.place || '' },
                          { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.time || null) },
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
                  const rawWkt = r.coordinates || (r as any).geometry || '';
                  let geom: 'POINT' | 'LINE' | 'POLYGON' = 'POINT';
                  let coordinates: string;
                  if (rawWkt.startsWith('LINESTRING')) {
                    geom = 'LINE';
                    coordinates = `LINESTRING(${pts.map((p) => `${p.lng} ${p.lat}`).join(', ')})`;
                  } else if (rawWkt.startsWith('POLYGON')) {
                    geom = 'POLYGON';
                    coordinates = `POLYGON((${pts.map((p) => `${p.lng} ${p.lat}`).join(', ')}))`;
                  } else if (pts.length > 1) {
                    coordinates = `MULTIPOINT(${pts.map((p) => `(${p.lng} ${p.lat})`).join(',')})`;
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
