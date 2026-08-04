import api from './api';
import type { MenuTreeNode, Permission } from '../types/permission';

function extractData<T>(response: any): T {
  return response.data?.data ?? response.data;
}

export const permissionService = {
  async list(): Promise<Permission[]> {
    const response = await api.get('/permissions');
    const items = extractData<any[]>(response);
    if (!Array.isArray(items)) return [];

    return items
      .filter((item) => item?.code)
      .map((item) => ({
        key: item.code,
        name: item.name || item.code,
        group: item.resource || item.code.split(':')[0],
        description: item.description || '',
        resource: item.resource,
        action: item.action,
      }));
  },

  async listMenuTree(appCode = 'VMD_MTIS'): Promise<MenuTreeNode[]> {
    const response = await api.get('/permissions/menu-tree', { params: { appCode } });
    const items = extractData<any[]>(response);
    if (!Array.isArray(items)) return [];

    const mapNode = (item: any): MenuTreeNode => ({
      key: String(item.key ?? item.code),
      code: String(item.code ?? item.key),
      title: item.title ?? item.name ?? item.code,
      url: item.url,
      parentCode: item.parentCode,
      children: Array.isArray(item.children) ? item.children.map(mapNode) : [],
    });
    return items.map(mapNode);
  },

  async update(id: string, payload: Partial<Permission>): Promise<Permission> {
    const response = await api.put(`/v1/permissions/${id}`, payload);
    return extractData<Permission>(response);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/v1/permissions/${id}`);
  },

  async evaluateUserPermissions(userId: string): Promise<string[]> {
    const response = await api.get(`/v1/permissions/evaluate/${userId}`);
    const data = extractData<string[] | Set<string>>(response);
    return Array.isArray(data) ? data : Array.from(data || []);
  },
};
