import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import {
  BankOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { Pier } from '../../types/port';
import type {
  PierAsset,
  PierAssetPayload,
} from '../../services/assetmovement/types';
import { MARITIME_ASSET_TYPE_OPTIONS } from '../../constants/assetType';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';

import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';

export type FormValues = Omit<
  PierAssetPayload,
  | 'assetType'
  | 'constructionYear'
  | 'useDate'
  | 'declarationDate'
  | 'depreciationStartDate'
  | 'depreciationEndDate'
> & {
  constructionYear?: Dayjs;
  useDate?: Dayjs;
  declarationDate?: Dayjs;
  depreciationStartDate?: Dayjs;
  depreciationEndDate?: Dayjs;
  attachmentName?: string;
};

import {
  ASSET_CONDITION_OPTIONS,
  ASSET_GROUP_OPTIONS,
  ASSET_ORIGIN_OPTIONS,
  ASSET_QUANTITY_UNIT_OPTIONS,
  DISPOSAL_METHOD_OPTIONS,
  USAGE_STATUS_OPTIONS,
} from '../../constants/assetDropdown';

export interface PierAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: PierAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  piers: Pier[];
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function PierAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  piers,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: PierAssetFormProps) {
  const effectiveDrawerMode = drawerMode || (selected ? 'edit' : 'create');
  const effectiveSelected = selected;

  const pierOptions = useMemo(
    () =>
      piers.map((item) => ({
        value: item.id,
        label: `${item.pierCode} - ${item.pierName}`,
        orgUnitId: item.orgUnitId ?? undefined,
      })),
    [piers],
  );

  const formTabs = useMemo<FormTabConfig<FormValues>[]>(() => {
    return [
      {
        key: 'general',
        label: 'Thông tin chung',
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
                rules: [
                  { required: true, message: 'Đơn vị quản lý là bắt buộc' },
                ],
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                type: FormFieldType.TreeSelect,
                organizations,
                required: true,
                rules: [
                  { required: true, message: 'Đơn vị sử dụng là bắt buộc' },
                ],
              },
              {
                name: 'pierId',
                label: 'Mã cầu cảng',
                type: FormFieldType.Select,
                options: pierOptions,
                placeholder: 'Chọn cầu cảng',
                required: true,
                rules: [{ required: true, message: 'Mã cầu cảng là bắt buộc' }],
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn loại tài sản',
                options: MARITIME_ASSET_TYPE_OPTIONS,
                allowClear: true,
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: FormFieldType.Text,
                disabled: true,
                placeholder: 'Hệ thống tự sinh',
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                type: FormFieldType.Text,
                maxLength: 255,
                placeholder: 'Nhập tên tài sản',
                required: true,
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
                options: ASSET_CONDITION_OPTIONS,
                placeholder: 'Chọn tình trạng',
                required: true,
                rules: [{ required: true, message: 'Tình trạng tài sản là bắt buộc' }],
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: FormFieldType.Select,
                options: USAGE_STATUS_OPTIONS,
                placeholder: 'Chọn hiện trạng',
                required: true,
                rules: [{ required: true, message: 'Hiện trạng sử dụng là bắt buộc' }],
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: FormFieldType.Select,
                options: ASSET_GROUP_OPTIONS,
                placeholder: 'Chọn nhóm tài sản',
              },
              {
                name: 'assetSubgroup',
                label: 'Phân nhóm tài sản',
                type: FormFieldType.Text,
                maxLength: 200,
                placeholder: 'Nhập phân nhóm tài sản',
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
                name: 'origin',
                label: 'Nguồn gốc',
                type: FormFieldType.Select,
                options: ASSET_ORIGIN_OPTIONS,
                placeholder: 'Chọn nguồn gốc tài sản',
              },
            ],
          },
          {
            key: 'aggregate_indicators',
            title: 'Chỉ số tổng hợp',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                type: FormFieldType.Number,
                min: 0,
                required: true,
                rules: [{ required: true, message: 'Số lượng là bắt buộc' }],
                placeholder: 'Nhập số lượng',
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính số lượng',
                type: FormFieldType.Select,
                options: ASSET_QUANTITY_UNIT_OPTIONS,
                required: true,
                rules: [{ required: true, message: 'Đơn vị tính là bắt buộc' }],
                placeholder: 'Chọn đơn vị tính',
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
                label: 'Serial',
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
                placeholder: 'Chọn ngày bắt đầu sử dụng',
              },
              {
                name: 'landArea',
                label: 'Diện tích (đất, sàn sử dụng: m2)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập diện tích đất',
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m2)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập diện tích sàn',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.TextArea,
                maxLength: 2000,
                colSpan: 24,
                placeholder: 'Nhập mô tả vị trí tài sản',
              },
            ],
          },
        ],
      },
      {
        key: 'attachments',
        label: `Hồ sơ tài sản (${attachments.length})`,
        customContent: (
          <div style={{ paddingTop: 6 }}>
            <InfrastructureAttachmentTab
              attachments={attachments}
              readonly={drawerMode === 'detail'}
              onUpload={onUploadAttachment}
              onDelete={onDeleteAttachment}
              onDownload={onDownloadAttachment}
            />
          </div>
        ),
      },
      {
        key: 'details',
        label: 'Thông tin chi tiết',
        sections: [
          {
            key: 'detailed_info',
            title: 'Thông tin chi tiết tài sản',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'declarationDate',
                label: 'Ngày kê khai tài sản',
                type: FormFieldType.Date,
                placeholder: 'Chọn ngày kê khai',
              },
              {
                name: 'originalValue',
                label: 'Nguyên giá (nguồn ngân sách, nguồn khác)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập nguyên giá',
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                type: FormFieldType.Number,
                min: 0,
                max: 100,
                placeholder: 'Nhập tỷ lệ (%)',
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại',
                type: FormFieldType.Number,
                disabled: true,
                placeholder: 'Hệ thống tự tính',
              },
              {
                name: 'currencyUnit',
                label: 'Đơn vị tính giá trị',
                type: FormFieldType.Select,
                disabled: true,
                initialValue: 'VNĐ',
                options: [{ value: 'VNĐ', label: 'VNĐ' }],
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao (bao gồm cả tăng vốn)',
                type: FormFieldType.Text,
                maxLength: 200,
                placeholder: 'Nhập số quyết định',
              },
              {
                name: 'depreciationStartDate',
                label: 'Ngày tính khấu hao',
                type: FormFieldType.Date,
                placeholder: 'Chọn ngày bắt đầu tính khấu hao',
              },
              {
                name: 'depreciationMonths',
                label: 'Số tháng tính khấu hao',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập số tháng',
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: FormFieldType.Date,
                placeholder: 'Chọn ngày kết thúc khấu hao',
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập khấu hao lũy kế',
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng',
                type: FormFieldType.Number,
                placeholder: 'Nhập khấu hao tháng',
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
                type: FormFieldType.Select,
                options: DISPOSAL_METHOD_OPTIONS,
                placeholder: 'Chọn hình thức xử lý',
              },
            ],
          },
        ],
      },
    ];
  }, [
    organizations,
    pierOptions,
    attachments,
    drawerMode,
    onUploadAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
  ]);

  const actions = useMemo<FormSidebarAction[]>(() => {
    if (effectiveDrawerMode === 'detail') {
      return [{ key: 'close', label: 'Đóng', onClick: onClose }];
    }

    if (effectiveDrawerMode === 'edit') {
      const isDraft =
        !effectiveSelected?.approvalStatus ||
        ['DRAFT', 'NHAP'].includes(effectiveSelected.approvalStatus.toUpperCase());
      const res: FormSidebarAction[] = [];

      if (isDraft) {
        res.push({
          key: 'draft',
          label: 'Lưu tạm',
          variant: 'outline',
          loading: saving && saveAction === 'DRAFT',
          onClick: () => void onSave('DRAFT'),
        });
      }

      res.push({
        key: 'approve',
        label: 'Lưu và phê duyệt',
        variant: 'success',
        loading: saving && saveAction === 'APPROVED',
        onClick: () => void onSave('APPROVED'),
      });

      return res;
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
  }, [effectiveDrawerMode, effectiveSelected, onClose, saving, saveAction, onSave]);

  const title = useMemo(() => {
    if (effectiveDrawerMode === 'create') return 'Thêm mới tài sản cầu cảng';
    if (effectiveDrawerMode === 'edit') return `Chỉnh sửa thông tin — ${effectiveSelected?.assetName || 'Tài sản cầu cảng'}`;
    return 'Xem chi tiết tài sản cầu cảng';
  }, [effectiveDrawerMode, effectiveSelected]);

  return (
    <DynamicFormSidebar<FormValues>
      open={open}
      title={title}
      form={form}
      tabs={formTabs}
      footerActions={actions}
      footerAlign="center"
      onClose={onClose}
      rootClassName="pier-drawer-scope"
    />
  );
}
