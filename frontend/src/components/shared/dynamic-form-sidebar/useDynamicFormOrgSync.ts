import type { FormInstance } from 'antd/es/form';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { organizationService } from '../../../services/organizationService';
import {
  findRootOrgUnitId,
  resolveOrgSubtreeIds,
  type OrgUnitTreeOption,
} from '../../org-unit';
import {
  FormFieldType,
  type DynamicCascadingHelper,
  type FormFieldConfig,
  type FormSectionConfig,
  type FormTabConfig,
} from './dynamic-form-sidebar.model';
import { useDynamicOrgUnitCascading } from './DynamicOrgUnitTreeSelect';

/**
 * Chuẩn hóa tabs, sections, hoặc fields thành danh sách FormTabConfig thống nhất.
 */
export function resolveEffectiveTabs<T extends Record<string, unknown> = Record<string, unknown>>(
  tabs?: FormTabConfig<T>[],
  sections?: FormSectionConfig<T>[],
  fields?: FormFieldConfig<T>[],
): FormTabConfig<T>[] | undefined {
  if (tabs && tabs.length > 0) return tabs;
  if (sections && sections.length > 0) {
    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections,
      },
    ];
  }
  if (fields && fields.length > 0) {
    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        fields,
      },
    ];
  }
  return undefined;
}

export interface UseDynamicFormOrgSyncOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Trạng thái mở của form/drawer */
  open?: boolean;
  /** Ant Design Form instance */
  form: FormInstance<T>;
  /** Giá trị hiện tại của form (thường lấy từ Form.useWatch) */
  formValues?: T;
  /** Danh sách tabs đã chuẩn hóa để quét organizations hoặc reset trường liên quan */
  effectiveTabs?: FormTabConfig<T>[];
  /** Callback onValuesChange gốc của component cha */
  onValuesChange?: (changedValues: Partial<T>, allValues: T) => void;
}

export interface UseDynamicFormOrgSyncResult<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Toàn bộ danh sách đơn vị tải về hoặc trích xuất từ schema */
  allOrganizations: readonly OrgUnitTreeOption[];
  /** Helper phân cấp (cha -> đơn vị quản lý -> đơn vị sử dụng) */
  cascadingHelper: DynamicCascadingHelper;
  /** Callback xử lý khi giá trị trong form thay đổi */
  handleValuesChange: (changedValues: Partial<T>, allValues: T) => void;
}

/**
 * Hook quản lý nạp danh mục đơn vị, đồng bộ phân cấp cha - con - sử dụng,
 * tự động điền cơ quan quản lý cấp trên khi chỉnh sửa, và reset các trường phụ thuộc.
 */
