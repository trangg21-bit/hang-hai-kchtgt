/** Dữ liệu tối thiểu để hiển thị một đơn vị trong cây. */
export interface OrgUnitTreeOption {
  id: string;
  name: string;
  code?: string;
  parentId?: string;
}

export interface OrgUnitTreeNode {
  key: string;
  value: string;
  title: string;
  code?: string;
  /** Nhãn hiển thị trên thanh select khi bật showPath (đường dẫn đầy đủ). */
  label?: string;
  children?: OrgUnitTreeNode[];
}

/** Chuẩn hóa chuỗi tìm kiếm: bỏ dấu, không phân biệt hoa thường và khoảng trắng đầu/cuối. */
export function normalizeSearchText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd');
}

/**
 * Tên đơn vị cấp 2 (con của cấp cao nhất) trong chuỗi phân cấp của đơn vị.
 * Dùng để hiển thị Đơn vị quản lý đồng nhất giữa danh sách và chi tiết:
 * chain[0] = cấp cao nhất (level 1), cấp 2 = chain[1]; nếu không có cấp 2 thì trả chính đơn vị.
 */
export function resolveOrgLevel2Name(
  orgUnits: readonly OrgUnitTreeOption[] = [],
  orgUnitId?: string | null,
): string | undefined {
  if (!orgUnitId || !Array.isArray(orgUnits) || orgUnits.length === 0) return undefined;
  const byId = new Map<string, OrgUnitTreeOption>(orgUnits.map((o) => [o.id, o]));
  const chain: OrgUnitTreeOption[] = [];
  let cur: OrgUnitTreeOption | undefined = byId.get(orgUnitId);
  let guard = 0;
  while (cur && guard++ < 30) {
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  const level2 = chain.length >= 2 ? chain[1] : chain[0];
  return level2 ? level2.name : undefined;
}

/**
 * Chuỗi tên từ cấp 2 đến cấp cuối của đơn vị (vd: "Cảng vụ X / Đội Y") —
 * dùng cho dòng Đơn vị quản lý ở chi tiết: hiện "cấp trước đó / cấp cuối".
 */
export function resolveOrgTailPath(
  orgUnits: readonly OrgUnitTreeOption[] = [],
  orgUnitId?: string | null,
): string | undefined {
  if (!orgUnitId || !Array.isArray(orgUnits) || orgUnits.length === 0) return undefined;
  const byId = new Map<string, OrgUnitTreeOption>(orgUnits.map((o) => [o.id, o]));
  const chain: OrgUnitTreeOption[] = [];
  let cur: OrgUnitTreeOption | undefined = byId.get(orgUnitId);
  let guard = 0;
  while (cur && guard++ < 30) {
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  if (chain.length === 0) return undefined;
  return chain.slice(1).map((o) => o.name).join(' / ');
}

/**
 * Danh sách tên đầy đủ các cấp của đơn vị (cấp cao nhất → đơn vị cuối) —
 * dùng cho dòng Đơn vị quản lý ở chi tiết: hiện đủ cấp, màu chữ giảm dần.
 */
export function resolveOrgFullPath(
  orgUnits: readonly OrgUnitTreeOption[] = [],
  orgUnitId?: string | null,
): string[] | undefined {
  if (!orgUnitId || !Array.isArray(orgUnits) || orgUnits.length === 0) return undefined;
  const byId = new Map<string, OrgUnitTreeOption>(orgUnits.map((o) => [o.id, o]));
  const chain: OrgUnitTreeOption[] = [];
  let cur: OrgUnitTreeOption | undefined = byId.get(orgUnitId);
  let guard = 0;
  while (cur && guard++ < 30) {
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  if (chain.length === 0) return undefined;
  return chain.map((o) => o.name);
}

/**
 * Lấy tập hợp tất cả ID của đơn vị gốc và toàn bộ đơn vị cấp con/cháu bên dưới.
 * Dùng cho logic lọc Cascading (chọn Cục -> hiển thị KCHT thuộc Cục và toàn bộ Cảng vụ con).
 */
export function resolveOrgSubtreeIds(
  orgUnits: readonly OrgUnitTreeOption[] = [],
  rootOrgUnitId?: string | null,
): Set<string> {
  const result = new Set<string>();
  if (!rootOrgUnitId || !Array.isArray(orgUnits)) return result;
  const rootStr = String(rootOrgUnitId);
  result.add(rootStr);
  const queue = [rootStr];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    for (const org of orgUnits) {
      if (!org || org.id === undefined || org.id === null) continue;
      const orgIdStr = String(org.id);
      const orgParentIdStr =
        org.parentId !== undefined && org.parentId !== null ? String(org.parentId) : undefined;
      if (orgParentIdStr === parentId && !result.has(orgIdStr)) {
        result.add(orgIdStr);
        queue.push(orgIdStr);
      }
    }
  }
  return result;
}

/**
 * Lấy danh sách các cơ quan quản lý cấp trên (cấp cao nhất/root) từ danh sách đơn vị.
 * Bỏ qua node Bộ GTVT (G17).
 */
export function getRootOrgUnits(orgUnits: readonly OrgUnitTreeOption[] = []): OrgUnitTreeOption[] {
  const safeOptions = (Array.isArray(orgUnits) ? orgUnits : []).filter(
    (o) => o && o.code !== 'G17' && o.id !== '00000000-0000-0000-0000-000000000017',
  );
  if (safeOptions.length === 0) return [];
  const allIds = new Set<string>(safeOptions.map((o) => String(o.id)));
  return safeOptions.filter((o) => {
    if (!o.parentId) return true;
    const parentIdStr = String(o.parentId);
    return parentIdStr === '00000000-0000-0000-0000-000000000017' || !allIds.has(parentIdStr);
  });
}

/**
 * Tìm ID của cơ quan quản lý cấp trên (root node) của một đơn vị.
 */
export function findRootOrgUnitId(
  orgUnits: readonly OrgUnitTreeOption[] = [],
  orgUnitId?: string | null,
): string | undefined {
  if (!orgUnitId || !Array.isArray(orgUnits) || orgUnits.length === 0) return undefined;
  const byId = new Map<string, OrgUnitTreeOption>(orgUnits.map((o) => [String(o.id), o]));
  let cur = byId.get(String(orgUnitId));
  if (!cur) return undefined;
  let guard = 0;
  while (cur && guard++ < 30) {
    if (
      !cur.parentId ||
      cur.parentId === '00000000-0000-0000-0000-000000000017' ||
      !byId.has(String(cur.parentId))
    ) {
      return String(cur.id);
    }
    cur = byId.get(String(cur.parentId));
  }
  return undefined;
}

/**
 * Dựng cây từ danh sách phẳng. Có thể tái sử dụng cho Tree, Cascader hoặc
 * các component khác cần cùng một cấu trúc đơn vị.
 */
export function buildOrgUnitTreeData(
  options: readonly OrgUnitTreeOption[] = [],
): OrgUnitTreeNode[] {
  // Ẩn đơn vị gốc G17 (Bộ GTVT) nếu có — G17 chỉ dùng làm container phân quyền ngầm cho admin
  const safeOptions = (Array.isArray(options) ? options : []).filter(
    (o) => o && o.code !== 'G17' && o.id !== '00000000-0000-0000-0000-000000000017',
  );
  const nodes = new Map<string, OrgUnitTreeNode>();

  safeOptions.forEach((option) => {
    if (!option || option.id === undefined || option.id === null) return;
    const strId = String(option.id);
    nodes.set(strId, {
      key: strId,
      value: strId,
      title: option.code ? `${option.code} - ${option.name}` : option.name || strId,
      code: option.code,
      children: [],
    });
  });

  const roots: OrgUnitTreeNode[] = [];
  safeOptions.forEach((option) => {
    if (!option || option.id === undefined || option.id === null) return;
    const strId = String(option.id);
    const node = nodes.get(strId);
    const parentId =
      option.parentId !== undefined && option.parentId !== null
        ? String(option.parentId)
        : undefined;
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (!node) return;

    if (parent && parent !== node) {
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sắp xếp thứ tự ưu tiên chuẩn cho 3 khối đơn vị to cấp cao nhất:
  // 1: Cục Hàng hải và Đường thủy Việt Nam (G17.43)
  // 2: Tổng công ty Bảo đảm an toàn hàng hải Việt Nam (G17.72)
  // 3: Công ty TNHH MTV Thông tin điện tử hàng hải Việt Nam (VISHIPEL) (G17.74)
  const getRootPriority = (node: OrgUnitTreeNode): number => {
    const code = (node.code || '').toUpperCase();
    const title = (node.title || '').toLowerCase();
    if (code === 'G17.43' || title.includes('cục hàng hải')) return 1;
    if (code === 'G17.72' || title.includes('bảo đảm an toàn')) return 2;
    if (code === 'G17.74' || title.includes('vishipel') || title.includes('thông tin điện tử'))
      return 3;
    return 99;
  };
  roots.sort((a, b) => getRootPriority(a) - getRootPriority(b));

  const removeEmptyChildren = (items: OrgUnitTreeNode[]): OrgUnitTreeNode[] =>
    items.map((item) => {
      if (!item.children?.length) {
        const leaf = { ...item };
        delete leaf.children;
        return leaf;
      }
      return { ...item, children: removeEmptyChildren(item.children) };
    });

  return removeEmptyChildren(roots);
}
