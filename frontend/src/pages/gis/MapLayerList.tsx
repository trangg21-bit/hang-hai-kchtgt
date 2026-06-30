import { useState, useCallback, useEffect } from 'react';
import {
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Tooltip,
  Popconfirm,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
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
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

export default function MapLayerList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  useEffect(() => { void fetchData(); }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

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

  const columns = [
    { title: '#', width: 60, render: (_: unknown, __: MapLayer, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 180,
      render: (code: string) => (
        <Tooltip title={code}>
          <Tag
            color="cyan"
            style={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              verticalAlign: 'bottom',
            }}
          >
            {code}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      ellipsis: true,
      render: (text: string, record: MapLayer) => (
        <Space>
          {record.visible ? (
            <EyeOutlined style={{ color: '#52c41a' }} />
          ) : (
            <EyeInvisibleOutlined style={{ color: '#d9d9d9' }} />
          )}
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Loại lớp',
      dataIndex: 'layerType',
      width: 130,
      render: (type: string) => {
        const opt = MAP_LAYER_TYPE_OPTIONS.find((o) => o.value === type);
        return <Tag>{opt?.label || type}</Tag>;
      },
    },
    {
      title: 'Opacity',
      dataIndex: 'opacity',
      width: 90,
      render: (v: number) => `${(v! * 100).toFixed(0)}%`,
    },
    {
      title: 'Thứ tự',
      dataIndex: 'order',
      width: 80,
      render: (v: number) => v,
    },
    {
      title: 'Hiển thị',
      dataIndex: 'visible',
      width: 90,
      render: (visible: boolean, record: MapLayer) => (
        <Switch
          checked={visible}
          onChange={() => handleToggleVisible(record)}
          size="small"
        />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (status: string) => {
        const s = MAP_LAYER_STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 130,
      render: (text: string) => (text ? dayjs(text).format('DD/MM/YYYY') : '—'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: MapLayer) => (
        <Space size="small">
          {hasPerm('gis.layer.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/gis/layers/${record.id}/edit`)}
              />
            </Tooltip>
          )}
          {hasPerm('gis.layer.delete') && (
            <Popconfirm
              title="Xác nhận xóa"
              description={`Bạn có chắc muốn xóa "${record.name}"?`}
              okText="Xóa"
              okType="danger"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record)}
            >
              <Tooltip title="Xóa">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tên, mã..."
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Select
                placeholder="Loại lớp"
                allowClear
                style={{ width: 160 }}
                value={filterType}
                onChange={(val) => { setFilterType(val); setPage(1); }}
                options={MAP_LAYER_TYPE_OPTIONS}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              {hasPerm('gis.layer.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/gis/layers/create')}>
                  Thêm lớp bản đồ
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
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
            ctaText="Thêm lớp bản đồ đầu tiên"
            onCta={() => navigate('/gis/layers/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<MapLayer>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1380 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, sz) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} lớp`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
