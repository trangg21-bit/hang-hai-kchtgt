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
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { stormShelterCRUD, portCRUD, buoyBerthCRUD } from '../../services/portService';
import { organizationService, type Organization } from '../../services/organizationService';
import { symbolService, type Symbol as IconSymbol } from '../../services/symbolService';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import { userService } from '../../services/userService';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';
import { fmtInputNumber, normalizeSafeNumber } from '../../utils/numFmt';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { GEOMETRY_POINT_COUNT, serializeCoordinatesToWkt } from '../../utils/gisGeometry';
import { DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';
import {
  textSecondary, textTertiary, textPrimary, borderDefault, actionPrimary, statusCritical,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceXs, spaceSm, spaceFormField,
  surfaceCard, readonlyInputStyle, sidebarBg, textAreaStyle,
  primaryButtonStyle, outlineButtonStyle, drawerTabBarStyle, drawerFormScrollStyle,
  getDatePickerProps, drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
} from '../../themetokenchk';

type SaveAction = 'DRAFT' | 'SUBMIT' | 'SAVE_AND_APPROVE' | 'APPROVED' | 'UPDATE';
type UploadFile = { uid: string; name: string; size: number; type: string; status: string; originFileObj?: File };
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
const numberStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

const OPERATIONAL_STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
  { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
  { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
];

export const STORM_SHELTER_CLASSIFICATION_OPTIONS = [
  { value: 'Tránh bão', label: 'Tránh bão' },
  { value: 'Trú bão', label: 'Trú bão' },
  { value: 'Tránh, trú bão', label: 'Tránh, trú bão' },
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

type NumberInputWithCountProps = InputNumberProps<any> & { maxLength: number };

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
  return { d, m, s };
}

function renderDmsText(dd: number | null | undefined, isLat: boolean): string {
  if (dd == null || isNaN(Number(dd))) return '';
  const dms = ddToDms(Number(dd));
  return `${dms.d}° ${dms.m}' ${dms.s}" ${isLat ? 'N' : 'E'}`;
}

function dmToDd(d: number | null | undefined, m: number | null | undefined, s: number | null | undefined): number {
  if (d == null && m == null && s == null) return 0;
  const deg = d ?? 0;
  const min = (m ?? 0) / 60;
  const sec = (s ?? 0) / 3600;
  return Math.round((deg + min + sec) * 1e7) / 1e7;
}

const getFilterSearchTopY = (): number => {
  if (typeof window === 'undefined') return 0;
  const filterFooter = document.querySelector('.filter-action-footer');
  if (filterFooter) {
    const rect = filterFooter.getBoundingClientRect();
    if (rect.top > 0) return Math.round(rect.top);
  }
  const searchBtn = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === 'Tìm kiếm' && !b.closest('.ant-drawer')
  );
  if (searchBtn && searchBtn.parentElement) {
    const rect = searchBtn.parentElement.getBoundingClientRect();
    if (rect.top > 0) return Math.round(rect.top);
  }
  return Math.round(window.innerHeight - 89);
};

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

const dmsInputCss = `
.dms-input-row .ant-input-number {
  padding: 0 4px !important;
}
.dms-input-row .ant-input-number .ant-input-number-input {
  padding: 0 2px !important;
  font-size: 13px !important;
  text-align: center !important;
}
`;

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
      radius: '999px 0 0 999px', unit: '°', unitStyle: dmsUnitStyle, basis: '1 0 66px', width: 66,
      step: 1,
      msg: started && dVal == null ? 'Bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm', base: 'Phút', value: mVal, max: 59,
      radius: '0', unit: "'", unitStyle: dmsUnitStyle, basis: '1 0 72px', width: 72,
      step: 1,
      msg: started && mVal == null ? 'Bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, v, sVal ?? null),
    },
    {
      key: 's', base: 'Giây', value: sVal, max: 59.99,
      radius: '0', unit: '"', unitStyle: dmsUnitEndStyle, basis: '1.2 0 82px', width: 82,
      step: 0.01, formatter: fmtInputNumber,
      msg: started && sVal == null ? 'Bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, mVal ?? null, v),
    },
  ] as const;

  const inputRow = (
    <div className="dms-input-row" style={{ display: 'inline-flex', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'flex-start', maxWidth: '100%', minWidth: 0 }}>
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
            style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32, fontSize: 13 }}
            controls={false}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

  const messageRow = (
    <div aria-live="polite" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', width: 'fit-content', maxWidth: '100%', minWidth: 0, marginTop: 2, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width }}>
          {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: 10, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', width: '100%', minWidth: 0 }}>
      <style>{dmsInputCss}</style>
      {inputRow}
      {messageRow}
    </div>
  );
};

export interface StormShelterFormHandle {
  submit: (saveAction: SaveAction) => Promise<boolean | void>;
}

