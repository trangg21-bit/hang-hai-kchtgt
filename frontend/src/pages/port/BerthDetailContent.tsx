import React, { useState, useEffect } from 'react';
import { Tabs, Select, Tooltip, Button, Modal } from 'antd';
import { FileOutlined, EnvironmentOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors, DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { fmtNum } from '../../utils/numFmt';
import {
  textTertiary, surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceSm, spaceMd, spaceFormField, actionPrimary, outlineButtonStyle, primaryButtonStyle, statusBadgeStyle,
  statusOperational, statusAttention, statusCritical,
} from '../../themetokenchk';
import type { Berth } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';
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

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '');
const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '');

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
  waterwayMap = new Map<string, string>(),
  infrastructureList = [],
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
  onViewPierDetail,
}: BerthDetailContentProps) {
  const r = selectedRecord;
  const [infraTypeFilter, setInfraTypeFilter] = useState<string>('');
  const [loadedInfra, setLoadedInfra] = useState<any[]>([]);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);

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
            <div style={{ paddingTop: 3, overflowY: 'auto', maxHeight: 'calc(100vh - 290px)' }}>
              <div className="chk-detail-grid">
                {[
                  { label: 'Mã bến cảng', value: r.berthCode ? <span style={statusBadgeStyle(actionPrimary)}>{r.berthCode}</span> : '' },
                  { label: 'Tên bến cảng', value: r.berthName ? <span style={{ fontWeight: fontWeightBold }}>{r.berthName}</span> : '' },
                  { label: 'Đơn vị quản lý', value: (() => {
                    const name = orgMap.get(r.orgUnitId || '') || r.orgUnitId || '';
                    return name ? <span style={{ fontWeight: fontWeightBold }}>{name}</span> : '';
                  })() },
                  { label: 'Thuộc cảng biển', value: (() => {
                    const name = portOptions.find(o => o.value === r.portId)?.label || r.portId || '';
                    return name ? <span style={{ fontWeight: fontWeightBold }}>{name}</span> : '';
                  })() },
                  { label: 'Thuộc luồng hàng hải', value: waterwayMap.get(r.waterwayId || '') || r.waterwayId || '' },
                  { label: 'Đơn vị khai thác', value: r.operatingOrgName || r.operator || '' },
                  { label: 'Địa điểm (Tỉnh/Thành Phố)', value: r.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '' : '' },
                  { label: 'Loại kết cấu bến cảng', value: structureTypeOptions.find(o => o.value === r.structureType)?.label || (r.structureType != null ? String(r.structureType) : '') },
                  { label: 'Công năng khai thác', value: r.operationalFunction || '' },
                  { label: 'Tổng diện tích (ha)', value: r.totalArea != null ? fmtNum(r.totalArea) : '' },
                  { label: 'Năng lực thông qua thiết kế', value: r.designThroughput != null ? `${fmtNum(r.designThroughput)} tấn/năm` : '' },
                  { label: 'Năng lực thông qua hiện trạng', value: r.currentThroughput != null ? `${fmtNum(r.currentThroughput)} tấn/năm` : '' },
                  { label: 'Quy hoạch năng lực thông qua', value: r.plannedThroughput != null ? `${fmtNum(r.plannedThroughput)} tấn/năm` : '' },
                  { label: 'Sản lượng thực tế năm gần nhất', value: r.latestCargoVolume != null ? `${fmtNum(r.latestCargoVolume)} tấn/năm` : '' },
                  { label: 'Cỡ tàu tiếp nhận lớn nhất (DWT)', value: r.maxVesselSize != null ? fmtNum(r.maxVesselSize) : '' },
                  { label: 'Tình trạng', value: (() => { const s = r.operationalStatus; const m: Record<string,{color:string;label:string}> = { OPERATIONAL:{color:statusOperational,label:'Đang khai thác/Vận hành'}, NOT_YET_OPERATIONAL:{color:statusAttention,label:'Chưa khai thác/Vận hành'}, SUSPENDED:{color:statusCritical,label:'Dừng khai thác/Vận hành'} }; const b = s && m[s]; return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : ''; })() },
                  { label: 'Địa điểm chi tiết', value: r.detailedLocation || '', fullWidth: true },
                ].map((row, i) => (
                  <div key={i} className={`chk-detail-row${row.fullWidth ? ' chk-detail-row--full' : ''}`} style={row.fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                    <span className="chk-detail-label">{row.label}</span>
                    <span className="chk-detail-value">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* ── Toggle: Thông tin công bố mở, đưa vào sử dụng ── */}
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setAnnouncementOpen(!announcementOpen)}>
                <span style={{ color: announcementOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{announcementOpen ? '▼' : '▶'} Thông tin công bố mở, đưa vào sử dụng</span>
              </button>
              {announcementOpen && (
                <div className="chk-detail-grid" style={{ marginTop: 4 }}>
                  {[
                    { label: 'Thời điểm công bố, đưa vào sử dụng', value: fmtDate(r.openingAnnouncementDate), fullWidth: true },
                    { label: 'Quyết định công bố/ Văn bản cho phép khai thác', value: r.openingDecision || '', fullWidth: true },
                    { label: 'Văn bản thỏa thuận đầu tư xây dựng', value: r.investmentAgreement || '', fullWidth: true },
                  ].map((row, i) => (
                    <div key={i} className={`chk-detail-row${row.fullWidth ? ' chk-detail-row--full' : ''}`} style={row.fullWidth ? { gridColumn: '1 / -1' } : undefined}>
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
          key: 'gis', label: `Thông tin vị trí (${parseGisCoordinates(r).length})`,
          children: (
            <div style={{ paddingTop: 3, overflowY: 'auto', maxHeight: 'calc(100vh - 290px)' }}>
              <div className="chk-detail-grid">
                {[
                  { label: 'Loại đối tượng', value: ({ POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' } as Record<string, string>)[(r as any).geometryType || ''] || (r as any).geometryType || '' },
                  { label: 'Biểu tượng', value: (() => { const symId = r.mapSymbolId || ''; const symName = symbolMap.get(symId) || symId || ''; const symImg = symbolImageMap.get(symId); return <span style={{ display:'inline-flex',alignItems:'center',gap:8 }}>{symImg ? <img src={symImg} alt="" style={{ width:20,height:20,objectFit:'contain' }} /> : null}{symName}</span>; })() },
                  { label: 'Hệ quy chiếu', value: r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : (r.coordinateSystem ? String(r.coordinateSystem) : '') },
                  { label: 'Quy tắc hiển thị', value: ((r as any).geometryType || (r as any).coordinates || (r as any).latitude != null || (r as any).longitude != null) ? 'Độ, phút, giây (DMS)' : '' },
                ].map((row, i) => (
                  <div key={i} className="chk-detail-row">
                    <span className="chk-detail-label">{row.label}</span>
                    <span className="chk-detail-value">{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: spaceMd }}>
                <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                  <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                    Tọa độ GPS ({parseGisCoordinates(r).length})
                  </span>
                  <Button
                    icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                    onClick={() => setGisModalOpen(true)}
                    style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Xem vị trí trên bản đồ
                  </Button>
                </div>
                {(() => {
                  const pts = parseGisCoordinates(r);
                  return (
                    <DetailTable
                      dataSource={pts.map((p) => ({ ...p }))}
                      emptyText="Chưa có tọa độ GPS nào"
                      scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                      columns={[
                        { title: 'STT', width: 50 },
                        { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lat); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                        { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lng); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                      ]}
                    />
                  );
                })()}
              </div>
            </div>
          ),
        },
        {
          key: 'files', label: `File đính kèm (${detailFiles.length})`,
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm }}>
                <span style={detailLabelStyle}>File đính kèm</span>
              </div>
              <DetailTable
                dataSource={detailFiles.map((f) => ({ ...f }))}
                emptyText="Chưa có tài liệu đính kèm"
                scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Tên tài liệu', dataIndex: 'fileName', key: 'fileName', render: (v: string) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{v || ''}</span> },
                  { title: 'Dung lượng', dataIndex: 'fileSize', key: 'fileSize', width: 120, align: 'right' as const, render: (v: number) => v ? (v > 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(2)} MB` : `${(v / 1024).toFixed(1)} KB`) : '' },
                  { title: 'Người tải lên', dataIndex: 'uploadedBy', key: 'uploadedBy', width: 180, render: (v: string) => userMap.get(v) || v || '' },
                  { title: 'Ngày tải lên', dataIndex: 'uploadedAt', key: 'uploadedAt', width: 135, align: 'center' as const, render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '' },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'infra', label: 'Kết cấu hạ tầng',
          children: (
            <div style={{ paddingTop: 3, overflowY: 'auto', maxHeight: 'calc(100vh - 290px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: spaceSm }}>
                <span style={{ ...detailLabelStyle, display: 'inline-block' }}>Kết cấu hạ tầng thuộc bến cảng</span>
                <Select allowClear placeholder="Chọn loại kết cấu hạ tầng" value={infraTypeFilter || undefined}
                  onChange={(v: string | undefined) => setInfraTypeFilter(v || '')}
                  options={[{ value: 'Pier', label: 'Cầu cảng' }]} style={{ width: 260, borderRadius: 999, height: 40 }} />
              </div>
              <DetailTable
                dataSource={infraRows}
                emptyText="Chưa có dữ liệu"
                rowKey={(r: any) => r.id || r.infraName || r.name}
                scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Loại kết cấu hạ tầng', dataIndex: 'infraType', key: 'type', render: (_v: string, rec: any) => <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary }}>{rec.infraType === 'Pier' ? 'Cầu cảng' : rec.infraType || ''}</span> },
                  { title: 'Tên kết cấu hạ tầng', dataIndex: 'infraName', key: 'name', render: (v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: actionPrimary, cursor: 'pointer', fontWeight: fontWeightBold }} onClick={() => onViewPierDetail?.(rec.id)}>{v || rec.name || ''}</span> },
                  { title: 'Thao tác', key: 'actions', width: 100, align: 'center' as const, render: (_v: any, rec: any) => (
                    <Tooltip title="Xem chi tiết">
                      <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: actionPrimary, fontSize: fontSizeMd }}
                        onClick={() => onViewPierDetail?.(rec.id)} />
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
            <div style={{ paddingTop: 3, overflowY: 'auto', maxHeight: 'calc(100vh - 290px)' }}>
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setOperationOpen(!operationOpen)}>
                <span style={{ color: operationOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{operationOpen ? '▼' : '▶'} Thông tin vận hành khai thác</span>
              </button>
              {operationOpen && (
                <div style={{ marginBottom: spaceMd }}>
                  <DetailTable
                    dataSource={operationPlanList}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r.id || r.planCode || r.code}
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                      { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
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
                <div style={{ marginBottom: spaceMd }}>
                  <DetailTable
                    dataSource={maintenancePlanList}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r.id || r.planCode || r.code}
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                      { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
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
                  <DetailTable
                    dataSource={incidentList}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r.id || r.incidentCode || r.code}
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                      { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec.type || '' },
                      { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || '' },
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
                  { label: 'Trạng thái', value: r.approvalStatus && approvalStyleMap[r.approvalStatus] ? <span style={statusBadgeStyle(approvalStyleMap[r.approvalStatus].color)}>{approvalStyleMap[r.approvalStatus].label}</span> : '', fullWidth: true },
                  { label: 'Cán bộ cập nhật', value: userMap.get(r.updatedBy || '') || r.updatedBy ? <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.updatedBy || '') || r.updatedBy}</span> : '' },
                  { label: 'Ngày cập nhật', value: fmtDateTime(r.updatedAt) },
                  { label: 'Cán bộ gửi phê duyệt', value: userMap.get(r.submittedForApprovalBy || '') || r.submittedForApprovalBy ? <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.submittedForApprovalBy || '') || r.submittedForApprovalBy}</span> : '' },
                  { label: 'Ngày gửi phê duyệt', value: fmtDateTime(r.submittedForApprovalAt) },
                  { label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: userMap.get(r.portAuthorityApprovedBy || '') || r.portAuthorityApprovedBy ? <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.portAuthorityApprovedBy || '') || r.portAuthorityApprovedBy}</span> : '' },
                  { label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', value: fmtDateTime(r.portAuthorityApprovedAt) },
                  { label: 'Cán bộ phê duyệt cấp Cục', value: userMap.get(r.departmentApprovedBy || '') || r.departmentApprovedBy ? <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.departmentApprovedBy || '') || r.departmentApprovedBy}</span> : '' },
                  { label: 'Ngày phê duyệt cấp Cục', value: fmtDateTime(r.departmentApprovedAt) },
                  { label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục', value: r.portAuthorityApprovalContent || '', fullWidth: true },
                  { label: 'Nội dung phê duyệt cấp Cục', value: r.departmentApprovalContent || '', fullWidth: true },
                ].map((row, i) => (
                  <div key={i} className={`chk-detail-row${row.fullWidth ? ' chk-detail-row--full' : ''}`} style={row.fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                    <span className="chk-detail-label">{row.label}</span>
                    <span className="chk-detail-value">{row.value}</span>
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
