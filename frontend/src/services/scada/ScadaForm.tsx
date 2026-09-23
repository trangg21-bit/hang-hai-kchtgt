import { useEffect, useState, forwardRef, useImperativeHandle, useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import {
  Row, Col, Form, Input, Select, Tabs,
  Button, Space, DatePicker, Modal,
} from 'antd';
import InputNumber from '../../components/shared/LocalizedInputNumber';
import type { FormInstance, UploadFile } from 'antd';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import NumberInputWithCount from '../../components/shared/NumberInputWithCount';
import { parseNumber5, getValueFromEvent5, integer5Rule } from '../../utils/numberRuleHelper';
import {
  PlusOutlined, DeleteOutlined, EnvironmentOutlined,
  BankOutlined, SlidersOutlined, FileTextOutlined,
} from '@ant-design/icons';
import {
  colors, DRAWER_TABLE_SCROLL_Y,
  textTertiary, borderDefault, actionPrimary, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField,
  surfaceCard, readonlyInputStyle,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
  textAreaStyle,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import api from '../api';
import toast from '../../components/ToastNotification';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../operatingOrganizationsData';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService, type Organization } from '../organizationService';
import { userService } from '../userService';
import { FormOrgUnitTreeSelect, resolveDefaultOrgUnitId, resolveOrgSubtreeIds, normalizeSearchText } from '../../components/org-unit';
import { symbolService } from '../symbolService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type { Symbol as MapSymbolType } from '../symbolService';
import {
  GEOMETRY_POINT_COUNT, parseWktToCoordinates, validateDmsCoordinates, serializeCoordinatesToWkt,
  ddToDms, dmsToDd,
  type DmsCoordinateItem,
} from '../../utils/gisGeometry';
import {
  fetchScadaById, createScada, updateScada, generateScadaCode, submitScada,
  fetchScadaAttachments, uploadScadaAttachment, deleteScadaAttachment, downloadScadaAttachment,
} from './api';
import type { ScadaResponse, CreateScadaRequest, UpdateScadaRequest } from './types';

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

// Style cho thẻ phân nhóm (Section Card) đồng bộ chuẩn /berth
const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

// Khung 2: Thông số kỹ thuật & Vận hành — giảm 4px chiều cao (padding dọc 20px so với 24px gốc)
const specSectionBoxStyle: React.CSSProperties = {
  ...sectionBoxStyle,
  padding: '12px 18px 8px 18px',
};

// Khung 3: Bảo trì & Ghi chú — tăng 8px chiều cao (padding dọc 32px so với 24px gốc)
const maintenanceSectionBoxStyle: React.CSSProperties = {
  ...sectionBoxStyle,
  padding: '18px 18px 14px 18px',
  marginBottom: 0,
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

interface GisSelectionValue {
  geometryType?: string;
  symbolId?: string;
  coordinates?: string;
}

const normalizeGeometryType = (value: unknown): 'POINT' | 'LINE' | 'POLYGON' =>
  value === 'LINE' || value === 'POLYGON' ? value : 'POINT';

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 0, label: 'Chưa khai thác/vận hành' },
  { value: 1, label: 'Đang khai thác/vận hành' },
  { value: 2, label: 'Dừng khai thác/vận hành' },
];

const ATTACHED_INFRA_TYPE_OPTIONS = [
  { value: 1, label: 'Trung Tâm Điều Hành VTS' },
  { value: 2, label: 'Trạm radar' },
];

const UNIT_OF_MEASURE_OPTIONS = [
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
];



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
  userSelect: 'none',
  boxSizing: 'border-box',
};

const dmsUnitEndStyle: React.CSSProperties = {
  ...dmsUnitStyle,
  borderRight: `1px solid ${borderDefault}`,
  borderRadius: '0 999px 999px 0',
  paddingRight: 6,
};

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

  const inputRow = (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ display: 'inline-flex', alignItems: 'center', flex: inp.basis, minWidth: 0, width: inp.width }}>
          <InputNumber
            value={inp.value ?? null}
            min={0}
            max={inp.max}
            step={inp.step}
            precision={inp.key === 's' ? 2 : 0}
            formatter={inp.formatter}
            placeholder={inp.base}
            onChange={(v) => inp.onEdit(v == null ? null : Number(v))}
            style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32 }}
            controls={false}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

  const hasMsg = inputs.some((inp) => !!inp.msg);

  const messageRow = hasMsg ? (
    <div aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', width: '100%', minWidth: 0, marginTop: spaceXs, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width }}>
          {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', minWidth: 0 }}>
      {inputRow}
      {messageRow}
    </div>
  );
};

