import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Form } from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  RocketOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import toast from '../../components/ToastNotification';

import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import * as themeTokenChk from '../../themetokenchk';
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
import type { BreadcrumbItem } from '../../components/shared/ScreenHeader';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import {
  organizationService,
  type Organization,
} from '../../services/organizationService';
import {
  createScadaSystemAsset,
  deleteScadaSystemAsset,
  fetchScadaDeviceOptions,
  fetchScadaSystemAssetById,
  fetchScadaSystemAssets,
  updateScadaSystemAsset,
} from '../../services/scadaasset/api';
import type {
  ScadaDeviceOption,
  ScadaSystemAsset,
  ScadaSystemAssetFilters,
  ScadaSystemAssetPayload,
} from '../../services/scadaasset/types';
import {
  createAssetDecrease,
  createAssetIncrease,
  createKhaiThac,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchKhaiThacList,
} from '../../services/assetmovement/api';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
} from '../../services/assetmovement/types';
import type { InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import {
  saveAttachmentFile,
  downloadAttachmentFile,
  getAttachmentPreviewUrl,
} from '../../utils/attachmentStorage';
import { useAuthStore } from '../../store/authStore';
import ScadaSystemAssetForm, { type FormValues } from './ScadaSystemAssetForm';
import ScadaSystemAssetDetailContent from './ScadaSystemAssetDetailContent';
import ScadaSystemAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './ScadaSystemAssetOperationForm';

type DrawerMode = 'create' | 'edit' | 'detail';

const SCADA_ASSET_TYPES = [
  'Thiết bị đầu cuối thu thập dữ liệu (RTU)',
  'Bộ điều khiển logic lập trình (PLC)',
  'Máy chủ điều khiển & máy chủ dữ liệu SCADA',
  'Trạm giao diện người - máy (HMI / Workstation)',
  'Hệ thống truyền thông mạng SCADA (Switch / Router / Modem)',
  'Cảm biến & Bộ đo lường thu thập số liệu',
  'Tủ điều khiển SCADA & Nguồn dự phòng UPS',
  'Hệ thống phụ trợ SCADA',
  'Khác',
];

const ASSET_CONDITIONS = ['Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được'];

const STATUS_COUNT_KEYS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED_LEVEL1',
  'APPROVED',
  'REJECTED_LEVEL1',
  'REJECTED_LEVEL2',
];

const BREADCRUMB_ITEMS: BreadcrumbItem[] = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Quản lý tài sản KCHT hàng hải' },
  { label: 'Tài sản HT SCADA' },
];

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) =>
  Boolean((cause as { errorFields?: unknown }).errorFields);

