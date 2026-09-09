import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Space, DatePicker, Modal, type InputNumberProps,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  PlusOutlined, DeleteOutlined, EnvironmentOutlined,
  BankOutlined, SlidersOutlined, FileTextOutlined,
  DownOutlined, RightOutlined,
} from '@ant-design/icons';
import { DRAWER_TABLE_SCROLL_Y, getDatePickerProps } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import {
  textSecondary, textTertiary, borderDefault, actionPrimary, statusCritical,
  fontSizeSm, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceSm, spaceXs, spaceFormField,
  surfaceCard, readonlyInputStyle, sidebarBg, textAreaStyle,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import type { SaveAction } from '../../types/port';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { fmtInputNumber, normalizeSafeNumber } from '../../utils/numFmt';
import { organizationService } from '../../services/organizationService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { buoyBerthCRUD, portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type { Symbol as IconSymbol } from '../../services/symbolService';
import { useAuthStore } from '../../store/authStore';
import { GEOMETRY_POINT_COUNT, validateDmsCoordinates, serializeCoordinatesToWkt } from '../../utils/gisGeometry';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

// Màn Cảng biển / Cầu cảng dùng font 13.5px cho phần tiêu đề/chỉ số trong drawer.
const fontSizeMd = 13.5;
const portFormFontSizeMd = 13.5;

const labelProps = (text: string) => ({
  label: <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});
const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: radiusMd,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};
const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spaceFormField,
  paddingBottom: spaceSm,
  borderBottom: '1px solid #f1f5f9',
};
const sectionTitleStyle: React.CSSProperties = {
  color: sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: portFormFontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: spaceSm,
};
const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

type NumberInputWithCountProps = InputNumberProps<any> & { maxLength: number };

/** Cùng hiển thị bộ đếm số (0/n) và giới hạn như các chỉ số ở form Cầu cảng / Cảng biển. */
function NumberInputWithCount({ maxLength, value, ...inputProps }: NumberInputWithCountProps) {
  const count = String(value ?? '').length;

  return (
    <InputNumber
      stringMode
      {...inputProps}
      value={value}
      maxLength={maxLength}
      suffix={<span aria-label={`${count} trên ${maxLength} ký tự`} style={{ color: textSecondary, fontSize: fontSizeMd }}>{count}/{maxLength}</span>}
    />
  );
}

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
  { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
  { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
];

export const BUOY_BERTH_CLASSIFICATION_OPTIONS = [
  { value: 'Cấp đặc biệt', label: 'Cấp đặc biệt' },
  { value: 'Cấp 1', label: 'Cấp 1' },
  { value: 'Cấp 2', label: 'Cấp 2' },
  { value: 'Cấp 3', label: 'Cấp 3' },
  { value: 'Cấp 4', label: 'Cấp 4' },
];

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' }, { value: 'LINE', label: 'Đối tượng đường' }, { value: 'POLYGON', label: 'Đối tượng vùng' },
];
const COORD_SYS_OPTIONS = [{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }];
// Số lượng tọa độ mặc định tương ứng với từng loại đối tượng: điểm → 1, đường → 2, vùng → 3


const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length-1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\((.+)\)/i);
    if (mm) {
      return mm[1].split(/\s*,\s*/).map(p => {
        const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/);
        return { latitude: parseFloat(lat), longitude: parseFloat(lng) };
      }).filter(c => !isNaN(c.latitude) && !isNaN(c.longitude));
    }
    const pm = wkt.match(/POINT\s*\(([\d.-]+)\s+([\d.-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* ignore */ }
  return [];
};

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

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px). */
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
      step: 1,
      msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm', base: 'Phút', value: mVal, max: 59,
      radius: '0', unit: '\'', unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1,
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
    <div style={{ display: 'inline-flex', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', maxWidth: '100%', minWidth: 0 }}>
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
    <div aria-live="polite" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', width: 'fit-content', maxWidth: '100%', minWidth: 0, marginTop: spaceXs, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width }}>
          {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minWidth: 0 }}>
      {inputRow}
      {messageRow}
    </div>
  );
};

export interface BuoyBerthFormFields {
  orgUnitId?: string;
  portId?: string;
  buoyBerthCode?: string;
  buoyBerthName?: string;
  waterwayId?: string;
  provinceId?: number;
  detailedLocation?: string;
  classification?: string;
  operationalStatus?: string;
  operatingOrgId?: string;
  currentWaterDepth?: number;
  bottomElevationDesign?: number;
  maxVesselDWT?: number;
  plannedVesselDWT?: number;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  operationExpiryDate?: string;
  designCapacity?: number;
  activeBuoyBerthCount?: number;
  publishedBuoyBerthCount?: number;
  underInvestmentBuoyBerthCount?: number;
  cargoThroughput?: number;
  openingAnnouncementDate?: string;
  publicDecision?: string;
  investmentAgreement?: string;
  mooringWaterAreaScope?: string;
  coordinates?: Array<{ latitude: number; longitude: number }>;
  geometryType?: string;
  coordinateSystem?: number;
  displayRule?: string;
  mapSymbolId?: string;
}

