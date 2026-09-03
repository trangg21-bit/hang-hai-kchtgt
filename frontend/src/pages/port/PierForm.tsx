import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Tabs, Row, Col, Input, Select, InputNumber, DatePicker, Switch, Form, Upload, Space, Button, Table, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, FileOutlined, InboxOutlined, DownloadOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { pierCRUD, portCRUD, berthCRUD } from '../../services/portService';
import type { Pier } from '../../types/port';
import { organizationService } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { lineObjectService } from '../../services/lineObjectService';
import { LineObject } from '../../types/lineObject';
import { useAuthStore } from '../../store/authStore';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';
import { fmtInputNumber } from '../../utils/numFmt';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { colors } from '../../themetokenchk';
import {
  textPrimary, textTertiary, borderDefault, actionPrimary, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  radiusPill, radiusMd, spaceSm, spaceMd, spaceFormField,
  surfaceCard, readonlyInputStyle, sidebarBg,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerTabContentStyle,
} from '../../themetokenchk';

type SaveAction = 'DRAFT' | 'SUBMIT' | 'SAVE_AND_APPROVE' | 'APPROVED' | 'UPDATE';
type UploadFile = { uid: string; name: string; size: number; type: string; status: string; originFileObj?: File };
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, fontSize: fontSizeMd };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, width: '100%' };

const OPERATIONAL_STATUS_OPTIONS = [{ value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' }, { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' }, { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' }];
// Loại kết cấu cầu cảng dùng chung danh mục với bến cảng (LOAI_KET_CAU_BC_CC)
const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Kết cấu bệ cọc cao' }, { value: 2, label: 'Kết cấu cường từ' },
  { value: 3, label: 'Kết cấu trọng lực' }, { value: 4, label: 'Kết cấu khác' },
];
const CONSTRUCTION_GRADE_OPTIONS = [
  { value: 1, label: 'Cấp đặc biệt' },
  { value: 2, label: 'Cấp 1' },
  { value: 3, label: 'Cấp 2' },
  { value: 4, label: 'Cấp 3' },
  { value: 5, label: 'Cấp 4' },
];
const GEOMETRY_TYPE_OPTIONS = [{ value: 'POINT', label: 'Đối tượng điểm' }, { value: 'LINE', label: 'Đối tượng đường' }, { value: 'POLYGON', label: 'Đối tượng vùng' }];
const COORD_SYS_OPTIONS = [{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }];
// Số lượng tọa độ mặc định tương ứng với từng loại đối tượng: điểm → 1, đường → 2, vùng → 3
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

// Helper chuyển đổi giữa chuỗi "MM/YYYY" (lưu DB) và dayjs (DatePicker month)
const parseMonthYear = (s?: string | null) => {
  if (!s) return undefined;
  const parts = String(s).split('/');
  if (parts.length !== 2) return undefined;
  const m = parseInt(parts[0], 10);
  const y = parseInt(parts[1], 10);
  if (!m || !y || m < 1 || m > 12 || y < 1000) return undefined;
  return dayjs(`${y}-${String(m).padStart(2, '0')}-01`);
};
const fmtMonthYear = (d: any) => (d ? dayjs(d).format('MM/YYYY') : undefined);
const numberStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, width: '100%' };

// Parse WKT (coordinates) từ backend — hỗ trợ POINT/MULTIPOINT/LINESTRING/POLYGON (chuẩn VTS CHK)
const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length-1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
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

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px). */
const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  return (
    <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
      <InputNumber value={dVal} min={0} max={maxDeg} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(v, mVal ?? null, sVal ?? null)} style={{ flex: 1, minWidth: 0, borderRadius: '999px 0 0 999px', height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>°</span>
      <InputNumber value={mVal} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal ?? null, v, sVal ?? null)} style={{ flex: 1, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>'</span>
      <InputNumber value={sVal} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal ?? null, mVal ?? null, v)} style={{ flex: 1.2, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitEndStyle}>"</span>
    </Space.Compact>
  );
};

