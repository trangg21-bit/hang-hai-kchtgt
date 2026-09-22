import React, { useState, useEffect, useRef } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Tabs,
  Space,
  Row,
  Col,
  Spin,
  Modal,
} from 'antd';
import {
  EnvironmentOutlined,
  PlusOutlined,
  DeleteOutlined,
  BankOutlined,
} from '@ant-design/icons';
import toast from '../../../components/ToastNotification';
import { focusErrorTab } from '../../../utils/formValidationHelper';
import { hanoiStationService } from '../../../services/hanoiStationService';
import { symbolService } from '../../../services/symbolService';
import { organizationService } from '../../../services/organizationService';
import { DEFAULT_GIS_SYMBOLS } from '../../vtsoperationcenter/VtsOperationCenterForm';
import type {
  HanoiStationItem,
  CreateHanoiStationRequest,
  UpdateHanoiStationRequest,
} from '../../../types/hanoiStation';
import { HANOI_SERVICE_OPTIONS } from '../../../types/hanoiStation';
import { ApprovalStatus, CONDITION_STATUS_OPTIONS } from '../../../types/vtsSystem';
import {
  drawerTitleStyle, primaryButtonStyle, outlineButtonStyle,
  drawerTabBarStyle, drawerFormScrollStyle, DRAWER_TABLE_SCROLL_Y, DRAWER_WIDTH,
  requiredMarkStyle, spaceFormField, radiusPill, sidebarBg,
  fontWeightBold, fontSizeMd, fontSizeSm, fontSizeLg,
  textTertiary, borderDefault,
  statusCritical, statusOperational, actionPrimary,
  readonlyInputStyle, inputStyle, selectStyle, spaceSm,
  spaceXs,
  textAreaStyle,
} from '../../../themetokenchk';
import { checkCanSaveAndApprove, isCucLevelUser } from '../../../hooks/useKchtPermissions';
import { fmtInputNumber } from '../../../utils/numFmt';
import { VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import AppDrawer from '../../../components/shared/AppDrawer';
import { useAuthStore, type AuthState } from '../../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../../store/permissionStore';
import { canEditApprovalRecord } from '../../../utils/approvalEditPolicy';
import { FormOrgUnitTreeSelect, normalizeSearchText, resolveDefaultFormOrgUnitId } from '../../../components/org-unit';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import DetailTable from '../../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../../components/shared/InfrastructureAttachmentTab';
import ServiceMultiSelect from '../../../components/shared/ServiceMultiSelect';
import GisLocationSelector from '../../../components/gis/GisLocationSelector';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import {
  validateDmsCoordinates,
  serializeCoordinatesToWkt,
  parseWktToCoordinates,
  ddToDms,
  dmsToDd,
} from '../../../utils/gisGeometry';
import { resolveStationGeometryType } from '../../../utils/stationGeometryType';
import HanoiStationDetailContent, { getOperatingOrgName, renderServicesBadges } from './HanoiStationDetailContent';

export { getOperatingOrgName, renderServicesBadges };

export interface HanoiStationFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: HanoiStationItem | null;
  mode?: 'create' | 'edit' | 'detail';
  orgUnits?: any[];
  symbols?: any[];
  onCancel?: () => void;
  onSuccess?: () => void;
  onClose?: () => void;
}

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
  color: sidebarBg,
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

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

