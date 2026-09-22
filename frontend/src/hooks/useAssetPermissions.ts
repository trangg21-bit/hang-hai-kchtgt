import { useMemo } from 'react';
import { usePermissionStore } from '../store/permissionStore';

export interface AssetPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canHistory: boolean;
  canExploit: boolean;
  canIncrease: boolean;
  canDecrease: boolean;
  canApproveC1: boolean;
  canApproveC2: boolean;
  canRejectC1: boolean;
  canRejectC2: boolean;
  canReject: boolean;
  userPermissions: string[];
}

export function useAssetPermissions(resource: string | string[]): AssetPermissions {
  const userPermissions = usePermissionStore((s) => s.permissions);
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const hasExplicitPerm = usePermissionStore((s: any) => s.hasExplicitPermission || s.hasPermission);

  const resourceKey = Array.isArray(resource) ? resource.join(',') : resource;

  return useMemo(() => {
    const rawList = Array.isArray(resource) ? resource : [resource];
    const resources = rawList.map((r) => r.toLowerCase().trim()).filter(Boolean);

    const checkAny = (fn: (res: string) => boolean) => resources.some(fn);

    const canManage = checkAny((res) =>
      Boolean(
        hasExplicitPerm?.(`${res}:manage`) ||
        hasExplicitPerm?.(`${res}asset:manage`) ||
        (res === 'infraasset' && hasExplicitPerm?.('infraasset:manage')) ||
        hasExplicitPerm?.('*')
      )
    );

    // canRead for the action "Xem chi tiết" requires explicit read permission
    const canRead = Boolean(
      canManage ||
      checkAny((res) =>
        Boolean(
          hasExplicitPerm?.(`${res}:read`) ||
          hasExplicitPerm?.(`${res}asset:read`) ||
          (res === 'infraasset' && hasExplicitPerm?.('infraasset:read'))
        )
      )
    );

    const canCreate = Boolean(
      canManage ||
      checkAny((res) =>
        Boolean(
          hasExplicitPerm?.(`${res}:create`) ||
          hasExplicitPerm?.(`${res}asset:create`) ||
          (res === 'infraasset' && hasExplicitPerm?.('infraasset:create'))
        )
      )
    );

    const canUpdate = Boolean(
      hasExplicitPerm?.('*') ||
      checkAny((res) =>
        Boolean(
          hasExplicitPerm?.(`${res}:update`) ||
          hasExplicitPerm?.(`${res}asset:update`) ||
          (res === 'infraasset' && hasExplicitPerm?.('infraasset:update'))
        )
      )
    );

    const canDelete = Boolean(
      canManage ||
      checkAny((res) =>
        Boolean(
          hasExplicitPerm?.(`${res}:delete`) ||
          hasExplicitPerm?.(`${res}asset:delete`) ||
          (res === 'infraasset' && hasExplicitPerm?.('infraasset:delete'))
        )
      )
    );

    const canHistory = Boolean(
      hasExplicitPerm?.('*') ||
      checkAny((res) =>
        Boolean(
          hasExplicitPerm?.(`${res}:history`) ||
          hasExplicitPerm?.(`${res}asset:history`)
        )
      )
    );

    const canExploit = Boolean(
      canManage ||
      Boolean(
        hasExplicitPerm?.('assetexploitation:create') ||
        hasExplicitPerm?.('assetexploitation:update') ||
        hasExplicitPerm?.('assetexploitation:manage')
      )
    );

    const canIncrease = Boolean(
      canManage ||
      Boolean(
        hasExplicitPerm?.('assetincrease:create') ||
        hasExplicitPerm?.('assetincrease:update') ||
        hasExplicitPerm?.('assetincrease:manage')
      )
    );

    const canDecrease = Boolean(
      canManage ||
      Boolean(
        hasExplicitPerm?.('assetdecrease:create') ||
        hasExplicitPerm?.('assetdecrease:update') ||
        hasExplicitPerm?.('assetdecrease:manage')
      )
    );

    const canApproveC1 = checkAny((res) => {
      const baseRes = res.replace(/asset$/, '');
      return Boolean(
        canManage ||
        hasExplicitPerm?.(`${res}:approvec1`) ||
        hasExplicitPerm?.(`${baseRes}:approvec1`) ||
        hasExplicitPerm?.(`${baseRes}asset:approvec1`) ||
        hasExplicitPerm?.(`${res}:approve:c1`) ||
        hasExplicitPerm?.('infraasset:approve')
      );
    });

    const canApproveC2 = checkAny((res) => {
      const baseRes = res.replace(/asset$/, '');
      return Boolean(
        canManage ||
        hasExplicitPerm?.(`${res}:approvec2`) ||
        hasExplicitPerm?.(`${baseRes}:approvec2`) ||
        hasExplicitPerm?.(`${baseRes}asset:approvec2`) ||
        hasExplicitPerm?.(`${res}:approve:c2`) ||
        hasExplicitPerm?.('infraasset:approve')
      );
    });

    const canRejectC1 = checkAny((res) => {
      const baseRes = res.replace(/asset$/, '');
      return Boolean(
        canManage ||
        hasExplicitPerm?.(`${res}:rejectc1`) ||
        hasExplicitPerm?.(`${baseRes}:rejectc1`) ||
        hasExplicitPerm?.(`${baseRes}asset:rejectc1`) ||
        hasExplicitPerm?.(`${res}:reject:c1`) ||
        hasExplicitPerm?.(`${baseRes}:reject:c1`) ||
        hasExplicitPerm?.(`${res}:reject`) ||
        hasExplicitPerm?.(`${baseRes}:reject`) ||
        hasExplicitPerm?.('infraasset:reject')
      );
    });

    const canRejectC2 = checkAny((res) => {
      const baseRes = res.replace(/asset$/, '');
      return Boolean(
        canManage ||
        hasExplicitPerm?.(`${res}:rejectc2`) ||
        hasExplicitPerm?.(`${baseRes}:rejectc2`) ||
        hasExplicitPerm?.(`${baseRes}asset:rejectc2`) ||
        hasExplicitPerm?.(`${res}:reject:c2`) ||
        hasExplicitPerm?.(`${baseRes}:reject:c2`) ||
        hasExplicitPerm?.(`${res}:reject`) ||
        hasExplicitPerm?.(`${baseRes}:reject`) ||
        hasExplicitPerm?.('infraasset:reject')
      );
    });

    const canReject = Boolean(
      canManage ||
      canRejectC1 ||
      canRejectC2
    );

    return {
      canCreate,
      canRead,
      canUpdate,
      canDelete,
      canHistory,
      canExploit,
      canIncrease,
      canDecrease,
      canApproveC1,
      canApproveC2,
      canRejectC1,
      canRejectC2,
      canReject,
      userPermissions: userPermissions || [],
    };
  }, [resourceKey, hasPerm, userPermissions]);
}
