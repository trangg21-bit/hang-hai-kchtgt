import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { permissionService } from '../services/permissionService';
import { usePermissionStore } from '../store/permissionStore';
import type { MenuTreeNode } from '../types/permission';
import { useAssetPermissions } from './useAssetPermissions';
import {
  getNodeLeafKeys,
  getVisiblePermissionKeys,
  handleTreeCheck,
  mergePermissionKeys,
  setActiveCatalogKeys,
  usePermissions,
} from './usePermissions';

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
      key: 'group_vts',
      code: 'group_vts',
      title: 'Quản lý Hệ thống VTS',
      children: [
        { key: 'vts:read', code: 'vts:read', title: 'Xem hệ thống VTS (vts:read)', children: [] },
        { key: 'vts:create', code: 'vts:create', title: 'Thêm hệ thống VTS (vts:create)', children: [] },
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
    it('should mark canonical node checked if user has equivalent alias key (vtssystem:read)', () => {
      const userPermissions = ['vtssystem:read'];
      const visible = getVisiblePermissionKeys(userPermissions, sampleTree);
      expect(visible).toContain('vts:read');
      expect(visible).not.toContain('vts:create');
      expect(visible).not.toContain('user:read');
    });

    it('should mark canonical node checked if user has direct canonical key (vts:read)', () => {
      const userPermissions = ['vts:read'];
      const visible = getVisiblePermissionKeys(userPermissions, sampleTree);
      expect(visible).toContain('vts:read');
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
      const nextVisibleKeys = ['user:read', 'vts:read'];
      const merged = mergePermissionKeys(currentKeys, nextVisibleKeys, sampleTree);

      expect(merged).toContain('vts:read');
      expect(merged).toContain('vtssystem:read');
      expect(merged).toContain('user:read');
    });

    it('should remove both canonical and alias keys when a node is unchecked', () => {
      const currentKeys = ['vts:read', 'vtssystem:read', 'user:read', 'system:out_of_scope'];
      const nextVisibleKeys = ['user:read'];
      const merged = mergePermissionKeys(currentKeys, nextVisibleKeys, sampleTree);

      expect(merged).not.toContain('vts:read');
      expect(merged).not.toContain('vtssystem:read');
      expect(merged).toContain('user:read');
      expect(merged).toContain('system:out_of_scope');
    });

    it('should NOT expand alias keys that do not exist in catalog (e.g. transmission:approvec1 and transmission:read)', () => {
      const transmissionTree: MenuTreeNode[] = [
        {
          key: 'group_transmission',
          code: 'group_transmission',
          title: 'Quản lý Hệ thống truyền dẫn',
          children: [
            { key: 'transmission:read', code: 'transmission:read', title: 'Xem hệ thống truyền dẫn (transmission:read)', children: [] },
            { key: 'transmission:approvec1', code: 'transmission:approvec1', title: 'Phê duyệt C1 hệ thống truyền dẫn (transmission:approvec1)', children: [] },
          ],
        },
      ];
      const validCatalog = new Set(['transmission:read', 'transmission:approvec1']);
      const currentKeys: string[] = [];
      const nextVisibleKeys = ['transmission:read', 'transmission:approvec1'];
      const merged = mergePermissionKeys(currentKeys, nextVisibleKeys, transmissionTree, validCatalog);

      expect(merged).toContain('transmission:read');
      expect(merged).toContain('transmission:approvec1');
      expect(merged).not.toContain('transmissionasset:read');
      expect(merged).not.toContain('transmissionasset:approvec1');
    });

    it('should filter against activeCatalogKeys automatically when catalog is active', () => {
      setActiveCatalogKeys(['transmission:read', 'transmission:approvec2']);
      const transmissionTree: MenuTreeNode[] = [
        {
          key: 'group_transmission',
          code: 'group_transmission',
          title: 'Quản lý Hệ thống truyền dẫn',
          children: [
            { key: 'transmission:read', code: 'transmission:read', title: 'Xem hệ thống truyền dẫn', children: [] },
            { key: 'transmission:approvec2', code: 'transmission:approvec2', title: 'Phê duyệt C2 hệ thống truyền dẫn', children: [] },
          ],
        },
      ];
      const merged = mergePermissionKeys([], ['transmission:read', 'transmission:approvec2'], transmissionTree);
      expect(merged).toContain('transmission:read');
      expect(merged).toContain('transmission:approvec2');
      expect(merged).not.toContain('transmissionasset:read');
      expect(merged).not.toContain('transmissionasset:approvec2');
      setActiveCatalogKeys(null);
    });

    it('should only expand aliases that exist in allowedKeys (explicit filter)', () => {
      const currentKeys: string[] = [];
      const nextVisibleKeys = ['vts:read'];
      // allowedKeys only contains vts:read, not vtssystem:read
      const allowedKeys = new Set(['vts:read', 'user:read']);
      const merged = mergePermissionKeys(currentKeys, nextVisibleKeys, sampleTree, allowedKeys);

      expect(merged).toContain('vts:read');
      expect(merged).not.toContain('vtssystem:read');
    });
    it('should cleanly uncheck a leaf node and its equivalents using handleTreeCheck', () => {
      const currentKeys = ['vts:read', 'vtssystem:read', 'user:read'];
      const nextChecked = ['user:read'];
      const uncheckInfo = {
        checked: false,
        node: { key: 'vtssystem:read', children: [] },
      };

      const result = handleTreeCheck(nextChecked, uncheckInfo, currentKeys, sampleTree);
      expect(result).not.toContain('vtssystem:read');
      expect(result).not.toContain('vts:read');
      expect(result).toContain('user:read');
    });

    it('should cleanly uncheck a module group node and all its children/equivalents using handleTreeCheck', () => {
      const currentKeys = ['vts:read', 'vtssystem:read', 'vts:create', 'vtssystem:create', 'user:read'];
      const nextChecked = ['user:read'];
      const uncheckInfo = {
        checked: false,
        node: sampleTree[0], // group_vts
      };

      const result = handleTreeCheck(nextChecked, uncheckInfo, currentKeys, sampleTree);
      expect(result).not.toContain('vts:read');
      expect(result).not.toContain('vtssystem:read');
      expect(result).not.toContain('vts:create');
      expect(result).toContain('user:read');
    });

    it('should extract leaf keys from a node tree using getNodeLeafKeys', () => {
      const leaves = getNodeLeafKeys(sampleTree[0]);
      expect(leaves).toEqual(['vts:read', 'vts:create']);
    });
  });

  describe('usePermissions dynamic tree building', () => {
    const findModule = (tree: MenuTreeNode[], key: string): MenuTreeNode | undefined => {
      for (const domain of tree) {
        if (domain.key === key) return domain;
        const found = domain.children?.find((m) => m.key === key);
        if (found) return found;
      }
      return undefined;
    };

    const getAllModuleKeys = (tree: MenuTreeNode[]): string[] => {
      return tree.flatMap((domain) => (domain.children || []).map((m) => String(m.key)));
    };

    it('should organize permissions into 3-level tree with separate KCHT and Asset domains', async () => {
      const mockPerms = [
        // Canonical dryport
        { id: '1', key: 'dryport:read', name: 'Xem cảng cạn', resource: 'dryport', action: 'read' },
        { id: '2', key: 'dryport:create', name: 'Thêm cảng cạn', resource: 'dryport', action: 'create' },
        // Asset dryportasset
        { id: '3', key: 'dryportasset:read', name: 'Xem Tài sản cảng cạn', resource: 'dryportasset', action: 'read' },
        { id: '4', key: 'dryportasset:create', name: 'Thêm Tài sản cảng cạn', resource: 'dryportasset', action: 'create' },
        { id: '5', key: 'dryportasset:manage', name: 'Quản lý Tài sản cảng cạn', resource: 'dryportasset', action: 'manage' },
        // Berth and Berthasset
        { id: '6', key: 'berth:read', name: 'Xem bến cảng', resource: 'berth', action: 'read' },
        { id: '7', key: 'berthasset:read', name: 'Xem Tài sản bến cảng', resource: 'berthasset', action: 'read' },
        // VHF
        { id: '8', key: 'vhf:read', name: 'Xem hệ thống thông tin liên lạc VHF', resource: 'vhf', action: 'read' },
        { id: '9', key: 'vhfasset:read', name: 'Xem Tài sản HTTT liên lạc VHF', resource: 'vhfasset', action: 'read' },
        { id: '10', key: 'vhf:create', name: 'Thêm hệ thống thông tin liên lạc VHF', resource: 'vhf', action: 'create' },
        { id: '11', key: 'vhf:approvec1', name: 'Phê duyệt C1 hệ thống thông tin liên lạc VHF', resource: 'vhf', action: 'approvec1' },
        { id: '12', key: 'vhf:approvec2', name: 'Phê duyệt C2 hệ thống thông tin liên lạc VHF', resource: 'vhf', action: 'approvec2' },
        { id: '13', key: 'vhf:history', name: 'Lịch sử phê duyệt VHF', resource: 'vhf', action: 'history' },
        // Asset parent
        { id: '14', key: 'asset:read', name: 'Xem Quản lý tài sản', resource: 'asset', action: 'read' },
        { id: '15', key: 'asset:create', name: 'Thêm Quản lý tài sản', resource: 'asset', action: 'create' },
      ];

      vi.mocked(permissionService.list).mockResolvedValue(mockPerms as unknown as Awaited<ReturnType<typeof permissionService.list>>);
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

      // 1. Level 1 domains: domain_kcht and domain_asset
      const domainKeys = tree.map((g) => g.key);
      expect(domainKeys).toContain('domain_kcht');
      expect(domainKeys).toContain('domain_asset');

      const assetDomain = tree.find((d) => d.key === 'domain_asset');
      expect(assetDomain?.title).toBe('Quản lý tài sản KCHT hàng hải');

      // 2. Level 2 modules: KCHT and Asset modules exist in their respective domains
      const groupKeys = getAllModuleKeys(tree);
      // 'Quản lý tài sản' (asset) và 'Quản lý tài sản kết cấu hạ tầng' (infraasset) bị loại bỏ khỏi cây phân quyền
      expect(groupKeys).not.toContain('group_asset');
      expect(groupKeys).not.toContain('group_infraasset');
      expect(groupKeys).toContain('group_dryport');
      expect(groupKeys).toContain('group_dryportasset');
      expect(groupKeys).toContain('group_berth');
      expect(groupKeys).toContain('group_berthasset');
      expect(groupKeys).toContain('group_vhf');
      expect(groupKeys).toContain('group_vhfasset');

      // 3. Check dryport group title & children under group_kcht
      const dryportGroup = findModule(tree, 'group_dryport');
      expect(dryportGroup).toBeDefined();
      expect(dryportGroup?.title).toBe('Quản lý Cảng cạn');
      expect(dryportGroup?.children?.map((c) => c.key)).toEqual(['dryport:read', 'dryport:create']);

      // 4. Check dryportasset group title & children under group_asset
      const dryportAssetGroup = findModule(tree, 'group_dryportasset');
      expect(dryportAssetGroup).toBeDefined();
      expect(dryportAssetGroup?.title).toBe('Tài sản cảng cạn');
      // dryportasset:manage is hidden by KCHT_RESOURCES_WITHOUT_MANAGE
      expect(dryportAssetGroup?.children?.map((c) => c.key)).toEqual([
        'dryportasset:read',
        'dryportasset:create',
      ]);

      // 5. Check berth group
      const berthGroup = findModule(tree, 'group_berth');
      expect(berthGroup?.children?.map((c) => c.key)).toEqual(['berth:read']);

      // 6. Check VHF group: must contain approvec1, approvec2, history
      const vhfGroup = findModule(tree, 'group_vhf');
      expect(vhfGroup?.children?.map((c) => c.key)).toEqual([
        'vhf:read',
        'vhf:create',
        'vhf:approvec1',
        'vhf:approvec2',
        'vhf:history',
      ]);

      // 7. Check allKeys contains both canonical and equivalent keys
      expect(hookResult!.allKeys).toContain('dryport:read');
      expect(hookResult!.allKeys).toContain('dryportasset:read');
      expect(hookResult!.allKeys).toContain('berth:read');
      expect(hookResult!.allKeys).toContain('berthasset:read');
    });

    it('should completely exclude anchorage:approve, anchorageasset:approve and all anchoragearea:* permissions from tree', async () => {
      const mockPerms = [
        // Valid anchorage permissions
        { id: '1', key: 'anchorage:manage', name: 'Khu neo đậu', resource: 'anchorage', action: 'manage' },
        { id: '2', key: 'anchorage:read', name: 'Xem khu neo đậu', resource: 'anchorage', action: 'read' },
        { id: '3', key: 'anchorage:create', name: 'Thêm khu neo đậu', resource: 'anchorage', action: 'create' },
        { id: '4', key: 'anchorage:update', name: 'Cập nhật khu neo đậu', resource: 'anchorage', action: 'update' },
        { id: '5', key: 'anchorage:delete', name: 'Xóa khu neo đậu', resource: 'anchorage', action: 'delete' },
        { id: '6', key: 'anchorage:approvec1', name: 'Phê duyệt C1 khu neo đậu', resource: 'anchorage', action: 'approvec1' },
        { id: '7', key: 'anchorage:approvec2', name: 'Phê duyệt C2 khu neo đậu', resource: 'anchorage', action: 'approvec2' },
        { id: '8', key: 'anchorage:history', name: 'Lịch sử phê duyệt khu neo đậu', resource: 'anchorage', action: 'history' },
        // Legacy deprecated single-level approval (must be hidden)
        { id: '9', key: 'anchorage:approve', name: 'Phê duyệt khu neo đậu', resource: 'anchorage', action: 'approve' },
        { id: '10', key: 'anchorageasset:approve', name: 'Phê duyệt tài sản khu neo đậu', resource: 'anchorageasset', action: 'approve' },
        // Legacy duplicate anchoragearea:* permissions (all must be hidden)
        { id: '11', key: 'anchoragearea:read', name: 'Xem khu neo đậu', resource: 'anchoragearea', action: 'read' },
        { id: '12', key: 'anchoragearea:create', name: 'Thêm khu neo đậu', resource: 'anchoragearea', action: 'create' },
        { id: '13', key: 'anchoragearea:update', name: 'Cập nhật khu neo đậu', resource: 'anchoragearea', action: 'update' },
        { id: '14', key: 'anchoragearea:delete', name: 'Xóa khu neo đậu', resource: 'anchoragearea', action: 'delete' },
        { id: '15', key: 'anchoragearea:approve', name: 'Phê duyệt khu neo đậu', resource: 'anchoragearea', action: 'approve' },
        { id: '16', key: 'anchoragearea:approvec1', name: 'Phê duyệt C1 khu neo đậu', resource: 'anchoragearea', action: 'approvec1' },
        { id: '17', key: 'anchoragearea:approvec2', name: 'Phê duyệt C2 khu neo đậu', resource: 'anchoragearea', action: 'approvec2' },
        { id: '18', key: 'anchoragearea:history', name: 'Lịch sử phê duyệt khu neo đậu', resource: 'anchoragearea', action: 'history' },
      ];

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

      // 1. MUST NOT create a separate group_anchoragearea
      const groupKeys = getAllModuleKeys(tree);
      expect(groupKeys).toContain('group_anchorage');
      expect(groupKeys).not.toContain('group_anchoragearea');

      // 2. Exactly ONE group for Khu neo đậu under group_kcht
      const anchorageGroup = findModule(tree, 'group_anchorage');
      expect(anchorageGroup).toBeDefined();
      expect(anchorageGroup?.title).toBe('Quản lý Khu neo đậu');

      const childKeys = (anchorageGroup?.children || []).map((c) => c.key);

      // 3. Must contain valid 2-level approval and standard CRUD permissions (7 permissions)
      expect(childKeys).toEqual([
        'anchorage:read',
        'anchorage:create',
        'anchorage:update',
        'anchorage:delete',
        'anchorage:approvec1',
        'anchorage:approvec2',
        'anchorage:history',
      ]);

      // 4. Must NOT contain anchorage:approve or anchorageasset:approve
      expect(childKeys).not.toContain('anchorage:approve');
      expect(childKeys).not.toContain('anchorageasset:approve');

      // 5. Must NOT contain any anchoragearea:* key
      expect(childKeys.some((k) => String(k).startsWith('anchoragearea:'))).toBe(false);
    });

    it('should properly organize transferarea permissions and exclude transferarea:approve', async () => {
      const mockPerms = [
        { id: '1', key: 'transferarea:manage', name: 'Khu chuyển tải', resource: 'transferarea', action: 'manage' },
        { id: '2', key: 'transferarea:read', name: 'Xem khu chuyển tải', resource: 'transferarea', action: 'read' },
        { id: '3', key: 'transferarea:create', name: 'Thêm khu chuyển tải', resource: 'transferarea', action: 'create' },
        { id: '4', key: 'transferarea:update', name: 'Cập nhật khu chuyển tải', resource: 'transferarea', action: 'update' },
        { id: '5', key: 'transferarea:delete', name: 'Xóa khu chuyển tải', resource: 'transferarea', action: 'delete' },
        { id: '6', key: 'transferarea:approvec1', name: 'Phê duyệt C1 khu chuyển tải', resource: 'transferarea', action: 'approvec1' },
        { id: '7', key: 'transferarea:approvec2', name: 'Phê duyệt C2 khu chuyển tải', resource: 'transferarea', action: 'approvec2' },
        { id: '8', key: 'transferarea:history', name: 'Lịch sử phê duyệt khu chuyển tải', resource: 'transferarea', action: 'history' },
        // Legacy deprecated single-level approval (must be hidden)
        { id: '9', key: 'transferarea:approve', name: 'Phê duyệt khu chuyển tải', resource: 'transferarea', action: 'approve' },
      ];

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

      const groupKeys = getAllModuleKeys(tree);
      expect(groupKeys).toContain('group_transferarea');

      const transferAreaGroup = findModule(tree, 'group_transferarea');
      expect(transferAreaGroup).toBeDefined();
      expect(transferAreaGroup?.title).toBe('Quản lý Khu chuyển tải');

      const childKeys = (transferAreaGroup?.children || []).map((c) => c.key);
      expect(childKeys).toEqual([
        'transferarea:read',
        'transferarea:create',
        'transferarea:update',
        'transferarea:delete',
        'transferarea:approvec1',
        'transferarea:approvec2',
        'transferarea:history',
      ]);

      expect(childKeys).not.toContain('transferarea:approve');
    });

    it('should properly organize beaconstation permissions into group_beaconstation and exclude deprecated approve permissions', async () => {
      const mockPerms = [
        { id: '1', key: 'beaconstation:manage', name: 'Quản lý Đèn biển và nhà trạm', resource: 'beaconstation', action: 'manage' },
        { id: '2', key: 'beaconstation:read', name: 'Xem Đèn biển và nhà trạm', resource: 'beaconstation', action: 'read' },
        { id: '3', key: 'beaconstation:create', name: 'Thêm Đèn biển và nhà trạm', resource: 'beaconstation', action: 'create' },
        { id: '4', key: 'beaconstation:update', name: 'Sửa Đèn biển và nhà trạm', resource: 'beaconstation', action: 'update' },
        { id: '5', key: 'beaconstation:delete', name: 'Xóa Đèn biển và nhà trạm', resource: 'beaconstation', action: 'delete' },
        { id: '6', key: 'beaconstation:approvec1', name: 'Phê duyệt C1 Đèn biển và nhà trạm', resource: 'beaconstation', action: 'approvec1' },
        { id: '7', key: 'beaconstation:approvec2', name: 'Phê duyệt C2 Đèn biển và nhà trạm', resource: 'beaconstation', action: 'approvec2' },
        { id: '8', key: 'beaconstation:history', name: 'Lịch sử phê duyệt Đèn biển và nhà trạm', resource: 'beaconstation', action: 'history' },
        // Legacy deprecated single-level approval (must be hidden)
        { id: '9', key: 'beaconstation:approve', name: 'Phê duyệt Đèn biển và nhà trạm', resource: 'beaconstation', action: 'approve' },
        { id: '10', key: 'lighthouse:approve', name: 'Phê duyệt hải đăng', resource: 'lighthouse', action: 'approve' },
      ];

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

      const groupKeys = getAllModuleKeys(tree);
      expect(groupKeys).toContain('group_beaconstation');

      const beaconGroup = findModule(tree, 'group_beaconstation');
      expect(beaconGroup).toBeDefined();
      expect(beaconGroup?.title).toBe('Quản lý Đèn biển và nhà trạm gắn liền đèn biển');

      const childKeys = (beaconGroup?.children || []).map((c) => c.key);
      expect(childKeys).toEqual([
        'beaconstation:read',
        'beaconstation:create',
        'beaconstation:update',
        'beaconstation:delete',
        'beaconstation:approvec1',
        'beaconstation:approvec2',
        'beaconstation:history',
      ]);

      expect(childKeys).not.toContain('beaconstation:approve');
      expect(childKeys).not.toContain('lighthouse:approve');
    });

    it('should properly organize dikerevetment permissions into group_dikerevetment and exclude deprecated approve permissions', async () => {
      const mockPerms = [
        { id: '1', key: 'dikerevetment:manage', name: 'Quản lý đê kè', resource: 'dikerevetment', action: 'manage' },
        { id: '2', key: 'dikerevetment:read', name: 'Xem đê kè', resource: 'dikerevetment', action: 'read' },
        { id: '3', key: 'dikerevetment:create', name: 'Thêm đê kè', resource: 'dikerevetment', action: 'create' },
        { id: '4', key: 'dikerevetment:update', name: 'Cập nhật đê kè', resource: 'dikerevetment', action: 'update' },
        { id: '5', key: 'dikerevetment:delete', name: 'Xóa đê kè', resource: 'dikerevetment', action: 'delete' },
        { id: '6', key: 'dikerevetment:approvec1', name: 'Phê duyệt C1 đê kè', resource: 'dikerevetment', action: 'approvec1' },
        { id: '7', key: 'dikerevetment:approvec2', name: 'Phê duyệt C2 đê kè', resource: 'dikerevetment', action: 'approvec2' },
        { id: '8', key: 'dikerevetment:history', name: 'Lịch sử phê duyệt đê kè', resource: 'dikerevetment', action: 'history' },
        // Legacy deprecated single-level approval (must be hidden)
        { id: '9', key: 'dikerevetment:approve', name: 'Phê duyệt đê kè', resource: 'dikerevetment', action: 'approve' },
      ];

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

      const groupKeys = getAllModuleKeys(tree);
      expect(groupKeys).toContain('group_dikerevetment');

      const dikeGroup = findModule(tree, 'group_dikerevetment');
      expect(dikeGroup).toBeDefined();
      expect(dikeGroup?.title).toBe('Quản lý Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ');

      const childKeys = (dikeGroup?.children || []).map((c) => c.key);
      expect(childKeys).toEqual([
        'dikerevetment:read',
        'dikerevetment:create',
        'dikerevetment:update',
        'dikerevetment:delete',
        'dikerevetment:approvec1',
        'dikerevetment:approvec2',
        'dikerevetment:history',
      ]);

      expect(childKeys).not.toContain('dikerevetment:approve');
    });

    it('should properly organize vhf permissions into group_vhf and exclude deprecated approve permissions', async () => {
      const mockPerms = [
        { id: '1', key: 'vhf:manage', name: 'Hệ thống thông tin liên lạc VHF', resource: 'vhf', action: 'manage' },
        { id: '2', key: 'vhf:read', name: 'Xem hệ thống thông tin liên lạc VHF', resource: 'vhf', action: 'read' },
        { id: '3', key: 'vhf:create', name: 'Thêm hệ thống thông tin liên lạc VHF', resource: 'vhf', action: 'create' },
        { id: '4', key: 'vhf:update', name: 'Cập nhật hệ thống thông tin liên lạc VHF', resource: 'vhf', action: 'update' },
        { id: '5', key: 'vhf:delete', name: 'Xóa hệ thống thông tin liên lạc VHF', resource: 'vhf', action: 'delete' },
        { id: '6', key: 'vhf:approvec1', name: 'Phê duyệt C1 hệ thống thông tin liên lạc VHF', resource: 'vhf', action: 'approvec1' },
        { id: '7', key: 'vhf:approvec2', name: 'Phê duyệt C2 hệ thống thông tin liên lạc VHF', resource: 'vhf', action: 'approvec2' },
        { id: '8', key: 'vhf:history', name: 'Lịch sử phê duyệt VHF', resource: 'vhf', action: 'history' },
        // Legacy deprecated single-level approval (must be hidden)
        { id: '9', key: 'vhf:approve', name: 'Phê duyệt hệ thống VHF', resource: 'vhf', action: 'approve' },
      ];

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

      const groupKeys = getAllModuleKeys(tree);
      expect(groupKeys).toContain('group_vhf');

      const vhfGroup = findModule(tree, 'group_vhf');
      expect(vhfGroup).toBeDefined();
      expect(vhfGroup?.title).toBe('Quản lý Hệ thống thông tin liên lạc VHF');

      const childKeys = (vhfGroup?.children || []).map((c) => c.key);
      expect(childKeys).toEqual([
        'vhf:read',
        'vhf:create',
        'vhf:update',
        'vhf:delete',
        'vhf:approvec1',
        'vhf:approvec2',
        'vhf:history',
      ]);

      expect(childKeys).not.toContain('vhf:approve');
    });

    it('should properly organize radarstation permissions into group_radarstation and exclude deprecated approve permissions', async () => {
      const mockPerms = [
        { id: '1', key: 'radarstation:manage', name: 'Trạm radar', resource: 'radarstation', action: 'manage' },
        { id: '2', key: 'radarstation:read', name: 'Xem trạm radar', resource: 'radarstation', action: 'read' },
        { id: '3', key: 'radarstation:create', name: 'Thêm trạm radar', resource: 'radarstation', action: 'create' },
        { id: '4', key: 'radarstation:update', name: 'Cập nhật trạm radar', resource: 'radarstation', action: 'update' },
        { id: '5', key: 'radarstation:delete', name: 'Xóa trạm radar', resource: 'radarstation', action: 'delete' },
        { id: '6', key: 'radarstation:approvec1', name: 'Phê duyệt C1 trạm radar', resource: 'radarstation', action: 'approvec1' },
        { id: '7', key: 'radarstation:approvec2', name: 'Phê duyệt C2 trạm radar', resource: 'radarstation', action: 'approvec2' },
        { id: '8', key: 'radarstation:history', name: 'Lịch sử phê duyệt trạm radar', resource: 'radarstation', action: 'history' },
        // Legacy deprecated single-level approval (must be hidden)
        { id: '9', key: 'radarstation:approve', name: 'Phê duyệt trạm radar', resource: 'radarstation', action: 'approve' },
        { id: '10', key: 'tramradar:approve', name: 'Phê duyệt trạm radar (cũ)', resource: 'tramradar', action: 'approve' },
        // Legacy alias permissions mapping to canonical radarstation
        { id: '11', key: 'tramradar:read', name: 'Xem trạm radar cũ', resource: 'tramradar', action: 'read' },
      ];

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

      const groupKeys = getAllModuleKeys(tree);
      expect(groupKeys).toContain('group_radarstation');
      expect(groupKeys).not.toContain('group_tramradar');

      const radarGroup = findModule(tree, 'group_radarstation');
      expect(radarGroup).toBeDefined();
      expect(radarGroup?.title).toBe('Quản lý Trạm radar');

      const childKeys = (radarGroup?.children || []).map((c) => c.key);
      expect(childKeys).toEqual([
        'radarstation:read',
        'radarstation:create',
        'radarstation:update',
        'radarstation:delete',
        'radarstation:approvec1',
        'radarstation:approvec2',
        'radarstation:history',
      ]);

      expect(childKeys).not.toContain('radarstation:approve');
      expect(childKeys).not.toContain('tramradar:approve');
    });

    it('should properly organize cctv permissions into group_cctv and exclude deprecated approve permissions', async () => {
      const mockPerms = [
        { id: '1', key: 'cctv:manage', name: 'Hệ thống CCTV', resource: 'cctv', action: 'manage' },
        { id: '2', key: 'cctv:read', name: 'Xem hệ thống CCTV', resource: 'cctv', action: 'read' },
        { id: '3', key: 'cctv:create', name: 'Thêm hệ thống CCTV', resource: 'cctv', action: 'create' },
        { id: '4', key: 'cctv:update', name: 'Cập nhật hệ thống CCTV', resource: 'cctv', action: 'update' },
        { id: '5', key: 'cctv:delete', name: 'Xóa hệ thống CCTV', resource: 'cctv', action: 'delete' },
        { id: '6', key: 'cctv:approvec1', name: 'Phê duyệt C1 hệ thống CCTV', resource: 'cctv', action: 'approvec1' },
        { id: '7', key: 'cctv:approvec2', name: 'Phê duyệt C2 hệ thống CCTV', resource: 'cctv', action: 'approvec2' },
        { id: '8', key: 'cctv:history', name: 'Lịch sử phê duyệt CCTV', resource: 'cctv', action: 'history' },
        // Legacy deprecated single-level approval (must be hidden)
        { id: '9', key: 'cctv:approve', name: 'Phê duyệt hệ thống CCTV', resource: 'cctv', action: 'approve' },
        { id: '10', key: 'cctvasset:approve', name: 'Phê duyệt hệ thống CCTV (cũ)', resource: 'cctvasset', action: 'approve' },
      ];

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

      const groupKeys = getAllModuleKeys(tree);
      expect(groupKeys).toContain('group_cctv');

      const cctvGroup = findModule(tree, 'group_cctv');
      expect(cctvGroup).toBeDefined();
      expect(cctvGroup?.title).toBe('Quản lý Hệ thống CCTV');

      const childKeys = (cctvGroup?.children || []).map((c) => c.key);
      expect(childKeys).toEqual([
        'cctv:read',
        'cctv:create',
        'cctv:update',
        'cctv:delete',
        'cctv:approvec1',
        'cctv:approvec2',
        'cctv:history',
      ]);

      expect(childKeys).not.toContain('cctv:approve');
      expect(childKeys).not.toContain('cctvasset:approve');
    });

    it('should properly organize scada permissions into group_scada and exclude deprecated approve permissions', async () => {
      const mockPerms = [
        { id: '1', key: 'scada:manage', name: 'Hệ thống SCADA', resource: 'scada', action: 'manage' },
        { id: '2', key: 'scada:read', name: 'Xem hệ thống SCADA', resource: 'scada', action: 'read' },
        { id: '3', key: 'scada:create', name: 'Thêm hệ thống SCADA', resource: 'scada', action: 'create' },
        { id: '4', key: 'scada:update', name: 'Cập nhật hệ thống SCADA', resource: 'scada', action: 'update' },
        { id: '5', key: 'scada:delete', name: 'Xóa hệ thống SCADA', resource: 'scada', action: 'delete' },
        { id: '6', key: 'scada:approvec1', name: 'Phê duyệt C1 hệ thống SCADA', resource: 'scada', action: 'approvec1' },
        { id: '7', key: 'scada:approvec2', name: 'Phê duyệt C2 hệ thống SCADA', resource: 'scada', action: 'approvec2' },
        { id: '8', key: 'scada:history', name: 'Lịch sử phê duyệt SCADA', resource: 'scada', action: 'history' },
        // Legacy deprecated single-level approval (must be hidden)
        { id: '9', key: 'scada:approve', name: 'Phê duyệt hệ thống SCADA', resource: 'scada', action: 'approve' },
        { id: '10', key: 'scadaasset:approve', name: 'Phê duyệt hệ thống SCADA (cũ)', resource: 'scadaasset', action: 'approve' },
      ];

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

      const groupKeys = getAllModuleKeys(tree);
      expect(groupKeys).toContain('group_scada');

      const scadaGroup = findModule(tree, 'group_scada');
      expect(scadaGroup).toBeDefined();
      expect(scadaGroup?.title).toBe('Quản lý Hệ thống SCADA');

      const childKeys = (scadaGroup?.children || []).map((c) => c.key);
      expect(childKeys).toEqual([
        'scada:read',
        'scada:create',
        'scada:update',
        'scada:delete',
        'scada:approvec1',
        'scada:approvec2',
        'scada:history',
      ]);

      expect(childKeys).not.toContain('scada:approve');
      expect(childKeys).not.toContain('scadaasset:approve');
    });

    it('should properly organize transmission permissions into group_transmission and exclude deprecated approve permissions', async () => {
      const mockPerms = [
        { id: '1', key: 'transmission:manage', name: 'Hệ thống truyền dẫn', resource: 'transmission', action: 'manage' },
        { id: '2', key: 'transmission:read', name: 'Xem hệ thống truyền dẫn', resource: 'transmission', action: 'read' },
        { id: '3', key: 'transmission:create', name: 'Thêm hệ thống truyền dẫn', resource: 'transmission', action: 'create' },
        { id: '4', key: 'transmission:update', name: 'Cập nhật hệ thống truyền dẫn', resource: 'transmission', action: 'update' },
        { id: '5', key: 'transmission:delete', name: 'Xóa hệ thống truyền dẫn', resource: 'transmission', action: 'delete' },
        { id: '6', key: 'transmission:approvec1', name: 'Phê duyệt C1 hệ thống truyền dẫn', resource: 'transmission', action: 'approvec1' },
        { id: '7', key: 'transmission:approvec2', name: 'Phê duyệt C2 hệ thống truyền dẫn', resource: 'transmission', action: 'approvec2' },
        { id: '8', key: 'transmission:history', name: 'Lịch sử phê duyệt truyền dẫn', resource: 'transmission', action: 'history' },
        // Legacy deprecated single-level approval (must be hidden)
        { id: '9', key: 'transmission:approve', name: 'Phê duyệt hệ thống truyền dẫn', resource: 'transmission', action: 'approve' },
        { id: '10', key: 'transmissionasset:approve', name: 'Phê duyệt hệ thống truyền dẫn (cũ)', resource: 'transmissionasset', action: 'approve' },
      ];

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

      const groupKeys = getAllModuleKeys(tree);
      expect(groupKeys).toContain('group_transmission');

      const transmissionGroup = findModule(tree, 'group_transmission');
      expect(transmissionGroup).toBeDefined();
      expect(transmissionGroup?.title).toBe('Quản lý Hệ thống truyền dẫn');

      const childKeys = (transmissionGroup?.children || []).map((c) => c.key);
      expect(childKeys).toEqual([
        'transmission:read',
        'transmission:create',
        'transmission:update',
        'transmission:delete',
        'transmission:approvec1',
        'transmission:approvec2',
        'transmission:history',
      ]);

      expect(childKeys).not.toContain('transmission:approve');
      expect(childKeys).not.toContain('transmissionasset:approve');
    });

    it('should properly organize vtsassist permissions into group_vtsassist and exclude deprecated approve permissions', async () => {
      const mockPerms = [
        { id: '1', key: 'vtsassist:manage', name: 'Hệ thống phụ trợ VTS', resource: 'vtsassist', action: 'manage' },
        { id: '2', key: 'vtsassist:read', name: 'Xem hệ thống phụ trợ VTS', resource: 'vtsassist', action: 'read' },
        { id: '3', key: 'vtsassist:create', name: 'Thêm hệ thống phụ trợ VTS', resource: 'vtsassist', action: 'create' },
        { id: '4', key: 'vtsassist:update', name: 'Cập nhật hệ thống phụ trợ VTS', resource: 'vtsassist', action: 'update' },
        { id: '5', key: 'vtsassist:delete', name: 'Xóa hệ thống phụ trợ VTS', resource: 'vtsassist', action: 'delete' },
        { id: '6', key: 'vtsassist:approvec1', name: 'Phê duyệt C1 hệ thống phụ trợ VTS', resource: 'vtsassist', action: 'approvec1' },
        { id: '7', key: 'vtsassist:approvec2', name: 'Phê duyệt C2 hệ thống phụ trợ VTS', resource: 'vtsassist', action: 'approvec2' },
        { id: '8', key: 'vtsassist:history', name: 'Lịch sử phê duyệt phụ trợ VTS', resource: 'vtsassist', action: 'history' },
        // Legacy deprecated single-level approval (must be hidden)
        { id: '9', key: 'vtsassist:approve', name: 'Phê duyệt hệ thống phụ trợ VTS', resource: 'vtsassist', action: 'approve' },
        { id: '10', key: 'vtsassistasset:approve', name: 'Phê duyệt hệ thống phụ trợ VTS (cũ)', resource: 'vtsassistasset', action: 'approve' },
      ];

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

      const groupKeys = getAllModuleKeys(tree);
      expect(groupKeys).toContain('group_vtsassist');

      const vtsAssistGroup = findModule(tree, 'group_vtsassist');
      expect(vtsAssistGroup).toBeDefined();
      expect(vtsAssistGroup?.title).toBe('Quản lý Hệ thống phụ trợ VTS');

      const childKeys = (vtsAssistGroup?.children || []).map((c) => c.key);
      expect(childKeys).toEqual([
        'vtsassist:read',
        'vtsassist:create',
        'vtsassist:update',
        'vtsassist:delete',
        'vtsassist:approvec1',
        'vtsassist:approvec2',
        'vtsassist:history',
      ]);

      expect(childKeys).not.toContain('vtsassist:approve');
      expect(childKeys).not.toContain('vtsassistasset:approve');
    });

    it('should properly organize shiprepairfacility/shiprepairyard permissions into group_shiprepairfacility and exclude deprecated approve permissions', async () => {
      const mockPerms = [
        { id: '1', key: 'shiprepairyard:manage', name: 'Cơ sở sửa chữa, đóng tàu', resource: 'shiprepairyard', action: 'manage' },
        { id: '2', key: 'shiprepairyard:read', name: 'Xem cơ sở sửa chữa, đóng tàu', resource: 'shiprepairyard', action: 'read' },
        { id: '3', key: 'shiprepairyard:create', name: 'Thêm cơ sở sửa chữa, đóng tàu', resource: 'shiprepairyard', action: 'create' },
        { id: '4', key: 'shiprepairyard:update', name: 'Cập nhật cơ sở sửa chữa, đóng tàu', resource: 'shiprepairyard', action: 'update' },
        { id: '5', key: 'shiprepairyard:delete', name: 'Xóa cơ sở sửa chữa, đóng tàu', resource: 'shiprepairyard', action: 'delete' },
        { id: '6', key: 'shiprepairyard:approvec1', name: 'Phê duyệt C1 cơ sở sửa chữa, đóng tàu', resource: 'shiprepairyard', action: 'approvec1' },
        { id: '7', key: 'shiprepairyard:approvec2', name: 'Phê duyệt C2 cơ sở sửa chữa, đóng tàu', resource: 'shiprepairyard', action: 'approvec2' },
        { id: '8', key: 'shiprepairyard:history', name: 'Lịch sử phê duyệt cơ sở sửa chữa, đóng tàu', resource: 'shiprepairyard', action: 'history' },
        // Legacy deprecated single-level approval (must be hidden)
        { id: '9', key: 'shiprepairyard:approve', name: 'Phê duyệt cơ sở sửa chữa, đóng tàu', resource: 'shiprepairyard', action: 'approve' },
        { id: '10', key: 'shiprepair:approve', name: 'Phê duyệt cơ sở sửa chữa tàu cũ', resource: 'shiprepair', action: 'approve' },
        { id: '11', key: 'shiprepairfacility:approve', name: 'Phê duyệt cơ sở đóng sửa tàu cũ', resource: 'shiprepairfacility', action: 'approve' },
      ];

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

      const groupKeys = getAllModuleKeys(tree);
      expect(groupKeys).toContain('group_shiprepairfacility');
      expect(groupKeys).not.toContain('group_shiprepairyard');

      const shipRepairGroup = findModule(tree, 'group_shiprepairfacility');
      expect(shipRepairGroup).toBeDefined();
      expect(shipRepairGroup?.title).toBe('Quản lý Cơ sở sửa chữa, đóng tàu');

      const childKeys = (shipRepairGroup?.children || []).map((c) => c.key);
      expect(childKeys).toEqual([
        'shiprepairfacility:read',
        'shiprepairfacility:create',
        'shiprepairfacility:update',
        'shiprepairfacility:delete',
        'shiprepairfacility:approvec1',
        'shiprepairfacility:approvec2',
        'shiprepairfacility:history',
      ]);

      expect(childKeys).not.toContain('shiprepairyard:approve');
      expect(childKeys).not.toContain('shiprepair:approve');
      expect(childKeys).not.toContain('shiprepairfacility:approve');
    });
  });

  describe('useAssetPermissions - History & Read separation', () => {
    it('returns canHistory = false when user only has read permission', () => {
      usePermissionStore.setState({
        permissions: ['buoyberthasset:read'],
        isSuperAdmin: false,
      });

      let hookRes: any;
      function TestHook() {
        hookRes = useAssetPermissions(['buoyberth', 'buoyberthasset']);
        return null;
      }

      renderToStaticMarkup(React.createElement(TestHook));
      expect(hookRes.canRead).toBe(true);
      expect(hookRes.canHistory).toBe(false);
    });

    it('returns canHistory = true only when explicit history permission is granted', () => {
      usePermissionStore.setState({
        permissions: ['buoyberthasset:read', 'buoyberthasset:history'],
        isSuperAdmin: false,
      });

      let hookRes: any;
      function TestHook() {
        hookRes = useAssetPermissions(['buoyberth', 'buoyberthasset']);
        return null;
      }

      renderToStaticMarkup(React.createElement(TestHook));
      expect(hookRes.canRead).toBe(true);
      expect(hookRes.canHistory).toBe(true);
    });
  });

  describe('Hierarchical Ancestor Access (Ông - Cha - Con)', () => {
    it('grants read permission to parent (berth) and grandparent (port) when child (pier) has any permission', async () => {
      const { canAccessMenu } = await import('../components/appLayoutMenu');
      const { NAV_GROUPS, accessibleTree } = await import('../config/navigation');

      // User chỉ có 1 quyền duy nhất: pier:create
      usePermissionStore.setState({
        permissions: ['pier:create'],
        isSuperAdmin: false,
      });

      const store = usePermissionStore.getState();

      // 1. Quyền xem danh sách của chính con
      expect(store.hasPermission('pier:read')).toBe(true);
      // 2. Quyền xem danh sách của cha (berth)
      expect(store.hasPermission('berth:read')).toBe(true);
      // 3. Quyền xem danh sách của ông (port)
      expect(store.hasPermission('port:read')).toBe(true);

      // 4. canAccessMenu trả về true cho cả con, cha, ông
      expect(canAccessMenu('/pier')).toBe(true);
      expect(canAccessMenu('/berth')).toBe(true);
      expect(canAccessMenu('/port')).toBe(true);

      // 5. accessibleTree giữ nguyên route của cha và ông
      const kchtGroup = NAV_GROUPS.find((g) => g.id === 'kcht')!;
      const tree = accessibleTree(kchtGroup.tree, canAccessMenu);

      const portNode = tree.find((n) => n.key === '/port');
      expect(portNode).toBeDefined();
      expect(portNode?.route).toBe('/port'); // Ông không bị xóa route

      const berthNode = portNode?.children?.find((n) => n.key === '/berth');
      expect(berthNode).toBeDefined();
      expect(berthNode?.route).toBe('/berth'); // Cha không bị xóa route

      const pierNode = berthNode?.children?.find((n) => n.key === '/pier');
      expect(pierNode).toBeDefined();
      expect(pierNode?.route).toBe('/pier'); // Con có route đầy đủ

      // 6. Quyền đặc thù (write, approve, history) TUYỆT ĐỐI KHÔNG bị thừa kế sai
      expect(store.hasPermission('berth:create')).toBe(false);
      expect(store.hasPermission('port:create')).toBe(false);
      expect(store.hasPermission('berth:approvec1')).toBe(false);
      expect(store.hasPermission('port:approvec1')).toBe(false);
      expect(store.hasPermission('berth:history')).toBe(false);
      expect(store.hasPermission('port:history')).toBe(false);
    });

    it('grants read permission to buoy-station and navigation-channel when child buoy has permission', async () => {
      const { canAccessMenu } = await import('../components/appLayoutMenu');

      // User chỉ có quyền buoy:approvec1
      usePermissionStore.setState({
        permissions: ['buoy:approvec1'],
        isSuperAdmin: false,
      });

      const store = usePermissionStore.getState();

      // Quyền xem danh sách con, cha, ông
      expect(store.hasPermission('buoy:read')).toBe(true);
      expect(store.hasPermission('buoystation:read')).toBe(true);
      expect(store.hasPermission('navigationchannel:read')).toBe(true);

      expect(canAccessMenu('/buoys')).toBe(true);
      expect(canAccessMenu('/buoy-station')).toBe(true);
      expect(canAccessMenu('/navigation-channel')).toBe(true);

      // Không thừa kế quyền approvec1 lên cha/ông
      expect(store.hasPermission('buoystation:approvec1')).toBe(false);
      expect(store.hasPermission('navigationchannel:approvec1')).toBe(false);
    });

    it('allows accessing list screen but hides "Xem chi tiết" action when user only has update permission', () => {
      // User CHỈ có duy nhất quyền cập nhật tài sản bến cảng (berthasset:update)
      usePermissionStore.setState({
        permissions: ['berthasset:update'],
        isSuperAdmin: false,
      });

      const store = usePermissionStore.getState();

      // 1. Quyền xem danh sách (implicit read) để hiển thị menu và truy cập bảng
      expect(store.hasPermission('berthasset:read')).toBe(true);

      // 2. Quyền chi tiết tường minh (explicitOnly) KHÔNG được gán ngầm
      expect(store.hasExplicitPermission('berthasset:read')).toBe(false);

      // 3. Hook useAssetPermissions: canUpdate = true, canRead = false
      let hookRes: any;
      function TestHook() {
        hookRes = useAssetPermissions(['berth', 'berthasset']);
        return null;
      }
      renderToStaticMarkup(React.createElement(TestHook));

      expect(hookRes.canUpdate).toBe(true);
      expect(hookRes.canRead).toBe(false);
      expect(hookRes.canCreate).toBe(false);
      expect(hookRes.canDelete).toBe(false);
    });

    it('does NOT grant reject permission when only approveC1 is checked (rejectc1 is unchecked)', () => {
      // User CHỈ có berthasset:update và berthasset:approvec1 (không có rejectc1)
      usePermissionStore.setState({
        permissions: ['berthasset:update', 'berthasset:approvec1'],
        isSuperAdmin: false,
      });

      let hookRes: any;
      function TestHook() {
        hookRes = useAssetPermissions(['berth', 'berthasset']);
        return null;
      }
      renderToStaticMarkup(React.createElement(TestHook));

      expect(hookRes.canApproveC1).toBe(true);
      expect(hookRes.canRejectC1).toBe(false);
      expect(hookRes.canApproveC2).toBe(false);
      expect(hookRes.canRejectC2).toBe(false);
      expect(hookRes.canReject).toBe(false);

      // Khi người dùng được cấp thêm berthasset:rejectc1
      usePermissionStore.setState({
        permissions: ['berthasset:update', 'berthasset:approvec1', 'berthasset:rejectc1'],
        isSuperAdmin: false,
      });
      renderToStaticMarkup(React.createElement(TestHook));

      expect(hookRes.canApproveC1).toBe(true);
      expect(hookRes.canRejectC1).toBe(true);
      expect(hookRes.canReject).toBe(true);
      expect(hookRes.canRejectC2).toBe(false);
    });
  });
});

