import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  Typography,
  Popconfirm,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  HistoryOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import {
  fetchCauCangList,
  fetchCauCangById,
  createCauCang,
  updateCauCang,
  deleteCauCang,
  approveCauCang,
  rejectCauCang,
  fetchBenCangOptions,
} from './api';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from '../../services/cangbien/schema';
import type { CauCang, CauCangListQuery, BenCangOption } from './types';
import { giayToApi } from '../giayto/api';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import { z } from 'zod';
import { cauCangCreateSchema, cauCangUpdateSchema } from './schema';
import GiayToUploadModal from '../giayto/GiayToUploadModal';

export const translateFieldName = (fieldName: string): string => {
  const map: Record<string, string> = {
    maCang: 'Mã cảng biển',
    tenCang: 'Tên cảng biển',
    tinhThanhPho: 'Tỉnh/Thành phố',
    viDo: 'Vĩ độ',
    kinhDo: 'Kinh độ',
    dienTich: 'Diện tích (ha)',
    khaNangTiepNhan: 'Khả năng tiếp nhận',
    nhomCangBien: 'Nhóm cảng biển',
    maBen: 'Mã bến cảng',
    tenBen: 'Tên bến cảng',
    cangBienId: 'Cảng biển chủ',
    tuyenDuongThuy: 'Tuyến đường thủy',
    chieuRong: 'Chiều rộng (m)',
    loaiBen: 'Loại bến',
    doSauLuong: 'Độ sâu luồng (m)',
    maCau: 'Mã cầu cảng',
    tenCau: 'Tên cầu cảng',
    benCangId: 'Bến cảng chủ',
    chieuDai: 'Chiều dài (m)',
    taiTrong: 'Tải trọng (tấn)',
    loaiCau: 'Loại cầu',
    maCangCan: 'Mã cảng cạn',
    tenCangCan: 'Tên cảng cạn',
    viTri: 'Vị trí',
    dienTichDat: 'Diện tích đất (ha)',
    dienTichNuoc: 'Diện tích nước (ha)',
    nangLucThongQua: 'Năng lực thông qua',
    maVungNuoc: 'Mã vùng nước',
    tenVungNuoc: 'Tên vùng nước',
    viTriVungNuoc: 'Vị trí vùng nước',
    chieuDaiVungNuoc: 'Chiều dài vùng nước (m)',
    chieuRongVungNuoc: 'Chiều rộng vùng nước (m)',
    doSauVungNuoc: 'Độ sâu vùng nước (m)',
    trangThaiHoatDong: 'Trạng thái hoạt động',
    trangThaiPheDuyet: 'Trạng thái phê duyệt',
    orgUnitId: 'Đơn vị quản lý',
    congNangKhaiThac: 'Công năng khai thác',
    bieuTuongId: 'Biểu tượng bản đồ',
    iconId: 'Biểu tượng bản đồ',
    lineSymbolId: 'Ký hiệu đường',
    fillSymbolId: 'Ký hiệu vùng',
  };
  return map[fieldName] || fieldName;
};

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  'HIEN_HANH': { color: 'green', label: 'Hiện hành' },
  'TAM_NGUNG': { color: 'gold', label: 'Tạm ngừng' },
};

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  'CHO_PHE_DUYET': { color: 'gold', label: 'Chờ phê duyệt' },
  'DUOC_PHE_DUYET': { color: 'green', label: 'Được phê duyệt' },
  'TU_CHOI': { color: 'red', label: 'Từ chối' },
};

const CONG_NANG_KHAI_THAC_OPTIONS = [
  { label: 'Hàng Container', value: 'Hàng Container' },
  { label: 'Hàng tổng hợp (bách hóa)', value: 'Hàng tổng hợp (bách hóa)' },
  { label: 'Hàng chuyên dụng hàng rời, quặng', value: 'Hàng chuyên dụng hàng rời, quặng' },
  { label: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng', value: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng' },
  { label: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu ...)', value: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu ...)' },
  { label: 'Hành khách', value: 'Hành khách' }
];

