import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Tabs, Form, Row, Col, InputNumber, Select, Input, Upload, DatePicker, Table, Space, Button, Modal } from 'antd';
import type { FormInstance, UploadFile } from 'antd';
import { PlusOutlined, DeleteOutlined, FileOutlined, EnvironmentOutlined, InboxOutlined } from '@ant-design/icons';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { fmtInputNumber } from '../../utils/numFmt';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { symbolService } from '../../services/symbolService';
import type { Symbol as GisSymbol } from '../../services/symbolService';
import { lineObjectService } from '../../services/lineObjectService';
import { LineObject } from '../../types/lineObject';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../components/org-unit';
import { portCRUD } from '../../services/portService';
import {
  createBuoyStation, updateBuoyStation, generateBuoyStationCode,
} from './api';
import { VIETNAM_PROVINCES } from '../../types/common';
import type { BuoyStationResponse, CreateBuoyStationRequest } from './types';
import { useAuthStore } from '../../store/authStore';
import {
  sidebarBg, actionPrimary, statusCritical,
  readonlyInputStyle, drawerTabBarStyle, drawerTabContentStyle,
  outlineButtonStyle, primaryButtonStyle, spaceMd, fontSizeLg,
  spaceFormField, radiusPill, radiusMd, borderDefault, textTertiary, textPrimary,
  spaceSm, fontWeightBold, fontSizeMd, fontSizeSm, surfaceCard, uploadHintStyle,
} from '../../themetokenchk';

import {
  GEOMETRY_OPTIONS, COORD_SYS_OPTIONS, GEOMETRY_POINT_COUNT,
} from './schema';
import { CONDITION_OPTIONS } from '../buoy/schema';

const labelProps = (text: string) => ({
  label: <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

type SaveAction = 'DRAFT' | 'SUBMIT' | 'APPROVED' | 'UPDATE';

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };

/** Dòng tọa độ DMS trống (chuẩn VTS CHK: 6 ô latD/latM/latS/lngD/lngM/lngS ghi trực tiếp). */
const EMPTY_DMS_ROW: { latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null } = {
  latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null,
};

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px). */
const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null | undefined, m: number | null | undefined, s: number | null | undefined) => void,
) => {
  return (
    <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
      <InputNumber value={dVal} min={0} max={maxDeg} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(v, mVal, sVal)} style={{ flex: 1, minWidth: 0, borderRadius: '999px 0 0 999px', height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>°</span>
      <InputNumber value={mVal} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal, v, sVal)} style={{ flex: 1, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>'</span>
      <InputNumber value={sVal} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal, mVal, v)} style={{ flex: 1.2, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitEndStyle}>"</span>
    </Space.Compact>
  );
};
const parseInteger = (v: string | undefined): number => {
  const intPart = (v ?? '').replace(/,/g, '').split('.')[0];
  return intPart === '' ? 0 : Number(intPart);
};

/** true khi giá trị field đã đạt đủ max ký tự — dùng để bật viền đỏ ô nhập + message cảnh báo bên dưới. */
function useMaxReached(form: FormInstance, name: string, max: number): boolean {
  const raw = Form.useWatch(name, form) ?? '';
  const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
  return len >= max;
}

const ddToDms = (v: number | null | undefined): { d: number | null; m: number | null; s: number | null } => {
  if (v == null || isNaN(v)) return { d: null, m: null, s: null };
  let abs = Math.abs(v);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
  let m = Math.floor(mFloat);
  let sFloat = (mFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
  return { d: d === 0 ? null : d, m: m === 0 ? null : m, s: s === 0 ? null : s };
};

// Parse WKT `coordinates` (POINT/LINESTRING/POLYGON/MULTIPOINT) về danh sách tọa độ (giống BuoyListPage.parseGisCoordinateList)
const parseGisCoordinateList = (wkt: string | null | undefined): Array<{ latitude: number; longitude: number }> => {
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.+-]+)\s+([\d.+-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* invalid */ }
  return [];
};

