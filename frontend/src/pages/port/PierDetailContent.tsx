import React, { useState } from 'react';
import { Tabs, Select, Tooltip, Button, Modal } from 'antd';
import { FileOutlined, EnvironmentOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import {
  actionPrimary, textTertiary, surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
  spaceSm, spaceMd, spaceFormField, radiusPill,
  outlineButtonStyle, primaryButtonStyle, statusBadgeStyle,
} from '../../themetokenchk';
import type { Pier } from '../../types/port';

export interface PierDetailContentProps {
  selectedRecord: Pier;
  orgMap: Map<string, string>;
  portMap: Map<string, string>;
  berthOptions: Array<{ value: string; label: string }>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  detailFiles: any[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  operationalStyleMap: Record<string, { color: string; label: string }>;
  userMap: Map<string, string>;
  waterwayMap?: Map<string, string>;
  berthDetail?: { berthCode?: string; berthName?: string } | null;
  organizations: Array<{ id: string; name: string; code?: string; parentId?: string }>;
  infrastructureList?: any[];
  operationPlanList?: any[];
  maintenancePlanList?: any[];
  incidentList?: any[];
  onViewInfraDetail?: (id: string) => void;
}

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

function formatDateOnly(d: string | null | undefined): string {
  if (!d) return '—';
  try { return dayjs(d).format('DD/MM/YYYY'); } catch { return d; }
}

function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  try { return dayjs(d).format('DD/MM/YYYY HH:mm:ss'); } catch { return d; }
}

// Loại kết cấu hạ tầng thuộc cầu cảng (đọc-only, dữ liệu từ infrastructureList)
const PIER_INFRA_TYPE_OPTIONS = [{ value: 'COSO_SUACHUA', label: 'Cơ sở sửa chữa, đóng tàu' }];

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
        const pm = wkt.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/);
        if (pm) out.push({ lng: Number(pm[1]), lat: Number(pm[2]) });
      }
    } catch { /* ignore */ }
  }
  if (out.length === 0 && record?.latitude != null && record?.longitude != null) {
    out.push({ lat: Number(record.latitude), lng: Number(record.longitude) });
  }
  return out;
};

