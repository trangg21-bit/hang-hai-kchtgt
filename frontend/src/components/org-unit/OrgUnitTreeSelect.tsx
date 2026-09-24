import { useCallback, useEffect, useMemo, useState } from 'react';
import { TreeSelect } from 'antd';
import type { TreeSelectProps } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { useThemeToken } from '../../context/ThemeTokenContext';
import { organizationService } from '../../services/organizationService';
import { useAuthStore } from '../../store/authStore';
import { isMinistryLevelUser } from './useUserDefaultOrgUnit';

import {
  type OrgUnitTreeOption,
  type OrgUnitTreeNode,
  normalizeSearchText,
  buildOrgUnitTreeData,
} from './orgUnitHelpers';

export interface OrgUnitTreeSelectProps
  extends Omit<TreeSelectProps, 'treeData' | 'variant'> {
  organizations?: readonly OrgUnitTreeOption[];
  /** Chế độ sử dụng: 'filter' (màn lọc sidebar/header) hoặc 'form' (màn thêm mới/sửa). */
  variant?: 'filter' | 'form';
  /** Hiển thị đường dẫn đầy đủ (cấp cao nhất → cấp được chọn) trên thanh select. */
  showPath?: boolean;
  /** Hiển thị item đầu tiên “Tất cả” (value = '__all__') cho dropdown filter danh sách. */
  allLabel?: string;
  /** Tên hiển thị dự phòng khi giá trị đã chọn chưa nằm trong cây danh mục (vd: đơn vị Bộ GTVT của tài khoản admin) */
  currentOrgName?: string;
}

/**
 * Select đơn vị dùng chung cho toàn bộ frontend.
 * Hỗ trợ 2 chế độ chuẩn hóa:
 * - variant="filter": placeholder="Tất cả", menu dropdown tối thiểu 380px hiển thị rõ tên đơn vị dài.
 * - variant="form": placeholder="Chọn đơn vị quản lý", menu dropdown co giãn 100% theo ô nhập trong Drawer/Modal.
 * Tự động nạp dữ liệu từ organizationService.getAll() nếu prop organizations không truyền hoặc rỗng.
 */
