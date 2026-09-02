import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Typography, Modal, Input, Drawer, Button, DatePicker, Space, Select } from 'antd';
import {
  HistoryOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { vtsOperationCenterService, type VtsOperationCenterListParams } from '../../services/vtsOperationCenterService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { symbolService } from '../../services/symbolService';
import type { VtsOperationCenterListItem, VtsOperationCenterResponse } from '../../types/vtsOperationCenter';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import VtsOperationCenterForm from './VtsOperationCenterForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import toast, { modal } from '../../components/ToastNotification';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  radiusSm, spaceFormField, spaceMd, spaceSm, spaceLg,
  statusOperational, statusDraft, statusCritical, statusAttention,
  surfacePage, spaceXs, spaceXl, drawerTitleStyle, drawerCloseBtnStyle, selectStyle,
  borderDefault, statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  inputStyle, primaryButtonStyle, textAreaStyle,
  getRangePickerProps,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds, type OrgUnitTreeOption } from '../../components/org-unit';
import SidebarFilterField from '../../components/list-view/SidebarFilterField';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../utils/approvalEditPolicy';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import { deduplicateAttachmentHistoryChanges } from '../../utils/historyAttachmentDedup';

const CONDITION_COLOR: Record<ConditionStatus, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const HISTORY_FIELD_ORDER = [
  'orgUnitId', 'orgUnitName', 'portId', 'portName', 'vtsSystemId', 'vtsSystemName',
  'code', 'name', 'provinceId', 'province', 'detailedLocation', 'coverage', 'conditionStatus', 'note',
  'approvalStatus', 'geometryType', 'coordinates', 'symbolId'
];

function historyFieldName(fn: string): string {
  const map: Record<string, string> = {
    name: 'Tên trung tâm điều hành VTS', code: 'Mã trung tâm điều hành VTS', province: 'Tỉnh/Thành phố',
    provinceId: 'Địa điểm (Tỉnh/TP)', detailedLocation: 'Địa điểm chi tiết', address: 'Địa điểm chi tiết',
    coverage: 'Vùng phủ sóng', note: 'Ghi chú', approvalStatus: 'Trạng thái phê duyệt', conditionStatus: 'Tình trạng',
    orgUnitName: 'Đơn vị quản lý', orgUnitId: 'Đơn vị quản lý', portName: 'Thuộc cảng biển', portId: 'Thuộc cảng biển',
    vtsSystemName: 'Thuộc hệ thống VTS', vtsSystemId: 'Thuộc hệ thống VTS',
    symbolId: 'Biểu tượng', coordinates: 'Tọa độ GIS', geometryType: 'Loại đối tượng GIS',
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
  return norm.includes('vung vts') || norm.includes('zones') || norm.includes('dinh kem') || norm.includes('attachment');
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

  if (/^(Đường|Vùng|Điểm)\s+bản\s+đồ\s*\(\d+\s+điểm/i.test(str)) {
    return { typeName: str, points: [] };
  }

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
    return <span style={{ color: textPrimary }}>{parsed?.typeName || val}</span>;
  }
  const { typeName, points } = parsed;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs, width: '100%' }}>
      {typeName && (
        <span style={{ fontSize: fontSizeSm, fontWeight: fontWeightBold, color: actionPrimary }}>
          {typeName} ({points.length} điểm)
        </span>
      )}
      {points.map((pt) => (
        <div key={pt.index} style={{ fontSize: fontSizeSm, color: textPrimary, lineHeight: 1.5 }}>
          {points.length > 1 && <span style={{ color: textSecondary, marginRight: spaceXs }}>#{pt.index}:</span>}
          <span>{formatCoordPointDms(pt.x, pt.y)}</span>
        </div>
      ))}
    </div>
  );
}

