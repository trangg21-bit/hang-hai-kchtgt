import { SlidersOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { DISPOSAL_METHOD_OPTIONS } from '../../../constants/assetDropdown';
import {
  calculateAssetAdjustmentValues,
  calculateInitialRemainingValue,
} from '../../../utils/assetValueCalculation';
import {
  formatDotNumber,
  formatVndCurrency
} from '../../../utils/numFmt';
import {
  FormFieldType,
  type FormFieldConfig,
  type FormSectionConfig,
  type FormSidebarAction,
} from '../dynamic-form-sidebar';

export interface AssetDepreciationSectionOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  key?: string;
  title?: string;
  extraFields?: FormFieldConfig<T>[];
  readonly?: boolean;
}

/**
 * Tạo Section "Thông tin giá trị & Khấu hao tài sản" chuẩn dùng chung cho Form Thêm mới / Chỉnh sửa tài sản.
 * Tự động gắn logic: Giá trị còn lại = Nguyên giá - Khấu hao lũy kế
 */
export function createAssetDepreciationFormSection<T extends Record<string, unknown> = Record<string, unknown>>(
  options?: AssetDepreciationSectionOptions<T>
): FormSectionConfig<T> {
  const isReadonly = Boolean(options?.readonly);

  return {
    key: options?.key || 'depreciation_info',
    title: options?.title || 'Thông tin giá trị & Khấu hao tài sản',
    icon: <SlidersOutlined />,
    fields: [
      {
        name: 'declarationDate' as keyof T,
        label: 'Ngày kê khai tài sản',
        type: FormFieldType.Date,
        placeholder: 'Chọn ngày kê khai',
        disabled: isReadonly,
      },
      {
        name: 'originalValue' as keyof T,
        label: 'Nguyên giá (VNĐ)',
        type: isReadonly ? FormFieldType.Readonly : FormFieldType.Number,
        min: 0,
        maxLength: 20,
        formatter: formatDotNumber,
        placeholder: '0',
        valueFormatter: (v) => formatVndCurrency(v as any),
      },
      {
        name: 'depreciationRate' as keyof T,
        label: 'Tỷ lệ hao mòn/Khấu hao (%)',
        type: isReadonly ? FormFieldType.Readonly : FormFieldType.Number,
        maxLength: 5,
        placeholder: '0',
        valueFormatter: (v) => (v != null ? `${v}%` : ''),
      },
      {
        name: 'remainingValue' as keyof T,
        label: 'Giá trị còn lại',
        type: FormFieldType.Readonly,
        dependencies: ['originalValue', 'accumulatedDepreciation'],
        computedValue: (_form: FormInstance, vals: any) => {
          return calculateInitialRemainingValue(vals.originalValue, vals.accumulatedDepreciation);
        },
        valueFormatter: (v) => formatVndCurrency(v as any),
      },
      {
        name: 'valueUnit' as keyof T,
        label: 'Đơn vị tính giá trị',
        type: FormFieldType.Readonly,
        initialValue: 'VNĐ' as any,
        valueFormatter: () => 'VNĐ',
      },
      {
        name: 'assignmentDecisionNumber' as keyof T,
        label: 'Số quyết định giao (bao gồm cả tăng vốn)',
        type: FormFieldType.Text,
        // 200 là CHÍNH SÁCH hiển thị (không phải ràng buộc schema: cột
        // assignment_decision_number là varchar không giới hạn trong migration),
        // khớp độ dài chuẩn của cột số quyết định ở các migration khác.
        maxLength: 200,
        placeholder: 'Nhập số quyết định',
        disabled: isReadonly,
      },
      {
        name: 'depreciationStartDate' as keyof T,
        label: 'Ngày tính khấu hao',
        type: FormFieldType.Date,
        placeholder: 'Chọn ngày tính',
        disabled: isReadonly,
      },
      {
        name: 'depreciationMonths' as keyof T,
        label: 'Số tháng tính khấu hao',
        type: isReadonly ? FormFieldType.Readonly : FormFieldType.Number,
        min: 0,
        maxLength: 5,
        placeholder: '0',
        valueFormatter: (v) => (v != null ? `${v} tháng` : ''),
      },
      {
        name: 'depreciationEndDate' as keyof T,
        label: 'Ngày hết khấu hao',
        type: FormFieldType.Date,
        placeholder: 'Chọn ngày hết',
        disabled: isReadonly,
      },
      {
        name: 'accumulatedDepreciation' as keyof T,
        label: 'Khấu hao lũy kế',
        type: isReadonly ? FormFieldType.Readonly : FormFieldType.Number,
        min: 0,
        maxLength: 20,
        formatter: formatDotNumber,
        placeholder: '0',
        valueFormatter: (v) => formatVndCurrency(v as any),
      },
      {
        name: 'monthlyDepreciation' as keyof T,
        label: 'Khấu hao tháng',
        type: FormFieldType.Readonly,
        dependencies: ['originalValue', 'depreciationMonths'],
        computedValue: (_form: FormInstance, vals: any) => {
          const orig = Number(vals.originalValue);
          const months = Number(vals.depreciationMonths);
          if (!isNaN(orig) && orig > 0 && !isNaN(months) && months > 0) {
            return Math.round((orig / months) * 100) / 100;
          }
          return undefined;
        },
        valueFormatter: (v) => formatVndCurrency(v as any),
      },
      {
        name: 'disposalMethod' as keyof T,
        label: 'Hình thức xử lý tài sản',
        type: FormFieldType.Select,
        placeholder: 'Chọn hình thức xử lý',
        options: DISPOSAL_METHOD_OPTIONS,
        allowClear: true,
        disabled: isReadonly,
      },
      ...(options?.extraFields || []),
    ],
  };
}

export interface AssetAdjustmentOperationSectionOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  key?: string;
  title?: string;
  selectedRecord?: {
    originalValue?: number | null;
    remainingValue?: number | null;
  } | null;
  operationMode?: 'increase' | 'decrease' | 'exploit';
  extraFields?: FormFieldConfig<T>[];
}

/**
 * Tạo Section "Giá trị & Khấu hao điều chỉnh" chuẩn dùng chung cho Form Tăng / Giảm nguyên giá tài sản.
 * Tự động gắn logic 5 bước tính Khấu hao lũy kế và Giá trị còn lại sau theo quy chuẩn năm nhuận/thường.
 */
export function createAssetAdjustmentOperationSection<T extends Record<string, unknown> = Record<string, unknown>>(
  options: AssetAdjustmentOperationSectionOptions<T>
): FormSectionConfig<T> {
  const selected = options.selectedRecord || {};
  const isIncrease = options.operationMode === 'increase';
  const actionLabel = isIncrease ? 'tăng' : 'giảm';

  const baseFields: FormFieldConfig<T>[] = [
    {
      name: 'originalValueBefore' as keyof T,
      label: 'Nguyên giá trước điều chỉnh',
      type: FormFieldType.Readonly,
      computedValue: () => selected.originalValue,
      valueFormatter: () =>
        formatVndCurrency(selected.originalValue) || '0 VNĐ',
    },
    {
      name: 'originalValue' as keyof T,
      label: `Nguyên giá sau khi ${actionLabel} (VNĐ)`,
      type: FormFieldType.Number,
      required: true,
      min: 0,
      maxLength: 20,
      formatter: formatDotNumber,
      placeholder: '0',
      rules: [{ required: true, message: 'Nguyên giá sau điều chỉnh là bắt buộc' }],
    },
    {
      name: 'remainingValueBefore' as keyof T,
      label: 'Giá trị còn lại trước điều chỉnh (VNĐ)',
      type: FormFieldType.Readonly,
      computedValue: () => selected.remainingValue,
      valueFormatter: () =>
        formatVndCurrency(selected.remainingValue) || '0 VNĐ',
    },
    {
      name: 'remainingValueAfter' as keyof T,
      label: `Giá trị còn lại sau khi ${actionLabel} (VNĐ)`,
      type: FormFieldType.Readonly,
      dependencies: [
        'originalValue',
        'originalValueAfter',
        'depreciationRate',
        'depreciationStartDate',
        'depreciationEndDate',
        'accumulatedDepreciation',
        'depreciationMonths',
      ],
      computedValue: (_form: FormInstance, vals: any) => {
        const origAfter = vals?.originalValue ?? vals?.originalValueAfter;
        const calc = calculateAssetAdjustmentValues({
          originalValueAfter: origAfter,
          depreciationRate: vals?.depreciationRate,
          depreciationStartDate: vals?.depreciationStartDate,
          depreciationEndDate: vals?.depreciationEndDate,
          accumulatedDepreciationManual: vals?.accumulatedDepreciation,
          depreciationMonths: vals?.depreciationMonths,
        });
        return calc.remainingValueAfter;
      },
      valueFormatter: (v) => formatVndCurrency(v as any),
    },
    {
      name: 'declarationDate' as keyof T,
      label: 'Ngày kê khai tài sản',
      type: FormFieldType.Date,
      placeholder: 'Chọn ngày kê khai',
    },
    {
      name: 'depreciationRate' as keyof T,
      label: 'Tỷ lệ hao mòn/Khấu hao (%)',
      type: FormFieldType.Number,
      min: 0,
      max: 100,
      maxLength: 5,
      placeholder: '0',
    },
    {
      name: 'assignmentDecisionNumber' as keyof T,
      label: 'Số quyết định giao (bao gồm cả tăng vốn)',
      type: FormFieldType.Text,
      placeholder: 'Nhập số quyết định',
    },
    {
      name: 'depreciationStartDate' as keyof T,
      label: 'Ngày tính khấu hao',
      type: FormFieldType.Date,
      placeholder: 'Chọn ngày tính',
    },
    {
      name: 'depreciationMonths' as keyof T,
      label: 'Số tháng tính khấu hao',
      type: FormFieldType.Number,
      min: 0,
      maxLength: 5,
      placeholder: '0',
    },
    {
      name: 'depreciationEndDate' as keyof T,
      label: 'Ngày hết khấu hao',
      type: FormFieldType.Date,
      placeholder: 'Chọn ngày hết',
    },
    {
      name: 'accumulatedDepreciation' as keyof T,
      label: 'Khấu hao lũy kế',
      type: FormFieldType.Number,
      required: true,
      min: 0,
      maxLength: 20,
      formatter: formatDotNumber,
      placeholder: '0',
      rules: [{ required: true, message: 'Khấu hao lũy kế là bắt buộc' }],
    },
    {
      name: 'disposalMethod' as keyof T,
      label: 'Hình thức xử lý tài sản',
      type: FormFieldType.Select,
      required: true,
      placeholder: 'Chọn hình thức xử lý',
      options: DISPOSAL_METHOD_OPTIONS,
      rules: [{ required: true, message: 'Hình thức xử lý tài sản là bắt buộc' }],
    },
    {
      name: 'monthlyDepreciation' as keyof T,
      label: 'Khấu hao tháng',
      type: FormFieldType.Readonly,
      dependencies: [
        'originalValue',
        'originalValueAfter',
        'depreciationRate',
        'depreciationStartDate',
        'depreciationEndDate',
        'accumulatedDepreciation',
        'depreciationMonths',
      ],
      computedValue: (_form: FormInstance, vals: any) => {
        const origAfter = vals?.originalValue ?? vals?.originalValueAfter;
        const calc = calculateAssetAdjustmentValues({
          originalValueAfter: origAfter,
          depreciationRate: vals?.depreciationRate,
          depreciationStartDate: vals?.depreciationStartDate,
          depreciationEndDate: vals?.depreciationEndDate,
          accumulatedDepreciationManual: vals?.accumulatedDepreciation,
          depreciationMonths: vals?.depreciationMonths,
        });
        return calc.monthlyDepreciation;
      },
      valueFormatter: (v) => formatVndCurrency(v as any),
    },
    {
      name: 'notes' as keyof T,
      label: 'Ghi chú điều chỉnh',
      type: FormFieldType.TextArea,
      rows: 3,
      placeholder: 'Nhập ghi chú điều chỉnh',
      colSpan: 24,
    },
  ];

  const extraFields = (options.extraFields || []).filter(
    (extra) => !baseFields.some((bf) => String(bf.name) === String(extra.name))
  );

  return {
    key: options.key || 'value_section',
    title: options.title || 'Giá trị & Khấu hao điều chỉnh',
    icon: <SlidersOutlined />,
    fields: [...baseFields, ...extraFields],
  };
}

