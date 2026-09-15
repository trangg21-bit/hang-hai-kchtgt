import { describe, it, expect } from 'vitest';
import {
  canDeleteApprovalRecord,
  canEditApprovalRecord,
  normalizeApprovalStatus,
  isApprovedRecord,
  isEditableByOwner,
  isAwaitingApproval,
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

    it('returns true for DRAFT when user has resource:manage or data:delete', () => {
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm: (p) => p === 'vts:manage', resource: 'vts' })).toBe(true);
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm: (p) => p === 'data:delete', resource: 'vts' })).toBe(true);
      expect(canDeleteApprovalRecord('DRAFT', { hasPerm: (p) => p === 'admin:manage', resource: 'vts' })).toBe(true);
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

    it('for APPROVED records: requires approvec2 or approve permission', () => {
      const updateOnly = (p: string) => p === 'vts:update';
      const approveC2 = (p: string) => p === 'vts:approvec2';

      expect(canEditApprovalRecord('APPROVED', { hasPerm: updateOnly, resource: 'vts' })).toBe(false);
      expect(canEditApprovalRecord('APPROVED', { hasPerm: approveC2, resource: 'vts' })).toBe(true);
    });
  });

  describe('status helper functions', () => {
    it('normalizes legacy aliases', () => {
      expect(normalizeApprovalStatus('NHAP')).toBe('DRAFT');
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
});
