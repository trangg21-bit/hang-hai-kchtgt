import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { CctvSystemAsset } from '../../services/cctvasset/types';
import { fmtInputNumber } from '../../utils/numFmt';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSectionConfig,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';
import {
  ASSET_QUANTITY_UNIT_OPTIONS,
  DECREASE_REASON_OPTIONS,
  INCREASE_REASON_OPTIONS,
  DISPOSAL_METHOD_OPTIONS,
} from '../../constants/assetDropdown';

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

export interface CctvSystemAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: CctvSystemAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

export default function CctvSystemAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  onClose,
  onSubmit,
}: CctvSystemAssetOperationFormProps) {
  const isExploit = operationMode === 'exploit';
  const isIncrease = operationMode === 'increase';

  const modalTitle = isExploit
    ? `Khai thác tài sản — ${selected?.assetName || ''}`
    : isIncrease
    ? `Tăng nguyên giá tài sản — ${selected?.assetName || ''}`
    : `Giảm nguyên giá tài sản — ${selected?.assetName || ''}`;

  const tabs = useMemo<FormTabConfig<OperationValues>[]>(() => {
    if (!operationMode) return [];

    if (isExploit) {
      return [
        {
          key: 'exploit_tab',
          label: 'Hồ sơ khai thác',
          icon: <RocketOutlined />,
          sections: [
            {
              key: 'exploit_section',
              title: 'Thông tin khai thác tài sản',
              fields: [
                {
                  name: 'operatorOrgUnitId',
                  label: 'Đơn vị khai thác',
                  type: FormFieldType.TreeSelect,
                  organizations,
                  required: true,
                  rules: [{ required: true, message: 'Vui lòng chọn đơn vị khai thác' }],
                  placeholder: 'Chọn đơn vị...',
                  colSpan: 12,
                },
                {
                  name: 'exploitationDeadline',
                  label: 'Thời hạn khai thác',
                  type: FormFieldType.Date,
                  required: true,
                  rules: [{ required: true, message: 'Vui lòng chọn thời hạn khai thác' }],
                  placeholder: 'Chọn thời hạn...',
                  colSpan: 12,
                },
                {
                  name: 'unitOfMeasure',
                  label: 'Đơn vị tính',
                  type: FormFieldType.Select,
                  required: true,
                  rules: [{ required: true, message: 'Vui lòng chọn đơn vị tính' }],
                  placeholder: 'Chọn đơn vị tính...',
                  options: ASSET_QUANTITY_UNIT_OPTIONS,
                  colSpan: 12,
                },
                {
                  name: 'quantity',
                  label: 'Số lượng',
                  type: FormFieldType.Number,
                  min: 1,
                  required: true,
                  rules: [{ required: true, message: 'Vui lòng nhập số lượng' }],
                  formatter: fmtInputNumber,
                  placeholder: '1',
                  colSpan: 12,
                },
                {
                  name: 'totalRevenue',
                  label: 'Tổng số tiền thu được (VNĐ)',
                  type: FormFieldType.Number,
                  min: 0,
                  required: true,
                  rules: [{ required: true, message: 'Vui lòng nhập tổng số tiền thu được' }],
                  formatter: fmtInputNumber,
                  placeholder: '0',
                  colSpan: 12,
                },
                {
                  name: 'relatedCosts',
                  label: 'Chi phí có liên quan (VNĐ)',
                  type: FormFieldType.Number,
                  min: 0,
                  formatter: fmtInputNumber,
                  placeholder: '0',
                  colSpan: 12,
                },
                {
                  name: 'stateBudgetPayment',
                  label: 'Nộp NSNN (VNĐ)',
                  type: FormFieldType.Number,
                  min: 0,
                  formatter: fmtInputNumber,
                  placeholder: '0',
                  colSpan: 12,
                },
                {
                  name: 'projectAmount',
                  label: 'Số tiền thực hiện dự án (VNĐ)',
                  type: FormFieldType.Number,
                  min: 0,
                  formatter: fmtInputNumber,
                  placeholder: '0',
                  colSpan: 12,
                },
                {
                  name: 'notes',
                  label: 'Ghi chú (khai thác)',
                  type: FormFieldType.Text,
                  placeholder: 'Nhập ghi chú',
                  colSpan: 24,
                },
              ],
            },
          ],
        },
      ];
    }

    const reasonOptions = isIncrease ? INCREASE_REASON_OPTIONS : DECREASE_REASON_OPTIONS;

    const sections: FormSectionConfig<OperationValues>[] = [
      {
        key: 'adjustment_main',
        title: isIncrease ? 'Quyết định tăng nguyên giá' : 'Quyết định giảm nguyên giá',
        fields: [
          {
            name: 'decisionNumber',
            label: 'Số QĐ tăng/giảm nguyên giá',
            type: FormFieldType.Text,
            required: true,
            placeholder: 'Nhập số quyết định...',
            rules: [{ required: true, message: 'Vui lòng nhập số quyết định' }],
            colSpan: 12,
          },
          {
            name: 'decisionDate',
            label: 'Ngày ra QĐ tăng/giảm',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày...',
            colSpan: 12,
          },
          {
            name: 'adjustmentDate',
            label: isIncrease ? 'Ngày tăng nguyên giá' : 'Ngày giảm nguyên giá',
            type: FormFieldType.Date,
            required: true,
            placeholder: 'Chọn ngày...',
            rules: [{ required: true, message: 'Vui lòng chọn ngày tăng/giảm' }],
            colSpan: 12,
          },
          {
            name: 'adjustmentReason',
            label: 'Lý do tăng/giảm nguyên giá',
            type: FormFieldType.Select,
            required: true,
            placeholder: 'Chọn lý do...',
            options: reasonOptions,
            rules: [{ required: true, message: 'Vui lòng chọn lý do' }],
            colSpan: 12,
          },
          {
            name: 'originalValue',
            label: isIncrease ? 'Nguyên giá sau khi tăng (VNĐ)' : 'Nguyên giá sau khi giảm (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            formatter: fmtInputNumber,
            required: true,
            placeholder: '0',
            rules: [{ required: true, message: 'Vui lòng nhập nguyên giá sau thay đổi' }],
            colSpan: 12,
          },
          {
            name: 'accumulatedDepreciation',
            label: 'Khấu hao lũy kế sau thay đổi (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            required: true,
            rules: [{ required: true, message: 'Khấu hao lũy kế là bắt buộc' }],
            formatter: fmtInputNumber,
            placeholder: '0',
            colSpan: 12,
          },
          {
            name: 'notes',
            label: 'Ghi chú (điều chỉnh)',
            type: FormFieldType.Text,
            placeholder: 'Nhập ghi chú',
            colSpan: 24,
          },
        ],
      },
      {
        key: 'depreciation_info',
        title: 'Thông tin tính khấu hao cập nhật',
        fields: [
          {
            name: 'declarationDate',
            label: 'Ngày kê khai tài sản',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày...',
            colSpan: 12,
          },
          {
            name: 'depreciationRate',
            label: 'Tỷ lệ hao mòn/Khấu hao (%)',
            type: FormFieldType.Number,
            min: 0,
            max: 100,
            placeholder: '0',
            colSpan: 12,
          },
          {
            name: 'assignmentDecisionNumber',
            label: 'Số quyết định giao (bao gồm cả tăng vốn)',
            type: FormFieldType.Text,
            placeholder: 'Nhập số QĐ giao...',
            colSpan: 12,
          },
          {
            name: 'depreciationStartDate',
            label: 'Ngày tính khấu hao',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày...',
            colSpan: 12,
          },
          {
            name: 'depreciationMonths',
            label: 'Số tháng tính khấu hao',
            type: FormFieldType.Number,
            min: 0,
            placeholder: 'Nhập số tháng...',
            colSpan: 12,
          },
          {
            name: 'depreciationEndDate',
            label: 'Ngày hết khấu hao',
            type: FormFieldType.Date,
            placeholder: 'Chọn ngày...',
            colSpan: 12,
          },
          {
            name: 'disposalMethod',
            label: 'Hình thức xử lý tài sản',
            type: FormFieldType.Select,
            placeholder: 'Chọn hình thức xử lý...',
            options: DISPOSAL_METHOD_OPTIONS,
            colSpan: 12,
          },
        ],
      },
    ];

    return [
      {
        key: 'adjustment_tab',
        label: isIncrease ? 'Tăng nguyên giá' : 'Giảm nguyên giá',
        icon: isIncrease ? <SlidersOutlined /> : <AuditOutlined />,
        sections,
      },
    ];
  }, [operationMode, isExploit, isIncrease, organizations]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    return [
      {
        key: 'cancel',
        label: 'Đóng',
        onClick: onClose,
        disabled: saving,
      },
      {
        key: 'submit',
        label: isExploit ? 'Lưu hồ sơ khai thác' : 'Lưu lại',
        variant: 'primary',
        loading: saving,
        onClick: onSubmit,
      },
    ];
  }, [isExploit, saving, onClose, onSubmit]);

  return (
    <DynamicFormSidebar<OperationValues>
      open={open}
      title={modalTitle}
      form={form}
      tabs={tabs}
      footerActions={footerActions}
      footerAlign="center"
      onClose={onClose}
      rootClassName="cctv-asset-drawer-scope"
    />
  );
}