function renderHistoryValueTag(field: string, val: string | null, symbols: any[] = []) {
  if (val === null || val === undefined || val === '—' || val === '' || val === 'Chưa có') {
    return <span style={{ color: textTertiary }}>{val === 'Chưa có' ? 'Chưa có' : '—'}</span>;
  }
  const normKey = normalizeHistoryKey(field);
  const normVal = normalizeHistoryKey(val);

  if (normKey === 'coordinates' || normKey === 'toa do gis' || normKey.includes('toa do') || normKey.includes('coordinates')) {
    return renderCoordinatesDisplay(val);
  }

  if (normKey === 'symbolid' || normKey === 'bieu tuong' || normKey.includes('bieu tuong') || normKey.includes('map symbol')) {
    const sym = symbols.find((s) => s.name === val || s.id === val || s.code === val || (val && String(s.name).trim().toLowerCase() === String(val).trim().toLowerCase()));
    if (sym && sym.image) {
      const imgSrc = sym.image.startsWith('data:') || sym.image.startsWith('http') || sym.image.startsWith('/')
        ? sym.image
        : `data:image/png;base64,${sym.image}`;
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <img src={imgSrc} alt="" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }} />
          <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>{sym.name || val}</span>
        </span>
      );
    }
    return <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>{val}</span>;
  }

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

