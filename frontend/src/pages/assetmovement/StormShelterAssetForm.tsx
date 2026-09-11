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
import type { StormShelterArea } from '../../types/port';
import type {
  StormShelterAsset,
  StormShelterAssetPayload,
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
  StormShelterAssetPayload,
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
};

const ASSET_CONDITIONS = [
  'Tốt',
  'Bình thường',
  'Xuống cấp',
  'Hư hỏng',
  'Chờ thanh lý',
];

const USAGE_STATUSES = [
  'Đang sử dụng',
  'Chưa sử dụng',
  'Tạm dừng',
  'Đang bảo trì',
  'Chờ điều chuyển',
];

const ASSET_GROUPS = [
  'Nhà cửa, vật kiến trúc',
  'Máy móc, thiết bị',
  'Phương tiện vận tải',
  'Thiết bị truyền dẫn',
  'Tài sản KCHT khác',
];

const ORIGINS = [
  'Được giao',
  'Đầu tư xây dựng',
  'Mua sắm',
  'Điều chuyển',
  'Tài trợ, biếu tặng',
  'Khác',
];

const UNITS = ['Cái', 'Bộ', 'Hệ thống', 'Chiếc', 'Mét', 'm2', 'Gói'];

const DISPOSAL_METHODS = [
  'Thu hồi',
  'Điều chuyển',
  'Bán',
  'Thanh lý',
  'Tiêu hủy',
  'Hình thức khác',
];

