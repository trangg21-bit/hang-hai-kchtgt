import { useMemo } from 'react';
import { Form, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import {
  CompassOutlined,
  SlidersOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type {
  StationAsset,
  StationAssetPayload,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import type { StationTypeConfig } from './stationConfigs';
import { fmtInputNumber, fmtNum } from '../../utils/numFmt';
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
  statusOperational,
  statusDraft,
  textSecondary,
} from '../../themetokenchk';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';

export type StationFormValues = Omit<
  StationAssetPayload,
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

export interface StationAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: StationAsset;
  config: StationTypeConfig;
  form: FormInstance<StationFormValues>;
  organizations: Organization[];
  stations: { id: string; name: string; code?: string }[];
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

export default function StationAssetForm({
  open,
  drawerMode,
  selected,
  config,
  form,
  organizations,
  stations,
  attachments,
  exploitationRows = [],
  increaseRows = [],
  decreaseRows = [],
  orgName,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: StationAssetFormProps) {
  const stationOptions = useMemo(
    () =>
      stations.map((item) => ({
        label: item.code ? `${item.name} (${item.code})` : item.name,
        value: item.id,
      })),
    [stations],
  );

  const combinedAdjustments = useMemo(() => {
    return [
      ...increaseRows.map((row) => ({
        ...row,
        changeType: 'Tăng nguyên giá',
      })),
      ...decreaseRows.map((row) => ({
        ...row,
        changeType: 'Giảm nguyên giá',
      })),
    ];
  }, [increaseRows, decreaseRows]);

  const formTabs = useMemo<FormTabConfig<StationFormValues>[]>(() => {
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
                name: config.stationFieldName as unknown as keyof StationFormValues,
                label: config.stationLabel,
                type: FormFieldType.Select,
                options: stationOptions,
                placeholder: config.stationPlaceholder,
                required: true,
                rules: [{ required: true, message: `${config.stationLabel} là bắt buộc` }],
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Select,
                initialValue: config.type,
                disabled: true,
                options: [{ value: config.type, label: config.title }],
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
                type: FormFieldType.TextArea,
                colSpan: 24,
                rows: 2,
                placeholder: 'Nhập tên tài sản',
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
                options: USAGE_STATUSES.map((v) => ({ value: v, label: v })),
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
            ],
          },
          {
            key: 'summary_indices',
            title: 'Chỉ số tổng hợp',
            icon: <SlidersOutlined />,
            fields: [
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
                          style={{ width: '100%', borderRadius: radiusPill }}
                        />
                      </Form.Item>
                    </div>
                    <div style={{ width: 120 }}>
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
                          placeholder="ĐVT"
                          style={{ width: '100%', borderRadius: radiusPill }}
                          options={UNITS.map((u) => ({ label: u, value: u }))}
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
                placeholder: 'Chọn ngày sử dụng',
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
        ],
      },
      {
        key: 'files',
        label: `Hồ sơ tài sản (${attachments.length})`,
        customContent: () => (
          <div style={{ paddingTop: 6 }}>
            <InfrastructureAttachmentTab
              attachments={attachments}
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
            key: 'financial_info',
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
        label: `Khai thác tài sản (${exploitationRows.length})`,
        customContent: () => (
          <div style={{ paddingTop: 6 }}>
            {exploitationRows.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: textSecondary,
                  fontSize: fontSizeMd,
                }}
              >
                Chưa có lịch sử khai thác tài sản nào.
              </div>
            ) : (
              <div
                style={{
                  overflowX: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: fontSizeMd,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        textAlign: 'left',
                      }}
                    >
                      <th style={{ padding: '10px 12px' }}>STT</th>
                      <th style={{ padding: '10px 12px' }}>Đơn vị khai thác</th>
                      <th style={{ padding: '10px 12px' }}>Danh mục tài sản</th>
                      <th style={{ padding: '10px 12px' }}>Số lượng</th>
                      <th style={{ padding: '10px 12px' }}>Thời hạn</th>
                      <th style={{ padding: '10px 12px' }}>Doanh thu (VNĐ)</th>
                      <th style={{ padding: '10px 12px' }}>Chi phí (VNĐ)</th>
                      <th style={{ padding: '10px 12px' }}>Nộp NSNN (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exploitationRows.map((row, idx) => (
                      <tr
                        key={row.id || idx}
                        style={{ borderBottom: '1px solid #f1f5f9' }}
                      >
                        <td style={{ padding: '8px 12px' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {orgName ? orgName(row.operatorOrgUnitId) : row.operatorOrgUnitId || '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {row.assetCategory || '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {row.quantity != null
                            ? `${fmtNum(row.quantity)} ${row.unitOfMeasure || ''}`
                            : '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {row.exploitationDeadline || '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {(row.totalRevenue ?? row.doanhThu) != null
                            ? fmtNum(row.totalRevenue ?? row.doanhThu)
                            : '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {(row.relatedCosts ?? row.depreciation) != null
                            ? fmtNum(row.relatedCosts ?? row.depreciation)
                            : '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {row.stateBudgetPayment != null
                            ? fmtNum(row.stateBudgetPayment)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'adjustments',
        label: `Lịch sử thay đổi nguyên giá (${combinedAdjustments.length})`,
        customContent: () => (
          <div style={{ paddingTop: 6 }}>
            {combinedAdjustments.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: textSecondary,
                  fontSize: fontSizeMd,
                }}
              >
                Chưa có lịch sử thay đổi nguyên giá nào.
              </div>
            ) : (
              <div
                style={{
                  overflowX: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: fontSizeMd,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        textAlign: 'left',
                      }}
                    >
                      <th style={{ padding: '10px 12px' }}>STT</th>
                      <th style={{ padding: '10px 12px' }}>Loại thay đổi</th>
                      <th style={{ padding: '10px 12px' }}>Số QĐ</th>
                      <th style={{ padding: '10px 12px' }}>Ngày điều chỉnh</th>
                      <th style={{ padding: '10px 12px' }}>Số tiền (VNĐ)</th>
                      <th style={{ padding: '10px 12px' }}>Lý do</th>
                      <th style={{ padding: '10px 12px' }}>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedAdjustments.map((row, idx) => (
                      <tr
                        key={row.id || idx}
                        style={{ borderBottom: '1px solid #f1f5f9' }}
                      >
                        <td style={{ padding: '8px 12px' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: radiusPill,
                              fontSize: 12,
                              fontWeight: 500,
                              background:
                                row.changeType === 'Tăng nguyên giá'
                                  ? '#1BAF7A15'
                                  : '#E3494815',
                              color:
                                row.changeType === 'Tăng nguyên giá'
                                  ? '#1BAF7A'
                                  : '#E34948',
                            }}
                          >
                            {row.changeType}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {'increaseCode' in row
                            ? (row.increaseCode ? row.increaseCode : '—')
                            : (row.decreaseCode ? row.decreaseCode : '—')}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {row.createdAt ? String(row.createdAt).slice(0, 10) : '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {row.changeType === 'Tăng nguyên giá'
                            ? `+${fmtNum((row as AssetIncreaseResponse).increaseAmount)}`
                            : `-${fmtNum((row as AssetDecreaseResponse).decreaseAmount)}`}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {row.reason || '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {row.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'tracking',
        label: 'Xử lý & theo dõi',
        sections: [
          {
            key: 'audit_info',
            title: 'Xử lý & theo dõi',
            icon: <AuditOutlined />,
            fields: [
              {
                name: 'approvalStatusCustom' as unknown as keyof StationFormValues,
                label: 'Trạng thái',
                type: FormFieldType.Custom,
                colSpan: 12,
                customRender: () => (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: radiusPill,
                      fontSize: fontSizeMd,
                      fontWeight: 500,
                      background: `${selected?.approvalStatus === 'APPROVED' ? statusOperational : statusDraft}15`,
                      border: `1px solid ${selected?.approvalStatus === 'APPROVED' ? statusOperational : statusDraft}40`,
                      color:
                        selected?.approvalStatus === 'APPROVED'
                          ? statusOperational
                          : statusDraft,
                    }}
                  >
                    {selected?.approvalStatus || 'Lưu tạm'}
                  </span>
                ),
              },
              {
                name: 'updatedByName',
                label: 'Cán bộ cập nhật',
                type: FormFieldType.Readonly,
                initialValue: selected?.updatedByName || '—',
              },
              {
                name: 'submittedByName',
                label: 'Cán bộ gửi phê duyệt',
                type: FormFieldType.Readonly,
                initialValue: selected?.submittedByName || '—',
              },
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
                type: FormFieldType.Readonly,
                initialValue: selected?.portAuthorityApprovedByName || '—',
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
                type: FormFieldType.Readonly,
                colSpan: 24,
                initialValue: selected?.portAuthorityApprovalContent || '—',
              },
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
                type: FormFieldType.Readonly,
                initialValue: selected?.departmentApprovedByName || '—',
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung phê duyệt cấp Cục',
                type: FormFieldType.Readonly,
                colSpan: 24,
                initialValue: selected?.departmentApprovalContent || '—',
              },
            ],
          },
        ],
      },
    ];
  }, [
    organizations,
    stationOptions,
    config,
    attachments,
    exploitationRows,
    combinedAdjustments,
    orgName,
    onUploadAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
    selected,
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
      return `Chỉnh sửa thông tin — ${selected?.assetName || config.title}`;
    }
    return `Thêm mới ${config.title.toLowerCase()}`;
  }, [drawerMode, config, selected]);

  return (
    <DynamicFormSidebar<StationFormValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      rootClassName={`berth-drawer-scope ${config.drawerClassName || ''}`}
      className={`berth-drawer-scope ${config.drawerClassName || ''}`}
      tabs={formTabs}
      footerActions={footerActions}
      footerAlign="center"
    />
  );
}
