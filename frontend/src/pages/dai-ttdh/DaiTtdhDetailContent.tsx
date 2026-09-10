/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Tabs, Tooltip, Button, Modal } from 'antd';
import {
  AuditOutlined,
  BankOutlined,
  DownloadOutlined,
  DownOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileOutlined,
  RightOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import {
  generalScrollerStyle,
  sectionBoxStyle,
  sectionHeaderStyle,
  sectionTitleStyle,
  detailLabelStyle,
} from '../../components/detail-drawer/detailSkin';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import {
  colors,
  actionPrimary,
  textTertiary,
  surfaceCard,
  fontWeightBold,
  spaceSm,
  spaceMd,
  spaceFormField,
  fontSizeSm,
  fontSizeLg,
  statusOperational,
  statusAttention,
  statusCritical,
  outlineButtonStyle,
  primaryButtonStyle,
  statusBadgeStyle,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import type { DaiTtdh } from '../../types/port';
import { resolveOrgLevel2Name } from '../../components/org-unit';
import { VIETNAM_PROVINCES } from '../../types/common';
import { DAI_TTDH_STATION_LEVEL_OPTIONS, DAI_TTDH_SERVICES_OPTIONS } from './DaiTtdhForm';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';

const fontSizeMd = 13.5;

const isImageFile = (fileName?: string): boolean => {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff'].includes(ext || '');
};

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
  createdDate?: string;
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
  type?: string;
  location?: string;
  incidentTime?: string;
  time?: string;
}

export interface DaiTtdhDetailContentProps {
  selectedRecord: DaiTtdh;
  orgMap: Map<string, string>;
  organizations?: Array<{ id: string; name: string; code?: string; parentId?: string }>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  userMap: Map<string, string>;
  detailFiles: AttachmentFile[];
  ddToDms?: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  operationalStyleMap?: Record<string, { color: string; label: string }>;
  operationPlanList?: DetailTableRow[];
  maintenancePlanList?: DetailTableRow[];
  incidentList?: DetailTableRow[];
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
          const pts = m[1].split(',');
          const list: Array<{ lat: number; lng: number }> = [];
          pts.forEach((p: string) => { const [lng, lat] = p.trim().split(/\s+/); if (!isNaN(Number(lat))) list.push({ lng: Number(lng), lat: Number(lat) }); });
          if (list.length > 1 && list[0].lng === list[list.length - 1].lng) list.pop();
          out.push(...list);
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

const defaultDdToDms = (dd: number | null | undefined): { d: number; m: number; s: number } => {
  if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60 * 100) / 100;
  return { d, m, s };
};

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '');

