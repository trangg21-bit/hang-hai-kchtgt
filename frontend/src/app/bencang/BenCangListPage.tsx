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
  InputNumber,
  Typography,
  Descriptions,
} from 'antd';
import type { TableProps } from 'antd';
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
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { benCangCRUD, benCangApproval } from '../../services/cangbenService';
import type { BenCang } from '../../types/cangben';
import { APPROVAL_STATUS_MAP } from '../../types/cangben';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from '../../services/cangbien/schema';
import { giayToApi } from '../giayto/api';
import { z } from 'zod';
import { createSchema, updateSchema } from './schema';
import GiayToUploadModal from '../giayto/GiayToUploadModal';

const ACTIVITY_STATUS_OPTIONS = [
  { label: 'Hiện hành', value: 'HIEN_HANH' },
  { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
];

const CONG_NANG_KHAI_THAC_OPTIONS = [
  { label: 'Hàng Container', value: 'Hàng Container' },
  { label: 'Hàng tổng hợp (bách hóa)', value: 'Hàng tổng hợp (bách hóa)' },
  { label: 'Hàng chuyên dụng hàng rời, quặng', value: 'Hàng chuyên dụng hàng rời, quặng' },
  { label: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng', value: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng' },
  { label: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu ...)', value: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu ...)' },
  { label: 'Hành khách', value: 'Hành khách' }
];

export const LOAI_BEN_OPTIONS = [
  { label: 'Bến Container', value: 'BEN_CONTAINER' },
  { label: 'Bến tổng hợp', value: 'BEN_TONG_HOP' },
  { label: 'Bến chuyên dụng', value: 'BEN_CHUYEN_DUNG' },
  { label: 'Bến hành khách', value: 'BEN_HANH_KHACH' },
  { label: 'Bến phao', value: 'BEN_PHAO' },
  { label: 'Bến thủy nội địa', value: 'BEN_THUY_NOI_DIA' },
];

export const LOAI_BEN_MAP = LOAI_BEN_OPTIONS.reduce((acc, opt) => {
  acc[opt.value] = opt.label;
  return acc;
}, {} as Record<string, string>);

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

