import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { PierAsset } from '../../services/assetmovement/types';
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
  [key: string]: unknown;
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

export interface PierAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: PierAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
}

export function PierAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  onClose,
  onSubmit,
}: PierAssetOperationFormProps) {
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
              rules: [
                { required: true, message: 'Đơn vị khai thác là bắt buộc' },
              ],
            },
            {
              name: 'assetCategory',
              label: 'Danh mục tài sản',
              type: FormFieldType.Text,
              disabled: true,
              initialValue: selected.assetName,
            },
            {
              name: 'unitOfMeasure',
              label: 'Đơn vị tính',
              type: FormFieldType.Select,
              options: UNITS.map((u) => ({ value: u, label: u })),
              placeholder: 'Chọn đơn vị tính',
            },
            {
              name: 'quantity',
              label: 'Số lượng',
              type: FormFieldType.Number,
              min: 0,
              placeholder: 'Nhập số lượng khai thác',
            },
            {
              name: 'exploitationDeadline',
              label: 'Thời hạn khai thác',
              type: FormFieldType.Date,
              placeholder: 'Chọn thời hạn',
            },
            {
              name: 'totalRevenue',
              label: 'Tổng số tiền thu được (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              placeholder: 'Nhập tổng số tiền',
            },
            {
              name: 'relatedCosts',
              label: 'Chi phí có liên quan',
              type: FormFieldType.Number,
              min: 0,
              placeholder: 'Nhập chi phí liên quan',
            },
            {
              name: 'stateBudgetPayment',
              label: 'Nộp NSNN',
              type: FormFieldType.Number,
              min: 0,
              placeholder: 'Nhập số tiền nộp NSNN',
            },
            {
              name: 'projectAmount',
              label: 'Số tiền được thực hiện dự án',
              type: FormFieldType.Number,
              min: 0,
              placeholder: 'Nhập số tiền thực hiện dự án',
            },
            {
              name: 'notes',
              label: 'Ghi chú (khai thác)',
              type: FormFieldType.TextArea,
              colSpan: 24,
              placeholder: 'Nhập ghi chú khai thác',
            },
          ],
        },
      ];
    }

    return [
      {
        key: 'adjustment_decision',
        title: 'Thông tin quyết định tăng/giảm nguyên giá',
        icon: <AuditOutlined />,
        fields: [
          {
            name: 'decisionNumber',
            label: 'Số QĐ tăng/giảm nguyên giá',
            type: FormFieldType.Text,
            required: true,
            rules: [{ required: true, message: 'Số quyết định là bắt buộc' }],
            placeholder: 'Nhập số quyết định',
          },
          {
            name: 'decisionDate',
            label: 'Ngày ra QĐ tăng/giảm nguyên giá',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày ra quyết định',
          },
          {
            name: 'adjustmentDate',
            label: 'Ngày tăng/giảm nguyên giá',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày tăng/giảm',
          },
          {
            name: 'adjustmentReason',
            label: 'Lý do tăng/giảm nguyên giá',
            type: FormFieldType.Select,
            options: ADJUSTMENT_REASONS.map((r) => ({ value: r, label: r })),
            placeholder: 'Chọn lý do',
          },
          {
            name: 'notes',
            label: 'Ghi chú (điều chỉnh)',
            type: FormFieldType.TextArea,
            colSpan: 24,
            placeholder: 'Nhập ghi chú điều chỉnh',
          },
        ],
      },
      {
        key: 'value_details',
        title: 'Chi tiết giá trị điều chỉnh',
        icon: <SlidersOutlined />,
        fields: [
          {
            name: 'originalValueBefore',
            label: 'Nguyên giá trước khi tăng/giảm',
            type: FormFieldType.Number,
            disabled: true,
            initialValue: selected.originalValue,
          },
          {
            name: 'originalValue',
            label:
              operationMode === 'increase'
                ? 'Giá trị tăng thêm (VNĐ)'
                : 'Giá trị giảm bớt (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            required: true,
            rules: [{ required: true, message: 'Vui lòng nhập giá trị' }],
            placeholder: 'Nhập giá trị',
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
            placeholder: 'Nhập tỷ lệ (%)',
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
            placeholder: 'Chọn ngày tính khấu hao',
          },
          {
            name: 'depreciationMonths',
            label: 'Số tháng tính khấu hao',
            type: FormFieldType.Number,
            min: 0,
            placeholder: 'Nhập số tháng tính khấu hao',
          },
          {
            name: 'depreciationEndDate',
            label: 'Ngày hết khấu hao',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày hết khấu hao',
          },
          {
            name: 'accumulatedDepreciation',
            label: 'Khấu hao lũy kế',
            type: FormFieldType.Number,
            min: 0,
            placeholder: 'Nhập khấu hao lũy kế',
          },
          {
            name: 'disposalMethod',
            label: 'Hình thức xử lý tài sản',
            type: FormFieldType.Select,
            options: [
              { value: 'Bán', label: 'Bán' },
              { value: 'Thanh lý', label: 'Thanh lý' },
              { value: 'Điều chuyển', label: 'Điều chuyển' },
              { value: 'Tiêu hủy', label: 'Tiêu hủy' },
              { value: 'Khác', label: 'Khác' },
            ],
            placeholder: 'Chọn hình thức xử lý',
          },
        ],
      },
    ];
  }, [operationMode, selected, organizations]);

  const formTabs = useMemo<FormTabConfig<OperationValues>[]>(() => {
    return [
      {
        key: 'main',
        label: 'Thông tin biến động',
        sections,
      },
    ];
  }, [sections]);

  const actions = useMemo<FormSidebarAction[]>(() => {
    return [
      {
        key: 'cancel',
        label: 'Hủy',
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
        type: 'primary',
        loading: saving,
        onClick: onSubmit,
      },
    ];
  }, [operationMode, onClose, saving, onSubmit]);

  return (
    <DynamicFormSidebar<OperationValues>
      open={open}
      title={title}
      form={form}
      tabs={formTabs}
      actions={actions}
      onClose={onClose}
      width={780}
      rootClassName="pier-operation-scope"
    />
  );
}

export default PierAssetOperationForm;
