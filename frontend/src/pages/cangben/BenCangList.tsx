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
  benCangCRUD,
  benCangApproval,
} from '../../services/cangbenService';
import type { BenCang } from '../../types/cangben';
import { BECBANG_STATUS_MAP } from '../../types/cangben';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

export default function BenCangList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMaBen, setFilterMaBen] = useState('');
  const [filterTenBen, setFilterTenBen] = useState('');
  const [filterTuyenDuongThuy, setFilterTuyenDuongThuy] = useState('');
  const [filterLoaiBen, setFilterLoaiBen] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [dataSource, setDataSource] = useState<BenCang[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await benCangCRUD.search({
        page,
        pageSize,
        maBen: filterMaBen || undefined,
        tenBen: filterTenBen || undefined,
        loaiBen: filterLoaiBen || undefined,
        trangThaiPheDuyet: filterStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách bến cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterMaBen, filterTenBen, filterLoaiBen, filterStatus]);

  useEffect(() => { void fetchData(); }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setFilterMaBen(value);
    setFilterTenBen(value);
    setFilterTuyenDuongThuy(value);
    setFilterLoaiBen(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: BenCang) => {
      try {
        await benCangCRUD.delete(record.id);
        toast.success('Đã xóa bến cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: BenCang) => {
      try {
        await benCangApproval.approve(record.id);
        toast.success('Đã gửi duyệt bến cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: BenCang) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await benCangApproval.approve(record.id);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: BenCang) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await benCangApproval.approve(record.id);
        toast.success('Đã phê duyệt cấp 2');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: BenCang) => {
      const approverId = localStorage.getItem('user_id') || '1';
      const reason = window.prompt('Lý do từ chối:', '');
      if (reason === null) return; // user cancelled
      try {
        await benCangApproval.reject(record.id, reason);
        toast.success('Đã từ chối');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData],
  );

  const columns = [
    { title: 'STT', width: 60, render: (_: unknown, __: BenCang, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Mã',
      dataIndex: 'maBen',
      width: 160,
      render: (maBen: string) => <Tag color="cyan">{maBen}</Tag>,
    },
    {
      title: 'Tên',
      dataIndex: 'tenBen',
      ellipsis: true,
    },
    {
      title: 'Cảng biển',
      dataIndex: 'cangBienId',
      width: 180,
    },
    {
      title: 'Tuyến đường thủy',
      dataIndex: 'tuyenDuongThuy',
      ellipsis: true,
    },
    {
      title: 'Chiều dài',
      dataIndex: 'chieuDai',
      width: 110,
      render: (v: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Chiều rộng',
      dataIndex: 'chieuRong',
      width: 110,
      render: (v: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Loại bến',
      dataIndex: 'loaiBen',
      width: 140,
      ellipsis: true,
    },
    {
      title: 'Độ sâu luồng',
      dataIndex: 'doSauLuong',
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
      render: (_: unknown, record: BenCang) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/bencang/${record.id}`)}
            >
              <span style={{ fontSize: 13 }}>Chi tiết</span>
            </Button>
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/bencang/${record.id}/edit`)}
            />
          </Tooltip>
          {record.trangThaiPheDuyet === 'DRAFT' && (
            <Tooltip title="Gửi duyệt">
              <Popconfirm
                title="Gửi duyệt bến cảng?"
                description="Sau khi gửi, bến cảng sẽ chuyển sang trạng thái chờ phê duyệt cấp 1."
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
                  description="Sau khi phê duyệt, bến cảng sẽ chuyển sang trạng thái chờ phê duyệt cấp 2."
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
                  description="Sau khi phê duyệt, bến cảng sẽ được công bố chính thức."
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
                description={`Bạn có chắc muốn xóa bến cảng "${record.tenBen}"?`}
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
                value={filterMaBen}
                onChange={(e) => { setFilterMaBen(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo tên"
                allowClear
                style={{ width: 180 }}
                value={filterTenBen}
                onChange={(e) => { setFilterTenBen(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo tuyến đường thủy"
                allowClear
                style={{ width: 180 }}
                value={filterTuyenDuongThuy}
                onChange={(e) => { setFilterTuyenDuongThuy(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo loại bến"
                allowClear
                style={{ width: 160 }}
                value={filterLoaiBen}
                onChange={(e) => { setFilterLoaiBen(e.target.value); setPage(1); }}
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
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/bencang/create')}>
                Tạo bến cảng
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách bến cảng'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterMaBen || filterTenBen || filterTuyenDuongThuy || filterLoaiBen || filterStatus ? 'Không tìm thấy' : 'Chưa có bến cảng nào'}
            ctaText="Tạo bến cảng đầu tiên"
            onCta={() => navigate('/bencang/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<BenCang>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1600 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p: number, sz?: number) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t: number) => `Tổng ${t} bến cảng`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
