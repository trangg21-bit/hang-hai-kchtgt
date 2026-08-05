import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Modal, Tabs, Space, Form, Button, Row, Col, InputNumber, Select, Input, Upload, DatePicker, Switch, Table, Tag, Empty } from 'antd';
import type { UploadFile } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { organizationService } from '../../services/organizationService';
import { portCRUD } from '../../services/portService';
import { fetchBuoyStationById, createBuoyStation, updateBuoyStation, submitBuoyStationForApproval } from '../../services/station/beacon/api';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { useAuthStore } from '../../store/authStore';
import { BUOY_TYPE_OPTIONS } from '../../types/beacon';
import type { BuoyStationResponse } from '../../services/station/beacon/types';
import { actionPrimary, spaceFormField, radiusPill, borderDefault, textPrimary, textSecondary, textTertiary, spaceSm, fontWeightBold, fontSizeMd, fontSizeSm } from '../../tokens';
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
  { value: 'Iso', label: 'Iso - Đồng pha' }, { value: 'Q', label: 'Q - Chớp nhanh' },
  { value: 'VQ', label: 'VQ - Chớp rất nhanh' }, { value: 'Oc', label: 'Oc - Huyền phù' }, { value: 'F', label: 'F - Cố định' },
];
const GEOMETRY_OPTIONS = [{ value: 'POINT', label: 'Đối tượng điểm' }, { value: 'LINE', label: 'Đối tượng đường' }, { value: 'POLYGON', label: 'Đối tượng vùng' }];
const COORD_SYS_OPTIONS = [{ value: 'WGS84', label: 'WGS-84' }, { value: 'VN2000', label: 'VN-2000' }];

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });
const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const numberInputStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };

type SaveAction = 'DRAFT' | 'SUBMIT';

