import { useEffect, useState, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import {
  Row, Col, Form, Input, Select, InputNumber, Tabs,
  Button, Space, DatePicker, Modal,
} from 'antd';
import type { FormInstance, UploadFile } from 'antd';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import NumberInputWithCount from '../../components/shared/NumberInputWithCount';
import { parseNumber5, getValueFromEvent5, integer5Rule } from '../../utils/numberRuleHelper';
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
  ddToDms,
  type DmsCoordinateItem,
} from '../../utils/gisGeometry';
import {
  fetchVhfById, createVhf, updateVhf, generateVhfCode, submitVhf,
  fetchVhfAttachments, uploadVhfAttachment, deleteVhfAttachment, downloadVhfAttachment,
  type VhfAttachmentResponse,
} from './api';
import type { VhfResponse, CreateVhfRequest, UpdateVhfRequest } from './types';

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
];

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

const parseWktSafe = (wkt: string | null | undefined): Array<{ latitude: number; longitude: number }> => {
  if (!wkt) return [];
  try {
    const raw = wkt.trim();
    if (raw.startsWith('MULTIPOINT')) {
      const match = raw.match(/MULTIPOINT\s*\((.*)\)/s);
      if (match?.[1]) {
        return match[1]
          .split(',')
          .map(s => s.replace(/[()]/g, '').trim())
          .filter(Boolean)
          .map(pair => {
            const [lng, lat] = pair.split(/\s+/).map(Number);
            return { latitude: lat, longitude: lng };
          })
          .filter(c => !isNaN(c.latitude) && !isNaN(c.longitude));
      }
    }
    const pointsMatch = wkt.match(/(\([^)]+\))/g);
    if (pointsMatch && pointsMatch.length > 0) return pointsMatch.map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.-]+)\s+([\d.-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* ignore */ }
  return [];
};

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

export type VhfSaveAction = 'DRAFT' | 'SUBMIT' | 'APPROVED' | 'UPDATE';

export interface VhfFormProps {
  form: FormInstance;
  id?: string;
  onFinish: (saved: boolean) => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export interface VhfFormRef {
  submit: (saveAction: VhfSaveAction) => Promise<void>;
}

export default forwardRef(function VhfForm({ form, id, onFinish, onSubmittingChange }: VhfFormProps, ref) {
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
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [seaportOptions, setSeaportOptions] = useState<Array<{ id: string; portName: string; portCode?: string }>>([]);
  const [symbols, setSymbols] = useState<MapSymbol[]>([]);
  const [radarStationOptions, setRadarStationOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [vtsOperationCenterOptions, setVtsOperationCenterOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingRadars, setLoadingRadars] = useState(false);
  const [loadingVtsCenters, setLoadingVtsCenters] = useState(false);

  // Tọa độ GPS & File đính kèm
  const [coordinateList, setCoordinateList] = useState<DmsCoordinateItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const gisCoordSnapshotRef = useRef<{ coords: DmsCoordinateItem[]; symbolId?: string }>({ coords: [] });
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  // Nạp danh mục đơn vị quản lý (chuẩn /radar-station: organizationService.getTree)
  useEffect(() => {
    setLoadingOrgs(true);
    organizationService.getTree()
      .then((orgs) => {
        setOrgUnits(orgs || []);
      })
      .catch(() => {
        setOrgUnits([]);
      })
      .finally(() => setLoadingOrgs(false));
  }, []);

  // Nạp danh mục Đơn vị khai thác
  useEffect(() => {
    api.get('/common/options/operating-organizations')
      .then((res) => {
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0) setOperatingOrgs(data);
        else setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS);
      })
      .catch(() => { setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS); });
  }, []);

  // Nạp danh mục Cảng biển
  useEffect(() => {
    api.get('/v1/ports/options')
      .then((res) => {
        const data = res.data?.data;
        if (Array.isArray(data)) setSeaportOptions(data);
      })
      .catch(() => {
        api.get('/v1/ports?size=1000').then((res) => {
          const list = res.data?.data?.content || res.data?.data || [];
          if (Array.isArray(list)) {
            setSeaportOptions(list.map((p: any) => ({ id: p.id, portName: p.portName || p.name, portCode: p.portCode || p.code })));
          }
        }).catch(() => {});
      });
  }, []);

