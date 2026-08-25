import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Typography, Modal, Input, Drawer, Button, DatePicker, Space, Select, Radio, Tag } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import type { VtsSystemResponse, ListParams, ApprovalRequest } from '../../types/vtsSystem';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import VtsSystemForm from './VtsSystemForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import toast, { modal } from '../../components/ToastNotification';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  radiusSm, radiusPill, spaceFormField, spaceMd, spaceSm, spaceLg,
  statusOperational, statusDraft, statusCritical, statusAttention,
  surfacePage, spaceXs, spaceXl, drawerTitleStyle, drawerCloseBtnStyle, selectStyle,
  borderDefault,
} from '../../tokens';
import { colors } from '../../theme';
import dayjs from 'dayjs';
import { getProvinceNameById } from '../../types/common';
import { OrgUnitTreeSelect, type OrgUnitTreeOption } from '../../components/org-unit';
import { userService } from '../../services/userService';

function formatDate(value: string | undefined): string {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—';
}

const APPROVAL_STATUS_MAP: Record<string, string> = {
  [ApprovalStatus.DRAFT]: 'Lưu tạm',
  [ApprovalStatus.PROPOSED]: 'Chờ Cảng vụ duyệt',
  [ApprovalStatus.PENDING_APPROVAL]: 'Chờ Cảng vụ duyệt',
  [ApprovalStatus.APPROVED_LEVEL1]: 'Chờ Cục duyệt',
  [ApprovalStatus.APPROVED_LEVEL2]: 'Đã duyệt',
  [ApprovalStatus.APPROVED]: 'Đã duyệt',
  [ApprovalStatus.REJECTED]: 'Từ chối',
  [ApprovalStatus.REJECTED_LEVEL1]: 'Cảng vụ trả về',
  [ApprovalStatus.REJECTED_LEVEL2]: 'Cục trả về',
};

const APPROVAL_COLOR: Record<string, string> = {
  [ApprovalStatus.DRAFT]: statusDraft,
  [ApprovalStatus.PROPOSED]: statusAttention,
  [ApprovalStatus.PENDING_APPROVAL]: statusAttention,
  [ApprovalStatus.APPROVED_LEVEL1]: '#0284c7',
  [ApprovalStatus.APPROVED_LEVEL2]: statusOperational,
  [ApprovalStatus.APPROVED]: statusOperational,
  [ApprovalStatus.REJECTED]: statusCritical,
  [ApprovalStatus.REJECTED_LEVEL1]: statusCritical,
  [ApprovalStatus.REJECTED_LEVEL2]: statusCritical,
};

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const HISTORY_PAGE_SIZE = 20;

// Thứ tự hiển thị field trong lịch sử theo đúng thứ tự form tạo mới VTS (VtsSystemForm.tsx)
const HISTORY_FIELD_ORDER = ['orgUnitId', 'owningOrgId', 'operatingOrgId', 'portId', 'code', 'systemName', 'province', 'provinceId', 'address', 'operationStartDate', 'scope', 'maritimeNotice', 'conditionStatus', 'note'];

// ── History helpers ──────────────────────────────────────────────

function historyFieldName(fn: string): string {
  const map: Record<string, string> = {
    systemName: 'Tên hệ thống VTS', code: 'Mã hệ thống VTS', province: 'Tỉnh/Thành phố',
    provinceId: 'Mã tỉnh/thành', address: 'Địa điểm chi tiết', maritimeNotice: 'Thông báo hàng hải',
    operationStartDate: 'Thời gian bắt đầu hoạt động', scope: 'Phạm vi áp dụng',
    note: 'Ghi chú', approvalStatus: 'Trạng thái phê duyệt', conditionStatus: 'Tình trạng',
    orgUnitName: 'Đơn vị quản lý', owningOrgName: 'Đơn vị chủ quản',
    operatingOrgName: 'Đơn vị vận hành khai thác', portName: 'Thuộc cảng biển',
  };
  return map[fn] || fn;
}