interface PierFormProps { form: any; id?: string; onFinish: (saved: boolean) => void; onSubmittingChange?: (submitting: boolean) => void; }

const PierForm = forwardRef<any, PierFormProps>(({ form, id, onFinish, onSubmittingChange }, ref) => {
  const isEdit = !!id;
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [orgUnits, setOrgUnits] = useState<Array<{ id: string; name: string; code?: string; parentId?: string }>>([]);
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [berthOptions, setBerthOptions] = useState<{ value: string; label: string }[]>([]);
  const [waterwayOptions, setWaterwayOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [loadingBerths, setLoadingBerths] = useState(false);
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [pierCodeLoading, setPierCodeLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [gpsPage, setGpsPage] = useState(1);
  const [filePage, setFilePage] = useState(1);
  const [indicatorOpen, setIndicatorOpen] = useState(true);
  const [athhPlanOpen, setAthhPlanOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [mooringScopeOpen, setMooringScopeOpen] = useState(true);

  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = (currentUser?.permissions?.includes('admin:all') || currentUser?.permissions?.includes('*')) ?? false;

  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);
  const watchedBerthId = Form.useWatch('berthId', form);
  const watchedGeometryType = Form.useWatch('geometryType', form);

  /** true khi field đã đạt đủ max ký tự — bật viền đỏ ô nhập + message bên dưới. */
  const useMaxReached = (name: string, max: number): boolean => {
    const raw = Form.useWatch(name, form) ?? '';
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };
  const atMax = {
    pierName: useMaxReached('pierName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    length: useMaxReached('length', 20),
    width: useMaxReached('width', 20),
    currentWaterDepth: useMaxReached('currentWaterDepth', 20),
    designBedElevation: useMaxReached('designBedElevation', 20),
    publishedVesselDWT: useMaxReached('publishedVesselDWT', 20),
    operatingPierCount: useMaxReached('operatingPierCount', 5),
    publishedPierCount: useMaxReached('publishedPierCount', 5),
    investmentAgreementPierCount: useMaxReached('investmentAgreementPierCount', 5),
    cargoThroughput: useMaxReached('cargoThroughput', 20),
    documentNumber: useMaxReached('documentNumber', 20),
  };

  useEffect(() => { (async () => { setLoadingOrgs(true); try { const r = await organizationService.list({ pageSize: 1000 }); setOrgUnits(r.data || []); } catch {} finally { setLoadingOrgs(false); } })(); }, []);
  // Luồng hàng hải = GIS LineObject loại WATERWAY (đã công bố) — giống Bến cảng
  useEffect(() => { lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize: 1000 }).then(r => setWaterwayOptions((r.data || []).map((l: any) => ({ value: l.id, label: l.name || l.code })))).catch(() => {}); }, []);
  // Mặc định Đơn vị quản lý = đơn vị của user đăng nhập (giống Bến cảng)
  useEffect(() => { if (!isSystemAdmin && !isEdit) { api.get('/users/me').then(r => { const p = r.data?.data ?? r.data; if (p?.orgUnitId) form.setFieldsValue({ orgUnitId: p.orgUnitId }); }).catch(() => {}); } }, [isSystemAdmin, isEdit, form]);
  useEffect(() => { if (!watchedOrgUnitId) { setPortOptions([]); return; } (async () => { setLoadingPorts(true); try { const r = await portCRUD.findAll({ orgUnitId: watchedOrgUnitId, approvalStatus: 'APPROVED', page: 1, size: 1000 }); setPortOptions((r.data || []).map((p: any) => ({ value: p.id, label: p.portName }))); } catch {} finally { setLoadingPorts(false); } })(); }, [watchedOrgUnitId]);
  useEffect(() => { if (!watchedPortId) { setBerthOptions([]); return; } (async () => { setLoadingBerths(true); try { const r = await berthCRUD.search({ portId: watchedPortId, approvalStatus: 'APPROVED', page: 1, pageSize: 1000 }); setBerthOptions((r.data || []).map((b: any) => ({ value: b.id, label: b.berthName }))); } catch {} finally { setLoadingBerths(false); } })(); }, [watchedPortId]);
  useEffect(() => { if (!watchedBerthId || isEdit) return; setPierCodeLoading(true); (async () => { try { const res = await api.get('/v1/piers/generate-code', { params: { berthId: watchedBerthId } }); const code = res.data?.data?.pierCode ?? res.data?.data; if (code) form.setFieldsValue({ pierCode: code }); } catch {} finally { setPierCodeLoading(false); } })(); }, [watchedBerthId, isEdit, form]);
  useEffect(() => { (async () => { setLoadingSymbols(true); try { const r = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' }); setSymbols(r.data || (r as any).content || []); } catch {} finally { setLoadingSymbols(false); } })(); }, []);
  // Khi chọn loại đối tượng → tự set hệ quy chiếu, quy tắc hiển thị và thêm sẵn số dòng tọa độ tương ứng
  // (GIỮ tọa độ đã nhập/chọn, chỉ thêm dòng trống cho đủ số lượng — không xóa dữ liệu cũ)
  useEffect(() => {
    if (!watchedGeometryType) {
      form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      setCoordinateList([]);
      return;
    }
    form.setFieldsValue({ displayRule: 'Độ, phút, giây (DMS)' });
    if (!isEdit) {
      form.setFieldsValue({ coordinateSystem: 1 });
      const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 0;
      setCoordinateList(Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null })));
    } else {
      if (form.getFieldValue('coordinateSystem') == null) form.setFieldsValue({ coordinateSystem: 1 });
      // Chỉnh sửa: giữ tọa độ đã nhập, tự thêm dòng trống cho đủ số lượng theo loại đối tượng (điểm → 1, đường → 2, vùng → 3)
      const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
      setCoordinateList((prev) => {
        if (prev.length >= count) return prev;
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      });
    }
  }, [watchedGeometryType]);
  useEffect(() => { if (!isEdit || !id) return; (async () => { try { const d: Pier = await pierCRUD.findById(id); form.setFieldsValue({ orgUnitId: d.orgUnitId, portId: d.portId, berthId: d.berthId, navigationChannelId: d.navigationChannelId, pierCode: d.pierCode, pierName: d.pierName, length: d.length, width: d.width, operationalFunction: d.operationalFunction, operationalStatus: d.operationalStatus, province: d.province, detailedLocation: d.detailedLocation, constructionGrade: d.constructionGrade, structureType: d.structureType, currentWaterDepth: d.currentWaterDepth, designBedElevation: d.designBedElevation, publishedVesselDWT: d.publishedVesselDWT, maintenanceApprovalDate: parseMonthYear(d.maintenanceApprovalDate), safetyAssessmentDate: parseMonthYear(d.safetyAssessmentDate), lastInspectionDate: parseMonthYear(d.lastInspectionDate), operatingPierCount: d.operatingPierCount, publishedPierCount: d.publishedPierCount, investmentAgreementPierCount: d.investmentAgreementPierCount, cargoThroughput: d.cargoThroughput, receivesLargeVessel: d.receivesLargeVessel, documentNumber: d.documentNumber, documentDate: d.documentDate ? dayjs(d.documentDate) : undefined, openingAnnouncementDate: d.openingAnnouncementDate ? dayjs(d.openingAnnouncementDate) : undefined, openingDecision: d.openingDecision, investmentAgreementDoc: d.investmentAgreementDoc, waterAreaNeutralScope: d.waterAreaNeutralScope, geometryType: d.geometryType || undefined, mapSymbolId: d.mapSymbolId || d.bieuTuongId, coordinateSystem: d.geometryType ? (d as any).coordinateSystem : undefined, displayRule: (d as any).displayRule });
        const pts = d.coordinates ? parseGisCoordinates({ geometryType: d.geometryType, coordinates: d.coordinates }) : [];
        if (pts.length > 0) {
          setCoordinateList(pts.map(c => {
            const latDms = ddToDms(c.latitude);
            const lngDms = ddToDms(c.longitude);
            return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
          }));
        }
        try { const fr = await api.get(`/v1/piers/${id}/attachments`); const files = fr.data?.data || []; setUploadedFiles(files.map((a: any) => ({ uid: a.id ?? a.uid, name: a.fileName ?? a.name, size: a.fileSize ?? a.size ?? 0, type: a.fileType ?? '', status: 'done' as const }))); } catch {} } catch { toast.error('Không thể tải thông tin cầu cảng'); } })(); }, [isEdit, id, form]);

  const handleOrgUnitChange = () => { form.setFieldsValue({ portId: undefined, berthId: undefined, pierCode: undefined }); setCoordinateList([]); };
  const handlePortChange = () => { form.setFieldsValue({ berthId: undefined, pierCode: undefined }); };
  const handleBeforeUpload = (file: File) => { if (file.size > MAX_FILE_SIZE) { toast.error('Kích thước file tối đa 20MB'); return false; } const ext = file.name.split('.').pop()?.toLowerCase(); if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; } if (uploadedFiles.length >= MAX_FILE_COUNT) { toast.error('Tối đa 10 file'); return false; } setUploadedFiles((prev) => [...prev, { uid: `${Date.now()}`, name: file.name, size: file.size, type: file.type, status: 'done', originFileObj: file }]); return false; };

  const handleRemoveFile = (file: UploadFile) => { setUploadedFiles(prev => prev.filter(x => x.uid !== file.uid)); };

  const addGpsPoint = () => { setCoordinateList([...coordinateList, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]); setGpsError(null); };
  const removeCoordinate = (i: number) => { setCoordinateList(coordinateList.filter((_, idx) => idx !== i)); setGpsError(null); };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setCoordinateList(p => { const n = [...p]; n[i] = {
      ...n[i],
      [field === 'lat' ? 'latD' : 'lngD']: dVal,
      [field === 'lat' ? 'latM' : 'lngM']: mVal,
      [field === 'lat' ? 'latS' : 'lngS']: sVal,
    }; return n; });
    setGpsError(null);
  };

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    const vals = form.getFieldsValue();
    try { await form.validateFields(); } catch (e: any) {
      const errFields: Array<{ name: Array<string | number> }> = e?.errorFields ?? [];
      if (errFields.some((f) => f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule' || f.name[0] === 'geometryType')) setActiveTabKey('location');
      else setActiveTabKey('general');
      return;
    }
    const manualCoords = coordinateList
      .filter(c => (c.latD != null && c.lngD != null) || (c.latM != null && c.lngM != null) || (c.latS != null && c.lngS != null))
      .map(c => ({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 }));
    if (vals.geometryType) {
      const minCount = GEOMETRY_POINT_COUNT[vals.geometryType] ?? 1;
      if (manualCoords.length < minCount) {
        toast.error(vals.geometryType === 'POLYGON' ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ' : vals.geometryType === 'LINE' ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ' : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ');
        setActiveTabKey('location');
        return;
      }
    }
    onSubmittingChange?.(true);
    try {
      const payload: Record<string, unknown> = { pierCode: vals.pierCode?.trim(), pierName: vals.pierName?.trim(), berthId: vals.berthId, portId: vals.portId || undefined, navigationChannelId: vals.navigationChannelId || undefined, length: vals.length != null ? Number(vals.length) : undefined, width: vals.width != null ? Number(vals.width) : undefined, operationalFunction: vals.operationalFunction || undefined, operationalStatus: vals.operationalStatus || undefined, province: vals.province || undefined, detailedLocation: vals.detailedLocation || undefined, constructionGrade: vals.constructionGrade ?? undefined, structureType: vals.structureType ?? undefined, currentWaterDepth: vals.currentWaterDepth || undefined, designBedElevation: vals.designBedElevation || undefined, publishedVesselDWT: vals.publishedVesselDWT || undefined, maintenanceApprovalDate: fmtMonthYear(vals.maintenanceApprovalDate), safetyAssessmentDate: fmtMonthYear(vals.safetyAssessmentDate), lastInspectionDate: fmtMonthYear(vals.lastInspectionDate), operatingPierCount: vals.operatingPierCount ?? undefined, publishedPierCount: vals.publishedPierCount ?? undefined, investmentAgreementPierCount: vals.investmentAgreementPierCount ?? undefined, cargoThroughput: vals.cargoThroughput != null ? Number(vals.cargoThroughput) : undefined, receivesLargeVessel: vals.receivesLargeVessel ?? undefined, documentNumber: vals.documentNumber || undefined, documentDate: vals.documentDate ? dayjs(vals.documentDate).format('YYYY-MM-DD') : undefined, openingAnnouncementDate: vals.openingAnnouncementDate ? dayjs(vals.openingAnnouncementDate).format('YYYY-MM-DD') : undefined, openingDecision: vals.openingDecision || undefined, investmentAgreementDoc: vals.investmentAgreementDoc || undefined, waterAreaNeutralScope: vals.waterAreaNeutralScope || undefined, geometryType: vals.geometryType || undefined, mapSymbolId: vals.mapSymbolId || undefined, coordinateSystem: vals.coordinateSystem, displayRule: vals.displayRule };
      // Process GPS coordinates into WKT format (chuẩn VTS CHK — giống Bến phao)
      (payload as any).latitude = manualCoords.length > 0 ? manualCoords[0].latitude : undefined;
      (payload as any).longitude = manualCoords.length > 0 ? manualCoords[0].longitude : undefined;
      (payload as any).coordinates = (() => {
        if (manualCoords.length === 0) return undefined;
        if (manualCoords.length === 1) return `POINT(${manualCoords[0].longitude} ${manualCoords[0].latitude})`;
        const geom = vals.geometryType;
        if (geom === 'LINE') return `LINESTRING(${manualCoords.map(c => `${c.longitude} ${c.latitude}`).join(',')})`;
        if (geom === 'POLYGON') return `POLYGON((${[...manualCoords, manualCoords[0]].map(c => `${c.longitude} ${c.latitude}`).join(',')}))`;
        return `MULTIPOINT(${manualCoords.map(c => `(${c.longitude} ${c.latitude})`).join(',')})`;
      })();
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
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra'); } finally { onSubmittingChange?.(false); }
  }, [form, isEdit, id, uploadedFiles, onFinish, coordinateList, onSubmittingChange]);

  useImperativeHandle(ref, () => ({ submit: (saveAction: SaveAction) => handleSave(saveAction) }), [handleSave]);

  const tabItems = [
    // Tab 1: Thông tin chung
    { key: 'general', label: 'Thông tin chung', children: (<div style={drawerTabContentStyle}>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]} style={{ marginBottom: spaceFormField }}><OrgUnitTreeSelect organizations={orgUnits} placeholder="Chọn đơn vị quản lý..." loading={loadingOrgs} disabled={isEdit || !isSystemAdmin} showPath treeDefaultExpandAll={false} onChange={handleOrgUnitChange} /></Form.Item></Col><Col span={12}><Form.Item name="portId" {...labelProps('Thuộc cảng biển')} required rules={[{ required: true, message: 'Cảng biển là bắt buộc' }]} style={{ marginBottom: spaceFormField }}><Select placeholder={!watchedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : portOptions.length === 0 && !loadingPorts ? 'Không có cảng biển thuộc đơn vị quản lý' : 'Chọn cảng biển...'} loading={loadingPorts} disabled={!watchedOrgUnitId || (portOptions.length === 0 && !loadingPorts)} options={portOptions} showSearch optionFilterProp="label" notFoundContent="Không có cảng biển thuộc đơn vị quản lý" onChange={handlePortChange} style={selectStyle} /></Form.Item></Col></Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="berthId" {...labelProps('Thuộc bến cảng')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Bến cảng là bắt buộc' }]}><Select placeholder={!watchedPortId ? 'Vui lòng chọn cảng biển trước' : berthOptions.length === 0 && !loadingBerths ? 'Không có bến cảng thuộc cảng biển' : 'Chọn bến cảng...'} loading={loadingBerths} disabled={!watchedPortId || (berthOptions.length === 0 && !loadingBerths)} options={berthOptions} showSearch optionFilterProp="label" notFoundContent="Không có bến cảng thuộc cảng biển" style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="navigationChannelId" {...labelProps('Thuộc luồng hàng hải')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn luồng hàng hải..." options={waterwayOptions} showSearch allowClear optionFilterProp="label" style={selectStyle} /></Form.Item></Col></Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="pierCode" {...labelProps('Mã cầu cảng')} style={{ marginBottom: spaceFormField }} tooltip="Mã được sinh tự động"><Input disabled placeholder={pierCodeLoading ? 'Đang sinh mã...' : watchedBerthId ? 'Mã tự động' : 'Chọn Bến để sinh mã'} style={readonlyInputStyle} /></Form.Item></Col><Col span={12}><Form.Item name="pierName" {...labelProps('Tên cầu cảng')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true }, { max: 255 }]} validateStatus={atMax.pierName ? 'error' : undefined} help={atMax.pierName ? 'Đã đạt tối đa 255 ký tự' : undefined}><Input placeholder="Nhập tên cầu cảng" maxLength={255} showCount style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="province" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}><Select showSearch placeholder="Chọn địa điểm" filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.detailedLocation ? 'error' : undefined} help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}><Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="constructionGrade" {...labelProps('Phân cấp công trình')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn phân cấp công trình" allowClear options={CONSTRUCTION_GRADE_OPTIONS} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="structureType" {...labelProps('Loại kết cấu cầu cảng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn loại kết cấu" options={STRUCTURE_TYPE_OPTIONS} style={selectStyle} /></Form.Item></Col></Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="operationalFunction" {...labelProps('Công năng khai thác')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập công năng khai thác" maxLength={255} showCount style={inputStyle} /></Form.Item></Col><Col span={12}><Form.Item name="operationalStatus" {...labelProps('Tình trạng')} style={{ marginBottom: spaceFormField }} initialValue="NOT_YET_OPERATIONAL" rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}><Select placeholder="Chọn tình trạng" options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} /></Form.Item></Col></Row>

      {/* ── Toggle: Chỉ số tổng hợp (gom vào tab Thông tin chung) ── */}
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setIndicatorOpen(!indicatorOpen)}>
        <span style={{ color: indicatorOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{indicatorOpen ? '▼' : '▶'} Chỉ số tổng hợp</span>
      </button>
      {indicatorOpen && (<div style={{ marginTop: spaceFormField }}>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="length" {...labelProps('Chiều dài (m)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.length ? 'error' : undefined} help={atMax.length ? 'Đã đạt tối đa 20 ký tự' : undefined}><InputNumber min={0.01} max={500} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} /></Form.Item></Col><Col span={12}><Form.Item name="width" {...labelProps('Chiều rộng (m)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.width ? 'error' : undefined} help={atMax.width ? 'Đã đạt tối đa 20 ký tự' : undefined}><InputNumber min={0.01} max={500} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="currentWaterDepth" {...labelProps('Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.currentWaterDepth ? 'error' : undefined} help={atMax.currentWaterDepth ? 'Đã đạt tối đa 20 ký tự' : undefined}><InputNumber min={0} max={100} step={0.1} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} /></Form.Item></Col><Col span={12}><Form.Item name="designBedElevation" {...labelProps('Cao độ đáy bến thiết kế')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.designBedElevation ? 'error' : undefined} help={atMax.designBedElevation ? 'Đã đạt tối đa 20 ký tự' : undefined}><InputNumber min={0} max={100} step={0.1} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="publishedVesselDWT" {...labelProps('Cỡ tàu khai thác theo công bố (DWT)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.publishedVesselDWT ? 'error' : undefined} help={atMax.publishedVesselDWT ? 'Đã đạt tối đa 20 ký tự' : undefined}><InputNumber min={0} max={999999} maxLength={20} placeholder="0" style={numberStyle} /></Form.Item></Col><Col span={12}><Form.Item name="lastInspectionDate" {...labelProps('Thời điểm kiểm định gần nhất')} style={{ marginBottom: spaceFormField }}><DatePicker picker="month" format="MM/YYYY" placeholder="Chọn tháng/năm" style={selectStyle} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="maintenanceApprovalDate" {...labelProps('Thời điểm phê duyệt quy trình bảo trì công trình')} style={{ marginBottom: spaceFormField }}><DatePicker picker="month" format="MM/YYYY" placeholder="Chọn tháng/năm" style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="safetyAssessmentDate" {...labelProps('Thời điểm được chấp thuận hồ sơ báo cáo đánh giá ATCT (gần nhất)')} style={{ marginBottom: spaceFormField }}><DatePicker picker="month" format="MM/YYYY" placeholder="Chọn tháng/năm" style={selectStyle} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="operatingPierCount" {...labelProps('Số lượng cầu cảng đang khai thác')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.operatingPierCount ? 'error' : undefined} help={atMax.operatingPierCount ? 'Đã đạt tối đa 5 ký tự' : undefined}><InputNumber min={0} max={99999} maxLength={5} placeholder="0" style={numberStyle} /></Form.Item></Col><Col span={12}><Form.Item name="publishedPierCount" {...labelProps('Số lượng cầu cảng đã công bố')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.publishedPierCount ? 'error' : undefined} help={atMax.publishedPierCount ? 'Đã đạt tối đa 5 ký tự' : undefined}><InputNumber min={0} max={99999} maxLength={5} placeholder="0" style={numberStyle} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="investmentAgreementPierCount" {...labelProps('Số lượng cầu cảng đang được thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.investmentAgreementPierCount ? 'error' : undefined} help={atMax.investmentAgreementPierCount ? 'Đã đạt tối đa 5 ký tự' : undefined}><InputNumber min={0} max={99999} maxLength={5} placeholder="0" style={numberStyle} /></Form.Item></Col><Col span={12}><Form.Item name="cargoThroughput" {...labelProps('Sản lượng hàng thông qua')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.cargoThroughput ? 'error' : undefined} help={atMax.cargoThroughput ? 'Đã đạt tối đa 20 ký tự' : undefined}><InputNumber min={0} max={999999999} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="receivesLargeVessel" {...labelProps('Tiếp nhận tàu có trọng tải lớn hơn thông số tại quyết định công bố')} style={{ marginBottom: spaceFormField }} valuePropName="checked"><Switch /></Form.Item></Col></Row>
      </div>)}

      {/* ── Toggle: Thông tin phương án bảo đảm ATHH đã duyệt (gom vào tab Thông tin chung) ── */}
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setAthhPlanOpen(!athhPlanOpen)}>
        <span style={{ color: athhPlanOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{athhPlanOpen ? '▼' : '▶'} Thông tin phương án bảo đảm ATHH đã duyệt</span>
      </button>
      {athhPlanOpen && (<div style={{ marginTop: spaceFormField }}>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="documentNumber" {...labelProps('Số văn bản')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.documentNumber ? 'error' : undefined} help={atMax.documentNumber ? 'Đã đạt tối đa 20 ký tự' : undefined}><Input placeholder="Nhập số văn bản" maxLength={20} showCount style={inputStyle} /></Form.Item></Col><Col span={12}><Form.Item name="documentDate" {...labelProps('Ngày văn bản')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn ngày" format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col></Row>
      </div>)}

      {/* ── Toggle: Thông tin công bố mở, đưa vào sử dụng (gom vào tab Thông tin chung) ── */}
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setAnnouncementOpen(!announcementOpen)}>
        <span style={{ color: announcementOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{announcementOpen ? '▼' : '▶'} Thông tin công bố mở, đưa vào sử dụng</span>
      </button>
      {announcementOpen && (<div style={{ marginTop: spaceFormField }}>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="openingAnnouncementDate" {...labelProps('Thời điểm công bố mở, đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}><DatePicker placeholder="Chọn thời điểm" format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} /></Form.Item></Col><Col span={12}><Form.Item name="openingDecision" {...labelProps('Quyết định công bố/ Văn bản cho phép khai thác')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập quyết định" maxLength={2000} showCount style={inputStyle} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="investmentAgreementDoc" {...labelProps('Văn bản thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập văn bản thỏa thuận" maxLength={2000} showCount style={inputStyle} /></Form.Item></Col></Row>
      </div>)}

      {/* ── Toggle: Thông tin phạm vi khu nước neo buộc tàu (gom vào tab Thông tin chung) ── */}
      <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setMooringScopeOpen(!mooringScopeOpen)}>
        <span style={{ color: mooringScopeOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{mooringScopeOpen ? '▼' : '▶'} Thông tin phạm vi khu nước neo buộc tàu</span>
      </button>
      {mooringScopeOpen && (<div style={{ marginTop: spaceFormField }}>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="waterAreaNeutralScope" {...labelProps('Phạm vi khu nước neo buộc tàu')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập phạm vi khu nước" maxLength={2000} showCount style={inputStyle} /></Form.Item></Col></Row>
      </div>)}
    </div>) },
    // Tab 3: Thông tin vị trí
    { key: 'location', label: `Thông tin vị trí (${coordinateList.length})`, children: (<div style={drawerTabContentStyle}>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn biểu tượng bản đồ" allowClear showSearch optionFilterProp="label" disabled={!watchedGeometryType} loading={loadingSymbols} style={selectStyle}>{symbols.map((sym) => (<Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}><Space>{sym.image && <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />}<span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span></Space></Select.Option>))}</Select></Form.Item></Col></Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} /></Form.Item></Col><Col span={12}><Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}><Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} /></Form.Item></Col></Row>
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
    // Tab 4: File đính kèm
    { key: 'files', label: `File đính kèm (${uploadedFiles.length})`, children: (<div style={drawerTabContentStyle}>
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
          Danh sách tệp đính kèm ({uploadedFiles.length})
        </span>
      </div>
      <Table
        size="small"
        pagination={uploadedFiles.length > 10 ? {
          current: filePage,
          pageSize: 10,
          total: uploadedFiles.length,
          onChange: (p) => setFilePage(p),
          showSizeChanger: false,
          size: 'small',
        } : false}
        dataSource={uploadedFiles.map((f, i) => ({ ...f, key: f.uid, _idx: i, name: f.name }))}
        rowKey={(r) => r.uid || r._idx}
        locale={{ emptyText: 'Chưa có tài liệu đính kèm nào' }}
        scroll={{ x: 720 }}
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
              <a
                onClick={() => toast.info(`Đang tải xuống tệp: ${name}`)}
                style={{ fontSize: fontSizeMd, color: actionPrimary, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: fontWeightMedium, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
              >
                <FileOutlined />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              </a>
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
            render: () => currentUser?.fullName || currentUser?.username || '—',
          },
          {
            title: 'Ngày tải lên',
            key: 'uploadedDate',
            width: 160,
            align: 'center' as const,
            render: (_v, rec: any) => rec.uploadedDate ? dayjs(rec.uploadedDate).format('DD/MM/YYYY HH:mm') : '—',
          },
          {
            title: '',
            key: 'actions',
            width: 80,
            align: 'center',
            render: (_v, record: any) => (
              <Space size={4}>
                <Button type="text" icon={<DownloadOutlined style={{ color: actionPrimary }} />} onClick={() => toast.info(`Đang tải xuống tệp: ${record.name}`)} />
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveFile(record)} />
              </Space>
            ),
          },
        ]}
      />
    </div>) },
  ];

  return (
    <>
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
                const points = parseGisCoordinates({ geometryType: val.geometryType, coordinates: val.coordinates });
                if (points.length > 0) {
                  setCoordinateList((prev) => {
                    const existing = prev || [];
                    const key = (p: { latitude: number; longitude: number }) => `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                    const existingKeys = new Set(existing
                      .filter(c => c.latD != null && c.lngD != null)
                      .map(c => key({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 })));
                    const toAdd = points.filter(p => !existingKeys.has(key(p))).map(p => {
                      const latDms = ddToDms(p.latitude);
                      const lngDms = ddToDms(p.longitude);
                      return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
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

PierForm.displayName = 'PierForm';
export default PierForm;
