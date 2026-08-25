import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tag,
  Input,
  Select,
  Modal,
  Space,
  Button,
  Drawer,
  DatePicker,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import EmptyState from '../../components/EmptyState';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { OrgUnitTreeSelect, normalizeSearchText } from '../../components/org-unit';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import {
  CONDITION_STATUS_OPTIONS,
  CONDITION_STATUS_TAG_MAP,
  APPROVAL_STATUS_TAG_MAP,
  ApprovalStatus,
} from '../../types/vtsSystem';
import { UNIT_OF_MEASURE_MAP } from '../../types/aisSystem';
import type {
  AisSystemListItem,
  AisSystemResponse,
} from '../../types/aisSystem';
import type { HistoryEntry } from '../../types/radarStation';
import { aisSystemService } from '../../services/aisSystemService';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';
import { AisSystemFormModal } from './AisSystemFormModal';
import { AisSystemDetailDrawer } from './AisSystemDetailDrawer';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import toast from '../../components/ToastNotification';

import {
  statusDraft,
  statusOperational,
  statusCritical,
  statusAttention,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  surfacePage,
  spaceMd,
  spaceSm,
  spaceXs,
  spaceLg,
  spaceXl,
  fontSizeLg,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
  spaceFormField,
  radiusPill,
  radiusSm,
  radiusMd,
  primaryButtonStyle,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  borderDefault,
} from '../../tokens';
import { colors } from '../../theme';

const HISTORY_FIELD_ORDER = [
  'orgUnitId',
  'orgUnitName',
  'vtsOperationCenterId',
  'vtsOperationCenterName',
  'operatingOrgId',
  'operatingOrgName',
  'code',
  'name',
  'provinceId',
  'detailedLocation',
  'unitOfMeasure',
  'quantity',
  'model',
  'specifications',
  'manufacturer',
  'commissioningYear',
  'conditionStatus',
  'maintenanceInfo',
  'note',
  'approvalStatus',
  'geometryType',
  'coordinates',
  'symbolId',
];

// ── History helpers ──────────────────────────────────────────────

function historyFieldName(fn: string): string {
  const map: Record<string, string> = {
    name: 'Tên thiết bị AIS',
    code: 'Mã thiết bị AIS',
    province: 'Tỉnh/Thành phố',
    provinceId: 'Địa điểm (Tỉnh/TP)',
    detailedLocation: 'Địa điểm chi tiết',
    unitOfMeasure: 'Đơn vị tính',
    quantity: 'Số lượng',
    model: 'Model',
    specifications: 'Thông số kỹ thuật',
    manufacturer: 'Hãng sản xuất',
    commissioningYear: 'Năm đưa vào sử dụng',
    conditionStatus: 'Tình trạng',
    maintenanceInfo: 'Thông tin bảo trì',
    note: 'Ghi chú',
    approvalStatus: 'Trạng thái phê duyệt',
    orgUnitName: 'Đơn vị quản lý',
    orgUnitId: 'Đơn vị quản lý',
    operatingOrgName: 'Đơn vị khai thác',
    operatingOrgId: 'Đơn vị khai thác',
    vtsOperationCenterName: 'Thuộc TTDH VTS / Trạm Radar',
    vtsOperationCenterId: 'Thuộc TTDH VTS / Trạm Radar',
    geometryType: 'Loại đối tượng',
    coordinates: 'Tọa độ (GIS)',
    symbolId: 'Biểu tượng',
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
      PROPOSED: 'Chờ Cảng vụ duyệt',
      PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
      PENDING: 'Chờ Cảng vụ duyệt',
      APPROVED_LEVEL1: 'Chờ Cục duyệt',
      APPROVED_LEVEL2: 'Đã duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      REJECTED_LEVEL1: 'Bị Cảng vụ trả về',
      REJECTED_LEVEL2: 'Bị Cục trả về',
    };
    return displayValue.split(';').map((value) => {
      const normalizedValue = String(value || '').trim();
      const fromEnum = statusMap[normalizedValue] || statusMap[normalizedValue.toUpperCase()];
      if (fromEnum) return fromEnum;
      const normText = normalizeHistoryKey(normalizedValue);
      if (normText.includes('cang vu') && (normText.includes('tra ve') || normText.includes('tu choi'))) {
        return 'Bị Cảng vụ trả về';
      }
      if (normText.includes('cuc') && (normText.includes('tra ve') || normText.includes('tu choi'))) {
        return 'Bị Cục trả về';
      }
      if (normText.includes('cho') && (normText.includes('cang vu') || normText.includes('chi cuc') || normText.includes('phe duyet'))) {
        return 'Chờ Cảng vụ duyệt';
      }
      if (normText.includes('cho') && normText.includes('cuc')) {
        return 'Chờ Cục duyệt';
      }
      if (normText.includes('da') && normText.includes('duyet')) {
        return 'Đã duyệt';
      }
      if (normText.includes('tu choi') || normText.includes('tra ve')) {
        return 'Từ chối';
      }
      if (normText.includes('luu tam') || normText.includes('nhap')) {
        return 'Lưu tạm';
      }
      return normalizedValue;
    }).join('; ');
  }
  if (fn === 'unitOfMeasure') {
    const num = Number(displayValue);
    if (!isNaN(num)) return UNIT_OF_MEASURE_MAP[num] || displayValue;
    return displayValue;
  }
  if (fn === 'provinceId') {
    const num = Number(displayValue);
    if (!isNaN(num)) return getProvinceNameById(num) || displayValue;
    return displayValue;
  }
  if (fn === 'conditionStatus') {
    const statusMap: Record<string, string> = {
      OPERATIONAL: 'Đang hoạt động',
      STOPPED: 'Dừng hoạt động',
      MAINTENANCE: 'Đang bảo trì',
      UNDER_CONSTRUCTION: 'Đang xây dựng',
      '1': 'Đang hoạt động',
      '2': 'Dừng hoạt động',
      '3': 'Đang bảo trì',
      '4': 'Đang xây dựng',
    };
    const strVal = String(displayValue || '');
    return statusMap[strVal] || statusMap[strVal.toUpperCase()] || strVal;
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

function historyActor(item: any, userMap?: Map<string, string>): string {
  const raw = item.approvedBy || item.changedBy || item.performedBy || '';
  if (!raw) return '';
  return userMap?.get(raw) || raw;
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
        && key !== 'da phe duyet cap 1'
        && key !== 'da phe duyet cap 2';
    });
  }

  return fields;
}