function historyFieldValue(fn: string, val: string | null): string {
  if (!val || val === '(null)' || val === 'null' || val === '') return '(trống)';
  // History values can be persisted as `Tên trường=Giá trị`, or as a
  // semicolon-separated list of those pairs. The field label is rendered in
  // the first column, so keep only the value here.
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
      const normText = normalizeHistoryKey(normalizedValue);
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
  if (fn === 'orgUnitId' || fn === 'owningOrgId' || fn === 'operatingOrgId' || fn === 'portId') return displayValue;
  if (fn === 'provinceId') { const num = Number(displayValue); if (!isNaN(num)) return getProvinceNameById(num) || displayValue; return displayValue; }
  if (fn === 'conditionStatus') { return CONDITION_STATUS_MAP[displayValue as ConditionStatus] || displayValue; }
  return displayValue;
}

function historyTimestamp(item: any): string {
  return item.approvedDate || item.changedAt || item.createdAt || '';
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

function getActionLabel(items: any[]): { label: string; color: string } {
  const levels = items.map((i: any) => Number(i.approvalLevel || 0));
  const statuses = items.map((i: any) => String(i.status || '').toUpperCase());
  const fields = items.map(historyField);
  const newVals = items.map((i: any) => historyNewValue(i) || '');
  if (fields.includes('deletedAt')) return { label: 'Xóa', color: 'red' };
  if (levels.includes(2)) return { label: 'Phê duyệt cấp Cục', color: 'green' };
  if (levels.includes(1)) return { label: 'Phê duyệt cấp Cảng vụ', color: 'gold' };
  if (statuses.includes('REJECTED')) return { label: 'Từ chối', color: 'red' };
  if (fields.includes('approvalStatus')) {
    const idx = fields.indexOf('approvalStatus');
    const newStatus = newVals[idx];
    if (newStatus === 'APPROVED') return { label: 'Phê duyệt', color: 'green' };
    if (newStatus === 'REJECTED') return { label: 'Từ chối', color: 'red' };
    if (newStatus === 'PENDING') return { label: 'Gửi phê duyệt', color: 'orange' };
  }
  const nullCount = items.filter((i: any) => historyOldValue(i) === null || historyOldValue(i) === '(null)').length;
  if (nullCount > items.length / 2) return { label: 'Tạo mới', color: 'blue' };
  return { label: 'Chỉnh sửa', color: 'blue' };
}

function getHistoryActionAccent(items: any[], action: { color: string }): string {
  const statuses = items.map((item: any) => String(item.status || '').toUpperCase());
  const approvalValues = items
    .filter((item: any) => {
      const key = normalizeHistoryKey(historyField(item));
      return key === 'approvalstatus' || key.includes('trang thai phe duyet');
    })
    .flatMap((item: any) => historyFieldValue(historyField(item), historyNewValue(item)).split(';'))
    .map((value: string) => normalizeHistoryKey(value));

  if (statuses.includes('REJECTED') || approvalValues.some((value) => value === 'rejected' || value === 'tu choi')) {
    return statusCritical;
  }
  if (statuses.includes('APPROVED') || approvalValues.some((value) => value === 'approved' || value.startsWith('da phe duyet'))) {
    return statusOperational;
  }
  if (statuses.includes('PROPOSED') || approvalValues.some((value) => value === 'proposed' || value === 'cho phe duyet')) {
    return statusAttention;
  }
  if (statuses.includes('PENDING_APPROVAL') || approvalValues.some((value) => value === 'pending_approval' || value === 'cho phe duyet')) {
    return actionPrimary;
  }

  return action.color === 'red'
    ? statusCritical
    : action.color === 'green'
      ? statusOperational
      : action.color === 'gold' || action.color === 'orange'
        ? statusAttention
        : actionPrimary;
}

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
}

