import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, DatePicker, Descriptions, Drawer, Form, Input, InputNumber, Modal, Row, Select, Spin } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import api from '../../services/api';
import { usePermissionStore } from '../../store/permissionStore';
import { FilterOrgUnitTreeSelect, FormOrgUnitTreeSelect } from '../../components/org-unit';
import { DataTable, FilterTableLayout, ScreenHeader } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import toast from '../../components/ToastNotification';
import { inputStyle, selectStyle, primaryButtonStyle, textAreaStyle, spaceFormField, spaceSm, radiusPill, fontSizeMd, fontWeightMedium } from '../../tokens';
import { useThemeToken } from '../../context/ThemeTokenContext';
import { getDatePickerProps, DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';

/* =========================================================================
 * F-130 — Quản lý thông tin bảo trì (maintenance_plans)
 * Ma trận Excel #36 §2: các trường Create/Edit=TRUE được BE accept đều có
 * trong form + payload (orgUnitId, operatingOrgUnitId, infrastructureType,
 * code (tự sinh — read-only), name, content, note) cùng các trường legacy
 * (equipment, maintenanceType, estimatedStartDate/EndDate, status,
 * estimatedCost). code KHÔNG được gửi lên (BE tự sinh); cột read-only.
 * Xác nhận kết quả bảo trì: POST /api/v1/maintenance-plans/result — chỉ khả
 * dụng khi status = HOAN_THANH (BR-130-02/06); quyền ghi theo
 * maintenanceplan:report/update hoặc document:update (đúng @PreAuthorize BE).
 * ========================================================================= */

type MaintenanceStatusKey = 'CHO_DOI_PHUY' | 'DANG_THUC_HIEN' | 'HOAN_THANH' | 'TRI_HOAI';
type MaintenanceTypeKey = 'DINH_KY' | 'SUA_CHUA_LON' | 'SUA_CHUA_KHAN_CAP';

interface MaintenanceWorkItem {
  id: string;
  infrastructureId?: string;
  infrastructureName?: string;
  portName?: string;
  location?: string;
  cost?: number;
}

interface MaintenanceFileItem {
  id: string;
  fileCategory?: string;
  fileType?: string;
  fileName?: string;
  filePath?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

interface MaintenanceResultRecord {
  id: string;
  maintenancePlanId?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  resultDescription?: string;
  resultNote?: string;
  replacedParts?: string;
  downtimeDuration?: number;
  recorder?: string;
  recordedDate?: string;
}

interface MaintenancePlanRecord {
  id: string;
  equipment?: string;
  maintenanceType?: MaintenanceTypeKey;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  status?: MaintenanceStatusKey;
  estimatedCost?: number;
  orgUnitId?: string;
  orgUnitName?: string;
  operatingOrgUnitId?: string;
  infrastructureType?: string;
  code?: string;
  name?: string;
  content?: string;
  note?: string;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  workItems?: MaintenanceWorkItem[];
  files?: MaintenanceFileItem[];
  results?: MaintenanceResultRecord[];
}

type DrawerMode = 'create' | 'view' | 'edit' | null;

const STATUS_ORDER: MaintenanceStatusKey[] = ['CHO_DOI_PHUY', 'DANG_THUC_HIEN', 'HOAN_THANH', 'TRI_HOAI'];

const STATUS_LABELS: Record<MaintenanceStatusKey, string> = {
  CHO_DOI_PHUY: 'Chờ duyệt',
  DANG_THUC_HIEN: 'Đang thực hiện',
  HOAN_THANH: 'Hoàn thành',
  TRI_HOAI: 'Trì hoãn',
};

const MAINTENANCE_TYPE_OPTIONS: { value: MaintenanceTypeKey; label: string }[] = [
  { value: 'DINH_KY', label: 'Bảo trì định kỳ' },
  { value: 'SUA_CHUA_LON', label: 'Sửa chữa lớn' },
  { value: 'SUA_CHUA_KHAN_CAP', label: 'Sửa chữa khẩn cấp' },
];

/** Quy ước hiển thị tiếng Việt của trường infrastructureType (mã enum InfrastructureType lưu VARCHAR). */
function infraTypeLabel(code?: string): string {
  if (!code) return '—';
  const known: Record<string, string> = {
    VTS_SYSTEM: 'Hệ thống VTS',
    AIS_SYSTEM: 'Hệ thống AIS',
    NAVIGATION_CHANNEL: 'Luồng hàng hải',
    PORT: 'Cảng biển',
    BERTH: 'Bến cảng',
    BUOY: 'Phao báo hiệu',
    LIGHT: 'Đèn biển',
  };
  return known[code] || code;
}

const PAGE_SIZE = 20;

const toDate = (v?: string | null): Dayjs | null => (v ? dayjs(v) : null);
const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—');
const fmtMoney = (v?: number | null): string => (v === null || v === undefined ? '—' : Number(v).toLocaleString('vi-VN'));

function MaintenanceList() {
  const t = useThemeToken();
  const hasAnyPermission = usePermissionStore((s) => s.hasAnyPermission);
  const [form] = Form.useForm();
  const [resultForm] = Form.useForm();

  const canRead = hasAnyPermission(['maintenanceplan:read', 'document:read']);
  const canCreate = hasAnyPermission(['maintenanceplan:create', 'document:create']);
  const canUpdate = hasAnyPermission(['maintenanceplan:update', 'document:update']);
  const canDelete = hasAnyPermission(['maintenanceplan:delete', 'document:delete']);
  const canRecordResult = hasAnyPermission(['maintenanceplan:report', 'maintenanceplan:update', 'document:update']);

  const [data, setData] = useState<MaintenancePlanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [orgUnitFilter, setOrgUnitFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [editingItem, setEditingItem] = useState<MaintenancePlanRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultSaving, setResultSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const resp = await api.get('/v1/maintenance-plans', { params: { page: 0, size: 1000 } });
      const raw = resp?.data?.data ?? resp?.data ?? [];
      const list: MaintenancePlanRecord[] = Array.isArray(raw) ? raw : raw?.content ?? [];
      setData(list);
    } catch (err: any) {
      setError(true);
      setErrorMessage(err?.message || 'Không thể tải danh sách kế hoạch bảo trì');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusColor = useCallback((status?: MaintenanceStatusKey): string => {
    switch (status) {
      case 'CHO_DOI_PHUY':
      case 'TRI_HOAI':
        return t.statusAttention;
      case 'DANG_THUC_HIEN':
        return t.dataSea1;
      case 'HOAN_THANH':
        return t.statusOperational;
      default:
        return t.textSecondary;
    }
  }, [t]);

  const renderStatusBadge = useCallback((status?: MaintenanceStatusKey) => {
    const color = statusColor(status);
    const label = status ? STATUS_LABELS[status] : '—';
    return (
      <span
        style={{
          borderRadius: radiusPill,
          padding: '2px 10px',
          fontSize: fontSizeMd,
          fontWeight: fontWeightMedium,
          lineHeight: '20px',
          background: `${color}15`,
          border: `1px solid ${color}40`,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    );
  }, [statusColor]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return data.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (orgUnitFilter && item.orgUnitId !== orgUnitFilter) return false;
      if (!kw) return true;
      return [item.code, item.name, item.equipment, item.infrastructureType, item.orgUnitName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw));
    });
  }, [data, keyword, statusFilter, orgUnitFilter]);

  const statusTabs = useMemo(() => {
    const countOf = (key: string) => (key === 'ALL' ? data.length : data.filter((i) => i.status === key).length);
    const colors: Record<string, string> = {
      ALL: t.dataSea1,
      CHO_DOI_PHUY: t.statusAttention,
      DANG_THUC_HIEN: t.dataSea1,
      HOAN_THANH: t.statusOperational,
      TRI_HOAI: t.statusAttention,
    };
    return [
      { key: 'ALL', label: 'Tất cả', count: countOf('ALL'), color: colors.ALL },
      ...STATUS_ORDER.map((key) => ({ key, label: STATUS_LABELS[key], count: countOf(key), color: colors[key] })),
    ];
  }, [data, t]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, page]);

  const applyFilters = useCallback(() => {
    setKeyword(keywordInput.trim());
    setPage(1);
  }, [keywordInput]);

  const handleFilterReset = useCallback(() => {
    setKeyword('');
    setKeywordInput('');
    setOrgUnitFilter(undefined);
    setStatusFilter('ALL');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setStatusFilter(key);
    setPage(1);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerMode(null);
    setEditingItem(null);
    form.resetFields();
  }, [form]);

  const openCreate = useCallback(() => {
    form.resetFields();
    form.setFieldsValue({ status: 'CHO_DOI_PHUY' });
    setDrawerMode('create');
  }, [form]);

  const openEdit = useCallback((record: MaintenancePlanRecord) => {
    setEditingItem(record);
    form.setFieldsValue({
      orgUnitId: record.orgUnitId,
      operatingOrgUnitId: record.operatingOrgUnitId,
      infrastructureType: record.infrastructureType,
      name: record.name,
      equipment: record.equipment,
      maintenanceType: record.maintenanceType,
      estimatedStartDate: toDate(record.estimatedStartDate),
      estimatedEndDate: toDate(record.estimatedEndDate),
      estimatedCost: record.estimatedCost,
      status: record.status,
      content: record.content,
      note: record.note,
    });
    setDrawerMode('edit');
  }, [form]);

  const openView = useCallback((record: MaintenancePlanRecord) => {
    setEditingItem(record);
    setDrawerMode('view');
  }, []);

  const openResult = useCallback(() => {
    resultForm.resetFields();
    resultForm.setFieldsValue({ recordedDate: dayjs() });
    setResultOpen(true);
  }, [resultForm]);

  const buildPayload = (values: Record<string, any>) => {
    const trim = (v?: string) => (v === undefined || v === null ? undefined : String(v).trim());
    return {
      equipment: trim(values.equipment),
      maintenanceType: values.maintenanceType ?? undefined,
      estimatedStartDate: values.estimatedStartDate ? values.estimatedStartDate.format('YYYY-MM-DD') : undefined,
      estimatedEndDate: values.estimatedEndDate ? values.estimatedEndDate.format('YYYY-MM-DD') : undefined,
      estimatedCost: values.estimatedCost ?? undefined,
      status: values.status ?? undefined,
      orgUnitId: values.orgUnitId ?? undefined,
      operatingOrgUnitId: values.operatingOrgUnitId ?? undefined,
      infrastructureType: trim(values.infrastructureType),
      name: trim(values.name),
      content: trim(values.content),
      note: trim(values.note),
    };
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = buildPayload(values);
      setSaving(true);
      if (drawerMode === 'create') {
        await api.post('/v1/maintenance-plans', payload);
        toast.success('Tạo mới kế hoạch bảo trì thành công');
      } else if (drawerMode === 'edit' && editingItem) {
        await api.put(`/v1/maintenance-plans/${editingItem.id}`, payload);
        toast.success('Cập nhật kế hoạch bảo trì thành công');
      }
      closeDrawer();
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return; // form validation
      toast.error(err?.message || 'Lưu kế hoạch bảo trì thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback((record: MaintenancePlanRecord) => {
    Modal.confirm({
      title: 'Xóa kế hoạch bảo trì',
      content: `Bạn có chắc chắn muốn xóa kế hoạch "${record.code || record.name || record.equipment || ''}"?`,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.delete(`/v1/maintenance-plans/${record.id}`);
          toast.success('Xóa kế hoạch bảo trì thành công');
          fetchData();
        } catch (err: any) {
          toast.error(err?.message || 'Xóa kế hoạch bảo trì thất bại');
        }
      },
    });
  }, [fetchData]);

  const handleSubmitResult = async () => {
    if (!editingItem) return;
    try {
      const values = await resultForm.validateFields();
      const payload = {
        maintenancePlanId: editingItem.id,
        actualStartDate: values.actualStartDate ? values.actualStartDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
        actualEndDate: values.actualEndDate ? values.actualEndDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
        resultDescription: values.resultDescription ? String(values.resultDescription).trim() : undefined,
        resultNote: values.resultNote ? String(values.resultNote).trim() : undefined,
        replacedParts: values.replacedParts ? String(values.replacedParts).trim() : undefined,
        downtimeDuration: values.downtimeDuration ?? undefined,
        recorder: values.recorder ? String(values.recorder).trim() : undefined,
        recordedDate: values.recordedDate ? values.recordedDate.format('YYYY-MM-DD') : undefined,
      };
      setResultSaving(true);
      await api.post('/v1/maintenance-plans/result', payload);
      toast.success('Ghi nhận kết quả bảo trì thành công');
      setResultOpen(false);
      fetchData();
      const fresh = await api.get(`/v1/maintenance-plans/${editingItem.id}`);
      const freshData = fresh?.data?.data ?? fresh?.data;
      if (freshData) setEditingItem(freshData);
    } catch (err: any) {
      if (err?.errorFields) return;
      toast.error(err?.message || 'Ghi nhận kết quả bảo trì thất bại');
    } finally {
      setResultSaving(false);
    }
  };

  const rowActions = useCallback((record: MaintenancePlanRecord) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; danger?: boolean; onClick: () => void }[] = [];
    if (canRead) actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => openView(record) });
    if (canUpdate) actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => openEdit(record) });
    if (canDelete) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record) });
    return actions;
  }, [canRead, canUpdate, canDelete, openView, openEdit, handleDelete]);

  const columns = useMemo<DataTableColumn[]>(() => {
    return [
      { key: 'stt', label: 'STT', width: 60, align: 'center', fixed: 'left', render: (_: unknown, __: unknown, idx?: number) => (page - 1) * PAGE_SIZE + (idx ?? 0) + 1 },
      { key: 'code', label: 'Mã kế hoạch', dataIndex: 'code', width: 160, render: (v: any) => (v ? <span style={{ fontWeight: t.fontWeightMedium }}>{v}</span> : '—') },
      { key: 'name', label: 'Tên kế hoạch', dataIndex: 'name', width: 240, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.name || '' },
      { key: 'equipment', label: 'Tên công việc bảo trì', dataIndex: 'equipment', width: 220, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.equipment || '' },
      { key: 'maintenanceType', label: 'Loại công việc', dataIndex: 'maintenanceType', width: 170, render: (v: any) => MAINTENANCE_TYPE_OPTIONS.find((o) => o.value === v)?.label || v || '—' },
      { key: 'infrastructureType', label: 'Loại KCHT', dataIndex: 'infrastructureType', width: 160, render: (v: any) => infraTypeLabel(v) },
      { key: 'orgUnitName', label: 'Đơn vị quản lý', dataIndex: 'orgUnitName', width: 210, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.orgUnitName || '' },
      { key: 'estimatedStartDate', label: 'Dự kiến bắt đầu', dataIndex: 'estimatedStartDate', width: 130, align: 'center', render: (v: any) => fmtDate(v) },
      { key: 'estimatedEndDate', label: 'Dự kiến kết thúc', dataIndex: 'estimatedEndDate', width: 130, align: 'center', render: (v: any) => fmtDate(v) },
      { key: 'estimatedCost', label: 'Kinh phí (VNĐ)', dataIndex: 'estimatedCost', width: 150, align: 'right', render: (v: any) => fmtMoney(v) },
      { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 150, align: 'center', render: (v: MaintenanceStatusKey) => renderStatusBadge(v) },
      { key: 'updatedDate', label: 'Ngày cập nhật', dataIndex: 'updatedDate', width: 130, align: 'center', render: (v: any) => fmtDate(v) },
    ];
  }, [page, t, renderStatusBadge]);

  const viewRecord = editingItem;
  const showChildWork = (viewRecord?.workItems?.length ?? 0) > 0;
  const showChildFiles = (viewRecord?.files?.length ?? 0) > 0;
  const isCompleted = viewRecord?.status === 'HOAN_THANH';
  const existingResult = viewRecord?.results?.[0];

  const workColumns: DataTableColumn[] = [
    { key: 'stt', label: 'STT', width: 60, align: 'center', render: (_: unknown, __: unknown, idx?: number) => (idx ?? 0) + 1 },
    { key: 'infrastructureName', label: 'Tên công trình', dataIndex: 'infrastructureName', width: 440, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.infrastructureName || '' },
    { key: 'portName', label: 'Cảng/đơn vị', dataIndex: 'portName', width: 200, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.portName || '' },
    { key: 'location', label: 'Vị trí', dataIndex: 'location', width: 200, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.location || '' },
    { key: 'cost', label: 'Kinh phí (VNĐ)', dataIndex: 'cost', width: 160, align: 'right', render: (v: any) => fmtMoney(v) },
  ];

  const fileColumns: DataTableColumn[] = [
    { key: 'stt', label: 'STT', width: 60, align: 'center', render: (_: unknown, __: unknown, idx?: number) => (idx ?? 0) + 1 },
    { key: 'fileName', label: 'Tên tệp', dataIndex: 'fileName', width: 380, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.fileName || '' },
    { key: 'fileCategory', label: 'Phân loại', dataIndex: 'fileCategory', width: 150, render: (v: any) => v || '—' },
    { key: 'uploadedAt', label: 'Thời điểm tải lên', dataIndex: 'uploadedAt', width: 170, render: (v: any) => fmtDateTime(v) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <ScreenHeader
        breadcrumbs={[
          { label: 'Văn bản & thông tin nghiệp vụ', path: '/documents' },
          { label: 'Thông tin bảo trì', path: '/documents/maintenance' },
        ]}
        actions={canCreate ? [{ key: 'create', label: 'Thêm mới', icon: <PlusOutlined />, variant: 'primary', onClick: openCreate }] : []}
      />

      <FilterTableLayout
        hideFilterToggle
        statusTabs={statusTabs}
        onStatusTabChange={handleTabChange}
        onFilterApply={applyFilters}
        onFilterReset={handleFilterReset}
        loading={loading}
        error={error}
        errorMessage={errorMessage}
        onRetry={fetchData}
        filterContent={
          <Form layout="vertical" onFinish={applyFilters}>
            <Form.Item label="Tìm kiếm từ khóa" style={{ marginBottom: spaceFormField }}>
              <Input
                placeholder="Tìm theo mã, tên kế hoạch, trang thiết bị..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                style={inputStyle}
                allowClear
                onPressEnter={applyFilters}
              />
            </Form.Item>
            <Form.Item name="maintenanceType" label="Loại công việc bảo trì" style={{ marginBottom: spaceFormField }}>
              <Select
                style={selectStyle}
                allowClear
                placeholder="Tất cả loại công việc"
                options={MAINTENANCE_TYPE_OPTIONS}
                onChange={() => setPage(1)}
              />
            </Form.Item>
            <Form.Item label="Đơn vị quản lý" style={{ marginBottom: spaceFormField }}>
              <FilterOrgUnitTreeSelect
                placeholder="Tất cả đơn vị"
                onChange={(value?: string) => setOrgUnitFilter(value)}
              />
            </Form.Item>
          </Form>
        }
      >
        <DataTable columns={columns} dataSource={pagedRows} rowKey="id" loading={loading} rowActions={rowActions} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0 0' }}>
          <Pagination total={filtered.length} current={page} pageSize={PAGE_SIZE} onChange={(p) => setPage(p)} />
        </div>
      </FilterTableLayout>

      {/* ── Create / Edit drawer ── */}
      <Drawer
        open={drawerMode === 'create' || drawerMode === 'edit'}
        onClose={closeDrawer}
        width={860}
        title={drawerMode === 'create' ? 'Thêm mới kế hoạch bảo trì' : 'Chỉnh sửa kế hoạch bảo trì'}
        footer={[
          <Button key="cancel" style={{ ...primaryButtonStyle, background: t.borderDefault, borderColor: t.borderDefault, color: t.textSecondary, marginRight: spaceSm }} onClick={closeDrawer}>
            Hủy
          </Button>,
          <Button key="save" type="primary" loading={saving} style={primaryButtonStyle} onClick={handleSubmit}>
            Lưu
          </Button>,
        ]}
      >
        <Spin spinning={saving}>
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="orgUnitId" label="Đơn vị quản lý" required style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}>
                  <FormOrgUnitTreeSelect placeholder="Chọn đơn vị quản lý" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operatingOrgUnitId" label="Đơn vị vận hành khai thác" style={{ marginBottom: spaceFormField }}>
                  <FormOrgUnitTreeSelect placeholder="Chọn đơn vị vận hành khai thác (nếu có)" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="code" label="Mã kế hoạch" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Tự động sinh sau khi lưu" disabled style={{ ...inputStyle, background: t.tableHeaderBg }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="name" label="Tên kế hoạch" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập tên kế hoạch bảo trì" style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="infrastructureType" label="Loại KCHT" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập mã loại KCHT" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="equipment" label="Tên công việc bảo trì" required style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên công việc bảo trì' }]}>
                  <Input placeholder="Nhập tên công việc bảo trì" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="maintenanceType" label="Loại công việc bảo trì" style={{ marginBottom: spaceFormField }}>
                  <Select style={selectStyle} allowClear placeholder="Chọn loại công việc" options={MAINTENANCE_TYPE_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="estimatedStartDate" label="Dự kiến bắt đầu" style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps()} style={{ ...inputStyle, width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="estimatedEndDate" label="Dự kiến kết thúc" style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps()} style={{ ...inputStyle, width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="estimatedCost" label="Kinh phí dự kiến (VNĐ)" style={{ marginBottom: spaceFormField }}>
                  <InputNumber style={{ ...inputStyle, width: '100%' }} min={0} placeholder="Nhập kinh phí" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="status" label="Trạng thái" style={{ marginBottom: spaceFormField }}>
                  <Select style={selectStyle} options={STATUS_ORDER.map((k) => ({ value: k, label: STATUS_LABELS[k] }))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="note" label="Ghi chú" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập ghi chú" style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="content" label="Nội dung bảo trì" style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={4} style={{ ...textAreaStyle, borderRadius: radiusPill }} placeholder="Nhập nội dung chi tiết kế hoạch bảo trì" />
            </Form.Item>
          </Form>
        </Spin>
      </Drawer>

      {/* ── View drawer ── */}
      <Drawer
        open={drawerMode === 'view'}
        onClose={closeDrawer}
        width={900}
        title="Chi tiết kế hoạch bảo trì"
      >
        {viewRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Descriptions
              bordered
              size="small"
              column={2}
              labelStyle={{ width: 200, fontWeight: t.fontWeightMedium, background: t.tableHeaderBg }}
            >
              <Descriptions.Item label="Mã kế hoạch" span={1}>{viewRecord.code || '—'}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={1}>{renderStatusBadge(viewRecord.status)}</Descriptions.Item>
              <Descriptions.Item label="Tên kế hoạch" span={2}>{viewRecord.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Đơn vị quản lý" span={1}>{viewRecord.orgUnitName || viewRecord.orgUnitId || '—'}</Descriptions.Item>
              <Descriptions.Item label="Đơn vị vận hành khai thác" span={1}>{viewRecord.operatingOrgUnitId || '—'}</Descriptions.Item>
              <Descriptions.Item label="Loại KCHT" span={1}>{infraTypeLabel(viewRecord.infrastructureType)}</Descriptions.Item>
              <Descriptions.Item label="Tên công việc bảo trì" span={1}>{viewRecord.equipment || '—'}</Descriptions.Item>
              <Descriptions.Item label="Loại công việc bảo trì" span={1}>{MAINTENANCE_TYPE_OPTIONS.find((o) => o.value === viewRecord.maintenanceType)?.label || viewRecord.maintenanceType || '—'}</Descriptions.Item>
              <Descriptions.Item label="Dự kiến bắt đầu" span={1}>{fmtDate(viewRecord.estimatedStartDate)}</Descriptions.Item>
              <Descriptions.Item label="Dự kiến kết thúc" span={1}>{fmtDate(viewRecord.estimatedEndDate)}</Descriptions.Item>
              <Descriptions.Item label="Kinh phí dự kiến" span={1}>{fmtMoney(viewRecord.estimatedCost)} VNĐ</Descriptions.Item>
              <Descriptions.Item label="Nội dung bảo trì" span={2}>{viewRecord.content || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>{viewRecord.note || '—'}</Descriptions.Item>
              <Descriptions.Item label="Người tạo" span={1}>{viewRecord.createdBy || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo" span={1}>{fmtDateTime(viewRecord.createdDate)}</Descriptions.Item>
              <Descriptions.Item label="Người cập nhật" span={1}>{viewRecord.updatedBy || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày cập nhật" span={1}>{fmtDateTime(viewRecord.updatedDate)}</Descriptions.Item>
            </Descriptions>

            {showChildWork && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: t.fontWeightBold }}>Danh sách công trình bảo trì</div>
                <DataTable columns={workColumns} dataSource={viewRecord.workItems} rowKey="id" dense scroll={{ y: DRAWER_TABLE_SCROLL_Y.detailView }} />
              </div>
            )}
            {showChildFiles && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: t.fontWeightBold }}>File kế hoạch</div>
                <DataTable columns={fileColumns} dataSource={viewRecord.files} rowKey="id" dense scroll={{ y: DRAWER_TABLE_SCROLL_Y.detailView }} />
              </div>
            )}

            {/* Xác nhận kết quả bảo trì — chỉ hiển thị khi trạng thái = Hoàn thành (brief §2 / BR-130-02, BR-130-06) */}
            {isCompleted && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: t.fontWeightBold }}>Xác nhận kết quả bảo trì</div>
                {existingResult ? (
                  <Descriptions bordered size="small" column={2} labelStyle={{ width: 200, fontWeight: t.fontWeightMedium, background: t.tableHeaderBg }}>
                    <Descriptions.Item label="Ngày bắt đầu thực tế" span={1}>{fmtDateTime(existingResult.actualStartDate)}</Descriptions.Item>
                    <Descriptions.Item label="Ngày kết thúc thực tế" span={1}>{fmtDateTime(existingResult.actualEndDate)}</Descriptions.Item>
                    <Descriptions.Item label="Mô tả kết quả" span={2}>{existingResult.resultDescription || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú kết quả" span={2}>{existingResult.resultNote || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Bộ phận thay thế" span={1}>{existingResult.replacedParts || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Thời gian ngừng (giờ)" span={1}>{existingResult.downtimeDuration ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Người ghi nhận" span={1}>{existingResult.recorder || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày ghi nhận" span={1}>{fmtDate(existingResult.recordedDate)}</Descriptions.Item>
                  </Descriptions>
                ) : canRecordResult ? (
                  <Button type="primary" style={primaryButtonStyle} onClick={openResult}>
                    Ghi nhận kết quả bảo trì
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── Result modal (HOAN_THANH only) ── */}
      <Modal
        open={resultOpen}
        onCancel={() => setResultOpen(false)}
        title="Ghi nhận kết quả bảo trì"
        width={760}
        footer={[
          <Button key="cancel" onClick={() => setResultOpen(false)} style={{ ...primaryButtonStyle, background: t.borderDefault, borderColor: t.borderDefault, color: t.textSecondary }}>
            Hủy
          </Button>,
          <Button key="save" type="primary" loading={resultSaving} style={primaryButtonStyle} onClick={handleSubmitResult}>
            Lưu kết quả
          </Button>,
        ]}
      >
        <Spin spinning={resultSaving}>
          <Form form={resultForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="actualStartDate" label="Ngày bắt đầu thực tế" style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps()} showTime format="DD/MM/YYYY HH:mm" style={{ ...inputStyle, width: '100%' }} placeholder="Chọn thời điểm" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="actualEndDate" label="Ngày kết thúc thực tế" style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps()} showTime format="DD/MM/YYYY HH:mm" style={{ ...inputStyle, width: '100%' }} placeholder="Chọn thời điểm" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="resultDescription" label="Mô tả kết quả bảo trì" style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={3} style={{ ...textAreaStyle, borderRadius: radiusPill }} placeholder="Nhập mô tả kết quả bảo trì" />
            </Form.Item>
            <Form.Item name="resultNote" label="Ghi chú kết quả" style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={2} style={{ ...textAreaStyle, borderRadius: radiusPill }} placeholder="Nhập ghi chú kết quả" />
            </Form.Item>
            <Form.Item name="replacedParts" label="Bộ phận thay thế" style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={2} style={{ ...textAreaStyle, borderRadius: radiusPill }} placeholder="Nhập các bộ phận đã thay thế" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="downtimeDuration" label="Thời gian ngừng (giờ)" style={{ marginBottom: spaceFormField }}>
                  <InputNumber style={{ ...inputStyle, width: '100%' }} min={0} placeholder="Nhập số giờ ngừng" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="recordedDate" label="Ngày ghi nhận" style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps()} style={{ ...inputStyle, width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="recorder" label="Người ghi nhận" style={{ marginBottom: spaceFormField }}>
              <Input placeholder="Nhập tên người ghi nhận" style={inputStyle} />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}

export default MaintenanceList;
