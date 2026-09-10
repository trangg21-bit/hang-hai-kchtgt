import React, { useMemo } from "react";
import {
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Berth } from "../../types/port";
import type {
  PortTerminalAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from "../../services/assetmovement/types";
import { fmtNum } from "../../utils/numFmt";
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from "../../components/shared/InfrastructureAttachmentTab";
import {
  colors,
  actionPrimary,
  textTertiary,
  fontSizeMd,
  fontWeightBold,
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
} from "../../themetokenchk";
import {
  DynamicViewSidebar,
  ViewFieldType,
  type ViewTabConfig,
} from "../../components/shared/dynamic-view-sidebar";

export interface PortTerminalAssetDetailContentProps {
  open: boolean;
  selectedRecord?: PortTerminalAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  berthMap: Map<string, Berth>;
  exploitationRows: AssetExploitationResponse[];
  increaseRows: AssetIncreaseResponse[];
  decreaseRows: AssetDecreaseResponse[];
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
    color: statusAttention,
    label: "Chờ phê duyệt cấp Cảng vụ/Chi cục",
  },
  CHO_PHE_DUYET: {
    color: statusAttention,
    label: "Chờ phê duyệt cấp Cảng vụ/Chi cục",
  },
  APPROVED_LEVEL1: { color: actionPrimary, label: "Chờ phê duyệt cấp Cục" },
  APPROVED_LEVEL2: { color: statusAttention, label: "Chờ phê duyệt cấp cục" },
  APPROVED: { color: statusOperational, label: "Đã phê duyệt" },
  DA_PHE_DUYET: { color: statusOperational, label: "Đã phê duyệt" },
  REJECTED_LEVEL1: {
    color: statusCritical,
    label: "Từ chối cấp Cảng vụ/Chi cục",
  },
  REJECTED_LEVEL2: { color: statusCritical, label: "Từ chối cấp cục" },
  REJECTED: { color: statusCritical, label: "Từ chối" },
  TU_CHOI: { color: statusCritical, label: "Từ chối" },
};

const fmtDateTime = (v?: string | null): string =>
  v ? dayjs(v).format("DD/MM/YYYY HH:mm:ss") : "—";
const fmtDate = (v?: string | null): string =>
  v ? dayjs(v).format("DD/MM/YYYY") : "—";

const parseStoredDetails = (value?: string): Record<string, unknown> => {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return { notes: value };
  }
};

