import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { PERMISSIONS } from '../../constants/permissions';
import { fmtNum, fmtInputNumber } from '../../utils/numFmt';
import {
  Alert,
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Input,
  Select,
  Tooltip,
  Spin,
  Modal,
  Form,
  InputNumber,
  Typography,
  Descriptions,
  Divider,
  Tabs,
  Upload,
  DatePicker,
  Radio,
  Drawer,
  Table,
} from 'antd';
import { OrgUnitTreeSelect, resolveOrgLevel2Name, resolveOrgFullPath } from '../../components/org-unit';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  EyeOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  ClockCircleFilled,
  HourglassOutlined,
  ArrowRightOutlined,
  UploadOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  DownOutlined,
  UpOutlined,
  FileOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  ApartmentOutlined,
  CompassOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { berthCRUD, waterZoneCRUD, pierCRUD } from '../../services/portService';
import BerthDetailContent from '../../pages/port/BerthDetailContent';
import PierDetailContent from '../../pages/port/PierDetailContent';
import { userService } from '../../services/userService';
import { waterZoneApi } from '../../app/waterzone/api';
import { lineObjectService } from '../../services/lineObjectService';
import { LineObject } from '../../types/lineObject';
import {
  fetchCangBienList,
  deleteCangBien,
  approveCangBienC1,
  approveCangBienC2,
  submitCangBien,
  rejectCangBien,
  fetchCangBienById,
  updateCangBien,
} from './api';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge, TRANG_THAI_HOAT_DONG_OPTIONS } from './schema';
import type { CangBienResponse } from './types';
import toast, { message, modal } from '../../components/ToastNotification';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { organizationService } from '../../services/organizationService';
import { documentApi } from '../../app/document/api';
import DocumentUploadModal from '../../app/document/DocumentUploadModal';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import api from '../../services/api';
import dayjs from 'dayjs';
import { symbolService } from '../symbolService';
import type { Symbol } from '../symbolService';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, StatusTabs, DataTable } from '../../components/list-view';
import PagedTable from '../../components/list-view/PagedTable';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import PortFormContent from './PortFormContent';
import {
  statusDraft,
  statusOperational,
  statusCritical,
  statusAttention,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  spaceMd,
  spaceSm,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontSizeXl,
  fontWeightMedium,
  fontWeightBold,
  fontWeightNormal,
  cardStyle,
  spaceFormField,
  radiusPill,
  radiusSm,
  radiusMd,
  radiusLg,
  spaceXs,
  spaceLg,
  spaceXl,
  shadowSm,
  surfaceCard,
  surfacePage,
  dataSea1,
  metaStyle,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
  uploadAreaStyle, uploadHintStyle, uploadFileItemStyle,
  historyBadgeStyle, historyGroupGridStyle, historyTimeStyle, historyMetaRowStyle,
  historyInfoCardStyle, historyAccentBarStyle, historyInfoTitleStyle,
  historyChangeRowStyle, historyCreateRowStyle, historyFieldLabelStyle,
  historyOldValueStyle, historyNewValueStyle, historyArrowStyle,
} from '../../tokens';
import { usePermissionStore } from '../../store/permissionStore';
import { colors } from '../../theme';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { approvalStatusLabel } from '../../components/shared/ApprovalStatusBadge';
import { APPROVAL_STATUS_OPTIONS } from '../../components/shared/ApprovalStatusBadge';

const { confirm } = modal;

// ── Helper: format date ─────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss');
  } catch {
    return dateStr;
  }
}

// ── DMS conversion helpers ────────────────────────────────────────

function toDMS(dd: number): { d: number; m: number; s: number } {
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
  return { d, m, s };
}

function fromDMS(d: number, m: number, s: number): number {
  return (d < 0 ? -1 : 1) * (Math.abs(d) + m / 60 + s / 3600);
}

function parseWktCoords(wkt: string): Array<{ lat: number; lng: number }> {
  if (!wkt) return [];
  const multi = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)\)/);
  if (multi) {
    return multi[1].split('),(').map(pt => {
      const [lng, lat] = pt.replace(/[()]/g, '').trim().split(/\s+/).map(Number);
      return { lat, lng };
    });
  }
  const point = wkt.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
  if (point) return [{ lng: Number(point[1]), lat: Number(point[2]) }];
  return [];
}

// ── List Page ───────────────────────────────────────────────────────

// Số lượng tọa độ mặc định tương ứng với từng loại đối tượng: điểm → 1, đường → 2, vùng → 3
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

export const translateFieldName = (fieldName: string): string => {
  const map: Record<string, string> = {
    // Port (Cảng biển)
    portCode: 'Mã cảng biển',
    portName: 'Tên cảng biển',
    province: 'Tỉnh/Thành phố',
    area: 'Diện tích (km²)',
    maxVesselCapacity: 'Khả năng tiếp nhận tàu',
    khaNangTiepNhan: 'Khả năng tiếp nhận tàu',
    portGroup: 'Nhóm cảng biển',
    portClass: 'Phân cấp cảng biển',
    detailedLocation: 'Địa điểm chi tiết',
    coordinateSystem: 'Hệ quy chiếu tọa độ',
    displayRule: 'Quy tắc hiển thị',
    waterAreaScope: 'Phạm vi vùng nước',
    totalBerths: 'Tổng số bến cảng',
    totalAnchoragesTransshipment: 'Tổng số khu neo đậu/chuyển tải',
    totalPublicChannels: 'Tổng số tuyến luồng công cộng',
    totalDedicatedChannels: 'Tổng số tuyến luồng chuyên dùng',
    totalPublicChannelLength: 'Tổng chiều dài luồng công cộng (km)',
    totalDedicatedChannelLength: 'Tổng chiều dài luồng chuyên dùng (km)',
    totalBuoysBeacons: 'Tổng số phao tiêu/báo hiệu',
    totalDikes: 'Tổng số đê kè',
    totalDikeLength: 'Tổng chiều dài đê kè (km)',
    totalLighthouses: 'Tổng số đèn biển/đăng tiêu',
    buoyBerthCount: 'Số lượng bến phao',
    anchorageCount: 'Số lượng khu neo đậu',
    transshipmentCount: 'Số lượng khu chuyển tải',
    otherWaterAreas: 'Các khu nước khác',
    remarks: 'Ghi chú',
    mapSymbolId: 'Biểu tượng',
    geometryType: 'Loại hình học',
    // Berth (Bến cảng)
    berthCode: 'Mã bến cảng',
    berthName: 'Tên bến cảng',
    portId: 'Cảng biển chủ',
    waterway: 'Tuyến đường thủy',
    tuyenDuongThuy: 'Tuyến đường thủy',
    berthType: 'Loại bến',
    channelDepth: 'Độ sâu luồng (m)',
    doSauLuong: 'Độ sâu luồng (m)',
    operator: 'Đơn vị vận hành',
    operationalFunction: 'Công năng khai thác',
    totalArea: 'Tổng diện tích (ha)',
    designThroughput: 'Năng lực thiết kế',
    currentThroughput: 'Năng lực hiện tại',
    maxVesselSize: 'Cỡ tàu tối đa (DWT)',
    plannedThroughput: 'Năng lực quy hoạch',
    latestCargoVolume: 'Sản lượng hàng hóa gần nhất',
    openingAnnouncementDate: 'Ngày công bố mở',
    openingDecision: 'Quyết định mở',
    investmentAgreement: 'Thỏa thuận đầu tư',
    structureType: 'Loại kết cấu',
    provinceId: 'Mã tỉnh/thành',
    activityStatus: 'Trạng thái hoạt động',
    // Pier (Cầu cảng)
    pierCode: 'Mã cầu cảng',
    pierName: 'Tên cầu cảng',
    berthId: 'Bến cảng chủ',
    pierType: 'Loại cầu',
    loaiCau: 'Loại cầu',
    designLoad: 'Tải trọng thiết kế (tấn)',
    taiTrong: 'Tải trọng (tấn)',
    // DryPort (Cảng cạn)
    dryPortCode: 'Mã cảng cạn',
    dryPortName: 'Tên cảng cạn',
    viTri: 'Vị trí',
    dienTichDat: 'Diện tích đất (ha)',
    dienTichNuoc: 'Diện tích nước (ha)',
    nangLucThongQua: 'Năng lực thông qua',
    // WaterZone (Vùng nước)
    waterZoneCode: 'Mã vùng nước',
    waterZoneName: 'Tên vùng nước',
    viTriVungNuoc: 'Vị trí vùng nước',
    chieuDaiVungNuoc: 'Chiều dài vùng nước (m)',
    chieuRongVungNuoc: 'Chiều rộng vùng nước (m)',
    doSauVungNuoc: 'Độ sâu vùng nước (m)',
    // Common
    width: 'Chiều rộng (m)',
    length: 'Chiều dài (m)',
    operationalStatus: 'Trạng thái hoạt động',
    approvalStatus: 'Trạng thái phê duyệt',
    orgUnitId: 'Đơn vị quản lý',
    operationalCapacity: 'Công năng khai thác',
    bieuTuongId: 'Biểu tượng',
    iconId: 'Biểu tượng',
    lineSymbolId: 'Ký hiệu đường',
    fillSymbolId: 'Ký hiệu vùng',
    khongGianId: 'Vị trí không gian',
    spatialId: 'Vị trí không gian',
    // GIS
    constructionGrade: 'Phân cấp công trình',
    conditionStatus: 'Tình trạng',
    navigationChannelId: 'Thuộc luồng hàng hải',
    // Collections (fallback label)
    infrastructureList: 'Danh sách hạ tầng',
    attachments: 'File đính kèm',
    attachmentList: 'File đính kèm',
  };
  return map[fieldName] || fieldName;
};

