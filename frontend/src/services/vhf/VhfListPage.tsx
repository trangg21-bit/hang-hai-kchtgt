import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fmtNum } from "../../utils/numFmt";
import {
  parseWktToCoordinates,
  ddToDms,
} from "../../utils/gisGeometry";

// Normalize form geometryType ('POINT' | 'LINE' | 'POLYGON') — fallback POINT khi chưa chọn
const normalizeGeometryType = (value: unknown): 'POINT' | 'LINE' | 'POLYGON' =>
  value === 'LINE' || value === 'POLYGON' ? value : 'POINT';

/** Suy luận loại hình học từ chuỗi WKT (dùng khi bản ghi thiếu geometryType). */
const inferGeometryFromWkt = (wkt?: string | null): 'POINT' | 'LINE' | 'POLYGON' => {
  const head = (wkt || '').trim().toUpperCase();
  if (head.startsWith('POLYGON')) return 'POLYGON';
  if (head.startsWith('LINE')) return 'LINE';
  return 'POINT';
};

interface RawAttachmentItem {
  id?: string;
  fileName?: string;
  fileSize?: number;
  filePath?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

/** Map danh sách tệp từ Attachment sang InfrastructureAttachmentItem. */
const toAttachmentItemList = (list: RawAttachmentItem[]): InfrastructureAttachmentItem[] =>
  (Array.isArray(list) ? list : []).map((a) => ({
    id: a.id || '',
    fileName: a.fileName || '',
    fileSize: a.fileSize,
    filePath: a.filePath,
    uploadedDate: a.uploadedAt,
    uploadedBy: a.uploadedBy,
  }));

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch { return dateStr; }
}

import { usePermissionStore } from "../../store/permissionStore";
import {
  Button,
  DatePicker,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Drawer,
  Tabs,
  Typography,
} from "antd";
import { OrgUnitTreeSelect } from "../../components/org-unit";
import {
  PlusOutlined,
  SearchOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
import {
  fetchVhfList,
  deleteVhf,
  submitVhf,
  approveVhfC1,
  approveVhfC2,
  fetchVhfHistory,
  fetchVhfAttachments,
  downloadVhfAttachment,
  fetchOperatingOrganizations,
} from "./api";
import {
  OPERATIONAL_STATUS_OPTIONS,
  ATTACHED_INFRA_TYPE_OPTIONS,
  operationalStatusBadge,
} from "./schema";
import type { VhfResponse } from "./types";
import VhfForm, { type VhfFormRef } from "./VhfForm";
import AppDrawer from "../../components/shared/AppDrawer";
import ApprovalModal from "../../components/shared/ApprovalModal";
import DeleteConfirmModal from "../../components/shared/DeleteConfirmModal";
import { useAuthStore } from "../../store/authStore";
import {
  ScreenHeader,
  DataTable,
  Pagination,
  FilterTableLayout,
  SidebarFilterField,
} from "../../components/list-view";
import { VIETNAM_PROVINCES } from "../../types/common";
import { organizationService } from "../organizationService";
import { userService } from "../userService";
import { symbolService, type Symbol as MapSymbolType } from "../symbolService";
import { deduplicateAttachmentHistoryChanges } from "../../utils/historyAttachmentDedup";
import { isGisHistoryField } from "../../utils/historyGisFormat";
import DetailTable from "../../components/shared/DetailTable";
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from "../../components/shared/InfrastructureAttachmentTab";
import GisLocationSelector from "../../components/gis/GisLocationSelector";
import { ThemeTokenProvider, THEME_SCOPE_CLASS } from "../../context/ThemeTokenContext";
import toast from "../../components/ToastNotification";
import * as themeTokenChk from "../../themetokenchk";
import api from "../api";

// ── Đơn vị đo (unit of measure) labels ──────────────────────────────
const UOM_LABELS: Record<number, string> = {
  1: 'Bộ',
  2: 'Bến',
  3: 'Bản quyền',
  4: 'Chiếc',
  5: 'Cổng',
  6: 'Cái',
  7: 'Cột',
  8: 'Cầu',
  9: 'Đường truyền',
  10: 'Héc-ta',
  11: 'Hạng mục',
  12: 'Hệ thống',
  13: 'Kho',
  14: 'Khu',
  15: 'Ki-lô-mét',
  16: 'Mét',
  17: 'Mét vuông',
  18: 'Nhà',
  19: 'Phòng',
  20: 'Phương tiện',
  21: 'Quả',
  22: 'Tuyến',
  23: 'Tấn',
  24: 'Trạm',
  25: 'Tháp',
  26: 'Trụ',
  27: 'VNĐ',
};

function formatUnitOfMeasure(code: number | null | undefined): string {
  return code != null && UOM_LABELS[code] ? UOM_LABELS[code] : null;
}

import {
  colors,
  DRAWER_TABLE_SCROLL_Y,
  fontSizeCellTitle,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
  textPrimary,
  textSecondary,
  textTertiary,
  statusCritical,
  statusAttention,
  statusDraft,
  statusOperational,
  statusInfo,
  actionPrimary,
  borderDefault,
  surfaceCard,
  surfacePage,
  radiusPill,
  radiusSm,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceLg,
  spaceXl,
  spaceFormField,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  statusBadgeStyle,
  getRangePickerProps,
  getSidebarDatePickerProps,
  cellTitleStyle,
  cellSubtitleStyle,
  icons,
  fontSizeLg,
  inputStyle,
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyInfoTitleStyle,
  historyChangeRowStyle,
  historyCreateRowStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
} from "../../themetokenchk";

// ── Card/section trong Drawer Xem chi tiết — đồng bộ chuẩn /cctv (/berth) ──
const vhfDetailSectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '12px 18px 8px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const vhfDetailSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const vhfDetailSectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeCellTitle,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

// ── Trạng thái phê duyệt 2 cấp (C1 Cảng vụ → C2 Cục) — đồng bộ chuẩn /cctv ──
export function isVhfDeleted(record?: any): boolean {
  if (!record) return false;
  return Boolean(
    record.deletedAt ||
    record.deletedBy ||
    record.deleted_at ||
    record.deleted_by ||
    record.approvalStatus === 'DELETED' ||
    record.approvalStatus === 'ARCHIVED'
  );
}

const APPROVAL_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
  APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục',
  APPROVED: 'Đã phê duyệt',
  REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
  REJECTED_LEVEL2: 'Từ chối cấp cục',
  DELETED: 'Đã xóa',
  ARCHIVED: 'Đã xóa',
};

const APPROVAL_COLOR: Record<string, string> = {
  DRAFT: statusDraft,
  PENDING_APPROVAL: statusAttention,
  APPROVED_LEVEL1: statusInfo,
  APPROVED: statusOperational,
  REJECTED_LEVEL1: statusCritical,
  REJECTED_LEVEL2: statusCritical,
  DELETED: statusCritical,
  ARCHIVED: statusCritical,
};

function renderApprovalBadge(status: string | null | undefined, record?: Partial<VhfResponse> | null) {
  if (isVhfDeleted(record) || status === 'DELETED' || status === 'ARCHIVED') {
    return <span className="kcht-cell-badge" style={statusBadgeStyle(statusCritical)}>Đã xóa</span>;
  }
  if (!status) return null;
  const display = APPROVAL_STATUS_MAP[status] || status;
  const color = APPROVAL_COLOR[status] || textTertiary;
  return <span className="kcht-cell-badge" style={statusBadgeStyle(color)}>{display}</span>;
}

const tableMetaStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
};