export default function VtsOperationCenterList() {
  const currentUser = useAuthStore((s: any) => s.user);
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // Sắp xếp chạy ở server để áp dụng cho toàn bộ kết quả; nếu để antd tự sắp thì
  // chỉ 20 dòng của trang hiện tại được sắp, gây hiểu nhầm là đã sắp cả danh sách.
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
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
  const [symbols, setSymbols] = useState<any[]>([]);

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
        const [orgs, ports, systems, syms] = await Promise.all([
          vtsSystemCRUD.getScopedOrgUnitOptions(),
          vtsSystemCRUD.getScopedPortOptions(),
          vtsSystemCRUD.getOptions(),
          symbolService.getOptions().catch(() => []),
        ]);
        setOrgUnitOptions((orgs || []).map((o: any) => ({
          id: String(o.id),
          name: o.name || o.unitName || o.tenDonVi || 'Đơn vị',
          code: o.code || o.maDonVi,
          parentId: o.parentId ? String(o.parentId) : undefined,
        })));
        setPortOptions(Array.isArray(ports) ? ports : []);
        setVtsSystemOptions(Array.isArray(systems) ? systems : []);
        setSymbols(Array.isArray(syms) ? syms : []);
      } catch (e) {
        console.error('Failed to fetch lookup options', e);
      }
    })();
  }, []);

  const filteredPortOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return portOptions;
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, filterValues.orgUnitId);
    return portOptions.filter((p) => !p.orgUnitId || allowedIds.has(p.orgUnitId));
  }, [portOptions, orgUnitOptions, filterValues.orgUnitId]);

  const filteredVtsSystemOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return vtsSystemOptions;
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, filterValues.orgUnitId);
    return vtsSystemOptions.filter((v) => !v.orgUnitId || allowedIds.has(v.orgUnitId));
  }, [vtsSystemOptions, orgUnitOptions, filterValues.orgUnitId]);

  const fetchData = useCallback(async () => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    setIsError(false);
    try {
      const currentStatusCountFilterKey = JSON.stringify([
        filterName, filterCode, filterConditionStatus, filterOrgUnitId, filterPortId, filterVtsSystemId, filterProvinceId,
        filterUpdatedFrom, filterUpdatedTo,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;
      const params: VtsOperationCenterListParams = {
        page: page,
        size: pageSize,
        name: filterName || undefined,
        code: filterCode || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
        portId: filterPortId || undefined,
        vtsSystemId: filterVtsSystemId || undefined,
        provinceId: filterProvinceId,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        sortBy: sortField,
        sortDir: sortField ? sortDirection.toUpperCase() : undefined,
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
    page, pageSize, filterName, filterCode, filterConditionStatus, filterApprovalStatus,
    filterOrgUnitId, filterPortId, filterVtsSystemId, filterProvinceId,
    filterUpdatedFrom, filterUpdatedTo, sortField, sortDirection,
  ]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(order);
    setPage(1);
  }, []);

  const sortOrderFor = (key: string): 'ascend' | 'descend' | null =>
    (sortField === key ? (sortDirection === 'asc' ? 'ascend' : 'descend') : null);

  // Bộ so sánh trung tính: thứ tự do server quyết định, hàm này chỉ để antd hiện
  // biểu tượng sắp xếp mà không tự sắp lại 20 dòng của trang hiện tại.
  const serverSideSorter = () => 0;

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
    // approval-2-level-spec §3.4 (quy tắc 5): lý do từ chối tối thiểu 10 ký tự.
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      toast.error('Lý do từ chối phải có ít nhất 10 ký tự');
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
    const approvalStatus = key === 'ALL'
      ? undefined
      : key === 'REJECTED'
        ? ApprovalStatus.REJECTED_LEVEL1
        : key as ApprovalStatus;
    setFilterApprovalStatus(approvalStatus);
    setFilterValues((prev) => ({ ...prev, approvalStatus }));
    setPage(1);
  };

  const handleFilterSearch = (vals: Record<string, any>) => {
    setFilterName(vals.name?.trim() || '');
    setFilterCode(vals.code?.trim() || '');
    setFilterConditionStatus(vals.conditionStatus);
    setFilterApprovalStatus(vals.approvalStatus);
    setFilterOrgUnitId(vals.orgUnitId);
    setFilterPortId(vals.portId);
    setFilterVtsSystemId(vals.vtsSystemId);
    setFilterProvinceId(vals.provinceId);
    // Backend nhận LocalDateTime và BỎ QUA offset, nên `toISOString()` (giờ UTC)
    // làm cửa sổ lọc lệch đúng bằng chênh lệch múi giờ (VN: -7h): hồ sơ cập nhật
    // sau 17h bị đẩy nhầm sang ngày hôm sau. Gửi thẳng giờ địa phương.
    setFilterUpdatedFrom(vals.updateDateRange?.[0] ? dayjs(vals.updateDateRange[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setFilterUpdatedTo(vals.updateDateRange?.[1] ? dayjs(vals.updateDateRange[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilterName('');
    setFilterCode('');
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
          if (t.startsWith('[') && t.endsWith(']')) {
            if (t === '[]') return 'Không có';
            const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
            return `${parts.length} công trình hạ tầng`;
          }
          const specialFields = ['provinceId', 'symbolId', 'conditionStatus', 'approvalStatus'];
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
                    return renderHistoryValueTag(field, val, symbols);
                  };

                  // Deduplicate changes correctly using raw values
                  const listFields = new Set<string>();
                  changes.forEach((c: any) => {
                    if (isListDeltaField(c.field)) {
                      const ov = typeof c.oldValue === 'string' ? c.oldValue.trim() : '';
                      const nv = typeof c.newValue === 'string' ? c.newValue.trim() : '';
                      if (ov.startsWith('[') || nv.startsWith('[')) {
                        listFields.add(normalizeHistoryKey(c.field || ''));
                      }
                    }
                  });

                  const dedupedChanges = changes.filter((c: any) => {
                    if (isListDeltaField(c.field)) {
                      const normKey = normalizeHistoryKey(c.field || '');
                      if (listFields.has(normKey)) {
                        const ov = typeof c.oldValue === 'string' ? c.oldValue.trim() : '';
                        const nv = typeof c.newValue === 'string' ? c.newValue.trim() : '';
                        if (!ov.startsWith('[') && !nv.startsWith('[')) {
                          return false;
                        }
                      }
                    }
                    return true;
                  });

                  const uniqueChangesMap = new Map<string, any>();
                  dedupedChanges.forEach((c: any) => {
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
                  const reasons = g.items.map((i: any) => i.reason || i.ghiChu || i.note).filter(Boolean);

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
      label: 'Tên / Mã trung tâm điều hành VTS',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('name'),
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
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 220,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('orgUnitName'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: fontWeightBold }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'portName',
      label: 'Thuộc cảng biển',
      dataIndex: 'portName',
      width: 200,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('portName'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'vtsSystemName',
      label: 'Thuộc hệ thống VTS',
      dataIndex: 'vtsSystemName',
      width: 220,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('vtsSystemName'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'province',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 180,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      // DataTable lấy khóa sắp xếp từ `dataIndex` nên cột này gửi lên `provinceId`.
      sortOrder: sortOrderFor('provinceId'),
      render: (_: any, r: VtsOperationCenterListItem) => {
        const val = r.provinceName || getProvinceNameById(r.provinceId) || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('conditionStatus'),
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
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('approvalStatus'),
      render: (status: ApprovalStatus) => <ApprovalStatusBadge status={status} />,
    },
    {
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 220,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('updatedByName'),
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
      key: 'submittedByName',
      label: 'Cán bộ gửi phê duyệt',
      dataIndex: 'submittedByName',
      width: 220,
      ellipsis: false,
      render: (_: any, record: VtsOperationCenterListItem) => {
        const name = record.submittedByName || '—';
        const date = record.submittedAt || (record as any).submittedDate;
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
      key: 'approverLevel1Name',
      label: 'Phê duyệt cấp Cảng vụ/Chi cục',
      dataIndex: 'approverLevel1Name',
      width: 240,
      ellipsis: false,
      render: (_: any, record: VtsOperationCenterListItem) => {
        const name = record.approverLevel1Name || (record as any).approverLevel1 || '—';
        const date = record.approvedDateLevel1;
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
      key: 'approverLevel2Name',
      label: 'Phê duyệt cấp Cục',
      dataIndex: 'approverLevel2Name',
      width: 220,
      ellipsis: false,
      render: (_: any, record: VtsOperationCenterListItem) => {
        const name = record.approverLevel2Name || (record as any).approverLevel2 || '—';
        const date = record.approvedDateLevel2;
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
  ], [page, pageSize, sortField, sortDirection]);

  const rowActions = (record: VtsOperationCenterListItem) => {
    const isCreator = Boolean(currentUser?.id && record.createdBy === currentUser.id);
    const isApproverL1 = Boolean(currentUser?.id && (record as any).approverLevel1 === currentUser.id);
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

    if (hasPerm('vtsoperationcenter:approvec2') && record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 && !isApproverL1) {
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
          breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Trung tâm điều hành VTS' }]}
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
          filterContent={
            <>
              <SidebarFilterField label="Đơn vị quản lý" style={{ marginTop: spaceMd }}>
                <OrgUnitTreeSelect
                  organizations={orgUnitOptions}
                  placeholder="Tất cả"
                  allowClear
                  treeDefaultExpandAll={true}
                  listHeight={256}
                  value={filterValues.orgUnitId}
                  onChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: value, portId: undefined, vtsSystemId: undefined }));
                  }}
                  style={{ ...selectStyle, width: '100%' }}
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

              <SidebarFilterField label="Tên trung tâm điều hành VTS">
                <Input
                  placeholder="Nhập tên trung tâm điều hành VTS"
                  allowClear
                  value={filterValues.name || ''}
                  onChange={(event) => setFilterValues((prev) => ({ ...prev, name: event.target.value }))}
                  onPressEnter={() => handleFilterSearch(filterValues)}
                  style={inputStyle}
                />
              </SidebarFilterField>

              {filterCollapsed && (
                <>
                  <SidebarFilterField label="Trạng thái">
                    <Select
                      placeholder="Tất cả"
                      allowClear
                      value={filterValues.approvalStatus}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, approvalStatus: value }))}
                      options={[
                        { value: ApprovalStatus.DRAFT, label: 'Lưu tạm' },
                        { value: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ Cảng vụ duyệt' },
                        { value: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ Cục duyệt' },
                        { value: ApprovalStatus.APPROVED, label: 'Đã duyệt' },
                        { value: ApprovalStatus.REJECTED_LEVEL1, label: 'Từ chối' },
                      ]}
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

                  <SidebarFilterField label="Mã trung tâm điều hành VTS">
                    <Input
                      placeholder="Nhập mã trung tâm điều hành VTS"
                      allowClear
                      value={filterValues.code || ''}
                      onChange={(event) => setFilterValues((prev) => ({ ...prev, code: event.target.value }))}
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
              )}
            </>
          }
        >
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            rowActions={rowActions}
            loading={loading}
            onSort={handleSort}
            scroll={{ x: 'max-content' }}
          />
          <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
        </FilterTableLayout>

        {/* Drawer Unified Form */}
        {isModalOpen && (
          <VtsOperationCenterForm
            open={true}
            editId={editingId}
            initialData={selectedRecord}
            mode={modalMode}
            orgUnits={orgUnitOptions}
            portOptions={portOptions}
            vtsSystemOptions={vtsSystemOptions}
            symbols={symbols}
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
