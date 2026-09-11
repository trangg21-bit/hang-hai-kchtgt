import React, { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { BuoyAsset } from '../../services/assetmovement/types';
import { fmtInputNumber } from '../../utils/numFmt';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSectionConfig,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';

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
}

const UNITS = ['Cái', 'Bộ', 'Chiếc', 'm²', 'm'];
const ADJUSTMENT_REASONS = [
  'Đầu tư bổ sung',
  'Đánh giá lại',
  'Nâng cấp',
  'Hao mòn',
  'Thanh lý một phần',
  'Khác',
];

export interface BuoyAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: BuoyAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
}

export function BuoyAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  onClose,
  onSubmit,
}: BuoyAssetOperationFormProps) {
  const title = useMemo(() => {
    if (!operationMode || !selected) return '';
    const actionText =
      operationMode === 'exploit'
        ? 'Khai thác tài sản'
        : operationMode === 'increase'
          ? 'Tăng nguyên giá tài sản'
          : 'Giảm nguyên giá tài sản';
    return `${actionText} — ${selected.assetName || selected.assetCode}`;
  }, [operationMode, selected]);

  const formTabs = useMemo<FormTabConfig<OperationValues>[]>(() => {
    if (!operationMode || !selected) return [];

    if (operationMode === 'exploit') {
      const exploitSection: FormSectionConfig<OperationValues> = {
        key: 'exploit_info',
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
            type: FormFieldType.Text,
            initialValue: selected.assetName,
            disabled: true,
          },
          {
            name: 'unitOfMeasure',
            label: 'Đơn vị tính',
            type: FormFieldType.Select,
            allowClear: true,
            options: UNITS.map((v) => ({ value: v, label: v })),
          },
          {
            name: 'quantity',
            label: 'Số lượng',
            type: FormFieldType.Number,
            min: 0,
            placeholder: '0',
          },
          {
            name: 'exploitationDeadline',
            label: 'Thời hạn khai thác',
            type: FormFieldType.Date,
          },
          {
            name: 'totalRevenue',
            label: 'Tổng số tiền thu được (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            placeholder: '0',
          },
          {
            name: 'relatedCosts',
            label: 'Chi phí có liên quan (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            placeholder: '0',
          },
          {
            name: 'stateBudgetPayment',
            label: 'Nộp NSNN (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            placeholder: '0',
          },
          {
            name: 'projectAmount',
            label: 'Số tiền được thực hiện dự án (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            placeholder: '0',
          },
          {
            name: 'notes',
            label: 'Ghi chú (khai thác)',
            type: FormFieldType.TextArea,
            colSpan: 24,
            rows: 3,
            placeholder: 'Nhập ghi chú khai thác',
          },
        ],
      };

      return [
        {
          key: 'exploit',
          label: 'Khai thác tài sản',
          sections: [exploitSection],
        },
      ];
    }

    const isIncrease = operationMode === 'increase';
    const originalValueBefore = selected.originalValue || 0;
    const remainingValueBefore = selected.remainingValue || 0;

    const adjustmentSection: FormSectionConfig<OperationValues> = {
      key: 'adjustment_info',
      title: isIncrease ? 'Thông tin tăng nguyên giá' : 'Thông tin giảm nguyên giá',
      icon: <SlidersOutlined />,
      fields: [
        {
          name: 'decisionNumber',
          label: isIncrease ? 'Số QĐ tăng nguyên giá' : 'Số QĐ giảm nguyên giá',
          type: FormFieldType.Text,
          placeholder: 'Nhập số quyết định',
        },
        {
          name: 'decisionDate',
          label: isIncrease ? 'Ngày ra QĐ tăng nguyên giá' : 'Ngày ra QĐ giảm nguyên giá',
          type: FormFieldType.Date,
        },
        {
          name: 'adjustmentDate',
          label: isIncrease ? 'Ngày tăng nguyên giá' : 'Ngày giảm nguyên giá',
          type: FormFieldType.Date,
          required: true,
          rules: [{ required: true, message: 'Ngày điều chỉnh là bắt buộc' }],
        },
        {
          name: 'adjustmentReason',
          label: isIncrease ? 'Lý do tăng nguyên giá' : 'Lý do giảm nguyên giá',
          type: FormFieldType.Select,
          required: true,
          options: ADJUSTMENT_REASONS.map((v) => ({ value: v, label: v })),
          rules: [{ required: true, message: 'Lý do điều chỉnh là bắt buộc' }],
        },
        {
          name: 'notes',
          label: 'Ghi chú (điều chỉnh)',
          type: FormFieldType.TextArea,
          colSpan: 24,
          rows: 2,
          placeholder: 'Nhập ghi chú điều chỉnh',
        },
        {
          name: 'originalValueBefore',
          label: 'Nguyên giá trước điều chỉnh',
          type: FormFieldType.Readonly,
          initialValue: originalValueBefore,
          valueFormatter: () => fmtInputNumber(originalValueBefore) + ' VNĐ',
        },
        {
          name: 'originalValueAfter',
          label: 'Nguyên giá sau điều chỉnh',
          type: FormFieldType.Readonly,
          computedValue: (_f, values) => {
            const adj = Number(values.originalValue) || 0;
            return isIncrease ? originalValueBefore + adj : Math.max(0, originalValueBefore - adj);
          },
          valueFormatter: (v) => (v != null ? fmtInputNumber(Number(v)) + ' VNĐ' : '—'),
        },
        {
          name: 'remainingValueBefore',
          label: 'Giá trị còn lại trước điều chỉnh',
          type: FormFieldType.Readonly,
          initialValue: remainingValueBefore,
          valueFormatter: () => fmtInputNumber(remainingValueBefore) + ' VNĐ',
        },
        {
          name: 'remainingValueAfter',
          label: 'Giá trị còn lại sau điều chỉnh',
          type: FormFieldType.Readonly,
          computedValue: (_f, values) => {
            const adj = Number(values.originalValue) || 0;
            return isIncrease ? remainingValueBefore + adj : Math.max(0, remainingValueBefore - adj);
          },
          valueFormatter: (v) => (v != null ? fmtInputNumber(Number(v)) + ' VNĐ' : '—'),
        },
      ],
    };

    const detailSection: FormSectionConfig<OperationValues> = {
      key: 'detail_info',
      title: 'Thông tin chi tiết điều chỉnh',
      icon: <AuditOutlined />,
      fields: [
        {
          name: 'declarationDate',
          label: 'Ngày kê khai tài sản',
          type: FormFieldType.Date,
        },
        {
          name: 'originalValue',
          label: isIncrease ? 'Giá trị tăng thêm (VNĐ)' : 'Giá trị giảm bớt (VNĐ)',
          type: FormFieldType.Number,
          min: 0,
          required: true,
          placeholder: '0',
          rules: [{ required: true, message: 'Giá trị điều chỉnh là bắt buộc' }],
        },
        {
          name: 'depreciationRate',
          label: 'Tỷ lệ hao mòn/Khấu hao (%)',
          type: FormFieldType.Number,
          min: 0,
          max: 100,
          placeholder: '0',
        },
        {
          name: 'remainingValue',
          label: 'Giá trị còn lại tính toán',
          type: FormFieldType.Readonly,
          computedValue: (_f, values) => {
            const val = Number(values.originalValue) || 0;
            const dep = Number(values.accumulatedDepreciation) || 0;
            return Math.max(0, val - dep);
          },
          valueFormatter: (v) => (v != null ? fmtInputNumber(Number(v)) + ' VNĐ' : '—'),
        },
        {
          name: 'valueUnit',
          label: 'Đơn vị tính',
          type: FormFieldType.Text,
          initialValue: 'VNĐ',
          disabled: true,
        },
        {
          name: 'assignmentDecisionNumber',
          label: 'Số QĐ giao (bao gồm cả tăng vốn)',
          type: FormFieldType.Text,
          placeholder: 'Nhập số quyết định giao',
        },
        {
          name: 'depreciationStartDate',
          label: 'Ngày tính khấu hao',
          type: FormFieldType.Date,
        },
        {
          name: 'depreciationMonths',
          label: 'Số tháng tính khấu hao',
          type: FormFieldType.Number,
          min: 0,
          placeholder: '0',
        },
        {
          name: 'depreciationEndDate',
          label: 'Ngày hết khấu hao',
          type: FormFieldType.Date,
        },
        {
          name: 'accumulatedDepreciation',
          label: 'Khấu hao lũy kế (VNĐ)',
          type: FormFieldType.Number,
          min: 0,
          placeholder: '0',
        },
        {
          name: 'monthlyDepreciation',
          label: 'Khấu hao tháng (VNĐ)',
          type: FormFieldType.Readonly,
          computedValue: (_f, values) => {
            const val = Number(values.originalValue) || 0;
            const m = Number(values.depreciationMonths) || 0;
            return m > 0 ? Math.round(val / m) : 0;
          },
          valueFormatter: (v) => (v != null ? fmtInputNumber(Number(v)) + ' VNĐ' : '—'),
        },
        {
          name: 'disposalMethod',
          label: 'Hình thức xử lý tài sản',
          type: FormFieldType.Select,
          allowClear: true,
          options: UNITS.map((v) => ({ value: v, label: v })),
        },
      ],
    };

    return [
      {
        key: 'adjustment',
        label: isIncrease ? 'Tăng nguyên giá' : 'Giảm nguyên giá',
        sections: [adjustmentSection, detailSection],
      },
    ];
  }, [operationMode, selected, organizations]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    return [
      {
        key: 'cancel',
        label: 'Hủy',
        variant: 'outline',
        onClick: onClose,
      },
      {
        key: 'submit',
        label: 'Lưu thay đổi',
        variant: 'primary',
        loading: saving,
        onClick: onSubmit,
      },
    ];
  }, [saving, onClose, onSubmit]);

  return (
    <DynamicFormSidebar
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      tabs={formTabs}
      footerActions={footerActions}
      footerAlign="center"
      width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
    />
  );
}

export default BuoyAssetOperationForm;
