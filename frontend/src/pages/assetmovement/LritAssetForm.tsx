import React, { useMemo } from 'react';
import { Form, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import {
  CompassOutlined,
  SlidersOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type {
  LritAsset,
  LritAssetPayload,
} from '../../services/assetmovement/types';
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

export type LritFormValues = Omit<
  LritAssetPayload,
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
  // Khai thác tài sản (TAB 4)
  operatorOrgUnitId?: string;
  assetCategory?: string;
  unitOfMeasure?: string;
  exploitationQuantity?: number;
  exploitationDeadline?: Dayjs;
  totalRevenue?: number;
  relatedCosts?: number;
  stateBudgetPayment?: number;
  projectAmount?: number;
  description?: string;
};

const ASSET_CONDITIONS = ['Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được'];
const USAGE_STATUSES = ['Đang sử dụng', 'Chưa sử dụng', 'Tạm dừng sử dụng'];
const ASSET_GROUPS = [
  'Nhà, công trình xây dựng',
  'Máy móc, thiết bị',
  'Tài sản khác',
];
const ORIGINS = [
  'Mua sắm',
  'Đầu tư xây dựng',
  'Được giao',
  'Điều chuyển',
  'Khác',
];
const UNITS = ['Cái', 'Bộ', 'Chiếc', 'm²', 'm'];
const DISPOSAL_METHODS = ['Bán', 'Thanh lý', 'Điều chuyển', 'Tiêu hủy', 'Khác'];

export interface LritAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: LritAsset;
  form: FormInstance<LritFormValues>;
  organizations: Organization[];
  stations: { id: string; name: string; code?: string }[];
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function LritAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  stations,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: LritAssetFormProps) {
  const stationOptions = useMemo(
    () =>
      stations.map((item) => ({
        label: item.code ? `${item.name} (${item.code})` : item.name,
        value: item.id,
      })),
    [stations],
  );

  const formTabs = useMemo<FormTabConfig<LritFormValues>[]>(() => {
    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'basic_info',
            title: '1. Thông tin cơ bản & Quản lý vận hành',
            icon: <CompassOutlined />,
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
                name: 'lritStationId',
                label: 'Mã đài',
                type: FormFieldType.Select,
                options: stationOptions,
                placeholder: 'Chọn đài LRIT',
                required: true,
                rules: [{ required: true, message: 'Mã đài là bắt buộc' }],
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Select,
                initialValue: 'LRIT_STATION',
                disabled: true,
                options: [{ value: 'LRIT_STATION', label: 'Tài sản đài LRIT' }],
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
                placeholder: 'Nhập tên tài sản đài LRIT',
                required: true,
                rules: [{ required: true, message: 'Tên tài sản là bắt buộc' }],
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: FormFieldType.Text,
                placeholder: 'Nhập mã barcode',
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: FormFieldType.Select,
                placeholder: 'Chọn tình trạng',
                required: true,
                options: ASSET_CONDITIONS.map((v) => ({ value: v, label: v })),
                rules: [{ required: true, message: 'Tình trạng tài sản là bắt buộc' }],
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: FormFieldType.Select,
                placeholder: 'Chọn hiện trạng',
                required: true,
                options: USAGE_STATUSES.map((v) => ({ value: v, label: v })),
                rules: [{ required: true, message: 'Hiện trạng sử dụng là bắt buộc' }],
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: FormFieldType.Select,
                allowClear: true,
                placeholder: 'Chọn nhóm tài sản',
                options: ASSET_GROUPS.map((v) => ({ value: v, label: v })),
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
                allowClear: true,
                placeholder: 'Chọn nguồn gốc',
                options: ORIGINS.map((v) => ({ value: v, label: v })),
              },
              {
                name: 'quantityGroup',
                label: '',
                type: FormFieldType.Custom,
                colSpan: 12,
                customRender: () => (
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
                          style={{
                            borderRadius: radiusPill,
                            height: 40,
                            width: '100%',
                          }}
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
                          style={{
                            borderRadius: radiusPill,
                            height: 40,
                            width: '100%',
                          }}
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
                placeholder: 'Nhập model thiết bị',
              },
              {
                name: 'serialNumber',
                label: 'Serial',
                type: FormFieldType.Text,
                placeholder: 'Nhập serial thiết bị',
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
                type: FormFieldType.Text,
                placeholder: 'Nhập xuất xứ',
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
                label: 'Diện tích đất, sàn sử dụng (m²)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: '0',
              },
              {
                name: 'floorArea',
                label: 'Diện tích sàn sử dụng (m²)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: '0',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.TextArea,
                colSpan: 24,
                rows: 2,
                placeholder: 'Nhập vị trí tài sản',
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: FormFieldType.TextArea,
                colSpan: 24,
                rows: 2,
                placeholder: 'Nhập địa chỉ tài sản',
              },
            ],
          },
          {
            key: 'depreciation_info',
            title: '2. Thông tin giá trị & Khấu hao tài sản',
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
                  val != null ? fmtInputNumber(Number(val)) : '—',
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
                  val != null ? fmtInputNumber(Number(val)) : '—',
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
                type: FormFieldType.Select,
                allowClear: true,
                placeholder: 'Chọn hình thức xử lý',
                options: DISPOSAL_METHODS.map((v) => ({ value: v, label: v })),
              },
            ],
          },
        ],
      },
      {
        key: 'exploitation',
        label: 'Khai thác tài sản',
        sections: [
          {
            key: 'exploitation_section',
            title: 'Thông tin khai thác tài sản',
            icon: <RocketOutlined />,
            fields: [
              {
                name: 'operatorOrgUnitId',
                label: 'Đơn vị khai thác',
                type: FormFieldType.TreeSelect,
                organizations,
                placeholder: 'Chọn đơn vị khai thác',
              },
              {
                name: 'assetCategory',
                label: 'Danh mục tài sản',
                type: FormFieldType.Select,
                options: [
                  { label: 'Cho thuê tài sản', value: 'Cho thuê tài sản' },
                  { label: 'Liên doanh, liên kết', value: 'Liên doanh, liên kết' },
                  { label: 'Khai thác trực tiếp', value: 'Khai thác trực tiếp' },
                  { label: 'Khác', value: 'Khác' },
                ],
                placeholder: 'Chọn danh mục tài sản',
              },
              {
                name: 'unitOfMeasure',
                label: 'Đơn vị tính',
                type: FormFieldType.Select,
                options: UNITS.map((u) => ({ label: u, value: u })),
                placeholder: 'Chọn đơn vị tính',
              },
              {
                name: 'exploitationQuantity',
                label: 'Số lượng',
                type: FormFieldType.Number,
                min: 0,
                placeholder: '0',
              },
              {
                name: 'exploitationDeadline',
                label: 'Thời hạn khai thác',
                type: FormFieldType.Date,
                placeholder: 'Chọn thời hạn',
              },
              {
                name: 'totalRevenue',
                label: 'Tổng số tiền thu được (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: '0',
              },
              {
                name: 'relatedCosts',
                label: 'Chi phí có liên quan (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: '0',
              },
              {
                name: 'stateBudgetPayment',
                label: 'Nộp NSNN (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: '0',
              },
              {
                name: 'projectAmount',
                label: 'Số tiền được thực hiện dự án (VNĐ)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: '0',
              },
              {
                name: 'description',
                label: 'Ghi chú',
                type: FormFieldType.TextArea,
                colSpan: 24,
                rows: 2,
                placeholder: 'Nhập ghi chú khai thác tài sản',
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
    ];
  }, [
    organizations,
    stationOptions,
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
      return `Chỉnh sửa thông tin — ${selected?.assetName || 'Tài sản đài LRIT'}`;
    }
    return 'Thêm mới tài sản đài LRIT';
  }, [drawerMode, selected]);

  return (
    <DynamicFormSidebar<LritFormValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      rootClassName="lrit-drawer-scope"
      className="lrit-drawer-scope"
      tabs={formTabs}
      footerActions={footerActions}
    />
  );
}