function normalizedHistoryFields(value: string): string[] {
  const fields = value.split(/[,;]+/).map((field: string) => field.trim()).filter(Boolean);
  const hasApprovalStatus = fields.some((field) => {
    const key = normalizeHistoryKey(field);
    return key === 'approvalstatus' || key === 'trang thai phe duyet';
  });

  // Older approval records could persist both the status and the derived
  // approvedLevel1/approvedLevel2 flag. The approval timeline represents one
  // workflow transition, so keep only the status row when both are present.
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

  // Approval entries often contain multiple field names but one status pair.
  // Keep those as one logical change instead of duplicating the same values.
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

  // If this action was creation, always display Tạo mới
  if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('tao moi')) {
    return { label: 'Tạo mới', color: statusOperational, bg: `${statusOperational}18` };
  }

  // If this action was attachment upload / delete
  if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || item.changedField?.includes('đính kèm')) {
    return { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c718' };
  }
  if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xóa tệp') || rawReason.includes('xoa tep')) {
    return { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c18' };
  }

  // If this action was an update/modification, always display Cập nhật
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

  // Approval status
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

  // Condition status
  if (normKey === 'conditionstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang')) {
    if (normVal.includes('hoat dong tot') || normVal.includes('good') || normVal.includes('operational') || normVal.includes('hoat dong')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', border: `1px solid ${statusOperational}40`, borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${statusOperational}15`, color: statusOperational, whiteSpace: 'nowrap' }}>
          {val}
        </span>
      );
    }
    if (normVal.includes('can bao duong') || normVal.includes('warning') || normVal.includes('maintenance') || normVal.includes('bao tri')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', border: `1px solid ${statusAttention}40`, borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${statusAttention}15`, color: statusAttention, whiteSpace: 'nowrap' }}>
          {val}
        </span>
      );
    }
    if (normVal.includes('hong') || normVal.includes('ngung') || normVal.includes('dung') || normVal.includes('damaged') || normVal.includes('critical')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', border: `1px solid ${statusCritical}40`, borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${statusCritical}15`, color: statusCritical, whiteSpace: 'nowrap' }}>
          {val}
        </span>
      );
    }
    if (normVal.includes('xay dung') || normVal.includes('under_construction')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', border: `1px solid ${actionPrimary}40`, borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${actionPrimary}15`, color: actionPrimary, whiteSpace: 'nowrap' }}>
          {val}
        </span>
      );
    }
  }

  return <span title={val} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>{val}</span>;
}

