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
  Popconfirm,
  Table,
  Empty,
  Tag,
} from 'antd';
import { message } from '../../components/ToastNotification';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { radarStationCRUD } from '../../services/radarStationService';
import { organizationService } from '../../services/organizationService';
import type { RadarStationResponse, ListParams } from '../../types/radarStation';
import { usePermissionStore } from '../../store/permissionStore';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import RadarStationForm from './RadarStationForm';

const APPROVAL_STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'PROPOSED' },
  { label: 'Đang xem xét', value: 'UNDER_REVIEW' },
  { label: 'Đã phê duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

const CONDITION_STATUS_OPTIONS = [
  { label: 'Hoạt động tốt', value: 'TOT' },
  { label: 'Hoạt động kém', value: 'KEM' },
  { label: 'Ngừng hoạt động', value: 'NGUNG' },
];

export default function RadarStationList() {
  const isInIframe = window.self !== window.top;
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<RadarStationResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
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
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
      };
      const res = await radarStationCRUD.search(params);
      setDataSource(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterKeyword, filterConditionStatus, filterApprovalStatus]);

  useEffect(() => {
    if (!isInIframe) {
      fetchData();
    }
  }, [fetchData, isInIframe]);

  const handleReset = useCallback(() => {
    setFilterKeyword('');
    setFilterConditionStatus(undefined);
    setFilterApprovalStatus(undefined);
    setPage(1);
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await radarStationCRUD.delete(String(id));
      message.success('Xóa thành công');
      fetchData();
    } catch (err) {
      message.error(`Lỗi xóa: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const columns: ColumnsType<RadarStationResponse> = [
    {
      title: 'STT',
      key: 'sequenceNo',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    } as any,
    {
      title: 'Tên trạm',
      dataIndex: 'stationName',
      key: 'stationName',
      render: (val: string) => <span style={{ fontWeight: 700 }}>{val || '—'}</span>,
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
    },
    {
      title: 'Kinh độ',
      dataIndex: 'longitude',
      key: 'longitude',
      width: 100,
      render: (val: number) => (val !== undefined ? val.toFixed(6) : '—'),
    },
    {
      title: 'Vĩ độ',
      dataIndex: 'latitude',
      key: 'latitude',
      width: 100,
      render: (val: number) => (val !== undefined ? val.toFixed(6) : '—'),
    },
    {
      title: 'Loại trạm',
      dataIndex: 'stationType',
      key: 'stationType',
      width: 120,
      render: (val: string) => {
        const textMap: Record<string, string> = {
          'MAIN': 'Trạm radar chính',
          'SECONDARY': 'Trạm radar phụ',
          'ASSIST': 'Trạm radar hỗ trợ',
          'KHAC': 'Khác',
        };
        return val ? <Tag color="blue">{textMap[val] || val}</Tag> : '—';
      },
    },
    {
      title: 'Tình trạng',
      dataIndex: 'conditionStatus',
      key: 'conditionStatus',
      width: 150,
      render: (val: string) => {
        if (!val) return '—';
        const colorMap: Record<string, string> = {
          'TOT': 'success',
          'KEM': 'warning',
          'NGUNG': 'error',
          'Hoạt động tốt': 'success',
          'Hoạt động kém': 'warning',
          'Ngừng hoạt động': 'error',
        };
        const textMap: Record<string, string> = {
          'TOT': 'Hoạt động tốt',
          'KEM': 'Hoạt động kém',
          'NGUNG': 'Ngừng hoạt động',
        };
        return <Tag color={colorMap[val] || 'default'}>{textMap[val] || val}</Tag>;
      },
    },
    {
      title: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      key: 'orgUnitName',
      width: 180,
      render: (val: string | undefined, record: RadarStationResponse) => val || record.orgUnitId || '—',
    },
    {
      title: 'Hệ thống VTS',
      key: 'vtsSystemId',
      width: 180,
      render: (_: unknown, record: RadarStationResponse) =>
        record.vtsSystemName || (record.vtsSystemId ? `VTS-${record.vtsSystemId}` : '—'),
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
      render: (_: unknown, record: RadarStationResponse) => {
        const canRead = hasPerm('radarstation:read');
        const canUpdate = hasPerm('radarstation:update');
        const canDelete = hasPerm('radarstation:delete');
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
                placeholder="Tìm kiếm tên trạm..."
                allowClear
                value={filterKeyword}
                onSearch={(val) => { setFilterKeyword(val); setPage(1); }}
                onChange={(e) => setFilterKeyword(e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="Tất cả"
                options={CONDITION_STATUS_OPTIONS}
                value={filterConditionStatus}
                onChange={(val) => { setFilterConditionStatus(val); setPage(1); }}
                allowClear
                style={{ width: 180 }}
              />
              <Select
                placeholder="Tất cả"
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
      <RadarStationForm
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
