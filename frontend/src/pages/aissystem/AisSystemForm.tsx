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
  Drawer,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined,
  EnvironmentOutlined,
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
import { UNIT_OF_MEASURE_OPTIONS, UNIT_OF_MEASURE_MAP, UnitOfMeasure } from '../../types/aisSystem';
import { ApprovalStatus, ConditionStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import {
  drawerTitleStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle,
  drawerTabBarStyle, drawerStyles, drawerFormScrollStyle, drawerGisControlBoxStyle,
  spaceFormField, spaceXs, spaceSm, spaceMd, radiusPill, sidebarBg,
  fontWeightBold, fontWeightMedium, fontSizeMd, fontSizeSm, fontSizeLg,
  textSecondary, textTertiary, borderDefault,
  statusCritical, statusAttention, statusOperational, actionPrimary, textAreaStyle,
  readonlyInputStyle, drawerCloseBtnStyle, inputStyle, selectStyle,
  DRAWER_TABLE_SCROLL_Y, getDatePickerProps,
} from '../../themetokenchk';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import { useAuthStore, type AuthState } from '../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { FormOrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../components/org-unit';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import {
  parseWktToCoordinates,
  serializeCoordinatesToWkt,
  adjustCoordinateListForGeometry,
} from '../../utils/gisGeometry';

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

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const renderConditionBadge = (status?: ConditionStatus | string) => {
  if (!status) return '—';
  const label = CONDITION_STATUS_MAP[status as ConditionStatus] || status;
  const color = CONDITION_COLOR[status as ConditionStatus] || textSecondary;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        border: `1px solid ${color}40`,
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        background: `${color}15`,
        color,
      }}
    >
      {label}
    </span>
  );
};

