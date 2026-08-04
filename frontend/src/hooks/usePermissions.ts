import { useQuery } from '@tanstack/react-query';
import { permissionService } from '../services/permissionService';
import type { MenuTreeNode } from '../types/permission';

function flattenKeys(nodes: MenuTreeNode[]): string[] {
  return nodes.flatMap((node) => [node.key, ...flattenKeys(node.children || [])]);
}

/**
 * Cây chức năng AUTH_MENU của project gốc hh.csdl.
 * Các permission API resource:action vẫn được giữ ở endpoint /permissions,
 * nhưng không trộn vào cây chức năng hiển thị cho người quản trị.
 */
export function usePermissions() {
  const menuQuery = useQuery({
    queryKey: ['permission-menu-tree'],
    queryFn: () => permissionService.listMenuTree(),
    staleTime: 5 * 60 * 1000,
  });
  const apiQuery = useQuery({
    queryKey: ['permission-catalog'],
    queryFn: () => permissionService.list(),
    staleTime: 5 * 60 * 1000,
  });

  const tree: MenuTreeNode[] = menuQuery.data || [];
  return {
    tree,
    allKeys: flattenKeys(tree),
    allGroupKeys: [],
    apiPermissions: apiQuery.data || [],
    isLoading: menuQuery.isLoading || apiQuery.isLoading,
    isError: menuQuery.isError || apiQuery.isError,
    error: menuQuery.error || apiQuery.error,
  };
}