export default function BenCangListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMaBen, setFilterMaBen] = useState('');
  const [filterTenBen, setFilterTenBen] = useState('');
  const [filterTuyenDuongThuy, setFilterTuyenDuongThuy] = useState('');
  const [filterLoaiBen, setFilterLoaiBen] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<BenCang[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cangBienOptions, setCangBienOptions] = useState<Array<{ id: string; tenCang: string }>>([]);

  // Modals visibility
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BenCang | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Forms definition
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchCangBienOptions = useCallback(async () => {
    try {
      const { fetchCangBienList } = await import('../../services/cangbien/api');
      const res = await fetchCangBienList({ page: 0, size: 5000, trangThaiHoatDong: 'HIEN_HANH' });
      setCangBienOptions(res.content.map((c) => ({ id: c.id, tenCang: c.tenCang })));
    } catch (err) {
      console.error('Failed to fetch CangBien options:', err);
    }
  }, []);

  const [symbols, setSymbols] = useState<Symbol[]>([]);

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(res.data);
    } catch (err) {
      console.error('Failed to load symbols', err);
    }
  }, []);

  useEffect(() => {
    void fetchCangBienOptions();
    void fetchSymbols();
  }, [fetchCangBienOptions, fetchSymbols]);

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await benCangCRUD.search({
        page,
        pageSize,
        maBen: filterMaBen || undefined,
        tenBen: filterTenBen || undefined,
        loaiBen: filterLoaiBen || undefined,
        tuyenDuongThuy: filterTuyenDuongThuy || undefined,
        trangThaiHoatDong: filterStatus,
        trangThaiPheDuyet: filterApprovalStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách bến cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterMaBen, filterTenBen, filterLoaiBen, filterTuyenDuongThuy, filterStatus, filterApprovalStatus]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setFilterMaBen(value);
    setFilterTenBen(value);
    setFilterTuyenDuongThuy(value);
    setFilterLoaiBen(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: BenCang) => {
      try {
        await benCangCRUD.delete(record.id);
        toast.success('Đã xóa bến cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleApprove = useCallback(
    async (record: BenCang) => {
      try {
        await benCangApproval.approve(record.id);
        toast.success('Đã phê duyệt bến cảng');
        fetchData();
        if (detailModalVisible && selectedRecord?.id === record.id) {
          const updated = await benCangCRUD.findById(record.id);
          setSelectedRecord(updated);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, detailModalVisible, selectedRecord],
  );

  const handleReject = useCallback(
    async (record: BenCang) => {
      const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
      if (reason === null || reason.length < 10) {
        if (reason === null) return;
        toast.warning('Lý do từ chối tối thiểu 10 ký tự');
        return;
      }
      try {
        await benCangApproval.reject(record.id, reason);
        toast.success('Đã từ chối bến cảng');
        fetchData();
        if (detailModalVisible && selectedRecord?.id === record.id) {
          const updated = await benCangCRUD.findById(record.id);
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
      const parsed = createSchema.parse({
        maBen: values.maBen,
        tenBen: values.tenBen,
        cangBienId: values.cangBienId,
        tuyenDuongThuy: values.tuyenDuongThuy || undefined,
        viDo: values.viDo || undefined,
        kinhDo: values.kinhDo || undefined,
        chieuDai: values.chieuDai || undefined,
        chieuRong: values.chieuRong || undefined,
        loaiBen: values.loaiBen || undefined,
        doSauLuong: values.doSauLuong || undefined,
        congNangKhaiThac: values.congNangKhaiThac ? values.congNangKhaiThac.join(', ') : undefined,
        trangThaiHoatDong: values.trangThaiHoatDong || 'HIEN_HANH',
        bieuTuongId: values.bieuTuongId || undefined,
      });

      setSubmitting(true);
      await benCangCRUD.create(parsed);
      toast.success('Tạo mới bến cảng thành công');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((e) => toast.error(e.message));
      } else if ((err as any).status === 409) {
        createForm.setFields([{ name: 'maBen', errors: ['Mã bến đã tồn tại.'] }]);
        toast.error('Mã bến đã tồn tại');
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
      const parsed = updateSchema.parse({
        id: selectedRecord.id,
        tenBen: values.tenBen || undefined,
        cangBienId: values.cangBienId || undefined,
        tuyenDuongThuy: values.tuyenDuongThuy || undefined,
        viDo: values.viDo,
        kinhDo: values.kinhDo,
        chieuDai: values.chieuDai,
        chieuRong: values.chieuRong,
        loaiBen: values.loaiBen || undefined,
        doSauLuong: values.doSauLuong,
        congNangKhaiThac: values.congNangKhaiThac ? values.congNangKhaiThac.join(', ') : undefined,
        trangThaiHoatDong: values.trangThaiHoatDong,
        bieuTuongId: values.bieuTuongId || null,
      });

      setSubmitting(true);
      await benCangCRUD.update(parsed);
      toast.success('Cập nhật bến cảng thành công');
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

  const columns: TableProps<BenCang>['columns'] = [
    {
      title: 'STT',
      width: 60,
      render: (_: unknown, __: BenCang, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Mã bến',
      dataIndex: 'maBen',
      width: 140,
      ellipsis: true,
      render: (maBen: string) => <Tag color="cyan">{maBen}</Tag>,
    },
    {
      title: 'Tên bến',
      dataIndex: 'tenBen',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Cảng biển chủ',
      dataIndex: 'cangBienId',
      width: 180,
      render: (val: string) => {
        const opt = cangBienOptions.find((o) => o.id === val);
        return opt ? opt.tenCang : val?.slice(0, 8) + '…';
      },
    },
    {
      title: 'Tuyến đường thủy',
      dataIndex: 'tuyenDuongThuy',
      width: 200,
      ellipsis: true,
      render: (v?: string) => v || '—',
    },
    {
      title: 'Chiều dài (m)',
      dataIndex: 'chieuDai',
      width: 120,
      align: 'right' as const,
      render: (v?: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Chiều rộng (m)',
      dataIndex: 'chieuRong',
      width: 120,
      align: 'right' as const,
      render: (v?: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Loại bến',
      dataIndex: 'loaiBen',
      width: 140,
      ellipsis: true,
      render: (v?: string) => (v ? (LOAI_BEN_MAP[v] || v) : '—'),
    },
    {
      title: 'Độ sâu luồng (m)',
      dataIndex: 'doSauLuong',
      width: 130,
      align: 'right' as const,
      render: (v?: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'trangThaiHoatDong',
      width: 130,
      render: (status?: string) => {
        const badge = trangThaiHoatDongBadge(status || '');
        return <Tag color={badge.color}>{badge.label}</Tag>;
      },
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'trangThaiPheDuyet',
      width: 140,
      render: (status?: string) => {
        const badge = trangThaiPheDuyetBadge(status || '');
        return <Tag color={badge.color}>{badge.label}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 140,
      render: (v?: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 360,
      fixed: 'right' as const,
      render: (_: unknown, record: BenCang) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const data = await benCangCRUD.findById(record.id);
                  setSelectedRecord(data);
                  const fileRes = await giayToApi.listByEntity('ben-cang', record.id, { page: 1, size: 20 });
                  setDetailFiles(fileRes.data || []);
                  setDetailModalVisible(true);
                } catch (err) {
                  toast.error('Không thể tải thông tin chi tiết bến cảng');
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
                  const data = await benCangCRUD.findById(record.id);
                  setSelectedRecord(data);
                  updateForm.setFieldsValue({
                    maBen: data.maBen,
                    tenBen: data.tenBen,
                    cangBienId: data.cangBienId,
                    tuyenDuongThuy: data.tuyenDuongThuy,
                    viDo: data.viDo,
                    kinhDo: data.kinhDo,
                    chieuDai: data.chieuDai,
                    chieuRong: data.chieuRong,
                    loaiBen: data.loaiBen,
                    doSauLuong: data.doSauLuong,
                    congNangKhaiThac: data.congNangKhaiThac ? data.congNangKhaiThac.split(',').map(s => s.trim()) : [],
                    trangThaiHoatDong: data.trangThaiHoatDong,
                    bieuTuongId: data.bieuTuongId,
                  });
                  setUpdateModalVisible(true);
                } catch (err) {
                  toast.error('Không thể tải thông tin bến cảng');
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
                  title="Phê duyệt bến cảng?"
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApprove(record)}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối bến cảng?"
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
                  const { fetchBenCangHistory } = await import('./api');
                  const histData = await fetchBenCangHistory(record.id);
                  setHistoryRecords(histData.changeHistory || []);
                } catch (err) {
                  toast.error('Không thể tải lịch sử thay đổi');
                } finally {
                  setLoadingHistory(false);
                }
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa bến cảng?"
              description={`Bạn có chắc muốn xóa bến cảng "${record.maBen}"?`}
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
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={14}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tên, mã..."
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Input
                placeholder="Lọc theo mã"
                allowClear
                style={{ width: 140 }}
                value={filterMaBen}
                onChange={(e) => { setFilterMaBen(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo tên"
                allowClear
                style={{ width: 160 }}
                value={filterTenBen}
                onChange={(e) => { setFilterTenBen(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo tuyến"
                allowClear
                style={{ width: 160 }}
                value={filterTuyenDuongThuy}
                onChange={(e) => { setFilterTuyenDuongThuy(e.target.value); setPage(1); }}
              />
              <Select
                placeholder="Lọc theo loại bến"
                allowClear
                style={{ width: 160 }}
                value={filterLoaiBen}
                onChange={(val) => { setFilterLoaiBen(val); setPage(1); }}
                options={LOAI_BEN_OPTIONS}
              />
              <Select
                placeholder="Trạng thái HĐ"
                allowClear
                style={{ width: 150 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={ACTIVITY_STATUS_OPTIONS}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 170 }}
                value={filterApprovalStatus}
                onChange={(val) => { setFilterApprovalStatus(val); setPage(1); }}
                options={Object.entries(APPROVAL_STATUS_MAP).map(([value, { label }]) => ({ value, label }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={10} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateModalVisible(true); }}>
                Tạo bến cảng
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách bến cảng'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterMaBen || filterTenBen || filterTuyenDuongThuy || filterLoaiBen || filterStatus || filterApprovalStatus ? 'Không tìm thấy' : 'Chưa có bến cảng nào'}
            ctaText="Tạo bến cảng đầu tiên"
            onCta={() => { createForm.resetFields(); setCreateModalVisible(true); }}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<BenCang>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1600 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p: number, sz?: number) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t: number) => `Hiển thị 1-${Math.min(total, (page - 1) * pageSize + pageSize)} của ${total} kết quả`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        title="Tạo mới Bến cảng"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={800}
        forceRender
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateFinish} initialValues={{ trangThaiHoatDong: 'HIEN_HANH' }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Mã bến *"
                name="maBen"
                rules={[{ required: true, message: 'Mã bến không được để trống' }, { max: 50, message: 'Mã bến tối đa 50 ký tự' }]}
              >
                <Input placeholder="VD: BC-HAIPHONG-001" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên bến *"
                name="tenBen"
                rules={[{ required: true, message: 'Tên bến không được để trống' }, { max: 255, message: 'Tên bến tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Bến cảng Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Cảng biển chủ *"
                name="cangBienId"
                rules={[{ required: true, message: 'Vui lòng chọn cảng biển chủ' }]}
              >
                <Select
                  placeholder="Chọn cảng biển chủ"
                  showSearch
                  optionFilterProp="label"
                  options={cangBienOptions.map(o => ({ label: o.tenCang, value: o.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tuyến đường thủy"
                name="tuyenDuongThuy"
                rules={[{ max: 255, message: 'Tuyến đường thủy tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Tuyến sông Bạch Đằng" maxLength={255} />
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
                <InputNumber min={-180} max={180} step={0.000001} precision={6} placeholder="VD: 106.7" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số kỹ thuật
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Chiều dài (m)" name="chieuDai">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 200.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Chiều rộng (m)" name="chieuRong">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 30.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Loại bến" name="loaiBen" rules={[{ required: true, message: 'Vui lòng chọn loại bến' }]}>
                <Select placeholder="Chọn loại bến" options={LOAI_BEN_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Độ sâu luồng (m)" name="doSauLuong">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 12.50" style={{ width: '100%' }} />
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
                <Select placeholder="Chọn trạng thái" options={ACTIVITY_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Biểu tượng bản đồ" name="bieuTuongId">
                <Select
                  placeholder="Chọn biểu tượng bản đồ"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={symbols.map(s => ({
                    label: (
                      <Space>
                        {s.hinhAnh && <img src={s.hinhAnh} alt={s.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />}
                        <span>{s.name} ({s.code})</span>
                      </Space>
                    ),
                    value: s.id
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>Tạo bến cảng</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={selectedRecord ? `Chỉnh sửa: ${selectedRecord.maBen} — ${selectedRecord.tenBen}` : 'Chỉnh sửa bến cảng'}
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={null}
        width={800}
        forceRender
      >
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateFinish}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Mã bến" name="maBen">
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên bến *"
                name="tenBen"
                rules={[{ required: true, message: 'Tên bến không được để trống' }, { max: 255, message: 'Tên bến tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Bến cảng Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Cảng biển chủ *"
                name="cangBienId"
                rules={[{ required: true, message: 'Vui lòng chọn cảng biển chủ' }]}
              >
                <Select
                  placeholder="Chọn cảng biển chủ"
                  showSearch
                  optionFilterProp="label"
                  options={cangBienOptions.map(o => ({ label: o.tenCang, value: o.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tuyến đường thủy"
                name="tuyenDuongThuy"
                rules={[{ max: 255, message: 'Tuyến đường thủy tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Tuyến sông Bạch Đằng" maxLength={255} />
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
                <InputNumber min={-180} max={180} step={0.000001} precision={6} placeholder="VD: 106.7" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số kỹ thuật
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Chiều dài (m)" name="chieuDai">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 200.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Chiều rộng (m)" name="chieuRong">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 30.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Loại bến" name="loaiBen" rules={[{ required: true, message: 'Vui lòng chọn loại bến' }]}>
                <Select placeholder="Chọn loại bến" options={LOAI_BEN_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Độ sâu luồng (m)" name="doSauLuong">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 12.50" style={{ width: '100%' }} />
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
                <Select placeholder="Chọn trạng thái" options={ACTIVITY_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt">
                <Input disabled value={selectedRecord?.trangThaiPheDuyet ? trangThaiPheDuyetBadge(selectedRecord.trangThaiPheDuyet).label : '—'} aria-readonly="true" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Biểu tượng bản đồ" name="bieuTuongId">
                <Select
                  placeholder="Chọn biểu tượng bản đồ"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={symbols.map(s => ({
                    label: (
                      <Space>
                        {s.hinhAnh && <img src={s.hinhAnh} alt={s.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />}
                        <span>{s.name} ({s.code})</span>
                      </Space>
                    ),
                    value: s.id
                  }))}
                />
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
        title={selectedRecord ? `Chi tiết bến cảng: ${selectedRecord.maBen} — ${selectedRecord.tenBen}` : 'Chi tiết bến cảng'}
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
                      <Typography.Text strong>Mã bến:</Typography.Text>
                      <br />
                      <Tag color="cyan">{selectedRecord.maBen}</Tag>
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Tên bến:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.tenBen}</Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Cảng biển chủ:</Typography.Text>
                      <br />
                      <Typography.Text>
                        {cangBienOptions.find(o => o.id === selectedRecord.cangBienId)?.tenCang || selectedRecord.cangBienId}
                      </Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Tuyến đường thủy:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.tuyenDuongThuy || '—'}</Typography.Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Thông số kỹ thuật" size="small" style={{ height: '100%' }}>
                  <Typography.Text strong>Chiều dài:</Typography.Text> {selectedRecord.chieuDai != null ? `${selectedRecord.chieuDai.toFixed(2)} m` : '—'}
                  <br />
                  <Typography.Text strong style={{ marginTop: 4, display: 'inline-block' }}>Chiều rộng:</Typography.Text> {selectedRecord.chieuRong != null ? `${selectedRecord.chieuRong.toFixed(2)} m` : '—'}
                  <br />
                  <Typography.Text strong style={{ marginTop: 4, display: 'inline-block' }}>Độ sâu luồng:</Typography.Text> {selectedRecord.doSauLuong != null ? `${selectedRecord.doSauLuong.toFixed(2)} m` : '—'}
                  <br />
                  <Typography.Text strong style={{ marginTop: 4, display: 'inline-block' }}>Loại bến:</Typography.Text> {selectedRecord.loaiBen ? (LOAI_BEN_MAP[selectedRecord.loaiBen] || selectedRecord.loaiBen) : '—'}
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
                      title="Phê duyệt bến cảng?"
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
                      maBen: selectedRecord.maBen,
                      tenBen: selectedRecord.tenBen,
                      cangBienId: selectedRecord.cangBienId,
                      tuyenDuongThuy: selectedRecord.tuyenDuongThuy,
                      viDo: selectedRecord.viDo,
                      kinhDo: selectedRecord.kinhDo,
                      chieuDai: selectedRecord.chieuDai,
                      chieuRong: selectedRecord.chieuRong,
                      loaiBen: selectedRecord.loaiBen,
                      doSauLuong: selectedRecord.doSauLuong,
                      congNangKhaiThac: selectedRecord.congNangKhaiThac ? selectedRecord.congNangKhaiThac.split(',').map(s => s.trim()) : [],
                      trangThaiHoatDong: selectedRecord.trangThaiHoatDong,
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

      {/* History Modal */}
      <Modal
        title={selectedRecord ? `Lịch sử thay đổi: ${selectedRecord.maBen} — ${selectedRecord.tenBen}` : 'Lịch sử thay đổi'}
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
            {historyRecords.map((record: any, idx: number) => (
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
                {record.changedBy && (
                  <div style={{ marginBottom: 4 }}>
                    <Typography.Text type="secondary">Người thực hiện: </Typography.Text>
                    <Typography.Text strong>{record.changedBy}</Typography.Text>
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
            ))}
          </div>
        )}
      </Modal>

      {selectedRecord && (
        <GiayToUploadModal
          entityType="ben-cang"
          entityId={selectedRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}
    </>
  );
}