const SKELETON_KEYS = ['skel-1', 'skel-2', 'skel-3', 'skel-4', 'skel-5', 'skel-6'];
const LoadingSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 8px' }}>
    {SKELETON_KEYS.slice(0, rows).map((key) => (
      <div
        key={key}
        style={{
          height: 38,
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          borderRadius: 6,
          animation: 'pulse 1.5s infinite',
        }}
      />
    ))}
  </div>
);

  // ── History helpers — đồng bộ 100% chuẩn /cctv ──
  const historyFieldLabels: Record<string, string> = {
    deviceCode: 'Mã thiết bị',
    deviceName: 'Tên thiết bị',
    detailedLocation: 'Địa điểm chi tiết',
    manufacturer: 'Hãng sản xuất',
    model: 'Model',
    quantity: 'Số lượng',
    seaportId: 'Thuộc cảng biển',
    seaportName: 'Thuộc cảng biển',
    orgUnitId: 'Đơn vị quản lý',
    operatingUnitId: 'Đơn vị khai thác',
    provinceName: 'Tỉnh/Thành phố',
    attachedInfrastructureType: 'Loại hạ tầng',
    attachedInfrastructureId: 'Thuộc hạ tầng',
    unitOfMeasure: 'Đơn vị tính',
    yearOfUse: 'Năm đưa vào sử dụng',
    operationalStatus: 'Trạng thái hoạt động',
    approvalStatus: 'Trạng thái phê duyệt',
    specifications: 'Thông số kỹ thuật',
    maintenanceInformation: 'Thông tin bảo trì',
    note: 'Ghi chú',
    objectType: 'Loại đối tượng (GIS)',
    geometryType: 'Loại đối tượng GIS',
    coordinates: 'Tọa độ GIS',
    mapSymbolId: 'Biểu tượng',
    coordinateSystem: 'Hệ quy chiếu',
    displayRule: 'Quy tắc hiển thị',
    spatialId: 'Không gian GIS',
    'Tên thiết bị': 'Tên thiết bị',
    'Địa điểm chi tiết': 'Địa điểm chi tiết',
    'Hãng sản xuất': 'Hãng sản xuất',
    'Model': 'Model',
    'Số lượng': 'Số lượng',
    'Thuộc cảng biển': 'Thuộc cảng biển',
    'Đơn vị quản lý': 'Đơn vị quản lý',
    'Đơn vị khai thác': 'Đơn vị khai thác',
    'Tỉnh/Thành phố': 'Tỉnh/Thành phố',
    'Loại hạ tầng': 'Loại hạ tầng',
    'Thuộc loại hạ tầng': 'Thuộc loại hạ tầng',
    'Thuộc hạ tầng': 'Thuộc hạ tầng',
    'Đơn vị tính': 'Đơn vị tính',
    'Năm đưa vào sử dụng': 'Năm đưa vào sử dụng',
    'Trạng thái hoạt động': 'Trạng thái hoạt động',
    'Tình trạng': 'Tình trạng',
    'Thông số kỹ thuật': 'Thông số kỹ thuật',
    'Thông tin bảo trì': 'Thông tin bảo trì',
    'Ghi chú': 'Ghi chú',
    'Loại đối tượng': 'Loại đối tượng',
    'Loại đối tượng GIS': 'Loại đối tượng GIS',
    'Tọa độ GIS': 'Tọa độ GIS',
    'Biểu tượng': 'Biểu tượng',
    'Hệ quy chiếu': 'Hệ quy chiếu',
    'Quy tắc hiển thị': 'Quy tắc hiển thị',
    'Tài liệu đính kèm': 'Tài liệu đính kèm',
    'Lý do từ chối': 'Lý do từ chối',
    'Trạng thái': 'Hành động',
  };

  function historyFieldName(fn: string): string {
    return historyFieldLabels[fn] || fn;
  }

  function historyFieldValue(
    fn: string,
    val: string | null,
    orgMap?: Map<string, string>,
    symbolMap?: Map<string, string>,
    seaportMap?: Map<string, string>,
    operatingUnitMap?: Map<string, string>,
    vtsCenterMap?: Map<string, string>,
    radarStationMap?: Map<string, string>,
  ): string {
    if (!val || val === '(null)' || val === 'null' || val === 'Chưa có') return 'Chưa có';
    const fieldKey = String(fn || '').trim();
    if ((fieldKey === 'orgUnitId' || fieldKey === 'Đơn vị quản lý') && orgMap) {
      const full = orgMap.get(val);
      return full ? full.split(' - ').pop() || full : val;
    }
    if ((fieldKey === 'seaportId' || fieldKey === 'Thuộc cảng biển') && seaportMap) {
      return seaportMap.get(val) || val;
    }
    if ((fieldKey === 'operatingUnitId' || fieldKey === 'Đơn vị khai thác' || fieldKey === 'Đơn vị vận hành') && operatingUnitMap) {
      return operatingUnitMap.get(val) || val;
    }
    if (fieldKey === 'attachedInfrastructureId' || fieldKey === 'Thuộc hạ tầng' || fieldKey === 'Hạ tầng phụ thuộc') {
      return vtsCenterMap?.get(val) || radarStationMap?.get(val) || val;
    }
    if (fieldKey === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || val;
    if (fn === 'approvalStatus' || fn === 'Trạng thái phê duyệt' || fn === 'Trạng thái') {
      const ALIAS: Record<string, string> = {
        NHAP: 'DRAFT',
        PROPOSED: 'PENDING_APPROVAL',
        PENDING: 'PENDING_APPROVAL',
        CHO_PHE_DUYET: 'PENDING_APPROVAL',
        CHO_PD_CAP_CUC: 'APPROVED_LEVEL1',
        APPROVED_L1: 'APPROVED_LEVEL1',
        APPROVED_LEVEL2: 'APPROVED',
        APPROVED_L2: 'APPROVED',
        DA_PHE_DUYET: 'APPROVED',
        DUC_PHI_DUYET: 'APPROVED',
        REJECTED: 'REJECTED_LEVEL1',
        TU_CHOI: 'REJECTED_LEVEL1',
      };
      const m: Record<string, string> = {
        DRAFT: 'Lưu tạm',
        PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
        APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục',
        APPROVED: 'Đã phê duyệt',
        REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
        REJECTED_LEVEL2: 'Từ chối cấp cục',
      };
      const canonical = ALIAS[val] || val;
      return m[canonical] || val;
    }
    if (fn === 'operationalStatus' || fn === 'Trạng thái hoạt động' || fn === 'Tình trạng hoạt động' || fn === 'Tình trạng') {
      const m: Record<string, string> = {
        '0': 'Chưa khai thác/vận hành',
        '1': 'Đang khai thác/vận hành',
        '2': 'Dừng khai thác/vận hành',
        NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
        OPERATIONAL: 'Đang khai thác/vận hành',
        SUSPENDED: 'Dừng khai thác/vận hành',
      };
      return m[val] || val;
    }
    if (fieldKey === 'unitOfMeasure' || fieldKey === 'Đơn vị tính') {
      const uomNum = Number(val);
      return (!isNaN(uomNum) && formatUnitOfMeasure(uomNum)) ? formatUnitOfMeasure(uomNum) : val;
    }
    if (fieldKey === 'attachedInfrastructureType' || fieldKey === 'Loại hạ tầng' || fieldKey === 'Thuộc loại hạ tầng') {
      const m: Record<string, string> = { '1': 'Trung Tâm Điều Hành VTS', '2': 'Trạm Radar' };
      return m[String(val)] || val;
    }
    if (fieldKey === 'coordinateSystem' || fieldKey === 'Hệ quy chiếu' || fieldKey === 'Hệ tọa độ') {
      const m: Record<string, string> = { '1': 'WGS 84', '4326': 'WGS 84', '2': 'VN-2000' };
      return m[String(val)] || val;
    }
    if (fieldKey === 'objectType' || fieldKey === 'Loại đối tượng (GIS)' || fieldKey === 'Loại đối tượng' || fieldKey === 'geometryType' || fieldKey === 'Loại đối tượng GIS') {
      const m: Record<string, string> = {
        '1': 'Đối tượng điểm',
        '2': 'Đối tượng đường',
        '3': 'Đối tượng vùng',
        POINT: 'Đối tượng điểm',
        LINE: 'Đối tượng đường',
        POLYGON: 'Đối tượng vùng',
      };
      return m[val] || val;
    }
    if (fieldKey === 'changedAt' || fieldKey === 'createdAt') {
      try { return dayjs(val).format('DD/MM/YYYY HH:mm:ss'); } catch { return val; }
    }
    return val;
  }

  const HISTORY_PAGE_SIZE = 20;

  const historyTimestamp = (item: any): string =>
    item.approvedDate || item.changedAt || item.createdAt || '';

  const historyField = (item: any): string =>
    item.changedField || item.fieldName || '';

  const historyOldValue = (item: any): string | null =>
    item.previousValue ?? item.oldValue ?? null;

  const historyNewValue = (item: any): string | null =>
    item.newValue ?? null;

  const historyActor = (item: any): string => {
    const raw = item?.approvedBy || item?.changedBy || '';
    return raw || null;
  };

  const resolveHistoryActionMeta = (item: any): { label: string; color: string; bg: string } => {
    const rawStatus = String(item?.status ?? item?.action ?? '').toUpperCase();
    const rawReason = String(item?.reason ?? '').toLowerCase();
    const rawField = String(item?.changedField ?? item?.fieldName ?? '').toLowerCase();
    if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
      return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}15` };
    }
    if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || (rawField.includes('đính kèm') && rawReason.includes('tải'))) {
      return { label: 'Tải lên tệp', color: statusInfo, bg: `${statusInfo}15` };
    }
    if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xoa tai lieu') || rawReason.includes('xóa tệp')) {
      return { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' };
    }
    if (rawStatus === 'DELETED' || rawStatus === 'ARCHIVED' || rawStatus === 'DELETE' || rawReason.includes('xóa bản ghi') || rawReason.includes('xoa ban ghi')) {
      return { label: 'Xóa', color: textTertiary, bg: `${textTertiary}15` };
    }
    if (rawStatus === 'SUBMITTED' || rawStatus === 'PROPOSED' || rawStatus === 'SUBMIT' || rawReason.includes('gửi phê duyệt') || rawReason.includes('gui phe duyet') || rawReason.includes('trình duyệt') || rawReason.includes('trinh duyet')) {
      return { label: 'Gửi phê duyệt', color: statusAttention, bg: `${statusAttention}15` };
    }
    if (rawStatus.includes('APPROVED_L2') || rawStatus === 'APPROVED' || rawReason.includes('cấp cục') || rawReason.includes('cap cuc') || rawReason.includes('cục phê duyệt') || rawReason.includes('cuc phe duyet') || item?.approvalLevel === 'LEVEL_2' || item?.approvalLevel === 2) {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}15` };
    }
    if (rawStatus.includes('APPROVED_L1') || rawReason.includes('cảng vụ phê duyệt') || rawReason.includes('cang vu phe duyet') || rawReason.includes('chi cục phê duyệt') || rawReason.includes('cấp cảng vụ') || item?.approvalLevel === 'LEVEL_1' || item?.approvalLevel === 1) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: statusInfo, bg: `${statusInfo}15` };
    }
    if (rawStatus.includes('REJECTED_L2') || (rawStatus.includes('REJECT') && (rawReason.includes('cục') || rawReason.includes('cuc') || item?.approvalLevel === 'LEVEL_2' || item?.approvalLevel === 2))) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}15` };
    }
    if (rawStatus.includes('REJECTED_L1') || rawStatus === 'REJECTED' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}15` };
    }
    if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawReason.includes('cập nhật') || rawReason.includes('cap nhat') || rawReason.includes('chỉnh sửa') || rawReason.includes('chinh sua') || rawField.length > 0) {
      return { label: 'Cập nhật', color: '#1a3f83', bg: '#1a3f8315' };
    }
    return { label: 'Cập nhật', color: '#1a3f83', bg: '#1a3f8315' };
  };

  const isUpdateAction = (status?: string, reason?: string) => {
    const s = String(status || '').toUpperCase();
    const r = String(reason || '').toLowerCase();
    return s === 'UPDATED' || s === 'UPDATE' || (!s && (r.includes('cập nhật') || r.includes('chỉnh sửa')));
  };

  const HISTORY_FIELD_ORDER = [
    'orgUnitId', 'Đơn vị quản lý',
    'seaportId', 'Thuộc cảng biển',
    'deviceCode', 'Mã thiết bị',
    'deviceName', 'Tên thiết bị',
    'manufacturer', 'Hãng sản xuất',
    'model', 'Model',
    'quantity', 'Số lượng',
    'operatingUnitId', 'Đơn vị khai thác', 'Đơn vị vận hành',
    'provinceName', 'Tỉnh/Thành phố', 'Địa điểm (Tỉnh/TP)',
    'detailedLocation', 'Địa điểm chi tiết',
    'attachedInfrastructureType', 'Loại hạ tầng',
    'attachedInfrastructureId', 'Thuộc hạ tầng',
    'unitOfMeasure', 'Đơn vị tính',
    'yearOfUse', 'Năm đưa vào sử dụng',
    'operationalStatus', 'Trạng thái hoạt động', 'Tình trạng',
    'approvalStatus', 'Trạng thái phê duyệt', 'Trạng thái',
    'specifications', 'Thông số kỹ thuật',
    'maintenanceInformation', 'Thông tin bảo trì',
    'note', 'Ghi chú',
    'objectType', 'Loại đối tượng',
    'geometryType', 'Loại đối tượng GIS',
    'coordinates', 'Tọa độ GIS',
    'mapSymbolId', 'Biểu tượng',
    'coordinateSystem', 'Hệ quy chiếu',
    'displayRule', 'Quy tắc hiển thị',
    'Tài liệu đính kèm',
    'Lý do từ chối',
  ];

