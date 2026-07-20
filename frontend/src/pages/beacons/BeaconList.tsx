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
  Descriptions,
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
import {
  beaconLightCRUD,
  approval,
} from '../../services/beaconService';
import type { BeaconLight, CreateBeaconLightRequest, UpdateBeaconLightRequest } from '../../types/beacon';
import {
  BEACON_STATUS_MAP,
  BEACON_LIGHT_TYPE_OPTIONS,
  BEACON_LIGHT_TYPE_MAP,
  BEACON_HISTORY_ACTION_MAP,
} from '../../types/beacon';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import FormField from '../../components/FormField';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import RejectionModal from '../../components/shared/RejectionModal';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import { beaconHistory } from '../../services/beaconService';
import { organizationService } from '../../services/organizationService';

export default function BeaconList() {
  const isInIframe = window.self !== window.top;
  const navigate = useNavigate();

  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
  const [modalKey, setModalKey] = useState(0);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<BeaconLight | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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
    setModalKey(k => k + 1);
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
      hinhDang: record.hinhDang,
      ketCau: record.ketCau,
      chieuCaoThapDen: record.chieuCaoThapDen,
      chieuCaoTamSang: record.chieuCaoTamSang,
      tamHieuLucDiaLy: record.tamHieuLucDiaLy,
      chungLoaiDenDuPhong: record.chungLoaiDenDuPhong,
      nguonCungCapNangLuongChoDen: record.nguonCungCapNangLuongChoDen,
      soLuongNhanSuBoTri: record.soLuongNhanSuBoTri,
      dienTichSuDungTram: record.dienTichSuDungTram,
      lightCharacteristic: record.lightCharacteristic,
      range: record.range,
      lastMaintenanceDate: record.lastMaintenanceDate,
      nextMaintenanceDate: record.nextMaintenanceDate,
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
      hinhDang: record.hinhDang,
      ketCau: record.ketCau,
      chieuCaoThapDen: record.chieuCaoThapDen,
      chieuCaoTamSang: record.chieuCaoTamSang,
      tamHieuLucDiaLy: record.tamHieuLucDiaLy,
      chungLoaiDenDuPhong: record.chungLoaiDenDuPhong,
      nguonCungCapNangLuongChoDen: record.nguonCungCapNangLuongChoDen,
      soLuongNhanSuBoTri: record.soLuongNhanSuBoTri,
      dienTichSuDungTram: record.dienTichSuDungTram,
      lightCharacteristic: record.lightCharacteristic,
      range: record.range,
      lastMaintenanceDate: record.lastMaintenanceDate,
      nextMaintenanceDate: record.nextMaintenanceDate,
      unitId: record.unitId,
      gisLocation: {
        loaiHinhHoc: 'POINT',
        toaDo: record.longitude != null && record.latitude != null ? `POINT(${record.longitude} ${record.latitude})` : '',
        bieuTuongId: record.bieuTuongId
      }
    });
    // Load approval history
    setHistoryLoading(true);
    beaconHistory.getHistory({
      type: 'BEACON_LIGHT',
      entityId: record.id,
    }).then(res => setHistory((res.data || []).map((h: any) => ({
      id: h.id,
      trangThai: BEACON_HISTORY_ACTION_MAP[h.actionType]?.label || h.actionType,
      nguoiPheDuyet: h.changedBy ? `Người dùng #${h.changedBy}` : 'Hệ thống',
      ngayPheDuyet: h.changedAt,
      lyDo: h.reason || '',
    }))))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
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
          hinhDang: values.hinhDang,
          ketCau: values.ketCau,
          chieuCaoThapDen: values.chieuCaoThapDen,
          chieuCaoTamSang: values.chieuCaoTamSang,
          tamHieuLucDiaLy: values.tamHieuLucDiaLy,
          chungLoaiDenDuPhong: values.chungLoaiDenDuPhong,
          nguonCungCapNangLuongChoDen: values.nguonCungCapNangLuongChoDen,
          soLuongNhanSuBoTri: values.soLuongNhanSuBoTri,
          dienTichSuDungTram: values.dienTichSuDungTram,
          lightCharacteristic: values.lightCharacteristic,
          range: values.range,
          lastMaintenanceDate: values.lastMaintenanceDate,
          nextMaintenanceDate: values.nextMaintenanceDate,
          unitId: values.unitId,
          bieuTuongId: gisLocation?.bieuTuongId || undefined,
        };
        await beaconLightCRUD.update(editingRecord.id, payload);
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
          hinhDang: values.hinhDang,
          ketCau: values.ketCau,
          chieuCaoThapDen: values.chieuCaoThapDen,
          chieuCaoTamSang: values.chieuCaoTamSang,
          tamHieuLucDiaLy: values.tamHieuLucDiaLy,
          chungLoaiDenDuPhong: values.chungLoaiDenDuPhong,
          nguonCungCapNangLuongChoDen: values.nguonCungCapNangLuongChoDen,
          soLuongNhanSuBoTri: values.soLuongNhanSuBoTri,
          dienTichSuDungTram: values.dienTichSuDungTram,
          lightCharacteristic: values.lightCharacteristic,
          range: values.range,
          lastMaintenanceDate: values.lastMaintenanceDate,
          nextMaintenanceDate: values.nextMaintenanceDate,
          unitId: values.unitId,
          bieuTuongId: gisLocation?.bieuTuongId || undefined,
        };
        await beaconLightCRUD.create(payload);
        toast.success('Đã tạo đèn biển');
      }

      setIsModalOpen(false);
      setEditingRecord(null);
      void fetchData();
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, form, fetchData]);

  useEffect(() => { if (!isInIframe) void fetchData(); }, [fetchData, isInIframe]);

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
    (record: BeaconLight) => {
      setRejectTarget(record);
      setRejectModalVisible(true);
    },
    [],
  );

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!rejectTarget) return;
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await approval.reject(rejectTarget.id, reason, approverId);
        toast.success('Đã từ chối');
        setRejectModalVisible(false);
        setRejectTarget(null);
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [rejectTarget, fetchData],
  );

  const columns = [
    { title: '#', width: 60, render: (_: unknown, __: BeaconLight, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Mã đèn biển',
      dataIndex: 'code',
      width: 160,
      render: (code: string) => <Tag color="cyan">{code}</Tag>,
    },
    {
      title: 'Tên đèn biển',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'Cấp trạm đèn',
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
      title: 'Tầm hiệu lực ánh sáng',
      dataIndex: 'lightRange',
      width: 110,
      render: (v: number) => v?.toFixed(1) || '—',
    },
    {
      title: 'Trạng thái phê duyệt',
      dataIndex: 'approvalStatus',
      width: 140,
      render: (status: string) => <ApprovalStatusBadge status={status} />,
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

      <Modal
        key={modalKey}
        title={isDetailMode ? 'Chi tiết đèn biển' : (editingRecord ? 'Chỉnh sửa đèn biển' : 'Thêm đèn biển mới')}
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
        {isDetailMode ? (
          // Read-only Descriptions view (like DeKe)
          editingRecord && (<>
            <Descriptions column={2} bordered size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item label="Mã đèn biển">{editingRecord.code}</Descriptions.Item>
              <Descriptions.Item label="Tên đèn biển">{editingRecord.name}</Descriptions.Item>
              <Descriptions.Item label="Cấp trạm đèn">
                {BEACON_LIGHT_TYPE_OPTIONS.find(o => o.value === editingRecord.type)?.label || editingRecord.type}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn vị quản lý">{editingRecord.unitName || editingRecord.unitId || '—'}</Descriptions.Item>
              <Descriptions.Item label="Kinh độ">{editingRecord.longitude?.toFixed(6) || '—'}</Descriptions.Item>
              <Descriptions.Item label="Vĩ độ">{editingRecord.latitude?.toFixed(6) || '—'}</Descriptions.Item>
              <Descriptions.Item label="Tầm hiệu lực ánh sáng">{editingRecord.lightRange != null ? `${editingRecord.lightRange} hải lý` : '—'}</Descriptions.Item>
              <Descriptions.Item label="Màu sắc bên ngoài của tháp đèn">{editingRecord.lightColor || '—'}</Descriptions.Item>
              <Descriptions.Item label="Địa điểm đặt trạm đèn" span={2}>{editingRecord.description || '—'}</Descriptions.Item>
              <Descriptions.Item label="Hình dáng">{editingRecord.hinhDang || '—'}</Descriptions.Item>
              <Descriptions.Item label="Kết cấu">{editingRecord.ketCau || '—'}</Descriptions.Item>
              <Descriptions.Item label="Chiều cao tháp đèn (m)">{editingRecord.chieuCaoThapDen != null ? editingRecord.chieuCaoThapDen : '—'}</Descriptions.Item>
              <Descriptions.Item label="Chiều cao tâm sáng (m)">{editingRecord.chieuCaoTamSang != null ? editingRecord.chieuCaoTamSang : '—'}</Descriptions.Item>
              <Descriptions.Item label="Tầm hiệu lực địa lý">{editingRecord.tamHieuLucDiaLy || '—'}</Descriptions.Item>
              <Descriptions.Item label="Đèn dự phòng">{editingRecord.chungLoaiDenDuPhong || '—'}</Descriptions.Item>
              <Descriptions.Item label="Nguồn cung cấp năng lượng" span={2}>{editingRecord.nguonCungCapNangLuongChoDen || '—'}</Descriptions.Item>
              <Descriptions.Item label="Nhân sự bố trí (người)">{editingRecord.soLuongNhanSuBoTri != null ? editingRecord.soLuongNhanSuBoTri : '—'}</Descriptions.Item>
              <Descriptions.Item label="Diện tích sử dụng trạm (m²)">{editingRecord.dienTichSuDungTram != null ? editingRecord.dienTichSuDungTram : '—'}</Descriptions.Item>
              <Descriptions.Item label="Đèn chính">{editingRecord.lightCharacteristic || '—'}</Descriptions.Item>
              <Descriptions.Item label="Diện tích (m²)">{editingRecord.range != null ? editingRecord.range : '—'}</Descriptions.Item>
              <Descriptions.Item label="Thời điểm sửa chữa gần nhất">{editingRecord.lastMaintenanceDate || '—'}</Descriptions.Item>
              <Descriptions.Item label="Thời điểm đưa vào sử dụng">{editingRecord.nextMaintenanceDate || '—'}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái phê duyệt">
                <ApprovalStatusBadge status={editingRecord.approvalStatus} />
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái vận hành">
                {BEACON_STATUS_MAP[editingRecord.status as keyof typeof BEACON_STATUS_MAP]?.label || editingRecord.status}
              </Descriptions.Item>
            </Descriptions>
            {/* Approval Action Buttons */}
            <Space wrap style={{ marginTop: 16, marginBottom: 16 }}>
              {editingRecord.status === 'DRAFT' && (
                <Popconfirm
                  title="Gửi duyệt đèn biển?"
                  okText="Gửi"
                  cancelText="Hủy"
                  onConfirm={() => { handleSubmitApproval(editingRecord); }}
                >
                  <Button type="primary" icon={<SendOutlined />}>Gửi duyệt</Button>
                </Popconfirm>
              )}
              {editingRecord.status === 'PENDING_APPROVAL' && (
                <>
                  <Popconfirm
                    title="Phê duyệt cấp 1?"
                    okText="Phê duyệt"
                    cancelText="Hủy"
                    onConfirm={() => { handleApproveL1(editingRecord); }}
                  >
                    <Button type="primary" style={{ background: '#52c41a' }} icon={<CheckCircleOutlined />}>Phê duyệt L1</Button>
                  </Popconfirm>
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => handleReject(editingRecord)}>Từ chối</Button>
                </>
              )}
              {editingRecord.status === 'APPROVED_L1' && (
                <>
                  <Popconfirm
                    title="Phê duyệt cấp 2?"
                    okText="Phê duyệt"
                    cancelText="Hủy"
                    onConfirm={() => { handleApproveL2(editingRecord); }}
                  >
                    <Button type="primary" style={{ background: '#1890ff' }} icon={<CheckCircleOutlined />}>Phê duyệt L2</Button>
                  </Popconfirm>
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => handleReject(editingRecord)}>Từ chối</Button>
                </>
              )}
              {editingRecord.status === 'DRAFT' && (
                <Popconfirm
                  title={`Xóa đèn biển "${editingRecord.name}"?`}
                  okText="Xóa"
                  okType="danger"
                  cancelText="Hủy"
                  onConfirm={() => { handleDelete(editingRecord); }}
                >
                  <Button danger icon={<DeleteOutlined />}>Xóa</Button>
                </Popconfirm>
              )}
            </Space>

            {/* Approval History Timeline */}
            <Card size="small" title="Lịch sử phê duyệt" style={{ marginTop: 16 }}>
              <HistoryTimeline
                history={history}
                loading={historyLoading}
                onRetry={() => {
                  if (!editingRecord) return;
                  setHistoryLoading(true);
                  beaconHistory.getHistory({ type: 'BEACON_LIGHT', entityId: editingRecord.id })
                    .then(res => setHistory((res.data || []).map((h: any) => ({
                      id: h.id,
                      trangThai: BEACON_HISTORY_ACTION_MAP[h.actionType]?.label || h.actionType,
                      nguoiPheDuyet: h.changedBy ? `Người dùng #${h.changedBy}` : 'Hệ thống',
                      ngayPheDuyet: h.changedAt,
                      lyDo: h.reason || '',
                    }))))
                    .catch(() => setHistory([]))
                    .finally(() => setHistoryLoading(false));
                }}
              />
            </Card>
          </>)
        ) : (
          // Editable Form (create/edit)
          <Form form={form} layout="vertical" style={{ marginTop: 16, maxHeight: '60vh', overflowY: 'auto', paddingRight: 12 }}>
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
              label="Cấp trạm đèn"
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
                  label="Tầm hiệu lực ánh sáng"
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
                  label="Màu sắc bên ngoài của tháp đèn"
                  required
                  placeholder="VD: Trắng, Đỏ chớp"
                />
              </Col>
            </Row>

            <FormField
              type="textarea"
              name="description"
              label="Địa điểm đặt trạm đèn"
              placeholder="Mô tả về đặc tính đèn biển..."
            />

            <Row gutter={16}>
              <Col span={12}>
                <FormField
                  type="text"
                  name="hinhDang"
                  label="Hình dáng"
                  placeholder="VD: Hình trụ tròn"
                />
              </Col>
              <Col span={12}>
                <FormField
                  type="number"
                  name="chieuCaoThapDen"
                  label="Chiều cao tháp đèn (m)"
                  min={0}
                  step={0.01}
                  placeholder="VD: 25.5"
                />
              </Col>
            </Row>

            <FormField
              type="textarea"
              name="ketCau"
              label="Kết cấu"
              placeholder="VD: Bê tông cốt thép..."
            />

            <Row gutter={16}>
              <Col span={12}>
                <FormField
                  type="number"
                  name="chieuCaoTamSang"
                  label="Chiều cao tâm sáng (m)"
                  min={0}
                  step={0.01}
                  placeholder="VD: 20"
                />
              </Col>
              <Col span={12}>
                <FormField
                  type="text"
                  name="tamHieuLucDiaLy"
                  label="Tầm hiệu lực địa lý"
                  placeholder="VD: 15 hải lý"
                />
              </Col>
            </Row>

            <FormField
              type="text"
              name="chungLoaiDenDuPhong"
              label="Đèn dự phòng"
              placeholder="VD: LED 200W"
            />

            <FormField
              type="text"
              name="nguonCungCapNangLuongChoDen"
              label="Nguồn cung cấp năng lượng cho đèn"
              placeholder="VD: Pin mặt trời, điện lưới..."
            />

            <Row gutter={16}>
              <Col span={12}>
                <FormField
                  type="number"
                  name="soLuongNhanSuBoTri"
                  label="Nhân sự bố trí (người)"
                  min={0}
                  max={99999}
                  step={1}
                  placeholder="VD: 3"
                />
              </Col>
              <Col span={12}>
                <FormField
                  type="number"
                  name="dienTichSuDungTram"
                  label="Diện tích sử dụng trạm (m²)"
                  min={0}
                  step={0.01}
                  placeholder="VD: 150.5"
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <FormField
                  type="text"
                  name="lightCharacteristic"
                  label="Đèn chính"
                  placeholder="VD: VMS.RB-400"
                />
              </Col>
              <Col span={12}>
                <FormField
                  type="number"
                  name="range"
                  label="Diện tích (m²)"
                  min={0}
                  step={0.01}
                  placeholder="VD: 4466.7"
                />
              </Col>
            </Row>

            <FormField
              type="date"
              name="lastMaintenanceDate"
              label="Thời điểm sửa chữa gần nhất"
            />

            <FormField
              type="date"
              name="nextMaintenanceDate"
              label="Thời điểm đưa vào sử dụng"
            />
          </Form>
        )}
      </Modal>
      <RejectionModal
        visible={rejectModalVisible}
        loading={false}
        onConfirm={handleRejectConfirm}
        onCancel={() => { setRejectModalVisible(false); setRejectTarget(null); }}
      />
    </>
  );
}
