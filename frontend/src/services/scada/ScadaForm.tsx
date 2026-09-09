import { useEffect, useState, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
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
  surfaceCard, readonlyInputStyle,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
  textAreaStyle,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import api from '../api';
import toast from '../../components/ToastNotification';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../operatingOrganizationsData';
import { fmtInputNumber } from '../../utils/numFmt';
import { organizationService, type Organization } from '../organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { symbolService } from '../symbolService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type { Symbol as MapSymbolType } from '../symbolService';
import {
  GEOMETRY_POINT_COUNT, parseWktToCoordinates, validateDmsCoordinates, serializeCoordinatesToWkt,
  type DmsCoordinateItem,
} from '../../utils/gisGeometry';
import {
  fetchScadaById, createScada, updateScada, generateScadaCode, submitScada,
  fetchScadaAttachments, uploadScadaAttachment, deleteScadaAttachment, downloadScadaAttachment,
} from './api';
import type { ScadaResponse, CreateScadaRequest, UpdateScadaRequest } from './types';

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

// Khung 2: Thông số kỹ thuật & Vận hành — giảm 4px chiều cao (padding dọc 20px so với 24px gốc)
const specSectionBoxStyle: React.CSSProperties = {
  ...sectionBoxStyle,
  padding: '12px 18px 8px 18px',
};

// Khung 3: Bảo trì & Ghi chú — tăng 8px chiều cao (padding dọc 32px so với 24px gốc)
const maintenanceSectionBoxStyle: React.CSSProperties = {
  ...sectionBoxStyle,
  padding: '18px 18px 14px 18px',
  marginBottom: 0,
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
  if (dd == null || Number.isNaN(dd)) return { d: null, m: null, s: null };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60 * 10000) / 10000;
  return { d: dd < 0 ? -d : d, m, s };
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
  userSelect: 'none',
  boxSizing: 'border-box',
};

