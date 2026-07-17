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
import { heThongVTSCRUD } from '../../services/heThongVtsService';
import { organizationService } from '../../services/organizationService';
import type { HeThongVTSResponse, ListParams, TinhTrangVTS } from '../../types/heThongVts';
import { TINH_TRANG_VTS_OPTIONS, TINH_TRANG_VTS_MAP } from '../../types/heThongVts';
import { useAuthStore } from '../../store/authStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import HeThongVTSForm from './HeThongVTSForm';

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
  const [filterTinhTrang, setFilterTinhTrang] = useState<TinhTrangVTS | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<HeThongVTSResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        setOrganizations(resp.data || []);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    })();
  }, []);

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
      render: (val: TinhTrangVTS) => {
        if (!val) return '—';
        const colorMap: Record<string, string> = {
          'TOT': '#52c41a',
          'XUONG_CAP': '#fa8c16',
          'HU_HONG': '#f5222d',
        };
        const displayVal = TINH_TRANG_VTS_MAP[val] || val;
        const color = colorMap[val] || 'inherit';
        return <span style={{ color, fontWeight: 500 }}>{displayVal}</span>;
      },
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
      title: 'Đơn vị quản lý',
      dataIndex: 'orgUnitId',
      key: 'orgUnitId',
      width: 180,
      render: (val: string) => {
        return organizations.find((o) => o.id === val)?.name || val || '—';
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
                onClick={() => { setEditingId(String(record.id)); setModalMode('detail'); setIsModalOpen(true); }}
              />
            )}
            {canUpdate && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                title="Chỉnh sửa"
                aria-label="Chỉnh sửa"
                onClick={() => { setEditingId(String(record.id)); setModalMode('edit'); setIsModalOpen(true); }}
              />
            )}
            {canDelete && isApproved && (
              <Popconfirm
                title="Xác nhận xóa"
                description="Bạn chắc chắn muốn xóa bản ghi này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button type="link" danger size="small" icon={<DeleteOutlined />} title="Xóa" aria-label="Xóa" />
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
                placeholder="Tìm kiếm..."
                allowClear
                value={filterKeyword}
                onSearch={(val) => { setFilterKeyword(val); setPage(1); }}
                onChange={(e) => setFilterKeyword(e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="Tình trạng"
                options={TINH_TRANG_VTS_OPTIONS}
                value={filterTinhTrang}
                onChange={(val) => { setFilterTinhTrang(val as any); setPage(1); }}
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
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); setModalMode('create'); setIsModalOpen(true); }}>
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
      <HeThongVTSForm
        open={isModalOpen}
        editId={editingId}
        mode={modalMode}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingId(null);
          fetchData();
        }}
      />
    </>
  );
}
