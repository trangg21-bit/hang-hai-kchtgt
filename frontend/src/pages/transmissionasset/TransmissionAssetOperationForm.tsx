import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { TransmissionAsset } from '../../services/transmissionAsset/types';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSectionConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';
import {
  createAssetAdjustmentOperationSection,
  handleAssetAdjustmentValuesChange,
} from '../../components/shared/asset-value';

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

const UNITS = ['Bộ', 'Cái', 'Hệ thống', 'Tuyến', 'Chiếc'];
const ADJUSTMENT_REASONS = [
  'Đầu tư nâng cấp hệ thống',
  'Mở rộng công suất truyền dẫn',
  'Đánh giá lại giá trị',
  'Hao mòn kỹ thuật',
  'Thanh lý thiết bị hư hỏng',
  'Khác',
];

export interface TransmissionAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: TransmissionAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
}

export default function TransmissionAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
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
              min: 0,
              placeholder: 'Nhập tổng thu',
            },
            {
              name: 'relatedCosts',
              label: 'Chi phí có liên quan (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              placeholder: 'Nhập chi phí',
            },
            {
              name: 'stateBudgetPayment',
              label: 'Nộp NSNN (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              placeholder: 'Nhập số tiền nộp NSNN',
            },
            {
              name: 'projectAmount',
              label: 'Số tiền được thực hiện dự án (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
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
            options: ADJUSTMENT_REASONS.map((r) => ({ value: r, label: r })),
            required: true,
            rules: [{ required: true, message: 'Lý do là bắt buộc' }],
          },
        ],
      },
      createAssetAdjustmentOperationSection<OperationValues>({
        selectedRecord: selected,
        operationMode,
      }),
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
        label:
          operationMode === 'exploit'
            ? 'Lưu khai thác'
            : operationMode === 'increase'
              ? 'Lưu tăng nguyên giá'
              : 'Lưu giảm nguyên giá',
        variant: 'primary',
        loading: saving,
        onClick: () => void onSubmit(),
      },
    ];
  }, [operationMode, onClose, onSubmit, saving]);

  if (!open || !operationMode || !selected) return null;

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