export default function VtsSystemList() {
  const currentUser = useAuthStore((s) => s.user);
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const [dataSource, setDataSource] = useState<VtsSystemResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<VtsSystemResponse | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectReason, setRejectReason] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // History drawer state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');

  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const m = new Map<string, string>();
        users.forEach((u: any) => m.set(u.id, u.fullName || u.username || u.id));
        setUserMap(m);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Số nhóm bản ghi lịch sử (gom theo giây + người cập nhật — giống logic timeline Cảng biển)
  const historyGroupCount = useMemo(() => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...historyRecords].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    let count = 0, prevKey = '';
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const key = `${ts ? toSec(ts) : 0}-${historyActor(r, userMap)}`;
      if (key !== prevKey) { count += 1; prevKey = key; }
    }
    return count;
  }, [historyRecords, userMap]);

  // Count tabs
  const [countProposed, setCountProposed] = useState<number>(0);
  const [countPendingApproval, setCountPendingApproval] = useState<number>(0);
  const [countApprovedLevel1, setCountApprovedLevel1] = useState<number>(0);
  const [countApproved, setCountApproved] = useState<number>(0);
  const [countRejected, setCountRejected] = useState<number>(0);
  const statusCountFilterKey = useRef<string | null>(null);
  const listRequestId = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const list = await vtsSystemCRUD.getScopedOrgUnitOptions();
        setOrgUnitOptions(list.map((o: any) => {
          const code = o.code || o.maDonVi;
          const name = o.name || o.unitName || o.tenDonVi || 'Đơn vị';
          return {
            id: String(o.id),
            name,
            code,
            parentId: o.parentId ? String(o.parentId) : undefined,
          };
        }));
      } catch (e) { console.error('Failed to fetch org units for filter', e); }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    setIsError(false);
    try {
      const currentStatusCountFilterKey = JSON.stringify([
        // Counts are for all approval statuses. Changing the active status tab
        // must not change the scope used to calculate the tab counts.
        filterKeyword, filterConditionStatus, filterOrgUnitId,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;
      const params: ListParams & { includeCounts: boolean } = {
        page: page - 1, size: pageSize,
        keyword: filterKeyword || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
        includeCounts: shouldIncludeCounts,
      };
      const res = await vtsSystemCRUD.list(params);
      if (requestId !== listRequestId.current) return;
      setDataSource(res.items);
      setTotal(res.total);
      if (shouldIncludeCounts) {
        // An empty map is a valid response when the active filters match no
        // records. Reset every tab instead of retaining counts from a previous
        // filter (which made the tabs show stale totals such as 329).
        const counts = res.statusCounts || {};
        setCountProposed(Number(counts.DRAFT) || Number(counts.PROPOSED) || 0);
        setCountPendingApproval(Number(counts.PENDING_APPROVAL) || 0);
        setCountApprovedLevel1(Number(counts.APPROVED_LEVEL1) || 0);
        setCountApproved(Number(counts.APPROVED) || Number(counts.APPROVED_LEVEL2) || 0);
        setCountRejected(Number(counts.REJECTED) || Number(counts.REJECTED_LEVEL1) || Number(counts.REJECTED_LEVEL2) || 0);
        statusCountFilterKey.current = currentStatusCountFilterKey;
      }
    } catch (err: unknown) {
      if (requestId !== listRequestId.current) return;
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally {
      if (requestId === listRequestId.current) setLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterConditionStatus, filterApprovalStatus, filterOrgUnitId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refreshList = useCallback(() => {
    statusCountFilterKey.current = null;
    void fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try { await vtsSystemCRUD.delete(id); toast.success('Xóa thành công'); refreshList(); }
    catch (err: any) { toast.error(err?.message || 'Lỗi xóa'); }
  };

  const confirmDelete = (record: VtsSystemResponse) => {
    modal.confirm({
      title: 'Xác nhận xóa hệ thống VTS',
      icon: <ExclamationCircleOutlined />,
      content: 'Bản ghi đã phê duyệt sẽ được xóa mềm và không còn hiển thị trong danh sách.',
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
      const payload: ApprovalRequest = { decision: 'APPROVED', reason: content };
      if (approveLevel === 'c1') {
        await vtsSystemApproval.approveC1(approveTargetId, payload);
        toast.success('Phê duyệt cấp 1 thành công');
      } else {
        await vtsSystemApproval.approveC2(approveTargetId, payload);
        toast.success('Phê duyệt cấp 2 thành công');
      }
      setApproveModalOpen(false);
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi phê duyệt');
    }
  };

  const openRejectModal = (id: string, level: 'c1' | 'c2') => {
    setRejectTargetId(id); setRejectLevel(level); setRejectReason(''); setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) { toast.error('Lý do từ chối phải có ít nhất 10 ký tự'); return; }
    if (!rejectTargetId) return;
    try {
      const payload: ApprovalRequest = { decision: 'REJECTED', reason: rejectReason.trim() };
      if (rejectLevel === 'c1') await vtsSystemApproval.approveC1(rejectTargetId, payload);
      else await vtsSystemApproval.approveC2(rejectTargetId, payload);
      toast.success('Đã từ chối'); setRejectModalOpen(false); refreshList();
    } catch (err: any) { toast.error(err?.message || 'Lỗi từ chối'); }
  };

  // ── History drawer ──────────────────────────────────────────────

  const handleViewHistory = (record: VtsSystemResponse) => {
    setSelectedRecord(record);
    setHistoryModalOpen(true);
    setHistoryRecords([]);
    setLoadingHistory(false);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistorySearch('');
    setHistoryDateFrom('');
    setHistoryDateTo('');
  };

  useEffect(() => {
    if (!historyModalOpen || !selectedRecord) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingHistory(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      try {
        const history = await vtsSystemApproval.getHistory(selectedRecord.id, 0, HISTORY_PAGE_SIZE, {
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
  }, [historyModalOpen, selectedRecord?.id, historySearch, historyDateFrom, historyDateTo]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = Math.floor(historyRecords.length / HISTORY_PAGE_SIZE) + 1;
      const history = await vtsSystemApproval.getHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historySearch,
        fromDate: historyDateFrom,
        toDate: historyDateTo,
      });
      if (history && history.length > 0) {
        setHistoryRecords(prev => [...prev, ...history]);
      }
      setHasMoreHistory((history || []).length === HISTORY_PAGE_SIZE);
    } catch { /* ignore */ }
    finally { setLoadingMoreHistory(false); }
  };

  const handleHistoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      loadMoreHistory();
    }
  };

  const columns = useMemo(() => [
    {
      key: 'stt', label: 'STT', width: 60, align: 'center' as const, fixed: 'left' as const,
      render: (_: unknown, __: unknown, idx: number) => (page - 1) * pageSize + idx + 1
    },
    {
      key: 'orgUnitName', label: 'Đơn vị quản lý', dataIndex: 'orgUnitName', width: 250,
      render: (val: string) => val || '—'
    },
    {
      key: 'owningOrgName', label: 'Đơn vị chủ quản', dataIndex: 'owningOrgName', width: 250,
      render: (val: string) => val || '—'
    },
    {
      key: 'operatingOrgName', label: 'Đơn vị vận hành', dataIndex: 'operatingOrgName', width: 250,
      render: (val: string) => val || '—'
    },
    {
      key: 'portName', label: 'Thuộc cảng biển', dataIndex: 'portName', width: 220,
      render: (val: string) => val || '—'
    },
    {
      key: 'code', label: 'Mã hệ thống VTS', dataIndex: 'code', width: 180, sortable: true,
      render: (val: string, record: VtsSystemResponse) => (
        <a
          onClick={() => { setEditingId(record.id); setSelectedRecord(record); setModalMode('detail'); setIsModalOpen(true); }}
          style={{ fontWeight: 600, color: colors.sidebarBg, cursor: 'pointer' }}
        >
          {val || '—'}
        </a>
      )
    },
    {
      key: 'systemName', label: 'Tên hệ thống VTS', dataIndex: 'systemName', width: 380, sortable: true,
      render: (val: string, record: VtsSystemResponse) => (
        <span
          onClick={() => { setEditingId(record.id); setSelectedRecord(record); setModalMode('detail'); setIsModalOpen(true); }}
          style={{ cursor: 'pointer', fontWeight: 500 }}
        >
          {val || '—'}
        </span>
      )
    },
    {
      key: 'address', label: 'Địa điểm', dataIndex: 'address', width: 280, sortable: true,
      render: (val: string, record: any) => {
        const provinceName = record.provinceId ? getProvinceNameById(record.provinceId) : '';
        if (val && provinceName) return `${val}, ${provinceName}`;
        return val || provinceName || '—';
      }
    },
    {
      key: 'operationStartDate', label: 'Thời gian bắt đầu hoạt động', dataIndex: 'operationStartDate', width: 280, sortable: true,
      render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY') : '—'
    },
    {
      key: 'conditionStatus', label: 'Tình trạng', dataIndex: 'conditionStatus', width: 170, sortable: true, align: 'center' as const,
      render: (val: ConditionStatus) => {
        if (!val) return '—';
        const display = CONDITION_STATUS_MAP[val] || val;
        const color = CONDITION_COLOR[val] || textSecondary;
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', border: `1px solid ${color}40`, borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color, whiteSpace: 'nowrap' }}>{display}</span>;
      }
    },
    {
      key: 'approvalStatus', label: 'Trạng thái', dataIndex: 'approvalStatus', width: 200, sortable: true, align: 'center' as const,
      render: (val: ApprovalStatus) => {
        if (!val) return '—';
        const display = APPROVAL_STATUS_MAP[val] || val;
        const color = APPROVAL_COLOR[val] || textSecondary;
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', border: `1px solid ${color}40`, borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color, whiteSpace: 'nowrap' }}>{display}</span>;
      }
    },
    {
      key: 'updatedByName', label: 'Cán bộ cập nhật', dataIndex: 'updatedByName', width: 220,
      render: (val: string, record: any) => val || record.updatedBy || record.createdBy || '—'
    },
    {
      key: 'updatedDate', label: 'Ngày cập nhật', dataIndex: 'updatedDate', width: 180, sortable: true,
      render: (val: string) => formatDate(val)
    },
  ], [page, pageSize]);

  const rowActions = useCallback((record: VtsSystemResponse) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[] = [];
    if (hasPerm('vts:read')) {
      actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => { setEditingId(record.id); setSelectedRecord(record); setModalMode('detail'); setIsModalOpen(true); } });
    }
    if (hasPerm('vts:history')) {
      actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => handleViewHistory(record) });
    }
    if (hasPerm('vts:update') && record.approvalStatus !== ApprovalStatus.APPROVED) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => { setEditingId(record.id); setSelectedRecord(record); setModalMode('edit'); setIsModalOpen(true); } });
    }
    if (hasPerm('vts:approvec1') && (record.approvalStatus === ApprovalStatus.PROPOSED || record.approvalStatus === ApprovalStatus.PENDING_APPROVAL)) {
      actions.push({ key: 'approveC1', label: 'Phê duyệt cấp Cảng vụ', icon: <CheckOutlined />, onClick: () => openApproveModal(record.id, 'c1') });
      actions.push({ key: 'rejectC1', label: 'Từ chối cấp Cảng vụ', danger: true, icon: <CloseOutlined />, onClick: () => openRejectModal(record.id, 'c1') });
    }
    if (hasPerm('vts:approvec2') && (record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 || record.approvalStatus === ApprovalStatus.PENDING_APPROVAL)) {
      const isSelfApproval = Boolean(currentUser?.userId && record.approverLevel1 === currentUser.userId);
      actions.push({ key: 'approveC2', label: isSelfApproval ? 'Phê duyệt cấp Cục (không thể tự duyệt)' : 'Phê duyệt cấp Cục', icon: <CheckOutlined />, disabled: isSelfApproval, onClick: () => openApproveModal(record.id, 'c2') });
      actions.push({ key: 'rejectC2', label: isSelfApproval ? 'Từ chối cấp Cục (không thể tự duyệt)' : 'Từ chối cấp Cục', danger: true, disabled: isSelfApproval, icon: <CloseOutlined />, onClick: () => openRejectModal(record.id, 'c2') });
    }
    if (hasPerm('vts:delete') && record.approvalStatus === ApprovalStatus.APPROVED) {
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => confirmDelete(record) });
    }
    return actions;
  }, [hasPerm, currentUser?.userId, refreshList]);

  const countAllFiltered = countProposed + countPendingApproval + countApprovedLevel1 + countApproved + countRejected;

  const statusTabs = useMemo(() => [
    { key: 'all', label: 'Tất cả', count: filterApprovalStatus ? countAllFiltered : total, color: actionPrimary, active: !filterApprovalStatus },
    { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', count: countProposed, color: statusDraft, active: filterApprovalStatus === ApprovalStatus.DRAFT || filterApprovalStatus === ApprovalStatus.PROPOSED },
    { key: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ Cảng vụ duyệt', count: countPendingApproval, color: statusAttention, active: filterApprovalStatus === ApprovalStatus.PENDING_APPROVAL },
    { key: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ Cục duyệt', count: countApprovedLevel1, color: '#13C2C2', active: filterApprovalStatus === ApprovalStatus.APPROVED_LEVEL1 },
    { key: ApprovalStatus.APPROVED, label: 'Đã duyệt', count: countApproved, color: statusOperational, active: filterApprovalStatus === ApprovalStatus.APPROVED || filterApprovalStatus === ApprovalStatus.APPROVED_LEVEL2 },
    { key: ApprovalStatus.REJECTED, label: 'Từ chối', count: countRejected, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2 },
  ], [total, countAllFiltered, filterApprovalStatus, countProposed, countPendingApproval, countApprovedLevel1, countApproved, countRejected]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setFilterKeyword(values.keyword?.trim() || '');
    setFilterOrgUnitId(values.orgUnitId || undefined);
    setFilterConditionStatus(values.conditionStatus || undefined);
    setFilterApprovalStatus(values.approvalStatus || undefined);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilterKeyword(''); setFilterOrgUnitId(undefined); setFilterConditionStatus(undefined); setFilterApprovalStatus(undefined); setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    const approvalStatus = key === 'all' ? undefined : key as ApprovalStatus;
    setFilterApprovalStatus(approvalStatus);
    setFilterValues((prev) => ({ ...prev, approvalStatus }));
    setPage(1);
  }, []);

  // ── History rendering ──────────────────────────────────────────

  const fmtTime = (ts: string) => {
    const d = dayjs(ts);
    return `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`;
  };

  const renderHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r, userMap);
      if (prev && prev.tsSec === sec && prev.actor === actor) prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor, items: [r] });
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
      })}</div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Hệ thống VTS' }]}
        actions={
          hasPerm('vts:create')
            ? [{
              key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />,
              onClick: () => { setEditingId(null); setModalMode('create'); setIsModalOpen(true); }
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
        onRetry={refreshList}
        statusTabs={statusTabs}
        onStatusTabChange={handleTabChange}
        filterContent={
          <>
            <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Đơn vị quản lý</div>
              <OrgUnitTreeSelect
                organizations={orgUnitOptions}
                placeholder="Tất cả"
                allowClear
                treeDefaultExpandAll={true}
                listHeight={256}
                value={filterValues.orgUnitId}
                onChange={(value) => setFilterValues((prev) => ({ ...prev, orgUnitId: value }))}
                style={{ ...selectStyle, width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: spaceFormField }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tìm kiếm</div>
              <Input
                placeholder="Tìm theo mã, tên hệ thống VTS..."
                allowClear
                value={filterValues.keyword || ''}
                onChange={(event) => setFilterValues((prev) => ({ ...prev, keyword: event.target.value }))}
                onPressEnter={() => handleFilterSearch(filterValues)}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </div>
            <div style={{ marginBottom: spaceFormField }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tình trạng</div>
              <Select
                placeholder="Tất cả"
                allowClear
                value={filterValues.conditionStatus}
                onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                options={CONDITION_STATUS_OPTIONS}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              />
            </div>
            {filterCollapsed && (
              <div style={{ marginBottom: spaceFormField }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Trạng thái phê duyệt</div>
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
                    { value: ApprovalStatus.REJECTED, label: 'Từ chối' },
                  ]}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>
            )}
          </>
        }
        hideFilterToggle={true}
      >
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          loading={false}
          scroll={{ x: 'max-content' }}
          emptyState={dataSource.length === 0 && !loading
            ? <EmptyState description="Chưa có hệ thống VTS nào" />
            : undefined}
        />
        {dataSource.length > 0 && (
          <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
        )}
      </FilterTableLayout>

      {/* Form tự quản lý Drawer để dùng cùng một lớp hiển thị như màn Cảng biển. */}
      {isModalOpen && (
        <VtsSystemForm
          open={true}
          editId={editingId}
          initialData={selectedRecord}
          mode={modalMode}
          onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
          onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); refreshList(); }}
        />
      )}

      {/* ── History drawer ────────────────────────────────────────── */}
      <Drawer
        width={960}
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
                {selectedRecord ? `Lịch sử thay đổi — ${selectedRecord.systemName}` : 'Lịch sử thay đổi'}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>Tổng cộng {historyGroupCount}</span>
            </Space>
          </div>
        }
      >
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
          {!loadingHistory && (
            <div style={{ display: 'none' }}>
              <Radio.Group value="current" size="middle" style={{ display: 'flex', width: '100%', borderBottom: `1px solid ${borderDefault}` }}>
                <Radio.Button value="current" style={{ flex: 1, minWidth: 0, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderRadius: 0, border: 'none', background: 'transparent', fontSize: fontSizeMd, padding: `0 ${spaceMd}px`, borderBottom: `2px solid ${actionPrimary}`, fontWeight: fontWeightBold, color: actionPrimary }}>Bản ghi hiện tại <Tag color="blue" style={{ borderRadius: radiusPill, fontSize: 11, marginLeft: 4 }}>{historyGroupCount}</Tag></Radio.Button>
                {/* ALL_TAB_HIDDEN — cần backend getAllHistory cho VTS để bật tab này */}
              </Radio.Group>
            </div>
          )}
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
              onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
            <DatePicker placeholder="Từ ngày" classNames={{ popup: { root: 'history-dt-popup' } }} value={historyDateFrom ? dayjs(historyDateFrom) : null}
              onChange={d => setHistoryDateFrom(d ? d.startOf('minute').format('YYYY-MM-DDTHH:mm:ss') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <DatePicker placeholder="Đến ngày" classNames={{ popup: { root: 'history-dt-popup' } }} value={historyDateTo ? dayjs(historyDateTo) : null}
              onChange={d => setHistoryDateTo(d ? d.endOf('minute').format('YYYY-MM-DDTHH:mm:ss') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <Button type="primary" icon={<SearchOutlined />} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Tìm kiếm</Button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {loadingHistory && historyRecords.length === 0 ? <LoadingSkeleton rows={5} /> :
            historyRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
              </div>
            ) : (
              <>
                {renderHistoryTimeline(historyRecords)}
                {loadingMoreHistory && <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm...</div>}
              </>
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
      <Modal title="Từ chối" open={rejectModalOpen} onOk={handleReject}
        onCancel={() => setRejectModalOpen(false)} okText="Từ chối" cancelText="Hủy" okButtonProps={{ danger: true }}>
        <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối (tối thiểu 10 ký tự):</p>
        <Input.TextArea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối..." />
      </Modal>
    </div>
  );
}
