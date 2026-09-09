import { useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Select, Row, Col } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  DeleteOutlined, EditOutlined, EyeOutlined, MinusCircleOutlined,
  PlusCircleOutlined, PlusOutlined, RocketOutlined,
} from '@ant-design/icons';
import { ScreenHeader, DataTable, FilterTableLayout } from '../../components/list-view';
import type { ScreenHeaderAction } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import { AppDrawer } from '../../components/shared/AppDrawer';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import toast from '../../components/ToastNotification';
import { organizationService, type Organization } from '../../services/organizationService';
import { berthCRUD } from '../../services/portService';
import type { Berth } from '../../types/port';
import {
  createKhaiThac,
  createAssetDecrease,
  createAssetIncrease,
  createPortTerminalAsset,
  deletePortTerminalAsset,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchKhaiThacList,
  fetchPortTerminalAssets,
  updatePortTerminalAsset,
} from '../../services/assetmovement/api';
import type {
  AssetDecreaseResponse, AssetExploitationResponse, AssetIncreaseResponse,
  AssetValueAdjustmentDetails, PortTerminalAsset, PortTerminalAssetFilters,
  PortTerminalAssetPayload,
} from '../../services/assetmovement/types';
import type { InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import {
  colors, actionPrimary, statusOperational, statusAttention, statusCritical, statusDraft,
  borderDefault,
  fontSizeMd, fontWeightBold,
  radiusPill, radiusMd, spaceSm, spaceMd, spaceFormField,
  primaryButtonStyle, outlineButtonStyle, drawerTitleStyle, drawerFooterStyle,
  statusBadgeStyle, cellTitleStyle, cellSubtitleStyle, readonlyInputStyle,
  getDatePickerProps,
} from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import { fmtNum, fmtInputNumber } from '../../utils/numFmt';
import PortTerminalAssetForm, { type FormValues } from './PortTerminalAssetForm';
import PortTerminalAssetDetailContent from './PortTerminalAssetDetailContent';

const { RangePicker } = DatePicker;

type DrawerMode = 'create' | 'edit' | 'detail';
type OperationMode = 'exploit' | 'increase' | 'decrease';

interface OperationValues {
  operatorOrgUnitId?: string;
  unitOfMeasure?: string;
  quantity?: number;
  exploitationDeadline?: Dayjs;
  totalRevenue?: number;
  relatedCosts?: number;
  stateBudgetPayment?: number;
  projectAmount?: number;
  notes?: string;
  decisionNumber?: string;
  decisionDate?: Dayjs;
  adjustmentDate?: Dayjs;
  adjustmentReason?: string;
  originalValue?: number;
  declarationDate?: Dayjs;
  depreciationRate?: number;
  assignmentDecisionNumber?: string;
  depreciationStartDate?: Dayjs;
  depreciationMonths?: number;
  depreciationEndDate?: Dayjs;
  accumulatedDepreciation?: number;
  disposalMethod?: string;
}

const ASSET_CONDITIONS = ['Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được'];
const UNITS = ['Cái', 'Bộ', 'Chiếc', 'm²', 'm'];

const APPROVAL: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Lưu tạm', color: statusDraft },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: statusAttention },
  APPROVED_LEVEL1: { label: 'Chờ phê duyệt cấp Cục', color: actionPrimary },
  APPROVED: { label: 'Đã phê duyệt', color: statusOperational },
  REJECTED_LEVEL1: { label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  REJECTED_LEVEL2: { label: 'Từ chối cấp Cục', color: statusCritical },
};

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt', color: statusAttention },
  { key: 'APPROVED_LEVEL1', label: 'Chờ Cục duyệt', color: actionPrimary },
  { key: 'APPROVED', label: 'Đã duyệt', color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: 'Từ chối', color: statusCritical },
];

const fmtDate = (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm:ss') : '—');
const textCell = (value?: string) => <span title={value || ''}>{value || '—'}</span>;

const conditionBadge = (value?: string) => {
  const color = value === 'Tốt' ? statusOperational : value === 'Không sử dụng được' ? statusCritical : statusAttention;
  return <span style={statusBadgeStyle(color)}>{value || '—'}</span>;
};

const usageBadge = (value?: string) => {
  const color = value === 'Đang sử dụng' ? statusOperational : value === 'Tạm dừng sử dụng' ? statusCritical : statusDraft;
  return <span style={statusBadgeStyle(color)}>{value || '—'}</span>;
};

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) => Boolean((cause as { errorFields?: unknown }).errorFields);

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

