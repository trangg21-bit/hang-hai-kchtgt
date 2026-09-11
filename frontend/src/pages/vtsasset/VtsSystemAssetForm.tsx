import React, { useMemo, useCallback } from 'react';
import { Form, Select, InputNumber } from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { BankOutlined, SlidersOutlined, ProfileOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { VtsSystemAsset, VtsSystemAssetPayload } from '../../services/vtsasset/types';
import type { VtsSystemOption } from '../../services/vtsasset/api';
import { fmtInputNumber } from '../../utils/numFmt';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import {
  colors,
  fontWeightBold,
  fontSizeMd,
  radiusPill,
  spaceSm,
  spaceFormField,
} from '../../themetokenchk';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';
import { getOrGenerateAttachmentBlob } from '../../utils/attachmentStorage';

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

const ASSET_CONDITIONS = ['Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được'];
const USAGE_STATUSES = ['Đang sử dụng', 'Chưa sử dụng', 'Tạm dừng sử dụng'];
const ASSET_GROUPS = [
  'Nhà, công trình xây dựng',
  'Máy móc, thiết bị',
  'Phương tiện vận tải',
  'Tài sản khác',
];
const ORIGINS = [
  'Mua sắm',
  'Đầu tư xây dựng',
  'Được giao',
  'Điều chuyển',
  'Khác',
];
const VTS_ASSET_TYPES = [
  'Trạm radar',
  'Hệ thống trạm bờ AIS',
  'Quản lý hệ thống CCTV',
  'Quản lý hệ thống SCADA',
  'Quản lý hệ thống truyền dẫn',
  'Quản lý hệ thống phụ trợ VTS',
  'Khác',
];
const UNITS = ['Cái', 'Bộ', 'Chiếc', 'Hệ thống', 'm²', 'm'];
const DISPOSAL_METHODS = ['Bán', 'Thanh lý', 'Điều chuyển', 'Tiêu hủy', 'Khác'];

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
                options: VTS_ASSET_TYPES.map((v) => ({ value: v, label: v })),
                placeholder: 'Chọn loại tài sản',
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
                colSpan: 24,
                placeholder: 'Nhập tên tài sản',
                required: true,
                rules: [{ required: true, message: 'Tên tài sản là bắt buộc' }],
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: FormFieldType.Text,
                placeholder: 'Nhập barcode',
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: FormFieldType.Select,
                options: ASSET_CONDITIONS.map((v) => ({ value: v, label: v })),
                placeholder: 'Chọn tình trạng',
                required: true,
                rules: [{ required: true, message: 'Tình trạng tài sản là bắt buộc' }],
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: FormFieldType.Select,
                options: USAGE_STATUSES.map((v) => ({ value: v, label: v })),
                placeholder: 'Chọn hiện trạng sử dụng',
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: FormFieldType.Select,
                options: ASSET_GROUPS.map((v) => ({ value: v, label: v })),
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
                options: ORIGINS.map((v) => ({ value: v, label: v })),
                placeholder: 'Chọn nguồn gốc',
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: FormFieldType.TextArea,
                colSpan: 24,
                placeholder: 'Nhập địa chỉ',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.TextArea,
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
                name: 'quantityGroup',
                label: '',
                type: FormFieldType.Custom,
                colSpan: 12,
                customContent: () => (
                  <div style={{ display: 'flex', gap: spaceSm }}>
                    <div style={{ flex: 1 }}>
                      <Form.Item
                        name="quantity"
                        label={
                          <span
                            style={{
                              color: colors.sidebarBg,
                              fontWeight: fontWeightBold,
                              fontSize: fontSizeMd,
                            }}
                          >
                            Số lượng
                          </span>
                        }
                        style={{ marginBottom: spaceFormField }}
                      >
                        <InputNumber
                          min={0}
                          formatter={fmtInputNumber}
                          placeholder="0"
                          style={{ borderRadius: radiusPill, height: 40, width: '100%' }}
                        />
                      </Form.Item>
                    </div>
                    <div style={{ width: 140 }}>
                      <Form.Item
                        name="quantityUnit"
                        label={
                          <span
                            style={{
                              color: colors.sidebarBg,
                              fontWeight: fontWeightBold,
                              fontSize: fontSizeMd,
                            }}
                          >
                            Đơn vị tính
                          </span>
                        }
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          allowClear
                          placeholder="Đơn vị"
                          options={UNITS.map((v) => ({ value: v, label: v }))}
                          style={{ borderRadius: radiusPill, height: 40, width: '100%' }}
                        />
                      </Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                name: 'model',
                label: 'Model',
                type: FormFieldType.Text,
                placeholder: 'Nhập model',
              },
              {
                name: 'serialNumber',
                label: 'Serial',
                type: FormFieldType.Text,
                placeholder: 'Nhập serial',
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
                type: FormFieldType.Text,
                placeholder: 'Nhập nơi xuất xứ',
              },
              {
                name: 'manufacturer',
                label: 'Hãng sản xuất',
                type: FormFieldType.Text,
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
                placeholder: '0',
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m²)',
                type: FormFieldType.Number,
                min: 0,
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
                placeholder: '0',
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                type: FormFieldType.Number,
                min: 0,
                max: 100,
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
                options: DISPOSAL_METHODS.map((v) => ({ value: v, label: v })),
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
      width={typeof window !== 'undefined' ? Math.min(1040, Math.floor(window.innerWidth * 0.95)) : 1040}
    />
  );
}
