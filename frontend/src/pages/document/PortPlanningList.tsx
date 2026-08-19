import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, Select } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  fetchPortPlanningList,
  createQuyHoach,
  updateQuyHoach,
  deleteQuyHoach,
} from '../../services/document/api';
import type { QuyHoachBenCangResponse, QuyHoachBenCangCreateRequest } from '../../services/document/types';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import EmptyState from '../../components/EmptyState';
import ManagementDrawer from '../../components/management/ManagementDrawer';
import { DataTable, FilterTableLayout, ScreenHeader } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import toast, { modal } from '../../components/ToastNotification';
import { colors } from '../../theme';
import {
  fontSizeMd,
  fontWeightBold,
  fontWeightMedium,
  inputStyle,
  outlineButtonStyle,
  primaryButtonStyle,
  radiusPill,
  radiusTextArea,
  selectStyle,
  spaceFormField,
  spaceMd,
  spaceSm,
  spaceXs,
  statusAttention,
  statusDraft,
  statusOperational,
  textSecondary,
} from '../../tokens';

const PLANNING_STATUS_MAP: Record<string, string> = {
  HIEN_HANH: 'Hiện hành',
  DA_THAY_THE: 'Đã thay thế',
  LICH_SU: 'Lịch sử',
};

const PLANNING_STATUS_COLOR: Record<string, string> = {
  HIEN_HANH: statusOperational,
  DA_THAY_THE: statusAttention,
  LICH_SU: statusDraft,
};

const labelProps = (label: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{label}</span>,
});

function statusBadge(value?: string) {
  const color = PLANNING_STATUS_COLOR[value || ''] || textSecondary;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: spaceXs,
      padding: `${spaceXs}px ${spaceSm}px`, borderRadius: radiusPill,
      background: `${color}15`, color, fontWeight: fontWeightMedium,
    }}>
      {PLANNING_STATUS_MAP[value || ''] || value || '—'}
    </span>
  );
}

