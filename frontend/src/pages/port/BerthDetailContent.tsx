import React, { useState, useEffect } from 'react';
import { Tabs, Select, Tooltip, Button, Modal } from 'antd';
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
import { parseWktToCoordinates } from '../../utils/gisGeometry';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import {
  textTertiary, surfaceCard,
  fontSizeSm, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceSm, spaceMd, spaceFormField, actionPrimary, outlineButtonStyle, primaryButtonStyle, statusBadgeStyle,
  statusOperational, statusAttention, statusCritical,
} from '../../themetokenchk';

const fontSizeMd = 13.5;
import type { Berth } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';
import { pierCRUD } from '../../services/portService';

const isImageFile = (fileName?: string): boolean => {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff'].includes(ext || '');
};

export interface BerthDetailContentProps {
  selectedRecord: Berth;
  orgMap: Map<string, string>;
  organizations?: Array<{ id: string; name: string; parentId?: string }>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  portOptions: Array<{ value: string; label: string }>;
  userMap: Map<string, string>;
  detailFiles: any[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  structureTypeOptions: Array<{ value: number; label: string }>;
  waterwayMap?: Map<string, string>;
  infrastructureList?: any[];
  operationPlanList?: any[];
  maintenancePlanList?: any[];
  incidentList?: any[];
  onViewPierDetail?: (pierId: string) => void;
}

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

// Style cho thẻ phân nhóm (Section Card)
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

// Parse tọa độ GPS: ưu tiên WKT (coordinates) từ backend — hỗ trợ POINT/MULTIPOINT/LINESTRING/POLYGON;
// fallback sang latitude/longitude (backend chỉ parse được cho POINT).
const parseGisCoordinates = (record: any): Array<{ lat: number; lng: number }> => {
  const out = parseWktToCoordinates(record?.coordinates)
    .map(({ latitude, longitude }) => ({ lat: latitude, lng: longitude }));
  if (out.length === 0 && record?.latitude != null && record?.longitude != null) {
    out.push({ lat: Number(record.latitude), lng: Number(record.longitude) });
  }
  return out;
};

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '');
const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '');

