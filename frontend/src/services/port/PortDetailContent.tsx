import { useState } from 'react';
import { Table, Select, Pagination, Tabs } from 'antd';
import {
  EnvironmentOutlined, ApartmentOutlined, FileOutlined, EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  colors, actionPrimary, textPrimary, textSecondary, textTertiary,
  surfaceCard, spaceSm,
  fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  radiusPill, statusBadgeStyle,
  statusOperational, statusAttention, statusCritical,
} from '../../themetokenchk';
import type { CangBienResponse } from './types';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from './schema';
import { fmtNum } from '../../utils/numFmt';
import PagedTable from '../../components/list-view/PagedTable';
import type { Symbol } from '../symbolService';

// ── Helpers (module-level, đồng bộ PortListPage) ───────────────────

const KCHT_TYPE_OPTIONS = [
  'Bến cảng', 'Bến phao', 'Cầu cảng', 'Cơ sở sửa chữa, đóng tàu', 'Khu chuyển tải',
  'Đèn biển và nhà trạm gắn liền với đèn biển', 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ',
  'Luồng hàng hải', 'Khu neo đậu', 'Nhà trạm quản lý vận hành Phao, tiêu', 'Trạm Radar',
  'Khu tránh, trú bão', 'Trung tâm điều hành VTS', 'Hệ thống thông tin liên lạc VHF', 'Hệ thống VTS',
].map((label) => ({ value: label, label }));

const hdrCell = () => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px', whiteSpace: 'nowrap' as const } });

