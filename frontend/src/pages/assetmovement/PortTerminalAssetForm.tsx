import { useMemo } from "react";
import { Form, Select, InputNumber } from "antd";
import type { FormInstance } from "antd";
import type { Dayjs } from "dayjs";
import { BankOutlined, SlidersOutlined } from "@ant-design/icons";
import type { Organization } from "../../services/organizationService";
import type {
  PortTerminalAsset,
  PortTerminalAssetPayload,
} from "../../services/assetmovement/types";
import {
  PORT_TERMINAL_ASSET_SCREEN,
  type InfrastructureAssetScreenConfig,
  type InfrastructureReferenceOption,
} from "./infrastructureAssetScreen";
import { fmtInputNumber } from "../../utils/numFmt";
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from "../../components/shared/InfrastructureAttachmentTab";
import {
  colors,
  fontWeightBold,
  fontSizeMd,
  radiusPill,
  spaceSm,
  spaceFormField,
} from "../../themetokenchk";
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from "../../components/shared/dynamic-form-sidebar";

export type FormValues = Omit<
  PortTerminalAssetPayload,
  | "assetType"
  | "constructionYear"
  | "useDate"
  | "declarationDate"
  | "depreciationStartDate"
  | "depreciationEndDate"
> & {
  assetType?: PortTerminalAssetPayload["assetType"];
  constructionYear?: Dayjs;
  useDate?: Dayjs;
  declarationDate?: Dayjs;
  depreciationStartDate?: Dayjs;
  depreciationEndDate?: Dayjs;
  attachmentName?: string;
};

const ASSET_CONDITIONS = ["Tốt", "Hư hỏng cần sửa chữa", "Không sử dụng được"];
const USAGE_STATUSES = ["Đang sử dụng", "Chưa sử dụng", "Tạm dừng sử dụng"];
const ASSET_GROUPS = [
  "Nhà, công trình xây dựng",
  "Máy móc, thiết bị",
  "Tài sản khác",
];
const ORIGINS = [
  "Mua sắm",
  "Đầu tư xây dựng",
  "Được giao",
  "Điều chuyển",
  "Khác",
];
const UNITS = ["Cái", "Bộ", "Chiếc", "m²", "m"];
const DISPOSAL_METHODS = ["Bán", "Thanh lý", "Điều chuyển", "Tiêu hủy", "Khác"];

