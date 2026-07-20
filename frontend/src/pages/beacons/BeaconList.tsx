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
import {
  beaconLightCRUD,
  approval,
} from '../../services/beaconService';
import type { BeaconLight, CreateBeaconLightRequest, UpdateBeaconLightRequest } from '../../types/beacon';
import {
  BEACON_STATUS_MAP,
  BEACON_LIGHT_TYPE_OPTIONS,
  BEACON_LIGHT_TYPE_MAP,
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

export default function BeaconList() {
  const isInIframe = window.self !== window.top;
  const navigate = useNavigate();

  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<BeaconLight[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BeaconLight | null>(null);
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
          const data = cached || await beaconLightCRUD.findById(id);
          if (action === 'detail') {
            openDetailModal(data);
          } else {
            openEditModal(data);
          }
        } catch (err: any) {
          message.error(err.message || 'Lỗi khi tải thông tin chi tiết đèn biển');
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
      const res = await beaconLightCRUD.search({
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
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đèn biển'));
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

  const openEditModal = useCallback((record: BeaconLight) => {
    setEditingRecord(record);
    setIsDetailMode(false);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      type: record.type,
      lightRange: record.lightRange,
      lightColor: record.lightColor,
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

  const openDetailModal = useCallback((record: BeaconLight) => {
    setEditingRecord(record);
    setIsDetailMode(true);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      type: record.type,
      lightRange: record.lightRange,
      lightColor: record.lightColor,
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

      if (values.lightRange < 0.01 || values.lightRange > 60) {
        message.error('Bán kính chiếu sáng phải từ 0.01 đến 60');
        return;
      }

      setSubmitting(true);

      if (editingRecord) {
        const payload: UpdateBeaconLightRequest = {
          name: values.name,
          type: values.type,
          longitude,
          latitude,
          lightRange: values.lightRange,
          lightColor: values.lightColor,
          description: values.description,
          unitId: values.unitId,
          bieuTuongId: gisLocation?.bieuTuongId || undefined,
        };
        const updated = await beaconLightCRUD.update(editingRecord.id, payload);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[editingRecord.id] = updated;
        }
        toast.success('Đã cập nhật đèn biển');
      } else {
        const payload: CreateBeaconLightRequest = {
          name: values.name,
          code: values.code,
          type: values.type,
          longitude,
          latitude,
          lightRange: values.lightRange,
          lightColor: values.lightColor,
          description: values.description,
          unitId: values.unitId,
          bieuTuongId: gisLocation?.bieuTuongId || undefined,
        };
        await beaconLightCRUD.create(payload);
        toast.success('Đã tạo đèn biển');
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
    async (record: BeaconLight) => {
      try {
        await beaconLightCRUD.delete(record.id);
        toast.success('Đã xóa đèn biển');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: BeaconLight) => {
      try {
        await approval.submitForApproval(record.id);
        toast.success('Đã gửi duyệt đèn biển');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: BeaconLight) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await approval.approveL1(record.id, approverId);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: BeaconLight) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await approval.approveL2(record.id, approverId);
        toast.success('Đã phê duyệt cấp 2');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: BeaconLight) => {
      const approverId = localStorage.getItem('user_id') || '1';
      const reason = window.prompt('Lý do từ chối:', '');
      if (reason === null) return; // user cancelled
      try {
        await approval.reject(record.id, reason, approverId);
        toast.success('Đã từ chối');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData],
  );

  const columns = [
    { title: '#', width: 60, render: (_: unknown, __: BeaconLight, idx: number) => (page - 1) * pageSize + idx + 1 },
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
      width: 160,
      render: (type: string) => {
        const m = BEACON_LIGHT_TYPE_MAP[type as keyof typeof BEACON_LIGHT_TYPE_MAP];
        return m ? <Tag color={m.color}>{BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === type)?.label || type}</Tag> : <Tag>{type}</Tag>;
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
      dataIndex: 'lightRange',
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
      render: (_: unknown, record: BeaconLight) => (
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
                title="Gửi duyệt đèn biển?"
                description="Sau khi gửi, đèn biển sẽ chuyển sang trạng thái chờ phê duyệt cấp 1."
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
                  description="Sau khi phê duyệt, đèn biển sẽ chuyển sang trạng thái chờ phê duyệt cấp 2."
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
                  description="Sau khi phê duyệt, đèn biển sẽ được công bố chính thức."
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
                description={`Bạn có chắc muốn xóa đèn biển "${record.name}"?`}
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
      {!isIframeModal && (
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
                    placeholder="Loại đèn biển"
                    allowClear
                    style={{ width: 180 }}
                    value={filterType}
                    onChange={(val) => { setFilterType(val); setPage(1); }}
                    options={BEACON_LIGHT_TYPE_OPTIONS}
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
                    Tạo đèn biển
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Card>
            {isLoading && <LoadingSkeleton rows={8} type="table" />}
            {isError && (
              <ErrorState
                message={error?.message || 'Không thể tải danh sách đèn biển'}
                onRetry={fetchData}
              />
            )}
            {!isLoading && !isError && dataSource.length === 0 && (
              <EmptyState
                description={filterName || filterCode || filterType || filterStatus ? 'Không tìm thấy' : 'Chưa có đèn biển nào'}
                ctaText="Tạo đèn biển đầu tiên"
                onCta={openCreateModal}
              />
            )}
            {!isLoading && !isError && dataSource.length > 0 && (
              <DataTable<BeaconLight>
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
                  showTotal: (t: number) => `Tổng ${t} đèn biển`,
                  pageSizeOptions: ['10', '20', '50'],
                }}
              />
            )}
          </Card>
        </>
      )}

      <Modal
        title={isIframeModal ? null : (<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{isDetailMode ? 'Chi tiết đèn biển' : (editingRecord ? 'Chỉnh sửa đèn biển' : 'Thêm đèn biển mới')}</span>)}
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
            label="Mã đèn biển"
            required
            disabled={!!editingRecord}
            placeholder="VD: LH-HAIPHONG-001"
            help="Mã định danh duy nhất cho đèn biển"
          />

          <FormField
            type="text"
            name="name"
            label="Tên đèn biển"
            required
            placeholder="VD: Đèn biển Hòn Dấu"
          />

          <FormField
            type="select"
            name="type"
            label="Loại đèn biển"
            required
            options={BEACON_LIGHT_TYPE_OPTIONS}
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
                name="lightRange"
                label="Bán kính chiếu sáng (Hải lý)"
                required
                min={0.01}
                max={60}
                step={0.01}
                placeholder="VD: 15"
                help="Từ 0.01 đến 60 hải lý"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="lightColor"
                label="Màu sắc ánh sáng"
                required
                placeholder="VD: Trắng, Đỏ chớp"
              />
            </Col>
          </Row>

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả về đặc tính đèn biển..."
          />
        </Form>
      </Modal>
    </>
  );
}