export interface StormShelterFormProps {
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

export interface AnchorPointFormItem {
  name: string;
  latD: number | null;
  latM: number | null;
  latS: number | null;
  lngD: number | null;
  lngM: number | null;
  lngS: number | null;
  _idx?: number;
}

export interface GpsCoordinateItem {
  latD: number | null;
  latM: number | null;
  latS: number | null;
  lngD: number | null;
  lngM: number | null;
  lngS: number | null;
  _idx?: number;
}

const StormShelterForm = forwardRef<StormShelterFormHandle, StormShelterFormProps>(({
  form,
  id,
  onFinish,
  onSubmittingChange,
}, ref) => {
  const isEdit = Boolean(id);
  const currentUser = useAuthStore((s) => s.user);
  const [activeTabKey, setActiveTabKey] = useState('general');

  // Accordion section collapse states
  const [technicalOpen, setTechnicalOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [waterAreaOpen, setWaterAreaOpen] = useState(true);

  // Dropdown options & loading
  const [orgUnits, setOrgUnits] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [waterwayOptions, setWaterwayOptions] = useState<{ value: string; label: string }[]>([]);
  const [buoyStationOptions, setBuoyStationOptions] = useState<{ value: string; label: string }[]>([]);
  const [symbols, setSymbols] = useState<IconSymbol[]>([]);
  const [loadingSymbols, setLoadingSymbols] = useState(false);
  const [stormShelterCodeLoading, setStormShelterCodeLoading] = useState(false);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  // Watched fields
  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);
  const watchedGeometryType = Form.useWatch('geometryType', form);

  // GPS Coordinates (Tab 2)
  const [coordinateList, setCoordinateList] = useState<GpsCoordinateItem[]>([]);
  const [gisModalOpen, setGisModalOpen] = useState(false);

  // Attachments (Tab 3)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [pendingDeletedAttachmentIds, setPendingDeletedAttachmentIds] = useState<string[]>([]);

  // Mooring Water Areas (Khu nước neo buộc tàu)
  const [waterAreaList, setWaterAreaList] = useState<MooringWaterAreaItem[]>([]);
  const [waterAreaDrawerOpen, setWaterAreaDrawerOpen] = useState(false);
  const [viewingWaterArea, setViewingWaterArea] = useState<MooringWaterAreaItem | null>(null);
  const [viewingMapParamsOpen, setViewingMapParamsOpen] = useState(true);
  const [viewingAnchorPointsOpen, setViewingAnchorPointsOpen] = useState(true);
  const [formMapParamsOpen, setFormMapParamsOpen] = useState(true);
  const [formAnchorPointsOpen, setFormAnchorPointsOpen] = useState(true);
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

  const anchorBoxRef = useRef<HTMLDivElement>(null);
  const [anchorBoxHeight, setAnchorBoxHeight] = useState<number | undefined>();
  const viewingAnchorBoxRef = useRef<HTMLDivElement>(null);
  const [viewingAnchorBoxHeight, setViewingAnchorBoxHeight] = useState<number | undefined>();

  const updateAnchorBoxHeight = useCallback(() => {
    if (!waterAreaDrawerOpen || !formAnchorPointsOpen || !anchorBoxRef.current) return;
    const targetY = getFilterSearchTopY();
    const boxRect = anchorBoxRef.current.getBoundingClientRect();
    if (boxRect.top > 0) {
      const h = Math.round(targetY - boxRect.top);
      setAnchorBoxHeight(Math.max(230, h));
    }
  }, [waterAreaDrawerOpen, formAnchorPointsOpen]);

  useEffect(() => {
    if (!waterAreaDrawerOpen || !formAnchorPointsOpen) return;
    updateAnchorBoxHeight();
    const t1 = setTimeout(updateAnchorBoxHeight, 60);
    const t2 = setTimeout(updateAnchorBoxHeight, 180);
    const t3 = setTimeout(updateAnchorBoxHeight, 350);
    window.addEventListener('resize', updateAnchorBoxHeight);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', updateAnchorBoxHeight);
    };
  }, [waterAreaDrawerOpen, formAnchorPointsOpen, formMapParamsOpen, updateAnchorBoxHeight]);

  const updateViewingAnchorBoxHeight = useCallback(() => {
    if (!viewingWaterArea || !viewingAnchorPointsOpen || !viewingAnchorBoxRef.current) return;
    const targetY = getFilterSearchTopY();
    const boxRect = viewingAnchorBoxRef.current.getBoundingClientRect();
    if (boxRect.top > 0) {
      const h = Math.round(targetY - boxRect.top);
      setViewingAnchorBoxHeight(Math.max(230, h));
    }
  }, [viewingWaterArea, viewingAnchorPointsOpen]);

  useEffect(() => {
    if (!viewingWaterArea || !viewingAnchorPointsOpen) return;
    updateViewingAnchorBoxHeight();
    const t1 = setTimeout(updateViewingAnchorBoxHeight, 60);
    const t2 = setTimeout(updateViewingAnchorBoxHeight, 180);
    const t3 = setTimeout(updateViewingAnchorBoxHeight, 350);
    window.addEventListener('resize', updateViewingAnchorBoxHeight);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', updateViewingAnchorBoxHeight);
    };
  }, [viewingWaterArea, viewingAnchorPointsOpen, viewingMapParamsOpen, updateViewingAnchorBoxHeight]);

  const anchorTableScrollY = anchorBoxHeight ? Math.max(70, anchorBoxHeight - 160) : 'calc(100vh - 540px)';
  const viewingAnchorTableScrollY = viewingAnchorBoxHeight ? Math.max(70, viewingAnchorBoxHeight - 148) : 'calc(100vh - 500px)';

