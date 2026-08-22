// ── BuoyStationDetailContent — chi tiết nhà trạm phao tiêu (chuẩn BuoyDetailContent) ──
// 4 tab: Thông tin chung (+ Thông tin hệ thống collapse) / Kỹ thuật & kiểm định /
// Thông tin vị trí (bảng tọa độ GPS) / File đính kèm.

import React, { useState } from 'react';
import { Tabs, Table, Space, InputNumber, Button } from 'antd';
import { FileOutlined, EnvironmentOutlined, EyeOutlined } from '@ant-design/icons';
import type { BuoyStationResponse, StationBuoySummary } from './types';
import {
  GEO_MAP, COORD_MAP, APPROVAL_STYLE_MAP,
} from './schema';
import {
  actionPrimary, statusOperational, statusAttention, statusCritical, surfaceCard,
  textPrimary, textSecondary, textTertiary, borderDefault,
  fontSizeMd, fontSizeSm, fontSizeLg, fontWeightBold, fontWeightMedium,
  spaceSm, spaceXs,
} from '../../tokens';
import { colors } from '../../theme';
import { resolveOrgFullPath, type OrgUnitTreeOption } from '../../components/org-unit';
import Pagination from '../../components/list-view/Pagination';

// ── Style badge Tình trạng (giống Quản lý phao tiêu) ─────────────────
const CONDITION_STYLE: Record<string, { color: string; label: string }> = {
  'Đang khai thác/vận hành': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  'Chưa khai thác/vận hành': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  'Dừng khai thác/vận hành': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

// Bảng con trong tab chi tiết: thanh phân trang dùng chung (chuẩn bến/cầu cảng)
const TAB_PAGE_SIZE = 5;
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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  } catch {
    return dateStr;
  }
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
  const [systemOpen, setSystemOpen] = useState(true);

  const orgName = (id: string | undefined) => (id ? (orgUnits.find((o) => o.id === id)?.name || id) : '—');
  const userName = (id: string | number | undefined | null) =>
    id != null ? (userMap.get(String(id)) || String(id)) : '—';

  const statusBadge = (() => {
    const b = APPROVAL_STYLE_MAP[r.status || ''] || { color: textTertiary, label: r.status || '—' };
    return (
      <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${b.color}15`, color: b.color }}>
        {b.label}
      </span>
    );
  })();

  const detailGrid = (
    <style>{`.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}.detail-row{display:flex;padding:10px 12px;border-bottom:1px solid ${borderDefault}}.detail-label{width:200px;flex-shrink:0;color:${colors.sidebarBg};font-weight:${fontWeightBold};font-size:${fontSizeMd}px}.detail-label::after{content:':';margin-left:2px}.detail-value{color:${textPrimary};font-size:${fontSizeMd}px;flex:1;overflow-wrap:anywhere}.detail-value .ant-tag{margin-left:-6px!important}.ant-tabs-content-holder{padding-top:0!important}.ant-tabs-tabpane{padding-top:0!important}.ant-tabs-nav{margin-bottom:0!important;padding-left:12px!important}`}</style>
  );

  const gridRows = (rows: Array<[string, React.ReactNode]>) => (
    <div className="detail-grid">
      {rows.map(([label, value]) => (
        <div key={String(label)} className="detail-row">
          <span className="detail-label">{label}</span>
          <span className="detail-value">{value}</span>
        </div>
      ))}
    </div>
  );

  const emptyBox = (text: string, icon: React.ReactNode) => (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}>{icon}</div>
      <span style={{ color: textTertiary, fontSize: fontSizeLg }}>{text}</span>
    </div>
  );

  const coords = parseGisCoordinates(r);

  return (
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general',
          label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 3 }}>
              {detailGrid}
              {gridRows([
                ['Đơn vị quản lý', (() => {
                    const orgPath = resolveOrgFullPath(orgUnits, r.unitId);
                    if (!orgPath || orgPath.length === 0) return '—';
                    const levelColors = [textPrimary, textSecondary, textTertiary];
                    return (
                      <span>
                        {orgPath.map((n, i) => (
                          <span key={i} style={{ display: 'block', color: levelColors[Math.min(i, levelColors.length - 1)], fontWeight: fontWeightBold }}>{n}</span>
                        ))}
                      </span>
                    );
                  })()],
                ['Đơn vị khai thác', <span style={{ fontWeight: fontWeightBold }}>{orgName(r.operatingOrgId)}</span>],
                ['Mã nhà trạm', <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary }}>{r.code || '—'}</span>],
                ['Tên nhà trạm', <span style={{ fontWeight: fontWeightBold }}>{r.name || '—'}</span>],
                ['Thuộc cảng biển', r.portId ? (portMap.get(r.portId) || r.portId) : '—'],
                ['Thuộc luồng hàng hải', r.waterwayId ? (waterwayMap.get(r.waterwayId) || r.waterwayId) : '—'],
                ['Tuyến luồng hàng hải', r.waterwayRouteId ? (routeMap.get(r.waterwayRouteId) || r.waterwayRouteId) : '—'],
                ['Địa điểm (Tỉnh/Thành phố)', r.province || '—'],
                ['Địa điểm chi tiết', r.address || '—'],
                ['Thời điểm xây dựng', formatDate(r.constructionDate)],
                ['Tổng diện tích (m²)', r.totalArea != null ? r.totalArea : '—'],
                ['Diện tích sử dụng (m²)', r.usableArea != null ? r.usableArea : '—'],
                ['Số lượng nhân sự bố trí', r.staffCount != null ? r.staffCount : '—'],
                ['Năm bảo trì gần nhất', r.lastMaintenanceYear != null ? r.lastMaintenanceYear : '—'],
                ['Ghi chú', r.note || '—'],
                ['Tình trạng', (() => { const s = CONDITION_STYLE[r.condition || ''] || { color: textTertiary, label: r.condition || '—' }; return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s.color}15`, color: s.color }}>{s.label}</span>; })()],
                ['Trạng thái phê duyệt', statusBadge],
              ])}
              <div style={{ cursor: 'pointer', marginTop: 10, paddingLeft: 12 }} onClick={() => setSystemOpen(!systemOpen)}>
                <span style={{ color: systemOpen ? '#1677ff' : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{systemOpen ? '▼' : '▶'} Thông tin hệ thống</span>
              </div>
              {systemOpen && (
                <div style={{ marginTop: 4 }}>
                  {gridRows([
                    ['Người tạo', <span style={{ fontWeight: fontWeightBold }}>{userName(r.createdBy)}</span>],
                    ['Ngày tạo', formatDateTime(r.createdAt)],
                    ['Người cập nhật', <span style={{ fontWeight: fontWeightBold }}>{userName(r.updatedByName)}</span>],
                    ['Ngày cập nhật', formatDateTime(r.updatedAt)],
                    ['Người gửi phê duyệt', <span style={{ fontWeight: fontWeightBold }}>{userName(r.sentApprovedBy)}</span>],
                    ['Ngày gửi phê duyệt', formatDateTime(r.sentApprovedDate)],
                    ['Người phê duyệt cấp Cảng vụ/Chi cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level1ApprovedBy)}</span>],
                    ['Ngày phê duyệt cấp Cảng vụ/Chi cục', formatDateTime(r.level1ApprovedDate)],
                    ['Người phê duyệt cấp Cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level2ApprovedBy)}</span>],
                    ['Ngày phê duyệt cấp Cục', formatDateTime(r.level2ApprovedDate)],
                    ['Nội dung phê duyệt cấp Cảng vụ/Chi cục', r.level1ApprovalContent || '—'],
                    ['Nội dung phê duyệt cấp Cục', r.level2ApprovalContent || '—'],
                  ])}
                </div>
              )}
            </div>
          ),
        },
        {
          key: 'location',
          label: 'Thông tin vị trí',
          children: (
            <div style={{ paddingTop: 3 }}>
              {detailGrid}
              {gridRows([
                ['Loại đối tượng', r.objectType ? (GEO_MAP[r.objectType] || r.objectType) : '—'],
                ['Biểu tượng', (() => { const symId = r.icon || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span>; })(),],
                ['Hệ quy chiếu', r.coordinateSystem ? (COORD_MAP[r.coordinateSystem] || r.coordinateSystem) : '—'],
                ['Quy tắc hiển thị', r.displayFormat || '—'],
              ])}
              <div style={{ marginTop: spaceSm, padding: '0 12px' }}>
                <span style={detailLabelStyle}>Tọa độ GPS</span>
                <Table className="list-view-table" dataSource={coords.map((c, i) => ({ ...c, key: i, _idx: i }))} pagination={false} size="middle" bordered style={{ marginTop: spaceXs }}
                  locale={{ emptyText: <div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><EnvironmentOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có tọa độ</span></div> }}
                >
                  <Table.Column title="STT" key="stt" width={60} align="center"
                    render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{i + 1}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Vĩ độ (N)" key="lat" align="center"
                    render={(_: any, rec: any) => {
                      const dms = ddToDms(rec.lat);
                      return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly tabIndex={-1} style={{ flex: 1.2, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                    }}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, padding: '12px 12px' } })} />
                  <Table.Column title="Kinh độ (E)" key="lng" align="center"
                    render={(_: any, rec: any) => {
                      const dms = ddToDms(rec.lng);
                      return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly tabIndex={-1} style={{ flex: 1.2, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                    }}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, padding: '12px 12px' } })} />
                </Table>
              </div>
            </div>
          ),
        },
        {
          key: 'files',
          label: 'File đính kèm',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                <span style={detailLabelStyle}>File đính kèm</span>
              </div>
              <Table className="list-view-table" rowKey="key" dataSource={detailFiles.map((f, i) => ({ ...f, key: f.id, _idx: i }))} pagination={false} size="middle" bordered style={{ marginLeft: 12, marginRight: 12 }}
                locale={{ emptyText: emptyBox('Không có tài liệu đính kèm', <FileOutlined />) }}
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
          key: 'buoys',
          label: 'Danh sách phao tiêu',
          children: (
            <PagedTabTable
              title={<span style={detailLabelStyle}>Danh sách phao tiêu</span>}
              dataSource={detailBuoys}
              emptyText={(
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div>
                  <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Chưa có dữ liệu</span>
                </div>
              )}
              columns={(
                <>
                  <Table.Column title="Mã phao, tiêu" key="code" dataIndex="code" render={(v: string) => <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Tên phao, tiêu" key="name" dataIndex="name" render={(v: string, rec: any) => onViewBuoy ? <Button type="link" onClick={() => onViewBuoy(rec.id)} style={{ fontWeight: fontWeightBold, color: actionPrimary, padding: 0, height: 'auto' }}>{v || '—'}</Button> : <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Phân loại" key="classification" dataIndex="classification" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Phân loại phao" key="classificationBuoy" dataIndex="classificationBuoy" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Phân loại tiêu" key="classificationMark" dataIndex="classificationMark" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thao tác" key="actions" width={100} align="center"
                    render={(_: any, rec: any) => onViewBuoy ? (
                      <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: actionPrimary, fontSize: fontSizeMd }} onClick={() => onViewBuoy(rec.id)} />
                    ) : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                </>
              )}
            />
          ),
        },
        {
          key: 'operation',
          label: 'Thông tin vận hành khai thác',
          children: (
            <PagedTabTable
              title={<span style={detailLabelStyle}>Thông tin vận hành khai thác</span>}
              dataSource={(r.operationPlanCode || r.operationPlanName || r.operationStartDate || r.operationEndDate) ? [{ key: 'row', operationPlanCode: r.operationPlanCode || '—', operationPlanName: r.operationPlanName || '—', operationStartDate: r.operationStartDate || '—', operationEndDate: r.operationEndDate || '—' }] : []}
              emptyText={(
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div>
                  <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Chưa có dữ liệu</span>
                </div>
              )}
              columns={(
                <>
                  <Table.Column title="Mã kế hoạch" key="operationPlanCode" dataIndex="operationPlanCode"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Tên kế hoạch" key="operationPlanName" dataIndex="operationPlanName"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Ngày bắt đầu" key="operationStartDate" dataIndex="operationStartDate"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Ngày kết thúc" key="operationEndDate" dataIndex="operationEndDate"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
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
          key: 'maintenance',
          label: 'Thông tin bảo trì',
          children: (
            <PagedTabTable
              title={<span style={detailLabelStyle}>Thông tin bảo trì</span>}
              dataSource={(r.maintenancePlanCode || r.maintenancePlanName || r.maintenanceStartTime || r.maintenanceEndTime) ? [{ key: 'row', maintenancePlanCode: r.maintenancePlanCode || '—', maintenancePlanName: r.maintenancePlanName || '—', maintenanceStartTime: r.maintenanceStartTime || '—', maintenanceEndTime: r.maintenanceEndTime || '—' }] : []}
              emptyText={(
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div>
                  <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Chưa có dữ liệu</span>
                </div>
              )}
              columns={(
                <>
                  <Table.Column title="Mã kế hoạch" key="maintenancePlanCode" dataIndex="maintenancePlanCode"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Tên kế hoạch" key="maintenancePlanName" dataIndex="maintenancePlanName"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thời gian bắt đầu" key="maintenanceStartTime" dataIndex="maintenanceStartTime"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thời gian kết thúc" key="maintenanceEndTime" dataIndex="maintenanceEndTime"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
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
          key: 'incident',
          label: 'Thông tin sự cố',
          children: (
            <PagedTabTable
              title={<span style={detailLabelStyle}>Thông tin sự cố</span>}
              dataSource={(r.incidentCode || r.incidentType || r.incidentLocation || r.incidentTime) ? [{ key: 'row', incidentCode: r.incidentCode || '—', incidentType: r.incidentType || '—', incidentLocation: r.incidentLocation || '—', incidentTime: r.incidentTime || '—' }] : []}
              emptyText={(
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div>
                  <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Chưa có dữ liệu</span>
                </div>
              )}
              columns={(
                <>
                  <Table.Column title="Mã sự cố" key="incidentCode" dataIndex="incidentCode"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Loại sự cố" key="incidentType" dataIndex="incidentType"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Địa điểm" key="incidentLocation" dataIndex="incidentLocation"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thời gian" key="incidentTime" dataIndex="incidentTime"
                    render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
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
  );
}
