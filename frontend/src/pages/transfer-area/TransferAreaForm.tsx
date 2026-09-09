import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Space, DatePicker, Table, Drawer, Modal,
  type InputNumberProps,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SlidersOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CompassOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { DRAWER_TABLE_SCROLL_Y, getDatePickerProps } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import {
  textSecondary, textTertiary, borderDefault, actionPrimary, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField,
  surfaceCard, readonlyInputStyle, sidebarBg, textAreaStyle,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import type { SaveAction } from '../../types/port';
import toast from '../../components/ToastNotification';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { transferAreaCRUD, portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as IconSymbol } from '../../services/symbolService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { validateDmsCoordinates, serializeCoordinatesToWkt } from '../../utils/gisGeometry';

const labelProps = (text: string) => ({
  label: <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const portFormFontSizeMd = 13.5;
const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: radiusMd,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};
const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spaceFormField,
  paddingBottom: spaceSm,
  borderBottom: '1px solid #f1f5f9',
};
const sectionTitleStyle: React.CSSProperties = {
  color: sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: portFormFontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: spaceSm,
};
const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

type NumberInputWithCountProps = InputNumberProps<number> & { maxLength: number };

function NumberInputWithCount({ maxLength, value, ...inputProps }: NumberInputWithCountProps) {
  const count = String(value ?? '').length;
  return (
    <InputNumber
      {...inputProps}
      value={value}
      maxLength={maxLength}
      suffix={<span aria-label={`${count} trên ${maxLength} ký tự`} style={{ color: textSecondary, fontSize: portFormFontSizeMd }}>{count}/{maxLength}</span>}
    />
  );
}

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
  { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
  { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
];

const OPERATIONAL_FUNCTIONS_OPTIONS = [
  { value: 'CONTAINER', label: 'Hàng Container' },
  { value: 'GENERAL_CARGO', label: 'Hàng tổng hợp (Bách hóa)' },
  { value: 'BULK_CARGO', label: 'Hàng chuyên dụng hàng rời, quặng' },
  { value: 'OIL_GAS', label: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng' },
  { value: 'OTHER', label: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu...)' },
  { value: 'PASSENGER', label: 'Hành khách' },
];

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];
const COORD_SYS_OPTIONS = [{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }];

interface DmsPoint {
  latD: number | null; latM: number | null; latS: number | null;
  lngD: number | null; lngM: number | null; lngS: number | null;
}
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };
const emptyDmsPoint = (): DmsPoint => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null });

const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) {
      const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/);
      if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    }
    if (wkt.startsWith('POLYGON((')) {
      const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/);
      if (m) {
        const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
        if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude) pts.pop();
        return pts;
      }
    }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/);
    if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/);
    if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch {}
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

const decimalToDmsPoint = (latitude: number | null | undefined, longitude: number | null | undefined): DmsPoint => {
  const la = ddToDms(latitude ?? null);
  const lo = ddToDms(longitude ?? null);
  return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
};

