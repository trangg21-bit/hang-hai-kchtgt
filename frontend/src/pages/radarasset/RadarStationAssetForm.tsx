import {
  BankOutlined,
  ProfileOutlined,
  SlidersOutlined,
} from "@ant-design/icons";
import type { FormInstance } from "antd";
import { Form, InputNumber } from "antd";
import type { Dayjs } from "dayjs";
import { useCallback, useMemo } from "react";
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormSidebarAction,
  type FormTabConfig,
} from "../../components/shared/dynamic-form-sidebar";
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from "../../components/shared/InfrastructureAttachmentTab";
import { MARITIME_ASSET_TYPE_OPTIONS } from "../../constants/assetType";
import type { Organization } from "../../services/organizationService";
import type { RadarStationOption } from "../../services/radarasset/api";
import type {
  RadarStationAsset,
  RadarStationAssetPayload,
} from "../../services/radarasset/types";
import {
  colors,
  fontWeightBold,
  radiusPill,
} from "../../themetokenchk";
import { getOrGenerateAttachmentBlob } from "../../utils/attachmentStorage";
import { fmtInputNumber } from "../../utils/numFmt";

export type FormValues = Omit<
  RadarStationAssetPayload,
  | "constructionYear"
  | "useDate"
  | "declarationDate"
  | "depreciationStartDate"
  | "depreciationEndDate"
> & {
  constructionYear?: Dayjs;
  useDate?: Dayjs;
  declarationDate?: Dayjs;
  depreciationStartDate?: Dayjs;
  depreciationEndDate?: Dayjs;
  attachmentName?: string;
};

import {
  ASSET_CONDITION_OPTIONS,
  ASSET_GROUP_OPTIONS,
  ASSET_ORIGIN_OPTIONS,
  ASSET_QUANTITY_UNIT_OPTIONS,
  DISPOSAL_METHOD_OPTIONS,
  USAGE_STATUS_OPTIONS,
} from "../../constants/assetDropdown";