function parseHistoryAssignments(value: string | null): Map<string, string> {
  const result = new Map<string, string>();
  if (!value) return result;
  value.split(';').forEach((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return;
    result.set(normalizeHistoryKey(part.slice(0, separator)), part.slice(separator + 1).trim());
  });
  return result;
}

function historyChangeRows(item: any): Array<{ field: string; oldValue: string | null; newValue: string | null }> {
  const fields = normalizedHistoryFields(historyField(item));
  const oldValue = historyOldValue(item);
  const newValue = historyNewValue(item);
  const oldAssignments = parseHistoryAssignments(oldValue);
  const newAssignments = parseHistoryAssignments(newValue);

  if (fields.length > 1 && oldAssignments.size === 0 && newAssignments.size === 0) {
    return [{ field: fields.join(', '), oldValue, newValue }];
  }

  if (fields.length === 0) {
    return [{ field: '', oldValue, newValue }];
  }

  return fields.map((field, index) => {
    const displayField = historyFieldName(field);
    const oldAssigned = oldAssignments.get(normalizeHistoryKey(field))
      ?? oldAssignments.get(normalizeHistoryKey(displayField));
    const newAssigned = newAssignments.get(normalizeHistoryKey(field))
      ?? newAssignments.get(normalizeHistoryKey(displayField));
    const oldParts = oldValue?.split(';').map((part) => part.trim()).filter(Boolean) || [];
    const newParts = newValue?.split(';').map((part) => part.trim()).filter(Boolean) || [];
    return {
      field,
      oldValue: oldAssigned ?? (fields.length === 1 ? oldValue : oldParts[index] || null),
      newValue: newAssigned ?? (fields.length === 1 ? newValue : newParts[index] || null),
    };
  });
}

function resolveHistoryActionMeta(group: any, changes: any[]): { label: string; color: string; bg: string } {
  const item = group.items?.[0] || {};
  const rawStatus = String(item.status ?? item.action ?? '').toUpperCase();
  const rawReason = String(item.reason ?? item.ghiChu ?? item.note ?? '').toLowerCase();
  const level = Number(item.approvalLevel || 0);

  if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('tao moi')) {
    return { label: 'Tạo mới', color: statusOperational, bg: `${statusOperational}18` };
  }

  if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || item.changedField?.includes('đính kèm')) {
    return { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c718' };
  }
  if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xóa tệp') || rawReason.includes('xoa tep')) {
    return { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c18' };
  }

  if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('chỉnh sửa')) {
    return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
  }

  const approvalChange = changes.find((c: any) => {
    const k = normalizeHistoryKey(c.field);
    return k === 'approvalstatus' || k === 'trang thai phe duyet';
  });

  if (approvalChange) {
    const nv = normalizeHistoryKey(approvalChange.newValue || '');
    if (nv.includes('cang vu tra ve') || nv.includes('rejected_level1') || (nv.includes('tra ve') && nv.includes('cang vu'))) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv.includes('cuc tra ve') || nv.includes('rejected_level2') || (nv.includes('tra ve') && nv.includes('cuc'))) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv === 'cho cuc duyet' || nv.includes('da phe duyet cap 1') || nv.includes('approved_level1') || nv.includes('cuc duyet')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (nv === 'da duyet' || nv.includes('da phe duyet') || nv.includes('approved')) {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (nv.includes('tu choi') || nv.includes('rejected') || nv.includes('tra ve')) {
      return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv.includes('cho cang vu duyet') || nv.includes('cho phe duyet') || nv.includes('pending') || nv.includes('proposed')) {
      return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
    }
  }

  if (level === 1 || String(item.approvalLevel).includes('LEVEL_1') || rawReason.includes('cấp 1') || rawReason.includes('cap 1') || rawStatus === 'UNDER_REVIEW') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
  }
  if (level === 2 || String(item.approvalLevel).includes('LEVEL_2') || rawReason.includes('cấp 2') || rawReason.includes('cap 2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
    return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
  }
  if (rawStatus === 'SUBMITTED' || rawStatus === 'PENDING' || rawReason.includes('trình duyệt') || rawReason.includes('trinh duyet')) {
    return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
  }
  if (rawStatus === 'DELETED' || rawStatus === 'DELETE' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa') || rawReason.includes('xoa')) {
    return { label: 'Xóa', color: '#64748b', bg: '#64748b18' };
  }

  return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
}

