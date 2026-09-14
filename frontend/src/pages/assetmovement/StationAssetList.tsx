import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { Form } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
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
  type TableOption,
  type TableActionOption,
} from '../../components/list-view';
import { normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import {
  triggerBlobDownload,
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import toast from '../../components/ToastNotification';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import {
  createAssetDecrease,
  createAssetIncrease,
  createKhaiThac,
  createStationAsset,
  deleteInfraAssetAttachment,
  deleteStationAsset,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchInfraAssetAttachments,
  fetchKhaiThacList,
  fetchStationAssets,
  updateStationAsset,
  uploadInfraAssetAttachments,
} from '../../services/assetmovement/api';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
  StationAsset,
  StationAssetFilters,
  StationAssetPayload,
} from '../../services/assetmovement/types';
import { organizationService, type Organization } from '../../services/organizationService';
import type { GenericStationOption } from '../../services/stationOptionsService';
import { useAuthStore } from '../../store/authStore';
import * as themeTokenChk from '../../themetokenchk';
import { fontWeightBold } from '../../themetokenchk';
import LritAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './LritAssetOperationForm';
import StationAssetDetailContent from './StationAssetDetailContent';
import StationAssetForm, { type StationFormValues } from './StationAssetForm';
import type { StationTypeConfig } from './stationConfigs';

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

export interface StationAssetListProps {
  config: StationTypeConfig;
  fetchStationOptions: () => Promise<GenericStationOption[]>;
}

export default function StationAssetList({ config, fetchStationOptions }: StationAssetListProps) {
  const [data, setData] = useState<StationAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stations, setStations] = useState<GenericStationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<StationAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<StationAssetFilters>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<StationAsset>();
  const [deleteTarget, setDeleteTarget] = useState<StationAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<StationFormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const orgName = useMemo(() => new Map(organizations.map((item) => [item.id, item.name])), [organizations]);
  const stationMap = useMemo(() => new Map(stations.map((item) => [item.id, item])), [stations]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchStationAssets(
        {
          ...filters,
          page: page - 1,
          size: pageSize,
        },
        config.type,
      );
      const rows = res?.content || [];
      setData(rows);
      setTotal(res?.totalElements || 0);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchStationAssets(baseFilters, config.type),
        ...STATUS_COUNT_KEYS.map((approvalStatus) => fetchStationAssets({ ...baseFilters, approvalStatus }, config.type)),
      ]);
      setStatusCounts({
        all: all?.totalElements || 0,
        ...Object.fromEntries(STATUS_COUNT_KEYS.map((k, i) => [k, statusPages[i]?.totalElements || 0])),
      });
    } catch (e) {
      setError(getErrorMessage(e, `Không thể tải danh sách ${config.title.toLowerCase()}`));
    } finally {
      setLoading(false);
    }
  }, [config.title, config.type, filters, page, pageSize]);

  useEffect(() => {
    void organizationService.getAll().then(setOrganizations).catch(() => {});
    void fetchStationOptions().then(setStations).catch(() => {});
  }, [fetchStationOptions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  const handleOpenCreate = useCallback(() => {
    form.resetFields();
    setSelected(undefined);
    setAttachments([]);
    setExploitationRows([]);
    setIncreaseRows([]);
    setDecreaseRows([]);
    setDrawerMode('create');
  }, [form]);

  const handleOpenEdit = useCallback(async (record: StationAsset) => {
    setSelected(record);
    setAttachments(
      record.attachmentName
        ? [
            {
              id: 'att-1',
              fileName: record.attachmentName,
              fileSize: 1024 * 512,
              uploadDate: record.updatedAt || record.createdAt || '',
              uploadedBy: record.updatedByName || record.submittedByName || 'Hệ thống',
            },
          ]
        : [],
    );
    form.setFieldsValue({
      ...record,
      [config.stationFieldName]: (record as unknown as Record<string, unknown>)[config.stationFieldName] as string | undefined || record.stationId,
      constructionYear: record.constructionYear ? dayjs(String(record.constructionYear), 'YYYY') : undefined,
      useDate: record.useDate ? dayjs(record.useDate) : undefined,
      declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
      depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
      depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
    });
    setDrawerMode('edit');
    try {
      const realAtts = await fetchInfraAssetAttachments(record.id).catch(() => []);
      if (realAtts && realAtts.length > 0) {
        setAttachments(
          realAtts.map((att) => ({
            id: att.id,
            fileName: att.fileName,
            fileSize: att.fileSize,
            fileType: att.contentType,
            uploadedByName: att.uploadedByName || record.updatedByName || '—',
            uploadedDate: att.uploadedAt || (record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString()),
            filePath: `/v1/asset/infra-assets/${record.id}/attachments/${att.id}/download`,
          })),
        );
      } else if (record.attachmentName) {
        setAttachments(
          record.attachmentName.split(',').map((name, i) => ({
            id: `att-${i}`,
            fileName: name.trim(),
            fileSize: 1024 * 512,
            uploadedDate: record.updatedAt || record.createdAt || dayjs().toISOString(),
            uploadedByName: record.updatedByName || record.submittedByName || 'Hệ thống',
          })),
        );
      } else {
        setAttachments([]);
      }
    } catch {
      // fallback
    }

    try {
      const [exp, inc, dec] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetExploitationResponse[] })),
        fetchAssetIncreaseList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetIncreaseResponse[] })),
        fetchAssetDecreaseList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetDecreaseResponse[] })),
      ]);
      setExploitationRows(exp.content || []);
      setIncreaseRows(inc.content || []);
      setDecreaseRows(dec.content || []);
    } catch {
      // ignore
    }
  }, [config.stationFieldName, form]);

  const handleOpenDetail = useCallback(async (record: StationAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exp, inc, dec] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetExploitationResponse[] })),
        fetchAssetIncreaseList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetIncreaseResponse[] })),
        fetchAssetDecreaseList({ assetId: record.id, size: 50 }).catch(() => ({ content: [] as AssetDecreaseResponse[] })),
      ]);
      setExploitationRows(exp.content || []);
      setIncreaseRows(inc.content || []);
      setDecreaseRows(dec.content || []);
    } catch {
      // ignore
    }
  }, []);

  const handleSave = async (status: string) => {
    setSaveAction(status);
    setSaving(true);
    try {
      const values = await form.validateFields();
      const stationIdValue = (values as unknown as Record<string, unknown>)[config.stationFieldName] as string | undefined;
      const payload: StationAssetPayload = {
        ...values,
        assetType: config.type,
        types: config.types,
        stationId: stationIdValue,
        [config.stationFieldName]: stationIdValue,
        constructionYear: values.constructionYear ? Number(values.constructionYear.format('YYYY')) : undefined,
        useDate: values.useDate ? values.useDate.format('YYYY-MM-DD') : undefined,
        declarationDate: values.declarationDate ? values.declarationDate.format('YYYY-MM-DD') : undefined,
        depreciationStartDate: values.depreciationStartDate ? values.depreciationStartDate.format('YYYY-MM-DD') : undefined,
        depreciationEndDate: values.depreciationEndDate ? values.depreciationEndDate.format('YYYY-MM-DD') : undefined,
        attachmentName: attachments.length > 0 ? attachments[0].fileName : undefined,
        approvalStatus: status,
      };

      let savedId: string | undefined;
      if (drawerMode === 'create') {
        const created = await createStationAsset(payload, config.type);
        savedId = created.id;
        if (values.operatorOrgUnitId || values.totalRevenue || values.exploitationDeadline) {
          const deadlineDate = values.exploitationDeadline
            ? (dayjs.isDayjs(values.exploitationDeadline) ? values.exploitationDeadline : dayjs(values.exploitationDeadline))
            : undefined;

          await createKhaiThac({
            assetId: created.id,
            assetName: created.assetName,
            operatorOrgUnitId: values.operatorOrgUnitId || undefined,
            exploitationYear: deadlineDate && deadlineDate.isValid() ? deadlineDate.year() : dayjs().year(),
            doanhThu: values.totalRevenue || 0,
            depreciation: values.relatedCosts || 0,
            description: values.description || '',
            unitOfMeasure: values.unitOfMeasure,
            quantity: values.exploitationQuantity || 1,
            exploitationDeadline: deadlineDate && deadlineDate.isValid() ? deadlineDate.format('YYYY-MM-DD') : undefined,
            totalRevenue: values.totalRevenue,
            relatedCosts: values.relatedCosts,
            stateBudgetPayment: values.stateBudgetPayment,
            projectAmount: values.projectAmount,
          }).catch(() => {});
        }
        toast.success(`Thêm mới ${config.title.toLowerCase()} thành công`);
      } else if (drawerMode === 'edit' && selected) {
        await updateStationAsset(selected.id, payload, config.type);
        savedId = selected.id;
        if (values.operatorOrgUnitId || values.totalRevenue || values.exploitationDeadline) {
          const deadlineDate = values.exploitationDeadline
            ? (dayjs.isDayjs(values.exploitationDeadline) ? values.exploitationDeadline : dayjs(values.exploitationDeadline))
            : undefined;

          await createKhaiThac({
            assetId: selected.id,
            assetName: selected.assetName,
            operatorOrgUnitId: values.operatorOrgUnitId || undefined,
            exploitationYear: deadlineDate && deadlineDate.isValid() ? deadlineDate.year() : dayjs().year(),
            doanhThu: values.totalRevenue || 0,
            depreciation: values.relatedCosts || 0,
            description: values.description || '',
            unitOfMeasure: values.unitOfMeasure,
            quantity: values.exploitationQuantity || 1,
            exploitationDeadline: deadlineDate && deadlineDate.isValid() ? deadlineDate.format('YYYY-MM-DD') : undefined,
            totalRevenue: values.totalRevenue,
            relatedCosts: values.relatedCosts,
            stateBudgetPayment: values.stateBudgetPayment,
            projectAmount: values.projectAmount,
          }).catch(() => {});
        }
        toast.success(`Cập nhật ${config.title.toLowerCase()} thành công`);
      }

      const filesToUpload = attachments
        .map((a) => a.originFileObj || (a as unknown as { file?: File }).file)
        .filter((f): f is File => f instanceof File);
      if (filesToUpload.length > 0 && savedId) {
        try {
          await uploadInfraAssetAttachments(savedId, filesToUpload);
        } catch (uploadErr) {
          console.error('Upload attachments error:', uploadErr);
        }
      }

      setDrawerMode(undefined);
      void loadData();
    } catch (e) {
      if (!isValidationError(e)) {
        toast.error(getErrorMessage(e, 'Lưu dữ liệu không thành công'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteStationAsset(deleteTarget.id);
      toast.success(`Xóa ${config.title.toLowerCase()} thành công`);
      setDeleteTarget(undefined);
      void loadData();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Không thể xóa tài sản'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitOperation = async () => {
    if (!selected || !operationMode) return;
    setSaving(true);
    try {
      const values = await operationForm.validateFields();

      if (operationMode === 'exploit') {
        const deadlineDate = values.exploitationDeadline
          ? (dayjs.isDayjs(values.exploitationDeadline) ? values.exploitationDeadline : dayjs(values.exploitationDeadline))
          : undefined;

        await createKhaiThac({
          assetId: selected.id,
          assetName: selected.assetName,
          operatorOrgUnitId: values.operatorOrgUnitId || undefined,
          exploitationYear: deadlineDate && deadlineDate.isValid() ? deadlineDate.year() : dayjs().year(),
          doanhThu: values.totalRevenue || 0,
          depreciation: values.relatedCosts || 0,
          description: values.notes || '',
          unitOfMeasure: values.unitOfMeasure,
          quantity: values.quantity,
          exploitationDeadline: deadlineDate && deadlineDate.isValid() ? deadlineDate.format('YYYY-MM-DD') : undefined,
          totalRevenue: values.totalRevenue,
          relatedCosts: values.relatedCosts,
          stateBudgetPayment: values.stateBudgetPayment,
          projectAmount: values.projectAmount,
        });
        toast.success('Lưu thông tin khai thác thành công');
      } else if (operationMode === 'increase') {
        const toDateStr = (d?: Dayjs | string) => {
          if (!d) return undefined;
          const parsed = dayjs.isDayjs(d) ? d : dayjs(d);
          return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined;
        };
        const details: AssetValueAdjustmentDetails = {
          decisionNumber: values.decisionNumber,
          decisionDate: toDateStr(values.decisionDate),
          adjustmentDate: toDateStr(values.adjustmentDate),
          adjustmentReason: values.adjustmentReason,
          adjustmentNotes: values.notes,
          declarationDate: toDateStr(values.declarationDate),
          originalValue: values.originalValue,
          depreciationRate: values.depreciationRate,
          assignmentDecisionNumber: values.assignmentDecisionNumber,
          depreciationStartDate: toDateStr(values.depreciationStartDate),
          depreciationMonths: values.depreciationMonths,
          depreciationEndDate: toDateStr(values.depreciationEndDate),
          accumulatedDepreciation: values.accumulatedDepreciation,
          disposalMethod: values.disposalMethod,
        };
        await createAssetIncrease({
          assetId: selected.id,
          assetName: selected.assetName,
          increaseCode: values.decisionNumber || `INC-${Date.now()}`,
          reason: values.adjustmentReason || '',
          quantity: values.quantity || 1,
          unitOfMeasure: selected.quantityUnit || 'Cái',
          adjustmentDetails: details,
        });
        toast.success('Gửi yêu cầu tăng nguyên giá thành công');
      } else if (operationMode === 'decrease') {
        const toDateStr = (d?: Dayjs | string) => {
          if (!d) return undefined;
          const parsed = dayjs.isDayjs(d) ? d : dayjs(d);
          return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined;
        };
        const details: AssetValueAdjustmentDetails = {
          decisionNumber: values.decisionNumber,
          decisionDate: toDateStr(values.decisionDate),
          adjustmentDate: toDateStr(values.adjustmentDate),
          adjustmentReason: values.adjustmentReason,
          adjustmentNotes: values.notes,
          declarationDate: toDateStr(values.declarationDate),
          originalValue: values.originalValue,
          depreciationRate: values.depreciationRate,
          assignmentDecisionNumber: values.assignmentDecisionNumber,
          depreciationStartDate: toDateStr(values.depreciationStartDate),
          depreciationMonths: values.depreciationMonths,
          depreciationEndDate: toDateStr(values.depreciationEndDate),
          accumulatedDepreciation: values.accumulatedDepreciation,
          disposalMethod: values.disposalMethod,
        };
        await createAssetDecrease({
          assetId: selected.id,
          assetName: selected.assetName,
          decreaseCode: values.decisionNumber || `DEC-${Date.now()}`,
          reason: values.adjustmentReason || '',
          decreaseReason: values.adjustmentReason || '',
          quantity: values.quantity || 1,
          unitOfMeasure: selected.quantityUnit || 'Cái',
          adjustmentDetails: details,
        });
        toast.success('Gửi yêu cầu giảm nguyên giá thành công');
      }

      setOperationMode(undefined);
      operationForm.resetFields();
      void loadData();
    } catch (e) {
      if (!isValidationError(e)) {
        toast.error(getErrorMessage(e, 'Thực hiện thao tác thất bại'));
      }
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
        key: config.stationFieldName,
        label: config.stationLabel,
        type: 'select',
        placeholder: config.stationPlaceholder,
        options: stations.map((s) => ({
          value: s.id,
          label: s.code ? `${s.code} - ${s.name}` : s.name,
        })),
      },
      {
        key: 'assetType',
        label: 'Loại tài sản',
        type: 'select',
        disabled: true,
        defaultValue: config.type,
        options: [{ value: config.type, label: config.title }],
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
    [config.stationFieldName, config.stationLabel, config.stationPlaceholder, config.title, config.type, organizations, stations],
  );

  const handleFilterApply = useCallback(() => {
    setPage(1);
    const range = draftFilters.updatedRange as [Dayjs | null, Dayjs | null] | undefined;
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

  const tableOptions = useMemo<TableOption<StationAsset>>(
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
          onClick: (record) => void handleOpenDetail(record),
        },
        {
          title: 'ĐƠN VỊ QUẢN LÝ',
          dataIndex: 'orgUnitId',
          type: TableColumnType.Text,
          width: 250,
          bold: true,
          allowSort: true,
          render: (v) => <span style={{ fontWeight: fontWeightBold }}>{orgName.get(v as string) || '—'}</span>,
        },
        {
          title: 'ĐƠN VỊ SỬ DỤNG',
          dataIndex: 'usingOrgUnitId',
          type: TableColumnType.Text,
          width: 250,
          allowSort: true,
          render: (v) => orgName.get(v as string) || '—',
        },
        {
          title: config.stationLabel.toUpperCase(),
          dataIndex: config.stationFieldName as keyof StationAsset,
          type: TableColumnType.Text,
          width: 190,
          allowSort: true,
          render: (_v, record) => {
            const sId = (record as unknown as Record<string, unknown>)[config.stationFieldName] || record.stationId || record.lritStationId || record.ttdhStationId || record.inmarsatStationId || record.cospasSarsatStationId || record.ttxlttStationId;
            const st = stationMap.get(sId as string);
            return st ? (st.code ? `${st.code} - ${st.name}` : st.name) : '—';
          },
        },
        {
          title: 'LOẠI TÀI SẢN',
          dataIndex: 'assetType',
          type: TableColumnType.Text,
          width: 180,
          allowSort: true,
          render: () => config.title,
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
          title: 'CÁN BỘ PHÊ DUYỆT CẤP CỤC',
          dataIndex: 'departmentApprovedByName',
          type: TableColumnType.TwoLine,
          subField: 'departmentApprovedAt',
          width: 260,
          allowSort: true,
          sortField: 'departmentApprovedBy',
        },
      ],
      actions: (record: StationAsset) => {
        const isDraft = normalizeApprovalStatus(record.approvalStatus) === 'DRAFT';
        const actionsList: TableActionOption<StationAsset>[] = [
          {
            key: 'detail',
            label: 'Xem chi tiết',
            icon: <EyeOutlined />,
            onClick: () => void handleOpenDetail(record),
          },
          {
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <EditOutlined />,
            onClick: () => handleOpenEdit(record),
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
        ];

        if (isDraft) {
          actionsList.push({
            key: 'delete',
            label: 'Xóa',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => setDeleteTarget(record),
          });
        }

        return actionsList;
      },
    }),
    [config.stationFieldName, config.stationLabel, config.title, handleOpenDetail, handleOpenEdit, operationForm, orgName, stationMap],
  );

  const headerActions: ScreenHeaderAction[] = useMemo(
    () => [
      {
        key: 'create',
        label: 'Thêm mới',
        icon: <PlusOutlined />,
        variant: 'primary',
        onClick: handleOpenCreate,
      },
    ],
    [handleOpenCreate],
  );

  const customTokens = useMemo(
    () => ({
      ...themeTokenChk,
      fontSizeMd: 13.5,
    }),
    [],
  );

  return (
    <ThemeTokenProvider tokens={customTokens}>
      <div className="station-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

          .station-page-wrapper,
          .station-page-wrapper .ant-table,
          .station-page-wrapper .ant-table-cell,
          .station-page-wrapper .ant-table-thead > tr > th,
          .station-page-wrapper .ant-table-tbody > tr > td,
          .station-page-wrapper .ant-input,
          .station-page-wrapper .ant-select,
          .station-page-wrapper .ant-select-selection-item,
          .station-page-wrapper .ant-select-item-option-content,
          .station-page-wrapper .ant-picker,
          .station-page-wrapper .ant-picker-input > input,
          .station-page-wrapper .ant-btn,
          .station-page-wrapper .ant-pagination,
          .station-page-wrapper .ant-pagination-item,
          .station-page-wrapper .ant-pagination-total-text,
          .station-page-wrapper .ant-breadcrumb,
          .station-page-wrapper .ant-form-item-label > label,
          .station-asset-drawer-scope,
          .station-asset-drawer-scope .ant-drawer-content,
          .station-asset-drawer-scope .ant-tabs-tab,
          .station-asset-drawer-scope .chk-detail-label,
          .station-asset-drawer-scope .chk-detail-value,
          .station-asset-drawer-scope .ant-table,
          .station-asset-drawer-scope .ant-table-cell,
          .station-asset-drawer-scope .ant-table-thead > tr > th,
          .station-asset-drawer-scope .ant-btn,
          .station-asset-drawer-scope .ant-select,
          .station-asset-drawer-scope .ant-input,
          .station-asset-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }

          .station-page-wrapper div:has(> button[aria-pressed]) {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            justify-content: center !important;
            justify-content: safe center !important;
            align-items: center !important;
            scrollbar-width: thin !important;
            scrollbar-color: #cbd5e1 #f8fafc !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            padding: 2px 16px 6px 16px !important;
            gap: 20px !important;
          }
          .station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .station-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }

          .station-page-wrapper > div:first-of-type {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          .station-asset-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
        `}</style>

        <ScreenHeader
          breadcrumb={[{ label: config.breadcrumbGroup }, { label: config.breadcrumbItem }]}
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

        {/* ── Create / Edit Drawer (DynamicFormSidebar) ─────────────── */}
        <StationAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          config={config}
          form={form}
          organizations={organizations}
          stations={stations}
          attachments={attachments}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
          orgName={(id) => orgName.get(id || '') || '—'}
          saving={saving}
          saveAction={saveAction}
          onClose={() => {
            setDrawerMode(undefined);
            form.resetFields();
          }}
          onSave={handleSave}
          onUploadAttachment={(file) => {
            const newAtt: InfrastructureAttachmentItem = {
              id: `att-${Date.now()}`,
              fileName: file.name,
              fileSize: file.size,
              uploadDate: dayjs().toISOString(),
              uploadedBy: currentUser?.fullName || currentUser?.username || 'Hệ thống',
            };
            setAttachments((prev) => [...prev, newAtt]);
          }}
          onDeleteAttachment={(id) => {
            if (selected?.id && id.includes('-') && !id.startsWith('att-')) {
              deleteInfraAssetAttachment(selected.id, id).catch(() => {});
            }
            setAttachments((prev) => prev.filter((a) => a.id !== id));
          }}
          onDownloadAttachment={(_id, fileName) => {
            const att = attachments.find((a) => a.id === _id || a.fileName === fileName);
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
            triggerBlobDownload(new Blob([`Tài liệu: ${fileName}`], { type: 'application/octet-stream' }), fileName);
            toast.success(`Đã tải xuống tệp: ${fileName}`);
          }}
        />

        {/* ── Detail Drawer (DynamicViewSidebar) ─────────────────────── */}
        <StationAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          config={config}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          stationMap={stationMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        {/* ── Operations Drawer (DynamicFormSidebar) ─────────────────── */}
        <LritAssetOperationForm
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
          onSubmit={handleSubmitOperation}
        />

        {/* ── Delete Confirmation Modal ────────────────────────────── */}
        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          onCancel={() => setDeleteTarget(undefined)}
          loading={saving}
          itemType={config.title.toLowerCase()}
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={handleDelete}
        />
      </div>
    </ThemeTokenProvider>
  );
}
