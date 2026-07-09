import { useState, useCallback, useEffect, useRef } from 'react';
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
  Table,
  Spin,
  Modal,
  Form,
  InputNumber,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  fetchCangBienList,
  deleteCangBien,
  approveCangBien,
  rejectCangBien,
  fetchCangBienById,
} from './api';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge, TRANG_THAI_HOAT_DONG_OPTIONS } from './schema';
import type { CangBienResponse } from './types';
import toast from '../../components/ToastNotification';
import { giayToApi } from '../../app/giayto/api';

// ── Helper: format date ─────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ── List Page ───────────────────────────────────────────────────────

export default function CangBienListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMaCang, setFilterMaCang] = useState('');
  const [filterTenCang, setFilterTenCang] = useState('');
  const [filterTinhThanhPho, setFilterTinhThanhPho] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CangBienResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals Visibility
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CangBienResponse | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // Forms definition
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Form Watches
  const createViDo = Form.useWatch('viDo', createForm);
  const createKinhDo = Form.useWatch('kinhDo', createForm);
  const createGpsPairedWarning =
    (createViDo !== undefined && createViDo != null && !Number.isNaN(createViDo)) !==
    (createKinhDo !== undefined && createKinhDo != null && !Number.isNaN(createKinhDo));

  const updateViDo = Form.useWatch('viDo', updateForm);
  const updateKinhDo = Form.useWatch('kinhDo', updateForm);
  const updateGpsPairedWarning =
    (updateViDo !== undefined && updateViDo != null && !Number.isNaN(updateViDo)) !==
    (updateKinhDo !== undefined && updateKinhDo != null && !Number.isNaN(updateKinhDo));

  const handleCreateFinish = async (values: Record<string, unknown>) => {
    const maCang = String(values.maCang).trim();
    const tenCang = String(values.tenCang).trim();
    if (!maCang) { toast.error('Mã cảng không được để trống'); return; }
    if (maCang.length > 50) { toast.error('Mã cảng tối đa 50 ký tự'); return; }
    if (!tenCang) { toast.error('Tên cảng không được để trống'); return; }
    if (tenCang.length > 255) { toast.error('Tên cảng tối đa 255 ký tự'); return; }
    const vi = values.viDo as number;
    const jd = values.kinhDo as number;
    const viPresent = vi !== undefined && vi != null && !Number.isNaN(vi);
    const jdPresent = jd !== undefined && jd != null && !Number.isNaN(jd);
    if (viPresent !== jdPresent) {
      toast.error('Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau');
      return;
    }
    if (viPresent && (vi < -90 || vi > 90)) { toast.error('Vĩ độ phải từ -90 đến 90'); return; }
    if (jdPresent && (jd < -180 || jd > 180)) { toast.error('Kinh độ phải từ -180 đến 180'); return; }
    const dienTich = values.dienTich as number;
    if (dienTich === undefined || dienTich === null || dienTich <= 0) {
      toast.error('Diện tích phải lớn hơn 0'); return;
    }

    setSubmitting(true);
    try {
      const payload = {
        maCang,
        tenCang,
        tinhThanhPho: (values.tinhThanhPho as string) || undefined,
        viDo: viPresent ? vi : undefined,
        kinhDo: jdPresent ? jd : undefined,
        dienTich,
        khaNangTiepNhan: values.khaNangTiepNhan as number | undefined,
        trangThaiHoatDong: (values.trangThaiHoatDong as string) || undefined,
        trangThaiPheDuyet: (values.trangThaiPheDuyet as string) || 'CHO_PHE_DUYET',
      };
      await import('./api').then(m => m.createCangBien(payload));
      toast.success('Tạo mới thành công — chờ phê duyệt');
      setCreateModalVisible(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('mã cảng') || msg.includes('Ma cang') || msg.includes('Duplicate')) {
          toast.error('Mã cảng đã tồn tại. Vui lòng nhập mã khác.');
        } else {
          toast.error(msg);
        }
      } else {
        toast.error('Có lỗi xảy ra khi tạo mới');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFinish = async (values: Record<string, unknown>) => {
    if (!selectedRecord) return;
    const vi = values.viDo as number;
    const jd = values.kinhDo as number;
    if ((vi !== undefined && vi != null && !Number.isNaN(vi)) !==
        (jd !== undefined && jd != null && !Number.isNaN(jd))) {
      toast.error('Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau');
      return;
    }
    if (vi !== undefined && vi != null && !Number.isNaN(vi) && (vi < -90 || vi > 90)) {
      toast.error('Vĩ độ phải từ -90 đến 90');
      return;
    }
    if (jd !== undefined && jd != null && !Number.isNaN(jd) && (jd < -180 || jd > 180)) {
      toast.error('Kinh độ phải từ -180 đến 180');
      return;
    }
    const dienTich = values.dienTich as number;
    if (dienTich !== undefined && dienTich != null && !Number.isNaN(dienTich) && dienTich <= 0) {
      toast.error('Diện tích phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: selectedRecord.id,
        tenCang: (values.tenCang as string) || undefined,
        tinhThanhPho: (values.tinhThanhPho as string) || undefined,
        viDo: values.viDo as number | undefined,
        kinhDo: values.kinhDo as number | undefined,
        dienTich: values.dienTich as number | undefined,
        khaNangTiepNhan: values.khaNangTiepNhan as number | undefined,
        trangThaiHoatDong: (values.trangThaiHoatDong as string) || undefined,
      };
      await import('./api').then(m => m.updateCangBien(payload));
      toast.success('Cập nhật thành công');
      setUpdateModalVisible(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchCangBienList({
        page: page - 1,
        size: pageSize,
        search: search || undefined,
        maCang: filterMaCang || undefined,
        tenCang: filterTenCang || undefined,
        tinhThanhPho: filterTinhThanhPho || undefined,
        trangThaiHoatDong: filterStatus,
        trangThaiPheDuyet: filterApprovalStatus,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements ?? 0);
    } catch (err: unknown) {
      setIsError(true);
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách cảng biển';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterMaCang, filterTenCang, filterTinhThanhPho, filterStatus, filterApprovalStatus]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // Debounced search
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
    }, 500);
  }, []);

  const handleDelete = useCallback(
    async (record: CangBienResponse) => {
      try {
        await deleteCangBien(record.id);
        toast.success('Xóa thành công');
        fetchData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Xóa thất bại';
        toast.error(msg);
      }
    },
    [fetchData],
  );

  const handleApprove = useCallback(
    async (record: CangBienResponse) => {
      try {
        await approveCangBien(record.id);
        toast.success('Phê duyệt thành công');
        fetchData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
        toast.error(msg);
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: CangBienResponse) => {
      const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
      if (reason === null || reason.length < 10) {
        if (reason != null) toast.error('Lý do từ chối tối thiểu 10 ký tự');
        return;
      }
      try {
        await rejectCangBien(record.id, reason);
        toast.success('Từ chối thành công');
        fetchData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Từ chối thất bại';
        toast.error(msg);
      }
    },
    [fetchData],
  );

  const columns: ColumnsType<CangBienResponse> = [
    {
      title: 'STT',
      width: 60,
      render: (_: unknown, __: CangBienResponse, idx: number) =>
        (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Mã cảng',
      dataIndex: 'maCang',
      width: 160,
      render: (maCang: string) => <Tag color="cyan">{maCang}</Tag>,
    },
    {
      title: 'Tên cảng',
      dataIndex: 'tenCang',
      width: 250,
      ellipsis: true,
      render: (text: string, record: CangBienResponse) => (
        <button
          type="button"
          style={{ background: 'none', border: 'none', color: '#1677ff', cursor: 'pointer', padding: 0, textAlign: 'left' }}
          onClick={async () => {
            try {
              setIsLoading(true);
              const data = await fetchCangBienById(record.id);
              setSelectedRecord(data);
              const fileRes = await giayToApi.listByEntity('cang-bien', record.id, { page: 1, size: 20 });
              setDetailFiles(fileRes.data || []);
              setDetailModalVisible(true);
            } catch (err) {
              toast.error('Không thể tải thông tin chi tiết cảng biển');
            } finally {
              setIsLoading(false);
            }
          }}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              try {
                setIsLoading(true);
                const data = await fetchCangBienById(record.id);
                setSelectedRecord(data);
                const fileRes = await giayToApi.listByEntity('cang-bien', record.id, { page: 1, size: 20 });
                setDetailFiles(fileRes.data || []);
                setDetailModalVisible(true);
              } catch (err) {
                toast.error('Không thể tải thông tin chi tiết cảng biển');
              } finally {
                setIsLoading(false);
              }
            }
          }}
          aria-label={`Xem chi tiết ${text}`}
        >
          {text}
        </button>
      ),
    },
    {
      title: 'Tỉnh/thành phố',
      dataIndex: 'tinhThanhPho',
      width: 180,
      ellipsis: true,
      render: (v: string | null) => v || '—',
    },
    {
      title: 'Vĩ độ',
      dataIndex: 'viDo',
      width: 110,
      render: (v: number | null) => (v != null ? v.toFixed(4) : '—'),
    },
    {
      title: 'Kinh độ',
      dataIndex: 'kinhDo',
      width: 110,
      render: (v: number | null) => (v != null ? v.toFixed(4) : '—'),
    },
    {
      title: 'Diện tích (m²)',
      dataIndex: 'dienTich',
      width: 140,
      align: 'right' as const,
      render: (v: number | null) => (v != null ? v.toFixed(2) : '—'),
    },
    {
      title: 'Khả năng tiếp nhận',
      dataIndex: 'khaNangTiepNhan',
      width: 150,
      align: 'right' as const,
      render: (v: number | null) => (v != null ? v.toFixed(2) : '—'),
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'trangThaiHoatDong',
      width: 130,
      render: (status: string | null) => {
        const b = status ? trangThaiHoatDongBadge(status) : { color: 'default', label: '—' };
        return <Tag color={b.color}>{b.label}</Tag>;
      },
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'trangThaiPheDuyet',
      width: 140,
      render: (status: string | null) => {
        const b = status ? trangThaiPheDuyetBadge(status) : { color: 'default', label: '—' };
        return <Tag color={b.color}>{b.label}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 150,
      render: (v: string | null) => formatDate(v),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 320,
      fixed: 'right' as const,
      render: (_: unknown, record: CangBienResponse) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const data = await fetchCangBienById(record.id);
                  setSelectedRecord(data);
                  const fileRes = await giayToApi.listByEntity('cang-bien', record.id, { page: 1, size: 20 });
                  setDetailFiles(fileRes.data || []);
                  setDetailModalVisible(true);
                } catch (err) {
                  toast.error('Không thể tải thông tin chi tiết cảng biển');
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const data = await fetchCangBienById(record.id);
                  setSelectedRecord(data);
                  updateForm.setFieldsValue({
                    id: data.id,
                    maCang: data.maCang,
                    tenCang: data.tenCang,
                    tinhThanhPho: data.tinhThanhPho || undefined,
                    viDo: data.viDo != null ? data.viDo : undefined,
                    kinhDo: data.kinhDo != null ? data.kinhDo : undefined,
                    dienTich: data.dienTich != null ? data.dienTich : undefined,
                    khaNangTiepNhan: data.khaNangTiepNhan != null ? data.khaNangTiepNhan : undefined,
                    trangThaiHoatDong: data.trangThaiHoatDong || undefined,
                  });
                  setUpdateModalVisible(true);
                } catch (err) {
                  toast.error('Không thể tải thông tin chỉnh sửa cảng biển');
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          </Tooltip>
          {record.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
            <>
              <Tooltip title="Phê duyệt">
                <Popconfirm
                  title="Phê duyệt cảng biển?"
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApprove(record)}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối cảng biển?"
                  okText="Từ chối"
                  cancelText="Hủy"
                  onConfirm={() => handleReject(record)}
                >
                  <Button type="link" size="small" danger icon={<CloseCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa"
              description={`Bạn có chắc muốn xóa cảng biển "${record.tenCang}"?`}
              okText="Xóa"
              okType="danger"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Lịch sử">
            <Button
              type="link"
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => navigate(`/cangbien/${record.id}/history`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }} ref={searchRef}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tên, mã..."
                allowClear
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
                onChange={handleSearchInput}
                aria-label="Tìm kiếm cảng biển"
              />
              <Input
                placeholder="Lọc theo mã"
                allowClear
                style={{ width: 160 }}
                value={filterMaCang}
                onChange={(e) => { setFilterMaCang(e.target.value); setPage(1); }}
                aria-label="Lọc theo mã cảng"
              />
              <Input
                placeholder="Lọc theo tên"
                allowClear
                style={{ width: 180 }}
                value={filterTenCang}
                onChange={(e) => { setFilterTenCang(e.target.value); setPage(1); }}
                aria-label="Lọc theo tên cảng"
              />
              <Input
                placeholder="Lọc theo tỉnh/thành"
                allowClear
                style={{ width: 180 }}
                value={filterTinhThanhPho}
                onChange={(e) => { setFilterTinhThanhPho(e.target.value); setPage(1); }}
                aria-label="Lọc theo tỉnh thành"
              />
              <Select
                placeholder="Trạng thái hoạt động"
                allowClear
                style={{ width: 180 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={[
                  { label: 'Hiện hành', value: 'HIEN_HANH' },
                  { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
                ]}
                aria-label="Lọc theo trạng thái hoạt động"
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 180 }}
                value={filterApprovalStatus}
                onChange={(val) => { setFilterApprovalStatus(val); setPage(1); }}
                options={[
                  { label: 'Chờ phê duyệt', value: 'CHO_PHE_DUYET' },
                  { label: 'Được phê duyệt', value: 'DUOC_PHE_DUYET' },
                  { label: 'Từ chối', value: 'TU_CHOI' },
                ]}
                aria-label="Lọc theo trạng thái phê duyệt"
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} aria-label="Tải lại danh sách" />
              </Tooltip>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  createForm.resetFields();
                  createForm.setFieldsValue({ trangThaiPheDuyet: 'CHO_PHE_DUYET' });
                  setCreateModalVisible(true);
                }}
                aria-label="Tạo mới cảng biển"
              >
                Tạo cảng biển
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
 
      <Card>
        <Spin spinning={isLoading} tip="Đang tải...">
          {isError && (
            <div>
              <p>Đã xảy ra lỗi khi tải danh sách.</p>
              <Button onClick={fetchData}>Thử lại</Button>
            </div>
          )}
          {!isLoading && !isError && dataSource.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p>
                {search || filterMaCang || filterTenCang
                  ? 'Không tìm thấy kết quả phù hợp.'
                  : 'Chưa có cảng biển nào.'}
              </p>
              {!search && !filterMaCang && !filterTenCang && (
                <Button
                  type="primary"
                  onClick={() => {
                    createForm.resetFields();
                    createForm.setFieldsValue({ trangThaiPheDuyet: 'CHO_PHE_DUYET' });
                    setCreateModalVisible(true);
                  }}
                >
                  Tạo cảng biển đầu tiên
                </Button>
              )}
            </div>
          )}
          {!isLoading && !isError && dataSource.length > 0 && (
            <Table<CangBienResponse>
              columns={columns}
              dataSource={dataSource}
              rowKey="id"
              scroll={{ x: 1600 }}
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: (p, sz) => {
                  setPage(p);
                  if (sz) setPageSize(sz);
                },
                showSizeChanger: true,
                showTotal: (t) => `Tổng ${t} cảng biển`,
                pageSizeOptions: ['20', '50', '100'],
              }}
              aria-label="Bảng danh sách cảng biển"
            />
          )}
        </Spin>
      </Card>

      {/* Create Modal */}
      <Modal
        title="Tạo mới Cảng biển"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateFinish} initialValues={{ trangThaiPheDuyet: 'CHO_PHE_DUYET' }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Mã cảng *"
                name="maCang"
                rules={[{ required: true, message: 'Mã cảng không được để trống' }, { max: 50, message: 'Mã cảng tối đa 50 ký tự' }]}
              >
                <Input placeholder="VD: CB-HAIPHONG-001" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cảng *"
                name="tenCang"
                rules={[{ required: true, message: 'Tên cảng không được để trống' }, { max: 255, message: 'Tên cảng tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Item label="Tỉnh/thành phố" name="tinhThanhPho" rules={[{ max: 100, message: 'Tỉnh/thành phố tối đa 100 ký tự' }]}>
                <Input placeholder="VD: Hải Phòng" maxLength={100} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông tin địa lý
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Vĩ độ (Latitude)" name="viDo">
                <InputNumber min={-90} max={90} step={0.000001} precision={6} placeholder="VD: 20.9" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kinh độ (Longitude)" name="kinhDo">
                <InputNumber min={-180} max={180} step={0.000001} precision={6} placeholder="VD: -106.7" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          {createGpsPairedWarning && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}>
              <Typography.Text type="warning">⚠️ Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau.</Typography.Text>
            </Card>
          )}

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thống kê
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Diện tích (m²) *" name="dienTich" rules={[{ required: true, message: 'Diện tích phải lớn hơn 0' }]}>
                <InputNumber min={0.01} step={0.01} precision={2} placeholder="VD: 100.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Khả năng tiếp nhận" name="khaNangTiepNhan">
                <InputNumber step={0.01} precision={2} placeholder="VD: 500000" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="trangThaiHoatDong">
                <Select placeholder="Chọn trạng thái" options={TRANG_THAI_HOAT_DONG_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt" name="trangThaiPheDuyet" rules={[{ required: true, message: 'Vui lòng chọn trạng thái phê duyệt' }]}>
                <Select options={[{ label: 'Chờ phê duyệt', value: 'CHO_PHE_DUYET' }, { label: 'Được phê duyệt', value: 'DUOC_PHE_DUYET' }, { label: 'Từ chối', value: 'TU_CHOI' }]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>Tạo cảng biển</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={selectedRecord ? `Chỉnh sửa: ${selectedRecord.maCang} — ${selectedRecord.tenCang}` : 'Chỉnh sửa cảng biển'}
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateFinish}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Mã cảng" name="maCang">
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cảng"
                name="tenCang"
                rules={[{ max: 255, message: 'Tên cảng tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng biển Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Item
                label="Tỉnh/thành phố"
                name="tinhThanhPho"
                rules={[{ max: 100, message: 'Tỉnh/thành phố tối đa 100 ký tự' }]}
              >
                <Input placeholder="VD: Hải Phòng" maxLength={100} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông tin địa lý
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Vĩ độ (Latitude)" name="viDo">
                <InputNumber min={-90} max={90} step={0.000001} precision={6} placeholder="VD: 20.9" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kinh độ (Longitude)" name="kinhDo">
                <InputNumber min={-180} max={180} step={0.000001} precision={6} placeholder="VD: -106.7" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          {updateGpsPairedWarning && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}>
              <Typography.Text type="warning">
                ⚠️ Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau.
              </Typography.Text>
            </Card>
          )}

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thống kê
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Diện tích (m²)" name="dienTich">
                <InputNumber min={0.01} step={0.01} precision={2} placeholder="VD: 100.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Khả năng tiếp nhận" name="khaNangTiepNhan">
                <InputNumber step={0.01} precision={2} placeholder="VD: 500000" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="trangThaiHoatDong">
                <Select placeholder="Chọn trạng thái" options={TRANG_THAI_HOAT_DONG_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt">
                <Input disabled value={selectedRecord?.trangThaiPheDuyet || '—'} aria-readonly="true" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setUpdateModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>Cập nhật</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={selectedRecord ? `Chi tiết cảng biển: ${selectedRecord.maCang} — ${selectedRecord.tenCang}` : 'Chi tiết cảng biển'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedRecord && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={16}>
                <Card title="Thông tin chung" size="small" style={{ height: '100%' }}>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Typography.Text strong>Mã cảng:</Typography.Text>
                      <br />
                      <Tag color="cyan">{selectedRecord.maCang}</Tag>
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Tên cảng:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.tenCang}</Typography.Text>
                    </Col>
                    <Col span={24} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Tỉnh/thành phố:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.tinhThanhPho || '—'}</Typography.Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Thống kê" size="small" style={{ height: '100%' }}>
                  <Typography.Text strong>Diện tích (m²):</Typography.Text>
                  <br />
                  <Typography.Text>{selectedRecord.dienTich != null ? selectedRecord.dienTich.toFixed(2) : '—'}</Typography.Text>
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'block' }}>Khả năng tiếp nhận:</Typography.Text>
                  <Typography.Text>{selectedRecord.khaNangTiepNhan != null ? selectedRecord.khaNangTiepNhan.toFixed(2) : '—'}</Typography.Text>
                </Card>
              </Col>
              <Col span={16}>
                <Card title="Thông tin địa lý" size="small" style={{ height: '100%' }}>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Typography.Text strong>Vĩ độ:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.viDo != null ? selectedRecord.viDo.toFixed(6) : '—'}</Typography.Text>
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Kinh độ:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.kinhDo != null ? selectedRecord.kinhDo.toFixed(6) : '—'}</Typography.Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Trạng thái" size="small" style={{ height: '100%' }}>
                  <Typography.Text strong>Hoạt động:</Typography.Text>
                  <br />
                  {selectedRecord.trangThaiHoatDong && (
                    <Tag color={trangThaiHoatDongBadge(selectedRecord.trangThaiHoatDong).color}>
                      {trangThaiHoatDongBadge(selectedRecord.trangThaiHoatDong).label}
                    </Tag>
                  )}
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'block' }}>Phê duyệt:</Typography.Text>
                  {selectedRecord.trangThaiPheDuyet && (
                    <Tag color={trangThaiPheDuyetBadge(selectedRecord.trangThaiPheDuyet).color}>
                      {trangThaiPheDuyetBadge(selectedRecord.trangThaiPheDuyet).label}
                    </Tag>
                  )}
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Tài liệu đính kèm" size="small">
                  {detailFiles.length === 0 ? (
                    <span style={{ color: '#bfbfbf' }}>Không có tài liệu đính kèm</span>
                  ) : (
                    <div>
                      {detailFiles.map((f) => (
                        <div key={f.id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Typography.Text strong>{f.fileName}</Typography.Text>
                            <br />
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {f.fileSize} bytes — {new Date(f.createdAt).toLocaleString('vi-VN')}
                            </Typography.Text>
                          </div>
                          <Button
                            type="link"
                            icon={<DownloadOutlined />}
                            onClick={() => window.open(giayToApi.downloadUrl(f.minioKey), '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
 
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button icon={<UploadOutlined />} onClick={() => { setDetailModalVisible(false); navigate(`/giayto/upload/cang-bien/${selectedRecord.id}`); }}>
                  Upload Giấy tờ
                </Button>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailModalVisible(false);
                    updateForm.setFieldsValue({
                      id: selectedRecord.id,
                      maCang: selectedRecord.maCang,
                      tenCang: selectedRecord.tenCang,
                      tinhThanhPho: selectedRecord.tinhThanhPho || undefined,
                      viDo: selectedRecord.viDo != null ? selectedRecord.viDo : undefined,
                      kinhDo: selectedRecord.kinhDo != null ? selectedRecord.kinhDo : undefined,
                      dienTich: selectedRecord.dienTich != null ? selectedRecord.dienTich : undefined,
                      khaNangTiepNhan: selectedRecord.khaNangTiepNhan != null ? selectedRecord.khaNangTiepNhan : undefined,
                      trangThaiHoatDong: selectedRecord.trangThaiHoatDong || undefined,
                    });
                    setUpdateModalVisible(true);
                  }}
                >
                  Chỉnh sửa
                </Button>
                <Button onClick={() => setDetailModalVisible(false)}>Đóng</Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
