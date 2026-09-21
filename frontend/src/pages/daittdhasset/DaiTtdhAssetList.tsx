import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    HistoryOutlined,
    MinusCircleOutlined,
    PlusCircleOutlined,
    PlusOutlined,
    RocketOutlined,
} from '@ant-design/icons';
import { Form } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    CommonStatusTabs,
    CommonTable,
    FilterTableLayout,
    ScreenHeader,
    TableColumnType,
    TableFilter,
    type FilterOption,
    type ScreenHeaderAction,
    type TableActionOption,
    type TableOption,
} from '../../components/list-view';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import { useAssetPermissions } from '../../hooks/useAssetPermissions';
import {
    resolveMimeType,
    triggerBlobDownload,
    type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import toast from '../../components/ToastNotification';
import { MARITIME_ASSET_TYPE_OPTIONS } from '../../constants/assetType';
import { ASSET_CONDITION_OPTIONS } from '../../constants/assetDropdown';
import { ThemeTokenProvider, type ThemeToken } from '../../context/ThemeTokenContext';
import api from '../../services/api';
import { organizationService, type Organization } from '../../services/organizationService';
import {
    createDaiTtdhAdjustment,
    createDaiTtdhAsset,
    createDaiTtdhExploitation,
    deleteDaiTtdhAsset,
    downloadDaiTtdhAssetAttachment,
    fetchDaiTtdhAdjustments,
    fetchDaiTtdhAssetAttachments,
    fetchDaiTtdhAssets,
    fetchDaiTtdhExploitations,
    fetchDaiTtdhOptions,
    updateDaiTtdhAsset,
    uploadDaiTtdhAssetAttachments,
} from '../../services/daiTtdhAsset/api';
import type {
    DaiTtdhAsset,
    DaiTtdhAssetAdjustment,
    DaiTtdhAssetExploitation,
    DaiTtdhAssetFilters,
    DaiTtdhAssetPayload,
    PageResponse,
} from '../../services/daiTtdhAsset/types';
import {
  calculateAssetAdjustmentValues,
  validateAdjustmentOriginalValue,
} from '../../utils/assetValueCalculation';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import { isAssetRecordEditable, normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import DaiTtdhAssetDetailContent from './DaiTtdhAssetDetailContent';
import DaiTtdhAssetForm, { type FormValues } from './DaiTtdhAssetForm';
import DaiTtdhAssetHistory, { useDaiTtdhHistory } from './DaiTtdhAssetHistory';
import DaiTtdhAssetOperationForm, {
    type OperationMode,
    type OperationValues,
} from './DaiTtdhAssetOperationForm';

const STATUS_COUNT_KEYS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED_LEVEL1',
  'APPROVED',
  'REJECTED_LEVEL1',
  'REJECTED_LEVEL2',
  'ARCHIVED',
];

type DrawerMode = 'create' | 'edit' | 'detail';

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) => Boolean((cause as { errorFields?: unknown }).errorFields);