export interface ExistingFile {
  id: string;
  fileName?: string;
  name?: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface BuoyStationFormContentHandle {
  submit: (action: SaveAction) => void;
}

export interface BuoyStationFormContentProps {
  form: FormInstance;
  isEdit?: boolean;
  /** Dữ liệu hiện tại khi sửa — dùng để prefill form và khóa trường Loại khi đã duyệt */
  entityData?: BuoyStationResponse | null;
  uploadedFiles: UploadFile[];
  setUploadedFiles: (f: UploadFile[] | ((p: UploadFile[]) => UploadFile[])) => void;
  existingFiles: ExistingFile[];
  /** Danh sách đơn vị đầy đủ (id/name/code/parentId) từ parent — dùng cho OrgUnitTreeSelect; bỏ trống sẽ fallback tự fetch */
  organizations?: OrgUnitTreeOption[];
  /** Bản đồ tên người dùng — hiển thị cột Người tải lên trong bảng file đính kèm (chuẩn VTS CHK) */
  userMap?: Map<string, string>;
  /** Gọi khi lưu thành công (đóng drawer + reload danh sách) */
  onFinish: (saved: boolean) => void;
}

export default forwardRef<BuoyStationFormContentHandle, BuoyStationFormContentProps>(function BuoyStationFormContent({
  form,
  isEdit = false,
  entityData,
  uploadedFiles,
  setUploadedFiles,
  existingFiles,
  organizations,
  userMap,
  onFinish,
}, ref) {
  const currentUser = useAuthStore((s) => s.user);
  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);

  // Dữ liệu cây đơn vị cho OrgUnitTreeSelect: ưu tiên organizations từ parent, fallback danh sách tự fetch
  const orgUnitTreeData = useMemo<OrgUnitTreeOption[]>(() => {
    if (organizations && organizations.length > 0) return organizations;
    return orgUnitOptions.map((o) => ({ id: o.value, name: o.label }));
  }, [organizations, orgUnitOptions]);
  const [portOptions, setPortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [symbols, setSymbols] = useState<GisSymbol[]>([]);
  const [waterwayOptions, setWaterwayOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [routeOptions, setRouteOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [codeLoading, setCodeLoading] = useState(false);
  const [coordinateList, setCoordinateList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(true); // Toggle 'Chỉ số tổng hợp' trong tab Thông tin chung (mặc định MỞ)
  const [gpsPage, setGpsPage] = useState(1);
  const [filePage, setFilePage] = useState(1);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const editPortIdRef = useRef<string | undefined>(undefined);

  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);
  const watchedGeometryType = Form.useWatch('geometryType', form);

  const atMax = {
    name: useMaxReached(form, 'name', 255),
    address: useMaxReached(form, 'address', 500),
    totalArea: useMaxReached(form, 'totalArea', 20),
    usableArea: useMaxReached(form, 'usableArea', 20),
    staffCount: useMaxReached(form, 'staffCount', 5),
    note: useMaxReached(form, 'note', 2000),
  };

  const loadPortOptions = useCallback(async (orgUnitId?: string) => {
    setLoadingPorts(true);
    try {
      // Chỉ load cảng biển đã được phê duyệt (approvalStatus = APPROVED) — đồng bộ BerthForm
      const r = await portCRUD.findAll({ page: 1, size: 1000, orgUnitId, approvalStatus: 'APPROVED' });
      const list = r.data || (r as any).content || [];
      const ports = (orgUnitId ? list.filter((p: any) => p.orgUnitId === orgUnitId) : list).map((p: any) => ({ value: p.id, label: p.portName || p.name || p.id }));
      setPortOptions(ports);
      if (ports.length === 0) toast.warning('Đơn vị quản lý chưa có cảng biển được phê duyệt');
    } catch { setPortOptions([]); }
    finally { setLoadingPorts(false); }
  }, []);

  useEffect(() => {
    (async () => { try { const r = await organizationService.list({ pageSize: 1000 }); setOrgUnitOptions((r.data || []).map((o: { id: string; name: string }) => ({ value: o.id, label: o.name }))); } catch { /* */ } })();
  }, []);

  // GIS symbols cho trường Biểu tượng (giống BuoyListPage)
  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' })
      .then((r: any) => setSymbols(r.data || []))
      .catch(() => {});
  }, []);

  // Luồng hàng hải + Tuyến luồng hàng hải (LineObject GIS — WATERWAY / SHIPPING_ROUTE)
  useEffect(() => {
    (async () => {
      try { const r = await lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize: 1000 }); setWaterwayOptions((r.data || []).map((l) => ({ value: l.id, label: l.name || l.code }))); } catch { /* */ }
      try { const r = await lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.SHIPPING_ROUTE, pageSize: 1000 }); setRouteOptions((r.data || []).map((l) => ({ value: l.id, label: l.name || l.code }))); } catch { /* */ }
    })();
  }, []);

  // Chọn Đơn vị quản lý → tải danh sách cảng biển thuộc đơn vị (chế độ tạo mới)
  useEffect(() => {
    if (isEdit) return;
    if (watchedOrgUnitId) void loadPortOptions(watchedOrgUnitId);
    else setPortOptions([]);
  }, [watchedOrgUnitId, isEdit, loadPortOptions]);

  // Sinh mã tự động theo cảng biển chủ (mẫu BerthForm)
  useEffect(() => {
    if (!watchedPortId || (isEdit && editPortIdRef.current === watchedPortId)) return;
    setCodeLoading(true);
    generateBuoyStationCode(watchedPortId).then((c) => { if (c) form.setFieldsValue({ code: c }); }).catch(() => { /* */ }).finally(() => setCodeLoading(false));
  }, [watchedPortId, form, isEdit]);

  // Chọn loại đối tượng → tự set hệ quy chiếu, quy tắc hiển thị và số dòng tọa độ tương ứng (giống BuoyFormContent)
  useEffect(() => {
    if (!watchedGeometryType) {
      form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      setCoordinateList([]);
      setGpsError(null);
      return;
    }
    // Chỉ set default khi entityData không có sẵn coordinateSystem (để prefill không bị override)
    if (!entityData || !entityData.geometryType || !entityData.coordinateSystem) {
      form.setFieldsValue({ coordinateSystem: 'WGS84', displayRule: 'Độ, phút, giây (DMS)' });
    }
    const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
    if (!isEdit) {
      setCoordinateList(Array.from({ length: count }, () => ({ ...EMPTY_DMS_ROW })));
    } else {
      setCoordinateList((prev) => {
        if (prev.length >= count) return prev;
        const added = Array.from({ length: count - prev.length }, () => ({ ...EMPTY_DMS_ROW }));
        return [...prev, ...added];
      });
    }
  }, [watchedGeometryType, form, isEdit, entityData]);

  // Edit mode: prefill dữ liệu hiện tại
  useEffect(() => {
    if (!isEdit || !entityData) return;
    const data = entityData;
    editPortIdRef.current = data.portId;
    if (data.unitId) void loadPortOptions(data.unitId);
    const toDmsRow = (lat: number, lng: number) => {
      const la = ddToDms(lat); const lo = ddToDms(lng);
      return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
    };
    const parsedCoords = parseGisCoordinateList(data.coordinates);
    setCoordinateList(parsedCoords.length > 0 ? parsedCoords.map((c) => toDmsRow(c.latitude, c.longitude)) : (data.longitude != null && data.latitude != null ? [toDmsRow(data.latitude, data.longitude)] : []));
    form.setFieldsValue({
      code: data.code, name: data.name, orgUnitId: data.unitId,
      operatingOrgId: data.operatingOrgId, portId: data.portId,
      provinceId: data.province || undefined, address: data.address,
      constructionDate: data.constructionDate ? dayjs(data.constructionDate) : undefined,
      totalArea: data.totalArea, usableArea: data.usableArea,
      staffCount: data.staffCount, lastMaintenanceYear: data.lastMaintenanceYear ? dayjs(`${data.lastMaintenanceYear}-01-01`) : undefined,
      note: data.note, condition: data.condition, isActive: data.isActive,
      waterwayId: data.waterwayId || undefined, waterwayRouteId: data.waterwayRouteId || undefined,
      geometryType: data.geometryType || undefined, mapSymbolId: data.icon || undefined, coordinateSystem: data.geometryType ? (data.coordinateSystem || 'WGS84') : undefined,
      displayRule: data.displayFormat || undefined,
    });
  }, [form, isEdit, entityData, loadPortOptions]);

  const removeCoordinate = (i: number) => { setCoordinateList(p => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))); setGpsError(null); };
  const addGpsPoint = () => { setCoordinateList(p => [...p, { ...EMPTY_DMS_ROW }]); setGpsError(null); };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null | undefined, mVal: number | null | undefined, sVal: number | null | undefined) => {
    // Ghi trực tiếp 6 ô Độ/Phút/Giây — KHÔNG chuyển decimal qua lại (chuẩn VTS CHK)
    setCoordinateList(p => {
      const n = [...p];
      n[i] = { ...n[i], ...(field === 'lat' ? { latD: dVal ?? null, latM: mVal ?? null, latS: sVal ?? null } : { lngD: dVal ?? null, lngM: mVal ?? null, lngS: sVal ?? null }) };
      return n;
    });
  };

  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    if (uploadedFiles.length >= 10) { toast.error('Tối đa 10 file'); return false; }
    setUploadedFiles(p => [...p, { uid: `${Date.now()}`, name: file.name, size: file.size, status: 'done' as const, originFileObj: file } as unknown as UploadFile]);
    return false;
  };

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    let values: any;
    try { values = await form.validateFields(); } catch (e: any) {
      toast.error('Vui lòng kiểm tra lại các trường bắt buộc');
      const firstErr = e?.errorFields?.[0]?.name?.[0];
      if (['mapSymbolId', 'coordinateSystem', 'displayRule', 'geometryType'].includes(firstErr)) {
        setActiveTabKey('gis');
      } else {
        setActiveTabKey('general');
      }
      return;
    }
    const code = String(values.code ?? '').trim();
    const name = String(values.name ?? '').trim();
    if (!name) { toast.error('Tên nhà trạm là bắt buộc'); return; }
    const manualCoords = coordinateList
      .filter(c => c.latD != null && c.lngD != null)
      .map(c => ({
        latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
        longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
      }));
    const geomType = values.geometryType || undefined;
    if (manualCoords.length > 0) {
      if (manualCoords[0].latitude < -90 || manualCoords[0].latitude > 90) {
        toast.error('Vĩ độ phải từ -90° đến 90° (WGS84)'); setActiveTabKey('gis'); return;
      }
      if (manualCoords[0].longitude < -180 || manualCoords[0].longitude > 180) {
        toast.error('Kinh độ phải từ -180° đến 180° (WGS84)'); setActiveTabKey('gis'); return;
      }
    }
    if (geomType) {
      const minCount = GEOMETRY_POINT_COUNT[geomType] ?? 1;
      if (manualCoords.length < minCount) {
        toast.error(geomType === 'POLYGON' ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ' : geomType === 'LINE' ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ' : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ');
        setActiveTabKey('gis');
        return;
      }
    }
    setGpsError(null);
    try {
      const p: Record<string, unknown> = {
        name,
        unitId: values.orgUnitId || undefined, operatingOrgId: values.operatingOrgId || undefined,
        portId: values.portId || undefined,
        province: values.provinceId || undefined, address: values.address || undefined,
        constructionDate: values.constructionDate ? (typeof values.constructionDate === 'string' ? values.constructionDate : values.constructionDate.format('YYYY-MM-DD')) : undefined,
        totalArea: values.totalArea, usableArea: values.usableArea, staffCount: values.staffCount,
        lastMaintenanceYear: values.lastMaintenanceYear ? (typeof values.lastMaintenanceYear === 'number' ? values.lastMaintenanceYear : values.lastMaintenanceYear.year()) : undefined,
        note: values.note || undefined, waterwayId: values.waterwayId || undefined, waterwayRouteId: values.waterwayRouteId || undefined,
        objectType: geomType, geometryType: geomType, icon: values.mapSymbolId || undefined, coordinateSystem: geomType ? (values.coordinateSystem || 'WGS84') : undefined,
        displayFormat: values.displayRule || undefined, condition: values.condition, isActive: values.condition === 'Đang khai thác/vận hành',
        latitude: manualCoords[0]?.latitude, longitude: manualCoords[0]?.longitude,
        coordinates: manualCoords.length > 1 ? `MULTIPOINT(${manualCoords.map(c => `(${c.longitude} ${c.latitude})`).join(',')})` : manualCoords.length === 1 ? `POINT(${manualCoords[0].longitude} ${manualCoords[0].latitude})` : undefined,
      };
      Object.keys(p).forEach(k => { if (p[k] === undefined) delete p[k]; });
      let sid: string | undefined;
      p.action = saveAction === 'DRAFT' ? 'draft' : saveAction === 'APPROVED' ? 'approved' : 'submit';
      if (isEdit && entityData?.id) {
        await updateBuoyStation(entityData.id, p as unknown as CreateBuoyStationRequest);
        sid = entityData.id;
      } else {
        p.code = code;
        const r = await createBuoyStation(p as unknown as CreateBuoyStationRequest);
        sid = (r as { id?: string })?.id;
      }
      toast.success(saveAction === 'DRAFT' ? 'Lưu nháp thành công' : saveAction === 'UPDATE' ? 'Cập nhật thành công' : saveAction === 'APPROVED' ? 'Phê duyệt thành công' : 'Gửi phê duyệt thành công');
      if (sid && uploadedFiles.length > 0) {
        for (const f of uploadedFiles) {
          const of = f.originFileObj as File;
          if (!of) continue;
          try { const fd = new FormData(); fd.append('file', of); await api.post(`/v1/documents/upload/buoy-station/${sid}`, fd, { headers: { 'Content-Type': undefined as any } }); } catch { /* */ }
        }
      }
      onFinish(true);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra'); }
  }, [form, isEdit, entityData, coordinateList, uploadedFiles, currentUser, onFinish]);

  useImperativeHandle(ref, () => ({ submit: (saveAction: SaveAction) => void handleSave(saveAction) }), [handleSave]);

  const tabItems = [
    // Tab 1: Thông tin chung
    { key: 'general', label: 'Thông tin chung', children: (<div style={drawerTabContentStyle}>
      <Row gutter={[24, 0]}>
        <Col span={12}><Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}><OrgUnitTreeSelect organizations={orgUnitTreeData} placeholder="Chọn đơn vị quản lý" loading={orgUnitOptions.length === 0 && !(organizations && organizations.length > 0)} disabled={isEdit} showPath onChange={() => { form.setFieldsValue({ portId: undefined, code: undefined }); setCoordinateList([]); }} /></Form.Item></Col>
        <Col span={12}><Form.Item name="operatingOrgId" {...labelProps('Đơn vị khai thác')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị khai thác là bắt buộc' }]}><Select placeholder="Chọn đơn vị khai thác..." options={orgUnitOptions} showSearch allowClear filterOption={(i, o) => normalizeSearchText(o?.label).includes(normalizeSearchText(i))} style={selectStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}><Form.Item name="portId" {...labelProps('Thuộc cảng biển')} style={{ marginBottom: spaceFormField }}><Select placeholder={!watchedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : portOptions.length === 0 && !loadingPorts ? 'Không có cảng biển thuộc đơn vị quản lý' : 'Chọn cảng biển...'} loading={loadingPorts} disabled={!watchedOrgUnitId || (portOptions.length === 0 && !loadingPorts)} options={portOptions} showSearch optionFilterProp="label" filterOption={(i, o) => normalizeSearchText(o?.label).includes(normalizeSearchText(i))} notFoundContent="Không có cảng biển thuộc đơn vị quản lý" style={selectStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="waterwayId" {...labelProps('Thuộc luồng hàng hải')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Thuộc luồng hàng hải là bắt buộc' }]}><Select placeholder="Chọn luồng hàng hải..." options={waterwayOptions} showSearch allowClear optionFilterProp="label" filterOption={(i, o) => normalizeSearchText(o?.label).includes(normalizeSearchText(i))} style={selectStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}><Form.Item name="waterwayRouteId" {...labelProps('Tuyến luồng hàng hải')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn tuyến luồng hàng hải..." options={routeOptions} showSearch allowClear optionFilterProp="label" filterOption={(i, o) => normalizeSearchText(o?.label).includes(normalizeSearchText(i))} style={selectStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="code" {...labelProps('Mã nhà trạm')} style={{ marginBottom: spaceFormField }} tooltip="Mã nhà trạm được sinh tự động khi lưu"><Input disabled maxLength={50} placeholder={codeLoading ? 'Đang sinh mã...' : 'Mã tự động'} style={readonlyInputStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}><Form.Item name="name" {...labelProps('Tên nhà trạm')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tên nhà trạm không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]} validateStatus={atMax.name ? 'error' : undefined} help={atMax.name ? 'Đã đạt tối đa 255 ký tự' : undefined}><Input placeholder="Nhập Tên nhà trạm quản lý vận hành phao, tiêu" maxLength={255} showCount style={inputStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]}><Select placeholder="Chọn địa điểm" showSearch optionFilterProp="label" filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))} options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}><Form.Item name="address" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }} rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]} validateStatus={atMax.address ? 'error' : undefined} help={atMax.address ? 'Đã đạt tối đa 500 ký tự' : undefined}><Input placeholder="Nhập Địa điểm chi tiết" maxLength={500} showCount style={inputStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="constructionDate" {...labelProps('Thời điểm xây dựng')} style={{ marginBottom: spaceFormField }}><DatePicker popupClassName="buoy-station-date-picker" placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
      </Row>
      <Row gutter={[24, 0]}>
        <Col span={12}><Form.Item name="condition" {...labelProps('Tình trạng')} required style={{ marginBottom: spaceFormField }} initialValue="Chưa khai thác/vận hành" rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}><Select placeholder="Chọn tình trạng" options={CONDITION_OPTIONS} style={selectStyle} /></Form.Item></Col>
      </Row>
      {/* ── Toggle: Chỉ số tổng hợp (gom vào tab Thông tin chung, pattern giống BuoyBerthForm) ── */}
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setIndexOpen(!indexOpen)}>
        <span style={{ color: indexOpen ? actionPrimary : sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{indexOpen ? '▼' : '▶'} Chỉ số tổng hợp</span>
      </button>
      {indexOpen && (<div style={{ marginTop: spaceFormField }}>
        <Row gutter={[24, 0]}>
          <Col span={12}><Form.Item name="totalArea" {...labelProps('Tổng diện tích (m²)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.totalArea ? 'error' : undefined} help={atMax.totalArea ? 'Đã đạt tối đa 20 ký tự' : undefined}><InputNumber min={0} maxLength={20} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={12}><Form.Item name="usableArea" {...labelProps('Diện tích sử dụng (m²)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.usableArea ? 'error' : undefined} help={atMax.usableArea ? 'Đã đạt tối đa 20 ký tự' : undefined}><InputNumber min={0} maxLength={20} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={12}><Form.Item name="staffCount" {...labelProps('Số lượng nhân sự bố trí')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Số lượng nhân sự bố trí là bắt buộc' }]} validateStatus={atMax.staffCount ? 'error' : undefined} help={atMax.staffCount ? 'Đã đạt tối đa 5 ký tự' : undefined}><InputNumber min={0} maxLength={5} precision={0} parser={parseInteger} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
          <Col span={12}><Form.Item name="lastMaintenanceYear" {...labelProps('Năm bảo trì gần nhất')} style={{ marginBottom: spaceFormField }}><DatePicker picker="year" popupClassName="buoy-station-date-picker" placeholder="Chọn năm..." format="YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={24}><Form.Item name="note" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }} rules={[{ max: 2000, message: 'Tối đa 2000 ký tự' }]} validateStatus={atMax.note ? 'error' : undefined} help={atMax.note ? 'Đã đạt tối đa 2000 ký tự' : undefined}><Input.TextArea placeholder="Ghi chú..." maxLength={2000} rows={3} showCount style={{ borderRadius: radiusPill, fontSize: fontSizeMd, resize: 'none' }} /></Form.Item></Col>
        </Row>
      </div>)}
    </div>) },
    // Tab 2: Thông tin vị trí (giống BuoyFormContent tab Thông tin vị trí)
    { key: 'gis', label: 'Thông tin vị trí', children: (<div style={drawerTabContentStyle}>
      <Row gutter={[24, 0]}>
        <Col span={12}>
          <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn Loại đối tượng" allowClear options={GEOMETRY_OPTIONS} style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn Biểu tượng" allowClear showSearch optionFilterProp="label"
              disabled={!watchedGeometryType} style={selectStyle}>
              {symbols.map((sym) => (
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
            <Select placeholder="Chọn Hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
          <Input placeholder="Nhập Quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} />
          </Form.Item>
        </Col>
      </Row>
      {/* GPS Coordinates (DMS) — chuẩn VTS CHK: 6 ô Độ/Phút/Giây ghi trực tiếp, không chuyển decimal qua lại */}
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
        <Table
          size="small"
          tableLayout="fixed"
          pagination={coordinateList.length > 10 ? {
            current: gpsPage,
            pageSize: 10,
            total: coordinateList.length,
            onChange: (p) => setGpsPage(p),
            showSizeChanger: false,
            size: 'small',
          } : false}
          dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
          rowKey={(r, idx) => r._idx ?? String(idx)}
          locale={{ emptyText: 'Chưa có tọa độ GPS nào' }}
          columns={[
            {
              title: 'STT',
              width: 60,
              align: 'center',
              render: (_v, _r, idx) => (gpsPage - 1) * 10 + idx + 1,
            },
            {
              title: 'Vĩ độ (Latitude - N)',
              key: 'lat',
              render: (_v, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
            },
            {
              title: 'Kinh độ (Longitude - E)',
              key: 'lng',
              render: (_v, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
            },
            {
              title: '',
              width: 50,
              align: 'center',
              render: (_v, record: any) => (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeCoordinate(record._idx)} />
              ),
            },
          ]}
        />
        </>
      )}
    </div>) },
    // Tab 3: File đính kèm (chuẩn VTS CHK — Upload.Dragger + bảng STT/Tên/Dung lượng/Người tải lên/Ngày tải lên)
    { key: 'files', label: 'File đính kèm', children: (<div style={drawerTabContentStyle}>
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
          Danh sách tệp đính kèm ({uploadedFiles.length + existingFiles.length})
        </span>
      </div>
      <Table
        size="small"
        scroll={{ x: 720 }}
        pagination={(uploadedFiles.length + existingFiles.length) > 10 ? {
          current: filePage,
          pageSize: 10,
          total: uploadedFiles.length + existingFiles.length,
          onChange: (p) => setFilePage(p),
          showSizeChanger: false,
          size: 'small',
        } : false}
        dataSource={[
          ...uploadedFiles.map((f, i) => ({ key: f.uid, _idx: i, uid: f.uid, name: f.name, size: f.size, removable: true })),
          ...existingFiles.map((f, i) => ({ key: f.id, _idx: i, uid: f.id, name: f.fileName || f.name, size: f.fileSize, removable: false, uploadedBy: (f as any).uploadedBy, uploadedAt: (f as any).uploadedAt })),
        ]}
        rowKey={(r) => r.uid || r._idx}
        locale={{ emptyText: 'Chưa có tài liệu đính kèm nào' }}
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
              <span title={name} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fontSizeMd, color: textPrimary }}>
                <FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}
              </span>
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
            render: (_v, rec: any) => rec.uploadedBy ? (userMap?.get(String(rec.uploadedBy)) || rec.uploadedBy) : (currentUser?.fullName || currentUser?.username || '—'),
          },
          {
            title: 'Ngày tải lên',
            key: 'uploadedAt',
            width: 160,
            align: 'center' as const,
            render: (_v, rec: any) => rec.uploadedAt ? dayjs(rec.uploadedAt).format('DD/MM/YYYY HH:mm') : '—',
          },
          {
            title: '',
            key: 'actions',
            width: 80,
            align: 'center',
            render: (_v, record: any) => record.removable ? (
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setUploadedFiles(p => p.filter(x => x.uid !== record.uid))} />
            ) : null,
          },
        ]}
      />
      <div style={{ marginTop: spaceSm }}>
        <span style={uploadHintStyle}>Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.</span>
      </div>
    </div>) },
  ];

  return (
    <>
      <style>{`.buoy-station-date-picker .ant-picker-today-btn{color:${actionPrimary}!important}`}</style>
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
                const points = parseGisCoordinateList(val.coordinates);
                if (points.length > 0) {
                  setCoordinateList((prev) => {
                    const existing = prev || [];
                    const key = (p: { latitude: number; longitude: number }) => `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                    const existingKeys = new Set(existing
                      .filter(c => c.latD != null && c.lngD != null)
                      .map(c => key({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 })));
                    const toAdd = points.filter(p => !existingKeys.has(key(p))).map(p => {
                      const la = ddToDms(p.latitude);
                      const lo = ddToDms(p.longitude);
                      return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
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
