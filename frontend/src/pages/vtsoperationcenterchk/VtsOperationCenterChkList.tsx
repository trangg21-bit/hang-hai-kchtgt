import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Typography, Modal, Input, Drawer, Button, DatePicker, Space, Select, Radio, Tag } from 'antd';
import {
  HistoryOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { vtsOperationCenterService, type VtsOperationCenterListParams } from '../../services/vtsOperationCenterService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { portCRUD } from '../../services/portService';
import type { VtsOperationCenterListItem, VtsOperationCenterResponse } from '../../types/vtsOperationCenter';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import VtsOperationCenterChkForm from './VtsOperationCenterChkForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import toast, { modal } from '../../components/ToastNotification';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  radiusSm, radiusPill, spaceFormField, spaceMd, spaceSm, spaceLg,
  statusOperational, statusDraft, statusCritical, statusAttention,
  surfacePage, spaceXs, spaceXl, drawerTitleStyle, drawerCloseBtnStyle, selectStyle,
  borderDefault, statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  inputStyle, primaryButtonStyle, textAreaStyle, clientSideStringSorter, clientSideDateSorter,
  clientSideProvinceSorter, clientSideUserSorter, clientSideBadgeSorter,
  getRangePickerProps,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { FilterOrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../components/org-unit';
import SidebarFilterField from '../../components/list-view/SidebarFilterField';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const HISTORY_PAGE_SIZE = 20;

const HISTORY_FIELD_ORDER = [
  'orgUnitId', 'orgUnitName', 'portId', 'portName', 'vtsSystemId', 'vtsSystemName',
  'code', 'name', 'provinceId', 'province', 'detailedLocation', 'coverage', 'conditionStatus', 'note'
];

function historyFieldName(fn: string): string {
  const map: Record<string, string> = {
    name: 'Tên trung tâm điều hành VTS', code: 'Mã trung tâm điều hành VTS', province: 'Tỉnh/Thành phố',
    provinceId: 'Địa điểm (Tỉnh/TP)', detailedLocation: 'Địa điểm chi tiết', address: 'Địa điểm chi tiết',
    coverage: 'Vùng phủ sóng', note: 'Ghi chú', approvalStatus: 'Trạng thái phê duyệt', conditionStatus: 'Tình trạng',
    orgUnitName: 'Đơn vị quản lý', orgUnitId: 'Đơn vị quản lý', portName: 'Thuộc cảng biển', portId: 'Thuộc cảng biển',
    vtsSystemName: 'Thuộc hệ thống VTS', vtsSystemId: 'Thuộc hệ thống VTS',
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

  if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
    return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
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
      return <span style={statusBadgeStyle(statusOperational)}>{val}</span>;
    }
    if (normVal === 'cho cuc duyet' || normVal === 'approved_level1' || normVal.includes('cap 1') || normVal.includes('cuc duyet')) {
      return <span style={statusBadgeStyle('#0082fb')}>{val}</span>;
    }
    if (normVal === 'cho cang vu duyet' || normVal === 'cho phe duyet' || normVal === 'cho duyet' || normVal === 'pending' || normVal === 'pending_approval' || normVal === 'proposed' || normVal.includes('cang vu')) {
      return <span style={statusBadgeStyle(statusAttention)}>{val}</span>;
    }
    if (normVal === 'tu choi' || normVal.includes('rejected') || normVal.includes('tra ve')) {
      return <span style={statusBadgeStyle(statusCritical)}>{val}</span>;
    }
    return <span style={statusBadgeStyle(statusDraft)}>{val}</span>;
  }

  if (normKey === 'conditionstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang')) {
    if (normVal.includes('hoat dong tot') || normVal.includes('good') || normVal.includes('operational') || normVal.includes('hoat dong')) {
      return <span style={statusBadgeStyle(statusOperational)}>{val}</span>;
    }
    if (normVal.includes('can bao duong') || normVal.includes('warning') || normVal.includes('maintenance') || normVal.includes('bao tri')) {
      return <span style={statusBadgeStyle(statusAttention)}>{val}</span>;
    }
    if (normVal.includes('ngung') || normVal.includes('hong') || normVal.includes('stopped') || normVal.includes('critical') || normVal.includes('dung')) {
      return <span style={statusBadgeStyle(statusCritical)}>{val}</span>;
    }
    if (normVal.includes('dang xay dung') || normVal.includes('under_construction')) {
      return <span style={statusBadgeStyle(actionPrimary)}>{val}</span>;
    }
    return <span style={statusBadgeStyle(statusDraft)}>{val}</span>;
  }

  return (
    <span title={val} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>
      {val}
    </span>
  );
}