export default function BuoyStationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = !!id || searchParams.get('mode') === 'edit';
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [portOptions, setPortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [entityData, setEntityData] = useState<BuoyStationResponse | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

  useEffect(() => { (async () => { try { const r = await organizationService.list({ pageSize: 1000 }); setOrgUnitOptions((r.data || []).map((o: any) => ({ value: o.id, label: o.name }))); } catch { /* */ } })();
    (async () => { try { const r = await portCRUD.findAll({ page: 1, size: 1000 }); setPortOptions((r.data || []).map((p: any) => ({ value: p.id, label: p.portName || p.name || p.id }))); } catch { /* */ } })(); }, []);

  useEffect(() => { if (!isEdit) { (async () => { try { const r = await api.get('/users/me'); const p = r.data?.data ?? r.data; if (p?.orgUnitId) form.setFieldsValue({ unitId: p.orgUnitId }); } catch { /* */ } })(); } }, [form, isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data = await fetchBuoyStationById(id); setEntityData(data);
        try { const fr = await api.get(`/v1/documents/entity/buoy-station/${id}`, { params: { page: 0, size: 50 } }); setExistingFiles(fr.data?.data?.content || fr.data?.data || []); } catch { setExistingFiles([]); }
        form.setFieldsValue({
          code: data.code, name: data.name, type: data.type, unitId: data.unitId,
          operatingOrgId: data.operatingOrgId, portId: data.portId,
          waterwayId: data.waterwayId, waterwayRouteId: data.waterwayRouteId,
          province: data.province, address: data.address,
          constructionDate: data.constructionDate ? dayjs(data.constructionDate) : undefined,
          totalArea: data.totalArea, usableArea: data.usableArea,
          staffCount: data.staffCount, lastMaintenanceYear: data.lastMaintenanceYear,
          note: data.note, description: data.description || undefined, isActive: data.isActive,
          color: data.color || undefined, shape: data.shape || undefined,
          lightCharacteristic: data.lightCharacteristic || undefined, range: data.range,
          objectType: data.objectType || 'POINT', icon: data.icon,
          coordinateSystem: data.coordinateSystem || 'WGS84', displayFormat: data.displayFormat,
          lastInspectionDate: data.lastInspectionDate ? dayjs(data.lastInspectionDate) : undefined,
          nextInspectionDate: data.nextInspectionDate ? dayjs(data.nextInspectionDate) : undefined,
          gisLocation: data.longitude != null && data.latitude != null ? { geometryType: 'POINT', coordinates: `POINT(${data.longitude} ${data.latitude})` } : undefined,
        });
      } catch { toast.error('Không thể tải thông tin'); navigate('/buoy-station'); }
    })();
  }, [isEdit, id, form, navigate]);

  const parseCoords = (gl: any) => { const w = gl?.coordinates; if (!w) return null; const m = w.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/); return m ? { lng: parseFloat(m[1]), lat: parseFloat(m[2]) } : null; };

  const handleSave = async (sa: SaveAction) => {
    const v = form.getFieldsValue(); const code = String(v.code ?? '').trim(); const name = String(v.name ?? '').trim();
    if (!isEdit && !code) { toast.error('Mã nhà trạm là bắt buộc'); return; }
    if (!name) { toast.error('Tên nhà trạm là bắt buộc'); return; }
    if (!v.type) { toast.error('Loại là bắt buộc'); return; }
    if (v.range == null || v.range <= 0 || v.range > 100) { toast.error('Tầm nhìn xa phải (0,100] hải lý'); return; }
    const gc = parseCoords(v.gisLocation);
    if (v.lastInspectionDate && v.nextInspectionDate && dayjs(v.nextInspectionDate).isBefore(dayjs(v.lastInspectionDate))) { toast.error('Ngày KT kế tiếp < gần nhất'); return; }
    setSubmitting(true);
    try {
      const p: Record<string, unknown> = {
        name, type: v.type, range: v.range, color: v.color || undefined, shape: v.shape || undefined,
        lightCharacteristic: v.lightCharacteristic || undefined, description: v.description || undefined,
        unitId: v.unitId || undefined, operatingOrgId: v.operatingOrgId || undefined,
        portId: v.portId || undefined, waterwayId: v.waterwayId || undefined, waterwayRouteId: v.waterwayRouteId || undefined,
        province: v.province || undefined, address: v.address || undefined,
        constructionDate: v.constructionDate ? (typeof v.constructionDate === 'string' ? v.constructionDate : v.constructionDate.format('YYYY-MM-DD')) : undefined,
        totalArea: v.totalArea, usableArea: v.usableArea, staffCount: v.staffCount, lastMaintenanceYear: v.lastMaintenanceYear,
        note: v.note || undefined, objectType: v.objectType || 'POINT', icon: v.icon || undefined,
        coordinateSystem: v.coordinateSystem || 'WGS84', displayFormat: v.displayFormat || undefined,
        isActive: v.isActive !== false,
        lastInspectionDate: v.lastInspectionDate ? (typeof v.lastInspectionDate === 'string' ? v.lastInspectionDate : v.lastInspectionDate.format('YYYY-MM-DD')) : undefined,
        nextInspectionDate: v.nextInspectionDate ? (typeof v.nextInspectionDate === 'string' ? v.nextInspectionDate : v.nextInspectionDate.format('YYYY-MM-DD')) : undefined,
      };
      if (gc) { p.latitude = gc.lat; p.longitude = gc.lng; }
      Object.keys(p).forEach(k => { if (p[k] === undefined) delete p[k]; });
      let sid: string | undefined;
      if (isEdit && id) { await updateBuoyStation(id, p as any); sid = id; if (sa === 'SUBMIT') await submitBuoyStationForApproval(id); }
      else { p.code = code; p.action = sa === 'SUBMIT' ? 'submit' : 'draft'; const r = await createBuoyStation(p as any); sid = (r as any)?.id; }
      toast.success(sa === 'DRAFT' ? 'Lưu nháp thành công' : 'Gửi phê duyệt thành công');
      if (sid && uploadedFiles.length) { for (const f of uploadedFiles) { const of = f.originFileObj as File; if (!of) continue; try { const fd = new FormData(); fd.append('file', of); await api.post(`/v1/documents/upload/buoy-station/${sid}`, fd, { headers: { 'Content-Type': undefined as any } }); } catch { /* */ } } }
      navigate('/buoy-station');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra'); } finally { setSubmitting(false); }
  };

  const typeLocked = isEdit && entityData && (entityData.status === 'APPROVED_L2' || entityData.status === 'PUBLISHED');

  return (
    <Modal title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{isEdit ? 'Chỉnh sửa Nhà trạm phao tiêu' : 'Tạo mới Nhà trạm phao tiêu'}</span>}
      open onCancel={() => navigate('/buoy-station')} footer={null} width={1000} forceRender
      styles={{ body: { maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', overflowX: 'hidden', paddingTop: 8 } }}>
      <Form form={form} layout="vertical" scrollToFirstError>
        <Tabs defaultActiveKey="general" items={[
          /* Tab 1: Thông tin chung */
          { key: 'general', label: 'Thông tin chung', children: (<>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="code" {...labelProps('Mã nhà trạm')} required={!isEdit} style={{ marginBottom: spaceFormField }} rules={!isEdit ? [{ required: true, message: 'Không được để trống' }, { max: 50 }] : []}><Input disabled={isEdit} placeholder={isEdit ? undefined : 'VD: NT-PT-HP-001'} maxLength={50} style={{ ...inputStyle, ...(isEdit ? { color: textTertiary } : {}) }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="name" {...labelProps('Tên nhà trạm')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Không được để trống' }, { max: 200 }]}><Input placeholder="VD: Nhà trạm phao tiêu Hải Phòng" maxLength={200} style={inputStyle} /></Form.Item></Col>
              <Col span={8}><Form.Item name="type" {...labelProps('Loại')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true }]}><Select placeholder="Chọn loại..." options={BUOY_TYPE_OPTIONS} disabled={typeLocked} style={selectStyle} /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="unitId" {...labelProps('Đơn vị quản lý')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn đơn vị..." options={orgUnitOptions} showSearch allowClear filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} style={selectStyle} /></Form.Item></Col>
              <Col span={8}><Form.Item name="operatingOrgId" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn đơn vị..." options={orgUnitOptions} showSearch allowClear filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} style={selectStyle} /></Form.Item></Col>
              <Col span={8}><Form.Item name="portId" {...labelProps('Thuộc cảng biển')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn cảng..." options={portOptions} showSearch allowClear filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} style={selectStyle} /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="province" {...labelProps('Tỉnh/Thành phố')} style={{ marginBottom: spaceFormField }}><Input placeholder="VD: Hải Phòng" style={inputStyle} /></Form.Item></Col>
              <Col span={16}><Form.Item name="address" {...labelProps('Địa chỉ')} style={{ marginBottom: spaceFormField }}><Input placeholder="Địa chỉ chi tiết..." style={inputStyle} /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="constructionDate" {...labelProps('Thời điểm xây dựng')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="totalArea" {...labelProps('Tổng diện tích (m²)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} step={0.01} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
              <Col span={8}><Form.Item name="usableArea" {...labelProps('Diện tích SD (m²)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} step={0.01} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="staffCount" {...labelProps('Số nhân sự')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} placeholder="0" style={numberInputStyle} /></Form.Item></Col>
              <Col span={8}><Form.Item name="lastMaintenanceYear" {...labelProps('Năm bảo trì gần nhất')} style={{ marginBottom: spaceFormField }}><InputNumber min={2000} max={2100} placeholder="2026" style={numberInputStyle} /></Form.Item></Col>
              <Col span={8}><Form.Item name="isActive" {...labelProps('Trạng thái hoạt động')} style={{ marginBottom: spaceFormField }} valuePropName="checked"><Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" defaultChecked /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}><Form.Item name="note" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }} rules={[{ max: 1000 }]}><Input.TextArea placeholder="Ghi chú..." maxLength={1000} rows={2} style={{ borderRadius: 8, fontSize: fontSizeMd }} /></Form.Item></Col>
              <Col span={24}><Form.Item name="description" {...labelProps('Mô tả')} style={{ marginBottom: spaceFormField }} rules={[{ max: 1000 }]}><Input.TextArea placeholder="Mô tả về nhà trạm..." maxLength={1000} rows={2} style={{ borderRadius: 8, fontSize: fontSizeMd }} /></Form.Item></Col>
            </Row>
          </>) },
          /* Tab 2: Vị trí */
          { key: 'location', label: 'Vị trí', children: (<>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="objectType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}><Select options={GEOMETRY_OPTIONS} style={selectStyle} /></Form.Item></Col>
              <Col span={8}><Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}><Select options={COORD_SYS_OPTIONS} style={selectStyle} /></Form.Item></Col>
              <Col span={8}><Form.Item name="displayFormat" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}><Input placeholder="VD: DMS" style={inputStyle} /></Form.Item></Col>
            </Row>
            <Row gutter={16}><Col span={24}><Form.Item name="gisLocation" {...labelProps('Tọa độ GPS')} style={{ marginBottom: spaceFormField }}><GisLocationSelector defaultGeometryType="POINT" /></Form.Item></Col></Row>
          </>) },
          /* Tab 3: Kỹ thuật */
          { key: 'technical', label: 'Kỹ thuật', children: (<>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="color" {...labelProps('Màu sắc')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn màu..." options={COLOR_OPTIONS} allowClear style={selectStyle} /></Form.Item></Col>
              <Col span={8}><Form.Item name="shape" {...labelProps('Hình dạng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn hình dạng..." options={SHAPE_OPTIONS} allowClear style={selectStyle} /></Form.Item></Col>
              <Col span={8}><Form.Item name="lightCharacteristic" {...labelProps('Đặc tính ánh sáng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn..." options={LIGHT_CHAR_OPTIONS} allowClear style={selectStyle} /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="range" {...labelProps('Tầm nhìn xa (HL)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true }]}><InputNumber min={0.01} max={100} step={0.01} placeholder="VD: 5.0" style={numberInputStyle} /></Form.Item></Col>
              <Col span={8}><Form.Item name="lastInspectionDate" {...labelProps('Ngày KT gần nhất')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="nextInspectionDate" {...labelProps('Ngày KT kế tiếp')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
            </Row>
          </>) },
          /* Tab 4: File đính kèm */
          { key: 'files', label: 'File đính kèm', children: (<>
            {existingFiles.length > 0 && (<div style={{ display: 'flex', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceSm }}>{existingFiles.map((f: any) => (<div key={f.id} style={{ border: `0.5px solid ${borderDefault}`, borderRadius: radiusPill, padding: spaceSm, display: 'flex', alignItems: 'center', gap: spaceSm }}><UploadOutlined style={{ fontSize: 24, color: actionPrimary }} /><div><div style={{ fontSize: fontSizeMd, color: textPrimary }}>{f.fileName || f.name}</div><div style={{ fontSize: fontSizeSm, color: textTertiary }}>{(f.fileSize / 1024).toFixed(1)} KB</div></div></div>))}</div>)}
            <Upload beforeUpload={(f: File) => { if (f.size > 10*1024*1024) { toast.error('File >10MB'); return false; } const e = f.name.split('.').pop()?.toLowerCase(); if (!e || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png'].includes(e)) { toast.error('Định dạng không hỗ trợ'); return false; } setUploadedFiles(p => [...p, { uid: `-${Date.now()}`, name: f.name, size: f.size, type: f.type, status: 'done', originFileObj: f }]); return false; }} onRemove={(f) => setUploadedFiles(p => p.filter(x => x.uid !== f.uid))} fileList={uploadedFiles} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"><Button icon={<UploadOutlined />}>Chọn file (≤10 files, ≤10MB)</Button></Upload>
          </>) },
          /* Tab 5-8: Placeholder */
          { key: 'subitems', label: 'Phao tiêu trực thuộc', children: <Empty description="Tính năng đang phát triển" /> },
          { key: 'approval-info', label: 'Phê duyệt', children: <Empty description="Thông tin phê duyệt sẽ hiển thị sau khi gửi" /> },
          { key: 'operations', label: 'Vận hành', children: <Empty description="Tính năng đang phát triển" /> },
          { key: 'maintenance', label: 'Bảo trì', children: <Empty description="Tính năng đang phát triển" /> },
        ]} />
        <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/buoy-station')} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
            {!isEdit && <Button onClick={() => handleSave('DRAFT')} loading={submitting} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Lưu tạm</Button>}
            <Button type="primary" onClick={() => handleSave('SUBMIT')} loading={submitting} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Lưu và phê duyệt</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