const ddToDms = (dd?: number | null) => {
  if (dd === undefined || dd === null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  let d = Math.floor(abs);
  let minFloat = (abs - d) * 60;
  if (minFloat > 59.999999999) { d += 1; minFloat = 0; }
  let m = Math.floor(minFloat);
  let sFloat = (minFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
  return { d, m, s };
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
  onSwitchToEdit,
}) => {
  const [form] = Form.useForm();
  const [currentMode, setCurrentMode] = useState<'create' | 'edit' | 'detail'>(
    mode === 'view' ? 'detail' : (mode as 'create' | 'edit' | 'detail')
  );
  const [tabKey, setTabKey] = useState<string>('general');
  const [detailTabKey, setDetailTabKey] = useState<string>('general');
  const [record, setRecord] = useState<AisSystemResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('draft');

  const [internalOrgUnits, setInternalOrgUnits] = useState<any[]>(orgUnits || []);
  const [operatingOrganizations, setOperatingOrganizations] = useState<any[]>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [opCenters, setOpCenters] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);
  const [radarStations, setRadarStations] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [coordinateList, setCoordinateList] = useState<{ latitude: number | null; longitude: number | null }[]>([]);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<{ id: string; fileName: string }[]>([]);
  const [approvalSectionOpen, setApprovalSectionOpen] = useState(true);

  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const isDetailMode = currentMode === 'detail';
  const isCreateMode = currentMode === 'create';
  const isEditMode = currentMode === 'edit';

  const watchedGeometryType = Form.useWatch('geometryType', form);
  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);

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
      return;
    }

    setTabKey('general');
    setDetailTabKey('general');

    const targetId = editId || initialData?.id;

    if (targetId) {
      setIsLoading(true);
      aisSystemService.getById(targetId)
        .then((full) => {
          setRecord(full);
          setAttachments(full.attachments || []);
          const initialLocId = full.vtsOperationCenterId ? `op_${full.vtsOperationCenterId}` : full.radarStationId ? `radar_${full.radarStationId}` : undefined;
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
            geometryType: full.geometryType || 'POINT',
            symbolId: full.symbolId || undefined,
            coordinateSystem: full.geometryType ? 'WGS 84 / VN-2000' : undefined,
            displayRule: full.geometryType ? 'Độ, phút, giây (DMS)' : undefined,
          });
          const parsedCoords = parseWktToCoordinates(full.coordinates);
          setCoordinateList(parsedCoords);
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
        geometryType: 'POINT',
        coordinateSystem: 'WGS 84 / VN-2000',
        displayRule: 'Độ, phút, giây (DMS)',
      });
      setRecord(null);
      setAttachments([]);
      setPendingFiles([]);
      setPendingDeletedAttachments([]);
      setCoordinateList([{ latitude: null, longitude: null }]);

      aisSystemService.generateCode().then((res) => {
        form.setFieldsValue({
          code: res.code,
          conditionStatus: ConditionStatus.OPERATIONAL,
          unitOfMeasure: UnitOfMeasure.SET,
          quantity: 1,
          geometryType: 'POINT',
          coordinateSystem: 'WGS 84 / VN-2000',
          displayRule: 'Độ, phút, giây (DMS)',
        });
      }).catch(() => {});
    }
  }, [open, editId, initialData, form]);

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
    (record?.approvalStatus === ApprovalStatus.APPROVED && hasPerm('aissystem:approvec2'));

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

  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number | null, mVal: number | null, sVal: number | null) => {
    const d = dVal ?? 0;
    const m = mVal ?? 0;
    const s = sVal ?? 0;
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, d));
    const mClamped = Math.min(59, Math.max(0, m));
    const sClamped = Math.min(59.9999, Math.max(0, s));
    const decimal = dClamped + mClamped / 60 + sClamped / 3600;
    setCoordinateList((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        [field === 'lat' ? 'latitude' : 'longitude']: decimal,
      };
      return next;
    });
  };

  const renderDms = (i: number, field: 'lat' | 'lng', r: { latitude: number | null; longitude: number | null }) => {
    const v = field === 'lat' ? (r.latitude ?? 0) : (r.longitude ?? 0);
    const dms = ddToDms(v);
    const maxD = field === 'lat' ? 90 : 180;
    return (
      <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
        <InputNumber
          value={dms.d}
          min={0}
          max={maxD}
          precision={0}
          placeholder="Độ"
          controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGpsPoint(i, field, x, dms.m, dms.s)}
          style={{ flex: 1, minWidth: 0, textAlign: 'center' }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
        <InputNumber
          value={dms.m}
          min={0}
          max={59}
          precision={0}
          placeholder="Phút"
          controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGpsPoint(i, field, dms.d, x, dms.s)}
          style={{ flex: 1, minWidth: 0, textAlign: 'center' }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
        <InputNumber
          value={dms.s}
          min={0}
          max={59.9999}
          step={0.01}
          placeholder="Giây"
          controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGpsPoint(i, field, dms.d, dms.m, x)}
          style={{ flex: 1.2, minWidth: 0, textAlign: 'center' }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span>
      </Space.Compact>
    );
  };

  const handleFinish = async (values: any) => {
    const act = actionTypeRef.current;
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

      const geomType = values.geometryType || 'POINT';
      const validCoords = coordinateList.filter((c) => c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude));
      const wkt = validCoords.length > 0 ? serializeCoordinatesToWkt(validCoords, geomType) : undefined;

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
        } else if (act === 'approve' && created?.id) {
          await aisSystemService.submit(created.id).catch(() => {});
          await aisSystemService.approveC2(created.id, 'APPROVED', 'Lưu và phê duyệt trực tiếp');
        }
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
        toast.success('Thêm mới thành công');
      } else if (editId || record?.id) {
        const targetId = editId || record!.id;
        await aisSystemService.update(targetId, { ...payload, id: targetId } as UpdateAisSystemRequest);
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

  // ── Render Detail View (100% Identical to VtsOperationCenterForm) ──────────
  const renderDetailContent = () => {
    if (!record) return null;

    return (
      <Tabs
        activeKey={detailTabKey}
        onChange={setDetailTabKey}
        tabBarStyle={drawerTabBarStyle}
        animated={false}
        items={[
          {
            key: 'general',
            label: 'Thông tin chung',
            children: (
              <div style={drawerFormScrollStyle}>
                <div className="chk-detail-grid">
                  <div className="chk-detail-row"><span className="chk-detail-label">Mã thiết bị</span><span className="chk-detail-value">{record.code || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Tên thiết bị</span><span className="chk-detail-value">{record.name || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị quản lý</span><span className="chk-detail-value">{record.orgUnitName || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Thuộc TTDH VTS / Trạm Radar</span><span className="chk-detail-value">{record.vtsOperationCenterName || record.radarStationName || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị khai thác</span><span className="chk-detail-value">{record.operatingOrgName || operatingUnitOptions.find((o) => o.value === String(record.operatingOrgId))?.label || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm (Tỉnh/TP)</span><span className="chk-detail-value">{record.provinceName || getProvinceNameById(record.provinceId) || '—'}</span></div>

                  <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm chi tiết</span><span className="chk-detail-value">{record.detailedLocation || '—'}</span></div>
                  <div style={{ display: 'flex', gap: 24, padding: 0 }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', minHeight: 38, padding: '8px 0', borderBottom: `1px solid ${borderDefault}` }}>
                      <span style={{ width: 95, flexShrink: 0, color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: 1.5 }}>
                        Đơn vị tính:
                      </span>
                      <span className="chk-detail-value">
                        {record.unitOfMeasure != null ? (UNIT_OF_MEASURE_MAP[record.unitOfMeasure] || record.unitOfMeasure) : '—'}
                      </span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', minHeight: 38, padding: '8px 0', borderBottom: `1px solid ${borderDefault}` }}>
                      <span style={{ width: 75, flexShrink: 0, color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: 1.5 }}>
                        Số lượng:
                      </span>
                      <span className="chk-detail-value">
                        {record.quantity ?? '—'}
                      </span>
                    </div>
                  </div>

                  <div className="chk-detail-row"><span className="chk-detail-label">Năm đưa vào sử dụng</span><span className="chk-detail-value">{record.commissioningYear || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Tình trạng</span><span className="chk-detail-value">{renderConditionBadge(record.conditionStatus)}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Model</span><span className="chk-detail-value">{record.model || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Hãng sản xuất</span><span className="chk-detail-value">{record.manufacturer || '—'}</span></div>
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label">Thông số kỹ thuật</span>
                    <span className="chk-detail-value">{record.specifications || '—'}</span>
                  </div>
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label">Thông tin bảo trì</span>
                    <span className="chk-detail-value">{record.maintenanceInfo || '—'}</span>
                  </div>
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label">Ghi chú</span>
                    <span className="chk-detail-value">{record.note || '—'}</span>
                  </div>
                </div>

                <div style={{ marginTop: spaceMd, marginBottom: spaceSm }}>
                  <button
                    type="button"
                    onClick={() => setApprovalSectionOpen((openState) => !openState)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: `${spaceXs}px 0`,
                      color: actionPrimary,
                      fontWeight: fontWeightBold,
                      fontSize: fontSizeMd,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spaceSm,
                    }}
                  >
                    <span aria-hidden="true">{approvalSectionOpen ? '▼' : '▶'}</span>
                    <span>Thông tin phê duyệt</span>
                  </button>
                </div>

                {approvalSectionOpen && (
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row"><span className="chk-detail-label">Ngày gửi phê duyệt</span><span className="chk-detail-value">{record.submittedAt ? dayjs(record.submittedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ gửi phê duyệt</span><span className="chk-detail-value">{record.submittedByName || record.submittedBy || '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Ngày phê duyệt cấp C1</span><span className="chk-detail-value">{record.approvedDateLevel1 ? dayjs(record.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ phê duyệt cấp C1</span><span className="chk-detail-value">{record.approverLevel1Name || record.approverLevel1 || '—'}</span></div>
                    <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Nội dung phê duyệt cấp C1</span><span className="chk-detail-value">{record.approvalContentLevel1 || record.approvalReasonLevel1 || '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Ngày phê duyệt cấp C2</span><span className="chk-detail-value">{record.approvedDateLevel2 ? dayjs(record.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ phê duyệt cấp C2</span><span className="chk-detail-value">{record.approverLevel2Name || record.approverLevel2 || '—'}</span></div>
                    <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Nội dung phê duyệt cấp C2</span><span className="chk-detail-value">{record.approvalContentLevel2 || record.approvalReasonLevel2 || record.rejectionReason || '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Trạng thái phê duyệt</span><span className="chk-detail-value"><ApprovalStatusBadge status={record.approvalStatus} /></span></div>
                    {record.rejectionReason && <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Lý do từ chối</span><span className="chk-detail-value" style={{ color: statusCritical }}>{record.rejectionReason}</span></div>}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'gis',
            label: 'Vị trí (GIS)',
            children: (
              <DetailTable
                scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                dataSource={coordinateList}
                emptyText="Chưa có tọa độ GPS nào"
                headerNode={
                  <>
                    <div className="chk-detail-grid" style={{ marginBottom: 12 }}>
                      <div className="chk-detail-row"><span className="chk-detail-label">Loại đối tượng</span><span className="chk-detail-value">{record?.geometryType === 'LINE' ? 'Đối tượng đường' : record?.geometryType === 'POLYGON' ? 'Đối tượng vùng' : 'Đối tượng điểm'}</span></div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Biểu tượng</span>
                        <span className="chk-detail-value">
                          {(() => {
                            const symId = record?.symbolId;
                            const sym = symbols.find((s) => s.id === symId || s.code === symId || (symId && String(s.id) === String(symId)));
                            if (sym) {
                              const imgSrc = sym.image
                                ? (sym.image.startsWith('data:') || sym.image.startsWith('http') || sym.image.startsWith('/')
                                    ? sym.image
                                    : `data:image/png;base64,${sym.image}`)
                                : undefined;
                              return (
                                <Space size={8} align="center" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  {imgSrc ? (
                                    <img
                                      src={imgSrc}
                                      alt={sym.name || ''}
                                      style={{ width: 20, height: 20, objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block' }}
                                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: actionPrimary }} />
                                  )}
                                  <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                                </Space>
                              );
                            }
                            return (
                              <Space size={8} align="center" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: actionPrimary }} />
                                <span>{(record as any)?.symbolName || (record?.symbolId ? `Biểu tượng (${record.symbolId})` : 'Hệ thống AIS')}</span>
                              </Space>
                            );
                          })()}
                        </span>
                      </div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Hệ quy chiếu</span><span className="chk-detail-value">WGS 84 / VN-2000</span></div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Quy tắc hiển thị</span><span className="chk-detail-value">Độ, phút, giây (DMS)</span></div>
                    </div>
                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                      <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>
                        Tọa độ GPS
                      </span>
                      <Button
                        type="primary"
                        icon={<EnvironmentOutlined />}
                        onClick={() => setMapModalOpen(true)}
                        style={{
                          ...primaryButtonStyle,
                          height: 32,
                          fontSize: fontSizeSm,
                          padding: '0 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        Xem vị trí trên bản đồ
                      </Button>
                    </div>
                  </>
                }
                columns={[
                  {
                    title: 'STT',
                    dataIndex: 'stt',
                    width: 60,
                    align: 'center',
                    render: (_v: any, _r: any, index: number) => index + 1,
                  },
                  {
                    title: 'Vĩ độ (Latitude - N)',
                    key: 'lat',
                    render: (_v: any, r: any) => {
                      const dms = ddToDms(r.latitude);
                      return `${dms.d}° ${dms.m}' ${dms.s}" N`;
                    },
                  },
                  {
                    title: 'Kinh độ (Longitude - E)',
                    key: 'lng',
                    render: (_v: any, r: any) => {
                      const dms = ddToDms(r.longitude);
                      return `${dms.d}° ${dms.m}' ${dms.s}" E`;
                    },
                  },
                ]}
              />
            ),
          },
          {
            key: 'files',
            label: 'File đính kèm',
            children: (
              <InfrastructureAttachmentTab
                attachments={attachments}
                readonly={true}
                onDownload={handleDownloadAttachment}
              />
            ),
          },
        ]}
      />
    );
  };

  return (
    <Drawer
      rootClassName="vtssystemchk-theme-scope"
      size="50%"
      placement="right"
      closable={false}
      open={open}
      onClose={handleClose}
      styles={drawerStyles}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={drawerTitleStyle}>
            {isDetailMode
              ? (record?.name ? `Xem chi tiết — ${record.name}` : 'Xem chi tiết Hệ thống trạm bờ AIS')
              : isCreateMode
                ? 'Thêm mới Hệ thống trạm bờ AIS'
                : (record?.name ? `Chỉnh sửa — ${record.name}` : 'Chỉnh sửa Hệ thống trạm bờ AIS')}
          </span>
          <Space size={8}>
            {isDetailMode && onSwitchToEdit && (
              <Button
                type="primary"
                size="small"
                onClick={onSwitchToEdit}
                style={{ ...primaryButtonStyle, height: 28, fontSize: fontSizeSm, borderRadius: radiusPill }}
              >
                Chuyển sang sửa
              </Button>
            )}
            <Button
              type="text"
              onClick={handleClose}
              style={{
                ...drawerCloseBtnStyle,
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloseOutlined style={{ fontSize: 14, color: textSecondary }} />
            </Button>
          </Space>
        </div>
      }
      footer={
        isDetailMode ? null : (
          <div style={drawerFooterStyle}>
            {isCreateMode ? (
              <>
                <Button
                  onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); form.submit(); }}
                  loading={isSubmitting && actionType === 'draft'}
                  style={outlineButtonStyle}
                >
                  Lưu tạm
                </Button>
                <Button
                  type="primary"
                  onClick={() => { actionTypeRef.current = 'submit'; setActionType('submit'); form.submit(); }}
                  loading={isSubmitting && actionType === 'submit'}
                  style={primaryButtonStyle}
                >
                  Lưu và gửi phê duyệt
                </Button>
                {hasPerm('aissystem:approvec2') && (
                  <Button
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); form.submit(); }}
                    loading={isSubmitting && actionType === 'approve'}
                    style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                  >
                    Lưu và phê duyệt
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button onClick={handleClose} style={outlineButtonStyle}>Hủy</Button>
                <Button
                  type="primary"
                  onClick={() => { actionTypeRef.current = 'update'; setActionType('update'); form.submit(); }}
                  loading={isSubmitting}
                  style={primaryButtonStyle}
                >
                  Cập nhật
                </Button>
              </>
            )}
          </div>
        )
      }
    >
      <Spin spinning={isLoading}>
        {isDetailMode ? renderDetailContent() : (
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
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item
                            name="code"
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã thiết bị</span>}
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
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên thiết bị</span>}
                            rules={[
                              { required: true, message: 'Vui lòng nhập tên thiết bị' },
                              { max: 255, message: 'Tên tối đa 255 ký tự' },
                            ]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập tên thiết bị"
                              maxLength={255}
                              showCount
                              style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={[24, 0]}>
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
                      </Row>

                      <Row gutter={[24, 0]}>
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
                      </Row>

                      <Row gutter={[24, 0]}>
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
                      </Row>

                      <Row gutter={[24, 0]}>
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
                      </Row>

                      <Row gutter={[24, 0]}>
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
                      </Row>

                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            name="specifications"
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thông số kỹ thuật</span>}
                            rules={[{ max: 2000, message: 'Thông số kỹ thuật tối đa 2000 ký tự' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={3} placeholder="Nhập thông số kỹ thuật" maxLength={2000} showCount style={{ ...textAreaStyle, padding: '10px 16px' }} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            name="maintenanceInfo"
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thông tin bảo trì</span>}
                            rules={[{ max: 2000, message: 'Thông tin bảo trì tối đa 2000 ký tự' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={3} placeholder="Nhập thông tin bảo trì, bảo dưỡng" maxLength={2000} showCount style={{ ...textAreaStyle, padding: '10px 16px' }} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            name="note"
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                            rules={[{ max: 2000, message: 'Ghi chú tối đa 2000 ký tự' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" maxLength={2000} showCount style={{ ...textAreaStyle, padding: '10px 16px' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: 'gis',
                  label: 'Vị trí (GIS)',
                  children: (
                    <div>
                      <div style={drawerGisControlBoxStyle}>
                        <Row gutter={[24, 0]} style={{ height: 68, marginBottom: 8 }}>
                          <Col span={12}>
                            <Form.Item
                              name="geometryType"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Loại đối tượng</span>}
                              style={{ marginBottom: 0 }}
                            >
                              <Select
                                placeholder="Chọn loại đối tượng"
                                options={[
                                  { value: 'POINT', label: 'Đối tượng điểm' },
                                  { value: 'LINE', label: 'Đối tượng đường' },
                                  { value: 'POLYGON', label: 'Đối tượng vùng' },
                                ]}
                                style={{ ...selectStyle, height: 38 }}
                                onChange={(val) => {
                                  form.setFieldValue('geometryType', val);
                                  if (val) {
                                    form.setFieldValue('coordinateSystem', 'WGS 84 / VN-2000');
                                    form.setFieldValue('displayRule', 'Độ, phút, giây (DMS)');
                                    setCoordinateList((prev) => adjustCoordinateListForGeometry(prev, val));
                                  } else {
                                    form.setFieldValue('coordinateSystem', undefined);
                                    form.setFieldValue('displayRule', undefined);
                                    form.setFieldValue('symbolId', undefined);
                                    setCoordinateList([]);
                                  }
                                }}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              name="symbolId"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Biểu tượng</span>}
                              style={{ marginBottom: 0 }}
                            >
                              <Select
                                placeholder="Chọn biểu tượng bản đồ"
                                allowClear
                                disabled={!watchedGeometryType}
                                options={symbols.map((sym) => ({
                                  value: sym.id,
                                  label: (
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
                                  ),
                                }))}
                                style={{ ...selectStyle, height: 38 }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={[24, 0]} style={{ height: 68, marginBottom: 8 }}>
                          <Col span={12}>
                            <Form.Item
                              name="coordinateSystem"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Hệ quy chiếu</span>}
                              initialValue="WGS 84 / VN-2000"
                              style={{ marginBottom: 0 }}
                            >
                              <Select
                                placeholder="Chọn hệ quy chiếu"
                                allowClear
                                options={[
                                  { value: 'WGS 84 / VN-2000', label: 'WGS 84 / VN-2000' },
                                  { value: 'WGS-84', label: 'WGS-84' },
                                  { value: 'VN-2000', label: 'VN-2000' },
                                ]}
                                style={{ ...selectStyle, height: 38 }}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              name="displayRule"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Quy tắc hiển thị</span>}
                              initialValue="Độ, phút, giây (DMS)"
                              style={{ marginBottom: 0 }}
                            >
                              <Input disabled style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 38 }} />
                            </Form.Item>
                          </Col>
                        </Row>

                        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32, boxSizing: 'border-box' }}>
                          <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
                            Tọa độ
                          </span>
                          <Space>
                            <Button
                              icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                              onClick={() => setMapModalOpen(true)}
                              style={{
                                borderRadius: radiusPill,
                                height: 32,
                                padding: '0 14px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                borderColor: actionPrimary,
                                color: actionPrimary,
                              }}
                            >
                              Chọn vị trí trên bản đồ
                            </Button>
                            {watchedGeometryType && watchedGeometryType !== 'POINT' && (
                              <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setCoordinateList((p) => [...p, { latitude: null, longitude: null }])}
                                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 32 }}
                              >
                                Thêm tọa độ
                              </Button>
                            )}
                          </Space>
                        </div>
                      </div>

                      <DetailTable
                        scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
                        dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
                        emptyText="Chưa có tọa độ nào"
                        rowKey="_idx"
                        columns={[
                          {
                            title: 'STT',
                            key: 'stt',
                            width: 60,
                            align: 'center',
                            render: (_: any, __: any, i: number) => (
                              <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>
                            ),
                          },
                          {
                            title: 'Vĩ độ (N)',
                            key: 'lat',
                            render: (_: any, r: any) => renderDms(r._idx, 'lat', r),
                          },
                          {
                            title: 'Kinh độ (E)',
                            key: 'lng',
                            render: (_: any, r: any) => renderDms(r._idx, 'lng', r),
                          },
                          {
                            title: '',
                            key: 'actions',
                            width: 50,
                            align: 'center' as const,
                            render: (_: any, r: any) => {
                              const geom = (watchedGeometryType || form.getFieldValue('geometryType') || 'POINT').toUpperCase();
                              const minCount = geom.includes('LINE') ? 2 : (geom.includes('POLYGON') ? 3 : 1);
                              const canDelete = coordinateList.length > minCount;
                              if (!canDelete) return null;

                              return (
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                                  style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={() => setCoordinateList((p) => p.filter((_, idx) => idx !== r._idx))}
                                  title="Xóa tọa độ"
                                />
                              );
                            },
                          },
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: 'files',
                  label: 'File đính kèm',
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
        )}
      </Spin>

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
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={
          isDetailMode ? null : [
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
            height={560}
            disabled={isDetailMode}
            value={{
              geometryType: watchedGeometryType || 'POINT',
              coordinates: serializeCoordinatesToWkt(coordinateList, watchedGeometryType || 'POINT'),
              symbolId: form.getFieldValue('symbolId'),
            }}
            defaultGeometryType={(watchedGeometryType as any) || 'POINT'}
            onChange={(val) => {
              if (isDetailMode) return;
              if (val?.coordinates) {
                const pts = parseWktToCoordinates(val.coordinates);
                if (pts.length > 0) setCoordinateList(pts);
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
    </Drawer>
  );
};

export default AisSystemForm;
