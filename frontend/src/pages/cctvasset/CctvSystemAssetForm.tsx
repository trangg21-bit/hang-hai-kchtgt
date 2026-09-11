import React, { useCallback, useMemo } from 'react';
import { Form, InputNumber } from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { BankOutlined, SlidersOutlined, ProfileOutlined } from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { CctvSystemAsset, CctvSystemAssetPayload, CctvDeviceOption } from '../../services/cctvasset/types';
import { fmtInputNumber } from '../../utils/numFmt';
import { getOrGenerateAttachmentBlob } from '../../utils/attachmentStorage';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import {
  colors,
  fontWeightBold,
  radiusPill,
} from '../../themetokenchk';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';

export type FormValues = Omit<
  CctvSystemAssetPayload,
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
const CCTV_ASSET_TYPES = [
  'Camera quan sát (Camera PTZ/Fixed)',
  'Đầu ghi hình (NVR/DVR)',
  'Máy chủ quản lý CCTV (VMS Server)',
  'Màn hình hiển thị giám sát',
  'Bộ chuyển mạch/Switch PoE',
  'Bộ lưu điện UPS CCTV',
  'Cáp tín hiệu/Quang CCTV',
  'Hệ thống phụ trợ',
  'Khác',
];
const UNITS = ['Bộ', 'Cái', 'Chiếc', 'Hệ thống', 'm', 'm²'];
const DISPOSAL_METHODS = ['Bán', 'Thanh lý', 'Điều chuyển', 'Tiêu hủy', 'Khác'];

