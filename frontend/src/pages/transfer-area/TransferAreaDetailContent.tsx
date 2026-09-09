import { useState } from 'react';
import { Tabs, Tooltip, Button, Modal, Table } from 'antd';
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
  CalendarOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
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
import {
  actionPrimary,
  surfaceCard,
  textTertiary,
  fontSizeSm,
  fontSizeLg,
  fontWeightBold,
  spaceSm,
  spaceMd,
  spaceFormField,
  radiusPill,
  outlineButtonStyle,
  primaryButtonStyle,
  statusBadgeStyle,
} from '../../themetokenchk';
import type { TransferArea } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';
import { fmtNum } from '../../utils/numFmt';

const fontSizeMd = 13.5;

const isImageFile = (fileName?: string): boolean => {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff'].includes(ext || '');
};

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

export interface TransferAreaDetailContentProps {
  selectedRecord: TransferArea;
  orgMap: Map<string, string>;
  organizations?: Array<{ id: string; name: string; parentId?: string }>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  portOptions: Array<{ value: string; label: string }>;
  userMap: Map<string, string>;
  detailFiles: AttachmentFile[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  operationalStyleMap: Record<string, { color: string; label: string }>;
  operationPlanList?: DetailTableRow[];
  maintenancePlanList?: DetailTableRow[];
  incidentList?: DetailTableRow[];
}

const OPERATIONAL_FUNCTIONS_LABEL_MAP: Record<string, string> = {
  CONTAINER: 'Hàng Container',
  GENERAL_CARGO: 'Hàng tổng hợp (Bách hóa)',
  BULK_CARGO: 'Hàng chuyên dụng hàng rời, quặng',
  OIL_GAS: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng',
  OTHER: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu...)',
  PASSENGER: 'Hành khách',
};

const formatOperationalFunctions = (v?: string | null): string => {
  if (!v) return '';
  const parts = v.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  return parts.map((code) => OPERATIONAL_FUNCTIONS_LABEL_MAP[code] || code).join(', ');
};

const formatDateOnly = (d: string | null | undefined): string => {
  if (!d) return '';
  try { return dayjs(d).format('DD/MM/YYYY'); } catch { return d; }
};

const fmtDateTime = (d: string | null | undefined): string => {
  if (!d) return '';
  try { return dayjs(d).format('DD/MM/YYYY HH:mm:ss'); } catch { return d; }
};

const formatNumericDisplay = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  return fmtNum(value) || String(value);
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
        const pm = wkt.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/);
        if (pm) out.push({ lng: Number(pm[1]), lat: Number(pm[2]) });
      }
    } catch {}
  }
  if (out.length === 0 && record?.latitude != null && record?.longitude != null) {
    out.push({ lat: Number(record.latitude), lng: Number(record.longitude) });
  }
  return out;
};

