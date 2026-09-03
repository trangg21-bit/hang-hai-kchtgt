import { useState } from 'react';
import { Select, Tabs, Modal, Button, Tooltip } from 'antd';
import {
  EnvironmentOutlined, FileOutlined, EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  colors, actionPrimary, textTertiary,
  surfaceCard, spaceSm, spaceMd, spaceFormField,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  statusBadgeStyle, outlineButtonStyle, primaryButtonStyle,
  statusOperational, statusAttention, statusCritical,
} from '../../themetokenchk';
import type { CangBienResponse } from './types';
import { trangThaiPheDuyetBadge } from './schema';
import { fmtNum } from '../../utils/numFmt';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type { Symbol } from '../symbolService';

// ── Helpers (module-level, đồng bộ PortListPage) ───────────────────

const KCHT_TYPE_OPTIONS = [
  'Bến cảng', 'Bến phao', 'Cầu cảng', 'Cơ sở sửa chữa, đóng tàu', 'Khu chuyển tải',
  'Đèn biển và nhà trạm gắn liền với đèn biển', 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ',
  'Luồng hàng hải', 'Khu neo đậu', 'Nhà trạm quản lý vận hành Phao, tiêu', 'Trạm Radar',
  'Khu tránh, trú bão', 'Trung tâm điều hành VTS', 'Hệ thống thông tin liên lạc VHF', 'Hệ thống VTS',
].map((label) => ({ value: label, label }));

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

