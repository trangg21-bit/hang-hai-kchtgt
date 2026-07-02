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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { heThongVTSCRUD } from '../../services/heThongVtsService';
import type { HeThongVTSResponse, ListParams } from '../../types/heThongVts';
import { useAuthStore } from '../../store/authStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import CrudPageLayout from '../../components/shared/CrudPageLayout';

const APPROVAL_STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'PROPOSED' },
  { label: 'Đang xem xét', value: 'UNDER_REVIEW' },
  { label: 'Đã phê duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

export default function HeThongVTSList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterTinhTrang, setFilterTinhTrang] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<HeThongVTSResponse[]>([]);
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
        trangThai: filterStatus,
      };
      const res = await heThongVTSCRUD.list(params);
      setDataSource(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterTinhTrang, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilterKeyword('');
    setFilterTinhTrang(undefined);
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await heThongVTSCRUD.delete(String(id));
      message.success('Xóa thành công');
      fetchData();
    } catch (err) {
      message.error(`Lỗi xóa: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const columns: ColumnsType<HeThongVTSResponse> = [
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    } as any,
    {
      title: 'Tên hệ thống',
      dataIndex: 'tenHeThong',
      key: 'tenHeThong',
      render: (val: string) => (
        <span style={{ fontWeight: 600 }}>{val || '—'}</span>
      ),
    },
    {
      title: 'Vị trí',
      dataIndex: 'viTri',
      key: 'viTri',
      ellipsis: true,
    },
    {
      title: 'Tình trạng',
      dataIndex: 'tinhTrang',
      key: 'tinhTrang',
      width: 120,
      render: (val: string) => (val ? <span style={{ color: '#52c41a' }}>{val}</span> : '—'),
    },
    {
      title: 'Mức độ phủ trách',
      dataIndex: 'mucDoPhuTrach',
      key: 'mucDoPhuTrach',
      width: 140,
      render: (val: string) => (val || '—'),
    },
    {
      title: 'Đối tác',
      dataIndex: 'doiTac',
      key: 'doiTac',
      ellipsis: true,
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
      render: (_: unknown, record: HeThongVTSResponse) => {
        const canRead = userPermissions.includes('vts:read');
        const canUpdate = userPermissions.includes('vts:update');
        const canDelete = userPermissions.includes('vts:delete');
        const isProposed = record.trangThai === 'PROPOSED';
        const isApproved = record.trangThai === 'APPROVED';

        return (
          <Space size="small" wrap>
            {canRead && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                title="Xem chi tiết"
                aria-label="Xem chi tiết"
                onClick={() => navigate(`/he-thong-vts/${record.id}`)}
              >
                Xem
              </Button>
            )}
            {canUpdate && isProposed && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                title="Chỉnh sửa"
                aria-label="Chỉnh sửa"
                onClick={() => navigate(`/he-thong-vts/${record.id}?mode=edit`)}
              >
                Sửa
              </Button>
            )}
            {canDelete && isApproved && (
              <Popconfirm
                title="Xác nhận xóa"
                description="Bạn chắc chắn muốn xóa bản ghi này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button type="link" danger size="small" icon={<DeleteOutlined />} title="Xóa" aria-label="Xóa">
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
      <Col xs={24} sm={12} md={6}>
        <Input
          placeholder="Tìm kiếm..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Tình trạng"
          options={[
            { label: 'Tốt', value: 'Tốt' },
            { label: 'Xuống cấp', value: 'Xuống cấp' },
            { label: 'Hư hỏng', value: 'Hư hỏng' },
          ]}
          value={filterTinhTrang}
          onChange={setFilterTinhTrang}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Trạng thái phê duyệt"
          options={APPROVAL_STATUS_OPTIONS}
          value={filterStatus}
          onChange={setFilterStatus}
          allowClear
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
    { title: 'Hệ thống VTS' },
  ];

  return (
    <Spin spinning={isLoading} fullscreen={isLoading}>
      <CrudPageLayout
        title="Quản lý Hệ thống VTS"
        breadcrumbs={breadcrumbs}
        filterBar={filterBar}
        canCreate={userPermissions.includes('vts:create')}
        onCreateClick={() => navigate('/he-thong-vts/create')}
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
