import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Descriptions, Drawer, Form, Input, Row, Col, Select, Tabs } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  fetchIncidentList,
  fetchIncidentById,
  createSuCo,
  updateSuCo,
  deleteSuCo,
} from '../../services/document/api';
import type {
  SuCoResponse,
  SuCoCreateRequest,
  IncidentEvolutionItem,
  IncidentHandlingItem,
  IncidentFileItem,
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
  statusNeutral,
  statusOperational,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  radiusSm,
  getSidebarRangePickerProps,
} from '../../tokens';
import { DRAWER_TABLE_SCROLL_Y, getDatePickerProps, getRangePickerProps, labelProps } from '../../themetokenchk';

/** Trạng thái xử lý sự cố (ProcessingStatus — D4): tên enum chuẩn + nhãn tiếng Việt. */
const PROCESSING_STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Đã tiếp nhận',
  PROCESSING: 'Đang xử lý',
  RESOLVED: 'Đã xử lý đang theo dõi',
  UNRESOLVED: 'Không thể xử lý',
  CLOSED: 'Đã đóng',
};

/** Dự phòng khi API trả số ORDINAL (0-4) thay vì tên enum. */
const PROCESSING_STATUS_ORDINAL_LABELS = ['Đã tiếp nhận', 'Đang xử lý', 'Đã xử lý đang theo dõi', 'Không thể xử lý', 'Đã đóng'];

const PROCESSING_STATUS_COLORS: Record<string, string> = {
  RECEIVED: statusAttention,
  PROCESSING: actionPrimary,
  RESOLVED: statusOperational,
  UNRESOLVED: statusCritical,
  CLOSED: statusDraft,
};

const PROCESSING_STATUS_ORDINAL_COLORS = [statusAttention, actionPrimary, statusOperational, statusCritical, statusDraft];

/** Trạng thái cho phép ghi nhận / cập nhật nội dung chỉ đạo xử lý (F-131: Đã xử lý đang theo dõi / Không thể xử lý / Đã đóng). */
const HANDLING_ENABLED_STATUSES = ['RESOLVED', 'UNRESOLVED', 'CLOSED'];

/** Mức độ nghiêm trọng (SeverityLevel — D5): tên enum chuẩn + nhãn tiếng Việt. */
const SEVERITY_LABELS: Record<string, string> = {
  MINOR: 'Nhẹ',
  MODERATE: 'Trung bình',
  SEVERE: 'Nghiêm trọng',
  CRITICAL: 'Cực kỳ nghiêm trọng',
};

/** Dự phòng khi API trả số ORDINAL (0-3). */
const SEVERITY_ORDINAL_LABELS = ['Nhẹ', 'Trung bình', 'Nghiêm trọng', 'Cực kỳ nghiêm trọng'];

/** Mã enum InfrastructureType (giá trị lưu VARCHAR — quy ước hiển thị dùng chung trong module M-006). */
const INFRA_TYPE_LABELS: Record<string, string> = {
  VTS_SYSTEM: 'Hệ thống VTS',
  AIS_SYSTEM: 'Hệ thống AIS',
  NAVIGATION_CHANNEL: 'Luồng hàng hải',
  PORT: 'Cảng biển',
  BERTH: 'Bến cảng',
  BUOY: 'Phao báo hiệu',
  LIGHT: 'Đèn biển',
};

const INFRA_TYPE_OPTIONS = Object.entries(INFRA_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const FILE_CATEGORY_LABELS: Record<string, string> = {
  INFO: 'Thông tin sự cố',
  RESULT: 'Kết quả xử lý',
};

const errorText = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error)
    return String((error as { message?: unknown }).message || fallback);
  return fallback;
};

const PAGE_SIZE = 20;

const toDate = (v?: string | null): Dayjs | null => (v ? dayjs(v) : null);
const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—');
const isOrdinal = (v: string): boolean => /^\d+$/.test(v);

function processingStatusLabel(value?: string | null): string {
  if (!value) return '—';
  const label =
    PROCESSING_STATUS_LABELS[value] ??
    (isOrdinal(value) ? PROCESSING_STATUS_ORDINAL_LABELS[Number(value)] : undefined);
  return label || value;
}

