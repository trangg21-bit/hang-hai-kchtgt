import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fmtNum, fmtInputNumber } from "../../utils/numFmt";
import { coordinateRowsToWkt, resolveMapGeometryLocation, type EditableGeometryType } from "../../utils/gisGeometry";

// Normalize form geometryType ('POINT' | 'LINE' | 'POLYGON') — fallback POINT khi chưa chọn
const normalizeGeometryType = (value: unknown): 'POINT' | 'LINE' | 'POLYGON' =>
  value === 'LINE' || value === 'POLYGON' ? value : 'POINT';
import { usePermissionStore } from "../../store/permissionStore";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Space,
  Tag,
  Row,
  Col,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Typography,
  Drawer,
  Table,
} from "antd";
import { OrgUnitTreeSelect } from "../../components/org-unit";
import {
  PlusOutlined,
  DeleteOutlined,
  HistoryOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
  FileOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Tabs, Upload } from "antd";
import type { RcFile } from "antd/es/upload/interface";
import { useSearchParams } from "react-router-dom";
import {
  fetchScadaList,
  deleteScada,
  submitScada,
  approveScadaC1,
  approveScadaC2,
  createScada,
  updateScada,
  generateScadaCode,
  fetchScadaHistory,
  fetchScadaAttachments,
  uploadScadaAttachment,
  deleteScadaAttachment,
} from "./api";
import { OPERATIONAL_STATUS_OPTIONS } from "./schema";
import type { ScadaResponse, ApprovalRequest, CreateScadaRequest } from "./types";
import toast from "../../components/ToastNotification";
import ApprovalModal from "../../components/shared/ApprovalModal";
import { useAuthStore } from "../../store/authStore";
import EmptyState from "../../components/EmptyState";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { VIETNAM_PROVINCES } from "../../types/common";
import api from "../api";
import { DEFAULT_OPERATING_ORGANIZATIONS } from "../operatingOrganizationsData";
import type { Symbol as MapSymbolType } from "../symbolService";
import {
  ScreenHeader,
  DataTable,
  Pagination,
  FilterTableLayout,
} from "../../components/list-view";
import {
  historyBadgeStyle,
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyInfoTitleStyle,
  historyChangeRowStyle,
  historyCreateRowStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
} from "../../themetokenchk";

/** Map unitOfMeasure code (Integer) → label cho hiển thị */
const UOM_LABELS: Record<number, string> = {
  1: 'Bộ',
  2: 'Bến',
  3: 'Bản quyền',
  4: 'Chiếc',
  5: 'Cổng',
  6: 'Cái',
  7: 'Cột',
  8: 'Cầu',
  9: 'Đường truyền',
  10: 'Héc-ta',
  11: 'Hạng mục',
  12: 'Hệ thống',
  13: 'Kho',
  14: 'Khu',
  15: 'Ki-lô-mét',
  16: 'Mét',
  17: 'Mét vuông',
  18: 'Nhà',
  19: 'Phòng',
  20: 'Phân hệ',
  21: 'Quả',
  22: 'Tuyến',
  23: 'Tấn',
  24: 'Trạm',
  25: 'Tháp',
  26: 'Trụ',
  27: 'VNĐ',
};

function formatUnitOfMeasure(code: number | null | undefined): string {
  return code != null && UOM_LABELS[code] ? UOM_LABELS[code] : '—';
}

// ── labelProps — matches PortFormContent.tsx ────────────────
const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

import {
  colors,
  fontSizeMd,
  fontSizeLg,
  fontSizeXl,
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
  fontWeightNormal,
  textPrimary,
  textSecondary,
  textTertiary,
  statusCritical,
  statusAttention,
  statusDraft,
  statusOperational,
  actionPrimary,
  borderDefault,
  surfaceCard,
  radiusPill,
  radiusMd,
  fontSans,
  spaceMd,
  spaceFormField,
  spaceSm,
  spaceLg,
  spaceXs,
  spaceXl,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  uploadHintStyle,
  statusBadgeStyle,
  icons,
  statusInfo,
} from "../../themetokenchk";
import dayjs from "dayjs";
import * as themeTokenChk from "../../themetokenchk";
import { ThemeTokenProvider } from "../../context/ThemeTokenContext";

const { Text } = Typography;

// ── Trạng thái phê duyệt 2 cấp (C1 Cảng vụ → C2 Cục) — đồng bộ /vts-system ──
const APPROVAL_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
  APPROVED_LEVEL1: 'Chờ Cục duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED_LEVEL1: 'Cảng vụ trả về',
  REJECTED_LEVEL2: 'Cục trả về',
};

const APPROVAL_COLOR: Record<string, string> = {
  DRAFT: statusDraft,
  PENDING_APPROVAL: statusAttention,
  APPROVED_LEVEL1: statusInfo,
  APPROVED: statusOperational,
  REJECTED_LEVEL1: statusCritical,
  REJECTED_LEVEL2: statusCritical,
};

/* ── Shared list/detail UI tokens — aligned with Port list-view ───────── */
export const sectionHeader: React.CSSProperties = {
  display: "block",
  fontSize: fontSizeMd,
  fontWeight: fontWeightBold,
  color: colors.sidebarBg,
  marginBottom: spaceMd,
  marginTop: spaceLg,
  fontFamily: fontSans,
};

const fieldLabelStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd,
  marginBottom: spaceSm,
};

const pillStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  fontFamily: fontSans,
};

// ── Detail-page helpers (aligned with PortDetailPage) ────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch { return dateStr; }
}

/** Badge hiển thị giống chuẩn bến cảng: span pill + semantic token */
function renderScadaStatusBadge(b: { color: string; label: string }) {
  let c = textTertiary;
  if (b.color === 'green') c = statusOperational;
  else if (b.color === 'red') c = statusCritical;
  else if (b.color === 'orange') c = statusAttention;
  return <span style={statusBadgeStyle(c)}>{b.label}</span>;
}

/** Badge trạng thái phê duyệt 2 cấp — dùng APPROVAL_STATUS_MAP + APPROVAL_COLOR (quy chuẩn AGENTS.md) */
function renderApprovalBadge(status: string | null | undefined) {
  if (!status) return <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>;
  const display = APPROVAL_STATUS_MAP[status] || status;
  const color = APPROVAL_COLOR[status] || textTertiary;
  return (
    <span style={statusBadgeStyle(color)}>
      {display}
    </span>
  );
}

/** Stat card cho chỉ số tổng hợp */
export function ScadaStatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card
      size="small"
      style={{
        border: `0.5px solid ${borderDefault}`,
        borderRadius: radiusMd,
        transition: 'box-shadow 0.2s',
      }}
      styles={{ body: { padding: `${spaceSm}px ${spaceMd}px` } }}
      hoverable
    >
      <Space size={spaceSm}>
        {icon && <span style={{ color: actionPrimary, fontSize: fontSizeXl }}>{icon}</span>}
        <div>
          <div style={{ color: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightBold }}>{value}</div>
          <div style={{ color: textTertiary, fontSize: fontSizeSm }}>{label}</div>
        </div>
      </Space>
    </Card>
  );
}

/** Info row cho label+value pairs trong detail */
function DetailInfoRow({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <Col xs={24} sm={full ? 24 : 12}>
      <div style={{ marginBottom: spaceMd }}>
        <Typography.Text style={fieldLabelStyle}>{label}</Typography.Text>
        <div style={{ color: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightNormal }}>{value}</div>
      </div>
    </Col>
  );
}

/* Bảng tham chiếu (Vận hành khai thác / Bảo trì / Sự cố) — placeholder theo chuẩn
   PortRefTable của /port; bảng rỗng chờ tích hợp dữ liệu kế hoạch/sự cố sau này */
const SCADA_TAB_PAGE_SIZE = 20;
function ScadaRefTable({ title, emptyText, columns, dataSource = [] }: { title: string; emptyText: string; columns: Array<{ title: string; dataIndex?: string; width?: number }>; dataSource?: any[] }) {
  const [page, setPage] = useState(1);
  const maxPage = Math.max(1, Math.ceil(dataSource.length / SCADA_TAB_PAGE_SIZE));
  const cur = Math.min(page, maxPage);
  const rows = dataSource
    .map((row, idx) => ({ ...row, key: row?.key ?? idx, __index: idx + 1 }))
    .slice((cur - 1) * SCADA_TAB_PAGE_SIZE, cur * SCADA_TAB_PAGE_SIZE);
  const refHdr = () => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } });
  return (
    <div style={{ paddingTop: 3 }}>
      <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{title}</span>
      </div>
      <Table
        className="list-view-table"
        dataSource={rows}
        pagination={false} size="middle" bordered
        style={{ marginLeft: 12, marginRight: 12 }}
        locale={{ emptyText: <div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>{emptyText}</span></div> }}
      >
        <Table.Column title="STT" key="index" dataIndex="__index" width={60} align="center"
          render={(v: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{v}</span>}
          onHeaderCell={refHdr} />
        {columns.map((c) => (
          <Table.Column key={c.title} title={c.title} dataIndex={c.dataIndex} width={c.width} align="center"
            render={(v: any) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>}
            onHeaderCell={refHdr} />
        ))}
        <Table.Column title="Thao tác" key="actions" width={100} align="center"
          render={() => <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>}
          onHeaderCell={refHdr} />
      </Table>
      <div style={{ margin: '0 12px' }}>
        <Pagination total={dataSource.length} current={cur} pageSize={SCADA_TAB_PAGE_SIZE} pageSizeOptions={[10, 20, 50]} onChange={setPage} />
      </div>
    </div>
  );
}

/* Tab File đính kèm (Tạo mới/Cập nhật) — format theo chuẩn Port: label + nút Thêm file,
   empty state, danh sách file cục bộ (upload thực hiện lúc submit) */
function ScadaFilesTab({ uploadFileList, setUploadFileList, entityId }: { uploadFileList: any[]; setUploadFileList: React.Dispatch<React.SetStateAction<any[]>>; entityId?: string }) {
  const beforeUpload = (file: RcFile): boolean => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    if (uploadFileList.length >= 10) { toast.error('Tối đa 10 file'); return false; }
    setUploadFileList([...uploadFileList, { uid: `${Date.now()}`, name: file.name, status: 'done' as const, originFileObj: file }]);
    return false;
  };
  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
        {uploadFileList.length > 0 && (
          <Upload
            beforeUpload={beforeUpload}
            showUploadList={false}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
            multiple
          >
            <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>
              Thêm file
            </Button>
          </Upload>
        )}
      </div>
      {uploadFileList.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
            Chưa có file đính kèm.
          </span>
          <Upload
            beforeUpload={beforeUpload}
            showUploadList={false}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
            multiple
          >
            <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>
              Chọn file
            </Button>
          </Upload>
        </div>
      ) : (
        <Table
          size="small"
          dataSource={uploadFileList.map((f, i) => ({ ...f, _idx: i, key: i, __stt: i + 1 }))}
          rowKey={(_, i) => (i ?? 0)}
          pagination={{ pageSize: 10, hideOnSinglePage: true, showTotal: (t) => `Tổng cộng ${t}` }}
          scroll={{ x: 'max-content' }}
        >
          <Table.Column
            title="STT"
            key="stt"
            dataIndex="__stt"
            width={60}
            align="center"
            render={(v: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{v}</span>}
            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })}
          />
          <Table.Column
            title="Tên file"
            key="name"
            dataIndex="name"
            render={(name: string) => (
              <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
                <FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />
                {name}
              </span>
            )}
            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })}
          />
          <Table.Column
            title=""
            key="actions"
            width={44}
            align="center"
            render={(_: any, record: any) => (
              <Button type="link" danger size="small" icon={<DeleteOutlined />}
                onClick={() => {
                  const uid = record.uid;
                  if (entityId && typeof uid === 'string' && uid.includes('-')) {
                    void deleteScadaAttachment(entityId, uid).catch(() => { /* ignore */ });
                  }
                  setUploadFileList(uploadFileList.filter((_, idx) => idx !== record._idx));
                }} />
            )}
            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })}
          />
        </Table>
      )}
      <div style={{ marginTop: spaceSm }}>
        <span style={uploadHintStyle}>
          Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.
        </span>
      </div>
    </div>
  );
}

const textAreaStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  resize: 'none' as const,
  padding: '12px 16px',
  fontFamily: fontSans,
};

const tableValueStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
};

const tableMetaStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
};

export const btnStyle: React.CSSProperties = {
  ...pillStyle,
  fontWeight: fontWeightMedium,
};

// ── Build Collapse items for Detail Modal (aligned with PortDetailPage) ──

