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
import { shipRepairFacilityCRUD } from '../../services/shipRepairFacilityService';
import { organizationService } from '../../services/organizationService';
import type { ShipRepairFacilityResponse, ListParams } from '../../types/shipRepairFacility';
import { usePermissionStore } from '../../store/permissionStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import ShipRepairFacilityForm from './ShipRepairFacilityForm';

const APPROVAL_STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'PROPOSED' },
  { label: 'Chờ phê duyệt', value: 'PENDING_APPROVAL' },
  { label: 'Đã phê duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

const LOAI_CO_SO_MAP: Record<string, string> = {
  'CS_SUA_CHUA': 'Cơ sở sửa chữa',
  'CS_DONG_TAU': 'Cơ sở đóng tàu',
  'CS_SUA_CHUA_DONG_TAU': 'Cơ sở sửa chữa & đóng tàu',
  'KHAC': 'Khác',
};


export default function ShipRepairFacilityList() {
  const isInIframe = window.self !== window.top;
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterProvince, setFilterProvince] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [dataSource, setDataSource] = useState<ShipRepairFacilityResponse[]>([]);
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
        province: filterProvince,
        approvalStatus: filterStatus,
      };
      const res = await shipRepairFacilityCRUD.search(params);
      // ShipRepairFacility search returns List<> (not paginated) — set total = items.length
      setDataSource(res.items);
      setTotal(res.items.length);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách'));
    } finally {
      setIsLoading(false);
    }
  }, [filterKeyword, filterProvince, filterStatus]);

  useEffect(() => { if (!isInIframe) fetchData(); }, [fetchData, isInIframe]);

  const handleReset = useCallback(() => {
    setFilterKeyword('');
    setFilterProvince(undefined);
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await shipRepairFacilityCRUD.delete(String(id));
      message.success('Xóa thành công');
      fetchData();
    } catch (err) {
      message.error(`Lỗi xóa: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const columns: ColumnsType<ShipRepairFacilityResponse> = [
    {
      title: 'STT',
      key: 'sequenceNo',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    } as any,
    {
      title: 'Tên cơ sở',
      dataIndex: 'facilityName',
      key: 'facilityName',
      render: (val: string) => <span style={{ fontWeight: 700 }}>{val}</span>,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Tỉnh/thành',
      dataIndex: 'province',
      key: 'province',
      width: 140,
      render: (val: string) => val || '—',
    },
    {
      title: 'Loại cơ sở',
      dataIndex: 'facilityType',
      key: 'facilityType',
      width: 140,
      render: (val: string) => <span style={{ fontWeight: 500 }}>{LOAI_CO_SO_MAP[val] || val || '—'}</span>,
    },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (val: string) => val || '—',
    },
    {
      title: 'Chủ quản',
      dataIndex: 'authority',
      key: 'authority',
      width: 140,
      render: (val: string) => val || '—',
    },
    {
      title: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      key: 'orgUnitName',
      width: 180,
      render: (val: string | undefined, record: ShipRepairFacilityResponse) => val || record.orgUnitId || '—',
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
      render: (_: unknown, record: ShipRepairFacilityResponse) => {
        const canRead = hasPerm('shiprepair:read');
        const canUpdate = hasPerm('shiprepair:update');
        const canDelete = hasPerm('shiprepair:delete');
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
            {canDelete && record.approvalStatus === 'APPROVED' && (
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
                value={filterProvince || ''}
                onChange={(e) => { setFilterProvince(e.target.value || undefined); setPage(1); }}
                allowClear
                style={{ width: 150 }}
              />
              <Select
                placeholder="Tất cả"
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
      <ShipRepairFacilityForm
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
