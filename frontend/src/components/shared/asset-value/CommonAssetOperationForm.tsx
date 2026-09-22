import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined } from '@ant-design/icons';
import type { Organization } from '../../../services/organizationService';
import { fmtInputNumber } from '../../../utils/numFmt';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSectionConfig,
  type FormTabConfig,
  type FormSidebarAction,
} from '../dynamic-form-sidebar';
import {
  createAssetAdjustmentFooterActions,
  createAssetAdjustmentOperationSection,
} from './assetValueFormFields';

import {
  ASSET_QUANTITY_UNIT_OPTIONS,
  INCREASE_REASON_OPTIONS,
  DECREASE_REASON_OPTIONS,
} from '../../../constants/assetDropdown';


export type OperationMode = 'exploit' | 'increase' | 'decrease';

export interface CommonOperationValues {
  [key: string]: unknown;
  // Exploit fields
  operatorOrgUnitId?: string;
  assetCategory?: string;
  unitOfMeasure?: string;
  quantity?: number;
  exploitationDeadline?: Dayjs;
  totalRevenue?: number;
  relatedCosts?: number;
  stateBudgetPayment?: number;
  projectAmount?: number;

  // Decision & adjustment fields
  decisionNumber?: string;
  decisionDate?: Dayjs;
  adjustmentDate?: Dayjs;
  adjustmentReason?: string;

  // Values & depreciation
  originalValueBefore?: number;
  originalValue?: number;
  remainingValueBefore?: number;
  remainingValueAfter?: number;
  declarationDate?: Dayjs;
  depreciationRate?: number;
  assignmentDecisionNumber?: string;
  depreciationStartDate?: Dayjs;
  depreciationMonths?: number;
  depreciationEndDate?: Dayjs;
  accumulatedDepreciation?: number;
  monthlyDepreciation?: number;
  notes?: string;
}

export interface CommonAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: {
    id: string;
    assetName?: string;
    assetCode?: string;
    originalValue?: number | null;
    remainingValue?: number | null;
  } | null;
  organizations: Organization[];
  form: FormInstance<CommonOperationValues>;
  saving: boolean;
  saveAction?: string;
  drawerClassName?: string;
  onClose: () => void;
  onSubmit: (targetAction?: 'PENDING_APPROVAL' | 'APPROVED') => Promise<void> | void;
}

