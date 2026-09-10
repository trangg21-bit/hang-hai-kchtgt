import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Button, Select, Tooltip, Modal, Space } from 'antd';
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
import toast from '../../components/ToastNotification';
import api from '../../services/api';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { radarStationCRUD } from '../../services/radarStationService';
import { aisSystemService } from '../../services/aisSystemService';
import RadarStationForm from '../radarstation/RadarStationForm';
import AisSystemForm from '../aissystem/AisSystemForm';
import type { VtsOperationCenterResponse } from '../../types/vtsOperationCenter';
import { ApprovalStatus, ConditionStatus } from '../../types/vtsSystem';
import {
  colors,
  actionPrimary,
  fontWeightBold,
  fontWeightMedium,
  fontSizeSm,
  fontSizeLg,
  spaceSm,
  spaceMd,
  spaceFormField,
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
  getConditionStatusColor,
  getConditionStatusLabel,
} from '../../themetokenchk';
import { getProvinceNameById } from '../../types/common';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { parseWktToCoordinates } from '../../utils/gisGeometry';

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

export interface VtsOperationCenterDetailContentProps {
  selectedRecord: VtsOperationCenterResponse;
  symbols?: any[];
  onClose?: () => void;
  onViewOtherInfraDetail?: (item: any) => void;
  operationPlanList?: any[];
  maintenancePlanList?: any[];
  incidentList?: any[];
}

