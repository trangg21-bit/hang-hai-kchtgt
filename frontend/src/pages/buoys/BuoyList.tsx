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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buoyCRUD, approval } from '../../services/beaconService';
import type { Buoy, CreateBuoyRequest, UpdateBuoyRequest } from '../../types/beacon';
import {
  BEACON_STATUS_MAP,
  BUOY_TYPE_OPTIONS,
  BUOY_TYPE_MAP,
} from '../../types/beacon';
import { ScreenHeader, FilterBar, DataTable, Pagination } from '../../components/list-view';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import FormField from '../../components/FormField';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { organizationService } from '../../services/organizationService';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg, cardStyle } from '../../tokens';

export default function BuoyList() {
  const isInIframe = window.self !== window.top;
  const navigate = useNavigate();

  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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

  const [searchParams] = useSearchParams();
  const isIframeModal = (window.self !== window.top) && searchParams.has('action');

  const action = searchParams.get('action');
  const id = searchParams.get('id');

  useEffect(() => {
    if (id && (action === 'detail' || action === 'edit')) {
      (async () => {
        try {
          setIsLoading(true);
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = cached || await buoyCRUD.findById(id);
          if (action === 'detail') {
            openDetailModal(data);
          } else {
            openEditModal(data);
          }
        } catch (err: any) {
          message.error(err.message || 'Lỗi khi tải thông tin chi tiết phao tiêu');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [action, id]);

  useEffect(() => {
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

  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
    form.resetFields();
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
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
        const updated = await buoyCRUD.update(editingRecord.id, payload);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[editingRecord.id] = updated;
        }
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
      if (window.self !== window.top) {
        window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
      }
      void fetchData();
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, form, fetchData]);

  useEffect(() => { if (!isIframeModal) void fetchData(); }, [fetchData, isIframeModal]);

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
    { key: 'stt', label: '#', width: 60, render: (_: unknown, __: Buoy, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      key: 'code',
      label: 'Mã',
      dataIndex: 'code',
      width: 160,
      render: (code: string) => <Tag color="cyan">{code}</Tag>,
    },
    {
      key: 'name',
      label: 'Tên',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      key: 'type',
      label: 'Loại',
      dataIndex: 'type',
      width: 180,
      render: (type: string) => {
        const m = BUOY_TYPE_MAP[type as keyof typeof BUOY_TYPE_MAP];
        return m ? <Tag color={m.color}>{BUOY_TYPE_OPTIONS.find((o) => o.value === type)?.label || type}</Tag> : <Tag>{type}</Tag>;
      },
    },
    {
      key: 'latitude',
      label: 'Vĩ độ',
      dataIndex: 'latitude',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '—',
    },
    {
      key: 'longitude',
      label: 'Kinh độ',
      dataIndex: 'longitude',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '—',
    },
    {
      key: 'range',
      label: 'Bán kính (km)',
      dataIndex: 'range',
      width: 110,
      render: (v: number) => v?.toFixed(1) || '—',
    },
    {
      key: 'status',
      label: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => {
        const s = BEACON_STATUS_MAP[status as keyof typeof BEACON_STATUS_MAP] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
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

  const filterFields = useMemo(() => [
    { key: 'name', type: 'search' as const, label: 'Tên phao tiêu', placeholder: 'Tìm theo tên...' },
    { key: 'code', type: 'search' as const, label: 'Mã phao tiêu', placeholder: 'Tìm theo mã...' },
    {
      key: 'type',
      type: 'select' as const,
      label: 'Loại phao tiêu',
      placeholder: 'Chọn loại phao',
      options: BUOY_TYPE_OPTIONS,
    },
    {
      key: 'status',
      type: 'select' as const,
      label: 'Trạng thái',
      placeholder: 'Chọn trạng thái',
      options: Object.entries(BEACON_STATUS_MAP).map(([value, { label }]) => ({ value, label })),
    },
  ], []);

  const headerActions = useMemo(() => [
    {
      key: 'create',
      label: 'Tạo phao tiêu',
      variant: 'primary' as const,
      icon: <PlusOutlined />,
      onClick: openCreateModal,
    },
  ], [openCreateModal]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setFilterName(values.name || '');
    setFilterCode(values.code || '');
    setFilterType(values.type || undefined);
    setFilterStatus(values.status || undefined);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilterName('');
    setFilterCode('');
    setFilterType(undefined);
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      {!isIframeModal && (
        <>
          <ScreenHeader
            breadcrumb={[{ label: 'Báo hiệu hàng hải' }, { label: 'Quản lý phao tiêu' }]}
            actions={headerActions}
          />
          <FilterBar
            fields={filterFields}
            onSearch={handleFilterSearch}
            onReset={handleFilterReset}
          />
          <div style={{ ...cardStyle, padding: '8px 16px' }}>
            {isLoading && <LoadingSkeleton rows={8} />}
            {isError && (
              <ErrorState
                message={error?.message || 'Không thể tải danh sách phao tiêu'}
                onRetry={fetchData}
              />
            )}
            {!isLoading && !isError && dataSource.length === 0 && (
              <EmptyState
                description={filterName || filterCode || filterType || filterStatus ? 'Không tìm thấy' : 'Chưa có phao tiêu nào'}
                ctaText="Tạo phao tiêu đầu tiên"
                onCta={openCreateModal}
              />
            )}
            {!isLoading && !isError && dataSource.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <DataTable
                  columns={columns}
                  dataSource={dataSource}
                  rowKey="id"
                  scroll={{ x: 1400 }}
                />
                <Pagination
                  total={total}
                  current={page}
                  pageSize={pageSize}
                  onChange={(p, sz) => {
                    setPage(p);
                    if (sz) setPageSize(sz);
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        title={isIframeModal ? null : (<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{isDetailMode ? 'Chi tiết phao tiêu' : (editingRecord ? 'Chỉnh sửa phao tiêu' : 'Thêm phao tiêu mới')}</span>)}
        open={isModalOpen}
        onOk={isDetailMode ? handleCancel : handleSubmit}
        onCancel={handleCancel}
        destroyOnClose
        confirmLoading={submitting}
        okText={isDetailMode ? 'Đóng' : (editingRecord ? 'Cập nhật' : 'Tạo mới')}
        cancelButtonProps={isDetailMode ? { style: { display: 'none' } } : undefined}
        cancelText="Hủy"
        width={isIframeModal ? '100%' : 700}
        mask={!isIframeModal}
        closable={!isIframeModal}
        style={isIframeModal ? { top: 0, margin: 0, padding: 0, maxWidth: 'none', height: '100vh' } : undefined}
        styles={isIframeModal ? { body: { padding: '16px 24px', overflowY: 'auto', maxHeight: 'calc(100vh - 110px)' } } : undefined}
        footer={isIframeModal ? (
          isDetailMode ? [
            <Button key="close" type="primary" onClick={handleCancel}>Đóng</Button>
          ] : [
            <Button key="cancel" onClick={handleCancel}>Hủy</Button>,
            <Button key="submit" type="primary" onClick={handleSubmit} loading={submitting}>{editingRecord ? 'Cập nhật' : 'Tạo mới'}</Button>
          ]
        ) : undefined}
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
    </div>
  );
}
