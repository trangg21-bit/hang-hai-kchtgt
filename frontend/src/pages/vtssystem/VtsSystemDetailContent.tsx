import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Button, Select, Tooltip, Modal } from 'antd';
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
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import api from '../../services/api';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { radarStationService } from '../../services/radarStationService';
import VtsOperationCenterForm from '../vtsoperationcenter/VtsOperationCenterForm';
import RadarStationForm from '../radarstation/RadarStationForm';
import type { VtsSystemResponse } from '../../types/vtsSystem';
import { ApprovalStatus, ConditionStatus } from '../../types/vtsSystem';
import {
  colors,
  actionPrimary,
  fontWeightBold,
  fontWeightMedium,
  statusOperational,
  statusAttention,
  statusCritical,
  radiusPill,
  statusBadgeStyle,
  DRAWER_TABLE_SCROLL_Y,
  getConditionStatusColor,
  getConditionStatusLabel,
  fontSizeSm,
  fontSizeLg,
  textSecondary,
  textTertiary,
  surfaceCard,
} from '../../themetokenchk';
import { getProvinceNameById } from '../../types/common';
import DetailTable from '../../components/shared/DetailTable';

const fontSizeMd = 13.5;
const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

const isImageFile = (name?: string): boolean => {
  if (!name) return false;
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
};

const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px 14px 18px',
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
const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '');

const renderConditionStatusBadge = (status?: ConditionStatus | string | number) => {
  if (status == null || status === '') return null;
  const label = getConditionStatusLabel(status);
  const color = getConditionStatusColor(status);
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
    ARCHIVED: { label: 'Đã xóa', color: textTertiary },
  };
  const item = map[String(status).toUpperCase()] || { label: String(status), color: textSecondary };
  return (
    <span style={statusBadgeStyle(item.color)}>
      {item.label}
    </span>
  );
};

export interface VtsSystemDetailContentProps {
  selectedRecord: VtsSystemResponse;
  onClose?: () => void;
  onViewOtherInfraDetail?: (item: any) => void;
  operationPlanList?: any[];
  maintenancePlanList?: any[];
  incidentList?: any[];
}

