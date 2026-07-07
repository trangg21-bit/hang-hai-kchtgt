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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { dekeCRUD } from '../../services/deKeService';
import type { DeKeResponse, ListParams } from '../../types/deKe';
import { useAuthStore } from '../../store/authStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

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

  return (
    <>
      {/* Filter Card */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm kiếm vị trí..."
                allowClear
                value={filterKeyword}
                onSearch={(val) => { setFilterKeyword(val); setPage(1); }}
                onChange={(e) => setFilterKeyword(e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="Loại đê"
                options={LOAI_DE_OPTIONS}
                value={filterLoaiDe}
                onChange={(val) => { setFilterLoaiDe(val); setPage(1); }}
                allowClear
                style={{ width: 150 }}
              />
              <Select
                placeholder="Tình trạng"
                options={TINH_TRANG_OPTIONS}
                value={filterTinhTrang}
                onChange={(val) => { setFilterTinhTrang(val); setPage(1); }}
                allowClear
                style={{ width: 150 }}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                options={APPROVAL_STATUS_OPTIONS}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
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
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/de-ke/create')}>
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
