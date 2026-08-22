import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Tabs, Form, Row, Col, InputNumber, Select, Input, Upload, DatePicker, Table, Space, Button } from 'antd';
import type { FormInstance, UploadFile } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, FileOutlined } from '@ant-design/icons';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import PagedTable from '../../components/list-view/PagedTable';
import { fmtInputNumber } from '../../utils/numFmt';
import { symbolService } from '../../services/symbolService';
import type { Symbol as GisSymbol } from '../../services/symbolService';
import { lineObjectService } from '../../services/lineObjectService';
import { LineObject } from '../../types/lineObject';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect, type OrgUnitTreeOption } from '../../components/org-unit';
import { portCRUD } from '../../services/portService';
import {
  createBuoyStation, updateBuoyStation, submitBuoyStationForApproval,
  approveBuoyStationL1, approveBuoyStationL2, generateBuoyStationCode,
} from './api';
import { VIETNAM_PROVINCES } from '../../types/common';
import type { BuoyStationResponse, CreateBuoyStationRequest } from './types';
import { useAuthStore } from '../../store/authStore';
import { spaceFormField, radiusPill, radiusMd, borderDefault, textSecondary, textTertiary, textPrimary, spaceSm, fontWeightBold, fontWeightMedium, fontSizeMd, fontSizeSm, surfaceCard, uploadHintStyle } from '../../tokens';
import { colors } from '../../theme';

import {
  GEOMETRY_OPTIONS, COORD_SYS_OPTIONS, GEOMETRY_POINT_COUNT,
} from './schema';
import { CONDITION_OPTIONS } from '../buoy/schema';