export interface PortTerminalAssetFormProps {
  open: boolean;
  drawerMode?: "create" | "edit" | "detail";
  selected?: PortTerminalAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  relatedInfrastructure: InfrastructureReferenceOption[];
  screenConfig?: InfrastructureAssetScreenConfig;
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function PortTerminalAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  relatedInfrastructure,
  screenConfig = PORT_TERMINAL_ASSET_SCREEN,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: PortTerminalAssetFormProps) {
  const relationOptions = useMemo(
    () =>
      relatedInfrastructure.map((item) => ({
        value: item.id,
        label: `${item.code} - ${item.name}`,
      })),
    [relatedInfrastructure],
  );

  const formTabs = useMemo<FormTabConfig<FormValues>[]>(() => {
    return [
      {
        key: "general",
        label: "Thông tin chung",
        sections: [
          {
            key: "basic_info",
            title: "Thông tin cơ bản & Quản lý vận hành",
            icon: <BankOutlined />,
            fields: [
              {
                name: "parentOrgUnitId",
                label: "Cơ quan quản lý cấp trên",
                type: FormFieldType.TreeSelect,
                organizations,
              },
              {
                name: "orgUnitId",
                label: "Đơn vị quản lý",
                type: FormFieldType.TreeSelect,
                organizations,
                required: true,
                rules: [
                  { required: true, message: "Đơn vị quản lý là bắt buộc" },
                ],
              },
              {
                name: "usingOrgUnitId",
                label: "Đơn vị sử dụng",
                type: FormFieldType.TreeSelect,
                organizations,
                required: true,
                rules: [
                  { required: true, message: "Đơn vị sử dụng là bắt buộc" },
                ],
              },
              {
                name: screenConfig.relationField,
                label: screenConfig.relationCodeLabel,
                type: FormFieldType.Select,
                options: relationOptions,
                placeholder: screenConfig.relationPlaceholder,
                required: true,
                rules: [{ required: true, message: `${screenConfig.relationCodeLabel} là bắt buộc` }],
              },
              {
                name: "assetType",
                label: "Loại tài sản",
                type: FormFieldType.Select,
                initialValue: screenConfig.assetType,
                disabled: true,
                options: [
                  { value: screenConfig.assetType, label: screenConfig.title },
                ],
              },
              {
                name: "assetCode",
                label: "Mã tài sản",
                type: FormFieldType.Text,
                disabled: true,
                placeholder: "Hệ thống tự sinh",
              },
              {
                name: "assetName",
                label: "Tên tài sản",
                type: FormFieldType.Text,
                placeholder: "Nhập tên tài sản",
                required: true,
                rules: [{ required: true, message: "Tên tài sản là bắt buộc" }],
              },
              {
                name: "barcode",
                label: "Barcode",
                type: FormFieldType.Text,
                placeholder: "Nhập mã barcode",
              },
              {
                name: "assetCondition",
                label: "Tình trạng tài sản",
                type: FormFieldType.Select,
                placeholder: "Chọn tình trạng",
                required: true,
                options: ASSET_CONDITIONS.map((v) => ({ value: v, label: v })),
                rules: [
                  { required: true, message: "Tình trạng tài sản là bắt buộc" },
                ],
              },
              {
                name: "usageStatus",
                label: "Hiện trạng sử dụng",
                type: FormFieldType.Select,
                placeholder: "Chọn hiện trạng",
                required: true,
                options: USAGE_STATUSES.map((v) => ({ value: v, label: v })),
                rules: [
                  { required: true, message: "Hiện trạng sử dụng là bắt buộc" },
                ],
              },
              {
                name: "assetGroup",
                label: "Nhóm tài sản",
                type: FormFieldType.Select,
                allowClear: true,
                placeholder: "Chọn nhóm tài sản",
                options: ASSET_GROUPS.map((v) => ({ value: v, label: v })),
              },
              {
                name: "assetSubgroup",
                label: "Phân nhóm tài sản",
                type: FormFieldType.Text,
                placeholder: "Nhập phân nhóm tài sản",
              },
              {
                name: "origin",
                label: "Nguồn gốc",
                type: FormFieldType.Select,
                allowClear: true,
                placeholder: "Chọn nguồn gốc",
                options: ORIGINS.map((v) => ({ value: v, label: v })),
              },
              {
                name: "quantityGroup",
                label: "",
                type: FormFieldType.Custom,
                colSpan: 12,
                customRender: () => (
                  <div style={{ display: "flex", gap: spaceSm }}>
                    <div style={{ flex: 1 }}>
                      <Form.Item
                        name="quantity"
                        label={
                          <span
                            style={{
                              color: colors.sidebarBg,
                              fontWeight: fontWeightBold,
                              fontSize: fontSizeMd,
                            }}
                          >
                            Số lượng
                          </span>
                        }
                        style={{ marginBottom: spaceFormField }}
                      >
                        <InputNumber
                          min={0}
                          formatter={fmtInputNumber}
                          placeholder="0"
                          style={{
                            borderRadius: radiusPill,
                            height: 40,
                            width: "100%",
                          }}
                        />
                      </Form.Item>
                    </div>
                    <div style={{ width: 140 }}>
                      <Form.Item
                        name="quantityUnit"
                        label={
                          <span
                            style={{
                              color: colors.sidebarBg,
                              fontWeight: fontWeightBold,
                              fontSize: fontSizeMd,
                            }}
                          >
                            Đơn vị tính
                          </span>
                        }
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          allowClear
                          placeholder="Đơn vị"
                          options={UNITS.map((v) => ({ value: v, label: v }))}
                          style={{
                            borderRadius: radiusPill,
                            height: 40,
                            width: "100%",
                          }}
                        />
                      </Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                name: "model",
                label: "Model",
                type: FormFieldType.Text,
                placeholder: "Nhập model",
              },
              {
                name: "serialNumber",
                label: "Serial",
                type: FormFieldType.Text,
                placeholder: "Nhập serial",
              },
              {
                name: "countryOfOrigin",
                label: "Xuất xứ",
                type: FormFieldType.Text,
                placeholder: "Nhập xuất xứ",
              },
              {
                name: "manufacturer",
                label: "Hãng sản xuất",
                type: FormFieldType.Text,
                placeholder: "Nhập hãng sản xuất",
              },
              {
                name: "constructionYear",
                label: "Năm xây dựng",
                type: FormFieldType.Year,
                placeholder: "Chọn năm",
              },
              {
                name: "useDate",
                label: "Ngày sử dụng tài sản",
                type: FormFieldType.Date,
                placeholder: "Chọn ngày",
              },
              {
                name: "landArea",
                label: "Diện tích đất, sàn sử dụng (m²)",
                type: FormFieldType.Number,
                min: 0,
                placeholder: "0",
              },
              {
                name: "floorArea",
                label: "Diện tích sàn sử dụng (m²)",
                type: FormFieldType.Number,
                min: 0,
                placeholder: "0",
              },
              {
                name: "assetLocation",
                label: "Vị trí tài sản",
                type: FormFieldType.TextArea,
                colSpan: 24,
                rows: 2,
                placeholder: "Nhập vị trí tài sản",
              },
              {
                name: "address",
                label: "Địa chỉ",
                type: FormFieldType.TextArea,
                colSpan: 24,
                rows: 2,
                placeholder: "Nhập địa chỉ tài sản",
              },
            ],
          },
          {
            key: "depreciation_info",
            title: "Thông tin giá trị & Khấu hao tài sản",
            icon: <SlidersOutlined />,
            fields: [
              {
                name: "declarationDate",
                label: "Ngày kê khai tài sản",
                type: FormFieldType.Date,
                placeholder: "Chọn ngày kê khai",
              },
              {
                name: "originalValue",
                label: "Nguyên giá (VNĐ)",
                type: FormFieldType.Number,
                min: 0,
                placeholder: "0",
              },
              {
                name: "depreciationRate",
                label: "Tỷ lệ hao mòn/Khấu hao (%)",
                type: FormFieldType.Number,
                min: 0,
                max: 100,
                placeholder: "0",
              },
              {
                name: "remainingValue",
                label: "Giá trị còn lại",
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  if (values.originalValue == null) return undefined;
                  return Math.max(
                    0,
                    Number(values.originalValue) -
                      (Number(values.accumulatedDepreciation) || 0),
                  );
                },
                valueFormatter: (val) =>
                  val != null ? fmtInputNumber(Number(val)) : "—",
              },
              {
                name: "valueUnit",
                label: "Đơn vị tính giá trị",
                type: FormFieldType.Readonly,
                initialValue: "VNĐ",
                valueFormatter: () => "VNĐ",
              },
              {
                name: "assignmentDecisionNumber",
                label: "Số quyết định giao (bao gồm cả tăng vốn)",
                type: FormFieldType.Text,
                placeholder: "Nhập số quyết định",
              },
              {
                name: "depreciationStartDate",
                label: "Ngày tính khấu hao",
                type: FormFieldType.Date,
                placeholder: "Chọn ngày tính",
              },
              {
                name: "depreciationMonths",
                label: "Số tháng tính khấu hao",
                type: FormFieldType.Number,
                min: 0,
                placeholder: "0",
              },
              {
                name: "depreciationEndDate",
                label: "Ngày hết khấu hao",
                type: FormFieldType.Date,
                placeholder: "Chọn ngày hết",
              },
              {
                name: "accumulatedDepreciation",
                label: "Khấu hao lũy kế",
                type: FormFieldType.Number,
                min: 0,
                placeholder: "0",
              },
              {
                name: "monthlyDepreciation",
                label: "Khấu hao tháng",
                type: FormFieldType.Readonly,
                computedValue: (_f, values) => {
                  const orig = Number(values.originalValue);
                  const months = Number(values.depreciationMonths);
                  if (values.originalValue != null && months > 0) {
                    return Math.round((orig / months) * 100) / 100;
                  }
                  return undefined;
                },
                valueFormatter: (val) =>
                  val != null ? fmtInputNumber(Number(val)) : "—",
              },
              {
                name: "disposalMethod",
                label: "Hình thức xử lý tài sản",
                type: FormFieldType.Select,
                allowClear: true,
                placeholder: "Chọn hình thức xử lý",
                options: DISPOSAL_METHODS.map((v) => ({ value: v, label: v })),
              },
            ],
          },
        ],
      },
      {
        key: "files",
        label: `Hồ sơ tài sản (${attachments.length})`,
        customContent: (
          <div style={{ paddingTop: 6 }}>
            <InfrastructureAttachmentTab
              attachments={attachments}
              readonly={false}
              onUpload={onUploadAttachment}
              onDelete={onDeleteAttachment}
              onDownload={onDownloadAttachment}
            />
          </div>
        ),
      },
    ];
  }, [
    organizations,
    relationOptions,
    screenConfig,
    attachments,
    onUploadAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
  ]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
    if (drawerMode === "edit") {
      const isDraft =
        !selected?.approvalStatus ||
        ["DRAFT", "NHAP"].includes(selected.approvalStatus.toUpperCase());
      const actions: FormSidebarAction[] = [];

      if (isDraft) {
        actions.push({
          key: "draft",
          label: "Lưu tạm",
          variant: "outline",
          loading: saving && saveAction === "DRAFT",
          onClick: () => void onSave("DRAFT"),
        });
      }

      actions.push({
        key: "approve",
        label: "Lưu và phê duyệt",
        variant: "success",
        loading: saving && saveAction === "APPROVED",
        onClick: () => void onSave("APPROVED"),
      });

      return actions;
    }

    return [
      {
        key: "draft",
        label: "Lưu tạm",
        variant: "outline",
        loading: saving && saveAction === "DRAFT",
        onClick: () => void onSave("DRAFT"),
      },
      {
        key: "submit",
        label: "Lưu và gửi phê duyệt",
        variant: "primary",
        loading: saving && saveAction === "PENDING_APPROVAL",
        onClick: () => void onSave("PENDING_APPROVAL"),
      },
      {
        key: "approve",
        label: "Lưu và phê duyệt",
        variant: "success",
        loading: saving && saveAction === "APPROVED",
        onClick: () => void onSave("APPROVED"),
      },
    ];
  }, [drawerMode, selected, saving, saveAction, onSave]);

  const title = useMemo(() => {
    if (drawerMode === "edit") {
      return `Chỉnh sửa thông tin — ${selected?.assetName || screenConfig.title}`;
    }
    return `Thêm mới ${screenConfig.subjectLabel}`;
  }, [drawerMode, screenConfig, selected]);

  return (
    <DynamicFormSidebar<FormValues>
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      width={
        typeof window !== "undefined"
          ? Math.min(1000, Math.floor(window.innerWidth * 0.95))
          : 1000
      }
      rootClassName={`berth-drawer-scope ${screenConfig.drawerClassName}`}
      className={`berth-drawer-scope ${screenConfig.drawerClassName}`}
      tabs={formTabs}
      footerActions={footerActions}
      footerAlign="center"
    />
  );
}