interface RawAttachmentItem {
  id: string;
  fileName: string;
  fileSize?: number;
  filePath?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export type ScadaSaveAction = 'DRAFT' | 'SUBMIT' | 'APPROVED';

export interface ScadaFormRef {
  submit: (saveAction: ScadaSaveAction) => Promise<void>;
}

export interface ScadaFormProps {
  id?: string | null;
  isEdit?: boolean;
  initialData?: ScadaResponse | null;
  form: FormInstance;
  onSuccess?: () => void;
  onFinish?: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

const ScadaForm = forwardRef<ScadaFormRef, ScadaFormProps>(({
  id,
  isEdit: isEditProp,
  initialData,
  form,
  onSuccess,
  onFinish,
  onSubmittingChange,
}, ref) => {
  const isEdit = isEditProp !== undefined ? isEditProp : Boolean(id);
  const [activeTab, setActiveTab] = useState('info');
  const [deviceCodeLoading, setDeviceCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('*') ?? false;

  // Options
  const [orgUnits, setOrgUnits] = useState<Organization[]>([]);
  const [symbols, setSymbols] = useState<MapSymbolType[]>([]);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [vtsOperationCenters, setVtsOperationCenters] = useState<Array<{ id: string; name?: string; code?: string; orgUnitId?: string }>>([]);
  const [radarStations, setRadarStations] = useState<Array<{ id: string; stationName?: string; code?: string; orgUnitId?: string }>>([]);

  const vtsOperationCenterOptions = useMemo(() =>
    vtsOperationCenters.map(v => ({ label: v.name || v.code || v.id, value: v.id, orgUnitId: v.orgUnitId })),
    [vtsOperationCenters]
  );
  const radarStationOptions = useMemo(() =>
    radarStations.map(r => ({ label: r.stationName || r.code || r.id, value: r.id, orgUnitId: r.orgUnitId })),
    [radarStations]
  );

  // Loading
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [loadingOperatingOrgs, setLoadingOperatingOrgs] = useState(false);
  const [loadingVtsCenters, setLoadingVtsCenters] = useState(false);
  const [loadingRadars, setLoadingRadars] = useState(false);

  // GIS state
  const [coordinateList, setCoordinateList] = useState<DmsCoordinateItem[]>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalVisible, setGisModalVisible] = useState(false);
  const gisCoordSnapshotRef = useRef<{ coords: DmsCoordinateItem[]; symbolId?: string; geometryType?: string }>({ coords: [], symbolId: undefined });
  const latestGisMapValueRef = useRef<GisSelectionValue | null>(null);

  // Attachments state
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<RawAttachmentItem[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const map = new Map<string, string>();
        (resp.items || []).forEach((u: { id?: string; fullName?: string; username?: string }) => {
          if (u.id) map.set(u.id, u.fullName || u.username || '');
        });
        setUserMap(map);
      } catch { /* ignore */ }
    })();
  }, []);

  // Form watchers
  const watchedGeometryType = Form.useWatch('geometryType', form);
  const watchedAttachedType = Form.useWatch('attachedInfrastructureType', form);
  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const selectedOrgUnitId = watchedOrgUnitId ?? form.getFieldValue('orgUnitId');

  // Danh sách ID đơn vị hợp lệ (đơn vị đang chọn và tất cả đơn vị con)
  const allowedOrgIds = useMemo(() => {
    if (!selectedOrgUnitId) return new Set<string>();
    const rawSet = resolveOrgSubtreeIds(orgUnits, String(selectedOrgUnitId));
    const normalizedSet = new Set<string>();
    rawSet.forEach((oId) => normalizedSet.add(String(oId).toLowerCase()));
    return normalizedSet;
  }, [orgUnits, selectedOrgUnitId]);

  // Dropdown Trạm radar lọc theo đơn vị quản lý đã chọn
  const filteredRadarStationOptions = useMemo(() => {
    if (!selectedOrgUnitId || allowedOrgIds.size === 0) return [];
    return radarStationOptions.filter((r) => {
      return r.orgUnitId && allowedOrgIds.has(String(r.orgUnitId).toLowerCase());
    });
  }, [allowedOrgIds, radarStationOptions, selectedOrgUnitId]);

  // Dropdown Trung tâm điều hành VTS lọc theo đơn vị quản lý đã chọn
  const filteredVtsOperationCenterOptions = useMemo(() => {
    if (!selectedOrgUnitId || allowedOrgIds.size === 0) return [];
    return vtsOperationCenterOptions.filter((c) => {
      return c.orgUnitId && allowedOrgIds.has(String(c.orgUnitId).toLowerCase());
    });
  }, [allowedOrgIds, selectedOrgUnitId, vtsOperationCenterOptions]);

  /** true khi field đã đạt đủ max ký tự — bật viền đỏ ô nhập + message bên dưới */
  const useMaxReached = (name: string, max: number): boolean => {
    const raw = Form.useWatch(name, form) ?? '';
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };

  const atMax = {
    deviceName: useMaxReached('deviceName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    model: useMaxReached('model', 255),
    manufacturer: useMaxReached('manufacturer', 50),
    specifications: useMaxReached('specifications', 2000),
    maintenanceInformation: useMaxReached('maintenanceInformation', 2000),
    note: useMaxReached('note', 2000),
  };


  // ── GIS: chọn tọa độ trên bản đồ (chuẩn CHK — GisLocationSelector) ──
  const applyMapSelection = (val: GisSelectionValue | null | undefined) => {
    if (!val) return;
    latestGisMapValueRef.current = val;
    const geom = ((val.geometryType || watchedGeometryType || 'POINT') as string).toUpperCase();
    if (val.geometryType && val.geometryType !== watchedGeometryType) {
      form.setFieldValue('geometryType', val.geometryType);
    }
    if (val.symbolId) {
      form.setFieldValue('mapSymbolId', val.symbolId);
    }
    if (val.coordinates) {
      const points = parseWktToCoordinates(val.coordinates);
      if (points.length > 0) {
        const toDms = (p: { latitude: number; longitude: number }) => {
          const lat = ddToDms(p.latitude);
          const lng = ddToDms(p.longitude);
          return { latD: lat.d, latM: lat.m, latS: lat.s, lngD: lng.d, lngM: lng.m, lngS: lng.s };
        };
        const newPoints = points.map(toDms);
        if (geom === 'POINT') {
          setCoordinateList([newPoints[0]]);
        } else {
          setCoordinateList(newPoints);
        }
        setGpsError(null);
      }
    } else if (val.coordinates === '') {
      setCoordinateList([]);
    }
  };

  const handleCancelGisMap = () => {
    setCoordinateList(gisCoordSnapshotRef.current.coords);
    form.setFieldValue('mapSymbolId', gisCoordSnapshotRef.current.symbolId);
    if (gisCoordSnapshotRef.current.geometryType) {
      form.setFieldValue('geometryType', gisCoordSnapshotRef.current.geometryType);
    }
    latestGisMapValueRef.current = null;
    setGisModalVisible(false);
  };

  const handleConfirmGisMap = () => {
    if (latestGisMapValueRef.current) {
      applyMapSelection(latestGisMapValueRef.current);
    }
    latestGisMapValueRef.current = null;
    setGisModalVisible(false);
  };

  // Load org units
  const loadOrgUnits = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const data = await organizationService.getTree();
      setOrgUnits(data || []);
    } catch {
      setOrgUnits([]);
    } finally {
      setLoadingOrgs(false);
    }
  }, []);

  // Load symbols
  const loadSymbols = useCallback(async () => {
    setLoadingSymbols(true);
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setSymbols([]);
    } finally {
      setLoadingSymbols(false);
    }
  }, []);

  // Load operating orgs
  const loadOperatingOrgs = useCallback(async () => {
    setLoadingOperatingOrgs(true);
    try {
      const res = await api.get('/common/options/operating-organizations');
      const items = res.data?.data;
      if (Array.isArray(items) && items.length > 0) {
        setOperatingOrgs(items);
      }
    } catch {
      setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS);
    } finally {
      setLoadingOperatingOrgs(false);
    }
  }, []);

  // Load VTS Centers
  const loadVtsCenters = useCallback(async () => {
    setLoadingVtsCenters(true);
    try {
      const res = await api.get('/common/options/vts-operation-centers');
      const items = res.data?.data;
      setVtsOperationCenters(Array.isArray(items) ? items : []);
    } catch {
      setVtsOperationCenters([]);
    } finally {
      setLoadingVtsCenters(false);
    }
  }, []);

  // Load Radar stations
  const loadRadarStations = useCallback(async () => {
    setLoadingRadars(true);
    try {
      const res = await api.get('/common/options/radar-stations');
      const items = res.data?.data;
      setRadarStations(Array.isArray(items) ? items : []);
    } catch {
      setRadarStations([]);
    } finally {
      setLoadingRadars(false);
    }
  }, []);

  useEffect(() => {
    loadOrgUnits();
    loadSymbols();
    loadOperatingOrgs();
    loadVtsCenters();
    loadRadarStations();
  }, [loadOrgUnits, loadSymbols, loadOperatingOrgs, loadVtsCenters, loadRadarStations]);

  // Mode Thêm mới: sinh trước mã thiết bị & set đơn vị mặc định
  useEffect(() => {
    if (!isEdit) {
      if (!form.getFieldValue('deviceCode')) {
        setDeviceCodeLoading(true);
        generateScadaCode()
          .then((code) => {
            if (code) form.setFieldsValue({ deviceCode: code });
          })
          .catch(() => {})
          .finally(() => setDeviceCodeLoading(false));
      }

      // Mặc định đơn vị quản lý theo tài khoản của người dùng đang tạo bản ghi mới (chuẩn /beacon-stations)
      const currentOrgUnitId = resolveDefaultOrgUnitId(currentUser, orgUnits)
        || (currentUser?.orgUnitId && currentUser.orgUnitId !== '00000000-0000-0000-0000-000000000017' && currentUser.orgUnitId !== 'G17' ? currentUser.orgUnitId : undefined);

      if (currentOrgUnitId) {
        form.setFieldsValue({ orgUnitId: currentOrgUnitId });
      } else if (!form.getFieldValue('orgUnitId')) {
        api.get('/users/me')
          .then((r) => {
            const p = r.data?.data ?? r.data;
            const uOrgId = p?.orgUnitId;
            if (uOrgId && uOrgId !== '00000000-0000-0000-0000-000000000017' && uOrgId !== 'G17') {
              form.setFieldsValue({ orgUnitId: uOrgId });
            }
          })
          .catch(() => {});
      }
    }
  }, [isEdit, currentUser, orgUnits, form]);

  // GIS Geometry Type changes: adjust coordinateList
  useEffect(() => {
    if (!watchedGeometryType) {
      form.setFieldsValue({ mapSymbolId: undefined, coordinateSystem: undefined, displayRule: undefined });
      form.setFields([{ name: 'mapSymbolId', errors: [] }]);
      setCoordinateList([]);
      setGpsError(null);
      return;
    }
    if (!form.getFieldValue('coordinateSystem')) {
      form.setFieldsValue({ coordinateSystem: 1 });
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
        return prev.slice(0, 1);
      }
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      }
      return prev;
    });
  }, [watchedGeometryType, form]);

  // Populate form fields and state from ScadaResponse
  const populateFormData = useCallback((data: ScadaResponse) => {
    if (data.operatingUnitId && data.operatingUnitName) {
      setOperatingOrgs((prev) => {
        if (prev.some((item) => item.id === data.operatingUnitId)) return prev;
        return [...prev, { id: data.operatingUnitId!, name: data.operatingUnitName!, code: '' }];
      });
    }
    if (data.attachedInfrastructureType === 1 && data.attachedInfrastructureId && data.attachedInfrastructureName) {
      setVtsOperationCenters((prev) => {
        if (prev.some((item) => item.id === data.attachedInfrastructureId)) return prev;
        return [...prev, { id: data.attachedInfrastructureId!, name: data.attachedInfrastructureName!, orgUnitId: data.orgUnitId || undefined }];
      });
    }
    if (data.attachedInfrastructureType === 2 && data.attachedInfrastructureId && data.attachedInfrastructureName) {
      setRadarStations((prev) => {
        if (prev.some((item) => item.id === data.attachedInfrastructureId)) return prev;
        return [...prev, { id: data.attachedInfrastructureId!, stationName: data.attachedInfrastructureName!, orgUnitId: data.orgUnitId || undefined }];
      });
    }

    const pts = parseWktToCoordinates(data.coordinates || undefined);
    let initialCoords: DmsCoordinateItem[] = pts.length > 0 ? pts.map(c => {
      const latDms = ddToDms(c.latitude);
      const lngDms = ddToDms(c.longitude);
      return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
    }) : [];
    const geom = data.geometryType;
    if (geom === 'POINT' && initialCoords.length > 1) {
      initialCoords = [initialCoords[0]];
    } else if (geom && initialCoords.length > 0 && initialCoords.length < (GEOMETRY_POINT_COUNT[geom] ?? 1)) {
      const count = GEOMETRY_POINT_COUNT[geom] ?? 1;
      initialCoords = [...initialCoords, ...Array.from({ length: count - initialCoords.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }))];
    } else if (geom && initialCoords.length === 0) {
      const count = GEOMETRY_POINT_COUNT[geom] ?? 1;
      initialCoords = Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
    }
    setCoordinateList(initialCoords);

    let opStatus = 1;
    if (data.operationalStatus != null) {
      switch (String(data.operationalStatus).toUpperCase()) {
        case '0':
        case 'NOT_YET_OPERATIONAL':
        case 'CHUA_KHAI_THAC':
          opStatus = 0;
          break;
        case '1':
        case 'OPERATIONAL':
        case 'HIEN_HANH':
        case 'ACTIVE':
          opStatus = 1;
          break;
        case '2':
        case 'SUSPENDED':
        case 'TAM_NGUNG':
        case 'INACTIVE':
          opStatus = 2;
          break;
        default: {
          const num = Number(data.operationalStatus);
          opStatus = num >= 0 && num <= 2 ? num : 1;
        }
      }
    }

    form.setFieldsValue({
      deviceCode: data.deviceCode,
      deviceName: data.deviceName,
      orgUnitId: data.orgUnitId,
      operatingUnitId: data.operatingUnitId,
      attachedInfrastructureType: data.attachedInfrastructureType,
      attachedInfrastructureId: data.attachedInfrastructureId,
      provinceName: data.provinceName,
      detailedLocation: data.detailedLocation,
      unitOfMeasure: data.unitOfMeasure,
      quantity: data.quantity,
      yearOfUse: data.yearOfUse != null ? Number(data.yearOfUse) : undefined,
      operationalStatus: opStatus,
      model: data.model,
      manufacturer: data.manufacturer,
      specifications: data.specifications,
      maintenanceInformation: data.maintenanceInformation,
      note: data.note,
      geometryType: data.geometryType || undefined,
      mapSymbolId: data.mapSymbolId,
      coordinateSystem: data.geometryType ? (data.coordinateSystem || 1) : undefined,
      displayRule: data.geometryType ? 'Độ, phút, giây (DMS)' : undefined,
    });
  }, [form]);

  // Edit mode: load data for existing record
  useEffect(() => {
    if (!isEdit || !id) return;

    if (initialData && initialData.id === id) {
      populateFormData(initialData);
    }

    let active = true;
    (async () => {
      try {
        const data: ScadaResponse = await fetchScadaById(id);
        if (!active) return;
        populateFormData(data);

        try {
          const attList = await fetchScadaAttachments(id);
          if (!active) return;
          const files: UploadFile[] = (attList || []).map((a: RawAttachmentItem) => ({
            uid: a.id,
            name: a.fileName,
            fileName: a.fileName,
            size: a.fileSize,
            status: 'done' as const,
          }));
          setExistingFiles(attList || []);
          setUploadedFiles(files);
        } catch {
          if (active) {
            setExistingFiles([]);
            setUploadedFiles([]);
          }
        }
      } catch (err) {
        if (!active) return;
        console.error('Lỗi khi nạp dữ liệu SCADA:', err);
        toast.error('Không thể tải thông tin hệ thống SCADA');
      }
    })();

    return () => {
      active = false;
    };
  }, [isEdit, id, initialData, populateFormData]);

  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
      toast.error('Định dạng không hỗ trợ'); return false;
    }
    if (uploadedFiles.length >= 10) { toast.error('Số lượng tệp đính kèm tối đa là 10 tệp'); return false; }
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
        originFileObj: file as unknown as UploadFile['originFileObj'],
      },
    ]);
    return false;
  };

  // Imperative Submit
  useImperativeHandle(ref, () => ({
    submit: async (saveAction: ScadaSaveAction) => {
      try {
        await form.validateFields();
      } catch (e: unknown) {
        const errFields: Array<{ name: Array<string | number>; errors?: string[] }> =
          (e as { errorFields?: Array<{ name: Array<string | number>; errors?: string[] }> })?.errorFields ?? [];
        const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra lại các trường bắt buộc';
        toast.error(firstError);
        if (errFields.some((f) => f.name[0] === 'geometryType' || f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule')) {
          setActiveTab('location');
        } else {
          setActiveTab('info');
        }
        return;
      }

      const values = form.getFieldsValue(true);
      const geomType = values.geometryType || undefined;
      const hasGeom = !!geomType;
      const hasCoordinates = coordinateList.length > 0;

      if (hasCoordinates && !geomType) {
        toast.error('Loại đối tượng là bắt buộc khi có tọa độ');
        setActiveTab('location');
        return;
      }

      const coordResult = validateDmsCoordinates(coordinateList, geomType);
      if (!coordResult.valid) {
        const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
        toast.error(errMsg);
        setGpsError(errMsg);
        setActiveTab('location');
        return;
      }
      setGpsError(null);

      const validCoords = coordResult.validCoords;
      const wkt = hasGeom && validCoords.length > 0 ? serializeCoordinatesToWkt(validCoords, geomType) : null;

      // DatePicker year trả về dayjs → payload gửi số năm
      const rawYear = values.yearOfUse;
      const submittedYear = rawYear != null ? (dayjs.isDayjs(rawYear) ? rawYear.year() : Number(rawYear)) : undefined;

      const trimOrNull = (v: unknown): string | null => {
        if (v == null) return null;
        const s = String(v).trim();
        return s === '' ? null : s;
      };
      const numOrNull = (v: unknown): number | null => {
        if (v == null || v === '') return null;
        const n = Number(v);
        return Number.isNaN(n) ? null : n;
      };

      onSubmittingChange?.(true);
      try {
        const pendingFiles = uploadedFiles.filter(f => f.originFileObj);

        if (isEdit && id) {
          const payload: UpdateScadaRequest = {
            id,
            deviceName: String(values.deviceName || '').trim(),
            detailedLocation: trimOrNull(values.detailedLocation),
            manufacturer: trimOrNull(values.manufacturer),
            model: trimOrNull(values.model),
            quantity: numOrNull(values.quantity),
            orgUnitId: values.orgUnitId || null,
            operatingUnitId: values.operatingUnitId || null,
            provinceName: trimOrNull(values.provinceName),
            attachedInfrastructureType: numOrNull(values.attachedInfrastructureType),
            attachedInfrastructureId: values.attachedInfrastructureId || null,
            unitOfMeasure: numOrNull(values.unitOfMeasure),
            yearOfUse: submittedYear ?? null,
            operationalStatus: values.operationalStatus != null ? String(values.operationalStatus) : null,
            specifications: trimOrNull(values.specifications),
            maintenanceInformation: trimOrNull(values.maintenanceInformation),
            note: trimOrNull(values.note),
            latitude: hasGeom && validCoords.length > 0 ? validCoords[0].latitude : null,
            longitude: hasGeom && validCoords.length > 0 ? validCoords[0].longitude : null,
            mapSymbolId: hasGeom ? (values.mapSymbolId || null) : null,
            coordinateSystem: hasGeom ? (values.coordinateSystem || null) : null,
            displayRule: hasGeom ? (values.displayRule != null ? (typeof values.displayRule === 'number' ? values.displayRule : 1) : null) : null,
            geometryType: hasGeom ? (geomType as 'POINT' | 'LINE' | 'POLYGON') : null,
            coordinates: hasGeom && wkt ? wkt : null,
            ...(saveAction === 'APPROVED' ? { approvalStatus: 'APPROVED' } : {}),
          };

          await updateScada(payload);

          // Upload pending files
          for (const f of pendingFiles) {
            if (f.originFileObj) {
              await uploadScadaAttachment(id, f.originFileObj);
            }
          }

          if (saveAction === 'SUBMIT') {
            await submitScada(id);
          }

          toast.success(
            saveAction === 'DRAFT'
              ? 'Lưu tạm hệ thống SCADA thành công'
              : saveAction === 'SUBMIT'
                ? 'Lưu và gửi phê duyệt thành công'
                : 'Cập nhật và phê duyệt thành công'
          );
        } else {
          const generatedCode = values.deviceCode || (await generateScadaCode());
          const payload: CreateScadaRequest = {
            deviceCode: generatedCode,
            deviceName: String(values.deviceName || '').trim(),
            detailedLocation: trimOrNull(values.detailedLocation),
            manufacturer: trimOrNull(values.manufacturer),
            model: trimOrNull(values.model),
            quantity: numOrNull(values.quantity) ?? 1,
            orgUnitId: values.orgUnitId || null,
            operatingUnitId: values.operatingUnitId || null,
            provinceName: trimOrNull(values.provinceName),
            attachedInfrastructureType: numOrNull(values.attachedInfrastructureType),
            attachedInfrastructureId: values.attachedInfrastructureId || null,
            unitOfMeasure: numOrNull(values.unitOfMeasure),
            yearOfUse: submittedYear ?? null,
            operationalStatus: values.operationalStatus != null ? String(values.operationalStatus) : '1',
            specifications: trimOrNull(values.specifications),
            maintenanceInformation: trimOrNull(values.maintenanceInformation),
            note: trimOrNull(values.note),
            latitude: hasGeom && validCoords.length > 0 ? validCoords[0].latitude : null,
            longitude: hasGeom && validCoords.length > 0 ? validCoords[0].longitude : null,
            mapSymbolId: hasGeom ? (values.mapSymbolId || null) : null,
            coordinateSystem: hasGeom ? (values.coordinateSystem || null) : null,
            displayRule: hasGeom ? (values.displayRule != null ? (typeof values.displayRule === 'number' ? values.displayRule : 1) : null) : null,
            geometryType: hasGeom ? (geomType as 'POINT' | 'LINE' | 'POLYGON') : null,
            coordinates: hasGeom && wkt ? wkt : null,
            action: saveAction === 'DRAFT' ? 'draft' : saveAction === 'SUBMIT' ? 'submit' : 'approve',
          };

          const created = await createScada(payload);
          if (created?.id && pendingFiles.length > 0) {
            for (const f of pendingFiles) {
              if (f.originFileObj) {
                await uploadScadaAttachment(created.id, f.originFileObj);
              }
            }
          }

          toast.success(
            saveAction === 'DRAFT'
              ? 'Lưu tạm hệ thống SCADA thành công'
              : saveAction === 'SUBMIT'
                ? 'Lưu và gửi phê duyệt thành công'
                : 'Lưu và phê duyệt thành công'
          );
        }

        (onSuccess || onFinish)?.();
      } catch (err: unknown) {
        console.error('[scada] submit error', err);
      } finally {
        onSubmittingChange?.(false);
      }
    },
  }));

  // Coordinate editing helpers
  const removeCoordinate = (i: number) => {
    setCoordinateList((p) => p.filter((_, idx) => idx !== i));
    setGpsError(null);
  };

  const addGpsPoint = () => {
    setCoordinateList((p) => [...p, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
    setGpsError(null);
  };

  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setCoordinateList((p) => {
      const n = [...p];
      n[i] = {
        ...n[i],
        [field === 'lat' ? 'latD' : 'lngD']: dVal,
        [field === 'lat' ? 'latM' : 'lngM']: mVal,
        [field === 'lat' ? 'latS' : 'lngS']: sVal,
      };
      return n;
    });
    setGpsError(null);
  };

  return (
    <>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarStyle={drawerTabBarStyle}
        items={[
          {
            key: 'info',
            label: 'Thông tin chung',
            forceRender: true,
            children: (
              <div style={drawerFormScrollStyle}>
                {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <BankOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin cơ bản & Quản lý vận hành</span>
                    </div>
                  </div>

                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item
                        name="orgUnitId"
                        {...labelProps('Đơn vị quản lý')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}
                      >
                        <FormOrgUnitTreeSelect
                          organizations={orgUnits}
                          placeholder="Chọn đơn vị quản lý..."
                          loading={loadingOrgs}
                          allowClear
                          showPath
                          disabled={isEdit && !isSystemAdmin}
                          style={{ borderRadius: radiusPill, height: 40 }}
                          onChange={(val) => {
                            form.setFieldValue('orgUnitId', val);
                            const currentAttachedId = form.getFieldValue('attachedInfrastructureId');
                            if (!val) {
                              form.setFieldValue('attachedInfrastructureId', undefined);
                            } else if (currentAttachedId) {
                              const rawSet = resolveOrgSubtreeIds(orgUnits, String(val));
                              const normalizedSet = new Set<string>();
                              rawSet.forEach((oId) => normalizedSet.add(String(oId).toLowerCase()));

                              const currentAttachedType = form.getFieldValue('attachedInfrastructureType');
                              const activeOptions = currentAttachedType === 1 ? vtsOperationCenterOptions : currentAttachedType === 2 ? radarStationOptions : [];
                              const isValidAttached = activeOptions.some(
                                (item) => item.value === currentAttachedId && !!item.orgUnitId && normalizedSet.has(String(item.orgUnitId).toLowerCase()),
                              );
                              if (!isValidAttached) {
                                form.setFieldValue('attachedInfrastructureId', undefined);
                              }
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="operatingUnitId" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}>
                        <Select
                          showSearch
                          placeholder="Chọn đơn vị khai thác..."
                          loading={loadingOperatingOrgs}
                          style={selectStyle}
                          options={operatingOrgs.map(o => ({ label: o.name || o.code, value: o.id }))}
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          allowClear
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item name="deviceCode" {...labelProps('Mã thiết bị')} style={{ marginBottom: spaceFormField }} tooltip="Mã thiết bị được sinh tự động">
                        <Input disabled placeholder={deviceCodeLoading ? 'Đang sinh mã...' : 'Mã tự động'} style={readonlyInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="deviceName"
                        {...labelProps('Tên thiết bị')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[
                          { required: true, message: 'Tên thiết bị không được để trống' },
                          { max: 255, message: 'Tối đa 255 ký tự' },
                        ]}
                        validateStatus={atMax.deviceName ? 'error' : undefined}
                        help={atMax.deviceName ? 'Đã đạt tối đa 255 ký tự' : undefined}
                      >
                        <Input placeholder="Nhập tên thiết bị" maxLength={255} showCount style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item
                        name="attachedInfrastructureType"
                        {...labelProps('Thuộc loại hạ tầng')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ required: true, message: 'Loại hạ tầng là bắt buộc' }]}
                      >
                        <Select
                          placeholder="Chọn loại hạ tầng"
                          options={ATTACHED_INFRA_TYPE_OPTIONS}
                          style={selectStyle}
                          onChange={() => {
                            form.setFieldValue('attachedInfrastructureId', undefined);
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="attachedInfrastructureId"
                        {...labelProps('Thuộc hạ tầng')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ required: true, message: 'Hạ tầng phụ thuộc là bắt buộc' }]}
                      >
                        <Select
                          placeholder={
                            !selectedOrgUnitId
                              ? 'Vui lòng chọn đơn vị quản lý trước'
                              : watchedAttachedType === 2
                                ? 'Chọn trạm Radar'
                                : watchedAttachedType === 1
                                  ? 'Chọn Trung Tâm Điều Hành VTS'
                                  : 'Chọn loại hạ tầng trước'
                          }
                          options={
                            watchedAttachedType === 1
                              ? filteredVtsOperationCenterOptions
                              : watchedAttachedType === 2
                                ? filteredRadarStationOptions
                                : []
                          }
                          loading={watchedAttachedType === 1 ? loadingVtsCenters : watchedAttachedType === 2 ? loadingRadars : false}
                          disabled={!selectedOrgUnitId || (watchedAttachedType !== 1 && watchedAttachedType !== 2)}
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          filterOption={(input, option) =>
                            normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                          }
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item name="provinceName" {...labelProps('Địa điểm (Tỉnh/TP)')} style={{ marginBottom: spaceFormField }}>
                        <Select
                          placeholder="Chọn tỉnh/thành phố..."
                          options={VIETNAM_PROVINCES.map(p => ({ label: p, value: p }))}
                          showSearch
                          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                          allowClear
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="detailedLocation"
                        {...labelProps('Địa điểm chi tiết')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}
                        validateStatus={atMax.detailedLocation ? 'error' : undefined}
                        help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}
                      >
                        <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* ── Section 2: Thông số kỹ thuật & Vận hành ── */}
                <div style={specSectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Thông số kỹ thuật & Vận hành</span>
                    </div>
                  </div>

                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item name="unitOfMeasure" {...labelProps('Đơn vị tính')} style={{ marginBottom: spaceFormField }} rules={[ { required: true, message: 'Đơn vị tính là bắt buộc' } ]}>
                        <Select placeholder="Chọn đơn vị tính" options={UNIT_OF_MEASURE_OPTIONS} showSearch optionFilterProp="label" allowClear style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="quantity"
                        {...labelProps('Số lượng')}
                        style={{ marginBottom: spaceFormField }}
                        getValueFromEvent={getValueFromEvent5}
                        rules={[
                          { required: true, message: 'Số lượng là bắt buộc' },
                          integer5Rule,
                        ]}
                      >
                        <NumberInputWithCount
                          min={1}
                          step={1}
                          precision={0}
                          placeholder="Nhập số lượng"
                          style={numberInputStyle}
                          maxLength={5}
                          parser={parseNumber5}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item
                        name="yearOfUse"
                        {...labelProps('Năm đưa vào sử dụng')}
                        style={{ marginBottom: spaceFormField }}
                        getValueProps={(v: unknown) => ({
                          value:
                            v != null
                              ? dayjs.isDayjs(v)
                                ? v
                                : !Number.isNaN(Number(v))
                                ? dayjs().year(Number(v))
                                : null
                              : null,
                        })}
                        getValueFromEvent={(d: { year?: () => number } | null) => (d && typeof d.year === 'function' ? d.year() : null)}
                      >
                        <DatePicker picker="year" format="YYYY" placeholder="Chọn năm đưa vào sử dụng" style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="operationalStatus"
                        {...labelProps('Tình trạng hoạt động')}
                        style={{ marginBottom: spaceFormField }}
                        initialValue={0}
                        rules={[{ required: true, message: 'Tình trạng hoạt động là bắt buộc' }]}
                      >
                        <Select placeholder="Chọn tình trạng..." options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item
                        name="model"
                        {...labelProps('Model')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ max: 255, message: 'Tối đa 255 ký tự' }]}
                        validateStatus={atMax.model ? 'error' : undefined}
                        help={atMax.model ? 'Đã đạt tối đa 255 ký tự' : undefined}
                      >
                        <Input placeholder="Nhập model" maxLength={255} showCount style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="manufacturer"
                        {...labelProps('Hãng sản xuất')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ max: 50, message: 'Tối đa 50 ký tự' }]}
                        validateStatus={atMax.manufacturer ? 'error' : undefined}
                        help={atMax.manufacturer ? 'Đã đạt tối đa 50 ký tự' : undefined}
                      >
                        <Input placeholder="Nhập hãng sản xuất" maxLength={50} showCount style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[24, 0]}>
                    <Col span={24}>
                      <Form.Item
                        name="specifications"
                        {...labelProps('Thông số kỹ thuật')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ max: 2000, message: 'Tối đa 2000 ký tự' }]}
                        validateStatus={atMax.specifications ? 'error' : undefined}
                        help={atMax.specifications ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                      >
                        <Input.TextArea rows={3} placeholder="Nhập thông số kỹ thuật..." maxLength={2000} showCount style={textAreaStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* ── Section 3: Thông tin bảo trì & Ghi chú ── */}
                <div style={maintenanceSectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <FileTextOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin bảo trì & Ghi chú</span>
                    </div>
                  </div>

                  <Row gutter={[24, 0]}>
                    <Col span={24}>
                      <Form.Item
                        name="maintenanceInformation"
                        {...labelProps('Thông tin bảo trì')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ max: 2000, message: 'Tối đa 2000 ký tự' }]}
                        validateStatus={atMax.maintenanceInformation ? 'error' : undefined}
                        help={atMax.maintenanceInformation ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                      >
                        <Input.TextArea rows={3} placeholder="Nhập thông tin bảo trì" maxLength={2000} showCount style={textAreaStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[24, 0]}>
                    <Col span={24}>
                      <Form.Item
                        name="note"
                        {...labelProps('Ghi chú')}
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ max: 2000, message: 'Tối đa 2000 ký tự' }]}
                        validateStatus={atMax.note ? 'error' : undefined}
                        help={atMax.note ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                      >
                        <Input.TextArea rows={3} placeholder="Nhập ghi chú" maxLength={2000} showCount style={textAreaStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
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
                      <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                        <Select
                          placeholder="Chọn loại đối tượng"
                          allowClear
                          options={GEOMETRY_TYPE_OPTIONS}
                          style={selectStyle}
                          onChange={(val) => {
                            if (!val) {
                              form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined, mapSymbolId: undefined });
                              setCoordinateList([]);
                              setGpsError(null);
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="mapSymbolId"
                        {...labelProps('Biểu tượng')}
                        required={!!watchedGeometryType}
                        rules={
                          watchedGeometryType
                            ? [{ required: true, message: 'Vui lòng chọn biểu tượng' }]
                            : []
                        }
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn biểu tượng bản đồ"
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          disabled={!watchedGeometryType}
                          loading={loadingSymbols}
                          style={selectStyle}
                        >
                          {(Array.isArray(symbols) ? symbols : []).map((sym) => (
                            <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                              <Space>
                                {sym.image && (
                                  <img
                                    src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                                    alt={sym.name}
                                    style={{ width: 20, height: 20, objectFit: 'contain' }}
                                  />
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
                      <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
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
                    <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                      Tọa độ GPS ({coordinateList.length})
                    </span>
                    <Space size={8}>
                      <Button
                        icon={<EnvironmentOutlined style={{ color: !watchedGeometryType ? undefined : actionPrimary }} />}
                        onClick={() => {
                          gisCoordSnapshotRef.current = {
                            coords: coordinateList.map((c) => ({ ...c })),
                            symbolId: form.getFieldValue('mapSymbolId'),
                            geometryType: form.getFieldValue('geometryType'),
                          };
                          latestGisMapValueRef.current = null;
                          setGisModalVisible(true);
                        }}
                        disabled={!watchedGeometryType}
                        style={!watchedGeometryType ? {
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
                        onClick={addGpsPoint}
                        disabled={!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)}
                        style={!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1) ? {
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
                        title={watchedGeometryType === 'POINT' && coordinateList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined}
                      >
                        Thêm tọa độ
                      </Button>
                    </Space>
                  </div>

                  {coordinateList.length === 0 ? (
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
                        dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
                        rowKey={(r: DmsCoordinateItem & { _idx: number }) => String(r._idx)}
                        emptyText="Chưa có tọa độ GPS nào"
                        columns={[
                          {
                            title: 'STT',
                            width: 60,
                            align: 'center' as const,
                            onCell: () => ({ style: { verticalAlign: 'middle' } }),
                            render: (_v: unknown, _r: unknown, idx: number) => idx + 1,
                          },
                          {
                            title: 'Vĩ độ (Latitude - N)',
                            key: 'lat',
                            onCell: () => ({ style: { verticalAlign: 'middle' } }),
                            render: (_v: unknown, record: DmsCoordinateItem & { _idx: number }) =>
                              renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
                          },
                          {
                            title: 'Kinh độ (Longitude - E)',
                            key: 'lng',
                            onCell: () => ({ style: { verticalAlign: 'middle' } }),
                            render: (_v: unknown, record: DmsCoordinateItem & { _idx: number }) =>
                              renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
                          },
                          {
                            title: '',
                            width: 50,
                            align: 'center' as const,
                            onCell: () => ({ style: { verticalAlign: 'middle' } }),
                            render: (_v: unknown, record: DmsCoordinateItem & { _idx: number }) => (
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                                onClick={() => removeCoordinate(record._idx)}
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
            ),
          },
          {
            key: 'attachments',
            label: `File đính kèm (${uploadedFiles.length})`,
            children: (
              <div style={drawerFormScrollStyle}>
                <InfrastructureAttachmentTab
                  attachments={uploadedFiles.map((f) => ({
                    ...f,
                    id: f.uid || (f as unknown as { id?: string }).id || '',
                    fileName: f.name || (f as unknown as { fileName?: string }).fileName || (f.originFileObj as File)?.name || '—',
                    fileSize: (f as unknown as { fileSize?: number }).fileSize ?? f.size ?? f.originFileObj?.size,
                    uploadedByName:
                      (f as unknown as { uploadedByName?: string }).uploadedByName ||
                      ((f as unknown as { uploadedBy?: string }).uploadedBy ? userMap.get((f as unknown as { uploadedBy?: string }).uploadedBy!) || (f as unknown as { uploadedBy?: string }).uploadedBy : '') ||
                      currentUser?.fullName ||
                      currentUser?.username ||
                      'Cán bộ quản lý',
                    uploadedDate: (f as unknown as { uploadedDate?: string }).uploadedDate || (f as unknown as { uploadedAt?: string }).uploadedAt || (f as unknown as { createdAt?: string }).createdAt || dayjs().toISOString(),
                  }))}
                  readonly={false}
                  userMap={userMap}
                  onUpload={(file) => {
                    handleBeforeUpload(file);
                    return false;
                  }}
                  onDelete={async (attId: string) => {
                    const isExisting = existingFiles.some((a) => a.id === attId);
                    if (isExisting && id) {
                      try {
                        await deleteScadaAttachment(id, attId);
                        toast.success('Xóa tệp đính kèm thành công');
                      } catch {
                        toast.error('Không thể xóa tệp đính kèm');
                        return;
                      }
                    }
                    setUploadedFiles((prev) => prev.filter((f) => f.uid !== attId && (f as unknown as { id?: string }).id !== attId));
                    setExistingFiles((prev) => prev.filter((a) => a.id !== attId));
                  }}
                  onDownload={async (uid, name) => {
                    const fileItem = uploadedFiles.find((x) => x.uid === uid || (x as unknown as { id?: string }).id === uid);
                    const rawFile = fileItem?.originFileObj || (fileItem as unknown as { file?: File })?.file;
                    if (rawFile) {
                      const url = window.URL.createObjectURL(rawFile);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = name || (rawFile as File).name || 'attachment';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      return;
                    }

                    if (isEdit && id) {
                      try {
                        await downloadScadaAttachment(id, uid, name);
                      } catch {
                        toast.error('Không thể tải xuống tệp đính kèm');
                      }
                    } else {
                      toast.error('Không tìm thấy tệp để tải xuống');
                    }
                  }}
                />
              </div>
            ),
          },
        ]}
      />

      {/* GIS Location Selector Modal — chọn tọa độ trên bản đồ chuyên dụng (chuẩn VTS CHK) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: fontSizeLg, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span>Chọn vị trí & tọa độ trên bản đồ chuyên dụng</span>
          </div>
        }
        open={gisModalVisible}
        onCancel={handleCancelGisMap}
        destroyOnHidden
        width="94vw"
        style={{ maxWidth: 1400, top: 20 }}
        footer={[
          <Button
            key="cancel"
            onClick={handleCancelGisMap}
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
        <div style={{ height: 520, borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType={normalizeGeometryType(watchedGeometryType)}
            height={520}
            value={{
              geometryType: normalizeGeometryType(watchedGeometryType),
              coordinates: serializeCoordinatesToWkt(
                coordinateList
                  .filter((c) => c.latD != null && c.lngD != null)
                  .map((c) => ({
                    latitude: dmsToDd(c.latD, c.latM, c.latS),
                    longitude: dmsToDd(c.lngD, c.lngM, c.lngS),
                  }))
                  .filter((c) => c.latitude != null && c.longitude != null) as { latitude: number; longitude: number }[],
                watchedGeometryType || 'POINT',
              ),
              symbolId: form.getFieldValue('mapSymbolId') || undefined,
            }}
            onChange={applyMapSelection}
          />
        </div>
      </Modal>
    </>
  );
});

export default ScadaForm;
