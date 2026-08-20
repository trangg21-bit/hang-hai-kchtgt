import React, { useState } from 'react';
import { Tabs, Table, Space, InputNumber } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault, surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold, fontWeightMedium, spaceSm,
  statusOperational, statusAttention, statusCritical, actionPrimary,
} from '../../tokens';
import type { DryPort } from '../../types/port';

export interface DryPortDetailContentProps {
  selectedRecord: DryPort;
  orgMap: Map<string, string>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  userMap: Map<string, string>;
  detailFiles: any[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  provinceName: (provinceId: number | null | undefined) => string;
  approvalStyleMap: Record<string, { color: string; label: string }>;
}

const COORD_SYS_LABELS: Record<number, string> = { 1: 'WGS-84', 2: 'VN-2000' };

// Parse tọa độ GPS: ưu tiên WKT (coordinates) từ backend — hỗ trợ POINT/MULTIPOINT/LINESTRING/POLYGON;
// fallback sang latitude/longitude (giống BerthDetailContent / PortDetailContent).
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

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

export default function DryPortDetailContent({
  selectedRecord: r,
  orgMap,
  symbolMap,
  symbolImageMap,
  userMap,
  detailFiles,
  ddToDms,
  provinceName,
  approvalStyleMap,
}: DryPortDetailContentProps) {
  const [systemOpen, setSystemOpen] = useState(true);
  const approvalLabel = approvalStyleMap[r.approvalStatus || '']?.label || r.approvalStatus || '—';

  return (
    <>
      <style>{`.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; } .detail-row { display: flex; padding: 10px 12px; border-bottom: 1px solid ${borderDefault}; } .detail-label { width: 200px; flex-shrink: 0; color: ${colors.sidebarBg}; font-weight: ${fontWeightBold}; font-size: ${fontSizeMd}px; } .detail-label::after { content: ':'; margin-left: 2px; } .detail-value { color: ${textPrimary}; font-size: ${fontSizeMd}px; flex: 1; } .ant-tabs-content-holder{padding-top:0!important}.ant-tabs-tabpane{padding-top:0!important}.ant-tabs-nav{margin-bottom:0!important;padding-left:12px!important}`}</style>
      <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
        items={[
          {
            key: 'general', label: 'Thông tin chung',
            children: (
              <div style={{ paddingTop: 3 }}>
                <div className="detail-grid">
                  {[
                    ['Mã cảng cạn', <span key="dryPortCode" style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: '#1677ff15', color: '#1677ff' }}>{r.dryPortCode || '—'}</span>],
                    ['Tên cảng cạn', r.dryPortName || '—'],
                    ['Đơn vị quản lý', (r as any).orgUnitName || orgMap.get(r.orgUnitId || '')?.split(' - ').pop() || r.orgUnitId || '—'],
                    ['Đơn vị khai thác', r.operatingUnit || '—'],
                    ['Khu vực', r.region || '—'],
                    ['Địa điểm (Tỉnh/Thành phố)', provinceName(r.provinceId)],
                    ['Địa điểm chi tiết', r.detailedLocation || '—'],
                    ['Hành lang vận tải', r.transportCorridor || '—'],
                    ['Phương thức kết nối giao thông với cảng', r.connectionMode || '—'],
                    ['Công suất khai thác', r.teuCapacity?.toLocaleString('vi-VN') || '—'],
                    ['Tổng diện tích cảng (m2)', r.area?.toLocaleString('vi-VN') || '—'],
                    ['Diện tích kho (m2)', r.warehouseArea?.toLocaleString('vi-VN') || '—'],
                    ['Diện tích bãi (m2)', r.yardArea?.toLocaleString('vi-VN') || '—'],
                    ['Ghi chú', r.remarks || '—'],
                    ['Tình trạng', (() => {
                      const opMap: Record<string, { color: string; label: string }> = {
                        OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/Vận hành' },
                        NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/Vận hành' },
                        SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/Vận hành' },
                      };
                      const b = (r as any).operationalStatus && opMap[(r as any).operationalStatus]
                        ? opMap[(r as any).operationalStatus]
                        : (r.portStatus === 1 ? opMap.OPERATIONAL : opMap.NOT_YET_OPERATIONAL);
                      return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${b.color}15`, color: b.color }}>{b.label}</span>;
                    })()],
                    ['Trạng thái', (() => { const b = approvalStyleMap[r.approvalStatus || '']; return b ? <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${b.color}15`, color: b.color }}>{b.label}</span> : approvalLabel; })(),],
                  ].map(([label, value], i) => (
                    <div key={i} className="detail-row">
                      <span className="detail-label">{label}</span>
                      <span className="detail-value">{value}</span>
                    </div>
                  ))}
                  </div>
                  <div style={{ cursor: 'pointer', marginTop: 10, paddingLeft: 12 }} onClick={() => setSystemOpen(!systemOpen)}>
                    <span style={{ color: systemOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{systemOpen ? '▼' : '▶'} Thông tin hệ thống</span>
                  </div>
                  {systemOpen && (
                    <div className="detail-grid" style={{ marginTop: 4 }}>
                      {[
                        ['Người tạo', userMap.get(r.createdBy || '') || r.createdBy || '—'],
                        ['Ngày tạo', r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '—'],
                        ['Người cập nhật', userMap.get(r.updatedBy || '') || r.updatedBy || '—'],
                        ['Ngày cập nhật', r.updatedAt ? new Date(r.updatedAt).toLocaleString('vi-VN') : '—'],
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
              key: 'announcement', label: 'Thời điểm công bố đưa vào sử dụng',
            children: (
              <div style={{ paddingTop: 3 }}>
                <div className="detail-grid">
                  {[
                    ['Quyết định công bố số', r.announcementDecisionNumber || '—'],
                    ['Ngày ra quyết định công bố', r.announcementDecisionDate ? dayjs(r.announcementDecisionDate).format('DD/MM/YYYY') : '—'],
                    ['Đơn vị ra quyết định công bố', r.announcementOrg || '—'],
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
            key: 'location', label: 'Thông tin vị trí',
            children: (
              <div style={{ paddingTop: 3 }}>
                <div className="detail-grid">
                  {[
                    ['Loại đối tượng', r.geometryType === 'POINT' ? 'Đối tượng điểm' : r.geometryType === 'LINE' ? 'Đối tượng đường' : r.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '—'],
                    ['Biểu tượng bản đồ', (() => { const symId = r.mapSymbolId || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span>; })()],
                    ['Hệ quy chiếu', COORD_SYS_LABELS[r.coordinateSystem || 0] || r.coordinateSystem || '—'],
                    ['Quy tắc hiển thị', (r.geometryType || r.coordinates) ? 'Độ, phút, giây (DMS)' : '—'],
                  ].map(([label, value], i) => (
                    <div key={i} className="detail-row">
                      <span className="detail-label">{label}</span>
                      <span className="detail-value">{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: spaceSm, padding: '0 12px' }}>
                  <span className="detail-label">Tọa độ GPS</span>
                  {(() => {
                    const pts = parseGisCoordinates(r);
                    return (
                      <Table className="list-view-table" dataSource={pts.map((p, i) => ({ ...p, key: i }))} pagination={false} size="middle" bordered style={{ marginTop: spaceSm }}>
                        <Table.Column title="STT" key="stt" width={60} align="center"
                          render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{i + 1}</span>}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Vĩ độ (N)" key="lat" align="center"
                          render={(_: any, record: any) => {
                            const dms = ddToDms(record.lat);
                            return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly style={{ flex: 1.2, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                          }}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Kinh độ (E)" key="lng" align="center"
                          render={(_: any, record: any) => {
                            const dms = ddToDms(record.lng);
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
    </>
  );
}
