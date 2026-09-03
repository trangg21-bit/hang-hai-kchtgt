import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Upload, Space, DatePicker, Table, Modal,
} from 'antd';
import type { UploadFile } from 'antd';
import { PlusOutlined, DeleteOutlined, FileOutlined, InboxOutlined, DownloadOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { colors, DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import {
  textPrimary, textTertiary, borderDefault, actionPrimary, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  radiusPill, radiusMd, spaceSm, spaceMd, spaceFormField,
  surfaceCard, readonlyInputStyle, sidebarBg,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerTabContentStyle, drawerFormScrollStyle,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import type { SaveAction } from '../../types/port';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService } from '../../services/organizationService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { buoyBerthCRUD, portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import { lineObjectService } from '../../services/lineObjectService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { LineObject } from '../../types/lineObject';
import type { Symbol as IconSymbol } from '../../services/symbolService';
import { useAuthStore } from '../../store/authStore';
import { GEOMETRY_POINT_COUNT } from '../../utils/gisGeometry';

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
  { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
  { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
];

export const BUOY_BERTH_CLASSIFICATION_OPTIONS = [
  { value: 'Cấp đặc biệt', label: 'Cấp đặc biệt' },
  { value: 'Cấp 1', label: 'Cấp 1' },
  { value: 'Cấp 2', label: 'Cấp 2' },
  { value: 'Cấp 3', label: 'Cấp 3' },
  { value: 'Cấp 4', label: 'Cấp 4' },
];

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' }, { value: 'LINE', label: 'Đối tượng đường' }, { value: 'POLYGON', label: 'Đối tượng vùng' },
];
const COORD_SYS_OPTIONS = [{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }];
// Số lượng tọa độ mặc định tương ứng với từng loại đối tượng: điểm → 1, đường → 2, vùng → 3


const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length-1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
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

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px). */
const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  return (
    <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
      <InputNumber value={dVal} min={0} max={maxDeg} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(v, mVal ?? null, sVal ?? null)} style={{ flex: 1, minWidth: 0, borderRadius: '999px 0 0 999px', height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>°</span>
      <InputNumber value={mVal} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal ?? null, v, sVal ?? null)} style={{ flex: 1, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>'</span>
      <InputNumber value={sVal} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal ?? null, mVal ?? null, v)} style={{ flex: 1.2, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitEndStyle}>"</span>
    </Space.Compact>
  );
};

export interface BuoyBerthFormFields {
  orgUnitId?: string;
  portId?: string;
  buoyBerthCode?: string;
  buoyBerthName?: string;
  waterwayId?: string;
  provinceId?: number;
  detailedLocation?: string;
  classification?: string;
  operationalStatus?: string;
  operatingOrgId?: string;
  currentWaterDepth?: number;
  bottomElevationDesign?: number;
  maxVesselDWT?: number;
  plannedVesselDWT?: number;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  operationExpiryDate?: string;
  designCapacity?: number;
  activeBuoyBerthCount?: number;
  publishedBuoyBerthCount?: number;
  underInvestmentBuoyBerthCount?: number;
  cargoThroughput?: number;
  openingAnnouncementDate?: string;
  publicDecision?: string;
  investmentAgreement?: string;
  mooringWaterAreaScope?: string;
  coordinates?: Array<{ latitude: number; longitude: number }>;
  geometryType?: string;
  coordinateSystem?: number;
  displayRule?: string;
  mapSymbolId?: string;
}

export interface BuoyBerthFormProps {
  form: any;
  id?: string;
  onFinish: (saved: boolean) => void;
  /** Báo trạng thái đang lưu cho nút submit bên ngoài (hiển thị loading tròn trên nút được bấm) */
  onSubmittingChange?: (submitting: boolean) => void;
}

