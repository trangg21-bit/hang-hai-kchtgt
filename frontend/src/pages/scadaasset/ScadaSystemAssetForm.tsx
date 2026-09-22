import { BankOutlined, ProfileOutlined, SlidersOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Form } from 'antd';
import InputNumber from '../../components/shared/LocalizedInputNumber';
import type { Dayjs } from 'dayjs';
import { useCallback, useMemo } from 'react';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSidebarAction,
  type FormTabConfig,
} from '../../components/shared/dynamic-form-sidebar';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import { MARITIME_ASSET_TYPE_OPTIONS } from '../../constants/assetType';
import type { Organization } from '../../services/organizationService';
import type { ScadaDeviceOption, ScadaSystemAsset, ScadaSystemAssetPayload } from '../../services/scadaasset/types';
import { radiusPill } from '../../themetokenchk';
import { getOrGenerateAttachmentBlob } from '../../utils/attachmentStorage';
import { fmtInputNumber } from '../../utils/numFmt';

export type FormValues = Omit<
  ScadaSystemAssetPayload,
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

export interface ScadaSystemAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: ScadaSystemAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  scadaDevices: ScadaDeviceOption[];
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function ScadaSystemAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  scadaDevices,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: ScadaSystemAssetFormProps) {
  const isCreate = drawerMode === 'create';
  const title = isCreate
    ? 'Thêm mới tài sản hệ thống SCADA'
    : `Chỉnh sửa tài sản: ${selected?.assetCode || ''}`;

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

  const tabs = useMemo<FormTabConfig[]>(
    () => [
      {
        key: 'general',
        label: 'Thông tin chung',
        icon: <BankOutlined />,
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
            rules: [{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }],
            colSpan: 12,
          },
          {
            name: 'usingOrgUnitId',
            label: 'Đơn vị sử dụng',
            type: FormFieldType.TreeSelect,
            organizations,
            placeholder: 'Chọn đơn vị sử dụng',
            required: true,
            rules: [{ required: true, message: 'Vui lòng chọn đơn vị sử dụng' }],
            colSpan: 12,
          },
          {
            name: 'scadaId',
            label: 'Mã thiết bị',
            type: FormFieldType.Select,
            options: scadaDevices.map((item) => ({
              value: item.id,
              label: `${item.deviceCode} - ${item.deviceName}`,
            })),
            placeholder: 'Chọn mã thiết bị',
            colSpan: 12,
          },
          {
            name: 'assetType',
            label: 'Loại tài sản',
            type: FormFieldType.Select,
            options: MARITIME_ASSET_TYPE_OPTIONS,
            placeholder: 'Chọn loại tài sản',
            colSpan: 12,
          },
          {
            name: 'assetCode',
            label: 'Mã tài sản',
            type: FormFieldType.Text,
            disabled: true,
            placeholder: isCreate ? 'Hệ thống tự sinh (TS-SCADA-...)' : undefined,
            colSpan: 12,
          },
          {
            name: 'assetName',
            label: 'Tên tài sản',
            type: FormFieldType.TextArea,
            rows: 2,
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
            placeholder: 'Nhập barcode',
            colSpan: 12,
          },
          {
            name: 'assetCondition',
            label: 'Tình trạng tài sản',
            type: FormFieldType.Select,
            options: ASSET_CONDITION_OPTIONS,
            placeholder: 'Chọn tình trạng',
            colSpan: 12,
          },
          {
            name: 'usageStatus',
            label: 'Hiện trạng sử dụng',
            type: FormFieldType.Select,
            options: USAGE_STATUS_OPTIONS,
            placeholder: 'Chọn hiện trạng sử dụng',
            colSpan: 12,
          },
          {
            name: 'assetGroup',
            label: 'Nhóm tài sản',
            type: FormFieldType.Select,
            options: ASSET_GROUP_OPTIONS,
            placeholder: 'Chọn nhóm tài sản',
            colSpan: 12,
          },
          {
            name: 'assetSubgroup',
            label: 'Phân nhóm tài sản',
            type: FormFieldType.Text,
            maxLength: 200,
            placeholder: 'Nhập phân nhóm tài sản',
            colSpan: 12,
          },
          {
            name: 'origin',
            label: 'Nguồn gốc',
            type: FormFieldType.Select,
            options: ASSET_ORIGIN_OPTIONS,
            placeholder: 'Chọn nguồn gốc',
            colSpan: 12,
          },
          {
            name: 'address',
            label: 'Địa chỉ',
            type: FormFieldType.TextArea,
            rows: 2,
            maxLength: 2000,
            placeholder: 'Nhập địa chỉ tài sản',
            colSpan: 24,
          },
          {
            name: 'quantity',
            label: 'Số lượng',
            type: FormFieldType.Number,
            maxLength: 5,
            required: true,
            rules: [{ required: true, message: 'Vui lòng nhập số lượng' }],
            placeholder: 'Nhập số lượng',
            min: 1,
            formatter: fmtInputNumber,
            colSpan: 12,
            renderInput: () => (
              <InputNumber
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                min={1}
                placeholder="Nhập số lượng"
                {...fmtInputNumber}
              />
            ),
          },
          {
            name: 'quantityUnit',
            label: 'Đơn vị tính số lượng',
            type: FormFieldType.Select,
            required: true,
            rules: [{ required: true, message: 'Vui lòng chọn đơn vị tính số lượng' }],
            options: ASSET_QUANTITY_UNIT_OPTIONS,
            placeholder: 'Chọn đơn vị tính',
            colSpan: 12,
          },
          {
            name: 'model',
            label: 'Model',
            type: FormFieldType.Text,
            maxLength: 100,
            placeholder: 'Nhập model',
            colSpan: 12,
          },
          {
            name: 'serialNumber',
            label: 'Serial',
            type: FormFieldType.Text,
            maxLength: 100,
            placeholder: 'Nhập serial',
            colSpan: 12,
          },
          {
            name: 'countryOfOrigin',
            label: 'Xuất xứ',
            type: FormFieldType.Text,
            maxLength: 100,
            placeholder: 'Nhập xuất xứ',
            colSpan: 12,
          },
          {
            name: 'manufacturer',
            label: 'Hãng sản xuất',
            type: FormFieldType.Text,
            maxLength: 200,
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
            maxLength: 20,
            placeholder: 'Nhập diện tích',
            min: 0,
            formatter: fmtInputNumber,
            colSpan: 12,
          },
          {
            name: 'floorArea',
            label: 'Diện tích (sàn sử dụng: m²)',
            type: FormFieldType.Number,
            maxLength: 20,
            placeholder: 'Nhập diện tích sàn',
            min: 0,
            formatter: fmtInputNumber,
            colSpan: 12,
          },
          {
            name: 'assetLocation',
            label: 'Vị trí tài sản',
            type: FormFieldType.TextArea,
            rows: 2,
            maxLength: 2000,
            placeholder: 'Nhập vị trí tài sản',
            colSpan: 24,
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
            label: 'Nguyên giá (nguồn ngân sách, nguồn khác) (VNĐ)',
            type: FormFieldType.Number,
            maxLength: 20,
            min: 0,
            formatter: fmtInputNumber,
            placeholder: '0',
            colSpan: 12,
          },
          {
            name: 'depreciationRate',
            label: 'Tỷ lệ hao mòn/Khấu hao (%)',
            type: FormFieldType.Number,
            maxLength: 5,
            min: 0,
            max: 100,
            placeholder: '0',
            colSpan: 12,
          },
          {
            name: 'remainingValue',
            label: 'Giá trị còn lại (VNĐ)',
            type: FormFieldType.Custom,
            colSpan: 12,
            customRender: () => (
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => {
                  const orig = Number(getFieldValue('originalValue')) || 0;
                  const acc = Number(getFieldValue('accumulatedDepreciation')) || 0;
                  const rem = Math.max(0, orig - acc);
                  return (
                    <InputNumber
                      value={rem}
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
            name: 'valueUnit',
            label: 'Đơn vị tính giá trị',
            type: FormFieldType.Select,
            options: [{ value: 'VNĐ', label: 'VNĐ' }],
            defaultValue: 'VNĐ',
            disabled: true,
            colSpan: 12,
          },
          {
            name: 'assignmentDecisionNumber',
            label: 'Số quyết định giao (bao gồm cả tăng vốn)',
            type: FormFieldType.Text,
            maxLength: 200,
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
            maxLength: 5,
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
            maxLength: 20,
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
            customRender: () => (
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
            required: true,
            rules: [{ required: true, message: 'Vui lòng chọn hình thức xử lý' }],
            options: DISPOSAL_METHOD_OPTIONS,
            placeholder: 'Chọn hình thức xử lý',
            colSpan: 12,
          },
        ],
      },
    ],
    [
      organizations,
      scadaDevices,
      isCreate,
      attachments,
      onUploadAttachment,
      onDeleteAttachment,
      onDownloadAttachment,
      form,
      handleLoadReadonlyPreviewImage,
    ]
  );

  const sidebarActions = useMemo<FormSidebarAction[]>(() => {
    return [
      {
        key: 'draft',
        label: 'Lưu tạm',
        variant: 'outline',
        loading: saving && saveAction === 'DRAFT',
        onClick: () => onSave('DRAFT'),
      },
      {
        key: 'submit',
        label: 'Lưu và gửi phê duyệt',
        variant: 'primary',
        loading: saving && saveAction === 'PENDING_APPROVAL',
        onClick: () => onSave('PENDING_APPROVAL'),
      },
      {
        key: 'approve',
        label: 'Lưu và phê duyệt',
        variant: 'success',
        loading: saving && (saveAction === 'APPROVED' || saveAction === 'APPROVED_LEVEL1'),
        onClick: () => onSave('APPROVED'),
      },
    ];
  }, [saving, saveAction, onSave]);

  return (
    <DynamicFormSidebar
      open={open}
      title={title}
      form={form as unknown as FormInstance<Record<string, unknown>>}
      tabs={tabs}
      footerActions={sidebarActions}
      actions={sidebarActions}
      footerAlign="center"
      onClose={onClose}
    />
  );
}
