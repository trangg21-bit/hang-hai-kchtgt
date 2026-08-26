import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, Select } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  fetchIncidentList,
  createSuCo,
  updateSuCo,
  deleteSuCo,
} from '../../services/document/api';
import type { SuCoResponse, SuCoCreateRequest } from '../../services/document/types';
import { usePermissionStore } from '../../store/permissionStore';
import EmptyState from '../../components/EmptyState';
import ManagementDrawer from '../../components/management/ManagementDrawer';
import { DataTable, FilterTableLayout, ScreenHeader } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import toast, { modal } from '../../components/ToastNotification';
import { colors } from '../../theme';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';
import {
  actionPrimary,
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
  textPrimary,
  textSecondary,
} from '../../tokens';

const PROCESSING_STATUS_MAP: Record<string, string> = {
  TIEP_NHAN: 'Tiếp nhận',
  DANG_XU_LY: 'Đang xử lý',
  DA_XU_LY: 'Đã xử lý',
  DA_DONG: 'Đã đóng',
};

const SEVERITY_MAP: Record<string, string> = {
  NHE: 'Nhẹ',
  TRUNG_BINH: 'Trung bình',
  NGHIEM_TRONG: 'Nghiêm trọng',
  CUC_NGIEM_TRONG: 'Cực kỳ nghiêm trọng',
};

const STATUS_COLOR_MAP: Record<string, string> = {
  TIEP_NHAN: statusAttention,
  DANG_XU_LY: actionPrimary,
  DA_XU_LY: statusOperational,
  DA_DONG: statusDraft,
};

function formatDate(value?: string) {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—';
}

function statusBadge(value?: string) {
  const color = STATUS_COLOR_MAP[value || ''] || textSecondary;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: spaceXs,
      padding: `${spaceXs}px ${spaceSm}px`, borderRadius: radiusPill,
      background: `${color}15`, color, fontWeight: fontWeightMedium,
    }}>
      {PROCESSING_STATUS_MAP[value || ''] || value || '—'}
    </span>
  );
}

