import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  Tabs, Row, Col, Input, Select, InputNumber, DatePicker, Form, Space, Button, Modal, Drawer,
  type InputNumberProps,
} from 'antd';
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
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { anchorageCRUD, portCRUD, buoyBerthCRUD } from '../../services/portService';
import { organizationService, type Organization } from '../../services/organizationService';
import { symbolService, type Symbol as IconSymbol } from '../../services/symbolService';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import { userService } from '../../services/userService';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';
import { fmtInputNumber } from '../../utils/numFmt';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { GEOMETRY_POINT_COUNT, validateDmsCoordinates, serializeCoordinatesToWkt } from '../../utils/gisGeometry';
import { DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';
import {
  textSecondary, textTertiary, borderDefault, actionPrimary, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField,
  surfaceCard, readonlyInputStyle, sidebarBg, textAreaStyle,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
  getDatePickerProps, drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
} from '../../themetokenchk';

type SaveAction = 'DRAFT' | 'SUBMIT' | 'SAVE_AND_APPROVE' | 'APPROVED' | 'UPDATE';
type UploadFile = { uid: string; name: string; size: number; type: string; status: string; originFileObj?: File };
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

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
const numberStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
  { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
  { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
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

type NumberInputWithCountProps = InputNumberProps<number> & { maxLength: number };

function NumberInputWithCount({ maxLength, value, ...inputProps }: NumberInputWithCountProps) {
  const count = String(value ?? '').length;
  return (
    <InputNumber
      {...inputProps}
      value={value}
      maxLength={maxLength}
      suffix={<span aria-label={`${count} trên ${maxLength} ký tự`} style={{ color: textSecondary, fontSize: portFormFontSizeMd }}>{count}/{maxLength}</span>}
    />
  );
}

const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) {
      const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/);
      if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    }
    if (wkt.startsWith('POLYGON((')) {
      const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/);
      if (m) {
        const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
        if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude) pts.pop();
        return pts;
      }
    }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/);
    if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
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

export interface AnchorageFormHandle {
  submit: (saveAction: SaveAction) => Promise<boolean | void>;
}

export interface AnchorageFormProps {
  form: any;
  id?: string;
  onFinish: (success?: boolean) => void;
  onSubmittingChange?: (val: boolean) => void;
}

export interface MooringWaterAreaItem {
  description: string;
  geometryType?: string;
  mapSymbolId?: string;
  coordinateSystem?: number;
  displayRule?: string;
  anchorPoints?: Array<{ name?: string; latitude?: number; longitude?: number }>;
}

