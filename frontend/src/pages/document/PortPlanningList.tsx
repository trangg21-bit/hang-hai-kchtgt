import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, DatePicker, Descriptions, Drawer, Form, Input, InputNumber, Row, Select, Tabs } from 'antd';
import type { FormInstance } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import api from '../../services/api';
import {
  fetchPortPlanningList,
  fetchPortPlanningById,
  createQuyHoach,
  updateQuyHoach,
  deleteQuyHoach,
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
import EmptyState from '../../components/EmptyState';
import { DataTable, FilterTableLayout, ScreenHeader } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import toast, { modal } from '../../components/ToastNotification';
import {
  actionPrimary,
  fontSizeMd,
  fontWeightBold,
  fontWeightMedium,
  fontSizeSm,
  inputStyle,
  outlineButtonStyle,
  primaryButtonStyle,
  radiusPill,
  radiusTextArea,
  selectStyle,
  spaceFormField,
  spaceLg,
  spaceMd,
  spaceSm,
  spaceXs,
  statusAttention,
  statusCritical,
  statusDraft,
  statusOperational,
  textPrimary,
  textSecondary,
  borderDefault,
  radiusSm,
  getSidebarRangePickerProps,
} from '../../tokens';
import { DRAWER_TABLE_SCROLL_Y, getDatePickerProps, labelProps } from '../../themetokenchk';

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

export default function PortPlanningList() {
  const hasPermission = usePermissionStore((s: PermissionState) => s.hasPermission);
  const canRead = hasPermission('portplanning:read') || hasPermission('document:read');
  const canCreate = hasPermission('portplanning:create') || hasPermission('document:create');
  const canUpdate = hasPermission('portplanning:update') || hasPermission('document:update');
  const canDelete = hasPermission('portplanning:delete') || hasPermission('document:delete');

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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState<string | undefined>();
  const [decisionRange, setDecisionRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [drawerMode, setDrawerMode] = useState<'view' | 'create' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<QuyHoachBenCangResponse | null>(null);
  const [detail, setDetail] = useState<QuyHoachBenCangResponse | null>(null);

  // Lựa chọn nhánh "Nếu Nhóm = Cảng biển / Cảng cạn" trên form (BR-132-01).
  const watchedGroup = Form.useWatch('planningGroup', form) as PlanningGroup | undefined;
  // Dữ liệu master data cho picker (chỉ tải khi mở drawer).
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
      setDataSource(response.content || []);
      setTotal(response.totalElements || 0);
      setStatusCounts(response.statusCounts || {});
    } catch (error: unknown) {
      setIsError(true);
      toast.error(errorText(error, 'Không thể tải danh sách hồ sơ quy hoạch'));
    } finally {
      setLoading(false);
    }
  }, [decisionRange, keyword, orgUnitFilter, page, pageSize, statusFilter]);

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
    form.resetFields();
    form.setFieldsValue({ planningGroup: 'SEAPORT', status: 'DRAFT' });
    setDrawerMode('create');
    void loadMasterData();
  }, [form, loadMasterData]);

  const openEdit = useCallback(
    async (record: QuyHoachBenCangResponse) => {
      setEditingItem(record);
      setDetail(null);
      setDrawerMode('edit');
      void loadMasterData();
      let source = record;
      try {
        source = await fetchPortPlanningById(record.id);
      } catch {
        // Fallback: dùng bản ghi từ danh sách.
      }
      setDetail(source);
      form.setFieldsValue({
        orgUnitId: source.orgUnitId,
        decisionNumber: source.decisionNumber,
        decisionDate: toDate(source.decisionDate),
        planningGroup: source.planningGroup || 'SEAPORT',
        seaportId: source.seaportId,
        seaportGroup: source.seaportGroup,
        dryPortId: source.dryPortId,
        planToYear: source.planToYear ? dayjs(String(source.planToYear), 'YYYY') : null,
        planContent: source.planContent,
        landWaterDemand: source.landWaterDemand,
        capitalDemand: source.capitalDemand,
        implementationSolution: source.implementationSolution,
        priorityProjects: source.priorityProjects,
        implementationOrg: source.implementationOrg,
        status: source.status,
        cargoForecasts: source.cargoForecasts || [],
        planningCategories: source.planningCategories || [],
        files: source.planningFiles || [],
      });
    },
    [form, loadMasterData],
  );

  const closeDrawer = useCallback(() => {
    setDrawerMode(null);
    setEditingItem(null);
    setDetail(null);
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

    const planningCategories: PortPlanningCategoryItem[] = (
      (values.planningCategories as unknown[]) || []
    ).map((item) => {
      const row = item as Record<string, unknown>;
      return {
        phase: (text(row.phase) as PortPlanningCategoryItem['phase']) || 'HIEN_TRANG',
        classification: text(row.classification),
        portId: text(row.portId),
        portName: text(row.portName),
        exploitationFunction: text(row.exploitationFunction),
        berthCount: toNumber(row.berthCount),
        length: toNumber(row.length),
        shipSize: text(row.shipSize),
        capacity: toNumber(row.capacity),
        landArea: toNumber(row.landArea),
        waterArea: toNumber(row.waterArea),
        note: text(row.note),
      };
    });

    const files: PlanningFileItem[] = ((values.files as unknown[]) || []).map((item) => {
      const row = item as { fileName?: string };
      return { fileName: text(row.fileName) };
    });

    return {
      orgUnitId: text(values.orgUnitId) ?? '',
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
      fileUploadIds: files.map((f) => f.fileName || '').filter(Boolean),
    };
  }, []);

  const submitForm = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = buildPayload(values);
      if (editingItem) {
        await updateQuyHoach(editingItem.id, payload);
        toast.success('Cập nhật hồ sơ quy hoạch thành công');
      } else {
        await createQuyHoach(payload);
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
  }, [buildPayload, closeDrawer, editingItem, form, loadData]);

  const confirmDelete = useCallback(
    (record: QuyHoachBenCangResponse) => {
      modal.confirm({
        title: 'Xóa hồ sơ quy hoạch',
        content: `Bạn có chắc chắn muốn xóa hồ sơ quy hoạch "${record.decisionNumber || record.id}"?`,
        okText: 'Xóa',
        cancelText: 'Hủy',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deleteQuyHoach(record.id);
            toast.success('Xóa hồ sơ quy hoạch thành công');
            await loadData();
          } catch (error: unknown) {
            toast.error(errorText(error, 'Có lỗi khi xóa hồ sơ quy hoạch'));
          }
        },
      });
    },
    [loadData],
  );

  const groupColumn = useCallback(
    (_: string, record: QuyHoachBenCangResponse) =>
      PLANNING_GROUP_LABELS[record.planningGroup || ''] ||
      record.planningGroup ||
      '—',
    [],
  );

  const targetPortName = useCallback(
    (record: QuyHoachBenCangResponse) => record.seaportName || record.dryPortName || '—',
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
      if (canDelete) {
        actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => confirmDelete(record) });
      }
      return actions;
    },
    [canDelete, canRead, canUpdate, confirmDelete, openEdit, openView],
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
    { key: 'berthCount', dataIndex: 'berthCount', label: 'Số lượng cầu cảng', width: 140, render: (v?: number) => v ?? '—' },
    { key: 'length', dataIndex: 'length', label: 'Chiều dài (m)', width: 130, render: (v?: number) => fmtNumber(v) },
    { key: 'shipSize', dataIndex: 'shipSize', label: 'Cỡ tàu (tấn)', width: 130, render: (v?: string) => v || '—' },
    { key: 'capacity', dataIndex: 'capacity', label: 'Công suất (Triệu tấn)', width: 170, render: (v?: number) => fmtNumber(v) },
    { key: 'landArea', dataIndex: 'landArea', label: 'Diện tích đất (ha)', width: 150, render: (v?: number) => fmtNumber(v) },
    { key: 'waterArea', dataIndex: 'waterArea', label: 'Diện tích nước (ha)', width: 150, render: (v?: number) => fmtNumber(v) },
    { key: 'note', dataIndex: 'note', label: 'Ghi chú', width: 180, ellipsis: true, render: (v: string) => v || '—' },
  ];

  const fileColumns: DataTableColumn[] = [
    { key: 'fileName', dataIndex: 'fileName', label: 'Tên tệp', width: 420, ellipsis: true, render: (v: string) => v || '—' },
  ];

  const filterContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceMd }}>
      <Form.Item label="Từ khóa" style={{ marginBottom: spaceFormField }}>
        <Input
          placeholder="Số quyết định, nội dung quy hoạch..."
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          style={inputStyle}
          allowClear
          onPressEnter={() => setPage(1)}
        />
      </Form.Item>
      <Form.Item label="Đơn vị quản lý" style={{ marginBottom: spaceFormField }}>
        <FilterOrgUnitTreeSelect value={orgUnitFilter} onChange={setOrgUnitFilter} placeholder="Chọn đơn vị quản lý" />
      </Form.Item>
      <Form.Item label="Nhóm" style={{ marginBottom: spaceFormField }}>
        <Select
          value={groupFilter}
          onChange={(value) => {
            setGroupFilter(value);
            setPage(1);
          }}
          placeholder="Chọn nhóm (Cảng biển / Cảng cạn)"
          allowClear
          options={Object.entries(PLANNING_GROUP_LABELS).map(([value, label]) => ({ value, label }))}
          style={{ ...selectStyle, width: '100%' }}
        />
      </Form.Item>
      {groupFilter === 'SEAPORT' && (
        <Form.Item label="Cảng biển quy hoạch" style={{ marginBottom: spaceFormField }}>
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
            style={{ ...selectStyle, width: '100%' }}
          />
        </Form.Item>
      )}
      {groupFilter === 'DRY_PORT' && (
        <Form.Item label="Cảng cạn quy hoạch" style={{ marginBottom: spaceFormField }}>
          <Select
            placeholder="Chọn cảng cạn quy hoạch..."
            allowClear
            options={masterOptions.DRY_PORT?.map((r) => ({
              value: r.id,
              label: r.code ? `${r.name} (${r.code})` : r.name,
            }))}
            style={{ ...selectStyle, width: '100%' }}
          />
        </Form.Item>
      )}
      <Form.Item label="Khoảng ngày quyết định" style={{ marginBottom: spaceFormField }}>
        <DatePicker.RangePicker
          {...getSidebarRangePickerProps()}
          value={decisionRange}
          onChange={(value) => setDecisionRange(value as [Dayjs | null, Dayjs | null] | null)}
          style={{ ...selectStyle, width: '100%' }}
          format="DD/MM/YYYY"
        />
      </Form.Item>
    </div>
  );

  const viewRecord = detail || editingItem;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản lý văn bản & thông tin nghiệp vụ' }, { label: 'Quản lý quy hoạch bến cảng' }]}
        actions={
          canCreate
            ? [
                {
                  key: 'create',
                  label: 'Tạo mới quy hoạch',
                  icon: <PlusOutlined />,
                  variant: 'primary',
                  onClick: openCreate,
                },
              ]
            : undefined
        }
      />
      <FilterTableLayout
        hideFilterToggle
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
          setDecisionRange(null);
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

      <Drawer
        title={drawerMode === 'view' ? 'Chi tiết hồ sơ quy hoạch' : drawerMode === 'edit' ? 'Cập nhật quy hoạch bến cảng' : 'Tạo mới quy hoạch bến cảng'}
        open={drawerMode !== null}
        onClose={closeDrawer}
        width={drawerMode === 'view' ? 1100 : 1040}
        destroyOnClose
      >
        {drawerMode === 'view' && viewRecord ? (
          <Tabs
            items={[
              {
                key: 'general',
                label: 'Thông tin chung',
                children: (
                  <div>
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
                          key: 'group',
                          label: 'Nhóm',
                          children:
                            PLANNING_GROUP_LABELS[viewRecord.planningGroup || ''] || viewRecord.planningGroup || '—',
                        },
                        {
                          key: 'target',
                          label: 'Cảng biển / cảng cạn quy hoạch',
                          span: 2,
                          children:
                            viewRecord.seaportName ||
                            viewRecord.dryPortName ||
                            viewRecord.seaportId ||
                            viewRecord.dryPortId ||
                            '—',
                        },
                        {
                          key: 'planToYear',
                          label: 'Dự báo quy hoạch đến năm',
                          children: viewRecord.planToYear ? String(viewRecord.planToYear) : '—',
                        },
                        {
                          key: 'status',
                          label: 'Trạng thái',
                          children: renderPill(
                            PLANNING_STATUS_LABELS[viewRecord.status || ''] || viewRecord.status || '—',
                            PLANNING_STATUS_COLORS[viewRecord.status || ''] || statusDraft,
                          ),
                        },
                        { key: 'planContent', label: 'Nội dung quy hoạch', span: 2, children: viewRecord.planContent || '—' },
                        { key: 'landWaterDemand', label: 'Nhu cầu sử dụng đất và mặt nước', span: 2, children: viewRecord.landWaterDemand || '—' },
                        { key: 'capitalDemand', label: 'Nhu cầu vốn đầu tư', span: 2, children: viewRecord.capitalDemand || '—' },
                        { key: 'implementationSolution', label: 'Giải pháp thực hiện quy hoạch', span: 2, children: viewRecord.implementationSolution || '—' },
                        { key: 'priorityProjects', label: 'Dự án ưu tiên đầu tư', span: 2, children: viewRecord.priorityProjects || '—' },
                        { key: 'implementationOrg', label: 'Tổ chức thực hiện quy hoạch', span: 2, children: viewRecord.implementationOrg || '—' },
                        {
                          key: 'updated',
                          label: 'Người cập nhật / Ngày cập nhật',
                          children:
                            viewRecord.updatedByName ||
                            viewRecord.updatedBy ||
                            '—',
                        },
                        { key: 'updatedDate', label: '', children: fmtDateTime(viewRecord.updatedDate) },
                      ]}
                    />
                  </div>
                ),
              },
              {
                key: 'cargo',
                label: 'Dự báo hàng hóa thông qua cảng',
                children: (
                  <DataTable
                    dense
                    columns={cargoColumns}
                    dataSource={viewRecord.cargoForecasts || []}
                    rowKey={(record: PortPlanningCargoForecast) => record.id || String(Math.random())}
                    scroll={{ y: DRAWER_TABLE_SCROLL_Y.pureTable }}
                    emptyState={<EmptyState description="Chưa có dự báo hàng hóa" />}
                  />
                ),
              },
              {
                key: 'categories',
                label: 'Danh mục quy hoạch chi tiết',
                children: (
                  <DataTable
                    dense
                    columns={categoryColumns}
                    dataSource={viewRecord.planningCategories || []}
                    rowKey={(record: PortPlanningCategoryItem) => record.id || String(Math.random())}
                    scroll={{ y: DRAWER_TABLE_SCROLL_Y.pureTable }}
                    emptyState={<EmptyState description="Chưa có danh mục quy hoạch chi tiết" />}
                  />
                ),
              },
              {
                key: 'files',
                label: 'File đính kèm',
                children: (
                  <DataTable
                    dense
                    columns={fileColumns}
                    dataSource={viewRecord.planningFiles || []}
                    rowKey={(record: PlanningFileItem) => record.id || String(Math.random())}
                    scroll={{ y: DRAWER_TABLE_SCROLL_Y.pureTable }}
                    emptyState={<EmptyState description="Chưa có file đính kèm" />}
                  />
                ),
              },
            ]}
          />
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              name="orgUnitId"
              label="Đơn vị quản lý"
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
            >
              <FormOrgUnitTreeSelect placeholder="Chọn đơn vị quản lý (bắt buộc)" />
            </Form.Item>
            <Row gutter={spaceMd}>
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
            <Row gutter={spaceMd}>
              <Col span={8}>
                <Form.Item
                  name="planningGroup"
                  {...labelProps('Nhóm')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Vui lòng chọn nhóm' }]}
                >
                  <Select
                    options={Object.entries(PLANNING_GROUP_LABELS).map(([value, label]) => ({ value, label }))}
                    placeholder="Cảng biển / Cảng cạn"
                    style={{ ...selectStyle, width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="planToYear"
                  {...labelProps('Dự báo quy hoạch đến năm')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <DatePicker
                    {...getDatePickerProps()}
                    picker="year"
                    placeholder="Chọn năm"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                {drawerMode === 'edit' && editingItem ? (
                  <Form.Item label="Mã hồ sơ" style={{ marginBottom: spaceFormField }}>
                    <Input disabled value={editingItem.projectName || editingItem.id} style={inputStyle} />
                  </Form.Item>
                ) : null}
              </Col>
            </Row>
            {watchedGroup === 'SEAPORT' && (
              <Row gutter={spaceMd}>
                <Col span={12}>
                  <Form.Item
                    name="seaportId"
                    {...labelProps('Cảng biển quy hoạch')}
                    style={{ marginBottom: spaceFormField }}
                    rules={[{ required: true, message: 'Vui lòng chọn cảng biển quy hoạch' }]}
                  >
                    <Select
                      placeholder="Chọn cảng biển quy hoạch (từ danh mục cảng biển)..."
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
                <Col span={12}>
                  <Form.Item
                    name="seaportGroup"
                    {...labelProps('Nhóm cảng biển')}
                    style={{ marginBottom: spaceFormField }}
                  >
                    <Input placeholder="Nhập nhóm cảng biển (ví dụ: Nhóm 1...)" style={inputStyle} />
                  </Form.Item>
                </Col>
              </Row>
            )}
            {watchedGroup === 'DRY_PORT' && (
              <Form.Item
                name="dryPortId"
                {...labelProps('Cảng cạn quy hoạch')}
                style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Vui lòng chọn cảng cạn quy hoạch' }]}
              >
                <Select
                  placeholder="Chọn cảng cạn quy hoạch (từ danh mục cảng cạn)..."
                  showSearch
                  optionFilterProp="label"
                  options={masterOptions.DRY_PORT?.map((r) => ({
                    value: r.id,
                    label: r.code ? `${r.name} (${r.code})` : r.name,
                  }))}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </Form.Item>
            )}
            <Form.Item name="planContent" {...labelProps('Nội dung quy hoạch')} style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={3} placeholder="Mô tả nội dung quy hoạch..." style={{ borderRadius: radiusTextArea }} />
            </Form.Item>
            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item name="landWaterDemand" {...labelProps('Nhu cầu sử dụng đất và mặt nước')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={2} placeholder="Nhu cầu sử dụng đất và mặt nước..." style={{ borderRadius: radiusTextArea }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="capitalDemand" {...labelProps('Nhu cầu vốn đầu tư')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={2} placeholder="Nhu cầu vốn đầu tư..." style={{ borderRadius: radiusTextArea }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item name="implementationSolution" {...labelProps('Giải pháp thực hiện quy hoạch')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={2} placeholder="Giải pháp thực hiện quy hoạch..." style={{ borderRadius: radiusTextArea }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="priorityProjects" {...labelProps('Dự án ưu tiên đầu tư')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={2} placeholder="Dự án ưu tiên đầu tư..." style={{ borderRadius: radiusTextArea }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="implementationOrg" {...labelProps('Tổ chức thực hiện quy hoạch')} style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={2} placeholder="Tổ chức thực hiện quy hoạch..." style={{ borderRadius: radiusTextArea }} />
            </Form.Item>

            <SectionTitle title="Dự báo hàng hóa thông qua cảng" />
            <Form.List name="cargoForecasts">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                  {fields.map((field) => (
                    <CargoForecastRow key={field.key} field={field} remove={remove} form={form} />
                  ))}
                  {fields.length === 0 && (
                    <Button type="dashed" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }} onClick={() => add({})}>
                      Thêm dòng dự báo hàng hóa
                    </Button>
                  )}
                </div>
              )}
            </Form.List>

            <SectionTitle title="Danh mục quy hoạch chi tiết (hiện trạng / sau quy hoạch)" />
            <Form.List name="planningCategories">
      {(fields, { add, remove }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
          {fields.map((field) => (
            <PlanningCategoryRow key={field.key} field={field} remove={remove} />
          ))}
          {fields.length === 0 && (
            <Button type="dashed" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }} onClick={() => add({ phase: 'HIEN_TRANG' })}>
              Thêm danh mục quy hoạch chi tiết
            </Button>
          )}
        </div>
      )}
    </Form.List>

            <SectionTitle title="File đính kèm" />
            <Form.List name="files">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                  {fields.map((field) => (
                    <Row key={field.key} gutter={spaceSm} align="middle">
                      <Col span={21}>
                        <Form.Item
                          name={[field.name, 'fileName']}
                          style={{ marginBottom: 0 }}
                          rules={[{ required: true, message: 'Nhập tên file' }]}
                        >
                          <Input placeholder="Tên file đính kèm..." style={inputStyle} />
                        </Form.Item>
                      </Col>
                      <Col span={3} style={{ textAlign: 'center' }}>
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                      </Col>
                    </Row>
                  ))}
                  {fields.length === 0 && (
                    <Button type="dashed" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }} onClick={() => add({ fileName: '' })}>
                      Thêm file đính kèm
                    </Button>
                  )}
                </div>
              )}
            </Form.List>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spaceSm, marginTop: spaceLg }}>
              <Button style={{ ...outlineButtonStyle, borderRadius: radiusPill }} onClick={closeDrawer}>
                Hủy
              </Button>
              <Button
                type="primary"
                style={{ ...primaryButtonStyle, borderRadius: radiusPill }}
                loading={submitting}
                onClick={() => void submitForm()}
              >
                {drawerMode === 'edit' ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </Form>
        )}
      </Drawer>
    </div>
  );
}

