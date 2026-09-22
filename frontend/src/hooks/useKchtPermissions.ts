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

export function isCucLevelUser(currentUser: any): boolean {
  if (!currentUser) return false;
  const orgCode = String(currentUser?.orgUnitCode || '').toUpperCase().trim();
  const orgName = String(currentUser?.orgUnitName || '').toLowerCase().trim();
  const userUnitType = String(currentUser?.unitType || '').toUpperCase().trim();
  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles.map((r: string) => String(r).toUpperCase())
    : [String(currentUser?.role || '').toUpperCase()];

  // 0. Quản trị viên hệ thống (Admin)
  if (roles.includes('ADMIN') || String(currentUser?.username).toLowerCase() === 'admin') {
    return true;
  }

  // 1. Cấp Bộ (G17)
  const isMinistryRoot =
    orgCode === MINISTRY_ROOT_CODE ||
    currentUser?.orgUnitId === MINISTRY_ROOT_ID;

  // 2. Cấp Cục Hàng hải Việt Nam (Mã G17.43)
  const isCucMaritime = orgCode === 'G17.43' || (!orgCode.startsWith('G17.43.') && orgCode === 'G17.43');

  // 3. Tên đơn vị chứa "cục hàng hải"
  const hasCucName = orgName.includes('cục hàng hải');

  // 4. Giữ tương thích ngược với unitType nếu có
  const hasCucUnitType = Boolean(
    userUnitType &&
    ['CHUYEN_VIEN_CUC', 'LANH_DAO_CUC', 'CUC', 'CUC_HANG_HAI'].includes(userUnitType)
  );

  return isMinistryRoot || isCucMaritime || hasCucName || hasCucUnitType;
}

export function checkCanSaveAndApprove(
  resource: string,
  hasPerm: (perm: string) => boolean,
  currentUser: any
): boolean {
  if (!isCucLevelUser(currentUser)) return false;
  return Boolean(hasPerm(`${resource}:approvec2`));
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
  const storeHasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);
  const hasPerm = storeHasPerm || usePermissionStore.getState().hasPermission;

  // FE phải dùng đúng tập quyền hiệu lực mà backend dùng. Role hiển thị
  // "ADMIN" chỉ là metadata tài khoản, không được tự biến thành toàn quyền.
  // Backend chỉ bypass khi có wildcard '*' hoặc 'admin:all'.
  const isAdmin = useMemo(
    () => hasExplicitPerm('*') || hasExplicitPerm('admin:all'),
    [hasExplicitPerm]
  );

  const userUnitType = currentUser?.unitType || '';
  const isCucLevel = useMemo(() => isCucLevelUser(currentUser), [currentUser]);

  const isCangVuLevel = useMemo(() => {
    const orgName = String(currentUser?.orgUnitName || '').toLowerCase().trim();
    const hasCvName = orgName.includes('cảng vụ') || orgName.includes('chi cục');
    return Boolean((userUnitType && ['CVHH', 'CANG_VU'].includes(userUnitType)) || hasCvName);
  }, [userUnitType, currentUser?.orgUnitName]);

  const currentUserId = currentUser?.userId || currentUser?.id || '';

  // Base Capabilities
  const canRead = useMemo(() => {
    return hasPerm(`${resource}:read`);
  }, [hasPerm, resource]);

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
      hasPerm,
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
      return (hasApprovePerm || hasApproveL1Perm) && (!isCreator(record) || isCucLevel);
    }
    return hasApproveL1Perm && (!isCreator(record) || isCucLevel);
  };

  const canApproveL2 = (record?: KchtRecordLike | null): boolean => {
    if (!record || approvalLevels === 1) return false;
    const st = normalizeApprovalStatus(record.approvalStatus);
    const isApprovedL1 = st === 'APPROVED_LEVEL1';
    if (!isApprovedL1) return false;
    return hasApproveL2Perm && (!isApproverL1(record) || isCucLevel) && (!isCreator(record) || isCucLevel);
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
