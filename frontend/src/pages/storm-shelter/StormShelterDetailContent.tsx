import { useState } from 'react';
import { Tabs, Button, Modal } from 'antd';
import {
  FileOutlined, FileImageOutlined, EnvironmentOutlined, EyeOutlined, DownloadOutlined,
  BankOutlined, SlidersOutlined, FileTextOutlined, AuditOutlined,
  DownOutlined, RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors, DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { fmtNum } from '../../utils/numFmt';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import {
  textTertiary, textPrimary, surfaceCard,
  fontSizeSm, fontSizeLg, fontWeightBold,
  spaceSm, spaceMd, actionPrimary, outlineButtonStyle, primaryButtonStyle, statusBadgeStyle,
  statusOperational, statusAttention, statusCritical,
} from '../../themetokenchk';
import {
  sectionBoxStyle, sectionHeaderStyle, sectionTitleStyle,
} from '../../components/detail-drawer/detailSkin';
import type { StormShelterArea } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';
import { AppDrawer } from '../../components/shared/AppDrawer';

const fontSizeMd = 13.5;

const isImageFile = (fileName?: string): boolean => {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff'].includes(ext || '');
};

export interface StormShelterDetailContentProps {
  selectedRecord: StormShelterArea;
  orgMap: Map<string, string>;
  organizations?: Array<{ id: string; name: string; parentId?: string }>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  portOptions: Array<{ value: string; label: string }>;
  waterwayOptions?: Array<{ value: string; label: string }>;
  buoyStationOptions?: Array<{ value: string; label: string }>;
  userMap: Map<string, string>;
  detailFiles: any[];
  ddToDms?: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  operationPlanList?: any[];
  maintenancePlanList?: any[];
  incidentList?: any[];
}

function internalDdToDms(dd: number | null | undefined): { d: number; m: number; s: number } {
  if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
  let m = Math.floor(mFloat);
  let sFloat = (mFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
  return { d, m, s };
}

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
          if (pts.length > 1 && pts[0].lng === pts[pts.length - 1].lng && pts[0].lat === pts[pts.length - 1].lat) pts.pop();
          pts.forEach(p => { out.push(p); });
        }
      }
      if (out.length === 0) {
        const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/);
        if (mm) mm[1].split('),(').forEach((pt: string) => { const [lng, lat] = pt.replace(/[()]/g, '').trim().split(/\s+/); if (!isNaN(Number(lat))) out.push({ lng: Number(lng), lat: Number(lat) }); });
      }
      if (out.length === 0) {
        const pm = wkt.match(/POINT\s*\([\d.\-]+\s+([\d.\-]+)\)/);
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

export default function StormShelterDetailContent({
  selectedRecord,
  orgMap,
  symbolMap,
  symbolImageMap,
  portOptions,
  waterwayOptions = [],
  buoyStationOptions = [],
  userMap,
  detailFiles,
  ddToDms = internalDdToDms,
  approvalStyleMap,
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
}: StormShelterDetailContentProps) {
  const r = selectedRecord;
  const [viewingWaterArea, setViewingWaterArea] = useState<any | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [technicalOpen, setTechnicalOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [mooringScopeOpen, setMooringScopeOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

  // Xem chi tiết ảnh & tải tệp đính kèm
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
        const blob = new Blob([res.data]);
        const url = window.URL.createObjectURL(blob);
        setPreviewImageUrl(url);
      }
    } catch {
      toast.error('Không thể tải hình ảnh để xem chi tiết');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="storm-shelter-detail-content-wrapper">
      <style>{`
        .storm-shelter-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .storm-shelter-detail-content-wrapper,
        .storm-shelter-detail-content-wrapper .chk-detail-label,
        .storm-shelter-detail-content-wrapper .chk-detail-value,
        .storm-shelter-detail-content-wrapper .ant-table,
        .storm-shelter-detail-content-wrapper .ant-table-cell,
        .storm-shelter-detail-content-wrapper .ant-table-thead > tr > th,
        .storm-shelter-detail-content-wrapper .ant-tabs-tab,
        .storm-shelter-detail-content-wrapper .ant-btn,
        .storm-shelter-detail-content-wrapper .ant-select {
          font-size: 13.5px !important;
        }

        .storm-shelter-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .storm-shelter-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .storm-shelter-detail-content-wrapper .chk-detail-row:last-child {
          border-bottom: none !important;
        }

        .storm-shelter-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .storm-shelter-drawer-scope .storm-shelter-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .storm-shelter-detail-content-wrapper .chk-detail-label {
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

        .storm-shelter-drawer-scope .storm-shelter-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .storm-shelter-detail-content-wrapper .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .storm-shelter-drawer-scope .storm-shelter-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .storm-shelter-detail-content-wrapper .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }

        .storm-shelter-drawer-scope .storm-shelter-detail-content-wrapper .chk-detail-row .sec-full-label,
        .storm-shelter-detail-content-wrapper .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .storm-shelter-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .storm-shelter-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .storm-shelter-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .storm-shelter-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .storm-shelter-drawer-scope .storm-shelter-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .storm-shelter-detail-content-wrapper .chk-detail-label,
          .storm-shelter-detail-content-wrapper .sec-col1-label,
          .storm-shelter-detail-content-wrapper .sec-col2-label,
          .storm-shelter-detail-content-wrapper .sec-full-label {
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
          .storm-shelter-drawer-scope .storm-shelter-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .storm-shelter-detail-content-wrapper .chk-detail-label,
          .storm-shelter-detail-content-wrapper .sec-col1-label,
          .storm-shelter-detail-content-wrapper .sec-col2-label,
          .storm-shelter-detail-content-wrapper .sec-full-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .storm-shelter-detail-content-wrapper .chk-detail-value {
            width: 100% !important;
          }
        }
      `}</style>
      <Tabs
        defaultActiveKey="general"
        tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
        items={[
          {
            key: 'general',
            label: 'Thông tin chung',
            children: (
              <div style={{ paddingTop: 6, paddingRight: 4, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
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
                      <span className="chk-detail-label sec-col1-label">Mã khu tránh, trú bão</span>
                      <span className="chk-detail-value">
                        {r.stormShelterCode ? <span style={statusBadgeStyle(actionPrimary)}>{r.stormShelterCode}</span> : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tên khu tránh, trú bão</span>
                      <span className="chk-detail-value">
                        {r.stormShelterName ? <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{r.stormShelterName}</span> : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Đơn vị quản lý</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const name = orgMap.get(r.orgUnitId || '') || r.orgUnitId || '';
                          return name ? <span style={{ fontWeight: fontWeightBold }}>{name}</span> : '';
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Thuộc cảng biển</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const name = portOptions.find(o => o.value === r.portId)?.label || r.portId || '';
                          return name ? <span style={{ fontWeight: fontWeightBold }}>{name}</span> : '';
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Thuộc luồng hàng hải</span>
                      <span className="chk-detail-value">{waterwayOptions.find(o => o.value === r.navigationChannelId)?.label || r.navigationChannelId || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Thuộc bến phao</span>
                      <span className="chk-detail-value">{r.buoyStationName || buoyStationOptions.find(o => o.value === r.buoyStationId)?.label || r.buoyStationId || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Phân loại</span>
                      <span className="chk-detail-value">{r.classification || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Địa điểm (Tỉnh/Thành phố)</span>
                      <span className="chk-detail-value">
                        {r.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '' : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Tình trạng</span>
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
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Hình dạng</span>
                      <span className="chk-detail-value">{r.shapeDescription || ''}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Địa điểm chi tiết</span>
                      <span className="chk-detail-value">{r.detailedLocation || ''}</span>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Thông số kỹ thuật & Năng lực khai thác ── */}
                <div style={{ ...sectionBoxStyle, padding: technicalOpen ? sectionBoxStyle.padding : spaceMd }}>
                  <div
                    onClick={() => setTechnicalOpen(!technicalOpen)}
                    style={{ ...sectionHeaderStyle, marginBottom: technicalOpen ? spaceMd : 0, paddingBottom: technicalOpen ? spaceSm : 0, borderBottom: technicalOpen ? sectionHeaderStyle.borderBottom : 'none', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Thông số kỹ thuật & Năng lực khai thác</span>
                    </div>
                    {technicalOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                  </div>
                  {technicalOpen && (
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Diện tích (ha)</span>
                        <span className="chk-detail-value">{r.area != null ? fmtNum(r.area) : ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Độ sâu khu nước thiết kế (m)</span>
                        <span className="chk-detail-value">{r.designWaterDepth != null ? `${fmtNum(r.designWaterDepth)} m` : ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Độ sâu khu nước hiện tại (m)</span>
                        <span className="chk-detail-value">{r.currentWaterDepth != null ? `${fmtNum(r.currentWaterDepth)} m` : ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cao độ đáy bến thiết kế</span>
                        <span className="chk-detail-value">{r.bottomElevationDesign != null ? fmtNum(r.bottomElevationDesign) : ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Số lượng đang khai thác</span>
                        <span className="chk-detail-value">{r.activeStormShelterCount != null ? r.activeStormShelterCount : ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Số lượng đã công bố</span>
                        <span className="chk-detail-value">{r.publishedStormShelterCount != null ? r.publishedStormShelterCount : ''}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-full-label">Số lượng đang thỏa thuận ĐTXD</span>
                        <span className="chk-detail-value">{r.underInvestmentStormShelterCount != null ? r.underInvestmentStormShelterCount : ''}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 3: Thông tin công bố mở, đưa vào sử dụng ── */}
                <div style={{ ...sectionBoxStyle, padding: announcementOpen ? sectionBoxStyle.padding : spaceMd }}>
                  <div
                    onClick={() => setAnnouncementOpen(!announcementOpen)}
                    style={{ ...sectionHeaderStyle, marginBottom: announcementOpen ? spaceMd : 0, paddingBottom: announcementOpen ? spaceSm : 0, borderBottom: announcementOpen ? sectionHeaderStyle.borderBottom : 'none', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={sectionTitleStyle}>
                      <FileTextOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin công bố mở, đưa vào sử dụng</span>
                    </div>
                    {announcementOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                  </div>
                  {announcementOpen && (
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Thời điểm công bố mở</span>
                        <span className="chk-detail-value">{fmtDateTime(r.openingAnnouncementDate)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Quyết định công bố / Cho phép KT</span>
                        <span className="chk-detail-value">{r.publicDecision || ''}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-full-label">Văn bản thỏa thuận đầu tư XD</span>
                        <span className="chk-detail-value">{r.investmentAgreement || ''}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 4: Thông tin khu nước neo buộc tàu ── */}
                <div style={{ ...sectionBoxStyle, padding: mooringScopeOpen ? sectionBoxStyle.padding : spaceMd }}>
                  <div
                    onClick={() => setMooringScopeOpen(!mooringScopeOpen)}
                    style={{ ...sectionHeaderStyle, marginBottom: mooringScopeOpen ? spaceMd : 0, paddingBottom: mooringScopeOpen ? spaceSm : 0, borderBottom: mooringScopeOpen ? sectionHeaderStyle.borderBottom : 'none', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={sectionTitleStyle}>
                      <EnvironmentOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin khu nước neo buộc tàu</span>
                    </div>
                    {mooringScopeOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                  </div>
                  {mooringScopeOpen && (
                    <DetailTable
                      dataSource={(r.mooringWaterAreas || []).map((wa, i) => ({ ...wa, key: i }))}
                      emptyText="Chưa có dữ liệu khu nước neo buộc tàu"
                      rowKey={(rec: any) => rec.key ?? rec.description ?? rec.id}
                      columns={[
                        { title: 'STT', width: 60, align: 'center' as const, render: (_v: any, _r: any, i: number) => i + 1 },
                        { title: 'Phạm vi khu nước neo buộc tàu', dataIndex: 'description', key: 'description', render: (d?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{d || ''}</span> },
                        { title: 'Thao tác', key: 'actions', width: 100, align: 'center' as const, render: (_v: any, rec: any) => <Button type="text" size="small" icon={<EyeOutlined style={{ color: actionPrimary }} />} onClick={() => setViewingWaterArea(rec)} /> },
                      ]}
                    />
                  )}
                </div>

                {/* ── Section 5: Thông tin phê duyệt ── */}
                <div style={{ ...sectionBoxStyle, padding: approvalOpen ? sectionBoxStyle.padding : spaceMd }}>
                  <div
                    onClick={() => setApprovalOpen(!approvalOpen)}
                    style={{ ...sectionHeaderStyle, marginBottom: approvalOpen ? spaceMd : 0, paddingBottom: approvalOpen ? spaceSm : 0, borderBottom: approvalOpen ? sectionHeaderStyle.borderBottom : 'none', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={sectionTitleStyle}>
                      <AuditOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin phê duyệt</span>
                      {r.approvalStatus && approvalStyleMap[r.approvalStatus] ? (
                        <span style={{ ...statusBadgeStyle(approvalStyleMap[r.approvalStatus].color), marginLeft: 8 }}>
                          {approvalStyleMap[r.approvalStatus].label}
                        </span>
                      ) : null}
                    </div>
                    {approvalOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                  </div>
                  {approvalOpen && (
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Trạng thái phê duyệt</span>
                        <span className="chk-detail-value">
                          {r.approvalStatus && approvalStyleMap[r.approvalStatus] ? (
                            <span style={statusBadgeStyle(approvalStyleMap[r.approvalStatus].color)}>{approvalStyleMap[r.approvalStatus].label}</span>
                          ) : ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ cập nhật</span>
                        <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>
                          {userMap.get(r.updatedBy || '') || r.updatedBy || ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày cập nhật</span>
                        <span className="chk-detail-value">{fmtDateTime(r.updatedAt)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ gửi phê duyệt</span>
                        <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>
                          {userMap.get(r.submittedForApprovalBy || '') || r.submittedForApprovalBy || ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày gửi phê duyệt</span>
                        <span className="chk-detail-value">{fmtDateTime(r.submittedForApprovalAt)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>
                          {userMap.get(r.portAuthorityApprovedBy || '') || r.portAuthorityApprovedBy || ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">{fmtDateTime(r.portAuthorityApprovedAt)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Nội dung phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">{r.portAuthorityApprovalContent || ''}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cục</span>
                        <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>
                          {userMap.get(r.departmentApprovedBy || '') || r.departmentApprovedBy || ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cục</span>
                        <span className="chk-detail-value">{fmtDateTime(r.departmentApprovedAt)}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-full-label">Nội dung phê duyệt cấp Cục</span>
                        <span className="chk-detail-value">{r.departmentApprovalContent || ''}</span>
                      </div>
                      {r.rejectionReason && (
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-full-label" style={{ color: statusCritical }}>Lý do từ chối</span>
                          <span className="chk-detail-value" style={{ color: statusCritical, fontWeight: fontWeightBold }}>{r.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'gis',
            label: `Thông tin vị trí (${parseGisCoordinates(r).length})`,
            children: (
              <div style={{ paddingTop: 6, paddingRight: 4, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <EnvironmentOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin cấu hình GIS</span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Loại đối tượng</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const gt = (r as any).geometryType || '';
                          const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };
                          return m[gt] || gt || '';
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Biểu tượng</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const symId = r.mapSymbolId || '';
                          const symName = symbolMap.get(symId) || symId || '';
                          const symImg = symbolImageMap.get(symId);
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              {symImg ? <img src={symImg} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} /> : null}
                              {symName}
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Hệ quy chiếu</span>
                      <span className="chk-detail-value">{r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : r.coordinateSystem || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Quy tắc hiển thị</span>
                      <span className="chk-detail-value">
                        {((r as any).geometryType || (r as any).coordinates || (r as any).latitude != null || (r as any).longitude != null) ? 'Độ, phút, giây (DMS)' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <EnvironmentOutlined style={{ color: actionPrimary }} />
                      <span>Tọa độ GPS ({parseGisCoordinates(r).length})</span>
                    </div>
                    <Button
                      icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                      onClick={() => setGisModalOpen(true)}
                      style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Xem vị trí trên bản đồ
                    </Button>
                  </div>
                  {(() => {
                    const pts = parseGisCoordinates(r);
                    return (
                      <DetailTable
                        dataSource={pts.map((p) => ({ ...p }))}
                        scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
                        emptyText="Chưa có tọa độ GPS nào"
                        rowKey={(rec: any) => `${rec.lat}_${rec.lng}_${Math.random()}`}
                        columns={[
                          { title: 'STT', width: 60, align: 'center' as const, render: (_v: any, _r: any, i: number) => i + 1 },
                          { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lat); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                          { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lng); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                        ]}
                      />
                    );
                  })()}
                </div>
              </div>
            ),
          },
          {
            key: 'files',
            label: `File đính kèm (${detailFiles.length})`,
            children: (
              <div style={{ paddingTop: 6, paddingRight: 4, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <FileOutlined style={{ color: actionPrimary }} />
                      <span>Danh sách tài liệu đính kèm ({detailFiles.length})</span>
                    </div>
                  </div>
                  <DetailTable
                    dataSource={detailFiles.map((f) => ({ ...f }))}
                    scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
                    emptyText="Chưa có tài liệu đính kèm"
                    rowKey={(rec: any) => rec.id ?? rec.fileName ?? rec.name}
                    columns={[
                      { title: 'STT', width: 60, align: 'center' as const, render: (_v: any, _r: any, i: number) => i + 1 },
                      {
                        title: 'Tên tài liệu',
                        dataIndex: 'fileName',
                        key: 'fileName',
                        render: (v: string, file: any) => {
                          const isImg = isImageFile(v || file.name);
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                              {isImg ? <FileImageOutlined style={{ color: actionPrimary }} /> : <FileOutlined style={{ color: textTertiary }} />}
                              <span
                                style={{ color: isImg ? actionPrimary : textPrimary, cursor: isImg ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                title={v || file.name}
                                onClick={() => isImg && handlePreviewImage(file)}
                              >
                                {v || file.name || ''}
                              </span>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Dung lượng',
                        dataIndex: 'fileSize',
                        key: 'fileSize',
                        width: 130,
                        align: 'right' as const,
                        render: (v: number) => (v ? (v > 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(2)} MB` : `${(v / 1024).toFixed(1)} KB`) : ''),
                      },
                      {
                        title: 'Người tải lên',
                        dataIndex: 'uploadedBy',
                        key: 'uploadedBy',
                        width: 200,
                        render: (v: string) => userMap.get(v) || v || '',
                      },
                      {
                        title: 'Ngày tải lên',
                        dataIndex: 'uploadedAt',
                        key: 'uploadedAt',
                        width: 160,
                        align: 'center' as const,
                        render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : ''),
                      },
                      {
                        title: 'Thao tác',
                        key: 'actions',
                        width: 90,
                        align: 'center' as const,
                        render: (_: any, file: any) => (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                            {isImageFile(file.fileName || file.name) && (
                              <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined style={{ color: actionPrimary }} />}
                                onClick={() => handlePreviewImage(file)}
                                title="Xem ảnh"
                              />
                            )}
                            <Button
                              type="text"
                              size="small"
                              icon={<DownloadOutlined style={{ color: actionPrimary }} />}
                              onClick={() => handleDownloadFile(file.id, file.fileName || file.name)}
                              title="Tải về"
                            />
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'operationMaintenance',
            label: 'Vận hành & bảo trì',
            children: (
              <div style={{ paddingTop: 6, paddingRight: 4, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                {/* ── 1. Kế hoạch vận hành khai thác ── */}
                <div style={{ ...sectionBoxStyle, padding: operationOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                  <div
                    onClick={() => setOperationOpen(!operationOpen)}
                    style={{ ...sectionHeaderStyle, marginBottom: operationOpen ? spaceMd : 0, paddingBottom: operationOpen ? spaceSm : 0, borderBottom: operationOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={sectionTitleStyle}>
                      <BankOutlined style={{ color: actionPrimary }} />
                      <span>Kế hoạch vận hành khai thác ({operationPlanList.length})</span>
                    </div>
                    {operationOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                  </div>
                  {operationOpen && (
                    <DetailTable
                      dataSource={operationPlanList}
                      scrollY="160px"
                      emptyText="Chưa có dữ liệu kế hoạch vận hành"
                      rowKey={(it: any) => it.id || it.planCode || it.code}
                      columns={[
                        { title: 'STT', width: 60, align: 'center' as const, render: (_v: any, _r: any, i: number) => i + 1 },
                        { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                        { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                        { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'start', width: 160, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.startTime || rec.start || null) },
                        { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'end', width: 160, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.endTime || rec.end || null) },
                      ]}
                    />
                  )}
                </div>

                {/* ── 2. Thông tin bảo trì ── */}
                <div style={{ ...sectionBoxStyle, padding: maintenanceOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                  <div
                    onClick={() => setMaintenanceOpen(!maintenanceOpen)}
                    style={{ ...sectionHeaderStyle, marginBottom: maintenanceOpen ? spaceMd : 0, paddingBottom: maintenanceOpen ? spaceSm : 0, borderBottom: maintenanceOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin bảo trì ({maintenancePlanList.length})</span>
                    </div>
                    {maintenanceOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                  </div>
                  {maintenanceOpen && (
                    <DetailTable
                      dataSource={maintenancePlanList}
                      scrollY="160px"
                      emptyText="Chưa có dữ liệu thông tin bảo trì"
                      rowKey={(it: any) => it.id || it.planCode || it.code}
                      columns={[
                        { title: 'STT', width: 60, align: 'center' as const, render: (_v: any, _r: any, i: number) => i + 1 },
                        { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                        { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                        { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'start', width: 160, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.start || rec.startDate || null) },
                        { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'end', width: 160, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.end || rec.endDate || null) },
                      ]}
                    />
                  )}
                </div>

                {/* ── 3. Thông tin sự cố ── */}
                <div style={{ ...sectionBoxStyle, padding: incidentOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                  <div
                    onClick={() => setIncidentOpen(!incidentOpen)}
                    style={{ ...sectionHeaderStyle, marginBottom: incidentOpen ? spaceMd : 0, paddingBottom: incidentOpen ? spaceSm : 0, borderBottom: incidentOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={sectionTitleStyle}>
                      <FileTextOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin sự cố ({incidentList.length})</span>
                    </div>
                    {incidentOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                  </div>
                  {incidentOpen && (
                    <DetailTable
                      dataSource={incidentList}
                      scrollY="160px"
                      emptyText="Chưa có dữ liệu sự cố"
                      rowKey={(it: any) => it.id || it.incidentCode || it.code}
                      columns={[
                        { title: 'STT', width: 60, align: 'center' as const, render: (_v: any, _r: any, i: number) => i + 1 },
                        { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                        { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec.type || '' },
                        { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || '' },
                        { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 160, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.time || null) },
                      ]}
                    />
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* ── Sub-Drawer: Chi tiết khu nước neo buộc tàu ── */}
      <AppDrawer
        title={<span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: 16 }}>Chi tiết thông tin khu nước neo buộc tàu</span>}
        width="min(900px, 96vw)"
        open={!!viewingWaterArea}
        onClose={() => setViewingWaterArea(null)}
        footer={null}
        rootClassName="storm-shelter-drawer-scope"
        className="storm-shelter-drawer-scope"
      >
        {viewingWaterArea && (
          <div style={{ paddingTop: 6 }}>
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <EnvironmentOutlined style={{ color: actionPrimary }} />
                  <span>Phạm vi khu nước</span>
                </div>
              </div>
              <div className="chk-detail-grid">
                <div className="chk-detail-row chk-detail-row--full">
                  <span className="chk-detail-label sec-full-label">Phạm vi</span>
                  <span className="chk-detail-value">{viewingWaterArea.description || ''}</span>
                </div>
              </div>
            </div>

            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <EnvironmentOutlined style={{ color: actionPrimary }} />
                  <span>Vị trí cụ thể điểm neo</span>
                </div>
              </div>
              <div className="chk-detail-grid">
                <div className="chk-detail-row">
                  <span className="chk-detail-label sec-col1-label">Mã và tên vị trí</span>
                  <span className="chk-detail-value">
                    {[viewingWaterArea.code, viewingWaterArea.name].filter(Boolean).join(' - ') || viewingWaterArea.description || ''}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label sec-col2-label">Loại đối tượng</span>
                  <span className="chk-detail-value">
                    {(() => {
                      const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };
                      return viewingWaterArea.geometryType ? m[viewingWaterArea.geometryType] || viewingWaterArea.geometryType : '';
                    })()}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label sec-col1-label">Biểu tượng</span>
                  <span className="chk-detail-value">
                    {(() => {
                      const symName = symbolMap.get(viewingWaterArea.mapSymbolId || '') || viewingWaterArea.mapSymbolId || '';
                      const symImg = symbolImageMap.get(viewingWaterArea.mapSymbolId || '');
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          {symImg ? <img src={symImg} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} /> : null}
                          {symName}
                        </span>
                      );
                    })()}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label sec-col2-label">Hệ quy chiếu</span>
                  <span className="chk-detail-value">{viewingWaterArea.coordinateSystem === 1 ? 'WGS-84' : viewingWaterArea.coordinateSystem === 2 ? 'VN-2000' : viewingWaterArea.coordinateSystem || ''}</span>
                </div>
                <div className="chk-detail-row chk-detail-row--full">
                  <span className="chk-detail-label sec-full-label">Quy tắc hiển thị</span>
                  <span className="chk-detail-value">{viewingWaterArea.displayRule || ''}</span>
                </div>
              </div>
            </div>

            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <EnvironmentOutlined style={{ color: actionPrimary }} />
                  <span>Tọa độ điểm neo ({(viewingWaterArea.anchorPoints || []).length})</span>
                </div>
              </div>
              <DetailTable
                dataSource={(viewingWaterArea.anchorPoints || []).map((p: any, i: number) => ({ ...p, key: i }))}
                scrollY="220px"
                emptyText="Không có điểm neo nào"
                rowKey={(rec: any) => rec.key ?? rec.name}
                columns={[
                  { title: 'STT', width: 60, align: 'center' as const, render: (_v: any, _r: any, i: number) => i + 1 },
                  {
                    title: 'Tên điểm neo',
                    dataIndex: 'name',
                    key: 'name',
                    render: (name?: string) => (
                      <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={name || ''}>
                        {name || ''}
                      </span>
                    ),
                  },
                  {
                    title: 'Vĩ độ (N)',
                    key: 'lat',
                    align: 'center' as const,
                    render: (_v: any, rec: any) => {
                      if (rec.latitude == null) return '';
                      const d = ddToDms(rec.latitude);
                      return `${d.d}° ${d.m}' ${d.s}" N`;
                    },
                  },
                  {
                    title: 'Kinh độ (E)',
                    key: 'lng',
                    align: 'center' as const,
                    render: (_v: any, rec: any) => {
                      if (rec.longitude == null) return '';
                      const d = ddToDms(rec.longitude);
                      return `${d.d}° ${d.m}' ${d.s}" E`;
                    },
                  },
                ]}
              />
            </div>
          </div>
        )}
      </AppDrawer>

      {/* ── Modal: Xem ảnh đính kèm ── */}
      <Modal
        open={previewModalOpen}
        title={
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            {previewImageFile?.fileName || previewImageFile?.name || 'Xem trước hình ảnh'}
          </span>
        }
        footer={[
          <Button key="close" type="primary" onClick={() => setPreviewModalOpen(false)} style={{ ...primaryButtonStyle, height: 36 }}>
            Đóng
          </Button>,
        ]}
        onCancel={() => setPreviewModalOpen(false)}
        width={750}
        centered
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '16px 0', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {previewLoading ? (
            <span>Đang tải hình ảnh...</span>
          ) : previewImageUrl ? (
            <img src={previewImageUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }} />
          ) : (
            <span style={{ color: textTertiary }}>Không thể hiển thị ảnh</span>
          )}
        </div>
      </Modal>

      {/* ── Modal: Xem vị trí GIS trên bản đồ ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              Vị trí khu tránh, trú bão trên bản đồ
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
                let wkt = '';
                if (rawWkt.startsWith('LINESTRING')) {
                  geom = 'LINE';
                  wkt = `LINESTRING(${pts.map((p) => `${p.lng} ${p.lat}`).join(', ')})`;
                } else if (rawWkt.startsWith('POLYGON')) {
                  geom = 'POLYGON';
                  wkt = `POLYGON((${pts.map((p) => `${p.lng} ${p.lat}`).join(', ')}))`;
                } else if (pts.length > 1) {
                  wkt = `MULTIPOINT(${pts.map((p) => `(${p.lng} ${p.lat})`).join(',')})`;
                } else {
                  wkt = `POINT(${pts[0].lng} ${pts[0].lat})`;
                }
                return { geometryType: geom, coordinates: wkt };
              }
              return undefined;
            })()}
          />
        </div>
      </Modal>
    </div>
  );
}
