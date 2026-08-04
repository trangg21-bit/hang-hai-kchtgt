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
import dayjs from 'dayjs';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import { organizationService } from '../../services/organizationService';
import type { NavigationChannelResponse, ListParams } from '../../types/navigationChannel';
import { useAuthStore } from '../../store/authStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import NavigationChannelForm from './NavigationChannelForm';

const APPROVAL_STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'PROPOSED' },
  { label: 'Đang xem xét', value: 'UNDER_REVIEW' },
  { label: 'Đã phê duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

export default function NavigationChannelList() {
  const isInIframe = window.self !== window.top;
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterChannelCode, setFilterChannelCode] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<NavigationChannelResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [isLoading, setIsLoading] = useState(false);
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
        page: page - 1,
        size: pageSize,
        keyword: filterKeyword || undefined,
        channelCode: filterChannelCode || undefined,
        approvalStatus: filterStatus as any,
      };
      const res = await navigationChannelCRUD.search(params);
      setDataSource(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterChannelCode, filterStatus]);

  useEffect(() => { if (!isInIframe) fetchData(); }, [fetchData, isInIframe]);

  const handleReset = useCallback(() => {
    setFilterKeyword('');
    setFilterChannelCode('');
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await navigationChannelCRUD.delete(String(id));
      message.success('Xóa thành công');
      fetchData();
    } catch (err) {
      message.error(`Lỗi xóa: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const columns: ColumnsType<NavigationChannelResponse> = [
    {
      title: 'STT',
      key: 'sequenceNo',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    } as any,
    {
      title: 'Tên luồng hàng hải',
      dataIndex: 'channelName',
      key: 'channelName',
      sorter: true,
    },
    {
      title: 'Mã luồng hàng hải',
      dataIndex: 'channelCode',
      key: 'channelCode',
      width: 150,
    },
    {
      title: 'Số lượng trạm',
      dataIndex: 'stationAmountt',
      key: 'stationAmountt',
      width: 100,
    },
    {
      title: 'Thời điểm sửa chữa trạm gần nhất',
      dataIndex: 'latestStationRepairDate',
      key: 'latestStationRepairDate',
      render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY') : '—'),
      sorter: true,
      width: 150,
    },
    {
      title: 'Cảng biển ID',
      dataIndex: 'seaportId',
      key: 'seaportId',
      width: 150,
      ellipsis: true,
      render: (val: string) => val || '—',
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      render: (val: string) => val || '—',
    },
    {
      title: 'Chiều cao tĩnh không',
      dataIndex: 'clearanceHeight',
      key: 'clearanceHeight',
      width: 130,
      render: (val: string) => val || '—',
    },
    {
      title: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      key: 'orgUnitName',
      width: 180,
      render: (val: string | undefined, record: NavigationChannelResponse) => val || record.orgUnitId || '—',
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
      render: (_: unknown, record: NavigationChannelResponse) => {
        const canRead = userPermissions.includes('navigationchannel:read');
        const canUpdate = userPermissions.includes('navigationchannel:update');
        const canDelete = userPermissions.includes('navigationchannel:delete');
        const isProposed = record.approvalStatus === 'PROPOSED';
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
                placeholder="Tìm kiếm luồng hàng hải..."
                allowClear
                value={filterKeyword}
                onSearch={(val) => { setFilterKeyword(val); setPage(1); }}
                onChange={(e) => setFilterKeyword(e.target.value)}
                style={{ width: 200 }}
              />
              <Input.Search
                placeholder="Tìm mã luồng hàng hải..."
                allowClear
                value={filterChannelCode}
                onSearch={(val) => { setFilterChannelCode(val); setPage(1); }}
                onChange={(e) => setFilterChannelCode(e.target.value)}
                style={{ width: 200 }}
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
      <NavigationChannelForm
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
