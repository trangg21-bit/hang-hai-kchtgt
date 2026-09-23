import { describe, it, expect } from 'vitest';
import { DIKE_REVETMENT_STATUS_LABELS, DIKE_REVETMENT_STATUS_MAP } from '../../types/dikeRevetment';
import { APPROVAL_STATUS_STYLE } from '../../components/shared/ApprovalStatusBadge';
import { actionPrimary, statusAttention, statusOperational, statusCritical, statusDraft } from '../../tokens';

describe('DikeRevetment Approval Status Colors & Labels (/dike-revetment)', () => {
  it('DIKE_REVETMENT_STATUS_LABELS matches 6 standard approval labels', () => {
    expect(DIKE_REVETMENT_STATUS_LABELS.DRAFT).toBe('Lưu tạm');
    expect(DIKE_REVETMENT_STATUS_LABELS.PENDING_APPROVAL).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');
    expect(DIKE_REVETMENT_STATUS_LABELS.APPROVED_LEVEL1).toBe('Chờ phê duyệt cấp Cục');
    expect(DIKE_REVETMENT_STATUS_LABELS.APPROVED).toBe('Đã phê duyệt');
    expect(DIKE_REVETMENT_STATUS_LABELS.REJECTED_LEVEL1).toBe('Từ chối cấp Cảng vụ/Chi cục');
    expect(DIKE_REVETMENT_STATUS_LABELS.REJECTED_LEVEL2).toBe('Từ chối cấp Cục');
    expect(DIKE_REVETMENT_STATUS_LABELS.ARCHIVED).toBe('Đã xóa');
  });

  it('DIKE_REVETMENT_STATUS_MAP maps legacy & standard statuses to correct labels', () => {
    expect(DIKE_REVETMENT_STATUS_MAP.DRAFT.label).toBe('Lưu tạm');
    expect(DIKE_REVETMENT_STATUS_MAP.PROPOSED.label).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');
    expect(DIKE_REVETMENT_STATUS_MAP.PENDING.label).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');
    expect(DIKE_REVETMENT_STATUS_MAP.PENDING_APPROVAL.label).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');
    expect(DIKE_REVETMENT_STATUS_MAP.APPROVED_L1.label).toBe('Chờ phê duyệt cấp Cục');
    expect(DIKE_REVETMENT_STATUS_MAP.APPROVED_LEVEL1.label).toBe('Chờ phê duyệt cấp Cục');
    expect(DIKE_REVETMENT_STATUS_MAP.APPROVED.label).toBe('Đã phê duyệt');
    expect(DIKE_REVETMENT_STATUS_MAP.REJECTED_LEVEL1.label).toBe('Từ chối cấp Cảng vụ/Chi cục');
    expect(DIKE_REVETMENT_STATUS_MAP.REJECTED_LEVEL2.label).toBe('Từ chối cấp Cục');
    expect(DIKE_REVETMENT_STATUS_MAP.ARCHIVED.label).toBe('Đã xóa');
  });

  it('APPROVAL_STATUS_STYLE aligns Level 1 to actionPrimary and Level 2 to statusAttention', () => {
    // Cấp Cảng vụ/Chi cục (Cấp 1) = actionPrimary (#204E9C - xanh navy)
    expect(APPROVAL_STATUS_STYLE.PENDING_APPROVAL.color).toBe(actionPrimary);
    expect(APPROVAL_STATUS_STYLE.PENDING_APPROVAL.label).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');

    // Cấp Cục (Cấp 2) = statusAttention (#EDA100 - vàng/cam)
    expect(APPROVAL_STATUS_STYLE.APPROVED_LEVEL1.color).toBe(statusAttention);
    expect(APPROVAL_STATUS_STYLE.APPROVED_LEVEL1.label).toBe('Chờ phê duyệt cấp Cục');

    // Đã duyệt = statusOperational
    expect(APPROVAL_STATUS_STYLE.APPROVED.color).toBe(statusOperational);

    // Lưu tạm = statusDraft
    expect(APPROVAL_STATUS_STYLE.DRAFT.color).toBe(statusDraft);

    // Từ chối / Đã xóa = statusCritical
    expect(APPROVAL_STATUS_STYLE.REJECTED_LEVEL1.color).toBe(statusCritical);
    expect(APPROVAL_STATUS_STYLE.REJECTED_LEVEL2.color).toBe(statusCritical);
    expect(APPROVAL_STATUS_STYLE.ARCHIVED.color).toBe(statusCritical);
  });
});
