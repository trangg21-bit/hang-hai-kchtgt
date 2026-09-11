import { useEffect, useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
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
  fontSizeSm, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField,
  surfaceCard, readonlyInputStyle, textAreaStyle,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
} from '../../themetokenchk';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import {
  BEACON_LIGHT_TYPE_OPTIONS,
  type BeaconStation,
} from '../../types/beacon';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { beaconStationCRUD } from '../../services/beaconService';
import { portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import { userService } from '../../services/userService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type { Symbol as MapSymbol } from '../../services/symbolService';
import { useAuthStore } from '../../store/authStore';
import {
  GEOMETRY_POINT_COUNT,
  parseWktToCoordinates,
  validateDmsCoordinates,
  serializeCoordinatesToWkt,
  ddToDms,
} from '../../utils/gisGeometry';
import {
  parseNumber20,
  getValueFromEvent20,
  decimalNumberRule,
  safeNumber,
  safeDecimal,
} from './beaconStationRules';
import { NumberInputWithCount } from '../../components/shared/NumberInputWithCount';

const fontSizeMd = 13.5;

const parseNumber5 = (value: unknown): any => {
  if (!value) return '' as any;
  const digits = String(value).replace(/\D/g, '');
  return (digits.length > 5 ? digits.slice(0, 5) : digits) as any;
};

const getValueFromEvent5 = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).replace(/\D/g, '');
  return str.length > 5 ? Number(str.slice(0, 5)) : Number(str);
};

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

// Style cho thẻ phân nhóm (Section Card) đồng bộ với màn /berth
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

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 0, label: 'Chưa khai thác/vận hành' },
  { value: 1, label: 'Đang khai thác/vận hành' },
  { value: 2, label: 'Dừng khai thác/vận hành' },
];

const OPERATOR_OPTIONS = DEFAULT_OPERATING_ORGANIZATIONS.map((o) => ({ value: o.name, label: o.name }));

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

const dmsUnitStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 3px',
  background: '#f5f5f5',
  border: `1px solid ${borderDefault}`,
  borderLeft: 0,
  borderRight: 0,
  height: 32,
  fontSize: fontSizeSm,
  color: textTertiary,
};

const dmsUnitEndStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 3px',
  background: '#f5f5f5',
  border: `1px solid ${borderDefault}`,
  borderLeft: 0,
  height: 32,
  borderRadius: '0 999px 999px 0',
  fontSize: fontSizeSm,
  color: textTertiary,
};

/** Parse tọa độ từ WKT (POINT/MULTIPOINT/LINESTRING/POLYGON) — dùng chung cho GisLocationSelector (chuẩn /port). */
const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.-]+)\s+([\d.-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* ignore */ }
  return [];
};

/**
 * Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px).
 */
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