function OrgUnitTreeSelect(props: OrgUnitTreeSelectProps) {
  const {
    organizations: propOrganizations,
    variant = 'filter',
    style,
    placeholder,
    allowClear,
    showSearch = true,
    treeDefaultExpandAll = false,
    treeLine = false,
    treeNodeFilterProp = 'title',
    showPath = false,
    allLabel,
    dropdownStyle,
    popupMatchSelectWidth,
    listHeight,
    currentOrgName,
    ...restProps
  } = props;

  const {
    filterTreeSelectDropdownStyle,
    formTreeSelectDropdownStyle,
    filterTreeSelectStyle,
    formTreeSelectStyle,
  } = useThemeToken();
  const isForm = variant === 'form';

  const defaultPlaceholder = placeholder !== undefined ? placeholder : isForm ? 'Chọn đơn vị quản lý' : 'Tất cả';
  const defaultAllowClear = allowClear !== undefined ? allowClear : true;
  const defaultListHeight = listHeight !== undefined ? listHeight : isForm ? 300 : 256;
  const defaultMatchWidth = popupMatchSelectWidth !== undefined ? popupMatchSelectWidth : (isForm ? true : false);
  const defaultExpandAll = treeDefaultExpandAll !== undefined ? treeDefaultExpandAll : false;
  const baseDropdownStyle = isForm ? formTreeSelectDropdownStyle : filterTreeSelectDropdownStyle;
  const baseControlStyle = isForm ? formTreeSelectStyle : filterTreeSelectStyle;
  const currentUser = useAuthStore((state) => state.user);

  // Tự động nạp danh mục đơn vị qua cache nếu không được truyền từ props
  const [internalOrgs, setInternalOrgs] = useState<OrgUnitTreeOption[]>([]);

  useEffect(() => {
    if (propOrganizations !== undefined) return;
    let cancelled = false;
    organizationService.getAll()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setInternalOrgs(
          list.map((o) => ({
            id: String(o.id),
            name: o.name,
            code: o.code,
            parentId: o.parentId ? String(o.parentId) : undefined,
          }))
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [propOrganizations]);

  const effectiveOrganizations = useMemo(() => {
    if (propOrganizations && propOrganizations.length > 0) {
      return propOrganizations;
    }
    return internalOrgs;
  }, [propOrganizations, internalOrgs]);

  // Form không bao giờ có “Tất cả”. Với filter danh sách, chỉ tài khoản thuộc
  // đơn vị gốc G17 (đang ẩn khỏi cây) mới có thể chọn phạm vi toàn bộ dữ liệu.
  const effectiveAllLabel = !isForm && allLabel && isMinistryLevelUser(currentUser, effectiveOrganizations)
    ? allLabel
    : undefined;

  const treeData = useMemo(() => {
    const list = Array.isArray(effectiveOrganizations) ? effectiveOrganizations : [];
    const built = buildOrgUnitTreeData(list);
    let base = effectiveAllLabel
      ? [{ key: '__all__', value: '__all__', title: effectiveAllLabel, label: effectiveAllLabel }, ...built]
      : built;

    const byId = new Map<string, OrgUnitTreeOption>(list.map((o) => [String(o.id), o]));

    const currentValue = restProps.value ? String(restProps.value) : undefined;
    const findNode = (nodes: OrgUnitTreeNode[], val: string): boolean => {
      for (const n of nodes) {
        if (n.value === val) return true;
        if (n.children && findNode(n.children, val)) return true;
      }
      return false;
    };

    if (currentValue && currentValue !== '__all__' && !findNode(base, currentValue)) {
      const isMinistryVal =
        currentValue === '00000000-0000-0000-0000-000000000017' ||
        currentValue === 'G17' ||
        currentValue.toLowerCase().includes('bộ giao thông');
      if (isMinistryVal) {
        // Tuyệt đối không bao giờ chèn node Bộ Giao thông Vận tải vào cây đơn vị
        return base;
      }
      const org = byId.get(currentValue);
      const title = org
        ? (org.name || (org.code ? `${org.code} - ${org.name}` : org.name))
        : (currentOrgName || 'Đơn vị quản lý');
      base = [
        {
          key: currentValue,
          value: currentValue,
          title,
          label: org?.name || title,
        },
        ...base,
      ];
    }

    if (!showPath) return base;

    // Gắn label = đường dẫn đầy đủ (cấp cao nhất → cấp được chọn) cho từng node.
    // title giữ tên ngắn cho dropdown; label chỉ dùng để hiển thị trên thanh select.
    const pathOf = (o: OrgUnitTreeOption): string => {
      const parts: string[] = [];
      let cur: OrgUnitTreeOption | undefined = o;
      let guard = 0;
      while (cur && guard++ < 30) {
        parts.unshift(cur.name);
        cur = cur.parentId ? byId.get(String(cur.parentId)) : undefined;
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
  }, [effectiveOrganizations, showPath, effectiveAllLabel, restProps.value, currentOrgName]);

  const internalValue = useMemo(() => {
    const raw = restProps.value;
    const isMinistryVal =
      raw === '00000000-0000-0000-0000-000000000017' ||
      raw === 'G17' ||
      (typeof raw === 'string' && raw.toLowerCase().includes('bộ giao thông'));

    if (isForm) {
      if (isMinistryVal) {
        return undefined;
      }
      return raw;
    }
    if (raw === undefined || raw === null || raw === '' || raw === '__all__' || isMinistryVal) {
      return effectiveAllLabel ? '__all__' : undefined;
    }
    return String(raw);
  }, [isForm, restProps.value, effectiveAllLabel]);

  const handleChange = useCallback<NonNullable<TreeSelectProps['onChange']>>((val, labelList, extra) => {
    const normalizedVal = (val === '__all__' || val === '') ? undefined : val;
    restProps.onChange?.(normalizedVal, labelList, extra);
  }, [restProps]);

  return (
    <TreeSelect
      {...restProps}
      value={internalValue}
      onChange={handleChange}
      virtual={false}
      placeholder={!isForm && !effectiveAllLabel && (placeholder === undefined || placeholder === 'Tất cả')
        ? 'Chọn đơn vị quản lý'
        : defaultPlaceholder}
      allowClear={isForm ? defaultAllowClear : (defaultAllowClear && internalValue !== '__all__')}
      treeData={treeData}
      showSearch={showSearch}
      treeDefaultExpandAll={defaultExpandAll}

      treeLine={treeLine}
      treeNodeFilterProp={treeNodeFilterProp}
      treeNodeLabelProp={showPath ? 'label' : undefined}
      filterTreeNode={(input, node) => normalizeSearchText(node?.title).includes(normalizeSearchText(input))}
      listHeight={defaultListHeight}
      popupMatchSelectWidth={defaultMatchWidth}
      styles={{
        ...(typeof restProps.styles === 'object' ? restProps.styles : undefined),
        popup: {
          ...(typeof restProps.styles === 'object' ? restProps.styles.popup : undefined),
          root: {
            ...baseDropdownStyle,
            ...dropdownStyle,
            ...(typeof restProps.styles === 'object' ? restProps.styles.popup?.root : undefined),
          },
        },
      }}
      switcherIcon={(nodeProps: { isLeaf?: boolean; expanded?: boolean }) => {
        if (nodeProps.isLeaf) return null;
        return nodeProps.expanded ? (
          <DownOutlined style={{ fontSize: 10, color: '#7e8299' }} />
        ) : (
          <RightOutlined style={{ fontSize: 10, color: '#7e8299' }} />
        );
      }}
      style={{ ...baseControlStyle, ...style }}
    />
  );
}

export default OrgUnitTreeSelect;

/** Component Dropdown đơn vị chuẩn hóa dành riêng cho Thanh Lọc Sidebar / Header */
export function FilterOrgUnitTreeSelect(props: Omit<OrgUnitTreeSelectProps, 'variant'>) {
  const { allLabel = 'Tất cả', ...filterProps } = props;
  return <OrgUnitTreeSelect variant="filter" allLabel={allLabel} {...filterProps} />;
}

/** Component Dropdown đơn vị chuẩn hóa dành riêng cho Form Thêm mới / Chỉnh sửa (Drawer / Modal) */
export function FormOrgUnitTreeSelect(props: Omit<OrgUnitTreeSelectProps, 'variant'>) {
  return <OrgUnitTreeSelect variant="form" {...props} />;
}
