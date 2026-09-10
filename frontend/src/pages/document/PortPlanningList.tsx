import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, DatePicker, Descriptions, Form, Input, InputNumber, Row, Select, Tabs } from 'antd';
import type { FormInstance } from 'antd';
import {
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  LineChartOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import api from '../../services/api';
import {
  fetchPortPlanningList,
  fetchPortPlanningById,
  createQuyHoach,
  updateQuyHoach,
  uploadPortPlanningAttachment,
  deletePortPlanningAttachment,
} from '../../services/document/api';
import type {
  QuyHoachBenCangResponse,
  QuyHoachBenCangCreateRequest,
  PortPlanningCargoForecast,
  PortPlanningCategoryItem,
  PlanningFileItem,
  PlanningGroup,
} from '../../services/document/types';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { FilterOrgUnitTreeSelect, FormOrgUnitTreeSelect } from '../../components/org-unit';
import { organizationService, type Organization } from '../../services/organizationService';
import { colors } from '../../theme';
import EmptyState from '../../components/EmptyState';
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { DataTable, FilterTableLayout, ScreenHeader } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import toast, { modal } from '../../components/ToastNotification';
import {
  actionPrimary,
  fontSizeMd,
  fontWeightBold,
  fontWeightMedium,
  inputStyle,
  outlineButtonStyle,
  primaryButtonStyle,
  radiusPill,
  radiusMd,
  readonlyInputStyle,
  selectStyle,
  spaceFormField,
  spaceSm,
  spaceXs,
  statusAttention,
  statusCritical,
  statusDraft,
  statusOperational,
  textSecondary,
  borderDefault,
  getSidebarRangePickerProps,
} from '../../tokens';
import {
  DRAWER_TABLE_SCROLL_Y,
  drawerFooterStyle,
  drawerFormScrollStyle,
  drawerTabBarStyle,
  drawerTitleStyle,
  getDatePickerProps,
  labelProps,
} from '../../themetokenchk';

/** Trạng thái quy hoạch (PlanningStatus — D6): tên enum + nhãn tiếng Việt. */
const PLANNING_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  EFFECTIVE: 'Hiện hành',
  REPLACED: 'Đã thay thế',
  HISTORY: 'Lịch sử',
};

const PLANNING_STATUS_COLORS: Record<string, string> = {
  DRAFT: statusDraft,
  EFFECTIVE: statusOperational,
  REPLACED: statusAttention,
  HISTORY: statusCritical,
};

/** Nhóm quy hoạch (PortPlanningGroup — D7 FINAL): 2 giá trị cố định. */
const PLANNING_GROUP_LABELS: Record<string, string> = {
  SEAPORT: 'Cảng biển',
  DRY_PORT: 'Cảng cạn',
};

/** Giai đoạn danh mục quy hoạch chi tiết (giá trị code; SA chốt tại design plan §4.1 — cần xác nhận với backend khi tích hợp). */
const PLANNING_PHASE_OPTIONS = [
  { value: 'HIEN_TRANG', label: 'Hiện trạng' },
  { value: 'SAU_QUY_HOACH', label: 'Sau quy hoạch' },
];

/** Phân loại cảng/bến/cầu — nhãn hiển thị từ mã loại (không phải danh sách giá trị cố định cho nghiệp vụ). */
const PORT_CLASSIFICATION_LABELS: Record<string, string> = {
  CB: 'Cảng biển',
  BC: 'Bến cảng',
  CC: 'Cầu cảng',
};

/** Các endpoint master data đã có sẵn (module cảng biển) — picker lưu UUID bản ghi, không hardcode danh sách. */
const MASTER_DATA_ENDPOINTS: Record<string, string> = {
  SEAPORT: '/v1/ports',
  DRY_PORT: '/v1/dry-ports',
  CB: '/v1/ports',
  BC: '/v1/berths',
  CC: '/v1/piers',
};

const PAGE_SIZE = 20;

const errorText = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error)
    return String((error as { message?: unknown }).message || fallback);
  return fallback;
};

const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—');

function renderPill(text: string, color: string): React.ReactNode {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spaceXs,
        padding: `2px ${spaceSm}px`,
        border: `1px solid ${color}40`,
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        background: `${color}15`,
        color,
      }}
    >
      {text}
    </span>
  );
}

interface MasterRecord {
  id: string;
  name: string;
  code?: string;
}

/** Đọc danh sách bản ghi master (cảng biển / cảng cạn / bến cảng / cầu cảng) từ endpoint đã có của module cảng biển. */
async function fetchMasterRecords(kind: string): Promise<MasterRecord[]> {
  const endpoint = MASTER_DATA_ENDPOINTS[kind];
  if (!endpoint) return [];
  try {
    const res = await api.get(`${endpoint}?page=0&size=200`);
    const raw = res?.data?.data;
    const rows: unknown[] = Array.isArray(raw) ? raw : raw?.content ?? raw?.results ?? [];
    return rows.map((r) => {
      const item = (r ?? {}) as Record<string, unknown>;
      return {
        id: String(item.id ?? ''),
        name: String(
          item.name ??
            item.portName ??
            item.berthName ??
            item.pierName ??
            item.dryPortName ??
            item.dry_port_name ??
            '—',
        ),
        code: item.code !== undefined ? String(item.code) : undefined,
      };
    });
  } catch {
    return [];
  }
}

const num = (v?: number | null): number => (v === undefined || v === null ? 0 : Number(v));

function CargoRowTotals({
  containerMin,
  containerMax,
  generalCargoMin,
  generalCargoMax,
  liquidMin,
  liquidMax,
}: {
  containerMin?: number;
  containerMax?: number;
  generalCargoMin?: number;
  generalCargoMax?: number;
  liquidMin?: number;
  liquidMax?: number;
}) {
  const totalMin = num(containerMin) + num(generalCargoMin) + num(liquidMin);
  const totalMax = num(containerMax) + num(generalCargoMax) + num(liquidMax);
  return (
    <span style={{ display: 'inline-flex', gap: spaceSm, alignItems: 'center' }}>
      <InputNumber
        disabled
        value={totalMin}
        style={{ width: 110, borderRadius: radiusPill }}
        placeholder="Tối thiểu"
      />
      <InputNumber
        disabled
        value={totalMax}
        style={{ width: 110, borderRadius: radiusPill }}
        placeholder="Tối đa"
      />
    </span>
  );
}

const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

