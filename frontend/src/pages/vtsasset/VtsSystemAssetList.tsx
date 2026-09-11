import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  fetchVtsSystemAssets,
  createVtsSystemAsset,
  updateVtsSystemAsset,
  deleteVtsSystemAsset,
  fetchVtsSystemOptions,
  type VtsSystemOption,
} from '../../services/vtsasset/api';
import type {
  VtsSystemAsset,
  VtsSystemAssetFilters,
  VtsSystemAssetPayload,
} from '../../services/vtsasset/types';
import {
  fetchKhaiThacList,
  fetchAssetIncreaseList,
  fetchAssetDecreaseList,
  createKhaiThac,
  createAssetIncrease,
  createAssetDecrease,
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
import * as themeTokenChk from '../../themetokenchk';
import { fontWeightBold } from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import VtsSystemAssetForm, { type FormValues } from './VtsSystemAssetForm';
import VtsSystemAssetDetailContent from './VtsSystemAssetDetailContent';
import VtsSystemAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './VtsSystemAssetOperationForm';

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
const VTS_ASSET_TYPES = [
  'Trạm radar',
  'Hệ thống trạm bờ AIS',
  'Quản lý hệ thống CCTV',
  'Quản lý hệ thống SCADA',
  'Quản lý hệ thống truyền dẫn',
  'Quản lý hệ thống phụ trợ VTS',
  'Khác',
];

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) => Boolean((cause as { errorFields?: unknown }).errorFields);

