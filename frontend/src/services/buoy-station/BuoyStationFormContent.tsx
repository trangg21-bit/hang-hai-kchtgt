import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Tabs, Form, Row, Col, InputNumber, Select, Input, Upload, DatePicker, Switch, Table, Space, Button } from 'antd';
import type { FormInstance, UploadFile } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { organizationService } from '../../services/organizationService';
import { portCRUD } from '../../services/portService';
import {
  createBuoyStation, updateBuoyStation, submitBuoyStationForApproval,
  approveBuoyStationL1, approveBuoyStationL2, generateBuoyStationCode,
} from './api';
import { BUOY_TYPE_OPTIONS } from '../../types/beacon';
import { VIETNAM_PROVINCES } from '../../types/common';
import type { BuoyStationResponse, CreateBuoyStationRequest } from './types';
import { useAuthStore } from '../../store/authStore';
import { spaceFormField, radiusPill, radiusMd, borderDefault, textSecondary, textTertiary, spaceSm, fontWeightBold, fontSizeMd, fontSizeSm, surfaceCard } from '../../tokens';
import { colors } from '../../theme';

const COLOR_OPTIONS = [
  { value: 'RED', label: 'Đỏ' }, { value: 'GREEN', label: 'Xanh lá' },
  { value: 'BLACK_RED', label: 'Đen + Đỏ' }, { value: 'BLACK_YELLOW', label: 'Đen + Vàng' },
  { value: 'WHITE', label: 'Trắng' }, { value: 'YELLOW', label: 'Vàng' }, { value: 'ORANGE', label: 'Cam' },
];
const SHAPE_OPTIONS = [
  { value: 'CAN', label: 'Hình trụ' }, { value: 'CONE', label: 'Hình nón' },
  { value: 'SPAR', label: 'Trụ' }, { value: 'BELL', label: 'Chuông' },
  { value: 'BUCKET', label: 'Gáo' }, { value: 'TUBULAR', label: 'Ống' },
];
const LIGHT_CHAR_OPTIONS = [
  { value: 'FL', label: 'FL - Chớp đơn' }, { value: 'FL(2)', label: 'FL(2) - Chớp nhóm 2' },
  { value: 'FL(3)', label: 'FL(3) - Chớp nhóm 3' }, { value: 'Iso', label: 'Iso - Đồng pha' },
  { value: 'Q', label: 'Q - Chớp nhanh' }, { value: 'VQ', label: 'VQ - Chớp rất nhanh' },
  { value: 'Oc', label: 'Oc - Huyền phù' }, { value: 'F', label: 'F - Cố định' },
];
const GEOMETRY_OPTIONS = [{ value: 'POINT', label: 'Đối tượng điểm' }, { value: 'LINE', label: 'Đối tượng đường' }, { value: 'POLYGON', label: 'Đối tượng vùng' }];
const COORD_SYS_OPTIONS = [{ value: 'WGS84', label: 'WGS-84' }, { value: 'VN2000', label: 'VN-2000' }];
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

type SaveAction = 'DRAFT' | 'SUBMIT' | 'APPROVED' | 'UPDATE';

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });
const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };
const parseInteger = (v: string | undefined): number => {
  const intPart = (v ?? '').replace(/,/g, '').split('.')[0];
  return intPart === '' ? 0 : Number(intPart);
};

