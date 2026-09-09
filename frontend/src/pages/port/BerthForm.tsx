import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Space, DatePicker, Modal,
} from 'antd';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import type { UploadFile } from 'antd';
import {
  PlusOutlined, DeleteOutlined, EnvironmentOutlined,
  BankOutlined, SlidersOutlined, FileTextOutlined,
} from '@ant-design/icons';
import {
  colors, DRAWER_TABLE_SCROLL_Y,
  textTertiary, borderDefault, actionPrimary, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField,
  surfaceCard, readonlyInputStyle, sidebarBg,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
  getDatePickerProps,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import { BERTH_ACTIVITY_STATUS_MAP } from '../../types/port';
import type { Berth, SaveAction } from '../../types/port';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { fmtInputNumber, normalizeSafeNumber } from '../../utils/numFmt';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { berthCRUD, portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import { lineObjectService } from '../../services/lineObjectService';
import { userService } from '../../services/userService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { LineObject } from '../../types/lineObject';
import type { Symbol } from '../../services/symbolService';
import { useAuthStore } from '../../store/authStore';
import { GEOMETRY_POINT_COUNT, parseWktToCoordinates, validateDmsCoordinates, serializeCoordinatesToWkt } from '../../utils/gisGeometry';

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

// Style cho thẻ phân nhóm (Section Card) đồng bộ với màn Xem chi tiết
const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Kết cấu bệ cọc cao' }, { value: 2, label: 'Kết cấu cường từ' },
  { value: 3, label: 'Kết cấu trọng lực' }, { value: 4, label: 'Kết cấu khác' },
];
const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' }, { value: 'LINE', label: 'Đối tượng đường' }, { value: 'POLYGON', label: 'Đối tượng vùng' },
];
const COORD_SYS_OPTIONS = [{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }];
// Số lượng tọa độ mặc định tương ứng với từng loại đối tượng: điểm → 1, đường → 2, vùng → 3


function ddToDms(dd: number | null | undefined): { d: number | null; m: number | null; s: number | null } {
  if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
  const abs = Math.abs(dd);
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

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px).
 *
 * Mỗi ô (Độ/Phút/Giây) là một cột flex riêng (Độ=1 · Phút=1 · Giây=1.2 — cùng template như cột
 * Vĩ độ để message dưới Vĩ độ và Kinh độ thẳng hàng dọc). Message "X bắt buộc" hiển thị thành
 * từng dòng riêng NGAY DƯỚI chính ô nhập còn thiếu, chỉ sau khi người dùng đã nhập giá trị đầu
 * tiên của nhóm đó (dòng để trống hoàn toàn không hiện gì → không làm nhiễu lúc vừa mở form).
 */
const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  // Chỉ "bắt buộc" khi người dùng đã bắt đầu nhập (ít nhất 1 trong 3 ô có giá trị).
  const started = dVal != null || mVal != null || sVal != null;

  // 3 cột Độ·Phút·Giây — một nguồn sự thật duy nhất dùng chung cho CẢ hàng input lẫn hàng
  // message bên dưới (cùng flex basis 1 / 1 / 1.2 và cùng width) để text lỗi nằm đúng dưới ô
  // của nó và 2 cột (Vĩ độ, Kinh độ) trong bảng luôn thẳng hàng.
  const inputs = [
    {
      key: 'd', base: 'Độ', value: dVal, max: maxDeg,
      radius: '999px 0 0 999px', unit: '°', unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1, formatter: undefined,
      msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm', base: 'Phút', value: mVal, max: 59,
      radius: '0', unit: "'", unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1, formatter: undefined,
      msg: started && mVal == null ? 'Phút bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, v, sVal ?? null),
    },
    {
      key: 's', base: 'Giây', value: sVal, max: 59.99,
      radius: '0', unit: '"', unitStyle: dmsUnitEndStyle, basis: '1.2 0 130px', width: 130,
      step: 0.01, formatter: fmtInputNumber,
      msg: started && sVal == null ? 'Giây bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, mVal ?? null, v),
    },
  ] as const;

  const inputRow = (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ display: 'flex', flex: inp.basis, minWidth: 0, width: inp.width }}>
          <InputNumber
            value={inp.value}
            min={0}
            max={inp.max}
            step={inp.step}
            placeholder={inp.base}
            formatter={inp.formatter}
            status={inp.msg ? 'error' : undefined}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(raw) => inp.onEdit(raw == null ? null : Number(raw))}
            style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32 }}
            controls={false}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

  // Hàng message LUÔN có mặt với chiều cao cố định (height 14px) → khi cột Vĩ độ hiện message
  // còn cột Kinh độ không (hoặc ngược lại), tổng chiều cao 2 ô của nhóm vẫn bằng nhau và 2
  // input thẳng hàng; chỉ chèn text "X bắt buộc" khi cần.
  const messageRow = (
    <div aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', width: '100%', minWidth: 0, marginTop: spaceXs, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width }}>
          {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
      {inputRow}
      {messageRow}
    </div>
  );
};

