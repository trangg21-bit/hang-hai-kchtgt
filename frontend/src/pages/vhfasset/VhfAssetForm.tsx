import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { ApiOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { TransmissionOptionResponse } from '../../services/transmission/types';
import type {
  VhfAsset,
  VhfAssetPayload,
} from '../../services/vhfAsset/types';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import { spaceFormField } from '../../themetokenchk';
import { createAssetDepreciationFormSection } from '../../components/shared/asset-value';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';
import { MARITIME_ASSET_TYPE_OPTIONS } from '../../constants/assetType';

export type FormValues = Omit<
  VhfAssetPayload,
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
  USAGE_STATUS_OPTIONS,
  ASSET_GROUP_OPTIONS,
  ASSET_ORIGIN_OPTIONS,
  ASSET_QUANTITY_UNIT_OPTIONS,
} from '../../constants/assetDropdown';
import { fmtInputNumber } from '../../utils/numFmt';

export interface VhfAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: VhfAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  transmissions: TransmissionOptionResponse[];
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function VhfAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  transmissions,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: VhfAssetFormProps) {
  const transmissionOptions = useMemo(
    () =>
      transmissions.map((item) => ({
        value: item.id,
        label: `${item.deviceCode} - ${item.deviceName}`,
        orgUnitId: item.orgUnitId ?? undefined,
      })),
    [transmissions],
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
            icon: <ApiOutlined />,
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
                name: 'transmissionId',
                label: 'Mã thiết bị',
                type: FormFieldType.Select,
                options: transmissionOptions,
                placeholder: 'Chọn thiết bị VHF / hệ thống liên lạc',
                required: true,
                rules: [{ required: true, message: 'Mã thiết bị là bắt buộc' }],
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
                placeholder: 'Hệ thống tự sinh (TS-VHF-xxxx)',
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
                placeholder: 'Nhập mã vạch barcode',
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn tình trạng',
                options: ASSET_CONDITION_OPTIONS,
                allowClear: true,
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: FormFieldType.Select,
                placeholder: 'Chọn hiện trạng',
                options: USAGE_STATUS_OPTIONS,
                allowClear: true,
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn nhóm tài sản',
                options: ASSET_GROUP_OPTIONS,
                allowClear: true,
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
                allowClear: true,
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: FormFieldType.TextArea,
                maxLength: 2000,
                placeholder: 'Nhập địa chỉ đặt tài sản',
                colSpan: 24,
              },
            ],
          },
          {
            key: 'summary_indicators',
            title: 'Chỉ số tổng hợp & Kỹ thuật',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                type: FormFieldType.Number,
                required: true,
                min: 1,
                maxLength: 5,
                formatter: fmtInputNumber,
                placeholder: '0',
                rules: [{ required: true, message: 'Số lượng là bắt buộc' }],
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính số lượng',
                type: FormFieldType.Select,
                required: true,
                placeholder: 'Chọn đơn vị tính',
                options: ASSET_QUANTITY_UNIT_OPTIONS,
                rules: [{ required: true, message: 'Đơn vị tính là bắt buộc' }],
              },
              {
                name: 'model',
                label: 'Model',
                type: FormFieldType.Text,
                maxLength: 255,
                placeholder: 'Nhập model thiết bị',
              },
              {
                name: 'serialNumber',
                label: 'Serial',
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: 'Nhập số serial thiết bị',
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: 'Nhập xuất xứ (quốc gia)',
              },
              {
                name: 'manufacturer',
                label: 'Hãng sản xuất',
                type: FormFieldType.Text,
                maxLength: 50,
                placeholder: 'Nhập hãng sản xuất',
              },
              {
                name: 'constructionYear',
                label: 'Năm xây dựng / trang bị',
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
                label: 'Diện tích đất (m²)',
                type: FormFieldType.Number,
                min: 0,
                maxLength: 20,
                placeholder: 'Nhập diện tích đất',
              },
              {
                name: 'floorArea',
                label: 'Diện tích sàn sử dụng (m²)',
                type: FormFieldType.Number,
                min: 0,
                maxLength: 20,
                placeholder: 'Nhập diện tích sàn',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.TextArea,
                maxLength: 2000,
                placeholder: 'Nhập mô tả vị trí lắp đặt / trạm phát sóng VHF',
                colSpan: 24,
              },
            ],
          },
        ],
      },
      {
        key: 'attachments',
        label: 'Hồ sơ tài sản',
        customContent: (
          <div style={{ padding: '0 4px', marginBottom: spaceFormField }}>
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
        key: 'details',
        label: 'Thông tin chi tiết',
        sections: [
          createAssetDepreciationFormSection<FormValues>(),
        ],
      },
    ];
  }, [
    organizations,
    transmissionOptions,
    attachments,
    onUploadAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
  ]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    if (drawerMode === 'edit') {
      const isDraft =
        !selected?.approvalStatus ||
        ['DRAFT', 'NHAP'].includes(selected.approvalStatus.toUpperCase());
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

  const title = useMemo(() => {
    if (drawerMode === 'edit') {
      return `Chỉnh sửa thông tin — ${selected?.assetName || 'Tài sản HTTT liên lạc VHF'}`;
    }
    return 'Thêm mới tài sản HTTT liên lạc VHF';
  }, [drawerMode, selected]);

  return (
    <DynamicFormSidebar<FormValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      rootClassName="vhf-asset-drawer-scope"
      className="vhf-asset-drawer-scope"
      tabs={formTabs}
      footerActions={footerActions}
    />
  );
}
