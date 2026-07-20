import { useState, useCallback, useEffect } from 'react';
import {
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Input,
  Select,
  Tooltip,
  Popconfirm,
  Modal,
  Form,
  message,
  TreeSelect,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { buoyCRUD, approval } from '../../services/beaconService';
import type { Buoy, CreateBuoyRequest, UpdateBuoyRequest } from '../../types/beacon';
import {
  BEACON_STATUS_MAP,
  BUOY_TYPE_OPTIONS,
  BUOY_TYPE_MAP,
} from '../../types/beacon';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import FormField from '../../components/FormField';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { organizationService } from '../../services/organizationService';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';

export default function BuoyList() {
  const isInIframe = window.self !== window.top;
  const navigate = useNavigate();

  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<Buoy[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Buoy | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [orgTree, setOrgTree] = useState<any[]>([]);

  useEffect(() => {
    if (isInIframe) return;
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        const buildOrgTree = (nodes: any[]): any[] => {
          const map = new Map<string, any>();
          const roots: any[] = [];

          nodes.forEach((org) => {
            map.set(org.id, {
              title: org.name,
              value: org.id,
              parentId: org.parentId,
              children: [],
            });
          });

          nodes.forEach((org) => {
            const node = map.get(org.id);
            if (org.parentId && map.has(org.parentId)) {
              map.get(org.parentId).children.push(node);
            } else {
              roots.push(node);
            }
          });

          return roots;
        };

        setOrgTree(buildOrgTree(orgs));
      } catch (error) {
        console.error('Failed to fetch org tree:', error);
      }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await buoyCRUD.search({
        page,
        pageSize,
        name: filterName || undefined,
        code: filterCode || undefined,
        type: filterType,
        status: filterStatus,
      });
      const startIndex = (page - 1) * pageSize;
      const paginatedData = res.data.slice(startIndex, startIndex + pageSize);
      setDataSource(paginatedData);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách phao tiêu'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterName, filterCode, filterType, filterStatus]);

  const openCreateModal = useCallback(() => {
    setEditingRecord(null);
    setIsDetailMode(false);
    form.resetFields();
    setIsModalOpen(true);
  }, [form]);

  const openEditModal = useCallback((record: Buoy) => {
    setEditingRecord(record);
    setIsDetailMode(false);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      type: record.type,
      range: record.range,
      color: record.color,
      description: record.description,
      unitId: record.unitId,
      gisLocation: {
        loaiHinhHoc: 'POINT',
        toaDo: record.longitude != null && record.latitude != null ? `POINT(${record.longitude} ${record.latitude})` : '',
        bieuTuongId: record.bieuTuongId
      }
    });
    setIsModalOpen(true);
  }, [form]);

  const openDetailModal = useCallback((record: Buoy) => {
    setEditingRecord(record);
    setIsDetailMode(true);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      type: record.type,
      range: record.range,
      color: record.color,
      description: record.description,
      unitId: record.unitId,
      gisLocation: {
        loaiHinhHoc: 'POINT',
        toaDo: record.longitude != null && record.latitude != null ? `POINT(${record.longitude} ${record.latitude})` : '',
        bieuTuongId: record.bieuTuongId
      }
    });
    setIsModalOpen(true);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      const gisLocation = values.gisLocation;
      let latitude = 0;
      let longitude = 0;
      if (gisLocation && gisLocation.toaDo) {
        const match = gisLocation.toaDo.match(/POINT\(([^)]+)\)/);
        if (match) {
          const parts = match[1].split(' ');
          longitude = parseFloat(parts[0]);
          latitude = parseFloat(parts[1]);
        } else {
          message.error('Vui lòng chọn vị trí hợp lệ trên bản đồ');
          return;
        }
      } else {
        message.error('Vui lòng chọn vị trí trên bản đồ');
        return;
      }

      if (values.range < 0.01 || values.range > 100) {
        message.error('Bán kính hoạt động phải từ 0.01 đến 100');
        return;
      }

      setSubmitting(true);

      if (editingRecord) {
        const payload: UpdateBuoyRequest = {
          name: values.name,
          type: values.type,
          longitude,
          latitude,
          range: values.range,
          color: values.color,
          description: values.description,
          unitId: values.unitId,
          bieuTuongId: gisLocation?.bieuTuongId || undefined,
        };
        await buoyCRUD.update(editingRecord.id, payload);
        toast.success('Đã cập nhật phao tiêu');
      } else {
        const payload: CreateBuoyRequest = {
          name: values.name,
          code: values.code,
          type: values.type,
          longitude,
          latitude,
          range: values.range,
          color: values.color,
          description: values.description,
          unitId: values.unitId,
          bieuTuongId: gisLocation?.bieuTuongId || undefined,
        };
        await buoyCRUD.create(payload);
        toast.success('Đã tạo phao tiêu');
      }

      setIsModalOpen(false);
      void fetchData();
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, form, fetchData]);

  useEffect(() => { if (!isInIframe) void fetchData(); }, [fetchData, isInIframe]);

  const handleDelete = useCallback(
    async (record: Buoy) => {
      try {
        await buoyCRUD.delete(record.id);
        toast.success('Đã xóa phao tiêu');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: Buoy) => {
      try {
        await approval.submitBuoyForApproval(record.id);
        toast.success('Đã gửi duyệt phao tiêu');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: Buoy) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await approval.approveBuoyL1(record.id, approverId);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: Buoy) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await approval.approveBuoyL2(record.id, approverId);
        toast.success('Đã phê duyệt cấp 2');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: Buoy) => {
      const approverId = localStorage.getItem('user_id') || '1';
      const reason = window.prompt('Lý do từ chối:', '');
      if (reason === null) return;
      try {
        await approval.rejectBuoy(record.id, reason, approverId);
        toast.success('Đã từ chối');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData],
  );

  const columns = [
    { title: '#', width: 60, render: (_: unknown, __: Buoy, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 160,
      render: (code: string) => <Tag color="cyan">{code}</Tag>,
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 180,
      render: (type: string) => {
        const m = BUOY_TYPE_MAP[type as keyof typeof BUOY_TYPE_MAP];
        return m ? <Tag color={m.color}>{BUOY_TYPE_OPTIONS.find((o) => o.value === type)?.label || type}</Tag> : <Tag>{type}</Tag>;
      },
    },
    {
      title: 'Vĩ độ',
      dataIndex: 'latitude',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '—',
    },
    {
      title: 'Kinh độ',
      dataIndex: 'longitude',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '—',
    },
    {
      title: 'Bán kính (km)',
      dataIndex: 'range',
      width: 110,
      render: (v: number) => v?.toFixed(1) || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => {
        const s = BEACON_STATUS_MAP[status as keyof typeof BEACON_STATUS_MAP] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, record: Buoy) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openDetailModal(record)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          {record.status === 'DRAFT' && (
            <Tooltip title="Gửi duyệt">
              <Popconfirm
                title="Gửi duyệt phao tiêu?"
                description="Sau khi gửi, phao tiêu sẽ chuyển sang trạng thái chờ phê duyệt cấp 1."
                okText="Gửi"
                cancelText="Hủy"
                onConfirm={() => handleSubmitApproval(record)}
              >
                <Button type="link" size="small" icon={<SendOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'PENDING_APPROVAL' && (
            <>
              <Tooltip title="Phê duyệt cấp 1">
                <Popconfirm
                  title="Phê duyệt cấp 1?"
                  description="Sau khi phê duyệt, phao tiêu sẽ chuyển sang trạng thái chờ phê duyệt cấp 2."
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApproveL1(record)}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối?"
                  description="Bạn sẽ cần nhập lý do từ chối."
                  okText="Từ chối"
                  cancelText="Hủy"
                  onConfirm={() => handleReject(record)}
                >
                  <Button type="link" size="small" danger icon={<CloseCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
          {record.status === 'APPROVED_L1' && (
            <>
              <Tooltip title="Phê duyệt cấp 2">
                <Popconfirm
                  title="Phê duyệt cấp 2?"
                  description="Sau khi phê duyệt, phao tiêu sẽ được công bố chính thức."
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApproveL2(record)}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối?"
                  description="Bạn sẽ cần nhập lý do từ chối."
                  okText="Từ chối"
                  cancelText="Hủy"
                  onConfirm={() => handleReject(record)}
                >
                  <Button type="link" size="small" danger icon={<CloseCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
          {record.status === 'DRAFT' && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa phao tiêu "${record.name}"?`}
                okText="Xóa"
                okType="danger"
                cancelText="Hủy"
                onConfirm={() => handleDelete(record)}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input
                placeholder="Lọc theo tên"
                allowClear
                style={{ width: 160 }}
                value={filterName}
                onChange={(e) => { setFilterName(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo mã"
                allowClear
                style={{ width: 140 }}
                value={filterCode}
                onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
              />
              <Select
                placeholder="Loại phao tiêu"
                allowClear
                style={{ width: 190 }}
                value={filterType}
                onChange={(val) => { setFilterType(val); setPage(1); }}
                options={BUOY_TYPE_OPTIONS}
              />
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: 160 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={Object.entries(BEACON_STATUS_MAP).map(([value, { label }]) => ({ value, label }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                Tạo phao tiêu
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách phao tiêu'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={filterName || filterCode || filterType || filterStatus ? 'Không tìm thấy' : 'Chưa có phao tiêu nào'}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<Buoy>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p: number, sz?: number) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t: number) => `Tổng ${t} phao tiêu`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{isDetailMode ? 'Chi tiết phao tiêu' : (editingRecord ? 'Chỉnh sửa phao tiêu' : 'Thêm phao tiêu mới')}</span>}
        open={isModalOpen}
        onOk={isDetailMode ? () => setIsModalOpen(false) : handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        confirmLoading={submitting}
        okText={isDetailMode ? 'Đóng' : (editingRecord ? 'Cập nhật' : 'Tạo mới')}
        cancelButtonProps={isDetailMode ? { style: { display: 'none' } } : undefined}
        cancelText="Hủy"
        width={700}
        mask={{ closable: false }}
      >
        <Form form={form} layout="vertical" disabled={isDetailMode} style={{ marginTop: 16, maxHeight: '60vh', overflowY: 'auto', paddingRight: 12 }}>
          <FormField
            type="text"
            name="code"
            label="Mã phao tiêu"
            required
            disabled={!!editingRecord}
            placeholder="VD: BY-HAIPHONG-001"
            help="Mã định danh duy nhất cho phao tiêu"
          />

          <FormField
            type="text"
            name="name"
            label="Tên phao tiêu"
            required
            placeholder="VD: Phao tiêu số 0"
          />

          <FormField
            type="select"
            name="type"
            label="Loại phao tiêu"
            required
            options={BUOY_TYPE_OPTIONS}
          />

          <Form.Item
            name="unitId"
            label="Đơn vị quản lý"
            rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
          >
            <TreeSelect
              placeholder="Chọn đơn vị quản lý"
              treeData={orgTree}
              showSearch
              treeDefaultExpandAll
              filterTreeNode={(input, node) =>
                (node?.title as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              allowClear
            />
          </Form.Item>

          <Form.Item name="gisLocation">
            <GisLocationSelector defaultGeometryType="POINT" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="number"
                name="range"
                label="Bán kính hoạt động (Hải lý)"
                required
                min={0.01}
                max={100}
                step={0.01}
                placeholder="VD: 5"
                help="Từ 0.01 đến 100 hải lý"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="color"
                label="Màu sắc phao"
                required
                placeholder="VD: Đỏ, Xanh lá"
              />
            </Col>
          </Row>

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả về phao tiêu..."
          />
        </Form>
      </Modal>
    </>
  );
}
