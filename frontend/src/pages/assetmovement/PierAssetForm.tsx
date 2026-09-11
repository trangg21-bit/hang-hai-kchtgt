import React, { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  BankOutlined,
  SlidersOutlined,
  RocketOutlined,
  HistoryOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { Pier } from '../../types/port';
import type {
  PierAsset,
  PierAssetPayload,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import { fmtNum } from '../../utils/numFmt';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import {
  colors,
  fontWeightBold,
  fontSizeMd,
  radiusPill,
  spaceSm,
  textSecondary,
  statusOperational,
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
  PierAssetPayload,
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

export interface PierAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: PierAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  piers: Pier[];
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

export default function PierAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  piers,
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
}: PierAssetFormProps) {
  const pierOptions = useMemo(
    () =>
      piers.map((item) => ({
        value: item.id,
        label: `${item.pierCode} - ${item.pierName}`,
      })),
    [piers],
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
                name: 'pierId',
                label: 'Mã cầu cảng',
                type: FormFieldType.Select,
                options: pierOptions,
                placeholder: 'Chọn cầu cảng',
                required: true,
                rules: [{ required: true, message: 'Mã cầu cảng là bắt buộc' }],
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: FormFieldType.Select,
                initialValue: 'PIER',
                disabled: true,
                options: [
                  { value: 'PIER', label: 'Tài sản cầu cảng' },
                ],
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
                options: ASSET_CONDITIONS.map((c) => ({ value: c, label: c })),
                placeholder: 'Chọn tình trạng',
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: FormFieldType.Select,
                options: USAGE_STATUSES.map((s) => ({ value: s, label: s })),
                placeholder: 'Chọn hiện trạng',
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
                name: 'address',
                label: 'Địa chỉ',
                type: FormFieldType.TextArea,
                colSpan: 24,
                placeholder: 'Nhập địa chỉ tài sản',
              },
              {
                name: 'origin',
                label: 'Nguồn gốc',
                type: FormFieldType.Select,
                options: ORIGINS.map((o) => ({ value: o, label: o })),
                placeholder: 'Chọn nguồn gốc tài sản',
              },
            ],
          },
          {
            key: 'aggregate_indicators',
            title: 'Chỉ số tổng hợp',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập số lượng',
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính số lượng',
                type: FormFieldType.Select,
                options: UNITS.map((u) => ({ value: u, label: u })),
                placeholder: 'Chọn đơn vị tính',
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
                type: FormFieldType.DatePicker,
                picker: 'year',
                placeholder: 'Chọn năm',
              },
              {
                name: 'useDate',
                label: 'Ngày sử dụng tài sản',
                type: FormFieldType.DatePicker,
                placeholder: 'Chọn ngày bắt đầu sử dụng',
              },
              {
                name: 'landArea',
                label: 'Diện tích (đất, sàn sử dụng: m2)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập diện tích đất',
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m2)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập diện tích sàn',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: FormFieldType.TextArea,
                colSpan: 24,
                placeholder: 'Nhập mô tả vị trí tài sản',
              },
            ],
          },
        ],
      },
      {
        key: 'attachments',
        label: `Hồ sơ tài sản (${attachments.length})`,
        customContent: (
          <div style={{ padding: spaceSm }}>
            <InfrastructureAttachmentTab
              items={attachments}
              onUpload={onUploadAttachment}
              onDelete={onDeleteAttachment}
              onDownload={onDownloadAttachment}
              readOnly={drawerMode === 'detail'}
            />
          </div>
        ),
      },
      {
        key: 'details',
        label: 'Thông tin chi tiết',
        sections: [
          {
            key: 'detailed_info',
            title: 'Thông tin chi tiết tài sản',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'declarationDate',
                label: 'Ngày kê khai tài sản',
                type: FormFieldType.DatePicker,
                placeholder: 'Chọn ngày kê khai',
              },
              {
                name: 'originalValue',
                label: 'Nguyên giá (nguồn ngân sách, nguồn khác)',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập nguyên giá',
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                type: FormFieldType.Number,
                min: 0,
                max: 100,
                placeholder: 'Nhập tỷ lệ (%)',
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại',
                type: FormFieldType.Number,
                disabled: true,
                placeholder: 'Hệ thống tự tính',
              },
              {
                name: 'currencyUnit',
                label: 'Đơn vị tính giá trị',
                type: FormFieldType.Select,
                disabled: true,
                initialValue: 'VNĐ',
                options: [{ value: 'VNĐ', label: 'VNĐ' }],
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
                type: FormFieldType.DatePicker,
                placeholder: 'Chọn ngày bắt đầu tính khấu hao',
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
                type: FormFieldType.DatePicker,
                placeholder: 'Chọn ngày kết thúc khấu hao',
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế',
                type: FormFieldType.Number,
                min: 0,
                placeholder: 'Nhập khấu hao lũy kế',
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng',
                type: FormFieldType.Number,
                placeholder: 'Nhập khấu hao tháng',
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
                type: FormFieldType.Select,
                options: DISPOSAL_METHODS.map((m) => ({ value: m, label: m })),
                placeholder: 'Chọn hình thức xử lý',
              },
            ],
          },
        ],
      },
      {
        key: 'exploitation',
        label: `Khai thác tài sản (${exploitationRows.length})`,
        customContent: (
          <div style={{ padding: spaceSm }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                color: colors.primary,
                fontWeight: fontWeightBold,
                fontSize: fontSizeMd,
              }}
            >
              <RocketOutlined />
              <span>Danh sách các lần khai thác tài sản</span>
            </div>
            {exploitationRows.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 0',
                  color: textSecondary,
                }}
              >
                Chưa có dữ liệu khai thác cho tài sản này
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {exploitationRows.map((row, idx) => (
                  <div
                    key={row.id || idx}
                    style={{
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      padding: 12,
                      background: colors.white,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: fontWeightBold,
                        marginBottom: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        Năm khai thác: <b>{row.exploitationYear}</b>
                      </span>
                      <span style={{ color: statusOperational }}>
                        Thu được: {fmtNum(row.totalRevenue || row.doanhThu)} VNĐ
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 6,
                        fontSize: 12,
                        color: textSecondary,
                      }}
                    >
                      <div>
                        Đơn vị khai thác:{' '}
                        <b>{orgName ? orgName(row.operatorOrgUnitId) : '-'}</b>
                      </div>
                      <div>
                        Chi phí:{' '}
                        <b>{fmtNum(row.relatedCosts || row.depreciation)} VNĐ</b>
                      </div>
                      <div>
                        Nộp NSNN: <b>{fmtNum(row.stateBudgetPayment)} VNĐ</b>
                      </div>
                      <div>
                        Thực hiện dự án: <b>{fmtNum(row.projectAmount)} VNĐ</b>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        Ghi chú: {row.description || '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'price_history',
        label: `Thay đổi nguyên giá (${combinedAdjustments.length})`,
        customContent: (
          <div style={{ padding: spaceSm }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                color: colors.primary,
                fontWeight: fontWeightBold,
                fontSize: fontSizeMd,
              }}
            >
              <HistoryOutlined />
              <span>Lịch sử các lần điều chỉnh, tăng giảm nguyên giá</span>
            </div>
            {combinedAdjustments.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 0',
                  color: textSecondary,
                }}
              >
                Chưa có lịch sử thay đổi nguyên giá cho tài sản này
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {combinedAdjustments.map((row, idx) => (
                  <div
                    key={row.id || idx}
                    style={{
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      padding: 12,
                      background: colors.white,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: fontWeightBold,
                        marginBottom: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          color:
                            row.changeType === 'Tăng nguyên giá'
                              ? statusOperational
                              : statusCritical,
                        }}
                      >
                        {row.changeType}: +{fmtNum(row.adjustmentAmount || 0)}{' '}
                        VNĐ
                      </span>
                      <span>
                        Số QĐ: <b>{row.decisionNumber || '-'}</b>
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 6,
                        fontSize: 12,
                        color: textSecondary,
                      }}
                    >
                      <div>
                        Ngày QĐ:{' '}
                        <b>
                          {row.decisionDate
                            ? dayjs(row.decisionDate).format('DD/MM/YYYY')
                            : '-'}
                        </b>
                      </div>
                      <div>
                        Ngày áp dụng:{' '}
                        <b>
                          {row.adjustmentDate
                            ? dayjs(row.adjustmentDate).format('DD/MM/YYYY')
                            : '-'}
                        </b>
                      </div>
                      <div>
                        Nguyên giá trước:{' '}
                        <b>{fmtNum(row.originalValueBefore)} VNĐ</b>
                      </div>
                      <div>
                        Nguyên giá sau:{' '}
                        <b>{fmtNum(row.originalValueAfter)} VNĐ</b>
                      </div>
                      <div>
                        Còn lại trước:{' '}
                        <b>{fmtNum(row.remainingValueBefore)} VNĐ</b>
                      </div>
                      <div>
                        Còn lại sau:{' '}
                        <b>{fmtNum(row.remainingValueAfter)} VNĐ</b>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        Lý do: {row.reason || row.adjustmentReason || '-'}
                      </div>
                    </div>
                  </div>
                ))}
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
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: radiusPill,
                      fontSize: fontSizeMd,
                      fontWeight: 500,
                      background: `${selected?.approvalStatus === 'APPROVED' ? statusOperational : statusDraft}15`,
                      border: `1px solid ${selected?.approvalStatus === 'APPROVED' ? statusOperational : statusDraft}40`,
                      color: selected?.approvalStatus === 'APPROVED' ? statusOperational : statusDraft,
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
    pierOptions,
    attachments,
    drawerMode,
    onUploadAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
    exploitationRows,
    combinedAdjustments,
    orgName,
  ]);

  const actions = useMemo<FormSidebarAction[]>(() => {
    if (drawerMode === 'detail') {
      return [{ key: 'close', label: 'Đóng', onClick: onClose }];
    }

    return [
      {
        key: 'cancel',
        label: 'Hủy',
        onClick: onClose,
      },
      {
        key: 'draft',
        label: 'Lưu tạm',
        loading: saving && saveAction === 'DRAFT',
        onClick: () => onSave('DRAFT'),
      },
      {
        key: 'submit',
        label: 'Lưu và gửi phê duyệt',
        loading: saving && saveAction === 'PENDING_APPROVAL',
        onClick: () => onSave('PENDING_APPROVAL'),
      },
      {
        key: 'approve',
        label: 'Lưu và phê duyệt',
        type: 'primary',
        loading: saving && saveAction === 'APPROVED',
        onClick: () => onSave('APPROVED'),
      },
    ];
  }, [drawerMode, onClose, saving, saveAction, onSave]);

  const title = useMemo(() => {
    if (drawerMode === 'create') return 'Thêm mới tài sản cầu cảng';
    if (drawerMode === 'edit') return 'Chỉnh sửa tài sản cầu cảng';
    return 'Xem chi tiết tài sản cầu cảng';
  }, [drawerMode]);

  return (
    <DynamicFormSidebar<FormValues>
      open={open}
      title={title}
      form={form}
      tabs={formTabs}
      actions={actions}
      onClose={onClose}
      width={900}
      rootClassName="pier-drawer-scope"
    />
  );
}
