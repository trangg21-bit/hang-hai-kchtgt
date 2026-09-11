import { useCallback, useEffect, useMemo, useState } from 'react';
import { Form } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
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
import { pierCRUD } from '../../services/portService';
import type { Pier } from '../../types/port';
import {
  createKhaiThac,
  createAssetDecrease,
  createAssetIncrease,
  createPierAsset,
  deletePierAsset,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchKhaiThacList,
  fetchPierAssets,
  updatePierAsset,
  uploadInfraAssetAttachments,
  fetchInfraAssetAttachments,
  deleteInfraAssetAttachment,
} from '../../services/assetmovement/api';
import api from '../../services/api';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
  PierAsset,
  PierAssetFilters,
  PierAssetPayload,
} from '../../services/assetmovement/types';
import {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import { triggerBlobDownload } from '../../components/shared/infrastructureAttachmentUtils';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import PierAssetForm, { type FormValues } from './PierAssetForm';
import PierAssetDetailContent from './PierAssetDetailContent';
import PierAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './PierAssetOperationForm';

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

export default function PierAssetList() {
  const [data, setData] = useState<PierAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [piers, setPiers] = useState<Pier[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<PierAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<PierAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<PierAsset>();
  const [deleteTarget, setDeleteTarget] = useState<PierAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const orgName = useMemo(() => new Map(organizations.map(item => [item.id, item.name])), [organizations]);
  const pierMap = useMemo(() => new Map(piers.map(item => [item.id, item])), [piers]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchPierAssets({ ...filters, page: page - 1, size: pageSize });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, sortBy: undefined, sortDir: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchPierAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map(approvalStatus => fetchPierAssets({ ...baseFilters, approvalStatus })),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản cầu cảng.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void Promise.all([organizationService.getAll(), pierCRUD.findAll({ page: 1, size: 5000 })])
      .then(([orgs, pierPage]) => {
        setOrganizations(orgs);
        setPiers(pierPage.data);
      })
      .catch(() => toast.error('Không thể tải danh mục đơn vị hoặc cầu cảng.'));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    form.resetFields();
    form.setFieldsValue({ assetType: 'PIER', status: 'MANAGED' });
    setAttachments([]);
    setExploitationRows([]);
    setIncreaseRows([]);
    setDecreaseRows([]);
  }, [form]);

  const openEdit = useCallback(async (record: PierAsset) => {
    setSelected(record);
    setDrawerMode('edit');
    form.resetFields();
    form.setFieldsValue({
      ...record,
      constructionYear: record.constructionYear ? dayjs(`${record.constructionYear}-01-01`) : undefined,
      useDate: record.useDate ? dayjs(record.useDate) : undefined,
      declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
      depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
      depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
    });

    fetchInfraAssetAttachments(record.id)
      .then((realAtts) => {
        if (realAtts && realAtts.length > 0) {
          setAttachments(
            realAtts.map((att) => ({
              id: att.id,
              fileName: att.fileName,
              fileSize: att.fileSize,
              fileType: att.contentType,
              uploadedByName: att.uploadedByName || record.updatedByName || record.submittedByName || 'Cán bộ quản lý',
              uploadedDate: att.uploadedAt || (record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString()),
              filePath: `/v1/asset/infra-assets/${record.id}/attachments/${att.id}/download`,
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
      })
      .catch(() => {
        if (record.attachmentName) {
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
      });

    try {
      const [exploitation, increases, decreases] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id, page: 0, size: 100 }),
        fetchAssetIncreaseList({ assetId: record.id, page: 0, size: 100 }),
        fetchAssetDecreaseList({ assetId: record.id, page: 0, size: 100 }),
      ]);
      setExploitationRows(exploitation.content);
      setIncreaseRows(increases.content);
      setDecreaseRows(decreases.content);
    } catch {
      setExploitationRows([]);
      setIncreaseRows([]);
      setDecreaseRows([]);
    }
  }, [form]);

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
    if (selected?.id && id.includes('-')) {
      deleteInfraAssetAttachment(selected.id, id).catch(() => {});
    }
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, [selected]);

  const handleDownloadAttachment = useCallback(async (id: string, fileName: string) => {
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
        const contentType = res.headers?.['content-type'] || 'application/octet-stream';
        const blob = new Blob([res.data], { type: contentType });
        triggerBlobDownload(blob, fileName || 'tai-lieu');
        toast.success(`Đã tải xuống tệp: ${fileName}`);
        return;
      } catch (err) {
        console.error('Download error:', err);
        toast.error(`Không thể tải xuống tệp tin "${fileName}": Lỗi máy chủ hoặc tệp không tồn tại.`);
        return;
      }
    }
    toast.error(`Không tìm thấy đường dẫn tệp tin đính kèm "${fileName || 'tài liệu'}" trên máy chủ để tải xuống.`);
  }, [attachments]);

  const openDetail = useCallback(async (record: PierAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exploitation, increases, decreases] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id, page: 0, size: 100 }),
        fetchAssetIncreaseList({ assetId: record.id, page: 0, size: 100 }),
        fetchAssetDecreaseList({ assetId: record.id, page: 0, size: 100 }),
      ]);
      setExploitationRows(exploitation.content);
      setIncreaseRows(increases.content);
      setDecreaseRows(decreases.content);
    } catch {
      setExploitationRows([]);
      setIncreaseRows([]);
      setDecreaseRows([]);
    }
  }, []);

  const saveAsset = async (targetAction: string) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(targetAction);

      const attachmentName = attachments.length > 0
        ? attachments.map((a) => a.fileName).join(', ')
        : undefined;

      const payload: PierAssetPayload = {
        ...values,
        assetType: 'PIER',
        constructionYear: values.constructionYear ? Number(values.constructionYear.format('YYYY')) : undefined,
        useDate: values.useDate?.format('YYYY-MM-DD'),
        declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
        depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
        depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
        attachmentName,
        approvalStatus: targetAction,
      };

      let savedAsset: PierAsset;
      if (drawerMode === 'edit' && selected) {
        savedAsset = await updatePierAsset(selected.id, payload);
      } else {
        savedAsset = await createPierAsset(payload);
      }

      const targetAssetId = savedAsset?.id || selected?.id;
      const filesToUpload = attachments
        .map((a) => a.originFileObj)
        .filter((f): f is File => f instanceof File);
      if (filesToUpload.length > 0 && targetAssetId) {
        try {
          await uploadInfraAssetAttachments(targetAssetId, filesToUpload);
        } catch (uploadErr) {
          console.error('Upload attachments error:', uploadErr);
        }
      }

      toast.success(
        targetAction === 'DRAFT'
          ? 'Đã lưu tạm tài sản cầu cảng.'
          : targetAction === 'PENDING_APPROVAL'
            ? 'Đã lưu và gửi phê duyệt tài sản cầu cảng.'
            : 'Đã lưu và phê duyệt tài sản cầu cảng.',
      );
      setDrawerMode(undefined);
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) toast.error(getErrorMessage(cause, 'Không thể lưu tài sản cầu cảng.'));
    } finally {
      setSaving(false);
    }
  };

  const saveOperation = async () => {
    if (!selected || !operationMode) return;
    try {
      const values = await operationForm.validateFields();
      const origVal = values.originalValue;
      if (operationMode !== 'exploit' && origVal == null) {
        toast.error('Vui lòng nhập nguyên giá sau điều chỉnh.');
        return;
      }
      if (operationMode === 'increase' && origVal! <= (selected.originalValue || 0)) {
        toast.error('Nguyên giá sau điều chỉnh phải lớn hơn nguyên giá hiện tại.');
        return;
      }
      if (operationMode === 'decrease' && origVal! >= (selected.originalValue || 0)) {
        toast.error('Nguyên giá sau điều chỉnh phải nhỏ hơn nguyên giá hiện tại.');
        return;
      }
      setSaving(true);
      const accDep = Number(values.accumulatedDepreciation) || 0;
      const remAfter = origVal != null ? Math.max(0, origVal - accDep) : undefined;
      const depMonths = Number(values.depreciationMonths) || 0;
      const monthDep =
        origVal != null && depMonths > 0 ? Math.round((origVal / depMonths) * 100) / 100 : undefined;

      const adjustmentDetails: AssetValueAdjustmentDetails = {
        ...values,
        decisionDate: values.decisionDate?.format('YYYY-MM-DD'),
        adjustmentDate: values.adjustmentDate?.format('YYYY-MM-DD'),
        declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
        depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
        depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
        adjustmentNotes: values.notes,
        valueUnit: 'VNĐ',
        originalValueBefore: selected.originalValue,
        originalValueAfter: origVal,
        remainingValueBefore: selected.remainingValue,
        remainingValueAfter: remAfter,
        monthlyDepreciation: monthDep,
      };

      if (operationMode === 'exploit') {
        await createKhaiThac({
          assetId: selected.id,
          assetName: selected.assetName,
          exploitationYear: values.exploitationDeadline ? dayjs(values.exploitationDeadline).year() : dayjs().year(),
          doanhThu: values.totalRevenue || 0,
          depreciation: values.relatedCosts || 0,
          description: values.notes || '',
          operatorOrgUnitId: values.operatorOrgUnitId,
          assetCategory: selected.assetName,
          unitOfMeasure: values.unitOfMeasure,
          quantity: values.quantity,
          exploitationDeadline: values.exploitationDeadline?.format('YYYY-MM-DD'),
          totalRevenue: values.totalRevenue,
          relatedCosts: values.relatedCosts,
          stateBudgetPayment: values.stateBudgetPayment,
          projectAmount: values.projectAmount,
        });
      } else if (operationMode === 'increase') {
        await createAssetIncrease({
          assetId: selected.id,
          assetName: selected.assetName,
          quantity: 1,
          unitOfMeasure: 'VNĐ',
          increaseCode: values.decisionNumber || '',
          reason: values.notes || '',
          adjustmentDetails,
        });
      } else {
        await createAssetDecrease({
          assetId: selected.id,
          assetName: selected.assetName,
          quantity: 1,
          unitOfMeasure: 'VNĐ',
          decreaseReason: values.adjustmentReason || '',
          reason: values.notes || '',
          adjustmentDetails,
        });
      }
      toast.success('Đã lưu thông tin.');
      setOperationMode(undefined);
      operationForm.resetFields();
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) toast.error(getErrorMessage(cause, 'Không thể lưu thông tin.'));
    } finally {
      setSaving(false);
    }
  };

  const filterOptions = useMemo<FilterOption[]>(() => [
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
      key: 'pierId',
      label: 'Mã cầu cảng',
      type: 'select',
      placeholder: 'Chọn cầu cảng',
      options: piers.map((item) => ({
        value: item.id,
        label: `${item.pierCode} - ${item.pierName}`,
      })),
    },
    {
      key: 'assetCondition',
      label: 'Tình trạng tài sản',
      type: 'select',
      placeholder: 'Chọn tình trạng',
      options: ASSET_CONDITIONS.map((value) => ({ value, label: value })),
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
      key: 'updatedRange',
      label: 'Ngày cập nhật',
      type: 'dateRange',
    },
  ], [piers, organizations]);

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

  const tableOptions = useMemo<TableOption<PierAsset>>(() => ({
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
        valueRef: (r) => r.usingOrgUnitId ? orgName.get(r.usingOrgUnitId) : undefined,
      },
      {
        title: 'MÃ CẦU CẢNG',
        dataIndex: 'pierId',
        type: TableColumnType.Text,
        width: 190,
        allowSort: true,
        valueRef: (r) => r.pierId ? pierMap.get(r.pierId)?.pierCode : undefined,
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 160,
        allowSort: true,
        render: () => 'Tài sản cầu cảng',
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
    actions: (record: PierAsset) => [
      { key: 'detail', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => void openDetail(record) },
      { key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => openEdit(record) },
      { key: 'exploit', label: 'Khai thác tài sản', icon: <RocketOutlined />, onClick: () => { setSelected(record); setOperationMode('exploit'); operationForm.resetFields(); } },
      { key: 'increase', label: 'Tăng nguyên giá', icon: <PlusCircleOutlined />, onClick: () => { setSelected(record); setOperationMode('increase'); operationForm.resetFields(); } },
      { key: 'decrease', label: 'Giảm nguyên giá', icon: <MinusCircleOutlined />, onClick: () => { setSelected(record); setOperationMode('decrease'); operationForm.resetFields(); } },
      { key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => setDeleteTarget(record) },
    ],
  }), [pierMap, openDetail, openEdit, operationForm, orgName]);

  const headerActions: ScreenHeaderAction[] = useMemo(() => [
    { key: 'create', label: 'Thêm mới', icon: <PlusOutlined />, variant: 'primary', onClick: openCreate },
  ], [openCreate]);

  const customTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  return (
    <ThemeTokenProvider tokens={customTokens}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản cầu cảng' },
          ]}
          actions={headerActions}
        />

        <FilterTableLayout
          hideFilterToggle
          statusTabsNode={
            <CommonStatusTabs
              counts={statusCounts}
              activeKey={filters.approvalStatus || 'all'}
              onChange={(_key, queryStatus) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, approvalStatus: queryStatus }));
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
              values={draftFilters}
              onChange={(nextFilters) => setDraftFilters(nextFilters as typeof draftFilters)}
            />
          }
        >
          <CommonTable<PierAsset>
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
              setFilters(current => ({
                ...current,
                sortBy: order ? field : undefined,
                sortDir: order === 'ascend' ? 'ASC' : order === 'descend' ? 'DESC' : undefined,
              }));
            }}
          />
        </FilterTableLayout>

        <PierAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          piers={piers}
          attachments={attachments}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
          orgName={(id) => orgName.get(id || '') || ''}
          saving={saving}
          saveAction={saveAction}
          onClose={() => setDrawerMode(undefined)}
          onSave={saveAsset}
          onUploadAttachment={handleUploadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onDownloadAttachment={handleDownloadAttachment}
        />

        <PierAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          pierMap={pierMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        <PierAssetOperationForm
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

        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          title="Xác nhận xóa tài sản cầu cảng"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          description="Thao tác này không thể hoàn tác."
          onCancel={() => setDeleteTarget(undefined)}
          onConfirm={async () => {
            if (!deleteTarget) return;
            try {
              await deletePierAsset(deleteTarget.id);
              toast.success('Xóa tài sản cầu cảng thành công.');
              setDeleteTarget(undefined);
              await loadData();
            } catch (cause: unknown) {
              toast.error(getErrorMessage(cause, 'Không thể xóa tài sản cầu cảng.'));
            }
          }}
        />
      </div>
    </ThemeTokenProvider>
  );
}
