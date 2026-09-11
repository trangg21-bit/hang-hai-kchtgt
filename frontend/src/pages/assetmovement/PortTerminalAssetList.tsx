import { useCallback, useEffect, useMemo, useState } from "react";
import { Form } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  RocketOutlined,
} from "@ant-design/icons";
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
} from "../../components/list-view";
import DeleteConfirmModal from "../../components/shared/DeleteConfirmModal";
import toast from "../../components/ToastNotification";
import {
  organizationService,
  type Organization,
} from "../../services/organizationService";
import { anchorageCRUD, berthCRUD } from "../../services/portService";
import { beaconStationCRUD } from "../../services/beaconService";
import { dikeRevetmentCRUD } from "../../services/dikeRevetmentService";
import {
  createKhaiThac,
  createAssetDecrease,
  createAssetIncrease,
  createInfrastructureAsset,
  deleteInfrastructureAsset,
  fetchAssetDecreaseList,
  fetchAssetIncreaseList,
  fetchInfrastructureAssets,
  fetchKhaiThacList,
  updateInfrastructureAsset,
  uploadInfraAssetAttachments,
  fetchInfraAssetAttachments,
  deleteInfraAssetAttachment,
} from "../../services/assetmovement/api";
import api from "../../services/api";
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
  PortTerminalAsset,
  PortTerminalAssetFilters,
  PortTerminalAssetPayload,
} from "../../services/assetmovement/types";
import {
  type InfrastructureAttachmentItem,
  triggerBlobDownload,
} from "../../components/shared/InfrastructureAttachmentTab";
import { useAuthStore } from "../../store/authStore";
import * as themeTokenChk from "../../themetokenchk";
import { ThemeTokenProvider } from "../../context/ThemeTokenContext";
import PortTerminalAssetForm, {
  type FormValues,
} from "./PortTerminalAssetForm";
import PortTerminalAssetDetailContent from "./PortTerminalAssetDetailContent";
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
];

type DrawerMode = "create" | "edit" | "detail";

const ASSET_CONDITIONS = ["Tốt", "Hư hỏng cần sửa chữa", "Không sử dụng được"];

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
    return items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.dikeRevetmentName,
    }));
  }

  if (screenConfig.assetType === "LIGHTHOUSE") {
    const items = await beaconStationCRUD.findAll();
    return items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
    }));
  }

  if (screenConfig.assetType === "ANCHORAGE") {
    const page = await anchorageCRUD.findAll({ page: 1, size: 5000 });
    return page.data.map((item) => ({
      id: item.id,
      code: item.anchorageCode,
      name: item.anchorageName,
    }));
  }

  const page = await berthCRUD.findAll({ page: 1, size: 5000 });
  return page.data.map((item) => ({
    id: item.id,
    code: item.berthCode,
    name: item.berthName,
  }));
}

export interface PortTerminalAssetListProps {
  screenConfig?: InfrastructureAssetScreenConfig;
}

