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
import type { CangCan } from './types';
import {
  TRANG_THAI_HOAT_DONG_MAP,
  TRANG_THAI_PHE_DUYET_MAP,
} from './types';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from '../../services/cangbien/schema';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { VIETNAM_PROVINCES } from '../../types/common';
import {
  fetchCangCanList,
  fetchCangCanById,
  createCangCan,
  updateCangCan,
  deleteCangCan,
  approveCangCan,
  rejectCangCan,
} from './api';
import type { CangCanListParams } from './api';
import { giayToApi } from '../giayto/api';
import { z } from 'zod';
import { createCangCanSchema, updateCangCanSchema } from './schema';

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

export default function CangCanListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CangCan[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Modals visibility
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CangCan | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
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
      const params: CangCanListParams = {
        search,
        status: filterStatus,
        approvalStatus: filterApprovalStatus,
        page: page - 1,
        pageSize,
      };
      const res = await fetchCangCanList(params);
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cảng cạn'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterStatus, filterApprovalStatus]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: CangCan) => {
      try {
        await deleteCangCan(record.id);
        toast.success('Đã xóa cảng cạn');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleApprove = useCallback(
    async (record: CangCan) => {
      try {
        await approveCangCan(record.id);
        toast.success('Phê duyệt cảng cạn thành công');
        fetchData();
        if (detailModalVisible && selectedRecord?.id === record.id) {
          const updated = await fetchCangCanById(record.id);
          setSelectedRecord(updated);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, detailModalVisible, selectedRecord],
  );

  const handleReject = useCallback(
    async (record: CangCan) => {
      const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
      if (reason === null || reason.trim().length < 10) {
        if (reason === null) return;
        toast.warning('Lý do từ chối tối thiểu 10 ký tự');
        return;
      }
      try {
        await rejectCangCan(record.id, reason);
        toast.success('Đã từ chối');
        fetchData();
        if (detailModalVisible && selectedRecord?.id === record.id) {
          const updated = await fetchCangCanById(record.id);
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
      const parsed = createCangCanSchema.parse({
        maCangCan: values.maCangCan,
        tenCangCan: values.tenCangCan,
        tinhThanhPho: values.tinhThanhPho || undefined,
        viDo: values.viDo != null && !Number.isNaN(values.viDo) ? values.viDo : undefined,
        kinhDo: values.kinhDo != null && !Number.isNaN(values.kinhDo) ? values.kinhDo : undefined,
        dienTich: values.dienTich,
        congSuatTEU: values.congSuatTEU != null && !Number.isNaN(values.congSuatTEU) ? values.congSuatTEU : undefined,
        trangThaiHoatDong: values.trangThaiHoatDong || 'HIEN_HANH',
      });

      setSubmitting(true);
      await createCangCan(parsed);
      toast.success('Tạo mới cảng cạn thành công');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((e) => toast.error(e.message));
      } else if ((err as any).status === 409) {
        createForm.setFields([{ name: 'maCangCan', errors: ['Mã cảng cạn đã tồn tại.'] }]);
        toast.error('Mã cảng cạn đã tồn tại');
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
      const parsed = updateCangCanSchema.parse({
        id: selectedRecord.id,
        tenCangCan: values.tenCangCan || undefined,
        tinhThanhPho: values.tinhThanhPho || undefined,
        viDo: values.viDo != null && !Number.isNaN(values.viDo) ? values.viDo : undefined,
        kinhDo: values.kinhDo != null && !Number.isNaN(values.kinhDo) ? values.kinhDo : undefined,
        dienTich: values.dienTich,
        congSuatTEU: values.congSuatTEU,
        trangThaiHoatDong: values.trangThaiHoatDong,
      });

      setSubmitting(true);
      await updateCangCan(parsed);
      toast.success('Cập nhật cảng cạn thành công');
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

  const columns: TableProps<CangCan>['columns'] = [
    {
      title: 'STT',
      width: 60,
      render: (_: unknown, __: CangCan, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Mã cảng cạn',
      dataIndex: 'maCangCan',
      width: 160,
      render: (maCangCan: string) => (
        <Tag color="cyan">{maCangCan}</Tag>
      ),
    },
    {
      title: 'Tên cảng cạn',
      dataIndex: 'tenCangCan',
      ellipsis: true,
    },
    {
      title: 'Tỉnh/thành phố',
      dataIndex: 'tinhThanhPho',
      width: 180,
      render: (tinhThanhPho: string) => tinhThanhPho || '—',
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
      render: (v: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Công suất TEU',
      dataIndex: 'congSuatTEU',
      width: 140,
      align: 'right' as const,
      render: (v: number | null) => (v != null ? v.toFixed(2) : '—'),
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'trangThaiHoatDong',
      width: 100,
      render: (status: string) => {
        const badge = trangThaiHoatDongBadge(status);
        return <Tag color={badge.color}>{badge.label}</Tag>;
      },
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'trangThaiPheDuyet',
      width: 120,
      render: (status: string) => {
        const badge = trangThaiPheDuyetBadge(status);
        return <Tag color={badge.color}>{badge.label}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: CangCan) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const data = await fetchCangCanById(record.id);
                  setSelectedRecord(data);
                  const fileRes = await giayToApi.listByEntity('cang-can', record.id, { page: 1, size: 20 });
                  setDetailFiles(fileRes.data || []);
                  setDetailModalVisible(true);
                } catch (err) {
                  toast.error('Không thể tải thông tin chi tiết cảng cạn');
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
                  const data = await fetchCangCanById(record.id);
                  setSelectedRecord(data);
                  updateForm.setFieldsValue({
                    maCangCan: data.maCangCan,
                    tenCangCan: data.tenCangCan,
                    tinhThanhPho: data.tinhThanhPho,
                    viDo: data.viDo,
                    kinhDo: data.kinhDo,
                    dienTich: data.dienTich,
                    congSuatTEU: data.congSuatTEU,
                    trangThaiHoatDong: data.trangThaiHoatDong,
                  });
                  setUpdateModalVisible(true);
                } catch (err) {
                  toast.error('Không thể tải thông tin cảng cạn');
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
                  title="Phê duyệt cảng cạn?"
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
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa"
              description={`Bạn có chắc muốn xóa cảng cạn "${record.maCangCan}"? Dữ liệu sẽ được ẩn nhưng vẫn được lưu trữ.`}
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
              onClick={async () => {
                try {
                  setLoadingHistory(true);
                  setSelectedRecord(record);
                  setHistoryModalVisible(true);
                  const { fetchCangCanHistory } = await import('./api');
                  const histData = await fetchCangCanHistory(record.id);
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
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                placeholder="Trạng thái hoạt động"
                allowClear
                style={{ width: 180 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={[
                  { label: 'Hoạt động', value: 'HIEN_HANH' },
                  { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
                ]}
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
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateModalVisible(true); }}>
                Tạo cảng cạn
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách cảng cạn'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterStatus || filterApprovalStatus ? 'Không tìm thấy' : 'Chưa có cảng cạn nào'}
            ctaText="Tạo cảng cạn đầu tiên"
            onCta={() => { createForm.resetFields(); setCreateModalVisible(true); }}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<CangCan>
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
              },
              showSizeChanger: true,
              showTotal: (t: number) => `Hiển thị 1-${Math.min(pageSize, t)} của ${t} kết quả`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        title="Tạo mới Cảng cạn"
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
                label="Mã cảng cạn *"
                name="maCangCan"
                rules={[{ required: true, message: 'Mã cảng cạn không được để trống' }, { max: 50, message: 'Mã cảng cạn tối đa 50 ký tự' }]}
              >
                <Input placeholder="VD: CC-HAIPHONG-001" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cảng cạn *"
                name="tenCangCan"
                rules={[{ required: true, message: 'Tên cảng cạn không được để trống' }, { max: 255, message: 'Tên cảng cạn tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng cạn Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Item label="Tỉnh/thành phố" name="tinhThanhPho" rules={[{ required: false }]}>
                <Select
                  showSearch
                  placeholder="Chọn tỉnh/thành phố..."
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))}
                />
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
              <Form.Item
                label="Diện tích (m²) *"
                name="dienTich"
                rules={[{ required: true, message: 'Diện tích phải lớn hơn 0' }]}
              >
                <InputNumber min={0.01} step={0.01} precision={2} placeholder="VD: 10000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Công suất TEU" name="congSuatTEU">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 50000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="trangThaiHoatDong">
                <Select placeholder="Chọn trạng thái" options={[{ label: 'Hiện hành', value: 'HIEN_HANH' }, { label: 'Tạm ngừng', value: 'TAM_NGUNG' }]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>Tạo cảng cạn</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={selectedRecord ? `Chỉnh sửa: ${selectedRecord.maCangCan} — ${selectedRecord.tenCangCan}` : 'Chỉnh sửa cảng cạn'}
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
              <Form.Item label="Mã cảng cạn" name="maCangCan">
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cảng cạn *"
                name="tenCangCan"
                rules={[{ required: true, message: 'Tên cảng cạn không được để trống' }, { max: 255, message: 'Tên cảng cạn tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng cạn Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Item label="Tỉnh/thành phố" name="tinhThanhPho" rules={[{ required: false }]}>
                <Select
                  showSearch
                  placeholder="Chọn tỉnh/thành phố..."
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))}
                />
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
              <Form.Item
                label="Diện tích (m²)"
                name="dienTich"
                rules={[{ required: true, message: 'Diện tích phải lớn hơn 0' }]}
              >
                <InputNumber min={0.01} step={0.01} precision={2} placeholder="VD: 10000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Công suất TEU" name="congSuatTEU">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 50000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="trangThaiHoatDong">
                <Select placeholder="Chọn trạng thái" options={[{ label: 'Hiện hành', value: 'HIEN_HANH' }, { label: 'Tạm ngừng', value: 'TAM_NGUNG' }]} />
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
        title={selectedRecord ? `Chi tiết cảng cạn: ${selectedRecord.maCangCan} — ${selectedRecord.tenCangCan}` : 'Chi tiết cảng cạn'}
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
                      <Typography.Text strong>Mã cảng cạn:</Typography.Text>
                      <br />
                      <Tag color="cyan">{selectedRecord.maCangCan}</Tag>
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Tên cảng cạn:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.tenCangCan}</Typography.Text>
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
                <Card title="Thông số kỹ thuật" size="small" style={{ height: '100%' }}>
                  <Typography.Text strong>Diện tích:</Typography.Text> {selectedRecord.dienTich != null ? `${selectedRecord.dienTich.toFixed(2)} m²` : '—'}
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'inline-block' }}>Công suất TEU:</Typography.Text> {selectedRecord.congSuatTEU != null ? `${selectedRecord.congSuatTEU.toFixed(2)} TEU` : '—'}
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
                      title="Phê duyệt cảng cạn?"
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
                <Button icon={<UploadOutlined />} onClick={() => { setDetailModalVisible(false); navigate(`/giayto/upload/cang-can/${selectedRecord.id}`); }}>
                  Upload Giấy tờ
                </Button>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailModalVisible(false);
                    updateForm.setFieldsValue({
                      maCangCan: selectedRecord.maCangCan,
                      tenCangCan: selectedRecord.tenCangCan,
                      tinhThanhPho: selectedRecord.tinhThanhPho,
                      viDo: selectedRecord.viDo,
                      kinhDo: selectedRecord.kinhDo,
                      dienTich: selectedRecord.dienTich,
                      congSuatTEU: selectedRecord.congSuatTEU,
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
        title={selectedRecord ? `Lịch sử thay đổi: ${selectedRecord.maCangCan} — ${selectedRecord.tenCangCan}` : 'Lịch sử thay đổi'}
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
                      {record.actionType && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>{record.actionType}</Tag>
                      )}
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
