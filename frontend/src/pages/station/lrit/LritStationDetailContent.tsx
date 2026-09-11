import React, { useState, useEffect } from 'react';
import { Tabs, Button, Tooltip, Modal } from 'antd';
import {
  AuditOutlined,
  DownOutlined,
  RightOutlined,
  FileOutlined,
  DownloadOutlined,
  FileImageOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  SlidersOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../../components/ToastNotification';
import api from '../../../services/api';
import { lritStationService } from '../../../services/lritStationService';
import type { LritStationItem, OperationPlanItem, MaintenancePlanItem, IncidentItem } from '../../../types/lritStation';
import { LRIT_SERVICE_OPTIONS } from '../../../types/lritStation';
import { ConditionStatus } from '../../../types/vtsSystem';
import {
  colors,
  actionPrimary,
  fontWeightBold,
  fontWeightMedium,
  fontSizeSm,
  textTertiary,
  statusCritical,
  radiusPill,
  statusBadgeStyle,
  outlineButtonStyle,
  primaryButtonStyle,
  DRAWER_TABLE_SCROLL_Y,
  getConditionStatusColor,
  getConditionStatusLabel,
  surfaceCard,
} from '../../../themetokenchk';
import { getProvinceNameById } from '../../../types/common';
import DetailTable from '../../../components/shared/DetailTable';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import GisLocationSelector from '../../../components/gis/GisLocationSelector';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import { parseWktToCoordinates } from '../../../utils/gisGeometry';

const fontSizeMd = 13.5;

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

const LritStationDetailStyles = React.memo(() => (
  <style>{`
    .lrit-detail-content-root {
      overflow: hidden !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    .lrit-drawer-scope .chk-detail-card,
    .lrit-detail-content-root .chk-detail-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 18px 8px 18px;
      margin-bottom: 14px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    .lrit-drawer-scope .chk-detail-card-header,
    .lrit-detail-content-root .chk-detail-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .lrit-drawer-scope .chk-detail-card-title,
    .lrit-detail-content-root .chk-detail-card-title {
      font-size: 13.5px;
      font-weight: 700;
      color: ${colors.sidebarBg};
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .lrit-drawer-scope .chk-detail-grid,
    .lrit-detail-content-root .chk-detail-grid {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
      column-gap: 28px !important;
      row-gap: 0 !important;
    }
    .lrit-drawer-scope .chk-detail-row,
    .lrit-detail-content-root .chk-detail-row {
      display: flex !important;
      align-items: flex-start !important;
      min-height: 36px !important;
      padding: 7px 0 !important;
      border-bottom: 1px solid #f1f5f9 !important;
      line-height: 1.5 !important;
      gap: 10px !important;
    }
    .lrit-drawer-scope .chk-detail-row:last-child,
    .lrit-detail-content-root .chk-detail-row:last-child {
      border-bottom: none !important;
    }
    .lrit-drawer-scope .chk-detail-row--full,
    .lrit-detail-content-root .chk-detail-row--full {
      grid-column: 1 / -1 !important;
    }
    .lrit-drawer-scope .chk-detail-label,
    .lrit-detail-content-root .chk-detail-label {
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
    .lrit-drawer-scope .sec-col1-label,
    .lrit-detail-content-root .sec-col1-label {
      width: 215px !important;
      min-width: 215px !important;
      max-width: 215px !important;
      flex-shrink: 0 !important;
    }
    .lrit-drawer-scope .sec-col2-label,
    .lrit-detail-content-root .sec-col2-label {
      width: 250px !important;
      min-width: 250px !important;
      max-width: 250px !important;
      flex-shrink: 0 !important;
    }
    .lrit-drawer-scope .sec-full-label,
    .lrit-detail-content-root .sec-full-label {
      width: 215px !important;
      min-width: 215px !important;
      max-width: 215px !important;
      flex-shrink: 0 !important;
    }
    .lrit-drawer-scope .chk-detail-label::after,
    .lrit-detail-content-root .chk-detail-label::after {
      content: ':' !important;
      margin-left: 1px !important;
      margin-right: 4px !important;
    }
    .lrit-drawer-scope .chk-detail-value,
    .lrit-detail-content-root .chk-detail-value {
      color: #0F172A;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.5;
      flex: 1;
      word-break: break-word;
      display: flex;
      align-items: center;
    }
    .lrit-detail-content-root,
    .lrit-detail-content-root .chk-detail-label,
    .lrit-detail-content-root .chk-detail-value,
    .lrit-detail-content-root .ant-table,
    .lrit-detail-content-root .ant-table-cell,
    .lrit-detail-content-root .ant-table-thead > tr > th,
    .lrit-detail-content-root .ant-tabs-tab,
    .lrit-detail-content-root .ant-btn,
    .lrit-detail-content-root .ant-select,
    .lrit-detail-content-root .ant-select-selection-item,
    .lrit-detail-content-root .ant-select-item {
      font-size: 13.5px !important;
    }
  `}</style>
));

export interface LritStationDetailContentProps {
  selectedRecord: LritStationItem;
  symbols?: any[];
  attachments?: any[];
  onClose?: () => void;
}



const ddToDms = (dd: number | null | undefined): { d: number | null; m: number | null; s: number | null } => {
  if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
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
};


const parseWktToPoints = (record?: LritStationItem | null): { lat: number; lng: number }[] => {
  if (!record) return [];
  const out: { lat: number; lng: number }[] = [];
  const raw = record.coordinates;
  if (raw && typeof raw === 'string' && raw.trim()) {
    const parsed = parseWktToCoordinates(raw);
    if (parsed.length > 0) {
      parsed.forEach((p) => {
        if (!isNaN(p.latitude) && !isNaN(p.longitude)) {
          out.push({ lat: p.latitude, lng: p.longitude });
        }
      });
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
  const label = getConditionStatusLabel(status as any);
  const color = getConditionStatusColor(status as any);
  return (
    <span
      style={{
        ...statusBadgeStyle(color),
        borderRadius: radiusPill,
        padding: '2px 10px',
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
      }}
    >
      {label}
    </span>
  );
};

export const renderServicesBadges = (services?: string[] | string) => {
  let list: string[] = [];
  if (Array.isArray(services)) {
    list = services;
  } else if (typeof services === 'string' && services.trim()) {
    list = services.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  }
  if (!list || list.length === 0) return '—';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {list.map((srv) => {
        const found = LRIT_SERVICE_OPTIONS.find((o) => o.value === srv || o.label === srv);
        const label = found ? found.label : srv;
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

const isUuidString = (val?: string | null) => !!val && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(val);
const formatPersonDisplayName = (name?: string | null, fallbackName?: string | null) => {
  if (name && !isUuidString(name)) return name;
  if (fallbackName && !isUuidString(fallbackName)) return fallbackName;
  return '';
};

export const getOperatingOrgName = (idOrCode?: string | null, name?: string | null): string => {
  if (name && name.trim() && !isUuidString(name)) return name;
  if (!idOrCode) return '—';
  const found = DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === idOrCode || o.code === idOrCode);
  return found ? found.name : (isUuidString(idOrCode) ? '—' : idOrCode);
};

export const LritStationDetailContent: React.FC<LritStationDetailContentProps> = ({
  selectedRecord,
  symbols = [],
  attachments = [],
}) => {
  const [record, setRecord] = useState<LritStationItem>(selectedRecord);
  const [attachmentList, setAttachmentList] = useState<any[]>(attachments);
  const [activeTab, setActiveTab] = useState('general');
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

  useEffect(() => {
    if (selectedRecord) {
      setRecord(selectedRecord);
    }
  }, [selectedRecord]);

  useEffect(() => {
    if (attachments && attachments.length > 0) {
      setAttachmentList(attachments);
      return;
    }
    if (activeTab !== 'attachments' || !selectedRecord?.id) return;
    lritStationService.getAttachments(selectedRecord.id).then((res: any) => {
      const items = Array.isArray(res) ? res : (res?.data || []);
      setAttachmentList(items);
    }).catch(() => {});
  }, [selectedRecord?.id, attachments, activeTab]);

  const effectiveRecord = record || selectedRecord;
  const points = parseWktToPoints(effectiveRecord);
  const operationPlans: OperationPlanItem[] = (effectiveRecord as any)?.operationPlans || [];
  const maintenancePlans: MaintenancePlanItem[] = (effectiveRecord as any)?.maintenancePlans || [];
  const incidents: IncidentItem[] = (effectiveRecord as any)?.incidentList || (effectiveRecord as any)?.incidents || [];

  const symbolItem = symbols.find((s: any) =>
    s.id === (record as any).symbolId || s.code === (record as any).symbolId || s.id === record.symbol || s.code === record.symbol
  );

  const handleDownloadAttachment = async (att: any) => {
    try {
      const url = att.fileUrl || att.url || `/api/v1/stations/lrit/attachments/${att.id}/download`;
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = att.fileName || att.name || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch {
      toast.error('Không thể tải file');
    }
  };

  return (
    <div className="lrit-detail-content-root">
      <LritStationDetailStyles />

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
                {/* Section 1: Thông tin cơ bản & Quản lý vận hành */}
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <InfoCircleOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin cơ bản & Quản lý vận hành</span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Mã đài thông tin LRIT</span>
                      <span className="chk-detail-value" style={{ fontWeight: fontWeightBold, color: actionPrimary }}>
                        {record.code || '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tên đài thông tin LRIT</span>
                      <span className="chk-detail-value" style={{ fontWeight: fontWeightBold, color: '#0F172A' }}>
                        {record.name || '—'}
                      </span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Đơn vị quản lý</span>
                      <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>
                        {(record.orgUnitName && !isUuidString(record.orgUnitName) ? record.orgUnitName : undefined) || '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Đơn vị khai thác</span>
                      <span className="chk-detail-value">
                        {getOperatingOrgName(record.operatingOrgId, record.operatingOrgName)}
                      </span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Địa điểm (Tỉnh/TP)</span>
                      <span className="chk-detail-value">
                        {getProvinceNameById(record.provinceId) || record.provinceName || '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tình trạng hoạt động</span>
                      <span className="chk-detail-value">
                        {renderConditionStatusBadge(record.conditionStatus)}
                      </span>
                    </div>

                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Địa điểm chi tiết</span>
                      <span className="chk-detail-value">{record.locationAddress || '—'}</span>
                    </div>

                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Dịch vụ cung cấp</span>
                      <span className="chk-detail-value">{renderServicesBadges(record.services || record.servicesProvided)}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Phạm vi phủ sóng & Thông số kỹ thuật */}
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Phạm vi phủ sóng & Thông số kỹ thuật</span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Vùng phủ sóng</span>
                      <span className="chk-detail-value">{record.coverageArea || '—'}</span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Mã thiết bị đầu cuối</span>
                      <span className="chk-detail-value">{record.terminalId || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Số IMO</span>
                      <span className="chk-detail-value">{record.imoNumber || '—'}</span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Chu kỳ báo cáo</span>
                      <span className="chk-detail-value">{record.reportingInterval != null ? `${record.reportingInterval} phút` : '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Độ cao ăng-ten</span>
                      <span className="chk-detail-value">{record.antennaHeight != null ? `${record.antennaHeight} m` : '—'}</span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Công suất phát</span>
                      <span className="chk-detail-value">{record.powerOutput != null ? `${record.powerOutput} W` : '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Loại ăng-ten</span>
                      <span className="chk-detail-value">{record.antennaType || '—'}</span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Định dạng dữ liệu</span>
                      <span className="chk-detail-value">{record.dataFormat || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Kênh truyền thông</span>
                      <span className="chk-detail-value">{record.communicationChannel || '—'}</span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Người liên hệ</span>
                      <span className="chk-detail-value">{record.contactPerson ? `${record.contactPerson}${record.contactPhone ? ` (${record.contactPhone})` : ''}` : '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Số điện thoại</span>
                      <span className="chk-detail-value">{record.contactPhone || '—'}</span>
                    </div>

                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Ghi chú</span>
                      <span className="chk-detail-value">{record.description || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Thông tin phê duyệt */}
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
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Trạng thái phê duyệt</span>
                        <span className="chk-detail-value">
                          <ApprovalStatusBadge status={record.approvalStatus} />
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Người gửi duyệt</span>
                        <span className="chk-detail-value">
                          {formatPersonDisplayName(record.submittedByName, record.submittedBy) || '—'}
                        </span>
                      </div>

                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày gửi duyệt</span>
                        <span className="chk-detail-value">
                          {record.submittedAt ? dayjs(record.submittedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ duyệt C1</span>
                        <span className="chk-detail-value">
                          {formatPersonDisplayName(record.approverLevel1Name, record.approverLevel1) || '—'}
                        </span>
                      </div>

                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày duyệt C1</span>
                        <span className="chk-detail-value">
                          {record.approvedDateLevel1 ? dayjs(record.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—'}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ duyệt C2</span>
                        <span className="chk-detail-value">
                          {formatPersonDisplayName(record.approverLevel2Name, record.approverLevel2) || '—'}
                        </span>
                      </div>

                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày duyệt C2</span>
                        <span className="chk-detail-value">
                          {record.approvedDateLevel2 ? dayjs(record.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—'}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Lý do từ chối</span>
                        <span className="chk-detail-value" style={{ color: record.rejectionReason ? statusCritical : undefined }}>
                          {record.rejectionReason || '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'gis',
            label: `Thông tin vị trí (${points.length})`,
            children: (
              <div style={{ paddingTop: 6 }}>
                {/* ── Section 1: Thông số đối tượng bản đồ ── */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '12px 18px 8px 18px',
                  marginBottom: 12,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                }}>
                  <div className="chk-detail-grid">
                    {[
                      {
                        label: 'Loại đối tượng',
                        value:
                          ({
                            POINT: 'Đối tượng điểm',
                            LINE: 'Đối tượng đường',
                            POLYGON: 'Đối tượng vùng',
                          } as Record<string, string>)[(record as any).geometryType || ''] ||
                          (record as any).geometryType ||
                          'Đối tượng điểm',
                      },
                      {
                        label: 'Biểu tượng',
                        value: (() => {
                          const sym = symbolItem;
                          const symName = sym?.name || sym?.code || (record.symbolId ? String(record.symbolId) : 'Đài LRIT');
                          const symImg = sym?.iconUrl || sym?.image;
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              {symImg ? <img src={symImg} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : null}
                              {symName}
                            </span>
                          );
                        })(),
                      },
                      {
                        label: 'Hệ quy chiếu',
                        value: (record as any).coordinateSystem === 2 ? 'VN-2000' : 'WGS-84',
                      },
                      {
                        label: 'Quy tắc hiển thị',
                        value: 'Độ, phút, giây (DMS)',
                      },
                    ].map((row, i) => (
                      <div key={i} className="chk-detail-row">
                        <span className={`chk-detail-label ${i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{row.label}</span>
                        <span className="chk-detail-value">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Section 2: Tọa độ GPS ── */}
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                  <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                    Tọa độ GPS ({points.length})
                  </span>
                  <Button
                    icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                    onClick={() => setMapModalOpen(true)}
                    style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Xem vị trí trên bản đồ
                  </Button>
                </div>
                <DetailTable
                  scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                  dataSource={points.map((p, i) => ({ ...p, _idx: i }))}
                  emptyText="Chưa có tọa độ GPS nào"
                  rowKey="_idx"
                  columns={[
                    { title: 'STT', width: 50, align: 'center' as const },
                    { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lat); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                    { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lng); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'attachments',
            label: `File đính kèm (${attachmentList.length})`,
            children: (
              <DetailTable
                scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
                dataSource={attachmentList.map((a, i) => ({ ...a, _idx: i }))}
                emptyText="Chưa có tài liệu đính kèm"
                rowKey={(r: any) => r.id || r._idx}
                columns={[
                  {
                    title: 'STT',
                    key: 'stt',
                    width: 50,
                    align: 'center' as const,
                    render: (_: any, __: any, index: number) => index + 1,
                  },
                  {
                    title: 'Tên tài liệu',
                    key: 'fileName',
                    render: (_: any, r: any) => {
                      const isImg = r.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(r.fileName || '');
                      return (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            color: actionPrimary,
                            fontWeight: fontWeightMedium,
                          }}
                          onClick={() => {
                            if (isImg) setPreviewImage(r.fileUrl || r.url || '');
                            else handleDownloadAttachment(r);
                          }}
                          title={isImg ? `${r.fileName || r.name} (Nhấp để xem chi tiết ảnh)` : `${r.fileName || r.name} (Nhấp để tải xuống)`}
                        >
                          {isImg ? (
                            <FileImageOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
                          ) : (
                            <FileOutlined style={{ color: textTertiary, flexShrink: 0 }} />
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.fileName || r.name || 'Tài liệu đính kèm'}
                          </span>
                        </span>
                      );
                    },
                  },
                  {
                    title: 'Dung lượng',
                    key: 'fileSize',
                    width: 120,
                    align: 'right' as const,
                    render: (_: any, r: any) => {
                      const bytes = r.fileSize || r.size;
                      if (!bytes) return '';
                      return bytes > 1048576
                        ? `${(bytes / 1048576).toFixed(2)} MB`
                        : `${(bytes / 1024).toFixed(1)} KB`;
                    },
                  },
                  {
                    title: 'Người tải lên',
                    key: 'uploadedBy',
                    width: 180,
                    render: (_: any, r: any) => r.uploadedByName || r.uploadedBy || '',
                  },
                  {
                    title: 'Ngày tải lên',
                    key: 'uploadedAt',
                    width: 135,
                    align: 'center' as const,
                    render: (_: any, r: any) => {
                      const date = r.uploadedAt || r.uploadedDate || r.createdAt;
                      return date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '';
                    },
                  },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    width: 90,
                    align: 'center' as const,
                    render: (_: any, r: any) => {
                      const isImg = r.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(r.fileName || '');
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {isImg ? (
                            <Tooltip title="Xem chi tiết ảnh">
                              <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined style={{ color: actionPrimary, fontSize: 16 }} />}
                                onClick={() => setPreviewImage(r.fileUrl || r.url || '')}
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
                              onClick={() => handleDownloadAttachment(r)}
                              style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            />
                          </Tooltip>
                        </div>
                      );
                    },
                  },
                ]}
              />
            ),
          },
          {
            key: 'operationMaintenance',
            label: 'Vận hành & bảo trì',
            children: (
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
                      dataSource={operationPlans}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(r: any) => r.id || r.planCode || r.code || Math.random().toString()}
                      scrollY={160}
                      columns={[
                        { title: 'STT', width: 50, align: 'center' as const, render: (_: any, __: any, idx: number) => idx + 1 },
                        { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', width: 180, render: (v: string, rec: any) => v || rec.code || '—' },
                        {
                          title: 'Tên kế hoạch',
                          dataIndex: 'planName',
                          key: 'name',
                          render: (v: string, rec: any) => (
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v || rec.name}>
                              {v || rec.name || '—'}
                            </span>
                          ),
                        },
                        {
                          title: 'Ngày bắt đầu',
                          dataIndex: 'startDate',
                          key: 'start',
                          width: 150,
                          align: 'center' as const,
                          render: (v: any, rec: any) => (v ? dayjs(v).format('DD/MM/YYYY') : (rec.startTime ? dayjs(rec.startTime).format('DD/MM/YYYY') : '—')),
                        },
                        {
                          title: 'Ngày kết thúc',
                          dataIndex: 'endDate',
                          key: 'end',
                          width: 150,
                          align: 'center' as const,
                          render: (v: any, rec: any) => (v ? dayjs(v).format('DD/MM/YYYY') : (rec.endTime ? dayjs(rec.endTime).format('DD/MM/YYYY') : '—')),
                        },
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
                      dataSource={maintenancePlans}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(r: any) => r.id || r.planCode || r.code || Math.random().toString()}
                      scrollY={160}
                      columns={[
                        { title: 'STT', width: 50, align: 'center' as const, render: (_: any, __: any, idx: number) => idx + 1 },
                        { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', width: 180, render: (v: string, rec: any) => v || rec.code || '—' },
                        {
                          title: 'Tên kế hoạch',
                          dataIndex: 'planName',
                          key: 'name',
                          render: (v: string, rec: any) => (
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v || rec.name}>
                              {v || rec.name || '—'}
                            </span>
                          ),
                        },
                        {
                          title: 'Thời gian bắt đầu',
                          dataIndex: 'startTime',
                          key: 'start',
                          width: 150,
                          align: 'center' as const,
                          render: (v: any, rec: any) => (v ? dayjs(v).format('DD/MM/YYYY') : (rec.startDate ? dayjs(rec.startDate).format('DD/MM/YYYY') : '—')),
                        },
                        {
                          title: 'Thời gian kết thúc',
                          dataIndex: 'endTime',
                          key: 'end',
                          width: 150,
                          align: 'center' as const,
                          render: (v: any, rec: any) => (v ? dayjs(v).format('DD/MM/YYYY') : (rec.endDate ? dayjs(rec.endDate).format('DD/MM/YYYY') : '—')),
                        },
                      ]}
                    />
                  )}
                </div>

                {/* ── Section Sự cố ── */}
                <div style={{ ...sectionBoxStyle, padding: incidentOpen ? '14px 18px 14px 18px' : '10px 18px', marginBottom: 16 }}>
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
                      dataSource={incidents}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(r: any) => r.id || r.incidentCode || r.code || Math.random().toString()}
                      scrollY={160}
                      columns={[
                        { title: 'STT', width: 50, align: 'center' as const, render: (_: any, __: any, idx: number) => idx + 1 },
                        { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', width: 160, render: (v: string, rec: any) => v || rec.code || '—' },
                        { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', width: 180, render: (v: string, rec: any) => v || rec.type || '—' },
                        { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || '—' },
                        {
                          title: 'Thời gian',
                          dataIndex: 'incidentTime',
                          key: 'time',
                          width: 160,
                          align: 'center' as const,
                          render: (v: any, rec: any) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : (rec.time ? dayjs(rec.time).format('DD/MM/YYYY HH:mm:ss') : '—')),
                        },
                      ]}
                    />
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />



      {/* GIS Location Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
              Xem vị trí trên bản đồ chuyên dụng
            </span>
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
            defaultGeometryType={(record?.geometryType as any) || 'POINT'}
            disabled
            height={520}
            value={{
              geometryType: (record?.geometryType || (record as any)?.objectType || 'POINT') as any,
              coordinates: record?.coordinates || '',
              symbolId: record?.symbolId || (record as any)?.symbol,
            }}
          />
        </div>
      </Modal>

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          open={!!previewImage}
          footer={null}
          onCancel={() => setPreviewImage(null)}
          width="min(800px, 90vw)"
          centered
        >
          <img src={previewImage} alt="Preview" style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
        </Modal>
      )}
    </div>
  );
};

export default LritStationDetailContent;
