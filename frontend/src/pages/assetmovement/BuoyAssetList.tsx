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
import { KchtApprovalModals } from '../../components/kcht/KchtApprovalModals';
import {
  CommonStatusTabs,
  CommonTable,
  FilterTableLayout,
  ScreenHeader,
  TableColumnType,
  TableFilter,
  type FilterOption,
  type ScreenHeaderAction,
  type TableOption
} from '../../components/list-view';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { AppDrawer } from '../../components/shared/AppDrawer';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import {
  triggerBlobDownload,
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import toast from '../../components/ToastNotification';
import { ASSET_CONDITION_OPTIONS } from '../../constants/assetDropdown';
import { MARITIME_ASSET_TYPE_OPTIONS } from '../../constants/assetType';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import { useAssetPermissions } from '../../hooks/useAssetPermissions';
import api from '../../services/api';
import {
  approveInfraAssetC1,
  approveInfraAssetC2,
  createAssetDecrease,
  createAssetIncrease,
  createBuoyAsset,
  createKhaiThac,
  deleteBuoyAsset,
  deleteInfraAssetAttachment,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchBuoyAssets,
  fetchInfraAssetAttachments,
  fetchInfraAssetHistory,
  fetchKhaiThacList,
  rejectInfraAssetC1,
  rejectInfraAssetC2,
  submitInfraAssetApproval,
  updateBuoyAsset,
  uploadInfraAssetAttachments,
} from '../../services/assetmovement/api';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse, AssetValueAdjustmentDetails, BuoyAsset,
  BuoyAssetFilters,
  BuoyAssetPayload
} from '../../services/assetmovement/types';
import { fetchBuoyStationList } from '../../services/buoy-station/api';
import type { BuoyStationResponse } from '../../services/buoy-station/types';
import { fetchAllBuoys } from '../../services/buoy/api';
import { organizationService, type Organization } from '../../services/organizationService';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import {
  actionPrimary,
  borderDefault,
  colors,
  drawerTitleStyle,
  fontSizeLg,
  fontSizeMd,
  fontWeightBold,
  radiusPill,
  spaceMd,
  spaceSm,
  spaceXl,
  textTertiary,
} from '../../themetokenchk';
import type { Buoy } from '../../types/buoy';
import { isAssetRecordEditable, normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import { calculateAssetAdjustmentValues } from '../../utils/assetValueCalculation';
import { countHistoryUpdates, DEFAULT_IGNORED_FIELDS, isBlankOrDash, renderStandardHistoryCards, type RawHistoryRecord } from '../../utils/changeHistoryRenderer';
import { formatHistoryNumber } from '../../utils/numFmt';
import BuoyAssetDetailContent from './BuoyAssetDetailContent';
import BuoyAssetForm, { type BuoyFormValues } from './BuoyAssetForm';
import BuoyAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './BuoyAssetOperationForm';

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

const BUOY_ASSET_FIELD_LABELS: Record<string, string> = {
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  orgUnitId: 'Đơn vị quản lý',
  usingOrgUnitId: 'Đơn vị sử dụng',
  buoyId: 'Mã phao tiêu',
  buoyStationId: 'Mã trạm phao',
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
  quantity: 'Số lượng',
  quantityUnit: 'Đơn vị tính',
  model: 'Model',
  serialNumber: 'Số serial',
  countryOfOrigin: 'Xuất xứ',
  manufacturer: 'Hãng sản xuất',
  address: 'Địa chỉ',
  assetLocation: 'Vị trí tài sản',
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

export default function BuoyAssetList() {
  const perms = useAssetPermissions(['buoy', 'buoystation', 'buoyasset']);
  const [data, setData] = useState<BuoyAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [buoys, setBuoys] = useState<Buoy[]>([]);
  const [buoyStations, setBuoyStations] = useState<BuoyStationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<BuoyAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<BuoyAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<BuoyAsset>();
  const [deleteTarget, setDeleteTarget] = useState<BuoyAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<BuoyFormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const orgName = useMemo(() => new Map(organizations.map((item) => [item.id, item.name])), [organizations]);
  const buoyMap = useMemo(() => new Map(buoys.map((item) => [item.id, item])), [buoys]);
  const stationMap = useMemo(() => new Map(buoyStations.map((item) => [item.id, item])), [buoyStations]);

  // ── History state (chuẩn /berth) ───────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<BuoyAsset | null>(null);
  const [historyRecords, setHistoryRecords] = useState<RawHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  const openHistory = useCallback(async (r: BuoyAsset) => {
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
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const filteredHistoryRecords = useMemo(() => {
    return historyRecords.filter((rec) => {
      const fn = rec.fieldName || rec.changedField;
      if (fn && DEFAULT_IGNORED_FIELDS.has(fn)) return false;
      if (historySearch) {
        const s = historySearch.toLowerCase();
        const matchField = String(fn || '').toLowerCase().includes(s);
        const matchOld = String(rec.oldValue || rec.previousValue || '').toLowerCase().includes(s);
        const matchNew = String(rec.newValue || rec.value || '').toLowerCase().includes(s);
        if (!matchField && !matchOld && !matchNew) return false;
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

  const historyFieldCount = useMemo(
    () => countHistoryUpdates(filteredHistoryRecords, {
      fieldLabels: BUOY_ASSET_FIELD_LABELS,
      formatValue: (fn, raw) => {
        if (isBlankOrDash(raw)) return '';
        const normKey = (fn || '').toLowerCase();
        if (normKey.includes('orgunitid') || normKey.includes('donvi')) {
          return orgName.get(raw!) || raw;
        }
        if (fn === 'buoyId') {
          const item = buoys.find((x) => x.id === raw);
          return item ? `${item.code} - ${item.name}` : raw;
        }
        if (fn === 'buoyStationId') {
          const item = buoyStations.find((x) => x.id === raw);
          return item ? `${item.code} - ${item.name}` : raw;
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
    }),
    [filteredHistoryRecords, orgName, buoys, buoyStations]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchBuoyAssets({ ...filters, page: page - 1, size: pageSize });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, sortBy: undefined, sortDir: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchBuoyAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) => fetchBuoyAssets({ ...baseFilters, approvalStatus })),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản phao, tiêu và nhà trạm.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void Promise.allSettled([
      organizationService.getAll(),
      fetchAllBuoys(),
      fetchBuoyStationList({}),
    ]).then(([orgsRes, buoyRes, stationRes]) => {
      if (orgsRes.status === 'fulfilled') {
        setOrganizations(orgsRes.value);
      }
      if (buoyRes.status === 'fulfilled') {
        setBuoys(buoyRes.value || []);
      }
      if (stationRes.status === 'fulfilled') {
        setBuoyStations(stationRes.value.content || []);
      }
      if (orgsRes.status === 'rejected' || buoyRes.status === 'rejected' || stationRes.status === 'rejected') {
        toast.error('Không thể tải danh mục đơn vị, phao tiêu hoặc nhà trạm.');
      }
    });
  }, []);

  // ── Approval state & handlers ──────────────────────────────────────
  const [approvingRecord, setApprovingRecord] = useState<BuoyAsset | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  const [rejectingRecord, setRejectingRecord] = useState<BuoyAsset | null>(null);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const handleOpenApproveModal = useCallback((record: BuoyAsset, level: 'c1' | 'c2') => {
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

  const handleOpenRejectModal = useCallback((record: BuoyAsset, level: 'c1' | 'c2') => {
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

  const handleSubmitApproval = useCallback(async (record: BuoyAsset) => {
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
  }, [form]);

  const openEdit = useCallback((record: BuoyAsset) => {
    if (!isAssetRecordEditable(record.approvalStatus)) {
      toast.warning('Hồ sơ đang ở trạng thái không được phép chỉnh sửa.');
      return;
    }
    setSelected(record);
    setDrawerMode('edit');
    const refId = record.buoyId
      ? `buoy:${record.buoyId}`
      : record.buoyStationId
        ? `station:${record.buoyStationId}`
        : undefined;

    form.setFieldsValue({
      ...record,
      refId,
      constructionYear: record.constructionYear ? dayjs(String(record.constructionYear)) : undefined,
      useDate: record.useDate ? dayjs(record.useDate) : undefined,
      declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
      depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
      depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
      attachmentName: record.attachmentName,
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
              uploadedByName:
                att.uploadedByName ||
                record.updatedByName ||
                record.submittedByName ||
                currentUser?.fullName ||
                currentUser?.username ||
                'Cán bộ quản lý',
              uploadedDate: att.uploadedAt || (record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString()),
              filePath: `/v1/asset/infra-assets/${record.id}/attachments/${att.id}/download`,
            })),
          );
        } else if (record.attachmentName) {
          setAttachments(
            record.attachmentName.split(',').map((name, i) => ({
              id: `att-${i}-${Date.now()}`,
              fileName: name.trim(),
              fileSize: 1024 * 512,
              uploadedByName:
                record.updatedByName ||
                record.submittedByName ||
                currentUser?.fullName ||
                currentUser?.username ||
                'Cán bộ quản lý',
              uploadedDate: record.updatedAt
                ? dayjs(record.updatedAt).toISOString()
                : dayjs().toISOString(),
            })),
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
              uploadedByName:
                record.updatedByName ||
                record.submittedByName ||
                currentUser?.fullName ||
                currentUser?.username ||
                'Cán bộ quản lý',
              uploadedDate: record.updatedAt
                ? dayjs(record.updatedAt).toISOString()
                : dayjs().toISOString(),
            })),
          );
        } else {
          setAttachments([]);
        }
      });
  }, [currentUser, form]);

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

  const handleDownloadAttachment = useCallback(
    async (id: string, fileName: string) => {
      const att = attachments.find((a) => a.id === id);
      if (att?.originFileObj) {
        triggerBlobDownload(
          att.originFileObj,
          fileName || att.originFileObj.name,
        );
        toast.success(`Đã tải xuống tệp: ${fileName}`);
        return;
      }
      if (
        att?.url &&
        (att.url.startsWith('blob:') || att.url.startsWith('data:'))
      ) {
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
          console.error('Download error:', err);
          toast.error(`Không thể tải xuống tệp tin "${fileName}": Lỗi máy chủ hoặc tệp không tồn tại.`);
          return;
        }
      }
      toast.error(
        `Không tìm thấy đường dẫn tệp tin đính kèm "${fileName || 'tài liệu'}" trên máy chủ để tải xuống.`,
      );
    },
    [attachments],
  );

  const openDetail = useCallback(async (record: BuoyAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exploitRes, incRes, decRes] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id }),
        fetchAssetIncreaseList({ assetId: record.id }),
        fetchAssetDecreaseList({ assetId: record.id }),
      ]);
      setExploitationRows(exploitRes.content || []);
      setIncreaseRows(incRes.content || []);
      setDecreaseRows(decRes.content || []);
    } catch {
      setExploitationRows([]);
      setIncreaseRows([]);
      setDecreaseRows([]);
    }
  }, []);

  const openOperation = useCallback((record: BuoyAsset, mode: OperationMode) => {
    setSelected(record);
    setOperationMode(mode);
    operationForm.resetFields();
    if (mode === 'exploit') {
      operationForm.setFieldsValue({
        operatorOrgUnitId: record.orgUnitId,
      });
    } else {
      operationForm.setFieldsValue({
        adjustmentDate: dayjs(),
        originalValue: 0,
        depreciationRate: record.depreciationRate || 0,
        assignmentDecisionNumber: record.assignmentDecisionNumber,
        depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
        depreciationMonths: record.depreciationMonths,
        depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
        accumulatedDepreciation: record.accumulatedDepreciation || 0,
        disposalMethod: record.disposalMethod,
      });
    }
  }, [operationForm]);

  const closeDrawer = useCallback(() => {
    setDrawerMode(undefined);
    form.resetFields();
  }, [form]);

  const saveAsset = useCallback(async (status: string) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(status);

      let buoyId: string | undefined;
      let buoyStationId: string | undefined;
      if (values.refId) {
        if (values.refId.startsWith('station:')) {
          buoyStationId = values.refId.replace('station:', '');
        } else if (values.refId.startsWith('buoy:')) {
          buoyId = values.refId.replace('buoy:', '');
        } else {
          if (buoyMap.has(values.refId)) buoyId = values.refId;
          else if (stationMap.has(values.refId)) buoyStationId = values.refId;
        }
      }

      const payload: BuoyAssetPayload = {
        ...values,
        buoyId,
        buoyStationId,
        assetCode: selected?.assetCode || values.assetCode || '',
        assetName: values.assetName || '',
        assetType: values.assetType || 'BUOY',
        constructionYear: values.constructionYear ? Number(values.constructionYear.format('YYYY')) : undefined,
        useDate: values.useDate ? values.useDate.format('YYYY-MM-DD') : undefined,
        declarationDate: values.declarationDate ? values.declarationDate.format('YYYY-MM-DD') : undefined,
        depreciationStartDate: values.depreciationStartDate ? values.depreciationStartDate.format('YYYY-MM-DD') : undefined,
        depreciationEndDate: values.depreciationEndDate ? values.depreciationEndDate.format('YYYY-MM-DD') : undefined,
        attachmentName: attachments.map((a) => a.fileName).join(','),
        approvalStatus: status,
      };

      let savedAsset: BuoyAsset;
      if (drawerMode === 'edit' && selected) {
        savedAsset = await updateBuoyAsset(selected.id, payload);
        toast.success(
          status === 'APPROVED'
            ? 'Phê duyệt tài sản phao, tiêu thành công.'
            : 'Cập nhật tài sản phao, tiêu thành công.',
        );
      } else {
        savedAsset = await createBuoyAsset(payload);
        toast.success(
          status === 'APPROVED'
            ? 'Tạo mới và phê duyệt tài sản phao, tiêu thành công.'
            : status === 'PENDING_APPROVAL'
              ? 'Tạo mới và gửi phê duyệt tài sản phao, tiêu thành công.'
              : 'Lưu tạm tài sản phao, tiêu thành công.',
        );
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
      closeDrawer();
      void loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu thông tin tài sản phao, tiêu.'));
      }
    } finally {
      setSaving(false);
    }
  }, [attachments, closeDrawer, drawerMode, form, loadData, selected, buoyMap, stationMap]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteBuoyAsset(deleteTarget.id);
      toast.success('Xóa tài sản phao, tiêu thành công.');
      setDeleteTarget(undefined);
      void loadData();
    } catch (cause: unknown) {
      toast.error(getErrorMessage(cause, 'Không thể xóa tài sản phao, tiêu.'));
    }
  }, [deleteTarget, loadData]);

  const submitOperation = useCallback(async (targetAction?: any) => {
    if (!selected || !operationMode) return;
    try {
      if (typeof targetAction === 'string') {
        setSaveAction(targetAction);
      }
      const values = await operationForm.validateFields();
      setSaving(true);
      if (operationMode === 'exploit') {
        await createKhaiThac({
          assetId: selected.id,
          assetName: selected.assetName,
          exploitationYear: dayjs().year(),
          doanhThu: values.totalRevenue || 0,
          depreciation: 0,
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
        toast.success('Thêm mới bản ghi khai thác tài sản thành công.');
      } else if (operationMode === 'increase') {
        const origVal = values.originalValue;
        const calc = calculateAssetAdjustmentValues({
          originalValueAfter: origVal,
          depreciationRate: values.depreciationRate,
          depreciationStartDate: values.depreciationStartDate,
          depreciationEndDate: values.depreciationEndDate,
          accumulatedDepreciationManual: values.accumulatedDepreciation,
          depreciationMonths: values.depreciationMonths,
        });
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
          remainingValueAfter: calc.remainingValueAfter,
          accumulatedDepreciation: calc.accumulatedDepreciation ?? values.accumulatedDepreciation,
          monthlyDepreciation: calc.monthlyDepreciation,
        };
        await createAssetIncrease({
          assetId: selected.id,
          assetName: selected.assetName,
          quantity: 1,
          unitOfMeasure: 'VNĐ',
          increaseCode: values.decisionNumber || '',
          reason: values.notes || '',
          adjustmentDetails,
        });
        toast.success('Yêu cầu tăng nguyên giá tài sản đã được tạo.');
      } else {
        const origVal = values.originalValue;
        const calc = calculateAssetAdjustmentValues({
          originalValueAfter: origVal,
          depreciationRate: values.depreciationRate,
          depreciationStartDate: values.depreciationStartDate,
          depreciationEndDate: values.depreciationEndDate,
          accumulatedDepreciationManual: values.accumulatedDepreciation,
          depreciationMonths: values.depreciationMonths,
        });
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
          remainingValueAfter: calc.remainingValueAfter,
          accumulatedDepreciation: calc.accumulatedDepreciation ?? values.accumulatedDepreciation,
          monthlyDepreciation: calc.monthlyDepreciation,
        };
        await createAssetDecrease({
          assetId: selected.id,
          assetName: selected.assetName,
          quantity: 1,
          unitOfMeasure: 'VNĐ',
          decreaseReason: values.adjustmentReason || '',
          reason: values.notes || '',
          adjustmentDetails,
        });
        toast.success('Yêu cầu giảm nguyên giá tài sản đã được tạo.');
      }
      setOperationMode(undefined);
      void loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu bản ghi biến động tài sản.'));
      }
    } finally {
      setSaving(false);
    }
  }, [loadData, operationForm, operationMode, selected]);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    const range = draftFilters.updatedRange;
    let buoyId: string | undefined;
    let buoyStationId: string | undefined;
    if (draftFilters.refId) {
      if (draftFilters.refId.startsWith('station:')) {
        buoyStationId = draftFilters.refId.replace('station:', '');
      } else if (draftFilters.refId.startsWith('buoy:')) {
        buoyId = draftFilters.refId.replace('buoy:', '');
      } else {
        buoyId = draftFilters.refId;
      }
    }

    setFilters((current) => ({
      ...draftFilters,
      sortBy: current.sortBy,
      sortDir: current.sortDir,
      buoyId,
      buoyStationId,
      updatedFrom: range?.[0]?.format('YYYY-MM-DD'),
      updatedTo: range?.[1]?.format('YYYY-MM-DD'),
    }));
  }, [draftFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({});
    setFilters({});
    setPage(1);
  }, []);

  const filterOptions = useMemo<FilterOption[]>(() => {
    const stationOpts = (buoyStations || []).map((s) => ({
      value: `station:${s.id}`,
      label: `[Nhà trạm] ${s.code} - ${s.name}`,
    }));
    const buoyOpts = (buoys || []).map((b) => ({
      value: `buoy:${b.id}`,
      label: `[Phao tiêu] ${b.code} - ${b.name}`,
    }));

    return [
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        type: 'treeSelect',
        organizations,
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
        isAdvanced: true,
      },
      {
        key: 'refId',
        label: 'Mã nhà trạm, phao tiêu',
        type: 'select',
        placeholder: 'Chọn nhà trạm / phao tiêu',
        options: [
          ...stationOpts,
          ...buoyOpts,
        ],
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
    ];
  }, [organizations, buoyStations, buoys]);

  const tableOptions = useMemo<TableOption<BuoyAsset>>(() => ({
    dataKey: 'id',
    mainColumns: [
      {
        title: 'TÊN/MÃ TÀI SẢN',
        dataIndex: 'assetName',
        type: TableColumnType.TwoLine,
        subField: 'assetCode',
        width: 250,
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
        render: (v) => <span style={{ fontWeight: fontWeightBold }}>{orgName.get(v as string) || '—'}</span>,
      },
      {
        title: 'ĐƠN VỊ SỬ DỤNG',
        dataIndex: 'usingOrgUnitId',
        type: TableColumnType.Text,
        width: 250,
        allowSort: true,
        render: (v) => orgName.get(v as string) || '—',
      },
      {
        title: 'MÃ NHÀ TRẠM, PHAO TIÊU',
        dataIndex: 'refCode',
        type: TableColumnType.Text,
        width: 210,
        allowSort: true,
        sortField: 'buoyId',
        render: (_v, r) => {
          if (r.buoyId && buoyMap.has(r.buoyId)) {
            return `[PT] ${buoyMap.get(r.buoyId)?.code || ''}`;
          }
          if (r.buoyStationId && stationMap.has(r.buoyStationId)) {
            return `[NT] ${stationMap.get(r.buoyStationId)?.code || ''}`;
          }
          return '—';
        },
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 200,
        allowSort: true,
        render: () => 'Tài sản phao, tiêu và nhà trạm QLVH',
      },
      {
        title: 'TÌNH TRẠNG TÀI SẢN',
        dataIndex: 'assetCondition',
        type: TableColumnType.Status,
        width: 190,
        allowSort: true,
        statusMapping: {
          'Đang sử dụng': { label: 'Đang sử dụng', color: themeTokenChk.statusOperational },
          'Hỏng không sử dụng': { label: 'Hỏng không sử dụng', color: themeTokenChk.statusCritical },
        },
      },
      {
        title: 'HIỆN TRẠNG SỬ DỤNG',
        dataIndex: 'usageStatus',
        type: TableColumnType.Status,
        width: 190,
        allowSort: true,
        statusMapping: {
          'Quản lý nhà nước': { label: 'Quản lý nhà nước', color: themeTokenChk.statusOperational },
          'Hoạt động sự nghiệp: Không kinh doanh': { label: 'Hoạt động sự nghiệp: Không kinh doanh', color: themeTokenChk.statusOperational },
          'Hoạt động sự nghiệp: Kinh doanh': { label: 'Hoạt động sự nghiệp: Kinh doanh', color: themeTokenChk.statusAttention },
          'Hoạt động sự nghiệp: Cho thuê': { label: 'Hoạt động sự nghiệp: Cho thuê', color: themeTokenChk.statusAttention },
          'Hoạt động sự nghiệp: Liên doanh, liên kết': { label: 'Hoạt động sự nghiệp: Liên doanh, liên kết', color: themeTokenChk.statusAttention },
          'Hoạt động sự nghiệp: Sử dụng hỗn hợp': { label: 'Hoạt động sự nghiệp: Sử dụng hỗn hợp', color: themeTokenChk.statusAttention },
          'Sử dụng khác': { label: 'Sử dụng khác', color: themeTokenChk.statusAttention },
        },
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
        width: 180,
        allowSort: true,
      },
      {
        title: 'CÁN BỘ CẬP NHẬT',
        dataIndex: 'updatedByName',
        type: TableColumnType.Text,
        width: 180,
        allowSort: true,
        sortField: 'updatedBy',
      },
      {
        title: 'NGÀY CẬP NHẬT',
        dataIndex: 'updatedAt',
        type: TableColumnType.DateTime,
        width: 180,
        allowSort: true,
      },
      {
        title: 'NGÀY GỬI PHÊ DUYỆT',
        dataIndex: 'submittedAt',
        type: TableColumnType.DateTime,
        width: 190,
        allowSort: true,
      },
      {
        title: 'CÁN BỘ GỬI PHÊ DUYỆT',
        dataIndex: 'submittedByName',
        type: TableColumnType.Text,
        width: 190,
        allowSort: true,
        sortField: 'submittedBy',
      },
      {
        title: 'NGÀY DUYỆT CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovedAt',
        type: TableColumnType.DateTime,
        width: 220,
        allowSort: true,
      },
      {
        title: 'CÁN BỘ DUYỆT CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovedByName',
        type: TableColumnType.Text,
        width: 230,
        allowSort: true,
        sortField: 'portAuthorityApprovedBy',
      },
      {
        title: 'NỘI DUNG DUYỆT CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovalContent',
        type: TableColumnType.Text,
        width: 240,
        allowSort: true,
      },
      {
        title: 'NGÀY DUYỆT CỤC',
        dataIndex: 'departmentApprovedAt',
        type: TableColumnType.DateTime,
        width: 180,
        allowSort: true,
      },
      {
        title: 'CÁN BỘ DUYỆT CỤC',
        dataIndex: 'departmentApprovedByName',
        type: TableColumnType.Text,
        width: 180,
        allowSort: true,
        sortField: 'departmentApprovedBy',
      },
      {
        title: 'NỘI DUNG DUYỆT CỤC',
        dataIndex: 'departmentApprovalContent',
        type: TableColumnType.Text,
        width: 240,
        allowSort: true,
      },
    ],
    actions: (record: BuoyAsset) => {
      const st = record.approvalStatus || (record as any).status || '';
      const actionsList: any[] = [];

      if (perms.canRead) {
        actionsList.push({
          key: 'view',
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
            onClick: () => openOperation(record, 'exploit'),
          });
        }
        if (perms.canIncrease) {
          actionsList.push({
            key: 'increase',
            label: 'Tăng nguyên giá',
            icon: <PlusCircleOutlined />,
            onClick: () => openOperation(record, 'increase'),
          });
        }
        if (perms.canDecrease) {
          actionsList.push({
            key: 'decrease',
            label: 'Giảm nguyên giá',
            icon: <MinusCircleOutlined />,
            onClick: () => openOperation(record, 'decrease'),
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

      const isDraft = normalizeApprovalStatus(st) === 'DRAFT' || st === 'DRAFT';
      if (isDraft && perms.canDelete) {
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
    buoyMap,
    stationMap,
    openDetail,
    openEdit,
    openHistory,
    openOperation,
    handleOpenApproveModal,
    handleOpenRejectModal,
    handleSubmitApproval,
    orgName,
    perms,
  ]);

  const headerActions = useMemo<ScreenHeaderAction[]>(() => {
    if (!perms.canCreate) return [];
    return [
      {
        key: 'create',
        label: 'Thêm mới',
        icon: <PlusOutlined />,
        variant: 'primary',
        onClick: openCreate,
      },
    ];
  }, [openCreate, perms.canCreate]);

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản phao, tiêu và nhà trạm quản lý vận hành phao, tiêu' },
          ]}
          actions={headerActions}
        />

        <FilterTableLayout
          statusTabsNode={
            <CommonStatusTabs
              activeKey={(filters.approvalStatus as string) || 'all'}
              counts={statusCounts}
              onChange={(_key, status) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, approvalStatus: status }));
              }}
            />
          }
          error={Boolean(error)}
          errorMessage={error}
          onRetry={() => void loadData()}
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          filterContent={
            <TableFilter
              mode="fieldsOnly"
              filters={filterOptions}
              values={draftFilters}
              onChange={setDraftFilters}
            />
          }
        >
          <CommonTable<BuoyAsset>
            options={tableOptions}
            dataSource={data}
            loading={loading}
            total={total}
            page={page}
            pageSize={pageSize}
            filters={filters}
            onPageChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            }}
            onSortChange={(field, order) => {
              setPage(1);
              setFilters((current) => ({
                ...current,
                sortBy: order ? field : undefined,
                sortDir: order === 'ascend' ? 'ASC' : order === 'descend' ? 'DESC' : undefined,
              }));
            }}
          />
        </FilterTableLayout>

        <BuoyAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          buoys={buoys}
          buoyStations={buoyStations}
          attachments={attachments}
          saving={saving}
          saveAction={saveAction}
          onClose={closeDrawer}
          onSave={saveAsset}
          onUploadAttachment={handleUploadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onDownloadAttachment={handleDownloadAttachment}
          currentUser={currentUser}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
          onOpenOperation={(mode) => selected && openOperation(selected, mode)}
        />

        <BuoyAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          buoyMap={buoyMap}
          stationMap={stationMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        <BuoyAssetOperationForm
          open={Boolean(operationMode)}
          operationMode={operationMode}
          selected={selected}
          organizations={organizations}
          form={operationForm}
          saving={saving}
          saveAction={saveAction}
          onClose={() => setOperationMode(undefined)}
          onSubmit={submitOperation}
        />

        {/* ── History Drawer (chuẩn /berth) ────────────────────────── */}
        <AppDrawer
          width="min(880px, 96vw)"
          rootClassName="buoy-drawer-scope"
          className="buoy-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  {historyTarget ? `Lịch sử thay đổi — ${historyTarget.assetName}` : 'Lịch sử thay đổi'}
                </span>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                  Tổng cộng {historyFieldCount}
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
                    fontSize: fontSizeMd,
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
                <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
              </div>
            ) : (
              renderStandardHistoryCards({
                records: filteredHistoryRecords,
                fieldLabels: BUOY_ASSET_FIELD_LABELS,
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
                  if (fn === 'buoyId') {
                    const item = buoyMap.get(raw!);
                    return item ? `${item.code} - ${item.name}` : raw;
                  }
                  if (fn === 'buoyStationId') {
                    const item = stationMap.get(raw!);
                    return item ? `${item.code} - ${item.name}` : raw;
                  }
                  if (
                    fn === 'originalValue' ||
                    fn === 'remainingValue' ||
                    fn === 'accumulatedDepreciation' ||
                    fn === 'monthlyDepreciation'
                  ) {
                    return formatHistoryNumber(raw);
                  }
                  if (
                    fn === 'useDate' ||
                    fn === 'declarationDate' ||
                    fn === 'depreciationStartDate' ||
                    fn === 'depreciationEndDate'
                  ) {
                    const d = dayjs(raw);
                    return d.isValid() ? d.format('DD/MM/YYYY') : raw;
                  }
                  return raw;
                },
              })
            )}
          </div>
        </AppDrawer>

        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          title="Xác nhận xóa tài sản phao, tiêu"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(undefined)}
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
      </div>
    </ThemeTokenProvider>
  );
}