/**
 * Hàm xử lý onValuesChange tự động tính và điền Khấu hao lũy kế mới
 * khi người dùng thay đổi Nguyên giá sau, Ngày tính, Ngày hết hoặc Tỷ lệ khấu hao.
 */
export function handleAssetAdjustmentValuesChange<T extends Record<string, unknown>>(
  form: FormInstance<T>,
  changedValues: Partial<T>,
  allValues: T
): void {
  const isDepInputChanged =
    'originalValue' in changedValues ||
    'originalValueAfter' in changedValues ||
    'depreciationRate' in changedValues ||
    'depreciationStartDate' in changedValues ||
    'depreciationEndDate' in changedValues ||
    'depreciationMonths' in changedValues;

  // Chỉ tự động cập nhật ô accumulatedDepreciation khi người dùng KHÔNG trực tiếp gõ vào ô đó
  if (isDepInputChanged && !('accumulatedDepreciation' in changedValues)) {
    const origAfter = (allValues as any)?.originalValue ?? (allValues as any)?.originalValueAfter;
    const calc = calculateAssetAdjustmentValues({
      originalValueAfter: origAfter,
      depreciationRate: (allValues as any)?.depreciationRate,
      depreciationStartDate: (allValues as any)?.depreciationStartDate,
      depreciationEndDate: (allValues as any)?.depreciationEndDate,
      depreciationMonths: (allValues as any)?.depreciationMonths,
    });

    if (calc.isAutoCalculated && calc.accumulatedDepreciation !== undefined) {
      form.setFieldValue('accumulatedDepreciation' as any, calc.accumulatedDepreciation);
    }
  }
}

