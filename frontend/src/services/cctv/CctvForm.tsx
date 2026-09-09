import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Space, DatePicker, Modal,
} from 'antd';
import type { FormInstance, UploadFile } from 'antd';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
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
  textAreaStyle,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import api from '../api';
import toast from '../../components/ToastNotification';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../operatingOrganizationsData';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService, type Organization } from '../organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { symbolService } from '../symbolService';
import { userService } from '../userService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type { Symbol as MapSymbol } from '../symbolService';
import { useAuthStore } from '../../store/authStore';
import {
  GEOMETRY_POINT_COUNT, parseWktToCoordinates, validateDmsCoordinates, serializeCoordinatesToWkt,
  type DmsCoordinateItem,
} from '../../utils/gisGeometry';
import {
  fetchCctvById, createCctv, updateCctv, generateCctvCode, submitCctv,
  fetchCctvAttachments, uploadCctvAttachment, deleteCctvAttachment, downloadCctvAttachment,
  type CctvAttachmentResponse,
} from './api';
import type { CctvResponse, CreateCctvRequest, UpdateCctvRequest } from './types';

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

// Style cho thẻ phân nhóm (Section Card) đồng bộ chuẩn /berth
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

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 0, label: 'Chưa khai thác/vận hành' },
  { value: 1, label: 'Đang khai thác/vận hành' },
  { value: 2, label: 'Dừng khai thác/vận hành' },
];

const ATTACHED_INFRA_TYPE_OPTIONS = [
  { value: 1, label: 'Trung Tâm Điều Hành VTS' },
  { value: 2, label: 'Trạm Radar' },
];

const UNIT_OF_MEASURE_OPTIONS = [
  { label: 'Bộ', value: 1 },
  { label: 'Bến', value: 2 },
  { label: 'Bản quyền', value: 3 },
  { label: 'Chiếc', value: 4 },
  { label: 'Cổng', value: 5 },
  { label: 'Cái', value: 6 },
  { label: 'Cột', value: 7 },
  { label: 'Cầu', value: 8 },
  { label: 'Đường truyền', value: 9 },
  { label: 'Héc-ta', value: 10 },
  { label: 'Hạng mục', value: 11 },
  { label: 'Hệ thống', value: 12 },
  { label: 'Kho', value: 13 },
  { label: 'Khu', value: 14 },
  { label: 'Ki-lô-mét', value: 15 },
  { label: 'Mét', value: 16 },
  { label: 'Mét vuông', value: 17 },
  { label: 'Nhà', value: 18 },
  { label: 'Phòng', value: 19 },
  { label: 'Phân hệ', value: 20 },
  { label: 'Quả', value: 21 },
  { label: 'Tuyến', value: 22 },
  { label: 'Tấn', value: 23 },
  { label: 'Trạm', value: 24 },
  { label: 'Tháp', value: 25 },
  { label: 'Trụ', value: 26 },
  { label: 'VNĐ', value: 27 },
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

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px) */
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

export type CctvSaveAction = 'DRAFT' | 'SUBMIT' | 'APPROVED' | 'UPDATE';

