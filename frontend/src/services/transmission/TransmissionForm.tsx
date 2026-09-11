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
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField, spaceMd,
  surfaceCard, readonlyInputStyle,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
  drawerGisControlBoxStyle,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import api from '../api';
import toast from '../../components/ToastNotification';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../operatingOrganizationsData';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService } from '../organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { symbolService } from '../symbolService';
import { userService } from '../userService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type { Symbol as MapSymbol } from '../symbolService';
import { useAuthStore } from '../../store/authStore';
import {
  GEOMETRY_POINT_COUNT,
  parseWktToCoordinates,
  validateDmsCoordinates,
  serializeCoordinatesToWkt,
  ddToDms,
} from '../../utils/gisGeometry';
import {
  createTransmission,
  updateTransmission,
  fetchTransmissionById,
  generateTransmissionCode,
  fetchTransmissionAttachments,
  uploadTransmissionAttachment,
  deleteTransmissionAttachment,
  downloadTransmissionAttachment,
  submitTransmission,
  fetchOperatingOrganizations,
} from './api';
import type { TransmissionResponse } from './types';
import { OPERATIONAL_STATUS_OPTIONS } from './schema';

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

const textAreaStyle: React.CSSProperties = { borderRadius: 8 };

// Style cho thẻ phân nhóm (Section Card) đồng bộ với chuẩn /berth
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

