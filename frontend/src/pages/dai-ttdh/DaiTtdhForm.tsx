import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Upload, Space, Table,
} from 'antd';
import type { UploadFile } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, FileOutlined } from '@ant-design/icons';
import { colors } from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault,
  fontSizeSm, fontSizeMd, fontWeightMedium, fontWeightBold,
  radiusPill, radiusMd, spaceSm, spaceFormField,
  surfaceCard, uploadHintStyle,
} from '../../tokens';
import { VIETNAM_PROVINCES } from '../../types/common';
import PagedTable from '../../components/list-view/PagedTable';
import type { SaveAction } from '../../types/port';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { daiTtdhCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as IconSymbol } from '../../services/symbolService';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

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

/** Phân loại đài — theo CSV: Đài thông tin duyên hải loại I → V (SelectAppParams). */
export const DAI_TTDH_STATION_LEVEL_OPTIONS = [
  { value: 0, label: 'Đài thông tin duyên hải loại I' },
  { value: 1, label: 'Đài thông tin duyên hải loại II' },
  { value: 2, label: 'Đài thông tin duyên hải loại III' },
  { value: 3, label: 'Đài thông tin duyên hải loại IV' },
  { value: 4, label: 'Đài thông tin duyên hải loại V' },
];

/** Dịch vụ cung cấp — 9 dịch vụ chính thức (user chốt 2026-08-28). */
export const DAI_TTDH_SERVICES_OPTIONS = [
  { value: 'INMARSAT_DISTRESS', label: 'Dịch vụ trực canh cấp cứu INMARSAT (INMARSAT CospasSarsat Distress Watch-keeping Service)' },
  { value: 'COSPAS_SARSAT_DISTRESS', label: 'Dịch vụ trực canh cấp cứu COSPAS-SARSAT (COSPASSARSAT Distress Watch-keeping Service)' },
  { value: 'DSC_DISTRESS', label: 'Dịch vụ trực canh cấp cứu DSC (DSC Distress Watch-keeping Service)' },
  { value: 'RTP_DISTRESS', label: 'Dịch vụ trực canh cấp cứu RTP (RTP Distress Watch-keeping Service)' },
  { value: 'MSI_RTP', label: 'Dịch vụ phát MSI RTP (MSI Broadcasting Service on RTP)' },
  { value: 'MSI_NAVTEX', label: 'Dịch vụ phát MSI NAVTEX (MSI Broadcasting Service via Navtex)' },
  { value: 'MSI_EGC', label: 'Dịch vụ phát MSI EGC (MSI Broadcasting Service via EGC)' },
  { value: 'LRIT', label: 'Dịch vụ thông tin nhận dạng và truy theo tầm xa LRIT (Longrange Identification and Tracking...)' },
  { value: 'MARITIME_INFO_CONNECT', label: 'Dịch vụ kết nối thông tin ngành hàng hải' },
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

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS. */
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

export interface DaiTtdhFormFields {
  orgUnitId?: string;
  daiTtdhCode?: string;
  daiTtdhName?: string;
  operatingUnitId?: string;
  stationLevel?: number;
  provinceId?: string;
  detailedLocation?: string;
  operationalStatus?: string;
  coverageArea?: string;
  servicesProvided?: string[];
  remarks?: string;
  coordinates?: Array<{ latitude: number; longitude: number }>;
  geometryType?: string;
  coordinateSystem?: number;
  displayRule?: string;
  mapSymbolId?: string;
}

export interface DaiTtdhFormProps {
  form: any;
  id?: string;
  onFinish: (saved: boolean) => void;
  /** Báo trạng thái đang lưu cho nút submit bên ngoài (hiển thị loading tròn trên nút được bấm) */
  onSubmittingChange?: (submitting: boolean) => void;
}

export default forwardRef(function DaiTtdhForm({ form, id, onFinish, onSubmittingChange }: DaiTtdhFormProps, ref) {
  const isEdit = !!id;
  const [, setSubmitting] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = (currentUser?.permissions?.includes('admin:all') || currentUser?.permissions?.includes('*')) ?? false;
  const editOrgUnitRef = useRef<string | undefined>(undefined);

  const watchedGeometryType = Form.useWatch('geometryType', form);

  /** true khi field đã đạt đủ max ký tự — bật viền đỏ ô nhập + message bên dưới. */
  const useMaxReached = (name: string, max: number): boolean => {
    const raw = Form.useWatch(name, form) ?? '';
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };
  const atMax = {
    daiTtdhName: useMaxReached('daiTtdhName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    coverageArea: useMaxReached('coverageArea', 2000),
    remarks: useMaxReached('remarks', 2000),
  };

  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [symbols, setSymbols] = useState<IconSymbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ latitude: number | null; longitude: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [, setExistingFiles] = useState<any[]>([]);

  useEffect(() => { symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => setSymbols(r.data || [])).catch(() => {}); }, []);
  useEffect(() => { setLoadingOrgs(true); organizationService.list({ pageSize: 1000 }).then(r => setOrgUnits(r.data || [])).catch(() => {}).finally(() => setLoadingOrgs(false)); }, []);
  useEffect(() => { api.get('/common/options/operating-units').then(r => { const list = r.data?.data; if (Array.isArray(list) && list.length) setOperatingOrgs(list); }).catch(() => {}); }, []);

  // Sinh mã tự động DTTDH-{seq} + Tình trạng mặc định "Chưa khai thác" — xử lý ở ListPage afterOpenChange (sau resetFields)
  useEffect(() => {
    if (isEdit) return;
    form.setFieldsValue({ operationalStatus: 'NOT_YET_OPERATIONAL' });
  }, [isEdit, form]);

  // Khi chọn loại đối tượng → tự set hệ quy chiếu, quy tắc hiển thị và thêm sẵn số dòng tọa độ tương ứng
  useEffect(() => {
    if (!watchedGeometryType) return;
    form.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
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

  // Edit mode: load existing
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data: any = await daiTtdhCRUD.findById(id);
        const ec = data.coordinates ? parseGisCoordinates({ geometryType: data.geometryType, coordinates: data.coordinates }) : [];
        setCoordinateList(ec.length > 0 ? ec.map(c => ({ latitude: c.latitude, longitude: c.longitude })) : data.latitude != null ? [{ latitude: data.latitude, longitude: data.longitude }] : []);
        try {
          const fr = await api.get(`/v1/dai-ttdh/${id}/attachments`, { params: { page: 0, size: 50 } });
          const files = fr.data?.data || [];
          setExistingFiles(files);
          setUploadedFiles(files.map((a: any) => ({ uid: a.id, name: a.fileName || a.name, size: a.fileSize, status: 'done' as const })));
        } catch { setExistingFiles([]); }
        editOrgUnitRef.current = data.orgUnitId;
        form.setFieldsValue({
          orgUnitId: data.orgUnitId,
          daiTtdhCode: data.daiTtdhCode, daiTtdhName: data.daiTtdhName,
          operatingUnitId: data.operatingUnitId, stationLevel: data.stationLevel,
          provinceId: data.provinceId ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined : undefined,
          detailedLocation: data.detailedLocation,
          operationalStatus: data.operationalStatus || undefined,
          coverageArea: data.coverageArea, remarks: data.remarks,
          servicesProvided: data.servicesProvided ? data.servicesProvided.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          geometryType: data.geometryType || undefined, mapSymbolId: data.mapSymbolId, coordinateSystem: data.coordinateSystem, displayRule: data.displayRule,
        });
      } catch { toast.error('Không thể tải thông tin đài TTDH'); }
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

  const handleOrgUnitChange = () => { setCoordinateList([]); };

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    const values = form.getFieldsValue();
    try { await form.validateFields(); } catch (e: any) {
      const errFields: Array<{ name: Array<string | number> }> = e?.errorFields ?? [];
      if (errFields.some((f) => f.name[0] === 'orgUnitId' || f.name[0] === 'daiTtdhName' || f.name[0] === 'stationLevel' || f.name[0] === 'provinceId' || f.name[0] === 'detailedLocation' || f.name[0] === 'operationalStatus')) setActiveTabKey('general');
      else if (errFields.some((f) => f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule' || f.name[0] === 'geometryType')) setActiveTabKey('location');
      return false;
    }
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
        orgUnitId: values.orgUnitId,
        daiTtdhCode: String(values.daiTtdhCode || '').trim() || undefined, daiTtdhName: String(values.daiTtdhName || '').trim(),
        operatingUnitId: values.operatingUnitId || undefined,
        stationLevel: values.stationLevel != null ? Number(values.stationLevel) : undefined,
        provinceId: values.provinceId ? VIETNAM_PROVINCES.indexOf(values.provinceId) + 1 : undefined,
        detailedLocation: String(values.detailedLocation || '').trim() || undefined,
        operationalStatus: values.operationalStatus || undefined,
        coverageArea: values.coverageArea || undefined,
        servicesProvided: Array.isArray(values.servicesProvided) && values.servicesProvided.length > 0 ? values.servicesProvided.join(',') : undefined,
        remarks: values.remarks || undefined,
        latitude: manualCoords.length > 0 ? manualCoords[0].latitude : undefined,
        longitude: manualCoords.length > 0 ? manualCoords[0].longitude : undefined,
        coordinates: manualCoords.length > 1 ? `MULTIPOINT(${manualCoords.map(c => `(${c.longitude} ${c.latitude})`).join(',')})` : manualCoords.length === 1 ? `POINT(${manualCoords[0].longitude} ${manualCoords[0].latitude})` : undefined,
        geometryType: values.geometryType || undefined, mapSymbolId: values.mapSymbolId || undefined,
        coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null ? Number(values.displayRule) : undefined,
      };
      if (saveAction !== 'UPDATE') (payload as any).saveAction = saveAction;
      Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
      let createdId: string | undefined;
      if (isEdit && id) { await daiTtdhCRUD.update({ ...payload, id } as any); createdId = id; }
      else { const res: any = await daiTtdhCRUD.create(payload as any); createdId = res?.id ?? res?.data?.id; }
      if (createdId && uploadedFiles.length > 0) {
        for (const fi of uploadedFiles) {
          const of = fi.originFileObj as File;
          if (!of) continue;
          const fd = new FormData();
          fd.append('files', of);
          await api.post(`/v1/dai-ttdh/${createdId}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
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
    { key: 'general', label: 'Thông tin chung', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị quản lý không được để trống' }]}>
            <OrgUnitTreeSelect organizations={orgUnits} placeholder="Chọn đơn vị quản lý..." loading={loadingOrgs} disabled={isEdit && !isSystemAdmin} showPath treeDefaultExpandAll={false} onChange={handleOrgUnitChange} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="operatingUnitId" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn đơn vị khai thác..." allowClear showSearch optionFilterProp="label" options={operatingOrgs.map(o => ({ value: o.id, label: o.name || o.code }))} style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="daiTtdhCode" {...labelProps('Mã đài')} style={{ marginBottom: spaceFormField }} tooltip="Mã đài được sinh tự động">
            <Input disabled placeholder="Tự sinh DTTDH-..." style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="daiTtdhName" {...labelProps('Tên đài')} style={{ marginBottom: spaceFormField }}
            rules={[{ required: true, message: 'Tên đài không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]}
            validateStatus={atMax.daiTtdhName ? 'error' : undefined} help={atMax.daiTtdhName ? 'Đã đạt tối đa 255 ký tự' : undefined}>
            <Input placeholder="Nhập tên đài" maxLength={255} style={inputStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="stationLevel" {...labelProps('Phân loại đài')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Phân loại đài không được để trống' }]}>
            <Select placeholder="Chọn phân loại đài" options={DAI_TTDH_STATION_LEVEL_OPTIONS} style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/TP)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Địa điểm (Tỉnh/TP) không được để trống' }]}>
            <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))} style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} required style={{ marginBottom: spaceFormField }}
            rules={[{ required: true, message: 'Địa điểm chi tiết không được để trống' }, { max: 500, message: 'Tối đa 500 ký tự' }]}
            validateStatus={atMax.detailedLocation ? 'error' : undefined} help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}>
            <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="operationalStatus" {...labelProps('Tình trạng')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tình trạng không được để trống' }]}>
            <Select placeholder="Chọn tình trạng" options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="servicesProvided" {...labelProps('Dịch vụ cung cấp')} style={{ marginBottom: spaceFormField }}>
            <Select mode="multiple" placeholder="Chọn dịch vụ cung cấp" allowClear options={DAI_TTDH_SERVICES_OPTIONS} style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="coverageArea" {...labelProps('Vùng phủ sóng')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.coverageArea ? 'error' : undefined} help={atMax.coverageArea ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
            <Input.TextArea rows={3} maxLength={2000} placeholder="Nhập vùng phủ sóng" style={{ borderRadius: radiusPill, height: 'auto' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="remarks" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.remarks ? 'error' : undefined} help={atMax.remarks ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
            <Input.TextArea rows={3} maxLength={2000} placeholder="Nhập ghi chú" style={{ borderRadius: radiusPill, height: 'auto' }} />
          </Form.Item>
        </Col>
      </Row>
    </div>) },
    // Tab 2: Thông tin vị trí (tên tab giống Quản lý bến phao)
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
        <span><span style={sectionLabelStyle}>Tọa độ</span></span>
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
    // Tab 3: File đính kèm
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
    <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabItems} />
  );
});