export default function PortTerminalAssetDetailContent({
  open,
  selectedRecord: r,
  onClose,
  orgName,
  berthMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
}: PortTerminalAssetDetailContentProps) {
  const combinedAdjustments = useMemo(() => {
    return [
      ...increaseRows.map((row) => ({
        ...row,
        changeType: "Tăng nguyên giá",
        icon: <PlusCircleOutlined style={{ color: statusOperational }} />,
      })),
      ...decreaseRows.map((row) => ({
        ...row,
        changeType: "Giảm nguyên giá",
        icon: <MinusCircleOutlined style={{ color: statusCritical }} />,
      })),
    ];
  }, [increaseRows, decreaseRows]);

  const detailAttachments: InfrastructureAttachmentItem[] = useMemo(() => {
    if (!r?.attachmentName) return [];
    return r.attachmentName.split(",").map((name, i) => ({
      id: `detail-att-${i}`,
      fileName: name.trim(),
      fileSize: 1024 * 1024,
      uploadedByName: r.updatedByName || r.submittedByName || "Cán bộ quản lý",
      uploadedDate: r.updatedAt
        ? dayjs(r.updatedAt).toISOString()
        : dayjs().toISOString(),
    }));
  }, [r]);

  const viewTabs = useMemo<ViewTabConfig<PortTerminalAsset>[]>(() => {
    if (!r) return [];

    const approvalInfo = APPROVAL_MAP[r.approvalStatus || ""] ||
      APPROVAL_MAP[r.approvalStatus?.toUpperCase() || ""] || {
        color: statusDraft,
        label: r.approvalStatus || "—",
      };

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
                    {String(val || "—")}
                  </span>
                ),
              },
              {
                label: "Cơ quan quản lý cấp trên",
                value: (rec) => orgName.get(rec.parentOrgUnitId || "") || "—",
              },
              {
                label: "Đơn vị quản lý",
                render: (_v, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {orgName.get(rec.orgUnitId || "") || "—"}
                  </span>
                ),
              },
              {
                label: "Đơn vị sử dụng",
                render: (_v, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {orgName.get(rec.usingOrgUnitId || "") || "—"}
                  </span>
                ),
              },
              {
                label: "Mã bến cảng",
                value: (rec) =>
                  berthMap.get(rec.berthId || "")?.berthCode || "—",
              },
              {
                label: "Tên bến cảng",
                value: (rec) =>
                  berthMap.get(rec.berthId || "")?.berthName || "—",
              },
              {
                name: "assetType",
                label: "Loại tài sản",
                render: (val) =>
                  val === "PORT_TERMINAL"
                    ? "Tài sản bến cảng"
                    : String(val || "—"),
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
                  val === "Tốt"
                    ? statusOperational
                    : val === "Không sử dụng được"
                      ? statusCritical
                      : statusAttention,
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
                    : "—",
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
                label: "Diện tích đất, sàn (m²)",
                type: ViewFieldType.Number,
              },
              {
                name: "floorArea",
                label: "Diện tích sàn sử dụng (m²)",
                type: ViewFieldType.Number,
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
          {
            key: "depreciation_info",
            title: "Thông tin giá trị & Khấu hao tài sản",
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
                render: (val) => (val != null ? `${val}%` : "—"),
              },
              {
                name: "remainingValue",
                label: "Giá trị còn lại",
                type: ViewFieldType.Number,
                suffix: "VNĐ",
              },
              {
                label: "Đơn vị tính giá trị",
                value: () => "VNĐ",
              },
              {
                name: "assignmentDecisionNumber",
                label: "Số quyết định giao",
              },
              {
                name: "depreciationStartDate",
                label: "Ngày tính khấu hao",
                type: ViewFieldType.Date,
              },
              {
                name: "depreciationMonths",
                label: "Số tháng tính khấu hao",
                render: (val) => (val != null ? `${val} tháng` : "—"),
              },
              {
                name: "depreciationEndDate",
                label: "Ngày hết khấu hao",
                type: ViewFieldType.Date,
              },
              {
                name: "accumulatedDepreciation",
                label: "Khấu hao lũy kế",
                type: ViewFieldType.Number,
                suffix: "VNĐ",
              },
              {
                name: "monthlyDepreciation",
                label: "Khấu hao tháng",
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
                label: "Trạng thái",
                type: ViewFieldType.Badge,
                value: () => approvalInfo.label,
                badgeColor: () => approvalInfo.color,
              },
              {
                name: "updatedAt",
                label: "Ngày cập nhật",
                type: ViewFieldType.DateTime,
              },
              {
                name: "updatedByName",
                label: "Cán bộ cập nhật",
                render: (val) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || "—")}
                  </span>
                ),
              },
              {
                name: "submittedAt",
                label: "Ngày gửi phê duyệt",
                type: ViewFieldType.DateTime,
              },
              {
                name: "submittedByName",
                label: "Người gửi phê duyệt",
              },
              {
                name: "approvedLevel1At",
                label: "Ngày duyệt cấp 1",
                type: ViewFieldType.DateTime,
              },
              {
                name: "approvedLevel1ByName",
                label: "Người duyệt cấp 1",
              },
              {
                name: "approvalContentLevel1",
                label: "Nội dung phê duyệt cấp 1",
                colSpan: 24,
              },
              {
                name: "approvedLevel2At",
                label: "Ngày duyệt cấp 2",
                type: ViewFieldType.DateTime,
              },
              {
                name: "approvedLevel2ByName",
                label: "Người duyệt cấp 2",
              },
              {
                name: "approvalContentLevel2",
                label: "Nội dung phê duyệt cấp 2",
                colSpan: 24,
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
        label: `Hồ sơ tài sản (${detailAttachments.length})`,
        customContent: () => (
          <div style={{ paddingTop: 6 }}>
            <InfrastructureAttachmentTab
              attachments={detailAttachments}
              readonly={true}
              onUpload={() => {}}
              onDelete={() => {}}
              onDownload={() => {}}
            />
          </div>
        ),
      },
      {
        key: "exploitation",
        label: `Khai thác tài sản (${exploitationRows.length})`,
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
                        {orgName.get(row.operatorOrgUnitId || "") || "—"}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Danh mục tài sản</span>
                      <span className="chk-detail-value">
                        {row.assetCategory || r.assetName}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Đơn vị tính</span>
                      <span className="chk-detail-value">
                        {row.unitOfMeasure || "—"}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Số lượng</span>
                      <span className="chk-detail-value">
                        {row.quantity != null ? fmtNum(row.quantity) : "—"}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Thời hạn khai thác
                      </span>
                      <span className="chk-detail-value">
                        {fmtDate(row.exploitationDeadline)}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Tổng tiền thu được (VNĐ)
                      </span>
                      <span className="chk-detail-value">
                        {(row.totalRevenue ?? row.doanhThu) != null
                          ? `${fmtNum(row.totalRevenue ?? row.doanhThu)} VNĐ`
                          : "—"}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Chi phí liên quan
                      </span>
                      <span className="chk-detail-value">
                        {(row.relatedCosts ?? row.depreciation) != null
                          ? `${fmtNum(row.relatedCosts ?? row.depreciation)} VNĐ`
                          : "—"}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Nộp NSNN</span>
                      <span className="chk-detail-value">
                        {row.stateBudgetPayment != null
                          ? `${fmtNum(row.stateBudgetPayment)} VNĐ`
                          : "—"}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Số tiền thực hiện dự án
                      </span>
                      <span className="chk-detail-value">
                        {row.projectAmount != null
                          ? `${fmtNum(row.projectAmount)} VNĐ`
                          : "—"}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Cán bộ cập nhật</span>
                      <span className="chk-detail-value">
                        {row.createdByName || "—"}
                      </span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label">Ghi chú</span>
                      <span className="chk-detail-value">
                        {row.description || "—"}
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
        label: `Thay đổi nguyên giá (${combinedAdjustments.length})`,
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
            {combinedAdjustments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: textTertiary,
                  fontSize: fontSizeMd,
                }}
              >
                Chưa có lịch sử thay đổi nguyên giá nào.
              </div>
            ) : (
              combinedAdjustments.map((row, index) => {
                const details: Record<string, unknown> = {
                  ...(row.adjustmentDetails || parseStoredDetails(row.reason)),
                };
                return (
                  <div key={row.id} style={sectionBoxStyle}>
                    <div style={sectionHeaderStyle}>
                      <div style={sectionTitleStyle}>
                        {row.icon}
                        <span>
                          {row.changeType} — Lần {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Loại thay đổi</span>
                        <span className="chk-detail-value">
                          {row.changeType}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Số QĐ điều chỉnh
                        </span>
                        <span className="chk-detail-value">
                          {String(
                            details.decisionNumber ||
                              ("increaseCode" in row ? row.increaseCode : "—"),
                          )}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Ngày ra quyết định
                        </span>
                        <span className="chk-detail-value">
                          {fmtDate(details.decisionDate as string)}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Ngày thay đổi nguyên giá
                        </span>
                        <span className="chk-detail-value">
                          {fmtDate(details.adjustmentDate as string)}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Lý do điều chỉnh
                        </span>
                        <span className="chk-detail-value">
                          {String(
                            details.adjustmentReason ||
                              ("decreaseReason" in row
                                ? row.decreaseReason
                                : "—"),
                          )}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Nguyên giá trước điều chỉnh
                        </span>
                        <span className="chk-detail-value">
                          {details.originalValueBefore != null
                            ? `${fmtNum(details.originalValueBefore as number)} VNĐ`
                            : "—"}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Nguyên giá sau điều chỉnh
                        </span>
                        <span className="chk-detail-value">
                          {details.originalValueAfter != null
                            ? `${fmtNum(details.originalValueAfter as number)} VNĐ`
                            : "—"}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Giá trị còn lại trước
                        </span>
                        <span className="chk-detail-value">
                          {details.remainingValueBefore != null
                            ? `${fmtNum(details.remainingValueBefore as number)} VNĐ`
                            : "—"}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Giá trị còn lại sau
                        </span>
                        <span className="chk-detail-value">
                          {details.remainingValueAfter != null
                            ? `${fmtNum(details.remainingValueAfter as number)} VNĐ`
                            : "—"}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Cán bộ thực hiện
                        </span>
                        <span className="chk-detail-value">
                          {row.createdByName || "—"}
                        </span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label">
                          Ghi chú điều chỉnh
                        </span>
                        <span className="chk-detail-value">
                          {String(
                            details.adjustmentNotes ||
                              details.notes ||
                              row.reason ||
                              "—",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ),
      },
    ];
  }, [
    r,
    orgName,
    berthMap,
    detailAttachments,
    exploitationRows,
    combinedAdjustments,
  ]);

  return (
    <DynamicViewSidebar<PortTerminalAsset>
      open={open}
      onClose={onClose}
      record={r}
      title={`Chi tiết tài sản bến cảng${r ? ` - ${r.assetName}` : ""}`}
      tabs={viewTabs}
      width={
        typeof window !== "undefined"
          ? Math.min(1000, Math.floor(window.innerWidth * 0.95))
          : 1000
      }
      rootClassName="berth-drawer-scope"
      className="berth-drawer-scope"
    />
  );
}
