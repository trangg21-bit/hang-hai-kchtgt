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
import { DatePicker, Form, Input, Button, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
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
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import { AppDrawer } from '../../components/shared/AppDrawer';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  triggerBlobDownload,
  resolveMimeType,
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import toast from '../../components/ToastNotification';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import api from '../../services/api';
import { renderStandardHistoryCards, isBlankOrDash } from '../../utils/changeHistoryRenderer';
import {
  createAssetDecrease,
  createAssetIncrease,
  createDryPortAsset,
  createKhaiThac,
  deleteDryPortAsset,
  deleteInfraAssetAttachment,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchDryPortAssets,
  fetchInfraAssetAttachments,
  fetchKhaiThacList,
  updateDryPortAsset,
  uploadInfraAssetAttachments,
} from '../../services/assetmovement/api';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
  DryPortAsset,
  DryPortAssetFilters,
  DryPortAssetPayload,
} from '../../services/assetmovement/types';
import { organizationService, type Organization } from '../../services/organizationService';
import { dryPortCRUD } from '../../services/portService';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import {
  fontWeightBold,
  colors,
  borderDefault,
  drawerTitleStyle,
  fontSizeLg,
  fontSizeMd,
  actionPrimary,
  radiusPill,
  spaceSm,
  spaceMd,
  spaceXl,
  textTertiary,
} from '../../themetokenchk';
import { fmtInputNumber } from '../../utils/numFmt';
import DryPortAssetDetailContent from './DryPortAssetDetailContent';
import DryPortAssetForm, { type DryPortFormValues } from './DryPortAssetForm';
import DryPortAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './DryPortAssetOperationForm';

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
  assetCode: 'Mã tài sản',
  assetName: 'Tên tài sản',
  dryPortId: 'Mã cảng cạn',
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  orgUnitId: 'Đơn vị quản lý',
  usingOrgUnitId: 'Đơn vị sử dụng',
  barcode: 'Mã barcode',
  assetCondition: 'Tình trạng tài sản',
  usageStatus: 'Hiện trạng sử dụng',
  assetGroup: 'Nhóm tài sản',
  assetSubgroup: 'Phân nhóm tài sản',
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
};

const HISTORY_FIELD_ORDER = [
  'assetCode',
  'assetName',
  'dryPortId',
  'parentOrgUnitId',
  'orgUnitId',
  'usingOrgUnitId',
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
  'depreciationRate',
  'assignmentDecisionNumber',
  'depreciationStartDate',
  'depreciationMonths',
  'depreciationEndDate',
  'monthlyDepreciation',
  'originalValue',
  'accumulatedDepreciation',
  'remainingValue',
  'disposalMethod',
  'approvalStatus',
  'approvalReasonLevel1',
  'approvalReasonLevel2',
  'rejectionReason',
  'File đính kèm',
  'Tài liệu đính kèm',
  'attachments',
];

type DrawerMode = 'create' | 'edit' | 'detail';

const ASSET_CONDITIONS = ['Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được'];

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

