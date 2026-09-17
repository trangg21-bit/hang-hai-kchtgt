import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { ScadaSystemAsset } from '../../services/scadaasset/types';
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
  INCREASE_REASON_OPTIONS,
  DECREASE_REASON_OPTIONS,
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

export interface ScadaSystemAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: ScadaSystemAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

export default function ScadaSystemAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  onClose,
  onSubmit,
}: ScadaSystemAssetOperationFormProps) {
  const isExploit = operationMode === 'exploit';
  const isIncrease = operationMode === 'increase';

  const title = useMemo(() => {
    const assetSuffix = selected ? ` — ${selected.assetCode || ''} ${selected.assetName || ''}` : '';
    if (isExploit) return `Khai thác tài sản hệ thống SCADA${assetSuffix}`;
    if (isIncrease) return `Tăng nguyên giá tài sản hệ thống SCADA${assetSuffix}`;
    return `Giảm nguyên giá tài sản hệ thống SCADA${assetSuffix}`;
  }, [isExploit, isIncrease, selected]);

  const exploitSections = useMemo<FormSectionConfig[]>(() => [
    {
      title: 'Thông tin hồ sơ khai thác',
      fields: [
        {
          name: 'operatorOrgUnitId',
          label: 'Đơn vị khai thác',
          type: FormFieldType.TreeSelect,
          organizations,
          placeholder: 'Chọn đơn vị khai thác',
          required: true,
          rules: [{ required: true, message: 'Vui lòng chọn đơn vị khai thác' }],
          colSpan: 12,
        },
        {
          name: 'unitOfMeasure',
          label: 'Đơn vị tính',
          type: FormFieldType.Select,
          required: true,
          rules: [{ required: true, message: 'Vui lòng chọn đơn vị tính' }],
          options: ASSET_QUANTITY_UNIT_OPTIONS,
          placeholder: 'Chọn đơn vị tính',
          colSpan: 12,
        },
        {
          name: 'quantity',
          label: 'Số lượng',
          type: FormFieldType.Number,
          min: 1,
          required: true,
          rules: [{ required: true, message: 'Vui lòng nhập số lượng' }],
          placeholder: 'Nhập số lượng',
          colSpan: 12,
        },
        {
          name: 'exploitationDeadline',
          label: 'Thời hạn khai thác',
          type: FormFieldType.Date,
          placeholder: 'Chọn thời hạn khai thác',
          colSpan: 12,
        },
      ],
    },
    {
      title: 'Số liệu tài chính khai thác',
      fields: [
        {
          name: 'totalRevenue',
          label: 'Tổng số tiền thu được (VNĐ)',
          type: FormFieldType.Number,
          min: 0,
          required: true,
          rules: [{ required: true, message: 'Vui lòng nhập số tiền thu được' }],
          placeholder: 'Nhập số tiền thu được',
          colSpan: 12,
          inputNumberProps: fmtInputNumber,
        },
        {
          name: 'relatedCosts',
          label: 'Chi phí có liên quan (VNĐ)',
          type: FormFieldType.Number,
          placeholder: 'Nhập chi phí liên quan',
          colSpan: 12,
          inputNumberProps: fmtInputNumber,
        },
        {
          name: 'stateBudgetPayment',
          label: 'Nộp NSNN (VNĐ)',
          type: FormFieldType.Number,
          placeholder: 'Nhập số tiền nộp NSNN',
          colSpan: 12,
          inputNumberProps: fmtInputNumber,
        },
        {
          name: 'projectAmount',
          label: 'Số tiền được thực hiện dự án (VNĐ)',
          type: FormFieldType.Number,
          placeholder: 'Nhập số tiền thực hiện dự án',
          colSpan: 12,
          inputNumberProps: fmtInputNumber,
        },
        {
          name: 'notes',
          label: 'Ghi chú (khai thác)',
          type: FormFieldType.TextArea,
          rows: 2,
          placeholder: 'Nhập ghi chú',
          colSpan: 24,
        },
      ],
    },
  ], [organizations]);

  const reasonOptions = isIncrease ? INCREASE_REASON_OPTIONS : DECREASE_REASON_OPTIONS;

  const adjustmentSections = useMemo<FormSectionConfig[]>(() => [
    {
      title: isIncrease ? 'Thông tin tăng nguyên giá' : 'Thông tin giảm nguyên giá',
      fields: [
        {
          name: 'decisionNumber',
          label: isIncrease ? 'Số QĐ tăng nguyên giá' : 'Số QĐ giảm nguyên giá',
          type: FormFieldType.Text,
          placeholder: 'Nhập số quyết định',
          required: true,
          rules: [{ required: true, message: 'Vui lòng nhập số quyết định' }],
          colSpan: 12,
        },
        {
          name: 'decisionDate',
          label: isIncrease ? 'Ngày ra QĐ tăng nguyên giá' : 'Ngày ra QĐ giảm nguyên giá',
          type: FormFieldType.Date,
          placeholder: 'Chọn ngày ra quyết định',
          colSpan: 12,
        },
        {
          name: 'adjustmentDate',
          label: isIncrease ? 'Ngày tăng nguyên giá' : 'Ngày giảm nguyên giá',
          type: FormFieldType.Date,
          placeholder: 'Chọn ngày điều chỉnh',
          colSpan: 12,
        },
        {
          name: 'adjustmentReason',
          label: isIncrease ? 'Lý do tăng nguyên giá' : 'Lý do giảm nguyên giá',
          type: FormFieldType.Select,
          required: true,
          rules: [{ required: true, message: 'Vui lòng chọn lý do' }],
          options: reasonOptions,
          placeholder: 'Chọn lý do',
          colSpan: 12,
        },
        {
          name: 'notes',
          label: 'Ghi chú (điều chỉnh)',
          type: FormFieldType.TextArea,
          rows: 2,
          placeholder: 'Nhập ghi chú',
          colSpan: 24,
        },
      ],
    },
    {
      title: 'Thông tin nguyên giá & Khấu hao sau điều chỉnh',
      fields: [
        {
          name: 'originalValue',
          label: isIncrease ? 'Nguyên giá mới sau khi tăng (VNĐ)' : 'Nguyên giá mới sau khi giảm (VNĐ)',
          type: FormFieldType.Number,
          placeholder: 'Nhập nguyên giá mới',
          required: true,
          rules: [{ required: true, message: 'Vui lòng nhập nguyên giá mới' }],
          colSpan: 12,
          inputNumberProps: fmtInputNumber,
        },
        {
          name: 'depreciationRate',
          label: 'Tỷ lệ hao mòn/Khấu hao (%)',
          type: FormFieldType.Number,
          placeholder: 'Nhập tỷ lệ',
          colSpan: 12,
        },
        {
          name: 'declarationDate',
          label: 'Ngày kê khai tài sản',
          type: FormFieldType.Date,
          placeholder: 'Chọn ngày kê khai',
          colSpan: 12,
        },
        {
          name: 'assignmentDecisionNumber',
          label: 'Số quyết định giao (bao gồm cả tăng vốn)',
          type: FormFieldType.Text,
          placeholder: 'Nhập số quyết định giao',
          colSpan: 12,
        },
        {
          name: 'depreciationStartDate',
          label: 'Ngày tính khấu hao',
          type: FormFieldType.Date,
          placeholder: 'Chọn ngày tính khấu hao',
          colSpan: 12,
        },
        {
          name: 'depreciationMonths',
          label: 'Số tháng tính khấu hao',
          type: FormFieldType.Number,
          placeholder: 'Nhập số tháng',
          colSpan: 12,
        },
        {
          name: 'depreciationEndDate',
          label: 'Ngày hết khấu hao',
          type: FormFieldType.Date,
          placeholder: 'Chọn ngày hết khấu hao',
          colSpan: 12,
        },
        {
          name: 'accumulatedDepreciation',
          label: 'Khấu hao lũy kế (VNĐ)',
          type: FormFieldType.Number,
          required: true,
          rules: [{ required: true, message: 'Khấu hao lũy kế là bắt buộc' }],
          placeholder: 'Nhập khấu hao lũy kế',
          colSpan: 12,
          inputNumberProps: fmtInputNumber,
        },
      ],
    },
  ], [isIncrease, reasonOptions]);

  const tabs = useMemo<FormTabConfig[]>(() => {
    if (isExploit) {
      return [
        {
          key: 'exploitTab',
          label: 'Khai thác tài sản',
          icon: <RocketOutlined />,
          sections: exploitSections,
        },
      ];
    }
    return [
      {
        key: 'adjustmentTab',
        label: isIncrease ? 'Tăng nguyên giá' : 'Giảm nguyên giá',
        icon: isIncrease ? <SlidersOutlined /> : <AuditOutlined />,
        sections: adjustmentSections,
      },
    ];
  }, [isExploit, isIncrease, exploitSections, adjustmentSections]);

  const sidebarActions = useMemo<FormSidebarAction[]>(() => [
    {
      key: 'submit',
      label: isExploit ? 'Lưu hồ sơ khai thác' : isIncrease ? 'Tạo yêu cầu tăng nguyên giá' : 'Tạo yêu cầu giảm nguyên giá',
      variant: 'primary',
      loading: saving,
      onClick: onSubmit,
    },
  ], [isExploit, isIncrease, saving, onSubmit]);

  return (
    <DynamicFormSidebar
      open={open}
      title={title}
      form={form}
      tabs={tabs}
      actions={sidebarActions}
      onClose={onClose}
    />
  );
}
