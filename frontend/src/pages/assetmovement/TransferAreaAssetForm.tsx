import { useMemo } from 'react';
import { Form, Select, InputNumber } from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  HistoryOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { TransferArea } from '../../types/port';
import type {
  TransferAreaAsset,
  TransferAreaAssetPayload,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import { fmtInputNumber, fmtNum } from '../../utils/numFmt';
import { useAuthStore } from '../../store/authStore';
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
  textSecondary,
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
} from '../../themetokenchk';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';

export type FormValues = Omit<
  TransferAreaAssetPayload,
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

export interface TransferAreaAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: TransferAreaAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  transferAreas: TransferArea[];
  attachments: InfrastructureAttachmentItem[];
  exploitationRows?: AssetExploitationResponse[];
  increaseRows?: AssetIncreaseResponse[];
  decreaseRows?: AssetDecreaseResponse[];
  orgName?: Map<string, string>;
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function TransferAreaAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  transferAreas,
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
}: TransferAreaAssetFormProps) {
  const effectiveDrawerMode = drawerMode || (selected ? 'edit' : 'create');
  const effectiveSelected = selected;

  const currentUser = useAuthStore((s) => s.user);
  const transferAreaOptions = useMemo(
    () =>
      transferAreas.map((item) => ({
        value: item.id,
        label: `${item.transferAreaCode} - ${item.transferAreaName}`,
      })),
    [transferAreas],
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

  const formTabs = useMemo<FormTabConfig<FormValues>[]>(() => {
    const currentApproval = selected?.approvalStatus || 'DRAFT';
    const isApproved = currentApproval === 'APPROVED';
    const isRejected = currentApproval.includes('REJECTED');
    const badgeColor = isApproved ? statusOperational : isRejected ? statusCritical : currentApproval === 'DRAFT' ? statusDraft : statusAttention;
    const badgeLabel = isApproved ? 'Đã duyệt' : isRejected ? 'Từ chối' : currentApproval === 'DRAFT' ? 'Lưu tạm' : 'Chờ phê duyệt';

    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'basic_info',
            title: 'Thông tin chung',
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
                name: 'transferAreaId',
                label: 'Mã khu chuyển tải',
                type: FormFieldType.Select,
                options: transferAreaOptions,
                placeholder: 'Chọn khu chuyển tải',
                required: true,
                rules: [{ required: true, message: 'Mã khu chuyển tải là bắt buộc' }],
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Select,
                initialValue: 'TRANSFER_AREA',
                disabled: true,
                options: [{ value: 'TRANSFER_AREA', label: 'Tài sản khu chuyển tải' }],
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: FormFieldType.Text,
                disabled: true,
                placeholder: 'Hệ thống tự sinh (TS-KCT-...)',
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
            key: 'metrics',
            title: 'Chỉ số tổng hợp',
            icon: <AppstoreOutlined />,
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
                          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
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
                          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
                            Đơn vị tính số lượng
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
              { name: 'model', label: 'Model', type: FormFieldType.Text, placeholder: 'Nhập model' },
              { name: 'serialNumber', label: 'Serial', type: FormFieldType.Text, placeholder: 'Nhập serial' },
              { name: 'countryOfOrigin', label: 'Xuất xứ', type: FormFieldType.Text, placeholder: 'Nhập xuất xứ' },
              { name: 'manufacturer', label: 'Hãng sản xuất', type: FormFieldType.Text, placeholder: 'Nhập hãng sản xuất' },
              { name: 'constructionYear', label: 'Năm xây dựng', type: FormFieldType.Year, placeholder: 'Chọn năm' },
              { name: 'useDate', label: 'Ngày sử dụng tài sản', type: FormFieldType.Date, placeholder: 'Chọn ngày' },
              { name: 'landArea', label: 'Diện tích (đất, sàn sử dụng: m2)', type: FormFieldType.Number, min: 0, placeholder: '0' },
              { name: 'floorArea', label: 'Diện tích (sàn sử dụng: m2)', type: FormFieldType.Number, min: 0, placeholder: '0' },
              { name: 'assetLocation', label: 'Vị trí tài sản', type: FormFieldType.TextArea, colSpan: 24, rows: 2, placeholder: 'Nhập vị trí tài sản' },
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
        key: 'detail',
        label: 'Thông tin chi tiết',
        sections: [
          {
            key: 'depreciation_info',
            title: 'Thông tin chi tiết',
            icon: <SlidersOutlined />,
            fields: [
              { name: 'declarationDate', label: 'Ngày kê khai tài sản', type: FormFieldType.Date, placeholder: 'Chọn ngày kê khai' },
              { name: 'originalValue', label: 'Nguyên giá (nguồn ngân sách, nguồn khác)', type: FormFieldType.Number, min: 0, placeholder: '0' },
              { name: 'depreciationRate', label: 'Tỷ lệ hao mòn/Khấu hao (%)', type: FormFieldType.Number, min: 0, max: 100, placeholder: '0' },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại',
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  if (values.originalValue == null) return undefined;
                  return Math.max(0, Number(values.originalValue) - (Number(values.accumulatedDepreciation) || 0));
                },
                valueFormatter: (val) => (val != null ? fmtInputNumber(Number(val)) : '—'),
              },
              { name: 'valueUnit', label: 'Đơn vị tính giá trị', type: FormFieldType.Readonly, initialValue: 'VNĐ', valueFormatter: () => 'VNĐ' },
              { name: 'assignmentDecisionNumber', label: 'Số quyết định giao (bao gồm cả tăng vốn)', type: FormFieldType.Text, placeholder: 'Nhập số quyết định' },
              { name: 'depreciationStartDate', label: 'Ngày tính khấu hao', type: FormFieldType.Date, placeholder: 'Chọn ngày tính' },
              { name: 'depreciationMonths', label: 'Số tháng tính khấu hao', type: FormFieldType.Number, min: 0, placeholder: '0' },
              { name: 'depreciationEndDate', label: 'Ngày hết khấu hao', type: FormFieldType.Date, placeholder: 'Chọn ngày hết' },
              { name: 'accumulatedDepreciation', label: 'Khấu hao lũy kế', type: FormFieldType.Number, min: 0, placeholder: '0' },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng',
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  const orig = Number(values.originalValue);
                  const months = Number(values.depreciationMonths);
                  if (values.originalValue != null && months > 0) return Math.round((orig / months) * 100) / 100;
                  return undefined;
                },
                valueFormatter: (val) => (val != null ? fmtInputNumber(Number(val)) : '—'),
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
        customContent: (
          <div style={{ paddingTop: 8 }}>
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 12,
                fontSize: 13,
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <RocketOutlined style={{ fontSize: 16 }} />
              <span>
                Quản lý các đợt khai thác tài sản khu chuyển tải. Nghiệp vụ thêm mới đợt khai thác được kích hoạt từ menu hành động dòng trên bảng danh sách.
              </span>
            </div>
            {exploitationRows.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 0',
                  color: textSecondary,
                  background: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px dashed #E2E8F0',
                }}
              >
                Chưa có thông tin khai thác cho tài sản này.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F5F8FA', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 45 }}>STT</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Đơn vị khai thác</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Thời hạn</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Tổng thu (VNĐ)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Chi phí (VNĐ)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Nộp NSNN (VNĐ)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Cán bộ cập nhật</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exploitationRows.map((row, idx) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>
                          {orgName?.get(row.operatorOrgUnitId || '') || '—'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {row.exploitationDeadline ? dayjs(row.exploitationDeadline).format('DD/MM/YYYY') : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 500 }}>
                          {fmtNum(row.totalRevenue ?? row.doanhThu ?? 0)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          {fmtNum(row.relatedCosts ?? row.depreciation ?? 0)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          {fmtNum(row.stateBudgetPayment ?? 0)}
                        </td>
                        <td style={{ padding: '8px 10px' }}>{row.createdByName || '—'}</td>
                        <td style={{ padding: '8px 10px' }}>{row.notes || '—'}</td>
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
        customContent: (
          <div style={{ paddingTop: 8 }}>
            <div
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 12,
                fontSize: 13,
                color: '#1E40AF',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <HistoryOutlined style={{ fontSize: 16 }} />
              <span>
                Lịch sử tăng / giảm nguyên giá tài sản khu chuyển tải. Dữ liệu được ghi nhận tự động khi thực hiện nghiệp vụ điều chỉnh giá.
              </span>
            </div>
            {combinedAdjustments.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 0',
                  color: textSecondary,
                  background: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px dashed #E2E8F0',
                }}
              >
                Chưa có lịch sử thay đổi nguyên giá cho tài sản này.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F5F8FA', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 45 }}>STT</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Loại thay đổi</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Số QĐ</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ngày ra QĐ</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Lý do</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Nguyên giá sau (VNĐ)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Khấu hao lũy kế</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Cán bộ cập nhật</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedAdjustments.map((row, idx) => {
                      const isInc = row.changeType === 'Tăng nguyên giá';
                      return (
                        <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span
                              style={{
                                borderRadius: 999,
                                padding: '2px 8px',
                                fontSize: 12,
                                fontWeight: 500,
                                background: isInc ? '#1BAF7A15' : '#E3494815',
                                border: `1px solid ${isInc ? '#1BAF7A40' : '#E3494840'}`,
                                color: isInc ? '#1BAF7A' : '#E34948',
                              }}
                            >
                              {row.changeType}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 500 }}>
                            {(row as AssetIncreaseResponse).increaseCode || (row as AssetDecreaseResponse).decreaseReason || '—'}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            {row.updatedAt ? dayjs(row.updatedAt).format('DD/MM/YYYY') : '—'}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            {row.reason || (row as AssetDecreaseResponse).decreaseReason || '—'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#12468C' }}>
                            {row.adjustmentDetails?.originalValue ? fmtNum(Number(row.adjustmentDetails.originalValue)) : '—'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            {row.adjustmentDetails?.accumulatedDepreciation ? fmtNum(Number(row.adjustmentDetails.accumulatedDepreciation)) : '—'}
                          </td>
                          <td style={{ padding: '8px 10px' }}>{row.createdByName || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'approval',
        label: 'Xử lý & theo dõi',
        customContent: (
          <div style={{ paddingTop: 8 }}>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: 16,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#12468C',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AuditOutlined style={{ color: '#204e9c' }} />
                <span>Thông tin cập nhật & gửi phê duyệt</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 24px', fontSize: 13 }}>
                <div>
                  <span style={{ color: textSecondary }}>Trạng thái: </span>
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: 8,
                      borderRadius: 999,
                      padding: '2px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      background: `${badgeColor}15`,
                      border: `1px solid ${badgeColor}40`,
                      color: badgeColor,
                    }}
                  >
                    {badgeLabel}
                  </span>
                </div>
                <div>
                  <span style={{ color: textSecondary }}>Cán bộ cập nhật: </span>
                  <span style={{ fontWeight: 500 }}>
                    {selected?.updatedByName || currentUser?.fullName || '—'}
                  </span>
                </div>
                <div>
                  <span style={{ color: textSecondary }}>Ngày cập nhật: </span>
                  <span style={{ fontWeight: 500 }}>
                    {selected?.updatedAt
                      ? dayjs(selected.updatedAt).format('DD/MM/YYYY HH:mm:ss')
                      : dayjs().format('DD/MM/YYYY')}
                  </span>
                </div>
                <div>
                  <span style={{ color: textSecondary }}>Cán bộ gửi phê duyệt: </span>
                  <span style={{ fontWeight: 500 }}>{selected?.submittedByName || '—'}</span>
                </div>
                <div>
                  <span style={{ color: textSecondary }}>Ngày gửi phê duyệt: </span>
                  <span style={{ fontWeight: 500 }}>
                    {selected?.submittedAt ? dayjs(selected.submittedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: '#12468C', marginBottom: 12 }}>
                Tiến trình phê duyệt 2 cấp
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 6, borderLeft: '4px solid #EDA100' }}>
                  <div style={{ fontWeight: 600, color: '#B45309', marginBottom: 6 }}>
                    1. Phê duyệt cấp Cảng vụ / Chi cục
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 13 }}>
                    <div>
                      <span style={{ color: textSecondary }}>Cán bộ phê duyệt cấp Cảng vụ/Chi cục: </span>
                      <b>{selected?.portAuthorityApprovedByName || 'Chưa duyệt'}</b>
                    </div>
                    <div>
                      <span style={{ color: textSecondary }}>Ngày phê duyệt cấp Cảng vụ/Chi cục: </span>
                      {selected?.portAuthorityApprovedAt ? dayjs(selected.portAuthorityApprovedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: textSecondary }}>Nội dung phê duyệt: </span>
                      {selected?.portAuthorityApprovalContent || '—'}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 6, borderLeft: '4px solid #0284C7' }}>
                  <div style={{ fontWeight: 600, color: '#0369A1', marginBottom: 6 }}>
                    2. Phê duyệt cấp Cục Hàng hải
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 13 }}>
                    <div>
                      <span style={{ color: textSecondary }}>Cán bộ phê duyệt cấp Cục: </span>
                      <b>{selected?.departmentApprovedByName || 'Chưa duyệt'}</b>
                    </div>
                    <div>
                      <span style={{ color: textSecondary }}>Ngày phê duyệt cấp Cục: </span>
                      {selected?.departmentApprovedAt ? dayjs(selected.departmentApprovedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: textSecondary }}>Nội dung phê duyệt: </span>
                      {selected?.departmentApprovalContent || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ];
  }, [
    organizations,
    transferAreaOptions,
    attachments,
    onUploadAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
    exploitationRows,
    combinedAdjustments,
    selected,
    currentUser,
    orgName,
  ]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    if (effectiveDrawerMode === 'edit') {
      const isDraft =
        !effectiveSelected?.approvalStatus ||
        ['DRAFT', 'NHAP'].includes(
          String(effectiveSelected.approvalStatus).toUpperCase(),
        );

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

  const title =
    effectiveDrawerMode === 'edit'
      ? `Chỉnh sửa thông tin — ${effectiveSelected?.assetName || 'Tài sản khu chuyển tải'}`
      : 'Thêm mới Tài sản khu chuyển tải';

  return (
    <DynamicFormSidebar
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
    />
  );
}