// Parse tọa độ GPS: ưu tiên coordinateList (array) → WKT (coordinates) → latitude/longitude (POINT).
const parseGisCoordinates = (record: any): Array<{ lat: number; lng: number }> => {
  const out: Array<{ lat: number; lng: number }> = [];
  const arr = record?.coordinateList;
  if (Array.isArray(arr) && arr.length > 0) {
    arr.forEach((c: any) => { const lat = Number(c.latitude ?? c.lat); const lng = Number(c.longitude ?? c.lng); if (!isNaN(lat) && !isNaN(lng)) out.push({ lat, lng }); });
    return out;
  }
  const wkt = record?.coordinates;
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

// ── Props ───────────────────────────────────────────────────────────

export interface PortDetailContentProps {
  selectedRecord: CangBienResponse;
  orgLevel2Map: Map<string, string>;
  userMap: Map<string, string>;
  symbols: Symbol[];
  detailFiles: any[];
  otherInfra: any[];
  infraFilter: string | undefined;
  setInfraFilter: (v: string | undefined) => void;
  infraPage: number;
  setInfraPage: (p: number) => void;
  infraPageSize: number;
  setInfraPageSize: (ps: number) => void;
  openKchtDetail: (type: 'berth' | 'waterzone', id: string) => void;
  ddToDms: (dd: number) => { d: number | null; m: number | null; s: number | null };
}

// ── Component: nội dung drawer Xem chi tiết (chuẩn tab Bến phao) ───

export default function PortDetailContent({
  selectedRecord,
  orgLevel2Map,
  userMap,
  symbols,
  detailFiles,
  otherInfra,
  infraFilter,
  setInfraFilter,
  openKchtDetail,
  ddToDms,
}: PortDetailContentProps) {
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

  return (
    <>
    <Tabs
      defaultActiveKey="general"
      className="port-detail-tabs"
      tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 3 }}>
              <style>{`.ant-tabs-nav{margin-bottom:0!important;padding-left:12px!important}`}</style>
              <div className="chk-detail-grid">
                {[
                  { label: 'Mã cảng biển', value: selectedRecord.portCode, badge: true },
                  { label: 'Tên cảng biển', value: selectedRecord.portName, bold: true },
                  { label: 'Nhóm cảng biển', value: selectedRecord.portGroup ? 'Nhóm ' + selectedRecord.portGroup : '—', bold: true },
                  { label: 'Phân cấp cảng biển', value: selectedRecord.portClass != null ? (selectedRecord.portClass === 5 ? 'Cấp đặc biệt' : `Cấp ${selectedRecord.portClass}`) : '—' },
                  { label: 'Đơn vị quản lý', value: orgLevel2Map.get(selectedRecord.orgUnitId || '') || selectedRecord.orgUnitName || '—', bold: true },
                  { label: 'Địa điểm (Tỉnh/Thành phố)', value: selectedRecord.province || '—' },
                  { label: 'Địa điểm chi tiết', value: selectedRecord.detailedLocation || '—' },
                  { label: 'Phạm vi vùng nước cảng biển', value: selectedRecord.waterAreaScope || '—' },
                ].map((row, i) => (
                  <div key={i} className="chk-detail-row">
                    <span className="chk-detail-label">{row.label}</span>
                    <span className="chk-detail-value" style={row.bold ? { fontWeight: fontWeightBold } : undefined}>
                      {row.badge ? (
                        <span style={statusBadgeStyle(actionPrimary)}>{row.value}</span>
                      ) : row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Toggle: Chỉ số tổng hợp (giống thêm mới) ── */}
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setIndexOpen(!indexOpen)}>
                <span style={{ color: indexOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{indexOpen ? '▼' : '▶'} Chỉ số tổng hợp</span>
              </button>
              {indexOpen && (
                <div className="chk-detail-grid" style={{ marginTop: 4 }}>
                  {[
                    { label: 'Tổng số bến cảng', value: selectedRecord.totalBerths ?? '—' },
                    { label: 'Tổng số khu neo đậu, khu chuyển tải', value: selectedRecord.totalAnchoragesTransshipment ?? '—' },
                    { label: 'Tổng số tuyến luồng hàng hải công cộng', value: selectedRecord.totalPublicChannels ?? '—' },
                    { label: 'Tổng số tuyến luồng hàng hải chuyên dùng', value: selectedRecord.totalDedicatedChannels ?? '—' },
                    { label: 'Tổng chiều dài luồng hàng hải công cộng (km)', value: selectedRecord.totalPublicChannelLength != null ? fmtNum(selectedRecord.totalPublicChannelLength) : '—' },
                    { label: 'Tổng chiều dài luồng hàng hải chuyên dùng (km)', value: selectedRecord.totalDedicatedChannelLength != null ? fmtNum(selectedRecord.totalDedicatedChannelLength) : '—' },
                    { label: 'Tổng số phao tiêu, báo hiệu hàng hải trên luồng', value: selectedRecord.totalBuoysBeacons ?? '—' },
                    { label: 'Tổng số đê, kè', value: selectedRecord.totalDikes ?? '—' },
                    { label: 'Tổng chiều dài hệ thống đê, kè (km)', value: selectedRecord.totalDikeLength != null ? fmtNum(selectedRecord.totalDikeLength) : '—' },
                    { label: 'Tổng số đèn biển, đăng, tiêu độc lập', value: selectedRecord.totalLighthouses ?? '—' },
                    { label: 'Số lượng bến phao', value: selectedRecord.buoyBerthCount ?? '—' },
                    { label: 'Số lượng khu neo đậu', value: selectedRecord.anchorageCount ?? '—' },
                    { label: 'Số lượng khu chuyển tải', value: selectedRecord.transshipmentCount ?? '—' },
                    { label: 'Các khu nước, vùng nước khác', value: selectedRecord.otherWaterAreas || '—', fullWidth: true },
                    { label: 'Ghi chú', value: selectedRecord.remarks || '—', fullWidth: true },
                  ].map((row, i) => (
                    <div key={i} className="chk-detail-row" style={row.fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                      <span className="chk-detail-label">{row.label}</span>
                      <span className="chk-detail-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
        },
        {
          key: 'gis', label: `Thông tin vị trí (${parseGisCoordinates(selectedRecord).length})`,
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Loại đối tượng', selectedRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : selectedRecord.geometryType === 'LINE' ? 'Đối tượng đường' : selectedRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '—'],
                  ['Biểu tượng', (() => { const sym = symbols.find((s) => s.id === selectedRecord.mapSymbolId); return sym ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{sym.image ? <img src={sym.image} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{sym.name}</span> : selectedRecord.mapSymbolId || '—'; })(),],
                  ['Hệ quy chiếu', selectedRecord.coordinateSystem === 1 ? 'WGS-84' : selectedRecord.coordinateSystem === 2 ? 'VN-2000' : '—'],
                  ['Quy tắc hiển thị', (selectedRecord.geometryType || (selectedRecord as any).coordinates) ? 'Độ, phút, giây (DMS)' : '—'],
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
                    Tọa độ GPS ({parseGisCoordinates(selectedRecord).length})
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
                  dataSource={parseGisCoordinates(selectedRecord).map((p) => ({ ...p }))}
                  emptyText="Chưa có tọa độ GPS nào"
                  columns={[
                    { title: 'STT', width: 50 },
                    { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lat); return dms.d !== null ? `${dms.d}° ${dms.m ?? 0}' ${dms.s ?? 0}" N` : '—'; } },
                    { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lng); return dms.d !== null ? `${dms.d}° ${dms.m ?? 0}' ${dms.s ?? 0}" E` : '—'; } },
                  ]}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'infra', label: 'Công trình KCHT trực thuộc',
          children: (
            <div style={{ paddingTop: 3 }}>
              <DetailTable
                dataSource={((selectedRecord as any).infrastructureList || []).map((i: any) => ({ ...i }))}
                emptyText="Chưa có dữ liệu"
                rowKey={(r: any) => r.stt ?? r.infraName ?? r.name}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Tên công trình', dataIndex: 'infraName', key: 'name', render: (v: string, rec: any) => v || rec.name || '—' },
                  { title: 'Số lượng', dataIndex: 'quantity', key: 'qty', width: 100, align: 'center' as const, render: (v: number) => v ?? '—' },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'files', label: `File đính kèm (${detailFiles.length})`,
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
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
          key: 'infraOther', label: 'Danh sách kết cấu hạ tầng khác',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: spaceSm }}>
                <span style={{ ...detailLabelStyle, display: 'inline-block' }}>Loại kết cấu hạ tầng</span>
                <Select allowClear showSearch placeholder="Chọn loại kết cấu hạ tầng" value={infraFilter || undefined}
                  onChange={(v: string | undefined) => setInfraFilter(v || undefined)}
                  options={KCHT_TYPE_OPTIONS} style={{ width: 260, borderRadius: 999, height: 40 }} />
              </div>
              <DetailTable
                dataSource={otherInfra.filter((r) => !infraFilter || r.typeLabel === infraFilter)}
                emptyText="Chưa có dữ liệu"
                rowKey={(r: any) => r.id || r.name}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Loại kết cấu hạ tầng', dataIndex: 'typeLabel', key: 'type', render: (v: string, rec: any) => <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary }}>{rec.typeLabel || v || '—'}</span> },
                  { title: 'Tên kết cấu hạ tầng', dataIndex: 'name', key: 'name', render: (v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: actionPrimary, cursor: 'pointer', fontWeight: fontWeightBold }} onClick={() => openKchtDetail(rec.kchtType, rec.id)}>{v || '—'}</span> },
                  { title: 'Thao tác', key: 'actions', width: 100, align: 'center' as const, render: (_v: any, rec: any) => (
                    <Tooltip title="Xem chi tiết">
                      <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: actionPrimary, fontSize: fontSizeMd }}
                        onClick={() => openKchtDetail(rec.kchtType, rec.id)} />
                    </Tooltip>
                  ) },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'plan', label: 'Thông tin quy hoạch',
          children: (
            <div style={{ paddingTop: 3 }}>
              <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Danh sách thông tin quy hoạch</span>
              <DetailTable
                dataSource={(selectedRecord as any)?.planList || []}
                emptyText="Chưa có thông tin quy hoạch"
                rowKey={(r: any) => r?.id || r?.planDecisionNo || 'row'}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Số quyết định quy hoạch', dataIndex: 'planDecisionNo', key: 'planNo', render: (v: string) => v || '—' },
                  { title: 'Ngày quyết định quy hoạch', dataIndex: 'planDecisionDate', key: 'planDate', width: 160, align: 'center' as const, render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—') },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'operation', label: 'Vận hành & bảo trì',
          children: (
            <div style={{ paddingTop: 3 }}>
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setOperationOpen(!operationOpen)}>
                <span style={{ color: operationOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{operationOpen ? '▼' : '▶'} Thông tin vận hành khai thác</span>
              </button>
              {operationOpen && (
                <div>
                  <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Danh sách vận hành khai thác</span>
                  <DetailTable
                    dataSource={(selectedRecord as any)?.operationPlanList || []}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r?.id || r?.opPlanCode || 'row'}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'opPlanCode', key: 'code', render: (v: string) => v || '—' },
                      { title: 'Tên kế hoạch', dataIndex: 'opPlanName', key: 'name', render: (v: string) => v || '—' },
                      { title: 'Ngày bắt đầu', dataIndex: 'opStartDate', key: 'start', width: 150, align: 'center' as const, render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—') },
                      { title: 'Ngày kết thúc', dataIndex: 'opEndDate', key: 'end', width: 150, align: 'center' as const, render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—') },
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
                    dataSource={(selectedRecord as any)?.maintenancePlanList || []}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r?.id || r?.maintCode || 'row'}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'maintCode', key: 'code', render: (v: string) => v || '—' },
                      { title: 'Tên kế hoạch', dataIndex: 'maintName', key: 'name', render: (v: string) => v || '—' },
                      { title: 'Thời gian bắt đầu', dataIndex: 'maintStart', key: 'start', width: 150, align: 'center' as const, render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—') },
                      { title: 'Thời gian kết thúc', dataIndex: 'maintEnd', key: 'end', width: 150, align: 'center' as const, render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—') },
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
                    dataSource={(selectedRecord as any)?.incidentList || []}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r?.id || r?.incidentCode || 'row'}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string) => v || '—' },
                      { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string) => v || '—' },
                      { title: 'Địa điểm', dataIndex: 'incidentLocation', key: 'location', render: (v: string) => v || '—' },
                      { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'center' as const, render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—') },
                    ]}
                  />
                </div>
              )}
            </div>
          ),
        },
        {
          key: 'approval', label: 'Xử lý & theo dõi',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Trạng thái', (() => { const b = trangThaiPheDuyetBadge(selectedRecord.approvalStatus || ''); let c = textTertiary; if (b.color === 'green') c = statusOperational; else if (b.color === 'red') c = statusCritical; else if (b.color === 'orange') c = statusAttention; else if (b.color === 'blue') c = actionPrimary; return <span style={statusBadgeStyle(c)}>{b.label}</span>; })()],
                  ['Người tạo', selectedRecord.createdByName || selectedRecord.createdBy || '—'],
                  ['Ngày tạo', selectedRecord.createdAt ? dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                  ['Cán bộ cập nhật', selectedRecord.updatedByName || selectedRecord.updatedBy || '—'],
                  ['Ngày cập nhật', selectedRecord.updatedAt ? dayjs(selectedRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="chk-detail-row" style={label === 'Trạng thái' ? { gridColumn: '1 / -1' } : undefined}>
                    <span className="chk-detail-label">{label}</span>
                    <span className="chk-detail-value" style={label === 'Người tạo' || label === 'Cán bộ cập nhật' ? { fontWeight: fontWeightBold } : undefined}>{value}</span>
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
              const pts = parseGisCoordinates(selectedRecord);
              if (pts.length > 0) {
                const rawWkt = (selectedRecord as any).coordinates || '';
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