export default function TransferAreaDetailContent({
  selectedRecord,
  orgMap,
  symbolMap,
  symbolImageMap,
  portOptions,
  userMap,
  detailFiles,
  ddToDms,
  approvalStyleMap,
  operationalStyleMap,
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
}: TransferAreaDetailContentProps) {
  const r = selectedRecord;
  const [indicatorOpen, setIndicatorOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<any>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [viewingWaterArea, setViewingWaterArea] = useState<any | null>(null);

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const res = await api.get(`/v1/transfer-area/${r.id}/attachments/${fileId}/download`, { responseType: 'blob' });
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
        const res = await api.get(`/v1/transfer-area/${r.id}/attachments/${file.id}/download`, { responseType: 'blob' });
        setPreviewImageUrl(window.URL.createObjectURL(new Blob([res.data])));
      }
    } catch {
      toast.error('Không thể tải hình ảnh để xem chi tiết');
    } finally {
      setPreviewLoading(false);
    }
  };

  const coords = parseGisCoordinates(r);
  const portLabel = portOptions.find(o => o.value === r.portId)?.label || r.portId || '';
  const provinceLabel = r.provinceId ? (VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '') : '';
  const waterAreaList: any[] = (r as any)?.mooringWaterAreas || [];

  return (
    <>
      <style>{`
        .transfer-area-detail-content-wrapper,
        .transfer-area-detail-content-wrapper .chk-detail-label,
        .transfer-area-detail-content-wrapper .chk-detail-value,
        .transfer-area-detail-content-wrapper .ant-table,
        .transfer-area-detail-content-wrapper .ant-table-cell,
        .transfer-area-detail-content-wrapper .ant-table-thead > tr > th,
        .transfer-area-detail-content-wrapper .ant-tabs-tab,
        .transfer-area-detail-content-wrapper .ant-btn,
        .transfer-area-detail-content-wrapper .ant-select,
        .transfer-area-detail-content-wrapper .ant-select-selection-item,
        .transfer-area-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .transfer-area-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }
        .transfer-area-detail-content-wrapper .chk-detail-row--full { grid-column: 1 / -1 !important; }
        .transfer-area-detail-content-wrapper .chk-detail-label,
        .transfer-area-detail-content-wrapper .sec-col1-label,
        .transfer-area-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .transfer-area-detail-content-wrapper .chk-detail-row--full .chk-detail-label {
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
        .transfer-area-detail-content-wrapper .chk-detail-row .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
          align-self: flex-start !important;
          white-space: normal !important;
        }
        .transfer-area-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }
        .transfer-area-detail-content-wrapper .chk-detail-value {
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
        .transfer-area-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
          align-items: stretch !important;
        }

        @media (max-width: 960px) {
          .transfer-area-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .transfer-area-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .transfer-area-detail-content-wrapper .chk-detail-label,
          .transfer-area-detail-content-wrapper .sec-col1-label,
          .transfer-area-detail-content-wrapper .chk-detail-row .sec-col2-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }

        @media (max-width: 640px) {
          .transfer-area-detail-content-wrapper .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .transfer-area-detail-content-wrapper .chk-detail-label,
          .transfer-area-detail-content-wrapper .sec-col1-label,
          .transfer-area-detail-content-wrapper .chk-detail-row .sec-col2-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .transfer-area-detail-content-wrapper .chk-detail-value {
            width: 100% !important;
            min-width: 100% !important;
          }
        }
      `}</style>

      <div className="transfer-area-detail-content-wrapper">
        <Tabs
          defaultActiveKey="general"
          tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
          items={[
            {
              key: 'general',
              label: 'Thông tin chung',
              children: (
                <div style={generalScrollerStyle}>
                  {/* Card 1: Thông tin cơ bản & Quản lý vận hành */}
                  <div style={sectionBoxStyle}>
                    <div style={sectionHeaderStyle}>
                      <div style={sectionTitleStyle}>
                        <BankOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin cơ bản & Quản lý vận hành</span>
                      </div>
                    </div>
                    <div className="chk-detail-grid">
                      {[
                        ['Mã khu chuyển tải', <span key="transferAreaCode" style={{ ...statusBadgeStyle(actionPrimary), whiteSpace: 'nowrap' }}>{r.transferAreaCode || ''}</span>],
                        ['Tên khu chuyển tải', <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{r.transferAreaName || ''}</span>],
                        ['Đơn vị quản lý', <span style={{ fontWeight: fontWeightBold }}>{orgMap.get(r.orgUnitId || '') || r.orgUnitId || ''}</span>],
                        ['Thuộc cảng biển', <span style={{ fontWeight: fontWeightBold }}>{portLabel}</span>],
                        ['Địa điểm (Tỉnh/Thành phố)', provinceLabel],
                        ['Công năng khai thác', formatOperationalFunctions(r.operationalFunctions)],
                        ['Tình trạng', (() => {
                          const s = r.operationalStatus;
                          const b = s && operationalStyleMap[s];
                          return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : '';
                        })()],
                      ].map(([label, value], index) => {
                        const isCode = label === 'Mã khu chuyển tải';
                        const isLongCode = isCode && ((r.transferAreaCode || '').trim().length > 20);
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

                  {/* Card 2: Thông số kỹ thuật & Năng lực khai thác */}
                  <div style={sectionBoxStyle}>
                    <div
                      onClick={() => setIndicatorOpen(!indicatorOpen)}
                      style={{
                        ...sectionHeaderStyle,
                        cursor: 'pointer',
                        userSelect: 'none',
                        marginBottom: indicatorOpen ? spaceFormField : 0,
                        borderBottom: indicatorOpen ? '1px solid #f1f5f9' : 'none',
                      }}
                    >
                      <div style={sectionTitleStyle}>
                        <SlidersOutlined style={{ color: actionPrimary }} />
                        <span>Thông số kỹ thuật & Năng lực khai thác</span>
                      </div>
                      <Button type="text" size="small" icon={indicatorOpen ? <DownOutlined /> : <RightOutlined />} />
                    </div>
                    {indicatorOpen && (
                      <div className="chk-detail-grid">
                        {[
                          ['Hình dạng', r.shapeDescription || ''],
                          ['Diện tích (ha)', formatNumericDisplay(r.area)],
                          ['Độ sâu thiết kế (m)', formatNumericDisplay(r.designWaterDepth)],
                          ['Độ sâu hiện tại (m)', formatNumericDisplay(r.currentWaterDepth)],
                          ['Cao độ đáy thiết kế (m)', formatNumericDisplay(r.bottomElevationDesign)],
                          ['Cỡ tàu khai thác tối đa (DWT)', formatNumericDisplay(r.maxVesselDWT)],
                          ['Số lượng khu chuyển tải đang khai thác', formatNumericDisplay(r.activeTransferCount)],
                          ['Số lượng khu chuyển tải đã công bố', formatNumericDisplay(r.publishedTransferCount)],
                          ['Số lượng khu chuyển tải đang thỏa thuận đầu tư', formatNumericDisplay(r.underInvestmentTransferCount)],
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

                  {/* Card 3: Thông tin công bố mở, đưa vào sử dụng */}
                  <div style={sectionBoxStyle}>
                    <div
                      onClick={() => setAnnouncementOpen(!announcementOpen)}
                      style={{
                        ...sectionHeaderStyle,
                        cursor: 'pointer',
                        userSelect: 'none',
                        marginBottom: announcementOpen ? spaceFormField : 0,
                        borderBottom: announcementOpen ? '1px solid #f1f5f9' : 'none',
                      }}
                    >
                      <div style={sectionTitleStyle}>
                        <FileTextOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin công bố mở, đưa vào sử dụng</span>
                      </div>
                      <Button type="text" size="small" icon={announcementOpen ? <DownOutlined /> : <RightOutlined />} />
                    </div>
                    {announcementOpen && (
                      <div className="chk-detail-grid">
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-col1-label">Thời điểm công bố mở</span>
                          <span className="chk-detail-value">{formatDateOnly(r.openingAnnouncementDate)}</span>
                        </div>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-col1-label">Quyết định công bố/văn bản cho phép khai thác</span>
                          <span className="chk-detail-value">{r.publicDecision || ''}</span>
                        </div>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-col1-label">Văn bản thỏa thuận đầu tư</span>
                          <span className="chk-detail-value">{r.investmentAgreement || ''}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 4: Thông tin thời gian hoạt động */}
                  <div style={sectionBoxStyle}>
                    <div
                      onClick={() => setActivityOpen(!activityOpen)}
                      style={{
                        ...sectionHeaderStyle,
                        cursor: 'pointer',
                        userSelect: 'none',
                        marginBottom: activityOpen ? spaceFormField : 0,
                        borderBottom: activityOpen ? '1px solid #f1f5f9' : 'none',
                      }}
                    >
                      <div style={sectionTitleStyle}>
                        <CalendarOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin thời gian hoạt động</span>
                      </div>
                      <Button type="text" size="small" icon={activityOpen ? <DownOutlined /> : <RightOutlined />} />
                    </div>
                    {activityOpen && (
                      <div className="chk-detail-grid">
                        <div className="chk-detail-row">
                          <span className="chk-detail-label sec-col1-label">Từ ngày</span>
                          <span className="chk-detail-value">{formatDateOnly(r.activityStartDate)}</span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label sec-col2-label">Đến ngày</span>
                          <span className="chk-detail-value">{formatDateOnly(r.activityEndDate)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 5: Section toggle Thông tin phê duyệt (Chuẩn Pier/Port nằm trong Tab Thông tin chung) */}
                  <div style={sectionBoxStyle}>
                    <div
                      style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', borderBottom: approvalOpen ? '1px solid #f1f5f9' : 'none', marginBottom: approvalOpen ? spaceFormField : 0 }}
                      onClick={() => setApprovalOpen(!approvalOpen)}
                    >
                      <div style={sectionTitleStyle}>
                        <AuditOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin phê duyệt</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spaceSm }}>
                        {r.approvalStatus && approvalStyleMap[r.approvalStatus] && (
                          <span style={statusBadgeStyle(approvalStyleMap[r.approvalStatus].color)}>
                            {approvalStyleMap[r.approvalStatus].label}
                          </span>
                        )}
                        <Button type="text" size="small" icon={approvalOpen ? <DownOutlined /> : <RightOutlined />} />
                      </div>
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
                        {r.rejectionReason && (
                          <div className="chk-detail-row chk-detail-row--full">
                            <span className="chk-detail-label sec-col1-label" style={{ color: '#E34948' }}>Lý do từ chối</span>
                            <span className="chk-detail-value" style={{ color: '#E34948' }}>{r.rejectionReason}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ),
            },

            // Tab 2: Vị trí (GIS)
            {
              key: 'gis',
              label: `Thông tin vị trí (${coords.length})`,
              children: (
                <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                  <div style={sectionBoxStyle}>
                    <div className="chk-detail-grid">
                      {[
                        ['Loại đối tượng', (() => {
                          const gt = String(r.geometryType || '');
                          const labels: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };
                          return labels[gt] || gt || '';
                        })()],
                        ['Biểu tượng', (() => {
                          const symbolId = r.mapSymbolId || '';
                          const name = symbolMap.get(symbolId) || symbolId || '';
                          const image = symbolImageMap.get(symbolId);
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: spaceSm }}>
                              {image ? <img src={image} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}
                              {name}
                            </span>
                          );
                        })()],
                        ['Hệ quy chiếu', r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : ''],
                        ['Quy tắc hiển thị', (r.geometryType || r.coordinates || r.latitude != null || r.longitude != null) ? 'Độ, phút, giây (DMS)' : ''],
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
                      dataSource={coords.map(point => ({ ...point }))}
                      emptyText="Chưa có tọa độ GPS nào"
                      scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                      columns={[
                        { title: 'STT', width: 50, render: (_v, _r, idx) => idx + 1 },
                        {
                          title: 'Vĩ độ (Latitude - N)',
                          key: 'lat',
                          render: (_value, record) => {
                            const dms = ddToDms(record.lat);
                            return `${dms.d}° ${dms.m}' ${dms.s}" N`;
                          },
                        },
                        {
                          title: 'Kinh độ (Longitude - E)',
                          key: 'lng',
                          render: (_value, record) => {
                            const dms = ddToDms(record.lng);
                            return `${dms.d}° ${dms.m}' ${dms.s}" E`;
                          },
                        },
                      ]}
                    />
                  </div>
                </div>
              ),
            },

            // Tab 3: File đính kèm
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
                      { title: 'Người tải lên', dataIndex: 'uploadedBy', key: 'uploadedBy', width: 180, render: (v: string) => userMap.get(v) || v || '' },
                      { title: 'Ngày tải lên', dataIndex: 'uploadedAt', key: 'uploadedAt', width: 135, align: 'center' as const, render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '' },
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

            // Tab 4: Khu nước neo buộc tàu
            {
              key: 'mooringWaterAreas',
              label: `Khu nước neo buộc tàu (${waterAreaList.length})`,
              children: (
                <div style={{ paddingTop: 6 }}>
                  <div style={{ marginBottom: spaceSm }}>
                    <span style={detailLabelStyle}>Khu nước neo buộc tàu</span>
                  </div>
                  <DetailTable
                    dataSource={waterAreaList.map((w, i) => ({ ...w, _idx: i }))}
                    emptyText="Chưa có khu nước neo buộc tàu nào"
                    scrollY={waterAreaList.length === 0 ? undefined : DRAWER_TABLE_SCROLL_Y.detailView}
                    columns={[
                      { title: 'STT', width: 50, align: 'center' as const, render: (_v, _r, idx) => idx + 1 },
                      { title: 'Phạm vi khu nước neo buộc tàu', key: 'description', dataIndex: 'description', ellipsis: true },
                      { title: 'Loại đối tượng', key: 'geometryType', width: 150, render: (gt) => gt === 'POINT' ? 'Đối tượng điểm' : gt === 'LINE' ? 'Đối tượng đường' : gt === 'POLYGON' ? 'Đối tượng vùng' : '' },
                      { title: 'Số điểm neo', key: 'anchorCount', width: 120, align: 'center' as const, render: (_v, record: any) => record.anchorPoints?.length || 0 },
                      {
                        title: 'Thao tác',
                        key: 'actions',
                        width: 100,
                        align: 'center' as const,
                        render: (_v, record: any) => (
                          <Tooltip title="Xem điểm neo">
                            <Button
                              type="text"
                              size="small"
                              icon={<EyeOutlined style={{ color: actionPrimary }} />}
                              onClick={() => setViewingWaterArea(record)}
                            >
                              Xem điểm neo
                            </Button>
                          </Tooltip>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },

            // Tab 5: Vận hành & bảo trì (kết hợp kế hoạch vận hành, bảo trì, và sự cố như Cầu cảng)
            {
              key: 'operationMaintenance',
              label: 'Vận hành & bảo trì',
              children: (
                <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
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
                        rowKey={(rec) => rec.id || rec.planCode || rec.code || ''}
                        scrollY={160}
                        columns={[
                          { title: 'STT', width: 50 },
                          { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v, rec) => v || rec.code || '' },
                          { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v, rec) => v || rec.name || '' },
                          { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'start', width: 150, align: 'center' as const, render: (v, rec) => fmtDateTime(v || rec.startTime || rec.start || null) },
                          { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'end', width: 150, align: 'center' as const, render: (v, rec) => fmtDateTime(v || rec.endTime || rec.end || null) },
                        ]}
                      />
                    )}
                  </div>

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
                        rowKey={(rec) => rec.id || rec.planCode || rec.code || ''}
                        scrollY={160}
                        columns={[
                          { title: 'STT', width: 50 },
                          { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v, rec) => v || rec.code || '' },
                          { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v, rec) => v || rec.name || '' },
                          { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'start', width: 150, align: 'center' as const, render: (v, rec) => fmtDateTime(v || rec.start || rec.startDate || null) },
                          { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'end', width: 150, align: 'center' as const, render: (v, rec) => fmtDateTime(v || rec.end || rec.endDate || null) },
                        ]}
                      />
                    )}
                  </div>

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
                        rowKey={(rec) => rec.id || rec.incidentCode || rec.code || ''}
                        scrollY={160}
                        columns={[
                          { title: 'STT', width: 50 },
                          { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v, rec) => v || rec.code || '' },
                          { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v, rec) => v || rec.type || '' },
                          { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v) => v || '' },
                          { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'center' as const, render: (v, rec) => fmtDateTime(v || rec.time || null) },
                        ]}
                      />
                    )}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* GIS Location Selector Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              Vị trí khu chuyển tải trên bản đồ
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
                let geom: 'POINT' | 'LINE' | 'POLYGON' = (r.geometryType as any) || 'POINT';
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



      {/* Modal Xem chi tiết điểm neo trong khu nước */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CompassOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              Điểm neo — {viewingWaterArea?.description || 'Khu nước neo buộc tàu'}
            </span>
          </div>
        }
        open={!!viewingWaterArea}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewingWaterArea(null)} style={{ ...primaryButtonStyle, borderRadius: radiusPill }}>
            Đóng
          </Button>,
        ]}
        onCancel={() => setViewingWaterArea(null)}
        width={680}
      >
        <div style={{ padding: '8px 0' }}>
          <Table
            size="small"
            pagination={false}
            dataSource={(viewingWaterArea?.anchorPoints || []).map((p: any, i: number) => ({ ...p, _idx: i }))}
            rowKey="_idx"
            locale={{ emptyText: 'Chưa có điểm neo nào' }}
            columns={[
              { title: 'STT', width: 50, align: 'center' as const, render: (_v, _r, idx) => idx + 1 },
              { title: 'Tên điểm neo', dataIndex: 'name', key: 'name' },
              {
                title: 'Vĩ độ (N)',
                key: 'latitude',
                render: (_v, record: any) => {
                  if (record.latitude == null) return '';
                  const d = ddToDms(record.latitude);
                  return `${d.d}° ${d.m}' ${d.s}" N`;
                },
              },
              {
                title: 'Kinh độ (E)',
                key: 'longitude',
                render: (_v, record: any) => {
                  if (record.longitude == null) return '';
                  const d = ddToDms(record.longitude);
                  return `${d.d}° ${d.m}' ${d.s}" E`;
                },
              },
            ]}
          />
        </div>
      </Modal>
    </>
  );
}
