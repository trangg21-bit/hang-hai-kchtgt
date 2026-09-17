import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  RocketOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CommonStatusTabs,
  CommonTable,
  FilterTableLayout,
  ScreenHeader,
  TableColumnType,
  TableFilter,
  type FilterOption,
  type ScreenHeaderAction,
  type TableOption,
} from '../../components/list-view';
import { KchtApprovalModals } from '../../components/kcht/KchtApprovalModals';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import AppDrawer from '../../components/shared/AppDrawer';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import { ASSET_CONDITION_OPTIONS } from '../../constants/assetDropdown';
import { MARITIME_ASSET_TYPE_OPTIONS } from '../../constants/assetType';
import {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import { triggerBlobDownload } from '../../components/shared/infrastructureAttachmentUtils';
import toast from '../../components/ToastNotification';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import api from '../../services/api';
import {
  approveInfraAssetC1,
  approveInfraAssetC2,
  createAssetDecrease,
  createAssetIncrease,
  createKhaiThac,
  createPierAsset,
  deleteInfraAssetAttachment,
  deletePierAsset,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchInfraAssetAttachments,
  fetchInfraAssetHistory,
  fetchKhaiThacList,
  fetchPierAssets,
  rejectInfraAssetC1,
  rejectInfraAssetC2,
  submitInfraAssetApproval,
  updatePierAsset,
  uploadInfraAssetAttachments,
} from '../../services/assetmovement/api';

import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
  PierAsset,
  PierAssetFilters,
  PierAssetPayload,
} from '../../services/assetmovement/types';
import { organizationService, type Organization } from '../../services/organizationService';
import { pierCRUD } from '../../services/portService';
import { useAuthStore } from '../../store/authStore';
import { useAssetPermissions } from '../../hooks/useAssetPermissions';
import * as themeTokenChk from '../../themetokenchk';
import {
  actionPrimary,
  borderDefault,
  colors,
  drawerTitleStyle,
  fontSizeLg,
  fontWeightBold,
  radiusPill,
  spaceMd,
  spaceSm,
  spaceXl,
  textTertiary,
} from '../../themetokenchk';
import type { Pier } from '../../types/port';
import { countStandardHistoryCards, DEFAULT_IGNORED_FIELDS, isBlankOrDash, renderStandardHistoryCards, type RawHistoryRecord } from '../../utils/changeHistoryRenderer';
import { isAssetRecordEditable } from '../../utils/approvalEditPolicy';
import { formatHistoryNumber } from '../../utils/numFmt';
import PierAssetDetailContent from './PierAssetDetailContent';
import PierAssetForm, { type FormValues } from './PierAssetForm';
import PierAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './PierAssetOperationForm';

const STATUS_COUNT_KEYS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED_LEVEL1',
  'APPROVED',
  'REJECTED_LEVEL1',
  'REJECTED_LEVEL2',
  'ARCHIVED',
];

type DrawerMode = 'create' | 'edit' | 'detail';

const PIER_ASSET_FIELD_LABELS: Record<string, string> = {
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  orgUnitId: 'Đơn vị quản lý',
  usingOrgUnitId: 'Đơn vị sử dụng',
  pierId: 'Mã cầu cảng',
  assetType: 'Loại tài sản',
  types: 'Phân loại tài sản',
  assetCode: 'Mã tài sản',
  assetName: 'Tên tài sản',
  barcode: 'Barcode',
  assetCondition: 'Tình trạng tài sản',
  usageStatus: 'Hiện trạng sử dụng',
  assetGroup: 'Nhóm tài sản',
  assetSubgroup: 'Phân nhóm tài sản',
  origin: 'Nguồn gốc',
  address: 'Địa chỉ',
  landArea: 'Diện tích đất (m²)',
  floorArea: 'Diện tích sàn (m²)',
  constructionYear: 'Năm xây dựng',
  useDate: 'Ngày đưa vào sử dụng',
  declarationDate: 'Ngày kê khai',
  originalValue: 'Nguyên giá (VNĐ)',
  depreciationRate: 'Tỷ lệ hao mòn (%/năm)',
  accumulatedDepreciation: 'Hao mòn/khấu hao lũy kế (VNĐ)',
  remainingValue: 'Giá trị còn lại (VNĐ)',
  assignmentDecisionNumber: 'Số quyết định giao tài sản',
  depreciationStartDate: 'Ngày bắt đầu tính hao mòn',
  depreciationMonths: 'Thời gian sử dụng (tháng)',
  depreciationEndDate: 'Ngày kết thúc tính hao mòn',
  monthlyDepreciation: 'Mức hao mòn/khấu hao tháng (VNĐ)',
  disposalMethod: 'Hình thức xử lý',
  attachmentName: 'Tài liệu đính kèm',
  attachments: 'Tài liệu đính kèm',
};

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) => Boolean((cause as { errorFields?: unknown }).errorFields);

