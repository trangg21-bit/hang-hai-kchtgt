import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Table, Space, InputNumber, Collapse, Select, Button, Tooltip } from 'antd';
import { FileOutlined, EyeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault, surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceSm, spaceMd, spaceXs, actionPrimary, radiusPill,
} from '../../tokens';
import type { Berth } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';
import { resolveOrgFullPath } from '../../components/org-unit';
import Pagination from '../../components/list-view/Pagination';
import { pierCRUD } from '../../services/portService';

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

// Loại kết cấu hạ tầng thuộc bến cảng: bến cảng chỉ có 1 loại KCHT con — cầu cảng
const BERTH_INFRA_TYPE_OPTIONS = [{ value: 'Pier', label: 'Cầu cảng' }];
const TAB_PAGE_SIZE = 5;

// Bảng con trong tab chi tiết: thanh phân trang dùng chung (luôn hiển thị, kể cả khi chưa có dữ liệu)
function PagedTabTable({ title, dataSource, columns, emptyText }: {
  title: React.ReactNode;
  dataSource: any[];
  columns: React.ReactNode;
  emptyText: React.ReactNode;
}) {
  const [page, setPage] = useState(1);
  const maxPage = Math.max(1, Math.ceil(dataSource.length / TAB_PAGE_SIZE));
  const cur = Math.min(page, maxPage);
  const rows = dataSource
    .map((row, idx) => ({ ...row, key: row?.key ?? idx, __stt: idx + 1 }))
    .slice((cur - 1) * TAB_PAGE_SIZE, cur * TAB_PAGE_SIZE);
  return (
    <div style={{ paddingTop: 3 }}>
      <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>{title}</div>
      <Table className="list-view-table" dataSource={rows} pagination={false} size="middle" bordered
        style={{ marginLeft: 12, marginRight: 12 }} locale={{ emptyText }}>
        <Table.Column title="STT" key="stt" dataIndex="__stt" width={60} align="center"
          render={(v: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{v}</span>}
          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
        {columns}
      </Table>
      <div style={{ margin: '0 12px' }}>
        <Pagination total={dataSource.length} current={cur} pageSize={TAB_PAGE_SIZE}
          pageSizeOptions={[5, 10, 20]} onChange={setPage} />
      </div>
    </div>
  );
}

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—');

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
        const mm = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)/);
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