function PortTerminalAssetList() {
  const [data, setData] = useState<PortTerminalAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<PortTerminalAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<PortTerminalAssetFilters>({});
  const [updatedRange, setUpdatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<PortTerminalAsset>();
  const [deleteTarget, setDeleteTarget] = useState<PortTerminalAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const adjustedOriginalValue = Form.useWatch('originalValue', operationForm);
  const adjustedAccumulatedDepreciation = Form.useWatch('accumulatedDepreciation', operationForm);
  const adjustedRemainingValue = adjustedOriginalValue == null ? undefined
    : Math.max(0, adjustedOriginalValue - (adjustedAccumulatedDepreciation || 0));
  const adjustedDepreciationMonths = Form.useWatch('depreciationMonths', operationForm);
  const adjustedMonthlyDepreciation = adjustedOriginalValue != null && adjustedDepreciationMonths && adjustedDepreciationMonths > 0
    ? Math.round((adjustedOriginalValue / adjustedDepreciationMonths) * 100) / 100 : undefined;

  const orgName = useMemo(() => new Map(organizations.map(item => [item.id, item.name])), [organizations]);
  const berthMap = useMemo(() => new Map(berths.map(item => [item.id, item])), [berths]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchPortTerminalAssets({ ...filters, page: page - 1, size: pageSize });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const statusKeys = Object.keys(APPROVAL);
      const [all, ...statusPages] = await Promise.all([
        fetchPortTerminalAssets(baseFilters),
        ...statusKeys.map(approvalStatus => fetchPortTerminalAssets({ ...baseFilters, approvalStatus })),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(statusKeys.map((key, index) => [key, statusPages[index].totalElements])),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản bến cảng.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void Promise.all([organizationService.getAll(), berthCRUD.findAll({ page: 1, size: 5000 })])
      .then(([orgs, berthPage]) => {
        setOrganizations(orgs);
        setBerths(berthPage.data);
      })
      .catch(() => toast.error('Không thể tải danh mục đơn vị hoặc bến cảng.'));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    form.resetFields();
    form.setFieldsValue({ assetType: 'PORT_TERMINAL', status: 'MANAGED' });
    setAttachments([]);
  }, [form]);

  const openEdit = (record: PortTerminalAsset) => {
    setSelected(record);
    setDrawerMode('edit');
    form.setFieldsValue({
      ...record,
      constructionYear: record.constructionYear ? dayjs(String(record.constructionYear)) : undefined,
      useDate: record.useDate ? dayjs(record.useDate) : undefined,
      declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
      depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
      depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
      attachmentName: record.attachmentName,
    });
    if (record.attachmentName) {
      setAttachments(record.attachmentName.split(',').map((name, i) => ({
        id: `att-${i}-${Date.now()}`,
        fileName: name.trim(),
        fileSize: 1024 * 512,
        uploadedByName: record.updatedByName || record.submittedByName || currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
        uploadedDate: record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString(),
      })));
    } else {
      setAttachments([]);
    }
  };

  const handleUploadAttachment = useCallback((file: File) => {
    const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
    const nowIso = dayjs().toISOString();
    const newAtt: InfrastructureAttachmentItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedByName: uploaderName,
      uploadedDate: nowIso,
      originFileObj: file,
    };
    setAttachments((prev) => [...prev, newAtt]);
  }, [currentUser]);

  const handleDeleteAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleDownloadAttachment = useCallback((id: string, fileName: string) => {
    const att = attachments.find((a) => a.id === id);
    if (att?.originFileObj) {
      const url = URL.createObjectURL(att.originFileObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast.info(`Đang tải xuống tệp: ${fileName}`);
    }
  }, [attachments]);

  const openDetail = async (record: PortTerminalAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exploitation, increases, decreases] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id, page: 0, size: 100 }),
        fetchAssetIncreaseList({ assetId: record.id, page: 0, size: 100 }),
        fetchAssetDecreaseList({ assetId: record.id, page: 0, size: 100 }),
      ]);
      setExploitationRows(exploitation.content);
      setIncreaseRows(increases.content);
      setDecreaseRows(decreases.content);
    } catch {
      setExploitationRows([]);
      setIncreaseRows([]);
      setDecreaseRows([]);
    }
  };

  const saveAsset = async (targetAction: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED') => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(targetAction);

      const attachmentName = attachments.length > 0
        ? attachments.map((a) => a.fileName).join(', ')
        : undefined;

      const payload: PortTerminalAssetPayload = {
        ...values,
        assetType: 'PORT_TERMINAL',
        constructionYear: values.constructionYear ? Number(values.constructionYear.format('YYYY')) : undefined,
        useDate: values.useDate?.format('YYYY-MM-DD'),
        declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
        depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
        depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
        attachmentName,
        approvalStatus: targetAction,
      };

      if (drawerMode === 'edit' && selected) {
        await updatePortTerminalAsset(selected.id, payload);
      } else {
        await createPortTerminalAsset(payload);
      }

      toast.success(
        targetAction === 'DRAFT'
          ? 'Đã lưu tạm tài sản bến cảng.'
          : targetAction === 'PENDING_APPROVAL'
            ? 'Đã lưu và gửi phê duyệt tài sản bến cảng.'
            : 'Đã lưu và phê duyệt tài sản bến cảng.',
      );
      setDrawerMode(undefined);
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) toast.error(getErrorMessage(cause, 'Không thể lưu tài sản bến cảng.'));
    } finally {
      setSaving(false);
    }
  };

  const saveOperation = async () => {
    if (!selected || !operationMode) return;
    try {
      const values = await operationForm.validateFields();
      if (operationMode !== 'exploit' && adjustedOriginalValue == null) {
        toast.error('Vui lòng nhập nguyên giá sau điều chỉnh.');
        return;
      }
      if (operationMode === 'increase' && adjustedOriginalValue! <= (selected.originalValue || 0)) {
        toast.error('Nguyên giá sau điều chỉnh phải lớn hơn nguyên giá hiện tại.');
        return;
      }
      if (operationMode === 'decrease' && adjustedOriginalValue! >= (selected.originalValue || 0)) {
        toast.error('Nguyên giá sau điều chỉnh phải nhỏ hơn nguyên giá hiện tại.');
        return;
      }
      setSaving(true);
      const adjustmentDetails: AssetValueAdjustmentDetails = {
        ...values,
        decisionDate: values.decisionDate?.format('YYYY-MM-DD'),
        adjustmentDate: values.adjustmentDate?.format('YYYY-MM-DD'),
        declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
        depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
        depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
        adjustmentNotes: values.notes,
        valueUnit: 'VNĐ',
        originalValueBefore: selected.originalValue,
        originalValueAfter: adjustedOriginalValue,
        remainingValueBefore: selected.remainingValue,
        remainingValueAfter: adjustedRemainingValue,
        monthlyDepreciation: adjustedMonthlyDepreciation,
      };

      if (operationMode === 'exploit') {
        await createKhaiThac({
          assetId: selected.id,
          assetName: selected.assetName,
          exploitationYear: dayjs(values.exploitationDeadline).year(),
          doanhThu: values.totalRevenue || 0,
          depreciation: values.relatedCosts || 0,
          description: values.notes || '',
          operatorOrgUnitId: values.operatorOrgUnitId,
          assetCategory: selected.assetName,
          unitOfMeasure: values.unitOfMeasure,
          quantity: values.quantity,
          exploitationDeadline: values.exploitationDeadline?.format('YYYY-MM-DD'),
          totalRevenue: values.totalRevenue,
          relatedCosts: values.relatedCosts,
          stateBudgetPayment: values.stateBudgetPayment,
          projectAmount: values.projectAmount,
        });
      } else if (operationMode === 'increase') {
        await createAssetIncrease({
          assetId: selected.id,
          assetName: selected.assetName,
          quantity: 1,
          unitOfMeasure: 'VNĐ',
          increaseCode: values.decisionNumber || '',
          reason: values.notes || '',
          adjustmentDetails,
        });
      } else {
        await createAssetDecrease({
          assetId: selected.id,
          assetName: selected.assetName,
          quantity: 1,
          unitOfMeasure: 'VNĐ',
          decreaseReason: values.adjustmentReason || '',
          reason: values.notes || '',
          adjustmentDetails,
        });
      }
      toast.success('Đã lưu thông tin.');
      setOperationMode(undefined);
      operationForm.resetFields();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) toast.error(getErrorMessage(cause, 'Không thể lưu thông tin.'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'stt', label: 'STT', width: 60, fixed: 'left' as const, align: 'center' as const,
      render: (_: unknown, __: unknown, index: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + index + 1}</span>,
    },
    {
      key: 'assetName', dataIndex: 'assetName', label: 'Tên/Mã tài sản', width: 230, fixed: 'left' as const, ellipsis: false,
      cellTitle: (record: PortTerminalAsset) => `${record.assetName || '—'} - ${record.assetCode || '—'}`,
      render: (value: string, record: PortTerminalAsset) => (
        <div>
          <a title={value} onClick={() => void openDetail(record)} style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value || '—'}
          </a>
          <span title={record.assetCode} style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.assetCode || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'orgUnitId', dataIndex: 'orgUnitId', label: 'Đơn vị quản lý', width: 250,
      render: (v: string) => <span style={{ fontWeight: fontWeightBold }}>{textCell(orgName.get(v))}</span>,
    },
    {
      key: 'usingOrgUnitId', dataIndex: 'usingOrgUnitId', label: 'Đơn vị sử dụng', width: 250,
      render: (v: string) => textCell(orgName.get(v)),
    },
    {
      key: 'berthId', dataIndex: 'berthId', label: 'Mã bến cảng', width: 190,
      render: (v: string) => textCell(berthMap.get(v)?.berthCode),
    },
    { key: 'assetType', dataIndex: 'assetType', label: 'Loại tài sản', width: 160, render: () => 'Tài sản bến cảng' },
    { key: 'assetCondition', dataIndex: 'assetCondition', label: 'Tình trạng tài sản', width: 190, ellipsis: false, render: conditionBadge },
    { key: 'usageStatus', dataIndex: 'usageStatus', label: 'Hiện trạng sử dụng', width: 190, ellipsis: false, render: usageBadge },
    { key: 'assetGroup', dataIndex: 'assetGroup', label: 'Nhóm tài sản', width: 210 },
    { key: 'useDate', dataIndex: 'useDate', label: 'Ngày sử dụng tài sản', width: 190, render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—') },
    {
      key: 'approvalStatus', dataIndex: 'approvalStatus', label: 'Trạng thái', width: 260, ellipsis: false,
      render: (v: keyof typeof APPROVAL) => {
        const item = APPROVAL[v] || { label: v || '—', color: statusDraft };
        return <span style={statusBadgeStyle(item.color)}>{item.label}</span>;
      },
    },
    {
      key: 'updatedAt', dataIndex: 'updatedAt', label: 'Cán bộ cập nhật', width: 210, ellipsis: false,
      cellTitle: (record: PortTerminalAsset) => `${record.updatedByName || '—'} - ${fmtDate(record.updatedAt)}`,
      render: (value: string, record: PortTerminalAsset) => (
        <div>
          <div style={{ fontWeight: fontWeightBold, overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.updatedByName || '—'}</div>
          <div style={cellSubtitleStyle}>{fmtDate(value)}</div>
        </div>
      ),
    },
    {
      key: 'submittedAt', dataIndex: 'submittedAt', label: 'Cán bộ gửi phê duyệt', width: 240, ellipsis: false,
      cellTitle: (record: PortTerminalAsset) => `${record.submittedByName || '—'} - ${fmtDate(record.submittedAt)}`,
      render: (value: string, record: PortTerminalAsset) => (
        <div>
          <div style={{ fontWeight: fontWeightBold, overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.submittedByName || '—'}</div>
          <div style={cellSubtitleStyle}>{fmtDate(value)}</div>
        </div>
      ),
    },
    {
      key: 'portAuthorityApprovedAt', dataIndex: 'portAuthorityApprovedAt', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', width: 340, ellipsis: false,
      cellTitle: (record: PortTerminalAsset) => `${record.portAuthorityApprovedByName || '—'} - ${fmtDate(record.portAuthorityApprovedAt)}`,
      render: (value: string, record: PortTerminalAsset) => (
        <div>
          <div style={{ fontWeight: fontWeightBold, overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.portAuthorityApprovedByName || '—'}</div>
          <div style={cellSubtitleStyle}>{fmtDate(value)}</div>
        </div>
      ),
    },
    {
      key: 'departmentApprovedAt', dataIndex: 'departmentApprovedAt', label: 'Cán bộ phê duyệt cấp Cục', width: 260, ellipsis: false,
      cellTitle: (record: PortTerminalAsset) => `${record.departmentApprovedByName || '—'} - ${fmtDate(record.departmentApprovedAt)}`,
      render: (value: string, record: PortTerminalAsset) => (
        <div>
          <div style={{ fontWeight: fontWeightBold, overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.departmentApprovedByName || '—'}</div>
          <div style={cellSubtitleStyle}>{fmtDate(value)}</div>
        </div>
      ),
    },
  ];

  const headerActions: ScreenHeaderAction[] = useMemo(() => [
    { key: 'create', label: 'Thêm mới', icon: <PlusOutlined />, variant: 'primary', onClick: openCreate },
  ], [openCreate]);

  const customBerthTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  return (
    <ThemeTokenProvider tokens={customBerthTokens}>
      <div className="berth-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

          /* ── Cỡ chữ 13.5px chuẩn toàn màn Quản lý bến cảng & các popup/drawer con ── */
          .berth-page-wrapper,
          .berth-page-wrapper .ant-table,
          .berth-page-wrapper .ant-table-cell,
          .berth-page-wrapper .ant-table-thead > tr > th,
          .berth-page-wrapper .ant-table-tbody > tr > td,
          .berth-page-wrapper .ant-input,
          .berth-page-wrapper .ant-select,
          .berth-page-wrapper .ant-select-selection-item,
          .berth-page-wrapper .ant-select-item-option-content,
          .berth-page-wrapper .ant-picker,
          .berth-page-wrapper .ant-picker-input > input,
          .berth-page-wrapper .ant-btn,
          .berth-page-wrapper .ant-pagination,
          .berth-page-wrapper .ant-pagination-item,
          .berth-page-wrapper .ant-pagination-total-text,
          .berth-page-wrapper .ant-breadcrumb,
          .berth-page-wrapper .ant-form-item-label > label,
          .berth-drawer-scope,
          .berth-drawer-scope .ant-drawer-content,
          .berth-drawer-scope .ant-tabs-tab,
          .berth-drawer-scope .chk-detail-label,
          .berth-drawer-scope .chk-detail-value,
          .berth-drawer-scope .ant-table,
          .berth-drawer-scope .ant-table-cell,
          .berth-drawer-scope .ant-table-thead > tr > th,
          .berth-drawer-scope .ant-btn,
          .berth-drawer-scope .ant-select,
          .berth-drawer-scope .ant-input,
          .berth-drawer-scope .ant-form-item-label > label,
          .berth-modal-scope,
          .berth-modal-scope .ant-modal-content,
          .berth-modal-scope .ant-btn,
          .berth-modal-scope .ant-input {
            font-size: 13.5px !important;
          }

          /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, thanh cuộn ngang khi tràn màn hình ── */
          .berth-page-wrapper div:has(> button[aria-pressed]) {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            justify-content: center !important;
            justify-content: safe center !important;
            align-items: center !important;
            scrollbar-width: thin !important;
            scrollbar-color: #cbd5e1 #f8fafc !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            padding: 2px 16px 6px 16px !important;
            gap: 20px !important;
          }
          .berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .berth-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }

          /* ── Responsive ScreenHeader co dãn đẹp khi zoom ── */
          .berth-page-wrapper > div:first-of-type {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          /* ── Responsive Drawers ── */
          .berth-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
        `}</style>

        <ScreenHeader
          breadcrumb={[{ label: 'Quản lý tài sản KCHT hàng hải' }, { label: 'Tài sản bến cảng' }]}
          actions={headerActions}
        />

        <FilterTableLayout
          hideFilterToggle
          loading={loading}
          error={Boolean(error)}
          errorMessage={error}
          onRetry={loadData}
          statusTabs={TAB_STATUS_LIST.map(tab => ({
            key: tab.key,
            label: tab.label,
            count: tab.key === 'all'
              ? (statusCounts.all || 0)
              : tab.key === 'REJECTED_LEVEL1'
                ? ((statusCounts.REJECTED_LEVEL1 || 0) + (statusCounts.REJECTED_LEVEL2 || 0))
                : (statusCounts[tab.key] || 0),
            color: tab.color,
            active: tab.key === 'all' ? !filters.approvalStatus : filters.approvalStatus === tab.key,
          }))}
          onStatusTabChange={(key) => {
            setPage(1);
            setFilters(current => ({ ...current, approvalStatus: key === 'all' ? undefined : key }));
          }}
          onFilterApply={() => {
            setPage(1);
            setFilters({
              ...draftFilters,
              updatedFrom: updatedRange?.[0]?.format('YYYY-MM-DD'),
              updatedTo: updatedRange?.[1]?.format('YYYY-MM-DD'),
            });
          }}
          onFilterReset={() => {
            setDraftFilters({});
            setUpdatedRange(null);
            setFilters({});
            setPage(1);
          }}
          filterContent={
            <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
              <div style={{ marginBottom: 12, marginTop: spaceMd }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Đơn vị quản lý
                </div>
                <OrgUnitTreeSelect
                  organizations={organizations}
                  value={draftFilters.orgUnitId}
                  onChange={value => setDraftFilters(current => ({ ...current, orgUnitId: value === '__all__' ? undefined : value as string }))}
                  placeholder="Chọn đơn vị..."
                  allowClear
                  showPath
                  allLabel="Tất cả"
                  treeDefaultExpandAll={false}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Đơn vị sử dụng
                </div>
                <OrgUnitTreeSelect
                  organizations={organizations}
                  value={draftFilters.usingOrgUnitId}
                  onChange={value => setDraftFilters(current => ({ ...current, usingOrgUnitId: value === '__all__' ? undefined : value as string }))}
                  placeholder="Chọn đơn vị..."
                  allowClear
                  showPath
                  allLabel="Tất cả"
                  treeDefaultExpandAll={false}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Mã bến cảng
                </div>
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  value={draftFilters.berthId}
                  onChange={value => setDraftFilters(current => ({ ...current, berthId: value }))}
                  options={berths.map(item => ({ value: item.id, label: `${item.berthCode} - ${item.berthName}` }))}
                  placeholder="Chọn bến cảng"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Loại tài sản
                </div>
                <Select
                  disabled
                  value="PORT_TERMINAL"
                  options={[{ value: 'PORT_TERMINAL', label: 'Tài sản bến cảng' }]}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Mã tài sản
                </div>
                <Input
                  value={draftFilters.assetCode}
                  onChange={e => setDraftFilters(current => ({ ...current, assetCode: e.target.value }))}
                  placeholder="Tìm theo mã tài sản"
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Tên tài sản
                </div>
                <Input
                  value={draftFilters.assetName}
                  onChange={e => setDraftFilters(current => ({ ...current, assetName: e.target.value }))}
                  placeholder="Tìm theo tên tài sản"
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Tình trạng tài sản
                </div>
                <Select
                  allowClear
                  placeholder="Chọn tình trạng"
                  value={draftFilters.assetCondition}
                  onChange={value => setDraftFilters(current => ({ ...current, assetCondition: value }))}
                  options={ASSET_CONDITIONS.map(value => ({ value, label: value }))}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Ngày cập nhật
                </div>
                <RangePicker
                  format="DD/MM/YYYY"
                  placeholder={['Từ ngày', 'Đến ngày']}
                  allowClear
                  popupClassName="chk-range-datepicker-popup"
                  value={updatedRange}
                  onChange={value => setUpdatedRange(value as [Dayjs | null, Dayjs | null] | null)}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>
            </div>
          }
        >
          <DataTable
            columns={columns}
            dataSource={data}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            rowActions={(record: PortTerminalAsset) => [
              { key: 'detail', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => void openDetail(record) },
              { key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => openEdit(record) },
              { key: 'exploit', label: 'Khai thác tài sản', icon: <RocketOutlined />, onClick: () => { setSelected(record); setOperationMode('exploit'); operationForm.resetFields(); } },
              { key: 'increase', label: 'Tăng nguyên giá', icon: <PlusCircleOutlined />, onClick: () => { setSelected(record); setOperationMode('increase'); operationForm.resetFields(); } },
              { key: 'decrease', label: 'Giảm nguyên giá', icon: <MinusCircleOutlined />, onClick: () => { setSelected(record); setOperationMode('decrease'); operationForm.resetFields(); } },
              { key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => setDeleteTarget(record) },
            ]}
          />
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            pageSizeOptions={[20, 50, 100, 5000]}
            onChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            }}
          />
        </FilterTableLayout>

        {/* ── Create / Edit Drawer ──────────────────────────────────────────── */}
        <AppDrawer
          width="min(920px, 96vw)"
          rootClassName="berth-drawer-scope"
          className="berth-drawer-scope"
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{drawerMode === 'edit' ? `Chỉnh sửa thông tin — ${selected?.assetName || 'Tài sản bến cảng'}` : 'Thêm mới tài sản bến cảng'}</span>}
          open={drawerMode === 'create' || drawerMode === 'edit'}
          destroyOnHidden
          onClose={() => {
            setDrawerMode(undefined);
            form.resetFields();
          }}
          footer={
            drawerMode === 'edit' ? (
              <div style={drawerFooterStyle}>
                {(!selected?.approvalStatus || ['DRAFT', 'NHAP'].includes(selected.approvalStatus.toUpperCase())) && (
                  <Button
                    onClick={() => void saveAsset('DRAFT')}
                    loading={saving && saveAction === 'DRAFT'}
                    style={outlineButtonStyle}
                  >
                    Lưu tạm
                  </Button>
                )}
                <Button
                  type="primary"
                  onClick={() => void saveAsset('APPROVED')}
                  loading={saving && saveAction === 'APPROVED'}
                  style={{
                    ...primaryButtonStyle,
                    background: statusOperational,
                    borderColor: statusOperational,
                  }}
                >
                  Lưu và phê duyệt
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => void saveAsset('DRAFT')}
                  loading={saving && saveAction === 'DRAFT'}
                  style={outlineButtonStyle}
                >
                  Lưu tạm
                </Button>
                <Button
                  type="primary"
                  onClick={() => void saveAsset('PENDING_APPROVAL')}
                  loading={saving && saveAction === 'PENDING_APPROVAL'}
                  style={primaryButtonStyle}
                >
                  Lưu và gửi phê duyệt
                </Button>
                <Button
                  type="primary"
                  onClick={() => void saveAsset('APPROVED')}
                  loading={saving && saveAction === 'APPROVED'}
                  style={{
                    ...primaryButtonStyle,
                    background: statusOperational,
                    borderColor: statusOperational,
                  }}
                >
                  Lưu và phê duyệt
                </Button>
              </div>
            )
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          <Form form={form} layout="vertical">
            <PortTerminalAssetForm
              form={form}
              organizations={organizations}
              berths={berths}
              attachments={attachments}
              onUploadAttachment={handleUploadAttachment}
              onDeleteAttachment={handleDeleteAttachment}
              onDownloadAttachment={handleDownloadAttachment}
            />
          </Form>
        </AppDrawer>

        {/* ── Detail Drawer ──────────────────────────────────────────── */}
        <AppDrawer
          width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
          rootClassName="berth-drawer-scope"
          className="berth-drawer-scope"
          title={<span style={drawerTitleStyle}>Chi tiết tài sản bến cảng{selected ? ` - ${selected.assetName}` : ''}</span>}
          open={drawerMode === 'detail'}
          onClose={() => setDrawerMode(undefined)}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px', overflow: 'hidden' },
          }}
          footer={null}
        >
          {selected && (
            <PortTerminalAssetDetailContent
              selectedRecord={selected}
              orgName={orgName}
              berthMap={berthMap}
              exploitationRows={exploitationRows}
              increaseRows={increaseRows}
              decreaseRows={decreaseRows}
            />
          )}
        </AppDrawer>

        {/* ── Operations Drawers ──────────────────────────────────────────── */}
        <AppDrawer
          open={Boolean(operationMode)}
          onClose={() => setOperationMode(undefined)}
          size="md"
          rootClassName="berth-drawer-scope"
          className="berth-drawer-scope"
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              {`${operationMode === 'exploit' ? 'Khai thác tài sản' : operationMode === 'increase' ? 'Tăng nguyên giá tài sản' : 'Giảm nguyên giá tài sản'} - ${selected?.assetName || ''}`}
            </span>
          }
          onOk={() => void saveOperation()}
          okText="Lưu thông tin"
          okLoading={saving}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '16px 24px' },
          }}
          footer={
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => setOperationMode(undefined)} style={outlineButtonStyle}>
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={() => void saveOperation()}
                loading={saving}
                style={primaryButtonStyle}
              >
                Lưu thông tin
              </Button>
            </div>
          }
        >
          <Form form={operationForm} layout="vertical">
            {operationMode === 'exploit' ? (
              <Row gutter={[24, 0]}>
                <Col span={12}>
                  <Form.Item name="operatorOrgUnitId" {...labelProps('Đơn vị khai thác')} required rules={[{ required: true, message: 'Đơn vị khai thác là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                    <OrgUnitTreeSelect organizations={organizations} variant="form" showPath />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Danh mục tài sản')} style={{ marginBottom: spaceFormField }}>
                    <Input disabled value={selected?.assetName} style={readonlyInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="unitOfMeasure" {...labelProps('Đơn vị tính')} style={{ marginBottom: spaceFormField }}>
                    <Select placeholder="Chọn đơn vị tính" options={UNITS.map(value => ({ value, label: value }))} style={selectStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="quantity" {...labelProps('Số lượng')} style={{ marginBottom: spaceFormField }}>
                    <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="exploitationDeadline" {...labelProps('Thời hạn khai thác')} required rules={[{ required: true, message: 'Thời hạn khai thác là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                    <DatePicker format="DD/MM/YYYY" placeholder="Chọn thời hạn" {...getDatePickerProps({ style: selectStyle })} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="totalRevenue" {...labelProps('Tổng số tiền thu được (VNĐ)')} style={{ marginBottom: spaceFormField }}>
                    <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="relatedCosts" {...labelProps('Chi phí có liên quan (VNĐ)')} style={{ marginBottom: spaceFormField }}>
                    <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="stateBudgetPayment" {...labelProps('Nộp NSNN (VNĐ)')} style={{ marginBottom: spaceFormField }}>
                    <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="projectAmount" {...labelProps('Số tiền được thực hiện dự án (VNĐ)')} style={{ marginBottom: spaceFormField }}>
                    <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="notes" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                    <Input.TextArea rows={3} placeholder="Nhập ghi chú" style={{ borderRadius: radiusMd }} />
                  </Form.Item>
                </Col>
              </Row>
            ) : (
              <Row gutter={[24, 0]}>
                <Col span={12}>
                  <Form.Item name="decisionNumber" {...labelProps('Số QĐ tăng/giảm nguyên giá')} required rules={[{ required: true, message: 'Số quyết định là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                    <Input placeholder="Nhập số quyết định" style={inputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="decisionDate" {...labelProps('Ngày ra QĐ tăng/giảm')} required rules={[{ required: true, message: 'Ngày ra quyết định là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                    <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày ra QĐ" {...getDatePickerProps({ style: selectStyle })} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="adjustmentDate" {...labelProps('Ngày tăng/giảm nguyên giá')} required rules={[{ required: true, message: 'Ngày thay đổi là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                    <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày thay đổi" {...getDatePickerProps({ style: selectStyle })} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="adjustmentReason" {...labelProps('Lý do tăng/giảm')} required rules={[{ required: true, message: 'Lý do là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                    <Select placeholder="Chọn lý do" options={['Đầu tư bổ sung', 'Đánh giá lại', 'Nâng cấp', 'Hao mòn', 'Thanh lý một phần', 'Khác'].map(value => ({ value, label: value }))} style={selectStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Nguyên giá trước điều chỉnh')} style={{ marginBottom: spaceFormField }}>
                    <Input disabled value={selected?.originalValue != null ? `${fmtNum(selected.originalValue)} VNĐ` : '—'} style={readonlyInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="originalValue" {...labelProps('Nguyên giá sau điều chỉnh (VNĐ)')} required rules={[{ required: true, message: 'Nguyên giá sau điều chỉnh là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                    <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Giá trị còn lại trước')} style={{ marginBottom: spaceFormField }}>
                    <Input disabled value={selected?.remainingValue != null ? `${fmtNum(selected.remainingValue)} VNĐ` : '—'} style={readonlyInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Giá trị còn lại sau')} style={{ marginBottom: spaceFormField }}>
                    <Input disabled value={adjustedRemainingValue != null ? `${fmtNum(adjustedRemainingValue)} VNĐ` : '—'} style={readonlyInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="declarationDate" {...labelProps('Ngày kê khai tài sản')} style={{ marginBottom: spaceFormField }}>
                    <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày kê khai" {...getDatePickerProps({ style: selectStyle })} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="depreciationRate" {...labelProps('Tỷ lệ hao mòn/Khấu hao (%)')} style={{ marginBottom: spaceFormField }}>
                    <InputNumber min={0} max={100} placeholder="0" style={numberInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="assignmentDecisionNumber" {...labelProps('Số quyết định giao (bao gồm cả tăng vốn)')} style={{ marginBottom: spaceFormField }}>
                    <Input placeholder="Nhập số quyết định" style={inputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="depreciationStartDate" {...labelProps('Ngày tính khấu hao')} style={{ marginBottom: spaceFormField }}>
                    <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày tính" {...getDatePickerProps({ style: selectStyle })} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="depreciationMonths" {...labelProps('Số tháng tính khấu hao')} style={{ marginBottom: spaceFormField }}>
                    <InputNumber min={0} placeholder="0" style={numberInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="depreciationEndDate" {...labelProps('Ngày hết khấu hao')} style={{ marginBottom: spaceFormField }}>
                    <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày hết" {...getDatePickerProps({ style: selectStyle })} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="accumulatedDepreciation" {...labelProps('Khấu hao lũy kế')} style={{ marginBottom: spaceFormField }}>
                    <InputNumber min={0} formatter={fmtInputNumber} placeholder="0" style={numberInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item {...labelProps('Khấu hao tháng')} style={{ marginBottom: spaceFormField }}>
                    <Input disabled value={adjustedMonthlyDepreciation != null ? `${fmtNum(adjustedMonthlyDepreciation)} VNĐ` : '—'} style={readonlyInputStyle} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="disposalMethod" {...labelProps('Hình thức xử lý tài sản')} style={{ marginBottom: spaceFormField }}>
                    <Select allowClear placeholder="Chọn hình thức xử lý" options={['Bán', 'Thanh lý', 'Điều chuyển', 'Tiêu hủy', 'Khác'].map(value => ({ value, label: value }))} style={selectStyle} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="notes" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                    <Input.TextArea rows={3} placeholder="Nhập ghi chú" style={{ borderRadius: radiusMd }} />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </Form>
        </AppDrawer>

        {/* ── Delete Confirmation Modal ────────────────────────────── */}
        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          onCancel={() => setDeleteTarget(undefined)}
          loading={saving}
          itemType="tài sản bến cảng"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={() => {
            if (!deleteTarget) return;
            setSaving(true);
            void deletePortTerminalAsset(deleteTarget.id)
              .then(() => {
                toast.success('Đã xóa tài sản bến cảng.');
                setDeleteTarget(undefined);
                return loadData();
              })
              .catch((cause: unknown) => toast.error(getErrorMessage(cause, 'Không thể xóa tài sản.')))
              .finally(() => setSaving(false));
          }}
        />
      </div>
    </ThemeTokenProvider>
  );
}

export default PortTerminalAssetList;