const VhfListPage = () => {
  const [searchParams] = useSearchParams();
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [data, setData] = useState<VhfResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "0", 10);
    return isNaN(p) || p < 0 ? 0 : p;
  });
  const [pageSize, setPageSize] = useState(20);

  // Sorting
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const handleSort = useCallback((field: string, order: "asc" | "desc") => {
    setSortField(field);
    setSortOrder(order === "asc" ? "ascend" : "descend");
    setPage(0);
  }, []);

  // Bộ lọc
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState({
    orgUnitId: "" as string,
    deviceName: "",
    deviceCode: "",
    seaportId: "" as string,
    operationalStatus: undefined as number | undefined,
    approvalStatus: "" as string,
    province: "" as string,
    attachedInfraType: undefined as number | undefined,
    attachedInfraId: "" as string,
    yearOfUse: undefined as number | undefined,
    updatedFrom: "" as string,
    updatedTo: "" as string,
  });

  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);

  // Tab counts
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [totalAll, setTotalAll] = useState(0);

  // Quản lý Modal & Drawer
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailsSpecsOpen, setDetailsSpecsOpen] = useState(true);
  const [detailApprovalOpen, setDetailApprovalOpen] = useState(true);
  const [opRunOpen, setOpRunOpen] = useState(true);
  const [opMaintOpen, setOpMaintOpen] = useState(true);
  const [opIncidentOpen, setOpIncidentOpen] = useState(true);
  const [gisMapOpen, setGisMapOpen] = useState(false);
  const [attachmentItems, setAttachmentItems] = useState<InfrastructureAttachmentItem[]>([]);
  const [symbols, setSymbols] = useState<MapSymbolType[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('*') ?? false;
  const canSaveAndApprove = useMemo(() => {
    return hasPerm?.('vhf:approvec2') || hasPerm?.('vhf:approvec1') || isSystemAdmin;
  }, [hasPerm, isSystemAdmin]);

  const [selectedRecord, setSelectedRecord] = useState<VhfResponse | null>(null);
  const vhfFormRef = useRef<VhfFormRef>(null);
  const editVhfFormRef = useRef<VhfFormRef>(null);
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<VhfResponse | null>(null);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve'>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<VhfFormRef>(null);
  const [form] = Form.useForm();

  // ── Delete confirmation modal (chuẩn /berth) ────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<VhfResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Reject modal (chuẩn /berth) ─────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<VhfResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // ── Submit/Approve modal (chuẩn /berth) ─────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<VhfResponse | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<VhfResponse | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // Lịch sử thay đổi (Đồng bộ 100% chuẩn /cctv)
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyEntityName, setHistoryEntityName] = useState('');
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyReloadToken, setHistoryReloadToken] = useState(0);

  const historyFieldCount = useMemo(() => {
    if (!Array.isArray(historyRecords)) return 0;
    let count = 0;
    for (const r of historyRecords) {
      count += (r.changes && r.changes.length > 0) ? r.changes.length : 1;
    }
    return count;
  }, [historyRecords]);

  // Danh mục đơn vị quản lý (chuẩn /radar-station)
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // ── Load đơn vị quản lý mặc định — đồng bộ 100% chuẩn /radar-station ──
  useEffect(() => {
    const loadOrgDefault = async () => {
      setLoadingOrgs(true);
      const isIframe = window.self !== window.top;
      const data = isIframe ? (window.parent as any)?.kchtOrgUnits : undefined;
      const orgs: any[] = data && data.length > 0
        ? data
        : ((await organizationService.getTree()) || []);
      setOrgUnits(orgs);
      if (orgs.length > 0 && !defaultOrgApplied.current) {
        defaultOrgApplied.current = true;
        const found = data && data.length > 0
          ? data[0]
          : null;
        if (found) {
          defaultOrgUnitId.current = found.id;
          setFilterValues((prev) => ({ ...prev, orgUnitId: found.id }));
        } else {
          // lấy đơn vị của user đang đăng nhập
          try {
            const profileRes = await api.get('/users/me');
            const profile = (profileRes as any)?.data?.data ?? (profileRes as any)?.data;
            const userOrgId = profile?.orgUnitId;
            const match = userOrgId && orgs.find((o: any) => o.id === userOrgId);
            const defaultId = userOrgId ? (match ? userOrgId : orgs[0].id) : '__all__';
            defaultOrgUnitId.current = defaultId;
            setFilterValues((prev) => ({ ...prev, orgUnitId: defaultId === '__all__' ? "" : defaultId }));
          } catch {
            defaultOrgUnitId.current = orgs[0].id;
            setFilterValues((prev) => ({ ...prev, orgUnitId: orgs[0].id }));
          }
        }
      }
      setOrgUnitReady(true);
      setLoadingOrgs(false);
    };
    loadOrgDefault().catch(() => {
      console.error('Không tải được cây đơn vị quản lý', 'Failed to load organizations');
      setOrgUnitReady(true);
      setLoadingOrgs(false);
    });
  }, []);

  // ── History map helpers ────────────────────────────────────────
  const symbolMap = useMemo(() => {
    const m = new Map<string, string>();
    (symbols || []).forEach((s) => {
      if (s.name) m.set(s.id, s.name);
    });
    return m;
  }, [symbols]);

  const symbolImageMap = useMemo(() => {
    const m = new Map<string, string>();
    (symbols || []).forEach((s) => {
      if (s.image) m.set(s.id, s.image);
    });
    return m;
  }, [symbols]);

  // Danh mục options cảng biển & map
  const [seaportOptions, setSeaportOptions] = useState<Array<{ id: string; portName: string; portCode?: string }>>([]);
  const seaportMap = useMemo(() => {
    const m = new Map<string, string>();
    seaportOptions.forEach((p) => {
      if (p.id) m.set(p.id, p.portCode ? `${p.portCode} - ${p.portName}` : p.portName);
    });
    return m;
  }, [seaportOptions]);

  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    const build = (items: Array<{ id: string; name: string; parentId?: string; children?: Array<{ id: string; name: string }> }>) => {
      for (const item of items) {
        if (item.name) m.set(item.id, item.name);
        if (item.children) build(item.children);
      }
    };
    build(orgUnits as any);
    return m;
  }, [orgUnits]);

  // Load history khi mở Drawer hoặc thay đổi bộ lọc tìm kiếm/ngày
  useEffect(() => {
    if (!historyModalVisible || !selectedRecord) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingHistory(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      setHistoryPage(0);
      try {
        const history = await fetchVhfHistory(selectedRecord.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historySearch,
          fromDate: historyDateFrom,
          toDate: historyDateTo,
        });
        if (cancelled) return;
        const items = history || [];
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch {
        if (!cancelled) toast.error('Không thể tải lịch sử');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }, historySearch.trim() ? 300 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [historyModalVisible, selectedRecord, historySearch, historyDateFrom, historyDateTo, historyReloadToken]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await fetchVhfHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historySearch,
        fromDate: historyDateFrom,
        toDate: historyDateTo,
      });
      if (history && history.length > 0) {
        setHistoryRecords((prev) => [...prev, ...history]);
      }
      setHistoryPage(nextPage);
      setHasMoreHistory((history || []).length === HISTORY_PAGE_SIZE);
    } catch {
      /* ignore */
    } finally {
      setLoadingMoreHistory(false);
    }
  };

  const handleHistoryScroll = (e: any) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      loadMoreHistory();
    }
  };

  // Radar station options for dependent dropdown (Thuộc Trạm Radar — loại 2)
  const [radarStationOptions, setRadarStationOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingRadars, setLoadingRadars] = useState(false);

  const fetchRadarStations = useCallback(async () => {
    setLoadingRadars(true);
    try {
      const res = await api.get("/common/options/radar-stations");
      const items = res.data?.data;
      setRadarStationOptions(
        (Array.isArray(items) ? items : []).map((s: { id: string; stationName?: string; code?: string }) => ({
          label: s.stationName || s.code || s.id,
          value: s.id,
        }))
      );
    } catch (error) {
      console.error("Lỗi tải danh sách trạm Radar:", error);
      setRadarStationOptions([]);
    } finally {
      setLoadingRadars(false);
    }
  }, []);

  useEffect(() => {
    fetchRadarStations();
  }, [fetchRadarStations]);

  // VTS Operation Center options for dependent dropdown (Thuộc TTDH VTS — loại 1)
  const [vtsOperationCenterOptions, setVtsOperationCenterOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingVtsCenters, setLoadingVtsCenters] = useState(false);

  const fetchVtsOperationCenters = useCallback(async () => {
    setLoadingVtsCenters(true);
    try {
      const res = await api.get("/common/options/vts-operation-centers");
      const items = res.data?.data;
      setVtsOperationCenterOptions(
        (Array.isArray(items) ? items : []).map((s: { id: string; name?: string; code?: string }) => ({
          label: s.name || s.code || s.id,
          value: s.id,
        }))
      );
    } catch (error) {
      console.error("Lỗi tải danh sách Trung tâm điều hành VTS:", error);
      setVtsOperationCenterOptions([]);
    } finally {
      setLoadingVtsCenters(false);
    }
  }, []);

  useEffect(() => {
    fetchVtsOperationCenters();
  }, [fetchVtsOperationCenters]);

  // Danh mục đơn vị khai thác (Operating Unit) & map
  const [operatingOrganizations, setOperatingOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    fetchOperatingOrganizations().then((list) => {
      if (Array.isArray(list)) setOperatingOrganizations(list);
    }).catch(() => {});
  }, []);

  const operatingUnitMap = useMemo(() => {
    const m = new Map<string, string>();
    operatingOrganizations.forEach((o) => {
      if (o.id && o.name) m.set(o.id, o.name);
    });
    return m;
  }, [operatingOrganizations]);

  const vtsCenterMap = useMemo(() => {
    const m = new Map<string, string>();
    vtsOperationCenterOptions.forEach((o) => {
      if (o.value && o.label) m.set(o.value, o.label);
    });
    return m;
  }, [vtsOperationCenterOptions]);

  const radarStationMap = useMemo(() => {
    const m = new Map<string, string>();
    radarStationOptions.forEach((o) => {
      if (o.value && o.label) m.set(o.value, o.label);
    });
    return m;
  }, [radarStationOptions]);

  // Load danh mục biểu tượng, người dùng, cảng biển
  useEffect(() => {
    api.get("/common/options/symbols")
      .then((res) => {
        const items = res.data?.data;
        if (Array.isArray(items)) {
          setSymbols(items);
        } else {
          symbolService.getAll().then((all) => setSymbols(Array.isArray(all) ? all : [])).catch(() => setSymbols([]));
        }
      })
      .catch(() => {
        symbolService.getAll().then((all) => setSymbols(Array.isArray(all) ? all : [])).catch(() => setSymbols([]));
      });

    userService.list({ pageSize: 1000 }).then((resp) => {
      const users = resp.data || (resp as any).content || [];
      const next = new Map<string, string>();
      users.forEach((u: any) => next.set(u.id, u.fullName || u.username || u.id));
      setUserMap(next);
    }).catch(() => {});

    api.get('/v1/ports/options').then((res) => {
      const data = res.data?.data;
      if (Array.isArray(data)) setSeaportOptions(data);
    }).catch(() => {
      api.get('/v1/ports?size=1000').then((res) => {
        const list = res.data?.data?.content || res.data?.data || [];
        if (Array.isArray(list)) {
          setSeaportOptions(list.map((p: any) => ({ id: p.id, portName: p.portName || p.name, portCode: p.portCode || p.code })));
        }
      }).catch(() => {});
    });
  }, []);

  // Lấy dữ liệu danh sách
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const safePage = Math.max(page, 0);
      const safeSize = Math.max(1, Math.min(pageSize, 100));
      const result = await fetchVhfList({
        page: safePage,
        size: safeSize,
        orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__' ? filterValues.orgUnitId : undefined),
        search: filterValues.deviceCode || filterValues.deviceName || undefined,
        deviceCode: filterValues.deviceCode || undefined,
        deviceName: filterValues.deviceName || undefined,
        seaportId: filterValues.seaportId || undefined,
        operationalStatus: filterValues.operationalStatus != null ? String(filterValues.operationalStatus) : undefined,
        approvalStatus: filterValues.approvalStatus || undefined,
        province: filterValues.province || undefined,
        attachedInfraType: filterValues.attachedInfraType,
        attachedInfraId: filterValues.attachedInfraId || undefined,
        yearOfUse: filterValues.yearOfUse,
        updatedFrom: filterValues.updatedFrom || undefined,
        updatedTo: filterValues.updatedTo || undefined,
        sortBy: sortField || "updatedAt",
        sortOrder: sortOrder === "ascend" ? "asc" : "desc",
      });
      setData(result.content || []);
      setTotal(result.totalElements || 0);
      setPage(result.number || 0);
    } catch (error: any) {
      setIsError(error?.response?.data?.message || "Lỗi khi tải danh sách hệ thống VHF");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterValues, sortField, sortOrder]);

  const fetchTabCounts = useCallback(async () => {
    const statuses = [
      { key: "DRAFT", status: "DRAFT" },
      { key: "PENDING_APPROVAL", status: "PENDING_APPROVAL" },
      { key: "APPROVED_LEVEL1", status: "APPROVED_LEVEL1" },
      { key: "APPROVED", status: "APPROVED" },
      { key: "REJECTED_LEVEL1", status: "REJECTED_LEVEL1" },
      { key: "REJECTED_LEVEL2", status: "REJECTED_LEVEL2" },
      { key: "DELETED", status: "DELETED" },
    ];
    try {
      const results = await Promise.allSettled(
        statuses.map((s) =>
          fetchVhfList({
            page: 0,
            size: 1,
            orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__' ? filterValues.orgUnitId : undefined),
            approvalStatus: s.status,
          })
        )
      );
      const counts: Record<string, number> = {};
      results.forEach((r, i) => {
        counts[statuses[i].key] = r.status === "fulfilled" ? (r.value?.totalElements || 0) : 0;
      });
      setTabCounts(counts);

      const allRes = await fetchVhfList({
        page: 0,
        size: 1,
        orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__' ? filterValues.orgUnitId : undefined),
      });
      setTotalAll(allRes.totalElements || 0);
    } catch {
      // ignore
    }
  }, [filterValues.orgUnitId]);

  useEffect(() => {
    if (!orgUnitReady) return;
    fetchData();
    fetchTabCounts();
  }, [orgUnitReady, fetchData, fetchTabCounts]);

  const handleFilterApply = useCallback(() => {
    setPage(0);
    fetchData();
    fetchTabCounts();
  }, [fetchData, fetchTabCounts]);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current;
    setFilterValues({
      orgUnitId: defaultOrg === '__all__' ? "" : (defaultOrg || ""),
      deviceName: "",
      deviceCode: "",
      seaportId: "",
      operationalStatus: undefined,
      approvalStatus: "",
      province: "",
      attachedInfraType: undefined,
      attachedInfraId: "",
      yearOfUse: undefined,
      updatedFrom: "",
      updatedTo: "",
    });
    setPage(0);
  }, []);

  const openViewDetail = useCallback((record: VhfResponse) => {
    if (!hasPerm?.('vhf:read')) {
      toast.warning('Bạn không có quyền xem chi tiết hệ thống VHF');
      return;
    }
    setSelectedRecord(record);
    setDetailDrawerOpen(true);
    setAttachmentItems([]);
    void fetchVhfAttachments(record.id)
      .then((list: RawAttachmentItem[]) => setAttachmentItems(toAttachmentItemList(list)))
      .catch(() => { /* ignore */ });
  }, [hasPerm]);

  const handleOpenView = openViewDetail;

  const handleDownloadAttachmentItem = useCallback(async (attachmentId: string, fileName: string) => {
    const targetId = selectedRecord?.id;
    if (!targetId) {
      toast.warning('Chưa chọn bản ghi thiết bị');
      return;
    }
    try {
      await downloadVhfAttachment(targetId, attachmentId, fileName);
    } catch {
      toast.error('Lỗi khi tải xuống tệp đính kèm');
    }
  }, [selectedRecord]);

  const handleOpenCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      operationalStatus: 0,
      orgUnitId: currentUser?.orgUnitId || defaultOrgUnitId.current,
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (record: VhfResponse) => {
    updateForm.resetFields();
    setUpdateTarget(record);
    setUpdateModalOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerMode(null);
    setSelectedRecord(null);
    form.resetFields();
  };

  // ── Delete confirmation (chuẩn /berth) ──────────────────────────
  const openDeleteModal = useCallback((record: VhfResponse) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await deleteVhf(deletingRecord.id);
      toast.success('Đã xóa hệ thống thông tin liên lạc VHF');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || (err instanceof Error ? err.message : 'Xóa thất bại'));
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData, fetchTabCounts]);

  // ── Approval handlers (chuẩn /berth) ────────────────────────────
  const handleApprove = useCallback(async (record: VhfResponse, content?: string) => {
    setApproveLoading(true);
    try {
      if (record.approvalStatus === 'APPROVED_LEVEL1') {
        await approveVhfC2(record.id, { decision: 'APPROVED', reason: content || 'Đã phê duyệt' });
        toast.success('Phê duyệt cấp Cục thành công');
      } else {
        await approveVhfC1(record.id, { decision: 'APPROVED', reason: content || 'Đã phê duyệt' });
        toast.success('Phê duyệt cấp Cảng vụ thành công');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      setPage(1);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || (err instanceof Error ? err.message : 'Phê duyệt thất bại'));
    } finally {
      setApproveLoading(false);
    }
  }, [fetchData, fetchTabCounts]);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    setSubmitLoading(true);
    try {
      await submitVhf(submittingRecord.id);
      toast.success('Đã gửi phê duyệt hệ thống thông tin liên lạc VHF');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      setPage(1);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || (err instanceof Error ? err.message : 'Gửi phê duyệt thất bại'));
    } finally {
      setSubmitLoading(false);
    }
  }, [submittingRecord, fetchData, fetchTabCounts]);

  const openRejectModal = useCallback((record: VhfResponse) => {
    setRejectingRecord(record);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { toast.error('Lý do từ chối tối thiểu 10 ký tự'); return; }
    if (reason.length > 500) { toast.error('Lý do từ chối tối đa 500 ký tự'); return; }
    setRejectLoading(true);
    try {
      if (rejectingRecord.approvalStatus === 'APPROVED_LEVEL1') {
        await approveVhfC2(rejectingRecord.id, { decision: 'REJECTED', reason });
        toast.success('Đã từ chối phê duyệt cấp Cục');
      } else {
        await approveVhfC1(rejectingRecord.id, { decision: 'REJECTED', reason });
        toast.success('Đã từ chối phê duyệt cấp Cảng vụ');
      }
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setPage(1);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || (err instanceof Error ? err.message : 'Từ chối thất bại'));
    } finally {
      setRejectLoading(false);
    }
  }, [rejectingRecord, rejectReason, fetchData, fetchTabCounts]);

  const renderVhfHistoryTimeline = (records: any[]) => {
    const q = (historySearch || '').toLowerCase().trim();
    const groups: Array<{ tsSec: number; ts: string; actor: string; status: string; approvalLevel: any; items: any[] }> = [];

    for (const r of records) {
      const ts = historyTimestamp(r);
      const sec = ts ? Math.floor(new Date(ts).getTime() / 2000) : 0;
      const actor = historyActor(r);
      const prev = groups[groups.length - 1];
      const isBothUpdate = prev && isUpdateAction(prev.status, prev.items[0]?.reason) && isUpdateAction(r.status, r.reason);
      const isSameGroup = prev && prev.tsSec === sec && prev.actor === actor && (prev.status === r.status || isBothUpdate);
      if (isSameGroup)
        prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor, status: r.status, approvalLevel: r.approvalLevel, items: [r] });
    }

    if (groups.length === 0)
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
        </div>
      );

    const fmtTime = (ts: string) => {
      const d = new Date(ts);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };

    return (
      <div>
        {groups.map((g, gi) => {
          const rec0 = g.items[0] || {};
          const orgId = rec0.orgUnitId || selectedRecord?.orgUnitId;
          const orgName = orgId ? orgMap.get(orgId) : '';
          const unitName =
            rec0.orgUnitName ||
            (orgName ? orgName.split(' - ').pop() || orgName : '') ||
            selectedRecord?.orgUnitName ||
            'Cục Hàng hải Việt Nam';
          const changes = deduplicateAttachmentHistoryChanges(
            g.items.flatMap((item: any) => {
              const fn = historyField(item);
              return fn ? [{ field: fn, oldValue: historyOldValue(item), newValue: historyNewValue(item) }] : [];
            })
          );

          const orderedChanges = [...changes].sort((a, b) => {
            const getIndex = (field: string) => {
              const idx = HISTORY_FIELD_ORDER.indexOf(field);
              return idx >= 0 ? idx : 999;
            };
            return getIndex(a.field) - getIndex(b.field);
          });

          const actionMeta = resolveHistoryActionMeta(rec0);
          const isCreate = actionMeta.label === 'Thêm mới';
          const actorResolved = g.actor && userMap.has(g.actor) ? userMap.get(g.actor)! : g.actor;

          if (orderedChanges.length === 0) return null;

          return (
            <div
              key={gi}
              style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}
            >
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                  <Typography.Text style={historyTimeStyle}>
                    {g.ts ? fmtTime(g.ts) : null}
                  </Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>
                      {actionMeta.label}
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                  <Typography.Text style={historyMetaRowStyle}>
                    Người cập nhật: {actorResolved || 'Hệ thống'}
                  </Typography.Text>
                  <Typography.Text style={historyMetaRowStyle}>
                    Đơn vị: {unitName}
                  </Typography.Text>
                </div>
              </div>

              {/* Cột phải: thông tin chi tiết các trường thay đổi */}
              <div style={historyInfoCardStyle}>
                <div style={historyAccentBarStyle(actionMeta.color || actionPrimary)} />
                <Typography.Text style={historyInfoTitleStyle}>
                  {isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:'}
                </Typography.Text>
                {orderedChanges.length > 0 ? (
                  <div>
                    {orderedChanges.map((change, ri) => {
                      const fn = change.field;
                      const ov = historyFieldValue(fn, change.oldValue, orgMap, symbolMap, seaportMap, operatingUnitMap, vtsCenterMap, radarStationMap);
                      const nv = historyFieldValue(fn, change.newValue, orgMap, symbolMap, seaportMap, operatingUnitMap, vtsCenterMap, radarStationMap);

                      const renderCell = (rawVal: string | null) => {
                        if (fn === 'mapSymbolId' && rawVal && rawVal !== '(null)') {
                          const img = symbolImageMap.get(rawVal);
                          const name = symbolMap.get(rawVal) || '';
                          if (!img && !name) return null;
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }}
                                />
                              ) : null}
                              {name || null}
                            </span>
                          );
                        }
                        return null;
                      };
                      const gisCellStyle = isGisHistoryField(fn)
                        ? { whiteSpace: 'pre-line' as const, lineHeight: 1.5 }
                        : {};
                      const renderValueNode = (rawVal: string | null, val: string | null) => {
                        const node = renderCell(rawVal) ?? (val ?? null);
                        return isGisHistoryField(fn) ? (
                          <span style={gisCellStyle}>{node}</span>
                        ) : (
                          node
                        );
                      };
                      if (isCreate) {
                        return (
                          <div
                            key={`${fn}-${ri}`}
                            style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}
                          >
                            <div style={historyFieldLabelStyle}>
                              {fn ? `${historyFieldName(fn)}:` : null}
                            </div>
                            <span
                              title={typeof nv === 'string' ? nv : undefined}
                              style={{ ...historyNewValueStyle, ...gisCellStyle }}
                            >
                              {renderValueNode(change.newValue, nv)}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={`${fn}-${ri}`}
                          style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}
                        >
                          <div style={historyFieldLabelStyle}>
                            {fn ? `${historyFieldName(fn)}:` : null}
                          </div>
                          <span
                            title={typeof ov === 'string' ? ov : undefined}
                            style={{ ...historyOldValueStyle, ...gisCellStyle }}
                          >
                            {renderValueNode(change.oldValue, ov)}
                          </span>
                          <span style={historyArrowStyle}>→</span>
                          <span
                            title={typeof nv === 'string' ? nv : undefined}
                            style={{ ...historyNewValueStyle, ...gisCellStyle }}
                          >
                            {renderValueNode(change.newValue, nv)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>
                    Không có thông tin chi tiết
                  </Typography.Text>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper render stack info (tên + ngày giờ) chuẩn /cctv
  const renderInfoStack = (name: string | null | undefined, date: string | null | undefined) => {
    const dateText = date ? dayjs(date).format("DD/MM/YYYY HH:mm:ss") : "";
    if (!name && !date) return null;
    return (
      <div style={{ lineHeight: "1.35", overflow: "hidden" }}>
        <div
          title={name || undefined}
          style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {name || null}
        </div>
        <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: "nowrap" }}>
          {dateText || null}
        </div>
      </div>
    );
  };

  // ── Columns đồng bộ chuẩn /cctv ──
  const columns: any[] = useMemo(() => [
    {
      key: "index",
      label: "STT",
      width: 60,
      type: "mono" as const,
      align: "center" as const,
      fixed: "left" as const,
      render: (_: unknown, __: VhfResponse, index: number) => (
        <span style={{ ...tableMetaStyle, fontWeight: fontWeightMedium }}>
          {page * pageSize + index + 1}
        </span>
      ),
    },
    {
      key: "deviceName",
      label: "Tên / Mã thiết bị",
      dataIndex: "deviceName",
      width: 300,
      fixed: "left" as const,
      sortable: true,
      sortOrder: sortField === "deviceName" ? sortOrder : null,
      ellipsis: false,
      render: (val: string, record: VhfResponse) => (
        <div style={{ minWidth: 0 }}>
          {hasPerm?.('vhf:read') ? (
            <button
              type="button"
              className="kcht-cell-title"
              onClick={() => handleOpenView(record)}
              style={{ ...cellTitleStyle, background: "none", border: "none", padding: 0, textAlign: "left", fontFamily: "inherit", width: "100%" }}
              title={val || null}
            >
              {val || null}
            </button>
          ) : (
            <span
              className="kcht-cell-title"
              style={{ ...cellTitleStyle, cursor: "default", width: "100%", display: "inline-block" }}
              title={val || null}
            >
              {val || null}
            </span>
          )}
          <span className="kcht-cell-code" style={{ ...cellSubtitleStyle }}>{record.deviceCode || null}</span>
        </div>
      ),
    },
    {
      key: "seaportName",
      label: "Thuộc cảng biển",
      dataIndex: "seaportName",
      width: 220,
      ellipsis: true,
      render: (val: string) => (val ? <span style={tableMetaStyle}>{val}</span> : null),
    },
    {
      key: "orgUnitName",
      label: "Đơn vị quản lý",
      dataIndex: "orgUnitName",
      width: 260,
      render: (val: string) => (
        <span style={{ ...tableMetaStyle, fontWeight: fontWeightBold }}>{val || null}</span>
      ),
    },
    {
      key: "vtsSystemName",
      label: "Thuộc TTDH VTS/Trạm Radar",
      dataIndex: "attachedInfrastructureName",
      width: 280,
      render: (val: string) => (
        <span style={tableMetaStyle}>{val || null}</span>
      ),
    },
    {
      key: "operatingUnitName",
      label: "Đơn vị khai thác",
      dataIndex: "operatingUnitName",
      width: 260,
      render: (val: string) => (
        <span style={tableMetaStyle}>{val || null}</span>
      ),
    },
    {
      key: "provinceName",
      label: "Địa điểm (Tỉnh/Thành phố)",
      dataIndex: "provinceName",
      width: 220,
      ellipsis: false,
      render: (val: string) => (
        <span style={tableMetaStyle}>{val || null}</span>
      ),
    },
    {
      key: "unitOfMeasure",
      label: "Đơn vị tính",
      dataIndex: "unitOfMeasure",
      width: 130,
      render: (val: number) => (
        <span style={tableMetaStyle}>{val != null ? formatUnitOfMeasure(val) : null}</span>
      ),
    },
    {
      key: "quantity",
      label: "Số lượng",
      dataIndex: "quantity",
      width: 120,
      render: (val: number) => (
        <span style={{ ...tableMetaStyle, fontWeight: fontWeightMedium }}>{val != null ? val : 1}</span>
      ),
    },
    {
      key: "yearOfUse",
      label: "Năm đưa vào sử dụng",
      dataIndex: "yearOfUse",
      width: 220,
      ellipsis: false,
      render: (val: number) => (
        <span style={tableMetaStyle}>{val || null}</span>
      ),
    },
    {
      key: "updatedByName",
      label: "Cán bộ cập nhật",
      dataIndex: "updatedByName",
      width: 200,
      sortable: true,
      sortOrder: sortField === "updatedAt" || sortField === "updatedByName" ? sortOrder : null,
      render: (_: unknown, record: VhfResponse) => renderInfoStack(record.updatedByName, record.updatedAt),
    },
    {
      key: "submittedInfo",
      label: "Cán bộ gửi phê duyệt",
      dataIndex: "submittedByName",
      width: 230,
      render: (_: unknown, record: VhfResponse) => renderInfoStack(record.submittedByName, record.submittedDate),
    },
    {
      key: "approvedLevel1Info",
      label: "Cán bộ phê duyệt cấp Cảng vụ/Chi cục",
      dataIndex: "approverLevel1Name",
      width: 380,
      render: (_: unknown, record: VhfResponse) => renderInfoStack(record.approverLevel1Name, record.approvedDateLevel1),
    },
    {
      key: "approvedLevel2Info",
      label: "Cán bộ phê duyệt cấp Cục",
      dataIndex: "approverLevel2Name",
      width: 270,
      render: (_: unknown, record: VhfResponse) => renderInfoStack(record.approverLevel2Name, record.approvedDateLevel2),
    },
    {
      key: "operationalStatus",
      label: "Tình trạng",
      dataIndex: "operationalStatus",
      width: 270,
      type: "status" as const,
      render: (val: number | string) => {
        const num = typeof val === 'number' ? val : (val === 'OPERATIONAL' || val === '1' ? 1 : val === 'SUSPENDED' || val === '2' ? 2 : 0);
        const badge = operationalStatusBadge(num);
        return (
          <span className="kcht-cell-badge" style={statusBadgeStyle(badge.color)}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: "approvalStatus",
      label: "Trạng thái",
      dataIndex: "approvalStatus",
      width: 180,
      type: "status" as const,
      render: (val: string, record: VhfResponse) => renderApprovalBadge(val, record),
    },
  ], [page, pageSize, sortField, sortOrder, handleOpenView]);

  // ── Row Actions chuẩn /cctv ──
  const handleOpenHistory = useCallback((record: VhfResponse) => {
    if (!hasPerm?.("vhf:history") && !hasPerm?.("vhf:read") && !hasPerm?.("data:read")) {
      toast.error("Bạn không có quyền xem lịch sử thay đổi");
      return;
    }
    setSelectedRecord(record);
    setHistoryEntityName(record.deviceName || '');
    setHistoryModalVisible(true);
    setHistoryRecords([]);
    setLoadingHistory(false);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistorySearch('');
    setHistorySearchInput('');
    setHistoryDateFrom('');
    setHistoryDateTo('');
    setHistoryPage(0);
  }, [hasPerm]);

  const rowActions = useCallback((record: VhfResponse) => {
    const actions: any[] = [];

    actions.push({
      key: "view",
      label: "Xem chi tiết",
      icon: icons.view,
      onClick: () => handleOpenView(record),
    });

    if (isVhfDeleted(record)) {
      if (hasPerm?.("vhf:history") || hasPerm?.("vhf:read") || hasPerm?.("data:read")) {
        actions.push({
          key: "history",
          label: "Lịch sử",
          icon: icons.history,
          onClick: () => handleOpenHistory(record),
        });
      }
      return actions;
    }

    if (hasPerm?.("vhf:update")) {
      actions.push({
        key: "edit",
        label: "Chỉnh sửa",
        icon: icons.edit,
        onClick: () => handleOpenEdit(record),
      });
    }

    if (hasPerm?.("vhf:history") || hasPerm?.("vhf:read") || hasPerm?.("data:read")) {
      actions.push({
        key: "history",
        label: "Lịch sử",
        icon: icons.history,
        onClick: () => handleOpenHistory(record),
      });
    }

    if (
      hasPerm?.("vhf:update") &&
      (record.approvalStatus === "DRAFT" ||
        record.approvalStatus === "REJECTED_LEVEL1" ||
        record.approvalStatus === "REJECTED_LEVEL2")
    ) {
      actions.push({
        key: "submit",
        label: "Gửi Cảng vụ phê duyệt",
        icon: icons.submit,
        onClick: () => {
          setSubmittingRecord(record);
          setSubmitModalOpen(true);
        },
      });
    }

    if (
      (hasPerm?.("vhf:approvec1") || hasPerm?.("vhf:approve")) &&
      record.approvalStatus === "PENDING_APPROVAL"
    ) {
      actions.push({
        key: "approveC1",
        label: "Cảng vụ phê duyệt",
        icon: icons.approve,
        onClick: () => {
          setApprovingRecord(record);
          setApproveModalOpen(true);
        },
      });
      actions.push({
        key: "rejectC1",
        label: "Từ chối",
        icon: icons.reject,
        danger: true,
        onClick: () => openRejectModal(record),
      });
    }

    if (
      (hasPerm?.("vhf:approvec2") || hasPerm?.("vhf:approve")) &&
      record.approvalStatus === "APPROVED_LEVEL1"
    ) {
      actions.push({
        key: "approveC2",
        label: "Cục phê duyệt",
        icon: icons.approve,
        onClick: () => {
          setApprovingRecord(record);
          setApproveModalOpen(true);
        },
      });
      actions.push({
        key: "rejectC2",
        label: "Từ chối",
        icon: icons.reject,
        danger: true,
        onClick: () => openRejectModal(record),
      });
    }

    if (hasPerm?.("vhf:delete") && record.approvalStatus === "DRAFT") {
      actions.push({
        key: "delete",
        label: "Xóa",
        icon: icons.delete,
        danger: true,
        onClick: () => openDeleteModal(record),
      });
    }

    return actions;
  }, [hasPerm, handleOpenView, handleOpenEdit, handleOpenHistory, openDeleteModal, openRejectModal]);

  const CHK_FILTER_LABEL = { ...themeTokenChk.filterLabelStyle, fontSize: 13.5 };

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5, filterLabelStyle: CHK_FILTER_LABEL }}>
      <div className="vhf-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <style>{`
          /* ── Cỡ chữ 13.5px chuẩn: Header bảng + Giá trị các cột trong bảng ── */
          .vhf-page-wrapper,
          .vhf-page-wrapper .ant-input,
          .vhf-page-wrapper .ant-select,
          .vhf-page-wrapper .ant-picker,
          .vhf-page-wrapper .ant-btn,
          .vhf-page-wrapper .ant-pagination,
          .vhf-page-wrapper .ant-table,
          .vhf-page-wrapper .ant-table-cell,
          .vhf-page-wrapper .ant-table-thead > tr > th,
          .vhf-page-wrapper .ant-table-tbody > tr > td,
          .vhf-page-wrapper .ant-table-thead > tr > th *,
          .vhf-page-wrapper .ant-table-thead > tr > th .ant-table-column-title,
          .vhf-page-wrapper .ant-table-thead > tr > th .ant-table-column-sorters,
          .vhf-page-wrapper .ant-table-tbody > tr > td *,
          .vhf-page-wrapper .list-view-table .ant-table-cell,
          .vhf-page-wrapper .list-view-table .ant-table-thead > tr > th,
          .vhf-page-wrapper .list-view-table .ant-table-tbody > tr > td,
          .vhf-page-wrapper .list-view-table .ant-table-thead > tr > th *,
          .vhf-page-wrapper .list-view-table .ant-table-tbody > tr > td * {
            font-size: 13.5px !important;
          }

          .vhf-page-wrapper.vhf-page-wrapper .ant-table-cell,
          .vhf-page-wrapper.vhf-page-wrapper .ant-table-thead > tr > th,
          .vhf-page-wrapper.vhf-page-wrapper .ant-table-tbody > tr > td,
          .vhf-page-wrapper.vhf-page-wrapper .ant-table-thead > tr > th *,
          .vhf-page-wrapper.vhf-page-wrapper .ant-table-tbody > tr > td * {
            font-size: 13.5px !important;
          }

          /* ── Ngoại lệ theo yêu cầu: Tên / Mã thiết bị, Tình trạng, Trạng thái ── */
          .vhf-page-wrapper.vhf-page-wrapper .ant-table-row .kcht-cell-title.kcht-cell-title,
          .vhf-page-wrapper.vhf-page-wrapper .ant-table-row .kcht-cell-title *,
          .vhf-page-wrapper.vhf-page-wrapper button.kcht-cell-title,
          .vhf-page-wrapper.vhf-page-wrapper span.kcht-cell-title {
            font-size: 14px !important;
          }
          .vhf-page-wrapper.vhf-page-wrapper .kcht-cell-code,
          .vhf-page-wrapper.vhf-page-wrapper .kcht-cell-code * {
            font-size: 12px !important;
          }
          .vhf-page-wrapper.vhf-page-wrapper .kcht-cell-badge,
          .vhf-page-wrapper.vhf-page-wrapper .kcht-cell-badge *,
          .vhf-page-wrapper.vhf-page-wrapper .ant-table-row .kcht-cell-badge,
          .vhf-page-wrapper.vhf-page-wrapper .ant-table-row .kcht-cell-badge * {
            font-size: 13px !important;
          }
          .vhf-page-wrapper.vhf-page-wrapper button[aria-pressed] span {
            font-size: 13px !important;
          }
          .vhf-page-wrapper .list-view-table .ant-table-cell {
            padding-block: 8.5px !important;
          }

          /* Thu nhỏ icon DropdownList (mũi tên xổ + nút xóa) về kích thước compact chuẩn /cctv */
          .vhf-page-wrapper .ant-select .ant-select-suffix,
          .vhf-page-wrapper .ant-select .ant-select-clear,
          .vhf-page-wrapper .ant-tree-select .ant-select-suffix,
          .vhf-page-wrapper .ant-tree-select .ant-select-clear {
            font-size: 10px !important;
            line-height: 1 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .vhf-page-wrapper .ant-select .ant-select-suffix .anticon,
          .vhf-page-wrapper .ant-select .ant-select-clear .anticon,
          .vhf-page-wrapper .ant-tree-select .ant-select-suffix .anticon,
          .vhf-page-wrapper .ant-tree-select .ant-select-clear .anticon {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            line-height: 1 !important;
          }
          .vhf-page-wrapper .ant-select .ant-select-suffix svg,
          .vhf-page-wrapper .ant-select .ant-select-clear svg,
          .vhf-page-wrapper .ant-tree-select .ant-select-suffix svg,
          .vhf-page-wrapper .ant-tree-select .ant-select-clear svg {
            font-size: 10px !important;
            width: 10px !important;
            height: 10px !important;
            display: block !important;
          }

          /* ── Drawer Xem chi tiết chuẩn /cctv (/berth) ── */
          .vhf-drawer-scope.vhf-drawer-scope .chk-detail-row,
          .vhf-page-wrapper.vhf-page-wrapper .chk-detail-row { border-bottom: 1px solid #f1f5f9 !important; }
          .vhf-drawer-scope.vhf-drawer-scope .vhf-section-card-title,
          .vhf-page-wrapper.vhf-page-wrapper .vhf-section-card-title { font-size: 14px !important; }
          .vhf-drawer-scope .anticon-down,
          .vhf-drawer-scope .anticon-right {
            font-size: 12px !important;
          }
          .vhf-drawer-scope .anticon-down svg,
          .vhf-drawer-scope .anticon-right svg {
            width: 12px !important;
            height: 12px !important;
          }
          .vhf-drawer-scope.vhf-drawer-scope .ant-drawer-title span { font-size: 15px !important; }
          .vhf-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }

          /* ── Modal Scope chuẩn /berth ── */
          .vhf-modal-scope,
          .vhf-modal-scope .ant-modal-content,
          .vhf-modal-scope .ant-btn,
          .vhf-modal-scope .ant-input {
            font-size: 13.5px !important;
          }

          /* ── Grid 2 cột & nhãn đồng bộ chuẩn /berth (BerthDetailContent) ── */
          .vhf-drawer-scope .chk-detail-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
            column-gap: 28px !important;
            row-gap: 0 !important;
          }
          .vhf-drawer-scope .chk-detail-row {
            display: flex !important;
            align-items: flex-start !important;
            min-height: 36px !important;
            padding: 7px 0 !important;
            border-bottom: 1px solid #f1f5f9 !important;
            line-height: 1.5 !important;
            gap: 10px !important;
          }
          .vhf-drawer-scope .chk-detail-row:last-child {
            border-bottom: none !important;
          }
          .vhf-drawer-scope .chk-detail-row--full {
            grid-column: 1 / -1 !important;
          }
          .vhf-drawer-scope .chk-detail-row .chk-detail-label,
          .vhf-drawer-scope .chk-detail-label {
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
          .vhf-drawer-scope .chk-detail-row .sec-col1-label,
          .vhf-drawer-scope .sec-col1-label {
            width: 215px !important;
            min-width: 215px !important;
            max-width: 215px !important;
            flex-shrink: 0 !important;
          }
          .vhf-drawer-scope .chk-detail-row .sec-col2-label,
          .vhf-drawer-scope .sec-col2-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
            flex-shrink: 0 !important;
          }
          .vhf-drawer-scope .chk-detail-row .sec-full-label,
          .vhf-drawer-scope .sec-full-label {
            width: 215px !important;
            min-width: 215px !important;
            max-width: 215px !important;
            flex-shrink: 0 !important;
          }
          .vhf-drawer-scope .chk-detail-label::after {
            content: ':' !important;
            margin-left: 1px !important;
            margin-right: 4px !important;
          }
          .vhf-drawer-scope .chk-detail-value {
            color: #1e293b !important;
            font-size: 13.5px !important;
            flex: 1 !important;
            min-width: 0 !important;
            text-align: left !important;
            line-height: 1.5 !important;
            word-break: break-word !important;
          }
          @media (max-width: 960px) {
            .vhf-drawer-scope .chk-detail-grid {
              grid-template-columns: 1fr !important;
              column-gap: 0 !important;
            }
            .vhf-drawer-scope .chk-detail-row--full {
              grid-column: 1 !important;
            }
            .vhf-drawer-scope .chk-detail-row .chk-detail-label,
            .vhf-drawer-scope .chk-detail-label,
            .vhf-drawer-scope .sec-col1-label,
            .vhf-drawer-scope .sec-col2-label,
            .vhf-drawer-scope .sec-full-label {
              width: 250px !important;
              min-width: 250px !important;
              max-width: 250px !important;
            }
          }
          @media (max-width: 640px) {
            .vhf-drawer-scope .chk-detail-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 3px !important;
              padding: 6px 0 !important;
            }
            .vhf-drawer-scope .chk-detail-row .chk-detail-label,
            .vhf-drawer-scope .chk-detail-label,
            .vhf-drawer-scope .sec-col1-label,
            .vhf-drawer-scope .sec-col2-label,
            .vhf-drawer-scope .sec-full-label {
              width: 100% !important;
              min-width: 100% !important;
              max-width: 100% !important;
            }
            .vhf-drawer-scope .chk-detail-value {
              width: 100% !important;
            }
          }
        `}</style>

        <ScreenHeader
          breadcrumb={[
            { label: "Trang chủ", path: "/" },
            { label: "Luồng hàng hải", path: "/navigation-channel" },
            { label: "Quản lý hệ thống thông tin liên lạc VHF", path: "/vhf" },
          ]}
          actions={[
            hasPerm?.("vhf:create")
              ? {
                  key: "create",
                  label: "Thêm mới",
                  icon: <PlusOutlined />,
                  variant: "primary" as const,
                  onClick: handleOpenCreate,
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
          error={Boolean(isError)}
          errorMessage={isError || undefined}
          onRetry={fetchData}
          filterContent={
            <>
              <SidebarFilterField
                style={{ marginTop: 12 }}
                labelGap={spaceSm}
                label={<span>Đơn vị quản lý <span style={{ color: statusCritical }}>*</span></span>}
              >
                <OrgUnitTreeSelect
                  organizations={orgUnits}
                  placeholder="Chọn đơn vị..."
                  allowClear
                  showPath
                  allLabel="Tất cả"
                  treeDefaultExpandAll={false}
                  showSearch
                  value={filterValues.orgUnitId || undefined}
                  onChange={(val) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: (val as string) || "" }));
                    setPage(0);
                  }}
                  loading={loadingOrgs}
                  style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Thuộc cảng biển" labelGap={spaceSm}>
                <Select
                  placeholder="Chọn cảng biển"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  value={filterValues.seaportId || undefined}
                  onChange={(val) => setFilterValues((prev) => ({ ...prev, seaportId: (val as string) || "" }))}
                  options={seaportOptions.map((p) => ({ label: p.portCode ? `${p.portCode} - ${p.portName}` : p.portName, value: p.id }))}
                  style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tên thiết bị" labelGap={spaceSm}>
                <Input
                  placeholder="Tìm theo tên thiết bị..."
                  allowClear
                  value={filterValues.deviceName || ""}
                  onChange={(e) => setFilterValues((prev) => ({ ...prev, deviceName: e.target.value }))}
                  onPressEnter={handleFilterApply}
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </SidebarFilterField>

              {filterCollapsed && (
                <>
                  <SidebarFilterField label="Mã thiết bị" labelGap={spaceSm}>
                    <Input
                      placeholder="Tìm theo mã thiết bị..."
                      allowClear
                      value={filterValues.deviceCode || ""}
                      onChange={(e) => setFilterValues((prev) => ({ ...prev, deviceCode: e.target.value }))}
                      onPressEnter={handleFilterApply}
                      style={{ borderRadius: radiusPill, height: 40 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Tình trạng" labelGap={spaceSm}>
                    <Select
                      placeholder="Chọn tình trạng"
                      allowClear
                      value={filterValues.operationalStatus || undefined}
                      onChange={(val) => setFilterValues((prev) => ({ ...prev, operationalStatus: val as number | undefined }))}
                      options={OPERATIONAL_STATUS_OPTIONS}
                      style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Thuộc loại hạ tầng" labelGap={spaceSm}>
                    <Select
                      placeholder="Chọn loại hạ tầng"
                      allowClear
                      value={filterValues.attachedInfraType || undefined}
                      onChange={(val) => {
                        setFilterValues((prev) => ({
                          ...prev,
                          attachedInfraType: val as number | undefined,
                          attachedInfraId: "",
                        }));
                      }}
                      options={ATTACHED_INFRA_TYPE_OPTIONS}
                      style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Thuộc hạ tầng" labelGap={spaceSm}>
                    <Select
                      placeholder={
                        filterValues.attachedInfraType === 2
                          ? "Chọn trạm Radar"
                          : filterValues.attachedInfraType === 1
                            ? "Chọn Trung Tâm Điều Hành VTS"
                            : "Chọn loại hạ tầng trước"
                      }
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      value={filterValues.attachedInfraId || undefined}
                      onChange={(val) =>
                        setFilterValues((prev) => ({
                          ...prev,
                          attachedInfraId: (val as string) ?? "",
                        }))
                      }
                      options={
                        filterValues.attachedInfraType === 1
                          ? vtsOperationCenterOptions
                          : filterValues.attachedInfraType === 2
                            ? radarStationOptions
                            : []
                      }
                      loading={
                        filterValues.attachedInfraType === 1
                          ? loadingVtsCenters
                          : filterValues.attachedInfraType === 2
                            ? loadingRadars
                            : false
                      }
                      disabled={filterValues.attachedInfraType !== 1 && filterValues.attachedInfraType !== 2}
                      style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Năm đưa vào sử dụng" labelGap={spaceSm}>
                    <DatePicker
                      picker="year"
                      {...getSidebarDatePickerProps({
                        picker: 'year',
                        placeholder: 'Chọn năm',
                        format: 'YYYY',
                        allowClear: true,
                        value: filterValues.yearOfUse ? dayjs(String(filterValues.yearOfUse), 'YYYY') : null,
                        onChange: (d: any) => setFilterValues((prev) => ({ ...prev, yearOfUse: d ? d.year() : undefined })),
                      })}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Ngày cập nhật" labelGap={spaceSm}>
                    <DatePicker.RangePicker
                      {...getRangePickerProps()}
                      style={{ width: "100%" }}
                      value={filterValues.updatedFrom && filterValues.updatedTo ? [dayjs(filterValues.updatedFrom), dayjs(filterValues.updatedTo)] : null}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          setFilterValues((prev) => ({
                            ...prev,
                            updatedFrom: dates[0]!.startOf('day').toISOString(),
                            updatedTo: dates[1]!.endOf('day').toISOString(),
                          }));
                        } else {
                          setFilterValues((prev) => ({ ...prev, updatedFrom: "", updatedTo: "" }));
                        }
                      }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Địa điểm (Tỉnh/Thành phố)" labelGap={spaceSm}>
                    <Select
                      placeholder="Chọn Tỉnh/Thành phố"
                      allowClear
                      showSearch
                      value={filterValues.province || undefined}
                      onChange={(val) => setFilterValues((prev) => ({ ...prev, province: val as string || "" }))}
                      options={VIETNAM_PROVINCES.map((p) => ({ label: p, value: p }))}
                      style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                    />
                  </SidebarFilterField>
                </>
              )}
            </>
          }
          statusTabs={[
            {
              key: "all",
              label: "Tất cả",
              count: totalAll || 0,
              color: actionPrimary,
              active: !filterValues.approvalStatus,
            },
            {
              key: "DRAFT",
              label: "Lưu tạm",
              count: tabCounts["DRAFT"] ?? 0,
              color: statusDraft,
              active: filterValues.approvalStatus === "DRAFT",
            },
            {
              key: "PENDING_APPROVAL",
              label: "Chờ phê duyệt cấp Cảng vụ/Chi cục",
              count: tabCounts["PENDING_APPROVAL"] ?? 0,
              color: statusAttention,
              active: filterValues.approvalStatus === "PENDING_APPROVAL",
            },
            {
              key: "APPROVED_LEVEL1",
              label: "Chờ phê duyệt cấp cục",
              count: tabCounts["APPROVED_LEVEL1"] ?? 0,
              color: statusInfo,
              active: filterValues.approvalStatus === "APPROVED_LEVEL1",
            },
            {
              key: "APPROVED",
              label: "Đã phê duyệt",
              count: tabCounts["APPROVED"] ?? 0,
              color: statusOperational,
              active: filterValues.approvalStatus === "APPROVED",
            },
            {
              key: "REJECTED_LEVEL1",
              label: "Từ chối cấp Cảng vụ/Chi cục",
              count: tabCounts["REJECTED_LEVEL1"] ?? 0,
              color: statusCritical,
              active: filterValues.approvalStatus === "REJECTED_LEVEL1",
            },
            {
              key: "REJECTED_LEVEL2",
              label: "Từ chối cấp cục",
              count: tabCounts["REJECTED_LEVEL2"] ?? 0,
              color: statusCritical,
              active: filterValues.approvalStatus === "REJECTED_LEVEL2",
            },
            {
              key: "DELETED",
              label: "Đã xóa",
              count: tabCounts["DELETED"] ?? 0,
              color: statusCritical,
              active: filterValues.approvalStatus === "DELETED",
            },
          ]}
          onStatusTabChange={(key) => {
            const approvalStatus = key === "all" ? "" : key;
            setFilterValues((prev) => ({ ...prev, approvalStatus }));
            setPage(0);
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <DataTable
              fill
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 'max-content' }}
              onSort={handleSort}
              rowActions={rowActions}
            />
            <div style={{ height: 6, flexShrink: 0 }} />
            <Pagination
              current={page + 1}
              total={total}
              pageSize={pageSize}
              onChange={(p, ps) => {
                setPageSize(ps);
                setPage(Math.max(p - 1, 0));
              }}
            />
          </div>
        </FilterTableLayout>

        {/* ── Create Drawer ─────────────────────────────── */}
        <AppDrawer
          width="min(920px, 96vw)"
          rootClassName="vhf-drawer-scope"
          className="vhf-drawer-scope"
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Thêm mới hệ thống thông tin liên lạc VHF
            </span>
          }
          open={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            createForm.resetFields();
          }}
          footer={
            <div style={drawerFooterStyle}>
              <Button
                onClick={() => {
                  actionTypeRef.current = 'draft';
                  setActionType('draft');
                  vhfFormRef.current?.submit('DRAFT');
                }}
                loading={submitting && actionType === 'draft'}
                style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Lưu tạm
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  actionTypeRef.current = 'submit';
                  setActionType('submit');
                  vhfFormRef.current?.submit('SUBMIT');
                }}
                loading={submitting && actionType === 'submit'}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Lưu và gửi phê duyệt
              </Button>
              {canSaveAndApprove && (
                <Button
                  type="primary"
                  onClick={() => {
                    actionTypeRef.current = 'approve';
                    setActionType('approve');
                    vhfFormRef.current?.submit('APPROVED');
                  }}
                  loading={submitting && actionType === 'approve'}
                  style={{
                    ...primaryButtonStyle,
                    background: statusOperational,
                    borderColor: statusOperational,
                    borderRadius: radiusPill,
                    height: 40,
                  }}
                >
                  Lưu và phê duyệt
                </Button>
              )}
            </div>
          }
          styles={{
            header: {
              padding: '12px 24px',
              borderBottom: `1px solid ${borderDefault}`,
              flexShrink: 0,
            },
            body: { padding: '0 24px 12px 24px' },
          }}
          destroyOnClose
        >
          <style>{requiredMarkStyle}</style>
          {createModalOpen && (
            <Form form={createForm} layout="vertical" initialValues={{}}>
              <VhfForm
                ref={vhfFormRef}
                form={createForm}
                onFinish={() => {
                  setCreateModalOpen(false);
                  createForm.resetFields();
                  fetchData();
                  fetchTabCounts();
                }}
                onSubmittingChange={setSubmitting}
              />
            </Form>
          )}
        </AppDrawer>

        {/* ── Edit Drawer ───────────────────────────────── */}
        <AppDrawer
          width="min(920px, 96vw)"
          rootClassName="vhf-drawer-scope"
          className="vhf-drawer-scope"
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Chỉnh sửa thông tin — {updateTarget?.deviceName || 'Hệ thống thông tin liên lạc VHF'}
            </span>
          }
          open={updateModalOpen}
          onClose={() => {
            setUpdateModalOpen(false);
            setUpdateTarget(null);
            updateForm.resetFields();
          }}
          footer={
            <div style={drawerFooterStyle}>
              {updateTarget?.approvalStatus !== 'APPROVED' && (
                <Button
                  onClick={() => {
                    actionTypeRef.current = 'draft';
                    setActionType('draft');
                    editVhfFormRef.current?.submit('DRAFT');
                  }}
                  loading={submitting && actionType === 'draft'}
                  style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
                >
                  Lưu tạm
                </Button>
              )}
              {(updateTarget?.approvalStatus === 'DRAFT' ||
                updateTarget?.approvalStatus === 'REJECTED_LEVEL1' ||
                updateTarget?.approvalStatus === 'REJECTED_LEVEL2') && (
                <Button
                  type="primary"
                  onClick={() => {
                    actionTypeRef.current = 'submit';
                    setActionType('submit');
                    editVhfFormRef.current?.submit('SUBMIT');
                  }}
                  loading={submitting && actionType === 'submit'}
                  style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
                >
                  Lưu và gửi phê duyệt
                </Button>
              )}
              {updateTarget?.approvalStatus === 'APPROVED' && canSaveAndApprove && (
                <Button
                  type="primary"
                  onClick={() => {
                    actionTypeRef.current = 'approve';
                    setActionType('approve');
                    editVhfFormRef.current?.submit('APPROVED');
                  }}
                  loading={submitting && actionType === 'approve'}
                  style={{
                    ...primaryButtonStyle,
                    background: statusOperational,
                    borderColor: statusOperational,
                    borderRadius: radiusPill,
                    height: 40,
                  }}
                >
                  Lưu và phê duyệt
                </Button>
              )}
            </div>
          }
          styles={{
            header: {
              padding: '12px 24px',
              borderBottom: `1px solid ${borderDefault}`,
              flexShrink: 0,
            },
            body: { padding: '0 24px 12px 24px' },
          }}
          destroyOnClose
        >
          {updateTarget?.id && (
            <>
              <style>{requiredMarkStyle}</style>
              <Form form={updateForm} layout="vertical" initialValues={{}}>
                <VhfForm
                  ref={editVhfFormRef}
                  form={updateForm}
                  id={updateTarget.id}
                  onFinish={() => {
                    setUpdateModalOpen(false);
                    setUpdateTarget(null);
                    fetchData();
                    fetchTabCounts();
                  }}
                  onSubmittingChange={setSubmitting}
                />
              </Form>
            </>
          )}
        </AppDrawer>

        {/* ── DRAWER XEM CHI TIẾT (Đồng bộ 100% chuẩn /cctv) ── */}
        <Drawer
          {...drawerProps}
          size={undefined}
          width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
          style={{ maxWidth: '96vw' }}
          rootClassName={THEME_SCOPE_CLASS}
          className="vhf-drawer-scope"
          title={
            <span style={drawerTitleStyle}>
              Chi tiết hệ thống thông tin liên lạc VHF{selectedRecord ? ` - ${selectedRecord.deviceName || selectedRecord.deviceCode || ''}` : ''}
            </span>
          }
          open={detailDrawerOpen}
          onClose={() => setDetailDrawerOpen(false)}
          extra={
            <Button
              type="text"
              onClick={() => setDetailDrawerOpen(false)}
              style={drawerCloseBtnStyle}
            >
              ✕
            </Button>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
          footer={null}
        >
          {selectedRecord && (
            <Tabs
              defaultActiveKey="general"
              className="port-detail-tabs"
              tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 100, background: surfaceCard }}
              items={[
                {
                  key: "general",
                  label: "Thông tin chung",
                  children: (
                    <div style={{ paddingTop: 6, paddingRight: 4, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                      {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành (header cố định) ── */}
                      <div style={vhfDetailSectionBoxStyle}>
                        <div style={{ ...vhfDetailSectionHeaderStyle, borderBottom: '1px solid #f1f5f9' }}>
                          <div style={vhfDetailSectionTitleStyle}>
                            <BankOutlined style={{ color: actionPrimary }} />
                            <span className="vhf-section-card-title">Thông tin cơ bản & Quản lý vận hành</span>
                          </div>
                        </div>
                        <div className="chk-detail-grid">
                          {(() => {
                            let colIndex = 0;
                            return ([
                              { label: 'Mã thiết bị', value: selectedRecord.deviceCode || null, badge: true },
                              { label: 'Tên thiết bị', value: selectedRecord.deviceName || null, bold: true },
                              { label: 'Đơn vị quản lý', value: selectedRecord.orgUnitName || null, bold: true },
                              { label: 'Thuộc cảng biển', value: selectedRecord.seaportName || null },
                              { label: 'Thuộc TTDH VTS / Trạm Radar', value: selectedRecord.attachedInfrastructureName || null },
                              { label: 'Đơn vị khai thác', value: selectedRecord.operatingUnitName || null },
                              { label: 'Tỉnh / Thành phố', value: selectedRecord.provinceName || null },
                              {
                                label: 'Tình trạng',
                                value: (() => {
                                  if (selectedRecord.operationalStatus == null) return null;
                                  const num = typeof selectedRecord.operationalStatus === 'number'
                                    ? selectedRecord.operationalStatus
                                    : (selectedRecord.operationalStatus === 'OPERATIONAL' || selectedRecord.operationalStatus === '1' ? 1 : selectedRecord.operationalStatus === 'SUSPENDED' || selectedRecord.operationalStatus === '2' ? 2 : 0);
                                  const badge = operationalStatusBadge(num);
                                  return (
                                    <span className="kcht-cell-badge" style={statusBadgeStyle(badge.color)}>
                                      {badge.label}
                                    </span>
                                  );
                                })(),
                              },
                              { label: 'Vị trí chi tiết', value: selectedRecord.detailedLocation || null, fullWidth: true },
                            ] as Array<{ label: string; value: React.ReactNode; badge?: boolean; bold?: boolean; fullWidth?: boolean }>).map((row) => {
                              let labelCls: string;
                              if (row.fullWidth) {
                                labelCls = 'sec-full-label';
                                colIndex = 0;
                              } else {
                                labelCls = colIndex % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label';
                                colIndex += 1;
                              }
                              return (
                                <div key={row.label} className={row.fullWidth ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
                                  <span className={`chk-detail-label ${labelCls}`}>{row.label}</span>
                                  <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', ...(row.bold ? { fontWeight: fontWeightBold } : undefined) }}>
                                    {row.badge && row.value ? (
                                      <span style={statusBadgeStyle(actionPrimary)}>{row.value}</span>
                                    ) : row.value}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* ── Section 2: Thông số kỹ thuật (header bấm để đóng/mở) ── */}
                      <div style={{ ...vhfDetailSectionBoxStyle, padding: detailsSpecsOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                        <div
                          onClick={() => setDetailsSpecsOpen(o => !o)}
                          style={{
                            ...vhfDetailSectionHeaderStyle,
                            marginBottom: detailsSpecsOpen ? 10 : 0,
                            paddingBottom: detailsSpecsOpen ? 8 : 0,
                            borderBottom: detailsSpecsOpen ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          <div style={vhfDetailSectionTitleStyle}>
                            <SlidersOutlined style={{ color: actionPrimary }} />
                            <span className="vhf-section-card-title">Thông số kỹ thuật</span>
                          </div>
                          <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                            {detailsSpecsOpen ? <DownOutlined /> : <RightOutlined />}
                          </span>
                        </div>
                        {detailsSpecsOpen && (
                          <div className="chk-detail-grid">
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col1-label">Model</span>
                              <span className="chk-detail-value">{selectedRecord.model || ''}</span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col2-label">Hãng sản xuất</span>
                              <span className="chk-detail-value">{selectedRecord.manufacturer || ''}</span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col1-label">Đơn vị tính</span>
                              <span className="chk-detail-value">
                                {formatUnitOfMeasure(selectedRecord.unitOfMeasure)}
                              </span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col2-label">Số lượng</span>
                              <span className="chk-detail-value">
                                {selectedRecord.quantity != null ? <span style={{ color: textPrimary, fontSize: fontSizeMd }}>{fmtNum(selectedRecord.quantity)}</span> : ''}
                              </span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col1-label">Năm đưa vào sử dụng</span>
                              <span className="chk-detail-value">{selectedRecord.yearOfUse ? String(selectedRecord.yearOfUse) : ''}</span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col2-label" style={{ visibility: 'hidden' }}>Trống</span>
                              <span className="chk-detail-value" />
                            </div>
                            <div className="chk-detail-row chk-detail-row--full">
                              <span className="chk-detail-label sec-col1-label">Thông số kỹ thuật</span>
                              <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedRecord.specifications || ''}</span>
                            </div>
                            <div className="chk-detail-row chk-detail-row--full">
                              <span className="chk-detail-label sec-col1-label">Thông tin bảo trì</span>
                              <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedRecord.maintenanceInformation || ''}</span>
                            </div>
                            <div className="chk-detail-row chk-detail-row--full">
                              <span className="chk-detail-label sec-col1-label">Ghi chú</span>
                              <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedRecord.note || ''}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Section 3: Thông tin phê duyệt (header bấm để đóng/mở) ── */}
                      <div style={{ ...vhfDetailSectionBoxStyle, padding: detailApprovalOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                        <div
                          onClick={() => setDetailApprovalOpen(o => !o)}
                          style={{
                            ...vhfDetailSectionHeaderStyle,
                            marginBottom: detailApprovalOpen ? 10 : 0,
                            paddingBottom: detailApprovalOpen ? 8 : 0,
                            borderBottom: detailApprovalOpen ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          <div style={vhfDetailSectionTitleStyle}>
                            <AuditOutlined style={{ color: actionPrimary }} />
                            <span className="vhf-section-card-title">Thông tin phê duyệt</span>
                          </div>
                          <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                            {detailApprovalOpen ? <DownOutlined /> : <RightOutlined />}
                          </span>
                        </div>
                        {detailApprovalOpen && (
                          <div className="chk-detail-grid">
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col1-label">Trạng thái phê duyệt</span>
                              <span className="chk-detail-value">
                                {renderApprovalBadge(selectedRecord.approvalStatus, selectedRecord)}
                              </span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col2-label">Cán bộ cập nhật</span>
                              <span className="chk-detail-value">
                                {selectedRecord.updatedByName ? (
                                  <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.updatedByName}</span>
                                ) : ''}
                              </span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col1-label">Cán bộ gửi phê duyệt</span>
                              <span className="chk-detail-value">
                                {selectedRecord.submittedByName ? (
                                  <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.submittedByName}</span>
                                ) : ''}
                              </span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col2-label">Ngày gửi phê duyệt</span>
                              <span className="chk-detail-value">{selectedRecord.submittedDate ? formatDate(selectedRecord.submittedDate) : ''}</span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
                              <span className="chk-detail-value">
                                {selectedRecord.approverLevel1Name ? (
                                  <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.approverLevel1Name}</span>
                                ) : ''}
                              </span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
                              <span className="chk-detail-value">{selectedRecord.approvedDateLevel1 ? formatDate(selectedRecord.approvedDateLevel1) : ''}</span>
                            </div>
                            <div className="chk-detail-row chk-detail-row--full">
                              <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cảng vụ/Chi cục</span>
                              <span className="chk-detail-value">{selectedRecord.approvalContentLevel1 || ''}</span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cục</span>
                              <span className="chk-detail-value">
                                {selectedRecord.approverLevel2Name ? (
                                  <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.approverLevel2Name}</span>
                                ) : ''}
                              </span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cục</span>
                              <span className="chk-detail-value">{selectedRecord.approvedDateLevel2 ? formatDate(selectedRecord.approvedDateLevel2) : ''}</span>
                            </div>
                            <div className="chk-detail-row chk-detail-row--full">
                              <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cục</span>
                              <span className="chk-detail-value">{selectedRecord.approvalContentLevel2 || ''}</span>
                            </div>
                            {selectedRecord.rejectionReason && String(selectedRecord.approvalStatus).toUpperCase().indexOf('REJECT') >= 0 && (
                              <div className="chk-detail-row chk-detail-row--full">
                                <span className="chk-detail-label sec-col1-label">Lý do từ chối</span>
                                <span className="chk-detail-value" style={{ color: statusCritical }}>{selectedRecord.rejectionReason}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "gis",
                  label: `Thông tin vị trí (${parseWktToCoordinates(selectedRecord.coordinates || '').length})`,
                  children: (
                    <div style={{ paddingTop: 6, paddingRight: 0, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                      <div style={vhfDetailSectionBoxStyle}>
                        <style>{`
                          .vhf-drawer-scope .gis-meta-detail.chk-detail-grid,
                          .gis-meta-detail.chk-detail-grid {
                            display: grid !important;
                            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
                            column-gap: 28px !important;
                            row-gap: 0 !important;
                          }
                          .vhf-drawer-scope .gis-meta-detail .chk-detail-row,
                          .gis-meta-detail .chk-detail-row {
                            display: flex !important;
                            align-items: flex-start !important;
                            min-height: 36px !important;
                            padding: 7px 0 !important;
                            border-bottom: 1px solid #f1f5f9 !important;
                            line-height: 1.5 !important;
                            gap: 10px !important;
                          }
                          .vhf-drawer-scope .gis-meta-detail .chk-detail-row:last-child,
                          .gis-meta-detail .chk-detail-row:last-child {
                            border-bottom: none !important;
                          }
                          .vhf-drawer-scope .gis-meta-detail .chk-detail-label,
                          .gis-meta-detail .chk-detail-label {
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
                          .vhf-drawer-scope .gis-meta-detail .sec-col1-label,
                          .gis-meta-detail .sec-col1-label {
                            width: 215px !important;
                            min-width: 215px !important;
                            max-width: 215px !important;
                            flex-shrink: 0 !important;
                          }
                          .vhf-drawer-scope .gis-meta-detail .sec-col2-label,
                          .gis-meta-detail .sec-col2-label {
                            width: 250px !important;
                            min-width: 250px !important;
                            max-width: 250px !important;
                            flex-shrink: 0 !important;
                          }
                          .vhf-drawer-scope .gis-meta-detail .chk-detail-label::after,
                          .gis-meta-detail .chk-detail-label::after {
                            content: ':' !important;
                            margin-left: 1px !important;
                            margin-right: 4px !important;
                          }
                          .vhf-drawer-scope .gis-meta-detail .chk-detail-value,
                          .gis-meta-detail .chk-detail-value {
                            color: #1e293b !important;
                            font-size: 13.5px !important;
                            flex: 1 !important;
                            min-width: 0 !important;
                            text-align: left !important;
                            line-height: 1.5 !important;
                            word-break: break-word !important;
                          }
                        `}</style>
                        <div className="chk-detail-grid gis-meta-detail">
                          {[
                            {
                              label: 'Loại đối tượng',
                              value: (({ POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' } as Record<string, string>)[selectedRecord.geometryType || '']) || null,
                            },
                            {
                              label: 'Biểu tượng',
                              value: (() => {
                                const symId = selectedRecord.mapSymbolId || '';
                                const symName =
                                  selectedRecord.mapSymbolName ||
                                  (symId ? symbolMap.get(symId) : '') ||
                                  '';
                                const symImg = symId ? symbolImageMap.get(symId) : undefined;
                                if (!symImg && !symName) return null;
                                return (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    {symImg ? <img src={symImg} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : null}
                                    {symName || null}
                                  </span>
                                );
                              })(),
                            },
                            {
                              label: 'Hệ quy chiếu',
                              value: selectedRecord.coordinateSystem === 1 ? 'WGS-84' : selectedRecord.coordinateSystem === 2 ? 'VN-2000' : (selectedRecord.coordinateSystem ? String(selectedRecord.coordinateSystem) : ''),
                            },
                            {
                              label: 'Quy tắc hiển thị',
                              value: selectedRecord.geometryType || selectedRecord.coordinates ? 'Độ, phút, giây (DMS)' : '',
                            },
                          ].map((row, i) => (
                            <div key={i} className="chk-detail-row">
                              <span className={`chk-detail-label ${i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{row.label}</span>
                              <span className="chk-detail-value">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>
                          Tọa độ GPS ({parseWktToCoordinates(selectedRecord.coordinates || '').length})
                        </span>
                        <Button
                          icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                          onClick={() => { setGisMapOpen(true); }}
                          style={{
                            ...outlineButtonStyle,
                            height: 32,
                            fontSize: 13.5,
                            padding: '0 14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          Xem vị trí trên bản đồ
                        </Button>
                      </div>
                      <DetailTable
                        scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                        dataSource={parseWktToCoordinates(selectedRecord.coordinates || '')}
                        emptyText="Chưa có tọa độ GPS nào"
                        emptyHeightAuto
                        columns={[
                          { title: 'STT', width: 50 },
                          {
                            title: 'Vĩ độ (Latitude - N)',
                            key: 'lat',
                            render: (_value: unknown, record: { latitude?: number | null; longitude?: number | null }) => {
                              const latitudeValue = record.latitude;
                              if (latitudeValue == null || Number.isNaN(Number(latitudeValue))) return null;
                              const dms = ddToDms(latitudeValue);
                              return `${dms.d}° ${dms.m}' ${dms.s}" N`;
                            },
                          },
                          {
                            title: 'Kinh độ (Longitude - E)',
                            key: 'lng',
                            render: (_value: unknown, record: { latitude?: number | null; longitude?: number | null }) => {
                              const longitudeValue = record.longitude;
                              if (longitudeValue == null || Number.isNaN(Number(longitudeValue))) return null;
                              const dms = ddToDms(longitudeValue);
                              return `${dms.d}° ${dms.m}' ${dms.s}" E`;
                            },
                          },
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: "files",
                  label: `File đính kèm (${attachmentItems.length})`,
                  children: (
                    <div style={{ paddingTop: 6 }} className="vhf-files-table">
                      <style>{`
                        .vhf-files-table.vhf-files-table .anticon { font-size: 16px !important; }
                        .vhf-files-table .ant-table-thead > tr > th {
                          height: 38px !important;
                          box-sizing: border-box !important;
                          border-bottom: 1px solid #f1f5f9 !important;
                          box-shadow: none !important;
                        }
                      `}</style>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 13.5 }}>File đính kèm</span>
                      </div>
                      <InfrastructureAttachmentTab
                        attachments={attachmentItems}
                        readonly
                        readonlyBerthLayout
                        userMap={userMap}
                        loadReadonlyPreviewImage={(attachmentId) => {
                          const targetId = selectedRecord?.id;
                          if (!targetId) return Promise.reject(new Error('Chưa xác định được bản ghi VHF để tải ảnh'));
                          return api.get(`/v1/vhf/${targetId}/attachments/${attachmentId}/download`, { responseType: "blob" })
                            .then((res: any) => new Blob([res.data]));
                        }}
                        onDownload={handleDownloadAttachmentItem}
                      />
                    </div>
                  ),
                },
                {
                  key: "operationMaintenance",
                  label: "Vận hành & bảo trì",
                  children: (
                    <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
                      {/* ── Section 1: Thông tin vận hành khai thác ── */}
                      <div style={{ ...vhfDetailSectionBoxStyle, padding: opRunOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                        <div
                          onClick={() => setOpRunOpen(!opRunOpen)}
                          style={{
                            ...vhfDetailSectionHeaderStyle,
                            marginBottom: opRunOpen ? 12 : 0,
                            paddingBottom: opRunOpen ? 8 : 0,
                            borderBottom: opRunOpen ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <SlidersOutlined style={{ color: actionPrimary }} />
                            <span className="vhf-section-card-title">Thông tin vận hành khai thác</span>
                          </div>
                          <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                            {opRunOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
                          </span>
                        </div>
                        {opRunOpen && (
                          <DetailTable
                            dataSource={[]}
                            emptyText="Chưa có dữ liệu"
                            rowKey={(r: any) => r.id || r.planCode || r.code}
                            scrollY={160}
                            columns={[
                              { title: 'STT', width: 50 },
                              { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                              { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                              { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.startTime || rec.start || null) },
                              { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.endTime || rec.end || null) },
                            ]}
                          />
                        )}
                      </div>

                      {/* ── Section 2: Thông tin bảo trì ── */}
                      <div style={{ ...vhfDetailSectionBoxStyle, padding: opMaintOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                        <div
                          onClick={() => setOpMaintOpen(!opMaintOpen)}
                          style={{
                            ...vhfDetailSectionHeaderStyle,
                            marginBottom: opMaintOpen ? 12 : 0,
                            paddingBottom: opMaintOpen ? 8 : 0,
                            borderBottom: opMaintOpen ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <SlidersOutlined style={{ color: actionPrimary }} />
                            <span className="vhf-section-card-title">Thông tin bảo trì</span>
                          </div>
                          <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                            {opMaintOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
                          </span>
                        </div>
                        {opMaintOpen && (
                          <DetailTable
                            dataSource={[]}
                            emptyText="Chưa có dữ liệu"
                            rowKey={(r: any) => r.id || r.planCode || r.code}
                            scrollY={160}
                            columns={[
                              { title: 'STT', width: 50 },
                              { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                              { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                              { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.start || rec.startDate || null) },
                              { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.end || rec.endDate || null) },
                            ]}
                          />
                        )}
                      </div>

                      {/* ── Section 3: Thông tin sự cố ── */}
                      <div style={{ ...vhfDetailSectionBoxStyle, padding: opIncidentOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                        <div
                          onClick={() => setOpIncidentOpen(!opIncidentOpen)}
                          style={{
                            ...vhfDetailSectionHeaderStyle,
                            marginBottom: opIncidentOpen ? 12 : 0,
                            paddingBottom: opIncidentOpen ? 8 : 0,
                            borderBottom: opIncidentOpen ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <SlidersOutlined style={{ color: actionPrimary }} />
                            <span className="vhf-section-card-title">Thông tin sự cố</span>
                          </div>
                          <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                            {opIncidentOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
                          </span>
                        </div>
                        {opIncidentOpen && (
                          <DetailTable
                            dataSource={[]}
                            emptyText="Chưa có dữ liệu"
                            rowKey={(r: any) => r.id || r.planCode || r.code}
                            scrollY={160}
                            columns={[
                              { title: 'STT', width: 50 },
                              { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                              { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec.type || '' },
                              { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || '' },
                              { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.time || null) },
                            ]}
                          />
                        )}
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Drawer>

        {/* ── Modal Xem vị trí trên bản đồ ── */}
        <Modal
          rootClassName="vhf-modal-scope"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined style={{ color: actionPrimary }} />
              <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: 16 }}>
                Xem vị trí trên bản đồ
              </span>
            </div>
          }
          open={gisMapOpen}
          onCancel={() => setGisMapOpen(false)}
          destroyOnHidden
          width="90vw"
          style={{ top: 20, maxWidth: '1400px' }}
          footer={null}
        >
          <div style={{ padding: '8px 0' }}>
            <GisLocationSelector
              inline
              height={560}
              disabled={true}
              value={{
                geometryType:
                  normalizeGeometryType(selectedRecord?.geometryType || inferGeometryFromWkt(selectedRecord?.coordinates)),
                coordinates:
                  selectedRecord?.coordinates || '',
                symbolId:
                  selectedRecord?.mapSymbolId || undefined,
              }}
              defaultGeometryType={
                normalizeGeometryType(selectedRecord?.geometryType || inferGeometryFromWkt(selectedRecord?.coordinates)) as 'POINT' | 'LINE' | 'POLYGON'
              }
            />
          </div>
        </Modal>

        {/* ── Delete Confirmation Modal (chuẩn /berth) ─────────────── */}
        <DeleteConfirmModal
          open={deleteModalOpen}
          onCancel={() => {
            if (!deleteLoading) {
              setDeleteModalOpen(false);
              setDeletingRecord(null);
            }
          }}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
          itemType="hệ thống thông tin liên lạc VHF"
          itemName={deletingRecord?.deviceName}
          itemCode={deletingRecord?.deviceCode}
        />

        {/* ── Reject Reason Modal (chuẩn /berth) ───────────────────── */}
        <Modal
          rootClassName="vhf-modal-scope"
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
          open={rejectModalOpen}
          onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
          footer={[
            <Button
              key="cancel"
              onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}
            >
              Hủy
            </Button>,
            <Button
              key="reject"
              type="primary"
              danger
              loading={rejectLoading}
              onClick={handleConfirmReject}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
            >
              Xác nhận từ chối
            </Button>,
          ]}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
              Vui lòng nhập lý do từ chối cho thiết bị:
            </p>
            {rejectingRecord && (
              <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
                <strong style={{ color: textPrimary }}>
                  {rejectingRecord.deviceCode ? `${rejectingRecord.deviceCode} — ` : ''}{rejectingRecord.deviceName}
                </strong>
              </p>
            )}
            <Input.TextArea
              placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={500}
              showCount
              style={{ borderRadius: 8, fontSize: fontSizeMd }}
            />
          </div>
        </Modal>

        {/* ── Submit Modal (chuẩn /berth) ───────────────────────────── */}
        <Modal
          rootClassName="vhf-modal-scope"
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận gửi Cảng vụ phê duyệt</span>}
          open={submitModalOpen}
          onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
          footer={[
            <Button
              key="cancel"
              onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}
            >
              Hủy
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={submitLoading}
              onClick={handleConfirmSubmit}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
            >
              Xác nhận
            </Button>,
          ]}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
              Gửi <strong>{submittingRecord?.deviceCode ? `${submittingRecord.deviceCode} — ` : ''}{submittingRecord?.deviceName}</strong> để Cảng vụ phê duyệt?
            </p>
          </div>
        </Modal>

        {/* ── Approve Modal (chuẩn /berth) ──────────────────────────── */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1'}
          loading={approveLoading}
          onConfirm={(content) => { if (approvingRecord) void handleApprove(approvingRecord, content); }}
          onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        />

        {/* ── DRAWER LỊCH SỬ THAY ĐỔI (Đồng bộ chuẩn /berth, /radar-station) ── */}
        <AppDrawer
          width="min(880px, 96vw)"
          placement="right"
          open={historyModalVisible}
          rootClassName="vhf-drawer-scope"
          className="vhf-drawer-scope"
          mask
          onClose={() => { setHistoryModalVisible(false); setSelectedRecord(null); setHistoryRecords([]); }}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
          }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  {historyEntityName ? `Lịch sử thay đổi — ${historyEntityName}` : 'Lịch sử thay đổi'}
                </span>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                  Tổng cộng {historyFieldCount}
                </span>
              </Space>
            </div>
          }
        >
          <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
              <Input
                placeholder="Tìm kiếm nội dung thay đổi..."
                allowClear
                value={historySearchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setHistorySearchInput(val);
                  if (!val) setHistorySearch('');
                }}
                onPressEnter={() => {
                  setHistorySearch(historySearchInput.trim());
                  setHistoryReloadToken((t) => t + 1);
                }}
                style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
              />
              <DatePicker
                placeholder="Từ ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={historyDateFrom ? dayjs(historyDateFrom) : null}
                onChange={(d) => setHistoryDateFrom(d ? d.startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '')}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                format="DD/MM/YYYY"
              />
              <DatePicker
                placeholder="Đến ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={historyDateTo ? dayjs(historyDateTo) : null}
                onChange={(d) => setHistoryDateTo(d ? d.endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '')}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                format="DD/MM/YYYY"
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                loading={loadingHistory}
                onClick={() => {
                  setHistorySearch(historySearchInput.trim());
                  setHistoryReloadToken((t) => t + 1);
                }}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
            {loadingHistory && historyRecords.length === 0 ? (
              <LoadingSkeleton rows={5} />
            ) : historyRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
                  {historySearch || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
                </div>
              </div>
            ) : (
              <>
                {renderVhfHistoryTimeline(historyRecords)}
                {loadingMoreHistory && (
                  <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>
                    Đang tải thêm...
                  </div>
                )}
              </>
            )}
          </div>
        </AppDrawer>
      </div>
    </ThemeTokenProvider>
  );
};

export default VhfListPage;