  const editPortIdRef = useRef<string | undefined>(undefined);
  const initialApprovalStatusRef = useRef<string | undefined>(undefined);

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
    setStormShelterCodeLoading(true);
    stormShelterCRUD.generateCode(watchedPortId)
      .then((res: any) => {
        const code = res?.stormShelterCode ?? res?.data?.stormShelterCode;
        if (code) form.setFieldsValue({ stormShelterCode: code });
      })
      .catch(() => {})
      .finally(() => setStormShelterCodeLoading(false));
  }, [watchedPortId, isEdit, form]);

  // Sync geometryType to coordinateList
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

  // Load initial data for Edit mode
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const d: any = await stormShelterCRUD.findById(id);
        editPortIdRef.current = d.portId;
        initialApprovalStatusRef.current = d.approvalStatus;
        form.setFieldsValue({
          orgUnitId: d.orgUnitId,
          portId: d.portId,
          navigationChannelId: d.navigationChannelId,
          buoyStationId: d.buoyStationId,
          stormShelterCode: d.stormShelterCode,
          stormShelterName: d.stormShelterName,
          classification: d.classification || undefined,
          provinceId: d.provinceId ? VIETNAM_PROVINCES[d.provinceId - 1] ?? undefined : undefined,
          detailedLocation: d.detailedLocation,
          operationalStatus: d.operationalStatus || undefined,
          shapeDescription: d.shapeDescription,
          area: normalizeSafeNumber(d.area),
          designWaterDepth: normalizeSafeNumber(d.designWaterDepth),
          currentWaterDepth: normalizeSafeNumber(d.currentWaterDepth),
          bottomElevationDesign: normalizeSafeNumber(d.bottomElevationDesign),
          maxVesselDWT: normalizeSafeNumber(d.maxVesselDWT),
          activeStormShelterCount: d.activeStormShelterCount,
          publishedStormShelterCount: d.publishedStormShelterCount,
          underInvestmentStormShelterCount: d.underInvestmentStormShelterCount,
          remarks: d.remarks,
          openingAnnouncementDate: d.openingAnnouncementDate ? dayjs(d.openingAnnouncementDate) : undefined,
          publicDecision: d.publicDecision,
          investmentAgreement: d.investmentAgreement,
          geometryType: d.geometryType || undefined,
          mapSymbolId: d.mapSymbolId,
          coordinateSystem: d.coordinateSystem ?? 1,
          displayRule: (d.displayRule != null || d.geometryType) ? 'Độ, phút, giây (DMS)' : undefined,
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
          const fr = await api.get(`/v1/storm-shelter/${id}/attachments`);
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
        toast.error('Không thể tải thông tin khu tránh, trú bão');
      }
    })();
  }, [isEdit, id, form]);

  const handleOrgUnitChange = () => {
    form.setFieldsValue({ portId: undefined, stormShelterCode: undefined });
  };

  const handlePortChange = () => {
    form.setFieldsValue({ stormShelterCode: undefined });
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
    api.get(`/v1/storm-shelter/${id}/attachments/${uid}/download`, { responseType: 'blob' })
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
      const attId = target.id || target.uid;
      if (attId) setPendingDeletedAttachmentIds((prev) => [...prev, attId]);
    }
    setUploadedFiles(prev => prev.filter(x => x.uid !== file.uid && (x as any).id !== file.uid));
  };

  // GPS points
  const addGpsPoint = () => {
    setCoordinateList([...coordinateList, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
  };
  const removeCoordinate = (i: number) => {
    setCoordinateList(coordinateList.filter((_, idx) => idx !== i));
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
    setFormMapParamsOpen(true);
    setFormAnchorPointsOpen(true);
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
    setFormMapParamsOpen(true);
    setFormAnchorPointsOpen(true);
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
    if (!waterAreaGeometryType || (waterAreaGeometryType === 'POINT' && waterAreaAnchorPoints.length >= 1)) {
      return;
    }
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
    if (waterAreaGeometryType) {
      if (!waterAreaMapSymbolId) {
        toast.error('Biểu tượng là bắt buộc khi đã chọn loại đối tượng');
        return;
      }

      const validPoints = waterAreaAnchorPoints.filter(
        (p) => p.latD != null && p.latM != null && p.latS != null && p.lngD != null && p.lngM != null && p.lngS != null
      );
      const minCount = GEOMETRY_POINT_COUNT[waterAreaGeometryType] ?? 1;

      if (validPoints.length < minCount) {
        const msg =
          waterAreaGeometryType === 'POLYGON'
            ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ'
            : waterAreaGeometryType === 'LINE'
            ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ'
            : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ';
        toast.error(msg);
        return;
      }

      if (waterAreaGeometryType === 'POINT' && validPoints.length > 1) {
        toast.error('Loại đối tượng điểm chỉ cho phép 1 tọa độ GPS');
        return;
      }
    }

    const partial = waterAreaAnchorPoints.find((p) => {
      const latSet = p.latD != null || p.latM != null || p.latS != null;
      const lngSet = p.lngD != null || p.lngM != null || p.lngS != null;
      const latFull = p.latD != null && p.latM != null && p.latS != null;
      const lngFull = p.lngD != null && p.lngM != null && p.lngS != null;
      return (latSet && !latFull) || (lngSet && !lngFull) || (latFull && !lngFull) || (!latFull && lngFull);
    });
    if (partial) {
      toast.error('Chưa nhập đủ Độ/Phút/Giây cho một tọa độ điểm neo');
      return;
    }

    const invalidRange = waterAreaAnchorPoints.find((p) => {
      if (p.latD != null && (p.latD < 0 || p.latD > 90)) return true;
      if (p.latM != null && (p.latM < 0 || p.latM > 59)) return true;
      if (p.latS != null && (p.latS < 0 || p.latS >= 60)) return true;
      if (p.lngD != null && (p.lngD < 0 || p.lngD > 180)) return true;
      if (p.lngM != null && (p.lngM < 0 || p.lngM > 59)) return true;
      if (p.lngS != null && (p.lngS < 0 || p.lngS >= 60)) return true;
      return false;
    });
    if (invalidRange) {
      toast.error('Tọa độ điểm neo nằm ngoài dải hợp lệ (Vĩ độ: 0-90°, Kinh độ: 0-180°, Phút/Giây: 0-59.99)');
      return;
    }

    const namedWithoutCoords = waterAreaAnchorPoints.find((p) => {
      const hasName = !!p.name?.trim();
      const hasCoord = p.latD != null || p.latM != null || p.latS != null || p.lngD != null || p.lngM != null || p.lngS != null;
      return hasName && !hasCoord;
    });
    if (namedWithoutCoords) {
      toast.error(`Vui lòng nhập tọa độ cho điểm neo "${namedWithoutCoords.name.trim()}"`);
      return;
    }

    const emptyRow = waterAreaAnchorPoints.find((p) => {
      const noName = !p.name?.trim();
      const noCoord = p.latD == null && p.latM == null && p.latS == null && p.lngD == null && p.lngM == null && p.lngS == null;
      return noName && noCoord;
    });
    if (emptyRow) {
      toast.error('Vui lòng nhập đầy đủ thông tin điểm neo hoặc xóa hàng trống');
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
          latitude: (p.latD != null || p.latM != null || p.latS != null) ? dmToDd(p.latD, p.latM, p.latS) : undefined,
          longitude: (p.lngD != null || p.lngM != null || p.lngS != null) ? dmToDd(p.lngD, p.lngM, p.lngS) : undefined,
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

    if (vals.geometryType) {
      if (!vals.mapSymbolId) {
        setActiveTabKey('location');
        form.setFields([{ name: ['mapSymbolId'], errors: ['Biểu tượng là bắt buộc khi đã chọn loại đối tượng'] }]);
        toast.error('Biểu tượng là bắt buộc khi đã chọn loại đối tượng');
        return false;
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
        return false;
      }

      if (vals.geometryType === 'POINT' && validCoords.length > 1) {
        setActiveTabKey('location');
        toast.error('Loại đối tượng điểm chỉ cho phép 1 tọa độ GPS');
        return false;
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
        return false;
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
        return false;
      }
    }

    const validCoords = vals.geometryType
      ? coordinateList.filter((c) => c.latD != null && c.latM != null && c.latS != null && c.lngD != null && c.lngM != null && c.lngS != null)
      : [];
    const wktCoordinates = vals.geometryType && validCoords.length > 0
      ? serializeCoordinatesToWkt(
          validCoords.map((c) => ({
            latitude: dmToDd(c.latD, c.latM, c.latS),
            longitude: dmToDd(c.lngD, c.lngM, c.lngS),
          })),
          vals.geometryType || 'POINT'
        )
      : undefined;

    onSubmittingChange?.(true);
    try {
      const provinceIndex = VIETNAM_PROVINCES.indexOf(vals.provinceId);
      const provinceNumber = provinceIndex >= 0 ? provinceIndex + 1 : undefined;

      const mooringPayload = waterAreaList
        .map(w => ({
          description: w.description?.trim() || undefined,
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
        stormShelterCode: vals.stormShelterCode?.trim() || undefined,
        stormShelterName: vals.stormShelterName?.trim(),
        classification: vals.classification || undefined,
        provinceId: provinceNumber,
        detailedLocation: vals.detailedLocation?.trim() || undefined,
        operationalStatus: vals.operationalStatus || undefined,
        shapeDescription: vals.shapeDescription?.trim() || undefined,
        area: (vals.area === 0 || vals.area === '0') ? 0 : (vals.area != null && String(vals.area).trim() !== '' && !isNaN(Number(vals.area)) ? String(vals.area).trim() : undefined),
        designWaterDepth: (vals.designWaterDepth === 0 || vals.designWaterDepth === '0') ? '0' : (vals.designWaterDepth || undefined),
        currentWaterDepth: (vals.currentWaterDepth === 0 || vals.currentWaterDepth === '0') ? '0' : (vals.currentWaterDepth || undefined),
        bottomElevationDesign: (vals.bottomElevationDesign === 0 || vals.bottomElevationDesign === '0') ? '0' : (vals.bottomElevationDesign || undefined),
        maxVesselDWT: (vals.maxVesselDWT === 0 || vals.maxVesselDWT === '0') ? '0' : (vals.maxVesselDWT || undefined),
        activeStormShelterCount: vals.activeStormShelterCount != null && !isNaN(Number(vals.activeStormShelterCount)) ? Number(vals.activeStormShelterCount) : undefined,
        publishedStormShelterCount: vals.publishedStormShelterCount != null && !isNaN(Number(vals.publishedStormShelterCount)) ? Number(vals.publishedStormShelterCount) : undefined,
        underInvestmentStormShelterCount: vals.underInvestmentStormShelterCount != null && !isNaN(Number(vals.underInvestmentStormShelterCount)) ? Number(vals.underInvestmentStormShelterCount) : undefined,
        remarks: vals.remarks?.trim() || undefined,
        openingAnnouncementDate: vals.openingAnnouncementDate ? dayjs(vals.openingAnnouncementDate).format('YYYY-MM-DDTHH:mm:ss') : undefined,
        publicDecision: vals.publicDecision?.trim() || undefined,
        investmentAgreement: vals.investmentAgreement?.trim() || undefined,
        geometryType: vals.geometryType || undefined,
        mapSymbolId: vals.mapSymbolId || undefined,
        coordinateSystem: vals.coordinateSystem != null ? Number(vals.coordinateSystem) : undefined,
        displayRule: vals.geometryType ? 1 : undefined,
        latitude: validCoords.length > 0 ? dmToDd(validCoords[0].latD, validCoords[0].latM, validCoords[0].latS) : undefined,
        longitude: validCoords.length > 0 ? dmToDd(validCoords[0].lngD, validCoords[0].lngM, validCoords[0].lngS) : undefined,
        coordinates: wktCoordinates || undefined,
        mooringWaterAreas: mooringPayload.length > 0 ? mooringPayload : undefined,
      };

      if (saveAction !== 'UPDATE') {
        payload.saveAction = saveAction;
      }
      Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });

      let createdId: string | undefined;
      if (isEdit && id) {
        await stormShelterCRUD.update({ ...payload, id } as any);
        createdId = id;
      } else {
        const res: any = await stormShelterCRUD.create(payload as any);
        createdId = res?.id ?? res?.data?.id;
      }

      const wasApproved = isEdit && (initialApprovalStatusRef.current === 'APPROVED' || initialApprovalStatusRef.current === 'APPROVED_LEVEL2');

      // Delete removed attachments
      if (createdId && pendingDeletedAttachmentIds.length > 0) {
        await Promise.all(
          pendingDeletedAttachmentIds.map((attId) =>
            api.delete(`/v1/storm-shelter/${createdId}/attachments/${attId}`, {
              params: { skipHistory: !wasApproved },
            }).catch(() => {})
          )
        );
      }

      // Upload newly added files
      if (createdId && uploadedFiles.length > 0) {
        const newFiles = uploadedFiles.filter((fi: any) => fi.originFileObj);
        if (newFiles.length > 0) {
          try {
            const fd = new FormData();
            newFiles.forEach((fi: any) => {
              fd.append('files', fi.originFileObj as File);
            });
            await api.post(`/v1/storm-shelter/${createdId}/attachments`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
              params: { skipHistory: !wasApproved },
            });
            toast.success(`Đã tải lên ${newFiles.length} tệp đính kèm`);
          } catch {
            toast.error('Tải lên tệp đính kèm thất bại');
          }
        }
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
  }, [form, isEdit, id, uploadedFiles, pendingDeletedAttachmentIds, waterAreaList, coordinateList, onFinish, onSubmittingChange]);

  useImperativeHandle(ref, () => ({ submit: (saveAction: SaveAction) => handleSave(saveAction) }), [handleSave]);

  const tabItems = [
    // Tab 1: Thông tin chung
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={drawerFormScrollStyle}>
          <style>{`
            .cn-op-2line-label .ant-form-item-label {
              height: auto !important;
              min-height: 44px !important;
              align-items: flex-start !important;
            }
            .cn-op-2line-label .ant-form-item-label > label {
              height: auto !important;
              white-space: normal !important;
              line-height: 1.45 !important;
              overflow-wrap: break-word;
            }
          `}</style>
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
                <Form.Item name="stormShelterCode" {...labelProps('Mã khu tránh, trú bão')} style={{ marginBottom: spaceFormField }} tooltip="Mã được sinh tự động">
                  <Input disabled placeholder={stormShelterCodeLoading ? 'Đang sinh mã...' : watchedPortId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã'} style={readonlyInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="stormShelterName"
                  {...labelProps('Tên khu tránh, trú bão')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Tên khu tránh, trú bão không được để trống' }, { max: 255 }]}
                >
                  <Input placeholder="Nhập tên khu tránh, trú bão" maxLength={255} showCount style={inputStyle} />
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
                <Form.Item name="operationalStatus" {...labelProps('Tình trạng')} style={{ marginBottom: spaceFormField }} initialValue="NOT_YET_OPERATIONAL" rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}>
                  <Select placeholder="Chọn tình trạng" options={OPERATIONAL_STATUS_OPTIONS} style={selectStyle} />
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
                      <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="currentWaterDepth" {...labelProps('Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="bottomElevationDesign" {...labelProps('Cao độ đáy bến thiết kế')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberStyle} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="maxVesselDWT" {...labelProps('Cỡ tàu khai thác theo công bố (DWT)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} step={1} precision={0} maxLength={20} placeholder="0" style={numberStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="activeStormShelterCount" {...labelProps('Số lượng khu tránh, trú bão đang khai thác')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="publishedStormShelterCount" {...labelProps('Số lượng khu tránh, trú bão đã công bố')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="classification" className="cn-op-2line-label" {...labelProps('Phân loại')} style={{ marginBottom: spaceFormField }}>
                      <Select placeholder="Chọn phân loại" allowClear options={STORM_SHELTER_CLASSIFICATION_OPTIONS} style={selectStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="underInvestmentStormShelterCount" className="cn-op-2line-label" {...labelProps('Số lượng khu tránh, trú bão đang được thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} step={1} precision={0} maxLength={5} placeholder="0" style={numberStyle} />
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
                    style={{ ...primaryButtonStyle, height: 32, fontSize: portFormFontSizeMd, padding: '0 14px' }}
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
                    scrollY={130}
                    pageSize={5}
                    pageSizeOptions={[5, 10, 20]}
                    dataSource={waterAreaList.map((w, i) => ({ ...w, key: i }))}
                    rowKey={(r: MooringWaterAreaItem & { key: number }) => String(r.key)}
                    emptyText="Chưa có dữ liệu"
                    columns={[
                      {
                        title: 'STT',
                        width: 60,
                        align: 'center' as const,
                        render: (_: unknown, __: unknown, idx: number) => idx + 1,
                      },
                      {
                        title: 'Phạm vi khu nước neo buộc tàu',
                        key: 'description',
                        render: (_: unknown, record: MooringWaterAreaItem & { key: number }) => (
                          <a
                            style={{ color: actionPrimary, fontWeight: fontWeightBold, cursor: 'pointer' }}
                            onClick={() => openEditWaterArea(record.key)}
                          >
                            {record.description?.trim() || `Khu nước ${record.key + 1}`}
                          </a>
                        ),
                      },
                      {
                        title: 'Thao tác',
                        key: 'actions',
                        width: 120,
                        align: 'center' as const,
                        render: (_: unknown, record: MooringWaterAreaItem & { key: number }) => (
                          <Space size={4}>
                            <Button
                              type="text"
                              icon={<EyeOutlined style={{ color: actionPrimary }} />}
                              onClick={() => setViewingWaterArea(record)}
                              title="Xem chi tiết điểm neo"
                            />
                            <Button
                              type="text"
                              icon={<EditOutlined style={{ color: actionPrimary }} />}
                              onClick={() => openEditWaterArea(record.key)}
                              title="Chỉnh sửa"
                            />
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeWaterArea(record.key)}
                              title="Xóa"
                            />
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
                    height: 32, fontSize: portFormFontSizeMd, padding: '0 14px', borderRadius: radiusPill,
                    display: 'inline-flex', alignItems: 'center', gap: spaceXs, opacity: 0.6, cursor: 'not-allowed',
                  } : {
                    ...outlineButtonStyle, height: 32, fontSize: portFormFontSizeMd, padding: '0 14px',
                    display: 'inline-flex', alignItems: 'center', gap: spaceXs,
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
                    fontSize: portFormFontSizeMd,
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
                    fontSize: portFormFontSizeMd,
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
                scroll={{ x: 590 }}
                dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
                rowKey={(r: GpsCoordinateItem) => String(r._idx)}
                emptyText="Chưa có tọa độ GPS nào"
                columns={[
                  {
                    title: 'STT',
                    width: 60,
                    align: 'center' as const,
                    onCell: () => ({ style: { verticalAlign: 'top', paddingTop: 14 } }),
                    render: (_v: unknown, _r: unknown, idx: number) => idx + 1,
                  },
                  {
                    title: <span>Vĩ độ (Latitude - N) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>,
                    key: 'lat',
                    width: 240,
                    align: 'left' as const,
                    onCell: () => ({ style: { verticalAlign: 'top', textAlign: 'left' } }),
                    render: (_v: unknown, record: GpsCoordinateItem) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx ?? 0, 'lat', d, m, s)),
                  },
                  {
                    title: <span>Kinh độ (Longitude - E) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>,
                    key: 'lng',
                    width: 240,
                    align: 'left' as const,
                    onCell: () => ({ style: { verticalAlign: 'top', textAlign: 'left' } }),
                    render: (_v: unknown, record: GpsCoordinateItem) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx ?? 0, 'lng', d, m, s)),
                  },
                  {
                    title: '',
                    width: 50,
                    align: 'center' as const,
                    onCell: () => ({ style: { verticalAlign: 'top' } }),
                    render: (_v: unknown, record: GpsCoordinateItem) => (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                        onClick={() => removeCoordinate(record._idx ?? 0)}
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
        rootClassName="storm-shelter-drawer-scope"
        className="storm-shelter-drawer-scope"
        size={1000}
        width="min(1000px, 96vw)"
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editingWaterAreaIndex == null ? 'Thêm mới thông tin khu nước neo buộc tàu' : 'Chỉnh sửa thông tin khu nước neo buộc tàu'}</span>}
        open={waterAreaDrawerOpen}
        onClose={closeWaterAreaDrawer}
        destroyOnClose
        push={false}
        extra={<Button type="text" onClick={closeWaterAreaDrawer} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button type="primary" onClick={saveWaterArea} style={primaryButtonStyle}>Lưu</Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '16px 24px' },
        }}
      >
        <Form layout="vertical">
          <div style={{ ...sectionBoxStyle, padding: formMapParamsOpen ? sectionBoxStyle.padding : '12px 18px' }}>
            <div
              onClick={() => setFormMapParamsOpen(!formMapParamsOpen)}
              style={{
                ...sectionHeaderStyle,
                marginBottom: formMapParamsOpen ? 10 : 0,
                paddingBottom: formMapParamsOpen ? 8 : 0,
                borderBottom: formMapParamsOpen ? sectionHeaderStyle.borderBottom : 'none',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={sectionTitleStyle}>
                <EnvironmentOutlined style={{ color: actionPrimary }} />
                <span>Thông số đối tượng bản đồ</span>
              </div>
              {formMapParamsOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
            </div>
            {formMapParamsOpen && (
              <>
                <Form.Item {...labelProps('Phạm vi khu nước neo buộc tàu')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập phạm vi khu nước neo buộc tàu"
                    maxLength={2000}
                    showCount
                    value={waterAreaDescription}
                    onChange={(e) => setWaterAreaDescription(e.target.value)}
                    style={textAreaStyle}
                  />
                </Form.Item>

                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                      <Select
                        placeholder="Chọn loại đối tượng"
                        allowClear
                        options={GEOMETRY_TYPE_OPTIONS}
                        value={waterAreaGeometryType}
                        onChange={(v) => {
                          setWaterAreaGeometryType(v);
                          if (!v) {
                            setWaterAreaMapSymbolId(undefined);
                          }
                        }}
                        style={selectStyle}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...labelProps('Biểu tượng')}
                      required={!!waterAreaGeometryType}
                      rules={
                        waterAreaGeometryType
                          ? [{ required: true, message: 'Biểu tượng là bắt buộc khi đã chọn loại đối tượng' }]
                          : []
                      }
                      style={{ marginBottom: spaceFormField }}
                    >
                      <Select
                        placeholder="Chọn biểu tượng..."
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        disabled={!waterAreaGeometryType}
                        value={waterAreaMapSymbolId}
                        onChange={(v) => setWaterAreaMapSymbolId(v)}
                        style={selectStyle}
                      >
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
              </>
            )}
          </div>

          <div
            ref={anchorBoxRef}
            style={{
              ...sectionBoxStyle,
              padding: formAnchorPointsOpen ? sectionBoxStyle.padding : '12px 18px',
              height: formAnchorPointsOpen ? (anchorBoxHeight ? `${anchorBoxHeight}px` : undefined) : 'auto',
              minHeight: formAnchorPointsOpen ? 230 : undefined,
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              marginBottom: 0,
            }}
          >
            <div
              style={{
                ...sectionHeaderStyle,
                marginBottom: formAnchorPointsOpen ? spaceFormField : 0,
                paddingBottom: formAnchorPointsOpen ? 8 : 0,
                borderBottom: formAnchorPointsOpen ? sectionHeaderStyle.borderBottom : 'none',
                userSelect: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div
                onClick={() => setFormAnchorPointsOpen(!formAnchorPointsOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: spaceXs, cursor: 'pointer' }}
              >
                <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: portFormFontSizeMd }}>
                  Tọa độ điểm neo ({waterAreaAnchorPoints.length})
                </span>
                {formAnchorPointsOpen ? <DownOutlined style={{ color: actionPrimary, marginLeft: 4 }} /> : <RightOutlined style={{ color: actionPrimary, marginLeft: 4 }} />}
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addAnchorPoint}
                disabled={!waterAreaGeometryType || (waterAreaGeometryType === 'POINT' && waterAreaAnchorPoints.length >= 1)}
                style={!waterAreaGeometryType || (waterAreaGeometryType === 'POINT' && waterAreaAnchorPoints.length >= 1) ? {
                  height: 32,
                  fontSize: portFormFontSizeMd,
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
                  fontSize: portFormFontSizeMd,
                  padding: '0 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: spaceXs,
                }}
                title={waterAreaGeometryType === 'POINT' && waterAreaAnchorPoints.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 điểm neo' : (!waterAreaGeometryType ? 'Vui lòng chọn loại đối tượng' : undefined)}
              >
                Thêm điểm neo
              </Button>
            </div>

            {formAnchorPointsOpen && (
              waterAreaAnchorPoints.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                  <span style={{ fontSize: portFormFontSizeMd, color: textTertiary, display: 'block' }}>Chưa có điểm neo nào.</span>
                </div>
              ) : (
                <DetailTable
                  size="small"
                  scroll={{ x: 780 }}
                  scrollY={anchorTableScrollY}
                  pageSize={10}
                  pageSizeOptions={[5, 10, 20, 50]}
                  dataSource={waterAreaAnchorPoints.map((p, i) => ({ ...p, _idx: i }))}
                  rowKey={(r: AnchorPointFormItem) => String(r._idx)}
                  emptyText="Chưa có điểm neo"
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                  columns={[
                    {
                      title: 'STT',
                      width: 50,
                      align: 'center' as const,
                      onCell: () => ({ style: { verticalAlign: 'top', paddingTop: 14 } }),
                      render: (_: unknown, _r: unknown, idx: number) => idx + 1,
                    },
                    {
                      title: 'Tên điểm neo',
                      key: 'name',
                      width: 200,
                      onCell: () => ({ style: { verticalAlign: 'top' } }),
                      render: (_: unknown, record: AnchorPointFormItem) => (
                        <Input
                          placeholder="Nhập tên điểm neo"
                          value={record.name}
                          onChange={(e) => updateAnchorPointName(record._idx ?? 0, e.target.value)}
                          style={{ ...inputStyle, height: 32, borderRadius: radiusPill, fontSize: 13.5 }}
                        />
                      ),
                    },
                    {
                      title: <span>Vĩ độ (N) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>,
                      key: 'lat',
                      width: 240,
                      align: 'left' as const,
                      onCell: () => ({ style: { verticalAlign: 'top', textAlign: 'left' } }),
                      render: (_: unknown, record: AnchorPointFormItem) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateAnchorPointCoord(record._idx ?? 0, 'lat', d, m, s)),
                    },
                    {
                      title: <span>Kinh độ (E) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>,
                      key: 'lng',
                      width: 240,
                      align: 'left' as const,
                      onCell: () => ({ style: { verticalAlign: 'top', textAlign: 'left' } }),
                      render: (_: unknown, record: AnchorPointFormItem) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateAnchorPointCoord(record._idx ?? 0, 'lng', d, m, s)),
                    },
                    {
                      title: '',
                      key: 'actions',
                      width: 50,
                      align: 'center' as const,
                      onCell: () => ({ style: { verticalAlign: 'top' } }),
                      render: (_: unknown, record: AnchorPointFormItem) => (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                          onClick={() => removeAnchorPoint(record._idx ?? 0)}
                          style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Xóa điểm neo"
                        />
                      ),
                    },
                  ]}
                />
              )
            )}
          </div>
        </Form>
      </Drawer>

      {/* Drawer xem chi tiết khu nước neo buộc tàu */}
      <Drawer
        {...drawerProps}
        rootClassName="storm-shelter-drawer-scope"
        className="storm-shelter-drawer-scope"
        size={1000}
        width="min(1000px, 96vw)"
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chi tiết thông tin khu nước neo buộc tàu</span>}
        open={!!viewingWaterArea}
        onClose={() => setViewingWaterArea(null)}
        destroyOnClose
        push={false}
        extra={<Button type="text" onClick={() => setViewingWaterArea(null)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {viewingWaterArea && (
          <div className="storm-shelter-detail-content-wrapper">
            <style>{`
              .storm-shelter-detail-content-wrapper,
              .storm-shelter-detail-content-wrapper .chk-detail-label,
              .storm-shelter-detail-content-wrapper .chk-detail-value {
                font-size: 13.5px !important;
              }
              .storm-shelter-detail-content-wrapper .chk-detail-grid {
                display: grid !important;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
                column-gap: 28px !important;
                row-gap: 0 !important;
                align-items: stretch !important;
              }
              .storm-shelter-detail-content-wrapper .chk-detail-row {
                display: flex !important;
                align-items: flex-start !important;
                min-height: 36px !important;
                padding: 7px 0 !important;
                border-bottom: 1px solid #f1f5f9 !important;
                line-height: 1.5 !important;
                gap: 10px !important;
                width: 100% !important;
                box-sizing: border-box !important;
                overflow: visible !important;
              }
              .storm-shelter-detail-content-wrapper .chk-detail-row:last-child {
                border-bottom: none !important;
              }
              .storm-shelter-detail-content-wrapper .chk-detail-row--full {
                grid-column: 1 / -1 !important;
              }
              .storm-shelter-detail-content-wrapper .chk-detail-label,
              .storm-shelter-detail-content-wrapper .sec-col1-label,
              .storm-shelter-detail-content-wrapper .chk-detail-row .sec-col1-label,
              .storm-shelter-detail-content-wrapper .chk-detail-row--full .chk-detail-label {
                width: 215px !important;
                min-width: 215px !important;
                max-width: 215px !important;
                flex-shrink: 0 !important;
                color: ${sidebarBg} !important;
                font-weight: 600 !important;
                font-size: 13.5px !important;
                text-align: left !important;
                line-height: 1.5 !important;
                align-self: flex-start !important;
                white-space: normal !important;
              }
              .storm-shelter-detail-content-wrapper .chk-detail-row--full .chk-detail-label {
                width: auto !important;
                min-width: 220px !important;
                max-width: 320px !important;
                white-space: nowrap !important;
              }
              .storm-shelter-detail-content-wrapper .chk-detail-row .sec-col2-label {
                width: 250px !important;
                min-width: 250px !important;
                max-width: 250px !important;
                flex-shrink: 0 !important;
                color: ${sidebarBg} !important;
                font-weight: 600 !important;
                font-size: 13.5px !important;
                text-align: left !important;
                line-height: 1.5 !important;
                align-self: flex-start !important;
                white-space: normal !important;
              }
              .storm-shelter-detail-content-wrapper .chk-detail-label::after {
                content: ':' !important;
                margin-left: 1px !important;
                margin-right: 4px !important;
              }
              .storm-shelter-detail-content-wrapper .chk-detail-value {
                flex: 1 1 auto !important;
                color: #1e293b !important;
                font-size: 13.5px !important;
                font-weight: 500 !important;
                line-height: 1.5 !important;
                min-width: 0 !important;
                word-break: break-word !important;
              }
            `}</style>

            <div style={{ maxHeight: 'calc(100vh - 72px)', paddingTop: 10, paddingRight: 4, overflowY: 'auto', overflowX: 'hidden' }}>
              {/* Box 1: Thông số đối tượng bản đồ */}
              <div style={{ ...sectionBoxStyle, padding: viewingMapParamsOpen ? sectionBoxStyle.padding : '12px 18px' }}>
                <div
                  onClick={() => setViewingMapParamsOpen(!viewingMapParamsOpen)}
                  style={{
                    ...sectionHeaderStyle,
                    marginBottom: viewingMapParamsOpen ? 10 : 0,
                    paddingBottom: viewingMapParamsOpen ? 8 : 0,
                    borderBottom: viewingMapParamsOpen ? sectionHeaderStyle.borderBottom : 'none',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={sectionTitleStyle}>
                    <EnvironmentOutlined style={{ color: actionPrimary }} />
                    <span>Thông số đối tượng bản đồ</span>
                  </div>
                  {viewingMapParamsOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {viewingMapParamsOpen && (
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-col1-label">Phạm vi khu nước neo buộc tàu</span>
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 110, overflowY: 'auto' }}>
                        {viewingWaterArea.description || ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Loại đối tượng</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const m: Record<string, string> = {
                            POINT: 'Đối tượng điểm',
                            LINE: 'Đối tượng đường',
                            POLYGON: 'Đối tượng vùng',
                          };
                          return viewingWaterArea.geometryType ? m[viewingWaterArea.geometryType] || viewingWaterArea.geometryType : '';
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Biểu tượng</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const sym = symbols.find((s) => s.id === viewingWaterArea.mapSymbolId);
                          const symName = sym?.name || viewingWaterArea.mapSymbolId || '';
                          const symImg = sym?.image;
                          const symImgSrc = symImg ? (symImg.startsWith('data:') ? symImg : `data:image/png;base64,${symImg}`) : undefined;
                          return symName ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              {symImgSrc ? (
                                <img
                                  src={symImgSrc}
                                  alt=""
                                  style={{ width: 22, height: 22, objectFit: 'contain' }}
                                />
                              ) : null}
                              {symName}
                            </span>
                          ) : '';
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Hệ quy chiếu</span>
                      <span className="chk-detail-value">
                        {viewingWaterArea.coordinateSystem === 1
                          ? 'WGS-84'
                          : viewingWaterArea.coordinateSystem === 2
                          ? 'VN-2000'
                          : (viewingWaterArea.coordinateSystem || '')}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Quy tắc hiển thị</span>
                      <span className="chk-detail-value">
                        {viewingWaterArea.displayRule || 'Độ, phút, giây (DMS)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Box 2: Tọa độ điểm neo */}
              <div
                ref={viewingAnchorBoxRef}
                style={{
                  ...sectionBoxStyle,
                  padding: viewingAnchorPointsOpen ? sectionBoxStyle.padding : '12px 18px',
                  height: viewingAnchorPointsOpen ? (viewingAnchorBoxHeight ? `${viewingAnchorBoxHeight}px` : undefined) : 'auto',
                  minHeight: viewingAnchorPointsOpen ? 230 : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  boxSizing: 'border-box',
                  marginBottom: 0,
                }}
              >
                <div
                  onClick={() => setViewingAnchorPointsOpen(!viewingAnchorPointsOpen)}
                  style={{
                    ...sectionHeaderStyle,
                    marginBottom: viewingAnchorPointsOpen ? 10 : 0,
                    paddingBottom: viewingAnchorPointsOpen ? 8 : 0,
                    borderBottom: viewingAnchorPointsOpen ? sectionHeaderStyle.borderBottom : 'none',
                    cursor: 'pointer',
                    userSelect: 'none',
                    flexShrink: 0,
                  }}
                >
                  <div style={sectionTitleStyle}>
                    <EnvironmentOutlined style={{ color: actionPrimary }} />
                    <span>Tọa độ điểm neo ({(viewingWaterArea.anchorPoints || []).length})</span>
                  </div>
                  {viewingAnchorPointsOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                </div>
                {viewingAnchorPointsOpen && (
                  <DetailTable
                    size="small"
                    scroll={{ x: 590 }}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 20, 50]}
                    dataSource={(Array.isArray(viewingWaterArea.anchorPoints) ? viewingWaterArea.anchorPoints : []).map((p, i) => ({ ...p, key: i }))}
                    emptyText="Chưa có dữ liệu tọa độ điểm neo"
                    rowKey={(rec: any) => rec.key}
                    scrollY={viewingAnchorTableScrollY}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                    columns={[
                      {
                        title: 'STT',
                        width: 50,
                        align: 'center' as const,
                        render: (_: unknown, __: unknown, idx: number) => idx + 1,
                      },
                      {
                        title: 'Tên điểm neo',
                        dataIndex: 'name',
                        key: 'name',
                        width: 180,
                        render: (name?: string) => (
                          <span
                            style={{
                              fontSize: fontSizeMd,
                              color: textPrimary,
                              fontWeight: fontWeightBold,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                            title={name || ''}
                          >
                            {name || ''}
                          </span>
                        ),
                      },
                      {
                        title: 'Vĩ độ (Latitude - N)',
                        key: 'lat',
                        width: 180,
                        align: 'center' as const,
                        render: (_v: unknown, rec: any) => renderDmsText(rec.latitude, true),
                      },
                      {
                        title: 'Kinh độ (Longitude - E)',
                        key: 'lng',
                        width: 180,
                        align: 'center' as const,
                        render: (_v: unknown, rec: any) => renderDmsText(rec.longitude, false),
                      },
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        )}
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
            defaultGeometryType={(watchedGeometryType as any) || 'POINT'}
            height={520}
            onChange={(val) => {
              if (val?.coordinates) {
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

StormShelterForm.displayName = 'StormShelterForm';
export default StormShelterForm;
