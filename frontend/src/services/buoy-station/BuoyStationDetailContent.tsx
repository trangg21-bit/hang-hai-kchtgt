// ── BuoyStationDetailContent — chi tiết nhà trạm phao tiêu (chuẩn BuoyDetailContent) ──
// 4 tab: Thông tin chung (+ Thông tin hệ thống collapse) / Kỹ thuật & kiểm định /
// Thông tin vị trí (bảng tọa độ GPS) / File đính kèm.

import React, { useState } from 'react';
import { Tabs, Button, Modal } from 'antd';
import { FileOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { BuoyStationResponse, StationBuoySummary } from './types';
import {
  GEO_MAP, COORD_MAP, APPROVAL_STYLE_MAP,
} from './schema';
import {
  colors, sidebarBg, actionPrimary, statusOperational, statusAttention, statusCritical, surfaceCard,
  textPrimary, textTertiary,
  fontSizeMd, fontSizeSm, fontSizeLg, fontWeightBold,
  spaceSm, spaceMd, spaceFormField, statusBadgeStyle,
  outlineButtonStyle, primaryButtonStyle,
} from '../../themetokenchk';
import type { OrgUnitTreeOption } from '../../components/org-unit';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';

// ── Style badge Tình trạng (giống Quản lý phao tiêu) ─────────────────
const CONDITION_STYLE: Record<string, { color: string; label: string }> = {
  'Đang khai thác/vận hành': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  'Chưa khai thác/vận hành': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  'Dừng khai thác/vận hành': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

// Bảng con trong tab chi tiết: DetailTable (chuẩn VTS CHK — header xám, phân trang antd, "Tổng cộng N")
function DetailTabTable({ title, dataSource, emptyText, columns }: {
  title: React.ReactNode;
  dataSource: any[];
  emptyText?: string;
  columns: any[];
}) {
  return (
    <div style={{ paddingTop: 3 }}>
      <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>{title}</div>
      <DetailTable
        dataSource={dataSource}
        emptyText={emptyText || 'Không có dữ liệu'}
        showTotal={(total) => `Tổng cộng ${total}`}
        columns={columns}
      />
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
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

  const orgName = (id: string | undefined) => (id ? (orgUnits.find((o) => o.id === id)?.name || id) : '—');
  const userName = (id: string | number | undefined | null) =>
    id != null ? (userMap.get(String(id)) || String(id)) : '—';

  const statusBadge = (() => {
    const b = APPROVAL_STYLE_MAP[r.status || ''] || { color: textTertiary, label: r.status || '—' };
    return (
      <span style={statusBadgeStyle(b.color)}>
        {b.label}
      </span>
    );
  })();

  const gridRows = (rows: Array<[string, React.ReactNode]>) => (
    <div className="chk-detail-grid">
      {rows.map(([label, value]) => (
        <div key={String(label)} className="chk-detail-row">
          <span className="chk-detail-label">{label}</span>
          <span className="chk-detail-value">{value}</span>
        </div>
      ))}
    </div>
  );

  const coords = parseGisCoordinates(r);

  return (
    <>
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general',
          label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 3 }}>
              {gridRows([
                ['Mã nhà trạm', <span style={statusBadgeStyle(actionPrimary)}>{r.code || '—'}</span>],
                ['Tên nhà trạm', <span style={{ fontWeight: fontWeightBold }}>{r.name || '—'}</span>],
                ['Đơn vị quản lý', (() => {
                    const name = orgUnits.find((o) => o.id === r.unitId)?.name || r.unitId || '—';
                    return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                  })()],
                ['Đơn vị khai thác', <span style={{ fontWeight: fontWeightBold }}>{orgName(r.operatingOrgId)}</span>],
                ['Thuộc cảng biển', r.portId ? (portMap.get(r.portId) || r.portId) : '—'],
                ['Thuộc luồng hàng hải', r.waterwayId ? (waterwayMap.get(r.waterwayId) || r.waterwayId) : '—'],
                ['Tuyến luồng hàng hải', r.waterwayRouteId ? (routeMap.get(r.waterwayRouteId) || r.waterwayRouteId) : '—'],
                ['Địa điểm (Tỉnh/Thành Phố)', r.province || '—'],
                ['Địa điểm chi tiết', r.address || '—'],
                ['Thời điểm xây dựng', formatDate(r.constructionDate)],
                ['Tổng diện tích (m²)', r.totalArea != null ? r.totalArea : '—'],
                ['Diện tích sử dụng (m²)', r.usableArea != null ? r.usableArea : '—'],
                ['Số lượng nhân sự bố trí', r.staffCount != null ? r.staffCount : '—'],
                ['Năm bảo trì gần nhất', r.lastMaintenanceYear != null ? r.lastMaintenanceYear : '—'],
                ['Ghi chú', r.note || '—'],
                ['Tình trạng', (() => { const s = CONDITION_STYLE[r.condition || ''] || { color: textTertiary, label: r.condition || '—' }; return <span style={statusBadgeStyle(s.color)}>{s.label}</span>; })()],
              ])}
            </div>
          ),
        },
        {
          key: 'location',
          label: 'Thông tin vị trí',
          children: (
            <div style={{ paddingTop: 3 }}>
              {gridRows([
                ['Loại đối tượng', r.objectType ? (GEO_MAP[r.objectType] || r.objectType) : '—'],
                ['Biểu tượng', (() => { const symId = r.icon || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span>; })(),],
                ['Hệ quy chiếu', r.coordinateSystem ? (COORD_MAP[r.coordinateSystem] || r.coordinateSystem) : '—'],
                ['Quy tắc hiển thị', r.displayFormat || '—'],
              ])}
              <div style={{ marginTop: spaceMd }}>
                <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                  <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                    Tọa độ GPS ({coords.length})
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
                  dataSource={coords.map((p) => ({ ...p }))}
                  emptyText="Chưa có tọa độ GPS nào"
                  columns={[
                    { title: 'STT', width: 50 },
                    { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lat); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                    { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lng); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                  ]}
                />
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
              <DetailTable
                dataSource={detailFiles.map((f) => ({ ...f }))}
                emptyText="Không có tài liệu đính kèm"
                showTotal={(total) => `Tổng cộng ${total}`}
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Tên tài liệu', dataIndex: 'fileName', key: 'fileName', render: (v: string) => <span title={v} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{v || '—'}</span> },
                  { title: 'Dung lượng', dataIndex: 'fileSize', key: 'fileSize', width: 120, align: 'right' as const, render: (v: number) => v != null ? (v > 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(2)} MB` : `${(v / 1024).toFixed(1)} KB`) : '—' },
                  { title: 'Người tải lên', key: 'uploadedBy', width: 180, render: (_v: any, rec: any) => rec.uploadedBy ? (userMap.get(String(rec.uploadedBy)) || rec.uploadedBy) : '—' },
                  { title: 'Ngày tải lên', key: 'uploadedAt', width: 160, align: 'center' as const, render: (_v: any, rec: any) => rec.uploadedAt ? formatDateTime(rec.uploadedAt) : '—' },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'buoys',
          label: 'Danh sách phao tiêu',
          children: (
            <DetailTabTable
              title={<span style={detailLabelStyle}>Danh sách phao tiêu</span>}
              dataSource={detailBuoys}
              emptyText="Chưa có dữ liệu"
              columns={[
                { title: 'Mã phao, tiêu', key: 'code', dataIndex: 'code', render: (v: string) => <span style={statusBadgeStyle(actionPrimary)}>{v || '—'}</span> },
                { title: 'Tên phao, tiêu', key: 'name', dataIndex: 'name', render: (v: string, rec: any) => onViewBuoy ? <Button type="link" onClick={() => onViewBuoy(rec.id)} style={{ fontWeight: fontWeightBold, color: actionPrimary, padding: 0, height: 'auto' }}>{v || '—'}</Button> : <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold }}>{v || '—'}</span> },
                { title: 'Phân loại', key: 'classification', dataIndex: 'classification', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                { title: 'Phân loại phao', key: 'classificationBuoy', dataIndex: 'classificationBuoy', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                { title: 'Phân loại tiêu', key: 'classificationMark', dataIndex: 'classificationMark', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
              ]}
            />
          ),
        },
        {
          key: 'operation',
          label: 'Vận hành & bảo trì',
          children: (
            <div style={{ paddingTop: 3 }}>
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setOperationOpen(!operationOpen)}>
                <span style={{ color: operationOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{operationOpen ? '▼' : '▶'} Thông tin vận hành khai thác</span>
              </button>
              {operationOpen && (
                <DetailTabTable
                  title={<span style={detailLabelStyle}>Danh sách vận hành khai thác</span>}
                  dataSource={(r.operationPlanCode || r.operationPlanName || r.operationStartDate || r.operationEndDate) ? [{ key: 'row', operationPlanCode: r.operationPlanCode || '—', operationPlanName: r.operationPlanName || '—', operationStartDate: r.operationStartDate || '—', operationEndDate: r.operationEndDate || '—' }] : []}
                  emptyText="Chưa có dữ liệu"
                  columns={[
                    { title: 'Mã kế hoạch', key: 'operationPlanCode', dataIndex: 'operationPlanCode', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                    { title: 'Tên kế hoạch', key: 'operationPlanName', dataIndex: 'operationPlanName', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                    { title: 'Ngày bắt đầu', key: 'operationStartDate', dataIndex: 'operationStartDate', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                    { title: 'Ngày kết thúc', key: 'operationEndDate', dataIndex: 'operationEndDate', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                  ]}
                />
              )}
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setMaintenanceOpen(!maintenanceOpen)}>
                <span style={{ color: maintenanceOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{maintenanceOpen ? '▼' : '▶'} Thông tin bảo trì</span>
              </button>
              {maintenanceOpen && (
                <DetailTabTable
                  title={<span style={detailLabelStyle}>Danh sách thông tin bảo trì</span>}
                  dataSource={(r.maintenancePlanCode || r.maintenancePlanName || r.maintenanceStartTime || r.maintenanceEndTime) ? [{ key: 'row', maintenancePlanCode: r.maintenancePlanCode || '—', maintenancePlanName: r.maintenancePlanName || '—', maintenanceStartTime: r.maintenanceStartTime || '—', maintenanceEndTime: r.maintenanceEndTime || '—' }] : []}
                  emptyText="Chưa có dữ liệu"
                  columns={[
                    { title: 'Mã kế hoạch', key: 'maintenancePlanCode', dataIndex: 'maintenancePlanCode', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                    { title: 'Tên kế hoạch', key: 'maintenancePlanName', dataIndex: 'maintenancePlanName', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                    { title: 'Thời gian bắt đầu', key: 'maintenanceStartTime', dataIndex: 'maintenanceStartTime', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                    { title: 'Thời gian kết thúc', key: 'maintenanceEndTime', dataIndex: 'maintenanceEndTime', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                  ]}
                />
              )}
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setIncidentOpen(!incidentOpen)}>
                <span style={{ color: incidentOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{incidentOpen ? '▼' : '▶'} Thông tin sự cố</span>
              </button>
              {incidentOpen && (
                <DetailTabTable
                  title={<span style={detailLabelStyle}>Danh sách thông tin sự cố</span>}
                  dataSource={(r.incidentCode || r.incidentType || r.incidentLocation || r.incidentTime) ? [{ key: 'row', incidentCode: r.incidentCode || '—', incidentType: r.incidentType || '—', incidentLocation: r.incidentLocation || '—', incidentTime: r.incidentTime || '—' }] : []}
                  emptyText="Chưa có dữ liệu"
                  columns={[
                    { title: 'Mã sự cố', key: 'incidentCode', dataIndex: 'incidentCode', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                    { title: 'Loại sự cố', key: 'incidentType', dataIndex: 'incidentType', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                    { title: 'Địa điểm', key: 'incidentLocation', dataIndex: 'incidentLocation', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                    { title: 'Thời gian', key: 'incidentTime', dataIndex: 'incidentTime', render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
                  ]}
                />
              )}
            </div>
          ),
        },
        {
          key: 'system',
          label: 'Xử lý & theo dõi',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Trạng thái', statusBadge],
                  ['Cán bộ cập nhật', <span style={{ fontWeight: fontWeightBold }}>{r.updatedByName || '—'}</span>],
                  ['Ngày cập nhật', formatDateTime(r.updatedAt)],
                  ['Cán bộ gửi phê duyệt', <span style={{ fontWeight: fontWeightBold }}>{userName(r.sentApprovedBy)}</span>],
                  ['Ngày gửi phê duyệt', formatDateTime(r.sentApprovedDate)],
                  ['Cán bộ phê duyệt cấp Cảng vụ/Chi cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level1ApprovedBy)}</span>],
                  ['Ngày phê duyệt cấp Cảng vụ/Chi cục', formatDateTime(r.level1ApprovedDate)],
                  ['Cán bộ phê duyệt cấp Cục', <span style={{ fontWeight: fontWeightBold }}>{userName(r.level2ApprovedBy)}</span>],
                  ['Ngày phê duyệt cấp Cục', formatDateTime(r.level2ApprovedDate)],
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

    {/* GIS Location Selector Modal — xem vị trí trên bản đồ chuyên dụng (chuẩn VTS CHK: chế độ XEM — disabled) */}
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