export default forwardRef(function BuoyBerthForm({ form, id, onFinish, onSubmittingChange }: BuoyBerthFormProps, ref) {
  const isEdit = !!id;
  const [, setSubmitting] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [mooringScopeOpen, setMooringScopeOpen] = useState(true);
  const [technicalOpen, setTechnicalOpen] = useState(true);
  const [buoyBerthCodeLoading, setBuoyBerthCodeLoading] = useState(false);
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
    buoyBerthName: useMaxReached('buoyBerthName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    publicDecision: useMaxReached('publicDecision', 2000),
    investmentAgreement: useMaxReached('investmentAgreement', 2000),
    mooringWaterAreaScope: useMaxReached('mooringWaterAreaScope', 2000),
    currentWaterDepth: useMaxReached('currentWaterDepth', 20),
    bottomElevationDesign: useMaxReached('bottomElevationDesign', 20),
    maxVesselDWT: useMaxReached('maxVesselDWT', 20),
    plannedVesselDWT: useMaxReached('plannedVesselDWT', 20),
    designCapacity: useMaxReached('designCapacity', 20),
    activeBuoyBerthCount: useMaxReached('activeBuoyBerthCount', 20),
    publishedBuoyBerthCount: useMaxReached('publishedBuoyBerthCount', 20),
    underInvestmentBuoyBerthCount: useMaxReached('underInvestmentBuoyBerthCount', 20),
    cargoThroughput: useMaxReached('cargoThroughput', 20),
  };

  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [portOptions, setPortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [waterwayOptions, setWaterwayOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [symbols, setSymbols] = useState<IconSymbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [gpsPage, setGpsPage] = useState(1);
  const [filePage, setFilePage] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [, setExistingFiles] = useState<any[]>([]);

  useEffect(() => { symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => setSymbols(r.data || [])).catch(() => {}); }, []);
  useEffect(() => { setLoadingOrgs(true); organizationService.list({ pageSize: 1000 }).then(r => setOrgUnits(r.data || [])).catch(() => {}).finally(() => setLoadingOrgs(false)); }, []);
  useEffect(() => { lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize: 1000 }).then(r => setWaterwayOptions((r.data || []).map((l: any) => ({ value: l.id, label: l.name || l.code })))).catch(() => {}); }, []);
  useEffect(() => { api.get('/common/options/operating-units').then(r => { const list = r.data?.data; if (Array.isArray(list) && list.length) setOperatingOrgs(list); }).catch(() => {}); }, []);

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

  useEffect(() => { if (watchedOrgUnitId) { if (!isEdit || !form.getFieldValue('portId')) form.setFieldsValue({ portId: undefined, buoyBerthCode: undefined }); loadPortOptions(watchedOrgUnitId); } }, [watchedOrgUnitId]);

  useEffect(() => {
    if (!watchedPortId || (isEdit && editPortIdRef.current === watchedPortId)) return;
    setBuoyBerthCodeLoading(true);
    buoyBerthCRUD.generateCode(watchedPortId)
      .then((res: any) => { if (res?.buoyBerthCode) form.setFieldsValue({ buoyBerthCode: res.buoyBerthCode }); })
      .catch(() => {})
      .finally(() => setBuoyBerthCodeLoading(false));
  }, [watchedPortId]);

  useEffect(() => { if (!isSystemAdmin && !isEdit) { api.get('/users/me').then(r => { const p = r.data?.data ?? r.data; if (p?.orgUnitId) form.setFieldsValue({ orgUnitId: p.orgUnitId }); }).catch(() => {}); } }, []);

  // Khi chọn loại đối tượng → tự set hệ quy chiếu, quy tắc hiển thị và thêm sẵn số dòng tọa độ tương ứng
  // (GIỮ tọa độ đã nhập/chọn, chỉ thêm dòng trống cho đủ số lượng — không xóa dữ liệu cũ)
  useEffect(() => {
    if (!watchedGeometryType) return;
    form.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
    setCoordinateList((prev) => {
      if (!prev || prev.length >= count) return prev;
      const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      return [...prev, ...added];
    });
  }, [watchedGeometryType]);

  // Edit mode: load existing
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data: any = await buoyBerthCRUD.findById(id);
        const ec = data.coordinates ? parseGisCoordinates({ geometryType: data.geometryType, coordinates: data.coordinates }) : [];
        setCoordinateList(ec.length > 0 ? ec.map(c => {
          const latDms = ddToDms(c.latitude);
          const lngDms = ddToDms(c.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        }) : data.latitude != null ? (() => { const latDms = ddToDms(Number(data.latitude)); const lngDms = ddToDms(Number(data.longitude)); return [{ latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s }]; })() : []);
        if (data.orgUnitId) await loadPortOptions(data.orgUnitId);
        try {
          const fr = await api.get(`/v1/buoy-berth/${id}/attachments`, { params: { page: 0, size: 50 } });
          const files = fr.data?.data || [];
          setExistingFiles(files);
          setUploadedFiles(files.map((a: any) => ({ uid: a.id, name: a.fileName || a.name, size: a.fileSize, status: 'done' as const })));
        } catch { setExistingFiles([]); }
        editPortIdRef.current = data.portId;
        form.setFieldsValue({
          orgUnitId: data.orgUnitId, portId: data.portId,
          buoyBerthCode: data.buoyBerthCode, buoyBerthName: data.buoyBerthName,
          waterwayId: data.waterwayId, operatingOrgId: data.operatingOrgId, classification: data.classification,
          provinceId: data.provinceId ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined : undefined,
          detailedLocation: data.detailedLocation,
          operationalStatus: data.operationalStatus || undefined,
          currentWaterDepth: data.currentWaterDepth, bottomElevationDesign: data.bottomElevationDesign,
          maxVesselDWT: data.maxVesselDWT, plannedVesselDWT: data.plannedVesselDWT,
          lastInspectionDate: data.lastInspectionDate ? dayjs(data.lastInspectionDate) : undefined,
          nextInspectionDate: data.nextInspectionDate ? dayjs(data.nextInspectionDate) : undefined,
          operationExpiryDate: data.operationExpiryDate ? dayjs(data.operationExpiryDate) : undefined,
          designCapacity: data.designCapacity,
          activeBuoyBerthCount: data.activeBuoyBerthCount, publishedBuoyBerthCount: data.publishedBuoyBerthCount,
          underInvestmentBuoyBerthCount: data.underInvestmentBuoyBerthCount, cargoThroughput: data.cargoThroughput,
          openingAnnouncementDate: data.openingAnnouncementDate ? dayjs(data.openingAnnouncementDate) : undefined,
          publicDecision: data.publicDecision, investmentAgreement: data.investmentAgreement,
          mooringWaterAreaScope: data.mooringWaterAreaScope,
          geometryType: data.geometryType || undefined, mapSymbolId: data.mapSymbolId, coordinateSystem: data.coordinateSystem, displayRule: data.displayRule,
        });
      } catch { toast.error('Không thể tải thông tin bến phao'); }
    })();
  }, [isEdit, id]);

  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    setUploadedFiles(p => [...p, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file as any }]);
    return false;
  };

  const removeCoordinate = (i: number) => { setCoordinateList(p => p.filter((_, idx) => idx !== i)); setGpsError(null); };
  const addGpsPoint = () => { setCoordinateList(p => [...p, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]); setGpsError(null); };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setCoordinateList(p => { const n = [...p]; n[i] = {
      ...n[i],
      [field === 'lat' ? 'latD' : 'lngD']: dVal,
      [field === 'lat' ? 'latM' : 'lngM']: mVal,
      [field === 'lat' ? 'latS' : 'lngS']: sVal,
    }; return n; });
    setGpsError(null);
  };

  const handleOrgUnitChange = () => { form.setFieldsValue({ portId: undefined, buoyBerthCode: undefined }); setCoordinateList([]); };

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    const values = form.getFieldsValue();
    try { await form.validateFields(); } catch (e: any) {
      const errFields: Array<{ name: Array<string | number> }> = e?.errorFields ?? [];
      if (errFields.some((f) => f.name[0] === 'orgUnitId' || f.name[0] === 'portId' || f.name[0] === 'buoyBerthName' || f.name[0] === 'operatingOrgId')) setActiveTabKey('general');
      else if (errFields.some((f) => f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule' || f.name[0] === 'geometryType')) setActiveTabKey('location');
      return false;
    }
    const manualCoords = coordinateList
      .filter(c => (c.latD != null && c.lngD != null) || (c.latM != null && c.lngM != null) || (c.latS != null && c.lngS != null))
      .map(c => ({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 }));
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
      const toNumber = (v: unknown): number | undefined => (v != null && !isNaN(Number(v)) ? Number(v) : undefined);
      const toDateString = (v: unknown, fmt: string): string | undefined => (v ? (typeof v === 'string' ? v : (v as dayjs.Dayjs).format(fmt)) : undefined);
      const payload: Record<string, unknown> = {
        orgUnitId: values.orgUnitId, portId: values.portId,
        buoyBerthCode: String(values.buoyBerthCode || '').trim() || undefined, buoyBerthName: String(values.buoyBerthName || '').trim(),
        waterwayId: values.waterwayId || undefined, operatingOrgId: values.operatingOrgId || undefined, classification: values.classification || undefined,
        provinceId: values.provinceId ? VIETNAM_PROVINCES.indexOf(values.provinceId) + 1 : undefined,
        detailedLocation: values.detailedLocation || undefined,
        operationalStatus: values.operationalStatus || undefined,
        currentWaterDepth: toNumber(values.currentWaterDepth),
        bottomElevationDesign: toNumber(values.bottomElevationDesign),
        maxVesselDWT: toNumber(values.maxVesselDWT),
        plannedVesselDWT: toNumber(values.plannedVesselDWT),
        lastInspectionDate: toDateString(values.lastInspectionDate, 'YYYY-MM-DD'),
        nextInspectionDate: toDateString(values.nextInspectionDate, 'YYYY-MM-DD'),
        operationExpiryDate: toDateString(values.operationExpiryDate, 'YYYY-MM-DD'),
        designCapacity: toNumber(values.designCapacity),
        activeBuoyBerthCount: toNumber(values.activeBuoyBerthCount),
        publishedBuoyBerthCount: toNumber(values.publishedBuoyBerthCount),
        underInvestmentBuoyBerthCount: toNumber(values.underInvestmentBuoyBerthCount),
        cargoThroughput: toNumber(values.cargoThroughput),
        openingAnnouncementDate: values.openingAnnouncementDate ? (typeof values.openingAnnouncementDate === 'string' ? values.openingAnnouncementDate : values.openingAnnouncementDate.format('YYYY-MM-DD') + 'T00:00:00') : undefined,
        publicDecision: values.publicDecision || undefined, investmentAgreement: values.investmentAgreement || undefined,
        mooringWaterAreaScope: values.mooringWaterAreaScope || undefined,
        latitude: manualCoords.length > 0 ? manualCoords[0].latitude : undefined,
        longitude: manualCoords.length > 0 ? manualCoords[0].longitude : undefined,
        coordinates: (() => {
          if (manualCoords.length === 0) return undefined;
          if (manualCoords.length === 1) return `POINT(${manualCoords[0].longitude} ${manualCoords[0].latitude})`;
          const geom = values.geometryType;
          if (geom === 'LINE') return `LINESTRING(${manualCoords.map(c => `${c.longitude} ${c.latitude}`).join(',')})`;
          if (geom === 'POLYGON') return `POLYGON((${[...manualCoords, manualCoords[0]].map(c => `${c.longitude} ${c.latitude}`).join(',')}))`;
          return `MULTIPOINT(${manualCoords.map(c => `(${c.longitude} ${c.latitude})`).join(',')})`;
        })(),
        geometryType: values.geometryType || undefined, mapSymbolId: values.mapSymbolId || undefined,
        coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null ? Number(values.displayRule) : undefined,
      };
      if (saveAction !== 'UPDATE') (payload as any).saveAction = saveAction;
      Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
      let createdBuoyBerthId: string | undefined;
      if (isEdit && id) { await buoyBerthCRUD.update({ ...payload, id } as any); createdBuoyBerthId = id; }
      else { const res: any = await buoyBerthCRUD.create(payload as any); createdBuoyBerthId = res?.id ?? res?.data?.id; }
      if (createdBuoyBerthId && uploadedFiles.length > 0) {
        for (const fi of uploadedFiles) {
          const of = fi.originFileObj as File;
          if (!of) continue;
          const fd = new FormData();
          fd.append('files', of);
          await api.post(`/v1/buoy-berth/${createdBuoyBerthId}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
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
  }, [form, isEdit, id, onFinish, onSubmittingChange, coordinateList, uploadedFiles]);

  const tabItems = [
    // Tab 1: Thông tin chung
    { key: 'general', label: 'Thông tin chung', children: (<div style={drawerFormScrollStyle}>
      <Row gutter={[24, 0]}>
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
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name="operatingOrgId" {...labelProps('Đơn vị khai thác')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị khai thác không được để trống' }]}>
            <Select placeholder="Chọn đơn vị khai thác..." options={operatingOrgs.map(o => ({ value: o.id, label: o.name }))} showSearch optionFilterProp="label" allowClear style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="waterwayId" {...labelProps('Thuộc luồng hàng hải')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn luồng hàng hải..." options={waterwayOptions} showSearch allowClear optionFilterProp="label" style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name="buoyBerthCode" {...labelProps('Mã bến phao')} style={{ marginBottom: spaceFormField }}>
            <Input disabled placeholder={buoyBerthCodeLoading ? 'Đang sinh mã...' : watchedPortId ? 'Mã tự sinh (tự động theo mã cảng biển)' : 'Chọn Cảng biển để sinh mã'} style={readonlyInputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="buoyBerthName" {...labelProps('Tên bến phao')} style={{ marginBottom: spaceFormField }}
            rules={[{ required: true, message: 'Tên bến phao không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]}
            validateStatus={atMax.buoyBerthName ? 'error' : undefined} help={atMax.buoyBerthName ? 'Đã đạt tối đa 255 ký tự' : undefined}>
            <Input placeholder="Nhập tên bến phao" maxLength={255} showCount style={inputStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) không được để trống' }]}>
            <Select placeholder="Chọn địa điểm" showSearch optionFilterProp="label"
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.detailedLocation ? 'error' : undefined} help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}>
            <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name="classification" {...labelProps('Phân cấp công trình')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn phân cấp công trình" options={BUOY_BERTH_CLASSIFICATION_OPTIONS} showSearch allowClear optionFilterProp="label" style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="operationalStatus" {...labelProps('Tình trạng')} required style={{ marginBottom: spaceFormField }} initialValue="OPERATIONAL" rules={[{ required: true, message: 'Tình trạng không được để trống' }]}>
            <Select placeholder="Chọn tình trạng" options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, marginBottom: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setTechnicalOpen(!technicalOpen)}>
        <span style={{ color: technicalOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{technicalOpen ? '▼' : '▶'} Thông tin kỹ thuật & đăng kiểm</span>
      </button>
      {technicalOpen && (<div>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name="currentWaterDepth" {...labelProps('Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.currentWaterDepth ? 'error' : undefined} help={atMax.currentWaterDepth ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="bottomElevationDesign" {...labelProps('Cao độ đáy bến thiết kế')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.bottomElevationDesign ? 'error' : undefined} help={atMax.bottomElevationDesign ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name="maxVesselDWT" {...labelProps('Cỡ tàu khai thác theo công bố (DWT)')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.maxVesselDWT ? 'error' : undefined} help={atMax.maxVesselDWT ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} placeholder="0" maxLength={20} style={numberInputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="plannedVesselDWT" {...labelProps('Cỡ tàu khai thác theo quy hoạch')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.plannedVesselDWT ? 'error' : undefined} help={atMax.plannedVesselDWT ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} placeholder="0" maxLength={20} style={numberInputStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name="lastInspectionDate" {...labelProps('Thời điểm đã đăng kiểm gần nhất')} style={{ marginBottom: spaceFormField }}>
            <DatePicker picker="month" placeholder="Chọn tháng/năm..." format="MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="nextInspectionDate" {...labelProps('Thời điểm đăng kiểm tiếp theo')} style={{ marginBottom: spaceFormField }}>
            <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name="operationExpiryDate" {...labelProps('Thời hạn khai thác')} style={{ marginBottom: spaceFormField }}>
            <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="designCapacity" {...labelProps('Năng lực thông qua thiết kế')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.designCapacity ? 'error' : undefined} help={atMax.designCapacity ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name="activeBuoyBerthCount" {...labelProps('Số lượng bến phao đang khai thác')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.activeBuoyBerthCount ? 'error' : undefined} help={atMax.activeBuoyBerthCount ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} placeholder="0" maxLength={20} style={numberInputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="publishedBuoyBerthCount" {...labelProps('Số lượng bến phao đã công bố')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.publishedBuoyBerthCount ? 'error' : undefined} help={atMax.publishedBuoyBerthCount ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} placeholder="0" maxLength={20} style={numberInputStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name="underInvestmentBuoyBerthCount" {...labelProps('Số lượng bến phao đang được thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.underInvestmentBuoyBerthCount ? 'error' : undefined} help={atMax.underInvestmentBuoyBerthCount ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} placeholder="0" maxLength={20} style={numberInputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="cargoThroughput" {...labelProps('Sản lượng hàng thông qua')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Sản lượng hàng thông qua không được để trống' }]}
            validateStatus={atMax.cargoThroughput ? 'error' : undefined} help={atMax.cargoThroughput ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
          </Form.Item>
        </Col>
      </Row>
      </div>)}
      {/* ── Toggle: Thông tin công bố mở, đưa vào sử dụng (gom vào tab Thông tin chung) ── */}
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setAnnouncementOpen(!announcementOpen)}>
        <span style={{ color: announcementOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{announcementOpen ? '▼' : '▶'} Thông tin công bố mở, đưa vào sử dụng</span>
      </button>
      {announcementOpen && (<div style={{ marginTop: spaceFormField }}>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item name="openingAnnouncementDate" {...labelProps('Thời điểm công bố mở, đưa ra sử dụng')} style={{ marginBottom: spaceFormField }}>
              <DatePicker placeholder="Chọn thời điểm..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="publicDecision" {...labelProps('Quyết định công bố/ Văn bản cho phép khai thác')} style={{ marginBottom: spaceFormField }}
              validateStatus={atMax.publicDecision ? 'error' : undefined} help={atMax.publicDecision ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
              <Input placeholder="Nhập quyết định công bố" maxLength={2000} showCount style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item name="investmentAgreement" {...labelProps('Văn bản thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}
              validateStatus={atMax.investmentAgreement ? 'error' : undefined} help={atMax.investmentAgreement ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
              <Input placeholder="Nhập văn bản thỏa thuận" maxLength={2000} showCount style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>
      </div>)}

      {/* ── Toggle: Thông tin phạm vi khu nước neo buộc tàu (gom vào tab Thông tin chung) ── */}
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setMooringScopeOpen(!mooringScopeOpen)}>
        <span style={{ color: mooringScopeOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{mooringScopeOpen ? '▼' : '▶'} Thông tin phạm vi khu nước neo buộc tàu</span>
      </button>
      {mooringScopeOpen && (<div style={{ marginTop: spaceFormField }}>
        <Form.Item name="mooringWaterAreaScope" {...labelProps('Phạm vi khu nước neo buộc tàu')} style={{ marginBottom: spaceFormField }}
          validateStatus={atMax.mooringWaterAreaScope ? 'error' : undefined} help={atMax.mooringWaterAreaScope ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
          <Input.TextArea rows={3} maxLength={2000} showCount placeholder="Nhập phạm vi khu nước neo buộc tàu" style={{ borderRadius: radiusPill, height: 'auto' }} />
        </Form.Item>
      </div>)}
    </div>) },
    // Tab 3: Thông tin vị trí (giống hệt Berth)
    { key: 'location', label: 'Thông tin vị trí', children: (<div style={drawerFormScrollStyle}>
      <Row gutter={[24, 0]}>
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
      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
        <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
          Tọa độ GPS ({coordinateList.length})
        </span>
        <Space size={8}>
          <Button
            icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
            onClick={() => setGisModalOpen(true)}
            disabled={!watchedGeometryType}
            style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Chọn tọa độ trên bản đồ
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addGpsPoint}
            disabled={!watchedGeometryType}
            style={{ ...primaryButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Thêm tọa độ
          </Button>
        </Space>
      </div>
      {coordinateList.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!watchedGeometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
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
          rowKey={(r: any, idx?: number) => r._idx ?? String(idx)}
          emptyText="Chưa có tọa độ GPS nào"
          columns={[
            {
              title: 'STT',
              width: 60,
              align: 'center' as const,
              render: (_v: any, _r: any, idx: number) => (gpsPage - 1) * 10 + idx + 1,
            },
            {
              title: 'Vĩ độ (Latitude - N)',
              key: 'lat',
              render: (_v: any, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
            },
            {
              title: 'Kinh độ (Longitude - E)',
              key: 'lng',
              render: (_v: any, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
            },
            {
              title: '',
              width: 50,
              align: 'center' as const,
              render: (_v: any, record: any) => (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeCoordinate(record._idx)} />
              ),
            },
          ]}
        />
        </>
      )}
    </div>) },
    // Tab 5: File đính kèm
    { key: 'files', label: 'File đính kèm', children: (<div style={drawerFormScrollStyle}>
      <div style={{ marginBottom: spaceMd }}>
        <Upload.Dragger
          beforeUpload={handleBeforeUpload}
          showUploadList={false}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
          multiple
          style={{ background: '#fafbfc', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, padding: '24px 16px' }}
        >
          <p style={{ marginBottom: 8 }}>
            <InboxOutlined style={{ fontSize: 44, color: actionPrimary }} />
          </p>
          <p style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: textPrimary, marginBottom: 4 }}>
            Kéo thả tệp vào đây hoặc nhấp để chọn tệp tải lên
          </p>
          <p style={{ fontSize: fontSizeSm, color: textTertiary, margin: 0 }}>
            Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Mỗi file ≤ 20MB.
          </p>
        </Upload.Dragger>
      </div>
      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
        <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
          Danh sách tệp đính kèm ({uploadedFiles.length})
        </span>
      </div>
      <Table
        size="small"
        pagination={uploadedFiles.length > 10 ? {
          current: filePage,
          pageSize: 10,
          total: uploadedFiles.length,
          onChange: (p) => setFilePage(p),
          showSizeChanger: false,
          size: 'small',
        } : false}
        dataSource={uploadedFiles.map((f, i) => ({ ...f, key: f.uid, _idx: i, name: f.name }))}
        rowKey={(r) => r.uid || r._idx}
        locale={{ emptyText: 'Chưa có tài liệu đính kèm nào' }}
        scroll={{ x: 720 }}
        columns={[
          {
            title: 'STT',
            width: 60,
            align: 'center',
            render: (_v, _r, idx) => (filePage - 1) * 10 + idx + 1,
          },
          {
            title: 'Tên tài liệu',
            key: 'name',
            dataIndex: 'name',
            render: (name: string) => (
              <a
                onClick={() => toast.info(`Đang tải xuống tệp: ${name}`)}
                style={{ fontSize: fontSizeMd, color: actionPrimary, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: fontWeightMedium, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
              >
                <FileOutlined />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              </a>
            ),
          },
          {
            title: 'Dung lượng',
            key: 'size',
            width: 120,
            align: 'right' as const,
            render: (_v, rec: any) => rec.size ? (rec.size > 1024 * 1024 ? `${(rec.size / (1024 * 1024)).toFixed(2)} MB` : `${(rec.size / 1024).toFixed(1)} KB`) : '—',
          },
          {
            title: 'Người tải lên',
            key: 'uploadedBy',
            width: 180,
            render: () => currentUser?.fullName || currentUser?.username || '—',
          },
          {
            title: 'Ngày tải lên',
            key: 'uploadedDate',
            width: 160,
            align: 'center' as const,
            render: (_v, rec: any) => rec.uploadedDate ? dayjs(rec.uploadedDate).format('DD/MM/YYYY HH:mm') : '—',
          },
          {
            title: '',
            key: 'actions',
            width: 80,
            align: 'center',
            render: (_v, record: any) => (
              <Space size={4}>
                <Button type="text" icon={<DownloadOutlined style={{ color: actionPrimary }} />} onClick={() => toast.info(`Đang tải xuống tệp: ${record.name}`)} />
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setUploadedFiles(uploadedFiles.filter(x => x.uid !== record.uid))} />
              </Space>
            ),
          },
        ]}
      />
    </div>) },
  ];

  useImperativeHandle(ref, () => ({ submit: (saveAction: SaveAction) => handleSave(saveAction) }), [handleSave]);

  return (
    <>
      <style>{`.buoy-berth-filter .ant-select-selector { border-radius: 999px !important; } .buoy-berth-filter .ant-select-content { flex-wrap: nowrap !important; overflow: hidden; } .buoy-berth-filter .ant-select-content-item { max-width: 45% !important; } .buoy-berth-filter .ant-select-selection-item { border-radius: 999px !important; }`}</style>
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={drawerTabBarStyle} items={tabItems} />

      {/* GIS Location Selector Modal — chọn tọa độ trên bản đồ chuyên dụng (chuẩn VTS CHK) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: sidebarBg, fontSize: fontSizeLg }}>
              Chọn vị trí & tọa độ trên bản đồ chuyên dụng
            </span>
          </div>
        }
        open={gisModalOpen}
        onCancel={() => setGisModalOpen(false)}
        destroyOnClose
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button key="cancel" onClick={() => setGisModalOpen(false)} style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}>
            Hủy
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => setGisModalOpen(false)}
            style={{ ...primaryButtonStyle, height: 36 }}
          >
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType="POINT"
            height={520}
            onChange={(val) => {
              if (val?.coordinates) {
                // Nhận mọi dạng WKT (POINT/MULTIPOINT/LINESTRING/POLYGON) — chọn NHIỀU tọa độ trên bản đồ
                const points = parseGisCoordinates({ geometryType: val.geometryType, coordinates: val.coordinates });
                if (points.length > 0) {
                  setCoordinateList((prev) => {
                    const existing = prev || [];
                    const key = (p: { latitude: number; longitude: number }) => `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                    const existingKeys = new Set(existing
                      .filter(c => c.latD != null && c.lngD != null)
                      .map(c => key({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 })));
                    const toAdd = points.filter(p => !existingKeys.has(key(p))).map(p => {
                      const latDms = ddToDms(p.latitude);
                      const lngDms = ddToDms(p.longitude);
                      return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
                    });
                    if (toAdd.length === 0) return existing;
                    return [...existing, ...toAdd];
                  });
                  setGpsError(null);
                }
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
});
