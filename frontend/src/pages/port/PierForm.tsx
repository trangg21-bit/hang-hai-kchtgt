import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Tabs, Row, Col, Input, Select, InputNumber, DatePicker, Switch, Form, Upload, Space, Button, Table } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { pierCRUD, portCRUD, berthCRUD } from '../../services/portService';
import type { Pier } from '../../types/port';
import { organizationService } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { VIETNAM_PROVINCES } from '../../types/common';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import toast from '../../components/ToastNotification';
import { statusOperational, actionPrimary, textPrimary, textSecondary, textTertiary, borderDefault, fontSizeMd, fontSizeSm, fontWeightBold, fontWeightMedium, radiusPill, radiusMd, spaceSm, spaceXs, spaceFormField, surfaceCard, uploadHintStyle } from '../../tokens';
import { colors } from '../../theme';

type SaveAction = 'DRAFT' | 'SUBMIT' | 'SAVE_AND_APPROVE' | 'APPROVED' | 'UPDATE';
type UploadFile = { uid: string; name: string; size: number; type: string; status: string; originFileObj?: File };
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

const OPERATIONAL_STATUS_OPTIONS = [{ value: 'OPERATIONAL', label: 'Đang khai thác/Vận hành' }, { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/Vận hành' }, { value: 'SUSPENDED', label: 'Dừng khai thác/Vận hành' }];
const GEOMETRY_TYPE_OPTIONS = [{ value: 'POINT', label: 'Đối tượng điểm' }, { value: 'LINE', label: 'Đối tượng đường' }, { value: 'POLYGON', label: 'Đối tượng vùng' }];
const COORD_SYS_OPTIONS = [{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }];

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, fontSize: fontSizeMd };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, width: '100%' };
const numberStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, width: '100%' };
const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

interface PierFormProps { form: any; id?: string; onFinish: (saved: boolean) => void; }

