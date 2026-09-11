import { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { DeploymentUnitOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type {
  InmarsatAsset,
  InmarsatAssetPayload,
} from '../../services/inmarsatAsset/types';
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
  InmarsatAssetPayload,
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

const ASSET_CONDITIONS = ['Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được'];
const USAGE_STATUSES = ['Đang sử dụng', 'Chưa sử dụng', 'Tạm dừng sử dụng'];
const ASSET_GROUPS = [
  'Thiết bị thông tin vệ tinh Inmarsat',
  'Thiết bị thu phát Inmarsat',
  'Máy móc, thiết bị phụ trợ',
  'Hệ thống nguồn & ăng-ten',
  'Tài sản khác',
];
const ORIGINS = [
  'Mua sắm',
  'Đầu tư xây dựng',
  'Được giao',
  'Điều chuyển',
  'Khác',
];
const UNITS = ['Bộ', 'Cái', 'Hệ thống', 'Chiếc', 'Máy'];

export interface InmarsatAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: InmarsatAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  inmarsatStations: Array<{ id: string; code: string; name: string }>;
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function InmarsatAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  inmarsatStations,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: InmarsatAssetFormProps) {
  const inmarsatOptions = useMemo(
    () =>
      inmarsatStations.map((item) => ({
        value: item.id,
        label: `${item.code} - ${item.name}`,
      })),
    [inmarsatStations],
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
                label: 'Mã đài Inmarsat',
                type: FormFieldType.Select,
                options: inmarsatOptions,
                placeholder: 'Chọn đài vệ tinh Inmarsat trực thuộc',
                showSearch: true,
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Text,
                disabled: true,
                placeholder: 'Tài sản đài Inmarsat',
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: FormFieldType.Text,
                disabled: true,
                placeholder: 'Hệ thống tự động sinh (TS-INM-XXXXXX)',
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                type: FormFieldType.TextArea,
                required: true,
                rules: [{ required: true, message: 'Vui lòng nhập tên tài sản' }],
                placeholder: 'Nhập tên tài sản',
                colSpan: 24,
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: FormFieldType.Text,
                placeholder: 'Nhập mã vạch/barcode',
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: FormFieldType.Select,
                options: ASSET_CONDITIONS.map((c) => ({ value: c, label: c })),
                placeholder: 'Chọn tình trạng',
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: FormFieldType.Select,
                options: USAGE_STATUSES.map((s) => ({ value: s, label: s })),
                placeholder: 'Chọn hiện trạng sử dụng',
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: FormFieldType.Select,
                options: ASSET_GROUPS.map((g) => ({ value: g, label: g })),
                placeholder: 'Chọn nhóm tài sản',
              },
              {
                name: 'assetSubgroup',
                label: 'Phân nhóm tài sản',
                type: FormFieldType.Text,
                placeholder: 'Nhập phân nhóm tài sản',
              },
              {
                name: 'origin',
                label: 'Nguồn gốc',
                type: FormFieldType.Select,
                options: ORIGINS.map((o) => ({ value: o, label: o })),
                placeholder: 'Chọn nguồn gốc tài sản',
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: FormFieldType.TextArea,
                placeholder: 'Nhập địa chỉ đặt tài sản / đài vệ tinh Inmarsat',
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
                min: 0,
                initialValue: 1,
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính số lượng',
                type: FormFieldType.Select,
                initialValue: 'Bộ',
                options: UNITS.map((u) => ({ value: u, label: u })),
              },
              {
                name: 'model',
                label: 'Model',
                type: FormFieldType.Text,
                placeholder: 'Nhập model thiết bị',
              },
              {
                name: 'serialNumber',
                label: 'Serial',
                type: FormFieldType.Text,
                placeholder: 'Nhập số serial',
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
                type: FormFieldType.Text,
                placeholder: 'Nhập xuất xứ (quốc gia)',
              },
              {
                name: 'manufacturer',
                label: 'Hãng sản xuất',
                type: FormFieldType.Text,
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
                placeholder: 'Nhập diện tích đất',
              },
              {
                name: 'floorArea',
                label: 'Diện tích sàn sử dụng (m²)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập diện tích sàn',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.TextArea,
                placeholder: 'Nhập vị trí lắp đặt tài sản',
                colSpan: 24,
              },
            ],
          },
        ],
      },
      {
        key: 'attachments',
        label: 'Hồ sơ tài sản',
        sections: [
          {
            key: 'docs',
            title: 'Tệp đính kèm tài liệu & Hồ sơ kỹ thuật',
            fields: [
              {
                name: 'attachmentName',
                label: '',
                type: FormFieldType.Custom,
                colSpan: 24,
                customContent: () => (
                  <InfrastructureAttachmentTab
                    attachments={attachments}
                    onUpload={onUploadAttachment}
                    onDelete={onDeleteAttachment}
                    onDownload={onDownloadAttachment}
                  />
                ),
              },
            ],
          },
        ],
      },
    ];
  }, [
    organizations,
    inmarsatOptions,
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
      ? `Chỉnh sửa thông tin — ${selected?.assetName || 'Tài sản đài Inmarsat'}`
      : 'Thêm mới tài sản đài vệ tinh Inmarsat';

  return (
    <DynamicFormSidebar<FormValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      tabs={formTabs}
      footerActions={footerActions}
      footerAlign="center"
      width={
        typeof window !== 'undefined'
          ? Math.min(1000, Math.floor(window.innerWidth * 0.95))
          : 1000
      }
      rootClassName="inmarsat-asset-drawer-scope"
      className="inmarsat-asset-drawer-scope"
    />
  );
}
