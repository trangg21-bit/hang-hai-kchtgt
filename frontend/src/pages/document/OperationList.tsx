import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, DatePicker, Descriptions, Drawer, Form, Input, InputNumber, Modal, Row, Select, Spin, TimePicker } from 'antd';
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
 * F-129 — Quản lý thông tin vận hành khai thác (operation_plans)
 * Ma trận Excel #35 §2: các trường Create/Edit=TRUE được BE accept đều có
 * trong form + payload (orgUnitId, operatingOrgUnitId, infrastructureType,
 * code (tự sinh — read-only), name, content, expectedStartDate/EndDate, note)
 * cùng các trường legacy (operationDate, pier, equipment, startTime, endTime,
 * status). code KHÔNG được gửi lên (BE tự sinh — OperationPlanService tạo khi
 * request.code rỗng); cột hiển thị read-only.
 * ========================================================================= */

type OperationStatusKey =
  | 'CHO_DOI_PHUY'
  | 'DANG_TIEP_NHAN'
  | 'DA_PHE_DUYET'
  | 'DANG_THANH_HANH'
  | 'HOAN_THANH'
  | 'TRI_HOAI'
  | 'HUY';

interface OperationWorkItem {
  id: string;
  infrastructureId?: string;
  infrastructureName?: string;
  infrastructureCode?: string;
  location?: string;
  portName?: string;
  createdAt?: string;
}