function processingStatusColor(value?: string | null): string {
  if (!value) return textSecondary;
  return (
    PROCESSING_STATUS_COLORS[value] ??
    (isOrdinal(value) ? PROCESSING_STATUS_ORDINAL_COLORS[Number(value)] : undefined) ??
    statusDraft
  );
}

function severityLabel(value?: string | null): string {
  if (!value) return '—';
  const label = SEVERITY_LABELS[value] ?? (isOrdinal(value) ? SEVERITY_ORDINAL_LABELS[Number(value)] : undefined);
  return label || value;
}

function infraTypeLabel(value?: string | null): string {
  if (!value) return '—';
  return INFRA_TYPE_LABELS[value] || value;
}

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

export default function IncidentList() {
  const hasPermission = usePermissionStore((s: PermissionState) => s.hasPermission);
  const canRead = hasPermission('incident:read') || hasPermission('document:read');
  const canCreate = hasPermission('incident:create') || hasPermission('document:create');
  const canUpdate = hasPermission('incident:update') || hasPermission('document:update');
  const canDelete = hasPermission('incident:delete') || hasPermission('document:delete');

  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<SuCoResponse[]>([]);
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
  const [incidentTypeFilter, setIncidentTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [drawerMode, setDrawerMode] = useState<'view' | 'create' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<SuCoResponse | null>(null);
  const [detail, setDetail] = useState<SuCoResponse | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setIsError(false);
    try {
      const response = await fetchIncidentList({
        page: page - 1,
        size: pageSize,
        keyword: keyword.trim() || undefined,
        orgUnitId: orgUnitFilter,
        processingStatus: statusFilter === 'ALL' ? undefined : statusFilter,
        incidentType: incidentTypeFilter.trim() || undefined,
        occurredFrom: dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
        occurredTo: dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
      });
      setDataSource(response.content || []);
      setTotal(response.totalElements || 0);
      setStatusCounts(response.statusCounts || {});
    } catch (error: unknown) {
      setIsError(true);
      toast.error(errorText(error, 'Không thể tải danh sách hồ sơ sự cố'));
    } finally {
      setLoading(false);
    }
  }, [dateRange, incidentTypeFilter, keyword, orgUnitFilter, page, pageSize, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const statusTabs = useMemo(() => {
    const activeStatuses = ['RECEIVED', 'PROCESSING', 'RESOLVED', 'UNRESOLVED', 'CLOSED'];
    const showCounts = statusFilter === 'ALL';
    return [
      { key: 'ALL', label: 'Tất cả', count: showCounts ? total : 0, active: statusFilter === 'ALL', color: actionPrimary },
      ...activeStatuses.map((key) => ({
        key,
        label: PROCESSING_STATUS_LABELS[key] || key,
        count: showCounts ? statusCounts[key] || 0 : 0,
        active: statusFilter === key,
        color: PROCESSING_STATUS_COLORS[key],
      })),
    ];
  }, [statusCounts, statusFilter, total]);

  const openView = useCallback(async (record: SuCoResponse) => {
    setEditingItem(record);
    setDetail(null);
    setDrawerMode('view');
    try {
      const full = await fetchIncidentById(record.id);
      setDetail(full);
    } catch {
      setDetail(record);
    }
  }, []);

  const openCreate = useCallback(() => {
    setEditingItem(null);
    setDetail(null);
    form.resetFields();
    form.setFieldsValue({ processingStatus: 'RECEIVED', files: [] });
    setDrawerMode('create');
  }, [form]);

  const openEdit = useCallback(
    async (record: SuCoResponse) => {
      setEditingItem(record);
      setDetail(null);
      setDrawerMode('edit');
      let source = record;
      try {
        source = await fetchIncidentById(record.id);
      } catch {
        // Fallback: dùng bản ghi từ danh sách (children có thể rỗng nếu list không trả children).
      }
      setDetail(source);
      form.setFieldsValue({
        orgUnitId: source.orgUnitId,
        incidentType: source.incidentType,
        occurredRange:
          source.occurredFrom || source.occurredTo
            ? [toDate(source.occurredFrom), toDate(source.occurredTo)]
            : null,
        location: source.location,
        infrastructureType: source.infrastructureType,
        infrastructureId: source.infrastructureId,
        infrastructureName: source.infrastructureName,
        description: source.description,
        damageStatus: source.damageStatus,
        severityLevel: source.severityLevel,
        processingStatus: source.processingStatus,
        note: source.note,
        evolution: source.incidentEvolution || [],
        handling: source.incidentHandling || [],
        files: source.incidentFiles || [],
      });
    },
    [form],
  );

  const closeDrawer = useCallback(() => {
    setDrawerMode(null);
    setEditingItem(null);
    setDetail(null);
    form.resetFields();
  }, [form]);

  const buildPayload = useCallback((values: Record<string, unknown>): SuCoCreateRequest => {
    const text = (v: unknown): string | undefined =>
      v === undefined || v === null ? undefined : String(v).trim();
    const dateTime = (v: unknown): string | undefined =>
      v ? dayjs(v as Dayjs | string).format('YYYY-MM-DD HH:mm:ss') : undefined;
    const dateOnly = (v: unknown): string | undefined =>
      v ? dayjs(v as Dayjs | string).format('YYYY-MM-DD') : undefined;
    const range = values.occurredRange as [Dayjs | null, Dayjs | null] | null | undefined;
    const evolution: IncidentEvolutionItem[] = ((values.evolution as unknown[]) || []).map((item) => {
      const row = item as { fromDate?: Dayjs; toDate?: Dayjs; event?: string };
      return {
        fromDate: dateTime(row.fromDate),
        toDate: dateTime(row.toDate),
        event: text(row.event),
      };
    });
    const handling: IncidentHandlingItem[] = ((values.handling as unknown[]) || []).map((item) => {
      const row = item as {
        handler?: string;
        directiveContent?: string;
        directiveDate?: Dayjs;
        measure?: string;
        result?: string;
        note?: string;
      };
      return {
        handler: text(row.handler),
        directiveContent: text(row.directiveContent),
        directiveDate: dateOnly(row.directiveDate),
        measure: text(row.measure),
        result: text(row.result),
        note: text(row.note),
      };
    });
    const files: IncidentFileItem[] = ((values.files as unknown[]) || []).map((item) => {
      const row = item as { fileName?: string; fileCategory?: string };
      return {
        fileName: text(row.fileName),
        fileCategory: (row.fileCategory === 'RESULT' ? 'RESULT' : 'INFO') as IncidentFileItem['fileCategory'],
      };
    });
    return {
      orgUnitId: text(values.orgUnitId) ?? '',
      incidentType: text(values.incidentType),
      occurredFrom: range?.[0] ? range[0].format('YYYY-MM-DD HH:mm:ss') : undefined,
      occurredTo: range?.[1] ? range[1].format('YYYY-MM-DD HH:mm:ss') : undefined,
      location: text(values.location),
      infrastructureType: text(values.infrastructureType),
      infrastructureId: text(values.infrastructureId),
      infrastructureName: text(values.infrastructureName),
      description: text(values.description),
      damageStatus: text(values.damageStatus),
      processingStatus: (text(values.processingStatus) as SuCoCreateRequest['processingStatus']) || 'RECEIVED',
      severityLevel: text(values.severityLevel) as SuCoCreateRequest['severityLevel'],
      note: text(values.note),
      evolution,
      handling,
      files,
    };
  }, []);

  const submitForm = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = buildPayload(values);
      if (editingItem) {
        await updateSuCo(editingItem.id, payload);
        toast.success('Cập nhật hồ sơ sự cố thành công');
      } else {
        await createSuCo(payload);
        toast.success('Đã tạo hồ sơ sự cố thành công');
      }
      closeDrawer();
      await loadData();
    } catch (error: unknown) {
      if (!(typeof error === 'object' && error !== null && 'errorFields' in error)) {
        toast.error(errorText(error, 'Có lỗi xảy ra khi lưu hồ sơ sự cố'));
      }
    } finally {
      setSubmitting(false);
    }
  }, [buildPayload, closeDrawer, editingItem, form, loadData]);

  const confirmDelete = useCallback(
    (record: SuCoResponse) => {
      modal.confirm({
        title: 'Xóa hồ sơ sự cố',
        content: `Bạn có chắc chắn muốn xóa hồ sơ sự cố "${record.code || record.id}"?`,
        okText: 'Xóa',
        cancelText: 'Hủy',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deleteSuCo(record.id);
            toast.success('Xóa hồ sơ sự cố thành công');
            await loadData();
          } catch (error: unknown) {
            toast.error(errorText(error, 'Có lỗi khi xóa hồ sơ sự cố'));
          }
        },
      });
    },
    [loadData],
  );

  const columns: DataTableColumn[] = useMemo(
    () => [
      { key: 'code', dataIndex: 'code', label: 'Mã sự cố', width: 150, type: 'mono', render: (v: string) => v || '—' },
      {
        key: 'incidentType',
        dataIndex: 'incidentType',
        label: 'Loại sự cố',
        width: 180,
        render: (v: string) => v || '—',
      },
      {
        key: 'occurred',
        dataIndex: 'occurredFrom',
        label: 'Thời gian xảy ra sự cố',
        width: 230,
        render: (_: string, record: SuCoResponse) =>
          record.occurredFrom || record.occurredTo
            ? `${fmtDateTime(record.occurredFrom)} → ${fmtDateTime(record.occurredTo)}`
            : '—',
      },
      {
        key: 'location',
        dataIndex: 'location',
        label: 'Địa điểm xảy ra sự cố',
        width: 220,
        ellipsis: true,
        cellTitle: (record: SuCoResponse) => record.location || '',
        render: (v: string) => v || '—',
      },
      {
        key: 'severityLevel',
        dataIndex: 'severityLevel',
        label: 'Mức độ nghiêm trọng',
        width: 170,
        render: (v: string) => severityLabel(v),
      },
      {
        key: 'damageStatus',
        dataIndex: 'damageStatus',
        label: 'Tình trạng thiệt hại',
        width: 200,
        ellipsis: true,
        cellTitle: (record: SuCoResponse) => record.damageStatus || '',
        render: (v: string) => v || '—',
      },
      {
        key: 'orgUnitId',
        dataIndex: 'orgUnitName',
        label: 'Đơn vị quản lý',
        width: 220,
        ellipsis: true,
        cellTitle: (record: SuCoResponse) => record.orgUnitName || '',
        render: (v: string) => v || '—',
      },
      {
        key: 'processingStatus',
        dataIndex: 'processingStatus',
        label: 'Trạng thái sự cố',
        width: 210,
        render: (v: string) => renderPill(processingStatusLabel(v), processingStatusColor(v)),
      },
      {
        key: 'updatedAt',
        dataIndex: 'updatedDate',
        label: 'Ngày cập nhật',
        width: 160,
        render: (v: string) => fmtDateTime(v),
      },
    ],
    [],
  );

  const rowActions = useCallback(
    (record: SuCoResponse) => {
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

  const evolutionColumns: DataTableColumn[] = [
    { key: 'fromDate', dataIndex: 'fromDate', label: 'Từ ngày', width: 180, render: (v: string) => fmtDateTime(v) },
    { key: 'toDate', dataIndex: 'toDate', label: 'Đến ngày', width: 180, render: (v: string) => fmtDateTime(v) },
    {
      key: 'event',
      dataIndex: 'event',
      label: 'Sự kiện diễn biến',
      width: 360,
      ellipsis: true,
      cellTitle: (record: IncidentEvolutionItem) => record.event || '',
      render: (v: string) => v || '—',
    },
  ];

  const handlingColumns: DataTableColumn[] = [
    { key: 'handler', dataIndex: 'handler', label: 'Cán bộ chỉ đạo', width: 180, render: (v: string) => v || '—' },
    {
      key: 'directiveContent',
      dataIndex: 'directiveContent',
      label: 'Nội dung chỉ đạo',
      width: 260,
      ellipsis: true,
      cellTitle: (record: IncidentHandlingItem) => record.directiveContent || '',
      render: (v: string) => v || '—',
    },
    { key: 'directiveDate', dataIndex: 'directiveDate', label: 'Ngày chỉ đạo', width: 150, render: (v: string) => fmtDate(v) },
    {
      key: 'measure',
      dataIndex: 'measure',
      label: 'Biện pháp xử lý',
      width: 220,
      ellipsis: true,
      cellTitle: (record: IncidentHandlingItem) => record.measure || '',
      render: (v: string) => v || '—',
    },
    {
      key: 'result',
      dataIndex: 'result',
      label: 'Kết quả xử lý',
      width: 220,
      ellipsis: true,
      cellTitle: (record: IncidentHandlingItem) => record.result || '',
      render: (v: string) => v || '—',
    },
    { key: 'note', dataIndex: 'note', label: 'Ghi chú', width: 180, ellipsis: true, render: (v: string) => v || '—' },
  ];

  const fileColumns: DataTableColumn[] = [
    { key: 'fileName', dataIndex: 'fileName', label: 'Tên tệp', width: 320, ellipsis: true, render: (v: string) => v || '—' },
    {
      key: 'fileCategory',
      dataIndex: 'fileCategory',
      label: 'Loại tệp',
      width: 180,
      render: (v: string) => FILE_CATEGORY_LABELS[v] || v || '—',
    },
  ];

  const watchedStatus = Form.useWatch('processingStatus', form);
  const handlingEnabled = !watchedStatus || HANDLING_ENABLED_STATUSES.includes(watchedStatus);

  const filterContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceMd }}>
      <Form.Item label="Từ khóa" style={{ marginBottom: spaceFormField }}>
        <Input
          placeholder="Mã sự cố, địa điểm..."
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
      <Form.Item label="Loại sự cố" style={{ marginBottom: spaceFormField }}>
        <Input
          placeholder="Nhập loại sự cố..."
          value={incidentTypeFilter}
          onChange={(e) => setIncidentTypeFilter(e.target.value)}
          style={inputStyle}
          allowClear
        />
      </Form.Item>
      <Form.Item label="Khoảng ngày xảy ra" style={{ marginBottom: spaceFormField }}>
        <DatePicker.RangePicker
          {...getSidebarRangePickerProps()}
          value={dateRange}
          onChange={(value) => setDateRange(value as [Dayjs | null, Dayjs | null] | null)}
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
        breadcrumb={[{ label: 'Quản lý văn bản & thông tin nghiệp vụ' }, { label: 'Quản lý thông tin sự cố' }]}
        actions={
          canCreate
            ? [
                {
                  key: 'create',
                  label: 'Ghi nhận sự cố',
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
          setIncidentTypeFilter('');
          setDateRange(null);
          setPage(1);
        }}
        loading={loading}
        error={isError}
        errorMessage="Không thể tải danh sách hồ sơ sự cố"
        onRetry={loadData}
      >
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          rowActions={rowActions}
          emptyState={<EmptyState description="Chưa có hồ sơ sự cố nào" />}
        />
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </FilterTableLayout>

      <Drawer
        title={drawerMode === 'view' ? 'Chi tiết hồ sơ sự cố' : drawerMode === 'edit' ? 'Chỉnh sửa hồ sơ sự cố' : 'Ghi nhận sự cố'}
        open={drawerMode !== null}
        onClose={closeDrawer}
        width={drawerMode === 'view' ? 920 : 860}
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
                      labelStyle={{ width: 180, fontWeight: fontWeightMedium, color: textSecondary }}
                      items={[
                        { key: 'code', label: 'Mã sự cố', children: viewRecord.code || '—' },
                        { key: 'incidentType', label: 'Loại sự cố', children: viewRecord.incidentType || '—' },
                        {
                          key: 'occurred',
                          label: 'Thời gian xảy ra sự cố',
                          children:
                            viewRecord.occurredFrom || viewRecord.occurredTo
                              ? `${fmtDateTime(viewRecord.occurredFrom)} → ${fmtDateTime(viewRecord.occurredTo)}`
                              : '—',
                        },
                        {
                          key: 'orgUnit',
                          label: 'Đơn vị quản lý',
                          children: viewRecord.orgUnitName || viewRecord.orgUnitId || '—',
                        },
                        {
                          key: 'location',
                          label: 'Địa điểm xảy ra sự cố',
                          span: 2,
                          children: viewRecord.location || '—',
                        },
                        {
                          key: 'infrastructure',
                          label: 'Kết cấu hạ tầng xảy ra sự cố',
                          span: 2,
                          children:
                            viewRecord.infrastructureName ||
                            (viewRecord.infrastructureType ? `${infraTypeLabel(viewRecord.infrastructureType)} — ${viewRecord.infrastructureId || ''}` : '—'),
                        },
                        {
                          key: 'severity',
                          label: 'Mức độ nghiêm trọng',
                          children: severityLabel(viewRecord.severityLevel),
                        },
                        {
                          key: 'damageStatus',
                          label: 'Tình trạng thiệt hại',
                          children: viewRecord.damageStatus || '—',
                        },
                        {
                          key: 'processingStatus',
                          label: 'Trạng thái sự cố',
                          children: renderPill(processingStatusLabel(viewRecord.processingStatus), processingStatusColor(viewRecord.processingStatus)),
                        },
                        {
                          key: 'description',
                          label: 'Nội dung sự cố',
                          span: 2,
                          children: viewRecord.description || '—',
                        },
                        { key: 'note', label: 'Ghi chú', span: 2, children: viewRecord.note || '—' },
                        {
                          key: 'updatedAt',
                          label: 'Cán bộ cập nhật / Ngày cập nhật',
                          children: viewRecord.updatedByName || viewRecord.updatedBy || '—',
                        },
                        { key: 'updatedDate', label: '', children: fmtDateTime(viewRecord.updatedDate) },
                      ]}
                    />
                  </div>
                ),
              },
              {
                key: 'evolution',
                label: 'Diễn biến sự cố',
                children: (
                  <DataTable
                    dense
                    columns={evolutionColumns}
                    dataSource={viewRecord.incidentEvolution || []}
                    rowKey={(record: IncidentEvolutionItem) => record.id || String(Math.random())}
                    scroll={{ y: DRAWER_TABLE_SCROLL_Y.pureTable }}
                    emptyState={<EmptyState description="Chưa có diễn biến nào" />}
                  />
                ),
              },
              {
                key: 'handling',
                label: 'Chỉ đạo xử lý',
                children: (
                  <DataTable
                    dense
                    columns={handlingColumns}
                    dataSource={viewRecord.incidentHandling || []}
                    rowKey={(record: IncidentHandlingItem) => record.id || String(Math.random())}
                    scroll={{ y: DRAWER_TABLE_SCROLL_Y.pureTable }}
                    emptyState={<EmptyState description="Chưa có nội dung chỉ đạo xử lý" />}
                  />
                ),
              },
              {
                key: 'files',
                label: 'Tệp đính kèm',
                children: (
                  <DataTable
                    dense
                    columns={fileColumns}
                    dataSource={viewRecord.incidentFiles || []}
                    rowKey={(record: IncidentFileItem) => record.id || String(Math.random())}
                    scroll={{ y: DRAWER_TABLE_SCROLL_Y.pureTable }}
                    emptyState={<EmptyState description="Chưa có tệp đính kèm" />}
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
                <Form.Item name="incidentType" {...labelProps('Loại sự cố')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập loại sự cố..." style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                {drawerMode === 'edit' && editingItem ? (
                  <Form.Item name="codeHidden" label="Mã sự cố (tự sinh)" style={{ marginBottom: spaceFormField }}>
                    <Input disabled value={editingItem.code || ''} style={inputStyle} />
                  </Form.Item>
                ) : (
                  <Form.Item name="codeAuto" label="Mã sự cố (tự sinh)" style={{ marginBottom: spaceFormField }}>
                    <Input disabled placeholder="Hệ thống tự sinh" style={inputStyle} />
                  </Form.Item>
                )}
              </Col>
            </Row>
            <Form.Item
              name="occurredRange"
              {...labelProps('Thời gian xảy ra sự cố')}
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng chọn thời gian xảy ra sự cố' }]}
            >
              <DatePicker.RangePicker
                {...getRangePickerProps()}
                showTime={{ format: 'HH:mm' }}
                format="DD/MM/YYYY HH:mm"
                placeholder={['Từ ngày', 'Đến ngày']}
                style={{ ...inputStyle, width: '100%' }}
              />
            </Form.Item>
            <Form.Item name="location" {...labelProps('Địa điểm xảy ra sự cố')} style={{ marginBottom: spaceFormField }}>
              <Input placeholder="Nhập địa điểm xảy ra sự cố..." style={inputStyle} />
            </Form.Item>
            <Row gutter={spaceMd}>
              <Col span={8}>
                <Form.Item name="infrastructureType" {...labelProps('Loại KCHT xảy ra sự cố')} style={{ marginBottom: spaceFormField }}>
                  <Select options={INFRA_TYPE_OPTIONS} placeholder="Chọn loại KCHT..." allowClear style={{ ...selectStyle, width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="infrastructureId" {...labelProps('Mã KCHT xảy ra sự cố')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập mã KCHT..." style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="infrastructureName" {...labelProps('Tên KCHT xảy ra sự cố')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Tên KCHT (tự điền khi chọn mã)..." style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" {...labelProps('Nội dung sự cố')} style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={4} placeholder="Mô tả nội dung sự việc..." style={{ borderRadius: radiusTextArea }} />
            </Form.Item>
            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item name="severityLevel" {...labelProps('Mức độ nghiêm trọng')} style={{ marginBottom: spaceFormField }}>
                  <Select
                    options={Object.entries(SEVERITY_LABELS).map(([value, label]) => ({ value, label }))}
                    placeholder="Chọn mức độ nghiêm trọng..."
                    style={{ ...selectStyle, width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="damageStatus" {...labelProps('Tình trạng thiệt hại')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Mô tả tình trạng thiệt hại..." style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item name="processingStatus" {...labelProps('Trạng thái sự cố')} style={{ marginBottom: spaceFormField }}>
                  <Select
                    options={Object.entries(PROCESSING_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                    placeholder="Chọn trạng thái sự cố..."
                    style={{ ...selectStyle, width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="note" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập ghi chú..." style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>

            <div
              style={{
                border: `1px solid ${borderDefault}`,
                borderRadius: radiusSm,
                padding: spaceMd,
                marginBottom: spaceMd,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spaceSm }}>
                <span style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd, color: textPrimary }}>Diễn biến sự cố</span>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  style={{ borderRadius: radiusPill }}
                  onClick={() => {
                    const rows = form.getFieldValue('evolution') || [];
                    form.setFieldValue('evolution', [...rows, { fromDate: dayjs(), toDate: dayjs(), event: '' }]);
                  }}
                >
                  Thêm diễn biến
                </Button>
              </div>
              <Form.List name="evolution">
                {(fields, { add, remove }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                    {fields.map((field) => (
                      <Row key={field.key} gutter={spaceSm} align="middle">
                        <Col span={6}>
                          <Form.Item name={[field.name, 'fromDate']} style={{ marginBottom: 0 }}>
                            <DatePicker {...getDatePickerProps()} showTime format="DD/MM/YYYY HH:mm" style={{ ...inputStyle, width: '100%' }} placeholder="Từ ngày" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name={[field.name, 'toDate']} style={{ marginBottom: 0 }}>
                            <DatePicker {...getDatePickerProps()} showTime format="DD/MM/YYYY HH:mm" style={{ ...inputStyle, width: '100%' }} placeholder="Đến ngày" />
                          </Form.Item>
                        </Col>
                        <Col span={10}>
                          <Form.Item name={[field.name, 'event']} style={{ marginBottom: 0 }}>
                            <Input placeholder="Sự kiện diễn biến..." style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={2} style={{ textAlign: 'center' }}>
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                        </Col>
                      </Row>
                    ))}
                    {fields.length === 0 && (
                      <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ fromDate: dayjs(), toDate: dayjs(), event: '' })}>
                        Thêm diễn biến
                      </Button>
                    )}
                  </div>
                )}
              </Form.List>
            </div>

            <div
              style={{
                border: `1px solid ${borderDefault}`,
                borderRadius: radiusSm,
                padding: spaceMd,
                marginBottom: spaceMd,
                background: handlingEnabled ? `${statusNeutral}0A` : `${statusNeutral}05`,
                opacity: handlingEnabled ? 1 : 0.7,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spaceSm }}>
                <span style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd, color: textPrimary }}>Chỉ đạo xử lý</span>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  disabled={!handlingEnabled}
                  style={{ borderRadius: radiusPill }}
                  onClick={() => {
                    const rows = form.getFieldValue('handling') || [];
                    form.setFieldValue('handling', [...rows, { handler: '', directiveContent: '', directiveDate: dayjs(), measure: '', result: '', note: '' }]);
                  }}
                >
                  Thêm chỉ đạo
                </Button>
              </div>
              {!handlingEnabled && (
                <div style={{ color: textTertiary, fontSize: fontSizeSm, marginBottom: spaceSm }}>
                  Chỉ ghi nhận chỉ đạo xử lý khi trạng thái là: Đã xử lý đang theo dõi / Không thể xử lý / Đã đóng.
                </div>
              )}
              <Form.List name="handling">
                {(fields, { add, remove }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                    {fields.map((field) => (
                      <div
                        key={field.key}
                        style={{
                border: `1px solid ${borderDefault}`,
                borderRadius: radiusSm,
                          padding: spaceSm,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: spaceXs,
                          position: 'relative',
                        }}
                      >
                        <Row gutter={spaceSm}>
                          <Col span={8}>
                            <Form.Item name={[field.name, 'handler']} style={{ marginBottom: spaceXs }}>
                              <Input placeholder="Cán bộ chỉ đạo..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item name={[field.name, 'directiveDate']} style={{ marginBottom: spaceXs }}>
                              <DatePicker {...getDatePickerProps()} format="DD/MM/YYYY" style={{ ...inputStyle, width: '100%' }} placeholder="Ngày chỉ đạo" />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item name={[field.name, 'result']} style={{ marginBottom: spaceXs }}>
                              <Input placeholder="Kết quả xử lý..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={2} style={{ textAlign: 'center' }}>
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                          </Col>
                        </Row>
                        <Form.Item name={[field.name, 'directiveContent']} style={{ marginBottom: spaceXs }}>
                          <Input placeholder="Nội dung chỉ đạo..." style={inputStyle} />
                        </Form.Item>
                        <Row gutter={spaceSm}>
                          <Col span={12}>
                            <Form.Item name={[field.name, 'measure']} style={{ marginBottom: 0 }}>
                              <Input placeholder="Biện pháp xử lý..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name={[field.name, 'note']} style={{ marginBottom: 0 }}>
                              <Input placeholder="Ghi chú xử lý..." style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <Button type="dashed" icon={<PlusOutlined />} disabled={!handlingEnabled} onClick={() => add({})}>
                        Thêm chỉ đạo xử lý
                      </Button>
                    )}
                  </div>
                )}
              </Form.List>
            </div>

            <div
              style={{
                border: `1px solid ${borderDefault}`,
                borderRadius: radiusSm,
                padding: spaceMd,
                marginBottom: spaceLg,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spaceSm }}>
                <span style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd, color: textPrimary }}>Tệp đính kèm</span>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  style={{ borderRadius: radiusPill }}
                  onClick={() => {
                    const rows = form.getFieldValue('files') || [];
                    form.setFieldValue('files', [...rows, { fileName: '', fileCategory: 'INFO' }]);
                  }}
                >
                  Thêm tệp
                </Button>
              </div>
              <Form.List name="files">
                {(fields, { add, remove }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                    {fields.map((field) => (
                      <Row key={field.key} gutter={spaceSm} align="middle">
                        <Col span={16}>
                          <Form.Item
                            name={[field.name, 'fileName']}
                            style={{ marginBottom: 0 }}
                            rules={[{ required: true, message: 'Nhập tên tệp' }]}
                          >
                            <Input placeholder="Tên tệp (file thông tin / file kết quả xử lý)..." style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name={[field.name, 'fileCategory']} style={{ marginBottom: 0 }} initialValue="INFO">
                            <Select
                              options={Object.entries(FILE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
                              style={{ ...selectStyle, width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={2} style={{ textAlign: 'center' }}>
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                        </Col>
                      </Row>
                    ))}
                    {fields.length === 0 && (
                      <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ fileName: '', fileCategory: 'INFO' })}>
                        Thêm tệp đính kèm
                      </Button>
                    )}
                  </div>
                )}
              </Form.List>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spaceSm }}>
              <Button style={{ ...outlineButtonStyle, borderRadius: radiusPill }} onClick={closeDrawer}>
                Hủy
              </Button>
              <Button
                type="primary"
                style={{ ...primaryButtonStyle, borderRadius: radiusPill }}
                loading={submitting}
                onClick={() => void submitForm()}
              >
                {drawerMode === 'edit' ? 'Cập nhật' : 'Ghi nhận sự cố'}
              </Button>
            </div>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