function renderHistoryValueTag(field: string, val: string | null) {
  if (val === null || val === undefined || val === '—') {
    return <span style={{ color: textTertiary }}>—</span>;
  }
  const normKey = normalizeHistoryKey(field);
  const normVal = normalizeHistoryKey(val);

  if (normKey === 'approvalstatus' || normKey === 'trang thai phe duyet' || normKey.includes('phe duyet') || normKey.includes('trang thai')) {
    if (normVal === 'da duyet' || normVal === 'da phe duyet' || normVal === 'approved' || normVal === 'approved_level2') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', border: `1px solid ${statusOperational}40`, borderRadius: radiusPill, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: `${statusOperational}15`, color: statusOperational, whiteSpace: 'nowrap' }}>
          {val}
        </span>
      );
    }
    if (normVal === 'cho cuc duyet' || normVal === 'approved_level1' || normVal.includes('cap 1') || normVal.includes('cuc duyet')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', border: '1px solid #13C2C240', borderRadius: radiusPill, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: '#13C2C215', color: '#13C2C2', whiteSpace: 'nowrap' }}>
          {val}
        </span>
      );
    }
    if (normVal === 'cho cang vu duyet' || normVal === 'cho phe duyet' || normVal === 'cho duyet' || normVal === 'pending' || normVal === 'pending_approval' || normVal === 'proposed' || normVal.includes('cang vu')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', border: `1px solid ${statusAttention}40`, borderRadius: radiusPill, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: `${statusAttention}15`, color: statusAttention, whiteSpace: 'nowrap' }}>
          {val}
        </span>
      );
    }
    if (normVal === 'tu choi' || normVal.includes('rejected') || normVal.includes('tra ve')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', border: `1px solid ${statusCritical}40`, borderRadius: radiusPill, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: `${statusCritical}15`, color: statusCritical, whiteSpace: 'nowrap' }}>
          {val}
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', border: `1px solid ${statusDraft}40`, borderRadius: radiusPill, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: `${statusDraft}15`, color: statusDraft, whiteSpace: 'nowrap' }}>
        {val}
      </span>
    );
  }

  return <span>{val}</span>;
}

