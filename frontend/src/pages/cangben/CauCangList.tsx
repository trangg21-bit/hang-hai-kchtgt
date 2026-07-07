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
  cauCangCRUD,
  cauCangApproval,
} from '../../services/cangbenService';
import type { CauCang } from '../../types/cangben';
import {
  BECBANG_STATUS_MAP,
  CAUCANG_LOAI_OPTIONS,
  CAUCANG_LOAI_MAP,
} from '../../types/cangben';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

export default function CauCangList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMa, setFilterMa] = useState('');
  const [filterTen, setFilterTen] = useState('');
  const [filterLoai, setFilterLoai] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [dataSource, setDataSource] = useState<CauCang[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await cauCangCRUD.search({
        page,
        pageSize,
        maCau: filterMa || undefined,
        tenCau: filterTen || undefined,
        loaiCau: filterLoai,
        status: filterStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cầu cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterMa, filterTen, filterLoai, filterStatus]);

  useEffect(() => { void fetchData(); }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setFilterMa(value);
    setFilterTen(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: CauCang) => {
      try {
        await cauCangCRUD.delete(record.id);
        toast.success('Đã xóa cầu cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: CauCang) => {
      try {
        await cauCangApproval.submitForApproval(record.id);
        toast.success('Đã gửi duyệt cầu cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: CauCang) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await cauCangApproval.approveL1(record.id, approverId);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: CauCang) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await cauCangApproval.approveL2(record.id, approverId);
        toast.success('Đã phê duyệt cấp 2');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: CauCang) => {
      const approverId = localStorage.getItem('user_id') || '1';
      const reason = window.prompt('Lý do từ chối:', '');
      if (reason === null) return; // user cancelled
      try {
        await cauCangApproval.reject(record.id, reason, approverId);
        toast.success('Đã từ chối');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData],
  );

  const columns = [
    { title: '#', width: 60, render: (_: unknown, __: CauCang, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Mã',
      dataIndex: 'maCau',
      width: 160,
      render: (maCau: string) => <Tag color="cyan">{maCau}</Tag>,
    },
    {
      title: 'Tên',
      dataIndex: 'tenCau',
      ellipsis: true,
    },
    {
      title: 'Bến cảng',
      dataIndex: 'benCangId',
      width: 160,
      render: (benCangId: string) => benCangId || '—',
    },
    {
      title: 'Chiều dài',
      dataIndex: 'chieuDai',
      width: 110,
      render: (v: number) => v?.toFixed(1) || '—',
    },
    {
      title: 'Tải trọng',
      dataIndex: 'taiTrong',
      width: 120,
      render: (v: number) => v?.toFixed(1) || '—',
    },
    {
      title: 'Loại cầu',
      dataIndex: 'loaiCau',
      width: 160,
      render: (loaiCau: string) => {
        const m = CAUCANG_LOAI_MAP[loaiCau as keyof typeof CAUCANG_LOAI_MAP];
        return m ? <Tag color={m.color}>{CAUCANG_LOAI_OPTIONS.find((o) => o.value === loaiCau)?.label || loaiCau}</Tag> : <Tag>{loaiCau}</Tag>;
      },
    },
    {
      title: 'Trạng thái hoạt động',
      dataIndex: 'isActive',
      width: 140,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Hoạt động' : 'Ngừng'}</Tag>
      ),
    },
    {
      title: 'Trạng thái phê duyệt',
      dataIndex: 'approvalStatus',
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
      render: (_: unknown, record: CauCang) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/caucang/${record.id}`)}
            >
              <span style={{ fontSize: 13 }}>Chi tiết</span>
            </Button>
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/caucang/${record.id}`)}
            />
          </Tooltip>
          {record.status === 'DRAFT' && (
            <Tooltip title="Gửi duyệt">
              <Popconfirm
                title="Gửi duyệt cầu cảng?"
                description="Sau khi gửi, cầu cảng sẽ chuyển sang trạng thái chờ phê duyệt cấp 1."
                okText="Gửi"
                cancelText="Hủy"
                onConfirm={() => handleSubmitApproval(record)}
              >
                <Button type="link" size="small" icon={<SendOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'PENDING_APPROVAL' && (
            <>
              <Tooltip title="Phê duyệt cấp 1">
                <Popconfirm
                  title="Phê duyệt cấp 1?"
                  description="Sau khi phê duyệt, cầu cảng sẽ chuyển sang trạng thái chờ phê duyệt cấp 2."
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
          {record.status === 'APPROVED_L1' && (
            <>
              <Tooltip title="Phê duyệt cấp 2">
                <Popconfirm
                  title="Phê duyệt cấp 2?"
                  description="Sau khi phê duyệt, cầu cảng sẽ được công bố chính thức."
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
          {record.status === 'DRAFT' && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa cầu cảng "${record.tenCau}"?`}
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
                placeholder="Tìm theo mã, tên..."
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Input
                placeholder="Lọc theo mã"
                allowClear
                style={{ width: 160 }}
                value={filterMa}
                onChange={(e) => { setFilterMa(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo tên"
                allowClear
                style={{ width: 180 }}
                value={filterTen}
                onChange={(e) => { setFilterTen(e.target.value); setPage(1); }}
              />
              <Select
                placeholder="Loại cầu cảng"
                allowClear
                style={{ width: 180 }}
                value={filterLoai}
                onChange={(val) => { setFilterLoai(val); setPage(1); }}
                options={CAUCANG_LOAI_OPTIONS}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 180 }}
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
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/caucang/create')}>
                Tạo cầu cảng
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách cầu cảng'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterMa || filterTen || filterLoai || filterStatus ? 'Không tìm thấy' : 'Chưa có cầu cảng nào'}
            ctaText="Tạo cầu cảng đầu tiên"
            onCta={() => navigate('/caucang/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<CauCang>
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
              showTotal: (t: number) => `Tổng ${t} cầu cảng`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
