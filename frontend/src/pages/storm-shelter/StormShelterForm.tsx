import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Upload, Space, DatePicker, Table, Drawer,
} from 'antd';
import type { UploadFile } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, FileOutlined, EditOutlined } from '@ant-design/icons';
import { colors } from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault, actionPrimary,
  fontSizeSm, fontSizeMd, fontWeightMedium, fontWeightBold,
  radiusPill, radiusMd, spaceSm, spaceFormField,
  surfaceCard, uploadHintStyle,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, primaryButtonStyle,
} from '../../tokens';
import { VIETNAM_PROVINCES } from '../../types/common';
import PagedTable from '../../components/list-view/PagedTable';
import type { SaveAction } from '../../types/port';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { stormShelterCRUD, portCRUD, buoyBerthCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import { lineObjectService } from '../../services/lineObjectService';
import { LineObject } from '../../types/lineObject';
import type { Symbol as IconSymbol } from '../../services/symbolService';
import { useAuthStore } from '../../store/authStore';

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

const headerCellStyle: React.CSSProperties = {
  background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold,
  fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px',
};

const sectionLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
  { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
  { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
];

export const STORM_SHELTER_CLASSIFICATION_OPTIONS = [
  { value: 'Tránh bão', label: 'Tránh bão' },
  { value: 'Trú bão', label: 'Trú bão' },
  { value: 'Tránh, trú bão', label: 'Tránh, trú bão' },
];

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' }, { value: 'LINE', label: 'Đối tượng đường' }, { value: 'POLYGON', label: 'Đối tượng vùng' },
];
const COORD_SYS_OPTIONS = [{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }];
// Số lượng tọa độ mặc định tương ứng với từng loại đối tượng: điểm → 1, đường → 2, vùng → 3
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length-1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(([^)]+(?:,[^)]+)*)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* ignore */ }
  return [];
};

function ddToDms(dd: number | null | undefined): { d: number | null; m: number | null; s: number | null } {
  if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
  let abs = Math.abs(dd);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
  let m = Math.floor(mFloat);
  let sFloat = (mFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
  return { d: d === 0 ? null : d, m: m === 0 ? null : m, s: s === 0 ? null : s };
}

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary };

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho các bảng tọa độ (GPS chính & điểm neo trong Drawer). */
const renderDmsGroup = (
  decimalValue: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  const dms = ddToDms(decimalValue);
  return (
    <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
      <InputNumber value={dms.d} min={0} max={maxDeg} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(v ?? 0, dms.m, dms.s)} style={{ flex: 1, minWidth: 0 }} controls={false} />
      <span style={dmsUnitStyle}>°</span>
      <InputNumber value={dms.m} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dms.d, v ?? 0, dms.s)} style={{ flex: 1, minWidth: 0 }} controls={false} />
      <span style={dmsUnitStyle}>'</span>
      <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dms.d, dms.m, v ?? 0)} style={{ flex: 1, minWidth: 0 }} controls={false} />
      <span style={dmsUnitEndStyle}>"</span>
    </Space.Compact>
  );
};

