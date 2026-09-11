import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { AuditOutlined, RocketOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { DaiTtdhAsset } from '../../services/daiTtdhAsset/types';
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

const UNITS = ['Bộ', 'Cái', 'Hệ thống', 'Chiếc', 'Máy'];
const ADJUSTMENT_REASONS = [
  'Đầu tư nâng cấp hệ thống phát sóng',
  'Mở rộng công suất đài TTDH',
  'Đánh giá lại giá trị tài sản',
  'Hao mòn kỹ thuật sau thời gian vận hành',
  'Điều chỉnh theo quyết định phê duyệt cấp trên',
  'Lý do khác',
];
const DISPOSAL_METHODS = ['Bán', 'Thanh lý', 'Điều chuyển', 'Tiêu hủy', 'Khác'];

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
              type: FormFieldType.Text,
              disabled: true,
            },
            {
              name: 'unitOfMeasure',
              label: 'Đơn vị tính',
              type: FormFieldType.Select,
              options: UNITS.map((u) => ({ value: u, label: u })),
            },
            {
              name: 'quantity',
              label: 'Số lượng khai thác',
              type: FormFieldType.Number,
              min: 0,
              placeholder: '1',
            },
            {
              name: 'exploitationDeadline',
              label: 'Thời hạn khai thác',
              type: FormFieldType.Date,
              placeholder: 'Chọn thời hạn kết thúc khai thác',
            },
            {
              name: 'totalRevenue',
              label: 'Tổng tiền thu được (VNĐ)',
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
              label: 'Nộp ngân sách nhà nước (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
              placeholder: '0',
            },
            {
              name: 'projectAmount',
              label: 'Số tiền thực hiện dự án (VNĐ)',
              type: FormFieldType.Number,
              min: 0,
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
            options: ADJUSTMENT_REASONS.map((r) => ({ value: r, label: r })),
            placeholder: 'Chọn lý do',
          },
          {
            name: 'originalValueBefore',
            label: 'Nguyên giá trước điều chỉnh (VNĐ)',
            type: FormFieldType.Number,
            disabled: true,
          },
          {
            name: 'originalValueAfter',
            label: isIncrease ? 'Nguyên giá sau khi tăng (VNĐ)' : 'Nguyên giá sau khi giảm (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            required: true,
            rules: [{ required: true, message: 'Vui lòng nhập nguyên giá sau điều chỉnh' }],
            placeholder: 'Nhập giá trị nguyên giá mới',
          },
          {
            name: 'remainingValueBefore',
            label: 'Giá trị còn lại trước điều chỉnh (VNĐ)',
            type: FormFieldType.Number,
            disabled: true,
          },
          {
            name: 'remainingValueAfter',
            label: 'Giá trị còn lại sau điều chỉnh (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
            placeholder: 'Nhập giá trị còn lại mới',
          },
          {
            name: 'notes',
            label: 'Ghi chú điều chỉnh',
            type: FormFieldType.TextArea,
            placeholder: 'Nhập lý do chi tiết hoặc nội dung thuyết minh',
            colSpan: 24,
          },
        ],
      },
      {
        key: 'depreciation_followup',
        title: 'Thông tin khấu hao sau điều chỉnh',
        icon: <SlidersOutlined />,
        fields: [
          {
            name: 'depreciationRate',
            label: 'Tỷ lệ hao mòn/khấu hao (%)',
            type: FormFieldType.Number,
            min: 0,
            max: 100,
            placeholder: '0.00',
          },
          {
            name: 'depreciationStartDate',
            label: 'Ngày tính khấu hao mới',
            type: FormFieldType.Date,
          },
          {
            name: 'depreciationMonths',
            label: 'Số tháng tính khấu hao còn lại',
            type: FormFieldType.Number,
            min: 0,
          },
          {
            name: 'depreciationEndDate',
            label: 'Ngày hết khấu hao mới',
            type: FormFieldType.Date,
          },
          {
            name: 'accumulatedDepreciation',
            label: 'Khấu hao lũy kế mới (VNĐ)',
            type: FormFieldType.Number,
            min: 0,
          },
          {
            name: 'disposalMethod',
            label: 'Hình thức xử lý',
            type: FormFieldType.Select,
            options: DISPOSAL_METHODS.map((m) => ({ value: m, label: m })),
          },
        ],
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
      width={
        typeof window !== 'undefined'
          ? Math.min(850, Math.floor(window.innerWidth * 0.9))
          : 850
      }
      rootClassName="daittdh-asset-operation-drawer"
      className="daittdh-asset-operation-drawer"
    />
  );
}