interface OperationFileItem {
  id: string;
  fileCategory?: string;
  fileType?: string;
  fileName?: string;
  filePath?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

interface OperationConfirmationRecord {
  id: string;
  actualStartDate?: string;
  actualEndDate?: string;
  operatingTime?: string;
  operatingStatus?: string;
  downtime?: string;
  incidentFrequency?: string;
  maxCapacity?: number;
  actualCapacity?: number;
  resultContent?: string;
  resultNote?: string;
  recorder?: string;
  recordedDate?: string;
}

interface OperationPlanRecord {
  id: string;
  operationDate?: string;
  pier?: string;
  equipment?: string;
  startTime?: string;
  endTime?: string;
  status?: OperationStatusKey;
  orgUnitId?: string;
  orgUnitName?: string;
  operatingOrgUnitId?: string;
  infrastructureType?: string;
  code?: string;
  name?: string;
  content?: string;
  expectedStartDate?: string;
  expectedEndDate?: string;
  note?: string;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  operationDetails?: unknown[];
  workItems?: OperationWorkItem[];
  files?: OperationFileItem[];
  confirmations?: OperationConfirmationRecord[];
}

type DrawerMode = 'create' | 'view' | 'edit' | null;

const STATUS_ORDER: OperationStatusKey[] = [
  'CHO_DOI_PHUY',
  'DANG_TIEP_NHAN',
  'DA_PHE_DUYET',
  'DANG_THANH_HANH',
  'HOAN_THANH',
  'TRI_HOAI',
  'HUY',
];

const STATUS_LABELS: Record<OperationStatusKey, string> = {
  CHO_DOI_PHUY: 'Chờ duyệt',
  DANG_TIEP_NHAN: 'Đang tiếp nhận',
  DA_PHE_DUYET: 'Đã duyệt',
  DANG_THANH_HANH: 'Đang thực hiện',
  HOAN_THANH: 'Hoàn thành',
  TRI_HOAI: 'Trì hoãn',
  HUY: 'Hủy',
};

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

function OperationList() {
  const t = useThemeToken();
  const hasAnyPermission = usePermissionStore((s) => s.hasAnyPermission);
  const [form] = Form.useForm();
  const [confirmForm] = Form.useForm();

  const canRead = hasAnyPermission(['operationplan:read', 'document:read']);
  const canCreate = hasAnyPermission(['operationplan:create', 'document:create']);
  const canUpdate = hasAnyPermission(['operationplan:update', 'document:update']);
  const canDelete = hasAnyPermission(['operationplan:delete', 'document:delete']);

  const [data, setData] = useState<OperationPlanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [orgUnitFilter, setOrgUnitFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [editingItem, setEditingItem] = useState<OperationPlanRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmSaving, setConfirmSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const resp = await api.get('/v1/operation-plans', { params: { page: 0, size: 1000 } });
      const raw = resp?.data?.data ?? resp?.data ?? [];
      const list: OperationPlanRecord[] = Array.isArray(raw) ? raw : raw?.content ?? [];
      setData(list);
    } catch (err: any) {
      setError(true);
      setErrorMessage(err?.message || 'Không thể tải danh sách kế hoạch vận hành');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusColor = useCallback((status?: OperationStatusKey): string => {
    switch (status) {
      case 'CHO_DOI_PHUY':
      case 'TRI_HOAI':
        return t.statusAttention;
      case 'DANG_TIEP_NHAN':
      case 'DANG_THANH_HANH':
        return t.dataSea1;
      case 'DA_PHE_DUYET':
      case 'HOAN_THANH':
        return t.statusOperational;
      case 'HUY':
        return t.statusCritical;
      default:
        return t.textSecondary;
    }
  }, [t]);

  const renderStatusBadge = useCallback((status?: OperationStatusKey) => {
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
      return [item.code, item.name, item.infrastructureType, item.pier, item.equipment, item.orgUnitName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw));
    });
  }, [data, keyword, statusFilter, orgUnitFilter]);

  const statusTabs = useMemo(() => {
    const countOf = (key: string) => (key === 'ALL' ? data.length : data.filter((i) => i.status === key).length);
    const colors: Record<string, string> = {
      ALL: t.dataSea1,
      CHO_DOI_PHUY: t.statusAttention,
      DANG_TIEP_NHAN: t.dataSea1,
      DA_PHE_DUYET: t.statusOperational,
      DANG_THANH_HANH: t.dataSea1,
      HOAN_THANH: t.statusOperational,
      TRI_HOAI: t.statusAttention,
      HUY: t.statusCritical,
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

  const openEdit = useCallback((record: OperationPlanRecord) => {
    setEditingItem(record);
    form.setFieldsValue({
      orgUnitId: record.orgUnitId,
      operatingOrgUnitId: record.operatingOrgUnitId,
      infrastructureType: record.infrastructureType,
      name: record.name,
      content: record.content,
      operationDate: toDate(record.operationDate),
      pier: record.pier,
      equipment: record.equipment,
      startTime: record.startTime ? dayjs(record.startTime, 'HH:mm:ss') : null,
      endTime: record.endTime ? dayjs(record.endTime, 'HH:mm:ss') : null,
      expectedStartDate: toDate(record.expectedStartDate),
      expectedEndDate: toDate(record.expectedEndDate),
      status: record.status,
      note: record.note,
    });
    setDrawerMode('edit');
  }, [form]);

  const openView = useCallback((record: OperationPlanRecord) => {
    setEditingItem(record);
    setDrawerMode('view');
  }, []);

  const openConfirmation = useCallback(() => {
    confirmForm.resetFields();
    confirmForm.setFieldsValue({ recordedDate: dayjs() });
    setConfirmOpen(true);
  }, [confirmForm]);

  const buildPayload = (values: Record<string, any>) => {
    const trim = (v?: string) => (v === undefined || v === null ? undefined : String(v).trim());
    return {
      operationDate: values.operationDate ? values.operationDate.format('YYYY-MM-DD') : undefined,
      pier: trim(values.pier),
      equipment: trim(values.equipment),
      startTime: values.startTime ? values.startTime.format('HH:mm:ss') : undefined,
      endTime: values.endTime ? values.endTime.format('HH:mm:ss') : undefined,
      status: values.status ?? undefined,
      orgUnitId: values.orgUnitId ?? undefined,
      operatingOrgUnitId: values.operatingOrgUnitId ?? undefined,
      infrastructureType: trim(values.infrastructureType),
      name: trim(values.name),
      content: trim(values.content),
      expectedStartDate: values.expectedStartDate ? values.expectedStartDate.format('YYYY-MM-DD') : undefined,
      expectedEndDate: values.expectedEndDate ? values.expectedEndDate.format('YYYY-MM-DD') : undefined,
      note: trim(values.note),
    };
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = buildPayload(values);
      setSaving(true);
      if (drawerMode === 'create') {
        await api.post('/v1/operation-plans', payload);
        toast.success('Tạo mới kế hoạch vận hành thành công');
      } else if (drawerMode === 'edit' && editingItem) {
        await api.put(`/v1/operation-plans/${editingItem.id}`, payload);
        toast.success('Cập nhật kế hoạch vận hành thành công');
      }
      closeDrawer();
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return; // form validation
      toast.error(err?.message || 'Lưu kế hoạch vận hành thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback((record: OperationPlanRecord) => {
    Modal.confirm({
      title: 'Xóa kế hoạch vận hành',
      content: `Bạn có chắc chắn muốn xóa kế hoạch "${record.code || record.name || record.pier || ''}"?`,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.delete(`/v1/operation-plans/${record.id}`);
          toast.success('Xóa kế hoạch vận hành thành công');
          fetchData();
        } catch (err: any) {
          toast.error(err?.message || 'Xóa kế hoạch vận hành thất bại');
        }
      },
    });
  }, [fetchData]);

  const handleSubmitConfirmation = async () => {
    if (!editingItem) return;
    try {
      const values = await confirmForm.validateFields();
      const payload = {
        actualStartDate: values.actualStartDate ? values.actualStartDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
        actualEndDate: values.actualEndDate ? values.actualEndDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
        operatingTime: values.operatingTime ? String(values.operatingTime).trim() : undefined,
        operatingStatus: values.operatingStatus ? String(values.operatingStatus).trim() : undefined,
        downtime: values.downtime ? String(values.downtime).trim() : undefined,
        incidentFrequency: values.incidentFrequency ? String(values.incidentFrequency).trim() : undefined,
        maxCapacity: values.maxCapacity ?? undefined,
        actualCapacity: values.actualCapacity ?? undefined,
        resultContent: values.resultContent ? String(values.resultContent).trim() : undefined,
        resultNote: values.resultNote ? String(values.resultNote).trim() : undefined,
        recorder: values.recorder ? String(values.recorder).trim() : undefined,
        recordedDate: values.recordedDate ? values.recordedDate.format('YYYY-MM-DD') : undefined,
      };
      setConfirmSaving(true);
      await api.post(`/v1/operation-plans/${editingItem.id}/confirmation`, payload);
      toast.success('Ghi nhận xác nhận vận hành thành công');
      setConfirmOpen(false);
      fetchData();
      const fresh = await api.get(`/v1/operation-plans/${editingItem.id}`);
      const freshData = fresh?.data?.data ?? fresh?.data;
      if (freshData) setEditingItem(freshData);
    } catch (err: any) {
      if (err?.errorFields) return;
      toast.error(err?.message || 'Ghi nhận xác nhận vận hành thất bại');
    } finally {
      setConfirmSaving(false);
    }
  };

  const rowActions = useCallback((record: OperationPlanRecord) => {
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
      { key: 'name', label: 'Tên kế hoạch', dataIndex: 'name', width: 260, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.name || '' },
      { key: 'infrastructureType', label: 'Loại KCHT', dataIndex: 'infrastructureType', width: 170, render: (v: any) => infraTypeLabel(v) },
      { key: 'orgUnitName', label: 'Đơn vị quản lý', dataIndex: 'orgUnitName', width: 220, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.orgUnitName || '' },
      { key: 'operationDate', label: 'Ngày vận hành', dataIndex: 'operationDate', width: 130, align: 'center', render: (v: any) => fmtDate(v) },
      { key: 'equipment', label: 'Trang thiết bị', dataIndex: 'equipment', width: 180, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.equipment || '' },
      { key: 'expectedStartDate', label: 'Dự kiến bắt đầu', dataIndex: 'expectedStartDate', width: 130, align: 'center', render: (v: any) => fmtDate(v) },
      { key: 'expectedEndDate', label: 'Dự kiến kết thúc', dataIndex: 'expectedEndDate', width: 130, align: 'center', render: (v: any) => fmtDate(v) },
      { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 150, align: 'center', render: (v: OperationStatusKey) => renderStatusBadge(v) },
      { key: 'updatedDate', label: 'Ngày cập nhật', dataIndex: 'updatedDate', width: 140, align: 'center', render: (v: any) => fmtDate(v) },
    ];
  }, [page, t, renderStatusBadge]);

  const viewRecord = editingItem;
  const showChildWork = (viewRecord?.workItems?.length ?? 0) > 0;
  const showChildFiles = (viewRecord?.files?.length ?? 0) > 0;
  const isCompleted = viewRecord?.status === 'HOAN_THANH';
  const existingConfirmation = viewRecord?.confirmations?.[0];

  const workColumns: DataTableColumn[] = [
    { key: 'stt', label: 'STT', width: 60, align: 'center', render: (_: unknown, __: unknown, idx?: number) => (idx ?? 0) + 1 },
    { key: 'infrastructureCode', label: 'Mã công trình', dataIndex: 'infrastructureCode', width: 200 },
    { key: 'infrastructureName', label: 'Tên công trình', dataIndex: 'infrastructureName', width: 440, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.infrastructureName || '' },
    { key: 'portName', label: 'Cảng/đơn vị', dataIndex: 'portName', width: 180, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.portName || '' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <ScreenHeader
        breadcrumbs={[
          { label: 'Văn bản & thông tin nghiệp vụ', path: '/documents' },
          { label: 'Thông tin vận hành khai thác', path: '/documents/operation' },
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
                placeholder="Tìm theo mã, tên kế hoạch, loại KCHT..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                style={inputStyle}
                allowClear
                onPressEnter={applyFilters}
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
        title={drawerMode === 'create' ? 'Thêm mới kế hoạch vận hành' : 'Chỉnh sửa kế hoạch vận hành'}
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
                  <Input placeholder="Nhập tên kế hoạch vận hành" style={inputStyle} />
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
                <Form.Item name="operationDate" label="Ngày vận hành" style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps()} style={{ ...inputStyle, width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="status" label="Trạng thái" style={{ marginBottom: spaceFormField }}>
                  <Select style={selectStyle} options={STATUS_ORDER.map((k) => ({ value: k, label: STATUS_LABELS[k] }))} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="pier" label="Cầu cảng (bến)" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập cầu cảng / bến" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="equipment" label="Trang thiết bị" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập trang thiết bị vận hành" style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="startTime" label="Giờ bắt đầu" style={{ marginBottom: spaceFormField }}>
                  <TimePicker format="HH:mm" style={{ ...inputStyle, width: '100%' }} placeholder="Giờ bắt đầu" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="endTime" label="Giờ kết thúc" style={{ marginBottom: spaceFormField }}>
                  <TimePicker format="HH:mm" style={{ ...inputStyle, width: '100%' }} placeholder="Giờ kết thúc" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="expectedStartDate" label="Dự kiến bắt đầu" style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps()} style={{ ...inputStyle, width: '100%' }} format="DD/MM/YYYY" placeholder="Ngày dự kiến" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="expectedEndDate" label="Dự kiến kết thúc" style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps()} style={{ ...inputStyle, width: '100%' }} format="DD/MM/YYYY" placeholder="Ngày dự kiến" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="note" label="Ghi chú" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập ghi chú" style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="content" label="Nội dung kế hoạch" style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={4} style={{ ...textAreaStyle, borderRadius: radiusPill }} placeholder="Nhập nội dung chi tiết kế hoạch vận hành" />
            </Form.Item>
          </Form>
        </Spin>
      </Drawer>

      {/* ── View drawer ── */}
      <Drawer
        open={drawerMode === 'view'}
        onClose={closeDrawer}
        width={900}
        title="Chi tiết kế hoạch vận hành"
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
              <Descriptions.Item label="Ngày vận hành" span={1}>{fmtDate(viewRecord.operationDate)}</Descriptions.Item>
              <Descriptions.Item label="Cầu cảng (bến)" span={1}>{viewRecord.pier || '—'}</Descriptions.Item>
              <Descriptions.Item label="Trang thiết bị" span={1}>{viewRecord.equipment || '—'}</Descriptions.Item>
              <Descriptions.Item label="Giờ bắt đầu" span={1}>{viewRecord.startTime || '—'}</Descriptions.Item>
              <Descriptions.Item label="Giờ kết thúc" span={1}>{viewRecord.endTime || '—'}</Descriptions.Item>
              <Descriptions.Item label="Dự kiến bắt đầu" span={1}>{fmtDate(viewRecord.expectedStartDate)}</Descriptions.Item>
              <Descriptions.Item label="Dự kiến kết thúc" span={1}>{fmtDate(viewRecord.expectedEndDate)}</Descriptions.Item>
              <Descriptions.Item label="Nội dung" span={2}>{viewRecord.content || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>{viewRecord.note || '—'}</Descriptions.Item>
              <Descriptions.Item label="Người tạo" span={1}>{viewRecord.createdBy || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo" span={1}>{fmtDateTime(viewRecord.createdDate)}</Descriptions.Item>
              <Descriptions.Item label="Người cập nhật" span={1}>{viewRecord.updatedBy || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày cập nhật" span={1}>{fmtDateTime(viewRecord.updatedDate)}</Descriptions.Item>
            </Descriptions>

            {showChildWork && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: t.fontWeightBold }}>Danh sách công trình vận hành</div>
                <DataTable columns={workColumns} dataSource={viewRecord.workItems} rowKey="id" dense scroll={{ y: DRAWER_TABLE_SCROLL_Y.detailView }} />
              </div>
            )}
            {showChildFiles && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: t.fontWeightBold }}>File kế hoạch</div>
                <DataTable
                  columns={[
                    { key: 'stt', label: 'STT', width: 60, align: 'center', render: (_: unknown, __: unknown, idx?: number) => (idx ?? 0) + 1 },
                    { key: 'fileName', label: 'Tên tệp', dataIndex: 'fileName', width: 380, render: (v: any) => (v ? <span title={v}>{v}</span> : '—'), cellTitle: (r: any) => r?.fileName || '' },
                    { key: 'fileCategory', label: 'Phân loại', dataIndex: 'fileCategory', width: 150, render: (v: any) => v || '—' },
                    { key: 'uploadedAt', label: 'Thời điểm tải lên', dataIndex: 'uploadedAt', width: 170, render: (v: any) => fmtDateTime(v) },
                  ]}
                  dataSource={viewRecord.files}
                  rowKey="id"
                  dense
                  scroll={{ y: DRAWER_TABLE_SCROLL_Y.detailView }}
                />
              </div>
            )}

            {/* Tab Xác nhận — chỉ hiển thị khi trạng thái = Hoàn thành (brief §2 / BR-129-02) */}
            {isCompleted && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: t.fontWeightBold }}>Xác nhận vận hành</div>
                {existingConfirmation ? (
                  <Descriptions bordered size="small" column={2} labelStyle={{ width: 200, fontWeight: t.fontWeightMedium, background: t.tableHeaderBg }}>
                    <Descriptions.Item label="Ngày bắt đầu thực tế" span={1}>{fmtDateTime(existingConfirmation.actualStartDate)}</Descriptions.Item>
                    <Descriptions.Item label="Ngày kết thúc thực tế" span={1}>{fmtDateTime(existingConfirmation.actualEndDate)}</Descriptions.Item>
                    <Descriptions.Item label="Thời gian vận hành" span={1}>{existingConfirmation.operatingTime || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Tình trạng vận hành" span={1}>{existingConfirmation.operatingStatus || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Thời gian ngừng" span={1}>{existingConfirmation.downtime || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Tần suất sự cố" span={1}>{existingConfirmation.incidentFrequency || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Công suất thiết kế" span={1}>{existingConfirmation.maxCapacity ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Công suất thực tế" span={1}>{existingConfirmation.actualCapacity ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Kết quả vận hành" span={2}>{existingConfirmation.resultContent || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú kết quả" span={2}>{existingConfirmation.resultNote || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Người ghi nhận" span={1}>{existingConfirmation.recorder || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày ghi nhận" span={1}>{fmtDate(existingConfirmation.recordedDate)}</Descriptions.Item>
                  </Descriptions>
                ) : canUpdate ? (
                  <Button type="primary" style={primaryButtonStyle} onClick={openConfirmation}>
                    Ghi nhận xác nhận vận hành
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── Confirmation modal (HOAN_THANH only) ── */}
      <Modal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title="Ghi nhận xác nhận vận hành"
        width={760}
        footer={[
          <Button key="cancel" onClick={() => setConfirmOpen(false)} style={{ ...primaryButtonStyle, background: t.borderDefault, borderColor: t.borderDefault, color: t.textSecondary }}>
            Hủy
          </Button>,
          <Button key="save" type="primary" loading={confirmSaving} style={primaryButtonStyle} onClick={handleSubmitConfirmation}>
            Lưu xác nhận
          </Button>,
        ]}
      >
        <Spin spinning={confirmSaving}>
          <Form form={confirmForm} layout="vertical">
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
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="operatingTime" label="Thời gian vận hành" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Ví dụ: 8 giờ/ngày" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operatingStatus" label="Tình trạng vận hành" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập tình trạng vận hành" style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="downtime" label="Thời gian ngừng" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập thời gian ngừng hoạt động" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="incidentFrequency" label="Tần suất sự cố" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập tần suất sự cố" style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="maxCapacity" label="Công suất thiết kế" style={{ marginBottom: spaceFormField }}>
                  <InputNumber style={{ ...inputStyle, width: '100%' }} min={0} placeholder="Nhập công suất" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="actualCapacity" label="Công suất thực tế" style={{ marginBottom: spaceFormField }}>
                  <InputNumber style={{ ...inputStyle, width: '100%' }} min={0} placeholder="Nhập công suất" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="resultContent" label="Kết quả vận hành" style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={3} style={{ ...textAreaStyle, borderRadius: radiusPill }} placeholder="Nhập kết quả vận hành" />
            </Form.Item>
            <Form.Item name="resultNote" label="Ghi chú kết quả" style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={2} style={{ ...textAreaStyle, borderRadius: radiusPill }} placeholder="Nhập ghi chú" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="recorder" label="Người ghi nhận" style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập tên người ghi nhận" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="recordedDate" label="Ngày ghi nhận" style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps()} style={{ ...inputStyle, width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}

export default OperationList;
