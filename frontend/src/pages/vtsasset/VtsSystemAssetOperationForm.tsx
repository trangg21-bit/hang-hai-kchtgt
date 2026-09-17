import { AuditOutlined, RocketOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';
import {
  createAssetAdjustmentFooterActions,
  createAssetAdjustmentOperationSection,
  handleAssetAdjustmentValuesChange,
} from '../../components/shared/asset-value';
import type { FormSectionConfig } from '../../components/shared/dynamic-form-sidebar';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSidebarAction,
  type FormTabConfig,
} from '../../components/shared/dynamic-form-sidebar';
import {
  ASSET_QUANTITY_UNIT_OPTIONS,
  DECREASE_REASON_OPTIONS,
  DISPOSAL_METHOD_OPTIONS,
  INCREASE_REASON_OPTIONS,
} from '../../constants/assetDropdown';
import type { Organization } from '../../services/organizationService';
import type { VtsSystemAsset } from '../../services/vtsasset/types';
import { fmtInputNumber } from '../../utils/numFmt';

export type OperationMode = 'exploit' | 'increase' | 'decrease';

export interface OperationValues extends Record<string, unknown> {
  operatorOrgUnitId?: string;
  unitOfMeasure?: string;
  quantity?: number;
  exploitationDeadline?: Dayjs;
  totalRevenue?: number;
  relatedCosts?: number;
  stateBudgetPayment?: number;
  projectAmount?: number;
  notes?: string;
  decisionNumber?: string;
  decisionDate?: Dayjs;
  adjustmentDate?: Dayjs;
  adjustmentReason?: string;
  originalValueBefore?: number;
  originalValue?: number;
  remainingValueBefore?: number;
  remainingValue?: number;
  declarationDate?: Dayjs;
  depreciationRate?: number;
  assignmentDecisionNumber?: string;
  depreciationStartDate?: Dayjs;
  depreciationMonths?: number;
  depreciationEndDate?: Dayjs;
  accumulatedDepreciation?: number;
  monthlyDepreciation?: number;
  disposalMethod?: string;
}

export interface VtsSystemAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: VtsSystemAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  saveAction?: string;
  onClose: () => void;
  onSubmit: (targetAction?: any) => Promise<void> | void;
}

export default function VtsSystemAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  saveAction,
  onClose,
  onSubmit,
}: VtsSystemAssetOperationFormProps) {
  const title = useMemo(() => {
    if (!operationMode || !selected) return '';
    const actionText =
      operationMode === 'exploit'
        ? 'Khai thác tài sản'
        : operationMode === 'increase'
          ? 'Tăng nguyên giá tài sản'
          : 'Giảm nguyên giá tài sản';
    return `${actionText} — ${selected.assetName || ''}`;
  }, [operationMode, selected]);

  const sections = useMemo<FormSectionConfig<OperationValues>[]>(() => {
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
              name: 'assetCategory' as keyof OperationValues,
              label: 'Danh mục tài sản',
              type: FormFieldType.Readonly,
              initialValue: [selected.assetCode, selected.assetName].filter(Boolean).join(' - '),
              valueFormatter: () =>
                [selected.assetCode, selected.assetName].filter(Boolean).join(' - ') || '—',
            },
            {
              name: 'unitOfMeasure',
              label: 'Đơn vị tính',
              type: FormFieldType.Select,
              placeholder: 'Chọn đơn vị tính',
              required: true,
              rules: [{ required: true, message: 'Vui lòng chọn đơn vị tính' }],
              options: ASSET_QUANTITY_UNIT_OPTIONS,
            },
            {
              name: 'quantity',
              label: 'Số lượng',
              type: FormFieldType.Number,
              min: 1,
              maxLength: 5,
              required: true,
              rules: [{ required: true, message: 'Vui lòng nhập số lượng' }],
              formatter: fmtInputNumber,
              placeholder: '1',
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
              maxLength: 20,
              required: true,
              rules: [{ required: true, message: 'Vui lòng nhập tổng số tiền thu được' }],
              formatter: fmtInputNumber,
              placeholder: '0',
            },
            {
              name: 'relatedCosts',
              label: 'Chi phí có liên quan (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              maxLength: 20,
              formatter: fmtInputNumber,
              placeholder: '0',
            },
            {
              name: 'stateBudgetPayment',
              label: 'Nộp NSNN (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              maxLength: 20,
              formatter: fmtInputNumber,
              placeholder: '0',
            },
            {
              name: 'projectAmount',
              label: 'Số tiền được thực hiện dự án (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              maxLength: 20,
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
      createAssetAdjustmentOperationSection<OperationValues>({
        selectedRecord: selected,
        operationMode,
        extraFields: [
          {
            name: 'disposalMethod',
            label: 'Hình thức xử lý tài sản',
            type: FormFieldType.Select,
            placeholder: 'Chọn hình thức xử lý',
            options: DISPOSAL_METHOD_OPTIONS,
          },
        ],
      }),
    ];
  }, [operationMode, selected, organizations]);

  const tabs = useMemo<FormTabConfig<OperationValues>[]>(() => {
    return [
      {
        key: 'main',
        label: 'Thông tin thực hiện',
        sections,
      },
    ];
  }, [sections]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    return createAssetAdjustmentFooterActions({
      operationMode,
      saving,
      saveAction,
      onClose,
      onSubmit,
      exploitSubmitLabel: 'Xác nhận lưu',
    });
  }, [operationMode, saving, saveAction, onClose, onSubmit]);

  return (
    <DynamicFormSidebar
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      tabs={tabs}
      footerActions={footerActions}
      footerAlign="center"
      onValuesChange={(changed, all) => {
        handleAssetAdjustmentValuesChange(form, changed, all);
      }}
    />
  );
}
