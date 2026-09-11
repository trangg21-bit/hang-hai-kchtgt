import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Form } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import {
  ScreenHeader,
  FilterTableLayout,
  CommonTable,
  TableFilter,
  CommonStatusTabs,
  TableColumnType,
  type TableOption,
  type FilterOption,
  type ScreenHeaderAction,
} from '../../components/list-view';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import toast from '../../components/ToastNotification';
import { organizationService, type Organization } from '../../services/organizationService';
import { fetchAllBuoys } from '../../services/buoy/api';
import { fetchBuoyStationList } from '../../services/buoy-station/api';
import type { Buoy } from '../../types/beacon';
import type { BuoyStationResponse } from '../../services/buoy-station/types';
import {
  createKhaiThac,
  createAssetDecrease,
  createAssetIncrease,
  createBuoyAsset,
  deleteBuoyAsset,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchKhaiThacList,
  fetchBuoyAssets,
  updateBuoyAsset,
} from '../../services/assetmovement/api';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  BuoyAsset,
  BuoyAssetFilters,
  BuoyAssetPayload,
} from '../../services/assetmovement/types';
import type { InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import { fontWeightBold } from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import BuoyAssetForm, { type BuoyFormValues } from './BuoyAssetForm';
import BuoyAssetDetailContent from './BuoyAssetDetailContent';
import BuoyAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './BuoyAssetOperationForm';

const STATUS_COUNT_KEYS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED_LEVEL1',
  'APPROVED',
  'REJECTED_LEVEL1',
  'REJECTED_LEVEL2',
];

type DrawerMode = 'create' | 'edit' | 'detail';

const ASSET_CONDITIONS = ['Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được'];

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) => Boolean((cause as { errorFields?: unknown }).errorFields);