export function CommonAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  saveAction,
  drawerClassName = 'berth-drawer-scope',
  onClose,
  onSubmit,
}: CommonAssetOperationFormProps) {
  const title = useMemo(() => {
    if (!operationMode || !selected) return '';
    const actionText =
      operationMode === 'exploit'
        ? 'Khai thác tài sản'
        : operationMode === 'increase'
          ? 'Tăng nguyên giá tài sản'
          : 'Giảm nguyên giá tài sản';
    return `${actionText} — ${selected.assetName || selected.assetCode || ''}`;
  }, [operationMode, selected]);

  const sections = useMemo<FormSectionConfig<CommonOperationValues>[]>(() => {
    if (!operationMode || !selected) return [];

    if (operationMode === 'exploit') {
      return [
        {
          key: 'exploit_section',
          title: 'Thông tin khai thác tài sản',
          icon: <RocketOutlined />,
          fields: [
            {
              name: 'operatorOrgUnitId',
              label: 'Đơn vị khai thác',
              type: FormFieldType.TreeSelect,
              organizations,
              required: true,
              rules: [{ required: true, message: 'Đơn vị khai thác là bắt buộc' }],
            },
            {
              name: 'assetCategory',
              label: 'Danh mục tài sản',
              type: FormFieldType.Readonly,
              initialValue: [selected.assetCode, selected.assetName].filter(Boolean).join(' - '),
              valueFormatter: () =>
                [selected.assetCode, selected.assetName].filter(Boolean).join(' - ') || '',
            },
            {
              name: 'unitOfMeasure',
              label: 'Đơn vị tính',
              type: FormFieldType.Select,
              required: true,
              placeholder: 'Chọn đơn vị tính',
              options: ASSET_QUANTITY_UNIT_OPTIONS,
              rules: [{ required: true, message: 'Đơn vị tính là bắt buộc' }],
            },
            {
              name: 'quantity',
              label: 'Số lượng',
              type: FormFieldType.Number,
              min: 1,
              required: true,
              formatter: fmtInputNumber,
              placeholder: '1',
              rules: [{ required: true, message: 'Số lượng là bắt buộc' }],
            },
            {
              name: 'exploitationDeadline',
              label: 'Thời hạn khai thác',
              type: FormFieldType.Date,
              required: true,
              placeholder: 'Chọn thời hạn',
              rules: [{ required: true, message: 'Thời hạn khai thác là bắt buộc' }],
            },
            {
              name: 'totalRevenue',
              label: 'Tổng số tiền thu được (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              required: true,
              formatter: fmtInputNumber,
              placeholder: '0',
              rules: [{ required: true, message: 'Tổng số tiền thu được là bắt buộc' }],
            },
            {
              name: 'relatedCosts',
              label: 'Chi phí có liên quan (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              formatter: fmtInputNumber,
              placeholder: '0',
            },
            {
              name: 'stateBudgetPayment',
              label: 'Nộp NSNN (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              formatter: fmtInputNumber,
              placeholder: '0',
            },
            {
              name: 'projectAmount',
              label: 'Số tiền được thực hiện dự án (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              formatter: fmtInputNumber,
              placeholder: '0',
              colSpan: 24,
            },
            {
              name: 'notes',
              label: 'Ghi chú',
              type: FormFieldType.TextArea,
              rows: 3,
              placeholder: 'Nhập ghi chú',
              colSpan: 24,
            },
          ],
        },
      ];
    }

    const isIncrease = operationMode === 'increase';
    const actionLabel = isIncrease ? 'tăng' : 'giảm';
    const reasonOptions = isIncrease ? INCREASE_REASON_OPTIONS : DECREASE_REASON_OPTIONS;

    return [
      {
        key: 'decision_section',
        title: `Quyết định điều chỉnh & Lý do ${actionLabel}`,
        icon: <AuditOutlined />,
        fields: [
          {
            name: 'decisionNumber',
            label: `Số QĐ ${actionLabel} nguyên giá`,
            type: FormFieldType.Text,
            required: true,
            placeholder: 'Nhập số quyết định',
            rules: [{ required: true, message: 'Số quyết định là bắt buộc' }],
          },
          {
            name: 'decisionDate',
            label: `Ngày ra QĐ ${actionLabel}`,
            type: FormFieldType.Date,
            required: true,
            placeholder: 'Chọn ngày ra QĐ',
            rules: [{ required: true, message: 'Ngày ra quyết định là bắt buộc' }],
          },
          {
            name: 'adjustmentDate',
            label: `Ngày ${actionLabel} nguyên giá`,
            type: FormFieldType.Date,
            required: true,
            placeholder: 'Chọn ngày thay đổi',
            rules: [{ required: true, message: 'Ngày thay đổi là bắt buộc' }],
          },
          {
            name: 'adjustmentReason',
            label: `Lý do ${actionLabel}`,
            type: FormFieldType.Select,
            required: true,
            placeholder: 'Chọn lý do',
            options: reasonOptions,
            rules: [{ required: true, message: 'Lý do là bắt buộc' }],
          },
        ],
      },
      createAssetAdjustmentOperationSection<CommonOperationValues>({
        selectedRecord: selected,
        operationMode,
      }),
    ];
  }, [operationMode, selected, organizations]);

  const tabs = useMemo<FormTabConfig<CommonOperationValues>[]>(() => {
    if (!sections || sections.length === 0) return [];
    const tabIcon =
      operationMode === 'exploit' ? <RocketOutlined /> : <AuditOutlined />;
    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        icon: tabIcon,
        sections,
      },
    ];
  }, [operationMode, sections]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    return createAssetAdjustmentFooterActions({
      operationMode,
      saving,
      saveAction,
      onSubmit,
      onClose,
    });
  }, [operationMode, saving, saveAction, onSubmit, onClose]);

  if (!open || !operationMode || !selected) {
    return null;
  }

  return (
    <DynamicFormSidebar<CommonOperationValues>
      open={open}
      title={title}
      form={form}
      tabs={tabs}
      footerActions={footerActions}
      loading={saving}
      onClose={onClose}
      rootClassName={drawerClassName}
      className={drawerClassName}
      destroyOnHidden
    />
  );
}

export default CommonAssetOperationForm;