export interface AssetAdjustmentFooterActionOptions {
  operationMode?: 'increase' | 'decrease' | 'exploit';
  isIncrease?: boolean;
  isExploit?: boolean;
  saving?: boolean;
  saveAction?: string;
  exploitSubmitLabel?: string;
  onSubmit: (targetAction?: any) => Promise<void> | void;
  onClose?: () => void;
}

/**
 * Tạo danh sách nút bấm footer dùng chung cho Drawer Biến động tài sản (Khai thác / Tăng / Giảm nguyên giá).
 * - Ở chế độ Tăng/Giảm nguyên giá: BỎ nút "Hủy", chỉ hiển thị 2 nút:
 *   1. "Lưu và gửi phê duyệt" (variant: 'primary')
 *   2. "Lưu và phê duyệt" (variant: 'success')
 * - Ở chế độ Khai thác: hiển thị nút "Hủy" (outline) và "Lưu khai thác" (primary).
 */
export function createAssetAdjustmentFooterActions(
  options: AssetAdjustmentFooterActionOptions
): FormSidebarAction[] {
  const { operationMode, isExploit, isIncrease, saving, saveAction, exploitSubmitLabel, onSubmit, onClose } = options;

  const isAdjustment =
    operationMode === 'increase' ||
    operationMode === 'decrease' ||
    Boolean(isExploit === false && isIncrease !== undefined);

  if (isAdjustment) {
    return [
      {
        key: 'submit_approval',
        label: 'Lưu và gửi phê duyệt',
        variant: 'primary',
        loading: Boolean(saving && saveAction === 'PENDING_APPROVAL'),
        onClick: () => void onSubmit('PENDING_APPROVAL'),
      },
      {
        key: 'submit_approve',
        label: 'Lưu và phê duyệt',
        variant: 'success',
        loading: Boolean(saving && saveAction === 'APPROVED'),
        onClick: () => void onSubmit('APPROVED'),
      },
    ];
  }

  return [
    ...(onClose
      ? [
          {
            key: 'cancel',
            label: 'Hủy',
            variant: 'outline' as const,
            onClick: onClose,
          },
        ]
      : []),
    {
      key: 'submit',
      label: exploitSubmitLabel || 'Lưu khai thác',
      variant: 'primary' as const,
      loading: Boolean(saving),
      onClick: () => void onSubmit(),
    },
  ];
}

