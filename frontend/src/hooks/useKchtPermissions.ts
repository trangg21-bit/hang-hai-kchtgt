import { useMemo } from 'react';
import { useAuthStore, type AuthState } from '../store/authStore';
import { usePermissionStore, type PermissionState } from '../store/permissionStore';
import {
  MINISTRY_ROOT_CODE,
  MINISTRY_ROOT_ID,
} from '../components/org-unit/useUserDefaultOrgUnit';
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
  creatorId?: string | null;
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
  } = options;

  const authStoreUser = useAuthStore((s: AuthState) => s.user);
  const currentUser = (options.currentUser !== undefined ? options.currentUser : (authStoreUser || useAuthStore.getState().user)) as AuthState['user'];
  const storeHasExplicitPerm = usePermissionStore((s: PermissionState) => s.hasExplicitPermission);
  const hasExplicitPerm = storeHasExplicitPerm || usePermissionStore.getState().hasExplicitPermission;

  // FE phải dùng đúng tập quyền hiệu lực mà backend dùng. Role hiển thị
  // "ADMIN" chỉ là metadata tài khoản, không được tự biến thành toàn quyền.
  // Backend chỉ bypass khi có wildcard '*' hoặc 'admin:all'.
  const isAdmin = useMemo(
    () => hasExplicitPerm('*') || hasExplicitPerm('admin:all'),
    [hasExplicitPerm]
  );

  const userUnitType = currentUser?.unitType || '';
  const isCucLevel = useMemo(() => {
    const hasCucUnitType = Boolean(
      userUnitType &&
      ['CHUYEN_VIEN_CUC', 'LANH_DAO_CUC', 'CUC', 'CUC_HANG_HAI'].includes(userUnitType)
    );
    const isMinistryRoot =
      currentUser?.orgUnitCode === MINISTRY_ROOT_CODE ||
      currentUser?.orgUnitId === MINISTRY_ROOT_ID;
    // Nhóm duyệt trung ương gồm Cục và đơn vị gốc G17 phía trên Cục. Backend
    // cũng coi admin không gán đơn vị là cấp cao nhất; không suy diễn mọi
    // admin:all ở đơn vị cấp dưới thành cấp Cục.
    return hasCucUnitType || isMinistryRoot;
  }, [currentUser?.orgUnitCode, currentUser?.orgUnitId, userUnitType]);

  const isCangVuLevel = useMemo(() => {
    return Boolean(userUnitType && ['CVHH', 'CANG_VU'].includes(userUnitType));
  }, [userUnitType]);

  const currentUserId = currentUser?.userId || currentUser?.id || '';

  // Base Capabilities
  const canRead = useMemo(() => {
    return hasExplicitPerm(`${resource}:read`);
  }, [hasExplicitPerm, resource]);

  const canCreate = useMemo(() => {
    return hasExplicitPerm(`${resource}:create`);
  }, [hasExplicitPerm, resource]);

  const canViewHistory = useMemo(() => {
    return hasExplicitPerm(`${resource}:history`);
  }, [hasExplicitPerm, resource]);

  const hasUpdatePerm = useMemo(() => {
    return hasExplicitPerm(`${resource}:update`);
  }, [hasExplicitPerm, resource]);

  const hasApprovePerm = useMemo(() => {
    return hasExplicitPerm(`${resource}:approve`) ||
      hasExplicitPerm(`${resource}:approvec1`) ||
      hasExplicitPerm(`${resource}:approvec2`);
  }, [hasExplicitPerm, resource]);

  const hasApproveL1Perm = useMemo(() => {
    // C1 là quyền nghiệp vụ tường minh. Không suy diễn từ quyền approve chung,
    // data:approve, admin:all, `*` hoặc quyền thuộc đơn vị cấp Chi cục/Cảng vụ.
    return hasExplicitPerm(`${resource}:approvec1`);
  }, [hasExplicitPerm, resource]);

  const hasApproveL2Perm = useMemo(() => {
    // C2 cũng phải là mã quyền cụ thể của resource. C1, admin:all và `*`
    // không bao hàm C2 ở tầng hiển thị nút.
    return hasExplicitPerm(`${resource}:approvec2`);
  }, [hasExplicitPerm, resource]);

  // Can Save & Approve in Form
  const canSaveAndApprove = useMemo(() => {
    if (approvalLevels === 1) {
      return hasApprovePerm || hasApproveL1Perm;
    }
    // Quyền duyệt là quyền tường minh: kể cả Admin ở đơn vị gốc vẫn phải được
    // cấp đúng C2. Điều này giúp tester kiểm chứng được từng checkbox quyền.
    return isCucLevel && hasApproveL2Perm;
  }, [approvalLevels, hasApproveL1Perm, hasApproveL2Perm, hasApprovePerm, isCucLevel]);

  // Record-specific helpers
  const isCreator = (record?: KchtRecordLike | null): boolean => {
    if (!record || !currentUserId) return false;
    return (
      record.createdBy === currentUserId ||
      record.userId === currentUserId ||
      record.creatorId === currentUserId
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
      hasPerm: hasExplicitPerm,
      resource,
    });
  };

  const canDelete = (record?: KchtRecordLike | null): boolean => {
    if (!record) return false;
    return canDeleteApprovalRecord(record.approvalStatus, {
      hasPerm: hasExplicitPerm,
      resource,
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
      return (hasApprovePerm || hasApproveL1Perm) && !isCreator(record);
    }
    return hasApproveL1Perm && (!isCreator(record) || isCucLevel);
  };

  const canApproveL2 = (record?: KchtRecordLike | null): boolean => {
    if (!record || approvalLevels === 1) return false;
    const st = normalizeApprovalStatus(record.approvalStatus);
    const isApprovedL1 = st === 'APPROVED_LEVEL1';
    if (!isApprovedL1) return false;
    return hasApproveL2Perm && (!isApproverL1(record) || isCucLevel);
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
