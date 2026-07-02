import { useState, useCallback, useEffect } from 'react';
import { Button, Space, Tag, Card, Row, Col, Input, Select, Tooltip, Popconfirm } from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { benCangCRUD, benCangApproval } from '../../services/cangbenService';
import type { BenCang } from '../../types/cangben';
import { APPROVAL_STATUS_MAP, ACTIVITY_STATUS_MAP } from '../../types/cangben';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

export default function BenCangListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMaBen, setFilterMaBen] = useState('');
  const [filterTenBen, setFilterTenBen] = useState('');
  const [filterTuyenDuongThuy, setFilterTuyenDuongThuy] = useState('');
  const [filterLoaiBen, setFilterLoaiBen] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
        trangThaiHoatDong: filterStatus,
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

  useEffect(() => { void fetchData(); }, [fetchData]);

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

  const handleApprove = useCallback(
    async (record: BenCang) => {
      try {
        await benCangApproval.approve(record.id);
        toast.success('Đã phê duyệt bến cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: BenCang) => {
      const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
      if (reason === null || reason.length < 10) {
        if (reason === null) return;
        toast.warning('Lý do từ chối tối thiểu 10 ký tự');
        return;
      }
      try {
        await benCangApproval.reject(record.id, reason);
        toast.success('Đã từ chối bến cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData],
  );

  const columns: TableProps<BenCang>['columns'] = [
    {
      title: 'STT',
      width: 60,
      render: (_: unknown, __: BenCang, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Mã bến',
      dataIndex: 'maBen',
      width: 140,
      ellipsis: true,
      render: (maBen: string) => <Tag color="cyan">{maBen}</Tag>,
    },
    {
      title: 'Tên bến',
      dataIndex: 'tenBen',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Cảng biển chủ',
      dataIndex: 'cangBienId',
      width: 180,
      render: (val: string) => (
        <span
          style={{ color: '#1677ff', cursor: 'pointer' }}
          onClick={() => navigate(`/cangbien/${val}`)}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/cangbien/${val}`); }}
        >
          {val?.slice(0, 8)}…
        </span>
      ),
    },
    {
      title: 'Tuyến đường thủy',
      dataIndex: 'tuyenDuongThuy',
      width: 200,
      ellipsis: true,
      render: (v?: string) => v || '—',
    },
    {
      title: 'Chiều dài (m)',
      dataIndex: 'chieuDai',
      width: 100,
      align: 'right' as const,
      render: (v?: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Chiều rộng (m)',
      dataIndex: 'chieuRong',
      width: 100,
      align: 'right' as const,
      render: (v?: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Loại bến',
      dataIndex: 'loaiBen',
      width: 120,
      ellipsis: true,
      render: (v?: string) => v || '—',
    },
    {
      title: 'Độ sâu luồng (m)',
      dataIndex: 'doSauLuong',
      width: 110,
      align: 'right' as const,
      render: (v?: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'trangThaiHoatDong',
      width: 130,
      render: (status?: string) => {
        const s = ACTIVITY_STATUS_MAP[status as keyof typeof ACTIVITY_STATUS_MAP];
        return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{status || '—'}</Tag>;
      },
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'trangThaiPheDuyet',
      width: 140,
      render: (status?: string) => {
        const s = APPROVAL_STATUS_MAP[status as keyof typeof APPROVAL_STATUS_MAP];
        return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{status || '—'}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 140,
      render: (v?: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 360,
      fixed: 'right' as const,
      render: (_: unknown, record: BenCang) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/bencang/${record.id}`)} />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/bencang/${record.id}/edit`)} />
          </Tooltip>
          {record.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
            <>
              <Tooltip title="Phê duyệt">
                <Popconfirm
                  title="Phê duyệt bến cảng?"
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApprove(record)}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối bến cảng?"
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
          <Tooltip title="Lịch sử">
            <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => navigate(`/bencang/${record.id}/history`)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={14}>
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
                style={{ width: 140 }}
                value={filterMaBen}
                onChange={(e) => { setFilterMaBen(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo tên"
                allowClear
                style={{ width: 160 }}
                value={filterTenBen}
                onChange={(e) => { setFilterTenBen(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo tuyến"
                allowClear
                style={{ width: 160 }}
                value={filterTuyenDuongThuy}
                onChange={(e) => { setFilterTuyenDuongThuy(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo loại bến"
                allowClear
                style={{ width: 140 }}
                value={filterLoaiBen}
                onChange={(e) => { setFilterLoaiBen(e.target.value); setPage(1); }}
              />
              <Select
                placeholder="Trạng thái HĐ"
                allowClear
                style={{ width: 150 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={Object.entries(ACTIVITY_STATUS_MAP).map(([value, { label }]) => ({ value, label }))}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 170 }}
                value={filterApprovalStatus}
                onChange={(val) => { setFilterApprovalStatus(val); setPage(1); }}
                options={Object.entries(APPROVAL_STATUS_MAP).map(([value, { label }]) => ({ value, label }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={10} style={{ textAlign: 'right' }}>
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
            description={search || filterMaBen || filterTenBen || filterTuyenDuongThuy || filterLoaiBen || filterStatus || filterApprovalStatus ? 'Không tìm thấy' : 'Chưa có bến cảng nào'}
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
              showTotal: (t: number) => `Hiển thị 1-${Math.min(total, (page - 1) * pageSize + pageSize)} của ${total} kết quả`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