export default function PortPlanningList() {
  const currentUser = useAuthStore((state) => state.user);
  const currentUsername = currentUser?.username;
  const hasPerm = usePermissionStore((state) => state.hasPermission);
  const [dataSource, setDataSource] = useState<QuyHoachBenCangResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [statusInput, setStatusInput] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuyHoachBenCangResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const errorText = (error: unknown, fallback: string) => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null && 'message' in error) return String((error as { message?: unknown }).message || fallback);
    return fallback;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchPortPlanningList({
        page: page - 1,
        size: pageSize,
        keyword: keyword.trim() || undefined,
        status: status || undefined,
      });
      setDataSource(response.content || []);
      setTotal(response.totalElements || 0);
      setIsError(false);
    } catch (error: unknown) {
      setIsError(true);
      toast.error(errorText(error, 'Không thể tải danh sách hồ sơ quy hoạch'));
    } finally {
      setLoading(false);
    }
  }, [keyword, page, pageSize, status]);

  useEffect(() => {
    // Data loading synchronizes the screen with the remote list endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const openDrawer = useCallback((record?: QuyHoachBenCangResponse) => {
    setEditingItem(record || null);
    if (record) {
      form.setFieldsValue({
        projectName: record.projectName,
        coQuanPheDuyet: record.coQuanPheDuyet,
        ngayPheDuyet: record.ngayPheDuyet ? dayjs(record.ngayPheDuyet) : null,
        phamViApDung: record.phamViApDung,
        tiLeBanDo: record.tiLeBanDo,
        tinhTrang: record.tinhTrang,
        duongDanFile: record.duongDanFile,
      });
    } else {
      form.resetFields();
    }
    setDrawerOpen(true);
  }, [form]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingItem(null);
    form.resetFields();
  }, [form]);

  const submitForm = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload: QuyHoachBenCangCreateRequest = {
        ...values,
        projectName: String(values.projectName || '').trim(),
        coQuanPheDuyet: String(values.coQuanPheDuyet || '').trim(),
        phamViApDung: values.phamViApDung ? String(values.phamViApDung).trim() : undefined,
        tiLeBanDo: values.tiLeBanDo ? String(values.tiLeBanDo).trim() : undefined,
        duongDanFile: values.duongDanFile ? String(values.duongDanFile).trim() : undefined,
        ngayPheDuyet: values.ngayPheDuyet ? values.ngayPheDuyet.format('YYYY-MM-DD') : undefined,
        nguoiTao: currentUsername || undefined,
      };
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
      if (!(typeof error === 'object' && error !== null && 'errorFields' in error)) toast.error(errorText(error, 'Có lỗi xảy ra khi lưu quy hoạch'));
    } finally {
      setSubmitting(false);
    }
  }, [closeDrawer, currentUsername, editingItem, form, loadData]);

  const confirmDelete = useCallback((record: QuyHoachBenCangResponse) => {
    modal.confirm({
      title: 'Xóa hồ sơ quy hoạch',
      content: 'Bạn có chắc chắn muốn xóa hồ sơ quy hoạch này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteQuyHoach(record.id);
          toast.success('Xóa hồ sơ quy hoạch thành công');
          await loadData();
        } catch (error: unknown) {
          toast.error(errorText(error, 'Lỗi khi xóa quy hoạch'));
        }
      },
    });
  }, [loadData]);

  const columns = useMemo<DataTableColumn[]>(() => [
    { key: 'stt', label: 'STT', width: 64, align: 'center', fixed: 'left', render: (_value, _record, index) => (page - 1) * pageSize + (index || 0) + 1 },
    { key: 'projectName', label: 'Tên đồ án quy hoạch', dataIndex: 'projectName', width: 280, sortable: true },
    { key: 'coQuanPheDuyet', label: 'Cơ quan phê duyệt', dataIndex: 'coQuanPheDuyet', width: 220, sortable: true },
    { key: 'ngayPheDuyet', label: 'Ngày phê duyệt', dataIndex: 'ngayPheDuyet', width: 150, sortable: true, render: (value) => value ? dayjs(value).format('DD/MM/YYYY') : '—' },
    { key: 'phamViApDung', label: 'Phạm vi áp dụng', dataIndex: 'phamViApDung', width: 260 },
    { key: 'tiLeBanDo', label: 'Tỉ lệ bản đồ', dataIndex: 'tiLeBanDo', width: 140 },
    { key: 'tinhTrang', label: 'Tình trạng', dataIndex: 'tinhTrang', width: 160, sortable: true, render: statusBadge },
    { key: 'nguoiTao', label: 'Người lập', dataIndex: 'nguoiTao', width: 160 },
  ], [page, pageSize]);

  const rowActions = useCallback((record: QuyHoachBenCangResponse) => {
    const actions: { key: string; label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    if (hasPerm('document:read')) actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => openDrawer(record) });
    if (hasPerm('portplanning:update')) actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => openDrawer(record) });
    if (hasPerm('portplanning:delete')) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => confirmDelete(record) });
    return actions;
  }, [confirmDelete, hasPerm, openDrawer]);

  const statusTabs = useMemo(() => status
    ? [{ key: status, label: PLANNING_STATUS_MAP[status] || status, count: total, color: PLANNING_STATUS_COLOR[status] || textSecondary, active: true }]
    : [{ key: 'all', label: 'Tất cả', count: total, color: textSecondary, active: true }], [status, total]);

  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tìm kiếm</div>
        <Input
          placeholder="Tìm theo tên đồ án, cơ quan phê duyệt..."
          allowClear
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          onPressEnter={() => { setKeyword(keywordInput.trim()); setPage(1); }}
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>
      {!filterCollapsed && (
        <div style={{ marginBottom: spaceFormField }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tình trạng quy hoạch</div>
          <Select
            placeholder="Tất cả tình trạng"
            allowClear
            value={statusInput}
            onChange={setStatusInput}
            options={Object.entries(PLANNING_STATUS_MAP).map(([value, label]) => ({ value, label }))}
            style={{ ...selectStyle, width: '100%' }}
          />
        </div>
      )}
    </>
  );

  const headerActions = hasPerm('portplanning:create') ? [{
    key: 'create', label: 'Tạo quy hoạch', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => openDrawer(),
  }] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader breadcrumb={[{ label: 'Văn bản & Sự cố' }, { label: 'Quy hoạch bến cảng' }]} actions={headerActions} />
      <FilterTableLayout
        filterContent={filterContent}
        statusTabs={statusTabs}
        onStatusTabChange={(key) => { const nextStatus = key === 'all' ? undefined : key; setStatus(nextStatus); setStatusInput(nextStatus); setPage(1); }}
        onFilterApply={() => { setKeyword(keywordInput.trim()); setStatus(statusInput); setPage(1); }}
        onFilterReset={() => { setKeyword(''); setKeywordInput(''); setStatus(undefined); setStatusInput(undefined); setPage(1); }}
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed((value) => !value)}
        loading={loading}
        error={isError}
        onRetry={loadData}
      >
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          loading={loading}
          scroll={{ x: 'max-content' }}
          emptyState={<EmptyState description={keyword || status ? 'Không tìm thấy hồ sơ quy hoạch phù hợp' : 'Chưa có hồ sơ quy hoạch'} />}
        />
        {dataSource.length > 0 && <Pagination total={total} current={page} pageSize={pageSize} onChange={(nextPage, nextPageSize) => { setPage(nextPage); setPageSize(nextPageSize); }} />}
      </FilterTableLayout>

      <ManagementDrawer
        title={editingItem ? 'Chỉnh sửa hồ sơ quy hoạch' : 'Tạo mới hồ sơ quy hoạch'}
        open={drawerOpen}
        onClose={closeDrawer}
        size={720}
        footer={
          <>
            <Button onClick={closeDrawer} style={outlineButtonStyle}>Hủy</Button>
            <Button type="primary" loading={submitting} onClick={submitForm} style={primaryButtonStyle}>Lưu</Button>
          </>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectName" {...labelProps('Tên đồ án quy hoạch')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên đồ án quy hoạch' }]}>
            <Input placeholder="Ví dụ: Quy hoạch chi tiết nhóm cảng biển số 1..." style={inputStyle} />
          </Form.Item>
          <Form.Item name="coQuanPheDuyet" {...labelProps('Cơ quan phê duyệt')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập cơ quan phê duyệt' }]}>
            <Input placeholder="Ví dụ: Bộ Xây dựng, Ủy ban nhân dân..." style={inputStyle} />
          </Form.Item>
          <Form.Item name="ngayPheDuyet" {...labelProps('Ngày phê duyệt')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn ngày phê duyệt' }]}>
            <DatePicker style={{ ...selectStyle, width: '100%' }} />
          </Form.Item>
          <Form.Item name="phamViApDung" {...labelProps('Phạm vi áp dụng')} style={{ marginBottom: spaceFormField }}>
            <Input.TextArea placeholder="Mô tả phạm vi áp dụng..." rows={3} style={{ borderRadius: radiusTextArea }} />
          </Form.Item>
          <Form.Item name="tiLeBanDo" {...labelProps('Tỉ lệ bản đồ')} style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Ví dụ: 1/5000, 1/10000..." style={inputStyle} />
          </Form.Item>
          <Form.Item name="tinhTrang" {...labelProps('Tình trạng quy hoạch')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn tình trạng quy hoạch' }]}>
            <Select options={Object.entries(PLANNING_STATUS_MAP).map(([value, label]) => ({ value, label }))} placeholder="Chọn tình trạng quy hoạch..." style={{ ...selectStyle, width: '100%' }} />
          </Form.Item>
          <Form.Item name="duongDanFile" {...labelProps('Đường dẫn file tài liệu')} style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Đường dẫn lưu file đính kèm..." style={inputStyle} />
          </Form.Item>
        </Form>
      </ManagementDrawer>
    </div>
  );
}