export interface BeaconStationFormProps {
  form: any;
  id?: string;
  initialData?: BeaconStation | null;
  onFinish: (saved: boolean) => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export default forwardRef(function BeaconStationForm(
  { form, id, initialData, onFinish, onSubmittingChange }: BeaconStationFormProps,
  ref,
) {
  const isEdit = !!id;
  const [, setSubmitting] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('*') ?? false;

  const watchedGeometryType = Form.useWatch('geometryType', form);

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [seaports, setSeaports] = useState<Array<{ id: string; portName?: string; portCode?: string }>>([]);
  const [symbols, setSymbols] = useState<MapSymbol[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  const [coordinateList, setCoordinateList] = useState<Array<{
    latD: number | null; latM: number | null; latS: number | null;
    lngD: number | null; lngM: number | null; lngS: number | null;
  }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const gisCoordSnapshotRef = useRef<{ coords: any[]; symbolId?: string }>({ coords: [], symbolId: undefined });
  const [codeLoading, setCodeLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);

  // Load catalogs
  useEffect(() => {
    setLoadingOrgs(true);
    organizationService.getTree()
      .then((r) => setOrganizations(r || []))
      .catch(() => {})
      .finally(() => setLoadingOrgs(false));

    portCRUD.findAll()
      .then((r) => setSeaports((r as any)?.data || r || []))
      .catch(() => {});

    symbolService.list({ page: 1, pageSize: 1000, status: 'active' })
      .then((r) => setSymbols(r.data || []))
      .catch(() => {});

    userService.list({ pageSize: 1000 })
      .then((resp) => {
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => { map.set(u.id, u.fullName || u.username || u.id); });
        setUserMap(map);
      })
      .catch(() => {});
  }, []);

  // Set default code & unit for create mode
  useEffect(() => {
    if (!isEdit) {
      setCodeLoading(true);
      beaconStationCRUD.generateCode()
        .then((code) => {
          if (code) form.setFieldsValue({ code });
        })
        .catch(() => {})
        .finally(() => setCodeLoading(false));

      const currentOrgUnitId = currentUser?.orgUnitId;
      if (currentOrgUnitId) {
        form.setFieldsValue({ unitId: currentOrgUnitId });
      } else {
        api.get('/users/me')
          .then((r) => {
            const p = r.data?.data ?? r.data;
            if (p?.orgUnitId) form.setFieldsValue({ unitId: p.orgUnitId });
          })
          .catch(() => {});
      }
    }
  }, [isEdit, form, currentUser]);

  // Load data for edit mode
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const record = initialData || await beaconStationCRUD.findById(id);
        const seedCoords = record.coordinates ? parseWktToCoordinates(record.coordinates) : [];
        const initialCoords = seedCoords.length > 0
          ? seedCoords
          : (record.latitude != null && record.longitude != null
              ? [{ latitude: record.latitude, longitude: record.longitude }]
              : []);

        setCoordinateList(initialCoords.map((c) => {
          const latDms = ddToDms(c.latitude);
          const lngDms = ddToDms(c.longitude);
          return {
            latD: latDms.d, latM: latDms.m, latS: latDms.s,
            lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s,
          };
        }));

        form.setFieldsValue({
          code: record.code,
          name: record.name,
          type: record.type,
          unitId: record.unitId,
          lightRange: record.lightRange,
          towerColor: record.towerColor,
          location: record.location,
          shape: record.shape,
          structure: record.structure,
          towerHeight: record.towerHeight,
          lightHeight: record.lightHeight,
          geographicRange: record.geographicRange,
          backupLightModel: record.backupLightModel,
          powerSupply: record.powerSupply,
          staffCount: record.staffCount,
          stationArea: record.stationArea,
          primaryLightModel: record.primaryLightModel,
          area: record.area,
          lastRepairDate: record.lastRepairDate ? dayjs(record.lastRepairDate) : null,
          commissionedDate: record.commissionedDate ? dayjs(record.commissionedDate) : null,
          provinceId: record.provinceId != null ? Number(record.provinceId) : undefined,
          seaportId: record.seaportId,
          operator: record.operator,
          detailedLocation: record.detailedLocation,
          operationalStatus: record.operationalStatus != null ? record.operationalStatus : 1,
          region: record.region,
          identifyingFeature: record.identifyingFeature,
          note: record.note,
          geometryType: record.geometryType || undefined,
          mapSymbolId: record.mapSymbolId,
          coordinateSystem: record.coordinateSystem || 1,
          displayRule: record.displayRule || 'Độ, phút, giây (DMS)',
        });

        try {
          const files = await beaconStationCRUD.listAttachments(id);
          setUploadedFiles(
            (files || []).map((a: any) => ({
              ...a,
              uid: a.id || a.uid,
              name: a.fileName || a.name,
              fileName: a.fileName || a.name,
              size: a.fileSize ?? a.size,
              fileSize: a.fileSize ?? a.size,
              fileType: a.fileType ?? a.contentType,
              uploadedByName: a.uploadedByName || (a.uploadedBy ? (userMap.get(a.uploadedBy) || a.uploadedBy) : '') || 'Cán bộ quản lý',
              uploadedBy: a.uploadedBy,
              uploadedDate: a.uploadedDate || a.uploadedAt || a.createdAt,
              uploadedAt: a.uploadedAt || a.uploadedDate || a.createdAt,
              status: 'done' as const,
            }))
          );
        } catch {
          setUploadedFiles([]);
        }
      } catch {
        toast.error('Không thể tải thông tin đèn biển');
      }
    })();
  }, [isEdit, id, initialData, form, userMap]);

  // Adjust coordinate list when geometry type changes
  useEffect(() => {
    if (!watchedGeometryType) {
      form.setFieldsValue({ mapSymbolId: undefined, coordinateSystem: undefined, displayRule: undefined });
      form.setFields([{ name: 'mapSymbolId', errors: [] }]);
      setCoordinateList([]);
      setGpsError(null);
      return;
    }
    form.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
    setCoordinateList((prev) => {
      if (!prev || prev.length === 0) {
        return Array.from({ length: count }, () => ({
          latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null,
        }));
      }
      if (watchedGeometryType === 'POINT') {
        return prev.slice(0, 1);
      }
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }, () => ({
          latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null,
        }));
        return [...prev, ...added];
      }
      return prev;
    });
  }, [watchedGeometryType, form]);

  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File vượt quá 20MB');
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
      toast.error('Định dạng file không hỗ trợ');
      return false;
    }
    if (uploadedFiles.length >= 10) {
      toast.error('Số lượng tệp đính kèm tối đa là 10 tệp');
      return false;
    }
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
        originFileObj: file as any,
      },
    ]);
    return false;
  };

  const removeCoordinate = (i: number) => {
    setCoordinateList((p) => p.filter((_, idx) => idx !== i));
    setGpsError(null);
  };

  const addGpsPoint = () => {
    setCoordinateList((p) => [...p, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
    setGpsError(null);
  };

  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setCoordinateList((p) => {
      const n = [...p];
      n[i] = {
        ...n[i],
        [field === 'lat' ? 'latD' : 'lngD']: dVal,
        [field === 'lat' ? 'latM' : 'lngM']: mVal,
        [field === 'lat' ? 'latS' : 'lngS']: sVal,
      };
      return n;
    });
    setGpsError(null);
  };

  const handleSave = useCallback(async (action: 'draft' | 'submit' | 'approved') => {
    let values: any;
    try {
      values = await form.validateFields();
    } catch (e: any) {
      const errFields: Array<{ name: Array<string | number>; errors?: string[] }> = e?.errorFields ?? [];
      const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc (*)';
      toast.error(firstError);
      if (errFields.some((f) => f.name[0] === 'geometryType' || f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule')) {
        setActiveTabKey('location');
      } else {
        setActiveTabKey('general');
      }
      return;
    }

    // Validate GPS Coordinates
    const coordResult = validateDmsCoordinates(coordinateList, values.geometryType);
    if (!coordResult.valid) {
      const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
      toast.error(errMsg);
      setGpsError(errMsg);
      setActiveTabKey('location');
      return;
    }
    const validCoords = coordResult.validCoords;
    const coordinatesWkt = serializeCoordinatesToWkt(validCoords, values.geometryType || 'POINT');

    setSubmitting(true);
    onSubmittingChange?.(true);

    try {
      const toDate = (v: any) => (v ? (dayjs.isDayjs(v) ? v.toISOString() : String(v)) : undefined);
      const stationCode = values.code ? String(values.code).trim() : (isEdit ? undefined : await beaconStationCRUD.generateCode());
      const payload: any = {
        action,
        code: stationCode || undefined,
        name: values.name ? String(values.name).trim() : undefined,
        type: values.type,
        lightRange: safeDecimal(values.lightRange),
        towerColor: values.towerColor,
        location: values.location,
        shape: values.shape,
        structure: values.structure,
        towerHeight: safeDecimal(values.towerHeight),
        lightHeight: safeDecimal(values.lightHeight),
        geographicRange: values.geographicRange,
        backupLightModel: values.backupLightModel,
        powerSupply: values.powerSupply,
        staffCount: values.staffCount != null ? Number(values.staffCount) : undefined,
        stationArea: safeDecimal(values.stationArea),
        primaryLightModel: values.primaryLightModel,
        area: safeDecimal(values.area),
        lastRepairDate: toDate(values.lastRepairDate),
        commissionedDate: toDate(values.commissionedDate),
        unitId: values.unitId,
        provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
        seaportId: values.seaportId,
        operator: values.operator,
        detailedLocation: values.detailedLocation,
        operationalStatus: values.operationalStatus != null ? Number(values.operationalStatus) : undefined,
        region: values.region,
        identifyingFeature: values.identifyingFeature,
        note: values.note,
        geometryType: values.geometryType || undefined,
        mapSymbolId: values.mapSymbolId || undefined,
        coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule || undefined,
        coordinates: coordinatesWkt || undefined,
        latitude: validCoords.length > 0 ? validCoords[0].latitude : undefined,
        longitude: validCoords.length > 0 ? validCoords[0].longitude : undefined,
      };

      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
      });

      let targetId: string | undefined;
      if (isEdit && id) {
        const updated = await beaconStationCRUD.update(id, payload);
        targetId = id;
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = updated;
        }
        toast.success(action === 'submit' ? 'Đã cập nhật và gửi phê duyệt đèn biển' : action === 'approved' ? 'Đã cập nhật và phê duyệt đèn biển' : 'Đã cập nhật đèn biển');
      } else {
        const created = await beaconStationCRUD.create(payload);
        targetId = created.id;
        toast.success(action === 'submit' ? 'Đã gửi phê duyệt đèn biển' : action === 'approved' ? 'Đã phê duyệt đèn biển' : 'Đã lưu tạm đèn biển');
      }

      const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
      if (targetId && newFiles.length > 0) {
        try {
          await beaconStationCRUD.uploadAttachments(targetId, newFiles);
        } catch {
          /* ignore attachment upload error */
        }
      }

      onFinish(true);
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  }, [form, coordinateList, isEdit, id, uploadedFiles, onFinish, onSubmittingChange]);

  useImperativeHandle(ref, () => ({
    submit: (action: 'draft' | 'submit' | 'approved') => handleSave(action),
  }), [handleSave]);

  const tabItems = [
    // Tab 1: Thông tin chung
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
                <Form.Item name="unitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}>
                  <OrgUnitTreeSelect
                    organizations={organizations}
                    placeholder="Chọn đơn vị quản lý..."
                    loading={loadingOrgs}
                    disabled={isEdit && !isSystemAdmin}
                    treeDefaultExpandAll={false}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="seaportId" {...labelProps('Thuộc cảng biển')} style={{ marginBottom: spaceFormField }}>
                  <Select
                    placeholder="Chọn cảng biển..."
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={seaports.map((p) => ({ value: p.id, label: p.portName || p.portCode || p.id }))}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="code" {...labelProps('Mã đèn biển')} style={{ marginBottom: spaceFormField }} tooltip="Mã đèn biển được sinh tự động">
                  <Input disabled placeholder={codeLoading ? 'Đang sinh mã...' : 'Mã tự sinh (DBNT-XXXXXX)'} style={readonlyInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="name" {...labelProps('Tên đèn biển')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tên đèn biển không được để trống' }, { max: 200, message: 'Tối đa 200 ký tự' }]}>
                  <Input placeholder="Nhập tên đèn biển..." maxLength={200} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="operator" {...labelProps('Đơn vị vận hành')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn đơn vị vận hành..." allowClear showSearch optionFilterProp="label" options={OPERATOR_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operationalStatus" {...labelProps('Tình trạng')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]} initialValue={0}>
                  <Select placeholder="Chọn tình trạng..." allowClear options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="provinceId" {...labelProps('Địa điểm Tỉnh/TP')} style={{ marginBottom: spaceFormField }}>
                  <Select
                    placeholder="Chọn tỉnh/thành phố..."
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    options={VIETNAM_PROVINCE_OPTIONS}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập địa điểm chi tiết..." maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 2: Thông tin kỹ thuật đèn biển ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <SlidersOutlined style={{ color: actionPrimary }} />
                <span>Thông tin kỹ thuật đèn biển</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="type" {...labelProps('Cấp trạm đèn')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn cấp trạm đèn' }]}>
                  <Select placeholder="Chọn cấp trạm đèn..." options={BEACON_LIGHT_TYPE_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="primaryLightModel" {...labelProps('Chủng loại đèn chính')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập chủng loại đèn chính..." maxLength={100} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="backupLightModel" {...labelProps('Chủng loại đèn dự phòng')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập chủng loại đèn dự phòng..." maxLength={100} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lightRange"
                  {...labelProps('Tầm hiệu lực ánh sáng (hải lý)')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Vui lòng nhập tầm hiệu lực' }, decimalNumberRule]}
                  getValueFromEvent={getValueFromEvent20}
                >
                  <NumberInputWithCount min={0.01} step={0.01} placeholder="0" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="region" {...labelProps('Địa bàn')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập địa bàn..." maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="identifyingFeature" {...labelProps('Đặc điểm nhận dạng')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập đặc điểm nhận dạng..." maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="shape" {...labelProps('Hình dạng')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập hình dạng..." maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="powerSupply" {...labelProps('Nguồn năng lượng')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập nguồn năng lượng..." maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="towerHeight"
                  {...labelProps('Chiều cao tháp đèn (m)')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[decimalNumberRule]}
                  getValueFromEvent={getValueFromEvent20}
                >
                  <NumberInputWithCount min={0} step={0.01} placeholder="0" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lightHeight"
                  {...labelProps('Chiều cao tâm sáng (m)')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[decimalNumberRule]}
                  getValueFromEvent={getValueFromEvent20}
                >
                  <NumberInputWithCount min={0} step={0.01} placeholder="0" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="towerColor" {...labelProps('Màu sắc tháp đèn')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập màu sắc tháp đèn' }]}>
                  <Input placeholder="Nhập màu sắc tháp đèn..." maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="geographicRange" {...labelProps('Tầm hiệu lực địa lý')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập tầm hiệu lực địa lý..." maxLength={20} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="commissionedDate" {...labelProps('Thời điểm đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}>
                  <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="lastRepairDate" {...labelProps('Thời điểm sửa chữa gần nhất')} style={{ marginBottom: spaceFormField }}>
                  <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 3: Thông tin nhà trạm gắn với đèn biển ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <FileTextOutlined style={{ color: actionPrimary }} />
                <span>Thông tin nhà trạm gắn với đèn biển</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="location" {...labelProps('Địa điểm đặt trạm đèn')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập địa điểm đặt trạm đèn..." maxLength={1000} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="note" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập ghi chú..." maxLength={1000} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="structure" {...labelProps('Kết cấu')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={3} placeholder="Nhập kết cấu..." maxLength={2000} showCount style={{ ...textAreaStyle, fontSize: 13.5 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="area"
                  {...labelProps('Diện tích (m²)')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[decimalNumberRule]}
                  getValueFromEvent={getValueFromEvent20}
                >
                  <NumberInputWithCount min={0} step={0.01} placeholder="0" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="stationArea"
                  {...labelProps('Diện tích sử dụng trạm đèn (m²)')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[decimalNumberRule]}
                  getValueFromEvent={getValueFromEvent20}
                >
                  <NumberInputWithCount min={0} step={0.01} placeholder="0" style={numberInputStyle} maxLength={20} parser={parseNumber20} formatter={fmtInputNumber} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="staffCount"
                  {...labelProps('Số lượng nhân sự bố trí')}
                  style={{ marginBottom: spaceFormField }}
                  getValueFromEvent={getValueFromEvent5}
                >
                  <NumberInputWithCount
                    min={0}
                    step={1}
                    precision={0}
                    placeholder="0"
                    style={numberInputStyle}
                    maxLength={5}
                    parser={parseNumber5}
                  />
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
                <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="mapSymbolId"
                  {...labelProps('Biểu tượng')}
                  required={!!watchedGeometryType}
                  rules={
                    watchedGeometryType
                      ? [{ required: true, message: 'Vui lòng chọn biểu tượng' }]
                      : []
                  }
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select placeholder="Chọn biểu tượng bản đồ" allowClear showSearch optionFilterProp="label" disabled={!watchedGeometryType} style={selectStyle}>
                    {symbols.map((sym) => (
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
              <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                Tọa độ GPS ({coordinateList.length})
              </span>
              <Space size={8}>
                <Button
                  icon={<EnvironmentOutlined style={{ color: !watchedGeometryType ? undefined : actionPrimary }} />}
                  onClick={() => {
                    gisCoordSnapshotRef.current = {
                      coords: coordinateList.map((c) => ({ ...c })),
                      symbolId: form.getFieldValue('mapSymbolId'),
                    };
                    setGisModalOpen(true);
                  }}
                  disabled={!watchedGeometryType}
                  style={!watchedGeometryType ? {
                    height: 32,
                    fontSize: 13.5,
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
                    fontSize: 13.5,
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
                    fontSize: 13.5,
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
                    fontSize: 13.5,
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
                      width: 50,
                      align: 'center' as const,
                      render: (_v: any, _r: any, idx: number) => idx + 1,
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
            const fileItem = uploadedFiles.find((x: any) => (x.uid || x.id) === uid);
            const rawFile = fileItem?.originFileObj || (fileItem as any)?.file;
            if (rawFile) {
              const url = window.URL.createObjectURL(rawFile);
              const a = document.createElement('a');
              a.href = url;
              a.download = name || (rawFile as File).name || 'attachment';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
              return;
            }

            if (isEdit && id) {
              try {
                const blob = await beaconStationCRUD.downloadAttachment(id, uid);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = name || 'attachment';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              } catch {
                toast.error('Không thể tải xuống tệp đính kèm');
              }
            } else {
              toast.error('Không tìm thấy tệp để tải xuống');
            }
          }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: fontSizeLg, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span>Chọn vị trí & tọa độ trên bản đồ chuyên dụng</span>
          </div>
        }
        open={gisModalOpen}
        onCancel={() => {
          setCoordinateList(gisCoordSnapshotRef.current.coords);
          form.setFieldValue('mapSymbolId', gisCoordSnapshotRef.current.symbolId);
          setGisModalOpen(false);
        }}
        destroyOnClose
        width="94vw"
        style={{ maxWidth: 1400, top: 20 }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setCoordinateList(gisCoordSnapshotRef.current.coords);
              form.setFieldValue('mapSymbolId', gisCoordSnapshotRef.current.symbolId);
              setGisModalOpen(false);
            }}
            style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}
          >
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={() => setGisModalOpen(false)}
            style={{ ...primaryButtonStyle, height: 36, borderRadius: radiusPill }}
          >
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ height: 520, borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType={(watchedGeometryType as any) || 'POINT'}
            height={520}
            value={{
              geometryType: (watchedGeometryType as any) || 'POINT',
              coordinates: (() => {
                const valid = coordinateList
                  .filter((c) => c.latD != null && c.latM != null && c.latS != null && c.lngD != null && c.lngM != null && c.lngS != null)
                  .map((c) => ({
                    latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
                    longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
                  }));
                return serializeCoordinatesToWkt(valid, watchedGeometryType || 'POINT');
              })(),
              symbolId: form.getFieldValue('mapSymbolId') || undefined,
            }}
            onChange={(val: any) => {
              if (val?.symbolId) form.setFieldValue('mapSymbolId', val.symbolId);
              const points = parseGisCoordinates(val);
              if (points.length > 0) {
                if (watchedGeometryType === 'POINT') {
                  const p = points[0];
                  const latDms = ddToDms(p.latitude);
                  const lngDms = ddToDms(p.longitude);
                  setCoordinateList([{
                    latD: latDms.d, latM: latDms.m, latS: latDms.s,
                    lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s,
                  }]);
                } else {
                  setCoordinateList((prev) => {
                    const toDms = (p: { latitude: number; longitude: number }) => {
                      const lat = ddToDms(p.latitude);
                      const lng = ddToDms(p.longitude);
                      return { latD: lat.d, latM: lat.m, latS: lat.s, lngD: lng.d, lngM: lng.m, lngS: lng.s };
                    };
                    const newRows = points.map(toDms);
                    const merged = [...prev];
                    let newIdx = 0;
                    const isFilled = (r: any) => r.latD != null || r.latM != null || r.latS != null || r.lngD != null || r.lngM != null || r.lngS != null;
                    for (let i = 0; i < merged.length && newIdx < newRows.length; i++) {
                      if (!isFilled(merged[i])) {
                        merged[i] = newRows[newIdx++];
                      }
                    }
                    while (newIdx < newRows.length) {
                      merged.push(newRows[newIdx++]);
                    }
                    return merged;
                  });
                }
                setGpsError(null);
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
});
