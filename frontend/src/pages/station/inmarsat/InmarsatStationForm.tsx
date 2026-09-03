import React, { useState, useEffect, useRef } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Space,
  Spin,
  Tabs,
  Modal,
  Drawer,
  InputNumber,
} from 'antd';
import {
  CloseOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import toast from '../../../components/ToastNotification';
import { inmarsatStationService } from '../../../services/inmarsatStationService';
import type {
  CoastalStationInmarsatResponse,
  CoastalStationInmarsatRequest,
} from '../../../services/station/types';
import { ConditionStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP, ApprovalStatus } from '../../../types/vtsSystem';
import {
  drawerTitleStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle,
  drawerTabBarStyle, drawerStyles, drawerFormScrollStyle, drawerGisControlBoxStyle, DRAWER_TABLE_SCROLL_Y,
  requiredMarkStyle, spaceFormField, radiusPill, sidebarBg,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  textPrimary, textSecondary, textTertiary, borderDefault,
  statusCritical, statusOperational, statusAttention, actionPrimary, textAreaStyle,
  readonlyInputStyle, drawerCloseBtnStyle, selectStyle, inputStyle,
} from '../../../themetokenchk';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../../types/common';
import { useAuthStore } from '../../../store/authStore';
import { usePermissionStore } from '../../../store/permissionStore';
import { FormOrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../../components/org-unit';
import DetailTable from '../../../components/shared/DetailTable';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import InfrastructureAttachmentTab from '../../../components/shared/InfrastructureAttachmentTab';
import ServiceMultiSelect from '../../../components/shared/ServiceMultiSelect';
import GisLocationSelector from '../../../components/gis/GisLocationSelector';
import { symbolService } from '../../../services/symbolService';
import dayjs from 'dayjs';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import { parseWktToCoordinates, serializeCoordinatesToWkt, ddToDms, dmsToDd, adjustCoordinateListForGeometry } from '../../../utils/gisGeometry';
import { focusErrorTab } from '../../../utils/formValidationHelper';

export const INMARSAT_SERVICE_OPTIONS = [
  { value: 'Inmarsat-C', label: 'Inmarsat-C — Dịch vụ thông tin vệ tinh Inmarsat-C' },
  { value: 'Inmarsat-F77', label: 'Inmarsat-F77 — Dịch vụ thoại và dữ liệu hàng hải' },
  { value: 'FleetBroadband', label: 'FleetBroadband — Dịch vụ băng rộng hàng hải' },
  { value: 'SafetyNET', label: 'SafetyNET — Phát thông tin an toàn hàng hải' },
  { value: 'Fleet Safety', label: 'Fleet Safety — Dịch vụ an toàn đội tàu' },
  { value: 'LRIT Tracking', label: 'LRIT Tracking — Nhận dạng và theo dõi tầm xa' },
  { value: 'EGC', label: 'EGC — Điện báo gọi nhóm nâng cao' },
];

export const DEFAULT_GIS_SYMBOLS = [
  { id: '1', code: 'SYM-INMARSAT', name: 'Đài thông tin vệ tinh Inmarsat', image: '' },
  { id: '2', code: 'SYM-COASTAL', name: 'Đài thông tin duyên hải', image: '' },
  { id: '3', code: 'SYM-VTS', name: 'Trung tâm điều hành VTS', image: '' },
  { id: '4', code: 'SYM-AIS', name: 'Trạm bờ AIS', image: '' },
  { id: '5', code: 'SYM-RADAR', name: 'Trạm Radar hàng hải', image: '' },
  { id: '6', code: 'SYM-BUOY', name: 'Phao báo hiệu hàng hải', image: '' },
  { id: '7', code: 'SYM-BEACON', name: 'Trạm đèn biển (Hải đăng)', image: '' },
  { id: '8', code: 'SYM-PORT', name: 'Cảng biển / Bến cảng', image: '' },
  { id: '9', code: 'SYM-ANCHORAGE', name: 'Khu neo đậu / Đón trả hoa tiêu', image: '' },
];

const isUuid = (val?: string) => !!val && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(val);

export interface InmarsatStationFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: CoastalStationInmarsatResponse | null;
  mode?: 'create' | 'edit' | 'detail';
  orgUnits?: any[];
  onClose?: () => void;
  onSuccess?: () => void;
}

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  NOT_OPERATIONAL: statusCritical,
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

const renderServicesBadges = (services?: string[] | string) => {
  if (!services) return '—';
  let list: string[] = [];
  if (Array.isArray(services)) {
    list = services;
  } else if (typeof services === 'string') {
    try {
      const parsed = JSON.parse(services);
      if (Array.isArray(parsed)) list = parsed;
      else list = [String(parsed)];
    } catch {
      list = services.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  if (list.length === 0) return '—';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px', alignItems: 'center' }}>
      {list.map((srv) => (
        <span
          key={srv}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 10px',
            height: '28px',
            lineHeight: '26px',
            borderRadius: radiusPill,
            background: '#eef3fb',
            border: '1px solid #c6d9f5',
            color: '#12468C',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {srv}
        </span>
      ))}
    </div>
  );
};

export const getOperatingOrgName = (idOrCode?: string | null, name?: string | null): string => {
  const isUuid = (val?: string | null) =>
    !!val && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

  if (name && name !== '—' && !isUuid(name)) {
    return name;
  }
  const key = isUuid(name) ? name : idOrCode;
  if (!key) return '—';

  const found = DEFAULT_OPERATING_ORGANIZATIONS.find(
    (o) => o.id === key || String(o.id) === String(key) || o.code === key
  );
  if (found) return found.name;
  return name && !isUuid(name) ? name : '—';
};

export const InmarsatStationForm: React.FC<InmarsatStationFormProps> = ({
  open = true,
  editId,
  initialData,
  mode = 'create',
  orgUnits = [],
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve'>('draft');
  const [tabKey, setTabKey] = useState<string>('general');

  const [record, setRecord] = useState<CoastalStationInmarsatResponse | null>(initialData || null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<{ id: string; fileName: string }[]>([]);
  const [operationPlanList] = useState<any[]>((initialData as any)?.operationPlans || []);
  const [maintenancePlanList] = useState<any[]>((initialData as any)?.maintenancePlans || []);
  const [incidentList] = useState<any[]>((initialData as any)?.incidentList || []);

  // Symbols & GIS
  const [symbols, setSymbols] = useState<any[]>([]);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [coordinateList, setCoordinateList] = useState<{ latitude: number | null; longitude: number | null }[]>([]);
  const [geometryTypeState, setGeometryTypeState] = useState<string>('POINT');

  // Permissions & user
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();

  const isCreateMode = mode === 'create';
  const isEditMode = mode === 'edit';
  const isDetailMode = mode === 'detail';

  const userOrgId = (user as any)?.orgUnitId ? String((user as any).orgUnitId) : undefined;
  const userUnitType = (user as any)?.unitType || '';
  const canApproveL2 = hasPermission('coastalstationinmarsat:approvec2') || hasPermission('coastalstationinmarsat:approve') || hasPermission('specialstation:approvec2') || hasPermission('specialstation:approve') || hasPermission('admin:all') || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN';
  const canApproveL1 = hasPermission('coastalstationinmarsat:approvec1') || hasPermission('specialstation:approvec1');
  const canSaveAndApprove = canApproveL2 || canApproveL1;

  // Filter org units based on data scope
  const filteredOrgUnits = React.useMemo(() => {
    if (!userOrgId || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CHUYEN_VIEN_CUC') {
      return orgUnits;
    }
    const allowed = new Set(resolveOrgSubtreeIds(orgUnits, userOrgId));
    return orgUnits.filter((u) => allowed.has(String(u.id)));
  }, [orgUnits, userOrgId, userUnitType]);

  // Load symbols
  useEffect(() => {
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
  }, []);

  // Fetch record on open
  useEffect(() => {
    if (!open) return;
    setTabKey('general');
    setPendingFiles([]);
    setPendingDeletedAttachments([]);

    if (isCreateMode) {
      setRecord(null);
      setAttachments([]);
      setCoordinateList([{ latitude: null, longitude: null }]);
      setGeometryTypeState('POINT');
      form.resetFields();
      form.setFieldsValue({
        conditionStatus: ConditionStatus.OPERATIONAL,
        geometryType: 'POINT',
        coordinateSystem: 'WGS 84 / VN-2000',
        displayRule: 'Độ, phút, giây (DMS)',
      });
      inmarsatStationService.generateCode()
        .then((res) => {
          form.setFieldsValue({ code: res?.code || 'INMARSAT-0001' });
        })
        .catch(() => {
          form.setFieldsValue({ code: 'INMARSAT-0001' });
        });
      return;
    }

    const currentId = editId || initialData?.id;
    if (currentId) {
      setLoading(true);
      Promise.all([
        inmarsatStationService.getById(currentId),
        inmarsatStationService.getAttachments(currentId),
      ])
        .then(([res, atts]) => {
          setRecord(res);
          setAttachments(atts || []);
          let pts: { latitude: number | null; longitude: number | null }[] = [];
          if (res.coordinates) {
            pts = parseWktToCoordinates(res.coordinates);
          }
          if (pts.length === 0 && res.latitude != null && res.longitude != null) {
            pts = [{ latitude: Number(res.latitude), longitude: Number(res.longitude) }];
          }
          let geom = res.geometryType || res.objectType;
          if (!geom || geom === 'POINT') {
            if (res.coordinates) {
              const uc = res.coordinates.toUpperCase();
              if (uc.startsWith('LINE')) geom = 'LINE';
              else if (uc.startsWith('POLYGON')) geom = 'POLYGON';
            }
          }
          if (!geom || geom === 'POINT') {
            if (pts.length > 2) geom = 'POLYGON';
            else if (pts.length > 1) geom = 'LINE';
            else geom = 'POINT';
          }
          res.geometryType = geom;
          res.objectType = geom;
          setGeometryTypeState(geom);
          setCoordinateList(adjustCoordinateListForGeometry(pts, geom));
          form.setFieldsValue({
            code: res.code,
            name: res.name,
            orgUnitId: res.orgUnitId ? String(res.orgUnitId) : undefined,
            operatingOrgId: res.operatingOrgId ? String(res.operatingOrgId) : undefined,
            provinceId: res.provinceId != null ? String(res.provinceId) : undefined,
            locationDetail: res.locationDetail || res.locationAddress,
            conditionStatus: res.conditionStatus || 'OPERATIONAL',
            coverageZone: res.coverageZone,
            services: Array.isArray(res.services)
              ? res.services
              : (typeof res.services === 'string' && res.services.trim()
                  ? (() => {
                      try {
                        const parsed = JSON.parse(res.services);
                        if (Array.isArray(parsed)) return parsed;
                        return [String(parsed)];
                      } catch {
                        return res.services.split(',').map((s: string) => s.trim()).filter(Boolean);
                      }
                    })()
                  : []),
            frequency: res.frequency,
            notes: res.notes || res.description || (res as any).note,
            geometryType: geom,
            symbolId: res.symbolId || res.symbol,
            symbol: res.symbolId || res.symbol,
            coordinateSystem: res.coordinateSystem || 'WGS 84 / VN-2000',
            displayRule: res.displayRule || 'Độ, phút, giây (DMS)',
          });
        })
        .catch((err) => {
          toast.error(err?.response?.data?.message || 'Không thể tải thông tin đài Inmarsat');
        })
        .finally(() => setLoading(false));
    }
  }, [open, editId, initialData, isCreateMode, form, filteredOrgUnits]);

  // DMS helper
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    const decimal = (d == null && m == null && s == null) ? null : dmsToDd(d ?? 0, m ?? 0, s ?? 0);
    setCoordinateList((prev) => {
      const next = [...prev];
      if (!next[i]) next[i] = { latitude: null, longitude: null };
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

  // Submit form
  const handleFinish = async (values: any) => {
    const act = actionTypeRef.current;
    setIsSubmitting(true);
    try {
      const geomType = values.geometryType || 'POINT';
      const validCoords = coordinateList.filter((c) => c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude));
      const minPoints = geomType === 'LINE' ? 2 : (geomType === 'POLYGON' ? 3 : 1);
      if (validCoords.length > 0 && validCoords.length < minPoints) {
        toast.error(`Đối tượng kiểu ${geomType === 'LINE' ? 'đường' : 'vùng'} yêu cầu tối thiểu ${minPoints} điểm tọa độ`);
        setIsSubmitting(false);
        return;
      }
      const firstCoord = validCoords[0];


      const payload: CoastalStationInmarsatRequest = {
        code: values.code?.trim(),
        deviceCode: values.code?.trim(),
        name: values.name?.trim(),
        stationName: values.name?.trim(),
        orgUnitId: values.orgUnitId,
        operatingOrgId: values.operatingOrgId,
        provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
        locationDetail: values.locationDetail?.trim(),
        locationAddress: values.locationDetail?.trim(),
        conditionStatus: values.conditionStatus,
        coverageZone: values.coverageZone?.trim(),
        services: Array.isArray(values.services)
          ? values.services.join(', ')
          : (values.services?.trim() || undefined),
        frequency: values.frequency?.trim(),
        notes: values.notes?.trim(),
        description: values.notes?.trim(),
        objectType: values.geometryType || 'POINT',
        symbol: values.symbolId || values.symbol,
        symbolId: values.symbolId || values.symbol,
        coordinateSystem: values.coordinateSystem,
        displayRule: values.displayRule || 'Độ, phút, giây (DMS)',
        latitude: firstCoord?.latitude != null ? firstCoord.latitude : undefined,
        longitude: firstCoord?.longitude != null ? firstCoord.longitude : undefined,
        coordinates: serializeCoordinatesToWkt(coordinateList, values.geometryType || 'POINT'),
      };

      let resultId = editId || record?.id;
      if (isCreateMode) {
        const created = await inmarsatStationService.create(payload);
        resultId = created.id;
        if (created?.id && pendingFiles.length > 0) {
          try {
            await Promise.all(pendingFiles.map((f) => inmarsatStationService.uploadAttachment(created.id, f)));
          } catch {
            toast.error('Lỗi khi tải tệp đính kèm');
          }
        }
      } else if (resultId) {
        await inmarsatStationService.update(resultId, payload);
        if (pendingDeletedAttachments.length > 0) {
          try {
            await Promise.all(pendingDeletedAttachments.map((a) => inmarsatStationService.deleteAttachment(resultId!, a.id)));
          } catch (delErr) {
            console.warn('Failed to delete some attachments on edit', delErr);
          }
        }
        if (pendingFiles.length > 0) {
          try {
            await Promise.all(pendingFiles.map((f) => inmarsatStationService.uploadAttachment(resultId!, f)));
          } catch {
            toast.error('Lỗi khi tải tệp đính kèm');
          }
        }
      }
      setPendingDeletedAttachments([]);

      if (resultId) {
        if (act === 'submit') {
          await inmarsatStationService.submit(resultId);
          toast.success(isCreateMode ? 'Tạo mới và gửi phê duyệt thành công' : 'Lưu và gửi phê duyệt thành công');
        } else if (act === 'approve') {
          const currentStatus = record?.approvalStatus;
          const isDraftOrRejected = isCreateMode || !currentStatus || currentStatus === ApprovalStatus.DRAFT || currentStatus === ApprovalStatus.REJECTED_LEVEL1 || currentStatus === ApprovalStatus.REJECTED_LEVEL2;
          if (isDraftOrRejected) {
            await inmarsatStationService.submit(resultId).catch(() => {});
          }
          if (canApproveL2) {
            await inmarsatStationService.approveL2(resultId);
            toast.success(isCreateMode ? 'Thêm mới và phê duyệt thành công' : 'Lưu và phê duyệt thành công');
          } else if (canApproveL1) {
            await inmarsatStationService.approveL1(resultId);
            toast.success('Lưu và phê duyệt cấp 1 thành công');
          }
        } else {
          toast.success(isCreateMode ? 'Tạo mới (Lưu tạm) thành công' : 'Cập nhật thành công');
        }
      }

      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu đài Inmarsat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const attachmentsEditable = isCreateMode ||
    record?.approvalStatus === ApprovalStatus.DRAFT ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2 ||
    (record?.approvalStatus === ApprovalStatus.APPROVED && canApproveL2);

  // Attachment callbacks
  const handleUploadAttachment = async (file: File) => {
    if (!isCreateMode && !attachmentsEditable) {
      toast.error('Chỉ thay đổi được tài liệu đính kèm khi hồ sơ ở trạng thái Lưu tạm, Bị trả về hoặc có quyền phê duyệt cấp Cục đối với hồ sơ Đã duyệt');
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File vượt quá 20MB theo quy định');
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif'].includes(ext)) {
      toast.error('Định dạng không hỗ trợ (chỉ chấp nhận PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TIFF)');
      return false;
    }
    if (attachments.length >= 10) {
      toast.error('Số lượng tệp đính kèm tối đa là 10 tệp');
      return false;
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    (file as any)._tempId = tempId;
    const newAttachment = {
      id: tempId,
      fileName: file.name,
      fileSize: file.size,
      uploadedByName: (user as any)?.fullName || (user as any)?.username || 'Cán bộ quản lý',
      uploadedBy: (user as any)?.fullName || (user as any)?.username || 'Cán bộ quản lý',
      uploadedDate: new Date().toISOString(),
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
    const isTemp = String(attId).startsWith('temp_') || String(attId).startsWith('temp-');
    if (isTemp) {
      setPendingFiles((prev) => prev.filter((f) => (f as any)._tempId !== attId && f.name !== attId));
    } else if (targetAtt) {
      setPendingDeletedAttachments((prev) => [...prev, { id: attId, fileName: targetAtt.fileName }]);
    }
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
    toast.success('Đã xóa tệp đính kèm');
  };

  const handleDownloadAttachment = async (attId: string, fileName?: string) => {
    if (String(attId).startsWith('temp_') || String(attId).startsWith('temp-')) {
      const localFile = pendingFiles.find((f) => (f as any)._tempId === attId || f.name === fileName);
      if (localFile) {
        const url = URL.createObjectURL(localFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = localFile.name;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    }
    const targetId = record?.id || editId;
    if (!targetId) return;
    try {
      await inmarsatStationService.downloadAttachment(targetId, attId, fileName);
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  };

  return (
    <Drawer
      rootClassName="vtssystemchk-theme-scope"
      width="50%"
      placement="right"
      closable={false}
      open={open}
      onClose={onClose}
      styles={drawerStyles}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={drawerTitleStyle}>
            {isCreateMode && 'Thêm mới Đài thông tin vệ tinh Inmarsat'}
            {isEditMode && (record?.name ? `Chỉnh sửa — ${record.name}` : 'Chỉnh sửa Đài thông tin vệ tinh Inmarsat')}
            {isDetailMode && (record?.name ? `Xem chi tiết — ${record.name}` : 'Xem chi tiết Đài thông tin vệ tinh Inmarsat')}
          </span>
          <Button
            type="text"
            onClick={onClose}
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
                {canSaveAndApprove && (
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
                <Button onClick={onClose} style={outlineButtonStyle}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); form.submit(); }}
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
      {/* Body */}
      <Spin spinning={loading}>
        {isDetailMode && record ? (
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
                      {/* ── Thông tin cơ bản (1-7) ── */}
                      <div className="chk-detail-grid">
                        <div className="chk-detail-row"><span className="chk-detail-label">Mã đài</span><span className="chk-detail-value">{record.code || '—'}</span></div>
                        <div className="chk-detail-row"><span className="chk-detail-label">Tên đài</span><span className="chk-detail-value">{record.name || '—'}</span></div>
                        <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị quản lý</span><span className="chk-detail-value">{record.orgUnitName || '—'}</span></div>
                        <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị khai thác</span><span className="chk-detail-value">{getOperatingOrgName(record.operatingOrgId, record.operatingOrgName)}</span></div>
                        <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm (Tỉnh/TP)</span><span className="chk-detail-value">{getProvinceNameById(record.provinceId) || '—'}</span></div>
                        <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm chi tiết</span><span className="chk-detail-value">{record.locationDetail || record.locationAddress || '—'}</span></div>
                        <div className="chk-detail-row"><span className="chk-detail-label">Tình trạng</span><span className="chk-detail-value">{renderConditionBadge(record.conditionStatus)}</span></div>
                        <div className="chk-detail-row"><span className="chk-detail-label">Dịch vụ cung cấp</span><span className="chk-detail-value">{renderServicesBadges(record.services)}</span></div>
                      </div>

                      {/* ── Thông tin khác (8-11) ── */}
                      <div style={{ marginTop: 20, marginBottom: 12, paddingTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'inline-block', width: 4, height: 16, borderRadius: 2, backgroundColor: actionPrimary }} />
                        <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Thông tin kỹ thuật & Phụ trợ
                        </span>
                      </div>

                      <div className="chk-detail-grid">
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label">Vùng phủ sóng</span>
                          <span className="chk-detail-value">{record.coverageArea || record.coverageZone || '—'}</span>
                        </div>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label">Tần số liên lạc</span>
                          <span className="chk-detail-value">{record.frequency || '—'}</span>
                        </div>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label">Ghi chú</span>
                          <span className="chk-detail-value">{record.notes || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'gis',
                  label: 'Thông tin vị trí',
                  children: (
                    <DetailTable
                      scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                      dataSource={coordinateList}
                      emptyText="Chưa có tọa độ GPS nào"
                      headerNode={
                        <>
                          <div className="chk-detail-grid" style={{ marginBottom: 12 }}>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label">Loại đối tượng</span>
                              <span className="chk-detail-value">
                                {(() => {
                                  const t = (record?.geometryType || record?.objectType || '').toUpperCase();
                                  if (t === 'LINE') return 'Đối tượng đường';
                                  if (t === 'POLYGON') return 'Đối tượng vùng';
                                  if (coordinateList.length > 2) return 'Đối tượng vùng';
                                  if (coordinateList.length > 1) return 'Đối tượng đường';
                                  return 'Đối tượng điểm';
                                })()}
                              </span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label">Biểu tượng bản đồ</span>
                              <span className="chk-detail-value">
                                {(() => {
                                  const symId = record?.symbolId || record?.symbol;
                                  if (!symId) return '—';
                                  const sym = symbols.find((s) => s.id === symId || s.code === symId || (symId && String(s.id) === String(symId)) || (symId && String(s.code) === String(symId)));
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
                                  return <span>{symId}</span>;
                                })()}
                              </span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label">Hệ quy chiếu</span>
                              <span className="chk-detail-value">{record?.coordinateSystem || 'WGS84'}</span>
                            </div>
                            <div className="chk-detail-row">
                              <span className="chk-detail-label">Quy tắc hiển thị</span>
                              <span className="chk-detail-value">{record?.displayRule || 'Độ, phút, giây (DMS)'}</span>
                            </div>
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
                          width: 60,
                          align: 'center',
                          render: (_: any, __: any, i: number) => i + 1,
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
                {
                  key: 'operationMaintenance',
                  label: 'Vận hành & bảo trì',
                  children: (
                    <Tabs
                      defaultActiveKey="operation"
                      tabBarStyle={{ ...drawerTabBarStyle, marginTop: 0, marginBottom: 12 }}
                      animated={false}
                      items={[
                        {
                          key: 'operation',
                          label: 'Thông tin vận hành khai thác',
                          children: (
                            <DetailTable
                              scrollY="calc(100vh - 378px)"
                              dataSource={operationPlanList}
                              pageSize={20}
                              pageSizeOptions={[20, 50, 100]}
                              emptyText="Chưa có dữ liệu"
                              rowKey={(r: any) => r.id || r.planCode || r.code || Math.random().toString()}
                              columns={[
                                {
                                  title: 'STT',
                                  width: 60,
                                  align: 'center',
                                  render: (_: any, __: any, index: number) => index + 1,
                                },
                                {
                                  title: 'Mã kế hoạch',
                                  dataIndex: 'planCode',
                                  key: 'planCode',
                                  width: 240,
                                  render: (v: string, r: any) => <span style={{ color: textPrimary }}>{v || r.code || '—'}</span>,
                                },
                                {
                                  title: 'Tên kế hoạch',
                                  dataIndex: 'planName',
                                  key: 'planName',
                                  width: 260,
                                  render: (v: string, r: any) => (
                                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }} title={v || r.name}>
                                      {v || r.name || '—'}
                                    </span>
                                  ),
                                },
                                {
                                  title: 'Ngày bắt đầu',
                                  dataIndex: 'startDate',
                                  key: 'startDate',
                                  width: 260,
                                  render: (v: any, r: any) => (
                                    <span style={{ color: textPrimary }}>
                                      {v ? dayjs(v).format('DD/MM/YYYY') : (r.startTime ? dayjs(r.startTime).format('DD/MM/YYYY') : '—')}
                                    </span>
                                  ),
                                },
                                {
                                  title: 'Ngày kết thúc',
                                  dataIndex: 'endDate',
                                  key: 'endDate',
                                  width: 260,
                                  render: (v: any, r: any) => (
                                    <span style={{ color: textPrimary }}>
                                      {v ? dayjs(v).format('DD/MM/YYYY') : (r.endTime ? dayjs(r.endTime).format('DD/MM/YYYY') : '—')}
                                    </span>
                                  ),
                                },
                              ]}
                            />
                          ),
                        },
                        {
                          key: 'maintenance',
                          label: 'Thông tin bảo trì',
                          children: (
                            <DetailTable
                              scrollY="calc(100vh - 378px)"
                              dataSource={maintenancePlanList}
                              pageSize={20}
                              pageSizeOptions={[20, 50, 100]}
                              emptyText="Chưa có dữ liệu"
                              rowKey={(r: any) => r.id || r.planCode || r.code || Math.random().toString()}
                              columns={[
                                {
                                  title: 'STT',
                                  width: 60,
                                  align: 'center',
                                  render: (_: any, __: any, index: number) => index + 1,
                                },
                                {
                                  title: 'Mã kế hoạch',
                                  dataIndex: 'planCode',
                                  key: 'planCode',
                                  width: 240,
                                  render: (v: string, r: any) => <span style={{ color: textPrimary }}>{v || r.code || '—'}</span>,
                                },
                                {
                                  title: 'Tên kế hoạch',
                                  dataIndex: 'planName',
                                  key: 'planName',
                                  width: 260,
                                  render: (v: string, r: any) => (
                                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }} title={v || r.name}>
                                      {v || r.name || '—'}
                                    </span>
                                  ),
                                },
                                {
                                  title: 'Thời gian bắt đầu',
                                  dataIndex: 'startTime',
                                  key: 'startTime',
                                  width: 240,
                                  render: (v: any, r: any) => (
                                    <span style={{ color: textPrimary }}>
                                      {v ? dayjs(v).format('DD/MM/YYYY') : (r.startDate ? dayjs(r.startDate).format('DD/MM/YYYY') : '—')}
                                    </span>
                                  ),
                                },
                                {
                                  title: 'Thời gian kết thúc',
                                  dataIndex: 'endTime',
                                  key: 'endTime',
                                  width: 240,
                                  render: (v: any, r: any) => (
                                    <span style={{ color: textPrimary }}>
                                      {v ? dayjs(v).format('DD/MM/YYYY') : (r.endDate ? dayjs(r.endDate).format('DD/MM/YYYY') : '—')}
                                    </span>
                                  ),
                                },
                              ]}
                            />
                          ),
                        },
                        {
                          key: 'incident',
                          label: 'Thông tin sự cố',
                          children: (
                            <DetailTable
                              scrollY="calc(100vh - 378px)"
                              dataSource={incidentList}
                              pageSize={20}
                              pageSizeOptions={[20, 50, 100]}
                              emptyText="Chưa có dữ liệu"
                              rowKey={(r: any) => r.id || r.incidentCode || r.code || Math.random().toString()}
                              columns={[
                                {
                                  title: 'STT',
                                  width: 60,
                                  align: 'center',
                                  render: (_: any, __: any, index: number) => index + 1,
                                },
                                {
                                  title: 'Mã sự cố',
                                  dataIndex: 'incidentCode',
                                  key: 'incidentCode',
                                  width: 200,
                                  render: (v: string, r: any) => <span style={{ color: textPrimary }}>{v || r.code || '—'}</span>,
                                },
                                {
                                  title: 'Loại sự cố',
                                  dataIndex: 'incidentType',
                                  key: 'incidentType',
                                  width: 220,
                                  render: (v: string, r: any) => <span style={{ color: textPrimary }}>{v || r.type || '—'}</span>,
                                },
                                {
                                  title: 'Địa điểm',
                                  dataIndex: 'location',
                                  key: 'location',
                                  width: 260,
                                  render: (v: string, r: any) => (
                                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }} title={v || r.address}>
                                      {v || r.address || '—'}
                                    </span>
                                  ),
                                },
                                {
                                  title: 'Thời gian',
                                  dataIndex: 'incidentTime',
                                  key: 'incidentTime',
                                  width: 200,
                                  render: (v: any, r: any) => (
                                    <span style={{ color: textPrimary }}>
                                      {v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : (r.time ? dayjs(r.time).format('DD/MM/YYYY HH:mm:ss') : '—')}
                                    </span>
                                  ),
                                },
                              ]}
                            />
                          ),
                        },
                      ]}
                    />
                  ),
                },
                {
                  key: 'handlingTracking',
                  label: 'Xử lý & theo dõi',
                  children: (
                    <div style={drawerFormScrollStyle}>
                      <div className="chk-detail-grid">
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Trạng thái phê duyệt</span>
                          <span className="chk-detail-value">
                            <ApprovalStatusBadge status={record.approvalStatus || 'DRAFT'} />
                          </span>
                        </div>
                        <div style={{ border: 'none' }} />

                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Ngày cập nhật</span>
                          <span className="chk-detail-value">
                            {record.updatedAt || record.createdAt ? dayjs(record.updatedAt || record.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Cán bộ cập nhật</span>
                          <span className="chk-detail-value">{record.updatedByName || record.createdByName || '—'}</span>
                        </div>

                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Ngày gửi phê duyệt</span>
                          <span className="chk-detail-value">
                            {record.submittedAt || record.submittedDate ? dayjs(record.submittedAt || record.submittedDate).format('DD/MM/YYYY HH:mm:ss') : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Cán bộ gửi phê duyệt</span>
                          <span className="chk-detail-value">{record.submittedByName || (!isUuid(record.submittedBy) ? record.submittedBy : null) || '—'}</span>
                        </div>

                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
                          <span className="chk-detail-value">
                            {record.approvedDateLevel1 ? dayjs(record.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
                          <span className="chk-detail-value">
                            {record.approverNameLevel1 || record.approverLevel1Name || (!isUuid(record.approverLevel1) ? record.approverLevel1 : null) || '—'}
                          </span>
                        </div>

                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label">Nội dung phê duyệt</span>
                          <span className="chk-detail-value">
                            {record.approvalContentLevel1 || '—'}
                          </span>
                        </div>

                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Ngày phê duyệt cấp Cục</span>
                          <span className="chk-detail-value">
                            {record.approvedDateLevel2 ? dayjs(record.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Cán bộ phê duyệt cấp Cục</span>
                          <span className="chk-detail-value">
                            {record.approverNameLevel2 || record.approverLevel2Name || (!isUuid(record.approverLevel2) ? record.approverLevel2 : null) || '—'}
                          </span>
                        </div>

                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label">Nội dung phê duyệt</span>
                          <span className="chk-detail-value">
                            {record.approvalContentLevel2 || '—'}
                          </span>
                        </div>

                        {record.rejectionReason && (
                          <div className="chk-detail-row chk-detail-row--full">
                            <span className="chk-detail-label" style={{ color: statusCritical }}>Lý do từ chối</span>
                            <span className="chk-detail-value" style={{ color: statusCritical }}>
                              {record.rejectionReason}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFinish}
              onFinishFailed={({ errorFields }) => {
                focusErrorTab(
                  { errorFields },
                  {
                    general: ['name', 'orgUnitId', 'operatingOrgId', 'provinceId', 'conditionStatus', 'locationDetail', 'services', 'coverageZone', 'frequency', 'notes'],
                    gis: ['geometryType', 'symbol', 'coordinateSystem', 'displayRule'],
                  },
                  setTabKey
                );
              }}
            >
              <style>{requiredMarkStyle}</style>
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
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã đài</span>}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input
                                placeholder="Mã tự sinh"
                                disabled={true}
                                style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="name"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên đài</span>}
                              rules={[{ required: true, message: 'Vui lòng nhập tên đài' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input
                                placeholder="Nhập tên đài"
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
                                organizations={filteredOrgUnits}
                                placeholder="Chọn đơn vị quản lý"
                                style={{ borderRadius: radiusPill, height: 40 }}
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
                                options={DEFAULT_OPERATING_ORGANIZATIONS.map((o) => ({ value: o.id, label: o.name }))}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

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
                                filterOption={(input, option) =>
                                  normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                                }
                                options={VIETNAM_PROVINCE_OPTIONS}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="locationDetail"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                              rules={[{ required: true, message: 'Vui lòng nhập địa điểm chi tiết' }]}
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
                        </Row>

                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item
                              name="conditionStatus"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tình trạng</span>}
                              rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Select options={CONDITION_STATUS_OPTIONS} placeholder="Chọn tình trạng" style={selectStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="services"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Dịch vụ cung cấp</span>}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <ServiceMultiSelect
                                options={INMARSAT_SERVICE_OPTIONS}
                                placeholder="Chọn dịch vụ cung cấp"
                                filterOption={(input, option) =>
                                  normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                                }
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Col span={24}>
                          <div style={{ marginTop: 16, marginBottom: 14, borderTop: `1px solid ${borderDefault}`, paddingTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ display: 'inline-block', width: 4, height: 16, borderRadius: 2, backgroundColor: actionPrimary }} />
                            <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              Thông tin khác
                            </span>
                          </div>
                        </Col>

                        <Row gutter={[24, 0]}>
                          <Col span={24}>
                            <Form.Item
                              name="coverageZone"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Vùng phủ sóng</span>}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input.TextArea placeholder="Nhập vùng phủ sóng" rows={3} maxLength={2000} showCount style={textAreaStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              name="frequency"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tần số liên lạc</span>}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input.TextArea placeholder="Nhập tần số liên lạc" rows={3} maxLength={2000} showCount style={textAreaStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              name="notes"
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                              style={{ marginBottom: 0 }}
                            >
                              <Input.TextArea placeholder="Nhập ghi chú" rows={3} maxLength={2000} showCount style={textAreaStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ),
                  },
                  {
                    key: 'gis',
                    label: 'Thông tin vị trí',
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
                                  allowClear
                                  options={[
                                    { value: 'POINT', label: 'Đối tượng điểm' },
                                    { value: 'LINE', label: 'Đối tượng đường' },
                                    { value: 'POLYGON', label: 'Đối tượng vùng' },
                                  ]}
                                  style={{ ...selectStyle, height: 38 }}
                                  onChange={(val) => {
                                    form.setFieldValue('geometryType', val);
                                    setGeometryTypeState(val || 'POINT');
                                    if (val) {
                                      form.setFieldValue('coordinateSystem', 'WGS 84 / VN-2000');
                                      form.setFieldValue('displayRule', 'Độ, phút, giây (DMS)');
                                      setCoordinateList((prev) => adjustCoordinateListForGeometry(prev, val));
                                    } else {
                                      form.setFieldValue('coordinateSystem', undefined);
                                      form.setFieldValue('displayRule', undefined);
                                      form.setFieldValue('symbol', undefined);
                                      form.setFieldValue('symbolId', undefined);
                                      setCoordinateList([{ latitude: null, longitude: null }]);
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
                                  disabled={!geometryTypeState}
                                  options={symbols.map((sym) => ({
                                    value: sym.id || sym.code,
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
                              {geometryTypeState !== 'POINT' && (
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
                          dataSource={(geometryTypeState === 'POINT' ? coordinateList.slice(0, 1) : coordinateList).map((c, i) => ({ ...c, _idx: i }))}
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
                                const geom = (geometryTypeState || 'POINT').toUpperCase();
                                if (geom === 'POINT') return null;
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
              geometryType: geometryTypeState || 'POINT',
              coordinates: serializeCoordinatesToWkt(coordinateList, geometryTypeState || 'POINT'),
              symbolId: form.getFieldValue('symbol'),
            }}
            defaultGeometryType={(geometryTypeState as any) || 'POINT'}
            onChange={(val) => {
              if (isDetailMode) return;
              if (val.coordinates) {
                const pts = parseWktToCoordinates(val.coordinates);
                setCoordinateList(pts);
              }
              if (val.geometryType) {
                form.setFieldValue('geometryType', val.geometryType);
                setGeometryTypeState(val.geometryType);
              }
            }}
          />
        </div>
      </Modal>
    </Drawer>
  );
};

export default InmarsatStationForm;
