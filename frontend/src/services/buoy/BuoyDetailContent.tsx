// ── BuoyDetailContent — presentational detail body (chuẩn VTS CHK, giống BuoyBerthDetailContent) ─
// Tabs: general / light / gis / files / operation / maintenance / incident.
// org/user name mapping comes from the page (orgUnits / userMap props) — no FE fetch.
// Detail grid dùng class chk-detail-* (CSS trong theme), bảng con dùng DetailTable,
// GIS modal chế độ XEM (disabled) — chuẩn VTS CHK.

import { useState } from 'react';
import { Tabs, Button, Modal } from 'antd';
import { EnvironmentOutlined, BankOutlined, SlidersOutlined, ThunderboltOutlined, AuditOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import { fmtNum } from '../../utils/numFmt';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import { triggerBlobDownload } from '../../components/shared/infrastructureAttachmentUtils';
import { buoyCRUD } from '../beaconService';
import toast from '../../components/ToastNotification';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type { OrgUnitTreeOption } from '../../components/org-unit';
import {
  surfaceCard, borderDefault,
  actionPrimary,
  fontSizeSm, fontSizeMd, fontWeightBold,
  spaceSm, spaceMd,
  statusBadgeStyle, outlineButtonStyle, primaryButtonStyle,
  formatUserDisplayName, isUuidString,
  DRAWER_TABLE_SCROLL_Y,
  textTertiary,
} from '../../themetokenchk';
import { parseWktToCoordinates } from '../../utils/gisGeometry';
import {
  SHAPE_LABEL_MAP,
  formatClassification,
  formatClassificationBuoy,
  formatClassificationMark,
  buoyConditionBadge,
} from './schema';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import type { Buoy } from './types';

export interface BuoyDetailContentProps {
  selectedRecord: Buoy;
  orgUnits: OrgUnitTreeOption[];
  userMap: Map<string, string>;
  detailFiles: any[];
  buoyStatusBadge: (status: string) => { color: string; label: string };
  symbols?: any[];
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  waterwayMap?: Map<string, string>;
  onDownload?: (id: string, name: string) => void;
  loadReadonlyPreviewImage?: (attachmentId: string) => Promise<Blob>;
  loadPreviewAttachment?: (attachmentId: string) => Promise<Blob>;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss');
  } catch {
    return dateStr;
  }
}

function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY');
  } catch {
    return dateStr;
  }
}


const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: `1px solid ${borderDefault}`,
  borderRadius: 8,
  padding: '16px 20px',
  marginBottom: 16,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 16,
  paddingBottom: 8,
  borderBottom: `1px solid ${borderDefault}`,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  fontWeight: fontWeightBold,
  color: colors.sidebarBg,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const gridRows = (rows: Array<[string, React.ReactNode, boolean?, boolean?]>) => {
  let colIndex = 0;
  return (
    <div className="chk-detail-grid">
      {rows.map(([label, value, full, compact]) => {
        const labelCls = full
          ? 'sec-full-label'
          : colIndex % 2 === 0
            ? 'sec-col1-label'
            : 'sec-col2-label';
        if (full) {
          colIndex = 0;
        } else {
          colIndex += 1;
        }
        return (
          <div key={String(label)} className={`chk-detail-row ${full ? 'chk-detail-row--full' : ''} ${compact ? 'chk-detail-row--compact' : ''}`}>
            <span className={`chk-detail-label ${labelCls}`}>{label}</span>
            <span className="chk-detail-value">{value}</span>
          </div>
        );
      })}
    </div>
  );
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


const GEOMETRY_TYPE_LABELS: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };

