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
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from '../../components/ToastNotification';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { AppDrawer } from '../../components/shared/AppDrawer';
import api from '../../services/api';
import { isBlankOrDash, renderStandardHistoryCards } from '../../utils/changeHistoryRenderer';
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
import { organizationService, type Organization } from '../../services/organizationService';
import {
  createVtsSystemAsset,
  deleteVtsSystemAsset,
  fetchVtsSystemAssets,
  fetchVtsSystemOptions,
  updateVtsSystemAsset,
  type VtsSystemOption,
} from '../../services/vtsasset/api';
import type {
  VtsSystemAsset,
  VtsSystemAssetFilters,
  VtsSystemAssetPayload,
} from '../../services/vtsasset/types';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import {
  actionPrimary, borderDefault, colors, drawerTitleStyle,
  fontSizeLg,
  fontSizeMd, fontWeightBold, radiusPill, spaceMd, spaceSm, spaceXl,
  textTertiary
} from '../../themetokenchk';
import { isAssetRecordEditable } from '../../utils/approvalEditPolicy';
import {
  downloadAttachmentFile,
  getAttachmentPreviewUrl,
  saveAttachmentFile,
} from '../../utils/attachmentStorage';
import VtsSystemAssetDetailContent from './VtsSystemAssetDetailContent';
import VtsSystemAssetForm, { type FormValues } from './VtsSystemAssetForm';
import VtsSystemAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './VtsSystemAssetOperationForm';

const STATUS_COUNT_KEYS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED_LEVEL1',
  'APPROVED',
  'REJECTED_LEVEL1',
  'REJECTED_LEVEL2',
];