export function buildScadaCollapseItems(
  rec: ScadaResponse,
): Array<{ key: string; label: string; children: React.ReactNode }> {
  const items: Array<{ key: string; label: string; children: React.ReactNode }> = [];

  // 1. Thông tin chung
  items.push({
    key: 'general',
    label: '1. Thông tin chung',
    children: (
      <Row gutter={[spaceMd, 0]}>
        <DetailInfoRow
          label="Mã thiết bị"
          value={<Tag color={colors.primary} style={{ borderRadius: radiusPill, margin: 0 }}>{rec.deviceCode}</Tag>}
        />
        <DetailInfoRow label="Tên thiết bị" value={rec.deviceName} />
        <DetailInfoRow label="Model" value={rec.model || '—'} />
        <DetailInfoRow label="Hãng sản xuất" value={rec.manufacturer || '—'} />
        <DetailInfoRow label="Số lượng" value={<span style={{ color: textPrimary, fontSize: fontSizeMd }}>{fmtNum(rec.quantity)}</span>} />
        <DetailInfoRow label="Đơn vị tính" value={formatUnitOfMeasure(rec.unitOfMeasure)} />
        <DetailInfoRow label="Đơn vị quản lý" value={rec.orgUnitName || '—'} />
        <DetailInfoRow label="Đơn vị khai thác" value={rec.operatingUnitName || '—'} />
        <DetailInfoRow label="Thuộc TTDH VTS / Trạm Radar" full value={rec.attachedInfrastructureName || '—'} />
        <DetailInfoRow label="Tỉnh / Thành phố" value={rec.provinceName || '—'} />
        <DetailInfoRow label="Địa điểm chi tiết" full value={rec.detailedLocation || '—'} />
        <DetailInfoRow label="Năm đưa vào sử dụng" value={rec.yearOfUse ? String(rec.yearOfUse) : '—'} />
      </Row>
    ),
  });

  // 2. Thông số kỹ thuật
  items.push({
    key: 'technical',
    label: '2. Thông số kỹ thuật',
    children: (
      <Row gutter={[spaceMd, 0]}>
        <DetailInfoRow
          label="Thông số kỹ thuật"
          value={rec.specifications || '—'}
        />
        <DetailInfoRow
          label="Thông tin bảo trì"
          value={rec.maintenanceInformation || '—'}
        />
        <DetailInfoRow
          label="Ghi chú"
          value={rec.note || '—'}
        />
      </Row>
    ),
  });

  // 3. GIS
  items.push({
    key: 'gis',
    label: '3. GIS',
    children: (
      <Row gutter={[spaceMd, 0]}>
        <DetailInfoRow
          label="Thuộc loại hạ tầng"
          value={rec.attachedInfrastructureName || '—'}
        />
        <DetailInfoRow
          label="Biểu tượng"
          value={rec.mapSymbolName || '—'}
        />
        <DetailInfoRow
          label="Hệ quy chiếu"
          value={rec.coordinateSystem != null ? String(rec.coordinateSystem) : '—'}
        />
        <DetailInfoRow
          label="Quy tắc hiển thị"
          value={rec.displayRule != null ? String(rec.displayRule) : '—'}
        />
      </Row>
    ),
  });

  // 4. Tọa độ
  const coordList = (rec as any).coordinateList as Array<{ latitude: number; longitude: number }> | undefined;
  items.push({
    key: 'coordinates',
    label: '4. Tọa độ',
    children: coordList && coordList.length > 0 ? (
      <div>
        <div style={{ color: textPrimary, fontSize: fontSizeSm, marginBottom: spaceSm }}>
          {coordList.length} điểm tọa độ
        </div>
      </div>
    ) : (
      <EmptyState description="Chưa có dữ liệu tọa độ" />
    ),
  });

  // 5. Hồ sơ (metadata)
  items.push({
    key: 'metadata',
    label: '5. Hồ sơ',
    children: (
      <Row gutter={[spaceMd, 0]}>
        <DetailInfoRow label="Người tạo" value={rec.createdByName || '—'} />
        <DetailInfoRow label="Ngày tạo" value={rec.createdAt ? formatDate(rec.createdAt) : '—'} />
        <DetailInfoRow label="Người cập nhật" value={rec.updatedByName || '—'} />
        <DetailInfoRow label="Ngày cập nhật" value={rec.updatedAt ? formatDate(rec.updatedAt) : '—'} />
      </Row>
    ),
  });

  // 6. Ghi chú
  items.push({
    key: 'notes',
    label: '6. Ghi chú',
    children: (
      <div
        style={{
          background: surfaceCard,
          border: `0.5px solid ${borderDefault}`,
          borderRadius: radiusMd,
          padding: spaceMd,
          minHeight: 60,
          color: textPrimary,
          fontSize: fontSizeMd,
        }}
      >
        {rec.note || '—'}
      </div>
    ),
  });

  // 7. Trạng thái
  const opStatusBadge = rec.operationalStatus != null
    ? (rec.operationalStatus === 'NOT_YET_OPERATIONAL' ? { color: 'orange', label: 'Chưa khai thác/vận hành' }
      : rec.operationalStatus === 'OPERATIONAL' ? { color: 'green', label: 'Đang khai thác/vận hành' }
      : rec.operationalStatus === 'SUSPENDED' ? { color: 'red', label: 'Dừng khai thác/vận hành' }
      : { color: textTertiary, label: String(rec.operationalStatus) })
    : { color: textTertiary, label: '—' };
  const appStatusBadge = rec.approvalStatus
    ? renderApprovalBadge(rec.approvalStatus)
    : <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>;
  items.push({
    key: 'status',
    label: '7. Trạng thái',
    children: (
      <Row gutter={[spaceMd, spaceMd]}>
        <Col xs={24} sm={12}>
          <Typography.Text style={fieldLabelStyle}>Tình trạng</Typography.Text>
          <div>{renderScadaStatusBadge(opStatusBadge)}</div>
        </Col>
        <Col xs={24} sm={12}>
          <Typography.Text style={fieldLabelStyle}>Phê duyệt</Typography.Text>
          <div>{appStatusBadge}</div>
        </Col>
      </Row>
    ),
  });

  return items;
}

