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
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { CangCan } from './types';
import {
  TRANG_THAI_HOAT_DONG_MAP,
  TRANG_THAI_PHE_DUYET_MAP,
} from './types';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

// Import from the new api (same endpoints as existing cangbenService)
import { fetchCangCanList, deleteCangCan, approveCangCan, rejectCangCan } from './api';
import type { CangCanListParams } from './api';

export default function CangCanListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CangCan[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const params: CangCanListParams = {
        search,
        status: filterStatus,
        approvalStatus: filterApprovalStatus,
        page: page - 1,
        pageSize,
      };
      const res = await fetchCangCanList(params);
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cảng cạn'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterStatus, filterApprovalStatus]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: CangCan) => {
      try {
        await deleteCangCan(record.id);
        toast.success('Đã xóa cảng cạn');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleApprove = useCallback(
    async (record: CangCan) => {
      try {
        await approveCangCan(record.id);
        toast.success('Phê duyệt cảng cạn thành công');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: CangCan) => {
      const reason = window.prompt('Lý do từ chối:', '');
      if (reason === null || reason.length < 10) {
        toast.warning('Lý do từ chối tối thiểu 10 ký tự.');
        return;
      }
      try {
        await rejectCangCan(record.id, reason);
        toast.success('Đã từ chối');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData],
  );

  const columns = [
    {
      title: 'STT',
      width: 60,
      render: (_: unknown, __: CangCan, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Mã cảng cạn',
      dataIndex: 'maCangCan',
      width: 160,
      render: (maCangCan: string) => (
        <Tag color="cyan">{maCangCan}</Tag>
      ),
    },
    {
      title: 'Tên cảng cạn',
      dataIndex: 'tenCangCan',
      ellipsis: true,
    },
    {
      title: 'Tỉnh/thành phố',
      dataIndex: 'tinhThanhPho',
      width: 180,
      render: (tinhThanhPho: string) => tinhThanhPho || '—',
    },
    {
      title: 'Vĩ độ',
      dataIndex: 'viDo',
      width: 100,
      render: (v: number | null) => (v != null ? v.toFixed(6) : '—'),
    },
    {
      title: 'Kinh độ',
      dataIndex: 'kinhDo',
      width: 110,
      render: (v: number | null) => (v != null ? v.toFixed(6) : '—'),
    },
    {
      title: 'Diện tích (m²)',
      dataIndex: 'dienTich',
      width: 120,
      align: 'right' as const,
      render: (v: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Công suất TEU',
      dataIndex: 'congSuatTEU',
      width: 120,
      align: 'right' as const,
      render: (v: number | null) => (v != null ? v.toFixed(2) : '—'),
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'trangThaiHoatDong',
      width: 100,
      render: (status: string) => {
        const info = TRANG_THAI_HOAT_DONG_MAP[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'trangThaiPheDuyet',
      width: 120,
      render: (status: string) => {
        const info = TRANG_THAI_PHE_DUYET_MAP[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString('vi-VN') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: CangCan) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/cangcan/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/cangcan/${record.id}/edit`)}
            />
          </Tooltip>
          {record.trangThaiPheDuyet === 'CHỜ_PHE_DUYỆT' && (
            <>
              <Tooltip title="Phê duyệt">
                <Popconfirm
                  title="Phê duyệt cảng cạn?"
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApprove(record)}
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
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa"
              description={`Bạn có chắc muốn xóa cảng cạn "${record.maCangCan}"? Dữ liệu sẽ được ẩn nhưng vẫn được lưu trữ.`}
              okText="Xóa"
              okType="danger"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
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
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                placeholder="Trạng thái hoạt động"
                allowClear
                style={{ width: 180 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={[
                  { label: 'Hoạt động', value: 'HIỆN_HÀNH' },
                  { label: 'Tạm ngừng', value: 'TẠM_NGƯNG' },
                ]}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 180 }}
                value={filterApprovalStatus}
                onChange={(val) => { setFilterApprovalStatus(val); setPage(1); }}
                options={[
                  { label: 'Chờ phê duyệt', value: 'CHỜ_PHE_DUYỆT' },
                  { label: 'Được phê duyệt', value: 'ĐƯỢC_PHE_DUYỆT' },
                  { label: 'Từ chối', value: 'TỪ_CHỐI' },
                ]}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/cangcan/create')}>
                Tạo cảng cạn
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách cảng cạn'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterStatus || filterApprovalStatus ? 'Không tìm thấy' : 'Chưa có cảng cạn nào'}
            ctaText="Tạo cảng cạn đầu tiên"
            onCta={() => navigate('/cangcan/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<CangCan>
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
                if (sz) { /* pageSize is fixed */ }
              },
              showSizeChanger: true,
              showTotal: (t: number) => `Hiển thị 1-${Math.min(pageSize, t)} của ${t} kết quả`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