export const HanoiStationForm: React.FC<HanoiStationFormProps> = ({
  open = true,
  editId,
  initialData,
  mode = 'create',
  orgUnits: externalOrgUnits,
  symbols: externalSymbols,
  onCancel,
  onSuccess,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('general');
  const [loading, setLoading] = useState(Boolean(editId || initialData?.id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('draft');

  const [symbols, setSymbols] = useState<any[]>([]);
  const [internalOrgUnits, setInternalOrgUnits] = useState<any[]>([]);
  const [record, setRecord] = useState<HanoiStationItem | null>(null);

  const [coordinateList, setCoordinateList] = useState<{
    latD: number | null;
    latM: number | null;
    latS: number | null;
    lngD: number | null;
    lngM: number | null;
    lngS: number | null;
  }[]>([]);

  const [attachments, setAttachments] = useState<any[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);
  const isAdmin = hasPerm('*') || hasPerm('admin:all');
  const canApproveL2 = checkCanSaveAndApprove('coastalstationhaiphong', hasPerm, currentUser) || checkCanSaveAndApprove('ttxltt', hasPerm, currentUser) || (isAdmin && isCucLevelUser(currentUser));
  const canCreate = hasPerm('coastalstationhaiphong:create');
  const canUpdate = canEditApprovalRecord(record?.approvalStatus, {
    hasPerm,
    resource: 'coastalstationhaiphong',
  });

  const isDetailMode = mode === 'detail';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  const watchedGeometryType = Form.useWatch('geometryType', form);
  const hasCoordinates = coordinateList.some((c) => c.latD != null || c.latM != null || c.latS != null || c.lngD != null || c.lngM != null || c.lngS != null);
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);

  useEffect(() => {
    if (!watchedGeometryType) {
      form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined, symbolId: undefined });
      setCoordinateList([]);
    } else {
      form.setFieldsValue({
        coordinateSystem: 1,
        displayRule: 'Độ, phút, giây (DMS)',
      });
    }
  }, [watchedGeometryType, form]);

  useEffect(() => {
    if (open) {
      if (externalOrgUnits && externalOrgUnits.length > 0) {
        setInternalOrgUnits(externalOrgUnits);
      } else {
        organizationService.getAll()
          .then((res: any) => {
            const items = Array.isArray(res) ? res : (res?.data || []);
            setInternalOrgUnits(items.map((o: any) => ({
              id: String(o.id),
              name: o.name || o.unitName || o.tenDonVi || 'Đơn vị',
              code: o.code || o.maDonVi,
              parentId: o.parentId ? String(o.parentId) : undefined,
            })));
          })
          .catch(() => {});
      }
    }
  }, [open, externalOrgUnits]);

  const effectiveOrgUnits = (externalOrgUnits && externalOrgUnits.length > 0) ? externalOrgUnits : internalOrgUnits;

  useEffect(() => {
    if (!open) return;
    if (externalSymbols && externalSymbols.length > 0) {
      setSymbols(externalSymbols);
      return;
    }
    symbolService.getOptions()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setSymbols(res);
        } else {
          symbolService.list({ pageSize: 1000 }).then((listRes) => {
            const items = listRes?.data || (Array.isArray(listRes) ? listRes : []);
            setSymbols(items.length > 0 ? items : DEFAULT_GIS_SYMBOLS);
          }).catch(() => setSymbols(DEFAULT_GIS_SYMBOLS));
        }
      })
      .catch(() => {
        symbolService.list({ pageSize: 1000 }).then((res) => {
          const items = res?.data || (Array.isArray(res) ? res : []);
          setSymbols(items.length > 0 ? items : DEFAULT_GIS_SYMBOLS);
        }).catch(() => setSymbols(DEFAULT_GIS_SYMBOLS));
      });
  }, [open, externalSymbols]);

  useEffect(() => {
    const symId = record?.symbolId || (initialData as any)?.symbolId;
    if (symId && !symbols.some((s: any) => String(s.id) === String(symId))) {
      const fallbackName = (record as any)?.symbolName || (initialData as any)?.symbolName;
      const fallbackCode = (record as any)?.symbolCode || (initialData as any)?.symbolCode;
      const fallbackImage = (record as any)?.symbolImage || (initialData as any)?.symbolImage;

      if (fallbackName) {
        setSymbols((prev) => {
          if (prev.some((item: any) => String(item.id) === String(symId))) return prev;
          return [
            ...prev,
            { id: String(symId), name: fallbackName, code: fallbackCode, image: fallbackImage }
          ];
        });
      } else {
        symbolService.getById(String(symId))
          .then((s) => {
            if (s) {
              setSymbols((prev) => {
                if (prev.some((item: any) => String(item.id) === String(s.id))) return prev;
                return [...prev, s];
              });
            }
          })
          .catch(() => {
            setSymbols((prev) => {
              if (prev.some((item: any) => String(item.id) === String(symId))) return prev;
              return [...prev, { id: String(symId), name: 'Biểu tượng đã chọn', code: '', image: '' }];
            });
          });
      }
    }
  }, [record?.symbolId, (record as any)?.symbolName, (record as any)?.symbolCode, (record as any)?.symbolImage, initialData, symbols]);

  // Load record data or reset for create
  useEffect(() => {
    if (!open) return;

    if (isCreateMode) {
      form.resetFields();
      setCoordinateList([]);
      setAttachments([]);
      setPendingFiles([]);
      setActiveTab('general');
      setRecord(null);

      // Default values
      form.setFieldsValue({
        conditionStatus: 'NOT_YET_OPERATIONAL',
        geometryType: undefined,
        coordinateSystem: undefined,
        displayRule: undefined,
      });

      const defOrgId = resolveDefaultFormOrgUnitId(currentUser, effectiveOrgUnits);
      if (defOrgId) {
        form.setFieldValue('orgUnitId', defOrgId);
      }

      // Generate code
      hanoiStationService.generateCode().then((res) => {
        if (res && res.code) {
          form.setFieldValue('code', res.code);
        }
      }).catch(() => {
        form.setFieldValue('code', 'TTXLTT-0001');
      });
      return;
    }

    const recId = editId || initialData?.id;
    if (!recId && initialData) {
      populateForm(initialData);
      return;
    }

    if (recId) {
      setLoading(true);
      hanoiStationService.getById(recId).then((res) => {
        populateForm(res);
      }).catch(() => {
        toast.error('Không thể tải thông tin Đài TTXLTT');
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [open, editId, initialData, mode, isCreateMode, currentUser, effectiveOrgUnits]);

  useEffect(() => {
    if (isCreateMode && open && effectiveOrgUnits && effectiveOrgUnits.length > 0) {
      const currentVal = form.getFieldValue('orgUnitId');
      if (!currentVal || currentVal === '00000000-0000-0000-0000-000000000017' || currentVal === 'G17') {
        const defOrgId = resolveDefaultFormOrgUnitId(currentUser, effectiveOrgUnits);
        if (defOrgId) {
          form.setFieldValue('orgUnitId', defOrgId);
        }
      }
    }
  }, [isCreateMode, open, effectiveOrgUnits, currentUser, form]);

  const populateForm = (data: HanoiStationItem) => {
    setRecord(data);
    form.resetFields();

    let serviceList: string[] = [];
    if (Array.isArray(data.services)) {
      serviceList = data.services;
    } else if (typeof data.services === 'string' && (data.services as string).trim()) {
      serviceList = (data.services as string).split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    } else if (typeof data.servicesProvided === 'string' && data.servicesProvided.trim()) {
      serviceList = data.servicesProvided.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    }

    const wktCoordinates = typeof data.coordinates === 'string' ? data.coordinates : (data as any).wktGeometry;
    const geometryType = resolveStationGeometryType(data.geometryType || (data as any).objectType, wktCoordinates);
    const orgId = data.orgUnitId || (initialData as any)?.orgUnitId;
    form.setFieldsValue({
      code: data.code,
      name: data.name,
      orgUnitId: orgId ? String(orgId) : undefined,
      operatingOrgId: data.operatingOrgId,
      provinceId: data.provinceId != null ? String(data.provinceId) : undefined,
      locationAddress: data.locationAddress,
      conditionStatus: data.conditionStatus || 'NOT_YET_OPERATIONAL',
      services: serviceList,
      description: data.description,
      geometryType,
      symbolId: data.symbolId || data.symbol || undefined,
      coordinateSystem: geometryType
        ? (String(data.coordinateSystem) === '2' || String(data.coordinateSystem).includes('VN-2000') ? 2 : 1)
        : undefined,
      displayRule: geometryType ? 'Độ, phút, giây (DMS)' : undefined,
    });

    // Parse coordinates
    let pts: { latitude: number; longitude: number }[] = [];
    if (wktCoordinates) {
      pts = parseWktToCoordinates(wktCoordinates);
    }
    if (pts.length === 0 && data.latitude != null && data.longitude != null) {
      pts = [{ latitude: Number(data.latitude), longitude: Number(data.longitude) }];
    }

    const dmsList = pts.map((p) => {
      const latDms = ddToDms(p.latitude);
      const lngDms = ddToDms(p.longitude);
      return {
        latD: latDms.d,
        latM: latDms.m,
        latS: latDms.s,
        lngD: lngDms.d,
        lngM: lngDms.m,
        lngS: lngDms.s,
      };
    });
    setCoordinateList(dmsList);

    // Fetch attachments
    if (data.id) {
      hanoiStationService.getAttachments(data.id).then((res: any) => {
        const items = Array.isArray(res) ? res : (res?.data || []);
        const flatItems = (Array.isArray(items) ? items : []).flat(Infinity).map((item: any) => ({
          ...item,
          fileName: item.fileName || item.name || item.originalFileName || item.filename,
          fileSize: item.fileSize ?? item.size ?? item.fileSizeBytes,
          fileType: item.fileType || item.documentType,
          uploadedByName: item.uploadedByName || item.uploaderName || item.createdByName,
          uploadedDate: item.uploadedDate || item.uploadedAt || item.createdAt,
        }));
        setAttachments(flatItems);
      }).catch(() => {});
    }
  };

  const handleGeometryTypeChange = (val: string) => {
    form.setFieldValue('geometryType', val);
    if (val) {
      form.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    } else {
      form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined, symbolId: undefined });
      setCoordinateList([]);
    }
    if (val === 'POINT' && coordinateList.length > 1) {
      setCoordinateList([coordinateList[0]]);
    }
  };

  const addGpsPoint = () => {
    setCoordinateList((prev) => [...prev, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
  };

  const updateGpsPoint = (idx: number, type: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    setCoordinateList((prev) => {
      const next = [...prev];
      if (!next[idx]) return prev;
      if (type === 'lat') {
        next[idx] = { ...next[idx], latD: d, latM: m, latS: s };
      } else {
        next[idx] = { ...next[idx], lngD: d, lngM: m, lngS: s };
      }
      return next;
    });
    setGpsError(null);
  };

  const removeCoordinate = (idx: number) => {
    setCoordinateList((prev) => prev.filter((_, i) => i !== idx));
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

    const hasError = started && inputs.some((inp) => !!inp.msg);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 360, margin: '0 auto', minWidth: 0 }}>
          {inputs.map((inp) => (
            <div key={inp.key} style={{ display: 'flex', flex: inp.basis, minWidth: 0, width: inp.width }}>
              <InputNumber
                className="chk-dms-input-number"
                value={inp.value}
                min={0}
                max={inp.max}
                step={inp.step}
                placeholder={inp.base}
                formatter={inp.formatter}
                status={inp.msg ? 'error' : undefined}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(raw) => inp.onEdit(raw == null ? null : Number(raw))}
                style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32, textAlign: 'center' }}
                controls={false}
              />
              <span style={inp.unitStyle}>{inp.unit}</span>
            </div>
          ))}
        </div>
        {hasError && (
          <div aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%', maxWidth: 360, margin: `${spaceXs}px auto 0 auto`, minWidth: 0, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
            {inputs.map((inp) => (
              <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width, textAlign: 'center' }}>
                {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleUploadAttachment = async (file: File) => {
    if (isCreateMode) {
      setPendingFiles((prev) => [...prev, file]);
      const tempItem = {
        id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedDate: new Date().toISOString(),
        uploadedByName: currentUser?.fullName || currentUser?.username || 'Tôi',
        file,
        originFileObj: file,
      };
      setAttachments((prev) => [...prev, tempItem]);
      return;
    }

    if (record?.id) {
      try {
        const uploaded = await hanoiStationService.uploadAttachment(record.id, file);
        const rawItems = Array.isArray(uploaded) ? uploaded : (uploaded ? [uploaded] : []);
        const normalized = rawItems.map((item: any) => ({
          ...item,
          fileName: item.fileName || item.name || file.name,
          fileSize: item.fileSize ?? item.size ?? file.size,
          fileType: item.fileType || item.documentType || file.type,
          uploadedByName: item.uploadedByName || currentUser?.fullName || currentUser?.username || 'Tôi',
          uploadedDate: item.uploadedDate || item.uploadedAt || new Date().toISOString(),
          file,
          originFileObj: file,
        }));
        setAttachments((prev) => [...prev.filter((a) => !Array.isArray(a)), ...normalized]);
        toast.success(`Tải lên tệp "${file.name}" thành công`);
      } catch {
        toast.error(`Không thể tải lên tệp "${file.name}"`);
      }
    }
  };

  const handleDeleteAttachment = async (attOrId: any) => {
    const attachmentId = typeof attOrId === 'string' ? attOrId : attOrId?.id;
    if (!attachmentId) return;

    if (String(attachmentId).startsWith('temp_') || String(attachmentId).startsWith('temp-')) {
      const idx = attachments.findIndex((a) => a.id === attachmentId);
      if (idx !== -1) {
        setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
      }
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      return;
    }

    if (isCreateMode) {
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      return;
    }

    if (record?.id) {
      try {
        await hanoiStationService.deleteAttachment(record.id, attachmentId);
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        toast.success('Đã xóa tệp đính kèm');
      } catch {
        toast.error('Không thể xóa tệp đính kèm');
      }
    } else {
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    }
  };

  const handleDownloadAttachment = async (attOrId: any, maybeFileName?: string) => {
    const attId = typeof attOrId === 'string' ? attOrId : attOrId?.id;
    const fileName = typeof attOrId === 'string' ? (maybeFileName || '') : (attOrId?.fileName || attOrId?.name || maybeFileName || '');
    if (!attId) return;
    if (String(attId).startsWith('temp_') || String(attId).startsWith('temp-')) return;
    if (!record?.id) return;
    try {
      await hanoiStationService.downloadAttachment(record.id, attId, fileName);
    } catch {
      toast.error('Không thể tải file');
    }
  };

  const onFinish = async (values: any) => {
    const action = actionTypeRef.current;
    setIsSubmitting(true);
    try {
      let wkt: string | undefined = undefined;
      let firstPt: { latitude: number; longitude: number } | undefined = undefined;

      if (values.geometryType || coordinateList.length > 0) {
        const geom = values.geometryType || 'POINT';
        const dmsCoordList = coordinateList.map((c) => ({
          latD: c.latD,
          latM: c.latM,
          latS: c.latS,
          lngD: c.lngD,
          lngM: c.lngM,
          lngS: c.lngS,
        }));

        const dmsVal = validateDmsCoordinates(dmsCoordList, geom);
        if (!dmsVal.valid) {
          setGpsError(dmsVal.errorMessage || dmsVal.error || 'Tọa độ không hợp lệ');
          setActiveTab('location');
          setIsSubmitting(false);
          return;
        }

        const ddPoints = coordinateList
          .filter((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null))
          .map((c) => ({
            latitude: dmsToDd(c.latD, c.latM, c.latS),
            longitude: dmsToDd(c.lngD, c.lngM, c.lngS),
          }))
          .filter((c) => c.latitude != null && c.longitude != null) as { latitude: number; longitude: number }[];

        if (ddPoints.length > 0) {
          wkt = serializeCoordinatesToWkt(ddPoints, geom);
          firstPt = ddPoints[0];
        }
      }

      let actionParam = 'DRAFT';
      if (action === 'submit') actionParam = 'SUBMIT';
      else if (action === 'approve') actionParam = 'APPROVE';

      const payload: CreateHanoiStationRequest = {
        code: values.code?.trim(),
        name: values.name?.trim(),
        orgUnitId: values.orgUnitId,
        operatingOrgId: values.operatingOrgId,
        provinceId: values.provinceId != null && values.provinceId !== '' ? Number(values.provinceId) : undefined,
        locationAddress: values.locationAddress?.trim(),
        conditionStatus: values.conditionStatus,
        services: values.services,
        servicesProvided: Array.isArray(values.services) ? values.services.join(', ') : values.services,
        description: values.description?.trim(),
        geometryType: values.geometryType || undefined,
        symbolId: values.symbolId || undefined,
        coordinateSystem: values.geometryType ? values.coordinateSystem : undefined,
        displayRule: values.geometryType ? values.displayRule : undefined,
        latitude: firstPt?.latitude,
        longitude: firstPt?.longitude,
        coordinates: wkt,
      };

      let savedRecord: HanoiStationItem;

      if (isCreateMode) {
        savedRecord = await hanoiStationService.create(payload, actionParam);
        toast.success(action === 'submit' ? 'Lưu và gửi phê duyệt thành công' : (action === 'approve' ? 'Lưu và phê duyệt thành công' : 'Lưu tạm thành công'));

        // Upload pending files if any
        if (savedRecord?.id && pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            try {
              await hanoiStationService.uploadAttachment(savedRecord.id, file);
            } catch { /* ignore */ }
          }
        }
      } else if (record?.id) {
        const updatePayload: UpdateHanoiStationRequest = {
          ...payload,
        };

        savedRecord = await hanoiStationService.update(record.id, updatePayload, actionParam);

        if (action === 'submit') {
          toast.success('Cập nhật và gửi phê duyệt thành công');
        } else if (action === 'approve') {
          toast.success('Cập nhật và phê duyệt thành công');
        } else {
          toast.success('Cập nhật Đài TTXLTT thành công');
        }
      }

      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu Đài TTXLTT');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    focusErrorTab(errorInfo, setActiveTab);
  };

  const renderFooterButtons = () => {
    if (isDetailMode) return null;

    if (isCreateMode) {
      return (
        <>
          {canCreate && (
            <>
              <Button
                onClick={() => { actionTypeRef.current = 'draft'; form.submit(); }}
                loading={isSubmitting && actionTypeRef.current === 'draft'}
                style={outlineButtonStyle}
              >
                Lưu tạm
              </Button>
              <Button
                type="primary"
                onClick={() => { actionTypeRef.current = 'submit'; form.submit(); }}
                loading={isSubmitting && actionTypeRef.current === 'submit'}
                style={primaryButtonStyle}
              >
                Lưu và gửi phê duyệt
              </Button>
            </>
          )}
          {canApproveL2 && canCreate && (
            <Button
              type="primary"
              onClick={() => { actionTypeRef.current = 'approve'; form.submit(); }}
              loading={isSubmitting && actionTypeRef.current === 'approve'}
              style={{
                ...primaryButtonStyle,
                background: statusOperational,
                borderColor: statusOperational,
              }}
            >
              Lưu và phê duyệt
            </Button>
          )}
        </>
      );
    }

    const isDraftOrRejected = !record?.approvalStatus ||
      record.approvalStatus === ApprovalStatus.DRAFT ||
      record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 ||
      record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2;

    return (
      <>
        {canUpdate && isDraftOrRejected && (
          <>
            <Button
              onClick={() => { actionTypeRef.current = 'update'; form.submit(); }}
              loading={isSubmitting && actionTypeRef.current === 'update'}
              style={outlineButtonStyle}
            >
              Lưu tạm
            </Button>
            <Button
              type="primary"
              onClick={() => { actionTypeRef.current = 'submit'; form.submit(); }}
              loading={isSubmitting && actionTypeRef.current === 'submit'}
              style={primaryButtonStyle}
            >
              Lưu và gửi phê duyệt
            </Button>
          </>
        )}
        {canApproveL2 && (
          <Button
            type="primary"
            onClick={() => { actionTypeRef.current = 'approve'; form.submit(); }}
            loading={isSubmitting && actionTypeRef.current === 'approve'}
            style={{
              ...primaryButtonStyle,
              background: statusOperational,
              borderColor: statusOperational,
            }}
          >
            Lưu và phê duyệt
          </Button>
        )}
        {canUpdate && !canApproveL2 && (
          <Button
            type="primary"
            onClick={() => { actionTypeRef.current = 'update'; form.submit(); }}
            loading={isSubmitting && actionTypeRef.current === 'update'}
            style={primaryButtonStyle}
          >
            Cập nhật
          </Button>
        )}
      </>
    );
  };

  const getDrawerTitle = () => {
    if (isDetailMode) return record?.name ? `Chi tiết Đài TTXLTT Hà Nội - ${record.name}` : 'Chi tiết Đài TTXLTT Hà Nội';
    if (isCreateMode) return 'Thêm mới Đài TTXLTT Hà Nội';
    return record?.name ? `Chỉnh sửa thông tin — ${record.name}` : 'Chỉnh sửa thông tin';
  };

  return (
    <AppDrawer
      rootClassName="hanoi-drawer-scope"
      className="hanoi-drawer-scope"
      width={DRAWER_WIDTH}
      open={open}
      onClose={onClose || onCancel || (() => {})}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '0 24px 12px 24px', overflow: isDetailMode ? 'hidden' : undefined },
      }}
      title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{getDrawerTitle()}</span>}
      footer={renderFooterButtons()}
    >
      {loading ? (
        <LoadingSkeleton />
      ) : isDetailMode && record ? (
        <HanoiStationDetailContent
          selectedRecord={record}
          symbols={symbols}
          attachments={attachments}
          onClose={onClose || onCancel}
        />
      ) : (
        <Spin spinning={isSubmitting}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <style>{requiredMarkStyle}</style>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              tabBarStyle={drawerTabBarStyle}
              animated={false}
              items={[
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
                              name="code"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã đài TTXLTT</span>}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input readOnly style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 40 }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="name"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên đài TTXLTT</span>}
                              rules={[
                                { required: true, message: 'Vui lòng nhập tên đài' },
                                { max: 255, message: 'Tên đài tối đa 255 ký tự' },
                              ]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input
                                placeholder="Nhập tên đài TTXLTT"
                                maxLength={255}
                                showCount
                                autoFocus
                                style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              name="orgUnitId"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị quản lý</span>}
                              rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <FormOrgUnitTreeSelect
                                organizations={effectiveOrgUnits}
                                placeholder="Chọn đơn vị quản lý"
                                disabled={isEditMode}
                                allowClear
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="operatingOrgId"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị khai thác</span>}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Select
                                placeholder="Chọn đơn vị khai thác"
                                options={DEFAULT_OPERATING_ORGANIZATIONS.map((o) => ({ label: o.name, value: o.id }))}
                                allowClear
                                showSearch
                                filterOption={(input, option) =>
                                  normalizeSearchText(option?.label as string).includes(normalizeSearchText(input))
                                }
                                style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              name="provinceId"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm (Tỉnh/TP)</span>}
                              rules={[{ required: true, message: 'Vui lòng chọn địa điểm (Tỉnh/TP)' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Select
                                placeholder="Chọn tỉnh / thành phố"
                                options={VIETNAM_PROVINCE_OPTIONS}
                                allowClear
                                showSearch
                                filterOption={(input, option) =>
                                  normalizeSearchText(option?.label as string).includes(normalizeSearchText(input))
                                }
                                style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="conditionStatus"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tình trạng</span>}
                              rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Select
                                placeholder="Chọn tình trạng"
                                options={CONDITION_STATUS_OPTIONS}
                                style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              name="locationAddress"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                              rules={[
                                { required: true, whitespace: true, message: 'Vui lòng nhập địa điểm chi tiết' },
                                { max: 500, message: 'Địa điểm chi tiết tối đa 500 ký tự' },
                              ]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input
                                placeholder="Nhập địa điểm chi tiết"
                                maxLength={500}
                                showCount
                                style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              name="services"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Dịch vụ cung cấp</span>}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <ServiceMultiSelect
                                placeholder="Chọn các dịch vụ cung cấp"
                                options={HANOI_SERVICE_OPTIONS}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={24}>
                            <Form.Item
                              name="description"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                              rules={[{ max: 2000, message: 'Ghi chú tối đa 2000 ký tự' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input.TextArea
                                placeholder="Nhập ghi chú"
                                rows={3}
                                maxLength={2000}
                                showCount
                                style={textAreaStyle}
                              />
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
                            <Form.Item
                              name="geometryType"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Loại đối tượng</span>}
                              required={hasCoordinates}
                              rules={hasCoordinates ? [{ required: true, message: 'Loại đối tượng là bắt buộc khi có tọa độ' }] : []}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Select
                                placeholder="Chọn loại đối tượng"
                                allowClear
                                onChange={handleGeometryTypeChange}
                                options={GEOMETRY_TYPE_OPTIONS}
                                style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="symbolId"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Biểu tượng</span>}
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
                                filterOption={(input, option) =>
                                  normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                                }
                                style={selectStyle}
                                options={symbols.map((sym: any) => ({
                                  value: String(sym.id),
                                  label: sym.code ? `${sym.name} (${sym.code})` : sym.name,
                                  image: sym.image,
                                }))}
                                optionRender={(option) => (
                                  <Space>
                                    {option.data.image && (
                                      <img
                                        src={option.data.image.startsWith('data:') ? option.data.image : `data:image/png;base64,${option.data.image}`}
                                        alt=""
                                        style={{ width: 20, height: 20, objectFit: 'contain' }}
                                      />
                                    )}
                                    <span>{option.data.label}</span>
                                  </Space>
                                )}
                                labelRender={(props) => {
                                  const sym = symbols.find((s: any) => String(s.id) === String(props.value));
                                  return (
                                    <Space style={{ display: 'inline-flex', alignItems: 'center' }}>
                                      {sym?.image && (
                                        <img
                                          src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                                          alt=""
                                          style={{ width: 18, height: 18, objectFit: 'contain' }}
                                        />
                                      )}
                                      <span>{sym ? (sym.code ? `${sym.name} (${sym.code})` : sym.name) : props.label}</span>
                                    </Space>
                                  );
                                }}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              name="coordinateSystem"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Hệ quy chiếu</span>}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Select
                                placeholder="Chọn hệ quy chiếu"
                                disabled
                                options={COORD_SYS_OPTIONS}
                                style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="displayRule"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Quy tắc hiển thị</span>}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input
                                placeholder="Chọn quy tắc hiển thị"
                                maxLength={255}
                                disabled
                                style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>

                      {/* ── Section Card: Tọa độ GPS ── */}
                      <div style={sectionBoxStyle}>
                        <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                          <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                            Tọa độ GPS ({coordinateList.length})
                          </span>
                          <Space size={8}>
                            <Button
                              icon={<EnvironmentOutlined style={{ color: !watchedGeometryType ? 'rgba(0, 0, 0, 0.25)' : actionPrimary }} />}
                              onClick={() => setMapModalOpen(true)}
                              disabled={!watchedGeometryType}
                              style={!watchedGeometryType ? {
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
                                boxShadow: 'none',
                              } : {
                                ...outlineButtonStyle,
                                height: 32,
                                fontSize: fontSizeSm,
                                padding: '0 14px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
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
                              style={(!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)) ? {
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
                                boxShadow: 'none',
                              } : {
                                ...primaryButtonStyle,
                                height: 32,
                                fontSize: fontSizeSm,
                                padding: '0 14px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                              title={!watchedGeometryType ? 'Vui lòng chọn loại đối tượng trước khi thêm tọa độ' : (watchedGeometryType === 'POINT' && coordinateList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined)}
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
                              onCell: () => ({ style: { verticalAlign: 'middle' } }),
                              render: (_v: any, _r: any, idx: number) => idx + 1,
                            },
                            {
                              title: 'Vĩ độ (Latitude - N)',
                              key: 'lat',
                              align: 'center' as const,
                              onCell: () => ({ style: { verticalAlign: 'middle' } }),
                              render: (_v: any, record: any) =>
                                renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
                            },
                            {
                              title: 'Kinh độ (Longitude - E)',
                              key: 'lng',
                              align: 'center' as const,
                              onCell: () => ({ style: { verticalAlign: 'middle' } }),
                              render: (_v: any, record: any) =>
                                renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
                            },
                            {
                              title: '',
                              width: 50,
                              align: 'center' as const,
                              onCell: () => ({ style: { verticalAlign: 'middle' } }),
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
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'files',
                  label: `File đính kèm (${attachments.length})`,
                  children: (
                    <InfrastructureAttachmentTab
                      attachments={attachments}
                      onUpload={handleUploadAttachment}
                      onDelete={handleDeleteAttachment}
                      onDownload={handleDownloadAttachment}
                      readonly={false}
                    />
                  ),
                },
              ]}
            />
          </Form>
        </Spin>
      )}

      {/* Modal Chọn vị trí GIS trên bản đồ chuẩn VTS */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: sidebarBg, fontSize: fontSizeLg }}>
              {isDetailMode ? 'Xem vị trí trên bản đồ chuyên dụng' : 'Chọn vị trí & tọa độ trên bản đồ chuyên dụng'}
            </span>
          </div>
        }
        open={mapModalOpen}
        onCancel={() => setMapModalOpen(false)}
        destroyOnHidden
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={
          isDetailMode ? null : [
            <Button
              key="cancel"
              onClick={() => setMapModalOpen(false)}
              style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}
            >
              Hủy
            </Button>,
            <Button
              key="ok"
              type="primary"
              onClick={() => {
                setMapModalOpen(false);
                toast.success('Đã xác nhận vị trí từ bản đồ');
              }}
              style={{ ...primaryButtonStyle, height: 36, borderRadius: radiusPill }}
            >
              Xác nhận tọa độ
            </Button>,
          ]
        }
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            height={520}
            disabled={isDetailMode}
            value={{
              geometryType: (watchedGeometryType as any) || 'POINT',
              coordinates: serializeCoordinatesToWkt(
                coordinateList
                  .filter((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null))
                  .map((c) => ({
                    latitude: dmsToDd(c.latD, c.latM, c.latS),
                    longitude: dmsToDd(c.lngD, c.lngM, c.lngS),
                  }))
                  .filter((c) => c.latitude != null && c.longitude != null) as { latitude: number; longitude: number }[],
                watchedGeometryType || 'POINT',
              ),
              symbolId: form.getFieldValue('symbolId'),
            }}
            defaultGeometryType={(watchedGeometryType as any) || 'POINT'}
            onChange={(val) => {
              if (isDetailMode) return;
              if (val?.coordinates) {
                const points = parseWktToCoordinates(val.coordinates);
                if (points.length > 0) {
                  const geom = ((val?.geometryType || watchedGeometryType || 'POINT') as string).toUpperCase();
                  const newPoints = points.map((p) => {
                    const latDms = ddToDms(p.latitude);
                    const lngDms = ddToDms(p.longitude);
                    return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
                  });

                  // Khi chọn tọa độ từ bản đồ, cập nhật trực tiếp danh sách điểm mới được chọn (không cộng dồn vào điểm cũ)
                  if (geom === 'POINT') {
                    setCoordinateList([newPoints[0]]);
                  } else {
                    setCoordinateList(newPoints);
                  }
                  setGpsError(null);
                }
              }
              if (val?.geometryType && val.geometryType !== watchedGeometryType) {
                form.setFieldValue('geometryType', val.geometryType);
              }
              if (val?.symbolId) {
                form.setFieldValue('symbolId', val.symbolId);
              }
            }}
          />
        </div>
      </Modal>
    </AppDrawer>
  );
};

export default HanoiStationForm;
