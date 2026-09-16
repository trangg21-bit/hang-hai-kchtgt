import React, { useState, useEffect } from 'react';
import { Tabs, Button, Tooltip, Modal } from 'antd';
import {
  BankOutlined,
  AuditOutlined,
  SlidersOutlined,
  DownOutlined,
  RightOutlined,
  FileOutlined,
  DownloadOutlined,
  FileImageOutlined,
  EyeOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../../components/ToastNotification';
import { cospasSarsatStationService } from '../../../services/cospasSarsatStationService';
import type { CoastalStationCospasSarsatResponse } from '../../../services/station/types';
import { ConditionStatus, ApprovalStatus } from '../../../types/vtsSystem';
import {
  colors,
  actionPrimary,
  fontWeightBold,
  fontWeightMedium,
  fontSizeSm,
  textSecondary,
  textTertiary,
  statusOperational,
  statusAttention,
  statusCritical,
  radiusPill,
  statusBadgeStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  surfaceCard,
  DRAWER_TABLE_SCROLL_Y,
  getVtsConditionStatusColor,
  getVtsConditionStatusLabel,
  formatUserDisplayName,
  isUuidString,
} from '../../../themetokenchk';
import { getProvinceNameById } from '../../../types/common';
import DetailTable from '../../../components/shared/DetailTable';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import GisLocationSelector from '../../../components/gis/GisLocationSelector';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import { parseWktToCoordinates } from '../../../utils/gisGeometry';
import { LRIT_SERVICE_OPTIONS } from '../../../types/lritStation';

const fontSizeMd = 13.5;

const isImageFile = (name?: string): boolean => {
  if (!name) return false;
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
};

const cospasDetailStyle = `
  .cospas-detail-content-wrapper {
    overflow: hidden !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .cospas-detail-content-wrapper,
  .cospas-detail-content-wrapper .chk-detail-label,
  .cospas-detail-content-wrapper .chk-detail-value,
  .cospas-detail-content-wrapper .ant-table,
  .cospas-detail-content-wrapper .ant-table-cell,
  .cospas-detail-content-wrapper .ant-table-thead > tr > th,
  .cospas-detail-content-wrapper .ant-tabs-tab,
  .cospas-detail-content-wrapper .ant-btn,
  .cospas-detail-content-wrapper .ant-select,
  .cospas-detail-content-wrapper .ant-select-selection-item,
  .cospas-detail-content-wrapper .ant-select-item {
    font-size: 13.5px !important;
  }

  .cospas-detail-content-wrapper .chk-detail-grid {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
    column-gap: 28px !important;
    row-gap: 0 !important;
  }

  .cospas-detail-content-wrapper .chk-detail-row {
    display: flex !important;
    align-items: flex-start !important;
    min-height: 36px !important;
    padding: 7px 0 !important;
    border-bottom: 1px solid #f1f5f9 !important;
    line-height: 1.5 !important;
    gap: 10px !important;
  }

  .cospas-detail-content-wrapper .chk-detail-row:last-child {
    border-bottom: none !important;
  }

  /* Loại bỏ hoàn toàn đường kẻ gạch ngang dưới ô bảng khi không có dữ liệu */
  .cospas-detail-content-wrapper .ant-table-placeholder > td,
  .cospas-detail-content-wrapper .ant-table-placeholder .ant-table-cell,
  .cospas-detail-content-wrapper .ant-table-tbody > tr.ant-table-placeholder > td {
    border-bottom: none !important;
  }

  .cospas-detail-content-wrapper .chk-detail-row--full {
    grid-column: 1 / -1 !important;
  }

  .cospas-sarsat-drawer-scope .cospas-detail-content-wrapper .chk-detail-row .chk-detail-label,
  .cospas-detail-content-wrapper .chk-detail-label {
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

  .cospas-sarsat-drawer-scope .cospas-detail-content-wrapper .chk-detail-row .sec-col1-label,
  .cospas-detail-content-wrapper .sec-col1-label {
    width: 215px !important;
    min-width: 215px !important;
    max-width: 215px !important;
    flex-shrink: 0 !important;
  }

  .cospas-sarsat-drawer-scope .cospas-detail-content-wrapper .chk-detail-row .sec-col2-label,
  .cospas-detail-content-wrapper .sec-col2-label {
    width: 250px !important;
    min-width: 250px !important;
    max-width: 250px !important;
    flex-shrink: 0 !important;
  }

  .cospas-sarsat-drawer-scope .cospas-detail-content-wrapper .chk-detail-row .sec-full-label,
  .cospas-detail-content-wrapper .sec-full-label {
    width: 215px !important;
    min-width: 215px !important;
    max-width: 215px !important;
    flex-shrink: 0 !important;
  }

  .cospas-detail-content-wrapper .chk-detail-label::after {
    content: ':' !important;
    margin-left: 1px !important;
    margin-right: 4px !important;
  }

  .cospas-detail-content-wrapper .chk-detail-value {
    color: #1e293b !important;
    font-size: 13.5px !important;
    flex: 1 !important;
    min-width: 0 !important;
    text-align: left !important;
    line-height: 1.5 !important;
    word-break: break-word !important;
  }

  @media (max-width: 960px) {
    .cospas-detail-content-wrapper .chk-detail-grid {
      grid-template-columns: 1fr !important;
      column-gap: 0 !important;
    }
    .cospas-detail-content-wrapper .chk-detail-row--full {
      grid-column: 1 !important;
    }
    .cospas-sarsat-drawer-scope .cospas-detail-content-wrapper .chk-detail-row .chk-detail-label,
    .cospas-detail-content-wrapper .chk-detail-label,
    .cospas-detail-content-wrapper .sec-col1-label,
    .cospas-detail-content-wrapper .sec-col2-label,
    .cospas-detail-content-wrapper .sec-full-label {
      width: 250px !important;
      min-width: 250px !important;
      max-width: 250px !important;
    }
  }

  @media (max-width: 640px) {
    .cospas-detail-content-wrapper .chk-detail-row {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 3px !important;
      padding: 6px 0 !important;
    }
    .cospas-sarsat-drawer-scope .cospas-detail-content-wrapper .chk-detail-row .chk-detail-label,
    .cospas-detail-content-wrapper .chk-detail-label,
    .cospas-detail-content-wrapper .sec-col1-label,
    .cospas-detail-content-wrapper .sec-col2-label,
    .cospas-detail-content-wrapper .sec-full-label {
      width: 100% !important;
      min-width: 100% !important;
      max-width: 100% !important;
    }
    .cospas-detail-content-wrapper .chk-detail-value {
      width: 100% !important;
    }
  }
`;

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

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '');

