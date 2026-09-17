import { useMemo } from 'react';
import {
  OrgUnitTreeSelect,
  type OrgUnitTreeSelectProps,
  type OrgUnitTreeOption,
  getRootOrgUnits,
  resolveOrgSubtreeIds,
} from '../../org-unit';
import type {
  DynamicCascadingHelper,
  FormFieldConfig,
} from './dynamic-form-sidebar.model';

export interface DynamicOrgUnitTreeSelectProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends Omit<OrgUnitTreeSelectProps, 'variant'> {
  /** Cấu hình field từ DynamicFormSidebar (nếu dùng chung trong DynamicForm) */
  field?: FormFieldConfig<T>;
  /** Tên trường (vd: 'parentOrgUnitId', 'orgUnitId', 'usingOrgUnitId') */
  fieldName?: string;
  /** Bí danh tương thích cho tên trường khi dùng trực tiếp trong Form.Item */
  name?: string | number;
  /** Dữ liệu hỗ trợ phân cấp tổ chức (all, parent, orgUnit, usingOrgUnit) */
  cascadingHelper?: DynamicCascadingHelper;
  /** Nhãn hiển thị để sinh placeholder mặc định */
  labelText?: string;
  /** Chế độ sử dụng: 'form' (mặc định) hoặc 'filter' */
  variant?: 'filter' | 'form';
}

/**
 * Hook hỗ trợ tính toán các danh sách tổ chức phân cấp (cha -> quản lý -> sử dụng).
 */
export function useDynamicOrgUnitCascading({
  allOrganizations = [],
  selectedParentOrgId,
  selectedOrgUnitId,
}: {
  allOrganizations?: readonly OrgUnitTreeOption[];
  selectedParentOrgId?: string;
  selectedOrgUnitId?: string;
}): DynamicCascadingHelper {
  const parentOrgOptions = useMemo(() => {
    const roots = getRootOrgUnits(allOrganizations);
    if (!selectedParentOrgId || roots.some((o) => String(o.id) === selectedParentOrgId)) {
      return roots;
    }
    const current = allOrganizations.find((o) => String(o.id) === selectedParentOrgId);
    return current ? [current, ...roots] : roots;
  }, [allOrganizations, selectedParentOrgId]);

  const orgsForOrgUnit = useMemo(() => {
    if (selectedParentOrgId) {
      const allowed = resolveOrgSubtreeIds(allOrganizations, selectedParentOrgId);
      return allOrganizations.filter((o) => allowed.has(String(o.id)));
    }
    return allOrganizations;
  }, [allOrganizations, selectedParentOrgId]);

  const orgsForUsing = useMemo(() => {
    if (selectedOrgUnitId) {
      const allowed = resolveOrgSubtreeIds(allOrganizations, selectedOrgUnitId);
      return allOrganizations.filter((o) => allowed.has(String(o.id)));
    }
    if (selectedParentOrgId) {
      const allowed = resolveOrgSubtreeIds(allOrganizations, selectedParentOrgId);
      return allOrganizations.filter((o) => allowed.has(String(o.id)));
    }
    return allOrganizations;
  }, [allOrganizations, selectedOrgUnitId, selectedParentOrgId]);

  return useMemo<DynamicCascadingHelper>(
    () => ({
      allOrganizations,
      parentOrgOptions,
      orgsForOrgUnit,
      orgsForUsing,
      selectedOrgUnitId,
    }),
    [allOrganizations, parentOrgOptions, orgsForOrgUnit, orgsForUsing, selectedOrgUnitId],
  );
}

/**
 * Component Dropdown chọn đơn vị có hỗ trợ phân cấp tự động (parentOrgUnitId -> orgUnitId -> usingOrgUnitId).
 * Được tách từ DynamicFormSidebar để tái sử dụng độc lập hoặc dùng trong DynamicFormSidebar.
 */
export function DynamicOrgUnitTreeSelect<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  field,
  fieldName: propFieldName,
  name: propName,
  cascadingHelper,
  labelText,
  variant = 'form',
  showPath = true,
  organizations: propOrganizations,
  placeholder: propPlaceholder,
  disabled: propDisabled,
  style,
  ...restProps
}: DynamicOrgUnitTreeSelectProps<T>) {
  const targetFieldName =
    propFieldName ??
    (propName !== undefined ? String(propName) : undefined) ??
    (field ? String(field.name) : undefined);

  const disabled = propDisabled ?? field?.disabled;
  const rawPlaceholder = propPlaceholder ?? field?.placeholder;

  let effectiveOrgs: readonly OrgUnitTreeOption[] =
    propOrganizations ||
    (field?.organizations as readonly OrgUnitTreeOption[] | undefined) ||
    cascadingHelper?.allOrganizations ||
    [];
  let customPlaceholder = rawPlaceholder;

  if (targetFieldName === 'parentOrgUnitId') {
    if (cascadingHelper?.parentOrgOptions && cascadingHelper.parentOrgOptions.length > 0) {
      effectiveOrgs = cascadingHelper.parentOrgOptions;
    }
    customPlaceholder = rawPlaceholder ?? 'Chọn cơ quan quản lý cấp trên...';
  } else if (targetFieldName === 'orgUnitId') {
    if (cascadingHelper?.orgsForOrgUnit && cascadingHelper.orgsForOrgUnit.length > 0) {
      effectiveOrgs = cascadingHelper.orgsForOrgUnit;
    }
    customPlaceholder = rawPlaceholder ?? 'Chọn đơn vị quản lý...';
  } else if (targetFieldName === 'usingOrgUnitId') {
    if (cascadingHelper?.orgsForUsing && cascadingHelper.orgsForUsing.length > 0) {
      effectiveOrgs = cascadingHelper.orgsForUsing;
    }
    customPlaceholder = rawPlaceholder ?? 'Chọn đơn vị sử dụng...';
  }

  const resolvedPlaceholder =
    customPlaceholder ?? (labelText ? `Chọn ${labelText}...` : 'Chọn đơn vị...');

  const mergedStyle = useMemo(() => {
    if (field?.controlStyle && style) {
      return { ...field.controlStyle, ...style };
    }
    return field?.controlStyle || style;
  }, [field?.controlStyle, style]);

  return (
    <OrgUnitTreeSelect
      organizations={effectiveOrgs}
      variant={variant}
      showPath={showPath}
      disabled={disabled}
      placeholder={resolvedPlaceholder}
      style={mergedStyle}
      {...(field?.treeSelectProps as Record<string, unknown> | undefined)}
      {...restProps}
    />
  );
}

export const CascadingOrgUnitTreeSelect = DynamicOrgUnitTreeSelect;
export default DynamicOrgUnitTreeSelect;
