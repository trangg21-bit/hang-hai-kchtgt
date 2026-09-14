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
import { stormShelterCRUD } from '../../services/portService';
import type { StormShelterArea } from '../../types/port';
import {
  createKhaiThac,
  createAssetDecrease,
  createAssetIncrease,
  createStormShelterAsset,
  deleteStormShelterAsset,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchInfraAssetHistory,
  fetchKhaiThacList,
  fetchStormShelterAssetList,
  updateStormShelterAsset,
  uploadInfraAssetAttachments,
  fetchInfraAssetAttachments,
  deleteInfraAssetAttachment,
} from '../../services/assetmovement/api';
import { renderStandardHistoryCards, isBlankOrDash, DEFAULT_IGNORED_FIELDS } from '../../utils/changeHistoryRenderer';
import { formatHistoryNumber } from '../../utils/numFmt';
import api from '../../services/api';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
  StormShelterAsset,
  StormShelterAssetFilters,
  StormShelterAssetPayload,
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
import StormShelterAssetForm, { type FormValues } from './StormShelterAssetForm';
import StormShelterAssetDetailContent from './StormShelterAssetDetailContent';
import StormShelterAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './StormShelterAssetOperationForm';

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

const STORM_SHELTER_ASSET_FIELD_LABELS: Record<string, string> = {
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  orgUnitId: 'Đơn vị quản lý',
  usingOrgUnitId: 'Đơn vị sử dụng',
  stormShelterId: 'Mã khu tránh, trú bão',
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

export default function StormShelterAssetList() {
  const [data, setData] = useState<StormShelterAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stormShelters, setStormShelters] = useState<StormShelterArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<StormShelterAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<StormShelterAssetFilters & { updatedRange?: [Dayjs | null, Dayjs | null] }>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<StormShelterAsset>();
  const [deleteTarget, setDeleteTarget] = useState<StormShelterAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const orgName = useMemo(() => new Map(organizations.map((item) => [item.id, item.name])), [organizations]);
  const stormShelterMap = useMemo(() => new Map(stormShelters.map((item) => [item.id, item])), [stormShelters]);

  // ── History state (chuẩn /berth) ───────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<StormShelterAsset | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  const openHistory = useCallback(async (r: StormShelterAsset) => {
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
      const response = await fetchStormShelterAssetList({ ...filters, page: page - 1, size: pageSize });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, sortBy: undefined, sortDir: undefined, page: 0, size: 1 };
      const counts: Record<string, number> = {};
      await Promise.all(
        STATUS_COUNT_KEYS.map(async (st) => {
          try {
            const res = await fetchStormShelterAssetList({ ...baseFilters, approvalStatus: st });
            counts[st] = res.totalElements;
          } catch {
            counts[st] = 0;
          }
        }),
      );
      setStatusCounts(counts);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản khu tránh, trú bão.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void Promise.all([organizationService.getAll(), stormShelterCRUD.findAll({ page: 1, size: 5000 })])
      .then(([orgs, shelterPage]) => {
        setOrganizations(orgs);
        setStormShelters(shelterPage.data);
      })
      .catch(() => toast.error('Không thể tải danh mục đơn vị hoặc khu tránh, trú bão.'));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    setAttachments([]);
    setExploitationRows([]);
    setIncreaseRows([]);
    setDecreaseRows([]);
    form.resetFields();
    form.setFieldsValue({
      parentOrgUnitId: currentUser?.orgUnitId,
      orgUnitId: currentUser?.orgUnitId,
      usingOrgUnitId: currentUser?.orgUnitId,
      assetCondition: 'Tốt',
      usageStatus: 'Đang sử dụng',
      valueUnit: 'VNĐ',
      declarationDate: dayjs(),
      depreciationStartDate: dayjs(),
    } as unknown as FormValues);
  }, [currentUser, form]);

  const openEdit = useCallback(async (record: StormShelterAsset) => {
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
    } as unknown as FormValues);

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
              id: `att-${i}`,
              fileName: name.trim(),
              fileSize: 1024 * 1024,
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
              id: `att-${i}`,
              fileName: name.trim(),
              fileSize: 1024 * 1024,
              uploadedByName: record.updatedByName || record.submittedByName || 'Cán bộ quản lý',
              uploadedDate: record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString(),
            }))
          );
        } else {
          setAttachments([]);
        }
      });

    try {
      const [expRes, incRes, decRes] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id, size: 100 }),
        fetchAssetIncreaseList({ assetId: record.id, size: 100 }),
        fetchAssetDecreaseList({ assetId: record.id, size: 100 }),
      ]);
      setExploitationRows(expRes.content);
      setIncreaseRows(incRes.content);
      setDecreaseRows(decRes.content);
    } catch {
      setExploitationRows([]);
      setIncreaseRows([]);
      setDecreaseRows([]);
    }
  }, [form]);

  const openDetail = useCallback(async (record: StormShelterAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [expRes, incRes, decRes] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id, size: 100 }),
        fetchAssetIncreaseList({ assetId: record.id, size: 100 }),
        fetchAssetDecreaseList({ assetId: record.id, size: 100 }),
      ]);
      setExploitationRows(expRes.content);
      setIncreaseRows(incRes.content);
      setDecreaseRows(decRes.content);
    } catch {
      setExploitationRows([]);
      setIncreaseRows([]);
      setDecreaseRows([]);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerMode(undefined);
    setSelected(undefined);
    form.resetFields();
  }, [form]);

  const handleUploadAttachment = (file: File) => {
    const newItem: InfrastructureAttachmentItem = {
      id: `new-${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedByName: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
      uploadedDate: dayjs().toISOString(),
      originFileObj: file,
      file: file,
    };
    setAttachments((prev) => [...prev, newItem]);
    toast.success(`Đã thêm tệp đính kèm: ${file.name}`);
  };

  const handleDeleteAttachment = (id: string) => {
    if (selected?.id && id.includes('-')) {
      deleteInfraAssetAttachment(selected.id, id).catch(() => {});
    }
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    toast.success('Đã xóa tệp đính kèm');
  };

  const handleDownloadAttachment = async (id: string, fileName: string) => {
    const att = attachments.find((a) => a.id === id);
    if (att?.originFileObj) {
      triggerBlobDownload(att.originFileObj, fileName || att.originFileObj.name);
      toast.success(`Đã tải xuống tệp: ${fileName}`);
      return;
    }
    if (att?.file) {
      triggerBlobDownload(att.file, fileName || att.file.name);
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
        console.warn('Download error:', err);
      }
    }
    const fallbackBlob = new Blob(
      [`Tài liệu đính kèm: ${fileName}\nThời gian: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`],
      { type: 'application/octet-stream' },
    );
    triggerBlobDownload(fallbackBlob, fileName || 'tai-lieu');
    toast.success(`Đã tải xuống tệp: ${fileName}`);
  };

  const handleSaveForm = async (action: 'draft' | 'submit' | 'approve') => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(action);

      let targetApprovalStatus = 'DRAFT';
      if (action === 'submit') {
        targetApprovalStatus = 'PENDING_APPROVAL';
      } else if (action === 'approve') {
        targetApprovalStatus = 'APPROVED';
      }

      const payload: StormShelterAssetPayload = {
        ...values,
        assetType: 'STORM_SHELTER',
        approvalStatus: targetApprovalStatus,
        constructionYear: values.constructionYear ? values.constructionYear.year() : undefined,
        useDate: values.useDate?.format('YYYY-MM-DD'),
        declarationDate: values.declarationDate?.format('YYYY-MM-DD'),
        depreciationStartDate: values.depreciationStartDate?.format('YYYY-MM-DD'),
        depreciationEndDate: values.depreciationEndDate?.format('YYYY-MM-DD'),
        attachmentName: attachments.map((a) => a.fileName).join(', '),
      };

      let savedId = selected?.id;
      if (drawerMode === 'create') {
        const created = await createStormShelterAsset(payload);
        savedId = created?.id;
        toast.success(
          action === 'approve'
            ? 'Đã tạo mới và phê duyệt tài sản khu tránh, trú bão'
            : action === 'submit'
              ? 'Đã gửi phê duyệt tài sản khu tránh, trú bão'
              : 'Đã lưu tạm tài sản khu tránh, trú bão',
        );
      } else if (selected) {
        await updateStormShelterAsset(selected.id, payload);
        toast.success(
          action === 'approve'
            ? 'Đã phê duyệt cập nhật tài sản khu tránh, trú bão'
            : action === 'submit'
              ? 'Đã cập nhật và gửi phê duyệt tài sản khu tránh, trú bão'
              : 'Đã cập nhật tài sản khu tránh, trú bão',
        );
      }

      const filesToUpload = attachments
        .map((a) => a.originFileObj || a.file)
        .filter((f): f is File => f instanceof File);
      if (filesToUpload.length > 0 && savedId) {
        try {
          await uploadInfraAssetAttachments(savedId, filesToUpload);
        } catch (uploadErr) {
          console.error('Upload attachments error:', uploadErr);
        }
      }

      closeDrawer();
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu tài sản khu tránh, trú bão.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const openOperation = useCallback((mode: OperationMode, record: StormShelterAsset) => {
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
          increaseCode: values.decisionNumber || `TC-TB-${Date.now().toString().slice(-6)}`,
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
          decreaseCode: values.decisionNumber || `GC-TB-${Date.now().toString().slice(-6)}`,
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
      await deleteStormShelterAsset(deleteTarget.id);
      toast.success('Đã xóa tài sản khu tránh, trú bão');
      setDeleteTarget(undefined);
      await loadData();
    } catch (cause: unknown) {
      toast.error(getErrorMessage(cause, 'Không thể xóa tài sản khu tránh, trú bão.'));
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
      key: 'stormShelterId',
      label: 'Mã khu tránh, trú bão',
      type: 'select',
      placeholder: 'Chọn khu tránh, trú bão',
      options: stormShelters.map((item) => ({
        value: item.id,
        label: `${item.stormShelterCode} - ${item.stormShelterName}`,
      })),
    },
    {
      key: 'assetType',
      label: 'Loại tài sản',
      type: 'select',
      placeholder: 'Chọn loại tài sản',
      options: [{ value: 'STORM_SHELTER', label: 'Tài sản khu tránh, trú bão' }],
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
  ], [stormShelters, organizations]);

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

  const tableOptions = useMemo<TableOption<StormShelterAsset>>(() => ({
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
        title: 'MÃ KHU TRÁNH, TRÚ BÃO',
        dataIndex: 'stormShelterId',
        type: TableColumnType.Text,
        width: 200,
        allowSort: true,
        valueRef: (r) => r.stormShelterId ? stormShelterMap.get(r.stormShelterId)?.stormShelterCode : undefined,
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 180,
        allowSort: true,
        render: () => 'Tài sản khu tránh, trú bão',
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
        title: 'NỘI DUNG DUYỆT CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovalContent',
        type: TableColumnType.Text,
        width: 240,
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
        title: 'NỘI DUNG DUYỆT CỤC',
        dataIndex: 'departmentApprovalContent',
        type: TableColumnType.Text,
        width: 240,
        allowSort: true,
      },
    ],
    actions: (record: StormShelterAsset) => [
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
  }), [openDetail, openEdit, openHistory, openOperation, orgName, stormShelterMap]);

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản khu tránh, trú bão' },
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
          <CommonTable<StormShelterAsset>
            options={tableOptions}
            dataSource={data}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={total}
            filters={filters}
            onPageChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
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

        {drawerMode && drawerMode !== 'detail' && (
          <StormShelterAssetForm
            open={Boolean(drawerMode)}
            drawerMode={drawerMode}
            selected={selected}
            form={form}
            organizations={organizations}
            stormShelters={stormShelters}
            attachments={attachments}
            exploitationRows={exploitationRows}
            increaseRows={increaseRows}
            decreaseRows={decreaseRows}
            orgName={(id) => orgName.get(id || '') || id || '—'}
            saving={saving}
            saveAction={saveAction as 'draft' | 'submit' | 'approve'}
            onClose={closeDrawer}
            onSave={handleSaveForm}
            onUploadAttachment={handleUploadAttachment}
            onDeleteAttachment={handleDeleteAttachment}
            onDownloadAttachment={handleDownloadAttachment}
          />
        )}

        {drawerMode === 'detail' && (
          <StormShelterAssetDetailContent
            open={true}
            selectedRecord={selected}
            onClose={closeDrawer}
            orgName={orgName}
            stormShelterMap={stormShelterMap}
            exploitationRows={exploitationRows}
            increaseRows={increaseRows}
            decreaseRows={decreaseRows}
          />
        )}

        {operationMode && (
          <StormShelterAssetOperationForm
            open={Boolean(operationMode)}
            operationMode={operationMode}
            selected={selected}
            organizations={organizations}
            form={operationForm}
            saving={saving}
            onClose={() => setOperationMode(undefined)}
            onSubmit={saveOperation}
          />
        )}

        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          title="Xác nhận xóa tài sản khu tránh, trú bão"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          description="Thao tác này không thể hoàn tác."
          onConfirm={executeDelete}
          onCancel={() => setDeleteTarget(undefined)}
          loading={saving}
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
                fieldLabels: STORM_SHELTER_ASSET_FIELD_LABELS,
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
                  if (fn === 'stormShelterId') {
                    const item = stormShelterMap.get(raw!);
                    return item ? `${item.stormShelterCode} - ${item.stormShelterName}` : raw;
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