export default function BuoyAssetList() {
  const [data, setData] = useState<BuoyAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [buoys, setBuoys] = useState<Buoy[]>([]);
  const [buoyStations, setBuoyStations] = useState<BuoyStationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<BuoyAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<BuoyAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<BuoyAsset>();
  const [deleteTarget, setDeleteTarget] = useState<BuoyAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<BuoyFormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const orgName = useMemo(() => new Map(organizations.map((item) => [item.id, item.name])), [organizations]);
  const buoyMap = useMemo(() => new Map(buoys.map((item) => [item.id, item])), [buoys]);
  const stationMap = useMemo(() => new Map(buoyStations.map((item) => [item.id, item])), [buoyStations]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchBuoyAssets({ ...filters, page: page - 1, size: pageSize });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchBuoyAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) => fetchBuoyAssets({ ...baseFilters, approvalStatus })),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản phao, tiêu và nhà trạm.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void Promise.all([
      organizationService.getAll(),
      fetchAllBuoys(),
      fetchBuoyStationList({}),
    ])
      .then(([orgs, buoyList, stationPage]) => {
        setOrganizations(orgs);
        setBuoys(buoyList || []);
        setBuoyStations(stationPage.content || []);
      })
      .catch(() => toast.error('Không thể tải danh mục đơn vị, phao tiêu hoặc nhà trạm.'));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    form.resetFields();
    form.setFieldsValue({ assetType: 'BUOY', status: 'MANAGED' });
    setAttachments([]);
  }, [form]);

  const openEdit = useCallback((record: BuoyAsset) => {
    setSelected(record);
    setDrawerMode('edit');
    const refId = record.buoyId
      ? `buoy:${record.buoyId}`
      : record.buoyStationId
        ? `station:${record.buoyStationId}`
        : undefined;

    form.setFieldsValue({
      ...record,
      refId,
      constructionYear: record.constructionYear ? dayjs(String(record.constructionYear)) : undefined,
      useDate: record.useDate ? dayjs(record.useDate) : undefined,
      declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
      depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
      depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
      attachmentName: record.attachmentName,
    });
    if (record.attachmentName) {
      setAttachments(record.attachmentName.split(',').map((name, i) => ({
        id: `att-${i}-${Date.now()}`,
        fileName: name.trim(),
        fileSize: 1024 * 512,
        uploadedByName: record.updatedByName || record.submittedByName || currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
        uploadedDate: record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString(),
      })));
    } else {
      setAttachments([]);
    }
  }, [currentUser, form]);

  const handleUploadAttachment = useCallback((file: File) => {
    const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
    const nowIso = dayjs().toISOString();
    const newAtt: InfrastructureAttachmentItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedByName: uploaderName,
      uploadedDate: nowIso,
      originFileObj: file,
    };
    setAttachments((prev) => [...prev, newAtt]);
  }, [currentUser]);

  const handleDeleteAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleDownloadAttachment = useCallback((id: string, fileName: string) => {
    const att = attachments.find((a) => a.id === id);
    if (att?.originFileObj) {
      const url = URL.createObjectURL(att.originFileObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast.info(`Tải tệp: ${fileName}`);
    }
  }, [attachments]);

  const openDetail = useCallback(async (record: BuoyAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exploitRes, incRes, decRes] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id }),
        fetchAssetIncreaseList({ assetId: record.id }),
        fetchAssetDecreaseList({ assetId: record.id }),
      ]);
      setExploitationRows(exploitRes.content || []);
      setIncreaseRows(incRes.content || []);
      setDecreaseRows(decRes.content || []);
    } catch {
      setExploitationRows([]);
      setIncreaseRows([]);
      setDecreaseRows([]);
    }
  }, []);

  const openOperation = useCallback((record: BuoyAsset, mode: OperationMode) => {
    setSelected(record);
    setOperationMode(mode);
    operationForm.resetFields();
    if (mode === 'exploit') {
      operationForm.setFieldsValue({
        operatorOrgUnitId: record.orgUnitId,
      });
    } else {
      operationForm.setFieldsValue({
        adjustmentDate: dayjs(),
        originalValue: 0,
        depreciationRate: record.depreciationRate || 0,
        assignmentDecisionNumber: record.assignmentDecisionNumber,
        depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
        depreciationMonths: record.depreciationMonths,
        depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
        accumulatedDepreciation: record.accumulatedDepreciation || 0,
        disposalMethod: record.disposalMethod,
      });
    }
  }, [operationForm]);

  const closeDrawer = useCallback(() => {
    setDrawerMode(undefined);
    form.resetFields();
  }, [form]);

  const saveAsset = useCallback(async (status: string) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(status);

      let buoyId: string | undefined;
      let buoyStationId: string | undefined;
      if (values.refId) {
        if (values.refId.startsWith('station:')) {
          buoyStationId = values.refId.replace('station:', '');
        } else if (values.refId.startsWith('buoy:')) {
          buoyId = values.refId.replace('buoy:', '');
        } else {
          if (buoyMap.has(values.refId)) buoyId = values.refId;
          else if (stationMap.has(values.refId)) buoyStationId = values.refId;
        }
      }

      const payload: BuoyAssetPayload = {
        ...values,
        buoyId,
        buoyStationId,
        assetCode: selected?.assetCode || values.assetCode || '',
        assetName: values.assetName || '',
        assetType: 'BUOY',
        constructionYear: values.constructionYear ? Number(values.constructionYear.format('YYYY')) : undefined,
        useDate: values.useDate ? values.useDate.format('YYYY-MM-DD') : undefined,
        declarationDate: values.declarationDate ? values.declarationDate.format('YYYY-MM-DD') : undefined,
        depreciationStartDate: values.depreciationStartDate ? values.depreciationStartDate.format('YYYY-MM-DD') : undefined,
        depreciationEndDate: values.depreciationEndDate ? values.depreciationEndDate.format('YYYY-MM-DD') : undefined,
        attachmentName: attachments.map((a) => a.fileName).join(','),
        approvalStatus: status,
      };

      if (drawerMode === 'edit' && selected) {
        await updateBuoyAsset(selected.id, payload);
        toast.success(
          status === 'APPROVED'
            ? 'Phê duyệt tài sản phao, tiêu thành công.'
            : 'Cập nhật tài sản phao, tiêu thành công.',
        );
      } else {
        await createBuoyAsset(payload);
        toast.success(
          status === 'APPROVED'
            ? 'Tạo mới và phê duyệt tài sản phao, tiêu thành công.'
            : status === 'PENDING_APPROVAL'
              ? 'Tạo mới và gửi phê duyệt tài sản phao, tiêu thành công.'
              : 'Lưu tạm tài sản phao, tiêu thành công.',
        );
      }
      closeDrawer();
      void loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu thông tin tài sản phao, tiêu.'));
      }
    } finally {
      setSaving(false);
    }
  }, [attachments, closeDrawer, drawerMode, form, loadData, selected, buoyMap, stationMap]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteBuoyAsset(deleteTarget.id);
      toast.success('Xóa tài sản phao, tiêu thành công.');
      setDeleteTarget(undefined);
      void loadData();
    } catch (cause: unknown) {
      toast.error(getErrorMessage(cause, 'Không thể xóa tài sản phao, tiêu.'));
    }
  }, [deleteTarget, loadData]);

  const submitOperation = useCallback(async () => {
    if (!selected || !operationMode) return;
    try {
      const values = await operationForm.validateFields();
      setSaving(true);
      if (operationMode === 'exploit') {
        await createKhaiThac({
          assetId: selected.id,
          assetName: selected.assetName,
          exploitationYear: dayjs().year(),
          doanhThu: values.totalRevenue || 0,
          depreciation: 0,
          description: values.notes || '',
          operatorOrgUnitId: values.operatorOrgUnitId,
          unitOfMeasure: values.unitOfMeasure,
          quantity: values.quantity,
          exploitationDeadline: values.exploitationDeadline?.format('YYYY-MM-DD'),
          totalRevenue: values.totalRevenue,
          relatedCosts: values.relatedCosts,
          stateBudgetPayment: values.stateBudgetPayment,
          projectAmount: values.projectAmount,
        });
        toast.success('Thêm mới bản ghi khai thác tài sản thành công.');
      } else if (operationMode === 'increase') {
        const diff = Number(values.originalValue) || 0;
        await createAssetIncrease({
          assetId: selected.id,
          assetName: selected.assetName,
          tangValue: diff,
          lyDo: values.adjustmentReason || '',
          notes: values.notes,
          decisionNumber: values.decisionNumber,
          decisionDate: values.decisionDate?.format('YYYY-MM-DD'),
          adjustmentDate: values.adjustmentDate?.format('YYYY-MM-DD'),
          originalValueBefore: selected.originalValue || 0,
          originalValueAfter: (selected.originalValue || 0) + diff,
          remainingValueBefore: selected.remainingValue || 0,
          remainingValueAfter: (selected.remainingValue || 0) + diff,
          declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
          depreciationRate: values.depreciationRate,
          valueUnit: 'VNĐ',
          assignmentDecisionNumber: values.assignmentDecisionNumber,
          depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
          depreciationMonths: values.depreciationMonths,
          depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
          adjustmentAccumulatedDepreciation: values.accumulatedDepreciation,
          disposalMethod: values.disposalMethod,
        });
        toast.success('Yêu cầu tăng nguyên giá tài sản đã được tạo.');
      } else {
        const diff = Number(values.originalValue) || 0;
        await createAssetDecrease({
          assetId: selected.id,
          assetName: selected.assetName,
          giamValue: diff,
          lyDo: values.adjustmentReason || '',
          notes: values.notes,
          decisionNumber: values.decisionNumber,
          decisionDate: values.decisionDate?.format('YYYY-MM-DD'),
          adjustmentDate: values.adjustmentDate?.format('YYYY-MM-DD'),
          originalValueBefore: selected.originalValue || 0,
          originalValueAfter: Math.max(0, (selected.originalValue || 0) - diff),
          remainingValueBefore: selected.remainingValue || 0,
          remainingValueAfter: Math.max(0, (selected.remainingValue || 0) - diff),
          declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
          depreciationRate: values.depreciationRate,
          valueUnit: 'VNĐ',
          assignmentDecisionNumber: values.assignmentDecisionNumber,
          depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
          depreciationMonths: values.depreciationMonths,
          depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
          adjustmentAccumulatedDepreciation: values.accumulatedDepreciation,
          disposalMethod: values.disposalMethod,
        });
        toast.success('Yêu cầu giảm nguyên giá tài sản đã được tạo.');
      }
      setOperationMode(undefined);
      void loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu bản ghi biến động tài sản.'));
      }
    } finally {
      setSaving(false);
    }
  }, [loadData, operationForm, operationMode, selected]);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    const range = draftFilters.updatedRange;
    let buoyId: string | undefined;
    let buoyStationId: string | undefined;
    if (draftFilters.refId) {
      if (draftFilters.refId.startsWith('station:')) {
        buoyStationId = draftFilters.refId.replace('station:', '');
      } else if (draftFilters.refId.startsWith('buoy:')) {
        buoyId = draftFilters.refId.replace('buoy:', '');
      } else {
        buoyId = draftFilters.refId;
      }
    }

    setFilters({
      ...draftFilters,
      buoyId,
      buoyStationId,
      updatedFrom: range?.[0]?.format('YYYY-MM-DD'),
      updatedTo: range?.[1]?.format('YYYY-MM-DD'),
    });
  }, [draftFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({});
    setFilters({});
    setPage(1);
  }, []);

  const filterOptions = useMemo<FilterOption[]>(() => {
    const stationOpts = (buoyStations || []).map((s) => ({
      value: `station:${s.id}`,
      label: `[Nhà trạm] ${s.code} - ${s.name}`,
    }));
    const buoyOpts = (buoys || []).map((b) => ({
      value: `buoy:${b.id}`,
      label: `[Phao tiêu] ${b.code} - ${b.name}`,
    }));

    return [
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        type: 'treeSelect',
        organizations,
      },
      {
        key: 'usingOrgUnitId',
        label: 'Đơn vị sử dụng',
        type: 'treeSelect',
        organizations,
      },
      {
        key: 'refId',
        label: 'Mã nhà trạm, phao tiêu',
        type: 'select',
        placeholder: 'Chọn nhà trạm / phao tiêu',
        options: [
          ...stationOpts,
          ...buoyOpts,
        ],
      },
      {
        key: 'assetCode',
        label: 'Mã tài sản',
        type: 'text',
        placeholder: 'Tìm theo mã tài sản',
      },
      {
        key: 'assetName',
        label: 'Tên tài sản',
        type: 'text',
        placeholder: 'Tìm theo tên tài sản',
      },
      {
        key: 'assetCondition',
        label: 'Tình trạng tài sản',
        type: 'select',
        placeholder: 'Chọn tình trạng',
        options: ASSET_CONDITIONS.map((val) => ({ value: val, label: val })),
      },
      {
        key: 'updatedRange',
        label: 'Ngày cập nhật',
        type: 'dateRange',
      },
    ];
  }, [organizations, buoyStations, buoys]);

  const tableOptions = useMemo<TableOption<BuoyAsset>>(() => ({
    dataKey: 'id',
    mainColumns: [
      {
        title: 'TÊN/MÃ TÀI SẢN',
        dataIndex: 'assetName',
        type: TableColumnType.TwoLine,
        subField: 'assetCode',
        width: 250,
        fixed: 'left',
        onClick: (record) => void openDetail(record),
      },
      {
        title: 'ĐƠN VỊ QUẢN LÝ',
        dataIndex: 'orgUnitId',
        type: TableColumnType.Text,
        width: 250,
        bold: true,
        render: (v) => <span style={{ fontWeight: fontWeightBold }}>{orgName.get(v as string) || '—'}</span>,
      },
      {
        title: 'ĐƠN VỊ SỬ DỤNG',
        dataIndex: 'usingOrgUnitId',
        type: TableColumnType.Text,
        width: 250,
        render: (v) => orgName.get(v as string) || '—',
      },
      {
        title: 'MÃ NHÀ TRẠM, PHAO TIÊU',
        dataIndex: 'refCode',
        type: TableColumnType.Text,
        width: 210,
        render: (_v, r) => {
          if (r.buoyId && buoyMap.has(r.buoyId)) {
            return `[PT] ${buoyMap.get(r.buoyId)?.code || ''}`;
          }
          if (r.buoyStationId && stationMap.has(r.buoyStationId)) {
            return `[NT] ${stationMap.get(r.buoyStationId)?.code || ''}`;
          }
          return '—';
        },
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 200,
        render: () => 'Tài sản phao, tiêu và nhà trạm QLVH',
      },
      {
        title: 'TÌNH TRẠNG TÀI SẢN',
        dataIndex: 'assetCondition',
        type: TableColumnType.Status,
        width: 190,
        statusMapping: {
          'Tốt': { label: 'Tốt', color: themeTokenChk.statusOperational },
          'Hư hỏng cần sửa chữa': { label: 'Hư hỏng cần sửa chữa', color: themeTokenChk.statusAttention },
          'Không sử dụng được': { label: 'Không sử dụng được', color: themeTokenChk.statusCritical },
        },
      },
      {
        title: 'HIỆN TRẠNG SỬ DỤNG',
        dataIndex: 'usageStatus',
        type: TableColumnType.Status,
        width: 190,
        statusMapping: {
          'Đang sử dụng': { label: 'Đang sử dụng', color: themeTokenChk.statusOperational },
          'Đang bảo trì/sửa chữa': { label: 'Đang bảo trì/sửa chữa', color: themeTokenChk.statusAttention },
          'Tạm dừng sử dụng': { label: 'Tạm dừng sử dụng', color: themeTokenChk.statusCritical },
          'Chưa sử dụng': { label: 'Chưa sử dụng', color: themeTokenChk.statusDraft },
        },
      },
      {
        title: 'NHÓM TÀI SẢN',
        dataIndex: 'assetGroup',
        type: TableColumnType.Text,
        width: 210,
      },
      {
        title: 'NGÀY SỬ DỤNG TÀI SẢN',
        dataIndex: 'useDate',
        type: TableColumnType.Date,
        width: 190,
      },
      {
        title: 'TRẠNG THÁI',
        dataIndex: 'approvalStatus',
        type: TableColumnType.Status,
        width: 260,
      },
      {
        title: 'CÁN BỘ CẬP NHẬT',
        dataIndex: 'updatedByName',
        type: TableColumnType.TwoLine,
        subField: 'updatedAt',
        width: 210,
      },
      {
        title: 'CÁN BỘ GỬI PHÊ DUYỆT',
        dataIndex: 'submittedByName',
        type: TableColumnType.TwoLine,
        subField: 'submittedAt',
        width: 240,
      },
      {
        title: 'CÁN BỘ PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovedByName',
        type: TableColumnType.TwoLine,
        subField: 'portAuthorityApprovedAt',
        width: 320,
      },
      {
        title: 'CÁN BỘ PHÊ DUYỆT CẤP CỤC',
        dataIndex: 'departmentApprovedByName',
        type: TableColumnType.TwoLine,
        subField: 'departmentApprovedAt',
        width: 240,
      },
    ],
    actions: [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />,
        onClick: (record) => void openDetail(record),
      },
      {
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: <EditOutlined />,
        onClick: (record) => openEdit(record),
      },
      {
        key: 'exploit',
        label: 'Khai thác tài sản',
        icon: <RocketOutlined />,
        onClick: (record) => openOperation(record, 'exploit'),
      },
      {
        key: 'increase',
        label: 'Tăng nguyên giá',
        icon: <PlusCircleOutlined />,
        onClick: (record) => openOperation(record, 'increase'),
      },
      {
        key: 'decrease',
        label: 'Giảm nguyên giá',
        icon: <MinusCircleOutlined />,
        onClick: (record) => openOperation(record, 'decrease'),
      },
      {
        key: 'delete',
        label: 'Xóa',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: (record) => setDeleteTarget(record),
      },
    ],
  }), [buoyMap, stationMap, openDetail, openEdit, openOperation, orgName]);

  const headerActions = useMemo<ScreenHeaderAction[]>(() => [
    {
      key: 'create',
      label: 'Thêm mới',
      icon: <PlusOutlined />,
      variant: 'primary',
      onClick: openCreate,
    },
  ], [openCreate]);

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản phao, tiêu và nhà trạm quản lý vận hành phao, tiêu' },
          ]}
          actions={headerActions}
        />

        <FilterTableLayout
          hideFilterToggle={true}
          statusTabsNode={
            <CommonStatusTabs
              activeKey={filters.approvalStatus || 'all'}
              counts={statusCounts}
              onChange={(_key, status) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, approvalStatus: status }));
              }}
            />
          }
          loading={loading}
          error={Boolean(error)}
          errorMessage={error}
          onRetry={() => void loadData()}
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          filterContent={
            <TableFilter
              mode="fieldsOnly"
              filters={filterOptions}
              values={draftFilters}
              onChange={setDraftFilters}
            />
          }
        >
          <CommonTable<BuoyAsset>
            options={tableOptions}
            dataSource={data}
            loading={loading}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            }}
          />
        </FilterTableLayout>

        <BuoyAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          buoys={buoys}
          buoyStations={buoyStations}
          attachments={attachments}
          saving={saving}
          saveAction={saveAction}
          onClose={closeDrawer}
          onSave={saveAsset}
          onUploadAttachment={handleUploadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onDownloadAttachment={handleDownloadAttachment}
          currentUser={currentUser}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
          onOpenOperation={(mode) => selected && openOperation(selected, mode)}
        />

        <BuoyAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          buoyMap={buoyMap}
          stationMap={stationMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        <BuoyAssetOperationForm
          open={Boolean(operationMode)}
          operationMode={operationMode}
          selected={selected}
          organizations={organizations}
          form={operationForm}
          saving={saving}
          onClose={() => setOperationMode(undefined)}
          onSubmit={submitOperation}
        />

        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          title="Xác nhận xóa tài sản phao, tiêu"
          content={`Bạn có chắc chắn muốn xóa tài sản "${deleteTarget?.assetName || deleteTarget?.assetCode}" không? Hành động này không thể hoàn tác.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(undefined)}
        />
      </div>
    </ThemeTokenProvider>
  );
}