const PierForm = forwardRef<any, PierFormProps>(({ form, id, onFinish }, ref) => {
  const isEdit = !!id;
  const [submitting, setSubmitting] = useState(false);
  const [orgUnitOptions, setOrgUnitOptions] = useState<{ value: string; label: string }[]>([]);
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [berthOptions, setBerthOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [loadingBerths, setLoadingBerths] = useState(false);
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [pierCodeLoading, setPierCodeLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ lat: number | null; lng: number | null }>>([]);

  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);
  const watchedBerthId = Form.useWatch('berthId', form);
  const watchedGeometryType = Form.useWatch('geometryType', form);

  useEffect(() => { (async () => { setLoadingOrgs(true); try { const r = await organizationService.list({ pageSize: 1000 }); setOrgUnitOptions((r.data || []).map((o: any) => ({ value: o.id, label: o.name }))); } catch {} finally { setLoadingOrgs(false); } })(); }, []);
  useEffect(() => { if (!watchedOrgUnitId) { setPortOptions([]); return; } (async () => { setLoadingPorts(true); try { const r = await portCRUD.findAll({ orgUnitId: watchedOrgUnitId, page: 1, size: 1000 }); setPortOptions((r.data || []).map((p: any) => ({ value: p.id, label: p.portName }))); } catch {} finally { setLoadingPorts(false); } })(); }, [watchedOrgUnitId]);
  useEffect(() => { if (!watchedPortId) { setBerthOptions([]); return; } (async () => { setLoadingBerths(true); try { const r = await berthCRUD.search({ portId: watchedPortId, operationalStatus: 'OPERATIONAL', page: 1, pageSize: 1000 }); setBerthOptions((r.data || []).map((b: any) => ({ value: b.id, label: b.berthName }))); } catch {} finally { setLoadingBerths(false); } })(); }, [watchedPortId]);
  useEffect(() => { if (!watchedBerthId || isEdit) return; setPierCodeLoading(true); (async () => { try { const res = await api.get('/v1/piers/generate-code', { params: { berthId: watchedBerthId } }); const code = res.data?.data?.pierCode ?? res.data?.data; if (code) form.setFieldsValue({ pierCode: code }); } catch {} finally { setPierCodeLoading(false); } })(); }, [watchedBerthId, isEdit, form]);
  useEffect(() => { (async () => { setLoadingSymbols(true); try { const r = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' }); setSymbols(r.data || (r as any).content || []); } catch {} finally { setLoadingSymbols(false); } })(); }, []);
  useEffect(() => { if (watchedGeometryType) { form.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' }); } }, [watchedGeometryType]);
  useEffect(() => { if (!isEdit || !id) return; (async () => { try { const d: Pier = await pierCRUD.findById(id); form.setFieldsValue({ orgUnitId: d.orgUnitId, portId: d.portId, berthId: d.berthId, pierCode: d.pierCode, pierName: d.pierName, length: d.length, width: d.width, designLoad: d.designLoad, pierType: d.pierType, loaiCau: d.loaiCau, operationalFunction: d.operationalFunction, operationalStatus: d.operationalStatus, province: d.province, detailedLocation: d.detailedLocation, constructionGrade: d.constructionGrade, structureType: d.structureType, currentWaterDepth: d.currentWaterDepth, designBedElevation: d.designBedElevation, publishedVesselDWT: d.publishedVesselDWT, maintenanceApprovalDate: d.maintenanceApprovalDate, safetyAssessmentDate: d.safetyAssessmentDate, lastInspectionDate: d.lastInspectionDate, operatingPierCount: d.operatingPierCount, publishedPierCount: d.publishedPierCount, investmentAgreementPierCount: d.investmentAgreementPierCount, cargoThroughput: d.cargoThroughput, receivesLargeVessel: d.receivesLargeVessel, documentNumber: d.documentNumber, documentDate: d.documentDate ? dayjs(d.documentDate) : undefined, openingAnnouncementDate: d.openingAnnouncementDate ? dayjs(d.openingAnnouncementDate) : undefined, openingDecision: d.openingDecision, investmentAgreementDoc: d.investmentAgreementDoc, waterAreaNeutralScope: d.waterAreaNeutralScope, geometryType: d.geometryType || undefined, mapSymbolId: d.mapSymbolId || d.bieuTuongId, gisLocation: d.coordinates ? { geometryType: d.geometryType, coordinates: d.coordinates } : undefined, coordinateSystem: d.coordinateSystem, displayRule: d.displayRule });
        if (d.coordinates) { const pts: Array<{ lat: number; lng: number }> = []; const mm = d.coordinates.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)\)/); if (mm) { mm[1].split('),(').forEach((pt: string) => { const parts = pt.replace(/[()]/g, '').trim().split(/\s+/); pts.push({ lng: Number(parts[0]), lat: Number(parts[1]) }); }); } else { const m = d.coordinates.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/); if (m) pts.push({ lng: Number(m[1]), lat: Number(m[2]) }); } if (pts.length) setCoordinateList(pts); } try { const fr = await api.get(`/v1/piers/${id}/attachments`); const files = fr.data?.data || []; setUploadedFiles(files.map((a: any) => ({ uid: a.id ?? a.uid, name: a.fileName ?? a.name, size: a.fileSize ?? a.size ?? 0, type: a.fileType ?? '', status: 'done' as const }))); } catch {} } catch { toast.error('Không thể tải thông tin cầu cảng'); } })(); }, [isEdit, id, form]);

  const handleOrgUnitChange = () => { form.setFieldsValue({ portId: undefined, berthId: undefined, pierCode: undefined }); };
  const handlePortChange = () => { form.setFieldsValue({ berthId: undefined, pierCode: undefined }); };
  const handleBeforeUpload = (file: File) => { if (file.size > MAX_FILE_SIZE) { toast.error('Kích thước file tối đa 20MB'); return false; } const ext = file.name.split('.').pop()?.toLowerCase(); if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; } if (uploadedFiles.length >= MAX_FILE_COUNT) { toast.error('Tối đa 10 file'); return false; } setUploadedFiles((prev) => [...prev, { uid: `${Date.now()}`, name: file.name, size: file.size, type: file.type, status: 'done', originFileObj: file }]); return false; };

  const handleRemoveFile = (file: UploadFile) => { setUploadedFiles(prev => prev.filter(x => x.uid !== file.uid)); };

  const ddToDms = (dd: number): { d: number; m: number; s: number } => { if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 }; const abs = Math.abs(dd); const d = Math.floor(abs); const m = Math.floor((abs - d) * 60); const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2)); return { d, m, s }; };
  const addGpsPoint = () => setCoordinateList([...coordinateList, { lat: null, lng: null }]);
  const removeCoordinate = (i: number) => setCoordinateList(coordinateList.filter((_, idx) => idx !== i));
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', d: number, m: number, s: number) => { const next = [...coordinateList]; next[i] = { ...next[i], [field]: d + m / 60 + s / 3600 }; setCoordinateList(next); };

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    const vals = form.getFieldsValue();
    if (!vals.pierCode?.trim()) { toast.error('Mã cầu không được để trống'); return; }
    if (!vals.pierName?.trim()) { toast.error('Tên cầu không được để trống'); return; }
    if (!vals.berthId) { toast.error('Bến cảng là bắt buộc'); return; }
    const validCoords = coordinateList.filter(c => c.lat != null && c.lng != null && !isNaN(Number(c.lat)) && !isNaN(Number(c.lng)));
    if (saveAction !== 'DRAFT' && (coordinateList.length === 0 || validCoords.length === 0)) {
      toast.error('Vui lòng thêm ít nhất một tọa độ GPS');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { pierCode: vals.pierCode?.trim(), pierName: vals.pierName?.trim(), berthId: vals.berthId, portId: vals.portId || undefined, length: vals.length != null ? Number(vals.length) : undefined, width: vals.width != null ? Number(vals.width) : undefined, designLoad: vals.designLoad != null ? Number(vals.designLoad) : undefined, pierType: vals.pierType || undefined, loaiCau: vals.loaiCau || undefined, operationalFunction: vals.operationalFunction || undefined, operationalStatus: vals.operationalStatus || undefined, province: vals.province || undefined, detailedLocation: vals.detailedLocation || undefined, constructionGrade: vals.constructionGrade ?? undefined, structureType: vals.structureType ?? undefined, currentWaterDepth: vals.currentWaterDepth || undefined, designBedElevation: vals.designBedElevation || undefined, publishedVesselDWT: vals.publishedVesselDWT || undefined, maintenanceApprovalDate: vals.maintenanceApprovalDate || undefined, safetyAssessmentDate: vals.safetyAssessmentDate || undefined, lastInspectionDate: vals.lastInspectionDate || undefined, operatingPierCount: vals.operatingPierCount ?? undefined, publishedPierCount: vals.publishedPierCount ?? undefined, investmentAgreementPierCount: vals.investmentAgreementPierCount ?? undefined, cargoThroughput: vals.cargoThroughput != null ? Number(vals.cargoThroughput) : undefined, receivesLargeVessel: vals.receivesLargeVessel ?? undefined, documentNumber: vals.documentNumber || undefined, documentDate: vals.documentDate ? dayjs(vals.documentDate).format('YYYY-MM-DD') : undefined, openingAnnouncementDate: vals.openingAnnouncementDate ? dayjs(vals.openingAnnouncementDate).format('YYYY-MM-DD') : undefined, openingDecision: vals.openingDecision || undefined, investmentAgreementDoc: vals.investmentAgreementDoc || undefined, waterAreaNeutralScope: vals.waterAreaNeutralScope || undefined, geometryType: vals.geometryType || undefined, mapSymbolId: vals.mapSymbolId || undefined, coordinateSystem: vals.coordinateSystem, displayRule: vals.displayRule };
      // Process GPS coordinates into WKT format (like BerthForm)
      const manualCoords = coordinateList
        .filter(c => c.lat != null && c.lng != null && !isNaN(Number(c.lat)) && !isNaN(Number(c.lng)))
        .map(c => ({ latitude: Number(c.lat), longitude: Number(c.lng) }));
      (payload as any).latitude = manualCoords.length > 0 ? manualCoords[0].latitude : undefined;
      (payload as any).longitude = manualCoords.length > 0 ? manualCoords[0].longitude : undefined;
      (payload as any).coordinates = manualCoords.length > 1
        ? `MULTIPOINT(${manualCoords.map(c => `(${c.longitude} ${c.latitude})`).join(',')})`
        : manualCoords.length === 1
          ? `POINT(${manualCoords[0].longitude} ${manualCoords[0].latitude})`
          : undefined;
      if (saveAction !== 'UPDATE') (payload as any).saveAction = saveAction;
      Object.keys(payload).forEach((k) => { if (payload[k] === undefined) delete payload[k]; });
      let createdId: string | undefined;
      if (isEdit && id) {
        await api.put('/v1/piers', { ...payload, id });
        createdId = id;
      }
      else { const res = await api.post('/v1/piers', payload); createdId = res.data?.data?.id ?? res.data?.id; console.log('Created pier with id:', createdId, 'response:', res.data); }
      if (createdId && uploadedFiles.length > 0) { let uploaded = 0; for (const fi of uploadedFiles) { const of = fi.originFileObj as File; if (!of) continue; try { const fd = new FormData(); fd.append('files', of); await api.post(`/v1/piers/${createdId}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); uploaded++; } catch { toast.error(`Tải lên tệp "${fi.name}" thất bại`); } } if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`); }
      toast.success(saveAction === 'DRAFT' ? 'Lưu tạm thành công' : saveAction === 'APPROVED' ? 'Phê duyệt thành công' : saveAction === 'UPDATE' ? 'Cập nhật thành công' : 'Gửi phê duyệt thành công');
      onFinish(true);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra'); } finally { setSubmitting(false); }
  }, [form, isEdit, id, uploadedFiles, onFinish, coordinateList]);

  useImperativeHandle(ref, () => ({ submit: (saveAction: SaveAction) => handleSave(saveAction) }), [handleSave]);

  return (
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0 }} items={[
      { key: 'general', label: 'Thông tin chung', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}><Col span={12}><Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn đơn vị quản lý" loading={loadingOrgs} disabled={isEdit} options={orgUnitOptions} showSearch optionFilterProp="label" onChange={handleOrgUnitChange} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="portId" {...labelProps('Thuộc cảng biển')} required style={{ marginBottom: spaceFormField }}><Select placeholder={!watchedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : portOptions.length === 0 && !loadingPorts ? 'Không có cảng biển thuộc đơn vị quản lý' : 'Chọn cảng biển...'} loading={loadingPorts} disabled={!watchedOrgUnitId || (portOptions.length === 0 && !loadingPorts)} options={portOptions} showSearch optionFilterProp="label" notFoundContent="Không có cảng biển thuộc đơn vị quản lý" onChange={handlePortChange} style={selectStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="berthId" {...labelProps('Thuộc bến cảng')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Bến cảng là bắt buộc' }]}><Select placeholder={!watchedPortId ? 'Vui lòng chọn cảng biển trước' : berthOptions.length === 0 && !loadingBerths ? 'Không có bến cảng thuộc cảng biển' : 'Chọn bến cảng...'} loading={loadingBerths} disabled={!watchedPortId || (berthOptions.length === 0 && !loadingBerths)} options={berthOptions} showSearch optionFilterProp="label" notFoundContent="Không có bến cảng thuộc cảng biển" style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="waterway" {...labelProps('Thuộc luồng hàng hải')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập luồng hàng hải" maxLength={255} style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="pierCode" {...labelProps('Mã cầu cảng')} required style={{ marginBottom: spaceFormField }} tooltip="Mã được sinh tự động"><Input disabled placeholder={pierCodeLoading ? 'Đang sinh mã...' : watchedBerthId ? 'Mã tự động' : 'Chọn Bến để sinh mã'} style={{ ...inputStyle, color: textTertiary }} /></Form.Item></Col><Col span={12}><Form.Item name="pierName" {...labelProps('Tên cầu cảng')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true }, { max: 255 }]}><Input placeholder="Nhập tên cầu cảng" maxLength={255} style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="province" {...labelProps('Địa điểm (Tỉnh/Thành phố)')} style={{ marginBottom: spaceFormField }}><Select showSearch placeholder="Chọn địa điểm" filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập địa điểm chi tiết" maxLength={500} style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="constructionGrade" {...labelProps('Phân cấp công trình')} style={{ marginBottom: spaceFormField }}><InputNumber min={1} max={5} placeholder="1-5" style={numberStyle} /></Form.Item></Col><Col span={12}><Form.Item name="structureType" {...labelProps('Loại kết cấu cầu cảng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn loại" options={[{ value: 1, label: 'Bến nước' }, { value: 2, label: 'Bến bờ' }, { value: 3, label: 'Bến phao' }, { value: 4, label: 'Bến chuyên dùng' }]} style={selectStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="pierType" {...labelProps('Loại cầu')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn loại cầu" allowClear options={[{ value: 'CONTAINER', label: 'Container' }, { value: 'TONG_HOP', label: 'Tổng hợp' }, { value: 'HANH_KHACH', label: 'Hành khách' }, { value: 'CHUYEN_DUNG_XANG_DAU', label: 'Chuyên dùng xăng dầu' }, { value: 'CHUYEN_DUNG_ROI_QUANG', label: 'Chuyên dùng rời/quặng' }, { value: 'KHAC', label: 'Khác' }]} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="designLoad" {...labelProps('Tải trọng thiết kế (T/m²)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} max={999} step={0.01} precision={2} placeholder="0" style={numberStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="operationalFunction" {...labelProps('Công năng khai thác')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập công năng khai thác" maxLength={255} style={inputStyle} /></Form.Item></Col><Col span={12}><Form.Item name="length" {...labelProps('Chiều dài (m)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0.01} max={500} step={0.01} precision={2} placeholder="0" style={numberStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="width" {...labelProps('Chiều rộng (m)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0.01} max={500} step={0.01} precision={2} placeholder="0" style={numberStyle} /></Form.Item></Col><Col span={12}><Form.Item name="currentWaterDepth" {...labelProps('Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} max={100} step={0.1} precision={1} placeholder="0" style={numberStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="designBedElevation" {...labelProps('Cao độ đáy bến thiết kế')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} max={100} step={0.1} precision={1} placeholder="0" style={numberStyle} /></Form.Item></Col><Col span={12}><Form.Item name="publishedVesselDWT" {...labelProps('Cỡ tàu khai thác theo công bố (DWT)')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} max={999999} placeholder="0" style={numberStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="lastInspectionDate" {...labelProps('Thời điểm kiểm định gần nhất')} style={{ marginBottom: spaceFormField }}><Input placeholder="MM/YYYY" maxLength={7} style={inputStyle} /></Form.Item></Col><Col span={12}><Form.Item name="maintenanceApprovalDate" {...labelProps('Thời điểm phê duyệt quy trình bảo trì công trình')} style={{ marginBottom: spaceFormField }}><Input placeholder="MM/YYYY" maxLength={7} style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="safetyAssessmentDate" {...labelProps('Thời điểm được chấp thuận hồ sơ báo cáo đánh giá ATCT (gần nhất)')} style={{ marginBottom: spaceFormField }}><Input placeholder="MM/YYYY" maxLength={7} style={inputStyle} /></Form.Item></Col><Col span={12}><Form.Item name="operatingPierCount" {...labelProps('Số lượng cầu cảng đang khai thác')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} max={99999} placeholder="0" style={numberStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="publishedPierCount" {...labelProps('Số lượng cầu cảng đã công bố')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} max={99999} placeholder="0" style={numberStyle} /></Form.Item></Col><Col span={12}><Form.Item name="investmentAgreementPierCount" {...labelProps('Số lượng cầu cảng đang được thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} max={99999} placeholder="0" style={numberStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="cargoThroughput" {...labelProps('Sản lượng hàng thông qua')} style={{ marginBottom: spaceFormField }}><InputNumber min={0} max={999999999} step={0.01} precision={2} placeholder="0" style={numberStyle} /></Form.Item></Col><Col span={12}><Form.Item name="operationalStatus" {...labelProps('Tình trạng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn tình trạng" options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="receivesLargeVessel" {...labelProps('Tiếp nhận tàu có trọng tải lớn hơn thông số tại quyết định công bố')} style={{ marginBottom: spaceFormField }} valuePropName="checked"><Switch /></Form.Item></Col></Row>
      </div>)},
      { key: 'announcement', label: 'Thông tin phương án, công bố & phạm vi khu nước', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}><Col span={12}><Form.Item name="documentNumber" {...labelProps('Số văn bản')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập số văn bản" maxLength={200} style={inputStyle} /></Form.Item></Col><Col span={12}><Form.Item name="documentDate" {...labelProps('Ngày văn bản')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn ngày" format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="openingAnnouncementDate" {...labelProps('Thời điểm công bố mở, đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn thời điểm" format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col><Col span={12}><Form.Item name="openingDecision" {...labelProps('Quyết định công bố/ Văn bản cho phép khai thác')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập quyết định" maxLength={2000} style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="investmentAgreementDoc" {...labelProps('Văn bản thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập văn bản thỏa thuận" maxLength={2000} style={inputStyle} /></Form.Item></Col><Col span={12}><Form.Item name="waterAreaNeutralScope" {...labelProps('Phạm vi khu nước neo buộc tàu')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập phạm vi khu nước" maxLength={2000} style={inputStyle} /></Form.Item></Col></Row>
      </div>)},
      { key: 'location', label: 'Thông tin vị trí', children: (<div style={{ paddingTop: 16 }}>
      <Row gutter={16}><Col span={12}><Form.Item name="geometryType" {...labelProps('Loại đối tượng')} required style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn loại đối tượng" options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn biểu tượng" allowClear showSearch optionFilterProp="label" disabled={!isEdit && !watchedGeometryType} loading={loadingSymbols} style={selectStyle}>{symbols.map((sym) => (<Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}><Space>{sym.image && <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />}<span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span></Space></Select.Option>))}</Select></Form.Item></Col></Row>
      <Row gutter={16}><Col span={12}><Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} /></Form.Item></Col><Col span={12}><Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}><Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={{ ...inputStyle, color: '#8c8c8c', cursor: 'not-allowed' }} /></Form.Item></Col></Row>
      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tọa độ GPS</span><span style={{ color: '#ff4d4f', marginLeft: 4, fontSize: fontSizeMd }}>*</span></span>
        {coordinateList.length > 0 && <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!watchedGeometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>}
      </div>
      {coordinateList.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!watchedGeometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
        </div>
      ) : (
        <Table className="list-view-table" dataSource={coordinateList.map((c, i) => ({ ...c, key: i, _idx: i }))} pagination={false} size="middle" bordered scroll={{ x: 820 }}>
          <Table.Column title="STT" key="stt" width={60} align="center" render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Vĩ độ (N)" key="lat" render={(_: any, record: any) => { const dms = ddToDms(record.lat); return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} min={0} max={90} placeholder="Độ" onChange={(v) => updateGpsPoint(record._idx, 'lat', v ?? 0, dms.m, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} min={0} max={59} placeholder="Phút" onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, v ?? 0, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" onChange={(v) => updateGpsPoint(record._idx, 'lat', dms.d, dms.m, v ?? 0)} style={{ flex: 1.2 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>; }} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Kinh độ (E)" key="lng" render={(_: any, record: any) => { const dms = ddToDms(record.lng); return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} min={0} max={180} placeholder="Độ" onChange={(v) => updateGpsPoint(record._idx, 'lng', v ?? 0, dms.m, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} min={0} max={59} placeholder="Phút" onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, v ?? 0, dms.s)} style={{ flex: 1 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} min={0} max={59.99} step={0.01} placeholder="Giây" onChange={(v) => updateGpsPoint(record._idx, 'lng', dms.d, dms.m, v ?? 0)} style={{ flex: 1.2 }} controls={false} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>; }} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Thao tác" key="actions" width={80} align="center" render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeCoordinate(record._idx)} />} onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
        </Table>
      )}
      </div>)},
      { key: 'files', label: 'File đính kèm', children: (<div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
        {uploadedFiles.length > 0 && (<Upload beforeUpload={handleBeforeUpload} showUploadList={false} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple><Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>Thêm file</Button></Upload>)}
      </div>
      {uploadedFiles.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
          <Upload beforeUpload={handleBeforeUpload} showUploadList={false} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif" multiple><Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button></Upload>
        </div>
      ) : (
        <Table className="list-view-table" dataSource={uploadedFiles.map((f, i) => ({ ...f, key: f.uid, _idx: i, name: f.name }))} pagination={false} size="middle" bordered>
          <Table.Column title="STT" key="stt" width={60} align="center" render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Tên file" key="name" dataIndex="name" render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>} onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
          <Table.Column title="Thao tác" key="actions" width={80} align="center" render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveFile(record)} />} onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
        </Table>
      )}
      <div style={{ marginTop: spaceSm }}><span style={uploadHintStyle}>Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.</span></div>
      </div>)},
    ]} />
  );
});

PierForm.displayName = 'PierForm';
export default PierForm;
