import { useMemo } from 'react';
import { TreeSelect } from 'antd';
import type { TreeSelectProps } from 'antd';
import { MinusSquareOutlined, PlusSquareOutlined } from '@ant-design/icons';
import { actionPrimary, radiusPill } from '../../tokens';

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
 * Dựng cây từ danh sách phẳng. Có thể tái sử dụng cho Tree, Cascader hoặc
 * các component khác cần cùng một cấu trúc đơn vị.
 */
export function buildOrgUnitTreeData(options: readonly OrgUnitTreeOption[]): OrgUnitTreeNode[] {
  const nodes = new Map<string, OrgUnitTreeNode>();

  options.forEach((option) => {
    nodes.set(option.id, {
      key: option.id,
      value: option.id,
      title: option.code ? `${option.code} - ${option.name}` : option.name,
      children: [],
    });
  });

  const roots: OrgUnitTreeNode[] = [];
  options.forEach((option) => {
    const node = nodes.get(option.id);
    const parent = option.parentId ? nodes.get(option.parentId) : undefined;
    if (!node) return;

    if (parent) {
      (parent.children ||= []).push(node);
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
  organizations: readonly OrgUnitTreeOption[];
}

/**
 * Select đơn vị dùng chung cho toàn bộ frontend.
 * Các màn hình chỉ cần truyền danh sách đơn vị và dùng value trả về làm orgUnitId.
 */
export default function OrgUnitTreeSelect({
  organizations,
  style,
  showSearch = true,
  treeDefaultExpandAll = true,
  treeLine = true,
  treeNodeFilterProp = 'title',
  ...props
}: OrgUnitTreeSelectProps) {
  const treeData = useMemo(() => buildOrgUnitTreeData(organizations), [organizations]);

  return (
    <TreeSelect
      {...props}
      showSearch={showSearch}
      treeDefaultExpandAll={treeDefaultExpandAll}
      treeLine={treeLine}
      treeNodeFilterProp={treeNodeFilterProp}
      filterTreeNode={(input, node) => normalizeSearchText(node?.title).includes(normalizeSearchText(input))}
      treeData={treeData}
      switcherIcon={(nodeProps) => {
        if (nodeProps.isLeaf) return null;
        const Icon = nodeProps.expanded ? MinusSquareOutlined : PlusSquareOutlined;
        return <Icon style={{ color: actionPrimary }} />;
      }}
      style={{ width: '100%', height: 40, borderRadius: radiusPill, ...style }}
    />
  );
}
