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
  Modal,
  Form,
  InputNumber,
  Typography,
  Descriptions,
  Divider,
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
  ClockCircleFilled,
  ArrowRightOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { DryPort } from './types';
import {
  TRANG_THAI_HOAT_DONG_MAP,
  TRANG_THAI_PHE_DUYET_MAP,
} from './types';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from '../../services/port/schema';
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
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import { documentApi } from '../document/api';
import UserResolver from '../../components/UserResolver';
import { z } from 'zod';
import { actionPrimary, textPrimary, textSecondary, textTertiary, statusCritical, statusOperational, cardStyle, radiusLg, radiusPill, shadowSm, spaceXs, spaceSm, spaceMd, spaceFormField, surfaceCard, borderDefault, fontSizeMd, fontSizeLg, fontWeightBold, fontWeightMedium } from '../../tokens';
import { createCangCanSchema, updateCangCanSchema } from './schema';
import GisLocationSelector from '../../components/gis/GisLocationSelector';

export const translateFieldName = (fieldName: string): string => {
  const map: Record<string, string> = {
    portCode: 'Mã cảng biển',
    portName: 'Tên cảng biển',
    province: 'Tỉnh/Thành phố',
    latitude: 'Vĩ độ',
    longitude: 'Kinh độ',
    area: 'Diện tích (ha)',
    khaNangTiepNhan: 'Khả năng tiếp nhận',
    portGroup: 'Nhóm cảng biển',
    berthCode: 'Mã bến cảng',
    berthName: 'Tên bến cảng',
    portId: 'Cảng biển chủ',
    tuyenDuongThuy: 'Tuyến đường thủy',
    width: 'Chiều rộng (m)',
    berthType: 'Loại bến',
    doSauLuong: 'Độ sâu luồng (m)',
    pierCode: 'Mã cầu cảng',
    pierName: 'Tên cầu cảng',
    berthId: 'Bến cảng chủ',
    length: 'Chiều dài (m)',
    taiTrong: 'Tải trọng (tấn)',
    loaiCau: 'Loại cầu',
    dryPortCode: 'Mã cảng cạn',
    dryPortName: 'Tên cảng cạn',
    provinceId: 'Tỉnh/Thành phố',
    operatingUnit: 'Đơn vị vận hành',
    region: 'Vùng',
    detailedLocation: 'Địa chỉ chi tiết',
    transportCorridor: 'Hành lang vận tải',
    warehouseArea: 'Diện tích kho (m²)',
    yardArea: 'Diện tích bãi (m²)',
    teuCapacity: 'Công suất TEU',
    connectionMode: 'Phương thức kết nối',
    portStatus: 'Tình trạng cảng',
    mapSymbolId: 'Biểu tượng bản đồ',
    coordinateSystem: 'Hệ tọa độ',
    displayRule: 'Quy tắc hiển thị',
    announcementTime: 'Thời điểm công bố',
    announcementDecisionNumber: 'Số quyết định công bố',
    announcementDecisionDate: 'Ngày quyết định công bố',
    announcementOrg: 'Đơn vị công bố',
    viTri: 'Vị trí',
    dienTichDat: 'Diện tích đất (ha)',
    dienTichNuoc: 'Diện tích nước (ha)',
    nangLucThongQua: 'Năng lực thông qua',
    waterZoneCode: 'Mã vùng nước',
    waterZoneName: 'Tên vùng nước',
    viTriVungNuoc: 'Vị trí vùng nước',
    chieuDaiVungNuoc: 'Chiều dài vùng nước (m)',
    chieuRongVungNuoc: 'Chiều rộng vùng nước (m)',
    doSauVungNuoc: 'Độ sâu vùng nước (m)',
    operationalStatus: 'Trạng thái hoạt động',
    approvalStatus: 'Trạng thái phê duyệt',
    orgUnitId: 'Đơn vị quản lý',
    operationalCapacity: 'Công năng khai thác',
    symbolId: 'Biểu tượng bản đồ',
    iconId: 'Biểu tượng bản đồ',
    lineSymbolId: 'Ký hiệu đường',
    fillSymbolId: 'Ký hiệu vùng',
    khongGianId: 'Vị trí không gian',
    spatialId: 'Vị trí không gian',
  };
  return map[fieldName] || fieldName;
};

