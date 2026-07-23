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
import { organizationService } from '../../services/organizationService';
import type { DeKeResponse, ListParams, LoaiDe } from '../../types/deKe';
import { useAuthStore } from '../../store/authStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import DeKeForm from './DeKeForm';

const APPROVAL_STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'PROPOSED' },
  { label: 'Đang xem xét', value: 'UNDER_REVIEW' },
  { label: 'Đã phê duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

const LOAI_DE_OPTIONS = [
  { label: 'Đê chắn sóng', value: 'DE_CHAN_SONG' },
  { label: 'Đê chắn cát', value: 'DE_CHAN_CAT' },
  { label: 'Kè hướng dòng', value: 'KE_HUONG_DONG' },
  { label: 'Kè bảo vệ bờ', value: 'KE_BAO_VE_BO' },
  { label: 'Giao thông', value: 'GIAO_THONG' },
  { label: 'Kè chắn sóng', value: 'KE_CHAN_SONG' },
  { label: 'Kè chắn cát', value: 'KE_CHAN_CAT' },
];

const TINH_TRANG_OPTIONS = [
  { label: 'Chưa khai thác/vận hành', value: '1' },
  { label: 'Đang khai thác/vận hành', value: '2' },
  { label: 'Dừng khai thác/vận hành', value: '3' },
];

export default function DeKeList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterLoaiDe, setFilterLoaiDe] = useState<LoaiDe | undefined>();
  const [filterTinhTrang, setFilterTinhTrang] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<DeKeResponse[]>([]);
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
        loaiDe: filterLoaiDe,
        tinhTrang: filterTinhTrang,
        approvalStatus: filterStatus as any,
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
      title: 'Tên đê kè',
      dataIndex: 'tenDeKe',
      key: 'tenDeKe',
      ellipsis: true,
      render: (val: string) => val || '—',
    },
    {
      title: 'Loại đê',
      dataIndex: 'loaiDe',
      key: 'loaiDe',
      width: 120,
      render: (val: string) => {
        const textMap: Record<string, string> = {
          'DE_CHAN_SONG': 'Đê chắn sóng',
          'DE_CHAN_CAT': 'Đê chắn cát',
          'KE_HUONG_DONG': 'Kè hướng dòng',
          'KE_BAO_VE_BO': 'Kè bảo vệ bờ',
          'GIAO_THONG': 'Giao thông',
          'KE_CHAN_SONG': 'Kè chắn sóng',
          'KE_CHAN_CAT': 'Kè chắn cát',
        };
        return <span style={{ fontWeight: 500 }}>{textMap[val] || val}</span>;
      },
    },
    {
      title: 'Vị trí',
      dataIndex: 'viTri',
      key: 'viTri',
      ellipsis: true,
    },
    {
      title: 'Chiều dài (m)',
      dataIndex: 'length',
      key: 'length',
      width: 100,
      render: (val: number) => (val !== undefined ? val.toFixed(2) : '—'),
    },
    {
      title: 'Cao trình đỉnh (m)',
      dataIndex: 'caoTrinhDinh',
      key: 'caoTrinhDinh',
      width: 100,
      render: (val: number) => (val !== undefined ? val.toFixed(2) : '—'),
    },
    {
      title: 'Thời điểm đưa vào khai thác',
      dataIndex: 'thoiDiemDuaVaoKhaiThac',
      key: 'thoiDiemDuaVaoKhaiThac',
      width: 130,
      render: (val: string) => val || '—',
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
          '1': 'green',
          '2': 'orange',
          '3': 'red',
        };
        const textMap: Record<string, string> = {
          '1': 'Chưa khai thác/vận hành',
          '2': 'Đang khai thác/vận hành',
          '3': 'Dừng khai thác/vận hành',
        };
        return <span style={{ color: colorMap[val] || 'inherit', fontWeight: 500 }}>{textMap[val] || val}</span>;
      },
    },
    {
      title: 'Đơn vị quản lý',
      dataIndex: 'donViId',
      key: 'donViId',
      width: 180,
      render: (val: string) => {
        return organizations.find((o) => o.id === val)?.name || val || '—';
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
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
        const isProposed = record.approvalStatus === 'PROPOSED';

        return (
          <Space size="small" wrap>
            {canRead && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => { setEditingId(String(record.id)); setModalMode('detail'); setIsModalOpen(true); }}
                title="Xem chi tiết"
                aria-label="Xem chi tiết"
              />
            )}
            {canUpdate && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => { setEditingId(String(record.id)); setModalMode('edit'); setIsModalOpen(true); }}
                title="Chỉnh sửa"
                aria-label="Chỉnh sửa"
              />
            )}
            {canDelete && record.approvalStatus === 'APPROVED' && (
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
      <DeKeForm
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