export default function VtsSystemAssetList() {
  const [data, setData] = useState<VtsSystemAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [vtsSystems, setVtsSystems] = useState<VtsSystemOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<VtsSystemAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<VtsSystemAssetFilters>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<VtsSystemAsset>();
  const [deleteTarget, setDeleteTarget] = useState<VtsSystemAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<AssetExploitationResponse[]>([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  const orgName = useMemo(
    () => new Map(organizations.map((item) => [item.id, item.name])),
    [organizations]
  );
  const vtsSystemMap = useMemo(
    () => new Map(vtsSystems.map((item) => [item.id, { code: item.code, name: item.name }])),
    [vtsSystems]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchVtsSystemAssets({
        ...filters,
        page: page - 1,
        size: pageSize,
      });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchVtsSystemAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) =>
          fetchVtsSystemAssets({ ...baseFilters, approvalStatus })
        ),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(
          STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])
        ),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản hệ thống VTS.'));
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
      .then((orgs) => setOrganizations(orgs))
      .catch((err) => {
        console.error('Không thể tải danh mục đơn vị:', err);
        toast.error('Không thể tải danh mục đơn vị.');
      });

    void fetchVtsSystemOptions()
      .then((vtsList) => setVtsSystems(vtsList))
      .catch((err) => {
        console.error('Không thể tải danh mục hệ thống VTS:', err);
      });
  }, []);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode('create');
    form.resetFields();
    form.setFieldsValue({ status: 'MANAGED' });
    setAttachments([]);
  }, [form]);

  const openEdit = useCallback(
    (record: VtsSystemAsset) => {
      setSelected(record);
      setDrawerMode('edit');
      form.setFieldsValue({
        ...record,
        constructionYear: record.constructionYear
          ? dayjs(String(record.constructionYear))
          : undefined,
        useDate: record.useDate ? dayjs(record.useDate) : undefined,
        declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
        depreciationStartDate: record.depreciationStartDate
          ? dayjs(record.depreciationStartDate)
          : undefined,
        depreciationEndDate: record.depreciationEndDate
          ? dayjs(record.depreciationEndDate)
          : undefined,
        attachmentName: record.attachmentName,
      });
      if (record.attachmentName) {
        const names = record.attachmentName
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean);
        const initialAtts: InfrastructureAttachmentItem[] = names.map((name, i) => ({
          id: `att-${i}`,
          fileName: name,
          fileSize: 1024 * 1024,
          uploadedByName:
            record.updatedByName || record.submittedByName || currentUser?.fullName || 'Hệ thống',
          uploadedDate: record.updatedAt
            ? dayjs(record.updatedAt).toISOString()
            : dayjs().toISOString(),
        }));
        setAttachments(initialAtts);
        Promise.all(
          names.map(async (name, i) => {
            try {
              const url = await getAttachmentPreviewUrl(name, {
                assetCode: record.assetCode,
                assetName: record.assetName,
              });
              return { id: `att-${i}`, url };
            } catch {
              return { id: `att-${i}`, url: undefined };
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
      } else {
        setAttachments([]);
      }
    },
    [currentUser?.fullName, form]
  );

  const openDetail = useCallback(async (record: VtsSystemAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exploitData, increaseData, decreaseData] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id, page: 0, size: 50 }),
        fetchAssetIncreaseList({ assetId: record.id, page: 0, size: 50 }),
        fetchAssetDecreaseList({ assetId: record.id, page: 0, size: 50 }),
      ]);
      setExploitationRows(exploitData.content);
      setIncreaseRows(increaseData.content);
      setDecreaseRows(decreaseData.content);
    } catch {
      setExploitationRows([]);
      setIncreaseRows([]);
      setDecreaseRows([]);
    }
  }, []);

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

  const saveAsset = async (approvalStatus: string) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(approvalStatus);

      const payload: VtsSystemAssetPayload = {
        ...values,
        approvalStatus,
        status: values.status || 'MANAGED',
        constructionYear: values.constructionYear ? values.constructionYear.year() : undefined,
        useDate: values.useDate ? values.useDate.format('YYYY-MM-DD') : undefined,
        declarationDate: values.declarationDate
          ? values.declarationDate.format('YYYY-MM-DD')
          : undefined,
        depreciationStartDate: values.depreciationStartDate
          ? values.depreciationStartDate.format('YYYY-MM-DD')
          : undefined,
        depreciationEndDate: values.depreciationEndDate
          ? values.depreciationEndDate.format('YYYY-MM-DD')
          : undefined,
        attachmentName:
          attachments.length > 0 ? attachments.map((a) => a.fileName).join(', ') : undefined,
      };

      if (drawerMode === 'edit' && selected) {
        await updateVtsSystemAsset(selected.id, payload);
        toast.success(
          approvalStatus === 'APPROVED'
            ? 'Đã cập nhật và phê duyệt tài sản hệ thống VTS thành công'
            : 'Đã cập nhật tài sản hệ thống VTS thành công'
        );
      } else {
        await createVtsSystemAsset(payload);
        toast.success(
          approvalStatus === 'APPROVED'
            ? 'Đã tạo mới và phê duyệt tài sản hệ thống VTS thành công'
            : approvalStatus === 'PENDING_APPROVAL'
              ? 'Đã tạo và gửi phê duyệt tài sản hệ thống VTS thành công'
              : 'Đã lưu tạm tài sản hệ thống VTS thành công'
        );
      }

      setDrawerMode(undefined);
      form.resetFields();
      void loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu tài sản hệ thống VTS.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await deleteVtsSystemAsset(deleteTarget.id);
      toast.success('Đã xóa tài sản hệ thống VTS thành công');
      setDeleteTarget(undefined);
      void loadData();
    } catch (cause: unknown) {
      toast.error(getErrorMessage(cause, 'Không thể xóa tài sản hệ thống VTS.'));
    } finally {
      setSaving(false);
    }
  };

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
      key: 'vtsSystemId',
      label: 'Mã hệ thống VTS',
      type: 'select',
      placeholder: 'Chọn hệ thống VTS',
      options: vtsSystems.map((item) => ({
        value: item.id,
        label: `${item.code} - ${item.name}`,
      })),
    },
    {
      key: 'assetType',
      label: 'Loại tài sản',
      type: 'select',
      placeholder: 'Chọn loại tài sản',
      options: VTS_ASSET_TYPES.map((v) => ({ value: v, label: v })),
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
  ], [organizations, vtsSystems]);

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

  const tableOptions = useMemo<TableOption<VtsSystemAsset>>(() => ({
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
        width: 240,
        bold: true,
        allowSort: true,
        render: (v) => (
          <span style={{ fontWeight: fontWeightBold }}>
            {orgName.get(v as string) || '—'}
          </span>
        ),
      },
      {
        title: 'ĐƠN VỊ SỬ DỤNG',
        dataIndex: 'usingOrgUnitId',
        type: TableColumnType.Text,
        width: 240,
        allowSort: true,
        render: (v) => orgName.get(v as string) || '—',
      },
      {
        title: 'MÃ HỆ THỐNG VTS',
        dataIndex: 'vtsSystemId',
        type: TableColumnType.Text,
        width: 190,
        allowSort: true,
        render: (v, r) => vtsSystemMap.get(v as string)?.code || r.vtsSystemCode || '—',
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 180,
        allowSort: true,
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
        width: 200,
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
    actions: (record: VtsSystemAsset) => [
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
  }), [openDetail, openEdit, operationForm, orgName, vtsSystemMap]);

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
        className="vts-asset-page-wrapper"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        <style>{`
          .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

          .vts-asset-page-wrapper,
          .vts-asset-page-wrapper .ant-table,
          .vts-asset-page-wrapper .ant-table-cell,
          .vts-asset-page-wrapper .ant-table-thead > tr > th,
          .vts-asset-page-wrapper .ant-table-tbody > tr > td,
          .vts-asset-page-wrapper .ant-input,
          .vts-asset-page-wrapper .ant-select,
          .vts-asset-page-wrapper .ant-select-selection-item,
          .vts-asset-page-wrapper .ant-select-item-option-content,
          .vts-asset-page-wrapper .ant-picker,
          .vts-asset-page-wrapper .ant-picker-input > input,
          .vts-asset-page-wrapper .ant-btn,
          .vts-asset-page-wrapper .ant-pagination,
          .vts-asset-page-wrapper .ant-pagination-item,
          .vts-asset-page-wrapper .ant-pagination-total-text,
          .vts-asset-page-wrapper .ant-breadcrumb,
          .vts-asset-page-wrapper .ant-form-item-label > label {
            font-size: 13.5px !important;
          }
        `}</style>

        <ScreenHeader
          title="Tài sản hệ thống VTS"
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản hệ thống VTS' },
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

        <VtsSystemAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          vtsSystems={vtsSystems}
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

        <VtsSystemAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          vtsSystemMap={vtsSystemMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        <VtsSystemAssetOperationForm
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
          targetName={deleteTarget?.assetName}
          confirmLoading={saving}
          onCancel={() => setDeleteTarget(undefined)}
          onConfirm={handleDelete}
        />
      </div>
    </ThemeTokenProvider>
  );
}