export function useDynamicFormOrgSync<T extends Record<string, unknown> = Record<string, unknown>>({
  open,
  form,
  formValues,
  effectiveTabs,
  onValuesChange,
}: UseDynamicFormOrgSyncOptions<T>): UseDynamicFormOrgSyncResult {
  const [, setTick] = useState(0);
  const [internalLoadedOrgs, setInternalLoadedOrgs] = useState<readonly OrgUnitTreeOption[]>([]);

  // Nạp hoặc trích xuất danh sách tổ chức đầy đủ từ cấu hình trường
  const allOrganizations = useMemo<readonly OrgUnitTreeOption[]>(() => {
    if (effectiveTabs) {
      for (const tab of effectiveTabs) {
        if (tab.fields) {
          for (const f of tab.fields) {
            if (f.organizations && f.organizations.length > 0) return f.organizations;
          }
        }
        if (tab.sections) {
          for (const s of tab.sections) {
            for (const f of s.fields) {
              if (f.organizations && f.organizations.length > 0) return f.organizations;
            }
          }
        }
      }
    }
    return internalLoadedOrgs;
  }, [effectiveTabs, internalLoadedOrgs]);

  useEffect(() => {
    if (allOrganizations.length === 0) {
      let cancelled = false;
      organizationService
        .getAll()
        .then((data) => {
          if (!cancelled && Array.isArray(data) && data.length > 0) {
            setInternalLoadedOrgs(data);
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [allOrganizations.length]);

  const selectedParentOrgId = formValues?.['parentOrgUnitId']
    ? String(formValues['parentOrgUnitId'])
    : form.getFieldValue('parentOrgUnitId' as never)
      ? String(form.getFieldValue('parentOrgUnitId' as never))
      : undefined;

  const selectedOrgUnitId = formValues?.['orgUnitId']
    ? String(formValues['orgUnitId'])
    : form.getFieldValue('orgUnitId' as never)
      ? String(form.getFieldValue('orgUnitId' as never))
      : undefined;

  const cascadingHelper = useDynamicOrgUnitCascading({
    allOrganizations,
    selectedParentOrgId,
    selectedOrgUnitId,
  });

  // Tự động tìm root ancestor khi form mở lên ở chế độ Edit có sẵn orgUnitId nhưng thiếu parentOrgUnitId
  useEffect(() => {
    if (open && allOrganizations.length > 0) {
      const curOrg = form.getFieldValue('orgUnitId' as never);
      const curParent = form.getFieldValue('parentOrgUnitId' as never);
      if (curOrg && !curParent) {
        const rootId = findRootOrgUnitId(allOrganizations, String(curOrg));
        if (rootId) {
          form.setFieldValue('parentOrgUnitId' as never, rootId);
        }
      }
    }
  }, [open, allOrganizations, form]);

  const resetRelatedSelectFields = useCallback(
    (targetOrgId?: string) => {
      if (!effectiveTabs) return;
      const allowedOrgIds = targetOrgId ? resolveOrgSubtreeIds(allOrganizations, targetOrgId) : null;

      const checkField = (f: FormFieldConfig<T>) => {
        if (f.type === FormFieldType.Select && f.options && f.options.length > 0) {
          const hasOrg = f.options.some((opt) => (opt as { orgUnitId?: unknown }).orgUnitId != null);
          if (hasOrg) {
            const curVal = form.getFieldValue(f.name as never);
            if (curVal) {
              const found = f.options.find((opt) => opt.value === curVal) as { orgUnitId?: unknown } | undefined;
              if (found && found.orgUnitId != null) {
                const itemOrg = String(found.orgUnitId);
                if (!allowedOrgIds || (!allowedOrgIds.has(itemOrg) && itemOrg !== String(targetOrgId))) {
                  form.setFieldValue(f.name as never, undefined);
                }
              }
            }
          }
        }
      };

      effectiveTabs.forEach((t) => {
        t.fields?.forEach(checkField);
        t.sections?.forEach((s) => s.fields?.forEach(checkField));
      });
    },
    [effectiveTabs, allOrganizations, form],
  );

  const handleValuesChange = useCallback(
    (changedValues: Partial<T>, allValues: T) => {
      const changedRecord = changedValues as Record<string, unknown>;

      if ('parentOrgUnitId' in changedRecord || 'orgUnitId' in changedRecord) {
        setTick((prev) => prev + 1);
      }

      if ('parentOrgUnitId' in changedRecord) {
        const newParentId = changedRecord.parentOrgUnitId;
        if (newParentId) {
          const allowedOrgIds = resolveOrgSubtreeIds(allOrganizations, String(newParentId));
          const curOrg = form.getFieldValue('orgUnitId' as never);
          if (curOrg && !allowedOrgIds.has(String(curOrg))) {
            form.setFieldValue('orgUnitId' as never, undefined);
            form.setFieldValue('usingOrgUnitId' as never, undefined);
            resetRelatedSelectFields();
          }
        } else {
          form.setFieldValue('orgUnitId' as never, undefined);
          form.setFieldValue('usingOrgUnitId' as never, undefined);
          resetRelatedSelectFields();
        }
      }

      if ('orgUnitId' in changedRecord) {
        const newOrgUnitId = changedRecord.orgUnitId;
        if (newOrgUnitId) {
          const curParent = form.getFieldValue('parentOrgUnitId' as never);
          const rootId = findRootOrgUnitId(allOrganizations, String(newOrgUnitId));
          if (
            rootId &&
            (!curParent || !resolveOrgSubtreeIds(allOrganizations, String(curParent)).has(String(newOrgUnitId)))
          ) {
            form.setFieldValue('parentOrgUnitId' as never, rootId);
          }

          const curUsing = form.getFieldValue('usingOrgUnitId' as never);
          const allowedUsing = resolveOrgSubtreeIds(allOrganizations, String(newOrgUnitId));
          if (!curUsing || !allowedUsing.has(String(curUsing))) {
            form.setFieldValue('usingOrgUnitId' as never, newOrgUnitId);
          }

          resetRelatedSelectFields(String(newOrgUnitId));
        } else {
          form.setFieldValue('usingOrgUnitId' as never, undefined);
          resetRelatedSelectFields();
        }
      }

      if (onValuesChange) {
        onValuesChange(changedValues, allValues);
      }
    },
    [allOrganizations, form, resetRelatedSelectFields, onValuesChange],
  );

  return {
    allOrganizations,
    cascadingHelper,
    handleValuesChange,
  };
}
