import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import dayjs from 'dayjs';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Upload, Space, DatePicker, Table, message,
} from 'antd';
import type { UploadFile } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, FileOutlined } from '@ant-design/icons';
import { colors } from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault,
  fontSizeSm, fontSizeMd, fontWeightMedium, fontWeightBold,
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField, spaceMd,
  surfaceCard, uploadHintStyle,
} from '../../tokens';
import { VIETNAM_PROVINCES } from '../../types/common';
import { BERTH_ACTIVITY_STATUS_MAP } from '../../types/port';
import type { Berth, SaveAction } from '../../types/port';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService } from '../../services/organizationService';
import { berthCRUD, portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import type { Symbol } from '../../services/symbolService';
import { useAuthStore } from '../../store/authStore';

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Bến nước' }, { value: 2, label: 'Bến bờ' },
  { value: 3, label: 'Bến phao' }, { value: 4, label: 'Bến chuyên dùng' },
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
    const mm = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* ignore */ }
  return [];
};

function ddToDms(dd: number): { d: number; m: number; s: number } {
  if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs); const m = Math.floor((abs - d) * 60);
  const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
  return { d, m, s };
}

export interface BerthFormProps {
  form: any;
  id?: string;
  onFinish: (saved: boolean) => void;
}

export default forwardRef(function BerthForm({ form, id, onFinish }: BerthFormProps, ref) {
  const isEdit = !!id;
  const [submitting, setSubmitting] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [berthCodeLoading, setBerthCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('admin:manage') ?? false;
  const editPortIdRef = useRef<string | undefined>();

  const watchedGeometryType = Form.useWatch('geometryType', form);
  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);

  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [portOptions, setPortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [channelOptions, setChannelOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ latitude: number | null; longitude: number | null }>>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

  useEffect(() => { symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => setSymbols(r.data || [])).catch(() => {}); }, []);
  useEffect(() => { setLoadingOrgs(true); organizationService.list({ pageSize: 1000 }).then(r => setOrgUnitOptions((r.data || []).map((o: any) => ({ value: o.id, label: o.name })))).catch(() => {}).finally(() => setLoadingOrgs(false)); }, []);
  // TODO: Tạm comment vì lỗi DB thiếu cột is_deleted — bỏ comment sau khi chạy migration V20260811155000
  // useEffect(() => { navigationChannelCRUD.search({ page: 1, pageSize: 1000 }).then(r => setChannelOptions((r.data || []).map((c: any) => ({ value: c.id, label: c.channelName || c.name || c.id })))).catch(() => {}); }, []);
  useEffect(() => { setChannelOptions([]); }, []);

  const loadPortOptions = async (orgUnitId: string) => {
    setLoadingPorts(true);
    try {
      const params: any = { page: 1, pageSize: 1000, approvalStatus: 'APPROVED' };
      if (orgUnitId) params.managingUnitId = orgUnitId;
      const r = await portCRUD.search(params);
      const ports = (r.data || []).map((p: any) => ({ value: p.id, label: p.portName || p.name || p.id }));
      setPortOptions(ports);
      if (ports.length === 0) toast.warning('Đơn vị quản lý chưa có cảng biển được phê duyệt');
    } catch { setPortOptions([]); }
    finally { setLoadingPorts(false); }
  };

  useEffect(() => { if (watchedOrgUnitId) { if (!isEdit || !form.getFieldValue('portId')) form.setFieldsValue({ portId: undefined, berthCode: undefined }); loadPortOptions(watchedOrgUnitId); } }, [watchedOrgUnitId]);

  useEffect(() => { if (!watchedPortId || (isEdit && editPortIdRef.current === watchedPortId)) return; setBerthCodeLoading(true); api.get('/v1/berths/generate-code', { params: { portId: watchedPortId } }).then(r => { const c = r.data?.data?.berthCode ?? r.data?.data?.portCode ?? r.data?.data; if (c) form.setFieldsValue({ berthCode: c }); }).catch(() => {}).finally(() => setBerthCodeLoading(false)); }, [watchedPortId]);

  useEffect(() => { if (!isSystemAdmin && !isEdit) { api.get('/users/me').then(r => { const p = r.data?.data ?? r.data; if (p?.orgUnitId) form.setFieldsValue({ orgUnitId: p.orgUnitId }); }).catch(() => {}); } }, []);

  // Khi chọn loại đối tượng → tự set hệ quy chiếu, quy tắc hiển thị và thêm sẵn số dòng tọa độ tương ứng
  useEffect(() => {
    if (!watchedGeometryType) return;
    form.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    // Form thêm mới: điểm → 1 tọa độ, đường → 2 tọa độ, vùng → 3 tọa độ
    if (!isEdit) {
      const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 0;
      setCoordinateList(Array.from({ length: count }, () => ({ latitude: null, longitude: null })));
    }
  }, [watchedGeometryType]);

  // Edit mode: load existing
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data: Berth = await berthCRUD.findById(id);
        const ec = data.coordinates ? parseGisCoordinates({ geometryType: data.geometryType, coordinates: data.coordinates }) : [];
        setCoordinateList(ec.length > 0 ? ec.map(c => ({ latitude: c.latitude, longitude: c.longitude })) : data.latitude != null ? [{ latitude: data.latitude, longitude: data.longitude }] : []);
        if (data.orgUnitId) await loadPortOptions(data.orgUnitId);
        try { const fr = await api.get(`/v1/berths/${id}/attachments`, { params: { page: 0, size: 50 } }); const files = fr.data?.data || []; setExistingFiles(files); setUploadedFiles(files.map((a: any) => ({ uid: a.id, name: a.fileName || a.name, size: a.fileSize, status: 'done' as const }))); } catch { setExistingFiles([]); }
        editPortIdRef.current = data.portId;
        form.setFieldsValue({
          orgUnitId: data.orgUnitId, portId: data.portId, berthCode: data.berthCode, berthName: data.berthName,
          waterway: data.waterway, operator: data.operator,
          provinceId: data.provinceId ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined : undefined,
          detailedLocation: data.detailedLocation, structureType: data.structureType, operationalFunction: data.operationalFunction,
          totalArea: data.totalArea, designThroughput: data.designThroughput, currentThroughput: data.currentThroughput,
          maxVesselSize: data.maxVesselSize, plannedThroughput: data.plannedThroughput, latestCargoVolume: data.latestCargoVolume,
          operationalStatus: data.operationalStatus || undefined,
          openingAnnouncementDate: data.openingAnnouncementDate ? dayjs(data.openingAnnouncementDate) : undefined,
          openingDecision: data.openingDecision, investmentAgreement: data.investmentAgreement,
          geometryType: data.geometryType || undefined, mapSymbolId: data.mapSymbolId, coordinateSystem: data.coordinateSystem, displayRule: data.displayRule,
        });
      } catch { toast.error('Không thể tải thông tin bến cảng'); }
    })();
  }, [isEdit, id]);

  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) { message.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { message.error('Định dạng không hỗ trợ'); return false; }
    if (uploadedFiles.length >= 10) { message.error('Tối đa 10 file'); return false; }
    setUploadedFiles(p => [...p, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file }]);
    return false;
  };
  const removeCoordinate = (i: number) => { setCoordinateList(p => p.filter((_, idx) => idx !== i)); };
  const addGpsPoint = () => setCoordinateList(p => [...p, { latitude: null, longitude: null }]);
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number, mVal: number, sVal: number) => {
    const decimal = dVal + mVal / 60 + sVal / 3600;
    setCoordinateList(p => { const n = [...p]; n[i] = { ...n[i], [field === 'lat' ? 'latitude' : 'longitude']: decimal }; return n; });
  };

  const handleSave = async (saveAction: SaveAction) => {
    const values = form.getFieldsValue();
    const berthName = String(values.berthName ?? '').trim();
    try { await form.validateFields(); } catch (e: any) {
      const errFields: Array<{ name: Array<string | number> }> = e?.errorFields ?? [];
      if (errFields.some((f) => f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule' || f.name[0] === 'geometryType')) setActiveTabKey('location');
      return;
    }
    const manualCoords = coordinateList.filter(c => c.latitude != null && c.longitude != null && !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude))).map(c => ({ latitude: Number(c.latitude), longitude: Number(c.longitude) }));
    if (values.geometryType) {
      const requiredCoords = GEOMETRY_POINT_COUNT[values.geometryType] ?? 1;
      if (coordinateList.length === 0 || manualCoords.length < requiredCoords) { toast.error(`Loại đối tượng đã chọn yêu cầu ít nhất ${requiredCoords} tọa độ GPS.`); return; }
    }
    setSubmitting(true);
    try {
      const provinceName: string | undefined = values.provinceId;
      const payload: Record<string, unknown> = {
        berthCode: String(values.berthCode || '').trim() || undefined, berthName, portId: values.portId, orgUnitId: values.orgUnitId,
        waterway: values.waterway || undefined,
        latitude: manualCoords.length > 0 ? manualCoords[0].latitude : undefined,
        longitude: manualCoords.length > 0 ? manualCoords[0].longitude : undefined,
        coordinates: manualCoords.length > 1 ? `MULTIPOINT(${manualCoords.map(c => `(${c.longitude} ${c.latitude})`).join(',')})` : manualCoords.length === 1 ? `POINT(${manualCoords[0].longitude} ${manualCoords[0].latitude})` : undefined,
        operator: values.operator || undefined, provinceId: provinceName ? VIETNAM_PROVINCES.indexOf(provinceName) + 1 : undefined,
        detailedLocation: values.detailedLocation || undefined, structureType: values.structureType != null ? Number(values.structureType) : undefined,
        operationalFunction: values.operationalFunction || undefined,
        totalArea: values.totalArea != null && !isNaN(Number(values.totalArea)) ? Number(values.totalArea) : undefined,
        designThroughput: values.designThroughput != null && !isNaN(Number(values.designThroughput)) ? Number(values.designThroughput) : undefined,
        currentThroughput: values.currentThroughput != null && !isNaN(Number(values.currentThroughput)) ? Number(values.currentThroughput) : undefined,
        maxVesselSize: values.maxVesselSize != null && !isNaN(Number(values.maxVesselSize)) ? Number(values.maxVesselSize) : undefined,
        plannedThroughput: values.plannedThroughput != null && !isNaN(Number(values.plannedThroughput)) ? Number(values.plannedThroughput) : undefined,
        latestCargoVolume: values.latestCargoVolume != null && !isNaN(Number(values.latestCargoVolume)) ? Number(values.latestCargoVolume) : undefined,
        operationalStatus: values.operationalStatus || undefined,
        openingAnnouncementDate: values.openingAnnouncementDate ? (typeof values.openingAnnouncementDate === 'string' ? values.openingAnnouncementDate : values.openingAnnouncementDate.format('YYYY-MM-DD') + 'T00:00:00') : undefined,
        openingDecision: values.openingDecision || undefined, investmentAgreement: values.investmentAgreement || undefined,
        mapSymbolId: values.mapSymbolId || undefined, coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null ? Number(values.displayRule) : undefined,
      };
      if (saveAction !== 'UPDATE') (payload as any).saveAction = saveAction;
      Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
      let createdBerthId: string | undefined;
      if (isEdit && id) { await api.put('/v1/berths', { ...payload, id }); createdBerthId = id; }
      else { const res = await api.post('/v1/berths', payload); createdBerthId = res.data?.data?.id ?? res.data?.id; }
      if (createdBerthId && uploadedFiles.length > 0) {
        for (const fi of uploadedFiles) {
          const of = fi.originFileObj as File;
          if (!of) continue;
          const fd = new FormData();
          fd.append('files', of);
          await api.post(`/v1/berths/${createdBerthId}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
        }
      }
      toast.success(saveAction === 'DRAFT' ? 'Lưu tạm thành công' : saveAction === 'APPROVED' ? 'Phê duyệt thành công' : saveAction === 'UPDATE' ? 'Cập nhật thành công' : 'Gửi phê duyệt thành công');
      onFinish(true);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra'); } finally { setSubmitting(false); }
  };

  const handleOrgUnitChange = () => { form.setFieldsValue({ portId: undefined, berthCode: undefined }); setCoordinateList([]); };

  const tabItems = [
    // Tab 1: Thông tin chung (17 trường gồm cả năng lực)
    { key: 'general', label: 'Thông tin chung', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}><Col span={12}><Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}><Select placeholder="Chọn đơn vị quản lý" loading={loadingOrgs} disabled={isEdit || !isSystemAdmin} options={orgUnitOptions} showSearch optionFilterProp="label" onChange={handleOrgUnitChange} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="portId" {...labelProps('Thuộc cảng biển')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Cảng biển là bắt buộc' }]}><Select placeholder={!watchedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : portOptions.length === 0 && !loadingPorts ? 'Không có cảng biển thuộc đơn vị quản lý' : 'Chọn cảng biển...'} loading={loadingPorts} disabled={!watchedOrgUnitId || (portOptions.length === 0 && !loadingPorts)} options={portOptions} showSearch optionFilterProp="label" notFoundContent="Không có cảng biển thuộc đơn vị quản lý" style={selectStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="berthCode" {...labelProps('Mã bến cảng')} required style={{ marginBottom: spaceFormField }} tooltip="Mã bến cảng được sinh tự động"><Input disabled placeholder={berthCodeLoading ? 'Đang sinh mã...' : watchedPortId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã'} style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} /></Form.Item></Col><Col span={12}><Form.Item name="berthName" {...labelProps('Tên bến cảng')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tên bến cảng không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]}><Input placeholder="Nhập tên bến cảng" maxLength={255} style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="waterway" {...labelProps('Thuộc luồng hàng hải')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn luồng hàng hải" allowClear showSearch optionFilterProp="label" options={channelOptions} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="operator" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập đơn vị khai thác" maxLength={255} style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} required rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn địa điểm" showSearch optionFilterProp="label" filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập địa điểm chi tiết" maxLength={500} style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="structureType" {...labelProps('Loại kết cấu bến cảng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Loại kết cấu bến cảng" options={STRUCTURE_TYPE_OPTIONS} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="operationalFunction" {...labelProps('Công năng khai thác')} style={{ marginBottom: spaceFormField }}><Input placeholder="Công năng khai thác" maxLength={500} style={inputStyle} /></Form.Item></Col></Row>
      {/* Năng lực */}
      <Row gutter={16}><Col span={12}><Form.Item name="totalArea" {...labelProps('Tổng diện tích (ha)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} /></Form.Item></Col><Col span={12}><Form.Item name="designThroughput" {...labelProps('Năng lực thông qua thiết kế')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="currentThroughput" {...labelProps('Năng lực thông qua hiện trạng (tấn/năm)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} /></Form.Item></Col><Col span={12}><Form.Item name="maxVesselSize" {...labelProps('Cỡ tàu tiếp nhận lớn nhất theo quy hoạch (DWT)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="plannedThroughput" {...labelProps('Quy hoạch năng lực thông qua (tấn/năm)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} /></Form.Item></Col><Col span={12}><Form.Item name="latestCargoVolume" {...labelProps('Sản lượng hàng hóa thực tế thông qua trong năm gần nhất')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="operationalStatus" {...labelProps('Tình trạng')} required rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn tình trạng" options={Object.entries(BERTH_ACTIVITY_STATUS_MAP).map(([v, { label }]) => ({ value: v, label }))} style={selectStyle} /></Form.Item></Col></Row>
    </div>) },
    // Tab 2: Thông tin công bố
    { key: 'announcement', label: 'Thông tin công bố mở, đưa vào sử dụng', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}><Col span={12}><Form.Item name="openingAnnouncementDate" {...labelProps('Thời điểm công bố, đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn thời điểm..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col><Col span={12}><Form.Item name="openingDecision" {...labelProps('Quyết định công bố/ Văn bản cho phép khai thác')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập quyết định công bố" maxLength={500} style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="investmentAgreement" {...labelProps('Văn bản thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập văn bản thỏa thuận" maxLength={2000} style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item></Col></Row>
    </div>) },
    // Tab 3: Thông tin vị trí
    { key: 'location', label: 'Thông tin vị trí', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}><Col span={12}><Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn loại đối tượng" options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }} rules={watchedGeometryType ? [{ required: true, message: 'Biểu tượng bản đồ là bắt buộc khi chọn loại đối tượng' }] : []}><Select placeholder="Chọn biểu tượng bản đồ" allowClear showSearch optionFilterProp="label" disabled={!watchedGeometryType} style={selectStyle}>{symbols.map(sym => (<Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}><Space>{sym.image && <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />}<span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span></Space></Select.Option>))}</Select></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }} rules={watchedGeometryType ? [{ required: true, message: 'Hệ quy chiếu là bắt buộc khi chọn loại đối tượng' }] : []}><Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} /></Form.Item></Col><Col span={12}><Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }} rules={watchedGeometryType ? [{ required: true, message: 'Quy tắc hiển thị là bắt buộc khi chọn loại đối tượng' }] : []}><Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} /></Form.Item></Col></Row>
      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS{watchedGeometryType && <span style={{ color: colors.error, marginLeft: 4, fontSize: fontSizeMd }}>*</span>}</span></span>
        {coordinateList.length > 0 && <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!watchedGeometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>}
      </div>
      {coordinateList.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!watchedGeometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
        </div>
      ) : (
        <Table className="list-view-table" dataSource={coordinateList.map((c, i) => ({ ...c, key: i, _idx: i }))}
          pagination={false} size="middle" bordered scroll={{ x: 820 }}>
          <Table.Column title="STT" key="stt" width={60} align="center"
            render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Vĩ độ (N)" key="lat"
            render={(_: any, record: any) => { const dms = ddToDms(record.latitude ?? 0); return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} min={0} max={90} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', v ?? 0, dms.m, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, v ?? 0, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, dms.m, v ?? 0)} style={{ flex: 1.2 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>; }}
            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Kinh độ (E)" key="lng"
            render={(_: any, record: any) => { const dms = ddToDms(record.longitude ?? 0); return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} min={0} max={180} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', v ?? 0, dms.m, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, v ?? 0, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, dms.m, v ?? 0)} style={{ flex: 1.2 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>; }}
            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Thao tác" key="actions" width={80} align="center"
            render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeCoordinate(record._idx)} />}
            onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
        </Table>
      )}
    </div>) },
    // Tab 4: File đính kèm
    { key: 'files', label: 'File đính kèm', children: (<div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
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
            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Tên file" key="name" dataIndex="name"
            render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>}
            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Thao tác" key="actions" width={80} align="center"
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

  return (<Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }} items={tabItems} />);
});
