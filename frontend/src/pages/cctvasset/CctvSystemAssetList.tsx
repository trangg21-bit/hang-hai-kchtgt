
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  RocketOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { AppDrawer } from '../../components/shared/AppDrawer';
import toast from '../../components/ToastNotification';
import { useAssetPermissions } from '../../hooks/useAssetPermissions';
import api from '../../services/api';
import { isAssetRecordEditable, normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import { isBlankOrDash, renderStandardHistoryCards, type RawHistoryRecord } from '../../utils/changeHistoryRenderer';
import { fmtInputNumber } from '../../utils/numFmt';

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
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import type { InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import { resolveDefaultOrgUnitId } from '../../components/org-unit';
import { ASSET_CONDITION_OPTIONS } from '../../constants/assetDropdown';
import { MARITIME_ASSET_TYPE_OPTIONS } from '../../constants/assetType';

import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import {
  createAssetDecrease,
  createAssetIncrease,
  createKhaiThac,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchKhaiThacList,
} from '../../services/assetmovement/api';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
} from '../../services/assetmovement/types';
import {
  createCctvSystemAsset,
  deleteCctvSystemAsset,
  fetchCctvDeviceOptions,
  fetchCctvSystemAssetById,
  fetchCctvSystemAssets,
  updateCctvSystemAsset,
} from '../../services/cctvasset/api';
import type {
  CctvDeviceOption,
  CctvSystemAsset,
  CctvSystemAssetFilters,
  CctvSystemAssetPayload,
} from '../../services/cctvasset/types';
import {
  organizationService,
  type Organization,
} from '../../services/organizationService';
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
import {
  downloadAttachmentFile,
  getAttachmentPreviewUrl,
  saveAttachmentFile,
} from '../../utils/attachmentStorage';
import CctvSystemAssetDetailContent from './CctvSystemAssetDetailContent';
import CctvSystemAssetForm, { type FormValues } from './CctvSystemAssetForm';
import CctvSystemAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './CctvSystemAssetOperationForm';

type DrawerMode = 'create' | 'edit' | 'detail';

const STATUS_COUNT_KEYS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED_LEVEL1',
  'APPROVED',
  'REJECTED_LEVEL1',
  'REJECTED_LEVEL2',
];

const CCTV_ASSET_FIELD_LABELS: Record<string, string> = {
  assetCode: 'Mã tài sản',
  assetName: 'Tên tài sản',
  cctvId: 'Thiết bị CCTV',
  cctvDeviceId: 'Thiết bị CCTV',
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  orgUnitId: 'Đơn vị quản lý',
  usingOrgUnitId: 'Đơn vị sử dụng',
  barcode: 'Mã barcode',
  assetCondition: 'Tình trạng tài sản',
  usageStatus: 'Hiện trạng sử dụng',
  assetGroup: 'Nhóm tài sản',
  assetSubgroup: 'Phân nhóm tài sản',
  assetType: 'Loại tài sản',
  address: 'Địa chỉ',
  origin: 'Nguồn gốc',
  quantity: 'Số lượng',
  quantityUnit: 'Đơn vị tính',
  model: 'Model',
  serialNumber: 'Số serial',
  countryOfOrigin: 'Xuất xứ',
  manufacturer: 'Hãng sản xuất',
  constructionYear: 'Năm xây dựng',
  useDate: 'Ngày sử dụng tài sản',
  landArea: 'Diện tích đất, sàn sử dụng (m²)',
  floorArea: 'Diện tích sàn xây dựng (m²)',
  assetLocation: 'Vị trí tài sản',
  declarationDate: 'Ngày kê khai tài sản',
  depreciationRate: 'Tỷ lệ hao mòn/khấu hao (%)',
  assignmentDecisionNumber: 'Số quyết định giao',
  depreciationStartDate: 'Ngày tính khấu hao',
  depreciationMonths: 'Số tháng tính khấu hao',
  depreciationEndDate: 'Ngày hết khấu hao',
  monthlyDepreciation: 'Khấu hao tháng (VNĐ)',
  originalValue: 'Nguyên giá (VNĐ)',
  accumulatedDepreciation: 'Hao mòn/khấu hao lũy kế (VNĐ)',
  remainingValue: 'Giá trị còn lại (VNĐ)',
  disposalMethod: 'Hình thức xử lý',
  approvalStatus: 'Trạng thái phê duyệt',
  approvalReasonLevel1: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
  approvalReasonLevel2: 'Nội dung phê duyệt cấp Cục',
  rejectionReason: 'Lý do từ chối',
  attachments: 'Tài liệu đính kèm',
};

