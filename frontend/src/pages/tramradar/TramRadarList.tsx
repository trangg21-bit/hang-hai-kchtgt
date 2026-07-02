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
  Spin,
  Empty,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { tramRadarCRUD } from '../../services/tramRadarService';
import type { TramRadarResponse, ListParams } from '../../types/tramRadar';
import { useAuthStore } from '../../store/authStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import CrudPageLayout from '../../components/shared/CrudPageLayout';

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

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

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

  const filterBar = (
    <Row gutter={16} align="middle">
      <Col xs={24} sm={12} md={8}>
        <Input
          placeholder="Tìm kiếm tên trạm..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Select
          placeholder="Tình trạng"
          options={TINH_TRANG_OPTIONS}
          value={filterTinhTrang}
          onChange={setFilterTinhTrang}
          allowClear
          style={{ width: '100%' }}
        />
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Select
          placeholder="Trạng thái phê duyệt"
          options={APPROVAL_STATUS_OPTIONS}
          value={filterTrangThai}
          onChange={setFilterTrangThai}
          allowClear
          style={{ width: '100%' }}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} block>
          Tìm kiếm
        </Button>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Button icon={<ReloadOutlined />} onClick={handleReset} block>
          Xóa bộ lọc
        </Button>
      </Col>
    </Row>
  );

  if (isError && !isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Empty
            description={error?.message || 'Lỗi tải dữ liệu'}
            style={{ marginTop: '50px' }}
          />
          <Button onClick={fetchData} style={{ marginTop: '16px' }}>
            Thử lại
          </Button>
        </Card>
      </div>
    );
  }

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Trạm Radar' },
  ];

  return (
    <Spin spinning={isLoading} fullscreen={isLoading}>
      <CrudPageLayout
        title="Quản lý Trạm Radar"
        breadcrumbs={breadcrumbs}
        filterBar={filterBar}
        canCreate={userPermissions.includes('tramradar:create')}
        onCreateClick={() => navigate('/tram-radar/create')}
        createButtonText="Thêm mới"
        tableProps={{
          columns: columns as any,
          dataSource: dataSource.map((item) => ({ ...item, key: item.id })),
          loading: isLoading,
          pagination: {
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bản ghi`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          },
        }}
      />
    </Spin>
  );
}
