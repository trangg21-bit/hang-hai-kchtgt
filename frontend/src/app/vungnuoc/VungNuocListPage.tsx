import { useState, useCallback, useEffect } from 'react';
import { Button, Space, Tag, Card, Row, Col, Input, Select, Tooltip, Popconfirm } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { vungNuocApi } from './api';
import type { VungNuoc, VungNuocTrangThaiHoatDong, VungNuocTrangThaiPheDuyet } from './types';
import {
  VUNGNUOC_HOAT_DONG_MAP,
  VUNGNUOC_PHE_DUYET_MAP,
} from './types';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

export default function VungNuocListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMaVung, setFilterMaVung] = useState('');
  const [filterTenVung, setFilterTenVung] = useState('');
  const [filterHoatDong, setFilterHoatDong] = useState<VungNuocTrangThaiHoatDong | undefined>();
  const [filterPheDuyet, setFilterPheDuyet] = useState<VungNuocTrangThaiPheDuyet | undefined>();
  const [cangBienIdFilter, setCangBienIdFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [dataSource, setDataSource] = useState<VungNuoc[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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

  const columns = [
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
      render: (cangBienId: string) => (cangBienId ? (
        <a onClick={() => navigate(`/cangbien/${cangBienId}`)}>{cangBienId.substring(0, 12)}...</a>
      ) : '—'),
    },
    {
      title: 'Diện tích (m²)',
      dataIndex: 'dienTich',
      width: 110,
      align: 'right' as const,
      render: (v: number | null) => v?.toFixed(2) || '—',
    },
    {
      title: 'Độ sâu max (m)',
      dataIndex: 'doSauMax',
      width: 110,
      align: 'right' as const,
      render: (v: number | null) => v?.toFixed(2) || '—',
    },
    {
      title: 'Độ sâu TB (m)',
      dataIndex: 'doSauTrungBinh',
      width: 120,
      align: 'right' as const,
      render: (v: number | null) => v?.toFixed(2) || '—',
    },
    {
      title: 'Loại vùng nước',
      dataIndex: 'loaiVungNuoc',
      width: 130,
      ellipsis: true,
      render: (loaiVungNuoc: string | null) => loaiVungNuoc || '—',
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'trangThaiHoatDong',
      width: 100,
      render: (status: VungNuocTrangThaiHoatDong) => {
        const info = VUNGNUOC_HOAT_DONG_MAP[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'trangThaiPheDuyet',
      width: 110,
      render: (status: VungNuocTrangThaiPheDuyet) => {
        const info = VUNGNUOC_PHE_DUYET_MAP[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 140,
      render: (v: string) => v ? new Date(v).toLocaleString('vi-VN') : '—',
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
              onClick={() => navigate(`/vungnuoc/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/vungnuoc/${record.id}/edit`)}
            />
          </Tooltip>
          {record.trangThaiPheDuyet === 'CHO_PHE_DUYET' && (
            <>
              <Tooltip title="Phê duyệt">
                <Popconfirm
                  title="Phê duyệt vùng nước?"
                  description="Sau khi phê duyệt, vùng nước sẽ chuyển sang trạng thái được phê duyệt."
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={async () => {
                    try {
                      await vungNuocApi.approve(record.id);
                      toast.success('Đã phê duyệt vùng nước');
                      fetchData();
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
                    }
                  }}
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
                  onConfirm={async () => {
                    const reason = window.prompt('Lý do từ chối:', '');
                    if (reason === null) return;
                    try {
                      await vungNuocApi.reject(record.id, reason);
                      toast.success('Đã từ chối');
                      fetchData();
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
                    }
                  }}
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
                description={`Bạn có chắc muốn xóa vùng nước "${record.tenVungNuoc}"? Dữ liệu sẽ được ẩn nhưng vẫn được lưu trữ.`}
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
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/vungnuoc/create')}>
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
            description={search || filterHoatDong || filterPheDuyet ? 'Không tìm thấy' : 'Chưa có vùng nước nào'}
            ctaText="Tạo vùng nước đầu tiên"
            onCta={() => navigate('/vungnuoc/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<VungNuoc>
            columns={columns as any}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p: number, sz?: number) => {
                setPage(p);
                if (sz) /* ignore */;
              },
              showSizeChanger: true,
              showTotal: (t: number) => `Hiển thị 1-${Math.min(t, pageSize)} của ${t} kết quả`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
