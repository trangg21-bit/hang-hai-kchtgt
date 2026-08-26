import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Table, Space, InputNumber, Collapse, Drawer, Button, Row, Col } from 'antd';
import { FileOutlined, EyeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../theme';
import PagedTable from '../../components/list-view/PagedTable';
import {
  textPrimary, textSecondary, textTertiary, borderDefault, surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceSm, spaceMd, spaceXs, actionPrimary, radiusMd, radiusPill,
  statusOperational, statusAttention, statusCritical,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, primaryButtonStyle,
} from '../../tokens';
import type { Anchorage } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';
import { resolveOrgFullPath } from '../../components/org-unit';
import api from '../../services/api';

export interface AnchorageDetailContentProps {
  selectedRecord: Anchorage;
  orgMap: Map<string, string>;
  organizations?: Array<{ id: string; name: string; parentId?: string }>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  portOptions: Array<{ value: string; label: string }>;
  userMap: Map<string, string>;
  detailFiles: any[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  waterwayMap?: Map<string, string>;
  operationPlanList?: any[];
  maintenancePlanList?: any[];
  incidentList?: any[];
}

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };
const detailValueBoxStyle: React.CSSProperties = { borderBottom: `1px solid ${borderDefault}`, padding: '10px 0', fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceMd };

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
        const pm = wkt.match(/POINT\s*\([\d.\-]+\s+([\d.\-]+)\)/);
        if (pm) out.push({ lng: Number(pm[1]), lat: Number(pm[2]) });
      }
    } catch { /* ignore */ }
  }
  if (out.length === 0 && record?.latitude != null && record?.longitude != null) {
    out.push({ lat: Number(record.latitude), lng: Number(record.longitude) });
  }
  return out;
};

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—');

