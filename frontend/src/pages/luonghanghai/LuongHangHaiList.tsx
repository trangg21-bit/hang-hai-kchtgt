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
import dayjs from 'dayjs';
import { luongHangHaiCRUD } from '../../services/luongHangHaiService';
import type { LuongHangHaiResponse, ListParams } from '../../types/luongHangHai';
import { useAuthStore } from '../../store/authStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import CrudPageLayout from '../../components/shared/CrudPageLayout';

const APPROVAL_STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'PROPOSED' },
  { label: 'Đang xem xét', value: 'UNDER_REVIEW' },
  { label: 'Đã phê duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

export default function LuongHangHaiList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterGioDien, setFilterGioDien] = useState<string | undefined>();
  const [filterTaiTrong, setFilterTaiTrong] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<LuongHangHaiResponse[]>([]);
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
        gioDien: filterGioDien,
        taiTrong: filterTaiTrong,
        trangThaiPheDuyet: filterStatus as any,
      };
      const res = await luongHangHaiCRUD.search(params);
      setDataSource(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterGioDien, filterTaiTrong, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilterKeyword('');
    setFilterGioDien(undefined);
    setFilterTaiTrong(undefined);
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await luongHangHaiCRUD.delete(String(id));
      message.success('Xóa thành công');
      fetchData();
    } catch (err) {
      message.error(`Lỗi xóa: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const columns: ColumnsType<LuongHangHaiResponse> = [
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    } as any,
    {
      title: 'Loại tàu',
      dataIndex: 'loaiTau',
      key: 'loaiTau',
      sorter: true,
    },
    {
      title: 'Số lượng',
      dataIndex: 'soLuong',
      key: 'soLuong',
      width: 80,
    },
    {
      title: 'Giờ điện',
      dataIndex: 'gioDien',
      key: 'gioDien',
      width: 100,
    },
    {
      title: 'Tải trọng (DWT)',
      dataIndex: 'taiTrong',
      key: 'taiTrong',
      width: 120,
    },
    {
      title: 'Diện tích đăng bộ',
      dataIndex: 'dienTichDangBo',
      key: 'dienTichDangBo',
      width: 120,
    },
    {
      title: 'Ngày ghi nhận',
      dataIndex: 'ngayGhiNhan',
      key: 'ngayGhiNhan',
      render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY') : '—'),
      sorter: true,
      width: 120,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (status: string) => <ApprovalStatusBadge status={status} />,
      sorter: true,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: unknown, record: LuongHangHaiResponse) => {
        const canRead = userPermissions.includes('luonghanghai:read');
        const canUpdate = userPermissions.includes('luonghanghai:update');
        const canDelete = userPermissions.includes('luonghanghai:delete');
        const isProposed = record.approvalStatus === 'PROPOSED';
        const isApproved = record.approvalStatus === 'APPROVED';

        return (
          <Space size="small" wrap>
            {canRead && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/luong-hang-hai/${record.id}`)}
              >
                Xem
              </Button>
            )}
            {canUpdate && isProposed && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/luong-hang-hai/${record.id}?mode=edit`)}
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
          placeholder="Tìm kiếm loại tàu..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Input
          placeholder="Giờ điện"
          value={filterGioDien || ''}
          onChange={(e) => setFilterGioDien(e.target.value || undefined)}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Input
          type="number"
          placeholder="Tải trọng max"
          value={filterTaiTrong || ''}
          onChange={(e) => setFilterTaiTrong(e.target.value ? Number(e.target.value) : undefined)}
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
    { title: 'Luồng hàng hải' },
  ];

  return (
    <Spin spinning={isLoading} fullscreen={isLoading}>
      <CrudPageLayout
        title="Quản lý Luồng Hàng Hải"
        breadcrumbs={breadcrumbs}
        filterBar={filterBar}
        canCreate={userPermissions.includes('luonghanghai:create')}
        onCreateClick={() => navigate('/luong-hang-hai/create')}
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
