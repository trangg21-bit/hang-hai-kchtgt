import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  Spin,
  Space,
  Tabs,
  Row,
  Col,
  Modal,
  DatePicker,
} from 'antd';
import AppDrawer from '../../components/shared/AppDrawer';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SlidersOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { focusErrorTab } from '../../utils/formValidationHelper';
import { aisSystemService } from '../../services/aisSystemService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { radarStationService } from '../../services/radarStationService';
import { organizationService } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import type {
  AisSystemResponse,
  CreateAisSystemRequest,
  UpdateAisSystemRequest,
} from '../../types/aisSystem';
import { UNIT_OF_MEASURE_OPTIONS, UnitOfMeasure } from '../../types/aisSystem';
import { ApprovalStatus, ConditionStatus, CONDITION_STATUS_OPTIONS } from '../../types/vtsSystem';
import {
  drawerTitleStyle, primaryButtonStyle, outlineButtonStyle,
  drawerTabBarStyle, drawerFormScrollStyle,
  spaceFormField, radiusPill, sidebarBg,
  fontWeightBold, fontSizeMd, fontSizeSm, fontSizeLg,
  textTertiary, borderDefault,
  statusCritical, statusOperational, actionPrimary,
  readonlyInputStyle, inputStyle, selectStyle,
  DRAWER_TABLE_SCROLL_Y, getDatePickerProps, spaceXs,
} from '../../themetokenchk';
import { fmtInputNumber } from '../../utils/numFmt';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { useAuthStore, type AuthState } from '../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { FormOrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../components/org-unit';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import AisSystemDetailContent from './AisSystemDetailContent';
import {
  parseWktToCoordinates,
  serializeCoordinatesToWkt,
  GEOMETRY_POINT_COUNT,
  validateDmsCoordinates,
  dmsToDd,
} from '../../utils/gisGeometry';

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];
const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

export interface AisSystemFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: AisSystemResponse | null;
  mode?: 'create' | 'edit' | 'detail' | 'view';
  orgUnits?: any[];
  opCenterOptions?: { id: string; name: string; orgUnitId?: string }[];
  radarStationOptions?: { id: string; name: string; orgUnitId?: string }[];
  operatingOrganizationOptions?: any[];
  onCancel?: () => void;
  onSuccess?: () => void;
  onClose?: () => void;
  onSwitchToEdit?: () => void;
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

