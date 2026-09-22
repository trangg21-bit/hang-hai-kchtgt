import { describe, it, expect, beforeEach } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useAuthStore } from '../store/authStore';
import { usePermissionStore } from '../store/permissionStore';
import { useKchtPermissions, type UseKchtPermissionsOptions } from './useKchtPermissions';

function renderKchtHook(resource: string, options?: UseKchtPermissionsOptions) {
  let hookResult: ReturnType<typeof useKchtPermissions> | undefined;
  function TestComponent() {
    hookResult = useKchtPermissions(resource, options);
    return null;
  }
  renderToStaticMarkup(React.createElement(TestComponent));
  if (!hookResult) {
    throw new Error('Hook failed to execute');
  }
  return hookResult;
}

describe('useKchtPermissions Unit Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        userId: 'u1',
        username: 'normal_user',
        unitType: 'CVHH',
        permissions: [],
      } as any,
    });
    usePermissionStore.setState({ permissions: [] });
  });

  describe('Admin override', () => {
    it('does not infer C1 or C2 approval from admin:all', () => {
      useAuthStore.setState({
        user: {
          id: 'admin-without-approval',
          userId: 'admin-without-approval',
          username: 'admin_without_approval',
          unitType: 'MINISTRY',
          orgUnitId: '00000000-0000-0000-0000-000000000017',
          orgUnitCode: 'G17',
          permissions: ['admin:all', 'vts:create'],
        } as any,
      });
      usePermissionStore.setState({ permissions: ['admin:all', 'vts:create'] });

      const perms = renderKchtHook('vts');
      expect(perms.isAdmin).toBe(true);
      expect(perms.hasApproveL1Perm).toBe(false);
      expect(perms.hasApproveL2Perm).toBe(false);
      expect(perms.canSaveAndApprove).toBe(false);
      expect(perms.canApproveL1({ approvalStatus: 'PENDING_APPROVAL' })).toBe(false);
      expect(perms.canApproveL2({ approvalStatus: 'APPROVED_LEVEL1' })).toBe(false);
    });

    it('requires explicit resource permissions even for SUPER_ADMIN', () => {
      useAuthStore.setState({
        user: {
          id: 'admin1',
          username: 'superadmin',
          role: 'SUPER_ADMIN',
          unitType: 'MINISTRY',
          orgUnitId: '00000000-0000-0000-0000-000000000017',
          orgUnitCode: 'G17',
          permissions: ['admin:all', 'vts:approvec1', 'vts:approvec2'],
        } as any,
      });
      usePermissionStore.setState({ permissions: ['admin:all', 'vts:approvec1', 'vts:approvec2'] });

      const perms = renderKchtHook('vts');
      expect(perms.isAdmin).toBe(true);
      expect(perms.isCucLevel).toBe(true);
      // Having vts:approvec1/c2 grants implicit read for vts, but not create or history
      expect(perms.canRead).toBe(true);
      expect(perms.canCreate).toBe(false);
      expect(perms.canViewHistory).toBe(false);
      expect(perms.canSaveAndApprove).toBe(true);

      // Other resources without permissions cannot be read
      const portPerms = renderKchtHook('port');
      expect(portPerms.canRead).toBe(false);

      // Admin can approve even own created record (separation of duty override)
      const ownRecord = { id: 'rec-1', createdBy: 'admin1', approvalStatus: 'PENDING_APPROVAL' };
      expect(perms.canApproveL1(ownRecord)).toBe(true);

      // Even admin must have the exact delete right.
      expect(perms.canDelete({ id: 'rec-1', approvalStatus: 'APPROVED' })).toBe(false);
      expect(perms.canDelete({ id: 'rec-1', approvalStatus: 'DRAFT' })).toBe(false);
    });
  });

  describe('Standard User with Specific Permissions', () => {
    it('respects create-only permission and blocks update, delete, approve', () => {
      useAuthStore.setState({
        user: {
          id: 'u2',
          userId: 'u2',
          username: 'creator_only',
          unitType: 'CVHH',
          permissions: ['vts:create'],
        } as any,
      });

      const perms = renderKchtHook('vts');
      expect(perms.canCreate).toBe(true);
      expect(perms.hasUpdatePerm).toBe(false);
      expect(perms.hasApprovePerm).toBe(false);

      const draftRec = { id: 'd1', createdBy: 'u2', approvalStatus: 'DRAFT' };
      expect(perms.canEdit(draftRec)).toBe(false);
      expect(perms.canDelete(draftRec)).toBe(false);
      expect(perms.canSubmit(draftRec)).toBe(false);
    });

    it('allows delete ONLY for DRAFT when user has delete permission (Rule 11)', () => {
      useAuthStore.setState({
        user: {
          id: 'u3',
          userId: 'u3',
          username: 'deleter',
          unitType: 'CVHH',
          permissions: ['vts:delete', 'vts:update'],
        } as any,
      });

      const perms = renderKchtHook('vts');
      expect(perms.canDelete({ id: '1', approvalStatus: 'DRAFT' })).toBe(true);
      expect(perms.canDelete({ id: '2', approvalStatus: 'PENDING_APPROVAL' })).toBe(false);
      expect(perms.canDelete({ id: '3', approvalStatus: 'APPROVED_LEVEL1' })).toBe(false);
      expect(perms.canDelete({ id: '4', approvalStatus: 'APPROVED' })).toBe(false);
      expect(perms.canDelete({ id: '5', approvalStatus: 'REJECTED_LEVEL1' })).toBe(false);
    });
  });

  describe('Approval Separation of Duties (Rule 12 - 2-level mode)', () => {
    it('prevents creator from approving Level 1 unless Cuc level or Admin', () => {
      // User is CVHH (Cảng vụ)
      useAuthStore.setState({
        user: {
          id: 'user-cv',
          userId: 'user-cv',
          username: 'user_cv',
          unitType: 'CVHH',
          permissions: ['vts:approvec1'],
        } as any,
      });

      const perms = renderKchtHook('vts', { approvalLevels: 2 });

      // Record created by someone else -> Can approve L1
      const otherRecord = { id: 'r1', createdBy: 'someone_else', approvalStatus: 'PENDING_APPROVAL' };
      expect(perms.canApproveL1(otherRecord)).toBe(true);

      // Record created by self -> Blocked by separation of duties
      const ownRecord = { id: 'r2', createdBy: 'user-cv', approvalStatus: 'PENDING_APPROVAL' };
      expect(perms.canApproveL1(ownRecord)).toBe(false);
    });

    it('allows Cuc level to approve Level 1 even if created by Cuc officer', () => {
      useAuthStore.setState({
        user: {
          id: 'user-cuc',
          userId: 'user-cuc',
          username: 'user_cuc',
          unitType: 'CHUYEN_VIEN_CUC',
          permissions: ['vts:approvec1'],
        } as any,
      });

      const perms = renderKchtHook('vts', { approvalLevels: 2 });
      const ownRecord = { id: 'r3', createdBy: 'user-cuc', approvalStatus: 'PENDING_APPROVAL' };
      expect(perms.canApproveL1(ownRecord)).toBe(true);
    });

    it('prevents Level 1 approver from approving Level 2 unless Cuc level or Admin', () => {
      useAuthStore.setState({
        user: {
          id: 'approver-cv',
          userId: 'approver-cv',
          username: 'approver_cv',
          unitType: 'CVHH',
          permissions: ['vts:approvec2'],
        } as any,
      });

      const perms = renderKchtHook('vts', { approvalLevels: 2 });

      // Record approved at L1 by this user -> cannot approve L2
      const recApprovedBySelfL1 = {
        id: 'r4',
        approverLevel1: 'approver-cv',
        approvalStatus: 'APPROVED_LEVEL1',
      };
      expect(perms.canApproveL2(recApprovedBySelfL1)).toBe(false);

      // Record approved at L1 by someone else -> can approve L2
      const recApprovedByOtherL1 = {
        id: 'r5',
        approverLevel1: 'other-user',
        approvalStatus: 'APPROVED_LEVEL1',
      };
      expect(perms.canApproveL2(recApprovedByOtherL1)).toBe(true);
    });

    it('allows Cuc level to approve Level 2 even if created by Cuc officer', () => {
      useAuthStore.setState({
        user: {
          id: 'user-cuc-2',
          userId: 'user-cuc-2',
          username: 'user_cuc_2',
          unitType: 'LANH_DAO_CUC',
          permissions: ['vts:approvec2'],
        } as any,
      });

      const perms = renderKchtHook('vts', { approvalLevels: 2 });
      const ownRecord = { id: 'r6', createdBy: 'user-cuc-2', approvalStatus: 'APPROVED_LEVEL1' };
      expect(perms.canApproveL2(ownRecord)).toBe(true);
    });
  });

  describe('1-Level Approval Mode (approvalLevels: 1)', () => {
    it('evaluates approval in 1-level mode correctly', () => {
      useAuthStore.setState({
        user: {
          id: 'officer1',
          userId: 'officer1',
          username: 'officer1',
          unitType: 'CVHH',
          permissions: ['beacon:approve'],
        } as any,
      });

      const perms = renderKchtHook('beacon', { approvalLevels: 1 });

      expect(perms.approvalLevels).toBe(1);
      expect(perms.canSaveAndApprove).toBe(true);

      // In 1-level mode: Level 2 approval is always disabled
      const l1ApprovedRec = { id: 'b1', approvalStatus: 'APPROVED_LEVEL1' };
      expect(perms.canApproveL2(l1ApprovedRec)).toBe(false);

      // In 1-level mode: Level 1 approval acts as the single approval
      const pendingRec = { id: 'b2', createdBy: 'other', approvalStatus: 'PENDING_APPROVAL' };
      expect(perms.canApproveL1(pendingRec)).toBe(true);
      expect(perms.canReject(pendingRec)).toBe(true);

      // Creator cannot approve own record in 1-level mode
      const ownPendingRec = { id: 'b3', createdBy: 'officer1', approvalStatus: 'PENDING_APPROVAL' };
      expect(perms.canApproveL1(ownPendingRec)).toBe(false);
    });
  });
});
