/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components */
import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Tabs, Row, Col, Input, Select, Form, Space, Button, Modal, InputNumber, type InputNumberProps } from 'antd';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  BankOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { daiTtdhCRUD } from '../../services/portService';
import type { SaveAction } from '../../types/port';
import { organizationService } from '../../services/organizationService';
import { symbolService, type Symbol as IconSymbol } from '../../services/symbolService';
import api from '../../services/api';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';
import { fmtInputNumber } from '../../utils/numFmt';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';
import {
  textSecondary, textTertiary, borderDefault, actionPrimary, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField,
  surfaceCard, readonlyInputStyle, sidebarBg, textAreaStyle,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
} from '../../themetokenchk';
import { GEOMETRY_POINT_COUNT, serializeCoordinatesToWkt } from '../../utils/gisGeometry';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';

type UploadFile = { uid: string; name: string; size: number; type: string; status: string; originFileObj?: File; [key: string]: any };
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const labelProps = (text: string) => ({
  label: <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

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

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
  { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
  { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
];

/** Phân loại đài — theo CSV: Đài thông tin duyên hải loại I → V. */
export const DAI_TTDH_STATION_LEVEL_OPTIONS = [
  { value: 0, label: 'Đài thông tin duyên hải loại I' },
  { value: 1, label: 'Đài thông tin duyên hải loại II' },
  { value: 2, label: 'Đài thông tin duyên hải loại III' },
  { value: 3, label: 'Đài thông tin duyên hải loại IV' },
  { value: 4, label: 'Đài thông tin duyên hải loại V' },
];

/** Dịch vụ cung cấp — 9 dịch vụ chính thức (user chốt 2026-08-28). */
export const DAI_TTDH_SERVICES_OPTIONS = [
  { value: 'INMARSAT_DISTRESS', label: 'Dịch vụ trực canh cấp cứu INMARSAT (INMARSAT CospasSarsat Distress Watch-keeping Service)' },
  { value: 'COSPAS_SARSAT_DISTRESS', label: 'Dịch vụ trực canh cấp cứu COSPAS-SARSAT (COSPASSARSAT Distress Watch-keeping Service)' },
  { value: 'DSC_DISTRESS', label: 'Dịch vụ trực canh cấp cứu DSC (DSC Distress Watch-keeping Service)' },
  { value: 'RTP_DISTRESS', label: 'Dịch vụ trực canh cấp cứu RTP (RTP Distress Watch-keeping Service)' },
  { value: 'MSI_RTP', label: 'Dịch vụ phát MSI RTP (MSI Broadcasting Service on RTP)' },
  { value: 'MSI_NAVTEX', label: 'Dịch vụ phát MSI NAVTEX (MSI Broadcasting Service via Navtex)' },
  { value: 'MSI_EGC', label: 'Dịch vụ phát MSI EGC (MSI Broadcasting Service via EGC)' },
  { value: 'LRIT', label: 'Dịch vụ thông tin nhận dạng và truy theo tầm xa LRIT (Longrange Identification and Tracking...)' },
  { value: 'MARITIME_INFO_CONNECT', label: 'Dịch vụ kết nối thông tin ngành hàng hải' },
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

export type NumberInputWithCountProps = InputNumberProps<any> & { maxLength: number };

/** Cùng hiển thị bộ đếm số (0/n) và giới hạn như các chỉ số ở form Cầu cảng / Cảng biển. */
export function NumberInputWithCount({ maxLength, value, ...inputProps }: NumberInputWithCountProps) {
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

// Parse WKT (coordinates) từ backend — hỗ trợ POINT/MULTIPOINT/LINESTRING/POLYGON (chuẩn VTS CHK & Pier)
const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) {
      const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/);
      if (m) return m[1].split(',').map((p) => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter((c) => !isNaN(c.latitude));
    }
    if (wkt.startsWith('POLYGON((')) {
      const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/);
      if (m) {
        const pts = m[1].split(',').map((p) => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter((c) => !isNaN(c.latitude));
        if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude) pts.pop();
        return pts;
      }
    }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/);
    if (mm) return mm[1].split('),(').map((p) => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter((c) => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.-]+)\s+([\d.-]+)\)/);
    if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
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

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK & Pier: viên thuốc 999px). */
const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  const started = dVal != null || mVal != null || sVal != null;

  const inputs: Array<{
    key: string;
    base: string;
    value: number | null | undefined;
    max: number;
    radius: string;
    unit: string;
    unitStyle: React.CSSProperties;
    basis: string;
    width: number;
    step: number;
    formatter?: (v: any) => string;
    msg?: string;
    onEdit: (v: number | null) => void;
  }> = [
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
  ];

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
            onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select()}
            onChange={(raw: number | null) => inp.onEdit(raw == null ? null : Number(raw))}
            style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32 }}
            controls={false}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

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

