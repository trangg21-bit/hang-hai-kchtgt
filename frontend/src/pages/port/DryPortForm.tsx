import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Space, DatePicker, Modal, Table,
} from 'antd';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import type { UploadFile } from 'antd';
import {
  PlusOutlined, DeleteOutlined, EnvironmentOutlined,
  BankOutlined, SlidersOutlined, FileTextOutlined,
  DownOutlined, RightOutlined,
} from '@ant-design/icons';
import {
  colors,
  textTertiary, borderDefault, actionPrimary, statusCritical,
  fontSizeSm, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField,
  surfaceCard, readonlyInputStyle,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
  getDatePickerProps,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import type { DryPort, SaveAction } from '../../types/port';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import { userService } from '../../services/userService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { useAuthStore } from '../../store/authStore';
import { GEOMETRY_POINT_COUNT, parseWktToCoordinates } from '../../utils/gisGeometry';

const fontSizeMd = 13.5;

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

// Style cho thẻ phân nhóm (Section Card) đồng bộ với BerthForm / BuoyForm
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

const REGION_OPTIONS = [
  { value: 'Miền Bắc', label: 'Miền Bắc' },
  { value: 'Miền Trung', label: 'Miền Trung' },
  { value: 'Miền Nam', label: 'Miền Nam' },
];

const PORT_STATUS_OPTIONS = [
  { value: 1, label: 'Đang khai thác/Vận hành' },
  { value: 0, label: 'Chưa khai thác/Vận hành' },
  { value: 2, label: 'Dừng khai thác/Vận hành' },
];

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

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

const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  const started = dVal != null || mVal != null || sVal != null;
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

export interface DryPortFormHandle {
  submit: (saveAction: SaveAction) => void;
}

export interface DryPortFormProps {
  form: any;
  id?: string;
  onFinish: (saved: boolean) => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export default forwardRef<DryPortFormHandle, DryPortFormProps>(function DryPortForm(
  { form, id, onFinish, onSubmittingChange }: DryPortFormProps,
  ref,
) {
  const isEdit = !!id;
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [codeLoading, setCodeLoading] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('*') ?? false;

  const watchedGeometryType = Form.useWatch('geometryType', form);

  const useMaxReached = (name: string, max: number): boolean => {
    const raw = Form.useWatch(name, form) ?? '';
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };

  const atMax = {
    dryPortName: useMaxReached('dryPortName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    connectionMode: useMaxReached('connectionMode', 2000),
    transportCorridor: useMaxReached('transportCorridor', 100),
    teuCapacity: useMaxReached('teuCapacity', 20),
    area: useMaxReached('area', 20),
    warehouseArea: useMaxReached('warehouseArea', 20),
    yardArea: useMaxReached('yardArea', 20),
    remarks: useMaxReached('remarks', 2000),
    announcementDecisionNumber: useMaxReached('announcementDecisionNumber', 20),
    announcementOrg: useMaxReached('announcementOrg', 255),
  };

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const hasCoordinates = coordinateList.some((c) => (c.latD ?? c.latM ?? c.latS) != null && (c.lngD ?? c.lngM ?? c.lngS) != null);
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsPage, setGpsPage] = useState(1);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => map.set(u.id, u.fullName || u.username || u.id));
        setUserMap(map);
      } catch { /* ignore */ }
    })();
  }, []);

  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    if (uploadFileList.length >= 10) { toast.error('Tối đa 10 file'); return false; }
    const nowIso = dayjs().toISOString();
    const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
    setUploadFileList((prev) => [
      ...prev,
      {
        uid: `rc-upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
      } as any,
    ]);
    return false;
  };

  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => setSymbols(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingOrgs(true);
    organizationService.list({ pageSize: 1000 }).then(r => setOrganizations(r.data || [])).catch(() => {}).finally(() => setLoadingOrgs(false));
  }, []);

  // Tự sinh mã khi thêm mới
  useEffect(() => {
    if (!isEdit) {
      setCodeLoading(true);
      api.get('/v1/dry-ports/generate-code')
        .then((res: any) => {
          const code: string = res.data?.data?.code ?? res.data?.data?.dryPortCode ?? '';
          if (code) form.setFieldsValue({ dryPortCode: code });
        })
        .catch(() => {})
        .finally(() => setCodeLoading(false));
    }
  }, [isEdit, form]);

  // Non-admin auto-fill orgUnit
  useEffect(() => {
    if (!isSystemAdmin && !isEdit) {
      api.get('/users/me').then((res: any) => {
        const p = res.data?.data ?? res.data;
        if (p?.orgUnitId) form.setFieldsValue({ orgUnitId: p.orgUnitId });
      }).catch(() => {});
    }
  }, [isSystemAdmin, isEdit, form]);

  // Tự động set số dòng GPS khi thay đổi loại đối tượng
  useEffect(() => {
    if (!watchedGeometryType) {
      form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      return;
    }
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
  }, [watchedGeometryType, form]);

  // Load existing data when editing
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const res = await api.get(`/v1/dry-ports/${id}`);
        const data: DryPort = res.data?.data ?? res.data;

        const pts = parseWktToCoordinates(data.coordinates);
        if (pts.length > 0) {
          setCoordinateList(pts.map(c => {
            const la = ddToDms(c.latitude);
            const lo = ddToDms(c.longitude);
            return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
          }));
        } else if (data.latitude != null && data.longitude != null) {
          const la = ddToDms(Number(data.latitude));
          const lo = ddToDms(Number(data.longitude));
          setCoordinateList([{ latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s }]);
        }

        try {
          const [res1, res2] = await Promise.allSettled([
            api.get(`/v1/documents/entity/dryport/${id}`, { params: { page: 0, size: 50 } }),
            api.get(`/v1/documents/entity/dry-port/${id}`, { params: { page: 0, size: 50 } }),
          ]);
          const atts1 = res1.status === 'fulfilled' ? (res1.value.data?.data?.content || res1.value.data?.data || []) : [];
          const atts2 = res2.status === 'fulfilled' ? (res2.value.data?.data?.content || res2.value.data?.data || []) : [];
          const atts = [
            ...(Array.isArray(atts1) ? atts1 : []),
            ...(Array.isArray(atts2) ? atts2 : []).filter((b: any) => !(Array.isArray(atts1) ? atts1 : []).some((a: any) => a.id === b.id)),
          ];
          setUploadFileList(atts.map((a: any) => ({
            uid: a.id,
            name: a.fileName,
            fileName: a.fileName,
            size: a.fileSize,
            fileSize: a.fileSize,
            status: 'done',
            uploadedByName: a.uploadedByName || a.createdByName || (a.uploadedBy ? userMap.get(a.uploadedBy) : undefined),
            uploadedBy: a.uploadedBy || a.createdBy,
            uploadedDate: a.uploadedDate || a.uploadedAt || a.createdAt,
            uploadedAt: a.uploadedAt || a.createdAt,
          })));
        } catch {
          setUploadFileList([]);
        }

        form.setFieldsValue({
          orgUnitId: data.orgUnitId,
          dryPortCode: data.dryPortCode,
          dryPortName: data.dryPortName,
          operatingUnit: data.operatingUnit,
          region: data.region,
          provinceId: data.provinceId !== undefined && data.provinceId !== null
            ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined
            : undefined,
          detailedLocation: data.detailedLocation,
          transportCorridor: data.transportCorridor,
          area: data.area,
          teuCapacity: data.teuCapacity,
          warehouseArea: data.warehouseArea,
          yardArea: data.yardArea,
          connectionMode: data.connectionMode,
          portStatus: data.portStatus !== undefined && data.portStatus !== null ? data.portStatus : 0,
          remarks: data.remarks,
          announcementTime: data.announcementTime ? dayjs(data.announcementTime) : undefined,
          announcementDecisionNumber: data.announcementDecisionNumber,
          announcementDecisionDate: data.announcementDecisionDate ? dayjs(data.announcementDecisionDate) : undefined,
          announcementOrg: data.announcementOrg,
          geometryType: data.geometryType || undefined,
          mapSymbolId: data.mapSymbolId,
          coordinateSystem: data.coordinateSystem,
          displayRule: (data.geometryType || data.coordinates) ? 'Độ, phút, giây (DMS)' : undefined,
        });
      } catch {
        toast.error('Không thể tải thông tin cảng cạn');
      }
    })();
  }, [isEdit, id, form]);

  const addGpsPoint = () => {
    setCoordinateList((prev) => [...(prev || []), { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
  };

  const removeCoordinate = (index: number) => {
    setCoordinateList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGpsPoint = (index: number, type: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    setCoordinateList((prev) => {
      const next = [...prev];
      if (!next[index]) next[index] = { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null };
      if (type === 'lat') {
        next[index] = { ...next[index], latD: d, latM: m, latS: s };
      } else {
        next[index] = { ...next[index], lngD: d, lngM: m, lngS: s };
      }
      return next;
    });
  };

  const buildCoordinatesWkt = (geomType: string | undefined, coords: Array<{ latitude: number; longitude: number }>): string | undefined => {
    if (!geomType || coords.length === 0) return undefined;
    if (geomType === 'POINT') return `POINT(${coords[0].longitude} ${coords[0].latitude})`;
    if (geomType === 'LINE') return `LINESTRING(${coords.map((c) => `${c.longitude} ${c.latitude}`).join(', ')})`;
    if (geomType === 'POLYGON') {
      const ring = [...coords];
      if (ring[0].latitude !== ring[ring.length - 1].latitude || ring[0].longitude !== ring[ring.length - 1].longitude) {
        ring.push(ring[0]);
      }
      return `POLYGON((${ring.map((c) => `${c.longitude} ${c.latitude}`).join(', ')}))`;
    }
    return undefined;
  };

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    onSubmittingChange?.(true);
    try {
      const values = await form.validateFields();
      const dryPortName = String(values.dryPortName ?? '').trim();
      const orgUnitId = values.orgUnitId || undefined;
      const provinceName: string | undefined = values.provinceId;

      if (!dryPortName) {
        toast.error('Tên cảng cạn là bắt buộc');
        onSubmittingChange?.(false);
        return;
      }

      if (saveAction === 'SUBMIT' || saveAction === 'SAVE_AND_APPROVE') {
        const missing: string[] = [];
        if (!orgUnitId) missing.push('Đơn vị quản lý');
        if (!provinceName) missing.push('Địa điểm (Tỉnh/Thành Phố)');
        if (!values.detailedLocation?.trim()) missing.push('Địa điểm chi tiết');
        if (values.teuCapacity == null || Number.isNaN(Number(values.teuCapacity))) missing.push('Công suất khai thác');
        if (values.portStatus == null) missing.push('Tình trạng');
        if (missing.length > 0) {
          toast.error(`Vui lòng hoàn thiện thông tin trước khi lưu. Thiếu: ${missing.join(', ')}`);
          onSubmittingChange?.(false);
          return;
        }
      }

      const manualCoords = coordinateList
        .filter((c) => (c.latD ?? c.latM ?? c.latS) != null && (c.lngD ?? c.lngM ?? c.lngS) != null)
        .map((c) => ({
          latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
          longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
        }));

      if (values.geometryType) {
        const minCount = GEOMETRY_POINT_COUNT[values.geometryType] ?? 1;
        if (manualCoords.length < minCount) {
          toast.error(values.geometryType === 'POLYGON' ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ' : values.geometryType === 'LINE' ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ' : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ');
          setActiveTabKey('location');
          onSubmittingChange?.(false);
          return;
        }
      }

      if (hasLocation && !values.mapSymbolId) {
        toast.error('Vui lòng chọn biểu tượng bản đồ');
        setActiveTabKey('location');
        onSubmittingChange?.(false);
        return;
      }

      if (manualCoords.length > 0 && !values.geometryType) {
        toast.error('Loại đối tượng là bắt buộc khi có tọa độ');
        setActiveTabKey('location');
        onSubmittingChange?.(false);
        return;
      }

      const actionMap: Partial<Record<SaveAction, string>> = { DRAFT: 'draft', SUBMIT: 'submit', SAVE_AND_APPROVE: 'approve' };
      const payload: Record<string, unknown> = {
        saveAction: actionMap[saveAction],
        dryPortCode: String(values.dryPortCode || '').trim() || undefined,
        dryPortName,
        orgUnitId,
        geometryType: values.geometryType || undefined,
        latitude: manualCoords.length > 0 ? manualCoords[0].latitude : undefined,
        longitude: manualCoords.length > 0 ? manualCoords[0].longitude : undefined,
        coordinates: buildCoordinatesWkt(values.geometryType, manualCoords),
        operatingUnit: values.operatingUnit || undefined,
        region: values.region || undefined,
        provinceId: provinceName ? VIETNAM_PROVINCES.indexOf(provinceName) + 1 : undefined,
        detailedLocation: values.detailedLocation || undefined,
        transportCorridor: values.transportCorridor || undefined,
        area: values.area !== undefined && values.area !== null && !Number.isNaN(Number(values.area)) ? Number(values.area) : undefined,
        teuCapacity: values.teuCapacity !== undefined && values.teuCapacity !== null && !Number.isNaN(Number(values.teuCapacity)) ? Number(values.teuCapacity) : undefined,
        warehouseArea: values.warehouseArea !== undefined && values.warehouseArea !== null && !Number.isNaN(Number(values.warehouseArea)) ? Number(values.warehouseArea) : undefined,
        yardArea: values.yardArea !== undefined && values.yardArea !== null && !Number.isNaN(Number(values.yardArea)) ? Number(values.yardArea) : undefined,
        connectionMode: values.connectionMode || undefined,
        portStatus: values.portStatus !== undefined && values.portStatus !== null ? Number(values.portStatus) : undefined,
        remarks: values.remarks || undefined,
        mapSymbolId: values.mapSymbolId || undefined,
        coordinateSystem: values.coordinateSystem !== undefined && values.coordinateSystem !== null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null && !Number.isNaN(Number(values.displayRule)) ? Number(values.displayRule) : undefined,
        announcementTime: values.announcementTime
          ? (typeof values.announcementTime === 'string' ? values.announcementTime : values.announcementTime.toISOString())
          : undefined,
        announcementDecisionNumber: values.announcementDecisionNumber || undefined,
        announcementDecisionDate: values.announcementDecisionDate
          ? (typeof values.announcementDecisionDate === 'string' ? values.announcementDecisionDate : values.announcementDecisionDate.format('YYYY-MM-DD'))
          : undefined,
        announcementOrg: values.announcementOrg || undefined,
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      let savedId: string | undefined;
      if (isEdit && id) {
        await api.put('/v1/dry-ports', { ...payload, id });
        savedId = id;
      } else {
        const res = await api.post('/v1/dry-ports', payload);
        savedId = res.data?.data?.id ?? res.data?.id;
      }

      const successMsg =
        saveAction === 'DRAFT'
          ? 'Lưu tạm thành công'
          : saveAction === 'SAVE_AND_APPROVE'
            ? 'Lưu và phê duyệt thành công'
            : 'Cập nhật thành công';
      toast.success(successMsg);

      // Upload files
      if (savedId && uploadFileList.length > 0) {
        let uploaded = 0;
        for (const f of uploadFileList) {
          const rawFile = (f.originFileObj || (f as any).file || (f instanceof File ? f : undefined)) as File | undefined;
          if (!rawFile) continue;
          try {
            const formData = new FormData();
            formData.append('file', rawFile);
            await api.post(`/v1/documents/upload/dryport/${savedId}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            uploaded++;
          } catch (uploadErr) {
            console.error('Lỗi khi tải file đính kèm:', uploadErr);
            toast.error(`Tải lên tệp "${rawFile.name}" thất bại`);
          }
        }
        if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
      }

      onFinish(true);
    } catch (err: unknown) {
      if ((err as any)?.errorFields) {
        const errFields: Array<{ name: Array<string | number>; errors?: string[] }> = (err as any)?.errorFields ?? [];
        const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra lại các trường bắt buộc';
        toast.error(firstError);
        if (errFields.some((f) => ['mapSymbolId', 'coordinateSystem', 'displayRule', 'geometryType'].includes(String(f.name[0])))) {
          setActiveTabKey('location');
        } else {
          setActiveTabKey('general');
        }
      } else {
        const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại';
        toast.error(msg);
      }
    } finally {
      onSubmittingChange?.(false);
    }
  }, [form, coordinateList, isEdit, id, onFinish, onSubmittingChange, uploadFileList]);

  useImperativeHandle(ref, () => ({
    submit: (saveAction: SaveAction) => {
      void handleSave(saveAction);
    },
  }), [handleSave]);

  const formTabs = [
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
                <Form.Item name="dryPortCode" {...labelProps('Mã cảng cạn')} style={{ marginBottom: spaceFormField }} tooltip="Mã cảng cạn được sinh tự động, không thể chỉnh sửa">
                  <Input disabled placeholder={codeLoading ? 'Đang sinh mã...' : 'Mã tự động'} style={readonlyInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dryPortName" {...labelProps('Tên cảng cạn')} required rules={[{ required: true, message: 'Tên cảng cạn không được để trống' }, { max: 255, message: 'Tên cảng cạn tối đa 255 ký tự' }]} style={{ marginBottom: spaceFormField }} validateStatus={atMax.dryPortName ? 'error' : undefined} help={atMax.dryPortName ? 'Đã đạt tối đa 255 ký tự' : undefined}>
                  <Input placeholder="Nhập Tên cảng cạn" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                  <OrgUnitTreeSelect organizations={organizations} placeholder="Chọn đơn vị quản lý..." loading={loadingOrgs} disabled={isEdit || !isSystemAdmin} showPath treeDefaultExpandAll={false} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operatingUnit" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập đơn vị khai thác" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="region" {...labelProps('Khu vực')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn khu vực..." allowClear options={REGION_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} required rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                  <Select showSearch placeholder="Chọn tỉnh/thành phố..." filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="transportCorridor" {...labelProps('Hành lang vận tải')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.transportCorridor ? 'error' : undefined} help={atMax.transportCorridor ? 'Đã đạt tối đa 100 ký tự' : undefined}>
                  <Input placeholder="Nhập hành lang vận tải" maxLength={100} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="connectionMode" {...labelProps('Phương thức kết nối giao thông với cảng')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.connectionMode ? 'error' : undefined} help={atMax.connectionMode ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
                  <Input placeholder="Nhập phương thức kết nối giao thông với cảng" maxLength={2000} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="portStatus" {...labelProps('Tình trạng')} required rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]} style={{ marginBottom: spaceFormField }} initialValue={1}>
                  <Select options={PORT_STATUS_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} required rules={[{ required: true, message: 'Địa điểm chi tiết là bắt buộc' }]} style={{ marginBottom: spaceFormField }} validateStatus={atMax.detailedLocation ? 'error' : undefined} help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}>
                  <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="remarks" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.remarks ? 'error' : undefined} help={atMax.remarks ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
                  <Input.TextArea placeholder="Nhập ghi chú" maxLength={2000} rows={3} showCount style={{ borderRadius: radiusMd, resize: 'none' }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 2: Quy mô & Năng lực khai thác ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <SlidersOutlined style={{ color: actionPrimary }} />
                <span>Quy mô & Năng lực khai thác</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="teuCapacity" {...labelProps('Công suất khai thác (TEU/năm)')} required rules={[{ required: true, message: 'Công suất khai thác là bắt buộc' }]} style={{ marginBottom: spaceFormField }} validateStatus={atMax.teuCapacity ? 'error' : undefined} help={atMax.teuCapacity ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                  <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="area" {...labelProps('Tổng diện tích cảng (m²)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.area ? 'error' : undefined} help={atMax.area ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                  <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="warehouseArea" {...labelProps('Diện tích kho (m²)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.warehouseArea ? 'error' : undefined} help={atMax.warehouseArea ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                  <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="yardArea" {...labelProps('Diện tích bãi (m²)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.yardArea ? 'error' : undefined} help={atMax.yardArea ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                  <InputNumber min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 3: Thông tin công bố mở, đưa vào sử dụng ── */}
          <div style={{ ...sectionBoxStyle, padding: announcementOpen ? '14px 18px 10px 18px' : '10px 18px' }}>
            <div
              onClick={() => setAnnouncementOpen(!announcementOpen)}
              style={{
                ...sectionHeaderStyle,
                marginBottom: announcementOpen ? 12 : 0,
                paddingBottom: announcementOpen ? 8 : 0,
                borderBottom: announcementOpen ? '1px solid #f1f5f9' : 'none',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={sectionTitleStyle}>
                <FileTextOutlined style={{ color: actionPrimary }} />
                <span>Thông tin công bố mở, đưa vào sử dụng</span>
              </div>
              <span style={{ color: actionPrimary, fontSize: 12 }}>
                {announcementOpen ? <DownOutlined /> : <RightOutlined />}
              </span>
            </div>
            {announcementOpen && (
              <>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="announcementDecisionNumber" {...labelProps('Quyết định công bố số')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.announcementDecisionNumber ? 'error' : undefined} help={atMax.announcementDecisionNumber ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                      <Input placeholder="Nhập quyết định công bố số" maxLength={20} showCount style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="announcementDecisionDate" {...labelProps('Ngày ra quyết định công bố')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker placeholder="Chọn ngày ra quyết định" format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="announcementOrg" {...labelProps('Đơn vị ra quyết định công bố')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.announcementOrg ? 'error' : undefined} help={atMax.announcementOrg ? 'Đã đạt tối đa 255 ký tự' : undefined}>
                      <Input placeholder="Nhập đơn vị ra quyết định" maxLength={255} showCount style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="announcementTime" {...labelProps('Thời điểm công bố mở')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker {...getDatePickerProps({ placeholder: 'Chọn thời điểm công bố mở' })} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      label: `Thông tin vị trí (${coordinateList.length})`,
      children: (
        <div style={drawerFormScrollStyle}>
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
                  {symbols.map((sym) => (
                    <Select.Option key={sym.id} value={sym.id} label={(sym as any).code ? `${sym.name} (${(sym as any).code})` : sym.name}>
                      <Space>
                        {sym.image && (
                          <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                        )}
                        <span>{(sym as any).code ? `${sym.name} (${(sym as any).code})` : sym.name}</span>
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
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
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
          {gpsError && (
            <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {gpsError}</span>
            </div>
          )}
          {coordinateList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block' }}>Chưa có tọa độ nào.</span>
            </div>
          ) : (
            <Table
              size="small"
              tableLayout="fixed"
              rowKey={(r: any, idx?: number) => r?._idx ?? String(idx)}
              pagination={coordinateList.length > 10 ? { current: gpsPage, pageSize: 10, total: coordinateList.length, onChange: (p) => setGpsPage(p), showSizeChanger: false, size: 'small' } : false}
              dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
              locale={{ emptyText: 'Chưa có tọa độ GPS nào' }}
              columns={[
                { title: 'STT', width: 60, align: 'center' as const, render: (_v: any, _r: any, idx?: number) => (gpsPage - 1) * 10 + (idx ?? 0) + 1 },
                { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)) },
                { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)) },
                { title: '', width: 50, align: 'center' as const, render: (_v: any, record: any) => (<Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeCoordinate(record._idx)} />) },
              ]}
            />
          )}
        </div>
      ),
    },
    {
      key: 'files',
      label: `File đính kèm (${uploadFileList.length})`,
      children: (
        <div style={drawerFormScrollStyle}>
          <InfrastructureAttachmentTab
            attachments={uploadFileList.map((f: any) => ({
              ...f,
              id: f.uid || f.id,
              fileName: f.name || f.fileName,
              fileSize: f.fileSize ?? f.size ?? f.originFileObj?.size,
              uploadedByName: f.uploadedByName || (f.uploadedBy ? (userMap.get(f.uploadedBy) || f.uploadedBy) : '') || currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
              uploadedDate: f.uploadedDate || f.uploadedAt || f.createdAt || dayjs().toISOString(),
            }))}
            readonly={false}
            userMap={userMap}
            onUpload={(file) => {
              handleBeforeUpload(file);
              return false;
            }}
            onDelete={(uid) => {
              if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
                api.delete(`/v1/documents/${uid}`).catch(() => {});
              }
              setUploadFileList((prev) => prev.filter((x) => (x.uid || (x as any).id) !== uid));
            }}
            onDownload={(_uid, name) => { toast.info(`Đang tải xuống tệp: ${name}`); }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={drawerTabBarStyle} items={formTabs} />

      {/* GIS Location Selector Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
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
          <Button key="ok" type="primary" onClick={() => setGisModalOpen(false)} style={{ ...primaryButtonStyle, height: 36 }}>
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType={watchedGeometryType || 'POINT'}
            height={520}
            onChange={(val) => {
              if (val?.coordinates) {
                const points = parseWktToCoordinates(val.coordinates);
                if (points.length > 0) {
                  setCoordinateList((prev) => {
                    const existing = prev || [];
                    const key = (p: { latitude: number; longitude: number }) => `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                    const existingKeys = new Set(existing
                      .filter(c => c.latD != null && c.lngD != null)
                      .map(c => key({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 })));
                    const toAdd = points.filter(p => !existingKeys.has(key(p))).map(p => {
                      const la = ddToDms(p.latitude);
                      const lo = ddToDms(p.longitude);
                      return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
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