export interface BerthFormProps {
  form: any;
  id?: string;
  onFinish: (saved: boolean) => void;
  /** Báo trạng thái đang lưu cho nút submit bên ngoài (hiển thị loading tròn trên nút được bấm) */
  onSubmittingChange?: (submitting: boolean) => void;
}

export default forwardRef(function BerthForm({ form, id, onFinish, onSubmittingChange }: BerthFormProps, ref) {
  const isEdit = !!id;
  const [, setSubmitting] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [berthCodeLoading, setBerthCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('*') ?? false;
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
    berthName: useMaxReached('berthName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    operationalFunction: useMaxReached('operationalFunction', 500),
    totalArea: useMaxReached('totalArea', 20),
    designThroughput: useMaxReached('designThroughput', 20),
    currentThroughput: useMaxReached('currentThroughput', 20),
    maxVesselSize: useMaxReached('maxVesselSize', 20),
    plannedThroughput: useMaxReached('plannedThroughput', 20),
    latestCargoVolume: useMaxReached('latestCargoVolume', 20),
    openingDecision: useMaxReached('openingDecision', 2000),
    investmentAgreement: useMaxReached('investmentAgreement', 2000),
  };

  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [portOptions, setPortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  useEffect(() => { api.get('/common/options/operating-units').then(r => { const list = r.data?.data; if (Array.isArray(list) && list.length) setOperatingOrgs(list); }).catch(() => {}); }, []);
  const [waterwayOptions, setWaterwayOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const hasCoordinates = coordinateList.some((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null));
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => map.set(u.id, u.fullName || u.username || u.id));
        setUserMap(map);
      } catch { /* silent */ }
    })();
  }, []);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [gpsPage] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [, setExistingFiles] = useState<any[]>([]);

  useEffect(() => { symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => setSymbols(r.data || [])).catch(() => {}); }, []);
  useEffect(() => { setLoadingOrgs(true); organizationService.list({ pageSize: 1000 }).then(r => setOrgUnits(r.data || [])).catch(() => {}).finally(() => setLoadingOrgs(false)); }, []);
  useEffect(() => { lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize: 1000 }).then(r => setWaterwayOptions((r.data || []).map((l: any) => ({ value: l.id, label: l.name || l.code })))).catch(() => {}); }, []);

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

  useEffect(() => { if (watchedOrgUnitId) { if (!isEdit || !form.getFieldValue('portId')) form.setFieldsValue({ portId: undefined, berthCode: undefined }); loadPortOptions(watchedOrgUnitId); } }, [watchedOrgUnitId]);

  useEffect(() => { if (!watchedPortId || (isEdit && editPortIdRef.current === watchedPortId)) return; setBerthCodeLoading(true); api.get('/v1/berths/generate-code', { params: { portId: watchedPortId } }).then(r => { const c = r.data?.data?.berthCode ?? r.data?.data?.portCode ?? r.data?.data; if (c) form.setFieldsValue({ berthCode: c }); }).catch(() => {}).finally(() => setBerthCodeLoading(false)); }, [watchedPortId]);

  useEffect(() => { if (!isSystemAdmin && !isEdit) { api.get('/users/me').then(r => { const p = r.data?.data ?? r.data; if (p?.orgUnitId) form.setFieldsValue({ orgUnitId: p.orgUnitId }); }).catch(() => {}); } }, []);

  // Khi chọn loại đối tượng → tự set hệ quy chiếu, quy tắc hiển thị và thêm sẵn số dòng tọa độ tương ứng
  // (GIỮ tọa độ đã nhập/chọn, chỉ thêm dòng trống cho đủ số lượng — không xóa dữ liệu cũ)
  useEffect(() => {
    if (!watchedGeometryType) return;
    form.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
    setCoordinateList((prev) => {
      if (!prev || prev.length === 0) {
        return Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      }
      if (watchedGeometryType === 'POINT' && prev.length > 1) {
        return [prev[0]];
      }
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      }
      return prev;
    });
  }, [watchedGeometryType]);

  // Edit mode: load existing
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data: Berth = await berthCRUD.findById(id);
        const ec = parseWktToCoordinates(data.coordinates);
        setCoordinateList(ec.length > 0 ? ec.map(c => {
          const latDms = ddToDms(c.latitude);
          const lngDms = ddToDms(c.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        }) : data.latitude != null ? (() => { const latDms = ddToDms(Number(data.latitude)); const lngDms = ddToDms(Number(data.longitude)); return [{ latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s }]; })() : []);
        if (data.orgUnitId) await loadPortOptions(data.orgUnitId);
        try {
          const fr = await api.get(`/v1/berths/${id}/attachments`, { params: { page: 0, size: 50 } });
          const files = fr.data?.data || [];
          setExistingFiles(files);
          setUploadedFiles(
            files.map((a: any) => ({
              ...a,
              uid: a.id || a.uid,
              name: a.fileName || a.name,
              fileName: a.fileName || a.name,
              size: a.fileSize ?? a.size,
              fileSize: a.fileSize ?? a.size,
              fileType: a.fileType ?? a.contentType,
              uploadedByName: a.uploadedByName || a.uploaderName || a.uploadedBy,
              uploadedBy: a.uploadedBy,
              uploadedDate: a.uploadedDate || a.uploadedAt || a.createdAt,
              uploadedAt: a.uploadedAt || a.uploadedDate || a.createdAt,
              createdAt: a.createdAt || a.uploadedAt || a.uploadedDate,
              status: 'done' as const,
            }))
          );
        } catch { setExistingFiles([]); }
        editPortIdRef.current = data.portId;
        form.setFieldsValue({
          orgUnitId: data.orgUnitId, portId: data.portId, berthCode: data.berthCode, berthName: data.berthName,
          waterwayId: data.waterwayId, operatingOrgId: data.operatingOrgId,
          provinceId: data.provinceId ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined : undefined,
          detailedLocation: data.detailedLocation, structureType: data.structureType, operationalFunction: data.operationalFunction,
          totalArea: normalizeSafeNumber(data.totalArea), designThroughput: normalizeSafeNumber(data.designThroughput), currentThroughput: normalizeSafeNumber(data.currentThroughput),
          maxVesselSize: normalizeSafeNumber(data.maxVesselSize), plannedThroughput: normalizeSafeNumber(data.plannedThroughput), latestCargoVolume: normalizeSafeNumber(data.latestCargoVolume),
          operationalStatus: data.operationalStatus || undefined,
          openingAnnouncementDate: data.openingAnnouncementDate ? dayjs(data.openingAnnouncementDate) : undefined,
          openingDecision: data.openingDecision, investmentAgreement: data.investmentAgreement,
          geometryType: data.geometryType || undefined, mapSymbolId: data.mapSymbolId, coordinateSystem: data.coordinateSystem, displayRule: data.displayRule,
        });
      } catch { toast.error('Không thể tải thông tin bến cảng'); }
    })();
  }, [isEdit, id]);

  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    if (uploadedFiles.length >= 10) { toast.error('Tối đa 10 file'); return false; }
    const nowIso = dayjs().toISOString();
    const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
    setUploadedFiles(p => [
      ...p,
      {
        uid: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        fileName: file.name,
        size: file.size,
        fileSize: file.size,
        type: file.type,
        fileType: file.type,
        uploadedByName: uploaderName,
        uploadedBy: currentUser?.userId || currentUser?.id || uploaderName,
        uploadedDate: nowIso,
        uploadedAt: nowIso,
        createdAt: nowIso,
        status: 'done',
        originFileObj: file as any,
      },
    ]);
    return false;
  };

  const removeCoordinate = (i: number) => { setCoordinateList(p => p.filter((_, idx) => idx !== i)); setGpsError(null); };
  const addGpsPoint = () => { setCoordinateList(p => [...p, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]); setGpsError(null); };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setCoordinateList(p => { const n = [...p]; n[i] = {
      ...n[i],
      [field === 'lat' ? 'latD' : 'lngD']: dVal,
      [field === 'lat' ? 'latM' : 'lngM']: mVal,
      [field === 'lat' ? 'latS' : 'lngS']: sVal,
    }; return n; });
    setGpsError(null);
  };

  const handleOrgUnitChange = () => { form.setFieldsValue({ portId: undefined, berthCode: undefined }); setCoordinateList([]); };

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    const values = form.getFieldsValue();
    const berthName = String(values.berthName ?? '').trim();
    try {
      await form.validateFields();
    } catch (e: any) {
      const errFields: Array<{ name: Array<string | number>; errors?: string[] }> = e?.errorFields ?? [];
      const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc (*)';
      toast.error(firstError);
      if (errFields.some((f) => f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule' || f.name[0] === 'geometryType')) setActiveTabKey('location');
      else setActiveTabKey('general');
      return;
    }
    // Bắt buộc chọn địa điểm và tình trạng
    if (!values.provinceId) {
      toast.error('Địa điểm (Tỉnh/Thành phố) là bắt buộc');
      setActiveTabKey('general');
      return;
    }
    if (!values.operationalStatus) {
      toast.error('Tình trạng là bắt buộc');
      setActiveTabKey('general');
      return;
    }

    if (hasLocation && !values.mapSymbolId) {
      toast.error('Vui lòng chọn biểu tượng bản đồ');
      setActiveTabKey('location');
      return;
    }
    if (hasCoordinates && !values.geometryType) {
      toast.error('Loại đối tượng là bắt buộc khi có tọa độ');
      setActiveTabKey('location');
      return;
    }

    // Kiểm tra tính đầy đủ và hợp lệ của tọa độ GPS
    const coordResult = validateDmsCoordinates(coordinateList, values.geometryType);
    if (!coordResult.valid) {
      const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
      toast.error(errMsg);
      setGpsError(errMsg);
      setActiveTabKey('location');
      return;
    }
    const validCoords = coordResult.validCoords;
    const wktCoordinates = serializeCoordinatesToWkt(validCoords, values.geometryType || 'POINT');

    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      const provinceName: string | undefined = values.provinceId;
      const payload: Record<string, unknown> = {
        berthCode: String(values.berthCode || '').trim() || undefined,
        berthName,
        portId: values.portId,
        orgUnitId: values.orgUnitId,
        waterwayId: values.waterwayId || undefined,
        geometryType: values.geometryType || undefined,
        latitude: validCoords.length > 0 ? validCoords[0].latitude : undefined,
        longitude: validCoords.length > 0 ? validCoords[0].longitude : undefined,
        coordinates: wktCoordinates || undefined,
        operatingOrgId: values.operatingOrgId || undefined, provinceId: provinceName ? VIETNAM_PROVINCES.indexOf(provinceName) + 1 : undefined,
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
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra'); } finally { setSubmitting(false); onSubmittingChange?.(false); }
  }, [form, coordinateList, onSubmittingChange, isEdit, id, uploadedFiles, onFinish]);

  const tabItems = [
    // Tab 1: Thông tin chung (đồng bộ cấu trúc Section Cards chuẩn như màn Xem chi tiết)
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={drawerFormScrollStyle}>
          {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <BankOutlined style={{ color: actionPrimary }} />
                <span>Thông tin cơ bản & Quản lý vận hành</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}>
                  <OrgUnitTreeSelect organizations={orgUnits} placeholder="Chọn đơn vị quản lý..." loading={loadingOrgs} disabled={isEdit || !isSystemAdmin} showPath treeDefaultExpandAll={false} onChange={handleOrgUnitChange} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="portId" {...labelProps('Thuộc cảng biển')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Cảng biển là bắt buộc' }]}>
                  <Select placeholder={!watchedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : portOptions.length === 0 && !loadingPorts ? 'Không có cảng biển thuộc đơn vị quản lý' : 'Chọn cảng biển...'} loading={loadingPorts} disabled={!watchedOrgUnitId || (portOptions.length === 0 && !loadingPorts)} options={portOptions} showSearch optionFilterProp="label" notFoundContent="Không có cảng biển thuộc đơn vị quản lý" style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="berthCode" {...labelProps('Mã bến cảng')} style={{ marginBottom: spaceFormField }} tooltip="Mã bến cảng được sinh tự động">
                  <Input disabled placeholder={berthCodeLoading ? 'Đang sinh mã...' : watchedPortId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã'} style={readonlyInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="berthName" {...labelProps('Tên bến cảng')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tên bến cảng không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]}>
                  <Input placeholder="Nhập tên bến cảng" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="operatingOrgId" {...labelProps('Đơn vị khai thác')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị khai thác không được để trống' }]}>
                  <Select placeholder="Chọn đơn vị khai thác..." options={operatingOrgs.map(o => ({ value: o.id, label: o.name }))} showSearch optionFilterProp="label" allowClear style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="waterwayId" {...labelProps('Thuộc luồng hàng hải')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn luồng hàng hải..." options={waterwayOptions} showSearch allowClear optionFilterProp="label" style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]}>
                  <Select placeholder="Chọn địa điểm" showSearch optionFilterProp="label" filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operationalStatus" {...labelProps('Tình trạng')} style={{ marginBottom: spaceFormField }} initialValue="NOT_YET_OPERATIONAL" rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}>
                  <Select placeholder="Chọn tình trạng" options={Object.entries(BERTH_ACTIVITY_STATUS_MAP).map(([v, { label }]) => ({ value: v, label }))} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.detailedLocation ? 'error' : undefined} help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}>
                  <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 2: Thông số kỹ thuật & Năng lực khai thác ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <SlidersOutlined style={{ color: actionPrimary }} />
                <span>Thông số kỹ thuật & Năng lực khai thác</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="totalArea" {...labelProps('Tổng diện tích (ha)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.totalArea ? 'error' : undefined} help={atMax.totalArea ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                  <InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="maxVesselSize" {...labelProps('Cỡ tàu tiếp nhận lớn nhất (DWT)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.maxVesselSize ? 'error' : undefined} help={atMax.maxVesselSize ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                  <InputNumber min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="operationalFunction" {...labelProps('Công năng khai thác')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.operationalFunction ? 'error' : undefined} help={atMax.operationalFunction ? 'Đã đạt tối đa 500 ký tự' : undefined}>
                  <Input placeholder="Công năng khai thác" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="structureType" {...labelProps('Loại kết cấu bến cảng')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Loại kết cấu bến cảng" options={STRUCTURE_TYPE_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="designThroughput" {...labelProps('Năng lực thông qua thiết kế (tấn/năm)')} style={{ marginBottom: spaceFormField }}>
                  <InputNumber stringMode min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="currentThroughput" {...labelProps('Năng lực thông qua hiện trạng (tấn/năm)')} style={{ marginBottom: spaceFormField }}>
                  <InputNumber stringMode min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="plannedThroughput" {...labelProps('Quy hoạch năng lực thông qua (tấn/năm)')} style={{ marginBottom: spaceFormField }}>
                  <InputNumber stringMode min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="latestCargoVolume" {...labelProps('Sản lượng thực tế năm gần nhất (tấn/năm)')} style={{ marginBottom: spaceFormField }}>
                  <InputNumber stringMode min={0} step={0.01} placeholder="0" maxLength={20} style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 3: Thông tin công bố mở, đưa vào sử dụng ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <FileTextOutlined style={{ color: actionPrimary }} />
                <span>Thông tin công bố mở, đưa vào sử dụng</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="openingAnnouncementDate" {...labelProps('Thời điểm công bố, đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps({ placeholder: 'Chọn thời điểm...' })} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="openingDecision" {...labelProps('Quyết định công bố/ Văn bản cho phép khai thác')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập quyết định công bố" maxLength={2000} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="investmentAgreement" {...labelProps('Văn bản thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập văn bản thỏa thuận" maxLength={2000} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
      ),
    },
    // Tab 2: Thông tin vị trí
    {
      key: 'location',
      label: `Thông tin vị trí (${coordinateList.length})`,
      children: (
        <div style={drawerFormScrollStyle}>
          {/* ── Section Card: Thông số đối tượng bản đồ ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <EnvironmentOutlined style={{ color: actionPrimary }} />
                <span>Thông số đối tượng bản đồ</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="geometryType"
                  {...labelProps('Loại đối tượng')}
                  required={hasCoordinates}
                  rules={hasCoordinates ? [{ required: true, message: 'Loại đối tượng là bắt buộc khi có tọa độ' }] : []}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select placeholder="Chọn loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="mapSymbolId"
                  {...labelProps('Biểu tượng')}
                  required={hasLocation}
                  rules={hasLocation ? [{ required: true, message: 'Vui lòng chọn biểu tượng bản đồ' }] : []}
                  style={{ marginBottom: spaceFormField }}
                >
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
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section Card: Tọa độ GPS ── */}
          <div style={sectionBoxStyle}>
            <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
              <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                Tọa độ GPS ({coordinateList.length})
              </span>
              <Space size={8}>
                <Button
                  icon={<EnvironmentOutlined style={{ color: !watchedGeometryType ? undefined : actionPrimary }} />}
                  onClick={() => setGisModalOpen(true)}
                  disabled={!watchedGeometryType}
                  style={!watchedGeometryType ? {
                    height: 32,
                    fontSize: fontSizeSm,
                    padding: '0 14px',
                    borderRadius: radiusPill,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    opacity: 0.6,
                    cursor: 'not-allowed',
                  } : {
                    ...outlineButtonStyle,
                    height: 32,
                    fontSize: fontSizeSm,
                    padding: '0 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Chọn tọa độ trên bản đồ
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addGpsPoint}
                  disabled={!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)}
                  style={!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1) ? {
                    height: 32,
                    fontSize: fontSizeSm,
                    padding: '0 14px',
                    borderRadius: radiusPill,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#f5f5f5',
                    borderColor: '#d9d9d9',
                    color: 'rgba(0, 0, 0, 0.25)',
                    cursor: 'not-allowed',
                  } : {
                    ...primaryButtonStyle,
                    height: 32,
                    fontSize: fontSizeSm,
                    padding: '0 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title={watchedGeometryType === 'POINT' && coordinateList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined}
                >
                  Thêm tọa độ
                </Button>
              </Space>
            </div>
            {coordinateList.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block' }}>Chưa có tọa độ nào.</span>
              </div>
            ) : (
              <>
                {gpsError && (
                  <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {gpsError}</span>
                  </div>
                )}
                <DetailTable
                  size="small"
                  scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
                  dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
                  rowKey={(r: any, idx?: number) => r._idx ?? String(idx)}
                  emptyText="Chưa có tọa độ GPS nào"
                  columns={[
                    {
                      title: 'STT',
                      width: 60,
                      align: 'center' as const,
                      render: (_v: any, _r: any, idx: number) => (gpsPage - 1) * 10 + idx + 1,
                    },
                    {
                      title: 'Vĩ độ (Latitude - N)',
                      key: 'lat',
                      render: (_v: any, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
                    },
                    {
                      title: 'Kinh độ (Longitude - E)',
                      key: 'lng',
                      render: (_v: any, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
                    },
                    {
                      title: '',
                      width: 50,
                      align: 'center' as const,
                      // Align with the inputs, excluding the reserved validation message row.
                      onCell: () => ({ style: { verticalAlign: 'top' } }),
                      render: (_v: any, record: any) => (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                          onClick={() => removeCoordinate(record._idx)}
                          style={{
                            width: 32,
                            height: 32,
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Xóa tọa độ"
                        />
                      ),
                    },
                  ]}
                />
              </>
            )}
          </div>
        </div>
      ),
    },
    // Tab 3: File đính kèm
    {
      key: 'files',
      label: `File đính kèm (${uploadedFiles.length})`,
      children: (
        <InfrastructureAttachmentTab
          attachments={uploadedFiles.map((f: any) => ({
            ...f,
            id: f.uid || f.id,
            fileName: f.name || f.fileName,
            fileSize: f.fileSize ?? f.size ?? f.originFileObj?.size,
            uploadedByName: f.uploadedByName || (f.uploadedBy ? (userMap.get(f.uploadedBy) || f.uploadedBy) : '') || currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
            uploadedDate: f.uploadedDate || f.uploadedAt || f.createdAt || dayjs().toISOString(),
          }))}
          readonly={false}
          userMap={userMap}
          onUpload={(file) => { handleBeforeUpload(file); return false; }}
          onDelete={(uid) => { setUploadedFiles((prev) => prev.filter((x) => x.uid !== uid)); }}
          onDownload={async (uid, name) => {
            if (isEdit && id) {
              await berthCRUD.downloadAttachment(id, uid, name);
            } else {
              toast.info(`Đang tải xuống tệp: ${name}`);
            }
          }}
        />
      ),
    },
  ];

  useImperativeHandle(ref, () => ({ submit: (saveAction: SaveAction) => handleSave(saveAction) }), [handleSave]);

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
                const points = parseWktToCoordinates(val.coordinates);
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
