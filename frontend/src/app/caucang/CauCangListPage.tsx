import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, Row, Col, Input, Select, Button, Space, Tag, Tooltip } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import {
  fetchCauCangList,
  deleteCauCang,
  approveCauCang,
  rejectCauCang,
} from './api';
import type { CauCang, CauCangListQuery, BenCangOption } from './types';


const STATUS_MAP: Record<string, { color: string; label: string }> = {
  'HIEN_HANH': { color: 'green', label: 'Hiện hành' },
  'TAM_NGUNG': { color: 'gold', label: 'Tạm ngừng' },
};

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  'CHO_PHE_DUYET': { color: 'gold', label: 'Chờ phê duyệt' },
  'DUOC_PHE_DUYET': { color: 'green', label: 'Được phê duyệt' },
  'TU_CHOI': { color: 'red', label: 'Từ chối' },
};

export default function CauCangListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>();
  const [filterApproval, setFilterApproval] = useState<string>();
  const [filterBenCangId, setFilterBenCangId] = useState<string>();
  const sortBy = 'createdAt';
  const sortOrder = 'desc';
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CauCang[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [benCangOptions, setBenCangOptions] = useState<BenCangOption[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const query: CauCangListQuery = {
        search: search || undefined,
        status: filterStatus as any,
        approvalStatus: filterApproval as any,
        benCangId: filterBenCangId || undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        page,
        pageSize,
      };
      const res = await fetchCauCangList(query);
      setDataSource(res.content);
      setTotal(res.totalElements);
    } catch (err: unknown) {
      console.error('Failed to fetch CauCang list:', err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cầu cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [search, filterStatus, filterApproval, filterBenCangId, sortBy, sortOrder, page, pageSize]);

  const fetchBenCangOptions = useCallback(async () => {
    try {
      const res = await import('./api').then((m) => m.fetchBenCangOptions());
      setBenCangOptions(res.content);
    } catch (err) {
      console.error('Failed to load BenCang options:', err);
    }
  }, []);

  useEffect(() => { void fetchBenCangOptions(); }, [fetchBenCangOptions]);
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleDelete = useCallback(
    async (record: CauCang) => {
      const confirmed = window.confirm(
        `Bạn có chắc chắn muốn xóa cầu cảng "${record.maCau}"? Dữ liệu sẽ được ẩn nhưng vẫn được lưu trữ.`
      );
      if (!confirmed) return;
      try {
        await deleteCauCang(record.id);
        toast.success('Đã xóa cầu cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleApprove = useCallback(
    async (record: CauCang) => {
      try {
        await approveCauCang(record.id);
        toast.success('Đã phê duyệt cầu cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: CauCang) => {
      const reason = window.prompt('Lý do từ chối:', '');
      if (reason === null || reason.trim().length < 10) {
        if (reason === null) return;
        toast.warning('Lý do từ chối tối thiểu 10 ký tự');
        return;
      }
      try {
        await rejectCauCang(record.id, reason);
        toast.success('Đã từ chối cầu cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData],
  );

  const columns = useMemo(
    () => [
      {
        title: 'STT',
        width: 60,
        render: (_: unknown, __: CauCang, idx: number) => page * pageSize + idx + 1,
      },
      {
        title: 'Mã cầu',
        dataIndex: 'maCau',
        width: 120,
        render: (maCau: string) => <Tag color="cyan">{maCau}</Tag>,
      },
      {
        title: 'Tên cầu',
        dataIndex: 'tenCau',
        width: 250,
        ellipsis: true,
      },
      {
        title: 'Bến cảng chủ',
        dataIndex: 'benCangId',
        width: 180,
        render: (benCangId: string) => {
          const opt = benCangOptions.find((o) => o.id === benCangId);
          return opt ? (
            <span style={{ color: '#1677ff', cursor: 'pointer' }} onClick={() => navigate(`/bencang/${benCangId}`)}>
              {opt.tenBen}
            </span>
          ) : (
            <span>—</span>
          );
        },
      },
      {
        title: 'Chiều dài (m)',
        dataIndex: 'chieuDai',
        width: 110,
        align: 'right' as const,
        render: (v: number | null) => v !== null && v !== undefined ? v.toFixed(2) : '—',
      },
      {
        title: 'Tải trọng (tấn)',
        dataIndex: 'taiTrong',
        width: 100,
        align: 'right' as const,
        render: (v: number | null) => v !== null && v !== undefined ? v.toFixed(2) : '—',
      },
      {
        title: 'Loại cầu',
        dataIndex: 'loaiCau',
        width: 100,
        ellipsis: true,
        render: (v: string) => v || '—',
      },
      {
        title: 'Trạng thái HĐ',
        dataIndex: 'trangThaiHoatDong',
        width: 100,
        render: (v: string) => {
          const s = STATUS_MAP[v];
          return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{v}</Tag>;
        },
      },
      {
        title: 'Phê duyệt',
        dataIndex: 'trangThaiPheDuyet',
        width: 110,
        render: (v: string) => {
          const s = APPROVAL_MAP[v];
          return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{v}</Tag>;
        },
      },
      {
        title: 'Ngày tạo',
        dataIndex: 'createdAt',
        width: 140,
        render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 120,
        fixed: 'right' as const,
        render: (_: unknown, record: CauCang) => (
          <Space size="small">
            <Tooltip title="Xem chi tiết">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/caucang/${record.id}`)}
              />
            </Tooltip>
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/caucang/${record.id}/edit`)}
              />
            </Tooltip>
            {record.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
              <Tooltip title="Phê duyệt">
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApprove(record)}
                />
              </Tooltip>
            )}
            {record.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
              <Tooltip title="Từ chối">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleReject(record)}
                />
              </Tooltip>
            )}
            <Tooltip title="Xóa">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [page, pageSize, benCangOptions, navigate, handleApprove, handleReject, handleDelete],
  );

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo mã, tên..."
                allowClear
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
                onClear={() => setSearch('')}
              />
              <Select
                placeholder="Trạng thái HĐ"
                allowClear
                style={{ width: 160 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(0); }}
                options={Object.entries(STATUS_MAP).map(([v, { label }]) => ({ value: v, label }))}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 180 }}
                value={filterApproval}
                onChange={(val) => { setFilterApproval(val); setPage(0); }}
                options={Object.entries(APPROVAL_MAP).map(([v, { label }]) => ({ value: v, label }))}
              />
              <Select
                placeholder="Bến cảng chủ"
                allowClear
                style={{ width: 200 }}
                value={filterBenCangId}
                onChange={(val) => { setFilterBenCangId(val); setPage(0); }}
                options={benCangOptions.map((o) => ({ value: o.id, label: o.tenBen }))}
                showSearch
                filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={() => { setPage(0); fetchData(); }} />
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
            onRetry={() => { setPage(0); fetchData(); }}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterStatus || filterApproval || filterBenCangId ? 'Không tìm thấy' : 'Chưa có cầu cảng nào'}
            ctaText="Tạo cầu cảng đầu tiên"
            onCta={() => navigate('/caucang/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<CauCang>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1600 }}
            pagination={{
              current: page + 1,
              pageSize,
              total,
              onChange: (p) => setPage(p - 1),
              showSizeChanger: true,
              showTotal: (t) => `Hiển thị 1-${Math.min(pageSize, t - page * pageSize)} của ${t} kết quả`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