function toDate(v?: string | null): Dayjs | null {
  return v ? dayjs(v) : null;
}

function fmtNumber(v?: number | null): string {
  return v === undefined || v === null || Number.isNaN(Number(v)) ? '—' : String(Number(v));
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div
      style={{
        fontWeight: fontWeightBold,
        fontSize: fontSizeMd,
        color: textPrimary,
        margin: `${spaceMd}px 0 ${spaceSm}px`,
        padding: `${spaceXs}px ${spaceSm}px`,
        background: `${actionPrimary}0F`,
        borderRadius: radiusSm,
      }}
    >
      {title}
    </div>
  );
}

function CargoForecastRow({
  field,
  remove,
  form,
}: {
  field: { key: number; name: number };
  remove: (index: number) => void;
  form: FormInstance;
}) {
  const rowWatcher = Form.useWatch(['cargoForecasts', field.name], form) as
    | { containerMin?: number; containerMax?: number; generalCargoMin?: number; generalCargoMax?: number; liquidMin?: number; liquidMax?: number }
    | undefined;
  return (
    <div
      style={{
        border: `1px solid ${borderDefault}`,
        borderRadius: radiusSm,
        padding: spaceSm,
        display: 'flex',
        flexDirection: 'column',
        gap: spaceXs,
      }}
    >
      <Row gutter={spaceSm} align="middle">
        <Col span={7}>
          <Form.Item name={[field.name, 'classification']} style={{ marginBottom: spaceXs }}>
            <Input placeholder="Phân loại (CB/BC/CC)..." style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={15}>
          <Form.Item style={{ marginBottom: spaceXs }}>
            <MasterRecordPicker form={form} name={field.name} />
          </Form.Item>
        </Col>
        <Col span={2} style={{ textAlign: 'center' }}>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
        </Col>
      </Row>
      <Row gutter={spaceSm}>
        <NumberPairField field={field} name="containerMin" placeholder="Container tối thiểu (tấn)" />
        <NumberPairField field={field} name="containerMax" placeholder="Container tối đa (tấn)" />
        <NumberPairField field={field} name="generalCargoMin" placeholder="Tổng hợp, rời tối thiểu (tấn)" />
        <NumberPairField field={field} name="generalCargoMax" placeholder="Tổng hợp, rời tối đa (tấn)" />
        <NumberPairField field={field} name="liquidMin" placeholder="Lỏng, khí tối thiểu (tấn)" />
        <NumberPairField field={field} name="liquidMax" placeholder="Lỏng, khí tối đa (tấn)" />
      </Row>
      <Row gutter={spaceSm} align="middle">
        <Col span={18}>
          <Form.Item name={[field.name, 'note']} style={{ marginBottom: 0 }}>
            <Input placeholder="Ghi chú (dự báo hàng hóa)..." style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <div style={{ display: 'inline-flex', gap: spaceSm, alignItems: 'center' }}>
            <span style={{ color: textSecondary, fontSize: fontSizeSm }}>Tổng cộng:</span>
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

function NumberPairField({ field, name, placeholder }: { field: { name: number }; name: string; placeholder: string }) {
  return (
    <Col span={4}>
      <Form.Item name={[field.name, name]} style={{ marginBottom: spaceXs }}>
        <InputNumber min={0} precision={2} style={{ width: '100%', borderRadius: radiusPill }} placeholder={placeholder} />
      </Form.Item>
    </Col>
  );
}

/** Picker chọn cảng / bến cảng / cầu cảng từ master data của module cảng biển (lưu UUID bản ghi). */
function MasterRecordPicker({ form, name }: { form: FormInstance; name: number }) {
  const [options, setOptions] = useState<MasterRecord[]>([]);
  const [kind, setKind] = useState('CB');
  const value = Form.useWatch(['cargoForecasts', name, 'portId'], form);

  useEffect(() => {
    void fetchMasterRecords(kind).then(setOptions);
  }, [kind]);

  return (
    <div style={{ display: 'flex', gap: spaceXs, alignItems: 'center' }}>
      <Select
        value={kind}
        onChange={(next) => {
          setKind(next);
          form.setFieldValue(['cargoForecasts', name, 'portId'], undefined);
          form.setFieldValue(['cargoForecasts', name, 'portName'], '');
        }}
        style={{ width: 96, borderRadius: radiusPill }}
        options={Object.entries(PORT_CLASSIFICATION_LABELS).map(([value, label]) => ({ value, label }))}
      />
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
        style={{ ...selectStyle, width: '100%', borderRadius: radiusPill }}
        options={options.map((r) => ({ value: r.id, label: r.code ? `${r.name} (${r.code})` : r.name }))}
        allowClear
      />
    </div>
  );
}

function PlanningCategoryRow({
  field,
  remove,
}: {
  field: { key: number; name: number };
  remove: (index: number) => void;
}) {
  return (
    <div
      style={{
        border: `1px solid ${borderDefault}`,
        borderRadius: radiusSm,
        padding: spaceSm,
        display: 'flex',
        flexDirection: 'column',
        gap: spaceXs,
      }}
    >
      <Row gutter={spaceSm} align="middle">
        <Col span={3}>
          <Form.Item name={[field.name, 'phase']} style={{ marginBottom: spaceXs }} initialValue="HIEN_TRANG">
            <Select options={PLANNING_PHASE_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name={[field.name, 'classification']} style={{ marginBottom: spaceXs }}>
            <Input placeholder="Phân loại (CB/BC/CC)..." style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={[field.name, 'portName']} style={{ marginBottom: spaceXs }}>
            <Input placeholder="Cảng, bến cảng, cầu cảng..." style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={[field.name, 'exploitationFunction']} style={{ marginBottom: spaceXs }}>
            <Input placeholder="Công năng khai thác..." style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={3}>
          <Form.Item name={[field.name, 'berthCount']} style={{ marginBottom: spaceXs }}>
            <InputNumber min={0} precision={0} style={{ width: '100%', borderRadius: radiusPill }} placeholder="Số cầu cảng" />
          </Form.Item>
        </Col>
        <Col span={2} style={{ textAlign: 'center' }}>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
        </Col>
      </Row>
      <Row gutter={spaceSm}>
        <Col span={4}>
          <Form.Item name={[field.name, 'length']} style={{ marginBottom: spaceXs }}>
            <InputNumber min={0} precision={2} style={{ width: '100%', borderRadius: radiusPill }} placeholder="Chiều dài (m)" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name={[field.name, 'shipSize']} style={{ marginBottom: spaceXs }}>
            <Input placeholder="Cỡ tàu (tấn)..." style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name={[field.name, 'capacity']} style={{ marginBottom: spaceXs }}>
            <InputNumber min={0} precision={2} style={{ width: '100%', borderRadius: radiusPill }} placeholder="Công suất (Triệu tấn)" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name={[field.name, 'landArea']} style={{ marginBottom: spaceXs }}>
            <InputNumber min={0} precision={2} style={{ width: '100%', borderRadius: radiusPill }} placeholder="Diện tích đất (ha)" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name={[field.name, 'waterArea']} style={{ marginBottom: spaceXs }}>
            <InputNumber min={0} precision={2} style={{ width: '100%', borderRadius: radiusPill }} placeholder="Diện tích nước (ha)" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name={[field.name, 'note']} style={{ marginBottom: 0 }}>
            <Input placeholder="Ghi chú..." style={inputStyle} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}
