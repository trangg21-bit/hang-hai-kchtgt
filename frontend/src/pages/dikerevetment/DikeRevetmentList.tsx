import { useState, useCallback, useEffect } from 'react';
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
import { dikeRevetmentCRUD } from '../../services/dikeRevetmentService';
import { organizationService } from '../../services/organizationService';
import type { DikeRevetmentResponse, ListParams, DikeRevetmentType } from '../../types/dikeRevetment';
import { useAuthStore } from '../../store/authStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import DikeRevetmentForm from './DikeRevetmentForm';

const APPROVAL_STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'PROPOSED' },
  { label: 'Đang xem xét', value: 'UNDER_REVIEW' },
  { label: 'Đã phê duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

const DIKE_REVETMENT_TYPE_OPTIONS = [
  { label: 'Đê chắn sóng', value: 'RIVER_DIKE' },
  { label: 'Đê chắn cát', value: 'SAND_DIKE' },
  { label: 'Kè hướng dòng', value: 'FLOW_GUIDE_REVETMENT' },
  { label: 'Kè bảo vệ bờ', value: 'BANK_PROTECTION_REVETMENT' },
  { label: 'Giao thông', value: 'TRAFFIC' },
  { label: 'Kè chắn sóng', value: 'WAVE_BREAK_REVETMENT' },
  { label: 'Kè chắn cát', value: 'SAND_BREAK_REVETMENT' },
];

const STATUS_OPTIONS = [
  { label: 'Chưa khai thác/vận hành', value: '1' },
  { label: 'Đang khai thác/vận hành', value: '2' },
  { label: 'Dừng khai thác/vận hành', value: '3' },
];

export default function DikeRevetmentList() {
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterType, setFilterType] = useState<DikeRevetmentType | undefined>();
  const [filterStatusVal, setFilterStatusVal] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<DikeRevetmentResponse[]>([]);
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
        dikeRevetmentType: filterType,
        status: filterStatusVal,
        approvalStatus: filterApprovalStatus as any,
      };
      const res = await dikeRevetmentCRUD.search(params);
      setDataSource(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterType, filterStatusVal, filterApprovalStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await dikeRevetmentCRUD.delete(id);
      message.success('Xóa thành công');
      fetchData();
    } catch (err) {
      message.error(`Lỗi xóa: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const typeLabelMap: Record<string, string> = {
    'RIVER_DIKE': 'Đê chắn sóng',
    'SAND_DIKE': 'Đê chắn cát',
    'FLOW_GUIDE_REVETMENT': 'Kè hướng dòng',
    'BANK_PROTECTION_REVETMENT': 'Kè bảo vệ bờ',
    'TRAFFIC': 'Giao thông',
    'WAVE_BREAK_REVETMENT': 'Kè chắn sóng',
    'SAND_BREAK_REVETMENT': 'Kè chắn cát',
  };

  const statusColorMap: Record<string, string> = {
    '1': 'green',
    '2': 'orange',
    '3': 'red',
  };

  const statusTextMap: Record<string, string> = {
    '1': 'Chưa khai thác/vận hành',
    '2': 'Đang khai thác/vận hành',
    '3': 'Dừng khai thác/vận hành',
  };

  const columns: ColumnsType<DikeRevetmentResponse> = [
    {
      title: 'STT',
      key: 'sequenceNo',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    } as any,
    {
      title: 'Tên đê kè',
      dataIndex: 'dikeRevetmentName',
      key: 'dikeRevetmentName',
      ellipsis: true,
      render: (val: string) => val || '—',
    },
    {
      title: 'Loại đê',
      dataIndex: 'dikeRevetmentType',
      key: 'dikeRevetmentType',
      width: 120,
      render: (val: string) => {
        return <span style={{ fontWeight: 500 }}>{typeLabelMap[val] || val}</span>;
      },
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
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
      dataIndex: 'crestElevation',
      key: 'crestElevation',
      width: 100,
      render: (val: number) => (val !== undefined ? val.toFixed(2) : '—'),
    },
    {
      title: 'Thời điểm đưa vào khai thác',
      dataIndex: 'commissioningDate',
      key: 'commissioningDate',
      width: 130,
      render: (val: string) => val || '—',
    },
    {
      title: 'Chiều cao (m)',
      dataIndex: 'height',
      key: 'height',
      width: 100,
      render: (val: number) => (val !== undefined ? val.toFixed(2) : '—'),
    },
    {
      title: 'Mặt vật liệu',
      dataIndex: 'surfaceMaterial',
      key: 'surfaceMaterial',
      width: 120,
      render: (val: string) => val || '—',
    },
    {
      title: 'Tình trạng',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (val: string) => {
        if (!val) return '—';
        return <span style={{ color: statusColorMap[val] || 'inherit', fontWeight: 500 }}>{statusTextMap[val] || val}</span>;
      },
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
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 120,
      render: (status: string) => <ApprovalStatusBadge status={status} />,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: unknown, record: DikeRevetmentResponse) => {
        const canRead = userPermissions.includes('dikerevetment:read');
        const canUpdate = userPermissions.includes('dikerevetment:update');
        const canDelete = userPermissions.includes('dikerevetment:delete');
        const isApproved = record.approvalStatus === 'APPROVED';

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
                placeholder="Tìm kiếm vị trí..."
                allowClear
                value={filterKeyword}
                onSearch={(val) => { setFilterKeyword(val); setPage(1); }}
                onChange={(e) => setFilterKeyword(e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="Loại đê"
                options={DIKE_REVETMENT_TYPE_OPTIONS}
                value={filterType}
                onChange={(val) => { setFilterType(val); setPage(1); }}
                allowClear
                style={{ width: 150 }}
              />
              <Select
                placeholder="Tình trạng"
                options={STATUS_OPTIONS}
                value={filterStatusVal}
                onChange={(val) => { setFilterStatusVal(val); setPage(1); }}
                allowClear
                style={{ width: 150 }}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                options={APPROVAL_STATUS_OPTIONS}
                value={filterApprovalStatus}
                onChange={(val) => { setFilterApprovalStatus(val); setPage(1); }}
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
      <DikeRevetmentForm
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