export interface CctvFormProps {
  form: FormInstance;
  id?: string;
  onFinish: (saved: boolean) => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export interface CctvFormRef {
  submit: (saveAction: CctvSaveAction) => Promise<void>;
}

export default forwardRef(function CctvForm({ form, id, onFinish, onSubmittingChange }: CctvFormProps, ref) {
  const isEdit = !!id;
  const [, setSubmitting] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [deviceCodeLoading, setDeviceCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('*') ?? false;

  const watchedGeometryType = Form.useWatch('geometryType', form);
  const watchedAttachedType = Form.useWatch('attachedInfrastructureType', form);

  /** true khi field đã đạt đủ max ký tự — bật viền đỏ ô nhập + message bên dưới */
  const useMaxReached = (name: string, max: number): boolean => {
    const raw = Form.useWatch(name, form) ?? '';
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };

  const atMax = {
    deviceName: useMaxReached('deviceName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    model: useMaxReached('model', 255),
    manufacturer: useMaxReached('manufacturer', 50),
    specifications: useMaxReached('specifications', 2000),
    maintenanceInformation: useMaxReached('maintenanceInformation', 2000),
    note: useMaxReached('note', 2000),
  };

  const [orgUnits, setOrgUnits] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [loadingOperatingOrgs, setLoadingOperatingOrgs] = useState(false);

  // Danh sách trạm radar và trung tâm VTS cho dependent dropdown
  const [radarStationOptions, setRadarStationOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingRadars, setLoadingRadars] = useState(false);
  const [vtsOperationCenterOptions, setVtsOperationCenterOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingVtsCenters, setLoadingVtsCenters] = useState(false);

  const [symbols, setSymbols] = useState<MapSymbol[]>([]);
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());
  const [coordinateList, setCoordinateList] = useState<DmsCoordinateItem[]>([]);
  const hasCoordinates = coordinateList.some((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null));
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [, setExistingFiles] = useState<CctvAttachmentResponse[]>([]);

  // Load danh mục
  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => {
      const list = r.data || [];
      setSymbols(list);
      const imgMap = new Map<string, string>();
      list.forEach((s: any) => {
        if (s.id && s.iconImage) imgMap.set(s.id, s.iconImage);
      });
      setSymbolImageMap(imgMap);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingOrgs(true);
    organizationService.list({ pageSize: 1000 }).then(r => setOrgUnits(r.data || [])).catch(() => {}).finally(() => setLoadingOrgs(false));
  }, []);

  useEffect(() => {
    setLoadingOperatingOrgs(true);
    api.get('/common/options/operating-organizations').then(r => {
      const list = r.data?.data;
      if (Array.isArray(list) && list.length > 0) setOperatingOrgs(list);
    }).catch(() => {}).finally(() => setLoadingOperatingOrgs(false));
  }, []);

  useEffect(() => {
    setLoadingRadars(true);
    api.get('/common/options/radar-stations').then(r => {
      const items = r.data?.data;
      setRadarStationOptions((Array.isArray(items) ? items : []).map((s: { id: string; stationName?: string; name?: string; code?: string }) => ({
        label: s.stationName || s.name || s.code || s.id,
        value: s.id,
      })));
    }).catch(() => {}).finally(() => setLoadingRadars(false));
  }, []);

  useEffect(() => {
    setLoadingVtsCenters(true);
    api.get('/common/options/vts-operation-centers').then(r => {
      const items = r.data?.data;
      setVtsOperationCenterOptions((Array.isArray(items) ? items : []).map((s: { id: string; name?: string; code?: string }) => ({
        label: s.name || s.code || s.id,
        value: s.id,
      })));
    }).catch(() => {}).finally(() => setLoadingVtsCenters(false));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as unknown as { content?: Array<{ id: string; fullName?: string; username?: string }> }).content || [];
        const map = new Map<string, string>();
        users.forEach((u: { id: string; fullName?: string; username?: string }) => {
          map.set(u.id, u.fullName || u.username || u.id);
        });
        setUserMap(map);
      } catch { /* silent */ }
    })();
  }, []);

  // Mode Thêm mới: sinh trước mã thiết bị & set đơn vị mặc định
  useEffect(() => {
    if (!isEdit) {
      setDeviceCodeLoading(true);
      generateCctvCode()
        .then((code) => { if (code) form.setFieldsValue({ deviceCode: code }); })
        .catch(() => {})
        .finally(() => setDeviceCodeLoading(false));

      if (!isSystemAdmin) {
        api.get('/users/me').then(r => {
          const p = r.data?.data ?? r.data;
          if (p?.orgUnitId) form.setFieldsValue({ orgUnitId: p.orgUnitId });
        }).catch(() => {});
      }
    }
  }, [isEdit, isSystemAdmin, form]);

  // Khi chọn Loại đối tượng → tự set hệ quy chiếu, quy tắc hiển thị và số dòng tọa độ tương ứng
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
  }, [watchedGeometryType, form]);

  // Edit mode: load dữ liệu bản ghi hiện tại
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data: CctvResponse = await fetchCctvById(id);
        const pts = parseWktToCoordinates(data.coordinates || undefined);
        setCoordinateList(pts.length > 0 ? pts.map(c => {
          const latDms = ddToDms(c.latitude);
          const lngDms = ddToDms(c.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        }) : []);

        try {
          const attList = await fetchCctvAttachments(id);
          const files: UploadFile[] = (attList || []).map((a) => ({
            uid: a.id,
            name: a.fileName,
            fileName: a.fileName,
            size: a.fileSize,
            status: 'done' as const,
          }));
          setExistingFiles(attList || []);
          setUploadedFiles(files);
        } catch {
          setExistingFiles([]);
          setUploadedFiles([]);
        }

        form.setFieldsValue({
          deviceCode: data.deviceCode,
          deviceName: data.deviceName,
          orgUnitId: data.orgUnitId,
          operatingUnitId: data.operatingUnitId,
          attachedInfrastructureType: data.attachedInfrastructureType,
          attachedInfrastructureId: data.attachedInfrastructureId,
          provinceName: data.provinceName,
          detailedLocation: data.detailedLocation,
          unitOfMeasure: data.unitOfMeasure,
          quantity: data.quantity,
          yearOfUse: data.yearOfUse,
          operationalStatus: data.operationalStatus != null ? (() => {
            switch (data.operationalStatus) {
              case 'NOT_YET_OPERATIONAL': return 0;
              case 'OPERATIONAL': return 1;
              case 'SUSPENDED': return 2;
              default: {
                const num = Number(data.operationalStatus);
                return num >= 0 && num <= 2 ? num : 1;
              }
            }
          })() : 1,
          model: data.model,
          manufacturer: data.manufacturer,
          specifications: data.specifications,
          maintenanceInformation: data.maintenanceInformation,
          note: data.note,
          geometryType: data.geometryType || undefined,
          mapSymbolId: data.mapSymbolId,
          coordinateSystem: data.coordinateSystem ?? 1,
          displayRule: 'Độ, phút, giây (DMS)',
        });
      } catch {
        toast.error('Không thể tải thông tin hệ thống CCTV');
      }
    })();
  }, [isEdit, id, form]);

  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
      toast.error('Định dạng không hỗ trợ'); return false;
    }
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
        type: file.type,
        uploadedByName: uploaderName,
        uploadedBy: currentUser?.userId || currentUser?.id || uploaderName,
        uploadedDate: nowIso,
        uploadedAt: nowIso,
        createdAt: nowIso,
        status: 'done',
        originFileObj: file as unknown as UploadFile['originFileObj'],
      },
    ]);
    return false;
  };

  const removeCoordinate = (i: number) => { setCoordinateList(p => p.filter((_, idx) => idx !== i)); setGpsError(null); };
  const addGpsPoint = () => { setCoordinateList(p => [...p, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]); setGpsError(null); };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setCoordinateList(p => {
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

  const handleOrgUnitChange = () => {
    // Giữ tọa độ hoặc reset khi cần
  };

  const handleSave = useCallback(async (saveAction: CctvSaveAction) => {
    const values = form.getFieldsValue();
    try {
      await form.validateFields();
    } catch (e: unknown) {
      const err = e as { errorFields?: Array<{ name: Array<string | number>; errors?: string[] }> };
      const errFields = err?.errorFields ?? [];
      const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc (*)';
      toast.error(firstError);
      if (errFields.some((f) => f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule' || f.name[0] === 'geometryType')) {
        setActiveTabKey('location');
      } else {
        setActiveTabKey('general');
      }
      return;
    }

    if (values.operationalStatus === undefined || values.operationalStatus === null) {
      toast.error('Tình trạng hoạt động là bắt buộc');
      setActiveTabKey('general');
      return;
    }

    // Kiểm tra chéo giữa Loại đối tượng và Biểu tượng / Tọa độ (chuẩn VTS CHK /berth)
    if (hasCoordinates && !values.geometryType) {
      toast.error('Loại đối tượng là bắt buộc khi có tọa độ');
      setActiveTabKey('location');
      return;
    }
    if (hasLocation && !values.mapSymbolId) {
      toast.error('Biểu tượng bản đồ là bắt buộc');
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
      const currentAction = saveAction === 'DRAFT' ? 'draft' : saveAction === 'APPROVED' ? 'approve' : 'submit';
      const payload: Record<string, unknown> = {
        deviceCode: String(values.deviceCode || '').trim() || (isEdit ? undefined : await generateCctvCode()),
        deviceName: String(values.deviceName || '').trim(),
        orgUnitId: values.orgUnitId || undefined,
        operatingUnitId: values.operatingUnitId || undefined,
        attachedInfrastructureType: values.attachedInfrastructureType != null ? Number(values.attachedInfrastructureType) : undefined,
        attachedInfrastructureId: values.attachedInfrastructureId || undefined,
        provinceName: values.provinceName || undefined,
        detailedLocation: values.detailedLocation || undefined,
        unitOfMeasure: values.unitOfMeasure != null ? Number(values.unitOfMeasure) : undefined,
        quantity: values.quantity != null ? Number(values.quantity) : undefined,
        yearOfUse: values.yearOfUse != null ? Number(values.yearOfUse) : undefined,
        operationalStatus: values.operationalStatus != null ? String(values.operationalStatus) : undefined,
        model: values.model || undefined,
        manufacturer: values.manufacturer || undefined,
        specifications: values.specifications || undefined,
        maintenanceInformation: values.maintenanceInformation || undefined,
        note: values.note || undefined,
        geometryType: values.geometryType || undefined,
        coordinates: wktCoordinates || undefined,
        mapSymbolId: values.mapSymbolId || undefined,
        coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null ? Number(values.displayRule) || null : undefined,
      };

      let targetId: string;
      if (isEdit && id) {
        targetId = id;
        await updateCctv({
          id,
          ...payload,
          ...(saveAction === 'APPROVED' ? { approvalStatus: 'APPROVED' } : {}),
        } as unknown as UpdateCctvRequest);
        if (saveAction === 'SUBMIT') {
          await submitCctv(id);
        }
      } else {
        const res = await createCctv({
          ...payload,
          action: currentAction,
        } as unknown as CreateCctvRequest);
        targetId = res.id;
      }

      // Upload file đính kèm mới nếu có
      if (targetId && uploadedFiles.length > 0) {
        for (const fi of uploadedFiles) {
          const of = fi.originFileObj as File;
          if (!of) continue;
          await uploadCctvAttachment(targetId, of).catch(() => {});
        }
      }

      toast.success(
        saveAction === 'DRAFT'
          ? 'Lưu tạm thành công'
          : saveAction === 'APPROVED'
            ? 'Phê duyệt thành công'
            : isEdit && saveAction === 'UPDATE'
              ? 'Cập nhật thành công'
              : 'Lưu và gửi phê duyệt thành công'
      );
      onFinish(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
      onSubmittingChange?.(false);
    }
  }, [form, coordinateList, isEdit, id, uploadedFiles, onSubmittingChange, onFinish, hasCoordinates, hasLocation]);

  const tabItems = [
    // Tab 1: Thông tin chung (đồng bộ cấu trúc 3 Section Cards như màn /berth)
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
                <Form.Item name="deviceCode" {...labelProps('Mã thiết bị')} style={{ marginBottom: spaceFormField }} tooltip="Mã thiết bị được sinh tự động">
                  <Input disabled placeholder={deviceCodeLoading ? 'Đang sinh mã...' : 'Mã tự động'} style={readonlyInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="deviceName"
                  {...labelProps('Tên thiết bị')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[
                    { required: true, message: 'Tên thiết bị không được để trống' },
                    { max: 255, message: 'Tối đa 255 ký tự' },
                  ]}
                  validateStatus={atMax.deviceName ? 'error' : undefined}
                  help={atMax.deviceName ? 'Đã đạt tối đa 255 ký tự' : undefined}
                >
                  <Input placeholder="Nhập tên thiết bị" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="orgUnitId"
                  {...labelProps('Đơn vị quản lý')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}
                >
                  <OrgUnitTreeSelect
                    organizations={orgUnits}
                    placeholder="Chọn đơn vị quản lý..."
                    loading={loadingOrgs}
                    disabled={isEdit || !isSystemAdmin}
                    showPath
                    treeDefaultExpandAll={false}
                    onChange={handleOrgUnitChange}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operatingUnitId" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}>
                  <Select
                    showSearch
                    placeholder="Chọn đơn vị khai thác..."
                    loading={loadingOperatingOrgs}
                    options={operatingOrgs.map(o => ({ label: o.name || o.code, value: o.id }))}
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    allowClear
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="attachedInfrastructureType"
                  {...labelProps('Thuộc loại hạ tầng')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Loại hạ tầng là bắt buộc' }]}
                >
                  <Select
                    placeholder="Chọn loại hạ tầng..."
                    options={ATTACHED_INFRA_TYPE_OPTIONS}
                    style={selectStyle}
                    onChange={() => {
                      form.setFieldValue('attachedInfrastructureId', undefined);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="attachedInfrastructureId"
                  {...labelProps('Thuộc hạ tầng')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Hạ tầng phụ thuộc là bắt buộc' }]}
                >
                  <Select
                    placeholder={
                      watchedAttachedType === 2
                        ? 'Chọn trạm Radar...'
                        : watchedAttachedType === 1
                          ? 'Chọn Trung Tâm Điều Hành VTS...'
                          : 'Chọn loại hạ tầng trước'
                    }
                    options={
                      watchedAttachedType === 1
                        ? vtsOperationCenterOptions
                        : watchedAttachedType === 2
                          ? radarStationOptions
                          : []
                    }
                    loading={watchedAttachedType === 1 ? loadingVtsCenters : watchedAttachedType === 2 ? loadingRadars : false}
                    disabled={watchedAttachedType !== 1 && watchedAttachedType !== 2}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="provinceName" {...labelProps('Địa điểm (Tỉnh/TP)')} style={{ marginBottom: spaceFormField }}>
                  <Select
                    placeholder="Chọn tỉnh/thành phố..."
                    options={VIETNAM_PROVINCES.map(p => ({ label: p, value: p }))}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    allowClear
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="detailedLocation"
                  {...labelProps('Địa điểm chi tiết')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}
                  validateStatus={atMax.detailedLocation ? 'error' : undefined}
                  help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}
                >
                  <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 2: Thông số kỹ thuật & Vận hành ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <SlidersOutlined style={{ color: actionPrimary }} />
                <span>Thông số kỹ thuật & Vận hành</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="unitOfMeasure" {...labelProps('Đơn vị tính')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn đơn vị tính..." options={UNIT_OF_MEASURE_OPTIONS} showSearch optionFilterProp="label" allowClear style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  {...labelProps('Số lượng')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[
                    { required: true, message: 'Số lượng là bắt buộc' },
                    { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' },
                  ]}
                >
                  <InputNumber min={1} placeholder="0" controls={false} style={numberInputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="yearOfUse"
                  {...labelProps('Năm đưa vào sử dụng')}
                  style={{ marginBottom: spaceFormField }}
                  getValueProps={(v: number | null | undefined) => ({ value: v != null && !Number.isNaN(Number(v)) ? dayjs().year(Number(v)) : null })}
                  getValueFromEvent={(d: { year?: () => number } | null) => (d && typeof d.year === 'function' ? d.year() : null)}
                >
                  <DatePicker picker="year" format="YYYY" placeholder="Chọn năm đưa vào sử dụng" style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="operationalStatus"
                  {...labelProps('Tình trạng hoạt động')}
                  style={{ marginBottom: spaceFormField }}
                  initialValue={1}
                  rules={[{ required: true, message: 'Tình trạng hoạt động là bắt buộc' }]}
                >
                  <Select placeholder="Chọn tình trạng..." options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="model"
                  {...labelProps('Model')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ max: 255, message: 'Tối đa 255 ký tự' }]}
                  validateStatus={atMax.model ? 'error' : undefined}
                  help={atMax.model ? 'Đã đạt tối đa 255 ký tự' : undefined}
                >
                  <Input placeholder="Nhập model" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="manufacturer"
                  {...labelProps('Hãng sản xuất')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ max: 50, message: 'Tối đa 50 ký tự' }]}
                  validateStatus={atMax.manufacturer ? 'error' : undefined}
                  help={atMax.manufacturer ? 'Đã đạt tối đa 50 ký tự' : undefined}
                >
                  <Input placeholder="Nhập hãng sản xuất" maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  name="specifications"
                  {...labelProps('Thông số kỹ thuật')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ max: 2000, message: 'Tối đa 2000 ký tự' }]}
                  validateStatus={atMax.specifications ? 'error' : undefined}
                  help={atMax.specifications ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                >
                  <Input.TextArea rows={3} placeholder="Nhập thông số kỹ thuật..." maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 3: Thông tin bảo trì & Ghi chú ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <FileTextOutlined style={{ color: actionPrimary }} />
                <span>Thông tin bảo trì & Ghi chú</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  name="maintenanceInformation"
                  {...labelProps('Thông tin bảo trì')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ max: 2000, message: 'Tối đa 2000 ký tự' }]}
                  validateStatus={atMax.maintenanceInformation ? 'error' : undefined}
                  help={atMax.maintenanceInformation ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                >
                  <Input.TextArea rows={3} placeholder="Nhập thông tin bảo trì..." maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  name="note"
                  {...labelProps('Ghi chú')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ max: 2000, message: 'Tối đa 2000 ký tự' }]}
                  validateStatus={atMax.note ? 'error' : undefined}
                  help={atMax.note ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                >
                  <Input.TextArea rows={3} placeholder="Nhập ghi chú..." maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
      ),
    },

    // Tab 2: Thông tin vị trí (đồng bộ chuẩn /berth)
    {
      key: 'location',
      label: `Thông tin vị trí (${coordinateList.length})`,
      children: (
        <div style={drawerFormScrollStyle}>
          {/* Nhóm Thông số đối tượng bản đồ */}
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
                  <Select placeholder="Chọn loại đối tượng" options={GEOMETRY_TYPE_OPTIONS} allowClear style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
                  <Select
                    placeholder="Chọn biểu tượng bản đồ"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    disabled={!watchedGeometryType}
                    style={selectStyle}
                  >
                    {(Array.isArray(symbols) ? symbols : []).map(sym => (
                      <Select.Option key={sym.id} value={sym.id} label={sym.name}>
                        <Space>
                          {symbolImageMap.get(sym.id) ? (
                            <img src={symbolImageMap.get(sym.id)} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                          ) : (
                            <EnvironmentOutlined style={{ color: actionPrimary }} />
                          )}
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

          {/* Nhóm Tọa độ GPS */}
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
                  rowKey={(r: DmsCoordinateItem & { _idx: number }) => String(r._idx)}
                  emptyText="Chưa có tọa độ GPS nào"
                  columns={[
                    {
                      title: 'STT',
                      width: 60,
                      align: 'center' as const,
                      render: (_v: unknown, _r: unknown, idx: number) => idx + 1,
                    },
                    {
                      title: 'Vĩ độ (Latitude - N)',
                      key: 'lat',
                      render: (_v: unknown, record: DmsCoordinateItem & { _idx: number }) =>
                        renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
                    },
                    {
                      title: 'Kinh độ (Longitude - E)',
                      key: 'lng',
                      render: (_v: unknown, record: DmsCoordinateItem & { _idx: number }) =>
                        renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
                    },
                    {
                      title: '',
                      width: 50,
                      align: 'center' as const,
                      onCell: () => ({ style: { verticalAlign: 'top' } }),
                      render: (_v: unknown, record: DmsCoordinateItem & { _idx: number }) => (
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
          attachments={uploadedFiles.map((f: UploadFile) => ({
            ...f,
            id: f.uid,
            fileName: f.name,
            fileSize: f.size,
            uploadedByName: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
            uploadedDate: dayjs().toISOString(),
          }))}
          readonly={false}
          userMap={userMap}
          onUpload={(file) => { handleBeforeUpload(file); return false; }}
          onDelete={async (uid) => {
            if (isEdit && id) {
              const isTemp = String(uid).startsWith('temp_') || String(uid).includes('_');
              if (!isTemp) {
                await deleteCctvAttachment(id, uid).catch(() => {});
              }
            }
            setUploadedFiles((prev) => prev.filter((x) => x.uid !== uid));
          }}
          onDownload={async (uid, name) => {
            if (isEdit && id) {
              await downloadCctvAttachment(id, uid, name);
            } else {
              toast.info(`Đang tải xuống tệp: ${name}`);
            }
          }}
        />
      ),
    },
  ];

  useImperativeHandle(ref, () => ({
    submit: (saveAction: CctvSaveAction) => handleSave(saveAction),
  }), [handleSave]);

  return (
    <>
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={drawerTabBarStyle} items={tabItems} />

      {/* Modal Chọn vị trí trên bản đồ */}
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
          <Button
            key="cancel"
            onClick={() => setGisModalOpen(false)}
            style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}
          >
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
