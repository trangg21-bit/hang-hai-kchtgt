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
import { vungNuocApi } from './api';
import type { VungNuoc, VungNuocTrangThaiHoatDong, VungNuocTrangThaiPheDuyet } from './types';
import {
  VUNGNUOC_HOAT_DONG_MAP,
  VUNGNUOC_PHE_DUYET_MAP,
} from './types';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from '../../services/cangbien/schema';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { giayToApi } from '../giayto/api';
import { z } from 'zod';
import { vungNuocCreateSchema, vungNuocUpdateSchema } from './schema';

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
    congNangKhaiThac: 'Công năng khai thác'
  };
  return map[fieldName] || fieldName;
};

export default function VungNuocListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMaVung, setFilterMaVung] = useState('');
  const [filterTenVung, setFilterTenVung] = useState('');
  const [filterHoatDong, setFilterHoatDong] = useState<VungNuocTrangThaiHoatDong | undefined>();
  const [filterPheDuyet, setFilterPheDuyet] = useState<VungNuocTrangThaiPheDuyet | undefined>();
  const [cangBienIdFilter, setCangBienIdFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<VungNuoc[]>([]);
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
  const [selectedRecord, setSelectedRecord] = useState<VungNuoc | null>(null);
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
      const res = await fetchCangBienList({ page: 0, size: 1000, trangThaiHoatDong: 'HIEN_HANH' });
      setCangBienOptions(res.content.map((c) => ({ id: c.id, tenCang: c.tenCang })));
    } catch (err) {
      console.error('Failed to fetch CangBien options:', err);
    }
  }, []);

  useEffect(() => {
    void fetchCangBienOptions();
  }, [fetchCangBienOptions]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await vungNuocApi.list({
        page,
        pageSize,
        search: search || filterMaVung || filterTenVung || undefined,
        trangThaiHoatDong: filterHoatDong,
        trangThaiPheDuyet: filterPheDuyet,
        cangBienId: cangBienIdFilter,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách vùng nước'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterMaVung, filterTenVung, filterHoatDong, filterPheDuyet, cangBienIdFilter]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setFilterMaVung(value);
    setFilterTenVung(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: VungNuoc) => {
      try {
        await vungNuocApi.delete(record.id);
        toast.success('Đã xóa vùng nước thành công');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleApprove = useCallback(
    async (record: VungNuoc) => {
      try {
        await vungNuocApi.approve(record.id);
        toast.success('Đã phê duyệt vùng nước');
        fetchData();
        if (detailModalVisible && selectedRecord?.id === record.id) {
          const updated = await vungNuocApi.findById(record.id);
          setSelectedRecord(updated);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, detailModalVisible, selectedRecord],
  );

  const handleReject = useCallback(
    async (record: VungNuoc) => {
      const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
      if (reason === null || reason.trim().length < 10) {
        if (reason === null) return;
        toast.warning('Lý do từ chối tối thiểu 10 ký tự');
        return;
      }
      try {
        await vungNuocApi.reject(record.id, reason);
        toast.success('Đã từ chối');
        fetchData();
        if (detailModalVisible && selectedRecord?.id === record.id) {
          const updated = await vungNuocApi.findById(record.id);
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
      const parsed = vungNuocCreateSchema.parse({
        maVungNuoc: values.maVungNuoc,
        tenVungNuoc: values.tenVungNuoc,
        cangBienId: values.cangBienId,
        dienTich: values.dienTich || undefined,
        doSauMax: values.doSauMax || undefined,
        doSauTrungBinh: values.doSauTrungBinh || undefined,
        loaiVungNuoc: values.loaiVungNuoc || undefined,
        trangThaiHoatDong: values.trangThaiHoatDong || 'HIEN_HANH',
      });

      setSubmitting(true);
      await vungNuocApi.create(parsed);
      toast.success('Tạo mới vùng nước thành công');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((e) => toast.error(e.message));
      } else if ((err as any).status === 409) {
        createForm.setFields([{ name: 'maVungNuoc', errors: ['Mã vùng nước đã tồn tại.'] }]);
        toast.error('Mã vùng nước đã tồn tại');
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
      const parsed = vungNuocUpdateSchema.parse({
        id: selectedRecord.id,
        tenVungNuoc: values.tenVungNuoc || undefined,
        cangBienId: values.cangBienId || undefined,
        dienTich: values.dienTich,
        doSauMax: values.doSauMax,
        doSauTrungBinh: values.doSauTrungBinh,
        loaiVungNuoc: values.loaiVungNuoc || undefined,
        trangThaiHoatDong: values.trangThaiHoatDong,
      });

      setSubmitting(true);
      await vungNuocApi.update(parsed);
      toast.success('Cập nhật vùng nước thành công');
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

  const columns: TableProps<VungNuoc>['columns'] = [
    {
      title: 'STT',
      width: 60,
      render: (_: unknown, __: VungNuoc, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Mã vùng nước',
      dataIndex: 'maVungNuoc',
      width: 140,
      render: (maVungNuoc: string) => <Tag color="cyan">{maVungNuoc}</Tag>,
    },
    {
      title: 'Tên vùng nước',
      dataIndex: 'tenVungNuoc',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Cảng biển chủ',
      dataIndex: 'cangBienId',
      width: 180,
      render: (cangBienId: string) => {
        if (!cangBienId) return '—';
        const opt = cangBienOptions.find((o) => o.id === cangBienId);
        return opt ? opt.tenCang : cangBienId.substring(0, 12) + '...';
      },
    },
    {
      title: 'Diện tích (m²)',
      dataIndex: 'dienTich',
      width: 140,
      align: 'right' as const,
      render: (v: number | null) => v?.toFixed(2) || '—',
    },
    {
      title: 'Độ sâu max (m)',
      dataIndex: 'doSauMax',
      width: 130,
      align: 'right' as const,
      render: (v: number | null) => v?.toFixed(2) || '—',
    },
    {
      title: 'Độ sâu TB (m)',
      dataIndex: 'doSauTrungBinh',
      width: 140,
      align: 'right' as const,
      render: (v: number | null) => v?.toFixed(2) || '—',
    },
    {
      title: 'Loại vùng nước',
      dataIndex: 'loaiVungNuoc',
      width: 150,
      ellipsis: true,
      render: (loaiVungNuoc: string | null) => loaiVungNuoc || '—',
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'trangThaiHoatDong',
      width: 100,
      render: (status: VungNuocTrangThaiHoatDong) => {
        const badge = trangThaiHoatDongBadge(status);
        return <Tag color={badge.color}>{badge.label}</Tag>;
      },
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'trangThaiPheDuyet',
      width: 110,
      render: (status: VungNuocTrangThaiPheDuyet) => {
        const badge = trangThaiPheDuyetBadge(status);
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
      title: 'Hành động',
      key: 'actions',
      width: 300,
      fixed: 'right' as const,
      render: (_: unknown, record: VungNuoc) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const data = await vungNuocApi.findById(record.id);
                  setSelectedRecord(data);
                  const fileRes = await giayToApi.listByEntity('vung-nuoc', record.id, { page: 1, size: 20 });
                  setDetailFiles(fileRes.data || []);
                  setDetailModalVisible(true);
                } catch (err) {
                  toast.error('Không thể tải thông tin chi tiết vùng nước');
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
                  const data = await vungNuocApi.findById(record.id);
                  setSelectedRecord(data);
                  updateForm.setFieldsValue({
                    maVungNuoc: data.maVungNuoc,
                    tenVungNuoc: data.tenVungNuoc,
                    cangBienId: data.cangBienId,
                    dienTich: data.dienTich,
                    doSauMax: data.doSauMax,
                    doSauTrungBinh: data.doSauTrungBinh,
                    loaiVungNuoc: data.loaiVungNuoc,
                    trangThaiHoatDong: data.trangThaiHoatDong,
                  });
                  setUpdateModalVisible(true);
                } catch (err) {
                  toast.error('Không thể tải thông tin vùng nước');
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
                  title="Phê duyệt vùng nước?"
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApprove(record)}
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
          {record.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa vùng nước "${record.tenVungNuoc}"?`}
                okText="Xóa"
                okType="danger"
                cancelText="Hủy"
                onConfirm={() => handleDelete(record)}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
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
                  const { vungNuocApi } = await import('./api');
                  const histData = await vungNuocApi.getHistory(record.id);
                  setHistoryRecords(histData.changeHistory || []);
                } catch (err) {
                  toast.error('Không thể tải lịch sử thay đổi');
                } finally {
                  setLoadingHistory(false);
                }
              }}
            />
          </Tooltip>
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
              <Input.Search
                placeholder="Tìm theo mã, tên..."
                allowClear
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Select
                placeholder="Trạng thái hoạt động"
                allowClear
                style={{ width: 180 }}
                value={filterHoatDong}
                onChange={(val) => { setFilterHoatDong(val as VungNuocTrangThaiHoatDong | undefined); setPage(1); }}
                options={Object.entries(VUNGNUOC_HOAT_DONG_MAP).map(([value, { label }]) => ({ value, label }))}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 180 }}
                value={filterPheDuyet}
                onChange={(val) => { setFilterPheDuyet(val as VungNuocTrangThaiPheDuyet | undefined); setPage(1); }}
                options={Object.entries(VUNGNUOC_PHE_DUYET_MAP).map(([value, { label }]) => ({ value, label }))}
              />
              <Select
                placeholder="Cảng biển chủ"
                allowClear
                style={{ width: 200 }}
                value={cangBienIdFilter}
                onChange={(val) => { setCangBienIdFilter(val); setPage(1); }}
                options={cangBienOptions.map((o) => ({ value: o.id, label: o.tenCang }))}
                showSearch
                filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateModalVisible(true); }}>
                Tạo vùng nước
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách vùng nước'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterHoatDong || filterPheDuyet || cangBienIdFilter ? 'Không tìm thấy' : 'Chưa có vùng nước nào'}
            ctaText="Tạo vùng nước đầu tiên"
            onCta={() => { createForm.resetFields(); setCreateModalVisible(true); }}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<VungNuoc>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p: number) => {
                setPage(p);
              },
              showSizeChanger: true,
              showTotal: (t: number) => `Hiển thị 1-${Math.min(t, pageSize)} của ${t} kết quả`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        title="Tạo mới Vùng nước"
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
                label="Mã vùng nước *"
                name="maVungNuoc"
                rules={[{ required: true, message: 'Mã vùng nước không được để trống' }, { max: 50, message: 'Mã vùng nước tối đa 50 ký tự' }]}
              >
                <Input placeholder="VD: VN-HAIPHONG-001" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên vùng nước *"
                name="tenVungNuoc"
                rules={[{ required: true, message: 'Tên vùng nước không được để trống' }, { max: 255, message: 'Tên vùng nước tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Vùng nước Hải Phòng" maxLength={255} />
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
              <Form.Item label="Loại vùng nước" name="loaiVungNuoc" rules={[{ max: 100, message: 'Loại vùng nước tối đa 100 ký tự' }]}>
                <Input placeholder="VD: Vùng neo đậu, Vùng đón hoa tiêu..." maxLength={100} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số kỹ thuật
          </Typography.Text>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="Diện tích (m²)" name="dienTich">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 5000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Độ sâu tối đa (m)" name="doSauMax">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 15.50" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Độ sâu trung bình (m)" name="doSauTrungBinh">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 10.20" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="trangThaiHoatDong">
                <Select placeholder="Chọn trạng thái" options={Object.entries(VUNGNUOC_HOAT_DONG_MAP).map(([value, { label }]) => ({ value, label }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>Tạo vùng nước</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={selectedRecord ? `Chỉnh sửa: ${selectedRecord.maVungNuoc} — ${selectedRecord.tenVungNuoc}` : 'Chỉnh sửa vùng nước'}
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
              <Form.Item label="Mã vùng nước" name="maVungNuoc">
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên vùng nước *"
                name="tenVungNuoc"
                rules={[{ required: true, message: 'Tên vùng nước không được để trống' }, { max: 255, message: 'Tên vùng nước tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Vùng nước Hải Phòng" maxLength={255} />
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
              <Form.Item label="Loại vùng nước" name="loaiVungNuoc" rules={[{ max: 100, message: 'Loại vùng nước tối đa 100 ký tự' }]}>
                <Input placeholder="VD: Vùng neo đậu, Vùng đón hoa tiêu..." maxLength={100} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số kỹ thuật
          </Typography.Text>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="Diện tích (m²)" name="dienTich">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 5000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Độ sâu tối đa (m)" name="doSauMax">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 15.50" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Độ sâu trung bình (m)" name="doSauTrungBinh">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 10.20" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="trangThaiHoatDong">
                <Select placeholder="Chọn trạng thái" options={Object.entries(VUNGNUOC_HOAT_DONG_MAP).map(([value, { label }]) => ({ value, label }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt">
                <Input disabled value={selectedRecord?.trangThaiPheDuyet ? trangThaiPheDuyetBadge(selectedRecord.trangThaiPheDuyet).label : '—'} aria-readonly="true" />
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
        title={selectedRecord ? `Chi tiết vùng nước: ${selectedRecord.maVungNuoc} — ${selectedRecord.tenVungNuoc}` : 'Chi tiết vùng nước'}
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
                      <Typography.Text strong>Mã vùng nước:</Typography.Text>
                      <br />
                      <Tag color="cyan">{selectedRecord.maVungNuoc}</Tag>
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Tên vùng nước:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.tenVungNuoc}</Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Cảng biển chủ:</Typography.Text>
                      <br />
                      <Typography.Text>
                        {cangBienOptions.find(o => o.id === selectedRecord.cangBienId)?.tenCang || selectedRecord.cangBienId}
                      </Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Loại vùng nước:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.loaiVungNuoc || '—'}</Typography.Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Thông số kỹ thuật" size="small" style={{ height: '100%' }}>
                  <Typography.Text strong>Diện tích:</Typography.Text> {selectedRecord.dienTich != null ? `${selectedRecord.dienTich.toFixed(2)} m²` : '—'}
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'inline-block' }}>Độ sâu tối đa:</Typography.Text> {selectedRecord.doSauMax != null ? `${selectedRecord.doSauMax.toFixed(2)} m` : '—'}
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'inline-block' }}>Độ sâu TB:</Typography.Text> {selectedRecord.doSauTrungBinh != null ? `${selectedRecord.doSauTrungBinh.toFixed(2)} m` : '—'}
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
                      title="Phê duyệt vùng nước?"
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
                <Button icon={<UploadOutlined />} onClick={() => { setDetailModalVisible(false); navigate(`/giayto/upload/vung-nuoc/${selectedRecord.id}`); }}>
                  Upload Giấy tờ
                </Button>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailModalVisible(false);
                    updateForm.setFieldsValue({
                      maVungNuoc: selectedRecord.maVungNuoc,
                      tenVungNuoc: selectedRecord.tenVungNuoc,
                      cangBienId: selectedRecord.cangBienId,
                      dienTich: selectedRecord.dienTich,
                      doSauMax: selectedRecord.doSauMax,
                      doSauTrungBinh: selectedRecord.doSauTrungBinh,
                      loaiVungNuoc: selectedRecord.loaiVungNuoc,
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
        title={selectedRecord ? `Lịch sử thay đổi: ${selectedRecord.maVungNuoc} — ${selectedRecord.tenVungNuoc}` : 'Lịch sử thay đổi'}
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
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((record: any, idx: number) => {
                return (
                  <div key={record.id || idx} style={{ position: 'relative', marginBottom: 24, paddingBottom: 12, borderBottom: idx < historyRecords.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    {/* Timeline dot */}
                    <div style={{ position: 'absolute', left: -29, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#1890ff', border: '2px solid #fff', boxShadow: '0 0 0 2px #1890ff' }} />
                    
                    {/* Timestamp */}
                    <div style={{ marginBottom: 4 }}>
                      <Typography.Text strong>
                        {record.createdAt ? new Date(record.createdAt).toLocaleString('vi-VN') : '—'}
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
                          cũ: {record.oldValue}
                        </Typography.Text>
                      </div>
                    )}
                    {record.newValue !== undefined && record.newValue != null && (
                      <div>
                        <Typography.Text type="secondary">mới: </Typography.Text>
                        <Typography.Text style={{ color: '#52c41a', fontWeight: 500 }}>{record.newValue}</Typography.Text>
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
