import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
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
import {
  ScreenHeader,
  FilterTableLayout,
  CommonTable,
  TableFilter,
  CommonStatusTabs,
  TableColumnType,
  type TableOption,
  type TableActionOption,
  type FilterOption,
  type ScreenHeaderAction,
} from '../../components/list-view';
import { normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import toast from '../../components/ToastNotification';
import { organizationService, type Organization } from '../../services/organizationService';
import {
  fetchInmarsatAssets,
  fetchInmarsatAssetCounts,
  deleteInmarsatAsset,
  createInmarsatAsset,
  updateInmarsatAsset,
  fetchInmarsatExploitations,
  createInmarsatExploitation,
  fetchInmarsatAdjustments,
  createInmarsatAdjustment,
  fetchInmarsatStationOptions,
  fetchInmarsatAssetAttachments,
  uploadInmarsatAssetAttachments,
  downloadInmarsatAssetAttachment,
} from '../../services/inmarsatAsset/api';
import type {
  InmarsatAsset,
  InmarsatAssetFilters,
  InmarsatAssetPayload,
  InmarsatAssetExploitation,
  InmarsatAssetAdjustment,
} from '../../services/inmarsatAsset/types';
import {
  triggerBlobDownload,
  resolveMimeType,
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import InmarsatAssetForm, { type FormValues } from './InmarsatAssetForm';
import InmarsatAssetDetailContent from './InmarsatAssetDetailContent';
import InmarsatAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './InmarsatAssetOperationForm';
import InmarsatAssetHistory, { useInmarsatHistory } from './InmarsatAssetHistory';

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

const ASSET_CONDITIONS = ['Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được'];

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) => Boolean((cause as { errorFields?: unknown }).errorFields);

export default function InmarsatAssetList() {
  const [data, setData] = useState<InmarsatAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [inmarsatStations, setInmarsatStations] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const statusCountFilterKey = useRef<string>();
  const statusCountLoadingKey = useRef<string>();
  const statusCountRequestVersion = useRef(0);
  const latestStatusCountFilterKey = useRef<string>();
  const [filters, setFilters] = useState<InmarsatAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<InmarsatAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<InmarsatAsset>();
  const [deleteTarget, setDeleteTarget] = useState<InmarsatAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<InmarsatAssetExploitation[]>([]);
  const [adjustmentRows, setAdjustmentRows] = useState<InmarsatAssetAdjustment[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();

  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const authUser = useAuthStore((s) => s.user);
  const orgName = useMemo(() => new Map(organizations.map((org) => [org.id, org.name])), [organizations]);
  const inmarsatMap = useMemo(
    () => new Map(inmarsatStations.map((item) => [item.id, { code: item.code, name: item.name }])),
    [inmarsatStations]
  );

  const {
    historyOpen, historyTarget, historyRecords, historyLoading,
    historyFilters, filteredHistory, hasActiveHistoryFilter,
    openHistory, setHistoryOpen, setHistoryFilters,
  } = useInmarsatHistory({ orgName, inmarsatMap });

  const customTokens = useMemo(
    () => ({
      ...themeTokenChk,
      fontSizeMd: 13.5,
    }),
    []
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filterKey = JSON.stringify(filters);
      const requestVersion = statusCountRequestVersion.current;
      latestStatusCountFilterKey.current = filterKey;
      const shouldLoadCounts =
        statusCountFilterKey.current !== filterKey && statusCountLoadingKey.current !== filterKey;
      if (shouldLoadCounts) {
        statusCountLoadingKey.current = filterKey;
      }
      const listRequest = fetchInmarsatAssets({
        ...filters,
        page: page - 1,
        size: pageSize,
      });
      const countRequest = shouldLoadCounts
        ? fetchInmarsatAssetCounts(filters).catch(() => null)
        : Promise.resolve(null);
      const [res, rawCounts] = await Promise.all([listRequest, countRequest]);
      setData(res.content || []);
      setTotal(res.totalElements || 0);

      if (
        rawCounts &&
        requestVersion === statusCountRequestVersion.current &&
        latestStatusCountFilterKey.current === filterKey
      ) {
        const nextCounts: Record<string, number> = {
          all: Number(rawCounts.ALL ?? rawCounts.all ?? 0),
          ...Object.fromEntries(
            STATUS_COUNT_KEYS.map((key) => [key, Number(rawCounts[key] ?? 0)])
          ),
        };
        const rejectedTotal = (nextCounts.REJECTED_LEVEL1 || 0) + (nextCounts.REJECTED_LEVEL2 || 0);
        nextCounts.REJECTED_LEVEL1 = rejectedTotal;
        delete nextCounts.REJECTED_LEVEL2;
        setStatusCounts(nextCounts);
        statusCountFilterKey.current = filterKey;
        statusCountLoadingKey.current = undefined;
      } else if (shouldLoadCounts && statusCountLoadingKey.current === filterKey) {
        statusCountLoadingKey.current = undefined;
      }
    } catch (cause: unknown) {
      if (shouldLoadCounts && statusCountLoadingKey.current === filterKey) {
        statusCountLoadingKey.current = undefined;
      }
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản đài Inmarsat.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void organizationService.getAll().then(setOrganizations).catch(() => setOrganizations([]));
    void fetchInmarsatStationOptions().then(setInmarsatStations).catch(() => setInmarsatStations([]));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setAttachments([]);
    form.resetFields();
    form.setFieldsValue({
      assetCondition: 'Tốt',
      usageStatus: 'Đang sử dụng',
      quantity: 1,
      quantityUnit: 'Bộ',
    });
    setDrawerMode('create');
  }, [form]);

  const openEdit = useCallback(
    (record: InmarsatAsset) => {
      setSelected(record);
      setDrawerMode('edit');
      fetchInmarsatAssetAttachments(record.id)
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
                filePath: `/v1/asset/coastal-station-assets/${record.id}/attachments/${att.id}/download`,
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
          await downloadInmarsatAssetAttachment(selected.id, id, fileName);
          toast.success(`Đã tải xuống tệp: ${fileName}`);
          return;
        } catch (err) {
          console.error('Download server error:', err);
        }
      }
      // Fallback
      const fallbackBlob = new Blob(
        [`Tài liệu đính kèm đài Inmarsat: ${fileName}\nThời gian: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`],
        { type: resolveMimeType(fileName, 'text/plain;charset=utf-8') }
      );
      triggerBlobDownload(fallbackBlob, fileName);
      toast.success(`Đã tải xuống tệp: ${fileName}`);
    },
    [attachments, selected]
  );

  const openDetail = useCallback(async (record: InmarsatAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exploitations, adjustments] = await Promise.all([
        fetchInmarsatExploitations(record.id).catch(() => []),
        fetchInmarsatAdjustments(record.id).catch(() => []),
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
        const payload: InmarsatAssetPayload = {
          ...values,
          assetType: 'Tài sản đài Inmarsat',
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

        let savedAsset: InmarsatAsset;
        if (drawerMode === 'edit' && selected) {
          savedAsset = await updateInmarsatAsset(selected.id, payload);
          toast.success('Cập nhật tài sản đài Inmarsat thành công.');
        } else {
          savedAsset = await createInmarsatAsset(payload);
          toast.success('Thêm mới tài sản đài Inmarsat thành công.');
        }

        const targetAssetId = savedAsset?.id || selected?.id;
        const filesToUpload = attachments
          .map((a) => a.originFileObj)
          .filter((f): f is File => Boolean(f));
        if (targetAssetId && filesToUpload.length > 0) {
          try {
            await uploadInmarsatAssetAttachments(targetAssetId, filesToUpload);
          } catch (attErr) {
            console.error('Upload attachments error:', attErr);
          }
        }

        setDrawerMode(undefined);
        form.resetFields();
        statusCountFilterKey.current = undefined;
        statusCountLoadingKey.current = undefined;
        statusCountRequestVersion.current += 1;
        await loadData();
      } catch (cause: unknown) {
        if (!isValidationError(cause)) {
          toast.error(getErrorMessage(cause, 'Không thể lưu thông tin tài sản đài Inmarsat.'));
        }
      } finally {
        setSaving(false);
      }
    },
    [form, drawerMode, selected, attachments, loadData]
  );

  const openOperation = useCallback(
    (record: InmarsatAsset, mode: OperationMode) => {
      setSelected(record);
      setOperationMode(mode);
      operationForm.resetFields();
      if (mode === 'exploit') {
        operationForm.setFieldsValue({
          assetCategory: record.assetName,
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
          originalValueAfter: original,
          remainingValueBefore: remaining,
          remainingValueAfter: remaining,
          depreciationRate: record.depreciationRate || 0,
          depreciationMonths: record.depreciationMonths || 0,
          accumulatedDepreciation: record.accumulatedDepreciation || 0,
        });
      }
    },
    [operationForm]
  );

  const saveOperation = useCallback(async () => {
    if (!selected || !operationMode) return;
    try {
      setSaving(true);
      const values = await operationForm.validateFields();
      if (operationMode === 'exploit') {
        await createInmarsatExploitation(selected.id, {
          ...values,
          exploitationDeadline: values.exploitationDeadline
            ? values.exploitationDeadline.format('YYYY-MM-DD')
            : undefined,
        });
        toast.success('Thêm thông tin khai thác tài sản đài Inmarsat thành công.');
      } else {
        await createInmarsatAdjustment(selected.id, {
          ...values,
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
      statusCountFilterKey.current = undefined;
      statusCountLoadingKey.current = undefined;
      statusCountRequestVersion.current += 1;
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
    const nextFilters: InmarsatAssetFilters = { ...draftFilters };
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
        key: 'usingOrgUnitId',
        label: 'Đơn vị sử dụng',
        type: 'treeSelect',
        organizations,
        placeholder: 'Chọn đơn vị sử dụng',
      },
      {
        key: 'stationId',
        label: 'Đài Inmarsat',
        type: 'select',
        options: inmarsatStations.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` })),
        placeholder: 'Chọn đài Inmarsat',
        showSearch: true,
      },
      {
        key: 'assetCondition',
        label: 'Tình trạng tài sản',
        type: 'select',
        options: ASSET_CONDITIONS.map((c) => ({ value: c, label: c })),
        placeholder: 'Chọn tình trạng',
      },
      {
        key: 'assetName',
        label: 'Tên hoặc mã tài sản',
        type: 'text',
        placeholder: 'Tìm kiếm theo tên / mã tài sản',
      },
      {
        key: 'updatedRange',
        label: 'Khoảng ngày cập nhật',
        type: 'dateRange',
        format: 'DD/MM/YYYY',
      },
    ],
    [organizations, inmarsatStations]
  );

  const tableOptions = useMemo<TableOption<InmarsatAsset>>(
    () => ({
      dataKey: 'id',
      mainColumns: [
        {
          title: 'TÊN/MÃ TÀI SẢN',
          dataIndex: 'assetName',
          type: TableColumnType.TwoLine,
          subField: 'assetCode',
          width: 230,
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
          title: 'ĐÀI INMARSAT TRỰC THUỘC',
          dataIndex: 'stationId',
          type: TableColumnType.Text,
          width: 240,
          allowSort: true,
          valueRef: (r) => {
            const sid = r.stationId || r.inmarsatId;
            const station = sid ? inmarsatMap.get(sid) : undefined;
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
          render: (v) => (v as string) || 'Tài sản đài Inmarsat',
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
      actions: (record: InmarsatAsset) => {
        const isArchived =
          normalizeApprovalStatus(record.approvalStatus) === 'ARCHIVED' ||
          Boolean((record as { deletedAt?: string | null }).deletedAt);

        if (isArchived) {
          return [
            {
              key: 'detail',
              label: 'Xem chi tiết',
              icon: <EyeOutlined />,
              onClick: () => void openDetail(record),
            },
            {
              key: 'history',
              label: 'Lịch sử',
              icon: <HistoryOutlined />,
              onClick: () => void openHistory(record),
            },
          ];
        }

        const rowActions: TableActionOption<InmarsatAsset>[] = [
          {
            key: 'detail',
            label: 'Xem chi tiết',
            icon: <EyeOutlined />,
            onClick: () => void openDetail(record),
          },
          {
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <EditOutlined />,
            onClick: () => openEdit(record),
          },
          {
            key: 'history',
            label: 'Lịch sử',
            icon: <HistoryOutlined />,
            onClick: () => void openHistory(record),
          },
          {
            key: 'exploit',
            label: 'Khai thác tài sản',
            icon: <RocketOutlined />,
            onClick: () => openOperation(record, 'exploit'),
          },
          {
            key: 'increase',
            label: 'Tăng nguyên giá',
            icon: <PlusCircleOutlined />,
            onClick: () => openOperation(record, 'increase'),
          },
          {
            key: 'decrease',
            label: 'Giảm nguyên giá',
            icon: <MinusCircleOutlined />,
            onClick: () => openOperation(record, 'decrease'),
          },
        ];

        const isDraft = normalizeApprovalStatus(record.approvalStatus) === 'DRAFT';
        if (isDraft) {
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
    [inmarsatMap, openDetail, openEdit, openHistory, openOperation, orgName]
  );

  const headerActions = useMemo<ScreenHeaderAction[]>(
    () => [
      {
        key: 'create',
        label: 'Thêm mới',
        icon: <PlusOutlined />,
        variant: 'primary',
        onClick: openCreate,
      },
    ],
    [openCreate]
  );

  return (
    <ThemeTokenProvider tokens={customTokens as unknown as import('../../context/ThemeTokenContext').ThemeToken}>
      <div
        className="inmarsat-asset-page-wrapper"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản đài Inmarsat' },
          ]}
          actions={headerActions}
        />

        <FilterTableLayout
          hideFilterToggle
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
                setDraftFilters(v as InmarsatAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] })
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
        <InmarsatAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          inmarsatStations={inmarsatStations}
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
        <InmarsatAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          inmarsatMap={inmarsatMap}
          exploitationRows={exploitationRows}
          adjustmentRows={adjustmentRows}
        />

        {/* Operations Drawer (DynamicFormSidebar) */}
        <InmarsatAssetOperationForm
          open={Boolean(operationMode)}
          operationMode={operationMode}
          selected={selected}
          organizations={organizations}
          form={operationForm}
          saving={saving}
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
          itemType="tài sản đài thông tin vệ tinh Inmarsat"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={() => {
            if (!deleteTarget) return;
            setSaving(true);
            void deleteInmarsatAsset(deleteTarget.id)
              .then(() => {
                toast.success('Đã xóa tài sản đài Inmarsat.');
                setData((prev) => prev.filter((item) => item.id !== deleteTarget.id));
                setTotal((prev) => Math.max(0, prev - 1));
                setDeleteTarget(undefined);
                statusCountFilterKey.current = undefined;
                statusCountLoadingKey.current = undefined;
                statusCountRequestVersion.current += 1;
                return loadData();
              })
              .catch((cause: unknown) =>
                toast.error(getErrorMessage(cause, 'Không thể xóa tài sản.'))
              )
              .finally(() => setSaving(false));
          }}
        />
        {/* ── History Drawer ── */}
        <InmarsatAssetHistory
          open={historyOpen}
          target={historyTarget}
          records={historyRecords}
          loading={historyLoading}
          filters={historyFilters}
          filteredRecords={filteredHistory}
          hasActiveFilter={hasActiveHistoryFilter}
          orgName={orgName}
          inmarsatMap={inmarsatMap}
          onClose={() => setHistoryOpen(false)}
          onFiltersChange={setHistoryFilters}
        />
      </div>
    </ThemeTokenProvider>
  );
}
