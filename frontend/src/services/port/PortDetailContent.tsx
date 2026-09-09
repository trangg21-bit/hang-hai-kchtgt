import { useState } from 'react';
import { Select, Tabs, Modal, Button, Tooltip } from 'antd';
import {
  EnvironmentOutlined, FileOutlined, FileImageOutlined, EyeOutlined,
  DownloadOutlined,
  BarChartOutlined, DownOutlined, RightOutlined, AuditOutlined, BankOutlined, SlidersOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  colors, actionPrimary, textTertiary,
  surfaceCard, spaceSm, spaceMd, spaceFormField,
  fontSizeSm, fontSizeLg, fontWeightMedium, fontWeightBold,
  statusBadgeStyle, outlineButtonStyle, primaryButtonStyle,
  statusOperational, statusAttention, statusCritical,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';

// Berth render chuẩn dùng nền chữ 13.5 (BerthDetailContent:22) — để chữ/tên đề/giá trị khớp bến cảng.
const fontSizeMd = 13.5;
import type { CangBienResponse } from './types';
import { trangThaiPheDuyetBadge } from './schema';
import { fmtNum } from '../../utils/numFmt';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import api from '../../services/api';
import {
  detailLabelStyle, sectionBoxStyle, sectionHeaderStyle, sectionTitleStyle, generalScrollerStyle,
} from '../../components/detail-drawer/detailSkin';
import type { Symbol } from '../symbolService';

// ── Helpers (module-level, đồng bộ PortListPage) ───────────────────

const KCHT_TYPE_OPTIONS = [
  'Bến cảng', 'Bến phao', 'Cầu cảng', 'Cơ sở sửa chữa, đóng tàu', 'Khu chuyển tải',
  'Đèn biển và nhà trạm gắn liền với đèn biển', 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ',
  'Luồng hàng hải', 'Khu neo đậu', 'Nhà trạm quản lý vận hành Phao, tiêu', 'Trạm Radar',
  'Khu tránh, trú bão', 'Trung tâm điều hành VTS', 'Hệ thống thông tin liên lạc VHF', 'Hệ thống VTS',
].map((label) => ({ value: label, label }));

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
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<any>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const openFilePreview = async (file: any) => {
    const rec = file?.id ? file : (file?._current ?? file);
    const id: string | undefined = rec?.id ?? (selectedRecord as any)?.id;
    if (!rec?.id || !id) { toast.error('Không tìm thấy tệp để xem'); return; }
    setPreviewImageFile(rec);
    setPreviewImageUrl('');
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    try {
      const entityId = (selectedRecord as any)?.id;
      const res = await api.get(`/v1/ports/${entityId}/attachments/${rec.id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      setPreviewImageUrl(window.URL.createObjectURL(blob));
    } catch {
      toast.error('Không thể tải hình ảnh để xem chi tiết');
    } finally {
      setPreviewLoading(false);
    }
  };
  const downloadAttachment = async (fileId?: string, fileName?: string) => {
    const entityId = (selectedRecord as any)?.id;
    if (!fileId || !entityId) { return; }
    try {
      const res = await api.get(`/v1/ports/${entityId}/attachments/${fileId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(`Không thể tải xuống tệp: ${fileName || ''}`);
    }
  };
  const downloadFile = (file: any) => { void downloadAttachment(file?.id, file?.fileName || ''); };
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [indexOpen, setIndexOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [infraFilterOpen, setInfraFilterOpen] = useState(true);
  const [infraSubOpen, setInfraSubOpen] = useState(true);
  const [planOpen, setPlanOpen] = useState(true);

  return (
    <div className="port-detail-content-wrapper">
      <style>{`
        .port-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .port-detail-content-wrapper,
        .port-detail-content-wrapper .chk-detail-label,
        .port-detail-content-wrapper .chk-detail-value,
        .port-detail-content-wrapper .ant-table,
        .port-detail-content-wrapper .ant-table-cell,
        .port-detail-content-wrapper .ant-table-thead > tr > th,
        .port-detail-content-wrapper .ant-tabs-tab,
        .port-detail-content-wrapper .ant-btn,
        .port-detail-content-wrapper .ant-select,
        .port-detail-content-wrapper .ant-select-selection-item,
        .port-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .port-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .port-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: center !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .port-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .port-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .port-detail-content-wrapper .chk-detail-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
          color: ${colors.sidebarBg} !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          text-align: left !important;
          line-height: 1.5 !important;
        }

        .port-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .port-detail-content-wrapper .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .port-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .port-detail-content-wrapper .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }

        .port-detail-content-wrapper .chk-detail-row .sec-full-label,
        .port-detail-content-wrapper .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .port-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .port-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          display: flex !important;
          align-items: center !important;
        }

        .port-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-label {
          width: auto !important;
          min-width: auto !important;
          max-width: none !important;
          flex-shrink: 0 !important;
        }
        .port-detail-content-wrapper .chk-detail-row.chk-detail-row--compact .chk-detail-value {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          justify-content: flex-start !important;
        }

        @media (max-width: 960px) {
          .port-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .port-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .port-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .port-detail-content-wrapper .chk-detail-label,
          .port-detail-content-wrapper .sec-col1-label,
          .port-detail-content-wrapper .sec-col2-label,
          .port-detail-content-wrapper .sec-full-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }

        @media (max-width: 640px) {
          .port-detail-content-wrapper .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .port-detail-content-wrapper .chk-detail-row .chk-detail-label,
          .port-detail-content-wrapper .chk-detail-label,
          .port-detail-content-wrapper .sec-col1-label,
          .port-detail-content-wrapper .sec-col2-label,
          .port-detail-content-wrapper .sec-full-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            flex-shrink: 0 !important;
          }
          .port-detail-content-wrapper .chk-detail-value {
            width: 100% !important;
          }
        }
      `}</style>
    <Tabs
      defaultActiveKey="general"
      className="port-detail-tabs"
      tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={generalScrollerStyle}>
              <style>{`.ant-tabs-nav{margin-bottom:0!important}`}</style>
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <BankOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin cơ bản & Quản lý vận hành</span>
                  </div>
                </div>
                <div className="chk-detail-grid">
                {[
                  { label: 'Mã cảng biển', value: selectedRecord.portCode, badge: true },
                  { label: 'Tên cảng biển', value: selectedRecord.portName, bold: true },
                  { label: 'Nhóm cảng biển', value: selectedRecord.portGroup ? 'Nhóm ' + selectedRecord.portGroup : '', bold: true },
                  { label: 'Phân cấp cảng biển', value: selectedRecord.portClass != null ? (selectedRecord.portClass === 5 ? 'Cấp đặc biệt' : `Cấp ${selectedRecord.portClass}`) : '' },
                  { label: 'Đơn vị quản lý', value: orgLevel2Map.get(selectedRecord.orgUnitId || '') || selectedRecord.orgUnitName || '', bold: true },
                  { label: 'Địa điểm (Tỉnh/Thành phố)', value: selectedRecord.province || '' },
                  { label: 'Địa điểm chi tiết', value: selectedRecord.detailedLocation || '', fullWidth: true },
                  { label: 'Phạm vi vùng nước cảng biển', value: selectedRecord.waterAreaScope || '', fullWidth: true },
                ].map((row, i) => (
                  <div key={i} className={`chk-detail-row${row.fullWidth ? ' chk-detail-row--full' : ''}`}>
                    <span className={`chk-detail-label ${row.fullWidth ? 'sec-full-label' : (i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label')}`}>{row.label}</span>
                    <span className="chk-detail-value" style={row.bold ? { fontWeight: fontWeightBold } : undefined}>
                      {row.badge ? (
                        <span style={statusBadgeStyle(actionPrimary)}>{row.value}</span>
                      ) : row.value}
                    </span>
                  </div>
                ))}
                </div>
              </div>

              <div style={sectionBoxStyle}>
                <div onClick={() => setIndexOpen(!indexOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: indexOpen ? 10 : 0, paddingBottom: indexOpen ? 8 : 0, borderBottom: indexOpen ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={sectionTitleStyle}>
                    <BarChartOutlined style={{ color: actionPrimary }} />
                    <span>Chỉ số tổng hợp</span>
                  </div>
                  <span style={{ color: actionPrimary, fontSize: 12 }}>
                    {indexOpen ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </div>
                {indexOpen && (
                <div className="chk-detail-grid" style={{ marginTop: indexOpen ? 4 : 0 }}>
                  {[
                    { label: 'Tổng số bến cảng', value: selectedRecord.totalBerths != null ? fmtNum(selectedRecord.totalBerths) : '' },
                    { label: 'Tổng số khu neo đậu, khu chuyển tải', value: selectedRecord.totalAnchoragesTransshipment != null ? fmtNum(selectedRecord.totalAnchoragesTransshipment) : '' },
                    { label: 'Tổng số tuyến luồng hàng hải công cộng', value: selectedRecord.totalPublicChannels != null ? fmtNum(selectedRecord.totalPublicChannels) : '' },
                    { label: 'Tổng số tuyến luồng hàng hải chuyên dùng', value: selectedRecord.totalDedicatedChannels != null ? fmtNum(selectedRecord.totalDedicatedChannels) : '' },
                    { label: 'Tổng chiều dài luồng hàng hải công cộng (km)', value: selectedRecord.totalPublicChannelLength != null ? fmtNum(selectedRecord.totalPublicChannelLength) : '' },
                    { label: 'Tổng chiều dài luồng hàng hải chuyên dùng (km)', value: selectedRecord.totalDedicatedChannelLength != null ? fmtNum(selectedRecord.totalDedicatedChannelLength) : '' },
                    { label: 'Tổng số phao tiêu, báo hiệu hàng hải trên luồng', value: selectedRecord.totalBuoysBeacons != null ? fmtNum(selectedRecord.totalBuoysBeacons) : '' },
                    { label: 'Tổng số đê, kè', value: selectedRecord.totalDikes != null ? fmtNum(selectedRecord.totalDikes) : '' },
                    { label: 'Tổng chiều dài hệ thống đê, kè (km)', value: selectedRecord.totalDikeLength != null ? fmtNum(selectedRecord.totalDikeLength) : '' },
                    { label: 'Tổng số đèn biển, đăng, tiêu độc lập', value: selectedRecord.totalLighthouses != null ? fmtNum(selectedRecord.totalLighthouses) : '' },
                    { label: 'Số lượng bến phao', value: selectedRecord.buoyBerthCount != null ? fmtNum(selectedRecord.buoyBerthCount) : '' },
                    { label: 'Số lượng khu neo đậu', value: selectedRecord.anchorageCount != null ? fmtNum(selectedRecord.anchorageCount) : '' },
                    { label: 'Số lượng khu chuyển tải', value: selectedRecord.transshipmentCount != null ? fmtNum(selectedRecord.transshipmentCount) : '' },
                    { label: 'Các khu nước, vùng nước khác', value: selectedRecord.otherWaterAreas || '', fullWidth: true },
                    { label: 'Ghi chú', value: selectedRecord.remarks || '', fullWidth: true },
                  ].map((row, i) => (
                    <div key={i} className={`chk-detail-row${row.fullWidth ? ' chk-detail-row--full' : ''}`}>
                      <span className={`chk-detail-label ${row.fullWidth ? 'sec-full-label' : (i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label')}`}>{row.label}</span>
                      <span className="chk-detail-value">{row.value}</span>
                    </div>
                  ))}
                </div>
                )}
              </div>

              <div style={{ ...sectionBoxStyle, padding: approvalOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                <div onClick={() => setApprovalOpen(!approvalOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: approvalOpen ? 10 : 0, paddingBottom: approvalOpen ? 8 : 0, borderBottom: approvalOpen ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={sectionTitleStyle}>
                    <AuditOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin phê duyệt</span>
                  </div>
                  <span style={{ color: actionPrimary, fontSize: 12 }}>
                    {approvalOpen ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </div>
                {approvalOpen && (
                <div className="chk-detail-grid">
                  {[
                    ['Trạng thái', (() => { const b = trangThaiPheDuyetBadge(selectedRecord.approvalStatus || ''); let c = textTertiary; if (b.color === 'green') c = statusOperational; else if (b.color === 'red') c = statusCritical; else if (b.color === 'orange') c = statusAttention; else if (b.color === 'blue') c = actionPrimary; return b.label ? <span style={statusBadgeStyle(c)}>{b.label}</span> : ''; })()],
                    ['Người tạo', selectedRecord.createdByName || selectedRecord.createdBy || ''],
                    ['Ngày tạo', selectedRecord.createdAt ? dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss') : ''],
                    ['Cán bộ cập nhật', selectedRecord.updatedByName || selectedRecord.updatedBy || ''],
                    ['Ngày cập nhật', selectedRecord.updatedAt ? dayjs(selectedRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss') : ''],
                  ].map(([label, value], i) => (
                    <div key={i} className="chk-detail-row">
                      <span className={`chk-detail-label ${i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{label}</span>
                      <span className="chk-detail-value" style={label === 'Người tạo' || label === 'Cán bộ cập nhật' ? { fontWeight: fontWeightBold } : undefined}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          ),
        },
        {
          key: 'gis', label: `Thông tin vị trí (${parseGisCoordinates(selectedRecord).length})`,
          children: (
            <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
              <div style={sectionBoxStyle}>
                <div className="chk-detail-grid">
                  {[
                  ['Loại đối tượng', selectedRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : selectedRecord.geometryType === 'LINE' ? 'Đối tượng đường' : selectedRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : ''],
                  ['Biểu tượng', (() => { const sym = symbols.find((s) => s.id === selectedRecord.mapSymbolId); return sym ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{sym.image ? <img src={sym.image} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : null}{sym.name}</span> : (selectedRecord.mapSymbolId || ''); })(),],
                  ['Hệ quy chiếu', selectedRecord.coordinateSystem === 1 ? 'WGS-84' : selectedRecord.coordinateSystem === 2 ? 'VN-2000' : ''],
                  ['Quy tắc hiển thị', (selectedRecord.geometryType || (selectedRecord as any).coordinates) ? 'Độ, phút, giây (DMS)' : ''],
                ].map(([label, value], i) => (
                  <div key={i} className="chk-detail-row">
                    <span className={`chk-detail-label ${i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{label}</span>
                    <span className="chk-detail-value">{value}</span>
                  </div>
                ))}
                </div>
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
                scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                dataSource={parseGisCoordinates(selectedRecord).map((p) => ({ ...p }))}
                  emptyText="Chưa có tọa độ GPS nào"
                  columns={[
                    { title: 'STT', width: 50 },
                    { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lat); return dms.d !== null ? `${dms.d}° ${dms.m ?? 0}' ${dms.s ?? 0}" N` : ''; } },
                    { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lng); return dms.d !== null ? `${dms.d}° ${dms.m ?? 0}' ${dms.s ?? 0}" E` : ''; } },
                  ]}
                />
              </div>
            </div>
          ),
        },
        {
          key: 'files', label: `File đính kèm (${detailFiles.length})`,
          children: (
            <div style={{ paddingTop: 6 }}>
              <div style={{ marginBottom: spaceSm }}>
                <span style={detailLabelStyle}>File đính kèm</span>
              </div>
              <DetailTable
                scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
                dataSource={detailFiles.map((f) => ({ ...f }))}
                emptyText="Chưa có tài liệu đính kèm"
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Tên tài liệu', dataIndex: 'fileName', key: 'fileName', render: (v: string, rec: any) => { const isImg = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(v || ''); return (<span title={isImg ? `${v} (Nhấp để xem chi tiết ảnh)` : `${v} (Nhấp để tải xuống)`} onClick={() => { if (isImg) openFilePreview(rec); else void downloadAttachment(rec?.id, v); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: actionPrimary, fontWeight: fontWeightMedium, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{isImg ? <FileImageOutlined style={{ color: actionPrimary, flexShrink: 0 }} /> : <FileOutlined style={{ color: textTertiary, flexShrink: 0 }} />}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || ''}</span></span>); } },
                  { title: 'Dung lượng', dataIndex: 'fileSize', key: 'fileSize', width: 120, align: 'right' as const, render: (v: number) => v ? (v > 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(2)} MB` : `${(v / 1024).toFixed(1)} KB`) : '' },
                  { title: 'Người tải lên', dataIndex: 'uploadedBy', key: 'uploadedBy', width: 180, render: (v: string) => userMap.get(v) || v || '' },
                  { title: 'Ngày tải lên', dataIndex: 'uploadedAt', key: 'uploadedAt', width: 135, align: 'center' as const, render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '' },
                  {
                    title: 'Thao tác',
                    key: 'actions',
                    width: 90,
                    align: 'center' as const,
                    render: (_: any, rec: any) => {
                      const fname: string = rec?.fileName || '';
                      const isImg = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fname);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {isImg && (
                            <Tooltip title="Xem chi tiết ảnh">
                              <Button type="text" size="small" icon={<EyeOutlined style={{ color: actionPrimary, fontSize: 16 }} />} onClick={() => openFilePreview(rec)} />
                            </Tooltip>
                          )}
                          <Tooltip title="Tải xuống tệp">
                            <Button type="text" size="small" icon={<DownloadOutlined style={{ color: actionPrimary, fontSize: 16 }} />} onClick={() => void downloadAttachment(rec?.id, rec?.fileName)} />
                          </Tooltip>
                        </div>
                      );
                    },
                  },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'infraOther', label: 'Kết cấu hạ tầng',
          children: (
            <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
              {/* Box 1: Danh sách KCHT thuộc cảng biển (kèm lọc loại) */}
              <div style={{ ...sectionBoxStyle, padding: infraFilterOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setInfraFilterOpen(!infraFilterOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: infraFilterOpen ? 12 : 0, paddingBottom: infraFilterOpen ? 8 : 0, borderBottom: infraFilterOpen ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={sectionTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Kết cấu hạ tầng thuộc cảng biển</span>
                    {infraFilterOpen && (
                      <Select allowClear showSearch placeholder="Chọn loại kết cấu hạ tầng" value={infraFilter || undefined}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(v: string | undefined) => setInfraFilter(v || undefined)}
                        options={KCHT_TYPE_OPTIONS} style={{ width: 240, borderRadius: 999, height: 32, marginLeft: 12 }} />
                    )}
                  </div>
                  <span style={{ color: actionPrimary, fontSize: 12 }}>
                    {infraFilterOpen ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </div>
                {infraFilterOpen && (
                  <DetailTable
                    scrollY={160}
                    dataSource={otherInfra.filter((r) => !infraFilter || r.typeLabel === infraFilter)}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r.id || r.name}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Loại kết cấu hạ tầng', dataIndex: 'typeLabel', key: 'type', render: (v: string, rec: any) => <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary }}>{rec.typeLabel || v || ''}</span> },
                      { title: 'Tên kết cấu hạ tầng', dataIndex: 'name', key: 'name', render: (v: string, rec: any) => <span style={{ fontSize: fontSizeMd, color: actionPrimary, cursor: 'pointer', fontWeight: fontWeightBold }} onClick={() => openKchtDetail(rec.kchtType, rec.id)}>{v || ''}</span> },
                      { title: 'Thao tác', key: 'actions', width: 100, align: 'center' as const, render: (_v: any, rec: any) => (
                        <Tooltip title="Xem chi tiết">
                          <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: actionPrimary, fontSize: fontSizeMd }}
                            onClick={() => openKchtDetail(rec.kchtType, rec.id)} />
                        </Tooltip>
                      ) },
                    ]}
                  />
                )}
              </div>

              {/* Box 2: Công trình KCHT trực thuộc */}
              <div style={{ ...sectionBoxStyle, padding: infraSubOpen ? '12px 18px 12px 18px' : '10px 18px', marginTop: spaceMd }}>
                <div onClick={() => setInfraSubOpen(!infraSubOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: infraSubOpen ? 12 : 0, paddingBottom: infraSubOpen ? 8 : 0, borderBottom: infraSubOpen ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={sectionTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Công trình KCHT trực thuộc</span>
                  </div>
                  <span style={{ color: actionPrimary, fontSize: 12 }}>
                    {infraSubOpen ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </div>
                {infraSubOpen && (
                  <DetailTable
                    scrollY={160}
                    dataSource={((selectedRecord as any).infrastructureList || []).map((i: any) => ({ ...i }))}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r.stt ?? r.infraName ?? r.name}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Tên công trình', dataIndex: 'infraName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                      { title: 'Số lượng', dataIndex: 'quantity', key: 'qty', width: 100, align: 'center' as const, render: (v: number) => v ?? '' },
                    ]}
                  />
                )}
              </div>
            </div>
          ),
        },
        {
          key: 'plan', label: 'Thông tin quy hoạch',
          children: (
            <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
              {/* Box: Thông tin quy hoạch (chuẩn toggle Vận hành & bảo trì) */}
              <div style={{ ...sectionBoxStyle, padding: planOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setPlanOpen(!planOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: planOpen ? 12 : 0, paddingBottom: planOpen ? 8 : 0, borderBottom: planOpen ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={sectionTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin quy hoạch</span>
                  </div>
                  <span style={{ color: actionPrimary, fontSize: 12 }}>
                    {planOpen ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </div>
                {planOpen && (
                  <DetailTable
                    scrollY={160}
                    dataSource={(selectedRecord as any)?.planList || []}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r?.id || r?.planDecisionNo || r?.planNo || 'row'}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Số quyết định quy hoạch', dataIndex: 'planDecisionNo', key: 'planNo', render: (v: string, rec: any) => v || rec?.decisionNo || rec?.planNo || '' },
                      { title: 'Ngày quyết định quy hoạch', dataIndex: 'planDecisionDate', key: 'planDate', width: 320, align: 'center' as const, render: (v: string, rec: any) => dayjs(v || rec?.decisionDate || rec?.planDate).isValid() ? dayjs(v || rec?.decisionDate || rec?.planDate).format('DD/MM/YYYY') : '' },
                    ]}
                  />
                )}
              </div>
            </div>
          ),
        },
        {
          key: 'operation', label: 'Vận hành & bảo trì',
          children: (
            <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
              {/* ── Section Vận hành ── */}
              <div style={{ ...sectionBoxStyle, padding: operationOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setOperationOpen(!operationOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: operationOpen ? 12 : 0, paddingBottom: operationOpen ? 8 : 0, borderBottom: operationOpen ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={sectionTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin vận hành khai thác</span>
                  </div>
                  <span style={{ color: actionPrimary, fontSize: 12 }}>
                    {operationOpen ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </div>
                {operationOpen && (
                  <DetailTable
                    scrollY={160}
                    dataSource={(selectedRecord as any)?.operationPlanList || []}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r?.id || r?.opPlanCode || r?.planCode || 'row'}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'opPlanCode', key: 'code', render: (v: string, rec: any) => v || rec?.planCode || (rec?.code ?? '') },
                      { title: 'Tên kế hoạch', dataIndex: 'opPlanName', key: 'name', render: (v: string, rec: any) => v || rec?.planName || (rec?.name ?? '') },
                      { title: 'Ngày bắt đầu', dataIndex: 'opStartDate', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => dayjs(v || rec?.planStartDate || rec?.startDate).isValid() ? dayjs(v || rec?.planStartDate || rec?.startDate).format('DD/MM/YYYY') : '' },
                      { title: 'Ngày kết thúc', dataIndex: 'opEndDate', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => dayjs(v || rec?.planEndDate || rec?.endDate).isValid() ? dayjs(v || rec?.planEndDate || rec?.endDate).format('DD/MM/YYYY') : '' },
                    ]}
                  />
                )}
              </div>

              {/* ── Section Bảo trì ── */}
              <div style={{ ...sectionBoxStyle, padding: maintenanceOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setMaintenanceOpen(!maintenanceOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: maintenanceOpen ? 12 : 0, paddingBottom: maintenanceOpen ? 8 : 0, borderBottom: maintenanceOpen ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={sectionTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin bảo trì</span>
                  </div>
                  <span style={{ color: actionPrimary, fontSize: 12 }}>
                    {maintenanceOpen ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </div>
                {maintenanceOpen && (
                  <DetailTable
                    scrollY={160}
                    dataSource={(selectedRecord as any)?.maintenancePlanList || []}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r?.id || r?.maintCode || r?.planCode || 'row'}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã kế hoạch', dataIndex: 'maintCode', key: 'code', render: (v: string, rec: any) => v || rec?.planCode || (rec?.code ?? '') },
                      { title: 'Tên kế hoạch', dataIndex: 'maintName', key: 'name', render: (v: string, rec: any) => v || rec?.planName || (rec?.name ?? '') },
                      { title: 'Thời gian bắt đầu', dataIndex: 'maintStart', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => dayjs(v || rec?.startTime || rec?.startDate).isValid() ? dayjs(v || rec?.startTime || rec?.startDate).format('DD/MM/YYYY') : '' },
                      { title: 'Thời gian kết thúc', dataIndex: 'maintEnd', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => dayjs(v || rec?.endTime || rec?.endDate).isValid() ? dayjs(v || rec?.endTime || rec?.endDate).format('DD/MM/YYYY') : '' },
                    ]}
                  />
                )}
              </div>

              {/* ── Section Sự cố ── */}
              <div style={{ ...sectionBoxStyle, padding: incidentOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                <div onClick={() => setIncidentOpen(!incidentOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: incidentOpen ? 12 : 0, paddingBottom: incidentOpen ? 8 : 0, borderBottom: incidentOpen ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={sectionTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin sự cố</span>
                  </div>
                  <span style={{ color: actionPrimary, fontSize: 12 }}>
                    {incidentOpen ? <DownOutlined /> : <RightOutlined />}
                  </span>
                </div>
                {incidentOpen && (
                  <DetailTable
                    scrollY={160}
                    dataSource={(selectedRecord as any)?.incidentList || []}
                    emptyText="Chưa có dữ liệu"
                    rowKey={(r: any) => r?.id || r?.incidentCode || 'row'}
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec?.code || '' },
                      { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec?.type || '' },
                      { title: 'Địa điểm', dataIndex: 'incidentLocation', key: 'location', render: (v: string, rec: any) => v || rec?.location || '' },
                      { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'center' as const, render: (v: string, rec: any) => dayjs(v || rec?.time).isValid() ? dayjs(v || rec?.time).format('DD/MM/YYYY') : '' },
                    ]}
                  />
                )}
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
      {/* Modal xem chi tiết hình ảnh */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileImageOutlined style={{ color: actionPrimary, fontSize: 18 }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              {previewImageFile?.fileName || 'Xem chi tiết hình ảnh'}
            </span>
            {previewImageFile?.fileSize ? (
              <span style={{ fontSize: fontSizeSm, color: textTertiary, fontWeight: 'normal' }}>
                ({previewImageFile.fileSize > 1024 * 1024 ? `${(previewImageFile.fileSize / (1024 * 1024)).toFixed(2)} MB` : `${(previewImageFile.fileSize / 1024).toFixed(1)} KB`})
              </span>
            ) : null}
          </div>
        }
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => previewImageFile && downloadFile(previewImageFile)}
            style={{ borderRadius: 999 }}
          >
            Tải xuống
          </Button>,
          <Button key="close" type="primary" onClick={() => setPreviewModalOpen(false)} style={{ borderRadius: 999, background: actionPrimary, borderColor: actionPrimary }}>
            Đóng
          </Button>,
        ]}
        width="min(800px, 90vw)"
        centered
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '16px 0', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8 }}>
          {previewLoading ? (
            <div style={{ color: textTertiary }}>Đang tải hình ảnh...</div>
          ) : previewImageUrl ? (
            <img
              src={previewImageUrl}
              alt={previewImageFile?.fileName || 'Ảnh đính kèm'}
              style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            />
          ) : (
            <div style={{ color: textTertiary }}>Không thể hiển thị hình ảnh</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
