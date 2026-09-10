import React, { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { PortTerminalAsset } from '../../services/assetmovement/types';
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

export interface PortTerminalAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: PortTerminalAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
}

export function PortTerminalAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  onClose,
  onSubmit,
}: PortTerminalAssetOperationFormProps) {
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
              initialValue: selected.assetName,
              valueFormatter: () => selected.assetName || '—',
            },
            {
              name: 'unitOfMeasure',
              label: 'Đơn vị tính',
              type: FormFieldType.Select,
              placeholder: 'Chọn đơn vị tính',
              options: UNITS.map((value) => ({ value, label: value })),
            },
            {
              name: 'quantity',
              label: 'Số lượng',
              type: FormFieldType.Number,
              min: 0,
              formatter: fmtInputNumber,
              placeholder: '0',
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
              formatter: fmtInputNumber,
              placeholder: '0',
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
            options: ADJUSTMENT_REASONS.map((value) => ({ value, label: value })),
            rules: [{ required: true, message: 'Lý do là bắt buộc' }],
          },
        ],
      },
      {
        key: 'value_section',
        title: 'Giá trị & Khấu hao điều chỉnh',
        icon: <SlidersOutlined />,
        fields: [
          {
            name: 'originalValueBefore' as keyof OperationValues,
            label: 'Nguyên giá trước điều chỉnh',
            type: FormFieldType.Readonly,
            valueFormatter: () =>
              selected.originalValue != null ? `${fmtInputNumber(selected.originalValue)} VNĐ` : '—',
          },
          {
            name: 'originalValue',
            label: 'Nguyên giá sau điều chỉnh (VNĐ)',
            type: FormFieldType.Number,
            required: true,
            min: 0,
            formatter: fmtInputNumber,
            placeholder: '0',
            rules: [{ required: true, message: 'Nguyên giá sau điều chỉnh là bắt buộc' }],
          },
          {
            name: 'remainingValueBefore' as keyof OperationValues,
            label: 'Giá trị còn lại trước',
            type: FormFieldType.Readonly,
            valueFormatter: () =>
              selected.remainingValue != null ? `${fmtInputNumber(selected.remainingValue)} VNĐ` : '—',
          },
          {
            name: 'remainingValueAfter' as keyof OperationValues,
            label: 'Giá trị còn lại sau',
            type: FormFieldType.Readonly,
            computedValue: (_f, vals) => {
              const orig = Number(vals.originalValue);
              if (isNaN(orig) || vals.originalValue == null) return undefined;
              const acc = Number(vals.accumulatedDepreciation) || 0;
              return Math.max(0, orig - acc);
            },
            valueFormatter: (val) => (val != null ? `${fmtInputNumber(Number(val))} VNĐ` : '—'),
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
            min: 0,
            max: 100,
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
            label: 'Khấu hao lũy kế',
            type: FormFieldType.Number,
            min: 0,
            formatter: fmtInputNumber,
            placeholder: '0',
          },
          {
            name: 'monthlyDepreciation' as keyof OperationValues,
            label: 'Khấu hao tháng',
            type: FormFieldType.Readonly,
            computedValue: (_f, vals) => {
              const orig = Number(vals.originalValue);
              const months = Number(vals.depreciationMonths);
              if (!isNaN(orig) && orig > 0 && !isNaN(months) && months > 0) {
                return Math.round((orig / months) * 100) / 100;
              }
              return undefined;
            },
            valueFormatter: (val) => (val != null ? `${fmtInputNumber(Number(val))} VNĐ` : '—'),
          },
          {
            name: 'notes',
            label: 'Ghi chú điều chỉnh',
            type: FormFieldType.TextArea,
            rows: 3,
            placeholder: 'Nhập ghi chú điều chỉnh',
            colSpan: 24,
          },
        ],
      },
    ];
  }, [operationMode, selected, organizations]);

  const tabs = useMemo<FormTabConfig<OperationValues>[]>(() => {
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
  }, [sections, operationMode]);

  const footerActions = useMemo<FormSidebarAction[]>(() => [
    {
      key: 'cancel',
      label: 'Hủy',
      variant: 'outline',
      onClick: onClose,
    },
    {
      key: 'submit',
      label: 'Lưu thông tin',
      variant: 'primary',
      loading: saving,
      onClick: onSubmit,
    },
  ], [onClose, onSubmit, saving]);

  if (!operationMode || !selected) return null;

  return (
    <DynamicFormSidebar<OperationValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
      rootClassName="berth-drawer-scope"
      className="berth-drawer-scope"
      tabs={tabs}
      footerActions={footerActions}
    />
  );
}

export default PortTerminalAssetOperationForm;