const dmsUnitEndStyle: React.CSSProperties = {
  ...dmsUnitStyle,
  borderRight: `1px solid ${borderDefault}`,
  borderRadius: '0 999px 999px 0',
  paddingRight: 6,
};

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
        {inputs.map((inp) => (
          <div key={inp.key} style={{ display: 'inline-flex', alignItems: 'center', flex: inp.basis, minWidth: 0, width: inp.width }}>
            <InputNumber
              value={inp.value ?? null}
              min={0}
              max={inp.max}
              step={inp.step}
              precision={inp.key === 's' ? 2 : 0}
              formatter={inp.formatter}
              placeholder={inp.base}
              onChange={(v) => inp.onEdit(v == null ? null : Number(v))}
              style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32 }}
              controls={false}
            />
            <span style={inp.unitStyle}>{inp.unit}</span>
          </div>
        ))}
      </div>
      <div aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', width: '100%', minWidth: 0, marginTop: spaceXs, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
        {inputs.map((inp) => (
          <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width }}>
            {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

interface RawAttachmentItem {
  id: string;
  fileName: string;
  fileSize?: number;
  filePath?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export type ScadaSaveAction = 'DRAFT' | 'SUBMIT' | 'APPROVED';

export interface ScadaFormRef {
  submit: (saveAction: ScadaSaveAction) => Promise<void>;
}

interface ScadaFormProps {
  id?: string | null;
  isEdit?: boolean;
  form: FormInstance;
  onSuccess: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

const ScadaForm = forwardRef<ScadaFormRef, ScadaFormProps>(({
  id,
  isEdit = false,
  form,
  onSuccess,
  onSubmittingChange,
}, ref) => {
  const [activeTab, setActiveTab] = useState('info');
  const [deviceCodeLoading, setDeviceCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('*') ?? false;

  // Options
  const [orgUnits, setOrgUnits] = useState<Organization[]>([]);
  const [symbols, setSymbols] = useState<MapSymbolType[]>([]);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [vtsOperationCenters, setVtsOperationCenters] = useState<Array<{ id: string; name?: string; code?: string }>>([]);
  const [radarStations, setRadarStations] = useState<Array<{ id: string; stationName?: string; code?: string }>>([]);

  const vtsOperationCenterOptions = useMemo(() =>
    vtsOperationCenters.map(v => ({ label: v.name || v.code || v.id, value: v.id })),
    [vtsOperationCenters]
  );
  const radarStationOptions = useMemo(() =>
    radarStations.map(r => ({ label: r.stationName || r.code || r.id, value: r.id })),
    [radarStations]
  );

  // Loading
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [loadingOperatingOrgs, setLoadingOperatingOrgs] = useState(false);
  const [loadingVtsCenters, setLoadingVtsCenters] = useState(false);
  const [loadingRadars, setLoadingRadars] = useState(false);

  // GIS state
  const [coordinateList, setCoordinateList] = useState<DmsCoordinateItem[]>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalVisible, setGisModalVisible] = useState(false);

  // Attachments state
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<RawAttachmentItem[]>([]);

  // Form watchers
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

  const handleOrgUnitChange = () => {
    // Giữ hoặc cập nhật dữ liệu liên quan khi đổi đơn vị
  };

  // Load org units
  const loadOrgUnits = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const data = await organizationService.getAll();
      setOrgUnits(data || []);
    } catch {
      setOrgUnits([]);
    } finally {
      setLoadingOrgs(false);
    }
  }, []);

  // Load symbols
  const loadSymbols = useCallback(async () => {
    setLoadingSymbols(true);
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setSymbols([]);
    } finally {
      setLoadingSymbols(false);
    }
  }, []);

  // Load operating orgs
  const loadOperatingOrgs = useCallback(async () => {
    setLoadingOperatingOrgs(true);
    try {
      const res = await api.get('/common/options/operating-organizations');
      const items = res.data?.data;
      if (Array.isArray(items) && items.length > 0) {
        setOperatingOrgs(items);
      }
    } catch {
      setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS);
    } finally {
      setLoadingOperatingOrgs(false);
    }
  }, []);

  // Load VTS Centers
  const loadVtsCenters = useCallback(async () => {
    setLoadingVtsCenters(true);
    try {
      const res = await api.get('/common/options/vts-operation-centers');
      const items = res.data?.data;
      setVtsOperationCenters(Array.isArray(items) ? items : []);
    } catch {
      setVtsOperationCenters([]);
    } finally {
      setLoadingVtsCenters(false);
    }
  }, []);

  // Load Radar stations
  const loadRadarStations = useCallback(async () => {
    setLoadingRadars(true);
    try {
      const res = await api.get('/common/options/radar-stations');
      const items = res.data?.data;
      setRadarStations(Array.isArray(items) ? items : []);
    } catch {
      setRadarStations([]);
    } finally {
      setLoadingRadars(false);
    }
  }, []);

  useEffect(() => {
    loadOrgUnits();
    loadSymbols();
    loadOperatingOrgs();
    loadVtsCenters();
    loadRadarStations();
  }, [loadOrgUnits, loadSymbols, loadOperatingOrgs, loadVtsCenters, loadRadarStations]);

  // Create mode: auto-generate deviceCode
  useEffect(() => {
    if (isEdit) return;
    setDeviceCodeLoading(true);
    generateScadaCode()
      .then((code) => {
        if (code) form.setFieldValue('deviceCode', code);
      })
      .catch(() => {})
      .finally(() => setDeviceCodeLoading(false));

    if (!isSystemAdmin) {
      api.get('/users/me')
        .then((r) => {
          const p = r.data?.data ?? r.data;
          if (p?.orgUnitId) form.setFieldsValue({ orgUnitId: p.orgUnitId });
        })
        .catch(() => {});
    }
  }, [isEdit, isSystemAdmin, form]);

  // GIS Geometry Type changes: adjust coordinateList
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

  // Edit mode: load data for existing record
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data: ScadaResponse = await fetchScadaById(id);
        const pts = parseWktToCoordinates(data.coordinates || undefined);
        let initialCoords: DmsCoordinateItem[] = pts.length > 0 ? pts.map(c => {
          const latDms = ddToDms(c.latitude);
          const lngDms = ddToDms(c.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        }) : [];
        const geom = data.geometryType;
        if (geom === 'POINT' && initialCoords.length > 1) {
          initialCoords = [initialCoords[0]];
        } else if (geom && initialCoords.length > 0 && initialCoords.length < (GEOMETRY_POINT_COUNT[geom] ?? 1)) {
          const count = GEOMETRY_POINT_COUNT[geom] ?? 1;
          initialCoords = [...initialCoords, ...Array.from({ length: count - initialCoords.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }))];
        } else if (geom && initialCoords.length === 0) {
          const count = GEOMETRY_POINT_COUNT[geom] ?? 1;
          initialCoords = Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        }
        setCoordinateList(initialCoords);

        try {
          const attList = await fetchScadaAttachments(id);
          const files: UploadFile[] = (attList || []).map((a: RawAttachmentItem) => ({
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
          yearOfUse: data.yearOfUse ? dayjs().year(data.yearOfUse) : undefined,
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
          geometryType: data.geometryType || 'POINT',
          mapSymbolId: data.mapSymbolId,
          coordinateSystem: data.coordinateSystem || 1,
          displayRule: 'Độ, phút, giây (DMS)',
        });
      } catch (err) {
        console.error('Lỗi khi nạp dữ liệu SCADA:', err);
        toast.error('Không thể tải thông tin hệ thống SCADA');
      }
    })();
  }, [isEdit, id, form]);

  // Imperative Submit
  useImperativeHandle(ref, () => ({
    submit: async (saveAction: ScadaSaveAction) => {
      try {
        await form.validateFields();
      } catch (e: unknown) {
        const errFields: Array<{ name: Array<string | number>; errors?: string[] }> =
          (e as { errorFields?: Array<{ name: Array<string | number>; errors?: string[] }> })?.errorFields ?? [];
        const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra lại các trường bắt buộc';
        toast.error(firstError);
        if (errFields.some((f) => f.name[0] === 'geometryType' || f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule')) {
          setActiveTab('location');
        } else {
          setActiveTab('info');
        }
        return;
      }

      const values = form.getFieldsValue(true);
      const geomType = values.geometryType || 'POINT';
      const coordResult = validateDmsCoordinates(coordinateList, geomType);
      if (!coordResult.valid) {
        const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
        toast.error(errMsg);
        setGpsError(errMsg);
        setActiveTab('location');
        return;
      }

      const validCoords = coordResult.validCoords;
      const wkt = serializeCoordinatesToWkt(validCoords, geomType);

      // DatePicker year trả về dayjs → payload gửi số năm
      const rawYear = values.yearOfUse;
      const submittedYear = rawYear != null ? (dayjs.isDayjs(rawYear) ? rawYear.year() : Number(rawYear)) : undefined;

      onSubmittingChange?.(true);
      try {
        const pendingFiles = uploadedFiles.filter(f => f.originFileObj);

        if (isEdit && id) {
          const payload: UpdateScadaRequest = {
            id,
            deviceName: values.deviceName,
            detailedLocation: values.detailedLocation,
            manufacturer: values.manufacturer,
            model: values.model,
            quantity: values.quantity,
            orgUnitId: values.orgUnitId || null,
            operatingUnitId: values.operatingUnitId || null,
            provinceName: values.provinceName || null,
            attachedInfrastructureType: values.attachedInfrastructureType,
            attachedInfrastructureId: values.attachedInfrastructureId || null,
            unitOfMeasure: values.unitOfMeasure,
            yearOfUse: submittedYear,
            operationalStatus: values.operationalStatus != null ? String(values.operationalStatus) : null,
            specifications: values.specifications,
            maintenanceInformation: values.maintenanceInformation,
            note: values.note,
            latitude: validCoords.length > 0 ? validCoords[0].latitude : undefined,
            longitude: validCoords.length > 0 ? validCoords[0].longitude : undefined,
            mapSymbolId: values.mapSymbolId || null,
            coordinateSystem: values.coordinateSystem,
            displayRule: values.displayRule != null ? Number(values.displayRule) || null : undefined,
            geometryType: geomType,
            coordinates: wkt || undefined,
            ...(saveAction === 'APPROVED' ? { approvalStatus: 'APPROVED' } : {}),
          };

          await updateScada(payload);

          // Upload pending files
          for (const f of pendingFiles) {
            if (f.originFileObj) {
              await uploadScadaAttachment(id, f.originFileObj);
            }
          }

          if (saveAction === 'SUBMIT') {
            await submitScada(id);
          }

          toast.success(
            saveAction === 'DRAFT'
              ? 'Lưu tạm hệ thống SCADA thành công'
              : saveAction === 'SUBMIT'
                ? 'Lưu và gửi phê duyệt thành công'
                : 'Cập nhật và phê duyệt thành công'
          );
        } else {
          const generatedCode = values.deviceCode || (await generateScadaCode());
          const payload: CreateScadaRequest = {
            deviceCode: generatedCode,
            deviceName: values.deviceName,
            detailedLocation: values.detailedLocation,
            manufacturer: values.manufacturer,
            model: values.model,
            quantity: values.quantity ?? 1,
            orgUnitId: values.orgUnitId || null,
            operatingUnitId: values.operatingUnitId || null,
            provinceName: values.provinceName || null,
            attachedInfrastructureType: values.attachedInfrastructureType,
            attachedInfrastructureId: values.attachedInfrastructureId || null,
            unitOfMeasure: values.unitOfMeasure,
            yearOfUse: submittedYear,
            operationalStatus: values.operationalStatus != null ? String(values.operationalStatus) : '1',
            specifications: values.specifications,
            maintenanceInformation: values.maintenanceInformation,
            note: values.note,
            latitude: validCoords.length > 0 ? validCoords[0].latitude : undefined,
            longitude: validCoords.length > 0 ? validCoords[0].longitude : undefined,
            mapSymbolId: values.mapSymbolId || null,
            coordinateSystem: values.coordinateSystem,
            displayRule: values.displayRule != null ? Number(values.displayRule) || null : undefined,
            geometryType: geomType,
            coordinates: wkt || undefined,
            action: saveAction === 'DRAFT' ? 'draft' : saveAction === 'SUBMIT' ? 'submit' : 'approve',
          };

          const created = await createScada(payload);
          if (created?.id && pendingFiles.length > 0) {
            for (const f of pendingFiles) {
              if (f.originFileObj) {
                await uploadScadaAttachment(created.id, f.originFileObj);
              }
            }
          }

          toast.success(
            saveAction === 'DRAFT'
              ? 'Lưu tạm hệ thống SCADA thành công'
              : saveAction === 'SUBMIT'
                ? 'Lưu và gửi phê duyệt thành công'
                : 'Lưu và phê duyệt thành công'
          );
        }

        onSuccess();
      } catch (err: unknown) {
        console.error('[scada] submit error', err);
      } finally {
        onSubmittingChange?.(false);
      }
    },
  }));

  // Coordinate editing helpers
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

  return (
    <>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarStyle={drawerTabBarStyle}
        items={[
          {
            key: 'info',
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
                          style={selectStyle}
                          options={operatingOrgs.map(o => ({ label: o.name || o.code, value: o.id }))}
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          allowClear
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
                <div style={specSectionBoxStyle}>
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
                <div style={maintenanceSectionBoxStyle}>
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
                        <Select
                          placeholder="Chọn loại đối tượng"
                          allowClear
                          options={GEOMETRY_TYPE_OPTIONS}
                          style={selectStyle}
                          onChange={(val) => {
                            if (!val) {
                              form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined, mapSymbolId: undefined });
                              setCoordinateList([]);
                              setGpsError(null);
                            }
                          }}
                        />
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
                          loading={loadingSymbols}
                          style={selectStyle}
                        >
                          {(Array.isArray(symbols) ? symbols : []).map((sym) => (
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
                        onClick={() => setGisModalVisible(true)}
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
          {
            key: 'attachments',
            label: 'Tệp đính kèm',
            children: (
              <div style={drawerFormScrollStyle}>
                <InfrastructureAttachmentTab
                  attachments={uploadedFiles}
                  onUpload={(file) => {
                    setUploadedFiles((prev) => [...prev, file]);
                  }}
                  onDelete={async (file) => {
                    const attId = file.uid;
                    const isExisting = existingFiles.some((a) => a.id === attId);
                    if (isExisting && id) {
                      try {
                        await deleteScadaAttachment(id, attId);
                        toast.success('Xóa tệp đính kèm thành công');
                      } catch {
                        toast.error('Không thể xóa tệp đính kèm');
                        return;
                      }
                    }
                    setUploadedFiles((prev) => prev.filter((f) => f.uid !== file.uid));
                    setExistingFiles((prev) => prev.filter((a) => a.id !== attId));
                  }}
                  onDownload={(attId, fileName) => {
                    if (id) {
                      downloadScadaAttachment(id, attId, fileName);
                    }
                  }}
                />
              </div>
            ),
          },
        ]}
      />

      {/* GIS Location Selector Modal — chọn tọa độ trên bản đồ chuyên dụng (chuẩn VTS CHK) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: fontSizeLg, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span>Chọn vị trí & tọa độ trên bản đồ chuyên dụng</span>
          </div>
        }
        open={gisModalVisible}
        onCancel={() => setGisModalVisible(false)}
        destroyOnClose
        width="94vw"
        style={{ maxWidth: 1400, top: 20 }}
        footer={[
          <Button key="close" type="primary" onClick={() => setGisModalVisible(false)} style={primaryButtonStyle}>
            Xong
          </Button>,
        ]}
      >
        <div style={{ height: 520, borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType={(watchedGeometryType as 'POINT' | 'LINE' | 'POLYGON') || 'POINT'}
            height={520}
            onChange={(val) => {
              const wkt = val?.coordinates || '';
              if (wkt) {
                const points = parseWktToCoordinates(wkt);
                if (points.length > 0) {
                  setCoordinateList((prev) => {
                    const existing = prev || [];
                    const key = (p: { latitude: number; longitude: number }) => `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                    const existingKeys = new Set(existing
                      .filter((c) => c.latD != null && c.lngD != null)
                      .map((c) => key({
                        latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
                        longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
                      })));
                    const toAdd = points.filter((p) => !existingKeys.has(key(p))).map((p) => {
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

export default ScadaForm;
