import { useState, useEffect, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Tabs, Row, Col, Input, Select, InputNumber, DatePicker, Form, Space, Button, Modal, type InputNumberProps } from 'antd';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SlidersOutlined,
  FileTextOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { pierCRUD, portCRUD, berthCRUD } from '../../services/portService';
import type { Pier } from '../../types/port';
import { organizationService } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { VIETNAM_PROVINCES } from '../../types/common';
import { OPERATIONAL_FUNCTION_OPTIONS, splitOperationalFunctionCodes } from '../../constants/operationalFunction';
import toast from '../../components/ToastNotification';
import { fmtInputNumber, normalizeSafeNumber } from '../../utils/numFmt';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';
import {
  textSecondary, textTertiary, borderDefault, actionPrimary, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField,
  surfaceCard, readonlyInputStyle, sidebarBg, textAreaStyle,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
  getDatePickerProps,
} from '../../themetokenchk';

type SaveAction = 'DRAFT' | 'SUBMIT' | 'SAVE_AND_APPROVE' | 'APPROVED' | 'UPDATE';
type UploadFile = { uid: string; name: string; size: number; type: string; status: string; originFileObj?: File };
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

const labelProps = (text: string) => ({
  label: <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

// Màn Cảng biển dùng font 13.5px cho phần tiêu đề/chỉ số trong drawer.
const portFormFontSizeMd = 13.5;
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
import { GEOMETRY_POINT_COUNT, validateDmsCoordinates, serializeCoordinatesToWkt } from '../../utils/gisGeometry';

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
const numberStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
type NumberInputWithCountProps = InputNumberProps<any> & { maxLength: number };

/** Cùng hiển thị bộ đếm số (0/n) và giới hạn như các chỉ số ở form Cảng biển. */
function NumberInputWithCount({ maxLength, value, ...inputProps }: NumberInputWithCountProps) {
  const count = String(value ?? '').length;

  return (
    <InputNumber
      stringMode
      {...inputProps}
      value={value}
      maxLength={maxLength}
      suffix={<span style={{ color: textSecondary, fontSize: fontSizeMd }}>{count}/{maxLength}</span>}
    />
  );
}

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
      step: 1,
      msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm', base: 'Phút', value: mVal, max: 59,
      radius: '0', unit: "'", unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
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
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [gpsPage] = useState(1);
  const [indicatorOpen, setIndicatorOpen] = useState(true);
  const [athhPlanOpen, setAthhPlanOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [mooringScopeOpen, setMooringScopeOpen] = useState(true);

  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('*') ?? false;

  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);
  const watchedBerthId = Form.useWatch('berthId', form);
  const watchedGeometryType = Form.useWatch('geometryType', form);
  const hasCoordinates = coordinateList.some((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null));
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);
  const watchedOperationalFunction = Form.useWatch('operationalFunction', form);

  // Hiển thị trường hợp bản ghi cũ chưa chuẩn hóa (token giá trị tự do không nằm trong option)
  // → vẫn hiển thị tag của token đó; phần lựa chọn MỚI bị giới hạn bởi OPERATIONAL_FUNCTION_OPTIONS.
  const operationalFnOptions = useMemo(() => {
    const current: unknown = watchedOperationalFunction;
    const tokenList: string[] = Array.isArray(current)
      ? current
      : splitOperationalFunctionCodes(current as string | null | undefined);
    const extraTokens = tokenList.filter(
      (t) => t && !OPERATIONAL_FUNCTION_OPTIONS.some((o) => o.value === t),
    );
    if (extraTokens.length === 0) return OPERATIONAL_FUNCTION_OPTIONS;
    return [
      ...extraTokens.map((t) => ({ value: t, label: t })),
      ...OPERATIONAL_FUNCTION_OPTIONS,
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedOperationalFunction]);

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
    openingDecision: useMaxReached('openingDecision', 2000),
    investmentAgreementDoc: useMaxReached('investmentAgreementDoc', 2000),
    waterAreaNeutralScope: useMaxReached('waterAreaNeutralScope', 2000),
  };

  useEffect(() => { (async () => { setLoadingOrgs(true); try { const r = await organizationService.list({ pageSize: 1000 }); setOrgUnits(r.data || []); } catch {} finally { setLoadingOrgs(false); } })(); }, []);
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
  const mappedAttachments = useMemo<InfrastructureAttachmentItem[]>(() =>
    uploadedFiles.map((file) => {
      const attachment = file as typeof file & Record<string, unknown>;
      const uploadedBy = typeof attachment.uploadedBy === 'string' ? attachment.uploadedBy : undefined;
      const uploadedByName = typeof attachment.uploadedByName === 'string'
        ? attachment.uploadedByName
        : uploadedBy ? userMap.get(uploadedBy) : undefined;
      return {
        ...attachment,
        id: file.uid,
        fileName: file.name,
        fileSize: file.size,
        file: file.originFileObj,
        ...(uploadedByName ? { uploadedByName } : {}),
      };
    }),
    [uploadedFiles, userMap],
  );
  // Luồng hàng hải lấy từ module Luồng hàng hải (/navigation-channel) đã được duyệt — không dùng GIS LineObject
  useEffect(() => {
    navigationChannelCRUD.search({ approvalStatus: 'APPROVED', page: 0, size: 1000 })
      .then(r => setWaterwayOptions((r.items || []).map(n => ({ value: n.id, label: n.channelName || n.channelCode || '' }))))
      .catch(() => {});
  }, []);
  // Đơn vị quản lý KHÔNG tự điền sẵn — để người dùng chủ động chọn từ cây đơn vị (không mặc định 1 giá trị).
  useEffect(() => { if (!watchedOrgUnitId) { setPortOptions([]); return; } (async () => { setLoadingPorts(true); try { const r = await portCRUD.findAll({ orgUnitId: watchedOrgUnitId, approvalStatus: 'APPROVED', page: 1, size: 1000 }); setPortOptions((r.data || []).map((p: any) => ({ value: p.id, label: p.portName }))); } catch {} finally { setLoadingPorts(false); } })(); }, [watchedOrgUnitId]);
  useEffect(() => { if (!watchedPortId) { setBerthOptions([]); return; } (async () => { setLoadingBerths(true); try { const r = await berthCRUD.search({ portId: watchedPortId, approvalStatus: 'APPROVED', page: 1, pageSize: 1000 }); setBerthOptions((r.data || []).map((b: any) => ({ value: b.id, label: b.berthName }))); } catch {} finally { setLoadingBerths(false); } })(); }, [watchedPortId]);
  useEffect(() => { if (!watchedBerthId || isEdit) return; setPierCodeLoading(true); (async () => { try { const res = await api.get('/v1/piers/generate-code', { params: { berthId: watchedBerthId } }); const code = res.data?.data?.pierCode ?? res.data?.data; if (code) form.setFieldsValue({ pierCode: code }); } catch {} finally { setPierCodeLoading(false); } })(); }, [watchedBerthId, isEdit, form]);
  useEffect(() => { (async () => { setLoadingSymbols(true); try { const r = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' }); setSymbols(r.data || (r as any).content || []); } catch {} finally { setLoadingSymbols(false); } })(); }, []);
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
      // Chỉnh sửa: giữ tọa độ đã nhập, tự thêm dòng trống cho đủ số lượng theo loại đối tượng (điểm → 1, đường → 2, vùng → 3)
      const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
      setCoordinateList((prev) => {
        if (watchedGeometryType === 'POINT' && prev.length > 1) return prev.slice(0, 1);
        if (prev.length >= count) return prev;
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      });
    }
  }, [watchedGeometryType, isEdit, form]);
  useEffect(() => { if (!isEdit || !id) return; (async () => { try { const d: Pier = await pierCRUD.findById(id); form.setFieldsValue({ orgUnitId: d.orgUnitId, portId: d.portId, berthId: d.berthId, navigationChannelId: d.navigationChannelId, pierCode: d.pierCode, pierName: d.pierName, length: normalizeSafeNumber(d.length), width: normalizeSafeNumber(d.width), operationalFunction: splitOperationalFunctionCodes(d.operationalFunction), operationalStatus: d.operationalStatus, province: d.province, detailedLocation: d.detailedLocation, constructionGrade: d.constructionGrade, structureType: d.structureType, currentWaterDepth: normalizeSafeNumber(d.currentWaterDepth), designBedElevation: normalizeSafeNumber(d.designBedElevation), publishedVesselDWT: normalizeSafeNumber(d.publishedVesselDWT), maintenanceApprovalDate: parseMonthYear(d.maintenanceApprovalDate), safetyAssessmentDate: parseMonthYear(d.safetyAssessmentDate), lastInspectionDate: parseMonthYear(d.lastInspectionDate), operatingPierCount: d.operatingPierCount, publishedPierCount: d.publishedPierCount, investmentAgreementPierCount: d.investmentAgreementPierCount, cargoThroughput: normalizeSafeNumber(d.cargoThroughput), receivesLargeVessel: d.receivesLargeVessel, documentNumber: d.documentNumber, documentDate: d.documentDate ? dayjs(d.documentDate) : undefined, openingAnnouncementDate: d.openingAnnouncementDate ? dayjs(d.openingAnnouncementDate) : undefined, openingDecision: d.openingDecision, investmentAgreementDoc: d.investmentAgreementDoc, waterAreaNeutralScope: d.waterAreaNeutralScope, geometryType: d.geometryType || undefined, mapSymbolId: d.mapSymbolId || d.bieuTuongId, coordinateSystem: d.geometryType ? (d as any).coordinateSystem : undefined, displayRule: (d as any).displayRule });
        const pts = d.coordinates ? parseGisCoordinates({ geometryType: d.geometryType, coordinates: d.coordinates }) : [];
        if (pts.length > 0) {
          setCoordinateList(pts.map(c => {
            const latDms = ddToDms(c.latitude);
            const lngDms = ddToDms(c.longitude);
            return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
          }));
        }
        try {
          const fr = await api.get(`/v1/piers/${id}/attachments`);
          const files = fr.data?.data || [];
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
              uploadedByName: a.uploadedByName || a.uploaderName || a.uploadedBy,
              uploadedBy: a.uploadedBy,
              uploadedDate: a.uploadedDate || a.uploadedAt || a.createdAt,
              uploadedAt: a.uploadedAt || a.uploadedDate || a.createdAt,
              createdAt: a.createdAt || a.uploadedAt || a.uploadedDate,
              status: 'done' as const,
            }))
          );
        } catch {} } catch { toast.error('Không thể tải thông tin cầu cảng'); } })(); }, [isEdit, id, form]);

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
    api.get(`/v1/piers/${id}/attachments/${uid}/download`, { responseType: 'blob' })
      .then((response) => {
        if (!triggerBlobDownload(response.data, name || 'attachment')) toast.error('Không thể tải xuống tệp đính kèm');
      })
      .catch(() => toast.error('Không thể tải xuống tệp đính kèm'));
  };

  const handleOrgUnitChange = () => { form.setFieldsValue({ portId: undefined, berthId: undefined, pierCode: undefined }); setCoordinateList([]); };
  const handlePortChange = () => { form.setFieldsValue({ berthId: undefined, pierCode: undefined }); };
  const handleBeforeUpload = (file: File) => {
    if (file.size > MAX_FILE_SIZE) { toast.error('Kích thước file tối đa 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','tiff','tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    if (uploadedFiles.length >= MAX_FILE_COUNT) { toast.error('Tối đa 10 file'); return false; }
    const nowIso = dayjs().toISOString();
    const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
    setUploadedFiles((prev) => [
      ...prev,
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
        originFileObj: file,
      },
    ]);
    return false;
  };

  const handleRemoveFile = (file: UploadFile) => { setUploadedFiles(prev => prev.filter(x => x.uid !== file.uid)); };

  const addGpsPoint = () => { setCoordinateList([...coordinateList, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]); };
  const removeCoordinate = (i: number) => { setCoordinateList(coordinateList.filter((_, idx) => idx !== i)); };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setCoordinateList(p => { const n = [...p]; n[i] = {
      ...n[i],
      [field === 'lat' ? 'latD' : 'lngD']: dVal,
      [field === 'lat' ? 'latM' : 'lngM']: mVal,
      [field === 'lat' ? 'latS' : 'lngS']: sVal,
    }; return n; });
  };

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    const vals = form.getFieldsValue();
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
    if (!vals.province) {
      toast.error('Địa điểm (Tỉnh/Thành Phố) là bắt buộc');
      setActiveTabKey('general');
      return;
    }
    if (!vals.operationalStatus) {
      toast.error('Tình trạng là bắt buộc');
      setActiveTabKey('general');
      return;
    }

    if (vals.geometryType) {
      if (!vals.mapSymbolId) {
        setActiveTabKey('location');
        form.setFields([{ name: ['mapSymbolId'], errors: ['Biểu tượng là bắt buộc khi đã chọn loại đối tượng'] }]);
        toast.error('Biểu tượng là bắt buộc khi đã chọn loại đối tượng');
        return;
      }

      const minCount = GEOMETRY_POINT_COUNT[vals.geometryType as string] ?? 1;
      const validCoords = coordinateList.filter(
        (c) => c.latD != null && c.latM != null && c.latS != null && c.lngD != null && c.lngM != null && c.lngS != null
      );

      if (validCoords.length < minCount) {
        setActiveTabKey('location');
        const msg =
          vals.geometryType === 'POLYGON'
            ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ'
            : vals.geometryType === 'LINE'
            ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ'
            : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ';
        toast.error(msg);
        return;
      }

      // Đối tượng điểm (POINT) chỉ cho phép đúng 1 tọa độ GPS — nếu nhiều hơn thì chặn & báo.
      if (vals.geometryType === 'POINT' && validCoords.length > 1) {
        setActiveTabKey('location');
        toast.error('Loại đối tượng điểm chỉ cho phép 1 tọa độ GPS');
        return;
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
        return;
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
        return;
      }
    }

    const validCoords = vals.geometryType
      ? coordinateList.filter((c) => c.latD != null && c.latM != null && c.latS != null && c.lngD != null && c.lngM != null && c.lngS != null)
      : [];
    const wktCoordinates = vals.geometryType && validCoords.length > 0
      ? serializeCoordinatesToWkt(
          validCoords.map((c) => ({
            latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
            longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
          })),
          vals.geometryType || 'POINT'
        )
      : undefined;

    onSubmittingChange?.(true);
    try {
      const payload: Record<string, unknown> = { pierCode: vals.pierCode?.trim(), pierName: vals.pierName?.trim(), berthId: vals.berthId, portId: vals.portId || undefined, navigationChannelId: vals.navigationChannelId || undefined, length: vals.length != null ? Number(vals.length) : undefined, width: vals.width != null ? Number(vals.width) : undefined, operationalFunction: Array.isArray(vals.operationalFunction) ? (vals.operationalFunction.length > 0 ? vals.operationalFunction.join(',') : undefined) : (vals.operationalFunction || undefined), operationalStatus: vals.operationalStatus || undefined, province: vals.province || undefined, detailedLocation: vals.detailedLocation || undefined, constructionGrade: vals.constructionGrade ?? undefined, structureType: vals.structureType ?? undefined, currentWaterDepth: vals.currentWaterDepth || undefined, designBedElevation: vals.designBedElevation || undefined, publishedVesselDWT: vals.publishedVesselDWT || undefined, maintenanceApprovalDate: fmtMonthYear(vals.maintenanceApprovalDate), safetyAssessmentDate: fmtMonthYear(vals.safetyAssessmentDate), lastInspectionDate: fmtMonthYear(vals.lastInspectionDate), operatingPierCount: vals.operatingPierCount ?? undefined, publishedPierCount: vals.publishedPierCount ?? undefined, investmentAgreementPierCount: vals.investmentAgreementPierCount ?? undefined, cargoThroughput: vals.cargoThroughput != null ? Number(vals.cargoThroughput) : undefined, receivesLargeVessel: vals.receivesLargeVessel ?? undefined, documentNumber: vals.documentNumber || undefined, documentDate: vals.documentDate ? dayjs(vals.documentDate).format('YYYY-MM-DD') : undefined, openingAnnouncementDate: vals.openingAnnouncementDate ? dayjs(vals.openingAnnouncementDate).format('YYYY-MM-DD') : undefined, openingDecision: vals.openingDecision || undefined, investmentAgreementDoc: vals.investmentAgreementDoc || undefined, waterAreaNeutralScope: vals.waterAreaNeutralScope || undefined, geometryType: vals.geometryType || undefined, mapSymbolId: vals.mapSymbolId || undefined, coordinateSystem: vals.coordinateSystem, displayRule: vals.displayRule };
      // Process GPS coordinates into WKT format (chuẩn VTS CHK — serializeCoordinatesToWkt)
      (payload as any).latitude = validCoords.length > 0 ? validCoords[0].latitude : undefined;
      (payload as any).longitude = validCoords.length > 0 ? validCoords[0].longitude : undefined;
      (payload as any).coordinates = wktCoordinates || undefined;
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
    // Tab 1: Thông tin chung — cùng cấu trúc section card với Cảng biển.
    { key: 'general', label: 'Thông tin chung', children: (<div style={drawerFormScrollStyle}>
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleStyle}>
            <BankOutlined style={{ color: actionPrimary }} />
            <span>Thông tin cơ bản & Quản lý vận hành</span>
          </div>
        </div>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]} style={{ marginBottom: spaceFormField }}><OrgUnitTreeSelect organizations={orgUnits} placeholder="Chọn đơn vị quản lý" loading={loadingOrgs} disabled={isEdit} showPath treeDefaultExpandAll={false} onChange={handleOrgUnitChange} /></Form.Item></Col><Col span={12}><Form.Item name="portId" {...labelProps('Thuộc cảng biển')} required rules={[{ required: true, message: 'Cảng biển là bắt buộc' }]} style={{ marginBottom: spaceFormField }}><Select placeholder={!watchedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : portOptions.length === 0 && !loadingPorts ? 'Không có cảng biển thuộc đơn vị quản lý' : 'Chọn cảng biển...'} loading={loadingPorts} disabled={isEdit || !watchedOrgUnitId || (portOptions.length === 0 && !loadingPorts)} options={portOptions} showSearch optionFilterProp="label" notFoundContent="Không có cảng biển thuộc đơn vị quản lý" onChange={handlePortChange} style={selectStyle} /></Form.Item></Col></Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="berthId" {...labelProps('Thuộc bến cảng')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Bến cảng là bắt buộc' }]}><Select placeholder={!watchedPortId ? 'Vui lòng chọn cảng biển trước' : berthOptions.length === 0 && !loadingBerths ? 'Không có bến cảng thuộc cảng biển' : 'Chọn bến cảng...'} loading={loadingBerths} disabled={!watchedPortId || (berthOptions.length === 0 && !loadingBerths)} options={berthOptions} showSearch optionFilterProp="label" notFoundContent="Không có bến cảng thuộc cảng biển" style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="navigationChannelId" {...labelProps('Thuộc luồng hàng hải')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn luồng hàng hải..." options={waterwayOptions} showSearch allowClear optionFilterProp="label" style={selectStyle} /></Form.Item></Col></Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="pierCode" {...labelProps('Mã cầu cảng')} style={{ marginBottom: spaceFormField }} tooltip="Mã được sinh tự động"><Input disabled placeholder={pierCodeLoading ? 'Đang sinh mã...' : watchedBerthId ? 'Mã tự động' : 'Chọn Bến để sinh mã'} style={readonlyInputStyle} /></Form.Item></Col><Col span={12}><Form.Item name="pierName" {...labelProps('Tên cầu cảng')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true }, { max: 255 }]} validateStatus={atMax.pierName ? 'error' : undefined} help={atMax.pierName ? 'Đã đạt tối đa 255 ký tự' : undefined}><Input placeholder="Nhập tên cầu cảng" maxLength={255} showCount style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="province" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}><Select showSearch placeholder="Chọn địa điểm" filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.detailedLocation ? 'error' : undefined} help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}><Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} /></Form.Item></Col></Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="constructionGrade" {...labelProps('Phân cấp công trình')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn phân cấp công trình" allowClear options={CONSTRUCTION_GRADE_OPTIONS} style={selectStyle} /></Form.Item></Col><Col span={12}><Form.Item name="structureType" {...labelProps('Loại kết cấu cầu cảng')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn loại kết cấu" options={STRUCTURE_TYPE_OPTIONS} style={selectStyle} /></Form.Item></Col></Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="operationalFunction" {...labelProps('Công năng khai thác')} style={{ marginBottom: spaceFormField }}><Select mode="multiple" showSearch allowClear placeholder="Công năng khai thác" optionFilterProp="label" options={operationalFnOptions} style={{ borderRadius: radiusPill }} maxTagCount="responsive" /></Form.Item></Col><Col span={12}><Form.Item name="operationalStatus" {...labelProps('Tình trạng')} style={{ marginBottom: spaceFormField }} initialValue="NOT_YET_OPERATIONAL" rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}><Select placeholder="Chọn tình trạng" options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} /></Form.Item></Col></Row>
      </div>

      <div style={sectionBoxStyle}>
      <div onClick={() => setIndicatorOpen(!indicatorOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: indicatorOpen ? spaceSm : 0, paddingBottom: indicatorOpen ? spaceSm : 0, borderBottom: indicatorOpen ? sectionHeaderStyle.borderBottom : 'none' }}>
        <div style={sectionTitleStyle}><SlidersOutlined style={{ color: actionPrimary }} /><span>Thông số kỹ thuật & Năng lực khai thác</span></div>
        <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>{indicatorOpen ? <DownOutlined /> : <RightOutlined />}</span>
      </div>
      {indicatorOpen && (<div>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="length" {...labelProps('Chiều dài (m)')} style={{ marginBottom: spaceFormField }}><NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} /></Form.Item></Col><Col span={12}><Form.Item name="width" {...labelProps('Chiều rộng (m)')} style={{ marginBottom: spaceFormField }}><NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="currentWaterDepth" {...labelProps('Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)')} style={{ marginBottom: spaceFormField }}><NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} /></Form.Item></Col><Col span={12}><Form.Item name="designBedElevation" {...labelProps('Cao độ đáy bến thiết kế')} style={{ marginBottom: spaceFormField }}><NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="publishedVesselDWT" {...labelProps('Cỡ tàu khai thác theo công bố (DWT)')} style={{ marginBottom: spaceFormField }}><NumberInputWithCount min={0} step={1} precision={0} maxLength={20} placeholder="0" style={numberStyle} /></Form.Item></Col><Col span={12}><Form.Item name="lastInspectionDate" {...labelProps('Thời điểm kiểm định gần nhất')} style={{ marginBottom: spaceFormField }}><DatePicker {...getDatePickerProps({ picker: 'month', format: 'MM/YYYY', placeholder: 'Chọn tháng/năm', style: selectStyle })} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="maintenanceApprovalDate" className="cn-op-2line-label" {...labelProps('Thời điểm phê duyệt quy trình bảo trì công trình')} style={{ marginBottom: spaceFormField }}><DatePicker {...getDatePickerProps({ picker: 'month', format: 'MM/YYYY', placeholder: 'Chọn tháng/năm', style: selectStyle })} /></Form.Item></Col><Col span={12}><Form.Item name="safetyAssessmentDate" className="cn-op-2line-label" {...labelProps('Thời điểm được chấp thuận hồ sơ báo cáo đánh giá ATCT (gần nhất)')} style={{ marginBottom: spaceFormField }}><DatePicker {...getDatePickerProps({ picker: 'month', format: 'MM/YYYY', placeholder: 'Chọn tháng/năm', style: selectStyle })} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="operatingPierCount" {...labelProps('Số lượng cầu cảng đang khai thác')} style={{ marginBottom: spaceFormField }}><NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberStyle} /></Form.Item></Col><Col span={12}><Form.Item name="publishedPierCount" {...labelProps('Số lượng cầu cảng đã công bố')} style={{ marginBottom: spaceFormField }}><NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberStyle} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="investmentAgreementPierCount" {...labelProps('Số lượng cầu cảng đang được thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}><NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberStyle} /></Form.Item></Col><Col span={12}><Form.Item name="cargoThroughput" {...labelProps('Sản lượng hàng thông qua')} style={{ marginBottom: spaceFormField }}><NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="receivesLargeVessel" className="cn-op-2line-label" {...labelProps('Tiếp nhận tàu có trọng tải lớn hơn thông số tại quyết định công bố')} style={{ marginBottom: spaceFormField }}><Select allowClear placeholder="Chọn tiếp nhận tàu có trọng tải lớn hơn thông số ..." options={[{ value: true, label: 'Có' }, { value: false, label: 'Không' }]} style={selectStyle} /></Form.Item></Col></Row>
      </div>)}
      </div>

      <div style={sectionBoxStyle}>
      <div onClick={() => setAthhPlanOpen(!athhPlanOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: athhPlanOpen ? spaceSm : 0, paddingBottom: athhPlanOpen ? spaceSm : 0, borderBottom: athhPlanOpen ? sectionHeaderStyle.borderBottom : 'none' }}>
        <div style={sectionTitleStyle}><FileTextOutlined style={{ color: actionPrimary }} /><span>Thông tin phương án bảo đảm ATHH đã duyệt</span></div>
        <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>{athhPlanOpen ? <DownOutlined /> : <RightOutlined />}</span>
      </div>
      {athhPlanOpen && (<div>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="documentNumber" {...labelProps('Số văn bản')} style={{ marginBottom: spaceFormField }}><Input placeholder="Nhập số văn bản" maxLength={20} showCount style={inputStyle} /></Form.Item></Col><Col span={12}><Form.Item name="documentDate" {...labelProps('Ngày văn bản')} style={{ marginBottom: spaceFormField }}><DatePicker {...getDatePickerProps({ placeholder: 'Chọn ngày' })} /></Form.Item></Col></Row>
      </div>)}
      </div>

      <div style={sectionBoxStyle}>
      <div onClick={() => setAnnouncementOpen(!announcementOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: announcementOpen ? spaceSm : 0, paddingBottom: announcementOpen ? spaceSm : 0, borderBottom: announcementOpen ? sectionHeaderStyle.borderBottom : 'none' }}>
        <div style={sectionTitleStyle}><FileTextOutlined style={{ color: actionPrimary }} /><span>Thông tin công bố mở, đưa vào sử dụng</span></div>
        <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>{announcementOpen ? <DownOutlined /> : <RightOutlined />}</span>
      </div>
      {announcementOpen && (<div>
        <Row gutter={[24, 0]}><Col span={12}><Form.Item name="openingAnnouncementDate" {...labelProps('Thời điểm công bố mở, đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}><DatePicker {...getDatePickerProps({ placeholder: 'Chọn thời điểm' })} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={24}><Form.Item name="openingDecision" {...labelProps('Quyết định công bố/ Văn bản cho phép khai thác')} style={{ marginBottom: spaceFormField }}><Input.TextArea rows={3} placeholder="Nhập quyết định" maxLength={2000} showCount style={textAreaStyle} /></Form.Item></Col></Row>
        <Row gutter={[24, 0]}><Col span={24}><Form.Item name="investmentAgreementDoc" {...labelProps('Văn bản thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}><Input.TextArea rows={3} placeholder="Nhập văn bản thỏa thuận" maxLength={2000} showCount style={textAreaStyle} /></Form.Item></Col></Row>
      </div>)}
      </div>

      <div style={sectionBoxStyle}>
      <div onClick={() => setMooringScopeOpen(!mooringScopeOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: mooringScopeOpen ? spaceSm : 0, paddingBottom: mooringScopeOpen ? spaceSm : 0, borderBottom: mooringScopeOpen ? sectionHeaderStyle.borderBottom : 'none' }}>
        <div style={sectionTitleStyle}><FileTextOutlined style={{ color: actionPrimary }} /><span>Phạm vi khu nước neo buộc tàu</span></div>
        <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>{mooringScopeOpen ? <DownOutlined /> : <RightOutlined />}</span>
      </div>
      {mooringScopeOpen && (<div>
        <Row gutter={[24, 0]}><Col span={24}><Form.Item name="waterAreaNeutralScope" {...labelProps('Phạm vi khu nước neo buộc tàu')} style={{ marginBottom: spaceFormField }}><Input.TextArea rows={3} placeholder="Nhập phạm vi khu nước" maxLength={2000} showCount style={textAreaStyle} /></Form.Item></Col></Row>
      </div>)}
      </div>
    </div>) },
    // Tab 2: Thông tin vị trí — tách thông số bản đồ và bảng GPS như Cảng biển.
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
              {symbols.map((sym) => (
                <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                  <Space>
                    {sym.image && (
                      <img
                        src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                        alt={sym.name}
                        style={{ width: 20, height: 20, objectFit: 'contain' }}
                      />
                    )}
                    <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[24, 0]}><Col span={12}><Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} /></Form.Item></Col><Col span={12}><Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}><Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} /></Form.Item></Col></Row>
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
              fontSize: fontSizeSm,
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
              fontSize: fontSizeSm,
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
            disabled={!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)}
            style={!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1) ? {
              height: 32,
              fontSize: fontSizeSm,
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
              fontSize: fontSizeSm,
              padding: '0 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: spaceXs,
            }}
            title={watchedGeometryType === 'POINT' && coordinateList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined}
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
                  style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Xóa tọa độ"
                />
              ),
            },
          ]}
        />
      )}
      </div>
    </div>) },
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
          onDelete={(uid) => { handleRemoveFile({ uid } as UploadFile); }}
          onDownload={(uid, name) => { handleDownloadAttachment(uid, name); }}
        />
      ),
    },
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

PierForm.displayName = 'PierForm';
export default PierForm;