export const AisSystemList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState<AisSystemListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Filter sidebar states
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [keyword, setKeyword] = useState<string>('');
  const [orgUnitId, setOrgUnitId] = useState<string | undefined>();
  const [vtsOperationCenterId, setVtsOperationCenterId] = useState<string | undefined>();
  const [provinceId, setProvinceId] = useState<number | undefined>();
  const [commissioningYear, setCommissioningYear] = useState<number | undefined>();
  const [conditionStatus, setConditionStatus] = useState<number | undefined>();
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string | undefined>();

  // Reference data
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [opCenters, setOpCenters] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);

  // Modals & Drawers
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AisSystemResponse | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerItem, setDrawerItem] = useState<AisSystemResponse | null>(null);

  // History Drawer
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [historyTargetRecord, setHistoryTargetRecord] = useState<AisSystemListItem | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Approval Modals
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'C1' | 'C2'>('C1');
  const [approveTargetId, setApproveTargetId] = useState<string>('');
  const [approveReason, setApproveReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');

  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();

  const canCreate = hasPermission('aissystem:create');
  const canUpdate = hasPermission('aissystem:update');
  const canDelete = hasPermission('aissystem:delete');
  const canHistory = hasPermission('aissystem:history');
  const canApproveC1 = hasPermission('aissystem:approvec1');
  const canApproveC2 = hasPermission('aissystem:approvec2');

  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  const loadReferenceData = useCallback(async () => {
    try {
      const [orgRes, opRes, userRes] = await Promise.allSettled([
        organizationService.list({ pageSize: 1000 }),
        vtsOperationCenterService.getOptions(),
        userService.list({ pageSize: 1000 }),
      ]);
      if (orgRes.status === 'fulfilled' && orgRes.value && Array.isArray(orgRes.value.data)) {
        setOrgUnits(orgRes.value.data);
      }
      if (opRes.status === 'fulfilled' && Array.isArray(opRes.value)) {
        setOpCenters(opRes.value.map((c: any) => ({ id: c.id, name: c.name, orgUnitId: c.orgUnitId })));
      }
      if (userRes.status === 'fulfilled' && userRes.value) {
        const users = userRes.value.data || (userRes.value as any).content || [];
        const m = new Map<string, string>();
        users.forEach((u: any) => m.set(u.id, u.fullName || u.username || u.id));
        setUserMap(m);
      }
    } catch {
      // ignore
    }
  }, []);

  const filteredOpCenters = useMemo(() => {
    if (!orgUnitId) return opCenters;
    return opCenters.filter((c) => c.orgUnitId === orgUnitId);
  }, [opCenters, orgUnitId]);

  const handleOrgUnitChange = (val?: string) => {
    setOrgUnitId(val);
    if (val) {
      if (vtsOperationCenterId && !opCenters.some((c) => c.id === vtsOperationCenterId && c.orgUnitId === val)) {
        setVtsOperationCenterId(undefined);
      }
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setIsError(false);

      const effectiveApprovalStatus = activeTab === 'ALL' ? approvalStatusFilter : activeTab;

      const res = await aisSystemService.search({
        keyword: keyword.trim() || undefined,
        orgUnitId: orgUnitId || undefined,
        vtsOperationCenterId: vtsOperationCenterId || undefined,
        provinceId: provinceId !== undefined ? provinceId : undefined,
        commissioningYear: commissioningYear !== undefined ? commissioningYear : undefined,
        conditionStatus: conditionStatus !== undefined ? conditionStatus : undefined,
        approvalStatus: effectiveApprovalStatus || undefined,
        page,
        size: pageSize,
      });

      setData(res.items);
      setTotal(res.total);
      setStatusCounts(res.statusCounts || {});
    } catch (err: any) {
      setIsError(true);
      toast.error('Không thể tải danh sách hệ thống AIS');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    keyword,
    orgUnitId,
    vtsOperationCenterId,
    provinceId,
    commissioningYear,
    conditionStatus,
    approvalStatusFilter,
    activeTab,
  ]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setKeyword('');
    setOrgUnitId(undefined);
    setVtsOperationCenterId(undefined);
    setProvinceId(undefined);
    setCommissioningYear(undefined);
    setConditionStatus(undefined);
    setApprovalStatusFilter(undefined);
    setActiveTab('ALL');
    setPage(1);
  };

  const handleViewDetail = async (record: AisSystemListItem) => {
    try {
      const full = await aisSystemService.getById(record.id);
      setDrawerItem(full);
      setDrawerVisible(true);
    } catch {
      toast.error('Không thể tải chi tiết');
    }
  };

  const handleEdit = async (record: AisSystemListItem | AisSystemResponse) => {
    try {
      const full = await aisSystemService.getById(record.id);
      setSelectedItem(full);
      setModalVisible(true);
    } catch {
      toast.error('Không thể tải thông tin chỉnh sửa');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await aisSystemService.delete(id);
      toast.success('Xóa hệ thống AIS thành công');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Xóa thất bại');
    }
  };

  const handleViewHistory = async (record: AisSystemListItem) => {
    setHistoryTargetRecord(record);
    setHistoryDrawerVisible(true);
    setLoadingHistory(true);
    setHistorySearch('');
    setHistoryDateFrom('');
    setHistoryDateTo('');
    try {
      const h = await aisSystemService.getHistory(record.id);
      setHistoryRecords(h || []);
    } catch {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setLoadingHistory(false);
    }
  };

  const openApproveModal = (id: string, level: 'C1' | 'C2') => {
    setApproveTargetId(id);
    setApproveLevel(level);
    setApproveReason('');
    setApproveModalVisible(true);
  };

  const handleConfirmApprove = async () => {
    if (!approveTargetId) return;
    try {
      setActionLoading(true);
      if (approveLevel === 'C1') {
        await aisSystemService.approveC1(approveTargetId, 'APPROVED', approveReason);
        toast.success('Phê duyệt cấp 1 thành công');
      } else {
        await aisSystemService.approveC2(approveTargetId, 'APPROVED', approveReason);
        toast.success('Phê duyệt cấp 2 thành công');
      }
      setApproveModalVisible(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi phê duyệt');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectTargetId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    if (!rejectTargetId) return;
    try {
      setActionLoading(true);
      await aisSystemService.reject(rejectTargetId, rejectReason.trim());
      toast.success('Đã từ chối phê duyệt');
      setRejectModalVisible(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const statusTabsItems = useMemo(() => {
    const allCount = total;
    const draftCount = statusCounts['DRAFT'] || 0;
    const pendingCount = (statusCounts['PENDING_APPROVAL'] || 0) + (statusCounts['PROPOSED'] || 0);
    const approvedL1Count = statusCounts['APPROVED_LEVEL1'] || 0;
    const approvedCount = (statusCounts['APPROVED'] || 0) + (statusCounts['APPROVED_LEVEL2'] || 0);
    const rejectedCount = (statusCounts['REJECTED'] || 0) + (statusCounts['REJECTED_LEVEL1'] || 0) + (statusCounts['REJECTED_LEVEL2'] || 0);

    return [
      { key: 'ALL', label: 'Tất cả', count: allCount, color: actionPrimary },
      { key: 'DRAFT', label: 'Lưu tạm', count: draftCount, color: statusDraft },
      { key: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt', count: pendingCount, color: statusAttention },
      { key: 'APPROVED_LEVEL1', label: 'Chờ Cục duyệt', count: approvedL1Count, color: '#13C2C2' },
      { key: 'APPROVED', label: 'Đã duyệt', count: approvedCount, color: statusOperational },
      { key: 'REJECTED_LEVEL1', label: 'Từ chối', count: rejectedCount, color: statusCritical },
    ];
  }, [total, statusCounts]);

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
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 250,
      render: (orgName: string) => orgName || '—',
    },
    {
      key: 'code',
      label: 'Mã thiết bị',
      dataIndex: 'code',
      width: 170,
      sortable: true,
      render: (code: string, record: AisSystemListItem) => (
        <a
          onClick={() => handleViewDetail(record)}
          style={{ fontWeight: 600, color: colors.sidebarBg, cursor: 'pointer' }}
        >
          {code || '—'}
        </a>
      ),
    },
    {
      key: 'name',
      label: 'Tên thiết bị / trạm AIS',
      dataIndex: 'name',
      width: 320,
      sortable: true,
      render: (name: string, record: AisSystemListItem) => (
        <span
          onClick={() => handleViewDetail(record)}
          style={{ cursor: 'pointer', fontWeight: 500 }}
        >
          {name || '—'}
        </span>
      ),
    },
    {
      key: 'vtsOperationCenterName',
      label: 'Thuộc TTDH VTS / Trạm Radar',
      dataIndex: 'vtsOperationCenterName',
      width: 320,
      render: (cName: string) => cName || '—',
    },
    {
      key: 'operatingOrgName',
      label: 'Đơn vị khai thác',
      dataIndex: 'operatingOrgName',
      width: 250,
      render: (oName: string) => oName || '—',
    },
    {
      key: 'provinceId',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 200,
      render: (pId: number) => (pId ? getProvinceNameById(pId) || pId : '—'),
    },
    {
      key: 'unitOfMeasure',
      label: 'Đơn vị tính',
      dataIndex: 'unitOfMeasureLabel',
      width: 140,
      align: 'center' as const,
      render: (uLabel: string, record: AisSystemListItem) =>
        uLabel || (record.unitOfMeasure ? UNIT_OF_MEASURE_MAP[record.unitOfMeasure] : '—'),
    },
    {
      key: 'quantity',
      label: 'Số lượng',
      dataIndex: 'quantity',
      width: 110,
      align: 'center' as const,
      render: (q: number) => q ?? '—',
    },
    {
      key: 'commissioningYear',
      label: 'Năm đưa vào sử dụng',
      dataIndex: 'commissioningYear',
      width: 180,
      align: 'center' as const,
      render: (y: number) => y || '—',
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 170,
      align: 'center' as const,
      render: (status: number) => {
        const c = CONDITION_STATUS_TAG_MAP[status] || { label: '—', color: 'default' };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 200,
      align: 'center' as const,
      render: (status: ApprovalStatus) => {
        const a = APPROVAL_STATUS_TAG_MAP[status] || { label: '—', color: 'default' };
        return <Tag color={a.color}>{a.label}</Tag>;
      },
    },
    {
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 200,
      render: (name: string) => name || '—',
    },
    {
      key: 'updatedAt',
      label: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      width: 180,
      render: (date?: string) => (date ? new Date(date).toLocaleString('vi-VN') : '—'),
    },
  ], [page, pageSize]);

  const rowActions = useCallback((record: AisSystemListItem) => {
    const isDraft = record.approvalStatus === ApprovalStatus.DRAFT || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2;
    const isPendingC1 = record.approvalStatus === ApprovalStatus.PROPOSED || record.approvalStatus === ApprovalStatus.PENDING_APPROVAL;
    const isApprovedL1 = record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1;
    const isApproved = record.approvalStatus === ApprovalStatus.APPROVED || record.approvalStatus === ApprovalStatus.APPROVED_LEVEL2;

    const isCreator = user?.id && record.createdBy === user.id;

    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[] = [];

    // 1. Xem chi tiết
    actions.push({
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Xem chi tiết',
      onClick: () => handleViewDetail(record),
    });

    // 2. Lịch sử
    if (canHistory) {
      actions.push({
        key: 'history',
        icon: <HistoryOutlined />,
        label: 'Lịch sử',
        onClick: () => handleViewHistory(record),
      });
    }

    // 3. Chỉnh sửa
    if (canUpdate && !isApproved) {
      actions.push({
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Chỉnh sửa',
        onClick: () => handleEdit(record),
      });
    }

    // 4. Gửi phê duyệt
    if (canUpdate && isDraft) {
      actions.push({
        key: 'submit',
        icon: <SendOutlined />,
        label: 'Gửi phê duyệt',
        onClick: async () => {
          try {
            await aisSystemService.submit(record.id);
            toast.success('Gửi phê duyệt thành công');
            fetchData();
          } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Có lỗi xảy ra');
          }
        },
      });
    }

    // 5. Phê duyệt & Từ chối cấp Cảng vụ
    if (canApproveC1 && isPendingC1) {
      const isSelfApproval = Boolean(isCreator);
      actions.push({
        key: 'approveC1',
        icon: <CheckCircleOutlined />,
        disabled: isSelfApproval,
        label: isSelfApproval ? 'Phê duyệt cấp Cảng vụ (không thể tự duyệt)' : 'Phê duyệt cấp Cảng vụ',
        onClick: () => !isSelfApproval && openApproveModal(record.id, 'C1'),
      });
      actions.push({
        key: 'rejectC1',
        icon: <CloseCircleOutlined />,
        danger: true,
        disabled: isSelfApproval,
        label: isSelfApproval ? 'Từ chối cấp Cảng vụ (không thể tự duyệt)' : 'Từ chối cấp Cảng vụ',
        onClick: () => !isSelfApproval && openRejectModal(record.id),
      });
    }

    // 6. Phê duyệt & Từ chối cấp Cục
    if (canApproveC2 && isApprovedL1) {
      const isSelfApproval = Boolean(isCreator);
      const isSameApprover = Boolean(user?.id && record.approverLevel1 === user.id);
      const isBlocked = isSelfApproval || isSameApprover;
      const blockedReason = isSelfApproval
        ? ' (không thể tự duyệt)'
        : isSameApprover
        ? ' (người duyệt cấp Cục không được trùng người duyệt cấp Cảng vụ)'
        : '';

      actions.push({
        key: 'approveC2',
        icon: <CheckCircleOutlined />,
        disabled: isBlocked,
        label: `Phê duyệt cấp Cục${blockedReason}`,
        onClick: () => !isBlocked && openApproveModal(record.id, 'C2'),
      });
      actions.push({
        key: 'rejectC2',
        icon: <CloseCircleOutlined />,
        danger: true,
        disabled: isBlocked,
        label: `Từ chối cấp Cục${blockedReason}`,
        onClick: () => !isBlocked && openRejectModal(record.id),
      });
    }

    // 7. Xóa
    if (canDelete && (isDraft || isApproved)) {
      actions.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        danger: true,
        label: 'Xóa',
        onClick: () => {
          Modal.confirm({
            title: 'Xác nhận xóa hệ thống AIS',
            content: 'Bạn có chắc chắn muốn xóa bản ghi này?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: () => handleDelete(record.id),
          });
        },
      });
    }

    return actions;
  }, [canUpdate, canDelete, canHistory, canApproveC1, canApproveC2, user?.id, fetchData]);

  // ── History rendering (Identical to VTS System) ─────────────────

  const fmtTime = (ts: string) => {
    const d = dayjs(ts);
    return `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`;
  };

  const renderHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const q = historySearch.toLowerCase().trim();

    const filtered = sorted.filter((r) => {
      if (historyDateFrom && new Date(historyTimestamp(r)) < new Date(historyDateFrom)) return false;
      if (historyDateTo && new Date(historyTimestamp(r)) > new Date(historyDateTo)) return false;
      if (q) {
        const actorName = historyActor(r, userMap);
        const txt = `${historyField(r)} ${historyOldValue(r)} ${historyNewValue(r)} ${actorName} ${r.reason || ''}`.toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });

    const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
    for (const r of filtered) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r, userMap);
      if (prev && prev.tsSec === sec && prev.actor === actor) prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor, items: [r] });
    }

    if (groups.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
            {q || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceMd }}>
        {groups.map((g, gi) => {
          const changes = g.items.flatMap((item: any) => historyChangeRows(item)).sort((a: any, b: any) => {
            const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
            const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          });
          const unitName = g.items[0]?.orgUnitName || g.items[0]?.unitName || historyTargetRecord?.orgUnitName || '—';
          const isCreate = changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
          const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';

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
            return historyFieldValue(fn, raw);
          };

          if (changes.length === 0) return null;
          const actionMeta = resolveHistoryActionMeta(g, changes);

          return (
            <div
              key={gi}
              style={{
                display: 'grid',
                gridTemplateColumns: '240px minmax(0, 1fr)',
                gap: spaceLg,
                alignItems: 'start',
                marginBottom: gi < groups.length - 1 ? spaceMd : 0,
              }}
            >
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spaceSm, marginBottom: spaceXs }}>
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
                    Người cập nhật: <span style={{ color: textPrimary, fontWeight: fontWeightBold }}>{userMap.get(g.actor) || g.actor || '—'}</span>
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
                  const validChanges = changes.filter(c => formatHistoryValue(c.field, c.oldValue) != null || formatHistoryValue(c.field, c.newValue) != null);
                  const reasons = g.items.map((i: any) => i.reason || i.ghiChu || i.note).filter(Boolean);

                  if (validChanges.length > 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                        {validChanges.map((change, ri: number) => {
                          const fn = change.field;
                          const ov = formatHistoryValue(fn, change.oldValue);
                          const nv = formatHistoryValue(fn, change.newValue);
                          return isCreate ? (
                            <div key={`${fn}-${ri}`} style={{ display: 'grid', gridTemplateColumns: '170px minmax(0, 1fr)', alignItems: 'flex-start', gap: spaceMd, fontSize: fontSizeMd, lineHeight: 1.6 }}>
                              <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                              <div style={{ minWidth: 0, overflowWrap: 'break-word' }}>{renderHistoryValueTag(fn, nv)}</div>
                            </div>
                          ) : (
                            <div key={`${fn}-${ri}`} style={{ display: 'grid', gridTemplateColumns: '170px minmax(120px, 1fr) 24px minmax(120px, 1fr)', alignItems: 'center', gap: spaceSm, fontSize: fontSizeMd, lineHeight: 1.6 }}>
                              <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                              <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflowWrap: 'break-word' }}>
                                {renderHistoryValueTag(fn, ov)}
                              </div>
                              <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none' }}>→</div>
                              <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflowWrap: 'break-word' }}>
                                {renderHistoryValueTag(fn, nv)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  if (reasons.length > 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
                        {reasons.map((r: string, ri: number) => (
                          <div key={ri} style={{ fontSize: fontSizeMd, color: textPrimary }}>
                            {r}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>;
                })()}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const historyGroupCount = useMemo(() => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...historyRecords].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const groups: any[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r);
      if (prev && prev.tsSec === sec && prev.actor === actor) prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor, items: [r] });
    }
    return groups.length;
  }, [historyRecords]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Hệ thống AIS' }]}
        actions={
          canCreate
            ? [
                {
                  key: 'create',
                  label: 'Thêm mới',
                  icon: <PlusOutlined />,
                  variant: 'primary' as const,
                  onClick: () => {
                    setSelectedItem(null);
                    setModalVisible(true);
                  },
                },
              ]
            : []
        }
      />

      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        onFilterApply={handleSearch}
        onFilterReset={handleReset}
        loading={loading}
        error={isError}
        onRetry={fetchData}
        filterContent={
          <>
            <div style={{ marginBottom: 12, marginTop: spaceMd }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Đơn vị quản lý
              </div>
              <OrgUnitTreeSelect
                organizations={orgUnits}
                placeholder="Tất cả"
                allowClear
                listHeight={256}
                value={orgUnitId}
                onChange={handleOrgUnitChange}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Thuộc TTDH VTS / Trạm Radar
              </div>
              <Select
                placeholder="Tất cả"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                }
                value={vtsOperationCenterId}
                onChange={setVtsOperationCenterId}
                options={filteredOpCenters.map((c) => ({ value: c.id, label: c.name }))}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Từ khóa tìm kiếm
              </div>
              <Input
                placeholder="Tìm theo mã, tên thiết bị..."
                allowClear
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Địa điểm (Tỉnh/TP)
              </div>
              <Select
                placeholder="Tất cả"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                }
                value={provinceId}
                onChange={setProvinceId}
                options={VIETNAM_PROVINCE_OPTIONS}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Năm đưa vào sử dụng
              </div>
              <DatePicker
                picker="year"
                placeholder="Chọn năm"
                value={commissioningYear ? dayjs(String(commissioningYear), 'YYYY') : null}
                onChange={(d) => setCommissioningYear(d ? d.year() : undefined)}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Tình trạng
              </div>
              <Select
                placeholder="Tất cả"
                allowClear
                value={conditionStatus}
                onChange={setConditionStatus}
                options={CONDITION_STATUS_OPTIONS}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              />
            </div>
            {activeTab === 'ALL' && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                    Trạng thái phê duyệt
                  </div>
                  <Select
                    placeholder="Tất cả"
                    allowClear
                    value={approvalStatusFilter}
                    onChange={setApprovalStatusFilter}
                    options={[
                      { value: 'DRAFT', label: 'Lưu tạm' },
                      { value: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt' },
                      { value: 'APPROVED_LEVEL1', label: 'Chờ Cục duyệt' },
                      { value: 'APPROVED', label: 'Đã duyệt' },
                      { value: 'REJECTED_LEVEL1', label: 'Cảng vụ trả về' },
                      { value: 'REJECTED_LEVEL2', label: 'Cục trả về' },
                    ]}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  />
                </div>
              </>
            )}
          </>
        }
        hideFilterToggle={true}
        statusTabs={statusTabsItems}
        onStatusTabChange={(key) => {
          setActiveTab(key);
          setPage(1);
        }}
      >
        <DataTable
          columns={columns}
          dataSource={data}
          rowKey="id"
          rowActions={rowActions}
          loading={false}
          scroll={{ x: 'max-content' }}
          emptyState={
            data.length === 0 && !loading ? (
              <EmptyState description="Không tìm thấy thiết bị AIS nào phù hợp" />
            ) : undefined
          }
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

      {/* Form Modal */}
      <AisSystemFormModal
        visible={modalVisible}
        item={selectedItem}
        onCancel={() => {
          setModalVisible(false);
          setSelectedItem(null);
        }}
        onSuccess={() => {
          setModalVisible(false);
          setSelectedItem(null);
          fetchData();
        }}
      />

      {/* Detail Drawer */}
      <AisSystemDetailDrawer
        visible={drawerVisible}
        item={drawerItem}
        onClose={() => {
          setDrawerVisible(false);
          setDrawerItem(null);
        }}
        onEdit={(it) => {
          setDrawerVisible(false);
          handleEdit(it);
        }}
        onRefresh={() => {
          fetchData();
          if (drawerItem) {
            aisSystemService.getById(drawerItem.id).then(setDrawerItem).catch(() => {});
          }
        }}
      />

      {/* ── History Drawer (Identical to VTS System) ─────────────── */}
      <Drawer
        width={960}
        placement="right"
        open={historyDrawerVisible}
        onClose={() => {
          setHistoryDrawerVisible(false);
          setHistoryTargetRecord(null);
        }}
        closable={false}
        extra={
          <Button
            type="text"
            aria-label="Đóng lịch sử thay đổi"
            onClick={() => {
              setHistoryDrawerVisible(false);
              setHistoryTargetRecord(null);
            }}
            style={drawerCloseBtnStyle}
          >
            ✕
          </Button>
        }
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
                {historyTargetRecord ? `Lịch sử thay đổi — ${historyTargetRecord.name || historyTargetRecord.code}` : 'Lịch sử thay đổi'}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                Tổng cộng {historyGroupCount}
              </span>
            </Space>
          </div>
        }
      >
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input
              placeholder="Tìm kiếm nội dung thay đổi..."
              allowClear
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
            />
            <DatePicker
              placeholder="Từ ngày"
              value={historyDateFrom ? dayjs(historyDateFrom) : null}
              onChange={(d) => setHistoryDateFrom(d ? d.startOf('minute').format('YYYY-MM-DDTHH:mm:ss') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }}
              format="DD/MM/YYYY HH:mm"
              showTime={{ format: 'HH:mm' }}
            />
            <DatePicker
              placeholder="Đến ngày"
              value={historyDateTo ? dayjs(historyDateTo) : null}
              onChange={(d) => setHistoryDateTo(d ? d.endOf('minute').format('YYYY-MM-DDTHH:mm:ss') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }}
              format="DD/MM/YYYY HH:mm"
              showTime={{ format: 'HH:mm' }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loadingHistory ? (
            <LoadingSkeleton rows={5} />
          ) : (
            renderHistoryTimeline(historyRecords)
          )}
        </div>
      </Drawer>

      {/* Modal Approve */}
      <Modal
        title={`Xác nhận phê duyệt ${approveLevel === 'C1' ? 'cấp Cảng vụ/Chi cục' : 'cấp Cục'}`}
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        onOk={handleConfirmApprove}
        confirmLoading={actionLoading}
        okText={approveLevel === 'C1' ? 'Phê duyệt cấp Cảng vụ' : 'Phê duyệt cấp Cục'}
        okButtonProps={{ style: { ...primaryButtonStyle, borderRadius: radiusPill, height: 40, background: approveLevel === 'C1' ? '#13C2C2' : '#1BAF7A', borderColor: approveLevel === 'C1' ? '#13C2C2' : '#1BAF7A' } }}
        cancelButtonProps={{ style: { borderRadius: radiusPill, height: 40 } }}
      >
        <div style={{ marginTop: spaceFormField, marginBottom: spaceLg }}>
          <label style={{ display: 'block', marginBottom: spaceSm, fontWeight: fontWeightMedium }}>
            Nội dung / Ý kiến phê duyệt (không bắt buộc)
          </label>
          <Input.TextArea
            rows={3}
            value={approveReason}
            onChange={(e) => setApproveReason(e.target.value)}
            placeholder="Nhập ý kiến phê duyệt nếu có..."
            maxLength={1000}
            showCount
            style={{ borderRadius: radiusMd }}
          />
        </div>
      </Modal>

      {/* Modal Reject */}
      <Modal
        title="Từ chối phê duyệt"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleConfirmReject}
        confirmLoading={actionLoading}
        okText="Từ chối"
        okButtonProps={{ danger: true, style: { borderRadius: radiusPill, height: 40 } }}
        cancelButtonProps={{ style: { borderRadius: radiusPill, height: 40 } }}
      >
        <div style={{ marginTop: spaceFormField, marginBottom: spaceLg }}>
          <label style={{ display: 'block', marginBottom: spaceSm, fontWeight: fontWeightMedium }}>
            Lý do từ chối <span style={{ color: '#D83A52' }}>*</span>
          </label>
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối phê duyệt..."
            maxLength={1000}
            showCount
            style={{ borderRadius: radiusMd }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AisSystemList;
