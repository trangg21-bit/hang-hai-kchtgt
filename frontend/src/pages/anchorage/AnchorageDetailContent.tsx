import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Collapse, Button, Modal, Drawer } from 'antd';
import { FileOutlined, EnvironmentOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import {
  textPrimary, textTertiary, borderDefault, surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
  spaceSm, spaceMd, spaceFormField, actionPrimary,
  statusOperational, statusAttention, statusCritical, statusBadgeStyle,
  drawerTitleStyle, drawerCloseBtnStyle, primaryButtonStyle, outlineButtonStyle,
} from '../../themetokenchk';
import type { Anchorage } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';
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
const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
const fmtNumber = (v: number | null | undefined): string => (v != null ? Number(v).toLocaleString('vi-VN') : '—');

export default function AnchorageDetailContent({
  selectedRecord,
  orgMap,
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
  const renderDmsText = (dd: number | null | undefined, isLat: boolean): string => {
    if (dd == null || isNaN(Number(dd))) return '—';
    const dms = ddToDms(Number(dd));
    return `${dms.d}° ${dms.m}' ${dms.s}" ${isLat ? 'N' : 'E'}`;
  };
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [waterAreaOpen, setWaterAreaOpen] = useState(true);
  const [technicalOpen, setTechnicalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [approvalLogs, setApprovalLogs] = useState<any[]>([]);
  const [changeHistory, setChangeHistory] = useState<any[]>([]);
  const [viewingWaterArea, setViewingWaterArea] = useState<any | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [, setLoading] = useState(true);

  const loadDetailData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/anchorage/${selectedRecord.id}/history`);
      const data = res.data?.data || res.data || {};
      setChangeHistory(Array.isArray(data?.changeHistory) ? data.changeHistory : (Array.isArray(data) ? data : []));
      setApprovalLogs(Array.isArray(data?.approvalLog) ? data.approvalLog : []);
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
              <div className="chk-detail-grid">
                {[
                  ['Mã khu neo đậu', <span style={statusBadgeStyle(actionPrimary)}>{r.anchorageCode || '—'}</span>],
                  ['Tên khu neo đậu', <span style={{ fontWeight: fontWeightBold }}>{r.anchorageName || '—'}</span>],
                  ['Đơn vị quản lý', (() => {
                    const name = orgMap.get(r.orgUnitId || '') || r.orgUnitId || '—';
                    return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                  })(),],
                  ['Thuộc cảng biển', <span style={{ fontWeight: fontWeightBold }}>{portOptions.find(o => o.value === r.portId)?.label || r.portId || '—'}</span>],
                  ['Thuộc luồng hàng hải', waterwayMap.get(r.navigationChannelId || '') || r.navigationChannelId || '—'],
                  ['Thuộc bến phao', r.buoyStationName || r.buoyStationId || '—'],
                  ['Địa điểm (Tỉnh/Thành phố)', r.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '—' : '—'],
                  ['Địa điểm chi tiết', r.detailedLocation || '—'],
                  ['Tình trạng', (() => { const s = r.operationalStatus; const m: Record<string,{color:string;label:string}> = { OPERATIONAL:{color:statusOperational,label:'Đang khai thác/Vận hành'}, NOT_YET_OPERATIONAL:{color:statusAttention,label:'Chưa khai thác/Vận hành'}, SUSPENDED:{color:statusCritical,label:'Dừng khai thác/Vận hành'} }; const b = s && m[s]; return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : '—'; })(),],
                ].map(([label, value], i) => (
                  <div key={i} className="chk-detail-row">
                    <span className="chk-detail-label">{label}</span>
                    <span className="chk-detail-value">{value}</span>
                  </div>
                ))}
              </div>

              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setTechnicalOpen(!technicalOpen)}>
                <span style={{ color: technicalOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{technicalOpen ? '▼' : '▶'} Thông tin kỹ thuật</span>
              </button>
              {technicalOpen && (
              <div className="chk-detail-grid">
                {[
                  ['Hình dạng', r.shapeDescription || '—'],
                  ['Diện tích (ha)', fmtNumber(r.area)],
                  ['Độ sâu khu nước theo thiết kế (m)', fmtNumber(r.designWaterDepth)],
                  ['Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)', fmtNumber(r.currentWaterDepth)],
                  ['Cao độ đáy bến thiết kế', fmtNumber(r.bottomElevationDesign)],
                  ['Cỡ tàu khai thác theo công bố (DWT)', fmtNumber(r.maxVesselDWT)],
                  ['Số lượng khu neo đậu đang khai thác', fmtNumber(r.activeAnchorageCount)],
                  ['Số lượng khu neo đậu đã công bố', fmtNumber(r.publishedAnchorageCount)],
                  ['Số lượng khu neo đậu đang được thỏa thuận đầu tư xây dựng', fmtNumber(r.underInvestmentAnchorageCount)],
                ].map(([label, value], i) => (
                  <div key={i} className="chk-detail-row">
                    <span className="chk-detail-label">{label}</span>
                    <span className="chk-detail-value">{value}</span>
                  </div>
                ))}
                <div className="chk-detail-row" style={{ gridColumn: '1 / -1' }}>
                  <span className="chk-detail-label">Ghi chú</span>
                  <span className="chk-detail-value">{r.remarks || '—'}</span>
                </div>
              </div>
              )}

              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setAnnouncementOpen(!announcementOpen)}>
                <span style={{ color: announcementOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{announcementOpen ? '▼' : '▶'} Thông tin công bố mở, đưa vào sử dụng</span>
              </button>
              {announcementOpen && (
                <div className="chk-detail-grid" style={{ marginTop: 4 }}>
                  {[
                    ['Thời điểm công bố mở, đưa ra sử dụng', fmtDate(r.openingAnnouncementDate)],
                    ['Quyết định công bố/ Văn bản cho phép khai thác', r.publicDecision || '—'],
                    ['Văn bản thỏa thuận đầu tư xây dựng', r.investmentAgreement || '—'],
                  ].map(([label, value], i) => (
                    <div key={i} className="chk-detail-row">
                      <span className="chk-detail-label">{label}</span>
                      <span className="chk-detail-value">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setWaterAreaOpen(!waterAreaOpen)}>
                <span style={{ color: waterAreaOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{waterAreaOpen ? '▼' : '▶'} Thông tin khu nước neo buộc tàu</span>
              </button>
              {waterAreaOpen && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ marginBottom: spaceMd }}>
                    <span style={detailLabelStyle}>Danh sách khu nước neo buộc tàu</span>
                  </div>
                  <DetailTable
                    dataSource={(Array.isArray(r.mooringWaterAreas) ? r.mooringWaterAreas : []).map((wa, i) => ({ ...wa, key: i }))}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(rec: any) => rec.key}
                    scroll={{ x: 600 }}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Phạm vi khu nước neo buộc tàu', dataIndex: 'description', key: 'description', render: (d?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{d || '—'}</span> },
                      { title: 'Thao tác', key: 'actions', width: 100, align: 'center' as const, render: (_v: any, rec: any) => <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: actionPrimary, fontSize: fontSizeMd }} onClick={() => setViewingWaterArea(rec)} /> },
                    ]}
                  />
                </div>
              )}
            </div>
          ),
        },
        {
          key: 'gis', label: `Thông tin vị trí (${parseGisCoordinates(r).length})`,
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Loại đối tượng', (() => { const gt = (r as any).geometryType || ''; const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }; return m[gt] || gt || '—'; })(),],
                  ['Biểu tượng', (() => { const symId = r.mapSymbolId || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display:'inline-flex',alignItems:'center',gap:8 }}>{symImg ? <img src={symImg} alt="" style={{ width:24,height:24,objectFit:'contain' }} /> : null}{symName}</span>; })(),],
                  ['Hệ quy chiếu', r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : r.coordinateSystem || '—'],
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
                      columns={[
                        { title: 'STT', width: 50 },
                        { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => renderDmsText(rec.lat, true) },
                        { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => renderDmsText(rec.lng, false) },
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
                dataSource={Array.isArray(operationPlanList) ? operationPlanList : []}
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
                dataSource={Array.isArray(maintenancePlanList) ? maintenancePlanList : []}
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
                dataSource={Array.isArray(incidentList) ? incidentList : []}
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
                  ['Nội dung phê duyệt cấp Cảng vụ/Chi cục', r.portAuthorityApprovalContent || '—'],
                  ['Nội dung phê duyệt cấp Cục', r.departmentApprovalContent || '—'],
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
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{change.fieldName || change.changedField || '—'}</span>
                  </div>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Giá trị cũ</div>
                    <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{change.oldValue ?? change.previousValue ?? '—'}</span>
                  </div>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Giá trị mới</div>
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{change.newValue || '—'}</span>
                  </div>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Thời gian</div>
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{fmtDateTime(change.changedAt || change.approvedDate)}</span>
                  </div>
                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ ...detailLabelStyle, marginBottom: spaceSm }}>Người thay đổi</div>
                    <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{userMap.get(change.changedBy || '') || change.changedBy || '—'}</span>
                  </div>
                </Collapse.Panel>
              ))}
            </Collapse>
          ),
        }] : []),
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

    {/* ── Drawer chi tiết khu nước neo buộc tàu (không đẩy Drawer cha) ── */}
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
            <div className="chk-detail-grid">
              <div className="chk-detail-row"><span className="chk-detail-label">Phạm vi khu nước neo buộc tàu:</span><span className="chk-detail-value">{viewingWaterArea.description || '—'}</span></div>
            </div>
            <div style={{ marginBottom: spaceMd, marginTop: spaceMd }}>
              <span style={{ ...drawerTitleStyle, fontSize: 16 }}>Vị trí cụ thể điểm neo</span>
            </div>
            <div className="chk-detail-grid">
              {[
                ['Loại đối tượng', (() => { const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }; return viewingWaterArea.geometryType ? m[viewingWaterArea.geometryType] || viewingWaterArea.geometryType : '—'; })(),],
                ['Biểu tượng', (() => { const symName = symbolMap.get(viewingWaterArea.mapSymbolId || '') || viewingWaterArea.mapSymbolId || '—'; const symImg = symbolImageMap.get(viewingWaterArea.mapSymbolId || ''); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span>; })(),],
                ['Hệ quy chiếu', viewingWaterArea.coordinateSystem === 1 ? 'WGS-84' : viewingWaterArea.coordinateSystem === 2 ? 'VN-2000' : viewingWaterArea.coordinateSystem || '—'],
                ['Quy tắc hiển thị', viewingWaterArea.displayRule || '—'],
              ].map(([label, value], i) => (
                <div key={i} className="chk-detail-row"><span className="chk-detail-label">{label}</span><span className="chk-detail-value">{value}</span></div>
              ))}
            </div>
            <div style={{ marginTop: spaceSm }}>
              <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Tọa độ điểm neo</span>
              <DetailTable
                dataSource={(Array.isArray(viewingWaterArea.anchorPoints) ? viewingWaterArea.anchorPoints : []).map((p: any, i: number) => ({ ...p, key: i }))}
                emptyText="Không có điểm neo"
                rowKey={(rec: any) => rec.key}
                tableLayout="fixed"
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Tên điểm neo', dataIndex: 'name', key: 'name', width: 350, render: (name?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={name || '—'}>{name || '—'}</span> },
                  { title: 'Vĩ độ (N)', key: 'lat', width: 205, align: 'center' as const, render: (_v: any, rec: any) => renderDmsText(rec.latitude, true) },
                  { title: 'Kinh độ (E)', key: 'lng', width: 205, align: 'center' as const, render: (_v: any, rec: any) => renderDmsText(rec.longitude, false) },
                ]}
              />
            </div>
          </div>
        </>
      )}
    </Drawer>
    </>
  );
}