function PortTerminalAssetList({
  screenConfig = PORT_TERMINAL_ASSET_SCREEN,
}: PortTerminalAssetListProps = {}) {
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
  const [filters, setFilters] = useState<PortTerminalAssetFilters>({});
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

  const orgName = useMemo(
    () => new Map(organizations.map((item) => [item.id, item.name])),
    [organizations],
  );
  const relatedInfrastructureMap = useMemo(
    () => new Map(relatedInfrastructure.map((item) => [item.id, item])),
    [relatedInfrastructure],
  );

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
    void Promise.all([
      organizationService.getAll(),
      loadRelatedInfrastructure(screenConfig),
    ])
      .then(([orgs, relatedItems]) => {
        setOrganizations(orgs);
        setRelatedInfrastructure(relatedItems);
      })
      .catch(() =>
        toast.error(
          `Không thể tải danh mục đơn vị hoặc ${screenConfig.relationNameLabel.toLowerCase()}.`,
        ),
      );
  }, [screenConfig]);

  const openCreate = useCallback(() => {
    setSelected(undefined);
    setDrawerMode("create");
    form.resetFields();
    form.setFieldsValue({
      assetType: screenConfig.assetType,
      status: "MANAGED",
    });
    setAttachments([]);
    setExploitationRows([]);
    setIncreaseRows([]);
    setDecreaseRows([]);
  }, [form, screenConfig.assetType]);

  const openEdit = useCallback(
    async (record: PortTerminalAsset) => {
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
                uploadedDate: att.uploadedAt || (record.updatedAt ? dayjs(record.updatedAt).toISOString() : dayjs().toISOString()),
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

  const handleDeleteAttachment = useCallback((id: string) => {
    if (selected?.id && id.includes("-")) {
      deleteInfraAssetAttachment(selected.id, id).catch(() => {});
    }
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, [selected?.id]);

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
          const contentType = res.headers?.["content-type"] || "application/octet-stream";
          const blob = new Blob([res.data], { type: contentType });
          triggerBlobDownload(blob, fileName || "tai-lieu");
          toast.success(`Đã tải xuống tệp: ${fileName}`);
          return;
        } catch (err) {
          console.error("Download error:", err);
          toast.error(`Không thể tải xuống tệp tin "${fileName}": Lỗi máy chủ hoặc tệp không tồn tại.`);
          return;
        }
      }
      toast.error(
        `Không tìm thấy đường dẫn tệp tin đính kèm "${fileName || "tài liệu"}" trên máy chủ để tải xuống.`,
      );
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
        assetType: screenConfig.assetType,
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
        savedAsset = await createInfrastructureAsset(screenConfig.assetType, payload);
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
        ...values,
        decisionDate: values.decisionDate?.format("YYYY-MM-DD"),
        adjustmentDate: values.adjustmentDate?.format("YYYY-MM-DD"),
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
          assetCategory: selected.assetName,
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
        key: "usingOrgUnitId",
        label: "Đơn vị sử dụng",
        type: "treeSelect",
        organizations,
        placeholder: "Chọn đơn vị...",
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
      },
      {
        key: "assetType",
        label: "Loại tài sản",
        type: "select",
        placeholder: "Chọn loại tài sản",
        options: [{ value: "PORT_TERMINAL", label: "Tài sản bến cảng" }],
      },
      {
        key: "assetCode",
        label: "Mã tài sản",
        type: "text",
        placeholder: "Tìm theo mã tài sản",
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
        options: ASSET_CONDITIONS.map((value) => ({ value, label: value })),
      },
      {
        key: "updatedRange",
        label: "Ngày cập nhật",
        type: "dateRange",
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
      updatedFrom: range?.[0]?.format("YYYY-MM-DD"),
      updatedTo: range?.[1]?.format("YYYY-MM-DD"),
    });
  }, [draftFilters]);

  const handleFilterReset = useCallback(() => {
    setDraftFilters({});
    setFilters({});
    setPage(1);
  }, []);

  const tableOptions = useMemo<TableOption<PortTerminalAsset>>(
    () => ({
      dataKey: "id",
      mainColumns: [
        {
          title: "TÊN/MÃ TÀI SẢN",
          dataIndex: "assetName",
          type: TableColumnType.TwoLine,
          subField: "assetCode",
          width: 230,
          fixed: "left",
          allowSort: true,
          onClick: (record) => void openDetail(record),
        },
        {
          title: "ĐƠN VỊ QUẢN LÝ",
          dataIndex: "orgUnitId",
          type: TableColumnType.Text,
          width: 250,
          bold: true,
          allowSort: true,
          valueRef: (r) => orgName.get(r.orgUnitId),
        },
        {
          title: "ĐƠN VỊ SỬ DỤNG",
          dataIndex: "usingOrgUnitId",
          type: TableColumnType.Text,
          width: 250,
          allowSort: true,
          valueRef: (r) =>
            r.usingOrgUnitId ? orgName.get(r.usingOrgUnitId) : undefined,
        },
        {
          title: screenConfig.relationColumnTitle,
          dataIndex: screenConfig.relationField,
          type: TableColumnType.Text,
          width: screenConfig.relationColumnWidth,
          allowSort: true,
          valueRef: (r) =>
            r.berthId
              ? relatedInfrastructureMap.get(r.berthId)?.code
              : undefined,
        },
        {
          title: "LOẠI TÀI SẢN",
          dataIndex: "assetType",
          type: TableColumnType.Text,
          width: 160,
          allowSort: true,
          render: () => screenConfig.title,
        },
        {
          title: "TÌNH TRẠNG TÀI SẢN",
          dataIndex: "assetCondition",
          type: TableColumnType.Status,
          width: 190,
          allowSort: true,
        },
        {
          title: "HIỆN TRẠNG SỬ DỤNG",
          dataIndex: "usageStatus",
          type: TableColumnType.Status,
          width: 190,
          allowSort: true,
        },
        {
          title: "NHÓM TÀI SẢN",
          dataIndex: "assetGroup",
          type: TableColumnType.Text,
          width: 210,
          allowSort: true,
        },
        {
          title: "NGÀY SỬ DỤNG TÀI SẢN",
          dataIndex: "useDate",
          type: TableColumnType.Date,
          width: 190,
          allowSort: true,
        },
        {
          title: "TRẠNG THÁI",
          dataIndex: "approvalStatus",
          type: TableColumnType.Status,
          width: 260,
          allowSort: true,
        },
        {
          title: "CÁN BỘ CẬP NHẬT",
          dataIndex: "updatedByName",
          type: TableColumnType.TwoLine,
          subField: "updatedAt",
          width: 210,
          allowSort: true,
          sortField: "updatedBy",
        },
        {
          title: "CÁN BỘ GỬI PHÊ DUYỆT",
          dataIndex: "submittedByName",
          type: TableColumnType.TwoLine,
          subField: "submittedAt",
          width: 240,
          allowSort: true,
          sortField: "submittedBy",
        },
        {
          title: "CÁN BỘ PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC",
          dataIndex: "portAuthorityApprovedByName",
          type: TableColumnType.TwoLine,
          subField: "portAuthorityApprovedAt",
          width: 340,
          allowSort: true,
          sortField: "portAuthorityApprovedBy",
        },
        {
          title: "NỘI DUNG PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC",
          dataIndex: "portAuthorityApprovalContent",
          type: TableColumnType.Text,
          width: 280,
          allowSort: true,
        },
        {
          title: "CÁN BỘ PHÊ DUYỆT CẤP CỤC",
          dataIndex: "departmentApprovedByName",
          type: TableColumnType.TwoLine,
          subField: "departmentApprovedAt",
          width: 260,
          allowSort: true,
          sortField: "departmentApprovedBy",
        },
        {
          title: "NỘI DUNG PHÊ DUYỆT CẤP CỤC",
          dataIndex: "departmentApprovalContent",
          type: TableColumnType.Text,
          width: 260,
          allowSort: true,
        },
      ],
      actions: (record: PortTerminalAsset) => [
        {
          key: "detail",
          label: "Xem chi tiết",
          icon: <EyeOutlined />,
          onClick: () => void openDetail(record),
        },
        {
          key: "edit",
          label: "Chỉnh sửa",
          icon: <EditOutlined />,
          onClick: () => openEdit(record),
        },
        {
          key: "exploit",
          label: "Khai thác tài sản",
          icon: <RocketOutlined />,
          onClick: () => {
            setSelected(record);
            setOperationMode("exploit");
            operationForm.resetFields();
          },
        },
        {
          key: "increase",
          label: "Tăng nguyên giá",
          icon: <PlusCircleOutlined />,
          onClick: () => {
            setSelected(record);
            setOperationMode("increase");
            operationForm.resetFields();
          },
        },
        {
          key: "decrease",
          label: "Giảm nguyên giá",
          icon: <MinusCircleOutlined />,
          onClick: () => {
            setSelected(record);
            setOperationMode("decrease");
            operationForm.resetFields();
          },
        },
        {
          key: "delete",
          label: "Xóa",
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => setDeleteTarget(record),
        },
      ],
    }),
    [
      openDetail,
      openEdit,
      operationForm,
      orgName,
      relatedInfrastructureMap,
      screenConfig,
    ],
  );

  const headerActions: ScreenHeaderAction[] = useMemo(
    () => [
      {
        key: "create",
        label: "Thêm mới",
        icon: <PlusOutlined />,
        variant: "primary",
        onClick: openCreate,
      },
    ],
    [openCreate],
  );

  const customBerthTokens = useMemo(
    () => ({
      ...themeTokenChk,
      fontSizeMd: 13.5,
    }),
    [],
  );

  return (
    <ThemeTokenProvider tokens={customBerthTokens}>
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

          /* ── Cỡ chữ 13.5px chuẩn toàn màn Quản lý bến cảng & các popup/drawer con ── */
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
          .berth-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
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
          hideFilterToggle
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
          exploitationRows={exploitationRows}
          increaseRows={increaseRows}
          decreaseRows={decreaseRows}
          orgName={(id) => orgName.get(id || "") || id || "—"}
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
      </div>
    </ThemeTokenProvider>
  );
}

export default PortTerminalAssetList;
