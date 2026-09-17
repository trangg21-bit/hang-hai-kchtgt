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
import {
  ASSET_QUANTITY_UNIT_OPTIONS,
  DECREASE_REASON_OPTIONS,
  DISPOSAL_METHOD_OPTIONS,
  INCREASE_REASON_OPTIONS,
} from '../../constants/assetDropdown';
import type { Organization } from '../../services/organizationService';
import type { RadarStationAsset } from '../../services/radarasset/types';
import { fmtInputNumber } from '../../utils/numFmt';

export type OperationMode = 'exploit' | 'increase' | 'decrease';

export interface OperationValues extends Record<string, unknown> {
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

export interface RadarStationAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: RadarStationAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  saveAction?: string;
  onClose: () => void;
  onSubmit: (targetAction?: any) => Promise<void> | void;
}

export default function RadarStationAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  saveAction,
  onClose,
  onSubmit,
}: RadarStationAssetOperationFormProps) {
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
              rules: [{ required: true, message: 'Vui lòng chọn đơn vị tính' }],
              options: ASSET_QUANTITY_UNIT_OPTIONS,
            },
            {
              name: 'quantity',
              label: 'Số lượng',
              type: FormFieldType.Number,
              maxLength: 5,
              min: 1,
              required: true,
              rules: [{ required: true, message: 'Vui lòng nhập số lượng' }],
              formatter: fmtInputNumber,
              placeholder: '1',
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
              maxLength: 20,
              min: 0,
              required: true,
              rules: [{ required: true, message: 'Vui lòng nhập tổng số tiền thu được' }],
              formatter: fmtInputNumber,
              placeholder: '0',
            },
            {
              name: 'relatedCosts',
              label: 'Chi phí có liên quan (VNĐ)',
              type: FormFieldType.Number,
              maxLength: 20,
              min: 0,
              formatter: fmtInputNumber,
              placeholder: '0',
            },
            {
              name: 'stateBudgetPayment',
              label: 'Nộp NSNN (VNĐ)',
              type: FormFieldType.Number,
              maxLength: 20,
              min: 0,
              formatter: fmtInputNumber,
              placeholder: '0',
            },
            {
              name: 'projectAmount',
              label: 'Số tiền được thực hiện dự án (VNĐ)',
              type: FormFieldType.Number,
              maxLength: 20,
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
    const reasonOptions = isIncrease ? INCREASE_REASON_OPTIONS : DECREASE_REASON_OPTIONS;

    return [
      {
        key: 'decision_section',
        title: `Quyết định ${actionLabel} nguyên giá`,
        icon: <AuditOutlined />,
        fields: [
          {
            name: 'decisionNumber',
            label: `Số QĐ ${actionLabel} nguyên giá`,
            type: FormFieldType.Text,
            required: true,
            placeholder: 'Nhập số quyết định',
            rules: [{ required: true, message: `Số QĐ ${actionLabel} nguyên giá là bắt buộc` }],
          },
          {
            name: 'decisionDate',
            label: 'Ngày ra QĐ',
            type: FormFieldType.Date,
            required: true,
            placeholder: 'Chọn ngày ra QĐ',
            rules: [{ required: true, message: 'Ngày ra QĐ là bắt buộc' }],
          },
          {
            name: 'adjustmentDate',
            label: `Ngày ${actionLabel} nguyên giá`,
            type: FormFieldType.Date,
            required: true,
            placeholder: `Chọn ngày ${actionLabel}`,
            rules: [{ required: true, message: `Ngày ${actionLabel} nguyên giá là bắt buộc` }],
          },
          {
            name: 'adjustmentReason',
            label: `Lý do ${actionLabel} nguyên giá`,
            type: FormFieldType.Select,
            required: true,
            placeholder: 'Chọn lý do',
            options: reasonOptions,
            rules: [{ required: true, message: `Lý do ${actionLabel} nguyên giá là bắt buộc` }],
          },
          {
            name: 'notes',
            label: 'Ghi chú (điều chỉnh)',
            type: FormFieldType.TextArea,
            rows: 2,
            placeholder: 'Nhập ghi chú điều chỉnh',
            colSpan: 24,
          },
        ],
      },
      {
        key: 'value_section',
        title: 'Biến động giá trị',
        icon: <SlidersOutlined />,
        fields: [
          {
            name: 'origBefore' as keyof OperationValues,
            label: `Nguyên giá trước khi ${actionLabel} (VNĐ)`,
            type: FormFieldType.Readonly,
            valueFormatter: () => (selected.originalValue ? fmtInputNumber(selected.originalValue) : '0'),
          },
          {
            name: 'originalValue',
            label: `Nguyên giá sau khi ${actionLabel} (VNĐ)`,
            type: FormFieldType.Number,
            maxLength: 20,
            required: true,
            min: 0,
            formatter: fmtInputNumber,
            placeholder: '0',
            rules: [
              {
                required: true,
                message: `Nguyên giá sau khi ${actionLabel} là bắt buộc`,
              },
              () => ({
                validator(_, value) {
                  if (value == null || value === '') return Promise.resolve();
                  const num = Number(value);
                  const cur = selected.originalValue || 0;
                  if (isIncrease && num <= cur) {
                    return Promise.reject(
                      new Error('Nguyên giá sau tăng phải lớn hơn nguyên giá hiện tại')
                    );
                  }
                  if (!isIncrease && num >= cur) {
                    return Promise.reject(
                      new Error('Nguyên giá sau giảm phải nhỏ hơn nguyên giá hiện tại')
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ],
          },
          {
            name: 'remBefore' as keyof OperationValues,
            label: `Giá trị còn lại trước khi ${actionLabel} (VNĐ)`,
            type: FormFieldType.Readonly,
            valueFormatter: () => (selected.remainingValue ? fmtInputNumber(selected.remainingValue) : '0'),
          },
          {
            name: 'remAfter' as keyof OperationValues,
            label: `Giá trị còn lại sau khi ${actionLabel} (VNĐ)`,
            type: FormFieldType.Readonly,
            dependencies: ['originalValue', 'accumulatedDepreciation'],
            valueFormatter: (formInstance: FormInstance) => {
              const orig = Number(formInstance.getFieldValue('originalValue')) || 0;
              const acc =
                Number(formInstance.getFieldValue('accumulatedDepreciation')) ||
                Number(selected.accumulatedDepreciation) ||
                0;
              return fmtInputNumber(Math.max(0, orig - acc));
            },
          },
        ],
      },
      {
        key: 'detail_section',
        title: 'Thông tin chi tiết tài sản sau điều chỉnh',
        icon: <AuditOutlined />,
        fields: [
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
            placeholder: '0',
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
            maxLength: 5,
            min: 0,
            placeholder: 'Nhập số tháng',
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
            maxLength: 20,
            min: 0,
            required: true,
            rules: [{ required: true, message: 'Khấu hao lũy kế là bắt buộc' }],
            formatter: fmtInputNumber,
            placeholder: '0',
          },
          {
            name: 'monthlyDepreciation' as keyof OperationValues,
            label: 'Khấu hao tháng (VNĐ)',
            type: FormFieldType.Readonly,
            dependencies: ['originalValue', 'depreciationMonths'],
            valueFormatter: (formInstance: FormInstance) => {
              const orig = Number(formInstance.getFieldValue('originalValue')) || 0;
              const months = Number(formInstance.getFieldValue('depreciationMonths')) || 0;
              if (!orig || !months) return '0';
              return fmtInputNumber(Math.round(orig / months));
            },
          },
          {
            name: 'disposalMethod',
            label: 'Hình thức xử lý tài sản',
            type: FormFieldType.Select,
            required: true,
            rules: [{ required: true, message: 'Hình thức xử lý tài sản là bắt buộc' }],
            placeholder: 'Chọn hình thức xử lý',
            options: DISPOSAL_METHOD_OPTIONS,
          },
        ],
      },
    ];
  }, [operationMode, organizations, selected]);

  const tabs = useMemo<FormTabConfig<OperationValues>[]>(() => {
    if (!sections.length) return [];
    return [
      {
        key: 'main',
        label: 'Thông tin thực hiện',
        icon: <AuditOutlined />,
        sections,
      },
    ];
  }, [sections]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    return createAssetAdjustmentFooterActions({
      operationMode,
      saving,
      saveAction,
      onClose,
      onSubmit,
      exploitSubmitLabel: 'Lưu lại',
    });
  }, [operationMode, saving, saveAction, onClose, onSubmit]);

  return (
    <DynamicFormSidebar<OperationValues>
      open={open}
      title={title}
      form={form}
      tabs={tabs}
      footerActions={footerActions}
      footerAlign="center"
      onClose={onClose}
      rootClassName="radar-asset-drawer-scope"
    />
  );
}
