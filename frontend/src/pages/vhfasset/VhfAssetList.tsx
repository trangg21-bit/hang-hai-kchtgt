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
import {
  resolveMimeType,
  triggerBlobDownload,
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import toast from '../../components/ToastNotification';
import { useAssetPermissions } from '../../hooks/useAssetPermissions';
import { MARITIME_ASSET_TYPE_OPTIONS } from '../../constants/assetType';
import { ThemeTokenProvider, type ThemeToken } from '../../context/ThemeTokenContext';
import api from '../../services/api';
import { organizationService, type Organization } from '../../services/organizationService';
import { fetchTransmissionOptions } from '../../services/transmission/api';
import type { TransmissionOptionResponse } from '../../services/transmission/types';
import {
  createVhfAdjustment,
  createVhfAsset,
  createVhfExploitation,
  deleteVhfAsset,
  downloadVhfAssetAttachment,
  fetchVhfAdjustments,
  fetchVhfAssetAttachments,
  fetchVhfAssets,
  fetchVhfExploitations,
  updateVhfAsset,
  uploadVhfAssetAttachments,
  VHF_ASSET_TYPE,
} from '../../services/vhfAsset/api';
import type {
  VhfAsset,
  VhfAssetAdjustment,
  VhfAssetExploitation,
  VhfAssetFilters,
  VhfAssetPayload,
} from '../../services/vhfAsset/types';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import { canDeleteApprovalRecord, isAssetRecordEditable, normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import {
  calculateAssetAdjustmentValues,
  validateAdjustmentOriginalValue,
} from '../../utils/assetValueCalculation';
import VhfAssetDetailContent from './VhfAssetDetailContent';
import VhfAssetForm, { type FormValues } from './VhfAssetForm';
import VhfAssetHistory, { useVhfHistory } from './VhfAssetHistory';
import VhfAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './VhfAssetOperationForm';

const STATUS_COUNT_KEYS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED_LEVEL1',
  'APPROVED',
  'REJECTED_LEVEL1',
  'REJECTED_LEVEL2',
  'ARCHIVED',
];

import { ASSET_CONDITION_OPTIONS } from '../../constants/assetDropdown';

type DrawerMode = 'create' | 'edit' | 'detail';

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) => Boolean((cause as { errorFields?: unknown }).errorFields);

