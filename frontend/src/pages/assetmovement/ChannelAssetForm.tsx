import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import {
  BankOutlined,
  SlidersOutlined,
  FileTextOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { NavigationChannelResponse } from '../../types/navigationChannel';
import type { ChannelAsset } from '../../services/assetmovement/types';
import { MARITIME_ASSET_TYPE_OPTIONS } from '../../constants/assetType';
import { fmtInputNumber } from '../../utils/numFmt';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';

export interface ChannelFormValues {
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  navigationChannelId?: string;
  assetCode?: string;
  assetName?: string;
  assetType?: string;
  barcode?: string;
  assetCondition?: string;
  usageStatus?: string;
  assetGroup?: string;
  assetSubgroup?: string;
  address?: string;
  origin?: string;
  quantity?: number;
  quantityUnit?: string;
  model?: string;
  serialNumber?: string;
  countryOfOrigin?: string;
  manufacturer?: string;
  constructionYear?: Dayjs;
  useDate?: Dayjs;
  landArea?: number;
  floorArea?: number;
  assetLocation?: string;
  attachmentName?: string;
  declarationDate?: Dayjs;
  originalValue?: number;
  depreciationRate?: number;
  accumulatedDepreciation?: number;
  remainingValue?: number;
  assignmentDecisionNumber?: string;
  depreciationStartDate?: Dayjs;
  depreciationMonths?: number;
  depreciationEndDate?: Dayjs;
  monthlyDepreciation?: number;
  disposalMethod?: string;
  status?: string;
  approvalStatus?: string;
  [key: string]: unknown;
}

import {
  ASSET_CONDITION_OPTIONS,
  USAGE_STATUS_OPTIONS,
  ASSET_GROUP_OPTIONS,
  ASSET_ORIGIN_OPTIONS,
  ASSET_QUANTITY_UNIT_OPTIONS,
  DISPOSAL_METHOD_OPTIONS,
} from '../../constants/assetDropdown';

export interface ChannelAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: ChannelAsset;
  form: FormInstance<ChannelFormValues>;
  organizations: Organization[];
  channels: NavigationChannelResponse[];
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment?: (id: string, fileName: string) => void;
}