function ddToDms(dd: number | null | undefined): { d: number | null; m: number | null; s: number | null } {
  if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
  let abs = Math.abs(dd);
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

export const AisSystemForm: React.FC<AisSystemFormProps> = ({
  open = true,
  editId,
  initialData,
  mode = 'create',
  orgUnits = [],
  opCenterOptions,
  radarStationOptions,
  operatingOrganizationOptions,
  onCancel,
  onSuccess,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [currentMode, setCurrentMode] = useState<'create' | 'edit' | 'detail'>(
    mode === 'view' ? 'detail' : (mode as 'create' | 'edit' | 'detail')
  );
  const [tabKey, setTabKey] = useState<string>('general');
  const [record, setRecord] = useState<AisSystemResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(editId));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('draft');

  const [internalOrgUnits, setInternalOrgUnits] = useState<any[]>(orgUnits || []);
  const [operatingOrganizations, setOperatingOrganizations] = useState<any[]>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [opCenters, setOpCenters] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);
  const [radarStations, setRadarStations] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [coordinateList, setCoordinateList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<{ id: string; fileName: string }[]>([]);

  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);
  const isCucLevel = (currentUser as any)?.orgUnitLevel === 1 || (currentUser as any)?.role === 'SUPER_ADMIN' || (currentUser as any)?.role === 'ADMIN';
  const canSaveAndApprove = hasPerm('aissystem:approvec2') || isCucLevel;

  const isDetailMode = currentMode === 'detail';
  const isCreateMode = currentMode === 'create';
  const isEditMode = currentMode === 'edit';

  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedGeometryType = Form.useWatch('geometryType', form);

  const hasCoordinates = coordinateList.some((c) => c.latD != null || c.latM != null || c.latS != null || c.lngD != null || c.lngM != null || c.lngS != null);
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);
  const labelProps = (label: string) => ({
    label: <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{label}</span>,
  });

  const handleClose = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  useEffect(() => {
    setCurrentMode(mode === 'view' ? 'detail' : (mode as 'create' | 'edit' | 'detail'));
  }, [mode]);

  useEffect(() => {
    if (orgUnits && orgUnits.length > 0) {
      setInternalOrgUnits(orgUnits);
    } else {
      organizationService.list({ pageSize: 1000 }).then((res) => {
        if (res?.data && Array.isArray(res.data)) setInternalOrgUnits(res.data);
      }).catch(() => {});
    }
  }, [orgUnits]);

  // Load dropdown lists
  useEffect(() => {
    if (opCenterOptions && opCenterOptions.length > 0) {
      setOpCenters(opCenterOptions);
    } else {
      vtsOperationCenterService.getOptions().then((res) => {
        if (Array.isArray(res)) setOpCenters(res.map((c) => ({ id: c.id, name: c.name, orgUnitId: c.orgUnitId })));
      }).catch(() => {});
    }

    if (radarStationOptions && radarStationOptions.length > 0) {
      setRadarStations(radarStationOptions);
    } else {
      radarStationService.getOptions().then((res) => {
        if (Array.isArray(res)) setRadarStations(res.map((r) => ({ id: r.id, name: r.stationName || r.code || r.id, orgUnitId: r.orgUnitId })));
      }).catch(() => {});
    }

    symbolService.getOptions().then((res) => {
      if (Array.isArray(res) && res.length > 0) setSymbols(res);
      else {
        symbolService.list({ pageSize: 1000 }).then((listRes) => {
          const items = listRes?.data || (Array.isArray(listRes) ? listRes : []);
          if (Array.isArray(items)) setSymbols(items);
        }).catch(() => {});
      }
    }).catch(() => {
      symbolService.list({ pageSize: 1000 }).then((res) => {
        const items = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(items)) setSymbols(items);
      }).catch(() => {});
    });

    if (operatingOrganizationOptions && operatingOrganizationOptions.length > 0) {
      setOperatingOrganizations(operatingOrganizationOptions);
    } else {
      vtsSystemCRUD.getOperatingOrganizationOptions().then((res) => {
        if (Array.isArray(res) && res.length > 0) setOperatingOrganizations(res);
      }).catch(() => {});
    }
  }, [opCenterOptions, radarStationOptions, operatingOrganizationOptions]);

  const operatingUnitOptions = useMemo(() => {
    const list: Array<{ value: string; label: string }> = [];
    const seen = new Set<string>();

    if (Array.isArray(internalOrgUnits)) {
      internalOrgUnits.forEach((o) => {
        if (o.id && o.name && !seen.has(String(o.id))) {
          seen.add(String(o.id));
          list.push({ value: String(o.id), label: o.code ? `${o.code} - ${o.name}` : o.name });
        }
      });
    }

    if (Array.isArray(operatingOrganizations)) {
      operatingOrganizations.forEach((o) => {
        if (o.id && o.name && !seen.has(String(o.id))) {
          seen.add(String(o.id));
          list.push({ value: String(o.id), label: o.code ? `${o.code} - ${o.name}` : o.name });
        }
      });
    }

    if (record?.operatingOrgId && !seen.has(String(record.operatingOrgId))) {
      seen.add(String(record.operatingOrgId));
      list.push({
        value: String(record.operatingOrgId),
        label: record.operatingOrgName || (record as any).operatingUnitName || 'Đơn vị khai thác',
      });
    }

    return list;
  }, [internalOrgUnits, operatingOrganizations, record?.operatingOrgId, record?.operatingOrgName]);

  useEffect(() => {
    actionTypeRef.current = isCreateMode ? 'draft' : 'update';
    setActionType(isCreateMode ? 'draft' : 'update');

    if (!open) {
      form.resetFields();
      setRecord(null);
      setAttachments([]);
      setPendingFiles([]);
      setPendingDeletedAttachments([]);
      setCoordinateList([]);
      setGpsError(null);
      return;
    }

    setTabKey('general');

    const targetId = editId || initialData?.id;

    if (targetId) {
      setIsLoading(true);
      aisSystemService.getById(targetId)
        .then((full) => {
          setRecord(full);
          setAttachments(full.attachments || []);
          const initialLocId = full.vtsOperationCenterId ? `op_${full.vtsOperationCenterId}` : full.radarStationId ? `radar_${full.radarStationId}` : undefined;
          const geom = full.geometryType || undefined;
          form.setFieldsValue({
            code: full.code,
            name: full.name,
            locationId: initialLocId,
            operatingOrgId: full.operatingOrgId != null ? String(full.operatingOrgId) : undefined,
            orgUnitId: full.orgUnitId,
            provinceId: full.provinceId != null ? String(full.provinceId) : undefined,
            unitOfMeasure: full.unitOfMeasure ?? UnitOfMeasure.SET,
            quantity: full.quantity ?? 1,
            model: full.model,
            manufacturer: full.manufacturer,
            commissioningYear: full.commissioningYear ? dayjs(String(full.commissioningYear), 'YYYY') : undefined,
            conditionStatus: full.conditionStatus ?? ConditionStatus.OPERATIONAL,
            detailedLocation: full.detailedLocation,
            specifications: full.specifications,
            maintenanceInfo: full.maintenanceInfo,
            note: full.note,
            geometryType: geom,
            symbolId: full.symbolId || undefined,
            coordinateSystem: geom ? 1 : undefined,
            displayRule: geom ? 'Độ, phút, giây (DMS)' : undefined,
          });
          const parsedCoords = parseWktToCoordinates(full.coordinates);
          if (parsedCoords.length > 0) {
            setCoordinateList(parsedCoords.map((c) => {
              const latDms = ddToDms(c.latitude);
              const lngDms = ddToDms(c.longitude);
              return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
            }));
          } else if (geom) {
            const count = GEOMETRY_POINT_COUNT[geom] ?? 1;
            setCoordinateList(Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null })));
          } else {
            setCoordinateList([]);
          }
          setGpsError(null);
        })
        .catch(() => {
          toast.error('Không thể tải thông tin hệ thống AIS');
        })
        .finally(() => setIsLoading(false));
    } else {
      // Create mode
      form.resetFields();
      form.setFieldsValue({
        conditionStatus: ConditionStatus.OPERATIONAL,
        unitOfMeasure: UnitOfMeasure.SET,
        quantity: 1,
        geometryType: undefined,
        coordinateSystem: undefined,
        displayRule: undefined,
      });
      setRecord(null);
      setAttachments([]);
      setPendingFiles([]);
      setPendingDeletedAttachments([]);
      setCoordinateList([]);
      setGpsError(null);

      aisSystemService.generateCode().then((res) => {
        form.setFieldsValue({
          code: res.code,
          conditionStatus: ConditionStatus.OPERATIONAL,
          unitOfMeasure: UnitOfMeasure.SET,
          quantity: 1,
          geometryType: undefined,
          coordinateSystem: undefined,
          displayRule: undefined,
        });
      }).catch(() => {});
    }
  }, [open, editId, initialData, form]);

  // Khi chọn loại đối tượng → tự set hệ quy chiếu, quy tắc hiển thị và thêm sẵn số dòng tọa độ tương ứng
  useEffect(() => {
    if (!watchedGeometryType) {
      form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined, symbolId: undefined });
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
    setGpsError(null);
  }, [watchedGeometryType, form]);

  const effectiveOrgUnitId = watchedOrgUnitId || record?.orgUnitId;

  // Cascading options
  const filteredOpCenters = useMemo(() => {
    if (!effectiveOrgUnitId) return opCenters;
    const allowedIds = resolveOrgSubtreeIds(orgUnits, effectiveOrgUnitId);
    return opCenters.filter((c) => !c.orgUnitId || allowedIds.has(c.orgUnitId));
  }, [opCenters, effectiveOrgUnitId, orgUnits]);

  const filteredRadarStations = useMemo(() => {
    if (!effectiveOrgUnitId) return radarStations;
    const allowedIds = resolveOrgSubtreeIds(orgUnits, effectiveOrgUnitId);
    return radarStations.filter((r) => !r.orgUnitId || allowedIds.has(r.orgUnitId));
  }, [radarStations, effectiveOrgUnitId, orgUnits]);

  const combinedLocationOptions = useMemo(() => [
    {
      label: 'Trung tâm điều hành VTS',
      options: filteredOpCenters.map((c) => ({ value: `op_${c.id}`, rawId: c.id, type: 'op', label: c.name })),
    },
    {
      label: 'Trạm Radar',
      options: filteredRadarStations.map((r) => ({ value: `radar_${r.id}`, rawId: r.id, type: 'radar', label: r.name })),
    },
  ], [filteredOpCenters, filteredRadarStations]);

  const attachmentsEditable = isCreateMode ||
    record?.approvalStatus === ApprovalStatus.DRAFT ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2 ||
    (record?.approvalStatus === ApprovalStatus.APPROVED && canSaveAndApprove);

  const handleUploadAttachment = async (file: File) => {
    if (!isCreateMode && !attachmentsEditable) {
      toast.error('Chỉ thay đổi được tài liệu đính kèm khi hồ sơ ở trạng thái Lưu tạm hoặc Bị trả về');
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File vượt quá 20MB theo quy định');
      return false;
    }
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    (file as any)._tempId = tempId;
    const newAttachment: InfrastructureAttachmentItem = {
      id: tempId,
      fileName: file.name,
      fileSize: file.size,
      uploadedByName: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
      uploadedDate: new Date().toISOString(),
      file,
      originFileObj: file,
    };
    setPendingFiles((prev) => [...prev, file]);
    setAttachments((prev) => [...prev, newAttachment]);
    toast.success(`Đã thêm tệp ${file.name}`);
    return false;
  };

  const handleDeleteAttachment = async (attId: string) => {
    if (!isCreateMode && !attachmentsEditable) {
      toast.error('Không có quyền xóa tệp đính kèm');
      return;
    }
    const targetAtt = attachments.find((a) => a.id === attId);
    if (String(attId).startsWith('temp_') || pendingFiles.some((f) => (f as any)._tempId === attId)) {
      setPendingFiles((prev) => prev.filter((f) => (f as any)._tempId !== attId && f.name !== attId));
    } else if (targetAtt) {
      setPendingDeletedAttachments((prev) => [...prev, { id: attId, fileName: targetAtt.fileName }]);
    }
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
    toast.success('Đã xóa tệp đính kèm');
  };

  const handleDownloadAttachment = async (attId: string, fileName?: string) => {
    if (!attId) return;
    if (record?.id && !String(attId).startsWith('temp_')) {
      await aisSystemService.downloadAttachment(record.id, attId, fileName);
    } else {
      const found = attachments.find((a) => a.id === attId);
      if (found?.file) {
        const url = URL.createObjectURL(found.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = found.fileName || fileName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
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

  const handleFinish = async (values: any) => {
    const act = actionTypeRef.current;

    // Kiểm tra tính đầy đủ và hợp lệ của tọa độ GPS
    const geomType = values.geometryType || undefined;
    let wkt: string | undefined = undefined;

    if (geomType) {
      const coordResult = validateDmsCoordinates(coordinateList, geomType);
      if (!coordResult.valid) {
        const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
        toast.error(errMsg);
        setGpsError(errMsg);
        setTabKey('gis');
        return;
      }
      const validCoords = coordResult.validCoords;
      wkt = validCoords.length > 0 ? serializeCoordinatesToWkt(validCoords, geomType) : undefined;
    }

    setIsSubmitting(true);
    try {
      const locationVal = values.locationId;
      let vtsCenterId: string | undefined = undefined;
      let radarId: string | undefined = undefined;

      if (locationVal) {
        if (String(locationVal).startsWith('op_')) {
          vtsCenterId = String(locationVal).replace('op_', '');
        } else if (String(locationVal).startsWith('radar_')) {
          radarId = String(locationVal).replace('radar_', '');
        } else {
          if (opCenters.some((c) => c.id === locationVal)) vtsCenterId = locationVal;
          else if (radarStations.some((r) => r.id === locationVal)) radarId = locationVal;
          else vtsCenterId = locationVal;
        }
      }

      const payload: CreateAisSystemRequest = {
        code: values.code?.trim(),
        name: values.name?.trim(),
        vtsOperationCenterId: vtsCenterId,
        radarStationId: radarId,
        operatingOrgId: values.operatingOrgId,
        orgUnitId: values.orgUnitId,
        provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
        unitOfMeasure: values.unitOfMeasure,
        quantity: values.quantity,
        model: values.model?.trim() || undefined,
        manufacturer: values.manufacturer?.trim() || undefined,
        commissioningYear: values.commissioningYear ? (dayjs.isDayjs(values.commissioningYear) ? values.commissioningYear.year() : Number(values.commissioningYear)) : undefined,
        conditionStatus: values.conditionStatus,
        detailedLocation: values.detailedLocation?.trim() || undefined,
        specifications: values.specifications?.trim() || undefined,
        maintenanceInfo: values.maintenanceInfo?.trim() || undefined,
        note: values.note?.trim() || undefined,
        geometryType: geomType,
        symbolId: values.symbolId || undefined,
        coordinates: wkt,
      };

      if (isCreateMode) {
        if (act === 'approve') {
          payload.approvalStatus = ApprovalStatus.APPROVED;
        }
        const created = await aisSystemService.create(payload);
        if (created?.id && pendingFiles.length > 0) {
          try {
            await aisSystemService.uploadAttachments(created.id, pendingFiles);
          } catch {
            toast.warning('Đã tạo thiết bị AIS nhưng không tải lên được một số tệp đính kèm');
          }
        }
        if (act === 'submit' && created?.id) {
          await aisSystemService.submit(created.id);
        }
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
        toast.success(act === 'approve' ? 'Lưu và phê duyệt thành công' : act === 'submit' ? 'Lưu và gửi phê duyệt thành công' : 'Thêm mới thành công');
      } else if (editId || record?.id) {
        const targetId = editId || record!.id;
        const updatePayload: UpdateAisSystemRequest = { ...payload, id: targetId } as UpdateAisSystemRequest;
        if (act === 'approve') {
          updatePayload.approvalStatus = ApprovalStatus.APPROVED;
        }
        await aisSystemService.update(targetId, updatePayload);
        if (pendingDeletedAttachments.length > 0) {
          try {
            await Promise.all(pendingDeletedAttachments.map((a) => aisSystemService.deleteAttachment(targetId, a.id)));
          } catch (delErr) {
            console.warn('Failed to delete some attachments on edit', delErr);
          }
        }
        if (pendingFiles.length > 0) {
          try {
            await aisSystemService.uploadAttachments(targetId, pendingFiles);
          } catch (uploadErr) {
            console.warn('Failed to upload some pending files on edit', uploadErr);
          }
        }
        if (act === 'submit' && (record?.approvalStatus === ApprovalStatus.DRAFT || record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2)) {
          await aisSystemService.submit(targetId);
        }
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
        toast.success('Cập nhật thành công');
      }
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDrawer
      rootClassName="ais-drawer-scope vts-drawer-scope berth-drawer-scope"
      className="ais-drawer-scope vts-drawer-scope berth-drawer-scope"
      style={{ maxWidth: '96vw' }}
      width={isDetailMode ? (typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000) : 'min(920px, 96vw)'}
      placement="right"
      open={Boolean(open)}
      onClose={handleClose}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '0 24px 12px 24px', overflow: isDetailMode ? 'hidden' : undefined },
      }}
      title={
        <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
          {isDetailMode
            ? (record?.name ? `Chi tiết hệ thống trạm bờ AIS - ${record.name}` : 'Chi tiết hệ thống trạm bờ AIS')
            : isCreateMode
              ? 'Thêm mới hệ thống trạm bờ AIS'
              : (record?.name ? `Chỉnh sửa thông tin — ${record.name}` : 'Chỉnh sửa thông tin')}
        </span>
      }
      footer={
        isDetailMode ? null : (
          <>
            {isCreateMode ? (
              <>
                <Button
                  onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); form.submit(); }}
                  loading={isSubmitting && actionType === 'draft'}
                  style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
                >
                  Lưu tạm
                </Button>
                <Button
                  type="primary"
                  onClick={() => { actionTypeRef.current = 'submit'; setActionType('submit'); form.submit(); }}
                  loading={isSubmitting && actionType === 'submit'}
                  style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
                >
                  Lưu và gửi phê duyệt
                </Button>
                <Button
                  type="primary"
                  onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); form.submit(); }}
                  loading={isSubmitting && actionType === 'approve'}
                  style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational, borderRadius: radiusPill, height: 40 }}
                >
                  Lưu và phê duyệt
                </Button>
              </>
            ) : (
              <>
                {(!record?.approvalStatus || ['DRAFT', 'NHAP', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(String(record.approvalStatus).toUpperCase())) && (
                  <>
                    <Button
                      onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); form.submit(); }}
                      loading={isSubmitting && actionType === 'draft'}
                      style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
                    >
                      Lưu tạm
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => { actionTypeRef.current = 'submit'; setActionType('submit'); form.submit(); }}
                      loading={isSubmitting && actionType === 'submit'}
                      style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
                    >
                      Lưu và gửi phê duyệt
                    </Button>
                  </>
                )}
                {canSaveAndApprove ? (
                  <Button
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); form.submit(); }}
                    loading={isSubmitting && actionType === 'approve'}
                    style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational, borderRadius: radiusPill, height: 40 }}
                  >
                    Lưu và phê duyệt
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'update'; setActionType('update'); form.submit(); }}
                    loading={isSubmitting && actionType === 'update'}
                    style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
                  >
                    Cập nhật
                  </Button>
                )}
              </>
            )}
          </>
        )
      }
    >
      {isDetailMode ? (
        isLoading || (!record && !initialData) ? (
          <div style={{ padding: '16px 0' }}>
            <LoadingSkeleton rows={6} />
          </div>
        ) : (
          <AisSystemDetailContent
            selectedRecord={record || initialData!}
            symbols={symbols}
            detailFiles={attachments}
            onClose={handleClose}
          />
        )
      ) : (
        <Spin spinning={isLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            onFinishFailed={(errorInfo) => {
              focusErrorTab(
                errorInfo,
                {
                  general: [
                    'code', 'name', 'orgUnitId', 'locationId', 'operatingOrgId', 'provinceId',
                    'detailedLocation', 'unitOfMeasure', 'quantity', 'model', 'commissioningYear',
                    'conditionStatus', 'specifications', 'manufacturer', 'maintenanceInfo', 'note',
                  ],
                  gis: ['geometryType', 'symbolId', 'coordinateSystem', 'displayRule'],
                },
                setTabKey
              );
            }}
          >
            <Tabs
              activeKey={tabKey}
              onChange={setTabKey}
              tabBarStyle={drawerTabBarStyle}
              animated={false}
              items={[
                {
                  key: 'general',
                  label: 'Thông tin chung',
                  children: (
                    <div style={drawerFormScrollStyle}>
                      {/* ── Section 1: Thông tin định danh & Quản lý ── */}
                      <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <BankOutlined style={{ color: actionPrimary }} />
                            <span>Thông tin định danh & Quản lý</span>
                          </div>
                        </div>
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item
                              name="code"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã hệ thống AIS</span>}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input
                                disabled
                                placeholder="Mã tự động sinh"
                                style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="name"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên hệ thống AIS</span>}
                              rules={[
                                { required: true, message: 'Vui lòng nhập tên hệ thống AIS' },
                                { max: 255, message: 'Tên tối đa 255 ký tự' },
                              ]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input
                                placeholder="Nhập tên hệ thống AIS"
                                maxLength={255}
                                showCount
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
                                organizations={orgUnits}
                                placeholder="Chọn đơn vị quản lý"
                                disabled={isEditMode}
                                allowClear
                                treeDefaultExpandAll
                                listHeight={256}
                                onChange={() => form.setFieldValue('locationId', undefined)}
                                style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="locationId"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thuộc TTDH VTS / Trạm Radar</span>}
                              rules={[{ required: true, message: 'Vui lòng chọn TTDH VTS hoặc Trạm Radar' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Select
                                placeholder="Chọn TTDH VTS hoặc Trạm Radar"
                                allowClear
                                showSearch
                                filterOption={(input, option) => normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))}
                                options={combinedLocationOptions}
                                style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
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
                                allowClear
                                showSearch
                                filterOption={(input, option) => normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))}
                                options={operatingUnitOptions}
                                style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                              />
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
                            <Form.Item
                              name="provinceId"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm (Tỉnh/TP)</span>}
                              rules={[{ required: true, message: 'Vui lòng chọn Tỉnh/Thành phố' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Select
                                placeholder="Chọn Tỉnh/Thành phố"
                                allowClear
                                showSearch
                                filterOption={(input, option) => normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))}
                                options={VIETNAM_PROVINCE_OPTIONS}
                                style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="detailedLocation"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                              rules={[{ max: 500, message: 'Địa điểm chi tiết tối đa 500 ký tự' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              name="unitOfMeasure"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị tính</span>}
                              rules={[{ required: true, message: 'Vui lòng chọn đơn vị tính' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Select
                                placeholder="Chọn đơn vị tính"
                                options={UNIT_OF_MEASURE_OPTIONS}
                                style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              name="quantity"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Số lượng</span>}
                              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <InputNumber min={1} precision={0} style={{ ...inputStyle, width: '100%', borderRadius: radiusPill, height: 40 }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="commissioningYear"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Năm đưa vào sử dụng</span>}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <DatePicker
                                {...getDatePickerProps({
                                  picker: 'year',
                                  format: 'YYYY',
                                  placeholder: 'Chọn năm đưa vào sử dụng',
                                  getPopupContainer: (trigger: HTMLElement) => trigger.parentElement || document.body,
                                })}
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
                              name="model"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Model</span>}
                              rules={[{ max: 255, message: 'Model tối đa 255 ký tự' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập model" maxLength={255} showCount style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="manufacturer"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Hãng sản xuất</span>}
                              rules={[{ max: 255, message: 'Hãng sản xuất tối đa 255 ký tự' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập hãng sản xuất" maxLength={255} showCount style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              name="specifications"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thông số kỹ thuật</span>}
                              rules={[{ max: 2000, message: 'Thông số kỹ thuật tối đa 2000 ký tự' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập thông số kỹ thuật" maxLength={2000} showCount style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>

                      {/* ── Section 3: Bảo trì & Ghi chú ── */}
                      <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <FileTextOutlined style={{ color: actionPrimary }} />
                            <span>Bảo trì & Ghi chú</span>
                          </div>
                        </div>
                        <Row gutter={[24, 0]}>
                          <Col span={24}>
                            <Form.Item
                              name="maintenanceInfo"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thông tin bảo trì</span>}
                              rules={[{ max: 2000, message: 'Thông tin bảo trì tối đa 2000 ký tự' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập thông tin bảo trì" maxLength={2000} showCount style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              name="note"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                              rules={[{ max: 2000, message: 'Ghi chú tối đa 2000 ký tự' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập ghi chú" maxLength={2000} showCount style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'gis',
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

                          <Col span={12}>
                            <Form.Item
                              name="symbolId"
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
                              <Select
                                placeholder="Chọn hệ quy chiếu"
                                disabled
                                options={COORD_SYS_OPTIONS}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                              <Input
                                placeholder="Chọn quy tắc hiển thị"
                                maxLength={255}
                                disabled
                                style={readonlyInputStyle}
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
                          <div style={{ marginBottom: spaceFormField, display: 'flex', alignItems: 'center', gap: 6 }}>
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
                              render: (_v: any, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
                            },
                            {
                              title: 'Kinh độ (Longitude - E)',
                              key: 'lng',
                              align: 'center' as const,
                              onCell: () => ({ style: { verticalAlign: 'middle' } }),
                              render: (_v: any, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
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
                      readonly={!attachmentsEditable}
                      onUpload={handleUploadAttachment}
                      onDelete={handleDeleteAttachment}
                      onDownload={handleDownloadAttachment}
                    />
                  ),
                },
              ]}
            />
          </Form>
        </Spin>
      )}

      {/* Modal Chọn vị trí GIS trên bản đồ */}
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
        destroyOnClose
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button key="cancel" onClick={() => setMapModalOpen(false)} style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}>
            Hủy
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => setMapModalOpen(false)}
            style={{ ...primaryButtonStyle, height: 36 }}
          >
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType={watchedGeometryType || 'POINT'}
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
              if (val?.geometryType) {
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

export default AisSystemForm;
