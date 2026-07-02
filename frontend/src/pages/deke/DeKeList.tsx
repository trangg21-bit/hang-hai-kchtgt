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
import { dekeCRUD } from '../../services/deKeService';
import type { DeKeResponse, ListParams } from '../../types/deKe';
import { useAuthStore } from '../../store/authStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import CrudPageLayout from '../../components/shared/CrudPageLayout';

const APPROVAL_STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'PROPOSED' },
  { label: 'Đang xem xét', value: 'UNDER_REVIEW' },
  { label: 'Đã phê duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

const LOAI_DE_OPTIONS = [
  { label: 'Đê đất', value: 'DE_DAT' },
  { label: 'Đê bê tông', value: 'DE_BETONG' },
  { label: 'Kè đá', value: 'KE_DA' },
  { label: 'Kè bê tông', value: 'KE_BETONG' },
  { label: 'Khác', value: 'KAC' },
];

const TINH_TRANG_OPTIONS = [
  { label: 'Tốt', value: 'TOT' },
  { label: 'Xuống cấp', value: 'XUONG_CAP' },
  { label: 'Hư hỏng', value: 'HU_HOng' },
];

export default function DeKeList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterLoaiDe, setFilterLoaiDe] = useState<string | undefined>();
  const [filterTinhTrang, setFilterTinhTrang] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<DeKeResponse[]>([]);
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
        loaiDe: filterLoaiDe,
        tinhTrang: filterTinhTrang,
        trangThaiPheDuyet: filterStatus as any,
      };
      const res = await dekeCRUD.search(params);
      setDataSource(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterLoaiDe, filterTinhTrang, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilterKeyword('');
    setFilterLoaiDe(undefined);
    setFilterTinhTrang(undefined);
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await dekeCRUD.delete(String(id));
      message.success('Xóa thành công');
      fetchData();
    } catch (err) {
      message.error(`Lỗi xóa: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const columns: ColumnsType<DeKeResponse> = [
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    } as any,
    {
      title: 'Loại đê',
      dataIndex: 'loaiDe',
      key: 'loaiDe',
      width: 120,
      render: (val: string) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      title: 'Vị trí',
      dataIndex: 'viTri',
      key: 'viTri',
      ellipsis: true,
    },
    {
      title: 'Chiều dài (m)',
      dataIndex: 'chieuDai',
      key: 'chieuDai',
      width: 100,
      render: (val: number) => (val !== undefined ? val.toFixed(2) : '—'),
    },
    {
      title: 'Chiều rộng (m)',
      dataIndex: 'chieuRong',
      key: 'chieuRong',
      width: 100,
      render: (val: number) => (val !== undefined ? val.toFixed(2) : '—'),
    },
    {
      title: 'Chiều cao (m)',
      dataIndex: 'chieuCao',
      key: 'chieuCao',
      width: 100,
      render: (val: number) => (val !== undefined ? val.toFixed(2) : '—'),
    },
    {
      title: 'Mặt vật liệu',
      dataIndex: 'matVatLieu',
      key: 'matVatLieu',
      width: 120,
      render: (val: string) => val || '—',
    },
    {
      title: 'Tình trạng',
      dataIndex: 'tinhTrang',
      key: 'tinhTrang',
      width: 120,
      render: (val: string) => {
        if (!val) return '—';
        const colorMap: Record<string, string> = {
          TOT: 'green',
          XUONG_CAP: 'orange',
          HU_HOING: 'red',
        };
        return <span style={{ color: colorMap[val] || 'inherit', fontWeight: 500 }}>{val}</span>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThaiPheDuyet',
      key: 'trangThaiPheDuyet',
      width: 120,
      render: (status: string) => <ApprovalStatusBadge status={status} />,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: unknown, record: DeKeResponse) => {
        const canRead = userPermissions.includes('deke:read');
        const canUpdate = userPermissions.includes('deke:update');
        const canDelete = userPermissions.includes('deke:delete');
        const isProposed = record.trangThaiPheDuyet === 'PROPOSED';

        return (
          <Space size="small" wrap>
            {canRead && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/de-ke/${record.id}`)}
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
                onClick={() => navigate(`/de-ke/${record.id}?mode=edit`)}
                title="Chỉnh sửa"
                aria-label="Chỉnh sửa"
              >
                Sửa
              </Button>
            )}
            {canDelete && record.trangThaiPheDuyet === 'APPROVED' && (
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
      <Col xs={24} sm={12} md={6}>
        <Input
          placeholder="Tìm kiếm vị trí..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Loại đê"
          options={LOAI_DE_OPTIONS}
          value={filterLoaiDe}
          onChange={setFilterLoaiDe}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder="Tình trạng"
          options={TINH_TRANG_OPTIONS}
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
      <Spin spinning={isLoading} fullscreen={isLoading}>
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
      </Spin>
    );
  }

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Đê/Kè' },
  ];

  return (
    <Spin spinning={isLoading} fullscreen={isLoading}>
      <CrudPageLayout
        title="Quản lý Đê/Kè"
        breadcrumbs={breadcrumbs}
        filterBar={filterBar}
        canCreate={userPermissions.includes('deke:create')}
        onCreateClick={() => navigate('/de-ke/create')}
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