export default function AnchorageDetailContent({
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
  waterwayMap = new Map<string, string>(),
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
}: AnchorageDetailContentProps) {
  const r = selectedRecord;
  const [systemOpen, setSystemOpen] = useState(true);
  const [approvalLogs, setApprovalLogs] = useState<any[]>([]);
  const [changeHistory, setChangeHistory] = useState<any[]>([]);
  const [viewingWaterArea, setViewingWaterArea] = useState<any | null>(null);
  const [, setLoading] = useState(true);

  const loadDetailData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/anchorage/${selectedRecord.id}/history`);
      const data = res.data?.data || res.data || {};
      setChangeHistory(data.changeHistory || []);
      setApprovalLogs(data.approvalLog || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedRecord.id]);

  useEffect(() => {
    loadDetailData();
  }, [loadDetailData]);

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
                  ['Mã khu neo đậu', <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary }}>{r.anchorageCode || '—'}</span>],
                  ['Tên khu neo đậu', <span style={{ fontWeight: fontWeightBold }}>{r.anchorageName || '—'}</span>],
                  ['Cấp bảo mật', r.securityLevel != null ? ({ 0: 'Công khai', 1: 'Nội bộ', 2: 'Rất bí mật' }[r.securityLevel] || '—') : '—'],
                  ['Thuộc luồng hàng hải', waterwayMap.get(r.navigationChannelId || '') || r.navigationChannelId || '—'],
                  ['Thuộc bến phao', r.buoyStationId || '—'],
                  ['Địa điểm (Tỉnh/Thành Phố)', r.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '—' : '—'],
                  ['Địa điểm chi tiết', r.detailedLocation || '—'],
                  ['Hình dạng', r.shapeDescription || '—'],
                  ['Tình trạng', (() => { const s = r.operationalStatus; const m: Record<string,{color:string;label:string}> = { OPERATIONAL:{color:statusOperational,label:'Đang khai thác/Vận hành'}, NOT_YET_OPERATIONAL:{color:statusAttention,label:'Chưa khai thác/Vận hành'}, SUSPENDED:{color:statusCritical,label:'Dừng khai thác/Vận hành'} }; const b = s && m[s]; return b ? <span style={{ display:'inline-flex',padding:'2px 10px',borderRadius:999,fontSize:fontSizeMd,fontWeight:fontWeightMedium,background:`${b.color}15`,color:b.color }}>{b.label}</span> : '—'; })(),],
                  ['Trạng thái', r.approvalStatus && approvalStyleMap[r.approvalStatus] ? <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${approvalStyleMap[r.approvalStatus].color}15`, color: approvalStyleMap[r.approvalStatus].color }}>{approvalStyleMap[r.approvalStatus].label}</span> : '—'],
                  ['Diện tích (ha)', r.area != null ? Number(r.area).toLocaleString('vi-VN') : '—'],
                  ['Độ sâu khu nước theo thiết kế (m)', r.designWaterDepth != null ? Number(r.designWaterDepth).toLocaleString('vi-VN') : '—'],
                  ['Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)', r.currentWaterDepth != null ? Number(r.currentWaterDepth).toLocaleString('vi-VN') : '—'],
                  ['Cao độ đáy bến thiết kế', r.bottomElevationDesign != null ? Number(r.bottomElevationDesign).toLocaleString('vi-VN') : '—'],
                  ['Cỡ tàu khai thác theo công bố (DWT)', r.maxVesselDWT != null ? Number(r.maxVesselDWT).toLocaleString('vi-VN') : '—'],
                  ['Số lượng khu neo đậu đang khai thác', r.activeAnchorageCount || '—'],
                  ['Số lượng khu neo đậu đã công bố', r.publishedAnchorageCount || '—'],
                  ['Số lượng khu neo đậu đang được thỏa thuận đầu tư xây dựng', r.underInvestmentAnchorageCount || '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
                <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Ghi chú</span>
                  <span className="detail-value">{r.remarks || '—'}</span>
                </div>
              </div>
              <div style={{ cursor: 'pointer', marginTop: 10, paddingLeft: 12 }} onClick={() => setSystemOpen(!systemOpen)}>
                <span style={{ color: systemOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{systemOpen ? '▼' : '▶'} Thông tin hệ thống</span>
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
                  ['Quyết định công bố', r.publicDecision || '—'],
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
                  ['Loại đối tượng', (() => { const gt = (r as any).geometryType || ''; const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }; return m[gt] || gt || '—'; })(),],
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
              <div style={{ marginTop: spaceMd, padding: '0 12px' }}>
                <span style={detailLabelStyle}>Tọa độ GPS</span>
                {(() => {
                  const pts = parseGisCoordinates(r);
                  return (
                    <PagedTable dataSource={pts.map((p) => ({ ...p }))}
                      emptyText={<div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><EnvironmentOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có tọa độ</span></div>}
                    >
                      <Table.Column title="Vĩ độ (N)" key="lat" align="center"
                        render={(_: any, rec: any) => {
                          const dms = ddToDms(rec.lat);
                          return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly tabIndex={-1} style={{ flex: 1, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly tabIndex={-1} style={{ flex: 1, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly tabIndex={-1} style={{ flex: 1.2, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                        }}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                      <Table.Column title="Kinh độ (E)" key="lng" align="center"
                        render={(_: any, rec: any) => {
                          const dms = ddToDms(rec.lng);
                          return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly tabIndex={-1} style={{ flex: 1, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly tabIndex={-1} style={{ flex: 1, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly tabIndex={-1} style={{ flex: 1.2, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                        }}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                    </PagedTable>
                  );
                })()}
              </div>
            </div>
          ),
        },
        {
          key: 'mooring', label: 'Thông tin khu nước neo buộc tàu',
          children: (
            <div style={{ paddingTop: 16 }}>
              <div style={{ marginBottom: spaceMd }}>
                <span style={detailLabelStyle}>Thông tin khu nước neo buộc tàu</span>
              </div>
              {(r.mooringWaterAreas || []).length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                  <span style={{ fontSize: fontSizeMd, color: textTertiary }}>Chưa có khu nước neo buộc tàu nào.</span>
                </div>
              ) : (
                <PagedTable dataSource={(r.mooringWaterAreas || []).map((wa, i) => ({ ...wa, key: i }))} tableProps={{ scroll: { x: 600 } }}>
                  <Table.Column title="Phạm vi khu nước neo buộc tàu" key="description" dataIndex="description" render={(d?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{d || '—'}</span>} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Thao tác" key="actions" width={100} align="center" render={(_: any, rec: any) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewingWaterArea(rec)} />} onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
                </PagedTable>
              )}
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
              <PagedTable dataSource={detailFiles.map((f) => ({ ...f }))}
                emptyText={(
                  <div style={{ padding: '32px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div>
                    <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có tài liệu đính kèm</span>
                  </div>
                )}
              >
                <Table.Column title="Tên file" key="name" dataIndex="fileName" align="center"
                  render={(name: string) => <div style={{ textAlign: 'left', fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</div>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              </PagedTable>
            </div>
          ),
        },
        {
          key: 'operation', label: 'Thông tin vận hành khai thác',
          children: (
            <div style={{ paddingTop: 3 }}>
              <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Thông tin vận hành khai thác</span>
              <PagedTable dataSource={operationPlanList} emptyText={<div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Chưa có dữ liệu</span></div>}>
                <Table.Column title="Mã kế hoạch" key="code" dataIndex="planCode" align="center"
                  render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.code || '—'}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Tên kế hoạch" key="name" dataIndex="planName" align="center"
                  render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.name || '—'}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Ngày bắt đầu" key="start" dataIndex="startDate" align="center"
                  render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(v || rec.startTime || rec.start || null)}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Ngày kết thúc" key="end" dataIndex="endDate" align="center"
                  render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(v || rec.endTime || rec.end || null)}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              </PagedTable>
            </div>
          ),
        },
        {
          key: 'maintenance', label: 'Thông tin bảo trì',
          children: (
            <div style={{ paddingTop: 3 }}>
              <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Thông tin bảo trì</span>
              <PagedTable dataSource={maintenancePlanList} emptyText={<div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Chưa có dữ liệu</span></div>}>
                <Table.Column title="Mã kế hoạch" key="code" dataIndex="planCode" align="center"
                  render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.code || '—'}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Tên kế hoạch" key="name" dataIndex="planName" align="center"
                  render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.name || '—'}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Thời gian bắt đầu" key="start" dataIndex="startTime" align="center"
                  render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(v || rec.start || rec.startDate || null)}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Thời gian kết thúc" key="end" dataIndex="endTime" align="center"
                  render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(v || rec.end || rec.endDate || null)}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              </PagedTable>
            </div>
          ),
        },
        {
          key: 'incident', label: 'Thông tin sự cố',
          children: (
            <div style={{ paddingTop: 3 }}>
              <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Thông tin sự cố</span>
              <PagedTable dataSource={incidentList} emptyText={<div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Chưa có dữ liệu</span></div>}>
                <Table.Column title="Mã sự cố" key="code" dataIndex="incidentCode" align="center"
                  render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.code || '—'}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Loại sự cố" key="type" dataIndex="incidentType" align="center"
                  render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || rec.type || '—'}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Địa điểm" key="location" dataIndex="location" align="center"
                  render={(v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Thời gian" key="time" dataIndex="incidentTime" align="center"
                  render={(v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(v || rec.time || null)}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              </PagedTable>
            </div>
          ),
        },
        ...(approvalLogs.length > 0 ? [{
          key: 'approval', label: `Phê duyệt (${approvalLogs.length})`,
          children: (
            <Collapse defaultActiveKey={[0]} style={{ margin: spaceMd }}>
              {approvalLogs.map((log, idx) => (
                <Collapse.Panel key={idx} header={`Lý ${idx + 1}`}>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Cấp phê duyệt</div>
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{log.level || '—'}</span>
                  </div>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Người phê duyệt</div>
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{userMap.get(log.approvedBy) || log.approvedBy || '—'}</span>
                  </div>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Thời gian</div>
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(log.approvedAt)}</span>
                  </div>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Nội dung</div>
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{log.content || '—'}</span>
                  </div>
                  {log.rejectionReason && (
                    <div style={{ marginBottom: spaceMd }}>
                      <div style={{ ...detailLabelStyle, marginBottom: spaceSm, color: statusCritical }}>Lý do từ chối</div>
                      <span style={{ fontSize: fontSizeMd, color: statusCritical }}>{log.rejectionReason}</span>
                    </div>
                  )}
                </Collapse.Panel>
              ))}
            </Collapse>
          ),
        }] : []),
        ...(changeHistory.length > 0 ? [{
          key: 'history', label: `Thay đổi (${changeHistory.length})`,
          children: (
            <Collapse defaultActiveKey={[0]} style={{ margin: spaceMd }}>
              {changeHistory.map((change, idx) => (
                <Collapse.Panel key={idx} header={`Thay đổi ${idx + 1}`}>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Trường thay đổi</div>
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{change.fieldName || '—'}</span>
                  </div>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Giá trị cũ</div>
                    <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{change.oldValue || '—'}</span>
                  </div>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Giá trị mới</div>
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{change.newValue || '—'}</span>
                  </div>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Thời gian</div>
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(change.changedAt)}</span>
                  </div>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Người thay đổi</div>
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{userMap.get(change.changedBy) || change.changedBy || '—'}</span>
                  </div>
                </Collapse.Panel>
              ))}
            </Collapse>
          ),
        }] : []),
      ]}
    />
      <Drawer
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chi tiết thông tin khu nước neo buộc tàu</span>}
        width={900}
        placement="right"
        open={!!viewingWaterArea}
        onClose={() => setViewingWaterArea(null)}
        destroyOnHidden
        push={false}
        closable={false}
        extra={<Button type="text" onClick={() => setViewingWaterArea(null)} style={drawerCloseBtnStyle}>✕</Button>}
        styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }}
      >
        {viewingWaterArea && (
          <>
            <div style={{ paddingTop: 3 }}>
              <div className="detail-grid">
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', padding: '10px 12px', borderBottom: `1px solid ${borderDefault}` }}>
                  <span style={{ width: 260, flexShrink: 0, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Phạm vi khu nước neo buộc tàu:</span>
                  <span style={{ color: textPrimary, fontSize: fontSizeMd, flex: 1, overflowWrap: 'anywhere' }}>{viewingWaterArea.description || '—'}</span>
                </div>
              </div>
              <div style={{ marginBottom: spaceMd, marginTop: spaceMd, paddingLeft: 12 }}>
                <span style={{ ...drawerTitleStyle, fontSize: 16 }}>Vị trí cụ thể điểm neo</span>
              </div>
              <div className="detail-grid">
                {[
                  ['Loại đối tượng', (() => { const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }; return viewingWaterArea.geometryType ? m[viewingWaterArea.geometryType] || viewingWaterArea.geometryType : '—'; })(),],
                  ['Biểu tượng', (() => { const symName = symbolMap.get(viewingWaterArea.mapSymbolId || '') || viewingWaterArea.mapSymbolId || '—'; const symImg = symbolImageMap.get(viewingWaterArea.mapSymbolId || ''); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span>; })(),],
                  ['Hệ quy chiếu', viewingWaterArea.coordinateSystem === 1 ? 'WGS-84' : viewingWaterArea.coordinateSystem === 2 ? 'VN-2000' : viewingWaterArea.coordinateSystem || '—'],
                  ['Quy tắc hiển thị', viewingWaterArea.displayRule || '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="detail-row"><span className="detail-label">{label}</span><span className="detail-value">{value}</span></div>
                ))}
              </div>
              <div style={{ marginTop: spaceSm, padding: '0 12px' }}>
                <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Tọa độ điểm neo</span>
                <PagedTable dataSource={(viewingWaterArea.anchorPoints || []).map((p: any, i: number) => ({ ...p, key: i }))} tableProps={{ tableLayout: 'fixed' }} emptyText={<div style={{ padding: '32px 0', textAlign: 'center' }}><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có điểm neo</span></div>}>
                  <Table.Column title="Tên điểm neo" key="name" dataIndex="name" width={350} align="center" render={(name?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={name || '—'}>{name || '—'}</span>} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Vĩ độ (N)" key="lat" width={205} align="center" render={(_: any, rec: any) => { if (rec.latitude == null) return '—'; const d = ddToDms(rec.latitude); return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={d.d} readOnly tabIndex={-1} style={{ flex: 1, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={d.m} readOnly tabIndex={-1} style={{ flex: 1, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={d.s} readOnly tabIndex={-1} style={{ flex: 1.2, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>; }} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Kinh độ (E)" key="lng" width={205} align="center" render={(_: any, rec: any) => { if (rec.longitude == null) return '—'; const d = ddToDms(rec.longitude); return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={d.d} readOnly tabIndex={-1} style={{ flex: 1, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={d.m} readOnly tabIndex={-1} style={{ flex: 1, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={d.s} readOnly tabIndex={-1} style={{ flex: 1.2, minWidth: 0, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>; }} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                </PagedTable>
              </div>
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}
