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
import type { InmarsatAsset } from '../../services/inmarsatAsset/types';
import type { Organization } from '../../services/organizationService';

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

export interface InmarsatAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: InmarsatAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  saveAction?: string;
  onClose: () => void;
  onSubmit: (targetAction?: any) => Promise<void> | void;
}

export default function InmarsatAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  saveAction,
  onClose,
  onSubmit,
}: InmarsatAssetOperationFormProps) {
  const isExploit = operationMode === 'exploit';
  const isIncrease = operationMode === 'increase';
  const reasonOptions = isIncrease ? INCREASE_REASON_OPTIONS : DECREASE_REASON_OPTIONS;

  const sections = useMemo<FormSectionConfig<OperationValues>[]>(() => {
    if (isExploit) {
      return [
        {
          key: 'exploit_info',
          title: 'Thông tin khai thác tài sản đài Inmarsat',
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
              rules: [{ required: true, message: 'Vui lòng chọn đơn vị tính' }],
              placeholder: 'Chọn đơn vị tính',
              options: ASSET_QUANTITY_UNIT_OPTIONS,
            },
            {
              name: 'quantity',
              label: 'Số lượng khai thác',
              type: FormFieldType.Number,
              min: 1,
              maxLength: 5,
              required: true,
              rules: [{ required: true, message: 'Vui lòng nhập số lượng' }],
              placeholder: '1',
            },
            {
              name: 'exploitationDeadline',
              label: 'Thời hạn khai thác',
              type: FormFieldType.Date,
              required: true,
              rules: [{ required: true, message: 'Vui lòng chọn thời hạn khai thác' }],
              placeholder: 'Chọn thời hạn kết thúc khai thác',
            },
            {
              name: 'totalRevenue',
              label: 'Tổng tiền thu được (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              maxLength: 20,
              required: true,
              rules: [{ required: true, message: 'Vui lòng nhập tổng tiền thu được' }],
              placeholder: '0',
            },
            {
              name: 'relatedCosts',
              label: 'Chi phí có liên quan (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              maxLength: 20,
              placeholder: '0',
            },
            {
              name: 'stateBudgetPayment',
              label: 'Nộp ngân sách nhà nước (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              maxLength: 20,
              placeholder: '0',
            },
            {
              name: 'projectAmount',
              label: 'Số tiền thực hiện dự án (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              maxLength: 20,
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
  }, [isExploit, isIncrease, reasonOptions, organizations, operationMode, selected]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    return createAssetAdjustmentFooterActions({
      operationMode,
      saving,
      saveAction,
      onClose,
      onSubmit,
      exploitSubmitLabel: 'Lưu thông tin khai thác',
    });
  }, [operationMode, saving, saveAction, onClose, onSubmit]);

  const title = isExploit
    ? `Khai thác tài sản đài Inmarsat — ${selected?.assetName || ''}`
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
      onValuesChange={(changed, all) => {
        handleAssetAdjustmentValuesChange(form, changed, all);
      }}
      rootClassName="inmarsat-asset-operation-drawer"
      className="inmarsat-asset-operation-drawer"
    />
  );
}