export default function PierDetailContent({
  selectedRecord, orgMap, portMap, berthOptions, symbolMap, symbolImageMap,
  detailFiles, ddToDms, approvalStyleMap, operationalStyleMap,
  userMap, waterwayMap, berthDetail,
  infrastructureList = [],
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
  onViewInfraDetail,
}: PierDetailContentProps) {
  const r = selectedRecord;
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [athhPlanOpen, setAthhPlanOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [mooringScopeOpen, setMooringScopeOpen] = useState(true);
  const [infraTypeFilter, setInfraTypeFilter] = useState<string>('');
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const infraRows = [...infrastructureList].filter((it: any) => {
    if (!infraTypeFilter || infraTypeFilter === 'ALL') return true;
    const t = it?.infraType ?? it?.structureType ?? it?.type;
    if (t === undefined || t === null || t === '') return true;
    return String(t).toUpperCase() === infraTypeFilter.toUpperCase();
  });

  const berthLabel = berthOptions.find(o => o.value === r.berthId)?.label || r.berthName || r.berthId || '—';
  const portLabel = r.portId ? (portMap.get(r.portId) || r.portId) : '—';

  const coords = parseGisCoordinates(r);

  return (
    <>
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Mã cầu cảng', <span key="pierCode" style={statusBadgeStyle(actionPrimary)}>{r.pierCode || '—'}</span>],
                  ['Tên cầu cảng', <span style={{ fontWeight: fontWeightBold }}>{r.pierName || '—'}</span>],
                  ['Đơn vị quản lý', (() => {
                    const name = orgMap.get(r.orgUnitId || '') || r.orgUnitId || '—';
                    return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                  })(),],
                  ['Thuộc cảng biển', <span style={{ fontWeight: fontWeightBold }}>{portLabel}</span>],
                  ['Thuộc bến cảng', berthLabel],
                  ['Mã bến cảng', berthDetail?.berthCode || '—'],
                  ['Tên bến cảng', berthDetail?.berthName || berthLabel],
                  ['Thuộc luồng hàng hải', waterwayMap?.get(r.navigationChannelId || '') || r.navigationChannelId || '—'],
                  ['Địa điểm (Tỉnh/Thành Phố)', r.province || '—'],
                  ['Địa điểm chi tiết', r.detailedLocation || '—'],
                  ['Phân cấp công trình', r.constructionGrade != null ? (r.constructionGrade === 1 ? 'Cấp đặc biệt' : r.constructionGrade === 2 ? 'Cấp 1' : r.constructionGrade === 3 ? 'Cấp 2' : r.constructionGrade === 4 ? 'Cấp 3' : r.constructionGrade === 5 ? 'Cấp 4' : String(r.constructionGrade)) : '—'],
                  ['Loại kết cấu cầu cảng', r.structureType != null ? (r.structureType === 1 ? 'Kết cấu bệ cọc cao' : r.structureType === 2 ? 'Kết cấu cường từ' : r.structureType === 3 ? 'Kết cấu trọng lực' : r.structureType === 4 ? 'Kết cấu khác' : String(r.structureType)) : '—'],
                  ['Công năng khai thác', r.operationalFunction || '—'],
                  ['Tình trạng', (() => { const s = r.operationalStatus; const b = s && operationalStyleMap[s]; return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : '—'; })(),],
                ].map(([label, value], i) => (
                  <div key={i} className="chk-detail-row">
                    <span className="chk-detail-label">{label}</span>
                    <span className="chk-detail-value">{value}</span>
                  </div>
                ))}
              </div>

              {/* ── Toggle: Chỉ số tổng hợp ── */}
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setSummaryOpen(!summaryOpen)}>
                <span style={{ color: summaryOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{summaryOpen ? '▼' : '▶'} Chỉ số tổng hợp</span>
              </button>
              {summaryOpen && (
                <div className="chk-detail-grid" style={{ marginTop: 4 }}>
                  {[
                    ['Chiều dài (m)', r.length != null ? r.length : '—'],
                    ['Chiều rộng (m)', r.width != null ? r.width : '—'],
                    ['Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)', r.currentWaterDepth || '—'],
                    ['Cao độ đáy bến thiết kế', r.designBedElevation || '—'],
                    ['Cỡ tàu khai thác theo công bố (DWT)', r.publishedVesselDWT || '—'],
                    ['Thời điểm phê duyệt quy trình bảo trì công trình', r.maintenanceApprovalDate || '—'],
                    ['Thời điểm được chấp thuận hồ sơ báo cáo đánh giá ATCT (gần nhất)', r.safetyAssessmentDate || '—'],
                    ['Thời điểm kiểm định gần nhất', r.lastInspectionDate || '—'],
                    ['Số lượng cầu cảng đang khai thác', r.operatingPierCount != null ? r.operatingPierCount : '—'],
                    ['Số lượng cầu cảng đã công bố', r.publishedPierCount != null ? r.publishedPierCount : '—'],
                    ['Số lượng cầu cảng đang được thỏa thuận đầu tư xây dựng', r.investmentAgreementPierCount != null ? r.investmentAgreementPierCount : '—'],
                    ['Sản lượng hàng thông qua', r.cargoThroughput != null ? `${r.cargoThroughput} tấn` : '—'],
                    ['Tiếp nhận tàu có trọng tải lớn hơn thông số tại quyết định công bố', r.receivesLargeVessel ? 'Có' : 'Không'],
                  ].map(([label, value], i) => (
                    <div key={i} className="chk-detail-row">
                      <span className="chk-detail-label">{label}</span>
                      <span className="chk-detail-value">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Toggle: Thông tin phương án bảo đảm ATHH đã duyệt ── */}
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setAthhPlanOpen(!athhPlanOpen)}>
                <span style={{ color: athhPlanOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{athhPlanOpen ? '▼' : '▶'} Thông tin phương án bảo đảm ATHH đã duyệt</span>
              </button>
              {athhPlanOpen && (
                <div className="chk-detail-grid" style={{ marginTop: 4 }}>
                  {[
                    ['Số văn bản', r.documentNumber || '—'],
                    ['Ngày văn bản', formatDateOnly(r.documentDate)],
                  ].map(([label, value], i) => (
                    <div key={i} className="chk-detail-row">
                      <span className="chk-detail-label">{label}</span>
                      <span className="chk-detail-value">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Toggle: Thông tin công bố mở, đưa vào sử dụng ── */}
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setAnnouncementOpen(!announcementOpen)}>
                <span style={{ color: announcementOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{announcementOpen ? '▼' : '▶'} Thông tin công bố mở, đưa vào sử dụng</span>
              </button>
              {announcementOpen && (
                <div className="chk-detail-grid" style={{ marginTop: 4 }}>
                  {[
                    ['Thời điểm công bố mở, đưa vào sử dụng', formatDateOnly(r.openingAnnouncementDate)],
                    ['Quyết định công bố/ Văn bản cho phép khai thác', r.openingDecision || '—'],
                    ['Văn bản thỏa thuận đầu tư xây dựng', r.investmentAgreementDoc || '—'],
                  ].map(([label, value], i) => (
                    <div key={i} className="chk-detail-row">
                      <span className="chk-detail-label">{label}</span>
                      <span className="chk-detail-value">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Toggle: Phạm vi khu nước neo buộc tàu ── */}
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setMooringScopeOpen(!mooringScopeOpen)}>
                <span style={{ color: mooringScopeOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{mooringScopeOpen ? '▼' : '▶'} Phạm vi khu nước neo buộc tàu</span>
              </button>
              {mooringScopeOpen && (
                <div className="chk-detail-grid" style={{ marginTop: 4 }}>
                  {[
                    ['Phạm vi khu nước neo buộc tàu', <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.waterAreaNeutralScope || '—'}</span>],
                  ].map(([label, value], i) => (
                    <div key={i} className="chk-detail-row" style={{ gridColumn: '1 / -1' }}>
                      <span className="chk-detail-label">{label}</span>
                      <span className="chk-detail-value">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
        },
        {
          key: 'gis', label: `Thông tin vị trí (${coords.length})`,
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Loại đối tượng', (() => { const gt = String((r as any).geometryType || ''); const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }; return m[gt] || gt || '—'; })(),],
                  ['Biểu tượng', (() => { const symId = r.mapSymbolId || r.bieuTuongId || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display:'inline-flex',alignItems:'center',gap:8 }}>{symImg ? <img src={symImg} alt="" style={{ width:24,height:24,objectFit:'contain' }} /> : null}{symName}</span>; })(),],
                  ['Hệ quy chiếu', (r as any).coordinateSystem === 1 ? 'WGS-84' : (r as any).coordinateSystem === 2 ? 'VN-2000' : '—'],
                  ['Quy tắc hiển thị', ((r as any).geometryType || (r as any).coordinates || (r as any).latitude != null || (r as any).longitude != null) ? 'Độ, phút, giây (DMS)' : '—'],
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
          key: 'files', label: `File đính kèm (${detailFiles.length})`,
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                <span style={detailLabelStyle}>File đính kèm</span>
              </div>
              <DetailTable
                dataSource={detailFiles.map((f) => ({ ...f }))}
                emptyText="Chưa có tài liệu đính kèm"
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Tên tài liệu', dataIndex: 'fileName', key: 'fileName', render: (v: string) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{v || '—'}</span> },
                  { title: 'Dung lượng', dataIndex: 'fileSize', key: 'fileSize', width: 120, align: 'right' as const, render: (v: number) => v ? (v > 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(2)} MB` : `${(v / 1024).toFixed(1)} KB`) : '—' },
                  { title: 'Người tải lên', dataIndex: 'uploadedBy', key: 'uploadedBy', width: 180, render: (v: string) => userMap.get(v) || v || '—' },
                  { title: 'Ngày tải lên', dataIndex: 'uploadedAt', key: 'uploadedAt', width: 135, align: 'center' as const, render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—' },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'infra', label: 'Kết cấu hạ tầng',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: spaceSm }}>
                <span style={{ ...detailLabelStyle, display: 'inline-block' }}>Kết cấu hạ tầng thuộc cầu cảng</span>
                <Select placeholder="Chọn loại kết cấu hạ tầng" allowClear value={infraTypeFilter || undefined}
                  onChange={(v: string | undefined) => setInfraTypeFilter(v || '')}
                  options={PIER_INFRA_TYPE_OPTIONS} style={{ width: 360, borderRadius: radiusPill, height: 40 }} />
              </div>
              <DetailTable
                dataSource={infraRows}
                emptyText="Chưa có dữ liệu"
                rowKey={(rec: any) => rec.id || rec.infraName || rec.name}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Tên kết cấu hạ tầng', dataIndex: 'infraName', key: 'name', render: (v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: actionPrimary, cursor: 'pointer', fontWeight: fontWeightBold }} onClick={() => onViewInfraDetail?.(rec.id)}>{v || rec.name || '—'}</span> },
                  { title: 'Thao tác', key: 'actions', width: 100, align: 'center' as const, render: (_v: any, rec: any) => (
                    <Tooltip title="Xem chi tiết">
                      <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: actionPrimary, fontSize: fontSizeMd }}
                        onClick={() => onViewInfraDetail?.(rec.id)} />
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
            <div style={{ paddingTop: 3 }}>
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setOperationOpen(!operationOpen)}>
                <span style={{ color: operationOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{operationOpen ? '▼' : '▶'} Thông tin vận hành khai thác</span>
              </button>
              {operationOpen && (
                <div>
                  <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Danh sách vận hành khai thác</span>
                  <DetailTable
                    dataSource={operationPlanList}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(rec: any) => rec.id || rec.planCode || rec.code}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '—' },
                      { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '—' },
                      { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.startTime || rec.start || null) },
                      { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.endTime || rec.end || null) },
                    ]}
                  />
                </div>
              )}
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setMaintenanceOpen(!maintenanceOpen)}>
                <span style={{ color: maintenanceOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{maintenanceOpen ? '▼' : '▶'} Thông tin bảo trì</span>
              </button>
              {maintenanceOpen && (
                <div>
                  <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Danh sách thông tin bảo trì</span>
                  <DetailTable
                    dataSource={maintenancePlanList}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(rec: any) => rec.id || rec.planCode || rec.code}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '—' },
                      { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '—' },
                      { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.start || rec.startDate || null) },
                      { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.end || rec.endDate || null) },
                    ]}
                  />
                </div>
              )}
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setIncidentOpen(!incidentOpen)}>
                <span style={{ color: incidentOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{incidentOpen ? '▼' : '▶'} Thông tin sự cố</span>
              </button>
              {incidentOpen && (
                <div>
                  <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Danh sách thông tin sự cố</span>
                  <DetailTable
                    dataSource={incidentList}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(rec: any) => rec.id || rec.incidentCode || rec.code}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '—' },
                      { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec.type || '—' },
                      { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || '—' },
                      { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.time || null) },
                    ]}
                  />
                </div>
              )}
            </div>
          ),
        },
        {
          key: 'system', label: 'Xử lý & theo dõi',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Trạng thái', r.approvalStatus && approvalStyleMap[r.approvalStatus] ? <span style={statusBadgeStyle(approvalStyleMap[r.approvalStatus].color)}>{approvalStyleMap[r.approvalStatus].label}</span> : '—'],
                  ['Cán bộ cập nhật', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.updatedBy || '') || r.updatedBy || '—'}</span>],
                  ['Ngày cập nhật', fmtDateTime(r.updatedAt)],
                  ['Cán bộ gửi phê duyệt', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.submittedForApprovalBy || '') || r.submittedForApprovalBy || '—'}</span>],
                  ['Ngày gửi phê duyệt', fmtDateTime(r.submittedForApprovalAt)],
                  ['Cán bộ phê duyệt cấp Cảng vụ/Chi cục', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.portAuthorityApprovedBy || '') || r.portAuthorityApprovedBy || '—'}</span>],
                  ['Ngày phê duyệt cấp Cảng vụ/Chi cục', fmtDateTime(r.portAuthorityApprovedAt)],
                  ['Cán bộ phê duyệt cấp Cục', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.departmentApprovedBy || '') || r.departmentApprovedBy || '—'}</span>],
                  ['Ngày phê duyệt cấp Cục', fmtDateTime(r.departmentApprovedAt)],
                  ['Nội dung phê duyệt cấp Cảng vụ/Chi cục', (r as any).portAuthorityApprovalContent || '—'],
                  ['Nội dung phê duyệt cấp Cục', (r as any).departmentApprovalContent || '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="chk-detail-row" style={label === 'Trạng thái' ? { gridColumn: '1 / -1' } : undefined}>
                    <span className="chk-detail-label">{label}</span>
                    <span className="chk-detail-value">{value}</span>
                  </div>
                ))}
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
    </>
  );
}