type SaveAction = 'DRAFT' | 'SUBMIT' | 'APPROVED' | 'UPDATE';

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });
const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };
const parseInteger = (v: string | undefined): number => {
  const intPart = (v ?? '').replace(/,/g, '').split('.')[0];
  return intPart === '' ? 0 : Number(intPart);
};

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
  const [coordinateList, setCoordinateList] = useState<Array<{ latitude: number | null; longitude: number | null }>>([]);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const editPortIdRef = useRef<string | undefined>(undefined);

  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);
  const watchedGeometryType = Form.useWatch('geometryType', form);

  const loadPortOptions = useCallback(async (orgUnitId?: string) => {
    setLoadingPorts(true);
    try {
      const r = await portCRUD.findAll({ page: 1, size: 1000, orgUnitId });
      const list = r.data || (r as any).content || [];
      setPortOptions((orgUnitId ? list.filter((p: any) => p.orgUnitId === orgUnitId) : list).map((p: any) => ({ value: p.id, label: p.portName || p.name || p.id })));
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
      return;
    }
    form.setFieldsValue({ coordinateSystem: 'WGS84', displayRule: 'Độ, phút, giây (DMS)' });
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
  }, [watchedGeometryType, form, isEdit]);

  // Edit mode: prefill dữ liệu hiện tại
  useEffect(() => {
    if (!isEdit || !entityData) return;
    const data = entityData;
    editPortIdRef.current = data.portId;
    if (data.unitId) void loadPortOptions(data.unitId);
    const parsedCoords = parseGisCoordinateList(data.coordinates);
    setCoordinateList(parsedCoords.length > 0 ? parsedCoords : (data.longitude != null && data.latitude != null ? [{ latitude: data.latitude, longitude: data.longitude }] : []));
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
      displayRule: data.displayRule || undefined,
    });
  }, [form, isEdit, entityData, loadPortOptions]);

  const removeCoordinate = (i: number) => { setCoordinateList(p => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))); };
  const addGpsPoint = () => setCoordinateList(p => [...p, { latitude: null, longitude: null }]);
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    // Chặn giá trị vượt ngưỡng khi gõ: độ ≤ 90/180, phút ≤ 59, giây ≤ 59.99 (giống BuoyListPage)
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, dVal ?? 0));
    const mClamped = Math.min(59, Math.max(0, mVal ?? 0));
    const sClamped = Math.min(59.99, Math.max(0, sVal ?? 0));
    const decimal = dClamped + mClamped / 60 + sClamped / 3600;
    setCoordinateList(p => { const n = [...p]; n[i] = { ...n[i], [field === 'lat' ? 'latitude' : 'longitude']: decimal }; return n; });
  };

  const renderDms = (i: number, field: 'lat' | 'lng', record: any) => {
    const v = field === 'lat' ? record.latitude : record.longitude;
    const dms = ddToDms(v);
    const maxD = field === 'lat' ? 90 : 180;
    return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
      <InputNumber value={dms.d} min={0} max={maxD} precision={0} placeholder="Độ" controls={false} onFocus={(e) => e.currentTarget.select()} onChange={(x) => updateGpsPoint(i, field, x ?? 0, dms.m, dms.s)} style={{ flex: 1 }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
      <InputNumber value={dms.m} min={0} max={59} precision={0} placeholder="Phút" controls={false} onFocus={(e) => e.currentTarget.select()} onChange={(x) => updateGpsPoint(i, field, dms.d, x ?? 0, dms.s)} style={{ flex: 1 }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
      <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} controls={false} onFocus={(e) => e.currentTarget.select()} onChange={(x) => updateGpsPoint(i, field, dms.d, dms.m, x ?? 0)} style={{ flex: 1.2 }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span>
    </Space.Compact>;
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
    const manualCoords = coordinateList.filter(c => c.latitude != null && c.longitude != null && !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude))).map(c => ({ latitude: Number(c.latitude), longitude: Number(c.longitude) }));
    const geomType = values.geometryType || undefined;
    // Bỏ validate bắt buộc nhập tọa độ GPS (theo yêu cầu user 2026-08-20):
    // không còn chặn khi thiếu tọa độ dù đã chọn loại đối tượng hay gửi/phê duyệt.
    // Chỉ giữ kiểm tra khoảng hợp lệ (-90..90 / -180..180) khi có tọa độ.
    if (manualCoords.length > 0) {
      if (manualCoords[0].latitude < -90 || manualCoords[0].latitude > 90) {
        toast.error('Vĩ độ phải từ -90° đến 90° (WGS84)'); setActiveTabKey('gis'); return;
      }
      if (manualCoords[0].longitude < -180 || manualCoords[0].longitude > 180) {
        toast.error('Kinh độ phải từ -180° đến 180° (WGS84)'); setActiveTabKey('gis'); return;
      }
    }
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
      const uid = currentUser?.userId;
      let sid: string | undefined;
      if (isEdit && entityData?.id) {
        await updateBuoyStation(entityData.id, p as unknown as CreateBuoyStationRequest);
        sid = entityData.id;
        if (saveAction === 'SUBMIT' || saveAction === 'APPROVED') await submitBuoyStationForApproval(entityData.id);
      } else {
        p.code = code;
        p.action = saveAction === 'DRAFT' ? 'draft' : 'submit';
        const r = await createBuoyStation(p as unknown as CreateBuoyStationRequest);
        sid = (r as { id?: string })?.id;
      }
      if (saveAction === 'APPROVED' && sid) {
        try { if (uid) { await approveBuoyStationL1(sid, uid); await approveBuoyStationL2(sid, uid); } } catch (e) { toast.warning('Đã lưu, nhưng phê duyệt tự động thất bại: ' + (e instanceof Error ? e.message : 'lỗi')); }
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
    { key: 'general', label: 'Thông tin chung', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}><OrgUnitTreeSelect organizations={orgUnitTreeData} placeholder="Chọn đơn vị quản lý" loading={orgUnitOptions.length === 0 && !(organizations && organizations.length > 0)} disabled={isEdit} showPath onChange={() => { form.setFieldsValue({ portId: undefined, code: undefined }); setCoordinateList([]); }} /></Form.Item></Col>
        <Col span={12}><Form.Item name="operatingOrgId" {...labelProps('Đơn vị khai thác')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị khai thác là bắt buộc' }]}><Select placeholder="Chọn đơn vị khai thác..." options={orgUnitOptions} showSearch allowClear filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} style={selectStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="portId" {...labelProps('Thuộc cảng biển')} style={{ marginBottom: spaceFormField }}><Select placeholder={!watchedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : portOptions.length === 0 && !loadingPorts ? 'Không có cảng biển thuộc đơn vị quản lý' : 'Chọn cảng biển...'} loading={loadingPorts} disabled={!watchedOrgUnitId || (portOptions.length === 0 && !loadingPorts)} options={portOptions} showSearch optionFilterProp="label" notFoundContent="Không có cảng biển thuộc đơn vị quản lý" style={selectStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="waterwayId" {...labelProps('Thuộc luồng hàng hải')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Thuộc luồng hàng hải là bắt buộc' }]}><Select placeholder="Chọn luồng hàng hải..." options={waterwayOptions} showSearch allowClear optionFilterProp="label" style={selectStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="waterwayRouteId" {...labelProps('Tuyến luồng hàng hải')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn tuyến luồng hàng hải..." options={routeOptions} showSearch allowClear optionFilterProp="label" style={selectStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="code" {...labelProps('Mã nhà trạm')} style={{ marginBottom: spaceFormField }} tooltip="Mã nhà trạm được sinh tự động khi lưu"><Input disabled maxLength={50} placeholder={codeLoading ? 'Đang sinh mã...' : 'Mã tự động'} style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="name" {...labelProps('Tên nhà trạm')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tên nhà trạm không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]}><Input placeholder="Nhập Tên nhà trạm quản lý vận hành phao, tiêu" maxLength={255} style={inputStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]}><Select placeholder="Chọn địa điểm" showSearch optionFilterProp="label" filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="address" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập Địa điểm chi tiết" maxLength={500} style={inputStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="constructionDate" {...labelProps('Thời điểm xây dựng')} style={{ marginBottom: spaceFormField }}><DatePicker popupClassName="buoy-station-date-picker" placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="totalArea" {...labelProps('Tổng diện tích (m²)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="usableArea" {...labelProps('Diện tích sử dụng (m²)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="staffCount" {...labelProps('Số lượng nhân sự bố trí')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Số lượng nhân sự bố trí là bắt buộc' }]}><InputNumber min={0} precision={0} parser={parseInteger} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="lastMaintenanceYear" {...labelProps('Năm bảo trì gần nhất')} style={{ marginBottom: spaceFormField }}><DatePicker picker="year" popupClassName="buoy-station-date-picker" placeholder="Chọn năm..." format="YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="condition" {...labelProps('Tình trạng')} required style={{ marginBottom: spaceFormField }} initialValue="Chưa khai thác/vận hành" rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}><Select placeholder="Chọn tình trạng" options={CONDITION_OPTIONS} style={selectStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}><Form.Item name="note" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }} rules={[{ max: 1000 }]}><Input.TextArea placeholder="Ghi chú..." maxLength={1000} rows={3} style={{ borderRadius: radiusPill, fontSize: fontSizeMd, resize: 'none' }} /></Form.Item></Col>
      </Row>
    </div>) },
    // Tab 2: Thông tin vị trí (giống BuoyFormContent tab Thông tin vị trí)
    { key: 'gis', label: 'Thông tin vị trí', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}>
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
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}
            rules={watchedGeometryType ? [{ required: true, message: 'Hệ quy chiếu là bắt buộc khi chọn loại đối tượng' }] : []}>
            <Select placeholder="Chọn Hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}
            rules={watchedGeometryType ? [{ required: true, message: 'Quy tắc hiển thị là bắt buộc khi chọn loại đối tượng' }] : []}>
          <Input placeholder="Nhập Quy tắc hiển thị" maxLength={255} disabled style={{ ...inputStyle, color: textTertiary, cursor: 'not-allowed' }} />
          </Form.Item>
        </Col>
      </Row>
      {/* GPS Coordinates (DMS) */}
      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span>
          {watchedGeometryType && <span style={{ color: colors.error, marginLeft: 4, fontSize: fontSizeMd }}>*</span>}
        </span>
        {coordinateList.length > 0 && (
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!watchedGeometryType} style={{ borderRadius: radiusPill }}>
            Thêm tọa độ
          </Button>
        )}
      </div>
      {coordinateList.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!watchedGeometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
        </div>
      ) : (
        <PagedTable dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))} tableProps={{ scroll: { x: 820 } }}>
          <Table.Column title="Vĩ độ (N)" key="lat" render={(_: any, r: any) => renderDms(r._idx, 'lat', r)} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Kinh độ (E)" key="lng" render={(_: any, r: any) => renderDms(r._idx, 'lng', r)} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Thao tác" key="actions" width={80} align="center" render={(_: any, r: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeCoordinate(r._idx)} />} onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
        </PagedTable>
      )}
    </div>) },
    // Tab 3: File đính kèm (giống BuoyFormContent tab File đính kèm)
    { key: 'files', label: 'File đính kèm', children: (<div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
        {(uploadedFiles.length > 0 || existingFiles.length > 0) && (
          <Upload beforeUpload={handleBeforeUpload} showUploadList={false} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple>
            <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
          </Upload>
        )}
      </div>
      {uploadedFiles.length === 0 && existingFiles.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
          <Upload beforeUpload={handleBeforeUpload} showUploadList={false} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple>
            <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
          </Upload>
        </div>
      ) : (
        <PagedTable dataSource={[
          ...uploadedFiles.map(f => ({ uid: f.uid, name: f.name, size: f.size, removable: true })),
          ...existingFiles.map(f => ({ uid: f.id, name: f.fileName || f.name, size: f.fileSize, removable: false })),
        ]} tableProps={{ scroll: { x: 560 } }}>
          <Table.Column title="Tên file" key="name" dataIndex="name" ellipsis={true} render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Thao tác" key="actions" width={80} align="center" render={(_: any, r: any) => r.removable ? <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => setUploadedFiles(p => p.filter(x => x.uid !== r.uid))} /> : null} onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
        </PagedTable>
      )}
      <div style={{ marginTop: spaceSm }}>
        <span style={uploadHintStyle}>Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.</span>
      </div>
    </div>) },
  ];

  return (
    <>
      <style>{`.buoy-station-date-picker .ant-picker-today-btn{color:${colors.info}!important}`}</style>
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }} items={tabItems} />
    </>
  );
});
