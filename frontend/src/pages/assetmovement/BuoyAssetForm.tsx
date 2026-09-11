import React, { useMemo } from 'react';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import {
  BankOutlined,
  SlidersOutlined,
  FileTextOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import type { Organization } from '../../services/organizationService';
import type { Buoy } from '../../types/beacon';
import type { BuoyStationResponse } from '../../services/buoy-station/types';
import type {
  BuoyAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import type { OperationMode } from './BuoyAssetOperationForm';
import { fmtInputNumber } from '../../utils/numFmt';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';

export interface BuoyFormValues {
  parentOrgUnitId?: string;
  orgUnitId?: string;
  usingOrgUnitId?: string;
  refId?: string;
  buoyId?: string;
  buoyStationId?: string;
  assetCode?: string;
  assetName?: string;
  assetType?: 'BUOY';
  barcode?: string;
  assetCondition?: string;
  usageStatus?: string;
  assetGroup?: string;
  assetSubgroup?: string;
  address?: string;
  origin?: string;
  quantity?: number;
  quantityUnit?: string;
  model?: string;
  serialNumber?: string;
  countryOfOrigin?: string;
  manufacturer?: string;
  constructionYear?: Dayjs;
  useDate?: Dayjs;
  landArea?: number;
  floorArea?: number;
  assetLocation?: string;
  attachmentName?: string;
  declarationDate?: Dayjs;
  originalValue?: number;
  depreciationRate?: number;
  accumulatedDepreciation?: number;
  remainingValue?: number;
  assignmentDecisionNumber?: string;
  depreciationStartDate?: Dayjs;
  depreciationMonths?: number;
  depreciationEndDate?: Dayjs;
  monthlyDepreciation?: number;
  disposalMethod?: string;
  status?: string;
  approvalStatus?: string;
}

const ASSET_CONDITIONS = ['Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được'];
const USAGE_STATUSES = ['Đang sử dụng', 'Chưa sử dụng', 'Tạm dừng sử dụng', 'Đang bảo trì/sửa chữa'];
const ASSET_GROUPS = ['Phao tiêu dẫn luồng', 'Phao báo hiệu nguy hiểm', 'Phao chuyên dùng', 'Nhà trạm quản lý vận hành', 'Thiết bị trạm phao tiêu', 'Khác'];
const ORIGINS = ['Đầu tư ngân sách', 'Tiếp nhận/Bàn giao', 'Mua sắm mới', 'Tài trợ/Viện trợ', 'Khác'];
const UNITS = ['Cái', 'Bộ', 'Chiếc', 'm²', 'm'];
const DISPOSAL_METHODS = ['Bán', 'Thanh lý', 'Điều chuyển', 'Tiêu hủy', 'Khác'];

export interface BuoyAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: BuoyAsset;
  form: FormInstance<BuoyFormValues>;
  organizations: Organization[];
  buoys: Buoy[];
  buoyStations: BuoyStationResponse[];
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment?: (id: string, fileName: string) => void;
  currentUser?: { fullName?: string; username?: string };
  exploitationRows?: AssetExploitationResponse[];
  increaseRows?: AssetIncreaseResponse[];
  decreaseRows?: AssetDecreaseResponse[];
  onOpenOperation?: (mode: OperationMode) => void;
}

export default function BuoyAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  buoys,
  buoyStations,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: BuoyAssetFormProps) {
  const refOptions = useMemo(() => {
    const stationOpts = (buoyStations || []).map((item) => ({
      value: `station:${item.id}`,
      label: `[Nha tram] ${item.code} - ${item.name}`,
    }));
    const buoyOpts = (buoys || []).map((item) => ({
      value: `buoy:${item.id}`,
      label: `[Phao tieu] ${item.code} - ${item.name}`,
    }));
    return [
      { label: 'Nhà trạm quản lý vận hành', options: stationOpts },
      { label: 'Phao, tiêu hàng hải', options: buoyOpts },
    ];
  }, [buoyStations, buoys]);

  const formTabs = useMemo<FormTabConfig<BuoyFormValues>[]>(() => {
    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        icon: <BankOutlined />,
        sections: [
          {
            key: 'basic_info',
            title: 'Thông tin cơ bản & Quản lý vận hành',
            icon: <BankOutlined />,
            fields: [
              { name: 'parentOrgUnitId', label: 'Cơ quan quản lý cấp trên', type: FormFieldType.TreeSelect, organizations },
              { name: 'orgUnitId', label: 'Đơn vị quản lý', type: FormFieldType.TreeSelect, organizations, required: true, rules: [{ required: true, message: 'Đơn vị quản lý là bắt buộc' }] },
              { name: 'usingOrgUnitId', label: 'Đơn vị sử dụng', type: FormFieldType.TreeSelect, organizations, required: true, rules: [{ required: true, message: 'Đơn vị sử dụng là bắt buộc' }] },
              { name: 'refId', label: 'Mã nhà trạm, phao tiêu', type: FormFieldType.Select, options: refOptions, placeholder: 'Chọn nhà trạm hoặc chọn phao tiêu', required: true, showSearch: true, rules: [{ required: true, message: 'Mã nhà trạm, phao tiêu là bắt buộc' }] },
              { name: 'assetType', label: 'Loại tài sản', type: FormFieldType.Select, initialValue: 'BUOY', disabled: true, options: [{ value: 'BUOY', label: 'Tài sản phao, tiêu và nhà trạm QLVH' }] },
              { name: 'assetCode', label: 'Mã tài sản', type: FormFieldType.Text, placeholder: 'Hệ thống tự sinh (TS-PT-...)', disabled: true },
              { name: 'assetName', label: 'Tên tài sản', type: FormFieldType.TextArea, required: true, colSpan: 12, placeholder: 'Nhập tên tài sản', rules: [{ required: true, message: 'Tên tài sản là bắt buộc' }] },
              { name: 'barcode', label: 'Barcode', type: FormFieldType.Text, placeholder: 'Nhập mã barcode' },
              { name: 'assetCondition', label: 'Tình trạng tài sản', type: FormFieldType.Select, required: true, placeholder: 'Chọn tình trạng', options: ASSET_CONDITIONS.map((v) => ({ value: v, label: v })), rules: [{ required: true, message: 'Tình trạng tài sản là bắt buộc' }] },
              { name: 'usageStatus', label: 'Hiện trạng sử dụng', type: FormFieldType.Select, required: true, placeholder: 'Chọn hiện trạng', options: USAGE_STATUSES.map((v) => ({ value: v, label: v })), rules: [{ required: true, message: 'Hiện trạng sử dụng là bắt buộc' }] },
              { name: 'assetGroup', label: 'Nhóm tài sản', type: FormFieldType.Select, placeholder: 'Chọn nhóm tài sản', options: ASSET_GROUPS.map((v) => ({ value: v, label: v })) },
              { name: 'assetSubgroup', label: 'Phân nhóm tài sản', type: FormFieldType.Text, placeholder: 'Nhập phân nhóm tài sản' },
              { name: 'origin', label: 'Nguồn gốc', type: FormFieldType.Select, placeholder: 'Chọn nguồn gốc', options: ORIGINS.map((v) => ({ value: v, label: v })) },
              { name: 'quantity', label: 'Số lượng', type: FormFieldType.Number, min: 0, placeholder: '0', colSpan: 6 },
              { name: 'quantityUnit', label: 'Đơn vị tính', type: FormFieldType.Select, placeholder: 'Đơn vị', options: UNITS.map((v) => ({ value: v, label: v })), colSpan: 6 },
              { name: 'model', label: 'Model', type: FormFieldType.Text, placeholder: 'Nhập model' },
              { name: 'serialNumber', label: 'Số Serial', type: FormFieldType.Text, placeholder: 'Nhập serial' },
              { name: 'countryOfOrigin', label: 'Xuất xứ', type: FormFieldType.Text, placeholder: 'Nhập xuất xứ' },
              { name: 'manufacturer', label: 'Hãng sản xuất', type: FormFieldType.Text, placeholder: 'Nhập hãng sản xuất' },
              { name: 'constructionYear', label: 'Năm xây dựng', type: FormFieldType.Year, placeholder: 'Chọn năm' },
              { name: 'useDate', label: 'Ngày sử dụng tài sản', type: FormFieldType.Date, placeholder: 'Chọn ngày' },
              { name: 'landArea', label: 'Diện tích (đất, sàn sử dụng: m²)', type: FormFieldType.Number, min: 0, placeholder: '0.00' },
              { name: 'floorArea', label: 'Diện tích sàn sử dụng (m²)', type: FormFieldType.Number, min: 0, placeholder: '0.00' },
              { name: 'address', label: 'Địa chỉ', type: FormFieldType.TextArea, colSpan: 24, placeholder: 'Nhập địa chỉ tài sản' },
              { name: 'assetLocation', label: 'Vị trí tài sản', type: FormFieldType.TextArea, colSpan: 24, placeholder: 'Nhập vị trí chi tiết của tài sản' },
            ],
          },
        ],
      },
      {
        key: 'files',
        label: `Hồ sơ tài sản (${attachments.length})`,
        icon: <FileTextOutlined />,
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
        icon: <SlidersOutlined />,
        sections: [
          {
            key: 'declaration_info',
            title: 'Kê khai & Giao tài sản',
            icon: <AuditOutlined />,
            fields: [
              { name: 'declarationDate', label: 'Ngày kê khai tài sản', type: FormFieldType.Date, placeholder: 'Chọn ngày' },
              { name: 'assignmentDecisionNumber', label: 'Số quyết định giao (bao gồm cả tăng vốn)', type: FormFieldType.Text, placeholder: 'Nhập số quyết định giao' },
              { name: 'disposalMethod', label: 'Hình thức xử lý tài sản', type: FormFieldType.Select, allowClear: true, placeholder: 'Chọn hình thức xử lý', options: DISPOSAL_METHODS.map((v) => ({ value: v, label: v })) },
            ],
          },
          {
            key: 'depreciation_info',
            title: 'Thông tin giá trị & Khấu hao tài sản',
            icon: <SlidersOutlined />,
            fields: [
              { name: 'originalValue', label: 'Nguyên giá (VNĐ)', type: FormFieldType.Number, min: 0, placeholder: '0' },
              { name: 'depreciationRate', label: 'Tỷ lệ hao mòn/Khấu hao (%)', type: FormFieldType.Number, min: 0, max: 100, placeholder: '0.00' },
              { name: 'accumulatedDepreciation', label: 'Khấu hao lũy kế (VNĐ)', type: FormFieldType.Number, min: 0, placeholder: '0' },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại (VNĐ)',
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  const original = Number(values.originalValue) || 0;
                  const accumulated = Number(values.accumulatedDepreciation) || 0;
                  return Math.max(0, original - accumulated);
                },
                valueFormatter: (val) => val != null ? fmtInputNumber(Number(val)) + ' VNĐ' : '—',
              },
              { name: 'depreciationStartDate', label: 'Ngày tính khấu hao', type: FormFieldType.Date, placeholder: 'Chọn ngày' },
              { name: 'depreciationMonths', label: 'Số tháng tính khấu hao', type: FormFieldType.Number, min: 0, placeholder: '0' },
              { name: 'depreciationEndDate', label: 'Ngày hết khấu hao', type: FormFieldType.Date, placeholder: 'Chọn ngày' },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng (VNĐ)',
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  const original = Number(values.originalValue) || 0;
                  const months = Number(values.depreciationMonths) || 0;
                  return months > 0 ? Math.round(original / months) : 0;
                },
                valueFormatter: (val) => val != null ? fmtInputNumber(Number(val)) + ' VNĐ' : '—',
              },
            ],
          },
        ],
      },
    ];
  }, [organizations, refOptions, attachments, onUploadAttachment, onDeleteAttachment, onDownloadAttachment]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    if (drawerMode === 'edit') {
      const isDraft = !selected?.approvalStatus || ['DRAFT', 'NHAP'].includes(String(selected.approvalStatus).toUpperCase());
      const actions: FormSidebarAction[] = [];
      if (isDraft) {
        actions.push({ key: 'draft', label: 'Lưu tạm', variant: 'outline', loading: saving && saveAction === 'DRAFT', onClick: () => void onSave('DRAFT') });
      }
      actions.push({ key: 'approve', label: 'Lưu và phê duyệt', variant: 'success', loading: saving && saveAction === 'APPROVED', onClick: () => void onSave('APPROVED') });
      return actions;
    }
    return [
      { key: 'draft', label: 'Lưu tạm', variant: 'outline', loading: saving && saveAction === 'DRAFT', onClick: () => void onSave('DRAFT') },
      { key: 'submit', label: 'Lưu và gửi phê duyệt', variant: 'primary', loading: saving && saveAction === 'PENDING_APPROVAL', onClick: () => void onSave('PENDING_APPROVAL') },
      { key: 'approve', label: 'Lưu và phê duyệt', variant: 'success', loading: saving && saveAction === 'APPROVED', onClick: () => void onSave('APPROVED') },
    ];
  }, [drawerMode, selected, saving, saveAction, onSave]);

  const title = drawerMode === 'edit'
    ? `Chỉnh sửa thông tin — ${selected?.assetName || 'Tài sản phao, tiêu và nhà trạm'}`
    : 'Thêm mới tài sản phao, tiêu và nhà trạm quản lý vận hành';

  return (
    <DynamicFormSidebar
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      tabs={formTabs}
      footerActions={footerActions}
      footerAlign="center"
      width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
    />
  );
}
