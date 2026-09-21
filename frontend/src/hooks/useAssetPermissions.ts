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
      canManage ||
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
      canManage ||
      canRead ||
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

    const canApproveC1 = checkAny((res) =>
      Boolean(
        canManage ||
        hasExplicitPerm?.(`${res}:approvec1`) ||
        hasExplicitPerm?.(`${res}:approve:c1`) ||
        hasExplicitPerm?.('infraasset:approve')
      )
    );

    const canApproveC2 = checkAny((res) =>
      Boolean(
        canManage ||
        hasExplicitPerm?.(`${res}:approvec2`) ||
        hasExplicitPerm?.(`${res}:approve:c2`) ||
        hasExplicitPerm?.('infraasset:approve')
      )
    );

    const canReject = Boolean(
      canManage ||
      canApproveC1 ||
      canApproveC2 ||
      checkAny((res) =>
        Boolean(
          hasExplicitPerm?.(`${res}:reject`) ||
          hasExplicitPerm?.(`${res}asset:reject`)
        )
      )
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
      canReject,
      userPermissions: userPermissions || [],
    };
  }, [resourceKey, hasPerm, userPermissions]);
}