const CCTV_HISTORY_FIELD_ORDER = [
  'assetCode',
  'assetName',
  'cctvId',
  'cctvDeviceId',
  'parentOrgUnitId',
  'orgUnitId',
  'usingOrgUnitId',
  'assetType',
  'barcode',
  'assetCondition',
  'usageStatus',
  'assetGroup',
  'assetSubgroup',
  'address',
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
  'declarationDate',
  'originalValue',
  'depreciationRate',
  'remainingValue',
  'accumulatedDepreciation',
  'monthlyDepreciation',
  'depreciationStartDate',
  'depreciationMonths',
  'depreciationEndDate',
  'assignmentDecisionNumber',
  'disposalMethod',
  'attachments',
];

const BREADCRUMB_ITEMS = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Quản lý tài sản KCHT hàng hải' },
  { label: 'Tài sản HT CCTV' },
];

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) =>
  Boolean((cause as { errorFields?: unknown }).errorFields);

export default function CctvSystemAssetList() {
  const perms = useAssetPermissions(['cctv', 'cctvasset']);
  const currentUser = useAuthStore((s) => s.user);
  const [data, setData] = useState<CctvSystemAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [cctvDevices, setCctvDevices] = useState<CctvDeviceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<CctvSystemAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<CctvSystemAssetFilters>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<CctvSystemAsset>();
  const [deleteTarget, setDeleteTarget] = useState<CctvSystemAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<CctvSystemAsset | null>(null);
  const [historyRecords, setHistoryRecords] = useState<RawHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  const orgName = useMemo(
    () => new Map(organizations.map((item) => [item.id, item.name])),
    [organizations]
  );
  const cctvDeviceMap = useMemo(
    () => new Map(cctvDevices.map((item) => [item.id, { deviceCode: item.deviceCode, deviceName: item.deviceName }])),
    [cctvDevices]
  );

  const formatHistoryValue = useCallback(
    (field: string, val: unknown) => {
      if (val == null || val === '') return '';
      if (
        ['originalValue', 'remainingValue', 'accumulatedDepreciation', 'monthlyDepreciation'].includes(
          field,
        )
      ) {
        const n = Number(val);
        if (!isNaN(n)) return `${fmtInputNumber(n)} VNĐ`;
      }
      if (field === 'depreciationRate') {
        const n = Number(val);
        if (!isNaN(n)) return `${n}%`;
      }
      if (field === 'landArea' || field === 'floorArea') {
        const n = Number(val);
        if (!isNaN(n)) return `${fmtInputNumber(n)} m²`;
      }
      if (field === 'orgUnitId' || field === 'usingOrgUnitId' || field === 'parentOrgUnitId') {
        return orgName.get(String(val)) || String(val);
      }
      if (field === 'cctvId' || field === 'cctvDeviceId') {
        const dev = cctvDeviceMap.get(String(val));
        return dev ? (dev.deviceCode ? `${dev.deviceCode} - ${dev.deviceName}` : dev.deviceName) : String(val);
      }
      if (field === 'constructionYear') {
        const str = String(val).trim();
        const match = str.match(/\b(19\d{2}|20\d{2})\b/);
        return match ? match[0] : str;
      }
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
    [orgName, cctvDeviceMap],
  );

  const openHistory = useCallback(async (record: CctvSystemAsset) => {
    setHistoryTarget(record);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    try {
      const res = await api.get(`/v1/asset/cctv-assets/${record.id}/history`);
      const d = res.data?.data || res.data;
      const list = Array.isArray(d?.changeHistory) ? d.changeHistory : (Array.isArray(d) ? d : []);
      setHistoryRecords(list);
    } catch {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const filteredHistoryRecords = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    return (historyRecords || []).filter((r: RawHistoryRecord) => {
      if (q) {
        const fn = (r.fieldName || r.changedField || '').toLowerCase();
        const ov = (r.oldValue || r.previousValue || '').toLowerCase();
        const nv = (r.newValue || r.value || '').toLowerCase();
        const lb = (CCTV_ASSET_FIELD_LABELS[r.fieldName || r.changedField] || r.fieldName || '').toLowerCase();
        const od = String(
          formatHistoryValue(r.fieldName || r.changedField, r.oldValue || r.previousValue) ??
            (r.oldValue || r.previousValue || ''),
        ).toLowerCase();
        const nd = String(
          formatHistoryValue(r.fieldName || r.changedField, r.newValue || r.value) ??
            (r.newValue || r.value || ''),
        ).toLowerCase();
        if (
          !fn.includes(q) &&
          !ov.includes(q) &&
          !nv.includes(q) &&
          !lb.includes(q) &&
          !od.includes(q) &&
          !nd.includes(q)
        ) {
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
  }, [historyRecords, historySearch, historyFrom, historyTo, formatHistoryValue]);

  const historyFieldCount = filteredHistoryRecords.length;

  const renderCctvHistoryTimeline = (filtered: RawHistoryRecord[]) => {
    const q = historySearch.toLowerCase().trim();
    return renderStandardHistoryCards({
      records: filtered,
      fieldLabels: CCTV_ASSET_FIELD_LABELS,
      groupOrder: CCTV_HISTORY_FIELD_ORDER,
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
        if (formatted === undefined) return undefined;
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec) => {
        const orgId = rec.orgUnitId;
        const oName = orgId ? orgName.get(orgId) : undefined;
        return String((oName ? oName.split(' - ').pop() || oName : rec.orgUnitName || rec.unitName) || '');
      },
      resolveActorName: (rawActor, rec) => {
        return rawActor || rec?.changedBy || rec?.createdBy || 'Nguyễn Văn An';
      },
      emptyMessage:
        q || historyFrom || historyTo
          ? 'Không tìm thấy kết quả phù hợp'
          : 'Chưa có thay đổi nào được ghi nhận',
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchCctvSystemAssets({
        ...filters,
        page: page - 1,
        size: pageSize,
      });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchCctvSystemAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) =>
          fetchCctvSystemAssets({ ...baseFilters, approvalStatus })
        ),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(
          STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])
        ),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản HT CCTV.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void organizationService.getAll()
      .then((items) => setOrganizations(items))
      .catch(() => setOrganizations([]));
    void fetchCctvDeviceOptions()
      .then((items) => setCctvDevices(items))
      .catch(() => setCctvDevices([]));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    setAttachments([]);
    form.resetFields();
    const currentOrgUnitId = resolveDefaultOrgUnitId(currentUser, organizations)
      || (currentUser?.orgUnitId && currentUser.orgUnitId !== '00000000-0000-0000-0000-000000000017' && currentUser.orgUnitId !== 'G17' ? currentUser.orgUnitId : undefined);
    if (currentOrgUnitId) {
      form.setFieldsValue({
        orgUnitId: currentOrgUnitId,
        valueUnit: 'VNĐ',
      });
    } else {
      form.setFieldsValue({
        valueUnit: 'VNĐ',
      });
      if (!currentUser?.orgUnitId) {
        api.get('/users/me').then((r) => {
          const p = r.data?.data ?? r.data;
          const uOrgId = p?.orgUnitId;
          if (uOrgId && uOrgId !== '00000000-0000-0000-0000-000000000017' && uOrgId !== 'G17') {
            form.setFieldsValue({ orgUnitId: uOrgId });
          }
        }).catch(() => {});
      }
    }
  }, [form, currentUser, organizations]);

  const openEdit = useCallback(
    (record: CctvSystemAsset) => {
      if (!isAssetRecordEditable(record.approvalStatus)) {
        toast.warning('Hồ sơ đang ở trạng thái không được phép chỉnh sửa.');
        return;
      }
      setSelected(record);
      setDrawerMode('edit');
      form.resetFields();
      if (record.attachmentName) {
        const fileNames = record.attachmentName.split(',').map((f) => f.trim()).filter(Boolean);
        const initialAtts: InfrastructureAttachmentItem[] = fileNames.map((fileName, idx) => ({
          id: `att-edit-${record.id}-${idx}`,
          fileName,
          fileSize: 1024 * 1024,
          uploadedByName: currentUser?.fullName || 'Hệ thống',
          uploadedDate: record.updatedAt
            ? dayjs(record.updatedAt).toISOString()
            : dayjs().toISOString(),
        }));
        setAttachments(initialAtts);
        Promise.all(
          fileNames.map(async (name, idx) => {
            try {
              const url = await getAttachmentPreviewUrl(name, {
                assetCode: record.assetCode,
                assetName: record.assetName,
              });
              return { id: `att-edit-${record.id}-${idx}`, url };
            } catch {
              return { id: `att-edit-${record.id}-${idx}`, url: undefined };
            }
          })
        ).then((resolved) => {
          setAttachments((prev) =>
            prev.map((item) => {
              const match = resolved.find((r) => r.id === item.id);
              return match?.url ? { ...item, url: match.url } : item;
            })
          );
        });
      } else {
        setAttachments([]);
      }
      form.setFieldsValue({
        ...record,
        constructionYear: record.constructionYear
          ? dayjs(`${record.constructionYear}-01-01`)
          : undefined,
        useDate: record.useDate ? dayjs(record.useDate) : undefined,
        declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
        depreciationStartDate: record.depreciationStartDate
          ? dayjs(record.depreciationStartDate)
          : undefined,
        depreciationEndDate: record.depreciationEndDate
          ? dayjs(record.depreciationEndDate)
          : undefined,
      });
    },
    [currentUser?.fullName, form]
  );

  const openDetail = useCallback(
    async (record: CctvSystemAsset) => {
      setSelected(record);
      setDrawerMode('detail');
      if (record.attachmentName) {
        const fileNames = record.attachmentName.split(',').map((f) => f.trim()).filter(Boolean);
        const initialAtts: InfrastructureAttachmentItem[] = fileNames.map((fileName, idx) => ({
          id: `att-detail-${record.id}-${idx}`,
          fileName,
          fileSize: 1024 * 1024,
          uploadedByName: record.updatedByName || currentUser?.fullName || 'Hệ thống',
          uploadedDate: record.updatedAt
            ? dayjs(record.updatedAt).toISOString()
            : dayjs().toISOString(),
        }));
        setAttachments(initialAtts);
        Promise.all(
          fileNames.map(async (name, idx) => {
            try {
              const url = await getAttachmentPreviewUrl(name, {
                assetCode: record.assetCode,
                assetName: record.assetName,
              });
              return { id: `att-detail-${record.id}-${idx}`, url };
            } catch {
              return { id: `att-detail-${record.id}-${idx}`, url: undefined };
            }
          })
        ).then((resolved) => {
          setAttachments((prev) =>
            prev.map((item) => {
              const match = resolved.find((r) => r.id === item.id);
              return match?.url ? { ...item, url: match.url } : item;
            })
          );
        });
      } else {
        setAttachments([]);
      }
      try {
        const full = await fetchCctvSystemAssetById(record.id);
        setSelected(full);
        if (full.attachmentName) {
          const fileNames = full.attachmentName.split(',').map((f) => f.trim()).filter(Boolean);
          const initialAtts: InfrastructureAttachmentItem[] = fileNames.map((fileName, idx) => ({
            id: `att-detail-${full.id}-${idx}`,
            fileName,
            fileSize: 1024 * 1024,
            uploadedByName: full.updatedByName || currentUser?.fullName || 'Hệ thống',
            uploadedDate: full.updatedAt
              ? dayjs(full.updatedAt).toISOString()
              : dayjs().toISOString(),
          }));
          setAttachments(initialAtts);
          Promise.all(
            fileNames.map(async (name, idx) => {
              try {
                const url = await getAttachmentPreviewUrl(name, {
                  assetCode: full.assetCode,
                  assetName: full.assetName,
                });
                return { id: `att-detail-${full.id}-${idx}`, url };
              } catch {
                return { id: `att-detail-${full.id}-${idx}`, url: undefined };
              }
            })
          ).then((resolved) => {
            setAttachments((prev) =>
              prev.map((item) => {
                const match = resolved.find((r) => r.id === item.id);
                return match?.url ? { ...item, url: match.url } : item;
              })
            );
          });
        }
      } catch {
        // fallback record
      }
      try {
        const [exploits, increases, decreases] = await Promise.all([
          fetchKhaiThacList({ assetId: record.id, page: 0, size: 50 }),
          fetchAssetIncreaseList({ assetId: record.id, page: 0, size: 50 }),
          fetchAssetDecreaseList({ assetId: record.id, page: 0, size: 50 }),
        ]);
        setExploitationRows(exploits.content || []);
        setIncreaseRows(increases.content || []);
        setDecreaseRows(decreases.content || []);
      } catch {
        setExploitationRows([]);
        setIncreaseRows([]);
        setDecreaseRows([]);
      }
    },
    [currentUser?.fullName]
  );

  const handleUploadAttachment = useCallback(
    (file: File) => {
      void saveAttachmentFile(file.name, file);
      const url = URL.createObjectURL(file);
      const newAtt: InfrastructureAttachmentItem = {
        id: `att-upload-${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        file,
        originFileObj: file,
        url,
        uploadedByName: currentUser?.fullName || 'Người dùng',
        uploadedDate: new Date().toISOString(),
      };
      setAttachments((prev) => {
        const next = [...prev, newAtt];
        form.setFieldValue('attachmentName', next.map((a) => a.fileName).join(', '));
        return next;
      });
      toast.success(`Đã tải lên tệp: ${file.name}`);
    },
    [currentUser?.fullName, form]
  );

  const handleDeleteAttachment = useCallback(
    (id: string) => {
      setAttachments((prev) => {
        const next = prev.filter((a) => a.id !== id);
        form.setFieldValue(
          'attachmentName',
          next.length > 0 ? next.map((a) => a.fileName).join(', ') : undefined
        );
        return next;
      });
      toast.info('Đã xóa tệp đính kèm');
    },
    [form]
  );

  const handleDownloadAttachment = useCallback(
    async (_id: string, fileName: string) => {
      await downloadAttachmentFile(fileName, {
        assetCode: selected?.assetCode,
        assetName: selected?.assetName,
      });
    },
    [selected?.assetCode, selected?.assetName]
  );

  const toYearNumber = (val: unknown): number | undefined => {
    if (val == null || val === '') return undefined;
    if (typeof val === 'number') return isNaN(val) ? undefined : val;
    if (dayjs.isDayjs(val)) return val.isValid() ? val.year() : undefined;
    const match = String(val).match(/\b(19\d{2}|20\d{2})\b/);
    if (match) return parseInt(match[0], 10);
    const parsed = dayjs(String(val));
    return parsed.isValid() ? parsed.year() : undefined;
  };

  const toDateString = (val: unknown): string | undefined => {
    if (val == null || val === '') return undefined;
    if (dayjs.isDayjs(val)) return val.isValid() ? val.format('YYYY-MM-DD') : undefined;
    if (typeof val === 'string') {
      const s = val.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    }
    const parsed = dayjs(val as string | number | Date);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined;
  };

  const saveAsset = async (status: string) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(status);

      const payload: CctvSystemAssetPayload = {
        ...values,
        approvalStatus: status,
        constructionYear: toYearNumber(values.constructionYear),
        useDate: toDateString(values.useDate),
        declarationDate: toDateString(values.declarationDate),
        depreciationStartDate: toDateString(values.depreciationStartDate),
        depreciationEndDate: toDateString(values.depreciationEndDate),
        attachmentName:
          attachments.length > 0 ? attachments.map((a) => a.fileName).join(', ') : undefined,
      };

      const cleanPayload: Record<string, unknown> = { ...payload };
      const excludeKeys = [
        'id',
        'parentOrgUnitName',
        'orgUnitName',
        'usingOrgUnitName',
        'cctvSystemCode',
        'cctvSystemName',
        'createdByName',
        'updatedByName',
        'submittedByName',
        'departmentApprovedByName',
        'departmentApprovedAt',
        'portAuthorityApprovedByName',
        'portAuthorityApprovedAt',
        'submittedAt',
        'rejectionReason',
        'createdAt',
        'updatedAt',
        'lockVersion',
      ];
      excludeKeys.forEach((key) => delete cleanPayload[key]);
      Object.keys(cleanPayload).forEach((key) => {
        if (cleanPayload[key] === '' || cleanPayload[key] === null) {
          delete cleanPayload[key];
        }
      });

      if (drawerMode === 'create') {
        await createCctvSystemAsset(cleanPayload as unknown as CctvSystemAssetPayload);
        toast.success(
          status === 'DRAFT'
            ? 'Đã lưu tạm tài sản HT CCTV'
            : status === 'PENDING_APPROVAL'
            ? 'Đã gửi duyệt tài sản HT CCTV'
            : 'Đã tạo và phê duyệt tài sản HT CCTV'
        );
      } else if (selected) {
        await updateCctvSystemAsset(selected.id, cleanPayload as unknown as CctvSystemAssetPayload);
        toast.success('Đã cập nhật tài sản HT CCTV thành công');
      }

      setDrawerMode(undefined);
      form.resetFields();
      void loadData();
    } catch (cause: unknown) {
      if (isValidationError(cause)) {
        const error = cause as { errorFields?: Array<{ name: string | string[]; errors: string[] }> };
        const firstError = error.errorFields?.[0]?.errors?.[0];
        toast.warning(firstError || 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
      } else {
        toast.error(getErrorMessage(cause, 'Không thể lưu thông tin tài sản HT CCTV.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFilterApply = useCallback(() => {
    setPage(1);
    const updatedRange = draftFilters.updatedRange as [Dayjs | null, Dayjs | null] | undefined;
    setFilters({
      ...draftFilters,
      updatedFrom: updatedRange?.[0] ? updatedRange[0].format('YYYY-MM-DD') : undefined,
      updatedTo: updatedRange?.[1] ? updatedRange[1].format('YYYY-MM-DD') : undefined,
    });
  }, [draftFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({});
    setPage(1);
    setFilters({});
  }, []);

  const handleOperationSubmit = async (targetAction?: any) => {
    if (!operationMode || !selected) return;
    try {
      if (typeof targetAction === 'string') {
        setSaveAction(targetAction);
      }
      const values = await operationForm.validateFields();
      setSaving(true);

      if (operationMode === 'exploit') {
        const exploitationYear = values.exploitationDeadline
          ? dayjs(values.exploitationDeadline).year()
          : dayjs().year();

        await createKhaiThac({
          assetId: selected.id,
          assetName: selected.assetName,
          exploitationYear,
          doanhThu: values.totalRevenue || 0,
          depreciation: values.relatedCosts || 0,
          description: values.notes || '',
          operatorOrgUnitId: values.operatorOrgUnitId,
          assetCategory: [selected.assetCode, selected.assetName].filter(Boolean).join(' - '),
          unitOfMeasure: values.unitOfMeasure,
          quantity: values.quantity,
          exploitationDeadline: values.exploitationDeadline
            ? values.exploitationDeadline.format('YYYY-MM-DD')
            : undefined,
          totalRevenue: values.totalRevenue,
          relatedCosts: values.relatedCosts,
          stateBudgetPayment: values.stateBudgetPayment,
          projectAmount: values.projectAmount,
        });
        toast.success('Đã thêm hồ sơ khai thác tài sản thành công');
      } else {
        const adjustmentDetails: AssetValueAdjustmentDetails = {
          decisionNumber: values.decisionNumber,
          decisionDate: values.decisionDate ? values.decisionDate.format('YYYY-MM-DD') : undefined,
          adjustmentDate: values.adjustmentDate
            ? values.adjustmentDate.format('YYYY-MM-DD')
            : undefined,
          adjustmentReason: values.adjustmentReason,
          adjustmentNotes: values.notes,
          originalValueBefore: selected.originalValue,
          originalValueAfter: values.originalValue,
          remainingValueBefore: selected.remainingValue,
          remainingValueAfter:
            values.originalValue != null && values.accumulatedDepreciation != null
              ? Math.max(0, values.originalValue - values.accumulatedDepreciation)
              : undefined,
          declarationDate: values.declarationDate
            ? values.declarationDate.format('YYYY-MM-DD')
            : undefined,
          depreciationRate: values.depreciationRate,
          valueUnit: 'VNĐ',
          assignmentDecisionNumber: values.assignmentDecisionNumber,
          depreciationStartDate: values.depreciationStartDate
            ? values.depreciationStartDate.format('YYYY-MM-DD')
            : undefined,
          depreciationMonths: values.depreciationMonths,
          depreciationEndDate: values.depreciationEndDate
            ? values.depreciationEndDate.format('YYYY-MM-DD')
            : undefined,
          accumulatedDepreciation: values.accumulatedDepreciation,
          monthlyDepreciation:
            values.originalValue && values.depreciationMonths
              ? Math.round(values.originalValue / values.depreciationMonths)
              : undefined,
          disposalMethod: values.disposalMethod,
        };

        if (operationMode === 'increase') {
          await createAssetIncrease({
            assetId: selected.id,
            assetName: selected.assetName,
            quantity: selected.quantity || 1,
            unitOfMeasure: selected.quantityUnit || 'Hệ thống',
            reason: values.adjustmentReason || 'Đầu tư bổ sung',
            increaseCode: `YC-TANG-${Date.now().toString().slice(-6)}`,
            adjustmentDetails,
          });
          toast.success('Đã tạo yêu cầu tăng nguyên giá tài sản thành công');
        } else {
          await createAssetDecrease({
            assetId: selected.id,
            assetName: selected.assetName,
            quantity: selected.quantity || 1,
            unitOfMeasure: selected.quantityUnit || 'Hệ thống',
            decreaseReason: values.adjustmentReason || 'Thanh lý một phần',
            reason: values.adjustmentReason || 'Thanh lý một phần',
            decreaseCode: `YC-GIAM-${Date.now().toString().slice(-6)}`,
            adjustmentDetails,
          });
          toast.success('Đã tạo yêu cầu giảm nguyên giá tài sản thành công');
        }
      }

      setOperationMode(undefined);
      operationForm.resetFields();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu thông tin.'));
      }
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
      key: 'cctvId',
      label: 'Mã thiết bị CCTV',
      type: 'select',
      placeholder: 'Chọn thiết bị CCTV',
      options: cctvDevices.map((item) => ({
        value: item.id,
        label: `${item.deviceCode} - ${item.deviceName}`,
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
      label: 'Khoảng ngày cập nhật',
      type: 'dateRange',
      placeholder: ['Từ ngày', 'Đến ngày'],
      isAdvanced: true,
    },
  ], [organizations, cctvDevices]);

  const tableOptions = useMemo<TableOption<CctvSystemAsset>>(() => ({
    dataKey: 'id',
    mainColumns: [
      {
        title: 'MÃ & TÊN TÀI SẢN',
        dataIndex: 'assetCode',
        type: TableColumnType.TwoLine,
        subField: 'assetName',
        width: 260,
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
        render: (v, record) => <span style={{ fontWeight: themeTokenChk.fontWeightBold }}>{record.orgUnitName || (v ? orgName.get(v as string) : undefined) || '—'}</span>,
      },
      {
        title: 'ĐƠN VỊ SỬ DỤNG',
        dataIndex: 'usingOrgUnitId',
        type: TableColumnType.Text,
        width: 250,
        allowSort: true,
        render: (v, record) => record.usingOrgUnitName || (v ? orgName.get(v as string) : undefined) || '—',
      },
      {
        title: 'MÃ THIẾT BỊ CCTV',
        dataIndex: 'cctvId',
        type: TableColumnType.Text,
        width: 220,
        allowSort: true,
        render: (v, record) => {
          const a = v ? cctvDeviceMap.get(v as string) : undefined;
          return a ? `${a.deviceCode} - ${a.deviceName}` : (record.cctvDeviceCode ? String(record.cctvDeviceCode) : '—');
        },
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 180,
        allowSort: true,
        render: (v) => (v ? String(v) : '—'),
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
        sortField: 'updatedAt',
      },
      {
        title: 'CÁN BỘ GỬI PHÊ DUYỆT',
        dataIndex: 'submittedByName',
        type: TableColumnType.TwoLine,
        subField: 'submittedAt',
        width: 240,
        allowSort: true,
        sortField: 'submittedAt',
      },
      {
        title: 'CÁN BỘ PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovedByName',
        type: TableColumnType.TwoLine,
        subField: 'portAuthorityApprovedAt',
        width: 340,
        allowSort: true,
        sortField: 'portAuthorityApprovedAt',
      },
      {
        title: 'CÁN BỘ PHÊ DUYỆT CẤP CỤC',
        dataIndex: 'departmentApprovedByName',
        type: TableColumnType.TwoLine,
        subField: 'departmentApprovedAt',
        width: 260,
        allowSort: true,
        sortField: 'departmentApprovedAt',
      },
    ],
    actions: (record: CctvSystemAsset) => [
      {
        key: 'detail',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />,
        onClick: () => void openDetail(record),
      },
      ...(perms.canUpdate && isAssetRecordEditable(record.approvalStatus)
        ? [
            {
              key: 'edit',
              label: 'Sửa',
              icon: <EditOutlined />,
              onClick: () => openEdit(record),
            },
          ]
        : []),
      {
        key: 'exploit',
        label: 'Khai thác tài sản',
        icon: <RocketOutlined />,
        onClick: () => {
          setSelected(record);
          setOperationMode('exploit');
          operationForm.resetFields();
          operationForm.setFieldsValue({
            unitOfMeasure: record.quantityUnit,
            quantity: record.quantity,
          });
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
      },
      ...(perms.canHistory
        ? [
            {
              key: 'history',
              label: 'Lịch sử thay đổi',
              icon: <HistoryOutlined />,
              onClick: () => void openHistory(record),
            },
          ]
        : []),
      {
        key: 'delete',
        label: 'Xóa',
        icon: <DeleteOutlined />,
        onClick: () => setDeleteTarget(record),
      },
    ],
  }), [openDetail, openEdit, operationForm, openHistory, orgName, cctvDeviceMap, perms]);

  const headerActions: ScreenHeaderAction[] = useMemo(() => {
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
  }, [openCreate, perms.canCreate, perms.userPermissions]);

  const customTokens = useMemo(
    () => ({
      ...themeTokenChk,
      fontSizeMd: 13.5,
    }),
    []
  );

  return (
    <ThemeTokenProvider tokens={customTokens}>
      <div
        className="cctv-asset-page-wrapper"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        <style>{`
          .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

          .cctv-asset-page-wrapper,
          .cctv-asset-page-wrapper .ant-table,
          .cctv-asset-page-wrapper .ant-table-cell,
          .cctv-asset-page-wrapper .ant-table-thead > tr > th,
          .cctv-asset-page-wrapper .ant-table-tbody > tr > td,
          .cctv-asset-page-wrapper .ant-input,
          .cctv-asset-page-wrapper .ant-select,
          .cctv-asset-page-wrapper .ant-select-selection-item,
          .cctv-asset-page-wrapper .ant-select-item-option-content,
          .cctv-asset-page-wrapper .ant-picker,
          .cctv-asset-page-wrapper .ant-picker-input > input,
          .cctv-asset-page-wrapper .ant-btn,
          .cctv-asset-page-wrapper .ant-pagination,
          .cctv-asset-page-wrapper .ant-pagination-item,
          .cctv-asset-page-wrapper .ant-pagination-total-text,
          .cctv-asset-page-wrapper .ant-breadcrumb,
          .cctv-asset-page-wrapper .ant-form-item-label > label {
            font-size: 13.5px !important;
          }
        `}</style>

        <ScreenHeader
          title="Tài sản HT CCTV"
          breadcrumb={BREADCRUMB_ITEMS}
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

        <CctvSystemAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          cctvDevices={cctvDevices}
          attachments={attachments}
          saving={saving}
          saveAction={saveAction}
          onClose={() => {
            setDrawerMode(undefined);
            form.resetFields();
          }}
          onSave={saveAsset}
          onUploadAttachment={handleUploadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onDownloadAttachment={handleDownloadAttachment}
        />

        <CctvSystemAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          attachments={attachments}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          cctvDeviceMap={cctvDeviceMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        <CctvSystemAssetOperationForm
          open={Boolean(operationMode)}
          operationMode={operationMode}
          selected={selected}
          organizations={organizations}
          form={operationForm}
          saving={saving}
          saveAction={saveAction}
          onClose={() => {
            setOperationMode(undefined);
            operationForm.resetFields();
          }}
          onSubmit={handleOperationSubmit}
        />

        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          onCancel={() => setDeleteTarget(undefined)}
          loading={saving}
          itemType="tài sản HT CCTV"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={() => {
            if (!deleteTarget) return;
            setSaving(true);
            void deleteCctvSystemAsset(deleteTarget.id)
              .then(() => {
                toast.success('Đã xóa tài sản HT CCTV.');
                setDeleteTarget(undefined);
                return loadData();
              })
              .catch((cause: unknown) =>
                toast.error(getErrorMessage(cause, 'Không thể xóa tài sản HT CCTV.'))
              )
              .finally(() => setSaving(false));
          }}
        />

        {/* ── History Drawer ────────────────────────────────────────── */}
        <AppDrawer
          width="min(880px, 96vw)"
          rootClassName="cctv-asset-drawer-scope"
          className="cctv-asset-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  {historyTarget
                    ? `Lịch sử thay đổi — ${historyTarget.assetName || historyTarget.assetCode || 'Tài sản HT CCTV'}`
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
              renderCctvHistoryTimeline(filteredHistoryRecords)
            )}
          </div>
        </AppDrawer>
      </div>
    </ThemeTokenProvider>
  );
}
