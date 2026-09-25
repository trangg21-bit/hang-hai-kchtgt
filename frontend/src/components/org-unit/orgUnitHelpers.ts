/** Dữ liệu tối thiểu để hiển thị một đơn vị trong cây. */
export interface OrgUnitTreeOption {
  id: string;
  name: string;
  code?: string;
  parentId?: string;
  children?: OrgUnitTreeOption[];
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

/** Làm phẳng danh sách đơn vị nếu được truyền vào dưới dạng cây lồng nhau (hoặc hỗn hợp). */
export function flattenOrgUnits(
  nodes: readonly OrgUnitTreeOption[] = [],
): OrgUnitTreeOption[] {
  const result: OrgUnitTreeOption[] = [];
  const walk = (items: readonly OrgUnitTreeOption[], inheritedParentId?: string) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!item || item.id === undefined || item.id === null) continue;
      const strId = String(item.id).trim();
      if (!strId) continue;
      const explicitParentId = item.parentId !== undefined && item.parentId !== null
        ? String(item.parentId).trim()
        : undefined;
      const effectiveParentId = explicitParentId || inheritedParentId;
      result.push({
        id: strId,
        name: item.name,
        code: item.code,
        parentId: effectiveParentId,
      });
      const children = item.children;
      if (Array.isArray(children) && children.length > 0) {
        walk(children, strId);
      }
    }
  };
  walk(nodes);
  return result;
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
  const flat = flattenOrgUnits(orgUnits);
  const byId = new Map<string, OrgUnitTreeOption>(flat.map((o) => [String(o.id).toLowerCase(), o]));
  const chain: OrgUnitTreeOption[] = [];
  let cur: OrgUnitTreeOption | undefined = byId.get(String(orgUnitId).toLowerCase());
  let guard = 0;
  while (cur && guard++ < 30) {
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(String(cur.parentId).toLowerCase()) : undefined;
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
  const flat = flattenOrgUnits(orgUnits);
  const byId = new Map<string, OrgUnitTreeOption>(flat.map((o) => [String(o.id).toLowerCase(), o]));
  const chain: OrgUnitTreeOption[] = [];
  let cur: OrgUnitTreeOption | undefined = byId.get(String(orgUnitId).toLowerCase());
  let guard = 0;
  while (cur && guard++ < 30) {
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(String(cur.parentId).toLowerCase()) : undefined;
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
  const flat = flattenOrgUnits(orgUnits);
  const byId = new Map<string, OrgUnitTreeOption>(flat.map((o) => [String(o.id).toLowerCase(), o]));
  const chain: OrgUnitTreeOption[] = [];
  let cur: OrgUnitTreeOption | undefined = byId.get(String(orgUnitId).toLowerCase());
  let guard = 0;
  while (cur && guard++ < 30) {
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(String(cur.parentId).toLowerCase()) : undefined;
  }
  if (chain.length === 0) return undefined;
  return chain.map((o) => o.name);
}

/**
 * Lấy tập hợp tất cả ID của đơn vị gốc và toàn bộ đơn vị cấp con/cháu bên dưới.
 * Dùng cho logic lọc Cascading (chọn Cục -> hiển thị KCHT thuộc Cục và toàn bộ Cảng vụ con).
 * Hỗ trợ cả danh sách phẳng và cấu trúc cây lồng nhau (children), không phân biệt hoa/thường (case-insensitive).
 */
export function resolveOrgSubtreeIds(
  orgUnits: readonly OrgUnitTreeOption[] = [],
  rootOrgUnitId?: string | null,
): Set<string> {
  const result = new Set<string>();
  if (!rootOrgUnitId || !Array.isArray(orgUnits) || orgUnits.length === 0) return result;

  const targetRoot = String(rootOrgUnitId).trim();
  if (!targetRoot) return result;

  const flatList = flattenOrgUnits(orgUnits);
  const targetRootNorm = targetRoot.toLowerCase();

  result.add(targetRoot);
  result.add(targetRootNorm);

  const queue: string[] = [targetRootNorm];
  const visited = new Set<string>([targetRootNorm]);

  while (queue.length > 0) {
    const curParentNorm = queue.shift()!;
    for (const org of flatList) {
      if (!org || org.id === undefined || org.id === null) continue;
      const orgIdStr = String(org.id).trim();
      const orgIdNorm = orgIdStr.toLowerCase();
      const orgParentIdNorm = org.parentId ? String(org.parentId).trim().toLowerCase() : undefined;

      if (orgParentIdNorm === curParentNorm && !visited.has(orgIdNorm)) {
        visited.add(orgIdNorm);
        result.add(orgIdStr);
        result.add(orgIdNorm);
        queue.push(orgIdNorm);
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
  const flat = flattenOrgUnits(orgUnits);
  const byId = new Map<string, OrgUnitTreeOption>(flat.map((o) => [String(o.id).toLowerCase(), o]));
  let cur = byId.get(String(orgUnitId).toLowerCase());
  if (!cur) return undefined;
  let guard = 0;
  while (cur && guard++ < 30) {
    const parentIdStr = cur.parentId ? String(cur.parentId).trim().toLowerCase() : undefined;
    if (
      !parentIdStr ||
      parentIdStr === '00000000-0000-0000-0000-000000000017' ||
      !byId.has(parentIdStr)
    ) {
      return String(cur.id);
    }
    cur = byId.get(parentIdStr);
  }
  return undefined;
}

/**
 * Dựng cây từ danh sách phẳng (hoặc làm phẳng trước nếu là cây). Có thể tái sử dụng cho Tree, Cascader hoặc
 * các component khác cần cùng một cấu trúc đơn vị.
 */
export function buildOrgUnitTreeData(
  options: readonly OrgUnitTreeOption[] = [],
): OrgUnitTreeNode[] {
  const flatOptions = flattenOrgUnits(options);
  // Ẩn đơn vị gốc G17 (Bộ GTVT) nếu có — G17 chỉ dùng làm container phân quyền ngầm cho admin
  const safeOptions = flatOptions.filter(
    (o) => o && o.code !== 'G17' && String(o.id).toLowerCase() !== '00000000-0000-0000-0000-000000000017',
  );
  const nodes = new Map<string, OrgUnitTreeNode>();

  safeOptions.forEach((option) => {
    if (!option || option.id === undefined || option.id === null) return;
    const strId = String(option.id);
    const title = option.code ? `${option.code} - ${option.name}` : option.name || strId;
    nodes.set(strId, {
      key: strId,
      value: strId,
      title,
      label: title,
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
