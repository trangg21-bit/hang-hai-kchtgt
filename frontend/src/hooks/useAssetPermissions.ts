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
  const hasExplicitPerm = usePermissionStore((s: any) => s.hasExplicitPermission || s.hasPermission);

  const resourceKey = Array.isArray(resource) ? resource.join(',') : resource;

  return useMemo(() => {
    const rawList = Array.isArray(resource) ? resource : [resource];
    const resources = rawList.map((r) => r.toLowerCase().trim()).filter(Boolean);

    const canAction = (action: string) =>
      resources.some((res) => Boolean(hasExplicitPerm?.(`${res}:${action}`)));

    // canRead for the action "Xem chi tiết" requires explicit read permission
    const canRead = Boolean(
      canAction('read')
    );

    const canCreate = Boolean(
      canAction('create')
    );

    const canUpdate = Boolean(
      canAction('update')
    );

    const canDelete = Boolean(
      canAction('delete')
    );

    const canHistory = Boolean(
      canAction('history')
    );

    const canExploit = Boolean(
      Boolean(
        hasExplicitPerm?.('assetexploitation:create') ||
        hasExplicitPerm?.('assetexploitation:update')
      )
    );

    const canIncrease = Boolean(
      Boolean(
        hasExplicitPerm?.('assetincrease:create') ||
        hasExplicitPerm?.('assetincrease:update')
      )
    );

    const canDecrease = Boolean(
      Boolean(
        hasExplicitPerm?.('assetdecrease:create') ||
        hasExplicitPerm?.('assetdecrease:update')
      )
    );

    const canApproveC1 = canAction('approvec1');

    const canApproveC2 = canAction('approvec2');

    const canReject = Boolean(
      canApproveC1 ||
      canApproveC2 ||
      canAction('reject')
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
  }, [resourceKey, hasExplicitPerm, userPermissions]);
}