const ddToDms = (dd?: number | null) => {
  if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
  return { d, m, s };
};

const parseGisCoordinates = (record: any): Array<{ lat: number; lng: number }> => {
  if (!record) return [];
  const out: Array<{ lat: number; lng: number }> = [];
  const raw = record.coordinates;
  if (raw && typeof raw === 'string' && raw.trim()) {
    const cleanWkt = raw.replace(/^SRID=\d+;\s*/i, '').trim();
    if (cleanWkt.startsWith('[') || cleanWkt.startsWith('{')) {
      try {
        const parsed = JSON.parse(cleanWkt);
        const pts = Array.isArray(parsed) ? parsed : (parsed.coordinates || []);
        if (Array.isArray(pts)) {
          pts.forEach((p: any) => {
            const lat = Number(p.latitude ?? p.lat);
            const lng = Number(p.longitude ?? p.lng);
            if (!isNaN(lat) && !isNaN(lng)) out.push({ lat, lng });
          });
        }
      } catch {}
    }
    if (out.length === 0) {
      const parsed = parseWktToCoordinates(cleanWkt);
      if (parsed.length > 0) {
        parsed.forEach((p) => {
          if (!isNaN(p.latitude) && !isNaN(p.longitude)) {
            out.push({ lat: p.latitude, lng: p.longitude });
          }
        });
      }
    }
  }
  if (out.length === 0 && Array.isArray(raw)) {
    raw.forEach((p: any) => {
      const lat = Number(p.latitude ?? p.lat);
      const lng = Number(p.longitude ?? p.lng);
      if (!isNaN(lat) && !isNaN(lng)) out.push({ lat, lng });
    });
  }
  if (out.length === 0 && record?.latitude != null && record?.longitude != null) {
    const lat = Number(record.latitude);
    const lng = Number(record.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      out.push({ lat, lng });
    }
  }
  return out;
};

