import { useMemo } from 'react';
import { Form, InputNumber } from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { DeploymentUnitOutlined, SlidersOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { VtsAssistOptionResponse } from '../../services/vtsassist/types';
import type {
  VtsAssistAsset,
  VtsAssistAssetPayload,
} from '../../services/vtsAssistAsset/types';
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

export type FormValues = Omit<
  VtsAssistAssetPayload,
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
  'Hệ thống phụ trợ VTS',
  'Thiết bị nguồn điện, lưu điện UPS',
  'Hệ thống chống sét, tiếp địa',
  'Hệ thống điều hòa, làm mát',
  'Hệ thống mạng, máy chủ phụ trợ',
  'Tài sản khác',
];
const ORIGINS = [
  'Mua sắm',
  'Đầu tư xây dựng',
  'Được giao',
  'Điều chuyển',
  'Khác',
];
const UNITS = ['Bộ', 'Cái', 'Hệ thống', 'Tuyến', 'Chiếc'];
const DISPOSAL_METHODS = ['Bán', 'Thanh lý', 'Điều chuyển', 'Tiêu hủy', 'Khác'];

export interface VtsAssistAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: VtsAssistAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  vtsAssists: VtsAssistOptionResponse[];
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function VtsAssistAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  vtsAssists,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: VtsAssistAssetFormProps) {
  const vtsAssistOptions = useMemo(
    () =>
      vtsAssists.map((item) => ({
        value: item.id,
        label: `${item.deviceCode} - ${item.deviceName}`,
      })),
    [vtsAssists],
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
                options: vtsAssistOptions,
                placeholder: 'Chọn hệ thống phụ trợ VTS',
                required: true,
                rules: [{ required: true, message: 'Mã thiết bị là bắt buộc' }],
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Select,
                initialValue: 'Tài sản hệ thống phụ trợ VTS',
                disabled: true,
                options: [
                  { value: 'Tài sản hệ thống phụ trợ VTS', label: 'Tài sản hệ thống phụ trợ VTS' },
                ],
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: FormFieldType.Text,
                disabled: true,
                placeholder: 'Hệ thống tự sinh (TS-VTS-xxxx)',
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                type: FormFieldType.Text,
                placeholder: 'Nhập tên tài sản',
                required: true,
                rules: [{ required: true, message: 'Tên tài sản là bắt buộc' }],
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: FormFieldType.Text,
                placeholder: 'Nhập mã vạch barcode',
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: FormFieldType.Select,
                initialValue: 'Tốt',
                options: ASSET_CONDITIONS.map((c) => ({ value: c, label: c })),
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: FormFieldType.Select,
                initialValue: 'Đang sử dụng',
                options: USAGE_STATUSES.map((s) => ({ value: s, label: s })),
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn nhóm tài sản',
                options: ASSET_GROUPS.map((g) => ({ value: g, label: g })),
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
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: FormFieldType.TextArea,
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
                placeholder: 'Nhập số serial thiết bị',
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
                placeholder: 'Nhập mô tả vị trí lắp đặt / trạm phụ trợ VTS',
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
          {
            key: 'depreciation_info',
            title: 'Giá trị tài sản & Khấu hao hao mòn',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'declarationDate',
                label: 'Ngày kê khai tài sản',
                type: FormFieldType.Date,
              },
              {
                name: 'originalValue',
                label: 'Nguyên giá (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập nguyên giá',
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/khấu hao (%)',
                type: FormFieldType.Number,
                min: 0,
                max: 100,
                placeholder: 'Nhập tỷ lệ (%)',
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại (VNĐ)',
                type: FormFieldType.Custom,
                customContent: () => {
                  const original =
                    Form.useWatch('originalValue', form) ?? 0;
                  const accumulated =
                    Form.useWatch('accumulatedDepreciation', form) ?? 0;
                  const remaining = Math.max(0, Number(original) - Number(accumulated));
                  return (
                    <div>
                      <span
                        style={{
                          display: 'block',
                          marginBottom: spaceSm,
                          color: colors.sidebarBg,
                          fontWeight: fontWeightBold,
                          fontSize: fontSizeMd,
                        }}
                      >
                        Giá trị còn lại (tự tính)
                      </span>
                      <InputNumber
                        value={remaining}
                        disabled
                        formatter={(val) => fmtInputNumber(val)}
                        style={{
                          width: '100%',
                          height: 40,
                          borderRadius: radiusPill,
                          background: '#f8fafc',
                          fontWeight: fontWeightBold,
                        }}
                        addonAfter="VNĐ"
                      />
                    </div>
                  );
                },
              },
              {
                name: 'valueUnit',
                label: 'Đơn vị tính giá trị',
                type: FormFieldType.Select,
                disabled: true,
                initialValue: 'VNĐ',
                options: [{ value: 'VNĐ', label: 'VNĐ' }],
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao',
                type: FormFieldType.Text,
                placeholder: 'Nhập số quyết định giao',
              },
              {
                name: 'depreciationStartDate',
                label: 'Ngày tính khấu hao',
                type: FormFieldType.Date,
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
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập khấu hao lũy kế',
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng (VNĐ)',
                type: FormFieldType.Custom,
                customContent: () => {
                  const original =
                    Form.useWatch('originalValue', form) ?? 0;
                  const months =
                    Form.useWatch('depreciationMonths', form) ?? 0;
                  const monthly =
                    months && Number(months) > 0
                      ? Math.round(Number(original) / Number(months))
                      : 0;
                  return (
                    <div>
                      <span
                        style={{
                          display: 'block',
                          marginBottom: spaceSm,
                          color: colors.sidebarBg,
                          fontWeight: fontWeightBold,
                          fontSize: fontSizeMd,
                        }}
                      >
                        Khấu hao tháng (tự tính)
                      </span>
                      <InputNumber
                        value={monthly}
                        disabled
                        formatter={(val) => fmtInputNumber(val)}
                        style={{
                          width: '100%',
                          height: 40,
                          borderRadius: radiusPill,
                          background: '#f8fafc',
                        }}
                        addonAfter="VNĐ"
                      />
                    </div>
                  );
                },
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn hình thức xử lý',
                options: DISPOSAL_METHODS.map((d) => ({ value: d, label: d })),
              },
            ],
          },
        ],
      },
    ];
  }, [
    organizations,
    vtsAssistOptions,
    attachments,
    form,
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
      return `Chỉnh sửa thông tin — ${selected?.assetName || 'Tài sản hệ thống phụ trợ VTS'}`;
    }
    return 'Thêm mới tài sản hệ thống phụ trợ VTS';
  }, [drawerMode, selected]);

  return (
    <DynamicFormSidebar<FormValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      width={
        typeof window !== 'undefined'
          ? Math.min(1000, Math.floor(window.innerWidth * 0.95))
          : 1000
      }
      rootClassName="vts-assist-asset-drawer-scope"
      className="vts-assist-asset-drawer-scope"
      tabs={formTabs}
      footerActions={footerActions}
    />
  );
}