export default function PortPlanningList() {
  const hasPermission = usePermissionStore((s: PermissionState) => s.hasPermission);
  const canRead = hasPermission('portplanning:read') || hasPermission('document:read');
  const canCreate = hasPermission('portplanning:create') || hasPermission('document:create');
  const canUpdate = hasPermission('portplanning:update') || hasPermission('document:update');

  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<QuyHoachBenCangResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [orgUnitFilter, setOrgUnitFilter] = useState<string | undefined>();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        setOrganizations(resp.data || []);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    })();
  }, []);
  const [groupFilter, setGroupFilter] = useState<string | undefined>();
  const [seaportGroupFilter, setSeaportGroupFilter] = useState<string | undefined>();
  const [decisionRange, setDecisionRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [updatedRange, setUpdatedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const [drawerMode, setDrawerMode] = useState<'view' | 'create' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<QuyHoachBenCangResponse | null>(null);
  const [detail, setDetail] = useState<QuyHoachBenCangResponse | null>(null);

  // Dữ liệu master data cho picker (chỉ tải khi mở drawer).
  const cargoWatcher = Form.useWatch(['cargoForecasts', 0], form) as
    | { containerMin?: number; containerMax?: number; generalCargoMin?: number; generalCargoMax?: number; liquidMin?: number; liquidMax?: number }
    | undefined;
  const [masterOptions, setMasterOptions] = useState<Record<string, MasterRecord[]>>({});

  const loadMasterData = useCallback(async () => {
    if (Object.keys(masterOptions).length > 0) return;
    const [ports, berths, piers, dryPorts] = await Promise.all([
      fetchMasterRecords('SEAPORT'),
      fetchMasterRecords('BC'),
      fetchMasterRecords('CC'),
      fetchMasterRecords('DRY_PORT'),
    ]);
    setMasterOptions({ SEAPORT: ports, DRY_PORT: dryPorts, CB: ports, BC: berths, CC: piers });
  }, [masterOptions]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setIsError(false);
    try {
      const response = await fetchPortPlanningList({
        page: page - 1,
        size: pageSize,
        keyword: keyword.trim() || undefined,
        orgUnitId: orgUnitFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        decisionFrom: decisionRange?.[0] ? decisionRange[0].format('YYYY-MM-DD') : undefined,
        decisionTo: decisionRange?.[1] ? decisionRange[1].format('YYYY-MM-DD') : undefined,
      });
      let items = response.content || [];
      if (seaportGroupFilter) {
        items = items.filter((item) => item.seaportGroup === seaportGroupFilter);
      }
      setDataSource(items);
      setTotal(response.totalElements || 0);
      setStatusCounts(response.statusCounts || {});
    } catch (error: unknown) {
      setIsError(true);
      toast.error(errorText(error, 'Không thể tải danh sách hồ sơ quy hoạch'));
    } finally {
      setLoading(false);
    }
  }, [decisionRange, keyword, orgUnitFilter, page, pageSize, seaportGroupFilter, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const statusTabs = useMemo(() => {
    const activeStatuses = ['DRAFT', 'EFFECTIVE', 'REPLACED', 'HISTORY'];
    const showCounts = statusFilter === 'ALL';
    return [
      { key: 'ALL', label: 'Tất cả', count: showCounts ? total : 0, active: statusFilter === 'ALL', color: actionPrimary },
      ...activeStatuses.map((key) => ({
        key,
        label: PLANNING_STATUS_LABELS[key] || key,
        count: showCounts ? statusCounts[key] || 0 : 0,
        active: statusFilter === key,
        color: PLANNING_STATUS_COLORS[key],
      })),
    ];
  }, [statusCounts, statusFilter, total]);

  const [formTabKey, setFormTabKey] = useState('general');
  const [uploadedFiles, setUploadedFiles] = useState<InfrastructureAttachmentItem[]>([]);

  const handleAttachmentUpload = useCallback(
    async (file: File) => {
      // If we are creating a new record, we don't have an ID yet. We will just hold the file.
      // If we are editing, we can upload it immediately.
      if (editingItem?.id) {
        try {
          const res = await uploadPortPlanningAttachment(editingItem.id, file);
          const newItem: InfrastructureAttachmentItem = {
            id: res.id,
            fileName: res.fileName,
            fileSize: res.fileSize,
            fileType: res.fileType,
            uploadedByName: res.uploadedByName || 'Người dùng',
            uploadedDate: res.uploadedDate || dayjs().format('YYYY-MM-DD HH:mm'),
            filePath: res.filePath,
          };
          setUploadedFiles((prev) => [...prev, newItem]);
          toast.success('Tải lên thành công');
        } catch {
          toast.error('Tải lên thất bại');
        }
      } else {
        const newItem: InfrastructureAttachmentItem = {
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedByName: 'Người dùng',
          uploadedDate: dayjs().format('YYYY-MM-DD HH:mm'),
          file,
        };
        setUploadedFiles((prev) => [...prev, newItem]);
      }
      return false;
    },
    [editingItem],
  );

  const handleAttachmentDelete = useCallback(
    async (attachmentId: string) => {
      if (editingItem?.id && !attachmentId.startsWith('file_')) {
        try {
          await deletePortPlanningAttachment(editingItem.id, attachmentId);
          toast.success('Xóa file thành công');
        } catch {
          toast.error('Xóa file thất bại');
          return;
        }
      }
      setUploadedFiles((prev) => prev.filter((f) => f.id !== attachmentId));
    },
    [editingItem],
  );

  const handleAttachmentDownload = useCallback(
    (attachmentId: string, name: string) => {
      if (editingItem?.id && !attachmentId.startsWith('file_')) {
        const url = `/api/v1/port-planning/${editingItem.id}/attachments/${attachmentId}/download`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', name);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } else {
        toast.info(`File chưa được lưu trên server`);
      }
    },
    [editingItem],
  );

  const openView = useCallback(async (record: QuyHoachBenCangResponse) => {
    setEditingItem(record);
    setDetail(null);
    setDrawerMode('view');
    try {
      const full = await fetchPortPlanningById(record.id);
      setDetail(full);
    } catch {
      setDetail(record);
    }
  }, []);

  const openCreate = useCallback(() => {
    setEditingItem(null);
    setDetail(null);
    setUploadedFiles([]);
    setFormTabKey('general');
    form.resetFields();
    form.setFieldsValue({ planningGroup: 'SEAPORT', status: 'DRAFT' });
    setDrawerMode('create');
    void loadMasterData();
  }, [form, loadMasterData]);

  const openEdit = useCallback(
    async (record: QuyHoachBenCangResponse) => {
      setEditingItem(record);
      setDetail(null);
      setFormTabKey('general');
      setDrawerMode('edit');
      void loadMasterData();
      let source = record;
      try {
        source = await fetchPortPlanningById(record.id);
      } catch {
        // Fallback: dùng bản ghi từ danh sách.
      }
      setDetail(source);
      setUploadedFiles(
        (source.planningFiles || []).map((f) => ({
          id: f.id || f.fileName || `file_${Math.random().toString(36).slice(2, 7)}`,
          fileName: f.fileName || '',
          fileSize: f.fileSize,
          fileType: f.fileType,
          uploadedByName: f.uploadedByName || f.uploadedBy || 'Người dùng',
          uploadedDate: f.uploadedDate || f.uploadedAt || dayjs().format('YYYY-MM-DD HH:mm'),
          filePath: f.filePath,
        })),
      );
      form.setFieldsValue({
        orgUnitId: source.orgUnitId,
        decisionNumber: source.decisionNumber,
        decisionDate: toDate(source.decisionDate),
        planningGroup: source.planningGroup || 'SEAPORT',
        seaportId: source.seaportId,
        seaportGroup: source.seaportGroup,
        dryPortId: source.dryPortId,
        planToYear: source.planToYear ? dayjs(String(source.planToYear), 'YYYY') : null,
        projectName: source.projectName || source.decisionNumber || '',
        planContent: source.planContent,
        landWaterDemand: source.landWaterDemand,
        capitalDemand: source.capitalDemand,
        implementationSolution: source.implementationSolution,
        priorityProjects: source.priorityProjects,
        implementationOrg: source.implementationOrg,
        status: source.status,
        cargoForecasts: source.cargoForecasts || [],
        planningCategoryCurrent: (() => {
          const curCat = (source.planningCategories || []).find((c) => c.phase === 'HIEN_TRANG') || {};
          const futCat = (source.planningCategories || []).find((c) => c.phase === 'SAU_QUY_HOACH') || {};
          return {
            ...futCat,
            ...curCat,
            portCategory: curCat.portCategory || futCat.portCategory,
            portName: curCat.portName || futCat.portName,
            exploitationFunction: curCat.exploitationFunction || futCat.exploitationFunction,
            classification: curCat.classification || futCat.classification,
            note: curCat.note || futCat.note,
          };
        })(),
        planningCategoryFuture: (source.planningCategories || []).find((c) => c.phase === 'SAU_QUY_HOACH') || {},
        files: source.planningFiles || [],
      });
    },
    [form, loadMasterData],
  );

  const closeDrawer = useCallback(() => {
    setDrawerMode(null);
    setEditingItem(null);
    setDetail(null);
    setUploadedFiles([]);
    form.resetFields();
  }, [form]);

  const buildPayload = useCallback((values: Record<string, unknown>): QuyHoachBenCangCreateRequest => {
    const text = (v: unknown): string | undefined =>
      v === undefined || v === null ? undefined : String(v).trim();
    const dateOnly = (v: unknown): string | undefined =>
      v ? dayjs(v as Dayjs | string).format('YYYY-MM-DD') : undefined;
    const toYear = (v: unknown): number | undefined =>
      v ? Number(dayjs(v as Dayjs | string).year()) : undefined;
    const toNumber = (v: unknown): number | undefined =>
      v === undefined || v === null || v === '' ? undefined : Number(v);

    const cargoForecasts: PortPlanningCargoForecast[] = (
      (values.cargoForecasts as unknown[]) || []
    ).map((item) => {
      const row = item as Record<string, unknown>;
      const containerMin = toNumber(row.containerMin) ?? 0;
      const containerMax = toNumber(row.containerMax) ?? 0;
      const generalCargoMin = toNumber(row.generalCargoMin) ?? 0;
      const generalCargoMax = toNumber(row.generalCargoMax) ?? 0;
      const liquidMin = toNumber(row.liquidMin) ?? 0;
      const liquidMax = toNumber(row.liquidMax) ?? 0;
      return {
        classification: text(row.classification),
        portId: text(row.portId),
        portName: text(row.portName),
        containerMin,
        containerMax,
        generalCargoMin,
        generalCargoMax,
        liquidMin,
        liquidMax,
        totalMin: containerMin + generalCargoMin + liquidMin,
        totalMax: containerMax + generalCargoMax + liquidMax,
        note: text(row.note),
      };
    });

    const cur = (values.planningCategoryCurrent as Record<string, unknown>) || {};
    const fut = (values.planningCategoryFuture as Record<string, unknown>) || {};
    const planningCategories: PortPlanningCategoryItem[] = [
      { phase: 'HIEN_TRANG', portCategory: text(cur.portCategory), portName: text(cur.portName), exploitationFunction: text(cur.exploitationFunction), classification: text(cur.classification), berthCount: toNumber(cur.berthCount), length: toNumber(cur.length), shipSize: text(cur.shipSize), note: text(cur.note) },
      { phase: 'SAU_QUY_HOACH', portCategory: text(cur.portCategory), portName: text(cur.portName), exploitationFunction: text(cur.exploitationFunction), classification: text(cur.classification), berthCount: toNumber(fut.berthCount), berthCountHigh: toNumber(fut.berthCountHigh), length: toNumber(fut.length), lengthHigh: toNumber(fut.lengthHigh), shipSize: text(fut.shipSize), capacity: toNumber(fut.capacity), capacityHigh: toNumber(fut.capacityHigh), landArea: toNumber(fut.landArea), waterArea: toNumber(fut.waterArea), note: text(cur.note) },
    ];

    const projectName = text(values.projectName) || text(values.decisionNumber) || '';
    return {
      projectName,
      orgUnitId: text(values.orgUnitId) || (undefined as any),
      decisionNumber: text(values.decisionNumber) ?? '',
      decisionDate: dateOnly(values.decisionDate),
      planningGroup: (text(values.planningGroup) as PlanningGroup) || 'SEAPORT',
      seaportId: text(values.seaportId),
      seaportGroup: text(values.seaportGroup),
      dryPortId: text(values.dryPortId),
      planToYear: toYear(values.planToYear),
      planContent: text(values.planContent),
      landWaterDemand: text(values.landWaterDemand),
      capitalDemand: text(values.capitalDemand),
      implementationSolution: text(values.implementationSolution),
      priorityProjects: text(values.priorityProjects),
      implementationOrg: text(values.implementationOrg),
      status: (text(values.status) as QuyHoachBenCangCreateRequest['status']) || 'DRAFT',
      cargoForecasts,
      planningCategories,
      fileUploadIds: uploadedFiles.map((f) => f.fileName || '').filter(Boolean),
    };
  }, [uploadedFiles]);

  const submitForm = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = buildPayload(values);
      if (editingItem) {
        await updateQuyHoach(editingItem.id, payload);
        toast.success('Cập nhật hồ sơ quy hoạch thành công');
      } else {
        const res: any = await createQuyHoach(payload);
        const newId = res?.id ?? res?.data?.id;
        if (newId) {
          // Upload new files
          for (const f of uploadedFiles) {
            if (f.file) {
              await uploadPortPlanningAttachment(newId, f.file).catch(() => {});
            }
          }
        }
        toast.success('Đã tạo hồ sơ quy hoạch thành công');
      }
      closeDrawer();
      await loadData();
    } catch (error: unknown) {
      if (!(typeof error === 'object' && error !== null && 'errorFields' in error)) {
        toast.error(errorText(error, 'Có lỗi xảy ra khi lưu hồ sơ quy hoạch'));
      }
    } finally {
      setSubmitting(false);
    }
  }, [buildPayload, closeDrawer, editingItem, form, loadData, uploadedFiles]);

  const groupColumn = useCallback(
    (_: string, record: QuyHoachBenCangResponse) =>
      PLANNING_GROUP_LABELS[record.planningGroup || ''] ||
      record.planningGroup ||
      '—',
    [],
  );

  const targetPortName = useCallback(
    (_value: string, record: QuyHoachBenCangResponse) => record.seaportName || record.dryPortName || '—',
    [],
  );

  const columns: DataTableColumn[] = useMemo(
    () => [
      {
        key: 'decisionNumber',
        dataIndex: 'decisionNumber',
        label: 'Số quyết định quy hoạch',
        width: 220,
        type: 'mono',
        ellipsis: true,
        cellTitle: (record: QuyHoachBenCangResponse) => record.decisionNumber || '',
        render: (v: string) => v || '—',
      },
      {
        key: 'decisionDate',
        dataIndex: 'decisionDate',
        label: 'Ngày quyết định quy hoạch',
        width: 180,
        render: (v: string) => fmtDate(v),
      },
      { key: 'planningGroup', dataIndex: 'planningGroup', label: 'Nhóm', width: 130, render: groupColumn },
      {
        key: 'seaportGroup',
        dataIndex: 'seaportGroup',
        label: 'Nhóm cảng biển',
        width: 150,
        ellipsis: true,
        render: (v: string) => v || '—',
      },
      {
        key: 'targetPort',
        dataIndex: 'seaportName',
        label: 'Cảng biển / cảng cạn quy hoạch',
        width: 260,
        ellipsis: true,
        render: targetPortName,
      },
      {
        key: 'orgUnitId',
        dataIndex: 'orgUnitName',
        label: 'Đơn vị quản lý',
        width: 220,
        ellipsis: true,
        cellTitle: (record: QuyHoachBenCangResponse) => record.orgUnitName || '',
        render: (v: string) => v || '—',
      },
      {
        key: 'status',
        dataIndex: 'status',
        label: 'Trạng thái',
        width: 150,
        render: (v: string) =>
          renderPill(PLANNING_STATUS_LABELS[v] || v || '—', PLANNING_STATUS_COLORS[v] || statusDraft),
      },
      {
        key: 'updatedDate',
        dataIndex: 'updatedDate',
        label: 'Ngày cập nhật',
        width: 160,
        render: (v: string) => fmtDateTime(v),
      },
    ],
    [groupColumn, targetPortName],
  );

  const rowActions = useCallback(
    (record: QuyHoachBenCangResponse) => {
      const actions: {
        key: string;
        label: string;
        icon?: React.ReactNode;
        danger?: boolean;
        disabled?: boolean;
        onClick: () => void;
      }[] = [];
      if (canRead) {
        actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => void openView(record) });
      }
      if (canUpdate) {
        actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => void openEdit(record) });
      }
      return actions;
    },
    [canRead, canUpdate, openEdit, openView],
  );

  const cargoColumns: DataTableColumn[] = [
    { key: 'classification', dataIndex: 'classification', label: 'Phân loại', width: 130, render: (v: string) => PORT_CLASSIFICATION_LABELS[v] || v || '—' },
    { key: 'portName', dataIndex: 'portName', label: 'Cảng, bến cảng, cầu cảng', width: 230, ellipsis: true, render: (v: string) => v || '—' },
    { key: 'container', label: 'Container (tấn)', width: 180, render: (_: unknown, record: PortPlanningCargoForecast) => `${fmtNumber(record.containerMin)} – ${fmtNumber(record.containerMax)}` },
    { key: 'general', label: 'Tổng hợp, rời (tấn)', width: 200, render: (_: unknown, record: PortPlanningCargoForecast) => `${fmtNumber(record.generalCargoMin)} – ${fmtNumber(record.generalCargoMax)}` },
    { key: 'liquid', label: 'Lỏng, khí (tấn)', width: 180, render: (_: unknown, record: PortPlanningCargoForecast) => `${fmtNumber(record.liquidMin)} – ${fmtNumber(record.liquidMax)}` },
    { key: 'total', label: 'Tổng cộng (tấn)', width: 190, render: (_: unknown, record: PortPlanningCargoForecast) => `${fmtNumber(record.totalMin)} – ${fmtNumber(record.totalMax)}` },
    { key: 'note', dataIndex: 'note', label: 'Ghi chú', width: 180, ellipsis: true, render: (v: string) => v || '—' },
  ];

  const categoryColumns: DataTableColumn[] = [
    { key: 'phase', dataIndex: 'phase', label: 'Giai đoạn', width: 140, render: (v: string) => PLANNING_PHASE_OPTIONS.find((o) => o.value === v)?.label || v || '—' },
    { key: 'classification', dataIndex: 'classification', label: 'Phân loại', width: 140, render: (v: string) => PORT_CLASSIFICATION_LABELS[v] || v || '—' },
    { key: 'portName', dataIndex: 'portName', label: 'Cảng, bến cảng, cầu cảng', width: 240, ellipsis: true, render: (v: string) => v || '—' },
    { key: 'exploitationFunction', dataIndex: 'exploitationFunction', label: 'Công năng khai thác', width: 200, ellipsis: true, render: (v: string) => v || '—' },
    {
      key: 'berthCount',
      dataIndex: 'berthCount',
      label: 'Số lượng cầu cảng',
      width: 150,
      render: (_: unknown, record: PortPlanningCategoryItem) =>
        record.phase === 'SAU_QUY_HOACH' && record.berthCountHigh !== undefined && record.berthCountHigh !== null
          ? `${record.berthCount ?? '—'} – ${record.berthCountHigh}`
          : (record.berthCount ?? '—'),
    },
    {
      key: 'length',
      dataIndex: 'length',
      label: 'Chiều dài (m)',
      width: 150,
      render: (_: unknown, record: PortPlanningCategoryItem) =>
        record.phase === 'SAU_QUY_HOACH' && record.lengthHigh !== undefined && record.lengthHigh !== null
          ? `${fmtNumber(record.length)} – ${fmtNumber(record.lengthHigh)}`
          : fmtNumber(record.length),
    },
    { key: 'shipSize', dataIndex: 'shipSize', label: 'Cỡ tàu (tấn)', width: 130, render: (v?: string) => v || '—' },
    {
      key: 'capacity',
      dataIndex: 'capacity',
      label: 'Công suất (Triệu tấn)',
      width: 170,
      render: (_: unknown, record: PortPlanningCategoryItem) =>
        record.phase === 'SAU_QUY_HOACH' && record.capacityHigh !== undefined && record.capacityHigh !== null
          ? `${fmtNumber(record.capacity)} – ${fmtNumber(record.capacityHigh)}`
          : fmtNumber(record.capacity),
    },
    { key: 'landArea', dataIndex: 'landArea', label: 'Diện tích đất (ha)', width: 150, render: (v?: number) => fmtNumber(v) },
    { key: 'waterArea', dataIndex: 'waterArea', label: 'Diện tích nước (ha)', width: 150, render: (v?: number) => fmtNumber(v) },
    { key: 'note', dataIndex: 'note', label: 'Ghi chú', width: 180, ellipsis: true, render: (v: string) => v || '—' },
  ];

  const filterContent = (
    <>
      {/* ── 3 trường cơ bản luôn hiển thị (chuẩn Recipe) ── */}
      <div style={{ marginBottom: 12, marginTop: spaceSm }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Đơn vị quản lý
        </div>
          <FilterOrgUnitTreeSelect value={orgUnitFilter} onChange={setOrgUnitFilter} organizations={organizations} placeholder="Chọn đơn vị quản lý" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Số quyết định quy hoạch
        </div>
        <Input
          placeholder="Nhập số quyết định..."
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          style={{ borderRadius: radiusPill, height: 40 }}
          allowClear
          onPressEnter={() => setPage(1)}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Nhóm
        </div>
        <Select
          value={groupFilter}
          onChange={(value) => {
            setGroupFilter(value);
            setPage(1);
          }}
          placeholder="Chọn nhóm (Cảng biển / Cảng cạn)"
          allowClear
          options={Object.entries(PLANNING_GROUP_LABELS).map(([value, label]) => ({ value, label }))}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>

      {/* ── Các trường nâng cao (hiển thị khi bấm nút Lọc nâng cao) ── */}
      {filterCollapsed && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Nhóm cảng biển
            </div>
            <Select
              value={seaportGroupFilter}
              onChange={(val) => {
                setSeaportGroupFilter(val);
                setPage(1);
              }}
              placeholder="Chọn nhóm cảng biển..."
              allowClear
              options={['Nhóm 1', 'Nhóm 2', 'Nhóm 3', 'Nhóm 4', 'Nhóm 5'].map((g) => ({ value: g, label: g }))}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>

          {groupFilter !== 'DRY_PORT' && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Cảng biển quy hoạch
              </div>
              <Select
                placeholder="Chọn cảng biển quy hoạch..."
                allowClear
                showSearch
                filterOption={false}
                onSearch={() => undefined}
                options={masterOptions.SEAPORT?.map((r) => ({
                  value: r.id,
                  label: r.code ? `${r.name} (${r.code})` : r.name,
                }))}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              />
            </div>
          )}

          {groupFilter === 'DRY_PORT' && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Cảng cạn quy hoạch
              </div>
              <Select
                placeholder="Chọn cảng cạn quy hoạch..."
                allowClear
                options={masterOptions.DRY_PORT?.map((r) => ({
                  value: r.id,
                  label: r.code ? `${r.name} (${r.code})` : r.name,
                }))}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Khoảng ngày quyết định
            </div>
            <DatePicker.RangePicker
              {...getSidebarRangePickerProps()}
              value={decisionRange}
              onChange={(value) => setDecisionRange(value as [Dayjs | null, Dayjs | null] | null)}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              format="DD/MM/YYYY"
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Khoảng ngày cập nhật
            </div>
            <DatePicker.RangePicker
              {...getSidebarRangePickerProps()}
              value={updatedRange}
              onChange={(value) => setUpdatedRange(value as [Dayjs | null, Dayjs | null] | null)}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
              format="DD/MM/YYYY"
            />
          </div>
        </>
      )}
    </>
  );

  const viewRecord = detail || editingItem;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý quy hoạch & vận hành' }, { label: 'Quản lý thông tin quy hoạch bến cảng' }]}
        actions={
          canCreate
            ? [
                {
                  key: 'create',
                  label: 'Thêm mới',
                  icon: <PlusOutlined />,
                  variant: 'primary',
                  onClick: openCreate,
                },
              ]
            : undefined
        }
      />
      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        statusTabs={statusTabs}
        onStatusTabChange={(key) => {
          setStatusFilter(key);
          setPage(1);
        }}
        filterContent={filterContent}
        onFilterApply={() => {
          setKeyword(keywordInput.trim());
          setPage(1);
        }}
        onFilterReset={() => {
          setKeywordInput('');
          setKeyword('');
          setOrgUnitFilter(undefined);
          setStatusFilter('ALL');
          setGroupFilter(undefined);
          setSeaportGroupFilter(undefined);
          setDecisionRange(null);
          setUpdatedRange(null);
          setPage(1);
        }}
        loading={loading}
        error={isError}
        errorMessage="Không thể tải danh sách hồ sơ quy hoạch"
        onRetry={loadData}
      >
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          rowActions={rowActions}
          emptyState={<EmptyState description="Chưa có hồ sơ quy hoạch nào" />}
        />
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </FilterTableLayout>

      <AppDrawer
        width="min(920px, 96vw)"
        rootClassName="port-planning-drawer-scope"
        className="port-planning-drawer-scope"
        title={
          <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
            {drawerMode === 'view'
              ? 'Chi tiết thông tin quy hoạch bến cảng'
              : drawerMode === 'edit'
                ? 'Cập nhật thông tin quy hoạch bến cảng'
                : 'Thêm mới thông tin quy hoạch bến cảng'}
          </span>
        }
        open={drawerMode !== null}
        onClose={closeDrawer}
        destroyOnClose
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '16px 24px 32px', overflowY: 'auto' },
        }}
        footer={
          drawerMode !== 'view' ? (
            <div style={drawerFooterStyle}>
              <Button style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }} onClick={closeDrawer}>
                Hủy
              </Button>
              <Button
                type="primary"
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
                loading={submitting}
                onClick={() => void submitForm()}
              >
                {drawerMode === 'edit' ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          ) : null
        }
      >
        {drawerMode === 'view' && viewRecord ? (
          <Tabs
            items={[
              {
                key: 'general',
                label: 'Thông tin chung',
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>
                        Thông tin cơ bản
                      </div>
                      <Descriptions
                        column={2}
                        size="small"
                        bordered
                        labelStyle={{ width: 220, fontWeight: fontWeightMedium, color: textSecondary }}
                        items={[
                          { key: 'decisionNumber', label: 'Số quyết định quy hoạch', children: viewRecord.decisionNumber || '—' },
                          { key: 'decisionDate', label: 'Ngày quyết định quy hoạch', children: fmtDate(viewRecord.decisionDate) },
                          {
                            key: 'orgUnit',
                            label: 'Đơn vị quản lý',
                            children: viewRecord.orgUnitName || viewRecord.orgUnitId || '—',
                          },
                          {
                            key: 'target',
                            label: 'Cảng biển quy hoạch',
                            children:
                              viewRecord.seaportName ||
                              viewRecord.seaportId ||
                              '—',
                          },
                        ]}
                      />
                    </div>
                    <div>
                      <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>
                        Dự báo hàng hóa thông qua cảng
                      </div>
                      <DataTable
                        dense
                        columns={cargoColumns}
                        dataSource={viewRecord.cargoForecasts || []}
                        rowKey={(record: PortPlanningCargoForecast) => record.id || String(Math.random())}
                        scroll={{ y: 220 }}
                        emptyState={<EmptyState description="Chưa có dự báo hàng hóa" />}
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: 'planning',
                label: 'Quy hoạch',
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>
                        Kế hoạch quy hoạch
                      </div>
                      <Descriptions
                        column={2}
                        size="small"
                        bordered
                        labelStyle={{ width: 220, fontWeight: fontWeightMedium, color: textSecondary }}
                        items={[
                          { key: 'projectName', label: 'Mục tiêu quy hoạch', span: 2, children: viewRecord.projectName || '—' },
                          { key: 'planToYear', label: 'Dự báo quy hoạch đến năm', span: 2, children: viewRecord.planToYear ? String(viewRecord.planToYear) : '—' },
                          { key: 'planContent', label: 'Nội dung quy hoạch', span: 2, children: viewRecord.planContent || '—' },
                          { key: 'landWaterDemand', label: 'Nhu cầu sử dụng đất và mặt nước', children: viewRecord.landWaterDemand || '—' },
                          { key: 'capitalDemand', label: 'Nhu cầu vốn đầu tư', children: viewRecord.capitalDemand || '—' },
                          { key: 'implementationSolution', label: 'Giải pháp thực hiện quy hoạch', children: viewRecord.implementationSolution || '—' },
                          { key: 'priorityProjects', label: 'Dự án ưu tiên đầu tư', children: viewRecord.priorityProjects || '—' },
                          { key: 'implementationOrg', label: 'Tổ chức thực hiện quy hoạch', span: 2, children: viewRecord.implementationOrg || '—' },
                        ]}
                      />
                    </div>
                    <div>
                      <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>
                        Danh mục quy hoạch chi tiết
                      </div>
                      <DataTable
                        dense
                        columns={categoryColumns}
                        dataSource={viewRecord.planningCategories || []}
                        rowKey={(record: PortPlanningCategoryItem) => record.id || String(Math.random())}
                        scroll={{ y: 220 }}
                        emptyState={<EmptyState description="Chưa có danh mục quy hoạch chi tiết" />}
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: 'files',
                label: `File đính kèm (${(viewRecord.planningFiles || []).length})`,
                children: (
                  <InfrastructureAttachmentTab
                    attachments={(viewRecord.planningFiles || []).map((f) => ({
                      id: f.id || f.fileName || `file_${Math.random().toString(36).slice(2, 7)}`,
                      fileName: f.fileName || '',
                      fileSize: f.fileSize,
                      uploadedByName: f.uploadedByName || f.uploadedBy || '—',
                      uploadedDate: f.uploadedDate || f.uploadedAt || '—',
                      filePath: f.filePath,
                    }))}
                    readonly={true}
                    onDownload={handleAttachmentDownload}
                  />
                ),
              },
              {
                key: 'tracking',
                label: 'Xử lý và theo dõi',
                children: (
                  <Descriptions
                    column={2}
                    size="small"
                    bordered
                    labelStyle={{ width: 220, fontWeight: fontWeightMedium, color: textSecondary }}
                    items={[
                      {
                        key: 'updated',
                        label: 'Người cập nhật',
                        children:
                          viewRecord.updatedByName ||
                          viewRecord.updatedBy ||
                          '—',
                      },
                      { key: 'updatedDate', label: 'Ngày cập nhật', children: fmtDateTime(viewRecord.updatedDate) },
                      {
                        key: 'created',
                        label: 'Người tạo',
                        children: viewRecord.createdByName || viewRecord.createdBy || '—',
                      },
                      { key: 'createdDate', label: 'Ngày tạo', children: fmtDateTime(viewRecord.createdDate) },
                      {
                        key: 'status',
                        label: 'Trạng thái',
                        span: 2,
                        children: renderPill(
                          PLANNING_STATUS_LABELS[viewRecord.status || ''] || viewRecord.status || '—',
                          PLANNING_STATUS_COLORS[viewRecord.status || ''] || statusDraft,
                        ),
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        ) : (
          <Form form={form} layout="vertical">
            <Tabs
              activeKey={formTabKey}
              onChange={setFormTabKey}
              tabBarStyle={drawerTabBarStyle}
              items={[
                {
                  key: 'general',
                  label: (
                    <span>
                      <FileTextOutlined style={{ marginRight: 6 }} />
                      Thông tin chung
                    </span>
                  ),
                  children: (
                    <div style={drawerFormScrollStyle}>
                      {/* Khối 1: Thông tin cơ bản (STT 1-6) */}
                      <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <FileTextOutlined style={{ color: colors.sidebarBg }} />
                            <span>Thông tin cơ bản</span>
                          </div>
                        </div>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item
                              name="orgUnitId"
                              {...labelProps('Đơn vị quản lý')}
                              style={{ marginBottom: spaceFormField }}
                              rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                            >
                              <FormOrgUnitTreeSelect organizations={organizations} placeholder="Chọn đơn vị quản lý (bắt buộc)" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="seaportId"
                              {...labelProps('Cảng biển quy hoạch')}
                              style={{ marginBottom: spaceFormField }}
                              rules={[{ required: true, message: 'Vui lòng chọn cảng biển quy hoạch' }]}
                            >
                              <Select
                                placeholder="Chọn cảng biển quy hoạch..."
                                showSearch
                                optionFilterProp="label"
                                options={masterOptions.SEAPORT?.map((r) => ({
                                  value: r.id,
                                  label: r.code ? `${r.name} (${r.code})` : r.name,
                                }))}
                                style={{ ...selectStyle, width: '100%' }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item
                              name="decisionNumber"
                              {...labelProps('Số quyết định quy hoạch')}
                              style={{ marginBottom: spaceFormField }}
                              rules={[{ required: true, message: 'Vui lòng nhập số quyết định quy hoạch' }]}
                            >
                              <Input placeholder="Nhập số quyết định quy hoạch..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="decisionDate"
                              {...labelProps('Ngày quyết định quy hoạch')}
                              style={{ marginBottom: spaceFormField }}
                              rules={[{ required: true, message: 'Vui lòng chọn ngày quyết định quy hoạch' }]}
                            >
                              <DatePicker
                                {...getDatePickerProps()}
                                format="DD/MM/YYYY"
                                placeholder="Chọn ngày quyết định"
                                style={{ ...inputStyle, width: '100%' }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        {drawerMode === 'edit' && editingItem ? (
                          <Row gutter={[24, 0]}>
                            <Col span={12}>
                              <Form.Item {...labelProps('Mã hồ sơ')} style={{ marginBottom: spaceFormField }}>
                                <Input disabled value={editingItem.projectName || editingItem.id} style={inputStyle} />
                              </Form.Item>
                            </Col>
                          </Row>
                        ) : null}
                      </div>

                      {/* Khối 2: Dự báo hàng hóa thông qua cảng (STT 7-13) */}
                      <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <BarChartOutlined style={{ color: colors.sidebarBg }} />
                            <span>Dự báo hàng hóa thông qua cảng</span>
                          </div>
                        </div>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name={['cargoForecasts', 0, 'classification']} {...labelProps('Phân loại')} style={{ marginBottom: spaceFormField }}>
                              <Select
                                placeholder="Chọn phân loại (CB/BC/CC)..."
                                options={Object.entries(PORT_CLASSIFICATION_LABELS).map(([value, label]) => ({ value, label }))}
                                style={{ ...selectStyle, width: '100%' }}
                                allowClear
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item {...labelProps('Cảng, bến cảng, cầu cảng')} style={{ marginBottom: spaceFormField }}>
                              <MasterRecordPicker form={form} name={0} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <NumberPairField field={{ name: 0 }} name="containerMin" label="Container tối thiểu (tấn)" placeholder="Tối thiểu" />
                          <NumberPairField field={{ name: 0 }} name="containerMax" label="Container tối đa (tấn)" placeholder="Tối đa" />
                        </Row>
                        <Row gutter={[24, 0]}>
                          <NumberPairField field={{ name: 0 }} name="generalCargoMin" label="Tổng hợp, rời tối thiểu (tấn)" placeholder="Tối thiểu" />
                          <NumberPairField field={{ name: 0 }} name="generalCargoMax" label="Tổng hợp, rời tối đa (tấn)" placeholder="Tối đa" />
                        </Row>
                        <Row gutter={[24, 0]}>
                          <NumberPairField field={{ name: 0 }} name="liquidMin" label="Lỏng, khí tối thiểu (tấn)" placeholder="Tối thiểu" />
                          <NumberPairField field={{ name: 0 }} name="liquidMax" label="Lỏng, khí tối đa (tấn)" placeholder="Tối đa" />
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item {...labelProps('Tổng cộng tối thiểu (tấn)')} style={{ marginBottom: spaceFormField }}>
                              <InputNumber
                                disabled
                                value={num(cargoWatcher?.containerMin) + num(cargoWatcher?.generalCargoMin) + num(cargoWatcher?.liquidMin)}
                                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                                placeholder="0"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item {...labelProps('Tổng cộng tối đa (tấn)')} style={{ marginBottom: spaceFormField }}>
                              <InputNumber
                                disabled
                                value={num(cargoWatcher?.containerMax) + num(cargoWatcher?.generalCargoMax) + num(cargoWatcher?.liquidMax)}
                                style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                                placeholder="0"
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={24}>
                            <Form.Item name={['cargoForecasts', 0, 'note']} {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                              <Input placeholder="Ghi chú (dự báo hàng hóa)..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'planning',
                  label: (
                    <span>
                      <SlidersOutlined style={{ marginRight: 6 }} />
                      Quy hoạch
                    </span>
                  ),
                  children: (
                    <div style={drawerFormScrollStyle}>
                      {/* Khối 1: Kế hoạch quy hoạch (STT 14-21) */}
                      <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <SlidersOutlined style={{ color: colors.sidebarBg }} />
                            <span>Kế hoạch quy hoạch</span>
                          </div>
                        </div>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item
                              name="projectName"
                              {...labelProps('Mục tiêu quy hoạch')}
                              style={{ marginBottom: spaceFormField }}
                              rules={[{ required: true, message: 'Vui lòng nhập mục tiêu quy hoạch' }]}
                            >
                              <Input placeholder="Nhập mục tiêu quy hoạch..." style={inputStyle} maxLength={200} showCount />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="planToYear"
                              {...labelProps('Dự báo quy hoạch đến năm')}
                              style={{ marginBottom: spaceFormField }}
                              rules={[{ required: true, message: 'Vui lòng chọn năm' }]}
                            >
                              <DatePicker
                                {...getDatePickerProps()}
                                picker="year"
                                placeholder="Chọn năm"
                                style={{ ...inputStyle, width: '100%' }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item
                          name="planContent"
                          {...labelProps('Nội dung quy hoạch')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input.TextArea
                            rows={3}
                            showCount
                            maxLength={2000}
                            placeholder="Mô tả nội dung quy hoạch..."
                            style={{ borderRadius: radiusMd }}
                          />
                        </Form.Item>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item
                              name="landWaterDemand"
                              {...labelProps('Nhu cầu sử dụng đất và mặt nước')}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input.TextArea
                                rows={2}
                                showCount
                                maxLength={1000}
                                placeholder="Nhu cầu sử dụng đất và mặt nước..."
                                style={{ borderRadius: radiusMd }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="capitalDemand"
                              {...labelProps('Nhu cầu vốn đầu tư')}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input.TextArea
                                rows={2}
                                showCount
                                maxLength={1000}
                                placeholder="Nhu cầu vốn đầu tư..."
                                style={{ borderRadius: radiusMd }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item
                          name="implementationSolution"
                          {...labelProps('Giải pháp thực hiện quy hoạch')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input.TextArea
                            rows={2}
                            showCount
                            maxLength={2000}
                            placeholder="Giải pháp thực hiện quy hoạch..."
                            style={{ borderRadius: radiusMd }}
                          />
                        </Form.Item>
                        <Form.Item
                          name="priorityProjects"
                          {...labelProps('Dự án ưu tiên đầu tư')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input.TextArea
                            rows={2}
                            showCount
                            maxLength={2000}
                            placeholder="Dự án ưu tiên đầu tư..."
                            style={{ borderRadius: radiusMd }}
                          />
                        </Form.Item>
                        <Form.Item
                          name="implementationOrg"
                          {...labelProps('Tổ chức thực hiện quy hoạch')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input.TextArea
                            rows={2}
                            showCount
                            maxLength={2000}
                            placeholder="Tổ chức thực hiện quy hoạch..."
                            style={{ borderRadius: radiusMd }}
                          />
                        </Form.Item>
                      </div>

                      {/* Khối 2A: Danh mục quy hoạch chi tiết (5 trường chung — Excel rows 22-26) */}
                      <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <AppstoreOutlined style={{ color: colors.sidebarBg }} />
                            <span>Danh mục quy hoạch chi tiết</span>
                          </div>
                        </div>
                        <Row gutter={[24, 0]}>
                          <PcField ns="planningCategoryCurrent" name="portCategory" label="Phân loại (CB/BC/CC)" kind="text" placeholder="Cảng biển / Bến cảng / Cầu cảng" />
                          <PcField ns="planningCategoryCurrent" name="portName" label="Cảng, bến, cầu cụ thể" kind="text" placeholder="Tên cảng / bến cảng / cầu cảng..." />
                        </Row>
                        <Row gutter={[24, 0]}>
                          <PcField ns="planningCategoryCurrent" name="exploitationFunction" label="Công năng khai thác" kind="text" placeholder="Công năng khai thác..." />
                          <PcField ns="planningCategoryCurrent" name="classification" label="Phân loại" kind="text" placeholder="Phân loại..." />
                        </Row>
                        <PcField ns="planningCategoryCurrent" name="note" label="Ghi chú" kind="textarea" placeholder="Ghi chú..." fullRow />
                      </div>

                      {/* Khối 2B: Danh mục quy hoạch chi tiết — Hiện trạng (3 trường — Excel rows 27-29) */}
                      <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <AppstoreOutlined style={{ color: colors.sidebarBg }} />
                            <span>Danh mục quy hoạch chi tiết — Hiện trạng</span>
                          </div>
                        </div>
                        <Row gutter={[24, 0]}>
                          <PcField ns="planningCategoryCurrent" name="berthCount" label="Số lượng cầu cảng" kind="number" span={8} placeholder="0" />
                          <PcField ns="planningCategoryCurrent" name="length" label="Chiều dài (m)" kind="number" precision={2} span={8} placeholder="Chiều dài" />
                          <PcField ns="planningCategoryCurrent" name="shipSize" label="Cỡ tàu (tấn)" kind="text" span={8} placeholder="Cỡ tàu..." />
                        </Row>
                      </div>

                      {/* Khối 2C: Danh mục quy hoạch chi tiết — Sau quy hoạch (6 trường, 3 DoubleInput — Excel rows 30-35) */}
                      <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <AppstoreOutlined style={{ color: colors.sidebarBg }} />
                            <span>Danh mục quy hoạch chi tiết — Sau quy hoạch</span>
                          </div>
                        </div>
                        <Row gutter={[24, 0]}>
                          <PcField ns="planningCategoryFuture" name="berthCount" label="Số cầu cảng — KB thấp" kind="number" placeholder="0" />
                          <PcField ns="planningCategoryFuture" name="berthCountHigh" label="Số cầu cảng — KB cao" kind="number" placeholder="0" />
                        </Row>
                        <Row gutter={[24, 0]}>
                          <PcField ns="planningCategoryFuture" name="length" label="Chiều dài (m) — KB thấp" kind="number" precision={2} placeholder="Chiều dài" />
                          <PcField ns="planningCategoryFuture" name="lengthHigh" label="Chiều dài (m) — KB cao" kind="number" precision={2} placeholder="Chiều dài" />
                        </Row>
                        <Row gutter={[24, 0]}>
                          <PcField ns="planningCategoryFuture" name="capacity" label="Dự kiến công suất (Triệu tấn) — KB thấp" kind="number" precision={2} placeholder="Công suất" />
                          <PcField ns="planningCategoryFuture" name="capacityHigh" label="Dự kiến công suất (Triệu tấn) — KB cao" kind="number" precision={2} placeholder="Công suất" />
                        </Row>
                        <Row gutter={[24, 0]}>
                          <PcField ns="planningCategoryFuture" name="shipSize" label="Dự kiến cỡ tàu (tấn)" kind="text" span={8} placeholder="Cỡ tàu..." />
                          <PcField ns="planningCategoryFuture" name="landArea" label="Diện tích vùng đất (ha)" kind="number" precision={2} span={8} placeholder="Diện tích đất" />
                          <PcField ns="planningCategoryFuture" name="waterArea" label="Diện tích vùng nước (ha)" kind="number" precision={2} span={8} placeholder="Diện tích nước" />
                        </Row>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'files',
                  label: (
                    <span>
                      <PaperClipOutlined style={{ marginRight: 6 }} />
                      File đính kèm ({uploadedFiles.length})
                    </span>
                  ),
                  children: (
                    <div style={drawerFormScrollStyle}>
                      <InfrastructureAttachmentTab
                        attachments={uploadedFiles}
                        readonly={false}
                        onUpload={handleAttachmentUpload}
                        onDelete={handleAttachmentDelete}
                        onDownload={handleAttachmentDownload}
                      />
                    </div>
                  ),
                },
                {
                  key: 'tracking',
                  label: (
                    <span>
                      <AuditOutlined style={{ marginRight: 6 }} />
                      Xử lý và theo dõi
                    </span>
                  ),
                  children: (
                    <div style={drawerFormScrollStyle}>
                      <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <AuditOutlined style={{ color: colors.sidebarBg }} />
                            <span>Thông tin xử lý và theo dõi</span>
                          </div>
                        </div>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item {...labelProps('Người cập nhật')} style={{ marginBottom: spaceFormField }}>
                              <Input disabled value={editingItem?.updatedByName || editingItem?.updatedBy || 'admin'} style={readonlyInputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item {...labelProps('Ngày cập nhật')} style={{ marginBottom: spaceFormField }}>
                              <Input disabled value={editingItem?.updatedDate ? fmtDateTime(editingItem.updatedDate) : fmtDateTime(new Date().toISOString())} style={readonlyInputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item {...labelProps('Trạng thái hồ sơ')} style={{ marginBottom: spaceFormField }}>
                              <Input disabled value={PLANNING_STATUS_LABELS[editingItem?.status || 'DRAFT'] || 'Lưu tạm'} style={readonlyInputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item {...labelProps('Người tạo')} style={{ marginBottom: spaceFormField }}>
                              <Input disabled value={editingItem?.createdByName || editingItem?.createdBy || 'admin'} style={readonlyInputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Form>
        )}
      </AppDrawer>
    </div>
  );
}

function toDate(v?: string | null): Dayjs | null {
  return v ? dayjs(v) : null;
}

function fmtNumber(v?: number | null): string {
  return v === undefined || v === null || Number.isNaN(Number(v)) ? '—' : String(Number(v));
}

function CargoForecastRow({
  index,
  field,
  remove,
  form,
}: {
  index: number;
  field: { key: number; name: number };
  remove: (index: number) => void;
  form: FormInstance;
}) {
  const rowWatcher = Form.useWatch(['cargoForecasts', field.name], form) as
    | { containerMin?: number; containerMax?: number; generalCargoMin?: number; generalCargoMax?: number; liquidMin?: number; liquidMax?: number }
    | undefined;
  return (
    <div style={sectionBoxStyle}>
      <div style={sectionHeaderStyle}>
        <div style={sectionTitleStyle}>
          <LineChartOutlined style={{ color: colors.sidebarBg }} />
          <span>Dự báo hàng hóa #{index + 1}</span>
        </div>
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => remove(field.name)}
          title="Xóa dòng"
        />
      </div>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name={[field.name, 'classification']} {...labelProps('Phân loại')} style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Phân loại (CB/BC/CC)..." style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item {...labelProps('Cảng, bến cảng, cầu cảng')} style={{ marginBottom: spaceFormField }}>
            <MasterRecordPicker form={form} name={field.name} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[24, 0]}>
        <NumberPairField field={field} name="containerMin" label="Container tối thiểu (tấn)" placeholder="Tối thiểu" />
        <NumberPairField field={field} name="containerMax" label="Container tối đa (tấn)" placeholder="Tối đa" />
      </Row>
      <Row gutter={[24, 0]}>
        <NumberPairField field={field} name="generalCargoMin" label="Tổng hợp, rời tối thiểu (tấn)" placeholder="Tối thiểu" />
        <NumberPairField field={field} name="generalCargoMax" label="Tổng hợp, rời tối đa (tấn)" placeholder="Tối đa" />
      </Row>
      <Row gutter={[24, 0]}>
        <NumberPairField field={field} name="liquidMin" label="Lỏng, khí tối thiểu (tấn)" placeholder="Tối thiểu" />
        <NumberPairField field={field} name="liquidMax" label="Lỏng, khí tối đa (tấn)" placeholder="Tối đa" />
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name={[field.name, 'note']} {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Ghi chú (dự báo hàng hóa)..." style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs, marginBottom: spaceFormField }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tổng cộng (tấn):</span>
            <CargoRowTotals
              containerMin={rowWatcher?.containerMin}
              containerMax={rowWatcher?.containerMax}
              generalCargoMin={rowWatcher?.generalCargoMin}
              generalCargoMax={rowWatcher?.generalCargoMax}
              liquidMin={rowWatcher?.liquidMin}
              liquidMax={rowWatcher?.liquidMax}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}

function NumberPairField({
  field,
  name,
  label,
  placeholder,
}: {
  field: { name: number };
  name: string;
  label: string;
  placeholder: string;
}) {
  return (
    <Col span={12}>
      <Form.Item name={[field.name, name]} {...labelProps(label)} style={{ marginBottom: spaceFormField }}>
        <InputNumber min={0} precision={2} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} placeholder={placeholder} />
      </Form.Item>
    </Col>
  );
}

/** Picker chọn cảng / bến cảng / cầu cảng từ master data của module cảng biển (lưu UUID bản ghi). */
function MasterRecordPicker({ form, name }: { form: FormInstance; name: number }) {
  const [options, setOptions] = useState<MasterRecord[]>([]);
  const classification = Form.useWatch(['cargoForecasts', name, 'classification'], form);
  const value = Form.useWatch(['cargoForecasts', name, 'portId'], form);

  useEffect(() => {
    const kind = classification || 'CB';
    void fetchMasterRecords(kind).then(setOptions);
  }, [classification]);

  return (
    <Select
      showSearch
      optionFilterProp="label"
      placeholder="Chọn cảng, bến cảng, cầu cảng..."
      value={value}
      onChange={(nextId: string) => {
        form.setFieldValue(['cargoForecasts', name, 'portId'], nextId || undefined);
        const record = options.find((o) => o.id === nextId);
        form.setFieldValue(['cargoForecasts', name, 'portName'], record?.name || '');
      }}
      style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
      options={options.map((r) => ({ value: r.id, label: r.code ? `${r.name} (${r.code})` : r.name }))}
      allowClear
    />
  );
}

function PcField(p: { ns: string; name: string; label: string; kind: 'text' | 'number' | 'textarea'; placeholder?: string; precision?: number; span?: number; fullRow?: boolean }) {
  const c = p.kind === 'number' ? <InputNumber min={0} precision={p.precision ?? 0} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} placeholder={p.placeholder} /> : p.kind === 'textarea' ? <Input.TextArea rows={2} showCount maxLength={500} placeholder={p.placeholder} style={{ borderRadius: radiusMd }} /> : <Input placeholder={p.placeholder} style={inputStyle} />;
  const it = <Form.Item name={[p.ns, p.name]} {...labelProps(p.label)} style={{ marginBottom: p.fullRow ? 0 : spaceFormField }}>{c}</Form.Item>;
  return p.fullRow ? it : <Col span={p.span ?? 12}>{it}</Col>;
}
