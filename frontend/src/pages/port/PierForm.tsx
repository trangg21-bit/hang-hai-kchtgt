import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Modal, Tabs, Space, Form, Button, Row, Col, InputNumber,
  Select, Input, Upload, DatePicker, Switch,
} from 'antd';
import type { UploadFile } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { organizationService } from '../../services/organizationService';
import { pierCRUD, berthCRUD, portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { useAuthStore } from '../../store/authStore';
import {
  actionPrimary, statusOperational, spaceFormField, radiusPill,
  surfaceCard, borderDefault, textPrimary, textSecondary, textTertiary,
  spaceMd, spaceSm,
  fontWeightBold, fontWeightMedium,
  fontSizeMd, fontSizeSm,
} from '../../tokens';
import { colors } from '../../theme';
import { VIETNAM_PROVINCES } from '../../types/common';

/* ── Constants ── */
const PIER_TYPE_OPTIONS = [
  { value: 'CONTAINER', label: 'Container' },
  { value: 'TONG_HOP', label: 'Tổng hợp' },
  { value: 'HANH_KHACH', label: 'Hành khách' },
  { value: 'CHUYEN_DUNG_XANG_DAU', label: 'Chuyên dùng xăng dầu' },
  { value: 'CHUYEN_DUNG_ROI_QUANG', label: 'Chuyên dùng rời/quặng' },
  { value: 'KHAC', label: 'Khác' },
];

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 'HIEN_HANH', label: 'Hiện hành' },
  { value: 'TAM_NGUNG', label: 'Tạm ngừng' },
];

const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Bến nước' },
  { value: 2, label: 'Bến bờ' },
  { value: 3, label: 'Bến phao' },
  { value: 4, label: 'Khác' },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

/* ── Helpers ── */
function parseGisCoordinates(raw: string | undefined): { latitude: number; longitude: number }[] {
  if (!raw) return [];
  const wkt = raw.match(/POINT\s*\(\s*([^\s,]+)\s+([^\s,]+)\s*\)/i);
  if (wkt) { const lng = parseFloat(wkt[1]); const lat = parseFloat(wkt[2]); if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [{ latitude: lat, longitude: lng }]; }
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) { const lat = parseFloat(parts[0]); const lng = parseFloat(parts[1]); if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [{ latitude: lat, longitude: lng }]; }
  return [];
}

const labelProps = (label: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightMedium, fontSize: fontSizeMd }}>{label}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, fontSize: fontSizeMd };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, width: '100%' };
const numberStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, width: '100%' };