export default function BerthDetailContent({
  selectedRecord,
  orgMap,
  organizations = [],
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
  const [systemOpen, setSystemOpen] = useState(true);
  const [infraTypeFilter, setInfraTypeFilter] = useState<string>('Pier');
  const [loadedInfra, setLoadedInfra] = useState<any[]>([]);

  // Tải danh sách KCHT khác thuộc bến cảng (cầu cảng) — logic giống mẫu Cảng biển: tải theo cha qua API
  useEffect(() => {
    if (!selectedRecord?.id) { setLoadedInfra([]); return; }
    let cancelled = false;
    pierCRUD.search({ berthId: selectedRecord.id, pageSize: 50 })
      .then((res: any) => {
        if (cancelled) return;
        setLoadedInfra((res?.data || []).map((x: any) => ({
          id: x.id,
          infraName: x.pierName || x.pierCode || '—',
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
    <>
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 3 }}>
              <style>{`.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}.detail-row{display:flex;padding:10px 12px;border-bottom:1px solid ${borderDefault}}.detail-label{width:200px;flex-shrink:0;color:${colors.sidebarBg};font-weight:${fontWeightBold};font-size:${fontSizeMd}px}.detail-label::after{content:':';margin-left:2px}.detail-value{color:${textPrimary};font-size:${fontSizeMd}px;flex:1}.detail-value .ant-tag{margin-left:-6px!important}.system-collapse .ant-collapse-header{gap:0!important;padding:4px 0!important}.system-collapse .ant-collapse-content-box{padding:0!important}.ant-tabs-content-holder{padding-top:0!important}.ant-tabs-tabpane{padding-top:0!important}.ant-tabs-nav{margin-bottom:0!important;padding-left:12px!important}`}</style>
              <div className="detail-grid">
                {[
                  ['Đơn vị quản lý', (() => {
                    const orgPathNames = resolveOrgFullPath(organizations, r.orgUnitId);
                    if (!orgPathNames || orgPathNames.length === 0) return orgMap.get(r.orgUnitId || '') || r.orgUnitId || '—';
                    const levelColors = [textPrimary, textSecondary, textTertiary];
                    return (
                      <span style={{ fontWeight: fontWeightBold }}>
                        {orgPathNames.map((n, i) => (
                          <span key={i} style={{ display: 'block', color: levelColors[Math.min(i, levelColors.length - 1)] }}>{n}</span>
                        ))}
                      </span>
                    );
                  })(),],
                  ['Thuộc cảng biển', <span style={{ fontWeight: fontWeightBold }}>{portOptions.find(o => o.value === r.portId)?.label || r.portId || '—'}</span>],
                  ['Mã bến cảng', <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: '#1677ff15', color: '#1677ff' }}>{r.berthCode || '—'}</span>],
                  ['Tên bến cảng', <span style={{ fontWeight: fontWeightBold }}>{r.berthName || '—'}</span>],
                  ['Thuộc luồng hàng hải', waterwayMap.get(r.waterwayId || '') || r.waterwayId || '—'],
                  ['Đơn vị khai thác', r.operator || '—'],
                  ['Địa điểm (Tỉnh/TP)', r.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '—' : '—'],
                  ['Địa điểm chi tiết', r.detailedLocation || '—'],
                  ['Loại kết cấu bến cảng', structureTypeOptions.find(o => o.value === r.structureType)?.label || r.structureType || '—'],
                  ['Công năng khai thác', r.operationalFunction || '—'],
                  ['Tổng diện tích (ha)', r.totalArea != null ? r.totalArea : '—'],
                  ['Năng lực thông qua thiết kế', r.designThroughput != null ? `${r.designThroughput} tấn/năm` : '—'],
                  ['Năng lực thông qua hiện trạng', r.currentThroughput != null ? `${r.currentThroughput} tấn/năm` : '—'],
                  ['Quy hoạch năng lực thông qua', r.plannedThroughput != null ? `${r.plannedThroughput} tấn/năm` : '—'],
                  ['Sản lượng thực tế năm gần nhất', r.latestCargoVolume != null ? `${r.latestCargoVolume} tấn/năm` : '—'],
                  ['Cỡ tàu tiếp nhận lớn nhất (DWT)', r.maxVesselSize != null ? r.maxVesselSize : '—'],
                  ['Tình trạng', (() => { const s = r.operationalStatus; const m: Record<string,{color:string;label:string}> = { OPERATIONAL:{color:'#1BAF7A',label:'Đang khai thác/Vận hành'}, NOT_YET_OPERATIONAL:{color:'#FA8C16',label:'Chưa khai thác/Vận hành'}, SUSPENDED:{color:'#F5222D',label:'Dừng khai thác/Vận hành'} }; const b = s && m[s]; return b ? <span style={{ display:'inline-flex',padding:'2px 10px',borderRadius:999,fontSize:fontSizeMd,fontWeight:fontWeightMedium,background:`${b.color}15`,color:b.color }}>{b.label}</span> : '—'; })(),],
                  ['Trạng thái phê duyệt', r.approvalStatus && approvalStyleMap[r.approvalStatus] ? <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${approvalStyleMap[r.approvalStatus].color}15`, color: approvalStyleMap[r.approvalStatus].color }}>{approvalStyleMap[r.approvalStatus].label}</span> : '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ cursor: 'pointer', marginTop: 10, paddingLeft: 12 }} onClick={() => setSystemOpen(!systemOpen)}>
                <span style={{ color: systemOpen ? '#1677ff' : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{systemOpen ? '▼' : '▶'} Thông tin hệ thống</span>
              </div>
              {systemOpen && (
                <div className="detail-grid" style={{ marginTop: 4 }}>
                  {[
                    ['Cán bộ cập nhật', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.updatedBy || '') || r.updatedBy || '—'}</span>],
                    ['Ngày cập nhật', fmtDateTime(r.updatedAt)],
                    ['Cán bộ gửi phê duyệt', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.submittedForApprovalBy || '') || r.submittedForApprovalBy || '—'}</span>],
                    ['Ngày gửi phê duyệt', fmtDateTime(r.submittedForApprovalAt)],
                    ['Cán bộ phê duyệt cấp Cảng vụ/Chi cục', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.portAuthorityApprovedBy || '') || r.portAuthorityApprovedBy || '—'}</span>],
                    ['Ngày phê duyệt cấp Cảng vụ/Chi cục', fmtDateTime(r.portAuthorityApprovedAt)],
                    ['Cán bộ phê duyệt cấp Cục', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.departmentApprovedBy || '') || r.departmentApprovedBy || '—'}</span>],
                    ['Ngày phê duyệt cấp Cục', fmtDateTime(r.departmentApprovedAt)],
                    ['Nội dung phê duyệt cấp Cảng vụ/Chi cục', r.portAuthorityApprovalContent || '—'],
                    ['Nội dung phê duyệt cấp Cục', r.departmentApprovalContent || '—'],
                  ].map(([label, value], i) => (
                    <div key={i} className="detail-row">
                      <span className="detail-label">{label}</span>
                      <span className="detail-value">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
        },
        {
          key: 'announcement', label: 'Thông tin công bố',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="detail-grid">
                {[
                  ['Thời điểm công bố', fmtDateTime(r.openingAnnouncementDate)],
                  ['Quyết định công bố', r.openingDecision || '—'],
                  ['Văn bản thỏa thuận', r.investmentAgreement || '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          key: 'gis', label: 'Thông tin vị trí',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="detail-grid">
                {[
                  ['Loại đối tượng', { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }[(r as any).geometryType || ''] || (r as any).geometryType || '—'],
                  ['Biểu tượng', (() => { const symId = r.mapSymbolId || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display:'inline-flex',alignItems:'center',gap:8 }}>{symImg ? <img src={symImg} alt="" style={{ width:24,height:24,objectFit:'contain' }} /> : null}{symName}</span>; })(),],
                  ['Hệ quy chiếu', r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : r.coordinateSystem || '—'],
                  ['Quy tắc hiển thị', ((r as any).geometryType || (r as any).coordinates || (r as any).latitude != null || (r as any).longitude != null) ? 'Độ, phút, giây (DMS)' : '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: spaceSm, padding: '0 12px' }}>
                <span style={detailLabelStyle}>Tọa độ GPS</span>
                {(() => {
                  const pts = parseGisCoordinates(r);
                  return (
                    <Table className="list-view-table" dataSource={pts.map((p, i) => ({ ...p, key: i }))} pagination={false} size="middle" bordered style={{ marginTop: spaceXs }}
                      locale={{ emptyText: <div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><EnvironmentOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có tọa độ</span></div> }}
                    >
                      <Table.Column title="STT" key="stt" width={60} align="center"
                        render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{i + 1}</span>}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                      <Table.Column title="Vĩ độ (N)" key="lat" align="center"
                        render={(_: any, rec: any) => {
                          const dms = ddToDms(rec.lat);
                          return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly style={{ flex: 1.2, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                        }}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                      <Table.Column title="Kinh độ (E)" key="lng" align="center"
                        render={(_: any, rec: any) => {
                          const dms = ddToDms(rec.lng);
                          return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly style={{ flex: 1.2, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                        }}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                    </Table>
                  );
                })()}
              </div>
            </div>
          ),
        },
        {
          key: 'files', label: 'File đính kèm',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                <span style={detailLabelStyle}>File đính kèm</span>
              </div>
              <Table className="list-view-table" rowKey="key" dataSource={detailFiles.map((f, i) => ({ ...f, key: f.id, _idx: i }))} pagination={false} size="middle" bordered style={{ marginLeft: 12, marginRight: 12 }}
                locale={{ emptyText: (
                  <div style={{ padding: '32px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div>
                    <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có tài liệu đính kèm</span>
                  </div>
                ) }}
              >
                <Table.Column title="STT" key="stt" width={60} align="center"
                  render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Tên file" key="name" dataIndex="fileName" align="center"
                  render={(name: string) => <div style={{ textAlign: 'left', fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</div>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              </Table>
            </div>
          ),
        },
        {
          key: 'infra', label: 'Danh sách kết cấu hạ tầng khác thuộc bến cảng',
          children: (
            <PagedTabTable
              title={(
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Loại kết cấu hạ tầng</span>
                  <Select value={infraTypeFilter} onChange={(v: string) => setInfraTypeFilter(v)}
                    options={BERTH_INFRA_TYPE_OPTIONS} style={{ width: 360, borderRadius: radiusPill, height: 40 }} />
                </div>
              )}
              dataSource={infraRows}
              emptyText={(
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div>
                  <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Chưa có dữ liệu</span>
                </div>
              )}
              columns={(
                <>
                  <Table.Column title="Tên kết cấu hạ tầng" key="name" dataIndex="infraName" align="center"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: actionPrimary, cursor: 'pointer', fontWeight: fontWeightBold }} onClick={() => onViewPierDetail?.(rec.id)}>{v || rec.name || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thao tác" key="actions" width={100} align="center"
                    render={(_: any, rec: any) => (
                      <Tooltip title="Xem chi tiết">
                        <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: actionPrimary, fontSize: fontSizeMd }}
                          onClick={() => onViewPierDetail?.(rec.id)} />
                      </Tooltip>
                    )}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                </>
              )}
            />
          ),
        },
        {
          key: 'operation', label: 'Thông tin vận hành khai thác',
          children: (
            <PagedTabTable
              title={<span style={detailLabelStyle}>Thông tin vận hành khai thác</span>}
              dataSource={operationPlanList}
              emptyText={(
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div>
                  <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Chưa có dữ liệu</span>
                </div>
              )}
              columns={(
                <>
                  <Table.Column title="Mã kế hoạch" key="code" dataIndex="planCode"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.code || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Tên kế hoạch" key="name" dataIndex="planName"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.name || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Ngày bắt đầu" key="start" dataIndex="startDate"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(v || rec.startTime || rec.start || null)}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Ngày kết thúc" key="end" dataIndex="endDate"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(v || rec.endTime || rec.end || null)}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thao tác" key="actions" width={100} align="center"
                    render={() => <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                </>
              )}
            />
          ),
        },
        {
          key: 'maintenance', label: 'Thông tin bảo trì',
          children: (
            <PagedTabTable
              title={<span style={detailLabelStyle}>Thông tin bảo trì</span>}
              dataSource={maintenancePlanList}
              emptyText={(
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div>
                  <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Chưa có dữ liệu</span>
                </div>
              )}
              columns={(
                <>
                  <Table.Column title="Mã kế hoạch" key="code" dataIndex="planCode"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.code || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Tên kế hoạch" key="name" dataIndex="planName"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.name || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thời gian bắt đầu" key="start" dataIndex="startTime"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(v || rec.start || rec.startDate || null)}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thời gian kết thúc" key="end" dataIndex="endTime"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(v || rec.end || rec.endDate || null)}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thao tác" key="actions" width={100} align="center"
                    render={() => <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                </>
              )}
            />
          ),
        },
        {
          key: 'incident', label: 'Thông tin sự cố',
          children: (
            <PagedTabTable
              title={<span style={detailLabelStyle}>Thông tin sự cố</span>}
              dataSource={incidentList}
              emptyText={(
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div>
                  <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Chưa có dữ liệu</span>
                </div>
              )}
              columns={(
                <>
                  <Table.Column title="Mã sự cố" key="code" dataIndex="incidentCode"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.code || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Loại sự cố" key="type" dataIndex="incidentType"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.type || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Địa điểm" key="location" dataIndex="location"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thời gian" key="time" dataIndex="incidentTime"
                    render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(v || rec.time || null)}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thao tác" key="actions" width={100} align="center"
                    render={() => <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                </>
              )}
            />
          ),
        },
      ]}
    />
    </>
  );
}
