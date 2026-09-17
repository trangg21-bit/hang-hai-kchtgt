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
import dayjs, { type Dayjs } from 'dayjs';
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
  resolveMimeType,
  triggerBlobDownload,
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import toast from '../../components/ToastNotification';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import api from '../../services/api';
import {
  approveInfraAssetC1,
  approveInfraAssetC2,
  createAssetDecrease,
  createAssetIncrease,
  createKhaiThac,
  createStationAsset,
  deleteInfraAssetAttachment,
  deleteStationAsset,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchInfraAssetAttachments,
  fetchKhaiThacList,
  fetchStationAssets,
  rejectInfraAssetC1,
  rejectInfraAssetC2,
  submitInfraAssetApproval,
  updateStationAsset,
  uploadInfraAssetAttachments,
} from '../../services/assetmovement/api';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
  StationAsset,
  StationAssetFilters,
  StationAssetPayload,
} from '../../services/assetmovement/types';
import { organizationService, type Organization } from '../../services/organizationService';
import type { GenericStationOption } from '../../services/stationOptionsService';
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
import { isAssetRecordEditable, normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import { countStandardHistoryCards, isBlankOrDash, renderStandardHistoryCards, type RawHistoryRecord } from '../../utils/changeHistoryRenderer';
import { fmtInputNumber } from '../../utils/numFmt';
import LritAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './LritAssetOperationForm';
import StationAssetDetailContent from './StationAssetDetailContent';
import StationAssetForm, { type StationFormValues } from './StationAssetForm';
import { type StationTypeConfig } from './stationConfigs';

const STATUS_COUNT_KEYS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED_LEVEL1',
  'APPROVED',
  'REJECTED_LEVEL1',
  'REJECTED_LEVEL2',
  'ARCHIVED',
];

const ASSET_FIELD_LABELS: Record<string, string> = {
  // Thông tin cơ bản & Quản lý vận hành
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  orgUnitId: 'Đơn vị quản lý',
  usingOrgUnitId: 'Đơn vị sử dụng',
  stationId: 'Trạm bờ',
  lritStationId: 'Mã đài',
  ttdhStationId: 'Mã đài',
  inmarsatStationId: 'Mã đài',
  cospasSarsatStationId: 'Mã đài',
  ttxlttStationId: 'Mã đài',
  dryPortId: 'Cảng cạn',
  assetType: 'Loại tài sản',
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
  serialNumber: 'Serial',
  countryOfOrigin: 'Xuất xứ',
  manufacturer: 'Hãng sản xuất',
  constructionYear: 'Năm xây dựng',
  useDate: 'Ngày sử dụng tài sản',
  landArea: 'Diện tích đất, sàn sử dụng (m²)',
  floorArea: 'Diện tích sàn sử dụng (m²)',
  assetLocation: 'Vị trí tài sản',
  address: 'Địa chỉ',
  location: 'Vị trí',
  description: 'Mô tả / Ghi chú',
  technicalSpecs: 'Thông số kỹ thuật',
  fundingSource: 'Nguồn kinh phí',

  // Hồ sơ tài sản & File đính kèm
  attachmentName: 'File đính kèm',
  attachments: 'File đính kèm',
  'File đính kèm': 'File đính kèm',
  'Tài liệu đính kèm': 'File đính kèm',

  // Thông tin chi tiết & Giá trị - Khấu hao
  declarationDate: 'Ngày kê khai tài sản',
  originalValue: 'Nguyên giá (VNĐ)',
  depreciationRate: 'Tỷ lệ hao mòn/khấu hao (%)',
  remainingValue: 'Giá trị còn lại (VNĐ)',
  assignmentDecisionNumber: 'Số quyết định giao',
  depreciationStartDate: 'Ngày tính khấu hao',
  depreciationMonths: 'Số tháng tính khấu hao',
  depreciationEndDate: 'Ngày hết khấu hao',
  accumulatedDepreciation: 'Khấu hao lũy kế (VNĐ)',
  monthlyDepreciation: 'Khấu hao tháng (VNĐ)',
  disposalMethod: 'Hình thức xử lý tài sản',

  // Phê duyệt
  approvalStatus: 'Trạng thái phê duyệt',
  portAuthorityApprovalContent: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
  approvalReasonLevel1: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
  approvalContentLevel1: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
  departmentApprovalContent: 'Nội dung phê duyệt cấp Cục',
  approvalReasonLevel2: 'Nội dung phê duyệt cấp Cục',
  approvalContentLevel2: 'Nội dung phê duyệt cấp Cục',
  rejectionReason: 'Lý do từ chối',
};

const HISTORY_FIELD_ORDER = [
  // Thông tin chung
  'parentOrgUnitId',
  'orgUnitId',
  'usingOrgUnitId',
  'lritStationId',
  'ttdhStationId',
  'inmarsatStationId',
  'cospasSarsatStationId',
  'ttxlttStationId',
  'stationId',
  'dryPortId',
  'assetType',
  'assetCode',
  'assetName',
  'barcode',
  'assetCondition',
  'usageStatus',
  'assetGroup',
  'assetSubgroup',
  'origin',
  'quantity',
  'quantityUnit',
  'model',
  'serialNumber',
  'countryOfOrigin',
  'manufacturer',
  'constructionYear',
  'useDate',
  'landArea',
  'floorArea',
  'assetLocation',
  'address',
  'location',
  'description',
  'technicalSpecs',
  'fundingSource',

  // Hồ sơ tài sản
  'attachmentName',
  'attachments',
  'File đính kèm',
  'Tài liệu đính kèm',

  // Thông tin chi tiết
  'declarationDate',
  'originalValue',
  'depreciationRate',
  'remainingValue',
  'assignmentDecisionNumber',
  'depreciationStartDate',
  'depreciationMonths',
  'depreciationEndDate',
  'accumulatedDepreciation',
  'monthlyDepreciation',
  'disposalMethod',

  // Phê duyệt
  'approvalStatus',
  'portAuthorityApprovalContent',
  'approvalReasonLevel1',
  'approvalContentLevel1',
  'departmentApprovalContent',
  'approvalReasonLevel2',
  'approvalContentLevel2',
  'rejectionReason',
];

