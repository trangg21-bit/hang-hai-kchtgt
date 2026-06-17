import { ALL_PERMISSIONS } from '../services/mockData';
import type { PermissionGroup, PermissionTreeNode } from '../types/permission';

const GROUP_LABELS: Record<string, string> = {
  user_management: 'Quản lý người dùng',
  role_management: 'Quản lý vai trò & phân quyền',
  system: 'Hệ thống',
};

export function usePermissions() {
  const groups: PermissionGroup[] = Object.entries(
    ALL_PERMISSIONS.reduce<Record<string, typeof ALL_PERMISSIONS>>((acc, perm) => {
      if (!acc[perm.group]) acc[perm.group] = [];
      acc[perm.group].push(perm);
      return acc;
    }, {}),
  ).map(([group, perms]) => ({
    group,
    label: GROUP_LABELS[group] || group,
    permissions: perms,
  }));

  const tree: PermissionTreeNode[] = groups.map((g) => ({
    key: g.group,
    title: g.label,
    children: g.permissions.map((p) => ({
      key: p.key,
      title: p.name,
    })),
  }));

  const allKeys = ALL_PERMISSIONS.map((p) => p.key);
  const allGroupKeys = groups.map((g) => g.group);

  return { groups, tree, allKeys, allGroupKeys };
}
