import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fmtNum } from "../../utils/numFmt";
import { parseWktToCoordinates, serializeCoordinatesToWkt, adjustCoordinateListForGeometry, ddToDms } from "../../utils/gisGeometry";
import { usePermissionStore } from "../../store/permissionStore";
import {
  Alert,
  Button,
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
} from "antd";
import { OrgUnitTreeSelect } from "../../components/org-unit";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Tabs } from "antd";
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from "../../components/shared/InfrastructureAttachmentTab";
import GisLocationSelector from "../../components/gis/GisLocationSelector";
import { DetailTable } from "../../components/shared/DetailTable";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_OPERATING_ORGANIZATIONS } from "../operatingOrganizationsData";
import {
  fetchTransmissionList,
  fetchTransmissionById,
  deleteTransmission,
  submitTransmission,
  approveTransmissionC1,
  approveTransmissionC2,
  createTransmission,
  updateTransmission,
  generateTransmissionCode,
  fetchTransmissionHistory,
  fetchTransmissionAttachments,
  uploadTransmissionAttachment,
  deleteTransmissionAttachment,
  downloadTransmissionAttachment,
} from "./api";
import {
  OPERATIONAL_STATUS_OPTIONS,
} from "./schema";
import type { TransmissionResponse, ApprovalRequest, CreateTransmissionRequest } from "./types";
import toast from "../../components/ToastNotification";
import ApprovalModal from "../../components/shared/ApprovalModal";
import { canEditApprovalRecord, canDeleteApprovalRecord } from "../../utils/approvalEditPolicy";
import { cellTitleStyle, cellSubtitleStyle } from "../../themetokenchk";
import * as themeTokenChk from "../../themetokenchk";
import { ThemeTokenProvider, THEME_SCOPE_CLASS } from "../../context/ThemeTokenContext";
import { useAuthStore } from "../../store/authStore";
import { deduplicateAttachmentHistoryChanges } from "../../utils/historyAttachmentDedup";
import { gisCoordinatesToLines, gisGeometryTypeLabel, isGisHistoryField } from "../../utils/historyGisFormat";
import EmptyState from "../../components/EmptyState";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { VIETNAM_PROVINCES } from "../../types/common";
import api from "../api";
import type { Symbol as MapSymbolType } from "../symbolService";
import {
  ScreenHeader,
  DataTable,
  Pagination,
  FilterTableLayout,
} from "../../components/list-view";

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
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
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
  surfacePage,
  radiusPill,
  radiusSm,
  fontSans,
  spaceMd,
  spaceFormField,
  spaceSm,
  spaceLg,
  spaceXs,
  spaceXl,
  DRAWER_TABLE_SCROLL_Y,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  drawerGisControlBoxStyle,
  readonlyInputStyle,
  selectStyle,
  inputStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  statusBadgeStyle,
  getRangePickerProps,
  icons,
  statusInfo,
  tableHeaderBg,
} from "../../themetokenchk";
import dayjs from "dayjs";

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
function renderTransmissionStatusBadge(b: { color: string; label: string }) {
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
  return <span style={statusBadgeStyle(color)}>{display}</span>;
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

// Normalize form geometryType ('POINT' | 'LINE' | 'POLYGON') — fallback POINT khi chưa chọn
const normalizeGeometryType = (value: unknown): 'POINT' | 'LINE' | 'POLYGON' =>
  value === 'LINE' || value === 'POLYGON' ? value : 'POINT';

/** Suy luận loại hình học từ WKT khi response không trả geometryType chuẩn */
const inferGeometryTypeFromWkt = (wkt?: string | null): 'POINT' | 'LINE' | 'POLYGON' => {
  if (!wkt) return 'POINT';
  const u = String(wkt).toUpperCase().trim();
  if (u.startsWith('LINESTRING') || u.startsWith('LINE ')) return 'LINE';
  // MULTIPOINT dữ liệu legacy chứa các đỉnh vùng → hiển thị như POLYGON (chuẩn gisGeometry)
  if (u.startsWith('POLYGON') || u.startsWith('MULTIPOINT') || u.startsWith('MULTIPOLYGON') || u.startsWith('MULTILINESTRING')) return 'POLYGON';
  return 'POINT';
};

type TransmissionGpsRow = { latitude: number | null; longitude: number | null };

/**
 * Tab GIS 'Thông tin vị trí' trong Drawer Tạo mới/Chỉnh sửa — chuẩn /vts-operation-center:
 * khung drawerGisControlBoxStyle (Loại đối tượng/Biểu tượng/Hệ quy chiếu/Quy tắc hiển thị)
 * + thanh 'Tọa độ' + DetailTable DMS (DRAWER_TABLE_SCROLL_Y.withGisForm).
 * Dùng chung 2 chế độ create/update (props phân biệt state + handler của từng form).
 */
function TransmissionGisTab({
  geometryType,
  rows,
  symbols,
  renderDms,
  onAddRow,
  onDeleteRow,
  onOpenMap,
}: {
  geometryType?: string | null;
  rows: TransmissionGpsRow[];
  symbols: MapSymbolType[];
  renderDms: (index: number, field: 'latitude' | 'longitude', row: TransmissionGpsRow) => React.ReactNode;
  onAddRow: () => void;
  onDeleteRow: (index: number) => void;
  onOpenMap: () => void;
}) {
  const geom = normalizeGeometryType(geometryType);
  const isPoint = geom === 'POINT';
  const minCount = geom === 'POLYGON' ? 3 : geom === 'LINE' ? 2 : 1;
  // POINT chỉ hiển thị đúng 1 dòng đầu (slice(0,1)); LINE/POLYGON hiện toàn bộ
  const shown = (isPoint ? rows.slice(0, 1) : rows).map((c, i) => ({ ...c, _idx: i }));
  const gisLabel = (text: string) => (
    <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>{text}</span>
  );
  return (
    <div>
      <div style={drawerGisControlBoxStyle}>
        <Row gutter={[24, 0]} style={{ height: 68, marginBottom: 8 }}>
          <Col span={12}>
            <Form.Item label={gisLabel('Loại đối tượng')} name="geometryType" style={{ marginBottom: 0 }}>
              <Select
                placeholder="Chọn loại đối tượng"
                allowClear
                options={[
                  { value: 'POINT', label: 'Đối tượng điểm' },
                  { value: 'LINE', label: 'Đối tượng đường' },
                  { value: 'POLYGON', label: 'Đối tượng vùng' },
                ]}
                style={{ ...selectStyle, height: 38 }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={gisLabel('Biểu tượng')} name="mapSymbolId" style={{ marginBottom: 0 }}>
              <Select
                placeholder="Chọn biểu tượng bản đồ"
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={!geometryType}
                style={{ ...selectStyle, height: 38 }}
              >
                {symbols.map((sym) => (
                  <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                    <Space size={6} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {sym.image ? (
                        <img
                          src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                          alt={sym.name}
                          style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle' }}
                        />
                      ) : (
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: actionPrimary }} />
                      )}
                      <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]} style={{ height: 68, marginBottom: 8 }}>
          <Col span={12}>
            <Form.Item label={gisLabel('Hệ quy chiếu')} name="coordinateSystem" style={{ marginBottom: 0 }}>
              <Select
                placeholder="Chọn hệ quy chiếu"
                options={[
                  { value: 1, label: 'WGS-84' },
                  { value: 2, label: 'VN-2000' },
                ]}
                style={{ ...selectStyle, height: 38 }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={gisLabel('Quy tắc hiển thị')} name="displayRule" style={{ marginBottom: 0 }}>
              <Input disabled style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 38 }} />
            </Form.Item>
          </Col>
        </Row>
        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32, boxSizing: 'border-box' }}>
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
            Tọa độ
          </span>
          <Space>
            <Button
              icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
              onClick={onOpenMap}
              style={{ borderRadius: radiusPill, height: 32, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: actionPrimary, color: actionPrimary }}
            >
              Chọn vị trí trên bản đồ
            </Button>
            {!isPoint && rows.length > 0 && (
              <Button type="primary" icon={<PlusOutlined />} onClick={onAddRow} style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 32 }}>
                Thêm tọa độ
              </Button>
            )}
          </Space>
        </div>
      </div>
      <DetailTable
        scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
        dataSource={shown}
        emptyText="Chưa có tọa độ nào"
        rowKey="_idx"
        columns={[
          {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center',
            render: (_: any, __: any, i: number) => (
              <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>
            ),
          },
          {
            title: 'Vĩ độ (N)',
            key: 'lat',
            render: (_: any, r: any) => renderDms(r._idx, 'latitude', r),
          },
          {
            title: 'Kinh độ (E)',
            key: 'lng',
            render: (_: any, r: any) => renderDms(r._idx, 'longitude', r),
          },
          {
            title: '',
            key: 'actions',
            width: 50,
            align: 'center' as const,
            render: (_: any, r: any) => {
              if (isPoint) return null;
              // Chỉ cho xóa khi còn trên số điểm tối thiểu (LINE 2 / POLYGON 3)
              if (rows.length <= minCount) return null;
              return (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                  style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => onDeleteRow(r._idx)}
                  title="Xóa tọa độ"
                />
              );
            },
          },
        ]}
      />
    </div>
  );
}

