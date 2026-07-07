import { useState, useCallback, useEffect } from 'react';
import {
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
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
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  cangBienCRUD,
  cangBienApproval,
} from '../../services/cangbenService';
import type { CangBien } from '../../types/cangben';
import { BECBANG_STATUS_MAP } from '../../types/cangben';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

export default function CangBienList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMaCang, setFilterMaCang] = useState('');
  const [filterTenCang, setFilterTenCang] = useState('');
  const [filterTinhThanhPho, setFilterTinhThanhPho] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [dataSource, setDataSource] = useState<CangBien[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await cangBienCRUD.search({
        page,
        pageSize,
        maCang: filterMaCang || undefined,
        tenCang: filterTenCang || undefined,
        tinhThanhPho: filterTinhThanhPho || undefined,
        trangThaiPheDuyet: filterStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cảng biển'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterMaCang, filterTenCang, filterTinhThanhPho, filterStatus]);

  useEffect(() => { void fetchData(); }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setFilterMaCang(value);
    setFilterTenCang(value);
    setFilterTinhThanhPho(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: CangBien) => {
      try {
        await cangBienCRUD.delete(record.id);
        toast.success('Đã xóa cảng biển');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: CangBien) => {
      try {
        await cangBienApproval.approve(record.id);
        toast.success('Đã gửi duyệt cảng biển');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: CangBien) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await cangBienApproval.approve(record.id);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: CangBien) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await cangBienApproval.approve(record.id);
        toast.success('Đã phê duyệt cấp 2');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: CangBien) => {
      const approverId = localStorage.getItem('user_id') || '1';
      const reason = window.prompt('Lý do từ chối:', '');
      if (reason === null) return; // user cancelled
      try {
        await cangBienApproval.reject(record.id, reason);
        toast.success('Đã từ chối');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData],
  );

  const columns = [
    { title: 'STT', width: 60, render: (_: unknown, __: CangBien, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Mã',
      dataIndex: 'maCang',
      width: 160,
      render: (maCang: string) => <Tag color="cyan">{maCang}</Tag>,
    },
    {
      title: 'Tên',
      dataIndex: 'tenCang',
      ellipsis: true,
    },
    {
      title: 'Tỉnh/thành phố',
      dataIndex: 'tinhThanhPho',
      ellipsis: true,
    },
    {
      title: 'Vĩ độ',
      dataIndex: 'viDo',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '—',
    },
    {
      title: 'Kinh độ',
      dataIndex: 'kinhDo',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '—',
    },
    {
      title: 'Diện tích',
      dataIndex: 'dienTich',
      width: 110,
      render: (v: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Trạng thái hoạt động',
      dataIndex: 'trangThaiHoatDong',
      width: 160,
      render: (status: string) => {
        const s = BECBANG_STATUS_MAP[status as keyof typeof BECBANG_STATUS_MAP] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Trạng thái phê duyệt',
      dataIndex: 'trangThaiPheDuyet',
      width: 160,
      render: (status: string) => {
        const s = BECBANG_STATUS_MAP[status as keyof typeof BECBANG_STATUS_MAP] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 340,
      fixed: 'right' as const,
      render: (_: unknown, record: CangBien) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/cangbien/${record.id}`)}
            >
              <span style={{ fontSize: 13 }}>Chi tiết</span>
            </Button>
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/cangbien/${record.id}`)}
            />
          </Tooltip>
          {record.trangThaiPheDuyet === 'DRAFT' && (
            <Tooltip title="Gửi duyệt">
              <Popconfirm
                title="Gửi duyệt cảng biển?"
                description="Sau khi gửi, cảng biển sẽ chuyển sang trạng thái chờ phê duyệt cấp 1."
                okText="Gửi"
                cancelText="Hủy"
                onConfirm={() => handleSubmitApproval(record)}
              >
                <Button type="link" size="small" icon={<SendOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.trangThaiPheDuyet === 'PENDING_APPROVAL' && (
            <>
              <Tooltip title="Phê duyệt cấp 1">
                <Popconfirm
                  title="Phê duyệt cấp 1?"
                  description="Sau khi phê duyệt, cảng biển sẽ chuyển sang trạng thái chờ phê duyệt cấp 2."
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApproveL1(record)}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối?"
                  description="Bạn sẽ cần nhập lý do từ chối."
                  okText="Từ chối"
                  cancelText="Hủy"
                  onConfirm={() => handleReject(record)}
                >
                  <Button type="link" size="small" danger icon={<CloseCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
          {record.trangThaiPheDuyet === 'APPROVED_L1' && (
            <>
              <Tooltip title="Phê duyệt cấp 2">
                <Popconfirm
                  title="Phê duyệt cấp 2?"
                  description="Sau khi phê duyệt, cảng biển sẽ được công bố chính thức."
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApproveL2(record)}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối?"
                  description="Bạn sẽ cần nhập lý do từ chối."
                  okText="Từ chối"
                  cancelText="Hủy"
                  onConfirm={() => handleReject(record)}
                >
                  <Button type="link" size="small" danger icon={<CloseCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
          {record.trangThaiPheDuyet === 'DRAFT' && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa cảng biển "${record.tenCang}"?`}
                okText="Xóa"
                okType="danger"
                cancelText="Hủy"
                onConfirm={() => handleDelete(record)}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
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
              <Input
                placeholder="Lọc theo mã"
                allowClear
                style={{ width: 160 }}
                value={filterMaCang}
                onChange={(e) => { setFilterMaCang(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo tên"
                allowClear
                style={{ width: 180 }}
                value={filterTenCang}
                onChange={(e) => { setFilterTenCang(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo tỉnh/thành"
                allowClear
                style={{ width: 180 }}
                value={filterTinhThanhPho}
                onChange={(e) => { setFilterTinhThanhPho(e.target.value); setPage(1); }}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 200 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={Object.entries(BECBANG_STATUS_MAP).map(([value, { label }]) => ({ value, label }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/cangbien/create')}>
                Tạo cảng biển
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách cảng biển'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterMaCang || filterTenCang || filterTinhThanhPho || filterStatus ? 'Không tìm thấy' : 'Chưa có cảng biển nào'}
            ctaText="Tạo cảng biển đầu tiên"
            onCta={() => navigate('/cangbien/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<CangBien>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p: number, sz?: number) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t: number) => `Tổng ${t} cảng biển`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
