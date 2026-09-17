import { BankOutlined, ProfileOutlined, SlidersOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { useCallback, useMemo } from 'react';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSidebarAction,
  type FormTabConfig,
} from '../../components/shared/dynamic-form-sidebar';
import { MARITIME_ASSET_TYPE_OPTIONS } from '../../constants/assetType';
import type { Organization } from '../../services/organizationService';
import type { VtsSystemOption } from '../../services/vtsasset/api';
import type { VtsSystemAsset, VtsSystemAssetPayload } from '../../services/vtsasset/types';
import { getOrGenerateAttachmentBlob } from '../../utils/attachmentStorage';
import { fmtInputNumber } from '../../utils/numFmt';

export type FormValues = Omit<
  VtsSystemAssetPayload,
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

export interface VtsSystemAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: VtsSystemAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  vtsSystems: VtsSystemOption[];
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function VtsSystemAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  vtsSystems,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: VtsSystemAssetFormProps) {
  const vtsSystemOptions = useMemo(
    () =>
      vtsSystems.map((item) => ({
        value: item.id,
        label: `${item.code} - ${item.name}`,
      })),
    [vtsSystems]
  );

  const handleLoadReadonlyPreviewImage = useCallback(
    async (attachmentId: string) => {
      const att = attachments.find((item) => item.id === attachmentId);
      if (!att) throw new Error('Không tìm thấy tệp');
      return await getOrGenerateAttachmentBlob(att.fileName, {
        assetCode: selected?.assetCode,
        assetName: selected?.assetName,
      });
    },
    [attachments, selected?.assetCode, selected?.assetName]
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
                name: 'vtsSystemId',
                label: 'Mã hệ thống VTS',
                type: FormFieldType.Select,
                options: vtsSystemOptions,
                placeholder: 'Chọn hệ thống VTS',
                required: true,
                rules: [{ required: true, message: 'Mã hệ thống VTS là bắt buộc' }],
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Select,
                options: MARITIME_ASSET_TYPE_OPTIONS,
                placeholder: 'Chọn loại tài sản',
                allowClear: true,
                required: true,
                rules: [{ required: true, message: 'Loại tài sản là bắt buộc' }],
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: FormFieldType.Text,
                placeholder: 'Mã tự sinh khi lưu',
                disabled: true,
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                type: FormFieldType.TextArea,
                maxLength: 255,
                colSpan: 24,
                placeholder: 'Nhập tên tài sản',
                required: true,
                rules: [{ required: true, message: 'Tên tài sản là bắt buộc' }],
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: 'Nhập barcode',
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
                name: 'origin',
                label: 'Nguồn gốc',
                type: FormFieldType.Select,
                options: ASSET_ORIGIN_OPTIONS,
                placeholder: 'Chọn nguồn gốc',
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: FormFieldType.TextArea,
                maxLength: 2000,
                colSpan: 24,
                placeholder: 'Nhập địa chỉ',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.TextArea,
                maxLength: 2000,
                colSpan: 24,
                placeholder: 'Nhập vị trí tài sản',
              },
            ],
          },
          {
            key: 'summary_indicators',
            title: 'Chỉ số tổng hợp',
            icon: <ProfileOutlined />,
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                type: FormFieldType.Number,
                min: 1,
                maxLength: 5,
                required: true,
                rules: [{ required: true, message: 'Vui lòng nhập số lượng' }],
                formatter: fmtInputNumber,
                placeholder: 'Nhập số lượng',
                colSpan: 12,
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính',
                type: FormFieldType.Select,
                placeholder: 'Chọn đơn vị tính',
                allowClear: true,
                required: true,
                rules: [{ required: true, message: 'Vui lòng chọn đơn vị tính' }],
                options: ASSET_QUANTITY_UNIT_OPTIONS,
                colSpan: 12,
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
                placeholder: 'Nhập nơi xuất xứ',
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
                placeholder: '0',
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m²)',
                type: FormFieldType.Number,
                min: 0,
                maxLength: 20,
                placeholder: '0',
              },
            ],
          },
        ],
      },
      {
        key: 'files',
        label: `Hồ sơ tài sản (${attachments.length})`,
        customContent: (
          <div style={{ paddingTop: 6 }}>
            <InfrastructureAttachmentTab
              attachments={attachments}
              readonly={false}
              onUpload={onUploadAttachment}
              onDelete={onDeleteAttachment}
              onDownload={onDownloadAttachment}
              loadReadonlyPreviewImage={handleLoadReadonlyPreviewImage}
            />
          </div>
        ),
      },
      {
        key: 'details',
        label: 'Thông tin chi tiết',
        sections: [
          {
            key: 'value_depreciation',
            title: 'Thông tin giá trị & Khấu hao tài sản',
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
                placeholder: '0',
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại (VNĐ)',
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  if (values.originalValue == null) return undefined;
                  const original = Number(values.originalValue) || 0;
                  const accumulated = Number(values.accumulatedDepreciation) || 0;
                  return Math.max(0, original - accumulated);
                },
                valueFormatter: (val) => (val != null ? fmtInputNumber(Number(val)) : '—'),
              },
              {
                name: 'valueUnit',
                label: 'Đơn vị tính giá trị',
                type: FormFieldType.Text,
                disabled: true,
                placeholder: 'VNĐ',
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao (bao gồm cả tăng vốn)',
                type: FormFieldType.Text,
                maxLength: 200,
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
                min: 0,
                maxLength: 5,
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
                min: 0,
                maxLength: 20,
                placeholder: '0',
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng (VNĐ)',
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  const original = Number(values.originalValue);
                  const months = Number(values.depreciationMonths);
                  if (!original || !months || months <= 0) return undefined;
                  return Math.round(original / months);
                },
                valueFormatter: (val) => (val != null ? fmtInputNumber(Number(val)) : '—'),
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
    vtsSystemOptions,
    attachments,
    onUploadAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
    handleLoadReadonlyPreviewImage,
  ]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
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
  }, [onSave, saveAction, saving]);

  const title =
    drawerMode === 'edit'
      ? `Chỉnh sửa thông tin — ${selected?.assetName || 'Tài sản VTS'}`
      : 'Thêm mới tài sản hệ thống VTS';

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