const VTS_ASSET_FIELD_LABELS: Record<string, string> = {
  assetCode: 'Mã tài sản',
  assetName: 'Tên tài sản',
  vtsSystemId: 'Hệ thống VTS',
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

const VTS_HISTORY_FIELD_ORDER = [
  'assetCode',
  'assetName',
  'vtsSystemId',
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

type DrawerMode = 'create' | 'edit' | 'detail';

const ASSET_CONDITIONS = ['Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được'];
const VTS_ASSET_TYPES = [
  'Trạm radar',
  'Hệ thống trạm bờ AIS',
  'Quản lý hệ thống CCTV',
  'Quản lý hệ thống SCADA',
  'Quản lý hệ thống truyền dẫn',
  'Quản lý hệ thống phụ trợ VTS',
  'Khác',
];

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) => Boolean((cause as { errorFields?: unknown }).errorFields);

export default function VtsSystemAssetList() {
  const [data, setData] = useState<VtsSystemAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [vtsSystems, setVtsSystems] = useState<VtsSystemOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<VtsSystemAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<VtsSystemAssetFilters>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<VtsSystemAsset>();
  const [deleteTarget, setDeleteTarget] = useState<VtsSystemAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<VtsSystemAsset | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  const orgName = useMemo(
    () => new Map(organizations.map((item) => [item.id, item.name])),
    [organizations]
  );
  const vtsSystemMap = useMemo(
    () => new Map(vtsSystems.map((item) => [item.id, { code: item.code, name: item.name }])),
    [vtsSystems]
  );

  const formatHistoryValue = useCallback(
    (field: string, val: any) => {
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
      if (field === 'vtsSystemId') {
        const vts = vtsSystemMap.get(String(val));
        return vts ? (vts.code ? `${vts.code} - ${vts.name}` : vts.name) : String(val);
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
    [orgName, vtsSystemMap],
  );

  const openHistory = useCallback(async (record: VtsSystemAsset) => {
    setHistoryTarget(record);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    try {
      const res = await api.get(`/v1/asset/vts-assets/${record.id}/history`);
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
    return (historyRecords || []).filter((r: any) => {
      if (q) {
        const fn = (r.fieldName || r.changedField || '').toLowerCase();
        const ov = (r.oldValue || r.previousValue || '').toLowerCase();
        const nv = (r.newValue || r.value || '').toLowerCase();
        const lb = (VTS_ASSET_FIELD_LABELS[r.fieldName || r.changedField] || r.fieldName || '').toLowerCase();
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

  const renderVtsHistoryTimeline = (filtered: any[]) => {
    const q = historySearch.toLowerCase().trim();
    return renderStandardHistoryCards({
      records: filtered,
      fieldLabels: VTS_ASSET_FIELD_LABELS,
      groupOrder: VTS_HISTORY_FIELD_ORDER,
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
        // Chỉ trả '' khi formatter thực sự trả blank (ví dụ orgUnitId unknown).
        // Nếu formatted === undefined → không có formatter riêng → trả undefined
        // để paintValue fallback về autoFormatHistoryValue (hiển thị raw value).
        if (formatted === undefined) return undefined;
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec) => {
        const orgId = rec.orgUnitId || historyTarget?.orgUnitId || historyTarget?.parentOrgUnitId;
        const oName = orgId ? orgName.get(orgId) : undefined;
        return (oName ? oName.split(' - ').pop() || oName : rec.orgUnitName || rec.unitName) || (historyTarget?.orgUnitName || '');
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
      const response = await fetchVtsSystemAssets({
        ...filters,
        page: page - 1,
        size: pageSize,
      });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchVtsSystemAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) =>
          fetchVtsSystemAssets({ ...baseFilters, approvalStatus })
        ),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(
          STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])
        ),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản hệ thống VTS.'));
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
      .then((orgs) => setOrganizations(orgs))
      .catch((err) => {
        console.error('Không thể tải danh mục đơn vị:', err);
        toast.error('Không thể tải danh mục đơn vị.');
      });

    void fetchVtsSystemOptions()
      .then((vtsList) => setVtsSystems(vtsList))
      .catch((err) => {
        console.error('Không thể tải danh mục hệ thống VTS:', err);
      });
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    form.resetFields();
    form.setFieldsValue({ status: 'MANAGED' });
    setAttachments([]);
  }, [form]);

  const openEdit = useCallback(
    (record: VtsSystemAsset) => {
      if (!isAssetRecordEditable(record.approvalStatus)) {
        toast.warning('Hồ sơ đang ở trạng thái không được phép chỉnh sửa.');
        return;
      }
      setSelected(record);
      setDrawerMode('edit');
      form.setFieldsValue({
        ...record,
        constructionYear: record.constructionYear
          ? dayjs(String(record.constructionYear))
          : undefined,
        useDate: record.useDate ? dayjs(record.useDate) : undefined,
        declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
        depreciationStartDate: record.depreciationStartDate
          ? dayjs(record.depreciationStartDate)
          : undefined,
        depreciationEndDate: record.depreciationEndDate
          ? dayjs(record.depreciationEndDate)
          : undefined,
        attachmentName: record.attachmentName,
      });
      if (record.attachmentName) {
        const names = record.attachmentName
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean);
        const initialAtts: InfrastructureAttachmentItem[] = names.map((name, i) => ({
          id: `att-${i}`,
          fileName: name,
          fileSize: 1024 * 1024,
          uploadedByName:
            record.updatedByName || record.submittedByName || currentUser?.fullName || 'Hệ thống',
          uploadedDate: record.updatedAt
            ? dayjs(record.updatedAt).toISOString()
            : dayjs().toISOString(),
        }));
        setAttachments(initialAtts);
        Promise.all(
          names.map(async (name, i) => {
            try {
              const url = await getAttachmentPreviewUrl(name, {
                assetCode: record.assetCode,
                assetName: record.assetName,
              });
              return { id: `att-${i}`, url };
            } catch {
              return { id: `att-${i}`, url: undefined };
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
    },
    [currentUser?.fullName, form]
  );

  const openDetail = useCallback(async (record: VtsSystemAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exploitData, increaseData, decreaseData] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id, page: 0, size: 50 }),
        fetchAssetIncreaseList({ assetId: record.id, page: 0, size: 50 }),
        fetchAssetDecreaseList({ assetId: record.id, page: 0, size: 50 }),
      ]);
      setExploitationRows(exploitData.content);
      setIncreaseRows(increaseData.content);
      setDecreaseRows(decreaseData.content);
    } catch {
      setExploitationRows([]);
      setIncreaseRows([]);
      setDecreaseRows([]);
    }
  }, []);

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
    const parsed = dayjs(val as any);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined;
  };

  const saveAsset = async (approvalStatus: string) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(approvalStatus);

      const payload: VtsSystemAssetPayload = {
        ...values,
        approvalStatus,
        status: values.status || 'MANAGED',
        constructionYear: toYearNumber(values.constructionYear),
        useDate: toDateString(values.useDate),
        declarationDate: toDateString(values.declarationDate),
        depreciationStartDate: toDateString(values.depreciationStartDate),
        depreciationEndDate: toDateString(values.depreciationEndDate),
        attachmentName:
          attachments.length > 0 ? attachments.map((a) => a.fileName).join(', ') : undefined,
      };

      const cleanPayload: Record<string, any> = { ...payload };
      const excludeKeys = [
        'id',
        'parentOrgUnitName',
        'orgUnitName',
        'usingOrgUnitName',
        'vtsSystemCode',
        'vtsSystemName',
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

      if (drawerMode === 'edit' && selected) {
        await updateVtsSystemAsset(selected.id, cleanPayload as VtsSystemAssetPayload);
        toast.success(
          approvalStatus === 'APPROVED'
            ? 'Đã cập nhật và phê duyệt tài sản hệ thống VTS thành công'
            : 'Đã cập nhật tài sản hệ thống VTS thành công'
        );
      } else {
        await createVtsSystemAsset(cleanPayload as VtsSystemAssetPayload);
        toast.success(
          approvalStatus === 'APPROVED'
            ? 'Đã tạo mới và phê duyệt tài sản hệ thống VTS thành công'
            : approvalStatus === 'PENDING_APPROVAL'
              ? 'Đã tạo và gửi phê duyệt tài sản hệ thống VTS thành công'
              : 'Đã lưu tạm tài sản hệ thống VTS thành công'
        );
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
        toast.error(getErrorMessage(cause, 'Không thể lưu tài sản hệ thống VTS.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await deleteVtsSystemAsset(deleteTarget.id);
      toast.success('Đã xóa tài sản hệ thống VTS thành công');
      setDeleteTarget(undefined);
      void loadData();
    } catch (cause: unknown) {
      toast.error(getErrorMessage(cause, 'Không thể xóa tài sản hệ thống VTS.'));
    } finally {
      setSaving(false);
    }
  };

  const handleOperationSubmit = async () => {
    if (!operationMode || !selected) return;
    try {
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
          assetCategory: selected.assetName,
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
      options: ASSET_CONDITIONS.map((value) => ({ value, label: value })),
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
      key: 'vtsSystemId',
      label: 'Mã hệ thống VTS',
      type: 'select',
      placeholder: 'Chọn hệ thống VTS',
      options: vtsSystems.map((item) => ({
        value: item.id,
        label: `${item.code} - ${item.name}`,
      })),
      isAdvanced: true,
    },
    {
      key: 'assetType',
      label: 'Loại tài sản',
      type: 'select',
      placeholder: 'Chọn loại tài sản',
      options: VTS_ASSET_TYPES.map((v) => ({ value: v, label: v })),
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
  ], [organizations, vtsSystems]);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    const range = draftFilters.updatedRange as [Dayjs | null, Dayjs | null] | undefined;
    const trimmedCode = draftFilters.assetCode?.trim() || undefined;
    const trimmedName = draftFilters.assetName?.trim() || undefined;
    setDraftFilters((prev) => ({
      ...prev,
      assetCode: trimmedCode,
      assetName: trimmedName,
    }));
    setFilters({
      ...draftFilters,
      assetCode: trimmedCode,
      assetName: trimmedName,
      updatedFrom: range?.[0]?.format('YYYY-MM-DD'),
      updatedTo: range?.[1]?.format('YYYY-MM-DD'),
    });
  }, [draftFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({});
    setFilters({});
    setPage(1);
  }, []);

  const tableOptions = useMemo<TableOption<VtsSystemAsset>>(() => ({
    dataKey: 'id',
    mainColumns: [
      {
        title: 'TÊN/MÃ TÀI SẢN',
        dataIndex: 'assetName',
        type: TableColumnType.TwoLine,
        subField: 'assetCode',
        width: 240,
        fixed: 'left',
        allowSort: true,
        onClick: (record) => void openDetail(record),
      },
      {
        title: 'ĐƠN VỊ QUẢN LÝ',
        dataIndex: 'orgUnitId',
        type: TableColumnType.Text,
        width: 240,
        bold: true,
        allowSort: true,
        render: (v) => (
          <span style={{ fontWeight: fontWeightBold }}>
            {orgName.get(v as string) || '—'}
          </span>
        ),
      },
      {
        title: 'ĐƠN VỊ SỬ DỤNG',
        dataIndex: 'usingOrgUnitId',
        type: TableColumnType.Text,
        width: 240,
        allowSort: true,
        render: (v) => orgName.get(v as string) || '—',
      },
      {
        title: 'MÃ HỆ THỐNG VTS',
        dataIndex: 'vtsSystemId',
        type: TableColumnType.Text,
        width: 190,
        allowSort: true,
        render: (v, r) => vtsSystemMap.get(v as string)?.code || r.vtsSystemCode || '—',
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 180,
        allowSort: true,
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
        width: 200,
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
    actions: (record: VtsSystemAsset) => [
      {
        key: 'detail',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />,
        onClick: () => void openDetail(record),
      },
      ...(isAssetRecordEditable(record.approvalStatus)
        ? [
            {
              key: 'edit',
              label: 'Chỉnh sửa',
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
      {
        key: 'history',
        label: 'Lịch sử thay đổi',
        icon: <HistoryOutlined />,
        onClick: () => void openHistory(record),
      },
      {
        key: 'delete',
        label: 'Xóa',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => setDeleteTarget(record),
      },
    ],
  }), [openDetail, openEdit, operationForm, openHistory, orgName, vtsSystemMap]);

  const headerActions: ScreenHeaderAction[] = useMemo(
    () => [
      {
        key: 'create',
        label: 'Thêm mới',
        icon: <PlusOutlined />,
        variant: 'primary',
        onClick: openCreate,
      },
    ],
    [openCreate]
  );

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
        className="vts-asset-page-wrapper"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        <style>{`
          .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

          .vts-asset-page-wrapper,
          .vts-asset-page-wrapper .ant-table,
          .vts-asset-page-wrapper .ant-table-cell,
          .vts-asset-page-wrapper .ant-table-thead > tr > th,
          .vts-asset-page-wrapper .ant-table-tbody > tr > td,
          .vts-asset-page-wrapper .ant-input,
          .vts-asset-page-wrapper .ant-select,
          .vts-asset-page-wrapper .ant-select-selection-item,
          .vts-asset-page-wrapper .ant-select-item-option-content,
          .vts-asset-page-wrapper .ant-picker,
          .vts-asset-page-wrapper .ant-picker-input > input,
          .vts-asset-page-wrapper .ant-btn,
          .vts-asset-page-wrapper .ant-pagination,
          .vts-asset-page-wrapper .ant-pagination-item,
          .vts-asset-page-wrapper .ant-pagination-total-text,
          .vts-asset-page-wrapper .ant-breadcrumb,
          .vts-asset-page-wrapper .ant-form-item-label > label {
            font-size: 13.5px !important;
          }
        `}</style>

        <ScreenHeader
          title="Tài sản hệ thống VTS"
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản hệ thống VTS' },
          ]}
          actions={headerActions}
        />

        <FilterTableLayout
          hideFilterToggle
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

        <VtsSystemAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          vtsSystems={vtsSystems}
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

        <VtsSystemAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          vtsSystemMap={vtsSystemMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        <VtsSystemAssetOperationForm
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
          onSubmit={handleOperationSubmit}
        />

        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          targetName={deleteTarget?.assetName}
          confirmLoading={saving}
          onCancel={() => setDeleteTarget(undefined)}
          onConfirm={handleDelete}
        />

        {/* ── History Drawer ────────────────────────────────────────── */}
        <AppDrawer
          width="min(880px, 96vw)"
          rootClassName="vts-asset-drawer-scope"
          className="vts-asset-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  {historyTarget
                    ? `Lịch sử thay đổi — ${historyTarget.assetName || historyTarget.assetCode || 'Tài sản VTS'}`
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
              renderVtsHistoryTimeline(filteredHistoryRecords)
            )}
          </div>
        </AppDrawer>
      </div>
    </ThemeTokenProvider>
  );
}
