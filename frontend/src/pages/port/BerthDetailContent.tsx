import React, { useState } from 'react';
import { Tabs, Table, Space, InputNumber, Collapse } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import { colors } from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault, surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceSm, spaceMd, spaceXs,
} from '../../tokens';
import type { Berth } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';

export interface BerthDetailContentProps {
  selectedRecord: Berth;
  orgMap: Map<string, string>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  portOptions: Array<{ value: string; label: string }>;
  userMap: Map<string, string>;
  detailFiles: any[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  structureTypeOptions: Array<{ value: number; label: string }>;
}

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

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
  symbolMap,
  symbolImageMap,
  portOptions,
  userMap,
  detailFiles,
  ddToDms,
  approvalStyleMap,
  structureTypeOptions,
}: BerthDetailContentProps) {
  const r = selectedRecord;
  const [systemOpen, setSystemOpen] = useState(true);
  return (
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 3 }}>
              <style>{`.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}.detail-row{display:flex;padding:10px 12px;border-bottom:1px solid ${borderDefault}}.detail-label{width:200px;flex-shrink:0;color:${colors.sidebarBg};font-weight:${fontWeightBold};font-size:${fontSizeMd}px}.detail-label::after{content:':';margin-left:2px}.detail-value{color:${textPrimary};font-size:${fontSizeMd}px;flex:1}.detail-value .ant-tag{margin-left:-6px!important}.system-collapse .ant-collapse-header{gap:0!important;padding:4px 0!important}.system-collapse .ant-collapse-content-box{padding:0!important}.ant-tabs-content-holder{padding-top:0!important}.ant-tabs-tabpane{padding-top:0!important}.ant-tabs-nav{margin-bottom:0!important;padding-left:12px!important}`}</style>
              <div className="detail-grid">
                {[
                  ['Đơn vị quản lý', orgMap.get(r.orgUnitId || '') || r.orgUnitId || '—'],
                  ['Cảng biển', portOptions.find(o => o.value === r.portId)?.label || r.portId || '—'],
                  ['Mã bến cảng', <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: '#1677ff15', color: '#1677ff' }}>{r.berthCode || '—'}</span>],
                  ['Tên bến cảng', r.berthName || '—'],
                  ['Tuyến đường thủy', r.waterway || '—'],
                  ['Đơn vị vận hành', r.operator || '—'],
                  ['Tỉnh/Thành phố', r.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '—' : '—'],
                  ['Địa điểm chi tiết', r.detailedLocation || '—'],
                  ['Loại kết cấu', structureTypeOptions.find(o => o.value === r.structureType)?.label || r.structureType || '—'],
                  ['Công năng khai thác', r.operationalFunction || '—'],
                  ['Chiều dài (m)', r.length != null ? r.length : '—'],
                  ['Chiều rộng (m)', r.width != null ? r.width : '—'],
                  ['Độ sâu luồng (m)', r.channelDepth != null ? r.channelDepth : '—'],
                  ['Tổng diện tích (ha)', r.totalArea != null ? r.totalArea : '—'],
                  ['Năng lực thiết kế', r.designThroughput != null ? `${r.designThroughput} tấn/năm` : '—'],
                  ['Năng lực hiện tại', r.currentThroughput != null ? `${r.currentThroughput} tấn/năm` : '—'],
                  ['Năng lực quy hoạch', r.plannedThroughput != null ? `${r.plannedThroughput} tấn/năm` : '—'],
                  ['Sản lượng gần nhất', r.latestCargoVolume != null ? `${r.latestCargoVolume} tấn/năm` : '—'],
                  ['Cỡ tàu tối đa (DWT)', r.maxVesselSize != null ? r.maxVesselSize : '—'],
                  ['Tình trạng', (() => { const s = r.operationalStatus; const m: Record<string,{color:string;label:string}> = { OPERATIONAL:{color:'#1BAF7A',label:'Đang khai thác/Vận hành'}, NOT_YET_OPERATIONAL:{color:'#FA8C16',label:'Chưa khai thác/Vận hành'}, SUSPENDED:{color:'#F5222D',label:'Dừng khai thác/Vận hành'} }; const b = s && m[s]; return b ? <span style={{ display:'inline-flex',padding:'2px 10px',borderRadius:999,fontSize:fontSizeMd,fontWeight:fontWeightMedium,background:`${b.color}15`,color:b.color }}>{b.label}</span> : '—'; })(),],
                  ['Trạng thái', r.approvalStatus && approvalStyleMap[r.approvalStatus] ? <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${approvalStyleMap[r.approvalStatus].color}15`, color: approvalStyleMap[r.approvalStatus].color }}>{approvalStyleMap[r.approvalStatus].label}</span> : '—'],
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
                    ['Người tạo', userMap.get(r.createdBy || '') || r.createdBy || '—'],
                    ['Ngày tạo', r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '—'],
                    ['Người cập nhật', userMap.get(r.updatedBy || '') || r.updatedBy || '—'],
                    ['Ngày cập nhật', r.updatedAt ? new Date(r.updatedAt).toLocaleString('vi-VN') : '—'],
                    ['Người gửi phê duyệt', userMap.get(r.submittedForApprovalBy || '') || r.submittedForApprovalBy || '—'],
                    ['Ngày gửi phê duyệt', r.submittedForApprovalAt ? new Date(r.submittedForApprovalAt).toLocaleString('vi-VN') : '—'],
                    ['Người duyệt Cảng vụ', userMap.get(r.portAuthorityApprovedBy || '') || r.portAuthorityApprovedBy || '—'],
                    ['Ngày duyệt Cảng vụ', r.portAuthorityApprovedAt ? new Date(r.portAuthorityApprovedAt).toLocaleString('vi-VN') : '—'],
                    ['Người duyệt Cục', userMap.get(r.departmentApprovedBy || '') || r.departmentApprovedBy || '—'],
                    ['Ngày duyệt Cục', r.departmentApprovedAt ? new Date(r.departmentApprovedAt).toLocaleString('vi-VN') : '—'],
                    ['Lý do từ chối', r.rejectionReason || '—'],
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
                  ['Thời điểm công bố', r.openingAnnouncementDate ? new Date(r.openingAnnouncementDate).toLocaleString('vi-VN') : '—'],
                  ['Quyết định công bố', r.openingDecision || '—'],
                  ['Văn bản thỏa thuận đầu tư', r.investmentAgreement || '—'],
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
                  ['Biểu tượng bản đồ', (() => { const symId = r.mapSymbolId || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display:'inline-flex',alignItems:'center',gap:8 }}>{symImg ? <img src={symImg} alt="" style={{ width:24,height:24,objectFit:'contain' }} /> : null}{symName}</span>; })(),],
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
      ]}
    />
  );
}