export default function VhfAssetList() {
  const perms = useAssetPermissions(['vhf', 'vhfasset']);
  const [data, setData] = useState<VhfAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [transmissions, setTransmissions] = useState<TransmissionOptionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<VhfAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<VhfAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<VhfAsset>();
  const [deleteTarget, setDeleteTarget] = useState<VhfAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<VhfAssetExploitation[]>([]);
  const [adjustmentRows, setAdjustmentRows] = useState<VhfAssetAdjustment[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const orgName = useMemo(() => new Map(organizations.map((item) => [item.id, item.name])), [organizations]);
  const transmissionMap = useMemo(
    () =>
      new Map(
        transmissions.map((item) => [
          item.id,
          { code: item.deviceCode, name: item.deviceName },
        ])
      ),
    [transmissions]
  );

  const {
    historyOpen, historyTarget, historyRecords, historyLoading,
    historyFilters, filteredHistory, hasActiveHistoryFilter,
    openHistory, setHistoryOpen, setHistoryFilters,
  } = useVhfHistory({ orgName, transmissionMap });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchVhfAssets({ ...filters, page: page - 1, size: pageSize });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchVhfAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) =>
          fetchVhfAssets({ ...baseFilters, approvalStatus })
        ),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(
          STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])
        ),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản HTTT liên lạc VHF.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu khi bộ lọc/trang thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void Promise.all([
      organizationService.getAll(),
      fetchTransmissionOptions().catch(() => [] as TransmissionOptionResponse[]),
    ])
      .then(([orgs, transList]) => {
        setOrganizations(orgs);
        setTransmissions(transList);
      })
      .catch(() => toast.error('Không thể tải danh mục đơn vị hoặc thiết bị VHF/truyền dẫn.'));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    form.resetFields();
    setAttachments([]);
  }, [form]);

  const openEdit = useCallback(
    (record: VhfAsset) => {
      if (!isAssetRecordEditable(record.approvalStatus)) {
        toast.warning('Hồ sơ đang ở trạng thái không được phép chỉnh sửa.');
        return;
      }
      setSelected(record);
      setDrawerMode('edit');
      form.setFieldsValue({
        ...record,
        constructionYear: record.constructionYear ? dayjs(String(record.constructionYear)) : undefined,
        useDate: record.useDate ? dayjs(record.useDate) : undefined,
        declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
        depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
        depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
        attachmentName: record.attachmentName,
      });
      fetchVhfAssetAttachments(record.id)
        .then((realAtts) => {
          if (realAtts && realAtts.length > 0) {
            setAttachments(
              realAtts.map((att) => ({
                id: att.id,
                fileName: att.fileName,
                fileSize: att.fileSize,
                fileType: att.contentType,
                uploadedByName:
                  att.uploadedByName ||
                  record.updatedByName ||
                  record.submittedByName ||
                  currentUser?.fullName ||
                  'Cán bộ quản lý',
                uploadedDate:
                  att.uploadedAt || (record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString()),
                filePath: `/v1/asset/transmission-assets/${record.id}/attachments/${att.id}/download`,
              }))
            );
          } else if (record.attachmentName) {
            setAttachments(
              record.attachmentName.split(',').map((name, i) => ({
                id: `att-${i}-${Date.now()}`,
                fileName: name.trim(),
                fileSize: 1024 * 512,
                uploadedByName:
                  record.updatedByName ||
                  record.submittedByName ||
                  currentUser?.fullName ||
                  currentUser?.username ||
                  'Cán bộ quản lý',
                uploadedDate: record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString(),
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
                id: `att-${i}-${Date.now()}`,
                fileName: name.trim(),
                fileSize: 1024 * 512,
                uploadedByName:
                  record.updatedByName ||
                  record.submittedByName ||
                  currentUser?.fullName ||
                  currentUser?.username ||
                  'Cán bộ quản lý',
                uploadedDate: record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString(),
              }))
            );
          } else {
            setAttachments([]);
          }
        });
    },
    [currentUser, form]
  );

  const handleUploadAttachment = useCallback(
    (file: File) => {
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
    },
    [currentUser]
  );

  const handleDeleteAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
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
          await downloadVhfAssetAttachment(selected.id, id, fileName);
          toast.success(`Đã tải xuống tệp: ${fileName}`);
          return;
        } catch (err) {
          console.error('Download server error:', err);
        }
      }
      // Fallback
      const fallbackBlob = new Blob(
        [`Tài liệu đính kèm HTTT liên lạc VHF: ${fileName}\nThời gian: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`],
        { type: resolveMimeType(fileName, 'text/plain;charset=utf-8') }
      );
      triggerBlobDownload(fallbackBlob, fileName);
      toast.success(`Đã tải xuống tệp: ${fileName}`);
    },
    [attachments, selected]
  );

  const openDetail = useCallback(async (record: VhfAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exploitations, adjustments] = await Promise.all([
        fetchVhfExploitations(record.id),
        fetchVhfAdjustments(record.id),
      ]);
      setExploitationRows(exploitations);
      setAdjustmentRows(adjustments);
    } catch {
      setExploitationRows([]);
      setAdjustmentRows([]);
    }
  }, []);

  const saveAsset = async (targetAction: string) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(targetAction);

      const attachmentName =
        attachments.length > 0 ? attachments.map((a) => a.fileName).join(', ') : undefined;

      const payload: VhfAssetPayload = {
        ...values,
        assetType: VHF_ASSET_TYPE,
        constructionYear: values.constructionYear ? Number(values.constructionYear.format('YYYY')) : undefined,
        useDate: values.useDate?.format('YYYY-MM-DD'),
        declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
        depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
        depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
        attachmentName,
        approvalStatus: targetAction,
      };

      let savedAsset: VhfAsset;
      if (drawerMode === 'edit' && selected) {
        savedAsset = await updateVhfAsset(selected.id, payload);
      } else {
        savedAsset = await createVhfAsset(payload);
      }

      const targetAssetId = savedAsset?.id || selected?.id;
      const filesToUpload = attachments
        .map((a) => a.originFileObj)
        .filter((f): f is File => Boolean(f));
      if (targetAssetId && filesToUpload.length > 0) {
        try {
          await uploadVhfAssetAttachments(targetAssetId, filesToUpload);
        } catch (attErr) {
          console.error('Upload attachments error:', attErr);
        }
      }

      toast.success(
        targetAction === 'DRAFT'
          ? 'Đã lưu tạm tài sản HTTT liên lạc VHF.'
          : targetAction === 'PENDING_APPROVAL'
            ? 'Đã lưu và gửi phê duyệt tài sản HTTT liên lạc VHF.'
            : 'Đã lưu và phê duyệt tài sản HTTT liên lạc VHF.'
      );
      setDrawerMode(undefined);
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause))
        toast.error(getErrorMessage(cause, 'Không thể lưu tài sản HTTT liên lạc VHF.'));
    } finally {
      setSaving(false);
    }
  };

  const saveOperation = async () => {
    if (!selected || !operationMode) return;
    try {
      const values = await operationForm.validateFields();
      setSaving(true);

      if (operationMode === 'exploit') {
        await createVhfExploitation(selected.id, {
          ...values,
          assetCategory: [selected.assetCode, selected.assetName].filter(Boolean).join(' - '),
          exploitationDeadline: values.exploitationDeadline?.format('YYYY-MM-DD'),
        });
      } else {
        const origVal = (values.originalValueAfter ?? values.originalValue) as number | undefined;
        const valCheck = validateAdjustmentOriginalValue(
          operationMode,
          origVal,
          selected.originalValue
        );
        if (!valCheck.isValid) {
          toast.error(valCheck.message || 'Nguyên giá sau điều chỉnh không hợp lệ.');
          return;
        }

        setSaving(true);
        const calc = calculateAssetAdjustmentValues({
          originalValueAfter: origVal,
          depreciationRate: values.depreciationRate,
          depreciationStartDate: values.depreciationStartDate,
          depreciationEndDate: values.depreciationEndDate,
          accumulatedDepreciationManual: values.accumulatedDepreciation,
          depreciationMonths: values.depreciationMonths,
        });

        await createVhfAdjustment(selected.id, {
          ...values,
          originalValue: origVal,
          originalValueAfter: origVal,
          originalValueBefore: selected.originalValue,
          remainingValueBefore: selected.remainingValue,
          remainingValueAfter: calc.remainingValueAfter,
          accumulatedDepreciation:
            calc.accumulatedDepreciation ?? values.accumulatedDepreciation,
          monthlyDepreciation: calc.monthlyDepreciation,
          adjustmentType: operationMode === 'increase' ? 'INCREASE' : 'DECREASE',
          decisionDate: values.decisionDate?.format('YYYY-MM-DD'),
          adjustmentDate: values.adjustmentDate?.format('YYYY-MM-DD'),
          declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
          depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
          depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
        });
      }

      toast.success('Đã lưu thông tin biến động.');
      setOperationMode(undefined);
      operationForm.resetFields();
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause))
        toast.error(getErrorMessage(cause, 'Không thể lưu thông tin.'));
    } finally {
      setSaving(false);
    }
  };

  const filterOptions = useMemo<FilterOption[]>(
    () => [
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        type: 'treeSelect',
        organizations,
        placeholder: 'Chọn đơn vị...',
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
        options: ASSET_CONDITION_OPTIONS,
      },
      {
        key: 'usingOrgUnitId',
        label: 'Đơn vị sử dụng',
        type: 'treeSelect',
        organizations,
        placeholder: 'Chọn đơn vị...',
        isAdvanced: true,
      },
      {
        key: 'transmissionId',
        label: 'Mã thiết bị',
        type: 'select',
        placeholder: 'Chọn thiết bị VHF / truyền dẫn',
        options: transmissions.map((item) => ({
          value: item.id,
          label: `${item.deviceCode} - ${item.deviceName}`,
        })),
        isAdvanced: true,
      },
      {
        key: 'assetType',
        label: 'Loại tài sản',
        type: 'select',
        placeholder: 'Chọn loại tài sản',
        options: MARITIME_ASSET_TYPE_OPTIONS,
        isAdvanced: true,
      },
      {
        key: 'assetCode',
        label: 'Mã tài sản',
        type: 'text',
        placeholder: 'Tìm theo mã tài sản',
        isAdvanced: true,
      },
      {
        key: 'updatedRange',
        label: 'Ngày cập nhật',
        type: 'dateRange',
        isAdvanced: true,
      },
    ],
    [transmissions, organizations]
  );

  const handleFilterApply = useCallback(() => {
    setPage(1);
    const range = draftFilters.updatedRange;
    setFilters({
      ...draftFilters,
      updatedFrom: range?.[0]?.format('YYYY-MM-DD'),
      updatedTo: range?.[1]?.format('YYYY-MM-DD'),
    });
  }, [draftFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({});
    setFilters({});
    setPage(1);
  }, []);

  const tableOptions = useMemo<TableOption<VhfAsset>>(
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
          title: 'HỆ THỐNG TRUYỀN DẪN/VHF TRỰC THUỘC',
          dataIndex: 'transmissionId',
          type: TableColumnType.Text,
          width: 240,
          allowSort: true,
          valueRef: (r) => {
            const sid = r.transmissionId;
            const item = sid ? transmissionMap.get(sid) : undefined;
            if (item) return `${item.code} - ${item.name}`;
            return r.transmissionCode || r.transmissionId || '—';
          },
        },
        {
          title: 'LOẠI TÀI SẢN',
          dataIndex: 'assetType',
          type: TableColumnType.Text,
          width: 180,
          allowSort: true,
          render: (v) => (v as string) || VHF_ASSET_TYPE,
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
      actions: (record: VhfAsset) => {
        const isArchived =
          normalizeApprovalStatus(record.approvalStatus) === 'ARCHIVED' ||
          Boolean((record as { deletedAt?: string | null }).deletedAt);

        if (isArchived) {
          const arcActions: TableActionOption<VhfAsset>[] = [];
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

        const rowActions: TableActionOption<VhfAsset>[] = [];
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
            onClick: () => {
              setSelected(record);
              setOperationMode('exploit');
              operationForm.resetFields();
            },
          });
        }
        if (perms.canIncrease) {
          rowActions.push({
            key: 'increase',
            label: 'Tăng nguyên giá',
            icon: <PlusCircleOutlined />,
            onClick: () => {
              setSelected(record);
              setOperationMode('increase');
              operationForm.resetFields();
              operationForm.setFieldsValue({
                originalValueBefore: record.originalValue,
                remainingValueBefore: record.remainingValue,
                declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
                depreciationRate: record.depreciationRate,
                assignmentDecisionNumber: record.assignmentDecisionNumber,
                depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
                depreciationMonths: record.depreciationMonths,
                depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
                accumulatedDepreciation: record.accumulatedDepreciation,
              });
            },
          });
        }
        if (perms.canDecrease) {
          rowActions.push({
            key: 'decrease',
            label: 'Giảm nguyên giá',
            icon: <MinusCircleOutlined />,
            onClick: () => {
              setSelected(record);
              setOperationMode('decrease');
              operationForm.resetFields();
              operationForm.setFieldsValue({
                originalValueBefore: record.originalValue,
                remainingValueBefore: record.remainingValue,
                declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
                depreciationRate: record.depreciationRate,
                assignmentDecisionNumber: record.assignmentDecisionNumber,
                depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
                depreciationMonths: record.depreciationMonths,
                depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
                accumulatedDepreciation: record.accumulatedDepreciation,
              });
            },
          });
        }

        if (perms.canDelete && canDeleteApprovalRecord(record.approvalStatus, { resource: 'vhf' })) {
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
    [openDetail, openEdit, openHistory, operationForm, orgName, transmissionMap, perms]
  );

  const headerActions: ScreenHeaderAction[] = useMemo(() => {
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
        className="vhf-asset-page-wrapper"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản HTTT liên lạc VHF' },
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
              onChange={(v) => setDraftFilters(v as VhfAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] })}
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

        {/* ── Create / Edit Drawer (DynamicFormSidebar) ─────────────── */}
        <VhfAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          transmissions={transmissions}
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

        {/* ── Detail Drawer (DynamicViewSidebar) ─────────────────────── */}
        <VhfAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          transmissionMap={transmissionMap}
          exploitationRows={exploitationRows}
          adjustmentRows={adjustmentRows}
        />

        {/* ── Operations Drawer (DynamicFormSidebar) ─────────────────────── */}
        <VhfAssetOperationForm
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

        {/* ── Delete Confirmation Modal ────────────────────────────── */}
        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          onCancel={() => setDeleteTarget(undefined)}
          loading={saving}
          itemType="tài sản HTTT liên lạc VHF"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={() => {
            if (!deleteTarget) return;
            setSaving(true);
            void deleteVhfAsset(deleteTarget.id)
              .then(() => {
                toast.success('Đã xóa tài sản HTTT liên lạc VHF.');
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
        <VhfAssetHistory
          open={historyOpen}
          target={historyTarget}
          records={historyRecords}
          loading={historyLoading}
          filters={historyFilters}
          filteredRecords={filteredHistory}
          hasActiveFilter={hasActiveHistoryFilter}
          orgName={orgName}
          transmissionMap={transmissionMap}
          onClose={() => setHistoryOpen(false)}
          onFiltersChange={setHistoryFilters}
        />
      </div>
    </ThemeTokenProvider>
  );
}
