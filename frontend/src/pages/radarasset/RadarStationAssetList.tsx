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
  fetchRadarStationAssets,
  createRadarStationAsset,
  updateRadarStationAsset,
  deleteRadarStationAsset,
  fetchRadarStationOptions,
  type RadarStationOption,
} from '../../services/radarasset/api';
import type {
  RadarStationAsset,
  RadarStationAssetFilters,
  RadarStationAssetPayload,
} from '../../services/radarasset/types';
import {
  fetchKhaiThacList,
  fetchAssetIncreaseList,
  fetchAssetDecreaseList,
  createKhaiThac,
  createAssetIncrease,
  createAssetDecrease,
} from '../../services/assetmovement/api';
import type {
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
  AssetValueAdjustmentDetails,
} from '../../services/assetmovement/types';
import type { InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import {
  saveAttachmentFile,
  downloadAttachmentFile,
  getAttachmentPreviewUrl,
} from '../../utils/attachmentStorage';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import RadarStationAssetForm, { type FormValues } from './RadarStationAssetForm';
import RadarStationAssetDetailContent from './RadarStationAssetDetailContent';
import RadarStationAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from './RadarStationAssetOperationForm';

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
const RADAR_ASSET_TYPES = [
  'Trạm radar',
  'Anten radar',
  'Máy phát/thu radar',
  'Màn hình hiển thị radar',
  'Hệ thống phụ trợ',
  'Khác',
];

const getErrorMessage = (cause: unknown, fallback: string) => {
  const error = cause as { response?: { data?: { message?: string } }; errorFields?: unknown };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) =>
  Boolean((cause as { errorFields?: unknown }).errorFields);

export default function RadarStationAssetList() {
  const [data, setData] = useState<RadarStationAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [radarStations, setRadarStations] = useState<RadarStationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>('DRAFT');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<RadarStationAssetFilters>({});
  const [draftFilters, setDraftFilters] = useState<RadarStationAssetFilters>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<RadarStationAsset>();
  const [deleteTarget, setDeleteTarget] = useState<RadarStationAsset>();
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
  const radarStationMap = useMemo(
    () => new Map(radarStations.map((item) => [item.id, { code: item.code, name: item.name }])),
    [radarStations]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchRadarStationAssets({
        ...filters,
        page: page - 1,
        size: pageSize,
      });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = { ...filters, approvalStatus: undefined, page: 0, size: 1 };
      const [all, ...statusPages] = await Promise.all([
        fetchRadarStationAssets(baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) =>
          fetchRadarStationAssets({ ...baseFilters, approvalStatus })
        ),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(
          STATUS_COUNT_KEYS.map((key, index) => [key, statusPages[index].totalElements])
        ),
      });
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Không thể tải danh sách tài sản trạm radar.'));
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

    void fetchRadarStationOptions()
      .then((radarList) => setRadarStations(radarList))
      .catch((err) => {
        console.error('Không thể tải danh mục trạm radar:', err);
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
    (record: RadarStationAsset) => {
      setSelected(record);
      setDrawerMode('edit');
      form.setFieldsValue({
        ...record,
        constructionYear: record.constructionYear ? dayjs(`${record.constructionYear}-01-01`) : undefined,
        useDate: record.useDate ? dayjs(record.useDate) : undefined,
        declarationDate: record.declarationDate ? dayjs(record.declarationDate) : undefined,
        depreciationStartDate: record.depreciationStartDate ? dayjs(record.depreciationStartDate) : undefined,
        depreciationEndDate: record.depreciationEndDate ? dayjs(record.depreciationEndDate) : undefined,
      });
      if (record.attachmentName) {
        const names = record.attachmentName.split(',').map((s) => s.trim()).filter(Boolean);
        const initialAtts: InfrastructureAttachmentItem[] = names.map((name, i) => ({
          id: `radar-att-${i + 1}`,
          fileName: name,
          fileSize: 1024 * 1024,
          uploadedAt: record.createdAt,
          uploadedByName: record.createdByName || 'Cán bộ hiện tại',
        }));
        setAttachments(initialAtts);
        Promise.all(
          names.map(async (name, i) => {
            try {
              const url = await getAttachmentPreviewUrl(name, {
                assetCode: record.assetCode,
                assetName: record.assetName,
              });
              return { id: `radar-att-${i + 1}`, url };
            } catch {
              return { id: `radar-att-${i + 1}`, url: undefined };
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
    [form]
  );

  const openDetail = useCallback(async (record: RadarStationAsset) => {
    setSelected(record);
    setDrawerMode('detail');
    try {
      const [exp, inc, dec] = await Promise.all([
        fetchKhaiThacList({ assetId: record.id }),
        fetchAssetIncreaseList({ assetId: record.id }),
        fetchAssetDecreaseList({ assetId: record.id }),
      ]);
      setExploitationRows(exp.items || []);
      setIncreaseRows(inc.items || []);
      setDecreaseRows(dec.items || []);
    } catch {
      setExploitationRows([]);
      setIncreaseRows([]);
      setDecreaseRows([]);
    }
  }, []);

  const handleUploadAttachment = (file: File) => {
    void saveAttachmentFile(file.name, file);
    const url = URL.createObjectURL(file);
    const newItem: InfrastructureAttachmentItem = {
      id: `att-upload-${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      file,
      originFileObj: file,
      url,
      uploadedAt: new Date().toISOString(),
      uploadedByName: 'Cán bộ hiện tại',
    };
    setAttachments((prev) => {
      const next = [...prev, newItem];
      form.setFieldValue('attachmentName', next.map((a) => a.fileName).join(', '));
      return next;
    });
    toast.success(`Đã tải lên tệp: ${file.name}`);
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => {
      const next = prev.filter((item) => item.id !== id);
      form.setFieldValue(
        'attachmentName',
        next.length > 0 ? next.map((a) => a.fileName).join(', ') : undefined
      );
      return next;
    });
    toast.success('Đã xóa tệp đính kèm');
  };

  const handleDownloadAttachment = async (_id: string, fileName: string) => {
    await downloadAttachmentFile(fileName, {
      assetCode: selected?.assetCode,
      assetName: selected?.assetName,
    });
  };

  const saveAsset = async (targetApprovalStatus: string) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(targetApprovalStatus);

      const payload: RadarStationAssetPayload = {
        ...values,
        approvalStatus: targetApprovalStatus,
        constructionYear: values.constructionYear ? values.constructionYear.year() : undefined,
        useDate: values.useDate ? values.useDate.format('YYYY-MM-DD') : undefined,
        declarationDate: values.declarationDate ? values.declarationDate.format('YYYY-MM-DD') : undefined,
        depreciationStartDate: values.depreciationStartDate
          ? values.depreciationStartDate.format('YYYY-MM-DD')
          : undefined,
        depreciationEndDate: values.depreciationEndDate
          ? values.depreciationEndDate.format('YYYY-MM-DD')
          : undefined,
        attachmentName: attachments.length > 0 ? attachments[0].fileName : undefined,
      };

      if (drawerMode === 'create') {
        await createRadarStationAsset(payload);
        toast.success('Đã tạo tài sản trạm radar thành công.');
      } else if (drawerMode === 'edit' && selected) {
        await updateRadarStationAsset(selected.id, payload);
        toast.success('Đã cập nhật tài sản trạm radar thành công.');
      }

      setDrawerMode(undefined);
      form.resetFields();
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(getErrorMessage(cause, 'Không thể lưu tài sản trạm radar.'));
      }
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
      key: 'radarStationId',
      label: 'Mã trạm radar',
      type: 'select',
      placeholder: 'Chọn trạm radar',
      options: radarStations.map((item) => ({
        value: item.id,
        label: `${item.code} - ${item.name}`,
      })),
    },
    {
      key: 'assetType',
      label: 'Loại tài sản',
      type: 'select',
      placeholder: 'Chọn loại tài sản',
      options: RADAR_ASSET_TYPES.map((v) => ({ value: v, label: v })),
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
  ], [organizations, radarStations]);

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

  const tableOptions = useMemo<TableOption<RadarStationAsset>>(() => ({
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
        title: 'MÃ TRẠM RADAR',
        dataIndex: 'radarStationId',
        type: TableColumnType.Text,
        width: 190,
        allowSort: true,
        render: (v, record) => {
          const r = v ? radarStationMap.get(v as string) : undefined;
          return r ? `${r.code} - ${r.name}` : record.radarStationCode || '—';
        },
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 160,
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
    actions: (record: RadarStationAsset) => [
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
  }), [openDetail, openEdit, operationForm, orgName, radarStationMap]);

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
        className="radar-asset-page-wrapper"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        <style>{`
          .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

          .radar-asset-page-wrapper,
          .radar-asset-page-wrapper .ant-table,
          .radar-asset-page-wrapper .ant-table-cell,
          .radar-asset-page-wrapper .ant-table-thead > tr > th,
          .radar-asset-page-wrapper .ant-table-tbody > tr > td,
          .radar-asset-page-wrapper .ant-input,
          .radar-asset-page-wrapper .ant-select,
          .radar-asset-page-wrapper .ant-select-selection-item,
          .radar-asset-page-wrapper .ant-select-item-option-content,
          .radar-asset-page-wrapper .ant-picker,
          .radar-asset-page-wrapper .ant-picker-input > input,
          .radar-asset-page-wrapper .ant-btn,
          .radar-asset-page-wrapper .ant-pagination,
          .radar-asset-page-wrapper .ant-pagination-item,
          .radar-asset-page-wrapper .ant-pagination-total-text,
          .radar-asset-page-wrapper .ant-breadcrumb,
          .radar-asset-page-wrapper .ant-form-item-label > label {
            font-size: 13.5px !important;
          }
        `}</style>

        <ScreenHeader
          title="Tài sản trạm radar"
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tài sản trạm radar' },
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

        <RadarStationAssetForm
          open={drawerMode === 'create' || drawerMode === 'edit'}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          radarStations={radarStations}
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

        <RadarStationAssetDetailContent
          open={drawerMode === 'detail'}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          radarStationMap={radarStationMap}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        <RadarStationAssetOperationForm
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
          itemType="tài sản trạm radar"
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={() => {
            if (!deleteTarget) return;
            setSaving(true);
            void deleteRadarStationAsset(deleteTarget.id)
              .then(() => {
                toast.success('Đã xóa tài sản trạm radar.');
                setDeleteTarget(undefined);
                return loadData();
              })
              .catch((cause: unknown) =>
                toast.error(getErrorMessage(cause, 'Không thể xóa tài sản trạm radar.'))
              )
              .finally(() => setSaving(false));
          }}
        />
      </div>
    </ThemeTokenProvider>
  );
}
