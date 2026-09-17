import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { DaiTtdhAsset } from '../../services/daiTtdhAsset/types';
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
  /** Nguyên giá sau khi tăng/giảm — khóa chuẩn của section dùng chung asset-value. */
  originalValue?: number;
  remainingValueBefore?: number;
  /** Giá trị còn lại sau điều chỉnh — khóa chuẩn của section dùng chung asset-value. */
  remainingValue?: number;
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
  INCREASE_REASON_OPTIONS,
} from '../../constants/assetDropdown';
import { fmtInputNumber } from '../../utils/numFmt';

export interface DaiTtdhAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: DaiTtdhAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

export default function DaiTtdhAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  onClose,
  onSubmit,
}: DaiTtdhAssetOperationFormProps) {
  const isExploit = operationMode === 'exploit';
  const isIncrease = operationMode === 'increase';

  const sections = useMemo<FormSectionConfig<OperationValues>[]>(() => {
    if (isExploit) {
      return [
        {
          key: 'exploit_info',
          title: 'Thông tin khai thác tài sản đài TTDH',
          icon: <RocketOutlined />,
          fields: [
            {
              name: 'operatorOrgUnitId',
              label: 'Đơn vị khai thác',
              type: FormFieldType.TreeSelect,
              organizations,
              required: true,
              rules: [{ required: true, message: 'Vui lòng chọn đơn vị khai thác' }],
              placeholder: 'Chọn đơn vị khai thác',
            },
            {
              name: 'assetCategory',
              label: 'Danh mục tài sản',
              type: FormFieldType.Readonly,
              initialValue: [selected?.assetCode, selected?.assetName].filter(Boolean).join(' - '),
              valueFormatter: () =>
                [selected?.assetCode, selected?.assetName].filter(Boolean).join(' - ') || '—',
            },
            {
              name: 'unitOfMeasure',
              label: 'Đơn vị tính',
              type: FormFieldType.Select,
              required: true,
              placeholder: 'Chọn đơn vị tính',
              options: ASSET_QUANTITY_UNIT_OPTIONS,
              rules: [{ required: true, message: 'Đơn vị tính là bắt buộc' }],
            },
            {
              name: 'quantity',
              label: 'Số lượng khai thác',
              type: FormFieldType.Number,
              required: true,
              min: 1,
              formatter: fmtInputNumber,
              placeholder: '0',
              rules: [{ required: true, message: 'Số lượng là bắt buộc' }],
            },
            {
              name: 'exploitationDeadline',
              label: 'Thời hạn khai thác',
              type: FormFieldType.Date,
              required: true,
              placeholder: 'Chọn thời hạn kết thúc khai thác',
              rules: [{ required: true, message: 'Thời hạn khai thác là bắt buộc' }],
            },
            {
              name: 'totalRevenue',
              label: 'Tổng tiền thu được (VNĐ)',
              type: FormFieldType.Number,
              required: true,
              min: 0,
              formatter: fmtInputNumber,
              placeholder: '0',
              rules: [{ required: true, message: 'Tổng số tiền thu được là bắt buộc' }],
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
              label: 'Nộp ngân sách nhà nước (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              formatter: fmtInputNumber,
              placeholder: '0',
            },
            {
              name: 'projectAmount',
              label: 'Số tiền thực hiện dự án (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              formatter: fmtInputNumber,
              placeholder: '0',
            },
            {
              name: 'operatingTime',
              label: 'Thời gian vận hành',
              type: FormFieldType.Text,
              placeholder: 'vd: 24/7, Theo ca trực',
            },
            {
              name: 'notes',
              label: 'Ghi chú khai thác',
              type: FormFieldType.TextArea,
              placeholder: 'Nhập ghi chú chi tiết phương án khai thác',
              colSpan: 24,
            },
          ],
        },
      ];
    }

    const reasonOptions = isIncrease ? INCREASE_REASON_OPTIONS : DECREASE_REASON_OPTIONS;

    return [
      {
        key: 'adjustment_decision',
        title: isIncrease ? 'Quyết định tăng nguyên giá' : 'Quyết định giảm nguyên giá',
        icon: <AuditOutlined />,
        fields: [
          {
            name: 'decisionNumber',
            label: 'Số quyết định',
            type: FormFieldType.Text,
            required: true,
            rules: [{ required: true, message: 'Vui lòng nhập số quyết định' }],
            placeholder: 'Nhập số quyết định điều chỉnh',
          },
          {
            name: 'decisionDate',
            label: 'Ngày ra quyết định',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày ban hành quyết định',
          },
          {
            name: 'adjustmentDate',
            label: 'Ngày điều chỉnh nguyên giá',
            type: FormFieldType.Date,
            required: true,
            rules: [{ required: true, message: 'Vui lòng chọn ngày thực hiện điều chỉnh' }],
            placeholder: 'Chọn ngày ghi nhận biến động',
          },
          {
            name: 'adjustmentReason',
            label: 'Lý do điều chỉnh',
            type: FormFieldType.Select,
            options: reasonOptions,
            placeholder: 'Chọn lý do',
            required: true,
            rules: [{ required: true, message: 'Lý do điều chỉnh là bắt buộc' }],
          },
        ],
      },
      createAssetAdjustmentOperationSection<OperationValues>({
        selectedRecord: selected,
        operationMode,
      }),
    ];
  }, [isExploit, isIncrease, organizations, operationMode, selected]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    return [
      {
        key: 'cancel',
        label: 'Đóng',
        variant: 'outline',
        onClick: onClose,
      },
      {
        key: 'submit',
        label: isExploit
          ? 'Lưu thông tin khai thác'
          : isIncrease
            ? 'Lưu tăng nguyên giá'
            : 'Lưu giảm nguyên giá',
        variant: isIncrease ? 'success' : isExploit ? 'primary' : 'danger',
        loading: saving,
        onClick: () => void onSubmit(),
      },
    ];
  }, [isExploit, isIncrease, saving, onClose, onSubmit]);

  const title = isExploit
    ? `Khai thác tài sản đài TTDH — ${selected?.assetName || ''}`
    : isIncrease
      ? `Tăng nguyên giá tài sản — ${selected?.assetName || ''}`
      : `Giảm nguyên giá tài sản — ${selected?.assetName || ''}`;

  return (
    <DynamicFormSidebar<OperationValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      sections={sections}
      footerActions={footerActions}
      footerAlign="center"
      onValuesChange={(changed, all) => {
        handleAssetAdjustmentValuesChange(form, changed, all);
      }}
      rootClassName="daittdh-asset-operation-drawer"
      className="daittdh-asset-operation-drawer"
    />
  );
}
