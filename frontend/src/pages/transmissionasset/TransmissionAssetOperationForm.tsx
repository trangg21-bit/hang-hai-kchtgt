import { AuditOutlined, RocketOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';
import {
  createAssetAdjustmentFooterActions,
  createAssetAdjustmentOperationSection,
  handleAssetAdjustmentValuesChange,
} from '../../components/shared/asset-value';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSectionConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';
import type { Organization } from '../../services/organizationService';
import type { TransmissionAsset } from '../../services/transmissionAsset/types';
import { formatAssetCode } from '../../utils/assetCode';

export type OperationMode = 'exploit' | 'increase' | 'decrease';

export interface OperationValues extends Record<string, unknown> {
  operatorOrgUnitId?: string;
  assetCategory?: string;
  unitOfMeasure?: string;
  quantity?: number;
  exploitationDeadline?: Dayjs;
  totalRevenue?: number;
  relatedCosts?: number;
  stateBudgetPayment?: number;
  projectAmount?: number;
  operatingTime?: string;
  exploitationLevel?: string;
  operatingCost?: number;
  maintenanceCost?: number;
  technicalStatus?: string;
  exploitationMonth?: number;
  exploitationYear?: number;
  description?: string;
  notes?: string;
  decisionNumber?: string;
  decisionDate?: Dayjs;
  adjustmentDate?: Dayjs;
  adjustmentReason?: string;
  originalValueBefore?: number;
  originalValue?: number;
  originalValueAfter?: number;
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
  disposalMethod?: string;
}

import {
  ASSET_QUANTITY_UNIT_OPTIONS,
  DECREASE_REASON_OPTIONS,
  DISPOSAL_METHOD_OPTIONS,
  INCREASE_REASON_OPTIONS,
} from '../../constants/assetDropdown';

export interface TransmissionAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: TransmissionAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  saveAction?: string;
  onClose: () => void;
  onSubmit: (targetAction?: 'PENDING_APPROVAL' | 'APPROVED') => Promise<void> | void;
}

export default function TransmissionAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  saveAction,
  onClose,
  onSubmit,
}: TransmissionAssetOperationFormProps) {
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
          title: 'Thông tin khai thác tài sản HT truyền dẫn',
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
              initialValue: [formatAssetCode(selected.assetCode), selected.assetName].filter(Boolean).join(' - '),
              valueFormatter: () =>
                [formatAssetCode(selected.assetCode), selected.assetName].filter(Boolean).join(' - ') || '—',
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
              required: true,
              rules: [{ required: true, message: 'Số lượng là bắt buộc' }],
              min: 0,
              maxLength: 5,
              initialValue: 1,
            },
            {
              name: 'exploitationDeadline',
              label: 'Thời hạn khai thác',
              type: FormFieldType.Date,
              placeholder: 'Chọn thời hạn khai thác',
            },
            {
              name: 'totalRevenue',
              label: 'Tổng số tiền thu được (VNĐ)',
              type: FormFieldType.Number,
              required: true,
              rules: [{ required: true, message: 'Tổng số tiền thu được là bắt buộc' }],
              min: 0,
              maxLength: 20,
              placeholder: 'Nhập tổng thu',
            },
            {
              name: 'relatedCosts',
              label: 'Chi phí có liên quan (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              maxLength: 20,
              placeholder: 'Nhập chi phí',
            },
            {
              name: 'stateBudgetPayment',
              label: 'Nộp NSNN (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              maxLength: 20,
              placeholder: 'Nhập số tiền nộp NSNN',
            },
            {
              name: 'projectAmount',
              label: 'Số tiền được thực hiện dự án (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              maxLength: 20,
              placeholder: 'Nhập số tiền dự án',
            },
            {
              name: 'description',
              label: 'Ghi chú khai thác',
              type: FormFieldType.TextArea,
              placeholder: 'Nhập ghi chú chi tiết về khai thác tài sản',
              colSpan: 24,
            },
          ],
        },
      ];
    }

    const isIncrease = operationMode === 'increase';
    return [
      {
        key: 'adjustment_decision',
        title: `Quyết định ${isIncrease ? 'tăng' : 'giảm'} nguyên giá`,
        icon: <AuditOutlined />,
        fields: [
          {
            name: 'decisionNumber',
            label: `Số QĐ ${isIncrease ? 'tăng' : 'giảm'} nguyên giá`,
            type: FormFieldType.Text,
            placeholder: 'Nhập số quyết định',
            required: true,
            rules: [{ required: true, message: 'Số quyết định là bắt buộc' }],
          },
          {
            name: 'decisionDate',
            label: `Ngày ra QĐ ${isIncrease ? 'tăng' : 'giảm'} nguyên giá`,
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày ra quyết định',
            required: true,
            rules: [{ required: true, message: 'Ngày ra quyết định là bắt buộc' }],
          },
          {
            name: 'adjustmentDate',
            label: `Ngày ${isIncrease ? 'tăng' : 'giảm'} nguyên giá`,
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày điều chỉnh',
            required: true,
            rules: [{ required: true, message: 'Ngày điều chỉnh là bắt buộc' }],
          },
          {
            name: 'adjustmentReason',
            label: `Lý do ${isIncrease ? 'tăng' : 'giảm'} nguyên giá`,
            type: FormFieldType.Select,
            placeholder: 'Chọn lý do',
            options: isIncrease ? INCREASE_REASON_OPTIONS : DECREASE_REASON_OPTIONS,
            required: true,
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
            required: true,
            rules: [{ required: true, message: 'Hình thức xử lý tài sản là bắt buộc' }],
            options: DISPOSAL_METHOD_OPTIONS,
          },
        ],
      }),
    ];
  }, [operationMode, selected, organizations]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    return createAssetAdjustmentFooterActions({
      operationMode,
      saving,
      saveAction,
      onSubmit,
      onClose,
    });
  }, [operationMode, saving, saveAction, onSubmit, onClose]);

  if (!operationMode || !selected) return null;

  return (
    <DynamicFormSidebar<OperationValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      sections={sections}
      footerActions={footerActions}
      onValuesChange={(changed, all) => {
        handleAssetAdjustmentValuesChange(form, changed, all);
      }}
      rootClassName="transmission-operation-drawer"
      className="transmission-operation-drawer"
    />
  );
}