export interface StormShelterAssetFormProps {
  open: boolean;
  drawerMode: 'create' | 'edit';
  selected?: StormShelterAsset | null;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  stormShelters: StormShelterArea[];
  attachments: InfrastructureAttachmentItem[];
  exploitationRows?: AssetExploitationResponse[];
  increaseRows?: AssetIncreaseResponse[];
  decreaseRows?: AssetDecreaseResponse[];
  orgName?: (id?: string) => string;
  saving?: boolean;
  saveAction?: 'draft' | 'submit' | 'approve';
  onClose: () => void;
  onSave: (action: 'draft' | 'submit' | 'approve') => void;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function StormShelterAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  stormShelters,
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
}: StormShelterAssetFormProps) {
  const currentUser = useAuthStore((s) => s.user);
  const stormShelterOptions = useMemo(
    () =>
      stormShelters.map((item) => ({
        value: item.id,
        label: `${item.stormShelterCode} - ${item.stormShelterName}`,
      })),
    [stormShelters],
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
                name: 'stormShelterId',
                label: 'Mã khu tránh, trú bão',
                type: FormFieldType.Select,
                options: stormShelterOptions,
                placeholder: 'Chọn khu tránh, trú bão',
                required: true,
                rules: [{ required: true, message: 'Mã khu tránh, trú bão là bắt buộc' }],
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Select,
                initialValue: 'STORM_SHELTER',
                disabled: true,
                options: [{ value: 'STORM_SHELTER', label: 'Tài sản khu tránh, trú bão' }],
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: FormFieldType.Text,
                disabled: true,
                placeholder: 'Hệ thống tự sinh (TS-TB-...)',
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
                Quản lý các đợt khai thác tài sản khu tránh, trú bão. Nghiệp vụ thêm mới đợt khai thác được kích hoạt từ menu hành động dòng trên bảng danh sách.
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
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exploitationRows.map((row, idx) => (
                      <tr key={row.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px' }}>{orgName ? orgName(row.operatorOrgUnitId) : row.operatorOrgUnitId}</td>
                        <td style={{ padding: '8px 10px' }}>{row.exploitationDeadline ? dayjs(row.exploitationDeadline).format('DD/MM/YYYY') : '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 500 }}>{fmtNum(row.totalRevenue)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtNum(row.relatedCosts)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtNum(row.stateBudgetPayment)}</td>
                        <td style={{ padding: '8px 10px' }}>{row.notes || row.description || '—'}</td>
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
                color: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <HistoryOutlined style={{ fontSize: 16 }} />
              <span>
                Theo dõi biến động tăng/giảm nguyên giá tài sản theo quyết định. Để tạo biến động mới, sử dụng thao tác Tăng nguyên giá / Giảm nguyên giá ở menu hành động dòng.
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
                Chưa có biến động nguyên giá cho tài sản này.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F5F8FA', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 45 }}>STT</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Loại thay đổi</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Số quyết định</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ngày quyết định</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Giá trị điều chỉnh (VNĐ)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Lý do</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedAdjustments.map((row, idx) => (
                      <tr key={row.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: radiusPill,
                              fontSize: 12,
                              fontWeight: 500,
                              background: row.changeType === 'Tăng nguyên giá' ? '#ECFDF5' : '#FEF2F2',
                              color: row.changeType === 'Tăng nguyên giá' ? statusOperational : statusCritical,
                            }}
                          >
                            {row.changeType}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>{row.decisionNumber || row.adjustmentDetails?.decisionNumber || '—'}</td>
                        <td style={{ padding: '8px 10px' }}>
                          {row.decisionDate || row.adjustmentDetails?.decisionDate
                            ? dayjs(row.decisionDate || row.adjustmentDetails?.decisionDate).format('DD/MM/YYYY')
                            : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 500 }}>
                          {row.changeType === 'Tăng nguyên giá'
                            ? `+${fmtNum((row as AssetIncreaseResponse).increaseAmount || row.adjustmentDetails?.originalValueAfter || 0)}`
                            : `-${fmtNum((row as AssetDecreaseResponse).decreaseAmount || row.adjustmentDetails?.originalValueBefore || 0)}`}
                        </td>
                        <td style={{ padding: '8px 10px' }}>{row.reason || '—'}</td>
                        <td style={{ padding: '8px 10px' }}>{row.notes || row.adjustmentDetails?.adjustmentNotes || '—'}</td>
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
                name: 'approvalStatusCustom',
                label: 'Trạng thái',
                type: FormFieldType.Custom,
                colSpan: 12,
                customRender: () => (
                  <Form.Item
                    label={
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
                        Trạng thái
                      </span>
                    }
                    style={{ marginBottom: spaceFormField }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', height: 40 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: radiusPill,
                          background: `${badgeColor}15`,
                          border: `1px solid ${badgeColor}40`,
                          color: badgeColor,
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        {badgeLabel}
                      </span>
                    </div>
                  </Form.Item>
                ),
              },
              {
                name: 'updatedByName',
                label: 'Cán bộ cập nhật',
                type: FormFieldType.Readonly,
                initialValue: selected?.updatedByName || currentUser?.fullName || '—',
                valueFormatter: (val) => String(val || '—'),
              },
              {
                name: 'updatedAt',
                label: 'Ngày cập nhật',
                type: FormFieldType.Readonly,
                initialValue: selected?.updatedAt ? dayjs(selected.updatedAt).format('DD/MM/YYYY HH:mm') : dayjs().format('DD/MM/YYYY HH:mm'),
                valueFormatter: (val) => String(val || '—'),
              },
              {
                name: 'submittedByName',
                label: 'Cán bộ gửi phê duyệt',
                type: FormFieldType.Readonly,
                initialValue: selected?.submittedByName || '—',
                valueFormatter: (val) => String(val || '—'),
              },
              {
                name: 'submittedAt',
                label: 'Ngày gửi phê duyệt',
                type: FormFieldType.Readonly,
                initialValue: selected?.submittedAt ? dayjs(selected.submittedAt).format('DD/MM/YYYY HH:mm') : '—',
                valueFormatter: (val) => String(val || '—'),
              },
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
                type: FormFieldType.Readonly,
                initialValue: selected?.portAuthorityApprovedByName || '—',
                valueFormatter: (val) => String(val || '—'),
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục',
                type: FormFieldType.Readonly,
                initialValue: selected?.portAuthorityApprovedAt ? dayjs(selected.portAuthorityApprovedAt).format('DD/MM/YYYY HH:mm') : '—',
                valueFormatter: (val) => String(val || '—'),
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt',
                type: FormFieldType.Readonly,
                initialValue: selected?.portAuthorityApprovalContent || '—',
                valueFormatter: (val) => String(val || '—'),
              },
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
                type: FormFieldType.Readonly,
                initialValue: selected?.departmentApprovedByName || '—',
                valueFormatter: (val) => String(val || '—'),
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt cấp Cục',
                type: FormFieldType.Readonly,
                initialValue: selected?.departmentApprovedAt ? dayjs(selected.departmentApprovedAt).format('DD/MM/YYYY HH:mm') : '—',
                valueFormatter: (val) => String(val || '—'),
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung phê duyệt',
                type: FormFieldType.Readonly,
                initialValue: selected?.departmentApprovalContent || '—',
                valueFormatter: (val) => String(val || '—'),
              },
            ],
          },
        ],
      },
    ];
  }, [
    organizations,
    stormShelterOptions,
    selected,
    attachments,
    exploitationRows,
    combinedAdjustments,
    currentUser,
    orgName,
    onUploadAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
  ]);

  const actions = useMemo<FormSidebarAction[]>(() => {
    return [
      {
        key: 'draft',
        label: 'Lưu tạm',
        variant: 'default',
        loading: saving && saveAction === 'draft',
        onClick: () => onSave('draft'),
      },
      {
        key: 'submit',
        label: 'Lưu và gửi phê duyệt',
        variant: 'primary',
        loading: saving && saveAction === 'submit',
        onClick: () => onSave('submit'),
      },
      {
        key: 'approve',
        label: 'Lưu và phê duyệt',
        variant: 'primary',
        loading: saving && saveAction === 'approve',
        onClick: () => onSave('approve'),
      },
    ];
  }, [saving, saveAction, onSave]);

  return (
    <DynamicFormSidebar<FormValues>
      open={open}
      title={drawerMode === 'create' ? 'Thêm mới tài sản khu tránh, trú bão' : 'Chỉnh sửa tài sản khu tránh, trú bão'}
      form={form}
      tabs={formTabs}
      actions={actions}
      onClose={onClose}
      width={980}
    />
  );
}