export interface BuoyBerthFormProps {
  form: any;
  id?: string;
  onFinish: (saved: boolean) => void;
  /** Báo trạng thái đang lưu cho nút submit bên ngoài (hiển thị loading tròn trên nút được bấm) */
  onSubmittingChange?: (submitting: boolean) => void;
}

export default forwardRef(function BuoyBerthForm({ form, id, onFinish, onSubmittingChange }: BuoyBerthFormProps, ref) {
  const isEdit = !!id;
  const [, setSubmitting] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [buoyBerthCodeLoading, setBuoyBerthCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('*') ?? false;
  const editPortIdRef = useRef<string | undefined>(undefined);

  const [indicatorOpen, setIndicatorOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [mooringScopeOpen, setMooringScopeOpen] = useState(true);

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
    buoyBerthName: useMaxReached('buoyBerthName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    publicDecision: useMaxReached('publicDecision', 2000),
    investmentAgreement: useMaxReached('investmentAgreement', 2000),
    mooringWaterAreaScope: useMaxReached('mooringWaterAreaScope', 2000),
    currentWaterDepth: useMaxReached('currentWaterDepth', 20),
    bottomElevationDesign: useMaxReached('bottomElevationDesign', 20),
    maxVesselDWT: useMaxReached('maxVesselDWT', 20),
    plannedVesselDWT: useMaxReached('plannedVesselDWT', 20),
    designCapacity: useMaxReached('designCapacity', 20),
    activeBuoyBerthCount: useMaxReached('activeBuoyBerthCount', 5),
    publishedBuoyBerthCount: useMaxReached('publishedBuoyBerthCount', 5),
    underInvestmentBuoyBerthCount: useMaxReached('underInvestmentBuoyBerthCount', 5),
    cargoThroughput: useMaxReached('cargoThroughput', 20),
  };

  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [portOptions, setPortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [waterwayOptions, setWaterwayOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    api.get('/users', { params: { page: 0, size: 200 } }).then((r) => {
      const map = new Map<string, string>();
      const list = r.data?.data?.content || r.data?.data || r.data?.content || [];
      if (Array.isArray(list)) list.forEach((u: any) => { if (u?.id) map.set(u.id, u.fullName || u.username); });
      setUserMap(map);
    }).catch(() => {});
  }, []);
  const [symbols, setSymbols] = useState<IconSymbol[]>([]);
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [coordinateList, setCoordinateList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [gpsPage] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [, setExistingFiles] = useState<any[]>([]);

  useEffect(() => {
    setLoadingSymbols(true);
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' })
      .then(r => setSymbols(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingSymbols(false));
  }, []);
  useEffect(() => { setLoadingOrgs(true); organizationService.list({ pageSize: 1000 }).then(r => setOrgUnits(r.data || [])).catch(() => {}).finally(() => setLoadingOrgs(false)); }, []);
  // Luồng hàng hải lấy từ module Luồng hàng hải (/navigation-channel) đã được duyệt — đồng bộ với Quản lý cầu cảng
  useEffect(() => {
    navigationChannelCRUD.search({ approvalStatus: 'APPROVED', page: 0, size: 1000 })
      .then(r => setWaterwayOptions((r.items || []).map(n => ({ value: n.id, label: n.channelName || n.channelCode || '' }))))
      .catch(() => {});
  }, []);
  useEffect(() => { api.get('/common/options/operating-units').then(r => { const list = r.data?.data; if (Array.isArray(list) && list.length) setOperatingOrgs(list); }).catch(() => {}); }, []);

  const loadPortOptions = async (orgUnitId: string) => {
    setLoadingPorts(true);
    try {
      const r = await portCRUD.findAll({ orgUnitId, approvalStatus: 'APPROVED', page: 1, size: 1000 });
      setPortOptions((r.data || []).map((p: any) => ({ value: p.id, label: p.portName })));
    } catch { setPortOptions([]); }
    finally { setLoadingPorts(false); }
  };

  const initialBuoyBerthCodeRef = useRef<string | undefined>(undefined);

  // Đơn vị quản lý KHÔNG tự điền sẵn — để người dùng chủ động chọn từ cây đơn vị (không mặc định 1 giá trị)
  useEffect(() => {
    if (!watchedOrgUnitId) { setPortOptions([]); return; }
    void loadPortOptions(watchedOrgUnitId);
  }, [watchedOrgUnitId]);

  useEffect(() => {
    if (!watchedPortId) return;
    if (isEdit && editPortIdRef.current === watchedPortId) {
      if (initialBuoyBerthCodeRef.current) {
        form.setFieldsValue({ buoyBerthCode: initialBuoyBerthCodeRef.current });
      }
      return;
    }
    setBuoyBerthCodeLoading(true);
    buoyBerthCRUD.generateCode(watchedPortId)
      .then((res: any) => { if (res?.buoyBerthCode) form.setFieldsValue({ buoyBerthCode: res.buoyBerthCode }); })
      .catch(() => {})
      .finally(() => setBuoyBerthCodeLoading(false));
  }, [watchedPortId, isEdit, form]);

  // Khi chọn loại đối tượng → tự set hệ quy chiếu, quy tắc hiển thị và thêm sẵn số dòng tọa độ tương ứng
  // (GIỮ tọa độ đã nhập/chọn, chỉ thêm dòng trống cho đủ số lượng — không xóa dữ liệu cũ)
  useEffect(() => {
    if (!watchedGeometryType) {
      form.setFieldsValue({ mapSymbolId: undefined, coordinateSystem: undefined, displayRule: undefined });
      form.setFields([{ name: 'mapSymbolId', errors: [] }]);
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
      const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
      setCoordinateList((prev) => {
        if (watchedGeometryType === 'POINT' && prev.length > 1) return prev.slice(0, 1);
        if (prev.length >= count) return prev;
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      });
    }
  }, [watchedGeometryType, isEdit, form]);

  // Edit mode: load existing
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data: any = await buoyBerthCRUD.findById(id);
        const ec = data.coordinates ? parseGisCoordinates({ geometryType: data.geometryType, coordinates: data.coordinates }) : [];
        setCoordinateList(ec.length > 0 ? ec.map(c => {
          const latDms = ddToDms(c.latitude);
          const lngDms = ddToDms(c.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        }) : data.latitude != null ? (() => { const latDms = ddToDms(Number(data.latitude)); const lngDms = ddToDms(Number(data.longitude)); return [{ latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s }]; })() : []);
        if (data.orgUnitId) await loadPortOptions(data.orgUnitId);
        try {
          const fr = await api.get(`/v1/buoy-berth/${id}/attachments`, { params: { page: 0, size: 50 } });
          const files = fr.data?.data || [];
          setExistingFiles(files);
          setUploadedFiles(
            files.map((a: any) => ({
              ...a,
              uid: a.id ?? a.uid,
              name: a.fileName ?? a.name,
              fileName: a.fileName ?? a.name,
              size: a.fileSize ?? a.size ?? 0,
              fileSize: a.fileSize ?? a.size ?? 0,
              type: a.fileType ?? a.contentType ?? '',
              fileType: a.fileType ?? a.contentType ?? '',
              uploadedByName: a.uploadedByName || (a.uploadedBy ? (userMap.get(a.uploadedBy) || a.uploadedBy) : '') || currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
              uploadedBy: a.uploadedBy,
              uploadedDate: a.uploadedDate || a.uploadedAt || a.createdAt,
              uploadedAt: a.uploadedAt || a.uploadedDate || a.createdAt,
              createdAt: a.createdAt || a.uploadedAt || a.uploadedDate,
              status: 'done' as const,
            }))
          );
        } catch { setExistingFiles([]); }
        editPortIdRef.current = data.portId;
        initialBuoyBerthCodeRef.current = data.buoyBerthCode;
        form.setFieldsValue({
          orgUnitId: data.orgUnitId, portId: data.portId,
          buoyBerthCode: data.buoyBerthCode, buoyBerthName: data.buoyBerthName,
          waterwayId: data.waterwayId, operatingOrgId: data.operatingOrgId, classification: data.classification,
          provinceId: data.provinceId ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined : undefined,
          detailedLocation: data.detailedLocation,
          operationalStatus: data.operationalStatus || undefined,
          currentWaterDepth: normalizeSafeNumber(data.currentWaterDepth), bottomElevationDesign: normalizeSafeNumber(data.bottomElevationDesign),
          maxVesselDWT: normalizeSafeNumber(data.maxVesselDWT), plannedVesselDWT: normalizeSafeNumber(data.plannedVesselDWT),
          lastInspectionDate: data.lastInspectionDate ? dayjs(data.lastInspectionDate) : undefined,
          nextInspectionDate: data.nextInspectionDate ? dayjs(data.nextInspectionDate) : undefined,
          operationExpiryDate: data.operationExpiryDate ? dayjs(data.operationExpiryDate) : undefined,
          designCapacity: normalizeSafeNumber(data.designCapacity),
          activeBuoyBerthCount: data.activeBuoyBerthCount, publishedBuoyBerthCount: data.publishedBuoyBerthCount,
          underInvestmentBuoyBerthCount: data.underInvestmentBuoyBerthCount, cargoThroughput: normalizeSafeNumber(data.cargoThroughput),
          openingAnnouncementDate: data.openingAnnouncementDate ? dayjs(data.openingAnnouncementDate) : undefined,
          publicDecision: data.publicDecision, investmentAgreement: data.investmentAgreement,
          mooringWaterAreaScope: data.mooringWaterAreaScope,
          geometryType: data.geometryType || undefined, mapSymbolId: data.mapSymbolId, coordinateSystem: data.geometryType ? (data.coordinateSystem ?? 1) : undefined, displayRule: (data.geometryType || data.coordinates || data.displayRule) ? 'Độ, phút, giây (DMS)' : undefined,
        });
      } catch { toast.error('Không thể tải thông tin bến phao'); }
    })();
  }, [isEdit, id]);

  const triggerBlobDownload = (data: BlobPart | undefined, downloadName: string) => {
    if (!data) return false;
    const url = window.URL.createObjectURL(new Blob([data], { type: 'application/octet-stream' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName || 'attachment';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  };

  const handleDownloadAttachment = (uid: string, name?: string) => {
    const attachment = uploadedFiles.find((file: any) => file.uid === uid || file.id === uid);
    if (attachment?.originFileObj) {
      triggerBlobDownload(attachment.originFileObj, name || attachment.originFileObj.name);
      return;
    }
    if (!id) {
      toast.info(`Đang tải xuống tệp: ${name}`);
      return;
    }
    api.get(`/v1/buoy-berth/${id}/attachments/${uid}/download`, { responseType: 'blob' })
      .then((response) => {
        if (!triggerBlobDownload(response.data, name || 'attachment')) toast.error('Không thể tải xuống tệp đính kèm');
      })
      .catch(() => toast.error('Không thể tải xuống tệp đính kèm'));
  };

  const handleRemoveFile = (file: UploadFile) => { setUploadedFiles(prev => prev.filter(x => x.uid !== file.uid)); };

  const handleBeforeUpload = (file: File): false => {
    if (file.size > MAX_FILE_SIZE) { toast.error('Kích thước file tối đa 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    if (uploadedFiles.length >= MAX_FILE_COUNT) { toast.error('Tối đa 10 file'); return false; }
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
        status: 'done' as const,
        originFileObj: file as any,
      },
    ]);
    return false;
  };

  const removeCoordinate = (i: number) => { setCoordinateList(p => p.filter((_, idx) => idx !== i)); };
  const addGpsPoint = () => { setCoordinateList(p => [...p, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]); };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setCoordinateList(p => { const n = [...p]; n[i] = {
      ...n[i],
      [field === 'lat' ? 'latD' : 'lngD']: dVal,
      [field === 'lat' ? 'latM' : 'lngM']: mVal,
      [field === 'lat' ? 'latS' : 'lngS']: sVal,
    }; return n; });
  };

  const handleOrgUnitChange = () => { form.setFieldsValue({ portId: undefined, buoyBerthCode: undefined }); setCoordinateList([]); };
  const handlePortChange = () => { form.setFieldsValue({ buoyBerthCode: undefined }); };

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    const values = form.getFieldsValue();
    try {
      await form.validateFields();
    } catch (e: any) {
      const errFields: Array<{ name: Array<string | number>; errors?: string[] }> = e?.errorFields ?? [];
      const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc (*)';
      toast.error(firstError);
      if (errFields.some((f) => f.name[0] === 'orgUnitId' || f.name[0] === 'portId' || f.name[0] === 'buoyBerthName' || f.name[0] === 'operatingOrgId')) setActiveTabKey('general');
      else if (errFields.some((f) => f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule' || f.name[0] === 'geometryType')) setActiveTabKey('location');
      return false;
    }

    // Bắt buộc chọn địa điểm và tình trạng
    if (!values.provinceId) {
      toast.error('Địa điểm (Tỉnh/Thành Phố) là bắt buộc');
      setActiveTabKey('general');
      return false;
    }
    if (!values.operationalStatus) {
      toast.error('Tình trạng là bắt buộc');
      setActiveTabKey('general');
      return false;
    }

    if (values.geometryType) {
      if (!values.mapSymbolId) {
        setActiveTabKey('location');
        form.setFields([{ name: ['mapSymbolId'], errors: ['Biểu tượng là bắt buộc khi đã chọn loại đối tượng'] }]);
        toast.error('Biểu tượng là bắt buộc khi đã chọn loại đối tượng');
        return false;
      }

      const minCount = GEOMETRY_POINT_COUNT[values.geometryType as string] ?? 1;
      const validCoords = coordinateList.filter(
        (c) => c.latD != null && c.latM != null && c.latS != null && c.lngD != null && c.lngM != null && c.lngS != null
      );

      if (validCoords.length < minCount) {
        setActiveTabKey('location');
        const msg =
          values.geometryType === 'POLYGON'
            ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ'
            : values.geometryType === 'LINE'
            ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ'
            : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ';
        toast.error(msg);
        return false;
      }

      // Đối tượng điểm (POINT) chỉ cho phép đúng 1 tọa độ GPS — nếu nhiều hơn thì chặn & báo.
      if (values.geometryType === 'POINT' && validCoords.length > 1) {
        setActiveTabKey('location');
        toast.error('Loại đối tượng điểm chỉ cho phép 1 tọa độ GPS');
        return false;
      }

      // Tọa độ GPS: nếu 1 hàng đã bắt đầu nhập nhưng ô con (Độ/Phút/Giây của Vĩ hoặc Kinh) chưa đủ → chặn & báo khi ấn Lưu
      const partial = coordinateList.find((c) => {
        const latSet = c.latD != null || c.latM != null || c.latS != null;
        const lngSet = c.lngD != null || c.lngM != null || c.lngS != null;
        const latFull = c.latD != null && c.latM != null && c.latS != null;
        const lngFull = c.lngD != null && c.lngM != null && c.lngS != null;
        return (latSet && !latFull) || (lngSet && !lngFull);
      });
      if (partial) {
        setActiveTabKey('location');
        toast.error('Chưa nhập đủ Độ/Phút/Giây cho một tọa độ GPS trong tab Thông tin vị trí');
        return false;
      }

      // Kiểm tra dải giá trị hợp lệ của tọa độ GPS
      const invalidRange = coordinateList.find((c) => {
        if (c.latD != null && (c.latD < 0 || c.latD > 90)) return true;
        if (c.latM != null && (c.latM < 0 || c.latM > 59)) return true;
        if (c.latS != null && (c.latS < 0 || c.latS >= 60)) return true;
        if (c.lngD != null && (c.lngD < 0 || c.lngD > 180)) return true;
        if (c.lngM != null && (c.lngM < 0 || c.lngM > 59)) return true;
        if (c.lngS != null && (c.lngS < 0 || c.lngS >= 60)) return true;
        return false;
      });
      if (invalidRange) {
        setActiveTabKey('location');
        toast.error('Tọa độ GPS nằm ngoài dải hợp lệ (Vĩ độ: 0-90°, Kinh độ: 0-180°, Phút/Giây: 0-59.99)');
        return false;
      }
    }

    const validCoords = values.geometryType
      ? coordinateList.filter((c) => c.latD != null && c.latM != null && c.latS != null && c.lngD != null && c.lngM != null && c.lngS != null)
      : [];
    const wktCoordinates = values.geometryType && validCoords.length > 0
      ? serializeCoordinatesToWkt(
          validCoords.map((c) => ({
            latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
            longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
          })),
          values.geometryType || 'POINT'
        )
      : undefined;

    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      const toNumber = (v: unknown): number | string | undefined => {
        if (v == null) return undefined;
        const str = String(v).trim();
        if (str === '' || isNaN(Number(str))) return undefined;
        return str.length > 15 ? str : Number(str);
      };
      const toDateString = (v: unknown, fmt: string): string | undefined => (v ? (typeof v === 'string' ? v : (v as dayjs.Dayjs).format(fmt)) : undefined);
      const payload: Record<string, unknown> = {
        orgUnitId: values.orgUnitId, portId: values.portId,
        buoyBerthCode: String(values.buoyBerthCode || '').trim() || undefined, buoyBerthName: String(values.buoyBerthName || '').trim(),
        waterwayId: values.waterwayId || undefined, operatingOrgId: values.operatingOrgId || undefined, classification: values.classification || undefined,
        provinceId: values.provinceId ? VIETNAM_PROVINCES.indexOf(values.provinceId) + 1 : undefined,
        detailedLocation: values.detailedLocation || undefined,
        operationalStatus: values.operationalStatus || undefined,
        currentWaterDepth: toNumber(values.currentWaterDepth),
        bottomElevationDesign: toNumber(values.bottomElevationDesign),
        maxVesselDWT: toNumber(values.maxVesselDWT),
        plannedVesselDWT: toNumber(values.plannedVesselDWT),
        lastInspectionDate: toDateString(values.lastInspectionDate, 'YYYY-MM-DD'),
        nextInspectionDate: toDateString(values.nextInspectionDate, 'YYYY-MM-DD'),
        operationExpiryDate: toDateString(values.operationExpiryDate, 'YYYY-MM-DD'),
        designCapacity: toNumber(values.designCapacity),
        activeBuoyBerthCount: toNumber(values.activeBuoyBerthCount),
        publishedBuoyBerthCount: toNumber(values.publishedBuoyBerthCount),
        underInvestmentBuoyBerthCount: toNumber(values.underInvestmentBuoyBerthCount),
        cargoThroughput: toNumber(values.cargoThroughput),
        openingAnnouncementDate: values.openingAnnouncementDate ? (typeof values.openingAnnouncementDate === 'string' ? values.openingAnnouncementDate : values.openingAnnouncementDate.format('YYYY-MM-DD') + 'T00:00:00') : undefined,
        publicDecision: values.publicDecision || undefined, investmentAgreement: values.investmentAgreement || undefined,
        mooringWaterAreaScope: values.mooringWaterAreaScope || undefined,
        latitude: validCoords.length > 0 ? validCoords[0].latitude : undefined,
        longitude: validCoords.length > 0 ? validCoords[0].longitude : undefined,
        coordinates: wktCoordinates || undefined,
        geometryType: values.geometryType || undefined, mapSymbolId: values.mapSymbolId || undefined,
        coordinateSystem: values.coordinateSystem != null && !isNaN(Number(values.coordinateSystem)) ? Number(values.coordinateSystem) : (values.geometryType ? 1 : undefined),
        displayRule: values.displayRule != null && !isNaN(Number(values.displayRule)) ? Number(values.displayRule) : (values.geometryType ? 1 : undefined),
      };
      if (saveAction !== 'UPDATE') (payload as any).saveAction = saveAction;
      Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
      let createdBuoyBerthId: string | undefined;
      if (isEdit && id) { await buoyBerthCRUD.update({ ...payload, id } as any); createdBuoyBerthId = id; }
      else { const res: any = await buoyBerthCRUD.create(payload as any); createdBuoyBerthId = res?.id ?? res?.data?.id; }
      if (createdBuoyBerthId && uploadedFiles.length > 0) {
        for (const fi of uploadedFiles) {
          const of = fi.originFileObj as File;
          if (!of) continue;
          const fd = new FormData();
          fd.append('files', of);
          await api.post(`/v1/buoy-berth/${createdBuoyBerthId}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
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

  useImperativeHandle(ref, () => ({ submit: (saveAction: SaveAction) => handleSave(saveAction) }), [handleSave]);

  const tabItems = [
    { key: 'general', label: 'Thông tin chung', children: (<div style={drawerFormScrollStyle}>
      {/* Box 1: Thông tin cơ bản & Quản lý vận hành */}
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
              <OrgUnitTreeSelect organizations={orgUnits} placeholder="Chọn đơn vị quản lý" loading={loadingOrgs} disabled={isEdit} showPath treeDefaultExpandAll={false} onChange={handleOrgUnitChange} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="portId" {...labelProps('Thuộc cảng biển')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Cảng biển là bắt buộc' }]}>
              <Select placeholder={!watchedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : portOptions.length === 0 && !loadingPorts ? 'Không có cảng biển thuộc đơn vị quản lý' : 'Chọn cảng biển...'}
                loading={loadingPorts} disabled={isEdit || !watchedOrgUnitId || (portOptions.length === 0 && !loadingPorts)} options={portOptions}
                showSearch optionFilterProp="label" notFoundContent="Không có cảng biển thuộc đơn vị quản lý" style={selectStyle} />
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
            <Form.Item name="buoyBerthCode" {...labelProps('Mã bến phao')} style={{ marginBottom: spaceFormField }} tooltip="Mã được sinh tự động">
              <Input disabled placeholder={buoyBerthCodeLoading ? 'Đang sinh mã...' : watchedPortId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã'} style={readonlyInputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="buoyBerthName" {...labelProps('Tên bến phao')} required style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Tên bến phao không được để trống' }, { max: 255 }]}>
              <Input placeholder="Nhập tên bến phao" maxLength={255} showCount style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}>
              <Select placeholder="Chọn địa điểm" showSearch optionFilterProp="label"
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} style={selectStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
              <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item name="classification" {...labelProps('Phân cấp công trình')} style={{ marginBottom: spaceFormField }}>
              <Select placeholder="Chọn phân cấp công trình" options={BUOY_BERTH_CLASSIFICATION_OPTIONS} showSearch allowClear optionFilterProp="label" style={selectStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="operationalStatus" {...labelProps('Tình trạng')} required style={{ marginBottom: spaceFormField }} initialValue="OPERATIONAL" rules={[{ required: true, message: 'Tình trạng không được để trống' }]}>
              <Select placeholder="Chọn tình trạng" options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Box 2: Thông số kỹ thuật & Năng lực khai thác */}
      <div style={sectionBoxStyle}>
        <div
          onClick={() => setIndicatorOpen(!indicatorOpen)}
          style={{
            ...sectionHeaderStyle,
            cursor: 'pointer',
            userSelect: 'none',
            marginBottom: indicatorOpen ? spaceSm : 0,
            paddingBottom: indicatorOpen ? spaceSm : 0,
            borderBottom: indicatorOpen ? sectionHeaderStyle.borderBottom : 'none',
          }}
        >
          <div style={sectionTitleStyle}>
            <SlidersOutlined style={{ color: actionPrimary }} />
            <span>Thông số kỹ thuật & Năng lực khai thác</span>
          </div>
          <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>
            {indicatorOpen ? <DownOutlined /> : <RightOutlined />}
          </span>
        </div>
        {indicatorOpen && (
          <div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="currentWaterDepth" {...labelProps('Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="bottomElevationDesign" {...labelProps('Cao độ đáy bến thiết kế')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="maxVesselDWT" {...labelProps('Cỡ tàu khai thác theo công bố (DWT)')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={1} precision={0} maxLength={20} placeholder="0" style={numberStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="plannedVesselDWT" {...labelProps('Cỡ tàu khai thác theo quy hoạch')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={1} precision={0} maxLength={20} placeholder="0" style={numberStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="lastInspectionDate" {...labelProps('Thời điểm đã đăng kiểm gần nhất')} style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps({ picker: 'month', format: 'MM/YYYY', placeholder: 'Chọn tháng/năm', style: selectStyle })} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="nextInspectionDate" {...labelProps('Thời điểm đăng kiểm tiếp theo')} style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps({ placeholder: 'Chọn ngày', style: selectStyle })} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="operationExpiryDate" {...labelProps('Thời hạn khai thác')} style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps({ placeholder: 'Chọn ngày', style: selectStyle })} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="designCapacity" {...labelProps('Năng lực thông qua thiết kế')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="activeBuoyBerthCount" {...labelProps('Số lượng bến phao đang khai thác')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="publishedBuoyBerthCount" {...labelProps('Số lượng bến phao đã công bố')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="underInvestmentBuoyBerthCount" {...labelProps('Số lượng bến phao đang được thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="cargoThroughput" {...labelProps('Sản lượng hàng thông qua')} style={{ marginBottom: spaceFormField }}>
                  <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}
      </div>

      {/* Box 3: Thông tin công bố mở, đưa vào sử dụng */}
      <div style={sectionBoxStyle}>
        <div
          onClick={() => setAnnouncementOpen(!announcementOpen)}
          style={{
            ...sectionHeaderStyle,
            cursor: 'pointer',
            userSelect: 'none',
            marginBottom: announcementOpen ? spaceSm : 0,
            paddingBottom: announcementOpen ? spaceSm : 0,
            borderBottom: announcementOpen ? sectionHeaderStyle.borderBottom : 'none',
          }}
        >
          <div style={sectionTitleStyle}>
            <FileTextOutlined style={{ color: actionPrimary }} />
            <span>Thông tin công bố mở, đưa vào sử dụng</span>
          </div>
          <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>
            {announcementOpen ? <DownOutlined /> : <RightOutlined />}
          </span>
        </div>
        {announcementOpen && (
          <div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="openingAnnouncementDate" {...labelProps('Thời điểm công bố mở, đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}>
                  <DatePicker {...getDatePickerProps({ placeholder: 'Chọn thời điểm', style: selectStyle })} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="publicDecision" {...labelProps('Quyết định công bố/ Văn bản cho phép khai thác')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={3} placeholder="Nhập quyết định công bố" maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="investmentAgreement" {...labelProps('Văn bản thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={3} placeholder="Nhập văn bản thỏa thuận" maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}
      </div>

      {/* Box 4: Thông tin phạm vi khu nước neo buộc tàu */}
      <div style={sectionBoxStyle}>
        <div
          onClick={() => setMooringScopeOpen(!mooringScopeOpen)}
          style={{
            ...sectionHeaderStyle,
            cursor: 'pointer',
            userSelect: 'none',
            marginBottom: mooringScopeOpen ? spaceSm : 0,
            paddingBottom: mooringScopeOpen ? spaceSm : 0,
            borderBottom: mooringScopeOpen ? sectionHeaderStyle.borderBottom : 'none',
          }}
        >
          <div style={sectionTitleStyle}>
            <FileTextOutlined style={{ color: actionPrimary }} />
            <span>Phạm vi khu nước neo buộc tàu</span>
          </div>
          <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>
            {mooringScopeOpen ? <DownOutlined /> : <RightOutlined />}
          </span>
        </div>
        {mooringScopeOpen && (
          <div>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="mooringWaterAreaScope" {...labelProps('Phạm vi khu nước neo buộc tàu')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={3} placeholder="Nhập phạm vi khu nước neo buộc tàu" maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}
      </div>
    </div>) },
    // Tab 2: Thông tin vị trí
    { key: 'location', label: `Thông tin vị trí (${coordinateList.length})`, children: (<div style={drawerFormScrollStyle}>
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleStyle}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span>Thông số đối tượng bản đồ</span>
          </div>
        </div>
        <Row gutter={[24, 0]}>
          <Col span={12}>
            <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
              <Select
                placeholder="Chọn loại đối tượng"
                allowClear
                options={GEOMETRY_TYPE_OPTIONS}
                style={selectStyle}
                onChange={(val) => {
                  if (!val) {
                    form.setFieldsValue({
                      mapSymbolId: undefined,
                      coordinateSystem: undefined,
                      displayRule: undefined,
                    });
                    form.setFields([{ name: 'mapSymbolId', errors: [] }]);
                    setCoordinateList([]);
                  }
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="mapSymbolId"
              {...labelProps('Biểu tượng')}
              required={!!watchedGeometryType}
              rules={
                watchedGeometryType
                  ? [{ required: true, message: 'Biểu tượng là bắt buộc khi đã chọn loại đối tượng' }]
                  : []
              }
              style={{ marginBottom: spaceFormField }}
            >
              <Select placeholder="Chọn biểu tượng bản đồ" allowClear showSearch optionFilterProp="label" disabled={!watchedGeometryType} loading={loadingSymbols} style={selectStyle}>
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

      <div style={sectionBoxStyle}>
        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
          <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: portFormFontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
            Tọa độ GPS ({coordinateList.length})
          </span>
          <Space size={spaceSm}>
            <Button
              icon={<EnvironmentOutlined style={{ color: !watchedGeometryType ? undefined : actionPrimary }} />}
              onClick={() => setGisModalOpen(true)}
              disabled={!watchedGeometryType}
              style={!watchedGeometryType ? {
                height: 32,
                fontSize: fontSizeMd,
                padding: '0 14px',
                borderRadius: radiusPill,
                display: 'inline-flex',
                alignItems: 'center',
                gap: spaceXs,
                opacity: 0.6,
                cursor: 'not-allowed',
              } : {
                ...outlineButtonStyle,
                height: 32,
                fontSize: fontSizeMd,
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: spaceXs,
              }}
            >
              Chọn tọa độ trên bản đồ
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addGpsPoint}
              disabled={!watchedGeometryType}
              style={!watchedGeometryType ? {
                height: 32,
                fontSize: fontSizeMd,
                padding: '0 14px',
                borderRadius: radiusPill,
                display: 'inline-flex',
                alignItems: 'center',
                gap: spaceXs,
                background: '#f5f5f5',
                borderColor: '#d9d9d9',
                color: 'rgba(0, 0, 0, 0.25)',
                cursor: 'not-allowed',
              } : {
                ...primaryButtonStyle,
                height: 32,
                fontSize: fontSizeMd,
                padding: '0 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: spaceXs,
              }}
            >
              Thêm tọa độ
            </Button>
          </Space>
        </div>
        {coordinateList.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
            <span style={{ fontSize: portFormFontSizeMd, color: textTertiary, display: 'block' }}>Chưa có tọa độ nào.</span>
          </div>
        ) : (
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
                title: <span>Vĩ độ (Latitude - N) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>,
                key: 'lat',
                render: (_v: any, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
              },
              {
                title: <span>Kinh độ (Longitude - E) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>,
                key: 'lng',
                render: (_v: any, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
              },
              {
                title: '',
                width: 50,
                align: 'center' as const,
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
        )}
      </div>
    </div>) },
    // Tab 3: File đính kèm (chuẩn VTS CHK — InfrastructureAttachmentTab)
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
          onDelete={(uid) => { handleRemoveFile({ uid } as UploadFile); }}
          onDownload={(uid, name) => { handleDownloadAttachment(uid, name); }}
        />
      ),
    },
  ];

  return (
    <>
      <style>{`.buoy-berth-filter .ant-select-selector { border-radius: 999px !important; } .buoy-berth-filter .ant-select-content { flex-wrap: nowrap !important; overflow: hidden; } .buoy-berth-filter .ant-select-content-item { max-width: 45% !important; } .buoy-berth-filter .ant-select-selection-item { border-radius: 999px !important; }`}</style>
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
            defaultGeometryType={(watchedGeometryType as any) || 'POINT'}
            height={520}
            onChange={(val) => {
              if (val?.coordinates) {
                // Nhận mọi dạng WKT (POINT/MULTIPOINT/LINESTRING/POLYGON) — chọn NHIỀU tọa độ trên bản đồ
                const points = parseGisCoordinates({ geometryType: val.geometryType, coordinates: val.coordinates });
                if (points.length > 0) {
                  setCoordinateList((prev) => {
                    const current = Array.isArray(prev) ? prev : [];
                    const isFilled = (c: { latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }) =>
                      c.latD != null || c.latM != null || c.latS != null || c.lngD != null || c.lngM != null || c.lngS != null;
                    const key = (p: { latitude: number; longitude: number }) => `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                    const existingKeys = new Set(current
                      .filter(isFilled)
                      .map(c => key({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 })));
                    const fresh = points.filter(p => !existingKeys.has(key(p)));
                    const toDmsRows = (ps: Array<{ latitude: number; longitude: number }>) => ps.map(p => {
                      const latDms = ddToDms(p.latitude);
                      const lngDms = ddToDms(p.longitude);
                      return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
                    });
                    // 1) Điền điểm vào các hàng còn TRỐNG ở đầu/cuối (giữ nguyên vị trí), số điểm thừa mới thêm xuống dưới.
                    let fi = 0;
                    const merged = current.map((row) => {
                      if (isFilled(row)) return row;
                      if (fi >= fresh.length) return row;
                      const p = fresh[fi];
                      fi += 1;
                      const rows = toDmsRows([p]);
                      return rows[0];
                    });
                    merged.push(...toDmsRows(fresh.slice(fi)));
                    return merged;
                  });
                }
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
});
