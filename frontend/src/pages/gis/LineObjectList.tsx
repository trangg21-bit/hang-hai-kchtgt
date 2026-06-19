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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { lineObjectService } from '../../services/lineObjectService';
import type { LineObject } from '../../services/lineObjectService';
import {
  LINE_OBJECT_TYPE_OPTIONS,
  LINE_OBJECT_STATUS_MAP,
} from '../../types/lineObject';
import { usePermissionStore } from '../../store/permissionStore';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

export default function LineObjectList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<LineObject[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await lineObjectService.list({
        page,
        pageSize,
        search: search || undefined,
        objectType: filterType,
        status: filterStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đối tượng đường'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterType, filterStatus]);

  useEffect(() => { void fetchData(); }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: LineObject) => {
      try {
        await lineObjectService.delete(record.id);
        toast.success('Đã xóa đối tượng đường');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: LineObject) => {
      try {
        await lineObjectService.submitForApproval(record.id);
        toast.success('Đã gửi duyệt đối tượng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: LineObject) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await lineObjectService.approveL1(record.id, approverId);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: LineObject) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await lineObjectService.approveL2(record.id, approverId);
        toast.success('Đã phê duyệt cấp 2');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const columns = [
    { title: '#', width: 60, render: (_: unknown, __: LineObject, idx: number) => (page - 1) * pageSize + idx + 1 },
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
    },
    {
      title: 'Loại',
      dataIndex: 'objectType',
      width: 140,
      render: (type: string) => {
        const opt = LINE_OBJECT_TYPE_OPTIONS.find((o) => o.value === type);
        return <Tag>{opt?.label || type}</Tag>;
      },
    },
    {
      title: 'Chiều dài (km)',
      dataIndex: 'length',
      width: 110,
      render: (v: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Vật liệu',
      dataIndex: 'material',
      width: 120,
      render: (text: string) => text || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Năm xây',
      dataIndex: 'yearBuilt',
      width: 90,
      render: (v?: number) => v || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => {
        const s = LINE_OBJECT_STATUS_MAP[status] || { color: 'default', label: status };
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
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: LineObject) => (
        <Space size="small">
          <Tooltip title="Xem">
            <Button type="link" size="small" onClick={() => navigate(`/gis/lines/${record.id}`)}>
              <span style={{ fontSize: 13 }}>Chi tiết</span>
            </Button>
          </Tooltip>
          {hasPerm('gis.line.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/gis/lines/${record.id}/edit`)}
              />
            </Tooltip>
          )}
          {hasPerm('gis.line.delete') && record.status === 'DRAFT' && (
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
          {record.status === 'DRAFT' && hasPerm('gis.line.submit') && (
            <Tooltip title="Gửi duyệt">
              <Popconfirm
                title="Gửi duyệt đối tượng?"
                okText="Gửi"
                cancelText="Hủy"
                onConfirm={() => handleSubmitApproval(record)}
              >
                <Button type="link" size="small" icon={<SendOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'APPROVED_L1' && hasPerm('gis.line.approve-l2') && (
            <Tooltip title="Phê duyệt L2">
              <Popconfirm
                title="Phê duyệt cấp 2?"
                okText="Phê duyệt"
                cancelText="Hủy"
                onConfirm={() => handleApproveL2(record)}
              >
                <Button type="link" size="small" icon={<CheckCircleOutlined />} />
              </Popconfirm>
            </Tooltip>
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
                placeholder="Loại đối tượng"
                allowClear
                style={{ width: 160 }}
                value={filterType}
                onChange={(val) => { setFilterType(val); setPage(1); }}
                options={LINE_OBJECT_TYPE_OPTIONS}
              />
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: 160 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={Object.entries(LINE_OBJECT_STATUS_MAP).map(([value, { label }]) => ({ value, label }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              {hasPerm('gis.line.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/gis/lines/create')}>
                  Thêm đối tượng đường
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
            message={error?.message || 'Không thể tải danh sách đối tượng đường'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterType || filterStatus ? 'Không tìm thấy' : 'Chưa có đối tượng đường nào'}
            ctaText="Thêm đối tượng đường đầu tiên"
            onCta={() => navigate('/gis/lines/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<LineObject>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1460 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p) => setPage(p),
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} đối tượng`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
