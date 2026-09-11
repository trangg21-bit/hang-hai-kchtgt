import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { StormShelterAsset } from '../../services/assetmovement/types';
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

export interface StormShelterAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: StormShelterAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

export function StormShelterAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  onClose,
  onSubmit,
}: StormShelterAssetOperationFormProps) {
  const currentOriginal = Number(selected?.originalValue || 0);
  const currentRemaining = Number(selected?.remainingValue || 0);

  const operationTitle = useMemo(() => {
    switch (operationMode) {
      case 'exploit':
        return 'Khai thác tài sản khu tránh, trú bão';
      case 'increase':
        return 'Tăng nguyên giá tài sản khu tránh, trú bão';
      case 'decrease':
        return 'Giảm nguyên giá tài sản khu tránh, trú bão';
      default:
        return 'Thao tác nghiệp vụ';
    }
  }, [operationMode]);

  const operationTabs = useMemo<FormTabConfig<OperationValues>[]>(() => {
    if (operationMode === 'exploit') {
      const exploitSection: FormSectionConfig<OperationValues> = {
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
            name: 'assetNameDisplay',
            label: 'Danh mục tài sản',
            type: FormFieldType.Readonly,
            initialValue: selected?.assetName || selected?.assetCode || '—',
            valueFormatter: () => selected?.assetName || selected?.assetCode || '—',
          },
          {
            name: 'unitOfMeasure',
            label: 'Đơn vị tính',
            type: FormFieldType.Select,
            options: UNITS.map((u) => ({ value: u, label: u })),
            initialValue: selected?.quantityUnit || 'Bộ',
          },
          {
            name: 'quantity',
            label: 'Số lượng',
            type: FormFieldType.Number,
            min: 0,
            initialValue: selected?.quantity || 1,
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
            rows: 2,
            placeholder: 'Nhập ghi chú khai thác',
          },
        ],
      };

      return [
        {
          key: 'exploit_tab',
          label: 'Khai thác tài sản',
          sections: [exploitSection],
        },
      ];
    }

    const isIncrease = operationMode === 'increase';
    const labelPrefix = isIncrease ? 'tăng' : 'giảm';

    const decisionSection: FormSectionConfig<OperationValues> = {
      key: 'decision_section',
      title: `Thông tin quyết định ${labelPrefix} nguyên giá`,
      icon: <AuditOutlined />,
      fields: [
        {
          name: 'decisionNumber',
          label: `Số QĐ ${labelPrefix} nguyên giá`,
          type: FormFieldType.Text,
          required: true,
          rules: [{ required: true, message: `Vui lòng nhập số QĐ ${labelPrefix} nguyên giá` }],
          placeholder: `Nhập số quyết định ${labelPrefix}`,
        },
        {
          name: 'decisionDate',
          label: `Ngày ra QĐ ${labelPrefix} nguyên giá`,
          type: FormFieldType.Date,
          required: true,
          rules: [{ required: true, message: 'Vui lòng chọn ngày ra QĐ' }],
        },
        {
          name: 'adjustmentDate',
          label: `Ngày ${labelPrefix} nguyên giá`,
          type: FormFieldType.Date,
          required: true,
          rules: [{ required: true, message: `Vui lòng chọn ngày ${labelPrefix}` }],
        },
        {
          name: 'adjustmentReason',
          label: `Lý do ${labelPrefix} nguyên giá`,
          type: FormFieldType.Select,
          options: ADJUSTMENT_REASONS.map((r) => ({ value: r, label: r })),
          required: true,
          rules: [{ required: true, message: 'Vui lòng chọn lý do' }],
        },
        {
          name: 'notes',
          label: 'Ghi chú (điều chỉnh)',
          type: FormFieldType.TextArea,
          colSpan: 24,
          rows: 2,
          placeholder: 'Nhập ghi chú điều chỉnh',
        },
      ],
    };

    const valueSection: FormSectionConfig<OperationValues> = {
      key: 'value_section',
      title: 'Biến động giá trị tài sản',
      icon: <SlidersOutlined />,
      fields: [
        {
          name: 'currentOriginalDisplay',
          label: `Nguyên giá trước khi ${labelPrefix}`,
          type: FormFieldType.Readonly,
          initialValue: currentOriginal,
          valueFormatter: () => `${fmtInputNumber(currentOriginal)} VNĐ`,
        },
        {
          name: 'originalValue',
          label: `Số tiền ${labelPrefix} nguyên giá (VNĐ)`,
          type: FormFieldType.Number,
          min: 0,
          required: true,
          rules: [{ required: true, message: 'Vui lòng nhập số tiền điều chỉnh' }],
          placeholder: '0',
        },
        {
          name: 'afterOriginalDisplay',
          label: `Nguyên giá sau khi ${labelPrefix}`,
          type: FormFieldType.Readonly,
          computedValue: (_f, values) => {
            const adj = Number(values.originalValue) || 0;
            return isIncrease ? currentOriginal + adj : Math.max(0, currentOriginal - adj);
          },
          valueFormatter: (val) => `${fmtInputNumber(Number(val))} VNĐ`,
        },
        {
          name: 'currentRemainingDisplay',
          label: `Giá trị còn lại trước khi ${labelPrefix}`,
          type: FormFieldType.Readonly,
          initialValue: currentRemaining,
          valueFormatter: () => `${fmtInputNumber(currentRemaining)} VNĐ`,
        },
        {
          name: 'afterRemainingDisplay',
          label: `Giá trị còn lại sau khi ${labelPrefix}`,
          type: FormFieldType.Readonly,
          computedValue: (_f, values) => {
            const adj = Number(values.originalValue) || 0;
            return isIncrease ? currentRemaining + adj : Math.max(0, currentRemaining - adj);
          },
          valueFormatter: (val) => `${fmtInputNumber(Number(val))} VNĐ`,
        },
      ],
    };

    return [
      {
        key: 'adjustment_tab',
        label: isIncrease ? 'Tăng nguyên giá' : 'Giảm nguyên giá',
        sections: [decisionSection, valueSection],
      },
    ];
  }, [operationMode, organizations, selected, currentOriginal, currentRemaining]);

  const actions = useMemo<FormSidebarAction[]>(() => {
    return [
      {
        key: 'cancel',
        label: 'Hủy',
        variant: 'default',
        onClick: onClose,
      },
      {
        key: 'submit',
        label: 'Lưu thay đổi',
        variant: 'primary',
        loading: saving,
        onClick: () => {
          form.validateFields().then(() => {
            onSubmit();
          });
        },
      },
    ];
  }, [saving, onClose, onSubmit, form]);

  return (
    <DynamicFormSidebar<OperationValues>
      open={open}
      title={operationTitle}
      form={form}
      tabs={operationTabs}
      actions={actions}
      onClose={onClose}
      width={780}
    />
  );
}

export default StormShelterAssetOperationForm;
