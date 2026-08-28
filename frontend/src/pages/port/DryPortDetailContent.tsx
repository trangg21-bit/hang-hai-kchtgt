import React, { useState } from 'react';
import { Tabs, Button, Modal } from 'antd';
import { FileOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../themetokenchk';
import {
  textPrimary, textSecondary, textTertiary, surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold, spaceSm, spaceMd, spaceFormField,
  statusOperational, statusAttention, statusCritical, actionPrimary, statusBadgeStyle,
  outlineButtonStyle, primaryButtonStyle,
} from '../../themetokenchk';
import type { DryPort } from '../../types/port';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { resolveOrgFullPath } from '../../components/org-unit';

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
  const [systemOpen, setSystemOpen] = useState(true);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const approvalLabel = approvalStyleMap[r.approvalStatus || '']?.label || r.approvalStatus || '—';

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
                  ['Mã cảng cạn', <span key="dryPortCode" style={statusBadgeStyle(actionPrimary)}>{r.dryPortCode || '—'}</span>],
                  ['Tên cảng cạn', r.dryPortName || '—', true],
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
                  ['Trạng thái', (() => { const b = approvalStyleMap[r.approvalStatus || '']; return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : approvalLabel; })(),],
                ] as any[]).map(([label, value, bold, fullWidth], i) => (
                  <div key={i} className="chk-detail-row" style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                    <span className="chk-detail-label">{label}</span>
                    <span className="chk-detail-value" style={bold ? { fontWeight: fontWeightBold } : undefined}>{value}</span>
                  </div>
                ))}
              </div>
              <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setSystemOpen(!systemOpen)}>
                <span style={{ color: systemOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{systemOpen ? '▼' : '▶'} Thông tin hệ thống</span>
              </button>
              {systemOpen && (
                <div className="chk-detail-grid" style={{ marginTop: 4 }}>
                  {([
                    ['Người tạo', userMap.get(r.createdBy || '') || r.createdBy || '—', true],
                    ['Ngày tạo', r.createdAt ? dayjs(r.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                    ['Cán bộ cập nhật', userMap.get(r.updatedBy || '') || r.updatedBy || '—', true],
                    ['Ngày cập nhật', r.updatedAt ? dayjs(r.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                  ] as any[]).map(([label, value, bold], i) => (
                    <div key={i} className="chk-detail-row">
                      <span className="chk-detail-label">{label}</span>
                      <span className="chk-detail-value" style={bold ? { fontWeight: fontWeightBold } : undefined}>{value}</span>
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
        {
          key: 'incident', label: 'Thông tin sự cố',
          children: <DryPortRefTable title="Thông tin sự cố" emptyText="Chưa có dữ liệu" dataSource={(r as any)?.incidentList} columns={[
            { title: 'Mã sự cố', dataIndex: 'incidentCode', width: 150 },
            { title: 'Loại sự cố', dataIndex: 'incidentType', width: 150 },
            { title: 'Địa điểm', dataIndex: 'incidentLocation', width: 200 },
            { title: 'Thời gian', dataIndex: 'incidentTime', width: 180 },
          ]} />,
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
