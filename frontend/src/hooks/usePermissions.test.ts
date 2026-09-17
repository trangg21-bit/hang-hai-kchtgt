import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  usePermissions,
  getVisiblePermissionKeys,
  mergePermissionKeys,
} from './usePermissions';
import { permissionService } from '../services/permissionService';
import type { MenuTreeNode } from '../types/permission';

vi.mock('../services/permissionService', () => ({
  permissionService: {
    list: vi.fn(),
  },
}));

describe('usePermissions Hook & Utilities (Phương án 1 - Gộp chuẩn hóa cây phân quyền)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const sampleTree: MenuTreeNode[] = [
    {
      key: 'group_dryport',
      code: 'group_dryport',
      title: 'Quản lý Cảng cạn',
      children: [
        { key: 'dryport:read', code: 'dryport:read', title: 'Xem cảng cạn (dryport:read)', children: [] },
        { key: 'dryport:create', code: 'dryport:create', title: 'Thêm cảng cạn (dryport:create)', children: [] },
      ],
    },
    {
      key: 'group_user',
      code: 'group_user',
      title: 'Quản lý tài khoản người dùng',
      children: [
        { key: 'user:read', code: 'user:read', title: 'Xem người dùng (user:read)', children: [] },
      ],
    },
  ];

  describe('getVisiblePermissionKeys', () => {
    it('should mark canonical node checked if user has equivalent alias key (dryportasset:read)', () => {
      const userPermissions = ['dryportasset:read'];
      const visible = getVisiblePermissionKeys(userPermissions, sampleTree);
      expect(visible).toContain('dryport:read');
      expect(visible).not.toContain('dryport:create');
      expect(visible).not.toContain('user:read');
    });

    it('should mark canonical node checked if user has direct canonical key (dryport:read)', () => {
      const userPermissions = ['dryport:read'];
      const visible = getVisiblePermissionKeys(userPermissions, sampleTree);
      expect(visible).toContain('dryport:read');
    });

    it('should return empty if user has no matching permissions in tree', () => {
      const userPermissions = ['other:perm'];
      const visible = getVisiblePermissionKeys(userPermissions, sampleTree);
      expect(visible).toEqual([]);
    });
  });

  describe('mergePermissionKeys', () => {
    it('should expand both canonical and alias keys when a node is checked', () => {
      const currentKeys = ['user:read'];
      const nextVisibleKeys = ['user:read', 'dryport:read'];
      const merged = mergePermissionKeys(currentKeys, nextVisibleKeys, sampleTree);

      expect(merged).toContain('dryport:read');
      expect(merged).toContain('dryportasset:read');
      expect(merged).toContain('user:read');
    });

    it('should remove both canonical and alias keys when a node is unchecked', () => {
      const currentKeys = ['dryport:read', 'dryportasset:read', 'user:read', 'system:out_of_scope'];
      const nextVisibleKeys = ['user:read'];
      const merged = mergePermissionKeys(currentKeys, nextVisibleKeys, sampleTree);

      expect(merged).not.toContain('dryport:read');
      expect(merged).not.toContain('dryportasset:read');
      expect(merged).toContain('user:read');
      expect(merged).toContain('system:out_of_scope');
    });
  });

  describe('usePermissions dynamic tree building', () => {
    it('should consolidate duplicate asset groups and deduplicate actions into a single group', async () => {
      const mockPerms = [
        // Canonical dryport
        { id: '1', key: 'dryport:read', name: 'Xem cảng cạn', resource: 'dryport', action: 'read' },
        { id: '2', key: 'dryport:create', name: 'Thêm cảng cạn', resource: 'dryport', action: 'create' },
        // Alias dryportasset
        { id: '3', key: 'dryportasset:read', name: 'Xem Tài sản cảng cạn', resource: 'dryportasset', action: 'read' },
        { id: '4', key: 'dryportasset:create', name: 'Thêm Tài sản cảng cạn', resource: 'dryportasset', action: 'create' },
        { id: '5', key: 'dryportasset:manage', name: 'Quản lý Tài sản cảng cạn', resource: 'dryportasset', action: 'manage' },
        // Berth and Berthasset
        { id: '6', key: 'berth:read', name: 'Xem bến cảng', resource: 'berth', action: 'read' },
        { id: '7', key: 'berthasset:read', name: 'Xem Tài sản bến cảng', resource: 'berthasset', action: 'read' },
        // VHF
        { id: '8', key: 'vhf:read', name: 'Xem VHF', resource: 'vhf', action: 'read' },
        { id: '9', key: 'vhfasset:read', name: 'Xem Tài sản VHF', resource: 'vhfasset', action: 'read' },
      ];

      (permissionService.list as any).mockResolvedValue(mockPerms);
      queryClient.setQueryData(['permission-catalog'], mockPerms);

      let hookResult: ReturnType<typeof usePermissions> | undefined;
      function TestComponent() {
        hookResult = usePermissions();
        return null;
      }

      renderToStaticMarkup(
        React.createElement(QueryClientProvider, { client: queryClient }, React.createElement(TestComponent))
      );

      expect(hookResult).toBeDefined();
      const tree = hookResult!.tree;

      // Check group consolidation: NO separate group_dryportasset or group_berthasset
      const groupKeys = tree.map((g) => g.key);
      expect(groupKeys).toContain('group_dryport');
      expect(groupKeys).not.toContain('group_dryportasset');
      expect(groupKeys).toContain('group_berth');
      expect(groupKeys).not.toContain('group_berthasset');
      expect(groupKeys).toContain('group_vhf');

      // Check dryport group title & children
      const dryportGroup = tree.find((g) => g.key === 'group_dryport');
      expect(dryportGroup).toBeDefined();
      expect(dryportGroup?.title).toBe('Quản lý Cảng cạn');

      // Inside dryportGroup, actions must be deduplicated (read, create, manage)
      const dryportActions = dryportGroup?.children?.map((c) => c.key);
      expect(dryportActions).toEqual(['dryport:read', 'dryport:create', 'dryport:manage']);

      // Check berth group
      const berthGroup = tree.find((g) => g.key === 'group_berth');
      expect(berthGroup?.children?.map((c) => c.key)).toEqual(['berth:read']);

      // Check VHF group
      const vhfGroup = tree.find((g) => g.key === 'group_vhf');
      expect(vhfGroup?.children?.map((c) => c.key)).toEqual(['vhf:read']);

      // Check allKeys contains both canonical and equivalent keys
      expect(hookResult!.allKeys).toContain('dryport:read');
      expect(hookResult!.allKeys).toContain('dryportasset:read');
      expect(hookResult!.allKeys).toContain('berth:read');
      expect(hookResult!.allKeys).toContain('berthasset:read');
    });
  });
});
