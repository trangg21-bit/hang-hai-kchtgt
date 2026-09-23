import { describe, it, expect } from 'vitest';
import { BEACON_STATUS_MAP } from '../../types/beacon';
import { normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import { APPROVAL_STATUS_STYLE } from '../../components/shared/ApprovalStatusBadge';
import { actionPrimary, statusAttention, statusOperational, statusCritical, statusDraft } from '../../tokens';

describe('BeaconStation Approval Status Colors & Mapping (/beacon-stations)', () => {
  it('BEACON_STATUS_MAP maps Level 1 pending approval to blue and Level 2 to orange', () => {
    // Cấp Cảng vụ/Chi cục (Cấp 1) -> blue
    expect(BEACON_STATUS_MAP.PENDING_APPROVAL.color).toBe('blue');
    expect(BEACON_STATUS_MAP.PENDING_APPROVAL.label).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');
    expect(BEACON_STATUS_MAP.PROPOSED.color).toBe('blue');
    expect(BEACON_STATUS_MAP.PENDING.color).toBe('blue');

    // Cấp Cục (Cấp 2) -> orange
    expect(BEACON_STATUS_MAP.APPROVED_LEVEL1.color).toBe('orange');
    expect(BEACON_STATUS_MAP.APPROVED_LEVEL1.label).toBe('Chờ phê duyệt cấp Cục');
    expect(BEACON_STATUS_MAP.APPROVED_L1.color).toBe('orange');

    // Đã duyệt -> green
    expect(BEACON_STATUS_MAP.APPROVED.color).toBe('green');
    // Lưu tạm -> default
    expect(BEACON_STATUS_MAP.DRAFT.color).toBe('default');
  });

  it('normalizeApprovalStatus correctly normalizes PROPOSED to PENDING_APPROVAL', () => {
    expect(normalizeApprovalStatus('PROPOSED')).toBe('PENDING_APPROVAL');
    expect(normalizeApprovalStatus('PENDING')).toBe('PENDING_APPROVAL');
    expect(normalizeApprovalStatus('APPROVED_L1')).toBe('APPROVED_LEVEL1');
    expect(normalizeApprovalStatus('NHAP')).toBe('DRAFT');
  });

  it('APPROVAL_STATUS_STYLE has correct semantic tokens matching AGENTS.md convention', () => {
    // Cấp 1 (Chờ phê duyệt cấp Cảng vụ/Chi cục) = actionPrimary (#204E9C)
    expect(APPROVAL_STATUS_STYLE.PENDING_APPROVAL.color).toBe(actionPrimary);
    expect(APPROVAL_STATUS_STYLE.PENDING_APPROVAL.label).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');

    // Cấp 2 (Chờ phê duyệt cấp Cục) = statusAttention (#EDA100)
    expect(APPROVAL_STATUS_STYLE.APPROVED_LEVEL1.color).toBe(statusAttention);
    expect(APPROVAL_STATUS_STYLE.APPROVED_LEVEL1.label).toBe('Chờ phê duyệt cấp Cục');

    // Đã phê duyệt = statusOperational
    expect(APPROVAL_STATUS_STYLE.APPROVED.color).toBe(statusOperational);

    // Lưu tạm = statusDraft
    expect(APPROVAL_STATUS_STYLE.DRAFT.color).toBe(statusDraft);

    // Từ chối / Đã xóa = statusCritical
    expect(APPROVAL_STATUS_STYLE.REJECTED_LEVEL1.color).toBe(statusCritical);
    expect(APPROVAL_STATUS_STYLE.REJECTED_LEVEL2.color).toBe(statusCritical);
    expect(APPROVAL_STATUS_STYLE.ARCHIVED.color).toBe(statusCritical);
  });
});