import { ASSET_CONDITION_OPTIONS } from '../../constants/assetDropdown';

type DrawerMode = 'create' | 'edit' | 'detail';

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) => Boolean((cause as { errorFields?: unknown }).errorFields);

const parseYearToDayjs = (val: unknown): dayjs.Dayjs | undefined => {
  if (val == null || val === '') return undefined;
  if (dayjs.isDayjs(val)) return val;
  const str = String(val).trim();
  const match = str.match(/\b(19\d{2}|20\d{2})\b/);
  if (match) {
    return dayjs(match[1], 'YYYY');
  }
  const d = dayjs(str);
  return d.isValid() ? dayjs(String(d.year()), 'YYYY') : undefined;
};

export interface StationAssetListProps {
  config: StationTypeConfig;
  fetchStationOptions: () => Promise<GenericStationOption[]>;
}

export default function StationAssetList({ config, fetchStationOptions }: StationAssetListProps) {
  const [data, setData] = useState<StationAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stations, setStations] = useState<GenericStationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<StationAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<StationAssetFilters>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<StationAsset>();
  const [deleteTarget, setDeleteTarget] = useState<StationAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<StationFormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<StationAsset | null>(null);
  const [historyRecords, setHistoryRecords] = useState<RawHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');


  const orgName = useMemo(() => new Map(organizations.map((item) => [item.id, item.name])), [organizations]);
  const stationMap = useMemo(
    () => new Map(stations.map((item) => [item.id, { id: item.id, name: item.name || item.stationName || item.code || '', code: item.code || item.stationCode }])),
    [stations],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchStationAssets(
        {
          ...filters,
          page: page - 1,
          size: pageSize,
        },
        config.type,
      );
      const rows = res?.content || [];
      setData(rows);
      setTotal(res?.totalElements || 0);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchStationAssets(baseFilters, config.type),
        ...STATUS_COUNT_KEYS.map((approvalStatus) => fetchStationAssets({ ...baseFilters, approvalStatus }, config.type)),
      ]);
      setStatusCounts({
        all: all?.totalElements || 0,
        ...Object.fromEntries(STATUS_COUNT_KEYS.map((k, i) => [k, statusPages[i]?.totalElements || 0])),
      });
    } catch (e) {
      setError(getErrorMessage(e, `Không thể tải danh sách ${config.title.toLowerCase()}`));
    } finally {
      setLoading(false);
    }
  }, [config.title, config.type, filters, page, pageSize]);

  useEffect(() => {
    void organizationService.getAll().then(setOrganizations).catch(() => {});
    void fetchStationOptions().then(setStations).catch(() => {});
  }, [fetchStationOptions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  // ── Approval state & handlers ──────────────────────────────────────
  const [approvingRecord, setApprovingRecord] = useState<StationAsset | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  const [rejectingRecord, setRejectingRecord] = useState<StationAsset | null>(null);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const handleOpenApproveModal = useCallback((record: StationAsset, level: 'c1' | 'c2') => {
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

  const handleOpenRejectModal = useCallback((record: StationAsset, level: 'c1' | 'c2') => {
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

  const handleSubmitApproval = useCallback(async (record: StationAsset) => {
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

  const handleOpenCreate = useCallback(() => {
    form.resetFields();
    setSelected(undefined);
    setAttachments([]);
    setExploitationRows([]);
    setIncreaseRows([]);
    setDecreaseRows([]);
    setDrawerMode('create');
  }, [form]);

  const handleOpenEdit = useCallback(async (record: StationAsset) => {
    if (!isAssetRecordEditable(record.approvalStatus)) {
      toast.warning('Hồ sơ đang ở trạng thái không được phép chỉnh sửa.');
      return;
    }
    setSelected(record);
    setAttachments(
      record.attachmentName
        ? [
            {
              id: 'att-1',
              fileName: record.attachmentName,
              fileSize: 1024 * 512,
              uploadDate: record.updatedAt || record.createdAt || '',
              uploadedBy: record.updatedByName || record.submittedByName || 'Hệ thống',
            },
          ]
        : [],
    );
    form.setFieldsValue({
      ...record,
      [config.stationFieldName]: (record as unknown as Record<string, unknown>)[config.stationFieldName] as string | undefined || record.stationId,
      constructionYear: parseYearToDayjs(record.constructionYear),
      useDate: record.useDate ? dayjs(record.useDate) : undefined,
      declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
      depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
      depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
    });
    setDrawerMode('edit');
    try {
      const realAtts = await fetchInfraAssetAttachments(record.id).catch(() => []);
      if (realAtts && realAtts.length > 0) {
        setAttachments(
          realAtts.map((att) => ({
            id: att.id,
            fileName: att.fileName,
            fileSize: att.fileSize,
            fileType: att.contentType,
            uploadedByName: att.uploadedByName || record.updatedByName || '—',
            uploadedDate: att.uploadedAt || (record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString()),
            filePath: `/v1/asset/infra-assets/${record.id}/attachments/${att.id}/download`,
          })),
        );
      } else if (record.attachmentName) {
        setAttachments(
          record.attachmentName.split(',').map((name, i) => ({
            id: `att-${i}`,
            fileName: name.trim(),
            fileSize: 1024 * 512,
            uploadedDate: record.updatedAt || record.createdAt || dayjs().toISOString(),
            uploadedByName: record.updatedByName || record.submittedByName || 'Hệ thống',
          })),
        );
      } else {
        setAttachments([]);
      }
    } catch {
      // fallback
    }

    try {
      const [exp, inc, dec] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetExploitationResponse[] })),
        fetchAssetIncreaseList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetIncreaseResponse[] })),
        fetchAssetDecreaseList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetDecreaseResponse[] })),
      ]);
      setExploitationRows(exp.content || []);
      setIncreaseRows(inc.content || []);
      setDecreaseRows(dec.content || []);
    } catch {
      // ignore
    }
  }, [config.stationFieldName, form]);

  const handleOpenDetail = useCallback(async (record: StationAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exp, inc, dec] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetExploitationResponse[] })),
        fetchAssetIncreaseList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetIncreaseResponse[] })),
        fetchAssetDecreaseList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetDecreaseResponse[] })),
      ]);
      setExploitationRows(exp.content || []);
      setIncreaseRows(inc.content || []);
      setDecreaseRows(dec.content || []);
    } catch {
      // ignore
    }
  }, []);

  const formatHistoryValue = useCallback(
    (field: string, val: unknown) => {
      if (val == null || val === '') return '';
      const strVal = String(val).trim();
      if (!strVal || strVal === '-') return '';

      // Currency
      if (
        [
          'originalValue',
          'remainingValue',
          'accumulatedDepreciation',
          'monthlyDepreciation',
        ].includes(field)
      ) {
        const n = Number(val);
        if (!isNaN(n)) return `${fmtInputNumber(n)} VNĐ`;
      }
      // Percent
      if (field === 'depreciationRate') {
        const n = Number(val);
        if (!isNaN(n)) return `${n}%`;
      }
      // Area
      if (field === 'landArea' || field === 'floorArea') {
        const n = Number(val);
        if (!isNaN(n)) return `${fmtInputNumber(n)} m²`;
      }
      // Quantity
      if (field === 'quantity') {
        const n = Number(val);
        if (!isNaN(n)) return fmtInputNumber(n);
      }
      // Depreciation months
      if (field === 'depreciationMonths') {
        const n = Number(val);
        if (!isNaN(n)) return `${fmtInputNumber(n)} tháng`;
      }
      // Construction year
      if (field === 'constructionYear') {
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
          return dayjs(val).format('YYYY');
        }
        return String(val);
      }
      // Organizations
      if (
        field === 'orgUnitId' ||
        field === 'usingOrgUnitId' ||
        field === 'parentOrgUnitId'
      ) {
        return orgName.get(String(val)) || String(val);
      }
      // Station lookup
      if (
        field === 'stationId' ||
        field === config.stationFieldName ||
        field === 'lritStationId' ||
        field === 'ttdhStationId' ||
        field === 'inmarsatStationId' ||
        field === 'cospasSarsatStationId' ||
        field === 'ttxlttStationId'
      ) {
        const st = stationMap.get(String(val));
        return st
          ? st.code
            ? `${st.name} (${st.code})`
            : st.name
          : String(val);
      }
      // Approval Status
      if (field === 'approvalStatus') {
        const statusMap: Record<string, string> = {
          DRAFT: 'Lưu tạm',
          NHAP: 'Lưu tạm',
          PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
          CHO_PHE_DUYET: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
          APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cục',
          CHO_DUYET_CAP_2: 'Chờ phê duyệt cấp Cục',
          APPROVED: 'Đã phê duyệt',
          DA_PHE_DUYET: 'Đã phê duyệt',
          DA_DUYET: 'Đã phê duyệt',
          REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
          REJECTED_LEVEL2: 'Từ chối cấp Cục',
          REJECTED: 'Từ chối',
          TU_CHOI: 'Từ chối',
          ARCHIVED: 'Đã xóa',
          DA_XOA: 'Đã xóa',
        };
        return statusMap[strVal] || strVal;
      }
      // Dates
      if (
        field === 'useDate' ||
        field === 'declarationDate' ||
        field === 'depreciationStartDate' ||
        field === 'depreciationEndDate'
      ) {
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
          return dayjs(val).format('DD/MM/YYYY');
        }
      }
      return undefined;
    },
    [config.stationFieldName, orgName, stationMap],
  );

  const openHistory = useCallback(
    async (record: StationAsset) => {
      setHistoryTarget(record);
      setHistoryOpen(true);
      setHistoryLoading(true);
      setHistoryRecords([]);
      setHistorySearch('');
      setHistoryFrom('');
      setHistoryTo('');
      try {
        const res = await api.get(`/v1/asset/infra-assets/${record.id}/history`);
        const d = res.data?.data || res.data;
        let ch = Array.isArray(d?.changeHistory) ? d.changeHistory : (Array.isArray(d) ? d : []);
        if (ch.length === 0) {
          const stationId =
            (record as unknown as Record<string, unknown>)[config.stationFieldName] ||
            record.stationId ||
            record.lritStationId ||
            record.ttdhStationId ||
            record.inmarsatStationId ||
            record.cospasSarsatStationId ||
            record.ttxlttStationId;
          if (stationId) {
            const fallbackEp =
              config.type === 'COSPAS_SARSAT_STATION'
                ? `/v1/stations/cospas-sarsat/${stationId}/history`
                : config.type === 'TTXLTT_STATION'
                  ? `/v1/stations/haiphong/${stationId}/history`
                  : `/v1/stations/lrit/${stationId}/history`;
            const sRes = await api.get(fallbackEp).catch(() => null);
            const sData = sRes?.data?.data || sRes?.data;
            if (Array.isArray(sData?.changeHistory) && sData.changeHistory.length > 0) {
              ch = sData.changeHistory;
            } else if (Array.isArray(sData) && sData.length > 0) {
              ch = sData;
            }
          }
        }
        setHistoryRecords(ch);
      } catch {
        toast.error('Không thể tải lịch sử');
      } finally {
        setHistoryLoading(false);
      }
    },
    [config.stationFieldName, config.type],
  );

  const renderStationHistoryTimeline = (records: RawHistoryRecord[]) => {
    const q = historySearch.toLowerCase().trim();
    const filtered = (records || []).filter((r: RawHistoryRecord) => {
      if (q) {
        const fn = (r.fieldName || r.changedField || '').toLowerCase();
        const ov = (r.oldValue || r.previousValue || '').toLowerCase();
        const nv = (r.newValue || r.value || '').toLowerCase();
        const lb = (ASSET_FIELD_LABELS[r.fieldName || r.changedField] || r.fieldName || '').toLowerCase();
        const od = String(
          formatHistoryValue(r.fieldName || r.changedField, r.oldValue || r.previousValue) ??
            (r.oldValue || r.previousValue || ''),
        ).toLowerCase();
        const nd = String(
          formatHistoryValue(r.fieldName || r.changedField, r.newValue || r.value) ??
            (r.newValue || r.value || ''),
        ).toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) {
          return false;
        }
      }
      if (historyFrom || historyTo) {
        const cd = r.changedAt || r.createdAt || r.approvedDate || '';
        if (historyFrom && cd.substring(0, 10) < historyFrom) return false;
        if (historyTo && cd.substring(0, 10) > historyTo) return false;
      }
      return true;
    });

    return renderStandardHistoryCards({
      records: filtered,
      fieldLabels: ASSET_FIELD_LABELS,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        if (fn === 'attachments' || fn === 'Tài liệu đính kèm' || fn === 'File đính kèm') {
          if (raw && !isBlankOrDash(raw)) {
            const files = String(raw)
              .split(/\s*,\s*/)
              .map((f) => f.trim())
              .filter((f) => !isBlankOrDash(f));
            if (files.length > 0) {
              return (
                <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: '20px' }}>
                  {files.map((file, idx) => (
                    <span key={idx} style={{ wordBreak: 'break-all' }}>
                      {file}
                    </span>
                  ))}
                </span>
              );
            }
          }
        }
        const formatted = formatHistoryValue(fn, raw);
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec): string => {
        const orgId = rec.orgUnitId || historyTarget?.orgUnitId || historyTarget?.parentOrgUnitId;
        const oName = orgId ? orgName.get(orgId) : undefined;
        return String((oName ? oName.split(' - ').pop() || oName : rec.orgUnitName || rec.unitName) || (historyTarget?.orgUnitName || ''));
      },
      resolveActorName: (rawActor, rec): string => {
        return String(rawActor || rec?.changedBy || rec?.createdBy || 'Nguyễn Văn An');
      },
      emptyMessage:
        q || historyFrom || historyTo
          ? 'Không tìm thấy kết quả phù hợp'
          : 'Chưa có thay đổi nào được ghi nhận',
    });
  };

  const countStationHistoryCards = (records: any[]): number => {
    const q = historySearch.toLowerCase().trim();
    const filtered = (records || []).filter((r: any) => {
      if (q) {
        const fn = (r.fieldName || r.changedField || '').toLowerCase();
        const ov = (r.oldValue || r.previousValue || '').toLowerCase();
        const nv = (r.newValue || r.value || '').toLowerCase();
        const lb = (ASSET_FIELD_LABELS[r.fieldName || r.changedField] || r.fieldName || '').toLowerCase();
        const od = String(
          formatHistoryValue(r.fieldName || r.changedField, r.oldValue || r.previousValue) ??
            (r.oldValue || r.previousValue || ''),
        ).toLowerCase();
        const nd = String(
          formatHistoryValue(r.fieldName || r.changedField, r.newValue || r.value) ??
            (r.newValue || r.value || ''),
        ).toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) {
          return false;
        }
      }
      if (historyFrom || historyTo) {
        const cd = r.changedAt || r.createdAt || r.approvedDate || '';
        if (historyFrom && cd.substring(0, 10) < historyFrom) return false;
        if (historyTo && cd.substring(0, 10) > historyTo) return false;
      }
      return true;
    });

    return countStandardHistoryCards({
      records: filtered,
      fieldLabels: ASSET_FIELD_LABELS,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        if (fn === 'attachments' || fn === 'Tài liệu đính kèm' || fn === 'File đính kèm') {
          if (raw && !isBlankOrDash(raw)) {
            const files = String(raw)
              .split(/\s*,\s*/)
              .map((f) => f.trim())
              .filter((f) => !isBlankOrDash(f));
            if (files.length > 0) {
              return 'attachments';
            }
          }
        }
        const formatted = formatHistoryValue(fn, raw);
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec): string => {
        const orgId = rec.orgUnitId || historyTarget?.orgUnitId || historyTarget?.parentOrgUnitId;
        const oName = orgId ? orgName.get(orgId) : undefined;
        return String((oName ? oName.split(' - ').pop() || oName : rec.orgUnitName || rec.unitName) || (historyTarget?.orgUnitName || ''));
      },
      resolveActorName: (rawActor, rec): string => {
        return String(rawActor || rec?.changedBy || rec?.createdBy || 'Nguyễn Văn An');
      },
    });
  };

  const historyUpdateCount = useMemo(() => {
    return countStationHistoryCards(historyRecords);
  }, [historyRecords, historySearch, historyFrom, historyTo, orgName, historyTarget]);

  const handleSave = async (status: string) => {
    setSaveAction(status);
    setSaving(true);
    try {
      const formValues = form.getFieldsValue(true);
      const validatedValues = await form.validateFields();
      const merged = {
        ...(selected && drawerMode === 'edit' ? selected : {}),
        ...formValues,
        ...validatedValues,
      };
      const stationIdValue = (merged as unknown as Record<string, unknown>)[config.stationFieldName] as string | undefined || merged.stationId;
      const payload: StationAssetPayload = {
        ...merged,
        assetType: merged.assetType || config.type,
        types: config.types,
        stationId: stationIdValue,
        [config.stationFieldName]: stationIdValue,
        constructionYear: merged.constructionYear
          ? (dayjs.isDayjs(merged.constructionYear)
              ? Number(merged.constructionYear.format('YYYY'))
              : (typeof merged.constructionYear === 'number'
                  ? merged.constructionYear
                  : Number(String(merged.constructionYear).match(/\b(19\d{2}|20\d{2})\b/)?.[0] || merged.constructionYear)))
          : undefined,
        useDate: merged.useDate
          ? (dayjs.isDayjs(merged.useDate) ? merged.useDate.format('YYYY-MM-DD') : String(merged.useDate))
          : undefined,
        declarationDate: merged.declarationDate
          ? (dayjs.isDayjs(merged.declarationDate) ? merged.declarationDate.format('YYYY-MM-DD') : String(merged.declarationDate))
          : undefined,
        depreciationStartDate: merged.depreciationStartDate
          ? (dayjs.isDayjs(merged.depreciationStartDate) ? merged.depreciationStartDate.format('YYYY-MM-DD') : String(merged.depreciationStartDate))
          : undefined,
        depreciationEndDate: merged.depreciationEndDate
          ? (dayjs.isDayjs(merged.depreciationEndDate) ? merged.depreciationEndDate.format('YYYY-MM-DD') : String(merged.depreciationEndDate))
          : undefined,
        attachmentName: attachments.length > 0 ? attachments[0].fileName : undefined,
        approvalStatus: status,
      };

      let savedId: string | undefined;
      if (drawerMode === 'create') {
        const created = await createStationAsset(payload, config.type);
        savedId = created.id;
        if (merged.operatorOrgUnitId || merged.totalRevenue || merged.exploitationDeadline) {
          const deadlineDate = merged.exploitationDeadline
            ? (dayjs.isDayjs(merged.exploitationDeadline) ? merged.exploitationDeadline : dayjs(merged.exploitationDeadline))
            : undefined;

          await createKhaiThac({
            assetId: created.id,
            assetName: created.assetName,
            operatorOrgUnitId: merged.operatorOrgUnitId || undefined,
            exploitationYear: deadlineDate && deadlineDate.isValid() ? deadlineDate.year() : dayjs().year(),
            doanhThu: merged.totalRevenue || 0,
            depreciation: merged.relatedCosts || 0,
            description: merged.description || '',
            unitOfMeasure: merged.unitOfMeasure,
            quantity: merged.exploitationQuantity || 1,
            exploitationDeadline: deadlineDate && deadlineDate.isValid() ? deadlineDate.format('YYYY-MM-DD') : undefined,
            totalRevenue: merged.totalRevenue,
            relatedCosts: merged.relatedCosts,
            stateBudgetPayment: merged.stateBudgetPayment,
            projectAmount: merged.projectAmount,
          }).catch(() => {});
        }
        toast.success(`Thêm mới ${config.title.toLowerCase()} thành công`);
      } else if (drawerMode === 'edit' && selected) {
        await updateStationAsset(selected.id, payload, config.type);
        savedId = selected.id;
        if (merged.operatorOrgUnitId || merged.totalRevenue || merged.exploitationDeadline) {
          const deadlineDate = merged.exploitationDeadline
            ? (dayjs.isDayjs(merged.exploitationDeadline) ? merged.exploitationDeadline : dayjs(merged.exploitationDeadline))
            : undefined;

          await createKhaiThac({
            assetId: selected.id,
            assetName: selected.assetName,
            operatorOrgUnitId: merged.operatorOrgUnitId || undefined,
            exploitationYear: deadlineDate && deadlineDate.isValid() ? deadlineDate.year() : dayjs().year(),
            doanhThu: merged.totalRevenue || 0,
            depreciation: merged.relatedCosts || 0,
            description: merged.description || '',
            unitOfMeasure: merged.unitOfMeasure,
            quantity: merged.exploitationQuantity || 1,
            exploitationDeadline: deadlineDate && deadlineDate.isValid() ? deadlineDate.format('YYYY-MM-DD') : undefined,
            totalRevenue: merged.totalRevenue,
            relatedCosts: merged.relatedCosts,
            stateBudgetPayment: merged.stateBudgetPayment,
            projectAmount: merged.projectAmount,
          }).catch(() => {});
        }
        toast.success(`Cập nhật ${config.title.toLowerCase()} thành công`);
      }

      const filesToUpload = attachments
        .map((a) => a.originFileObj || (a as unknown as { file?: File }).file)
        .filter((f): f is File => f instanceof File);
      if (filesToUpload.length > 0 && savedId) {
        try {
          await uploadInfraAssetAttachments(savedId, filesToUpload);
        } catch (uploadErr) {
          console.error('Upload attachments error:', uploadErr);
        }
      }

      setDrawerMode(undefined);
      void loadData();
    } catch (e) {
      if (!isValidationError(e)) {
        toast.error(getErrorMessage(e, 'Lưu dữ liệu không thành công'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteStationAsset(deleteTarget.id);
      toast.success(`Xóa ${config.title.toLowerCase()} thành công`);
      setDeleteTarget(undefined);
      void loadData();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Không thể xóa tài sản'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitOperation = async () => {
    if (!selected || !operationMode) return;
    setSaving(true);
    try {
      const values = await operationForm.validateFields();

      if (operationMode === 'exploit') {
        const deadlineDate = values.exploitationDeadline
          ? (dayjs.isDayjs(values.exploitationDeadline) ? values.exploitationDeadline : dayjs(values.exploitationDeadline))
          : undefined;

        await createKhaiThac({
          assetId: selected.id,
          assetName: selected.assetName,
          operatorOrgUnitId: values.operatorOrgUnitId || undefined,
          assetCategory: [selected.assetCode, selected.assetName].filter(Boolean).join(' - '),
          exploitationYear: deadlineDate && deadlineDate.isValid() ? deadlineDate.year() : dayjs().year(),
          doanhThu: values.totalRevenue || 0,
          depreciation: values.relatedCosts || 0,
          description: values.notes || '',
          unitOfMeasure: values.unitOfMeasure,
          quantity: values.quantity,
          exploitationDeadline: deadlineDate && deadlineDate.isValid() ? deadlineDate.format('YYYY-MM-DD') : undefined,
          totalRevenue: values.totalRevenue,
          relatedCosts: values.relatedCosts,
          stateBudgetPayment: values.stateBudgetPayment,
          projectAmount: values.projectAmount,
        });
        toast.success('Lưu thông tin khai thác thành công');
      } else if (operationMode === 'increase') {
        const toDateStr = (d?: Dayjs | string) => {
          if (!d) return undefined;
          const parsed = dayjs.isDayjs(d) ? d : dayjs(d);
          return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined;
        };
        const details: AssetValueAdjustmentDetails = {
          decisionNumber: values.decisionNumber,
          decisionDate: toDateStr(values.decisionDate),
          adjustmentDate: toDateStr(values.adjustmentDate),
          adjustmentReason: values.adjustmentReason,
          adjustmentNotes: values.notes,
          declarationDate: toDateStr(values.declarationDate),
          originalValue: values.originalValue,
          depreciationRate: values.depreciationRate,
          assignmentDecisionNumber: values.assignmentDecisionNumber,
          depreciationStartDate: toDateStr(values.depreciationStartDate),
          depreciationMonths: values.depreciationMonths,
          depreciationEndDate: toDateStr(values.depreciationEndDate),
          accumulatedDepreciation: values.accumulatedDepreciation,
          disposalMethod: values.disposalMethod,
        };
        await createAssetIncrease({
          assetId: selected.id,
          assetName: selected.assetName,
          increaseCode: values.decisionNumber || `INC-${Date.now()}`,
          reason: values.adjustmentReason || '',
          quantity: values.quantity || 1,
          unitOfMeasure: selected.quantityUnit || 'Cái',
          adjustmentDetails: details,
        });
        toast.success('Gửi yêu cầu tăng nguyên giá thành công');
      } else if (operationMode === 'decrease') {
        const toDateStr = (d?: Dayjs | string) => {
          if (!d) return undefined;
          const parsed = dayjs.isDayjs(d) ? d : dayjs(d);
          return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined;
        };
        const details: AssetValueAdjustmentDetails = {
          decisionNumber: values.decisionNumber,
          decisionDate: toDateStr(values.decisionDate),
          adjustmentDate: toDateStr(values.adjustmentDate),
          adjustmentReason: values.adjustmentReason,
          adjustmentNotes: values.notes,
          declarationDate: toDateStr(values.declarationDate),
          originalValue: values.originalValue,
          depreciationRate: values.depreciationRate,
          assignmentDecisionNumber: values.assignmentDecisionNumber,
          depreciationStartDate: toDateStr(values.depreciationStartDate),
          depreciationMonths: values.depreciationMonths,
          depreciationEndDate: toDateStr(values.depreciationEndDate),
          accumulatedDepreciation: values.accumulatedDepreciation,
          disposalMethod: values.disposalMethod,
        };
        await createAssetDecrease({
          assetId: selected.id,
          assetName: selected.assetName,
          decreaseCode: values.decisionNumber || `DEC-${Date.now()}`,
          reason: values.adjustmentReason || '',
          decreaseReason: values.adjustmentReason || '',
          quantity: values.quantity || 1,
          unitOfMeasure: selected.quantityUnit || 'Cái',
          adjustmentDetails: details,
        });
        toast.success('Gửi yêu cầu giảm nguyên giá thành công');
      }

      setOperationMode(undefined);
      operationForm.resetFields();
      void loadData();
    } catch (e) {
      if (!isValidationError(e)) {
        toast.error(getErrorMessage(e, 'Thực hiện thao tác thất bại'));
      }
    } finally {
      setSaving(false);
    }
  };

  const filterOptions = useMemo<FilterOption[]>(
    () => [
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
        key: config.stationFieldName,
        label: config.stationLabel,
        type: 'select',
        placeholder: config.stationPlaceholder,
        options: stations.map((s) => ({
          value: s.id,
          label: s.code ? `${s.code} - ${s.name}` : s.name,
        })),
        isAdvanced: true,
      },
      {
        key: 'assetType',
        label: 'Loại tài sản',
        type: 'select',
        disabled: true,
        defaultValue: config.type,
        options: [{ value: config.type, label: config.title }],
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
    ],
    [config.stationFieldName, config.stationLabel, config.stationPlaceholder, organizations, stations],
  );

  const handleFilterApply = useCallback(() => {
    setPage(1);
    const range = draftFilters.updatedRange as [Dayjs | null, Dayjs | null] | undefined;
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

  const tableOptions = useMemo<TableOption<StationAsset>>(
    () => ({
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
          onClick: (record) => void handleOpenDetail(record),
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
          title: config.stationLabel.toUpperCase(),
          dataIndex: config.stationFieldName as keyof StationAsset,
          type: TableColumnType.Text,
          width: 190,
          allowSort: true,
          render: (_v, record) => {
            const sId = (record as unknown as Record<string, unknown>)[config.stationFieldName] || record.stationId || record.lritStationId || record.ttdhStationId || record.inmarsatStationId || record.cospasSarsatStationId || record.ttxlttStationId;
            const st = stationMap.get(sId as string);
            return st ? (st.code ? `${st.code} - ${st.name}` : st.name) : '—';
          },
        },
        {
          title: 'LOẠI TÀI SẢN',
          dataIndex: 'assetType',
          type: TableColumnType.Text,
          width: 180,
          allowSort: true,
          render: () => config.title,
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
          title: 'CÁN BỘ PHÊ DUYỆT CẤP CỤC',
          dataIndex: 'departmentApprovedByName',
          type: TableColumnType.TwoLine,
          subField: 'departmentApprovedAt',
          width: 260,
          allowSort: true,
          sortField: 'departmentApprovedBy',
        },
      ],
      actions: (record: StationAsset) => {
        const st = normalizeApprovalStatus(record.approvalStatus || (record as any).status);
        const isArchived = st === 'ARCHIVED';

        if (isArchived) {
          return [
            {
              key: 'detail',
              label: 'Xem chi tiết',
              icon: <EyeOutlined />,
              onClick: () => void handleOpenDetail(record),
            },
            {
              key: 'history',
              label: 'Lịch sử',
              icon: <HistoryOutlined />,
              onClick: () => void openHistory(record),
            },
          ];
        }

        const actionsList: any[] = [
          {
            key: 'detail',
            label: 'Xem chi tiết',
            icon: <EyeOutlined />,
            onClick: () => void handleOpenDetail(record),
          },
        ];

        if (isAssetRecordEditable(st)) {
          actionsList.push({
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <EditOutlined />,
            onClick: () => handleOpenEdit(record),
          });
        }

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

        if (st === 'PENDING_APPROVAL' || st === 'PROPOSED') {
          actionsList.push(
            {
              key: 'approveC1',
              label: 'Phê duyệt cấp Cảng vụ/Chi cục',
              icon: <CheckOutlined />,
              onClick: () => handleOpenApproveModal(record, 'c1'),
            },
            {
              key: 'rejectC1',
              label: 'Từ chối cấp Cảng vụ/Chi cục',
              icon: <CloseOutlined />,
              danger: true,
              onClick: () => handleOpenRejectModal(record, 'c1'),
            }
          );
        }

        if (st === 'APPROVED_LEVEL1') {
          actionsList.push(
            {
              key: 'approveC2',
              label: 'Phê duyệt cấp Cục',
              icon: <CheckOutlined />,
              onClick: () => handleOpenApproveModal(record, 'c2'),
            },
            {
              key: 'rejectC2',
              label: 'Từ chối cấp Cục',
              icon: <CloseOutlined />,
              danger: true,
              onClick: () => handleOpenRejectModal(record, 'c2'),
            }
          );
        }

        if (st === 'APPROVED' || st === 'APPROVED_LEVEL2') {
          actionsList.push(
            {
              key: 'exploit',
              label: 'Khai thác tài sản',
              icon: <RocketOutlined />,
              onClick: () => {
                setSelected(record);
                setOperationMode('exploit');
                operationForm.resetFields();
              },
            },
            {
              key: 'increase',
              label: 'Tăng nguyên giá',
              icon: <PlusCircleOutlined />,
              onClick: () => {
                setSelected(record);
                setOperationMode('increase');
                operationForm.resetFields();
              },
            },
            {
              key: 'decrease',
              label: 'Giảm nguyên giá',
              icon: <MinusCircleOutlined />,
              onClick: () => {
                setSelected(record);
                setOperationMode('decrease');
                operationForm.resetFields();
              },
            }
          );
        }

        actionsList.push({
          key: 'history',
          label: 'Lịch sử',
          icon: <HistoryOutlined />,
          onClick: () => void openHistory(record),
        });

        if (st === 'DRAFT') {
          actionsList.push({
            key: 'delete',
            label: 'Xóa',
            icon: <DeleteOutlined />,
            onClick: () => setDeleteTarget(record),
          });
        }

        return actionsList;
      },
    }),
    [
      config.stationFieldName,
      config.stationLabel,
      config.title,
      handleOpenDetail,
      handleOpenEdit,
      openHistory,
      operationForm,
      handleOpenApproveModal,
      handleOpenRejectModal,
      handleSubmitApproval,
      orgName,
      stationMap,
    ],
  );
  const headerActions: ScreenHeaderAction[] = useMemo(
    () => [
      {
        key: 'create',
        label: 'Thêm mới',
        icon: <PlusOutlined />,
        variant: 'primary',
        onClick: handleOpenCreate,
      },
    ],
    [handleOpenCreate],
  );

  const customTokens = useMemo(
    () => ({
      ...themeTokenChk,
      fontSizeMd: 13.5,
    }),
    [],
  );

  return (
    <ThemeTokenProvider tokens={customTokens}>
      <div className="station-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

          .station-page-wrapper,
          .station-page-wrapper .ant-table,
          .station-page-wrapper .ant-table-cell,
          .station-page-wrapper .ant-table-thead > tr > th,
          .station-page-wrapper .ant-table-tbody > tr > td,
          .station-page-wrapper .ant-input,
          .station-page-wrapper .ant-select,
          .station-page-wrapper .ant-select-selection-item,
          .station-page-wrapper .ant-select-item-option-content,
          .station-page-wrapper .ant-picker,
          .station-page-wrapper .ant-picker-input > input,
          .station-page-wrapper .ant-btn,
          .station-page-wrapper .ant-pagination,
          .station-page-wrapper .ant-pagination-item,
          .station-page-wrapper .ant-pagination-total-text,
          .station-page-wrapper .ant-breadcrumb,
          .station-page-wrapper .ant-form-item-label > label,
          .station-asset-drawer-scope,
          .station-asset-drawer-scope .ant-drawer-content,
          .station-asset-drawer-scope .ant-tabs-tab,
          .station-asset-drawer-scope .chk-detail-label,
          .station-asset-drawer-scope .chk-detail-value,
          .station-asset-drawer-scope .ant-table,
          .station-asset-drawer-scope .ant-table-cell,
          .station-asset-drawer-scope .ant-table-thead > tr > th,
          .station-asset-drawer-scope .ant-btn,
          .station-asset-drawer-scope .ant-select,
          .station-asset-drawer-scope .ant-input,
          .station-asset-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }

          .station-page-wrapper div:has(> button[aria-pressed]) {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            justify-content: safe center !important;
            align-items: center !important;
            scrollbar-width: thin !important;
            scrollbar-color: #cbd5e1 #f8fafc !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            padding: 2px 8px 4px 8px !important;
            gap: clamp(6px, 1vw, 14px) !important;
          }
          .station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 4px !important;
            display: block !important;
          }
          .station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .station-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }

          .station-page-wrapper > div:first-of-type {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          .station-asset-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
        `}</style>

        <ScreenHeader
          breadcrumb={[{ label: config.breadcrumbGroup }, { label: config.breadcrumbItem }]}
          actions={headerActions}
        />

        <FilterTableLayout
          statusTabsNode={
            <CommonStatusTabs
              activeKey={filters.approvalStatus || 'all'}
              counts={statusCounts}
              onChange={(_key, queryStatus) => {
                setPage(1);
                setFilters((current) => ({ ...current, approvalStatus: queryStatus }));
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
              onChange={setDraftFilters}
            />
          }
        >
          <CommonTable
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
              setFilters((current) => ({
                ...current,
                sortBy: order ? field : undefined,
                sortDir:
                  order === 'ascend'
                    ? 'ASC'
                    : order === 'descend'
                      ? 'DESC'
                      : undefined,
              }));
            }}
          />
        </FilterTableLayout>

        {/* ── Create / Edit Drawer (DynamicFormSidebar) ─────────────── */}
        <StationAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          config={config}
          form={form}
          organizations={organizations}
          stations={stations.map((item) => ({ id: item.id, name: item.name || item.stationName || item.code || '', code: item.code || item.stationCode }))}
          attachments={attachments}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
          orgName={(id) => orgName.get(id || '') || '—'}
          saving={saving}
          saveAction={saveAction}
          onClose={() => {
            setDrawerMode(undefined);
            form.resetFields();
          }}
          onSave={handleSave}
          onUploadAttachment={(file) => {
            const newAtt: InfrastructureAttachmentItem = {
              id: `att-${Date.now()}`,
              fileName: file.name,
              fileSize: file.size,
              uploadDate: dayjs().toISOString(),
              uploadedBy: currentUser?.fullName || currentUser?.username || 'Hệ thống',
            };
            setAttachments((prev) => [...prev, newAtt]);
          }}
          onDeleteAttachment={(id) => {
            if (selected?.id && id.includes('-') && !id.startsWith('att-')) {
              deleteInfraAssetAttachment(selected.id, id).catch(() => {});
            }
            setAttachments((prev) => prev.filter((a) => a.id !== id));
          }}
          onDownloadAttachment={async (_id, fileName) => {
            const att = attachments.find((a) => a.id === _id || a.fileName === fileName);
            if (att?.originFileObj) {
              triggerBlobDownload(att.originFileObj, fileName || att.originFileObj.name);
              toast.success(`Đã tải xuống tệp: ${fileName}`);
              return;
            }
            if (att?.file) {
              triggerBlobDownload(att.file, fileName || att.file.name);
              toast.success(`Đã tải xuống tệp: ${fileName}`);
              return;
            }
            if (att?.url && (att.url.startsWith('blob:') || att.url.startsWith('data:'))) {
              triggerBlobDownload(att.url, fileName || 'tai-lieu');
              toast.success(`Đã tải xuống tệp: ${fileName}`);
              return;
            }
            const targetPath =
              att?.filePath ||
              (selected?.id && _id && !_id.startsWith('att-')
                ? `/v1/asset/infra-assets/${selected.id}/attachments/${_id}/download`
                : undefined);
            if (targetPath) {
              try {
                let cleanPath = targetPath;
                if (cleanPath.startsWith('/api/')) {
                  cleanPath = cleanPath.replace(/^\/api/, '');
                } else if (!cleanPath.startsWith('/')) {
                  cleanPath = `/${cleanPath}`;
                }
                const res = await api.get(cleanPath, { responseType: 'blob' });
                const serverContentType =
                  (typeof res.headers?.['content-type'] === 'string' ? res.headers['content-type'] : '') || '';
                const contentType = resolveMimeType(
                  fileName || att?.fileName || 'tai-lieu',
                  serverContentType || 'application/octet-stream',
                );
                const blob = new Blob([res.data], { type: contentType });
                triggerBlobDownload(blob, fileName || att?.fileName || 'tai-lieu');
                toast.success(`Đã tải xuống tệp: ${fileName}`);
                return;
              } catch (err) {
                console.warn('Download error from server, falling back to local generated attachment:', err);
              }
            }
            const fallbackContentType = resolveMimeType(
              fileName || 'tai-lieu',
              att?.fileType || 'application/octet-stream',
            );
            const fallbackBlob = new Blob(
              [`Tài liệu đính kèm: ${fileName}\nThời gian: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}\nĐược tải về từ Hệ thống Quản lý KCHT Hàng hải`],
              { type: fallbackContentType },
            );
            triggerBlobDownload(fallbackBlob, fileName || 'tai-lieu');
            toast.success(`Đã tải xuống tệp: ${fileName}`);
          }}
        />

        {/* ── Detail Drawer (DynamicViewSidebar) ─────────────────────── */}
        <StationAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          config={config}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          stationMap={stationMap as any}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        {/* ── Operations Drawer (DynamicFormSidebar) ─────────────────── */}
        <LritAssetOperationForm
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
          onSubmit={handleSubmitOperation}
        />

        {/* ── History Drawer ────────────────────────────────────────── */}
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
                  {historyTarget
                    ? `Lịch sử thay đổi — ${historyTarget.assetName || historyTarget.assetCode || config.title}`
                    : 'Lịch sử thay đổi'}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    padding: '2px 10px',
                    borderRadius: 999,
                    fontSize: fontSizeLg - 1,
                    fontWeight: fontWeightBold,
                    background: `${colors.sidebarBg}15`,
                    color: colors.sidebarBg,
                    lineHeight: '20px',
                  }}
                >
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
          }}
        >
          <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
          <div style={{ flexShrink: 0 }}>
            {!historyLoading && (
              <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
                <Input
                  placeholder="Tìm kiếm nội dung thay đổi..."
                  allowClear
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
                />
                <DatePicker
                  placeholder="Từ ngày"
                  classNames={{ popup: { root: 'history-dt-popup' } }}
                  value={historyFrom ? dayjs(historyFrom) : null}
                  onChange={(d) => setHistoryFrom(d ? d.format('YYYY-MM-DD') : '')}
                  style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                  format="DD/MM/YYYY"
                />
                <DatePicker
                  placeholder="Đến ngày"
                  classNames={{ popup: { root: 'history-dt-popup' } }}
                  value={historyTo ? dayjs(historyTo) : null}
                  onChange={(d) => setHistoryTo(d ? d.format('YYYY-MM-DD') : '')}
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
            ) : historyRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
              </div>
            ) : (
              renderStationHistoryTimeline(historyRecords)
            )}
          </div>
        </AppDrawer>

        {/* ── Delete Confirmation Modal ────────────────────────────── */}
        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          onCancel={() => setDeleteTarget(undefined)}
          loading={saving}
          itemType={config.title.toLowerCase()}
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={handleDelete}
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