export default function BuoyDetailContent({
  selectedRecord,
  orgUnits,
  userMap,
  detailFiles,
  buoyStatusBadge,
  symbols = [],
  symbolMap,
  symbolImageMap,
  ddToDms,
  waterwayMap,
  onDownload,
  loadReadonlyPreviewImage,
  loadPreviewAttachment,
}: BuoyDetailContentProps) {
  const r = selectedRecord;
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(true);

  const handleDownloadAttachment = async (attachmentId: string, name: string) => {
    if (onDownload) {
      onDownload(attachmentId, name);
      return;
    }
    const entityId = selectedRecord?.id;
    if (!entityId) {
      toast.error('Không tìm thấy bản ghi để tải tệp đính kèm');
      return;
    }
    try {
      const blob = await buoyCRUD.downloadAttachment(entityId, attachmentId);
      triggerBlobDownload(blob, name || 'attachment');
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  };

  const userName = (id: number | string | undefined | null, fallbackName?: string | null) =>
    formatUserDisplayName(id != null ? String(id) : null, fallbackName, userMap);
  const provinceName = (id: number | undefined | null) =>
    id != null ? (VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(id))?.label || String(id)) : '';
  const statusBadge = (() => {
    const b = buoyStatusBadge(r.status || '');
    return <span style={statusBadgeStyle(b.color)}>{b.label}</span>;
  })();

  const renderDms = (dd: number, suffix: string) => {
    const dms = ddToDms(dd);
    return `${dms.d ?? 0}° ${dms.m ?? 0}' ${dms.s ?? 0}" ${suffix}`;
  };

  return (
    <div className="buoy-detail-content-wrapper">
      <style>{`
        .buoy-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .buoy-detail-content-wrapper,
        .buoy-detail-content-wrapper .chk-detail-label,
        .buoy-detail-content-wrapper .chk-detail-value,
        .buoy-detail-content-wrapper .ant-table,
        .buoy-detail-content-wrapper .ant-table-cell,
        .buoy-detail-content-wrapper .ant-btn {
          font-size: 13.5px !important;
        }

        .buoy-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
          padding: 4px 0 !important;
        }

        .buoy-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow: visible !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          gap: 10px !important;
        }

        .buoy-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .buoy-drawer-scope .buoy-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .buoy-detail-content-wrapper .chk-detail-label {
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

        .buoy-drawer-scope .buoy-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .buoy-detail-content-wrapper .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .buoy-drawer-scope .buoy-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .buoy-detail-content-wrapper .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }

        .buoy-drawer-scope .buoy-detail-content-wrapper .chk-detail-row .sec-full-label,
        .buoy-detail-content-wrapper .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .buoy-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .buoy-drawer-scope .buoy-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-label,
        .buoy-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-label {
          width: auto !important;
          min-width: auto !important;
          max-width: none !important;
          flex-shrink: 0 !important;
        }
        .buoy-drawer-scope .buoy-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-value,
        .buoy-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-value {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          justify-content: flex-start !important;
          white-space: nowrap !important;
        }

        .buoy-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          word-break: break-word !important;
          line-height: 1.5 !important;
        }
      `}</style>
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 3 }}>
              {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <BankOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin cơ bản & Quản lý vận hành</span>
                  </div>
                </div>
                {(() => {
                  const isLongCode = ((r.code || '').trim().length >= 18);
                  return gridRows([
                    ['Mã phao tiêu', r.code ? <span style={{ ...statusBadgeStyle(actionPrimary), whiteSpace: 'nowrap' }}>{r.code}</span> : '', false, isLongCode],
                    ['Tên phao tiêu', <span style={{ fontWeight: fontWeightBold }}>{r.name || ''}</span>],
                    ['Đơn vị quản lý', (() => {
                      const name = orgUnits.find((o) => o.id === r.unitId)?.name || (r as any).orgUnitName || (r as any).unitName || '';
                      return <span style={{ fontWeight: fontWeightBold }}>{name || (!isUuidString(r.unitId) ? r.unitId : '') || ''}</span>;
                    })()],
                    ['Thuộc nhà trạm quản lý vận hành phao, tiêu', r.buoyStationName || (!isUuidString(r.buoyStationId) ? r.buoyStationId : '') || ''],
                    ['Thuộc luồng hàng hải', (r.navigationChannelId ? (waterwayMap?.get(r.navigationChannelId) || (!isUuidString(r.navigationChannelId) ? r.navigationChannelId : '')) : '')],
                    ['Phân loại', formatClassification(r.classification)],
                    ['Phân loại phao', formatClassificationBuoy(r.classificationBuoy)],
                    ['Phân loại tiêu', formatClassificationMark(r.classificationMark)],
                    ['Địa điểm (Tỉnh/Thành Phố)', provinceName(r.provinceId)],
                    ['Tình trạng', (() => { const s = buoyConditionBadge(r.condition); return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : ''; })()],
                    ['Địa điểm chi tiết', r.locationDetail || '', true],
                  ]);
                })()}
              </div>

              {/* ── Section 2: Thông số kỹ thuật & Quy mô thân phao / tháp đèn ── */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông số kỹ thuật & Quy mô thân phao / tháp đèn</span>
                  </div>
                </div>
                {gridRows([
                  ['Hình dạng', r.shape ? (SHAPE_LABEL_MAP[r.shape] || r.shape) : ''],
                  ['Diện tích m²', r.area != null ? fmtNum(r.area) : ''],
                  ['Chiều cao thân phao m', r.bodyHeight != null ? fmtNum(r.bodyHeight) : ''],
                  ['Đường kính phao m', r.diameter != null ? fmtNum(r.diameter) : ''],
                  ['Đèn biển', r.beaconLight || ''],
                  ['Chiều cao tháp đèn', r.towerHeight != null ? fmtNum(r.towerHeight) : ''],
                  ['Chiều cao tâm sáng', r.lightHeight != null ? fmtNum(r.lightHeight) : ''],
                  ['Chủng loại đèn', r.lightModel || ''],
                  ['Màu sắc bên ngoài tháp đèn', r.towerColor || ''],
                  ['Nguồn cung cấp năng lượng', r.powerSupply || ''],
                  ['Phạm vi chiếu sáng', r.range != null ? `${fmtNum(r.range)} hải lý` : ''],
                  ['Thời điểm đưa vào sử dụng', formatDateOnly(r.commissionedDate)],
                  ['Thời điểm sửa chữa gần nhất', formatDateOnly(r.lastRepairDate)],
                  ['Kết cấu', r.structure || '', true],
                ])}
              </div>

              {/* ── Section 3: Đặc tính ánh sáng ── */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <ThunderboltOutlined style={{ color: actionPrimary }} />
                    <span>Đặc tính ánh sáng</span>
                  </div>
                </div>
                {gridRows([
                  ['Màu sắc', r.lightColor || r.color || ''],
                  ['Kiểu chớp', r.flashType || ''],
                  ['Chu kỳ', r.period || ''],
                ])}
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
                {approvalOpen && (() => {
                  const statusInfo = buoyStatusBadge(r.status || '');
                  const isPendingPortAuthority =
                    r.status === 'PENDING_APPROVAL' ||
                    r.status === 'CHO_PHE_DUYET' ||
                    r.status === 'PROPOSED' ||
                    statusInfo?.label === 'Chờ phê duyệt cấp Cảng vụ/Chi cục' ||
                    statusInfo?.label?.toLowerCase().includes('chi cục');
                  return gridRows([
                    ['Trạng thái', statusBadge, true, isPendingPortAuthority],
                    ['Cán bộ cập nhật', <span style={{ fontWeight: fontWeightBold }}>{userName(r.updatedBy, r.updatedByName || r.createdByName)}</span>],
                    ['Ngày cập nhật', formatDate(r.updatedAt)],
                    ['Cán bộ gửi phê duyệt', <span style={{ fontWeight: fontWeightBold }}>{userName(r.sentApprovedBy || r.submittedForApprovalBy, (r as any).submittedForApprovalByName)}</span>],
                    ['Ngày gửi phê duyệt', formatDate(r.submittedForApprovalAt)],
                    ['Cán bộ phê duyệt cấp Cảng vụ/Chi cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level1ApprovedBy, (r as any).level1ApprovedByName)}</span>],
                    ['Ngày phê duyệt cấp Cảng vụ/Chi cục', formatDate(r.level1ApprovedDate)],
                    ['Nội dung phê duyệt cấp Cảng vụ/Chi cục', r.level1ApprovalContent || '', true],
                    ['Cán bộ phê duyệt cấp Cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level2ApprovedBy, (r as any).level2ApprovedByName)}</span>],
                    ['Ngày phê duyệt cấp Cục', formatDate(r.level2ApprovedDate)],
                    ['Nội dung phê duyệt cấp Cục', r.level2ApprovalContent || '', true],
                  ]);
                })()}
              </div>
            </div>
          ),
        },
        {
          key: 'gis',
          label: `Thông tin vị trí (${parseGisCoordinates(r).length})`,
          children: (() => {
            const coordinates = parseGisCoordinates(r);
            return (
              <div style={{ paddingTop: 6 }}>
                <div style={{ ...sectionBoxStyle, marginBottom: 12 }}>
                  <div className="chk-detail-grid">
                    {[
                      {
                        label: 'Loại đối tượng',
                        value:
                          coordinates.length === 0
                            ? '—'
                            : (GEOMETRY_TYPE_LABELS[(r as any)?.geometryType || ''] ||
                              (r as any)?.geometryType ||
                              'Đối tượng điểm'),
                      },
                      {
                        label: 'Biểu tượng',
                        value: (() => {
                          const symId = r?.mapSymbolId || (r as any)?.symbolId || '';
                          if (!symId && coordinates.length === 0) return '—';
                          const sym = symbols?.find(
                            (s: any) => String(s.id) === String(symId) || s.code === symId
                          ) || (symbolMap?.get(String(symId)) ? { name: symbolMap.get(String(symId)), image: symbolImageMap?.get(String(symId)) } : null);
                          const symName = sym?.name || sym?.code || (symId ? String(symId) : 'Phao báo hiệu hàng hải');
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
                          coordinates.length === 0
                            ? '—'
                            : (r?.coordinateSystem === 1
                                ? 'WGS-84'
                                : r?.coordinateSystem === 2
                                  ? 'VN-2000'
                                  : (r?.coordinateSystem ? String(r?.coordinateSystem) : 'WGS-84')),
                      },
                      {
                        label: 'Quy tắc hiển thị',
                        value: coordinates.length === 0 ? '—' : 'Độ, phút, giây (DMS)',
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
                    icon={<EnvironmentOutlined style={{ color: coordinates.length === 0 ? textTertiary : actionPrimary }} />}
                    onClick={() => setGisModalOpen(true)}
                    disabled={coordinates.length === 0}
                    style={{
                      ...outlineButtonStyle,
                      height: 32,
                      fontSize: fontSizeSm,
                      padding: '0 14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      opacity: coordinates.length === 0 ? 0.6 : 1,
                      cursor: coordinates.length === 0 ? 'not-allowed' : 'pointer',
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
                    { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => renderDms(rec.lat, 'N') },
                    { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => renderDms(rec.lng, 'E') },
                  ]}
                />
              </div>
            );
          })(),
        },
        {
          key: 'files',
          label: `File đính kèm (${detailFiles.length})`,
          children: (
            <div style={{ paddingTop: 6 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 13.5 }}>File đính kèm</span>
              </div>
              <InfrastructureAttachmentTab
                attachments={detailFiles.map((f: any) => ({
                  ...f,
                  id: f.id || f.uid,
                  fileName: f.fileName || f.name,
                  fileType: f.contentType || f.fileType,
                  fileSize: f.fileSize ?? f.size,
                  uploadedByName: (!isUuidString(f.uploadedByName) ? f.uploadedByName : '') || (f.uploadedBy ? userMap.get(String(f.uploadedBy)) : '') || 'Cán bộ quản lý',
                  uploadedDate: f.uploadedDate || f.uploadedAt || f.createdAt,
                }))}
                readonly={true}
                readonlyBerthLayout={true}
                userMap={userMap}
                onDownload={(id, name) => void handleDownloadAttachment(id, name)}
                loadReadonlyPreviewImage={
                  loadReadonlyPreviewImage ||
                  ((attachmentId) => {
                    const entityId = selectedRecord?.id;
                    return entityId
                      ? buoyCRUD.downloadAttachment(entityId, attachmentId)
                      : Promise.reject(new Error('Chưa xác định được bản ghi phao tiêu để tải tệp đính kèm'));
                  })
                }
                loadPreviewAttachment={
                  loadPreviewAttachment ||
                  ((attachmentId) => {
                    const entityId = selectedRecord?.id;
                    return entityId
                      ? buoyCRUD.downloadAttachment(entityId, attachmentId)
                      : Promise.reject(new Error('Chưa xác định được bản ghi phao tiêu để tải tệp đính kèm'));
                  })
                }
                scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
              />
            </div>
          ),
        },
        {
          key: 'operationMaintenance', label: 'Vận hành & bảo trì',
          children: (
            <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
              <div style={{ ...sectionBoxStyle, padding: operationOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setOperationOpen(!operationOpen)} style={{ ...sectionHeaderStyle, marginBottom: operationOpen ? spaceMd : 0, paddingBottom: operationOpen ? spaceSm : 0, borderBottom: operationOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Thông tin vận hành khai thác</span></div>
                  {operationOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {operationOpen && (
                  <DetailTable
                    dataSource={(r.operationPlanCode || r.operationPlanName || r.operationStartDate || r.operationEndDate) ? [{ key: 'row', operationPlanCode: r.operationPlanCode || '', operationPlanName: r.operationPlanName || '', operationStartDate: r.operationStartDate || '', operationEndDate: r.operationEndDate || '' }] : []}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(rec: any) => rec.key || rec.operationPlanCode || 'row'}
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50, align: 'center' as const },
                      { title: 'Mã kế hoạch', dataIndex: 'operationPlanCode', key: 'operationPlanCode', render: (v: string) => v || '' },
                      { title: 'Tên kế hoạch', dataIndex: 'operationPlanName', key: 'operationPlanName', render: (v: string) => v || '' },
                      { title: 'Ngày bắt đầu', dataIndex: 'operationStartDate', key: 'operationStartDate', width: 150, align: 'left' as const, render: (v: string) => (v ? formatDate(v) : '') },
                      { title: 'Ngày kết thúc', dataIndex: 'operationEndDate', key: 'operationEndDate', width: 150, align: 'left' as const, render: (v: string) => (v ? formatDate(v) : '') },
                    ]}
                  />
                )}
              </div>
              <div style={{ ...sectionBoxStyle, padding: maintenanceOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setMaintenanceOpen(!maintenanceOpen)} style={{ ...sectionHeaderStyle, marginBottom: maintenanceOpen ? spaceMd : 0, paddingBottom: maintenanceOpen ? spaceSm : 0, borderBottom: maintenanceOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Thông tin bảo trì</span></div>
                  {maintenanceOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {maintenanceOpen && (
                  <DetailTable
                    dataSource={(r.maintenancePlanCode || r.maintenancePlanName || r.maintenanceStartTime || r.maintenanceEndTime) ? [{ key: 'row', maintenancePlanCode: r.maintenancePlanCode || '', maintenancePlanName: r.maintenancePlanName || '', maintenanceStartTime: r.maintenanceStartTime || '', maintenanceEndTime: r.maintenanceEndTime || '' }] : []}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(rec: any) => rec.key || rec.maintenancePlanCode || 'row'}
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50, align: 'center' as const },
                      { title: 'Mã kế hoạch', dataIndex: 'maintenancePlanCode', key: 'maintenancePlanCode', render: (v: string) => v || '' },
                      { title: 'Tên kế hoạch', dataIndex: 'maintenancePlanName', key: 'maintenancePlanName', render: (v: string) => v || '' },
                      { title: 'Thời gian bắt đầu', dataIndex: 'maintenanceStartTime', key: 'maintenanceStartTime', width: 150, align: 'left' as const, render: (v: string) => (v ? formatDate(v) : '') },
                      { title: 'Thời gian kết thúc', dataIndex: 'maintenanceEndTime', key: 'maintenanceEndTime', width: 150, align: 'left' as const, render: (v: string) => (v ? formatDate(v) : '') },
                    ]}
                  />
                )}
              </div>
              <div style={{ ...sectionBoxStyle, padding: incidentOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setIncidentOpen(!incidentOpen)} style={{ ...sectionHeaderStyle, marginBottom: incidentOpen ? spaceMd : 0, paddingBottom: incidentOpen ? spaceSm : 0, borderBottom: incidentOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Thông tin sự cố</span></div>
                  {incidentOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {incidentOpen && (
                  <DetailTable
                    dataSource={(r.incidentCode || r.incidentType || r.incidentLocation || r.incidentTime) ? [{ key: 'row', incidentCode: r.incidentCode || '', incidentType: r.incidentType || '', incidentLocation: r.incidentLocation || '', incidentTime: r.incidentTime || '' }] : []}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(rec: any) => rec.key || rec.incidentCode || 'row'}
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50, align: 'center' as const },
                      { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'incidentCode', render: (v: string) => v || '' },
                      { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'incidentType', render: (v: string) => v || '' },
                      { title: 'Địa điểm', dataIndex: 'incidentLocation', key: 'incidentLocation', render: (v: string) => v || '' },
                      { title: 'Thời gian', dataIndex: 'incidentTime', key: 'incidentTime', width: 150, align: 'left' as const, render: (v: string) => (v ? formatDate(v) : '') },
                    ]}
                  />
                )}
              </div>
            </div>
          ),
        },
      ]}
    />

    {/* GIS Location Selector Modal — xem vị trí trên bản đồ chuyên dụng (chuẩn VTS CHK, chế độ disabled) */}
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EnvironmentOutlined style={{ color: actionPrimary }} />
          <span>Xem vị trí trên bản đồ chuyên dụng</span>
        </div>
      }
      open={gisModalOpen}
      onCancel={() => setGisModalOpen(false)}
      destroyOnHidden
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
          defaultGeometryType={(r?.geometryType as any) || 'POINT'}
          disabled
          height={520}
          value={(() => {
            const pts = parseGisCoordinates(r);
            if (pts.length > 0) {
              const rawWkt = (r as any).coordinates || '';
              let geom: 'POINT' | 'LINE' | 'POLYGON' = 'POINT';
              let wkt: string;
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
    </div>
  );
}