const TransmissionListPage = () => {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get("action");
  const linkedRecordId = searchParams.get("id");
  const isIframeModal = window.parent !== window.self;
  const isMapLinkedView = isIframeModal && (linkedAction === "edit" || linkedAction === "detail");
  const handledLinkedRecordRef = useRef<string | null>(null);

  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [data, setData] = useState<TransmissionResponse[]>([]);
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
    attachedInfraId: "" as string | undefined,
    yearOfUse: undefined as number | undefined,
    updatedFrom: "" as string | undefined,
    updatedTo: "" as string | undefined,
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
        fetchTransmissionList({
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
  const [detailFiles, setDetailFiles] = useState<InfrastructureAttachmentItem[]>([]);
  const [detailFilesLoading, setDetailFilesLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TransmissionResponse | null>(
    null
  );

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<TransmissionResponse | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<TransmissionResponse | null>(null);
  const [rejectForm] = Form.useForm();
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<TransmissionResponse | null>(null);
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

  // GPS coordinates for create drawer (chuẩn /vts-operation-center: decimal latitude/longitude)
  const [gpsCoordList, setGpsCoordList] = useState<TransmissionGpsRow[]>([]);

  // Attachments state (chuẩn InfrastructureAttachmentTab — upload thực hiện lúc submit)
  const [createAttachments, setCreateAttachments] = useState<InfrastructureAttachmentItem[]>([]);
  const [createPendingFiles, setCreatePendingFiles] = useState<File[]>([]);
  const [updateAttachments, setUpdateAttachments] = useState<InfrastructureAttachmentItem[]>([]);
  const [updatePendingFiles, setUpdatePendingFiles] = useState<File[]>([]);
  const [updatePendingDeleted, setUpdatePendingDeleted] = useState<Array<{ id: string; fileName: string }>>([]);
  // Modal bản đồ GIS dùng chung: 'create' | 'update' (chọn tọa độ) | 'detail' (chỉ xem)
  const [mapScope, setMapScope] = useState<'create' | 'update' | 'detail' | null>(null);

  // Update modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<TransmissionResponse | null>(null);
  const [updateForm] = Form.useForm();
  const [updateLoading, setUpdateLoading] = useState(false);
  // Hành động footer update (chuẩn VTS): Lưu tạm / Lưu và gửi phê duyệt / Lưu và phê duyệt
  const [updateActionType, setUpdateActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const updateActionTypeRef = useRef<'draft' | 'submit' | 'approve'>('draft');

  // "Lưu và phê duyệt" chỉ dành cho tài khoản có quyền duyệt cấp Cục (chuẩn VTS).
  const canSaveAndApprove = !!hasPerm?.("transmission:approvec2");

  // Reactive watch for attached infrastructure dropdown
  const updateAttachedType = Form.useWatch('attachedInfrastructureType', updateForm);
  const updateGeometryType = Form.useWatch('geometryType', updateForm);

  // GPS coordinates for edit drawer (chuẩn /vts-operation-center: decimal latitude/longitude)
  const [updateGpsCoordList, setUpdateGpsCoordList] = useState<TransmissionGpsRow[]>([]);

  // Auto-fill Hệ quy chiếu + Quy tắc hiển thị + GPS khi chọn Loại đối tượng
  // (giống /vts-operation-center: adjustCoordinateListForGeometry bảo toàn các điểm đã nhập)
  useEffect(() => {
    if (!createGeometryType) {
      createForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      setGpsCoordList([]);
      return;
    }
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    setGpsCoordList((prev) => adjustCoordinateListForGeometry(prev, String(createGeometryType)));
  }, [createGeometryType, createForm]);

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
    setUpdateGpsCoordList((prev) => adjustCoordinateListForGeometry(prev, String(updateGeometryType)));
  }, [updateGeometryType, updateForm]);

  // ── GPS DMS editing helpers (chuẩn /vts-operation-center) ────────────
  const updateGpsPoint = (
    setList: React.Dispatch<React.SetStateAction<TransmissionGpsRow[]>>,
    index: number,
    field: 'latitude' | 'longitude',
    dVal: number | null,
    mVal: number | null,
    sVal: number | null,
  ) => {
    const d = dVal ?? 0;
    const m = mVal ?? 0;
    const s = sVal ?? 0;
    const dMax = field === 'latitude' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, d));
    const mClamped = Math.min(59, Math.max(0, m));
    const sClamped = Math.min(59.9999, Math.max(0, s));
    const decimal = dClamped + mClamped / 60 + sClamped / 3600;
    setList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: decimal };
      return next;
    });
  };

  const renderGpsDmsEditor = (
    setList: React.Dispatch<React.SetStateAction<TransmissionGpsRow[]>>,
    index: number,
    field: 'latitude' | 'longitude',
    row: TransmissionGpsRow,
  ) => {
    const value = field === 'latitude' ? (row.latitude ?? 0) : (row.longitude ?? 0);
    const dms = ddToDms(value);
    const maxD = field === 'latitude' ? 90 : 180;
    return (
      <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
        <InputNumber
          value={dms.d}
          min={0}
          max={maxD}
          precision={0}
          placeholder="Độ"
          controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGpsPoint(setList, index, field, x, dms.m, dms.s)}
          style={{ flex: 1, minWidth: 0, textAlign: 'center' }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: tableHeaderBg, border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
        <InputNumber
          value={dms.m}
          min={0}
          max={59}
          precision={0}
          placeholder="Phút"
          controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGpsPoint(setList, index, field, dms.d, x, dms.s)}
          style={{ flex: 1, minWidth: 0, textAlign: 'center' }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: tableHeaderBg, border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
        <InputNumber
          value={dms.s}
          min={0}
          max={59.9999}
          step={0.01}
          placeholder="Giây"
          controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGpsPoint(setList, index, field, dms.d, dms.m, x)}
          style={{ flex: 1.2, minWidth: 0, textAlign: 'center' }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: tableHeaderBg, border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span>
      </Space.Compact>
    );
  };

  // ── Attachments helpers (chuẩn InfrastructureAttachmentTab /vts-operation-center) ──
  const handleAttachmentUpload = (
    list: InfrastructureAttachmentItem[],
    setList: React.Dispatch<React.SetStateAction<InfrastructureAttachmentItem[]>>,
    setPending: React.Dispatch<React.SetStateAction<File[]>>,
  ) => (file: File) => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB theo quy định'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
      toast.error('Định dạng không hỗ trợ (chỉ chấp nhận PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF)');
      return false;
    }
    if (list.length >= 10) { toast.error('Số lượng tệp đính kèm tối đa là 10 tệp'); return false; }
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const item: InfrastructureAttachmentItem = {
      id: tempId,
      fileName: file.name,
      fileSize: file.size,
      uploadedByName: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
      uploadedDate: new Date().toISOString(),
    };
    setPending((prev) => [...prev, file]);
    setList((prev) => [...prev, item]);
    toast.success(`Đã thêm tệp ${file.name}`);
    return false;
  };

  const handleAttachmentDelete = (
    list: InfrastructureAttachmentItem[],
    setList: React.Dispatch<React.SetStateAction<InfrastructureAttachmentItem[]>>,
    setPending: React.Dispatch<React.SetStateAction<File[]>>,
    setPendingDeleted?: React.Dispatch<React.SetStateAction<Array<{ id: string; fileName: string }>>>,
  ) => (attId: string) => {
    const idx = list.findIndex((a) => a.id === attId);
    const isTemp = String(attId).startsWith('temp_');
    if (isTemp && idx >= 0) {
      setPending((prev) => prev.filter((_, i) => i !== idx));
    } else if (!isTemp) {
      const target = list.find((a) => a.id === attId);
      if (target && setPendingDeleted) {
        setPendingDeleted((prev) => [...prev, { id: attId, fileName: target.fileName }]);
      }
    }
    setList((prev) => prev.filter((a) => a.id !== attId));
    toast.success('Đã xóa tệp đính kèm');
  };

  const handleDownloadAttachmentItem = useCallback(async (attId: string, fileName?: string) => {
    const downloadName = fileName || 'file';
    const targetId = selectedRecord?.id || updateTarget?.id;
    if (!targetId) {
      toast.error('Không thể tải xuống tệp đính kèm');
      return;
    }
    try {
      await downloadTransmissionAttachment(targetId, attId, downloadName);
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  }, [selectedRecord?.id, updateTarget?.id]);

  // ── Map modal GIS (chuẩn /vts-operation-center: 90vw GisLocationSelector) ──
  const mapGeometryType = mapScope === 'create' ? (String(createGeometryType || '') || 'POINT')
    : mapScope === 'update' ? (String(updateGeometryType || '') || 'POINT')
    : selectedRecord
      ? (selectedRecord.geometryType && ['POINT', 'LINE', 'POLYGON'].includes(selectedRecord.geometryType)
        ? selectedRecord.geometryType
        : inferGeometryTypeFromWkt(selectedRecord.coordinates))
      : 'POINT';
  const mapWkt = mapScope === 'create' ? serializeCoordinatesToWkt(gpsCoordList, mapGeometryType)
    : mapScope === 'update' ? serializeCoordinatesToWkt(updateGpsCoordList, mapGeometryType)
    : (selectedRecord?.coordinates || '');

  // Submissions
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitContent, setSubmitContent] = useState("");
  const [submittingRecord, setSubmittingRecord] = useState<TransmissionResponse | null>(
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
  const [historySearchInput, setHistorySearchInput] = useState('');
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
            style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
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
        render: (_: unknown, __: TransmissionResponse, index: number) => (
          <span style={{ ...tableMetaStyle, fontWeight: fontWeightMedium }}>
            {page * pageSize + index + 1}
          </span>
        ),
      },
      {
        key: "deviceName",
        label: "Tên / Mã thiết bị",
        dataIndex: "deviceName",
        width: 300,
        fixed: "left" as const,
        sortable: true,
        sortOrder: sortField === "deviceName" ? sortOrder : null,
        ellipsis: false,
        render: (val: string, record: TransmissionResponse) => (
          <div style={{ minWidth: 0 }}>
            <button
              type="button"
              onClick={() => {
                setSelectedRecord(record);
                setDetailDrawerOpen(true);
              }}
              style={{ ...cellTitleStyle, background: "none", border: "none", padding: 0, textAlign: "left", fontFamily: "inherit", width: "100%" }}
              title={val || "—"}
            >
              {val || "—"}
            </button>
            <span style={{ ...cellSubtitleStyle }}>{record.deviceCode || "—"}</span>
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
        width: 140,
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
        width: 220,
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
        render: (_: unknown, record: TransmissionResponse) => renderInfoStack(record.updatedByName, record.updatedAt),
      },
      {
        key: "submittedInfo",
        label: "Cán bộ gửi phê duyệt",
        dataIndex: "submittedByName",
        width: 230,
        render: (_: unknown, record: TransmissionResponse) => renderInfoStack(record.submittedByName, record.submittedDate),
      },
      {
        key: "approvedLevel1Info",
        label: "Cán bộ phê duyệt cấp Cảng vụ/Chi cục",
        dataIndex: "approverLevel1Name",
        width: 380,
        render: (_: unknown, record: TransmissionResponse) => renderInfoStack(record.approverLevel1Name, record.approvedDateLevel1),
      },
      {
        key: "approvedLevel2Info",
        label: "Cán bộ phê duyệt cấp Cục",
        dataIndex: "approverLevel2Name",
        width: 270,
        render: (_: unknown, record: TransmissionResponse) => renderInfoStack(record.approverLevel2Name, record.approvedDateLevel2),
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
          return (<span style={statusBadgeStyle(s.color)}>{s.label}</span>);
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
      // Mã legacy (dữ liệu cũ) quy đổi về mã chuẩn 7 trạng thái rồi tra nhãn dùng chung.
      const ALIAS: Record<string, string> = {
        NHAP: 'DRAFT',
        PROPOSED: 'PENDING_APPROVAL',
        PENDING: 'PENDING_APPROVAL',
        CHO_PHE_DUYET: 'PENDING_APPROVAL',
        CHO_PD_CAP_CUC: 'APPROVED_LEVEL1',
        APPROVED_L1: 'APPROVED_LEVEL1',
        APPROVED_LEVEL2: 'APPROVED',
        APPROVED_L2: 'APPROVED',
        DA_PHE_DUYET: 'APPROVED',
        DUC_PHI_DUYET: 'APPROVED',
        REJECTED: 'REJECTED_LEVEL1',
        TU_CHOI: 'REJECTED_LEVEL1',
      };
      const m: Record<string, string> = {
        DRAFT: 'Lưu tạm',
        PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
        APPROVED_LEVEL1: 'Chờ Cục duyệt',
        APPROVED: 'Đã duyệt',
        REJECTED_LEVEL1: 'Cảng vụ trả về',
        REJECTED_LEVEL2: 'Cục trả về',
      };
      const norm = ALIAS[String(val || '').trim().toUpperCase()] || String(val || '').trim().toUpperCase();
      return m[norm] || val;
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

  const resolveHistoryActionMeta = (item: any): { label: string; color: string; bg: string } => {
    const rawStatus = String(item?.status ?? item?.action ?? '').toUpperCase();
    const rawReason = String(item?.reason ?? '').toLowerCase();
    const rawField = String(item?.changedField ?? item?.fieldName ?? '').toLowerCase();
    if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
      return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}15` };
    }
    if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || (rawField.includes('đính kèm') && rawReason.includes('tải'))) {
      return { label: 'Tải lên tệp', color: statusInfo, bg: `${statusInfo}15` };
    }
    if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xoa tai lieu') || rawReason.includes('xóa tệp')) {
      return { label: 'Xóa tệp', color: statusAttention, bg: `${statusAttention}15` };
    }
    // Xóa bản ghi (soft delete)
    if (rawStatus === 'DELETED' || rawStatus === 'ARCHIVED' || rawStatus === 'DELETE' || rawReason.includes('xóa bản ghi') || rawReason.includes('xoa ban ghi')) {
      return { label: 'Xóa', color: textTertiary, bg: `${textTertiary}15` };
    }

    // Gửi phê duyệt — kiểm tra trước nhánh phê duyệt (lý do gửi có thể chứa từ "phê duyệt")
    if (rawStatus === 'SUBMITTED' || rawStatus === 'PROPOSED' || rawStatus === 'PENDING' || rawStatus === 'PENDING_APPROVAL' || rawReason.includes('gửi phê duyệt') || rawReason.includes('gui phe duyet') || rawReason.includes('trình duyệt') || rawReason.includes('trinh duyet')) {
      return { label: 'Gửi phê duyệt', color: statusAttention, bg: `${statusAttention}15` };
    }

    // Từ chối — phân biệt cấp (Cảng vụ/Chi cục = vòng 1, Cục = vòng 2)
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawStatus === 'REJECTED_LEVEL1' || rawStatus === 'REJECTED_LEVEL2' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      const levelRaw = String(item?.approvalLevel ?? '').toUpperCase();
      const isLevel2 = levelRaw === '2' || levelRaw.includes('LEVEL_2') || levelRaw === 'C2' || levelRaw.includes('CUC');
      const isLevel1 = levelRaw === '1' || levelRaw.includes('LEVEL_1') || levelRaw === 'C1' || levelRaw.includes('CANG_VU');
      if (rawStatus === 'REJECTED_LEVEL2' || isLevel2 || rawReason.includes('cấp cục') || rawReason.includes('cap cuc')) {
        return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}15` };
      }
      if (rawStatus === 'REJECTED_LEVEL1' || isLevel1 || rawReason.includes('cấp cảng vụ') || rawReason.includes('cap cang vu') || rawReason.includes('chi cục')) {
        return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}15` };
      }
      return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}15` };
    }

    // Phê duyệt — phân biệt cấp (C1 Cảng vụ/Chi cục → C2 Cục)
    if (rawStatus === 'APPROVED' || rawStatus === 'APPROVE' || rawStatus === 'APPROVED_LEVEL1' || rawStatus === 'APPROVED_LEVEL2') {
      const levelRaw2 = String(item?.approvalLevel ?? '').toUpperCase();
      const isL2 = levelRaw2 === '2' || levelRaw2.includes('LEVEL_2') || levelRaw2 === 'C2' || levelRaw2.includes('CUC');
      const isL1 = levelRaw2 === '1' || levelRaw2.includes('LEVEL_1') || levelRaw2 === 'C1' || levelRaw2.includes('CANG_VU');
      if (rawStatus === 'APPROVED' || rawStatus === 'APPROVED_LEVEL2' || isL2) {
        return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}15` };
      }
      if (rawStatus === 'APPROVED_LEVEL1' || isL1) {
        return { label: 'Phê duyệt cấp Cảng vụ', color: statusInfo, bg: `${statusInfo}15` };
      }
      return { label: 'Phê duyệt', color: statusOperational, bg: `${statusOperational}15` };
    }

    if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('cap nhat')) {
      return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` };
    }
    return { label: 'Chỉnh sửa', color: actionPrimary, bg: `${actionPrimary}15` };
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
        const history = await fetchTransmissionHistory(selectedRecord.id, 0, HISTORY_PAGE_SIZE, {
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
      const history = await fetchTransmissionHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
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

  const renderTransmissionHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort(
      (a: any, b: any) =>
        new Date(historyTimestamp(b) || 0).getTime() -
        new Date(historyTimestamp(a) || 0).getTime()
    );
    const q = historySearch.toLowerCase().trim();

    // Chuẩn /vts-operation-center: gộp nhóm theo ĐÚNG giây (một lần Lưu ghi nhiều dòng cùng
    // thời điểm) và merge liên tiếp các hành động dạng update (UPDATED/đính kèm) cùng người dùng.
    const isUpdateAction = (status: string, reason?: string) => {
      const s = String(status || '').toUpperCase();
      const r = String(reason || '').toLowerCase();
      return s === 'UPDATED' || s === 'UPDATE' || s === 'EDIT' || s === 'ATTACHMENT_UPLOADED' || s === 'ATTACHMENT_DELETED'
        || r.includes('cập nhật') || r.includes('chỉnh sửa') || r.includes('tải lên') || r.includes('xóa tệp') || r.includes('xóa tài liệu');
    };

    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];

    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r);
      const isBothUpdate = prev && isUpdateAction(prev.status, prev.items[0]?.reason) && isUpdateAction(r.status, r.reason);
      const isSameGroup = prev && prev.tsSec === sec && prev.actor === actor && (prev.status === r.status || isBothUpdate);
      if (isSameGroup)
        prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor, status: r.status, approvalLevel: r.approvalLevel, items: [r] });
    }

    if (groups.length === 0)
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
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
            'Cục Hàng hải Việt Nam';
          // Chuẩn /vts-operation-center: dedup thay đổi đính kèm (upload/delete cùng lúc).
          const changes = deduplicateAttachmentHistoryChanges(
            g.items.flatMap((item: any) => {
              const fn = historyField(item);
              return fn ? [{ field: fn, oldValue: historyOldValue(item), newValue: historyNewValue(item) }] : [];
            })
          );
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
            // GIS: nhãn loại đối tượng + tọa độ DMS nhiều dòng (chuẩn /cctv).
            const gisKey = String(fn || '').toLowerCase();
            if (gisKey.includes('loai doi tuong') || gisKey.includes('loại đối tượng') || gisKey.includes('geometrytype')) {
              return gisGeometryTypeLabel(raw);
            }
            if (gisKey.includes('toa do') || gisKey.includes('tọa độ') || gisKey.includes('coordinates')) {
              const coords = gisCoordinatesToLines(raw);
              if (coords != null) return coords;
            }
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
                display: 'grid',
                gridTemplateColumns: 'minmax(310px, 0.38fr) minmax(0, 1fr)',
                gap: spaceLg,
                alignItems: 'start',
                marginBottom: gi < groups.length - 1 ? spaceMd : 0,
              }}
            >
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceXs }}>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeLg - 1, color: textPrimary, fontWeight: fontWeightBold, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                    {g.ts ? fmtTime(g.ts) : '—'}
                  </Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>
                      {actionMeta.label}
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: spaceXs }}>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                    Người cập nhật: <span style={{ color: textPrimary, fontWeight: fontWeightBold }}>{g.actor || '—'}</span>
                  </Typography.Text>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                    Đơn vị: <span style={{ color: textPrimary }}>{unitName}</span>
                  </Typography.Text>
                </div>
              </div>
              <div style={{ position: 'relative', minWidth: 0, background: surfacePage, borderRadius: radiusSm, padding: `${spaceMd}px ${spaceLg}px`, paddingLeft: spaceLg, overflow: 'hidden', border: `1px solid ${borderDefault}` }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: spaceXs, background: `linear-gradient(180deg, ${actionMeta.color} 0%, ${actionMeta.color}40 100%)` }} />
                <Typography.Text style={{ display: 'block', color: colors.sidebarBg, fontSize: fontSizeMd, fontWeight: fontWeightBold, marginBottom: spaceSm }}>{informationTitle}</Typography.Text>
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
                            display: 'grid',
                            gridTemplateColumns: '170px minmax(100px, 1fr)',
                            alignItems: 'flex-start',
                            gap: spaceSm,
                            fontSize: fontSizeMd,
                            lineHeight: 1.6,
                            padding: '3px 0',
                          }}
                        >
                          <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>
                            {fn ? `${historyFieldName(fn)}:` : '—'}
                          </div>
                          <div title={nv ?? '—'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary, ...(isGisHistoryField(fn) ? { whiteSpace: 'pre-line' as const, lineHeight: 1.5 } : {}) }}>
                            {renderCell(change.newValue) ?? nv ?? '—'}
                          </div>
                        </div>
                      ) : (
                        <div
                          key={`${fn}-${ri}`}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '170px minmax(100px, 1fr) 24px minmax(100px, 1fr)',
                            alignItems: 'flex-start',
                            gap: spaceSm,
                            fontSize: fontSizeMd,
                            lineHeight: 1.6,
                            padding: '3px 0',
                          }}
                        >
                          <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>
                            {fn ? `${historyFieldName(fn)}:` : '—'}
                          </div>
                          <div title={ov ?? '—'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary, ...(isGisHistoryField(fn) ? { whiteSpace: 'pre-line' as const, lineHeight: 1.5 } : {}) }}>
                            {renderCell(change.oldValue) ?? ov ?? '—'}
                          </div>
                          <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>→</div>
                          <div title={nv ?? '—'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary, ...(isGisHistoryField(fn) ? { whiteSpace: 'pre-line' as const, lineHeight: 1.5 } : {}) }}>
                            {renderCell(change.newValue) ?? nv ?? '—'}
                          </div>
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

  const openUpdateDrawer = useCallback((record: TransmissionResponse) => {
    setUpdateTarget(record);
    setUpdateAttachments([]);
    setUpdatePendingFiles([]);
    setUpdatePendingDeleted([]);
    void fetchTransmissionAttachments(record.id).then((list: any[]) => {
      setUpdateAttachments(Array.isArray(list)
        ? list.map((a: any) => ({
            id: String(a.id),
            fileName: a.fileName || a.name || '—',
            fileSize: a.fileSize,
            uploadedByName: a.uploadedByName || a.uploadedBy,
            uploadedDate: a.uploadedDate || a.createdAt,
          }))
        : []);
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
    // Preload tọa độ từ WKT trước khi mở Edit (chuẩn /vts-operation-center):
    // nếu không nạp trước, danh sách tọa độ rỗng → lưu sẽ làm mất geometry.
    const geomRaw = record.geometryType;
    const geomValue = (geomRaw === 'POINT' || geomRaw === 'LINE' || geomRaw === 'POLYGON')
      ? geomRaw
      : inferGeometryTypeFromWkt(record.coordinates);
    const preloadedPts = parseWktToCoordinates(record.coordinates || undefined);
    updateForm.setFieldsValue({ geometryType: geomValue, coordinateSystem: safeRecord.coordinateSystem ?? 1 });
    setUpdateGpsCoordList(adjustCoordinateListForGeometry(preloadedPts, geomValue));
    setUpdateModalOpen(true);
  }, [updateForm, setUpdateGpsCoordList, setUpdateModalOpen, setUpdateTarget, setUpdateAttachments, setUpdatePendingFiles, setUpdatePendingDeleted]);

  useEffect(() => {
    if (!isMapLinkedView || !linkedRecordId || !linkedAction) return;

    const requestKey = `${linkedAction}:${linkedRecordId}`;
    if (handledLinkedRecordRef.current === requestKey) return;
    handledLinkedRecordRef.current = requestKey;

    let active = true;
    void fetchTransmissionById(linkedRecordId)
      .then((record) => {
        if (!active) return;
        if (linkedAction === "edit") {
          openUpdateDrawer(record);
        } else {
          setSelectedRecord(record);
          setDetailDrawerOpen(true);
        }
      })
      .catch(() => {
        if (!active) return;
        handledLinkedRecordRef.current = null;
        toast.error("Không thể tải hồ sơ truyền dẫn");
      });

    return () => {
      active = false;
    };
  }, [isMapLinkedView, linkedAction, linkedRecordId, openUpdateDrawer]);

  // ── rowActions callback ──────────────────────────────────────────
  const rowActions = useCallback(
    (record: TransmissionResponse) => {
      const actions: Array<{ key: string; label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }> = [
        {
          key: "view",
          label: "Xem chi tiết",
          icon: icons.view,
          onClick: () => {
            setSelectedRecord(record);
            setDetailDrawerOpen(true);
            setDetailFiles([]);
            setDetailFilesLoading(true);
            void fetchTransmissionAttachments(record.id).then((list: any[]) => {
              setDetailFiles(Array.isArray(list) ? list : []);
            }).catch(() => setDetailFiles([])).finally(() => setDetailFilesLoading(false));
          },
        },
      ];

      // Chỉnh sửa theo policy chuẩn KCHT (approvalEditPolicy): Lưu tạm / Bị trả về / Đã duyệt
      if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: "transmission" })) {
        actions.push({
          key: "edit",
          label: "Chỉnh sửa",
          icon: icons.edit,
          onClick: () => {
            setUpdateTarget(record);
            setUpdateAttachments([]);
            setUpdatePendingFiles([]);
            setUpdatePendingDeleted([]);
            void fetchTransmissionAttachments(record.id).then((list: any[]) => {
              setUpdateAttachments(Array.isArray(list)
                ? list.map((a: any) => ({
                    id: String(a.id),
                    fileName: a.fileName || a.name || '—',
                    fileSize: a.fileSize,
                    uploadedByName: a.uploadedByName || a.uploadedBy,
                    uploadedDate: a.uploadedDate || a.createdAt,
                  }))
                : []);
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
            // Preload tọa độ từ WKT trước khi mở Edit (chuẩn /vts-operation-center):
            // nếu không nạp trước, danh sách tọa độ rỗng → lưu sẽ làm mất geometry.
            const geomRaw = record.geometryType;
            const geomValue = (geomRaw === 'POINT' || geomRaw === 'LINE' || geomRaw === 'POLYGON')
              ? geomRaw
              : inferGeometryTypeFromWkt(record.coordinates);
            const preloadedPts = parseWktToCoordinates(record.coordinates || undefined);
            updateForm.setFieldsValue({ geometryType: geomValue, coordinateSystem: safeRecord.coordinateSystem ?? 1 });
            setUpdateGpsCoordList(adjustCoordinateListForGeometry(preloadedPts, geomValue));
            setUpdateModalOpen(true);
          },
        });
      }

      // Lịch sử thay đổi (mở từ menu hành động dòng)
      actions.push({
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
      });

      // DRAFT / REJECTED_LEVEL1 / REJECTED_LEVEL2 + transmission:update → Gửi phê duyệt (submitTransmission)
      if (
        hasPerm?.("transmission:update") &&
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

      // PENDING_APPROVAL + transmission:approvec1 → Phê duyệt / Từ chối cấp Cảng vụ (C1)
      // Nguyên tắc 4 mắt: người tạo không được tự duyệt hồ sơ do mình tạo (back-end chặn, FE disable).
      if (hasPerm?.("transmission:approvec1") && record.approvalStatus === "PENDING_APPROVAL") {
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

      // APPROVED_LEVEL1 + transmission:approvec2 → Phê duyệt / Từ chối cấp Cục (C2)
      // Nguyên tắc 4 mắt: người đã phê duyệt C1 không được tự duyệt tiếp ở C2.
      if (hasPerm?.("transmission:approvec2") && record.approvalStatus === "APPROVED_LEVEL1") {
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

      // Chỉ hồ sơ "Lưu tạm" mới được xóa (policy chuẩn KCHT)
      if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: "transmission" })) {
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
      const result = await fetchTransmissionList({
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
      await deleteTransmission(deleteTarget.id);
      toast.success("Xóa hệ thống truyền dẫn thành công");
      setDeleteTarget(null);
      setDeleteConfirmText("");
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[transmission] delete error", error); // toast toàn cục đã xử lý ở interceptor api.ts
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
          await approveTransmissionC1(approveTarget.id, payload);
          toast.success("Phê duyệt cấp 1 thành công");
        } else {
          await approveTransmissionC2(approveTarget.id, payload);
          toast.success("Phê duyệt cấp 2 thành công");
        }
        setApproveTarget(null);
        setApproveModalOpen(false);
        fetchData();
        fetchTabCounts();
      } catch (error: unknown) {
        console.error("[transmission] approve error", error); // toast toàn cục đã xử lý ở interceptor api.ts
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
      if (rejectLevel === "c1") await approveTransmissionC1(rejectTarget.id, payload);
      else await approveTransmissionC2(rejectTarget.id, payload);
      toast.success("Từ chối thành công");
      setRejectTarget(null);
      setRejectModalOpen(false);
      rejectForm.resetFields();
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[transmission] reject error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setRejectLoading(false);
    }
  }, [rejectTarget, rejectLevel, rejectForm, fetchData, fetchTabCounts]);

  const handleCreate = useCallback(
    async (values: Record<string, unknown>) => {
      setCreateLoading(true);
      try {
        // Build WKT từ GPS state (chuẩn /vts-operation-center: serializeCoordinatesToWkt)
        const createGeomType = normalizeGeometryType(values.geometryType);
        const coordinates = serializeCoordinatesToWkt(gpsCoordList, createGeomType);

        const payload = {
          ...values,
          deviceCode: values.deviceCode || (await generateTransmissionCode()),
          operationalStatus: values.operationalStatus ?? 1,
          geometryType: createGeomType,
          coordinates: coordinates || undefined,
          // Cột display_rule là INT; chuỗi 'Độ, phút, giây (DMS)' chỉ để hiển thị (giống /port, /pier)
          displayRule: values.displayRule != null ? Number(values.displayRule) || null : undefined,
        } as CreateTransmissionRequest;
        // Chuẩn VTS: tạo theo hành động footer — draft/submit/approve
        // (backend resolveCreateApprovalStatus: DRAFT / PENDING_APPROVAL / APPROVED)
        const currentAction = createActionTypeRef.current;
        const created = await createTransmission({
          ...payload,
          action: currentAction === 'draft' ? 'draft' : currentAction === 'submit' ? 'submit' : 'approve',
        });
        if (created?.id && createPendingFiles.length > 0) {
          for (const f of createPendingFiles) {
            await uploadTransmissionAttachment(created.id, f);
          }
        }
        toast.success(
          currentAction === 'draft'
            ? 'Lưu tạm hệ thống truyền dẫn thành công'
            : currentAction === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : 'Lưu và phê duyệt thành công'
        );
        setCreateModalOpen(false);
        createForm.resetFields();
        setGpsCoordList([]);
        setCreateAttachments([]);
        setCreatePendingFiles([]);
        fetchData();
        fetchTabCounts();
      } catch (error: unknown) {
        console.error("[transmission] create error", error); // toast toàn cục đã xử lý ở interceptor api.ts
      } finally {
        setCreateLoading(false);
      }
    },
    [createForm, fetchData, fetchTabCounts, gpsCoordList, createPendingFiles]
  );

  const handleUpdate = useCallback(
    async (values: Record<string, unknown>) => {
      if (!updateTarget) return;
      setUpdateLoading(true);
      try {
        // Build WKT từ GPS state (chuẩn /vts-operation-center: serializeCoordinatesToWkt)
        const updateGeomType = normalizeGeometryType(updateGeometryType);
        const coordinates = serializeCoordinatesToWkt(updateGpsCoordList, updateGeomType);

        // Chuẩn VTS: Lưu tạm (chỉ update) / Lưu và gửi phê duyệt (update + submit) /
        // Lưu và phê duyệt (update + giữ Đã duyệt — T12 backend)
        const currentAction = updateActionTypeRef.current;
        await updateTransmission({
          id: updateTarget.id,
          ...values,
          geometryType: updateGeomType,
          coordinates: coordinates || undefined,
          // Cột display_rule là INT; chuỗi 'Độ, phút, giây (DMS)' chỉ để hiển thị (giống /port, /pier)
          displayRule: values.displayRule != null ? Number(values.displayRule) || null : undefined,
          ...(currentAction === 'approve' ? { approvalStatus: 'APPROVED' } : {}),
        });
        if (updatePendingFiles.length > 0) {
          for (const f of updatePendingFiles) {
            await uploadTransmissionAttachment(updateTarget.id, f);
          }
        }
        if (updatePendingDeleted.length > 0) {
          for (const d of updatePendingDeleted) {
            await deleteTransmissionAttachment(updateTarget.id, d.id);
          }
        }
        if (currentAction === 'submit') {
          await submitTransmission(updateTarget.id);
        }
        toast.success(
          currentAction === 'draft'
            ? 'Lưu tạm hệ thống truyền dẫn thành công'
            : currentAction === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : 'Lưu và phê duyệt thành công'
        );
        setUpdateModalOpen(false);
        setUpdateTarget(null);
        setUpdateGpsCoordList([]);
        setUpdateAttachments([]);
        setUpdatePendingFiles([]);
        setUpdatePendingDeleted([]);
        fetchData();
        fetchTabCounts();
      } catch (error: unknown) {
        console.error("[transmission] update error", error); // toast toàn cục đã xử lý ở interceptor api.ts
      } finally {
        setUpdateLoading(false);
      }
    },
    [updateTarget, fetchData, fetchTabCounts, updateGpsCoordList, updateGeometryType, updatePendingFiles, updatePendingDeleted]
  );

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    setSubmitLoading(true);
    try {
      await submitTransmission(submittingRecord.id, submitContent.trim() || undefined);
      toast.success("Gửi phê duyệt thành công");
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      setSubmitContent("");
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[transmission] submit error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setSubmitLoading(false);
    }
  }, [submittingRecord, submitContent, fetchData, fetchTabCounts]);

  return (
    <>
      <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[
          { label: "Trang chủ", path: "/" },
          { label: "Quản lý hệ thống truyền dẫn", path: "/transmission" },
        ]}
        actions={[
          hasPerm?.("transmission:create")
            ? {
                key: "create",
                label: "Thêm mới",
                icon: <PlusOutlined />,
                variant: "primary" as const,
                onClick: () => {
                  setCreateAttachments([]);
                  setCreatePendingFiles([]);
                  setCreateModalOpen(true);
                  // Sinh trước mã thiết bị để hiển thị preview (giống Mã cảng biển /port)
                  setDeviceCodeLoading(true);
                  generateTransmissionCode()
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
        errorMessage={isError ?? undefined}
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
                        attachedInfraId: undefined,
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
                        attachedInfraId: val as string | undefined,
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
                        updatedFrom: dates?.[0] ? dates[0].format("YYYY-MM-DD 00:00:00") : undefined,
                        updatedTo: dates?.[1] ? dates[1].format("YYYY-MM-DD 23:59:59") : undefined,
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
            label: "Từ chối cấp Cảng vụ/Chi cục",
            count: tabCounts["REJECTED_LEVEL1"] ?? 0,
            color: statusCritical,
            active: filterValues.approvalStatus === "REJECTED_LEVEL1",
          },
          {
            key: "REJECTED_LEVEL2",
            label: "Từ chối cấp cục",
            count: tabCounts["REJECTED_LEVEL2"] ?? 0,
            color: statusCritical,
            active: filterValues.approvalStatus === "REJECTED_LEVEL2",
          },
        ]}
        onStatusTabChange={(key) => {
          // Mỗi tab trạng thái lọc đúng 1 mã (từ chối tách 2 tab theo cấp); "Tất cả" bỏ lọc.
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
            <DataTable
              fill
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 'max-content' }}
              onSort={handleSort}
              rowActions={rowActions}
              locale={{
                emptyText: (
                  <EmptyState description="Chưa có dữ liệu hệ thống truyền dẫn" />
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
        rootClassName={THEME_SCOPE_CLASS}
        title={<span style={drawerTitleStyle}>Chi tiết hệ thống truyền dẫn{selectedRecord ? ` - ${selectedRecord.deviceName || selectedRecord.deviceCode || ''}` : ''}</span>}
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
                        { label: 'Tình trạng', value: (() => { const stMap: Record<string, { color: string; label: string }> = { 'NOT_YET_OPERATIONAL': { color: 'orange', label: 'Chưa khai thác/vận hành' }, 'OPERATIONAL': { color: 'green', label: 'Đang khai thác/vận hành' }, 'SUSPENDED': { color: 'red', label: 'Dừng khai thác/vận hành' } }; const st = stMap[String(selectedRecord.operationalStatus || '').toUpperCase()] || { color: textTertiary, label: String(selectedRecord.operationalStatus || '—') }; return renderTransmissionStatusBadge(st); })() },
                        { label: 'Model', value: selectedRecord.model || '—' },
                        { label: 'Hãng sản xuất', value: selectedRecord.manufacturer || '—' },
                        { label: 'Phê duyệt', value: renderApprovalBadge(selectedRecord.approvalStatus) },
                        { label: 'Thông số kỹ thuật', value: selectedRecord.specifications || '—', fullWidth: true },
                        { label: 'Thông tin bảo trì', value: selectedRecord.maintenanceInformation || '—', fullWidth: true },
                        { label: 'Ghi chú', value: selectedRecord.note || '—', fullWidth: true },
                      ] as Array<{ label: string; value: React.ReactNode; badge?: boolean; bold?: boolean; fullWidth?: boolean }>).map((row) => (
                        <div key={row.label} className="chk-detail-row" style={row.fullWidth ? { gridColumn: '1 / -1' } : undefined}>
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
                key: "gis",
                label: "Thông tin vị trí",
                children: (
                  <DetailTable
                    scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                    dataSource={parseWktToCoordinates(selectedRecord.coordinates || '')}
                    emptyText="Không có tọa độ"
                    pageSize={10}
                    headerNode={
                      <>
                        <div className="chk-detail-grid" style={{ marginBottom: 12 }}>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Loại đối tượng</span>
                            <span className="chk-detail-value">{selectedRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : selectedRecord.geometryType === 'LINE' ? 'Đối tượng đường' : selectedRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '—'}</span>
                          </div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Biểu tượng bản đồ</span><span className="chk-detail-value">{selectedRecord.mapSymbolName || '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Hệ quy chiếu</span><span className="chk-detail-value">{selectedRecord.coordinateSystem === 1 ? 'WGS-84' : selectedRecord.coordinateSystem === 2 ? 'VN-2000' : '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Quy tắc hiển thị</span><span className="chk-detail-value">{selectedRecord.displayRule != null ? 'Độ, phút, giây (DMS)' : '—'}</span></div>
                        </div>
                        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>
                            Tọa độ GPS
                          </span>
                          <Button
                            type="primary"
                            icon={<EnvironmentOutlined />}
                            onClick={() => setMapScope('detail')}
                            style={{
                              ...primaryButtonStyle,
                              height: 32,
                              fontSize: fontSizeSm,
                              padding: '0 14px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            Xem vị trí trên bản đồ
                          </Button>
                        </div>
                      </>
                    }
                    columns={[
                      { title: 'STT', width: 60, align: 'center' },
                      {
                        title: 'Vĩ độ (Latitude - N)',
                        key: 'lat',
                        render: (_v: any, r: any) => {
                          const dms = ddToDms(r.latitude);
                          return dms.d !== null && dms.m !== null && dms.s !== null ? `${dms.d}° ${dms.m}' ${dms.s.toFixed(2)}" N` : '—';
                        },
                      },
                      {
                        title: 'Kinh độ (Longitude - E)',
                        key: 'lng',
                        render: (_v: any, r: any) => {
                          const dms = ddToDms(r.longitude);
                          return dms.d !== null && dms.m !== null && dms.s !== null ? `${dms.d}° ${dms.m}' ${dms.s.toFixed(2)}" E` : '—';
                        },
                      },
                    ]}
                  />
                ),
              },
              {
                key: 'operationMaintenance',
                label: 'Vận hành & bảo trì',
                children: (
                  <div style={{ paddingTop: 3 }}>
                    <Tabs
                      size="small"
                      tabBarStyle={{ marginBottom: 0 }}
                      items={[
                        {
                          key: 'operation',
                          label: 'Thông tin vận hành khai thác',
                          children: (
                            <DetailTable
                              columns={[
                                { title: 'STT', width: 60 },
                                { title: 'Mã / Tên kế hoạch', dataIndex: 'planName', key: 'planName', width: 420 },
                                { title: 'Ngày bắt đầu', dataIndex: 'operationStartDate', key: 'operationStartDate', width: 150, align: 'center' },
                                { title: 'Ngày kết thúc', dataIndex: 'operationEndDate', key: 'operationEndDate', width: 150, align: 'center' },
                              ]}
                              dataSource={[]}
                              pageSize={10}
                              emptyText="Chưa có dữ liệu"
                            />
                          ),
                        },
                        {
                          key: 'maintenance',
                          label: 'Thông tin bảo trì',
                          children: (
                            <DetailTable
                              columns={[
                                { title: 'STT', width: 60 },
                                { title: 'Mã / Tên kế hoạch', dataIndex: 'planName', key: 'planName', width: 420 },
                                { title: 'Ngày bắt đầu', dataIndex: 'maintenanceStartDate', key: 'maintenanceStartDate', width: 150, align: 'center' },
                                { title: 'Ngày kết thúc', dataIndex: 'maintenanceEndDate', key: 'maintenanceEndDate', width: 150, align: 'center' },
                              ]}
                              dataSource={[]}
                              pageSize={10}
                              emptyText="Chưa có dữ liệu"
                            />
                          ),
                        },
                        {
                          key: 'incident',
                          label: 'Thông tin sự cố',
                          children: (
                            <DetailTable
                              columns={[
                                { title: 'STT', width: 60 },
                                { title: 'Mã / Tên sự cố', dataIndex: 'incidentName', key: 'incidentName', width: 420 },
                                { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'incidentType', width: 200 },
                                { title: 'Địa điểm', dataIndex: 'incidentLocation', key: 'incidentLocation', width: 240 },
                                { title: 'Thời gian', dataIndex: 'incidentTime', key: 'incidentTime', width: 160, align: 'center' },
                              ]}
                              dataSource={[]}
                              pageSize={10}
                              emptyText="Chưa có dữ liệu"
                            />
                          ),
                        },
                      ]}
                    />
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
                        { key: 'approvalContentLevel1', label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục', value: selectedRecord.approvalContentLevel1 || '—', fullWidth: true },
                        { key: 'approvedDateLevel1', label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', value: selectedRecord.approvedDateLevel1 ? formatDate(selectedRecord.approvedDateLevel1) : '—' },
                        { key: 'approvedByLevel1', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: selectedRecord.approverLevel1Name || '—' },
                        { key: 'approvalContentLevel2', label: 'Nội dung phê duyệt cấp Cục', value: selectedRecord.approvalContentLevel2 || '—', fullWidth: true },
                        { key: 'approvedDateLevel2', label: 'Ngày phê duyệt cấp Cục', value: selectedRecord.approvedDateLevel2 ? formatDate(selectedRecord.approvedDateLevel2) : '—' },
                        { key: 'approvedByLevel2', label: 'Cán bộ phê duyệt cấp Cục', value: selectedRecord.approverLevel2Name || '—' },
                        { key: 'approvalContentExtra', label: 'Lý do từ chối', value: selectedRecord.rejectionReason || '—', fullWidth: true },
                        { key: 'status', label: 'Trạng thái', value: renderApprovalBadge(selectedRecord.approvalStatus), fullWidth: true },
                      ].map((row) => (
                        <div key={row.key} className="chk-detail-row" style={row.fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                          <span className="chk-detail-label">{row.label}</span>
                          <span className="chk-detail-value">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                key: 'files', label: 'File đính kèm',
                children: (
                  <InfrastructureAttachmentTab
                    attachments={detailFiles}
                    readonly
                    isLoading={detailFilesLoading}
                    onDownload={handleDownloadAttachmentItem}
                  />
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* Modal Chọn/Xem tọa độ GIS trên bản đồ — chuẩn /vts-operation-center (90vw, disabled khi xem chi tiết) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              {mapScope === 'detail' ? 'Xem vị trí trên bản đồ' : 'Chọn tọa độ trên bản đồ'}
            </span>
          </div>
        }
        open={mapScope !== null}
        onCancel={() => setMapScope(null)}
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={mapScope === 'detail' ? null : [
          <Button
            key="ok"
            type="primary"
            onClick={() => setMapScope(null)}
            style={{ ...primaryButtonStyle, height: 36, borderRadius: radiusPill }}
          >
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline
            height={560}
            disabled={mapScope === 'detail'}
            value={{
              geometryType: mapGeometryType,
              coordinates: mapWkt,
              symbolId: mapScope === 'update'
                ? updateForm.getFieldValue('mapSymbolId')
                : mapScope === 'create'
                  ? createForm.getFieldValue('mapSymbolId')
                  : selectedRecord?.mapSymbolId || undefined,
            }}
            defaultGeometryType={mapGeometryType as any}
            onChange={(val) => {
              if (mapScope === 'detail') return;
              if (val?.coordinates) {
                const pts = parseWktToCoordinates(val.coordinates);
                if (pts.length > 0) {
                  if (mapScope === 'create') setGpsCoordList(pts);
                  else if (mapScope === 'update') setUpdateGpsCoordList(pts);
                }
              }
              if (val?.geometryType) {
                if (mapScope === 'create') createForm.setFieldValue('geometryType', val.geometryType);
                else if (mapScope === 'update') updateForm.setFieldValue('geometryType', val.geometryType);
              }
            }}
          />
        </div>
      </Modal>

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
                Tôi xác nhận từ chối hệ thống truyền dẫn này
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
        rootClassName={THEME_SCOPE_CLASS}
        title={
          <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
            Thêm mới hệ thống truyền dẫn
          </span>
        }
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
          setGpsCoordList([]);
          setCreateAttachments([]);
          setCreatePendingFiles([]);
        }}
        extra={
          <Button
            type="text"
            onClick={() => {
              setCreateModalOpen(false);
              createForm.resetFields();
              setGpsCoordList([]);
              setCreateAttachments([]);
              setCreatePendingFiles([]);
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
                  <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
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
                            maxLength={255} showCount
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
                            maxLength={500} showCount
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
                          getValueProps={(v: unknown) => ({ value: v != null ? dayjs(String(v), 'YYYY') : null })}
                          normalize={(d: unknown) => (dayjs.isDayjs(d) ? dayjs(d).year() : null)}
                        >
                          <DatePicker
                            picker="year"
                            format="YYYY"
                            placeholder="Chọn năm đưa vào sử dụng"
                            style={{ width: "100%", ...pillStyle }}
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
                          initialValue={1}
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
                            maxLength={255} showCount
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
                            maxLength={50} showCount
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
                        maxLength={2000} showCount
                        style={themeTokenChk.textAreaStyle}
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
                        maxLength={2000} showCount
                        style={themeTokenChk.textAreaStyle}
                      />
                    </Form.Item>
                    <Form.Item
                      name="note"
                      {...labelProps('Ghi chú')}
                      rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Nhập ghi chú..."
                        maxLength={2000} showCount
                        style={themeTokenChk.textAreaStyle}
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
                    <TransmissionGisTab
                      geometryType={createGeometryType}
                      rows={gpsCoordList}
                      symbols={symbols}
                      renderDms={(idx, field, row) => renderGpsDmsEditor(setGpsCoordList, idx, field, row)}
                      onAddRow={() => setGpsCoordList((prev) => [...prev, { latitude: null, longitude: null }])}
                      onDeleteRow={(idx) => setGpsCoordList((p) => p.filter((_, i) => i !== idx))}
                      onOpenMap={() => setMapScope('create')}
                    />
                  </div>
                ),
              },
              {
                key: 'attachments',
                label: 'File đính kèm',
                children: (
                  <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                    <InfrastructureAttachmentTab
                      attachments={createAttachments}
                      onUpload={handleAttachmentUpload(createAttachments, setCreateAttachments, setCreatePendingFiles)}
                      onDelete={handleAttachmentDelete(createAttachments, setCreateAttachments, setCreatePendingFiles)}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Drawer>

      {/* ── Edit Drawer ──────────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        rootClassName={THEME_SCOPE_CLASS}
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
          setUpdateAttachments([]);
          setUpdatePendingFiles([]);
          setUpdatePendingDeleted([]);
        }}
        extra={
          <Button
            type="text"
            onClick={() => {
              setUpdateModalOpen(false);
              setUpdateTarget(null);
              updateForm.resetFields();
              setUpdateGpsCoordList([]);
              setUpdateAttachments([]);
              setUpdatePendingFiles([]);
              setUpdatePendingDeleted([]);
            }}
            style={drawerCloseBtnStyle}
          >
            ✕
          </Button>
        }
        footer={
          <div style={drawerFooterStyle}>
            {updateTarget?.approvalStatus !== 'APPROVED' && (
            <Button
              onClick={() => { updateActionTypeRef.current = 'draft'; setUpdateActionType('draft'); updateForm.submit(); }}
              loading={updateLoading && updateActionType === 'draft'}
              style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
            >
              Lưu tạm
            </Button>
            )}
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
                  <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
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
                            maxLength={255} showCount
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
                            maxLength={500} showCount
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
                          getValueProps={(v: unknown) => ({ value: v != null ? dayjs(String(v), 'YYYY') : null })}
                          normalize={(d: unknown) => (dayjs.isDayjs(d) ? dayjs(d).year() : null)}
                        >
                          <DatePicker
                            picker="year"
                            format="YYYY"
                            placeholder="Chọn năm đưa vào sử dụng"
                            style={{ width: "100%", ...pillStyle }}
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
                            maxLength={255} showCount
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
                            maxLength={50} showCount
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
                        maxLength={2000} showCount
                        style={themeTokenChk.textAreaStyle}
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
                        maxLength={2000} showCount
                        style={themeTokenChk.textAreaStyle}
                      />
                    </Form.Item>
                    <Form.Item
                      name="note"
                      {...labelProps('Ghi chú')}
                      rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Nhập ghi chú..."
                        maxLength={2000} showCount
                        style={themeTokenChk.textAreaStyle}
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
                    <TransmissionGisTab
                      geometryType={updateGeometryType}
                      rows={updateGpsCoordList}
                      symbols={symbols}
                      renderDms={(idx, field, row) => renderGpsDmsEditor(setUpdateGpsCoordList, idx, field, row)}
                      onAddRow={() => setUpdateGpsCoordList((prev) => [...prev, { latitude: null, longitude: null }])}
                      onDeleteRow={(idx) => setUpdateGpsCoordList((p) => p.filter((_, i) => i !== idx))}
                      onOpenMap={() => setMapScope('update')}
                    />
                  </div>
                ),
              },
              {
                key: 'attachments',
                label: 'File đính kèm',
                children: (
                  <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                    <InfrastructureAttachmentTab
                      attachments={updateAttachments}
                      onUpload={handleAttachmentUpload(updateAttachments, setUpdateAttachments, setUpdatePendingFiles)}
                      onDelete={handleAttachmentDelete(updateAttachments, setUpdateAttachments, setUpdatePendingFiles, setUpdatePendingDeleted)}
                      onDownload={handleDownloadAttachmentItem}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Drawer>

      {/* ── History Drawer ─────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        rootClassName={THEME_SCOPE_CLASS}
        size={isIframeModal ? '100%' : 960}
        mask={!isIframeModal}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyEntityName ? `Lịch sử thay đổi — ${historyEntityName}` : 'Lịch sử thay đổi'}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusSm, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                {/* Nhật ký nạp theo trang nên đây là số đã tải, không phải tổng (chuẩn /vts-operation-center). */}
                {`Đã tải ${historyRecords.length}`}
              </span>
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
          <Input
            placeholder="Tìm kiếm nội dung thay đổi..."
            allowClear
            value={historySearchInput}
            onChange={(e) => {
              const val = e.target.value;
              setHistorySearchInput(val);
              if (!val) setHistorySearch('');
            }}
            onPressEnter={() => {
              setHistorySearch(historySearchInput.trim());
              setHistoryReloadToken((t) => t + 1);
            }}
            style={{ ...inputStyle, flex: 1 }}
          />
          <DatePicker.RangePicker
            {...getRangePickerProps({
              value: (historyDateFrom && historyDateTo)
                ? [dayjs(historyDateFrom), dayjs(historyDateTo)]
                : (historyDateFrom ? [dayjs(historyDateFrom), null] : (historyDateTo ? [null, dayjs(historyDateTo)] : null)),
              onChange: (dates: any) => {
                if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                  setHistoryDateFrom('');
                  setHistoryDateTo('');
                } else {
                  setHistoryDateFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                  setHistoryDateTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                }
              },
              style: { ...inputStyle, width: 280 },
            })}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loadingHistory}
            onClick={() => {
              setHistorySearch(historySearchInput.trim());
              setHistoryReloadToken((t) => t + 1);
            }}
            style={primaryButtonStyle}
          >
            Tìm kiếm
          </Button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {loadingHistory && historyRecords.length === 0 ? <LoadingSkeleton rows={5} /> : historyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>{historySearch || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div></div>
          ) : (
            <>
              {renderTransmissionHistoryTimeline(historyRecords)}
              {loadingMoreHistory && <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm...</div>}
            </>
          )}
        </div>
      </Drawer>
      </ThemeTokenProvider>
    </>
  );
};

export default TransmissionListPage;