const renderConditionStatusBadge = (status?: ConditionStatus | string | number) => {
  if (status == null || status === '') return null;
  const label = getVtsConditionStatusLabel(status);
  const color = getVtsConditionStatusColor(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        border: `1px solid ${color}40`,
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        background: `${color}15`,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

const renderApprovalBadge = (status?: ApprovalStatus | string) => {
  if (!status) return null;
  const map: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Lưu tạm', color: textTertiary },
    PENDING_APPROVAL: { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: statusAttention },
    APPROVED_LEVEL1: { label: 'Chờ phê duyệt cấp Cục', color: '#0284C7' },
    APPROVED: { label: 'Đã phê duyệt', color: statusOperational },
    REJECTED_LEVEL1: { label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
    REJECTED_LEVEL2: { label: 'Từ chối cấp Cục', color: statusCritical },
    ARCHIVED: { label: 'Đã xóa', color: statusCritical },
  };
  const item = map[String(status).toUpperCase()] || { label: String(status), color: textSecondary };
  return (
    <span style={statusBadgeStyle(item.color)}>
      {item.label}
    </span>
  );
};

export function getOperatingOrgName(idOrCode?: string | null, name?: string | null): string {
  if (name && name.trim() && !/^[0-9a-fA-F-]{36}$/.test(name)) return name;
  if (!idOrCode) return '—';
  const found = DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === idOrCode || o.code === idOrCode);
  return found ? found.name : (/^[0-9a-fA-F-]{36}$/.test(idOrCode) ? '—' : idOrCode);
}

export const COSPAS_SERVICE_OPTIONS = LRIT_SERVICE_OPTIONS;

export const LEGACY_COSPAS_SERVICE_OPTIONS = [
  { value: '406_MHZ_BEACON', label: '406 MHz Distress Beacon — Phao phát tín hiệu báo nạn 406 MHz' },
  { value: 'GEOSAR', label: 'GEOSAR — Hệ thống vệ tinh địa tĩnh Cospas-Sarsat' },
  { value: 'LEOSAR', label: 'LEOSAR — Hệ thống vệ tinh quỹ đạo thấp Cospas-Sarsat' },
  { value: 'MEOSAR', label: 'MEOSAR — Hệ thống vệ tinh quỹ đạo tầm trung thế hệ mới' },
  { value: 'EPIRB', label: 'EPIRB — Phao vô tuyến chỉ báo vị trí khẩn cấp hàng hải' },
  { value: 'ELT', label: 'ELT — Thiết bị phát sóng khẩn cấp cho máy bay' },
  { value: 'PLB', label: 'PLB — Thiết bị định vị cá nhân tìm kiếm cứu nạn' },
  { value: 'LUT', label: 'LUT — Trạm thu mặt đất xử lý tín hiệu cấp cứu' },
  { value: 'MCC', label: 'MCC — Trung tâm kiểm soát điều phối tìm kiếm cứu nạn' },
];

export function getServiceName(code: string): string {
  const found =
    LRIT_SERVICE_OPTIONS.find((s) => s.value === code || s.label === code) ||
    LEGACY_COSPAS_SERVICE_OPTIONS.find((s) => s.value === code || s.label === code);
  return found ? found.label : code;
}

export const renderServicesBadges = (services?: string[] | string) => {
  let list: string[] = [];
  if (Array.isArray(services)) {
    list = services;
  } else if (typeof services === 'string' && services.trim()) {
    list = services.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  }
  if (!list || list.length === 0) return '—';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {list.map((srv) => {
        const label = getServiceName(srv);
        return (
          <span
            key={srv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 10px',
              borderRadius: radiusPill,
              fontSize: fontSizeMd,
              fontWeight: fontWeightMedium,
              background: '#eef3fb',
              border: '1px solid #c6d9f5',
              color: colors.sidebarBg,
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
};

export interface CospasSarsatStationDetailContentProps {
  id: string;
  initialData?: CoastalStationCospasSarsatResponse | null;
  orgUnits?: any[];
  symbols?: any[];
  onClose?: () => void;
  onEdit?: (record: CoastalStationCospasSarsatResponse) => void;
  operationPlanList?: any[];
  maintenancePlanList?: any[];
  incidentList?: any[];
}

export default function CospasSarsatStationDetailContent(props: CospasSarsatStationDetailContentProps) {
  const { id, initialData, orgUnits, symbols } = props;
  const [data, setData] = useState<CoastalStationCospasSarsatResponse | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // File preview & attachments
  const [attachmentList, setAttachmentList] = useState<any[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Kế hoạch vận hành, bảo trì, sự cố
  const effectiveOperationPlanList = props.operationPlanList ?? (data as any)?.operationPlanList ?? [];
  const effectiveMaintenancePlanList = props.maintenancePlanList ?? (data as any)?.maintenancePlanList ?? [];
  const effectiveIncidentList = props.incidentList ?? (data as any)?.incidentList ?? [];

  useEffect(() => {
    if (Array.isArray(data?.attachments) && data.attachments.length > 0) {
      setAttachmentList(data.attachments);
    } else if (Array.isArray(data?.files) && data.files.length > 0) {
      setAttachmentList(data.files);
    } else if (id) {
      cospasSarsatStationService.getAttachments(id).then((atts) => {
        if (Array.isArray(atts)) setAttachmentList(atts);
      }).catch(() => {});
    }
  }, [id, data]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    setLoading(true);
    cospasSarsatStationService.getById(id)
      .then((res) => {
        if (!cancelled && res) {
          setData(res);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err.message || 'Không thể tải thông tin chi tiết đài Cospas-Sarsat');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading && !data) {
    return (
      <div style={{ padding: 24 }}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: textTertiary }}>
        Không tìm thấy dữ liệu đài Cospas-Sarsat
      </div>
    );
  }

  const orgName = (() => {
    const uId = data.unitId || data.orgUnitId;
    if (!uId) return '';
    if (Array.isArray(orgUnits)) {
      const found = orgUnits.find((o) => String(o.id) === String(uId));
      if (found) return found.name || found.code || uId;
    }
    return data.orgUnitName || uId;
  })();

  const operatingOrg = getOperatingOrgName(data.operatingOrgId, (data as any).operatingOrgName);
  const provinceName = data.provinceId ? getProvinceNameById(data.provinceId) : (data.provinceName || '');
  const gisCoords = parseGisCoordinates(data);

  // TAB 1: Thông tin chung
  const renderGeneralInfoTab = () => (
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
      {/* Section 1: Thông tin cơ bản & Quản lý vận hành */}
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
              {data.stationCode || data.code ? (
                <span style={statusBadgeStyle(actionPrimary)}>{data.stationCode || data.code}</span>
              ) : (
                ''
              )}
            </span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">Tên đài</span>
            <span className="chk-detail-value">
              {data.stationName || data.name ? (
                <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
                  {data.stationName || data.name}
                </span>
              ) : (
                ''
              )}
            </span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">Đơn vị quản lý</span>
            <span className="chk-detail-value">
              {orgName ? <span style={{ fontWeight: fontWeightBold }}>{orgName}</span> : ''}
            </span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">Đơn vị khai thác</span>
            <span className="chk-detail-value">
              {operatingOrg ? <span style={{ fontWeight: fontWeightBold }}>{operatingOrg}</span> : ''}
            </span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">Địa điểm (Tỉnh/TP)</span>
            <span className="chk-detail-value">
              {provinceName || ''}
            </span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">Địa điểm chi tiết</span>
            <span className="chk-detail-value">{data.locationAddress || data.address || ''}</span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">Tình trạng</span>
            <span className="chk-detail-value">
              {renderConditionStatusBadge(data.conditionStatus)}
            </span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">Tần số liên lạc</span>
            <span className="chk-detail-value">{data.frequency || ''}</span>
          </div>

          <div className="chk-detail-row chk-detail-row--full">
            <span className="chk-detail-label sec-col1-label">Dịch vụ cung cấp</span>
            <span className="chk-detail-value">
              {renderServicesBadges(data.services || (data as any).servicesProvided)}
            </span>
          </div>

          <div className="chk-detail-row chk-detail-row--full">
            <span className="chk-detail-label sec-col1-label">Vùng phủ sóng</span>
            <span className="chk-detail-value">{data.coverageArea || ''}</span>
          </div>

          <div className="chk-detail-row chk-detail-row--full">
            <span className="chk-detail-label sec-col1-label">Ghi chú</span>
            <span className="chk-detail-value">{data.description || data.note || ''}</span>
          </div>
        </div>
      </div>

      {/* Section 2: Thông tin phê duyệt */}
      <div style={{ ...sectionBoxStyle, padding: approvalOpen ? '14px 18px 14px 18px' : '10px 18px' }}>
        <div
          onClick={() => setApprovalOpen(!approvalOpen)}
          style={{
            ...sectionHeaderStyle,
            marginBottom: approvalOpen ? 10 : 0,
            paddingBottom: approvalOpen ? 8 : 0,
            borderBottom: approvalOpen ? '1px solid #f1f5f9' : 'none',
            cursor: 'pointer',
            userSelect: 'none',
          }}
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
            <div className="chk-detail-row chk-detail-row--full">
              <span className="chk-detail-label sec-col1-label">Trạng thái phê duyệt</span>
              <span className="chk-detail-value">{renderApprovalBadge(data.approvalStatus)}</span>
            </div>

            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col1-label">Cán bộ cập nhật</span>
              <span className="chk-detail-value">
                {(() => {
                  const name = formatUserDisplayName(data.updatedBy, data.updatedByName, undefined, data.createdBy, data.createdByName);
                  if (name) return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                  if (data.updatedByName && !isUuidString(data.updatedByName)) return <span style={{ fontWeight: fontWeightBold }}>{data.updatedByName}</span>;
                  if (data.createdByName && !isUuidString(data.createdByName)) return <span style={{ fontWeight: fontWeightBold }}>{data.createdByName}</span>;
                  return '';
                })()}
              </span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col2-label">Ngày cập nhật</span>
              <span className="chk-detail-value">
                {fmtDateTime(data.updatedAt || (data as any).updatedDate || data.createdAt || (data as any).createdDate)}
              </span>
            </div>

            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col1-label">Cán bộ gửi phê duyệt</span>
              <span className="chk-detail-value">
                {(() => {
                  const name = formatUserDisplayName(data.submittedBy, data.submittedByName, undefined);
                  if (name) return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                  if (data.submittedByName && !isUuidString(data.submittedByName)) return <span style={{ fontWeight: fontWeightBold }}>{data.submittedByName}</span>;
                  return '';
                })()}
              </span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col2-label">Ngày gửi phê duyệt</span>
              <span className="chk-detail-value">{fmtDateTime(data.submittedAt || (data as any).submittedDate)}</span>
            </div>

            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
              <span className="chk-detail-value">
                {(() => {
                  const name = formatUserDisplayName(data.approverLevel1, data.approverLevel1Name, undefined);
                  if (name) return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                  if (data.approverLevel1Name && !isUuidString(data.approverLevel1Name)) return <span style={{ fontWeight: fontWeightBold }}>{data.approverLevel1Name}</span>;
                  return '';
                })()}
              </span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
              <span className="chk-detail-value">{fmtDateTime(data.approvedDateLevel1)}</span>
            </div>

            <div className="chk-detail-row chk-detail-row--full">
              <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cảng vụ/Chi cục</span>
              <span className="chk-detail-value">{data.level1ApprovalContent || (data as any).approvalContentLevel1 || ''}</span>
            </div>

            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cục</span>
              <span className="chk-detail-value">
                {(() => {
                  const name = formatUserDisplayName(data.approverLevel2, data.approverLevel2Name, undefined);
                  if (name) return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                  if (data.approverLevel2Name && !isUuidString(data.approverLevel2Name)) return <span style={{ fontWeight: fontWeightBold }}>{data.approverLevel2Name}</span>;
                  return '';
                })()}
              </span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cục</span>
              <span className="chk-detail-value">{fmtDateTime(data.approvedDateLevel2)}</span>
            </div>

            <div className="chk-detail-row chk-detail-row--full">
              <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cục</span>
              <span className="chk-detail-value">{data.level2ApprovalContent || (data as any).approvalContentLevel2 || ''}</span>
            </div>

            {data.rejectionReason && (
              <div className="chk-detail-row chk-detail-row--full">
                <span className="chk-detail-label sec-col1-label">Lý do từ chối</span>
                <span className="chk-detail-value" style={{ color: statusCritical, fontWeight: fontWeightBold }}>{data.rejectionReason}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // TAB 2: Thông tin vị trí (GIS)
  const renderGisTab = () => {
    const symId = data?.symbolId || '';
    const sym = Array.isArray(symbols) ? symbols.find((s) => s.id === symId || s.code === symId || (symId && String(s.id) === String(symId))) : null;
    const symName = sym?.name || sym?.code || (symId ? String(symId) : 'Đài Cospas-Sarsat');
    const symImg = sym?.image
      ? sym.image.startsWith('data:') || sym.image.startsWith('http') || sym.image.startsWith('/')
        ? sym.image
        : `data:image/png;base64,${sym.image}`
      : undefined;

    return (
      <div style={{ paddingTop: 6 }}>
        <div style={{ ...sectionBoxStyle, marginBottom: 12 }}>
          <div className="chk-detail-grid">
            {[
              {
                label: 'Loại đối tượng',
                value:
                  ({
                    POINT: 'Đối tượng điểm',
                    LINE: 'Đối tượng đường',
                    POLYGON: 'Đối tượng vùng',
                  } as Record<string, string>)[data?.geometryType || ''] ||
                  data?.geometryType ||
                  'Đối tượng điểm',
              },
              {
                label: 'Biểu tượng',
                value: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {symImg ? (
                      <img
                        src={symImg}
                        alt=""
                        style={{ width: 20, height: 20, objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block' }}
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : null}
                    {symName}
                  </span>
                ),
              },
              {
                label: 'Hệ quy chiếu',
                value:
                  data?.coordinateSystem === 1
                    ? 'WGS-84'
                    : data?.coordinateSystem === 2
                      ? 'VN-2000'
                      : (data?.coordinateSystem ? String(data?.coordinateSystem) : 'WGS-84'),
              },
              {
                label: 'Quy tắc hiển thị',
                value: data?.displayRule || 'Độ, phút, giây (DMS)',
              },
            ].map((row, i) => (
              <div key={i} className="chk-detail-row">
                <span className={`chk-detail-label ${i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{row.label}</span>
                <span className="chk-detail-value">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
            Tọa độ GPS ({gisCoords.length})
          </span>
          <Button
            icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
            onClick={() => setMapModalOpen(true)}
            style={{
              ...outlineButtonStyle,
              height: 32,
              fontSize: fontSizeSm,
              padding: '0 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Xem vị trí trên bản đồ
          </Button>
        </div>
        <DetailTable
          scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
          dataSource={gisCoords.map((p, idx) => ({ ...p, id: idx }))}
          rowKey="id"
          emptyText="Chưa có tọa độ GPS nào"
          columns={[
            { title: 'STT', width: 50, align: 'center' as const, render: (_: any, __: any, idx: number) => idx + 1 },
            { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, r: any) => { const dms = ddToDms(r.lat); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
            { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, r: any) => { const dms = ddToDms(r.lng); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
          ]}
        />
      </div>
    );
  };

  // ── Tab 3: File đính kèm (chuẩn VTS) ──
  const renderAttachmentsTab = () => {
    const files = attachmentList.length > 0
      ? attachmentList
      : (Array.isArray(data.files) ? data.files : (Array.isArray(data.attachments) ? data.attachments : []));
    return (
      <DetailTable
        dataSource={files}
        emptyText="Chưa có tài liệu đính kèm"
        scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
        rowKey={(f: any) => f.id || f.fileName}
        columns={[
          { title: 'STT', width: 50, align: 'center', render: (_: any, __: any, idx: number) => idx + 1 },
          {
            title: 'Tên tài liệu',
            dataIndex: 'fileName',
            render: (v: string, rec: any) => {
              const name = v || rec.fileName || rec.name || 'Tài liệu';
              const isImg = isImageFile(name);
              return (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    color: actionPrimary,
                    fontWeight: fontWeightMedium,
                  }}
                  title={isImg ? `${name} (Nhấp để xem chi tiết ảnh)` : `${name} (Nhấp để tải xuống)`}
                  onClick={() => {
                    if (isImg) {
                      if (rec.fileUrl || rec.url) {
                        setPreviewUrl(rec.fileUrl || rec.url);
                      } else if (rec.id && id) {
                        setPreviewUrl(`/api/v1/stations/cospas-sarsat/${id}/attachments/${rec.id}/download`);
                      }
                      setPreviewTitle(name);
                      setPreviewOpen(true);
                    } else {
                      if (rec.id && id) {
                        cospasSarsatStationService.downloadAttachment(id, rec.id, name);
                      } else if (rec.fileUrl || rec.url) {
                        window.open(rec.fileUrl || rec.url, '_blank');
                      } else {
                        toast.info('Chưa có link tải file');
                      }
                    }
                  }}
                >
                  {isImg ? (
                    <FileImageOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
                  ) : (
                    <FileOutlined style={{ color: textTertiary, flexShrink: 0 }} />
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </span>
                </div>
              );
            },
          },
          {
            title: 'Dung lượng',
            dataIndex: 'fileSize',
            width: 120,
            align: 'right',
            render: (sz: number) => (sz ? (sz > 1024 * 1024 ? `${(sz / (1024 * 1024)).toFixed(2)} MB` : `${(sz / 1024).toFixed(1)} KB`) : '—'),
          },
          {
            title: 'Người tải lên',
            dataIndex: 'uploadedByName',
            width: 180,
            render: (v: string) => v || 'Cán bộ quản lý',
          },
          {
            title: 'Ngày tải lên',
            dataIndex: 'uploadedDate',
            width: 135,
            align: 'center',
            render: (dt: string, rec: any) => fmtDateTime(dt || rec.uploadedAt) || '—',
          },
          {
            title: 'Thao tác',
            width: 90,
            align: 'center',
            render: (_: any, rec: any) => {
              const name = rec.fileName || rec.name || 'Tài liệu';
              const isImg = isImageFile(name);
              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {isImg ? (
                    <Tooltip title="Xem chi tiết ảnh">
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined style={{ color: actionPrimary, fontSize: 16 }} />}
                        onClick={() => {
                          if (rec.fileUrl || rec.url) {
                            setPreviewUrl(rec.fileUrl || rec.url);
                          } else if (rec.id && id) {
                            setPreviewUrl(`/api/v1/stations/cospas-sarsat/${id}/attachments/${rec.id}/download`);
                          }
                          setPreviewTitle(name);
                          setPreviewOpen(true);
                        }}
                        style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Tải xuống tệp">
                      <Button
                        type="text"
                        size="small"
                        icon={<DownloadOutlined style={{ color: actionPrimary, fontSize: 16 }} />}
                        onClick={() => {
                          if (rec.id && id) {
                            cospasSarsatStationService.downloadAttachment(id, rec.id, name);
                          } else if (rec.fileUrl || rec.url) {
                            window.open(rec.fileUrl || rec.url, '_blank');
                          } else {
                            toast.info('Chưa có link tải file');
                          }
                        }}
                        style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      />
                    </Tooltip>
                  )}
                </div>
              );
            },
          },
        ]}
      />
    );
  };

  // TAB 4: Vận hành & bảo trì (chuẩn VTS)
  const renderOperationTab = () => (
    <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
      {/* ── Section Vận hành ── */}
      <div style={{ ...sectionBoxStyle, padding: operationOpen ? '14px 18px 14px 18px' : '10px 18px' }}>
        <div
          onClick={() => setOperationOpen(!operationOpen)}
          style={{
            ...sectionHeaderStyle,
            marginBottom: operationOpen ? 12 : 0,
            paddingBottom: operationOpen ? 8 : 0,
            borderBottom: operationOpen ? '1px solid #f1f5f9' : 'none',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={sectionTitleStyle}>
            <SlidersOutlined style={{ color: actionPrimary }} />
            <span>Thông tin vận hành khai thác</span>
          </div>
          <span style={{ color: actionPrimary, fontSize: 12 }}>
            {operationOpen ? <DownOutlined /> : <RightOutlined />}
          </span>
        </div>
        {operationOpen && (
          <DetailTable
            dataSource={effectiveOperationPlanList}
            emptyText="Chưa có dữ liệu"
            rowKey={(r: any) => r.id || r.planCode || r.code || Math.random().toString()}
            scrollY={160}
            columns={[
              { title: 'STT', width: 50, align: 'center', render: (_: any, __: any, idx: number) => idx + 1 },
              { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
              { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
              { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.startTime || rec.start || null) },
              { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.endTime || rec.end || null) },
            ]}
          />
        )}
      </div>

      {/* ── Section Bảo trì ── */}
      <div style={{ ...sectionBoxStyle, padding: maintenanceOpen ? '14px 18px 14px 18px' : '10px 18px' }}>
        <div
          onClick={() => setMaintenanceOpen(!maintenanceOpen)}
          style={{
            ...sectionHeaderStyle,
            marginBottom: maintenanceOpen ? 12 : 0,
            paddingBottom: maintenanceOpen ? 8 : 0,
            borderBottom: maintenanceOpen ? '1px solid #f1f5f9' : 'none',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={sectionTitleStyle}>
            <SlidersOutlined style={{ color: actionPrimary }} />
            <span>Thông tin bảo trì</span>
          </div>
          <span style={{ color: actionPrimary, fontSize: 12 }}>
            {maintenanceOpen ? <DownOutlined /> : <RightOutlined />}
          </span>
        </div>
        {maintenanceOpen && (
          <DetailTable
            dataSource={effectiveMaintenancePlanList}
            emptyText="Chưa có dữ liệu"
            rowKey={(r: any) => r.id || r.planCode || r.code || Math.random().toString()}
            scrollY={160}
            columns={[
              { title: 'STT', width: 50, align: 'center', render: (_: any, __: any, idx: number) => idx + 1 },
              { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
              { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
              { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.start || rec.startDate || null) },
              { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.end || rec.endDate || null) },
            ]}
          />
        )}
      </div>

      {/* ── Section Sự cố ── */}
      <div style={{ ...sectionBoxStyle, padding: incidentOpen ? '14px 18px 14px 18px' : '10px 18px' }}>
        <div
          onClick={() => setIncidentOpen(!incidentOpen)}
          style={{
            ...sectionHeaderStyle,
            marginBottom: incidentOpen ? 12 : 0,
            paddingBottom: incidentOpen ? 8 : 0,
            borderBottom: incidentOpen ? '1px solid #f1f5f9' : 'none',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={sectionTitleStyle}>
            <SlidersOutlined style={{ color: actionPrimary }} />
            <span>Thông tin sự cố</span>
          </div>
          <span style={{ color: actionPrimary, fontSize: 12 }}>
            {incidentOpen ? <DownOutlined /> : <RightOutlined />}
          </span>
        </div>
        {incidentOpen && (
          <DetailTable
            dataSource={effectiveIncidentList}
            emptyText="Chưa có dữ liệu"
            rowKey={(r: any) => r.id || r.incidentCode || r.code || Math.random().toString()}
            scrollY={160}
            columns={[
              { title: 'STT', width: 50, align: 'center', render: (_: any, __: any, idx: number) => idx + 1 },
              { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
              { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec.type || '' },
              { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || '' },
              { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.time || null) },
            ]}
          />
        )}
      </div>
    </div>
  );

  const files = attachmentList.length > 0
    ? attachmentList
    : (Array.isArray(data.files) ? data.files : (Array.isArray(data.attachments) ? data.attachments : []));

  return (
    <div className="cospas-detail-content-wrapper">
      <style>{cospasDetailStyle}</style>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarStyle={{
          marginBottom: 0,
          paddingTop: 0,
          position: 'sticky',
          top: 0,
          zIndex: 1,
          background: surfaceCard,
        }}
        items={[
          { key: 'info', label: 'Thông tin chung', children: renderGeneralInfoTab() },
          { key: 'gis', label: `Thông tin vị trí (${gisCoords.length})`, children: renderGisTab() },
          { key: 'files', label: `File đính kèm (${files.length})`, children: renderAttachmentsTab() },
          { key: 'ops', label: 'Vận hành & bảo trì', children: renderOperationTab() },
        ]}
      />

      {/* Modal GIS bản đồ */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span>Xem vị trí trên bản đồ chuyên dụng</span>
          </div>
        }
        open={mapModalOpen}
        onCancel={() => setMapModalOpen(false)}
        destroyOnClose
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button key="close" type="primary" onClick={() => setMapModalOpen(false)} style={{ ...primaryButtonStyle, height: 36 }}>
            Đóng
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType={(data?.geometryType as any) || 'POINT'}
            disabled
            height={520}
            value={(() => {
              if (gisCoords.length > 0) {
                const rawWkt = (data as any)?.coordinates || '';
                let geom: 'POINT' | 'LINE' | 'POLYGON' = 'POINT';
                let wkt: string;
                if (typeof rawWkt === 'string' && rawWkt.startsWith('LINESTRING')) {
                  geom = 'LINE';
                  wkt = `LINESTRING(${gisCoords.map(p => `${p.lng} ${p.lat}`).join(', ')})`;
                } else if (typeof rawWkt === 'string' && rawWkt.startsWith('POLYGON')) {
                  geom = 'POLYGON';
                  wkt = `POLYGON((${gisCoords.map(p => `${p.lng} ${p.lat}`).join(', ')}))`;
                } else if (gisCoords.length > 1) {
                  wkt = `MULTIPOINT(${gisCoords.map(p => `(${p.lng} ${p.lat})`).join(',')})`;
                } else {
                  wkt = `POINT(${gisCoords[0].lng} ${gisCoords[0].lat})`;
                }
                return { geometryType: geom, coordinates: wkt };
              }
              return undefined;
            })()}
          />
        </div>
      </Modal>

      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={750}
      >
        <div style={{ textAlign: 'center', padding: 12 }}>
          <img src={previewUrl} alt={previewTitle} style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain' }} />
        </div>
      </Modal>
    </div>
  );
}