export default function ScadaSystemAssetList() {
  const currentUser = useAuthStore((s) => s.user);
  const [data, setData] = useState<ScadaSystemAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [scadaDevices, setScadaDevices] = useState<ScadaDeviceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<ScadaSystemAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<ScadaSystemAssetFilters>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<ScadaSystemAsset>();
  const [deleteTarget, setDeleteTarget] = useState<ScadaSystemAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const orgName = useMemo(
    () => new Map(organizations.map((item) => [item.id, item.name])),
    [organizations]
  );
  const scadaDeviceMap = useMemo(
    () =>
      new Map(
        scadaDevices.map((item) => [
          item.id,
          { deviceCode: item.deviceCode, deviceName: item.deviceName },
        ])
      ),
    [scadaDevices]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchScadaSystemAssets({
        ...filters,
        page: page - 1,
        size: pageSize,
      });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchScadaSystemAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) =>
          fetchScadaSystemAssets({ ...baseFilters, approvalStatus })
        ),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(
          STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])
        ),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản HT SCADA.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void organizationService.getAll()
      .then((items) => setOrganizations(items))
      .catch(() => setOrganizations([]));
    void fetchScadaDeviceOptions()
      .then((items) => setScadaDevices(items))
      .catch(() => setScadaDevices([]));
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    setAttachments([]);
    form.resetFields();
    form.setFieldsValue({
      valueUnit: 'VNĐ',
      quantity: 1,
      quantityUnit: 'Hệ thống',
      assetCondition: 'Tốt',
      usageStatus: 'Đang sử dụng',
      assetGroup: 'Máy móc, thiết bị',
      assetType: 'Thiết bị đầu cuối thu thập dữ liệu (RTU)',
      origin: 'Mua sắm',
      attachmentName: undefined,
    });
  }, [form]);

  const openEdit = useCallback(
    async (record: ScadaSystemAsset) => {
      setSelected(record);
      setDrawerMode('edit');
      form.resetFields();
      const fileNames = record.attachmentName
        ? record.attachmentName.split(',').map((f) => f.trim()).filter(Boolean)
        : [];
      const initialAtts: InfrastructureAttachmentItem[] = fileNames.map((fileName, idx) => ({
        id: `att-edit-${record.id}-${idx}`,
        fileName,
        fileSize: (idx + 1) * 1024 * 1024,
        uploadedByName: record.updatedByName || currentUser?.fullName || 'Hệ thống',
        uploadedDate: record.updatedAt
          ? dayjs(record.updatedAt).toISOString()
          : dayjs().toISOString(),
      }));
      setAttachments(initialAtts);
      Promise.all(
        fileNames.map(async (name, idx) => {
          try {
            const url = await getAttachmentPreviewUrl(name, {
              assetCode: record.assetCode,
              assetName: record.assetName,
            });
            return { id: `att-edit-${record.id}-${idx}`, url };
          } catch {
            return { id: `att-edit-${record.id}-${idx}`, url: undefined };
          }
        })
      ).then((resolved) => {
        setAttachments((prev) =>
          prev.map((item) => {
            const match = resolved.find((r) => r.id === item.id);
            return match?.url ? { ...item, url: match.url } : item;
          })
        );
      });
      form.setFieldsValue({
        ...record,
        constructionYear: record.constructionYear
          ? dayjs(`${record.constructionYear}-01-01`)
          : undefined,
        useDate: record.useDate ? dayjs(record.useDate) : undefined,
        declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
        depreciationStartDate: record.depreciationStartDate
          ? dayjs(record.depreciationStartDate)
          : undefined,
        depreciationEndDate: record.depreciationEndDate
          ? dayjs(record.depreciationEndDate)
          : undefined,
        attachmentName: fileNames.length > 0 ? fileNames.join(', ') : undefined,
      });

      try {
        const full = await fetchScadaSystemAssetById(record.id);
        setSelected(full);
        const fullFileNames = full.attachmentName
          ? full.attachmentName.split(',').map((f) => f.trim()).filter(Boolean)
          : [];
        const fullAtts: InfrastructureAttachmentItem[] = fullFileNames.map((fileName, idx) => ({
          id: `att-edit-${full.id}-${idx}`,
          fileName,
          fileSize: (idx + 1) * 1024 * 1024,
          uploadedByName: full.updatedByName || currentUser?.fullName || 'Hệ thống',
          uploadedDate: full.updatedAt
            ? dayjs(full.updatedAt).toISOString()
            : dayjs().toISOString(),
        }));
        setAttachments(fullAtts);
        Promise.all(
          fullFileNames.map(async (name, idx) => {
            try {
              const url = await getAttachmentPreviewUrl(name, {
                assetCode: full.assetCode,
                assetName: full.assetName,
              });
              return { id: `att-edit-${full.id}-${idx}`, url };
            } catch {
              return { id: `att-edit-${full.id}-${idx}`, url: undefined };
            }
          })
        ).then((resolved) => {
          setAttachments((prev) =>
            prev.map((item) => {
              const match = resolved.find((r) => r.id === item.id);
              return match?.url ? { ...item, url: match.url } : item;
            })
          );
        });
        form.setFieldsValue({
          ...full,
          constructionYear: full.constructionYear
            ? dayjs(`${full.constructionYear}-01-01`)
            : undefined,
          useDate: full.useDate ? dayjs(full.useDate) : undefined,
          declarationDate: full.declarationDate ? dayjs(full.declarationDate) : undefined,
          depreciationStartDate: full.depreciationStartDate
            ? dayjs(full.depreciationStartDate)
            : undefined,
          depreciationEndDate: full.depreciationEndDate
            ? dayjs(full.depreciationEndDate)
            : undefined,
          attachmentName: fullFileNames.length > 0 ? fullFileNames.join(', ') : undefined,
        });
      } catch {
        // use record fallback
      }
    },
    [currentUser?.fullName, form]
  );

  const openDetail = useCallback(
    async (record: ScadaSystemAsset) => {
      setSelected(record);
      setDrawerMode('detail');
      const fileNames = record.attachmentName
        ? record.attachmentName.split(',').map((f) => f.trim()).filter(Boolean)
        : [];
      const initialAtts: InfrastructureAttachmentItem[] = fileNames.map((fileName, idx) => ({
        id: `att-detail-${record.id}-${idx}`,
        fileName,
        fileSize: (idx + 1) * 1024 * 1024,
        uploadedByName: record.updatedByName || currentUser?.fullName || 'Hệ thống',
        uploadedDate: record.updatedAt
          ? dayjs(record.updatedAt).toISOString()
          : dayjs().toISOString(),
      }));
      setAttachments(initialAtts);
      Promise.all(
        fileNames.map(async (name, idx) => {
          try {
            const url = await getAttachmentPreviewUrl(name, {
              assetCode: record.assetCode,
              assetName: record.assetName,
            });
            return { id: `att-detail-${record.id}-${idx}`, url };
          } catch {
            return { id: `att-detail-${record.id}-${idx}`, url: undefined };
          }
        })
      ).then((resolved) => {
        setAttachments((prev) =>
          prev.map((item) => {
            const match = resolved.find((r) => r.id === item.id);
            return match?.url ? { ...item, url: match.url } : item;
          })
        );
      });

      try {
        const full = await fetchScadaSystemAssetById(record.id);
        setSelected(full);
        const fullFileNames = full.attachmentName
          ? full.attachmentName.split(',').map((f) => f.trim()).filter(Boolean)
          : [];
        const fullAtts: InfrastructureAttachmentItem[] = fullFileNames.map((fileName, idx) => ({
          id: `att-detail-${full.id}-${idx}`,
          fileName,
          fileSize: (idx + 1) * 1024 * 1024,
          uploadedByName: full.updatedByName || currentUser?.fullName || 'Hệ thống',
          uploadedDate: full.updatedAt
            ? dayjs(full.updatedAt).toISOString()
            : dayjs().toISOString(),
        }));
        setAttachments(fullAtts);
        Promise.all(
          fullFileNames.map(async (name, idx) => {
            try {
              const url = await getAttachmentPreviewUrl(name, {
                assetCode: full.assetCode,
                assetName: full.assetName,
              });
              return { id: `att-detail-${full.id}-${idx}`, url };
            } catch {
              return { id: `att-detail-${full.id}-${idx}`, url: undefined };
            }
          })
        ).then((resolved) => {
          setAttachments((prev) =>
            prev.map((item) => {
              const match = resolved.find((r) => r.id === item.id);
              return match?.url ? { ...item, url: match.url } : item;
            })
          );
        });
      } catch {
        // fallback
      }

      try {
        const [exploits, increases, decreases] = await Promise.all([
          fetchKhaiThacList({ assetId: record.id, page: 0, size: 50 }),
          fetchAssetIncreaseList({ assetId: record.id, page: 0, size: 50 }),
          fetchAssetDecreaseList({ assetId: record.id, page: 0, size: 50 }),
        ]);
        setExploitationRows(exploits.content || []);
        setIncreaseRows(increases.content || []);
        setDecreaseRows(decreases.content || []);
      } catch {
        setExploitationRows([]);
        setIncreaseRows([]);
        setDecreaseRows([]);
      }
    },
    [currentUser?.fullName]
  );

  const handleUploadAttachment = useCallback(
    (file: File) => {
      void saveAttachmentFile(file.name, file);
      const url = URL.createObjectURL(file);
      const newAtt: InfrastructureAttachmentItem = {
        id: `att-upload-${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        file,
        originFileObj: file,
        url,
        uploadedByName: currentUser?.fullName || 'Người dùng',
        uploadedDate: new Date().toISOString(),
      };
      setAttachments((prev) => {
        const next = [...prev, newAtt];
        form.setFieldValue('attachmentName', next.map((a) => a.fileName).join(', '));
        return next;
      });
      toast.success(`Đã tải lên tệp: ${file.name}`);
    },
    [currentUser?.fullName, form]
  );

  const handleDeleteAttachment = useCallback(
    (id: string) => {
      setAttachments((prev) => {
        const next = prev.filter((a) => a.id !== id);
        form.setFieldValue(
          'attachmentName',
          next.length > 0 ? next.map((a) => a.fileName).join(', ') : undefined
        );
        return next;
      });
      toast.info('Đã xóa tệp đính kèm');
    },
    [form]
  );

  const handleDownloadAttachment = useCallback(
    async (_id: string, fileName: string) => {
      await downloadAttachmentFile(fileName, {
        assetCode: selected?.assetCode,
        assetName: selected?.assetName,
      });
    },
    [selected?.assetCode, selected?.assetName]
  );

  const toYearNumber = (val: unknown): number | undefined => {
    if (!val) return undefined;
    if (typeof val === 'number') return val;
    if (dayjs.isDayjs(val)) return val.year();
    const parsed = dayjs(String(val));
    return parsed.isValid() ? parsed.year() : undefined;
  };

  const toDateString = (val: unknown): string | undefined => {
    if (!val) return undefined;
    if (dayjs.isDayjs(val)) return val.format('YYYY-MM-DD');
    if (typeof val === 'string') return val.slice(0, 10);
    const parsed = dayjs(val as Date);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined;
  };

  const saveAsset = useCallback(
    async (status: string) => {
      try {
        const values = await form.validateFields();
        setSaving(true);
        setSaveAction(status);

        const payload: ScadaSystemAssetPayload = {
          ...values,
          approvalStatus: status,
          constructionYear: toYearNumber(values.constructionYear),
          useDate: toDateString(values.useDate),
          declarationDate: toDateString(values.declarationDate),
          depreciationStartDate: toDateString(values.depreciationStartDate),
          depreciationEndDate: toDateString(values.depreciationEndDate),
          attachmentName:
            attachments.length > 0 ? attachments.map((a) => a.fileName).join(', ') : undefined,
        };

        if (drawerMode === 'create' || !selected?.id) {
          await createScadaSystemAsset(payload);
          toast.success(
            status === 'DRAFT'
              ? 'Đã lưu tạm tài sản HT SCADA'
              : status === 'PENDING_APPROVAL'
              ? 'Đã gửi duyệt tài sản HT SCADA'
              : 'Đã tạo và phê duyệt tài sản HT SCADA'
          );
        } else if (selected) {
          await updateScadaSystemAsset(selected.id, payload);
          toast.success('Đã cập nhật tài sản HT SCADA thành công');
        }

        setDrawerMode(undefined);
        form.resetFields();
        void loadData();
      } catch (cause: unknown) {
        if (!isValidationError(cause)) {
          toast.error(getErrorMessage(cause, 'Không thể lưu thông tin tài sản HT SCADA.'));
        } else {
          toast.warning('Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc.');
        }
      } finally {
        setSaving(false);
      }
    },
    [attachments, drawerMode, form, loadData, selected]
  );

  const handleFilterApply = useCallback(() => {
    setPage(1);
    const updatedRange = draftFilters.updatedRange as [Dayjs | null, Dayjs | null] | undefined;
    setFilters({
      ...draftFilters,
      updatedFrom: updatedRange?.[0] ? updatedRange[0].format('YYYY-MM-DD') : undefined,
      updatedTo: updatedRange?.[1] ? updatedRange[1].format('YYYY-MM-DD') : undefined,
    });
  }, [draftFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({});
    setPage(1);
    setFilters({});
  }, []);

  const handleOperationSubmit = async () => {
    if (!operationMode || !selected) return;
    try {
      const values = await operationForm.validateFields();
      setSaving(true);

      if (operationMode === 'exploit') {
        const exploitationYear = values.exploitationDeadline
          ? dayjs(values.exploitationDeadline).year()
          : dayjs().year();

        await createKhaiThac({
          assetId: selected.id,
          assetName: selected.assetName,
          exploitationYear,
          doanhThu: values.totalRevenue || 0,
          depreciation: values.relatedCosts || 0,
          description: values.notes || '',
          operatorOrgUnitId: values.operatorOrgUnitId,
          assetCategory: selected.assetName,
          unitOfMeasure: values.unitOfMeasure,
          quantity: values.quantity,
          exploitationDeadline: values.exploitationDeadline
            ? values.exploitationDeadline.format('YYYY-MM-DD')
            : undefined,
          totalRevenue: values.totalRevenue,
          relatedCosts: values.relatedCosts,
          stateBudgetPayment: values.stateBudgetPayment,
          projectAmount: values.projectAmount,
        });
        toast.success('Đã thêm hồ sơ khai thác tài sản thành công');
      } else {
        const adjustmentDetails: AssetValueAdjustmentDetails = {
          decisionNumber: values.decisionNumber,
          decisionDate: values.decisionDate ? values.decisionDate.format('YYYY-MM-DD') : undefined,
          adjustmentDate: values.adjustmentDate
            ? values.adjustmentDate.format('YYYY-MM-DD')
            : undefined,
          adjustmentReason: values.adjustmentReason,
          adjustmentNotes: values.notes,
          originalValueBefore: selected.originalValue,
          originalValueAfter: values.originalValue,
          remainingValueBefore: selected.remainingValue,
          remainingValueAfter:
            values.originalValue != null && values.accumulatedDepreciation != null
              ? Math.max(0, values.originalValue - values.accumulatedDepreciation)
              : undefined,
          declarationDate: values.declarationDate
            ? values.declarationDate.format('YYYY-MM-DD')
            : undefined,
          depreciationRate: values.depreciationRate,
          valueUnit: 'VNĐ',
          assignmentDecisionNumber: values.assignmentDecisionNumber,
          depreciationStartDate: values.depreciationStartDate
            ? values.depreciationStartDate.format('YYYY-MM-DD')
            : undefined,
          depreciationMonths: values.depreciationMonths,
          depreciationEndDate: values.depreciationEndDate
            ? values.depreciationEndDate.format('YYYY-MM-DD')
            : undefined,
          accumulatedDepreciation: values.accumulatedDepreciation,
          monthlyDepreciation:
            values.originalValue && values.depreciationMonths
              ? Math.round(values.originalValue / values.depreciationMonths)
              : undefined,
          disposalMethod: values.disposalMethod,
        };

        if (operationMode === 'increase') {
          await createAssetIncrease({
            assetId: selected.id,
            assetName: selected.assetName,
            quantity: selected.quantity || 1,
            unitOfMeasure: selected.quantityUnit || 'Hệ thống',
            reason: values.adjustmentReason || 'Đầu tư bổ sung',
            increaseCode: `YC-TANG-${Date.now().toString().slice(-6)}`,
            adjustmentDetails,
          });
          toast.success('Đã tạo yêu cầu tăng nguyên giá tài sản thành công');
        } else {
          await createAssetDecrease({
            assetId: selected.id,
            assetName: selected.assetName,
            quantity: selected.quantity || 1,
            unitOfMeasure: selected.quantityUnit || 'Hệ thống',
            reason: values.adjustmentReason || 'Thanh lý một phần',
            decreaseCode: `YC-GIAM-${Date.now().toString().slice(-6)}`,
            adjustmentDetails,
          });
          toast.success('Đã tạo yêu cầu giảm nguyên giá tài sản thành công');
        }
      }

      setOperationMode(undefined);
      operationForm.resetFields();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu thông tin.'));
      }
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
      key: 'scadaId',
      label: 'Mã thiết bị SCADA',
      type: 'select',
      placeholder: 'Chọn thiết bị SCADA',
      options: scadaDevices.map((item) => ({
        value: item.id,
        label: `${item.deviceCode} - ${item.deviceName}`,
      })),
    },
    {
      key: 'assetType',
      label: 'Loại tài sản',
      type: 'select',
      placeholder: 'Chọn loại tài sản',
      options: SCADA_ASSET_TYPES.map((v) => ({ value: v, label: v })),
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
      options: ASSET_CONDITIONS.map((v) => ({ value: v, label: v })),
    },
    {
      key: 'updatedRange',
      label: 'Khoảng ngày cập nhật',
      type: 'dateRange',
      placeholder: ['Từ ngày', 'Đến ngày'],
    },
  ], [organizations, scadaDevices]);

  const tableOptions = useMemo<TableOption<ScadaSystemAsset>>(() => ({
    dataKey: 'id',
    mainColumns: [
      {
        title: 'MÃ & TÊN TÀI SẢN',
        dataIndex: 'assetCode',
        type: TableColumnType.TwoLine,
        subField: 'assetName',
        width: 250,
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
        render: (v, record) => <span style={{ fontWeight: themeTokenChk.fontWeightBold }}>{record.orgUnitName || (v ? orgName.get(v as string) : undefined) || '—'}</span>,
      },
      {
        title: 'ĐƠN VỊ SỬ DỤNG',
        dataIndex: 'usingOrgUnitId',
        type: TableColumnType.Text,
        width: 250,
        allowSort: true,
        render: (v, record) => record.usingOrgUnitName || (v ? orgName.get(v as string) : undefined) || '—',
      },
      {
        title: 'MÃ THIẾT BỊ SCADA',
        dataIndex: 'scadaId',
        type: TableColumnType.Text,
        width: 230,
        allowSort: true,
        render: (v, record) => {
          const a = v ? scadaDeviceMap.get(v as string) : undefined;
          return a ? `${a.deviceCode} - ${a.deviceName}` : record.scadaCode || '—';
        },
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 200,
        allowSort: true,
        render: (v) => v || '—',
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
        sortField: 'updatedAt',
      },
      {
        title: 'CÁN BỘ GỬI PHÊ DUYỆT',
        dataIndex: 'submittedByName',
        type: TableColumnType.TwoLine,
        subField: 'submittedAt',
        width: 240,
        allowSort: true,
        sortField: 'submittedAt',
      },
      {
        title: 'CÁN BỘ PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovedByName',
        type: TableColumnType.TwoLine,
        subField: 'portAuthorityApprovedAt',
        width: 340,
        allowSort: true,
        sortField: 'portAuthorityApprovedAt',
      },
      {
        title: 'CÁN BỘ PHÊ DUYỆT CẤP CỤC',
        dataIndex: 'departmentApprovedByName',
        type: TableColumnType.TwoLine,
        subField: 'departmentApprovedAt',
        width: 260,
        allowSort: true,
        sortField: 'departmentApprovedAt',
      },
    ],
    actions: (record: ScadaSystemAsset) => [
      {
        key: 'detail',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />,
        onClick: () => void openDetail(record),
      },
      {
        key: 'edit',
        label: 'Sửa',
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
          operationForm.setFieldsValue({
            unitOfMeasure: record.quantityUnit,
            quantity: record.quantity,
          });
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
  }), [openDetail, openEdit, operationForm, orgName, scadaDeviceMap]);

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
        className="scada-asset-page-wrapper"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        <style>{`
          .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

          .scada-asset-page-wrapper,
          .scada-asset-page-wrapper .ant-table,
          .scada-asset-page-wrapper .ant-table-cell,
          .scada-asset-page-wrapper .ant-table-thead > tr > th,
          .scada-asset-page-wrapper .ant-table-tbody > tr > td,
          .scada-asset-page-wrapper .ant-input,
          .scada-asset-page-wrapper .ant-select,
          .scada-asset-page-wrapper .ant-select-selection-item,
          .scada-asset-page-wrapper .ant-select-item-option-content,
          .scada-asset-page-wrapper .ant-picker,
          .scada-asset-page-wrapper .ant-picker-input > input,
          .scada-asset-page-wrapper .ant-btn,
          .scada-asset-page-wrapper .ant-pagination,
          .scada-asset-page-wrapper .ant-pagination-item,
          .scada-asset-page-wrapper .ant-pagination-total-text,
          .scada-asset-page-wrapper .ant-breadcrumb,
          .scada-asset-page-wrapper .ant-form-item-label > label {
            font-size: 13.5px !important;
          }

          .scada-asset-page-wrapper .ant-table-thead > tr > th {
            font-size: 12.5px !important;
            letter-spacing: 0.02em;
          }

          .scada-asset-page-wrapper .ant-table-tbody > tr > td {
            padding: 10px 16px !important;
          }
        `}</style>

        <ScreenHeader
          title="Tài sản HT SCADA"
          breadcrumb={BREADCRUMB_ITEMS}
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
              values={draftFilters}
              onChange={setDraftFilters}
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

        <ScadaSystemAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          scadaDevices={scadaDevices}
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

        <ScadaSystemAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          attachments={attachments}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          scadaDeviceMap={scadaDeviceMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        <ScadaSystemAssetOperationForm
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
          onSubmit={handleOperationSubmit}
        />

        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          onCancel={() => setDeleteTarget(undefined)}
          loading={saving}
          itemType="tài sản HT SCADA"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={() => {
            if (!deleteTarget) return;
            setSaving(true);
            void deleteScadaSystemAsset(deleteTarget.id)
              .then(() => {
                toast.success('Đã xóa tài sản HT SCADA.');
                setDeleteTarget(undefined);
                return loadData();
              })
              .catch((cause: unknown) =>
                toast.error(getErrorMessage(cause, 'Không thể xóa tài sản HT SCADA.'))
              )
              .finally(() => setSaving(false));
          }}
        />
      </div>
    </ThemeTokenProvider>
  );
}