export default function VtsSystemDetailContent({
  selectedRecord,
  onViewOtherInfraDetail,
  operationPlanList,
  maintenancePlanList,
  incidentList,
}: VtsSystemDetailContentProps) {
  const [record, setRecord] = useState<VtsSystemResponse>(selectedRecord);

  // States toggle các section
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

  // Vùng VTS
  const [zoneList, setZoneList] = useState<any[]>(selectedRecord.zones || []);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [zonesLoaded, setZonesLoaded] = useState(Boolean(selectedRecord.zones && selectedRecord.zones.length > 0));

  // File đính kèm
  const [attachmentList, setAttachmentList] = useState<any[]>(selectedRecord.attachments || []);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [filesLoaded, setFilesLoaded] = useState(Boolean(selectedRecord.attachments && selectedRecord.attachments.length > 0));

  // KCHT khác thuộc VTS — chuẩn Bến cảng
  const [infraTypeFilter, setInfraTypeFilter] = useState<string>('');
  const [loadedInfra, setLoadedInfra] = useState<any[]>([]);
  const [isLoadingInfra, setIsLoadingInfra] = useState(false);
  const [selectedChildInfra, setSelectedChildInfra] = useState<{
    id: string;
    type: 'VTS_OPERATION_CENTER' | 'RADAR_STATION';
    name?: string;
  } | null>(null);

  // Kế hoạch vận hành, bảo trì, sự cố (nhận từ props hoặc fallback từ selectedRecord hoặc rỗng)
  const effectiveOperationPlanList = operationPlanList ?? (selectedRecord as any)?.operationPlanList ?? [];
  const effectiveMaintenancePlanList = maintenancePlanList ?? (selectedRecord as any)?.maintenancePlanList ?? [];
  const effectiveIncidentList = incidentList ?? (selectedRecord as any)?.incidentList ?? [];

  // Tải chi tiết đầy đủ khi mount
  useEffect(() => {
    if (!selectedRecord?.id) return;
    let mounted = true;
    setRecord(selectedRecord);
    if (Array.isArray(selectedRecord.zones) && selectedRecord.zones.length > 0) {
      setZoneList(selectedRecord.zones.map((z: any, idx: number) => ({
        ...z,
        code: z.code || `VTS-Z0${idx + 1}`,
        name: z.name || '',
        conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
      })));
      setZonesLoaded(true);
    }
    if (Array.isArray(selectedRecord.attachments) && selectedRecord.attachments.length > 0) {
      setAttachmentList(selectedRecord.attachments);
      setFilesLoaded(true);
    }

    vtsSystemCRUD.getById(selectedRecord.id, { includeZones: true, includeAttachments: true })
      .then((data) => {
        if (!mounted || !data) return;
        setRecord(data);
        if (Array.isArray(data.zones)) {
          setZoneList(data.zones.map((z: any, idx: number) => ({
            ...z,
            code: z.code || `VTS-Z0${idx + 1}`,
            name: z.name || '',
            conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
          })));
          setZonesLoaded(true);
        }
        if (Array.isArray(data.attachments)) {
          setAttachmentList(data.attachments);
          setFilesLoaded(true);
        }
      })
      .catch((err) => {
        console.warn('Failed to load full VTS detail in VtsSystemDetailContent', err);
      });
    return () => { mounted = false; };
  }, [selectedRecord?.id]);

  // Lazy load zones nếu chưa tải
  const handleTabChange = (key: string) => {
    if (key === 'zones' && !zonesLoaded && selectedRecord?.id) {
      setIsLoadingZones(true);
      vtsSystemCRUD.getZones(selectedRecord.id)
        .then((zones) => {
          setZoneList((zones || []).map((z: any, idx: number) => ({
            ...z,
            code: z.code || `VTS-Z0${idx + 1}`,
            name: z.name || '',
            conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
          })));
          setZonesLoaded(true);
        })
        .catch(() => {})
        .finally(() => setIsLoadingZones(false));
    }
    if (key === 'files' && !filesLoaded && selectedRecord?.id) {
      setIsLoadingFiles(true);
      vtsSystemCRUD.getAttachments(selectedRecord.id)
        .then((files) => {
          setAttachmentList(files || []);
          setFilesLoaded(true);
        })
        .catch(() => {})
        .finally(() => setIsLoadingFiles(false));
    }
  };

  // Tải danh sách KCHT khác thuộc hệ thống VTS (Trung tâm điều hành & Trạm Radar) — chuẩn Bến cảng
  useEffect(() => {
    if (!selectedRecord?.id) {
      setLoadedInfra([]);
      return;
    }
    let cancelled = false;
    setIsLoadingInfra(true);

    Promise.all([
      vtsOperationCenterService
        .search({
          vtsSystemId: selectedRecord.id,
          page: 1,
          size: 100,
        })
        .catch(() => ({ items: [] })),
      radarStationService
        .search({
          vtsSystemId: selectedRecord.id,
          page: 1,
          size: 100,
        })
        .catch(() => ({ items: [] })),
    ])
      .then(([opCenters, radarStations]: [any, any]) => {
        if (cancelled) return;
        const opList = (opCenters?.items || []).map((x: any) => ({
          id: x.id,
          infraName: x.name || x.code || '',
          infraType: 'VTS_OPERATION_CENTER',
          typeLabel: 'Trung tâm điều hành VTS',
          raw: x,
        }));
        const radarList = (radarStations?.items || []).map((x: any) => ({
          id: x.id,
          infraName: x.stationName || x.name || x.code || '',
          infraType: 'RADAR_STATION',
          typeLabel: 'Trạm Radar VTS',
          raw: x,
        }));
        setLoadedInfra([...opList, ...radarList]);
      })
      .catch(() => {
        if (!cancelled) setLoadedInfra([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingInfra(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRecord?.id]);

  const infraRows = useMemo(() => {
    if (!infraTypeFilter || infraTypeFilter === 'ALL') return loadedInfra;
    return loadedInfra.filter((it: any) => it.infraType === infraTypeFilter);
  }, [loadedInfra, infraTypeFilter]);

  const handleViewInfraDetail = (rec: any) => {
    if (onViewOtherInfraDetail) {
      onViewOtherInfraDetail(rec);
      return;
    }
    setSelectedChildInfra({
      id: rec.id,
      type: rec.infraType,
      name: rec.infraName || rec.name,
    });
  };

  // Xem chi tiết ảnh & tải tệp đính kèm
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<any>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreviewImage = async (file: any) => {
    setPreviewImageFile(file);
    setPreviewImageUrl('');
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    try {
      if (file.url) {
        setPreviewImageUrl(file.url);
      } else if (selectedRecord?.id && file.id) {
        const res = await api.get(`/v1/vts-systems/${selectedRecord.id}/attachments/${file.id}/download`, { responseType: 'blob' });
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

  // Tải tệp đính kèm
  const handleDownload = async (attId?: string, fileName?: string) => {
    if (!attId) {
      toast.warning('Không tìm thấy mã tệp đính kèm');
      return;
    }
    try {
      if (selectedRecord?.id) {
        await vtsSystemCRUD.downloadAttachment(selectedRecord.id, attId, fileName);
      }
    } catch {
      toast.error('Lỗi khi tải xuống tệp đính kèm');
    }
  };

  return (
    <div className="vts-detail-content-wrapper">
      <style>{`
        .vts-detail-content-wrapper {
          overflow: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .vts-detail-content-wrapper,
        .vts-detail-content-wrapper .chk-detail-label,
        .vts-detail-content-wrapper .chk-detail-value,
        .vts-detail-content-wrapper .ant-table,
        .vts-detail-content-wrapper .ant-table-cell,
        .vts-detail-content-wrapper .ant-table-thead > tr > th,
        .vts-detail-content-wrapper .ant-tabs-tab,
        .vts-detail-content-wrapper .ant-btn,
        .vts-detail-content-wrapper .ant-select,
        .vts-detail-content-wrapper .ant-select-selection-item,
        .vts-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .vts-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .vts-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .vts-detail-content-wrapper .chk-detail-row:last-child {
          border-bottom: none !important;
        }

        /* Loại bỏ hoàn toàn đường kẻ gạch ngang dưới ô bảng khi không có dữ liệu */
        .vts-detail-content-wrapper .ant-table-placeholder > td,
        .vts-detail-content-wrapper .ant-table-placeholder .ant-table-cell,
        .vts-detail-content-wrapper .ant-table-tbody > tr.ant-table-placeholder > td {
          border-bottom: none !important;
        }

        .vts-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .vts-drawer-scope .vts-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .vts-detail-content-wrapper .chk-detail-label {
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

        .vts-drawer-scope .vts-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .vts-detail-content-wrapper .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .vts-drawer-scope .vts-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .vts-detail-content-wrapper .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }

        .vts-drawer-scope .vts-detail-content-wrapper .chk-detail-row .sec-full-label,
        .vts-detail-content-wrapper .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .vts-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .vts-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .vts-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .vts-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .vts-drawer-scope .vts-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .vts-detail-content-wrapper .chk-detail-label,
          .vts-detail-content-wrapper .sec-col1-label,
          .vts-detail-content-wrapper .sec-col2-label,
          .vts-detail-content-wrapper .sec-full-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }

        @media (max-width: 640px) {
          .vts-detail-content-wrapper .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .vts-drawer-scope .vts-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .vts-detail-content-wrapper .chk-detail-label,
          .vts-detail-content-wrapper .sec-col1-label,
          .vts-detail-content-wrapper .sec-col2-label,
          .vts-detail-content-wrapper .sec-full-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .vts-detail-content-wrapper .chk-detail-value {
            width: 100% !important;
          }
        }
      `}</style>

      <Tabs
        defaultActiveKey="general"
        onChange={handleTabChange}
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
                      <span className="chk-detail-label sec-col1-label">Mã hệ thống VTS</span>
                      <span className="chk-detail-value">
                        {record.code ? <span style={statusBadgeStyle(actionPrimary)}>{record.code}</span> : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tên hệ thống VTS</span>
                      <span className="chk-detail-value">
                        {record.systemName ? <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{record.systemName}</span> : ''}
                      </span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Đơn vị quản lý</span>
                      <span className="chk-detail-value">
                        {record.orgUnitName ? <span style={{ fontWeight: fontWeightBold }}>{record.orgUnitName}</span> : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Đơn vị chủ quản</span>
                      <span className="chk-detail-value">
                        {record.owningOrgName || ''}
                      </span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Đơn vị vận hành</span>
                      <span className="chk-detail-value">{record.operatingOrgName || (record as any).operatingUnitName || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Thuộc cảng biển</span>
                      <span className="chk-detail-value">{record.portName || ''}</span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Địa điểm (Tỉnh/TP)</span>
                      <span className="chk-detail-value">
                        {record.province || (record.provinceId ? getProvinceNameById(record.provinceId) : '')}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tình trạng</span>
                      <span className="chk-detail-value">
                        {renderConditionStatusBadge(record.conditionStatus)}
                      </span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Thời gian bắt đầu hoạt động</span>
                      <span className="chk-detail-value">{fmtDate(record.operationStartDate)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Địa điểm chi tiết</span>
                      <span className="chk-detail-value">{record.address || ''}</span>
                    </div>

                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Phạm vi áp dụng</span>
                      <span className="chk-detail-value">{record.scope || ''}</span>
                    </div>

                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Thông báo hàng hải</span>
                      <span className="chk-detail-value">{record.maritimeNotice || ''}</span>
                    </div>

                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Ghi chú</span>
                      <span className="chk-detail-value">{record.note || ''}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Thông tin phê duyệt (Toggle chuẩn AGENTS.md & Bến cảng) */}
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
                        <span className="chk-detail-value">{renderApprovalBadge(record.approvalStatus)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ cập nhật</span>
                        <span className="chk-detail-value">
                          {record.updatedByName || record.createdByName ? (
                            <span style={{ fontWeight: fontWeightBold }}>{record.updatedByName || record.createdByName}</span>
                          ) : ''}
                        </span>
                      </div>

                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Cán bộ gửi phê duyệt</span>
                        <span className="chk-detail-value">
                          {record.submittedByName ? (
                            <span style={{ fontWeight: fontWeightBold }}>{record.submittedByName}</span>
                          ) : ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Ngày gửi phê duyệt</span>
                        <span className="chk-detail-value">{fmtDateTime(record.submittedDate)}</span>
                      </div>

                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">
                          {record.approverLevel1Name || record.approverLevel1 ? (
                            <span style={{ fontWeight: fontWeightBold }}>{record.approverLevel1Name || record.approverLevel1}</span>
                          ) : ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">{fmtDateTime(record.approvedDateLevel1)}</span>
                      </div>

                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">{record.approvalContentLevel1 || ''}</span>
                      </div>

                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cục</span>
                        <span className="chk-detail-value">
                          {record.approverLevel2Name || record.approverLevel2 ? (
                            <span style={{ fontWeight: fontWeightBold }}>{record.approverLevel2Name || record.approverLevel2}</span>
                          ) : ''}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cục</span>
                        <span className="chk-detail-value">{fmtDateTime(record.approvedDateLevel2)}</span>
                      </div>

                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cục</span>
                        <span className="chk-detail-value">{record.approvalContentLevel2 || ''}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          },

          // ── Tab 2: Thông tin vùng VTS ──
          {
            key: 'zones',
            label: `Thông tin vùng VTS (${zoneList.length})`,
            children: (
              <DetailTable
                scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
                dataSource={zoneList}
                emptyText={isLoadingZones ? "Đang tải dữ liệu vùng VTS..." : "Chưa có dữ liệu"}
                rowKey={(item: any) => item.id || item.code || item.name}
                columns={[
                  { title: 'STT', width: 50, align: 'center', render: (_: any, __: any, idx: number) => idx + 1 },
                  { title: 'Mã vùng', dataIndex: 'code', key: 'code', width: 200, render: (v) => v || '' },
                  {
                    title: 'Tên vùng VTS',
                    dataIndex: 'name',
                    key: 'name',
                    width: 440,
                    render: (v) => (
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>
                        {v || ''}
                      </span>
                    ),
                  },
                  {
                    title: 'Tình trạng',
                    key: 'conditionStatus',
                    width: 180,
                    render: (_v, item: any) => renderConditionStatusBadge(item.conditionStatus || item.status || ConditionStatus.OPERATIONAL),
                  },
                ]}
              />
            ),
          },

          // ── Tab 3: File đính kèm ──
          {
            key: 'files',
            label: `File đính kèm (${attachmentList.length})`,
            children: (
              <DetailTable
                dataSource={attachmentList}
                emptyText={isLoadingFiles ? "Đang tải tài liệu đính kèm..." : "Chưa có tài liệu đính kèm"}
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

          // ── Tab 4: Kết cấu hạ tầng ──
          {
            key: 'infra',
            label: 'Kết cấu hạ tầng',
            children: (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, height: 32, boxSizing: 'border-box' }}>
                  <span style={{ ...detailLabelStyle, display: 'inline-block' }}>Kết cấu hạ tầng thuộc hệ thống VTS</span>
                  <Select
                    allowClear
                    placeholder="Chọn loại kết cấu hạ tầng"
                    value={infraTypeFilter || undefined}
                    onChange={(val) => setInfraTypeFilter(val || '')}
                    options={[
                      { value: 'VTS_OPERATION_CENTER', label: 'Trung tâm điều hành VTS' },
                      { value: 'RADAR_STATION', label: 'Trạm Radar VTS' },
                    ]}
                    style={{ width: 260, borderRadius: radiusPill, height: 32 }}
                  />
                </div>
                <DetailTable
                  dataSource={infraRows}
                  loading={isLoadingInfra}
                  emptyText="Chưa có dữ liệu"
                  rowKey={(r: any) => r.id || r.infraName || r.name}
                  scrollY="calc(100vh - 320px)"
                  columns={[
                    { title: 'STT', width: 50 },
                    {
                      title: 'Loại kết cấu hạ tầng',
                      dataIndex: 'infraType',
                      key: 'type',
                      render: (_v: string, rec: any) => (
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '2px 10px',
                            borderRadius: 999,
                            fontSize: fontSizeMd,
                            fontWeight: fontWeightMedium,
                            background: `${actionPrimary}15`,
                            color: actionPrimary,
                          }}
                        >
                          {rec.typeLabel || (rec.infraType === 'VTS_OPERATION_CENTER' ? 'Trung tâm điều hành VTS' : 'Trạm Radar VTS')}
                        </span>
                      ),
                    },
                    {
                      title: 'Tên kết cấu hạ tầng',
                      dataIndex: 'infraName',
                      key: 'name',
                      render: (v: string, rec: any) => (
                        <span
                          style={{
                            fontSize: fontSizeMd,
                            color: actionPrimary,
                            cursor: 'pointer',
                            fontWeight: fontWeightBold,
                          }}
                          onClick={() => handleViewInfraDetail(rec)}
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
                            onClick={() => handleViewInfraDetail(rec)}
                          />
                        </Tooltip>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },

          // ── Tab 5: Vận hành & bảo trì (Dạng 3 Section Box cuộn dọc chuẩn Bến cảng) ──
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
                      dataSource={effectiveOperationPlanList}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(r: any) => r.id || r.planCode || r.code}
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
                      rowKey={(r: any) => r.id || r.planCode || r.code}
                      scrollY={160}
                      columns={[
                        { title: 'STT', width: 50 },
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
                      rowKey={(r: any) => r.id || r.incidentCode || r.code}
                      scrollY={160}
                      columns={[
                        { title: 'STT', width: 50 },
                        { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                        { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec.type || '' },
                        { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || '' },
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

      {/* Modal xem chi tiết ảnh */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileImageOutlined style={{ color: actionPrimary, fontSize: 18 }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              {previewImageFile?.fileName || 'Xem chi tiết hình ảnh'}
            </span>
            {previewImageFile?.fileSize ? (
              <span style={{ fontSize: fontSizeSm, color: textTertiary, fontWeight: 'normal' }}>
                ({previewImageFile.fileSize > 1024 * 1024 ? `${(previewImageFile.fileSize / (1024 * 1024)).toFixed(2)} MB` : `${(previewImageFile.fileSize / 1024).toFixed(1)} KB`})
              </span>
            ) : null}
          </div>
        }
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => previewImageFile && handleDownload(previewImageFile.id, previewImageFile.fileName)}
            style={{ borderRadius: 999 }}
          >
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
            <img
              src={previewImageUrl}
              alt={previewImageFile?.fileName || 'Ảnh đính kèm'}
              style={{
                maxWidth: '100%',
                maxHeight: '65vh',
                objectFit: 'contain',
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
          ) : (
            <div style={{ color: textTertiary }}>Không thể hiển thị hình ảnh</div>
          )}
        </div>
      </Modal>

      {/* ── Chi tiết KCHT con (Drawer lồng hoặc mở trực tiếp như Bến cảng) ── */}
      {selectedChildInfra?.type === 'VTS_OPERATION_CENTER' && (
        <VtsOperationCenterForm
          open={true}
          editId={selectedChildInfra.id}
          mode="detail"
          onCancel={() => setSelectedChildInfra(null)}
        />
      )}
      {selectedChildInfra?.type === 'RADAR_STATION' && (
        <RadarStationForm
          open={true}
          editId={selectedChildInfra.id}
          mode="detail"
          onCancel={() => setSelectedChildInfra(null)}
        />
      )}
    </div>
  );
}
