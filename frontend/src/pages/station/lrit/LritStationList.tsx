import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, Modal, Input, Button, DatePicker, Space, Select } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { lritStationService, type LritStationListParams } from '../../../services/lritStationService';
import { organizationService } from '../../../services/organizationService';
import { symbolService } from '../../../services/symbolService';
import type { LritStationItem } from '../../../types/lritStation';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../../types/vtsSystem';
import { useAuthStore } from '../../../store/authStore';
import { usePermissionStore } from '../../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../../components/list-view';
import FilterTableLayout from '../../../components/list-view/FilterTableLayout';
import Pagination from '../../../components/list-view/Pagination';
import LritStationForm from './LritStationForm';
import { getOperatingOrganizationDisplayName } from '../../../utils/operatingOrganizationDisplay';
import ApprovalModal from '../../../components/shared/ApprovalModal';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import toast, { modal } from '../../../components/ToastNotification';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  radiusSm, radiusPill, spaceFormField, spaceMd, spaceSm, spaceLg,
  statusOperational, statusDraft, statusCritical, statusAttention,
  surfacePage, spaceXs, spaceXl, drawerTitleStyle, drawerCloseBtnStyle, selectStyle,
  borderDefault, statusBadgeStyle, cellTitleStyle, cellSubtitleStyle,
  inputStyle, primaryButtonStyle, clientSideStringSorter,
  clientSideProvinceSorter, clientSideUserSorter, clientSideBadgeSorter,
  getRangePickerProps,
} from '../../../themetokenchk';
import { colors } from '../../../themetokenchk';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../../components/org-unit';
import SidebarFilterField from '../../../components/list-view/SidebarFilterField';
import { canEditApprovalRecord, canDeleteApprovalRecord, normalizeApprovalStatus } from '../../../utils/approvalEditPolicy';
import * as themeTokenChk from '../../../themetokenchk';
import { ThemeTokenProvider } from '../../../context/ThemeTokenContext';
import { deduplicateAttachmentHistoryChanges } from '../../../utils/historyAttachmentDedup';

const CONDITION_COLOR: Record<ConditionStatus, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const HISTORY_FIELD_ORDER = [
  'orgUnitId', 'orgUnitName', 'operatingOrgId', 'operatingOrgName',
  'code', 'name', 'provinceId', 'province', 'locationAddress', 'coverageArea',
  'conditionStatus', 'services', 'servicesProvided', 'description', 'note',
  'approvalStatus', 'geometryType', 'coordinates', 'symbol', 'symbolId'
];

function historyFieldName(fn: string): string {
  const map: Record<string, string> = {
    name: 'Tên đài LRIT', code: 'Mã đài LRIT', province: 'Tỉnh/Thành phố',
    provinceId: 'Địa điểm (Tỉnh/TP)', locationAddress: 'Địa điểm chi tiết', address: 'Địa điểm chi tiết',
    coverageArea: 'Vùng phủ sóng', coverage: 'Vùng phủ sóng', description: 'Ghi chú / Mô tả', note: 'Ghi chú',
    services: 'Dịch vụ cung cấp', servicesProvided: 'Dịch vụ cung cấp',
    approvalStatus: 'Trạng thái phê duyệt', conditionStatus: 'Tình trạng',
    orgUnitName: 'Đơn vị quản lý', orgUnitId: 'Đơn vị quản lý',
    operatingOrgName: 'Đơn vị khai thác', operatingOrgId: 'Đơn vị khai thác',
    symbol: 'Biểu tượng', symbolId: 'Biểu tượng', coordinates: 'Tọa độ GIS', geometryType: 'Loại đối tượng GIS',
  };
  return map[fn] || fn;
}

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
}

function historyFieldValue(fn: string, val: string | null): string {
  if (!val || val === '(null)' || val === 'null' || val === '') return '(trống)';
  const displayValue = val.split(';').map((part) => {
    const separator = part.indexOf('=');
    return separator >= 0 ? part.slice(separator + 1).trim() : part.trim();
  }).filter(Boolean).join('; ');
  const historyFieldKeys = fn.split(/[,;]+/).map(normalizeHistoryKey);
  const isApprovalField = fn === 'approvalStatus'
    || historyFieldKeys.includes('approvalstatus')
    || historyFieldKeys.includes('trang thai phe duyet');
  if (isApprovalField) {
    const statusMap: Record<string, string> = {
      DRAFT: 'Lưu tạm',
      PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
      APPROVED_LEVEL1: 'Chờ Cục duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      REJECTED_LEVEL1: 'Từ chối',
      REJECTED_LEVEL2: 'Từ chối',
    };
    return displayValue.split(';').map((value) => {
      const normalizedValue = String(value || '').trim();
      const fromEnum = statusMap[normalizedValue] || statusMap[normalizedValue.toUpperCase()];
      if (fromEnum) return fromEnum;
      return normalizedValue;
    }).join('; ');
  }
  if (fn === 'provinceId') {
    const num = Number(displayValue);
    if (!isNaN(num)) return getProvinceNameById(num) || displayValue;
    return displayValue;
  }
  if (fn === 'conditionStatus') {
    return CONDITION_STATUS_MAP[displayValue as ConditionStatus] || displayValue;
  }
  if (fn === 'operatingOrgId' || fn === 'operatingOrgName') {
    return getOperatingOrganizationDisplayName(displayValue);
  }
  return displayValue;
}

function historyTimestamp(item: any): string {
  return item.approvedDate || item.changedAt || item.createdAt || item.performedDate || '';
}