const dmsPointToDecimal = (c: DmsPoint): { latitude: number; longitude: number } => ({
  latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
  longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
});

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null | undefined, m: number | null | undefined, s: number | null | undefined) => void,
) => {
  const started = dVal != null || mVal != null || sVal != null;

  const inputs: Array<{
    key: 'd' | 'm' | 's';
    base: string;
    value: number | null | undefined;
    max: number;
    radius: string;
    unit: string;
    unitStyle: React.CSSProperties;
    basis: string;
    width: number;
    step: number;
    formatter?: (value: any) => string;
    msg?: string;
    onEdit: (v: number | null) => void;
  }> = [
    {
      key: 'd', base: 'Độ', value: dVal, max: maxDeg,
      radius: '999px 0 0 999px', unit: '°', unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1,
      msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm', base: 'Phút', value: mVal, max: 59,
      radius: '0', unit: '\'', unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1,
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
  ];

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

  const errorRow = (
    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', minWidth: 0, minHeight: 14, marginTop: 2 }}>
      {inputs.map((inp) => (
        <div key={`err-${inp.key}`} style={{ flex: inp.basis, minWidth: 0, width: inp.width, paddingLeft: 2 }}>
          {inp.msg ? <span style={{ color: statusCritical, fontSize: 11, lineHeight: '12px', display: 'block' }}>{inp.msg}</span> : null}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
      {inputRow}
      {errorRow}
    </div>
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

export interface TransferAreaFormProps {
  form: any;
  id?: string;
  onFinish: (saved: boolean) => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export default forwardRef(function TransferAreaForm({ form, id, onFinish, onSubmittingChange }: TransferAreaFormProps, ref) {
  const isEdit = !!id;
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [transferAreaCodeLoading, setTransferAreaCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const editPortIdRef = useRef<string | undefined>(undefined);

  const watchedGeometryType = Form.useWatch('geometryType', form);
  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);

  const useMaxReached = (name: string, max: number): boolean => {
    const raw = Form.useWatch(name, form) ?? '';
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };

  const atMax = {
    transferAreaName: useMaxReached('transferAreaName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    shapeDescription: useMaxReached('shapeDescription', 255),
    area: useMaxReached('area', 20),
    designWaterDepth: useMaxReached('designWaterDepth', 20),
    currentWaterDepth: useMaxReached('currentWaterDepth', 20),
    bottomElevationDesign: useMaxReached('bottomElevationDesign', 20),
    maxVesselDWT: useMaxReached('maxVesselDWT', 20),
    activeTransferCount: useMaxReached('activeTransferCount', 5),
    publishedTransferCount: useMaxReached('publishedTransferCount', 5),
    underInvestmentTransferCount: useMaxReached('underInvestmentTransferCount', 5),
    publicDecision: useMaxReached('publicDecision', 2000),
    investmentAgreement: useMaxReached('investmentAgreement', 2000),
  };

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [portOptions, setPortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [symbols, setSymbols] = useState<IconSymbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<DmsPoint[]>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [indicatorOpen, setIndicatorOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(true);
  const [mooringScopeOpen, setMooringScopeOpen] = useState(true);
  const [waterAreaList, setWaterAreaList] = useState<MooringWaterAreaField[]>([]);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  // ── Drawer "Thông tin khu nước neo buộc tàu" ──
  const [waterAreaDrawerOpen, setWaterAreaDrawerOpen] = useState(false);
  const [editingWaterAreaIndex, setEditingWaterAreaIndex] = useState<number | null>(null);
  const [waterAreaDescription, setWaterAreaDescription] = useState('');
  const [waterAreaGeometryType, setWaterAreaGeometryType] = useState<string | undefined>(undefined);
  const [waterAreaMapSymbolId, setWaterAreaMapSymbolId] = useState<string | undefined>(undefined);
  const [waterAreaCoordinateSystem, setWaterAreaCoordinateSystem] = useState<number | undefined>(undefined);
  const [waterAreaDisplayRule, setWaterAreaDisplayRule] = useState<string | undefined>(undefined);
  const [waterAreaAnchorPoints, setWaterAreaAnchorPoints] = useState<Array<{ name: string } & DmsPoint>>([]);
  const [waterAreaSaving, setWaterAreaSaving] = useState(false);
  const waterAreaSymbolSelectRef = useRef<any>(null);

  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' })
      .then(r => setSymbols(r.data || []))
      .catch(() => {});
    organizationService.list({ pageSize: 1000 })
      .then(r => setOrganizations(r.data || []))
      .catch(() => {});
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => map.set(u.id, u.fullName || u.username || u.id));
        setUserMap(map);
      } catch { /* silent */ }
    })();
  }, []);

  const loadPortOptions = async (orgUnitId: string) => {
    try {
      const params: any = { page: 1, pageSize: 1000, approvalStatus: 'APPROVED' };
      if (orgUnitId) params.orgUnitId = orgUnitId;
      const r = await portCRUD.search(params);
      const ports = (r.data || []).map((p: any) => ({ value: p.id, label: p.portName || p.name || p.id }));
      setPortOptions(ports);
      if (ports.length === 0) toast.warning('Đơn vị quản lý chưa có cảng biển được phê duyệt');
    } catch {
      setPortOptions([]);
    }
  };

  useEffect(() => {
    if (watchedOrgUnitId) {
      if (!isEdit || !form.getFieldValue('portId')) {
        form.setFieldsValue({ portId: undefined, transferAreaCode: undefined });
      }
      loadPortOptions(watchedOrgUnitId);
    }
  }, [watchedOrgUnitId]);

  useEffect(() => {
    if (!watchedPortId || (isEdit && editPortIdRef.current === watchedPortId)) return;
    setTransferAreaCodeLoading(true);
    transferAreaCRUD.generateCode(watchedPortId)
      .then((res: any) => {
        if (res?.transferAreaCode) form.setFieldsValue({ transferAreaCode: res.transferAreaCode });
      })
      .catch(() => {})
      .finally(() => setTransferAreaCodeLoading(false));
  }, [watchedPortId]);

  // Đơn vị quản lý KHÔNG tự điền sẵn — để người dùng chủ động chọn từ cây đơn vị (không mặc định 1 giá trị).

  useEffect(() => {
    if (!watchedGeometryType) return;
    form.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
    if (!isEdit) {
      setCoordinateList(Array.from({ length: count }, () => emptyDmsPoint()));
    } else {
      setCoordinateList((prev) => {
        if (prev.length >= count) return prev;
        const added = Array.from({ length: count - prev.length }, () => emptyDmsPoint());
        return [...prev, ...added];
      });
    }
  }, [watchedGeometryType]);

  useEffect(() => {
    if (!waterAreaGeometryType) return;
    setWaterAreaCoordinateSystem(1);
    setWaterAreaDisplayRule('Độ, phút, giây (DMS)');
    const count = GEOMETRY_POINT_COUNT[waterAreaGeometryType] ?? 1;
    setWaterAreaAnchorPoints((prev) => {
      if (prev.length >= count) return prev;
      const added = Array.from({ length: count - prev.length }, () => ({ name: '', ...emptyDmsPoint() }));
      return [...prev, ...added];
    });
  }, [waterAreaGeometryType]);

  // Edit mode: load existing
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data: any = await transferAreaCRUD.findById(id);
        const ec = data.coordinates ? parseGisCoordinates({ geometryType: data.geometryType, coordinates: data.coordinates }) : [];
        setCoordinateList(ec.length > 0 ? ec.map(c => decimalToDmsPoint(c.latitude, c.longitude)) : data.latitude != null ? [decimalToDmsPoint(data.latitude, data.longitude)] : []);
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
          const files = await transferAreaCRUD.listAttachments(id);
          setAttachments(
            (files || []).map((a: any) => ({
              id: a.id,
              fileName: a.fileName || a.name,
              fileSize: a.fileSize,
              uploadedBy: a.uploadedBy,
              uploadedAt: a.uploadedAt,
            }))
          );
        } catch {
          setAttachments([]);
        }
        editPortIdRef.current = data.portId;
        form.setFieldsValue({
          orgUnitId: data.orgUnitId,
          portId: data.portId,
          transferAreaCode: data.transferAreaCode,
          transferAreaName: data.transferAreaName,
          provinceId: data.provinceId ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined : undefined,
          detailedLocation: data.detailedLocation,
          shapeDescription: data.shapeDescription,
          area: data.area,
          designWaterDepth: data.designWaterDepth,
          currentWaterDepth: data.currentWaterDepth,
          bottomElevationDesign: data.bottomElevationDesign,
          maxVesselDWT: data.maxVesselDWT,
          activeTransferCount: data.activeTransferCount,
          publishedTransferCount: data.publishedTransferCount,
          underInvestmentTransferCount: data.underInvestmentTransferCount,
          operationalFunctions: data.operationalFunctions ? data.operationalFunctions.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
          operationalStatus: data.operationalStatus || undefined,
          remarks: data.remarks,
          openingAnnouncementDate: data.openingAnnouncementDate ? dayjs(data.openingAnnouncementDate) : undefined,
          activityStartDate: data.activityStartDate ? dayjs(data.activityStartDate) : undefined,
          activityEndDate: data.activityEndDate ? dayjs(data.activityEndDate) : undefined,
          publicDecision: data.publicDecision,
          investmentAgreement: data.investmentAgreement,
          geometryType: data.geometryType || undefined,
          mapSymbolId: data.mapSymbolId,
          coordinateSystem: data.coordinateSystem,
          displayRule: data.displayRule,
        });
      } catch {
        toast.error('Không thể tải thông tin khu chuyển tải');
      }
    })();
  }, [isEdit, id]);

  const removeCoordinate = (i: number) => { setCoordinateList(p => p.filter((_, idx) => idx !== i)); setGpsError(null); };
  const addGpsPoint = () => { setCoordinateList(p => [...p, emptyDmsPoint()]); setGpsError(null); };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null | undefined, mVal: number | null | undefined, sVal: number | null | undefined) => {
    setCoordinateList(p => {
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
  };

  // ── Handlers khu nước neo buộc tàu ──
  const openCreateWaterAreaDrawer = () => {
    setEditingWaterAreaIndex(null);
    setWaterAreaDescription('');
    setWaterAreaGeometryType(undefined);
    setWaterAreaMapSymbolId(undefined);
    setWaterAreaCoordinateSystem(undefined);
    setWaterAreaDisplayRule(undefined);
    setWaterAreaAnchorPoints([]);
    setWaterAreaDrawerOpen(true);
  };

  const openEditWaterAreaDrawer = (index: number) => {
    const item = waterAreaList[index];
    if (!item) return;
    setEditingWaterAreaIndex(index);
    setWaterAreaDescription(item.description || '');
    setWaterAreaGeometryType(item.geometryType);
    setWaterAreaMapSymbolId(item.mapSymbolId);
    setWaterAreaCoordinateSystem(item.coordinateSystem ?? 1);
    setWaterAreaDisplayRule(item.displayRule ?? 'Độ, phút, giây (DMS)');
    setWaterAreaAnchorPoints((item.anchorPoints || []).map(p => ({
      name: p.name || '',
      ...decimalToDmsPoint(p.latitude, p.longitude),
    })));
    setWaterAreaDrawerOpen(true);
  };

  const closeWaterAreaDrawer = () => {
    setWaterAreaDrawerOpen(false);
    setEditingWaterAreaIndex(null);
  };

  const addAnchorPoint = () => {
    setWaterAreaAnchorPoints(prev => [...prev, { name: '', ...emptyDmsPoint() }]);
  };

  const removeAnchorPoint = (idx: number) => {
    setWaterAreaAnchorPoints(prev => prev.filter((_, i) => i !== idx));
  };

  const updateAnchorPointName = (idx: number, name: string) => {
    setWaterAreaAnchorPoints(prev => {
      const n = [...prev];
      n[idx] = { ...n[idx], name };
      return n;
    });
  };

  const updateAnchorPointCoord = (idx: number, field: 'lat' | 'lng', d: number | null | undefined, m: number | null | undefined, s: number | null | undefined) => {
    setWaterAreaAnchorPoints(prev => {
      const n = [...prev];
      n[idx] = {
        ...n[idx],
        [field === 'lat' ? 'latD' : 'lngD']: d ?? null,
        [field === 'lat' ? 'latM' : 'lngM']: m ?? null,
        [field === 'lat' ? 'latS' : 'lngS']: s ?? null,
      };
      return n;
    });
  };

  const saveWaterArea = () => {
    const desc = waterAreaDescription.trim();
    if (!desc) {
      toast.error('Vui lòng nhập phạm vi khu nước neo buộc tàu');
      return;
    }
    setWaterAreaSaving(true);
    try {
      const anchorPoints: AnchorPointField[] = waterAreaAnchorPoints.map(p => {
        const dec = dmsPointToDecimal(p);
        return {
          name: p.name.trim(),
          latitude: p.latD != null && p.latM != null && p.latS != null ? dec.latitude : null,
          longitude: p.lngD != null && p.lngM != null && p.lngS != null ? dec.longitude : null,
        };
      });

      const newArea: MooringWaterAreaField = {
        description: desc,
        geometryType: waterAreaGeometryType,
        mapSymbolId: waterAreaMapSymbolId,
        coordinateSystem: waterAreaCoordinateSystem,
        displayRule: waterAreaDisplayRule,
        anchorPoints,
      };

      if (editingWaterAreaIndex == null) {
        setWaterAreaList(prev => [...prev, newArea]);
        toast.success('Đã thêm khu nước neo buộc tàu');
      } else {
        setWaterAreaList(prev => {
          const n = [...prev];
          n[editingWaterAreaIndex] = newArea;
          return n;
        });
        toast.success('Đã cập nhật khu nước neo buộc tàu');
      }
      closeWaterAreaDrawer();
    } finally {
      setWaterAreaSaving(false);
    }
  };

  const removeWaterArea = (index: number) => {
    setWaterAreaList(prev => prev.filter((_, i) => i !== index));
    toast.success('Đã xóa khu nước neo buộc tàu');
  };

  const triggerBlobDownload = (data: BlobPart | undefined, downloadName: string) => {
    if (!data) return false;
    const blob = data instanceof Blob ? data : new Blob([data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  };

  const handleDownloadAttachment = async (uid: string, name?: string) => {
    const pending = pendingFiles.find((_, i) => `pending-${i}` === uid);
    if (pending) {
      triggerBlobDownload(pending, name || pending.name);
      return;
    }
    if (!id) {
      toast.info(`Đang tải xuống tệp: ${name}`);
      return;
    }
    try {
      await transferAreaCRUD.downloadAttachment(id, uid, name);
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  };

  // ── Form Save Handler ──
  const handleSave = useCallback(async (saveAction: SaveAction) => {
    let values: any;
    try {
      values = await form.validateFields();
    } catch (e: any) {
      const errFields: Array<{ name: Array<string | number>; errors?: string[] }> = e?.errorFields ?? [];
      const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc (*)';
      toast.error(firstError);
      if (errFields.some((f) => f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule' || f.name[0] === 'geometryType')) {
        setActiveTabKey('location');
      } else {
        setActiveTabKey('general');
      }
      return;
    }

    if (!values.provinceId) {
      setActiveTabKey('general');
      toast.error('Địa điểm (Tỉnh/Thành phố) là bắt buộc');
      return;
    }

    // Validate GIS coordinates
    const geomType = values.geometryType;
    let validCoords: Array<{ latitude: number; longitude: number }> = [];
    if (geomType) {
      const res = validateDmsCoordinates(coordinateList, geomType);
      if (!res.valid) {
        const errMsg = res.errorMessage || 'Tọa độ GPS chưa hợp lệ';
        setGpsError(errMsg);
        setActiveTabKey('location');
        toast.error(errMsg);
        return;
      }
      validCoords = res.validCoords;
    }

    onSubmittingChange?.(true);
    try {
      const decimals = validCoords.length > 0 ? validCoords : coordinateList
        .filter(c => c.latD != null && c.lngD != null)
        .map(dmsPointToDecimal);

      const wkt = geomType && decimals.length > 0
        ? serializeCoordinatesToWkt(decimals, geomType || 'POINT')
        : undefined;

      const firstCoord = decimals[0];

      const payload: any = {
        transferAreaCode: values.transferAreaCode,
        transferAreaName: values.transferAreaName,
        portId: values.portId,
        orgUnitId: values.orgUnitId,
        provinceId: values.provinceId ? VIETNAM_PROVINCES.indexOf(values.provinceId) + 1 : undefined,
        detailedLocation: values.detailedLocation,
        shapeDescription: values.shapeDescription,
        area: values.area,
        designWaterDepth: values.designWaterDepth,
        currentWaterDepth: values.currentWaterDepth,
        bottomElevationDesign: values.bottomElevationDesign,
        maxVesselDWT: values.maxVesselDWT,
        activeTransferCount: values.activeTransferCount,
        publishedTransferCount: values.publishedTransferCount,
        underInvestmentTransferCount: values.underInvestmentTransferCount,
        operationalFunctions: Array.isArray(values.operationalFunctions) ? values.operationalFunctions.join(',') : values.operationalFunctions,
        operationalStatus: values.operationalStatus,
        remarks: values.remarks,
        openingAnnouncementDate: values.openingAnnouncementDate ? values.openingAnnouncementDate.format('YYYY-MM-DD') : undefined,
        activityStartDate: values.activityStartDate ? values.activityStartDate.format('YYYY-MM-DD') : undefined,
        activityEndDate: values.activityEndDate ? values.activityEndDate.format('YYYY-MM-DD') : undefined,
        publicDecision: values.publicDecision,
        investmentAgreement: values.investmentAgreement,
        geometryType: geomType,
        mapSymbolId: values.mapSymbolId,
        coordinateSystem: values.coordinateSystem,
        displayRule: values.displayRule,
        coordinates: wkt,
        latitude: firstCoord?.latitude,
        longitude: firstCoord?.longitude,
        mooringWaterAreas: waterAreaList,
        saveAction,
      };

      let savedRecord: any;
      if (isEdit) {
        payload.id = id;
        savedRecord = await transferAreaCRUD.update(payload);
        toast.success(
          saveAction === 'APPROVED'
            ? 'Đã lưu và phê duyệt khu chuyển tải'
            : saveAction === 'SUBMIT'
            ? 'Đã gửi phê duyệt khu chuyển tải'
            : saveAction === 'DRAFT'
            ? 'Đã lưu tạm khu chuyển tải'
            : 'Đã cập nhật khu chuyển tải'
        );
      } else {
        savedRecord = await transferAreaCRUD.create(payload);
        toast.success(
          saveAction === 'APPROVED'
            ? 'Đã lưu và phê duyệt khu chuyển tải'
            : saveAction === 'SUBMIT'
            ? 'Đã tạo và gửi phê duyệt khu chuyển tải'
            : saveAction === 'DRAFT'
            ? 'Đã lưu tạm khu chuyển tải'
            : 'Đã tạo mới khu chuyển tải'
        );
      }

      // Upload pending files if any
      if (pendingFiles.length > 0 && savedRecord?.id) {
        try {
          await transferAreaCRUD.uploadAttachments(savedRecord.id, pendingFiles);
        } catch {
          toast.warning('Khu chuyển tải đã lưu nhưng không thể tải lên một số file đính kèm');
        }
      }

      onFinish(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      onSubmittingChange?.(false);
    }
  }, [form, coordinateList, waterAreaList, isEdit, id, pendingFiles, onFinish, onSubmittingChange]);

  useImperativeHandle(ref, () => ({
    submit: (saveAction: SaveAction) => handleSave(saveAction),
  }), [handleSave]);

  const tabItems = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={drawerFormScrollStyle}>
          {/* Card 1: Thông tin cơ bản & Quản lý vận hành */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <BankOutlined style={{ color: actionPrimary }} />
                <span>Thông tin cơ bản & Quản lý vận hành</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}>
                  <OrgUnitTreeSelect organizations={organizations} placeholder="Chọn đơn vị..." allowClear showPath allLabel="Tất cả" treeDefaultExpandAll={false} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="portId" {...labelProps('Thuộc cảng biển')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Cảng biển là bắt buộc' }]}>
                  <Select placeholder="Chọn cảng biển" allowClear showSearch optionFilterProp="label" options={portOptions} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="transferAreaCode" {...labelProps('Mã khu chuyển tải')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder={transferAreaCodeLoading ? 'Đang tạo mã...' : 'Mã tự động sinh'} disabled style={readonlyInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="transferAreaName" {...labelProps('Tên khu chuyển tải')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tên khu chuyển tải là bắt buộc' }]}>
                  <Input placeholder="Nhập tên khu chuyển tải" maxLength={255} count={{ show: true, max: 255 }} status={atMax.transferAreaName ? 'error' : undefined} style={{ ...inputStyle, borderColor: atMax.transferAreaName ? statusCritical : undefined }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]}>
                  <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea placeholder="Nhập địa điểm chi tiết" maxLength={500} count={{ show: true, max: 500 }} rows={1} status={atMax.detailedLocation ? 'error' : undefined} style={{ ...textAreaStyle, borderRadius: 8, borderColor: atMax.detailedLocation ? statusCritical : undefined }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="operationalFunctions" {...labelProps('Công năng khai thác')} style={{ marginBottom: spaceFormField }}>
                  <Select mode="multiple" placeholder="Chọn công năng khai thác" allowClear showSearch maxTagCount="responsive" options={OPERATIONAL_FUNCTIONS_OPTIONS} style={{ width: '100%', borderRadius: radiusPill }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operationalStatus" {...labelProps('Tình trạng')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}>
                  <Select placeholder="Chọn tình trạng" allowClear options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Card 2: Thông số kỹ thuật & Năng lực khai thác */}
          <div style={sectionBoxStyle}>
            <div
              onClick={() => setIndicatorOpen(!indicatorOpen)}
              style={{
                ...sectionHeaderStyle,
                cursor: 'pointer',
                userSelect: 'none',
                marginBottom: indicatorOpen ? spaceSm : 0,
                paddingBottom: indicatorOpen ? spaceSm : 0,
                borderBottom: indicatorOpen ? sectionHeaderStyle.borderBottom : 'none',
              }}
            >
              <div style={sectionTitleStyle}>
                <SlidersOutlined style={{ color: actionPrimary }} />
                <span>Thông số kỹ thuật & Năng lực khai thác</span>
              </div>
              <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>
                {indicatorOpen ? <DownOutlined /> : <RightOutlined />}
              </span>
            </div>
            {indicatorOpen && (
              <div>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="shapeDescription" {...labelProps('Hình dạng')} style={{ marginBottom: spaceFormField }}>
                      <Input placeholder="Nhập hình dạng" maxLength={255} count={{ show: true, max: 255 }} status={atMax.shapeDescription ? 'error' : undefined} style={{ ...inputStyle, borderColor: atMax.shapeDescription ? statusCritical : undefined }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="area" {...labelProps('Diện tích (ha)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount placeholder="Nhập diện tích" min={0} maxLength={20} style={{ ...numberStyle, borderColor: atMax.area ? statusCritical : undefined }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="designWaterDepth" {...labelProps('Độ sâu thiết kế (m)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount placeholder="Nhập độ sâu thiết kế" min={0} maxLength={20} style={{ ...numberStyle, borderColor: atMax.designWaterDepth ? statusCritical : undefined }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="currentWaterDepth" {...labelProps('Độ sâu hiện tại (m)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount placeholder="Nhập độ sâu hiện tại" min={0} maxLength={20} style={{ ...numberStyle, borderColor: atMax.currentWaterDepth ? statusCritical : undefined }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="bottomElevationDesign" {...labelProps('Cao độ đáy thiết kế (m)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount placeholder="Nhập cao độ đáy thiết kế" maxLength={20} style={{ ...numberStyle, borderColor: atMax.bottomElevationDesign ? statusCritical : undefined }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="maxVesselDWT" {...labelProps('Cỡ tàu khai thác tối đa (DWT)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount placeholder="Nhập cỡ tàu khai thác tối đa" min={0} maxLength={20} style={{ ...numberStyle, borderColor: atMax.maxVesselDWT ? statusCritical : undefined }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[24, 0]}>
                  <Col span={8}>
                    <Form.Item name="activeTransferCount" className="cn-op-2line-label" {...labelProps('Số lượng khu chuyển tải đang khai thác')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount placeholder="Nhập số lượng" min={0} maxLength={5} style={{ ...numberStyle, borderColor: atMax.activeTransferCount ? statusCritical : undefined }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="publishedTransferCount" className="cn-op-2line-label" {...labelProps('Số lượng khu chuyển tải đã công bố')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount placeholder="Nhập số lượng" min={0} maxLength={5} style={{ ...numberStyle, borderColor: atMax.publishedTransferCount ? statusCritical : undefined }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="underInvestmentTransferCount" className="cn-op-2line-label" {...labelProps('Số lượng khu chuyển tải đang thỏa thuận đầu tư')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount placeholder="Nhập số lượng" min={0} maxLength={5} style={{ ...numberStyle, borderColor: atMax.underInvestmentTransferCount ? statusCritical : undefined }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[24, 0]}>
                  <Col span={24}>
                    <Form.Item name="remarks" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                      <Input.TextArea placeholder="Nhập ghi chú" maxLength={2000} count={{ show: true, max: 2000 }} rows={2} style={{ ...textAreaStyle, borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}
          </div>

          {/* Card 3: Thông tin công bố mở, đưa vào sử dụng */}
          <div style={sectionBoxStyle}>
            <div
              onClick={() => setAnnouncementOpen(!announcementOpen)}
              style={{
                ...sectionHeaderStyle,
                cursor: 'pointer',
                userSelect: 'none',
                marginBottom: announcementOpen ? spaceSm : 0,
                paddingBottom: announcementOpen ? spaceSm : 0,
                borderBottom: announcementOpen ? sectionHeaderStyle.borderBottom : 'none',
              }}
            >
              <div style={sectionTitleStyle}>
                <FileTextOutlined style={{ color: actionPrimary }} />
                <span>Thông tin công bố mở, đưa vào sử dụng</span>
              </div>
              <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>
                {announcementOpen ? <DownOutlined /> : <RightOutlined />}
              </span>
            </div>
            {announcementOpen && (
              <div>
                <Row gutter={[24, 0]}>
                  <Col span={24}>
                    <Form.Item name="openingAnnouncementDate" {...labelProps('Thời điểm công bố mở')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker placeholder="Chọn ngày" {...getDatePickerProps()} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={24}>
                    <Form.Item name="publicDecision" {...labelProps('Quyết định công bố/văn bản cho phép khai thác')} style={{ marginBottom: spaceFormField }}>
                      <Input.TextArea placeholder="Nhập quyết định công bố / văn bản cho phép khai thác" maxLength={2000} count={{ show: true, max: 2000 }} rows={2} status={atMax.publicDecision ? 'error' : undefined} style={{ ...textAreaStyle, borderRadius: 8, borderColor: atMax.publicDecision ? statusCritical : undefined }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={24}>
                    <Form.Item name="investmentAgreement" {...labelProps('Văn bản thỏa thuận đầu tư')} style={{ marginBottom: spaceFormField }}>
                      <Input.TextArea placeholder="Nhập văn bản thỏa thuận đầu tư" maxLength={2000} count={{ show: true, max: 2000 }} rows={2} status={atMax.investmentAgreement ? 'error' : undefined} style={{ ...textAreaStyle, borderRadius: 8, borderColor: atMax.investmentAgreement ? statusCritical : undefined }} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}
          </div>

          {/* Card 4: Thông tin thời gian hoạt động */}
          <div style={sectionBoxStyle}>
            <div
              onClick={() => setActivityOpen(!activityOpen)}
              style={{
                ...sectionHeaderStyle,
                cursor: 'pointer',
                userSelect: 'none',
                marginBottom: activityOpen ? spaceSm : 0,
                paddingBottom: activityOpen ? spaceSm : 0,
                borderBottom: activityOpen ? sectionHeaderStyle.borderBottom : 'none',
              }}
            >
              <div style={sectionTitleStyle}>
                <CalendarOutlined style={{ color: actionPrimary }} />
                <span>Thông tin thời gian hoạt động</span>
              </div>
              <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>
                {activityOpen ? <DownOutlined /> : <RightOutlined />}
              </span>
            </div>
            {activityOpen && (
              <div>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="activityStartDate" {...labelProps('Từ ngày')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker placeholder="Chọn ngày bắt đầu" {...getDatePickerProps()} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="activityEndDate" {...labelProps('Đến ngày')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker placeholder="Chọn ngày kết thúc" {...getDatePickerProps()} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}
          </div>

          {/* Card 5: Phạm vi khu nước neo buộc tàu */}
          <div style={sectionBoxStyle}>
            <div
              onClick={() => setMooringScopeOpen(!mooringScopeOpen)}
              style={{
                ...sectionHeaderStyle,
                cursor: 'pointer',
                userSelect: 'none',
                marginBottom: mooringScopeOpen ? spaceSm : 0,
                paddingBottom: mooringScopeOpen ? spaceSm : 0,
                borderBottom: mooringScopeOpen ? sectionHeaderStyle.borderBottom : 'none',
              }}
            >
              <div style={sectionTitleStyle}>
                <CompassOutlined style={{ color: actionPrimary }} />
                <span>Phạm vi khu nước neo buộc tàu ({waterAreaList.length})</span>
              </div>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreateWaterAreaDrawer();
                  }}
                  style={{ ...primaryButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px' }}
                >
                  Thêm khu nước neo buộc tàu
                </Button>
                <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>
                  {mooringScopeOpen ? <DownOutlined /> : <RightOutlined />}
                </span>
              </Space>
            </div>
            {mooringScopeOpen && (
              <div>
                {waterAreaList.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                    <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có khu nước neo buộc tàu nào.</span>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={openCreateWaterAreaDrawer} style={{ borderRadius: radiusPill }}>Thêm khu nước neo buộc tàu</Button>
                  </div>
                ) : (
                  <DetailTable
                    size="small"
                    scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
                    dataSource={waterAreaList.map((w, i) => ({ ...w, _idx: i }))}
                    rowKey={(r: any, idx?: number) => r._idx ?? String(idx)}
                    emptyText="Chưa có khu nước neo buộc tàu nào"
                    columns={[
                      { title: 'STT', width: 60, align: 'center' as const, render: (_v: any, _r: any, idx: number) => idx + 1 },
                      { title: 'Phạm vi khu nước', key: 'description', dataIndex: 'description', ellipsis: true },
                      { title: 'Số điểm neo', key: 'anchorCount', width: 120, align: 'center' as const, render: (_v: any, record: any) => record.anchorPoints?.length || 0 },
                      {
                        title: 'Thao tác',
                        key: 'actions',
                        width: 100,
                        align: 'center' as const,
                        render: (_v: any, record: any) => (
                          <Space size={4}>
                            <Button type="text" icon={<EditOutlined style={{ color: actionPrimary }} />} onClick={() => openEditWaterAreaDrawer(record._idx)} />
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeWaterArea(record._idx)} />
                          </Space>
                        ),
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

    // Tab 2: Thông tin vị trí (đồng bộ 2 section box như Pier)
    {
      key: 'location',
      label: `Thông tin vị trí (${coordinateList.length})`,
      children: (
        <div style={drawerFormScrollStyle}>
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
                  <Select placeholder="Chọn loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn biểu tượng" allowClear showSearch optionFilterProp="label" disabled={!watchedGeometryType} style={selectStyle}>
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
          </div>

          <div style={sectionBoxStyle}>
            <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
              <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: portFormFontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                Tọa độ GPS ({coordinateList.length})
              </span>
              <Space size={spaceSm}>
                <Button
                  icon={<EnvironmentOutlined style={{ color: !watchedGeometryType ? undefined : actionPrimary }} />}
                  onClick={() => setGisModalOpen(true)}
                  disabled={!watchedGeometryType}
                  style={!watchedGeometryType ? {
                    height: 32,
                    fontSize: fontSizeSm,
                    padding: '0 14px',
                    borderRadius: radiusPill,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: spaceXs,
                    opacity: 0.6,
                    cursor: 'not-allowed',
                  } : {
                    ...outlineButtonStyle,
                    height: 32,
                    fontSize: fontSizeSm,
                    padding: '0 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: spaceXs,
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
                    gap: spaceXs,
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
                    gap: spaceXs,
                  }}
                >
                  Thêm tọa độ
                </Button>
              </Space>
            </div>

            {coordinateList.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                <span style={{ fontSize: portFormFontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
                <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
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
                    { title: 'STT', width: 60, align: 'center' as const, render: (_v: any, _r: any, idx: number) => idx + 1 },
                    { title: <span>Vĩ độ (Latitude - N) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>, key: 'lat', render: (_v: any, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)) },
                    { title: <span>Kinh độ (Longitude - E) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>, key: 'lng', render: (_v: any, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)) },
                    { title: '', width: 50, align: 'center' as const, render: (_v: any, record: any) => (<Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeCoordinate(record._idx)} />) },
                  ]}
                />
              </>
            )}
          </div>
        </div>
      ),
    },

    // Tab 3: File đính kèm
    {
      key: 'files',
      label: `File đính kèm (${attachments.length + pendingFiles.length})`,
      children: (
        <InfrastructureAttachmentTab
          attachments={[
            ...attachments,
            ...pendingFiles.map((f, i) => ({
              id: `pending-${i}`,
              fileName: f.name,
              fileSize: f.size,
              uploadedBy: currentUser?.fullName || currentUser?.username || 'Bạn',
              uploadedAt: new Date().toISOString(),
            })),
          ]}
          userMap={userMap}
          readonly={false}
          onUpload={(file) => {
            if (file.size > 20 * 1024 * 1024) {
              toast.error('File vượt quá 20MB');
              return false;
            }
            if (attachments.length + pendingFiles.length >= 10) {
              toast.error('Tối đa 10 file');
              return false;
            }
            setPendingFiles(prev => [...prev, file]);
            toast.success(`Đã thêm tệp ${file.name}`);
            return false;
          }}
          onDelete={(uid) => {
            if (uid.startsWith('pending-')) {
              const idx = parseInt(uid.replace('pending-', ''), 10);
              setPendingFiles(prev => prev.filter((_, i) => i !== idx));
              toast.success('Đã xóa tệp đính kèm');
            } else if (id) {
              transferAreaCRUD.deleteAttachment(id, uid)
                .then(() => {
                  setAttachments(prev => prev.filter(a => a.id !== uid));
                  toast.success('Đã xóa tệp đính kèm');
                })
                .catch(() => toast.error('Xóa tệp thất bại'));
            }
          }}
          onDownload={(uid, name) => {
            void handleDownloadAttachment(uid, name);
          }}
        />
      ),
    },
  ];

  return (
    <>
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={drawerTabBarStyle} items={tabItems} />

      {/* GIS Location Selector Modal */}
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
                const points = parseGisCoordinates({ geometryType: val.geometryType, coordinates: val.coordinates });
                if (points.length > 0) {
                  setCoordinateList(prev => {
                    const existing = prev || [];
                    const key = (p: { latitude: number; longitude: number }) => `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                    const existingKeys = new Set(existing
                      .filter(c => c.latD != null && c.lngD != null)
                      .map(c => key(dmsPointToDecimal(c))));
                    const toAdd = points.filter(p => !existingKeys.has(key(p))).map(p => decimalToDmsPoint(p.latitude, p.longitude));
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

      {/* Drawer Thông tin khu nước neo buộc tàu */}
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

          <Row gutter={[24, 0]}>
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

          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} value={waterAreaCoordinateSystem} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled value={waterAreaDisplayRule} style={readonlyInputStyle} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ điểm neo</span>
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
            <Table
              size="small"
              tableLayout="fixed"
              pagination={false}
              dataSource={waterAreaAnchorPoints.map((p, i) => ({ ...p, _idx: i }))}
              rowKey={(r, idx) => r._idx ?? String(idx)}
              locale={{ emptyText: 'Chưa có điểm neo nào' }}
              columns={[
                {
                  title: 'Tên điểm neo',
                  key: 'name',
                  width: 200,
                  render: (_v, record: any) => (
                    <Input placeholder="Nhập tên điểm neo" value={record.name} onChange={(e) => updateAnchorPointName(record._idx, e.target.value)} style={inputStyle} />
                  ),
                },
                {
                  title: 'Vĩ độ (N)',
                  key: 'lat',
                  width: 200,
                  render: (_v, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateAnchorPointCoord(record._idx, 'lat', d, m, s)),
                },
                {
                  title: 'Kinh độ (E)',
                  key: 'lng',
                  width: 200,
                  render: (_v, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateAnchorPointCoord(record._idx, 'lng', d, m, s)),
                },
                {
                  title: 'Thao tác',
                  key: 'actions',
                  width: 80,
                  align: 'center' as const,
                  render: (_v, record: any) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeAnchorPoint(record._idx)} />,
                },
              ]}
            />
          )}
        </Form>
      </Drawer>
    </>
  );
});