export default function CauCangListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>();
  const [filterApproval, setFilterApproval] = useState<string>();
  const [filterBenCangId, setFilterBenCangId] = useState<string>();
  const sortBy = 'createdAt';
  const sortOrder = 'desc';
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CauCang[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [benCangOptions, setBenCangOptions] = useState<BenCangOption[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(res.data);
    } catch (err) {
      console.error('Failed to load symbols', err);
    }
  }, []);

  // Modals visibility
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CauCang | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Forms definition
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const query: CauCangListQuery = {
        search: search || undefined,
        status: filterStatus as any,
        approvalStatus: filterApproval as any,
        benCangId: filterBenCangId || undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        page,
        pageSize,
      };
      const res = await fetchCauCangList(query);
      setDataSource(res.content);
      setTotal(res.totalElements);
    } catch (err: unknown) {
      console.error('Failed to fetch CauCang list:', err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cầu cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [search, filterStatus, filterApproval, filterBenCangId, sortBy, sortOrder, page, pageSize]);

  const loadBenCangOptions = useCallback(async () => {
    try {
      const res = await fetchBenCangOptions();
      setBenCangOptions(res.content);
    } catch (err) {
      console.error('Failed to load BenCang options:', err);
    }
  }, []);

  const translateValue = useCallback((fieldName: string, val: string | null): string => {
    if (!val || val === '(null)' || val === 'null') {
      return '(trống)';
    }
    if (['bieuTuongId', 'iconId', 'lineSymbolId', 'fillSymbolId'].includes(fieldName)) {
      const sym = symbols.find(s => s.id === val);
      return sym ? `${sym.name} (${sym.code})` : val;
    }
    return val;
  }, [symbols]);

  useEffect(() => {
    void loadBenCangOptions();
    void fetchSymbols();
  }, [loadBenCangOptions, fetchSymbols]);
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleDelete = useCallback(
    async (record: CauCang) => {
      try {
        await deleteCauCang(record.id);
        toast.success('Đã xóa cầu cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleApprove = useCallback(
    async (record: CauCang) => {
      try {
        await approveCauCang(record.id);
        toast.success('Đã phê duyệt cầu cảng');
        fetchData();
        if (detailModalVisible && selectedRecord?.id === record.id) {
          const updated = await fetchCauCangById(record.id);
          setSelectedRecord(updated);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, detailModalVisible, selectedRecord],
  );

  const handleReject = useCallback(
    async (record: CauCang) => {
      const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
      if (reason === null || reason.trim().length < 10) {
        if (reason === null) return;
        toast.warning('Lý do từ chối tối thiểu 10 ký tự');
        return;
      }
      try {
        await rejectCauCang(record.id, reason);
        toast.success('Đã từ chối cầu cảng');
        fetchData();
        if (detailModalVisible && selectedRecord?.id === record.id) {
          const updated = await fetchCauCangById(record.id);
          setSelectedRecord(updated);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData, detailModalVisible, selectedRecord],
  );

  const handleCreateFinish = async (values: any) => {
    try {
      const parsed = cauCangCreateSchema.parse({
        maCau: values.maCau,
        tenCau: values.tenCau,
        benCangId: values.benCangId,
        chieuDai: values.chieuDai || undefined,
        taiTrong: values.taiTrong || undefined,
        loaiCau: values.loaiCau || undefined,
        congNangKhaiThac: values.congNangKhaiThac ? values.congNangKhaiThac.join(', ') : undefined,
        trangThaiHoatDong: values.trangThaiHoatDong || 'HIEN_HANH',
        bieuTuongId: values.bieuTuongId || undefined,
      });

      setSubmitting(true);
      await createCauCang(parsed);
      toast.success('Tạo mới cầu cảng thành công');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((e) => toast.error(e.message));
      } else if ((err as any).status === 409) {
        createForm.setFields([{ name: 'maCau', errors: ['Mã cầu đã tồn tại.'] }]);
        toast.error('Mã cầu đã tồn tại');
      } else {
        toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFinish = async (values: any) => {
    if (!selectedRecord) return;
    try {
      const parsed = cauCangUpdateSchema.parse({
        id: selectedRecord.id,
        tenCau: values.tenCau || undefined,
        benCangId: values.benCangId || undefined,
        chieuDai: values.chieuDai,
        taiTrong: values.taiTrong,
        loaiCau: values.loaiCau || undefined,
        congNangKhaiThac: values.congNangKhaiThac ? values.congNangKhaiThac.join(', ') : undefined,
        trangThaiHoatDong: values.trangThaiHoatDong,
        bieuTuongId: values.bieuTuongId || null,
      });

      setSubmitting(true);
      await updateCauCang(parsed);
      toast.success('Cập nhật cầu cảng thành công');
      setUpdateModalVisible(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'STT',
        width: 60,
        render: (_: unknown, __: CauCang, idx: number) => page * pageSize + idx + 1,
      },
      {
        title: 'Mã cầu',
        dataIndex: 'maCau',
        width: 120,
        render: (maCau: string) => <Tag color="cyan">{maCau}</Tag>,
      },
      {
        title: 'Tên cầu',
        dataIndex: 'tenCau',
        width: 250,
        ellipsis: true,
      },
      {
        title: 'Bến cảng chủ',
        dataIndex: 'benCangId',
        width: 180,
        render: (benCangId: string) => {
          const opt = benCangOptions.find((o) => o.id === benCangId);
          return opt ? opt.tenBen : benCangId?.slice(0, 8) + '…';
        },
      },
      {
        title: 'Chiều dài (m)',
        dataIndex: 'chieuDai',
        width: 125,
        align: 'right' as const,
        render: (v: number | null) => v != null && v !== undefined ? v.toFixed(2) : '—',
      },
      {
        title: 'Tải trọng (tấn)',
        dataIndex: 'taiTrong',
        width: 125,
        align: 'right' as const,
        render: (v: number | null) => v != null && v !== undefined ? v.toFixed(2) : '—',
      },
      {
        title: 'Loại cầu',
        dataIndex: 'loaiCau',
        width: 120,
        ellipsis: true,
        render: (v: string) => v || '—',
      },
      {
        title: 'Trạng thái HĐ',
        dataIndex: 'trangThaiHoatDong',
        width: 100,
        render: (v: string) => {
          const badge = trangThaiHoatDongBadge(v);
          return <Tag color={badge.color}>{badge.label}</Tag>;
        },
      },
      {
        title: 'Phê duyệt',
        dataIndex: 'trangThaiPheDuyet',
        width: 110,
        render: (v: string) => {
          const badge = trangThaiPheDuyetBadge(v);
          return <Tag color={badge.color}>{badge.label}</Tag>;
        },
      },
      {
        title: 'Ngày tạo',
        dataIndex: 'createdAt',
        width: 140,
        render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 240,
        fixed: 'right' as const,
        render: (_: unknown, record: CauCang) => (
          <Space size="small">
            <Tooltip title="Xem chi tiết">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const data = await fetchCauCangById(record.id);
                    setSelectedRecord(data);
                    const fileRes = await giayToApi.listByEntity('cau-cang', record.id, { page: 1, size: 20 });
                    setDetailFiles(fileRes.data || []);
                    setDetailModalVisible(true);
                  } catch (err) {
                    toast.error('Không thể tải thông tin chi tiết cầu cảng');
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
            </Tooltip>
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const data = await fetchCauCangById(record.id);
                    setSelectedRecord(data);
                    updateForm.setFieldsValue({
                      maCau: data.maCau,
                      tenCau: data.tenCau,
                      benCangId: data.benCangId,
                      chieuDai: data.chieuDai,
                      taiTrong: data.taiTrong,
                      loaiCau: data.loaiCau,
                      congNangKhaiThac: data.congNangKhaiThac ? data.congNangKhaiThac.split(',').map(s => s.trim()) : [],
                      trangThaiHoatDong: data.trangThaiHoatDong,
                    });
                    setUpdateModalVisible(true);
                  } catch (err) {
                    toast.error('Không thể tải thông tin cầu cảng');
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
            </Tooltip>
            <Tooltip title="Lịch sử">
              <Button
                type="link"
                size="small"
                icon={<HistoryOutlined />}
                onClick={async () => {
                  try {
                    setLoadingHistory(true);
                    setSelectedRecord(record);
                    setHistoryModalVisible(true);
                    const { fetchCauCangHistory } = await import('./api');
                    const histData = await fetchCauCangHistory(record.id);
                    setHistoryRecords(histData?.changeHistory || []);
                  } catch (err) {
                    toast.error('Không thể tải lịch sử thay đổi');
                  } finally {
                    setLoadingHistory(false);
                  }
                }}
              />
            </Tooltip>
            {record.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
              <>
                <Tooltip title="Phê duyệt">
                  <Popconfirm
                    title="Phê duyệt cầu cảng?"
                    okText="Phê duyệt"
                    cancelText="Hủy"
                    onConfirm={() => handleApprove(record)}
                  >
                    <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                  </Popconfirm>
                </Tooltip>
                <Tooltip title="Từ chối">
                  <Popconfirm
                    title="Từ chối cầu cảng?"
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
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xác nhận xóa cầu cảng?"
                description={`Bạn có chắc muốn xóa cầu cảng "${record.maCau}"?`}
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() => handleDelete(record)}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [page, pageSize, benCangOptions, handleApprove, handleReject, handleDelete, navigate],
  );

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo mã, tên..."
                allowClear
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
                onClear={() => setSearch('')}
              />
              <Select
                placeholder="Trạng thái HĐ"
                allowClear
                style={{ width: 160 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(0); }}
                options={Object.entries(STATUS_MAP).map(([v, { label }]) => ({ value: v, label }))}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 180 }}
                value={filterApproval}
                onChange={(val) => { setFilterApproval(val); setPage(0); }}
                options={Object.entries(APPROVAL_MAP).map(([v, { label }]) => ({ value: v, label }))}
              />
              <Select
                placeholder="Bến cảng chủ"
                allowClear
                style={{ width: 200 }}
                value={filterBenCangId}
                onChange={(val) => { setFilterBenCangId(val); setPage(0); }}
                options={benCangOptions.map((o) => ({ value: o.id, label: o.tenBen }))}
                showSearch
                filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={() => { setPage(0); fetchData(); }} />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateModalVisible(true); }}>
                Tạo cầu cảng
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách cầu cảng'}
            onRetry={() => { setPage(0); fetchData(); }}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterStatus || filterApproval || filterBenCangId ? 'Không tìm thấy' : 'Chưa có cầu cảng nào'}
            ctaText="Tạo cầu cảng đầu tiên"
            onCta={() => { createForm.resetFields(); setCreateModalVisible(true); }}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<CauCang>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1600 }}
            pagination={{
              current: page + 1,
              pageSize,
              total,
              onChange: (p) => setPage(p - 1),
              showSizeChanger: true,
              showTotal: (t) => `Hiển thị 1-${Math.min(pageSize, t - page * pageSize)} của ${t} kết quả`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        title="Tạo mới Cầu cảng"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateFinish} initialValues={{ trangThaiHoatDong: 'HIEN_HANH' }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Mã cầu *"
                name="maCau"
                rules={[{ required: true, message: 'Mã cầu không được để trống' }, { max: 50, message: 'Mã cầu tối đa 50 ký tự' }]}
              >
                <Input placeholder="VD: CC-HAIPHONG-001" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cầu *"
                name="tenCau"
                rules={[{ required: true, message: 'Tên cầu không được để trống' }, { max: 255, message: 'Tên cầu tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cầu cảng Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Bến cảng chủ *"
                name="benCangId"
                rules={[{ required: true, message: 'Vui lòng chọn bến cảng chủ' }]}
              >
                <Select
                  placeholder="Chọn bến cảng chủ"
                  showSearch
                  optionFilterProp="label"
                  options={benCangOptions.map(o => ({ label: o.tenBen, value: o.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Loại cầu"
                name="loaiCau"
                rules={[{ max: 100, message: 'Loại cầu tối đa 100 ký tự' }]}
              >
                <Input placeholder="VD: Cầu nước, Cầu bờ..." maxLength={100} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số kỹ thuật
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Chiều dài (m)" name="chieuDai">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 150.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tải trọng (tấn)" name="taiTrong">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 5000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label="Công năng khai thác" name="congNangKhaiThac">
                <Select
                  mode="multiple"
                  placeholder="Chọn công năng khai thác"
                  allowClear
                  options={CONG_NANG_KHAI_THAC_OPTIONS}
                />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="trangThaiHoatDong">
                <Select placeholder="Chọn trạng thái" options={Object.entries(STATUS_MAP).map(([v, { label }]) => ({ value: v, label }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="bieuTuongId" label="Biểu tượng bản đồ">
                <Select placeholder="Chọn biểu tượng hiển thị" allowClear showSearch optionFilterProp="label">
                  {symbols.map((sym) => (
                    <Select.Option key={sym.id} value={sym.id} label={`${sym.name} (${sym.code})`}>
                      <Space>
                        {sym.hinhAnh && (
                          <img
                            src={sym.hinhAnh.startsWith('data:') ? sym.hinhAnh : `data:image/png;base64,${sym.hinhAnh}`}
                            alt={sym.name}
                            style={{ width: 20, height: 20, objectFit: 'contain' }}
                          />
                        )}
                        <span>{sym.name} ({sym.code})</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>Tạo cầu cảng</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={selectedRecord ? `Chỉnh sửa: ${selectedRecord.maCau} — ${selectedRecord.tenCau}` : 'Chỉnh sửa cầu cảng'}
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
              <Form.Item label="Mã cầu" name="maCau">
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cầu *"
                name="tenCau"
                rules={[{ required: true, message: 'Tên cầu không được để trống' }, { max: 255, message: 'Tên cầu tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cầu cảng Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Bến cảng chủ *"
                name="benCangId"
                rules={[{ required: true, message: 'Vui lòng chọn bến cảng chủ' }]}
              >
                <Select
                  placeholder="Chọn bến cảng chủ"
                  showSearch
                  optionFilterProp="label"
                  options={benCangOptions.map(o => ({ label: o.tenBen, value: o.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Loại cầu"
                name="loaiCau"
                rules={[{ max: 100, message: 'Loại cầu tối đa 100 ký tự' }]}
              >
                <Input placeholder="VD: Cầu nước, Cầu bờ..." maxLength={100} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số kỹ thuật
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Chiều dài (m)" name="chieuDai">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 150.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tải trọng (tấn)" name="taiTrong">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 5000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label="Công năng khai thác" name="congNangKhaiThac">
                <Select
                  mode="multiple"
                  placeholder="Chọn công năng khai thác"
                  allowClear
                  options={CONG_NANG_KHAI_THAC_OPTIONS}
                />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="trangThaiHoatDong">
                <Select placeholder="Chọn trạng thái" options={Object.entries(STATUS_MAP).map(([v, { label }]) => ({ value: v, label }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt">
                <Input disabled value={selectedRecord?.trangThaiPheDuyet ? trangThaiPheDuyetBadge(selectedRecord.trangThaiPheDuyet).label : '—'} aria-readonly="true" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="bieuTuongId" label="Biểu tượng bản đồ">
                <Select placeholder="Chọn biểu tượng hiển thị" allowClear showSearch optionFilterProp="label">
                  {symbols.map((sym) => (
                    <Select.Option key={sym.id} value={sym.id} label={`${sym.name} (${sym.code})`}>
                      <Space>
                        {sym.hinhAnh && (
                          <img
                            src={sym.hinhAnh.startsWith('data:') ? sym.hinhAnh : `data:image/png;base64,${sym.hinhAnh}`}
                            alt={sym.name}
                            style={{ width: 20, height: 20, objectFit: 'contain' }}
                          />
                        )}
                        <span>{sym.name} ({sym.code})</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
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
        title={selectedRecord ? `Chi tiết cầu cảng: ${selectedRecord.maCau} — ${selectedRecord.tenCau}` : 'Chi tiết cầu cảng'}
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
                      <Typography.Text strong>Mã cầu:</Typography.Text>
                      <br />
                      <Tag color="cyan">{selectedRecord.maCau}</Tag>
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Tên cầu:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.tenCau}</Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Bến cảng chủ:</Typography.Text>
                      <br />
                      <Typography.Text>
                        {benCangOptions.find(o => o.id === selectedRecord.benCangId)?.tenBen || selectedRecord.benCangId}
                      </Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Loại cầu:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.loaiCau || '—'}</Typography.Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Thông số kỹ thuật" size="small" style={{ height: '100%' }}>
                  <Typography.Text strong>Chiều dài:</Typography.Text> {selectedRecord.chieuDai != null ? `${selectedRecord.chieuDai.toFixed(2)} m` : '—'}
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'inline-block' }}>Tải trọng:</Typography.Text> {selectedRecord.taiTrong != null ? `${selectedRecord.taiTrong.toFixed(2)} tấn` : '—'}
                </Card>
              </Col>
              <Col span={16}>
                <Card title="Trạng thái" size="small" style={{ height: '100%' }}>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Typography.Text strong>Hoạt động:</Typography.Text>
                      <br />
                      {selectedRecord.trangThaiHoatDong && (
                        <Tag color={trangThaiHoatDongBadge(selectedRecord.trangThaiHoatDong).color}>
                          {trangThaiHoatDongBadge(selectedRecord.trangThaiHoatDong).label}
                        </Tag>
                      )}
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Phê duyệt:</Typography.Text>
                      <br />
                      {selectedRecord.trangThaiPheDuyet && (
                        <Tag color={trangThaiPheDuyetBadge(selectedRecord.trangThaiPheDuyet).color}>
                          {trangThaiPheDuyetBadge(selectedRecord.trangThaiPheDuyet).label}
                        </Tag>
                      )}
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Công năng khai thác" size="small">
                  {selectedRecord.congNangKhaiThac ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedRecord.congNangKhaiThac.split(',').map(s => s.trim()).filter(Boolean).map(c => (
                        <Tag color="blue" key={c}>{c}</Tag>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#bfbfbf' }}>Chưa chọn công năng khai thác</span>
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
              <Col span={24}>
                <Card title="Thông tin hệ thống" size="small">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Người tạo">{selectedRecord.createdBy || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
                    <Descriptions.Item label="Cập nhật bởi">{selectedRecord.updatedBy || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">{selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                {selectedRecord.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
                  <>
                    <Popconfirm
                      title="Phê duyệt cầu cảng?"
                      okText="Phê duyệt"
                      cancelText="Hủy"
                      onConfirm={() => handleApprove(selectedRecord)}
                    >
                      <Button type="primary" icon={<CheckCircleOutlined />}>Phê duyệt</Button>
                    </Popconfirm>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleReject(selectedRecord)}
                    >
                      Từ chối
                    </Button>
                  </>
                )}
                 <Button icon={<UploadOutlined />} onClick={() => { setDetailModalVisible(false); setUploadModalVisible(true); }}>
                  Upload Giấy tờ
                </Button>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailModalVisible(false);
                    updateForm.setFieldsValue({
                      maCau: selectedRecord.maCau,
                      tenCau: selectedRecord.tenCau,
                      benCangId: selectedRecord.benCangId,
                      chieuDai: selectedRecord.chieuDai,
                      taiTrong: selectedRecord.taiTrong,
                      loaiCau: selectedRecord.loaiCau,
                      congNangKhaiThac: selectedRecord.congNangKhaiThac ? selectedRecord.congNangKhaiThac.split(',').map(s => s.trim()) : [],
                      trangThaiHoatDong: selectedRecord.trangThaiHoatDong,
                      bieuTuongId: selectedRecord.bieuTuongId,
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

      {/* Upload Giấy tờ Modal */}
      {selectedRecord && (
        <GiayToUploadModal
          visible={uploadModalVisible}
          onClose={() => setUploadModalVisible(false)}
          entityType="cau-cang"
          entityId={selectedRecord.id}
          entityName={selectedRecord.tenCau}
          onUploaded={() => {
            fetchCauCangById(selectedRecord.id).then(data => {
              setSelectedRecord(data);
              giayToApi.listByEntity('cau-cang', selectedRecord.id, { page: 1, size: 20 }).then(res => {
                setDetailFiles(res.data || []);
              });
            });
          }}
        />
      )}

      {/* History Modal */}
      <Modal
        title={selectedRecord ? `Lịch sử thay đổi: ${selectedRecord.maCau} — ${selectedRecord.tenCau}` : 'Lịch sử thay đổi'}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {loadingHistory ? (
          <LoadingSkeleton rows={5} />
        ) : historyRecords.length === 0 ? (
          <EmptyState description="Chưa có thay đổi nào được ghi nhận." />
        ) : (
          <div style={{ borderLeft: '2px solid #f0f0f0', paddingLeft: 24, marginLeft: 8, marginTop: 16, maxHeight: '60vh', overflowY: 'auto' }}>
            {historyRecords
              .sort((a, b) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime())
              .map((record: any, idx: number) => {
                return (
                  <div key={record.id || idx} style={{ position: 'relative', marginBottom: 24, paddingBottom: 12, borderBottom: idx < historyRecords.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    {/* Timeline dot */}
                    <div style={{ position: 'absolute', left: -29, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#1890ff', border: '2px solid #fff', boxShadow: '0 0 0 2px #1890ff' }} />
                    
                    {/* Timestamp */}
                    <div style={{ marginBottom: 4 }}>
                      <Typography.Text strong>
                        {record.changedAt || record.createdAt ? new Date(record.changedAt || record.createdAt).toLocaleString('vi-VN') : '—'}
                      </Typography.Text>
                    </div>

                    {/* Actor */}
                    {(record.changedBy || record.actor) && (
                      <div style={{ marginBottom: 4 }}>
                        <Typography.Text type="secondary">Người thực hiện: </Typography.Text>
                        <Typography.Text strong>{record.changedBy || record.actor}</Typography.Text>
                      </div>
                    )}

                    {/* Field change */}
                    {(record.fieldName || record.fieldChanged) && (
                      <div style={{ marginBottom: 4 }}>
                        <Typography.Text type="secondary">Trường thay đổi: </Typography.Text>
                        <Typography.Text strong>{translateFieldName(record.fieldName || record.fieldChanged)}</Typography.Text>
                      </div>
                    )}

                    {/* Old/New value */}
                    {record.oldValue !== undefined && record.oldValue != null && (
                      <div style={{ marginBottom: 2 }}>
                        <Typography.Text type="secondary" style={{ textDecoration: 'line-through', color: '#ff4d4f' }}>
                          cũ: {translateValue(record.fieldName || record.fieldChanged, record.oldValue)}
                        </Typography.Text>
                      </div>
                    )}
                    {record.newValue !== undefined && record.newValue != null && (
                      <div>
                        <Typography.Text type="secondary">mới: </Typography.Text>
                        <Typography.Text style={{ color: '#52c41a', fontWeight: 500 }}>
                          {translateValue(record.fieldName || record.fieldChanged, record.newValue)}
                        </Typography.Text>
                      </div>
                    )}

                    {/* Reason */}
                    {record.reason && (
                      <div style={{ marginTop: 8, padding: 8, background: '#fff2f0', borderRadius: 4 }}>
                        <Typography.Text type="secondary">Lý do: </Typography.Text>
                        <Typography.Text>{record.reason}</Typography.Text>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </Modal>
    </>
  );
}
