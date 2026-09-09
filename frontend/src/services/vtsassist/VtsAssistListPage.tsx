import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fmtNum } from "../../utils/numFmt";
import {
  parseWktToCoordinates,
  serializeCoordinatesToWkt,
  adjustCoordinateListForGeometry,
  validateDmsCoordinates,
  ddToDms,
  dmsToDd,
  GEOMETRY_POINT_COUNT,
} from "../../utils/gisGeometry";
import { usePermissionStore } from "../../store/permissionStore";
import {
  Alert,
  Button,
  DatePicker,
  Space,
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
import GisLocationSelector from "../../components/gis/GisLocationSelector";
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from "../../components/shared/InfrastructureAttachmentTab";
import { DetailTable } from "../../components/shared/DetailTable";
import { AppDrawer } from "../../components/shared/AppDrawer";
import { deduplicateAttachmentHistoryChanges } from "../../utils/historyAttachmentDedup";
import { gisCoordinatesToLines, gisGeometryTypeLabel, isGisHistoryField } from "../../utils/historyGisFormat";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SlidersOutlined,
  FileTextOutlined,
  AuditOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { fmtInputNumber } from "../../utils/numFmt";
import { Tabs } from "antd";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_OPERATING_ORGANIZATIONS } from "../operatingOrganizationsData";
import {
  fetchVtsAssistList,
  fetchVtsAssistById,
  deleteVtsAssist,
  submitVtsAssist,
  approveVtsAssistC1,
  approveVtsAssistC2,
  createVtsAssist,
  updateVtsAssist,
  generateVtsAssistCode,
  fetchVtsAssistHistory,
  fetchVtsAssistAttachments,
  uploadVtsAssistAttachment,
  deleteVtsAssistAttachment,
  downloadVtsAssistAttachment,
} from "./api";
import {
  OPERATIONAL_STATUS_OPTIONS,
} from "./schema";
import type { VtsAssistResponse, ApprovalRequest, CreateVtsAssistRequest } from "./types";
import toast from "../../components/ToastNotification";
import ApprovalModal from "../../components/shared/ApprovalModal";
import { useAuthStore } from "../../store/authStore";
import EmptyState from "../../components/EmptyState";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { VIETNAM_PROVINCES } from "../../types/common";
import api from "../api";
import { userService } from "../userService";
import type { Symbol as MapSymbolType } from "../symbolService";
import {
  ScreenHeader,
  DataTable,
  Pagination,
  FilterTableLayout,
  SidebarFilterField,
} from "../../components/list-view";
import {
  // Design + status tokens (themetokenchk — thay cho ../../tokens cũ)
  colors,
  actionPrimary,
  statusInfo,
  statusCritical,
  statusAttention,
  statusDraft,
  statusOperational,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  surfaceCard,
  radiusPill,
  radiusMd,
  fontSans,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontSizeCellTitle,
  fontWeightMedium,
  fontWeightBold,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceFormField,
  spaceXl,
  statusBadgeStyle,
  icons,
  labelProps,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  selectStyle,
  readonlyInputStyle,
  DRAWER_TABLE_SCROLL_Y,
  requiredMarkStyle,
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
import { cellTitleStyle, cellSubtitleStyle } from "../../themetokenchk";
import * as themeTokenChk from "../../themetokenchk";
import { ThemeTokenProvider } from "../../context/ThemeTokenContext";

// ── Accordion card style helpers cho tab 'Vận hành & bảo trì' (chuẩn /berth /cctv) ──
const detailOpCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const detailCardTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeCellTitle,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const detailCardHeaderStyle = (open: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: open ? 12 : 0,
  paddingBottom: open ? 8 : 0,
  borderBottom: open ? '1px solid #f1f5f9' : 'none',
  cursor: 'pointer',
  userSelect: 'none',
});

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

import dayjs from "dayjs";


// ── Trạng thái phê duyệt 2 cấp (C1 Cảng vụ → C2 Cục) — đồng bộ /vts-system ──
const APPROVAL_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
  APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục',
  APPROVED: 'Đã phê duyệt',
  REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
  REJECTED_LEVEL2: 'Từ chối cấp cục',
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
function renderVtsAssistStatusBadge(b: { color: string; label: string }) {
  let c = textTertiary;
  if (b.color === 'green') c = statusOperational;
  else if (b.color === 'red') c = statusCritical;
  else if (b.color === 'orange') c = statusAttention;
  return <span className="kcht-cell-badge" style={statusBadgeStyle(c)}>{b.label}</span>;
}

/** Badge trạng thái phê duyệt 2 cấp — dùng APPROVAL_STATUS_MAP + APPROVAL_COLOR (quy chuẩn AGENTS.md) */
function renderApprovalBadge(status: string | null | undefined) {
  if (!status) return <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>;
  const display = APPROVAL_STATUS_MAP[status] || status;
  const color = APPROVAL_COLOR[status] || textTertiary;
  return (
    <span className="kcht-cell-badge" style={statusBadgeStyle(color)}>
      {display}
    </span>
  );
}

// Style cho thẻ phân nhóm (Section Card) đồng bộ với màn /berth
const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
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

type GpsCoordRow = {
  latD: number | null;
  latM: number | null;
  latS: number | null;
  lngD: number | null;
  lngM: number | null;
  lngS: number | null;
};

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

const renderDmsGroup = (
  dVal: number | null, mVal: number | null, sVal: number | null,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  const started = dVal != null || mVal != null || sVal != null;
  const inputs = [
    {
      key: 'd', base: 'Độ', value: dVal, max: maxDeg,
      radius: '999px 0 0 999px', unit: '°', unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1, formatter: undefined,
      msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm', base: 'Phút', value: mVal, max: 59,
      radius: '0', unit: "'", unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1, formatter: undefined,
      msg: started && mVal == null ? 'Phút bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, v, sVal ?? null),
    },
    {
      key: 's', base: 'Giây', value: sVal, max: 59.99,
      radius: '0', unit: '"', unitStyle: dmsUnitEndStyle, basis: '1.2 0 130px', width: 130,
      step: 0.01, formatter: fmtInputNumber,
      msg: started && sVal == null ? 'Giây bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, mVal ?? null, v),
    },
  ] as const;

  const inputRow = (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ display: 'flex', flex: inp.basis, minWidth: 0, width: inp.width }}>
          <InputNumber
            value={inp.value}
            min={0}
            max={inp.max}
            step={inp.step}
            placeholder={inp.base}
            formatter={inp.formatter}
            status={inp.msg ? 'error' : undefined}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(raw) => inp.onEdit(raw == null ? null : Number(raw))}
            style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32 }}
            controls={false}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

  const messageRow = (
    <div aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', width: '100%', minWidth: 0, marginTop: spaceXs, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width }}>
          {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
      {inputRow}
      {messageRow}
    </div>
  );
};

/**
 * Tab GIS 'Thông tin vị trí' trong Drawer Tạo mới/Chỉnh sửa — chuẩn /berth:
 * 2 Section Cards: Thông số đối tượng bản đồ (EnvironmentOutlined)
 * + Tọa độ GPS (${rows.length}) kèm DetailTable DMS (DRAWER_TABLE_SCROLL_Y.withGisForm).
 * Dùng chung 2 chế độ create/edit (props phân biệt state + handler của từng form).
 */