export default function DryPortListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<DryPort[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Modals visibility
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DryPort | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState<Record<number, boolean>>({});
  const [historySearch, setHistorySearch] = useState('');
  const historySearchRef = useRef('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Forms definition
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [symbols, setSymbols] = useState<Symbol[]>([]);

  const closeUpdateModal = useCallback(() => {
    setUpdateModalVisible(false);
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailModalVisible(false);
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, []);

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
          const data = cached || await fetchCangCanById(id);
          setSelectedRecord(data);
          if (action === 'detail') {
            const fileRes = await documentApi.listByEntity('dry-port', id, { page: 1, size: 20 });
            setDetailFiles(fileRes.data || []);
            setDetailModalVisible(true);
          } else if (action === 'edit') {
            updateForm.setFieldsValue({
              dryPortCode: data.dryPortCode,
              dryPortName: data.dryPortName,
              province: data.province,
              latitude: data.latitude,
              longitude: data.longitude,
              area: data.area,
              teuCapacity: data.teuCapacity,
              operationalStatus: data.operationalStatus,
              geometryType: data.geometryType || 'POINT',
              gisLocation: {
                geometryType: data.geometryType || 'POINT',
                coordinates: data.coordinates || '',
                symbolId: data.symbolId
              }
            });
            setUpdateModalVisible(true);
          }
        } catch (err) {
          console.error('Failed to auto-load details in iframe:', err);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [action, id, updateForm]);

  const createGeometryType = Form.useWatch('geometryType', createForm) || 'POINT';
  const updateGeometryType = Form.useWatch('geometryType', updateForm) || 'POINT';

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(res.data);
    } catch (err) {
      console.error('Failed to load symbols', err);
    }
  }, []);

  const translateValue = useCallback((fieldName: string, val: string | null): string => {
    if (!val || val === '(null)' || val === 'null') {
      return '(trống)';
    }
    if (['symbolId', 'iconId', 'lineSymbolId', 'fillSymbolId'].includes(fieldName)) {
      const sym = symbols.find(s => s.id === val);
      return sym ? `${sym.name} (${sym.code})` : val;
    }
    if (['khongGianId', 'spatialId'].includes(fieldName)) {
      return 'Có tọa độ bản đồ';
    }
    if (fieldName === 'approvalStatus') {
      const approvalMap: Record<string, string> = {
        'CHO_PHE_DUYET': 'Chờ phê duyệt',
        'DUOC_PHE_DUYET': 'Được phê duyệt',
        'TU_CHOI': 'Từ chối',
      };
      return approvalMap[val.toUpperCase()] || val;
    }
    if (fieldName === 'portStatus') {
      const psMap: Record<string, string> = { '0': 'Hiện hữu', '1': 'Đang xây dựng', '2': 'Đã quy hoạch' };
      return psMap[val] || val;
    }
    if (fieldName === 'operationalStatus') {
      const statusMap: Record<string, string> = {
        'HIEN_HANH': 'Hiện hành',
        'TAM_NGUNG': 'Tạm ngừng',
        'HIỆN_HÀNH': 'Hiện hành',
        'TẠM_NGƯNG': 'Tạm ngừng',
      };
      return statusMap[val.toUpperCase()] || val;
    }
    return val;
  }, [symbols]);

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
    // 1. Try to use symbols cache from parent window
    const parentSymbols = (window.parent as any)?.kchtSymbols;
    if (parentSymbols && parentSymbols.length > 0) {
      setSymbols(parentSymbols);
    }

    // 2. Fetch if not cached
    const needSymbols = !parentSymbols || parentSymbols.length === 0;
    if (needSymbols) {
      void fetchSymbols();
    }

    if (!isIframeModal) {
      void fetchData();
    }
  }, [fetchData, fetchSymbols, isIframeModal]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: DryPort) => {
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
    async (record: DryPort) => {
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
    async (record: DryPort) => {
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
        dryPortCode: values.dryPortCode,
        dryPortName: values.dryPortName,
        province: values.province || undefined,
        latitude: values.latitude != null && !Number.isNaN(values.latitude) ? values.latitude : undefined,
        longitude: values.longitude != null && !Number.isNaN(values.longitude) ? values.longitude : undefined,
        area: values.area,
        teuCapacity: values.teuCapacity != null && !Number.isNaN(values.teuCapacity) ? values.teuCapacity : undefined,
        operationalStatus: values.operationalStatus || 'HIEN_HANH',
        symbolId: values.gisLocation?.symbolId || undefined,
        geometryType: values.geometryType,
        coordinates: values.gisLocation?.coordinates,
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
        createForm.setFields([{ name: 'dryPortCode', errors: ['Mã cảng cạn đã tồn tại.'] }]);
        toast.error('Mã cảng cạn đã tồn tại');
      } else {
        toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormFailed = (errorInfo: any) => {
    errorInfo.errorFields.forEach((field: any) => {
      toast.error(`${field.errors.join(', ')}`);
    });
  };

  const handleUpdateFinish = async (values: any) => {
    if (!selectedRecord) return;
    try {
      const parsed = updateCangCanSchema.parse({
        id: selectedRecord.id,
        dryPortName: values.dryPortName || undefined,
        province: values.province || undefined,
        latitude: values.latitude != null && !Number.isNaN(values.latitude) ? values.latitude : undefined,
        longitude: values.longitude != null && !Number.isNaN(values.longitude) ? values.longitude : undefined,
        area: values.area,
        teuCapacity: values.teuCapacity,
        operationalStatus: values.operationalStatus,
        symbolId: values.gisLocation?.symbolId || null,
        geometryType: values.geometryType,
        coordinates: values.gisLocation?.coordinates,
      });

      setSubmitting(true);
      const res = await updateCangCan(parsed);
      toast.success('Cập nhật cảng cạn thành công');
      if (window.parent && (window.parent as any).kchtDetailCache) {
        (window.parent as any).kchtDetailCache[selectedRecord.id] = res;
      }
      closeUpdateModal();
      if (!isIframeModal) {
        fetchData();
      }
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

  const columns: TableProps<DryPort>['columns'] = [
    {
      title: 'STT',
      width: 60,
      render: (_: unknown, __: DryPort, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Mã cảng cạn',
      dataIndex: 'dryPortCode',
      width: 160,
      render: (dryPortCode: string) => (
        <Tag color="cyan">{dryPortCode}</Tag>
      ),
    },
    {
      title: 'Tên cảng cạn',
      dataIndex: 'dryPortName',
      ellipsis: true,
    },
    {
      title: 'Tỉnh/thành phố',
      dataIndex: 'province',
      width: 180,
      render: (province: string) => province || '—',
    },
    {
      title: 'Vĩ độ',
      dataIndex: 'latitude',
      width: 110,
      render: (v: number | null) => (v != null ? v.toFixed(4) : '—'),
    },
    {
      title: 'Kinh độ',
      dataIndex: 'longitude',
      width: 110,
      render: (v: number | null) => (v != null ? v.toFixed(4) : '—'),
    },
    {
      title: 'Diện tích (m²)',
      dataIndex: 'area',
      width: 140,
      align: 'right' as const,
      render: (v: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Công suất TEU',
      dataIndex: 'teuCapacity',
      width: 140,
      align: 'right' as const,
      render: (v: number | null) => (v != null ? v.toFixed(2) : '—'),
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'operationalStatus',
      width: 100,
      render: (status: string) => {
        const badge = trangThaiHoatDongBadge(status);
        return <Tag color={badge.color}>{badge.label}</Tag>;
      },
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'approvalStatus',
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
      render: (_: unknown, record: DryPort) => (
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
                  const fileRes = await documentApi.listByEntity('dry-port', record.id, { page: 1, size: 20 });
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
                    dryPortCode: data.dryPortCode,
                    dryPortName: data.dryPortName,
                    province: data.province,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    area: data.area,
                    teuCapacity: data.teuCapacity,
                    operationalStatus: data.operationalStatus,
                    geometryType: data.geometryType || 'POINT',
                    gisLocation: {
                      geometryType: data.geometryType || 'POINT',
                      coordinates: data.coordinates || '',
                      symbolId: data.symbolId
                    }
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
          {record.approvalStatus === 'CHO_PHE_DUYET' && (
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
              description={`Bạn có chắc muốn xóa cảng cạn "${record.dryPortCode}"? Dữ liệu sẽ được ẩn nhưng vẫn được lưu trữ.`}
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
                  setHistoryExpanded({});
                  setHistorySearch('');
                  historySearchRef.current = '';
                  setHistoryDateFrom('');
                  setHistoryDateTo('');
                  const { fetchdryPortHistory } = await import('./api');
                  const histData = await fetchdryPortHistory(record.id);
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
      {!isIframeModal && (
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
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<DryPort>
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
              showTotal: (total: number, range: [number, number]) => `Hiển thị ${range[0]}-${range[1]} của ${total} kết quả`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
        </>
      )}

      {/* Create Modal */}
      {!isIframeModal && (
        <Modal
        title="Tạo mới Cảng cạn"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={800}
        forceRender
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateFinish} onFinishFailed={handleFormFailed} initialValues={{ operationalStatus: 'HIEN_HANH' }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Mã cảng cạn *"
                name="dryPortCode"
                rules={[{ required: true, message: 'Mã cảng cạn không được để trống' }, { max: 50, message: 'Mã cảng cạn tối đa 50 ký tự' }]}
              >
                <Input placeholder="VD: CC-HAIPHONG-001" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cảng cạn *"
                name="dryPortName"
                rules={[{ required: true, message: 'Tên cảng cạn không được để trống' }, { max: 255, message: 'Tên cảng cạn tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng cạn Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Item label="Tỉnh/thành phố" name="province" rules={[{ required: false }]}>
                <Select
                  showSearch
                  placeholder="Chọn tỉnh/thành phố..."
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Loại đối tượng" name="loaiHinhHoc" rules={[{ required: true, message: 'Loại đối tượng không được để trống' }]}>
                <Select placeholder="Chọn loại đối tượng" options={[
                  { value: 'POINT', label: 'Đối tượng điểm' },
                  { value: 'LINE', label: 'Đối tượng đường' },
                  { value: 'POLYGON', label: 'Đối tượng vùng' }
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="gisLocation">
                <GisLocationSelector defaultGeometryType={createGeometryType} />
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
                name="area"
              >
                <InputNumber min={0.01} step={0.01} precision={2} placeholder="VD: 10000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Công suất TEU" name="teuCapacity">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 50000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Trạng thái
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="operationalStatus">
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
      )}

      {/* Edit Modal */}
      {(!isIframeModal || action === 'edit') && (
        <Modal
        title={isIframeModal ? null : (selectedRecord ? `Chỉnh sửa: ${selectedRecord.dryPortCode} — ${selectedRecord.dryPortName}` : 'Chỉnh sửa cảng cạn')}
        open={updateModalVisible}
        onCancel={closeUpdateModal}
        footer={null}
        width={isIframeModal ? '100%' : 800}
        mask={!isIframeModal}
        closable={!isIframeModal}
        style={isIframeModal ? { top: 0, margin: 0, padding: 0, maxWidth: 'none', height: '100%' } : undefined}
        styles={{
          body: isIframeModal ? { padding: '16px 24px', height: '100%', overflowY: 'auto' } : undefined
        }}
        forceRender
      >
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateFinish} onFinishFailed={handleFormFailed}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Mã cảng cạn" name="dryPortCode">
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cảng cạn *"
                name="dryPortName"
                rules={[{ required: true, message: 'Tên cảng cạn không được để trống' }, { max: 255, message: 'Tên cảng cạn tối đa 255 ký tự' }]}
              >
                <Input placeholder="VD: Cảng cạn Hải Phòng" maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Item label="Tỉnh/thành phố" name="province" rules={[{ required: false }]}>
                <Select
                  showSearch
                  placeholder="Chọn tỉnh/thành phố..."
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Loại đối tượng" name="loaiHinhHoc" rules={[{ required: true, message: 'Loại đối tượng không được để trống' }]}>
                <Select placeholder="Chọn loại đối tượng" options={[
                  { value: 'POINT', label: 'Đối tượng điểm' },
                  { value: 'LINE', label: 'Đối tượng đường' },
                  { value: 'POLYGON', label: 'Đối tượng vùng' }
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="gisLocation">
                <GisLocationSelector defaultGeometryType={updateGeometryType} />
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
                name="area"
              >
                <InputNumber min={0.01} step={0.01} precision={2} placeholder="VD: 10000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Công suất TEU" name="teuCapacity">
                <InputNumber min={0} step={0.01} precision={2} placeholder="VD: 50000.00" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Trạng thái hoạt động" name="operationalStatus">
                <Select placeholder="Chọn trạng thái" options={[{ label: 'Hiện hành', value: 'HIEN_HANH' }, { label: 'Tạm ngừng', value: 'TAM_NGUNG' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt">
                <Input disabled value={selectedRecord?.approvalStatus ? trangThaiPheDuyetBadge(selectedRecord.approvalStatus).label : '—'} aria-readonly="true" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeUpdateModal}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>Cập nhật</Button>
            </Space>
          </Form.Item>
        </Form>
        </Modal>
      )}

      {/* Detail Modal */}
      {(!isIframeModal || action === 'detail') && (
        <Modal
        title={isIframeModal ? null : (selectedRecord ? `Chi tiết cảng cạn: ${selectedRecord.dryPortCode} — ${selectedRecord.dryPortName}` : 'Chi tiết cảng cạn')}
        open={detailModalVisible}
        onCancel={closeDetailModal}
        footer={null}
        width={isIframeModal ? '100%' : 800}
        mask={!isIframeModal}
        closable={!isIframeModal}
        style={isIframeModal ? { top: 0, margin: 0, padding: 0, maxWidth: 'none', height: '100%' } : undefined}
        styles={{
          body: isIframeModal ? { padding: '16px 24px', height: '100%', overflowY: 'auto' } : undefined
        }}
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
                      <Tag color="cyan">{selectedRecord.dryPortCode}</Tag>
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Tên cảng cạn:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.dryPortName}</Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Tỉnh/thành phố:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.province || '—'}</Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Biểu tượng bản đồ:</Typography.Text>
                      <br />
                      <Space>
                        {(() => {
                          const sym = symbols.find(s => s.id === selectedRecord.symbolId);
                          if (sym && sym.hinhAnh) {
                            return (
                              <img
                                src={sym.hinhAnh.startsWith('data:') ? sym.hinhAnh : `data:image/png;base64,${sym.hinhAnh}`}
                                alt={sym.name}
                                style={{ width: 20, height: 20, objectFit: 'contain' }}
                              />
                            );
                          }
                          return null;
                        })()}
                        <Typography.Text>
                          {translateValue('symbolId', selectedRecord.symbolId)}
                        </Typography.Text>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Thông số kỹ thuật" size="small" style={{ height: '100%' }}>
                  <Typography.Text strong>Diện tích:</Typography.Text> {selectedRecord.area != null ? `${selectedRecord.area.toFixed(2)} m²` : '—'}
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'inline-block' }}>Công suất TEU:</Typography.Text> {selectedRecord.teuCapacity != null ? `${selectedRecord.teuCapacity.toFixed(2)} TEU` : '—'}
                </Card>
              </Col>
              <Col span={16}>
                <Card title="Thông tin địa lý" size="small" style={{ height: '100%' }}>
                  <Row gutter={[12, 12]}>
                    <Col span={24}>
                      <Typography.Text strong>Loại đối tượng:</Typography.Text>{' '}
                      <Typography.Text>
                        {selectedRecord.geometryType === 'POINT' ? 'Đối tượng điểm'
                          : selectedRecord.geometryType === 'LINE' ? 'Đối tượng đường'
                            : selectedRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng'
                              : selectedRecord.geometryType || 'Đối tượng điểm'}
                      </Typography.Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Trạng thái" size="small" style={{ height: '100%' }}>
                  <Typography.Text strong>Hoạt động:</Typography.Text>
                  <br />
                  {selectedRecord.operationalStatus && (
                    <Tag color={trangThaiHoatDongBadge(selectedRecord.operationalStatus).color}>
                      {trangThaiHoatDongBadge(selectedRecord.operationalStatus).label}
                    </Tag>
                  )}
                  <br />
                  <Typography.Text strong style={{ marginTop: 8, display: 'block' }}>Phê duyệt:</Typography.Text>
                  {selectedRecord.approvalStatus && (
                    <Tag color={trangThaiPheDuyetBadge(selectedRecord.approvalStatus).color}>
                      {trangThaiPheDuyetBadge(selectedRecord.approvalStatus).label}
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
                            onClick={() => window.open(documentApi.downloadUrl(f.minioKey), '_blank')}
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
                    <Descriptions.Item label="Người tạo"><UserResolver userId={selectedRecord.createdBy} /></Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
                    <Descriptions.Item label="Cập nhật bởi"><UserResolver userId={selectedRecord.updatedBy} /></Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">{selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                {selectedRecord.approvalStatus === 'CHO_PHE_DUYET' && (
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
                <Button icon={<UploadOutlined />} onClick={() => { setDetailModalVisible(false); navigate(`/document/upload/dry-port/${selectedRecord.id}`); }}>
                  Upload Giấy tờ
                </Button>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailModalVisible(false);
                    updateForm.setFieldsValue({
                      dryPortCode: selectedRecord.dryPortCode,
                      dryPortName: selectedRecord.dryPortName,
                      province: selectedRecord.province,
                      latitude: selectedRecord.latitude,
                      longitude: selectedRecord.longitude,
                      area: selectedRecord.area,
                      teuCapacity: selectedRecord.teuCapacity,
                      operationalStatus: selectedRecord.operationalStatus,
                      symbolId: selectedRecord.symbolId,
                    });
                    setUpdateModalVisible(true);
                  }}
                >
                  Chỉnh sửa
                </Button>
                <Button onClick={closeDetailModal}>Đóng</Button>
              </Space>
            </div>
          </div>
        )}
        </Modal>
      )}

      {/* History Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm}>
              <HistoryOutlined style={{ color: actionPrimary, fontSize: 20 }} />
              <span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
                {selectedRecord ? `Lịch sử thay đổi — ${selectedRecord.dryPortName}` : 'Lịch sử thay đổi'}
              </span>
            </Space>
          </div>
        }
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={880}
        styles={{ body: { padding: `${spaceMd}px`, maxHeight: '68vh', overflowY: 'auto' } }}
      >
        {!loadingHistory && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input.Search placeholder="Tìm kiếm nội dung thay đổi..." allowClear
              value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} style={{ flex: 1 }} />
          </div>
        )}
        {loadingHistory ? (
          <LoadingSkeleton rows={5} />
        ) : historyRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
            <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
          </div>
        ) : (
          (() => {
            const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
            const sorted = [...historyRecords].sort((a: any, b: any) =>
              new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime());
            const q = historySearch.toLowerCase().trim();

            const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
            for (const r of sorted) {
              if (q) {
                const fn = (r.fieldName || r.fieldChanged || '').toLowerCase();
                const ov = (r.oldValue || '').toLowerCase();
                const nv = (r.newValue || '').toLowerCase();
                const label = translateFieldName(r.fieldName || r.fieldChanged).toLowerCase();
                const oldDisp = translateValue(r.fieldName || r.fieldChanged, r.oldValue).toLowerCase();
                const newDisp = translateValue(r.fieldName || r.fieldChanged, r.newValue).toLowerCase();
                if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q)
                    && !label.includes(q) && !oldDisp.includes(q) && !newDisp.includes(q)) continue;
              }
              const ts = r.changedAt || r.createdAt || '';
              const sec = ts ? toSec(ts) : 0;
              const prev = groups[groups.length - 1];
              if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || '')) prev.items.push(r);
              else groups.push({ tsSec: sec, ts, actor: r.changedBy || '', items: [r] });
            }

            if (groups.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                  <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
                    {q ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
                  </div>
                </div>
              );
            }

            const fmtTime = (ts: string) => {
              const d = new Date(ts);
              return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}  ·  ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
            };

            if (q.length > 0 && historySearchRef.current !== q) {
              historySearchRef.current = q;
              const init: Record<number, boolean> = {};
              groups.forEach((_, i) => { init[i] = true; });
              setTimeout(() => setHistoryExpanded(init), 0);
            } else if (q.length === 0 && historySearchRef.current !== '') {
              historySearchRef.current = '';
              const init: Record<number, boolean> = {};
              groups.forEach((_, i) => { init[i] = false; });
              setTimeout(() => setHistoryExpanded(init), 0);
            }

            return (
          <div style={{ maxHeight: '62vh', overflowY: 'auto' }}>
            {groups.map((g, gi) => (
              <div key={gi} style={{ display: 'flex', gap: spaceSm, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: surfaceCard,
                    border: `1px solid ${actionPrimary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ClockCircleFilled style={{ color: actionPrimary, fontSize: 14 }} />
                  </div>
                  {gi < groups.length - 1 && (
                    <div style={{ width: 1, flex: 1, minHeight: 24, background: borderDefault, marginTop: spaceXs }} />
                  )}
                </div>
                <div style={{ ...cardStyle, flex: 1, padding: `${spaceSm}px ${spaceFormField}px`, marginBottom: 0,
                  borderRadius: radiusLg, boxShadow: shadowSm }}>
                  <div onClick={() => setHistoryExpanded(prev => ({ ...prev, [gi]: !prev[gi] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: spaceSm, cursor: 'pointer' }}>
                    <Typography.Text style={{ fontSize: fontSizeLg, color: textPrimary, fontWeight: fontWeightBold }}>
                      {g.ts ? fmtTime(g.ts) : '—'}
                    </Typography.Text>
                    {g.actor && (
                      <Typography.Text style={{ fontSize: fontSizeMd, color: textSecondary }}>— {g.actor}</Typography.Text>
                    )}
                    <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: actionPrimary,
                      background: `${actionPrimary}12`, borderRadius: radiusPill, padding: '2px 10px', marginLeft: 'auto' }}>
                      {g.items.length}
                    </span>
                    {historyExpanded[gi] ? (
                      <UpOutlined style={{ fontSize: 12, color: textTertiary }} />
                    ) : (
                      <DownOutlined style={{ fontSize: 12, color: textTertiary }} />
                    )}
                  </div>
                  {historyExpanded[gi] && (
                    <>
                      <Divider style={{ margin: `${spaceSm}px 0`, borderColor: borderDefault }} />
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {g.items.map((r: any, ri: number) => {
                            const fn = r.fieldName || r.fieldChanged;
                            const ov = r.oldValue !== undefined && r.oldValue != null
                              ? translateValue(fn, r.oldValue) : null;
                            const nv = r.newValue !== undefined && r.newValue != null
                              ? translateValue(fn, r.newValue) : null;
                            return (
                              <tr key={r.id || ri}>
                                <td style={{ padding: `${spaceXs}px ${spaceSm}px ${spaceXs}px 0`,
                                  fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary,
                                  whiteSpace: 'nowrap', verticalAlign: 'middle', width: 1 }}>
                                  {fn ? translateFieldName(fn) : '—'}
                                </td>
                                <td style={{ padding: `${spaceXs}px 0`, verticalAlign: 'middle' }}>
                                  <Space size={spaceXs}>
                                    {ov ? (
                                      <Typography.Text delete style={{ fontSize: fontSizeMd, color: statusCritical }}>{ov}</Typography.Text>
                                    ) : (
                                      <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>
                                    )}
                                    <ArrowRightOutlined style={{ fontSize: 10, color: textTertiary }} />
                                    {nv ? (
                                      <Typography.Text strong style={{ fontSize: fontSizeMd, color: statusOperational }}>{nv}</Typography.Text>
                                    ) : (
                                      <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>
                                    )}
                                  </Space>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
            );
          })()
        )}
      </Modal>
    </>
  );
}