export default function VtsOperationCenterDetailContent({
  selectedRecord,
  symbols = [],
  onViewOtherInfraDetail,
  operationPlanList,
  maintenancePlanList,
  incidentList,
}: VtsOperationCenterDetailContentProps) {
  const [record, setRecord] = useState<VtsOperationCenterResponse>(selectedRecord);

  // States toggle
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // Tệp đính kèm
  const [attachmentList, setAttachmentList] = useState<any[]>(selectedRecord.attachments || []);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [filesLoaded, setFilesLoaded] = useState(false);

  // KCHT khác thuộc Trung tâm điều hành — chuẩn Bến cảng
  const [infraTypeFilter, setInfraTypeFilter] = useState<string>('');
  const [loadedInfra, setLoadedInfra] = useState<any[]>([]);
  const [isLoadingInfra, setIsLoadingInfra] = useState(false);
  const [selectedChildInfra, setSelectedChildInfra] = useState<{
    id: string;
    type: 'RADAR_STATION' | 'AIS_SYSTEM';
    name?: string;
  } | null>(null);

  // Xem chi tiết ảnh
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<any>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Kế hoạch vận hành, bảo trì, sự cố (nhận từ props hoặc fallback từ selectedRecord hoặc rỗng)
  const effectiveOperationPlanList = operationPlanList ?? (selectedRecord as any)?.operationPlanList ?? [];
  const effectiveMaintenancePlanList = maintenancePlanList ?? (selectedRecord as any)?.maintenancePlanList ?? [];
  const effectiveIncidentList = incidentList ?? (selectedRecord as any)?.incidentList ?? [];

  useEffect(() => {
    let mounted = true;
    vtsOperationCenterService.getById(selectedRecord.id)
      .then((data) => {
        if (!mounted || !data) return;
        setRecord(data);
        if (Array.isArray(data.attachments)) {
          setAttachmentList(data.attachments);
          setFilesLoaded(true);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [selectedRecord?.id]);

  // Lazy load attachments
  const handleTabChange = (key: string) => {
    if (key === 'files' && !filesLoaded && selectedRecord?.id) {
      setIsLoadingFiles(true);
      vtsOperationCenterService.listAttachments(selectedRecord.id)
        .then((files: any) => {
          setAttachmentList(files || []);
          setFilesLoaded(true);
        })
        .catch(() => {})
        .finally(() => setIsLoadingFiles(false));
    }
  };

  // Tải danh sách KCHT khác thuộc trung tâm điều hành (Trạm Radar & Trạm AIS) — chuẩn Bến cảng
  useEffect(() => {
    if (!selectedRecord?.id) {
      setLoadedInfra([]);
      return;
    }
    let cancelled = false;
    setIsLoadingInfra(true);

    Promise.all([
      radarStationCRUD
        .search({
          vtsOperationCenterId: selectedRecord.id,
          page: 1,
          pageSize: 100,
        } as any)
        .catch(() => ({ data: [] })),
      aisSystemService
        .search({
          vtsOperationCenterId: selectedRecord.id,
          page: 1,
          pageSize: 100,
        } as any)
        .catch(() => ({ data: [] })),
    ])
      .then(([radarRes, aisRes]: [any, any]) => {
        if (cancelled) return;
        const radarList = (radarRes?.data || radarRes?.items || []).map((x: any) => ({
          id: x.id,
          infraName: x.stationName || x.name || x.code || '',
          infraType: 'RADAR_STATION',
          typeLabel: 'Trạm Radar',
          raw: x,
        }));
        const aisList = (aisRes?.data || aisRes?.items || []).map((x: any) => ({
          id: x.id,
          infraName: x.stationName || x.name || x.code || '',
          infraType: 'AIS_SYSTEM',
          typeLabel: 'Hệ thống trạm bờ AIS',
          raw: x,
        }));
        setLoadedInfra([...radarList, ...aisList]);
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

  const handleClosePreview = () => {
    setPreviewModalOpen(false);
    if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setPreviewImageUrl('');
  };

  const handlePreviewImage = async (file: any) => {
    setPreviewImageFile(file);
    setPreviewImageUrl('');
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    try {
      if (file.originFileObj || file.file) {
        const raw = file.originFileObj || file.file;
        const url = URL.createObjectURL(raw);
        setPreviewImageUrl(url);
      } else if (file.url && (file.url.startsWith('blob:') || file.url.startsWith('data:'))) {
        setPreviewImageUrl(file.url);
      } else {
        const path = file.filePath || (selectedRecord?.id && file.id ? `/v1/vts-operation-center/${selectedRecord.id}/attachments/${file.id}/download` : undefined);
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
        await vtsOperationCenterService.downloadAttachment(selectedRecord.id, attId, fileName);
      }
    } catch {
      toast.error('Lỗi khi tải xuống tệp đính kèm');
    }
  };

  useEffect(() => {
    if (selectedRecord) {
      setRecord(selectedRecord);
    }
  }, [selectedRecord]);

  const effectiveRecord = record || selectedRecord;
  if (!effectiveRecord) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  const coordinates = parseGisCoordinates(effectiveRecord);

  return (
    <div className="vts-opcenter-detail-content-wrapper">
      <style>{`
        .vts-opcenter-detail-content-wrapper {
          overflow: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .vts-opcenter-detail-content-wrapper,
        .vts-opcenter-detail-content-wrapper .chk-detail-label,
        .vts-opcenter-detail-content-wrapper .chk-detail-value,
        .vts-opcenter-detail-content-wrapper .ant-table,
        .vts-opcenter-detail-content-wrapper .ant-table-cell,
        .vts-opcenter-detail-content-wrapper .ant-table-thead > tr > th,
        .vts-opcenter-detail-content-wrapper .ant-tabs-tab,
        .vts-opcenter-detail-content-wrapper .ant-btn,
        .vts-opcenter-detail-content-wrapper .ant-select,
        .vts-opcenter-detail-content-wrapper .ant-select-selection-item,
        .vts-opcenter-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .vts-opcenter-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .vts-opcenter-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .vts-opcenter-detail-content-wrapper .chk-detail-row:last-child {
          border-bottom: none !important;
        }

        /* Loại bỏ hoàn toàn đường kẻ gạch ngang dưới ô bảng khi không có dữ liệu */
        .vts-opcenter-detail-content-wrapper .ant-table-placeholder > td,
        .vts-opcenter-detail-content-wrapper .ant-table-placeholder .ant-table-cell,
        .vts-opcenter-detail-content-wrapper .ant-table-tbody > tr.ant-table-placeholder > td {
          border-bottom: none !important;
        }

        .vts-opcenter-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .vts-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .vts-opcenter-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .berth-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .vts-opcenter-detail-content-wrapper .chk-detail-label {
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

        .vts-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .vts-opcenter-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .berth-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .vts-opcenter-detail-content-wrapper .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .vts-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .vts-opcenter-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .berth-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .vts-opcenter-detail-content-wrapper .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }

        .vts-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .sec-full-label,
        .vts-opcenter-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .sec-full-label,
        .berth-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .sec-full-label,
        .vts-opcenter-detail-content-wrapper .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .vts-opcenter-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .vts-opcenter-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .vts-opcenter-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .vts-opcenter-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .vts-opcenter-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .vts-opcenter-detail-content-wrapper .chk-detail-label,
          .vts-opcenter-detail-content-wrapper .sec-col1-label,
          .vts-opcenter-detail-content-wrapper .sec-col2-label,
          .vts-opcenter-detail-content-wrapper .sec-full-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }

        @media (max-width: 640px) {
          .vts-opcenter-detail-content-wrapper .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .vts-opcenter-drawer-scope .vts-opcenter-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .vts-opcenter-detail-content-wrapper .chk-detail-label,
          .vts-opcenter-detail-content-wrapper .sec-col1-label,
          .vts-opcenter-detail-content-wrapper .sec-col2-label,
          .vts-opcenter-detail-content-wrapper .sec-full-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .vts-opcenter-detail-content-wrapper .chk-detail-value {
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
                      <span className="chk-detail-label sec-col1-label">Mã trung tâm điều hành</span>
                      <span className="chk-detail-value">
                        {record.code ? <span style={statusBadgeStyle(actionPrimary)}>{record.code}</span> : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tên trung tâm điều hành</span>
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
                      <span className="chk-detail-label sec-col2-label">Thuộc cảng biển</span>
                      <span className="chk-detail-value">{record.portName || ''}</span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Thuộc hệ thống VTS</span>
                      <span className="chk-detail-value">{record.vtsSystemName || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tình trạng</span>
                      <span className="chk-detail-value">
                        {renderConditionStatusBadge(record.conditionStatus)}
                      </span>
                    </div>

                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Địa điểm (Tỉnh/TP)</span>
                      <span className="chk-detail-value">
                        {record.provinceName || (record.provinceId ? getProvinceNameById(record.provinceId) : '')}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Địa điểm chi tiết</span>
                      <span className="chk-detail-value">{record.detailedLocation || ''}</span>
                    </div>

                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Vùng phủ sóng</span>
                      <span className="chk-detail-value">{record.coverage || ''}</span>
                    </div>

                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Ghi chú</span>
                      <span className="chk-detail-value">{record.note || ''}</span>
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
                        <span className="chk-detail-value">{fmtDateTime(record.submittedDate || record.submittedAt)}</span>
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
                          const symId = record?.symbolId || '';
                          const sym = symbols.find(
                            (s) => s.id === symId || s.code === symId || (symId && String(s.id) === String(symId))
                          );
                          const symName = sym?.name || sym?.code || (symId ? String(symId) : 'Trung tâm điều hành VTS');
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
                          record?.coordinateSystem === 1
                            ? 'WGS-84'
                            : record?.coordinateSystem === 2
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
            key: 'infrastructure',
            label: 'Kết cấu hạ tầng',
            children: (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, height: 32, boxSizing: 'border-box' }}>
                  <span style={{ ...detailLabelStyle, display: 'inline-block' }}>Kết cấu hạ tầng thuộc trung tâm điều hành</span>
                  <Select
                    allowClear
                    placeholder="Chọn loại kết cấu hạ tầng"
                    value={infraTypeFilter || undefined}
                    onChange={(val) => setInfraTypeFilter(val || '')}
                    options={[
                      { value: 'RADAR_STATION', label: 'Trạm Radar' },
                      { value: 'AIS_SYSTEM', label: 'Hệ thống trạm bờ AIS' },
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
                          {rec.typeLabel || (rec.infraType === 'RADAR_STATION' ? 'Trạm Radar' : 'Hệ thống trạm bờ AIS')}
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

          // ── Tab 5: Vận hành & bảo trì ──
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
            defaultGeometryType={(record?.geometryType as any) || 'POINT'}
            disabled
            height={520}
            value={(() => {
              if (coordinates.length > 0) {
                const rawWkt = record?.coordinates || '';
                let geom: 'POINT' | 'LINE' | 'POLYGON' = 'POINT';
                let wkt: string;
                if (rawWkt.startsWith('LINESTRING')) {
                  geom = 'LINE';
                  wkt = `LINESTRING(${coordinates.map(p => `${p.lng} ${p.lat}`).join(', ')})`;
                } else if (rawWkt.startsWith('POLYGON')) {
                  geom = 'POLYGON';
                  wkt = `POLYGON((${coordinates.map(p => `${p.lng} ${p.lat}`).join(', ')}))`;
                } else if (coordinates.length > 1) {
                  wkt = `MULTIPOINT(${coordinates.map(p => `(${p.lng} ${p.lat})`).join(',')})`;
                } else {
                  wkt = `POINT(${coordinates[0].lng} ${coordinates[0].lat})`;
                }
                return { geometryType: geom, coordinates: wkt };
              }
              return undefined;
            })()}
          />
        </div>
      </Modal>

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
        onCancel={handleClosePreview}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => previewImageFile && handleDownload(previewImageFile.id, previewImageFile.fileName)}
            style={{ borderRadius: 999 }}
          >
            Tải xuống
          </Button>,
          <Button key="close" type="primary" onClick={handleClosePreview} style={{ borderRadius: 999, background: actionPrimary, borderColor: actionPrimary }}>
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
      {selectedChildInfra?.type === 'RADAR_STATION' && (
        <RadarStationForm
          open={true}
          editId={selectedChildInfra.id}
          mode="detail"
          onCancel={() => setSelectedChildInfra(null)}
        />
      )}
      {selectedChildInfra?.type === 'AIS_SYSTEM' && (
        <AisSystemForm
          open={true}
          editId={selectedChildInfra.id}
          mode="detail"
          onCancel={() => setSelectedChildInfra(null)}
        />
      )}
    </div>
  );
}
