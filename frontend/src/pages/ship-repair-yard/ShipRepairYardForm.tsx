import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Upload, Space, Table,
} from 'antd';
import type { UploadFile } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, FileOutlined } from '@ant-design/icons';
import { colors } from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault, actionPrimary,
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
import { shipRepairYardCRUD, portCRUD, pierCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
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

// ── Danh mục đặc thù cơ sở sửa chữa, đóng tàu — user cung cấp 2026-08-27 (đã chốt) ──
export const USAGE_FUNCTION_OPTIONS = [
  { value: 'Sửa chữa và bảo trì tàu', label: 'Sửa chữa và bảo trì tàu' },
  { value: 'Cải tạo và nâng cấp tàu', label: 'Cải tạo và nâng cấp tàu' },
  { value: 'Làm mới hoặc sơn tàu', label: 'Làm mới hoặc sơn tàu' },
  { value: 'Kiểm tra và đánh giá tàu', label: 'Kiểm tra và đánh giá tàu' },
  { value: 'Lắp đặt các thiết bị mới', label: 'Lắp đặt các thiết bị mới' },
  { value: 'Hỗ trợ về các yêu cầu pháp lý và chứng nhận', label: 'Hỗ trợ về các yêu cầu pháp lý và chứng nhận' },
  { value: 'Đào tạo và hỗ trợ kỹ thuật', label: 'Đào tạo và hỗ trợ kỹ thuật' },
];
export const VESSEL_TYPE_OPTIONS = [
  { value: 'Tàu thương mại', label: 'Tàu thương mại' },
  { value: 'Tàu du lịch', label: 'Tàu du lịch' },
  { value: 'Tàu dân dụng và cảng', label: 'Tàu dân dụng và cảng' },
];
export const BUSINESS_TYPE_OPTIONS = [
  { value: 'Doanh nghiệp đóng tàu', label: 'Doanh nghiệp đóng tàu' },
  { value: 'Doanh nghiệp sửa chữa và bảo dưỡng tàu', label: 'Doanh nghiệp sửa chữa và bảo dưỡng tàu' },
  { value: 'Doanh nghiệp tư vấn và công nghệ tàu', label: 'Doanh nghiệp tư vấn và công nghệ tàu' },
  { value: 'Doanh nghiệp cho thuê tàu', label: 'Doanh nghiệp cho thuê tàu' },
  { value: 'Doanh nghiệp quản lý và vận hành tàu', label: 'Doanh nghiệp quản lý và vận hành tàu' },
];
export const ACTIVITY_OPTIONS = [
  { value: 'Đóng mới', label: 'Đóng mới' },
  { value: 'Sửa chữa', label: 'Sửa chữa' },
  { value: 'Phá dỡ', label: 'Phá dỡ' },
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

export interface ShipRepairYardFormFields {
  orgUnitId?: string;
  portId?: string;
  shipRepairYardCode?: string;
  shipRepairYardName?: string;
  pierId?: string;
  provinceId?: number;
  detailedLocation?: string;
  operationalStatus?: string;
  usageFunction?: string;
  workshopArea?: number;
  vesselType?: string;
  vesselDwt?: string;
  businessType?: string;
  activity?: string;
  slipwayCount?: number;
  remarks?: string;
  coordinates?: Array<{ latitude: number; longitude: number }>;
  geometryType?: string;
  coordinateSystem?: number;
  displayRule?: string;
  mapSymbolId?: string;
}

export interface ShipRepairYardFormProps {
  form: any;
  id?: string;
  onFinish: (saved: boolean) => void;
  /** Báo trạng thái đang lưu cho nút submit bên ngoài (hiển thị loading tròn trên nút được bấm) */
  onSubmittingChange?: (submitting: boolean) => void;
}

export default forwardRef(function ShipRepairYardForm({ form, id, onFinish, onSubmittingChange }: ShipRepairYardFormProps, ref) {
  const isEdit = !!id;
  const [, setSubmitting] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [specialOpen, setSpecialOpen] = useState(true);
  const [shipRepairYardCodeLoading, setShipRepairYardCodeLoading] = useState(false);
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
    shipRepairYardName: useMaxReached('shipRepairYardName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    vesselDwt: useMaxReached('vesselDwt', 20),
    remarks: useMaxReached('remarks', 2000),
    workshopArea: useMaxReached('workshopArea', 20),
    slipwayCount: useMaxReached('slipwayCount', 5),
  };

  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [portOptions, setPortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [pierOptions, setPierOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [symbols, setSymbols] = useState<IconSymbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ latitude: number | null; longitude: number | null }>>([]);
  const [gpsError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [, setExistingFiles] = useState<any[]>([]);

  useEffect(() => { symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => setSymbols(r.data || [])).catch(() => {}); }, []);
  useEffect(() => { setLoadingOrgs(true); organizationService.list({ pageSize: 1000 }).then(r => setOrgUnits(r.data || [])).catch(() => {}).finally(() => setLoadingOrgs(false)); }, []);

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

  // ── Thuộc cầu cảng: load cầu cảng APPROVED theo cảng biển đã chọn ──
  const loadPierOptions = async (portId: string) => {
    try {
      const r = await pierCRUD.search({ portId, approvalStatus: 'APPROVED', page: 1, pageSize: 1000 });
      setPierOptions((r.data || []).map((p: any) => ({ value: p.id, label: p.pierName || p.name || p.id })));
    } catch { setPierOptions([]); }
  };

  useEffect(() => { if (watchedOrgUnitId) { if (!isEdit || !form.getFieldValue('portId')) form.setFieldsValue({ portId: undefined, shipRepairYardCode: undefined, pierId: undefined }); loadPortOptions(watchedOrgUnitId); } }, [watchedOrgUnitId]);

  useEffect(() => {
    if (!watchedPortId) return;
    form.setFieldsValue({ pierId: undefined });
    loadPierOptions(watchedPortId);
    if (isEdit && editPortIdRef.current === watchedPortId) return;
    setShipRepairYardCodeLoading(true);
    shipRepairYardCRUD.generateCode(watchedPortId)
      .then((res: any) => { if (res?.shipRepairYardCode) form.setFieldsValue({ shipRepairYardCode: res.shipRepairYardCode }); })
      .catch(() => {})
      .finally(() => setShipRepairYardCodeLoading(false));
  }, [watchedPortId]);

  useEffect(() => { if (!isSystemAdmin && !isEdit) { api.get('/users/me').then(r => { const p = r.data?.data ?? r.data; if (p?.orgUnitId) form.setFieldsValue({ orgUnitId: p.orgUnitId }); }).catch(() => {}); } }, []);

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
        const data: any = await shipRepairYardCRUD.findById(id);
        const ec = data.coordinates ? parseGisCoordinates({ geometryType: data.geometryType, coordinates: data.coordinates }) : [];
        setCoordinateList(ec.length > 0 ? ec.map(c => ({ latitude: c.latitude, longitude: c.longitude })) : data.latitude != null ? [{ latitude: data.latitude, longitude: data.longitude }] : []);
        if (data.orgUnitId) await loadPortOptions(data.orgUnitId);
        if (data.portId) await loadPierOptions(data.portId);
        try {
          const fr = await api.get(`/v1/ship-repair-yard/${id}/attachments`, { params: { page: 0, size: 50 } });
          const files = fr.data?.data || [];
          setExistingFiles(files);
          setUploadedFiles(files.map((a: any) => ({ uid: a.id, name: a.fileName || a.name, size: a.fileSize, status: 'done' as const })));
        } catch { setExistingFiles([]); }
        editPortIdRef.current = data.portId;
        form.setFieldsValue({
          orgUnitId: data.orgUnitId, portId: data.portId,
          shipRepairYardCode: data.shipRepairYardCode, shipRepairYardName: data.shipRepairYardName,
          pierId: data.pierId,
          provinceId: data.provinceId ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined : undefined,
          detailedLocation: data.detailedLocation,
          operationalStatus: data.operationalStatus || undefined,
          usageFunction: data.usageFunction, workshopArea: data.workshopArea,
          vesselType: data.vesselType, vesselDwt: data.vesselDwt,
          businessType: data.businessType, activity: data.activity,
          slipwayCount: data.slipwayCount, remarks: data.remarks,
          geometryType: data.geometryType || undefined, mapSymbolId: data.mapSymbolId, coordinateSystem: data.coordinateSystem, displayRule: data.displayRule,
        });
      } catch { toast.error('Không thể tải thông tin cơ sở sửa chữa, đóng tàu'); }
    })();
  }, [isEdit, id]);

  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB, vui lòng chọn file khác'); return false; }
    setUploadedFiles(p => [...p, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file as any }]);
    return false;
  };

  const addGpsPoint = () => setCoordinateList(prev => [...prev, { latitude: null, longitude: null }]);
  const removeCoordinate = (idx: number) => setCoordinateList(prev => prev.filter((_, i) => i !== idx));

  const updateGpsPoint = useCallback((idx: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    setCoordinateList(prev => {
      const next = prev.map((c, i) => (i === idx ? { ...c } : c));
      const point = next[idx];
      if (!point) return prev;
      const dd = (d ?? 0) + (m ?? 0) / 60 + (s ?? 0) / 3600;
      if (field === 'lat') point.latitude = dd === 0 ? null : dd; else point.longitude = dd === 0 ? null : dd;
      return next;
    });
  }, []);

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    let values: any;
    try { values = await form.validateFields(); }
    catch { return false; }
    const manualCoords = coordinateList.filter(c => c.latitude != null && c.longitude != null);
    if (values.geometryType && manualCoords.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 tọa độ GPS');
      return;
    }
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      const toNumber = (v: unknown): number | undefined => (v != null && !isNaN(Number(v)) ? Number(v) : undefined);
      const payload: Record<string, unknown> = {
        orgUnitId: values.orgUnitId, portId: values.portId,
        shipRepairYardCode: String(values.shipRepairYardCode || '').trim() || undefined, shipRepairYardName: String(values.shipRepairYardName || '').trim(),
        pierId: values.pierId || undefined,
        provinceId: values.provinceId ? VIETNAM_PROVINCES.indexOf(values.provinceId) + 1 : undefined,
        detailedLocation: values.detailedLocation || undefined,
        operationalStatus: values.operationalStatus || undefined,
        usageFunction: values.usageFunction || undefined,
        workshopArea: toNumber(values.workshopArea),
        vesselType: values.vesselType || undefined,
        vesselDwt: values.vesselDwt || undefined,
        businessType: values.businessType || undefined,
        activity: values.activity || undefined,
        slipwayCount: toNumber(values.slipwayCount),
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
      if (isEdit && id) { await shipRepairYardCRUD.update({ ...payload, id } as any); createdId = id; }
      else { const res: any = await shipRepairYardCRUD.create(payload as any); createdId = res?.id ?? res?.data?.id; }
      if (createdId && uploadedFiles.length > 0) {
        for (const fi of uploadedFiles) {
          const of = fi.originFileObj as File;
          if (!of) continue;
          const fd = new FormData();
          fd.append('files', of);
          await api.post(`/v1/ship-repair-yard/${createdId}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
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
            <OrgUnitTreeSelect organizations={orgUnits} placeholder="Chọn đơn vị quản lý..." loading={loadingOrgs} disabled={isEdit || !isSystemAdmin} showPath treeDefaultExpandAll={false} />
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
          <Form.Item name="pierId" {...labelProps('Thuộc cầu cảng')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder={!watchedPortId ? 'Vui lòng chọn cảng biển trước' : pierOptions.length === 0 ? 'Không có cầu cảng được phê duyệt' : 'Chọn cầu cảng...'}
              disabled={!watchedPortId || pierOptions.length === 0} options={pierOptions} showSearch allowClear optionFilterProp="label" notFoundContent="Không có cầu cảng được phê duyệt" style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="shipRepairYardCode" {...labelProps('Mã cơ sở sửa chữa, đóng tàu')} style={{ marginBottom: spaceFormField }} tooltip="Mã cơ sở sửa chữa, đóng tàu được sinh tự động">
            <Input disabled placeholder={shipRepairYardCodeLoading ? 'Đang sinh mã...' : watchedPortId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã'} style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="shipRepairYardName" {...labelProps('Tên cơ sở sửa chữa, đóng tàu')} style={{ marginBottom: spaceFormField }}
            rules={[{ required: true, message: 'Tên cơ sở sửa chữa, đóng tàu không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]}
            validateStatus={atMax.shipRepairYardName ? 'error' : undefined} help={atMax.shipRepairYardName ? 'Đã đạt tối đa 255 ký tự' : undefined}>
            <Input placeholder="Nhập tên cơ sở sửa chữa, đóng tàu" maxLength={255} style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) không được để trống' }]}>
            <Select placeholder="Chọn địa điểm" showSearch optionFilterProp="label"
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Địa điểm chi tiết không được để trống' }]}
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
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, marginBottom: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setSpecialOpen(!specialOpen)}>
        <span style={{ color: specialOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{specialOpen ? '▼' : '▶'} Thông tin đặc thù cơ sở sửa chữa, đóng tàu</span>
      </button>
      {specialOpen && (<div>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="usageFunction" {...labelProps('Công năng sử dụng')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn công năng sử dụng" options={USAGE_FUNCTION_OPTIONS} showSearch allowClear optionFilterProp="label" style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="workshopArea" {...labelProps('Diện tích nhà xưởng, kho bãi')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.workshopArea ? 'error' : undefined} help={atMax.workshopArea ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="vesselType" {...labelProps('Loại tàu đóng mới, sửa chữa')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn loại tàu đóng mới, sửa chữa" options={VESSEL_TYPE_OPTIONS} showSearch allowClear optionFilterProp="label" style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="vesselDwt" {...labelProps('Cỡ tàu')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.vesselDwt ? 'error' : undefined} help={atMax.vesselDwt ? 'Đã đạt tối đa 20 ký tự' : undefined}>
            <Input placeholder="Nhập cỡ tàu" maxLength={20} style={inputStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="businessType" {...labelProps('Loại hình doanh nghiệp')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn loại hình doanh nghiệp" options={BUSINESS_TYPE_OPTIONS} showSearch allowClear optionFilterProp="label" style={selectStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="activity" {...labelProps('Hoạt động')} style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn hoạt động" options={ACTIVITY_OPTIONS} showSearch allowClear optionFilterProp="label" style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="slipwayCount" {...labelProps('Số lượng triền đà')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.slipwayCount ? 'error' : undefined} help={atMax.slipwayCount ? 'Đã đạt tối đa 5 ký tự' : undefined}>
            <InputNumber min={0} placeholder="0" maxLength={5} style={numberInputStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="remarks" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}
            validateStatus={atMax.remarks ? 'error' : undefined} help={atMax.remarks ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
            <Input.TextArea rows={2} maxLength={2000} placeholder="Nhập ghi chú" style={{ borderRadius: radiusPill, height: 'auto' }} />
          </Form.Item>
        </Col>
      </Row>
      </div>)}
    </div>) },
    // Tab 2: Thông tin vị trí
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
    <>
      <style>{`.ship-repair-yard-filter .ant-select-selector { border-radius: 999px !important; } .ship-repair-yard-filter .ant-select-content { flex-wrap: nowrap !important; overflow: hidden; } .ship-repair-yard-filter .ant-select-content-item { max-width: 45% !important; } .ship-repair-yard-filter .ant-select-selection-item { border-radius: 999px !important; }`}</style>
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }} items={tabItems} />
    </>
  );
});
