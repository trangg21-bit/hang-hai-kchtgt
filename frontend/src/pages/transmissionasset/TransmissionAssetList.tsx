import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  PlusOutlined,
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
import { AppDrawer } from '../../components/shared/AppDrawer';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { renderStandardHistoryCards } from '../../utils/changeHistoryRenderer';
import toast from '../../components/ToastNotification';
import { organizationService, type Organization } from '../../services/organizationService';
import { fetchTransmissionOptions } from '../../services/transmission/api';
import type { TransmissionOptionResponse } from '../../services/transmission/types';
import {
  fetchTransmissionAssets,
  deleteTransmissionAsset,
  createTransmissionAsset,
  updateTransmissionAsset,
  fetchTransmissionExploitations,
  createTransmissionExploitation,
  fetchTransmissionAdjustments,
  createTransmissionAdjustment,
  fetchTransmissionAssetAttachments,
  uploadTransmissionAssetAttachments,
  deleteTransmissionAssetAttachment,
  downloadTransmissionAssetAttachment,
  fetchTransmissionAssetHistory,
} from '../../services/transmissionAsset/api';
import type {
  TransmissionAsset,
  TransmissionAssetFilters,
  TransmissionAssetPayload,
  TransmissionAssetExploitation,
  TransmissionAssetAdjustment,
} from '../../services/transmissionAsset/types';
import {
  triggerBlobDownload,
  resolveMimeType,
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import {
  actionPrimary,
  borderDefault,
  drawerTitleStyle,
  fontSizeLg,
  fontWeightBold,
  radiusPill,
  spaceMd,
} from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import TransmissionAssetForm, { type FormValues } from './TransmissionAssetForm';
import TransmissionAssetDetailContent from './TransmissionAssetDetailContent';
import TransmissionAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './TransmissionAssetOperationForm';

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

const TRANSMISSION_ASSET_FIELD_LABELS: Record<string, string> = {
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  orgUnitId: 'Đơn vị quản lý',
  usingOrgUnitId: 'Đơn vị sử dụng',
  transmissionId: 'Mã hệ thống truyền dẫn',
  assetType: 'Loại tài sản',
  types: 'Phân loại tài sản',
  assetCode: 'Mã tài sản',
  assetName: 'Tên tài sản',
  barcode: 'Barcode',
  assetCondition: 'Tình trạng tài sản',
  usageStatus: 'Hiện trạng sử dụng',
  assetGroup: 'Nhóm tài sản',
  assetSubgroup: 'Phân nhóm tài sản',
  origin: 'Nguồn gốc',
  address: 'Địa chỉ',
  landArea: 'Diện tích đất (m²)',
  floorArea: 'Diện tích sàn (m²)',
  constructionYear: 'Năm xây dựng',
  useDate: 'Ngày đưa vào sử dụng',
  declarationDate: 'Ngày kê khai',
  originalValue: 'Nguyên giá (VNĐ)',
  depreciationRate: 'Tỷ lệ hao mòn (%/năm)',
  accumulatedDepreciation: 'Hao mòn/khấu hao lũy kế (VNĐ)',
  remainingValue: 'Giá trị còn lại (VNĐ)',
  assignmentDecisionNumber: 'Số quyết định giao tài sản',
  depreciationStartDate: 'Ngày bắt đầu tính hao mòn',
  depreciationMonths: 'Thời gian sử dụng (tháng)',
  depreciationEndDate: 'Ngày kết thúc tính hao mòn',
  monthlyDepreciation: 'Mức hao mòn/khấu hao tháng (VNĐ)',
  disposalMethod: 'Hình thức xử lý',
  attachmentName: 'Tài liệu đính kèm',
  attachments: 'Tài liệu đính kèm',
};

export default function TransmissionAssetList() {
  const [data, setData] = useState<TransmissionAsset[]>([]);
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
  const [filters, setFilters] = useState<TransmissionAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<TransmissionAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<TransmissionAsset>();
  const [deleteTarget, setDeleteTarget] = useState<TransmissionAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<TransmissionAssetExploitation[]>([]);
  const [adjustmentRows, setAdjustmentRows] = useState<TransmissionAssetAdjustment[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  // ── History state (chuẩn /berth) ───────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<TransmissionAsset | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  const historyFieldCount = useMemo(
    () => (Array.isArray(historyRecords) ? historyRecords : []).length,
    [historyRecords]
  );

  const openHistory = useCallback(async (r: TransmissionAsset) => {
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    try {
      const d = await fetchTransmissionAssetHistory(r.id);
      const ch = Array.isArray(d?.changeHistory) ? d.changeHistory : [];
      setHistoryRecords(ch);
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const filteredHistoryRecords = useMemo(() => {
    return historyRecords.filter((rec) => {
      if (historySearch) {
        const s = historySearch.toLowerCase();
        const matchField = String(rec.fieldName || rec.changedField || '').toLowerCase().includes(s);
        const matchOld = String(rec.oldValue || rec.previousValue || '').toLowerCase().includes(s);
        const matchNew = String(rec.newValue || rec.value || '').toLowerCase().includes(s);
        if (!matchField && !matchOld && !matchNew) return false;
      }
      if (historyFrom && dayjs(rec.changedAt || rec.approvedDate).isBefore(dayjs(historyFrom), 'day')) {
        return false;
      }
      if (historyTo && dayjs(rec.changedAt || rec.approvedDate).isAfter(dayjs(historyTo), 'day')) {
        return false;
      }
      return true;
    });
  }, [historyRecords, historySearch, historyFrom, historyTo]);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchTransmissionAssets({ ...filters, page: page - 1, size: pageSize });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchTransmissionAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) =>
          fetchTransmissionAssets({ ...baseFilters, approvalStatus })
        ),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(
          STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])
        ),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản HT truyền dẫn.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
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
      .catch(() => toast.error('Không thể tải danh mục đơn vị hoặc hệ thống truyền dẫn.'));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    form.resetFields();
    form.setFieldsValue({
      assetType: 'Tài sản HT truyền dẫn',
      assetCondition: 'Tốt',
      usageStatus: 'Đang sử dụng',
      quantity: 1,
      quantityUnit: 'Bộ',
    });
    setAttachments([]);
  }, [form]);

  const openEdit = useCallback(
    (record: TransmissionAsset) => {
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
      fetchTransmissionAssetAttachments(record.id)
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
                  currentUser?.username ||
                  'Cán bộ quản lý',
                uploadedDate:
                  att.uploadedAt ||
                  (record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString()),
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
      toast.success(`Đã tải lên tệp: ${file.name}`);
    },
    [currentUser]
  );

  const handleDeleteAttachment = useCallback(
    (id: string) => {
      if (selected?.id && id.includes('-') && !id.startsWith('att-')) {
        deleteTransmissionAssetAttachment(selected.id, id).catch(() => {});
      }
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      toast.success('Đã xóa tệp đính kèm.');
    },
    [selected?.id]
  );

  const handleDownloadAttachment = useCallback(
    async (id: string, fileName: string) => {
      const att = attachments.find((a) => a.id === id);
      if (att?.originFileObj) {
        triggerBlobDownload(att.originFileObj, fileName || att.originFileObj.name);
        toast.success(`Đã tải xuống tệp: ${fileName}`);
        return;
      }
      if (att?.url && (att.url.startsWith('blob:') || att.url.startsWith('data:'))) {
        triggerBlobDownload(att.url, fileName || 'tai-lieu');
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
          const serverContentType = (res.headers && res.headers['content-type']) ? String(res.headers['content-type']) : '';
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
          await downloadTransmissionAssetAttachment(selected.id, id, fileName);
          toast.success(`Đã tải xuống tệp: ${fileName}`);
          return;
        } catch (err) {
          console.error('Download server error:', err);
        }
      }
      const dummyBlob = new Blob([`Tài liệu đính kèm hệ thống truyền dẫn: ${fileName}\nThời gian: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`], {
        type: resolveMimeType(fileName, 'text/plain;charset=utf-8'),
      });
      triggerBlobDownload(dummyBlob, fileName);
      toast.success(`Đã tải xuống tệp: ${fileName}`);
    },
    [attachments, selected?.id]
  );

  const openDetail = useCallback(async (record: TransmissionAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exploitations, adjustments, realAtts] = await Promise.all([
        fetchTransmissionExploitations(record.id).catch(() => []),
        fetchTransmissionAdjustments(record.id).catch(() => []),
        fetchTransmissionAssetAttachments(record.id).catch(() => []),
      ]);
      setExploitationRows(exploitations);
      setAdjustmentRows(adjustments);
      if (realAtts && realAtts.length > 0) {
        setAttachments(
          realAtts.map((att) => ({
            id: att.id,
            fileName: att.fileName,
            fileSize: att.fileSize,
            fileType: att.contentType,
            uploadedByName: att.uploadedByName || record.updatedByName || record.submittedByName || 'Cán bộ quản lý',
            uploadedDate: att.uploadedAt || (record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString()),
            filePath: `/v1/asset/transmission-assets/${record.id}/attachments/${att.id}/download`,
          }))
        );
      } else if (record.attachmentName) {
        setAttachments(
          record.attachmentName.split(',').map((name, i) => ({
            id: `att-${i}-${Date.now()}`,
            fileName: name.trim(),
            fileSize: 1024 * 512,
            uploadedByName: record.updatedByName || record.submittedByName || 'Cán bộ quản lý',
            uploadedDate: record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString(),
          }))
        );
      } else {
        setAttachments([]);
      }
    } catch {
      setExploitationRows([]);
      setAdjustmentRows([]);
      setAttachments([]);
    }
  }, []);

  const saveAsset = async (targetAction: string) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(targetAction);

      const attachmentName =
        attachments.length > 0 ? attachments.map((a) => a.fileName).join(', ') : undefined;

      const payload: TransmissionAssetPayload = {
        ...values,
        assetType: 'Tài sản HT truyền dẫn',
        constructionYear: values.constructionYear ? Number(values.constructionYear.format('YYYY')) : undefined,
        useDate: values.useDate?.format('YYYY-MM-DD'),
        declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
        depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
        depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
        attachmentName,
        approvalStatus: targetAction,
      };

      let savedAsset: TransmissionAsset;
      if (drawerMode === 'edit' && selected) {
        savedAsset = await updateTransmissionAsset(selected.id, payload);
      } else {
        savedAsset = await createTransmissionAsset(payload);
      }

      const targetAssetId = savedAsset?.id || selected?.id;
      const filesToUpload = attachments
        .map((a) => a.originFileObj)
        .filter((f): f is File => Boolean(f));
      if (targetAssetId && filesToUpload.length > 0) {
        try {
          await uploadTransmissionAssetAttachments(targetAssetId, filesToUpload);
        } catch (attErr) {
          console.error('Upload attachments error:', attErr);
        }
      }

      toast.success(
        targetAction === 'DRAFT'
          ? 'Đã lưu tạm tài sản HT truyền dẫn.'
          : targetAction === 'PENDING_APPROVAL'
            ? 'Đã lưu và gửi phê duyệt tài sản HT truyền dẫn.'
            : 'Đã lưu và phê duyệt tài sản HT truyền dẫn.'
      );
      setDrawerMode(undefined);
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause))
        toast.error(getErrorMessage(cause, 'Không thể lưu tài sản HT truyền dẫn.'));
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
        await createTransmissionExploitation(selected.id, {
          ...values,
          exploitationDeadline: values.exploitationDeadline?.format('YYYY-MM-DD'),
        });
      } else {
        await createTransmissionAdjustment(selected.id, {
          ...values,
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
        key: 'usingOrgUnitId',
        label: 'Đơn vị sử dụng',
        type: 'treeSelect',
        organizations,
        placeholder: 'Chọn đơn vị...',
      },
      {
        key: 'transmissionId',
        label: 'Mã thiết bị',
        type: 'select',
        placeholder: 'Chọn thiết bị truyền dẫn',
        options: transmissions.map((item) => ({
          value: item.id,
          label: `${item.deviceCode} - ${item.deviceName}`,
        })),
      },
      {
        key: 'assetType',
        label: 'Loại tài sản',
        type: 'select',
        disabled: true,
        defaultValue: 'Tài sản HT truyền dẫn',
        options: [{ value: 'Tài sản HT truyền dẫn', label: 'Tài sản HT truyền dẫn' }],
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
        options: ASSET_CONDITIONS.map((value) => ({ value, label: value })),
      },
      {
        key: 'updatedRange',
        label: 'Ngày cập nhật',
        type: 'dateRange',
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

  const tableOptions = useMemo<TableOption<TransmissionAsset>>(
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
          title: 'HỆ THỐNG TRUYỀN DẪN TRỰC THUỘC',
          dataIndex: 'transmissionId',
          type: TableColumnType.Text,
          width: 240,
          allowSort: true,
          valueRef: (r) => {
            const sid = r.transmissionId;
            const item = sid ? transmissionMap.get(sid) : undefined;
            if (item) return `${item.code} - ${item.name}`;
            return r.transmissionId || '—';
          },
        },
        {
          title: 'LOẠI TÀI SẢN',
          dataIndex: 'assetType',
          type: TableColumnType.Text,
          width: 180,
          allowSort: true,
          render: (v) => (v as string) || 'Tài sản HT truyền dẫn',
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
      actions: (record: TransmissionAsset) => [
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
          key: 'exploit',
          label: 'Khai thác tài sản',
          icon: <RocketOutlined />,
          onClick: () => {
            setSelected(record);
            setOperationMode('exploit');
            operationForm.resetFields();
          },
        },
        {
          key: 'increase',
          label: 'Tăng nguyên giá',
          icon: <PlusCircleOutlined />,
          onClick: () => {
            setSelected(record);
            setOperationMode('increase');
            operationForm.resetFields();
          },
        },
        {
          key: 'decrease',
          label: 'Giảm nguyên giá',
          icon: <MinusCircleOutlined />,
          onClick: () => {
            setSelected(record);
            setOperationMode('decrease');
            operationForm.resetFields();
          },
        },
        {
          key: 'history',
          label: 'Lịch sử',
          icon: <HistoryOutlined />,
          onClick: () => void openHistory(record),
        },
        ...(record.approvalStatus === 'DRAFT'
          ? [
              {
                key: 'delete',
                label: 'Xóa',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => setDeleteTarget(record),
              },
            ]
          : []),
      ],
    }),
    [openDetail, openEdit, openHistory, operationForm, orgName, transmissionMap]
  );

  const headerActions: ScreenHeaderAction[] = useMemo(
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

  const customTokens = useMemo(
    () => ({
      ...themeTokenChk,
      fontSizeMd: 13.5,
    }),
    []
  );

  return (
    <ThemeTokenProvider tokens={customTokens}>
      <div
        className="transmission-asset-page-wrapper"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản HT truyền dẫn' },
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
          loading={loading}
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
                setDraftFilters(v as TransmissionAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] })
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

        {/* ── Create / Edit Drawer (DynamicFormSidebar) ─────────────── */}
        <TransmissionAssetForm
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
        <TransmissionAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          transmissionMap={transmissionMap}
          exploitationRows={exploitationRows}
          adjustmentRows={adjustmentRows}
          attachments={attachments}
          onDownloadAttachment={handleDownloadAttachment}
        />

        {/* ── Operations Drawer (DynamicFormSidebar) ─────────────────────── */}
        <TransmissionAssetOperationForm
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
          itemType="tài sản HT truyền dẫn"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={() => {
            if (!deleteTarget) return;
            setSaving(true);
            void deleteTransmissionAsset(deleteTarget.id)
              .then(() => {
                toast.success('Đã xóa tài sản HT truyền dẫn.');
                setDeleteTarget(undefined);
                return loadData();
              })
              .catch((cause: unknown) =>
                toast.error(getErrorMessage(cause, 'Không thể xóa tài sản.'))
              )
              .finally(() => setSaving(false));
          }}
        />
        {/* ── History Drawer (chuẩn /berth) ────────────────────────── */}
        <AppDrawer
          width="min(880px, 96vw)"
          rootClassName="berth-drawer-scope"
          className="berth-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  {historyTarget ? `Lịch sử thay đổi — ${historyTarget.assetName}` : 'Lịch sử thay đổi'}
                </span>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                  Tổng cộng {historyFieldCount}
                </span>
              </Space>
            </div>
          }
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
          }}>
          <div style={{ flexShrink: 0 }}>
            {!historyLoading && (
              <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
                <Input
                  placeholder="Tìm kiếm nội dung thay đổi..."
                  allowClear
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
                />
                <DatePicker
                  placeholder="Từ ngày"
                  value={historyFrom ? dayjs(historyFrom) : null}
                  onChange={d => setHistoryFrom(d ? d.format('YYYY-MM-DD') : '')}
                  style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                  format="DD/MM/YYYY"
                />
                <DatePicker
                  placeholder="Đến ngày"
                  value={historyTo ? dayjs(historyTo) : null}
                  onChange={d => setHistoryTo(d ? d.format('YYYY-MM-DD') : '')}
                  style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                  format="DD/MM/YYYY"
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  style={{
                    borderRadius: radiusPill,
                    height: 40,
                    fontSize: fontSizeMd,
                    background: actionPrimary,
                    borderColor: actionPrimary,
                  }}
                >
                  Tìm kiếm
                </Button>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {historyLoading ? (
              <LoadingSkeleton rows={5} />
            ) : filteredHistoryRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
              </div>
            ) : (
              renderStandardHistoryCards({
                records: filteredHistoryRecords,
                fieldLabels: TRANSMISSION_ASSET_FIELD_LABELS,
              })
            )}
          </div>
        </AppDrawer>
      </div>
    </ThemeTokenProvider>
  );
}