const AnchorageForm = forwardRef<AnchorageFormHandle, AnchorageFormProps>(({
  form,
  id,
  onFinish,
  onSubmittingChange,
}, ref) => {
  const isEdit = Boolean(id);
  const currentUser = useAuthStore((s) => s.user);
  const [activeTabKey, setActiveTabKey] = useState('general');

  // Accordion section collapse states
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [waterAreaOpen, setWaterAreaOpen] = useState(false);

  // Dropdown options & loading
  const [orgUnits, setOrgUnits] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [waterwayOptions, setWaterwayOptions] = useState<{ value: string; label: string }[]>([]);
  const [buoyStationOptions, setBuoyStationOptions] = useState<{ value: string; label: string }[]>([]);
  const [symbols, setSymbols] = useState<IconSymbol[]>([]);
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [anchorageCodeLoading, setAnchorageCodeLoading] = useState(false);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  // Watched fields
  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);
  const watchedGeometryType = Form.useWatch('geometryType', form);

  // GPS Coordinates (Tab 2)
  const [coordinateList, setCoordinateList] = useState<Array<{
    latD: number | null; latM: number | null; latS: number | null;
    lngD: number | null; lngM: number | null; lngS: number | null;
  }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);

  // Attachments (Tab 3)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Mooring Water Areas (Khu nước neo buộc tàu)
  const [waterAreaList, setWaterAreaList] = useState<MooringWaterAreaItem[]>([]);
  const [waterAreaDrawerOpen, setWaterAreaDrawerOpen] = useState(false);
  const [editingWaterAreaIndex, setEditingWaterAreaIndex] = useState<number | null>(null);
  const [waterAreaDescription, setWaterAreaDescription] = useState('');
  const [waterAreaGeometryType, setWaterAreaGeometryType] = useState<string | undefined>('POINT');
  const [waterAreaMapSymbolId, setWaterAreaMapSymbolId] = useState<string | undefined>();
  const [waterAreaCoordinateSystem, setWaterAreaCoordinateSystem] = useState<number | undefined>(1);
  const [waterAreaDisplayRule, setWaterAreaDisplayRule] = useState<string | undefined>('Độ, phút, giây (DMS)');
  const [waterAreaAnchorPoints, setWaterAreaAnchorPoints] = useState<Array<{
    name: string;
    latD: number | null; latM: number | null; latS: number | null;
    lngD: number | null; lngM: number | null; lngS: number | null;
  }>>([]);

  const editPortIdRef = useRef<string | undefined>(undefined);

  // Character limit warning helper (matching PierForm)
  const useMaxReached = (fieldName: string, maxLen: number) => {
    const val = Form.useWatch(fieldName, form);
    return Boolean(val && String(val).length >= maxLen);
  };

  const atMax = {
    anchorageName: useMaxReached('anchorageName', 255),
    detailedLocation: useMaxReached('detailedLocation', 500),
    shapeDescription: useMaxReached('shapeDescription', 255),
    remarks: useMaxReached('remarks', 2000),
    publicDecision: useMaxReached('publicDecision', 2000),
    investmentAgreement: useMaxReached('investmentAgreement', 2000),
  };

  // Load organizations
  useEffect(() => {
    (async () => {
      setLoadingOrgs(true);
      try {
        const r = await organizationService.list({ pageSize: 1000 });
        setOrgUnits(r.data || []);
      } catch { /* silent */ }
      finally { setLoadingOrgs(false); }
    })();
  }, []);

  // Load users for attachment display
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

  // Load symbols
  useEffect(() => {
    (async () => {
      setLoadingSymbols(true);
      try {
        const r = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        setSymbols(r.data || (r as any).content || []);
      } catch { /* silent */ }
      finally { setLoadingSymbols(false); }
    })();
  }, []);

  // Load waterways
  useEffect(() => {
    navigationChannelCRUD.search({ approvalStatus: 'APPROVED', page: 0, size: 1000 })
      .then(r => setWaterwayOptions((r.items || []).map(n => ({ value: n.id, label: n.channelName || n.channelCode || '' }))))
      .catch(() => {});
  }, []);

  // Load buoy stations
  useEffect(() => {
    buoyBerthCRUD.search({ page: 1, pageSize: 1000, approvalStatus: 'APPROVED' })
      .then(r => setBuoyStationOptions((r.data || []).map(b => ({ value: b.id, label: b.buoyBerthName || b.buoyBerthCode || '' }))))
      .catch(() => {});
  }, []);

  // Filter ports when orgUnit changes
  useEffect(() => {
    if (!watchedOrgUnitId) {
      setPortOptions([]);
      return;
    }
    (async () => {
      setLoadingPorts(true);
      try {
        const r = await portCRUD.findAll({ orgUnitId: watchedOrgUnitId, approvalStatus: 'APPROVED', page: 1, size: 1000 });
        setPortOptions((r.data || []).map((p: any) => ({ value: p.id, label: p.portName })));
      } catch { /* silent */ }
      finally { setLoadingPorts(false); }
    })();
  }, [watchedOrgUnitId]);

  // Auto-generate code when portId selected (for create mode)
  useEffect(() => {
    if (!watchedPortId || (isEdit && editPortIdRef.current === watchedPortId)) return;
    setAnchorageCodeLoading(true);
    anchorageCRUD.generateCode(watchedPortId)
      .then((res: any) => {
        const code = res?.anchorageCode ?? res?.data?.anchorageCode;
        if (code) form.setFieldsValue({ anchorageCode: code });
      })
      .catch(() => {})
      .finally(() => setAnchorageCodeLoading(false));
  }, [watchedPortId, isEdit, form]);

  // Sync geometryType to coordinateList
  useEffect(() => {
    if (!watchedGeometryType) {
      form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
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
        if (prev.length >= count) return prev;
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      });
    }
  }, [watchedGeometryType, isEdit, form]);

  // Load initial data for Edit mode
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const d: any = await anchorageCRUD.findById(id);
        editPortIdRef.current = d.portId;
        form.setFieldsValue({
          orgUnitId: d.orgUnitId,
          portId: d.portId,
          navigationChannelId: d.navigationChannelId,
          buoyStationId: d.buoyStationId,
          anchorageCode: d.anchorageCode,
          anchorageName: d.anchorageName,
          provinceId: d.provinceId ? VIETNAM_PROVINCES[d.provinceId - 1] ?? undefined : undefined,
          detailedLocation: d.detailedLocation,
          operationalStatus: d.operationalStatus || undefined,
          shapeDescription: d.shapeDescription,
          area: d.area,
          designWaterDepth: d.designWaterDepth,
          currentWaterDepth: d.currentWaterDepth,
          bottomElevationDesign: d.bottomElevationDesign,
          maxVesselDWT: d.maxVesselDWT,
          activeAnchorageCount: d.activeAnchorageCount,
          publishedAnchorageCount: d.publishedAnchorageCount,
          underInvestmentAnchorageCount: d.underInvestmentAnchorageCount,
          remarks: d.remarks,
          openingAnnouncementDate: d.openingAnnouncementDate ? dayjs(d.openingAnnouncementDate) : undefined,
          publicDecision: d.publicDecision,
          investmentAgreement: d.investmentAgreement,
          geometryType: d.geometryType || undefined,
          mapSymbolId: d.mapSymbolId,
          coordinateSystem: d.coordinateSystem ?? 1,
          displayRule: d.displayRule || 'Độ, phút, giây (DMS)',
        });

        // Parse coordinates
        const ec = d.coordinates ? parseGisCoordinates({ geometryType: d.geometryType, coordinates: d.coordinates }) : [];
        if (ec.length > 0) {
          setCoordinateList(ec.map(c => {
            const latDms = ddToDms(c.latitude);
            const lngDms = ddToDms(c.longitude);
            return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
          }));
        } else if (d.latitude != null && d.longitude != null) {
          const latDms = ddToDms(Number(d.latitude));
          const lngDms = ddToDms(Number(d.longitude));
          setCoordinateList([{ latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s }]);
        }

        // Mooring water areas
        if (Array.isArray(d.mooringWaterAreas) && d.mooringWaterAreas.length > 0) {
          setWaterAreaList(d.mooringWaterAreas.map((w: any) => ({
            description: w.description ?? '',
            geometryType: w.geometryType,
            mapSymbolId: w.mapSymbolId,
            coordinateSystem: w.coordinateSystem,
            displayRule: w.displayRule,
            anchorPoints: Array.isArray(w.anchorPoints)
              ? w.anchorPoints.map((p: any) => ({ name: p.name, latitude: p.latitude, longitude: p.longitude }))
              : [],
          })));
        }

        // Attachments
        try {
          const fr = await api.get(`/v1/anchorage/${id}/attachments`);
          const files = fr.data?.data || [];
          setUploadedFiles(files.map((a: any) => ({
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
          })));
        } catch { setUploadedFiles([]); }
      } catch {
        toast.error('Không thể tải thông tin khu neo đậu');
      }
    })();
  }, [isEdit, id, form]);

  const handleOrgUnitChange = () => {
    form.setFieldsValue({ portId: undefined, anchorageCode: undefined });
    setCoordinateList([]);
  };

  const handlePortChange = () => {
    form.setFieldsValue({ anchorageCode: undefined });
  };

  // Attachment upload/download helpers
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
    api.get(`/v1/anchorage/${id}/attachments/${uid}/download`, { responseType: 'blob' })
      .then((response) => {
        if (!triggerBlobDownload(response.data, name || 'attachment')) toast.error('Không thể tải xuống tệp đính kèm');
      })
      .catch(() => toast.error('Không thể tải xuống tệp đính kèm'));
  };

  const handleBeforeUpload = (file: File) => {
    if (file.size > MAX_FILE_SIZE) { toast.error('Kích thước file tối đa 20MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
      toast.error('Định dạng không hỗ trợ');
      return false;
    }
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

  const handleRemoveFile = (file: UploadFile) => {
    setUploadedFiles(prev => prev.filter(x => x.uid !== file.uid));
  };

  // GPS points
  const addGpsPoint = () => {
    setCoordinateList([...coordinateList, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
    setGpsError(null);
  };
  const removeCoordinate = (i: number) => {
    setCoordinateList(coordinateList.filter((_, idx) => idx !== i));
    setGpsError(null);
  };
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

  // Mooring water area drawer helpers
  const openAddWaterArea = () => {
    setEditingWaterAreaIndex(null);
    setWaterAreaDescription('');
    setWaterAreaGeometryType('POINT');
    setWaterAreaMapSymbolId(undefined);
    setWaterAreaCoordinateSystem(1);
    setWaterAreaDisplayRule('Độ, phút, giây (DMS)');
    setWaterAreaAnchorPoints([]);
    setWaterAreaDrawerOpen(true);
  };

  const openEditWaterArea = (i: number) => {
    const item = waterAreaList[i];
    setEditingWaterAreaIndex(i);
    setWaterAreaDescription(item.description || '');
    setWaterAreaGeometryType(item.geometryType || 'POINT');
    setWaterAreaMapSymbolId(item.mapSymbolId);
    setWaterAreaCoordinateSystem(item.coordinateSystem ?? 1);
    setWaterAreaDisplayRule(item.displayRule || 'Độ, phút, giây (DMS)');
    setWaterAreaAnchorPoints(item.anchorPoints ? item.anchorPoints.map(p => {
      const latDms = ddToDms(p.latitude);
      const lngDms = ddToDms(p.longitude);
      return { name: p.name || '', latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
    }) : []);
    setWaterAreaDrawerOpen(true);
  };

  const closeWaterAreaDrawer = () => {
    setWaterAreaDrawerOpen(false);
    setEditingWaterAreaIndex(null);
  };

  const removeWaterArea = (i: number) => {
    setWaterAreaList(p => p.filter((_, idx) => idx !== i));
  };

  const addAnchorPoint = () => {
    setWaterAreaAnchorPoints(p => [...p, { name: '', latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
  };
  const removeAnchorPoint = (i: number) => {
    setWaterAreaAnchorPoints(p => p.filter((_, idx) => idx !== i));
  };
  const updateAnchorPointName = (i: number, name: string) => {
    setWaterAreaAnchorPoints(p => { const n = [...p]; n[i] = { ...n[i], name }; return n; });
  };
  const updateAnchorPointCoord = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    setWaterAreaAnchorPoints(p => {
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

  const saveWaterArea = () => {
    if (!waterAreaDescription.trim()) {
      toast.error('Phạm vi khu nước neo buộc tàu không được để trống');
      return;
    }
    const item: MooringWaterAreaItem = {
      description: waterAreaDescription.trim(),
      geometryType: waterAreaGeometryType,
      mapSymbolId: waterAreaMapSymbolId,
      coordinateSystem: waterAreaCoordinateSystem,
      displayRule: waterAreaDisplayRule,
      anchorPoints: waterAreaAnchorPoints
        .filter(p => p.name.trim() || p.latD != null || p.lngD != null)
        .map(p => ({
          name: p.name.trim(),
          latitude: (p.latD ?? 0) + (p.latM ?? 0) / 60 + (p.latS ?? 0) / 3600,
          longitude: (p.lngD ?? 0) + (p.lngM ?? 0) / 60 + (p.lngS ?? 0) / 3600,
        })),
    };
    setWaterAreaList(prev => {
      if (editingWaterAreaIndex == null) return [...prev, item];
      const n = [...prev];
      n[editingWaterAreaIndex] = item;
      return n;
    });
    closeWaterAreaDrawer();
  };

  // Main Save logic
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
      return false;
    }

    if (!vals.provinceId) {
      toast.error('Địa điểm (Tỉnh/Thành Phố) là bắt buộc');
      setActiveTabKey('general');
      return false;
    }
    if (!vals.operationalStatus) {
      toast.error('Tình trạng là bắt buộc');
      setActiveTabKey('general');
      return false;
    }

    // Validate coordinates
    const coordResult = validateDmsCoordinates(coordinateList, vals.geometryType);
    if (!coordResult.valid) {
      const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
      toast.error(errMsg);
      setGpsError(errMsg);
      setActiveTabKey('location');
      return false;
    }
    const validCoords = coordResult.validCoords;
    const wktCoordinates = serializeCoordinatesToWkt(validCoords, vals.geometryType || 'POINT');

    onSubmittingChange?.(true);
    try {
      const provinceIndex = VIETNAM_PROVINCES.indexOf(vals.provinceId);
      const provinceNumber = provinceIndex >= 0 ? provinceIndex + 1 : undefined;

      const mooringPayload = waterAreaList
        .filter(w => w.description && w.description.trim())
        .map(w => ({
          description: w.description.trim(),
          geometryType: w.geometryType || undefined,
          mapSymbolId: w.mapSymbolId || undefined,
          coordinateSystem: w.coordinateSystem != null ? Number(w.coordinateSystem) : undefined,
          displayRule: w.displayRule || undefined,
          anchorPoints: (w.anchorPoints || [])
            .filter(p => p.name?.trim() || (p.latitude != null && p.longitude != null))
            .map(p => ({
              name: p.name?.trim() || undefined,
              latitude: p.latitude != null && !isNaN(Number(p.latitude)) ? Number(p.latitude) : undefined,
              longitude: p.longitude != null && !isNaN(Number(p.longitude)) ? Number(p.longitude) : undefined,
            })),
        }));

      const payload: Record<string, unknown> = {
        orgUnitId: vals.orgUnitId,
        portId: vals.portId,
        navigationChannelId: vals.navigationChannelId || undefined,
        buoyStationId: vals.buoyStationId || undefined,
        anchorageCode: vals.anchorageCode?.trim() || undefined,
        anchorageName: vals.anchorageName?.trim(),
        provinceId: provinceNumber,
        detailedLocation: vals.detailedLocation?.trim() || undefined,
        operationalStatus: vals.operationalStatus || undefined,
        shapeDescription: vals.shapeDescription?.trim() || undefined,
        area: vals.area != null && !isNaN(Number(vals.area)) ? Number(vals.area) : undefined,
        designWaterDepth: vals.designWaterDepth != null && !isNaN(Number(vals.designWaterDepth)) ? Number(vals.designWaterDepth) : undefined,
        currentWaterDepth: vals.currentWaterDepth != null && !isNaN(Number(vals.currentWaterDepth)) ? Number(vals.currentWaterDepth) : undefined,
        bottomElevationDesign: vals.bottomElevationDesign != null && !isNaN(Number(vals.bottomElevationDesign)) ? Number(vals.bottomElevationDesign) : undefined,
        maxVesselDWT: vals.maxVesselDWT != null && !isNaN(Number(vals.maxVesselDWT)) ? Number(vals.maxVesselDWT) : undefined,
        activeAnchorageCount: vals.activeAnchorageCount != null && !isNaN(Number(vals.activeAnchorageCount)) ? Number(vals.activeAnchorageCount) : undefined,
        publishedAnchorageCount: vals.publishedAnchorageCount != null && !isNaN(Number(vals.publishedAnchorageCount)) ? Number(vals.publishedAnchorageCount) : undefined,
        underInvestmentAnchorageCount: vals.underInvestmentAnchorageCount != null && !isNaN(Number(vals.underInvestmentAnchorageCount)) ? Number(vals.underInvestmentAnchorageCount) : undefined,
        remarks: vals.remarks?.trim() || undefined,
        openingAnnouncementDate: vals.openingAnnouncementDate ? dayjs(vals.openingAnnouncementDate).format('YYYY-MM-DDTHH:mm:ss') : undefined,
        publicDecision: vals.publicDecision?.trim() || undefined,
        investmentAgreement: vals.investmentAgreement?.trim() || undefined,
        geometryType: vals.geometryType || undefined,
        mapSymbolId: vals.mapSymbolId || undefined,
        coordinateSystem: vals.coordinateSystem != null ? Number(vals.coordinateSystem) : undefined,
        displayRule: vals.displayRule || undefined,
        latitude: validCoords.length > 0 ? validCoords[0].latitude : undefined,
        longitude: validCoords.length > 0 ? validCoords[0].longitude : undefined,
        coordinates: wktCoordinates || undefined,
        mooringWaterAreas: mooringPayload.length > 0 ? mooringPayload : undefined,
      };

      if (saveAction !== 'UPDATE') {
        payload.saveAction = saveAction;
      }
      Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });

      let createdId: string | undefined;
      if (isEdit && id) {
        await anchorageCRUD.update({ ...payload, id } as any);
        createdId = id;
      } else {
        const res: any = await anchorageCRUD.create(payload as any);
        createdId = res?.id ?? res?.data?.id;
      }

      // Upload newly added files
      if (createdId && uploadedFiles.length > 0) {
        let uploaded = 0;
        for (const fi of uploadedFiles) {
          const of = fi.originFileObj as File;
          if (!of) continue;
          try {
            const fd = new FormData();
            fd.append('files', of);
            await api.post(`/v1/anchorage/${createdId}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            uploaded++;
          } catch {
            toast.error(`Tải lên tệp "${fi.name}" thất bại`);
          }
        }
        if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
      }

      toast.success(
        saveAction === 'DRAFT'
          ? 'Lưu tạm thành công'
          : saveAction === 'APPROVED'
            ? 'Phê duyệt thành công'
            : saveAction === 'UPDATE'
              ? 'Cập nhật thành công'
              : 'Gửi phê duyệt thành công'
      );
      onFinish(true);
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      return false;
    } finally {
      onSubmittingChange?.(false);
    }
  }, [form, isEdit, id, uploadedFiles, waterAreaList, coordinateList, onFinish, onSubmittingChange]);

  useImperativeHandle(ref, () => ({ submit: (saveAction: SaveAction) => handleSave(saveAction) }), [handleSave]);

  const tabItems = [
    // Tab 1: Thông tin chung
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={drawerFormScrollStyle}>
          {/* Card 1: Thông tin cơ bản & Quản lý vận hành */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <BankOutlined style={{ color: actionPrimary }} />
                <span>Thông tin cơ bản & Quản lý vận hành</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                  <OrgUnitTreeSelect
                    organizations={orgUnits}
                    placeholder="Chọn đơn vị quản lý"
                    loading={loadingOrgs}
                    disabled={isEdit}
                    showPath
                    treeDefaultExpandAll={false}
                    onChange={handleOrgUnitChange}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="portId" {...labelProps('Thuộc cảng biển')} required rules={[{ required: true, message: 'Cảng biển là bắt buộc' }]} style={{ marginBottom: spaceFormField }}>
                  <Select
                    placeholder={!watchedOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : portOptions.length === 0 && !loadingPorts ? 'Không có cảng biển thuộc đơn vị quản lý' : 'Chọn cảng biển...'}
                    loading={loadingPorts}
                    disabled={isEdit || !watchedOrgUnitId || (portOptions.length === 0 && !loadingPorts)}
                    options={portOptions}
                    showSearch
                    optionFilterProp="label"
                    notFoundContent="Không có cảng biển thuộc đơn vị quản lý"
                    onChange={handlePortChange}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="navigationChannelId" {...labelProps('Thuộc luồng hàng hải')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn luồng hàng hải..." options={waterwayOptions} showSearch allowClear optionFilterProp="label" style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="buoyStationId" {...labelProps('Thuộc bến phao')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn bến phao..." options={buoyStationOptions} showSearch allowClear optionFilterProp="label" style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="anchorageCode" {...labelProps('Mã khu neo đậu')} style={{ marginBottom: spaceFormField }} tooltip="Mã được sinh tự động">
                  <Input disabled placeholder={anchorageCodeLoading ? 'Đang sinh mã...' : watchedPortId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã'} style={readonlyInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="anchorageName"
                  {...labelProps('Tên khu neo đậu')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Tên khu neo đậu không được để trống' }, { max: 255 }]}
                  validateStatus={atMax.anchorageName ? 'error' : undefined}
                  help={atMax.anchorageName ? 'Đã đạt tối đa 255 ký tự' : undefined}
                >
                  <Input placeholder="Nhập tên khu neo đậu" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}>
                  <Select
                    showSearch
                    placeholder="Chọn địa điểm"
                    filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
                    options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="detailedLocation"
                  {...labelProps('Địa điểm chi tiết')}
                  style={{ marginBottom: spaceFormField }}
                  validateStatus={atMax.detailedLocation ? 'error' : undefined}
                  help={atMax.detailedLocation ? 'Đã đạt tối đa 500 ký tự' : undefined}
                >
                  <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="operationalStatus" {...labelProps('Tình trạng')} style={{ marginBottom: spaceFormField }} initialValue="NOT_YET_OPERATIONAL" rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}>
                  <Select placeholder="Chọn tình trạng" options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Card 2: Thông số kỹ thuật & Năng lực khai thác */}
          <div style={sectionBoxStyle}>
            <div
              onClick={() => setTechnicalOpen(!technicalOpen)}
              style={{
                ...sectionHeaderStyle,
                cursor: 'pointer',
                userSelect: 'none',
                marginBottom: technicalOpen ? spaceSm : 0,
                paddingBottom: technicalOpen ? spaceSm : 0,
                borderBottom: technicalOpen ? sectionHeaderStyle.borderBottom : 'none',
              }}
            >
              <div style={sectionTitleStyle}>
                <SlidersOutlined style={{ color: actionPrimary }} />
                <span>Thông số kỹ thuật & Năng lực khai thác</span>
              </div>
              <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>
                {technicalOpen ? <DownOutlined /> : <RightOutlined />}
              </span>
            </div>
            {technicalOpen && (
              <div>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="shapeDescription"
                      {...labelProps('Hình dạng')}
                      style={{ marginBottom: spaceFormField }}
                      validateStatus={atMax.shapeDescription ? 'error' : undefined}
                      help={atMax.shapeDescription ? 'Đã đạt tối đa 255 ký tự' : undefined}
                    >
                      <Input placeholder="Nhập hình dạng" maxLength={255} showCount style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="area" {...labelProps('Diện tích (ha)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="designWaterDepth" {...labelProps('Độ sâu khu nước theo thiết kế (m)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} max={100} step={0.1} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="currentWaterDepth" {...labelProps('Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} max={100} step={0.1} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="bottomElevationDesign" {...labelProps('Cao độ đáy bến thiết kế')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} max={100} step={0.1} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="maxVesselDWT" {...labelProps('Cỡ tàu khai thác theo công bố (DWT)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} max={999999} maxLength={20} placeholder="0" style={numberStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="activeAnchorageCount" {...labelProps('Số lượng khu neo đậu đang khai thác')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} max={99999} maxLength={5} placeholder="0" style={numberStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="publishedAnchorageCount" {...labelProps('Số lượng khu neo đậu đã công bố')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} max={99999} maxLength={5} placeholder="0" style={numberStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="underInvestmentAnchorageCount" {...labelProps('Số lượng khu neo đậu đang được thỏa thuận đầu tư XD')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} max={99999} maxLength={5} placeholder="0" style={numberStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={24}>
                    <Form.Item
                      name="remarks"
                      {...labelProps('Ghi chú')}
                      style={{ marginBottom: spaceFormField }}
                      validateStatus={atMax.remarks ? 'error' : undefined}
                      help={atMax.remarks ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                    >
                      <Input.TextArea rows={3} placeholder="Nhập ghi chú" maxLength={2000} showCount style={textAreaStyle} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}
          </div>

          {/* Card 3: Thông tin công bố mở, đưa vào sử dụng */}
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
                    <Form.Item name="openingAnnouncementDate" {...labelProps('Thời điểm công bố mở, đưa ra sử dụng')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker {...getDatePickerProps({ placeholder: 'Chọn thời điểm' })} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={24}>
                    <Form.Item
                      name="publicDecision"
                      {...labelProps('Quyết định công bố/ Văn bản cho phép khai thác')}
                      style={{ marginBottom: spaceFormField }}
                      validateStatus={atMax.publicDecision ? 'error' : undefined}
                      help={atMax.publicDecision ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                    >
                      <Input.TextArea rows={3} placeholder="Nhập quyết định" maxLength={2000} showCount style={textAreaStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={24}>
                    <Form.Item
                      name="investmentAgreement"
                      {...labelProps('Văn bản thỏa thuận đầu tư xây dựng')}
                      style={{ marginBottom: spaceFormField }}
                      validateStatus={atMax.investmentAgreement ? 'error' : undefined}
                      help={atMax.investmentAgreement ? 'Đã đạt tối đa 2000 ký tự' : undefined}
                    >
                      <Input.TextArea rows={3} placeholder="Nhập văn bản thỏa thuận" maxLength={2000} showCount style={textAreaStyle} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}
          </div>

          {/* Card 4: Thông tin khu nước neo buộc tàu */}
          <div style={sectionBoxStyle}>
            <div
              onClick={() => setWaterAreaOpen(!waterAreaOpen)}
              style={{
                ...sectionHeaderStyle,
                cursor: 'pointer',
                userSelect: 'none',
                marginBottom: waterAreaOpen ? spaceSm : 0,
                paddingBottom: waterAreaOpen ? spaceSm : 0,
                borderBottom: waterAreaOpen ? sectionHeaderStyle.borderBottom : 'none',
              }}
            >
              <div style={sectionTitleStyle}>
                <FileTextOutlined style={{ color: actionPrimary }} />
                <span>Thông tin khu nước neo buộc tàu ({waterAreaList.length})</span>
              </div>
              <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>
                {waterAreaOpen ? <DownOutlined /> : <RightOutlined />}
              </span>
            </div>
            {waterAreaOpen && (
              <div>
                <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: portFormFontSizeMd }}>
                    Danh sách khu nước neo buộc tàu ({waterAreaList.length})
                  </span>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openAddWaterArea}
                    style={{ ...primaryButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px' }}
                  >
                    Thêm khu nước neo buộc
                  </Button>
                </div>
                {waterAreaList.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                    <span style={{ fontSize: portFormFontSizeMd, color: textTertiary, display: 'block' }}>Chưa có khu nước neo buộc tàu nào.</span>
                  </div>
                ) : (
                  <DetailTable
                    size="small"
                    dataSource={waterAreaList.map((w, i) => ({ ...w, key: i }))}
                    rowKey={(r: any) => r.key}
                    emptyText="Chưa có dữ liệu"
                    columns={[
                      {
                        title: 'STT',
                        width: 60,
                        align: 'center' as const,
                        render: (_: any, __: any, idx: number) => idx + 1,
                      },
                      {
                        title: 'Phạm vi khu nước neo buộc tàu',
                        key: 'description',
                        render: (_: any, record: any) => (
                          <a
                            style={{ color: actionPrimary, fontWeight: fontWeightBold, cursor: 'pointer' }}
                            onClick={() => openEditWaterArea(record.key)}
                          >
                            {record.description || ''}
                          </a>
                        ),
                      },
                      {
                        title: 'Điểm neo',
                        key: 'anchorPointsCount',
                        width: 140,
                        align: 'center' as const,
                        render: (_: any, record: any) => `${record.anchorPoints?.length || 0} điểm`,
                      },
                      {
                        title: 'Thao tác',
                        key: 'actions',
                        width: 100,
                        align: 'center' as const,
                        render: (_: any, record: any) => (
                          <Space size={4}>
                            <Button type="text" icon={<EditOutlined style={{ color: actionPrimary }} />} onClick={() => openEditWaterArea(record.key)} title="Chỉnh sửa" />
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeWaterArea(record.key)} title="Xóa" />
                          </Space>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            )}
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
                <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn biểu tượng bản đồ" allowClear showSearch optionFilterProp="label" disabled={!watchedGeometryType} loading={loadingSymbols} style={selectStyle}>
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
                    height: 32, fontSize: fontSizeSm, padding: '0 14px', borderRadius: radiusPill,
                    display: 'inline-flex', alignItems: 'center', gap: spaceXs, opacity: 0.6, cursor: 'not-allowed',
                  } : {
                    ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px',
                    display: 'inline-flex', alignItems: 'center', gap: spaceXs,
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
                    height: 32, fontSize: fontSizeSm, padding: '0 14px', borderRadius: radiusPill,
                    display: 'inline-flex', alignItems: 'center', gap: spaceXs,
                    background: '#f5f5f5', borderColor: '#d9d9d9', color: 'rgba(0, 0, 0, 0.25)', cursor: 'not-allowed',
                  } : {
                    ...primaryButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px',
                    display: 'inline-flex', alignItems: 'center', gap: spaceXs,
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
          })) as InfrastructureAttachmentItem[]}
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

      {/* Drawer thêm/sửa Khu nước neo buộc tàu */}
      <Drawer
        {...drawerProps}
        width={900}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editingWaterAreaIndex == null ? 'Thêm mới thông tin khu nước neo buộc tàu' : 'Chỉnh sửa thông tin khu nước neo buộc tàu'}</span>}
        open={waterAreaDrawerOpen}
        onClose={closeWaterAreaDrawer}
        destroyOnHidden
        push={false}
        extra={<Button type="text" onClick={closeWaterAreaDrawer} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={closeWaterAreaDrawer} style={outlineButtonStyle}>Hủy</Button>
            <Button type="primary" onClick={saveWaterArea} style={primaryButtonStyle}>Lưu</Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '16px 24px' },
        }}
      >
        <Form layout="vertical">
          <Form.Item {...labelProps('Phạm vi khu nước neo buộc tàu')} required style={{ marginBottom: spaceFormField }}>
            <Input placeholder="Nhập phạm vi khu nước neo buộc tàu" value={waterAreaDescription} onChange={(e) => setWaterAreaDescription(e.target.value)} style={inputStyle} />
          </Form.Item>

          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} value={waterAreaGeometryType} onChange={(v) => setWaterAreaGeometryType(v)} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn biểu tượng..." allowClear showSearch optionFilterProp="label" disabled={!waterAreaGeometryType} value={waterAreaMapSymbolId} onChange={(v) => setWaterAreaMapSymbolId(v)} style={selectStyle}>
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
              <Form.Item {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} value={waterAreaCoordinateSystem} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled value={waterAreaDisplayRule} style={readonlyInputStyle} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: portFormFontSizeMd }}>Tọa độ điểm neo ({waterAreaAnchorPoints.length})</span>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addAnchorPoint} style={{ ...primaryButtonStyle, height: 30, fontSize: fontSizeSm, padding: '0 12px' }}>Thêm điểm neo</Button>
          </div>

          {waterAreaAnchorPoints.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: portFormFontSizeMd, color: textTertiary, display: 'block' }}>Chưa có điểm neo nào.</span>
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'hidden' }}>
              <DetailTable
                size="small"
                tableLayout="fixed"
                dataSource={waterAreaAnchorPoints.map((p, i) => ({ ...p, _idx: i }))}
                rowKey={(r: any) => r._idx}
                emptyText="Chưa có điểm neo"
                columns={[
                  {
                    title: 'Tên điểm neo',
                    key: 'name',
                    width: 180,
                    render: (_: any, record: any) => (
                      <Input placeholder="Nhập tên điểm neo" value={record.name} onChange={(e) => updateAnchorPointName(record._idx, e.target.value)} style={inputStyle} />
                    ),
                  },
                  {
                    title: 'Vĩ độ (N)',
                    key: 'lat',
                    render: (_: any, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateAnchorPointCoord(record._idx, 'lat', d, m, s)),
                  },
                  {
                    title: 'Kinh độ (E)',
                    key: 'lng',
                    render: (_: any, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateAnchorPointCoord(record._idx, 'lng', d, m, s)),
                  },
                  {
                    title: '',
                    key: 'actions',
                    width: 50,
                    align: 'center' as const,
                    render: (_: any, record: any) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeAnchorPoint(record._idx)} />,
                  },
                ]}
              />
            </div>
          )}
        </Form>
      </Drawer>

      {/* GIS Location Selector Modal */}
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
                const points = parseGisCoordinates({ geometryType: val.geometryType, coordinates: val.coordinates });
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

AnchorageForm.displayName = 'AnchorageForm';
export default AnchorageForm;
