import { AuditOutlined, RocketOutlined, SlidersOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';
import {
  createAssetAdjustmentFooterActions,
} from '../../components/shared/asset-value';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSectionConfig,
  type FormSidebarAction,
  type FormTabConfig,
} from '../../components/shared/dynamic-form-sidebar';
import type { TransferAreaAsset } from '../../services/assetmovement/types';
import type { Organization } from '../../services/organizationService';
import { fmtInputNumber } from '../../utils/numFmt';

export type OperationMode = 'exploit' | 'increase' | 'decrease';

export interface OperationValues {
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
  originalValue?: number;
  declarationDate?: Dayjs;
  depreciationRate?: number;
  assignmentDecisionNumber?: string;
  depreciationStartDate?: Dayjs;
  depreciationMonths?: number;
  depreciationEndDate?: Dayjs;
  accumulatedDepreciation?: number;
  disposalMethod?: string;
  [key: string]: unknown;
}

import {
  ASSET_QUANTITY_UNIT_OPTIONS,
  DECREASE_REASON_OPTIONS,
  DISPOSAL_METHOD_OPTIONS,
  INCREASE_REASON_OPTIONS,
} from '../../constants/assetDropdown';

export interface TransferAreaAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: TransferAreaAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  saveAction?: string;
  onClose: () => void;
  onSubmit: (targetAction?: any) => void | Promise<void>;
}