export interface DaiTtdhFormProps {
  form: any;
  id?: string;
  onFinish: (saved: boolean) => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

const DaiTtdhForm = forwardRef<any, DaiTtdhFormProps>(({ form, id, onFinish, onSubmittingChange }, ref) => {
  const isEdit = !!id;
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [orgUnits, setOrgUnits] = useState<Array<{ id: string; name: string; code?: string; parentId?: string }>>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [symbols, setSymbols] = useState<IconSymbol[]>([]);
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [daiTtdhCodeLoading, setDaiTtdhCodeLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [pendingDeletedAttachmentIds, setPendingDeletedAttachmentIds] = useState<string[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [gpsPage] = useState(1);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('*') ?? false;

  const watchedGeometryType = Form.useWatch('geometryType', form);

  useEffect(() => {
    (async () => {
      setLoadingOrgs(true);
      try {
        const r = await organizationService.list({ pageSize: 1000 });
        setOrgUnits(r.data || []);
      } catch {
        /* silent */
      } finally {
        setLoadingOrgs(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => map.set(u.id, u.fullName || u.username || u.id));
        setUserMap(map);
      } catch {
        /* silent */
      }
    })();
  }, []);

  useEffect(() => {
    api.get('/common/options/operating-units').then((r) => {
      const list = r.data?.data;
      if (Array.isArray(list) && list.length) setOperatingOrgs(list);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingSymbols(true);
      try {
        const r = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        setSymbols(r.data || (r as any).content || []);
      } catch {
        /* silent */
      } finally {
        setLoadingSymbols(false);
      }
    })();
  }, []);

  // Tự sinh mã DTTDH-{seq} khi tạo mới
  useEffect(() => {
    if (isEdit) return;
    let isMounted = true;
    (async () => {
      setDaiTtdhCodeLoading(true);
      try {
        const res = await daiTtdhCRUD.generateCode();
        const code = res?.daiTtdhCode;
        if (code && isMounted) form.setFieldsValue({ daiTtdhCode: code });
      } catch {
        /* silent */
      } finally {
        if (isMounted) setDaiTtdhCodeLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [isEdit, form]);

  // Load existing data in Edit mode
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const d: any = await daiTtdhCRUD.findById(id);
        form.setFieldsValue({
          orgUnitId: d.orgUnitId,
          operatingUnitId: d.operatingUnitId,
          daiTtdhCode: d.daiTtdhCode,
          daiTtdhName: d.daiTtdhName,
          stationLevel: d.stationLevel,
          provinceId: d.provinceId ? (VIETNAM_PROVINCES[d.provinceId - 1] ?? undefined) : undefined,
          detailedLocation: d.detailedLocation,
          operationalStatus: d.operationalStatus || undefined,
          servicesProvided: d.servicesProvided ? d.servicesProvided.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          coverageArea: d.coverageArea,
          remarks: d.remarks,
          geometryType: d.geometryType || undefined,
          mapSymbolId: d.mapSymbolId || d.bieuTuongId || d.symbolId,
          coordinateSystem: d.geometryType ? (d.coordinateSystem ?? 1) : undefined,
          displayRule: d.geometryType ? (d.displayRule && d.displayRule !== '1' ? d.displayRule : 'Độ, phút, giây (DMS)') : undefined,
        });
        const pts = d.coordinates ? parseGisCoordinates({ geometryType: d.geometryType, coordinates: d.coordinates }) : [];
        if (pts.length > 0) {
          setCoordinateList(pts.map((c) => {
            const latDms = ddToDms(c.latitude);
            const lngDms = ddToDms(c.longitude);
            return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
          }));
        } else if (d.latitude != null && d.longitude != null) {
          const latDms = ddToDms(Number(d.latitude));
          const lngDms = ddToDms(Number(d.longitude));
          setCoordinateList([{ latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s }]);
        }
        try {
          const fr = await api.get(`/v1/dai-ttdh/${id}/attachments`);
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
        } catch {
          /* silent */
        }
      } catch {
        toast.error('Không thể tải thông tin đài TTDH');
      }
    })();
  }, [isEdit, id, form]);

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
    api.get(`/v1/dai-ttdh/${id}/attachments/${uid}/download`, { responseType: 'blob' })
      .then((response) => {
        if (!triggerBlobDownload(response.data, name || 'attachment')) toast.error('Không thể tải xuống tệp đính kèm');
      })
      .catch(() => toast.error('Không thể tải xuống tệp đính kèm'));
  };

  const handleBeforeUpload = (file: File) => {
    if (file.size > MAX_FILE_SIZE) { toast.error('Kích thước file tối đa 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    const nowIso = dayjs().toISOString();
    const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
    const newUid = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setUploadedFiles((prev) => [
      ...prev,
      {
        uid: newUid,
        id: newUid,
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

  const handleRemoveFile = (file: UploadFile) => {
    const target = uploadedFiles.find((x: any) => x.uid === file.uid || x.id === file.uid);
    if (target && !target.originFileObj) {
      const attId = (target as any).id || target.uid;
      if (attId) setPendingDeletedAttachmentIds((prev) => [...prev, attId]);
    }
    setUploadedFiles((prev) => prev.filter((x: any) => x.uid !== file.uid && x.id !== file.uid));
  };

  const addGpsPoint = () => { setCoordinateList([...coordinateList, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]); };
  const removeCoordinate = (i: number) => { setCoordinateList(coordinateList.filter((_, idx) => idx !== i)); };
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
  };

  const handleSave = useCallback(async (saveAction: SaveAction) => {
    const vals = form.getFieldsValue();
    try {
      await form.validateFields();
    } catch (e: any) {
      const errFields: Array<{ name: Array<string | number>; errors?: string[] }> = e?.errorFields ?? [];
      const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc (*)';
      toast.error(firstError);
      if (errFields.some((f) => f.name[0] === 'mapSymbolId' || f.name[0] === 'coordinateSystem' || f.name[0] === 'displayRule' || f.name[0] === 'geometryType')) {
        setActiveTabKey('location');
      } else {
        setActiveTabKey('general');
      }
      return;
    }

    if (!vals.provinceId) {
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

      if (vals.geometryType === 'POINT' && validCoords.length > 1) {
        setActiveTabKey('location');
        toast.error('Loại đối tượng điểm chỉ cho phép 1 tọa độ GPS');
        return;
      }

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
    const coordsFormatted = validCoords.map((c) => ({
      latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
      longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
    }));
    const wktCoordinates = vals.geometryType && validCoords.length > 0
      ? serializeCoordinatesToWkt(coordsFormatted, vals.geometryType || 'POINT')
      : undefined;

    onSubmittingChange?.(true);
    try {
      const provinceIndex = vals.provinceId
        ? (typeof vals.provinceId === 'number' ? vals.provinceId : VIETNAM_PROVINCES.indexOf(vals.provinceId) + 1)
        : undefined;

      const payload: Record<string, unknown> = {
        orgUnitId: vals.orgUnitId,
        operatingUnitId: vals.operatingUnitId || undefined,
        daiTtdhCode: vals.daiTtdhCode?.trim(),
        daiTtdhName: vals.daiTtdhName?.trim(),
        stationLevel: vals.stationLevel != null ? Number(vals.stationLevel) : undefined,
        provinceId: provinceIndex && provinceIndex > 0 ? provinceIndex : undefined,
        detailedLocation: vals.detailedLocation?.trim() || undefined,
        operationalStatus: vals.operationalStatus || undefined,
        coverageArea: vals.coverageArea?.trim() || undefined,
        servicesProvided: Array.isArray(vals.servicesProvided)
          ? (vals.servicesProvided.length > 0 ? vals.servicesProvided.join(',') : undefined)
          : (vals.servicesProvided || undefined),
        remarks: vals.remarks?.trim() || undefined,
        geometryType: vals.geometryType || undefined,
        mapSymbolId: vals.mapSymbolId || undefined,
        coordinateSystem: vals.coordinateSystem,
        displayRule: vals.displayRule,
      };
      (payload as any).latitude = coordsFormatted.length > 0 ? coordsFormatted[0].latitude : undefined;
      (payload as any).longitude = coordsFormatted.length > 0 ? coordsFormatted[0].longitude : undefined;
      (payload as any).coordinates = wktCoordinates || undefined;

      if (saveAction !== 'UPDATE') (payload as any).saveAction = saveAction;
      Object.keys(payload).forEach((k) => { if (payload[k] === undefined) delete payload[k]; });

      let createdId: string | undefined;
      if (isEdit && id) {
        await api.put('/v1/dai-ttdh', { ...payload, id });
        createdId = id;
      } else {
        const res = await api.post('/v1/dai-ttdh', payload);
        createdId = res.data?.data?.id ?? res.data?.id;
      }

      if (createdId && pendingDeletedAttachmentIds.length > 0) {
        await Promise.all(
          pendingDeletedAttachmentIds.map((attId) =>
            api.delete(`/v1/dai-ttdh/${createdId}/attachments/${attId}`).catch(() => {})
          )
        );
      }

      if (createdId && uploadedFiles.length > 0) {
        const newFiles = uploadedFiles.filter((fi: any) => fi && fi.originFileObj);
        if (newFiles.length > 0) {
          const fd = new FormData();
          newFiles.forEach((fi: any) => fd.append('files', fi.originFileObj as File));
          try {
            await api.post(`/v1/dai-ttdh/${createdId}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success(`Đã tải lên ${newFiles.length} tệp đính kèm`);
          } catch {
            toast.error('Tải lên tệp đính kèm thất bại');
          }
        }
      }

      toast.success(saveAction === 'DRAFT' ? 'Lưu tạm thành công' : saveAction === 'APPROVED' ? 'Phê duyệt thành công' : saveAction === 'UPDATE' ? 'Cập nhật thành công' : 'Gửi phê duyệt thành công');
      onFinish(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      onSubmittingChange?.(false);
    }
  }, [form, isEdit, id, uploadedFiles, pendingDeletedAttachmentIds, onFinish, coordinateList, onSubmittingChange]);

  useImperativeHandle(ref, () => ({ submit: (saveAction: SaveAction) => handleSave(saveAction) }), [handleSave]);

  const tabItems = [
    // Tab 1: Thông tin chung — cùng cấu trúc section card với Cầu cảng / Cảng biển.
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={drawerFormScrollStyle}>
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <BankOutlined style={{ color: actionPrimary }} />
                <span>Thông tin cơ bản & Quản lý vận hành</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="orgUnitId"
                  {...labelProps('Đơn vị quản lý')}
                  required
                  rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <OrgUnitTreeSelect
                    organizations={orgUnits}
                    placeholder="Chọn đơn vị quản lý..."
                    loading={loadingOrgs}
                    disabled={isEdit && !isSystemAdmin}
                    showPath
                    treeDefaultExpandAll={false}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="operatingUnitId"
                  {...labelProps('Đơn vị khai thác')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    placeholder="Chọn đơn vị khai thác..."
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={operatingOrgs.map((o) => ({ value: o.id, label: o.name || o.code }))}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="daiTtdhCode"
                  {...labelProps('Mã đài')}
                  style={{ marginBottom: spaceFormField }}
                  tooltip="Mã được sinh tự động"
                >
                  <Input
                    disabled
                    placeholder={daiTtdhCodeLoading ? 'Đang sinh mã...' : 'Mã tự động'}
                    style={readonlyInputStyle}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="daiTtdhName"
                  {...labelProps('Tên đài')}
                  required
                  rules={[{ required: true, message: 'Tên đài không được để trống' }, { max: 255 }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input placeholder="Nhập tên đài" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="stationLevel"
                  {...labelProps('Phân loại đài')}
                  required
                  rules={[{ required: true, message: 'Phân loại đài không được để trống' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select placeholder="Chọn phân loại đài" options={DAI_TTDH_STATION_LEVEL_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="operationalStatus"
                  {...labelProps('Tình trạng')}
                  required
                  initialValue="NOT_YET_OPERATIONAL"
                  rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select placeholder="Chọn tình trạng" options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="provinceId"
                  {...labelProps('Địa điểm (Tỉnh/Thành Phố)')}
                  required
                  rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    showSearch
                    placeholder="Chọn tỉnh/thành phố"
                    filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
                    options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="servicesProvided"
                  {...labelProps('Dịch vụ cung cấp')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    mode="multiple"
                    showSearch
                    placeholder="Chọn dịch vụ cung cấp"
                    allowClear
                    optionFilterProp="label"
                    options={DAI_TTDH_SERVICES_OPTIONS}
                    style={{ borderRadius: radiusPill }}
                    maxTagCount="responsive"
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
                >
                  <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  name="coverageArea"
                  {...labelProps('Vùng phủ sóng')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input.TextArea rows={3} placeholder="Nhập vùng phủ sóng" maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  name="remarks"
                  {...labelProps('Ghi chú')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input.TextArea rows={3} placeholder="Nhập ghi chú" maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
      ),
    },
    // Tab 2: Thông tin vị trí — tách thông số bản đồ và bảng GPS như Cầu cảng.
    {
      key: 'location',
      label: `Thông tin vị trí (${coordinateList.length})`,
      children: (
        <div style={drawerFormScrollStyle}>
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
                      } else {
                        form.setFieldsValue({
                          displayRule: 'Độ, phút, giây (DMS)',
                          coordinateSystem: form.getFieldValue('coordinateSystem') ?? 1,
                        });
                        const count = GEOMETRY_POINT_COUNT[val] ?? 1;
                        setCoordinateList((prev) => {
                          if (val === 'POINT' && prev.length > 1) return prev.slice(0, 1);
                          if (prev.length >= count) return prev;
                          const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
                          return [...prev, ...added];
                        });
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
                  <Select
                    placeholder="Chọn biểu tượng bản đồ"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    disabled={!watchedGeometryType}
                    loading={loadingSymbols}
                    style={selectStyle}
                  >
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
                  title={!watchedGeometryType ? 'Vui lòng chọn loại đối tượng trước khi chọn tọa độ trên bản đồ' : undefined}
                >
                  Chọn tọa độ trên bản đồ
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined style={{ color: (!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)) ? 'rgba(0, 0, 0, 0.25)' : undefined }} />}
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
                  title={!watchedGeometryType ? 'Vui lòng chọn loại đối tượng trước khi thêm tọa độ' : (watchedGeometryType === 'POINT' && coordinateList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined)}
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
        </div>
      ),
    },
    // Tab 3: File đính kèm
    {
      key: 'files',
      label: `File đính kèm (${uploadedFiles.length})`,
      children: (
        <InfrastructureAttachmentTab
          attachments={uploadedFiles.map((file: any) => {
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
              uploadedByName: uploadedByName || currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
              uploadedDate: attachment.uploadedDate || attachment.uploadedAt || attachment.createdAt || dayjs().toISOString(),
            };
          })}
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

      {/* GIS Location Selector Modal — chọn tọa độ trên bản đồ chuyên dụng (chuẩn VTS CHK & PierForm) */}
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
                const points = parseGisCoordinates({ geometryType: val.geometryType, coordinates: val.coordinates });
                if (points.length > 0) {
                  setCoordinateList((prev) => {
                    if (watchedGeometryType === 'POINT') {
                      const p = points[0];
                      const latDms = ddToDms(p.latitude);
                      const lngDms = ddToDms(p.longitude);
                      return [{ latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s }];
                    }
                    const current = Array.isArray(prev) ? prev : [];
                    const isFilled = (c: { latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }) =>
                      c.latD != null || c.latM != null || c.latS != null || c.lngD != null || c.lngM != null || c.lngS != null;
                    const key = (p: { latitude: number; longitude: number }) => `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                    const existingKeys = new Set(current
                      .filter(isFilled)
                      .map((c) => key({ latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600, longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600 })));
                    const fresh = points.filter((p) => !existingKeys.has(key(p)));
                    const toDmsRows = (ps: Array<{ latitude: number; longitude: number }>) => ps.map((p) => {
                      const latDms = ddToDms(p.latitude);
                      const lngDms = ddToDms(p.longitude);
                      return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
                    });
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

DaiTtdhForm.displayName = 'DaiTtdhForm';
export default DaiTtdhForm;
