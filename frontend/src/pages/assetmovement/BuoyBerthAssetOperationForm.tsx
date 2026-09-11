import React, { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { BuoyBerthAsset } from '../../services/assetmovement/types';
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

export interface BuoyBerthAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: BuoyBerthAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
}

export function BuoyBerthAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  onClose,
  onSubmit,
}: BuoyBerthAssetOperationFormProps) {
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
            placeholder: 'Chọn ngày quyết định',
            rules: [{ required: true, message: 'Ngày quyết định là bắt buộc' }],
          },
          {
            name: 'adjustmentDate',
            label: `Ngày ${actionLabel} nguyên giá`,
            type: FormFieldType.Date,
            required: true,
            placeholder: 'Chọn ngày điều chỉnh',
            rules: [{ required: true, message: 'Ngày điều chỉnh là bắt buộc' }],
          },
          {
            name: 'adjustmentReason',
            label: `Lý do ${actionLabel} nguyên giá`,
            type: FormFieldType.Select,
            required: true,
            placeholder: 'Chọn lý do',
            options: ADJUSTMENT_REASONS.map((value) => ({ value, label: value })),
            rules: [{ required: true, message: 'Lý do điều chỉnh là bắt buộc' }],
          },
          {
            name: 'originalValueBefore' as keyof OperationValues,
            label: `Nguyên giá trước khi ${actionLabel}`,
            type: FormFieldType.Readonly,
            initialValue: selected.originalValue,
            valueFormatter: () => fmtInputNumber(selected.originalValue) + ' VNĐ',
          },
          {
            name: 'remainingValueBefore' as keyof OperationValues,
            label: `Giá trị còn lại trước khi ${actionLabel}`,
            type: FormFieldType.Readonly,
            initialValue: selected.remainingValue,
            valueFormatter: () => fmtInputNumber(selected.remainingValue) + ' VNĐ',
          },
          {
            name: 'notes',
            label: 'Ghi chú',
            type: FormFieldType.TextArea,
            rows: 2,
            placeholder: 'Nhập ghi chú điều chỉnh',
            colSpan: 24,
          },
        ],
      },
      {
        key: 'value_section',
        title: 'Thông tin chi tiết giá trị & khấu hao sau điều chỉnh',
        icon: <SlidersOutlined />,
        fields: [
          {
            name: 'declarationDate',
            label: 'Ngày kê khai tài sản',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày kê khai',
          },
          {
            name: 'originalValue',
            label: `Nguyên giá sau khi ${actionLabel} (VNĐ)`,
            type: FormFieldType.Number,
            min: 0,
            required: true,
            formatter: fmtInputNumber,
            placeholder: '0',
            rules: [{ required: true, message: 'Nguyên giá sau điều chỉnh là bắt buộc' }],
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
            name: 'remainingValueAfter' as keyof OperationValues,
            label: `Giá trị còn lại sau khi ${actionLabel}`,
            type: FormFieldType.Readonly,
            computedValue: (_form, values) => {
              const orig = Number(values.originalValue);
              const acc = Number(values.accumulatedDepreciation) || 0;
              if (values.originalValue != null) {
                return Math.max(0, orig - acc);
              }
              return undefined;
            },
            valueFormatter: (val) => (val != null ? `${fmtInputNumber(Number(val))} VNĐ` : '—'),
          },
          {
            name: 'valueUnit' as keyof OperationValues,
            label: 'Đơn vị tính',
            type: FormFieldType.Readonly,
            initialValue: 'VNĐ',
            valueFormatter: () => 'VNĐ',
          },
          {
            name: 'assignmentDecisionNumber',
            label: 'Số quyết định giao',
            type: FormFieldType.Text,
            placeholder: 'Nhập số quyết định giao',
          },
          {
            name: 'depreciationStartDate',
            label: 'Ngày tính khấu hao',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày tính khấu hao',
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
            placeholder: 'Chọn ngày hết khấu hao',
          },
          {
            name: 'accumulatedDepreciation',
            label: 'Khấu hao lũy kế (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            formatter: fmtInputNumber,
            placeholder: '0',
          },
          {
            name: 'monthlyDepreciation' as keyof OperationValues,
            label: 'Khấu hao tháng',
            type: FormFieldType.Readonly,
            computedValue: (_form, values) => {
              const orig = Number(values.originalValue);
              const months = Number(values.depreciationMonths);
              if (values.originalValue != null && months > 0) {
                return Math.round((orig / months) * 100) / 100;
              }
              return undefined;
            },
            valueFormatter: (val) => (val != null ? `${fmtInputNumber(Number(val))} VNĐ` : '—'),
          },
          {
            name: 'disposalMethod',
            label: 'Hình thức xử lý tài sản',
            type: FormFieldType.Select,
            allowClear: true,
            placeholder: 'Chọn hình thức xử lý',
            options: ['Bán', 'Thanh lý', 'Điều chuyển', 'Tiêu hủy', 'Khác'].map((v) => ({
              value: v,
              label: v,
            })),
          },
        ],
      },
    ];
  }, [operationMode, selected, organizations]);

  const tabs = useMemo<FormTabConfig<OperationValues>[]>(() => {
    return [
      {
        key: 'general',
        label: 'Thông tin thực hiện',
        sections,
      },
    ];
  }, [sections]);

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
        label: 'Xác nhận thực hiện',
        variant: 'primary',
        loading: saving,
        onClick: () => void onSubmit(),
      },
    ];
  }, [onClose, onSubmit, saving]);

  return (
    <DynamicFormSidebar<OperationValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      width={
        typeof window !== 'undefined'
          ? Math.min(960, Math.floor(window.innerWidth * 0.95))
          : 960
      }
      rootClassName="buoy-berth-drawer-scope"
      className="buoy-berth-drawer-scope"
      tabs={tabs}
      footerActions={footerActions}
    />
  );
}

export default BuoyBerthAssetOperationForm;
