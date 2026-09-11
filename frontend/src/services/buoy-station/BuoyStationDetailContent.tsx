// ── BuoyStationDetailContent — chi tiết nhà trạm phao tiêu (chuẩn BuoyDetailContent) ──
// 4 tab: Thông tin chung (+ Thông tin hệ thống collapse) / Kỹ thuật & kiểm định /
// Thông tin vị trí (bảng tọa độ GPS) / File đính kèm.

import React, { useState } from 'react';
import { Tabs, Button, Modal } from 'antd';
import dayjs from 'dayjs';
import {
  FileOutlined, EnvironmentOutlined, BankOutlined, SlidersOutlined,
  AuditOutlined, DownOutlined, RightOutlined,
} from '@ant-design/icons';
import type { BuoyStationResponse, StationBuoySummary } from './types';
import {
  GEO_MAP, COORD_MAP, APPROVAL_STYLE_MAP,
} from './schema';
import {
  colors, sidebarBg, actionPrimary, statusOperational, statusAttention, statusCritical, surfaceCard,
  textPrimary, textTertiary,
  fontSizeMd, fontSizeSm, fontSizeLg, fontWeightBold,
  spaceSm, spaceMd, spaceFormField, statusBadgeStyle,
  outlineButtonStyle, primaryButtonStyle,
  formatUserDisplayName, isUuidString,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import type { OrgUnitTreeOption } from '../../components/org-unit';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import toast from '../../components/ToastNotification';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { detailLabelStyle } from '../../components/detail-drawer/detailSkin';
import { fmtNum } from '../../utils/numFmt';

// ── Style badge Tình trạng (giống Quản lý phao tiêu) ─────────────────
const CONDITION_STYLE: Record<string, { color: string; label: string }> = {
  'Đang khai thác/vận hành': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  'Chưa khai thác/vận hành': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  'Dừng khai thác/vận hành': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};


// Style cho thẻ phân nhóm (Section Card) đồng bộ với màn Quản lý bến cảng
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

// Bảng con trong tab chi tiết: DetailTable (chuẩn VTS CHK — header xám, phân trang antd, "Tổng cộng N")
function DetailTabTable({ title, dataSource, emptyText, columns, scrollY }: {
  title: React.ReactNode;
  dataSource: any[];
  emptyText?: string;
  columns: any[];
  scrollY?: number | string;
}) {
  return (
    <div style={{ paddingTop: 3 }}>
      <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>{title}</div>
      <DetailTable
        dataSource={dataSource}
        emptyText={emptyText || 'Không có dữ liệu'}
        scrollY={scrollY}
        showTotal={(total) => `Tổng cộng ${total}`}
        columns={columns}
      />
    </div>
  );
}

export interface BuoyStationDetailContentProps {
  selectedRecord: BuoyStationResponse;
  orgUnits: OrgUnitTreeOption[];
  portMap: Map<string, string>;
  waterwayMap: Map<string, string>;
  routeMap: Map<string, string>;
  userMap: Map<string, string>;
  detailFiles: any[];
  detailBuoys: StationBuoySummary[];
  onViewBuoy?: (buoyId: string) => void;
  ddToDms: (v: number) => { d: number; m: number; s: number };
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
}

function parseGisCoordinates(record: any): Array<{ lat: number; lng: number }> {
  const wkt = record?.coordinates;
  const out: Array<{ lat: number; lng: number }> = [];
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return out;
  try {
    if (wkt.startsWith('POINT')) {
      const m = wkt.match(/POINT\s*\(([\d.+-]+)\s+([\d.+-]+)\)/);
      if (m) out.push({ lng: parseFloat(m[1]), lat: parseFloat(m[2]) });
    } else if (wkt.startsWith('MULTIPOINT')) {
      const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)/);
      if (mm) mm[1].split('),(').forEach((p) => {
        const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/);
        const l = parseFloat(lng), a = parseFloat(lat);
        if (!isNaN(l) && !isNaN(a)) out.push({ lng: l, lat: a });
      });
    } else if (wkt.startsWith('LINESTRING')) {
      const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/);
      if (m) m[1].split(',').forEach((p) => {
        const [lng, lat] = p.trim().split(/\s+/);
        const l = parseFloat(lng), a = parseFloat(lat);
        if (!isNaN(l) && !isNaN(a)) out.push({ lng: l, lat: a });
      });
    } else if (wkt.startsWith('POLYGON')) {
      const m = wkt.match(/POLYGON\s*\(\s*\(([^)]+)\)\s*\)/);
      if (m) m[1].split(',').forEach((p) => {
        const [lng, lat] = p.trim().split(/\s+/);
        const l = parseFloat(lng), a = parseFloat(lat);
        if (!isNaN(l) && !isNaN(a)) out.push({ lng: l, lat: a });
      });
    }
  } catch {
    /* WKT không hợp lệ — bỏ qua */
  }
  return out;
}

const formatDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '');
const formatDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '');

export default function BuoyStationDetailContent({
  selectedRecord,
  orgUnits,
  portMap,
  waterwayMap,
  routeMap,
  userMap,
  detailFiles,
  detailBuoys,
  onViewBuoy,
  ddToDms,
  symbolMap,
  symbolImageMap,
}: BuoyStationDetailContentProps) {
  const r = selectedRecord;
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);
  const orgName = (id: string | undefined) => (id ? (orgUnits.find((o) => o.id === id)?.name || id) : '');
  const userName = (id: string | number | undefined | null, fallbackName?: string | null) =>
    formatUserDisplayName(id != null ? String(id) : null, fallbackName, userMap);

  const statusBadge = (() => {
    const b = r.status && APPROVAL_STYLE_MAP[r.status];
    return b ? (
      <span style={statusBadgeStyle(b.color)}>
        {b.label}
      </span>
    ) : '';
  })();

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

  const coords = parseGisCoordinates(r);

  return (
    <div className="buoy-station-detail-content-wrapper">
      <style>{`
        .buoy-station-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .buoy-station-detail-content-wrapper,
        .buoy-station-detail-content-wrapper .chk-detail-label,
        .buoy-station-detail-content-wrapper .chk-detail-value,
        .buoy-station-detail-content-wrapper .ant-table,
        .buoy-station-detail-content-wrapper .ant-table-cell,
        .buoy-station-detail-content-wrapper .ant-table-thead > tr > th,
        .buoy-station-detail-content-wrapper .ant-tabs-tab,
        .buoy-station-detail-content-wrapper .ant-btn,
        .buoy-station-detail-content-wrapper .ant-select,
        .buoy-station-detail-content-wrapper .ant-select-selection-item,
        .buoy-station-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .buoy-station-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 6px !important;
          padding: 4px 0 !important;
        }

        .buoy-station-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: baseline !important;
          min-height: 28px !important;
          line-height: 1.5 !important;
        }

        .buoy-station-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .buoy-station-drawer-scope .buoy-station-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .buoy-station-detail-content-wrapper .chk-detail-label {
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

        .buoy-station-drawer-scope .buoy-station-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .buoy-station-detail-content-wrapper .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .buoy-station-drawer-scope .buoy-station-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .buoy-station-detail-content-wrapper .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }

        .buoy-station-drawer-scope .buoy-station-detail-content-wrapper .chk-detail-row .sec-full-label,
        .buoy-station-detail-content-wrapper .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .buoy-station-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .buoy-station-drawer-scope .buoy-station-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-label,
        .buoy-station-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-label {
          width: auto !important;
          min-width: auto !important;
          max-width: none !important;
          flex-shrink: 0 !important;
        }
        .buoy-station-drawer-scope .buoy-station-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-value,
        .buoy-station-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-value {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          justify-content: flex-start !important;
          white-space: nowrap !important;
        }

        .buoy-station-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .buoy-station-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .buoy-station-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
        }
      `}</style>
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general',
          label: 'Thông tin chung',
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
                    ['Mã nhà trạm', <span style={{ ...statusBadgeStyle(actionPrimary), whiteSpace: 'nowrap' }}>{r.code || ''}</span>, false, isLongCode],
                    ['Tên nhà trạm', <span style={{ fontWeight: fontWeightBold }}>{r.name || ''}</span>],
                    ['Đơn vị quản lý', (() => {
                        const name = orgName(r.unitId);
                        return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                      })()],
                    ['Đơn vị khai thác', <span style={{ fontWeight: fontWeightBold }}>{DEFAULT_OPERATING_ORGANIZATIONS.find(o => o.id === r.operatingOrgId)?.name || r.operatingOrgId || ''}</span>],
                    ['Thuộc cảng biển', r.portId ? (portMap.get(r.portId) || r.portId) : ''],
                    ['Thuộc luồng hàng hải', r.waterwayId ? (waterwayMap.get(r.waterwayId) || r.waterwayId) : ''],
                    ['Tuyến luồng hàng hải', r.waterwayRouteId ? (routeMap.get(r.waterwayRouteId) || r.waterwayRouteId) : ''],
                    ['Địa điểm (Tỉnh/Thành Phố)', r.province || ''],
                    ['Địa điểm chi tiết', r.address || '', true],
                    ['Thời điểm xây dựng', formatDate(r.constructionDate)],
                    ['Tình trạng', (() => { const s = r.condition && CONDITION_STYLE[r.condition]; return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : ''; })()],
                  ]);
                })()}
              </div>

              {/* ── Section 2: Thông số kỹ thuật & Quy mô ── */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông số kỹ thuật & Quy mô</span>
                  </div>
                </div>
                {gridRows([
                  ['Tổng diện tích (m²)', r.totalArea != null ? fmtNum(r.totalArea) : ''],
                  ['Diện tích sử dụng (m²)', r.usableArea != null ? fmtNum(r.usableArea) : ''],
                  ['Số lượng nhân sự bố trí', r.staffCount != null ? fmtNum(r.staffCount) : ''],
                  ['Năm bảo trì gần nhất', r.lastMaintenanceYear != null ? r.lastMaintenanceYear : ''],
                  ['Ghi chú', r.note || '', true],
                ])}
              </div>

              {/* ── Section 3: Thông tin phê duyệt (Toggle chuẩn AGENTS.md) ── */}
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
                  const isPendingPortAuthority =
                    r.status === 'PENDING_APPROVAL' ||
                    r.status === 'CHO_PHE_DUYET' ||
                    r.status === 'PROPOSED' ||
                    APPROVAL_STYLE_MAP[r.status || '']?.label === 'Chờ phê duyệt cấp Cảng vụ/Chi cục' ||
                    APPROVAL_STYLE_MAP[r.status || '']?.label?.toLowerCase().includes('chi cục');
                  return gridRows([
                    ['Trạng thái', statusBadge, false, isPendingPortAuthority],
                    ['Cán bộ cập nhật', <span style={{ fontWeight: fontWeightBold }}>{r.updatedByName || userName(r.updatedBy, r.createdByName)}</span>],
                    ['Ngày cập nhật', formatDateTime(r.updatedAt)],
                    ['Cán bộ gửi phê duyệt', <span style={{ fontWeight: fontWeightBold }}>{userName(r.sentApprovedBy)}</span>],
                    ['Ngày gửi phê duyệt', formatDateTime(r.sentApprovedDate)],
                    ['Cán bộ phê duyệt cấp Cảng vụ/Chi cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level1ApprovedBy)}</span>],
                    ['Ngày phê duyệt cấp Cảng vụ/Chi cục', formatDateTime(r.level1ApprovedDate)],
                    ['Nội dung phê duyệt cấp Cảng vụ/Chi cục', r.level1ApprovalContent || '', true],
                    ['Cán bộ phê duyệt cấp Cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level2ApprovedBy)}</span>],
                    ['Ngày phê duyệt cấp Cục', formatDateTime(r.level2ApprovedDate)],
                    ['Nội dung phê duyệt cấp Cục', r.level2ApprovalContent || '', true],
                  ]);
                })()}
              </div>
            </div>
          ),
        },
        {
          key: 'location',
          label: 'Thông tin vị trí',
          children: (
            <div style={{ paddingTop: 3 }}>
              {gridRows([
                ['Loại đối tượng', r.objectType ? (GEO_MAP[r.objectType] || r.objectType) : ''],
                ['Biểu tượng', (() => { const symId = r.icon || ''; const symName = symbolMap.get(symId) || symId || ''; const symImg = symbolImageMap.get(symId); if (!symName && !symImg) return ''; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span>; })(),],
                ['Hệ quy chiếu', r.coordinateSystem ? (COORD_MAP[r.coordinateSystem] || r.coordinateSystem) : ''],
                ['Quy tắc hiển thị', r.displayFormat || ''],
              ])}
              <div style={{ marginTop: spaceMd }}>
                <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                  <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
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
                  dataSource={coords.map((p) => ({ ...p }))}
                  emptyText="Chưa có tọa độ GPS nào"
                  scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                  columns={[
                    { title: 'STT', width: 50 },
                    { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lat); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                    { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lng); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
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
          key: 'buoys',
          label: 'Danh sách phao tiêu',
          children: (
            <DetailTabTable
              title={<span style={detailLabelStyle}>Danh sách phao tiêu</span>}
              dataSource={detailBuoys}
              emptyText="Chưa có dữ liệu"
              scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
              columns={[
                { title: 'Mã phao, tiêu', key: 'code', dataIndex: 'code', render: (v: string) => v ? <span style={statusBadgeStyle(actionPrimary)}>{v}</span> : '' },
                { title: 'Tên phao, tiêu', key: 'name', dataIndex: 'name', render: (v: string, rec: any) => onViewBuoy ? <Button type="link" onClick={() => onViewBuoy(rec.id)} style={{ fontWeight: fontWeightBold, color: actionPrimary, padding: 0, height: 'auto' }}>{v || ''}</Button> : <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold }}>{v || ''}</span> },
                { title: 'Phân loại', key: 'classification', dataIndex: 'classification', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                { title: 'Phân loại phao', key: 'classificationBuoy', dataIndex: 'classificationBuoy', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                { title: 'Phân loại tiêu', key: 'classificationMark', dataIndex: 'classificationMark', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
              ]}
            />
          ),
        },
        {
          key: 'operation',
          label: 'Vận hành & bảo trì',
          children: (
            <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
              <div style={{ ...sectionBoxStyle, padding: operationOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setOperationOpen(!operationOpen)} style={{ ...sectionHeaderStyle, marginBottom: operationOpen ? spaceMd : 0, paddingBottom: operationOpen ? spaceSm : 0, borderBottom: operationOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Thông tin vận hành khai thác</span></div>
                  {operationOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {operationOpen && (
                  <DetailTabTable
                    title={<span style={detailLabelStyle}>Danh sách vận hành khai thác</span>}
                    dataSource={(r.operationPlanCode || r.operationPlanName || r.operationStartDate || r.operationEndDate) ? [{ key: 'row', operationPlanCode: r.operationPlanCode || '', operationPlanName: r.operationPlanName || '', operationStartDate: r.operationStartDate || '', operationEndDate: r.operationEndDate || '' }] : []}
                    emptyText="Chưa có dữ liệu"
                    scrollY={160}
                    columns={[
                      { title: 'Mã kế hoạch', key: 'operationPlanCode', dataIndex: 'operationPlanCode', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                      { title: 'Tên kế hoạch', key: 'operationPlanName', dataIndex: 'operationPlanName', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                      { title: 'Ngày bắt đầu', key: 'operationStartDate', dataIndex: 'operationStartDate', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                      { title: 'Ngày kết thúc', key: 'operationEndDate', dataIndex: 'operationEndDate', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
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
                  <DetailTabTable
                    title={<span style={detailLabelStyle}>Danh sách thông tin bảo trì</span>}
                    dataSource={(r.maintenancePlanCode || r.maintenancePlanName || r.maintenanceStartTime || r.maintenanceEndTime) ? [{ key: 'row', maintenancePlanCode: r.maintenancePlanCode || '', maintenancePlanName: r.maintenancePlanName || '', maintenanceStartTime: r.maintenanceStartTime || '', maintenanceEndTime: r.maintenanceEndTime || '' }] : []}
                    emptyText="Chưa có dữ liệu"
                    scrollY={160}
                    columns={[
                      { title: 'Mã kế hoạch', key: 'maintenancePlanCode', dataIndex: 'maintenancePlanCode', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                      { title: 'Tên kế hoạch', key: 'maintenancePlanName', dataIndex: 'maintenancePlanName', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                      { title: 'Thời gian bắt đầu', key: 'maintenanceStartTime', dataIndex: 'maintenanceStartTime', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                      { title: 'Thời gian kết thúc', key: 'maintenanceEndTime', dataIndex: 'maintenanceEndTime', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
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
                  <DetailTabTable
                    title={<span style={detailLabelStyle}>Danh sách thông tin sự cố</span>}
                    dataSource={(r.incidentCode || r.incidentType || r.incidentLocation || r.incidentTime) ? [{ key: 'row', incidentCode: r.incidentCode || '', incidentType: r.incidentType || '', incidentLocation: r.incidentLocation || '', incidentTime: r.incidentTime || '' }] : []}
                    emptyText="Chưa có dữ liệu"
                    scrollY={160}
                    columns={[
                      { title: 'Mã sự cố', key: 'incidentCode', dataIndex: 'incidentCode', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                      { title: 'Loại sự cố', key: 'incidentType', dataIndex: 'incidentType', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                      { title: 'Địa điểm', key: 'incidentLocation', dataIndex: 'incidentLocation', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                      { title: 'Thời gian', key: 'incidentTime', dataIndex: 'incidentTime', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span> },
                    ]}
                  />
                )}
              </div>
            </div>
          ),
        },
      ]}
    />

    {/* GIS Location Selector Modal — xem vị trí trên bản đồ chuyên dụng (chuẩn VTS CHK: chế độ XEM — disabled) */}
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
