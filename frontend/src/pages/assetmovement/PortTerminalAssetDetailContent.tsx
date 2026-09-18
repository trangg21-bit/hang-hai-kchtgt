import {
  AuditOutlined,
  BankOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  RocketOutlined,
  SlidersOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  DynamicViewSidebar,
  ViewFieldType,
  type ViewTabConfig,
} from "../../components/shared/dynamic-view-sidebar";
import InfrastructureAttachmentTab, {
  resolveMimeType,
  triggerBlobDownload,
  type InfrastructureAttachmentItem,
} from "../../components/shared/InfrastructureAttachmentTab";
import AssetAdjustmentHistoryTab from "../../components/shared/AssetAdjustmentHistoryTab";
import toast from "../../components/ToastNotification";
import api from "../../services/api";
import { fetchInfraAssetAttachments } from "../../services/assetmovement/api";
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetValueAdjustmentDetails,
  PortTerminalAsset,
} from "../../services/assetmovement/types";
import {
  actionPrimary,
  colors,
  fontSizeMd,
  fontWeightBold,
  statusAttention,
  statusCritical,
  statusDraft,
  statusOperational,
  textTertiary,
} from "../../themetokenchk";
import { fmtNum } from "../../utils/numFmt";
import {
  PORT_TERMINAL_ASSET_SCREEN,
  type InfrastructureAssetScreenConfig,
  type InfrastructureReferenceOption,
} from "./infrastructureAssetScreen";

export interface PortTerminalAssetDetailContentProps {
  open: boolean;
  selectedRecord?: PortTerminalAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  relatedInfrastructureMap?: Map<string, InfrastructureReferenceOption>;
  berthMap?: Map<string, InfrastructureReferenceOption>;
  screenConfig?: InfrastructureAssetScreenConfig;
  exploitationRows: AssetExploitationResponse[];
  increaseRows: AssetIncreaseResponse[];
  decreaseRows: AssetDecreaseResponse[];
  onDownloadAttachment?: (id: string, fileName: string) => void;
}

export interface AdjustmentRowItem {
  id: string;
  assetId: string;
  assetName: string;
  quantity: number;
  unitOfMeasure: string;
  reason: string;
  status: string;
  changeType: "Tăng nguyên giá" | "Giảm nguyên giá";
  icon: React.ReactNode;
  increaseCode?: string;
  decreaseCode?: string;
  decreaseReason?: string;
  decreaseType?: string;
  adjustmentDetails?: AssetValueAdjustmentDetails;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

const sectionBoxStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "12px 18px 8px 18px",
  marginBottom: 14,
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: "1px solid #f1f5f9",
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: "Lưu tạm" },
  NHAP: { color: statusDraft, label: "Lưu tạm" },
  PENDING_APPROVAL: {
    color: actionPrimary,
    label: "Chờ phê duyệt cấp Cảng vụ/Chi cục",
  },
  CHO_PHE_DUYET: {
    color: actionPrimary,
    label: "Chờ phê duyệt cấp Cảng vụ/Chi cục",
  },
  APPROVED_LEVEL1: { color: statusAttention, label: "Chờ phê duyệt cấp Cục" },
  APPROVED: { color: statusOperational, label: "Đã phê duyệt" },
  DA_PHE_DUYET: { color: statusOperational, label: "Đã phê duyệt" },
  DA_DUYET: { color: statusOperational, label: "Đã phê duyệt" },
  REJECTED_LEVEL1: {
    color: statusCritical,
    label: "Từ chối cấp Cảng vụ/Chi cục",
  },
  REJECTED_LEVEL2: { color: statusCritical, label: "Từ chối cấp Cục" },
  REJECTED: { color: statusCritical, label: "Từ chối" },
  TU_CHOI: { color: statusCritical, label: "Từ chối" },
  ARCHIVED: { color: statusCritical, label: "Đã xóa" },
  DA_XOA: { color: statusCritical, label: "Đã xóa" },
};

const fmtDateTime = (v?: string | null): string =>
  v ? dayjs(v).format("DD/MM/YYYY HH:mm:ss") : "";
const fmtDate = (v?: string | null): string =>
  v ? dayjs(v).format("DD/MM/YYYY") : "";