function VtsAssistGisTab({
  geometryType,
  rows,
  symbols,
  onAddRow,
  onUpdatePoint,
  onDeleteRow,
  minPoints: _minPoints,
  onOpenMap,
  gpsError,
}: {
  geometryType?: string | null;
  rows: GpsCoordRow[];
  symbols: MapSymbolType[];
  onAddRow: () => void;
  onUpdatePoint: (index: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => void;
  onDeleteRow: (index: number) => void;
  minPoints?: number;
  onOpenMap: () => void;
  gpsError?: string | null;
}) {
  const geom = normalizeGeometryType(geometryType);
  const isPoint = geom === 'POINT';
  const shown = rows.map((c, i) => ({ ...c, _idx: i }));
  const gisLabel = (text: string) => (
    <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>{text}</span>
  );
  return (
    <div>
      {/* Section 1: Thông số đối tượng bản đồ */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleStyle}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span>Thông số đối tượng bản đồ</span>
          </div>
        </div>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item label={gisLabel('Loại đối tượng')} name="geometryType" style={{ marginBottom: spaceFormField }}>
              <Select
                placeholder="Chọn loại đối tượng"
                allowClear
                options={[
                  { value: 'POINT', label: 'Đối tượng điểm' },
                  { value: 'LINE', label: 'Đối tượng đường' },
                  { value: 'POLYGON', label: 'Đối tượng vùng' },
                ]}
                style={selectStyle}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={gisLabel('Biểu tượng')} name="mapSymbolId" style={{ marginBottom: spaceFormField }}>
              <Select
                placeholder="Chọn biểu tượng bản đồ"
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={!geometryType}
                style={selectStyle}
              >
                {(Array.isArray(symbols) ? symbols : []).map((sym) => (
                  <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                    <Space size={6} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {sym.image ? (
                        <img
                          src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                          alt={sym.name}
                          style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle' }}
                        />
                      ) : (
                        <EnvironmentOutlined style={{ color: actionPrimary }} />
                      )}
                      <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item label={gisLabel('Hệ quy chiếu')} name="coordinateSystem" style={{ marginBottom: spaceFormField }}>
              <Select
                placeholder="Chọn hệ quy chiếu"
                disabled
                options={[
                  { value: 1, label: 'WGS-84' },
                  { value: 2, label: 'VN-2000' },
                ]}
                style={selectStyle}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={gisLabel('Quy tắc hiển thị')} name="displayRule" style={{ marginBottom: spaceFormField }}>
              <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Section 2: Tọa độ GPS */}
      <div style={sectionBoxStyle}>
        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
            Tọa độ GPS ({rows.length})
          </span>
          <Space size={8}>
            <Button
              icon={<EnvironmentOutlined style={{ color: !geometryType ? undefined : actionPrimary }} />}
              onClick={onOpenMap}
              disabled={!geometryType}
              style={!geometryType ? {
                height: 32,
                fontSize: fontSizeSm,
                padding: '0 14px',
                borderRadius: radiusPill,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                opacity: 0.6,
                cursor: 'not-allowed',
              } : {
                ...outlineButtonStyle,
                height: 32,
                fontSize: fontSizeSm,
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Chọn tọa độ trên bản đồ
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddRow}
              disabled={!geometryType || (isPoint && rows.length >= 1)}
              style={!geometryType || (isPoint && rows.length >= 1) ? {
                height: 32,
                fontSize: fontSizeSm,
                padding: '0 14px',
                borderRadius: radiusPill,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#f5f5f5',
                borderColor: '#d9d9d9',
                color: 'rgba(0, 0, 0, 0.25)',
                cursor: 'not-allowed',
              } : {
                ...primaryButtonStyle,
                height: 32,
                fontSize: fontSizeSm,
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={isPoint && rows.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined}
            >
              Thêm tọa độ
            </Button>
          </Space>
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
            <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block' }}>Chưa có tọa độ nào.</span>
          </div>
        ) : (
          <>
            {gpsError && (
              <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {gpsError}</span>
              </div>
            )}
            <DetailTable
              size="small"
              scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
              dataSource={shown}
              emptyText="Chưa có tọa độ GPS nào"
              rowKey={(r: any, idx?: number) => r._idx ?? String(idx)}
              columns={[
                {
                  title: 'STT',
                  width: 60,
                  align: 'center' as const,
                  render: (_v: any, _r: any, idx: number) => idx + 1,
                },
                {
                  title: 'Vĩ độ (Latitude - N)',
                  key: 'lat',
                  render: (_v: any, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => onUpdatePoint(record._idx, 'lat', d, m, s)),
                },
                {
                  title: 'Kinh độ (Longitude - E)',
                  key: 'lng',
                  render: (_v: any, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => onUpdatePoint(record._idx, 'lng', d, m, s)),
                },
                {
                  title: '',
                  width: 50,
                  align: 'center' as const,
                  // Align with the inputs, excluding the reserved validation message row.
                  onCell: () => ({ style: { verticalAlign: 'top' } }),
                  render: (_v: any, record: any) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                      onClick={() => onDeleteRow(record._idx)}
                      style={{
                        width: 32,
                        height: 32,
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Xóa tọa độ"
                    />
                  ),
                },
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
}

const VtsAssistListPage = () => {
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
  const [data, setData] = useState<VtsAssistResponse[]>([]);
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
        fetchVtsAssistList({
          page: 0,
          size: 1,
          orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__'
                          ? filterValues.orgUnitId
                          : undefined),
          approvalStatus: s.status,
        })
      )
    );
    const counts: Record<string, number> = {};
    results.forEach((r, i) => {
      counts[statuses[i].key] = r.status === "fulfilled" ? (r.value?.totalElements ?? 0) : 0;
    });
    setTabCounts(counts);
    // Tất cả = Lưu tạm + Chờ Cảng vụ + Chờ Cục + Đã phê duyệt + Từ chối (Từ chối cấp Cảng vụ/Chi cục + Từ chối cấp cục)
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

  // ── Danh bạ người dùng → map UUID sang tên cho cột "Người tải lên" (chuẩn /berth, /beacon-stations) ──
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        if (disposed) return;
        const next = new Map<string, string>();
        users.forEach((u: any) => next.set(u.id, u.fullName || u.username || u.id));
        setUserMap(next);
      } catch {
        /* giữ map rỗng nếu không lấy được danh bạ */
      }
    })();
    return () => { disposed = true; };
  }, []);

  const [selectedRecord, setSelectedRecord] = useState<VtsAssistResponse | null>(
    null
  );

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<VtsAssistResponse | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<VtsAssistResponse | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<VtsAssistResponse | null>(null);
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
  const [gpsCoordList, setGpsCoordList] = useState<GpsCoordRow[]>([]);
  const [createGpsError, setCreateGpsError] = useState<string | null>(null);
  const [createActiveTabKey, setCreateActiveTabKey] = useState('general');
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);

  // Update modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<VtsAssistResponse | null>(null);
  const [updateForm] = Form.useForm();
  const [updateLoading, setUpdateLoading] = useState(false);
  // Hành động footer update (chuẩn VTS): Lưu tạm / Lưu và gửi phê duyệt / Lưu và phê duyệt
  const [updateActionType, setUpdateActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const updateActionTypeRef = useRef<'draft' | 'submit' | 'approve'>('draft');

  // "Lưu và phê duyệt" chỉ dành cho tài khoản có quyền duyệt cấp Cục (chuẩn VTS).
  const canSaveAndApprove = !!hasPerm?.("vtsassist:approvec2");

  // Reactive watch for attached infrastructure dropdown
  const updateAttachedType = Form.useWatch('attachedInfrastructureType', updateForm);
  const updateGeometryType = Form.useWatch('geometryType', updateForm);

  // GPS coordinates for edit drawer
  const [updateGpsCoordList, setUpdateGpsCoordList] = useState<GpsCoordRow[]>([]);
  const [updateGpsError, setUpdateGpsError] = useState<string | null>(null);
  const [updateActiveTabKey, setUpdateActiveTabKey] = useState('general');

  /** true khi field đã đạt đủ max ký tự — bật viền đỏ ô nhập + message bên dưới (chuẩn /berth). */
  const useMaxReached = (name: string, max: number, formInstance: any): boolean => {
    const raw = Form.useWatch(name, formInstance) ?? '';
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };
  const atMaxCreate = {
    deviceName: useMaxReached('deviceName', 255, createForm),
    detailedLocation: useMaxReached('detailedLocation', 500, createForm),
    model: useMaxReached('model', 255, createForm),
    manufacturer: useMaxReached('manufacturer', 50, createForm),
    specifications: useMaxReached('specifications', 2000, createForm),
    maintenanceInformation: useMaxReached('maintenanceInformation', 2000, createForm),
    note: useMaxReached('note', 2000, createForm),
  };
  const atMaxUpdate = {
    deviceName: useMaxReached('deviceName', 255, updateForm),
    detailedLocation: useMaxReached('detailedLocation', 500, updateForm),
    model: useMaxReached('model', 255, updateForm),
    manufacturer: useMaxReached('manufacturer', 50, updateForm),
    specifications: useMaxReached('specifications', 2000, updateForm),
    maintenanceInformation: useMaxReached('maintenanceInformation', 2000, updateForm),
    note: useMaxReached('note', 2000, updateForm),
  };

  // Modal bản đồ GIS: 'create' | 'edit' | 'detail' (chuẩn /vts-operation-center)
  const [gisMapModal, setGisMapModal] = useState<'create' | 'edit' | 'detail' | null>(null);

  // Auto-fill Hệ quy chiếu + Quy tắc hiển thị + GPS khi chọn Loại đối tượng (chuẩn /cctv).
  // Chuyển Loại đối tượng sẽ GIỮ NGUYÊN các điểm đã nhập, chỉ thêm/bớt theo mức tối thiểu
  // của loại mới (POINT=1 / LINE=2 / POLYGON=3).
  useEffect(() => {
    if (!createGeometryType) {
      createForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      setGpsCoordList([]);
      setCreateGpsError(null);
      return;
    }
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    const count = GEOMETRY_POINT_COUNT[String(createGeometryType).toUpperCase()] ?? 1;
    setGpsCoordList((prev) => {
      if (!prev || prev.length === 0) {
        return Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      }
      if (String(createGeometryType).toUpperCase() === 'POINT' && prev.length > 1) {
        return [prev[0]];
      }
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      }
      return prev;
    });
    setCreateGpsError(null);
  }, [createGeometryType, createForm]);

  // Effect Loại đối tượng trong Drawer Sửa: giữ nguyên các điểm đã nhập (chuẩn /cctv).
  useEffect(() => {
    if (!updateGeometryType) {
      updateForm.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      setUpdateGpsCoordList([]);
      setUpdateGpsError(null);
      return;
    }
    updateForm.setFieldsValue({ displayRule: 'Độ, phút, giây (DMS)' });
    if (updateForm.getFieldValue('coordinateSystem') == null) {
      updateForm.setFieldsValue({ coordinateSystem: 1 });
    }
    const count = GEOMETRY_POINT_COUNT[String(updateGeometryType).toUpperCase()] ?? 1;
    setUpdateGpsCoordList((prev) => {
      if (!prev || prev.length === 0) {
        return Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      }
      if (String(updateGeometryType).toUpperCase() === 'POINT' && prev.length > 1) {
        return [prev[0]];
      }
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      }
      return prev;
    });
    setUpdateGpsError(null);
  }, [updateGeometryType, updateForm]);

  // ── GPS DMS: sửa 1 ô bất kỳ → lưu trực tiếp vào GpsCoordRow (chuẩn /berth) ──
  const updateCreateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setGpsCoordList((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        [field === 'lat' ? 'latD' : 'lngD']: dVal,
        [field === 'lat' ? 'latM' : 'lngM']: mVal,
        [field === 'lat' ? 'latS' : 'lngS']: sVal,
      };
      return next;
    });
    setCreateGpsError(null);
  };

  const updateEditGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setUpdateGpsCoordList((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        [field === 'lat' ? 'latD' : 'lngD']: dVal,
        [field === 'lat' ? 'latM' : 'lngM']: mVal,
        [field === 'lat' ? 'latS' : 'lngS']: sVal,
      };
      return next;
    });
    setUpdateGpsError(null);
  };

  // ── File đính kèm (dùng chung cho Drawer Thêm mới và Sửa) ──
  const handleEditUploadFile = (file: File): boolean => {
    if (uploadFileList.length >= 10) {
      toast.error('Số lượng tệp đính kèm tối đa là 10 tệp');
      return false;
    }
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setUploadFileList((prev) => [...prev, {
      id: tempId,
      fileName: file.name,
      fileSize: file.size,
      uploadedByName: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
      uploadedDate: new Date().toISOString(),
      file,
    }]);
    toast.success(`Đã thêm tệp ${file.name}`);
    return false;
  };

  const handleEditDeleteFile = (attId: string): void => {
    if (!String(attId).startsWith('temp_') && updateTarget?.id) {
      void deleteVtsAssistAttachment(updateTarget.id, attId).catch(() => { /* ignore */ });
    }
    setUploadFileList((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleDownloadAttachmentItem = useCallback(async (attId: string, fileName?: string) => {
    const item = uploadFileList.find((a) => a.id === attId);
    const isTemp = String(attId).startsWith('temp_');
    const localFile = isTemp ? item : undefined;
    const downloadName = fileName || item?.fileName || 'file';
    // Tệp chưa upload (đang chờ lưu hồ sơ) → tải blob cục bộ
    if (localFile?.file) {
      const url = URL.createObjectURL(localFile.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    // Tệp đã lưu: tải qua endpoint chuẩn giống /vts-operation-center
    // (GET /v1/vtsassist/{id}/attachments/{attId}/download → blob).
    const targetId = selectedRecord?.id || updateTarget?.id;
    if (!targetId) {
      toast.error('Không thể tải xuống tệp đính kèm');
      return;
    }
    try {
      await downloadVtsAssistAttachment(targetId, attId, downloadName);
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  }, [uploadFileList, selectedRecord?.id, updateTarget?.id]);

  const normalizeAttachmentItem = (a: any) => ({
    id: a.id,
    fileName: a.fileName,
    fileSize: a.fileSize,
    uploadedByName: a.uploadedByName,
    uploadedBy: a.uploadedBy,
    uploadedDate: a.uploadedAt ?? a.uploadedDate,
    createdAt: a.uploadedAt ?? a.createdAt,
  });

  // ── GIS map modal ──
  const openGisMap = (mode: 'create' | 'edit' | 'detail') => setGisMapModal(mode);

  const applyGisMapResult = (val?: { geometryType?: string; coordinates?: string; symbolId?: string }) => {
    if (!gisMapModal || gisMapModal === 'detail') return;
    const pts = parseWktToCoordinates(val?.coordinates);
    const geom = normalizeGeometryType(val?.geometryType);
    const rows: GpsCoordRow[] = pts.map((p) => {
      const latDms = ddToDms(p.latitude);
      const lngDms = ddToDms(p.longitude);
      return {
        latD: latDms.d,
        latM: latDms.m,
        latS: latDms.s,
        lngD: lngDms.d,
        lngM: lngDms.m,
        lngS: lngDms.s,
      };
    });
    if (gisMapModal === 'create') {
      setGpsCoordList(rows);
      setCreateGpsError(null);
      createForm.setFieldsValue({
        geometryType: geom,
        coordinateSystem: 1,
        displayRule: 'Độ, phút, giây (DMS)',
      });
      if (val?.symbolId) createForm.setFieldValue('mapSymbolId', val.symbolId);
    } else {
      setUpdateGpsCoordList(rows);
      setUpdateGpsError(null);
      updateForm.setFieldsValue({ geometryType: geom, displayRule: 'Độ, phút, giây (DMS)' });
      if (updateForm.getFieldValue('coordinateSystem') == null) {
        updateForm.setFieldsValue({ coordinateSystem: 1 });
      }
      if (val?.symbolId) updateForm.setFieldValue('mapSymbolId', val.symbolId);
    }
  };

  const gisMapContext = useMemo(() => {
    if (!gisMapModal) return null;
    const isDetail = gisMapModal === 'detail';
    const geom = isDetail
      ? normalizeGeometryType(selectedRecord?.geometryType)
      : normalizeGeometryType(gisMapModal === 'create' ? createGeometryType : updateGeometryType);
    const rows = isDetail
      ? parseWktToCoordinates(selectedRecord?.coordinates ?? undefined)
      : (gisMapModal === 'create' ? gpsCoordList : updateGpsCoordList)
        .map((c) => ({
          latitude: dmsToDd(c.latD, c.latM, c.latS) ?? 0,
          longitude: dmsToDd(c.lngD, c.lngM, c.lngS) ?? 0,
        }));
    const symbolId = isDetail
      ? (selectedRecord?.mapSymbolId ?? undefined)
      : (gisMapModal === 'create' ? createForm : updateForm).getFieldValue('mapSymbolId') as string | undefined;
    return { geom, rows, symbolId };
  }, [gisMapModal, gpsCoordList, updateGpsCoordList, createGeometryType, updateGeometryType, selectedRecord, createForm, updateForm]);

  // Submissions
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<VtsAssistResponse | null>(
    null
  );
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── History state (chuẩn /berth) ───────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<VtsAssistResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyEntityName, setHistoryEntityName] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  const historyFieldCount = useMemo(() => (Array.isArray(historyRecords) ? historyRecords : []).length, [historyRecords]);
  const [detailsSpecsOpen, setDetailsSpecsOpen] = useState(true);
  const [detailApprovalOpen, setDetailApprovalOpen] = useState(true);
  const [opRunOpen, setOpRunOpen] = useState(true);
  const [opMaintOpen, setOpMaintOpen] = useState(true);
  const [opIncidentOpen, setOpIncidentOpen] = useState(true);

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
        m.set(item.id, item.name || '');
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
            title={name || undefined}
            style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {name || null}
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
        render: (_: unknown, __: VtsAssistResponse, index: number) => (
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
        render: (val: string, record: VtsAssistResponse) => (
          <div style={{ minWidth: 0 }}>
            <button
              type="button"
              className="kcht-cell-title"
              onClick={() => {
                setSelectedRecord(record);
                setDetailDrawerOpen(true);
              }}
              style={{ ...cellTitleStyle, background: "none", border: "none", padding: 0, textAlign: "left", fontFamily: "inherit", width: "100%" }}
              title={val || undefined}
            >
              {val || null}
            </button>
            <span className="kcht-cell-code" style={{ ...cellSubtitleStyle }}>{record.deviceCode || null}</span>
          </div>
        ),
      },
      {
        key: "orgUnitName",
        label: "Đơn vị quản lý",
        dataIndex: "orgUnitName",
        width: 260,
        render: (val: string) => (
          <span style={{ ...tableMetaStyle, fontWeight: fontWeightBold }}>{val || null}</span>
        ),
      },
      {
        key: "vtsSystemName",
        label: "Thuộc TTDH VTS/Trạm Radar",
        dataIndex: "attachedInfrastructureName",
        width: 280,
        render: (val: string) => (
          <span style={tableMetaStyle}>{val || null}</span>
        ),
      },
      {
        key: "operatingUnitName",
        label: "Đơn vị khai thác",
        dataIndex: "operatingUnitName",
        width: 260,
        render: (val: string) => (
          <span style={tableMetaStyle}>{val || null}</span>
        ),
      },
      {
        key: "provinceName",
        label: "Địa điểm\n(Tỉnh/Thành phố)",
        dataIndex: "provinceName",
        width: 220,
        ellipsis: false,
        render: (val: string) => (
          <span style={tableMetaStyle}>{val || null}</span>
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
          <span style={tableMetaStyle}>{val || null}</span>
        ),
      },
      {
        key: "updatedByName",
        label: "Cán bộ cập nhật",
        dataIndex: "updatedByName",
        width: 200,
        sortable: true,
        sortOrder: sortField === "updatedAt" || sortField === "updatedByName" ? sortOrder : null,
        render: (_: unknown, record: VtsAssistResponse) => renderInfoStack(record.updatedByName, record.updatedAt),
      },
      {
        key: "submittedInfo",
        label: "Cán bộ gửi phê duyệt",
        dataIndex: "submittedByName",
        width: 230,
        render: (_: unknown, record: VtsAssistResponse) => renderInfoStack(record.submittedByName, record.submittedDate),
      },
      {
        key: "approvedLevel1Info",
        label: "Cán bộ phê duyệt cấp Cảng vụ/Chi cục",
        dataIndex: "approverLevel1Name",
        width: 380,
        render: (_: unknown, record: VtsAssistResponse) => renderInfoStack(record.approverLevel1Name, record.approvedDateLevel1),
      },
      {
        key: "approvedLevel2Info",
        label: "Cán bộ phê duyệt cấp Cục",
        dataIndex: "approverLevel2Name",
        width: 270,
        render: (_: unknown, record: VtsAssistResponse) => renderInfoStack(record.approverLevel2Name, record.approvedDateLevel2),
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
    provinceId: 'Tỉnh/Thành phố',
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
    departmentApprovalContent: 'Nội dung phê duyệt cấp Cục',
    portAuthorityApprovalContent: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
    approvalContentLevel1: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
    approvalContentLevel2: 'Nội dung phê duyệt cấp Cục',
    rejectionReason: 'Lý do từ chối',
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
      return full ? full.split(' - ').pop() || full : '';
    }
    if (fn === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || val;
    if (fn === 'provinceId') return VIETNAM_PROVINCES[Number(val) - 1] || val;
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
        PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
        APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục',
        APPROVED: 'Đã phê duyệt',
        REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
        REJECTED_LEVEL2: 'Từ chối cấp cục',
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

  const resolveHistoryActionMeta = (group: any, changes: any[]): { label: string; color: string; bg: string } => {
    const item = group.items?.[0] || {};
    const rawStatus = String(item.status ?? item.action ?? '').toUpperCase();
    const rawReason = String(item.reason ?? item.ghiChu ?? item.note ?? '').toLowerCase();
    const level = Number(item.approvalLevel || 0);

    if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
      return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
    }

    if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len')) {
      return { label: 'Tải lên tệp', color: '#0284C7', bg: '#0284C718' };
    }
    if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xoa tai lieu') || rawReason.includes('xóa tệp')) {
      return { label: 'Xóa tệp', color: statusCritical, bg: `${statusCritical}18` };
    }

    if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('chỉnh sửa')) {
      return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
    }

    // Ưu tiên lý do ghi sẵn cho hành động duyệt/từ chối (chuẩn VTS CHK)
    if (rawReason.includes('phê duyệt cấp cảng vụ') || rawReason.includes('phe duyet cap cang vu')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (rawReason.includes('phê duyệt cấp cục') || rawReason.includes('phe duyet cap cuc')) {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (rawReason.includes('từ chối cấp cảng vụ') || rawReason.includes('tu choi cap cang vu')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (rawReason.includes('từ chối cấp cục') || rawReason.includes('tu choi cap cuc')) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }

    const approvalChange = changes.find((c: any) => {
      const k = (c.field || '').toLowerCase();
      return k === 'approvalstatus' || k === 'trang thai phe duyet';
    });

    if (approvalChange) {
      const nv = String(approvalChange.newValue || '').toLowerCase();
      if (nv.includes('rejected_level1') || (nv.includes('tra ve') && nv.includes('cang vu'))) {
        return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
      }
      if (nv.includes('rejected_level2') || (nv.includes('tra ve') && nv.includes('cuc'))) {
        return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
      }
      if (nv.includes('approved_level1') || nv.includes('cuc duyet') || nv === 'cho cuc duyet') {
        return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
      }
      if (nv === 'da duyet' || nv.includes('approved')) {
        return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
      }
      if (nv.includes('tu choi') || nv.includes('rejected')) {
        return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
      }
      if (nv.includes('cho cang vu duyet') || nv.includes('pending') || nv.includes('proposed') || nv.includes('luu tam') || nv.includes('nhap')) {
        return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
      }
    }

    if (level === 1 || String(item.approvalLevel).includes('LEVEL_1')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (level === 2 || String(item.approvalLevel).includes('LEVEL_2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
      return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (rawStatus === 'SUBMITTED' || rawStatus === 'PENDING' || rawReason.includes('trình duyệt') || rawReason.includes('trinh duyet')) {
      return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
    }
    if (rawStatus === 'DELETED' || rawStatus === 'DELETE' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa') || rawReason.includes('xoa')) {
      return { label: 'Xóa', color: '#64748b', bg: '#64748b18' };
    }

    return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
  };

  const openHistory = useCallback(async (r: VtsAssistResponse) => {
    setHistoryTarget(r);
    setSelectedRecord(r);
    setHistoryEntityName(r.deviceName || '');
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    try {
      const list = await fetchVtsAssistHistory(r.id);
      setHistoryRecords(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const HISTORY_FIELD_ORDER = [
    'orgUnitId', 'deviceCode', 'deviceName', 'manufacturer', 'model',
    'quantity', 'operatingUnitId', 'provinceName', 'detailedLocation',
    'attachedInfrastructureType', 'attachedInfrastructureId',
    'unitOfMeasure', 'yearOfUse', 'operationalStatus',
    'specifications', 'maintenanceInformation', 'note',
    'objectType', 'mapSymbolId', 'coordinateSystem', 'displayRule',
  ];

  const renderVtsAssistHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort(
      (a: any, b: any) =>
        new Date(historyTimestamp(b) || 0).getTime() -
        new Date(historyTimestamp(a) || 0).getTime()
    );
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
    for (const r of sorted) {
      if (q) {
        const fn = (historyField(r) || '').toLowerCase();
        const ov = (historyOldValue(r) || '').toLowerCase();
        const nv = (historyNewValue(r) || '').toLowerCase();
        const lb = historyFieldName(historyField(r) || '').toLowerCase();
        const od = historyFieldValue(historyField(r), historyOldValue(r), orgMap, symbolMap).toLowerCase();
        const nd = historyFieldValue(historyField(r), historyNewValue(r), orgMap, symbolMap).toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) continue;
      }
      if (historyFrom || historyTo) {
        const cd = (historyTimestamp(r) || '');
        if (historyFrom && cd.substring(0, 10) < historyFrom) continue;
        if (historyTo && cd.substring(0, 10) > historyTo) continue;
      }
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const actor = historyActor(r);
      const prev = groups[groups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === actor) prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor, items: [r] });
    }
    if (groups.length === 0)
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
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
          const orgId = rec0.orgUnitId || historyTarget?.orgUnitId;
          const orgName = orgId ? orgMap.get(orgId) : undefined;
          const unitName =
            rec0.orgUnitName ||
            (orgName ? orgName.split(' - ').pop() || orgName : undefined) ||
            rec0.unitName ||
            historyTarget?.orgUnitName ||
            'Cục Hàng hải Việt Nam';
          // Chuẩn /vts-operation-center: dedup thay đổi đính kèm (upload/delete cùng lúc).
          const changes = deduplicateAttachmentHistoryChanges(
            g.items.flatMap((item: any) => {
              const fn = historyField(item);
              return fn ? [{ field: fn, oldValue: historyOldValue(item), newValue: historyNewValue(item) }] : [];
            })
          );
          const barColor = actionPrimary;
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
              (c: any) => c.field !== 'infrastructureList' && c.field !== 'attachments' && c.field !== 'spatialId'
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
              return fmtNum(t);
            }
            return historyFieldValue(fn, raw, orgMap, symbolMap);
          };

          if (orderedChanges.length === 0) return null;

          return (
            <div
              key={gi}
              style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}
            >
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                  <Typography.Text style={historyTimeStyle}>
                    {g.ts ? fmtTime(g.ts) : '—'}
                  </Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    {(() => {
                      const am = resolveHistoryActionMeta(g, changes);
                      return (
                        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: am.bg, color: am.color, whiteSpace: 'nowrap' }}>
                          {am.label}
                        </span>
                      );
                    })()}
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
                      const gisCellStyle = isGisHistoryField(fn)
                        ? { whiteSpace: 'pre-line' as const, lineHeight: 1.5 }
                        : {};
                      if (isCreate) {
                        return (
                          <div
                            key={`${fn}-${ri}`}
                            style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}
                          >
                            <div style={historyFieldLabelStyle}>
                              {fn ? `${historyFieldName(fn)}:` : '—'}
                            </div>
                            <span title={typeof nv === 'string' ? nv : undefined} style={{ ...historyNewValueStyle, ...gisCellStyle }}>
                              {renderCell(change.newValue) ?? (nv ?? '—')}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={`${fn}-${ri}`}
                          style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}
                        >
                          <div style={historyFieldLabelStyle}>
                            {fn ? `${historyFieldName(fn)}:` : '—'}
                          </div>
                          <span title={typeof ov === 'string' ? ov : undefined} style={{ ...historyOldValueStyle, ...gisCellStyle }}>
                            {renderCell(change.oldValue) ?? (ov ?? '—')}
                          </span>
                          <span style={historyArrowStyle}>→</span>
                          <span title={typeof nv === 'string' ? nv : undefined} style={{ ...historyNewValueStyle, ...gisCellStyle }}>
                            {renderCell(change.newValue) ?? (nv ?? '—')}
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

  const openUpdateDrawer = useCallback((record: VtsAssistResponse) => {
    setUpdateTarget(record);
    setUploadFileList([]);
    void fetchVtsAssistAttachments(record.id).then((list: any[]) => {
      setUploadFileList((Array.isArray(list) ? list : []).map(normalizeAttachmentItem));
    }).catch(() => { /* ignore */ });
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
    // Nạp sẵn tọa độ từ WKT (record.coordinates) khi mở Sửa — tránh 0 dòng → mất hình học khi lưu
    const wktPoints = parseWktToCoordinates(record.coordinates ?? undefined);
    const rawEditGeom = String((record as any)?.geometryType || '').toUpperCase();
    let editGeom: 'POINT' | 'LINE' | 'POLYGON' = 'POINT';
    if (rawEditGeom === 'LINE') editGeom = 'LINE';
    else if (rawEditGeom === 'POLYGON') editGeom = 'POLYGON';
    else if (rawEditGeom === 'POINT' && wktPoints.length > 1) editGeom = wktPoints.length === 2 ? 'LINE' : 'POLYGON';
    else if (wktPoints.length === 2) editGeom = 'LINE';
    else if (wktPoints.length >= 3) editGeom = 'POLYGON';
    updateForm.setFieldsValue({
      ...safeRecord,
      geometryType: editGeom,
      coordinateSystem: (safeRecord as any)?.coordinateSystem ?? 1,
      displayRule: (safeRecord as any)?.displayRule ?? 'Độ, phút, giây (DMS)',
    });
    const dmsPoints: GpsCoordRow[] = wktPoints.map((p) => {
      const latDms = ddToDms(p.latitude);
      const lngDms = ddToDms(p.longitude);
      return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
    });
    setUpdateGpsCoordList(dmsPoints.length > 0 ? dmsPoints : (
      editGeom === 'POINT' ? [{ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }] :
      editGeom === 'LINE' ? [{ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }] :
      [{ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]
    ));
    setUpdateGpsError(null);
    setUpdateActiveTabKey('general');
    setUpdateModalOpen(true);
  }, [updateForm, setUpdateModalOpen, setUpdateTarget, setUploadFileList, setUpdateGpsCoordList, setUpdateGpsError, setUpdateActiveTabKey]);

  useEffect(() => {
    if (!isMapLinkedView || !linkedRecordId || !linkedAction) return;

    const requestKey = `${linkedAction}:${linkedRecordId}`;
    if (handledLinkedRecordRef.current === requestKey) return;
    handledLinkedRecordRef.current = requestKey;

    let active = true;
    void fetchVtsAssistById(linkedRecordId)
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
        toast.error("Không thể tải hồ sơ vts assist");
      });

    return () => {
      active = false;
    };
  }, [isMapLinkedView, linkedAction, linkedRecordId, openUpdateDrawer]);

  // ── rowActions callback ──────────────────────────────────────────
  const rowActions = useCallback(
    (record: VtsAssistResponse) => {
      const actions: Array<{ key: string; label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }> = [
        {
          key: "view",
          label: "Xem chi tiết",
          icon: icons.view,
          onClick: () => {
            setSelectedRecord(record);
            setDetailDrawerOpen(true);
            void fetchVtsAssistAttachments(record.id).then((list: any[]) => {
              setDetailFiles((Array.isArray(list) ? list : []).map(normalizeAttachmentItem));
            }).catch(() => setDetailFiles([]));
          },
        },
      ];

      // Chỉnh sửa: hồ sơ Lưu tạm (DRAFT) mở cho mọi quyền; hồ sơ Đã phê duyệt (APPROVED) chỉ
      // người có quyền phê duyệt cấp Cục (vtsassist:approvec2) mới sửa được — chuẩn CHK.
      // Các trạng thái PENDING / REJECTED không mở chỉnh sửa.
      if (record.approvalStatus === "DRAFT" || (record.approvalStatus === "APPROVED" && canSaveAndApprove)) {
        actions.push({
          key: "edit",
          label: "Chỉnh sửa",
          icon: icons.edit,
          onClick: () => openUpdateDrawer(record),
        });
      }

      // Lịch sử thay đổi (mở từ menu dòng, không nằm trong drawer chi tiết)
      actions.push({
        key: "history",
        label: "Lịch sử",
        icon: icons.history,
        onClick: () => openHistory(record),
      });

      // DRAFT / REJECTED_LEVEL1 / REJECTED_LEVEL2 + vtsassist:update → Gửi phê duyệt (submitVtsAssist)
      if (
        hasPerm?.("vtsassist:update") &&
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
            setSubmitModalOpen(true);
          },
        });
      }

      // PENDING_APPROVAL + vtsassist:approvec1 → Phê duyệt / Từ chối cấp Cảng vụ (C1)
      // Nguyên tắc 4 mắt: người tạo không được tự duyệt hồ sơ do mình tạo (back-end chặn, FE disable).
      if (hasPerm?.("vtsassist:approvec1") && record.approvalStatus === "PENDING_APPROVAL") {
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
            setRejectReason("");
            setRejectModalOpen(true);
          },
        });
      }

      // APPROVED_LEVEL1 + vtsassist:approvec2 → Phê duyệt / Từ chối cấp Cục (C2)
      // Nguyên tắc 4 mắt: người đã phê duyệt C1 không được tự duyệt tiếp ở C2.
      if (hasPerm?.("vtsassist:approvec2") && record.approvalStatus === "APPROVED_LEVEL1") {
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
            setRejectReason("");
            setRejectModalOpen(true);
          },
        });
      }

      // Chỉ hồ sơ "Lưu tạm" mới được xóa (phê duyệt 2 cấp — như /vts-system)
      if (hasPerm?.("vtsassist:delete") && record.approvalStatus === "DRAFT") {
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
      const result = await fetchVtsAssistList({
        page: safePage,
        size: safeSize,
        orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__'
                          ? filterValues.orgUnitId
                          : undefined),
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
      await deleteVtsAssist(deleteTarget.id);
      toast.success("Xóa hệ thống phụ trợ VTS thành công");
      setDeleteTarget(null);
      setDeleteConfirmText("");
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[vtsassist] delete error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, deleteConfirmText, fetchData, fetchTabCounts]);

  const handleApprove = useCallback(
    async (content?: string) => {
      if (!approveTarget) return;
      setApproveLoading(true);
      try {
        const payload: ApprovalRequest = { decision: "APPROVED", reason: content?.trim() || undefined };
        if (approveLevel === "c1") {
          await approveVtsAssistC1(approveTarget.id, payload);
          toast.success("Phê duyệt cấp Cảng vụ thành công");
        } else {
          await approveVtsAssistC2(approveTarget.id, payload);
          toast.success("Phê duyệt cấp Cục thành công");
        }
        setApproveTarget(null);
        setApproveModalOpen(false);
        fetchData();
        fetchTabCounts();
      } catch (error: unknown) {
        console.error("[vtsassist] approve error", error); // toast toàn cục đã xử lý ở interceptor api.ts
      } finally {
        setApproveLoading(false);
      }
    },
    [approveTarget, approveLevel, fetchData, fetchTabCounts]
  );

  const handleReject = useCallback(async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    if (reason.length < 10) {
      toast.error("Lý do từ chối tối thiểu 10 ký tự");
      return;
    }
    if (reason.length > 500) {
      toast.error("Lý do từ chối tối đa 500 ký tự");
      return;
    }
    setRejectLoading(true);
    try {
      const payload: ApprovalRequest = { decision: "REJECTED", reason };
      if (rejectLevel === "c1") await approveVtsAssistC1(rejectTarget.id, payload);
      else await approveVtsAssistC2(rejectTarget.id, payload);
      toast.success("Từ chối phê duyệt thành công");
      setRejectTarget(null);
      setRejectModalOpen(false);
      setRejectReason("");
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[vtsassist] reject error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setRejectLoading(false);
    }
  }, [rejectTarget, rejectLevel, rejectReason, fetchData, fetchTabCounts]);

  const handleCreate = useCallback(
    async (values: Record<string, unknown>) => {
      // Kiểm tra chéo giữa Loại đối tượng và Biểu tượng / Tọa độ (chuẩn VTS CHK /berth)
      const hasCoordinates = gpsCoordList.some((c) => c.lat !== 0 || c.lng !== 0);
      const hasLocation = Boolean(values.geometryType || hasCoordinates);
      if (hasCoordinates && !values.geometryType) {
        toast.error('Loại đối tượng là bắt buộc khi có tọa độ');
        return;
      }
      if (hasLocation && !values.mapSymbolId) {
        toast.error('Biểu tượng bản đồ là bắt buộc');
        return;
      }
      let wktCoordinates: string | undefined;
      if (values.geometryType) {
        const coordResult = validateDmsCoordinates(gpsCoordList, values.geometryType as any);
        if (!coordResult.valid) {
          const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
          toast.error(errMsg);
          setCreateGpsError(errMsg);
          setCreateActiveTabKey('gis');
          return;
        }
        wktCoordinates = serializeCoordinatesToWkt(coordResult.validCoords, values.geometryType as any) || undefined;
      }

      setCreateLoading(true);
      try {
        // Build WKT từ GPS state (lưu vào gis_spatial_objects qua spatial_id — chuẩn GIS dự án)
        const createGeomType = normalizeGeometryType(values.geometryType);
        const coordinates = wktCoordinates;

        const payload = {
          ...values,
          deviceCode: values.deviceCode || (await generateVtsAssistCode()),
          operationalStatus: values.operationalStatus ?? 1,
          geometryType: createGeomType,
          coordinates: coordinates ?? undefined,
          // Cột display_rule là INT; chuỗi 'Độ, phút, giây (DMS)' chỉ để hiển thị (giống /port, /pier)
          displayRule: values.displayRule != null ? Number(values.displayRule) || null : undefined,
        } as CreateVtsAssistRequest;
        // Chuẩn VTS: tạo theo hành động footer — draft/submit/approve
        // (backend resolveCreateApprovalStatus: DRAFT / PENDING_APPROVAL / APPROVED)
        const currentAction = createActionTypeRef.current;
        const created = await createVtsAssist({
          ...payload,
          action: currentAction === 'draft' ? 'draft' : currentAction === 'submit' ? 'submit' : 'approve',
        });
        if (created?.id && uploadFileList.length > 0) {
          for (const f of uploadFileList) {
            if (f?.file) await uploadVtsAssistAttachment(created.id, f.file);
          }
        }
        toast.success(
          currentAction === 'draft'
            ? 'Lưu tạm hệ thống phụ trợ VTS thành công'
            : currentAction === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : 'Lưu và phê duyệt thành công'
        );
        setCreateModalOpen(false);
        createForm.resetFields();
        setGpsCoordList([]);
        setCreateGpsError(null);
        setCreateActiveTabKey('general');
        setUploadFileList([]);
        fetchData();
        fetchTabCounts();
      } catch (error: unknown) {
        console.error("[vtsassist] create error", error); // toast toàn cục đã xử lý ở interceptor api.ts
      } finally {
        setCreateLoading(false);
      }
    },
    [createForm, fetchData, fetchTabCounts, gpsCoordList, uploadFileList]
  );

  const handleUpdate = useCallback(
    async (values: Record<string, unknown>) => {
      if (!updateTarget) return;

      // Kiểm tra chéo giữa Loại đối tượng và Biểu tượng / Tọa độ (chuẩn VTS CHK /berth)
      const hasCoordinates = updateGpsCoordList.some((c) => c.lat !== 0 || c.lng !== 0);
      const hasLocation = Boolean(updateGeometryType || hasCoordinates);
      if (hasCoordinates && !updateGeometryType) {
        toast.error('Loại đối tượng là bắt buộc khi có tọa độ');
        return;
      }
      if (hasLocation && !values.mapSymbolId) {
        toast.error('Biểu tượng bản đồ là bắt buộc');
        return;
      }
      let wktCoordinates: string | undefined;
      if (updateGeometryType) {
        const coordResult = validateDmsCoordinates(updateGpsCoordList, updateGeometryType as any);
        if (!coordResult.valid) {
          const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
          toast.error(errMsg);
          setUpdateGpsError(errMsg);
          setUpdateActiveTabKey('gis');
          return;
        }
        wktCoordinates = serializeCoordinatesToWkt(coordResult.validCoords, updateGeometryType as any) || undefined;
      }

      setUpdateLoading(true);
      try {
        // Build WKT từ GPS state (lưu vào gis_spatial_objects qua spatial_id — chuẩn GIS dự án)
        const updateGeomType = normalizeGeometryType(updateGeometryType);
        const coordinates = wktCoordinates;

        // Chuẩn VTS: Lưu tạm (chỉ update) / Lưu và gửi phê duyệt (update + submit) /
        // Lưu và phê duyệt (update + giữ Đã phê duyệt — T12 backend)
        const currentAction = updateActionTypeRef.current;
        await updateVtsAssist({
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
            if (f?.file) await uploadVtsAssistAttachment(updateTarget.id, f.file);
          }
        }
        if (currentAction === 'submit') {
          await submitVtsAssist(updateTarget.id);
        }
        toast.success(
          currentAction === 'draft'
            ? 'Lưu tạm hệ thống phụ trợ VTS thành công'
            : currentAction === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : 'Lưu và phê duyệt thành công'
        );
        setUpdateModalOpen(false);
        setUpdateTarget(null);
        setUpdateGpsCoordList([]);
        setUpdateGpsError(null);
        setUpdateActiveTabKey('general');
        setUploadFileList([]);
        fetchData();
        fetchTabCounts();
      } catch (error: unknown) {
        console.error("[vtsassist] update error", error); // toast toàn cục đã xử lý ở interceptor api.ts
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
      await submitVtsAssist(submittingRecord.id);
      toast.success("Gửi phê duyệt thành công");
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[vtsassist] submit error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setSubmitLoading(false);
    }
  }, [submittingRecord, fetchData, fetchTabCounts]);

  // Số điểm tối thiểu theo Loại đối tượng hình học (POINT=1 / LINE=2 / POLYGON=3)
  const createMinPoints = createGeometryType ? (GEOMETRY_POINT_COUNT[String(createGeometryType).toUpperCase()] ?? 1) : 1;
  const updateMinPoints = updateGeometryType ? (GEOMETRY_POINT_COUNT[String(updateGeometryType).toUpperCase()] ?? 1) : 1;

  const CHK_FILTER_LABEL = { ...themeTokenChk.filterLabelStyle, fontSize: 13.5 };

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5, filterLabelStyle: CHK_FILTER_LABEL }}>
      <div className="vtsassist-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        .vtsassist-page-wrapper div:has(> button[aria-pressed]) {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          justify-content: safe center !important;
          align-items: center !important;
          gap: 20px !important;
          padding: 2px 16px 6px 16px !important;
          gap: 20px !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
        }
        .vtsassist-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar { height: 6px !important; display: block !important; }
        .vtsassist-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track { background: #f1f5f9 !important; border-radius: 999px !important; }
        .vtsassist-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb { background: #cbd5e1 !important; border-radius: 999px !important; }
        .vtsassist-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover { background: #94a3b8 !important; }
        .vtsassist-page-wrapper div:has(> button[aria-pressed]) > button { white-space: nowrap !important; flex-shrink: 0 !important; cursor: pointer !important; flex: 0 0 auto; }

        /* ── Cỡ chữ 13.5px chuẩn: bảng + popup/drawer con (port đầy đủ từ /cctv ≡ /berth) ── */
        /* ── Breadcrumb title (màn /vts-assist): "Trang chủ" 14px, "Quản lý hệ thống phụ trợ VTS" 16px —
           khóa cỡ 14/16 trên span tiêu đề, thắng cả ép 13.5px của font trang bên dưới ── */
        .vtsassist-page-wrapper .ant-breadcrumb .ant-breadcrumb-item:not(:last-child) > .ant-breadcrumb-link > span { font-size: 14px !important; }
        .vtsassist-page-wrapper .ant-breadcrumb .ant-breadcrumb-item:last-child > .ant-breadcrumb-link > span { font-size: 16px !important; }
        .vtsassist-page-wrapper .ant-table,
        .vtsassist-page-wrapper .ant-table-cell,
        .vtsassist-page-wrapper .ant-table-thead > tr > th,
        .vtsassist-page-wrapper .ant-table-tbody > tr > td,
        .vtsassist-page-wrapper .ant-pagination-item,
        .vtsassist-page-wrapper .ant-pagination-total-text,
        .vtsassist-page-wrapper .ant-breadcrumb,
        .vtsassist-page-wrapper .list-view-table .ant-table-cell,
        .vtsassist-drawer-scope,
        .vtsassist-drawer-scope .ant-drawer-content,
        .vtsassist-drawer-scope .ant-tabs-tab,
        .vtsassist-drawer-scope .chk-detail-label,
        .vtsassist-drawer-scope .chk-detail-value,
        .vtsassist-drawer-scope .ant-table,
        .vtsassist-drawer-scope .ant-table-cell,
        .vtsassist-drawer-scope .list-view-table .ant-table-cell,
        .vtsassist-drawer-scope .ant-table-thead > tr > th,
        .vtsassist-drawer-scope .ant-btn,
        .vtsassist-drawer-scope .ant-select,
        .vtsassist-drawer-scope .ant-select .ant-select-selection-item,
        .vtsassist-drawer-scope .ant-input,
        .vtsassist-drawer-scope .ant-picker,
        .vtsassist-drawer-scope .ant-form-item-label > label,
        .vtsassist-modal-scope,
        .vtsassist-modal-scope .ant-modal-content,
        .vtsassist-modal-scope .ant-modal-title,
        .vtsassist-modal-scope .ant-btn,
        .vtsassist-modal-scope .ant-input,
        .vtsassist-modal-scope .ant-modal-body p,
        .vtsassist-modal-scope .ant-modal-body > p,
        .vtsassist-modal-scope .chk-detail-label,
        .vtsassist-modal-scope .chk-detail-value {
          font-size: 13.5px !important;
        }
        .vtsassist-drawer-scope .chk-detail-label,
        .vtsassist-modal-scope .chk-detail-label,
        .vtsassist-drawer-scope .chk-detail-value,
        .vtsassist-modal-scope .chk-detail-value {
          font-size: 13.5px !important;
        }

        /* ── Grid & Row chi tiết trong Drawer — port chuẩn từ màn /berth ── */
        .vtsassist-drawer-scope .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }
        .vtsassist-drawer-scope .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          box-sizing: border-box !important;
          line-height: 1.5 !important;
        }
        .vtsassist-drawer-scope .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }
        .vtsassist-drawer-scope .chk-detail-label {
          color: ${colors.sidebarBg} !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          line-height: 1.5 !important;
          text-align: left !important;
        }
        .vtsassist-drawer-scope .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }
        .vtsassist-drawer-scope .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }
        .vtsassist-drawer-scope .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }
        .vtsassist-drawer-scope .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }
        .vtsassist-drawer-scope .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }
        @media (max-width: 960px) {
          .vtsassist-drawer-scope .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
        }
        @media (max-width: 640px) {
          .vtsassist-drawer-scope .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .vtsassist-drawer-scope .chk-detail-label,
          .vtsassist-drawer-scope .sec-col1-label,
          .vtsassist-drawer-scope .sec-col2-label,
          .vtsassist-drawer-scope .sec-full-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .vtsassist-drawer-scope .chk-detail-value {
            width: 100% !important;
          }
        }


        /* ── KẸP CỨNG 13.5px (port chuẩn /cctv) — nâng MỌI text/label còn để 13px trong phạm vi /vts-assist ── */
        .vtsassist-page-wrapper.vtsassist-page-wrapper,
        .vtsassist-page-wrapper.vtsassist-page-wrapper div,
        .vtsassist-page-wrapper.vtsassist-page-wrapper span,
        .vtsassist-page-wrapper.vtsassist-page-wrapper p,
        .vtsassist-page-wrapper.vtsassist-page-wrapper label,
        .vtsassist-page-wrapper.vtsassist-page-wrapper li,
        .vtsassist-page-wrapper.vtsassist-page-wrapper a,
        .vtsassist-page-wrapper.vtsassist-page-wrapper button:not(.anticon),
        .vtsassist-page-wrapper.vtsassist-page-wrapper .ant-table-cell,
        .vtsassist-page-wrapper.vtsassist-page-wrapper .ant-table-thead > tr > th,
        .vtsassist-page-wrapper.vtsassist-page-wrapper .ant-table-tbody > tr > td,
        .vtsassist-drawer-scope.vtsassist-drawer-scope .chk-detail-row .chk-detail-label,
        .vtsassist-drawer-scope.vtsassist-drawer-scope .chk-detail-row .chk-detail-value,
        .vtsassist-modal-scope.vtsassist-modal-scope .chk-detail-row .chk-detail-label,
        .vtsassist-modal-scope.vtsassist-modal-scope .chk-detail-row .chk-detail-value {
          font-size: 13.5px !important;
        }
        /* ── Thu nhỏ icon DropdownList (mũi tên xổ + nút xóa) về kích thước compact chuẩn ── */
        .vtsassist-page-wrapper .ant-select .ant-select-suffix,
        .vtsassist-page-wrapper .ant-select .ant-select-clear {
          font-size: 10px !important;
          line-height: 1 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .vtsassist-page-wrapper .ant-select .ant-select-suffix .anticon,
        .vtsassist-page-wrapper .ant-select .ant-select-clear .anticon {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
        }
        .vtsassist-page-wrapper .ant-select .ant-select-suffix svg,
        .vtsassist-page-wrapper .ant-select .ant-select-clear svg {
          font-size: 10px !important;
          width: 10px !important;
          height: 10px !important;
          display: block !important;
        }
        /* Chuẩn cỡ chữ giá trị trong bảng: tên 14 / mã 12 / badge 13 / còn lại 13.5 (+StatusTab text 13) */
        .vtsassist-page-wrapper.vtsassist-page-wrapper .ant-table-row .kcht-cell-title.kcht-cell-title { font-size: 14px !important; }
        .vtsassist-page-wrapper.vtsassist-page-wrapper .kcht-cell-code { font-size: 12px !important; }
        .vtsassist-page-wrapper.vtsassist-page-wrapper .kcht-cell-badge { font-size: 13px !important; }
        .vtsassist-page-wrapper.vtsassist-page-wrapper button[aria-pressed] span { font-size: 13px !important; }
        /* Tiêu đề card (Section header) trong Drawer Xem chi tiết — 14px như /cctv */
        .vtsassist-drawer-scope.vtsassist-drawer-scope .vtsassist-section-card-title { font-size: 14px !important; }
        /* Mũi tên đóng/mở (chevron) trong Drawer Xem chi tiết — cố định 12px như /berth và /cctv */
        .vtsassist-drawer-scope .anticon-down,
        .vtsassist-drawer-scope .anticon-right {
          font-size: 12px !important;
        }
        .vtsassist-drawer-scope .anticon-down svg,
        .vtsassist-drawer-scope .anticon-right svg {
          width: 12px !important;
          height: 12px !important;
        }
        /* ── Bảng tọa độ GPS: giữ nguyên style ghép viên thuốc (Độ 999px 0 0 999px, Phút/Giây 0) ── */
        .vtsassist-drawer-scope .ant-table .ant-input-number,
        .theme-token-scope .ant-table .ant-input-number {
          border-radius: inherit;
        }
      `}</style>
      <ScreenHeader
        breadcrumb={[
          { label: "Trang chủ", path: "/" },
          { label: "Quản lý hệ thống phụ trợ VTS", path: "/vtsassist" },
        ]}
        actions={[
          hasPerm?.("vtsassist:create")
            ? {
                key: "create",
                label: "Thêm mới",
                icon: icons.create,
                variant: "primary" as const,
                onClick: () => {
                  setUploadFileList([]);
                  setCreateModalOpen(true);
                  // Mặc định Tình trạng = 'Đang khai thác/vận hành' (1) khi mở drawer Tạo mới — người dùng có thể đổi sau đó
                  createForm.setFieldsValue({ operationalStatus: 1 });
                  // Sinh trước mã thiết bị để hiển thị preview (giống Mã cảng biển /port)
                  setDeviceCodeLoading(true);
                  generateVtsAssistCode()
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
            <SidebarFilterField
              style={{ marginTop: 12 }}
              labelGap={spaceSm}
              label={<span>Đơn vị quản lý <span style={{ color: statusCritical }}>*</span></span>}
            >
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
            </SidebarFilterField>

            <SidebarFilterField label="Tên thiết bị" labelGap={spaceSm}>
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
            </SidebarFilterField>

            {filterCollapsed && (
              <>
                <SidebarFilterField label="Mã thiết bị" labelGap={spaceSm}>
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
                </SidebarFilterField>

                <SidebarFilterField label="Tình trạng" labelGap={spaceSm}>
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
                </SidebarFilterField>

                <SidebarFilterField label="Thuộc loại hạ tầng" labelGap={spaceSm}>
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
                </SidebarFilterField>

                <SidebarFilterField label="Thuộc hạ tầng" labelGap={spaceSm}>
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
                </SidebarFilterField>

                <SidebarFilterField label="Năm đưa vào sử dụng" labelGap={spaceSm}>
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
                </SidebarFilterField>

                <SidebarFilterField label="Ngày cập nhật" labelGap={spaceSm}>
                  <DatePicker.RangePicker
                    format="DD/MM/YYYY"
                    placeholder={["Từ ngày", "Đến ngày"]}
                    allowClear
                    popupClassName="chk-range-datepicker-popup"
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
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </SidebarFilterField>

                <SidebarFilterField label="Địa điểm (Tỉnh/Thành phố)" labelGap={spaceSm}>
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
                </SidebarFilterField>
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
            label: "Chờ phê duyệt cấp Cảng vụ/Chi cục",
            count: tabCounts["PENDING_APPROVAL"] ?? 0,
            color: statusAttention,
            active: filterValues.approvalStatus === "PENDING_APPROVAL",
          },
          {
            key: "APPROVED_LEVEL1",
            label: "Chờ phê duyệt cấp cục",
            count: tabCounts["APPROVED_LEVEL1"] ?? 0,
            color: statusInfo,
            active: filterValues.approvalStatus === "APPROVED_LEVEL1",
          },
          {
            key: "APPROVED",
            label: "Đã phê duyệt",
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
            <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
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
                  <EmptyState description="Chưa có dữ liệu hệ thống phụ trợ VTS" />
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
        size={undefined}
        width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
        style={{ maxWidth: '96vw' }}
        rootClassName="vtsassist-drawer-scope"
        className="vtsassist-drawer-scope"
        title={<span style={drawerTitleStyle}>Chi tiết hệ thống phụ trợ VTS{selectedRecord ? ` - ${selectedRecord.deviceName || selectedRecord.deviceCode || ''}` : ''}</span>}
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
                  <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                    {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành (card chuẩn /cctv /berth, header cố định — không đóng/mở) ── */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 18px 8px 18px', marginBottom: 14, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeCellTitle, display: 'flex', alignItems: 'center', gap: 8 }}><BankOutlined style={{ color: actionPrimary }} /><span className="vtsassist-section-card-title">Thông tin cơ bản & Quản lý vận hành</span></div>
                      </div>
                      <div className="chk-detail-grid">
                        {(() => {
                          let colIndex = 0;
                          return ([
                            { label: 'Mã thiết bị', value: selectedRecord.deviceCode || null, badge: true },
                            { label: 'Tên thiết bị', value: selectedRecord.deviceName || null, bold: true },
                            { label: 'Đơn vị quản lý', value: selectedRecord.orgUnitName || null, bold: true },
                            { label: 'Thuộc TTDH VTS / Trạm Radar', value: selectedRecord.attachedInfrastructureName || null },
                            { label: 'Đơn vị khai thác', value: selectedRecord.operatingUnitName || null },
                            { label: 'Tỉnh / Thành phố', value: selectedRecord.provinceName || null },
                            { label: 'Tình trạng', value: (() => { if (!selectedRecord.operationalStatus) return null; const stMap: Record<string, { color: string; label: string }> = { 'NOT_YET_OPERATIONAL': { color: 'orange', label: 'Chưa khai thác/vận hành' }, 'OPERATIONAL': { color: 'green', label: 'Đang khai thác/vận hành' }, 'SUSPENDED': { color: 'red', label: 'Dừng khai thác/vận hành' } }; const st = stMap[String(selectedRecord.operationalStatus).toUpperCase()]; return st ? renderVtsAssistStatusBadge(st) : null; })() },
                            { label: 'Địa điểm chi tiết', value: selectedRecord.detailedLocation || null },
                          ] as Array<{ label: string; value: React.ReactNode; badge?: boolean; bold?: boolean; fullWidth?: boolean }>).map((row) => {
                            let labelCls = 'sec-col1-label';
                            if (row.fullWidth) {
                              labelCls = 'sec-full-label';
                              colIndex = 0;
                            } else {
                              labelCls = colIndex % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label';
                              colIndex += 1;
                            }
                            return (
                              <div key={row.label} className={row.fullWidth ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
                                <span className={`chk-detail-label ${labelCls}`}>{row.label}</span>
                                <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', ...(row.bold ? { fontWeight: fontWeightBold } : undefined) }}>
                                  {row.badge && row.value ? (
                                    <span style={statusBadgeStyle(actionPrimary)}>{row.value}</span>
                                  ) : row.value}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* ── Section 2: Thông số kỹ thuật (card chuẩn /cctv, header bấm để đóng/mở) ── */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: detailsSpecsOpen ? '12px 18px 8px 18px' : '10px 18px', marginBottom: 14, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)' }}>
                      <button
                        type="button"
                        aria-expanded={detailsSpecsOpen}
                        aria-label={detailsSpecsOpen ? 'Ẩn mục Thông số kỹ thuật' : 'Hiện mục Thông số kỹ thuật'}
                        onClick={() => setDetailsSpecsOpen(o => !o)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', padding: 0, textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit', marginBottom: detailsSpecsOpen ? 10 : 0, paddingBottom: detailsSpecsOpen ? 8 : 0, borderBottom: detailsSpecsOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeCellTitle, display: 'flex', alignItems: 'center', gap: 8 }}><SlidersOutlined style={{ color: actionPrimary }} /><span className="vtsassist-section-card-title">Thông số kỹ thuật</span></div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{detailsSpecsOpen ? <DownOutlined /> : <RightOutlined />}</span>
                      </button>
                      {detailsSpecsOpen && (
                      <div className="chk-detail-grid">
                        {(() => {
                          let colIndex = 0;
                          return ([
                            { label: 'Model', value: selectedRecord.model || null },
                            { label: 'Hãng sản xuất', value: selectedRecord.manufacturer || null },
                            { label: 'Đơn vị tính', value: selectedRecord.unitOfMeasure != null && UOM_LABELS[selectedRecord.unitOfMeasure] ? UOM_LABELS[selectedRecord.unitOfMeasure] : null },
                            { label: 'Số lượng', value: selectedRecord.quantity != null ? <span style={{ color: textPrimary, fontSize: fontSizeMd }}>{fmtNum(selectedRecord.quantity)}</span> : null },
                            { label: 'Năm đưa vào sử dụng', value: selectedRecord.yearOfUse ? String(selectedRecord.yearOfUse) : null },
                            { label: 'Thông số kỹ thuật', value: selectedRecord.specifications || null, fullWidth: true },
                            { label: 'Thông tin bảo trì', value: selectedRecord.maintenanceInformation || null, fullWidth: true },
                            { label: 'Ghi chú', value: selectedRecord.note || null, fullWidth: true },
                          ] as Array<{ label: string; value: React.ReactNode; badge?: boolean; bold?: boolean; fullWidth?: boolean }>).map((row) => {
                            let labelCls = 'sec-col1-label';
                            if (row.fullWidth) {
                              labelCls = 'sec-full-label';
                              colIndex = 0;
                            } else {
                              labelCls = colIndex % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label';
                              colIndex += 1;
                            }
                            return (
                              <div key={row.label} className={row.fullWidth ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
                                <span className={`chk-detail-label ${labelCls}`}>{row.label}</span>
                                <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', ...(row.bold ? { fontWeight: fontWeightBold } : undefined) }}>
                                  {row.badge && row.value ? (
                                    <span style={statusBadgeStyle(actionPrimary)}>{row.value}</span>
                                  ) : row.value}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      )}
                    </div>

                    {/* ── Section 3: Thông tin phê duyệt (card chuẩn /berth /beacon-stations, header bấm để đóng/mở) ── */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: detailApprovalOpen ? '12px 18px 8px 18px' : '10px 18px', marginBottom: 14, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)' }}>
                      <button
                        type="button"
                        aria-expanded={detailApprovalOpen}
                        aria-label={detailApprovalOpen ? 'Ẩn mục Thông tin phê duyệt' : 'Hiện mục Thông tin phê duyệt'}
                        onClick={() => setDetailApprovalOpen(o => !o)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', padding: 0, textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit', marginBottom: detailApprovalOpen ? 10 : 0, paddingBottom: detailApprovalOpen ? 8 : 0, borderBottom: detailApprovalOpen ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeCellTitle, display: 'flex', alignItems: 'center', gap: 8 }}><AuditOutlined style={{ color: actionPrimary }} /><span className="vtsassist-section-card-title">Thông tin phê duyệt</span></div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{detailApprovalOpen ? <DownOutlined /> : <RightOutlined />}</span>
                      </button>
                      {detailApprovalOpen && (
                      <div className="chk-detail-grid">
                        {(() => {
                          let colIndex = 0;
                          return ([
                            { label: 'Trạng thái phê duyệt', value: renderApprovalBadge(selectedRecord.approvalStatus) },
                            { label: 'Cán bộ cập nhật', value: <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.updatedByName || null}</span> },
                            { label: 'Cán bộ gửi phê duyệt', value: <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.submittedByName || null}</span> },
                            { label: 'Ngày gửi phê duyệt', value: selectedRecord.submittedDate ? formatDate(selectedRecord.submittedDate) : null },
                            { label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.approverLevel1Name || null}</span> },
                            { label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', value: selectedRecord.approvedDateLevel1 ? formatDate(selectedRecord.approvedDateLevel1) : null },
                            { label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục', value: selectedRecord.approvalContentLevel1 || null, fullWidth: true },
                            { label: 'Cán bộ phê duyệt cấp Cục', value: <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.approverLevel2Name || null}</span> },
                            { label: 'Ngày phê duyệt cấp Cục', value: selectedRecord.approvedDateLevel2 ? formatDate(selectedRecord.approvedDateLevel2) : null },
                            { label: 'Nội dung phê duyệt cấp Cục', value: selectedRecord.approvalContentLevel2 || null, fullWidth: true },
                            ...((selectedRecord.rejectionReason && String(selectedRecord.approvalStatus).toUpperCase().indexOf('REJECT') >= 0)
                              ? [{ label: 'Lý do từ chối', value: selectedRecord.rejectionReason, fullWidth: true }]
                              : []),
                          ] as Array<{ label: string; value: React.ReactNode; badge?: boolean; bold?: boolean; fullWidth?: boolean }>).map((row) => {
                            let labelCls = 'sec-col1-label';
                            if (row.fullWidth) {
                              labelCls = 'sec-full-label';
                              colIndex = 0;
                            } else {
                              labelCls = colIndex % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label';
                              colIndex += 1;
                            }
                            return (
                              <div key={row.label} className={row.fullWidth ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
                                <span className={`chk-detail-label ${labelCls}`}>{row.label}</span>
                                <span className="chk-detail-value">{row.value}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: "gis",
                label: `Thông tin vị trí (${parseWktToCoordinates(selectedRecord.coordinates || '').length})`,
                children: (
                  <div style={{ paddingTop: 6, paddingRight: 0, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 18px 8px 18px', marginBottom: 14, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)' }}>
                      <style>{`
                        .vtsassist-drawer-scope .gis-meta-detail.chk-detail-grid,
                        .gis-meta-detail.chk-detail-grid {
                          display: grid !important;
                          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
                          column-gap: 28px !important;
                          row-gap: 0 !important;
                        }
                        .vtsassist-drawer-scope .gis-meta-detail .chk-detail-row,
                        .gis-meta-detail .chk-detail-row {
                          display: flex !important;
                          align-items: flex-start !important;
                          min-height: 36px !important;
                          padding: 7px 0 !important;
                          border-bottom: 1px solid #f1f5f9 !important;
                          line-height: 1.5 !important;
                          gap: 10px !important;
                        }
                        .vtsassist-drawer-scope .gis-meta-detail .chk-detail-row:last-child,
                        .gis-meta-detail .chk-detail-row:last-child {
                          border-bottom: none !important;
                        }
                        .vtsassist-drawer-scope .gis-meta-detail .chk-detail-label,
                        .gis-meta-detail .chk-detail-label {
                          width: 215px !important;
                          min-width: 215px !important;
                          max-width: 215px !important;
                          flex-shrink: 0 !important;
                          color: ${colors.sidebarBg} !important;
                          font-weight: 600 !important;
                          font-size: 13.5px !important;
                          text-align: left !important;
                          line-height: 1.5 !important;
                        }
                        .vtsassist-drawer-scope .gis-meta-detail .sec-col1-label,
                        .gis-meta-detail .sec-col1-label {
                          width: 215px !important;
                          min-width: 215px !important;
                          max-width: 215px !important;
                          flex-shrink: 0 !important;
                        }
                        .vtsassist-drawer-scope .gis-meta-detail .sec-col2-label,
                        .gis-meta-detail .sec-col2-label {
                          width: 250px !important;
                          min-width: 250px !important;
                          max-width: 250px !important;
                          flex-shrink: 0 !important;
                        }
                        .vtsassist-drawer-scope .gis-meta-detail .chk-detail-label::after,
                        .gis-meta-detail .chk-detail-label::after {
                          content: ':' !important;
                          margin-left: 1px !important;
                          margin-right: 4px !important;
                        }
                        .vtsassist-drawer-scope .gis-meta-detail .chk-detail-value,
                        .gis-meta-detail .chk-detail-value {
                          color: #1e293b !important;
                          font-size: 13.5px !important;
                          flex: 1 !important;
                          min-width: 0 !important;
                          text-align: left !important;
                          line-height: 1.5 !important;
                          word-break: break-word !important;
                        }
                      `}</style>
                      <div className="chk-detail-grid gis-meta-detail">
                        {[
                          {
                            label: 'Loại đối tượng',
                            value: selectedRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : selectedRecord.geometryType === 'LINE' ? 'Đối tượng đường' : selectedRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '',
                          },
                          {
                            label: 'Biểu tượng',
                            value: (() => {
                              const symId = (selectedRecord as any)?.mapSymbolId || '';
                              const symName = selectedRecord.mapSymbolName || symbolMap.get(symId) || symId || '';
                              const symImg = symbolImageMap.get(symId);
                              return (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                  {symImg ? <img src={symImg} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : null}
                                  {symName}
                                </span>
                              );
                            })(),
                          },
                          {
                            label: 'Hệ quy chiếu',
                            value: selectedRecord.coordinateSystem === 1 ? 'WGS-84' : selectedRecord.coordinateSystem === 2 ? 'VN-2000' : (selectedRecord.coordinateSystem ? String(selectedRecord.coordinateSystem) : ''),
                          },
                          {
                            label: 'Quy tắc hiển thị',
                            value: selectedRecord.geometryType || selectedRecord.coordinates ? 'Độ, phút, giây (DMS)' : '',
                          },
                        ].map((row, i) => (
                          <div key={i} className="chk-detail-row">
                            <span className={`chk-detail-label ${i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{row.label}</span>
                            <span className="chk-detail-value">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>
                        Tọa độ GPS ({parseWktToCoordinates(selectedRecord.coordinates || '').length})
                      </span>
                      <Button
                        icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                        onClick={() => openGisMap('detail')}
                        style={{
                          ...outlineButtonStyle,
                          height: 32,
                          fontSize: 13.5,
                          padding: '0 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        Xem vị trí trên bản đồ
                      </Button>
                    </div>
                    <DetailTable
                      scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                      dataSource={parseWktToCoordinates(selectedRecord.coordinates || '')}
                      emptyText="Chưa có tọa độ GPS nào"
                      emptyHeightAuto
                      columns={[
                        { title: 'STT', width: 50 },
                        {
                          title: 'Vĩ độ (Latitude - N)',
                          key: 'lat',
                          render: (_value: unknown, record: { latitude?: number | null; longitude?: number | null }) => {
                            const latitudeValue = record.latitude;
                            if (latitudeValue == null || Number.isNaN(Number(latitudeValue))) return null;
                            const dms = ddToDms(latitudeValue);
                            return `${dms.d}° ${dms.m}' ${dms.s}" N`;
                          },
                        },
                        {
                          title: 'Kinh độ (Longitude - E)',
                          key: 'lng',
                          render: (_value: unknown, record: { latitude?: number | null; longitude?: number | null }) => {
                            const longitudeValue = record.longitude;
                            if (longitudeValue == null || Number.isNaN(Number(longitudeValue))) return null;
                            const dms = ddToDms(longitudeValue);
                            return `${dms.d}° ${dms.m}' ${dms.s}" E`;
                          },
                        },
                      ]}
                    />
                  </div>
                ),
              },
              {
                key: 'files', label: `File đính kèm (${Array.isArray(detailFiles) ? detailFiles.length : 0})`,
                children: (
                  <div style={{ paddingTop: 6 }} className="vtsassist-files-table">
                    <style>{`
                      .vtsassist-files-table .ant-table-thead > tr > th {
                        border-bottom: 1px solid #f1f5f9 !important;
                        box-shadow: none !important;
                      }
                    `}</style>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 13.5 }}>File đính kèm</span>
                    </div>
                    <InfrastructureAttachmentTab
                      attachments={detailFiles}
                      readonly
                      readonlyBerthLayout
                      userMap={userMap}
                      loadReadonlyPreviewImage={(attachmentId) => {
                        const targetId = selectedRecord?.id || updateTarget?.id;
                        if (!targetId) return Promise.reject(new Error('Chưa xác định được bản ghi vệ tinh VTS-Assist để tải ảnh'));
                        return api.get(`/v1/vtsassist/${targetId}/attachments/${attachmentId}/download`, { responseType: "blob" })
                          .then((res: any) => new Blob([res.data]));
                      }}
                      onDownload={handleDownloadAttachmentItem}
                    />
                  </div>
                ),
              },
              {
                key: "operationMaintenance",
                label: "Vận hành & bảo trì",
                children: (
                  <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
                    {/* ── Card 1: Thông tin vận hành khai thác (accordion đóng/mở) ── */}
                    <div style={{ ...detailOpCardStyle, padding: opRunOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                      <div
                        onClick={() => setOpRunOpen((o) => !o)}
                        style={detailCardHeaderStyle(opRunOpen)}
                      >
                        <div style={detailCardTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span className="vtsassist-section-card-title">Thông tin vận hành khai thác</span></div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{opRunOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}</span>
                      </div>
                      {opRunOpen && (
                        <DetailTable
                          dataSource={[]}
                          emptyText="Chưa có dữ liệu"
                          rowKey={(r: any) => r.id || r.planCode || r.code}
                          scrollY={160}
                          columns={[
                            { title: 'STT', width: 50 },
                            { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                            { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                            { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.startTime || rec.start || null) },
                            { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.endTime || rec.end || null) },
                          ]}
                        />
                      )}
                    </div>

                    {/* ── Card 2: Thông tin bảo trì (accordion đóng/mở) ── */}
                    <div style={{ ...detailOpCardStyle, padding: opMaintOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                      <div
                        onClick={() => setOpMaintOpen((o) => !o)}
                        style={detailCardHeaderStyle(opMaintOpen)}
                      >
                        <div style={detailCardTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span className="vtsassist-section-card-title">Thông tin bảo trì</span></div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{opMaintOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}</span>
                      </div>
                      {opMaintOpen && (
                        <DetailTable
                          dataSource={[]}
                          emptyText="Chưa có dữ liệu"
                          rowKey={(r: any) => r.id || r.planCode || r.code}
                          scrollY={160}
                          columns={[
                            { title: 'STT', width: 50 },
                            { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                            { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                            { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.start || rec.startDate || null) },
                            { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.end || rec.endDate || null) },
                          ]}
                        />
                      )}
                    </div>

                    {/* ── Card 3: Thông tin sự cố (accordion đóng/mở) ── */}
                    <div style={{ ...detailOpCardStyle, padding: opIncidentOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                      <div
                        onClick={() => setOpIncidentOpen((o) => !o)}
                        style={detailCardHeaderStyle(opIncidentOpen)}
                      >
                        <div style={detailCardTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span className="vtsassist-section-card-title">Thông tin sự cố</span></div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{opIncidentOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}</span>
                      </div>
                      {opIncidentOpen && (
                        <DetailTable
                          dataSource={[]}
                          emptyText="Chưa có dữ liệu"
                          rowKey={(r: any) => r.id || r.planCode || r.code}
                          scrollY={160}
                          columns={[
                            { title: 'STT', width: 50 },
                            { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                            { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec.type || '' },
                            { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || '' },
                            { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.time || null) },
                          ]}
                        />
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* Approve Modal — dùng chung 2 cấp (C1 Cảng vụ / C2 Cục) (chuẩn /berth) */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approveLevel}
        loading={approveLoading}
        onConfirm={(content) => { void handleApprove(content); }}
        onCancel={() => {
          setApproveTarget(null);
          setApproveModalOpen(false);
        }}
      />

      {/* Submit Approval Modal — Gửi phê duyệt (chuẩn /berth) */}
      <Modal
        rootClassName="vtsassist-modal-scope"
        className="vtsassist-modal-scope"
        title={
          <span
            style={{
              color: colors.sidebarBg,
              fontWeight: fontWeightBold,
              fontSize: fontSizeLg,
            }}
          >
            Xác nhận gửi Cảng vụ phê duyệt
          </span>
        }
        open={submitModalOpen}
        onCancel={() => {
          setSubmitModalOpen(false);
          setSubmittingRecord(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setSubmitModalOpen(false);
              setSubmittingRecord(null);
            }}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
              borderColor: borderDefault,
              color: textSecondary,
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleConfirmSubmit}
            loading={submitLoading}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
              background: actionPrimary,
              borderColor: actionPrimary,
            }}
          >
            Xác nhận
          </Button>,
        ]}
        width={480}
      >
        <div style={{ padding: "8px 0" }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.deviceCode ? `${submittingRecord.deviceCode} — ` : ''}{submittingRecord?.deviceName}</strong> để Cảng vụ phê duyệt?
          </p>
        </div>
      </Modal>

      {/* Reject Modal (chuẩn /berth) */}
      <Modal
        rootClassName="vtsassist-modal-scope"
        className="vtsassist-modal-scope"
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
          setRejectModalOpen(false);
          setRejectTarget(null);
          setRejectReason("");
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRejectModalOpen(false);
              setRejectTarget(null);
              setRejectReason("");
            }}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
              borderColor: borderDefault,
              color: textSecondary,
            }}
          >
            Hủy
          </Button>,
          <Button
            key="reject"
            type="primary"
            danger
            loading={rejectLoading}
            onClick={handleReject}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
            }}
          >
            Xác nhận từ chối
          </Button>,
        ]}
        width={480}
      >
        <div style={{ padding: "8px 0" }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập lý do từ chối cho thiết bị phụ trợ VTS:
          </p>
          {rejectTarget && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>
                {rejectTarget.deviceCode ? `${rejectTarget.deviceCode} — ` : ''}{rejectTarget.deviceName}
              </strong>
            </p>
          )}
          <Input.TextArea
            placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            maxLength={500}
            showCount
            style={{ borderRadius: 8, fontSize: fontSizeMd }}
          />
        </div>
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
      <AppDrawer
        width="min(920px, 96vw)"
        style={{ maxWidth: '96vw' }}
        rootClassName="vtsassist-drawer-scope"
        className="vtsassist-drawer-scope"
        title={
          <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
            Thêm mới hệ thống phụ trợ VTS
          </span>
        }
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
          setGpsCoordList([]);
          setUploadFileList([]);
        }}
        footer={
          <>
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
          </>
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
            activeKey={createActiveTabKey}
            onChange={setCreateActiveTabKey}
            tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 100, background: surfaceCard }}
            items={[
              {
                key: 'general',
                label: 'Thông tin chung',
                children: (
                  <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                    {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
                    <div style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <BankOutlined style={{ color: actionPrimary }} />
                          <span>Thông tin cơ bản & Quản lý vận hành</span>
                        </div>
                      </div>
                      <Row gutter={[24, 0]}>
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
                            validateStatus={atMaxCreate.deviceName ? 'error' : undefined}
                            help={atMaxCreate.deviceName ? 'Đã đạt tối đa 255 ký tự' : undefined}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập tên thiết bị..."
                              maxLength={255}
                              showCount
                              style={{ ...pillStyle, fontFamily: fontSans }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[24, 0]}>
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
                                createForm.setFieldValue("attachedInfrastructureId", undefined);
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[24, 0]}>
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
                            rules={[
                              { required: true, message: "Vui lòng chọn đơn vị khai thác" },
                            ]}
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
                      <Row gutter={[24, 0]}>
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
                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            name="detailedLocation"
                            {...labelProps('Địa điểm chi tiết')}
                            rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 500 ? Promise.reject(new Error('Đã đạt tối đa 500 ký tự')) : Promise.resolve() }]}
                            validateStatus={atMaxCreate.detailedLocation ? 'error' : undefined}
                            help={atMaxCreate.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              maxLength={500}
                              showCount
                              placeholder="Nhập địa điểm chi tiết..."
                              style={{ ...pillStyle, fontFamily: fontSans }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    {/* ── Section 2: Thông số kỹ thuật & Thiết bị ── */}
                    <div style={{ ...sectionBoxStyle, paddingBottom: 22 }}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span>Thông số kỹ thuật & Thiết bị</span>
                        </div>
                      </div>
                      <Row gutter={[24, 0]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="model"
                            {...labelProps('Model')}
                            validateStatus={atMaxCreate.model ? 'error' : undefined}
                            help={atMaxCreate.model ? 'Đã đạt tối đa 255 ký tự' : undefined}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập model..."
                              maxLength={255}
                              showCount
                              style={{ ...pillStyle, fontFamily: fontSans }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="manufacturer"
                            {...labelProps('Hãng sản xuất')}
                            rules={[{ max: 50, message: "Tối đa 50 ký tự" }]}
                            validateStatus={atMaxCreate.manufacturer ? 'error' : undefined}
                            help={atMaxCreate.manufacturer ? 'Đã đạt tối đa 50 ký tự' : undefined}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập hãng..."
                              maxLength={50}
                              showCount
                              style={{ ...pillStyle, fontFamily: fontSans }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[24, 0]}>
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
                              formatter={fmtInputNumber}
                              style={{ width: "100%", ...pillStyle }}
                              placeholder="0"
                            />
                          </Form.Item>
                        </Col>
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
                      </Row>
                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            name="specifications"
                            {...labelProps('Thông số kỹ thuật')}
                            rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                            validateStatus={atMaxCreate.specifications ? 'error' : undefined}
                            help={atMaxCreate.specifications ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                            style={{ marginBottom: 0 }}
                          >
                            <Input.TextArea
                              rows={3}
                              placeholder="Nhập thông số kỹ thuật..."
                              maxLength={2000}
                              showCount
                              style={themeTokenChk.textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    {/* ── Section 3: Thông tin đưa vào sử dụng & Bảo trì ── */}
                    <div style={{ ...sectionBoxStyle, marginBottom: 0, paddingBottom: 22 }}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <FileTextOutlined style={{ color: actionPrimary }} />
                          <span>Thông tin đưa vào sử dụng & Bảo trì</span>
                        </div>
                      </div>
                      <Row gutter={[24, 0]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="yearOfUse"
                            {...labelProps('Năm đưa vào sử dụng')}
                            normalize={(value: dayjs.Dayjs | null) => (value ? value.year() : null)}
                            getValueProps={(value: number | null | undefined) => ({
                              value: value != null && !Number.isNaN(Number(value)) ? dayjs(String(value)) : null,
                            })}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <DatePicker
                              picker="year"
                              format="YYYY"
                              placeholder="Chọn năm"
                              allowClear
                              style={{ width: '100%', ...pillStyle }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            name="maintenanceInformation"
                            {...labelProps('Thông tin bảo trì')}
                            rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                            validateStatus={atMaxCreate.maintenanceInformation ? 'error' : undefined}
                            help={atMaxCreate.maintenanceInformation ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea
                              rows={3}
                              placeholder="Nhập thông tin bảo trì..."
                              maxLength={2000}
                              showCount
                              style={themeTokenChk.textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            name="note"
                            {...labelProps('Ghi chú')}
                            rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                            validateStatus={atMaxCreate.note ? 'error' : undefined}
                            help={atMaxCreate.note ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                            style={{ marginBottom: 0 }}
                          >
                            <Input.TextArea
                              rows={3}
                              placeholder="Nhập ghi chú..."
                              maxLength={2000}
                              showCount
                              style={themeTokenChk.textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },
              {
                key: 'gis',
                label: `Thông tin vị trí (${gpsCoordList.length})`,
                children: (
                  <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                    <VtsAssistGisTab
                      geometryType={createGeometryType}
                      rows={gpsCoordList}
                      symbols={symbols}
                      onAddRow={() => {
                        setGpsCoordList((prev) => [...prev, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
                        setCreateGpsError(null);
                      }}
                      onUpdatePoint={updateCreateGpsPoint}
                      onDeleteRow={(index) => {
                        setGpsCoordList((prev) => prev.filter((_, idx) => idx !== index));
                        setCreateGpsError(null);
                      }}
                      minPoints={createMinPoints}
                      onOpenMap={() => openGisMap('create')}
                      gpsError={createGpsError}
                    />
                  </div>
                ),
              },
              {
                key: 'attachments',
                label: `File đính kèm (${uploadFileList.length})`,
                children: (
                  <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                    <InfrastructureAttachmentTab attachments={uploadFileList} onUpload={handleEditUploadFile} onDelete={handleEditDeleteFile} onDownload={handleDownloadAttachmentItem} />
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </AppDrawer>

      {/* ── Edit Drawer ──────────────────────────────────────────────── */}
      <AppDrawer
        width="min(920px, 96vw)"
        style={{ maxWidth: '96vw' }}
        rootClassName="vtsassist-drawer-scope"
        className="vtsassist-drawer-scope"
        title={
          <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
            Chỉnh sửa thông tin — {updateTarget?.deviceName || null}
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
        footer={
          <>
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
          </>
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
            activeKey={updateActiveTabKey}
            onChange={setUpdateActiveTabKey}
            tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 100, background: surfaceCard }}
            items={[
              {
                key: 'general',
                label: 'Thông tin chung',
                children: (
                  <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                    {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
                    <div style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <BankOutlined style={{ color: actionPrimary }} />
                          <span>Thông tin cơ bản & Quản lý vận hành</span>
                        </div>
                      </div>
                      <Row gutter={[24, 0]}>
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
                            validateStatus={atMaxUpdate.deviceName ? 'error' : undefined}
                            help={atMaxUpdate.deviceName ? 'Đã đạt tối đa 255 ký tự' : undefined}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              maxLength={255}
                              showCount
                              style={{ ...pillStyle, fontFamily: fontSans }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[24, 0]}>
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
                      <Row gutter={[24, 0]}>
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
                            rules={[
                              { required: true, message: "Vui lòng chọn đơn vị khai thác" },
                            ]}
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
                      <Row gutter={[24, 0]}>
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
                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            name="detailedLocation"
                            {...labelProps('Địa điểm chi tiết')}
                            rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 500 ? Promise.reject(new Error('Đã đạt tối đa 500 ký tự')) : Promise.resolve() }]}
                            validateStatus={atMaxUpdate.detailedLocation ? 'error' : undefined}
                            help={atMaxUpdate.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              maxLength={500}
                              showCount
                              placeholder="Nhập địa điểm chi tiết..."
                              style={{ ...pillStyle, fontFamily: fontSans }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    {/* ── Section 2: Thông số kỹ thuật & Thiết bị ── */}
                    <div style={{ ...sectionBoxStyle, paddingBottom: 22 }}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span>Thông số kỹ thuật & Thiết bị</span>
                        </div>
                      </div>
                      <Row gutter={[24, 0]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="model"
                            {...labelProps('Model')}
                            validateStatus={atMaxUpdate.model ? 'error' : undefined}
                            help={atMaxUpdate.model ? 'Đã đạt tối đa 255 ký tự' : undefined}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              maxLength={255}
                              showCount
                              style={{ ...pillStyle, fontFamily: fontSans }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="manufacturer"
                            {...labelProps('Hãng sản xuất')}
                            validateStatus={atMaxUpdate.manufacturer ? 'error' : undefined}
                            help={atMaxUpdate.manufacturer ? 'Đã đạt tối đa 50 ký tự' : undefined}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              maxLength={50}
                              showCount
                              style={{ ...pillStyle, fontFamily: fontSans }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[24, 0]}>
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
                              formatter={fmtInputNumber}
                              style={{ width: "100%", ...pillStyle }}
                              placeholder="0"
                            />
                          </Form.Item>
                        </Col>
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
                      </Row>
                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            name="specifications"
                            {...labelProps('Thông số kỹ thuật')}
                            rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                            validateStatus={atMaxUpdate.specifications ? 'error' : undefined}
                            help={atMaxUpdate.specifications ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                            style={{ marginBottom: 0 }}
                          >
                            <Input.TextArea
                              rows={3}
                              placeholder="Nhập thông số kỹ thuật..."
                              maxLength={2000}
                              showCount
                              style={themeTokenChk.textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    {/* ── Section 3: Thông tin đưa vào sử dụng & Bảo trì ── */}
                    <div style={{ ...sectionBoxStyle, marginBottom: 0, paddingBottom: 22 }}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <FileTextOutlined style={{ color: actionPrimary }} />
                          <span>Thông tin đưa vào sử dụng & Bảo trì</span>
                        </div>
                      </div>
                      <Row gutter={[24, 0]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="yearOfUse"
                            {...labelProps('Năm đưa vào sử dụng')}
                            normalize={(value: dayjs.Dayjs | null) => (value ? value.year() : null)}
                            getValueProps={(value: number | null | undefined) => ({
                              value: value != null && !Number.isNaN(Number(value)) ? dayjs(String(value)) : null,
                            })}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <DatePicker
                              picker="year"
                              format="YYYY"
                              placeholder="Chọn năm đưa vào sử dụng"
                              allowClear
                              style={{ width: '100%', ...pillStyle }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            name="maintenanceInformation"
                            {...labelProps('Thông tin bảo trì')}
                            rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                            validateStatus={atMaxUpdate.maintenanceInformation ? 'error' : undefined}
                            help={atMaxUpdate.maintenanceInformation ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea
                              rows={3}
                              placeholder="Nhập thông tin bảo trì..."
                              maxLength={2000}
                              showCount
                              style={themeTokenChk.textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            name="note"
                            {...labelProps('Ghi chú')}
                            rules={[{ warningOnly: true, validator: (_: unknown, v: unknown) => String(v ?? '').length >= 2000 ? Promise.reject(new Error('Đã đạt tối đa 2000 ký tự')) : Promise.resolve() }]}
                            validateStatus={atMaxUpdate.note ? 'error' : undefined}
                            help={atMaxUpdate.note ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                            style={{ marginBottom: 0 }}
                          >
                            <Input.TextArea
                              rows={3}
                              placeholder="Nhập ghi chú..."
                              maxLength={2000}
                              showCount
                              style={themeTokenChk.textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },
              {
                key: 'gis',
                label: `Thông tin vị trí (${updateGpsCoordList.length})`,
                children: (
                  <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                    <VtsAssistGisTab
                      geometryType={updateGeometryType}
                      rows={updateGpsCoordList}
                      symbols={symbols}
                      onAddRow={() => {
                        setUpdateGpsCoordList((prev) => [...prev, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
                        setUpdateGpsError(null);
                      }}
                      onUpdatePoint={updateEditGpsPoint}
                      onDeleteRow={(index) => {
                        setUpdateGpsCoordList((prev) => prev.filter((_, idx) => idx !== index));
                        setUpdateGpsError(null);
                      }}
                      minPoints={updateMinPoints}
                      onOpenMap={() => openGisMap('edit')}
                      gpsError={updateGpsError}
                    />
                  </div>
                ),
              },
              {
                key: 'attachments',
                label: `File đính kèm (${uploadFileList.length})`,
                children: (
                  <div style={{ ...themeTokenChk.drawerFormScrollStyle, paddingTop: spaceMd }}>
                    <InfrastructureAttachmentTab attachments={uploadFileList} onUpload={handleEditUploadFile} onDelete={handleEditDeleteFile} onDownload={handleDownloadAttachmentItem} />
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </AppDrawer>

      {/* ── History Drawer ─────────────────────────────────────── */}
      <AppDrawer
        width="min(880px, 96vw)"
        rootClassName="vtsassist-drawer-scope"
        className="vtsassist-drawer-scope"
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyTarget ? `Lịch sử thay đổi — ${historyTarget.deviceName}` : (historyEntityName ? `Lịch sử thay đổi — ${historyEntityName}` : 'Lịch sử thay đổi')}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                Tổng cộng {historyFieldCount}
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
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
        {!historyLoading && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input
              placeholder="Tìm kiếm nội dung thay đổi..."
              allowClear
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
            />
            <DatePicker
              placeholder="Từ ngày"
              classNames={{ popup: { root: 'history-dt-popup' } }}
              value={historyFrom ? dayjs(historyFrom) : null}
              onChange={d => setHistoryFrom(d ? d.format('YYYY-MM-DD') : '')}
              style={{ width: 140, borderRadius: radiusPill, height: 40 }}
              format="DD/MM/YYYY"
            />
            <DatePicker
              placeholder="Đến ngày"
              classNames={{ popup: { root: 'history-dt-popup' } }}
              value={historyTo ? dayjs(historyTo) : null}
              onChange={d => setHistoryTo(d ? d.format('YYYY-MM-DD') : '')}
              style={{ width: 140, borderRadius: radiusPill, height: 40 }}
              format="DD/MM/YYYY"
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
            >
              Tìm kiếm
            </Button>
          </div>
        )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {historyLoading ? (
          <LoadingSkeleton rows={5} />
        ) : historyRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
            <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
            <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
          </div>
        ) : (
          renderVtsAssistHistoryTimeline(historyRecords)
        )}
        </div>
      </AppDrawer>
      {/* Modal bản đồ GIS — Chọn tọa độ (Thêm mới/Sửa) / Xem vị trí (Chi tiết) */}
      {gisMapModal && gisMapContext && (
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined style={{ color: actionPrimary }} />
              <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
                {gisMapModal === 'detail' ? 'Xem vị trí trên bản đồ' : 'Chọn vị trí & tọa độ trên bản đồ chuyên dụng'}
              </span>
            </div>
          }
          open
          onCancel={() => setGisMapModal(null)}
          destroyOnHidden
          width="94vw"
          style={{ top: 20, maxWidth: '1400px' }}
          footer={
            gisMapModal === 'detail' ? null : [
              <Button
                key="cancel"
                onClick={() => setGisMapModal(null)}
                style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}
              >
                Hủy
              </Button>,
              <Button
                key="ok"
                type="primary"
                onClick={() => {
                  setGisMapModal(null);
                  toast.success('Đã xác nhận tọa độ từ bản đồ');
                }}
                style={{ ...primaryButtonStyle, height: 36, borderRadius: radiusPill }}
              >
                Xác nhận tọa độ
              </Button>,
            ]
          }
        >
          <div style={{ padding: '8px 0' }}>
            <GisLocationSelector
              inline
              height={560}
              disabled={gisMapModal === 'detail'}
              value={{
                geometryType: gisMapContext.geom,
                coordinates: serializeCoordinatesToWkt(gisMapContext.rows, gisMapContext.geom),
                symbolId: gisMapContext.symbolId,
              }}
              defaultGeometryType={gisMapContext.geom}
              onChange={(val) => applyGisMapResult(val)}
            />
          </div>
        </Modal>
      )}
    </ThemeTokenProvider>
  );
};

export default VtsAssistListPage;