const ScadaListPage = () => {
  const [searchParams] = useSearchParams();
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);
  const isIframeModal = window.parent !== window.self;
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [data, setData] = useState<ScadaResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "0", 10);
    return isNaN(p) || p < 0 ? 0 : p;
  });
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState({
    orgUnitId: "" as string,
    deviceName: "",
    deviceCode: "",
    operationalStatus: undefined as number | undefined,
    approvalStatus: "" as string,
    province: "" as string,
    vtsSystemId: "" as string,
    attachedInfraType: undefined as number | undefined,
    attachedInfraId: "" as string,
    yearOfUse: undefined as number | undefined,
    updatedFrom: "" as string,
    updatedTo: "" as string,
  });

  // Tab counts for approval status filter
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [totalAll, setTotalAll] = useState(0);
  const fetchTabCounts = useCallback(async () => {
    const statuses = [
      { key: "DRAFT", status: "DRAFT" },
      { key: "PENDING_APPROVAL", status: "PENDING_APPROVAL" },
      { key: "APPROVED_LEVEL1", status: "APPROVED_LEVEL1" },
      { key: "APPROVED", status: "APPROVED" },
      { key: "REJECTED_LEVEL1", status: "REJECTED_LEVEL1" },
      { key: "REJECTED_LEVEL2", status: "REJECTED_LEVEL2" },
    ];
    const results = await Promise.allSettled(
      statuses.map((s) =>
        fetchScadaList({
          page: 0,
          size: 1,
          orgUnitId: filterValues.orgUnitId || undefined,
          approvalStatus: s.status,
        })
      )
    );
    const counts: Record<string, number> = {};
    results.forEach((r, i) => {
      counts[statuses[i].key] = r.status === "fulfilled" ? (r.value?.totalElements ?? 0) : 0;
    });
    setTabCounts(counts);
    // Tất cả = Lưu tạm + Chờ Cảng vụ + Chờ Cục + Đã duyệt + Từ chối (Cảng vụ trả về + Cục trả về)
    setTotalAll(
      counts.DRAFT +
        counts.PENDING_APPROVAL +
        counts.APPROVED_LEVEL1 +
        counts.APPROVED +
        counts.REJECTED_LEVEL1 +
        counts.REJECTED_LEVEL2
    );
  }, [filterValues.orgUnitId]);

  // Org units — danh sách đã được backend lọc theo phạm vi phân quyền
  // (GET /common/options/org-units), hiển thị thẳng như màn /vts-system.
  const [orgUnits, setOrgUnits] = useState<{ id: string; name: string; parentId?: string; children?: { id: string; name: string }[] }[]>([]);
  const orgUnitOptions = orgUnits;
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Symbols
  const [symbols, setSymbols] = useState<MapSymbolType[]>([]);
  const [, setLoadingSymbols] = useState(false);

  // Year options for "Năm đưa vào sử dụng" (current year - 30 to current year)
  const yearOfUseOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 31 }, (_, i) => ({
      label: String(currentYear - i),
      value: currentYear - i,
    }));
  }, []);

  // Attached infrastructure type options
  const attachedInfraTypeOptions = [
    { label: 'Trung Tâm Điều Hành VTS', value: 1 },
    { label: 'Trạm Radar', value: 2 },
  ];

  // Radar station options for dependent dropdown
  const [radarStationOptions, setRadarStationOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingRadars, setLoadingRadars] = useState(false);

  const fetchRadarStations = useCallback(async () => {
    setLoadingRadars(true);
    try {
      const res = await api.get("/common/options/radar-stations");
      const items = res.data?.data;
      setRadarStationOptions(
        (Array.isArray(items) ? items : []).map((s: { id: string; stationName?: string; code?: string }) => ({
          label: s.stationName || s.code || s.id,
          value: s.id,
        }))
      );
    } catch (error) {
      console.error("Lỗi tải danh sách trạm Radar:", error);
      setRadarStationOptions([]);
    } finally {
      setLoadingRadars(false);
    }
  }, []);

  useEffect(() => {
    fetchRadarStations();
  }, [fetchRadarStations]);

  // VTS Operation Center options for dependent dropdown (Thuộc TTDH VTS — loại 1)
  const [vtsOperationCenterOptions, setVtsOperationCenterOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingVtsCenters, setLoadingVtsCenters] = useState(false);

  const fetchVtsOperationCenters = useCallback(async () => {
    setLoadingVtsCenters(true);
    try {
      const res = await api.get("/common/options/vts-operation-centers");
      const items = res.data?.data;
      setVtsOperationCenterOptions(
        (Array.isArray(items) ? items : []).map((s: { id: string; name?: string; code?: string }) => ({
          label: s.name || s.code || s.id,
          value: s.id,
        }))
      );
    } catch (error) {
      console.error("Lỗi tải danh sách Trung tâm điều hành VTS:", error);
      setVtsOperationCenterOptions([]);
    } finally {
      setLoadingVtsCenters(false);
    }
  }, []);

  useEffect(() => {
    fetchVtsOperationCenters();
  }, [fetchVtsOperationCenters]);

  // Đơn vị khai thác — từ bảng operating_organizations (endpoint chung)
  const [operatingOrganizationOptions, setOperatingOrganizationOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingOperatingOrgs, setLoadingOperatingOrgs] = useState(false);

  const fetchOperatingOrganizations = useCallback(async () => {
    setLoadingOperatingOrgs(true);
    try {
      const res = await api.get("/common/options/operating-organizations");
      const items = res.data?.data;
      const list: Array<{ id: string; name?: string; code?: string }> =
        Array.isArray(items) && items.length > 0 ? items : DEFAULT_OPERATING_ORGANIZATIONS;
      setOperatingOrganizationOptions(
        list.map((s) => ({ label: s.name || s.code || s.id, value: s.id }))
      );
    } catch (error) {
      console.error("Lỗi tải danh sách đơn vị khai thác:", error);
      setOperatingOrganizationOptions(
        DEFAULT_OPERATING_ORGANIZATIONS.map((s) => ({ label: s.name, value: s.id }))
      );
    } finally {
      setLoadingOperatingOrgs(false);
    }
  }, []);

  useEffect(() => {
    fetchOperatingOrganizations();
  }, [fetchOperatingOrganizations]);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ScadaResponse | null>(
    null
  );

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<ScadaResponse | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ScadaResponse | null>(null);
  const [rejectForm] = Form.useForm();
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ScadaResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);
  const [deviceCodeLoading, setDeviceCodeLoading] = useState(false);
  // Hành động footer create (chuẩn VTS): Lưu tạm / Lưu và gửi phê duyệt / Lưu và phê duyệt
  const [createActionType, setCreateActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const createActionTypeRef = useRef<'draft' | 'submit' | 'approve'>('draft');

  // Reactive watch for attached infrastructure dropdown
  const createAttachedType = Form.useWatch('attachedInfrastructureType', createForm);
  const createGeometryType = Form.useWatch('geometryType', createForm);

  // GPS coordinates for create drawer
  const [gpsCoordList, setGpsCoordList] = useState<Array<{ lat: number; lng: number }>>([]);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);

  // Update modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<ScadaResponse | null>(null);
  const [updateForm] = Form.useForm();
  const [updateLoading, setUpdateLoading] = useState(false);
  // Hành động footer update (chuẩn VTS): Lưu tạm / Lưu và gửi phê duyệt / Lưu và phê duyệt
  const [updateActionType, setUpdateActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const updateActionTypeRef = useRef<'draft' | 'submit' | 'approve'>('draft');

  // "Lưu và phê duyệt" chỉ dành cho tài khoản có quyền duyệt cấp Cục (chuẩn VTS).
  const canSaveAndApprove = !!hasPerm?.("scada:approvec2");

  // Reactive watch for attached infrastructure dropdown
  const updateAttachedType = Form.useWatch('attachedInfrastructureType', updateForm);
  const updateGeometryType = Form.useWatch('geometryType', updateForm);

  // GPS coordinates for edit drawer
  const [updateGpsCoordList, setUpdateGpsCoordList] = useState<Array<{ lat: number; lng: number }>>([]);

  // GEOMETRY_POINT_COUNT mapping (same as Port)
  const GEOMETRY_POINT_COUNT = useMemo(() => ({ POINT: 1, LINE: 2, POLYGON: 3 }), []);

  // Auto-fill Hệ quy chiếu + Quy tắc hiển thị + GPS khi chọn Loại đối tượng (giống /pier)
  useEffect(() => {
    if (!createGeometryType) {
      createForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      setGpsCoordList([]);
      return;
    }
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    const count = GEOMETRY_POINT_COUNT[createGeometryType as keyof typeof GEOMETRY_POINT_COUNT] ?? 0;
    setGpsCoordList(Array.from({ length: count }, () => ({ lat: 0, lng: 0 })));
  }, [createGeometryType, GEOMETRY_POINT_COUNT, createForm]);

  // Chỉ reset Hệ quy chiếu/Quy tắc hiển thị khi NGƯỜI DÙNG xóa lựa chọn Loại đối tượng,
  // không reset khi mở modal edit (ScadaResponse không trả geometryType → watch luôn undefined khi mở)
  const prevUpdateGeometryType = useRef<string | null>(null);
  useEffect(() => {
    const hadSelection = prevUpdateGeometryType.current != null;
    prevUpdateGeometryType.current = (updateGeometryType as string | null) ?? null;
    if (!updateGeometryType) {
      setUpdateGpsCoordList([]);
      if (hadSelection) {
        updateForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      }
      return;
    }
    updateForm.setFieldsValue({ displayRule: 'Độ, phút, giây (DMS)' });
    if (updateForm.getFieldValue('coordinateSystem') == null) {
      updateForm.setFieldsValue({ coordinateSystem: 1 });
    }
    const count = GEOMETRY_POINT_COUNT[updateGeometryType as keyof typeof GEOMETRY_POINT_COUNT] ?? 1;
    setUpdateGpsCoordList((prev) => {
      if (prev.length >= count) return prev;
      const added = Array.from({ length: count - prev.length }, () => ({ lat: 0, lng: 0 }));
      return [...prev, ...added];
    });
  }, [updateGeometryType, GEOMETRY_POINT_COUNT, updateForm]);

  // Submissions
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitContent, setSubmitContent] = useState("");
  const [submittingRecord, setSubmittingRecord] = useState<ScadaResponse | null>(
    null
  );
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── History state ─────────────────────────────────────────────────────
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyEntityName, setHistoryEntityName] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyReloadToken, setHistoryReloadToken] = useState(0);

  // ── History map helpers ────────────────────────────────────────
  const symbolMap = useMemo(() => {
    const m = new Map<string, string>();
    (symbols || []).forEach((s) => m.set(s.id, s.name || s.id));
    return m;
  }, [symbols]);

  const symbolImageMap = useMemo(() => {
    const m = new Map<string, string>();
    (symbols || []).forEach((s) => {
      if (s.image) m.set(s.id, s.image);
    });
    return m;
  }, [symbols]);

  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    const build = (items: Array<{ id: string; name: string; parentId?: string; children?: Array<{ id: string; name: string }> }>) => {
      for (const item of items) {
        m.set(item.id, item.name || item.id);
        if (item.children) build(item.children);
      }
    };
    build(orgUnits || []);
    return m;
  }, [orgUnits]);

  // Sorting
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const handleSort = useCallback((field: string, order: "asc" | "desc") => {
    setSortField(field);
    setSortOrder(order === "asc" ? "ascend" : "descend");
    setPage(0);
  }, []);

  const columns = useMemo(
    () => {
      // Cột dạng "Cán bộ/Ngày": dòng 1 = tên (đậm), dòng 2 = ngày (màu phụ)
      const renderInfoStack = (name: string | null | undefined, date: string | null | undefined) => (
        <div style={{ lineHeight: "1.35", overflow: "hidden" }}>
          <div
            title={name || "—"}
            style={{ fontWeight: fontWeightBold, color: "#0F172A", fontSize: fontSizeMd, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {name || "—"}
          </div>
          <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: "nowrap" }}>
            {date ? dayjs(date).format("DD/MM/YYYY HH:mm:ss") : "—"}
          </div>
        </div>
      );
      return [
      {
        key: "index",
        label: "STT",
        width: 60,
        type: "mono" as const,
        align: "center" as const,
        fixed: "left" as const,
        render: (_: unknown, __: ScadaResponse, index: number) => (
          <span style={{ ...tableMetaStyle, fontWeight: fontWeightMedium }}>
            {page * pageSize + index + 1}
          </span>
        ),
      },
      {
        key: "deviceName",
        label: "Tên/Mã thiết bị",
        dataIndex: "deviceName",
        width: 300,
        fixed: "left" as const,
        sortable: true,
        sortOrder: sortField === "deviceName" ? sortOrder : null,
        ellipsis: false,
        render: (val: string, record: ScadaResponse) => (
          <div style={{ minWidth: 0 }}>
            <button
              type="button"
              onClick={() => {
                setSelectedRecord(record);
                setDetailDrawerOpen(true);
              }}
              style={{ background: "none", border: "none", padding: 0, textAlign: "left", font: "inherit", fontWeight: fontWeightBold, color: actionPrimary, cursor: "pointer", display: "block", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              title={val || "—"}
            >
              {val || "—"}
            </button>
            <span style={{ opacity: 0.85, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.deviceCode || "—"}</span>
          </div>
        ),
      },
      {
        key: "orgUnitName",
        label: "Đơn vị quản lý",
        dataIndex: "orgUnitName",
        width: 260,
        render: (val: string) => (
          <span style={{ ...tableMetaStyle, fontWeight: fontWeightBold }}>{val || "—"}</span>
        ),
      },
      {
        key: "vtsSystemName",
        label: "Thuộc TTDH VTS/Trạm Radar",
        dataIndex: "attachedInfrastructureName",
        width: 280,
        render: (val: string) => (
          <span style={tableMetaStyle}>{val || "—"}</span>
        ),
      },
      {
        key: "operatingUnitName",
        label: "Đơn vị khai thác",
        dataIndex: "operatingUnitName",
        width: 260,
        render: (val: string) => (
          <span style={tableMetaStyle}>{val || "—"}</span>
        ),
      },
      {
        key: "provinceName",
        label: "Địa điểm\n(Tỉnh/Thành phố)",
        dataIndex: "provinceName",
        width: 220,
        ellipsis: false,
        render: (val: string) => (
          <span style={tableMetaStyle}>{val || "—"}</span>
        ),
      },
      {
        key: "unitOfMeasure",
        label: "Đơn vị tính",
        dataIndex: "unitOfMeasure",
        width: 130,
        render: (val: number) => (
          <span style={tableMetaStyle}>{formatUnitOfMeasure(val)}</span>
        ),
      },
      {
        key: "quantity",
        label: "Số lượng",
        dataIndex: "quantity",
        width: 110,
        type: "number" as const,
        align: "center" as const,
        render: (val: number) => (
          <span style={{ ...tableValueStyle, fontWeight: fontWeightMedium }}>
            {fmtNum(val)}
          </span>
        ),
      },
      {
        key: "yearOfUse",
        label: "Năm đưa vào sử dụng",
        dataIndex: "yearOfUse",
        width: 200,
        type: "mono" as const,
        align: "center" as const,
        ellipsis: false,
        render: (val: number) => (
          <span style={tableMetaStyle}>{val || "—"}</span>
        ),
      },
      {
        key: "updatedByName",
        label: "Cán bộ cập nhật",
        dataIndex: "updatedByName",
        width: 200,
        sortable: true,
        sortOrder: sortField === "updatedAt" || sortField === "updatedByName" ? sortOrder : null,
        render: (_: unknown, record: ScadaResponse) => renderInfoStack(record.updatedByName, record.updatedAt),
      },
      {
        key: "submittedInfo",
        label: "Cán bộ gửi phê duyệt",
        dataIndex: "submittedByName",
        width: 200,
        render: (_: unknown, record: ScadaResponse) => renderInfoStack(record.submittedByName, record.submittedDate),
      },
      {
        key: "approvedLevel1Info",
        label: "Cán bộ phê duyệt cấp Cảng vụ/Chi cục",
        dataIndex: "approverLevel1Name",
        width: 200,
        render: (_: unknown, record: ScadaResponse) => renderInfoStack(record.approverLevel1Name, record.approvedDateLevel1),
      },
      {
        key: "approvedLevel2Info",
        label: "Cán bộ phê duyệt cấp Cục",
        dataIndex: "approverLevel2Name",
        width: 200,
        render: (_: unknown, record: ScadaResponse) => renderInfoStack(record.approverLevel2Name, record.approvedDateLevel2),
      },
      {
        key: "operationalStatus",
        label: "Tình trạng",
        dataIndex: "operationalStatus",
        width: 270,
        type: "status" as const,
        render: (val: number | string) => {
          const map: Record<string, { color: string; label: string }> = {
            "NOT_YET_OPERATIONAL": { color: statusAttention, label: "Chưa khai thác/vận hành" },
            "OPERATIONAL": { color: statusOperational, label: "Đang khai thác/vận hành" },
            "SUSPENDED": { color: statusCritical, label: "Dừng khai thác/vận hành" },
          };
          const s = map[String(val || "").toUpperCase()] || {
            color: textTertiary,
            label: String(val || "—"),
          };
          return (
            <span style={statusBadgeStyle(s.color)}>
              {s.label}
            </span>
          );
        },
      },
      {
        key: "approvalStatus",
        label: "Trạng thái",
        dataIndex: "approvalStatus",
        width: 180,
        type: "status" as const,
        render: (val: string) => renderApprovalBadge(val),
      },
    ];
    },
    [page, pageSize, sortField, sortOrder]
  );

  // ── History helpers ────────────────────────────────────────────────
  const historyFieldLabels: Record<string, string> = {
    deviceCode: 'Mã thiết bị',
    deviceName: 'Tên thiết bị',
    manufacturer: 'Hãng sản xuất',
    model: 'Model',
    quantity: 'Số lượng',
    orgUnitId: 'Đơn vị quản lý',
    operatingUnitId: 'Đơn vị khai thác',
    provinceName: 'Tỉnh/Thành phố',
    detailedLocation: 'Địa điểm chi tiết',
    attachedInfrastructureType: 'Loại hạ tầng',
    attachedInfrastructureId: 'Thuộc hạ tầng',
    unitOfMeasure: 'Đơn vị tính',
    yearOfUse: 'Năm đưa vào sử dụng',
    operationalStatus: 'Trạng thái hoạt động',
    approvalStatus: 'Trạng thái phê duyệt',
    specifications: 'Thông số kỹ thuật',
    maintenanceInformation: 'Thông tin bảo trì',
    note: 'Ghi chú',
    objectType: 'Loại đối tượng',
    mapSymbolId: 'Biểu tượng',
    coordinateSystem: 'Hệ quy chiếu',
    displayRule: 'Quy tắc hiển thị',
    'Lý do từ chối': 'Lý do từ chối',
    'Trạng thái': 'Hành động',
  };

  function historyFieldName(fn: string): string {
    return historyFieldLabels[fn] || fn;
  }

  function historyFieldValue(
    fn: string,
    val: string | null,
    orgMap?: Map<string, string>,
    symbolMap?: Map<string, string>
  ): string {
    if (!val || val === '(null)' || val === 'null') return '(trống)';
    if (fn === 'orgUnitId' && orgMap) {
      const full = orgMap.get(val);
      return full ? full.split(' - ').pop() || full : val;
    }
    if (fn === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || val;
    if (fn === 'approvalStatus') {
      const m: Record<string, string> = {
        DRAFT: 'Nháp',
        PROPOSED: 'Đề xuất',
        PENDING: 'Chờ duyệt',
        CHO_PHE_DUYET: 'Chờ phê duyệt',
        PENDING_APPROVAL: 'Chờ phê duyệt',
        APPROVED: 'Đã phê duyệt',
        DA_PHE_DUYET: 'Đã phê duyệt',
        REJECTED: 'Từ chối',
        TU_CHOI: 'Từ chối',
      };
      return m[val] || m[val?.toUpperCase()] || val;
    }
    if (fn === 'operationalStatus') {
      const m: Record<string, string> = {
        '0': 'Chưa khai thác/vận hành',
        '1': 'Đang khai thác/vận hành',
        '2': 'Dừng khai thác/vận hành',
    NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
    OPERATIONAL: 'Đang khai thác/vận hành',
    SUSPENDED: 'Dừng khai thác/vận hành',
      };
      return m[val] || val;
    }
    if (fn === 'unitOfMeasure') {
      return formatUnitOfMeasure(Number(val));
    }
    if (fn === 'coordinateSystem') {
      const m: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
      return m[String(val)] || val;
    }
    if (fn === 'changedAt' || fn === 'createdAt') {
      try { return dayjs(val).format('DD/MM/YYYY HH:mm:ss'); } catch { return val; }
    }
    return val;
  }

  const HISTORY_PAGE_SIZE = 20;

  const historyTimestamp = (item: any): string =>
    item.approvedDate || item.changedAt || item.createdAt || '';

  const historyField = (item: any): string =>
    item.changedField || item.fieldName || '';

  const historyOldValue = (item: any): string | null =>
    item.previousValue ?? item.oldValue ?? null;

  const historyNewValue = (item: any): string | null =>
    item.newValue ?? null;

  const historyActor = (item: any): string => {
    const raw = item?.approvedBy || item?.changedBy || '';
    return raw || '—';
  };

  const resolveHistoryActionMeta = (item: any): { label: string; color: string } => {
    const rawStatus = String(item?.status ?? item?.action ?? '').toUpperCase();
    const rawReason = String(item?.reason ?? '').toLowerCase();
    const rawField = String(item?.changedField ?? item?.fieldName ?? '').toLowerCase();
    if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
      return { label: 'Thêm mới', color: statusOperational };
    }
    if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || (rawField.includes('đính kèm') && rawReason.includes('tải'))) {
      return { label: 'Tải lên tệp', color: '#0284c7' };
    }
    if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xoa tai lieu') || rawReason.includes('xóa tệp')) {
      return { label: 'Xóa tệp', color: '#ea580c' };
    }
    if (rawStatus === 'APPROVED' || rawStatus === 'APPROVED_LEVEL2') {
      return { label: 'Phê duyệt', color: statusOperational };
    }
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT') {
      return { label: 'Từ chối', color: '#E34948' };
    }
    if (rawStatus === 'PROPOSED' || rawStatus === 'PENDING_APPROVAL' || rawReason.includes('gửi phê duyệt') || rawReason.includes('gui phe duyet')) {
      return { label: 'Gửi phê duyệt', color: '#EDA100' };
    }
    return { label: 'Chỉnh sửa', color: actionPrimary };
  };

  useEffect(() => {
    if (!historyModalVisible || !selectedRecord) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingHistory(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      setHistoryPage(0);
      try {
        const history = await fetchScadaHistory(selectedRecord.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historySearch,
          fromDate: historyDateFrom,
          toDate: historyDateTo,
        });
        if (cancelled) return;
        const items = history || [];
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch {
        if (!cancelled) toast.error('Không thể tải lịch sử');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }, historySearch.trim() ? 300 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [historyModalVisible, selectedRecord?.id, historySearch, historyDateFrom, historyDateTo, historyReloadToken]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await fetchScadaHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historySearch,
        fromDate: historyDateFrom,
        toDate: historyDateTo,
      });
      if (history && history.length > 0) {
        setHistoryRecords((prev) => [...prev, ...history]);
      }
      setHistoryPage(nextPage);
      setHasMoreHistory((history || []).length === HISTORY_PAGE_SIZE);
    } catch {
      /* ignore */
    } finally {
      setLoadingMoreHistory(false);
    }
  };

  const handleHistoryScroll = (e: any) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      loadMoreHistory();
    }
  };

  const HISTORY_FIELD_ORDER = [
    'orgUnitId', 'deviceCode', 'deviceName', 'manufacturer', 'model',
    'quantity', 'operatingUnitId', 'provinceName', 'detailedLocation',
    'attachedInfrastructureType', 'attachedInfrastructureId',
    'unitOfMeasure', 'yearOfUse', 'operationalStatus',
    'specifications', 'maintenanceInformation', 'note',
    'objectType', 'mapSymbolId', 'coordinateSystem', 'displayRule',
  ];

  const historyFieldCount = useMemo(() => historyRecords.length, [historyRecords]);

  const renderScadaHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort(
      (a: any, b: any) =>
        new Date(historyTimestamp(b) || 0).getTime() -
        new Date(historyTimestamp(a) || 0).getTime()
    );
    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];

    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === historyActor(r) && prev.status === r.status && prev.approvalLevel === r.approvalLevel)
        prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor: historyActor(r), status: r.status, approvalLevel: r.approvalLevel, items: [r] });
    }

    if (groups.length === 0)
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
        </div>
      );

    const fmtTime = (ts: string) => {
      const d = new Date(ts);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };

    return (
      <div>
        {groups.map((g, gi) => {
          const rec0 = g.items[0] || {};
          const orgId = rec0.orgUnitId || selectedRecord?.orgUnitId;
          const orgName = orgId ? orgMap.get(orgId) : undefined;
          const unitName =
            rec0.orgUnitName ||
            (orgName ? orgName.split(' - ').pop() || orgName : undefined) ||
            rec0.unitName ||
            selectedRecord?.orgUnitName ||
            '—';
          const barColor = actionPrimary;
          const changes = g.items.map((item: any) => ({
            field: historyField(item) || '—',
            oldValue: historyOldValue(item),
            newValue: historyNewValue(item),
          }));
          const actionMeta = resolveHistoryActionMeta(g.items[0] || {});
          const isCreate = changes.every(
            (c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === ''
          );
          const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
          const orderedChanges = [...changes]
            .sort((a: any, b: any) => {
              const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
              const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
              return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
            })
            .filter(
              (c: any) => c.field !== 'infrastructureList' && c.field !== 'attachments'
            );

          const formatHistoryValue = (fn: string, raw: string | null) => {
            if (raw === null || raw === '(null)' || raw === '') return null;
            const t = raw.trim();
            if (t.startsWith('[') && t.endsWith(']')) {
              if (t === '[]') return 'Không có';
              const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
              return `${parts.length} công trình hạ tầng`;
            }
            if (/^-?\d+(\.\d+)?$/.test(t)) {
              const n = Number(t);
              return Number.isInteger(n) ? String(n) : t;
            }
            return historyFieldValue(fn, raw, orgMap, symbolMap);
          };

          if (orderedChanges.length === 0) return null;

          return (
            <div
              key={gi}
              style={{
                ...historyGroupGridStyle,
                marginBottom: gi < groups.length - 1 ? spaceSm : 0,
              }}
            >
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                  <Typography.Text style={historyTimeStyle}>{g.ts ? fmtTime(g.ts) : '—'}</Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span style={historyBadgeStyle(actionMeta.color)}>{actionMeta.label}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                  <Typography.Text style={historyMetaRowStyle}>
                    Người cập nhật: {g.actor || '—'}
                  </Typography.Text>
                  <Typography.Text style={historyMetaRowStyle}>
                    Đơn vị: {unitName}
                  </Typography.Text>
                </div>
              </div>
              <div style={historyInfoCardStyle}>
                <div style={historyAccentBarStyle(barColor)} />
                <Typography.Text style={historyInfoTitleStyle}>{informationTitle}</Typography.Text>
                {orderedChanges.length > 0 ? (
                  <div>
                    {orderedChanges.map((change, ri: number) => {
                      const fn = change.field;
                      const ov = formatHistoryValue(fn, change.oldValue);
                      const nv = formatHistoryValue(fn, change.newValue);
                      const renderCell = (rawVal: string | null) => {
                        if (fn === 'mapSymbolId' && rawVal && rawVal !== '(null)') {
                          const img = symbolImageMap.get(rawVal);
                          const name = symbolMap.get(rawVal) || rawVal;
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }}
                                />
                              ) : null}
                              {name}
                            </span>
                          );
                        }
                        return null;
                      };
                      return isCreate ? (
                        <div
                          key={`${fn}-${ri}`}
                          style={{
                            ...historyCreateRowStyle,
                            paddingTop: ri > 0 ? spaceXs : 0,
                          }}
                        >
                          <div style={historyFieldLabelStyle}>
                            {fn ? `${historyFieldName(fn)}:` : '—'}
                          </div>
                          <span title={nv ?? '—'} style={historyNewValueStyle}>
                            {renderCell(change.newValue) ?? nv ?? '—'}
                          </span>
                        </div>
                      ) : (
                        <div
                          key={`${fn}-${ri}`}
                          style={{
                            ...historyChangeRowStyle,
                            paddingTop: ri > 0 ? spaceXs : 0,
                          }}
                        >
                          <div style={historyFieldLabelStyle}>
                            {fn ? `${historyFieldName(fn)}:` : '—'}
                          </div>
                          <span title={ov ?? '—'} style={historyOldValueStyle}>
                            {renderCell(change.oldValue) ?? ov ?? '—'}
                          </span>
                          <span style={historyArrowStyle}>→</span>
                          <span title={nv ?? '—'} style={historyNewValueStyle}>
                            {renderCell(change.newValue) ?? nv ?? '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>
                    Không có thông tin chi tiết
                  </Typography.Text>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── rowActions callback ──────────────────────────────────────────
  const rowActions = useCallback(
    (record: ScadaResponse) => {
      const actions: Array<{ key: string; label: string; icon?: React.ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void }> = [
        {
          key: "view",
          label: "Xem chi tiết",
          icon: icons.view,
          onClick: () => {
            setSelectedRecord(record);
            setDetailDrawerOpen(true);
          },
        },
        {
          key: "history",
          label: "Lịch sử",
          icon: icons.history,
          onClick: () => {
            setSelectedRecord(record);
            setHistoryEntityName(record.deviceName || '');
            setHistoryModalVisible(true);
            setHistoryRecords([]);
            setLoadingHistory(false);
            setLoadingMoreHistory(false);
            setHasMoreHistory(true);
            setHistorySearch('');
            setHistoryDateFrom('');
            setHistoryDateTo('');
            setHistoryPage(0);
          },
        },
      ];

      // Chỉnh sửa chỉ hiện với hồ sơ Lưu tạm (DRAFT) hoặc Đã duyệt (APPROVED) — chuẩn CHK
      if (record.approvalStatus === "DRAFT" || record.approvalStatus === "APPROVED") {
        actions.push({
          key: "edit",
          label: "Chỉnh sửa",
          icon: icons.edit,
          onClick: () => {
            setUpdateTarget(record);
            setUploadFileList([]);
            void fetchScadaAttachments(record.id).then((list: any[]) => {
              setUploadFileList(list.map((a: any) => ({ uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const })));
            }).catch(() => { /* ignore */ });
            // Convert operationalStatus từ string enum (backend @JsonValue) sang số (frontend dropdown)
            const safeRecord = {
              ...record,
              operationalStatus: record.operationalStatus != null
                ? (() => {
                    switch (record.operationalStatus) {
                      case "NOT_YET_OPERATIONAL": return 0;
                      case "OPERATIONAL": return 1;
                      case "SUSPENDED": return 2;
                      default: {
                        const num = Number(record.operationalStatus);
                        return num >= 0 && num <= 2 ? num : 1;
                      }
                    }
                  })()
                : null,
            };
            updateForm.setFieldsValue(safeRecord);
            setUpdateModalOpen(true);
          },
        });
      }

      // DRAFT / REJECTED_LEVEL1 / REJECTED_LEVEL2 + scada:update → Gửi phê duyệt (submitScada)
      if (
        hasPerm?.("scada:update") &&
        (record.approvalStatus === "DRAFT" ||
          record.approvalStatus === "REJECTED_LEVEL1" ||
          record.approvalStatus === "REJECTED_LEVEL2")
      ) {
        actions.push({
          key: "submit",
          label: "Gửi phê duyệt",
          icon: icons.submit,
          onClick: () => {
            setSubmittingRecord(record);
            setSubmitContent("");
            setSubmitModalOpen(true);
          },
        });
      }

      // PENDING_APPROVAL + scada:approvec1 → Phê duyệt / Từ chối cấp Cảng vụ (C1)
      // Nguyên tắc 4 mắt: người tạo không được tự duyệt hồ sơ do mình tạo (back-end chặn, FE disable).
      if (hasPerm?.("scada:approvec1") && record.approvalStatus === "PENDING_APPROVAL") {
        const isCreatorSelfApprove = Boolean(currentUser?.userId && record.createdBy === currentUser.userId);
        actions.push({
          key: "approveC1",
          label: isCreatorSelfApprove ? "Phê duyệt cấp Cảng vụ (không thể tự duyệt)" : "Phê duyệt cấp Cảng vụ",
          icon: icons.approve,
          disabled: isCreatorSelfApprove,
          onClick: () => {
            setApproveTarget(record);
            setApproveLevel("c1");
            setApproveModalOpen(true);
          },
        });
        actions.push({
          key: "rejectC1",
          label: isCreatorSelfApprove ? "Từ chối cấp Cảng vụ (không thể tự duyệt)" : "Từ chối cấp Cảng vụ",
          icon: icons.reject,
          danger: true,
          disabled: isCreatorSelfApprove,
          onClick: () => {
            setRejectTarget(record);
            setRejectLevel("c1");
            setRejectModalOpen(true);
          },
        });
      }

      // APPROVED_LEVEL1 + scada:approvec2 → Phê duyệt / Từ chối cấp Cục (C2)
      // Nguyên tắc 4 mắt: người đã phê duyệt C1 không được tự duyệt tiếp ở C2.
      if (hasPerm?.("scada:approvec2") && record.approvalStatus === "APPROVED_LEVEL1") {
        const isSelfApproval = Boolean(currentUser?.userId && record.approverLevel1 === currentUser.userId);
        actions.push({
          key: "approveC2",
          label: isSelfApproval ? "Phê duyệt cấp Cục (không thể tự duyệt)" : "Phê duyệt cấp Cục",
          icon: icons.approve,
          disabled: isSelfApproval,
          onClick: () => {
            setApproveTarget(record);
            setApproveLevel("c2");
            setApproveModalOpen(true);
          },
        });
        actions.push({
          key: "rejectC2",
          label: isSelfApproval ? "Từ chối cấp Cục (không thể tự duyệt)" : "Từ chối cấp Cục",
          icon: icons.reject,
          danger: true,
          disabled: isSelfApproval,
          onClick: () => {
            setRejectTarget(record);
            setRejectLevel("c2");
            setRejectModalOpen(true);
          },
        });
      }

      // Chỉ hồ sơ "Lưu tạm" mới được xóa (phê duyệt 2 cấp — như /vts-system)
      if (hasPerm?.("scada:delete") && record.approvalStatus === "DRAFT") {
        actions.push({
          key: "delete",
          label: "Xóa",
          icon: icons.delete,
          danger: true,
          onClick: () => {
            setDeleteConfirmText("");
            setDeleteTarget(record);
          },
        });
      }

      return actions;
    },
    [updateForm, hasPerm, currentUser]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const safePage = Math.max(page, 0);
      const safeSize = Math.max(1, Math.min(pageSize, 100));
      const result = await fetchScadaList({
        page: safePage,
        size: safeSize,
        orgUnitId: filterValues.orgUnitId || undefined,
        search: filterValues.deviceCode || filterValues.deviceName || undefined,
        deviceCode: filterValues.deviceCode || undefined,
        deviceName: filterValues.deviceName || undefined,
        operationalStatus: filterValues.operationalStatus != null ? filterValues.operationalStatus : undefined,
        approvalStatus: filterValues.approvalStatus || undefined,
        province: filterValues.province || undefined,
        vtsSystemId: filterValues.vtsSystemId || undefined,
        attachedInfraType: filterValues.attachedInfraType,
        attachedInfraId: filterValues.attachedInfraId || undefined,
        yearOfUse: filterValues.yearOfUse,
        updatedFrom: filterValues.updatedFrom || undefined,
        updatedTo: filterValues.updatedTo || undefined,
        sortBy: sortField || "updatedAt",
        sortOrder: sortOrder === "ascend" ? "asc" : "desc",
      });
      setData(result.content);
      setTotal(result.totalElements);
      setPage(result.number);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setIsError(message || "Lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterValues, sortField, sortOrder]);

  const fetchOrgUnits = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const res = await api.get("/common/options/org-units");
      const items = res.data?.data;
      const orgs = (Array.isArray(items) ? items : []).map((o: { id?: string; name?: string; code?: string; parentId?: string | null }) => ({
        id: String(o.id),
        name: o.name || "Đơn vị",
        code: o.code || undefined,
        parentId: o.parentId ? String(o.parentId) : undefined,
      }));
      setOrgUnits(orgs);
    } catch (error) {
      console.error("Lỗi tải danh sách đơn vị:", error);
    } finally {
      setLoadingOrgs(false);
    }
  }, []);

  const fetchSymbols = useCallback(async () => {
    setLoadingSymbols(true);
    try {
      const res = await api.get("/common/options/symbols");
      const items = res.data?.data;
      setSymbols((Array.isArray(items) ? items : []) as MapSymbolType[]);
    } catch (error) {
      console.error("Lỗi tải biểu tượng:", error);
    } finally {
      setLoadingSymbols(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchOrgUnits();
    fetchSymbols();
    fetchTabCounts();
  }, [fetchData, fetchOrgUnits, fetchSymbols, fetchTabCounts]);

  const handleFilterApply = useCallback(() => {
    // Validate khoảng ngày: Từ ngày không được lớn hơn Đến ngày (so sánh chuỗi ISO "YYYY-MM-DD HH:mm:ss")
    if (filterValues.updatedFrom && filterValues.updatedTo && filterValues.updatedFrom > filterValues.updatedTo) {
      toast.error("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }
    setPage(0);
    fetchData();
  }, [fetchData, filterValues.updatedFrom, filterValues.updatedTo]);

  const handleFilterReset = useCallback(() => {
    setFilterValues({
      orgUnitId: "",
      deviceName: "",
      deviceCode: "",
      operationalStatus: undefined,
      approvalStatus: "",
      province: "",
      vtsSystemId: "",
      attachedInfraType: undefined,
      attachedInfraId: "",
      yearOfUse: undefined,
      updatedFrom: "",
      updatedTo: "",
    });
    setPage(0);
    fetchData();
  }, [fetchData]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    if (
      deleteConfirmText !== "XÓA" &&
      deleteConfirmText !== deleteTarget.deviceName
    ) {
      toast.error('Vui lòng nhập đúng tên thiết bị hoặc "XÓA" để xác nhận');
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteScada(deleteTarget.id);
      toast.success("Xóa hệ thống SCADA thành công");
      setDeleteTarget(null);
      setDeleteConfirmText("");
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[scada] delete error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, deleteConfirmText, fetchData, fetchTabCounts]);

  const handleApprove = useCallback(
    async (content: string) => {
      if (!approveTarget) return;
      setApproveLoading(true);
      try {
        const payload: ApprovalRequest = { decision: "APPROVED", reason: content };
        if (approveLevel === "c1") {
          await approveScadaC1(approveTarget.id, payload);
          toast.success("Phê duyệt cấp 1 thành công");
        } else {
          await approveScadaC2(approveTarget.id, payload);
          toast.success("Phê duyệt cấp 2 thành công");
        }
        setApproveTarget(null);
        setApproveModalOpen(false);
        fetchData();
        fetchTabCounts();
      } catch (error: unknown) {
        console.error("[scada] approve error", error); // toast toàn cục đã xử lý ở interceptor api.ts
      } finally {
        setApproveLoading(false);
      }
    },
    [approveTarget, approveLevel, fetchData, fetchTabCounts]
  );

  const handleReject = useCallback(async () => {
    if (!rejectTarget) return;
    let reason: string;
    try {
      ({ reason } = await rejectForm.validateFields());
    } catch {
      // Form rules đã hiển thị lỗi inline: lý do từ chối tối thiểu 10 ký tự
      return;
    }
    setRejectLoading(true);
    try {
      const payload: ApprovalRequest = { decision: "REJECTED", reason: String(reason || "").trim() };
      if (rejectLevel === "c1") await approveScadaC1(rejectTarget.id, payload);
      else await approveScadaC2(rejectTarget.id, payload);
      toast.success("Từ chối thành công");
      setRejectTarget(null);
      setRejectModalOpen(false);
      rejectForm.resetFields();
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[scada] reject error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setRejectLoading(false);
    }
  }, [rejectTarget, rejectLevel, rejectForm, fetchData, fetchTabCounts]);

  const handleCreate = useCallback(
    async (values: Record<string, unknown>) => {
      setCreateLoading(true);
      try {
        // Build WKT từ GPS state (lưu vào gis_spatial_objects qua spatial_id — chuẩn GIS dự án)
        const createGeomType = normalizeGeometryType(values.geometryType);
        const createWktType: EditableGeometryType =
          createGeomType === 'LINE' ? 'LineString' : createGeomType === 'POLYGON' ? 'Polygon' : 'Point';
        const coordinates = coordinateRowsToWkt(
          createWktType,
          gpsCoordList.map(c => ({ lng: c.lng, lat: c.lat }))
        );

        const payload = {
          ...values,
          deviceCode: values.deviceCode || (await generateScadaCode()),
          operationalStatus: values.operationalStatus ?? 1,
          geometryType: createGeomType,
          coordinates: coordinates ?? undefined,
          // Cột display_rule là INT; chuỗi 'Độ, phút, giây (DMS)' chỉ để hiển thị (giống /port, /pier)
          displayRule: values.displayRule != null ? Number(values.displayRule) || null : undefined,
        } as CreateScadaRequest;
        // Chuẩn VTS: tạo theo hành động footer — draft/submit/approve
        // (backend resolveCreateApprovalStatus: DRAFT / PENDING_APPROVAL / APPROVED)
        const currentAction = createActionTypeRef.current;
        const created = await createScada({
          ...payload,
          action: currentAction === 'draft' ? 'draft' : currentAction === 'submit' ? 'submit' : 'approve',
        });
        if (created?.id && uploadFileList.length > 0) {
          for (const f of uploadFileList) {
            if (f.originFileObj) await uploadScadaAttachment(created.id, f.originFileObj);
          }
        }
        toast.success(
          currentAction === 'draft'
            ? 'Lưu tạm hệ thống SCADA thành công'
            : currentAction === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : 'Lưu và phê duyệt thành công'
        );
        setCreateModalOpen(false);
        createForm.resetFields();
        setGpsCoordList([]);
        setUploadFileList([]);
        fetchData();
        fetchTabCounts();
      } catch (error: unknown) {
        console.error("[scada] create error", error); // toast toàn cục đã xử lý ở interceptor api.ts
      } finally {
        setCreateLoading(false);
      }
    },
    [createForm, fetchData, fetchTabCounts, gpsCoordList, uploadFileList]
  );

  const handleUpdate = useCallback(
    async (values: Record<string, unknown>) => {
      if (!updateTarget) return;
      setUpdateLoading(true);
      try {
        // Build WKT từ GPS state (lưu vào gis_spatial_objects qua spatial_id — chuẩn GIS dự án)
        const updateGeomType = normalizeGeometryType(updateGeometryType);
        const updateWktType: EditableGeometryType =
          updateGeomType === 'LINE' ? 'LineString' : updateGeomType === 'POLYGON' ? 'Polygon' : 'Point';
        const coordinates = coordinateRowsToWkt(
          updateWktType,
          updateGpsCoordList.map(c => ({ lng: c.lng, lat: c.lat }))
        );

        // Chuẩn VTS: Lưu tạm (chỉ update) / Lưu và gửi phê duyệt (update + submit) /
        // Lưu và phê duyệt (update + giữ Đã duyệt — T12 backend)
        const currentAction = updateActionTypeRef.current;
        await updateScada({
          id: updateTarget.id,
          ...values,
          geometryType: updateGeomType,
          coordinates: coordinates ?? undefined,
          // Cột display_rule là INT; chuỗi 'Độ, phút, giây (DMS)' chỉ để hiển thị (giống /port, /pier)
          displayRule: values.displayRule != null ? Number(values.displayRule) || null : undefined,
          ...(currentAction === 'approve' ? { approvalStatus: 'APPROVED' } : {}),
        });
        if (uploadFileList.length > 0) {
          for (const f of uploadFileList) {
            if (f.originFileObj) await uploadScadaAttachment(updateTarget.id, f.originFileObj);
          }
        }
        if (currentAction === 'submit') {
          await submitScada(updateTarget.id);
        }
        toast.success(
          currentAction === 'draft'
            ? 'Lưu tạm hệ thống SCADA thành công'
            : currentAction === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : 'Lưu và phê duyệt thành công'
        );
        setUpdateModalOpen(false);
        setUpdateTarget(null);
        setUpdateGpsCoordList([]);
        setUploadFileList([]);
        fetchData();
        fetchTabCounts();
      } catch (error: unknown) {
        console.error("[scada] update error", error); // toast toàn cục đã xử lý ở interceptor api.ts
      } finally {
        setUpdateLoading(false);
      }
    },
    [updateTarget, fetchData, fetchTabCounts, updateGpsCoordList, uploadFileList, updateGeometryType]
  );

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    setSubmitLoading(true);
    try {
      await submitScada(submittingRecord.id, submitContent.trim() || undefined);
      toast.success("Gửi phê duyệt thành công");
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      setSubmitContent("");
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[scada] submit error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setSubmitLoading(false);
    }
  }, [submittingRecord, submitContent, fetchData, fetchTabCounts]);

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[
          { label: "Trang chủ", path: "/" },
          { label: "Quản lý hệ thống SCADA", path: "/scada" },
        ]}
        actions={[
          hasPerm?.("scada:create")
            ? {
                key: "create",
                label: "Thêm mới",
                icon: icons.create,
                variant: "primary" as const,
                onClick: () => {
                  setUploadFileList([]);
                  setCreateModalOpen(true);
                  // Sinh trước mã thiết bị để hiển thị preview (giống Mã cảng biển /port)
                  setDeviceCodeLoading(true);
                  generateScadaCode()
                    .then((code) => { if (code) createForm.setFieldsValue({ deviceCode: code }); })
                    .catch(() => { createForm.setFieldsValue({ deviceCode: '' }); /* Backend tự sinh khi lưu */ })
                    .finally(() => setDeviceCodeLoading(false));
                },
              }
            : null,
        ].filter(Boolean) as Array<{ key: string; label: string; icon?: React.ReactNode; variant?: 'primary' | 'outline' | 'subtle' | 'default'; onClick: () => void }>}
      />

      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        loading={isLoading}
        error={!!isError}
        onRetry={fetchData}
        filterContent={
          <>
            {/* ═══ Basic Filters (always visible) ═══ */}
            <div style={{ marginBottom: 12, marginTop: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>
                Đơn vị quản lý{" "}
                <span style={{ color: statusCritical }}>*</span>
              </div>
              <OrgUnitTreeSelect
                organizations={orgUnitOptions}
                placeholder="Chọn đơn vị"
                allowClear
                showPath
                allLabel="Tất cả"
                treeDefaultExpandAll={false}
                value={filterValues.orgUnitId || undefined}
                onChange={(val) =>
                  setFilterValues((prev) => ({
                    ...prev,
                    orgUnitId: val as string,
                  }))
                }
                loading={loadingOrgs}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>Tên thiết bị</div>
              <Input placeholder="Tìm theo tên thiết bị..." allowClear
                value={filterValues.deviceName || ""}
                onChange={(e) =>
                  setFilterValues((prev) => ({
                    ...prev,
                    deviceName: e.target.value,
                  }))
                }
                onPressEnter={handleFilterApply}
                style={{ borderRadius: radiusPill, height: 40 }} />
            </div>
            {filterCollapsed && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>Mã thiết bị</div>
                  <Input placeholder="Tìm theo mã thiết bị..." allowClear
                    value={filterValues.deviceCode || ""}
                    onChange={(e) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        deviceCode: e.target.value,
                      }))
                    }
                    onPressEnter={handleFilterApply}
                    style={{ borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>Tình trạng</div>
                  <Select placeholder="Chọn tình trạng" allowClear
                    value={filterValues.operationalStatus || undefined}
                    onChange={(val) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        operationalStatus: val as number | undefined,
                      }))
                    }
                    options={OPERATIONAL_STATUS_OPTIONS}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>Thuộc loại hạ tầng</div>
                  <Select placeholder="Chọn loại hạ tầng" allowClear
                    value={filterValues.attachedInfraType || undefined}
                    onChange={(val) => {
                      setFilterValues((prev) => ({
                        ...prev,
                        attachedInfraType: val as number | undefined,
                        // Reset attachedInfraId khi đổi loại
                        attachedInfraId: "",
                      }));
                    }}
                    options={attachedInfraTypeOptions}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>Thuộc hạ tầng</div>
                  <Select placeholder={
                    filterValues.attachedInfraType === 2
                        ? "Chọn trạm Radar"
                        : filterValues.attachedInfraType === 1
                          ? "Chọn Trung Tâm Điều Hành VTS"
                          : "Chọn loại hạ tầng trước"
                  } allowClear
                    value={filterValues.attachedInfraId || undefined}
                    onChange={(val) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        attachedInfraId: val ?? "",
                      }))
                    }
                    options={filterValues.attachedInfraType === 1 ? vtsOperationCenterOptions : filterValues.attachedInfraType === 2 ? radarStationOptions : []}
                    loading={filterValues.attachedInfraType === 1 ? loadingVtsCenters : filterValues.attachedInfraType === 2 ? loadingRadars : false}
                    disabled={filterValues.attachedInfraType !== 1 && filterValues.attachedInfraType !== 2}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>Năm đưa vào sử dụng</div>
                  <Select placeholder="Chọn năm" allowClear
                    value={filterValues.yearOfUse}
                    onChange={(val) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        yearOfUse: val as number | undefined,
                      }))
                    }
                    options={yearOfUseOptions}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>Ngày cập nhật</div>
                  <DatePicker.RangePicker
                    format="DD/MM/YYYY"
                    placeholder={["Chọn từ ngày", "Chọn đến ngày"]}
                    allowClear
                    className="port-range-picker"
                    popupClassName="range-single-panel"
                    value={
                      filterValues.updatedFrom && filterValues.updatedTo
                        ? [
                            dayjs(filterValues.updatedFrom),
                            dayjs(filterValues.updatedTo),
                          ]
                        : null
                    }
                    onChange={(dates) => {
                      setFilterValues((prev) => ({
                        ...prev,
                        updatedFrom: dates?.[0] ? dates[0].format("YYYY-MM-DD 00:00:00") : "",
                        updatedTo: dates?.[1] ? dates[1].format("YYYY-MM-DD 23:59:59") : "",
                      }));
                    }}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} />
                  <style>{`.port-range-picker .ant-picker-cell-selected .ant-picker-cell-inner{background:${actionPrimary}!important}.port-range-picker .ant-picker-ok button{background:${actionPrimary}!important;border-color:${actionPrimary}!important;border-radius:${radiusPill}px!important}.port-range-picker .ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner{background:${actionPrimary}15!important;color:${actionPrimary}!important}.port-range-picker .ant-picker-today-btn{color:${actionPrimary}!important}.range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child{display:none!important}`}</style>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 8 }}>Địa điểm (Tỉnh/Thành phố)</div>
                  <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    value={filterValues.province || undefined}
                    onChange={(val) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        province: val as string,
                      }))
                    }
                    options={VIETNAM_PROVINCES.map(p => ({ label: p, value: p }))}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </div>
              </>
            )}
          </>
        }
        statusTabs={[
          {
            key: "all",
            label: "Tất cả",
            count: totalAll || 0,
            color: actionPrimary,
            active: !filterValues.approvalStatus,
          },
          {
            key: "DRAFT",
            label: "Lưu tạm",
            count: tabCounts["DRAFT"] ?? 0,
            color: statusDraft,
            active: filterValues.approvalStatus === "DRAFT",
          },
          {
            key: "PENDING_APPROVAL",
            label: "Chờ Cảng vụ duyệt",
            count: tabCounts["PENDING_APPROVAL"] ?? 0,
            color: statusAttention,
            active: filterValues.approvalStatus === "PENDING_APPROVAL",
          },
          {
            key: "APPROVED_LEVEL1",
            label: "Chờ Cục duyệt",
            count: tabCounts["APPROVED_LEVEL1"] ?? 0,
            color: statusInfo,
            active: filterValues.approvalStatus === "APPROVED_LEVEL1",
          },
          {
            key: "APPROVED",
            label: "Đã duyệt",
            count: tabCounts["APPROVED"] ?? 0,
            color: statusOperational,
            active: filterValues.approvalStatus === "APPROVED",
          },
          {
            key: "REJECTED_LEVEL1",
            label: "Từ chối",
            count: (tabCounts["REJECTED_LEVEL1"] ?? 0) + (tabCounts["REJECTED_LEVEL2"] ?? 0),
            color: statusCritical,
            active:
              filterValues.approvalStatus === "REJECTED_LEVEL1" ||
              filterValues.approvalStatus === "REJECTED_LEVEL2",
          },
        ]}
        onStatusTabChange={(key) => {
          // Tab "Từ chối" có key REJECTED_LEVEL1 — active khi filter là REJECTED_LEVEL1 hoặc REJECTED_LEVEL2
          const approvalStatus = key === "all" ? "" : key;
          setFilterValues((prev) => ({
            ...prev,
            approvalStatus,
          }));
          setPage(0);
          fetchData();
        }}
      >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
            <DataTable
              fill
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 'max-content', y: 540 }}
              onSort={handleSort}
              rowActions={rowActions}
              locale={{
                emptyText: (
                  <EmptyState description="Chưa có dữ liệu hệ thống SCADA" />
                ),
              }}
            />
            <div style={{ height: 6, flexShrink: 0 }} />
            <Pagination
              current={page + 1}
              total={total}
              pageSize={pageSize}
              onChange={(p, ps) => {
                setPageSize(ps);
                setPage(Math.max(p - 1, 0));
              }}
            />
          </div>
      </FilterTableLayout>
      </div>

      {/* Detail Drawer */}
      <Drawer
        {...drawerProps}
        title={<span style={drawerTitleStyle}>Chi tiết hệ thống SCADA{selectedRecord ? ` - ${selectedRecord.deviceName || selectedRecord.deviceCode || ''}` : ''}</span>}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        extra={<Button type="text" onClick={() => setDetailDrawerOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        footer={null}
      >
        {selectedRecord && (
          <Tabs
            defaultActiveKey="general"
            className="port-detail-tabs"
            tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 100, background: surfaceCard }}
            items={[
              {
                key: "general",
                label: "Thông tin chung",
                children: (
                  <div style={{ paddingTop: 3 }}>
                    <div className="chk-detail-grid">
                      {([
                        { label: 'Mã thiết bị', value: selectedRecord.deviceCode, badge: true },
                        { label: 'Tên thiết bị', value: selectedRecord.deviceName, bold: true },
                        { label: 'Đơn vị quản lý', value: selectedRecord.orgUnitName || '—', bold: true },
                        { label: 'Thuộc TTDH VTS / Trạm Radar', value: selectedRecord.attachedInfrastructureName || '—' },
                        { label: 'Đơn vị khai thác', value: selectedRecord.operatingUnitName || '—' },
                        { label: 'Tỉnh / Thành phố', value: selectedRecord.provinceName || '—' },
                        { label: 'Địa điểm chi tiết', value: selectedRecord.detailedLocation || '—' },
                        { label: 'Đơn vị tính', value: formatUnitOfMeasure(selectedRecord.unitOfMeasure) },
                        { label: 'Số lượng', value: <span style={{ color: textPrimary, fontSize: fontSizeMd }}>{fmtNum(selectedRecord.quantity)}</span> },
                        { label: 'Năm đưa vào sử dụng', value: selectedRecord.yearOfUse ? String(selectedRecord.yearOfUse) : '—' },
                        { label: 'Tình trạng', value: (() => { const stMap: Record<string, { color: string; label: string }> = { 'NOT_YET_OPERATIONAL': { color: 'orange', label: 'Chưa khai thác/vận hành' }, 'OPERATIONAL': { color: 'green', label: 'Đang khai thác/vận hành' }, 'SUSPENDED': { color: 'red', label: 'Dừng khai thác/vận hành' } }; const st = stMap[String(selectedRecord.operationalStatus || '').toUpperCase()] || { color: textTertiary, label: String(selectedRecord.operationalStatus || '—') }; return renderScadaStatusBadge(st); })() },
                        { label: 'Model', value: selectedRecord.model || '—' },
                        { label: 'Hãng sản xuất', value: selectedRecord.manufacturer || '—' },
                        { label: 'Phê duyệt', value: renderApprovalBadge(selectedRecord.approvalStatus) },
                      ] as Array<{ label: string; value: React.ReactNode; badge?: boolean; bold?: boolean; fullWidth?: boolean }>).map((row) => (
                        <div key={row.label} className={row.fullWidth ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
                          <span className="chk-detail-label">{row.label}</span>
                          <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', ...(row.bold ? { fontWeight: fontWeightBold } : undefined) }}>
                            {row.badge ? (
                              <Tag color={colors.primary} style={{ borderRadius: radiusPill, margin: 0, fontWeight: fontWeightMedium }}>{row.value}</Tag>
                            ) : row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                key: "technical",
                label: "Thông số kỹ thuật",
                children: (
                  <div style={{ paddingTop: 3 }}>
                    <div className="chk-detail-grid">
                      {[
                        ['Thông số kỹ thuật', selectedRecord.specifications || '—'],
                        ['Thông tin bảo trì', selectedRecord.maintenanceInformation || '—'],
                        ['Ghi chú', selectedRecord.note || '—'],
                      ].map(([label, value]) => (
                        <div key={label} className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label">{label}</span>
                          <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                key: "gis",
                label: "Thông tin vị trí",
                children: (
                  <div style={{ paddingTop: 3 }}>
                    <div className="chk-detail-grid">
                      {([
                        ['Thuộc loại hạ tầng', selectedRecord.attachedInfrastructureName || '—'],
                        ['Biểu tượng', (() => { const sym = (symbols || []).find((s) => s.id === selectedRecord.mapSymbolId); return sym ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{sym.image ? <img src={sym.image} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}{sym.name}</span> : selectedRecord.mapSymbolName || '—'; })(),],
                        ['Hệ quy chiếu', selectedRecord.coordinateSystem === 1 ? 'WGS-84' : selectedRecord.coordinateSystem === 2 ? 'VN-2000' : (selectedRecord.coordinateSystem != null ? String(selectedRecord.coordinateSystem) : '—')],
                        ['Quy tắc hiển thị', selectedRecord.displayRule != null ? String(selectedRecord.displayRule) : '—'],
                      ] as const).map(([label, value]) => (
                        <div key={label} className="chk-detail-row">
                          <span className="chk-detail-label">{label}</span>
                          <span className="chk-detail-value">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: spaceSm, padding: '0 12px' }}>
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span>
                      <Table size="small"
                        dataSource={(() => {
                          const loc = resolveMapGeometryLocation((selectedRecord as any)?.coordinates);
                          return (loc ? loc.coordinates.map(([lng, lat]) => ({ lat, lng })) : []).map((r, i) => ({ ...r, key: i, __stt: i + 1 }));
                        })()}
                        rowKey={(_, i) => (i ?? 0)}
                        pagination={{ pageSize: 20, hideOnSinglePage: true, showTotal: (t) => `Tổng cộng ${t}` }}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: <div style={{ padding: '32px 0', textAlign: 'center' }}><div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><EnvironmentOutlined /></div><span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có tọa độ</span></div> }}
                      >
                        <Table.Column title="STT" key="stt" dataIndex="__stt" width={60} align="center"
                          render={(v: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{v}</span>}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Vĩ độ (N)" key="lat" align="center"
                          render={(_: any, record: any) => {
                            const dd = record.lat || 0;
                            const d = Math.floor(dd);
                            const m = Math.floor((dd - d) * 60);
                            const s = ((dd - d - m / 60) * 3600);
                            return (
                              <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                <InputNumber value={d} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} />
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
                                <InputNumber value={m} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} />
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
                                <InputNumber value={s.toFixed(2)} readOnly tabIndex={-1} style={{ flex: 1.2, textAlign: 'center', pointerEvents: 'none' }} />
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>{'"'}</span>
                              </Space.Compact>
                            );
                          }}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Kinh độ (E)" key="lng" align="center"
                          render={(_: any, record: any) => {
                            const dd = record.lng || 0;
                            const d = Math.floor(dd);
                            const m = Math.floor((dd - d) * 60);
                            const s = ((dd - d - m / 60) * 3600);
                            return (
                              <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                <InputNumber value={d} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} />
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
                                <InputNumber value={m} readOnly tabIndex={-1} style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }} />
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
                                <InputNumber value={s.toFixed(2)} readOnly tabIndex={-1} style={{ flex: 1.2, textAlign: 'center', pointerEvents: 'none' }} />
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>{'"'}</span>
                              </Space.Compact>
                            );
                          }}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                      </Table>
                    </div>
                  </div>
                ),
              },
              {
                key: "operationMaintenance",
                label: "Vận hành & bảo trì",
                children: (
                  <div>
                    <ScadaRefTable title="Thông tin vận hành khai thác" emptyText="Chưa có dữ liệu" columns={[
                      { title: 'Mã kế hoạch', dataIndex: 'opPlanCode', width: 180 },
                      { title: 'Tên kế hoạch', dataIndex: 'opPlanName', width: 220 },
                      { title: 'Ngày bắt đầu', dataIndex: 'opStartDate', width: 200 },
                      { title: 'Ngày kết thúc', dataIndex: 'opEndDate', width: 200 },
                    ]} />
                    <ScadaRefTable title="Thông tin bảo trì" emptyText="Chưa có dữ liệu" columns={[
                      { title: 'Mã kế hoạch', dataIndex: 'maintCode', width: 180 },
                      { title: 'Tên kế hoạch', dataIndex: 'maintName', width: 220 },
                      { title: 'Thời gian bắt đầu', dataIndex: 'maintStart', width: 200 },
                      { title: 'Thời gian kết thúc', dataIndex: 'maintEnd', width: 200 },
                    ]} />
                    <ScadaRefTable title="Thông tin sự cố" emptyText="Chưa có dữ liệu" columns={[
                      { title: 'Mã sự cố', dataIndex: 'incidentCode', width: 150 },
                      { title: 'Loại sự cố', dataIndex: 'incidentType', width: 150 },
                      { title: 'Địa điểm', dataIndex: 'incidentLocation', width: 200 },
                      { title: 'Thời gian', dataIndex: 'incidentTime', width: 180 },
                    ]} />
                  </div>
                ),
              },
              {
                key: "handlingAndTracking",
                label: "Xử lý & theo dõi",
                children: (
                  <div style={{ paddingTop: 3 }}>
                    <div className="chk-detail-grid">
                      {[
                        { key: 'updatedDate', label: 'Ngày cập nhật', value: selectedRecord.updatedAt ? formatDate(selectedRecord.updatedAt) : '—' },
                        { key: 'updatedByUser', label: 'Cán bộ cập nhật', value: selectedRecord.updatedByName || '—' },
                        { key: 'submittedDate', label: 'Ngày gửi phê duyệt', value: selectedRecord.submittedDate ? formatDate(selectedRecord.submittedDate) : '—' },
                        { key: 'submittedByUser', label: 'Cán bộ gửi phê duyệt', value: selectedRecord.submittedByName || '—' },
                        { key: 'approvalContentLevel1', label: 'Nội dung phê duyệt', value: selectedRecord.approvalContentLevel1 || '—', fullWidth: true },
                        { key: 'approvedDateLevel1', label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', value: selectedRecord.approvedDateLevel1 ? formatDate(selectedRecord.approvedDateLevel1) : '—' },
                        { key: 'approvedByLevel1', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: selectedRecord.approverLevel1Name || '—' },
                        { key: 'approvalContentLevel2', label: 'Nội dung phê duyệt', value: selectedRecord.approvalContentLevel2 || '—', fullWidth: true },
                        { key: 'approvedDateLevel2', label: 'Ngày phê duyệt cấp Cục', value: selectedRecord.approvedDateLevel2 ? formatDate(selectedRecord.approvedDateLevel2) : '—' },
                        { key: 'approvedByLevel2', label: 'Cán bộ phê duyệt cấp Cục', value: selectedRecord.approverLevel2Name || '—' },
                        { key: 'approvalContentExtra', label: 'Nội dung phê duyệt', value: selectedRecord.rejectionReason || '—', fullWidth: true },
                        { key: 'status', label: 'Trạng thái', value: renderApprovalBadge(selectedRecord.approvalStatus), fullWidth: true },
                      ].map((row) => (
                        <div key={row.key} className={row.fullWidth ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
                          <span className="chk-detail-label">{row.label}</span>
                          <span className="chk-detail-value">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* Approve Modal — dùng chung 2 cấp (C1 Cảng vụ / C2 Cục) */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approveLevel}
        loading={approveLoading}
        onConfirm={handleApprove}
        onCancel={() => {
          setApproveTarget(null);
          setApproveModalOpen(false);
        }}
      />

      {/* Submit Approval Modal — Gửi phê duyệt (giống màn /port) */}
      <Modal
        title={
          <span
            style={{
              color: colors.sidebarBg,
              fontWeight: fontWeightBold,
              fontSize: fontSizeLg,
            }}
          >
            Xác nhận gửi phê duyệt
          </span>
        }
        open={submitModalOpen}
        onCancel={() => {
          setSubmittingRecord(null);
          setSubmitContent("");
          setSubmitModalOpen(false);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setSubmittingRecord(null);
              setSubmitContent("");
              setSubmitModalOpen(false);
            }}
            style={outlineButtonStyle}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleConfirmSubmit}
            loading={submitLoading}
            style={primaryButtonStyle}
          >
            Xác nhận
          </Button>,
        ]}
        width={480}
      >
        <div style={{ padding: "8px 0" }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi phê duyệt{" "}
            <strong>
              {submittingRecord?.deviceCode} — {submittingRecord?.deviceName}
            </strong>
            ?
          </p>
          <Input.TextArea
            value={submitContent}
            onChange={(e) => setSubmitContent(e.target.value)}
            placeholder="Nhập nội dung / ý kiến gửi phê duyệt (không bắt buộc)..."
            rows={3}
            maxLength={500}
            showCount
            style={{ marginTop: spaceSm }}
          />
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={
          <span
            style={{
              color: colors.sidebarBg,
              fontWeight: fontWeightBold,
              fontSize: fontSizeLg,
            }}
          >
            Từ chối phê duyệt
          </span>
        }
        open={rejectModalOpen}
        onCancel={() => {
          setRejectTarget(null);
          setRejectModalOpen(false);
          rejectForm.resetFields();
        }}
        footer={null}
        width={480}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do từ chối"
            rules={[
              { required: true, message: "Lý do từ chối không được để trống" },
              { min: 10, message: "Lý do từ chối tối thiểu 10 ký tự" },
              { max: 500, message: "Lý do từ chối tối đa 500 ký tự" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do từ chối..."
              style={{ borderRadius: radiusPill }}
            />
          </Form.Item>
          <Form.Item
            name="confirmed"
            rules={[
              { required: true, message: "Bạn cần xác nhận hành động này" },
            ]}
            valuePropName="checked"
          >
            <Checkbox>
              <Text style={{ color: statusCritical }}>
                Tôi xác nhận từ chối hệ thống SCADA này
              </Text>
            </Checkbox>
          </Form.Item>
          <div style={{ textAlign: "right", marginTop: spaceMd }}>
            <Button
              onClick={() => {
                setRejectTarget(null);
                setRejectModalOpen(false);
                rejectForm.resetFields();
              }}
              style={{
                borderRadius: radiusPill,
                height: 40,
                marginRight: spaceSm,
              }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              danger
              loading={rejectLoading}
              onClick={handleReject}
              style={pillStyle}
            >
              Từ chối
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        title={
          <span
            style={{
              color: colors.sidebarBg,
              fontWeight: fontWeightBold,
              fontSize: fontSizeLg,
            }}
          >
            Xác nhận xóa
          </span>
        }
        open={!!deleteTarget}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteConfirmText("");
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setDeleteTarget(null);
              setDeleteConfirmText("");
            }}
            style={outlineButtonStyle}
          >
            Hủy
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={deleteLoading}
            onClick={handleDeleteConfirm}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
            }}
          >
            Xác nhận xóa
          </Button>,
        ]}
        width={480}
      >
        <div style={{ padding: "8px 0" }}>
          <Alert
            message="Hành động này không thể hoàn tác"
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }}
          />
          <p
            style={{
              fontSize: fontSizeMd,
              color: textPrimary,
              marginBottom: spaceFormField,
            }}
          >
            Vui lòng nhập <strong>tên thiết bị</strong> hoặc gõ{" "}
            <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deleteTarget && (
            <p
              style={{
                fontSize: fontSizeMd,
                color: textSecondary,
                marginBottom: spaceFormField,
              }}
            >
              Thiết bị:{" "}
              <strong style={{ color: textPrimary }}>
                {deleteTarget.deviceName}
              </strong>
            </p>
          )}
          <Input
            placeholder="Nhập tên thiết bị hoặc XÓA"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            onPressEnter={handleDeleteConfirm}
            style={pillStyle}
            autoFocus
          />
        </div>
      </Modal>

      {/* ── Create Drawer ─────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={
          <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
            Thêm mới hệ thống SCADA
          </span>
        }
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
          setGpsCoordList([]);
          setUploadFileList([]);
        }}
        extra={
          <Button
            type="text"
            onClick={() => {
              setCreateModalOpen(false);
              createForm.resetFields();
              setGpsCoordList([]);
              setUploadFileList([]);
            }}
            style={drawerCloseBtnStyle}
          >
            ✕
          </Button>
        }
        footer={
          <div style={drawerFooterStyle}>
            <Button
              onClick={() => { createActionTypeRef.current = 'draft'; setCreateActionType('draft'); createForm.submit(); }}
              loading={createLoading && createActionType === 'draft'}
              style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
            >
              Lưu tạm
            </Button>
            <Button
              type="primary"
              onClick={() => { createActionTypeRef.current = 'submit'; setCreateActionType('submit'); createForm.submit(); }}
              loading={createLoading && createActionType === 'submit'}
              style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
            >
              Lưu và gửi phê duyệt
            </Button>
            {canSaveAndApprove && (
              <Button
                type="primary"
                onClick={() => { createActionTypeRef.current = 'approve'; setCreateActionType('approve'); createForm.submit(); }}
                loading={createLoading && createActionType === 'approve'}
                style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational, borderRadius: radiusPill, height: 40 }}
              >
                Lưu và phê duyệt
              </Button>
            )}
          </div>
        }
        styles={{
          header: {
            padding: "12px 24px",
            borderBottom: `1px solid ${borderDefault}`,
            flexShrink: 0,
          },
          body: { padding: "0 24px 12px 24px" },
        }}
      >
        <style>{requiredMarkStyle}</style>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Tabs
            defaultActiveKey="general"
            tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 100, background: surfaceCard }}
            items={[
              {
                key: 'general',
                label: 'Thông tin chung',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="deviceCode"
                          {...labelProps('Mã thiết bị')}
                          style={{ marginBottom: spaceFormField }}
                          tooltip="Mã thiết bị được sinh tự động, không thể chỉnh sửa"
                        >
                          <Input
                            disabled
                            placeholder={deviceCodeLoading ? 'Đang sinh mã...' : 'Mã tự động'}
                            style={{ ...pillStyle, fontFamily: fontSans }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="deviceName"
                          {...labelProps('Tên thiết bị')}
                          rules={[
                            { required: true, message: "Vui lòng nhập tên thiết bị" },
                            { warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 255 ? Promise.reject(new Error('Đã đạt tối đa 255 ký tự')) : Promise.resolve() },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input
                            placeholder="Nhập tên thiết bị..."
                            maxLength={255}
                            style={{ ...pillStyle, fontFamily: fontSans }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="orgUnitId"
                          {...labelProps('Đơn vị quản lý')}
                          rules={[
                            { required: true, message: "Vui lòng chọn đơn vị quản lý" },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <OrgUnitTreeSelect
                            organizations={orgUnitOptions}
                            placeholder="Chọn đơn vị"
                            loading={loadingOrgs}
                            showPath
                            treeDefaultExpandAll={false}
                            style={{ ...pillStyle }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="attachedInfrastructureType"
                          {...labelProps('Thuộc loại hạ tầng')}
                          rules={[
                            { required: true, message: "Vui lòng chọn loại hạ tầng" },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            style={{ width: "100%", ...pillStyle }}
                            placeholder="Chọn loại hạ tầng"
                            options={attachedInfraTypeOptions}
                            onChange={(val) => {
                              createForm.setFieldValue("attachedInfrastructureType", val);
                              // Reset attachedInfrastructureId khi đổi loại
                              createForm.setFieldValue("attachedInfrastructureId", undefined);
                            }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="attachedInfrastructureId"
                          {...labelProps('Thuộc hạ tầng')}
                          rules={[
                            { required: true, message: "Vui lòng chọn hạ tầng" },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            style={{ width: "100%", ...pillStyle }}
                            placeholder={
                              createAttachedType === 2
                                ? "Chọn trạm Radar"
                                : createAttachedType === 1
                                  ? "Chọn Trung Tâm Điều Hành VTS"
                                  : "Chọn loại hạ tầng trước"
                            }
                            options={createAttachedType === 1 ? vtsOperationCenterOptions : createAttachedType === 2 ? radarStationOptions : []}
                            loading={createAttachedType === 1 ? loadingVtsCenters : createAttachedType === 2 ? loadingRadars : false}
                            disabled={createAttachedType !== 1 && createAttachedType !== 2}
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="operatingUnitId"
                          {...labelProps('Đơn vị khai thác')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            showSearch
                            placeholder="Chọn đơn vị khai thác"
                            loading={loadingOperatingOrgs}
                            style={{ width: "100%", ...pillStyle }}
                            options={operatingOrganizationOptions}
                            filterOption={(input: string, option: any) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="provinceName"
                          {...labelProps('Địa điểm (Tỉnh/TP)')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            style={{ width: "100%", ...pillStyle }}
                            placeholder="Chọn tỉnh/thành phố"
                            options={VIETNAM_PROVINCES.map(p => ({ label: p, value: p }))}
                            showSearch
                            filterOption={(input: string, option: any) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="detailedLocation"
                          {...labelProps('Địa điểm chi tiết')}
                          rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 500 ? Promise.reject(new Error('Đã đạt tối đa 500 ký tự')) : Promise.resolve() }]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input
                            maxLength={500}
                            placeholder="Nhập địa điểm chi tiết..."
                            style={{ ...pillStyle, fontFamily: fontSans }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="unitOfMeasure"
                          {...labelProps('Đơn vị tính')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            placeholder="Chọn đơn vị tính"
                            options={[
                              { label: 'Bộ', value: 1 },
                              { label: 'Bến', value: 2 },
                              { label: 'Bản quyền', value: 3 },
                              { label: 'Chiếc', value: 4 },
                              { label: 'Cổng', value: 5 },
                              { label: 'Cái', value: 6 },
                              { label: 'Cột', value: 7 },
                              { label: 'Cầu', value: 8 },
                              { label: 'Đường truyền', value: 9 },
                              { label: 'Héc-ta', value: 10 },
                              { label: 'Hạng mục', value: 11 },
                              { label: 'Hệ thống', value: 12 },
                              { label: 'Kho', value: 13 },
                              { label: 'Khu', value: 14 },
                              { label: 'Ki-lô-mét', value: 15 },
                              { label: 'Mét', value: 16 },
                              { label: 'Mét vuông', value: 17 },
                              { label: 'Nhà', value: 18 },
                              { label: 'Phòng', value: 19 },
                              { label: 'Phân hệ', value: 20 },
                              { label: 'Quả', value: 21 },
                              { label: 'Tuyến', value: 22 },
                              { label: 'Tấn', value: 23 },
                              { label: 'Trạm', value: 24 },
                              { label: 'Tháp', value: 25 },
                              { label: 'Trụ', value: 26 },
                              { label: 'VNĐ', value: 27 },
                            ]}
                            style={{ width: "100%", ...pillStyle }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="quantity"
                          {...labelProps('Số lượng')}
                          rules={[
                            { required: true, message: "Vui lòng nhập số lượng" },
                            { type: 'number', min: 1, message: "Số lượng phải > 0" },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <InputNumber
                            min={1}
                            style={{ width: "100%", ...pillStyle }}
                            placeholder="0"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="yearOfUse"
                          {...labelProps('Năm đưa vào sử dụng')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            style={{ width: "100%", ...pillStyle }}
                            placeholder="Chọn năm"
                            options={yearOfUseOptions}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="operationalStatus"
                          {...labelProps('Tình trạng')}
                          rules={[
                            { required: true, message: "Vui lòng chọn tình trạng" },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            placeholder="Chọn tình trạng"
                            options={OPERATIONAL_STATUS_OPTIONS}
                            style={{ width: "100%", ...pillStyle }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="model"
                          {...labelProps('Model')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input
                            placeholder="Nhập model..."
                            maxLength={255}
                            style={{ ...pillStyle, fontFamily: fontSans }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="manufacturer"
                          {...labelProps('Hãng sản xuất')}
                          rules={[{ max: 50, message: "Tối đa 50 ký tự" }]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input
                            placeholder="Nhập hãng..."
                            maxLength={50}
                            style={{ ...pillStyle, fontFamily: fontSans }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      name="specifications"
                      {...labelProps('Thông số kỹ thuật')}
                      rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Nhập thông số kỹ thuật..."
                        maxLength={2000}
                        style={textAreaStyle}
                      />
                    </Form.Item>
                    <Form.Item
                      name="maintenanceInformation"
                      {...labelProps('Thông tin bảo trì')}
                      rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Nhập thông tin bảo trì..."
                        maxLength={2000}
                        style={textAreaStyle}
                      />
                    </Form.Item>
                    <Form.Item
                      name="note"
                      {...labelProps('Ghi chú')}
                      rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 500 ? Promise.reject(new Error('Đã đạt tối đa 500 ký tự')) : Promise.resolve() }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="Nhập ghi chú..."
                        maxLength={500}
                        style={textAreaStyle}
                      />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'gis',
                label: 'Thông tin vị trí',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="geometryType"
                          {...labelProps('Loại đối tượng')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            placeholder="Chọn loại đối tượng"
                            allowClear
                            options={[
                              { value: 'POINT', label: 'Đối tượng điểm' },
                              { value: 'LINE', label: 'Đối tượng đường' },
                              { value: 'POLYGON', label: 'Đối tượng vùng' },
                            ]}
                            style={{ ...pillStyle, width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="mapSymbolId"
                          {...labelProps('Biểu tượng')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            placeholder="Chọn biểu tượng bản đồ"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            disabled={!createGeometryType}
                            style={{ ...pillStyle, width: '100%' }}
                          >
                            {symbols.map((sym) => (
                              <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                                <Space>
                                  {sym.image && (
                                    <img
                                      src={
                                        sym.image.startsWith('data:')
                                          ? sym.image
                                          : `data:image/png;base64,${sym.image}`
                                      }
                                      alt={sym.name}
                                      style={{ width: 20, height: 20, objectFit: 'contain' }}
                                    />
                                  )}
                                  <span>
                                    {sym.code ? `${sym.name} (${sym.code})` : sym.name}
                                  </span>
                                </Space>
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="coordinateSystem"
                          {...labelProps('Hệ quy chiếu')}
                          style={{ marginBottom: spaceFormField }}
                          rules={createGeometryType ? [{ required: true, message: 'Hệ quy chiếu là bắt buộc khi chọn loại đối tượng' }] : []}
                        >
                          <Select
                            placeholder="Chọn hệ quy chiếu"
                            disabled
                            options={[
                              { value: 1, label: 'WGS-84' },
                              { value: 2, label: 'VN-2000' },
                            ]}
                            style={{ ...pillStyle, width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="displayRule"
                          {...labelProps('Quy tắc hiển thị')}
                          style={{ marginBottom: spaceFormField }}
                          rules={createGeometryType ? [{ required: true, message: 'Quy tắc hiển thị là bắt buộc khi chọn loại đối tượng' }] : []}
                        >
                          <Input
                            placeholder="Chọn quy tắc hiển thị"
                            disabled
                            style={{ ...pillStyle, color: '#8c8c8c', cursor: 'not-allowed' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    {/* GPS Coordinates (DMS) */}
                    <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS{createGeometryType && <span style={{ color: colors.error, marginLeft: 4, fontSize: fontSizeMd }}>*</span>}</span>
                      </span>
                      {gpsCoordList.length > 0 && (
                        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setGpsCoordList([...gpsCoordList, { lat: 0, lng: 0 }])} disabled={!createGeometryType} style={{ borderRadius: radiusPill }}>
                          Thêm tọa độ
                        </Button>
                      )}
                    </div>
                    {gpsCoordList.length === 0 ? (
                      <div style={{
                        padding: '32px 16px',
                        textAlign: 'center',
                        border: `1px dashed ${borderDefault}`,
                        borderRadius: radiusMd,
                        background: surfaceCard,
                      }}>
                        <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                          Chưa có tọa độ nào.
                        </span>
                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => setGpsCoordList([...gpsCoordList, { lat: 0, lng: 0 }])} disabled={!createGeometryType} style={{ borderRadius: radiusPill }}>
                          Thêm tọa độ
                        </Button>
                      </div>
                    ) : (
                      <Table
                        size="small"
                        dataSource={gpsCoordList.map((c, i) => ({ ...c, _idx: i, key: i, __stt: i + 1 }))}
                        rowKey={(_, i) => (i ?? 0)}
                        pagination={{ pageSize: 20, hideOnSinglePage: true, showTotal: (t) => `Tổng cộng ${t}` }}
                        scroll={{ x: 'max-content' }}
                      >
                        <Table.Column
                          title="STT"
                          key="stt"
                          dataIndex="__stt"
                          width={60}
                          align="center"
                          render={(v: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{v}</span>}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })}
                        />
                        <Table.Column
                          title="Vĩ độ (N)"
                          key="lat"
                          render={(_: any, record: any) => {
                            const dd = record.lat || 0;
                            const d = Math.floor(dd);
                            const m = Math.floor((dd - d) * 60);
                            const s = ((dd - d - m / 60) * 3600);
                            return (
                              <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                <InputNumber value={d} min={0} max={90} placeholder="Độ"
                                  onChange={(v) => setGpsCoordList(gpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lat: Number(v ?? 0) } : g))}
                                  style={{ flex: 1 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>°</span>
                                <InputNumber value={m} min={0} max={59} placeholder="Phút"
                                  onChange={(v) => setGpsCoordList(gpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lat: d + (Number(v ?? 0)) / 60 } : g))}
                                  style={{ flex: 1 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>'</span>
                                <InputNumber value={Math.round(s * 100) / 100} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber}
                                  onChange={(v) => setGpsCoordList(gpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lat: d + m / 60 + (Number(v ?? 0)) / 3600 } : g))}
                                  style={{ flex: 1.2 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>{'"'}</span>
                              </Space.Compact>
                            );
                          }}
                          onHeaderCell={() => ({
                            style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                          })}
                        />
                        <Table.Column
                          title="Kinh độ (E)"
                          key="lng"
                          render={(_: any, record: any) => {
                            const dd = record.lng || 0;
                            const d = Math.floor(dd);
                            const m = Math.floor((dd - d) * 60);
                            const s = ((dd - d - m / 60) * 3600);
                            return (
                              <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                <InputNumber value={d} min={0} max={180} placeholder="Độ"
                                  onChange={(v) => setGpsCoordList(gpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lng: Number(v ?? 0) } : g))}
                                  style={{ flex: 1 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>°</span>
                                <InputNumber value={m} min={0} max={59} placeholder="Phút"
                                  onChange={(v) => setGpsCoordList(gpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lng: d + (Number(v ?? 0)) / 60 } : g))}
                                  style={{ flex: 1 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>'</span>
                                <InputNumber value={Math.round(s * 100) / 100} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber}
                                  onChange={(v) => setGpsCoordList(gpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lng: d + m / 60 + (Number(v ?? 0)) / 3600 } : g))}
                                  style={{ flex: 1.2 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>{'"'}</span>
                              </Space.Compact>
                            );
                          }}
                          onHeaderCell={() => ({
                            style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                          })}
                        />
                        <Table.Column
                          title=""
                          key="actions"
                          width={44}
                          align="center"
                          render={(_: any, record: any) => (
                            <Button type="link" danger size="small" icon={<DeleteOutlined />}
                              onClick={() => setGpsCoordList(gpsCoordList.filter((_, idx) => idx !== record._idx))} />
                          )}
                          onHeaderCell={() => ({
                            style: { background: colors.bodyBg, padding: '12px 6px' },
                          })}
                        />
                      </Table>
                    )}
                  </div>
                ),
              },
              {
                key: 'attachments',
                label: 'File đính kèm',
                children: (
                  <ScadaFilesTab uploadFileList={uploadFileList} setUploadFileList={setUploadFileList} entityId={updateTarget?.id} />
                ),
              },
            ]}
          />
        </Form>
      </Drawer>

      {/* ── Edit Drawer ──────────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={
          <span style={drawerTitleStyle}>
            Chỉnh sửa thông tin — {updateTarget?.deviceName || '—'}
          </span>
        }
        open={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false);
          setUpdateTarget(null);
          updateForm.resetFields();
          setUpdateGpsCoordList([]);
          setUploadFileList([]);
        }}
        extra={
          <Button
            type="text"
            onClick={() => {
              setUpdateModalOpen(false);
              setUpdateTarget(null);
              updateForm.resetFields();
              setUpdateGpsCoordList([]);
              setUploadFileList([]);
            }}
            style={drawerCloseBtnStyle}
          >
            ✕
          </Button>
        }
        footer={
          <div style={drawerFooterStyle}>
            <Button
              onClick={() => { updateActionTypeRef.current = 'draft'; setUpdateActionType('draft'); updateForm.submit(); }}
              loading={updateLoading && updateActionType === 'draft'}
              style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
            >
              Lưu tạm
            </Button>
            {(updateTarget?.approvalStatus === 'DRAFT' || updateTarget?.approvalStatus === 'REJECTED_LEVEL1' || updateTarget?.approvalStatus === 'REJECTED_LEVEL2') && (
              <Button
                type="primary"
                onClick={() => { updateActionTypeRef.current = 'submit'; setUpdateActionType('submit'); updateForm.submit(); }}
                loading={updateLoading && updateActionType === 'submit'}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Lưu và gửi phê duyệt
              </Button>
            )}
            {updateTarget?.approvalStatus === 'APPROVED' && canSaveAndApprove && (
              <Button
                type="primary"
                onClick={() => { updateActionTypeRef.current = 'approve'; setUpdateActionType('approve'); updateForm.submit(); }}
                loading={updateLoading && updateActionType === 'approve'}
                style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational, borderRadius: radiusPill, height: 40 }}
              >
                Lưu và phê duyệt
              </Button>
            )}
          </div>
        }
        styles={{
          header: {
            padding: "12px 24px",
            borderBottom: `1px solid ${borderDefault}`,
            flexShrink: 0,
          },
          body: { padding: "0 24px 12px 24px" },
        }}
      >
        <style>{requiredMarkStyle}</style>
        <Form form={updateForm} layout="vertical" onFinish={handleUpdate}>
          <Tabs
            defaultActiveKey="general"
            tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 100, background: surfaceCard }}
            items={[
              {
                key: 'general',
                label: 'Thông tin chung',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="deviceCode"
                          {...labelProps('Mã thiết bị')}
                          style={{ marginBottom: spaceFormField }}
                          tooltip="Mã thiết bị được sinh tự động, không thể chỉnh sửa"
                        >
                          <Input
                            disabled
                            placeholder={deviceCodeLoading ? 'Đang sinh mã...' : 'Mã tự động'}
                            style={{ ...pillStyle, fontFamily: fontSans }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="deviceName"
                          {...labelProps('Tên thiết bị')}
                          rules={[
                            { required: true, message: "Vui lòng nhập tên thiết bị" },
                            { warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 255 ? Promise.reject(new Error('Đã đạt tối đa 255 ký tự')) : Promise.resolve() },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input
                            maxLength={255}
                            style={{ ...pillStyle, fontFamily: fontSans }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="orgUnitId"
                          {...labelProps('Đơn vị quản lý')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <OrgUnitTreeSelect
                            organizations={orgUnitOptions}
                            placeholder="Chọn đơn vị"
                            loading={loadingOrgs}
                            showPath
                            treeDefaultExpandAll={false}
                            disabled
                            style={{ ...pillStyle }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="attachedInfrastructureType"
                          {...labelProps('Thuộc loại hạ tầng')}
                          rules={[
                            { required: true, message: "Vui lòng chọn loại hạ tầng" },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            style={{ width: "100%", ...pillStyle }}
                            placeholder="Chọn loại hạ tầng"
                            options={attachedInfraTypeOptions}
                            onChange={(val) => {
                              updateForm.setFieldValue("attachedInfrastructureType", val);
                              updateForm.setFieldValue("attachedInfrastructureId", undefined);
                            }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="attachedInfrastructureId"
                          {...labelProps('Thuộc hạ tầng')}
                          rules={[
                            { required: true, message: "Vui lòng chọn hạ tầng" },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            style={{ width: "100%", ...pillStyle }}
                            placeholder={
                              updateAttachedType === 2
                                ? "Chọn trạm Radar"
                                : updateAttachedType === 1
                                  ? "Chọn Trung Tâm Điều Hành VTS"
                                  : "Chọn loại hạ tầng trước"
                            }
                            options={updateAttachedType === 1 ? vtsOperationCenterOptions : updateAttachedType === 2 ? radarStationOptions : []}
                            loading={updateAttachedType === 1 ? loadingVtsCenters : updateAttachedType === 2 ? loadingRadars : false}
                            disabled={updateAttachedType !== 1 && updateAttachedType !== 2}
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="operatingUnitId"
                          {...labelProps('Đơn vị khai thác')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            showSearch
                            placeholder="Chọn đơn vị khai thác"
                            loading={loadingOperatingOrgs}
                            style={{ width: "100%", ...pillStyle }}
                            options={operatingOrganizationOptions}
                            filterOption={(input: string, option: any) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="provinceName"
                          {...labelProps('Địa điểm (Tỉnh/TP)')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            style={{ width: "100%", ...pillStyle }}
                            placeholder="Chọn tỉnh/thành phố"
                            options={VIETNAM_PROVINCES.map(p => ({ label: p, value: p }))}
                            showSearch
                            filterOption={(input: string, option: any) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="detailedLocation"
                          {...labelProps('Địa điểm chi tiết')}
                          rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 500 ? Promise.reject(new Error('Đã đạt tối đa 500 ký tự')) : Promise.resolve() }]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input
                            maxLength={500}
                            placeholder="Nhập địa điểm chi tiết..."
                            style={{ ...pillStyle, fontFamily: fontSans }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="unitOfMeasure"
                          {...labelProps('Đơn vị tính')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            placeholder="Chọn đơn vị tính"
                            options={[
                              { label: 'Bộ', value: 1 },
                              { label: 'Bến', value: 2 },
                              { label: 'Bản quyền', value: 3 },
                              { label: 'Chiếc', value: 4 },
                              { label: 'Cổng', value: 5 },
                              { label: 'Cái', value: 6 },
                              { label: 'Cột', value: 7 },
                              { label: 'Cầu', value: 8 },
                              { label: 'Đường truyền', value: 9 },
                              { label: 'Héc-ta', value: 10 },
                              { label: 'Hạng mục', value: 11 },
                              { label: 'Hệ thống', value: 12 },
                              { label: 'Kho', value: 13 },
                              { label: 'Khu', value: 14 },
                              { label: 'Ki-lô-mét', value: 15 },
                              { label: 'Mét', value: 16 },
                              { label: 'Mét vuông', value: 17 },
                              { label: 'Nhà', value: 18 },
                              { label: 'Phòng', value: 19 },
                              { label: 'Phân hệ', value: 20 },
                              { label: 'Quả', value: 21 },
                              { label: 'Tuyến', value: 22 },
                              { label: 'Tấn', value: 23 },
                              { label: 'Trạm', value: 24 },
                              { label: 'Tháp', value: 25 },
                              { label: 'Trụ', value: 26 },
                              { label: 'VNĐ', value: 27 },
                            ]}
                            style={{ width: "100%", ...pillStyle }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="quantity"
                          {...labelProps('Số lượng')}
                          rules={[
                            { required: true, message: "Vui lòng nhập số lượng" },
                            { type: 'number', min: 1, message: "Số lượng phải > 0" },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <InputNumber
                            min={1}
                            style={{ width: "100%", ...pillStyle }}
                            placeholder="0"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="yearOfUse"
                          {...labelProps('Năm đưa vào sử dụng')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            style={{ width: "100%", ...pillStyle }}
                            placeholder="Chọn năm"
                            options={yearOfUseOptions}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="operationalStatus"
                          {...labelProps('Tình trạng')}
                          rules={[
                            { required: true, message: "Vui lòng chọn tình trạng" },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            placeholder="Chọn tình trạng"
                            options={OPERATIONAL_STATUS_OPTIONS}
                            style={{ width: "100%", ...pillStyle }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="model"
                          {...labelProps('Model')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input
                            maxLength={255}
                            style={{ ...pillStyle, fontFamily: fontSans }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="manufacturer"
                          {...labelProps('Hãng sản xuất')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input
                            maxLength={50}
                            style={{ ...pillStyle, fontFamily: fontSans }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      name="specifications"
                      {...labelProps('Thông số kỹ thuật')}
                      rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Nhập thông số kỹ thuật..."
                        maxLength={2000}
                        style={textAreaStyle}
                      />
                    </Form.Item>
                    <Form.Item
                      name="maintenanceInformation"
                      {...labelProps('Thông tin bảo trì')}
                      rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Nhập thông tin bảo trì..."
                        maxLength={2000}
                        style={textAreaStyle}
                      />
                    </Form.Item>
                    <Form.Item
                      name="note"
                      {...labelProps('Ghi chú')}
                      rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 500 ? Promise.reject(new Error('Đã đạt tối đa 500 ký tự')) : Promise.resolve() }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="Nhập ghi chú..."
                        maxLength={500}
                        style={textAreaStyle}
                      />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'gis',
                label: 'Thông tin vị trí',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="geometryType"
                          {...labelProps('Loại đối tượng')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            placeholder="Chọn loại đối tượng"
                            allowClear
                            options={[
                              { value: 'POINT', label: 'Đối tượng điểm' },
                              { value: 'LINE', label: 'Đối tượng đường' },
                              { value: 'POLYGON', label: 'Đối tượng vùng' },
                            ]}
                            style={{ ...pillStyle, width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="mapSymbolId"
                          {...labelProps('Biểu tượng')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            placeholder="Chọn biểu tượng bản đồ"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            disabled={!updateGeometryType}
                            style={{ ...pillStyle, width: '100%' }}
                          >
                            {symbols.map((sym) => (
                              <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                                <Space>
                                  {sym.image && (
                                    <img
                                      src={
                                        sym.image.startsWith('data:')
                                          ? sym.image
                                          : `data:image/png;base64,${sym.image}`
                                      }
                                      alt={sym.name}
                                      style={{ width: 20, height: 20, objectFit: 'contain' }}
                                    />
                                  )}
                                  <span>
                                    {sym.code ? `${sym.name} (${sym.code})` : sym.name}
                                  </span>
                                </Space>
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="coordinateSystem"
                          {...labelProps('Hệ quy chiếu')}
                          style={{ marginBottom: spaceFormField }}
                          rules={updateGeometryType ? [{ required: true, message: 'Hệ quy chiếu là bắt buộc khi chọn loại đối tượng' }] : []}
                        >
                          <Select
                            placeholder="Chọn hệ quy chiếu"
                            disabled
                            options={[
                              { value: 1, label: 'WGS-84' },
                              { value: 2, label: 'VN-2000' },
                            ]}
                            style={{ ...pillStyle, width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="displayRule"
                          {...labelProps('Quy tắc hiển thị')}
                          style={{ marginBottom: spaceFormField }}
                          rules={updateGeometryType ? [{ required: true, message: 'Quy tắc hiển thị là bắt buộc khi chọn loại đối tượng' }] : []}
                        >
                          <Input
                            placeholder="Chọn quy tắc hiển thị"
                            disabled
                            style={{ ...pillStyle, color: '#8c8c8c', cursor: 'not-allowed' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    {/* GPS Coordinates (DMS) */}
                    <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS{updateGeometryType && <span style={{ color: colors.error, marginLeft: 4, fontSize: fontSizeMd }}>*</span>}</span>
                      </span>
                      {updateGpsCoordList.length > 0 && (
                        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setUpdateGpsCoordList([...updateGpsCoordList, { lat: 0, lng: 0 }])} disabled={!updateGeometryType} style={{ borderRadius: radiusPill }}>
                          Thêm tọa độ
                        </Button>
                      )}
                    </div>
                    {updateGpsCoordList.length === 0 ? (
                      <div style={{
                        padding: '32px 16px',
                        textAlign: 'center',
                        border: `1px dashed ${borderDefault}`,
                        borderRadius: radiusMd,
                        background: surfaceCard,
                      }}>
                        <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
                          Chưa có tọa độ nào.
                        </span>
                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => setUpdateGpsCoordList([...updateGpsCoordList, { lat: 0, lng: 0 }])} disabled={!updateGeometryType} style={{ borderRadius: radiusPill }}>
                          Thêm tọa độ
                        </Button>
                      </div>
                    ) : (
                      <Table
                        size="small"
                        dataSource={updateGpsCoordList.map((c, i) => ({ ...c, _idx: i, key: i, __stt: i + 1 }))}
                        rowKey={(_, i) => (i ?? 0)}
                        pagination={{ pageSize: 20, hideOnSinglePage: true, showTotal: (t) => `Tổng cộng ${t}` }}
                        scroll={{ x: 'max-content' }}
                      >
                        <Table.Column
                          title="STT"
                          key="stt"
                          dataIndex="__stt"
                          width={60}
                          align="center"
                          render={(v: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{v}</span>}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })}
                        />
                        <Table.Column
                          title="Vĩ độ (N)"
                          key="lat"
                          render={(_: any, record: any) => {
                            const dd = record.lat || 0;
                            const d = Math.floor(dd);
                            const m = Math.floor((dd - d) * 60);
                            const s = ((dd - d - m / 60) * 3600);
                            return (
                              <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                <InputNumber value={d} min={0} max={90} placeholder="Độ"
                                  onChange={(v) => setUpdateGpsCoordList(updateGpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lat: Number(v ?? 0) } : g))}
                                  style={{ flex: 1 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>°</span>
                                <InputNumber value={m} min={0} max={59} placeholder="Phút"
                                  onChange={(v) => setUpdateGpsCoordList(updateGpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lat: d + (Number(v ?? 0)) / 60 } : g))}
                                  style={{ flex: 1 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>'</span>
                                <InputNumber value={Math.round(s * 100) / 100} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber}
                                  onChange={(v) => setUpdateGpsCoordList(updateGpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lat: d + m / 60 + (Number(v ?? 0)) / 3600 } : g))}
                                  style={{ flex: 1.2 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>{'"'}</span>
                              </Space.Compact>
                            );
                          }}
                          onHeaderCell={() => ({
                            style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                          })}
                        />
                        <Table.Column
                          title="Kinh độ (E)"
                          key="lng"
                          render={(_: any, record: any) => {
                            const dd = record.lng || 0;
                            const d = Math.floor(dd);
                            const m = Math.floor((dd - d) * 60);
                            const s = ((dd - d - m / 60) * 3600);
                            return (
                              <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                <InputNumber value={d} min={0} max={180} placeholder="Độ"
                                  onChange={(v) => setUpdateGpsCoordList(updateGpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lng: Number(v ?? 0) } : g))}
                                  style={{ flex: 1 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>°</span>
                                <InputNumber value={m} min={0} max={59} placeholder="Phút"
                                  onChange={(v) => setUpdateGpsCoordList(updateGpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lng: d + (Number(v ?? 0)) / 60 } : g))}
                                  style={{ flex: 1 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>'</span>
                                <InputNumber value={Math.round(s * 100) / 100} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber}
                                  onChange={(v) => setUpdateGpsCoordList(updateGpsCoordList.map((g, idx) => idx === record._idx ? { ...g, lng: d + m / 60 + (Number(v ?? 0)) / 3600 } : g))}
                                  style={{ flex: 1.2 }} controls={false} />
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '0 6px',
                                  background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0,
                                  fontSize: fontSizeSm, color: textTertiary,
                                }}>{'"'}</span>
                              </Space.Compact>
                            );
                          }}
                          onHeaderCell={() => ({
                            style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' },
                          })}
                        />
                        <Table.Column
                          title=""
                          key="actions"
                          width={44}
                          align="center"
                          render={(_: any, record: any) => (
                            <Button type="link" danger size="small" icon={<DeleteOutlined />}
                              onClick={() => setUpdateGpsCoordList(updateGpsCoordList.filter((_, idx) => idx !== record._idx))} />
                          )}
                          onHeaderCell={() => ({
                            style: { background: colors.bodyBg, padding: '12px 6px' },
                          })}
                        />
                      </Table>
                    )}
                  </div>
                ),
              },
              {
                key: 'attachments',
                label: 'File đính kèm',
                children: (
                  <ScadaFilesTab uploadFileList={uploadFileList} setUploadFileList={setUploadFileList} entityId={updateTarget?.id} />
                ),
              },
            ]}
          />
        </Form>
      </Drawer>

      {/* ── History Drawer ─────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        size={isIframeModal ? '100%' : 880}
        mask={!isIframeModal}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyEntityName ? `Lịch sử thay đổi — ${historyEntityName}` : 'Lịch sử thay đổi'}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>{hasMoreHistory ? `Đã tải ${historyFieldCount}+` : `Tổng cộng ${historyFieldCount}`}</span>
            </Space>
          </div>
        }
        open={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        extra={<Button type="text" onClick={() => setHistoryModalVisible(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}>
        <div style={{ display: 'flex', gap: spaceSm, alignItems: 'center', paddingBottom: spaceMd }}>
          <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)} style={{ flex: 1 }} />
          <DatePicker placeholder="Từ ngày" value={historyDateFrom ? dayjs(historyDateFrom) : null}
            onChange={(d) => setHistoryDateFrom(d ? d.startOf('minute').format('YYYY-MM-DDTHH:mm:ss') : '')}
            style={{ width: 170 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
          <DatePicker placeholder="Đến ngày" value={historyDateTo ? dayjs(historyDateTo) : null}
            onChange={(d) => setHistoryDateTo(d ? d.endOf('minute').format('YYYY-MM-DDTHH:mm:ss') : '')}
            style={{ width: 170 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
          <Button type="primary" loading={loadingHistory} onClick={() => setHistoryReloadToken((t) => t + 1)}>Tìm kiếm</Button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {loadingHistory && historyRecords.length === 0 ? <LoadingSkeleton rows={5} /> : historyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>{historySearch || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div></div>
          ) : (
            <>
              {renderScadaHistoryTimeline(historyRecords)}
              {loadingMoreHistory && <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm...</div>}
            </>
          )}
        </div>
      </Drawer>
    </ThemeTokenProvider>
  );
};

export default ScadaListPage;
