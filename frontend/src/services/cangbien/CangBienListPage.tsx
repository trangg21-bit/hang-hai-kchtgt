import { useState, useCallback, useEffect, useRef } from 'react';
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
  Table,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
import {
  fetchCangBienList,
  deleteCangBien,
  approveCangBien,
  rejectCangBien,
} from './api';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from './schema';
import type { CangBienResponse } from './types';
import toast from '../../components/ToastNotification';

// ── Helper: format date ─────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ── List Page ───────────────────────────────────────────────────────

export default function CangBienListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMaCang, setFilterMaCang] = useState('');
  const [filterTenCang, setFilterTenCang] = useState('');
  const [filterTinhThanhPho, setFilterTinhThanhPho] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CangBienResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchCangBienList({
        page: page - 1,
        size: pageSize,
        maCang: filterMaCang || undefined,
        tenCang: filterTenCang || undefined,
        tinhThanhPho: filterTinhThanhPho || undefined,
        trangThaiHoatDong: filterStatus,
        trangThaiPheDuyet: filterApprovalStatus,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements ?? 0);
    } catch (err: unknown) {
      setIsError(true);
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách cảng biển';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterMaCang, filterTenCang, filterTinhThanhPho, filterStatus, filterApprovalStatus]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setFilterMaCang(value);
    setFilterTenCang(value);
    setFilterTinhThanhPho(value);
    setPage(1);
  }, []);

  // Debounced search
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setFilterMaCang(value);
      setFilterTenCang(value);
      setFilterTinhThanhPho(value);
      setPage(1);
    }, 500);
  }, []);

  const handleDelete = useCallback(
    async (record: CangBienResponse) => {
      try {
        await deleteCangBien(record.id);
        toast.success('Xóa thành công');
        fetchData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Xóa thất bại';
        toast.error(msg);
      }
    },
    [fetchData],
  );

  const handleApprove = useCallback(
    async (record: CangBienResponse) => {
      try {
        await approveCangBien(record.id);
        toast.success('Phê duyệt thành công');
        fetchData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
        toast.error(msg);
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: CangBienResponse) => {
      const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
      if (reason === null || reason.length < 10) {
        if (reason !== null) toast.error('Lý do từ chối tối thiểu 10 ký tự');
        return;
      }
      try {
        await rejectCangBien(record.id, reason);
        toast.success('Từ chối thành công');
        fetchData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Từ chối thất bại';
        toast.error(msg);
      }
    },
    [fetchData],
  );

  const columns: ColumnsType<CangBienResponse> = [
    {
      title: 'STT',
      width: 60,
      render: (_: unknown, __: CangBienResponse, idx: number) =>
        (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Mã cảng',
      dataIndex: 'maCang',
      width: 160,
      render: (maCang: string) => <Tag color="cyan">{maCang}</Tag>,
    },
    {
      title: 'Tên cảng',
      dataIndex: 'tenCang',
      ellipsis: true,
      render: (text: string, record: CangBienResponse) => (
        <button
          type="button"
          style={{ background: 'none', border: 'none', color: '#1677ff', cursor: 'pointer', padding: 0 }}
          onClick={() => navigate(`/cangbien/${record.id}`)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/cangbien/${record.id}`); } }}
          aria-label={`Xem chi tiết ${text}`}
        >
          {text}
        </button>
      ),
    },
    {
      title: 'Tỉnh/thành phố',
      dataIndex: 'tinhThanhPho',
      ellipsis: true,
      render: (v: string | null) => v || '—',
    },
    {
      title: 'Vĩ độ',
      dataIndex: 'viDo',
      width: 100,
      render: (v: number | null) => (v !== null ? v.toFixed(4) : '—'),
    },
    {
      title: 'Kinh độ',
      dataIndex: 'kinhDo',
      width: 100,
      render: (v: number | null) => (v !== null ? v.toFixed(4) : '—'),
    },
    {
      title: 'Diện tích (m²)',
      dataIndex: 'dienTich',
      width: 120,
      align: 'right' as const,
      render: (v: number | null) => (v !== null ? v.toFixed(2) : '—'),
    },
    {
      title: 'Khả năng tiếp nhận',
      dataIndex: 'khaNangTiepNhan',
      width: 130,
      align: 'right' as const,
      render: (v: number | null) => (v !== null ? v.toFixed(2) : '—'),
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'trangThaiHoatDong',
      width: 130,
      render: (status: string | null) => {
        const b = status ? trangThaiHoatDongBadge(status) : { color: 'default', label: '—' };
        return <Tag color={b.color}>{b.label}</Tag>;
      },
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'trangThaiPheDuyet',
      width: 140,
      render: (status: string | null) => {
        const b = status ? trangThaiPheDuyetBadge(status) : { color: 'default', label: '—' };
        return <Tag color={b.color}>{b.label}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 150,
      render: (v: string | null) => formatDate(v),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 320,
      fixed: 'right' as const,
      render: (_: unknown, record: CangBienResponse) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/cangbien/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/cangbien/${record.id}/edit`)}
            />
          </Tooltip>
          {record.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
            <>
              <Tooltip title="Phê duyệt">
                <Popconfirm
                  title="Phê duyệt cảng biển?"
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApprove(record)}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối cảng biển?"
                  okText="Từ chối"
                  cancelText="Hủy"
                  onConfirm={() => handleReject(record)}
                >
                  <Button type="link" size="small" danger icon={<CloseCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
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
          <Tooltip title="Lịch sử">
            <Button
              type="link"
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => navigate(`/cangbien/${record.id}/history`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }} ref={searchRef}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tên, mã..."
                allowClear
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
                onChange={handleSearchInput}
                aria-label="Tìm kiếm cảng biển"
              />
              <Input
                placeholder="Lọc theo mã"
                allowClear
                style={{ width: 160 }}
                value={filterMaCang}
                onChange={(e) => { setFilterMaCang(e.target.value); setPage(1); }}
                aria-label="Lọc theo mã cảng"
              />
              <Input
                placeholder="Lọc theo tên"
                allowClear
                style={{ width: 180 }}
                value={filterTenCang}
                onChange={(e) => { setFilterTenCang(e.target.value); setPage(1); }}
                aria-label="Lọc theo tên cảng"
              />
              <Input
                placeholder="Lọc theo tỉnh/thành"
                allowClear
                style={{ width: 180 }}
                value={filterTinhThanhPho}
                onChange={(e) => { setFilterTinhThanhPho(e.target.value); setPage(1); }}
                aria-label="Lọc theo tỉnh thành"
              />
              <Select
                placeholder="Trạng thái hoạt động"
                allowClear
                style={{ width: 180 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={[
                  { label: 'Hiện hành', value: 'HIEN_HANH' },
                  { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
                ]}
                aria-label="Lọc theo trạng thái hoạt động"
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 180 }}
                value={filterApprovalStatus}
                onChange={(val) => { setFilterApprovalStatus(val); setPage(1); }}
                options={[
                  { label: 'Chờ phê duyệt', value: 'CHO_PHE_DUYET' },
                  { label: 'Được phê duyệt', value: 'DUOC_PHE_DUYET' },
                  { label: 'Từ chối', value: 'TU_CHOI' },
                ]}
                aria-label="Lọc theo trạng thái phê duyệt"
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} aria-label="Tải lại danh sách" />
              </Tooltip>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/cangbien/create')}
                aria-label="Tạo mới cảng biển"
              >
                Tạo cảng biển
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Spin spinning={isLoading} tip="Đang tải...">
          {isError && (
            <div>
              <p>Đã xảy ra lỗi khi tải danh sách.</p>
              <Button onClick={fetchData}>Thử lại</Button>
            </div>
          )}
          {!isLoading && !isError && dataSource.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p>
                {search || filterMaCang || filterTenCang
                  ? 'Không tìm thấy kết quả phù hợp.'
                  : 'Chưa có cảng biển nào.'}
              </p>
              {!search && !filterMaCang && !filterTenCang && (
                <Button type="primary" onClick={() => navigate('/cangbien/create')}>
                  Tạo cảng biển đầu tiên
                </Button>
              )}
            </div>
          )}
          {!isLoading && !isError && dataSource.length > 0 && (
            <Table<CangBienResponse>
              columns={columns}
              dataSource={dataSource}
              rowKey="id"
              scroll={{ x: 1600 }}
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: (p, sz) => {
                  setPage(p);
                  if (sz) setPageSize(sz);
                },
                showSizeChanger: true,
                showTotal: (t) => `Tổng ${t} cảng biển`,
                pageSizeOptions: ['20', '50', '100'],
              }}
              aria-label="Bảng danh sách cảng biển"
            />
          )}
        </Spin>
      </Card>
    </>
  );
}
