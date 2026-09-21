import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  RocketOutlined,
  SearchOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Button, DatePicker, Form, Input, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import toast from "../../components/ToastNotification";
import { useAssetPermissions } from "../../hooks/useAssetPermissions";
import { isAssetRecordEditable } from "../../utils/approvalEditPolicy";
import { countStandardHistoryCards, renderStandardHistoryCards, DEFAULT_IGNORED_FIELDS, isBlankOrDash, type RawHistoryRecord } from "../../utils/changeHistoryRenderer";
import { formatHistoryNumber } from "../../utils/numFmt";
import { KchtApprovalModals } from "../../components/kcht/KchtApprovalModals";
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
} from "../../components/list-view";
import { AppDrawer } from "../../components/shared/AppDrawer";
import DeleteConfirmModal from "../../components/shared/DeleteConfirmModal";
import { type InfrastructureAttachmentItem } from "../../components/shared/InfrastructureAttachmentTab";
import { triggerBlobDownload } from "../../components/shared/infrastructureAttachmentUtils";
import { ASSET_CONDITION_OPTIONS } from "../../constants/assetDropdown";
import {
  ThemeTokenProvider,
  type ThemeToken,
} from "../../context/ThemeTokenContext";
import api from "../../services/api";
import {
  approveInfraAssetC1,
  approveInfraAssetC2,
  createAssetDecrease,
  createAssetIncrease,
  createInfrastructureAsset,
  createKhaiThac,
  deleteInfraAssetAttachment,
  deleteInfrastructureAsset,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchInfraAssetAttachments,
  fetchInfraAssetHistory,
  fetchInfrastructureAssets,
  fetchKhaiThacList,
  rejectInfraAssetC1,
  rejectInfraAssetC2,
  submitInfraAssetApproval,
  updateInfrastructureAsset,
  uploadInfraAssetAttachments,
} from "../../services/assetmovement/api";
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
  PortTerminalAsset,
  PortTerminalAssetFilters,
  PortTerminalAssetPayload,
} from "../../services/assetmovement/types";
import { beaconStationCRUD } from "../../services/beaconService";
import { dikeRevetmentCRUD } from "../../services/dikeRevetmentService";
import {
  organizationService,
  type Organization,
} from "../../services/organizationService";
import { anchorageCRUD, berthCRUD } from "../../services/portService";
import { useAuthStore } from "../../store/authStore";
import * as themeTokenChk from "../../themetokenchk";
import {
  actionPrimary,
  borderDefault,
  colors,
  drawerTitleStyle,
  fontSizeLg,
  fontSizeMd,
  fontWeightBold,
  radiusPill,
  spaceMd,
  spaceSm,
  spaceXl,
  textTertiary,
} from "../../themetokenchk";

import PortTerminalAssetDetailContent from "./PortTerminalAssetDetailContent";
import PortTerminalAssetForm, {
  type FormValues,
} from "./PortTerminalAssetForm";
import PortTerminalAssetOperationForm, {
  type OperationMode,
  type OperationValues,
} from "./PortTerminalAssetOperationForm";
import {
  PORT_TERMINAL_ASSET_SCREEN,
  type InfrastructureAssetScreenConfig,
  type InfrastructureReferenceOption,
} from "./infrastructureAssetScreen";

const STATUS_COUNT_KEYS = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED_LEVEL1",
  "APPROVED",
  "REJECTED_LEVEL1",
  "REJECTED_LEVEL2",
  "ARCHIVED",
];

type DrawerMode = "create" | "edit" | "detail";


const PORT_TERMINAL_ASSET_FIELD_LABELS: Record<string, string> = {
  parentOrgUnitId: 'Cơ quan quản lý cấp trên',
  orgUnitId: 'Đơn vị quản lý',
  usingOrgUnitId: 'Đơn vị sử dụng',
  berthId: 'Mã bến cảng',
  portTerminalId: 'Mã bến cảng',
  anchorageId: 'Mã khu neo đậu',
  beaconStationId: 'Mã đèn biển và nhà trạm gắn liền với đèn biển',
  dikeRevetmentId: 'Mã đê kè',
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
  quantity: 'Số lượng',
  quantityUnit: 'Đơn vị tính',
  model: 'Model',
  serialNumber: 'Số serial',
  countryOfOrigin: 'Xuất xứ',
  manufacturer: 'Hãng sản xuất',
  address: 'Địa chỉ',
  assetLocation: 'Vị trí tài sản',
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
  const error = cause as {
    response?: { data?: { message?: string } };
    errorFields?: unknown;
  };
  return error.response?.data?.message || fallback;
};

const isValidationError = (cause: unknown) =>
  Boolean((cause as { errorFields?: unknown }).errorFields);

async function loadRelatedInfrastructure(
  screenConfig: InfrastructureAssetScreenConfig,
): Promise<InfrastructureReferenceOption[]> {
  if (screenConfig.assetType === "DIKE_REVETMENT") {
    const items = await dikeRevetmentCRUD.getOptions();
    return items.map((item: any) => ({
      id: item.id,
      code: item.code,
      name: item.dikeRevetmentName,
      orgUnitId: item.orgUnitId,
    }));
  }

  if (screenConfig.assetType === "LIGHTHOUSE") {
    const items = await beaconStationCRUD.findAll();
    return items.map((item: any) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      orgUnitId: item.orgUnitId,
    }));
  }

  if (screenConfig.assetType === "ANCHORAGE") {
    const page = await anchorageCRUD.findAll({ page: 1, size: 5000 });
    return page.data.map((item: any) => ({
      id: item.id,
      code: item.anchorageCode,
      name: item.anchorageName,
      orgUnitId: item.orgUnitId,
    }));
  }

  const page = await berthCRUD.findAll({ page: 1, size: 5000 });
  return page.data.map((item: any) => ({
    id: item.id,
    code: item.berthCode,
    name: item.berthName,
    orgUnitId: item.orgUnitId,
  }));
}

