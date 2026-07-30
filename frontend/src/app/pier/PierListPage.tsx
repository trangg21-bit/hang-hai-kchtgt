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
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  fetchBenCangById,
} from './api';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from '../../services/port/schema';
import type { Pier, CauCangListQuery, BenCangOption, LoaiCau } from './types';
import { LOAI_CAU_OPTIONS, translateLoaiCau } from './types';
import { documentApi } from '../document/api';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import { z } from 'zod';
import { cauCangCreateSchema, cauCangUpdateSchema } from './schema';
import DocumentUploadModal from '../document/DocumentUploadModal';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import UserResolver from '../../components/UserResolver';

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
    bieuTuongId: 'Biểu tượng bản đồ',
    iconId: 'Biểu tượng bản đồ',
    lineSymbolId: 'Ký hiệu đường',
    fillSymbolId: 'Ký hiệu vùng',
    khongGianId: 'Vị trí không gian',
    spatialId: 'Vị trí không gian',
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

export default function PierListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isIframeModal = (window.self !== window.top) && searchParams.has('action');

  const action = searchParams.get('action');
  const id = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>();
  const [filterApproval, setFilterApproval] = useState<string>();
  const [filterBenCangId, setFilterBenCangId] = useState<string>();
  const [filterLoaiCau, setFilterLoaiCau] = useState<LoaiCau>();
  const sortBy = 'createdAt';
  const sortOrder = 'desc';
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<Pier[]>([]);
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
  const [selectedRecord, setSelectedRecord] = useState<Pier | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  // Forms definition
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const createLoaiHinhHoc = Form.useWatch('loaiHinhHoc', createForm);
  const updateLoaiHinhHoc = Form.useWatch('loaiHinhHoc', updateForm);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const query: CauCangListQuery = {
        search: search || undefined,
        status: filterStatus as any,
        approvalStatus: filterApproval as any,
        berthId: filterBenCangId || undefined,
        loaiCau: filterLoaiCau,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        page,
        pageSize,
      };
      const res = await fetchCauCangList(query);
      setDataSource(res.content);
      setTotal(res.totalElements);
    } catch (err: unknown) {
      console.error('Failed to fetch Pier list:', err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cầu cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [search, filterStatus, filterApproval, filterBenCangId, filterLoaiCau, sortBy, sortOrder, page, pageSize]);

  const handleBenCangSearch = useCallback(async (searchText: string) => {
    try {
      const res = await fetchBenCangOptions({ size: 50, berthName: searchText || undefined });
      setBenCangOptions(res.content);
    } catch (err) {
      console.error('Failed to load Berth options:', err);
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
    if (['khongGianId', 'spatialId'].includes(fieldName)) {
      return 'Có tọa độ bản đồ';
    }
    if (fieldName === 'approvalStatus') {
      const approval = APPROVAL_MAP[val] || APPROVAL_MAP[val.toUpperCase()];
      return approval ? approval.label : val;
    }
    if (fieldName === 'operationalStatus') {
      const status = STATUS_MAP[val] || STATUS_MAP[val.toUpperCase()];
      return status ? status.label : val;
    }
    if (fieldName === 'loaiCau') {
      return translateLoaiCau(val as any);
    }
    return val;
  }, [symbols]);

  useEffect(() => {
    // 1. Try to use symbols cache from parent window
    const parentSymbols = (window.parent as any)?.kchtSymbols;
    if (parentSymbols && parentSymbols.length > 0) {
      setSymbols(parentSymbols);
    }

    // 2. Only fetch what is required:
    const needSymbols = !parentSymbols || parentSymbols.length === 0;

    if (needSymbols) {
      void fetchSymbols();
    }
  }, [fetchSymbols, isIframeModal, action]);
  useEffect(() => { if (!isIframeModal) void fetchData(); }, [fetchData, isIframeModal]);

  useEffect(() => {
    if (id && (action === 'detail' || action === 'edit')) {
      (async () => {
        try {
          setIsLoading(true);
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = cached || await fetchCauCangById(id);
          setSelectedRecord(data);
          if (action === 'detail') {
            const fileRes = await documentApi.listByEntity('pier', id, { page: 1, size: 20 });
            setDetailFiles(fileRes.data || []);
            setDetailModalVisible(true);
          } else if (action === 'edit') {
            if (data.berthId) {
              setBenCangOptions([{ id: data.berthId, berthName: 'Đang tải...' }]);
            }
            updateForm.setFieldsValue({
              pierCode: data.pierCode,
              pierName: data.pierName,
              berthId: data.berthId,
              length: data.length,
              taiTrong: data.taiTrong,
              loaiCau: data.loaiCau,
              operationalCapacity: data.operationalCapacity ? data.operationalCapacity.split(',').map((s: string) => s.trim()) : [],
              operationalStatus: data.operationalStatus,
              bieuTuongId: data.bieuTuongId,
              loaiHinhHoc: data.loaiHinhHoc || 'LINE',
              gisLocation: {
                loaiHinhHoc: data.loaiHinhHoc || 'LINE',
                toaDo: data.toaDo || '',
                bieuTuongId: data.bieuTuongId
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

  useEffect(() => {
    if (selectedRecord && selectedRecord.berthId) {
      const exists = benCangOptions.some(o => o.id === selectedRecord.berthId);
      if (!exists) {
        fetchBenCangById(selectedRecord.berthId)
          .then((parentBerth) => {
            if (parentBerth) {
              setBenCangOptions(prev => [...prev, parentBerth]);
            }
          })
          .catch((err) => console.error("Error pre-fetching parent Berth:", err));
      }
    }
  }, [selectedRecord, benCangOptions]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleDelete = useCallback(
    async (record: Pier) => {
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
    async (record: Pier) => {
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
    async (record: Pier) => {
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
        pierCode: values.pierCode,
        pierName: values.pierName,
        berthId: values.berthId,
        length: values.length || undefined,
        taiTrong: values.taiTrong || undefined,
        loaiCau: values.loaiCau || undefined,
        operationalCapacity: values.operationalCapacity ? values.operationalCapacity.join(', ') : undefined,
        operationalStatus: values.operationalStatus || 'HIEN_HANH',
        bieuTuongId: values.gisLocation?.bieuTuongId || values.bieuTuongId || undefined,
        loaiHinhHoc: values.loaiHinhHoc,
        toaDo: values.gisLocation?.toaDo,
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
        createForm.setFields([{ name: 'pierCode', errors: ['Mã cầu đã tồn tại.'] }]);
        toast.error('Mã cầu đã tồn tại');
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
      const parsed = cauCangUpdateSchema.parse({
        id: selectedRecord.id,
        pierName: values.pierName || undefined,
        berthId: values.berthId || undefined,
        length: values.length,
        taiTrong: values.taiTrong,
        loaiCau: values.loaiCau || undefined,
        operationalCapacity: values.operationalCapacity ? values.operationalCapacity.join(', ') : undefined,
        operationalStatus: values.operationalStatus,
        bieuTuongId: values.gisLocation?.bieuTuongId || values.bieuTuongId || null,
        loaiHinhHoc: values.loaiHinhHoc,
        toaDo: values.gisLocation?.toaDo,
      });

      setSubmitting(true);
      const res = await updateCauCang(parsed);
      toast.success('Cập nhật cầu cảng thành công');
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

  const columns = useMemo(
    () => [
      {
        title: 'STT',
        width: 60,
        render: (_: unknown, __: Pier, idx: number) => page * pageSize + idx + 1,
      },
      {
        title: 'Mã cầu',
        dataIndex: 'pierCode',
        width: 120,
        render: (pierCode: string) => <Tag color="cyan">{pierCode}</Tag>,
      },
      {
        title: 'Tên cầu',
        dataIndex: 'pierName',
        width: 250,
        ellipsis: true,
      },
      {
        title: 'Bến cảng chủ',
        dataIndex: 'tenBenCang',
        width: 180,
        render: (tenBenCang: string, record: Pier) => {
          return tenBenCang || record.berthId?.slice(0, 8) + '…';
        },
      },
      {
        title: 'Chiều dài (m)',
        dataIndex: 'length',
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
        render: (v: string) => translateLoaiCau(v),
      },
      {
        title: 'Trạng thái HĐ',
        dataIndex: 'operationalStatus',
        width: 100,
        render: (v: string) => {
          const badge = trangThaiHoatDongBadge(v);
          return <Tag color={badge.color}>{badge.label}</Tag>;
        },
      },
      {
        title: 'Phê duyệt',
        dataIndex: 'approvalStatus',
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
        render: (_: unknown, record: Pier) => (
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
                    const fileRes = await documentApi.listByEntity('pier', record.id, { page: 1, size: 20 });
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
                      pierCode: data.pierCode,
                      pierName: data.pierName,
                      berthId: data.berthId,
                      length: data.length,
                      taiTrong: data.taiTrong,
                      loaiCau: data.loaiCau,
                      operationalCapacity: data.operationalCapacity ? data.operationalCapacity.split(',').map(s => s.trim()) : [],
                      operationalStatus: data.operationalStatus,
                      bieuTuongId: data.bieuTuongId,
                      loaiHinhHoc: data.loaiHinhHoc || 'LINE',
                      gisLocation: {
                        loaiHinhHoc: data.loaiHinhHoc || 'LINE',
                        toaDo: data.toaDo || '',
                        bieuTuongId: data.bieuTuongId
                      }
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
                    const { fetchpierHistory } = await import('./api');
                    const histData = await fetchpierHistory(record.id);
                    setHistoryRecords(histData?.changeHistory || []);
                  } catch (err) {
                    toast.error('Không thể tải lịch sử thay đổi');
                  } finally {
                    setLoadingHistory(false);
                  }
                }}
              />
            </Tooltip>
            {record.approvalStatus === 'CHO_PHE_DUYET' && (
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
                description={`Bạn có chắc muốn xóa cầu cảng "${record.pierCode}"?`}
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
                placeholder="Loại cầu"
                allowClear
                style={{ width: 160 }}
                value={filterLoaiCau}
                onChange={(val) => { setFilterLoaiCau(val as LoaiCau); setPage(0); }}
                options={LOAI_CAU_OPTIONS}
              />
              <Select
                placeholder="Bến cảng chủ"
                allowClear
                style={{ width: 200 }}
                value={filterBenCangId}
                onChange={(val) => { setFilterBenCangId(val); setPage(0); }}
                options={benCangOptions.map((o) => ({ value: o.id, label: o.berthName }))}
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
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<Pier>
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
        title="Tạo mới Cầu cảng"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateFinish} onFinishFailed={handleFormFailed} initialValues={{ operationalStatus: 'HIEN_HANH' }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Mã cầu *"
                name="pierCode"
                rules={[{ required: true, message: 'Mã cầu không được để trống' }, { max: 50, message: 'Mã cầu tối đa 50 ký tự' }]}
              >
                <Input placeholder="VD: CC-HAIPHONG-001" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cầu *"
                name="pierName"
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
                name="berthId"
                rules={[{ required: true, message: 'Vui lòng chọn bến cảng chủ' }]}
              >
                <Select
                  placeholder="Chọn bến cảng chủ"
                  showSearch
                  filterOption={false}
                  onSearch={handleBenCangSearch}
                  onOpenChange={(open) => {
                    if (open && benCangOptions.length <= 1) {
                      void handleBenCangSearch('');
                    }
                  }}
                  options={benCangOptions.map(o => ({ label: o.berthName, value: o.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Loại cầu" name="loaiCau">
                <Select placeholder="Chọn loại cầu cảng" allowClear options={LOAI_CAU_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số kỹ thuật
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Chiều dài (m)" name="length">
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
              <Form.Item label="Công năng khai thác" name="operationalCapacity">
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
              <Form.Item label="Trạng thái hoạt động" name="operationalStatus">
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
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Vị trí không gian (GIS)
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Loại đối tượng *" name="loaiHinhHoc" rules={[{ required: true, message: 'Loại đối tượng không được để trống' }]}>
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
                <GisLocationSelector defaultGeometryType={createLoaiHinhHoc} />
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
      )}

      {/* Edit Modal */}
      {(!isIframeModal || action === 'edit') && (
        <Modal
        title={isIframeModal ? null : (selectedRecord ? `Chỉnh sửa: ${selectedRecord.pierCode} — ${selectedRecord.pierName}` : 'Chỉnh sửa cầu cảng')}
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
      >
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateFinish} onFinishFailed={handleFormFailed}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            Thông tin chung
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Mã cầu" name="pierCode">
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên cầu *"
                name="pierName"
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
                name="berthId"
                rules={[{ required: true, message: 'Vui lòng chọn bến cảng chủ' }]}
              >
                <Select
                  placeholder="Chọn bến cảng chủ"
                  showSearch
                  filterOption={false}
                  onSearch={handleBenCangSearch}
                  onOpenChange={(open) => {
                    if (open && benCangOptions.length <= 1) {
                      void handleBenCangSearch('');
                    }
                  }}
                  options={benCangOptions.map(o => ({ label: o.berthName, value: o.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Loại cầu" name="loaiCau">
                <Select placeholder="Chọn loại cầu cảng" allowClear options={LOAI_CAU_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số kỹ thuật
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Chiều dài (m)" name="length">
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
              <Form.Item label="Công năng khai thác" name="operationalCapacity">
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
              <Form.Item label="Trạng thái hoạt động" name="operationalStatus">
                <Select placeholder="Chọn trạng thái" options={Object.entries(STATUS_MAP).map(([v, { label }]) => ({ value: v, label }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái phê duyệt">
                <Input disabled value={selectedRecord?.approvalStatus ? trangThaiPheDuyetBadge(selectedRecord.approvalStatus).label : '—'} aria-readonly="true" />
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
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Vị trí không gian (GIS)
          </Typography.Text>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Loại đối tượng *" name="loaiHinhHoc" rules={[{ required: true, message: 'Loại đối tượng không được để trống' }]}>
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
                <GisLocationSelector defaultGeometryType={updateLoaiHinhHoc} />
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
        title={isIframeModal ? null : (selectedRecord ? `Chi tiết cầu cảng: ${selectedRecord.pierCode} — ${selectedRecord.pierName}` : 'Chi tiết cầu cảng')}
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
                      <Typography.Text strong>Mã cầu:</Typography.Text>
                      <br />
                      <Tag color="cyan">{selectedRecord.pierCode}</Tag>
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Tên cầu:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.pierName}</Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Bến cảng chủ:</Typography.Text>
                      <br />
                      <Typography.Text>
                        {selectedRecord.tenBenCang || selectedRecord.berthId}
                      </Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Loại cầu:</Typography.Text>
                      <br />
                      <Typography.Text>{translateLoaiCau(selectedRecord.loaiCau)}</Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Biểu tượng bản đồ:</Typography.Text>
                      <br />
                      <Space>
                        {(() => {
                          const sym = symbols.find(s => s.id === selectedRecord.bieuTuongId);
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
                          {translateValue('bieuTuongId', selectedRecord.bieuTuongId)}
                        </Typography.Text>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Thông số kỹ thuật" size="small" style={{ height: '100%' }}>
                  <Typography.Text strong>Chiều dài:</Typography.Text> {selectedRecord.length != null ? `${selectedRecord.length.toFixed(2)} m` : '—'}
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
                      {selectedRecord.operationalStatus && (
                        <Tag color={trangThaiHoatDongBadge(selectedRecord.operationalStatus).color}>
                          {trangThaiHoatDongBadge(selectedRecord.operationalStatus).label}
                        </Tag>
                      )}
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Phê duyệt:</Typography.Text>
                      <br />
                      {selectedRecord.approvalStatus && (
                        <Tag color={trangThaiPheDuyetBadge(selectedRecord.approvalStatus).color}>
                          {trangThaiPheDuyetBadge(selectedRecord.approvalStatus).label}
                        </Tag>
                      )}
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Công năng khai thác" size="small">
                  {selectedRecord.operationalCapacity ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedRecord.operationalCapacity.split(',').map(s => s.trim()).filter(Boolean).map(c => (
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
                      pierCode: selectedRecord.pierCode,
                      pierName: selectedRecord.pierName,
                      berthId: selectedRecord.berthId,
                      length: selectedRecord.length,
                      taiTrong: selectedRecord.taiTrong,
                      loaiCau: selectedRecord.loaiCau,
                      operationalCapacity: selectedRecord.operationalCapacity ? selectedRecord.operationalCapacity.split(',').map(s => s.trim()) : [],
                      operationalStatus: selectedRecord.operationalStatus,
                      bieuTuongId: selectedRecord.bieuTuongId,
                      loaiHinhHoc: selectedRecord.loaiHinhHoc || 'LINE',
                      gisLocation: {
                        loaiHinhHoc: selectedRecord.loaiHinhHoc || 'LINE',
                        toaDo: selectedRecord.toaDo || '',
                        bieuTuongId: selectedRecord.bieuTuongId
                      }
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

      {/* Upload Giấy tờ Modal */}
      {selectedRecord && (
        <DocumentUploadModal
          entityType="pier"
          entityId={selectedRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}

      {/* History Modal */}
      <Modal
        title={selectedRecord ? `Lịch sử thay đổi: ${selectedRecord.pierCode} — ${selectedRecord.pierName}` : 'Lịch sử thay đổi'}
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
