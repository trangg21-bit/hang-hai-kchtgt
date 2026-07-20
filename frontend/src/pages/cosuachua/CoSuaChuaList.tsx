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
import { coSuaChuaCRUD } from '../../services/coSuaChuaService';
import { organizationService } from '../../services/organizationService';
import type { CoSuaChuaResponse, ListParams } from '../../types/coSuaChua';
import { useAuthStore } from '../../store/authStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import CoSuaChuaForm from './CoSuaChuaForm';

const APPROVAL_STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'PROPOSED' },
  { label: 'Đang xem xét', value: 'UNDER_REVIEW' },
  { label: 'Đã phê duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

const LOAI_CO_SO_MAP: Record<string, string> = {
  'CS_SUA_CHUA': 'Cơ sở sửa chữa',
  'CS_DONG_TAU': 'Cơ sở đóng tàu',
  'CS_SUA_CHUA_DONG_TAU': 'Cơ sở sửa chữa & đóng tàu',
  'KHAC': 'Khác',
};


export default function CoSuaChuaList() {
  const isInIframe = window.self !== window.top;
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterTinhThanh, setFilterTinhThanh] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [dataSource, setDataSource] = useState<CoSuaChuaResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    if (isInIframe) return;
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
        keyword: filterKeyword || undefined,
        tinhThanh: filterTinhThanh,
        trangThaiPheDuyet: filterStatus,
      };
      const res = await coSuaChuaCRUD.search(params);
      // CoSuaChua search returns List<> (not paginated) — set total = items.length
      setDataSource(res.items);
      setTotal(res.items.length);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách'));
    } finally {
      setIsLoading(false);
    }
  }, [filterKeyword, filterTinhThanh, filterStatus]);

  useEffect(() => { if (!isInIframe) fetchData(); }, [fetchData, isInIframe]);

  const handleReset = useCallback(() => {
    setFilterKeyword('');
    setFilterTinhThanh(undefined);
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await coSuaChuaCRUD.delete(String(id));
      message.success('Xóa thành công');
      fetchData();
    } catch (err) {
      message.error(`Lỗi xóa: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const columns: ColumnsType<CoSuaChuaResponse> = [
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    } as any,
    {
      title: 'Tên cơ sở',
      dataIndex: 'tenCoSo',
      key: 'tenCoSo',
      render: (val: string) => <span style={{ fontWeight: 700 }}>{val}</span>,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'diaChi',
      key: 'diaChi',
      ellipsis: true,
    },
    {
      title: 'Tỉnh/thành',
      dataIndex: 'tinhThanh',
      key: 'tinhThanh',
      width: 140,
      render: (val: string) => val || '—',
    },
    {
      title: 'Loại cơ sở',
      dataIndex: 'loaiCoSo',
      key: 'loaiCoSo',
      width: 140,
      render: (val: string) => <span style={{ fontWeight: 500 }}>{LOAI_CO_SO_MAP[val] || val || '—'}</span>,
    },
    {
      title: 'Điện thoại',
      dataIndex: 'soDienThoai',
      key: 'soDienThoai',
      width: 130,
      render: (val: string) => val || '—',
    },
    {
      title: 'Chủ quản',
      dataIndex: 'chuQuan',
      key: 'chuQuan',
      width: 140,
      render: (val: string) => val || '—',
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
      render: (_: unknown, record: CoSuaChuaResponse) => {
        const canRead = userPermissions.includes('cosuachua:read');
        const canUpdate = userPermissions.includes('cosuachua:update');
        const canDelete = userPermissions.includes('cosuachua:delete');
        const isProposed = record.trangThai === 'PROPOSED';

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
            {canUpdate && isProposed && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => { setEditingId(String(record.id)); setModalMode('edit'); setIsModalOpen(true); }}
                title="Chỉnh sửa"
                aria-label="Chỉnh sửa"
              />
            )}
            {canDelete && record.trangThai === 'APPROVED' && (
              <Popconfirm
                title="Xác nhận xóa"
                description="Bạn chắc chắn muốn xóa bản ghi này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
              >
              <Button type="link" danger size="small" icon={<DeleteOutlined />} />
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
                placeholder="Tìm kiếm tên cơ sở..."
                allowClear
                value={filterKeyword}
                onSearch={(val) => { setFilterKeyword(val); setPage(1); }}
                onChange={(e) => setFilterKeyword(e.target.value)}
                style={{ width: 200 }}
              />
              <Input
                placeholder="Tỉnh/thành"
                value={filterTinhThanh || ''}
                onChange={(e) => { setFilterTinhThanh(e.target.value || undefined); setPage(1); }}
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
      <CoSuaChuaForm
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