export default function ChannelAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  channels,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: ChannelAssetFormProps) {
  const channelOptions = useMemo(() => {
    return (channels || []).map((c) => ({
      value: c.id,
      label: `[LHH] ${c.channelCode ? `${c.channelCode} - ` : ''}${c.channelName}`,
    }));
  }, [channels]);

  const formTabs = useMemo<FormTabConfig<ChannelFormValues>[]>(() => {
    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        icon: <BankOutlined />,
        sections: [
          {
            key: 'basic_info',
            title: 'Thông tin cơ bản & Quản lý vận hành',
            icon: <BankOutlined />,
            fields: [
              {
                name: 'parentOrgUnitId',
                label: 'Cơ quan quản lý cấp trên',
                type: FormFieldType.TreeSelect,
                organizations,
              },
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                type: FormFieldType.TreeSelect,
                organizations,
                required: true,
                rules: [{ required: true, message: 'Đơn vị quản lý là bắt buộc' }],
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                type: FormFieldType.TreeSelect,
                organizations,
                required: true,
                rules: [{ required: true, message: 'Đơn vị sử dụng là bắt buộc' }],
              },
              {
                name: 'navigationChannelId',
                label: 'Mã luồng hàng hải',
                type: FormFieldType.Select,
                options: channelOptions,
                placeholder: 'Chọn luồng hàng hải',
                required: true,
                showSearch: true,
                rules: [{ required: true, message: 'Mã luồng hàng hải là bắt buộc' }],
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn loại tài sản',
                allowClear: true,
                options: MARITIME_ASSET_TYPE_OPTIONS,
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: FormFieldType.Text,
                placeholder: 'Hệ thống tự sinh (TS-LHH-...)',
                disabled: true,
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                type: FormFieldType.TextArea,
                maxLength: 255,
                required: true,
                colSpan: 12,
                placeholder: 'Nhập tên tài sản',
                rules: [{ required: true, message: 'Tên tài sản là bắt buộc' }],
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: 'Nhập mã barcode',
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: FormFieldType.Select,
                required: true,
                placeholder: 'Chọn tình trạng',
                options: ASSET_CONDITION_OPTIONS,
                rules: [{ required: true, message: 'Tình trạng tài sản là bắt buộc' }],
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: FormFieldType.Select,
                required: true,
                placeholder: 'Chọn hiện trạng',
                options: USAGE_STATUS_OPTIONS,
                rules: [{ required: true, message: 'Hiện trạng sử dụng là bắt buộc' }],
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn nhóm tài sản',
                options: ASSET_GROUP_OPTIONS,
              },
              {
                name: 'assetSubgroup',
                label: 'Phân nhóm tài sản',
                type: FormFieldType.Text,
                maxLength: 200,
                placeholder: 'Nhập phân nhóm tài sản',
              },
              {
                name: 'origin',
                label: 'Nguồn gốc',
                type: FormFieldType.Select,
                placeholder: 'Chọn nguồn gốc',
                options: ASSET_ORIGIN_OPTIONS,
              },
              {
                name: 'quantity',
                label: 'Số lượng',
                type: FormFieldType.Number,
                required: true,
                min: 0,
                maxLength: 5,
                placeholder: '0',
                colSpan: 6,
                rules: [{ required: true, message: 'Số lượng là bắt buộc' }],
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính',
                type: FormFieldType.Select,
                required: true,
                placeholder: 'Chọn đơn vị tính',
                options: ASSET_QUANTITY_UNIT_OPTIONS,
                colSpan: 6,
                rules: [{ required: true, message: 'Đơn vị tính là bắt buộc' }],
              },
              {
                name: 'model',
                label: 'Model',
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: 'Nhập model',
              },
              {
                name: 'serialNumber',
                label: 'Số Serial',
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: 'Nhập serial',
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: 'Nhập xuất xứ',
              },
              {
                name: 'manufacturer',
                label: 'Hãng sản xuất',
                type: FormFieldType.Text,
                maxLength: 200,
                placeholder: 'Nhập hãng sản xuất',
              },
              {
                name: 'constructionYear',
                label: 'Năm xây dựng',
                type: FormFieldType.Year,
                placeholder: 'Chọn năm',
              },
              {
                name: 'useDate',
                label: 'Ngày sử dụng tài sản',
                type: FormFieldType.Date,
                placeholder: 'Chọn ngày',
              },
              {
                name: 'landArea',
                label: 'Diện tích (đất, sàn sử dụng: m²)',
                type: FormFieldType.Number,
                min: 0,
                maxLength: 20,
                placeholder: '0.00',
              },
              {
                name: 'floorArea',
                label: 'Diện tích sàn sử dụng (m²)',
                type: FormFieldType.Number,
                min: 0,
                maxLength: 20,
                placeholder: '0.00',
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: FormFieldType.TextArea,
                maxLength: 2000,
                colSpan: 24,
                placeholder: 'Nhập địa chỉ tài sản',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.TextArea,
                maxLength: 2000,
                colSpan: 24,
                placeholder: 'Nhập vị trí chi tiết của tài sản luồng hàng hải',
              },
            ],
          },
        ],
      },
      {
        key: 'files',
        label: `Hồ sơ tài sản (${attachments.length})`,
        icon: <FileTextOutlined />,
        customContent: (
          <div style={{ paddingTop: 6 }}>
            <InfrastructureAttachmentTab
              attachments={attachments}
              readonly={false}
              onUpload={onUploadAttachment}
              onDelete={onDeleteAttachment}
              onDownload={onDownloadAttachment}
            />
          </div>
        ),
      },
      {
        key: 'detail',
        label: 'Thông tin chi tiết',
        icon: <SlidersOutlined />,
        sections: [
          {
            key: 'declaration_info',
            title: 'Kê khai & Giao tài sản',
            icon: <AuditOutlined />,
            fields: [
              {
                name: 'declarationDate',
                label: 'Ngày kê khai tài sản',
                type: FormFieldType.Date,
                placeholder: 'Chọn ngày',
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao (bao gồm cả tăng vốn)',
                type: FormFieldType.Text,
                maxLength: 200,
                placeholder: 'Nhập số quyết định giao',
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
                type: FormFieldType.Select,
                allowClear: true,
                placeholder: 'Chọn hình thức xử lý',
                options: DISPOSAL_METHOD_OPTIONS,
              },
            ],
          },
          {
            key: 'depreciation_info',
            title: 'Thông tin giá trị & Khấu hao tài sản',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'originalValue',
                label: 'Nguyên giá (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                maxLength: 20,
                placeholder: '0',
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                type: FormFieldType.Number,
                min: 0,
                max: 100,
                maxLength: 5,
                placeholder: '0.00',
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                maxLength: 20,
                placeholder: '0',
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại (VNĐ)',
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  const original = Number(values.originalValue) || 0;
                  const accumulated = Number(values.accumulatedDepreciation) || 0;
                  return Math.max(0, original - accumulated);
                },
                valueFormatter: (val) =>
                  val != null ? fmtInputNumber(Number(val)) + ' VNĐ' : '—',
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
                maxLength: 5,
                placeholder: '0',
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: FormFieldType.Date,
                placeholder: 'Chọn ngày',
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng (VNĐ)',
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  const original = Number(values.originalValue) || 0;
                  const months = Number(values.depreciationMonths) || 0;
                  return months > 0 ? Math.round(original / months) : 0;
                },
                valueFormatter: (val) =>
                  val != null ? fmtInputNumber(Number(val)) + ' VNĐ' : '—',
              },
            ],
          },
        ],
      },
    ];
  }, [
    organizations,
    channelOptions,
    attachments,
    onUploadAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
  ]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    if (drawerMode === 'edit') {
      const isDraft =
        !selected?.approvalStatus ||
        ['DRAFT', 'NHAP'].includes(String(selected.approvalStatus).toUpperCase());
      const actions: FormSidebarAction[] = [];
      if (isDraft) {
        actions.push({
          key: 'draft',
          label: 'Lưu tạm',
          variant: 'outline',
          loading: saving && saveAction === 'DRAFT',
          onClick: () => void onSave('DRAFT'),
        });
      }
      actions.push({
        key: 'approve',
        label: 'Lưu và phê duyệt',
        variant: 'success',
        loading: saving && saveAction === 'APPROVED',
        onClick: () => void onSave('APPROVED'),
      });
      return actions;
    }
    return [
      {
        key: 'draft',
        label: 'Lưu tạm',
        variant: 'outline',
        loading: saving && saveAction === 'DRAFT',
        onClick: () => void onSave('DRAFT'),
      },
      {
        key: 'submit',
        label: 'Lưu và gửi phê duyệt',
        variant: 'primary',
        loading: saving && saveAction === 'PENDING_APPROVAL',
        onClick: () => void onSave('PENDING_APPROVAL'),
      },
      {
        key: 'approve',
        label: 'Lưu và phê duyệt',
        variant: 'success',
        loading: saving && saveAction === 'APPROVED',
        onClick: () => void onSave('APPROVED'),
      },
    ];
  }, [drawerMode, selected, saving, saveAction, onSave]);

  const title =
    drawerMode === 'edit'
      ? `Chỉnh sửa thông tin — ${selected?.assetName || 'Tài sản luồng hàng hải'}`
      : 'Thêm mới tài sản luồng hàng hải';

  return (
    <DynamicFormSidebar
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      tabs={formTabs}
      footerActions={footerActions}
      footerAlign="center"
    />
  );
}
