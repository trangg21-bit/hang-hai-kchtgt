import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Space,
  Card,
  Row,
  Col,
  Input,
  Select,
  Tooltip,
  message,
  Popconfirm,
  Table,
  Empty,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { tramRadarCRUD } from '../../services/tramRadarService';
import type { TramRadarResponse, ListParams } from '../../types/tramRadar';
import { useAuthStore } from '../../store/authStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

const APPROVAL_STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'PROPOSED' },
  { label: 'Đang xem xét', value: 'UNDER_REVIEW' },
  { label: 'Đã phê duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

const TINH_TRANG_OPTIONS = [
  { label: 'Hoạt động tốt', value: 'TOT' },
  { label: 'Hoạt động kém', value: 'KEM' },
  { label: 'Ngừng hoạt động', value: 'NGUNG' },
];

export default function TramRadarList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterTinhTrang, setFilterTinhTrang] = useState<string | undefined>();
  const [filterTrangThai, setFilterTrangThai] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<TramRadarResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const params: ListParams = {
        page: page - 1,
        size: pageSize,
        keyword: filterKeyword || undefined,
        tinhTrang: filterTinhTrang,
        trangThai: filterTrangThai,
      };
      const res = await tramRadarCRUD.search(params);
      setDataSource(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterTinhTrang, filterTrangThai]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReset = useCallback(() => {
    setFilterKeyword('');
    setFilterTinhTrang(undefined);
    setFilterTrangThai(undefined);
    setPage(1);
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await tramRadarCRUD.delete(String(id));
      message.success('Xóa thành công');
      fetchData();
    } catch (err) {
      message.error(`Lỗi xóa: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const columns: ColumnsType<TramRadarResponse> = [
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    } as any,
    {
      title: 'Tên trạm',
      dataIndex: 'tenTram',
      key: 'tenTram',
      render: (val: string) => <span style={{ fontWeight: 700 }}>{val || '—'}</span>,
    },
    {
      title: 'Vị trí',
      dataIndex: 'viTri',
      key: 'viTri',
      ellipsis: true,
    },
    {
      title: 'Kinh độ',
      dataIndex: 'kinhDo',
      key: 'kinhDo',
      width: 100,
      render: (val: number) => (val !== undefined ? val.toFixed(6) : '—'),
    },
    {
      title: 'Vĩ độ',
      dataIndex: 'viDo',
      key: 'viDo',
      width: 100,
      render: (val: number) => (val !== undefined ? val.toFixed(6) : '—'),
    },
    {
      title: 'Loại trạm',
      dataIndex: 'loaiTram',
      key: 'loaiTram',
      width: 120,
      render: (val: string) => (val ? <Tag color="blue">{val}</Tag> : '—'),
    },
    {
      title: 'Tình trạng',
      dataIndex: 'tinhTrang',
      key: 'tinhTrang',
      width: 120,
      render: (val: string) => {
        if (!val) return '—';
        const colorMap: Record<string, string> = {
          'Hoạt động tốt': 'success',
          'Hoạt động kém': 'warning',
          'Ngừng hoạt động': 'error',
        };
        return <Tag color={colorMap[val] || 'default'}>{val}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      width: 120,
      render: (status: string) => <ApprovalStatusBadge status={status} />,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: unknown, record: TramRadarResponse) => {
        const canRead = userPermissions.includes('tramradar:read');
        const canUpdate = userPermissions.includes('tramradar:update');
        const canDelete = userPermissions.includes('tramradar:delete');
        const isProposed = record.trangThai === 'PROPOSED';

        return (
          <Space size="small" wrap>
            {canRead && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/tram-radar/${record.id}`)}
                title="Xem chi tiết"
                aria-label="Xem chi tiết"
              >
                Xem
              </Button>
            )}
            {canUpdate && isProposed && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/tram-radar/${record.id}?mode=edit`)}
                title="Chỉnh sửa"
                aria-label="Chỉnh sửa"
              >
                Sửa
              </Button>
            )}
            {canDelete && record.trangThai === 'APPROVED' && (
              <Popconfirm
                title="Xác nhận xóa"
                description="Bạn chắc chắn muốn xóa bản ghi này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    } as any,
  ];

  return (
    <>
      {/* Filter Card */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm kiếm tên trạm..."
                allowClear
                value={filterKeyword}
                onSearch={(val) => { setFilterKeyword(val); setPage(1); }}
                onChange={(e) => setFilterKeyword(e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="Tình trạng"
                options={TINH_TRANG_OPTIONS}
                value={filterTinhTrang}
                onChange={(val) => { setFilterTinhTrang(val); setPage(1); }}
                allowClear
                style={{ width: 180 }}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                options={APPROVAL_STATUS_OPTIONS}
                value={filterTrangThai}
                onChange={(val) => { setFilterTrangThai(val); setPage(1); }}
                allowClear
                style={{ width: 180 }}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tram-radar/create')}>
                Thêm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table Card with Loading/Error/Empty */}
      <Card>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Đang tải dữ liệu...
          </div>
        )}
        {isError && !isLoading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#ff4d4f' }}>{error?.message || 'Lỗi tải dữ liệu'}</p>
            <Button onClick={fetchData}>Thử lại</Button>
          </div>
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <Empty description="Không có dữ liệu" />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <Table
            columns={columns}
            dataSource={dataSource.map((item) => ({ ...item, key: item.id }))}
            loading={false}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} bản ghi`,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
            size="small"
            scroll={{ x: 1200 }}
          />
        )}
      </Card>
    </>
  );
}
