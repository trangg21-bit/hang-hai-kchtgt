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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { waterZoneApi } from './api';
import type { WaterZone, VungNuocTrangThaiHoatDong, VungNuocTrangThaiPheDuyet, LoaiVungNuoc } from './types';
import {
  WaterZone_HOAT_DONG_MAP,
  WaterZone_PHE_DUYET_MAP,
  LOAI_VUNG_NUOC_OPTIONS,
  translateLoaiVungNuoc,
} from './types';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from '../../services/port/schema';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { documentApi } from '../document/api';
import { z } from 'zod';
import { vungNuocCreateSchema, vungNuocUpdateSchema } from './schema';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import UserResolver from '../../components/UserResolver';

export const translateFieldName = (fieldName: string): string => {
  const map: Record<string, string> = {
    portCode: 'Mã cảng biển',
    portName: 'Tên cảng biển',
    province: 'Tỉnh/Thành phố',
    viDo: 'Vĩ độ',
    kinhDo: 'Kinh độ',
    area: 'Diện tích (ha)',
    khaNangTiepNhan: 'Khả năng tiếp nhận',
    nhomCangBien: 'Nhóm cảng biển',
    berthCode: 'Mã bến cảng',
    berthName: 'Tên bến cảng',
    portId: 'Cảng biển chủ',
    tuyenDuongThuy: 'Tuyến đường thủy',
    width: 'Chiều rộng (m)',
    loaiBen: 'Loại bến',
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
    congNangKhaiThac: 'Công năng khai thác',
    bieuTuongId: 'Biểu tượng bản đồ',
    iconId: 'Biểu tượng bản đồ',
    lineSymbolId: 'Ký hiệu đường',
    fillSymbolId: 'Ký hiệu vùng',
    khongGianId: 'Vị trí không gian',
    spatialId: 'Vị trí không gian',
  };
  return map[fieldName] || fieldName;
};