export function TransferAreaAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  saveAction,
  onClose,
  onSubmit,
}: TransferAreaAssetOperationFormProps) {
  const sections = useMemo<FormSectionConfig<OperationValues>[]>(() => {
    if (!selected) return [];

    if (operationMode === 'exploit') {
      return [
        {
          key: 'exploit_section',
          title: 'Thông tin khai thác tài sản khu chuyển tải',
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
                [selected.assetCode, selected.assetName].filter(Boolean).join(' - ') || '—',
            },
            {
              name: 'unitOfMeasure',
              label: 'Đơn vị tính',
              type: FormFieldType.Select,
              placeholder: 'Chọn đơn vị tính',
              required: true,
              rules: [{ required: true, message: 'Đơn vị tính là bắt buộc' }],
              options: ASSET_QUANTITY_UNIT_OPTIONS,
            },
            {
              name: 'quantity',
              label: 'Số lượng',
              type: FormFieldType.Number,
              min: 0,
              maxLength: 5,
              required: true,
              formatter: fmtInputNumber,
              placeholder: '0',
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
              maxLength: 20,
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
            placeholder: 'Chọn ngày ra quyết định',
            rules: [{ required: true, message: 'Ngày ra quyết định là bắt buộc' }],
          },
          {
            name: 'adjustmentDate',
            label: `Ngày ${actionLabel} nguyên giá`,
            type: FormFieldType.Date,
            required: true,
            placeholder: `Chọn ngày ${actionLabel}`,
            rules: [{ required: true, message: `Ngày ${actionLabel} là bắt buộc` }],
          },
          {
            name: 'adjustmentReason',
            label: `Lý do ${actionLabel} nguyên giá`,
            type: FormFieldType.Select,
            required: true,
            placeholder: 'Chọn lý do',
            options: isIncrease ? INCREASE_REASON_OPTIONS : DECREASE_REASON_OPTIONS,
            rules: [{ required: true, message: 'Lý do điều chỉnh là bắt buộc' }],
          },
          {
            name: 'notes',
            label: `Ghi chú (${actionLabel})`,
            type: FormFieldType.TextArea,
            rows: 2,
            placeholder: 'Nhập ghi chú điều chỉnh',
            colSpan: 24,
          },
        ],
      },
      {
        key: 'value_section',
        title: `Giá trị & Khấu hao sau khi ${actionLabel}`,
        icon: <SlidersOutlined />,
        fields: [
          {
            name: 'originalValue',
            label: `Nguyên giá sau khi ${actionLabel} (VNĐ)`,
            type: FormFieldType.Number,
            maxLength: 20,
            min: 0,
            required: true,
            formatter: fmtInputNumber,
            placeholder: '0',
            rules: [{ required: true, message: 'Nguyên giá là bắt buộc' }],
          },
          {
            name: 'declarationDate',
            label: 'Ngày kê khai tài sản',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày kê khai',
          },
          {
            name: 'depreciationRate',
            label: 'Tỷ lệ hao mòn/Khấu hao (%)',
            type: FormFieldType.Number,
            maxLength: 5,
            min: 0,
            max: 100,
            formatter: fmtInputNumber,
            placeholder: '0',
          },
          {
            name: 'assignmentDecisionNumber',
            label: 'Số quyết định giao (bao gồm cả tăng vốn)',
            type: FormFieldType.Text,
            placeholder: 'Nhập số quyết định',
          },
          {
            name: 'depreciationStartDate',
            label: 'Ngày tính khấu hao',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày tính',
          },
          {
            name: 'depreciationMonths',
            label: 'Số tháng tính khấu hao',
            type: FormFieldType.Number,
            maxLength: 5,
            min: 0,
            placeholder: '0',
          },
          {
            name: 'depreciationEndDate',
            label: 'Ngày hết khấu hao',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày hết',
          },
          {
            name: 'accumulatedDepreciation',
            label: 'Khấu hao lũy kế (VNĐ)',
            type: FormFieldType.Number,
            maxLength: 20,
            required: true,
            min: 0,
            formatter: fmtInputNumber,
            placeholder: '0',
            rules: [{ required: true, message: 'Khấu hao lũy kế là bắt buộc' }],
          },
          {
            name: 'disposalMethod',
            label: 'Hình thức xử lý tài sản',
            type: FormFieldType.Select,
            required: true,
            placeholder: 'Chọn hình thức xử lý',
            options: DISPOSAL_METHOD_OPTIONS,
            rules: [{ required: true, message: 'Hình thức xử lý tài sản là bắt buộc' }],
          },
          {
            name: 'remainingValue',
            label: 'Giá trị còn lại (VNĐ)',
            type: FormFieldType.Readonly,
            computedValue: (_form, values) => {
              const original = Number(values.originalValue);
              const accumulated = Number(values.accumulatedDepreciation) || 0;
              if (values.originalValue == null || Number.isNaN(original)) return undefined;
              return Math.max(0, original - accumulated);
            },
            valueFormatter: (val) => (val != null ? fmtInputNumber(Number(val)) : '—'),
          },
          {
            name: 'monthlyDepreciation',
            label: 'Khấu hao tháng (VNĐ)',
            type: FormFieldType.Readonly,
            computedValue: (_form, values) => {
              const original = Number(values.originalValue);
              const months = Number(values.depreciationMonths);
              if (values.originalValue != null && months > 0) {
                return Math.round((original / months) * 100) / 100;
              }
              return undefined;
            },
            valueFormatter: (val) => (val != null ? fmtInputNumber(Number(val)) : '—'),
          },
        ],
      },
    ];
  }, [operationMode, selected, organizations]);

  const tabs = useMemo<FormTabConfig<OperationValues>[]>(() => {
    return [
      {
        key: 'operation',
        label:
          operationMode === 'exploit'
            ? 'Khai thác tài sản'
            : operationMode === 'increase'
              ? 'Yêu cầu tăng nguyên giá'
              : 'Yêu cầu giảm nguyên giá',
        sections,
      },
    ];
  }, [operationMode, sections]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    return createAssetAdjustmentFooterActions({
      operationMode,
      saving,
      saveAction,
      onClose,
      onSubmit,
      exploitSubmitLabel: 'Lưu nghiệp vụ',
    });
  }, [operationMode, saving, saveAction, onClose, onSubmit]);

  const title =
    operationMode === 'exploit'
      ? `Khai thác tài sản — ${selected?.assetName || 'Tài sản khu chuyển tải'}`
      : operationMode === 'increase'
        ? `Yêu cầu tăng nguyên giá — ${selected?.assetName || 'Tài sản khu chuyển tải'}`
        : `Yêu cầu giảm nguyên giá — ${selected?.assetName || 'Tài sản khu chuyển tải'}`;

  return (
    <DynamicFormSidebar
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      tabs={tabs}
      footerActions={footerActions}
      footerAlign="center"
    />
  );
}

export default TransferAreaAssetOperationForm;