export default function DaiTtdhAssetList() {
  const perms = useAssetPermissions(['daittdh', 'daittdhasset', 'coastalstation']);
  const [data, setData] = useState<DaiTtdhAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [daiTtdhs, setDaiTtdhs] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<DaiTtdhAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<DaiTtdhAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<DaiTtdhAsset>();
  const [deleteTarget, setDeleteTarget] = useState<DaiTtdhAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<DaiTtdhAssetExploitation[]>([]);
  const [adjustmentRows, setAdjustmentRows] = useState<DaiTtdhAssetAdjustment[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();

  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const authUser = useAuthStore((s) => s.user);
  const orgName = useMemo(() => new Map(organizations.map((org) => [org.id, org.name])), [organizations]);
  const daiTtdhMap = useMemo(
    () => new Map(daiTtdhs.map((item) => [item.id, { code: item.code, name: item.name }])),
    [daiTtdhs]
  );


  const {
    historyOpen, historyTarget, historyRecords, historyLoading,
    historyFilters, filteredHistory, hasActiveHistoryFilter,
    openHistory, setHistoryOpen, setHistoryFilters,
  } = useDaiTtdhHistory({ orgName, daiTtdhMap });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchDaiTtdhAssets({
        ...filters,
        page: page - 1,
        size: pageSize,
      });
      setData(res.content || []);
      setTotal(res.totalElements || 0);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const emptyPage: PageResponse<DaiTtdhAsset> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 1,
        number: 0,
      };
      const [all, ...statusPages] = await Promise.all([
        fetchDaiTtdhAssets(baseFilters).catch(() => emptyPage),
        ...STATUS_COUNT_KEYS.map((approvalStatus) =>
          fetchDaiTtdhAssets({ ...baseFilters, approvalStatus }).catch(() => emptyPage)
        ),
      ]);
      const nextCounts: Record<string, number> = {
        all: all?.totalElements || 0,
        ...Object.fromEntries(
          STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index]?.totalElements || 0])
        ),
      };
      const rejectedTotal = (nextCounts.REJECTED_LEVEL1 || 0) + (nextCounts.REJECTED_LEVEL2 || 0);
      nextCounts.REJECTED_LEVEL1 = rejectedTotal;
      delete nextCounts.REJECTED_LEVEL2;
      setStatusCounts(nextCounts);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản đài TTDH.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu khi bộ lọc/trang thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void organizationService.getAll().then(setOrganizations).catch(() => setOrganizations([]));
    void fetchDaiTtdhOptions().then(setDaiTtdhs).catch(() => setDaiTtdhs([]));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setAttachments([]);
    form.resetFields();
    setDrawerMode('create');
  }, [form]);

  const openEdit = useCallback(
    (record: DaiTtdhAsset) => {
      if (!isAssetRecordEditable(record.approvalStatus)) {
        toast.warning('Hồ sơ đang ở trạng thái không được phép chỉnh sửa.');
        return;
      }
      setSelected(record);
      setDrawerMode('edit');
      fetchDaiTtdhAssetAttachments(record.id)
        .then((realAtts) => {
          if (realAtts && realAtts.length > 0) {
            setAttachments(
              realAtts.map((att) => ({
                id: att.id,
                fileName: att.fileName,
                fileSize: att.fileSize,
                fileType: att.contentType,
                uploadedByName:
                  att.uploadedByName || record.updatedByName || authUser?.fullName || 'Cán bộ quản lý',
                uploadedDate:
                  att.uploadedAt ||
                  (record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString()),
                filePath: `/v1/dai-ttdh/${record.id}/attachments/${att.id}/download`,
              }))
            );
          } else if (record.attachmentName) {
            setAttachments(
              record.attachmentName.split(',').map((name, i) => ({
                id: `att-${i}`,
                fileName: name.trim(),
                fileSize: 1024 * 1024,
                uploadedByName: record.updatedByName || authUser?.fullName || 'Cán bộ',
                uploadedDate: record.updatedAt || dayjs().toISOString(),
              }))
            );
          } else {
            setAttachments([]);
          }
        })
        .catch(() => {
          if (record.attachmentName) {
            setAttachments(
              record.attachmentName.split(',').map((name, i) => ({
                id: `att-${i}`,
                fileName: name.trim(),
                fileSize: 1024 * 1024,
                uploadedByName: record.updatedByName || authUser?.fullName || 'Cán bộ',
                uploadedDate: record.updatedAt || dayjs().toISOString(),
              }))
            );
          } else {
            setAttachments([]);
          }
        });
      form.resetFields();
      form.setFieldsValue({
        ...record,
        constructionYear: record.constructionYear ? dayjs(String(record.constructionYear), 'YYYY') : undefined,
        useDate: record.useDate ? dayjs(record.useDate) : undefined,
        declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
        depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
        depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
      });
    },
    [form, authUser]
  );

  const handleUploadAttachment = useCallback(
    (file: File) => {
      const newItem: InfrastructureAttachmentItem = {
        id: `att-new-${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        originFileObj: file,
        uploadedByName: authUser?.fullName || 'Cán bộ quản lý',
        uploadedDate: dayjs().toISOString(),
      };
      setAttachments((prev) => [...prev, newItem]);
      toast.success(`Đã thêm tệp đính kèm: ${file.name}`);
    },
    [authUser]
  );

  const handleDeleteAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    toast.success('Đã xóa tệp đính kèm');
  }, []);

  const handleDownloadAttachment = useCallback(
    async (id: string, fileName: string) => {
      const att = attachments.find((a) => a.id === id);
      if (att?.originFileObj) {
        triggerBlobDownload(att.originFileObj, fileName || att.originFileObj.name);
        toast.success(`Đã tải xuống tệp: ${fileName}`);
        return;
      }
      if (att?.filePath) {
        try {
          let cleanPath = att.filePath;
          if (cleanPath.startsWith('/api/')) {
            cleanPath = cleanPath.replace(/^\/api/, '');
          } else if (!cleanPath.startsWith('/')) {
            cleanPath = `/${cleanPath}`;
          }
          const res = await api.get(cleanPath, { responseType: 'blob' });
          const serverContentType = res.headers?.['content-type'] ? String(res.headers['content-type']) : '';
          const contentType = resolveMimeType(fileName, serverContentType);
          const blob = new Blob([res.data], { type: contentType });
          triggerBlobDownload(blob, fileName || 'tai-lieu');
          toast.success(`Đã tải xuống tệp: ${fileName}`);
          return;
        } catch (err) {
          console.error('Download error:', err);
        }
      }
      if (selected?.id && id && id.includes('-') && !id.startsWith('att-')) {
        try {
          await downloadDaiTtdhAssetAttachment(selected.id, id, fileName);
          toast.success(`Đã tải xuống tệp: ${fileName}`);
          return;
        } catch (err) {
          console.error('Download server error:', err);
        }
      }
      // Fallback
      const fallbackBlob = new Blob(
        [`Tài liệu đính kèm đài TTDH: ${fileName}\nThời gian: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`],
        { type: resolveMimeType(fileName, 'text/plain;charset=utf-8') }
      );
      triggerBlobDownload(fallbackBlob, fileName);
      toast.success(`Đã tải xuống tệp: ${fileName}`);
    },
    [attachments, selected]
  );

  const openDetail = useCallback(async (record: DaiTtdhAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exploitations, adjustments] = await Promise.all([
        fetchDaiTtdhExploitations(record.id).catch(() => []),
        fetchDaiTtdhAdjustments(record.id).catch(() => []),
      ]);
      setExploitationRows(exploitations);
      setAdjustmentRows(adjustments);
    } catch {
      setExploitationRows([]);
      setAdjustmentRows([]);
    }
  }, []);

  const saveAsset = useCallback(
    async (status: string) => {
      try {
        setSaving(true);
        setSaveAction(status);
        const values = await form.validateFields();
        const payload: DaiTtdhAssetPayload = {
          ...values,
          assetType: values.assetType || 'Hệ thống thông tin giao thông, thông tin liên lạc và hệ thống điện, nước trong khu vực bến cảng',
          constructionYear: values.constructionYear ? values.constructionYear.year() : undefined,
          useDate: values.useDate ? values.useDate.format('YYYY-MM-DD') : undefined,
          declarationDate: values.declarationDate ? values.declarationDate.format('YYYY-MM-DD') : undefined,
          depreciationStartDate: values.depreciationStartDate
            ? values.depreciationStartDate.format('YYYY-MM-DD')
            : undefined,
          depreciationEndDate: values.depreciationEndDate
            ? values.depreciationEndDate.format('YYYY-MM-DD')
            : undefined,
          attachmentName: attachments.map((a) => a.fileName).join(','),
          approvalStatus: status,
        };

        let savedAsset: DaiTtdhAsset;
        if (drawerMode === 'edit' && selected) {
          savedAsset = await updateDaiTtdhAsset(selected.id, payload);
          toast.success('Cập nhật tài sản đài TTDH thành công.');
        } else {
          savedAsset = await createDaiTtdhAsset(payload);
          toast.success('Thêm mới tài sản đài TTDH thành công.');
        }

        const targetAssetId = savedAsset?.id || selected?.id;
        const filesToUpload = attachments
          .map((a) => a.originFileObj)
          .filter((f): f is File => Boolean(f));
        if (targetAssetId && filesToUpload.length > 0) {
          try {
            await uploadDaiTtdhAssetAttachments(targetAssetId, filesToUpload);
          } catch (attErr) {
            console.error('Upload attachments error:', attErr);
          }
        }

        setDrawerMode(undefined);
        form.resetFields();
        await loadData();
      } catch (cause: unknown) {
        if (!isValidationError(cause)) {
          toast.error(getErrorMessage(cause, 'Không thể lưu thông tin tài sản đài TTDH.'));
        }
      } finally {
        setSaving(false);
      }
    },
    [form, drawerMode, selected, attachments, loadData]
  );

  const openOperation = useCallback(
    (record: DaiTtdhAsset, mode: OperationMode) => {
      setSelected(record);
      setOperationMode(mode);
      operationForm.resetFields();
      if (mode === 'exploit') {
        operationForm.setFieldsValue({
          assetCategory: [record.assetCode, record.assetName].filter(Boolean).join(' - '),  
          unitOfMeasure: record.quantityUnit || 'Bộ',
          quantity: record.quantity || 1,
          totalRevenue: 0,
          relatedCosts: 0,
          stateBudgetPayment: 0,
          projectAmount: 0,
        });
      } else {
        const original = record.originalValue || 0;
        const remaining = record.remainingValue || 0;
        operationForm.setFieldsValue({
          originalValueBefore: original,
          originalValue: original,
          remainingValueBefore: remaining,
          remainingValue: remaining,
          depreciationRate: record.depreciationRate || 0,
          depreciationMonths: record.depreciationMonths || 0,
          accumulatedDepreciation: record.accumulatedDepreciation || 0,
        });
      }
    },
    [operationForm]
  );

  const saveOperation = useCallback(async (targetAction?: any) => {
    if (!selected || !operationMode) return;
    try {
      setSaving(true);
      if (typeof targetAction === 'string') {
        setSaveAction(targetAction);
      }
      const values = await operationForm.validateFields();
      if (operationMode === 'exploit') {
        await createDaiTtdhExploitation(selected.id, {
          ...values,
          assetCategory: [selected.assetCode, selected.assetName].filter(Boolean).join(' - '),
          exploitationDeadline: values.exploitationDeadline
            ? values.exploitationDeadline.format('YYYY-MM-DD')
            : undefined,
        });
        toast.success('Thêm thông tin khai thác tài sản đài TTDH thành công.');
      } else {
        const origVal = values.originalValue;
        const valCheck = validateAdjustmentOriginalValue(
          operationMode,
          origVal,
          selected.originalValue
        );
        if (!valCheck.isValid) {
          toast.error(valCheck.message || 'Nguyên giá sau điều chỉnh không hợp lệ.');
          return;
        }
        const calc = calculateAssetAdjustmentValues({
          originalValueAfter: origVal,
          depreciationRate: values.depreciationRate,
          depreciationStartDate: values.depreciationStartDate,
          depreciationEndDate: values.depreciationEndDate,
          accumulatedDepreciationManual: values.accumulatedDepreciation,
          depreciationMonths: values.depreciationMonths,
        });
        await createDaiTtdhAdjustment(selected.id, {
          ...values,
          originalValueBefore: selected.originalValue,
          originalValueAfter: origVal,
          remainingValueBefore: selected.remainingValue,
          remainingValueAfter: calc.remainingValueAfter,
          accumulatedDepreciation:
            calc.accumulatedDepreciation ?? values.accumulatedDepreciation,
          monthlyDepreciation: calc.monthlyDepreciation,
          adjustmentType: operationMode === 'increase' ? 'INCREASE' : 'DECREASE',
          decisionDate: values.decisionDate ? values.decisionDate.format('YYYY-MM-DD') : undefined,
          adjustmentDate: values.adjustmentDate ? values.adjustmentDate.format('YYYY-MM-DD') : undefined,
          declarationDate: values.declarationDate ? values.declarationDate.format('YYYY-MM-DD') : undefined,
          depreciationStartDate: values.depreciationStartDate
            ? values.depreciationStartDate.format('YYYY-MM-DD')
            : undefined,
          depreciationEndDate: values.depreciationEndDate
            ? values.depreciationEndDate.format('YYYY-MM-DD')
            : undefined,
        });
        toast.success(
          operationMode === 'increase'
            ? 'Thêm điều chỉnh tăng nguyên giá thành công.'
            : 'Thêm điều chỉnh giảm nguyên giá thành công.'
        );
      }
      setOperationMode(undefined);
      operationForm.resetFields();
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu thông tin nghiệp vụ tài sản.'));
      }
    } finally {
      setSaving(false);
    }
  }, [selected, operationMode, operationForm, loadData]);

  const handleFilterApply = useCallback(() => {
    const nextFilters: DaiTtdhAssetFilters = { ...draftFilters };
    if (draftFilters.updatedRange && draftFilters.updatedRange[0] && draftFilters.updatedRange[1]) {
      nextFilters.updatedFrom = draftFilters.updatedRange[0].format('YYYY-MM-DD');
      nextFilters.updatedTo = draftFilters.updatedRange[1].format('YYYY-MM-DD');
    } else {
      delete nextFilters.updatedFrom;
      delete nextFilters.updatedTo;
    }
    delete (nextFilters as { updatedRange?: unknown }).updatedRange;
    setPage(1);
    setFilters(nextFilters);
  }, [draftFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({});
    setPage(1);
    setFilters({});
  }, []);

  const filterOptions = useMemo<FilterOption[]>(
    () => [
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        type: 'treeSelect',
        organizations,
        placeholder: 'Chọn đơn vị quản lý',
      },
      {
        key: 'assetName',
        label: 'Tên hoặc mã tài sản',
        type: 'text',
        placeholder: 'Tìm kiếm theo tên / mã tài sản',
      },
      {
        key: 'assetType',
        label: 'Loại tài sản',
        type: 'select',
        placeholder: 'Chọn loại tài sản',
        options: MARITIME_ASSET_TYPE_OPTIONS,
      },
      {
        key: 'assetCondition',
        label: 'Tình trạng tài sản',
        type: 'select',
        options: ASSET_CONDITION_OPTIONS,
        placeholder: 'Chọn tình trạng',
      },
      {
        key: 'usingOrgUnitId',
        label: 'Đơn vị sử dụng',
        type: 'treeSelect',
        organizations,
        placeholder: 'Chọn đơn vị sử dụng',
        isAdvanced: true,
      },
      {
        key: 'stationId',
        label: 'Đài TTDH',
        type: 'select',
        options: daiTtdhs.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` })),
        placeholder: 'Chọn đài TTDH',
        showSearch: true,
        isAdvanced: true,
      },
      {
        key: 'updatedRange',
        label: 'Khoảng ngày cập nhật',
        type: 'dateRange',
        format: 'DD/MM/YYYY',
        isAdvanced: true,
      },
    ],
    [organizations, daiTtdhs]
  );

  const tableOptions = useMemo<TableOption<DaiTtdhAsset>>(
    () => ({
      dataKey: 'id',
      mainColumns: [
        {
          title: 'TÊN/MÃ TÀI SẢN',
          dataIndex: 'assetName',
          type: TableColumnType.TwoLine,
          subField: 'assetCode',
          width: 260,
          fixed: 'left',
          allowSort: true,
          onClick: (record) => void openDetail(record),
        },
        {
          title: 'ĐƠN VỊ QUẢN LÝ',
          dataIndex: 'orgUnitId',
          type: TableColumnType.Text,
          width: 250,
          bold: true,
          allowSort: true,
          valueRef: (r) => orgName.get(r.orgUnitId),
        },
        {
          title: 'ĐƠN VỊ SỬ DỤNG',
          dataIndex: 'usingOrgUnitId',
          type: TableColumnType.Text,
          width: 250,
          allowSort: true,
          valueRef: (r) =>
            r.usingOrgUnitId ? orgName.get(r.usingOrgUnitId) : undefined,
        },
        {
          title: 'ĐÀI TTDH TRỰC THUỘC',
          dataIndex: 'stationId',
          type: TableColumnType.Text,
          width: 240,
          allowSort: true,
          valueRef: (r) => {
            const sid = r.stationId || r.daiTtdhId;
            const station = sid ? daiTtdhMap.get(sid) : undefined;
            if (station) return `${station.code} - ${station.name}`;
            return r.stationName || r.stationCode || '—';
          },
        },
        {
          title: 'LOẠI TÀI SẢN',
          dataIndex: 'assetType',
          type: TableColumnType.Text,
          width: 180,
          allowSort: true,
          render: (v) => (v ? String(v) : '—'),
        },
        {
          title: 'TÌNH TRẠNG TÀI SẢN',
          dataIndex: 'assetCondition',
          type: TableColumnType.Status,
          width: 190,
          allowSort: true,
        },
        {
          title: 'HIỆN TRẠNG SỬ DỤNG',
          dataIndex: 'usageStatus',
          type: TableColumnType.Status,
          width: 190,
          allowSort: true,
        },
        {
          title: 'NHÓM TÀI SẢN',
          dataIndex: 'assetGroup',
          type: TableColumnType.Text,
          width: 210,
          allowSort: true,
        },
        {
          title: 'NGÀY SỬ DỤNG TÀI SẢN',
          dataIndex: 'useDate',
          type: TableColumnType.Date,
          width: 190,
          allowSort: true,
        },
        {
          title: 'TRẠNG THÁI',
          dataIndex: 'approvalStatus',
          type: TableColumnType.Status,
          width: 260,
          allowSort: true,
        },
        {
          title: 'CÁN BỘ CẬP NHẬT',
          dataIndex: 'updatedByName',
          type: TableColumnType.TwoLine,
          subField: 'updatedAt',
          width: 210,
          allowSort: true,
          sortField: 'updatedBy',
        },
        {
          title: 'CÁN BỘ GỬI PHÊ DUYỆT',
          dataIndex: 'submittedByName',
          type: TableColumnType.TwoLine,
          subField: 'submittedAt',
          width: 240,
          allowSort: true,
          sortField: 'submittedBy',
        },
        {
          title: 'CÁN BỘ PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC',
          dataIndex: 'portAuthorityApprovedByName',
          type: TableColumnType.TwoLine,
          subField: 'portAuthorityApprovedAt',
          width: 340,
          allowSort: true,
          sortField: 'portAuthorityApprovedBy',
        },
        {
          title: 'NỘI DUNG PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC',
          dataIndex: 'portAuthorityApprovalContent',
          type: TableColumnType.Text,
          width: 280,
          allowSort: true,
        },
        {
          title: 'CÁN BỘ PHÊ DUYỆT CẤP CỤC',
          dataIndex: 'departmentApprovedByName',
          type: TableColumnType.TwoLine,
          subField: 'departmentApprovedAt',
          width: 260,
          allowSort: true,
          sortField: 'departmentApprovedBy',
        },
        {
          title: 'NỘI DUNG PHÊ DUYỆT CẤP CỤC',
          dataIndex: 'departmentApprovalContent',
          type: TableColumnType.Text,
          width: 260,
          allowSort: true,
        },
      ],
      actions: (record: DaiTtdhAsset) => {
        const isArchived =
          normalizeApprovalStatus(record.approvalStatus) === 'ARCHIVED' ||
          Boolean((record as { deletedAt?: string | null }).deletedAt);

        if (isArchived) {
          const arcActions: TableActionOption<DaiTtdhAsset>[] = [];
          if (perms.canRead) {
            arcActions.push({
              key: 'detail',
              label: 'Xem chi tiết',
              icon: <EyeOutlined />,
              onClick: () => void openDetail(record),
            });
          }
          if (perms.canHistory) {
            arcActions.push({
              key: 'history',
              label: 'Lịch sử',
              icon: <HistoryOutlined />,
              onClick: () => void openHistory(record),
            });
          }
          return arcActions;
        }

        const rowActions: TableActionOption<DaiTtdhAsset>[] = [];
        if (perms.canRead) {
          rowActions.push({
            key: 'detail',
            label: 'Xem chi tiết',
            icon: <EyeOutlined />,
            onClick: () => void openDetail(record),
          });
        }
        if (perms.canUpdate && isAssetRecordEditable(record.approvalStatus)) {
          rowActions.push({
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <EditOutlined />,
            onClick: () => openEdit(record),
          });
        }
        if (perms.canHistory) {
          rowActions.push({
            key: 'history',
            label: 'Lịch sử',
            icon: <HistoryOutlined />,
            onClick: () => void openHistory(record),
          });
        }
        if (perms.canExploit) {
          rowActions.push({
            key: 'exploit',
            label: 'Khai thác tài sản',
            icon: <RocketOutlined />,
            onClick: () => openOperation(record, 'exploit'),
          });
        }
        if (perms.canIncrease) {
          rowActions.push({
            key: 'increase',
            label: 'Tăng nguyên giá',
            icon: <PlusCircleOutlined />,
            onClick: () => openOperation(record, 'increase'),
          });
        }
        if (perms.canDecrease) {
          rowActions.push({
            key: 'decrease',
            label: 'Giảm nguyên giá',
            icon: <MinusCircleOutlined />,
            onClick: () => openOperation(record, 'decrease'),
          });
        }

        const isDraft = normalizeApprovalStatus(record.approvalStatus) === 'DRAFT';
        if (isDraft && perms.canDelete) {
          rowActions.push({
            key: 'delete',
            label: 'Xóa',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => setDeleteTarget(record),
          });
        }

        return rowActions;
      },
    }),
    [daiTtdhMap, openDetail, openEdit, openHistory, openOperation, orgName, perms]
  );

  const headerActions = useMemo<ScreenHeaderAction[]>(() => {
    if (!perms.canCreate) return [];
    return [
      {
        key: 'create',
        label: 'Thêm mới',
        icon: <PlusOutlined />,
        variant: 'primary',
        onClick: openCreate,
      },
    ];
  }, [openCreate, perms.canCreate, perms.userPermissions]);

  return (
    <ThemeTokenProvider tokens={themeTokenChk as unknown as ThemeToken}>
      <div
        className="daittdh-asset-page-wrapper"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản đài thông tin duyên hải' },
          ]}
          actions={headerActions}
        />

        <FilterTableLayout
          statusTabsNode={
            <CommonStatusTabs
              activeKey={filters.approvalStatus || 'all'}
              counts={statusCounts}
              onChange={(_key, queryStatus) => {
                setPage(1);
                setFilters((current) => ({ ...current, approvalStatus: queryStatus }));
              }}
            />
          }
          error={Boolean(error)}
          errorMessage={error}
          onRetry={loadData}
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          filterContent={
            <TableFilter
              mode="fieldsOnly"
              filters={filterOptions}
              values={draftFilters as Record<string, unknown>}
              onChange={(v) =>
                setDraftFilters(v as DaiTtdhAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] })
              }
            />
          }
        >
          <CommonTable
            options={tableOptions}
            dataSource={data}
            total={total}
            page={page}
            pageSize={pageSize}
            loading={loading}
            filters={filters}
            onPageChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            }}
            onSortChange={(field, order) => {
              setPage(1);
              setFilters((current) => ({
                ...current,
                sortBy: order ? field : undefined,
                sortDir:
                  order === 'ascend'
                    ? 'ASC'
                    : order === 'descend'
                      ? 'DESC'
                      : undefined,
              }));
            }}
          />
        </FilterTableLayout>

        {/* Create / Edit Drawer (DynamicFormSidebar) */}
        <DaiTtdhAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          daiTtdhs={daiTtdhs}
          attachments={attachments}
          saving={saving}
          saveAction={saveAction}
          onClose={() => {
            setDrawerMode(undefined);
            form.resetFields();
          }}
          onSave={saveAsset}
          onUploadAttachment={handleUploadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onDownloadAttachment={handleDownloadAttachment}
        />

        {/* Detail Drawer (DynamicViewSidebar) */}
        <DaiTtdhAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          daiTtdhMap={daiTtdhMap}
          exploitationRows={exploitationRows}
          adjustmentRows={adjustmentRows}
        />

        {/* Operations Drawer (DynamicFormSidebar) */}
        <DaiTtdhAssetOperationForm
          open={Boolean(operationMode)}
          operationMode={operationMode}
          selected={selected}
          organizations={organizations}
          form={operationForm}
          saving={saving}
          saveAction={saveAction}
          onClose={() => {
            setOperationMode(undefined);
            operationForm.resetFields();
          }}
          onSubmit={saveOperation}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          onCancel={() => setDeleteTarget(undefined)}
          loading={saving}
          itemType="tài sản đài thông tin duyên hải"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={() => {
            if (!deleteTarget) return;
            setSaving(true);
            void deleteDaiTtdhAsset(deleteTarget.id)
              .then(() => {
                toast.success('Đã xóa tài sản đài TTDH.');
                setData((prev) => prev.filter((item) => item.id !== deleteTarget.id));
                setTotal((prev) => Math.max(0, prev - 1));
                setDeleteTarget(undefined);
                return loadData();
              })
              .catch((cause: unknown) =>
                toast.error(getErrorMessage(cause, 'Không thể xóa tài sản.'))
              )
              .finally(() => setSaving(false));
          }}
        />
        {/* ── History Drawer ── */}
        <DaiTtdhAssetHistory
          open={historyOpen}
          target={historyTarget}
          records={historyRecords}
          loading={historyLoading}
          filters={historyFilters}
          filteredRecords={filteredHistory}
          hasActiveFilter={hasActiveHistoryFilter}
          orgName={orgName}
          daiTtdhMap={daiTtdhMap}
          onClose={() => setHistoryOpen(false)}
          onFiltersChange={setHistoryFilters}
        />
      </div>
    </ThemeTokenProvider>
  );
}