const historyFieldLabels: Record<string, string> = {
  portCode: 'Mã cảng biển', portName: 'Tên cảng biển', province: 'Tỉnh/Thành phố',
  area: 'Diện tích (km²)', maxVesselCapacity: 'Khả năng tiếp nhận tàu',
  portGroup: 'Nhóm cảng biển', portClass: 'Phân cấp cảng biển',
  detailedLocation: 'Địa điểm chi tiết', coordinateSystem: 'Hệ quy chiếu tọa độ',
  displayRule: 'Quy tắc hiển thị', waterAreaScope: 'Phạm vi vùng nước',
  totalBerths: 'Tổng số bến cảng', totalAnchoragesTransshipment: 'Tổng số khu neo đậu/chuyển tải',
  totalPublicChannels: 'Tổng số tuyến luồng công cộng', totalDedicatedChannels: 'Tổng số tuyến luồng chuyên dùng',
  totalPublicChannelLength: 'Tổng chiều dài luồng công cộng (km)', totalDedicatedChannelLength: 'Tổng chiều dài luồng chuyên dùng (km)',
  totalBuoysBeacons: 'Tổng số phao tiêu/báo hiệu', totalDikes: 'Tổng số đê kè',
  totalDikeLength: 'Tổng chiều dài đê kè (km)', totalLighthouses: 'Tổng số đèn biển/đăng tiêu',
  buoyBerthCount: 'Số lượng bến phao', anchorageCount: 'Số lượng khu neo đậu',
  transshipmentCount: 'Số lượng khu chuyển tải', otherWaterAreas: 'Các khu nước khác',
  remarks: 'Ghi chú', mapSymbolId: 'Biểu tượng', spatialId: 'Vị trí không gian',
  orgUnitId: 'Đơn vị quản lý', operationalStatus: 'Trạng thái hoạt động', approvalStatus: 'Trạng thái phê duyệt',
  'Lý do từ chối': 'Lý do từ chối', 'Trạng thái': 'Hành động',
};
function historyFieldName(fn: string): string { return historyFieldLabels[fn] || fn; }
function historyFieldValue(fn: string, val: string | null, orgMap?: Map<string, string>, symbolMap?: Map<string, string>): string {
  if (!val || val === '(null)' || val === 'null') return '(trống)';
  if (fn === 'orgUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if (fn === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || val;
  if (fn === 'approvalStatus') return approvalStatusLabel(val);
  if (fn === 'operationalStatus') {
    const m: Record<string, string> = {
      OPERATIONAL: 'Đang hoạt động', SUSPENDED: 'Tạm ngừng',
      HIEN_HANH: 'Hiện hành', TAM_NGUNG: 'Tạm ngừng', DANG_KHAI_THAC: 'Đang khai thác', CHUA_KHAI_THAC: 'Chưa khai thác', DUNG_KHAI_THAC: 'Dừng khai thác'
    };
    return m[val] || val;
  }
  if (fn === 'portGroup') { try { return `Nhóm ${val}`; } catch { return val; } }
  if (fn === 'portClass') { const m: Record<string, string> = { '5': 'Cấp đặc biệt', '1': 'Cấp 1', '2': 'Cấp 2', '3': 'Cấp 3', '4': 'Cấp 4' }; return m[val] || `Cấp ${val}`; }
  if (fn === 'geometryType' || fn === 'objType') { const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng', '1': 'Đối tượng điểm', '2': 'Đối tượng đường', '3': 'Đối tượng vùng' }; return m[String(val).toUpperCase()] || val; }
  if (fn === 'coordinateSystem') { const m: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' }; return m[String(val)] || val; }
  if (fn === 'changedAt' || fn === 'createdAt') { try { return dayjs(val).format('DD/MM/YYYY HH:mm:ss'); } catch { return val; } }
  return val;
}
function getActionLabel(items: any[]): { label: string; color: string } {
  const fields = items.map((i: any) => i.fieldName || '');
  const oldVals = items.map((i: any) => i.oldValue || '');
  const newVals = items.map((i: any) => i.newValue || '');
  if (fields.includes('deletedAt') || newVals.includes('Đã xóa')) return { label: 'Xóa', color: 'red' };
  if (fields.includes('approvalStatus')) {
    const newStatus = newVals[fields.indexOf('approvalStatus')];
    if (newStatus === 'APPROVED') return { label: 'Phê duyệt', color: 'green' };
    if (newStatus === 'REJECTED') return { label: 'Từ chối', color: 'red' };
    if (newStatus === 'PENDING') return { label: 'Gửi phê duyệt', color: 'orange' };
  }
  const nullCount = oldVals.filter(v => v === '(null)' || v === 'null').length;
  if (nullCount > items.length / 2) return { label: 'Tạo mới', color: 'blue' };
  return { label: 'Chỉnh sửa', color: 'blue' };
}

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

// ── Loại kết cấu hạ tầng (bộ lọc tab "Danh sách kết cấu hạ tầng khác") ──
const KCHT_TYPE_OPTIONS = [
  'Bến cảng', 'Bến phao', 'Cầu cảng', 'Cơ sở sửa chữa, đóng tàu', 'Khu chuyển tải',
  'Đèn biển và nhà trạm gắn liền với đèn biển', 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ',
  'Luồng hàng hải', 'Khu neo đậu', 'Nhà trạm quản lý vận hành Phao, tiêu', 'Trạm Radar',
  'Khu tránh, trú bão', 'Trung tâm điều hành VTS', 'Hệ thống thông tin liên lạc VHF', 'Hệ thống VTS',
].map((label) => ({ value: label, label }));

const hdrCell = () => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px', whiteSpace: 'nowrap' as const } });

// Bảng tham chiếu (Thông tin quy hoạch / Vận hành khai thác / Bảo trì / Sự cố) — đồng bộ giao diện PagedTabTable bến/cầu cảng
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

// 7 trạng thái chuẩn (approval-2-level-spec §3.1). Lưu ý APPROVED_LEVEL1 nghĩa là
// ĐÃ qua vòng 1, tức đang chờ Cục duyệt — trước đây bị gán nhầm thành "Chờ Cảng vụ
// duyệt". APPROVED_LEVEL2 / REJECTED / PROPOSED là giá trị legacy, chỉ giữ để đọc
// dữ liệu cũ chứ không phát sinh mới.
const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ Cục duyệt' },
  APPROVED: { color: statusOperational, label: 'Đã duyệt' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Cảng vụ trả về' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Cục trả về' },
  ARCHIVED: { color: statusDraft, label: 'Đã xóa (lịch sử)' },
  // ── legacy ──
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  PROPOSED: { color: statusAttention, label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL2: { color: statusOperational, label: 'Đã duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
};

const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Bến nước' }, { value: 2, label: 'Bến bờ' },
  { value: 3, label: 'Bến phao' }, { value: 4, label: 'Khác' },
];

// Chi tiết vùng nước (Drawer lồng — tham chiếu WaterZoneListPage detail modal)
function WaterZoneDetailMini({ record, symbols, files, userMap }: { record: any; symbols: any[]; files: any[]; userMap: Map<string, string> }) {
  const sym = symbols.find((s: any) => s.id === record.bieuTuongId);
  return (
    <div style={{ paddingTop: 8 }}>
      <Descriptions bordered column={2} size="small" style={{ marginBottom: spaceMd }}>
        <Descriptions.Item label="Mã vùng nước"><Tag color="cyan">{record.waterZoneCode || '—'}</Tag></Descriptions.Item>
        <Descriptions.Item label="Tên vùng nước">{record.waterZoneName || '—'}</Descriptions.Item>
        <Descriptions.Item label="Cảng biển chủ">{record.tenCangBien || record.portId || '—'}</Descriptions.Item>
        <Descriptions.Item label="Loại vùng nước">{record.loaiVungNuoc || '—'}</Descriptions.Item>
        <Descriptions.Item label="Biểu tượng bản đồ">
          {sym?.image ? <img src={sym.image} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain', marginRight: 8 }} /> : null}
          {sym?.name || record.bieuTuongId || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Diện tích">{record.area != null ? `${Number(record.area).toFixed(2)} m²` : '—'}</Descriptions.Item>
        <Descriptions.Item label="Độ sâu tối đa">{record.doSauMax != null ? `${Number(record.doSauMax).toFixed(2)} m` : '—'}</Descriptions.Item>
        <Descriptions.Item label="Độ sâu TB">{record.doSauTrungBinh != null ? `${Number(record.doSauTrungBinh).toFixed(2)} m` : '—'}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái hoạt động">
          {record.operationalStatus ? <Tag color={trangThaiHoatDongBadge(record.operationalStatus).color}>{trangThaiHoatDongBadge(record.operationalStatus).label}</Tag> : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái phê duyệt">
          {record.approvalStatus ? <Tag color={trangThaiPheDuyetBadge(record.approvalStatus).color}>{trangThaiPheDuyetBadge(record.approvalStatus).label}</Tag> : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Người tạo">{userMap.get(record.createdBy) || record.createdBy || '—'}</Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">{record.createdAt ? new Date(record.createdAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
        <Descriptions.Item label="Người cập nhật">{userMap.get(record.updatedBy) || record.updatedBy || '—'}</Descriptions.Item>
        <Descriptions.Item label="Ngày cập nhật">{record.updatedAt ? new Date(record.updatedAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
      </Descriptions>
      <Typography.Text style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tài liệu đính kèm</Typography.Text>
      {files.length === 0 ? (
        <div style={{ color: textTertiary, fontSize: fontSizeMd, padding: `${spaceSm}px 0` }}>Không có tài liệu đính kèm</div>
      ) : (
        <div>
          {files.map((f: any) => (
            <div key={f.id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography.Text strong>{f.fileName}</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {f.fileSize} bytes — {new Date(f.createdAt).toLocaleString('vi-VN')}
                </Typography.Text>
              </div>
              <Button type="link" icon={<DownloadOutlined />} onClick={() => window.open(documentApi.downloadUrl(f.minioKey), '_blank')} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortListPage() {
  const navigate = useNavigate();

  // ── Permission ──────────────────────────────────────────────────
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const canSubmitForApproval = hasPerm?.('port:update') || hasPerm?.('port:approve') || hasPerm?.('port:manage');

  // ── State ───────────────────────────────────────────────────────
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterTinh, setFilterTinh] = useState('');
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterPortGroup, setFilterPortGroup] = useState<number | undefined>();
  const [filterPortClass, setFilterPortClass] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [debouncedName, setDebouncedName] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [sortField, setSortField] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [activeStatusTab, setActiveStatusTab] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CangBienResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [totalAll, setTotalAll] = useState(0);

  // Modals visibility
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [portSystemOpen, setPortSystemOpen] = useState(true);
  const [detailCollapsed, setDetailCollapsed] = useState<Record<string, boolean>>({});
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CangBienResponse | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // Kết cấu hạ tầng khác thuộc cảng biển (tab chi tiết)
  const [infraFilter, setInfraFilter] = useState<string | undefined>(undefined);
  const [infraPage, setInfraPage] = useState(1);
  const [infraPageSize, setInfraPageSize] = useState(20);
  const [otherInfra, setOtherInfra] = useState<Array<{ id: string; name: string; typeLabel: string; kchtType: 'berth' | 'waterzone' }>>([]);

  // Chi tiết KCHT khác — Drawer lồng (mở tại chỗ, không chuyển trang, tham chiếu BuoyStationList)
  const [kchtDetailOpen, setKchtDetailOpen] = useState(false);
  const [kchtDetailType, setKchtDetailType] = useState<'berth' | 'waterzone'>('berth');
  const [kchtDetailRecord, setKchtDetailRecord] = useState<any>(null);
  const [kchtDetailFiles, setKchtDetailFiles] = useState<any[]>([]);
  const [kchtDetailLoading, setKchtDetailLoading] = useState(false);
  const [pierDetailOpen, setPierDetailOpen] = useState(false);
  const [pierDetailRecord, setPierDetailRecord] = useState<any>(null);
  const [pierDetailFiles, setPierDetailFiles] = useState<any[]>([]);
  const [pierDetailLoading, setPierDetailLoading] = useState(false);

  const openPierDetail = useCallback(async (id: string) => {
    setPierDetailLoading(true); setPierDetailOpen(true); setPierDetailRecord(null);
    try {
      const [rec, fileRes] = await Promise.all([
        pierCRUD.findById(id),
        documentApi.listByEntity('pier', id, { page: 1, size: 20 }),
      ]);
      setPierDetailRecord(rec);
      setPierDetailFiles((fileRes as any)?.data || []);
    } catch { toast.error('Không thể tải chi tiết cầu cảng'); setPierDetailRecord(null); }
    finally { setPierDetailLoading(false); }
  }, []);

  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users: any[] = (resp as any)?.data || (Array.isArray(resp) ? resp : []);
        const map = new Map<string, string>();
        users.forEach((u: any) => map.set(u.id, u.fullName || u.username || u.id));
        setUserMap(map);
      } catch { /* silent — hiển thị raw id */ }
    })();
  }, []);

  const [waterwayMap, setWaterwayMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize: 1000 })
      .then((r: any) => { const m = new Map<string, string>(); (r.data || []).forEach((l: any) => { m.set(l.id, l.name || l.code); }); setWaterwayMap(m); })
      .catch(() => {});
  }, []);

  const openKchtDetail = useCallback(async (type: 'berth' | 'waterzone', id: string) => {
    setKchtDetailType(type);
    setKchtDetailLoading(true);
    setKchtDetailOpen(true);
    try {
      const [rec, fileRes] = await Promise.all([
        type === 'berth' ? berthCRUD.findById(id) : waterZoneApi.findById(id),
        documentApi.listByEntity(type === 'berth' ? 'berth' : 'water-zone', id, { page: 1, size: 20 }),
      ]);
      setKchtDetailRecord(rec);
      setKchtDetailFiles((fileRes as any)?.data || []);
    } catch {
      toast.error('Không thể tải chi tiết kết cấu hạ tầng');
      setKchtDetailRecord(null);
    } finally {
      setKchtDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedRecord?.id) { setOtherInfra([]); return; }
    let cancelled = false;
    Promise.allSettled([
      berthCRUD.search({ portId: selectedRecord.id, pageSize: 50 }),
      waterZoneCRUD.findAll({ portId: selectedRecord.id, size: 50 }),
    ]).then(([b, w]) => {
      if (cancelled) return;
      const rows: Array<{ id: string; name: string; typeLabel: string; kchtType: 'berth' | 'waterzone' }> = [];
      if (b.status === 'fulfilled') {
        rows.push(...(b.value.data || []).map((x: any) => ({
          id: x.id, name: x.berthName || x.berthCode || '—', typeLabel: 'Bến cảng',
          kchtType: 'berth' as const,
        })));
      }
      if (w.status === 'fulfilled') {
        rows.push(...(w.value.data || []).map((x: any) => ({
          id: x.id, name: x.waterZoneName || x.waterZoneCode || '—', typeLabel: 'Khu neo đậu',
          kchtType: 'waterzone' as const,
        })));
      }
      setOtherInfra(rows);
    });
    return () => { cancelled = true; };
  }, [selectedRecord?.id]);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState<Record<number, boolean>>({});

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CangBienResponse | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const historySearchRef = useRef('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityId, setHistoryEntityId] = useState('');
  const [historyEntityName, setHistoryEntityName] = useState('');
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');

  // Reject modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<CangBienResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Submit modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<CangBienResponse | null>(null);

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<CangBienResponse | null>(null);

  // Auto-generate port code for create modal
  const [portCodeLoading, setPortCodeLoading] = useState(false);
  const [createTabKey, setCreateTabKey] = useState('general');

  // Infrastructure list for create modal
  const [infraList, setInfraList] = useState<Array<{ stt: number; infraName: string; quantity: number | null }>>([]);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  // GPS coordinates for create modal (DMS per point, stored as decimal degrees)
  const [gpsCoordList, setGpsCoordList] = useState<Array<{ lat: number; lng: number }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // DMS ↔ DD conversion helpers
  const ddToDms = (dd: number): { d: number | null; m: number | null; s: number | null } => {
    if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
    let abs = Math.abs(dd);
    let d = Math.floor(abs);
    let mFloat = (abs - d) * 60;
    if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
    let m = Math.floor(mFloat);
    let sFloat = (mFloat - m) * 60;
    if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
    let s = Math.round(sFloat * 100) / 100;
    if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
    return { d: d === 0 ? null : d, m: m === 0 ? null : m, s: s === 0 ? null : s };
  };
  const dmToDd = (d: number | null, m: number | null, s: number | null): number => (d ?? 0) + (m ?? 0) / 60 + (s ?? 0) / 3600;

  const addGpsPoint = () => { setGpsCoordList([...gpsCoordList, { lat: NaN, lng: NaN }]); setGpsError(null); };
  const removeGpsPoint = (i: number) => {
    const next = gpsCoordList.filter((_, idx) => idx !== i);
    setGpsCoordList(next);
    setGpsError(null);
  };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    const next = [...gpsCoordList];
    next[i] = { ...next[i], [field]: dmToDd(d, m, s) };
    setGpsCoordList(next);
    setGpsError(null);
  };

  // Infra helpers
  const addInfra = () => setInfraList([...infraList, { stt: infraList.length + 1, infraName: '', quantity: null }]);
  const removeInfra = (i: number) => {
    const next = infraList.filter((_, idx) => idx !== i).map((item, idx) => ({ ...item, stt: idx + 1 }));
    setInfraList(next);
  };
  const updateInfraName = (i: number, val: string) => {
    const next = [...infraList];
    next[i] = { ...next[i], infraName: val };
    setInfraList(next);
  };
  const updateInfraQty = (i: number, val: number | null) => {
    const next = [...infraList];
    next[i] = { ...next[i], quantity: val };
    setInfraList(next);
  };

  // Debounce search 300ms (F-012 AC-012-02) — tên và mã tách riêng
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedName(filterName);
      setDebouncedCode(filterCode);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filterName, filterCode]);

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('submit');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve'>('submit');
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);

  const symbolMap = useMemo(() => {
    const map = new Map<string, string>();
    symbols.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [symbols]);

  const symbolImageMap = useMemo(() => {
    const map = new Map<string, string>();
    symbols.forEach((s: any) => { if (s.image) map.set(s.id, s.image); });
    return map;
  }, [symbols]);

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    orgUnits.forEach((o: any) => map.set(o.id, o.code ? `${o.code} - ${o.name}` : o.name));
    return map;
  }, [orgUnits]);

  // Tên đơn vị cấp 2 trong chuỗi phân cấp — dùng cho cột Đơn vị quản lý (giống chi tiết).
  const orgLevel2Map = useMemo(() => {
    const map = new Map<string, string>();
    orgUnits.forEach((o: any) => {
      const name = resolveOrgLevel2Name(orgUnits, o.id);
      if (name) map.set(o.id, name);
    });
    return map;
  }, [orgUnits]);

  const handleFilterApply = useCallback(() => {
    setFilterName((filterValues.portName || '').trim());
    setFilterCode((filterValues.portCode || '').trim());
    setFilterOrgUnitId(filterValues.orgUnitId === '__all__' ? undefined : filterValues.orgUnitId || undefined);
    setFilterPortClass(filterValues.portClass ? Number(filterValues.portClass) : undefined);
    setFilterPortGroup(filterValues.portGroup ? Number(filterValues.portGroup) : undefined);
    setFilterTinh(filterValues.province || '');
    setFilterUpdatedFrom(filterValues.updatedFrom || undefined);
    setFilterUpdatedTo(filterValues.updatedTo || undefined);
    setFilterApprovalStatus(filterValues.approvalStatus || undefined);
    setPage(1);
  }, [filterValues]);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current;
    setFilterValues(defaultOrg ? { orgUnitId: defaultOrg } : {});
    setFilterName('');
    setFilterCode('');
    setFilterOrgUnitId(defaultOrg === '__all__' ? undefined : defaultOrg || undefined);
    setFilterTinh('');
    setFilterPortGroup(undefined);
    setFilterPortClass(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterStatus(undefined);
    setFilterApprovalStatus(undefined);
    setActiveStatusTab('');
    setPage(1);
  }, []);

  const closeUpdateModal = useCallback(() => {
    setUpdateModalVisible(false);
    setInfraList([]);
    setUploadFileList([]);
    setGpsCoordList([]);
    updateForm.resetFields();
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, [updateForm]);

  const closeDetailModal = useCallback(() => {
    setDetailModalVisible(false);
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, []);

  const [searchParams] = useSearchParams();
  const isIframeModal = (window.self !== window.top) && searchParams.has('action');
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  // ── Iframe auto-load effect ─────────────────────────────────────
  useEffect(() => {
    if (id && (action === 'detail' || action === 'edit')) {
      (async () => {
        try {
          setIsLoading(true);
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = cached || await fetchCangBienById(id);
          setSelectedRecord(data);
          if (action === 'detail') {
            const fileRes = await documentApi.listByEntity('port', id, { page: 1, size: 20 });
            setDetailFiles(fileRes.data || []);
            setDetailModalVisible(true);
          } else if (action === 'edit') {
            updateForm.setFieldsValue({
              id: data.id,
              portCode: data.portCode,
              portName: data.portName,
              province: data.province || undefined,
              orgUnitId: data.orgUnitId || undefined,
              portGroup: data.portGroup != null ? data.portGroup : undefined,
              geometryType: data.geometryType || undefined,
              mapSymbolId: data.mapSymbolId || undefined,
              detailedLocation: data.detailedLocation || undefined,
              portClass: data.portClass != null ? data.portClass : undefined,
              heQuyChieu: data.coordinateSystem != null ? data.coordinateSystem : undefined,
              quyTacHienThi: data.displayRule != null ? data.displayRule : undefined,
              phamViVungNuoc: data.waterAreaScope || undefined,
              tongSoBenCang: data.totalBerths != null ? data.totalBerths : undefined,
              tongSoKhuNeoDauChuyenTai: data.totalAnchoragesTransshipment != null ? data.totalAnchoragesTransshipment : undefined,
              tongSoTuyenLuongCongCong: data.totalPublicChannels != null ? data.totalPublicChannels : undefined,
              tongSoTuyenLuongChuyenDung: data.totalDedicatedChannels != null ? data.totalDedicatedChannels : undefined,
              tongChieuDaiLuongCongCong: data.totalPublicChannelLength != null ? data.totalPublicChannelLength : undefined,
              tongChieuDaiLuongChuyenDung: data.totalDedicatedChannelLength != null ? data.totalDedicatedChannelLength : undefined,
              tongSoPhaoTieuBaoHieu: data.totalBuoysBeacons != null ? data.totalBuoysBeacons : undefined,
              tongSoDeKe: data.totalDikes != null ? data.totalDikes : undefined,
              tongChieuDaiDeKe: data.totalDikeLength != null ? data.totalDikeLength : undefined,
              tongSoDenBienDangTieu: data.totalLighthouses != null ? data.totalLighthouses : undefined,
              quantityBenPhao: data.buoyBerthCount != null ? data.buoyBerthCount : undefined,
              quantityKhuNeoDau: data.anchorageCount != null ? data.anchorageCount : undefined,
              quantityKhuChuyenTai: data.transshipmentCount != null ? data.transshipmentCount : undefined,
              cacKhuNuocKhac: data.otherWaterAreas || undefined,
              coordinateSystem: data.coordinateSystem != null ? data.coordinateSystem : undefined,
              displayRule: (data.geometryType || data.coordinates) ? 'Độ, phút, giây (DMS)' : undefined,
              waterAreaScope: data.waterAreaScope || undefined,
              remarks: data.remarks || undefined,
            });
            // Load infrastructure & attachments for edit
            setInfraList(((data as any).infrastructureList || []).map((i: any) => ({ stt: i.stt, infraName: i.infraName, quantity: i.quantity })));
            // Load attachments via API
            try {
              const attRes = await documentApi.listByEntity('port', id, { page: 1, size: 20 });
              setUploadFileList((attRes.data || []).map((a: any) => ({ uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const })));
            } catch { setUploadFileList([]); }
            // Parse coordinates from API response (coordinateList array, WKT string, or single lat/lng)
            const wktCoords: string = data.coordinates || '';
            const coordArr = data.coordinateList;
            const pts: Array<{ lat: number; lng: number }> = [];
            if (coordArr && Array.isArray(coordArr) && coordArr.length > 0) {
              pts.push(...coordArr.map((c: any) => ({ lat: c.latitude ?? c.lat, lng: c.longitude ?? c.lng })));
            } else if (wktCoords) {
              const multiMatch = wktCoords.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)\)/);
              if (multiMatch) {
                const rawPts = multiMatch[1].split('),(');
                pts.push(...rawPts.map((pt: string) => {
                  const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
                  return { lat: Number(parts[1]), lng: Number(parts[0]) };
                }));
              } else {
                const match = wktCoords.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
                if (match) {
                  pts.push({ lat: Number(match[2]), lng: Number(match[1]) });
                }
              }
            } else if (data.latitude != null && data.longitude != null) {
              pts.push({ lat: Number(data.latitude), lng: Number(data.longitude) });
            }
            setGpsCoordList(pts);
            setUpdateModalVisible(true);
          }
        } catch (err) {
          console.error('Failed to auto-load details in iframe:', err);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [action, id, updateForm]);

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(res.data);
    } catch (err) {
      console.error('Failed to load symbols', err);
    }
  }, []);

  useEffect(() => {
    const parentOrgUnits = (window.parent as any)?.kchtOrgUnits;
    const parentSymbols = (window.parent as any)?.kchtSymbols;

    if (parentOrgUnits && parentOrgUnits.length > 0) {
      setOrgUnits(parentOrgUnits);
      if (!filterOrgUnitId) {
        setFilterValues(prev => ({ ...prev, orgUnitId: parentOrgUnits[0].id }));
        setFilterOrgUnitId(parentOrgUnits[0].id);
      }
    }
    if (parentSymbols && parentSymbols.length > 0) {
      setSymbols(parentSymbols);
    }

    const needOrgUnits = (!parentOrgUnits || parentOrgUnits.length === 0);
    const needSymbols = (!parentSymbols || parentSymbols.length === 0);

    if (needSymbols) {
      void fetchSymbols();
    }
    if (needOrgUnits) {
      (async () => {
        try {
          const resp = await organizationService.list();
          setOrgUnits(resp.data || []);
          const data = resp.data || [];
          if (data.length > 0 && !filterOrgUnitId) {
            try {
              const profileRes = await api.get('/users/me');
              const profile = profileRes.data?.data ?? profileRes.data;
              const userOrgId = profile?.orgUnitId;
              const match = userOrgId && data.find((o: any) => o.id === userOrgId);
              const defaultId = userOrgId ? (match ? userOrgId : data[0].id) : undefined;
              defaultOrgUnitId.current = defaultId;
              setFilterValues(prev => ({ ...prev, orgUnitId: defaultId }));
              setFilterOrgUnitId(defaultId === '__all__' ? undefined : defaultId);
            } catch {
              defaultOrgUnitId.current = data[0].id;
              setFilterValues(prev => ({ ...prev, orgUnitId: data[0].id }));
              setFilterOrgUnitId(data[0].id);
            }
          }
          setOrgUnitReady(true);
        } catch (err) {
          console.error('Failed to load org units', err);
          setOrgUnitReady(true);
        }
      })();
    }
  }, [fetchSymbols, isIframeModal, action]);

  const translateValue = useCallback(
    (fieldName: string, val: string | null): string => {
      if (!val || val === '(null)' || val === 'null') {
        return '(trống)';
      }
      // Symbol IDs
      if (['bieuTuongId', 'iconId', 'lineSymbolId', 'fillSymbolId', 'mapSymbolId'].includes(fieldName)) {
        const sym = symbols.find((s) => s.id === val);
        return sym ? (sym.code ? `${sym.name} (${sym.code})` : sym.name) : val;
      }
      // Spatial ID
      if (['khongGianId', 'spatialId'].includes(fieldName)) {
        return 'Có tọa độ bản đồ';
      }
      // Approval status
      if (fieldName === 'approvalStatus') {
        return approvalStatusLabel(val);
      }
      // Operational status
      if (fieldName === 'operationalStatus') {
        const statusMap: Record<string, string> = {
          HIEN_HANH: 'Hiện hành',
          TAM_NGUNG: 'Tạm ngừng',
          'HIỆN_HÀNH': 'Hiện hành',
          'TẠM_NGƯNG': 'Tạm ngừng',
          DANG_KHAI_THAC: 'Đang khai thác',
          CHUA_KHAI_THAC: 'Chưa khai thác',
          DUNG_KHAI_THAC: 'Dừng khai thác',
        };
        return statusMap[val.toUpperCase()] || val;
      }
      // Port classification (phanCap / portClass)
      if (fieldName === 'portClass' || fieldName === 'phanCap') {
        const classMap: Record<string, string> = {
          '5': 'Cấp đặc biệt',
          '1': 'Cấp 1',
          '2': 'Cấp 2',
          '3': 'Cấp 3',
          '4': 'Cấp 4',
        };
        return classMap[val] || `Cấp ${val}`;
      }
      // Port group
      if (fieldName === 'portGroup') {
        return `Nhóm ${val}`;
      }
      // Coordinate system
      if (fieldName === 'coordinateSystem') {
        const coordMap: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
        return coordMap[val] || val;
      }
      // Display rule
      if (fieldName === 'displayRule') {
        const ruleMap: Record<string, string> = { '1': 'Mặc định', '2': 'Nổi bật', '3': 'Tối giản' };
        return ruleMap[val] || val;
      }
      // Collection fields — skip object reference display
      if (['infrastructureList', 'attachments', 'attachmentList'].includes(fieldName)) {
        if (val === '[]') return 'Không có';
        if (val.startsWith('[') && val.includes('@')) return 'Đã cập nhật';
        return 'Đã cập nhật';
      }
      // Boolean fields
      if (val === 'true') return 'Có';
      if (val === 'false') return 'Không';
      return val;
    },
    [symbols],
  );

  // Form watches
  const createGeometryType = Form.useWatch('geometryType', createForm);
  const updateGeometryType = Form.useWatch('geometryType', updateForm);

  /** true khi field đã đạt giới hạn — 'chars': đủ max ký tự; 'value': giá trị >= max. Bật viền đỏ + message bên dưới. */
  const useAtMax = (form: any, name: string, max: number, mode: 'chars' | 'value' = 'chars'): boolean => {
    const raw = Form.useWatch(name, form) ?? '';
    if (mode === 'value') {
      const n = typeof raw === 'number' ? raw : Number(raw ?? NaN);
      return !Number.isNaN(n) && n >= max;
    }
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };
  const atMaxCreate = {
    portName: useAtMax(createForm, 'portName', 255), detailedLocation: useAtMax(createForm, 'detailedLocation', 500),
    waterAreaScope: useAtMax(createForm, 'waterAreaScope', 2000), otherWaterAreas: useAtMax(createForm, 'otherWaterAreas', 2000),
    remarks: useAtMax(createForm, 'remarks', 2000),
    totalBerths: useAtMax(createForm, 'totalBerths', 5), totalAnchoragesTransshipment: useAtMax(createForm, 'totalAnchoragesTransshipment', 5),
    totalPublicChannels: useAtMax(createForm, 'totalPublicChannels', 5), totalDedicatedChannels: useAtMax(createForm, 'totalDedicatedChannels', 5),
    totalPublicChannelLength: useAtMax(createForm, 'totalPublicChannelLength', 20), totalDedicatedChannelLength: useAtMax(createForm, 'totalDedicatedChannelLength', 20),
    totalBuoysBeacons: useAtMax(createForm, 'totalBuoysBeacons', 5), totalDikes: useAtMax(createForm, 'totalDikes', 5),
    totalDikeLength: useAtMax(createForm, 'totalDikeLength', 20), totalLighthouses: useAtMax(createForm, 'totalLighthouses', 5),
    buoyBerthCount: useAtMax(createForm, 'buoyBerthCount', 5), anchorageCount: useAtMax(createForm, 'anchorageCount', 5),
    transshipmentCount: useAtMax(createForm, 'transshipmentCount', 5),
  };
  const atMaxUpdate = {
    portName: useAtMax(updateForm, 'portName', 255), detailedLocation: useAtMax(updateForm, 'detailedLocation', 500),
    waterAreaScope: useAtMax(updateForm, 'waterAreaScope', 2000), otherWaterAreas: useAtMax(updateForm, 'otherWaterAreas', 2000),
    remarks: useAtMax(updateForm, 'remarks', 2000),
    totalBerths: useAtMax(updateForm, 'totalBerths', 5), totalAnchoragesTransshipment: useAtMax(updateForm, 'totalAnchoragesTransshipment', 5),
    totalPublicChannels: useAtMax(updateForm, 'totalPublicChannels', 5), totalDedicatedChannels: useAtMax(updateForm, 'totalDedicatedChannels', 5),
    totalPublicChannelLength: useAtMax(updateForm, 'totalPublicChannelLength', 20), totalDedicatedChannelLength: useAtMax(updateForm, 'totalDedicatedChannelLength', 20),
    totalBuoysBeacons: useAtMax(updateForm, 'totalBuoysBeacons', 5), totalDikes: useAtMax(updateForm, 'totalDikes', 5),
    totalDikeLength: useAtMax(updateForm, 'totalDikeLength', 20), totalLighthouses: useAtMax(updateForm, 'totalLighthouses', 5),
    buoyBerthCount: useAtMax(updateForm, 'buoyBerthCount', 5), anchorageCount: useAtMax(updateForm, 'anchorageCount', 5),
    transshipmentCount: useAtMax(updateForm, 'transshipmentCount', 5),
  };

  // Khi chọn loại đối tượng → tự set hệ quy chiếu & quy tắc hiển thị
  useEffect(() => {
    if (!createGeometryType) return;
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    // Form thêm mới: điểm → 1 tọa độ, đường → 2 tọa độ, vùng → 3 tọa độ
    const count = GEOMETRY_POINT_COUNT[createGeometryType] ?? 0;
    setGpsCoordList(Array.from({ length: count }, () => ({ lat: NaN, lng: NaN })));
  }, [createGeometryType]);
  useEffect(() => {
    if (updateGeometryType) {
      updateForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
      // Chỉnh sửa: giữ tọa độ đã có, tự thêm dòng trống cho đủ số lượng theo loại đối tượng (điểm → 1, đường → 2, vùng → 3)
      const count = GEOMETRY_POINT_COUNT[updateGeometryType] ?? 1;
      setGpsCoordList((prev) => {
        if (prev.length >= count) return prev;
        const added = Array.from({ length: count - prev.length }, () => ({ lat: NaN, lng: NaN }));
        return [...prev, ...added];
      });
    }
  }, [updateGeometryType]);

  const handleCreateFinish = async (values: Record<string, unknown>) => {
    const portCode = String(values.portCode || '').trim();
    const portName = String(values.portName).trim();

    // BR-008-08: Validate công trình KCHT (chỉ cần tên HOẶC số lượng là đủ)
    for (const infra of infraList) {
      const name = (infra.infraName || '').trim();
      const qty = infra.quantity == null ? null : Number(infra.quantity);
      if (name.length > 500) { toast.error('Tên công trình KCHT không quá 500 ký tự'); return; }
      if (qty != null && qty > 5) { toast.error('Số lượng công trình KCHT không quá 5'); return; }
    }

    // Validate required fields for submit/approve — tọa độ GPS không bắt buộc khi gửi duyệt
    const currentAction = actionTypeRef.current;
    if (currentAction === 'submit' || currentAction === 'approve') {
      const fieldErrors: Array<{ name: Array<string | number>; errors: string[] }> = [];
      if (!values.orgUnitId) fieldErrors.push({ name: ['orgUnitId'], errors: ['Đơn vị quản lý là bắt buộc khi gửi phê duyệt'] });
      if (!values.province) fieldErrors.push({ name: ['province'], errors: ['Tỉnh/Thành phố là bắt buộc khi gửi phê duyệt'] });
      if (values.portClass == null || values.portClass === '') fieldErrors.push({ name: ['portClass'], errors: ['Phân cấp cảng biển là bắt buộc khi gửi phê duyệt'] });
      if (fieldErrors.length) { createForm.setFields(fieldErrors); return; }
    }

    setSubmitting(true);
    try {
      const coordinateList: Array<{ latitude: number; longitude: number }> = gpsCoordList
        .filter(c => c.lat != null && c.lng != null && !isNaN(c.lat) && !isNaN(c.lng))
        .map(c => ({ latitude: c.lat, longitude: c.lng }));

      // AC-008-09: Kiểm tra trùng tên cảng trong cùng tỉnh (warning, không chặn)
      if (portName && values.province) {
        try {
          const dupRes = await api.get('/v1/ports', {
            params: { portName, province: values.province, page: 1, size: 1 },
          });
          const dupData = dupRes.data?.data?.content ?? dupRes.data?.content ?? [];
          if (Array.isArray(dupData) && dupData.length > 0) {
            toast.warning('Tên cảng đã tồn tại. Bạn có chắc muốn tiếp tục?');
          }
        } catch {
          // non-blocking
        }
      }

      const payload = {
        portCode,
        portName,
        province: (values.province as string) || undefined,
        area: values.area as number | undefined,
        maxVesselCapacity: values.khaNangTiepNhan as number | undefined,
        operationalStatus: (values.operationalStatus as string) || undefined,
        approvalStatus: currentAction === 'draft' ? 'DRAFT' : currentAction === 'submit' ? 'PENDING' : 'APPROVED',
        orgUnitId: (values.orgUnitId as string) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.orgUnitId as string) ? (values.orgUnitId as string) : undefined,
        portGroup: values.portGroup ? Number(values.portGroup) : undefined,
        mapSymbolId: (values.mapSymbolId as string) || undefined,
        geometryType: values.geometryType as string,
        detailedLocation: (values.detailedLocation as string) || undefined,
        portClass: values.portClass != null && !Number.isNaN(values.portClass as number)
          ? Number(values.portClass) : undefined,
        coordinateSystem: values.coordinateSystem != null && !Number.isNaN(values.coordinateSystem as number)
          ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null && !Number.isNaN(values.displayRule as number)
          ? Number(values.displayRule) : undefined,
        waterAreaScope: (values.waterAreaScope as string) || undefined,
        totalBerths: values.totalBerths != null && !Number.isNaN(values.totalBerths as number)
          ? Number(values.totalBerths) : undefined,
        totalAnchoragesTransshipment: values.totalAnchoragesTransshipment != null && !Number.isNaN(values.totalAnchoragesTransshipment as number)
          ? Number(values.totalAnchoragesTransshipment) : undefined,
        totalPublicChannels: values.totalPublicChannels != null && !Number.isNaN(values.totalPublicChannels as number)
          ? Number(values.totalPublicChannels) : undefined,
        totalDedicatedChannels: values.totalDedicatedChannels != null && !Number.isNaN(values.totalDedicatedChannels as number)
          ? Number(values.totalDedicatedChannels) : undefined,
        totalPublicChannelLength: values.totalPublicChannelLength != null && !Number.isNaN(values.totalPublicChannelLength as number)
          ? Number(values.totalPublicChannelLength) : undefined,
        totalDedicatedChannelLength: values.totalDedicatedChannelLength != null && !Number.isNaN(values.totalDedicatedChannelLength as number)
          ? Number(values.totalDedicatedChannelLength) : undefined,
        totalBuoysBeacons: values.totalBuoysBeacons != null && !Number.isNaN(values.totalBuoysBeacons as number)
          ? Number(values.totalBuoysBeacons) : undefined,
        totalDikes: values.totalDikes != null && !Number.isNaN(values.totalDikes as number)
          ? Number(values.totalDikes) : undefined,
        totalDikeLength: values.totalDikeLength != null && !Number.isNaN(values.totalDikeLength as number)
          ? Number(values.totalDikeLength) : undefined,
        totalLighthouses: values.totalLighthouses != null && !Number.isNaN(values.totalLighthouses as number)
          ? Number(values.totalLighthouses) : undefined,
        buoyBerthCount: values.buoyBerthCount != null && !Number.isNaN(values.buoyBerthCount as number)
          ? Number(values.buoyBerthCount) : undefined,
        anchorageCount: values.anchorageCount != null && !Number.isNaN(values.anchorageCount as number)
          ? Number(values.anchorageCount) : undefined,
        transshipmentCount: values.transshipmentCount != null && !Number.isNaN(values.transshipmentCount as number)
          ? Number(values.transshipmentCount) : undefined,
        otherWaterAreas: (values.otherWaterAreas as string) || undefined,
        coordinateList,
        infrastructureList: infraList
          .filter((inf) => (inf.infraName || '').trim() || (inf.quantity != null && Number(inf.quantity) > 0))
          .map((inf, idx) => ({ stt: idx + 1, infraName: (inf.infraName || '').trim(), quantity: inf.quantity != null && Number(inf.quantity) > 0 ? Number(inf.quantity) : 1 })),
        remarks: (values.remarks as string) || undefined,
        action: currentAction,
      };
      const createdPort = await import('./api').then((m) => m.createCangBien(payload));
      const createdPortId = createdPort?.id || (createdPort as any)?.portId;
      toast.success(currentAction === 'draft' ? 'Lưu tạm thành công' : 'Gửi phê duyệt thành công');
      createForm.resetFields();

      setInfraList([]);
      setGpsCoordList([]);
      setUploadFileList([]);
      setCreateModalVisible(false);

      // Upload files after port created successfully
      if (createdPortId && uploadFileList.length > 0) {
        let uploaded = 0;
        for (const f of uploadFileList) {
          if (!f.originFileObj) continue; // skip existing attachments
          try {
            const formData = new FormData();
            formData.append('file', f.originFileObj as File);
            await api.post(`/v1/documents/upload/port/${createdPortId}`, formData, { headers: { 'Content-Type': undefined } });
            uploaded++;
          } catch { /* non-blocking */ }
        }
        if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
      }

      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('mã cảng') || msg.includes('Ma cang') || msg.includes('Duplicate')) {
          toast.error('Mã cảng đã tồn tại. Vui lòng nhập mã khác.');
        } else {
          toast.error(msg);
        }
      } else {
        toast.error('Có lỗi xảy ra khi tạo mới');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormFailed = () => {
    // Lỗi validation được hiển thị trực tiếp viền đỏ + message dưới từng trường (AntD), không popup toast
  };

  const handleUpdateFinish = async (values: Record<string, unknown>) => {
    if (!selectedRecord) return;
    const gpsComplete = gpsCoordList.filter(c => c.lat != null && c.lng != null && !isNaN(c.lat) && !isNaN(c.lng));
    setSubmitting(true);
    try {
      const n = (v: unknown): number | undefined =>
        v != null && !Number.isNaN(v as number) ? Number(v) : undefined;

      const coordinateList: Array<{ latitude: number; longitude: number }> = gpsCoordList
        .filter(c => c.lat != null && c.lng != null && !isNaN(c.lat) && !isNaN(c.lng))
        .map(c => ({ latitude: c.lat, longitude: c.lng }));

      const payload = {
        id: selectedRecord.id,
        portCode: (values.portCode as string) || undefined,
        portName: (values.portName as string) || undefined,
        province: (values.province as string) || undefined,
        area: values.area as number | undefined,
        maxVesselCapacity: values.khaNangTiepNhan as number | undefined,
        operationalStatus: (values.operationalStatus as string) || undefined,
        approvalStatus: selectedRecord.approvalStatus === 'APPROVED' ? 'PENDING' : selectedRecord.approvalStatus,
        orgUnitId: (values.orgUnitId as string) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.orgUnitId as string) ? (values.orgUnitId as string) : undefined,
        portGroup: values.portGroup ? Number(values.portGroup) : undefined,
        mapSymbolId: (values.gisLocation as any)?.mapSymbolId || (values.mapSymbolId as string) || undefined,
        geometryType: values.geometryType as string,
        coordinates: (values.gisLocation as any)?.coordinates || undefined,
        detailedLocation: (values.detailedLocation as string) || undefined,
        portClass: values.portClass != null && !Number.isNaN(values.portClass as number)
          ? Number(values.portClass) : undefined,
        coordinateSystem: values.coordinateSystem != null && !Number.isNaN(values.coordinateSystem as number)
          ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null && !Number.isNaN(values.displayRule as number)
          ? Number(values.displayRule) : undefined,
        waterAreaScope: (values.waterAreaScope as string) || null,
        totalBerths: n(values.totalBerths),
        totalAnchoragesTransshipment: n(values.totalAnchoragesTransshipment),
        totalPublicChannels: n(values.totalPublicChannels),
        totalDedicatedChannels: n(values.totalDedicatedChannels),
        totalPublicChannelLength: n(values.totalPublicChannelLength),
        totalDedicatedChannelLength: n(values.totalDedicatedChannelLength),
        totalBuoysBeacons: n(values.totalBuoysBeacons),
        totalDikes: n(values.totalDikes),
        totalDikeLength: n(values.totalDikeLength),
        totalLighthouses: n(values.totalLighthouses),
        buoyBerthCount: n(values.buoyBerthCount),
        anchorageCount: n(values.anchorageCount),
        transshipmentCount: n(values.transshipmentCount),
        otherWaterAreas: (values.otherWaterAreas as string) || null,
        coordinateList,
        infrastructureList: infraList
          .filter((inf) => (inf.infraName || '').trim() || (inf.quantity != null && Number(inf.quantity) > 0))
          .map((inf, idx) => ({ stt: idx + 1, infraName: (inf.infraName || '').trim(), quantity: inf.quantity != null && Number(inf.quantity) > 0 ? Number(inf.quantity) : 1 })),
        remarks: (values.remarks as string) || undefined,
      };
      const res = await import('./api').then((m) => m.updateCangBien(payload));
      toast.success('Cập nhật thành công');
      if (window.parent && (window.parent as any).kchtDetailCache) {
        (window.parent as any).kchtDetailCache[selectedRecord.id] = res;
      }
      // Upload files after update
      // Upload files after port updated
      if (selectedRecord?.id && uploadFileList.length > 0) {
        let uploaded = 0;
        for (const f of uploadFileList) {
          if (!f.originFileObj) continue; // skip existing attachments
          try {
            const formData = new FormData();
            formData.append('file', f.originFileObj as File);
            await api.post(`/v1/documents/upload/port/${selectedRecord.id}`, formData, { headers: { 'Content-Type': undefined } });
            uploaded++;
          } catch { /* non-blocking */ }
        }
        if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
      }
      closeUpdateModal();
      if (!isIframeModal) {
        fetchData();
        fetchTabCounts();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchCangBienList({
        page: page - 1,
        size: pageSize,
        orgUnitId: filterOrgUnitId,
        portName: debouncedName || undefined,
        portCode: debouncedCode || undefined,
        province: filterTinh || undefined,
        operationalStatus: filterStatus,
        approvalStatus: filterApprovalStatus,
        portGroup: filterPortGroup,
        portClass: filterPortClass,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements ?? 0);
    } catch (err: unknown) {
      setIsError(true);
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách cảng biển';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedName, debouncedCode, filterTinh, filterOrgUnitId, filterPortGroup, filterPortClass, filterUpdatedFrom, filterUpdatedTo, filterStatus, filterApprovalStatus]);

  const fetchTabCounts = useCallback(async () => {
    const statuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];
    const counts: Record<string, number> = {};
    await Promise.all([
      ...statuses.map(async (status) => {
        try {
          const res = await fetchCangBienList({ approvalStatus: status, page: 0, size: 1, orgUnitId: filterOrgUnitId });
          counts[status] = res?.totalElements ?? 0;
        } catch { counts[status] = 0; }
      }),
      fetchCangBienList({ page: 0, size: 1, orgUnitId: filterOrgUnitId }).then(res => setTotalAll(res?.totalElements ?? 0)).catch(() => { }),
    ]);
    setTabCounts(counts);
  }, [filterOrgUnitId]);

  useEffect(() => { if (!isIframeModal && orgUnitReady) void fetchData(); }, [fetchData, isIframeModal, orgUnitReady]);
  useEffect(() => { if (!isIframeModal && orgUnitReady) void fetchTabCounts(); }, [fetchTabCounts, isIframeModal, orgUnitReady]);

  const handleDelete = useCallback(
    (record: CangBienResponse) => {
      setDeleteTarget(record);
      setDeleteConfirmText('');
    },
    [],
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const expected = (deleteTarget.portName || '').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expected && input !== 'xóa') {
      toast.error('Vui lòng nhập đúng tên cảng hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await deleteCangBien(deleteTarget.id);
      toast.success('Đã xóa thành công');
      setDeleteTarget(null);
      setDeleteConfirmText('');
      fetchData();
      fetchTabCounts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xóa thất bại');
    }
  };

  const handleApprove = useCallback(
    (record: CangBienResponse) => {
      setApprovingRecord(record);
      setApproveModalOpen(true);
    },
    [],
  );

  const handleConfirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    try {
      // Vòng duyệt do trạng thái hiện tại quyết định: "Chờ Cảng vụ duyệt" là
      // vòng 1, "Chờ Cục duyệt" là vòng 2 (approval-2-level-spec §3.2).
      const isLevel2 = approvingRecord.approvalStatus === 'APPROVED_LEVEL1';
      if (isLevel2) {
        await approveCangBienC2(approvingRecord.id);
      } else {
        await approveCangBienC1(approvingRecord.id);
      }
      toast.success(isLevel2 ? 'Phê duyệt cấp Cục thành công' : 'Phê duyệt cấp Cảng vụ thành công');
      setApproveModalOpen(false);
      setApprovingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
      toast.error(msg);
    }
  }, [approvingRecord, fetchData, fetchTabCounts]);

  const handleSubmitDraft = useCallback(
    (record: CangBienResponse) => {
      setSubmittingRecord(record);
      setSubmitModalOpen(true);
    },
    [],
  );

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    setSubmitModalOpen(false);
    try {
      // Trước đây gửi duyệt bằng cách PUT approvalStatus = 'PENDING' — trạng thái
      // không thuộc tập 7 trạng thái chuẩn và bỏ qua quy tắc phân cấp theo đơn vị
      // gửi. Nay dùng đúng endpoint gửi duyệt của backend.
      await submitCangBien(submittingRecord.id);
      toast.success('Đã gửi phê duyệt');
      setSubmittingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gửi phê duyệt thất bại';
      toast.error(msg);
    }
  }, [submittingRecord, fetchData, fetchTabCounts]);

  const handleReject = useCallback((record: CangBienResponse) => {
    setRejectTarget(record);
    setRejectReason('');
    setRejectError('');
    setRejectModalVisible(true);
  }, []);

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason || rejectReason.trim().length < 10) {
      setRejectError('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    try {
      await rejectCangBien(rejectTarget.id, rejectReason.trim());
      toast.success('Từ chối thành công');
      setRejectModalVisible(false);
      setRejectTarget(null);
      setRejectReason('');
      setRejectError('');
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  };

  const historyHandler = useCallback(async (record: CangBienResponse) => {
    try {
      setLoadingHistory(true);
      setSelectedRecord(record);
      setHistoryModalVisible(true);
      setHistorySearch('');
      historySearchRef.current = '';
      setHistoryDateFrom('');
      setHistoryDateTo('');
      setHistoryEntityId(record.id);
      const { fetchportHistory } = await import('./api');
      const histData = await fetchportHistory(record.id, { page: 0, size: 200 });
      setHistoryRecords(histData.changeHistory || []);
      setHistoryExpanded({});
    } catch (err) {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const getPortGroupLabel = (val: number | null): string => {
    if (!val) return '—';
    return `Nhóm ${val}`;
  };

  // ── Detail drawer (giống BerthListPage.openDetailDrawer: mở ngay với dòng hiện tại,
  //    fetch dữ liệu mới ở nền — KHÔNG bật isLoading để tránh load lại/remount danh sách) ──
  const openDetail = useCallback(async (record: CangBienResponse) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
    try {
      const data = await fetchCangBienById(record.id);
      setSelectedRecord(data);
    } catch {
      toast.error('Không thể tải thông tin chi tiết cảng biển');
    }
    documentApi.listByEntity('port', record.id, { page: 1, size: 20 })
      .then((res) => setDetailFiles(res.data || []))
      .catch(() => setDetailFiles([]));
  }, []);

  // ── rowActions callback ──────────────────────────────────────────
  const rowActions = useCallback(
    (record: CangBienResponse) => {
      const actions: any[] = [
        {
          key: 'view',
          label: 'Chi tiết',
          icon: <EyeOutlined />,
          onClick: () => openDetail(record),
        },
      ];
      if (hasPerm?.(PERMISSIONS.PORT.HISTORY)) {
        actions.push({
          key: 'history',
          label: 'Lịch sử',
          icon: <HistoryOutlined />,
          onClick: () => historyHandler(record),
        });
      }
      const status = record.approvalStatus;
      // Chinh sua — quy tắc 12 (approval-2-level-spec.md mục 3.9)
      if (canEditApprovalRecord(status, { hasPerm: (k: string) => !!hasPerm?.(k), resource: 'port' })) {
        actions.push({
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: <EditOutlined />,
          onClick: async () => {
            // Giống Bến cảng: mở modal NGAY với dòng hiện tại, fetch dữ liệu ở nền —
            // KHÔNG bật setIsLoading để tránh load lại/remount danh sách
            setSelectedRecord(record);
            setUpdateModalVisible(true);
            try {
              const data = await fetchCangBienById(record.id);
              setSelectedRecord(data);
              updateForm.setFieldsValue({
                portCode: data.portCode,
                portName: data.portName,
                province: data.province || undefined,
                orgUnitId: data.orgUnitId || undefined,
                portGroup: data.portGroup != null ? data.portGroup : undefined,
                detailedLocation: data.detailedLocation || undefined,
                portClass: data.portClass,
                waterAreaScope: data.waterAreaScope || undefined,
                totalBerths: data.totalBerths,
                totalAnchoragesTransshipment: data.totalAnchoragesTransshipment,
                totalPublicChannels: data.totalPublicChannels,
                totalDedicatedChannels: data.totalDedicatedChannels,
                totalPublicChannelLength: data.totalPublicChannelLength,
                totalDedicatedChannelLength: data.totalDedicatedChannelLength,
                totalBuoysBeacons: data.totalBuoysBeacons,
                totalDikes: data.totalDikes,
                totalDikeLength: data.totalDikeLength,
                totalLighthouses: data.totalLighthouses,
                buoyBerthCount: data.buoyBerthCount,
                anchorageCount: data.anchorageCount,
                transshipmentCount: data.transshipmentCount,
                otherWaterAreas: data.otherWaterAreas || undefined,
                remarks: data.remarks || undefined,
                gisLocation: data.coordinates ? {
                  geometryType: data.geometryType || undefined,
                  coordinates: data.coordinates,
                  mapSymbolId: data.mapSymbolId,
                } : undefined,
                geometryType: data.geometryType || undefined,
                mapSymbolId: data.mapSymbolId,
                coordinateSystem: data.coordinateSystem,
                displayRule: (data.geometryType || data.coordinates) ? 'Độ, phút, giây (DMS)' : undefined,
              });
              // Load infrastructure & attachments for edit
              setInfraList(((data as any).infrastructureList || []).map((i: any) => ({ stt: i.stt, infraName: i.infraName, quantity: i.quantity })));
              try {
                const attRes = await documentApi.listByEntity('port', record.id, { page: 1, size: 20 });
                setUploadFileList((attRes.data || []).map((a: any) => ({ uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const })));
              } catch { setUploadFileList([]); }
              // Parse coordinates from API response
              const wktCoords2: string = data.coordinates || '';
              const coordArr2 = data.coordinateList;
              const pts2: Array<{ lat: number; lng: number }> = [];
              if (coordArr2 && Array.isArray(coordArr2) && coordArr2.length > 0) {
                pts2.push(...coordArr2.map((c: any) => ({ lat: c.latitude ?? c.lat, lng: c.longitude ?? c.lng })));
              } else if (wktCoords2) {
                const multiMatch2 = wktCoords2.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)\)/);
                if (multiMatch2) {
                  const rawPts2 = multiMatch2[1].split('),(');
                  pts2.push(...rawPts2.map((pt: string) => {
                    const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
                    return { lat: Number(parts[1]), lng: Number(parts[0]) };
                  }));
                } else {
                  const match2 = wktCoords2.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
                  if (match2) {
                    pts2.push({ lat: Number(match2[2]), lng: Number(match2[1]) });
                  }
                }
              } else if (data.latitude != null && data.longitude != null) {
                pts2.push({ lat: Number(data.latitude), lng: Number(data.longitude) });
              }
              setGpsCoordList(pts2);
            } catch (err) {
              toast.error('Không thể tải thông tin chỉnh sửa cảng biển');
              setUpdateModalVisible(false);
            }
          },
        });
      }
      // DRAFT: Gửi phê duyệt
      if (status === 'DRAFT' && hasPerm?.(PERMISSIONS.PORT.UPDATE)) {
        actions.push({
          key: 'submit',
          label: 'Gửi phê duyệt',
          icon: <SendOutlined />,
          onClick: () => handleSubmitDraft(record),
        });
      }
      // CHO_PHE_DUYET / PENDING / PENDING_APPROVAL: Phê duyệt + Từ chối
      if ((status === 'CHO_PHE_DUYET' || status === 'PENDING' || status === 'PENDING_APPROVAL') && hasPerm?.('port:approve')) {
        actions.push({
          key: 'approve',
          label: 'Phê duyệt',
          icon: <CheckCircleOutlined />,
          onClick: () => handleApprove(record),
        });
        actions.push({
          key: 'reject',
          label: 'Từ chối',
          icon: <CloseCircleOutlined />,
          danger: true,
          onClick: () => handleReject(record),
        });
      }
      // Xóa: chỉ trạng thái DRAFT/NHAP
      if (hasPerm?.(PERMISSIONS.PORT.DELETE) && (status === 'DRAFT' || status === 'NHAP')) {
        actions.push({
          key: 'delete',
          label: 'Xóa',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDelete(record),
        });
      }
      return actions;
    },
    [hasPerm, updateForm, handleApprove, handleDelete, handleReject, historyHandler, handleSubmitDraft, openDetail],
  );

  // ── Columns (DataTable format) ───────────────────────────────────
  const columns = useMemo(
    () => [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        fixed: 'left' as const,
        type: 'mono' as const,
        align: 'center' as const,
        render: (_: unknown, __: CangBienResponse, idx: number) => (
          <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span>
        ),
      },
      // Ẩn cột mã cảng theo yêu cầu
      // {
      //   key: 'portCode',
      //   label: 'Mã cảng',
      //   dataIndex: 'portCode',
      //   width: 160,
      //   render: (portCode: string) => <Tag color="cyan">{portCode}</Tag>,
      // },
      {
        key: 'portName',
        label: 'Tên cảng biển',
        dataIndex: 'portName',
        width: 280,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'portName' ? sortOrder : null,
        render: (v: string, record: CangBienResponse) => (
          <a
            onClick={() => openDetail(record)}
            style={{ fontWeight: fontWeightBold, color: actionPrimary, cursor: 'pointer' }}
          >
            {v}
          </a>
        ),
      },
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        width: 260,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'orgUnitId' ? sortOrder : null,
        render: (_v: string | null, record: CangBienResponse) => {
          const level2 = record.orgUnitId ? orgLevel2Map.get(record.orgUnitId) : undefined;
          return <span style={{ fontWeight: fontWeightBold }}>{level2 || record.orgUnitName || _v || '—'}</span>;
        },
      },
      {
        key: 'portGroup',
        label: 'Nhóm cảng biển',
        dataIndex: 'portGroup',
        width: 170,
        sortable: true,
        sortOrder: sortField === 'portGroup' ? sortOrder : null,
        render: (v: number | null) => getPortGroupLabel(v),
      },
      {
        key: 'portClass',
        label: 'Phân cấp cảng biển',
        dataIndex: 'portClass',
        width: 180,
        sortable: true,
        sortOrder: sortField === 'portClass' ? sortOrder : null,
        render: (v: number | null) => v != null ? (v === 5 ? 'Cấp đặc biệt' : `Cấp ${v}`) : '—',
      },
      {
        key: 'province',
        label: 'Địa điểm (Tỉnh/Thành phố)',
        dataIndex: 'province',
        width: 220,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'province' ? sortOrder : null,
        render: (v: string | null) => v || '—',
      },
      {
        key: 'approvalStatus',
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        width: 170,
        sortable: true,
        sortOrder: sortField === 'approvalStatus' ? sortOrder : null,
        render: (v: string) => <ApprovalStatusBadge status={v} />,
      },
      {
        key: 'updatedBy',
        label: 'Cán bộ cập nhật',
        dataIndex: 'updatedByName',
        width: 190,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'updatedBy' ? sortOrder : null,
        render: (v: string | null, record: CangBienResponse) => {
          const name = v || record.updatedByName || (record as any).createdByName || '—';
          const date = record.updatedAt || (record as any).createdAt;
          return (
            <div style={{ lineHeight: '1.35' }}>
              <div style={{ fontWeight: fontWeightBold, color: '#0F172A', fontSize: fontSizeMd, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </div>
              <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
                {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
              </div>
            </div>
          );
        },
      },
    ],
    [page, pageSize, getPortGroupLabel, orgLevel2Map, sortField, sortOrder, openDetail],
  );

  // ── Form field style ─────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    borderRadius: radiusPill,
    height: 40,
  };
  const selectStyle: React.CSSProperties = {
    borderRadius: radiusPill,
    height: 40,
  };
  const numberInputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: radiusPill,
    height: 40,
  };
  const historyTabStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderRadius: 0,
    border: 'none',
    background: 'transparent',
    fontSize: fontSizeMd,
    padding: `0 ${spaceMd}px`,
  };

  // Thứ tự hiển thị field trong lịch sử theo đúng thứ tự form tạo mới cảng biển (PortFormContent.tsx)
  const HISTORY_FIELD_ORDER = ['orgUnitId', 'portGroup', 'portCode', 'portName', 'province', 'detailedLocation', 'portClass', 'waterAreaScope', 'totalBerths', 'totalAnchoragesTransshipment', 'totalPublicChannels', 'totalDedicatedChannels', 'totalPublicChannelLength', 'totalDedicatedChannelLength', 'totalBuoysBeacons', 'totalDikes', 'totalDikeLength', 'totalLighthouses', 'buoyBerthCount', 'anchorageCount', 'transshipmentCount', 'otherWaterAreas', 'remarks', 'geometryType', 'mapSymbolId', 'coordinateSystem', 'displayRule'];

  // Tổng số trường thay đổi = số bản ghi changeHistory (backend ghi 1 dòng/trường thay đổi)
  const historyFieldCount = useMemo(() => historyRecords.length, [historyRecords]);

  // ── Render lịch sử theo chuẩn Hệ thống VTS ─────────────────────────
  const renderPortHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
    for (const r of sorted) {
      if (q) {
        const fn = (r.fieldName || '').toLowerCase();
        const ov = (r.oldValue || '').toLowerCase();
        const nv = (r.newValue || '').toLowerCase();
        const lb = historyFieldName(r.fieldName || '').toLowerCase();
        const od = historyFieldValue(r.fieldName, r.oldValue, orgMap, symbolMap).toLowerCase();
        const nd = historyFieldValue(r.fieldName, r.newValue, orgMap, symbolMap).toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) continue;
      }
      if (historyEntityFilter && r.entityId !== historyEntityFilter) continue;
      if (historyDateFrom || historyDateTo) {
        const cd = (r.changedAt || r.createdAt || '').substring(0, 16);
        if (historyDateFrom && cd < historyDateFrom.replace(' ', 'T')) continue;
        if (historyDateTo && cd > historyDateTo.replace(' ', 'T') + ':59') continue;
      }
      const ts = r.changedAt || r.createdAt || '';
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || '')) prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor: r.changedBy || '', items: [r] });
    }
    if (groups.length === 0) return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
      </div>
    );
    const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; };
    return (
      <div>{groups.map((g, gi) => {
        const rec0 = g.items[0] || {};
        const orgId = rec0.orgUnitId || selectedRecord?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        const unitName = (orgName ? (orgName.split(' - ').pop() || orgName) : (rec0.orgUnitName || rec0.unitName || selectedRecord?.orgUnitName)) || '—';
        const barColor = actionPrimary;
        const changes = g.items.map((item: any) => ({ field: item.fieldName || '—', oldValue: item.oldValue ?? null, newValue: item.newValue ?? null }));
        const isCreate = changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
        const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
        const orderedChanges = [...changes].sort((a: any, b: any) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        }).filter((c: any) => c.field !== 'infrastructureList' && c.field !== 'attachments');
        const formatHistoryValue = (fn: string, raw: string | null) => {
          if (raw === null || raw === '(null)' || raw === '') return null;
          const t = raw.trim();
          if (t.startsWith('[') && t.endsWith(']')) {
            if (t === '[]') return 'Không có';
            const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
            return `${parts.length} công trình hạ tầng`;
          }
          if (/^-?\d+(\.\d+)?$/.test(t)) {
            const n = Number(t);
            return Number.isInteger(n) ? String(n) : t;
          }
          return historyFieldValue(fn, raw, orgMap, symbolMap);
        };
        if (orderedChanges.length === 0) return null;
        return (
          <div key={gi} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
            <div style={{ minWidth: 0, paddingTop: spaceXs }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                <Typography.Text style={historyTimeStyle}>
                  {g.ts ? fmtTime(g.ts) : '—'}
                </Typography.Text>
                <span style={{ flexShrink: 0 }}>
                  {isCreate && <span style={historyBadgeStyle(statusOperational)}>Thêm mới</span>}
                  {!isCreate && <span style={historyBadgeStyle(actionPrimary)}>Chỉnh sửa</span>}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                <Typography.Text style={historyMetaRowStyle}>
                  Người cập nhật: {g.actor || '—'}
                </Typography.Text>
                <Typography.Text style={historyMetaRowStyle}>
                  Đơn vị: {unitName}
                </Typography.Text>
              </div>
            </div>
            <div style={historyInfoCardStyle}>
              <div style={historyAccentBarStyle(barColor)} />
              <Typography.Text style={historyInfoTitleStyle}>
                {informationTitle}
              </Typography.Text>
              {orderedChanges.length > 0 ? <div>{orderedChanges.map((change, ri: number) => {
                const fn = change.field;
                const ov = formatHistoryValue(fn, change.oldValue);
                const nv = formatHistoryValue(fn, change.newValue);
                const renderCell = (rawVal: string | null) => {
                  if (fn === 'mapSymbolId' && rawVal && rawVal !== '(null)') {
                    const img = symbolImageMap.get(rawVal);
                    const name = symbolMap.get(rawVal) || rawVal;
                    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}{name}</span>;
                  }
                  return null;
                };
                return isCreate ? (
                  <div key={`${fn}-${ri}`} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                    <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                    <span title={nv ?? '—'} style={historyNewValueStyle}>{renderCell(change.newValue) ?? (nv ?? '—')}</span>
                  </div>
                ) : (
                  <div key={`${fn}-${ri}`} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                    <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                    <span title={ov ?? '—'} style={historyOldValueStyle}>{renderCell(change.oldValue) ?? (ov ?? '—')}</span>
                    <span style={historyArrowStyle}>→</span>
                    <span title={nv ?? '—'} style={historyNewValueStyle}>{renderCell(change.newValue) ?? (nv ?? '—')}</span>
                  </div>
                );
              })}</div> : <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>}
            </div>
          </div>
        );
      })}</div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      {!isIframeModal && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
          <ScreenHeader
            breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý cảng biển' }]}
            actions={[
              hasPerm?.('Port:create')
                ? {
                  key: 'create',
                  label: 'Thêm mới',
                  icon: <PlusOutlined />,
                  variant: 'primary' as const,
                  onClick: () => setCreateModalVisible(true),
                }
                : null,

            ].filter(Boolean)}
          />

          <FilterTableLayout
            filterCollapsed={filterCollapsed}
            onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
            onFilterApply={handleFilterApply}
            onFilterReset={handleFilterReset}
            loading={isLoading}
            error={isError}
            onRetry={fetchData}
            filterContent={<>
              <div style={{ marginBottom: 12, marginTop: spaceMd }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Đơn vị quản lý
                </div>
                <OrgUnitTreeSelect
                  organizations={orgUnits}
                  placeholder="Chọn đơn vị..."
                  allowClear
                  showPath
                  allLabel="Tất cả"
                  treeDefaultExpandAll={false}
                  value={filterValues.orgUnitId || undefined}
                  onChange={(val) => setFilterValues((prev) => ({ ...prev, orgUnitId: val }))}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên cảng biển</div>
                <Input placeholder="Tìm theo tên cảng biển..." allowClear
                  value={filterValues.portName || ''}
                  onChange={(e) => setFilterValues((prev) => ({ ...prev, portName: e.target.value }))}
                  onPressEnter={handleFilterApply}
                  style={{ borderRadius: radiusPill, height: 40 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Phân cấp</div>
                <Select placeholder="Chọn phân cấp" allowClear
                  value={filterValues.portClass || undefined}
                  onChange={(val) => setFilterValues((prev) => ({ ...prev, portClass: val }))}
                  options={[{ value: '5', label: 'Cấp đặc biệt' }, { value: '1', label: 'Cấp 1' }, { value: '2', label: 'Cấp 2' }, { value: '3', label: 'Cấp 3' }, { value: '4', label: 'Cấp 4' }]}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </div>
              {filterCollapsed && (<>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Nhóm cảng biển</div>
                  <Select placeholder="Chọn nhóm" allowClear
                    value={filterValues.portGroup || undefined}
                    onChange={(val) => setFilterValues((prev) => ({ ...prev, portGroup: val }))}
                    options={[{ value: '1', label: 'Nhóm 1' }, { value: '2', label: 'Nhóm 2' }, { value: '3', label: 'Nhóm 3' }, { value: '4', label: 'Nhóm 4' }, { value: '5', label: 'Nhóm 5' }]}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã cảng biển</div>
                  <Input placeholder="Tìm theo mã cảng biển..." allowClear
                    value={filterValues.portCode || ''}
                    onChange={(e) => setFilterValues((prev) => ({ ...prev, portCode: e.target.value }))}
                    onPressEnter={handleFilterApply}
                    style={{ borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tỉnh/Thành phố</div>
                  <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    value={filterValues.province || undefined}
                    onChange={(val) => setFilterValues((prev) => ({ ...prev, province: val }))}
                    options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
                  <DatePicker.RangePicker format="DD/MM/YYYY"
                    placeholder={['Chọn từ ngày', 'Chọn đến ngày']} allowClear className="port-range-picker" popupClassName="range-single-panel"
                    value={[filterValues.updatedFrom ? dayjs(filterValues.updatedFrom) : null, filterValues.updatedTo ? dayjs(filterValues.updatedTo) : null]}
                    onChange={(dates) => setFilterValues((prev) => ({ ...prev, updatedFrom: dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined, updatedTo: dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined }))}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} />
                </div>
                <style>{`.port-range-picker .ant-picker-cell-selected .ant-picker-cell-inner{background:${actionPrimary}!important}.port-range-picker .ant-picker-ok button{background:${actionPrimary}!important;border-color:${actionPrimary}!important;border-radius:${radiusPill}px!important}.port-range-picker .ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner{background:${actionPrimary}15!important;color:${actionPrimary}!important}.port-range-picker .ant-picker-today-btn{color:${actionPrimary}!important}.range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child{display:none!important}`}</style>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Trạng thái</div>
                  <Select placeholder="Tất cả" allowClear
                    value={filterValues.approvalStatus || undefined}
                    onChange={(val) => setFilterValues((prev) => ({ ...prev, approvalStatus: val }))}
                    options={APPROVAL_STATUS_OPTIONS}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </div>
              </>)}
            </>}
            statusTabs={[
              { key: 'all', label: 'Tất cả', count: totalAll || 0, color: actionPrimary, active: !activeStatusTab },
              { key: 'DRAFT', label: 'Lưu tạm', count: tabCounts['DRAFT'] ?? 0, color: statusDraft, active: activeStatusTab === 'DRAFT' },
              { key: 'PENDING', label: 'Chờ Cảng vụ duyệt', count: tabCounts['PENDING'] ?? 0, color: statusAttention, active: activeStatusTab === 'PENDING' },
              { key: 'APPROVED', label: 'Đã duyệt', count: tabCounts['APPROVED'] ?? 0, color: statusOperational, active: activeStatusTab === 'APPROVED' },
              { key: 'REJECTED', label: 'Bị trả về', count: tabCounts['REJECTED'] ?? 0, color: statusCritical, active: activeStatusTab === 'REJECTED' },
            ]}
            onStatusTabChange={(key) => {
              setActiveStatusTab(key === 'all' ? '' : key);
              setFilterApprovalStatus(key === 'all' ? undefined : key);
              if (key === 'all') { setFilterStatus(undefined); setFilterTinh(undefined); setFilterName(''); setFilterCode(''); }
              setPage(1);
            }}
          >
            <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
            {isError ? null : !isLoading && dataSource.length === 0 ? (
              <DataTable dataSource={[]} rowKey="id"
                emptyState={<div style={{ padding: '40px 0', textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📭</div><div style={{ fontSize: fontSizeLg, color: textSecondary, marginBottom: 8 }}>Không tìm thấy cảng biển nào phù hợp</div></div>}
              />
            ) : !isLoading && !isError && dataSource.length > 0 ? (
              <DataTable columns={columns}
                dataSource={[...dataSource].sort((a: any, b: any) => {
                  if (!sortField) return 0;
                  const resolve = (r: any) => {
                    if (sortField === 'orgUnitId') return orgLevel2Map.get(r.orgUnitId) ?? r.orgUnitName ?? '';
                    if (sortField === 'updatedBy') return r.updatedByName ?? '';
                    if (sortField === 'approvalStatus') {
                      const rank: Record<string, number> = { DRAFT: 1, PROPOSED: 1, PENDING: 2, PENDING_APPROVAL: 2, APPROVED: 3, REJECTED: 4 };
                      return rank[String(r.approvalStatus || '').toUpperCase()] ?? 99;
                    }
                    return r[sortField] ?? '';
                  };
                  const aVal = resolve(a);
                  const bVal = resolve(b);
                  const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi');
                  return sortOrder === 'ascend' ? cmp : -cmp;
                })}
                rowKey="id" rowActions={rowActions} loading={false}
                onSort={(key: string, order: 'asc' | 'desc') => { setSortField(key); setSortOrder(order === 'asc' ? 'ascend' : 'descend'); setPage(1); }}
                scroll={{ x: 'max-content', y: 550 }}
              />
            ) : null}
            <Pagination total={total} current={page} pageSize={pageSize}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </FilterTableLayout>
        </div>
      )}

      {/* ── Create Drawer ─────────────────────────────── */}
      {!isIframeModal && (
        <Drawer
          {...drawerProps}
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Thêm mới cảng biển
            </span>
          }
          open={createModalVisible}
          onClose={() => { setCreateModalVisible(false); setInfraList([]); setUploadFileList([]); setGpsCoordList([]); createForm.resetFields(); }}
          extra={<Button type="text" onClick={() => { setCreateModalVisible(false); setInfraList([]); setUploadFileList([]); setGpsCoordList([]); createForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
          footer={
            <div style={drawerFooterStyle}>
              <Button onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); createForm.submit(); }} loading={submitting && actionType === 'draft'} style={outlineButtonStyle}>Lưu tạm</Button>
              {canSubmitForApproval && <Button type="primary" onClick={() => { actionTypeRef.current = 'submit'; setActionType('submit'); createForm.submit(); }} loading={submitting && actionType === 'submit'} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button>}
              {canSubmitForApproval && <Button type="primary" onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); createForm.submit(); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>}
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
          afterOpenChange={async (open) => {
            if (open) {
              // Reset toàn bộ trước khi mở form mới
              createForm.resetFields();
              setInfraList([]);
              setUploadFileList([]);
              setGpsCoordList([]);
              setCreateTabKey('general');
              // Auto-generate mã cảng mới
              setPortCodeLoading(true);
              try {
                const res = await api.get('/v1/ports/generate-code');
                const code: string | undefined = res.data?.data?.portCode;
                if (code) {
                  createForm.setFieldsValue({ portCode: code });
                }
              } catch {
                toast.error('Không thể tạo mã cảng. Vui lòng thử lại.');
              } finally {
                setPortCodeLoading(false);
              }
            }
          }}
        >
          <style>{requiredMarkStyle}</style>
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreateFinish}
            onFinishFailed={handleFormFailed}
            initialValues={{ approvalStatus: 'APPROVED' }}
          >
            <Tabs activeKey={createTabKey} onChange={setCreateTabKey} tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }} items={[
              {
                key: 'general', label: 'Thông tin chung',
                children: (<div style={{ paddingTop: 16 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="orgUnitId"
                        {...labelProps('Đơn vị quản lý')}
                        required
                        rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <OrgUnitTreeSelect
                          organizations={orgUnits}
                          placeholder="Chọn đơn vị quản lý..."
                          allowClear
                          showPath
                          treeDefaultExpandAll={false}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="portGroup"
                        {...labelProps('Nhóm cảng biển')}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select placeholder="Chọn nhóm cảng" allowClear style={selectStyle}
                          options={[
                            { value: 1, label: 'Nhóm 1' },
                            { value: 2, label: 'Nhóm 2' },
                            { value: 3, label: 'Nhóm 3' },
                            { value: 4, label: 'Nhóm 4' },
                            { value: 5, label: 'Nhóm 5' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="portCode"
                        {...labelProps('Mã cảng biển')}
                        style={{ marginBottom: spaceFormField }}
                        tooltip="Mã cảng được sinh tự động, không thể chỉnh sửa"
                      >
                        <Input
                          disabled
                          placeholder={portCodeLoading ? 'Đang sinh mã...' : 'Mã tự động'}
                          maxLength={50}
                          style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="portName"
                        {...labelProps('Tên cảng biển')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[
                          { required: true, message: 'Tên cảng không được để trống' },
                          { max: 255, message: 'Tên cảng tối đa 255 ký tự' },
                        ]}
                        validateStatus={atMaxCreate.portName ? 'error' : undefined} help={atMaxCreate.portName ? 'Đã đạt tối đa 255 ký tự' : undefined}
                      >
                        <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="province"
                        {...labelProps('Địa điểm (Tỉnh/Thành phố)')}
                        required
                        rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          showSearch
                          placeholder="Chọn tỉnh/thành phố..."
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="detailedLocation"
                        {...labelProps('Địa điểm chi tiết')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.detailedLocation ? 'error' : undefined} help={atMaxCreate.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}
                      >
                        <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="portClass"
                        {...labelProps('Phân cấp cảng biển')}
                        required
                        rules={[{ required: true, message: 'Phân cấp cảng biển là bắt buộc' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select placeholder="Chọn phân cấp" allowClear style={selectStyle}
                          options={[
                            { value: 5, label: 'Cấp đặc biệt' },
                            { value: 1, label: 'Cấp 1' },
                            { value: 2, label: 'Cấp 2' },
                            { value: 3, label: 'Cấp 3' },
                            { value: 4, label: 'Cấp 4' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="waterAreaScope"
                        {...labelProps('Phạm vi vùng nước cảng biển')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.waterAreaScope ? 'error' : undefined} help={atMaxCreate.waterAreaScope ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                      >
                        <Input placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="totalBerths"
                        {...labelProps('Tổng số bến cảng')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.totalBerths ? 'error' : undefined} help={atMaxCreate.totalBerths ? 'Đã đạt tối đa 5 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="totalAnchoragesTransshipment"
                        {...labelProps('Tổng số khu neo đậu, khu chuyển tải')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.totalAnchoragesTransshipment ? 'error' : undefined} help={atMaxCreate.totalAnchoragesTransshipment ? 'Đã đạt tối đa 5 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="totalPublicChannels"
                        {...labelProps('Tổng số tuyến luồng hàng hải công cộng')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.totalPublicChannels ? 'error' : undefined} help={atMaxCreate.totalPublicChannels ? 'Đã đạt tối đa 5 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="totalDedicatedChannels"
                        {...labelProps('Tổng số tuyến luồng hàng hải chuyên dùng')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.totalDedicatedChannels ? 'error' : undefined} help={atMaxCreate.totalDedicatedChannels ? 'Đã đạt tối đa 5 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="totalPublicChannelLength"
                        {...labelProps('Tổng chiều dài luồng hàng hải công cộng (km)')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.totalPublicChannelLength ? 'error' : undefined} help={atMaxCreate.totalPublicChannelLength ? 'Đã đạt tối đa 20 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="totalDedicatedChannelLength"
                        {...labelProps('Tổng chiều dài luồng hàng hải chuyên dùng (km)')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.totalDedicatedChannelLength ? 'error' : undefined} help={atMaxCreate.totalDedicatedChannelLength ? 'Đã đạt tối đa 20 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="totalBuoysBeacons"
                        {...labelProps('Tổng số phao tiêu, báo hiệu hàng hải trên luồng')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.totalBuoysBeacons ? 'error' : undefined} help={atMaxCreate.totalBuoysBeacons ? 'Đã đạt tối đa 5 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="totalDikes"
                        {...labelProps('Tổng số đê, kè')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.totalDikes ? 'error' : undefined} help={atMaxCreate.totalDikes ? 'Đã đạt tối đa 5 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="totalDikeLength"
                        {...labelProps('Tổng chiều dài hệ thống đê, kè (km)')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.totalDikeLength ? 'error' : undefined} help={atMaxCreate.totalDikeLength ? 'Đã đạt tối đa 20 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="totalLighthouses"
                        {...labelProps('Tổng số đèn biển, đăng, tiêu độc lập')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.totalLighthouses ? 'error' : undefined} help={atMaxCreate.totalLighthouses ? 'Đã đạt tối đa 5 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="buoyBerthCount"
                        {...labelProps('Số lượng bến phao')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.buoyBerthCount ? 'error' : undefined} help={atMaxCreate.buoyBerthCount ? 'Đã đạt tối đa 5 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="anchorageCount"
                        {...labelProps('Số lượng khu neo đậu')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.anchorageCount ? 'error' : undefined} help={atMaxCreate.anchorageCount ? 'Đã đạt tối đa 5 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="transshipmentCount"
                        {...labelProps('Số lượng khu chuyển tải')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.transshipmentCount ? 'error' : undefined} help={atMaxCreate.transshipmentCount ? 'Đã đạt tối đa 5 ký tự' : undefined}
                      >
                        <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="otherWaterAreas"
                        {...labelProps('Các khu nước, vùng nước khác')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.otherWaterAreas ? 'error' : undefined} help={atMaxCreate.otherWaterAreas ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                      >
                        <Input placeholder="Mô tả" maxLength={2000} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        name="remarks"
                        {...labelProps('Ghi chú')}
                        style={{ marginBottom: spaceFormField }}
                        validateStatus={atMaxCreate.remarks ? 'error' : undefined} help={atMaxCreate.remarks ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                      >
                        <Input.TextArea rows={3} placeholder="Ghi chú" maxLength={2000}
                          styles={{ textarea: { borderRadius: radiusPill, resize: 'none', padding: '12px 16px' } }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>)
              },
              {
                key: 'gis', label: 'Thông tin vị trí',
                children: (<div style={{ paddingTop: 16 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="geometryType"
                        {...labelProps('Loại đối tượng')}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn loại đối tượng"
                          allowClear
                          options={[
                            { value: 'POINT', label: 'Đối tượng điểm' },
                            { value: 'LINE', label: 'Đối tượng đường' },
                            { value: 'POLYGON', label: 'Đối tượng vùng' },
                          ]}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="mapSymbolId"
                        {...labelProps('Biểu tượng')}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn biểu tượng bản đồ"
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          disabled={!createGeometryType}
                          style={selectStyle}
                        >
                          {symbols.map((sym) => (
                            <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                              <Space>
                                {sym.image && (
                                  <img
                                    src={
                                      sym.image.startsWith('data:')
                                        ? sym.image
                                        : `data:image/png;base64,${sym.image}`
                                    }
                                    alt={sym.name}
                                    style={{ width: 20, height: 20, objectFit: 'contain' }}
                                  />
                                )}
                                <span>
                                  {sym.code ? `${sym.name} (${sym.code})` : sym.name}
                                </span>
                              </Space>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="coordinateSystem"
                        {...labelProps('Hệ quy chiếu')}
                        style={{ marginBottom: spaceFormField }}
                        rules={createGeometryType ? [{ required: true, message: 'Hệ quy chiếu là bắt buộc khi chọn loại đối tượng' }] : []}
                      >
                        <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle}
                          options={[
                            { value: 1, label: 'WGS-84' },
                            { value: 2, label: 'VN-2000' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="displayRule"
                        {...labelProps('Quy tắc hiển thị')}
                        style={{ marginBottom: spaceFormField }}
                        rules={createGeometryType ? [{ required: true, message: 'Quy tắc hiển thị là bắt buộc khi chọn loại đối tượng' }] : []}
                      >
                        <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  {/* GPS Coordinates (DMS) */}
                  <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS{createGeometryType && <span style={{ color: colors.error, marginLeft: 4, fontSize: fontSizeMd }}>*</span>}</span>
                    </span>
                    {gpsCoordList.length > 0 && (
                      <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!createGeometryType} style={{ borderRadius: radiusPill }}>
                        Thêm tọa độ
                      </Button>
                    )}
                  </div>
                  {gpsCoordList.length === 0 ? (
                    <div style={{
                      padding: '32px 16px',
                      textAlign: 'center',
                      border: `1px dashed ${borderDefault}`,
                      borderRadius: radiusMd,
                      background: surfaceCard,
                    }}>
                      <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                        Chưa có tọa độ nào.
                      </span>
                      <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!createGeometryType} style={{ borderRadius: radiusPill }}>
                        Thêm tọa độ
                      </Button>
                    </div>
                  ) : (
                    <PagedTable
                      dataSource={gpsCoordList.map((c, i) => ({ ...c, _idx: i }))}
                      tableProps={{ scroll: { x: 820 } }}
                      errorText={gpsError ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>⚠</span><span>{gpsError}</span></span> : undefined}
                    >
                      <Table.Column
                        title="Vĩ độ (N)"
                        key="lat"
                        render={(_: any, record: any) => {
                          const dms = ddToDms(record.lat);
                          return (
                            <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                              <InputNumber value={dms.d} min={0} max={90} placeholder="Độ"
                                onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', Number(v ?? 0), dms.m, dms.s)}
                                style={{ flex: 1 }} controls={false} />
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                fontSize: fontSizeSm, color: textTertiary,
                              }}>°</span>
                              <InputNumber value={dms.m} min={0} max={59} placeholder="Phút"
                                onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, Number(v ?? 0), dms.s)}
                                style={{ flex: 1 }} controls={false} />
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                fontSize: fontSizeSm, color: textTertiary,
                              }}>'</span>
                              <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber}
                                onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, dms.m, Number(v ?? 0))}
                                style={{ flex: 1.2 }} controls={false} />
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0,
                                fontSize: fontSizeSm, color: textTertiary,
                              }}>"</span>
                            </Space.Compact>
                          );
                        }}
                        onHeaderCell={() => ({
                          style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                        })}
                      />
                      <Table.Column
                        title="Kinh độ (E)"
                        key="lng"
                        render={(_: any, record: any) => {
                          const dms = ddToDms(record.lng);
                          return (
                            <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                              <InputNumber value={dms.d} min={0} max={180} placeholder="Độ"
                                onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', Number(v ?? 0), dms.m, dms.s)}
                                style={{ flex: 1 }} controls={false} />
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                fontSize: fontSizeSm, color: textTertiary,
                              }}>°</span>
                              <InputNumber value={dms.m} min={0} max={59} placeholder="Phút"
                                onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, Number(v ?? 0), dms.s)}
                                style={{ flex: 1 }} controls={false} />
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                fontSize: fontSizeSm, color: textTertiary,
                              }}>'</span>
                              <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber}
                                onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, dms.m, Number(v ?? 0))}
                                style={{ flex: 1.2 }} controls={false} />
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0,
                                fontSize: fontSizeSm, color: textTertiary,
                              }}>"</span>
                            </Space.Compact>
                          );
                        }}
                        onHeaderCell={() => ({
                          style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                        })}
                      />
                      <Table.Column
                        title=""
                        key="actions"
                        width={44}
                        align="center"
                        render={(_: any, record: any) => (
                          <Button type="link" danger size="small" icon={<DeleteOutlined />}
                            onClick={() => removeGpsPoint(record._idx)} />
                        )}
                        onHeaderCell={() => ({
                          style: { background: colors.bodyBg, padding: '12px 6px' },
                        })}
                      />
                        </PagedTable>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'infra', label: 'Công trình KCHT trực thuộc',
                children: (<div style={{ paddingTop: 16 }}>
                  {/* Infra label + add button */}
                  <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Công trình KCHT trực thuộc</span>
                    {infraList.length > 0 && (
                      <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addInfra} style={{ borderRadius: radiusPill }}>
                        Thêm công trình
                      </Button>
                    )}
                  </div>
                  {infraList.length === 0 ? (
                    <div style={{
                      padding: '32px 16px', textAlign: 'center',
                      border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard,
                    }}>
                      <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                        Chưa có công trình nào.
                      </span>
                      <Button type="dashed" icon={<PlusOutlined />} onClick={addInfra} style={{ borderRadius: radiusPill }}>
                        Thêm công trình
                      </Button>
                    </div>
                  ) : (
                    <PagedTable
                      dataSource={infraList.map((inf, i) => ({ ...inf, _idx: i }))}
                      tableProps={{ scroll: { x: 600 } }}
                    >
                      <Table.Column
                        title="Tên Công Trình"
                        key="name"
                        align="center"
                        render={(_: any, record: any) => (
                          <Input
                            value={record.infraName}
                            onChange={(e) => updateInfraName(record._idx, e.target.value)}
                            placeholder="Nhập tên công trình"
                            maxLength={500}
                            showCount
                            style={{ borderRadius: radiusPill, height: 40 }}
                          />
                        )}
                        onHeaderCell={() => ({
                          style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                        })}
                      />
                      <Table.Column
                        title="Số Lượng"
                        key="quantity"
                        width={100}
                        align="center"
                        render={(_: any, record: any) => {
                          const val = record.quantity;
                          return (
                            <div style={{ position: 'relative' }}>
                              <InputNumber
                                value={val}
                                onChange={(v) => updateInfraQty(record._idx, v)}
                                placeholder="1-5"
                                min={0}
                                max={5}
                                style={{ width: '100%', borderRadius: radiusPill, paddingRight: 32 }}
                              />
                              <span style={{
                                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                fontSize: fontSizeSm, color: textTertiary, pointerEvents: 'none',
                              }}>{val ?? 0}/5</span>
                            </div>
                          );
                        }}
                        onHeaderCell={() => ({
                          style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                        })}
                      />
                      <Table.Column
                        title=""
                        key="actions"
                        width={44}
                        align="center"
                        render={(_: any, record: any) => (
                          <Button type="link" danger size="small" icon={<DeleteOutlined />}
                            onClick={() => removeInfra(record._idx)} />
                        )}
                        onHeaderCell={() => ({
                          style: { background: colors.bodyBg, padding: '12px 6px' },
                        })}
                      />
                    </PagedTable>
                  )}
                </div>)
              },
              {
                key: 'files', label: 'File đính kèm',
                children: (<div style={{ paddingTop: 16 }}>
                  {/* File label + add button */}
                  <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
                    {uploadFileList.length > 0 && (
                      <Upload
                        beforeUpload={(file) => {
                          if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                          if (uploadFileList.length >= 10) { message.error('Tối đa 10 file'); return false; }
                          setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                          return false;
                        }}
                        showUploadList={false}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                        multiple
                      >
                        <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>
                          Thêm file
                        </Button>
                      </Upload>
                    )}
                  </div>
                  {uploadFileList.length === 0 ? (
                    <div style={{
                      padding: '32px 16px', textAlign: 'center',
                      border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard,
                    }}>
                      <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                        Chưa có file đính kèm.
                      </span>
                      <Upload
                        beforeUpload={(file) => {
                          if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                          setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                          return false;
                        }}
                        showUploadList={false}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                        multiple
                      >
                        <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>
                          Chọn file
                        </Button>
                      </Upload>
                    </div>
                  ) : (
                    <PagedTable
                      dataSource={uploadFileList.map((f, i) => ({ ...f, _idx: i }))}
                      tableProps={{ scroll: { x: 400 } }}
                    >
                      <Table.Column
                        title="Tên file"
                        key="name"
                        dataIndex="name"
                        render={(name: string) => (
                          <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
                            <FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />
                            {name}
                          </span>
                        )}
                        onHeaderCell={() => ({
                          style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                        })}
                      />
                      <Table.Column
                        title=""
                        key="actions"
                        width={44}
                        align="center"
                        render={(_: any, record: any) => (
                          <Button type="link" danger size="small" icon={<DeleteOutlined />}
                            onClick={() => setUploadFileList(uploadFileList.filter(x => x.uid !== record.uid))} />
                        )}
                        onHeaderCell={() => ({
                          style: { background: colors.bodyBg, padding: '12px 6px' },
                        })}
                      />
                    </PagedTable>
                  )}
                  <div style={{ marginTop: spaceSm }}>
                    <span style={uploadHintStyle}>
                      Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.
                    </span>
                  </div>
                </div>)
              }
            ]} />
          </Form>
        </Drawer>
      )}

      {/* ── Edit Drawer ──────────────────────────────────────────────── */}
      {(!isIframeModal || action === 'edit') && (
        <Drawer
          {...drawerProps}
          size={isIframeModal ? '100%' : 1000}
          mask={!isIframeModal}
          title={
            <span style={drawerTitleStyle}>
              {selectedRecord
                ? `Chỉnh sửa thông tin — ${selectedRecord.portName}`
                : 'Chỉnh sửa thông tin cảng biển'}
            </span>
          }
          open={updateModalVisible}
          onClose={closeUpdateModal}
          extra={<Button type="text" onClick={closeUpdateModal} style={drawerCloseBtnStyle}>✕</Button>}
          footer={
            <div style={drawerFooterStyle}>
              <Button type="primary" htmlType="submit" loading={submitting} onClick={() => updateForm.submit()} style={primaryButtonStyle}>Cập nhật</Button>
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          <style>{requiredMarkStyle}</style>
          <Form
            form={updateForm}
            layout="vertical"
            onFinish={handleUpdateFinish}
            onFinishFailed={handleFormFailed}
          >
            <Tabs
              defaultActiveKey="general"
              tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
              items={[
                {
                  key: 'general',
                  label: 'Thông tin chung',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="orgUnitId"
                            {...labelProps('Đơn vị quản lý')}
                            required
                            rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <OrgUnitTreeSelect
                              organizations={orgUnits}
                              placeholder="Chọn đơn vị quản lý..."
                              allowClear
                              showPath
                              treeDefaultExpandAll={false}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="portGroup"
                            {...labelProps('Nhóm cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select placeholder="Chọn nhóm cảng" allowClear style={selectStyle}
                              options={[
                                { value: 1, label: 'Nhóm 1' },
                                { value: 2, label: 'Nhóm 2' },
                                { value: 3, label: 'Nhóm 3' },
                                { value: 4, label: 'Nhóm 4' },
                                { value: 5, label: 'Nhóm 5' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="portCode"
                            {...labelProps('Mã cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                            tooltip="Mã cảng được sinh tự động, không thể chỉnh sửa"
                          >
                            <Input
                              disabled
                              placeholder="Mã tự động"
                              maxLength={50}
                              style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="portName"
                            {...labelProps('Tên cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                            rules={[
                              { required: true, message: 'Tên cảng không được để trống' },
                              { max: 255, message: 'Tên cảng tối đa 255 ký tự' },
                            ]}
                            validateStatus={atMaxUpdate.portName ? 'error' : undefined} help={atMaxUpdate.portName ? 'Đã đạt tối đa 255 ký tự' : undefined}
                          >
                            <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="province"
                            {...labelProps('Địa điểm (Tỉnh/Thành phố)')}
                            required
                            rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              showSearch
                              placeholder="Chọn tỉnh/thành phố..."
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="detailedLocation"
                            {...labelProps('Địa điểm chi tiết')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.detailedLocation ? 'error' : undefined} help={atMaxUpdate.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}
                          >
                            <Input placeholder="VD: Xã Đình Vũ, Quận Hải An" maxLength={500} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="portClass"
                            {...labelProps('Phân cấp cảng biển')}
                            required
                            rules={[{ required: true, message: 'Phân cấp cảng biển là bắt buộc' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select placeholder="Chọn phân cấp" allowClear style={selectStyle}
                              options={[
                                { value: 5, label: 'Cấp đặc biệt' },
                                { value: 1, label: 'Cấp 1' },
                                { value: 2, label: 'Cấp 2' },
                                { value: 3, label: 'Cấp 3' },
                                { value: 4, label: 'Cấp 4' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="waterAreaScope"
                            {...labelProps('Phạm vi vùng nước cảng biển')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.waterAreaScope ? 'error' : undefined} help={atMaxUpdate.waterAreaScope ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                          >
                            <Input placeholder="Mô tả phạm vi vùng nước cảng biển" maxLength={2000} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalBerths"
                            {...labelProps('Tổng số bến cảng')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.totalBerths ? 'error' : undefined} help={atMaxUpdate.totalBerths ? 'Đã đạt tối đa 5 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalAnchoragesTransshipment"
                            {...labelProps('Tổng số khu neo đậu, khu chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.totalAnchoragesTransshipment ? 'error' : undefined} help={atMaxUpdate.totalAnchoragesTransshipment ? 'Đã đạt tối đa 5 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalPublicChannels"
                            {...labelProps('Tổng số tuyến luồng hàng hải công cộng')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.totalPublicChannels ? 'error' : undefined} help={atMaxUpdate.totalPublicChannels ? 'Đã đạt tối đa 5 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalDedicatedChannels"
                            {...labelProps('Tổng số tuyến luồng hàng hải chuyên dùng')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.totalDedicatedChannels ? 'error' : undefined} help={atMaxUpdate.totalDedicatedChannels ? 'Đã đạt tối đa 5 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalPublicChannelLength"
                            {...labelProps('Tổng chiều dài luồng hàng hải công cộng (km)')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.totalPublicChannelLength ? 'error' : undefined} help={atMaxUpdate.totalPublicChannelLength ? 'Đã đạt tối đa 20 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalDedicatedChannelLength"
                            {...labelProps('Tổng chiều dài luồng hàng hải chuyên dùng (km)')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.totalDedicatedChannelLength ? 'error' : undefined} help={atMaxUpdate.totalDedicatedChannelLength ? 'Đã đạt tối đa 20 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalBuoysBeacons"
                            {...labelProps('Tổng số phao tiêu, báo hiệu hàng hải trên luồng')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.totalBuoysBeacons ? 'error' : undefined} help={atMaxUpdate.totalBuoysBeacons ? 'Đã đạt tối đa 5 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalDikes"
                            {...labelProps('Tổng số đê, kè')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.totalDikes ? 'error' : undefined} help={atMaxUpdate.totalDikes ? 'Đã đạt tối đa 5 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="totalDikeLength"
                            {...labelProps('Tổng chiều dài hệ thống đê, kè (km)')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.totalDikeLength ? 'error' : undefined} help={atMaxUpdate.totalDikeLength ? 'Đã đạt tối đa 20 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="totalLighthouses"
                            {...labelProps('Tổng số đèn biển, đăng, tiêu độc lập')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.totalLighthouses ? 'error' : undefined} help={atMaxUpdate.totalLighthouses ? 'Đã đạt tối đa 5 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="buoyBerthCount"
                            {...labelProps('Số lượng bến phao')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.buoyBerthCount ? 'error' : undefined} help={atMaxUpdate.buoyBerthCount ? 'Đã đạt tối đa 5 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="anchorageCount"
                            {...labelProps('Số lượng khu neo đậu')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.anchorageCount ? 'error' : undefined} help={atMaxUpdate.anchorageCount ? 'Đã đạt tối đa 5 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="transshipmentCount"
                            {...labelProps('Số lượng khu chuyển tải')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.transshipmentCount ? 'error' : undefined} help={atMaxUpdate.transshipmentCount ? 'Đã đạt tối đa 5 ký tự' : undefined}
                          >
                            <InputNumber min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="otherWaterAreas"
                            {...labelProps('Các khu nước, vùng nước khác')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.otherWaterAreas ? 'error' : undefined} help={atMaxUpdate.otherWaterAreas ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                          >
                            <Input placeholder="Mô tả" maxLength={2000} style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            name="remarks"
                            {...labelProps('Ghi chú')}
                            style={{ marginBottom: spaceFormField }}
                            validateStatus={atMaxUpdate.remarks ? 'error' : undefined} help={atMaxUpdate.remarks ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                          >
                            <Input.TextArea rows={3} placeholder="Ghi chú" maxLength={2000}
                              styles={{ textarea: { borderRadius: radiusPill, resize: 'none', padding: '12px 16px' } }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: 'gis',
                  label: 'Thông tin vị trí',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                            <Select placeholder="Chọn loại đối tượng" allowClear style={selectStyle} options={[
                              { value: 'POINT', label: 'Đối tượng điểm' },
                              { value: 'LINE', label: 'Đối tượng đường' },
                              { value: 'POLYGON', label: 'Đối tượng vùng' },
                            ]} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
                            <Select
                              placeholder="Chọn biểu tượng bản đồ"
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              disabled={!updateGeometryType}
                              style={selectStyle}
                            >
                              {symbols.map((sym) => (
                                <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                                  <Space>
                                    {sym.image && (
                                      <img
                                        src={
                                          sym.image.startsWith('data:')
                                            ? sym.image
                                            : `data:image/png;base64,${sym.image}`
                                        }
                                        alt={sym.name}
                                        style={{ width: 20, height: 20, objectFit: 'contain' }}
                                      />
                                    )}
                                    <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                                  </Space>
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }} rules={updateGeometryType ? [{ required: true, message: 'Hệ quy chiếu là bắt buộc khi chọn loại đối tượng' }] : []}>
                            <Select placeholder="Chọn hệ quy chiếu" style={selectStyle} disabled options={[
                              { value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' },
                            ]} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }} rules={updateGeometryType ? [{ required: true, message: 'Quy tắc hiển thị là bắt buộc khi chọn loại đối tượng' }] : []}>
                            <Input placeholder="Chọn quy tắc hiển thị" disabled style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      {/* GPS Coordinates (DMS) */}
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS{updateGeometryType && <span style={{ color: colors.error, marginLeft: 4, fontSize: fontSizeMd }}>*</span>}</span>
                        </span>
                        {gpsCoordList.length > 0 && (
                          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!updateGeometryType} style={{ borderRadius: radiusPill }}>
                            Thêm tọa độ
                          </Button>
                        )}
                      </div>
                      {gpsCoordList.length === 0 ? (
                        <div style={{
                          padding: '32px 16px',
                          textAlign: 'center',
                          border: `1px dashed ${borderDefault}`,
                          borderRadius: radiusMd,
                          background: surfaceCard,
                        }}>
                          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                            Chưa có tọa độ nào.
                          </span>
                          <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!updateGeometryType} style={{ borderRadius: radiusPill }}>
                            Thêm tọa độ
                          </Button>
                        </div>
                      ) : (
                        <PagedTable
                          dataSource={gpsCoordList.map((c, i) => ({ ...c, _idx: i }))}
                          tableProps={{ scroll: { x: 820 } }}
                          errorText={gpsError ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>⚠</span><span>{gpsError}</span></span> : undefined}
                        >
                          <Table.Column
                            title="Vĩ độ (N)"
                            key="lat"
                            render={(_: any, record: any) => {
                              const dms = ddToDms(record.lat);
                              return (
                                <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                  <InputNumber value={dms.d} min={0} max={90} placeholder="Độ"
                                    onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', Number(v ?? 0), dms.m, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>°</span>
                                  <InputNumber value={dms.m} min={0} max={59} placeholder="Phút"
                                    onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, Number(v ?? 0), dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>'</span>
                                  <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber}
                                    onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, dms.m, Number(v ?? 0))}
                                    style={{ flex: 1.2 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>"</span>
                                </Space.Compact>
                              );
                            }}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Kinh độ (E)"
                            key="lng"
                            render={(_: any, record: any) => {
                              const dms = ddToDms(record.lng);
                              return (
                                <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                  <InputNumber value={dms.d} min={0} max={180} placeholder="Độ"
                                    onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', Number(v ?? 0), dms.m, dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>°</span>
                                  <InputNumber value={dms.m} min={0} max={59} placeholder="Phút"
                                    onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, Number(v ?? 0), dms.s)}
                                    style={{ flex: 1 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>'</span>
                                  <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber}
                                    onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, dms.m, Number(v ?? 0))}
                                    style={{ flex: 1.2 }} controls={false} />
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                    background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0,
                                    fontSize: fontSizeSm, color: textTertiary,
                                  }}>"</span>
                                </Space.Compact>
                              );
                            }}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title=""
                            key="actions"
                            width={44}
                            align="center"
                            render={(_: any, record: any) => (
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}
                                onClick={() => removeGpsPoint(record._idx)} />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, padding: '12px 6px' },
                            })}
                          />
                        </PagedTable>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'infrastructure',
                  label: 'Công trình KCHT trực thuộc',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      {/* Infra label + add button */}
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Công trình KCHT trực thuộc</span>
                        {infraList.length > 0 && (
                          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addInfra} style={{ borderRadius: radiusPill }}>
                            Thêm công trình
                          </Button>
                        )}
                      </div>
                      {infraList.length === 0 ? (
                        <div style={{
                          padding: '32px 16px', textAlign: 'center',
                          border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard,
                        }}>
                          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                            Chưa có công trình nào.
                          </span>
                          <Button type="dashed" icon={<PlusOutlined />} onClick={addInfra} style={{ borderRadius: radiusPill }}>
                            Thêm công trình
                          </Button>
                        </div>
                      ) : (
                        <PagedTable
                          dataSource={infraList.map((inf, i) => ({ ...inf, _idx: i }))}
                          tableProps={{ scroll: { x: 600 } }}
                        >
                          <Table.Column
                            title="Tên Công Trình"
                            key="name"
                            align="center"
                            render={(_: any, record: any) => (
                              <Input
                                value={record.infraName}
                                onChange={(e) => updateInfraName(record._idx, e.target.value)}
                                placeholder="Nhập tên công trình"
                                maxLength={500}
                                showCount
                                style={{ borderRadius: radiusPill, height: 40 }}
                              />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title="Số Lượng"
                            key="quantity"
                            width={100}
                            align="center"
                            render={(_: any, record: any) => {
                              const val = record.quantity;
                              return (
                                <div style={{ position: 'relative' }}>
                                  <InputNumber
                                    value={val}
                                    onChange={(v) => updateInfraQty(record._idx, v)}
                                    placeholder="1-5"
                                    min={0}
                                    max={5}
                                    style={{ width: '100%', borderRadius: radiusPill, paddingRight: 32 }}
                                  />
                                  <span style={{
                                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                    fontSize: fontSizeSm, color: textTertiary, pointerEvents: 'none',
                                  }}>{val ?? 0}/5</span>
                                </div>
                              );
                            }}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title=""
                            key="actions"
                            width={44}
                            align="center"
                            render={(_: any, record: any) => (
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}
                                onClick={() => removeInfra(record._idx)} />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, padding: '12px 6px' },
                            })}
                          />
                        </PagedTable>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'attachments',
                  label: 'File đính kèm',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      {/* File label + add button */}
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
                        {uploadFileList.length > 0 && (
                          <Upload
                            beforeUpload={(file) => {
                              if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                              const ext = file.name.split('.').pop()?.toLowerCase();
                              if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                              if (uploadFileList.length >= 10) { message.error('Tối đa 10 file'); return false; }
                              setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                              return false;
                            }}
                            showUploadList={false}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                            multiple
                          >
                            <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>
                              Thêm file
                            </Button>
                          </Upload>
                        )}
                      </div>
                      {uploadFileList.length === 0 ? (
                        <div style={{
                          padding: '32px 16px', textAlign: 'center',
                          border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard,
                        }}>
                          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                            Chưa có file đính kèm.
                          </span>
                          <Upload
                            beforeUpload={(file) => {
                              if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
                              const ext = file.name.split('.').pop()?.toLowerCase();
                              if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
                              setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
                              return false;
                            }}
                            showUploadList={false}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                            multiple
                          >
                            <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>
                              Chọn file
                            </Button>
                          </Upload>
                        </div>
                      ) : (
                        <PagedTable
                          dataSource={uploadFileList.map((f, i) => ({ ...f, _idx: i }))}
                          tableProps={{ scroll: { x: 400 } }}
                        >
                          <Table.Column
                            title="Tên file"
                            key="name"
                            dataIndex="name"
                            render={(name: string) => (
                              <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
                                <FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />
                                {name}
                              </span>
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                            })}
                          />
                          <Table.Column
                            title=""
                            key="actions"
                            width={44}
                            align="center"
                            render={(_: any, record: any) => (
                              <Button type="link" danger size="small" icon={<DeleteOutlined />}
                                onClick={() => setUploadFileList(uploadFileList.filter(x => x.uid !== record.uid))} />
                            )}
                            onHeaderCell={() => ({
                              style: { background: colors.bodyBg, padding: '12px 6px' },
                            })}
                          />
                        </PagedTable>
                      )}
                      <div style={{ marginTop: spaceSm }}>
                        <span style={uploadHintStyle}>
                          Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.
                        </span>
                      </div>
                    </div>
                  ),
                },
              ]}
            />

          </Form>
        </Drawer>
      )}

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      {(!isIframeModal || action === 'detail') && (
        <Drawer
          {...drawerProps}
          size={isIframeModal ? '100%' : 1000}
          mask={!isIframeModal}
          title={
            selectedRecord
              ? <span style={drawerTitleStyle}>Chi tiết cảng biển - {selectedRecord.portName}</span>
              : <span style={drawerTitleStyle}>Chi tiết cảng biển</span>
          }
          open={detailModalVisible}
          onClose={closeDetailModal}
          extra={<Button type="text" onClick={closeDetailModal} style={drawerCloseBtnStyle}>✕</Button>}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          {selectedRecord && (
            <Tabs
              defaultActiveKey="general"
              className="port-detail-tabs"
              tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
              items={[
                {
                  key: 'general', label: 'Thông tin chung',
                  children: (
                    <div style={{ paddingTop: 3 }}>
                      <style>{`.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; } .detail-row { display: flex; padding: 10px 12px; border-bottom: 1px solid ${borderDefault}; } .detail-label { width: 200px; flex-shrink: 0; color: ${colors.sidebarBg}; font-weight: ${fontWeightBold}; font-size: ${fontSizeMd}px; } .detail-label::after { content: ':'; margin-left: 2px; } .detail-value { color: ${textPrimary}; font-size: ${fontSizeMd}px; flex: 1; } .ant-tabs-nav{margin-bottom:0!important;padding-left:12px!important}`}</style>
                      <div className="detail-grid">
                        {[
                          { label: 'Đơn vị quản lý', value: (() => {
                            const orgPathNames = resolveOrgFullPath(orgUnits, selectedRecord.orgUnitId);
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
                          })(), bold: true },
                          { label: 'Nhóm cảng biển', value: selectedRecord.portGroup ? 'Nhóm ' + selectedRecord.portGroup : '—', bold: true },
                          { label: 'Mã cảng biển', value: selectedRecord.portCode, badge: true },
                          { label: 'Tên cảng biển', value: selectedRecord.portName, bold: true },
                          { label: 'Phân cấp cảng biển', value: selectedRecord.portClass != null ? (selectedRecord.portClass === 5 ? 'Cấp đặc biệt' : `Cấp ${selectedRecord.portClass}`) : '—' },
                          { label: 'Trạng thái', value: selectedRecord.approvalStatus ? (() => { const b = trangThaiPheDuyetBadge(selectedRecord.approvalStatus); let c = textTertiary; if (b.color === 'green') c = statusOperational; else if (b.color === 'red') c = statusCritical; else if (b.color === 'orange') c = statusAttention; else if (b.color === 'blue') c = actionPrimary; return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${c}15`, color: c }}>{b.label}</span>; })() : '—' },
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
                          <div key={i} className="detail-row" style={row.fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                            <span className="detail-label">{row.label}</span>
                            <span className="detail-value" style={row.bold ? { fontWeight: fontWeightBold } : undefined}>
                              {row.badge ? (
                                <Tag color={colors.primary} style={{ borderRadius: radiusPill, margin: 0, fontWeight: fontWeightMedium }}>{row.value}</Tag>
                              ) : row.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div style={{ cursor: 'pointer', marginTop: 10, paddingLeft: 12 }} onClick={() => setPortSystemOpen(!portSystemOpen)}>
                        <span style={{ color: portSystemOpen ? '#1677ff' : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{portSystemOpen ? '▼' : '▶'} Thông tin hệ thống</span>
                      </div>
                      {portSystemOpen && (
                        <div className="detail-grid" style={{ marginTop: 4 }}>
                          {[
                            ['Người tạo', selectedRecord.createdByName || selectedRecord.createdBy || '—', true],
                            ['Ngày tạo', selectedRecord.createdAt ? dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
                            ['Người cập nhật', selectedRecord.updatedByName || selectedRecord.updatedBy || '—', true],
                            ['Ngày cập nhật', selectedRecord.updatedAt ? dayjs(selectedRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'],
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
                  key: 'gis', label: 'Thông tin vị trí',
                  children: (
                    <div style={{ paddingTop: 3 }}>
                      <div className="detail-grid">
                        {[
                          ['Loại đối tượng', selectedRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : selectedRecord.geometryType === 'LINE' ? 'Đối tượng đường' : selectedRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '—'],
                          ['Biểu tượng', (() => { const sym = symbols.find((s) => s.id === selectedRecord.mapSymbolId); return sym ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{sym.image ? <img src={sym.image} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{sym.name}</span> : selectedRecord.mapSymbolId || '—'; })(),],
                          ['Hệ quy chiếu', selectedRecord.coordinateSystem === 1 ? 'WGS-84' : selectedRecord.coordinateSystem === 2 ? 'VN-2000' : '—'],
                          ['Quy tắc hiển thị', (selectedRecord.geometryType || (selectedRecord as any).coordinates) ? 'Độ, phút, giây (DMS)' : '—'],
                        ].map(([label, value], i) => (
                          <div key={i} className="detail-row">
                            <span className="detail-label">{label}</span>
                            <span className="detail-value">{value}</span>
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
                            const mm = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)\)/);
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
                            <PagedTable dataSource={pts.map((p, i) => ({ ...p }))}
                              emptyText={<div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><EnvironmentOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có tọa độ</span></div>}
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
                  key: 'infra', label: 'Công trình KCHT trực thuộc',
                  children: (
                    <div style={{ paddingTop: 3 }}>
                      <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Công trình KCHT trực thuộc</span>
                      </div>
                      <PagedTable dataSource={((selectedRecord as any).infrastructureList || []).map((i: any, idx: number) => ({ ...i }))}
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
                  key: 'files', label: 'File đính kèm',
                  children: (
                    <div style={{ paddingTop: 3 }}>
                      <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
                      </div>
                      <PagedTable dataSource={detailFiles.map((f, i) => ({ ...f }))}
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
                  key: 'operation', label: 'Thông tin vận hành khai thác',
                  children: <PortRefTable title="Thông tin vận hành khai thác" emptyText="Chưa có dữ liệu" dataSource={(selectedRecord as any)?.operationPlanList} columns={[
                    { title: 'Mã kế hoạch', dataIndex: 'opPlanCode', width: 180 },
                    { title: 'Tên kế hoạch', dataIndex: 'opPlanName', width: 220 },
                    { title: 'Ngày bắt đầu', dataIndex: 'opStartDate', width: 200 },
                    { title: 'Ngày kết thúc', dataIndex: 'opEndDate', width: 200 },
                  ]} />,
                },
                {
                  key: 'maintenance', label: 'Thông tin bảo trì',
                  children: <PortRefTable title="Thông tin bảo trì" emptyText="Chưa có dữ liệu" dataSource={(selectedRecord as any)?.maintenancePlanList} columns={[
                    { title: 'Mã kế hoạch', dataIndex: 'maintCode', width: 180 },
                    { title: 'Tên kế hoạch', dataIndex: 'maintName', width: 220 },
                    { title: 'Thời gian bắt đầu', dataIndex: 'maintStart', width: 200 },
                    { title: 'Thời gian kết thúc', dataIndex: 'maintEnd', width: 200 },
                  ]} />,
                },
                {
                  key: 'incident', label: 'Thông tin sự cố',
                  children: <PortRefTable title="Thông tin sự cố" emptyText="Chưa có dữ liệu" dataSource={(selectedRecord as any)?.incidentList} columns={[
                    { title: 'Mã sự cố', dataIndex: 'incidentCode', width: 150 },
                    { title: 'Loại sự cố', dataIndex: 'incidentType', width: 150 },
                    { title: 'Địa điểm', dataIndex: 'incidentLocation', width: 200 },
                    { title: 'Thời gian', dataIndex: 'incidentTime', width: 180 },
                  ]} />,
                },
              ]}
            />
          )}

        </Drawer>
      )}


      {/* ── Chi tiết KCHT khác (Drawer lồng — không chuyển trang) ── */}
      <Drawer
        {...drawerProps}
        size={isIframeModal ? '100%' : 950}
        mask={!isIframeModal}
        title={
          <span style={drawerTitleStyle}>
            {kchtDetailRecord
              ? `Chi tiết ${kchtDetailType === 'berth' ? 'bến cảng' : 'vùng nước'} - ${kchtDetailRecord.berthName || kchtDetailRecord.waterZoneName || ''}`
              : 'Chi tiết kết cấu hạ tầng'}
          </span>
        }
        open={kchtDetailOpen}
        onClose={() => setKchtDetailOpen(false)}
        extra={<Button type="text" onClick={() => setKchtDetailOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {kchtDetailLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>Đang tải chi tiết...</div>
        ) : kchtDetailRecord && kchtDetailType === 'berth' ? (
          <BerthDetailContent
            selectedRecord={kchtDetailRecord}
            orgMap={new Map((orgUnits || []).map((o: any) => [o.id, o.name]))}
            symbolMap={new Map((symbols || []).map((s: any) => [s.id, s.name]))}
            symbolImageMap={new Map((symbols || []).filter((s: any) => s.image).map((s: any) => [s.id, s.image]))}
            portOptions={selectedRecord ? [{ value: selectedRecord.id, label: selectedRecord.portName || selectedRecord.portCode }] : []}
            userMap={userMap}
            detailFiles={kchtDetailFiles}
            ddToDms={ddToDms}
            approvalStyleMap={APPROVAL_STYLE_MAP}
            structureTypeOptions={STRUCTURE_TYPE_OPTIONS}
            waterwayMap={waterwayMap}
            onViewPierDetail={openPierDetail}
          />
        ) : kchtDetailRecord && kchtDetailType === 'waterzone' ? (
          <WaterZoneDetailMini record={kchtDetailRecord} symbols={symbols as any[]} files={kchtDetailFiles} userMap={userMap} />
        ) : null}
      </Drawer>

      {/* ── Pier Detail Drawer (sibling — tránh drawer lồng bị đẩy kích thước) ── */}
      <Drawer
        {...drawerProps}
        size={900}
        title={<span style={drawerTitleStyle}>Chi tiết cầu cảng{pierDetailRecord ? ` - ${pierDetailRecord.pierName || pierDetailRecord.pierCode || ''}` : ''}</span>}
        open={pierDetailOpen}
        onClose={() => setPierDetailOpen(false)}
        extra={<Button type="text" onClick={() => setPierDetailOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {pierDetailLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>Đang tải chi tiết...</div>
        ) : pierDetailRecord ? (
          <PierDetailContent
            selectedRecord={pierDetailRecord}
            orgMap={new Map((orgUnits || []).map((o: any) => [o.id, o.name]))}
            organizations={orgUnits as any}
            portMap={new Map([[selectedRecord?.id ?? '', selectedRecord?.portName || '']])}
            berthOptions={kchtDetailRecord ? [{ value: kchtDetailRecord.id, label: kchtDetailRecord.berthName || kchtDetailRecord.berthCode || '' }] : []}
            symbolMap={new Map((symbols || []).map((s: any) => [s.id, s.name]))}
            symbolImageMap={new Map((symbols || []).filter((s: any) => s.image).map((s: any) => [s.id, s.image]))}
            detailFiles={pierDetailFiles}
            ddToDms={ddToDms}
            approvalStyleMap={APPROVAL_STYLE_MAP}
            operationalStyleMap={{
              OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
              NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
              SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
            }}
            userMap={userMap}
            waterwayMap={waterwayMap}
          />
        ) : null}
      </Drawer>

      {/* ── History Modal ──────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        size={isIframeModal ? '100%' : 880}
        mask={!isIframeModal}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Cảng biển' : (selectedRecord ? `Lịch sử thay đổi — ${selectedRecord.portName}` : 'Lịch sử thay đổi')}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>Tổng cộng {historyFieldCount}</span>
            </Space>
          </div>
        }
        open={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        extra={<Button type="text" onClick={() => setHistoryModalVisible(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}>
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
          {!loadingHistory && (
            <div style={{ display: 'none' }}>
              <Radio.Group value={historyMode} size="middle" style={{ display: 'flex', width: '100%', borderBottom: `1px solid ${borderDefault}` }}
                onChange={async e => { const mode = e.target.value; setHistoryMode(mode); setLoadingHistory(true); setHistoryRecords([]); if (mode === 'all') { const { fetchPortAllHistory } = await import('./api'); fetchPortAllHistory({ page: 0, size: 500 }).then((d: any) => { setHistoryRecords(d.changeHistory || []); setHistoryEntityNames(d.entityNames || {}); }).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setLoadingHistory(false)); } else { const { fetchportHistory } = await import('./api'); fetchportHistory(historyEntityId, { page: 0, size: 200 }).then((d: any) => { setHistoryRecords(d.changeHistory || []); }).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setLoadingHistory(false)); } }}>
                <Radio.Button value="current" style={{ ...historyTabStyle, borderBottom: `2px solid ${historyMode === 'current' ? actionPrimary : 'transparent'}`, fontWeight: fontWeightBold, color: historyMode !== 'current' ? textSecondary : actionPrimary }}>Bản ghi hiện tại {historyMode === 'current' ? <Tag color="blue" style={{ borderRadius: radiusPill, fontSize: 11, marginLeft: 4 }}>{historyRecords.filter((r: any, i: number, arr: any[]) => { const s = Math.floor(new Date(r.changedAt || r.createdAt || 0).getTime() / 1000); const a = r.changedBy || ''; return arr.findIndex((x: any) => Math.floor(new Date(x.changedAt || x.createdAt || 0).getTime() / 1000) === s && (x.changedBy || '') === a) === i; }).length}</Tag> : <span style={{ marginLeft: 4 }}>...</span>}</Radio.Button>
                {/* ALL_TAB_HIDDEN <Radio.Button value="all" style={{ ...historyTabStyle, borderBottom: `2px solid ${historyMode === 'all' ? actionPrimary : 'transparent'}`, fontWeight: fontWeightBold, color: historyMode !== 'all' ? textSecondary : actionPrimary }}>Tất cả bản ghi {historyMode === 'all' ? <Tag color="blue" style={{ borderRadius: radiusPill, fontSize: 11, marginLeft: 4 }}>{historyRecords.filter((r: any, i: number, arr: any[]) => { const s = Math.floor(new Date(r.changedAt || r.createdAt || 0).getTime()/1000); const a = r.changedBy || ''; return arr.findIndex((x: any) => Math.floor(new Date(x.changedAt || x.createdAt || 0).getTime()/1000) === s && (x.changedBy || '') === a) === i; }).length}</Tag> : <span style={{ marginLeft: 4 }}>...</span>}</Radio.Button>
            */}
              </Radio.Group>
            </div>
          )}
          {!loadingHistory && (
            <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
              <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
                onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
              {historyMode === 'all' && <Select placeholder="Chọn cảng biển" allowClear showSearch value={historyEntityFilter || undefined}
                onChange={v => setHistoryEntityFilter(v || '')}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                style={{ width: 200, borderRadius: radiusPill, height: 40 }}
                options={Object.entries(historyEntityNames).map(([id, name]) => ({ value: id, label: name }))} />}
              <DatePicker placeholder="Từ ngày" classNames={{ popup: { root: 'history-dt-popup' } }} value={historyDateFrom ? dayjs(historyDateFrom) : null}
                onChange={d => setHistoryDateFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
                style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
              <DatePicker placeholder="Đến ngày" classNames={{ popup: { root: 'history-dt-popup' } }} value={historyDateTo ? dayjs(historyDateTo) : null}
                onChange={d => setHistoryDateTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
                style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
              <Button type="primary" icon={<SearchOutlined />} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Tìm kiếm</Button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loadingHistory ? <LoadingSkeleton rows={5} /> : historyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div></div>
          ) : renderPortHistoryTimeline(historyRecords) /* STALE_RENDER const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000); const sorted = [...historyRecords].sort((a: any, b: any) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime()); const q = historySearch.toLowerCase().trim(); const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = []; for (const r of sorted) { if (q) { const fn = (r.fieldName || '').toLowerCase(); const ov = (r.oldValue || '').toLowerCase(); const nv = (r.newValue || '').toLowerCase(); const lb = historyFieldName(r.fieldName || '').toLowerCase(); const od = historyFieldValue(r.fieldName, r.oldValue, orgMap, symbolMap).toLowerCase(); const nd = historyFieldValue(r.fieldName, r.newValue, orgMap, symbolMap).toLowerCase(); if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) continue; } if (historyEntityFilter && r.entityId !== historyEntityFilter) continue; if (historyDateFrom || historyDateTo) { const cd = (r.changedAt || r.createdAt || '').substring(0, 16); if (historyDateFrom && cd < historyDateFrom.replace(' ', 'T')) continue; if (historyDateTo && cd > historyDateTo.replace(' ', 'T') + ':59') continue; } const ts = r.changedAt || r.createdAt || ''; const sec = ts ? toSec(ts) : 0; const prev = groups[groups.length - 1]; if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || '')) prev.items.push(r); else groups.push({ tsSec: sec, ts, actor: r.changedBy || '', items: [r] }); } if (groups.length === 0) return (<div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div></div>); const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}  ·  ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; }; if (historySearchRef.current === 'initial') { historySearchRef.current = ''; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = true; }); setTimeout(() => setHistoryExpanded(init), 0); } else if (q.length > 0 && historySearchRef.current !== q) { historySearchRef.current = q; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = true; }); setTimeout(() => setHistoryExpanded(init), 0); } else if (q.length === 0 && historySearchRef.current !== '') { historySearchRef.current = ''; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = false; }); setTimeout(() => setHistoryExpanded(init), 0); } return (<div>{groups.map((g, gi) => (<div key={gi} style={{ display: 'flex', gap: spaceSm, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: surfaceCard, border: `1px solid ${actionPrimary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClockCircleFilled style={{ color: actionPrimary, fontSize: 14 }} /></div>{gi < groups.length - 1 && (<div style={{ width: 1, flex: 1, minHeight: 24, background: borderDefault, marginTop: spaceXs }} />)}</div><div style={{ ...cardStyle, flex: 1, padding: `${spaceSm}px ${spaceFormField}px`, marginBottom: 0, borderRadius: radiusLg, boxShadow: shadowSm }}><div onClick={() => setHistoryExpanded(prev => ({ ...prev, [gi]: !prev[gi] }))} style={{ display: 'flex', alignItems: 'center', gap: spaceSm, cursor: 'pointer' }}><Typography.Text style={{ fontSize: fontSizeLg, color: textPrimary, fontWeight: fontWeightBold }}>{g.ts ? fmtTime(g.ts) : '—'}</Typography.Text>{g.actor && (<Typography.Text style={{ fontSize: fontSizeMd, color: textSecondary }}>— {g.actor}</Typography.Text>)}{(() => { const a = getActionLabel(g.items); return <Tag color={a.color} style={{ fontSize: 11, marginLeft: spaceSm, borderRadius: radiusPill }}>{a.label}</Tag>; })()}<span style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: actionPrimary, background: `${actionPrimary}12`, borderRadius: radiusPill, padding: '2px 10px', marginLeft: 'auto' }}>{g.items.length}</span>{historyExpanded[gi] === false ? (<DownOutlined style={{ fontSize: 12, color: textTertiary }} />) : (<UpOutlined style={{ fontSize: 12, color: textTertiary }} />)}</div>{historyExpanded[gi] !== false && (<><Divider style={{ margin: `${spaceSm}px 0`, borderColor: borderDefault }} /><table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{g.items.map((r: any, ri: number) => { const fn = r.fieldName || ''; const ov = r.oldValue !== undefined && r.oldValue != null ? historyFieldValue(fn, r.oldValue, orgMap, symbolMap) : null; const nv = r.newValue !== undefined && r.newValue != null ? historyFieldValue(fn, r.newValue, orgMap, symbolMap) : null; return (<tr key={r.id || ri}><td style={{ padding: `${spaceXs}px ${spaceSm}px ${spaceXs}px 0`, fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary, whiteSpace: 'nowrap', verticalAlign: 'middle', width: 1 }}>{historyMode === 'all' ? (<><Tag color="blue" style={{ marginRight: spaceXs, fontSize: fontSizeSm, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setHistoryEntityId(r.entityId); setHistoryMode('current'); setLoadingHistory(true); setHistoryRecords([]); import('./api').then(m => m.fetchportHistory(r.entityId, { page: 0, size: 200 })).then((d: any) => setHistoryRecords(d.changeHistory || [])).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setLoadingHistory(false)); }} onClick={async (e) => { e.stopPropagation(); setHistoryEntityId(r.entityId); setHistoryEntityName(historyEntityNames[r.entityId] || ''); setHistoryMode('current'); setLoadingHistory(true); setHistoryRecords([]); historySearchRef.current = 'initial'; const { fetchportHistory } = await import('./api'); fetchportHistory(r.entityId, { page: 0, size: 200 }).then((d: any) => setHistoryRecords(d.changeHistory || [])).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setLoadingHistory(false)); }}>{historyEntityNames[r.entityId] || r.entityId?.substring(0,8)}</Tag> </>) : null}{fn ? historyFieldName(fn) : '—'}</td><td style={{ padding: `${spaceXs}px 0`, verticalAlign: 'middle' }}><Space size={spaceXs}>{ov ? (<Typography.Text delete style={{ fontSize: fontSizeMd, color: statusCritical }}>{ov}</Typography.Text>) : (<span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>)}<ArrowRightOutlined style={{ fontSize: 10, cursor: 'pointer', color: textTertiary }} />{nv ? (<Typography.Text strong style={{ fontSize: fontSizeMd, color: statusOperational }}>{nv}</Typography.Text>) : (<span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>)}</Space></td></tr>); })}</tbody></table></>)}</div></div>))}</div>); })()}
        */}
        </div>
      </Drawer>

      {selectedRecord && (
        <DocumentUploadModal
          entityType="port"
          entityId={selectedRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}

      {/* Approve Modal */}
      <Modal styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận phê duyệt</span>}
        open={approveModalOpen} onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="approve" type="primary" onClick={handleConfirmApprove}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: statusOperational, borderColor: statusOperational }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Phê duyệt <strong>{approvingRecord?.portCode} — {approvingRecord?.portName}</strong>?
          </p>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalVisible} onCancel={() => { setRejectModalVisible(false); setRejectTarget(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalVisible(false); setRejectTarget(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho cảng biển:</p>
          {rejectTarget && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}><strong style={{ color: textPrimary }}>{rejectTarget.portCode} — {rejectTarget.portName}</strong></p>}
          <Input.TextArea placeholder="Nhập lý do từ chối..." value={rejectReason}
            onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
            rows={3} style={{ borderRadius: 8, fontSize: fontSizeMd, borderColor: rejectError ? statusCritical : undefined }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {rejectError ? <span style={{ color: statusCritical, fontSize: fontSizeMd }}>{rejectError}</span> : <span />}
            <span style={{ color: rejectReason.trim().length < 10 ? statusCritical : textTertiary, fontSize: fontSizeMd }}>
              {rejectReason.length}/10
            </span>
          </div>
        </div>
      </Modal>

      {/* Submit Modal */}
      <Modal styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận gửi phê duyệt</span>}
        open={submitModalOpen} onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={handleConfirmSubmit}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.portCode} — {submittingRecord?.portName}</strong> để phê duyệt?
          </p>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa cảng biển</span>}
        open={!!deleteTarget}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteConfirmText('');
        }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={handleDeleteConfirm}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <Alert message="Hành động này không thể hoàn tác" type="warning" showIcon icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }} />
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên cảng</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deleteTarget && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Cảng: <strong style={{ color: textPrimary }}>{deleteTarget.portName}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên cảng hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={handleDeleteConfirm}
            style={{ borderRadius: radiusPill, height: 40 }} autoFocus />
        </div>
      </Modal>
    </>
  );
}
