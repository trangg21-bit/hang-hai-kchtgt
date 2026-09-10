import { useMemo, useCallback } from 'react';
import { ApprovalStatus } from '../../types/vtsSystem';
import {
  actionPrimary,
  statusDraft,
  statusAttention,
  statusOperational,
  statusCritical,
} from '../../themetokenchk';
import type { StatusTab } from '../list-view/StatusTabs';

export interface ApprovalStatusCounts {
  DRAFT?: number;
  PENDING_APPROVAL?: number;
  APPROVED_LEVEL1?: number;
  APPROVED?: number;
  REJECTED_LEVEL1?: number;
  REJECTED_LEVEL2?: number;
  // Fallbacks for legacy/camelCase properties
  draft?: number;
  pending?: number;
  pendingApproval?: number;
  PROPOSED?: number;
  approvedLevel1?: number;
  approvedL1?: number;
  approved?: number;
  APPROVED_LEVEL2?: number;
  approvedLevel2?: number;
  rejectedLevel1?: number;
  REJECTED?: number;
  rejected?: number;
  rejectedLevel2?: number;
  [key: string]: number | undefined;
}

/**
 * 7 tab trang thai phe duyet chuan theo quy dinh he thong:
 * Tat ca, Luu tam, Cho Cang vu duyet, Cho Cuc duyet, Da duyet, Tu choi C1, Tu choi C2.
 */
export const STANDARD_APPROVAL_STATUS_CONFIG = [
  { key: 'ALL', label: 'Tất cả', color: actionPrimary },
  { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', color: statusDraft },
  { key: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  { key: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ phê duyệt cấp cục', color: statusAttention },
  { key: ApprovalStatus.APPROVED, label: 'Đã phê duyệt', color: statusOperational },
  { key: ApprovalStatus.REJECTED_LEVEL1, label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  { key: ApprovalStatus.REJECTED_LEVEL2, label: 'Từ chối cấp cục', color: statusCritical },
] as const;

/**
 * Tao danh sach StatusTab chuan voi so luong dem chinh xac va mau sac semantic.
 * Sua tai day se tu dong ap dung dong bo cho tat ca cac man hinh su dung.
 */
export function buildStandardApprovalTabs(
  counts: ApprovalStatusCounts | null | undefined,
  currentStatus: ApprovalStatus | string | undefined
): StatusTab[] {
  const d = Number(counts?.DRAFT ?? counts?.draft ?? 0);
  const p = Number(counts?.PENDING_APPROVAL ?? counts?.pendingApproval ?? counts?.pending ?? counts?.PROPOSED ?? 0);
  const a1 = Number(counts?.APPROVED_LEVEL1 ?? counts?.approvedLevel1 ?? counts?.approvedL1 ?? 0);
  const a = Number(counts?.APPROVED ?? counts?.approved ?? 0) + Number(counts?.APPROVED_LEVEL2 ?? counts?.approvedLevel2 ?? 0);
  const r1 = Number(counts?.REJECTED_LEVEL1 ?? counts?.rejectedLevel1 ?? counts?.REJECTED ?? counts?.rejected ?? 0);
  const r2 = Number(counts?.REJECTED_LEVEL2 ?? counts?.rejectedLevel2 ?? 0);

  const countAll = d + p + a1 + a + r1 + r2;

  return [
    { key: 'ALL', label: 'Tất cả', count: countAll, color: actionPrimary, active: !currentStatus || currentStatus === 'ALL' || currentStatus === 'all' },
    { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', count: d, color: statusDraft, active: currentStatus === ApprovalStatus.DRAFT },
    { key: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', count: p, color: actionPrimary, active: currentStatus === ApprovalStatus.PENDING_APPROVAL || currentStatus === 'PENDING_APPROVAL' },
    { key: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ phê duyệt cấp cục', count: a1, color: statusAttention, active: currentStatus === ApprovalStatus.APPROVED_LEVEL1 || currentStatus === 'APPROVED_LEVEL1' },
    { key: ApprovalStatus.APPROVED, label: 'Đã phê duyệt', count: a, color: statusOperational, active: currentStatus === ApprovalStatus.APPROVED || currentStatus === 'APPROVED' },
    { key: ApprovalStatus.REJECTED_LEVEL1, label: 'Từ chối cấp Cảng vụ/Chi cục', count: r1, color: statusCritical, active: currentStatus === ApprovalStatus.REJECTED_LEVEL1 || currentStatus === 'REJECTED_LEVEL1' },
    { key: ApprovalStatus.REJECTED_LEVEL2, label: 'Từ chối cấp cục', count: r2, color: statusCritical, active: currentStatus === ApprovalStatus.REJECTED_LEVEL2 || currentStatus === 'REJECTED_LEVEL2' },
  ];
}

/**
 * Hook chuan hoa quan ly statusTabs va chuyen tab cho man hinh danh sach.
 */
export function useStandardApprovalStatusTabs(
  counts: ApprovalStatusCounts | null | undefined,
  currentStatus: ApprovalStatus | string | undefined,
  onStatusChange: (status: ApprovalStatus | undefined) => void
) {
  const statusTabs = useMemo(() => {
    return buildStandardApprovalTabs(counts, currentStatus);
  }, [counts, currentStatus]);

  const handleTabChange = useCallback((key: string) => {
    const status = key === 'ALL' || key === 'all' ? undefined : (key as ApprovalStatus);
    onStatusChange(status);
  }, [onStatusChange]);

  return { statusTabs, handleTabChange };
}
