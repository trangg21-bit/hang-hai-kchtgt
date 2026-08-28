// ── BuoyDetailContent — presentational detail body (chuẩn VTS CHK, giống BuoyBerthDetailContent) ─
// Tabs: general / light / gis / files / operation / maintenance / incident.
// org/user name mapping comes from the page (orgUnits / userMap props) — no FE fetch.
// Detail grid dùng class chk-detail-* (CSS trong theme), bảng con dùng DetailTable,
// GIS modal chế độ XEM (disabled) — chuẩn VTS CHK.

import React, { useState } from 'react';
import { Tabs, Button, Modal } from 'antd';
import { FileOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type { OrgUnitTreeOption } from '../../components/org-unit';
import {
  textTertiary, surfaceCard,
  actionPrimary, statusOperational, statusAttention, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
  spaceSm, spaceMd, spaceFormField,
  statusBadgeStyle, outlineButtonStyle, primaryButtonStyle,
} from '../../themetokenchk';
import {
  SHAPE_LABEL_MAP,
} from './schema';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import type { Buoy } from './types';

export interface BuoyDetailContentProps {
  selectedRecord: Buoy;
  orgUnits: OrgUnitTreeOption[];
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
// fallback sang latitude/longitude (giống BuoyBerthDetailContent).
// ⚠️ MULTIPOINT regex ĐÚNG: ((?:\([^)]*\),?)+) — bắt đủ N điểm (KHÔNG dùng (?:,[^)]+)* — chỉ bắt 1 điểm)
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
        const pm = wkt.match(/POINT\s*\(([\d.+-]+)\s+([\d.+-]+)\)/);
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

const GEOMETRY_TYPE_LABELS: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };

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
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const userName = (id: number | string | undefined | null) =>
    id != null ? (userMap.get(String(id)) || String(id)) : '—';
  const provinceName = (id: number | undefined | null) =>
    id != null ? (VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(id))?.label || String(id)) : '—';
  const statusBadge = (() => {
    const b = buoyStatusBadge(r.status || '');
    return <span style={statusBadgeStyle(b.color)}>{b.label}</span>;
  })();

  const renderDms = (dd: number, suffix: string) => {
    const dms = ddToDms(dd);
    return `${dms.d ?? 0}° ${dms.m ?? 0}' ${dms.s ?? 0}" ${suffix}`;
  };

  const renderDetailRows = (rows: Array<[string, React.ReactNode]>) => (
    <div className="chk-detail-grid">
      {rows.map(([label, value], i) => (
        <div key={i} className="chk-detail-row">
          <span className="chk-detail-label">{label}</span>
          <span className="chk-detail-value">{value}</span>
        </div>
      ))}
    </div>
  );

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
                  ['Mã phao tiêu', <span style={statusBadgeStyle(actionPrimary)}>{r.code || '—'}</span>],
                  ['Tên phao tiêu', <span style={{ fontWeight: fontWeightBold }}>{r.name || '—'}</span>],
                  ['Đơn vị quản lý', (() => {
                    const name = orgUnits.find((o) => o.id === r.unitId)?.name || r.unitId || '—';
                    return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                  })(),],
                  ['Thuộc nhà trạm quản lý vận hành phao, tiêu', r.buoyStationName || '—'],
                  ['Phân loại', r.classification || '—'],
                  ['Phân loại phao', r.classificationBuoy || '—'],
                  ['Phân loại tiêu', r.classificationMark || '—'],
                  ['Địa điểm (Tỉnh/Thành Phố)', provinceName(r.provinceId)],
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
                  ['Tình trạng', (() => { const s = CONDITION_STYLE[r.condition || ''] || { color: textTertiary, label: r.condition || '—' }; return <span style={statusBadgeStyle(s.color)}>{s.label}</span>; })()],
                ].map(([label, value], i) => (
                  <div key={i} className="chk-detail-row">
                    <span className="chk-detail-label">{label}</span>
                    <span className="chk-detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          key: 'light', label: 'Đặc tính ánh sáng',
          children: (
            <div style={{ paddingTop: 3 }}>
              {renderDetailRows([
                ['Màu sắc', r.lightColor || r.color || '—'],
                ['Kiểu chớp', r.flashType || '—'],
                ['Chu kỳ', r.period || '—'],
              ])}
            </div>
          ),
        },
        {
          key: 'gis', label: `Thông tin vị trí (${parseGisCoordinates(r).length})`,
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Loại đối tượng', GEOMETRY_TYPE_LABELS[(r as any).geometryType || ''] || (r as any).geometryType || '—'],
                  ['Biểu tượng bản đồ', (() => { const symId = r.mapSymbolId || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span>; })(),],
                  ['Hệ quy chiếu', r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : r.coordinateSystem || '—'],
                  ['Quy tắc hiển thị', ((r as any).geometryType || (r as any).coordinates || r.latitude != null || r.longitude != null) ? 'Độ, phút, giây (DMS)' : '—'],
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
                        { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => renderDms(rec.lat, 'N') },
                        { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => renderDms(rec.lng, 'E') },
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
                dataSource={(r.operationPlanCode || r.operationPlanName || r.operationStartDate || r.operationEndDate) ? [{ key: 'row', operationPlanCode: r.operationPlanCode || '—', operationPlanName: r.operationPlanName || '—', operationStartDate: r.operationStartDate || '—', operationEndDate: r.operationEndDate || '—' }] : []}
                emptyText="Chưa có dữ liệu"
                rowKey={(rec: any) => rec.key || rec.operationPlanCode || 'row'}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã kế hoạch', dataIndex: 'operationPlanCode', key: 'operationPlanCode', render: (v: string) => v || '—' },
                  { title: 'Tên kế hoạch', dataIndex: 'operationPlanName', key: 'operationPlanName', render: (v: string) => v || '—' },
                  { title: 'Ngày bắt đầu', dataIndex: 'operationStartDate', key: 'operationStartDate', width: 150, align: 'center' as const, render: (v: string) => (v && v !== '—' ? formatDate(v) : '—') },
                  { title: 'Ngày kết thúc', dataIndex: 'operationEndDate', key: 'operationEndDate', width: 150, align: 'center' as const, render: (v: string) => (v && v !== '—' ? formatDate(v) : '—') },
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
                dataSource={(r.maintenancePlanCode || r.maintenancePlanName || r.maintenanceStartTime || r.maintenanceEndTime) ? [{ key: 'row', maintenancePlanCode: r.maintenancePlanCode || '—', maintenancePlanName: r.maintenancePlanName || '—', maintenanceStartTime: r.maintenanceStartTime || '—', maintenanceEndTime: r.maintenanceEndTime || '—' }] : []}
                emptyText="Chưa có dữ liệu"
                rowKey={(rec: any) => rec.key || rec.maintenancePlanCode || 'row'}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã kế hoạch', dataIndex: 'maintenancePlanCode', key: 'maintenancePlanCode', render: (v: string) => v || '—' },
                  { title: 'Tên kế hoạch', dataIndex: 'maintenancePlanName', key: 'maintenancePlanName', render: (v: string) => v || '—' },
                  { title: 'Thời gian bắt đầu', dataIndex: 'maintenanceStartTime', key: 'maintenanceStartTime', width: 150, align: 'center' as const, render: (v: string) => (v && v !== '—' ? formatDate(v) : '—') },
                  { title: 'Thời gian kết thúc', dataIndex: 'maintenanceEndTime', key: 'maintenanceEndTime', width: 150, align: 'center' as const, render: (v: string) => (v && v !== '—' ? formatDate(v) : '—') },
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
                dataSource={(r.incidentCode || r.incidentType || r.incidentLocation || r.incidentTime) ? [{ key: 'row', incidentCode: r.incidentCode || '—', incidentType: r.incidentType || '—', incidentLocation: r.incidentLocation || '—', incidentTime: r.incidentTime || '—' }] : []}
                emptyText="Chưa có dữ liệu"
                rowKey={(rec: any) => rec.key || rec.incidentCode || 'row'}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'incidentCode', render: (v: string) => v || '—' },
                  { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'incidentType', render: (v: string) => v || '—' },
                  { title: 'Địa điểm', dataIndex: 'incidentLocation', key: 'incidentLocation', render: (v: string) => v || '—' },
                  { title: 'Thời gian', dataIndex: 'incidentTime', key: 'incidentTime', width: 150, align: 'center' as const, render: (v: string) => (v && v !== '—' ? formatDate(v) : '—') },
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
                  ['Trạng thái', statusBadge],
                  ['Cán bộ cập nhật', <span style={{ fontWeight: fontWeightBold }}>{userName(r.updatedBy)}</span>],
                  ['Ngày cập nhật', formatDate(r.updatedAt)],
                  ['Cán bộ gửi phê duyệt', <span style={{ fontWeight: fontWeightBold }}>{userName(r.submittedForApprovalBy)}</span>],
                  ['Ngày gửi phê duyệt', formatDate(r.submittedForApprovalAt)],
                  ['Cán bộ phê duyệt cấp Cảng vụ/Chi cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level1ApprovedBy)}</span>],
                  ['Ngày phê duyệt cấp Cảng vụ/Chi cục', formatDate(r.level1ApprovedDate)],
                  ['Cán bộ phê duyệt cấp Cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level2ApprovedBy)}</span>],
                  ['Ngày phê duyệt cấp Cục', formatDate(r.level2ApprovedDate)],
                  ['Nội dung phê duyệt cấp Cảng vụ/Chi cục', r.level1ApprovalContent || '—'],
                  ['Nội dung phê duyệt cấp Cục', r.level2ApprovalContent || '—'],
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
      ]}
    />

    {/* GIS Location Selector Modal — xem vị trí trên bản đồ chuyên dụng (chuẩn VTS CHK, chế độ disabled) */}
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