function historyField(item: any): string {
  return item.changedField || item.fieldName || '';
}

function historyOldValue(item: any): string | null {
  return item.previousValue ?? item.oldValue ?? null;
}

function historyNewValue(item: any): string | null {
  return item.newValue ?? null;
}

function historyActor(item: any): string {
  const raw = item?.approvedByName || item?.changedByName || item?.performedByName || item?.userName || item?.actorName || item?.approvedBy || item?.changedBy || item?.performedBy || '';
  return raw || '—';
}

function normalizedHistoryFields(value: string): string[] {
  const fields = value.split(/[,;]+/).map((field: string) => field.trim()).filter(Boolean);
  const hasApprovalStatus = fields.some((field) => {
    const key = normalizeHistoryKey(field);
    return key === 'approvalstatus' || key === 'trang thai phe duyet';
  });

  if (hasApprovalStatus) {
    return fields.filter((field) => {
      const key = normalizeHistoryKey(field);
      return key !== 'approvedlevel1'
        && key !== 'approvedlevel2'
        && key !== 'rejectedlevel1'
        && key !== 'rejectedlevel2'
        && key !== 'approvalreasonlevel1'
        && key !== 'approvalreasonlevel2';
    });
  }

  return fields;
}

function historyChangeRows(item: any): Array<{ field: string; oldValue: string | null; newValue: string | null }> {
  const fields = normalizedHistoryFields(historyField(item));
  const oldVal = historyOldValue(item);
  const newVal = historyNewValue(item);

  if (fields.length <= 1) {
    return [{ field: fields[0] || '', oldValue: oldVal, newValue: newVal }];
  }

  const oldMap = new Map<string, string>();
  if (oldVal) {
    oldVal.split(';').forEach((part) => {
      const idx = part.indexOf('=');
      if (idx >= 0) oldMap.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
    });
  }

  const newMap = new Map<string, string>();
  if (newVal) {
    newVal.split(';').forEach((part) => {
      const idx = part.indexOf('=');
      if (idx >= 0) newMap.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
    });
  }

  return fields.map((fn) => ({
    field: fn,
    oldValue: oldMap.get(fn) ?? (fields.length === 1 ? oldVal : null),
    newValue: newMap.get(fn) ?? (fields.length === 1 ? newVal : null),
  })).filter((r) => {
    if (r.oldValue === null && r.newValue === null) return false;
    return r.oldValue !== r.newValue;
  });
}

function isListDeltaField(fn: string): boolean {
  const norm = normalizeHistoryKey(fn);
  return norm.includes('dinh kem') || norm.includes('attachment') || norm.includes('services') || norm.includes('dich vu');
}

function parseListDelta(oldVal: string | null, newVal: string | null) {
  const removed: string[] = [];
  const added: string[] = [];
  const modifiedOld: string[] = [];
  const modifiedNew: string[] = [];

  const splitParts = (val: string | null) => {
    if (!val || val === '—' || val === '(null)' || val === '(trống)' || val === 'Chưa có' || val === 'null' || val === 'undefined') return [];
    return val.split(',').map((s) => s.trim()).filter((s) => s && s !== '—' && s !== '(null)' && s !== '(trống)' && s !== 'Chưa có' && s !== 'null' && s !== 'undefined');
  };

  const oldParts = splitParts(oldVal);
  const newParts = splitParts(newVal);

  const normalizeListItem = (value: string) => normalizeHistoryKey(value).replace(/\s+/g, ' ');
  const oldPlain = oldParts.filter((part) => !part.startsWith('Xóa ') && !part.startsWith('Cũ: '));
  const newPlain = newParts.filter((part) => !part.startsWith('Thêm ') && !part.startsWith('Mới: '));
  const oldPlainKeys = new Set(oldPlain.map(normalizeListItem));
  const newPlainKeys = new Set(newPlain.map(normalizeListItem));

  oldParts.forEach((part) => {
    if (part.startsWith('Xóa ')) {
      removed.push(part.replace('Xóa ', '').trim());
    } else if (part.startsWith('Cũ: ')) {
      modifiedOld.push(part.replace('Cũ: ', '').trim());
    } else if (part !== '—' && !newPlainKeys.has(normalizeListItem(part))) {
      removed.push(part);
    }
  });

  newParts.forEach((part) => {
    if (part.startsWith('Thêm ')) {
      added.push(part.replace('Thêm ', '').trim());
    } else if (part.startsWith('Mới: ')) {
      modifiedNew.push(part.replace('Mới: ', '').trim());
    } else if (part !== '—' && !oldPlainKeys.has(normalizeListItem(part))) {
      added.push(part);
    }
  });

  const modifiedPairs: Array<{ oldV: string; newV: string }> = [];
  const maxMod = Math.max(modifiedOld.length, modifiedNew.length);
  for (let i = 0; i < maxMod; i++) {
    modifiedPairs.push({
      oldV: modifiedOld[i] || '—',
      newV: modifiedNew[i] || '—',
    });
  }

  return { removed, added, modifiedPairs };
}

function resolveHistoryActionMeta(_group?: any, _changes?: any[]): { label: string; color: string; bg: string } {
  return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
}

