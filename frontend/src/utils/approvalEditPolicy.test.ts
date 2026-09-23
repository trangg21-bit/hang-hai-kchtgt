import { describe, it, expect } from 'vitest';
import {
  canDeleteApprovalRecord,
  canEditApprovalRecord,
  normalizeApprovalStatus,
  isApprovedRecord,
  isEditableByOwner,
  isAwaitingApproval,
  isAssetRecordEditable,
} from './approvalEditPolicy';

describe('approvalEditPolicy', () => {
  describe('canDeleteApprovalRecord', () => {
    it('returns false for non-DRAFT statuses regardless of permissions', () => {
      const allPerms = () => true;
      expect(canDeleteApprovalRecord('PENDING_APPROVAL', { hasPerm: allPerms, resource: 'vts' })).toBe(false);
      expect(canDeleteApprovalRecord('APPROVED_LEVEL1', { hasPerm: allPerms, resource: 'vts' })).toBe(false);
      expect(canDeleteApprovalRecord('APPROVED', { hasPerm: allPerms, resource: 'vts' })).toBe(false);
      expect(canDeleteApprovalRecord('REJECTED_LEVEL1', { hasPerm: allPerms, resource: 'vts' })).toBe(false);
      expect(canDeleteApprovalRecord('ARCHIVED', { hasPerm: allPerms, resource: 'vts' })).toBe(false);
    });

    it('returns false for DRAFT if user only has create permission', () => {
      const perms = new Set(['vts:create']);
      const hasPerm = (p: string) => perms.has(p);
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm, resource: 'vts' })).toBe(false);
      expect(canDeleteApprovalRecord(0, { hasPerm, resource: 'vts' })).toBe(false);
    });

    it('returns false for DRAFT if user only has update permission', () => {
      const perms = new Set(['vts:update']);
      const hasPerm = (p: string) => perms.has(p);
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm, resource: 'vts' })).toBe(false);
    });

    it('returns false for DRAFT if user has no permissions', () => {
      const hasPerm = () => false;
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm, resource: 'vts' })).toBe(false);
    });

    it('returns true for DRAFT when user has delete permission', () => {
      const perms = new Set(['vts:delete']);
      const hasPerm = (p: string) => perms.has(p);
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm, resource: 'vts' })).toBe(true);
    });

    it('requires the exact delete permission and rejects legacy fallbacks', () => {
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm: (p) => p === 'vts:manage', resource: 'vts' })).toBe(false);
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm: (p) => p === 'data:delete', resource: 'data' })).toBe(true);
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm: (p) => p === 'admin:all', resource: 'vts' })).toBe(true);
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm: (p) => p === 'data:delete', resource: 'vts' })).toBe(false);
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm: (p) => p === 'data:delete', resource: 'vts', extraDeletePerms: ['data:delete'] })).toBe(false);
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm: (p) => p === 'infraasset:manage', resource: 'vts' })).toBe(false);
    });
  });

  describe('canEditApprovalRecord', () => {
    it('returns false for awaiting approval or archived records', () => {
      const allPerms = () => true;
      expect(canEditApprovalRecord('PENDING_APPROVAL', { hasPerm: allPerms, resource: 'vts' })).toBe(false);
      expect(canEditApprovalRecord('APPROVED_LEVEL1', { hasPerm: allPerms, resource: 'vts' })).toBe(false);
      expect(canEditApprovalRecord('ARCHIVED', { hasPerm: allPerms, resource: 'vts' })).toBe(false);
    });

    it('for DRAFT and REJECTED records: requires update permission', () => {
      const createOnly = (p: string) => p === 'vts:create';
      const updatePerm = (p: string) => p === 'vts:update';

      expect(canEditApprovalRecord('DRAFT', { hasPerm: createOnly, resource: 'vts' })).toBe(false);
      expect(canEditApprovalRecord('REJECTED_LEVEL1', { hasPerm: createOnly, resource: 'vts' })).toBe(false);
      expect(canEditApprovalRecord('REJECTED_LEVEL2', { hasPerm: createOnly, resource: 'vts' })).toBe(false);

      expect(canEditApprovalRecord('DRAFT', { hasPerm: updatePerm, resource: 'vts' })).toBe(true);
      expect(canEditApprovalRecord('REJECTED_LEVEL1', { hasPerm: updatePerm, resource: 'vts' })).toBe(true);
      expect(canEditApprovalRecord('REJECTED_LEVEL2', { hasPerm: updatePerm, resource: 'vts' })).toBe(true);
    });

    it('for APPROVED records: requires update AND approvec2 permission', () => {
      const updateOnly = (p: string) => p === 'vts:update';
      const approveC2 = (p: string) => p === 'vts:approvec2';
      const updateAndApproveC2 = (p: string) => p === 'vts:update' || p === 'vts:approvec2';
      const none = () => false;

      // Sửa hồ sơ APPROVED: bắt buộc phải có cả update VÀ approvec2 (quy tắc 12/T12)
      expect(canEditApprovalRecord('APPROVED', { hasPerm: updateOnly, resource: 'vts' })).toBe(false);
      expect(canEditApprovalRecord('APPROVED', { hasPerm: updateAndApproveC2, resource: 'vts' })).toBe(true);
      // Khi người quản trị bỏ tích quyền update: nút Chỉnh sửa phải ẩn (false) kể cả khi còn approvec2
      expect(canEditApprovalRecord('APPROVED', { hasPerm: approveC2, resource: 'vts' })).toBe(false);
      expect(canEditApprovalRecord('APPROVED', { hasPerm: (p) => p === 'vts:approve', resource: 'vts' })).toBe(false);
      // Chỉ có quyền duyệt C2 mà THIẾU quyền cập nhật -> KHÔNG được sửa hồ sơ Đã duyệt.
      expect(canEditApprovalRecord('APPROVED', { hasPerm: approveC2, resource: 'vts' })).toBe(false);
      // Có đủ cả hai -> được sửa qua "Lưu và phê duyệt".
      expect(canEditApprovalRecord('APPROVED', { hasPerm: (p) => p === 'vts:update' || p === 'vts:approvec2', resource: 'vts' })).toBe(true);
    });

    it('never allows edit on any status when :update is missing', () => {
      // Tài khoản có mọi quyền vtsassist:* TRỪ vtsassist:update — đúng ca lỗi thực tế.
      const allExceptUpdate = (p: string) => p !== 'vts:update';
      const allExceptUpdateAndWrite = (p: string) => p !== 'vts:update' && p !== 'vts:write';

      expect(canEditApprovalRecord('DRAFT', { hasPerm: allExceptUpdateAndWrite, resource: 'vts' })).toBe(false);
      expect(canEditApprovalRecord('REJECTED_LEVEL1', { hasPerm: allExceptUpdateAndWrite, resource: 'vts' })).toBe(false);
      expect(canEditApprovalRecord('REJECTED_LEVEL2', { hasPerm: allExceptUpdateAndWrite, resource: 'vts' })).toBe(false);
      expect(canEditApprovalRecord('APPROVED', { hasPerm: allExceptUpdate, resource: 'vts' })).toBe(false);
    });
  });

  describe('status helper functions', () => {
    it('normalizes legacy aliases', () => {
      expect(normalizeApprovalStatus('NHAP')).toBe('DRAFT');
      expect(normalizeApprovalStatus('PROPOSED')).toBe('PENDING_APPROVAL');
      expect(normalizeApprovalStatus('PENDING')).toBe('PENDING_APPROVAL');
      expect(normalizeApprovalStatus('APPROVED_L1')).toBe('APPROVED_LEVEL1');
      expect(normalizeApprovalStatus('APPROVED_L2')).toBe('APPROVED');
      expect(normalizeApprovalStatus('TU_CHOI')).toBe('REJECTED_LEVEL1');
      expect(normalizeApprovalStatus(null)).toBe('DRAFT');
    });

    it('checks status predicates correctly', () => {
      expect(isApprovedRecord('APPROVED')).toBe(true);
      expect(isApprovedRecord('APPROVED_L2')).toBe(true);
      expect(isApprovedRecord('DRAFT')).toBe(false);

      expect(isEditableByOwner('DRAFT')).toBe(true);
      expect(isEditableByOwner('REJECTED_LEVEL1')).toBe(true);
      expect(isEditableByOwner('APPROVED')).toBe(false);

      expect(isAwaitingApproval('PENDING_APPROVAL')).toBe(true);
      expect(isAwaitingApproval('APPROVED_LEVEL1')).toBe(true);
      expect(isAwaitingApproval('DRAFT')).toBe(false);
    });
  });

  describe('isAssetRecordEditable', () => {
    it('returns false for Archived / Deleted records', () => {
      expect(isAssetRecordEditable('ARCHIVED')).toBe(false);
      expect(isAssetRecordEditable('DELETED')).toBe(false);
      expect(isAssetRecordEditable('Đã xóa')).toBe(false);
      expect(isAssetRecordEditable('DA_XOA')).toBe(false);
      expect(isAssetRecordEditable(7)).toBe(false);
      expect(isAssetRecordEditable('7')).toBe(false);
    });

    it('returns false for Level 2 pending approval (Chờ phê duyệt cấp Cục)', () => {
      expect(isAssetRecordEditable('APPROVED_LEVEL1')).toBe(false);
      expect(isAssetRecordEditable('APPROVED_L1')).toBe(false);
      expect(isAssetRecordEditable('PENDING_APPROVAL_LEVEL2')).toBe(false);
      expect(isAssetRecordEditable('CHO_PD_CAP_CUC')).toBe(false);
      expect(isAssetRecordEditable('Chờ phê duyệt cấp Cục')).toBe(false);
      expect(isAssetRecordEditable('Chờ Cục duyệt')).toBe(false);
      expect(isAssetRecordEditable(3)).toBe(false);
      expect(isAssetRecordEditable('3')).toBe(false);
    });

    it('returns false for Level 1 pending approval (Chờ phê duyệt cấp Cảng vụ/Chi cục)', () => {
      expect(isAssetRecordEditable('PENDING_APPROVAL')).toBe(false);
      expect(isAssetRecordEditable('PENDING_APPROVAL_LEVEL1')).toBe(false);
      expect(isAssetRecordEditable('PROPOSED')).toBe(false);
      expect(isAssetRecordEditable('PENDING')).toBe(false);
      expect(isAssetRecordEditable('CHO_PHE_DUYET')).toBe(false);
      expect(isAssetRecordEditable('Chờ phê duyệt cấp Cảng vụ/Chi cục')).toBe(false);
      expect(isAssetRecordEditable('Chờ Cảng vụ duyệt')).toBe(false);
      expect(isAssetRecordEditable('Chờ phê duyệt cấp Chi cục')).toBe(false);
      expect(isAssetRecordEditable(1)).toBe(false);
      expect(isAssetRecordEditable(2)).toBe(false);
    });

    it('returns true for all other statuses (Lưu tạm, Đã duyệt, Bị trả về/Từ chối)', () => {
      // DRAFT
      expect(isAssetRecordEditable('DRAFT')).toBe(true);
      expect(isAssetRecordEditable('Lưu tạm')).toBe(true);
      expect(isAssetRecordEditable(0)).toBe(true);
      expect(isAssetRecordEditable('0')).toBe(true);

      // APPROVED
      expect(isAssetRecordEditable('APPROVED')).toBe(true);
      expect(isAssetRecordEditable('APPROVED_LEVEL2')).toBe(true);
      expect(isAssetRecordEditable('Đã phê duyệt')).toBe(true);
      expect(isAssetRecordEditable(5)).toBe(true);
      expect(isAssetRecordEditable(4)).toBe(true);

      // REJECTED
      expect(isAssetRecordEditable('REJECTED_LEVEL1')).toBe(true);
      expect(isAssetRecordEditable('REJECTED_LEVEL2')).toBe(true);
      expect(isAssetRecordEditable('REJECTED')).toBe(true);
      expect(isAssetRecordEditable('Từ chối')).toBe(true);
      expect(isAssetRecordEditable(8)).toBe(true);
      expect(isAssetRecordEditable(9)).toBe(true);

      // null / undefined default to true
      expect(isAssetRecordEditable(null)).toBe(true);
      expect(isAssetRecordEditable(undefined)).toBe(true);
    });
  });
});