export default function DaiTtdhDetailContent({
  selectedRecord,
  orgMap,
  organizations = [],
  symbolMap,
  symbolImageMap,
  userMap,
  detailFiles,
  ddToDms,
  approvalStyleMap,
  operationalStyleMap,
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
}: DaiTtdhDetailContentProps) {
  const r = selectedRecord;
  const resolveDdToDms = (val: any) => {
    if (ddToDms) return ddToDms(Number(val));
    return defaultDdToDms(Number(val));
  };
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<AttachmentFile | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const stationLevelLabel = (v?: number) => DAI_TTDH_STATION_LEVEL_OPTIONS.find(o => o.value === v)?.label || (v != null ? String(v) : '');
  const servicesLabels = (v?: string) => {
    if (!v) return '';
    return v.split(',').map(s => s.trim()).filter(Boolean)
      .map(s => DAI_TTDH_SERVICES_OPTIONS.find(o => o.value === s)?.label || s)
      .join(', ') || '';
  };

  const resolveOperatingUnit = (id?: string, name?: string) => {
    if (name) return name;
    if (!id) return '';
    const trimmed = id.trim();
    const lower = trimmed.toLowerCase();
    const found = DEFAULT_OPERATING_ORGANIZATIONS.find(
      (o) => o.id === trimmed || o.id.toLowerCase() === lower || o.code === trimmed || o.code.toLowerCase() === lower
    );
    return found ? found.name : trimmed;
  };

  const resolveUserName = (uid?: string) => {
    if (!uid) return '';
    const trimmed = uid.trim();
    return userMap.get(trimmed) || userMap.get(trimmed.toLowerCase()) || trimmed;
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const res = await api.get(`/v1/dai-ttdh/${r.id}/attachments/${fileId}/download`, { responseType: 'blob' });
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

  const handlePreviewImage = async (file: AttachmentFile) => {
    setPreviewImageFile(file);
    setPreviewImageUrl('');
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    try {
      if (file.url) {
        setPreviewImageUrl(file.url);
      } else {
        const res = await api.get(`/v1/dai-ttdh/${r.id}/attachments/${file.id}/download`, { responseType: 'blob' });
        setPreviewImageUrl(window.URL.createObjectURL(new Blob([res.data])));
      }
    } catch {
      toast.error('Không thể tải hình ảnh để xem chi tiết');
    } finally {
      setPreviewLoading(false);
    }
  };

  const coords = parseGisCoordinates(r);
  const orgDisplayName = resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(r.orgUnitId || '') || r.orgUnitId || '';

  return (
    <div className="daittdh-detail-content-wrapper">
      <style>{`
        .daittdh-detail-content-wrapper,
        .daittdh-detail-content-wrapper .chk-detail-label,
        .daittdh-detail-content-wrapper .chk-detail-value,
        .daittdh-detail-content-wrapper .ant-table,
        .daittdh-detail-content-wrapper .ant-table-cell,
        .daittdh-detail-content-wrapper .ant-table-thead > tr > th,
        .daittdh-detail-content-wrapper .ant-tabs-tab,
        .daittdh-detail-content-wrapper .ant-btn,
        .daittdh-detail-content-wrapper .ant-select,
        .daittdh-detail-content-wrapper .ant-select-selection-item,
        .daittdh-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .daittdh-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }
        .daittdh-detail-content-wrapper .chk-detail-row--full { grid-column: 1 / -1 !important; }
        .daittdh-detail-content-wrapper .chk-detail-label,
        .daittdh-detail-content-wrapper .sec-col1-label,
        .daittdh-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .daittdh-detail-content-wrapper .chk-detail-row--full .chk-detail-label {
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
        .daittdh-detail-content-wrapper .chk-detail-row .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
          color: #12468c !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          text-align: left !important;
          line-height: 1.5 !important;
          align-self: flex-start !important;
          white-space: normal !important;
        }
        .daittdh-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }
        .daittdh-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-label {
          width: auto !important;
          min-width: auto !important;
          max-width: none !important;
          flex-shrink: 0 !important;
        }
        .daittdh-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-value {
          margin-left: 28px !important;
          justify-content: flex-start !important;
        }
        .daittdh-detail-content-wrapper .chk-detail-value {
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
        .daittdh-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
          align-items: stretch !important;
        }

        /* Khi dữ liệu dài, tự xuống dòng trong đúng ô value — tránh đè lên cột/hàng kế tiếp */
        .daittdh-detail-content-wrapper .chk-detail-row {
          align-items: flex-start !important;
          min-height: 36px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }
        .daittdh-detail-content-wrapper .chk-detail-row .chk-detail-label {
          align-self: flex-start !important;
          white-space: normal !important;
          line-height: 1.5 !important;
        }

        @media (max-width: 960px) {
          .daittdh-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .daittdh-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .daittdh-detail-content-wrapper .chk-detail-label,
          .daittdh-detail-content-wrapper .sec-col1-label,
          .daittdh-detail-content-wrapper .chk-detail-row .sec-col2-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }

        @media (max-width: 640px) {
          .daittdh-detail-content-wrapper .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .daittdh-detail-content-wrapper .chk-detail-label,
          .daittdh-detail-content-wrapper .sec-col1-label,
          .daittdh-detail-content-wrapper .chk-detail-row .sec-col2-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .daittdh-detail-content-wrapper .chk-detail-value {
            width: 100% !important;
            min-width: 100% !important;
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
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Mã đài</span>
                      <span className="chk-detail-value">
                        <span style={{ ...statusBadgeStyle(actionPrimary), whiteSpace: 'nowrap' }}>{r.daiTtdhCode || ''}</span>
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tên đài</span>
                      <span className="chk-detail-value" style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{r.daiTtdhName || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Đơn vị quản lý</span>
                      <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>{orgDisplayName}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Đơn vị khai thác</span>
                      <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>{resolveOperatingUnit(r.operatingUnitId, r.operatingUnitName)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Phân loại đài</span>
                      <span className="chk-detail-value">{stationLevelLabel(r.stationLevel)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tình trạng</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const s = r.operationalStatus;
                          const m: Record<string, { color: string; label: string }> = {
                            OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
                            NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
                            SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
                          };
                          const b = s && (operationalStyleMap?.[s] || m[s]);
                          return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : '';
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Địa điểm (Tỉnh/Thành phố)</span>
                      <span className="chk-detail-value">{r.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '' : ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Dịch vụ cung cấp</span>
                      <span className="chk-detail-value">{servicesLabels(r.servicesProvided)}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Địa điểm chi tiết</span>
                      <span className="chk-detail-value">{r.detailedLocation || ''}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Vùng phủ sóng</span>
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.coverageArea || ''}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Ghi chú</span>
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.remarks || ''}</span>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Thông tin phê duyệt (Toggle chuẩn AGENTS.md) ── */}
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
                          {resolveUserName(r.updatedBy) ? (
                            <span style={{ fontWeight: fontWeightBold }}>{resolveUserName(r.updatedBy)}</span>
                          ) : ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Cán bộ gửi phê duyệt</span>
                        <span className="chk-detail-value">
                          {resolveUserName(r.submittedForApprovalBy) ? (
                            <span style={{ fontWeight: fontWeightBold }}>{resolveUserName(r.submittedForApprovalBy)}</span>
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
                          {resolveUserName(r.portAuthorityApprovedBy) ? (
                            <span style={{ fontWeight: fontWeightBold }}>{resolveUserName(r.portAuthorityApprovedBy)}</span>
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
                          {resolveUserName(r.departmentApprovedBy) ? (
                            <span style={{ fontWeight: fontWeightBold }}>{resolveUserName(r.departmentApprovedBy)}</span>
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
                          <span className="chk-detail-label sec-col1-label" style={{ color: statusCritical }}>Lý do từ chối</span>
                          <span className="chk-detail-value" style={{ color: statusCritical, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.rejectionReason}</span>
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
            label: `Thông tin vị trí (${coords.length})`,
            children: (
              <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                <div style={sectionBoxStyle}>
                  <div className="chk-detail-grid">
                    {[
                      ['Loại đối tượng', (() => { const gt = String((r as any).geometryType || ''); const labels: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }; return labels[gt] || gt || ''; })()],
                      ['Biểu tượng', (() => { const symbolId = r.mapSymbolId || ''; const name = symbolMap.get(symbolId) || symbolId || ''; const image = symbolImageMap.get(symbolId); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: spaceSm }}>{image ? <img src={image} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{name}</span>; })()],
                      ['Hệ quy chiếu', r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : ''],
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
                      { title: 'STT', width: 50, align: 'center' as const },
                      {
                        title: 'Vĩ độ (Latitude - N)',
                        key: 'lat',
                        render: (_value, record) => {
                          const dms = resolveDdToDms(record.lat);
                          return `${dms.d}° ${dms.m}' ${dms.s}" N`;
                        },
                      },
                      {
                        title: 'Kinh độ (Longitude - E)',
                        key: 'lng',
                        render: (_value, record) => {
                          const dms = resolveDdToDms(record.lng);
                          return `${dms.d}° ${dms.m}' ${dms.s}" E`;
                        },
                      },
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
                    { title: 'STT', width: 50, align: 'center' as const, render: (_: any, __: any, idx: number) => idx + 1 },
                    {
                      title: 'Tên tài liệu',
                      dataIndex: 'fileName',
                      key: 'fileName',
                      render: (v: string, rec: any) => {
                        const fileName = v || rec.name || '';
                        const isImg = isImageFile(fileName);
                        return (
                          <span
                            style={{ display: 'inline-flex', alignItems: 'center', gap: spaceSm, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', color: actionPrimary, fontWeight: fontWeightBold }}
                            title={isImg ? `${fileName} (Nhấp để xem chi tiết ảnh)` : `${fileName} (Nhấp để tải xuống)`}
                            onClick={() => { if (isImg) handlePreviewImage(rec); else handleDownloadFile(rec.id, fileName); }}
                          >
                            {isImg ? <FileImageOutlined style={{ color: actionPrimary, flexShrink: 0 }} /> : <FileOutlined style={{ color: textTertiary, flexShrink: 0 }} />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
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
                        const sz = v ?? rec.size;
                        return sz ? (sz > 1024 * 1024 ? `${(sz / (1024 * 1024)).toFixed(2)} MB` : `${(sz / 1024).toFixed(1)} KB`) : '';
                      },
                    },
                    {
                      title: 'Người tải lên',
                      dataIndex: 'uploadedBy',
                      key: 'uploadedBy',
                      width: 180,
                      render: (v: string, item: any) => item?.uploadedByName || (item?.uploadedBy ? userMap?.get(item.uploadedBy) || item.uploadedBy : '') || userMap?.get(v) || v || '',
                    },
                    {
                      title: 'Ngày tải lên',
                      dataIndex: 'uploadedAt',
                      key: 'uploadedAt',
                      width: 150,
                      align: 'left' as const,
                      render: (v: string, item: any) => {
                        const d = v || item?.uploadedDate || item?.createdDate;
                        return d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '';
                      },
                    },
                    {
                      title: 'Thao tác',
                      key: 'actions',
                      width: 90,
                      align: 'center' as const,
                      render: (_: any, rec: any) => {
                        const fileName = rec.fileName || rec.name || '';
                        const isImg = isImageFile(fileName);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            {isImg ? (
                              <Tooltip title="Xem chi tiết ảnh">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EyeOutlined style={{ color: actionPrimary, fontSize: 16 }} />}
                                  onClick={() => handlePreviewImage(rec)}
                                  style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                />
                              </Tooltip>
                            ) : (
                              <span style={{ width: 28, height: 28, display: 'inline-block' }} />
                            )}
                            <Tooltip title="Tải xuống tệp">
                              <Button
                                type="text"
                                size="small"
                                icon={<DownloadOutlined style={{ color: actionPrimary, fontSize: 16 }} />}
                                onClick={() => handleDownloadFile(rec.id, fileName)}
                                style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              />
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
                      <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
                        {previewImageFile?.fileName || previewImageFile?.name || 'Xem chi tiết hình ảnh'}
                      </span>
                    </div>
                  }
                  open={previewModalOpen}
                  onCancel={() => setPreviewModalOpen(false)}
                  footer={[
                    <Button key="download" icon={<DownloadOutlined />} onClick={() => previewImageFile && handleDownloadFile(previewImageFile.id, previewImageFile.fileName || previewImageFile.name || 'image')} style={{ borderRadius: 999 }}>
                      Tải xuống
                    </Button>,
                    <Button key="close" type="primary" onClick={() => setPreviewModalOpen(false)} style={{ borderRadius: 999, background: actionPrimary, borderColor: actionPrimary }}>
                      Đóng
                    </Button>,
                  ]}
                  width="min(800px, 90vw)"
                  centered
                  destroyOnClose
                >
                  <div style={{ textAlign: 'center', padding: '16px 0', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8 }}>
                    {previewLoading ? (
                      <div style={{ color: textTertiary }}>Đang tải hình ảnh...</div>
                    ) : previewImageUrl ? (
                      <img src={previewImageUrl} alt={previewImageFile?.fileName || previewImageFile?.name || 'Ảnh đính kèm'} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} />
                    ) : null}
                  </div>
                </Modal>
              </div>
            ),
          },
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
    </div>
  );
}