export interface AnchorPointField {
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface MooringWaterAreaField {
  description: string;
  geometryType?: string;
  mapSymbolId?: string;
  coordinateSystem?: number;
  displayRule?: string;
  anchorPoints?: AnchorPointField[];
}

export interface StormShelterFormFields {
  orgUnitId?: string;
  portId?: string;
  stormShelterCode?: string;
  stormShelterName?: string;
  provinceId?: number;
  detailedLocation?: string;
  navigationChannelId?: string;
  buoyStationId?: string;
  classification?: string;
  shapeDescription?: string;
  area?: number;
  designWaterDepth?: number;
  currentWaterDepth?: number;
  bottomElevationDesign?: number;
  activeStormShelterCount?: number;
  publishedStormShelterCount?: number;
  underInvestmentStormShelterCount?: number;
  operationalStatus?: string;
  openingAnnouncementDate?: string;
  publicDecision?: string;
  investmentAgreement?: string;
  coordinates?: Array<{ latitude: number; longitude: number }>;
  geometryType?: string;
  coordinateSystem?: number;
  displayRule?: string;
  mapSymbolId?: string;
  mooringWaterAreas?: MooringWaterAreaField[];
}

export interface StormShelterFormProps {
  form: any;
  id?: string;
  onFinish: (saved: boolean) => void;
  /** Báo trạng thái đang lưu cho nút submit bên ngoài (hiển thị loading tròn trên nút được bấm) */
  onSubmittingChange?: (submitting: boolean) => void;
}

export default forwardRef(function StormShelterForm({ form, id, onFinish, onSubmittingChange }: StormShelterFormProps, ref) {
  const isEdit = !!id;
  const [, setSubmitting] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [waterAreaOpen, setWaterAreaOpen] = useState(true);
  const [technicalOpen, setTechnicalOpen] = useState(true);
  const [stormShelterCodeLoading, setStormShelterCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = (currentUser?.permissions?.includes('admin:all') || currentUser?.permissions?.includes('*')) ?? false;
  const editPortIdRef = useRef<string | undefined>(undefined);

  const watchedGeometryType = Form.useWatch('geometryType', form);
  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);

  /** true khi field đã đạt đủ max ký tự — bật viền đỏ ô nhập + message bên dưới. */
  const useMaxReached = (name: string, max: number): boolean => {
    const raw = Form.useWatch(name, form) ?? '';
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };
  const atMax = {
    stormShelterName: useMaxReached('stormShelterName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    shapeDescription: useMaxReached('shapeDescription', 255),
    area: useMaxReached('area', 20),
    designWaterDepth: useMaxReached('designWaterDepth', 20),
    currentWaterDepth: useMaxReached('currentWaterDepth', 20),
    bottomElevationDesign: useMaxReached('bottomElevationDesign', 20),
    activeStormShelterCount: useMaxReached('activeStormShelterCount', 5),
    publishedStormShelterCount: useMaxReached('publishedStormShelterCount', 5),
    underInvestmentStormShelterCount: useMaxReached('underInvestmentStormShelterCount', 5),
    publicDecision: useMaxReached('publicDecision', 2000),
    investmentAgreement: useMaxReached('investmentAgreement', 2000),
  };

  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [portOptions, setPortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [waterwayOptions, setWaterwayOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [buoyStationOptions, setBuoyStationOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [symbols, setSymbols] = useState<IconSymbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ latitude: number | null; longitude: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [waterAreaList, setWaterAreaList] = useState<MooringWaterAreaField[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [, setExistingFiles] = useState<any[]>([]);

  // ── Drawer "Thông tin khu nước neo buộc tàu" ──
  const [waterAreaDrawerOpen, setWaterAreaDrawerOpen] = useState(false);
  const [editingWaterAreaIndex, setEditingWaterAreaIndex] = useState<number | null>(null);
  const [waterAreaDescription, setWaterAreaDescription] = useState('');
  const [waterAreaGeometryType, setWaterAreaGeometryType] = useState<string | undefined>(undefined);
  const [waterAreaMapSymbolId, setWaterAreaMapSymbolId] = useState<string | undefined>(undefined);
  const [waterAreaCoordinateSystem, setWaterAreaCoordinateSystem] = useState<number | undefined>(undefined);
  const [waterAreaDisplayRule, setWaterAreaDisplayRule] = useState<string | undefined>(undefined);
  const [waterAreaAnchorPoints, setWaterAreaAnchorPoints] = useState<AnchorPointField[]>([]);
  const [waterAreaSaving, setWaterAreaSaving] = useState(false);
  const waterAreaSymbolSelectRef = useRef<any>(null);

  useEffect(() => { symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => setSymbols(r.data || [])).catch(() => {}); }, []);
  useEffect(() => { setLoadingOrgs(true); organizationService.list({ pageSize: 1000 }).then(r => setOrgUnits(r.data || [])).catch(() => {}).finally(() => setLoadingOrgs(false)); }, []);
  useEffect(() => { lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize: 1000 }).then(r => setWaterwayOptions((r.data || []).map((l: any) => ({ value: l.id, label: l.name || l.code })))).catch(() => {}); }, []);
  useEffect(() => { buoyBerthCRUD.search({ page: 1, pageSize: 1000, approvalStatus: 'APPROVED' }).then(r => setBuoyStationOptions((r.data || []).map((s: any) => ({ value: s.id, label: s.buoyBerthName || s.buoyBerthCode || s.id })))).catch(() => {}); }, []);

  const loadPortOptions = async (orgUnitId: string) => {
    setLoadingPorts(true);
    try {
      const params: any = { page: 1, pageSize: 1000, approvalStatus: 'APPROVED' };
      if (orgUnitId) params.orgUnitId = orgUnitId;
      const r = await portCRUD.search(params);
      const ports = (r.data || []).map((p: any) => ({ value: p.id, label: p.portName || p.name || p.id }));
      setPortOptions(ports);
      if (ports.length === 0) toast.warning('Đơn vị quản lý chưa có cảng biển được phê duyệt');
    } catch { setPortOptions([]); }
    finally { setLoadingPorts(false); }
  };

  useEffect(() => { if (watchedOrgUnitId) { if (!isEdit || !form.getFieldValue('portId')) form.setFieldsValue({ portId: undefined, stormShelterCode: undefined }); loadPortOptions(watchedOrgUnitId); } }, [watchedOrgUnitId]);

  useEffect(() => {
    if (!watchedPortId || (isEdit && editPortIdRef.current === watchedPortId)) return;
    setStormShelterCodeLoading(true);
    stormShelterCRUD.generateCode(watchedPortId)
      .then((res: any) => { if (res?.stormShelterCode) form.setFieldsValue({ stormShelterCode: res.stormShelterCode }); })
      .catch(() => {})
      .finally(() => setStormShelterCodeLoading(false));
  }, [watchedPortId]);

  useEffect(() => { if (!isSystemAdmin && !isEdit) { api.get('/users/me').then(r => { const p = r.data?.data ?? r.data; if (p?.orgUnitId) form.setFieldsValue({ orgUnitId: p.orgUnitId }); }).catch(() => {}); } }, []);

  // Khi chọn loại đối tượng → tự set hệ quy chiếu, quy tắc hiển thị và thêm sẵn số dòng tọa độ tương ứng
  useEffect(() => {
    if (!watchedGeometryType) return;
    form.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    // Điểm → 1 tọa độ, đường → 2 tọa độ, vùng → 3 tọa độ (cả thêm mới lẫn chỉnh sửa; chỉnh sửa giữ nguyên tọa độ đã có, thêm dòng trống cho đủ)
    const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
    if (!isEdit) {
      setCoordinateList(Array.from({ length: count }, () => ({ latitude: null, longitude: null })));
    } else {
      setCoordinateList((prev) => {
        if (prev.length >= count) return prev;
        const added = Array.from({ length: count - prev.length }, () => ({ latitude: null, longitude: null }));
        return [...prev, ...added];
      });
    }
  }, [watchedGeometryType]);

  // Khi chọn loại đối tượng cho khu nước neo buộc tàu (trong Drawer) → tự set hệ quy chiếu & quy tắc hiển thị
  // + tự thêm dòng tọa độ điểm neo trống cho đủ tối thiểu theo loại: Điểm→1, Đường→2, Vùng→3
  useEffect(() => {
    if (!waterAreaGeometryType) return;
    setWaterAreaCoordinateSystem(1);
    setWaterAreaDisplayRule('Độ, phút, giây (DMS)');
    const count = GEOMETRY_POINT_COUNT[waterAreaGeometryType] ?? 1;
    setWaterAreaAnchorPoints((prev) => {
      if (prev.length >= count) return prev;
      const added = Array.from({ length: count - prev.length }, () => ({ name: '', latitude: null, longitude: null }));
      return [...prev, ...added];
    });
  }, [waterAreaGeometryType]);

  // Edit mode: load existing
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data: any = await stormShelterCRUD.findById(id);
        const ec = data.coordinates ? parseGisCoordinates({ geometryType: data.geometryType, coordinates: data.coordinates }) : [];
        setCoordinateList(ec.length > 0 ? ec.map(c => ({ latitude: c.latitude, longitude: c.longitude })) : data.latitude != null ? [{ latitude: data.latitude, longitude: data.longitude }] : []);
        setWaterAreaList(Array.isArray(data.mooringWaterAreas) && data.mooringWaterAreas.length > 0
          ? data.mooringWaterAreas.map((w: any) => ({
              description: w.description ?? w,
              geometryType: w.geometryType,
              mapSymbolId: w.mapSymbolId,
              coordinateSystem: w.coordinateSystem,
              displayRule: w.displayRule,
              anchorPoints: Array.isArray(w.anchorPoints)
                ? w.anchorPoints.map((p: any) => ({ name: p.name, latitude: p.latitude, longitude: p.longitude }))
                : [],
            }))
          : []);
        if (data.orgUnitId) await loadPortOptions(data.orgUnitId);
        try {
          const fr = await api.get(`/v1/storm-shelter/${id}/attachments`, { params: { page: 0, size: 50 } });
          const files = fr.data?.data || [];
          setExistingFiles(files);
          setUploadedFiles(files.map((a: any) => ({ uid: a.id, name: a.fileName || a.name, size: a.fileSize, status: 'done' as const })));
        } catch { setExistingFiles([]); }
        editPortIdRef.current = data.portId;
        form.setFieldsValue({
          orgUnitId: data.orgUnitId, portId: data.portId,
          stormShelterCode: data.stormShelterCode, stormShelterName: data.stormShelterName,
          navigationChannelId: data.navigationChannelId, buoyStationId: data.buoyStationId, classification: data.classification,
          provinceId: data.provinceId ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined : undefined,
          detailedLocation: data.detailedLocation, shapeDescription: data.shapeDescription,
          area: data.area, designWaterDepth: data.designWaterDepth, currentWaterDepth: data.currentWaterDepth,
          bottomElevationDesign: data.bottomElevationDesign,
          activeStormShelterCount: data.activeStormShelterCount, publishedStormShelterCount: data.publishedStormShelterCount,
          underInvestmentStormShelterCount: data.underInvestmentStormShelterCount,
          operationalStatus: data.operationalStatus || undefined,
          openingAnnouncementDate: data.openingAnnouncementDate ? dayjs(data.openingAnnouncementDate) : undefined,
          publicDecision: data.publicDecision, investmentAgreement: data.investmentAgreement,
          geometryType: data.geometryType || undefined, mapSymbolId: data.mapSymbolId, coordinateSystem: data.coordinateSystem, displayRule: data.displayRule,
        });
      } catch { toast.error('Không thể tải thông tin khu tránh, trú bão'); }
    })();
  }, [isEdit, id]);

  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    if (uploadedFiles.length >= 10) { toast.error('Tối đa 10 file'); return false; }
    setUploadedFiles(p => [...p, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file as any }]);
    return false;
  };

  const removeCoordinate = (i: number) => { setCoordinateList(p => p.filter((_, idx) => idx !== i)); setGpsError(null); };
  const addGpsPoint = () => { setCoordinateList(p => [...p, { latitude: null, longitude: null }]); setGpsError(null); };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    const decimal = (dVal ?? 0) + (mVal ?? 0) / 60 + (sVal ?? 0) / 3600;
    setCoordinateList(p => { const n = [...p]; n[i] = { ...n[i], [field === 'lat' ? 'latitude' : 'longitude']: decimal }; return n; });
    setGpsError(null);
  };

  // ── Khu nước neo buộc tàu: mở/đóng Drawer, CRUD điểm neo ──
  const resetWaterAreaDrawerState = () => {
    setWaterAreaDescription('');
    setWaterAreaGeometryType(undefined);
    setWaterAreaMapSymbolId(undefined);
    setWaterAreaCoordinateSystem(undefined);
    setWaterAreaDisplayRule(undefined);
    setWaterAreaAnchorPoints([]);
  };

  const openAddWaterArea = () => {
    setEditingWaterAreaIndex(null);
    resetWaterAreaDrawerState();
    setWaterAreaDrawerOpen(true);
  };

  const openEditWaterArea = (i: number) => {
    const item = waterAreaList[i];
    setEditingWaterAreaIndex(i);
    setWaterAreaDescription(item.description || '');
    setWaterAreaGeometryType(item.geometryType);
    setWaterAreaMapSymbolId(item.mapSymbolId);
    setWaterAreaCoordinateSystem(item.coordinateSystem);
    setWaterAreaDisplayRule(item.displayRule);
    setWaterAreaAnchorPoints(item.anchorPoints ? item.anchorPoints.map(p => ({ ...p })) : []);
    setWaterAreaDrawerOpen(true);
  };

  const closeWaterAreaDrawer = () => { setWaterAreaDrawerOpen(false); setEditingWaterAreaIndex(null); resetWaterAreaDrawerState(); };

  const removeWaterArea = (i: number) => setWaterAreaList(p => p.filter((_, idx) => idx !== i));

  const addAnchorPoint = () => setWaterAreaAnchorPoints(p => [...p, { name: '', latitude: null, longitude: null }]);
  const removeAnchorPoint = (i: number) => setWaterAreaAnchorPoints(p => p.filter((_, idx) => idx !== i));
  const updateAnchorPointName = (i: number, name: string) => setWaterAreaAnchorPoints(p => { const n = [...p]; n[i] = { ...n[i], name }; return n; });
  const updateAnchorPointCoord = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    const decimal = (dVal ?? 0) + (mVal ?? 0) / 60 + (sVal ?? 0) / 3600;
    setWaterAreaAnchorPoints(p => { const n = [...p]; n[i] = { ...n[i], [field === 'lat' ? 'latitude' : 'longitude']: decimal }; return n; });
  };

  const saveWaterArea = () => {
    if (!waterAreaDescription.trim()) { toast.error('Phạm vi khu nước neo buộc tàu không được để trống'); return; }
    if (waterAreaGeometryType) {
      const minCount = GEOMETRY_POINT_COUNT[waterAreaGeometryType] ?? 1;
      const validPoints = waterAreaAnchorPoints.filter(p => p.latitude != null && p.longitude != null && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude)));
      if (validPoints.length < minCount) {
        toast.error(waterAreaGeometryType === 'POLYGON' ? 'Đối tượng vùng cần ít nhất 3 tọa độ điểm neo hợp lệ' : waterAreaGeometryType === 'LINE' ? 'Đối tượng đường cần ít nhất 2 tọa độ điểm neo hợp lệ' : 'Đối tượng điểm cần ít nhất 1 tọa độ điểm neo hợp lệ');
        return;
      }
    }
    setWaterAreaSaving(true);
    const item: MooringWaterAreaField = {
      description: waterAreaDescription.trim(),
      geometryType: waterAreaGeometryType,
      mapSymbolId: waterAreaMapSymbolId,
      coordinateSystem: waterAreaCoordinateSystem,
      displayRule: waterAreaDisplayRule,
      anchorPoints: waterAreaAnchorPoints.filter(p => p.name.trim() || (p.latitude != null && p.longitude != null)),
    };
    setWaterAreaList(prev => {
      if (editingWaterAreaIndex == null) return [...prev, item];
      const n = [...prev]; n[editingWaterAreaIndex] = item; return n;
    });
    closeWaterAreaDrawer();
    setWaterAreaSaving(false);
  };

  const handleOrgUnitChange = () => { form.setFieldsValue({ portId: undefined, stormShelterCode: undefined }); setCoordinateList([]); };

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    const values = form.getFieldsValue();
    try { await form.validateFields(); } catch (e: any) {
      const errFields: Array<{ name: Array<string | number> }> = e?.errorFields ?? [];
      if (errFields.some((f) => f.name[0] === 'orgUnitId' || f.name[0] === 'portId' || f.name[0] === 'stormShelterName')) setActiveTabKey('general');
      else if (errFields.some((f) => f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule' || f.name[0] === 'geometryType')) setActiveTabKey('location');
      return false;
    }
    const mooringWaterAreas = waterAreaList
      .filter(w => w.description && w.description.trim())
      .map(w => ({
        description: w.description.trim(),
        geometryType: w.geometryType || undefined,
        mapSymbolId: w.mapSymbolId || undefined,
        coordinateSystem: w.coordinateSystem != null ? Number(w.coordinateSystem) : undefined,
        displayRule: w.displayRule || undefined,
        anchorPoints: (w.anchorPoints || [])
          .filter(p => p.name.trim() || (p.latitude != null && p.longitude != null))
          .map(p => ({
            name: p.name?.trim() || undefined,
            latitude: p.latitude != null && !isNaN(Number(p.latitude)) ? Number(p.latitude) : undefined,
            longitude: p.longitude != null && !isNaN(Number(p.longitude)) ? Number(p.longitude) : undefined,
          })),
      }));
    const manualCoords = coordinateList.filter(c => c.latitude != null && c.longitude != null && !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude))).map(c => ({ latitude: Number(c.latitude), longitude: Number(c.longitude) }));
    if (values.geometryType) {
      const minCount = GEOMETRY_POINT_COUNT[values.geometryType] ?? 1;
      if (manualCoords.length < minCount) {
        toast.error(values.geometryType === 'POLYGON' ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ' : values.geometryType === 'LINE' ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ' : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ');
        setActiveTabKey('location');
        return;
      }
    }
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      const payload: Record<string, unknown> = {
        orgUnitId: values.orgUnitId, portId: values.portId,
        stormShelterCode: String(values.stormShelterCode || '').trim() || undefined, stormShelterName: String(values.stormShelterName || '').trim(),
        navigationChannelId: values.navigationChannelId || undefined, buoyStationId: values.buoyStationId || undefined, classification: values.classification || undefined,
        provinceId: values.provinceId ? VIETNAM_PROVINCES.indexOf(values.provinceId) + 1 : undefined,
        detailedLocation: values.detailedLocation || undefined, shapeDescription: values.shapeDescription || undefined,
        area: values.area != null && !isNaN(Number(values.area)) ? Number(values.area) : undefined,
        designWaterDepth: values.designWaterDepth != null && !isNaN(Number(values.designWaterDepth)) ? Number(values.designWaterDepth) : undefined,
        currentWaterDepth: values.currentWaterDepth != null && !isNaN(Number(values.currentWaterDepth)) ? Number(values.currentWaterDepth) : undefined,
        bottomElevationDesign: values.bottomElevationDesign != null && !isNaN(Number(values.bottomElevationDesign)) ? Number(values.bottomElevationDesign) : undefined,
        activeStormShelterCount: values.activeStormShelterCount != null && !isNaN(Number(values.activeStormShelterCount)) ? Number(values.activeStormShelterCount) : undefined,
        publishedStormShelterCount: values.publishedStormShelterCount != null && !isNaN(Number(values.publishedStormShelterCount)) ? Number(values.publishedStormShelterCount) : undefined,
        underInvestmentStormShelterCount: values.underInvestmentStormShelterCount != null && !isNaN(Number(values.underInvestmentStormShelterCount)) ? Number(values.underInvestmentStormShelterCount) : undefined,
        operationalStatus: values.operationalStatus || undefined,
        openingAnnouncementDate: values.openingAnnouncementDate ? (typeof values.openingAnnouncementDate === 'string' ? values.openingAnnouncementDate : values.openingAnnouncementDate.format('YYYY-MM-DD') + 'T00:00:00') : undefined,
        publicDecision: values.publicDecision || undefined, investmentAgreement: values.investmentAgreement || undefined,
        latitude: manualCoords.length > 0 ? manualCoords[0].latitude : undefined,
        longitude: manualCoords.length > 0 ? manualCoords[0].longitude : undefined,
        coordinates: manualCoords.length > 1 ? `MULTIPOINT(${manualCoords.map(c => `(${c.longitude} ${c.latitude})`).join(',')})` : manualCoords.length === 1 ? `POINT(${manualCoords[0].longitude} ${manualCoords[0].latitude})` : undefined,
        geometryType: values.geometryType || undefined, mapSymbolId: values.mapSymbolId || undefined,
        coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null ? Number(values.displayRule) : undefined,
        mooringWaterAreas: mooringWaterAreas.length > 0 ? mooringWaterAreas : undefined,
      };
      if (saveAction !== 'UPDATE') (payload as any).saveAction = saveAction;
      Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
      let createdStormShelterId: string | undefined;
      if (isEdit && id) { await stormShelterCRUD.update({ ...payload, id } as any); createdStormShelterId = id; }
      else { const res: any = await stormShelterCRUD.create(payload as any); createdStormShelterId = res?.id ?? res?.data?.id; }
      if (createdStormShelterId && uploadedFiles.length > 0) {
        for (const fi of uploadedFiles) {
          const of = fi.originFileObj as File;
          if (!of) continue;
          const fd = new FormData();
          fd.append('files', of);
          await api.post(`/v1/storm-shelter/${createdStormShelterId}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
        }
      }
      toast.success(saveAction === 'DRAFT' ? 'Lưu tạm thành công' : saveAction === 'APPROVED' ? 'Phê duyệt thành công' : saveAction === 'UPDATE' ? 'Cập nhật thành công' : 'Gửi phê duyệt thành công');
      onFinish(true);
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      return false;
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  }, [form, isEdit, id, onFinish, onSubmittingChange, waterAreaList, coordinateList, uploadedFiles]);

  const tabItems = [
    // Tab 1: Thông tin chung
    { key: 'general', label: 'Thông tin chung', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị quản lý không được để trống' }]}>
            <OrgUnitTreeSelect organizations={orgUnits} placeholder="Chọn đơn vị quản lý..." loading={loadingOrgs} disabled={isEdit || !isSystemAdmin} showPath treeDefaultExpandAll={false} onChange={handleOrgUnitChange} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="portId" {...labelProps('Thuộc cảng biển')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Thuộc cảng biển không được để trống' }]}>
            <Select placeholder={!watchedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : portOptions.length === 0 && !loadingPorts ? 'Không có cảng biển thuộc đơn vị quản lý' : 'Chọn cảng biển...'}
              loading={loadingPorts} disabled={!watchedOrgUnitId || (portOptions.length === 0 && !loadingPorts)} options={portOptions}
              showSearch optionFilterProp="label" notFoundContent="Không có cảng biển thuộc đơn vị quản lý" style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="stormShelterCode" {...labelProps('Mã khu tránh, trú bão')} style={{ marginBottom: spaceFormField }} tooltip="Mã khu tránh, trú bão được sinh tự động">
            <Input disabled placeholder={stormShelterCodeLoading ? 'Đang sinh mã...' : watchedPortId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã'} style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="stormShelterName" {...labelProps('Tên khu tránh, trú bão')} style={{ marginBottom: spaceFormField }}
            rules={[{ required: true, message: 'Tên khu tránh, trú bão không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]}
            validateStatus={atMax.stormShelterName ? 'error' : undefined} help={atMax.stormShelterName ? 'Đã đạt tối đa 255 ký tự' : undefined}>
            <Input placeholder="Nhập tên khu tránh, trú bão" maxLength={255} style={inputStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) không được để trống' }]}>
            <Select placeholder="Chọn địa điểm" showSearch optionFilterProp="label"
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="navigationChannelId" {...labelProps('Thuộc luồng hàng hải')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn luồng hàng hải..." options={waterwayOptions} showSearch allowClear optionFilterProp="label" style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="buoyStationId" {...labelProps('Thuộc bến phao')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn bến phao..." options={buoyStationOptions} showSearch allowClear optionFilterProp="label" style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="classification" {...labelProps('Phân loại')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn phân loại" options={STORM_SHELTER_CLASSIFICATION_OPTIONS} showSearch allowClear optionFilterProp="label" style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.detailedLocation ? 'error' : undefined} help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}>
            <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="operationalStatus" {...labelProps('Tình trạng')} required style={{ marginBottom: spaceFormField }} initialValue="NOT_YET_OPERATIONAL" rules={[{ required: true, message: 'Tình trạng không được để trống' }]}>
            <Select placeholder="Chọn tình trạng" options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, marginBottom: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setTechnicalOpen(!technicalOpen)}>
        <span style={{ color: technicalOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{technicalOpen ? '▼' : '▶'} Thông tin kỹ thuật</span>
      </button>
      {technicalOpen && (<div>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="shapeDescription" {...labelProps('Hình dạng')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.shapeDescription ? 'error' : undefined} help={atMax.shapeDescription ? 'Đã đạt tối đa 255 ký tự' : undefined}>
            <Input placeholder="Nhập hình dạng" maxLength={255} style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="area" {...labelProps('Diện tích (ha)')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.area ? 'error' : undefined} help={atMax.area ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="designWaterDepth" {...labelProps('Độ sâu khu nước theo thiết kế (m)')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.designWaterDepth ? 'error' : undefined} help={atMax.designWaterDepth ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="currentWaterDepth" {...labelProps('Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.currentWaterDepth ? 'error' : undefined} help={atMax.currentWaterDepth ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="bottomElevationDesign" {...labelProps('Cao độ đáy bến thiết kế')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.bottomElevationDesign ? 'error' : undefined} help={atMax.bottomElevationDesign ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="activeStormShelterCount" {...labelProps('Số lượng khu tránh, trú bão đang khai thác')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.activeStormShelterCount ? 'error' : undefined} help={atMax.activeStormShelterCount ? 'Đã đạt tối đa 5 ký tự' : undefined}>
            <InputNumber min={0} placeholder="0" maxLength={5} style={numberInputStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="publishedStormShelterCount" {...labelProps('Số lượng khu tránh, trú bão đã công bố')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.publishedStormShelterCount ? 'error' : undefined} help={atMax.publishedStormShelterCount ? 'Đã đạt tối đa 5 ký tự' : undefined}>
            <InputNumber min={0} placeholder="0" maxLength={5} style={numberInputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="underInvestmentStormShelterCount" {...labelProps('Số lượng khu tránh, trú bão đang được thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.underInvestmentStormShelterCount ? 'error' : undefined} help={atMax.underInvestmentStormShelterCount ? 'Đã đạt tối đa 5 ký tự' : undefined}>
            <InputNumber min={0} placeholder="0" maxLength={5} style={numberInputStyle} />
          </Form.Item>
        </Col>
      </Row>
      </div>)}
      {/* ── Toggle: Thông tin công bố mở, đưa vào sử dụng (gom vào tab Thông tin chung) ── */}
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setAnnouncementOpen(!announcementOpen)}>
        <span style={{ color: announcementOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{announcementOpen ? '▼' : '▶'} Thông tin công bố mở, đưa vào sử dụng</span>
      </button>
      {announcementOpen && (<div style={{ marginTop: spaceFormField }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="openingAnnouncementDate" {...labelProps('Thời điểm công bố mở, đưa ra sử dụng')} style={{ marginBottom: spaceFormField }}>
              <DatePicker placeholder="Chọn thời điểm..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="publicDecision" {...labelProps('Quyết định công bố/ Văn bản cho phép khai thác')} style={{ marginBottom: spaceFormField }}
              validateStatus={atMax.publicDecision ? 'error' : undefined} help={atMax.publicDecision ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
              <Input placeholder="Nhập quyết định công bố" maxLength={2000} style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="investmentAgreement" {...labelProps('Văn bản thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}
              validateStatus={atMax.investmentAgreement ? 'error' : undefined} help={atMax.investmentAgreement ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
              <Input placeholder="Nhập văn bản thỏa thuận" maxLength={2000} style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
          </Col>
        </Row>
      </div>)}

      {/* ── Toggle: Thông tin khu nước neo buộc tàu (gom vào tab Thông tin chung) ── */}
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setWaterAreaOpen(!waterAreaOpen)}>
        <span style={{ color: waterAreaOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{waterAreaOpen ? '▼' : '▶'} Thông tin khu nước neo buộc tàu</span>
      </button>
      {waterAreaOpen && (<div style={{ marginTop: spaceFormField }}>
        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={sectionLabelStyle}>Danh sách khu nước neo buộc tàu</span>
          {waterAreaList.length > 0 && (
            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={openAddWaterArea} style={{ borderRadius: radiusPill }}>Thêm mới</Button>
          )}
        </div>
        {waterAreaList.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
            <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có khu nước neo buộc tàu nào.</span>
            <Button type="dashed" icon={<PlusOutlined />} onClick={openAddWaterArea} style={{ borderRadius: radiusPill }}>Thêm mới</Button>
          </div>
        ) : (
          <PagedTable dataSource={waterAreaList.map((w, i) => ({ ...w, _idx: i }))} tableProps={{ scroll: { x: 600 } }}>
            <Table.Column title="Phạm vi khu nước neo buộc tàu" key="description"
              render={(_: any, record: any) => (
                <span style={{ fontSize: fontSizeMd, color: textPrimary, cursor: 'pointer' }} onClick={() => openEditWaterArea(record._idx)}>{record.description}</span>
              )}
              onHeaderCell={() => ({ style: headerCellStyle })} />
            <Table.Column title="Thao tác" key="actions" width={120} align="center"
              render={(_: any, record: any) => (
                <Space size={4}>
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditWaterArea(record._idx)} />
                  <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeWaterArea(record._idx)} />
                </Space>
              )}
              onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
          </PagedTable>
        )}
      </div>)}
    </div>) },
    // Tab 3: Thông tin vị trí (giống hệt Berth)
    { key: 'location', label: 'Thông tin vị trí', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn biểu tượng bản đồ" allowClear showSearch optionFilterProp="label" disabled={!watchedGeometryType} style={selectStyle}>
              {symbols.map(sym => (
                <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                  <Space>
                    {sym.image && <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                    <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} />
          </Form.Item>
        </Col>
      </Row>
      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><span style={sectionLabelStyle}>Tọa độ GPS</span></span>
        {coordinateList.length > 0 && <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!watchedGeometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>}
      </div>
      {coordinateList.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!watchedGeometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
        </div>
      ) : (
        <PagedTable dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
          tableProps={{ scroll: { x: 820 } }}
          errorText={gpsError ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>⚠</span><span>{gpsError}</span></span> : undefined}>
          <Table.Column title="Vĩ độ (N)" key="lat"
            render={(_: any, record: any) => renderDmsGroup(record.latitude, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s))}
            onHeaderCell={() => ({ style: headerCellStyle })} />
          <Table.Column title="Kinh độ (E)" key="lng"
            render={(_: any, record: any) => renderDmsGroup(record.longitude, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s))}
            onHeaderCell={() => ({ style: headerCellStyle })} />
          <Table.Column title="Thao tác" key="actions" width={120} align="center"
            render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeCoordinate(record._idx)} />}
            onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
        </PagedTable>
      )}
    </div>) },
    // Tab 5: File đính kèm
    { key: 'files', label: 'File đính kèm', children: (<div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={sectionLabelStyle}>File đính kèm</span>
        {uploadedFiles.length > 0 && (
          <Upload beforeUpload={handleBeforeUpload} showUploadList={false}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple>
            <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>Thêm file</Button>
          </Upload>
        )}
      </div>
      {uploadedFiles.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
          <Upload beforeUpload={handleBeforeUpload} showUploadList={false}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple>
            <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
          </Upload>
        </div>
      ) : (
        <Table className="list-view-table"
          dataSource={uploadedFiles.map((f, i) => ({ ...f, key: f.uid, _idx: i, name: f.name }))}
          pagination={false} size="middle" bordered scroll={{ x: 400 }}>
          <Table.Column title="STT" key="stt" width={60} align="center"
            render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
            onHeaderCell={() => ({ style: headerCellStyle })} />
          <Table.Column title="Tên file" key="name" dataIndex="name"
            render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>}
            onHeaderCell={() => ({ style: headerCellStyle })} />
          <Table.Column title="Thao tác" key="actions" width={120} align="center"
            render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => setUploadedFiles(uploadedFiles.filter(x => x.uid !== record.uid))} />}
            onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
        </Table>
      )}
      <div style={{ marginTop: spaceSm }}>
        <span style={uploadHintStyle}>Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.</span>
      </div>
    </div>) },
  ];

  useImperativeHandle(ref, () => ({ submit: (saveAction: SaveAction) => handleSave(saveAction) }), [handleSave]);

  return (
    <>
      <style>{`.storm-shelter-filter .ant-select-selector { border-radius: 999px !important; } .storm-shelter-filter .ant-select-content { flex-wrap: nowrap !important; overflow: hidden; } .storm-shelter-filter .ant-select-content-item { max-width: 45% !important; } .storm-shelter-filter .ant-select-selection-item { border-radius: 999px !important; }`}</style>
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }} items={tabItems} />

      <Drawer
        {...drawerProps}
        width={900}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editingWaterAreaIndex == null ? 'Thêm mới thông tin khu nước neo buộc tàu' : 'Chỉnh sửa thông tin khu nước neo buộc tàu'}</span>}
        open={waterAreaDrawerOpen}
        onClose={closeWaterAreaDrawer}
        destroyOnHidden
        push={false}
        extra={<Button type="text" onClick={closeWaterAreaDrawer} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button type="primary" onClick={saveWaterArea} loading={waterAreaSaving} style={primaryButtonStyle}>Lưu</Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '4px 24px 12px 24px' },
        }}
      >
        <Form layout="vertical">
          <Form.Item {...labelProps('Phạm vi khu nước neo buộc tàu')} required style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Nhập phạm vi khu nước neo buộc tàu" value={waterAreaDescription} onChange={(e) => setWaterAreaDescription(e.target.value)} style={inputStyle} />
          </Form.Item>

          <div style={{ marginBottom: spaceFormField, marginTop: 2 }}>
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>Vị trí cụ thể điểm neo</span>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} value={waterAreaGeometryType} onChange={(v) => setWaterAreaGeometryType(v)} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
                <Select ref={waterAreaSymbolSelectRef} placeholder="Tìm biểu tượng..." allowClear showSearch optionFilterProp="label" disabled={!waterAreaGeometryType} value={waterAreaMapSymbolId} onChange={(v) => { setWaterAreaMapSymbolId(v); waterAreaSymbolSelectRef.current?.blur(); }} style={selectStyle}>
                  {symbols.map(sym => (
                    <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                      <Space>
                        {sym.image && <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                        <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} value={waterAreaCoordinateSystem} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled value={waterAreaDisplayRule} style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={sectionLabelStyle}>Tọa độ điểm neo</span>
            {waterAreaAnchorPoints.length > 0 && (
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addAnchorPoint} style={{ borderRadius: radiusPill }}>Thêm điểm neo</Button>
            )}
          </div>

          {waterAreaAnchorPoints.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có điểm neo nào.</span>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addAnchorPoint} style={{ borderRadius: radiusPill }}>Thêm điểm neo</Button>
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'hidden' }}>
              <PagedTable dataSource={waterAreaAnchorPoints.map((p, i) => ({ ...p, _idx: i }))} tableProps={{ tableLayout: 'fixed' }}>
                <Table.Column title="Tên điểm neo" key="name" width={200}
                  render={(_: any, record: any) => (
                    <Input placeholder="Nhập tên điểm neo" value={record.name} onChange={(e) => updateAnchorPointName(record._idx, e.target.value)} style={inputStyle} />
                  )}
                  onHeaderCell={() => ({ style: headerCellStyle })} />
                <Table.Column title="Vĩ độ (N)" key="lat" width={200}
                  render={(_: any, record: any) => renderDmsGroup(record.latitude, 90, (d, m, s) => updateAnchorPointCoord(record._idx, 'lat', d, m, s))}
                  onHeaderCell={() => ({ style: headerCellStyle })} />
                <Table.Column title="Kinh độ (E)" key="lng" width={200}
                  render={(_: any, record: any) => renderDmsGroup(record.longitude, 180, (d, m, s) => updateAnchorPointCoord(record._idx, 'lng', d, m, s))}
                  onHeaderCell={() => ({ style: headerCellStyle })} />
                <Table.Column title="Thao tác" key="actions" width={120} align="center"
                  render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeAnchorPoint(record._idx)} />}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
              </PagedTable>
            </div>
          )}
        </Form>
      </Drawer>
    </>
  );
});