const ATTACHED_INFRA_TYPE_OPTIONS = [
  { value: 1, label: 'Trung Tâm Điều Hành VTS' },
  { value: 2, label: 'Trạm Radar' },
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

const UOM_OPTIONS = [
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

export interface TransmissionFormProps {
  form: FormInstance;
  id?: string;
  initialData?: TransmissionResponse | null;
  onFinish: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export interface TransmissionFormRef {
  submit: (action: 'draft' | 'submit' | 'approve') => Promise<void>;
}

const TransmissionForm = forwardRef<TransmissionFormRef, TransmissionFormProps>(function TransmissionForm(
  { form, id, initialData, onFinish, onSubmittingChange },
  ref,
) {
  const isEdit = !!id;
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [deviceCodeLoading, setDeviceCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  const watchedGeometryType = Form.useWatch('geometryType', form);
  const watchedAttachedType = Form.useWatch('attachedInfrastructureType', form);
  const isSystemAdmin = currentUser?.permissions?.includes('*') ?? false;

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

  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [radarStations, setRadarStations] = useState<Array<{ value: string; label: string }>>([]);
  const [vtsCenters, setVtsCenters] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingAttached, setLoadingAttached] = useState(false);
  const [symbols, setSymbols] = useState<MapSymbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const hasCoordinates = coordinateList.some((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null));
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const gisCoordSnapshotRef = useRef<{ coords: Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>; symbolId?: string }>({ coords: [], symbolId: undefined });
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [pendingDeletedIds, setPendingDeletedIds] = useState<string[]>([]);

  // Load danh mục chung
  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' })
      .then((r) => setSymbols(r.data || []))
      .catch(() => {});

    fetchOperatingOrganizations()
      .then((data) => {
        if (Array.isArray(data) && data.length) setOperatingOrgs(data);
      })
      .catch(() => {});

    setLoadingOrgs(true);
    organizationService.getTree()
      .then((r) => setOrgUnits(r || []))
      .catch(() => {})
      .finally(() => setLoadingOrgs(false));

    if (!isEdit) {
      const currentOrg = useAuthStore.getState().user?.orgUnitId;
      if (currentOrg) {
        form.setFieldsValue({ orgUnitId: currentOrg });
      } else {
        api.get('/users/me')
          .then((res: any) => {
            const p = res?.data?.data ?? res?.data;
            if (p?.orgUnitId) form.setFieldsValue({ orgUnitId: p.orgUnitId });
          })
          .catch(() => {});
      }
    }

    userService.list({ pageSize: 1000 })
      .then((resp) => {
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => {
          map.set(u.id, u.fullName || u.username || u.id);
        });
        setUserMap(map);
      })
      .catch(() => {});
  }, []);

  // Load danh sách hạ tầng trực thuộc (Radar & VTS centers)
  useEffect(() => {
    setLoadingAttached(true);
    Promise.all([
      api.get('/common/options/radar-stations').catch(() => ({ data: { data: [] } })),
      api.get('/common/options/vts-operation-centers').catch(() => ({ data: { data: [] } })),
    ])
      .then(([radarRes, vtsRes]) => {
        const radars = radarRes.data?.data || [];
        const centers = vtsRes.data?.data || [];
        setRadarStations(
          (Array.isArray(radars) ? radars : []).map((s: { id: string; stationName?: string; code?: string }) => ({
            value: s.id,
            label: s.stationName || s.code || s.id,
          })),
        );
        setVtsCenters(
          (Array.isArray(centers) ? centers : []).map((s: { id: string; name?: string; code?: string }) => ({
            value: s.id,
            label: s.name || s.code || s.id,
          })),
        );
      })
      .finally(() => setLoadingAttached(false));
  }, []);

  // Tự động sinh mã thiết bị khi tạo mới
  useEffect(() => {
    if (isEdit) return;
    if (form.getFieldValue('deviceCode')) return;
    setDeviceCodeLoading(true);
    generateTransmissionCode()
      .then((code) => {
        if (code) form.setFieldsValue({ deviceCode: code });
      })
      .catch(() => {})
      .finally(() => setDeviceCodeLoading(false));
  }, [isEdit, form]);

  // Đồng bộ số dòng tọa độ theo loại hình hình học
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

  // Nạp dữ liệu trong chế độ Chỉnh sửa
  useEffect(() => {
    if (!isEdit || !id) return;
    let isMounted = true;

    const populate = (data: TransmissionResponse) => {
      if (!isMounted) return;
      const ec = parseWktToCoordinates(data.coordinates || undefined);
      setCoordinateList(
        ec.length > 0
          ? ec.map((c) => {
              const latDms = ddToDms(c.latitude);
              const lngDms = ddToDms(c.longitude);
              return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
            })
          : [],
      );

      // Map operationalStatus từ string enum sang number nếu cần
      let opStatusNum = 1;
      if (data.operationalStatus != null) {
        switch (data.operationalStatus) {
          case 'NOT_YET_OPERATIONAL': opStatusNum = 0; break;
          case 'OPERATIONAL': opStatusNum = 1; break;
          case 'SUSPENDED': opStatusNum = 2; break;
          default: {
            const num = Number(data.operationalStatus);
            opStatusNum = num >= 0 && num <= 2 ? num : 1;
          }
        }
      }

      form.setFieldsValue({
        deviceCode: data.deviceCode,
        deviceName: data.deviceName,
        orgUnitId: data.orgUnitId,
        operatingUnitId: data.operatingUnitId,
        attachedInfrastructureType: data.attachedInfrastructureType ?? undefined,
        attachedInfrastructureId: data.attachedInfrastructureId ?? undefined,
        provinceName: data.provinceName ?? undefined,
        detailedLocation: data.detailedLocation ?? undefined,
        unitOfMeasure: data.unitOfMeasure ?? undefined,
        quantity: data.quantity ?? 1,
        yearOfUse: data.yearOfUse ?? undefined,
        operationalStatus: opStatusNum,
        model: data.model ?? undefined,
        manufacturer: data.manufacturer ?? undefined,
        specifications: data.specifications ?? undefined,
        maintenanceInformation: data.maintenanceInformation ?? undefined,
        note: data.note ?? undefined,
        geometryType: data.geometryType ?? undefined,
        mapSymbolId: data.mapSymbolId ?? undefined,
        coordinateSystem: (data.geometryType || data.coordinates) ? (data.coordinateSystem ?? 1) : undefined,
        displayRule: (data.geometryType || data.coordinates) ? 'Độ, phút, giây (DMS)' : undefined,
      });
    };

    if (initialData) {
      populate(initialData);
    } else {
      fetchTransmissionById(id)
        .then((data) => populate(data))
        .catch(() => toast.error('Không thể tải thông tin hệ thống truyền dẫn'));
    }

    // Load file đính kèm
    fetchTransmissionAttachments(id)
      .then((files) => {
        if (!isMounted) return;
        setUploadedFiles(
          (Array.isArray(files) ? files : []).map((a: any) => ({
            uid: String(a.id),
            id: String(a.id),
            name: a.fileName || a.name || '—',
            fileName: a.fileName || a.name || '—',
            size: a.fileSize ?? a.size,
            fileSize: a.fileSize ?? a.size,
            uploadedByName: a.uploadedByName || a.uploadedBy || 'Cán bộ quản lý',
            uploadedDate: a.uploadedDate || a.createdAt || dayjs().toISOString(),
            status: 'done' as const,
          })),
        );
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isEdit, id, initialData, form]);

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
        uploadedBy: currentUser?.id || uploaderName,
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

  const handleSave = useCallback(
    async (action: 'draft' | 'submit' | 'approve') => {
      let values: any;
      try {
        values = await form.validateFields();
      } catch (e: any) {
        const errFields: Array<{ name: Array<string | number>; errors?: string[] }> = e?.errorFields ?? [];
        const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc (*)';
        toast.error(firstError);
        if (
          errFields.some(
            (f) =>
              f.name[0] === 'geometryType' ||
              f.name[0] === 'mapSymbolId' ||
              f.name[0] === 'coordinateSystem' ||
              f.name[0] === 'displayRule',
          )
        ) {
          setActiveTabKey('location');
        } else {
          setActiveTabKey('general');
        }
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

      // Validate GPS Coordinates nếu có chọn geometryType
      let coordinatesWkt: string | undefined;
      const coordResult = validateDmsCoordinates(coordinateList, values.geometryType);
      if (!coordResult.valid) {
        const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
        toast.error(errMsg);
        setGpsError(errMsg);
        setActiveTabKey('location');
        return;
      }
      coordinatesWkt = serializeCoordinatesToWkt(coordResult.validCoords, values.geometryType || 'POINT') || undefined;

      onSubmittingChange?.(true);

      try {
        const payload: Record<string, unknown> = {
          deviceCode: values.deviceCode ? String(values.deviceCode).trim() : undefined,
          deviceName: String(values.deviceName ?? '').trim(),
          orgUnitId: values.orgUnitId || undefined,
          operatingUnitId: values.operatingUnitId || undefined,
          attachedInfrastructureType: values.attachedInfrastructureType != null ? Number(values.attachedInfrastructureType) : undefined,
          attachedInfrastructureId: values.attachedInfrastructureId || undefined,
          provinceName: values.provinceName || undefined,
          detailedLocation: values.detailedLocation ? String(values.detailedLocation).trim() : undefined,
          unitOfMeasure: values.unitOfMeasure != null ? Number(values.unitOfMeasure) : undefined,
          quantity: values.quantity != null ? Number(values.quantity) : 1,
          yearOfUse: values.yearOfUse != null ? Number(values.yearOfUse) : undefined,
          operationalStatus: values.operationalStatus != null ? Number(values.operationalStatus) : 1,
          model: values.model ? String(values.model).trim() : undefined,
          manufacturer: values.manufacturer ? String(values.manufacturer).trim() : undefined,
          specifications: values.specifications ? String(values.specifications).trim() : undefined,
          maintenanceInformation: values.maintenanceInformation ? String(values.maintenanceInformation).trim() : undefined,
          note: values.note ? String(values.note).trim() : undefined,
          geometryType: values.geometryType || undefined,
          mapSymbolId: values.mapSymbolId || undefined,
          coordinateSystem: values.coordinateSystem != null ? Number(values.coordinateSystem) : undefined,
          coordinates: coordinatesWkt,
          displayRule: values.displayRule != null ? (typeof values.displayRule === 'number' ? values.displayRule : 1) : undefined,
        };

        let targetId = id;
        if (isEdit && id) {
          await updateTransmission({
            id,
            ...payload,
            ...(action === 'approve' ? { approvalStatus: 'APPROVED' } : {}),
          });

          // Xóa file đánh dấu xóa
          if (pendingDeletedIds.length > 0) {
            for (const delId of pendingDeletedIds) {
              await deleteTransmissionAttachment(id, delId).catch(() => {});
            }
          }

          // Upload file mới
          const newFiles = uploadedFiles.filter((f) => f.originFileObj);
          if (newFiles.length > 0) {
            for (const f of newFiles) {
              if (f.originFileObj) {
                await uploadTransmissionAttachment(id, f.originFileObj as File).catch(() => {});
              }
            }
          }

          // Nếu chọn "Lưu và gửi phê duyệt" trong chế độ sửa
          if (action === 'submit') {
            await submitTransmission(id);
          }
        } else {
          // Thêm mới
          const created = await createTransmission({
            ...payload,
            deviceName: String(payload.deviceName || ''),
            quantity: Number(payload.quantity || 1),
            action: action === 'draft' ? 'draft' : action === 'submit' ? 'submit' : 'approve',
          });
          targetId = created.id;

          // Upload files đính kèm cho bản ghi mới tạo
          const newFiles = uploadedFiles.filter((f) => f.originFileObj);
          if (targetId && newFiles.length > 0) {
            for (const f of newFiles) {
              if (f.originFileObj) {
                await uploadTransmissionAttachment(targetId, f.originFileObj as File).catch(() => {});
              }
            }
          }
        }

        toast.success(
          action === 'draft'
            ? 'Lưu tạm hệ thống truyền dẫn thành công'
            : action === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : 'Lưu và phê duyệt thành công',
        );

        onFinish();
      } catch (err: any) {
        console.error('[TransmissionForm] save error:', err);
        toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu dữ liệu');
      } finally {
        onSubmittingChange?.(false);
      }
    },
    [form, coordinateList, id, isEdit, pendingDeletedIds, uploadedFiles, onFinish, onSubmittingChange, hasLocation, hasCoordinates],
  );

  useImperativeHandle(
    ref,
    () => ({
      submit: (action: 'draft' | 'submit' | 'approve') => handleSave(action),
    }),
    [handleSave],
  );

  const tabItems = [
    // ── Tab 1: Thông tin chung ──────────────────────────────────────────
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
                  rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }, { max: 255, message: 'Tối đa 255 ký tự' }]}
                  validateStatus={atMax.deviceName ? 'error' : undefined}
                  help={atMax.deviceName ? 'Đã đạt tối đa 255 ký tự' : undefined}
                >
                  <Input placeholder="Nhập tên thiết bị..." maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="orgUnitId"
                  {...labelProps('Đơn vị quản lý')}
                  rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <OrgUnitTreeSelect
                    placeholder="Chọn đơn vị quản lý..."
                    disabled={isEdit || !isSystemAdmin}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="operatingUnitId"
                  {...labelProps('Đơn vị khai thác')}
                  rules={[{ required: true, message: 'Vui lòng chọn đơn vị khai thác' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    placeholder="Chọn đơn vị khai thác..."
                    options={operatingOrgs.map((o) => ({ label: o.name, value: o.id }))}
                    loading={loadingOrgs}
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
                <Form.Item name="attachedInfrastructureType" {...labelProps('Loại hạ tầng trực thuộc')} style={{ marginBottom: spaceFormField }}>
                  <Select
                    placeholder="Chọn loại hạ tầng trực thuộc..."
                    options={ATTACHED_INFRA_TYPE_OPTIONS}
                    allowClear
                    onChange={() => form.setFieldValue('attachedInfrastructureId', undefined)}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="attachedInfrastructureId" {...labelProps('Hạ tầng trực thuộc')} style={{ marginBottom: spaceFormField }}>
                  <Select
                    placeholder={
                      watchedAttachedType === 1
                        ? 'Chọn Trung Tâm Điều Hành VTS...'
                        : watchedAttachedType === 2
                          ? 'Chọn Trạm Radar...'
                          : 'Chọn loại hạ tầng trước'
                    }
                    options={
                      watchedAttachedType === 1
                        ? vtsCenters
                        : watchedAttachedType === 2
                          ? radarStations
                          : []
                    }
                    loading={loadingAttached}
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
                    options={VIETNAM_PROVINCES.map((p) => ({ label: p, value: p }))}
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
                  <Select placeholder="Chọn đơn vị tính..." options={UOM_OPTIONS} allowClear showSearch optionFilterProp="label" style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  {...labelProps('Số lượng')}
                  style={{ marginBottom: spaceFormField }}
                  getValueFromEvent={getValueFromEvent5}
                  rules={[
                    { required: true, message: 'Vui lòng nhập số lượng' },
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
                <Form.Item
                  name="yearOfUse"
                  {...labelProps('Năm đưa vào sử dụng')}
                  style={{ marginBottom: spaceFormField }}
                  getValueProps={(v: number | null | undefined) => ({
                    value: v != null && !Number.isNaN(Number(v)) ? dayjs().year(Number(v)) : null,
                  })}
                  getValueFromEvent={(d: { year?: () => number } | null) =>
                    d && typeof d.year === 'function' ? d.year() : null
                  }
                >
                  <DatePicker
                    picker="year"
                    placeholder="Chọn năm đưa vào sử dụng..."
                    style={selectStyle}
                    disabledDate={(d) => d && d.year() > dayjs().year()}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operationalStatus" {...labelProps('Tình trạng hoạt động')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]} initialValue={0}>
                  <Select placeholder="Chọn tình trạng hoạt động..." options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
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
          <div style={{ ...sectionBoxStyle, padding: '14px 18px 20px 18px' }}>
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
                  style={{ marginBottom: 0 }}
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

    // ── Tab 2: Thông tin vị trí ─────────────────────────────────────────
    {
      key: 'location',
      label: `Thông tin vị trí (${coordinateList.length})`,
      children: (
        <div style={{ ...drawerFormScrollStyle, paddingTop: spaceMd }}>
          {/* ── Section Card: Thông số đối tượng bản đồ ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <EnvironmentOutlined style={{ color: actionPrimary }} />
                <span>Thông số đối tượng bản đồ</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="geometryType"
                  {...labelProps('Loại đối tượng')}
                  required={hasCoordinates}
                  rules={hasCoordinates ? [{ required: true, message: 'Loại đối tượng là bắt buộc khi có tọa độ' }] : []}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    placeholder="Chọn loại đối tượng"
                    allowClear
                    options={GEOMETRY_TYPE_OPTIONS}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
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
                  <Select
                    disabled={!watchedGeometryType}
                    placeholder="Chọn biểu tượng bản đồ"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={selectStyle}
                  >
                    {(Array.isArray(symbols) ? symbols : []).map((sym) => (
                      <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                        <Space size={6} style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {sym.image ? (
                            <img
                              src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                              alt={sym.name}
                              style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle' }}
                            />
                          ) : (
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: actionPrimary }} />
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
              <Col xs={24} sm={12}>
                <Form.Item
                  name="coordinateSystem"
                  {...labelProps('Hệ quy chiếu')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    disabled
                    placeholder="Chọn hệ quy chiếu..."
                    options={COORD_SYS_OPTIONS}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="displayRule"
                  {...labelProps('Quy tắc hiển thị')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input disabled placeholder="Chọn quy tắc hiển thị" style={{ ...inputStyle, ...readonlyInputStyle }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section Card: Tọa độ GPS ── */}
          <div style={sectionBoxStyle}>
            <div style={{ marginBottom: spaceSm, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
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
                      render: (_v: any, _r: any, idx: number) => idx + 1,
                    },
                    {
                      title: 'Vĩ độ (Latitude - N)',
                      key: 'lat',
                      render: (_v: any, record: any) =>
                        renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) =>
                          updateGpsPoint(record._idx, 'lat', d, m, s),
                        ),
                    },
                    {
                      title: 'Kinh độ (Longitude - E)',
                      key: 'lng',
                      render: (_v: any, record: any) =>
                        renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) =>
                          updateGpsPoint(record._idx, 'lng', d, m, s),
                        ),
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

    // ── Tab 3: File đính kèm ────────────────────────────────────────────
    {
      key: 'files',
      label: `File đính kèm (${uploadedFiles.length})`,
      children: (
        <div style={{ ...drawerFormScrollStyle, paddingTop: spaceMd }}>
          <InfrastructureAttachmentTab
            attachments={uploadedFiles.map((f: any) => ({
              ...f,
              id: f.uid || f.id,
              fileName: f.name || f.fileName,
              fileSize: f.fileSize ?? f.size ?? f.originFileObj?.size,
              uploadedByName:
                f.uploadedByName ||
                (f.uploadedBy ? userMap.get(f.uploadedBy) || f.uploadedBy : '') ||
                currentUser?.fullName ||
                currentUser?.username ||
                'Cán bộ quản lý',
              uploadedDate: f.uploadedDate || f.uploadedAt || f.createdAt || dayjs().toISOString(),
            }))}
            readonly={false}
            userMap={userMap}
            onUpload={(file) => {
              handleBeforeUpload(file);
              return false;
            }}
            onDelete={(uid) => {
              // Nếu là file cũ trên server (không có originFileObj) -> ghi nhận pending delete
              const target = uploadedFiles.find((x) => x.uid === uid);
              if (target && !target.originFileObj) {
                setPendingDeletedIds((prev) => [...prev, uid]);
              }
              setUploadedFiles((prev) => prev.filter((x) => x.uid !== uid));
            }}
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
                  await downloadTransmissionAttachment(id, uid, name);
                } catch {
                  toast.error('Không thể tải xuống tệp đính kèm');
                }
              } else {
                toast.error('Không tìm thấy tệp để tải xuống');
              }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={drawerTabBarStyle} items={tabItems} />

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
            value={{
              geometryType: watchedGeometryType || 'POINT',
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
            defaultGeometryType={watchedGeometryType || 'POINT'}
            height={520}
            onChange={(val: any) => {
              if (val?.symbolId) form.setFieldValue('mapSymbolId', val.symbolId);
              const points = parseGisCoordinates(val);
              if (points.length > 0) {
                if (watchedGeometryType === 'POINT') {
                  const p = points[0];
                  const latDms = ddToDms(p.latitude);
                  const lngDms = ddToDms(p.longitude);
                  setCoordinateList([
                    {
                      latD: latDms.d,
                      latM: latDms.m,
                      latS: latDms.s,
                      lngD: lngDms.d,
                      lngM: lngDms.m,
                      lngS: lngDms.s,
                    },
                  ]);
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

export default TransmissionForm;
