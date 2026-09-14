import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, Space } from 'antd';
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
  SearchOutlined,
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
import AppDrawer from '../../components/shared/AppDrawer';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import { organizationService, type Organization } from '../../services/organizationService';
import { transferAreaCRUD } from '../../services/portService';
import type { TransferArea } from '../../types/port';
import {
  createKhaiThac,
  createAssetDecrease,
  createAssetIncrease,
  createTransferAreaAsset,
  deleteTransferAreaAsset,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchInfraAssetHistory,
  fetchKhaiThacList,
  fetchTransferAreaAssets,
  updateTransferAreaAsset,
} from '../../services/assetmovement/api';
import { renderStandardHistoryCards, isBlankOrDash, DEFAULT_IGNORED_FIELDS } from '../../utils/changeHistoryRenderer';
import { formatHistoryNumber } from '../../utils/numFmt';
import { documentApi } from '../../app/document/api';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
  TransferAreaAsset,
  TransferAreaAssetFilters,
  TransferAreaAssetPayload,
} from '../../services/assetmovement/types';
import {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import { triggerBlobDownload } from '../../components/shared/infrastructureAttachmentUtils';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import {
  colors,
  borderDefault,
  radiusPill,
  spaceSm,
  spaceMd,
  spaceXl,
  fontSizeMd,
  fontSizeLg,
  fontWeightBold,
  textTertiary,
  actionPrimary,
  drawerTitleStyle,
} from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import TransferAreaAssetForm, { type FormValues } from './TransferAreaAssetForm';
import TransferAreaAssetDetailContent from './TransferAreaAssetDetailContent';
import TransferAreaAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './TransferAreaAssetOperationForm';

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

const TRANSFER_AREA_ASSET_FIELD_LABELS: Record<string, string> = {
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  orgUnitId: 'Đơn vị quản lý',
  usingOrgUnitId: 'Đơn vị sử dụng',
  transferAreaId: 'Mã khu chuyển tải',
  dikeRevetmentId: 'Mã đê/kè',
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

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) => Boolean((cause as { errorFields?: unknown }).errorFields);

export default function TransferAreaAssetList() {
  const [data, setData] = useState<TransferAreaAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [transferAreas, setTransferAreas] = useState<TransferArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<TransferAreaAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<TransferAreaAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<TransferAreaAsset>();
  const [deleteTarget, setDeleteTarget] = useState<TransferAreaAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const orgName = useMemo(() => new Map(organizations.map((item) => [item.id, item.name])), [organizations]);
  const transferAreaMap = useMemo(() => new Map(transferAreas.map((item) => [item.id, item])), [transferAreas]);

  // ── History state (chuẩn /berth) ───────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<TransferAreaAsset | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  const openHistory = useCallback(async (r: TransferAreaAsset) => {
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    try {
      const d = await fetchInfraAssetHistory(r.id);
      const ch = Array.isArray(d?.changeHistory) ? d.changeHistory : [];
      setHistoryRecords(ch);
    } catch {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const filteredHistoryRecords = useMemo(() => {
    return historyRecords.filter((rec) => {
      if (DEFAULT_IGNORED_FIELDS.has(rec.changedField)) return false;
      if (historySearch) {
        const s = historySearch.toLowerCase();
        const fName = (rec.changedField || '').toLowerCase();
        const oVal = String(rec.oldValue || '').toLowerCase();
        const nVal = String(rec.newValue || '').toLowerCase();
        if (!fName.includes(s) && !oVal.includes(s) && !nVal.includes(s)) return false;
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

  const historyFieldCount = useMemo(
    () => filteredHistoryRecords.length,
    [filteredHistoryRecords]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchTransferAreaAssets({ ...filters, page: page - 1, size: pageSize });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, sortBy: undefined, sortDir: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchTransferAreaAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) => fetchTransferAreaAssets({ ...baseFilters, approvalStatus })),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản khu chuyển tải.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void Promise.all([organizationService.getAll(), transferAreaCRUD.findAll({ page: 1, size: 5000 })])
      .then(([orgs, areaPage]) => {
        setOrganizations(orgs);
        setTransferAreas(areaPage.data);
      })
      .catch(() => toast.error('Không thể tải danh mục đơn vị hoặc khu chuyển tải.'));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    form.resetFields();
    form.setFieldsValue({ assetType: 'TRANSFER_AREA', status: 'MANAGED' } as unknown as FormValues);
    setAttachments([]);
    setExploitationRows([]);
    setIncreaseRows([]);
    setDecreaseRows([]);
  }, [form]);

  const openEdit = useCallback((record: TransferAreaAsset) => {
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
    // Load attachments từ backend (có minioKey để download đúng)
    setAttachments([]);
    void documentApi.listByEntity('transfer-area', record.id).then((res) => {
      setAttachments(
        res.data.map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          fileType: doc.mimeType,
          uploadedByName: doc.uploadedBy,
          uploadedDate: doc.createdAt,
          minioKey: doc.minioKey,
        } as InfrastructureAttachmentItem)),
      );
    }).catch(() => setAttachments([]));
    void (async () => {
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
    })();
  }, [form]);

  const handleUploadAttachment = useCallback(async (file: File) => {
    const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
    const nowIso = dayjs().toISOString();
    // Edit mode: có asset ID rồi → upload thẳng lên backend, lấy id/minioKey thật
    if (drawerMode === 'edit' && selected?.id && currentUser?.id) {
      try {
        const result = await documentApi.upload('transfer-area', selected.id, file, currentUser.id);
        setAttachments((prev) => [...prev, {
          id: result.id,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedByName: uploaderName,
          uploadedDate: nowIso,
          minioKey: result.minioKey,
        } as InfrastructureAttachmentItem]);
      } catch (err) {
        console.error('Upload attachment error:', err);
        toast.error('Không thể tải tệp đính kèm lên máy chủ.');
      }
      return;
    }
    // Create mode: chưa có assetId → giữ file tạm, upload sau khi tạo asset
    setAttachments((prev) => [...prev, {
      id: `tmp_${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedByName: uploaderName,
      uploadedDate: nowIso,
      originFileObj: file,
    } as InfrastructureAttachmentItem]);
  }, [currentUser, drawerMode, selected]);

  const handleDeleteAttachment = useCallback(async (id: string) => {
    const att = attachments.find((a) => a.id === id);
    // File đã trên backend (có minioKey hoặc không có originFileObj) → xóa khỏi Minio
    if (!att?.originFileObj) {
      try {
        await documentApi.delete(id);
      } catch (err) {
        console.error('Lỗi xóa file đính kèm:', err);
        toast.error('Không thể xóa tệp đính kèm khỏi máy chủ.');
        return;
      }
    }
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, [attachments]);

  const handleDownloadAttachment = useCallback(async (id: string, fileName: string) => {
    const att = attachments.find((a) => a.id === id);
    // File tạm trong memory (chưa upload)
    if (att?.originFileObj) {
      triggerBlobDownload(att.originFileObj, fileName || att.originFileObj.name);
      toast.success(`Đã tải xuống tệp: ${fileName}`);
      return;
    }
    // File đã lưu backend: dùng minioKey để download
    const minioKey = att?.minioKey as string | undefined;
    if (!minioKey) {
      toast.error(`Không thể tải tệp "${fileName}": Tệp chưa được lưu trên máy chủ.`);
      return;
    }
    try {
      const downloadPath = documentApi.downloadUrl(minioKey);
      const cleanPath = downloadPath.replace(/^\/api/, '');
      const res = await (await import('../../services/api')).default.get(cleanPath, { responseType: 'blob' });
      const contentType = res.headers?.['content-type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });
      triggerBlobDownload(blob, fileName || 'tai-lieu');
      toast.success(`Đã tải xuống tệp: ${fileName}`);
    } catch (err) {
      console.error('Download attachment error:', err);
      toast.error(`Không thể tải tệp "${fileName}": Tệp không tồn tại trên máy chủ.`);
    }
  }, [attachments]);

  const openDetail = useCallback(async (record: TransferAreaAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    setAttachments([]);
    // Load attachments từ backend
    void documentApi.listByEntity('transfer-area', record.id).then((res) => {
      setAttachments(
        res.data.map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          fileType: doc.mimeType,
          uploadedByName: doc.uploadedBy,
          uploadedDate: doc.createdAt,
          minioKey: doc.minioKey,
        } as InfrastructureAttachmentItem)),
      );
    }).catch(() => setAttachments([]));
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

      // File tạm chưa upload (chỉ có ở create mode — edit mode upload ngay khi chọn)
      const pendingFiles = attachments.filter((a) => a.originFileObj);
      const attachmentName = attachments.map((a) => a.fileName).join(', ') || undefined;

      const payload: TransferAreaAssetPayload = {
        ...values,
        assetType: 'TRANSFER_AREA',
        constructionYear: values.constructionYear ? Number(values.constructionYear.format('YYYY')) : undefined,
        useDate: values.useDate?.format('YYYY-MM-DD'),
        declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
        depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
        depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
        attachmentName,
        approvalStatus: targetAction,
      };

      let savedId: string;
      if (drawerMode === 'edit' && selected) {
        const updated = await updateTransferAreaAsset(selected.id, payload);
        savedId = updated.id;
        toast.success(
          targetAction === 'APPROVED'
            ? 'Đã cập nhật và phê duyệt tài sản khu chuyển tải'
            : targetAction === 'PENDING_APPROVAL'
              ? 'Đã cập nhật và gửi phê duyệt tài sản khu chuyển tải'
              : 'Đã cập nhật tài sản khu chuyển tải',
        );
      } else {
        const created = await createTransferAreaAsset(payload);
        savedId = created.id;
        toast.success(
          targetAction === 'APPROVED'
            ? 'Đã tạo mới và phê duyệt tài sản khu chuyển tải'
            : targetAction === 'PENDING_APPROVAL'
              ? 'Đã tạo mới và gửi phê duyệt tài sản khu chuyển tải'
              : 'Đã lưu tạm tài sản khu chuyển tải',
        );
      }

      // Upload file tạm (create mode) sau khi tạo asset thành công
      if (pendingFiles.length > 0 && currentUser?.id) {
        const uploadResults = await Promise.allSettled(
          pendingFiles.map((att) =>
            documentApi.upload('transfer-area', savedId, att.originFileObj!, currentUser.id)
          )
        );
        const failCount = uploadResults.filter((r) => r.status === 'rejected').length;
        if (failCount > 0) {
          toast.warning(`${failCount} tệp đính kèm không thể upload lên máy chủ.`);
        }
      }

      setDrawerMode(undefined);
      form.resetFields();
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu tài sản khu chuyển tải.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const openOperation = useCallback((mode: OperationMode, record: TransferAreaAsset) => {
    setSelected(record);
    setOperationMode(mode);
    operationForm.resetFields();
    if (mode === 'exploit') {
      operationForm.setFieldsValue({
        operatorOrgUnitId: record.orgUnitId,
        unitOfMeasure: record.quantityUnit,
        quantity: record.quantity,
      });
    } else {
      operationForm.setFieldsValue({
        originalValue: record.originalValue,
        declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
        depreciationRate: record.depreciationRate,
        assignmentDecisionNumber: record.assignmentDecisionNumber,
        depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
        depreciationMonths: record.depreciationMonths,
        depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
        accumulatedDepreciation: record.accumulatedDepreciation,
      });
    }
  }, [operationForm]);

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
          exploitationYear: dayjs(values.exploitationDeadline).year(),
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
        toast.success('Đã lưu thông tin khai thác tài sản');
      } else if (operationMode === 'increase') {
        await createAssetIncrease({
          assetId: selected.id,
          assetName: selected.assetName,
          quantity: 1,
          unitOfMeasure: 'VNĐ',
          increaseCode: values.decisionNumber || `TC-KCT-${Date.now().toString().slice(-6)}`,
          reason: values.notes || values.adjustmentReason || '',
          adjustmentDetails,
        });
        toast.success('Đã gửi yêu cầu tăng nguyên giá tài sản');
      } else {
        await createAssetDecrease({
          assetId: selected.id,
          assetName: selected.assetName,
          quantity: 1,
          unitOfMeasure: 'VNĐ',
          decreaseCode: values.decisionNumber || `GC-KCT-${Date.now().toString().slice(-6)}`,
          decreaseReason: values.adjustmentReason || 'Giảm nguyên giá',
          reason: values.notes || values.adjustmentReason || '',
          adjustmentDetails,
        });
        toast.success('Đã gửi yêu cầu giảm nguyên giá tài sản');
      }

      setOperationMode(undefined);
      operationForm.resetFields();
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu nghiệp vụ biến động.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await deleteTransferAreaAsset(deleteTarget.id);
      toast.success('Đã xóa tài sản khu chuyển tải');
      setDeleteTarget(undefined);
      await loadData();
    } catch (cause: unknown) {
      toast.error(getErrorMessage(cause, 'Không thể xóa tài sản khu chuyển tải.'));
    } finally {
      setSaving(false);
    }
  };

  const headerActions: ScreenHeaderAction[] = useMemo(() => [
    {
      key: 'create',
      label: 'Thêm mới',
      icon: <PlusOutlined />,
      variant: 'primary',
      onClick: openCreate,
    },
  ], [openCreate]);

  const filterConfigs = useMemo<FilterOption[]>(() => [
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
      key: 'transferAreaId',
      label: 'Mã khu chuyển tải',
      type: 'select',
      placeholder: 'Chọn khu chuyển tải',
      options: transferAreas.map((item) => ({
        value: item.id,
        label: `${item.transferAreaCode} - ${item.transferAreaName}`,
      })),
    },
    {
      key: 'assetType',
      label: 'Loại tài sản',
      type: 'select',
      placeholder: 'Chọn loại tài sản',
      options: [{ value: 'TRANSFER_AREA', label: 'Tài sản khu chuyển tải' }],
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
  ], [transferAreas, organizations]);

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

  const tableOptions = useMemo<TableOption<TransferAreaAsset>>(() => ({
    dataKey: 'id',
    mainColumns: [
      {
        title: 'TÊN/MÃ TÀI SẢN',
        dataIndex: 'assetName',
        type: TableColumnType.TwoLine,
        subField: 'assetCode',
        width: 240,
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
        valueRef: (r) => orgName.get(r.orgUnitId) || '',
      },
      {
        title: 'ĐƠN VỊ SỬ DỤNG',
        dataIndex: 'usingOrgUnitId',
        type: TableColumnType.Text,
        width: 250,
        allowSort: true,
        valueRef: (r) => orgName.get(r.usingOrgUnitId || '') || '',
      },
      {
        title: 'MÃ KHU CHUYỂN TẢI',
        dataIndex: 'transferAreaId',
        type: TableColumnType.Text,
        width: 190,
        allowSort: true,
        valueRef: (r) => transferAreaMap.get(r.transferAreaId || '')?.transferAreaCode || '',
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 170,
        allowSort: true,
        render: () => 'Tài sản khu chuyển tải',
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
        width: 180,
        allowSort: true,
      },
      {
        title: 'CÁN BỘ CẬP NHẬT',
        dataIndex: 'updatedByName',
        type: TableColumnType.Text,
        width: 180,
        allowSort: true,
        sortField: 'updatedBy',
      },
      {
        title: 'NGÀY CẬP NHẬT',
        dataIndex: 'updatedAt',
        type: TableColumnType.DateTime,
        width: 180,
        allowSort: true,
      },
      {
        title: 'NGÀY GỬI PHÊ DUYỆT',
        dataIndex: 'submittedAt',
        type: TableColumnType.DateTime,
        width: 190,
        allowSort: true,
      },
      {
        title: 'CÁN BỘ GỬI PHÊ DUYỆT',
        dataIndex: 'submittedByName',
        type: TableColumnType.Text,
        width: 190,
        allowSort: true,
        sortField: 'submittedBy',
      },
      {
        title: 'NGÀY DUYỆT CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovedAt',
        type: TableColumnType.DateTime,
        width: 220,
        allowSort: true,
      },
      {
        title: 'CÁN BỘ DUYỆT CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovedByName',
        type: TableColumnType.Text,
        width: 230,
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
        title: 'NGÀY DUYỆT CỤC',
        dataIndex: 'departmentApprovedAt',
        type: TableColumnType.DateTime,
        width: 180,
        allowSort: true,
      },
      {
        title: 'CÁN BỘ DUYỆT CỤC',
        dataIndex: 'departmentApprovedByName',
        type: TableColumnType.Text,
        width: 180,
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
    actions: (record: TransferAreaAsset) => [
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
        onClick: () => openOperation('exploit', record),
      },
      {
        key: 'increase',
        label: 'Tăng nguyên giá',
        icon: <PlusCircleOutlined />,
        onClick: () => openOperation('increase', record),
      },
      {
        key: 'decrease',
        label: 'Giảm nguyên giá',
        icon: <MinusCircleOutlined />,
        onClick: () => openOperation('decrease', record),
      },
      {
        key: 'history',
        label: 'Lịch sử',
        icon: <HistoryOutlined />,
        onClick: () => void openHistory(record),
      },
      ...(record.approvalStatus === 'DRAFT' || (record as any).status === 'DRAFT'
        ? [{
            key: 'delete',
            label: 'Xóa',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => setDeleteTarget(record),
          }]
        : []),
    ],
  }), [openDetail, openEdit, openHistory, openOperation, orgName, transferAreaMap]);

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div
        className="transfer-area-page-wrapper"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          gap: 12,
        }}
      >
        <style>{`
          /* ── Cỡ chữ 13.5px chuẩn toàn màn Tài sản khu chuyển tải & các popup/drawer con ── */
          .transfer-area-page-wrapper,
          .transfer-area-page-wrapper .ant-table,
          .transfer-area-page-wrapper .ant-table-cell,
          .transfer-area-page-wrapper .ant-table-thead > tr > th,
          .transfer-area-page-wrapper .ant-table-tbody > tr > td,
          .transfer-area-page-wrapper .ant-input,
          .transfer-area-page-wrapper .ant-select,
          .transfer-area-page-wrapper .ant-select-selection-item,
          .transfer-area-page-wrapper .ant-select-item-option-content,
          .transfer-area-page-wrapper .ant-picker,
          .transfer-area-page-wrapper .ant-picker-input > input,
          .transfer-area-page-wrapper .ant-btn,
          .transfer-area-page-wrapper .ant-pagination,
          .transfer-area-page-wrapper .ant-pagination-item,
          .transfer-area-page-wrapper .ant-pagination-total-text,
          .transfer-area-page-wrapper .ant-breadcrumb,
          .transfer-area-page-wrapper .ant-form-item-label > label {
            font-size: 13.5px !important;
          }
        `}</style>
        <ScreenHeader
          breadcrumb={[{ label: 'Quản lý tài sản KCHT hàng hải' }, { label: 'Tài sản khu chuyển tải' }]}
          actions={headerActions}
        />

        <FilterTableLayout
          hideFilterToggle
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
              filters={filterConfigs}
              values={draftFilters as Partial<Record<string, unknown>>}
              onChange={(v) => setDraftFilters(v as typeof draftFilters)}
            />
          }
        >
          <CommonTable<TransferAreaAsset>
            options={tableOptions}
            dataSource={data}
            loading={loading}
            total={total}
            page={page}
            pageSize={pageSize}
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

        <TransferAreaAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          transferAreas={transferAreas}
          attachments={attachments}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
          orgName={orgName}
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

        <TransferAreaAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          transferAreaMap={transferAreaMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
          attachments={attachments}
          onDownloadAttachment={handleDownloadAttachment}
        />

        <TransferAreaAssetOperationForm
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
          title="Xác nhận xóa tài sản khu chuyển tải"
          itemName={deleteTarget?.assetName}
          itemType="tài sản khu chuyển tải"
          loading={saving}
          onCancel={() => setDeleteTarget(undefined)}
          onConfirm={() => void executeDelete()}
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
                fieldLabels: TRANSFER_AREA_ASSET_FIELD_LABELS,
                resolveUnitName: () => {
                  const targetOrgId = historyTarget?.orgUnitId || historyTarget?.parentOrgUnitId;
                  return targetOrgId ? (orgName.get(targetOrgId) || '') : '';
                },
                formatValue: (fn, raw) => {
                  if (isBlankOrDash(raw)) return '';
                  const normKey = (fn || '').toLowerCase();
                  if (normKey.includes('orgunitid') || normKey.includes('donvi')) {
                    return orgName.get(raw!) || raw;
                  }
                  if (fn === 'transferAreaId') {
                    const item = transferAreaMap.get(raw!);
                    return item ? `${item.transferAreaCode} - ${item.transferAreaName}` : raw;
                  }
                  if (
                    fn === 'originalValue' ||
                    fn === 'remainingValue' ||
                    fn === 'accumulatedDepreciation' ||
                    fn === 'monthlyDepreciation' ||
                    fn === 'value'
                  ) {
                    return formatHistoryNumber(raw);
                  }
                  return undefined;
                },
              })
            )}
          </div>
        </AppDrawer>
      </div>
    </ThemeTokenProvider>
  );
}
