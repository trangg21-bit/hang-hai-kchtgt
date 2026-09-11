import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { TransmissionAsset } from '../../services/transmissionAsset/types';
import { fmtInputNumber } from '../../utils/numFmt';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSectionConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';

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
const DISPOSAL_METHODS = ['Bán', 'Thanh lý', 'Điều chuyển', 'Tiêu hủy', 'Khác'];

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
          {
            name: 'notes',
            label: 'Ghi chú điều chỉnh',
            type: FormFieldType.TextArea,
            placeholder: 'Nhập ghi chú điều chỉnh',
            colSpan: 24,
          },
        ],
      },
      {
        key: 'adjustment_values',
        title: 'Giá trị điều chỉnh & Khấu hao',
        icon: <SlidersOutlined />,
        fields: [
          {
            name: 'originalValueBefore',
            label: 'Nguyên giá trước khi điều chỉnh (VNĐ)',
            type: FormFieldType.Readonly,
            valueFormatter: (val) => fmtInputNumber(Number(val) || 0) + ' VNĐ',
          },
          {
            name: 'originalValueAfter',
            label: `Nguyên giá sau khi ${isIncrease ? 'tăng' : 'giảm'} (VNĐ)`,
            type: FormFieldType.Number,
            min: 0,
            placeholder: 'Nhập nguyên giá mới',
            required: true,
            rules: [{ required: true, message: 'Nguyên giá sau điều chỉnh là bắt buộc' }],
          },
          {
            name: 'remainingValueBefore',
            label: 'Giá trị còn lại trước điều chỉnh (VNĐ)',
            type: FormFieldType.Readonly,
            valueFormatter: (val) => fmtInputNumber(Number(val) || 0) + ' VNĐ',
          },
          {
            name: 'remainingValueAfter',
            label: `Giá trị còn lại sau khi ${isIncrease ? 'tăng' : 'giảm'} (VNĐ)`,
            type: FormFieldType.Number,
            min: 0,
            placeholder: 'Nhập giá trị còn lại mới',
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
            placeholder: 'Nhập tỷ lệ',
          },
          {
            name: 'assignmentDecisionNumber',
            label: 'Số quyết định giao (bao gồm cả tăng vốn)',
            type: FormFieldType.Text,
            placeholder: 'Nhập số quyết định giao',
          },
          {
            name: 'depreciationStartDate',
            label: 'Ngày tính khấu hao',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày tính KH',
          },
          {
            name: 'depreciationMonths',
            label: 'Số tháng tính khấu hao',
            type: FormFieldType.Number,
            min: 0,
            placeholder: 'Nhập số tháng',
          },
          {
            name: 'depreciationEndDate',
            label: 'Ngày hết khấu hao',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày hết KH',
          },
          {
            name: 'accumulatedDepreciation',
            label: 'Khấu hao lũy kế (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            placeholder: 'Nhập khấu hao lũy kế',
          },
          {
            name: 'monthlyDepreciation',
            label: 'Khấu hao tháng (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            placeholder: 'Nhập khấu hao tháng',
          },
          {
            name: 'disposalMethod',
            label: 'Hình thức xử lý tài sản',
            type: FormFieldType.Select,
            placeholder: 'Chọn hình thức xử lý',
            options: DISPOSAL_METHODS.map((d) => ({ value: d, label: d })),
          },
        ],
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
      rootClassName="transmission-operation-drawer"
      className="transmission-operation-drawer"
    />
  );
}
