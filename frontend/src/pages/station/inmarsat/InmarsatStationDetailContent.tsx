import React, { useState, useEffect } from 'react';
import { Tabs, Button, Tooltip, Modal, Spin } from 'antd';
import {
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
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
import api from '../../../services/api';
import { inmarsatStationService } from '../../../services/inmarsatStationService';
import type { CoastalStationInmarsatResponse } from '../../../services/station/types';
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
  surfaceCard,
  DRAWER_TABLE_SCROLL_Y,
  getConditionStatusColor,
  getConditionStatusLabel,
} from '../../../themetokenchk';
import { getProvinceNameById } from '../../../types/common';
import DetailTable from '../../../components/shared/DetailTable';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import { parseWktToCoordinates } from '../../../utils/gisGeometry';

const fontSizeMd = 13.5;

const isImageFile = (name?: string): boolean => {
  if (!name) return false;
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
};

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

const renderServicesBadges = (services?: string[] | string) => {
  if (!services) return '';
  let list: string[] = [];
  if (Array.isArray(services)) {
    list = services;
  } else if (typeof services === 'string') {
    try {
      const parsed = JSON.parse(services);
      if (Array.isArray(parsed)) list = parsed;
      else list = [String(parsed)];
    } catch {
      list = services.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  if (list.length === 0) return '';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px', alignItems: 'center' }}>
      {list.map((srv) => (
        <span
          key={srv}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 10px',
            borderRadius: radiusPill,
            background: '#eef3fb',
            border: '1px solid #c6d9f5',
            color: '#12468C',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {srv}
        </span>
      ))}
    </div>
  );
};

export const getOperatingOrgName = (idOrCode?: string | null, name?: string | null): string => {
  const isUuid = (val?: string | null) =>
    !!val && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

  if (name && name !== '—' && !isUuid(name)) {
    return name;
  }
  const key = isUuid(name) ? name : idOrCode;
  if (!key) return '';

  const found = DEFAULT_OPERATING_ORGANIZATIONS.find(
    (o) => o.id === key || String(o.id) === String(key) || o.code === key
  );
  if (found) return found.name;
  return name && !isUuid(name) ? name : '';
};

export interface InmarsatStationDetailContentProps {
  selectedRecord: CoastalStationInmarsatResponse;
  symbols?: any[];
  attachments?: any[];
  onClose?: () => void;
}

export default function InmarsatStationDetailContent({
  selectedRecord,
  symbols = [],
  attachments = [],
}: InmarsatStationDetailContentProps) {
  const [record, setRecord] = useState<CoastalStationInmarsatResponse>(selectedRecord);
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

  const [attachmentList, setAttachmentList] = useState<any[]>(attachments);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
    if (!selectedRecord?.id) return;

    let active = true;
    setIsLoadingFiles(true);
    inmarsatStationService.getAttachments(selectedRecord.id)
      .then((atts) => {
        if (!active) return;
        setAttachmentList(Array.isArray(atts) ? atts : []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingFiles(false);
      });

    return () => {
      active = false;
    };
  }, [selectedRecord?.id, attachments]);

  const handlePreviewImage = async (file: any) => {
    try {
      setPreviewLoading(true);
      if (file.fileUrl || file.url) {
        setPreviewImageUrl(file.fileUrl || file.url);
      } else {
        const path = file.filePath || (selectedRecord?.id && file.id ? `/v1/stations/inmarsat/${selectedRecord.id}/attachments/${file.id}/download` : undefined);
        if (path) {
          let cleanPath = path;
          if (cleanPath.startsWith('/api/')) cleanPath = cleanPath.replace(/^\/api/, '');
          else if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;
          const res = await api.get(cleanPath, { responseType: 'blob' });
          const contentType = String(res.headers?.['content-type'] || 'image/jpeg');
          const blob = new Blob([res.data], { type: contentType });
          const url = window.URL.createObjectURL(blob);
          setPreviewImageUrl(url);
        }
      }
    } catch {
      toast.error('Không thể tải hình ảnh để xem chi tiết');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (attId?: string, fileName?: string) => {
    if (!attId) {
      toast.warning('Không tìm thấy mã tệp đính kèm');
      return;
    }
    try {
      const targetAtt = attachmentList.find((a) => a.id === attId || a.fileName === fileName);
      const rawFile = targetAtt?.originFileObj || targetAtt?.file;
      if (rawFile) {
        const url = URL.createObjectURL(rawFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || rawFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
      if (selectedRecord?.id) {
        await inmarsatStationService.downloadAttachment(selectedRecord.id, attId, fileName);
      }
    } catch {
      toast.error('Lỗi khi tải xuống tệp đính kèm');
    }
  };

  const effectiveRecord = record || selectedRecord;
  if (!effectiveRecord) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  const coordinates = parseGisCoordinates(effectiveRecord);

  const operationPlans = (record as any)?.operationPlans || [];
  const maintenancePlans = (record as any)?.maintenancePlans || [];
  const incidents = (record as any)?.incidentList || [];

  return (
    <div className="inmarsat-detail-content-wrapper">
      <style>{`
        .inmarsat-detail-content-wrapper {
          overflow: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .inmarsat-detail-content-wrapper,
        .inmarsat-detail-content-wrapper .chk-detail-label,
        .inmarsat-detail-content-wrapper .chk-detail-value,
        .inmarsat-detail-content-wrapper .ant-table,
        .inmarsat-detail-content-wrapper .ant-table-cell,
        .inmarsat-detail-content-wrapper .ant-table-thead > tr > th,
        .inmarsat-detail-content-wrapper .ant-tabs-tab,
        .inmarsat-detail-content-wrapper .ant-btn,
        .inmarsat-detail-content-wrapper .ant-select,
        .inmarsat-detail-content-wrapper .ant-select-selection-item,
        .inmarsat-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .inmarsat-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .inmarsat-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .inmarsat-detail-content-wrapper .chk-detail-row:last-child {
          border-bottom: none !important;
        }

        .inmarsat-detail-content-wrapper .ant-table-placeholder > td,
        .inmarsat-detail-content-wrapper .ant-table-placeholder .ant-table-cell,
        .inmarsat-detail-content-wrapper .ant-table-tbody > tr.ant-table-placeholder > td {
          border-bottom: none !important;
        }

        .inmarsat-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .berth-drawer-scope .chk-detail-label,
        .inmarsat-drawer-scope .inmarsat-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .inmarsat-detail-content-wrapper .chk-detail-label {
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

        .berth-drawer-scope .sec-col1-label,
        .inmarsat-drawer-scope .inmarsat-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .inmarsat-detail-content-wrapper .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .berth-drawer-scope .sec-col2-label,
        .inmarsat-drawer-scope .inmarsat-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .inmarsat-detail-content-wrapper .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }

        .berth-drawer-scope .sec-full-label,
        .inmarsat-drawer-scope .inmarsat-detail-content-wrapper .chk-detail-row .sec-full-label,
        .inmarsat-detail-content-wrapper .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .inmarsat-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .inmarsat-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .inmarsat-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .inmarsat-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .inmarsat-drawer-scope .inmarsat-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .inmarsat-detail-content-wrapper .chk-detail-label,
          .inmarsat-detail-content-wrapper .sec-col1-label,
          .inmarsat-detail-content-wrapper .sec-col2-label,
          .inmarsat-detail-content-wrapper .sec-full-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }

        @media (max-width: 640px) {
          .inmarsat-detail-content-wrapper .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .inmarsat-drawer-scope .inmarsat-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .inmarsat-detail-content-wrapper .chk-detail-label,
          .inmarsat-detail-content-wrapper .sec-col1-label,
          .inmarsat-detail-content-wrapper .sec-col2-label,
          .inmarsat-detail-content-wrapper .sec-full-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .inmarsat-detail-content-wrapper .chk-detail-value {
            width: 100% !important;
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
          // ── Tab 1: Thông tin chung ──
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
                      <BankOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin cơ bản & Quản lý vận hành</span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Mã đài</span>
                      <span className="chk-detail-value">
                        {record.code ? <span style={statusBadgeStyle(actionPrimary)}>{record.code}</span> : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tên đài</span>
                      <span className="chk-detail-value">
                        {record.name ? <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{record.name}</span> : ''}
                      </span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Đơn vị quản lý</span>
                      <span className="chk-detail-value">
                        {record.orgUnitName ? <span style={{ fontWeight: fontWeightBold }}>{record.orgUnitName}</span> : ''}
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
                        {record.provinceName || (record.provinceId ? getProvinceNameById(record.provinceId) : '')}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tình trạng</span>
                      <span className="chk-detail-value">
                        {renderConditionStatusBadge(record.conditionStatus)}
                      </span>
                    </div>

                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Địa điểm chi tiết</span>
                      <span className="chk-detail-value">{record.locationDetail || record.locationAddress || ''}</span>
                    </div>

                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Dịch vụ cung cấp</span>
                      <span className="chk-detail-value">{renderServicesBadges(record.services)}</span>
                    </div>

                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Vùng phủ sóng</span>
                      <span className="chk-detail-value">{record.coverageZone || record.coverageArea || ''}</span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Tần số</span>
                      <span className="chk-detail-value">{record.frequency || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Ghi chú</span>
                      <span className="chk-detail-value">{record.notes || record.description || (record as any).note || ''}</span>
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
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Trạng thái phê duyệt</span>
                        <span className="chk-detail-value">
                          <ApprovalStatusBadge status={record.approvalStatus} />
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ cập nhật</span>
                        <span className="chk-detail-value">
                          {record.updatedByName || (record as any).createdByName ? (
                            <span style={{ fontWeight: fontWeightBold }}>{record.updatedByName || (record as any).createdByName}</span>
                          ) : ''}
                        </span>
                      </div>

                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Cán bộ gửi phê duyệt</span>
                        <span className="chk-detail-value">
                          {record.submittedByName || record.submittedBy ? (
                            <span style={{ fontWeight: fontWeightBold }}>{record.submittedByName || record.submittedBy}</span>
                          ) : ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Ngày gửi phê duyệt</span>
                        <span className="chk-detail-value">{fmtDateTime(record.submittedDate || record.submittedAt)}</span>
                      </div>

                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">
                          {record.approverLevel1Name || record.approverNameLevel1 || record.approverLevel1 ? (
                            <span style={{ fontWeight: fontWeightBold }}>{record.approverLevel1Name || record.approverNameLevel1 || record.approverLevel1}</span>
                          ) : ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">{fmtDateTime(record.approvedDateLevel1)}</span>
                      </div>

                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">{record.approvalContentLevel1 || (record as any).level1ApprovalContent || (record as any).approvalReasonLevel1 || ''}</span>
                      </div>

                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cục</span>
                        <span className="chk-detail-value">
                          {record.approverLevel2Name || record.approverNameLevel2 || record.approverLevel2 ? (
                            <span style={{ fontWeight: fontWeightBold }}>{record.approverLevel2Name || record.approverNameLevel2 || record.approverLevel2}</span>
                          ) : ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cục</span>
                        <span className="chk-detail-value">{fmtDateTime(record.approvedDateLevel2)}</span>
                      </div>

                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cục</span>
                        <span className="chk-detail-value">{record.approvalContentLevel2 || (record as any).level2ApprovalContent || (record as any).approvalReasonLevel2 || ''}</span>
                      </div>

                      {record.rejectionReason && (
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label sec-col1-label">Lý do từ chối</span>
                          <span className="chk-detail-value" style={{ color: statusCritical, fontWeight: fontWeightMedium }}>
                            {record.rejectionReason}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ),
          },

          // ── Tab 2: Thông tin vị trí (GIS) ──
          {
            key: 'gis',
            label: `Thông tin vị trí (${coordinates.length})`,
            children: (
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
                          } as Record<string, string>)[record?.geometryType || ''] ||
                          record?.geometryType ||
                          'Đối tượng điểm',
                      },
                      {
                        label: 'Biểu tượng',
                        value: (() => {
                          const symId = record?.symbolId || record?.symbol || '';
                          const sym = symbols.find(
                            (s) => s.id === symId || s.code === symId || (symId && String(s.id) === String(symId))
                          );
                          const symName = sym?.name || sym?.code || (symId ? String(symId) : 'Đài vệ tinh Inmarsat');
                          const symImg = sym?.image
                            ? sym.image.startsWith('data:') || sym.image.startsWith('http') || sym.image.startsWith('/')
                              ? sym.image
                              : `data:image/png;base64,${sym.image}`
                            : undefined;
                          return (
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
                          );
                        })(),
                      },
                      {
                        label: 'Hệ quy chiếu',
                        value:
                          (record as any)?.coordinateSystem === 1
                            ? 'WGS-84'
                            : (record as any)?.coordinateSystem === 2
                              ? 'VN-2000'
                              : (record?.coordinateSystem ? String(record?.coordinateSystem) : 'WGS-84'),
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

                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                  <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                    Tọa độ GPS ({coordinates.length})
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
                  dataSource={coordinates.map((p, idx) => ({ ...p, id: idx }))}
                  rowKey="id"
                  emptyText="Chưa có tọa độ GPS nào"
                  columns={[
                    { title: 'STT', width: 50, align: 'center' as const },
                    { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, r: any) => { const dms = ddToDms(r.lat); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                    { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, r: any) => { const dms = ddToDms(r.lng); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                  ]}
                />
              </div>
            ),
          },

          // ── Tab 3: File đính kèm ──
          {
            key: 'files',
            label: `File đính kèm (${attachmentList.length})`,
            children: (
              <DetailTable
                dataSource={attachmentList}
                emptyText={isLoadingFiles ? 'Đang tải tài liệu đính kèm...' : 'Chưa có tài liệu đính kèm'}
                scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
                rowKey={(f: any) => f.id || f.fileName}
                columns={[
                  { title: 'STT', width: 50, align: 'center', render: (_: any, __: any, idx: number) => idx + 1 },
                  {
                    title: 'Tên tài liệu',
                    dataIndex: 'fileName',
                    key: 'fileName',
                    render: (v: string, rec: any) => {
                      const isImg = isImageFile(v);
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
                          title={isImg ? `${v} (Nhấp để xem chi tiết ảnh)` : `${v} (Nhấp để tải xuống)`}
                          onClick={() => {
                            if (isImg) handlePreviewImage(rec);
                            else handleDownload(rec.id, v);
                          }}
                        >
                          {isImg ? (
                            <FileImageOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
                          ) : (
                            <FileOutlined style={{ color: textTertiary, flexShrink: 0 }} />
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v || ''}
                          </span>
                        </span>
                      );
                    },
                  },
                  {
                    title: 'Dung lượng',
                    dataIndex: 'fileSize',
                    key: 'fileSize',
                    width: 120,
                    align: 'right',
                    render: (v: number) => (v ? (v > 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(2)} MB` : `${(v / 1024).toFixed(1)} KB`) : ''),
                  },
                  {
                    title: 'Người tải lên',
                    dataIndex: 'uploadedByName',
                    key: 'uploadedByName',
                    width: 180,
                    render: (v: string, item: any) => v || item.uploadedBy || '',
                  },
                  {
                    title: 'Ngày tải lên',
                    dataIndex: 'uploadedDate',
                    key: 'uploadedDate',
                    width: 135,
                    align: 'center',
                    render: (v: string, item: any) => (v || item.uploadedAt || item.createdDate ? dayjs(v || item.uploadedAt || item.createdDate).format('DD/MM/YYYY HH:mm') : ''),
                  },
                  {
                    title: 'Thao tác',
                    key: 'actions',
                    width: 90,
                    align: 'center',
                    render: (_: any, rec: any) => {
                      const isImg = isImageFile(rec.fileName);
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
                              onClick={() => handleDownload(rec.id, rec.fileName)}
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

          // ── Tab 4: Vận hành & bảo trì ──
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
                        { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', width: 180, render: (v: string, r: any) => v || r.code || '—' },
                        {
                          title: 'Tên kế hoạch',
                          dataIndex: 'planName',
                          key: 'name',
                          render: (v: string, r: any) => (
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v || r.name}>
                              {v || r.name || '—'}
                            </span>
                          ),
                        },
                        {
                          title: 'Ngày bắt đầu',
                          dataIndex: 'startDate',
                          key: 'start',
                          width: 150,
                          align: 'center' as const,
                          render: (v: any, r: any) => (v ? dayjs(v).format('DD/MM/YYYY') : (r.startTime ? dayjs(r.startTime).format('DD/MM/YYYY') : '—')),
                        },
                        {
                          title: 'Ngày kết thúc',
                          dataIndex: 'endDate',
                          key: 'end',
                          width: 150,
                          align: 'center' as const,
                          render: (v: any, r: any) => (v ? dayjs(v).format('DD/MM/YYYY') : (r.endTime ? dayjs(r.endTime).format('DD/MM/YYYY') : '—')),
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
                        { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', width: 180, render: (v: string, r: any) => v || r.code || '—' },
                        {
                          title: 'Tên kế hoạch',
                          dataIndex: 'planName',
                          key: 'name',
                          render: (v: string, r: any) => (
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v || r.name}>
                              {v || r.name || '—'}
                            </span>
                          ),
                        },
                        {
                          title: 'Thời gian bắt đầu',
                          dataIndex: 'startTime',
                          key: 'start',
                          width: 150,
                          align: 'center' as const,
                          render: (v: any, r: any) => (v ? dayjs(v).format('DD/MM/YYYY') : (r.startDate ? dayjs(r.startDate).format('DD/MM/YYYY') : '—')),
                        },
                        {
                          title: 'Thời gian kết thúc',
                          dataIndex: 'endTime',
                          key: 'end',
                          width: 150,
                          align: 'center' as const,
                          render: (v: any, r: any) => (v ? dayjs(v).format('DD/MM/YYYY') : (r.endDate ? dayjs(r.endDate).format('DD/MM/YYYY') : '—')),
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
                        { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', width: 160, render: (v: string, r: any) => v || r.code || '—' },
                        { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', width: 180, render: (v: string, r: any) => v || r.type || '—' },
                        {
                          title: 'Địa điểm',
                          dataIndex: 'location',
                          key: 'location',
                          render: (v: string, r: any) => (
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v || r.address}>
                              {v || r.address || '—'}
                            </span>
                          ),
                        },
                        {
                          title: 'Thời gian',
                          dataIndex: 'incidentTime',
                          key: 'time',
                          width: 180,
                          align: 'center' as const,
                          render: (v: any, r: any) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : (r.time ? dayjs(r.time).format('DD/MM/YYYY HH:mm:ss') : '—')),
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



      {/* Image Preview Modal */}
      {previewImageUrl && (
        <Modal
          open={!!previewImageUrl}
          footer={null}
          onCancel={() => setPreviewImageUrl(null)}
          width="min(800px, 90vw)"
          centered
        >
          <Spin spinning={previewLoading}>
            <img src={previewImageUrl} alt="Preview" style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          </Spin>
        </Modal>
      )}
    </div>
  );
}