export default function PierAssetList() {
  const perms = useAssetPermissions(['pier', 'pierasset']);
  const [data, setData] = useState<PierAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [piers, setPiers] = useState<Pier[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<PierAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<PierAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<PierAsset>();
  const [deleteTarget, setDeleteTarget] = useState<PierAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const orgName = useMemo(() => new Map(organizations.map(item => [item.id, item.name])), [organizations]);
  const pierMap = useMemo(() => new Map(piers.map(item => [item.id, item])), [piers]);

  // ── History state (chuẩn /berth) ───────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<PierAsset | null>(null);
  const [historyRecords, setHistoryRecords] = useState<RawHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  const openHistory = useCallback(async (r: PierAsset) => {
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    try {
      const d = await fetchInfraAssetHistory(r.id);
      const ch = Array.isArray(d?.changeHistory) ? d.changeHistory : [];
      setHistoryRecords(ch);
    } catch {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const filteredHistoryRecords = useMemo(() => {
    return historyRecords.filter((rec) => {
      if (DEFAULT_IGNORED_FIELDS.has(rec.changedField)) return false;
      if (historySearch) {
        const s = historySearch.toLowerCase();
        const fName = (rec.changedField || '').toLowerCase();
        const oVal = String(rec.oldValue || '').toLowerCase();
        const nVal = String(rec.newValue || '').toLowerCase();
        if (!fName.includes(s) && !oVal.includes(s) && !nVal.includes(s)) return false;
      }
      if (historyFrom && dayjs(rec.changedAt || rec.approvedDate).isBefore(dayjs(historyFrom), 'day')) {
        return false;
      }
      if (historyTo && dayjs(rec.changedAt || rec.approvedDate).isAfter(dayjs(historyTo), 'day')) {
        return false;
      }
      return true;
    });
  }, [historyRecords, historySearch, historyFrom, historyTo]);

  const historyUpdateCount = useMemo(() => {
    return countStandardHistoryCards({
      records: filteredHistoryRecords,
      fieldLabels: PIER_ASSET_FIELD_LABELS,
      resolveUnitName: () => {
        const targetOrgId = historyTarget?.orgUnitId || historyTarget?.parentOrgUnitId;
        return targetOrgId ? (orgName.get(targetOrgId) || '') : '';
      },
      formatValue: (fn, raw) => {
        if (isBlankOrDash(raw)) return '';
        const normKey = (fn || '').toLowerCase();
        if (normKey.includes('orgunitid') || normKey.includes('donvi')) {
          return orgName.get(raw!) || raw;
        }
        if (fn === 'pierId') {
          const item = pierMap.get(raw!);
          return item ? `${item.pierCode} - ${item.pierName}` : raw;
        }
        if (
          fn === 'originalValue' ||
          fn === 'remainingValue' ||
          fn === 'accumulatedDepreciation' ||
          fn === 'monthlyDepreciation' ||
          fn === 'value'
        ) {
          return formatHistoryNumber(raw);
        }
        return undefined;
      },
    });
  }, [filteredHistoryRecords, historyTarget, orgName, pierMap]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchPierAssets({ ...filters, page: page - 1, size: pageSize });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, sortBy: undefined, sortDir: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchPierAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map(approvalStatus => fetchPierAssets({ ...baseFilters, approvalStatus })),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản cầu cảng.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void Promise.all([organizationService.getAll(), pierCRUD.findAll({ page: 1, size: 5000 })])
      .then(([orgs, pierPage]) => {
        setOrganizations(orgs);
        setPiers(pierPage.data);
      })
      .catch(() => toast.error('Không thể tải danh mục đơn vị hoặc cầu cảng.'));
  }, []);

  // ── Approval state & handlers ──────────────────────────────────────
  const [approvingRecord, setApprovingRecord] = useState<PierAsset | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  const [rejectingRecord, setRejectingRecord] = useState<PierAsset | null>(null);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const handleOpenApproveModal = useCallback((record: PierAsset, level: 'c1' | 'c2') => {
    setApprovingRecord(record);
    setApproveLevel(level);
    setApproveModalOpen(true);
  }, []);

  const handleApproveConfirm = useCallback(async (content: string) => {
    if (!approvingRecord) return;
    setApproveLoading(true);
    try {
      if (approveLevel === 'c1') {
        await approveInfraAssetC1(approvingRecord.id, content);
        toast.success('Đã phê duyệt cấp Cảng vụ/Chi cục');
      } else {
        await approveInfraAssetC2(approvingRecord.id, content);
        toast.success('Đã phê duyệt cấp Cục');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      await loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Phê duyệt thất bại'));
    } finally {
      setApproveLoading(false);
    }
  }, [approvingRecord, approveLevel, loadData]);

  const handleOpenRejectModal = useCallback((record: PierAsset, level: 'c1' | 'c2') => {
    setRejectingRecord(record);
    setRejectLevel(level);
    setRejectModalOpen(true);
  }, []);

  const handleRejectConfirm = useCallback(async (reason: string) => {
    if (!rejectingRecord) return;
    setRejectLoading(true);
    try {
      if (rejectLevel === 'c1') {
        await rejectInfraAssetC1(rejectingRecord.id, reason);
        toast.success('Đã từ chối phê duyệt cấp Cảng vụ/Chi cục');
      } else {
        await rejectInfraAssetC2(rejectingRecord.id, reason);
        toast.success('Đã từ chối phê duyệt cấp Cục');
      }
      setRejectModalOpen(false);
      setRejectingRecord(null);
      await loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Từ chối phê duyệt thất bại'));
    } finally {
      setRejectLoading(false);
    }
  }, [rejectingRecord, rejectLevel, loadData]);

  const handleSubmitApproval = useCallback(async (record: PierAsset) => {
    try {
      await submitInfraAssetApproval(record.id);
      const isReSubmit =
        record.approvalStatus === 'REJECTED_LEVEL1' ||
        record.approvalStatus === 'REJECTED_LEVEL2' ||
        (record as any).status === 'REJECTED_LEVEL1' ||
        (record as any).status === 'REJECTED_LEVEL2' ||
        record.approvalStatus === 'REJECTED';
      toast.success(isReSubmit ? 'Đã gửi lại phê duyệt' : 'Đã gửi Cảng vụ phê duyệt');
      await loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Gửi phê duyệt thất bại'));
    }
  }, [loadData]);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    form.resetFields();
    form.setFieldsValue({ status: 'MANAGED' });
    setAttachments([]);
    setExploitationRows([]);
    setIncreaseRows([]);
    setDecreaseRows([]);
  }, [form]);

  const openEdit = useCallback(async (record: PierAsset) => {
    if (!isAssetRecordEditable(record.approvalStatus)) {
      toast.warning('Hồ sơ đang ở trạng thái không được phép chỉnh sửa.');
      return;
    }
    setSelected(record);
    setDrawerMode('edit');
    form.resetFields();
    form.setFieldsValue({
      ...record,
      constructionYear: record.constructionYear ? dayjs(`${record.constructionYear}-01-01`) : undefined,
      useDate: record.useDate ? dayjs(record.useDate) : undefined,
      declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
      depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
      depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
    });

    fetchInfraAssetAttachments(record.id)
      .then((realAtts) => {
        if (realAtts && realAtts.length > 0) {
          setAttachments(
            realAtts.map((att) => ({
              id: att.id,
              fileName: att.fileName,
              fileSize: att.fileSize,
              fileType: att.contentType,
              uploadedByName: att.uploadedByName || record.updatedByName || record.submittedByName || 'Cán bộ quản lý',
              uploadedDate: att.uploadedAt || (record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString()),
              filePath: `/v1/asset/infra-assets/${record.id}/attachments/${att.id}/download`,
            }))
          );
        } else if (record.attachmentName) {
          setAttachments(
            record.attachmentName.split(',').map((name, i) => ({
              id: `att-${i}-${Date.now()}`,
              fileName: name.trim(),
              fileSize: 1024 * 512,
              uploadedByName: record.updatedByName || record.submittedByName || 'Cán bộ quản lý',
              uploadedDate: record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString(),
            }))
          );
        } else {
          setAttachments([]);
        }
      })
      .catch(() => {
        if (record.attachmentName) {
          setAttachments(
            record.attachmentName.split(',').map((name, i) => ({
              id: `att-${i}-${Date.now()}`,
              fileName: name.trim(),
              fileSize: 1024 * 512,
              uploadedByName: record.updatedByName || record.submittedByName || 'Cán bộ quản lý',
              uploadedDate: record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString(),
            }))
          );
        } else {
          setAttachments([]);
        }
      });

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
  }, [form]);

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
    if (selected?.id && id.includes('-')) {
      deleteInfraAssetAttachment(selected.id, id).catch(() => {});
    }
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, [selected]);

  const handleDownloadAttachment = useCallback(async (id: string, fileName: string) => {
    const att = attachments.find((a) => a.id === id);
    if (att?.originFileObj) {
      triggerBlobDownload(att.originFileObj, fileName || att.originFileObj.name);
      toast.success(`Đã tải xuống tệp: ${fileName}`);
      return;
    }
    if (att?.url && (att.url.startsWith('blob:') || att.url.startsWith('data:'))) {
      triggerBlobDownload(att.url, fileName || 'tai-lieu');
      toast.success(`Đã tải xuống tệp: ${fileName}`);
      return;
    }
    if (att?.filePath) {
      try {
        let cleanPath = att.filePath;
        if (cleanPath.startsWith('/api/')) {
          cleanPath = cleanPath.replace(/^\/api/, '');
        } else if (!cleanPath.startsWith('/')) {
          cleanPath = `/${cleanPath}`;
        }
        const res = await api.get(cleanPath, { responseType: 'blob' });
        const contentType = String(res.headers?.['content-type'] || 'application/octet-stream');
        const blob = new Blob([res.data], { type: contentType });
        triggerBlobDownload(blob, fileName || 'tai-lieu');
        toast.success(`Đã tải xuống tệp: ${fileName}`);
        return;
      } catch (err) {
        console.warn('Download error:', err);
      }
    }
    const fallbackBlob = new Blob(
      [`Tài liệu đính kèm: ${fileName}\nThời gian: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`],
      { type: 'application/octet-stream' },
    );
    triggerBlobDownload(fallbackBlob, fileName || 'tai-lieu');
    toast.success(`Đã tải xuống tệp: ${fileName}`);
  }, [attachments]);

  const openDetail = useCallback(async (record: PierAsset) => {
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
  }, []);

  const saveAsset = async (targetAction: string) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(targetAction);

      const attachmentName = attachments.length > 0
        ? attachments.map((a) => a.fileName).join(', ')
        : undefined;

      const payload: PierAssetPayload = {
        ...values,
        assetType: values.assetType || 'PIER',
        constructionYear: values.constructionYear ? Number(values.constructionYear.format('YYYY')) : undefined,
        useDate: values.useDate?.format('YYYY-MM-DD'),
        declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
        depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
        depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
        attachmentName,
        approvalStatus: targetAction,
      };

      let savedAsset: PierAsset;
      if (drawerMode === 'edit' && selected) {
        savedAsset = await updatePierAsset(selected.id, payload);
      } else {
        savedAsset = await createPierAsset(payload);
      }

      const targetAssetId = savedAsset?.id || selected?.id;
      const filesToUpload = attachments
        .map((a) => a.originFileObj)
        .filter((f): f is File => f instanceof File);
      if (filesToUpload.length > 0 && targetAssetId) {
        try {
          await uploadInfraAssetAttachments(targetAssetId, filesToUpload);
        } catch (uploadErr) {
          console.error('Upload attachments error:', uploadErr);
        }
      }

      toast.success(
        targetAction === 'DRAFT'
          ? 'Đã lưu tạm tài sản cầu cảng.'
          : targetAction === 'PENDING_APPROVAL'
            ? 'Đã lưu và gửi phê duyệt tài sản cầu cảng.'
            : 'Đã lưu và phê duyệt tài sản cầu cảng.',
      );
      setDrawerMode(undefined);
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) toast.error(getErrorMessage(cause, 'Không thể lưu tài sản cầu cảng.'));
    } finally {
      setSaving(false);
    }
  };

  const openOperation = useCallback((mode: OperationMode, record: PierAsset) => {
    setSelected(record);
    setOperationMode(mode);
    operationForm.resetFields();
    if (mode === 'exploit') {
      operationForm.setFieldsValue({
        operatorOrgUnitId: record.orgUnitId,
        unitOfMeasure: record.quantityUnit,
        quantity: record.quantity,
      });
    } else {
      operationForm.setFieldsValue({
        originalValue: record.originalValue,
        declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
        depreciationRate: record.depreciationRate,
        assignmentDecisionNumber: record.assignmentDecisionNumber,
        depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
        depreciationMonths: record.depreciationMonths,
        depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
        accumulatedDepreciation: record.accumulatedDepreciation,
        disposalMethod: record.disposalMethod,
      });
    }
  }, [operationForm]);

  const saveOperation = async () => {
    if (!selected || !operationMode) return;
    try {
      const values = await operationForm.validateFields();
      const origVal = values.originalValue;
      if (operationMode !== 'exploit' && origVal == null) {
        toast.error('Vui lòng nhập nguyên giá sau điều chỉnh.');
        return;
      }
      if (operationMode === 'increase' && origVal! <= (selected.originalValue || 0)) {
        toast.error('Nguyên giá sau điều chỉnh phải lớn hơn nguyên giá hiện tại.');
        return;
      }
      if (operationMode === 'decrease' && origVal! >= (selected.originalValue || 0)) {
        toast.error('Nguyên giá sau điều chỉnh phải nhỏ hơn nguyên giá hiện tại.');
        return;
      }
      setSaving(true);
      const accDep = Number(values.accumulatedDepreciation) || 0;
      const remAfter = origVal != null ? Math.max(0, origVal - accDep) : undefined;
      const depMonths = Number(values.depreciationMonths) || 0;
      const monthDep =
        origVal != null && depMonths > 0 ? Math.round((origVal / depMonths) * 100) / 100 : undefined;

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
        originalValueAfter: origVal,
        remainingValueBefore: selected.remainingValue,
        remainingValueAfter: remAfter,
        monthlyDepreciation: monthDep,
      };

      if (operationMode === 'exploit') {
        await createKhaiThac({
          assetId: selected.id,
          assetName: selected.assetName,
          exploitationYear: values.exploitationDeadline ? dayjs(values.exploitationDeadline).year() : dayjs().year(),
          doanhThu: values.totalRevenue || 0,
          depreciation: values.relatedCosts || 0,
          description: values.notes || '',
          operatorOrgUnitId: values.operatorOrgUnitId,
          assetCategory: [selected.assetCode, selected.assetName].filter(Boolean).join(' - '),  
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
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) toast.error(getErrorMessage(cause, 'Không thể lưu thông tin.'));
    } finally {
      setSaving(false);
    }
  };

  const filterOptions = useMemo<FilterOption[]>(() => [
    {
      key: 'orgUnitId',
      label: 'Đơn vị quản lý',
      type: 'treeSelect',
      organizations,
      placeholder: 'Chọn đơn vị...',
    },
    {
      key: 'assetName',
      label: 'Tên tài sản',
      type: 'text',
      placeholder: 'Tìm theo tên tài sản',
    },
    {
      key: 'assetCondition',
      label: 'Tình trạng tài sản',
      type: 'select',
      placeholder: 'Chọn tình trạng',
      options: ASSET_CONDITION_OPTIONS,
    },
    {
      key: 'usingOrgUnitId',
      label: 'Đơn vị sử dụng',
      type: 'treeSelect',
      organizations,
      placeholder: 'Chọn đơn vị...',
      isAdvanced: true,
    },
    {
      key: 'pierId',
      label: 'Mã cầu cảng',
      type: 'select',
      placeholder: 'Chọn cầu cảng',
      options: piers.map((item) => ({
        value: item.id,
        label: `${item.pierCode} - ${item.pierName}`,
      })),
      isAdvanced: true,
    },
    {
      key: 'assetType',
      label: 'Loại tài sản',
      type: 'select',
      placeholder: 'Chọn loại tài sản',
      options: MARITIME_ASSET_TYPE_OPTIONS,
      isAdvanced: true,
    },
    {
      key: 'assetCode',
      label: 'Mã tài sản',
      type: 'text',
      placeholder: 'Tìm theo mã tài sản',
      isAdvanced: true,
    },
    {
      key: 'updatedRange',
      label: 'Ngày cập nhật',
      type: 'dateRange',
      isAdvanced: true,
    },
  ], [piers, organizations]);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    const range = draftFilters.updatedRange;
    setFilters({
      ...draftFilters,
      updatedFrom: range?.[0]?.format('YYYY-MM-DD'),
      updatedTo: range?.[1]?.format('YYYY-MM-DD'),
    });
  }, [draftFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({});
    setFilters({});
    setPage(1);
  }, []);

  const tableOptions = useMemo<TableOption<PierAsset>>(() => ({
    dataKey: 'id',
    mainColumns: [
      {
        title: 'TÊN/MÃ TÀI SẢN',
        dataIndex: 'assetName',
        type: TableColumnType.TwoLine,
        subField: 'assetCode',
        width: 230,
        fixed: 'left',
        allowSort: true,
        onClick: (record) => void openDetail(record),
      },
      {
        title: 'ĐƠN VỊ QUẢN LÝ',
        dataIndex: 'orgUnitId',
        type: TableColumnType.Text,
        width: 250,
        bold: true,
        allowSort: true,
        valueRef: (r) => orgName.get(r.orgUnitId),
      },
      {
        title: 'ĐƠN VỊ SỬ DỤNG',
        dataIndex: 'usingOrgUnitId',
        type: TableColumnType.Text,
        width: 250,
        allowSort: true,
        valueRef: (r) => r.usingOrgUnitId ? orgName.get(r.usingOrgUnitId) : undefined,
      },
      {
        title: 'MÃ CẦU CẢNG',
        dataIndex: 'pierId',
        type: TableColumnType.Text,
        width: 190,
        allowSort: true,
        valueRef: (r) => r.pierId ? pierMap.get(r.pierId)?.pierCode : undefined,
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 160,
        allowSort: true,
        render: () => 'Tài sản cầu cảng',
      },
      {
        title: 'TÌNH TRẠNG TÀI SẢN',
        dataIndex: 'assetCondition',
        type: TableColumnType.Status,
        width: 190,
        allowSort: true,
      },
      {
        title: 'HIỆN TRẠNG SỬ DỤNG',
        dataIndex: 'usageStatus',
        type: TableColumnType.Status,
        width: 190,
        allowSort: true,
      },
      {
        title: 'NHÓM TÀI SẢN',
        dataIndex: 'assetGroup',
        type: TableColumnType.Text,
        width: 210,
        allowSort: true,
      },
      {
        title: 'NGÀY SỬ DỤNG TÀI SẢN',
        dataIndex: 'useDate',
        type: TableColumnType.Date,
        width: 190,
        allowSort: true,
      },
      {
        title: 'TRẠNG THÁI',
        dataIndex: 'approvalStatus',
        type: TableColumnType.Status,
        width: 260,
        allowSort: true,
      },
      {
        title: 'CÁN BỘ CẬP NHẬT',
        dataIndex: 'updatedByName',
        type: TableColumnType.TwoLine,
        subField: 'updatedAt',
        width: 210,
        allowSort: true,
        sortField: 'updatedBy',
      },
      {
        title: 'CÁN BỘ GỬI PHÊ DUYỆT',
        dataIndex: 'submittedByName',
        type: TableColumnType.TwoLine,
        subField: 'submittedAt',
        width: 240,
        allowSort: true,
        sortField: 'submittedBy',
      },
      {
        title: 'CÁN BỘ PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovedByName',
        type: TableColumnType.TwoLine,
        subField: 'portAuthorityApprovedAt',
        width: 340,
        allowSort: true,
        sortField: 'portAuthorityApprovedBy',
      },
      {
        title: 'NỘI DUNG PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovalContent',
        type: TableColumnType.Text,
        width: 280,
        allowSort: true,
      },
      {
        title: 'CÁN BỘ PHÊ DUYỆT CẤP CỤC',
        dataIndex: 'departmentApprovedByName',
        type: TableColumnType.TwoLine,
        subField: 'departmentApprovedAt',
        width: 260,
        allowSort: true,
        sortField: 'departmentApprovedBy',
      },
      {
        title: 'NỘI DUNG PHÊ DUYỆT CẤP CỤC',
        dataIndex: 'departmentApprovalContent',
        type: TableColumnType.Text,
        width: 260,
        allowSort: true,
      },
    ],
    actions: (record: PierAsset) => {
      const st = record.approvalStatus || (record as any).status || '';
      const actionsList: any[] = [];

      if (perms.canRead) {
        actionsList.push({
          key: 'detail',
          label: 'Xem chi tiết',
          icon: <EyeOutlined />,
          onClick: () => void openDetail(record),
        });
      }

      if (perms.canUpdate && isAssetRecordEditable(st)) {
        actionsList.push({
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: <EditOutlined />,
          onClick: () => openEdit(record),
        });
      }

      if (perms.canUpdate) {
        if (st === 'DRAFT') {
          actionsList.push({
            key: 'submit',
            label: 'Gửi Cảng vụ phê duyệt',
            icon: <SendOutlined />,
            onClick: () => void handleSubmitApproval(record),
          });
        } else if (st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2' || st === 'REJECTED') {
          actionsList.push({
            key: 'submit',
            label: 'Gửi lại phê duyệt',
            icon: <SendOutlined />,
            onClick: () => void handleSubmitApproval(record),
          });
        }
      }

      if (st === 'PENDING_APPROVAL' || st === 'PROPOSED') {
        if (perms.canApproveC1) {
          actionsList.push({
            key: 'approveC1',
            label: 'Phê duyệt cấp Cảng vụ/Chi cục',
            icon: <CheckOutlined />,
            onClick: () => handleOpenApproveModal(record, 'c1'),
          });
        }
        if (perms.canReject || perms.canApproveC1) {
          actionsList.push({
            key: 'rejectC1',
            label: 'Từ chối cấp Cảng vụ/Chi cục',
            icon: <CloseOutlined />,
            danger: true,
            onClick: () => handleOpenRejectModal(record, 'c1'),
          });
        }
      }

      if (st === 'APPROVED_LEVEL1') {
        if (perms.canApproveC2) {
          actionsList.push({
            key: 'approveC2',
            label: 'Phê duyệt cấp Cục',
            icon: <CheckOutlined />,
            onClick: () => handleOpenApproveModal(record, 'c2'),
          });
        }
        if (perms.canReject || perms.canApproveC2) {
          actionsList.push({
            key: 'rejectC2',
            label: 'Từ chối cấp Cục',
            icon: <CloseOutlined />,
            danger: true,
            onClick: () => handleOpenRejectModal(record, 'c2'),
          });
        }
      }

      if (st === 'APPROVED' || st === 'APPROVED_LEVEL2') {
        if (perms.canExploit) {
          actionsList.push({
            key: 'exploit',
            label: 'Khai thác tài sản',
            icon: <RocketOutlined />,
            onClick: () => openOperation('exploit', record),
          });
        }
        if (perms.canIncrease) {
          actionsList.push({
            key: 'increase',
            label: 'Tăng nguyên giá',
            icon: <PlusCircleOutlined />,
            onClick: () => openOperation('increase', record),
          });
        }
        if (perms.canDecrease) {
          actionsList.push({
            key: 'decrease',
            label: 'Giảm nguyên giá',
            icon: <MinusCircleOutlined />,
            onClick: () => openOperation('decrease', record),
          });
        }
      }

      if (perms.canHistory) {
        actionsList.push({
          key: 'history',
          label: 'Lịch sử',
          icon: <HistoryOutlined />,
          onClick: () => void openHistory(record),
        });
      }

      if (st === 'DRAFT' && perms.canDelete) {
        actionsList.push({
          key: 'delete',
          label: 'Xóa',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => setDeleteTarget(record),
        });
      }

      return actionsList;
    },
  }), [
    pierMap,
    openDetail,
    openEdit,
    openHistory,
    openOperation,
    operationForm,
    handleOpenApproveModal,
    handleOpenRejectModal,
    handleSubmitApproval,
    orgName,
    perms,
  ]);

  const headerActions: ScreenHeaderAction[] = useMemo(() => {
    if (!perms.canCreate) return [];
    return [
      { key: 'create', label: 'Thêm mới', icon: <PlusOutlined />, variant: 'primary', onClick: openCreate },
    ];
  }, [openCreate, perms.canCreate, perms.userPermissions]);

  const customTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  return (
    <ThemeTokenProvider tokens={customTokens}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản cầu cảng' },
          ]}
          actions={headerActions}
        />

        <FilterTableLayout
          statusTabsNode={
            <CommonStatusTabs
              activeKey={filters.approvalStatus || 'all'}
              counts={statusCounts}
              onChange={(_key, status) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, approvalStatus: status }));
              }}
            />
          }
          error={Boolean(error)}
          errorMessage={error}
          onRetry={loadData}
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          filterContent={
            <TableFilter
              mode="fieldsOnly"
              filters={filterOptions}
              values={draftFilters}
              onChange={(nextFilters) => setDraftFilters(nextFilters as typeof draftFilters)}
            />
          }
        >
          <CommonTable<PierAsset>
            options={tableOptions}
            dataSource={data}
            total={total}
            page={page}
            pageSize={pageSize}
            loading={loading}
            filters={filters}
            onPageChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            }}
            onSortChange={(field, order) => {
              setPage(1);
              setFilters(current => ({
                ...current,
                sortBy: order ? field : undefined,
                sortDir: order === 'ascend' ? 'ASC' : order === 'descend' ? 'DESC' : undefined,
              }));
            }}
          />
        </FilterTableLayout>

        <PierAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          piers={piers}
          attachments={attachments}
          saving={saving}
          saveAction={saveAction}
          onClose={() => setDrawerMode(undefined)}
          onSave={saveAsset}
          onUploadAttachment={handleUploadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onDownloadAttachment={handleDownloadAttachment}
        />

        <PierAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          pierMap={pierMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        <PierAssetOperationForm
          open={Boolean(operationMode)}
          operationMode={operationMode}
          selected={selected}
          organizations={organizations}
          form={operationForm}
          saving={saving}
          onClose={() => {
            setOperationMode(undefined);
            operationForm.resetFields();
          }}
          onSubmit={saveOperation}
        />

        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          title="Xác nhận xóa tài sản cầu cảng"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          description="Thao tác này không thể hoàn tác."
          loading={saving}
          onCancel={() => setDeleteTarget(undefined)}
          onConfirm={async () => {
            if (!deleteTarget) return;
            try {
              setSaving(true);
              await deletePierAsset(deleteTarget.id);
              toast.success('Xóa tài sản cầu cảng thành công.');
              setDeleteTarget(undefined);
              await loadData();
            } catch (cause: unknown) {
              toast.error(getErrorMessage(cause, 'Không thể xóa tài sản cầu cảng.'));
            } finally {
              setSaving(false);
            }
          }}
        />

        {/* ── Approval Modals 2 cấp ──────────────────────────────── */}
        <KchtApprovalModals
          approveOpen={approveModalOpen}
          approveLevel={approveLevel}
          approveLoading={approveLoading}
          onApproveConfirm={handleApproveConfirm}
          onApproveCancel={() => {
            setApproveModalOpen(false);
            setApprovingRecord(null);
          }}
          rejectOpen={rejectModalOpen}
          rejectLevel={rejectLevel}
          rejectLoading={rejectLoading}
          onRejectConfirm={handleRejectConfirm}
          onRejectCancel={() => {
            setRejectModalOpen(false);
            setRejectingRecord(null);
          }}
        />

        {/* ── History Drawer (chuẩn /berth) ────────────────────────── */}
        <AppDrawer
          width="min(880px, 96vw)"
          rootClassName="berth-drawer-scope"
          className="berth-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  {historyTarget ? `Lịch sử thay đổi — ${historyTarget.assetName}` : 'Lịch sử thay đổi'}
                </span>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                  Tổng cộng {historyUpdateCount}
                </span>
              </Space>
            </div>
          }
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
          }}>
          <div style={{ flexShrink: 0 }}>
            {!historyLoading && (
              <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
                <Input
                  placeholder="Tìm kiếm nội dung thay đổi..."
                  allowClear
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
                />
                <DatePicker
                  placeholder="Từ ngày"
                  value={historyFrom ? dayjs(historyFrom) : null}
                  onChange={d => setHistoryFrom(d ? d.format('YYYY-MM-DD') : '')}
                  style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                  format="DD/MM/YYYY"
                />
                <DatePicker
                  placeholder="Đến ngày"
                  value={historyTo ? dayjs(historyTo) : null}
                  onChange={d => setHistoryTo(d ? d.format('YYYY-MM-DD') : '')}
                  style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                  format="DD/MM/YYYY"
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  style={{
                    borderRadius: radiusPill,
                    height: 40,
                    fontSize: 13.5,
                    background: actionPrimary,
                    borderColor: actionPrimary,
                  }}
                >
                  Tìm kiếm
                </Button>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {historyLoading ? (
              <LoadingSkeleton rows={5} />
            ) : filteredHistoryRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                <div style={{ color: textTertiary, fontSize: 13.5 }}>Chưa có thay đổi nào được ghi nhận</div>
              </div>
            ) : (
              renderStandardHistoryCards({
                records: filteredHistoryRecords,
                fieldLabels: PIER_ASSET_FIELD_LABELS,
                resolveUnitName: () => {
                  const targetOrgId = historyTarget?.orgUnitId || historyTarget?.parentOrgUnitId;
                  return targetOrgId ? (orgName.get(targetOrgId) || '') : '';
                },
                formatValue: (fn, raw) => {
                  if (isBlankOrDash(raw)) return '';
                  const normKey = (fn || '').toLowerCase();
                  if (normKey.includes('orgunitid') || normKey.includes('donvi')) {
                    return orgName.get(raw!) || raw;
                  }
                  if (fn === 'pierId') {
                    const item = pierMap.get(raw!);
                    return item ? `${item.pierCode} - ${item.pierName}` : raw;
                  }
                  if (
                    fn === 'originalValue' ||
                    fn === 'remainingValue' ||
                    fn === 'accumulatedDepreciation' ||
                    fn === 'monthlyDepreciation' ||
                    fn === 'value'
                  ) {
                    return formatHistoryNumber(raw);
                  }
                  return undefined;
                },
              })
            )}
          </div>
        </AppDrawer>
      </div>
    </ThemeTokenProvider>
  );
}
