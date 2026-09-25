import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Modal,
  Row,
  Col,
  Tabs,
  Space,
  Dropdown,
  type MenuProps,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SlidersOutlined,
  FileTextOutlined,
  EditOutlined,
  EyeOutlined,
  DownOutlined,
  RightOutlined,
  MoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { navigationChannelCRUD, navigationChannelApproval } from '../../services/navigationChannelService';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { symbolService } from '../../services/symbolService';
import { userService } from '../../services/userService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import {
  firstErrorFieldName,
  firstErrorMessage,
  resolveMainFormTabForField,
  resolveRouteDrawerTabForField,
  type FormFinishFailedInfo,
} from '../../utils/navigationChannelFormTabs';
import { FormOrgUnitTreeSelect, resolveOrgSubtreeIds, resolveDefaultFormOrgUnitId, normalizeSearchText } from '../../components/org-unit';
import InfrastructureAttachmentTab, {
  triggerBlobDownload,
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import DetailTable from '../../components/shared/DetailTable';
import AppDrawer from '../../components/shared/AppDrawer';
import KchtFormFooter from '../../components/kcht/KchtFormFooter';
import type {
  NavigationChannelResponse,
  CreateNavigationChannelRequest,
  UpdateNavigationChannelRequest,
  ConditionStatus,
  ChannelRouteDetailRequest,
  NavigationChannelAttachment,
} from '../../types/navigationChannel';
import { CONDITION_STATUS_OPTIONS } from '../../types/navigationChannel';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { useAuthStore } from '../../store/authStore';
import { fmtInputNumber } from '../../utils/numFmt';
import { NumberInputWithCount } from '../../components/shared/NumberInputWithCount';
import {
  parseNumber20,
  getValueFromEvent20,
  decimalNumberRule,
  parseNumber5,
  getValueFromEvent5,
  integer5NonNegativeRule,
  safeDecimal,
} from '../../utils/numberRuleHelper';
import {
  DRAWER_TABLE_SCROLL_Y,
  primaryButtonStyle,
  outlineButtonStyle,
  spaceFormField,
  textPrimary,
  textTertiary,
  fontWeightBold,
  fontSizeSm,
  fontSizeLg,
  drawerTabBarStyle,
  drawerFormScrollStyle,
  drawerTitleStyle,
  drawerFooterStyle,
  requiredMarkStyle,
  radiusPill,
  radiusMd,
  surfaceCard,
  borderDefault,
  actionPrimary,
  statusCritical,
  statusOperational,
  readonlyInputStyle,
  textAreaStyle,
  sidebarBg,
  spaceXs,
  spaceSm,
  colors,
  rowActionButtonStyle,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider, THEME_SCOPE_CLASS } from '../../context/ThemeTokenContext';
import {
  GEOMETRY_POINT_COUNT,
  parseWktToCoordinates,
  validateDmsCoordinates,
  serializeCoordinatesToWkt,
  ddToDms,
  dmsToDd,
} from '../../utils/gisGeometry';
import { useKchtPermissions } from '../../hooks/useKchtPermissions';

const fontSizeMd = 13.5;

// Thông báo bắt buộc chọn Đơn vị quản lý (dùng chung cho validate field & chặn submit).
const ORG_UNIT_REQUIRED_MESSAGE = 'Vui lòng chọn Đơn vị quản lý';

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

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

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const COORD_SYS_OPTIONS = [
  { value: 'WGS-84', label: 'WGS-84' },
  { value: 'VN-2000', label: 'VN-2000' },
];

const ROUTE_TYPE_OPTIONS = [
  { value: 1, label: 'Tuyến luồng công cộng' },
  { value: 2, label: 'Tuyến luồng chuyên dùng' },
];

const ROUTE_TYPE_MAP: Record<number, string> = { 1: 'Công cộng', 2: 'Chuyên dùng' };

export const DEFAULT_CHANNEL_GIS_SYMBOLS = [
  { id: 'a1b2c3d4-e5f6-7a8b-9c0d-112233445523', code: 'CHANNEL', name: 'Luồng hàng hải', image: '' },
  { id: '1', code: 'SYM-VTS', name: 'Trung tâm điều hành VTS', image: '' },
  { id: '2', code: 'SYM-INMARSAT', name: 'Đài thông tin vệ tinh Inmarsat', image: '' },
  { id: '3', code: 'SYM-COASTAL', name: 'Đài thông tin duyên hải', image: '' },
  { id: '4', code: 'SYM-AIS', name: 'Trạm bờ AIS', image: '' },
  { id: '5', code: 'SYM-RADAR', name: 'Trạm radar hàng hải', image: '' },
  { id: '6', code: 'SYM-BUOY', name: 'Phao báo hiệu hàng hải', image: '' },
  { id: '7', code: 'SYM-BEACON', name: 'Trạm đèn biển (Hải đăng)', image: '' },
  { id: '8', code: 'SYM-PORT', name: 'Cảng biển / Bến cảng', image: '' },
  { id: '9', code: 'SYM-ANCHORAGE', name: 'Khu neo đậu / Đón trả hoa tiêu', image: '' },
];

const formatNumber = (v: number | string | null | undefined): string | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 6 });
};

type DetailRow = { label: string; value: React.ReactNode; span?: boolean };

const renderDetailRowsTwoCol = (rows: DetailRow[]) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      columnGap: 24,
      rowGap: 0,
    }}
  >
    {rows.map((row) => (
      <div
        key={row.label}
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 36,
          padding: '6px 0',
          borderBottom: '1px solid #f1f5f9',
          gridColumn: row.span ? '1 / -1' : undefined,
        }}
      >
        <span
          style={{
            width: 220,
            minWidth: 220,
            flexShrink: 0,
            color: colors.sidebarBg,
            fontWeight: fontWeightBold,
            fontSize: fontSizeMd,
          }}
        >
          {row.label}
        </span>
        <span style={{ fontSize: fontSizeMd, color: textPrimary, flex: 1 }}>{row.value}</span>
      </div>
    ))}
  </div>
);

const trimString = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;

const toNullableString = (v: unknown, isEdit: boolean): string | null | undefined => {
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed !== '' ? trimmed : (isEdit ? null : undefined);
  }
  return isEdit ? null : undefined;
};

const toNullableNumber = (v: unknown, isEdit: boolean): number | null | undefined => {
  if (v !== null && v !== undefined && v !== '') {
    const num = Number(v);
    if (!isNaN(num)) return num;
  }
  return isEdit ? null : undefined;
};

const dmsUnitStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 3px',
  background: '#f5f5f5',
  border: `1px solid ${borderDefault}`,
  borderLeft: 0,
  borderRight: 0,
  height: 32,
  fontSize: fontSizeSm,
  color: textTertiary,
};

const dmsUnitEndStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 3px',
  background: '#f5f5f5',
  border: `1px solid ${borderDefault}`,
  borderLeft: 0,
  height: 32,
  borderRadius: '0 999px 999px 0',
  fontSize: fontSizeSm,
  color: textTertiary,
};

interface DmsCoord {
  latD: number | null;
  latM: number | null;
  latS: number | null;
  lngD: number | null;
  lngM: number | null;
  lngS: number | null;
}

const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
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

  const hasError = started && inputs.some((inp) => !!inp.msg);

  const inputRow = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 360, margin: '0 auto', minWidth: 0 }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ display: 'flex', flex: inp.basis, minWidth: 0, width: inp.width }}>
          <InputNumber
            className="chk-dms-input-number"
            value={inp.value}
            min={0}
            max={inp.max}
            step={inp.step}
            placeholder={inp.base}
            formatter={inp.formatter}
            status={inp.msg ? 'error' : undefined}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(raw) => inp.onEdit(raw == null ? null : Number(raw))}
            style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32, textAlign: 'center' }}
            controls={false}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

  const messageRow = hasError ? (
    <div aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%', maxWidth: 360, margin: `${spaceXs}px auto 0 auto`, minWidth: 0, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width, textAlign: 'center' }}>
          {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minWidth: 0 }}>
      {inputRow}
      {messageRow}
    </div>
  );
};

export interface NavigationChannelFormProps {
  open?: boolean;
  editId?: string | null;
  mode?: 'create' | 'edit';
  onCancel?: () => void;
  onSuccess?: (savedRecord?: any) => void;
}

export default function NavigationChannelForm({ open, editId, mode, onCancel, onSuccess }: NavigationChannelFormProps = {}) {
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <NavigationChannelFormInner open={open} editId={editId} mode={mode} onCancel={onCancel} onSuccess={onSuccess} />
    </ThemeTokenProvider>
  );
}

