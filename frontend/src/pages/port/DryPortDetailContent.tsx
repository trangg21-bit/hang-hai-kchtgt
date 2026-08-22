import React, { useState } from 'react';
import { Tabs, Table, Space, InputNumber, Pagination } from 'antd';
import { FileOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault, surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold, fontWeightMedium, spaceSm,
  statusOperational, statusAttention, statusCritical, actionPrimary,
} from '../../tokens';
import type { DryPort } from '../../types/port';
import PagedTable from '../../components/list-view/PagedTable';
import { resolveOrgFullPath } from '../../components/org-unit';

export interface DryPortDetailContentProps {
  selectedRecord: DryPort;
  organizations: any[];
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

// Bảng tham chiếu (Thông tin quy hoạch / Vận hành khai thác / Bảo trì) — đồng bộ giao diện cảng biển (PortRefTable)
const TAB_PAGE_SIZE = 20;
function DryPortRefTable({ title, emptyText, columns, dataSource = [] }: { title: string; emptyText: string; columns: Array<{ title: string; dataIndex?: string; width?: number }>; dataSource?: any[] }) {
  const [page, setPage] = useState(1);
  const maxPage = Math.max(1, Math.ceil(dataSource.length / TAB_PAGE_SIZE));
  const cur = Math.min(page, maxPage);
  const rows = dataSource
    .map((row, idx) => ({ ...row, key: row?.key ?? idx, __stt: idx + 1 }))
    .slice((cur - 1) * TAB_PAGE_SIZE, cur * TAB_PAGE_SIZE);
  return (
    <div style={{ paddingTop: 3 }}>
      <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{title}</span>
      </div>
      <Table
        className="list-view-table"
        dataSource={rows}
        pagination={false} size="middle" bordered
        style={{ marginLeft: 12, marginRight: 12 }}
        locale={{ emptyText: <div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>{emptyText}</span></div> }}
      >
        <Table.Column title="STT" key="stt" dataIndex="__stt" width={60} align="center"
          render={(v: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{v}</span>}
          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
        {columns.map((c) => (
          <Table.Column key={c.title} title={c.title} dataIndex={c.dataIndex} width={c.width} align="center"
            render={(v: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
        ))}
        <Table.Column title="Thao tác" key="actions" width={100} align="center"
          render={() => <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>}
          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
      </Table>
      <div style={{ margin: '0 12px' }}>
        <Pagination total={dataSource.length} current={cur} pageSize={TAB_PAGE_SIZE}
          pageSizeOptions={[10, 20, 50]} onChange={setPage} />
      </div>
    </div>
  );
}

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

export default function DryPortDetailContent({
  selectedRecord: r,
  organizations,
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
                    ['Đơn vị quản lý', (() => {
                      const orgPathNames = resolveOrgFullPath(organizations, r.orgUnitId);
                      if (!orgPathNames || orgPathNames.length === 0) return '—';
                      const levelColors = [textPrimary, textSecondary, textTertiary];
                      return (
                        <span>
                          {orgPathNames.map((n, i) => (
                            <span key={i} style={{ display: 'block', color: levelColors[Math.min(i, levelColors.length - 1)] }}>
                              {n}
                            </span>
                          ))}
                        </span>
                      );
                    })(), true],
                    ['Đơn vị khai thác', r.operatingUnit || '—'],
                    ['Mã cảng cạn', <span key="dryPortCode" style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${colors.primary}15`, color: colors.primary }}>{r.dryPortCode || '—'}</span>],
                    ['Tên cảng cạn', r.dryPortName || '—', true],
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
                        OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
                        NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
                        SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
                      };
                      const b = (r as any).operationalStatus && opMap[(r as any).operationalStatus]
                        ? opMap[(r as any).operationalStatus]
                        : (r.portStatus === 1 ? opMap.OPERATIONAL : opMap.NOT_YET_OPERATIONAL);
                      return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${b.color}15`, color: b.color }}>{b.label}</span>;
                    })()],
                    ['Trạng thái', (() => { const b = approvalStyleMap[r.approvalStatus || '']; return b ? <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${b.color}15`, color: b.color }}>{b.label}</span> : approvalLabel; })(),],
                  ].map(([label, value, bold], i) => (
                    <div key={i} className="detail-row">
                      <span className="detail-label">{label}</span>
                      <span className="detail-value" style={bold ? { fontWeight: fontWeightBold } : undefined}>{value}</span>
                    </div>
                  ))}
                  </div>
                  <div style={{ cursor: 'pointer', marginTop: 10, paddingLeft: 12 }} onClick={() => setSystemOpen(!systemOpen)}>
                    <span style={{ color: systemOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{systemOpen ? '▼' : '▶'} Thông tin hệ thống</span>
                  </div>
                  {systemOpen && (
                    <div className="detail-grid" style={{ marginTop: 4 }}>
                      {[
                        ['Người tạo', userMap.get(r.createdBy || '') || r.createdBy || '—', true],
                        ['Ngày tạo', r.createdAt ? dayjs(r.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                        ['Người cập nhật', userMap.get(r.updatedBy || '') || r.updatedBy || '—', true],
                        ['Ngày cập nhật', r.updatedAt ? dayjs(r.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                      ].map(([label, value, bold], i) => (
                        <div key={i} className="detail-row">
                          <span className="detail-label">{label}</span>
                          <span className="detail-value" style={bold ? { fontWeight: fontWeightBold } : undefined}>{value}</span>
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
                    ['Biểu tượng', (() => { const symId = r.mapSymbolId || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span>; })()],
                    ['Hệ quy chiếu', COORD_SYS_LABELS[r.coordinateSystem || 0] || r.coordinateSystem || '—'],
                    ['Quy tắc hiển thị', (r.geometryType || r.coordinates || r.latitude != null || r.longitude != null) ? 'Độ, phút, giây (DMS)' : '—'],
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
                      <PagedTable dataSource={pts.map((p) => ({ ...p }))}
                        emptyText={(
                          <div style={{ padding: '32px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><EnvironmentOutlined /></div>
                            <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có tọa độ</span>
                          </div>
                        )}
                      >
                        <Table.Column title="Vĩ độ (N)" key="lat" align="center"
                          render={(_: any, record: any) => {
                            const dms = ddToDms(record.lat);
                            return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly tabIndex={-1} style={{ flex: 1.2, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                          }}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Kinh độ (E)" key="lng" align="center"
                          render={(_: any, record: any) => {
                            const dms = ddToDms(record.lng);
                            return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly tabIndex={-1} style={{ flex: 1.2, textAlign: 'center', pointerEvents: 'none' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
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
            key: 'plan', label: 'Thông tin quy hoạch',
            children: <DryPortRefTable title="Thông tin quy hoạch" emptyText="Chưa có thông tin quy hoạch" columns={[
              { title: 'Số quyết định quy hoạch', dataIndex: 'planDecisionNo', width: 200 },
              { title: 'Ngày quyết định quy hoạch', dataIndex: 'planDecisionDate', width: 180 },
            ]} />,
          },
          {
            key: 'operation', label: 'Thông tin vận hành khai thác',
            children: <DryPortRefTable title="Thông tin vận hành khai thác" emptyText="Chưa có dữ liệu" dataSource={(r as any)?.operationPlanList} columns={[
              { title: 'Mã kế hoạch', dataIndex: 'opPlanCode', width: 180 },
              { title: 'Tên kế hoạch', dataIndex: 'opPlanName', width: 220 },
              { title: 'Ngày bắt đầu', dataIndex: 'opStartDate', width: 200 },
              { title: 'Ngày kết thúc', dataIndex: 'opEndDate', width: 200 },
            ]} />,
          },
          {
            key: 'maintenance', label: 'Thông tin bảo trì',
            children: <DryPortRefTable title="Thông tin bảo trì" emptyText="Chưa có dữ liệu" dataSource={(r as any)?.maintenancePlanList} columns={[
              { title: 'Mã kế hoạch', dataIndex: 'maintCode', width: 180 },
              { title: 'Tên kế hoạch', dataIndex: 'maintName', width: 220 },
              { title: 'Thời gian bắt đầu', dataIndex: 'maintStart', width: 200 },
              { title: 'Thời gian kết thúc', dataIndex: 'maintEnd', width: 200 },
            ]} />,
          },
          ]}
        />
    </>
  );
}