export interface PortTerminalAssetListProps {
  screenConfig?: InfrastructureAssetScreenConfig;
}

function PortTerminalAssetList({
  screenConfig = PORT_TERMINAL_ASSET_SCREEN,
}: PortTerminalAssetListProps = {}) {
  const perms = useAssetPermissions(
    Array.isArray(screenConfig.resource)
      ? screenConfig.resource
      : [screenConfig.resource || 'berth', 'berthasset']
  );
  const [data, setData] = useState<PortTerminalAsset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [relatedInfrastructure, setRelatedInfrastructure] = useState<
    InfrastructureReferenceOption[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState<string>("DRAFT");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<PortTerminalAssetFilters>({
    sortBy: "updatedAt",
    sortDir: "DESC",
  });
  const [draftFilters, setDraftFilters] = useState<PortTerminalAssetFilters>(
    {},
  );
  const [drawerMode, setDrawerMode] = useState<DrawerMode>();
  const [selected, setSelected] = useState<PortTerminalAsset>();
  const [deleteTarget, setDeleteTarget] = useState<PortTerminalAsset>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [exploitationRows, setExploitationRows] = useState<
    AssetExploitationResponse[]
  >([]);
  const [increaseRows, setIncreaseRows] = useState<AssetIncreaseResponse[]>([]);
  const [decreaseRows, setDecreaseRows] = useState<AssetDecreaseResponse[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [operationForm] = Form.useForm<OperationValues>();
  const currentUser = useAuthStore((s) => s.user);
  const [attachments, setAttachments] = useState<
    InfrastructureAttachmentItem[]
  >([]);

  // ── History state (chuẩn /berth) ───────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<PortTerminalAsset | null>(null);
  const [historyRecords, setHistoryRecords] = useState<RawHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const openHistory = useCallback(async (r: PortTerminalAsset) => {
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistoryRecords([]);
    setHistorySearch("");
    setHistoryFrom("");
    setHistoryTo("");
    if (r.approvalStatus === 'DRAFT' || (r as any).status === 'DRAFT') {
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    try {
      const d = await fetchInfraAssetHistory(r.id);
      const ch = Array.isArray(d?.changeHistory) ? d.changeHistory : [];
      setHistoryRecords(ch);
    } catch {
      toast.error("Không thể tải lịch sử");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const filteredHistoryRecords = useMemo(() => {
    return historyRecords.filter((rec) => {
      const fn = rec.fieldName || rec.changedField;
      if (fn && DEFAULT_IGNORED_FIELDS.has(fn)) return false;
      if (historySearch) {
        const s = historySearch.toLowerCase();
        const matchField = String(fn || "").toLowerCase().includes(s);
        const matchOld = String(rec.oldValue || rec.previousValue || "").toLowerCase().includes(s);
        const matchNew = String(rec.newValue || rec.value || "").toLowerCase().includes(s);
        if (!matchField && !matchOld && !matchNew) return false;
      }
      if (historyFrom && dayjs(rec.changedAt || rec.approvedDate).isBefore(dayjs(historyFrom), "day")) {
        return false;
      }
      if (historyTo && dayjs(rec.changedAt || rec.approvedDate).isAfter(dayjs(historyTo), "day")) {
        return false;
      }
      return true;
    });
  }, [historyRecords, historySearch, historyFrom, historyTo]);

  const orgName = useMemo(
    () => new Map(organizations.map((item) => [item.id, item.name])),
    [organizations],
  );
  const relatedInfrastructureMap = useMemo(
    () => new Map(relatedInfrastructure.map((item) => [item.id, item])),
    [relatedInfrastructure],
  );

  const historyUpdateCount = useMemo(() => {
    return countStandardHistoryCards({
      records: filteredHistoryRecords,
      fieldLabels: PORT_TERMINAL_ASSET_FIELD_LABELS,
      resolveUnitName: (rec: any) => {
        const oId = rec?.orgUnitId;
        if (oId && orgName.has(oId)) return orgName.get(oId)!;
        return rec?.orgUnitName || rec?.unitName || '';
      },
      formatValue: (fn, raw) => {
        if (isBlankOrDash(raw)) return '';
        const normKey = (fn || '').toLowerCase();
        if (normKey.includes('orgunitid') || normKey.includes('donvi')) {
          return orgName.get(raw!) || raw;
        }
        if (
          fn === 'berthId' ||
          fn === 'portTerminalId' ||
          fn === 'beaconStationId' ||
          fn === 'anchorageId' ||
          fn === 'dikeRevetmentId'
        ) {
          const item = relatedInfrastructureMap.get(raw!);
          return item ? `${item.code} - ${item.name}` : raw;
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
    });
  }, [filteredHistoryRecords, orgName, relatedInfrastructureMap, historyTarget]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchInfrastructureAssets(screenConfig.assetType, {
        ...filters,
        page: page - 1,
        size: pageSize,
      });
      setData(response.content);
      setTotal(response.totalElements);

      const baseFilters = {
        ...filters,
        approvalStatus: undefined,
        sortBy: undefined,
        sortDir: undefined,
        page: 0,
        size: 1,
      };
      const [all, ...statusPages] = await Promise.all([
        fetchInfrastructureAssets(screenConfig.assetType, baseFilters),
        ...STATUS_COUNT_KEYS.map((approvalStatus) =>
          fetchInfrastructureAssets(screenConfig.assetType, {
            ...baseFilters,
            approvalStatus,
          }),
        ),
      ]);
      setStatusCounts({
        all: all.totalElements,
        ...Object.fromEntries(
          STATUS_COUNT_KEYS.map((key, index) => [
            key,
            statusPages[index].totalElements,
          ]),
        ),
      });
    } catch (cause: unknown) {
      setError(
        getErrorMessage(
          cause,
          `Không thể tải danh sách ${screenConfig.subjectLabel}.`,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, screenConfig]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi trang/bộ lọc thay đổi
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void Promise.allSettled([
      organizationService.getAll(),
      loadRelatedInfrastructure(screenConfig),
    ]).then(([orgsResult, relatedResult]) => {
      if (orgsResult.status === "fulfilled") {
        setOrganizations(orgsResult.value);
      } else {
        toast.error("Không thể tải danh mục đơn vị.");
      }

      if (relatedResult.status === "fulfilled") {
        setRelatedInfrastructure(relatedResult.value);
      } else {
        setRelatedInfrastructure([]);
        toast.error(
          `Không thể tải danh mục ${screenConfig.relationNameLabel.toLowerCase()}.`,
        );
      }
    });
  }, [screenConfig]);

  // ── Approval state & handlers ──────────────────────────────────────
  const [approvingRecord, setApprovingRecord] = useState<PortTerminalAsset | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  const [rejectingRecord, setRejectingRecord] = useState<PortTerminalAsset | null>(null);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const handleOpenApproveModal = useCallback((record: PortTerminalAsset, level: 'c1' | 'c2') => {
    setApprovingRecord(record);
    setApproveLevel(level);
    setApproveModalOpen(true);
  }, []);

  const handleApproveConfirm = useCallback(async (content: string) => {
    if (!approvingRecord) return;
    setApproveLoading(true);
    try {
      if (approveLevel === 'c1') {
        await approveInfraAssetC1(approvingRecord.id, content);
        toast.success('Đã phê duyệt cấp Cảng vụ/Chi cục');
      } else {
        await approveInfraAssetC2(approvingRecord.id, content);
        toast.success('Đã phê duyệt cấp Cục');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      await loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Phê duyệt thất bại'));
    } finally {
      setApproveLoading(false);
    }
  }, [approvingRecord, approveLevel, loadData]);

  const handleOpenRejectModal = useCallback((record: PortTerminalAsset, level: 'c1' | 'c2') => {
    setRejectingRecord(record);
    setRejectLevel(level);
    setRejectModalOpen(true);
  }, []);

  const handleRejectConfirm = useCallback(async (reason: string) => {
    if (!rejectingRecord) return;
    setRejectLoading(true);
    try {
      if (rejectLevel === 'c1') {
        await rejectInfraAssetC1(rejectingRecord.id, reason);
        toast.success('Đã từ chối phê duyệt cấp Cảng vụ/Chi cục');
      } else {
        await rejectInfraAssetC2(rejectingRecord.id, reason);
        toast.success('Đã từ chối phê duyệt cấp Cục');
      }
      setRejectModalOpen(false);
      setRejectingRecord(null);
      await loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Từ chối phê duyệt thất bại'));
    } finally {
      setRejectLoading(false);
    }
  }, [rejectingRecord, rejectLevel, loadData]);

  const handleSubmitApproval = useCallback(async (record: PortTerminalAsset) => {
    try {
      await submitInfraAssetApproval(record.id);
      const isReSubmit =
        record.approvalStatus === 'REJECTED_LEVEL1' ||
        record.approvalStatus === 'REJECTED_LEVEL2' ||
        (record as any).status === 'REJECTED_LEVEL1' ||
        (record as any).status === 'REJECTED_LEVEL2' ||
        record.approvalStatus === 'REJECTED';
      toast.success(isReSubmit ? 'Đã gửi lại phê duyệt' : 'Đã gửi Cảng vụ phê duyệt');
      await loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Gửi phê duyệt thất bại'));
    }
  }, [loadData]);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode("create");
    form.resetFields();
    form.setFieldsValue({
      status: "MANAGED",
    });
    setAttachments([]);
    setExploitationRows([]);
    setIncreaseRows([]);
    setDecreaseRows([]);
  }, [form]);

  const openEdit = useCallback(
    async (record: PortTerminalAsset) => {
      if (!isAssetRecordEditable(record.approvalStatus)) {
        toast.warning("Hồ sơ đang ở trạng thái không được phép chỉnh sửa.");
        return;
      }
      setSelected(record);
      setDrawerMode("edit");
      form.setFieldsValue({
        ...record,
        constructionYear: record.constructionYear
          ? dayjs(String(record.constructionYear))
          : undefined,
        useDate: record.useDate ? dayjs(record.useDate) : undefined,
        declarationDate: record.declarationDate
          ? dayjs(record.declarationDate)
          : undefined,
        depreciationStartDate: record.depreciationStartDate
          ? dayjs(record.depreciationStartDate)
          : undefined,
        depreciationEndDate: record.depreciationEndDate
          ? dayjs(record.depreciationEndDate)
          : undefined,
        attachmentName: record.attachmentName,
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
                uploadedByName:
                  att.uploadedByName ||
                  record.updatedByName ||
                  record.submittedByName ||
                  "Cán bộ quản lý",
                uploadedDate:
                  att.uploadedAt ||
                  (record.updatedAt
                    ? dayjs(record.updatedAt).toISOString()
                    : dayjs().toISOString()),
                filePath: `/v1/asset/infra-assets/${record.id}/attachments/${att.id}/download`,
              })),
            );
          } else if (record.attachmentName) {
            setAttachments(
              record.attachmentName.split(",").map((name, i) => ({
                id: `att-${i}-${Date.now()}`,
                fileName: name.trim(),
                fileSize: 1024 * 512,
                uploadedByName:
                  record.updatedByName ||
                  record.submittedByName ||
                  currentUser?.fullName ||
                  currentUser?.username ||
                  "Cán bộ quản lý",
                uploadedDate: record.updatedAt
                  ? dayjs(record.updatedAt).toISOString()
                  : dayjs().toISOString(),
              })),
            );
          } else {
            setAttachments([]);
          }
        })
        .catch(() => {
          if (record.attachmentName) {
            setAttachments(
              record.attachmentName.split(",").map((name, i) => ({
                id: `att-${i}-${Date.now()}`,
                fileName: name.trim(),
                fileSize: 1024 * 512,
                uploadedByName:
                  record.updatedByName ||
                  record.submittedByName ||
                  currentUser?.fullName ||
                  currentUser?.username ||
                  "Cán bộ quản lý",
                uploadedDate: record.updatedAt
                  ? dayjs(record.updatedAt).toISOString()
                  : dayjs().toISOString(),
              })),
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
    },
    [currentUser, form],
  );

  const handleUploadAttachment = useCallback(
    (file: File) => {
      const uploaderName =
        currentUser?.fullName || currentUser?.username || "Cán bộ quản lý";
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
    [currentUser],
  );

  const handleDeleteAttachment = useCallback(
    (id: string) => {
      if (selected?.id && id.includes("-")) {
        deleteInfraAssetAttachment(selected.id, id).catch(() => {});
      }
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    },
    [selected],
  );

  const handleDownloadAttachment = useCallback(
    async (id: string, fileName: string) => {
      const att = attachments.find((a) => a.id === id);
      if (att?.originFileObj) {
        triggerBlobDownload(
          att.originFileObj,
          fileName || att.originFileObj.name,
        );
        toast.success(`Đã tải xuống tệp: ${fileName}`);
        return;
      }
      if (
        att?.url &&
        (att.url.startsWith("blob:") || att.url.startsWith("data:"))
      ) {
        triggerBlobDownload(att.url, fileName || "tai-lieu");
        toast.success(`Đã tải xuống tệp: ${fileName}`);
        return;
      }
      if (att?.filePath) {
        try {
          let cleanPath = att.filePath;
          if (cleanPath.startsWith("/api/")) {
            cleanPath = cleanPath.replace(/^\/api/, "");
          } else if (!cleanPath.startsWith("/")) {
            cleanPath = `/${cleanPath}`;
          }
          const res = await api.get(cleanPath, { responseType: "blob" });
          const contentType = String(
            res.headers?.["content-type"] || "application/octet-stream",
          );
          const blob = new Blob([res.data], { type: contentType });
          triggerBlobDownload(blob, fileName || "tai-lieu");
          toast.success(`Đã tải xuống tệp: ${fileName}`);
          return;
        } catch (err) {
          console.error("Download error:", err);
          toast.error(
            `Không thể tải xuống tệp tin "${fileName}": Lỗi máy chủ hoặc tệp không tồn tại.`,
          );
          return;
        }
      }
      const fallbackBlob = new Blob(
        [`Tài liệu đính kèm: ${fileName}\nThời gian: ${dayjs().format("DD/MM/YYYY HH:mm:ss")}`],
        { type: "application/octet-stream" },
      );
      triggerBlobDownload(fallbackBlob, fileName || "tai-lieu");
      toast.success(`Đã tải xuống tệp: ${fileName}`);
    },
    [attachments],
  );

  const openDetail = useCallback(async (record: PortTerminalAsset) => {
    setSelected(record);
    setDrawerMode("detail");
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

      const attachmentName =
        attachments.length > 0
          ? attachments.map((a) => a.fileName).join(", ")
          : undefined;

      const payload: PortTerminalAssetPayload = {
        ...values,
        assetType: values.assetType || screenConfig.assetType,
        constructionYear: values.constructionYear
          ? Number(values.constructionYear.format("YYYY"))
          : undefined,
        useDate: values.useDate?.format("YYYY-MM-DD"),
        declarationDate: values.declarationDate?.format("YYYY-MM-DD"),
        depreciationStartDate:
          values.depreciationStartDate?.format("YYYY-MM-DD"),
        depreciationEndDate: values.depreciationEndDate?.format("YYYY-MM-DD"),
        attachmentName,
        approvalStatus: targetAction,
      };

      let savedAsset: PortTerminalAsset;
      if (drawerMode === "edit" && selected) {
        savedAsset = await updateInfrastructureAsset(
          selected.id,
          screenConfig.assetType,
          payload,
        );
      } else {
        savedAsset = await createInfrastructureAsset(
          screenConfig.assetType,
          payload,
        );
      }

      const targetAssetId = savedAsset?.id || selected?.id;
      const filesToUpload = attachments
        .map((a) => a.originFileObj)
        .filter((f): f is File => f instanceof File);
      if (filesToUpload.length > 0 && targetAssetId) {
        try {
          await uploadInfraAssetAttachments(targetAssetId, filesToUpload);
        } catch (uploadErr) {
          console.error("Upload attachments error:", uploadErr);
        }
      }

      toast.success(
        targetAction === "DRAFT"
          ? `Đã lưu tạm ${screenConfig.subjectLabel}.`
          : targetAction === "PENDING_APPROVAL"
            ? `Đã lưu và gửi phê duyệt ${screenConfig.subjectLabel}.`
            : `Đã lưu và phê duyệt ${screenConfig.subjectLabel}.`,
      );
      setDrawerMode(undefined);
      setFilters((current) => ({
        ...current,
        sortBy: "updatedAt",
        sortDir: "DESC",
      }));
      setPage(1);
      await loadData();
    } catch (cause: unknown) {
      if (!isValidationError(cause)) {
        toast.error(
          getErrorMessage(cause, `Không thể lưu ${screenConfig.subjectLabel}.`),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const saveOperation = async () => {
    if (!selected || !operationMode) return;
    try {
      const values = await operationForm.validateFields();
      const origVal = values.originalValue;
      if (operationMode !== "exploit" && origVal == null) {
        toast.error("Vui lòng nhập nguyên giá sau điều chỉnh.");
        return;
      }
      if (
        operationMode === "increase" &&
        origVal! <= (selected.originalValue || 0)
      ) {
        toast.error(
          "Nguyên giá sau điều chỉnh phải lớn hơn nguyên giá hiện tại.",
        );
        return;
      }
      if (
        operationMode === "decrease" &&
        origVal! >= (selected.originalValue || 0)
      ) {
        toast.error(
          "Nguyên giá sau điều chỉnh phải nhỏ hơn nguyên giá hiện tại.",
        );
        return;
      }
      setSaving(true);
      const accDep = Number(values.accumulatedDepreciation) || 0;
      const remAfter =
        origVal != null ? Math.max(0, origVal - accDep) : undefined;
      const depMonths = Number(values.depreciationMonths) || 0;
      const monthDep =
        origVal != null && depMonths > 0
          ? Math.round((origVal / depMonths) * 100) / 100
          : undefined;

      const adjustmentDetails: AssetValueAdjustmentDetails = {
        decisionNumber: values.decisionNumber,
        decisionDate: values.decisionDate?.format("YYYY-MM-DD"),
        adjustmentDate: values.adjustmentDate?.format("YYYY-MM-DD"),
        adjustmentReason: values.adjustmentReason,
        declarationDate: values.declarationDate?.format("YYYY-MM-DD"),
        depreciationStartDate:
          values.depreciationStartDate?.format("YYYY-MM-DD"),
        depreciationEndDate: values.depreciationEndDate?.format("YYYY-MM-DD"),
        adjustmentNotes: values.notes,
        valueUnit: "VNĐ",
        originalValueBefore: selected.originalValue,
        originalValueAfter: origVal,
        remainingValueBefore: selected.remainingValue,
        remainingValueAfter: remAfter,
        monthlyDepreciation: monthDep,
      };

      if (operationMode === "exploit") {
        await createKhaiThac({
          assetId: selected.id,
          assetName: selected.assetName,
          exploitationYear: dayjs(values.exploitationDeadline).year(),
          doanhThu: values.totalRevenue || 0,
          depreciation: values.relatedCosts || 0,
          description: values.notes || "",
          operatorOrgUnitId: values.operatorOrgUnitId,
          assetCategory: [selected.assetCode, selected.assetName].filter(Boolean).join(' - '),
          unitOfMeasure: values.unitOfMeasure,
          quantity: values.quantity,
          exploitationDeadline:
            values.exploitationDeadline?.format("YYYY-MM-DD"),
          totalRevenue: values.totalRevenue,
          relatedCosts: values.relatedCosts,
          stateBudgetPayment: values.stateBudgetPayment,
          projectAmount: values.projectAmount,
        });
      } else if (operationMode === "increase") {
        await createAssetIncrease({
          assetId: selected.id,
          assetName: selected.assetName,
          quantity: 1,
          unitOfMeasure: "VNĐ",
          increaseCode: values.decisionNumber || "",
          reason: values.notes || "",
          adjustmentDetails,
        });
      } else {
        await createAssetDecrease({
          assetId: selected.id,
          assetName: selected.assetName,
          quantity: 1,
          unitOfMeasure: "VNĐ",
          decreaseReason: values.adjustmentReason || "",
          reason: values.notes || "",
          adjustmentDetails,
        });
      }
      toast.success("Đã lưu thông tin.");
      setOperationMode(undefined);
      operationForm.resetFields();
    } catch (cause: unknown) {
      if (!isValidationError(cause))
        toast.error(getErrorMessage(cause, "Không thể lưu thông tin."));
    } finally {
      setSaving(false);
    }
  };

  const filterOptions = useMemo<FilterOption[]>(
    () => [
      {
        key: "orgUnitId",
        label: "Đơn vị quản lý",
        type: "treeSelect",
        organizations,
        placeholder: "Chọn đơn vị...",
      },
      {
        key: "assetName",
        label: "Tên tài sản",
        type: "text",
        placeholder: "Tìm theo tên tài sản",
      },
      {
        key: "assetCondition",
        label: "Tình trạng tài sản",
        type: "select",
        placeholder: "Chọn tình trạng",
        options: ASSET_CONDITION_OPTIONS,
      },
      {
        key: "usingOrgUnitId",
        label: "Đơn vị sử dụng",
        type: "treeSelect",
        organizations,
        placeholder: "Chọn đơn vị...",
        isAdvanced: true,
      },
      {
        key: screenConfig.relationField,
        label: screenConfig.relationCodeLabel,
        type: "select",
        placeholder: screenConfig.relationPlaceholder,
        options: relatedInfrastructure.map((item) => ({
          value: item.id,
          label: `${item.code} - ${item.name}`,
        })),
        isAdvanced: true,
      },
      {
        key: "assetType",
        label: "Loại tài sản",
        type: "select",
        placeholder: "Chọn loại tài sản",
        options: [{ value: screenConfig.assetType, label: screenConfig.title }],
        isAdvanced: true,
      },
      {
        key: "assetCode",
        label: "Mã tài sản",
        type: "text",
        placeholder: "Tìm theo mã tài sản",
        isAdvanced: true,
      },
      {
        key: "updatedRange",
        label: "Ngày cập nhật",
        type: "dateRange",
        isAdvanced: true,
      },
    ],
    [organizations, relatedInfrastructure, screenConfig],
  );

  const handleFilterApply = useCallback(() => {
    setPage(1);
    const range = draftFilters.updatedRange as
      | [Dayjs | null, Dayjs | null]
      | undefined;
    setFilters({
      ...draftFilters,
      assetName: draftFilters.assetName ? draftFilters.assetName.trim() : undefined,
      assetCode: draftFilters.assetCode ? draftFilters.assetCode.trim() : undefined,
      updatedFrom: range?.[0]?.format("YYYY-MM-DD"),
      updatedTo: range?.[1]?.format("YYYY-MM-DD"),
    });
  }, [draftFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({});
    setFilters({
      sortBy: "updatedAt",
      sortDir: "DESC",
    });
    setPage(1);
  }, []);

  const tableOptions = useMemo<TableOption<PortTerminalAsset>>(() => ({
    dataKey: 'id',
    mainColumns: [
      {
        title: 'TÊN/MÃ TÀI SẢN',
        dataIndex: 'assetName',
        type: TableColumnType.TwoLine,
        subField: 'assetCode',
        width: 260,
        fixed: 'left',
        allowSort: true,
        sortField: 'assetName',
        onClick: (record) => void openDetail(record),
      },
      {
        title: 'ĐƠN VỊ QUẢN LÝ',
        dataIndex: 'orgUnitId',
        type: TableColumnType.Text,
        width: 250,
        bold: true,
        allowSort: true,
        sortField: 'orgUnitId',
        render: (v) => <span style={{ fontWeight: fontWeightBold }}>{orgName.get(v as string) || ''}</span>,
      },
      {
        title: 'ĐƠN VỊ SỬ DỤNG',
        dataIndex: 'usingOrgUnitId',
        type: TableColumnType.Text,
        width: 250,
        allowSort: true,
        sortField: 'usingOrgUnitId',
        render: (v) => orgName.get(v as string) || '',
      },
      {
        title: screenConfig.relationColumnTitle,
        dataIndex: screenConfig.relationField,
        type: TableColumnType.Text,
        width: Math.max(screenConfig.relationColumnWidth || 200, 220),
        allowSort: true,
        sortField: screenConfig.relationField,
        render: (v, record) => {
          const relId = (v || record[screenConfig.relationField]) as string | undefined;
          const item = relId ? relatedInfrastructureMap.get(relId) : undefined;
          return item ? (
            <span title={`${item.code} - ${item.name}`}>
              {item.code}
            </span>
          ) : (relId || '—');
        },
      },
      {
        title: 'LOẠI TÀI SẢN',
        dataIndex: 'assetType',
        type: TableColumnType.Text,
        width: 220,
        allowSort: true,
        sortField: 'assetType',
        render: () => screenConfig.title,
      },
      {
        title: 'TÌNH TRẠNG TÀI SẢN',
        dataIndex: 'assetCondition',
        type: TableColumnType.Status,
        width: 210,
        allowSort: true,
        sortField: 'assetCondition',
      },
      {
        title: 'HIỆN TRẠNG SỬ DỤNG',
        dataIndex: 'usageStatus',
        type: TableColumnType.Status,
        width: 210,
        allowSort: true,
        sortField: 'usageStatus',
      },
      {
        title: 'NHÓM TÀI SẢN',
        dataIndex: 'assetGroup',
        type: TableColumnType.Text,
        width: 210,
        allowSort: true,
        sortField: 'assetGroup',
      },
      {
        title: 'NGÀY SỬ DỤNG TÀI SẢN',
        dataIndex: 'useDate',
        type: TableColumnType.Date,
        width: 240,
        allowSort: true,
        sortField: 'useDate',
      },
      {
        title: 'TRẠNG THÁI',
        dataIndex: 'approvalStatus',
        type: TableColumnType.Status,
        width: 260,
        allowSort: true,
        sortField: 'approvalStatus',
      },
      {
        title: 'CÁN BỘ CẬP NHẬT',
        dataIndex: 'updatedByName',
        type: TableColumnType.TwoLine,
        subField: 'updatedAt',
        width: 220,
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
        width: 380,
        allowSort: true,
        sortField: 'portAuthorityApprovedAt',
      },
      {
        title: 'NỘI DUNG PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC',
        dataIndex: 'portAuthorityApprovalContent',
        type: TableColumnType.Text,
        width: 400,
        allowSort: true,
        sortField: 'portAuthorityApprovalContent',
      },
      {
        title: 'CÁN BỘ PHÊ DUYỆT CẤP CỤC',
        dataIndex: 'departmentApprovedByName',
        type: TableColumnType.TwoLine,
        subField: 'departmentApprovedAt',
        width: 280,
        allowSort: true,
        sortField: 'departmentApprovedAt',
      },
      {
        title: 'NỘI DUNG PHÊ DUYỆT CẤP CỤC',
        dataIndex: 'departmentApprovalContent',
        type: TableColumnType.Text,
        width: 290,
        allowSort: true,
        sortField: 'departmentApprovalContent',
      },
    ],
    actions: (record: PortTerminalAsset) => {
      const st = record.approvalStatus || (record as any).status || '';
      const actionsList: any[] = [];

      if (perms.canRead) {
        actionsList.push({
          key: 'detail',
          label: 'Xem chi tiết',
          icon: <EyeOutlined />,
          onClick: () => void openDetail(record),
        });
      }

      if (perms.canUpdate && isAssetRecordEditable(st)) {
        actionsList.push({
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: <EditOutlined />,
          onClick: () => openEdit(record),
        });
      }

      if (perms.canUpdate) {
        if (st === 'DRAFT') {
          actionsList.push({
            key: 'submit',
            label: 'Gửi Cảng vụ phê duyệt',
            icon: <SendOutlined />,
            onClick: () => void handleSubmitApproval(record),
          });
        } else if (st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2' || st === 'REJECTED') {
          actionsList.push({
            key: 'submit',
            label: 'Gửi lại phê duyệt',
            icon: <SendOutlined />,
            onClick: () => void handleSubmitApproval(record),
          });
        }
      }

      if (st === 'PENDING_APPROVAL' || st === 'PROPOSED') {
        if (perms.canApproveC1) {
          actionsList.push({
            key: 'approveC1',
            label: 'Phê duyệt cấp Cảng vụ/Chi cục',
            icon: <CheckOutlined />,
            onClick: () => handleOpenApproveModal(record, 'c1'),
          });
        }
        if (perms.canReject || perms.canApproveC1) {
          actionsList.push({
            key: 'rejectC1',
            label: 'Từ chối cấp Cảng vụ/Chi cục',
            icon: <CloseOutlined />,
            danger: true,
            onClick: () => handleOpenRejectModal(record, 'c1'),
          });
        }
      }

      if (st === 'APPROVED_LEVEL1') {
        if (perms.canApproveC2) {
          actionsList.push({
            key: 'approveC2',
            label: 'Phê duyệt cấp Cục',
            icon: <CheckOutlined />,
            onClick: () => handleOpenApproveModal(record, 'c2'),
          });
        }
        if (perms.canReject || perms.canApproveC2) {
          actionsList.push({
            key: 'rejectC2',
            label: 'Từ chối cấp Cục',
            icon: <CloseOutlined />,
            danger: true,
            onClick: () => handleOpenRejectModal(record, 'c2'),
          });
        }
      }

      if (st === 'APPROVED' || st === 'APPROVED_LEVEL2') {
        if (perms.canExploit) {
          actionsList.push({
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
          actionsList.push({
            key: 'increase',
            label: 'Tăng nguyên giá',
            icon: <PlusCircleOutlined />,
            onClick: () => {
              setSelected(record);
              setOperationMode('increase');
              operationForm.resetFields();
            },
          });
        }
        if (perms.canDecrease) {
          actionsList.push({
            key: 'decrease',
            label: 'Giảm nguyên giá',
            icon: <MinusCircleOutlined />,
            onClick: () => {
              setSelected(record);
              setOperationMode('decrease');
              operationForm.resetFields();
            },
          });
        }
      }

      if (perms.canHistory) {
        actionsList.push({
          key: 'history',
          label: 'Lịch sử',
          icon: <HistoryOutlined />,
          onClick: () => void openHistory(record),
        });
      }

      if (st === 'DRAFT' && perms.canDelete) {
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
  }), [
    openDetail,
    openEdit,
    openHistory,
    operationForm,
    handleOpenApproveModal,
    handleOpenRejectModal,
    handleSubmitApproval,
    orgName,
    relatedInfrastructureMap,
    screenConfig,
    perms,
  ]);

  const headerActions: ScreenHeaderAction[] = useMemo(() => {
    if (!perms.canCreate) return [];
    return [
      {
        key: "create",
        label: "Thêm mới",
        icon: <PlusOutlined />,
        variant: "primary",
        onClick: openCreate,
      },
    ];
  }, [openCreate, perms.canCreate]);

  return (
    <ThemeTokenProvider tokens={themeTokenChk as unknown as ThemeToken}>
      <div
        className={`berth-page-wrapper ${screenConfig.pageClassName}`}
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        }}
      >
        <style>{`
          .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

          /* ── Cỡ chữ 13.5px chuẩn toàn màn Bến cảng & các popup/drawer con ── */
          .berth-page-wrapper,
          .berth-page-wrapper .ant-table,
          .berth-page-wrapper .ant-table-cell,
          .berth-page-wrapper .ant-table-thead > tr > th,
          .berth-page-wrapper .ant-table-tbody > tr > td,
          .berth-page-wrapper .ant-input,
          .berth-page-wrapper .ant-select,
          .berth-page-wrapper .ant-select-selection-item,
          .berth-page-wrapper .ant-select-item-option-content,
          .berth-page-wrapper .ant-picker,
          .berth-page-wrapper .ant-picker-input > input,
          .berth-page-wrapper .ant-btn,
          .berth-page-wrapper .ant-pagination,
          .berth-page-wrapper .ant-pagination-item,
          .berth-page-wrapper .ant-pagination-total-text,
          .berth-page-wrapper .ant-breadcrumb,
          .berth-page-wrapper .ant-form-item-label > label,
          .berth-drawer-scope,
          .berth-drawer-scope .ant-drawer-content,
          .berth-drawer-scope .ant-tabs-tab,
          .berth-drawer-scope .chk-detail-label,
          .berth-drawer-scope .chk-detail-value,
          .berth-drawer-scope .ant-table,
          .berth-drawer-scope .ant-table-cell,
          .berth-drawer-scope .ant-table-thead > tr > th,
          .berth-drawer-scope .ant-btn,
          .berth-drawer-scope .ant-select,
          .berth-drawer-scope .ant-input,
          .berth-drawer-scope .ant-form-item-label > label,
          .berth-modal-scope,
          .berth-modal-scope .ant-modal-content,
          .berth-modal-scope .ant-btn,
          .berth-modal-scope .ant-input {
            font-size: 13.5px !important;
          }

          /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, thanh cuộn ngang khi tràn màn hình ── */
          .berth-page-wrapper div:has(> button[aria-pressed]) {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            justify-content: safe center !important;
            align-items: center !important;
            scrollbar-width: thin !important;
            scrollbar-color: #cbd5e1 #f8fafc !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            padding: 2px 8px 4px 8px !important;
            gap: clamp(6px, 1vw, 14px) !important;
          }
          .berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 4px !important;
            display: block !important;
          }
          .berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .berth-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }

          /* ── Responsive ScreenHeader co dãn đẹp khi zoom ── */
          .berth-page-wrapper > div:first-of-type {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          /* ── Responsive Drawers ── */
          .berth-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
        `}</style>

        <ScreenHeader
          breadcrumb={[
            { label: "Quản lý tài sản KCHT hàng hải" },
            { label: screenConfig.title },
          ]}
          actions={headerActions}
        />

        <FilterTableLayout
          statusTabsNode={
            <CommonStatusTabs
              activeKey={filters.approvalStatus || "all"}
              counts={statusCounts}
              onChange={(_key, queryStatus) => {
                setPage(1);
                setFilters((current) => ({
                  ...current,
                  approvalStatus: queryStatus,
                }));
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
                  order === "ascend"
                    ? "ASC"
                    : order === "descend"
                      ? "DESC"
                      : undefined,
              }));
            }}
          />
        </FilterTableLayout>

        {/* ── Create / Edit Drawer (DynamicFormSidebar) ─────────────── */}
        <PortTerminalAssetForm
          open={drawerMode === "create" || drawerMode === "edit"}
          drawerMode={drawerMode}
          selected={selected}
          form={form}
          organizations={organizations}
          relatedInfrastructure={relatedInfrastructure}
          screenConfig={screenConfig}
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
        <PortTerminalAssetDetailContent
          open={drawerMode === "detail"}
          selectedRecord={selected}
          onClose={() => setDrawerMode(undefined)}
          orgName={orgName}
          relatedInfrastructureMap={relatedInfrastructureMap}
          screenConfig={screenConfig}
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
        />

        {/* ── Operations Drawer (DynamicFormSidebar) ─────────────────────── */}
        <PortTerminalAssetOperationForm
          open={Boolean(operationMode)}
          operationMode={operationMode}
          selected={selected}
          organizations={organizations}
          form={operationForm}
          saving={saving}
          drawerClassName={screenConfig.drawerClassName}
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
          itemType={screenConfig.subjectLabel}
          itemName={deleteTarget?.assetName}
          itemCode={deleteTarget?.assetCode}
          onConfirm={() => {
            if (!deleteTarget) return;
            setSaving(true);
            void deleteInfrastructureAsset(deleteTarget.id)
              .then(() => {
                toast.success(`Đã xóa ${screenConfig.subjectLabel}.`);
                setDeleteTarget(undefined);
                return loadData();
              })
              .catch((cause: unknown) =>
                toast.error(getErrorMessage(cause, "Không thể xóa tài sản.")),
              )
              .finally(() => setSaving(false));
          }}
        />

        {/* ── Approval Modals 2 cấp ──────────────────────────────── */}
        <KchtApprovalModals
          approveOpen={approveModalOpen}
          approveLevel={approveLevel}
          approveLoading={approveLoading}
          onApproveConfirm={handleApproveConfirm}
          onApproveCancel={() => {
            setApproveModalOpen(false);
            setApprovingRecord(null);
          }}
          rejectOpen={rejectModalOpen}
          rejectLevel={rejectLevel}
          rejectLoading={rejectLoading}
          onRejectConfirm={handleRejectConfirm}
          onRejectCancel={() => {
            setRejectModalOpen(false);
            setRejectingRecord(null);
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
                  Tổng cộng {historyUpdateCount}
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
                  onBlur={e => setHistorySearch(e.target.value.trim())}
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
                fieldLabels: PORT_TERMINAL_ASSET_FIELD_LABELS,
                resolveUnitName: (rec: any) => {
                  const oId = rec?.orgUnitId;
                  if (oId && orgName.has(oId)) return orgName.get(oId)!;
                  return rec?.orgUnitName || rec?.unitName || '';
                },
                formatValue: (fn, raw) => {
                  if (isBlankOrDash(raw)) return '';
                  const normKey = (fn || '').toLowerCase();
                  if (normKey.includes('orgunitid') || normKey.includes('donvi')) {
                    return orgName.get(raw!) || raw;
                  }
                  if (
                    fn === 'berthId' ||
                    fn === 'portTerminalId' ||
                    fn === 'beaconStationId' ||
                    fn === 'anchorageId' ||
                    fn === 'dikeRevetmentId'
                  ) {
                    const item = relatedInfrastructureMap.get(raw!);
                    return item ? `${item.code} - ${item.name}` : raw;
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

export default PortTerminalAssetList;