function NavigationChannelFormInner({ open, editId, mode, onCancel, onSuccess }: NavigationChannelFormProps = {}) {
  const navigate = useNavigate();
  const routeParams = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const submitAfterSaveRef = useRef(false);
  const saveActionRef = useRef<'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED'>('DRAFT');
  const currentUser = useAuthStore((s) => s.user);
  // Cờ duyệt lấy từ bộ quyền chuẩn KCHT (tham chiếu /vts-system): gồm cả vế cấp Cục
  // và quyền tường minh, không suy diễn từ `*`/`admin:all`.
  const kchtPerms = useKchtPermissions('navigationchannel');
  const canApprove = kchtPerms.canSaveAndApprove;

  const isIframe = window.self !== window.top;
  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeParams.id;
  const isEditMode = isModalMode ? (mode === 'edit') : searchParams.get('mode') === 'edit' || (!!id && !searchParams.get('mode'));
  const isCreateMode = isModalMode ? (mode === 'create') : !id;

  const [record, setRecord] = useState<NavigationChannelResponse | null>(null);
  const isRecordApproved = Boolean(
    record && ['APPROVED', 'APPROVED_L2', 'APPROVED_LEVEL2', 'PUBLISHED'].includes(record.approvalStatus as string)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [seaportOptions, setSeaportOptions] = useState<{ id: string; portCode?: string; portName?: string; orgUnitId?: string }[]>([]);
  const [symbols, setSymbols] = useState<any[]>(DEFAULT_CHANNEL_GIS_SYMBOLS);
  const [codeLoading, setCodeLoading] = useState(false);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  const [coordinateList, setCoordinateList] = useState<DmsCoord[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<NavigationChannelAttachment[]>([]);
  const [pendingDeletedAttachmentIds, setPendingDeletedAttachmentIds] = useState<string[]>([]);
  const [activeTabKey, setActiveTabKey] = useState('basic-info');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);

  // ── Route segment states & helpers (chuẩn /vts-operation-center & /anchorage) ───────────────
  const [routeDetails, setRouteDetails] = useState<ChannelRouteDetailRequest[]>([]);
  const [routeOpen, setRouteOpen] = useState(true);
  const [routeDrawerOpen, setRouteDrawerOpen] = useState(false);
  const [editingRouteIndex, setEditingRouteIndex] = useState<number | null>(null);
  const [viewingRoute, setViewingRoute] = useState<ChannelRouteDetailRequest | null>(null);
  const [routeActiveTabKey, setRouteActiveTabKey] = useState<'general' | 'location'>('general');
  const [viewRouteActiveTabKey, setViewRouteActiveTabKey] = useState<'general' | 'location'>('general');
  const [routeCoordinateList, setRouteCoordinateList] = useState<DmsCoord[]>([]);
  const [routeGpsError, setRouteGpsError] = useState<string | null>(null);
  const [routeGisModalOpen, setRouteGisModalOpen] = useState(false);
  const [routeForm] = Form.useForm();

  const watchedRouteGeometryType = Form.useWatch('geometryType', routeForm);
  const hasRouteCoordinates = routeCoordinateList.some(
    (c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null),
  );
  const hasRouteLocation = Boolean(watchedRouteGeometryType || hasRouteCoordinates);

  const routeGisWktValue = useMemo(() => {
    if (!watchedRouteGeometryType) return '';
    const points = routeCoordinateList
      .filter((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null))
      .map((c) => ({
        latitude: dmsToDd(c.latD, c.latM, c.latS),
        longitude: dmsToDd(c.lngD, c.lngM, c.lngS),
      }));
    if (points.length === 0) return '';
    return serializeCoordinatesToWkt(points, watchedRouteGeometryType as 'POINT' | 'LINE' | 'POLYGON');
  }, [routeCoordinateList, watchedRouteGeometryType]);

  const viewRoutePoints = useMemo(() => {
    if (!viewingRoute?.coordinates) return [];
    return parseWktToCoordinates(viewingRoute.coordinates);
  }, [viewingRoute?.coordinates]);

  const addRouteGpsPoint = useCallback(() => {
    setRouteCoordinateList((p) => [...p, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
    setRouteGpsError(null);
  }, []);

  const clearRouteGpsPoint = useCallback((i: number) => {
    setRouteCoordinateList((p) => {
      const next = [...p];
      if (!next[i]) return p;
      next[i] = { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null };
      return next;
    });
    setRouteGpsError(null);
  }, []);

  const removeRouteCoordinate = useCallback((i: number) => {
    setRouteCoordinateList((p) => p.filter((_, idx) => idx !== i));
    setRouteGpsError(null);
  }, []);

  const updateRouteGpsPoint = useCallback((i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setRouteCoordinateList((prev) => {
      const next = [...prev];
      if (next[i]) {
        next[i] = {
          ...next[i],
          [field === 'lat' ? 'latD' : 'lngD']: dVal,
          [field === 'lat' ? 'latM' : 'lngM']: mVal,
          [field === 'lat' ? 'latS' : 'lngS']: sVal,
        };
      }
      return next;
    });
    setRouteGpsError(null);
  }, []);

  const handleRouteGisChange = useCallback((val: { geometryType?: string; coordinates?: string; symbolId?: string }) => {
    if (val?.coordinates) {
      const parsed = parseWktToCoordinates(val.coordinates);
      if (parsed.length > 0) {
        const geom = ((val?.geometryType || watchedRouteGeometryType || 'POINT') as string).toUpperCase();
        const newPoints: DmsCoord[] = parsed.map((p) => {
          const latDms = ddToDms(p.latitude);
          const lngDms = ddToDms(p.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        });
        setRouteCoordinateList(geom === 'POINT' ? [newPoints[0]] : newPoints);
        setRouteGpsError(null);
      }
    }
    if (val?.geometryType && val.geometryType !== watchedRouteGeometryType) {
      routeForm.setFieldValue('geometryType', val.geometryType);
    }
    if (val?.symbolId) {
      routeForm.setFieldValue('mapIconId', val.symbolId);
      routeForm.setFieldValue('symbolId', val.symbolId);
    }
  }, [routeForm, watchedRouteGeometryType]);

  const handleConfirmRouteGisMap = useCallback(() => {
    setRouteGisModalOpen(false);
    toast.success('Đã xác nhận vị trí phân đoạn từ bản đồ');
  }, []);

  const openAddRoute = useCallback(() => {
    setEditingRouteIndex(null);
    setRouteActiveTabKey('general');
    setRouteGpsError(null);
    setRouteCoordinateList([]);
    routeForm.resetFields();
    const currentChannelCode = form.getFieldValue('channelCode') || '';
    const nextSeq = routeDetails.length + 1;
    routeForm.setFieldsValue({
      routeType: 1,
      coordinateReferenceSystem: 'WGS-84',
      displayRule: 'Độ, phút, giây (DMS)',
      ...(currentChannelCode ? { routeCode: `${currentChannelCode}-${String(nextSeq).padStart(2, '0')}` } : {}),
    });
    setRouteDrawerOpen(true);
  }, [form, routeDetails.length, routeForm]);

  const openEditRoute = useCallback((index: number) => {
    const item = routeDetails[index];
    if (!item) return;
    setEditingRouteIndex(index);
    setRouteActiveTabKey('general');
    setRouteGpsError(null);
    routeForm.resetFields();

    if (item.coordinates) {
      const parsed = parseWktToCoordinates(item.coordinates);
      setRouteCoordinateList(
        parsed.map((p) => {
          const latDms = ddToDms(p.latitude);
          const lngDms = ddToDms(p.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        })
      );
    } else {
      setRouteCoordinateList([]);
    }

    routeForm.setFieldsValue({
      routeClassification: item.routeClassification,
      routeCode: item.routeCode,
      routeName: item.routeName,
      routeType: item.routeType,
      routeGrade: item.routeGrade,
      channelLengthKilometers: safeDecimal(item.channelLengthKilometers),
      designDepthMeters: safeDecimal(item.designDepthMeters),
      currentDepthMeters: safeDecimal(item.currentDepthMeters),
      minimumDesignWidthMeters: safeDecimal(item.minimumDesignWidthMeters),
      maximumDesignWidthMeters: safeDecimal(item.maximumDesignWidthMeters),
      designSlope: safeDecimal(item.designSlope),
      minimumCurveRadiusMeters: safeDecimal(item.minimumCurveRadiusMeters),
      verticalClearanceMeters: safeDecimal(item.verticalClearanceMeters),
      turningBasinLocation: item.turningBasinLocation,
      turningBasinRadiusMeters: safeDecimal(item.turningBasinRadiusMeters),
      routeLatestMaintenanceYear: item.routeLatestMaintenanceYear ? dayjs(String(item.routeLatestMaintenanceYear), 'YYYY') : null,
      routeLatestDredgingVolumeCubicMeters: safeDecimal(item.routeLatestDredgingVolumeCubicMeters),
      geometryType: item.geometryType || undefined,
      mapIconId: item.mapIconId || item.symbolId || undefined,
      symbolId: item.mapIconId || item.symbolId || undefined,
      coordinateReferenceSystem: item.coordinateReferenceSystem || 'WGS-84',
      displayRule: item.displayRule || 'Độ, phút, giây (DMS)',
    });
    setRouteDrawerOpen(true);
  }, [routeDetails, routeForm]);

  const closeRouteDrawer = useCallback(() => {
    setRouteDrawerOpen(false);
    setEditingRouteIndex(null);
    setRouteActiveTabKey('general');
    setRouteCoordinateList([]);
    setRouteGpsError(null);
    routeForm.resetFields();
  }, [routeForm]);

  const removeRoute = useCallback((index: number) => {
    setRouteDetails((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const saveRoute = useCallback(async () => {
    try {
      const values = await routeForm.validateFields();

      let wkt: string | undefined = undefined;
      if (values.geometryType || routeCoordinateList.length > 0) {
        const coordResult = validateDmsCoordinates(routeCoordinateList, values.geometryType);
        if (!coordResult.valid) {
          const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
          toast.error(errMsg);
          setRouteGpsError(errMsg);
          setRouteActiveTabKey('location');
          return;
        }
        wkt = serializeCoordinatesToWkt(coordResult.validCoords, values.geometryType || 'POINT');
      }

      const currentChannelCode = form.getFieldValue('channelCode') || '';
      const targetSeq = editingRouteIndex != null ? (routeDetails[editingRouteIndex]?.sequenceNo ?? (editingRouteIndex + 1)) : (routeDetails.length + 1);
      const generatedRouteCode = currentChannelCode ? `${currentChannelCode}-${String(targetSeq).padStart(2, '0')}` : undefined;

      const newRouteItem: ChannelRouteDetailRequest = {
        ...(editingRouteIndex != null ? routeDetails[editingRouteIndex] : {}),
        sequenceNo: targetSeq,
        routeClassification: trimString(values.routeClassification),
        routeCode: values.routeCode?.trim() || generatedRouteCode,
        routeName: trimString(values.routeName) || '',
        routeType: values.routeType,
        routeGrade: values.routeGrade,
        channelLengthKilometers: values.channelLengthKilometers != null && values.channelLengthKilometers !== '' ? Number(values.channelLengthKilometers) : undefined,
        designDepthMeters: values.designDepthMeters != null && values.designDepthMeters !== '' ? Number(values.designDepthMeters) : undefined,
        currentDepthMeters: values.currentDepthMeters != null && values.currentDepthMeters !== '' ? Number(values.currentDepthMeters) : undefined,
        minimumDesignWidthMeters: values.minimumDesignWidthMeters != null && values.minimumDesignWidthMeters !== '' ? Number(values.minimumDesignWidthMeters) : undefined,
        maximumDesignWidthMeters: values.maximumDesignWidthMeters != null && values.maximumDesignWidthMeters !== '' ? Number(values.maximumDesignWidthMeters) : undefined,
        designSlope: values.designSlope != null && values.designSlope !== '' ? Number(values.designSlope) : undefined,
        minimumCurveRadiusMeters: values.minimumCurveRadiusMeters != null && values.minimumCurveRadiusMeters !== '' ? Number(values.minimumCurveRadiusMeters) : undefined,
        verticalClearanceMeters: values.verticalClearanceMeters != null && values.verticalClearanceMeters !== '' ? Number(values.verticalClearanceMeters) : undefined,
        turningBasinLocation: trimString(values.turningBasinLocation),
        turningBasinRadiusMeters: values.turningBasinRadiusMeters != null && values.turningBasinRadiusMeters !== '' ? Number(values.turningBasinRadiusMeters) : undefined,
        routeLatestMaintenanceYear: values.routeLatestMaintenanceYear ? (dayjs.isDayjs(values.routeLatestMaintenanceYear) ? values.routeLatestMaintenanceYear.year() : Number(values.routeLatestMaintenanceYear)) : undefined,
        routeLatestDredgingVolumeCubicMeters: values.routeLatestDredgingVolumeCubicMeters != null && values.routeLatestDredgingVolumeCubicMeters !== '' ? Number(values.routeLatestDredgingVolumeCubicMeters) : undefined,
        geometryType: values.geometryType,
        mapIconId: values.mapIconId,
        symbolId: values.mapIconId,
        coordinateReferenceSystem: values.coordinateReferenceSystem,
        displayRule: values.displayRule,
        coordinates: wkt,
      };

      if (editingRouteIndex != null) {
        setRouteDetails((prev) => {
          const next = [...prev];
          next[editingRouteIndex] = newRouteItem;
          return next;
        });
        toast.success('Đã cập nhật phân đoạn tuyến luồng');
      } else {
        setRouteDetails((prev) => [...prev, newRouteItem]);
        toast.success('Đã thêm phân đoạn tuyến luồng');
      }
      closeRouteDrawer();
    } catch (e: unknown) {
      const errorFields = (e as FormFinishFailedInfo | undefined)?.errorFields ?? [];
      const fieldPath: Array<string | number> = errorFields[0]?.name ?? [];
      if (fieldPath.length > 0) {
        setRouteActiveTabKey(resolveRouteDrawerTabForField(firstErrorFieldName(errorFields)));
        toast.error(firstErrorMessage(errorFields, 'Vui lòng kiểm tra lại thông tin trên form'));
        // Tab đích chỉ được render sau khi state đổi → hoãn scroll sang nhịp render kế tiếp.
        window.setTimeout(() => {
          try {
            routeForm.scrollToField(fieldPath, { focus: true, block: 'center' });
          } catch {
            // Trường không còn trên DOM → bỏ qua; tab đã được chuyển đúng.
          }
        }, 0);
      }
    }
  }, [closeRouteDrawer, editingRouteIndex, form, routeCoordinateList, routeDetails, routeForm]);

  // Đồng bộ loại đối tượng phân đoạn tuyến luồng (chuẩn /vts-operation-center)
  useEffect(() => {
    if (!routeDrawerOpen) return;
    if (!watchedRouteGeometryType) {
      routeForm.setFieldsValue({ coordinateReferenceSystem: undefined, displayRule: undefined, mapIconId: undefined, symbolId: undefined });
      setRouteCoordinateList([]);
      setRouteGpsError(null);
      return;
    }
    if (!routeForm.getFieldValue('coordinateReferenceSystem')) {
      routeForm.setFieldsValue({ coordinateReferenceSystem: 'WGS-84' });
    }
    if (!routeForm.getFieldValue('displayRule')) {
      routeForm.setFieldsValue({ displayRule: 'Độ, phút, giây (DMS)' });
    }
    const count = GEOMETRY_POINT_COUNT[watchedRouteGeometryType] ?? 1;
    setRouteCoordinateList((prev) => {
      if (!prev || prev.length === 0) {
        return Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      }
      if (watchedRouteGeometryType === 'POINT' && prev.length > 1) {
        return [prev[0]];
      }
      if (prev.length < count) {
        const added: DmsCoord[] = Array.from({ length: count - prev.length }, () => ({
          latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null,
        }));
        return [...prev, ...added];
      }
      return prev;
    });
    setRouteGpsError(null);
  }, [watchedRouteGeometryType, routeDrawerOpen, routeForm]);

  const watchedGeometryType = Form.useWatch('geometryType', form);
  const selectedOrgUnitId = Form.useWatch('orgUnitId', form);

  // Chuẩn /vts-operation-center: chỉ bắt buộc 'Biểu tượng' khi đã xác định vị trí
  // (đã chọn Loại đối tượng HOẶC đã nhập tọa độ) — không chặn khi bản ghi chưa có vị trí.
  const hasCoordinates = coordinateList.some(
    (c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null),
  );
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);

  const filteredSeaportOptions = useMemo(() => {
    if (!selectedOrgUnitId) return [];
    const allowedOrgIds = resolveOrgSubtreeIds(organizations, selectedOrgUnitId);
    return seaportOptions.filter((port) => port.orgUnitId && allowedOrgIds.has(String(port.orgUnitId)));
  }, [organizations, seaportOptions, selectedOrgUnitId]);

  // ── Load dropdown data (org tree, seaports, symbols, users) ─────────
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        if (isMounted) setOrganizations(orgs || []);
      } catch (err) {
        console.error('Không tải được cây đơn vị quản lý', err);
        if (isMounted) setOrganizations([]);
      }
      try {
        const ports = await vtsSystemCRUD.getScopedPortOptions();
        if (isMounted) setSeaportOptions(ports || []);
      } catch (err) {
        console.error('Không tải được danh sách cảng biển', err);
        if (isMounted) setSeaportOptions([]);
      }
      try {
        let items: any[] = [];
        try {
          const optRes = await symbolService.getOptions();
          if (Array.isArray(optRes) && optRes.length > 0) {
            items = optRes;
          }
        } catch {
          // ignore error and fallback to list
        }

        if (items.length === 0) {
          const res: any = await symbolService.list({ pageSize: 1000 });
          items = res?.data || (Array.isArray(res) ? res : res?.items || res?.content || []);
        }

        if (isMounted) setSymbols(items.length > 0 ? items : DEFAULT_CHANNEL_GIS_SYMBOLS);
      } catch (err) {
        console.error('Không tải được danh sách biểu tượng', err);
        if (isMounted) setSymbols(DEFAULT_CHANNEL_GIS_SYMBOLS);
      }
      try {
        const resp: any = await userService.list({ pageSize: 1000 });
        const users = resp?.data || resp?.content || [];
        const m = new Map<string, string>();
        users.forEach((u: any) => { m.set(u.id, u.fullName || u.username || u.id); });
        if (isMounted) setUserMap(m);
      } catch (err) {
        console.error('Không tải được danh sách cán bộ', err);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Tự động tải thông tin chi tiết biểu tượng đã lưu nếu chưa có trong danh mục (chuẩn /vts-operation-center)
  useEffect(() => {
    const symId = record?.mapIconId || (record as any)?.symbolId;
    if (symId && !symbols.some((s: any) => String(s.id) === String(symId))) {
      const fallbackName = (record as any)?.symbolName;
      const fallbackCode = (record as any)?.symbolCode;
      const fallbackImage = (record as any)?.symbolImage;

      if (fallbackName) {
        setSymbols((prev) => {
          if (prev.some((item: any) => String(item.id) === String(symId))) return prev;
          return [
            ...prev,
            { id: String(symId), name: fallbackName, code: fallbackCode, image: fallbackImage }
          ];
        });
      } else {
        symbolService.getById(String(symId))
          .then((s) => {
            if (s) {
              setSymbols((prev) => {
                if (prev.some((item: any) => String(item.id) === String(s.id))) return prev;
                return [...prev, s];
              });
            }
          })
          .catch(() => {
            setSymbols((prev) => {
              if (prev.some((item: any) => String(item.id) === String(symId))) return prev;
              return [...prev, { id: String(symId), name: 'Biểu tượng đã chọn', code: '', image: '' }];
            });
          });
      }
    }
  }, [record?.mapIconId, (record as any)?.symbolId, (record as any)?.symbolName, (record as any)?.symbolCode, (record as any)?.symbolImage, symbols]);

  // Đơn vị quản lý mặc định theo tài khoản đang đăng nhập (dùng cho Thêm mới & fallback khi Sửa).
  const defaultFormOrgUnitId = useMemo(
    () => resolveDefaultFormOrgUnitId(currentUser, organizations),
    [currentUser, organizations],
  );
  const defaultFormOrgUnitIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    defaultFormOrgUnitIdRef.current = defaultFormOrgUnitId;
  }, [defaultFormOrgUnitId]);

  // Điền 'Đơn vị quản lý' khi ô đang trống: Thêm mới luôn trống; Sửa chỉ trống
  // khi bản ghi cũ có orgUnitId NULL — cả hai đều fallback về đơn vị người dùng.
  useEffect(() => {
    if (!defaultFormOrgUnitId) return;
    if (!form.getFieldValue('orgUnitId')) {
      form.setFieldsValue({ orgUnitId: defaultFormOrgUnitId });
    }
  }, [defaultFormOrgUnitId, form]);

  // Mặc định đơn vị quản lý khi tạo mới
  useEffect(() => {
    if (isCreateMode && organizations.length > 0) {
      if (!form.getFieldValue('orgUnitId')) {
        const currentOrgUnitId = resolveDefaultFormOrgUnitId(currentUser, organizations)
          || (currentUser?.orgUnitId && currentUser.orgUnitId !== '00000000-0000-0000-0000-000000000017' && currentUser.orgUnitId !== 'G17' ? currentUser.orgUnitId : undefined);
        if (currentOrgUnitId) {
          form.setFieldsValue({ orgUnitId: currentOrgUnitId });
        }
      }
    }
  }, [isCreateMode, form, currentUser, organizations]);

  // Tự sinh mã luồng hàng hải khi người dùng chọn Đơn vị quản lý (chuẩn /berth)
  useEffect(() => {
    if (!isCreateMode) return;
    if (!selectedOrgUnitId) {
      form.setFieldValue('channelCode', undefined);
      return;
    }
    setCodeLoading(true);
    navigationChannelCRUD.generateCode(selectedOrgUnitId)
      .then((code) => {
        if (code) form.setFieldsValue({ channelCode: code });
      })
      .catch((err) => {
        console.error('Lỗi tự sinh mã luồng hàng hải', err);
      })
      .finally(() => setCodeLoading(false));
  }, [selectedOrgUnitId, isCreateMode, form]);

  // ── Load detail for edit ───────────────────────────────────────────
  useEffect(() => {
    if (id) {
      const loadData = async () => {
        try {
          const cached = (window.parent as any)?.kchtDetailCache?.[id] as NavigationChannelResponse | undefined;
          const data = cached || await navigationChannelCRUD.getById(id);
          setRecord(data);
          setRouteDetails(Array.isArray(data.routeDetails) ? data.routeDetails : []);
          let coords: any[] = [];
          const rawCoords = (data as any).coordinates;
          if (Array.isArray(rawCoords)) {
            coords = rawCoords;
          } else if (typeof rawCoords === 'string' && rawCoords.trim()) {
            coords = parseWktToCoordinates(rawCoords);
          } else if (Array.isArray((data as any).coordinateList)) {
            coords = (data as any).coordinateList;
          }
          setCoordinateList(coords.map((c: any) => {
            const latDms = ddToDms(Number(c.latitude));
            const lngDms = ddToDms(Number(c.longitude));
            return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
          }));
          form.setFieldsValue({
            orgUnitId: data.orgUnitId || defaultFormOrgUnitIdRef.current,
            seaportId: data.seaportId,
            operatingUnitId: data.operatingUnitId,
            channelCode: data.channelCode,
            channelName: data.channelName,
            provinceId: data.provinceId != null ? String(data.provinceId) : undefined,
            detailedLocation: data.detailedLocation,
            conditionStatus: data.conditionStatus || 'OPERATIONAL',
            managementStation: data.managementStation,
            stationCount: data.stationCount,
            stationStaffCount: data.stationStaffCount,
            stationAreaSquareMeters: safeDecimal(data.stationAreaSquareMeters),
            latestStationRepairMonth: data.latestStationRepairMonth ? dayjs(data.latestStationRepairMonth) : null,
            latestMaintenanceYear: data.latestMaintenanceYear ? dayjs(String(data.latestMaintenanceYear)) : null,
            latestDredgingVolumeCubicMeters: safeDecimal(data.latestDredgingVolumeCubicMeters),
            buoyCount: data.buoyCount,
            beaconCount: data.beaconCount,
            notes: data.notes,
            announcementDecisionNumber: data.announcementDecisionNumber,
            announcementDecisionDate: data.announcementDecisionDate ? dayjs(data.announcementDecisionDate) : null,
            announcementDecisionIssuer: data.announcementDecisionIssuer,
            protectionScopeMeters: safeDecimal(data.protectionScopeMeters),
            protectionNotes: data.protectionNotes,
            geometryType: data.geometryType,
            mapIconId: data.mapIconId || (data as any).symbolId,
            symbolId: data.mapIconId || (data as any).symbolId,
            coordinateReferenceSystem: data.coordinateReferenceSystem || 'WGS-84',
            displayRule: data.displayRule || 'Độ, phút, giây (DMS)',
          });
          try {
            const files = await navigationChannelCRUD.listAttachments(id);
            const safeFiles = files && files.length > 0 ? files : (data.attachments || []);
            setExistingFiles(safeFiles);
            setPendingDeletedAttachmentIds([]);
            setUploadedFiles(
              safeFiles.map((a: NavigationChannelAttachment, i: number) => ({
                ...a,
                uid: a.id || `att-${i}`,
                name: a.fileName,
                fileName: a.fileName,
                size: a.fileSize,
                fileSize: a.fileSize,
                type: a.contentType || a.fileType,
                fileType: a.contentType || a.fileType,
                status: 'done' as const,
                url: a.fileUrl || a.filePath,
                filePath: a.filePath || a.fileUrl,
                uploadedByName: a.uploadedByName || (a.uploadedBy ? (userMap.get(a.uploadedBy) || a.uploadedBy) : '') || 'Cán bộ quản lý',
                uploadedBy: a.uploadedBy,
                uploadedDate: a.uploadedDate || a.uploadedAt || a.createdAt,
                uploadedAt: a.uploadedAt || a.uploadedDate || a.createdAt,
              }))
            );
          } catch {
            const safeFiles = data.attachments || [];
            setExistingFiles(safeFiles);
            setPendingDeletedAttachmentIds([]);
            setUploadedFiles(
              safeFiles.map((a: NavigationChannelAttachment, i: number) => ({
                ...a,
                uid: a.id || `att-${i}`,
                name: a.fileName,
                fileName: a.fileName,
                size: a.fileSize,
                fileSize: a.fileSize,
                type: a.contentType || a.fileType,
                fileType: a.contentType || a.fileType,
                status: 'done' as const,
                url: a.fileUrl || a.filePath,
                filePath: a.filePath || a.fileUrl,
                uploadedByName: a.uploadedByName || (a.uploadedBy ? (userMap.get(a.uploadedBy) || a.uploadedBy) : '') || 'Cán bộ quản lý',
                uploadedBy: a.uploadedBy,
                uploadedDate: a.uploadedDate || a.uploadedAt || a.createdAt,
                uploadedAt: a.uploadedAt || a.uploadedDate || a.createdAt,
              }))
            );
          }
        } catch (err) {
          console.error('Không thể tải dữ liệu chi tiết', err);
          toast.error('Không thể tải thông tin luồng hàng hải');
        }
      };
      loadData();
    } else {
      form.resetFields();
      form.setFieldsValue({
        orgUnitId: defaultFormOrgUnitIdRef.current,
        conditionStatus: 'OPERATIONAL',
        coordinateReferenceSystem: 'WGS-84',
        displayRule: 'Độ, phút, giây (DMS)',
      });
      setRecord(null);
      setCoordinateList([]);
      setUploadedFiles([]);
      setExistingFiles([]);
      setPendingDeletedAttachmentIds([]);
      setRouteDetails([]);
    }
  }, [id, form, userMap]);

  // ── Đổi loại đối tượng: đồng bộ tọa độ theo chuẩn /vts-operation-center ──
  // Bỏ trống Loại đối tượng → xóa sạch tọa độ và trả 'Hệ quy chiếu'/'Quy tắc hiển thị'/
  // 'Biểu tượng' về rỗng; POINT → giữ đúng 1 dòng; LINE/POLYGON → bù dòng trống đủ số điểm.
  // KHÁC VTS ở đúng một điểm (có chủ đích): Hệ quy chiếu của luồng hàng hải là dữ liệu
  // nghiệp vụ thật (WGS-84 / VN-2000) nên chỉ gán mặc định khi ô đang trống — không ghi đè
  // giá trị đã lưu của bản ghi cũ.
  useEffect(() => {
    if (!watchedGeometryType) {
      form.setFieldsValue({ coordinateReferenceSystem: undefined, displayRule: undefined, mapIconId: undefined, symbolId: undefined });
      setCoordinateList([]);
      setGpsError(null);
      return;
    }
    if (!form.getFieldValue('coordinateReferenceSystem')) {
      form.setFieldsValue({ coordinateReferenceSystem: 'WGS-84' });
    }
    if (!form.getFieldValue('displayRule')) {
      form.setFieldsValue({ displayRule: 'Độ, phút, giây (DMS)' });
    }
    const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
    setCoordinateList((prev) => {
      if (!prev || prev.length === 0) {
        return Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      }
      if (watchedGeometryType === 'POINT' && prev.length > 1) {
        return [prev[0]];
      }
      if (prev.length < count) {
        const added: DmsCoord[] = Array.from({ length: count - prev.length }, () => ({
          latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null,
        }));
        return [...prev, ...added];
      }
      return prev;
    });
    setGpsError(null);
  }, [watchedGeometryType, form]);

  // ── GPS handlers (chuẩn VTS CHK — 6 trường DMS riêng) ──────────────
  const removeCoordinate = useCallback((i: number) => {
    setCoordinateList((p) => p.filter((_, idx) => idx !== i));
    setGpsError(null);
  }, []);

  // Đối tượng điểm không xóa dòng (luôn giữ đúng 1 dòng) — chỉ xóa trắng giá trị tọa độ.
  const clearGpsPoint = useCallback((i: number) => {
    setCoordinateList((p) => {
      const next = [...p];
      if (!next[i]) return p;
      next[i] = { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null };
      return next;
    });
    setGpsError(null);
  }, []);

  const addGpsPoint = useCallback(() => {
    setCoordinateList((p) => [...p, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
    setGpsError(null);
  }, []);

  const updateGpsPoint = useCallback((i: number, field: 'lat' | 'lng', dVal: number | null | undefined, mVal: number | null | undefined, sVal: number | null | undefined) => {
    setCoordinateList((p) => {
      const n = [...p];
      n[i] = {
        ...n[i],
        [field === 'lat' ? 'latD' : 'lngD']: dVal ?? null,
        [field === 'lat' ? 'latM' : 'lngM']: mVal ?? null,
        [field === 'lat' ? 'latS' : 'lngS']: sVal ?? null,
      };
      return n;
    });
    setGpsError(null);
  }, []);

  // DMS → WKT cho GisLocationSelector
  // Chuẩn /vts-operation-center: chỉ nhận dòng có ĐỦ cả vĩ độ lẫn kinh độ (bỏ điều kiện
  // loại trừ giá trị 0 — vĩ độ/kinh độ bằng 0 là tọa độ hợp lệ trên đường xích đạo/kinh tuyến gốc).
  const gisWktValue = useMemo(() => {
    const valid = coordinateList
      .filter((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null))
      .map((c) => ({
        latitude: dmsToDd(c.latD, c.latM, c.latS),
        longitude: dmsToDd(c.lngD, c.lngM, c.lngS),
      }))
      .filter((c) => c.latitude != null && c.longitude != null) as { latitude: number; longitude: number }[];
    return serializeCoordinatesToWkt(valid, (watchedGeometryType as 'POINT' | 'LINE' | 'POLYGON') || 'POINT');
  }, [coordinateList, watchedGeometryType]);

  // Chuẩn /vts-operation-center: tọa độ chọn trên bản đồ được áp NGAY khi bản đồ trả về,
  // không chờ bấm 'Xác nhận'.
  // Đồng thời sửa lỗi cũ của màn luồng hàng hải: code cũ đọc p.lat/p.lng trong khi
  // parseWktToCoordinates trả về p.latitude/p.longitude → mọi dòng tọa độ bị xóa trắng
  // ngay sau khi bấm 'Xác nhận tọa độ'.
  const handleGisChange = useCallback((val: { geometryType?: string; coordinates?: string; symbolId?: string }) => {
    if (val?.coordinates) {
      const points = parseWktToCoordinates(val.coordinates);
      if (points.length > 0) {
        const geom = ((val?.geometryType || watchedGeometryType || 'POINT') as string).toUpperCase();
        const newPoints: DmsCoord[] = points.map((p) => {
          const latDms = ddToDms(p.latitude);
          const lngDms = ddToDms(p.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        });
        // Thay thế toàn bộ danh sách bằng các điểm vừa chọn (không cộng dồn vào điểm cũ).
        setCoordinateList(geom === 'POINT' ? [newPoints[0]] : newPoints);
        setGpsError(null);
      }
    }
    if (val?.geometryType && val.geometryType !== watchedGeometryType) {
      form.setFieldValue('geometryType', val.geometryType);
    }
    if (val?.symbolId) {
      form.setFieldValue('mapIconId', val.symbolId);
      form.setFieldValue('symbolId', val.symbolId);
    }
  }, [form, watchedGeometryType]);

  const handleConfirmGisMap = useCallback(() => {
    setGisModalOpen(false);
    toast.success('Đã xác nhận vị trí từ bản đồ');
  }, []);

  // ── Upload file — chuẩn Đèn biển (/beacon-stations) ───────────────
  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File vượt quá 20MB');
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
      toast.error('Định dạng file không hỗ trợ');
      return false;
    }
    if (uploadedFiles.length >= 10) {
      toast.error('Số lượng tệp đính kèm tối đa là 10 tệp');
      return false;
    }
    const nowIso = dayjs().toISOString();
    const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
    setUploadedFiles((prev) => [
      ...prev,
      {
        uid: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        fileName: file.name,
        size: file.size,
        fileSize: file.size,
        type: file.type,
        fileType: file.type,
        uploadedByName: uploaderName,
        uploadedBy: currentUser?.userId || currentUser?.id || uploaderName,
        uploadedDate: nowIso,
        uploadedAt: nowIso,
        createdAt: nowIso,
        status: 'done',
        originFileObj: file as any,
      },
    ]);
    return false;
  };

  const handleDeleteAttachment = (uid: string) => {
    setUploadedFiles((prev) => prev.filter((x) => x.uid !== uid && (x as { id?: string }).id !== uid));
    if (existingFiles.some((ef) => ef.id === uid)) {
      setPendingDeletedAttachmentIds((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
    }
  };

  const handleDownloadAttachment = async (uid: string, name?: string) => {
    const fileItem = uploadedFiles.find((x) => x.uid === uid || (x as { id?: string }).id === uid);
    const rawFile = fileItem?.originFileObj || (fileItem as unknown as { file?: File })?.file;
    if (rawFile) {
      triggerBlobDownload(rawFile, name || (rawFile as File).name || 'attachment');
      return;
    }

    if (isEditMode && id) {
      try {
        const blob = await navigationChannelCRUD.downloadAttachment(id, uid);
        triggerBlobDownload(blob, name || fileItem?.name || (fileItem as unknown as { fileName?: string })?.fileName || 'attachment');
        return;
      } catch {
        const url = fileItem?.url || (fileItem as unknown as { fileUrl?: string; filePath?: string })?.fileUrl || (fileItem as unknown as { filePath?: string })?.filePath;
        if (url) {
          if (url.startsWith('http://') || url.startsWith('https://')) {
            window.open(url, '_blank');
          } else {
            triggerBlobDownload(url, name || fileItem?.name || (fileItem as unknown as { fileName?: string })?.fileName || 'attachment');
          }
          return;
        }
        toast.error('Không thể tải xuống tệp đính kèm');
        return;
      }
    }

    const url = fileItem?.url || (fileItem as unknown as { fileUrl?: string; filePath?: string })?.fileUrl || (fileItem as unknown as { filePath?: string })?.filePath;
    if (url) {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        window.open(url, '_blank');
      } else {
        triggerBlobDownload(url, name || fileItem?.name || (fileItem as unknown as { fileName?: string })?.fileName || 'attachment');
      }
      return;
    }
    toast.error('Không tìm thấy tệp để tải xuống');
  };

  const attachmentItems: InfrastructureAttachmentItem[] = useMemo(() => {
    return uploadedFiles.map((f) => {
      const extra = f as unknown as {
        fileName?: string;
        contentType?: string;
        fileType?: string;
        fileSize?: number;
        uploadedByName?: string;
        uploadedBy?: string;
        uploadedDate?: string;
        uploadedAt?: string;
        createdAt?: string;
        fileUrl?: string;
        filePath?: string;
      };
      return {
        ...f,
        id: f.uid,
        fileName: f.name || extra.fileName || '',
        fileType: f.type || extra.contentType || extra.fileType || '',
        fileSize: f.size ?? extra.fileSize ?? f.originFileObj?.size ?? 0,
        uploadedByName: extra.uploadedByName || (extra.uploadedBy ? (userMap.get(extra.uploadedBy) || extra.uploadedBy) : '') || currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
        uploadedDate: extra.uploadedDate || extra.uploadedAt || extra.createdAt || dayjs().toISOString(),
        url: f.url || extra.fileUrl || extra.filePath,
        originFileObj: f.originFileObj,
      };
    });
  }, [uploadedFiles, userMap, currentUser]);

  // ── Chặn submit khi chưa chọn Đơn vị quản lý (bắt buộc) ────────────
  const ensureOrgUnitSelected = useCallback((): boolean => {
    if (form.getFieldValue('orgUnitId')) return true;
    form.setFields([{ name: 'orgUnitId', errors: [ORG_UNIT_REQUIRED_MESSAGE] }]);
    setActiveTabKey('basic-info');
    toast.error(ORG_UNIT_REQUIRED_MESSAGE);
    return false;
  }, [form]);

  const triggerSubmit = useCallback((action: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED') => {
    if (!ensureOrgUnitSelected()) return;
    saveActionRef.current = action;
    form.setFieldValue('approvalStatus', action);
    form.submit();
  }, [ensureOrgUnitSelected, form]);

  // ── Submit (trim + map + call API) ─────────────────────────────────
  const handleSubmitForm = async (values: any) => {
    const shouldSubmitAfterSave = submitAfterSaveRef.current;
    submitAfterSaveRef.current = false;
    // Không gọi API khi thiếu Đơn vị quản lý (bắt buộc).
    if (!ensureOrgUnitSelected()) return;
    setIsSubmitting(true);
    try {
      let wkt: string | undefined = undefined;
      let validGpsCoords: { latitude: number; longitude: number }[] = [];
      if (values.geometryType || coordinateList.length > 0) {
        const coordResult = validateDmsCoordinates(coordinateList, values.geometryType);
        if (!coordResult.valid) {
          const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
          toast.error(errMsg);
          setActiveTabKey('location');
          setGpsError(errMsg);
          setIsSubmitting(false);
          return;
        }
        validGpsCoords = coordResult.validCoords;
        wkt = serializeCoordinatesToWkt(coordResult.validCoords, values.geometryType || 'POINT');
      }

      const payload: CreateNavigationChannelRequest = {
        orgUnitId: values.orgUnitId,
        seaportId: values.seaportId || (isEditMode ? null : undefined),
        operatingUnitId: values.operatingUnitId || (isEditMode ? null : undefined),
        channelCode: trimString(values.channelCode),
        channelName: trimString(values.channelName) || '',
        provinceId: values.provinceId != null && values.provinceId !== '' ? Number(values.provinceId) : (isEditMode ? null : undefined),
        detailedLocation: toNullableString(values.detailedLocation, isEditMode),
        conditionStatus: values.conditionStatus as ConditionStatus,
        managementStation: toNullableString(values.managementStation, isEditMode),
        stationCount: toNullableNumber(values.stationCount, isEditMode),
        stationStaffCount: toNullableNumber(values.stationStaffCount, isEditMode),
        stationAreaSquareMeters: toNullableNumber(values.stationAreaSquareMeters, isEditMode),
        latestStationRepairMonth: values.latestStationRepairMonth ? (typeof values.latestStationRepairMonth.format === 'function' ? values.latestStationRepairMonth.format('YYYY-MM-DD') : String(values.latestStationRepairMonth)) : (isEditMode ? null : undefined),
        latestMaintenanceYear: values.latestMaintenanceYear ? (typeof values.latestMaintenanceYear.year === 'function' ? values.latestMaintenanceYear.year() : Number(values.latestMaintenanceYear)) : (isEditMode ? null : undefined),
        latestDredgingVolumeCubicMeters: toNullableNumber(values.latestDredgingVolumeCubicMeters, isEditMode),
        buoyCount: toNullableNumber(values.buoyCount, isEditMode),
        beaconCount: toNullableNumber(values.beaconCount, isEditMode),
        notes: toNullableString(values.notes, isEditMode),
        announcementDecisionNumber: toNullableString(values.announcementDecisionNumber, isEditMode),
        announcementDecisionDate: values.announcementDecisionDate ? (typeof values.announcementDecisionDate.format === 'function' ? values.announcementDecisionDate.format('YYYY-MM-DD') : String(values.announcementDecisionDate)) : (isEditMode ? null : undefined),
        announcementDecisionIssuer: toNullableString(values.announcementDecisionIssuer, isEditMode),
        protectionScopeMeters: toNullableNumber(values.protectionScopeMeters, isEditMode),
        protectionNotes: toNullableString(values.protectionNotes, isEditMode),
        geometryType: values.geometryType || (isEditMode ? null : undefined),
        mapIconId: values.mapIconId || (isEditMode ? null : undefined),
        coordinateReferenceSystem: trimString(values.coordinateReferenceSystem) || 'WGS-84',
        displayRule: trimString(values.displayRule) || 'Độ, phút, giây (DMS)',
        coordinates: wkt || (isEditMode ? null : undefined),
        coordinateList: validGpsCoords.length > 0 ? validGpsCoords.map((c, i) => ({
          sequenceNo: i + 1,
          longitude: c.longitude,
          latitude: c.latitude,
        })) : (isEditMode ? null : undefined),
        attachments: undefined,
        routeDetails: routeDetails.map((r, i) => ({
          ...r,
          sequenceNo: i + 1,
          routeClassification: trimString(r.routeClassification),
          routeCode: trimString(r.routeCode),
          routeName: trimString(r.routeName) || '',
          turningBasinLocation: trimString(r.turningBasinLocation),
        })),
      };

      if (isCreateMode) {
        const created = saveActionRef.current === 'APPROVED'
          ? await navigationChannelCRUD.createAndApprove(payload)
          : await navigationChannelCRUD.create(payload);
        const newId = created?.id;

        const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
        if (newId && newFiles.length > 0) {
          try {
            await navigationChannelCRUD.uploadAttachments(newId, newFiles);
          } catch {
            /* ignore attachment upload error */
          }
        }

        if (newId && saveActionRef.current === 'PENDING_APPROVAL') {
          await navigationChannelApproval.submitApproval(newId);
        }
        toast.success(saveActionRef.current === 'PENDING_APPROVAL' ? 'Tạo mới và gửi phê duyệt thành công' : 'Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.(created);
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/navigation-channel');
        }
      } else if (id && isEditMode) {
        if (isRecordApproved) {
          const isDirty = form.isFieldsTouched() || uploadedFiles.some((f) => !!f.originFileObj) || pendingDeletedAttachmentIds.length > 0;
          if (!isDirty) {
            toast.warning('Bắt buộc chỉnh sửa ít nhất 1 trường thông tin trước khi thực hiện thao tác này');
            return;
          }
        }

        let targetApprovalStatus: string | undefined = undefined;
        if (isRecordApproved) {
          if (saveActionRef.current === 'PENDING_APPROVAL') {
            targetApprovalStatus = 'PENDING_APPROVAL';
          } else if (saveActionRef.current === 'APPROVED') {
            targetApprovalStatus = (kchtPerms.isCucLevel && kchtPerms.hasApproveL2Perm) ? 'APPROVED' : 'APPROVED_LEVEL1';
          }
        } else if (saveActionRef.current === 'APPROVED') {
          targetApprovalStatus = (kchtPerms.isCucLevel && kchtPerms.hasApproveL2Perm) ? 'APPROVED' : 'APPROVED_LEVEL1';
        }

        if (pendingDeletedAttachmentIds.length > 0) {
          for (const attId of pendingDeletedAttachmentIds) {
            try {
              await navigationChannelCRUD.deleteAttachment(id, attId);
            } catch {
              /* ignore individual attachment delete error */
            }
          }
        }

        const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
        if (newFiles.length > 0) {
          try {
            await navigationChannelCRUD.uploadAttachments(id, newFiles);
          } catch {
            /* ignore attachment upload error */
          }
        }

        const updatePayload: UpdateNavigationChannelRequest = {
          ...payload,
          id,
          attachments: undefined,
          ...(targetApprovalStatus ? { approvalStatus: targetApprovalStatus as any } : {}),
        };
        const res = await navigationChannelCRUD.update(id, updatePayload);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        if (isRecordApproved) {
          if (saveActionRef.current === 'PENDING_APPROVAL') {
            toast.success('Lưu và gửi phê duyệt thành công');
          } else if (saveActionRef.current === 'APPROVED') {
            toast.success(targetApprovalStatus === 'APPROVED' ? 'Lưu và phê duyệt thành công' : 'Đã duyệt cấp Cảng vụ, chuyển Chờ Cục duyệt');
          } else {
            toast.success('Cập nhật thành công');
          }
        } else if (saveActionRef.current === 'PENDING_APPROVAL' || shouldSubmitAfterSave) {
          await navigationChannelApproval.submitApproval(res?.id ?? id);
          toast.success('Gửi phê duyệt thành công');
        } else if (saveActionRef.current === 'APPROVED' && canApprove) {
          if (!isRecordApproved) {
            await navigationChannelApproval.directApprove(res?.id ?? id);
          }
          toast.success('Phê duyệt thành công');
        } else {
          toast.success('Cập nhật thành công');
        }
        if (isModalMode) {
          onSuccess?.(res || { ...payload, id });
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/navigation-channel');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Form footer — chuẩn Bến cảng & Đèn biển ─────────────────────────
  // ── Lưu thất bại: nhảy sang tab chứa trường bắt buộc còn trống + cuộn tới ô lỗi (chuẩn /beacon-station) ──
  const handleSubmitFailed = useCallback((errorInfo: FormFinishFailedInfo) => {
    const errorFields = errorInfo?.errorFields ?? [];
    const fieldPath: Array<string | number> = errorFields[0]?.name ?? [];
    if (fieldPath.length === 0) return;
    setActiveTabKey(resolveMainFormTabForField(firstErrorFieldName(errorFields)));
    toast.error(firstErrorMessage(errorFields));
    // Tab đích chỉ được render sau khi state đổi → hoãn scroll sang nhịp render kế tiếp.
    window.setTimeout(() => {
      try {
        form.scrollToField(fieldPath, { focus: true, block: 'center' });
      } catch {
        // Trường không còn trên DOM (tab chưa render) → bỏ qua; tab đã được chuyển đúng.
      }
    }, 0);
  }, [form]);

  const formFooter = (
    <KchtFormFooter
      mode={isEditMode ? 'edit' : 'create'}
      resource="navigationchannel"
      record={record ? { approvalStatus: record.approvalStatus } : undefined}
      loading={isSubmitting}
      activeAction={
        saveActionRef.current === 'DRAFT'
          ? 'draft'
          : saveActionRef.current === 'PENDING_APPROVAL'
            ? 'submit'
            : saveActionRef.current === 'APPROVED'
              ? 'approve'
              : null
      }
      onCancel={() => {
        if (isModalMode) {
          onSuccess?.(null);
        } else {
          navigate('/navigation-channel');
        }
      }}
      onSubmit={(action) => {
        if (action === 'draft') triggerSubmit('DRAFT');
        else if (action === 'submit') triggerSubmit('PENDING_APPROVAL');
        else if (action === 'approve') triggerSubmit('APPROVED');
      }}
    />
  );

  const formContent = (
    <>
      <Form form={form} layout="vertical" onFinish={handleSubmitForm} onFinishFailed={handleSubmitFailed}>
        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          tabBarStyle={drawerTabBarStyle}
          items={[
            {
              key: 'basic-info',
              label: 'Thông tin chung',
              // Tab luôn render: rule của trường nằm trên tab chưa mở vẫn được validate, và scroll tới được sau khi chuyển tab (chuẩn /anchorage, /transfer-area).
              forceRender: true,
              children: (
                <div style={drawerFormScrollStyle}>
                  {/* ── Section Card 1: Thông tin cơ bản & Quản lý vận hành (exact match /beacon-stations) ── */}
                  <div style={sectionBoxStyle}>
                    <div style={sectionHeaderStyle}>
                      <div style={sectionTitleStyle}>
                        <BankOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin cơ bản & Quản lý vận hành</span>
                      </div>
                    </div>
                    <Row gutter={[24, 0]}>
                      {/* Row 1: Đơn vị quản lý | Thuộc cảng biển */}
                      <Col span={12}>
                        <Form.Item
                          name="orgUnitId"
                          {...labelProps('Đơn vị quản lý')}
                          required
                          style={{ marginBottom: spaceFormField }}
                          rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}
                        >
                          <FormOrgUnitTreeSelect
                            organizations={organizations}
                            placeholder="Chọn đơn vị quản lý..."
                            showPath
                            treeDefaultExpandAll={false}
                            disabled={isEditMode}
                            style={selectStyle}
                            onChange={(orgUnitId) => {
                              const seaportId = form.getFieldValue('seaportId');
                              const allowedOrgIds = orgUnitId ? resolveOrgSubtreeIds(organizations, orgUnitId) : new Set<string>();
                              const isValidSeaport = seaportOptions.some((port) =>
                                port.id === seaportId && !!port.orgUnitId && allowedOrgIds.has(String(port.orgUnitId)),
                              );
                              if (seaportId && !isValidSeaport) form.setFieldValue('seaportId', undefined);
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="seaportId"
                          {...labelProps('Thuộc cảng biển')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            placeholder={!selectedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : 'Chọn cảng biển'}
                            disabled={!selectedOrgUnitId}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            options={filteredSeaportOptions.map((p) => ({
                              value: p.id,
                              label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id),
                            }))}
                            style={selectStyle}
                          />
                        </Form.Item>
                      </Col>

                      {/* Row 2: Mã luồng hàng hải | Tên luồng hàng hải */}
                      <Col span={12}>
                        <Form.Item
                          name="channelCode"
                          {...labelProps('Mã luồng hàng hải')}
                          style={{ marginBottom: spaceFormField }}
                          tooltip="Mã luồng hàng hải được sinh tự động theo định dạng LHH-000001"
                        >
                          <Input
                            disabled
                            placeholder={codeLoading ? 'Đang sinh mã...' : selectedOrgUnitId ? 'Mã tự động (LHH-000001)' : 'Chọn Đơn vị quản lý để sinh mã'}
                            style={readonlyInputStyle}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="channelName"
                          {...labelProps('Tên luồng hàng hải')}
                          required
                          style={{ marginBottom: spaceFormField }}
                          rules={[{ required: true, message: 'Tên luồng hàng hải là bắt buộc' }, { max: 255, message: 'Tối đa 255 ký tự' }]}
                        >
                          <Input placeholder="Nhập tên luồng hàng hải" maxLength={255} showCount style={inputStyle} />
                        </Form.Item>
                      </Col>

                      {/* Row 3: Đơn vị vận hành | Tình trạng */}
                      <Col span={12}>
                        <Form.Item name="operatingUnitId" {...labelProps('Đơn vị vận hành')} style={{ marginBottom: spaceFormField }}>
                          <Select
                            placeholder="Chọn đơn vị vận hành"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            options={organizations.map((org) => ({
                              value: org.id,
                              label: org.code ? `${org.code} - ${org.name}` : org.name,
                            }))}
                            style={selectStyle}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="conditionStatus"
                          {...labelProps('Tình trạng')}
                          required
                          style={{ marginBottom: spaceFormField }}
                          rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}
                          initialValue="NOT_YET_OPERATIONAL"
                        >
                          <Select placeholder="Chọn tình trạng" options={CONDITION_STATUS_OPTIONS} style={selectStyle} />
                        </Form.Item>
                      </Col>

                      {/* Row 4: Địa điểm (Tỉnh/TP) | Địa điểm chi tiết */}
                      <Col span={12}>
                        <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/TP)')} style={{ marginBottom: spaceFormField }}>
                          <Select
                            placeholder="Chọn tỉnh/thành phố..."
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                            options={VIETNAM_PROVINCE_OPTIONS}
                            style={selectStyle}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                          <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  {/* ── Section Card 2: Thông số kỹ thuật & Khai thác ── */}
                  <div style={sectionBoxStyle}>
                    <div style={sectionHeaderStyle}>
                      <div style={sectionTitleStyle}>
                        <SlidersOutlined style={{ color: actionPrimary }} />
                        <span>Thông số kỹ thuật & Khai thác</span>
                      </div>
                    </div>
                    <Row gutter={[24, 0]}>
                      <Col span={12}>
                        <Form.Item
                          name="protectionScopeMeters"
                          {...labelProps('Phạm vi bảo vệ luồng (m)')}
                          style={{ marginBottom: spaceFormField }}
                          getValueFromEvent={getValueFromEvent20}
                          rules={[decimalNumberRule]}
                        >
                          <NumberInputWithCount allowDecimal min={0} step={0.01} placeholder="Nhập phạm vi bảo vệ" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="latestDredgingVolumeCubicMeters"
                          {...labelProps('Khối lượng nạo vét (m³)')}
                          style={{ marginBottom: spaceFormField }}
                          getValueFromEvent={getValueFromEvent20}
                          rules={[decimalNumberRule]}
                        >
                          <NumberInputWithCount allowDecimal min={0} step={0.01} placeholder="Nhập khối lượng nạo vét" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="latestStationRepairMonth" {...labelProps('Sửa chữa trạm gần nhất')} style={{ marginBottom: spaceFormField }}>
                          <DatePicker picker="month" format="MM/YYYY" placeholder="Chọn tháng/năm" style={selectStyle} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="latestMaintenanceYear" {...labelProps('Năm bảo trì gần nhất')} style={{ marginBottom: spaceFormField }}>
                          <DatePicker picker="year" format="YYYY" placeholder="Chọn năm" style={selectStyle} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item name="protectionNotes" {...labelProps('Ghi chú phạm vi bảo vệ')} style={{ marginBottom: spaceFormField }}>
                          <Input.TextArea rows={2} maxLength={500} showCount placeholder="Nhập ghi chú phạm vi bảo vệ" style={{ ...textAreaStyle, fontSize: 13.5 }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  {/* ── Section Card 3: Thông tin trạm quản lý luồng & phao tiêu ── */}
                  <div style={sectionBoxStyle}>
                    <div style={sectionHeaderStyle}>
                      <div style={sectionTitleStyle}>
                        <BankOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin trạm quản lý luồng & phao tiêu</span>
                      </div>
                    </div>
                    <Row gutter={[24, 0]}>
                      <Col span={12}>
                        <Form.Item name="managementStation" {...labelProps('Trạm quản lý luồng')} style={{ marginBottom: spaceFormField }}>
                          <Input placeholder="Nhập trạm quản lý luồng" maxLength={255} showCount style={inputStyle} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="stationCount"
                          {...labelProps('Số lượng trạm')}
                          style={{ marginBottom: spaceFormField }}
                          getValueFromEvent={getValueFromEvent5}
                          rules={[integer5NonNegativeRule]}
                        >
                          <NumberInputWithCount min={0} step={1} precision={0} placeholder="Nhập số lượng trạm" style={numberInputStyle} maxLength={5} parser={parseNumber5} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="stationStaffCount"
                          {...labelProps('Số lượng nhân sự tại trạm')}
                          style={{ marginBottom: spaceFormField }}
                          getValueFromEvent={getValueFromEvent5}
                          rules={[integer5NonNegativeRule]}
                        >
                          <NumberInputWithCount min={0} step={1} precision={0} placeholder="Nhập số lượng nhân sự" style={numberInputStyle} maxLength={5} parser={parseNumber5} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="stationAreaSquareMeters"
                          {...labelProps('Diện tích trạm (m²)')}
                          style={{ marginBottom: spaceFormField }}
                          getValueFromEvent={getValueFromEvent20}
                          rules={[decimalNumberRule]}
                        >
                          <NumberInputWithCount allowDecimal min={0} step={0.01} placeholder="Nhập diện tích trạm" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="buoyCount"
                          {...labelProps('Số lượng phao')}
                          style={{ marginBottom: spaceFormField }}
                          getValueFromEvent={getValueFromEvent5}
                          rules={[integer5NonNegativeRule]}
                        >
                          <NumberInputWithCount min={0} step={1} precision={0} placeholder="Nhập số lượng phao" style={numberInputStyle} maxLength={5} parser={parseNumber5} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="beaconCount"
                          {...labelProps('Số lượng tiêu')}
                          style={{ marginBottom: spaceFormField }}
                          getValueFromEvent={getValueFromEvent5}
                          rules={[integer5NonNegativeRule]}
                        >
                          <NumberInputWithCount min={0} step={1} precision={0} placeholder="Nhập số lượng tiêu" style={numberInputStyle} maxLength={5} parser={parseNumber5} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item name="notes" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                          <Input.TextArea rows={3} maxLength={500} showCount placeholder="Nhập ghi chú" style={{ ...textAreaStyle, fontSize: 13.5 }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  {/* ── Section Card 4: Thông tin công bố mở, đưa vào sử dụng ── */}
                  <div style={sectionBoxStyle}>
                    <div style={sectionHeaderStyle}>
                      <div style={sectionTitleStyle}>
                        <FileTextOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin công bố mở, đưa vào sử dụng</span>
                      </div>
                    </div>
                    <Row gutter={[24, 0]}>
                      <Col span={12}>
                        <Form.Item name="announcementDecisionNumber" {...labelProps('Quyết định công bố số')} style={{ marginBottom: spaceFormField }}>
                          <Input maxLength={100} showCount placeholder="Nhập số quyết định công bố" style={inputStyle} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="announcementDecisionDate" {...labelProps('Ngày ra quyết định công bố')} style={{ marginBottom: spaceFormField }}>
                          <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={selectStyle} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item name="announcementDecisionIssuer" {...labelProps('Đơn vị ra quyết định công bố')} style={{ marginBottom: spaceFormField }}>
                          <Input.TextArea rows={2} maxLength={500} showCount placeholder="Nhập đơn vị ra quyết định" style={{ ...textAreaStyle, fontSize: 13.5 }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  {/* ── Section Card 5: Thông tin phân đoạn tuyến luồng (chuẩn /anchorage) ── */}
                  <div style={sectionBoxStyle}>
                    <div
                      onClick={() => setRouteOpen(!routeOpen)}
                      style={{
                        ...sectionHeaderStyle,
                        cursor: 'pointer',
                        userSelect: 'none',
                        marginBottom: routeOpen ? 12 : 0,
                        paddingBottom: routeOpen ? 8 : 0,
                        borderBottom: routeOpen ? sectionHeaderStyle.borderBottom : 'none',
                      }}
                    >
                      <div style={sectionTitleStyle}>
                        <SlidersOutlined style={{ color: actionPrimary }} />
                        <span>Thông tin phân đoạn tuyến luồng ({routeDetails.length})</span>
                      </div>
                      <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>
                        {routeOpen ? <DownOutlined /> : <RightOutlined />}
                      </span>
                    </div>

                    {routeOpen && (
                      <div>
                        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
                            Danh sách phân đoạn tuyến luồng ({routeDetails.length})
                          </span>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={openAddRoute}
                            style={{ ...primaryButtonStyle, height: 32, fontSize: fontSizeMd, padding: '0 14px' }}
                          >
                            Thêm phân đoạn tuyến luồng
                          </Button>
                        </div>

                        {routeDetails.length === 0 ? (
                          <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                            <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block' }}>Chưa có phân đoạn tuyến luồng nào.</span>
                          </div>
                        ) : (
                          <DetailTable
                            size="small"
                            scrollY={140}
                            pageSize={5}
                            pageSizeOptions={[5, 10, 20]}
                            dataSource={routeDetails.map((r, i) => ({ ...r, key: i }))}
                            rowKey={(r: ChannelRouteDetailRequest & { key: number }) => String(r.key)}
                            emptyText="Chưa có dữ liệu"
                            columns={[
                              {
                                title: 'STT',
                                width: 50,
                                align: 'center' as const,
                                render: (_: unknown, __: unknown, idx: number) => idx + 1,
                              },
                              {
                                title: 'Phân loại tuyến',
                                dataIndex: 'routeClassification',
                                width: 130,
                                render: (v?: string) => v || '—',
                              },
                              {
                                title: 'Mã tuyến',
                                dataIndex: 'routeCode',
                                width: 130,
                                render: (v?: string) => <span style={{ fontWeight: 500 }}>{v || '—'}</span>,
                              },
                              {
                                title: 'Tên tuyến luồng',
                                dataIndex: 'routeName',
                                width: 220,
                                render: (v?: string, record?: ChannelRouteDetailRequest & { key: number }) => (
                                  <a
                                    style={{ color: actionPrimary, fontWeight: fontWeightBold, cursor: 'pointer' }}
                                    onClick={() => record && openEditRoute(record.key)}
                                  >
                                    {v || `Phân đoạn ${record ? record.key + 1 : ''}`}
                                  </a>
                                ),
                              },
                              {
                                title: 'Loại tuyến',
                                dataIndex: 'routeType',
                                width: 120,
                                render: (v?: number) => (v != null ? ROUTE_TYPE_MAP[v] || v : '—'),
                              },
                              {
                                title: 'Cấp luồng',
                                dataIndex: 'routeGrade',
                                width: 90,
                                align: 'center' as const,
                                render: (v?: number) => (v != null ? `Cấp ${v}` : '—'),
                              },
                              {
                                title: 'Chiều dài (km)',
                                dataIndex: 'channelLengthKilometers',
                                width: 110,
                                align: 'right' as const,
                                render: (v?: number) => formatNumber(v) || '—',
                              },
                              {
                                title: 'Độ sâu thiết kế (m)',
                                dataIndex: 'designDepthMeters',
                                width: 130,
                                align: 'right' as const,
                                render: (v?: number) => formatNumber(v) || '—',
                              },
                              {
                                title: 'Độ sâu hiện trạng (m)',
                                dataIndex: 'currentDepthMeters',
                                width: 130,
                                align: 'right' as const,
                                render: (v?: number) => formatNumber(v) || '—',
                              },
                              {
                                title: 'Bề rộng thiết kế (m)',
                                width: 140,
                                align: 'right' as const,
                                render: (_: unknown, rec: ChannelRouteDetailRequest) =>
                                  rec.maximumDesignWidthMeters != null && rec.minimumDesignWidthMeters != null
                                    ? `${rec.minimumDesignWidthMeters}–${rec.maximumDesignWidthMeters}`
                                    : (formatNumber(rec.maximumDesignWidthMeters ?? rec.minimumDesignWidthMeters) || '—'),
                              },
                              {
                                title: 'Bán kính cong nhỏ nhất (m)',
                                dataIndex: 'minimumCurveRadiusMeters',
                                width: 160,
                                align: 'right' as const,
                                render: (v?: number) => formatNumber(v) || '—',
                              },
                              {
                                title: 'Vị trí vũng quay tàu',
                                dataIndex: 'turningBasinLocation',
                                width: 160,
                                render: (v?: string) => v || '—',
                              },
                              {
                                title: 'Bán kính vũng quay (m)',
                                dataIndex: 'turningBasinRadiusMeters',
                                width: 140,
                                align: 'right' as const,
                                render: (v?: number) => formatNumber(v) || '—',
                              },
                              {
                                title: (
                                  <span
                                    style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center' }}
                                    title="Thao tác"
                                  >
                                    <UnorderedListOutlined />
                                  </span>
                                ),
                                key: 'actions',
                                width: 80,
                                fixed: 'right' as const,
                                align: 'center' as const,
                                onHeaderCell: () => ({
                                  style: {
                                    background: '#f8fafc',
                                    zIndex: 11,
                                    textAlign: 'center',
                                  },
                                }),
                                onCell: () => ({
                                  style: {
                                    background: '#ffffff',
                                    zIndex: 10,
                                    textAlign: 'center',
                                  },
                                }),
                                render: (_: unknown, record: ChannelRouteDetailRequest & { key: number }) => {
                                  const actionItems: MenuProps['items'] = [
                                    {
                                      key: 'view',
                                      label: 'Xem chi tiết',
                                      icon: <EyeOutlined style={{ color: actionPrimary }} />,
                                      onClick: () => {
                                        setViewingRoute(record);
                                        setViewRouteActiveTabKey('general');
                                      },
                                    },
                                    {
                                      key: 'edit',
                                      label: 'Chỉnh sửa',
                                      icon: <EditOutlined style={{ color: actionPrimary }} />,
                                      onClick: () => openEditRoute(record.key),
                                    },
                                    {
                                      key: 'delete',
                                      label: 'Xóa',
                                      danger: true,
                                      icon: <DeleteOutlined />,
                                      onClick: () => removeRoute(record.key),
                                    },
                                  ];

                                  return (
                                    <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                      <Dropdown menu={{ items: actionItems }} trigger={['click']} rootClassName={THEME_SCOPE_CLASS}>
                                        <Button
                                          icon={<MoreOutlined />}
                                          style={{
                                            ...rowActionButtonStyle,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: 0,
                                          }}
                                        />
                                      </Dropdown>
                                    </div>
                                  );
                                },
                              },
                            ]}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'location',
              label: `Thông tin vị trí (${coordinateList.length})`,
              forceRender: true,
              children: (
                <div style={drawerFormScrollStyle}>
                  {/* ── Section Card: Thông số đối tượng bản đồ ── */}
                  <div style={sectionBoxStyle}>
                    <div style={sectionHeaderStyle}>
                      <div style={sectionTitleStyle}>
                        <EnvironmentOutlined style={{ color: actionPrimary }} />
                        <span>Thông số đối tượng bản đồ</span>
                      </div>
                    </div>
                    <Row gutter={[24, 0]}>
                      <Col span={12}>
                        <Form.Item
                          name="geometryType"
                          {...labelProps('Loại đối tượng')}
                          required={hasCoordinates}
                          rules={hasCoordinates ? [{ required: true, message: 'Loại đối tượng là bắt buộc khi có tọa độ' }] : []}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select placeholder="Chọn loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="mapIconId"
                          {...labelProps('Biểu tượng')}
                          required={hasLocation}
                          rules={hasLocation ? [{ required: true, message: 'Vui lòng chọn biểu tượng bản đồ' }] : []}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            placeholder="Chọn biểu tượng bản đồ"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            disabled={!watchedGeometryType}
                            filterOption={(input, option) =>
                              normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                            }
                            style={selectStyle}
                            options={symbols.map((sym: any) => ({
                              value: String(sym.id),
                              label: sym.code ? `${sym.name} (${sym.code})` : sym.name,
                              image: sym.image,
                            }))}
                            optionRender={(option) => (
                              <Space>
                                {option.data.image && (
                                  <img
                                    src={option.data.image.startsWith('data:') ? option.data.image : `data:image/png;base64,${option.data.image}`}
                                    alt=""
                                    style={{ width: 20, height: 20, objectFit: 'contain' }}
                                  />
                                )}
                                <span>{option.data.label}</span>
                              </Space>
                            )}
                            labelRender={(props) => {
                              const sym = symbols.find((s: any) => String(s.id) === String(props.value));
                              return (
                                <Space style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  {sym?.image && (
                                    <img
                                      src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                                      alt=""
                                      style={{ width: 18, height: 18, objectFit: 'contain' }}
                                    />
                                  )}
                                  <span>{props.label}</span>
                                </Space>
                              );
                            }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={[24, 0]}>
                      <Col span={12}>
                        <Form.Item name="coordinateReferenceSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                          <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                          <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  {/* ── Section Card: Tọa độ GPS ── */}
                  <div style={sectionBoxStyle}>
                    <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                      <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                        Tọa độ GPS ({coordinateList.length})
                      </span>
                      <Space size={8}>
                        <Button
                          icon={<EnvironmentOutlined style={{ color: !watchedGeometryType ? 'rgba(0, 0, 0, 0.25)' : actionPrimary }} />}
                          onClick={() => setGisModalOpen(true)}
                          disabled={!watchedGeometryType}
                          style={!watchedGeometryType ? {
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
                            boxShadow: 'none',
                          } : {
                            ...outlineButtonStyle,
                            height: 32,
                            fontSize: fontSizeSm,
                            padding: '0 14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title={!watchedGeometryType ? 'Vui lòng chọn loại đối tượng trước khi chọn tọa độ trên bản đồ' : undefined}
                        >
                          Chọn tọa độ trên bản đồ
                        </Button>
                        <Button
                          type="primary"
                          icon={<PlusOutlined style={{ color: (!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)) ? 'rgba(0, 0, 0, 0.25)' : undefined }} />}
                          onClick={addGpsPoint}
                          disabled={!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)}
                          style={(!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)) ? {
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
                            boxShadow: 'none',
                          } : {
                            ...primaryButtonStyle,
                            height: 32,
                            fontSize: fontSizeSm,
                            padding: '0 14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title={!watchedGeometryType ? 'Vui lòng chọn loại đối tượng trước khi thêm tọa độ' : (watchedGeometryType === 'POINT' && coordinateList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined)}
                        >
                          Thêm tọa độ
                        </Button>
                      </Space>
                    </div>
                    {gpsError && (
                      <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {gpsError}</span>
                      </div>
                    )}
                    <DetailTable
                      size="small"
                      scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
                      dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
                      rowKey={(r: any, idx?: number) => r._idx ?? String(idx)}
                      emptyText="Chưa có tọa độ GPS nào"
                      columns={[
                        {
                          title: 'STT',
                          width: 60,
                          align: 'center' as const,
                          onCell: () => ({ style: { verticalAlign: 'middle' } }),
                          render: (_v: any, _r: any, idx: number) => idx + 1,
                        },
                        {
                          title: 'Vĩ độ (Latitude - N)',
                          key: 'lat',
                          align: 'center' as const,
                          onCell: () => ({ style: { verticalAlign: 'middle' } }),
                          render: (_v: any, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
                        },
                        {
                          title: 'Kinh độ (Longitude - E)',
                          key: 'lng',
                          align: 'center' as const,
                          onCell: () => ({ style: { verticalAlign: 'middle' } }),
                          render: (_v: any, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
                        },
                        {
                          title: '',
                          width: 50,
                          align: 'center' as const,
                          onCell: () => ({ style: { verticalAlign: 'middle' } }),
                          render: (_v: any, record: any) => {
                            const isPoint = watchedGeometryType === 'POINT';
                            const minPoints = isPoint ? 1 : watchedGeometryType === 'LINE' ? 2 : 3;
                            const canDelete = coordinateList.length > minPoints;

                            if (isPoint) {
                              const hasValue =
                                record.latD != null ||
                                record.latM != null ||
                                record.latS != null ||
                                record.lngD != null ||
                                record.lngM != null ||
                                record.lngS != null;
                              return (
                                <Button
                                  type="text"
                                  disabled={!hasValue}
                                  icon={<DeleteOutlined style={{ fontSize: 16, color: hasValue ? statusCritical : undefined }} />}
                                  onClick={() => clearGpsPoint(record._idx)}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title={hasValue ? 'Xóa trắng giá trị tọa độ' : 'Chưa có dữ liệu'}
                                />
                              );
                            }

                            return (
                              <Button
                                type="text"
                                danger={canDelete}
                                disabled={!canDelete}
                                icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                                onClick={() => canDelete && removeCoordinate(record._idx)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  padding: 0,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title={
                                  !canDelete
                                    ? watchedGeometryType === 'LINE'
                                      ? 'Đối tượng đường phải có tối thiểu 2 tọa độ'
                                      : 'Đối tượng vùng phải có tối thiểu 3 tọa độ'
                                    : 'Xóa tọa độ'
                                }
                              />
                            );
                          },
                        },
                      ]}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: 'files',
              label: `File đính kèm (${uploadedFiles.length})`,
              forceRender: true,
              children: (
                <div style={{ paddingTop: 6 }}>
                  <InfrastructureAttachmentTab
                    attachments={attachmentItems}
                    readonly={false}
                    userMap={userMap}
                    onUpload={(file) => { handleBeforeUpload(file); return false; }}
                    onDelete={handleDeleteAttachment}
                    onDownload={handleDownloadAttachment}
                    loadReadonlyPreviewImage={
                      isEditMode && id
                        ? (attachmentId) => navigationChannelCRUD.downloadAttachment(id, attachmentId)
                        : undefined
                    }
                    loadPreviewAttachment={
                      isEditMode && id
                        ? (attachmentId) => navigationChannelCRUD.downloadAttachment(id, attachmentId)
                        : undefined
                    }
                  />
                </div>
              ),
            },
          ]}
        />
        {!isModalMode && formFooter}
      </Form>

      {/* GIS Location Selector Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: fontSizeLg, fontWeight: fontWeightBold, color: sidebarBg }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span>Chọn vị trí & tọa độ trên bản đồ chuyên dụng</span>
          </div>
        }
        open={gisModalOpen}
        onCancel={() => setGisModalOpen(false)}
        destroyOnClose
        width="94vw"
        style={{ maxWidth: 1400, top: 20 }}
        footer={[
          <Button
            key="cancel"
            onClick={() => setGisModalOpen(false)}
            style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}
          >
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmGisMap}
            style={{ ...primaryButtonStyle, height: 36, borderRadius: radiusPill }}
          >
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline
            defaultGeometryType={(watchedGeometryType as 'POINT' | 'LINE' | 'POLYGON') || 'POINT'}
            height={520}
            value={{
              geometryType: (watchedGeometryType as 'POINT' | 'LINE' | 'POLYGON') || 'POINT',
              coordinates: gisWktValue,
              symbolId: form.getFieldValue('mapIconId') || form.getFieldValue('symbolId'),
            }}
            onChange={handleGisChange}
          />
        </div>
      </Modal>

      {/* Modal Chọn vị trí GIS trên bản đồ cho phân đoạn tuyến luồng */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: sidebarBg, fontSize: fontSizeLg }}>
              {viewingRoute ? 'Xem vị trí phân đoạn trên bản đồ chuyên dụng' : 'Chọn vị trí & tọa độ trên bản đồ chuyên dụng'}
            </span>
          </div>
        }
        open={routeGisModalOpen}
        onCancel={() => setRouteGisModalOpen(false)}
        destroyOnClose
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={
          viewingRoute ? (
            <Button onClick={() => setRouteGisModalOpen(false)} style={{ ...primaryButtonStyle, height: 36, borderRadius: radiusPill }}>
              Đóng
            </Button>
          ) : [
            <Button
              key="cancel"
              onClick={() => setRouteGisModalOpen(false)}
              style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}
            >
              Hủy
            </Button>,
            <Button
              key="ok"
              type="primary"
              onClick={handleConfirmRouteGisMap}
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
            disabled={Boolean(viewingRoute)}
            defaultGeometryType={((viewingRoute?.geometryType || watchedRouteGeometryType) as 'POINT' | 'LINE' | 'POLYGON') || 'POINT'}
            height={520}
            value={{
              geometryType: ((viewingRoute?.geometryType || watchedRouteGeometryType) as 'POINT' | 'LINE' | 'POLYGON') || 'POINT',
              coordinates: viewingRoute ? (viewingRoute.coordinates || '') : routeGisWktValue,
              symbolId: viewingRoute ? (viewingRoute.mapIconId || viewingRoute.symbolId) : (routeForm.getFieldValue('mapIconId') || routeForm.getFieldValue('symbolId')),
            }}
            onChange={viewingRoute ? undefined : handleRouteGisChange}
          />
        </div>
      </Modal>

      {/* ── Drawer con: Thêm mới / Chỉnh sửa phân đoạn tuyến luồng (kích cỡ width 1080 đồng bộ với drawer luồng hàng hải) ── */}
      <AppDrawer
        width={1080}
        rootClassName="channel-drawer-scope"
        className="channel-drawer-scope"
        title={
          <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
            {editingRouteIndex == null ? 'Thêm mới thông tin phân đoạn tuyến luồng' : 'Chỉnh sửa thông tin phân đoạn tuyến luồng'}
          </span>
        }
        open={routeDrawerOpen}
        onClose={closeRouteDrawer}
        destroyOnHidden
        destroyOnClose
        push={false}
        footer={
          <>
            <Button onClick={closeRouteDrawer} style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}>
              Hủy
            </Button>
            <Button type="primary" onClick={saveRoute} style={{ ...primaryButtonStyle, height: 36 }}>
              Lưu
            </Button>
          </>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px', overflow: 'hidden' },
        }}
      >
        <Form form={routeForm} layout="vertical">
          <Tabs
            activeKey={routeActiveTabKey}
            onChange={(key) => setRouteActiveTabKey(key as 'general' | 'location')}
            tabBarStyle={drawerTabBarStyle}
            items={[
              {
                key: 'general',
                label: 'Thông tin chung',
                children: (
                  <div style={drawerFormScrollStyle}>
                    <div style={sectionBoxStyle}>
                      <div style={{ ...sectionHeaderStyle, borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 12 }}>
                        <div style={sectionTitleStyle}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span>Thông số kỹ thuật phân đoạn</span>
                        </div>
                      </div>

                      <Row gutter={[24, 0]}>
                        {/* Row 1: Tên tuyến luồng | Phân loại tuyến */}
                        <Col span={12}>
                          <Form.Item
                            name="routeName"
                            {...labelProps('Tên tuyến luồng')}
                            required
                            rules={[{ required: true, message: 'Tên tuyến luồng là bắt buộc' }, { max: 255, message: 'Tối đa 255 ký tự' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Nhập tên tuyến luồng" maxLength={255} showCount style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="routeClassification" {...labelProps('Phân loại tuyến')} style={{ marginBottom: spaceFormField }}>
                            <Input placeholder="Nhập phân loại tuyến" maxLength={50} showCount style={inputStyle} />
                          </Form.Item>
                        </Col>

                        {/* Row 2: Mã tuyến | Loại tuyến */}
                        <Col span={12}>
                          <Form.Item
                            name="routeCode"
                            {...labelProps('Mã tuyến')}
                            style={{ marginBottom: spaceFormField }}
                            tooltip="Mã tuyến được tự động đồng bộ theo [Mã luồng]-[Số thứ tự] hoặc có thể tự nhập"
                          >
                            <Input placeholder="Mã tuyến tự động hoặc tự nhập" maxLength={50} style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="routeType" {...labelProps('Loại tuyến')} style={{ marginBottom: spaceFormField }}>
                            <Select placeholder="Chọn loại tuyến" options={ROUTE_TYPE_OPTIONS} style={selectStyle} />
                          </Form.Item>
                        </Col>

                        {/* Row 3: Cấp luồng | Chiều dài (km) */}
                        <Col span={12}>
                          <Form.Item
                            name="routeGrade"
                            {...labelProps('Cấp luồng')}
                            style={{ marginBottom: spaceFormField }}
                            getValueFromEvent={getValueFromEvent5}
                            rules={[integer5NonNegativeRule]}
                          >
                            <NumberInputWithCount min={0} step={1} precision={0} placeholder="Nhập cấp luồng" style={numberInputStyle} maxLength={5} parser={parseNumber5} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="channelLengthKilometers"
                            {...labelProps('Chiều dài (km)')}
                            style={{ marginBottom: spaceFormField }}
                            getValueFromEvent={getValueFromEvent20}
                            rules={[decimalNumberRule]}
                          >
                            <NumberInputWithCount allowDecimal min={0} step={0.01} placeholder="Nhập chiều dài tuyến" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>

                        {/* Row 4: Độ sâu thiết kế (m) | Độ sâu hiện trạng (m) */}
                        <Col span={12}>
                          <Form.Item
                            name="designDepthMeters"
                            {...labelProps('Độ sâu thiết kế (m)')}
                            style={{ marginBottom: spaceFormField }}
                            getValueFromEvent={getValueFromEvent20}
                            rules={[decimalNumberRule]}
                          >
                            <NumberInputWithCount allowDecimal step={0.01} placeholder="Nhập độ sâu thiết kế" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="currentDepthMeters"
                            {...labelProps('Độ sâu hiện trạng (m)')}
                            style={{ marginBottom: spaceFormField }}
                            getValueFromEvent={getValueFromEvent20}
                            rules={[decimalNumberRule]}
                          >
                            <NumberInputWithCount allowDecimal step={0.01} placeholder="Nhập độ sâu hiện trạng" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>

                        {/* Row 5: Bề rộng thiết kế nhỏ nhất (m) | Bề rộng thiết kế lớn nhất (m) */}
                        <Col span={12}>
                          <Form.Item
                            name="minimumDesignWidthMeters"
                            {...labelProps('Bề rộng thiết kế nhỏ nhất (m)')}
                            style={{ marginBottom: spaceFormField }}
                            getValueFromEvent={getValueFromEvent20}
                            rules={[decimalNumberRule]}
                          >
                            <NumberInputWithCount allowDecimal min={0} step={0.01} placeholder="Nhập bề rộng nhỏ nhất" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="maximumDesignWidthMeters"
                            {...labelProps('Bề rộng thiết kế lớn nhất (m)')}
                            style={{ marginBottom: spaceFormField }}
                            getValueFromEvent={getValueFromEvent20}
                            rules={[decimalNumberRule]}
                          >
                            <NumberInputWithCount allowDecimal min={0} step={0.01} placeholder="Nhập bề rộng lớn nhất" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>

                        {/* Row 6: Mái dốc thiết kế | Bán kính cong nhỏ nhất (m) */}
                        <Col span={12}>
                          <Form.Item
                            name="designSlope"
                            {...labelProps('Mái dốc thiết kế')}
                            style={{ marginBottom: spaceFormField }}
                            getValueFromEvent={getValueFromEvent20}
                            rules={[decimalNumberRule]}
                          >
                            <NumberInputWithCount allowDecimal min={0} step={0.01} placeholder="Nhập mái dốc thiết kế" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="minimumCurveRadiusMeters"
                            {...labelProps('Bán kính cong nhỏ nhất (m)')}
                            style={{ marginBottom: spaceFormField }}
                            getValueFromEvent={getValueFromEvent20}
                            rules={[decimalNumberRule]}
                          >
                            <NumberInputWithCount allowDecimal min={0} step={0.01} placeholder="Nhập bán kính cong nhỏ nhất" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>

                        {/* Row 7: Chiều cao tĩnh không (m) | Vị trí vũng quay tàu */}
                        <Col span={12}>
                          <Form.Item
                            name="verticalClearanceMeters"
                            {...labelProps('Chiều cao tĩnh không (m)')}
                            style={{ marginBottom: spaceFormField }}
                            getValueFromEvent={getValueFromEvent20}
                            rules={[decimalNumberRule]}
                          >
                            <NumberInputWithCount allowDecimal min={0} step={0.01} placeholder="Nhập chiều cao tĩnh không" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="turningBasinLocation" {...labelProps('Vị trí vũng quay tàu')} style={{ marginBottom: spaceFormField }}>
                            <Input placeholder="Nhập vị trí vũng quay tàu" maxLength={255} showCount style={inputStyle} />
                          </Form.Item>
                        </Col>

                        {/* Row 8: Bán kính vũng quay (m) | Năm bảo trì gần nhất */}
                        <Col span={12}>
                          <Form.Item
                            name="turningBasinRadiusMeters"
                            {...labelProps('Bán kính vũng quay (m)')}
                            style={{ marginBottom: spaceFormField }}
                            getValueFromEvent={getValueFromEvent20}
                            rules={[decimalNumberRule]}
                          >
                            <NumberInputWithCount allowDecimal min={0} step={0.01} placeholder="Nhập bán kính vũng quay" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="routeLatestMaintenanceYear" {...labelProps('Năm bảo trì gần nhất')} style={{ marginBottom: spaceFormField }}>
                            <DatePicker picker="year" format="YYYY" placeholder="Chọn năm" style={selectStyle} />
                          </Form.Item>
                        </Col>

                        {/* Row 9: Khối lượng nạo vét gần nhất (m³) */}
                        <Col span={12}>
                          <Form.Item
                            name="routeLatestDredgingVolumeCubicMeters"
                            {...labelProps('Khối lượng nạo vét gần nhất (m³)')}
                            style={{ marginBottom: spaceFormField }}
                            getValueFromEvent={getValueFromEvent20}
                            rules={[decimalNumberRule]}
                          >
                            <NumberInputWithCount allowDecimal min={0} step={0.01} placeholder="Nhập khối lượng nạo vét" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </div>
                ),
              },
              {
                key: 'location',
                label: `Thông tin vị trí (${routeCoordinateList.length})`,
                children: (
                  <div style={drawerFormScrollStyle}>
                    {/* ── Section Card: Thông số đối tượng bản đồ ── */}
                    <div style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <EnvironmentOutlined style={{ color: actionPrimary }} />
                          <span>Thông số đối tượng bản đồ</span>
                        </div>
                      </div>
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item
                            name="geometryType"
                            {...labelProps('Loại đối tượng')}
                            required={hasRouteCoordinates}
                            rules={hasRouteCoordinates ? [{ required: true, message: 'Loại đối tượng là bắt buộc khi có tọa độ' }] : []}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select placeholder="Chọn loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="mapIconId"
                            {...labelProps('Biểu tượng')}
                            required={hasRouteLocation}
                            rules={hasRouteLocation ? [{ required: true, message: 'Vui lòng chọn biểu tượng bản đồ' }] : []}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn biểu tượng bản đồ"
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              disabled={!watchedRouteGeometryType}
                              filterOption={(input, option) =>
                                normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                              }
                              style={selectStyle}
                              options={symbols.map((sym: any) => ({
                                value: String(sym.id),
                                label: sym.code ? `${sym.name} (${sym.code})` : sym.name,
                                image: sym.image,
                              }))}
                              optionRender={(option) => (
                                <Space>
                                  {option.data.image && (
                                    <img
                                      src={option.data.image.startsWith('data:') ? option.data.image : `data:image/png;base64,${option.data.image}`}
                                      alt=""
                                      style={{ width: 20, height: 20, objectFit: 'contain' }}
                                    />
                                  )}
                                  <span>{option.data.label}</span>
                                </Space>
                              )}
                              labelRender={(props) => {
                                const sym = symbols.find((s: any) => String(s.id) === String(props.value));
                                return (
                                  <Space style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    {sym?.image && (
                                      <img
                                        src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                                        alt=""
                                        style={{ width: 18, height: 18, objectFit: 'contain' }}
                                      />
                                    )}
                                    <span>{props.label}</span>
                                  </Space>
                                );
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item name="coordinateReferenceSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                            <Select placeholder="Chọn hệ quy chiếu" disabled options={COORD_SYS_OPTIONS} style={selectStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                            <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    {/* ── Section Card: Tọa độ GPS ── */}
                    <div style={sectionBoxStyle}>
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                        <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                          Tọa độ GPS ({routeCoordinateList.length})
                        </span>
                        <Space size={8}>
                          <Button
                            icon={<EnvironmentOutlined style={{ color: !watchedRouteGeometryType ? 'rgba(0, 0, 0, 0.25)' : actionPrimary }} />}
                            onClick={() => setRouteGisModalOpen(true)}
                            disabled={!watchedRouteGeometryType}
                            style={!watchedRouteGeometryType ? {
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
                              boxShadow: 'none',
                            } : {
                              ...outlineButtonStyle,
                              height: 32,
                              fontSize: fontSizeSm,
                              padding: '0 14px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title={!watchedRouteGeometryType ? 'Vui lòng chọn loại đối tượng trước khi chọn tọa độ trên bản đồ' : undefined}
                          >
                            Chọn tọa độ trên bản đồ
                          </Button>
                          <Button
                            type="primary"
                            icon={<PlusOutlined style={{ color: (!watchedRouteGeometryType || (watchedRouteGeometryType === 'POINT' && routeCoordinateList.length >= 1)) ? 'rgba(0, 0, 0, 0.25)' : undefined }} />}
                            onClick={addRouteGpsPoint}
                            disabled={!watchedRouteGeometryType || (watchedRouteGeometryType === 'POINT' && routeCoordinateList.length >= 1)}
                            style={(!watchedRouteGeometryType || (watchedRouteGeometryType === 'POINT' && routeCoordinateList.length >= 1)) ? {
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
                              boxShadow: 'none',
                            } : {
                              ...primaryButtonStyle,
                              height: 32,
                              fontSize: fontSizeSm,
                              padding: '0 14px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title={!watchedRouteGeometryType ? 'Vui lòng chọn loại đối tượng trước khi thêm tọa độ' : (watchedRouteGeometryType === 'POINT' && routeCoordinateList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined)}
                          >
                            Thêm tọa độ
                          </Button>
                        </Space>
                      </div>

                      {routeGpsError && (
                        <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {routeGpsError}</span>
                        </div>
                      )}
                      <DetailTable
                        size="small"
                        scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
                        dataSource={routeCoordinateList.map((c, i) => ({ ...c, _idx: i }))}
                        rowKey={(r: any, idx?: number) => r._idx ?? String(idx)}
                        emptyText="Chưa có tọa độ GPS nào"
                        columns={[
                          {
                            title: 'STT',
                            width: 60,
                            align: 'center' as const,
                            onCell: () => ({ style: { verticalAlign: 'middle' } }),
                            render: (_v: any, _r: any, idx: number) => idx + 1,
                          },
                          {
                            title: 'Vĩ độ (Latitude - N)',
                            key: 'lat',
                            align: 'center' as const,
                            onCell: () => ({ style: { verticalAlign: 'middle' } }),
                            render: (_v: any, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateRouteGpsPoint(record._idx, 'lat', d, m, s)),
                          },
                          {
                            title: 'Kinh độ (Longitude - E)',
                            key: 'lng',
                            align: 'center' as const,
                            onCell: () => ({ style: { verticalAlign: 'middle' } }),
                            render: (_v: any, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateRouteGpsPoint(record._idx, 'lng', d, m, s)),
                          },
                          {
                            title: '',
                            width: 50,
                            align: 'center' as const,
                            onCell: () => ({ style: { verticalAlign: 'middle' } }),
                            render: (_v: any, record: any) => {
                              const isPoint = watchedRouteGeometryType === 'POINT';
                              const minPoints = isPoint ? 1 : watchedRouteGeometryType === 'LINE' ? 2 : 3;
                              const canDelete = routeCoordinateList.length > minPoints;

                              if (isPoint) {
                                const hasValue =
                                  record.latD != null ||
                                  record.latM != null ||
                                  record.latS != null ||
                                  record.lngD != null ||
                                  record.lngM != null ||
                                  record.lngS != null;
                                return (
                                  <Button
                                    type="text"
                                    disabled={!hasValue}
                                    icon={<DeleteOutlined style={{ fontSize: 16, color: hasValue ? statusCritical : undefined }} />}
                                    onClick={() => clearRouteGpsPoint(record._idx)}
                                    style={{
                                      width: 32,
                                      height: 32,
                                      padding: 0,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title={hasValue ? 'Xóa trắng giá trị tọa độ' : 'Chưa có dữ liệu'}
                                  />
                                );
                              }

                              return (
                                <Button
                                  type="text"
                                  danger={canDelete}
                                  disabled={!canDelete}
                                  icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                                  onClick={() => canDelete && removeRouteCoordinate(record._idx)}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title={
                                    !canDelete
                                      ? watchedRouteGeometryType === 'LINE'
                                        ? 'Đối tượng đường phải có tối thiểu 2 tọa độ'
                                        : 'Đối tượng vùng phải có tối thiểu 3 tọa độ'
                                      : 'Xóa tọa độ'
                                  }
                                />
                              );
                            },
                          },
                        ]}
                      />
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </AppDrawer>

      {/* ── Drawer con: Xem chi tiết phân đoạn tuyến luồng (kích cỡ width 1080 đồng bộ với drawer luồng hàng hải) ── */}
      <AppDrawer
        width={1080}
        rootClassName="channel-drawer-scope"
        className="channel-drawer-scope"
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chi tiết thông tin phân đoạn tuyến luồng</span>}
        open={!!viewingRoute}
        onClose={() => {
          setViewingRoute(null);
          setViewRouteActiveTabKey('general');
        }}
        destroyOnHidden
        destroyOnClose
        push={false}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px', overflow: 'hidden' },
        }}
      >
        {viewingRoute && (
          <Tabs
            activeKey={viewRouteActiveTabKey}
            onChange={(key) => setViewRouteActiveTabKey(key as 'general' | 'location')}
            tabBarStyle={drawerTabBarStyle}
            items={[
              {
                key: 'general',
                label: 'Thông tin chung',
                children: (
                  <div style={drawerFormScrollStyle}>
                    <div style={{ ...sectionBoxStyle, padding: '14px 18px' }}>
                      <div style={{ ...sectionHeaderStyle, borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 12 }}>
                        <div style={sectionTitleStyle}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span>Thông tin phân đoạn tuyến luồng</span>
                        </div>
                      </div>
                      {renderDetailRowsTwoCol([
                        { label: 'Phân loại tuyến', value: viewingRoute.routeClassification || '—' },
                        { label: 'Mã tuyến', value: viewingRoute.routeCode || '—' },
                        { label: 'Tên tuyến luồng', value: viewingRoute.routeName || '—' },
                        { label: 'Loại tuyến', value: viewingRoute.routeType != null ? (ROUTE_TYPE_MAP[viewingRoute.routeType] || viewingRoute.routeType) : '—' },
                        { label: 'Cấp luồng', value: viewingRoute.routeGrade != null ? `Cấp ${viewingRoute.routeGrade}` : '—' },
                        { label: 'Chiều dài (km)', value: formatNumber(viewingRoute.channelLengthKilometers) || '—' },
                        { label: 'Độ sâu thiết kế (m)', value: formatNumber(viewingRoute.designDepthMeters) || '—' },
                        { label: 'Độ sâu hiện trạng (m)', value: formatNumber(viewingRoute.currentDepthMeters) || '—' },
                        {
                          label: 'Bề rộng thiết kế (m)',
                          value: viewingRoute.maximumDesignWidthMeters != null && viewingRoute.minimumDesignWidthMeters != null
                            ? `${viewingRoute.minimumDesignWidthMeters}–${viewingRoute.maximumDesignWidthMeters}`
                            : (formatNumber(viewingRoute.maximumDesignWidthMeters ?? viewingRoute.minimumDesignWidthMeters) || '—'),
                        },
                        { label: 'Mái dốc thiết kế', value: formatNumber(viewingRoute.designSlope) || '—' },
                        { label: 'Bán kính cong nhỏ nhất (m)', value: formatNumber(viewingRoute.minimumCurveRadiusMeters) || '—' },
                        { label: 'Chiều cao tĩnh không (m)', value: formatNumber(viewingRoute.verticalClearanceMeters) || '—' },
                        { label: 'Vị trí vũng quay tàu', value: viewingRoute.turningBasinLocation || '—' },
                        { label: 'Bán kính vũng quay (m)', value: formatNumber(viewingRoute.turningBasinRadiusMeters) || '—' },
                        { label: 'Năm bảo trì gần nhất', value: viewingRoute.routeLatestMaintenanceYear || '—' },
                        { label: 'Khối lượng nạo vét gần nhất (m³)', value: formatNumber(viewingRoute.routeLatestDredgingVolumeCubicMeters) || '—' },
                      ])}
                    </div>
                  </div>
                ),
              },
              {
                key: 'location',
                label: `Thông tin vị trí (${viewRoutePoints.length})`,
                children: (
                  <div style={drawerFormScrollStyle}>
                    <div style={{ ...sectionBoxStyle, padding: '14px 18px' }}>
                      <div style={{ ...sectionHeaderStyle, borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 12 }}>
                        <div style={sectionTitleStyle}>
                          <EnvironmentOutlined style={{ color: actionPrimary }} />
                          <span>Thông số đối tượng bản đồ</span>
                        </div>
                      </div>
                      {renderDetailRowsTwoCol([
                        {
                          label: 'Loại đối tượng',
                          value: GEOMETRY_TYPE_OPTIONS.find((o) => o.value === viewingRoute.geometryType)?.label || viewingRoute.geometryType || '—',
                        },
                        {
                          label: 'Biểu tượng',
                          value: (() => {
                            const symId = viewingRoute.mapIconId || viewingRoute.symbolId;
                            const sym = symbols.find((s: any) => String(s.id) === String(symId));
                            if (!sym) return '—';
                            return (
                              <Space style={{ display: 'inline-flex', alignItems: 'center' }}>
                                {sym.image && (
                                  <img
                                    src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                                    alt=""
                                    style={{ width: 18, height: 18, objectFit: 'contain' }}
                                  />
                                )}
                                <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                              </Space>
                            );
                          })(),
                        },
                        { label: 'Hệ quy chiếu', value: viewingRoute.coordinateReferenceSystem || 'WGS-84' },
                        { label: 'Quy tắc hiển thị', value: viewingRoute.displayRule || 'Độ, phút, giây (DMS)' },
                      ])}
                    </div>

                    <div style={{ ...sectionBoxStyle, padding: '14px 18px' }}>
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                        <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                          Tọa độ GPS ({viewRoutePoints.length})
                        </span>
                        {viewRoutePoints.length > 0 && (
                          <Button
                            icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                            onClick={() => setRouteGisModalOpen(true)}
                            style={{
                              ...outlineButtonStyle,
                              height: 32,
                              fontSize: fontSizeSm,
                              padding: '0 14px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            Xem vị trí trên bản đồ
                          </Button>
                        )}
                      </div>
                      <DetailTable
                        size="small"
                        scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
                        dataSource={viewRoutePoints.map((p, idx) => ({ ...p, _idx: idx }))}
                        rowKey={(r: any, idx?: number) => r._idx ?? String(idx)}
                        emptyText="Chưa có tọa độ GPS nào"
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
                            align: 'center' as const,
                            render: (_v: any, record: any) => {
                              const dms = ddToDms(record.latitude);
                              return `${dms.d}° ${dms.m}' ${dms.s}" N (${record.latitude.toFixed(6)}°)`;
                            },
                          },
                          {
                            title: 'Kinh độ (Longitude - E)',
                            key: 'lng',
                            align: 'center' as const,
                            render: (_v: any, record: any) => {
                              const dms = ddToDms(record.longitude);
                              return `${dms.d}° ${dms.m}' ${dms.s}" E (${record.longitude.toFixed(6)}°)`;
                            },
                          },
                        ]}
                      />
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </AppDrawer>
    </>
  );

  if (isModalMode) {
    return (
      <AppDrawer
        width={1080}
        rootClassName="channel-drawer-scope"
        className="channel-drawer-scope"
        title={
          <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
            {isCreateMode
              ? 'Thêm mới thông tin luồng hàng hải'
              : `Chỉnh sửa — ${record?.channelName || record?.channelCode || ''}`}
          </span>
        }
        open={open ?? false}
        destroyOnHidden
        destroyOnClose
        onClose={() => onCancel?.()}
        footer={formFooter}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px', overflow: 'hidden' },
        }}
      >
        <style>{requiredMarkStyle}</style>
        {formContent}
      </AppDrawer>
    );
  }

  return (
    <div style={{ padding: '16px 24px' }}>
      {formContent}
    </div>
  );
}