export default function IncidentList() {
  const hasPerm = usePermissionStore((state) => state.hasPermission);
  const [dataSource, setDataSource] = useState<SuCoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [location, setLocation] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SuCoResponse | null>(null);
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
      const response = await fetchIncidentList({
        page: page - 1,
        size: pageSize,
        viTri: location.trim() || undefined,
      });
      setDataSource(response.content || []);
      setTotal(response.totalElements || 0);
      setIsError(false);
    } catch (error: unknown) {
      setIsError(true);
      toast.error(errorText(error, 'Không thể tải danh sách hồ sơ sự cố'));
    } finally {
      setLoading(false);
    }
  }, [location, page, pageSize]);

  useEffect(() => {
    // Data loading synchronizes the screen with the remote list endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const openDrawer = useCallback((record?: SuCoResponse) => {
    setEditingItem(record || null);
    if (record) {
      form.setFieldsValue({
        thoiGianPhatHien: record.thoiGianPhatHien ? dayjs(record.thoiGianPhatHien) : null,
        viTri: record.viTri,
        mucDoNghiemTrong: record.mucDoNghiemTrong,
        tinhTrangXuLy: record.tinhTrangXuLy,
        nguoiBaoCao: record.nguoiBaoCao,
        moTa: record.moTa,
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
      const payload: SuCoCreateRequest = {
        ...values,
        thoiGianPhatHien: values.thoiGianPhatHien ? values.thoiGianPhatHien.toISOString() : undefined,
        viTri: String(values.viTri || '').trim(),
        nguoiBaoCao: String(values.nguoiBaoCao || '').trim(),
        moTa: values.moTa ? String(values.moTa).trim() : undefined,
      };
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
      if (!(typeof error === 'object' && error !== null && 'errorFields' in error)) toast.error(errorText(error, 'Có lỗi xảy ra khi lưu sự cố'));
    } finally {
      setSubmitting(false);
    }
  }, [closeDrawer, editingItem, form, loadData]);

  const confirmDelete = useCallback((record: SuCoResponse) => {
    modal.confirm({
      title: 'Xóa hồ sơ sự cố',
      content: 'Bạn có chắc chắn muốn xóa hồ sơ sự cố này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteSuCo(record.id);
          toast.success('Xóa hồ sơ sự cố thành công');
          await loadData();
        } catch (error: unknown) {
          toast.error(errorText(error, 'Lỗi khi xóa sự cố'));
        }
      },
    });
  }, [loadData]);

  const columns = useMemo<DataTableColumn[]>(() => [
    { key: 'stt', label: 'STT', width: 64, align: 'center', fixed: 'left', render: (_value, _record, index) => (page - 1) * pageSize + (index || 0) + 1 },
    { key: 'thoiGianPhatHien', label: 'Thời gian phát hiện', dataIndex: 'thoiGianPhatHien', width: 160, sortable: true, render: formatDate },
    { key: 'viTri', label: 'Vị trí/Địa điểm', dataIndex: 'viTri', width: 240, sortable: true },
    { key: 'mucDoNghiemTrong', label: 'Mức độ', dataIndex: 'mucDoNghiemTrong', width: 160, sortable: true, render: (value) => SEVERITY_MAP[value] || value || '—' },
    { key: 'tinhTrangXuLy', label: 'Tình trạng xử lý', dataIndex: 'tinhTrangXuLy', width: 160, sortable: true, render: statusBadge },
    { key: 'nguoiBaoCao', label: 'Người báo cáo', dataIndex: 'nguoiBaoCao', width: 160 },
    { key: 'moTa', label: 'Mô tả', dataIndex: 'moTa', width: 280 },
  ], [page, pageSize]);

  const rowActions = useCallback((record: SuCoResponse) => {
    const actions: { key: string; label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    if (hasPerm('document:read')) actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => openDrawer(record) });
    if (hasPerm('incident:update')) actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => openDrawer(record) });
    if (hasPerm('incident:delete')) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => confirmDelete(record) });
    return actions;
  }, [confirmDelete, hasPerm, openDrawer]);

  const statusTabs = useMemo(() => [{
    key: 'all', label: 'Tất cả', count: total, color: textSecondary, active: true,
  }], [total]);

  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tìm kiếm</div>
        <Input
          placeholder="Tìm theo vị trí sự cố..."
          allowClear
          value={locationInput}
          onChange={(event) => setLocationInput(event.target.value)}
          onPressEnter={() => { setLocation(locationInput.trim()); setPage(1); }}
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>
      {!filterCollapsed && <div style={{ color: textSecondary, fontSize: fontSizeMd, marginTop: spaceSm }}>Có thể lọc thêm theo mức độ trong màn chi tiết sự cố.</div>}
    </>
  );

  const headerActions = hasPerm('incident:create') ? [{
    key: 'create', label: 'Ghi nhận sự cố', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => openDrawer(),
  }] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader breadcrumb={[{ label: 'Văn bản & Sự cố' }, { label: 'Sự cố hàng hải' }]} actions={headerActions} />
      <FilterTableLayout
        filterContent={filterContent}
        statusTabs={statusTabs}
        onStatusTabChange={() => undefined}
        onFilterApply={() => { setLocation(locationInput.trim()); setPage(1); }}
        onFilterReset={() => { setLocation(''); setLocationInput(''); setPage(1); }}
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
          emptyState={<EmptyState description={location ? 'Không tìm thấy hồ sơ sự cố phù hợp' : 'Chưa có hồ sơ sự cố'} />}
        />
        {dataSource.length > 0 && <Pagination total={total} current={page} pageSize={pageSize} onChange={(nextPage, nextPageSize) => { setPage(nextPage); setPageSize(nextPageSize); }} />}
      </FilterTableLayout>

      <ManagementDrawer
        title={editingItem ? 'Chỉnh sửa hồ sơ sự cố' : 'Ghi nhận hồ sơ sự cố mới'}
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
        <Form form={form} layout="vertical" style={{ color: textPrimary }}>
          <Form.Item name="viTri" {...labelProps('Vị trí/Địa điểm xảy ra')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}>
            <Input placeholder="Tọa độ hoặc lý trình luồng hàng hải..." style={inputStyle} />
          </Form.Item>
          <Form.Item name="thoiGianPhatHien" {...labelProps('Thời gian phát hiện')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn thời gian phát hiện' }]}>
            <DatePicker showTime style={{ ...selectStyle, width: '100%' }} />
          </Form.Item>
          <Form.Item name="mucDoNghiemTrong" {...labelProps('Mức độ nghiêm trọng')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn mức độ nghiêm trọng' }]}>
            <Select options={Object.entries(SEVERITY_MAP).map(([value, label]) => ({ value, label }))} placeholder="Chọn mức độ nghiêm trọng..." style={{ ...selectStyle, width: '100%' }} />
          </Form.Item>
          <Form.Item name="tinhTrangXuLy" {...labelProps('Tình trạng xử lý')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn tình trạng xử lý' }]}>
            <Select options={Object.entries(PROCESSING_STATUS_MAP).map(([value, label]) => ({ value, label }))} placeholder="Chọn tình trạng xử lý..." style={{ ...selectStyle, width: '100%' }} />
          </Form.Item>
          <Form.Item name="nguoiBaoCao" {...labelProps('Người báo cáo')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập người báo cáo' }]}>
            <Input placeholder="Nhập họ và tên người báo cáo..." style={inputStyle} />
          </Form.Item>
          <Form.Item name="moTa" {...labelProps('Mô tả chi tiết')} style={{ marginBottom: spaceFormField }}>
            <Input.TextArea placeholder="Mô tả diễn biến chi tiết sự việc..." rows={5} style={{ borderRadius: radiusTextArea }} />
          </Form.Item>
        </Form>
      </ManagementDrawer>
    </div>
  );
}