export default function WaterZoneListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMaVung, setFilterMaVung] = useState('');
  const [filterTenVung, setFilterTenVung] = useState('');
  const [filterHoatDong, setFilterHoatDong] = useState<VungNuocTrangThaiHoatDong | undefined>();
  const [filterPheDuyet, setFilterPheDuyet] = useState<VungNuocTrangThaiPheDuyet | undefined>();
  const [cangBienIdFilter, setCangBienIdFilter] = useState<string | undefined>();
  const [filterLoaiVungNuoc, setFilterLoaiVungNuoc] = useState<LoaiVungNuoc | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<WaterZone[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cangBienOptions, setCangBienOptions] = useState<Array<{ id: string; portName: string }>>([]);
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
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WaterZone | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Forms definition
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

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
          console.log('[IframeCache] Looked up ID:', id, 'Found:', cached, 'Global cache object:', (window.parent as any)?.kchtDetailCache);
          const data = cached || await waterZoneApi.findById(id);
          setSelectedRecord(data);
          if (action === 'detail') {
            const fileRes = await documentApi.listByEntity('water-zone', id, { page: 1, size: 20 });
            setDetailFiles(fileRes.data || []);
            setDetailModalVisible(true);
          } else if (action === 'edit') {
            if (data.portId) {
              setCangBienOptions([{ id: data.portId, portName: data.tenCangBien || 'Cảng biển hiện tại' }]);
            }
            updateForm.setFieldsValue({
              waterZoneCode: data.waterZoneCode,
              waterZoneName: data.waterZoneName,
              portId: data.portId,
              area: data.area,
              doSauMax: data.doSauMax,
              doSauTrungBinh: data.doSauTrungBinh,
              loaiVungNuoc: data.loaiVungNuoc,
              operationalStatus: data.operationalStatus,
              bieuTuongId: data.bieuTuongId,
              loaiHinhHoc: data.loaiHinhHoc || 'POLYGON',
              gisLocation: {
                loaiHinhHoc: data.loaiHinhHoc || 'POLYGON',
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
  const createLoaiHinhHoc = Form.useWatch('loaiHinhHoc', createForm);
  const updateLoaiHinhHoc = Form.useWatch('loaiHinhHoc', updateForm);

  const handleCangBienSearch = useCallback(async (searchText: string) => {
    try {
      const { fetchCangBienList } = await import('../../services/port/api');
      const res = await fetchCangBienList({
        page: 0,
        size: 50,
        portName: searchText || undefined,
        operationalStatus: 'HIEN_HANH'
      });
      setCangBienOptions(res.content.map((c) => ({ id: c.id, portName: c.portName })));
    } catch (err) {
      console.error('Failed to search Port options:', err);
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
      const approvalMap: Record<string, string> = {
        'CHO_PHE_DUYET': 'Chờ phê duyệt',
        'DUOC_PHE_DUYET': 'Được phê duyệt',
        'TU_CHOI': 'Từ chối',
      };
      return approvalMap[val.toUpperCase()] || val;
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
    if (fieldName === 'loaiVungNuoc') {
      return translateLoaiVungNuoc(val);
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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await waterZoneApi.list({
        page,
        pageSize,
        search: search || filterMaVung || filterTenVung || undefined,
        operationalStatus: filterHoatDong,
        approvalStatus: filterPheDuyet,
        portId: cangBienIdFilter,
        loaiVungNuoc: filterLoaiVungNuoc,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách vùng nước'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterMaVung, filterTenVung, filterHoatDong, filterPheDuyet, cangBienIdFilter, filterLoaiVungNuoc]);

  useEffect(() => { if (!isIframeModal) void fetchData(); }, [fetchData, isIframeModal]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: WaterZone) => {
      try {
        await waterZoneApi.delete(record.id);
        toast.success('Đã xóa vùng nước thành công');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleApprove = useCallback(
    async (record: WaterZone) => {
      try {
        await waterZoneApi.approve(record.id);
        toast.success('Đã phê duyệt vùng nước');
        fetchData();
        if (detailModalVisible && selectedRecord?.id === record.id) {
          const updated = await waterZoneApi.findById(record.id);
          setSelectedRecord(updated);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData, detailModalVisible, selectedRecord],
  );

  const handleReject = useCallback(
    async (record: WaterZone) => {
      const reason = window.prompt('Lý do từ chối (tối thiểu 10 ký tự):', '');
      if (reason === null || reason.trim().length < 10) {
        if (reason === null) return;
        toast.warning('Lý do từ chối tối thiểu 10 ký tự');
        return;
      }
      try {
        await waterZoneApi.reject(record.id, reason);
        toast.success('Đã từ chối');
        fetchData();
        if (detailModalVisible && selectedRecord?.id === record.id) {
          const updated = await waterZoneApi.findById(record.id);
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
        waterZoneCode: values.waterZoneCode,
        waterZoneName: values.waterZoneName,
        portId: values.portId,
        area: values.area || undefined,
        doSauMax: values.doSauMax || undefined,
        doSauTrungBinh: values.doSauTrungBinh || undefined,
        loaiVungNuoc: values.loaiVungNuoc || undefined,
        operationalStatus: values.operationalStatus || 'HIEN_HANH',
        bieuTuongId: values.gisLocation?.bieuTuongId || values.bieuTuongId || undefined,
        loaiHinhHoc: values.loaiHinhHoc,
        toaDo: values.gisLocation?.toaDo,
      });

      setSubmitting(true);
      await waterZoneApi.create(parsed);
      toast.success('Tạo mới vùng nước thành công');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        err.issues.forEach((e) => toast.error(e.message));
      } else if ((err as any).status === 409) {
        createForm.setFields([{ name: 'waterZoneCode', errors: ['Mã vùng nước đã tồn tại.'] }]);
        toast.error('Mã vùng nước đã tồn tại');
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
      const parsed = vungNuocUpdateSchema.parse({
        id: selectedRecord.id,
        waterZoneName: values.waterZoneName || undefined,
        portId: values.portId || undefined,
        area: values.area,
        doSauMax: values.doSauMax,
        doSauTrungBinh: values.doSauTrungBinh,
        loaiVungNuoc: values.loaiVungNuoc || undefined,
        operationalStatus: values.operationalStatus,
        bieuTuongId: values.gisLocation?.bieuTuongId || values.bieuTuongId || null,
        loaiHinhHoc: values.loaiHinhHoc,
        toaDo: values.gisLocation?.toaDo,
      });

      setSubmitting(true);
      const res = await waterZoneApi.update(parsed);
      toast.success('Cập nhật vùng nước thành công');
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

  const columns: TableProps<WaterZone>['columns'] = [
    {
      title: 'STT',
      width: 60,
      render: (_: unknown, __: WaterZone, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Mã vùng nước',
      dataIndex: 'waterZoneCode',
      width: 140,
      render: (waterZoneCode: string) => <Tag color="cyan">{waterZoneCode}</Tag>,
    },
    {
      title: 'Tên vùng nước',
      dataIndex: 'waterZoneName',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Cảng biển chủ',
      dataIndex: 'tenCangBien',
      width: 180,
      render: (tenCangBien: string, record: WaterZone) => {
        return tenCangBien || record.portId?.substring(0, 12) + '...';
      },
    },
    {
      title: 'Diện tích (m²)',
      dataIndex: 'area',
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
      render: (loaiVungNuoc: string | null) => translateLoaiVungNuoc(loaiVungNuoc),
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'operationalStatus',
      width: 100,
      render: (status: VungNuocTrangThaiHoatDong) => {
        const badge = trangThaiHoatDongBadge(status);
        return <Tag color={badge.color}>{badge.label}</Tag>;
      },
    },
    {
      title: 'Phê duyệt',
      dataIndex: 'approvalStatus',
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
      render: (_: unknown, record: WaterZone) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const data = await waterZoneApi.findById(record.id);
                  setSelectedRecord(data);
                  const fileRes = await documentApi.listByEntity('water-zone', record.id, { page: 1, size: 20 });
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
                  const data = await waterZoneApi.findById(record.id);
                  setSelectedRecord(data);
                  updateForm.setFieldsValue({
                    waterZoneCode: data.waterZoneCode,
                    waterZoneName: data.waterZoneName,
                    portId: data.portId,
                    area: data.area,
                    doSauMax: data.doSauMax,
                    doSauTrungBinh: data.doSauTrungBinh,
                    loaiVungNuoc: data.loaiVungNuoc,
                    operationalStatus: data.operationalStatus,
                    bieuTuongId: data.bieuTuongId,
                    loaiHinhHoc: data.loaiHinhHoc || 'POLYGON',
                    gisLocation: {
                      loaiHinhHoc: data.loaiHinhHoc || 'POLYGON',
                      toaDo: data.toaDo || '',
                      bieuTuongId: data.bieuTuongId
                    }
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
          {record.approvalStatus === 'CHO_PHE_DUYET' && (
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
          {record.approvalStatus === 'CHO_PHE_DUYET' && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa vùng nước "${record.waterZoneName}"?`}
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
                  const { waterZoneApi } = await import('./api');
                  const histData = await waterZoneApi.getHistory(record.id);
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
              />
              <Select
                placeholder="Trạng thái hoạt động"
                allowClear
                style={{ width: 180 }}
                value={filterHoatDong}
                onChange={(val) => { setFilterHoatDong(val as VungNuocTrangThaiHoatDong | undefined); setPage(1); }}
                options={Object.entries(WaterZone_HOAT_DONG_MAP).map(([value, { label }]) => ({ value, label }))}
              />
              <Select
                placeholder="Trạng thái phê duyệt"
                allowClear
                style={{ width: 180 }}
                value={filterPheDuyet}
                onChange={(val) => { setFilterPheDuyet(val as VungNuocTrangThaiPheDuyet | undefined); setPage(1); }}
                options={Object.entries(WaterZone_PHE_DUYET_MAP).map(([value, { label }]) => ({ value, label }))}
              />
              <Select
                placeholder="Loại vùng nước"
                allowClear
                style={{ width: 180 }}
                value={filterLoaiVungNuoc}
                onChange={(val) => { setFilterLoaiVungNuoc(val as LoaiVungNuoc | undefined); setPage(1); }}
                options={LOAI_VUNG_NUOC_OPTIONS}
              />
              <Select
                placeholder="Cảng biển chủ"
                allowClear
                style={{ width: 200 }}
                value={cangBienIdFilter}
                onChange={(val) => { setCangBienIdFilter(val); setPage(1); }}
                options={cangBienOptions.map((o) => ({ value: o.id, label: o.portName }))}
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
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<WaterZone>
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
        title="Tạo mới Vùng nước"
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
                label="Mã vùng nước *"
                name="waterZoneCode"
                rules={[{ required: true, message: 'Mã vùng nước không được để trống' }, { max: 50, message: 'Mã vùng nước tối đa 50 ký tự' }]}
              >
                <Input placeholder="VD: VN-HAIPHONG-001" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên vùng nước *"
                name="waterZoneName"
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
                name="portId"
                rules={[{ required: true, message: 'Vui lòng chọn cảng biển chủ' }]}
              >
                <Select
                  placeholder="Chọn cảng biển chủ"
                  showSearch
                  filterOption={false}
                  onSearch={handleCangBienSearch}
                  onOpenChange={(open) => {
                    if (open && cangBienOptions.length <= 1) {
                      void handleCangBienSearch('');
                    }
                  }}
                  options={cangBienOptions.map(o => ({ label: o.portName, value: o.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Loại vùng nước" name="loaiVungNuoc">
                <Select placeholder="Chọn loại vùng nước" allowClear options={LOAI_VUNG_NUOC_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số kỹ thuật
          </Typography.Text>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="Diện tích (m²)" name="area">
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
              <Form.Item label="Trạng thái hoạt động" name="operationalStatus">
                <Select placeholder="Chọn trạng thái" options={Object.entries(WaterZone_HOAT_DONG_MAP).map(([value, { label }]) => ({ value, label }))} />
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
              <Button type="primary" htmlType="submit" loading={submitting}>Tạo vùng nước</Button>
            </Space>
          </Form.Item>
        </Form>
        </Modal>
      )}

      {/* Edit Modal */}
      {(!isIframeModal || action === 'edit') && (
        <Modal
        title={isIframeModal ? null : (selectedRecord ? `Chỉnh sửa: ${selectedRecord.waterZoneCode} — ${selectedRecord.waterZoneName}` : 'Chỉnh sửa vùng nước')}
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
              <Form.Item label="Mã vùng nước" name="waterZoneCode">
                <Input disabled aria-readonly="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên vùng nước *"
                name="waterZoneName"
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
                name="portId"
                rules={[{ required: true, message: 'Vui lòng chọn cảng biển chủ' }]}
              >
                <Select
                  placeholder="Chọn cảng biển chủ"
                  showSearch
                  filterOption={false}
                  onSearch={handleCangBienSearch}
                  onOpenChange={(open) => {
                    if (open && cangBienOptions.length <= 1) {
                      void handleCangBienSearch('');
                    }
                  }}
                  options={cangBienOptions.map(o => ({ label: o.portName, value: o.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Loại vùng nước" name="loaiVungNuoc">
                <Select placeholder="Chọn loại vùng nước" allowClear options={LOAI_VUNG_NUOC_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Text strong style={{ display: 'block', marginBottom: 12, marginTop: 16 }}>
            Thông số kỹ thuật
          </Typography.Text>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="Diện tích (m²)" name="area">
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
              <Form.Item label="Trạng thái hoạt động" name="operationalStatus">
                <Select placeholder="Chọn trạng thái" options={Object.entries(WaterZone_HOAT_DONG_MAP).map(([value, { label }]) => ({ value, label }))} />
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
        title={isIframeModal ? null : (selectedRecord ? `Chi tiết vùng nước: ${selectedRecord.waterZoneCode} — ${selectedRecord.waterZoneName}` : 'Chi tiết vùng nước')}
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
                      <Typography.Text strong>Mã vùng nước:</Typography.Text>
                      <br />
                      <Tag color="cyan">{selectedRecord.waterZoneCode}</Tag>
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>Tên vùng nước:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.waterZoneName}</Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Cảng biển chủ:</Typography.Text>
                      <br />
                      <Typography.Text>
                        {selectedRecord.tenCangBien || selectedRecord.portId}
                      </Typography.Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 8 }}>
                      <Typography.Text strong>Loại vùng nước:</Typography.Text>
                      <br />
                      <Typography.Text>{selectedRecord.loaiVungNuoc || '—'}</Typography.Text>
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
                  <Typography.Text strong>Diện tích:</Typography.Text> {selectedRecord.area != null ? `${selectedRecord.area.toFixed(2)} m²` : '—'}
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
                <Button icon={<UploadOutlined />} onClick={() => { setDetailModalVisible(false); navigate(`/document/upload/water-zone/${selectedRecord.id}`); }}>
                  Upload Giấy tờ
                </Button>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailModalVisible(false);
                    updateForm.setFieldsValue({
                      waterZoneCode: selectedRecord.waterZoneCode,
                      waterZoneName: selectedRecord.waterZoneName,
                      portId: selectedRecord.portId,
                      area: selectedRecord.area,
                      doSauMax: selectedRecord.doSauMax,
                      doSauTrungBinh: selectedRecord.doSauTrungBinh,
                      loaiVungNuoc: selectedRecord.loaiVungNuoc,
                      operationalStatus: selectedRecord.operationalStatus,
                      bieuTuongId: selectedRecord.bieuTuongId,
                      loaiHinhHoc: selectedRecord.loaiHinhHoc || 'POLYGON',
                      gisLocation: {
                        loaiHinhHoc: selectedRecord.loaiHinhHoc || 'POLYGON',
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

      {/* History Modal */}
      <Modal
        title={selectedRecord ? `Lịch sử thay đổi: ${selectedRecord.waterZoneCode} — ${selectedRecord.waterZoneName}` : 'Lịch sử thay đổi'}
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
