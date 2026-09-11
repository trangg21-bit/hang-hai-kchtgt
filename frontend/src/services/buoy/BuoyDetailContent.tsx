// ── BuoyDetailContent — presentational detail body (chuẩn VTS CHK, giống BuoyBerthDetailContent) ─
// Tabs: general / light / gis / files / operation / maintenance / incident.
// org/user name mapping comes from the page (orgUnits / userMap props) — no FE fetch.
// Detail grid dùng class chk-detail-* (CSS trong theme), bảng con dùng DetailTable,
// GIS modal chế độ XEM (disabled) — chuẩn VTS CHK.

import { useState } from 'react';
import { Tabs, Button, Modal } from 'antd';
import { EnvironmentOutlined, BankOutlined, SlidersOutlined, ThunderboltOutlined, AuditOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { detailLabelStyle } from '../../components/detail-drawer/detailSkin';
import { colors } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import { fmtNum } from '../../utils/numFmt';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import toast from '../../components/ToastNotification';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type { OrgUnitTreeOption } from '../../components/org-unit';
import {
  textTertiary, surfaceCard, borderDefault,
  actionPrimary, statusOperational, statusAttention, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
  spaceSm, spaceMd, spaceFormField,
  statusBadgeStyle, outlineButtonStyle, primaryButtonStyle,
  formatUserDisplayName, isUuidString,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import {
  SHAPE_LABEL_MAP,
} from './schema';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import type { Buoy } from './types';

export interface BuoyDetailContentProps {
  selectedRecord: Buoy;
  orgUnits: OrgUnitTreeOption[];
  userMap: Map<string, string>;
  detailFiles: any[];
  buoyStatusBadge: (status: string) => { color: string; label: string };
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  ddToDms: (dd: number) => { d: number; m: number; s: number };
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

const gridRows = (rows: Array<[string, React.ReactNode, boolean?, boolean?]>) => (
  <div className="chk-detail-grid">
    {rows.map(([label, value, full, compact], index) => (
      <div key={String(label)} className={`chk-detail-row ${full ? 'chk-detail-row--full' : ''} ${compact ? 'chk-detail-row--compact' : ''}`}>
        <span className={`chk-detail-label ${full ? 'sec-full-label' : (index % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label')}`}>{label}</span>
        <span className="chk-detail-value">{value}</span>
      </div>
    ))}
  </div>
);

// Parse tọa độ GPS: ưu tiên WKT (coordinates) — POINT/MULTIPOINT từ form Phao tiêu;
// fallback sang latitude/longitude (giống BuoyBerthDetailContent).
// ⚠️ MULTIPOINT regex ĐÚNG: ((?:\([^)]*\),?)+) — bắt đủ N điểm (KHÔNG dùng (?:,[^)]+)* — chỉ bắt 1 điểm)
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
        const pm = wkt.match(/POINT\s*\(([\d.+-]+)\s+([\d.+-]+)\)/);
        if (pm) out.push({ lng: Number(pm[1]), lat: Number(pm[2]) });
      }
    } catch { /* ignore */ }
  }
  if (out.length === 0 && record?.latitude != null && record?.longitude != null) {
    out.push({ lat: Number(record.latitude), lng: Number(record.longitude) });
  }
  return out;
};

// Style badge Tình trạng giống bến cảng (operationalStatus pill)
const CONDITION_STYLE: Record<string, { color: string; label: string }> = {
  'Đang khai thác/vận hành': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  'Chưa khai thác/vận hành': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  'Dừng khai thác/vận hành': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

const GEOMETRY_TYPE_LABELS: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };

export default function BuoyDetailContent({
  selectedRecord,
  orgUnits,
  userMap,
  detailFiles,
  buoyStatusBadge,
  symbolMap,
  symbolImageMap,
  ddToDms,
}: BuoyDetailContentProps) {
  const r = selectedRecord;
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(true);
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
        .buoy-detail-content-wrapper .ant-table-thead > tr > th,
        .buoy-detail-content-wrapper .ant-tabs-tab,
        .buoy-detail-content-wrapper .ant-btn,
        .buoy-detail-content-wrapper .ant-select,
        .buoy-detail-content-wrapper .ant-select-selection-item,
        .buoy-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .buoy-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 6px !important;
          padding: 4px 0 !important;
        }

        .buoy-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: baseline !important;
          min-height: 28px !important;
          line-height: 1.5 !important;
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
                      const name = orgUnits.find((o) => o.id === r.unitId)?.name || r.unitId || '';
                      return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                    })()],
                    ['Thuộc nhà trạm quản lý vận hành phao, tiêu', r.buoyStationName || ''],
                    ['Phân loại', r.classification || ''],
                    ['Phân loại phao', r.classificationBuoy || ''],
                    ['Phân loại tiêu', r.classificationMark || ''],
                    ['Địa điểm (Tỉnh/Thành Phố)', provinceName(r.provinceId)],
                    ['Tình trạng', (() => { const s = r.condition ? CONDITION_STYLE[r.condition] : null; return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : ''; })()],
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
                    ['Trạng thái', statusBadge, false, isPendingPortAuthority],
                    ['Cán bộ cập nhật', <span style={{ fontWeight: fontWeightBold }}>{userName(r.updatedBy, r.updatedByName || r.createdByName)}</span>],
                    ['Ngày cập nhật', formatDate(r.updatedAt)],
                    ['Cán bộ gửi phê duyệt', <span style={{ fontWeight: fontWeightBold }}>{userName(r.sentApprovedBy || r.submittedForApprovalBy, (r as any).submittedForApprovalByName)}</span>],
                    ['Ngày gửi phê duyệt', formatDate(r.submittedForApprovalAt)],
                    ['Cán bộ phê duyệt cấp Cảng vụ/Chi cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level1ApprovedBy, (r as any).level1ApprovedByName)}</span>],
                    ['Ngày phê duyệt cấp Cảng vụ/Chi cục', formatDate(r.level1ApprovedDate)],
                    ['Cán bộ phê duyệt cấp Cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level2ApprovedBy, (r as any).level2ApprovedByName)}</span>],
                    ['Ngày phê duyệt cấp Cục', formatDate(r.level2ApprovedDate)],
                    ['Nội dung phê duyệt cấp Cảng vụ/Chi cục', r.level1ApprovalContent || '', true],
                    ['Nội dung phê duyệt cấp Cục', r.level2ApprovalContent || '', true],
                  ]);
                })()}
              </div>
            </div>
          ),
        },
        {
          key: 'gis', label: `Thông tin vị trí (${parseGisCoordinates(r).length})`,
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Loại đối tượng', GEOMETRY_TYPE_LABELS[(r as any).geometryType || ''] || (r as any).geometryType || ''],
                  ['Biểu tượng bản đồ', (() => { const symId = r.mapSymbolId || ''; const symName = symbolMap.get(symId) || symId || ''; const symImg = symbolImageMap.get(symId); if (!symName && !symImg) return ''; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span>; })(),],
                  ['Hệ quy chiếu', r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : (r.coordinateSystem ? String(r.coordinateSystem) : '')],
                  ['Quy tắc hiển thị', ((r as any).geometryType || (r as any).coordinates || r.latitude != null || r.longitude != null) ? 'Độ, phút, giây (DMS)' : ''],
                ].map(([label, value], i) => (
                  <div key={i} className="chk-detail-row">
                    <span className="chk-detail-label">{label}</span>
                    <span className="chk-detail-value">{value}</span>
                  </div>
                ))}
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
                        { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => renderDms(rec.lat, 'N') },
                        { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => renderDms(rec.lng, 'E') },
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
            <div style={{ paddingTop: 6 }}>
              <InfrastructureAttachmentTab
                attachments={detailFiles.map((f: any) => ({
                  ...f,
                  id: f.id || f.uid,
                  fileName: f.fileName || f.name,
                  fileSize: f.fileSize ?? f.size,
                  uploadedByName: (!isUuidString(f.uploadedByName) ? f.uploadedByName : '') || (f.uploadedBy ? userMap.get(String(f.uploadedBy)) : '') || 'Cán bộ quản lý',
                  uploadedDate: f.uploadedDate || f.uploadedAt || f.createdAt,
                }))}
                readonly={true}
                userMap={userMap}
                onDownload={(_id, name) => {
                  toast.info(`Đang tải xuống tệp: ${name}`);
                }}
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
    </div>
  );
}