export default function VtsOperationCenterChkList() {
  const currentUser = useAuthStore((s) => s.user);
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterVtsSystemId, setFilterVtsSystemId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();

  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);
  const [portOptions, setPortOptions] = useState<Array<{ id: string; portName?: string; portCode?: string; orgUnitId?: string }>>([]);
  const [vtsSystemOptions, setVtsSystemOptions] = useState<Array<{ id: string; name?: string; code?: string; orgUnitId?: string }>>([]);

  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const [dataSource, setDataSource] = useState<VtsOperationCenterListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<VtsOperationCenterResponse | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // History drawer state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');

  // Count tabs
  const [countDraft, setCountDraft] = useState<number>(0);
  const [countPendingApproval, setCountPendingApproval] = useState<number>(0);
  const [countApprovedLevel1, setCountApprovedLevel1] = useState<number>(0);
  const [countApproved, setCountApproved] = useState<number>(0);
  const [countRejected, setCountRejected] = useState<number>(0);
  const statusCountFilterKey = useRef<string | null>(null);
  const listRequestId = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const [orgs, ports, systems] = await Promise.all([
          vtsSystemCRUD.getScopedOrgUnitOptions(),
          portCRUD.getOptions(),
          vtsSystemCRUD.getOptions(),
        ]);
        setOrgUnitOptions(orgs.map((o: any) => ({
          id: String(o.id),
          name: o.name || o.unitName || o.tenDonVi || 'Đơn vị',
          code: o.code || o.maDonVi,
          parentId: o.parentId ? String(o.parentId) : undefined,
        })));
        setPortOptions(Array.isArray(ports) ? ports : []);
        setVtsSystemOptions(Array.isArray(systems) ? systems : []);
      } catch (e) {
        console.error('Failed to fetch lookup options', e);
      }
    })();
  }, []);

  const filteredPortOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return portOptions;
    return portOptions.filter((p) => !p.orgUnitId || p.orgUnitId === filterValues.orgUnitId);
  }, [portOptions, filterValues.orgUnitId]);

  const filteredVtsSystemOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return vtsSystemOptions;
    return vtsSystemOptions.filter((v) => !v.orgUnitId || v.orgUnitId === filterValues.orgUnitId);
  }, [vtsSystemOptions, filterValues.orgUnitId]);

  const fetchData = useCallback(async () => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    setIsError(false);
    try {
      const currentStatusCountFilterKey = JSON.stringify([
        filterKeyword, filterConditionStatus, filterOrgUnitId, filterPortId, filterVtsSystemId, filterProvinceId,
        filterUpdatedFrom, filterUpdatedTo,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;
      const params: VtsOperationCenterListParams = {
        page: page,
        size: pageSize,
        keyword: filterKeyword || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
        portId: filterPortId || undefined,
        vtsSystemId: filterVtsSystemId || undefined,
        provinceId: filterProvinceId,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
      };

      const res = await vtsOperationCenterService.search(params);
      if (requestId !== listRequestId.current) return;
      setDataSource(res.items || []);
      setTotal(res.total || 0);

      if (shouldIncludeCounts && res.statusCounts) {
        const counts = res.statusCounts;
        setCountDraft(Number(counts.DRAFT) || 0);
        setCountPendingApproval(Number(counts.PENDING_APPROVAL) || 0);
        setCountApprovedLevel1(Number(counts.APPROVED_LEVEL1) || 0);
        setCountApproved(Number(counts.APPROVED) || 0);
        setCountRejected((Number(counts.REJECTED_LEVEL1) || 0) + (Number(counts.REJECTED_LEVEL2) || 0));
        statusCountFilterKey.current = currentStatusCountFilterKey;
      }
    } catch (err: unknown) {
      if (requestId !== listRequestId.current) return;
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally {
      if (requestId === listRequestId.current) setLoading(false);
    }
  }, [
    page, pageSize, filterKeyword, filterConditionStatus, filterApprovalStatus,
    filterOrgUnitId, filterPortId, filterVtsSystemId, filterProvinceId,
    filterUpdatedFrom, filterUpdatedTo,
  ]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refreshList = useCallback(() => {
    statusCountFilterKey.current = null;
    void fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await vtsOperationCenterService.delete(id);
      toast.success('Xóa thành công');
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi xóa');
    }
  };

  const confirmDelete = (record: VtsOperationCenterListItem) => {
    modal.confirm({
      title: 'Xác nhận xóa trung tâm điều hành VTS',
      icon: <ExclamationCircleOutlined />,
      content: 'Hồ sơ ở trạng thái Lưu tạm sẽ chuyển sang "Đã xóa (lịch sử)": không còn hiển thị trong danh sách nhưng vẫn được giữ lại để đối chiếu.',
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: () => handleDelete(record.id),
    });
  };

  const openApproveModal = (id: string, level: 'c1' | 'c2') => {
    setApproveTargetId(id);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleApprove = async (content: string) => {
    if (!approveTargetId) return;
    try {
      if (approveLevel === 'c1') {
        await vtsOperationCenterService.approveC1(approveTargetId, 'APPROVED', content);
        toast.success('Phê duyệt cấp 1 thành công');
      } else {
        await vtsOperationCenterService.approveC2(approveTargetId, 'APPROVED', content);
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
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    if (!rejectTargetId) return;
    try {
      await vtsOperationCenterService.reject(rejectTargetId, rejectReason.trim());
      toast.success('Đã từ chối');
      setRejectModalOpen(false);
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi từ chối');
    }
  };

  const handleViewHistory = (record: VtsOperationCenterListItem) => {
    setSelectedRecord(record as any);
    setHistoryModalOpen(true);
    setHistoryRecords([]);
    setLoadingHistory(true);
    setHistorySearchInput('');
    setHistorySearch('');
    setHistoryDateFrom('');
    setHistoryDateTo('');

    vtsOperationCenterService.getHistory(record.id).then((res) => {
      setHistoryRecords(res || []);
    }).catch(() => {
      toast.error('Không thể tải lịch sử thay đổi');
    }).finally(() => {
      setLoadingHistory(false);
    });
  };

  const countAll = countDraft + countPendingApproval + countApprovedLevel1 + countApproved + countRejected;

  const statusTabs = useMemo(() => [
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
    setFilterPortId(vals.portId);
    setFilterVtsSystemId(vals.vtsSystemId);
    setFilterProvinceId(vals.provinceId);
    setFilterUpdatedFrom(vals.updateDateRange?.[0] ? dayjs(vals.updateDateRange[0]).startOf('day').toISOString() : undefined);
    setFilterUpdatedTo(vals.updateDateRange?.[1] ? dayjs(vals.updateDateRange[1]).endOf('day').toISOString() : undefined);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilterKeyword('');
    setFilterConditionStatus(undefined);
    setFilterOrgUnitId(undefined);
    setFilterPortId(undefined);
    setFilterVtsSystemId(undefined);
    setFilterProvinceId(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setPage(1);
  };

  // ── History rendering ──────────────────────────────────────────

  const fmtTime = (ts: string) => {
    const d = dayjs(ts);
    return `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`;
  };

  const renderHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r);
      if (prev && prev.tsSec === sec && prev.actor === actor && prev.status === r.status && prev.approvalLevel === r.approvalLevel) {
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
        const changes = g.items.flatMap((item: any) => historyChangeRows(item)).sort((a: any, b: any) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        const unitName = g.items[0]?.orgUnitName || g.items[0]?.unitName || '—';
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
                  const isLongHistoryText = (val: string | null | undefined): boolean => {
                    if (!val) return false;
                    const str = String(val).trim();
                    return str.length > 40 || str.includes('\n') || (str.includes(',') && str.length > 25);
                  };

                  const renderHistoryContent = (field: string, val: string | null, _isOld: boolean = false) => {
                    if (val === null || val === undefined || val === '—' || val === '') {
                      return <span style={{ color: textTertiary }}>—</span>;
                    }
                    const str = String(val).trim();
                    if (str.includes(',') && str.length > 25) {
                      const items = str.split(',').map((s) => s.trim()).filter(Boolean);
                      if (items.length > 1) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                            {items.map((item, idx) => (
                              <div key={idx} style={{ color: textPrimary, fontWeight: fontWeightMedium, lineHeight: '20px', wordBreak: 'break-word' }}>
                                {item}
                              </div>
                            ))}
                          </div>
                        );
                      }
                    }
                    return renderHistoryValueTag(field, val);
                  };

                  const validChanges = changes.filter((c: any) => {
                    if (!c.field && !c.oldValue && !c.newValue) return false;
                    const ov = formatHistoryValue(c.field, c.oldValue);
                    const nv = formatHistoryValue(c.field, c.newValue);
                    if (ov == null && nv == null) return false;
                    if (ov !== null && nv !== null && String(ov).trim() === String(nv).trim()) return false;
                    return true;
                  });
                  const reasons = g.items.map((i: any) => i.reason || i.ghiChu || i.note).filter(Boolean);

                  if (validChanges.length > 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                        {validChanges.map((change, ri: number) => {
                          const fn = change.field;
                          const ov = formatHistoryValue(fn, change.oldValue);
                          const nv = formatHistoryValue(fn, change.newValue);

                          if (isCreate) {
                            return (
                              <div key={`${fn}-${ri}`} style={{ display: 'grid', gridTemplateColumns: '170px minmax(0, 1fr)', alignItems: 'flex-start', gap: spaceMd, fontSize: fontSizeMd, lineHeight: 1.6, padding: '3px 0' }}>
                                <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                                <div style={{ minWidth: 0, overflowWrap: 'break-word' }}>{renderHistoryContent(fn, nv, false)}</div>
                              </div>
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
                                {renderHistoryContent(fn, nv, false)}
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
      })}</div>
    );
  };

  // Table Columns with client-side sorting (sắp xếp trực tiếp trên dữ liệu bảng)
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
      label: 'Tên / Mã trung tâm điều hành',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      sorter: clientSideStringSorter('name', 'code'),
      render: (_: any, record: VtsOperationCenterListItem) => (
        <div
          style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          onClick={() => {
            setEditingId(record.id);
            setSelectedRecord(record as any);
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
      key: 'vtsSystemName',
      label: 'Thuộc hệ thống VTS',
      dataIndex: 'vtsSystemName',
      width: 220,
      ellipsis: false,
      sorter: clientSideStringSorter('vtsSystemName'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'portName',
      label: 'Thuộc cảng biển',
      dataIndex: 'portName',
      width: 200,
      ellipsis: false,
      sorter: clientSideStringSorter('portName'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 220,
      ellipsis: false,
      sorter: clientSideStringSorter('orgUnitName'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'province',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 180,
      ellipsis: false,
      sorter: clientSideProvinceSorter('provinceName', 'provinceId'),
      render: (_: any, r: VtsOperationCenterListItem) => {
        const val = r.provinceName || getProvinceNameById(r.provinceId) || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 220,
      ellipsis: false,
      sorter: clientSideUserSorter('updatedByName', 'createdByName', 'updatedAt'),
      render: (_: any, record: VtsOperationCenterListItem) => {
        const name = record.updatedByName || record.createdByName || '—';
        const date = record.updatedAt || record.createdAt;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div
              title={name}
              style={{
                fontWeight: fontWeightBold,
                color: '#0F172A',
                fontSize: fontSizeMd,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      ellipsis: false,
      sorter: clientSideBadgeSorter('conditionStatus', CONDITION_STATUS_MAP),
      render: (v: string) => {
        const label = CONDITION_STATUS_MAP[v as ConditionStatus] || v;
        const color = CONDITION_COLOR[v as ConditionStatus] || textSecondary;
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
      ellipsis: false,
      sorter: clientSideBadgeSorter('approvalStatus'),
      render: (status: ApprovalStatus) => <ApprovalStatusBadge status={status} />,
    },
  ], [page, pageSize]);

  const rowActions = (record: VtsOperationCenterListItem) => {
    const isCreator = Boolean(currentUser?.id && record.createdBy === currentUser.id);
    const isApproverL1 = Boolean(currentUser?.id && (record as any).approverLevel1 === currentUser.id);
    const isSelfApproval = isCreator || isApproverL1;
    const actions: any[] = [
      {
        key: 'detail',
        label: 'Xem chi tiết',
        icon: icons.view,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record as any);
          setModalMode('detail');
          setIsModalOpen(true);
        },
      },
    ];

    if (hasPerm('vtsoperationcenter:history')) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: icons.history,
        onClick: () => handleViewHistory(record),
      });
    }

    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'vtsoperationcenter' })) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record as any);
          setModalMode('edit');
          setIsModalOpen(true);
        },
      });
    }

    if (hasPerm('vtsoperationcenter:update') && (record.approvalStatus === ApprovalStatus.DRAFT || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2)) {
      actions.push({
        key: 'submit',
        label: 'Gửi duyệt',
        icon: icons.submit,
        onClick: async () => {
          try {
            await vtsOperationCenterService.submit(record.id);
            toast.success('Gửi duyệt thành công');
            refreshList();
          } catch (e: any) {
            toast.error(e?.message || 'Lỗi gửi duyệt');
          }
        },
      });
    }

    if (hasPerm('vtsoperationcenter:approvec1') && record.approvalStatus === ApprovalStatus.PENDING_APPROVAL && !isCreator) {
      actions.push({
        key: 'approve_c1',
        label: 'Phê duyệt cấp Cảng vụ/Chi cục',
        icon: icons.approve,
        onClick: () => openApproveModal(record.id, 'c1'),
      });
      actions.push({
        key: 'reject_c1',
        label: 'Từ chối cấp Cảng vụ/Chi cục',
        icon: icons.reject,
        danger: true,
        onClick: () => openRejectModal(record.id),
      });
    }

    if (hasPerm('vtsoperationcenter:approvec2') && record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 && !isSelfApproval) {
      actions.push({
        key: 'approve_c2',
        label: 'Phê duyệt cấp Cục',
        icon: icons.approve,
        onClick: () => openApproveModal(record.id, 'c2'),
      });
      actions.push({
        key: 'reject_c2',
        label: 'Từ chối cấp Cục',
        icon: icons.reject,
        danger: true,
        onClick: () => openRejectModal(record.id),
      });
    }

    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'vtsoperationcenter' })) {
      actions.push({
        key: 'delete',
        label: 'Xóa bỏ',
        icon: icons.delete,
        danger: true,
        onClick: () => confirmDelete(record),
      });
    }

    return actions;
  };

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
        <ScreenHeader
          breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Trung tâm điều hành CHK' }]}
          actions={
            hasPerm('vtsoperationcenter:create')
              ? [{
                key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: icons.create,
                onClick: () => { setEditingId(null); setSelectedRecord(null); setModalMode('create'); setIsModalOpen(true); }
              }]
              : []
          }
        />
        <FilterTableLayout
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed((value) => !value)}
          onFilterApply={() => handleFilterSearch(filterValues)}
          onFilterReset={() => { setFilterValues({}); handleFilterReset(); }}
          loading={loading}
          error={isError}
          errorMessage={errorMessage}
          onRetry={refreshList}
          statusTabs={statusTabs}
          onStatusTabChange={handleTabChange}
          hideFilterToggle={true}
          filterContent={
            <>
              <SidebarFilterField label="Đơn vị quản lý" style={{ marginTop: spaceMd }}>
                <FilterOrgUnitTreeSelect
                  organizations={orgUnitOptions}
                  value={filterValues.orgUnitId}
                  onChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: value, portId: undefined, vtsSystemId: undefined }));
                  }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Thuộc cảng biển">
                <Select
                  placeholder="Tất cả cảng biển"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                  }
                  value={filterValues.portId}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, portId: value }))}
                  options={filteredPortOptions.map((p) => ({
                    value: p.id,
                    label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id),
                  }))}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Thuộc hệ thống VTS">
                <Select
                  placeholder="Tất cả hệ thống VTS"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                  }
                  value={filterValues.vtsSystemId}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, vtsSystemId: value }))}
                  options={filteredVtsSystemOptions.map((v) => ({
                    value: v.id,
                    label: v.code ? `${v.code} - ${v.name || ''}` : (v.name || v.id),
                  }))}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tìm kiếm">
                <Input
                  placeholder="Tìm theo mã, tên trung tâm..."
                  allowClear
                  value={filterValues.keyword || ''}
                  onChange={(event) => setFilterValues((prev) => ({ ...prev, keyword: event.target.value }))}
                  onPressEnter={() => handleFilterSearch(filterValues)}
                  style={inputStyle}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tình trạng">
                <Select
                  placeholder="Tất cả"
                  allowClear
                  value={filterValues.conditionStatus}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                  options={CONDITION_STATUS_OPTIONS}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Ngày cập nhật">
                <DatePicker.RangePicker
                  {...getRangePickerProps({
                    value: filterValues.updateDateRange,
                    onChange: (dates: any) => setFilterValues((prev) => ({ ...prev, updateDateRange: dates })),
                  })}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Địa điểm (Tỉnh / TP)">
                <Select
                  placeholder="Tất cả tỉnh thành"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                  }
                  value={filterValues.provinceId}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, provinceId: value }))}
                  options={VIETNAM_PROVINCE_OPTIONS}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>
            </>
          }
        >
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            rowActions={rowActions}
            loading={false}
            scroll={{ x: 'max-content' }}
          />
          <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
        </FilterTableLayout>

        {/* Drawer Unified Form */}
        {isModalOpen && (
          <VtsOperationCenterChkForm
            open={true}
            editId={editingId}
            initialData={selectedRecord}
            mode={modalMode}
            orgUnits={orgUnitOptions}
            onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
            onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); refreshList(); }}
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
                    vtsOperationCenterService.getHistory(selectedRecord.id).then((res) => {
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
              <LoadingSkeleton rows={5} />
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
}
