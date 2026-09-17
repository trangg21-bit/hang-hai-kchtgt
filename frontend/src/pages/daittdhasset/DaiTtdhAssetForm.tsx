import { DeploymentUnitOutlined, SlidersOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import { createAssetDepreciationFormSection } from '../../components/shared/asset-value/assetValueFormFields';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSidebarAction,
  type FormTabConfig,
} from '../../components/shared/dynamic-form-sidebar';
import { MARITIME_ASSET_TYPE_OPTIONS } from '../../constants/assetType';
import type {
  DaiTtdhAsset,
  DaiTtdhAssetPayload,
} from '../../services/daiTtdhAsset/types';
import type { Organization } from '../../services/organizationService';

export type FormValues = Omit<
  DaiTtdhAssetPayload,
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
  USAGE_STATUS_OPTIONS,
} from '../../constants/assetDropdown';
import { fmtInputNumber } from '../../utils/numFmt';

export interface DaiTtdhAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: DaiTtdhAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  daiTtdhs: Array<{ id: string; code: string; name: string }>;
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function DaiTtdhAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  daiTtdhs,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: DaiTtdhAssetFormProps) {
  const daiTtdhOptions = useMemo(
    () =>
      daiTtdhs.map((item) => ({
        value: item.id,
        label: `${item.code} - ${item.name}`,
      })),
    [daiTtdhs],
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
            icon: <DeploymentUnitOutlined />,
            fields: [
              {
                name: 'parentOrgUnitId',
                label: 'Cơ quan quản lý cấp trên',
                type: FormFieldType.TreeSelect,
                organizations,
                placeholder: 'Chọn cơ quan quản lý cấp trên',
              },
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                type: FormFieldType.TreeSelect,
                organizations,
                required: true,
                rules: [{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }],
                placeholder: 'Chọn đơn vị quản lý',
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                type: FormFieldType.TreeSelect,
                organizations,
                placeholder: 'Chọn đơn vị sử dụng',
              },
              {
                name: 'stationId',
                label: 'Mã đài TTDH',
                type: FormFieldType.Select,
                options: daiTtdhOptions,
                placeholder: 'Chọn đài TTDH trực thuộc',
                showSearch: true,
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn loại tài sản',
                options: MARITIME_ASSET_TYPE_OPTIONS,
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: FormFieldType.Text,
                disabled: true,
                placeholder: 'Hệ thống tự động sinh (TS-TTDH-XXXXXX)',
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                type: FormFieldType.TextArea,
                maxLength: 255,
                required: true,
                rules: [{ required: true, message: 'Vui lòng nhập tên tài sản' }],
                placeholder: 'Nhập tên tài sản',
                colSpan: 24,
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: 'Nhập mã vạch/barcode',
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: FormFieldType.Select,
                options: ASSET_CONDITION_OPTIONS,
                placeholder: 'Chọn tình trạng',
                allowClear: true,
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: FormFieldType.Select,
                options: USAGE_STATUS_OPTIONS,
                placeholder: 'Chọn hiện trạng',
                allowClear: true,
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: FormFieldType.Select,
                options: ASSET_GROUP_OPTIONS,
                placeholder: 'Chọn nhóm tài sản',
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
                options: ASSET_ORIGIN_OPTIONS,
                placeholder: 'Chọn nguồn gốc',
                allowClear: true,
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: FormFieldType.TextArea,
                maxLength: 2000,
                placeholder: 'Nhập địa chỉ nơi đặt tài sản',
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
                maxLength: 100,
                placeholder: 'Nhập model thiết bị',
              },
              {
                name: 'serialNumber',
                label: 'Serial',
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: 'Nhập số serial',
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: 'Nhập nước xuất xứ',
              },
              {
                name: 'manufacturer',
                label: 'Hãng sản xuất',
                type: FormFieldType.Text,
                maxLength: 200,
                placeholder: 'Nhập tên hãng sản xuất',
              },
              {
                name: 'constructionYear',
                label: 'Năm xây dựng / trang bị',
                type: FormFieldType.Year,
                placeholder: 'Chọn năm trang bị',
              },
              {
                name: 'landArea',
                label: 'Diện tích đất (m²)',
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
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.TextArea,
                maxLength: 2000,
                placeholder: 'Mô tả chi tiết vị trí lắp đặt tài sản',
                colSpan: 24,
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
    daiTtdhOptions,
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
      ? `Chỉnh sửa thông tin — ${selected?.assetName || 'Tài sản đài TTDH'}`
      : 'Thêm mới tài sản đài thông tin duyên hải';

  return (
    <DynamicFormSidebar<FormValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      tabs={formTabs}
      footerActions={footerActions}
      footerAlign="center"
      rootClassName="daittdh-asset-drawer-scope"
      className="daittdh-asset-drawer-scope"
    />
  );
}