export interface RadarStationAssetFormProps {
  open: boolean;
  drawerMode?: "create" | "edit" | "detail";
  selected?: RadarStationAsset;
  form: FormInstance<FormValues>;
  organizations: Organization[];
  radarStations: RadarStationOption[];
  attachments: InfrastructureAttachmentItem[];
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function RadarStationAssetForm({
  open,
  drawerMode,
  selected,
  form,
  organizations,
  radarStations,
  attachments,
  saving,
  saveAction,
  onClose,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}: RadarStationAssetFormProps) {
  const isCreate = drawerMode === "create";
  const drawerTitle = isCreate
    ? "Thêm mới tài sản trạm radar"
    : `Chỉnh sửa tài sản trạm radar — ${selected?.assetName || ""}`;

  const handleLoadReadonlyPreviewImage = useCallback(
    async (attachmentId: string) => {
      const att = attachments.find((item) => item.id === attachmentId);
      if (!att) throw new Error("Không tìm thấy tệp");
      return await getOrGenerateAttachmentBlob(att.fileName, {
        assetCode: selected?.assetCode,
        assetName: selected?.assetName,
      });
    },
    [attachments, selected?.assetCode, selected?.assetName],
  );

  const tabs = useMemo<FormTabConfig<FormValues>[]>(() => {
    return [
      {
        key: "general",
        label: "Thông tin chung",
        icon: <BankOutlined />,
        sections: [
          {
            key: "org_info",
            title: "Cơ quan & Tổ chức quản lý",
            fields: [
              {
                name: "parentOrgUnitId",
                label: "Cơ quan quản lý cấp trên",
                type: FormFieldType.TreeSelect,
                organizations,
                placeholder: "Chọn cơ quan cấp trên...",
                colSpan: 12,
              },
              {
                name: "orgUnitId",
                label: "Đơn vị quản lý",
                type: FormFieldType.TreeSelect,
                organizations,
                required: true,
                placeholder: "Chọn đơn vị quản lý...",
                rules: [
                  { required: true, message: "Đơn vị quản lý là bắt buộc" },
                ],
                colSpan: 12,
              },
              {
                name: "usingOrgUnitId",
                label: "Đơn vị sử dụng",
                type: FormFieldType.TreeSelect,
                organizations,
                required: true,
                placeholder: "Chọn đơn vị sử dụng...",
                rules: [
                  { required: true, message: "Đơn vị sử dụng là bắt buộc" },
                ],
                colSpan: 12,
              },
              {
                name: "radarStationId",
                label: "Mã trạm radar",
                type: FormFieldType.Select,
                required: true,
                placeholder: "Chọn trạm radar...",
                options: radarStations.map((r) => ({
                  value: r.id,
                  label: `${r.code} - ${r.name}`,
                })),
                rules: [
                  { required: true, message: "Mã trạm radar là bắt buộc" },
                ],
                colSpan: 12,
              },
            ],
          },
          {
            key: "asset_basic",
            title: "Thông tin tài sản",
            fields: [
              {
                name: "assetType",
                label: "Loại tài sản",
                type: FormFieldType.Select,
                required: true,
                placeholder: "Chọn loại tài sản",
                allowClear: true,
                options: MARITIME_ASSET_TYPE_OPTIONS,
                rules: [
                  { required: true, message: "Loại tài sản là bắt buộc" },
                ],
                colSpan: 12,
              },
              {
                name: "assetCode",
                label: "Mã tài sản",
                type: FormFieldType.Text,
                placeholder: "Hệ thống tự sinh",
                disabled: true,
                colSpan: 12,
              },
              {
                name: "assetName",
                label: "Tên tài sản",
                type: FormFieldType.Text,
                maxLength: 255,
                required: true,
                placeholder: "Nhập tên tài sản...",
                rules: [{ required: true, message: "Tên tài sản là bắt buộc" }],
                colSpan: 24,
              },
              {
                name: "barcode",
                label: "Barcode",
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: "Nhập mã barcode",
                colSpan: 12,
              },
              {
                name: "assetCondition",
                label: "Tình trạng tài sản",
                type: FormFieldType.Select,
                required: true,
                placeholder: "Chọn tình trạng",
                options: ASSET_CONDITION_OPTIONS,
                rules: [
                  { required: true, message: "Tình trạng tài sản là bắt buộc" },
                ],
                colSpan: 12,
              },
              {
                name: "usageStatus",
                label: "Hiện trạng sử dụng",
                type: FormFieldType.Select,
                required: true,
                placeholder: "Chọn hiện trạng",
                options: USAGE_STATUS_OPTIONS,
                rules: [
                  { required: true, message: "Hiện trạng sử dụng là bắt buộc" },
                ],
                colSpan: 12,
              },
              {
                name: "assetGroup",
                label: "Nhóm tài sản",
                type: FormFieldType.Select,
                required: true,
                placeholder: "Chọn nhóm tài sản",
                options: ASSET_GROUP_OPTIONS,
                rules: [
                  { required: true, message: "Nhóm tài sản là bắt buộc" },
                ],
                colSpan: 12,
              },
              {
                name: "assetSubgroup",
                label: "Phân nhóm tài sản",
                type: FormFieldType.Text,
                maxLength: 200,
                placeholder: "Nhập phân nhóm tài sản",
                colSpan: 12,
              },
              {
                name: "origin",
                label: "Nguồn gốc",
                type: FormFieldType.Select,
                placeholder: "Chọn nguồn gốc",
                options: ASSET_ORIGIN_OPTIONS,
                colSpan: 12,
              },
              {
                name: "address",
                label: "Địa chỉ",
                type: FormFieldType.Text,
                maxLength: 2000,
                placeholder: "Nhập địa chỉ tài sản",
                colSpan: 24,
              },
            ],
          },
          {
            key: "tech_specs",
            title: "Chỉ số tổng hợp & Quy mô kỹ thuật",
            fields: [
              {
                name: "quantity",
                label: "Số lượng",
                type: FormFieldType.Number,
                maxLength: 5,
                min: 1,
                required: true,
                rules: [{ required: true, message: "Vui lòng nhập số lượng" }],
                formatter: fmtInputNumber,
                placeholder: "1",
                colSpan: 12,
              },
              {
                name: "quantityUnit",
                label: "Đơn vị tính",
                type: FormFieldType.Select,
                required: true,
                rules: [{ required: true, message: "Vui lòng chọn đơn vị tính" }],
                placeholder: "Chọn đơn vị tính",
                options: ASSET_QUANTITY_UNIT_OPTIONS,
                colSpan: 12,
              },
              {
                name: "model",
                label: "Model",
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: "Nhập model",
                colSpan: 12,
              },
              {
                name: "serialNumber",
                label: "Serial",
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: "Nhập serial",
                colSpan: 12,
              },
              {
                name: "countryOfOrigin",
                label: "Xuất xứ",
                type: FormFieldType.Text,
                maxLength: 100,
                placeholder: "Nhập xuất xứ",
                colSpan: 12,
              },
              {
                name: "manufacturer",
                label: "Hãng sản xuất",
                type: FormFieldType.Text,
                maxLength: 200,
                placeholder: "Nhập hãng sản xuất",
                colSpan: 12,
              },
              {
                name: "constructionYear",
                label: "Năm xây dựng",
                type: FormFieldType.Date,
                placeholder: "Chọn năm",
                picker: "year",
                colSpan: 12,
              },
              {
                name: "useDate",
                label: "Ngày sử dụng tài sản",
                type: FormFieldType.Date,
                required: true,
                placeholder: "Chọn ngày sử dụng",
                rules: [
                  { required: true, message: "Ngày sử dụng là bắt buộc" },
                ],
                colSpan: 12,
              },
              {
                name: "landArea",
                label: "Diện tích (đất, sàn sử dụng: m²)",
                type: FormFieldType.Number,
                maxLength: 20,
                min: 0,
                formatter: fmtInputNumber,
                placeholder: "0",
                colSpan: 12,
              },
              {
                name: "floorArea",
                label: "Diện tích (sàn sử dụng: m²)",
                type: FormFieldType.Number,
                maxLength: 20,
                min: 0,
                formatter: fmtInputNumber,
                placeholder: "0",
                colSpan: 12,
              },
              {
                name: "assetLocation",
                label: "Vị trí tài sản",
                type: FormFieldType.Text,
                maxLength: 2000,
                placeholder: "Nhập vị trí tài sản",
                colSpan: 24,
              },
            ],
          },
        ],
      },
      {
        key: "attachments",
        label: `Hồ sơ tài sản (${attachments.length})`,
        icon: <ProfileOutlined />,
        customContent: (
          <div style={{ padding: "8px 0" }}>
            <InfrastructureAttachmentTab
              attachments={attachments}
              readonly={false}
              onUpload={onUploadAttachment}
              onDelete={onDeleteAttachment}
              onDownload={onDownloadAttachment}
              loadReadonlyPreviewImage={handleLoadReadonlyPreviewImage}
            />
          </div>
        ),
      },
      {
        key: "details",
        label: "Thông tin chi tiết",
        icon: <SlidersOutlined />,
        sections: [
          {
            key: "financial_info",
            title: "Thông tin giá trị & Khấu hao tài sản",
            fields: [
              {
                name: "declarationDate",
                label: "Ngày kê khai tài sản",
                type: FormFieldType.Date,
                placeholder: "Chọn ngày kê khai",
                colSpan: 12,
              },
              {
                name: "originalValue",
                label: "Nguyên giá (VNĐ)",
                type: FormFieldType.Number,
                maxLength: 20,
                min: 0,
                formatter: fmtInputNumber,
                placeholder: "0",
                colSpan: 12,
              },
              {
                name: "depreciationRate",
                label: "Tỷ lệ hao mòn/Khấu hao (%)",
                type: FormFieldType.Number,
                maxLength: 5,
                min: 0,
                max: 100,
                placeholder: "0",
                colSpan: 12,
              },
              {
                name: "remainingValue",
                label: "Giá trị còn lại (VNĐ)",
                type: FormFieldType.Custom,
                colSpan: 12,
                customRender: () => (
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => {
                      const orig =
                        Number(getFieldValue("originalValue")) || 0;
                      const acc =
                        Number(getFieldValue("accumulatedDepreciation")) || 0;
                      const rem = Math.max(0, orig - acc);
                      return (
                        <InputNumber
                          value={rem}
                          disabled
                          formatter={fmtInputNumber}
                          style={{
                            width: "100%",
                            borderRadius: radiusPill,
                            height: 40,
                            background: "#f8fafc",
                          }}
                        />
                      );
                    }}
                  </Form.Item>
                ),
              },
              {
                name: "valueUnit",
                label: "Đơn vị tính giá trị",
                type: FormFieldType.Select,
                colSpan: 12,
                disabled: true,
                initialValue: "VNĐ",
                options: [{ value: "VNĐ", label: "VNĐ" }],
              },
              {
                name: "assignmentDecisionNumber",
                label: "Số quyết định giao (bao gồm cả tăng vốn)",
                type: FormFieldType.Text,
                maxLength: 200,
                placeholder: "Nhập số quyết định giao",
                colSpan: 12,
              },
              {
                name: "depreciationStartDate",
                label: "Ngày tính khấu hao",
                type: FormFieldType.Date,
                placeholder: "Chọn ngày tính khấu hao",
                colSpan: 12,
              },
              {
                name: "depreciationMonths",
                label: "Số tháng tính khấu hao",
                type: FormFieldType.Number,
                maxLength: 5,
                min: 0,
                placeholder: "Nhập số tháng",
                colSpan: 12,
              },
              {
                name: "depreciationEndDate",
                label: "Ngày hết khấu hao",
                type: FormFieldType.Date,
                placeholder: "Chọn ngày hết khấu hao",
                colSpan: 12,
              },
              {
                name: "accumulatedDepreciation",
                label: "Khấu hao lũy kế (VNĐ)",
                type: FormFieldType.Number,
                maxLength: 20,
                min: 0,
                formatter: fmtInputNumber,
                placeholder: "0",
                colSpan: 12,
              },
              {
                name: "monthlyDepreciation",
                label: "Khấu hao tháng (VNĐ)",
                type: FormFieldType.Custom,
                colSpan: 12,
                customRender: () => (
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => {
                      const orig =
                        Number(getFieldValue("originalValue")) || 0;
                      const months =
                        Number(getFieldValue("depreciationMonths")) || 0;
                      const mDep = months > 0 ? Math.round(orig / months) : 0;
                      return (
                        <InputNumber
                          value={mDep}
                          disabled
                          formatter={fmtInputNumber}
                          style={{
                            width: "100%",
                            borderRadius: radiusPill,
                            height: 40,
                            background: "#f8fafc",
                          }}
                        />
                      );
                    }}
                  </Form.Item>
                ),
              },
              {
                name: "disposalMethod",
                label: "Hình thức xử lý tài sản",
                type: FormFieldType.Select,
                placeholder: "Chọn hình thức xử lý",
                options: DISPOSAL_METHOD_OPTIONS,
                colSpan: 12,
              },
            ],
          },
        ],
      },
    ];
  }, [
    attachments,
    handleLoadReadonlyPreviewImage,
    onDeleteAttachment,
    onDownloadAttachment,
    onUploadAttachment,
    organizations,
    radarStations,
  ]);

  const footerActions = useMemo<FormSidebarAction[]>(() => {
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
  }, [onSave, saveAction, saving]);

  return (
    <DynamicFormSidebar<FormValues>
      open={open}
      title={
        <span
          style={{
            fontSize: 16,
            fontWeight: fontWeightBold,
            color: colors.sidebarBg,
          }}
        >
          {drawerTitle}
        </span>
      }
      form={form}
      tabs={tabs}
      footerActions={footerActions}
      footerAlign="center"
      onClose={onClose}
      rootClassName="radar-asset-drawer-scope"
    />
  );
}