export default function DryPortAssetList() {
  const [data, setData] = useState<DryPortAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [dryPorts, setDryPorts] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<DryPortAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<DryPortAssetFilters>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<DryPortAsset>();
  const [deleteTarget, setDeleteTarget] = useState<DryPortAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<DryPortFormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<DryPortAsset | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  const historyFieldCount = useMemo(
    () => (Array.isArray(historyRecords) ? historyRecords : []).length,
    [historyRecords],
  );

  const orgName = useMemo(() => new Map(organizations.map((item) => [item.id, item.name])), [organizations]);
  const dryPortMap = useMemo(() => new Map(dryPorts.map((item) => [item.id, item])), [dryPorts]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchDryPortAssets({
        ...filters,
        page: page - 1,
        size: pageSize,
      });
      const rows = res?.content || [];
      setData(rows);
      setTotal(res?.totalElements || 0);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchDryPortAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) => fetchDryPortAssets({ ...baseFilters, approvalStatus })),
      ]);
      setStatusCounts({
        all: all?.totalElements || 0,
        ...Object.fromEntries(STATUS_COUNT_KEYS.map((k, i) => [k, statusPages[i]?.totalElements || 0])),
      });
    } catch (e) {
      setError(getErrorMessage(e, 'Không thể tải danh sách tài sản cảng cạn'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    void organizationService.getAll().then(setOrganizations).catch(() => {});
    void dryPortCRUD.findAll({ size: 1000 }).then((res) => {
      const items = (res?.data || []).map((dp) => ({
        id: dp.id,
        name: dp.dryPortName || dp.dryPortCode,
        code: dp.dryPortCode,
      }));
      setDryPorts(items);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
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

  const handleOpenEdit = useCallback(async (record: DryPortAsset) => {
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
  }, [form]);

  const handleOpenDetail = useCallback(async (record: DryPortAsset) => {
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
      if (field === 'dryPortId') {
        const dp = dryPortMap.get(String(val));
        return dp ? (dp.code ? `${dp.code} - ${dp.name}` : dp.name) : String(val);
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
    [orgName, dryPortMap],
  );

  const openHistory = useCallback(async (record: DryPortAsset) => {
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
      if (ch.length === 0 && record.dryPortId) {
        const fallbackRes = await api.get(`/v1/dry-ports/${record.dryPortId}/history`).catch(() => null);
        const fbData = fallbackRes?.data?.data || fallbackRes?.data;
        if (Array.isArray(fbData?.changeHistory) && fbData.changeHistory.length > 0) {
          ch = fbData.changeHistory;
        } else if (Array.isArray(fbData) && fbData.length > 0) {
          ch = fbData;
        }
      }
      setHistoryRecords(ch);
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const renderDryPortHistoryTimeline = (records: any[]) => {
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
      const payload: DryPortAssetPayload = {
        ...merged,
        assetType: 'DRY_PORT',
        types: 'DRY_PORT',
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
        const created = await createDryPortAsset(payload);
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
        toast.success('Thêm mới tài sản cảng cạn thành công');
      } else if (drawerMode === 'edit' && selected) {
        await updateDryPortAsset(selected.id, payload);
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
        toast.success('Cập nhật tài sản cảng cạn thành công');
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
      await deleteDryPortAsset(deleteTarget.id);
      toast.success('Xóa tài sản cảng cạn thành công');
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
        key: 'usingOrgUnitId',
        label: 'Đơn vị sử dụng',
        type: 'treeSelect',
        organizations,
        placeholder: 'Chọn đơn vị...',
      },
      {
        key: 'dryPortId',
        label: 'Mã cảng cạn',
        type: 'select',
        placeholder: 'Chọn cảng cạn',
        options: dryPorts.map((dp) => ({
          value: dp.id,
          label: dp.code ? `${dp.code} - ${dp.name}` : dp.name,
        })),
      },
      {
        key: 'assetType',
        label: 'Loại tài sản',
        type: 'select',
        disabled: true,
        defaultValue: 'DRY_PORT',
        options: [{ value: 'DRY_PORT', label: 'Tài sản cảng cạn' }],
      },
      {
        key: 'assetCode',
        label: 'Mã tài sản',
        type: 'text',
        placeholder: 'Tìm theo mã tài sản',
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
        key: 'updatedRange',
        label: 'Ngày cập nhật',
        type: 'dateRange',
      },
    ],
    [organizations, dryPorts],
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

  const tableOptions = useMemo<TableOption<DryPortAsset>>(
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
          title: 'MÃ CẢNG CẠN',
          dataIndex: 'dryPortId',
          type: TableColumnType.Text,
          width: 190,
          allowSort: true,
          render: (v) => {
            const dp = dryPortMap.get(v as string);
            return dp ? (dp.code ? `${dp.code} - ${dp.name}` : dp.name) : '—';
          },
        },
        {
          title: 'LOẠI TÀI SẢN',
          dataIndex: 'assetType',
          type: TableColumnType.Text,
          width: 160,
          allowSort: true,
          render: () => 'Tài sản cảng cạn',
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
          title: 'CÁN BỘ PHÊ DUYỆT CẤP CỤC',
          dataIndex: 'departmentApprovedByName',
          type: TableColumnType.TwoLine,
          subField: 'departmentApprovedAt',
          width: 260,
          allowSort: true,
          sortField: 'departmentApprovedBy',
        },
      ],
      actions: (record: DryPortAsset) => {
        const isDraft = record.approvalStatus === 'DRAFT' || !record.approvalStatus;
        const isArchived = record.approvalStatus === 'ARCHIVED';

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

        const actionList = [
          {
            key: 'detail',
            label: 'Xem chi tiết',
            icon: <EyeOutlined />,
            onClick: () => void handleOpenDetail(record),
          },
          {
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <EditOutlined />,
            onClick: () => handleOpenEdit(record),
          },
          {
            key: 'history',
            label: 'Lịch sử',
            icon: <HistoryOutlined />,
            onClick: () => void openHistory(record),
          },
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
        ];

        // Nút xóa chỉ hiển thị với bản ghi có trạng thái lưu tạm (DRAFT)
        if (isDraft) {
          actionList.push({
            key: 'delete',
            label: 'Xóa',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => setDeleteTarget(record),
          });
        }

        return actionList;
      },
    }),
    [handleOpenDetail, handleOpenEdit, openHistory, operationForm, orgName, dryPortMap],
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
      <div className="dryport-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

          /* ── Cỡ chữ 13.5px chuẩn toàn màn Quản lý tài sản cảng cạn & các popup/drawer con ── */
          .dryport-page-wrapper,
          .dryport-page-wrapper .ant-table,
          .dryport-page-wrapper .ant-table-cell,
          .dryport-page-wrapper .ant-table-thead > tr > th,
          .dryport-page-wrapper .ant-table-tbody > tr > td,
          .dryport-page-wrapper .ant-input,
          .dryport-page-wrapper .ant-select,
          .dryport-page-wrapper .ant-select-selection-item,
          .dryport-page-wrapper .ant-select-item-option-content,
          .dryport-page-wrapper .ant-picker,
          .dryport-page-wrapper .ant-picker-input > input,
          .dryport-page-wrapper .ant-btn,
          .dryport-page-wrapper .ant-pagination,
          .dryport-page-wrapper .ant-pagination-item,
          .dryport-page-wrapper .ant-pagination-total-text,
          .dryport-page-wrapper .ant-breadcrumb,
          .dryport-page-wrapper .ant-form-item-label > label,
          .dryport-drawer-scope,
          .dryport-drawer-scope .ant-drawer-content,
          .dryport-drawer-scope .ant-tabs-tab,
          .dryport-drawer-scope .chk-detail-label,
          .dryport-drawer-scope .chk-detail-value,
          .dryport-drawer-scope .ant-table,
          .dryport-drawer-scope .ant-table-cell,
          .dryport-drawer-scope .ant-table-thead > tr > th,
          .dryport-drawer-scope .ant-btn,
          .dryport-drawer-scope .ant-select,
          .dryport-drawer-scope .ant-input,
          .dryport-drawer-scope .ant-form-item-label > label,
          .dryport-modal-scope,
          .dryport-modal-scope .ant-modal-content,
          .dryport-modal-scope .ant-btn,
          .dryport-modal-scope .ant-input {
            font-size: 13.5px !important;
          }

          /* ── Responsive StatusTabs ── */
          .dryport-page-wrapper div:has(> button[aria-pressed]) {
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
          .dryport-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .dryport-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .dryport-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .dryport-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .dryport-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }

          /* ── Responsive ScreenHeader co dãn đẹp khi zoom ── */
          .dryport-page-wrapper > div:first-of-type {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          /* ── Responsive Drawers ── */
          .dryport-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
        `}</style>

        <ScreenHeader
          breadcrumb={[{ label: 'Quản lý tài sản KCHT hàng hải' }, { label: 'Tài sản cảng cạn' }]}
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

        {/* ── Create / Edit Drawer (DynamicFormSidebar) ─────────────── */}
        <DryPortAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          dryPorts={dryPorts}
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
        <DryPortAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          dryPortMap={dryPortMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        {/* ── Operations Drawer (DynamicFormSidebar) ─────────────────── */}
        <DryPortAssetOperationForm
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
                    ? `Lịch sử thay đổi — ${historyTarget.assetName || historyTarget.assetCode || 'Tài sản cảng cạn'}`
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
              renderDryPortHistoryTimeline(historyRecords)
            )}
          </div>
        </AppDrawer>

        {/* ── Delete Confirmation Modal ────────────────────────────── */}
        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          onCancel={() => setDeleteTarget(undefined)}
          loading={saving}
          itemType="tài sản cảng cạn"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={handleDelete}
        />
      </div>
    </ThemeTokenProvider>
  );
}