const ddToDms = (v: number) => {
  const abs = Math.abs(v);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60 * 100) / 100;
  return { d, m, s };
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
  onFinish,
}, ref) {
  const currentUser = useAuthStore((s) => s.user);
  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [portOptions, setPortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [coordinateList, setCoordinateList] = useState<Array<{ latitude: number | null; longitude: number | null }>>([]);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const editPortIdRef = useRef<string | undefined>(undefined);

  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);
  const watchedObjectType = Form.useWatch('objectType', form);

  const loadPortOptions = async (orgUnitId?: string) => {
    setLoadingPorts(true);
    try {
      const r = await portCRUD.findAll({ page: 1, size: 1000 });
      const list = r.data || (r as any).content || [];
      setPortOptions((orgUnitId ? list.filter((p: any) => p.orgUnitId === orgUnitId) : list).map((p: any) => ({ value: p.id, label: p.portName || p.name || p.id })));
    } catch { setPortOptions([]); }
    finally { setLoadingPorts(false); }
  };

  useEffect(() => {
    (async () => { try { const r = await organizationService.list({ pageSize: 1000 }); setOrgUnitOptions((r.data || []).map((o: { id: string; name: string }) => ({ value: o.id, label: o.name }))); } catch { /* */ } })();
  }, []);

  useEffect(() => {
    if (isEdit) return;
    (async () => { try { const r = await api.get('/users/me'); const p = r.data?.data ?? r.data; if (p?.orgUnitId) form.setFieldsValue({ orgUnitId: p.orgUnitId }); } catch { /* */ } })();
  }, [form, isEdit]);

  // Sinh mã tự động theo cảng biển chủ (mẫu BerthForm)
  useEffect(() => {
    if (!watchedPortId || (isEdit && editPortIdRef.current === watchedPortId)) return;
    setCodeLoading(true);
    generateBuoyStationCode(watchedPortId).then((c) => { if (c) form.setFieldsValue({ code: c }); }).catch(() => { /* */ }).finally(() => setCodeLoading(false));
  }, [watchedPortId, form, isEdit]);

  // Chọn loại đối tượng → tự set hệ quy chiếu, quy tắc hiển thị và số dòng tọa độ tương ứng
  useEffect(() => {
    if (!watchedObjectType) return;
    if (watchedObjectType === 'POINT') form.setFieldsValue({ coordinateSystem: 'WGS84', displayFormat: 'Độ, phút, giây (DMS)' });
    if (!isEdit) {
      const count = GEOMETRY_POINT_COUNT[watchedObjectType] ?? 1;
      setCoordinateList(Array.from({ length: count }, () => ({ latitude: null, longitude: null })));
    }
  }, [watchedObjectType, form, isEdit]);

  // Edit mode: prefill dữ liệu hiện tại
  useEffect(() => {
    if (!isEdit || !entityData) return;
    const data = entityData;
    editPortIdRef.current = data.portId;
    if (data.unitId) void loadPortOptions(data.unitId);
    setCoordinateList(data.longitude != null && data.latitude != null ? [{ latitude: data.latitude, longitude: data.longitude }] : []);
    form.setFieldsValue({
      code: data.code, name: data.name, type: data.type, orgUnitId: data.unitId,
      operatingOrgId: data.operatingOrgId, portId: data.portId,
      provinceId: data.province || undefined, address: data.address,
      constructionDate: data.constructionDate ? dayjs(data.constructionDate) : undefined,
      totalArea: data.totalArea, usableArea: data.usableArea,
      staffCount: data.staffCount, lastMaintenanceYear: data.lastMaintenanceYear,
      note: data.note, description: data.description || undefined, isActive: data.isActive,
      color: data.color || undefined, shape: data.shape || undefined,
      lightCharacteristic: data.lightCharacteristic || undefined, range: data.range,
      objectType: data.objectType || 'POINT', coordinateSystem: data.coordinateSystem || 'WGS84',
      displayFormat: data.displayFormat || undefined,
      lastInspectionDate: data.lastInspectionDate ? dayjs(data.lastInspectionDate) : undefined,
      nextInspectionDate: data.nextInspectionDate ? dayjs(data.nextInspectionDate) : undefined,
      lastRepairDate: data.lastRepairDate ? dayjs(data.lastRepairDate) : undefined,
    });
  }, [form, isEdit, entityData]);

  const typeLocked = !!isEdit && !!entityData && (entityData.status === 'APPROVED_L2' || entityData.status === 'PUBLISHED');

  const removeCoordinate = (i: number) => { setCoordinateList(p => p.filter((_, idx) => idx !== i)); };
  const addGpsPoint = () => setCoordinateList(p => [...p, { latitude: null, longitude: null }]);
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number, mVal: number, sVal: number) => {
    const decimal = dVal + mVal / 60 + sVal / 3600;
    setCoordinateList(p => { const n = [...p]; n[i] = { ...n[i], [field === 'lat' ? 'latitude' : 'longitude']: decimal }; return n; });
  };

  const renderDms = (i: number, field: 'lat' | 'lng', record: any) => {
    const v = field === 'lat' ? (record.latitude ?? 0) : (record.longitude ?? 0);
    const dms = ddToDms(v);
    const maxD = field === 'lat' ? 90 : 180;
    return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
      <InputNumber value={dms.d} min={0} max={maxD} precision={0} placeholder="Độ" controls={false} onFocus={(e) => e.currentTarget.select()} onChange={(x) => updateGpsPoint(i, field, x ?? 0, dms.m, dms.s)} style={{ flex: 1, borderRadius: radiusPill }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
      <InputNumber value={dms.m} min={0} max={59} precision={0} placeholder="Phút" controls={false} onFocus={(e) => e.currentTarget.select()} onChange={(x) => updateGpsPoint(i, field, dms.d, x ?? 0, dms.s)} style={{ flex: 1, borderRadius: radiusPill }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
      <InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" controls={false} onFocus={(e) => e.currentTarget.select()} onChange={(x) => updateGpsPoint(i, field, dms.d, dms.m, x ?? 0)} style={{ flex: 1.2, borderRadius: radiusPill }} />
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

  const handleSave = async (saveAction: SaveAction) => {
    let values: any;
    try { values = await form.validateFields(); } catch {
      toast.error('Vui lòng kiểm tra lại các trường bắt buộc');
      return;
    }
    const code = String(values.code ?? '').trim();
    const name = String(values.name ?? '').trim();
    if (!name) { toast.error('Tên nhà trạm là bắt buộc'); return; }
    if (values.range == null || values.range <= 0 || values.range > 100) { toast.error('Tầm nhìn xa phải (0,100] hải lý'); setActiveTabKey('technical'); return; }
    if (values.lastInspectionDate && values.nextInspectionDate && dayjs(values.nextInspectionDate).isBefore(dayjs(values.lastInspectionDate))) { toast.error('Ngày KT kế tiếp phải sau ngày KT gần nhất'); setActiveTabKey('technical'); return; }
    const manualCoords = coordinateList.filter(c => c.latitude != null && c.longitude != null && !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude))).map(c => ({ latitude: Number(c.latitude), longitude: Number(c.longitude) }));
    const objType = values.objectType || 'POINT';
    const requiredCoords = GEOMETRY_POINT_COUNT[objType] ?? 1;
    if (coordinateList.length === 0 || manualCoords.length < requiredCoords) { toast.error(`Loại đối tượng đã chọn yêu cầu ít nhất ${requiredCoords} tọa độ GPS.`); setActiveTabKey('location'); return; }
    try {
      const p: Record<string, unknown> = {
        name, type: values.type, range: values.range, color: values.color || undefined, shape: values.shape || undefined,
        lightCharacteristic: values.lightCharacteristic || undefined, description: values.description || undefined,
        unitId: values.orgUnitId || undefined, operatingOrgId: values.operatingOrgId || undefined,
        portId: values.portId || undefined,
        province: values.provinceId || undefined, address: values.address || undefined,
        constructionDate: values.constructionDate ? (typeof values.constructionDate === 'string' ? values.constructionDate : values.constructionDate.format('YYYY-MM-DD')) : undefined,
        totalArea: values.totalArea, usableArea: values.usableArea, staffCount: values.staffCount, lastMaintenanceYear: values.lastMaintenanceYear,
        note: values.note || undefined, objectType: objType, coordinateSystem: values.coordinateSystem || 'WGS84',
        displayFormat: values.displayFormat || undefined, isActive: values.isActive !== false,
        lastInspectionDate: values.lastInspectionDate ? (typeof values.lastInspectionDate === 'string' ? values.lastInspectionDate : values.lastInspectionDate.format('YYYY-MM-DD')) : undefined,
        nextInspectionDate: values.nextInspectionDate ? (typeof values.nextInspectionDate === 'string' ? values.nextInspectionDate : values.nextInspectionDate.format('YYYY-MM-DD')) : undefined,
        lastRepairDate: values.lastRepairDate ? (typeof values.lastRepairDate === 'string' ? values.lastRepairDate : values.lastRepairDate.format('YYYY-MM-DD')) : undefined,
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
  };

  useImperativeHandle(ref, () => ({ submit: (saveAction: SaveAction) => void handleSave(saveAction) }), [handleSave]);

  const tabItems = [
    // Tab 1: Thông tin chung
    { key: 'general', label: 'Thông tin chung', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}><Select placeholder="Chọn đơn vị quản lý" loading={orgUnitOptions.length === 0} disabled={isEdit} options={orgUnitOptions} showSearch optionFilterProp="label" onChange={() => { form.setFieldsValue({ portId: undefined, code: undefined }); setCoordinateList([]); }} style={selectStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="portId" {...labelProps('Thuộc cảng biển')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Cảng biển là bắt buộc' }]}><Select placeholder={!watchedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : portOptions.length === 0 && !loadingPorts ? 'Không có cảng biển thuộc đơn vị quản lý' : 'Chọn cảng biển...'} loading={loadingPorts} disabled={!watchedOrgUnitId || (portOptions.length === 0 && !loadingPorts)} options={portOptions} showSearch optionFilterProp="label" notFoundContent="Không có cảng biển thuộc đơn vị quản lý" style={selectStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="code" {...labelProps('Mã nhà trạm')} required style={{ marginBottom: spaceFormField }} tooltip="Mã nhà trạm được sinh tự động theo cảng biển"><Input disabled placeholder={codeLoading ? 'Đang sinh mã...' : watchedPortId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã'} style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} /></Form.Item></Col>
        <Col span={12}><Form.Item name="name" {...labelProps('Tên nhà trạm')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tên nhà trạm không được để trống' }, { max: 200, message: 'Tối đa 200 ký tự' }]}><Input placeholder="VD: Nhà trạm phao tiêu Hải Phòng" maxLength={200} style={inputStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="type" {...labelProps('Loại')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Loại là bắt buộc' }]}><Select placeholder="Chọn loại..." options={BUOY_TYPE_OPTIONS} disabled={typeLocked} style={selectStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="operatingOrgId" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn đơn vị..." options={orgUnitOptions} showSearch allowClear filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} style={selectStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]}><Select placeholder="Chọn tỉnh/thành phố" showSearch optionFilterProp="label" filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="address" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}><Input placeholder="Địa chỉ chi tiết..." maxLength={500} style={inputStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="constructionDate" {...labelProps('Thời điểm xây dựng')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
        <Col span={12}><Form.Item name="isActive" {...labelProps('Trạng thái hoạt động')} style={{ marginBottom: spaceFormField }} valuePropName="checked"><Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="totalArea" {...labelProps('Tổng diện tích (m²)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} step={1} precision={0} parser={parseInteger} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="usableArea" {...labelProps('Diện tích SD (m²)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} step={1} precision={0} parser={parseInteger} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="staffCount" {...labelProps('Số nhân sự')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} precision={0} parser={parseInteger} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="lastMaintenanceYear" {...labelProps('Năm bảo trì gần nhất')} style={{ marginBottom: spaceFormField }}><InputNumber min={2000} max={2100} precision={0} parser={parseInteger} placeholder="2026" style={numberInputStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="note" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }} rules={[{ max: 1000 }]}><Input.TextArea placeholder="Ghi chú..." maxLength={1000} rows={2} style={{ borderRadius: radiusPill, fontSize: fontSizeMd }} /></Form.Item></Col>
        <Col span={12}><Form.Item name="description" {...labelProps('Mô tả')} style={{ marginBottom: spaceFormField }} rules={[{ max: 1000 }]}><Input.TextArea placeholder="Mô tả về nhà trạm..." maxLength={1000} rows={2} style={{ borderRadius: radiusPill, fontSize: fontSizeMd }} /></Form.Item></Col>
      </Row>
    </div>) },
    // Tab 2: Kỹ thuật & kiểm định
    { key: 'technical', label: 'Kỹ thuật & kiểm định', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="color" {...labelProps('Màu sắc')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn màu..." options={COLOR_OPTIONS} allowClear style={selectStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="shape" {...labelProps('Hình dạng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn hình dạng..." options={SHAPE_OPTIONS} allowClear style={selectStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="lightCharacteristic" {...labelProps('Đặc tính ánh sáng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn..." options={LIGHT_CHAR_OPTIONS} allowClear style={selectStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="range" {...labelProps('Tầm nhìn xa (HL)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tầm nhìn xa là bắt buộc' }]}><InputNumber min={1} max={100} step={1} precision={0} parser={parseInteger} placeholder="VD: 5" style={numberInputStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="lastInspectionDate" {...labelProps('Ngày KT gần nhất')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
        <Col span={12}><Form.Item name="nextInspectionDate" {...labelProps('Ngày KT kế tiếp')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="lastRepairDate" {...labelProps('Thời điểm sửa chữa gần nhất')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
      </Row>
    </div>) },
    // Tab 3: Thông tin vị trí
    { key: 'location', label: 'Thông tin vị trí', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="objectType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn loại đối tượng" options={GEOMETRY_OPTIONS} style={selectStyle} /></Form.Item></Col>
        <Col span={12}><Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}><Select options={COORD_SYS_OPTIONS} style={selectStyle} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name="displayFormat" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}><Input placeholder="VD: Độ, phút, giây (DMS)" style={inputStyle} /></Form.Item></Col>
      </Row>
      <div style={{ border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard, padding: 16, marginTop: spaceSm }}>
        {coordinateList.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ color: textTertiary, fontSize: fontSizeSm }}>Chưa có tọa độ GPS. Bấm "Thêm điểm" để nhập tọa độ.</div>
          </div>
        ) : (
          <Table rowKey="_idx" size="small" pagination={false} dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))} scroll={{ x: 720 }} columns={[
            { title: 'STT', key: 'stt', width: 50, align: 'center', render: (_: any, __: any, i: number) => i + 1 },
            { title: 'Vĩ độ (N)', key: 'lat', render: (_: any, r: any) => renderDms(r._idx, 'lat', r) },
            { title: 'Kinh độ (E)', key: 'lng', render: (_: any, r: any) => renderDms(r._idx, 'lng', r) },
            { title: 'Thao tác', key: 'actions', width: 70, align: 'center', render: (_: any, r: any) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeCoordinate(r._idx)} /> },
          ]} />
        )}
        <Button type="dashed" block icon={<PlusOutlined />} onClick={addGpsPoint} style={{ marginTop: 8, borderRadius: radiusPill, height: 40 }}>Thêm điểm tọa độ</Button>
      </div>
    </div>) },
    // Tab 4: File đính kèm
    { key: 'files', label: 'File đính kèm', children: (<div style={{ paddingTop: 16 }}>
      <div style={{ border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard, padding: 16 }}>
        <Table rowKey={(r: any) => r.uid ?? r.id} size="small" pagination={false} dataSource={[
          ...uploadedFiles.map(f => ({ uid: f.uid, name: f.name, size: f.size, removable: true })),
          ...existingFiles.map(f => ({ uid: f.id, name: f.fileName || f.name, size: f.fileSize, removable: false })),
        ]} scroll={{ x: 560 }} columns={[
          { title: 'STT', key: 'stt', width: 50, align: 'center', render: (_: any, __: any, i: number) => i + 1 },
          { title: 'Tên file', key: 'name', dataIndex: 'name', ellipsis: true },
          { title: 'Kích thước', key: 'size', width: 110, align: 'right', render: (_: any, r: any) => <span style={{ fontSize: fontSizeSm, color: textSecondary }}>{r.size != null ? (r.size / 1024).toFixed(1) + ' KB' : '—'}</span> },
          { title: 'Thao tác', key: 'actions', width: 70, align: 'center', render: (_: any, r: any) => r.removable ? <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setUploadedFiles(p => p.filter(x => x.uid !== r.uid))} /> : null },
        ]} />
        <Upload beforeUpload={handleBeforeUpload} fileList={[]} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" style={{ marginTop: 8 }}>
          <Button block type="dashed" icon={<UploadOutlined />} style={{ marginTop: 8, borderRadius: radiusPill, height: 40 }}>Chọn file (tối đa 10 file, mỗi file ≤20MB)</Button>
        </Upload>
      </div>
    </div>) },
  ];

  return (
    <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }} items={tabItems} />
  );
});