  // Nạp danh mục Biểu tượng bản đồ
  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => {
      setSymbols(r.data || []);
    }).catch(() => {});
  }, []);

  // Nạp danh mục Trạm Radar (phục vụ hạ tầng phụ thuộc - loại 2)
  useEffect(() => {
    setLoadingRadars(true);
    api.get('/common/options/radar-stations')
      .then((res) => {
        const items = res.data?.data;
        setRadarStationOptions(
          (Array.isArray(items) ? items : []).map((s: { id: string; stationName?: string; code?: string }) => ({
            label: s.stationName || s.code || s.id,
            value: s.id,
          }))
        );
      })
      .catch(() => setRadarStationOptions([]))
      .finally(() => setLoadingRadars(false));
  }, []);

  // Nạp danh mục Trung tâm điều hành VTS (phục vụ hạ tầng phụ thuộc - loại 1)
  useEffect(() => {
    setLoadingVtsCenters(true);
    api.get('/common/options/vts-operation-centers')
      .then((res) => {
        const items = res.data?.data;
        setVtsOperationCenterOptions(
          (Array.isArray(items) ? items : []).map((s: { id: string; name?: string; code?: string }) => ({
            label: s.name || s.code || s.id,
            value: s.id,
          }))
        );
      })
      .catch(() => setVtsOperationCenterOptions([]))
      .finally(() => setLoadingVtsCenters(false));
  }, []);

  // Nạp danh bạ người dùng để map uploader
  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as unknown as { content: Array<{ id: string; fullName?: string; username?: string }> }).content || [];
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
      generateVhfCode()
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

  // Mode Sửa: nạp dữ liệu bản ghi vào form
  useEffect(() => {
    if (!isEdit || !id) return;
    let disposed = false;
    (async () => {
      try {
        const data = await fetchVhfById(id);
        if (disposed) return;
        form.setFieldsValue({
          deviceCode: data.deviceCode,
          deviceName: data.deviceName,
          orgUnitId: data.orgUnitId,
          seaportId: data.seaportId,
          operatingUnitId: data.operatingUnitId,
          provinceName: data.provinceName,
          detailedLocation: data.detailedLocation,
          attachedInfrastructureType: data.attachedInfrastructureType,
          attachedInfrastructureId: data.attachedInfrastructureId,
          unitOfMeasure: data.unitOfMeasure,
          quantity: data.quantity ?? 1,
          yearOfUse: data.yearOfUse ? dayjs().year(data.yearOfUse) : undefined,
          operationalStatus: (() => {
            const raw = data.operationalStatus;
            if (raw == null) return 1;
            if (typeof raw === 'number') return raw;
            const str = String(raw).toUpperCase();
            if (str === 'OPERATIONAL' || str === '1') return 1;
            if (str === 'SUSPENDED' || str === '2') return 2;
            if (str === 'INACTIVE' || str === '0') return 0;
            return 1;
          })(),
          model: data.model,
          manufacturer: data.manufacturer,
          specifications: data.specifications,
          maintenanceInformation: data.maintenanceInformation,
          note: data.note,
          geometryType: data.geometryType || undefined,
          mapSymbolId: data.mapSymbolId || undefined,
          coordinateSystem: data.coordinateSystem || (data.geometryType ? 1 : undefined),
          displayRule: data.geometryType ? 'Độ, phút, giây (DMS)' : undefined,
        });

        if (data.coordinates) {
          const parsed = parseWktSafe(data.coordinates);
          if (parsed.length > 0) {
            setCoordinateList(parsed.map(p => {
              const latDms = ddToDms(p.latitude);
              const lngDms = ddToDms(p.longitude);
              return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
            }));
          }
        }

        // Tải danh sách file đính kèm
        try {
          const atts = await fetchVhfAttachments(id);
          if (!disposed && Array.isArray(atts)) {
            setUploadedFiles(atts.map(a => ({
              uid: a.id,
              name: a.fileName,
              size: a.fileSize,
              type: '',
              status: 'done',
              url: `/api/v1/vhf/${id}/attachments/${a.id}/download`,
            })));
          }
        } catch { /* silent */ }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Không thể tải thông tin hệ thống VHF');
      }
    })();
    return () => { disposed = true; };
  }, [isEdit, id, form]);

  const handleBeforeUpload = (file: File) => {
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
        file: file,
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

  const hasCoordinates = coordinateList.some(
    (c) => c.latD != null || c.latM != null || c.latS != null || c.lngD != null || c.lngM != null || c.lngS != null,
  );
  const hasLocation = Boolean(watchedGeometryType || form.getFieldValue('mapSymbolId') || hasCoordinates);

  useImperativeHandle(ref, () => ({
    submit: async (saveAction: VhfSaveAction) => {
      await handleSave(saveAction);
    },
  }));

  const handleSave = useCallback(async (saveAction: VhfSaveAction) => {
    try {
      if (hasCoordinates && !form.getFieldValue('geometryType')) {
        toast.error('Loại đối tượng là bắt buộc khi có tọa độ');
        setActiveTabKey('location');
        return;
      }
      if (hasLocation && !form.getFieldValue('mapSymbolId')) {
        toast.error('Biểu tượng bản đồ là bắt buộc');
        setActiveTabKey('location');
        return;
      }

      // Kiểm tra tính đầy đủ và hợp lệ của tọa độ GPS
      const coordResult = validateDmsCoordinates(coordinateList, form.getFieldValue('geometryType'));
      if (!coordResult.valid) {
        const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
        toast.error(errMsg);
        setGpsError(errMsg);
        setActiveTabKey('location');
        return;
      }
      const validCoords = coordResult.validCoords;
      const wktCoordinates = serializeCoordinatesToWkt(validCoords, form.getFieldValue('geometryType') || 'POINT');

      setGpsError(null);
      let values: Record<string, unknown>;
      try {
        values = await form.validateFields();
      } catch (err: any) {
        if (err?.errorFields?.length) {
          const firstField = err.errorFields[0].name[0];
          if (['geometryType', 'mapSymbolId', 'coordinateSystem', 'displayRule'].includes(firstField)) {
            setActiveTabKey('location');
          } else {
            setActiveTabKey('general');
          }
        }
        return;
      }

      setSubmitting(true);
      onSubmittingChange?.(true);

      const currentAction = saveAction === 'DRAFT' ? 'draft' : saveAction === 'SUBMIT' ? 'submit' : 'approve';
      const payload: Record<string, unknown> = {
        ...values,
        yearOfUse: values.yearOfUse ? (values.yearOfUse as dayjs.Dayjs).year() : undefined,
        quantity: values.quantity != null && !Number.isNaN(Number(values.quantity)) ? Number(values.quantity) : 1,
        coordinates: wktCoordinates ? wktCoordinates : (isEdit ? '' : undefined),
        geometryType: values.geometryType || undefined,
        mapSymbolId: values.mapSymbolId || undefined,
        coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null ? Number(values.displayRule) || null : undefined,
      };

      let targetId: string;
      if (isEdit && id) {
        targetId = id;
        await updateVhf({
          id,
          ...payload,
          ...(saveAction === 'APPROVED' ? { approvalStatus: 'APPROVED' } : {}),
        } as unknown as UpdateVhfRequest);
        if (saveAction === 'SUBMIT') {
          await submitVhf(id);
        }
      } else {
        const res = await createVhf({
          ...payload,
          approvalStatus: saveAction === 'APPROVED' ? 'APPROVED' : saveAction === 'SUBMIT' ? 'PENDING_APPROVAL' : 'DRAFT',
        } as unknown as CreateVhfRequest);
        targetId = res.id;
      }

      // Upload file đính kèm mới nếu có
      if (targetId && uploadedFiles.length > 0) {
        for (const fi of uploadedFiles) {
          const of = fi.originFileObj as File;
          if (!of) continue;
          await uploadVhfAttachment(targetId, of).catch(() => {});
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
    // Tab 1: Thông tin chung (3 Section Cards chuẩn /cctv, /berth)
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
                <Form.Item name="deviceCode" {...labelProps('Mã thiết bị')} style={{ marginBottom: spaceFormField }}>
                  <Input
                    placeholder="Mã tự động sinh..."
                    disabled
                    style={{ ...inputStyle, ...readonlyInputStyle }}
                    suffix={deviceCodeLoading ? <span style={{ color: textTertiary, fontSize: fontSizeSm }}>Đang sinh mã...</span> : null}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="deviceName"
                  {...labelProps('Tên thiết bị')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[
                    { required: true, message: 'Tên thiết bị là bắt buộc' },
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
                    allowClear
                    showPath
                    treeDefaultExpandAll={false}
                    disabled={!isSystemAdmin && !isEdit}
                    style={{ borderRadius: radiusPill, height: 40 }}
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
                    options={seaportOptions.map((p) => ({
                      label: p.portCode ? `${p.portCode} - ${p.portName}` : p.portName,
                      value: p.id,
                    }))}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="operatingUnitId" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}>
                  <Select
                    placeholder="Chọn đơn vị khai thác..."
                    options={operatingOrgs.map(o => ({ label: o.name, value: o.id }))}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
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
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="attachedInfrastructureType" {...labelProps('Thuộc loại hạ tầng')} style={{ marginBottom: spaceFormField }}>
                  <Select
                    placeholder="Chọn loại hạ tầng..."
                    options={ATTACHED_INFRA_TYPE_OPTIONS}
                    allowClear
                    onChange={() => form.setFieldsValue({ attachedInfrastructureId: undefined })}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="attachedInfrastructureId"
                  {...labelProps('Thuộc hạ tầng')}
                  style={{ marginBottom: spaceFormField }}
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
              <Col span={24}>
                <Form.Item
                  name="detailedLocation"
                  {...labelProps('Địa điểm chi tiết')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}
                  validateStatus={atMax.detailedLocation ? 'error' : undefined}
                  help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}
                >
                  <Input placeholder="Nhập địa điểm chi tiết..." maxLength={500} showCount style={inputStyle} />
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
                  <Select placeholder="Chọn đơn vị tính..." options={UNIT_OF_MEASURE_OPTIONS} allowClear style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  {...labelProps('Số lượng')}
                  style={{ marginBottom: spaceFormField }}
                  getValueFromEvent={getValueFromEvent5}
                  rules={[
                    { required: true, message: 'Số lượng là bắt buộc' },
                    integer5Rule,
                  ]}
                  initialValue={1}
                >
                  <NumberInputWithCount
                    min={1}
                    step={1}
                    precision={0}
                    placeholder="Nhập số lượng..."
                    style={numberInputStyle}
                    maxLength={5}
                    parser={parseNumber5}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="yearOfUse" {...labelProps('Năm đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}>
                  <DatePicker
                    picker="year"
                    placeholder="Chọn năm..."
                    style={{ ...inputStyle, width: '100%' }}
                    disabledDate={(d) => d && d.year() > new Date().getFullYear()}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="operationalStatus"
                  {...labelProps('Tình trạng hoạt động')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Tình trạng hoạt động là bắt buộc' }]}
                  initialValue={0}
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
                  <Input placeholder="Nhập model thiết bị" maxLength={255} showCount style={inputStyle} />
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

    // Tab 2: Thông tin vị trí (đồng bộ chuẩn /cctv, /berth)
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
                <Form.Item
                  name="mapSymbolId"
                  {...labelProps('Biểu tượng')}
                  required={hasLocation}
                  rules={hasLocation ? [{ required: true, message: 'Vui lòng chọn biểu tượng bản đồ' }] : []}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    placeholder="Chọn biểu tượng bản đồ"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    disabled={!watchedGeometryType}
                    style={selectStyle}
                  >
                    {symbols.map(sym => (
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
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Hệ quy chiếu" options={COORD_SYS_OPTIONS} disabled style={readonlyInputStyle} />
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
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
              <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
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
                  dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
                  rowKey={(r: DmsCoordinateItem & { _idx: number }) => String(r._idx)}
                  scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
                  size="small"
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
          attachments={uploadedFiles.map((f: any) => ({
            ...f,
            id: f.uid || f.id,
            fileName: f.name || f.fileName,
            fileSize: f.size || f.fileSize,
            file: f.originFileObj || f.file,
            originFileObj: f.originFileObj || f.file,
            uploadedByName: f.uploadedByName || currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
            uploadedDate: f.uploadedDate || f.uploadedAt || dayjs().toISOString(),
          }))}
          readonly={false}
          userMap={userMap}
          onUpload={(file) => { handleBeforeUpload(file); return false; }}
          onDelete={async (uid) => {
            if (isEdit && id) {
              const isTemp = String(uid).startsWith('temp_') || String(uid).includes('_');
              if (!isTemp) {
                await deleteVhfAttachment(id, uid).catch(() => {});
              }
            }
            setUploadedFiles(p => p.filter(f => f.uid !== uid));
          }}
          onDownload={async (attachmentIdOrItem: any, maybeFileName?: string) => {
            const attId = typeof attachmentIdOrItem === 'string' ? attachmentIdOrItem : attachmentIdOrItem?.id;
            const fileName = (typeof attachmentIdOrItem === 'object' && attachmentIdOrItem?.fileName)
              ? attachmentIdOrItem.fileName
              : maybeFileName;

            // 1. Tải xuống file vừa upload tại client (ở cả chế độ Thêm mới và Sửa)
            const target = uploadedFiles.find((f: any) => f.uid === attId || f.id === attId);
            const rawFile = (target as any)?.originFileObj || (target as any)?.file;
            if (rawFile && (rawFile instanceof Blob || rawFile instanceof File)) {
              const url = window.URL.createObjectURL(rawFile);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName || target?.name || (rawFile as File).name || 'attachment';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              return;
            }

            // 2. Tải xuống file đã lưu trên server (chế độ Sửa)
            if (isEdit && id && attId) {
              try {
                await downloadVhfAttachment(id, attId, fileName);
              } catch (err: any) {
                toast.error(err?.message || 'Không thể tải xuống tệp đính kèm');
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
      <Tabs
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        items={tabItems}
        style={drawerTabBarStyle}
      />

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
        onCancel={() => {
          setCoordinateList(gisCoordSnapshotRef.current.coords);
          form.setFieldValue('mapSymbolId', gisCoordSnapshotRef.current.symbolId);
          setGisModalOpen(false);
        }}
        destroyOnClose
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
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
                return serializeCoordinatesToWkt(valid, (watchedGeometryType as any) || 'POINT');
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
