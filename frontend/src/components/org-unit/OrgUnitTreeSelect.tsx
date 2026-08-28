import { useMemo } from 'react';
import { TreeSelect } from 'antd';
import type { TreeSelectProps } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { useThemeToken } from '../../context/ThemeTokenContext';

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
export function resolveOrgLevel2Name(orgUnits: readonly OrgUnitTreeOption[] = [], orgUnitId?: string | null): string | undefined {
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
export function resolveOrgTailPath(orgUnits: readonly OrgUnitTreeOption[] = [], orgUnitId?: string | null): string | undefined {
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
export function resolveOrgFullPath(orgUnits: readonly OrgUnitTreeOption[] = [], orgUnitId?: string | null): string[] | undefined {
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
export function resolveOrgSubtreeIds(orgUnits: readonly OrgUnitTreeOption[] = [], rootOrgUnitId?: string | null): Set<string> {
  const result = new Set<string>();
  if (!rootOrgUnitId || !Array.isArray(orgUnits)) return result;
  result.add(rootOrgUnitId);
  const queue = [rootOrgUnitId];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    for (const org of orgUnits) {
      if (org.parentId === parentId && !result.has(org.id)) {
        result.add(org.id);
        queue.push(org.id);
      }
    }
  }
  return result;
}

/**
 * Dựng cây từ danh sách phẳng. Có thể tái sử dụng cho Tree, Cascader hoặc
 * các component khác cần cùng một cấu trúc đơn vị.
 */
export function buildOrgUnitTreeData(options: readonly OrgUnitTreeOption[] = []): OrgUnitTreeNode[] {
  const safeOptions = Array.isArray(options) ? options : [];
  const nodes = new Map<string, OrgUnitTreeNode>();

  safeOptions.forEach((option) => {
    nodes.set(option.id, {
      key: option.id,
      value: option.id,
      title: option.code ? `${option.code} - ${option.name}` : option.name,
      children: [],
    });
  });

  const roots: OrgUnitTreeNode[] = [];
  safeOptions.forEach((option) => {
    const node = nodes.get(option.id);
    const parent = option.parentId ? nodes.get(option.parentId) : undefined;
    if (!node) return;

    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const removeEmptyChildren = (items: OrgUnitTreeNode[]): OrgUnitTreeNode[] =>
    items.map((item) => {
      if (!item.children?.length) {
        const { children: _children, ...leaf } = item;
        return leaf;
      }
      return { ...item, children: removeEmptyChildren(item.children) };
    });

  return removeEmptyChildren(roots);
}

export interface OrgUnitTreeSelectProps
  extends Omit<TreeSelectProps, 'treeData'> {
  organizations?: readonly OrgUnitTreeOption[];
  /** Hiển thị đường dẫn đầy đủ (cấp cao nhất → cấp được chọn) trên thanh select. */
  showPath?: boolean;
  /** Hiển thị item đầu tiên "Tất cả" (value = '__all__') cùng cấp với cấp ngoài cùng — dùng cho bộ lọc. */
  allLabel?: string;
}

/**
 * Select đơn vị dùng chung cho toàn bộ frontend.
 * Các màn hình chỉ cần truyền danh sách đơn vị và dùng value trả về làm orgUnitId.
 */
export default function OrgUnitTreeSelect({
  organizations = [],
  style,
  showSearch = true,
  treeDefaultExpandAll = true,
  treeLine = false,
  treeNodeFilterProp = 'title',
  showPath = false,
  allLabel,
  dropdownStyle,
  popupMatchSelectWidth = false,
  listHeight = 300,
  ...props
}: OrgUnitTreeSelectProps) {
  const { radiusPill, controlHeight, radiusMd } = useThemeToken();
  const treeData = useMemo(() => {
    const list = Array.isArray(organizations) ? organizations : [];
    const built = buildOrgUnitTreeData(list);
    const base = allLabel
      ? [{ key: '__all__', value: '__all__', title: allLabel }, ...built]
      : built;
    if (!showPath) return base;

    // Gắn label = đường dẫn đầy đủ (cấp cao nhất → cấp được chọn) cho từng node.
    // title giữ tên ngắn cho dropdown; label chỉ dùng để hiển thị trên thanh select.
    const byId = new Map<string, OrgUnitTreeOption>(list.map((o) => [o.id, o]));
    const pathOf = (o: OrgUnitTreeOption): string => {
      const parts: string[] = [];
      let cur: OrgUnitTreeOption | undefined = o;
      let guard = 0;
      while (cur && guard++ < 30) {
        parts.unshift(cur.name);
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
      return parts.join(' / ');
    };
    const annotate = (nodes: OrgUnitTreeNode[]): OrgUnitTreeNode[] =>
      nodes.map((node) => {
        const org = byId.get(node.value);
        return {
          ...node,
          label: org ? pathOf(org) : node.title,
          children: node.children ? annotate(node.children) : undefined,
        };
      });
    return annotate(base);
  }, [organizations, showPath, allLabel]);

  return (
    <TreeSelect
      {...props}
      treeData={treeData}
      showSearch={showSearch}
      treeDefaultExpandAll={treeDefaultExpandAll}
      treeLine={treeLine}
      treeNodeFilterProp={treeNodeFilterProp}
      treeNodeLabelProp={showPath ? 'label' : undefined}
      filterTreeNode={(input, node) => normalizeSearchText(node?.title).includes(normalizeSearchText(input))}
      listHeight={listHeight}
      popupMatchSelectWidth={popupMatchSelectWidth}
      dropdownStyle={{
        minWidth: 380,
        maxWidth: 520,
        maxHeight: 320,
        borderRadius: radiusMd || 10,
        padding: '6px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        ...dropdownStyle,
      }}
      switcherIcon={(nodeProps: any) => {
        if (nodeProps.isLeaf) return null;
        return <DownOutlined style={{ fontSize: 10, color: '#7e8299' }} />;
      }}
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        height: controlHeight,
        borderRadius: radiusPill,
        ...style,
      }}
    />
  );
}
