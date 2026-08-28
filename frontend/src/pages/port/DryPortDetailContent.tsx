import React, { useState, useMemo } from 'react';
import { Tabs, Button, Modal } from 'antd';
import { FileOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../themetokenchk';
import {
  textTertiary, surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold, spaceSm, spaceMd, spaceFormField,
  statusOperational, statusAttention, statusCritical, actionPrimary, statusBadgeStyle,
  outlineButtonStyle, primaryButtonStyle,
} from '../../themetokenchk';
import type { DryPort } from '../../types/port';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';

export interface DryPortDetailContentProps {
  selectedRecord: DryPort;
  organizations: any[];
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  userMap: Map<string, string>;
  detailFiles: any[];
  ddToDms: (dd: number | null | undefined) => { d: number | null; m: number | null; s: number | null };
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
        // ✅ ĐÚNG — bắt đủ N điểm (regex chuẩn VTS CHK)
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

// Bảng tham chiếu (Thông tin quy hoạch / Vận hành khai thác / Bảo trì / Sự cố) — DetailTable chuẩn VTS CHK
const TAB_PAGE_SIZE = 10;
function DryPortRefTable({ title, emptyText, columns, dataSource = [] }: { title: string; emptyText: string; columns: Array<{ title: string; dataIndex?: string; width?: number }>; dataSource?: any[] }) {
  return (
    <div style={{ paddingTop: 3 }}>
      <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{title}</span>
      </div>
      <DetailTable
        dataSource={(Array.isArray(dataSource) ? dataSource : []).map((row, idx) => ({ ...row, key: row?.key ?? idx }))}
        emptyText={emptyText}
        pageSize={TAB_PAGE_SIZE}
        showTotal={(total) => `Tổng cộng ${total}`}
        columns={[
          { title: 'STT', width: 50 },
          ...columns.map((c) => ({ title: c.title, dataIndex: c.dataIndex, width: c.width })),
        ]}
      />
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
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const approvalLabel = approvalStyleMap[r.approvalStatus || '']?.label || r.approvalStatus || '—';

  // Bản đồ orgUnitId → tên đơn vị (pattern Bến phao: hiển thị tên đơn vị trực tiếp, không dựng path nhiều cấp)
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    (Array.isArray(organizations) ? organizations : []).forEach((o: any) => { if (o?.id) map.set(o.id, o.name || o.id); });
    return map;
  }, [organizations]);

  return (
    <>
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {([
                  ['Mã cảng cạn', <span key="dryPortCode" style={statusBadgeStyle(actionPrimary)}>{r.dryPortCode || '—'}</span>],
                  ['Tên cảng cạn', r.dryPortName || '—', true],
                  ['Đơn vị quản lý', (() => {
                    const name = orgMap.get(r.orgUnitId || '') || r.orgUnitId || '—';
                    return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                  })(),],
                  ['Đơn vị khai thác', r.operatingUnit || '—'],
                  ['Khu vực', r.region || '—'],
                  ['Địa điểm (Tỉnh/Thành Phố)', provinceName(r.provinceId)],
                  ['Địa điểm chi tiết', r.detailedLocation || '—', true, true],
                  ['Hành lang vận tải', r.transportCorridor || '—'],
                  ['Phương thức kết nối giao thông với cảng', r.connectionMode || '—', false, true],
                  ['Công suất khai thác', r.teuCapacity?.toLocaleString('vi-VN') || '—'],
                  ['Tổng diện tích cảng (m2)', r.area?.toLocaleString('vi-VN') || '—'],
                  ['Diện tích kho (m2)', r.warehouseArea?.toLocaleString('vi-VN') || '—'],
                  ['Diện tích bãi (m2)', r.yardArea?.toLocaleString('vi-VN') || '—'],
                  ['Ghi chú', <span key="remarks" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.remarks || '—'}</span>, false, true],
                  ['Tình trạng', (() => {
                    const opMap: Record<string, { color: string; label: string }> = {
                      OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/Vận hành' },
                      NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/Vận hành' },
                      SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/Vận hành' },
                    };
                    const b = (r as any).operationalStatus && opMap[(r as any).operationalStatus]
                      ? opMap[(r as any).operationalStatus]
                      : (r.portStatus === 1 ? opMap.OPERATIONAL : opMap.NOT_YET_OPERATIONAL);
                    return <span style={statusBadgeStyle(b.color)}>{b.label}</span>;
                  })()],
                ] as any[]).map(([label, value, bold, fullWidth], i) => (
                  <div key={i} className="chk-detail-row" style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                    <span className="chk-detail-label">{label}</span>
                    <span className="chk-detail-value" style={bold ? { fontWeight: fontWeightBold } : undefined}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          key: 'announcement', label: 'Thời điểm công bố đưa vào sử dụng',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Quyết định công bố số', r.announcementDecisionNumber || '—'],
                  ['Ngày ra quyết định công bố', r.announcementDecisionDate ? dayjs(r.announcementDecisionDate).format('DD/MM/YYYY') : '—'],
                  ['Đơn vị ra quyết định công bố', r.announcementOrg || '—'],
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
          key: 'location', label: `Thông tin vị trí (${parseGisCoordinates(r).length})`,
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Loại đối tượng', r.geometryType === 'POINT' ? 'Đối tượng điểm' : r.geometryType === 'LINE' ? 'Đối tượng đường' : r.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '—'],
                  ['Biểu tượng', (() => { const symId = r.mapSymbolId || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{symName}</span>; })()],
                  ['Hệ quy chiếu', COORD_SYS_LABELS[r.coordinateSystem || 0] || r.coordinateSystem || '—'],
                  ['Quy tắc hiển thị', (r.geometryType || r.coordinates || r.latitude != null || r.longitude != null) ? 'Độ, phút, giây (DMS)' : '—'],
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
                      showTotal={(total) => `Tổng cộng ${total}`}
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
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                <span style={detailLabelStyle}>File đính kèm</span>
              </div>
              <DetailTable
                dataSource={detailFiles.map((f) => ({ ...f }))}
                emptyText="Chưa có tài liệu đính kèm"
                showTotal={(total) => `Tổng cộng ${total}`}
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
          key: 'plan', label: 'Thông tin quy hoạch',
          children: <DryPortRefTable title="Thông tin quy hoạch" emptyText="Chưa có thông tin quy hoạch" columns={[
            { title: 'Số quyết định quy hoạch', dataIndex: 'planDecisionNo', width: 200 },
            { title: 'Ngày quyết định quy hoạch', dataIndex: 'planDecisionDate', width: 180 },
          ]} />,
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
                    dataSource={(Array.isArray((r as any)?.operationPlanList) ? (r as any).operationPlanList : [])}
                    emptyText="Chưa có dữ liệu"
                    showTotal={(total) => `Tổng cộng ${total}`}
                    rowKey={(rec: any, idx?: number) => rec?.id || rec?.opPlanCode || String(idx)}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'opPlanCode', key: 'opPlanCode', render: (v: string, rec: any) => v || rec.code || '—' },
                      { title: 'Tên kế hoạch', dataIndex: 'opPlanName', key: 'opPlanName', render: (v: string, rec: any) => v || rec.name || '—' },
                      { title: 'Ngày bắt đầu', dataIndex: 'opStartDate', key: 'opStartDate', width: 150, align: 'center' as const, render: (v: string, rec: any) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : (rec.startDate ? dayjs(rec.startDate).format('DD/MM/YYYY HH:mm') : '—') },
                      { title: 'Ngày kết thúc', dataIndex: 'opEndDate', key: 'opEndDate', width: 150, align: 'center' as const, render: (v: string, rec: any) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : (rec.endDate ? dayjs(rec.endDate).format('DD/MM/YYYY HH:mm') : '—') },
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
                    dataSource={(Array.isArray((r as any)?.maintenancePlanList) ? (r as any).maintenancePlanList : [])}
                    emptyText="Chưa có dữ liệu"
                    showTotal={(total) => `Tổng cộng ${total}`}
                    rowKey={(rec: any, idx?: number) => rec?.id || rec?.maintCode || String(idx)}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'maintCode', key: 'maintCode', render: (v: string, rec: any) => v || rec.code || '—' },
                      { title: 'Tên kế hoạch', dataIndex: 'maintName', key: 'maintName', render: (v: string, rec: any) => v || rec.name || '—' },
                      { title: 'Thời gian bắt đầu', dataIndex: 'maintStart', key: 'maintStart', width: 150, align: 'center' as const, render: (v: string, rec: any) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : (rec.startTime || rec.start || '—') },
                      { title: 'Thời gian kết thúc', dataIndex: 'maintEnd', key: 'maintEnd', width: 150, align: 'center' as const, render: (v: string, rec: any) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : (rec.endTime || rec.end || '—') },
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
                    dataSource={(Array.isArray((r as any)?.incidentList) ? (r as any).incidentList : [])}
                    emptyText="Chưa có dữ liệu"
                    showTotal={(total) => `Tổng cộng ${total}`}
                    rowKey={(rec: any, idx?: number) => rec?.id || rec?.incidentCode || String(idx)}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'incidentCode', render: (v: string, rec: any) => v || rec.code || '—' },
                      { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'incidentType', render: (v: string, rec: any) => v || rec.type || '—' },
                      { title: 'Địa điểm', dataIndex: 'incidentLocation', key: 'incidentLocation', render: (v: string) => v || '—' },
                      { title: 'Thời gian', dataIndex: 'incidentTime', key: 'incidentTime', width: 150, align: 'center' as const, render: (v: string, rec: any) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : (rec.time ? dayjs(rec.time).format('DD/MM/YYYY HH:mm') : '—') },
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
                {([
                  ['Trạng thái', r.approvalStatus && approvalStyleMap[r.approvalStatus] ? <span style={statusBadgeStyle(approvalStyleMap[r.approvalStatus].color)}>{approvalStyleMap[r.approvalStatus].label}</span> : approvalLabel, true],
                  ['Cán bộ cập nhật', <span key="updBy" style={{ fontWeight: fontWeightBold }}>{userMap.get(r.updatedBy || '') || r.updatedBy || '—'}</span>],
                  ['Ngày cập nhật', r.updatedAt ? dayjs(r.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                  ['Người tạo', <span key="createdBy" style={{ fontWeight: fontWeightBold }}>{userMap.get(r.createdBy || '') || r.createdBy || '—'}</span>],
                  ['Ngày tạo', r.createdAt ? dayjs(r.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                  ['Cán bộ phê duyệt cấp Cảng vụ/Chi cục', <span key="apv1" style={{ fontWeight: fontWeightBold }}>{(() => { const v = (r as any).approverLevel1; return v ? (userMap.get(String(v)) || String(v)) : '—'; })()}</span>],
                  ['Ngày phê duyệt cấp Cảng vụ/Chi cục', (() => { const v = (r as any).approvedDateLevel1; return v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—'; })()],
                  ['Cán bộ phê duyệt cấp Cục', <span key="apv2" style={{ fontWeight: fontWeightBold }}>{(() => { const v = (r as any).approverLevel2; return v ? (userMap.get(String(v)) || String(v)) : '—'; })()}</span>],
                  ['Ngày phê duyệt cấp Cục', (() => { const v = (r as any).approvedDateLevel2; return v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—'; })()],
                  ['Lý do từ chối', (r as any).rejectionReason || '—'],
                ] as any[]).map(([label, value, fullWidth], i) => (
                  <div key={i} className="chk-detail-row" style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
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

    {/* GIS Location Selector Modal — xem vị trí trên bản đồ chuyên dụng (chuẩn VTS CHK, chế độ XEM: disabled) */}
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
