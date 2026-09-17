import { useMemo } from 'react';
import { useAuthStore, type AuthState } from '../store/authStore';
import { usePermissionStore, type PermissionState } from '../store/permissionStore';
import {
  canEditApprovalRecord,
  canDeleteApprovalRecord,
  normalizeApprovalStatus,
} from '../utils/approvalEditPolicy';

export interface UseKchtPermissionsOptions {
  approvalLevels?: 1 | 2;
  currentUser?: unknown | null;
  extraReadPerms?: string[];
  extraCreatePerms?: string[];
  extraUpdatePerms?: string[];
  extraDeletePerms?: string[];
  extraApprovePerms?: string[];
  extraApproveL1Perms?: string[];
  extraApproveL2Perms?: string[];
  extraHistoryPerms?: string[];
}

export interface KchtRecordLike {
  id?: string;
  approvalStatus?: string | null;
  createdBy?: string | null;
  userId?: string | null;
  approverLevel1?: string | null;
  approverLevel1Name?: string | null;
  [key: string]: unknown;
}

export function useKchtPermissions(
  resource: string,
  options: UseKchtPermissionsOptions = {}
) {
  const {
    approvalLevels = 2,
    extraReadPerms = [],
    extraCreatePerms = [],
    extraUpdatePerms = [],
    extraDeletePerms = [],
    extraApprovePerms = [],
    extraApproveL1Perms = [],
    extraApproveL2Perms = [],
    extraHistoryPerms = [],
  } = options;

  const authStoreUser = useAuthStore((s: AuthState) => s.user);
  const currentUser = (options.currentUser !== undefined ? options.currentUser : (authStoreUser || useAuthStore.getState().user)) as AuthState['user'];
  const storeHasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);
  const hasPerm = storeHasPerm || usePermissionStore.getState().hasPermission;

  const isAdmin = useMemo(() => {
    return Boolean(
      (currentUser as any)?.role === 'SUPER_ADMIN' ||
      (currentUser as any)?.role === 'ADMIN' ||
      (currentUser as any)?.roleName === 'SUPER_ADMIN' ||
      (currentUser as any)?.roleName === 'ADMIN' ||
      (currentUser as any)?.roles?.includes('ADMIN') ||
      (currentUser as any)?.roles?.includes('SUPER_ADMIN')
    );
  }, [currentUser]);

  const userUnitType = currentUser?.unitType || '';
  const isCucLevel = useMemo(() => {
    return (
      Boolean(
        userUnitType &&
        ['CHUYEN_VIEN_CUC', 'LANH_DAO_CUC', 'CUC', 'CUC_HANG_HAI'].includes(userUnitType)
      ) || isAdmin
    );
  }, [userUnitType, isAdmin]);

  const isCangVuLevel = useMemo(() => {
    return Boolean(userUnitType && ['CVHH', 'CANG_VU'].includes(userUnitType));
  }, [userUnitType]);

  const currentUserId = currentUser?.userId || currentUser?.id || '';

  // Base Capabilities
  const canRead = useMemo(() => {
    if (isAdmin) return true;
    if (hasPerm(`${resource}:read`) || hasPerm('data:read')) return true;
    return extraReadPerms.some((p) => hasPerm(p));
  }, [isAdmin, hasPerm, resource, extraReadPerms]);

  const canCreate = useMemo(() => {
    if (isAdmin) return true;
    if (hasPerm(`${resource}:create`) || hasPerm('data:create')) return true;
    return extraCreatePerms.some((p) => hasPerm(p));
  }, [isAdmin, hasPerm, resource, extraCreatePerms]);

  const canViewHistory = useMemo(() => {
    if (isAdmin) return true;
    if (hasPerm(`${resource}:history`) || hasPerm('data:read')) return true;
    return extraHistoryPerms.some((p) => hasPerm(p));
  }, [isAdmin, hasPerm, resource, extraHistoryPerms]);

  const hasUpdatePerm = useMemo(() => {
    if (isAdmin) return true;
    if (hasPerm(`${resource}:update`) || hasPerm('data:update')) return true;
    return extraUpdatePerms.some((p) => hasPerm(p));
  }, [isAdmin, hasPerm, resource, extraUpdatePerms]);

  const hasApprovePerm = useMemo(() => {
    if (isAdmin) return true;
    if (
      hasPerm(`${resource}:approve`) ||
      hasPerm(`${resource}:approvec1`) ||
      hasPerm(`${resource}:approvec2`) ||
      hasPerm('data:approve') ||
      hasPerm('data:approvec1') ||
      hasPerm('data:approvec2')
    ) return true;
    return extraApprovePerms.some((p) => hasPerm(p));
  }, [isAdmin, hasPerm, resource, extraApprovePerms]);

  const hasApproveL1Perm = useMemo(() => {
    if (isAdmin) return true;
    if (
      hasPerm(`${resource}:approve`) ||
      hasPerm(`${resource}:approvec1`) ||
      hasPerm('data:approve') ||
      hasPerm('data:approvec1') ||
      extraApproveL1Perms.some((p) => hasPerm(p))
    ) {
      return true;
    }
    return false;
  }, [isAdmin, hasPerm, resource, extraApproveL1Perms]);

  const hasApproveL2Perm = useMemo(() => {
    if (isAdmin) return true;
    if (
      hasPerm(`${resource}:approvec2`) ||
      hasPerm('data:approvec2') ||
      extraApproveL2Perms.some((p) => hasPerm(p))
    ) {
      return true;
    }
    return false;
  }, [isAdmin, hasPerm, resource, extraApproveL2Perms]);

  // Can Save & Approve in Form
  const canSaveAndApprove = useMemo(() => {
    if (approvalLevels === 1) {
      return hasApprovePerm || hasApproveL1Perm || isAdmin;
    }
    return hasApproveL2Perm || hasApprovePerm || isAdmin;
  }, [approvalLevels, hasApprovePerm, hasApproveL1Perm, hasApproveL2Perm, isAdmin]);

  // Record-specific helpers
  const isCreator = (record?: KchtRecordLike | null): boolean => {
    if (!record || !currentUserId) return false;
    return (
      record.createdBy === currentUserId ||
      record.userId === currentUserId ||
      (record as any).creatorId === currentUserId
    );
  };

  const isApproverL1 = (record?: KchtRecordLike | null): boolean => {
    if (!record || !currentUserId) return false;
    return (
      record.approverLevel1 === currentUserId ||
      (Boolean(currentUser?.fullName) && record.approverLevel1Name === currentUser?.fullName) ||
      (Boolean(currentUser?.username) && record.approverLevel1 === currentUser?.username)
    );
  };

  const canEdit = (record?: KchtRecordLike | null): boolean => {
    if (!record) return canCreate;
    return canEditApprovalRecord(record.approvalStatus, {
      hasPerm,
      resource,
      extraUpdatePerms,
      extraApprovePerms: approvalLevels === 1 ? extraApprovePerms : [...extraApprovePerms, ...extraApproveL2Perms],
    });
  };

  const canDelete = (record?: KchtRecordLike | null): boolean => {
    if (!record) return false;
    if (isAdmin) {
      return normalizeApprovalStatus(record.approvalStatus) === 'DRAFT';
    }
    return canDeleteApprovalRecord(record.approvalStatus, {
      hasPerm,
      resource,
      extraDeletePerms,
    });
  };

  const canSubmit = (record?: KchtRecordLike | null): boolean => {
    if (!record || !hasUpdatePerm) return false;
    const st = normalizeApprovalStatus(record.approvalStatus);
    return (
      st === 'DRAFT' ||
      st === 'REJECTED_LEVEL1' ||
      st === 'REJECTED_LEVEL2' ||
      st === 'REJECTED'
    );
  };

  const canApproveL1 = (record?: KchtRecordLike | null): boolean => {
    if (!record) return false;
    const st = normalizeApprovalStatus(record.approvalStatus);
    const isPending = st === 'PENDING_APPROVAL';
    if (!isPending) return false;
    if (approvalLevels === 1) {
      return (hasApprovePerm || hasApproveL1Perm || isAdmin) && (!isCreator(record) || isAdmin);
    }
    return hasApproveL1Perm && (!isCreator(record) || isCucLevel || isAdmin);
  };

  const canApproveL2 = (record?: KchtRecordLike | null): boolean => {
    if (!record || approvalLevels === 1) return false;
    const st = normalizeApprovalStatus(record.approvalStatus);
    const isApprovedL1 = st === 'APPROVED_LEVEL1';
    if (!isApprovedL1) return false;
    return hasApproveL2Perm && (!isApproverL1(record) || isCucLevel || isAdmin);
  };

  const canReject = (record?: KchtRecordLike | null): boolean => {
    if (!record) return false;
    if (approvalLevels === 1) {
      return canApproveL1(record);
    }
    return canApproveL1(record) || canApproveL2(record);
  };

  return {
    currentUser,
    currentUserId,
    isAdmin,
    isCucLevel,
    isCangVuLevel,
    approvalLevels,

    // General permissions
    canRead,
    canCreate,
    canViewHistory,
    canSaveAndApprove,
    hasUpdatePerm,
    hasApprovePerm,
    hasApproveL1Perm,
    hasApproveL2Perm,

    // Record-based predicates
    isCreator,
    isApproverL1,
    canEdit,
    canDelete,
    canSubmit,
    canApproveL1,
    canApproveL2,
    canReject,
  };
}
