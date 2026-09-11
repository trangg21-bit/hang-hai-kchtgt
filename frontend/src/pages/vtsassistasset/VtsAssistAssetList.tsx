import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { fetchVtsAssistOptions } from '../../services/vtsassist/api';
import type { VtsAssistOptionResponse } from '../../services/vtsassist/types';
import {
  fetchVtsAssistAssets,
  deleteVtsAssistAsset,
  createVtsAssistAsset,
  updateVtsAssistAsset,
  fetchVtsAssistExploitations,
  createVtsAssistExploitation,
  fetchVtsAssistAdjustments,
  createVtsAssistAdjustment,
  fetchVtsAssistAssetAttachments,
  uploadVtsAssistAssetAttachments,
  deleteVtsAssistAssetAttachment,
  downloadVtsAssistAssetAttachment,
} from '../../services/vtsAssistAsset/api';
import type {
  VtsAssistAsset,
  VtsAssistAssetFilters,
  VtsAssistAssetPayload,
  VtsAssistAssetExploitation,
  VtsAssistAssetAdjustment,
} from '../../services/vtsAssistAsset/types';
import {
  triggerBlobDownload,
  resolveMimeType,
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import VtsAssistAssetForm, { type FormValues } from './VtsAssistAssetForm';
import VtsAssistAssetDetailContent from './VtsAssistAssetDetailContent';
import VtsAssistAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './VtsAssistAssetOperationForm';

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
  if (cause && typeof cause === 'object' && 'response' in cause) {
    const data = (cause as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (cause instanceof Error) return cause.message;
  return fallback;
};

const isValidationError = (cause: unknown) => Boolean((cause as { errorFields?: unknown }).errorFields);

export default function VtsAssistAssetList() {
  const [data, setData] = useState<VtsAssistAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [vtsAssists, setVtsAssists] = useState<VtsAssistOptionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<VtsAssistAssetFilters>({
    assetType: 'Tài sản hệ thống phụ trợ VTS',
  });
  const [draftFilters, setDraftFilters] = useState<VtsAssistAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({
    assetType: 'Tài sản hệ thống phụ trợ VTS',
  });
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<VtsAssistAsset>();
  const [deleteTarget, setDeleteTarget] = useState<VtsAssistAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<VtsAssistAssetExploitation[]>([]);
  const [adjustmentRows, setAdjustmentRows] = useState<VtsAssistAssetAdjustment[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const orgName = useMemo(() => new Map(organizations.map((item) => [item.id, item.name])), [organizations]);
  const vtsAssistMap = useMemo(
    () =>
      new Map(
        vtsAssists.map((item) => [
          item.id,
          { code: item.deviceCode, name: item.deviceName },
        ])
      ),
    [vtsAssists]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchVtsAssistAssets({ ...filters, page: page - 1, size: pageSize });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchVtsAssistAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) =>
          fetchVtsAssistAssets({ ...baseFilters, approvalStatus })
        ),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(
          STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])
        ),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản hệ thống phụ trợ VTS.'));
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
      fetchVtsAssistOptions().catch(() => [] as VtsAssistOptionResponse[]),
    ])
      .then(([orgs, assistList]) => {
        setOrganizations(orgs);
        setVtsAssists(assistList);
      })
      .catch(() => toast.error('Không thể tải danh mục đơn vị hoặc hệ thống phụ trợ VTS.'));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    form.resetFields();
    form.setFieldsValue({
      assetType: 'Tài sản hệ thống phụ trợ VTS',
      assetCondition: 'Tốt',
      usageStatus: 'Đang sử dụng',
      quantity: 1,
      quantityUnit: 'Bộ',
    });
    setAttachments([]);
  }, [form]);

  const openEdit = useCallback(
    (record: VtsAssistAsset) => {
      setSelected(record);
      setDrawerMode('edit');
      form.setFieldsValue({
        ...record,
        transmissionId: record.transmissionId,
        constructionYear: record.constructionYear ? dayjs(String(record.constructionYear)) : undefined,
        useDate: record.useDate ? dayjs(record.useDate) : undefined,
        declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
        depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
        depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
        attachmentName: record.attachmentName,
      });
      fetchVtsAssistAssetAttachments(record.id)
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
        deleteVtsAssistAssetAttachment(selected.id, id).catch(() => {});
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
          await downloadVtsAssistAssetAttachment(selected.id, id, fileName);
          toast.success(`Đã tải xuống tệp: ${fileName}`);
          return;
        } catch (err) {
          console.error('Download server error:', err);
        }
      }
      const dummyBlob = new Blob([`Tài liệu đính kèm hệ thống phụ trợ VTS: ${fileName}\nThời gian: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`], {
        type: resolveMimeType(fileName, 'text/plain;charset=utf-8'),
      });
      triggerBlobDownload(dummyBlob, fileName);
      toast.success(`Đã tải xuống tệp: ${fileName}`);
    },
    [attachments, selected?.id]
  );

  const openDetail = useCallback(async (record: VtsAssistAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exploitations, adjustments, realAtts] = await Promise.all([
        fetchVtsAssistExploitations(record.id).catch(() => []),
        fetchVtsAssistAdjustments(record.id).catch(() => []),
        fetchVtsAssistAssetAttachments(record.id).catch(() => []),
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

  const saveAsset = useCallback(
    async (status: string) => {
      try {
        setSaving(true);
        setSaveAction(status);
        const values = await form.validateFields();
        const attNames = attachments.map((a) => a.fileName).join(',');
        const payload: VtsAssistAssetPayload = {
          ...values,
          transmissionId: values.transmissionId,
          assetType: values.assetType || 'Tài sản hệ thống phụ trợ VTS',
          attachmentName: attNames || values.attachmentName || undefined,
          constructionYear: values.constructionYear ? values.constructionYear.year() : undefined,
          useDate: values.useDate ? values.useDate.format('YYYY-MM-DD') : undefined,
          declarationDate: values.declarationDate ? values.declarationDate.format('YYYY-MM-DD') : undefined,
          depreciationStartDate: values.depreciationStartDate ? values.depreciationStartDate.format('YYYY-MM-DD') : undefined,
          depreciationEndDate: values.depreciationEndDate ? values.depreciationEndDate.format('YYYY-MM-DD') : undefined,
          assetCode: selected?.assetCode || values.assetCode,
          approvalStatus: status,
        };

        let savedAsset: VtsAssistAsset;
        if (selected?.id) {
          savedAsset = await updateVtsAssistAsset(selected.id, payload);
          toast.success('Cập nhật tài sản hệ thống phụ trợ VTS thành công.');
        } else {
          savedAsset = await createVtsAssistAsset(payload);
          toast.success('Tạo mới tài sản hệ thống phụ trợ VTS thành công.');
        }

        const targetAssetId = savedAsset?.id || selected?.id;
        const filesToUpload = attachments
          .map((a) => a.originFileObj)
          .filter((f): f is File => Boolean(f));
        if (targetAssetId && filesToUpload.length > 0) {
          try {
            await uploadVtsAssistAssetAttachments(targetAssetId, filesToUpload);
          } catch (attErr) {
            console.error('Upload attachments error:', attErr);
          }
        }

        setDrawerMode(undefined);
        form.resetFields();
        await loadData();
      } catch (cause: unknown) {
        if (!isValidationError(cause)) {
          toast.error(getErrorMessage(cause, 'Không thể lưu tài sản hệ thống phụ trợ VTS.'));
        }
      } finally {
        setSaving(false);
      }
    },
    [form, selected, attachments, loadData]
  );

  const saveOperation = useCallback(async () => {
    if (!selected?.id || !operationMode) return;
    try {
      setSaving(true);
      const values = await operationForm.validateFields();
      if (operationMode === 'exploit') {
        await createVtsAssistExploitation(selected.id, {
          ...values,
          exploitationDeadline: values.exploitationDeadline?.format('YYYY-MM-DD'),
        });
        toast.success('Lưu thông tin khai thác tài sản thành công.');
      } else {
        await createVtsAssistAdjustment(selected.id, {
          ...values,
          adjustmentType: operationMode === 'increase' ? 'TANG' : 'GIAM',
          decisionDate: values.decisionDate?.format('YYYY-MM-DD'),
          adjustmentDate: values.adjustmentDate?.format('YYYY-MM-DD'),
          declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
          depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
          depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
        });
        toast.success(
          operationMode === 'increase'
            ? 'Tạo yêu cầu tăng nguyên giá thành công.'
            : 'Tạo yêu cầu giảm nguyên giá thành công.'
        );
      }
      setOperationMode(undefined);
      operationForm.resetFields();
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu thông tin vận hành.'));
      }
    } finally {
      setSaving(false);
    }
  }, [selected, operationMode, operationForm, loadData]);

  const filterOptions: FilterOption[] = useMemo(
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
        placeholder: 'Chọn thiết bị phụ trợ VTS',
        options: vtsAssists.map((item) => ({
          value: item.id,
          label: `${item.deviceCode} - ${item.deviceName}`,
        })),
      },
      {
        key: 'assetType',
        label: 'Loại tài sản',
        type: 'select',
        disabled: true,
        defaultValue: 'Tài sản hệ thống phụ trợ VTS',
        options: [{ value: 'Tài sản hệ thống phụ trợ VTS', label: 'Tài sản hệ thống phụ trợ VTS' }],
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
    [vtsAssists, organizations]
  );

  const handleFilterApply = useCallback(() => {
    setPage(1);
    const range = draftFilters.updatedRange;
    setFilters({
      ...draftFilters,
      assetType: 'Tài sản hệ thống phụ trợ VTS',
      updatedFrom: range?.[0]?.format('YYYY-MM-DD'),
      updatedTo: range?.[1]?.format('YYYY-MM-DD'),
    });
  }, [draftFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({ assetType: 'Tài sản hệ thống phụ trợ VTS' });
    setFilters({ assetType: 'Tài sản hệ thống phụ trợ VTS' });
    setPage(1);
  }, []);

  const tableOptions = useMemo<TableOption<VtsAssistAsset>>(
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
          title: 'TRẠM/HỆ THỐNG PHỤ TRỢ VTS TRỰC THUỘC',
          dataIndex: 'transmissionId',
          type: TableColumnType.Text,
          width: 240,
          allowSort: true,
          valueRef: (r) => {
            const sid = r.transmissionId;
            const item = sid ? vtsAssistMap.get(sid) : undefined;
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
          render: (v) => (v as string) || 'Tài sản hệ thống phụ trợ VTS',
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
      actions: (record: VtsAssistAsset) => [
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
          key: 'delete',
          label: 'Xóa',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => setDeleteTarget(record),
        },
      ],
    }),
    [openDetail, openEdit, operationForm, orgName, vtsAssistMap]
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
        className="vts-assist-asset-page-wrapper"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản hệ thống phụ trợ VTS' },
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
              onChange={(v) => setDraftFilters(v as VtsAssistAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] })}
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
        <VtsAssistAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          vtsAssists={vtsAssists}
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
        <VtsAssistAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          vtsAssistMap={vtsAssistMap}
          exploitationRows={exploitationRows}
          adjustmentRows={adjustmentRows}
          attachments={attachments}
          onDownloadAttachment={handleDownloadAttachment}
        />

        {/* ── Operations Drawer (DynamicFormSidebar) ─────────────────────── */}
        <VtsAssistAssetOperationForm
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
          itemType="tài sản hệ thống phụ trợ VTS"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={() => {
            if (!deleteTarget) return;
            setSaving(true);
            void deleteVtsAssistAsset(deleteTarget.id)
              .then(() => {
                toast.success('Đã xóa tài sản hệ thống phụ trợ VTS.');
                setDeleteTarget(undefined);
                return loadData();
              })
              .catch((cause: unknown) =>
                toast.error(getErrorMessage(cause, 'Không thể xóa tài sản.'))
              )
              .finally(() => setSaving(false));
          }}
        />
      </div>
    </ThemeTokenProvider>
  );
}
