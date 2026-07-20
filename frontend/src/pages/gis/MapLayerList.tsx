import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Switch,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { mapLayerService } from '../../services/mapLayerService';
import type { MapLayer } from '../../types/mapLayer';
import {
  MAP_LAYER_TYPE_OPTIONS,
  MAP_LAYER_STATUS_MAP,
} from '../../types/mapLayer';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterBar, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import {
  spaceXs,
  statusOperational, textTertiary,
} from '../../tokens';

export default function MapLayerList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<MapLayer[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await mapLayerService.list({ page, pageSize });
      const filtered = res.data.filter((l) => {
        if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.code.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        if (filterType && l.layerType !== filterType) return false;
        return true;
      });
      setDataSource(filtered);
      setTotal(filtered.length);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách lớp bản đồ'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterType]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleToggleVisible = useCallback(
    async (record: MapLayer) => {
      const newVisible = !record.visible;
      try {
        await mapLayerService.update(record.id, { visible: newVisible });
        toast.success(newVisible ? 'Đã bật hiển thị' : 'Đã tắt hiển thị');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    },
    [fetchData],
  );

  const handleDelete = useCallback(
    async (record: MapLayer) => {
      try {
        await mapLayerService.delete(record.id);
        toast.success('Đã xóa lớp bản đồ');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  // ── List-view columns ──
  const columns = useMemo(() => [
    { key: 'stt', label: '#', width: 60, align: 'center' as const, type: 'mono' as const,
      render: (_: unknown, __: MapLayer, idx: number) =>
        <span style={{ color: textTertiary }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'code', label: 'Mã', dataIndex: 'code', width: 180,
      render: (code: string) => (
        <Tooltip title={code}>
          <Tag color="cyan" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', verticalAlign: 'bottom' }}>{code}</Tag>
        </Tooltip>) },
    { key: 'name', label: 'Tên', dataIndex: 'name',
      render: (text: string, record: MapLayer) => (
        <Space>
          {record.visible ? (
            <EyeOutlined style={{ color: statusOperational }} />
          ) : (
            <EyeInvisibleOutlined style={{ color: textTertiary }} />
          )}
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    { key: 'layerType', label: 'Loại lớp', dataIndex: 'layerType', width: 130,
      render: (type: string) => {
        const opt = MAP_LAYER_TYPE_OPTIONS.find((o) => o.value === type);
        return <Tag>{opt?.label || type}</Tag>;
      } },
    { key: 'opacity', label: 'Opacity', dataIndex: 'opacity', width: 90, align: 'center' as const,
      render: (v: number) => `${(v! * 100).toFixed(0)}%` },
    { key: 'order', label: 'Thứ tự', dataIndex: 'order', width: 80, align: 'center' as const,
      render: (v: number) => v },
    { key: 'visible', label: 'Hiển thị', dataIndex: 'visible', width: 90, align: 'center' as const,
      render: (visible: boolean, record: MapLayer) => (
        <Switch checked={visible} onChange={() => handleToggleVisible(record)} size="small" />
      ),
    },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 120, align: 'center' as const,
      type: 'status' as const,
      render: (status: string) => {
        const s = MAP_LAYER_STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      } },
    { key: 'updatedAt', label: 'Cập nhật', dataIndex: 'updatedAt', width: 130,
      type: 'date' as const,
      render: (text: string) => (text ? dayjs(text).format('DD/MM/YYYY') : '—') },
    { key: 'actions', label: 'Thao tác', width: 160, align: 'center' as const,
      type: 'action' as const,
      render: (_: unknown, record: MapLayer) => (
        <Space size={spaceXs}>
          {hasPerm('gis.layer.edit') && (
            <Tooltip title="Sửa">
              <Button type="link" size="small" icon={<EditOutlined />}
                onClick={() => navigate(`/gis/layers/${record.id}/edit`)} />
            </Tooltip>
          )}
          {hasPerm('gis.layer.delete') && (
            <Popconfirm title="Xác nhận xóa" description={`Bạn có chắc muốn xóa "${record.name}"?`}
              okText="Xóa" okType="danger" cancelText="Hủy"
              onConfirm={() => handleDelete(record)}>
              <Tooltip title="Xóa">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [page, pageSize, navigate, hasPerm, handleToggleVisible, handleDelete]);

  // ── Filter fields ──
  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, mã...' },
    { key: 'layerType', type: 'select' as const, label: 'Loại lớp', placeholder: 'Chọn loại',
      options: MAP_LAYER_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label })) },
  ], []);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterType(values.layerType || undefined);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterType(undefined);
    setPage(1);
  }, []);

  // ── Header actions ──
  const headerActions = useMemo(() => [
    hasPerm('gis.layer.create') ? {
      key: 'create', label: 'Thêm lớp bản đồ', variant: 'primary' as const,
      icon: <PlusOutlined />, onClick: () => navigate('/gis/layers/create'),
    } : null,
  ].filter(Boolean) as { key: string; label: string; variant: 'primary' | 'outline' | 'subtle'; icon: React.ReactNode; onClick: () => void }[], [hasPerm, navigate]);

  return (
    <>
      <ScreenHeader
        breadcrumb={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Quản lý KCHT trên nền bản đồ (GIS)' },
          { label: 'Quản lý lớp bản đồ' },
        ]}
        actions={headerActions}
      />

      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />

      {isLoading && <LoadingSkeleton rows={8} type="table" />}
      {isError && (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách lớp bản đồ'}
          onRetry={fetchData}
        />
      )}
      {!isLoading && !isError && dataSource.length === 0 && (
        <EmptyState
          description={search || filterType ? 'Không tìm thấy' : 'Chưa có lớp bản đồ nào'}
        />
      )}
      {!isLoading && !isError && dataSource.length > 0 && (
        <>
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            loading={false}
          />
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onChange={(p, sz) => { setPage(p); if (sz) setPageSize(sz); }}
          />
        </>
      )}
    </>
  );
}
