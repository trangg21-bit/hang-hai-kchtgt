import { useEffect, useState, forwardRef, useImperativeHandle, useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import {
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  Select,
  Tabs,
  Button,
  Space,
  DatePicker,
  Modal,
  Tooltip,
} from 'antd';
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
import {
  colors,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  actionPrimary,
  statusCritical,
  statusOperational,
  statusAttention,
  fontSizeSm,
  fontSizeLg,
  fontWeightBold,
  fontWeightMedium,
  radiusPill,
  radiusMd,
  spaceXs,
  spaceSm,
  spaceFormField,
  surfaceCard,
  readonlyInputStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  drawerTabBarStyle,
  drawerFormScrollStyle,
  DRAWER_TABLE_SCROLL_Y,
  sidebarBg,
  textAreaStyle,
  getDatePickerProps,
  isUuidString,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import { fmtInputNumber, normalizeSafeNumber } from '../../utils/numFmt';
import { NumberInputWithCount } from '../../components/shared/NumberInputWithCount';
import { decimalNumberRule, parseNumber20, getValueFromEvent20, safeDecimal } from '../../utils/numberRuleHelper';
import { organizationService, type Organization } from '../../services/organizationService';
import api from '../../services/api';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { FormOrgUnitTreeSelect, resolveDefaultOrgUnitId } from '../../components/org-unit';
import { symbolService, type Symbol } from '../../services/symbolService';
import { userService } from '../../services/userService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import { useAuthStore } from '../../store/authStore';
import { GEOMETRY_POINT_COUNT, parseWktToCoordinates } from '../../utils/gisGeometry';
import toast from '../../components/ToastNotification';
import {
  REGION_OPTIONS,
  PORT_STATUS_OPTIONS,
  GEOMETRY_TYPE_OPTIONS,
  COORD_SYS_OPTIONS,
  ddToDms,
  buildCoordinatesWkt,
} from './dry-port/schema';
import type { DryPort, SaveAction } from './dry-port/types';
import {
  createDryPort,
  updateDryPort,
  fetchDryPortById,
  generateDryPortCode,
  fetchDryPortAttachmentList,
  uploadDryPortAttachments,
  deleteDryPortAttachment,
  downloadDryPortAttachment,
} from './dry-port/api';

const fontSizeMd = 13.5;

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };


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

/**
 * Bảng tọa độ DMS 3 ô Độ, Phút, Giây bo tròn chuẩn PortForm / BerthForm.
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
      key: 'd',
      base: 'Độ',
      value: dVal,
      max: maxDeg,
      radius: '999px 0 0 999px',
      unit: '°',
      unitStyle: dmsUnitStyle,
      basis: '1 0 108px',
      width: 108,
      step: 1,
      msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm',
      base: 'Phút',
      value: mVal,
      max: 59,
      radius: '0',
      unit: "'",
      unitStyle: dmsUnitStyle,
      basis: '1 0 108px',
      width: 108,
      step: 1,
      msg: started && mVal == null ? 'Phút bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, v, sVal ?? null),
    },
    {
      key: 's',
      base: 'Giây',
      value: sVal,
      max: 59.99,
      radius: '0',
      unit: '"',
      unitStyle: dmsUnitEndStyle,
      basis: '1.2 0 130px',
      width: 130,
      step: 0.01,
      formatter: fmtInputNumber,
      msg: started && sVal == null ? 'Giây bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, mVal ?? null, v),
    },
  ] as const;

  const inputRow = (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ display: 'flex', alignItems: 'center', flex: inp.basis, width: inp.width, minWidth: 0 }}>
          <InputNumber
            min={0}
            max={inp.max}
            step={inp.step}
            value={inp.value}
            onChange={inp.onEdit}
            placeholder={inp.base}
            formatter={inp.formatter}
            style={{
              width: '100%',
              borderRadius: inp.radius,
              height: 32,
              fontSize: fontSizeMd,
              borderColor: inp.msg ? statusCritical : undefined,
            }}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

  const hasAnyMsg = inputs.some((inp) => !!inp.msg);
  const messageRow = hasAnyMsg ? (
    <div style={{ display: 'flex', width: '100%', minWidth: 0, marginTop: 2 }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, width: inp.width, minWidth: 0 }}>
          {inp.msg ? (
            <span style={{ color: statusCritical, fontSize: 11, lineHeight: '13px', display: 'block' }}>
              {inp.msg}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  ) : null;

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
  const [scaleOpen, setScaleOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const currentUser = useAuthStore((s) => s.user);
  const isInitialLoadDoneRef = useRef(false);

  const watchedGeometryType = Form.useWatch('geometryType', form);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code?: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<
    Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>
  >([]);
  const hasCoordinates = coordinateList.some((c) => (c.latD ?? c.latM ?? c.latS) != null && (c.lngD ?? c.lngM ?? c.lngS) != null);
  const effectiveGeometryType = watchedGeometryType || form.getFieldValue('geometryType') || (coordinateList.length > 0 || form.getFieldValue('mapSymbolId') ? 'POINT' : undefined);
  const hasLocation = Boolean(effectiveGeometryType || hasCoordinates);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);

  // Attachments
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  const [pendingDeletedAttIds, setPendingDeletedAttIds] = useState<string[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  const mappedAttachments: InfrastructureAttachmentItem[] = useMemo(() => {
    return uploadFileList.map((f: any) => ({
      id: f.id || f.uid,
      uid: f.uid || f.id,
      fileName: f.fileName || f.name,
      name: f.name || f.fileName,
      fileSize: f.fileSize ?? f.size,
      size: f.size ?? f.fileSize,
      uploadedByName: f.uploadedByName || (!isUuidString(f.uploadedBy) ? f.uploadedBy : '') || (f.uploadedBy ? userMap.get(f.uploadedBy) : '') || 'Cán bộ quản lý',
      uploadedDate: f.uploadedDate || f.uploadedAt || f.createdAt,
      uploadedAt: f.uploadedAt || f.uploadedDate || f.createdAt,
      status: f.status,
      originFileObj: f.originFileObj,
    }));
  }, [uploadFileList, userMap]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => map.set(u.id, u.fullName || u.username || u.id));
        setUserMap(map);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then((r) => {
      const symList = r.data || [];
      setSymbols(symList);
      const currSymId = form.getFieldValue('mapSymbolId');
      if (currSymId && symList.length > 0) {
        const matched = symList.find((s: any) => s.id.toLowerCase() === String(currSymId).toLowerCase());
        if (matched && matched.id !== currSymId) {
          form.setFieldsValue({ mapSymbolId: matched.id });
        }
      }
    }).catch(() => {});
  }, [form]);

  useEffect(() => {
    setLoadingOrgs(true);
    organizationService
      .list({ pageSize: 1000 })
      .then((r) => setOrganizations(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingOrgs(false));
  }, []);

  useEffect(() => {
    if (isEdit) return;
    const currentOrgUnitId = resolveDefaultOrgUnitId(currentUser, organizations)
      || (currentUser?.orgUnitId && currentUser.orgUnitId !== '00000000-0000-0000-0000-000000000017' && currentUser.orgUnitId !== 'G17' ? currentUser.orgUnitId : undefined);
    if (currentOrgUnitId && !form.getFieldValue('orgUnitId')) {
      form.setFieldsValue({ orgUnitId: currentOrgUnitId });
    } else if (!form.getFieldValue('orgUnitId') && !currentUser?.orgUnitId) {
      api.get('/users/me').then((r) => {
        const p = r.data?.data ?? r.data;
        const uOrgId = p?.orgUnitId;
        if (uOrgId && uOrgId !== '00000000-0000-0000-0000-000000000017' && uOrgId !== 'G17' && !form.getFieldValue('orgUnitId')) {
          form.setFieldsValue({ orgUnitId: uOrgId });
        }
      }).catch(() => {});
    }
  }, [isEdit, currentUser, organizations, form]);

  useEffect(() => {
    api.get('/common/options/operating-units').then((r) => {
      const list = r.data?.data;
      if (Array.isArray(list) && list.length) setOperatingOrgs(list);
    }).catch(() => {});
  }, []);

  // Tự sinh mã khi thêm mới
  useEffect(() => {
    if (!isEdit) {
      setCodeLoading(true);
      generateDryPortCode()
        .then((code) => {
          if (code) form.setFieldsValue({ dryPortCode: code });
        })
        .catch(() => {})
        .finally(() => setCodeLoading(false));
    }
  }, [isEdit, form]);

  // Tự động set số dòng GPS khi thay đổi loại đối tượng
  useEffect(() => {
    if (isEdit && !isInitialLoadDoneRef.current) {
      return;
    }
    if (!watchedGeometryType) {
      return;
    }
    form.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
    setCoordinateList((prev) => {
      if (!prev || prev.length === 0) {
        return Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      }
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      }
      return prev;
    });
  }, [watchedGeometryType, isEdit, form]);

  // Load dữ liệu khi chỉnh sửa
  useEffect(() => {
    if (!isEdit || !id) return;
    isInitialLoadDoneRef.current = false;
    (async () => {
      try {
        const data: DryPort = await fetchDryPortById(id);
        const pts = parseWktToCoordinates(data.coordinates);
        if (pts.length > 0) {
          setCoordinateList(
            pts.map((p) => {
              const la = ddToDms(p.latitude);
              const lo = ddToDms(p.longitude);
              return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
            }),
          );
        } else if (data.latitude != null && data.longitude != null) {
          const la = ddToDms(data.latitude);
          const lo = ddToDms(data.longitude);
          setCoordinateList([{ latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s }]);
        }

        let geomType = data.geometryType;
        if (!geomType && data.coordinates) {
          const wktUpper = String(data.coordinates).trim().toUpperCase();
          if (wktUpper.startsWith('POLYGON')) geomType = 'POLYGON';
          else if (wktUpper.startsWith('LINESTRING')) geomType = 'LINE';
          else if (wktUpper.startsWith('POINT')) geomType = 'POINT';
        }
        if (!geomType && (pts.length > 0 || (data.latitude != null && data.longitude != null))) {
          geomType = pts.length > 2 ? 'POLYGON' : pts.length === 2 ? 'LINE' : 'POINT';
        }

        const displayRuleText = data.displayRule === 1 || data.displayRule === '1' || data.displayRule === 'Độ, phút, giây (DMS)'
          ? 'Độ, phút, giây (DMS)'
          : (data.displayRule || (geomType || data.coordinates ? 'Độ, phút, giây (DMS)' : undefined));

        const resolvedOpOrgId = (data as any).operatingOrgId
          || (data.operatingUnit && isUuidString(data.operatingUnit) ? data.operatingUnit : undefined)
          || DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.name === data.operatingUnit)?.id
          || data.operatingUnit;

        const rawSymId = data.mapSymbolId || (data as any).bieuTuongId || (data as any).symbolId;
        const matchedSym = rawSymId && symbols.length > 0 ? symbols.find((s) => s.id.toLowerCase() === String(rawSymId).toLowerCase()) : null;
        const resolvedSymId = matchedSym ? matchedSym.id : rawSymId;

        form.setFieldsValue({
          dryPortCode: data.dryPortCode,
          dryPortName: data.dryPortName,
          orgUnitId: data.orgUnitId || undefined,
          operatingOrgId: resolvedOpOrgId,
          operatingUnit: data.operatingUnit,
          region: data.region,
          provinceId: data.provinceId != null ? (VIETNAM_PROVINCES[data.provinceId - 1] || undefined) : undefined,
          detailedLocation: data.detailedLocation,
          transportCorridor: data.transportCorridor,
          area: normalizeSafeNumber(data.area),
          teuCapacity: normalizeSafeNumber(data.teuCapacity),
          warehouseArea: normalizeSafeNumber(data.warehouseArea),
          yardArea: normalizeSafeNumber(data.yardArea),
          connectionMode: data.connectionMode,
          portStatus: data.portStatus !== undefined && data.portStatus !== null ? data.portStatus : 0,
          remarks: data.remarks,
          openingAnnouncementDate: data.openingAnnouncementDate
            ? dayjs(data.openingAnnouncementDate)
            : data.announcementDecisionDate
              ? dayjs(data.announcementDecisionDate)
              : data.announcementTime
                ? dayjs(data.announcementTime)
                : undefined,
          openingDecision: data.openingDecision || data.announcementDecisionNumber || undefined,
          investmentAgreementDoc: data.investmentAgreementDoc || undefined,
          announcementTime: data.announcementTime ? dayjs(data.announcementTime) : undefined,
          announcementDecisionNumber: data.announcementDecisionNumber,
          announcementDecisionDate: data.announcementDecisionDate ? dayjs(data.announcementDecisionDate) : undefined,
          announcementOrg: data.announcementOrg,
          geometryType: geomType || undefined,
          mapSymbolId: resolvedSymId || undefined,
          coordinateSystem: data.coordinateSystem ?? (geomType ? 1 : undefined),
          displayRule: displayRuleText,
        });
        isInitialLoadDoneRef.current = true;

        // Load attachments
        const atts = await fetchDryPortAttachmentList(id);
        setUploadFileList(
          (atts || []).map((a: any) => ({
            uid: a.id,
            id: a.id,
            name: a.fileName,
            fileName: a.fileName,
            size: a.fileSize,
            fileSize: a.fileSize,
            uploadedBy: a.uploadedBy,
            uploadedByName: a.uploadedByName || (!isUuidString(a.uploadedBy) ? a.uploadedBy : undefined) || (a.uploadedBy ? userMap.get(a.uploadedBy) : undefined) || 'Cán bộ quản lý',
            uploadedAt: a.uploadedAt,
            uploadedDate: a.uploadedDate || a.uploadedAt,
            status: 'done' as const,
          })),
        );
      } catch {
        toast.error('Không thể tải thông tin cảng cạn');
      }
    })();
  }, [isEdit, id, form, symbols]);

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


  const handleSave = useCallback(
    async (saveAction: SaveAction) => {
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

        const toPayloadNumber = (v: unknown): number | undefined => {
          if (v == null) return undefined;
          if (typeof v === 'number') return isNaN(v) ? undefined : v;
          const s = String(v).replace(/,/g, '').trim();
          if (s === '') return undefined;
          const num = Number(s);
          return isNaN(num) ? undefined : num;
        };

        if (saveAction === 'SUBMIT' || saveAction === 'SAVE_AND_APPROVE') {
          const missing: string[] = [];
          if (!orgUnitId) missing.push('Đơn vị quản lý');
          if (!provinceName) missing.push('Địa điểm (Tỉnh/Thành Phố)');
          if (!values.detailedLocation?.trim()) missing.push('Địa điểm chi tiết');
          if (toPayloadNumber(values.teuCapacity) == null) missing.push('Công suất khai thác');
          if (values.portStatus == null) missing.push('Tình trạng');
          if (missing.length > 0) {
            toast.error(`Vui lòng hoàn thiện thông tin trước khi lưu. Thiếu: ${missing.join(', ')}`);
            onSubmittingChange?.(false);
            return;
          }
        }

        const hasGeom = !!values.geometryType;
        const manualCoords = hasGeom
          ? coordinateList
              .filter((c) => (c.latD ?? c.latM ?? c.latS) != null && (c.lngD ?? c.lngM ?? c.lngS) != null)
              .map((c) => ({
                latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
                longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
              }))
          : [];

        if (values.geometryType) {
          const minCount = GEOMETRY_POINT_COUNT[values.geometryType] ?? 1;
          if (manualCoords.length < minCount) {
            toast.error(
              values.geometryType === 'POLYGON'
                ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ'
                : values.geometryType === 'LINE'
                  ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ'
                  : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ',
            );
            setActiveTabKey('gis');
            onSubmittingChange?.(false);
            return;
          }
        }

        if (effectiveGeometryType && !values.mapSymbolId) {
          toast.error('Vui lòng chọn biểu tượng bản đồ');
          setActiveTabKey('gis');
          onSubmittingChange?.(false);
          return;
        }

        if (manualCoords.length > 0 && !values.geometryType) {
          toast.error('Loại đối tượng là bắt buộc khi có tọa độ');
          setActiveTabKey('gis');
          onSubmittingChange?.(false);
          return;
        }

        const actionMap: Partial<Record<SaveAction, string>> = {
          DRAFT: 'draft',
          SUBMIT: 'submit',
          SAVE_AND_APPROVE: 'approve',
          APPROVE: 'approve',
        };

        const selectedOp = operatingOrgs.find((o) => o.id === values.operatingOrgId || o.id === values.operatingUnit);
        const opOrgId = values.operatingOrgId || selectedOp?.id || undefined;
        const opUnit = selectedOp ? selectedOp.name : values.operatingUnit || values.operatingOrgId || undefined;

        const payload: any = {
          saveAction: actionMap[saveAction],
          dryPortCode: String(values.dryPortCode || '').trim() || undefined,
          dryPortName,
          orgUnitId,
          geometryType: hasGeom ? values.geometryType : null,
          latitude: hasGeom && manualCoords.length > 0 ? manualCoords[0].latitude : null,
          longitude: hasGeom && manualCoords.length > 0 ? manualCoords[0].longitude : null,
          coordinates: hasGeom ? buildCoordinatesWkt(values.geometryType, manualCoords) : null,
          operatingOrgId: opOrgId,
          operatingUnit: opUnit,
          region: values.region || undefined,
          provinceId: provinceName ? VIETNAM_PROVINCES.indexOf(provinceName) + 1 : undefined,
          detailedLocation: values.detailedLocation || undefined,
          transportCorridor: values.transportCorridor || undefined,
          area: safeDecimal(values.area),
          teuCapacity: safeDecimal(values.teuCapacity),
          warehouseArea: safeDecimal(values.warehouseArea),
          yardArea: safeDecimal(values.yardArea),
          connectionMode: values.connectionMode || undefined,
          portStatus: values.portStatus !== undefined && values.portStatus !== null ? Number(values.portStatus) : undefined,
          remarks: values.remarks || undefined,
          mapSymbolId: hasGeom ? (values.mapSymbolId || null) : null,
          coordinateSystem:
            hasGeom && values.coordinateSystem !== undefined && values.coordinateSystem !== null
              ? Number(values.coordinateSystem)
              : null,
          displayRule:
            hasGeom && values.displayRule != null && !Number.isNaN(Number(values.displayRule))
              ? Number(values.displayRule)
              : (hasGeom ? 1 : null),
          announcementTime: values.announcementTime
            ? typeof values.announcementTime === 'string'
              ? values.announcementTime
              : values.announcementTime.toISOString()
            : undefined,
          announcementDecisionNumber: values.announcementDecisionNumber || undefined,
          announcementDecisionDate: values.announcementDecisionDate
            ? typeof values.announcementDecisionDate === 'string'
              ? values.announcementDecisionDate
              : values.announcementDecisionDate.format('YYYY-MM-DD')
            : undefined,
          announcementOrg: values.announcementOrg || undefined,
          // Opening announcement (đồng bộ chuẩn Cầu cảng - Pier)
          openingAnnouncementDate: values.openingAnnouncementDate
            ? typeof values.openingAnnouncementDate === 'string'
              ? values.openingAnnouncementDate
              : values.openingAnnouncementDate.format('YYYY-MM-DD')
            : undefined,
          openingDecision: values.openingDecision?.trim() || undefined,
          investmentAgreementDoc: values.investmentAgreementDoc?.trim() || undefined,
        };

        Object.keys(payload).forEach((key) => {
          if (payload[key] === undefined) delete payload[key];
        });

        let savedId: string | undefined;
        if (isEdit && id) {
          await updateDryPort({ ...payload, id });
          savedId = id;
        } else {
          const res = await createDryPort(payload);
          savedId = res?.id;
        }

        // Xóa các file đính kèm được đánh dấu xóa
        if (savedId && pendingDeletedAttIds.length > 0) {
          for (const attId of pendingDeletedAttIds) {
            await deleteDryPortAttachment(savedId, attId);
          }
        }

        // Upload các file đính kèm mới
        const filesToUpload = uploadFileList.filter((f: any) => f && f.originFileObj);
        if (savedId && filesToUpload.length > 0) {
          const uploadedCount = await uploadDryPortAttachments(savedId, filesToUpload);
          if (uploadedCount > 0) toast.success(`Đã tải lên ${uploadedCount} tệp đính kèm`);
        }

        const successMsg =
          saveAction === 'DRAFT'
            ? 'Lưu tạm thành công'
            : saveAction === 'SUBMIT'
              ? 'Lưu và gửi phê duyệt thành công'
              : saveAction === 'SAVE_AND_APPROVE'
                ? 'Lưu và phê duyệt thành công'
                : 'Cập nhật thành công';
        toast.success(successMsg);

        onFinish(true);
      } catch (err: unknown) {
        if ((err as any)?.errorFields) {
          const errFields: Array<{ name: Array<string | number>; errors?: string[] }> = (err as any)?.errorFields ?? [];
          const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra lại các trường bắt buộc';
          toast.error(firstError);
          if (errFields.some((f) => ['mapSymbolId', 'coordinateSystem', 'displayRule', 'geometryType'].includes(String(f.name[0])))) {
            setActiveTabKey('gis');
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
    },
    [form, coordinateList, isEdit, id, onFinish, onSubmittingChange, hasLocation, effectiveGeometryType, pendingDeletedAttIds, uploadFileList],
  );

  useImperativeHandle(
    ref,
    () => ({
      submit: (saveAction: SaveAction) => {
        void handleSave(saveAction);
      },
    }),
    [handleSave],
  );

  const totalAttachmentsCount = uploadFileList.length;

  const formTabs = [
    // ── Tab 1: Thông tin chung ──
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={drawerFormScrollStyle}>
          {/* Section 1: Thông tin cơ bản & Quản lý vận hành */}
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
                  <FormOrgUnitTreeSelect
                    organizations={organizations}
                    placeholder="Chọn đơn vị quản lý..."
                    loading={loadingOrgs}
                    disabled={isEdit}
                    showPath
                    treeDefaultExpandAll={false}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dryPortCode"
                  {...labelProps('Mã cảng cạn')}
                  style={{ marginBottom: spaceFormField }}
                  tooltip="Mã cảng cạn được sinh tự động, không thể chỉnh sửa"
                >
                  <Input disabled placeholder={codeLoading ? 'Đang sinh mã...' : 'Mã tự động'} style={readonlyInputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="dryPortName"
                  {...labelProps('Tên cảng cạn')}
                  required
                  rules={[
                    { required: true, message: 'Tên cảng cạn không được để trống' },
                    { max: 255, message: 'Tên cảng cạn tối đa 255 ký tự' },
                  ]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input placeholder="Nhập tên cảng cạn" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="operatingOrgId"
                  {...labelProps('Đơn vị khai thác')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Đơn vị khai thác không được để trống' }]}
                >
                  <Select
                    placeholder="Chọn đơn vị khai thác..."
                    options={operatingOrgs.map((o) => ({ value: o.id, label: o.name }))}
                    showSearch
                    optionFilterProp="label"
                    allowClear
                    style={selectStyle}
                  />
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
                <Form.Item
                  name="provinceId"
                  {...labelProps('Địa điểm (Tỉnh/Thành Phố)')}
                  required
                  rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    showSearch
                    placeholder="Chọn tỉnh/thành phố..."
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="portStatus"
                  {...labelProps('Tình trạng')}
                  required
                  rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}
                  style={{ marginBottom: spaceFormField }}
                  initialValue={0}
                >
                  <Select options={PORT_STATUS_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="transportCorridor" {...labelProps('Hành lang vận tải')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập hành lang vận tải" maxLength={100} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  name="connectionMode"
                  {...labelProps('Phương thức kết nối giao thông với cảng')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập phương thức kết nối giao thông với cảng"
                    maxLength={2000}
                    showCount
                    style={textAreaStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  name="detailedLocation"
                  {...labelProps('Địa điểm chi tiết')}
                  required
                  rules={[{ required: true, message: 'Địa điểm chi tiết là bắt buộc' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="remarks" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={3} placeholder="Nhập ghi chú" maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Section 2: Quy mô & Năng lực khai thác */}
          <div style={sectionBoxStyle}>
            <div
              onClick={() => setScaleOpen(!scaleOpen)}
              style={{
                ...sectionHeaderStyle,
                marginBottom: scaleOpen ? 12 : 0,
                paddingBottom: scaleOpen ? 8 : 0,
                borderBottom: scaleOpen ? '1px solid #f1f5f9' : 'none',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={sectionTitleStyle}>
                <SlidersOutlined style={{ color: actionPrimary }} />
                <span>Quy mô & Năng lực khai thác</span>
              </div>
              <span style={{ color: actionPrimary, fontSize: 12 }}>{scaleOpen ? <DownOutlined /> : <RightOutlined />}</span>
            </div>
            {scaleOpen && (
              <>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="teuCapacity"
                      {...labelProps('Công suất khai thác')}
                      required
                      rules={[{ required: true, message: 'Công suất khai thác là bắt buộc' }, decimalNumberRule]}
                      style={{ marginBottom: spaceFormField }}
                      getValueFromEvent={getValueFromEvent20}
                    >
                      <NumberInputWithCount
                        min={0}
                        step={0.01}
                        maxLength={20}
                        placeholder="0"
                        style={numberInputStyle}
                        parser={parseNumber20}
                        formatter={fmtInputNumber}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="area" {...labelProps('Tổng diện tích cảng (m²)')} style={{ marginBottom: spaceFormField }} rules={[decimalNumberRule]} getValueFromEvent={getValueFromEvent20}>
                      <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} parser={parseNumber20} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="warehouseArea" {...labelProps('Diện tích kho (m²)')} style={{ marginBottom: spaceFormField }} rules={[decimalNumberRule]} getValueFromEvent={getValueFromEvent20}>
                      <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} parser={parseNumber20} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="yardArea" {...labelProps('Diện tích bãi (m²)')} style={{ marginBottom: spaceFormField }} rules={[decimalNumberRule]} getValueFromEvent={getValueFromEvent20}>
                      <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} parser={parseNumber20} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </div>

          {/* Section 3: Thông tin công bố mở, đưa vào sử dụng (đồng bộ chuẩn Cầu cảng - Pier) */}
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
              <span style={{ color: actionPrimary, fontSize: fontSizeSm }}>{announcementOpen ? <DownOutlined /> : <RightOutlined />}</span>
            </div>
            {announcementOpen && (
              <div>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="openingAnnouncementDate" {...labelProps('Thời điểm công bố mở, đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker {...getDatePickerProps({ placeholder: 'Chọn thời điểm' })} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={24}>
                    <Form.Item name="openingDecision" {...labelProps('Quyết định công bố/ Văn bản cho phép khai thác')} style={{ marginBottom: spaceFormField }}>
                      <Input.TextArea rows={3} placeholder="Nhập quyết định" maxLength={2000} showCount style={textAreaStyle} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={24}>
                    <Form.Item name="investmentAgreementDoc" {...labelProps('Văn bản thỏa thuận đầu tư xây dựng')} style={{ marginBottom: spaceFormField }}>
                      <Input.TextArea rows={3} placeholder="Nhập văn bản thỏa thuận" maxLength={2000} showCount style={textAreaStyle} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        </div>
      ),
    },

    // ── Tab 2: Thông tin vị trí ──
    {
      key: 'gis',
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
                    onChange={(val) => {
                      if (!val) {
                        form.setFieldsValue({
                          mapSymbolId: undefined,
                          coordinateSystem: undefined,
                          displayRule: undefined,
                        });
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
                  required={!!effectiveGeometryType}
                  rules={
                    effectiveGeometryType
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
                    disabled={!effectiveGeometryType && !form.getFieldValue('mapSymbolId')}
                    style={selectStyle}
                  >
                    {symbols.map((sym) => (
                      <Select.Option
                        key={sym.id}
                        value={sym.id}
                        label={(sym as any).code ? `${sym.name} (${(sym as any).code})` : sym.name}
                      >
                        <Space>
                          {sym.image && (
                            <img
                              src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                              alt={sym.name}
                              style={{ width: 20, height: 20, objectFit: 'contain' }}
                            />
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
          </div>

          <div style={sectionBoxStyle}>
            <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
              <span
                style={{
                  color: colors.sidebarBg,
                  fontWeight: fontWeightBold,
                  fontSize: fontSizeMd,
                  lineHeight: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 32,
                }}
              >
                Tọa độ GPS ({coordinateList.length})
              </span>
              <Space size={8}>
                <Button
                  icon={<EnvironmentOutlined style={{ color: !watchedGeometryType ? undefined : actionPrimary }} />}
                  onClick={() => setGisModalOpen(true)}
                  disabled={!watchedGeometryType}
                  style={
                    !watchedGeometryType
                      ? {
                          height: 32,
                          fontSize: fontSizeMd,
                          padding: '0 14px',
                          borderRadius: radiusPill,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          opacity: 0.6,
                          cursor: 'not-allowed',
                        }
                      : {
                          ...outlineButtonStyle,
                          height: 32,
                          fontSize: fontSizeMd,
                          padding: '0 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }
                  }
                >
                  Chọn tọa độ trên bản đồ
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addGpsPoint}
                  disabled={!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)}
                  style={
                    !watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)
                      ? {
                          height: 32,
                          fontSize: fontSizeMd,
                          padding: '0 14px',
                          borderRadius: radiusPill,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#f5f5f5',
                          borderColor: '#d9d9d9',
                          color: 'rgba(0, 0, 0, 0.25)',
                          cursor: 'not-allowed',
                        }
                      : {
                          ...primaryButtonStyle,
                          height: 32,
                          fontSize: fontSizeMd,
                          padding: '0 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }
                  }
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
              <DetailTable
                size="small"
                scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
                dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
                rowKey={(r: any, idx?: number) => r?._idx ?? String(idx)}
                emptyText="Chưa có tọa độ GPS nào"
                columns={[
                  {
                    title: 'STT',
                    width: 60,
                    align: 'center' as const,
                    onCell: () => ({ style: { verticalAlign: 'top', paddingTop: 14 } }),
                    render: (_v: any, _r: any, idx?: number) => (idx ?? 0) + 1,
                  },
                  {
                    title: <span>Vĩ độ (Latitude - N) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>,
                    key: 'lat',
                    onCell: () => ({ style: { verticalAlign: 'top' } }),
                    render: (_v: any, record: any) =>
                      renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
                  },
                  {
                    title: <span>Kinh độ (Longitude - E) <span style={{ color: statusCritical, fontSize: 12 }}>*</span></span>,
                    key: 'lng',
                    onCell: () => ({ style: { verticalAlign: 'top' } }),
                    render: (_v: any, record: any) =>
                      renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
                  },
                  {
                    title: '',
                    width: 50,
                    align: 'center' as const,
                    onCell: () => ({ style: { verticalAlign: 'top', paddingTop: 10 } }),
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

    // ── Tab 3: File đính kèm ──
    {
      key: 'files',
      label: `File đính kèm (${uploadFileList.length})`,
      children: (
        <div style={drawerFormScrollStyle}>
          <InfrastructureAttachmentTab
            attachments={mappedAttachments}
            readonly={false}
            userMap={userMap}
            onUpload={(file) => {
              const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];
              const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
              if (!ALLOWED_EXTS.includes(ext)) {
                toast.error('Định dạng không hỗ trợ (chỉ chấp nhận PDF, DOC/DOCX, XLS/XLSX, JPG, PNG, TIFF)');
                return false;
              }
              if (file.size > 20 * 1024 * 1024) {
                toast.error('File vượt quá 20MB');
                return false;
              }
              const nowIso = dayjs().toISOString();
              const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
              const newUid = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              setUploadFileList((prev: any[]) => {
                const currentList = Array.isArray(prev) ? prev : [];
                return [
                  ...currentList,
                  {
                    uid: newUid,
                    id: newUid,
                    name: file.name,
                    fileName: file.name,
                    size: file.size,
                    fileSize: file.size,
                    type: file.type,
                    fileType: file.type,
                    status: 'done',
                    originFileObj: file,
                    uploadedByName: uploaderName,
                    uploadedBy: currentUser?.userId || currentUser?.id || uploaderName,
                    uploadedDate: nowIso,
                    uploadedAt: nowIso,
                    createdAt: nowIso,
                  },
                ];
              });
              return false;
            }}
            onDelete={(uid) => {
              const fileToDelete = uploadFileList.find((x) => x.uid === uid || (x as any).id === uid);
              if (fileToDelete && !fileToDelete.originFileObj) {
                const attId = (fileToDelete as any).id || fileToDelete.uid;
                if (attId) setPendingDeletedAttIds((prev) => [...prev, attId]);
              }
              setUploadFileList((prev: any[]) =>
                (Array.isArray(prev) ? prev : []).filter((x) => x.uid !== uid && (x as any).id !== uid),
              );
            }}
            onDownload={(attId, fileName) => {
              if (isEdit && id && attId) {
                void downloadDryPortAttachment(id, attId, fileName);
              }
            }}
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
        destroyOnHidden
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
                    const key = (p: { latitude: number; longitude: number }) =>
                      `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                    const existingKeys = new Set(
                      existing
                        .filter((c) => c.latD != null && c.lngD != null)
                        .map((c) =>
                          key({
                            latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
                            longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
                          }),
                        ),
                    );
                    const toAdd = points
                      .filter((p) => !existingKeys.has(key(p)))
                      .map((p) => {
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
