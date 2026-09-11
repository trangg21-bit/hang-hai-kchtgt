import React, { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { ChannelAsset } from '../../services/assetmovement/types';
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
}

const UNITS = ['Tuyến', 'Hệ thống', 'Bộ', 'Cái', 'Chiếc', 'm', 'km', 'm²'];
const ADJUSTMENT_REASONS = [
  'Đầu tư bổ sung',
  'Đánh giá lại',
  'Nâng cấp',
  'Hao mòn',
  'Thanh lý một phần',
  'Khác',
];

export interface ChannelAssetOperationFormProps {
  open: boolean;
  operationMode?: OperationMode;
  selected?: ChannelAsset;
  organizations: Organization[];
  form: FormInstance<OperationValues>;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

export default function ChannelAssetOperationForm({
  open,
  operationMode,
  selected,
  organizations,
  form,
  saving,
  onClose,
  onSubmit,
}: ChannelAssetOperationFormProps) {
  const isExploit = operationMode === 'exploit';
  const isIncrease = operationMode === 'increase';
  const title = useMemo(() => {
    if (isExploit) return `Khai thác tài sản — ${selected?.assetName || 'Tài sản luồng hàng hải'}`;
    if (isIncrease) return `Yêu cầu tăng nguyên giá — ${selected?.assetName || 'Tài sản luồng hàng hải'}`;
    return `Yêu cầu giảm nguyên giá — ${selected?.assetName || 'Tài sản luồng hàng hải'}`;
  }, [isExploit, isIncrease, selected]);

  const tabs = useMemo<FormTabConfig<OperationValues>[]>(() => {
    if (isExploit) {
      const exploitSection: FormSectionConfig<OperationValues> = {
        key: 'exploit_info',
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
            name: 'unitOfMeasure',
            label: 'Đơn vị tính',
            type: FormFieldType.Select,
            placeholder: 'Chọn đơn vị tính',
            options: UNITS.map((u) => ({ value: u, label: u })),
          },
          {
            name: 'quantity',
            label: 'Số lượng',
            type: FormFieldType.Number,
            min: 0,
            placeholder: '0',
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
            required: true,
            rules: [{ required: true, message: 'Số tiền thu được là bắt buộc' }],
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
            placeholder: 'Nhập ghi chú khai thác tài sản',
          },
        ],
      };
      return [{ key: 'exploit_tab', label: 'Khai thác tài sản', sections: [exploitSection] }];
    }

    const adjSection: FormSectionConfig<OperationValues> = {
      key: 'adjustment_decision',
      title: isIncrease ? 'Quyết định tăng nguyên giá' : 'Quyết định giảm nguyên giá',
      icon: <AuditOutlined />,
      fields: [
        {
          name: 'decisionNumber',
          label: isIncrease ? 'Số QĐ tăng nguyên giá' : 'Số QĐ giảm nguyên giá',
          type: FormFieldType.Text,
          placeholder: 'Nhập số quyết định',
          required: true,
          rules: [{ required: true, message: 'Số quyết định là bắt buộc' }],
        },
        {
          name: 'decisionDate',
          label: isIncrease ? 'Ngày ra QĐ tăng' : 'Ngày ra QĐ giảm',
          type: FormFieldType.Date,
          placeholder: 'Chọn ngày',
        },
        {
          name: 'adjustmentDate',
          label: isIncrease ? 'Ngày tăng nguyên giá' : 'Ngày giảm nguyên giá',
          type: FormFieldType.Date,
          placeholder: 'Chọn ngày',
          required: true,
          rules: [{ required: true, message: 'Ngày điều chỉnh là bắt buộc' }],
        },
        {
          name: 'adjustmentReason',
          label: isIncrease ? 'Lý do tăng nguyên giá' : 'Lý do giảm nguyên giá',
          type: FormFieldType.Select,
          placeholder: 'Chọn lý do',
          options: ADJUSTMENT_REASONS.map((r) => ({ value: r, label: r })),
          required: true,
          rules: [{ required: true, message: 'Lý do điều chỉnh là bắt buộc' }],
        },
        {
          name: 'originalValue',
          label: isIncrease ? 'Giá trị tăng thêm (VNĐ)' : 'Giá trị giảm bớt (VNĐ)',
          type: FormFieldType.Number,
          min: 0,
          placeholder: '0',
          required: true,
          rules: [{ required: true, message: 'Giá trị điều chỉnh là bắt buộc' }],
        },
        {
          name: 'notes',
          label: 'Ghi chú (điều chỉnh)',
          type: FormFieldType.TextArea,
          colSpan: 24,
          placeholder: 'Nhập ghi chú điều chỉnh nguyên giá',
        },
      ],
    };

    const detailsSection: FormSectionConfig<OperationValues> = {
      key: 'adjustment_details',
      title: 'Thông tin chi tiết sau điều chỉnh',
      icon: <SlidersOutlined />,
      fields: [
        {
          name: 'declarationDate',
          label: 'Ngày kê khai tài sản',
          type: FormFieldType.Date,
          placeholder: 'Chọn ngày',
        },
        {
          name: 'assignmentDecisionNumber',
          label: 'Số quyết định giao (tăng vốn)',
          type: FormFieldType.Text,
          placeholder: 'Nhập số quyết định',
        },
        {
          name: 'depreciationRate',
          label: 'Tỷ lệ hao mòn/Khấu hao (%)',
          type: FormFieldType.Number,
          min: 0,
          max: 100,
          placeholder: '0.00',
        },
        {
          name: 'accumulatedDepreciation',
          label: 'Khấu hao lũy kế (VNĐ)',
          type: FormFieldType.Number,
          min: 0,
          placeholder: '0',
        },
        {
          name: 'depreciationStartDate',
          label: 'Ngày tính khấu hao',
          type: FormFieldType.Date,
          placeholder: 'Chọn ngày',
        },
        {
          name: 'depreciationMonths',
          label: 'Số tháng tính khấu hao',
          type: FormFieldType.Number,
          min: 0,
          placeholder: '0',
        },
        {
          name: 'depreciationEndDate',
          label: 'Ngày hết khấu hao',
          type: FormFieldType.Date,
          placeholder: 'Chọn ngày',
        },
      ],
    };

    return [
      {
        key: 'adjustment_tab',
        label: isIncrease ? 'Tăng nguyên giá' : 'Giảm nguyên giá',
        sections: [adjSection, detailsSection],
      },
    ];
  }, [isExploit, isIncrease, organizations]);

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
        label: isExploit ? 'Lưu khai thác' : isIncrease ? 'Lưu yêu cầu tăng' : 'Lưu yêu cầu giảm',
        variant: isExploit ? 'primary' : isIncrease ? 'success' : 'primary',
        loading: saving,
        onClick: () => void onSubmit(),
      },
    ];
  }, [isExploit, isIncrease, onClose, onSubmit, saving]);

  return (
    <DynamicFormSidebar
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      tabs={tabs}
      footerActions={footerActions}
      footerAlign="center"
    />
  );
}
