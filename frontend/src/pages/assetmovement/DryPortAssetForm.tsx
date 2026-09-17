import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import {
  BankOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type {
  DryPortAsset,
  DryPortAssetPayload,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
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
import {
  ASSET_CONDITION_OPTIONS,
  USAGE_STATUS_OPTIONS,
  ASSET_GROUP_OPTIONS,
  ASSET_ORIGIN_OPTIONS,
  ASSET_QUANTITY_UNIT_OPTIONS,
  DISPOSAL_METHOD_OPTIONS,
} from '../../constants/assetDropdown';

export type DryPortFormValues = Omit<
  DryPortAssetPayload,
  | 'assetType'
  | 'constructionYear'
  | 'useDate'
  | 'declarationDate'
  | 'depreciationStartDate'
  | 'depreciationEndDate'
> & {
  assetType?: DryPortAssetPayload['assetType'];
  constructionYear?: Dayjs;
  useDate?: Dayjs;
  declarationDate?: Dayjs;
  depreciationStartDate?: Dayjs;
  depreciationEndDate?: Dayjs;
  attachmentName?: string;
  [key: string]: unknown;
};

export interface DryPortAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: DryPortAsset;
  form: FormInstance<DryPortFormValues>;
  organizations: Organization[];
  dryPorts: { id: string; name: string; code?: string }[];
  attachments: InfrastructureAttachmentItem[];
  exploitationRows?: AssetExploitationResponse[];
  increaseRows?: AssetIncreaseResponse[];
  decreaseRows?: AssetDecreaseResponse[];
  orgName?: (id?: string) => string;
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function DryPortAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  dryPorts,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: DryPortAssetFormProps) {
  const effectiveDrawerMode = drawerMode || (selected ? 'edit' : 'create');
  const effectiveSelected = selected;

  const dryPortOptions = useMemo(
    () =>
      dryPorts.map((item) => ({
        label: item.code ? `${item.name} (${item.code})` : item.name,
        value: item.id,
      })),
    [dryPorts],
  );

  const formTabs = useMemo<FormTabConfig<DryPortFormValues>[]>(() => {
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
                name: 'dryPortId',
                label: 'Mã cảng cạn',
                type: FormFieldType.Select,
                options: dryPortOptions,
                placeholder: 'Chọn cảng cạn',
                required: true,
                rules: [
                  {
                    required: true,
                    message: 'Mã cảng cạn là bắt buộc',
                  },
                ],
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
                placeholder: 'Chọn tình trạng',
                required: true,
                options: ASSET_CONDITION_OPTIONS,
                rules: [
                  { required: true, message: 'Tình trạng tài sản là bắt buộc' },
                ],
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: FormFieldType.Select,
                placeholder: 'Chọn hiện trạng',
                required: true,
                options: USAGE_STATUS_OPTIONS,
                rules: [
                  { required: true, message: 'Hiện trạng sử dụng là bắt buộc' },
                ],
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: FormFieldType.Select,
                allowClear: true,
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
                allowClear: true,
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
                formatter: fmtInputNumber,
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
                placeholder: 'Chọn ngày',
              },
              {
                name: 'landArea',
                label: 'Diện tích đất, sàn sử dụng (m²)',
                type: FormFieldType.Number,
                min: 0,
                maxLength: 20,
                placeholder: '0',
              },
              {
                name: 'floorArea',
                label: 'Diện tích sàn sử dụng (m²)',
                type: FormFieldType.Number,
                min: 0,
                maxLength: 20,
                placeholder: '0',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.TextArea,
                maxLength: 2000,
                colSpan: 24,
                rows: 2,
                placeholder: 'Nhập vị trí tài sản',
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: FormFieldType.TextArea,
                maxLength: 2000,
                colSpan: 24,
                rows: 2,
                placeholder: 'Nhập địa chỉ tài sản',
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
            />
          </div>
        ),
      },
      {
        key: 'details',
        label: 'Thông tin chi tiết',
        sections: [
          {
            key: 'depreciation_info',
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
                label: 'Giá trị còn lại',
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  if (values.originalValue == null) return undefined;
                  return Math.max(
                    0,
                    Number(values.originalValue) -
                      (Number(values.accumulatedDepreciation) || 0),
                  );
                },
                valueFormatter: (val) =>
                  val != null ? fmtInputNumber(Number(val)) : '',
              },
              {
                name: 'valueUnit',
                label: 'Đơn vị tính giá trị',
                type: FormFieldType.Readonly,
                initialValue: 'VNĐ',
                valueFormatter: () => 'VNĐ',
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
                placeholder: 'Chọn ngày tính',
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
                placeholder: 'Chọn ngày hết',
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế',
                type: FormFieldType.Number,
                min: 0,
                maxLength: 20,
                placeholder: '0',
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng',
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  const orig = Number(values.originalValue);
                  const months = Number(values.depreciationMonths);
                  if (values.originalValue != null && months > 0) {
                    return Math.round((orig / months) * 100) / 100;
                  }
                  return undefined;
                },
                valueFormatter: (val) =>
                  val != null ? fmtInputNumber(Number(val)) : '',
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
        ],
      },
    ];
  }, [
    organizations,
    dryPortOptions,
    attachments,
    onUploadAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
  ]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    if (effectiveDrawerMode === 'edit') {
      const isDraft =
        !effectiveSelected?.approvalStatus ||
        ['DRAFT', 'NHAP'].includes(effectiveSelected.approvalStatus.toUpperCase());
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
  }, [effectiveDrawerMode, effectiveSelected, saving, saveAction, onSave]);

  const title = useMemo(() => {
    if (effectiveDrawerMode === 'edit') {
      return `Chỉnh sửa thông tin — ${effectiveSelected?.assetName || 'Tài sản cảng cạn'}`;
    }
    return 'Thêm mới tài sản cảng cạn';
  }, [effectiveDrawerMode, effectiveSelected]);

  return (
    <DynamicFormSidebar<DryPortFormValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      rootClassName="berth-drawer-scope dryport-drawer-scope"
      className="berth-drawer-scope dryport-drawer-scope"
      tabs={formTabs}
      footerActions={footerActions}
      footerAlign="center"
    />
  );
}