export default function PierForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const user = useAuthStore((s) => s.user);
  const isSystemAdmin = user?.permissions?.includes('admin:manage') || user?.permissions?.includes('admin:operation') || false;

  const [submitting, setSubmitting] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [loadingBerths, setLoadingBerths] = useState(false);
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [orgUnitOptions, setOrgUnitOptions] = useState<{ value: string; label: string }[]>([]);
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [berthOptions, setBerthOptions] = useState<{ value: string; label: string }[]>([]);

  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);
  const watchedGeometryType = Form.useWatch('geometryType', form);

  const [pierCodeLoading, setPierCodeLoading] = useState(false);

  /* ── Load organizations ── */
  useEffect(() => { (async () => { setLoadingOrgs(true); try { const r = await organizationService.list({ pageSize: 1000 }); setOrgUnitOptions((r.data || []).map((o: any) => ({ value: o.id, label: o.name }))); } catch {} finally { setLoadingOrgs(false); } })(); }, []);

  /* ── Load ports on orgUnit change ── */
  useEffect(() => { if (!watchedOrgUnitId) { setPortOptions([]); return; } (async () => { setLoadingPorts(true); try { const r = await portCRUD.findAll({ orgUnitId: watchedOrgUnitId, page: 1, size: 1000 }); setPortOptions((r.data || []).map((p: any) => ({ value: p.id, label: p.portName }))); } catch {} finally { setLoadingPorts(false); } })(); }, [watchedOrgUnitId]);

  /* ── Load berths on port change (filter HIEN_HANH only) ── */
  useEffect(() => { if (!watchedPortId) { setBerthOptions([]); return; } (async () => { setLoadingBerths(true); try { const r = await berthCRUD.search({ portId: watchedPortId, operationalStatus: 'OPERATIONAL', page: 1, pageSize: 1000 }); setBerthOptions((r.data || []).map((b: any) => ({ value: b.id, label: b.berthName }))); } catch {} finally { setLoadingBerths(false); } })(); }, [watchedPortId]);

  const watchedBerthId = Form.useWatch('berthId', form);

  /* ── Auto-generate pierCode on berthId change ── */
  useEffect(() => { if (!watchedBerthId) return; setPierCodeLoading(true); (async () => { try { const res = await api.get('/v1/piers/generate-code', { params: { berthId: watchedBerthId } }); const code: string | undefined = res.data?.data?.pierCode ?? res.data?.data; if (code) form.setFieldsValue({ pierCode: code }); } catch { console.warn('Không thể lấy mã cầu từ API, backend sẽ tự sinh khi lưu'); } finally { setPierCodeLoading(false); } })(); }, [watchedBerthId, form]);

  /* ── Load symbols ── */
  useEffect(() => { (async () => { setLoadingSymbols(true); try { const r = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' }); setSymbols(r.data || (r as any).content || []); } catch {} finally { setLoadingSymbols(false); } })(); }, []);

  /* ── Re-apply mapSymbolId after symbols load (fix race condition: Select chưa có options khi setFieldsValue chạy) ── */
  useEffect(() => {
    if (symbols.length === 0 || !isEdit) return;
    const currentMapSymId = form.getFieldValue('mapSymbolId');
    if (currentMapSymId) {
      form.setFieldsValue({ mapSymbolId: currentMapSymId });
    }
  }, [symbols, isEdit, form]);

  /* ── Load existing (edit mode) ── */
  useEffect(() => { if (!isEdit || !id) return; (async () => { try { const d = await pierCRUD.findById(id); form.setFieldsValue({ orgUnitId: d.orgUnitId, portId: d.portId, berthId: d.berthId, pierCode: d.pierCode, pierName: d.pierName, length: d.length, width: d.width, designLoad: d.designLoad, pierType: d.pierType, operationalFunction: d.operationalFunction, operationalStatus: d.operationalStatus === 'OPERATIONAL' ? 'HIEN_HANH' : 'TAM_NGUNG', province: d.province, detailedLocation: d.detailedLocation, constructionGrade: d.constructionGrade, structureType: d.structureType, currentWaterDepth: d.currentWaterDepth, designBedElevation: d.designBedElevation, publishedVesselDWT: d.publishedVesselDWT, maintenanceApprovalDate: d.maintenanceApprovalDate, safetyAssessmentDate: d.safetyAssessmentDate, lastInspectionDate: d.lastInspectionDate, operatingPierCount: d.operatingPierCount, publishedPierCount: d.publishedPierCount, investmentAgreementPierCount: d.investmentAgreementPierCount, cargoThroughput: d.cargoThroughput, receivesLargeVessel: d.receivesLargeVessel, documentNumber: d.documentNumber, documentDate: d.documentDate ? dayjs(d.documentDate) : undefined, openingAnnouncementDate: d.openingAnnouncementDate ? dayjs(d.openingAnnouncementDate) : undefined, openingDecision: d.openingDecision, investmentAgreementDoc: d.investmentAgreementDoc, waterAreaNeutralScope: d.waterAreaNeutralScope, geometryType: d.geometryType || 'POINT', mapSymbolId: d.mapSymbolId, gisLocation: d.coordinates ? { geometryType: d.geometryType, coordinates: d.coordinates } : undefined, }); try { const fr = await api.get(`/v1/documents/entity/pier/${id}`, { params: { page: 0, size: 50 } }); setExistingFiles(fr.data?.data?.content || fr.data?.data || []); } catch {} } catch { toast.error('Không thể tải thông tin cầu cảng'); navigate('/Pier'); } })(); }, [isEdit, id, form, navigate]);

  /* ── Handlers ── */
  const handleOrgUnitChange = () => { form.setFieldsValue({ portId: undefined, berthId: undefined, pierCode: undefined }); };
  const handlePortChange = () => { form.setFieldsValue({ berthId: undefined, pierCode: undefined }); };

  const handleBeforeUpload = (file: File) => {
    if (file.size > MAX_FILE_SIZE) { toast.error('Kích thước file tối đa 20MB'); return false; }
    if (uploadedFiles.length >= MAX_FILE_COUNT) { toast.error('Chỉ được upload tối đa 10 file'); return false; }
    setUploadedFiles((prev) => [...prev, { uid: `-${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 9)}`, name: file.name, size: file.size, type: file.type, status: 'done', originFileObj: file }]);
    return false;
  };
  const handleRemoveFile = (file: UploadFile) => { setUploadedFiles((prev) => prev.filter((f) => f.uid !== file.uid)); };

  const handleSave = async (saveAction: string) => {
    const vals = form.getFieldsValue();
    if (!vals.pierCode?.trim()) { toast.error('Mã cầu không được để trống'); return; }
    if (!vals.pierName?.trim()) { toast.error('Tên cầu không được để trống'); return; }
    if (!vals.berthId) { toast.error('Bến cảng là bắt buộc'); return; }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        pierCode: vals.pierCode?.trim(),
        pierName: vals.pierName?.trim(),
        berthId: vals.berthId,
        portId: vals.portId || undefined,
        length: vals.length != null && !Number.isNaN(Number(vals.length)) ? Number(vals.length) : undefined,
        width: vals.width != null && !Number.isNaN(Number(vals.width)) ? Number(vals.width) : undefined,
        designLoad: vals.designLoad != null && !Number.isNaN(Number(vals.designLoad)) ? Number(vals.designLoad) : undefined,
        pierType: vals.pierType || undefined,
        operationalFunction: vals.operationalFunction || undefined,
        operationalStatus: vals.operationalStatus === 'HIEN_HANH' ? 'OPERATIONAL' : 'SUSPENDED',
        province: vals.province || undefined,
        detailedLocation: vals.detailedLocation || undefined,
        constructionGrade: vals.constructionGrade ?? undefined,
        structureType: vals.structureType ?? undefined,
        currentWaterDepth: vals.currentWaterDepth || undefined,
        designBedElevation: vals.designBedElevation || undefined,
        publishedVesselDWT: vals.publishedVesselDWT || undefined,
        maintenanceApprovalDate: vals.maintenanceApprovalDate || undefined,
        safetyAssessmentDate: vals.safetyAssessmentDate || undefined,
        lastInspectionDate: vals.lastInspectionDate || undefined,
        operatingPierCount: vals.operatingPierCount ?? undefined,
        publishedPierCount: vals.publishedPierCount ?? undefined,
        investmentAgreementPierCount: vals.investmentAgreementPierCount ?? undefined,
        cargoThroughput: vals.cargoThroughput != null && !Number.isNaN(Number(vals.cargoThroughput)) ? Number(vals.cargoThroughput) : undefined,
        receivesLargeVessel: vals.receivesLargeVessel ?? undefined,
        documentNumber: vals.documentNumber || undefined,
        documentDate: vals.documentDate ? dayjs(vals.documentDate).format('YYYY-MM-DD') : undefined,
        openingAnnouncementDate: vals.openingAnnouncementDate ? dayjs(vals.openingAnnouncementDate).format('YYYY-MM-DD') : undefined,
        openingDecision: vals.openingDecision || undefined,
        investmentAgreementDoc: vals.investmentAgreementDoc || undefined,
        waterAreaNeutralScope: vals.waterAreaNeutralScope || undefined,
        geometryType: vals.geometryType || 'POINT',
        mapSymbolId: vals.mapSymbolId || undefined,
        coordinates: typeof vals.gisLocation === 'object' ? vals.gisLocation?.coordinates : undefined,
      };
      Object.keys(payload).forEach((k) => { if (payload[k] === undefined) delete payload[k]; });

      let createdId: string | undefined;
      if (isEdit && id) { await pierCRUD.update({ ...payload, id } as any); createdId = id; }
      else { const res = await api.post('/v1/piers', payload); createdId = res.data?.data?.id ?? res.data?.id; }
      toast.success(saveAction === 'DRAFT' ? 'Lưu tạm thành công' : saveAction === 'SAVE_AND_APPROVE' ? 'Phê duyệt thành công' : 'Gửi phê duyệt thành công');

      if (createdId && uploadedFiles.length > 0) { let up = 0; for (const fi of uploadedFiles) { const of = fi.originFileObj as File; if (!of) continue; try { const fd = new FormData(); fd.append('file', of); await api.post(`/v1/documents/upload/pier/${createdId}`, fd, { headers: { 'Content-Type': undefined as any } }); up++; } catch { toast.error(`Tải lên "${fi.name}" thất bại`); } } if (up > 0) toast.success(`Đã tải lên ${up} tệp`); }
      navigate('/Pier');
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra'); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{isEdit ? 'Chỉnh sửa Cầu cảng' : 'Tạo mới Cầu cảng'}</span>} open onCancel={() => navigate('/Pier')} footer={null} width={960} forceRender styles={{ body: { maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', overflowX: 'hidden', paddingTop: 8 } }}>
      <Form form={form} layout="vertical" initialValues={{ geometryType: 'POINT', operationalStatus: 'HIEN_HANH' }} scrollToFirstError>
        <Tabs defaultActiveKey="general" items={[
          {
            key: 'general', label: 'Thông tin chung', children: (<>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn đơn vị..." loading={loadingOrgs} disabled={isEdit || !isSystemAdmin} options={orgUnitOptions} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} onChange={handleOrgUnitChange} style={selectStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="portId" {...labelProps('Thuộc cảng biển')} style={{ marginBottom: spaceFormField }}><Select placeholder={watchedOrgUnitId ? 'Chọn cảng biển...' : 'Chọn Đơn vị trước'} loading={loadingPorts} disabled={!watchedOrgUnitId} options={portOptions} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} onChange={handlePortChange} style={selectStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="berthId" {...labelProps('Thuộc bến cảng')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Bến cảng là bắt buộc' }]}><Select placeholder={watchedPortId ? 'Chọn bến cảng...' : 'Chọn Cảng trước'} loading={loadingBerths} disabled={!watchedPortId} options={berthOptions} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} style={selectStyle} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}><Form.Item name="pierCode" {...labelProps('Mã cầu')} required style={{ marginBottom: spaceFormField }} tooltip="Mã cầu cảng được sinh tự động, không thể chỉnh sửa"><Input disabled placeholder={pierCodeLoading ? 'Đang sinh mã...' : watchedBerthId ? 'Mã tự động' : 'Chọn Bến cảng để sinh mã'} style={{ ...inputStyle, color: textTertiary, cursor: 'not-allowed' }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="pierName" {...labelProps('Tên cầu cảng')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tên cầu không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]}><Input placeholder="VD: Cầu cảng số 1" maxLength={255} style={inputStyle} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}><Form.Item name="province" {...labelProps('Tỉnh/Thành phố')} style={{ marginBottom: spaceFormField }}><Select showSearch placeholder="Chọn tỉnh/thành phố..." filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))} style={selectStyle} /></Form.Item></Col>
                <Col span={12}><Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}><Input.TextArea placeholder="VD: Khu bến cảng Lạch Huyện" maxLength={500} rows={1} style={{ borderRadius: 8, fontSize: fontSizeMd }} /></Form.Item></Col>
              </Row>
            </>),
          },
          {
            key: 'technical', label: 'Thông số kỹ thuật', children: (<>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="length" {...labelProps('Chiều dài (m)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0.01} max={500} step={0.01} precision={2} placeholder="0" style={numberStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="width" {...labelProps('Chiều rộng (m)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0.01} max={500} step={0.01} precision={2} placeholder="0" style={numberStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="designLoad" {...labelProps('Tải trọng TK (T/m²)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0.01} max={20} step={0.01} precision={2} placeholder="0" style={numberStyle} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="constructionGrade" {...labelProps('Phân cấp công trình')} style={{ marginBottom: spaceFormField }}><InputNumber min={1} max={5} placeholder="1-5" style={numberStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="structureType" {...labelProps('Loại kết cấu')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn loại..." options={STRUCTURE_TYPE_OPTIONS} style={selectStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="pierType" {...labelProps('Loại cầu')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn loại..." options={PIER_TYPE_OPTIONS} style={selectStyle} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="operationalFunction" {...labelProps('Chức năng khai thác')} style={{ marginBottom: spaceFormField }}><Input placeholder="VD: Bốc xếp container" maxLength={255} style={inputStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="operationalStatus" {...labelProps('Tình trạng HĐ')} style={{ marginBottom: spaceFormField }}><Select options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="currentWaterDepth" {...labelProps('Độ sâu khu nước')} style={{ marginBottom: spaceFormField }}><Input placeholder="VD: -12.5m" maxLength={20} style={inputStyle} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="designBedElevation" {...labelProps('Cao độ đáy bến TK')} style={{ marginBottom: spaceFormField }}><Input placeholder="VD: -14.0m" maxLength={20} style={inputStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="publishedVesselDWT" {...labelProps('Cỡ tàu công bố (DWT)')} style={{ marginBottom: spaceFormField }}><Input placeholder="VD: 50000" maxLength={20} style={inputStyle} /></Form.Item></Col>
                <Col span={8} />
              </Row>
            </>),
          },
          {
            key: 'announcement', label: 'Công bố & Số lượng', children: (<>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="openingAnnouncementDate" {...labelProps('Ngày công bố mở')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="openingDecision" {...labelProps('Quyết định mở')} style={{ marginBottom: spaceFormField }}><Input placeholder="Số QĐ" maxLength={200} style={inputStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="investmentAgreementDoc" {...labelProps('Thỏa thuận đầu tư')} style={{ marginBottom: spaceFormField }}><Input placeholder="Số văn bản" maxLength={2000} style={inputStyle} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="documentNumber" {...labelProps('Số văn bản')} style={{ marginBottom: spaceFormField }}><Input placeholder="Số VB" maxLength={200} style={inputStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="documentDate" {...labelProps('Ngày văn bản')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="cargoThroughput" {...labelProps('Sản lượng hàng hóa (tấn)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberStyle} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}><Form.Item name="operatingPierCount" {...labelProps('Số CC đang KT')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} max={99999} placeholder="0" style={numberStyle} /></Form.Item></Col>
                <Col span={6}><Form.Item name="publishedPierCount" {...labelProps('Số CC đã CB')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} max={99999} placeholder="0" style={numberStyle} /></Form.Item></Col>
                <Col span={6}><Form.Item name="investmentAgreementPierCount" {...labelProps('Số CC TĐT')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} max={99999} placeholder="0" style={numberStyle} /></Form.Item></Col>
                <Col span={6}><Form.Item name="receivesLargeVessel" {...labelProps('Tiếp nhận tàu lớn')} style={{ marginBottom: spaceFormField }} valuePropName="checked"><Switch /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}><Form.Item name="waterAreaNeutralScope" {...labelProps('Phạm vi khu nước neo')} style={{ marginBottom: spaceFormField }}><Input.TextArea placeholder="Mô tả phạm vi khu nước neo buộc tàu" maxLength={2000} rows={2} style={{ borderRadius: 8, fontSize: fontSizeMd }} /></Form.Item></Col>
              </Row>
            </>),
          },
          {
            key: 'maintenance', label: 'Bảo trì & Kiểm định', children: (<>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="maintenanceApprovalDate" {...labelProps('PD quy trình bảo trì')} style={{ marginBottom: spaceFormField }}><Input placeholder="MM/YYYY" maxLength={7} style={inputStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="safetyAssessmentDate" {...labelProps('Đánh giá ATCT')} style={{ marginBottom: spaceFormField }}><Input placeholder="MM/YYYY" maxLength={7} style={inputStyle} /></Form.Item></Col>
                <Col span={8}><Form.Item name="lastInspectionDate" {...labelProps('Kiểm định gần nhất')} style={{ marginBottom: spaceFormField }}><Input placeholder="MM/YYYY" maxLength={7} style={inputStyle} /></Form.Item></Col>
              </Row>
            </>),
          },
          {
            key: 'location', label: 'Vị trí', children: (<>
              <Row gutter={16}>
                <Col span={12}><Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}><Select options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} /></Form.Item></Col>
                <Col span={12}><Form.Item name="mapSymbolId" {...labelProps('Biểu tượng bản đồ')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn biểu tượng" allowClear showSearch optionFilterProp="label" loading={loadingSymbols} style={selectStyle}>{symbols.map((sym) => (<Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}><Space>{sym.image && <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />}<span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span></Space></Select.Option>))}</Select></Form.Item></Col>
              </Row>
              <Row gutter={16}><Col span={24}><Form.Item name="gisLocation" {...labelProps('Tọa độ GPS')} style={{ marginBottom: spaceFormField }}><GisLocationSelector defaultGeometryType={watchedGeometryType || 'POINT'} /></Form.Item></Col></Row>
            </>),
          },
          {
            key: 'files', label: 'File đính kèm', children: (<>
              {existingFiles.length > 0 && (<div style={{ display: 'flex', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceSm }}>{existingFiles.map((f: any) => { const isImg = (f.mimeType || f.contentType || '').startsWith('image/'); return (<div key={f.id} style={{ border: `0.5px solid ${borderDefault}`, borderRadius: radiusPill, padding: spaceSm, display: 'flex', alignItems: 'center', gap: spaceSm }}>{isImg ? <img src={`/api/v1/documents/${f.id}/file`} alt={f.fileName || f.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }} onClick={() => window.open(`/api/v1/documents/${f.id}/file`, '_blank')} /> : <UploadOutlined style={{ fontSize: 24, color: actionPrimary }} />}<div><div style={{ fontSize: fontSizeMd, color: textPrimary }}>{f.fileName || f.name}</div><div style={{ fontSize: fontSizeSm, color: textTertiary }}>{(f.fileSize / 1024).toFixed(1)} KB</div></div></div>); })}</div>)}
              <Upload beforeUpload={handleBeforeUpload} onRemove={handleRemoveFile} fileList={uploadedFiles} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"><Button icon={<UploadOutlined />}>Chọn file (≤10 files, ≤20MB)</Button></Upload>
            </>),
          },
        ]} />
        <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/Pier')} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
            <Button onClick={() => handleSave('DRAFT')} loading={submitting} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Lưu tạm</Button>
            {isSystemAdmin && <Button type="primary" onClick={() => handleSave('SUBMIT')} loading={submitting} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Gửi phê duyệt</Button>}
            {isSystemAdmin && <Button onClick={() => handleSave('SAVE_AND_APPROVE')} loading={submitting} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: statusOperational, borderColor: statusOperational, color: surfaceCard }}>Phê duyệt</Button>}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