export default function PortTerminalAssetDetailContent({
  open,
  selectedRecord: r,
  onClose,
  orgName,
  relatedInfrastructureMap,
  berthMap,
  screenConfig = PORT_TERMINAL_ASSET_SCREEN,
  exploitationRows,
  increaseRows,
  decreaseRows,
  onDownloadAttachment,
}: PortTerminalAssetDetailContentProps) {
  const infraMap = useMemo(
    () => relatedInfrastructureMap || berthMap || new Map(),
    [relatedInfrastructureMap, berthMap],
  );
  const combinedAdjustments = useMemo(() => {
    return [
      ...increaseRows.map((row) => ({
        ...row,
        changeType: "Tăng nguyên giá" as const,
        icon: <PlusCircleOutlined style={{ color: statusOperational }} />,
      })),
      ...decreaseRows.map((row) => ({
        ...row,
        changeType: "Giảm nguyên giá" as const,
        icon: <MinusCircleOutlined style={{ color: statusCritical }} />,
      })),
    ];
  }, [increaseRows, decreaseRows]);

  const [detailAttachments, setDetailAttachments] = useState<
    InfrastructureAttachmentItem[]
  >([]);

  useEffect(() => {
    if (!r?.id) {
      let isMounted = true;
      Promise.resolve().then(() => {
        if (isMounted) setDetailAttachments([]);
      });
      return () => {
        isMounted = false;
      };
    }
    let isMounted = true;
    fetchInfraAssetAttachments(r.id)
      .then((realAtts) => {
        if (!isMounted) return;
        if (realAtts && realAtts.length > 0) {
          setDetailAttachments(
            realAtts.map((att) => ({
              id: att.id,
              fileName: att.fileName,
              fileSize: att.fileSize,
              fileType: att.contentType,
              uploadedByName: att.uploadedByName || r.updatedByName || "—",
              uploadedDate:
                att.uploadedAt ||
                (r.updatedAt
                  ? dayjs(r.updatedAt).toISOString()
                  : dayjs().toISOString()),
              filePath: `/v1/asset/infra-assets/${r.id}/attachments/${att.id}/download`,
            })),
          );
        } else if (r.attachmentName) {
          setDetailAttachments(
            r.attachmentName.split(",").map((name, i) => ({
              id: `detail-att-${i}`,
              fileName: name.trim(),
              fileSize: 1024 * 1024,
              uploadedByName: r.updatedByName || "—",
              uploadedDate: r.updatedAt
                ? dayjs(r.updatedAt).toISOString()
                : dayjs().toISOString(),
            })),
          );
        } else {
          setDetailAttachments([]);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        if (r.attachmentName) {
          setDetailAttachments(
            r.attachmentName.split(",").map((name, i) => ({
              id: `detail-att-${i}`,
              fileName: name.trim(),
              fileSize: 1024 * 1024,
              uploadedByName: r.updatedByName || "—",
              uploadedDate: r.updatedAt
                ? dayjs(r.updatedAt).toISOString()
                : dayjs().toISOString(),
            })),
          );
        } else {
          setDetailAttachments([]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [r]);

  const handleDownloadAttachment = useCallback(
    async (id: string, fileName: string) => {
      const att = detailAttachments.find(
        (a) => a.id === id || a.fileName === fileName,
      );
      if (att?.originFileObj) {
        triggerBlobDownload(
          att.originFileObj,
          fileName || att.originFileObj.name,
        );
        toast.success(`Đã tải xuống tệp: ${fileName}`);
        return;
      }
      if (att?.file) {
        triggerBlobDownload(att.file, fileName || att.file.name);
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
      const targetPath =
        att?.filePath ||
        (r?.id && id && !id.startsWith("detail-att-")
          ? `/v1/asset/infra-assets/${r.id}/attachments/${id}/download`
          : undefined);
      if (targetPath) {
        try {
          let cleanPath = targetPath;
          if (cleanPath.startsWith("/api/")) {
            cleanPath = cleanPath.replace(/^\/api/, "");
          } else if (!cleanPath.startsWith("/")) {
            cleanPath = `/${cleanPath}`;
          }
          const res = await api.get(cleanPath, { responseType: "blob" });
          const serverContentType =
            (typeof res.headers?.["content-type"] === "string"
              ? res.headers["content-type"]
              : "") || "";
          const contentType = resolveMimeType(
            fileName || att?.fileName || "tai-lieu",
            serverContentType || "application/octet-stream",
          );
          const blob = new Blob([res.data], { type: contentType });
          triggerBlobDownload(blob, fileName || att?.fileName || "tai-lieu");
          toast.success(`Đã tải xuống tệp: ${fileName}`);
          return;
        } catch (err) {
          console.warn(
            "Download from server failed, falling back to local generated attachment:",
            err,
          );
        }
      }
      if (onDownloadAttachment) {
        onDownloadAttachment(id, fileName);
        return;
      }
      const fallbackContentType = resolveMimeType(
        fileName || "tai-lieu",
        att?.fileType || "application/octet-stream",
      );
      const fallbackBlob = new Blob(
        [
          `Tài liệu đính kèm: ${fileName}\nThời gian: ${dayjs().format("DD/MM/YYYY HH:mm:ss")}\nĐược tải về từ Hệ thống Quản lý KCHT Hàng hải`,
        ],
        { type: fallbackContentType },
      );
      triggerBlobDownload(fallbackBlob, fileName || "tai-lieu");
      toast.success(`Đã tải xuống tệp: ${fileName}`);
    },
    [detailAttachments, onDownloadAttachment, r],
  );

  const viewTabs = useMemo<ViewTabConfig<PortTerminalAsset>[]>(() => {
    if (!r) return [];

    const approvalInfo = r.approvalStatus
      ? (APPROVAL_MAP[r.approvalStatus.toUpperCase()] ?? {
          color: textTertiary,
          label: r.approvalStatus,
        })
      : {
          color: textTertiary,
          label: "—",
        };

    return [
      {
        key: "general",
        label: "Thông tin chung",
        icon: <BankOutlined />,
        sections: [
          {
            key: "basic_info",
            title: "1. Thông tin cơ bản & Quản lý vận hành",
            icon: <BankOutlined />,
            fields: [
              {
                name: "assetCode",
                label: "Mã tài sản",
                type: ViewFieldType.Tag,
              },
              {
                name: "assetName",
                label: "Tên tài sản",
                render: (val) => (
                  <span
                    style={{
                      fontWeight: fontWeightBold,
                      color: colors.sidebarBg,
                    }}
                  >
                    {String(val || "")}
                  </span>
                ),
              },
              {
                label: "Cơ quan quản lý cấp trên",
                value: (rec) => orgName.get(rec.parentOrgUnitId || "") || "",
              },
              {
                label: "Đơn vị quản lý",
                render: (_v, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {orgName.get(rec.orgUnitId || "") || ""}
                  </span>
                ),
              },
              {
                label: "Đơn vị sử dụng",
                render: (_v, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {orgName.get(rec.usingOrgUnitId || "") || ""}
                  </span>
                ),
              },
              {
                label: screenConfig.relationCodeLabel,
                value: (rec) => {
                  const target = infraMap.get(
                    rec[screenConfig.relationField] || "",
                  );
                  return target?.code || "—";
                },
              },
              {
                label: screenConfig.relationNameLabel,
                value: (rec) => {
                  const target = infraMap.get(
                    rec[screenConfig.relationField] || "",
                  );
                  return target?.name || "—";
                },
              },
              {
                name: "assetType",
                label: "Loại tài sản",
                render: (val) =>
                  val === "PORT_TERMINAL"
                    ? "Tài sản bến cảng"
                    : String(val || ""),
              },
              {
                name: "barcode",
                label: "Barcode",
              },
              {
                name: "assetCondition",
                label: "Tình trạng tài sản",
                type: ViewFieldType.Badge,
                badgeColor: (val) =>
                  val === ""
                    ? statusOperational
                    : statusCritical,
              },
              {
                name: "usageStatus",
                label: "Hiện trạng sử dụng",
                type: ViewFieldType.Badge,
                badgeColor: (val) =>
                  val === "Đang sử dụng"
                    ? statusOperational
                    : val === "Tạm dừng sử dụng"
                      ? statusCritical
                      : statusDraft,
              },
              {
                name: "assetGroup",
                label: "Nhóm tài sản",
              },
              {
                name: "assetSubgroup",
                label: "Phân nhóm tài sản",
              },
              {
                name: "origin",
                label: "Nguồn gốc",
              },
              {
                label: "Số lượng",
                value: (rec) =>
                  rec.quantity != null
                    ? `${fmtNum(rec.quantity)} ${rec.quantityUnit || ""}`.trim()
                    : "",
              },
              {
                name: "quantityUnit",
                label: "Đơn vị tính",
              },
              {
                name: "model",
                label: "Model",
              },
              {
                name: "serialNumber",
                label: "Serial",
              },
              {
                name: "countryOfOrigin",
                label: "Xuất xứ",
              },
              {
                name: "manufacturer",
                label: "Hãng sản xuất",
              },
              {
                name: "constructionYear",
                label: "Năm xây dựng",
              },
              {
                name: "useDate",
                label: "Ngày sử dụng tài sản",
                type: ViewFieldType.Date,
              },
              {
                name: "landArea",
                label: "Diện tích đất, sàn sử dụng (m²)",
                type: ViewFieldType.Number,
                suffix: "m²",
              },
              {
                name: "floorArea",
                label: "Diện tích sàn sử dụng (m²)",
                type: ViewFieldType.Number,
                suffix: "m²",
              },
              {
                name: "assetLocation",
                label: "Vị trí tài sản",
                colSpan: 24,
              },
              {
                name: "address",
                label: "Địa chỉ",
                colSpan: 24,
              },
            ],
          },
        ],
      },
      {
        key: "details",
        label: "Thông tin chi tiết",
        sections: [
          {
            key: "depreciation_info",
            title: "2. Thông tin giá trị & Khấu hao tài sản",
            icon: <SlidersOutlined />,
            fields: [
              {
                name: "declarationDate",
                label: "Ngày kê khai tài sản",
                type: ViewFieldType.Date,
              },
              {
                name: "originalValue",
                label: "Nguyên giá (VNĐ)",
                type: ViewFieldType.Number,
                suffix: "VNĐ",
              },
              {
                name: "depreciationRate",
                label: "Tỷ lệ hao mòn/Khấu hao (%)",
                render: (val) => (val != null ? `${val}%` : ""),
              },
              {
                name: "remainingValue",
                label: "Giá trị còn lại (VNĐ)",
                type: ViewFieldType.Number,
                suffix: "VNĐ",
              },
              {
                label: "Đơn vị tính giá trị",
                value: () => "VNĐ",
              },
              {
                name: "assignmentDecisionNumber",
                label: "Số quyết định giao (bao gồm cả tăng vốn)",
              },
              {
                name: "depreciationStartDate",
                label: "Ngày tính khấu hao",
                type: ViewFieldType.Date,
              },
              {
                name: "depreciationMonths",
                label: "Số tháng tính khấu hao",
                render: (val) => (val != null ? `${val} tháng` : ""),
              },
              {
                name: "depreciationEndDate",
                label: "Ngày hết khấu hao",
                type: ViewFieldType.Date,
              },
              {
                name: "accumulatedDepreciation",
                label: "Khấu hao lũy kế (VNĐ)",
                type: ViewFieldType.Number,
                suffix: "VNĐ",
              },
              {
                name: "monthlyDepreciation",
                label: "Khấu hao tháng (VNĐ)",
                type: ViewFieldType.Number,
                suffix: "VNĐ",
              },
              {
                name: "disposalMethod",
                label: "Hình thức xử lý tài sản",
              },
            ],
          },
          {
            key: "approval_info",
            title: "Thông tin phê duyệt",
            icon: <AuditOutlined />,
            collapsible: true,
            defaultCollapsed: false,
            fields: [
              {
                label: "Trạng thái phê duyệt",
                type: ViewFieldType.Badge,
                colSpan: 24,
                value: () => approvalInfo.label,
                badgeColor: () => approvalInfo.color,
              },
              {
                name: "updatedByName",
                label: "Cán bộ cập nhật",
                render: (val) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || "")}
                  </span>
                ),
              },
              {
                name: "updatedAt",
                label: "Ngày cập nhật",
                type: ViewFieldType.DateTime,
              },
              {
                name: "submittedByName",
                label: "Cán bộ gửi phê duyệt",
                render: (val) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || "")}
                  </span>
                ),
              },
              {
                name: "submittedAt",
                label: "Ngày gửi phê duyệt",
                type: ViewFieldType.DateTime,
              },
              {
                name: "portAuthorityApprovedByName",
                label: "Cán bộ phê duyệt cấp Cảng vụ/Chi cục",
                render: (val, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || rec?.approvedLevel1ByName || "")}
                  </span>
                ),
              },
              {
                name: "portAuthorityApprovedAt",
                label: "Ngày phê duyệt cấp Cảng vụ/Chi cục",
                type: ViewFieldType.DateTime,
                value: (rec) => rec?.portAuthorityApprovedAt || rec?.approvedLevel1At,
              },
              {
                name: "portAuthorityApprovalContent",
                label: "Nội dung phê duyệt cấp Cảng vụ/Chi cục",
                colSpan: 24,
                value: (rec) => rec?.portAuthorityApprovalContent || rec?.approvalContentLevel1,
              },
              {
                name: "departmentApprovedByName",
                label: "Cán bộ phê duyệt cấp Cục",
                render: (val, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || rec?.approvedLevel2ByName || "")}
                  </span>
                ),
              },
              {
                name: "departmentApprovedAt",
                label: "Ngày phê duyệt cấp Cục",
                type: ViewFieldType.DateTime,
                value: (rec) => rec?.departmentApprovedAt || rec?.approvedLevel2At,
              },
              {
                name: "departmentApprovalContent",
                label: "Nội dung phê duyệt cấp Cục",
                colSpan: 24,
                value: (rec) => rec?.departmentApprovalContent || rec?.approvalContentLevel2,
              },
              {
                name: "rejectionReason",
                label: "Lý do từ chối",
                colSpan: 24,
                hidden: (rec) => !rec.rejectionReason,
                render: (val) => (
                  <span style={{ color: statusCritical, fontWeight: 500 }}>
                    {String(val)}
                  </span>
                ),
              },
            ],
          },
        ],
      },
      {
        key: "files",
        label: "Hồ sơ tài sản",
        badgeCount: detailAttachments.length,
        customContent: () => (
          <div style={{ paddingTop: 6 }}>
            <InfrastructureAttachmentTab
              attachments={detailAttachments}
              readonly={true}
              onUpload={() => {}}
              onDelete={() => {}}
              onDownload={handleDownloadAttachment}
            />
          </div>
        ),
      },
      {
        key: "exploitation",
        label: "Khai thác tài sản",
        badgeCount: exploitationRows.length,
        icon: <RocketOutlined />,
        customContent: () => (
          <div
            style={{
              paddingTop: 6,
              paddingRight: 4,
              overflowY: "auto",
              maxHeight: "calc(100vh - 190px)",
              minHeight: 350,
            }}
          >
            {exploitationRows.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: textTertiary,
                  fontSize: fontSizeMd,
                }}
              >
                Chưa có lịch sử khai thác tài sản nào.
              </div>
            ) : (
              exploitationRows.map((row, index) => (
                <div key={row.id} style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <RocketOutlined style={{ color: actionPrimary }} />
                      <span>
                        Lần {index + 1} — {fmtDateTime(row.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Đơn vị khai thác</span>
                      <span className="chk-detail-value">
                        {orgName.get(row.operatorOrgUnitId || "") || ""}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Danh mục tài sản</span>
                      <span className="chk-detail-value">
                        {(!row.assetCategory || (r && row.assetCategory === r.assetName))
                          ? ([r?.assetCode, r?.assetName].filter(Boolean).join(' - ') || row.assetCategory || "—")
                          : row.assetCategory}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Đơn vị tính</span>
                      <span className="chk-detail-value">
                        {row.unitOfMeasure || ""}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Số lượng</span>
                      <span className="chk-detail-value">
                        {row.quantity != null ? fmtNum(row.quantity) : ""}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Thời hạn khai thác
                      </span>
                      <span className="chk-detail-value">
                        {row.exploitationDeadline
                          ? fmtDate(row.exploitationDeadline)
                          : "—"}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Tổng tiền thu được (VNĐ)
                      </span>
                      <span className="chk-detail-value">
                        {(row.totalRevenue ?? row.doanhThu) != null
                          ? `${fmtNum(row.totalRevenue ?? row.doanhThu)} VNĐ`
                          : ""}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Chi phí liên quan
                      </span>
                      <span className="chk-detail-value">
                        {(row.relatedCosts ?? row.depreciation) != null
                          ? `${fmtNum(row.relatedCosts ?? row.depreciation)} VNĐ`
                          : ""}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Nộp NSNN</span>
                      <span className="chk-detail-value">
                        {row.stateBudgetPayment != null
                          ? `${fmtNum(row.stateBudgetPayment)} VNĐ`
                          : ""}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Số tiền thực hiện dự án
                      </span>
                      <span className="chk-detail-value">
                        {row.projectAmount != null
                          ? `${fmtNum(row.projectAmount)} VNĐ`
                          : ""}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Cán bộ cập nhật</span>
                      <span className="chk-detail-value">
                        {row.createdByName || ""}
                      </span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label">Ghi chú</span>
                      <span className="chk-detail-value">
                        {row.description || row.notes || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ),
      },
      {
        key: "adjustments",
        label: "Lịch sử thay đổi nguyên giá",
        badgeCount: combinedAdjustments.length,
        icon: <AuditOutlined />,
        customContent: <AssetAdjustmentHistoryTab dataSource={combinedAdjustments} />,
      },

    ];
  }, [
    r,
    orgName,
    infraMap,
    screenConfig,
    detailAttachments,
    exploitationRows,
    combinedAdjustments,
    handleDownloadAttachment,
  ]);

  return (
    <DynamicViewSidebar<PortTerminalAsset>
      open={open}
      onClose={onClose}
      record={r}
      title={`Chi tiết ${screenConfig.subjectLabel}${r ? ` - ${r.assetName}` : ""}`}
      tabs={viewTabs}
      rootClassName={`berth-drawer-scope ${screenConfig.drawerClassName}`}
      className={`berth-drawer-scope ${screenConfig.drawerClassName}`}
    />
  );
}