function formatCoordPointDms(xStr: string, yStr?: string): string {
  const x = Number(xStr);
  const y = yStr !== undefined && yStr !== '' ? Number(yStr) : NaN;

  const toDmsString = (val: number, isLat: boolean) => {
    if (isNaN(val)) return '';
    const abs = Math.abs(val);
    const d = Math.floor(abs);
    const minFloat = (abs - d) * 60;
    const m = Math.floor(minFloat);
    const s = Math.round((minFloat - m) * 60 * 10) / 10;
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    return `${d}° ${m}' ${s.toFixed(1)}" ${dir}`;
  };

  if (!isNaN(x) && !isNaN(y)) {
    let lat = y;
    let lng = x;
    if (x < 35 && y > 50) {
      lat = x;
      lng = y;
    }
    const latDms = toDmsString(lat, true);
    const lngDms = toDmsString(lng, false);
    return `${latDms}, ${lngDms}`;
  }

  if (!isNaN(x)) {
    const isLat = x <= 35 && x >= -35;
    return toDmsString(x, isLat);
  }

  return xStr;
}

function parseCoordinatesPoints(raw: string | null): { typeName?: string; points: Array<{ x: string; y: string; index: number }> } | null {
  if (!raw || raw === '—' || raw === 'Chưa có' || raw === '(null)' || raw === '(trống)') return null;
  const str = raw.trim();

  let typeName = '';
  let inner = str;

  if (/^POINT\s*\(/i.test(str)) {
    typeName = 'Điểm';
    inner = str.replace(/^POINT\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^LINESTRING\s*\(/i.test(str)) {
    typeName = 'Đường';
    inner = str.replace(/^LINESTRING\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^LINE\s*\(/i.test(str)) {
    typeName = 'Đường';
    inner = str.replace(/^LINE\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^POLYGON\s*\(\(/i.test(str)) {
    typeName = 'Vùng';
    inner = str.replace(/^POLYGON\s*\(\(/i, '').replace(/\)\)\s*$/, '');
  } else if (/^MULTIPOINT\s*\(/i.test(str)) {
    typeName = 'Tập hợp điểm';
    inner = str.replace(/^MULTIPOINT\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (str.startsWith('(') && str.endsWith(')')) {
    inner = str.slice(1, -1);
  }

  const pointStrings = inner.split(',').map((s) => s.trim()).filter(Boolean);
  if (pointStrings.length === 0) return null;

  const points = pointStrings.map((ps, idx) => {
    const clean = ps.replace(/[()]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return { x: parts[0], y: parts[1], index: idx + 1 };
    }
    return { x: clean, y: '', index: idx + 1 };
  });

  return { typeName, points };
}

function renderCoordinatesDisplay(val: string | null) {
  if (!val || val === '—' || val === 'Chưa có' || val === '(null)' || val === '(trống)') {
    return <span style={{ color: textTertiary }}>{val === 'Chưa có' ? 'Chưa có' : '—'}</span>;
  }
  const parsed = parseCoordinatesPoints(val);
  if (!parsed || parsed.points.length === 0) {
    return <span style={{ color: textPrimary }}>{val}</span>;
  }
  const { typeName, points } = parsed;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      {typeName && (
        <span style={{ fontSize: fontSizeSm, fontWeight: fontWeightBold, color: actionPrimary }}>
          {typeName} ({points.length} điểm)
        </span>
      )}
      {points.map((pt) => {
        const dms = formatCoordPointDms(pt.x, pt.y);
        return (
          <div key={pt.index} style={{ fontSize: fontSizeSm, color: textPrimary, lineHeight: '18px' }}>
            {points.length > 1 && <span style={{ color: textSecondary, marginRight: 4 }}>#{pt.index}:</span>}
            <span>{dms}</span>
          </div>
        );
      })}
    </div>
  );
}

function renderHistoryValueTag(field: string, val: string | null, symbols: any[]) {
  if (val === null || val === undefined || val === '—' || val === '') {
    return <span style={{ color: textTertiary }}>—</span>;
  }
  if (field === 'symbol' || field === 'symbolId') {
    const sym = symbols.find((s) => s.id === val || s.code === val);
    if (sym?.image) {
      const src = sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`;
      return (
        <Space size={4}>
          <img src={src} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
          <span>{sym.name}</span>
        </Space>
      );
    }
    return <span>{sym?.name || val}</span>;
  }
  return <span style={{ color: textPrimary }}>{val}</span>;
}

export const LritStationList: React.FC = () => {
  const [data, setData] = useState<LritStationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Status counts for StatusTabs
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Filters state
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>(undefined);
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>(undefined);
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>(undefined);
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>(undefined);
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>(undefined);
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>(undefined);

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [selectedRecord, setSelectedRecord] = useState<LritStationItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Approval Modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // Reject Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // History Drawer state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Lookup options
  const [orgUnitOptions, setOrgUnitOptions] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);

  // Permissions & User
  const user = useAuthStore((s: any) => s.user);
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);

  const canCreate = hasPerm('coastalstationlrit:create') || hasPerm('specialstation:create') || hasPerm('data:create') || hasPerm('admin:all') || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN';

  // Load organizations & symbols
  useEffect(() => {
    organizationService.getAll().then((res) => {
      const items = Array.isArray(res) ? res : ((res as any)?.data || []);
      setOrgUnitOptions(items);
    }).catch(() => {});

    symbolService.getAll().then((res) => {
      if (Array.isArray(res) && res.length > 0) setSymbols(res);
    }).catch(() => {});
  }, []);

  const filteredOrgUnits = useMemo(() => {
    if (!orgUnitOptions || orgUnitOptions.length === 0) return [];
    const userOrgId = (user as any)?.orgUnitId;
    if (!userOrgId || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN' || (user as any)?.orgUnitLevel === 1) {
      return orgUnitOptions;
    }
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, userOrgId);
    if (allowedIds.size === 0) return orgUnitOptions;
    return orgUnitOptions.filter((u: any) => allowedIds.has(u.id));
  }, [orgUnitOptions, user]);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: LritStationListParams = {
        page,
        size: pageSize,
        keyword: filterKeyword || undefined,
        orgUnitId: filterOrgUnitId || undefined,
        provinceId: filterProvinceId,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      };
      const res = await lritStationService.search(params);

      setData(res.items || []);
      setTotal(res.total || 0);
      setStatusCounts(res.statusCounts || {});
    } catch {
      toast.error('Không thể tải danh sách Đài LRIT');
    } finally {
      setLoading(false);
    }
  }, [filterKeyword, filterOrgUnitId, filterProvinceId, filterConditionStatus, filterApprovalStatus, filterUpdatedFrom, filterUpdatedTo, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshList = () => {
    fetchData();
  };

  // Status Tabs
  const countDraft = Number(statusCounts.DRAFT ?? statusCounts.draft ?? 0);
  const countPendingApproval = Number(statusCounts.PENDING_APPROVAL ?? statusCounts.pending ?? 0);
  const countApprovedLevel1 = Number(statusCounts.APPROVED_LEVEL1 ?? statusCounts.approvedLevel1 ?? statusCounts.approvedL1 ?? 0);
  const countApproved = Number(statusCounts.APPROVED ?? statusCounts.approved ?? 0);
  const countRejected = Number(statusCounts.REJECTED ?? statusCounts.rejected ?? ((statusCounts.REJECTED_LEVEL1 || 0) + (statusCounts.REJECTED_LEVEL2 || 0)));
  const countAll = countDraft + countPendingApproval + countApprovedLevel1 + countApproved + countRejected;

  const statusTabsConfig = useMemo(() => [
    { key: 'ALL', label: 'Tất cả', count: countAll, color: actionPrimary, active: !filterApprovalStatus },
    { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', count: countDraft, color: statusDraft, active: filterApprovalStatus === ApprovalStatus.DRAFT },
    { key: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ Cảng vụ duyệt', count: countPendingApproval, color: statusAttention, active: filterApprovalStatus === ApprovalStatus.PENDING_APPROVAL },
    { key: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ Cục duyệt', count: countApprovedLevel1, color: '#0284C7', active: filterApprovalStatus === ApprovalStatus.APPROVED_LEVEL1 },
    { key: ApprovalStatus.APPROVED, label: 'Đã duyệt', count: countApproved, color: statusOperational, active: filterApprovalStatus === ApprovalStatus.APPROVED },
    { key: 'REJECTED', label: 'Từ chối', count: countRejected, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2 },
  ], [countAll, filterApprovalStatus, countDraft, countPendingApproval, countApprovedLevel1, countApproved, countRejected]);

  const handleTabChange = (key: string) => {
    if (key === 'ALL') setFilterApprovalStatus(undefined);
    else if (key === 'REJECTED') setFilterApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
    else setFilterApprovalStatus(key as ApprovalStatus);
    setPage(1);
  };

  const handleFilterSearch = (vals: Record<string, any>) => {
    setFilterKeyword(vals.keyword || '');
    setFilterConditionStatus(vals.conditionStatus);
    setFilterOrgUnitId(vals.orgUnitId);
    setFilterProvinceId(vals.provinceId);
    setFilterUpdatedFrom(vals.updateDateRange?.[0] ? dayjs(vals.updateDateRange[0]).startOf('day').toISOString() : undefined);
    setFilterUpdatedTo(vals.updateDateRange?.[1] ? dayjs(vals.updateDateRange[1]).endOf('day').toISOString() : undefined);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilterValues({});
    setFilterKeyword('');
    setFilterConditionStatus(undefined);
    setFilterOrgUnitId(undefined);
    setFilterProvinceId(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setPage(1);
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      await lritStationService.delete(id);
      toast.success('Xóa thành công');
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi xóa đài LRIT');
    }
  };

  const confirmDelete = (record: LritStationItem) => {
    modal.confirm({
      title: 'Xác nhận xóa đài thông tin LRIT',
      icon: <ExclamationCircleOutlined />,
      content: `Hồ sơ "${record.name}" ở trạng thái Lưu tạm sẽ chuyển sang "Đã xóa (lịch sử)": không còn hiển thị trong danh sách nhưng vẫn được giữ lại để đối chiếu.`,
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: () => handleDelete(record.id),
    });
  };

  // Approval Handlers
  const openApproveModal = (id: string, level: 'c1' | 'c2') => {
    setApproveTargetId(id);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleApprove = async (content: string) => {
    if (!approveTargetId) return;
    try {
      if (approveLevel === 'c1') {
        await lritStationService.approveL1(approveTargetId, content);
        toast.success('Phê duyệt cấp 1 thành công');
      } else {
        await lritStationService.approveL2(approveTargetId, content);
        toast.success('Phê duyệt cấp 2 thành công');
      }
      setApproveModalOpen(false);
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi phê duyệt');
    }
  };

  const openRejectModal = (id: string) => {
    setRejectTargetId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      toast.error('Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự)');
      return;
    }
    if (!rejectTargetId) return;
    try {
      await lritStationService.reject(rejectTargetId, rejectReason.trim());
      toast.success('Đã từ chối hồ sơ');
      setRejectModalOpen(false);
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi từ chối hồ sơ');
    }
  };

  // History Drawer handler
  const handleOpenHistory = (record: LritStationItem) => {
    setSelectedRecord(record);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    setHistorySearch('');
    setHistorySearchInput('');
    setHistoryDateFrom('');
    setHistoryDateTo('');

    lritStationService.getHistory(record.id).then((res) => {
      setHistoryRecords(res || []);
    }).catch(() => {
      toast.error('Không thể tải lịch sử thay đổi');
    }).finally(() => {
      setLoadingHistory(false);
    });
  };

  const fmtTime = (ts: string) => {
    const d = dayjs(ts);
    return `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`;
  };

  const renderHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const q = historySearch.toLowerCase().trim();

    const isUpdateAction = (status: string, reason?: string) => {
      const s = String(status || '').toUpperCase();
      const r = String(reason || '').toLowerCase();
      return s === 'UPDATED' || s === 'UPDATE' || s === 'EDIT' || s === 'ATTACHMENT_UPLOADED' || s === 'ATTACHMENT_DELETED'
        || r.includes('cập nhật') || r.includes('chỉnh sửa') || r.includes('tải lên') || r.includes('xóa tệp') || r.includes('xóa tài liệu');
    };

    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r);
      const isBothUpdate = prev && isUpdateAction(prev.status, prev.items[0]?.reason) && isUpdateAction(r.status, r.reason);
      const isSameGroup = prev && Math.abs(prev.tsSec - sec) <= 60 && prev.actor === actor && (prev.status === r.status || isBothUpdate);
      if (isSameGroup) {
        prev.items.push(r);
      } else {
        groups.push({ tsSec: sec, ts, actor, status: r.status, approvalLevel: r.approvalLevel, items: [r] });
      }
    }
    if (groups.length === 0) return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
      </div>
    );
    return (
      <div>{groups.map((g, gi) => {
        const changes = deduplicateAttachmentHistoryChanges(g.items.flatMap((item: any) => historyChangeRows(item))).sort((a: any, b: any) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        const rawUnit = g.items[0]?.orgUnitName || g.items[0]?.unitName;
        const unitName = rawUnit && rawUnit !== '—' ? rawUnit : 'Cục Hàng hải Việt Nam';
        const informationTitle = 'Thông tin thay đổi:';
        const formatHistoryValue = (fn: string, raw: string | null) => {
          if (raw === null || raw === '(null)' || raw === '') return null;
          const t = raw.trim();
          const specialFields = ['provinceId', 'symbol', 'symbolId', 'conditionStatus', 'approvalStatus'];
          if (!specialFields.includes(fn) && /^-?\d+(\.\d+)?$/.test(t)) {
            const n = Number(t);
            return Number.isInteger(n) ? String(n) : t;
          }
          return historyFieldValue(fn, raw);
        };
        if (changes.length === 0) return null;
        const actionMeta = resolveHistoryActionMeta(g, changes);
        return (
          <div
            key={gi}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(310px, 0.38fr) minmax(0, 1fr)',
              gap: spaceLg,
              alignItems: 'start',
              marginBottom: gi < groups.length - 1 ? spaceMd : 0,
            }}
          >
            <div style={{ minWidth: 0, paddingTop: spaceXs }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceXs }}>
                <Typography.Text style={{ display: 'block', fontSize: fontSizeLg - 1, color: textPrimary, fontWeight: fontWeightBold, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                  {g.ts ? fmtTime(g.ts) : '—'}
                </Typography.Text>
                <span style={{ flexShrink: 0 }}>
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>
                    {actionMeta.label}
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: spaceXs }}>
                <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                  Người cập nhật: <span style={{ color: textPrimary, fontWeight: fontWeightBold }}>{g.actor || '—'}</span>
                </Typography.Text>
                <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                  Đơn vị: <span style={{ color: textPrimary }}>{unitName}</span>
                </Typography.Text>
              </div>
            </div>

            <div style={{ position: 'relative', minWidth: 0, background: surfacePage, borderRadius: radiusSm, padding: `${spaceMd}px ${spaceLg}px`, paddingLeft: spaceLg, overflow: 'hidden', border: `1px solid ${borderDefault}` }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: spaceXs, background: `linear-gradient(180deg, ${actionMeta.color} 0%, ${actionMeta.color}40 100%)` }} />
              <Typography.Text style={{ display: 'block', color: colors.sidebarBg, fontSize: fontSizeMd, fontWeight: fontWeightBold, marginBottom: spaceSm }}>
                {informationTitle}
              </Typography.Text>

              {(() => {
                const isCoordField = (f: string, v: string | null | undefined): boolean => {
                  const nk = normalizeHistoryKey(f);
                  if (nk === 'coordinates' || nk === 'toa do gis' || nk.includes('toa do') || nk.includes('coordinates')) return true;
                  if (!v) return false;
                  const sv = String(v).trim().toUpperCase();
                  return sv.startsWith('POINT') || sv.startsWith('LINESTRING') || sv.startsWith('POLYGON');
                };

                const renderHistoryContent = (field: string, val: string | null, _isOld: boolean = false) => {
                  if (val === null || val === undefined || val === '—' || val === '') {
                    return <span style={{ color: textTertiary }}>—</span>;
                  }
                  if (isCoordField(field, val)) {
                    return renderCoordinatesDisplay(val);
                  }
                  return renderHistoryValueTag(field, val, symbols);
                };

                const uniqueChangesMap = new Map<string, any>();
                changes.forEach((c: any) => {
                  const key = `${c.field}::${c.oldValue}::${c.newValue}`;
                  if (!uniqueChangesMap.has(key)) {
                    uniqueChangesMap.set(key, c);
                  }
                });

                const validChanges = Array.from(uniqueChangesMap.values()).filter((c: any) => {
                  if (!c.field && !c.oldValue && !c.newValue) return false;
                  const ov = formatHistoryValue(c.field, c.oldValue);
                  const nv = formatHistoryValue(c.field, c.newValue);
                  if (ov == null && nv == null) return false;
                  if (ov !== null && nv !== null && String(ov).trim() === String(nv).trim()) return false;
                  return true;
                });

                if (validChanges.length > 0) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                      {validChanges.map((change, ri: number) => {
                        const fn = change.field;
                        const ov = formatHistoryValue(fn, change.oldValue);
                        const nv = formatHistoryValue(fn, change.newValue);

                        if (isListDeltaField(fn)) {
                          const delta = parseListDelta(ov, nv);
                          const rows: Array<{ label: string; oldVal: React.ReactNode; arrow: boolean; newVal: React.ReactNode }> = [];

                          delta.modifiedPairs.forEach((p, idx) => {
                            rows.push({
                              label: idx === 0 && rows.length === 0 ? (fn ? `${historyFieldName(fn)}:` : '—') : '',
                              oldVal: p.oldV,
                              arrow: true,
                              newVal: p.newV,
                            });
                          });

                          delta.removed.forEach((r) => {
                            rows.push({
                              label: rows.length === 0 ? (fn ? `${historyFieldName(fn)}:` : '—') : '',
                              oldVal: r,
                              arrow: true,
                              newVal: <span style={{ color: textTertiary }}>—</span>,
                            });
                          });

                          delta.added.forEach((a) => {
                            rows.push({
                              label: rows.length === 0 ? (fn ? `${historyFieldName(fn)}:` : '—') : '',
                              oldVal: <span style={{ color: textTertiary }}>—</span>,
                              arrow: true,
                              newVal: a,
                            });
                          });

                          if (rows.length === 0) {
                            rows.push({
                              label: fn ? `${historyFieldName(fn)}:` : '—',
                              oldVal: ov || '—',
                              arrow: true,
                              newVal: nv || '—',
                            });
                          }

                          return (
                            <React.Fragment key={`${fn}-${ri}`}>
                              {rows.map((row, rIdx) => (
                                <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: '170px minmax(100px, 1fr) 24px minmax(100px, 1fr)', alignItems: 'flex-start', gap: spaceSm, fontSize: fontSizeMd, lineHeight: 1.6, padding: '3px 0' }}>
                                  <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{row.label}</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary }}>
                                    {row.oldVal}
                                  </div>
                                  <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>
                                    {row.arrow ? '→' : ''}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary }}>
                                    {row.newVal}
                                  </div>
                                </div>
                              ))}
                            </React.Fragment>
                          );
                        }

                        return (
                          <div key={`${fn}-${ri}`} style={{ display: 'grid', gridTemplateColumns: '170px minmax(100px, 1fr) 24px minmax(100px, 1fr)', alignItems: 'flex-start', gap: spaceSm, fontSize: fontSizeMd, lineHeight: 1.6, padding: '3px 0' }}>
                            <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word' }}>
                              {renderHistoryContent(fn, ov, true)}
                            </div>
                            <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>→</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word' }}>
                              {renderHistoryContent(fn, nv)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>;
              })()}
            </div>
          </div>
        );
      })}</div>
    );
  };

  // Table Columns
  const columns = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      key: 'name',
      label: 'Tên / Mã đài thông tin LRIT',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      sorter: clientSideStringSorter('name', 'code'),
      render: (_: any, record: LritStationItem) => (
        <div
          style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          onClick={() => {
            setEditingId(record.id);
            setSelectedRecord(record);
            setModalMode('detail');
            setIsModalOpen(true);
          }}
        >
          <div style={cellTitleStyle} title={record.name || ''}>{record.name || '—'}</div>
          <div style={cellSubtitleStyle} title={record.code || ''}>{record.code || '—'}</div>
        </div>
      ),
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 220,
      sorter: clientSideStringSorter('orgUnitName'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: fontWeightBold }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'operatingOrgName',
      label: 'Đơn vị khai thác',
      dataIndex: 'operatingOrgName',
      width: 200,
      sorter: clientSideStringSorter('operatingOrgName'),
      render: (v: string, record: LritStationItem) => {
        const name = getOperatingOrganizationDisplayName(record.operatingOrgId, v);
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>{name}</div>;
      },
    },
    {
      key: 'province',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 180,
      sorter: clientSideProvinceSorter('provinceName', 'provinceId'),
      render: (_: any, r: LritStationItem) => {
        const val = r.provinceId ? getProvinceNameById(r.provinceId) : '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      align: 'center' as const,
      sorter: clientSideBadgeSorter('conditionStatus', CONDITION_STATUS_MAP),
      render: (v: string) => {
        const enumKey = (v || ConditionStatus.OPERATIONAL) as ConditionStatus;
        const label = CONDITION_STATUS_MAP[enumKey] || v;
        const color = CONDITION_COLOR[enumKey] || textSecondary;
        return (
          <span style={statusBadgeStyle(color)}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 180,
      align: 'center' as const,
      sorter: clientSideBadgeSorter('approvalStatus'),
      render: (status: ApprovalStatus) => <ApprovalStatusBadge status={status} />,
    },
    {
      key: 'updatedInfo',
      label: 'Cán bộ cập nhật / Thời gian',
      width: 220,
      sorter: clientSideUserSorter('updatedByName', 'createdByName', 'updatedAt', 'createdAt'),
      render: (_: any, r: LritStationItem) => {
        const isUuid = (v?: string | null) => !!v && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(v);
        const raw = r.updatedByName || r.createdByName;
        const u = isUuid(raw) ? '—' : (raw || '—');
        const d = r.updatedAt || r.createdAt ? dayjs(r.updatedAt || r.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—';
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div style={{ fontWeight: fontWeightBold, color: '#0F172A', fontSize: fontSizeMd, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={u}>{u}</div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>{d}</div>
          </div>
        );
      },
    },
  ], [page, pageSize]);

  // Dynamic Row Actions
  const getRowActions = (record: LritStationItem) => {
    const isCreator = Boolean(user?.id && (record.createdBy === user.id || record.createdBy === user.username));
    const isApproverL1 = Boolean(user?.id && (record as any).approverLevel1 && ((record as any).approverLevel1 === user.id || (record as any).approverLevel1 === user.username));
    const isDepartmentLevel = Boolean((user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN' || (user as any)?.orgUnitLevel === 1 || (user as any)?.rank === 'DEPARTMENT');
    const canApproveC1 = hasPerm('coastalstationlrit:approvec1') || hasPerm('specialstation:approvec1') || hasPerm('admin:all') || isDepartmentLevel;
    const canApproveC2 = hasPerm('coastalstationlrit:approvec2') || hasPerm('coastalstationlrit:approve') || hasPerm('specialstation:approvec2') || hasPerm('specialstation:approve') || hasPerm('admin:all') || isDepartmentLevel;
    const st = normalizeApprovalStatus(record.approvalStatus);

    const actions: any[] = [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record);
          setModalMode('detail');
          setIsModalOpen(true);
        },
      },
      {
        key: 'history',
        label: 'Lịch sử',
        icon: <HistoryOutlined />,
        onClick: () => handleOpenHistory(record),
      },
    ];

    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'coastalstationlrit', extraApprovePerms: ['specialstation:approvec2', 'specialstation:approve', 'admin:all'] })) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: <EditOutlined />,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record);
          setModalMode('edit');
          setIsModalOpen(true);
        },
      });
    }

    if ((hasPerm('coastalstationlrit:update') || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN') && (st === 'DRAFT' || st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2')) {
      actions.push({
        key: 'submit',
        label: 'Gửi duyệt',
        icon: <SendOutlined />,
        onClick: async () => {
          try {
            await lritStationService.submit(record.id);
            toast.success('Gửi duyệt thành công');
            refreshList();
          } catch (e: any) {
            toast.error(e?.message || 'Lỗi gửi duyệt');
          }
        },
      });
    }

    if (canApproveC1 && st === 'PENDING_APPROVAL' && (!isCreator || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN')) {
      actions.push({
        key: 'approve_c1',
        label: 'Phê duyệt cấp Cảng vụ/Chi cục',
        icon: <CheckCircleOutlined />,
        onClick: () => openApproveModal(record.id, 'c1'),
      });
      actions.push({
        key: 'reject_c1',
        label: 'Từ chối cấp Cảng vụ/Chi cục',
        icon: <CloseCircleOutlined />,
        danger: true,
        onClick: () => openRejectModal(record.id),
      });
    }

    if (canApproveC2 && (st === 'APPROVED_LEVEL1' || st === 'APPROVED_L1' || st === 'CHO_PD_CAP_CUC') && (!isApproverL1 || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN')) {
      actions.push({
        key: 'approve_c2',
        label: 'Phê duyệt cấp Cục',
        icon: <CheckCircleOutlined />,
        onClick: () => openApproveModal(record.id, 'c2'),
      });
      actions.push({
        key: 'reject_c2',
        label: 'Từ chối cấp Cục',
        icon: <CloseCircleOutlined />,
        danger: true,
        onClick: () => openRejectModal(record.id),
      });
    }

    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'coastalstationlrit', extraDeletePerms: ['specialstation:delete', 'admin:all'] })) {
      actions.push({
        key: 'delete',
        label: 'Xóa bỏ',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => confirmDelete(record),
      });
    }

    return actions;
  };

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
        {/* Header */}
        <ScreenHeader
          breadcrumb={[
            { label: 'Tài sản KCHTGT' },
            { label: 'Đài thông tin LRIT' },
          ]}
          actions={
            canCreate
              ? [{
                key: 'create',
                label: 'Thêm mới',
                variant: 'primary' as const,
                icon: <PlusOutlined />,
                onClick: () => {
                  setEditingId(null);
                  setSelectedRecord(null);
                  setModalMode('create');
                  setIsModalOpen(true);
                },
              }]
              : []
          }
        />

        {/* FilterTableLayout with Sidebar Filter */}
        <FilterTableLayout
          onFilterApply={() => handleFilterSearch(filterValues)}
          onFilterReset={handleFilterReset}
          hideFilterToggle={true}
          loading={loading}
          statusTabs={statusTabsConfig}
          onStatusTabChange={handleTabChange}
          filterContent={
            <>
              {/* ── Bộ lọc thường ── */}
              <SidebarFilterField label="Đơn vị quản lý" style={{ marginTop: spaceMd }}>
                <OrgUnitTreeSelect
                  organizations={filteredOrgUnits}
                  value={filterValues.orgUnitId}
                  onChange={(val) => setFilterValues((p) => ({ ...p, orgUnitId: val }))}
                  placeholder="Tất cả đơn vị"
                  allowClear
                  treeDefaultExpandAll={true}
                  listHeight={256}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tìm kiếm">
                <Input
                  placeholder="Tìm theo tên, mã đài..."
                  value={filterValues.keyword ?? ''}
                  onChange={(e) => setFilterValues((p) => ({ ...p, keyword: e.target.value }))}
                  onPressEnter={() => handleFilterSearch(filterValues)}
                  allowClear
                  style={{ ...inputStyle, width: '100%', borderRadius: radiusPill, height: 38 }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tình trạng">
                <Select
                  placeholder="Tất cả tình trạng"
                  value={filterValues.conditionStatus}
                  onChange={(val) => setFilterValues((p) => ({ ...p, conditionStatus: val }))}
                  allowClear
                  options={CONDITION_STATUS_OPTIONS}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              {/* ── Bộ lọc nâng cao ── */}
              <>
                  <SidebarFilterField label="Khoảng ngày cập nhật">
                    <DatePicker.RangePicker
                      {...getRangePickerProps({
                        value: filterValues.updateDateRange,
                        onChange: (dates: any) => setFilterValues((p) => ({ ...p, updateDateRange: dates })),
                      })}
                      style={{ width: '100%', borderRadius: radiusPill, height: 38 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Địa điểm (Tỉnh/Thành phố)">
                    <Select
                      placeholder="Tất cả tỉnh/thành phố"
                      value={filterValues.provinceId}
                      onChange={(val) => setFilterValues((p) => ({ ...p, provinceId: val }))}
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                      }
                      options={VIETNAM_PROVINCE_OPTIONS}
                      style={{ ...selectStyle, width: '100%' }}
                    />
                  </SidebarFilterField>
              </>
            </>
          }
        >
          <DataTable
            columns={columns}
            dataSource={data}
            rowKey="id"
            rowActions={getRowActions}
            loading={loading}
            scroll={{ x: 'max-content' }}
          />
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </FilterTableLayout>

        {/* Drawer Form (Create / Edit / Detail) */}
        {isModalOpen && (
          <LritStationForm
            open={true}
            mode={modalMode}
            editId={editingId}
            initialData={selectedRecord}
            orgUnits={filteredOrgUnits}
            symbolOptions={symbols}
            onClose={() => {
              setIsModalOpen(false);
              setEditingId(null);
              setSelectedRecord(null);
            }}
            onSuccess={() => {
              setIsModalOpen(false);
              setEditingId(null);
              setSelectedRecord(null);
              refreshList();
            }}
          />
        )}

        {/* History Drawer */}
        <Drawer
          size={960}
          placement="right"
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          closable={false}
          extra={<Button type="text" aria-label="Đóng lịch sử thay đổi" onClick={() => setHistoryModalOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
          }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  {selectedRecord ? `Lịch sử thay đổi — ${selectedRecord.name}` : 'Lịch sử thay đổi'}
                </span>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusSm, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                  {`Tổng cộng ${historyRecords.length}`}
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
                onPressEnter={() => setHistorySearch(historySearchInput.trim())}
                style={{ ...inputStyle, flex: 1 }}
              />
              <DatePicker.RangePicker
                {...getRangePickerProps({
                  value: (historyDateFrom && historyDateTo)
                    ? [dayjs(historyDateFrom), dayjs(historyDateTo)]
                    : (historyDateFrom ? [dayjs(historyDateFrom), null] : (historyDateTo ? [null, dayjs(historyDateTo)] : null)),
                  onChange: (dates: any) => {
                    if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                      setHistoryDateFrom('');
                      setHistoryDateTo('');
                    } else {
                      setHistoryDateFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                      setHistoryDateTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                    }
                  },
                  style: { ...inputStyle, width: 280 },
                })}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                loading={loadingHistory}
                onClick={() => {
                  setHistorySearch(historySearchInput.trim());
                  if (selectedRecord) {
                    setLoadingHistory(true);
                    lritStationService.getHistory(selectedRecord.id).then((res) => {
                      setHistoryRecords(res || []);
                    }).catch(() => {
                      toast.error('Không thể tải lịch sử thay đổi');
                    }).finally(() => {
                      setLoadingHistory(false);
                    });
                  }
                }}
                style={primaryButtonStyle}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {loadingHistory && historyRecords.length === 0 ? (
              <LoadingSkeleton columnCount={4} rowCount={5} />
            ) : (
              renderHistoryTimeline(
                historyRecords.filter((item) => {
                  if (!historySearch && !historyDateFrom && !historyDateTo) return true;
                  const q = historySearch.toLowerCase().trim();
                  const ts = historyTimestamp(item);
                  if (historyDateFrom && ts && dayjs(ts).isBefore(dayjs(historyDateFrom))) return false;
                  if (historyDateTo && ts && dayjs(ts).isAfter(dayjs(historyDateTo))) return false;
                  if (!q) return true;
                  const act = historyActor(item).toLowerCase();
                  const fn = historyFieldName(historyField(item)).toLowerCase();
                  const ov = String(historyOldValue(item) || '').toLowerCase();
                  const nv = String(historyNewValue(item) || '').toLowerCase();
                  return act.includes(q) || fn.includes(q) || ov.includes(q) || nv.includes(q);
                })
              )
            )}
          </div>
        </Drawer>

        {/* Approval Modal */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approveLevel}
          onConfirm={handleApprove}
          onCancel={() => setApproveModalOpen(false)}
        />

        {/* Reject Modal */}
        <Modal
          title="Từ chối"
          open={rejectModalOpen}
          onOk={handleReject}
          onCancel={() => setRejectModalOpen(false)}
          okText="Từ chối"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối:</p>
          <Input.TextArea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
            maxLength={1000}
            showCount
            style={textAreaStyle}
          />
        </Modal>
      </div>
    </ThemeTokenProvider>
  );
};

export default LritStationList;
