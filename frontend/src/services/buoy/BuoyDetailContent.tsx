// ── BuoyDetailContent — presentational detail body (giống BerthDetailContent) ─
// 4 Tabs: general (đầy đủ trường form + Collapse 'Thông tin hệ thống') / technical / gis / files.
// org/user name mapping comes from the page (orgUnits / userMap props) — no FE fetch.

import React, { useState } from 'react';
import { Table, Tabs, Space, InputNumber } from 'antd';
import { FileOutlined, ScheduleOutlined, ToolOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault, surfaceCard,
  actionPrimary, statusOperational, statusAttention, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceSm, spaceXs,
} from '../../tokens';
import {
  SHAPE_LABEL_MAP,
} from './schema';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import type { Buoy } from './types';

export interface BuoyDetailContentProps {
  selectedRecord: Buoy;
  orgUnits: Array<{ id: string; name: string }>;
  userMap: Map<string, string>;
  detailFiles: any[];
  buoyStatusBadge: (status: string) => { color: string; label: string };
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  ddToDms: (dd: number) => { d: number; m: number; s: number };
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss');
  } catch {
    return dateStr;
  }
}

function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY');
  } catch {
    return dateStr;
  }
}

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

// Parse tọa độ GPS: ưu tiên WKT (coordinates) — POINT/MULTIPOINT từ form Phao tiêu;
// fallback sang latitude/longitude (giống BerthDetailContent).
const parseGisCoordinates = (record: any): Array<{ lat: number; lng: number }> => {
  const wkt = record?.coordinates;
  const out: Array<{ lat: number; lng: number }> = [];
  if (wkt && typeof wkt === 'string' && wkt.trim()) {
    try {
      const mm = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)/);
      if (mm) mm[1].split('),(').forEach((pt: string) => {
        const [lng, lat] = pt.replace(/[()]/g, '').trim().split(/\s+/);
        if (!isNaN(Number(lat))) out.push({ lng: Number(lng), lat: Number(lat) });
      });
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

// Style badge Tình trạng giống bến cảng (operationalStatus pill)
const CONDITION_STYLE: Record<string, { color: string; label: string }> = {
  'Đang khai thác/vận hành': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  'Chưa khai thác/vận hành': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  'Dừng khai thác/vận hành': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

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
  const [systemOpen, setSystemOpen] = useState(true);
  const orgName = (id: string | undefined) =>
    id ? (orgUnits.find((o) => o.id === id)?.name || id) : '—';
  const userName = (id: number | string | undefined | null) =>
    id != null ? (userMap.get(String(id)) || String(id)) : '—';
  const provinceName = (id: number | undefined | null) =>
    id != null ? (VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(id))?.label || String(id)) : '—';
  const statusBadge = (() => {
    const b = buoyStatusBadge(r.status || '');
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

  return (
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 3 }}>
              {detailGrid}
              <div className="detail-grid">
                {[
                  ['Đơn vị quản lý', orgName(r.unitId)],
                  ['Thuộc nhà trạm QLVH phao, tiêu', r.buoyStationName || '—'],
                  ['Phân loại', r.classification || '—'],
                  ['Phân loại phao', r.classificationBuoy || '—'],
                  ['Phân loại tiêu', r.classificationMark || '—'],
                  ['Mã phao tiêu', <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary }}>{r.code || '—'}</span>],
                  ['Tên phao tiêu', <span style={{ fontWeight: fontWeightBold }}>{r.name || '—'}</span>],
                  ['Địa điểm (Tỉnh/TP)', provinceName(r.provinceId)],
                  ['Địa điểm chi tiết', r.locationDetail || '—'],
                  ['Hình dáng', r.shape ? (SHAPE_LABEL_MAP[r.shape] || r.shape) : '—'],
                  ['Kết cấu', r.structure || '—'],
                  ['Diện tích (m²)', r.area != null ? r.area : '—'],
                  ['Chiều cao thân phao (m)', r.bodyHeight != null ? r.bodyHeight : '—'],
                  ['Đường kính phao (m)', r.diameter != null ? r.diameter : '—'],
                  ['Đèn biển', r.beaconLight || '—'],
                  ['Chiều cao tháp đèn', r.towerHeight != null ? r.towerHeight : '—'],
                  ['Chiều cao tâm sáng (hải đồ)', r.lightHeight != null ? r.lightHeight : '—'],
                  ['Chủng loại đèn (Thiết bị báo hiệu)', r.lightModel || '—'],
                  ['Màu sắc bên ngoài của tháp đèn', r.towerColor || '—'],
                  ['Nguồn cung cấp năng lượng cho đèn', r.powerSupply || '—'],
                  ['Phạm vi chiếu sáng', r.range != null ? `${r.range} hải lý` : '—'],
                  ['Thời điểm đưa vào sử dụng', formatDateOnly(r.commissionedDate)],
                  ['Thời điểm sửa chữa gần nhất', formatDateOnly(r.lastRepairDate)],
                  ['Tình trạng', (() => { const s = CONDITION_STYLE[r.condition || ''] || { color: textTertiary, label: r.condition || '—' }; return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s.color}15`, color: s.color }}>{s.label}</span>; })()],
                  ['Trạng thái', statusBadge],
                ].map(([label, value]) => (
                  <div key={String(label)} className="detail-row">
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
                    ['Người tạo', userName(r.createdBy)],
                    ['Ngày tạo', formatDate(r.createdAt)],
                    ['Người cập nhật', userName(r.updatedBy)],
                    ['Ngày cập nhật', formatDate(r.updatedAt)],
                    ['Người gửi phê duyệt', userName(r.submittedForApprovalBy)],
                    ['Ngày gửi phê duyệt', formatDate(r.submittedForApprovalAt)],
                    ['Người phê duyệt cấp Cảng vụ/Chi cục', userName(r.level1ApprovedBy)],
                    ['Ngày phê duyệt cấp Cảng vụ/Chi cục', formatDate(r.level1ApprovedDate)],
                    ['Người phê duyệt cấp Cục', userName(r.level2ApprovedBy)],
                    ['Ngày phê duyệt cấp Cục', formatDate(r.level2ApprovedDate)],
                    ['Nội dung phê duyệt cấp Cảng vụ/Chi cục', r.level1ApprovalContent || '—'],
                    ['Nội dung phê duyệt cấp Cục', r.level2ApprovalContent || '—'],
                    ['Lý do từ chối', r.rejectionReason || '—'],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="detail-row">
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
          key: 'light', label: 'Đặc tính ánh sáng',
          children: (
            <div style={{ paddingTop: 3 }}>
              {detailGrid}
              {gridRows([
                ['Màu sắc', r.lightColor || r.color || '—'],
                ['Kiểu chớp', r.flashType || '—'],
                ['Chu kỳ', r.period || '—'],
              ])}
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
                  ['Biểu tượng bản đồ', (() => { const symId = r.mapSymbolId || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span>; })(),],
                  ['Hệ quy chiếu', r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : r.coordinateSystem || '—'],
                  ['Quy tắc hiển thị', ((r as any).geometryType || (r as any).coordinates || r.latitude != null || r.longitude != null) ? 'Độ, phút, giây (DMS)' : '—'],
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
                  if (pts.length === 0) return <div style={{ color: textTertiary, fontSize: fontSizeMd, marginTop: spaceXs }}>Không có tọa độ</div>;
                  return (
                    <Table className="list-view-table" dataSource={pts.map((p, i) => ({ ...p, key: i }))} pagination={false} size="middle" bordered style={{ marginTop: spaceXs }}>
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
          key: 'operation', label: 'Thông tin vận hành khai thác',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                <span style={detailLabelStyle}>Thông tin vận hành khai thác</span>
              </div>
              <Table className="list-view-table" rowKey="key" dataSource={(r.operationPlanCode || r.operationPlanName || r.operationStartDate || r.operationEndDate) ? [{ key: 'row', operationPlanCode: r.operationPlanCode || '—', operationPlanName: r.operationPlanName || '—', operationStartDate: r.operationStartDate || '—', operationEndDate: r.operationEndDate || '—' }] : []} pagination={false} size="middle" bordered style={{ marginLeft: 12, marginRight: 12 }}
                locale={{ emptyText: emptyBox('Không tìm thấy thông tin vận hành khai thác nào phù hợp', <ScheduleOutlined />) }}
              >
                <Table.Column title="STT" key="stt" width={60} align="center"
                  render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Mã kế hoạch" key="operationPlanCode" dataIndex="operationPlanCode" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Tên kế hoạch" key="operationPlanName" dataIndex="operationPlanName" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Ngày bắt đầu" key="operationStartDate" dataIndex="operationStartDate" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Ngày kết thúc" key="operationEndDate" dataIndex="operationEndDate" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              </Table>
            </div>
          ),
        },
        {
          key: 'maintenance', label: 'Thông tin bảo trì',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                <span style={detailLabelStyle}>Thông tin bảo trì</span>
              </div>
              <Table className="list-view-table" rowKey="key" dataSource={(r.maintenancePlanCode || r.maintenancePlanName || r.maintenanceStartTime || r.maintenanceEndTime) ? [{ key: 'row', maintenancePlanCode: r.maintenancePlanCode || '—', maintenancePlanName: r.maintenancePlanName || '—', maintenanceStartTime: r.maintenanceStartTime || '—', maintenanceEndTime: r.maintenanceEndTime || '—' }] : []} pagination={false} size="middle" bordered style={{ marginLeft: 12, marginRight: 12 }}
                locale={{ emptyText: emptyBox('Không tìm thấy thông tin bảo trì nào phù hợp', <ToolOutlined />) }}
              >
                <Table.Column title="STT" key="stt" width={60} align="center"
                  render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Mã kế hoạch" key="maintenancePlanCode" dataIndex="maintenancePlanCode" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Tên kế hoạch" key="maintenancePlanName" dataIndex="maintenancePlanName" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Thời gian bắt đầu" key="maintenanceStartTime" dataIndex="maintenanceStartTime" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Thời gian kết thúc" key="maintenanceEndTime" dataIndex="maintenanceEndTime" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              </Table>
            </div>
          ),
        },
        {
          key: 'incident', label: 'Thông tin sự cố',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                <span style={detailLabelStyle}>Thông tin sự cố</span>
              </div>
              <Table className="list-view-table" rowKey="key" dataSource={(r.incidentCode || r.incidentType || r.incidentLocation || r.incidentTime) ? [{ key: 'row', incidentCode: r.incidentCode || '—', incidentType: r.incidentType || '—', incidentLocation: r.incidentLocation || '—', incidentTime: r.incidentTime || '—' }] : []} pagination={false} size="middle" bordered style={{ marginLeft: 12, marginRight: 12 }}
                locale={{ emptyText: emptyBox('Không tìm thấy thông tin sự cố nào phù hợp', <WarningOutlined />) }}
              >
                <Table.Column title="STT" key="stt" width={60} align="center"
                  render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Mã sự cố" key="incidentCode" dataIndex="incidentCode" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Loại sự cố" key="incidentType" dataIndex="incidentType" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Địa điểm" key="incidentLocation" dataIndex="incidentLocation" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Thời gian" key="incidentTime" dataIndex="incidentTime" render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              </Table>
            </div>
          ),
        },
      ]}
    />
  );
}