// Bảng tham chiếu (Thông tin quy hoạch / Vận hành khai thác / Bảo trì / Sự cố)
const TAB_PAGE_SIZE = 20;
function PortRefTable({ title, emptyText, columns, dataSource = [] }: { title: string; emptyText: string; columns: Array<{ title: string; dataIndex?: string; width?: number }>; dataSource?: any[] }) {
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
  infraPage,
  setInfraPage,
  infraPageSize,
  setInfraPageSize,
  openKchtDetail,
  ddToDms,
}: PortDetailContentProps) {
  return (
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
                  { label: 'Đơn vị quản lý', value: orgLevel2Map.get(selectedRecord.orgUnitId || '') || selectedRecord.orgUnitName || '—', bold: true },
                  { label: 'Nhóm cảng biển', value: selectedRecord.portGroup ? 'Nhóm ' + selectedRecord.portGroup : '—', bold: true },
                  { label: 'Mã cảng biển', value: selectedRecord.portCode, badge: true },
                  { label: 'Tên cảng biển', value: selectedRecord.portName, bold: true },
                  { label: 'Phân cấp cảng biển', value: selectedRecord.portClass != null ? (selectedRecord.portClass === 5 ? 'Cấp đặc biệt' : `Cấp ${selectedRecord.portClass}`) : '—' },
                  { label: 'Địa điểm (Tỉnh/Thành phố)', value: selectedRecord.province || '—' },
                  { label: 'Địa điểm chi tiết', value: selectedRecord.detailedLocation || '—' },
                  { label: 'Phạm vi vùng nước cảng biển', value: selectedRecord.waterAreaScope || '—' },
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
                    <span className="chk-detail-value" style={row.bold ? { fontWeight: fontWeightBold } : undefined}>
                      {row.badge ? (
                        <span style={statusBadgeStyle(actionPrimary)}>{row.value}</span>
                      ) : row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          key: 'gis', label: `Thông tin vị trí (${(() => { const wkt = (selectedRecord as any)?.coordinates || ''; const arr = (selectedRecord as any)?.coordinateList; if (Array.isArray(arr) && arr.length) return arr.length; const mm = typeof wkt === 'string' ? wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/) : null; if (mm) return mm[1].split('),(').length; return typeof wkt === 'string' && /POINT\s*\(/.test(wkt) ? 1 : 0; })()})`,
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
              {/* GPS Coordinates table */}
              <div style={{ marginTop: spaceSm, padding: '0 12px' }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span>
                {(() => {
                  const wkt = (selectedRecord as any).coordinates || '';
                  const arr = (selectedRecord as any).coordinateList;
                  const pts: Array<{ lat: number; lng: number }> = [];
                  if (arr && Array.isArray(arr) && arr.length > 0) {
                    pts.push(...arr.map((c: any) => ({ lat: c.latitude ?? c.lat, lng: c.longitude ?? c.lng })));
                  } else if (wkt) {
                    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/);
                    if (mm) {
                      mm[1].split('),(').forEach((pt: string) => {
                        const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
                        pts.push({ lat: Number(parts[1]), lng: Number(parts[0]) });
                      });
                    } else {
                      const m = wkt.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
                      if (m) pts.push({ lat: Number(m[2]), lng: Number(m[1]) });
                    }
                  } else if (selectedRecord.latitude != null && selectedRecord.longitude != null) {
                    pts.push({ lat: selectedRecord.latitude, lng: selectedRecord.longitude });
                  }
                  return (
                    <PagedTable dataSource={pts.map((p) => ({ ...p }))}
                      emptyText={<div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><EnvironmentOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có tọa độ</span></div>}
                    >
                      <Table.Column title="Vĩ độ (N)" key="lat" align="center"
                        render={(_: any, record: any) => {
                          const dms = ddToDms(record.lat);
                          return <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{dms.d !== null ? `${dms.d}° ${dms.m ?? 0}' ${dms.s ?? 0}"` : '—'}</span>;
                        }}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                      <Table.Column title="Kinh độ (E)" key="lng" align="center"
                        render={(_: any, record: any) => {
                          const dms = ddToDms(record.lng);
                          return <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{dms.d !== null ? `${dms.d}° ${dms.m ?? 0}' ${dms.s ?? 0}"` : '—'}</span>;
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
          key: 'infra', label: 'Công trình KCHT trực thuộc',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Công trình KCHT trực thuộc</span>
              </div>
              <PagedTable dataSource={((selectedRecord as any).infrastructureList || []).map((i: any) => ({ ...i }))}
                emptyText={<div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><ApartmentOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có công trình KCHT</span></div>}
              >
                  <Table.Column title="Tên Công Trình" dataIndex="infraName" key="name" align="center"
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Số Lượng" dataIndex="quantity" key="qty" width={100} align="center"
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              </PagedTable>
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
          key: 'infraOther', label: 'Danh sách kết cấu hạ tầng khác',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Loại kết cấu hạ tầng</span>
                <Select
                  allowClear
                  showSearch
                  placeholder="Chọn loại kết cấu hạ tầng"
                  value={infraFilter}
                  onChange={(v: string | undefined) => { setInfraFilter(v || undefined); setInfraPage(1); }}
                  style={{ width: 360, borderRadius: radiusPill, height: 40 }}
                  options={KCHT_TYPE_OPTIONS}
                />
              </div>
              <Table
                className="list-view-table"
                rowKey="id"
                dataSource={otherInfra.filter((r) => !infraFilter || r.typeLabel === infraFilter).slice((infraPage - 1) * infraPageSize, infraPage * infraPageSize)}
                pagination={false} size="middle" bordered
                scroll={{ x: 'max-content' }}
                style={{ marginLeft: 12, marginRight: 12 }}
                locale={{ emptyText: <div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><ApartmentOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có kết cấu hạ tầng khác</span></div> }}
              >
                <Table.Column title="STT" key="stt" width={60} align="center" fixed="left" render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(infraPage - 1) * infraPageSize + i + 1}</span>} onHeaderCell={hdrCell} />
                <Table.Column title="Tên kết cấu hạ tầng" key="name" dataIndex="name" align="center"
                  render={(_: any, r: any) => <span style={{ color: actionPrimary, cursor: 'pointer', fontWeight: fontWeightBold }} onClick={() => openKchtDetail(r.kchtType, r.id)}>{r.name}</span>}
                  onHeaderCell={hdrCell} />
                <Table.Column title="Thao tác" key="actions" width={120} align="center" fixed="right"
                  render={(_: any, r: any) => <EyeOutlined style={{ color: actionPrimary, cursor: 'pointer', fontSize: fontSizeMd + 2 }} onClick={() => openKchtDetail(r.kchtType, r.id)} />}
                  onHeaderCell={hdrCell} />
              </Table>
              <div style={{ marginRight: 12 }}>
                <Pagination
                  total={otherInfra.filter((r) => !infraFilter || r.typeLabel === infraFilter).length}
                  current={infraPage} pageSize={infraPageSize}
                  onChange={(p, ps) => { setInfraPage(p); setInfraPageSize(ps); }}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'plan', label: 'Thông tin quy hoạch',
          children: <PortRefTable title="Thông tin quy hoạch" emptyText="Chưa có thông tin quy hoạch" columns={[
            { title: 'Số quyết định quy hoạch', dataIndex: 'planDecisionNo', width: 200 },
            { title: 'Ngày quyết định quy hoạch', dataIndex: 'planDecisionDate', width: 180 },
          ]} />,
        },
        {
          key: 'operation', label: 'Vận hành & bảo trì',
          children: (
            <div style={{ paddingTop: 3 }}>
              <PortRefTable title="Thông tin vận hành khai thác" emptyText="Chưa có dữ liệu vận hành khai thác" dataSource={(selectedRecord as any)?.operationPlanList} columns={[
                { title: 'Mã kế hoạch', dataIndex: 'opPlanCode', width: 180 },
                { title: 'Tên kế hoạch', dataIndex: 'opPlanName', width: 220 },
                { title: 'Ngày bắt đầu', dataIndex: 'opStartDate', width: 200 },
                { title: 'Ngày kết thúc', dataIndex: 'opEndDate', width: 200 },
              ]} />
              <PortRefTable title="Thông tin bảo trì" emptyText="Chưa có dữ liệu bảo trì" dataSource={(selectedRecord as any)?.maintenancePlanList} columns={[
                { title: 'Mã kế hoạch', dataIndex: 'maintCode', width: 180 },
                { title: 'Tên kế hoạch', dataIndex: 'maintName', width: 220 },
                { title: 'Thời gian bắt đầu', dataIndex: 'maintStart', width: 200 },
                { title: 'Thời gian kết thúc', dataIndex: 'maintEnd', width: 200 },
              ]} />
              <PortRefTable title="Thông tin sự cố" emptyText="Chưa có dữ liệu sự cố" dataSource={(selectedRecord as any)?.incidentList} columns={[
                { title: 'Mã sự cố', dataIndex: 'incidentCode', width: 150 },
                { title: 'Loại sự cố', dataIndex: 'incidentType', width: 150 },
                { title: 'Địa điểm', dataIndex: 'incidentLocation', width: 200 },
                { title: 'Thời gian', dataIndex: 'incidentTime', width: 180 },
              ]} />
            </div>
          ),
        },
        {
          key: 'approval', label: 'Xử lý & theo dõi',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="chk-detail-grid">
                {[
                  ['Trạng thái phê duyệt', (() => { const b = trangThaiPheDuyetBadge(selectedRecord.approvalStatus || ''); let c = textTertiary; if (b.color === 'green') c = statusOperational; else if (b.color === 'red') c = statusCritical; else if (b.color === 'orange') c = statusAttention; else if (b.color === 'blue') c = actionPrimary; return <span style={statusBadgeStyle(c)}>{b.label}</span>; })()],
                  ['Tình trạng hoạt động', (() => { const b = trangThaiHoatDongBadge(selectedRecord.operationalStatus || ''); let c = textTertiary; if (b.color === 'green') c = statusOperational; else if (b.color === 'red') c = statusCritical; else if (b.color === 'orange') c = statusAttention; else if (b.color === 'blue') c = actionPrimary; return <span style={statusBadgeStyle(c)}>{b.label}</span>; })()],
                  ['Người tạo', selectedRecord.createdByName || selectedRecord.createdBy || '—'],
                  ['Ngày tạo', selectedRecord.createdAt ? dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                  ['Người cập nhật', selectedRecord.updatedByName || selectedRecord.updatedBy || '—'],
                  ['Ngày cập nhật', selectedRecord.updatedAt ? dayjs(selectedRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                  ['Ngày gửi phê duyệt', (selectedRecord as any).submittedForApprovalAt ? dayjs((selectedRecord as any).submittedForApprovalAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                  ['Người gửi phê duyệt', userMap.get((selectedRecord as any).submittedForApprovalBy || '') || (selectedRecord as any).submittedForApprovalBy || '—'],
                  ['Phê duyệt cấp Cảng vụ', (selectedRecord as any).portAuthorityApprovedAt ? `${userMap.get((selectedRecord as any).portAuthorityApprovedBy || '') || (selectedRecord as any).portAuthorityApprovedBy || '—'} — ${dayjs((selectedRecord as any).portAuthorityApprovedAt).format('DD/MM/YYYY HH:mm:ss')}` : '—'],
                  ['Nội dung phê duyệt Cảng vụ', (selectedRecord as any).portAuthorityApprovalContent || '—'],
                  ['Phê duyệt cấp Cục', (selectedRecord as any).departmentApprovedAt ? `${userMap.get((selectedRecord as any).departmentApprovedBy || '') || (selectedRecord as any).departmentApprovedBy || '—'} — ${dayjs((selectedRecord as any).departmentApprovedAt).format('DD/MM/YYYY HH:mm:ss')}` : '—'],
                  ['Nội dung phê duyệt Cục', (selectedRecord as any).departmentApprovalContent || '—'],
                  ['Lý do từ chối', (selectedRecord as any).rejectionReason || '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="chk-detail-row" style={label === 'Nội dung phê duyệt Cảng vụ' || label === 'Nội dung phê duyệt Cục' || label === 'Lý do từ chối' ? { gridColumn: '1 / -1' } : undefined}>
                    <span className="chk-detail-label">{label}</span>
                    <span className="chk-detail-value" style={{ fontWeight: fontWeightBold }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