export default function BerthDetailContent({
  selectedRecord,
  orgMap,
  symbolMap,
  symbolImageMap,
  portOptions,
  userMap,
  detailFiles,
  ddToDms,
  approvalStyleMap,
  structureTypeOptions,
  waterwayMap = new Map<string, string>(),
  infrastructureList = [],
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
  onViewPierDetail,
}: BerthDetailContentProps) {
  const r = selectedRecord;
  const [infraTypeFilter, setInfraTypeFilter] = useState<string>('');
  const [loadedInfra, setLoadedInfra] = useState<any[]>([]);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);

  // Xem chi tiết ảnh & tải tệp đính kèm
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<any>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const res = await api.get(`/v1/berths/${r.id}/attachments/${fileId}/download`, { responseType: 'blob' });
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
        const res = await api.get(`/v1/berths/${r.id}/attachments/${file.id}/download`, { responseType: 'blob' });
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

  // Tải danh sách KCHT khác thuộc bến cảng (cầu cảng) — tải theo cha qua API
  useEffect(() => {
    if (!selectedRecord?.id) { setLoadedInfra([]); return; }
    let cancelled = false;
    pierCRUD.search({ berthId: selectedRecord.id, pageSize: 50 })
      .then((res: any) => {
        if (cancelled) return;
        setLoadedInfra((res?.data || []).map((x: any) => ({
          id: x.id,
          infraName: x.pierName || x.pierCode || '',
          infraType: 'Pier',
        })));
      })
      .catch(() => { if (!cancelled) setLoadedInfra([]); });
    return () => { cancelled = true; };
  }, [selectedRecord?.id]);

  const infraRows = [...loadedInfra, ...infrastructureList].filter((it: any) => {
    if (!infraTypeFilter || infraTypeFilter === 'ALL') return true;
    const t = it?.infraType ?? it?.structureType ?? it?.type;
    if (t === undefined || t === null || t === '') return true;
    return String(t).toUpperCase() === infraTypeFilter.toUpperCase();
  });

  return (
    <div className="berth-detail-content-wrapper">
      <style>{`
        .berth-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .berth-detail-content-wrapper,
        .berth-detail-content-wrapper .chk-detail-label,
        .berth-detail-content-wrapper .chk-detail-value,
        .berth-detail-content-wrapper .ant-table,
        .berth-detail-content-wrapper .ant-table-cell,
        .berth-detail-content-wrapper .ant-table-thead > tr > th,
        .berth-detail-content-wrapper .ant-tabs-tab,
        .berth-detail-content-wrapper .ant-btn,
        .berth-detail-content-wrapper .ant-select,
        .berth-detail-content-wrapper .ant-select-selection-item,
        .berth-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .berth-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .berth-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .berth-detail-content-wrapper .chk-detail-row:last-child {
          border-bottom: none !important;
        }

        .berth-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .berth-drawer-scope .berth-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .berth-detail-content-wrapper .chk-detail-label {
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

        .berth-drawer-scope .berth-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .berth-detail-content-wrapper .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .berth-drawer-scope .berth-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .berth-detail-content-wrapper .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }

        .berth-drawer-scope .berth-detail-content-wrapper .chk-detail-row .sec-full-label,
        .berth-detail-content-wrapper .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .berth-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .berth-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .berth-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .berth-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .berth-drawer-scope .berth-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .berth-detail-content-wrapper .chk-detail-label,
          .berth-detail-content-wrapper .sec-col1-label,
          .berth-detail-content-wrapper .sec-col2-label,
          .berth-detail-content-wrapper .sec-full-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }

        @media (max-width: 640px) {
          .berth-detail-content-wrapper .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .berth-drawer-scope .berth-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .berth-detail-content-wrapper .chk-detail-label,
          .berth-detail-content-wrapper .sec-col1-label,
          .berth-detail-content-wrapper .sec-col2-label,
          .berth-detail-content-wrapper .sec-full-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .berth-detail-content-wrapper .chk-detail-value {
            width: 100% !important;
          }
        }
      `}</style>
      <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
        items={[
          {
            key: 'general', label: 'Thông tin chung',
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
                      <span className="chk-detail-label sec-col1-label">Mã bến cảng</span>
                      <span className="chk-detail-value">
                        {r.berthCode ? <span style={statusBadgeStyle(actionPrimary)}>{r.berthCode}</span> : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tên bến cảng</span>
                      <span className="chk-detail-value">
                        {r.berthName ? <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{r.berthName}</span> : ''}
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
                      <span className="chk-detail-label sec-col1-label">Đơn vị khai thác</span>
                      <span className="chk-detail-value">{r.operatingOrgName || r.operator || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Thuộc luồng hàng hải</span>
                      <span className="chk-detail-value">{waterwayMap.get(r.waterwayId || '') || r.waterwayId || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Địa điểm (Tỉnh/Thành Phố)</span>
                      <span className="chk-detail-value">
                        {r.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '' : ''}
                      </span>
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
                      <span className="chk-detail-value">{r.detailedLocation || ''}</span>
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
                      <span className="chk-detail-label sec-col1-label">Tổng diện tích (ha)</span>
                      <span className="chk-detail-value">{r.totalArea != null ? fmtNum(r.totalArea) : ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Cỡ tàu tiếp nhận lớn nhất (DWT)</span>
                      <span className="chk-detail-value">{r.maxVesselSize != null ? fmtNum(r.maxVesselSize) : ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Công năng khai thác</span>
                      <span className="chk-detail-value">{r.operationalFunction || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Loại kết cấu bến cảng</span>
                      <span className="chk-detail-value">
                        {structureTypeOptions.find(o => o.value === r.structureType)?.label || (r.structureType != null ? String(r.structureType) : '')}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Năng lực thông qua thiết kế</span>
                      <span className="chk-detail-value">{r.designThroughput != null ? `${fmtNum(r.designThroughput)} tấn/năm` : ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Năng lực thông qua hiện trạng</span>
                      <span className="chk-detail-value">{r.currentThroughput != null ? `${fmtNum(r.currentThroughput)} tấn/năm` : ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Quy hoạch năng lực thông qua</span>
                      <span className="chk-detail-value">{r.plannedThroughput != null ? `${fmtNum(r.plannedThroughput)} tấn/năm` : ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Sản lượng thực tế năm gần nhất</span>
                      <span className="chk-detail-value">{r.latestCargoVolume != null ? `${fmtNum(r.latestCargoVolume)} tấn/năm` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Thông tin công bố mở, đưa vào sử dụng ── */}
                <div style={{ ...sectionBoxStyle, padding: announcementOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                  <div
                    onClick={() => setAnnouncementOpen(!announcementOpen)}
                    style={{
                      ...sectionHeaderStyle,
                      marginBottom: announcementOpen ? 10 : 0,
                      paddingBottom: announcementOpen ? 8 : 0,
                      borderBottom: announcementOpen ? '1px solid #f1f5f9' : 'none',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={sectionTitleStyle}>
                      <FileTextOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin công bố mở, đưa vào sử dụng</span>
                    </div>
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {announcementOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {announcementOpen && (
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label">Thời điểm công bố, đưa vào sử dụng</span>
                        <span className="chk-detail-value">{fmtDate(r.openingAnnouncementDate)}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label">Quyết định công bố/ Văn bản cho phép khai thác</span>
                        <span className="chk-detail-value">{r.openingDecision || ''}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label">Văn bản thỏa thuận đầu tư xây dựng</span>
                        <span className="chk-detail-value">{r.investmentAgreement || ''}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 4: Thông tin phê duyệt (Toggle chuẩn AGENTS.md) ── */}
                <div style={{ ...sectionBoxStyle, padding: approvalOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
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
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'gis', label: `Thông tin vị trí (${parseGisCoordinates(r).length})`,
            children: (
              <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                <div style={sectionBoxStyle}>
                  <div className="chk-detail-grid">
                    {[
                      { label: 'Loại đối tượng', value: ({ POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' } as Record<string, string>)[(r as any).geometryType || ''] || (r as any).geometryType || '' },
                      { label: 'Biểu tượng', value: (() => { const symId = r.mapSymbolId || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display:'inline-flex',alignItems:'center',gap:8 }}>{symImg ? <img src={symImg} alt="" style={{ width:20,height:20,objectFit:'contain' }} /> : null}{symName}</span>; })() },
                      { label: 'Hệ quy chiếu', value: r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : (r.coordinateSystem ? String(r.coordinateSystem) : '') },
                      { label: 'Quy tắc hiển thị', value: ((r as any).geometryType || (r as any).coordinates || (r as any).latitude != null || (r as any).longitude != null) ? 'Độ, phút, giây (DMS)' : '' },
                    ].map((row, i) => (
                      <div key={i} className="chk-detail-row">
                        <span className={`chk-detail-label ${i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{row.label}</span>
                        <span className="chk-detail-value">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: spaceMd }}>
                  <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                    <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                      Tọa độ GPS ({parseGisCoordinates(r).length})
                    </span>
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
                        emptyText="Chưa có tọa độ GPS nào"
                        scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                        columns={[
                          { title: 'STT', width: 50 },
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
                    { title: 'STT', width: 50 },
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
                              else handleDownloadFile(rec.id, v);
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
                                onClick={() => handleDownloadFile(rec.id, rec.fileName)}
                                style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              />
                            </Tooltip>
                          </div>
                        );
                      },
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'infra', label: 'Kết cấu hạ tầng',
            children: (
              <div style={{ paddingTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: spaceSm }}>
                  <span style={{ ...detailLabelStyle, display: 'inline-block' }}>Kết cấu hạ tầng thuộc bến cảng</span>
                  <Select allowClear placeholder="Chọn loại kết cấu hạ tầng" value={infraTypeFilter || undefined}
                    onChange={(v: string | undefined) => setInfraTypeFilter(v || '')}
                    options={[{ value: 'Pier', label: 'Cầu cảng' }]} style={{ width: 260, borderRadius: 999, height: 40 }} />
                </div>
                <DetailTable
                  dataSource={infraRows}
                  emptyText="Chưa có dữ liệu"
                  rowKey={(r: any) => r.id || r.infraName || r.name}
                  scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
                  columns={[
                    { title: 'STT', width: 50 },
                    { title: 'Loại kết cấu hạ tầng', dataIndex: 'infraType', key: 'type', render: (_v: string, rec: any) => <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary }}>{rec.infraType === 'Pier' ? 'Cầu cảng' : rec.infraType || ''}</span> },
                    { title: 'Tên kết cấu hạ tầng', dataIndex: 'infraName', key: 'name', render: (v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: actionPrimary, cursor: 'pointer', fontWeight: fontWeightBold }} onClick={() => onViewPierDetail?.(rec.id)}>{v || rec.name || ''}</span> },
                    { title: 'Thao tác', key: 'actions', width: 100, align: 'center' as const, render: (_v: any, rec: any) => (
                      <Tooltip title="Xem chi tiết">
                        <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: actionPrimary, fontSize: fontSizeMd }}
                          onClick={() => onViewPierDetail?.(rec.id)} />
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
                {/* ── Section Vận hành ── */}
                <div style={{ ...sectionBoxStyle, padding: operationOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
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
                      dataSource={operationPlanList}
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
                <div style={{ ...sectionBoxStyle, padding: maintenanceOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
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
                      dataSource={maintenancePlanList}
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
                <div style={{ ...sectionBoxStyle, padding: incidentOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
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
                      dataSource={incidentList}
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

      {/* GIS Location Selector Modal — xem vị trí trên bản đồ chuyên dụng */}
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
                let wkt = '';
                if (rawWkt.startsWith('LINESTRING')) {
                  geom = 'LINE';
                  wkt = `LINESTRING(${pts.map(p => `${p.lng} ${p.lat}`).join(', ')})`;
                } else if (rawWkt.startsWith('POLYGON')) {
                  geom = 'POLYGON';
                  wkt = `POLYGON((${pts.map(p => `${p.lng} ${p.lat}`).join(', ')}))`;
                } else if (pts.length > 1) {
                  wkt = `MULTIPOINT(${pts.map(p => `(${p.lng} ${p.lat})`).join(',')})`;
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
            onClick={() => previewImageFile && handleDownloadFile(previewImageFile.id, previewImageFile.fileName)}
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
    </div>
  );
}