export interface CctvSystemAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: CctvSystemAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  cctvDevices: CctvDeviceOption[];
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function CctvSystemAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  cctvDevices,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: CctvSystemAssetFormProps) {
  const isEdit = drawerMode === 'edit';
  const drawerTitle = isEdit
    ? `Chỉnh sửa tài sản HT CCTV — ${selected?.assetName || ''}`
    : 'Thêm mới tài sản HT CCTV';

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

  const tabs = useMemo<FormTabConfig<FormValues>[]>(() => {
    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        icon: <BankOutlined />,
        sections: [
          {
            key: 'org_info',
            title: 'Cơ quan & Tổ chức quản lý',
            fields: [
              {
                name: 'parentOrgUnitId',
                label: 'Cơ quan quản lý cấp trên',
                type: FormFieldType.TreeSelect,
                organizations,
                placeholder: 'Chọn cơ quan quản lý cấp trên',
                colSpan: 12,
              },
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                type: FormFieldType.TreeSelect,
                organizations,
                placeholder: 'Chọn đơn vị quản lý',
                required: true,
                rules: [{ required: true, message: 'Đơn vị quản lý là bắt buộc' }],
                colSpan: 12,
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                type: FormFieldType.TreeSelect,
                organizations,
                placeholder: 'Chọn đơn vị sử dụng',
                required: true,
                rules: [{ required: true, message: 'Đơn vị sử dụng là bắt buộc' }],
                colSpan: 12,
              },
              {
                name: 'cctvId',
                label: 'Mã thiết bị',
                type: FormFieldType.Select,
                placeholder: 'Chọn thiết bị CCTV',
                options: cctvDevices.map((item) => ({
                  value: item.id,
                  label: `${item.deviceCode} - ${item.deviceName}`,
                })),
                colSpan: 12,
              },
            ],
          },
          {
            key: 'asset_basic',
            title: 'Thông tin tài sản',
            fields: [
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn loại tài sản',
                options: CCTV_ASSET_TYPES.map((v) => ({ value: v, label: v })),
                required: true,
                colSpan: 12,
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: FormFieldType.Text,
                placeholder: 'Mã tài sản tự sinh (TS-CCTV-XXXXXX)',
                disabled: true,
                colSpan: 12,
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                type: FormFieldType.Text,
                placeholder: 'Nhập tên tài sản',
                required: true,
                colSpan: 24,
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: FormFieldType.Text,
                placeholder: 'Nhập barcode',
                colSpan: 12,
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn tình trạng',
                options: ASSET_CONDITIONS.map((v) => ({ value: v, label: v })),
                colSpan: 12,
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: FormFieldType.Select,
                placeholder: 'Chọn hiện trạng',
                options: USAGE_STATUSES.map((v) => ({ value: v, label: v })),
                colSpan: 12,
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn nhóm tài sản',
                options: ASSET_GROUPS.map((v) => ({ value: v, label: v })),
                colSpan: 12,
              },
              {
                name: 'assetSubgroup',
                label: 'Phân nhóm tài sản',
                type: FormFieldType.Text,
                placeholder: 'Nhập phân nhóm tài sản',
                colSpan: 12,
              },
              {
                name: 'origin',
                label: 'Nguồn gốc',
                type: FormFieldType.Select,
                placeholder: 'Chọn nguồn gốc',
                options: ORIGINS.map((v) => ({ value: v, label: v })),
                colSpan: 12,
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: FormFieldType.Text,
                placeholder: 'Nhập địa chỉ tài sản',
                colSpan: 24,
              },
            ],
          },
          {
            key: 'composite_indexes',
            title: 'Chỉ số tổng hợp',
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                type: FormFieldType.Number,
                placeholder: 'Nhập số lượng',
                min: 0,
                formatter: fmtInputNumber,
                colSpan: 12,
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính số lượng',
                type: FormFieldType.Select,
                placeholder: 'Chọn đơn vị',
                options: UNITS.map((v) => ({ value: v, label: v })),
                colSpan: 12,
              },
              {
                name: 'model',
                label: 'Model',
                type: FormFieldType.Text,
                placeholder: 'Nhập model',
                colSpan: 12,
              },
              {
                name: 'serialNumber',
                label: 'Serial',
                type: FormFieldType.Text,
                placeholder: 'Nhập serial',
                colSpan: 12,
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
                type: FormFieldType.Text,
                placeholder: 'Nhập xuất xứ',
                colSpan: 12,
              },
              {
                name: 'manufacturer',
                label: 'Hãng sản xuất',
                type: FormFieldType.Text,
                placeholder: 'Nhập hãng sản xuất',
                colSpan: 12,
              },
              {
                name: 'constructionYear',
                label: 'Năm xây dựng',
                type: FormFieldType.Year,
                placeholder: 'Chọn năm xây dựng',
                colSpan: 12,
              },
              {
                name: 'useDate',
                label: 'Ngày sử dụng tài sản',
                type: FormFieldType.Date,
                placeholder: 'Chọn ngày sử dụng',
                colSpan: 12,
              },
              {
                name: 'landArea',
                label: 'Diện tích (đất, sàn sử dụng: m²)',
                type: FormFieldType.Number,
                placeholder: 'Nhập diện tích',
                min: 0,
                formatter: fmtInputNumber,
                colSpan: 12,
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m²)',
                type: FormFieldType.Number,
                placeholder: 'Nhập diện tích',
                min: 0,
                formatter: fmtInputNumber,
                colSpan: 12,
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.Text,
                placeholder: 'Nhập vị trí tài sản',
                colSpan: 24,
              },
            ],
          },
        ],
      },
      {
        key: 'attachments',
        label: `Hồ sơ tài sản (${attachments.length})`,
        icon: <ProfileOutlined />,
        customContent: (
          <div style={{ padding: '8px 0' }}>
            <InfrastructureAttachmentTab
              refType="CCTV_SYSTEM_ASSET"
              refId={selected?.id || 'new'}
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
        icon: <SlidersOutlined />,
        sections: [
          {
            key: 'financial_info',
            title: 'Thông tin giá trị & Khấu hao tài sản',
            fields: [
              {
                name: 'declarationDate',
                label: 'Ngày kê khai tài sản',
                type: FormFieldType.Date,
                placeholder: 'Chọn ngày kê khai',
                colSpan: 12,
              },
              {
                name: 'originalValue',
                label: 'Nguyên giá (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                formatter: fmtInputNumber,
                placeholder: '0',
                colSpan: 12,
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                type: FormFieldType.Number,
                min: 0,
                max: 100,
                placeholder: '0',
                colSpan: 12,
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại (VNĐ)',
                type: FormFieldType.Number,
                disabled: true,
                formatter: fmtInputNumber,
                colSpan: 12,
              },
              {
                name: 'valueUnit',
                label: 'Đơn vị tính giá trị',
                type: FormFieldType.Select,
                disabled: true,
                initialValue: 'VNĐ',
                options: [{ value: 'VNĐ', label: 'VNĐ' }],
                colSpan: 12,
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao (bao gồm cả tăng vốn)',
                type: FormFieldType.Text,
                placeholder: 'Nhập số quyết định giao',
                colSpan: 12,
              },
              {
                name: 'depreciationStartDate',
                label: 'Ngày tính khấu hao',
                type: FormFieldType.Date,
                placeholder: 'Chọn ngày tính khấu hao',
                colSpan: 12,
              },
              {
                name: 'depreciationMonths',
                label: 'Số tháng tính khấu hao',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập số tháng',
                colSpan: 12,
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: FormFieldType.Date,
                placeholder: 'Chọn ngày hết khấu hao',
                colSpan: 12,
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                formatter: fmtInputNumber,
                placeholder: '0',
                colSpan: 12,
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng (VNĐ)',
                type: FormFieldType.Custom,
                colSpan: 12,
                customContent: () => (
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => {
                      const orig = Number(getFieldValue('originalValue')) || 0;
                      const months = Number(getFieldValue('depreciationMonths')) || 0;
                      const mDep = months > 0 ? Math.round(orig / months) : 0;
                      return (
                        <InputNumber
                          value={mDep}
                          disabled
                          formatter={fmtInputNumber}
                          style={{
                            width: '100%',
                            borderRadius: radiusPill,
                            height: 40,
                            background: '#f8fafc',
                          }}
                          placeholder="Tự động tính"
                        />
                      );
                    }}
                  </Form.Item>
                ),
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn hình thức',
                options: DISPOSAL_METHODS.map((v) => ({ value: v, label: v })),
                colSpan: 12,
              },
            ],
          },
        ],
      },
    ];
  }, [
    organizations,
    cctvDevices,
    attachments,
    selected?.id,
    onUploadAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
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

  const handleValuesChange = (
    changedValues: Partial<FormValues>,
    allValues: FormValues
  ) => {
    if (
      'originalValue' in changedValues ||
      'accumulatedDepreciation' in changedValues ||
      'depreciationMonths' in changedValues
    ) {
      const orig = Number(allValues.originalValue || 0);
      const acc = Number(allValues.accumulatedDepreciation || 0);
      const months = Number(allValues.depreciationMonths || 0);
      const rem = Math.max(0, orig - acc);
      const monthly = months > 0 ? Math.round(orig / months) : 0;
      form.setFieldsValue({
        remainingValue: rem,
        monthlyDepreciation: monthly,
      });
    }
  };

  return (
    <DynamicFormSidebar<FormValues>
      open={open}
      title={
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 16 }}>
          {drawerTitle}
        </span>
      }
      form={form}
      tabs={tabs}
      footerActions={footerActions}
      footerAlign="center"
      onClose={onClose}
      onValuesChange={handleValuesChange}
      width={typeof window !== 'undefined' ? Math.min(1040, Math.floor(window.innerWidth * 0.95)) : 1040}
      rootClassName="cctv-asset-drawer-scope"
    />
  );
}
