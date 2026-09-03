import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Tabs,
  Space,
  Row,
  Col,
  InputNumber,
  Spin,
  Modal,
  Alert,
} from 'antd';
import {
  EnvironmentOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { focusErrorTab } from '../../utils/formValidationHelper';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import { radarStationCRUD } from '../../services/radarStationService';
import { aisSystemService } from '../../services/aisSystemService';
import type {
  VtsOperationCenterResponse,
  CreateVtsOperationCenterRequest,
  UpdateVtsOperationCenterRequest,
  VtsOperationCenterAttachment,
} from '../../types/vtsOperationCenter';
import { ApprovalStatus, ConditionStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import {
  drawerTitleStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle,
  drawerTabBarStyle, drawerStyles, drawerFormScrollStyle, drawerGisControlBoxStyle, DRAWER_TABLE_SCROLL_Y,
  requiredMarkStyle, spaceFormField, spaceMd, radiusPill, sidebarBg,
  fontWeightBold, fontWeightMedium, fontSizeMd, fontSizeSm, fontSizeLg,
  textPrimary, textSecondary, textTertiary, borderDefault,
  statusCritical, statusAttention, statusOperational, actionPrimary, textAreaStyle,
  readonlyInputStyle, drawerCloseBtnStyle, inputStyle, selectStyle, statusBadgeStyle,
} from '../../themetokenchk';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';

export const DEFAULT_GIS_SYMBOLS = [
  { id: '1', code: 'SYM-VTS', name: 'Trung tâm điều hành VTS', image: '' },
  { id: '2', code: 'SYM-INMARSAT', name: 'Đài thông tin vệ tinh Inmarsat', image: '' },
  { id: '3', code: 'SYM-COASTAL', name: 'Đài thông tin duyên hải', image: '' },
  { id: '4', code: 'SYM-AIS', name: 'Trạm bờ AIS', image: '' },
  { id: '5', code: 'SYM-RADAR', name: 'Trạm Radar hàng hải', image: '' },
  { id: '6', code: 'SYM-BUOY', name: 'Phao báo hiệu hàng hải', image: '' },
  { id: '7', code: 'SYM-BEACON', name: 'Trạm đèn biển (Hải đăng)', image: '' },
  { id: '8', code: 'SYM-PORT', name: 'Cảng biển / Bến cảng', image: '' },
  { id: '9', code: 'SYM-ANCHORAGE', name: 'Khu neo đậu / Đón trả hoa tiêu', image: '' },
];
import { useAuthStore, type AuthState } from '../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { FormOrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../components/org-unit';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { adjustCoordinateListForGeometry } from '../../utils/gisGeometry';

export interface VtsOperationCenterFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: VtsOperationCenterResponse | null;
  mode?: 'create' | 'edit' | 'detail';
  orgUnits?: any[];
  portOptions?: any[];
  vtsSystemOptions?: any[];
  symbols?: any[];
  onCancel?: () => void;
  onSuccess?: () => void;
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

const parseWktToCoordinates = (wkt?: string): { latitude: number; longitude: number }[] => {
  if (!wkt) return [];
  try {
    const upper = wkt.trim().toUpperCase();
    if (upper.startsWith('POINT')) {
      const match = upper.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (match) {
        return [{ longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) }];
      }
    } else if (upper.startsWith('LINESTRING') || upper.startsWith('LINE')) {
      const match = upper.match(/LINESTRING\s*\(([^)]+)\)/i);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { longitude: parseFloat(parts[0]), latitude: parseFloat(parts[1]) };
        });
      }
    } else if (upper.startsWith('POLYGON')) {
      const match = upper.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { longitude: parseFloat(parts[0]), latitude: parseFloat(parts[1]) };
        });
      }
    }
  } catch {}
  return [];
};

const serializeCoordinatesToWkt = (coords: { latitude: number | null; longitude: number | null }[], geomType: string = 'POINT'): string => {
  const valid = coords.filter((c) => c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude));
  if (valid.length === 0) return '';
  if (geomType === 'POINT') {
    return `POINT (${valid[0].longitude} ${valid[0].latitude})`;
  } else if (geomType === 'LINE' || geomType === 'LINESTRING') {
    return `LINESTRING (${valid.map((c) => `${c.longitude} ${c.latitude}`).join(', ')})`;
  } else if (geomType === 'POLYGON') {
    const pts = [...valid];
    if (pts.length >= 3) {
      if (pts[0].latitude !== pts[pts.length - 1].latitude || pts[0].longitude !== pts[pts.length - 1].longitude) {
        pts.push(pts[0]);
      }
    }
    return `POLYGON ((${pts.map((c) => `${c.longitude} ${c.latitude}`).join(', ')}))`;
  }
  return `POINT (${valid[0].longitude} ${valid[0].latitude})`;
};

const renderApprovalBadge = (status?: ApprovalStatus | string) => {
  const map: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Lưu tạm', color: textTertiary },
    PENDING_APPROVAL: { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: statusAttention },
    APPROVED_LEVEL1: { label: 'Chờ phê duyệt cấp Cục', color: '#0284C7' },
    APPROVED: { label: 'Đã phê duyệt', color: statusOperational },
    REJECTED_LEVEL1: { label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
    REJECTED_LEVEL2: { label: 'Từ chối cấp Cục', color: statusCritical },
    ARCHIVED: { label: 'Đã xóa', color: textTertiary },
  };
  const item = map[String(status || '').toUpperCase()] || { label: String(status || '—'), color: textSecondary };
  return (
    <span style={statusBadgeStyle(item.color)}>
      {item.label}
    </span>
  );
};

export const VtsOperationCenterForm: React.FC<VtsOperationCenterFormProps> = ({
  open,
  editId,
  initialData,
  mode = 'create',
  orgUnits = [],
  portOptions: providedPortOptions = [],
  vtsSystemOptions: providedVtsSystemOptions = [],
  symbols: providedSymbols = [],
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [currentMode, setCurrentMode] = useState<'create' | 'edit' | 'detail'>(mode);
  const [tabKey, setTabKey] = useState<string>('general');
  const [detailTabKey, setDetailTabKey] = useState<string>('general');
  const [record, setRecord] = useState<VtsOperationCenterResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('draft');

  const [portOptions, setPortOptions] = useState<any[]>(providedPortOptions);
  const [vtsSystemOptions, setVtsSystemOptions] = useState<any[]>(providedVtsSystemOptions);
  const [symbols, setSymbols] = useState<any[]>(providedSymbols);
  const [coordinateList, setCoordinateList] = useState<{ latitude: number | null; longitude: number | null }[]>([]);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<VtsOperationCenterAttachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<{ id: string; fileName: string }[]>([]);

  const [otherInfraTypeFilter, setOtherInfraTypeFilter] = useState<string>('RADAR_STATION');
  const [otherInfraPage, setOtherInfraPage] = useState<number>(1);
  const [otherInfraPageSize, setOtherInfraPageSize] = useState<number>(20);
  const [otherInfraTotal, setOtherInfraTotal] = useState<number>(0);
  const [otherInfraList, setOtherInfraList] = useState<Array<{ id: string; type: string; typeLabel: string; name: string; code?: string }>>([]);
  const [otherInfraLoading, setOtherInfraLoading] = useState(false);
  const [otherInfraError, setOtherInfraError] = useState<string | null>(null);
  // These related modules do not expose a confirmed API contract yet. Keep
  // their sources empty until the corresponding backend endpoints exist.
  const operationPlanList: Array<Record<string, unknown>> = [];
  const maintenancePlanList: Array<Record<string, unknown>> = [];
  const incidentList: Array<Record<string, unknown>> = [];

  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const isDetailMode = currentMode === 'detail';
  const isCreateMode = currentMode === 'create';
  const isEditMode = currentMode === 'edit';

  const [geometryTypeState, setGeometryTypeState] = useState<string>('POINT');

  const attachmentsEditable = isCreateMode ||
    record?.approvalStatus === ApprovalStatus.DRAFT ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2 ||
    (record?.approvalStatus === ApprovalStatus.APPROVED && (hasPerm('vtsoperationcenter:approvec2') || hasPerm('vts:approvec2')));

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
    const newAttachment: VtsOperationCenterAttachment = {
      id: tempId,
      fileName: file.name,
      fileSize: file.size,
      uploadedByName: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
      uploadedBy: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
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
    if (String(attId).startsWith('temp_') || pendingFiles.some((f) => (f as any)._tempId === attId)) {
      setPendingFiles((prev) => prev.filter((f) => (f as any)._tempId !== attId && f.name !== attId));
    } else if (targetAtt) {
      setPendingDeletedAttachments((prev) => [...prev, { id: attId, fileName: targetAtt.fileName }]);
    }
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
    toast.success('Đã xóa tệp đính kèm');
  };

  const handleDownloadAttachment = async (attId: string, fileName?: string) => {
    if (String(attId).startsWith('temp_')) {
      const localFile = pendingFiles.find((f) => (f as any)._tempId === attId);
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
      await vtsOperationCenterService.downloadAttachment(targetId, attId, fileName);
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
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

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    if (open) {
      if (providedPortOptions.length > 0) setPortOptions(providedPortOptions);
      else portCRUD.getOptions().then((res) => setPortOptions(Array.isArray(res) ? res : [])).catch(() => {});
      if (providedVtsSystemOptions.length > 0) setVtsSystemOptions(providedVtsSystemOptions);
      else vtsSystemCRUD.getOptions().then((res) => setVtsSystemOptions(Array.isArray(res) ? res : [])).catch(() => {});
      if (providedSymbols.length > 0) {
        setSymbols(providedSymbols);
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
    }
  }, [open, providedPortOptions, providedVtsSystemOptions, providedSymbols]);

  useEffect(() => {
    if (!open) return;
    setTabKey('general');
    setDetailTabKey('general');
    setOtherInfraTypeFilter('RADAR_STATION');
    setOtherInfraPage(1);
    setOtherInfraPageSize(20);
    setOtherInfraTotal(0);
    setOtherInfraList([]);
    setOtherInfraError(null);
    setPendingFiles([]);
    setPendingDeletedAttachments([]);

    if (editId) {
      if (initialData) {
        setRecord(initialData);
        const pts = parseWktToCoordinates(initialData.coordinates);
        const geom = initialData.geometryType || 'POINT';
        setGeometryTypeState(geom);
        setCoordinateList(adjustCoordinateListForGeometry(pts, geom));
        form.setFieldsValue({
          code: initialData.code,
          name: initialData.name,
          orgUnitId: initialData.orgUnitId,
          portId: initialData.portId,
          vtsSystemId: initialData.vtsSystemId,
          provinceId: initialData.provinceId != null ? String(initialData.provinceId) : undefined,
          detailedLocation: initialData.detailedLocation,
          coverage: initialData.coverage,
          conditionStatus: initialData.conditionStatus || ConditionStatus.OPERATIONAL,
          note: initialData.note,
          geometryType: geom,
          symbolId: initialData.symbolId,
          coordinateSystem: (initialData as any).coordinateSystem || 'WGS 84 / VN-2000',
          displayRule: (initialData as any).displayRule || 'Độ, phút, giây (DMS)',
        });
      }
      setIsLoading(true);
      vtsOperationCenterService.getById(editId).then((res) => {
        setRecord(res);
        setAttachments(res.attachments || []);
        const pts = parseWktToCoordinates(res.coordinates);
        const geom = res.geometryType || 'POINT';
        setGeometryTypeState(geom);
        setCoordinateList(adjustCoordinateListForGeometry(pts, geom));
        form.setFieldsValue({
          code: res.code,
          name: res.name,
          orgUnitId: res.orgUnitId,
          portId: res.portId,
          vtsSystemId: res.vtsSystemId,
          provinceId: res.provinceId != null ? String(res.provinceId) : undefined,
          detailedLocation: res.detailedLocation,
          coverage: res.coverage,
          conditionStatus: res.conditionStatus || ConditionStatus.OPERATIONAL,
          note: res.note,
          geometryType: geom,
          symbolId: res.symbolId,
          coordinateSystem: (res as any).coordinateSystem || 'WGS 84 / VN-2000',
          displayRule: (res as any).displayRule || 'Độ, phút, giây (DMS)',
        });
      }).catch(() => {
        toast.error('Không thể tải chi tiết');
      }).finally(() => {
        setIsLoading(false);
      });
    } else if (isCreateMode) {
      setRecord(null);
      setAttachments([]);
      setCoordinateList([{ latitude: null, longitude: null }]);
      setGeometryTypeState('POINT');
      form.resetFields();
      vtsOperationCenterService.generateCode().then((res) => {
        form.setFieldsValue({
          code: res.code || 'TT-VTS-AUTO',
          conditionStatus: ConditionStatus.OPERATIONAL,
          geometryType: 'POINT',
          coordinateSystem: 'WGS 84 / VN-2000',
          displayRule: 'Độ, phút, giây (DMS)',
        });
      }).catch(() => {
        form.setFieldsValue({
          code: undefined,
          conditionStatus: ConditionStatus.OPERATIONAL,
          geometryType: 'POINT',
          coordinateSystem: 'WGS 84 / VN-2000',
          displayRule: 'Độ, phút, giây (DMS)',
        });
      });
    }
  }, [open, editId, isCreateMode, form]);

  useEffect(() => {
    if (!open || !isDetailMode || detailTabKey !== 'infrastructure' || !record?.id) return;
    let cancelled = false;
    setOtherInfraLoading(true);
    setOtherInfraError(null);

    const fetchInfra = async () => {
      try {
        if (otherInfraTypeFilter === 'RADAR_STATION') {
          const res = await radarStationCRUD.searchPaged({
            vtsOperationCenterId: record.id,
            page: otherInfraPage,
            size: otherInfraPageSize,
          });
          if (cancelled) return;
          const items = (res.items || []).map((item: any) => ({
            id: String(item.id),
            type: 'RADAR_STATION',
            typeLabel: 'Trạm Radar VTS',
            code: item.code,
            name: item.name || item.stationName || item.code || String(item.id),
          }));
          setOtherInfraList(items);
          setOtherInfraTotal(res.total || items.length);
        } else if (otherInfraTypeFilter === 'AIS_SYSTEM') {
          const res = await aisSystemService.search({
            vtsOperationCenterId: record.id,
            page: otherInfraPage,
            size: otherInfraPageSize,
          });
          if (cancelled) return;
          const items = (res.items || []).map((item: any) => ({
            id: String(item.id),
            type: 'AIS_SYSTEM',
            typeLabel: 'Trạm AIS / Hệ thống AIS',
            code: item.code,
            name: item.name || item.systemName || item.code || String(item.id),
          }));
          setOtherInfraList(items);
          setOtherInfraTotal(res.total || items.length);
        } else {
          // Các loại KCHT con chưa có API liên kết với TTĐH VTS: tạm thời chưa gọi API
          setOtherInfraList([]);
          setOtherInfraTotal(0);
        }
      } catch (err: any) {
        if (cancelled) return;
        setOtherInfraList([]);
        setOtherInfraTotal(0);
        setOtherInfraError('Không tải được danh sách kết cấu hạ tầng.');
      } finally {
        if (!cancelled) setOtherInfraLoading(false);
      }
    };

    fetchInfra();
    return () => { cancelled = true; };
  }, [open, isDetailMode, detailTabKey, record?.id, otherInfraTypeFilter, otherInfraPage, otherInfraPageSize]);

  const selectedOrgUnitId = Form.useWatch('orgUnitId', form);
  const effectiveOrgUnitId = selectedOrgUnitId || record?.orgUnitId;

  const filteredPortOptions = useMemo(() => {
    let list = portOptions;
    if (effectiveOrgUnitId) {
      const allowedIds = resolveOrgSubtreeIds(orgUnits, effectiveOrgUnitId);
      list = list.filter((p) => !p.orgUnitId || allowedIds.has(String(p.orgUnitId)) || p.id === record?.portId);
    }
    if (record?.portId && !list.some((p) => p.id === record.portId)) {
      list = [{ id: record.portId, portName: record.portName || record.portId, portCode: (record as any).portCode }, ...list];
    }
    return list;
  }, [portOptions, effectiveOrgUnitId, orgUnits, record?.portId, record?.portName]);

  const filteredVtsSystemOptions = useMemo(() => {
    let list = vtsSystemOptions;
    if (effectiveOrgUnitId) {
      const allowedIds = resolveOrgSubtreeIds(orgUnits, effectiveOrgUnitId);
      list = list.filter((v) => !v.orgUnitId || allowedIds.has(String(v.orgUnitId)) || v.id === record?.vtsSystemId);
    }
    if (record?.vtsSystemId && !list.some((v) => v.id === record.vtsSystemId)) {
      list = [{ id: record.vtsSystemId, name: record.vtsSystemName || record.vtsSystemId, code: (record as any).vtsSystemCode }, ...list];
    }
    return list;
  }, [vtsSystemOptions, effectiveOrgUnitId, orgUnits, record?.vtsSystemId, record?.vtsSystemName]);

  const handleFinish = async (values: any) => {
    const act = actionTypeRef.current;
    setIsSubmitting(true);
    let attachmentPartialFailure = false;
    try {
      const wkt = serializeCoordinatesToWkt(coordinateList, values.geometryType || 'POINT');
      const payload: CreateVtsOperationCenterRequest = {
        code: values.code?.trim(),
        name: values.name?.trim(),
        orgUnitId: values.orgUnitId,
        portId: values.portId,
        vtsSystemId: values.vtsSystemId,
        provinceId: values.provinceId != null ? Number(values.provinceId) : 1,
        detailedLocation: values.detailedLocation?.trim(),
        coverage: values.coverage?.trim(),
        conditionStatus: values.conditionStatus,
        note: values.note?.trim(),
        geometryType: values.geometryType || 'POINT',
        symbolId: values.symbolId,
        coordinates: wkt || undefined,
        coordinateSystem: values.coordinateSystem,
        displayRule: values.displayRule,
      };

      if (isCreateMode) {
        const created = await vtsOperationCenterService.create(payload);
        if (created?.id && pendingFiles.length > 0) {
          try {
            await vtsOperationCenterService.uploadAttachments(created.id, pendingFiles);
          } catch {
            attachmentPartialFailure = true;
          }
        }
        if (act === 'submit' && created?.id) {
          await vtsOperationCenterService.submit(created.id);
        } else if (act === 'approve' && created?.id) {
          await vtsOperationCenterService.submit(created.id);
          await vtsOperationCenterService.approveC2(created.id, 'APPROVED', 'Lưu và phê duyệt trực tiếp');
        }
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
        toast[attachmentPartialFailure ? 'warning' : 'success'](
          attachmentPartialFailure
            ? 'Đã tạo trung tâm nhưng một số tệp đính kèm chưa được tải lên'
            : 'Thêm mới thành công',
        );
      } else if (editId) {
        await vtsOperationCenterService.update(editId, payload as UpdateVtsOperationCenterRequest);
        if (pendingDeletedAttachments.length > 0) {
          const deletionResults = await Promise.allSettled(
            pendingDeletedAttachments.map((a) => vtsOperationCenterService.deleteAttachment(editId, a.id)),
          );
          if (deletionResults.some((result) => result.status === 'rejected')) attachmentPartialFailure = true;
        }
        if (pendingFiles.length > 0) {
          const uploadResults = await Promise.allSettled([
            vtsOperationCenterService.uploadAttachments(editId, pendingFiles),
          ]);
          if (uploadResults.some((result) => result.status === 'rejected')) attachmentPartialFailure = true;
        }
        if (act === 'submit' && (record?.approvalStatus === ApprovalStatus.DRAFT || record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2)) {
          await vtsOperationCenterService.submit(editId);
        }
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
        toast[attachmentPartialFailure ? 'warning' : 'success'](
          attachmentPartialFailure
            ? 'Đã lưu thông tin nhưng một số tệp đính kèm chưa được xử lý'
            : 'Cập nhật thành công',
        );
      }
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render Detail View ──────────────────────────────────────────
  const renderDetailContent = () => {
    if (!record) return null;

    return (
      <Tabs
        activeKey={detailTabKey}
        onChange={setDetailTabKey}
        tabBarStyle={drawerTabBarStyle}
        animated={false}
        items={([
          {
            key: 'general',
            label: 'Thông tin chung',
            children: (
              <div style={drawerFormScrollStyle}>
                <div className="chk-detail-grid">
                  <div className="chk-detail-row"><span className="chk-detail-label">Mã trung tâm điều hành VTS</span><span className="chk-detail-value">{record.code || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Tên trung tâm điều hành VTS</span><span className="chk-detail-value">{record.name || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị quản lý</span><span className="chk-detail-value">{record.orgUnitName || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Thuộc cảng biển</span><span className="chk-detail-value">{record.portName || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Thuộc hệ thống VTS</span><span className="chk-detail-value">{record.vtsSystemName || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm (Tỉnh/TP)</span><span className="chk-detail-value">{record.provinceName || getProvinceNameById(record.provinceId) || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm chi tiết</span><span className="chk-detail-value">{record.detailedLocation || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Tình trạng</span><span className="chk-detail-value">{renderConditionBadge(record.conditionStatus)}</span></div>
                </div>

                <div style={{ marginTop: 20, marginBottom: 12, borderTop: `1px solid ${borderDefault}`, paddingTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 4, height: 16, borderRadius: 2, backgroundColor: actionPrimary }} />
                  <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Thông tin khác
                  </span>
                </div>

                <div className="chk-detail-grid">
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label">Vùng phủ sóng</span>
                    <span className="chk-detail-value">{record.coverage || '—'}</span>
                  </div>
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label">Ghi chú</span>
                    <span className="chk-detail-value">{record.note || '—'}</span>
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
                      <div className="chk-detail-row"><span className="chk-detail-label">Loại đối tượng</span><span className="chk-detail-value">{record?.geometryType === 'LINE' ? 'Đối tượng đường' : record?.geometryType === 'POLYGON' ? 'Đối tượng vùng' : 'Đối tượng điểm'}</span></div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Biểu tượng bản đồ</span>
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
                                <span>{(record as any)?.symbolName || (record?.symbolId ? `Biểu tượng (${record.symbolId})` : 'Trung tâm điều hành VTS')}</span>
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
                  { title: 'STT', width: 60, align: 'center', render: (_: any, __: any, i: number) => i + 1 },
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
            key: 'infrastructure',
            label: 'Kết cấu hạ tầng',
            children: (
              <div>
                {otherInfraError && (
                  <Alert
                    type="warning"
                    showIcon
                    message={otherInfraError}
                    style={{ marginBottom: spaceMd }}
                  />
                )}
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: fontWeightBold, color: sidebarBg, fontSize: fontSizeMd }}>
                    Loại kết cấu hạ tầng:
                  </span>
                  <Select
                    showSearch
                    value={otherInfraTypeFilter}
                    onChange={(val) => {
                      setOtherInfraTypeFilter(val);
                      setOtherInfraPage(1);
                    }}
                    filterOption={(input, option) =>
                      normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                    }
                    options={[
                      { value: 'AIS_SYSTEM', label: 'Hệ thống AIS' },
                      { value: 'CCTV', label: 'Hệ thống CCTV' },
                      { value: 'VTS_ASSIST', label: 'Hệ thống phụ trợ VTS' },
                      { value: 'RADAR_STATION', label: 'Trạm Radar' },
                      { value: 'SCADA', label: 'Hệ thống SCADA' },
                      { value: 'TRANSMISSION', label: 'Hệ thống truyền dẫn' },
                      { value: 'VHF', label: 'Hệ thống thông tin liên lạc VHF' },
                    ]}
                    style={{ ...selectStyle, width: 280, height: 38 }}
                  />
                </div>
                <DetailTable
                  scrollY="calc(100vh - 378px)"
                  dataSource={otherInfraList}
                  total={otherInfraTotal}
                  pageSize={otherInfraPageSize}
                  currentPage={otherInfraPage}
                  onPageChange={(page, size) => {
                    setOtherInfraPage(page);
                    if (size) setOtherInfraPageSize(size);
                  }}
                  loading={otherInfraLoading}
                  emptyText={otherInfraLoading ? 'Đang tải dữ liệu KCHT...' : 'Chưa có kết cấu hạ tầng thuộc loại này'}
                  rowKey={(r: any) => r.id || `${r.type}-${r.code || r.name}`}
                  columns={[
                    {
                      title: 'STT',
                      width: 60,
                      align: 'center',
                      render: (_: any, __: any, index: number) => (otherInfraPage - 1) * otherInfraPageSize + index + 1,
                    },
                    {
                      title: 'Loại đối tượng',
                      dataIndex: 'typeLabel',
                      key: 'typeLabel',
                      width: 240,
                      render: (v: string) => (
                        <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>
                          {v || '—'}
                        </span>
                      ),
                    },
                    {
                      title: 'Tên kết cấu hạ tầng',
                      dataIndex: 'name',
                      key: 'name',
                      render: (v: string) => (
                        <span
                          style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: textPrimary }}
                          title={v}
                        >
                          {v || '—'}
                        </span>
                      ),
                    },
                  ]}
                />
              </div>
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
            key: 'handlingAndTracking',
            label: 'Xử lý & theo dõi',
            children: (
              <div style={drawerFormScrollStyle}>
                <div className="chk-detail-grid">
                  {/* 31. Trạng thái */}
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Trạng thái</span>
                    <span className="chk-detail-value">{renderApprovalBadge(record.approvalStatus)}</span>
                  </div>
                  <div style={{ border: 'none' }} />

                  {/* 32. Ngày cập nhật & 33. Cán bộ cập nhật */}
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Ngày cập nhật</span>
                    <span className="chk-detail-value">
                      {record.updatedDate || record.updatedAt
                        ? dayjs(record.updatedDate || record.updatedAt).format('DD/MM/YYYY HH:mm:ss')
                        : record.createdAt
                        ? dayjs(record.createdAt).format('DD/MM/YYYY HH:mm:ss')
                        : '—'}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Cán bộ cập nhật</span>
                    <span className="chk-detail-value">{record.updatedByName || record.createdByName || '—'}</span>
                  </div>

                  {/* 34. Ngày gửi phê duyệt & 35. Cán bộ gửi phê duyệt */}
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Ngày gửi phê duyệt</span>
                    <span className="chk-detail-value">
                      {record.submittedDate || record.submittedAt ? dayjs(record.submittedDate || record.submittedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Cán bộ gửi phê duyệt</span>
                    <span className="chk-detail-value">{record.submittedByName || record.createdByName || '—'}</span>
                  </div>

                  {/* 36. Ngày phê duyệt cấp Cảng vụ/Chi cục & 37. Cán bộ phê duyệt cấp Cảng vụ/Chi cục */}
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
                    <span className="chk-detail-value">
                      {record.approvedDateLevel1 ? dayjs(record.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—'}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
                    <span className="chk-detail-value">
                      {record.approverLevel1Name || record.approverLevel1 || '—'}
                    </span>
                  </div>

                  {/* 38. Nội dung phê duyệt */}
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label">Nội dung phê duyệt</span>
                    <span className="chk-detail-value">
                      {record.approvalContentLevel1 || record.approvalReasonLevel1 || '—'}
                    </span>
                  </div>

                  {/* 39. Ngày phê duyệt cấp Cục & 40. Cán bộ phê duyệt cấp Cục */}
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Ngày phê duyệt cấp Cục</span>
                    <span className="chk-detail-value">
                      {record.approvedDateLevel2 ? dayjs(record.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—'}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Cán bộ phê duyệt cấp Cục</span>
                    <span className="chk-detail-value">
                      {record.approverLevel2Name || record.approverLevel2 || '—'}
                    </span>
                  </div>

                  {/* 41. Nội dung phê duyệt */}
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label">Nội dung phê duyệt</span>
                    <span className="chk-detail-value">
                      {record.approvalContentLevel2 || record.approvalReasonLevel2 || '—'}
                    </span>
                  </div>

                  {record.rejectionReason && (
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label">Lý do từ chối</span>
                      <span className="chk-detail-value" style={{ color: statusCritical }}>
                        {record.rejectionReason}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
        ] as any[]).filter((item) => item.key !== 'operationMaintenance')}
      />
    );
  };

  return (
    <Drawer
      rootClassName="vtssystemchk-theme-scope"
      width="50%"
      placement="right"
      closable={false}
      open={open}
      onClose={onCancel}
      styles={drawerStyles}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={drawerTitleStyle}>
            {isDetailMode
              ? (record?.name ? `Xem chi tiết — ${record.name}` : 'Xem chi tiết Trung tâm điều hành VTS')
              : isCreateMode
                ? 'Thêm mới Trung tâm điều hành VTS'
                : (record?.name ? `Chỉnh sửa — ${record.name}` : 'Chỉnh sửa Trung tâm điều hành VTS')}
          </span>
          <Button
            type="text"
            onClick={onCancel}
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
                {hasPerm('vtsoperationcenter:approvec2') && (
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
                <Button onClick={onCancel} style={outlineButtonStyle}>Hủy</Button>
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
                    'code',
                    'name',
                    'orgUnitId',
                    'portId',
                    'vtsSystemId',
                    'provinceId',
                    'detailedLocation',
                    'conditionStatus',
                    'coverage',
                    'note',
                  ],
                  gis: [
                    'geometryType',
                    'symbolId',
                    'coordinateSystem',
                    'displayRule',
                  ],
                },
                setTabKey
              );
            }}
            autoComplete="off"
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
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã trung tâm điều hành VTS</span>}
                            name="code"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Mã tự sinh" disabled={true} style={inputStyle} />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên trung tâm điều hành VTS</span>}
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng nhập tên trung tâm điều hành VTS' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Nhập tên trung tâm điều hành VTS..." maxLength={255} showCount style={inputStyle} />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị quản lý</span>}
                            name="orgUnitId"
                            rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <FormOrgUnitTreeSelect
                              organizations={orgUnits}
                              placeholder="Chọn đơn vị quản lý"
                              disabled={isEditMode}
                              allowClear
                              onChange={(val) => {
                                form.setFieldsValue({ orgUnitId: val, portId: undefined, vtsSystemId: undefined });
                              }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thuộc cảng biển</span>}
                            name="portId"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn cảng biển"
                              allowClear
                              showSearch
                              filterOption={(input, option) => normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))}
                              options={filteredPortOptions.map((p) => ({
                                value: p.id,
                                label: p.portCode ? `${p.portCode} - ${p.portName}` : (p.portName || p.id),
                              }))}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thuộc hệ thống VTS</span>}
                            name="vtsSystemId"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn hệ thống VTS"
                              allowClear
                              showSearch
                              filterOption={(input, option) => normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))}
                              options={filteredVtsSystemOptions.map((v) => ({
                                value: v.id,
                                label: v.code ? `${v.code} - ${v.systemName || v.name}` : (v.systemName || v.name || v.id),
                              }))}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm (Tỉnh/TP)</span>}
                            name="provinceId"
                            rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn địa điểm"
                              allowClear
                              showSearch
                              filterOption={(input, option) => normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))}
                              options={VIETNAM_PROVINCE_OPTIONS}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                            name="detailedLocation"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Nhập địa điểm chi tiết..." maxLength={500} showCount style={inputStyle} />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tình trạng</span>}
                            name="conditionStatus"
                            rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select placeholder="Chọn tình trạng" options={CONDITION_STATUS_OPTIONS} style={selectStyle} />
                          </Form.Item>
                        </Col>

                        <Col span={24}>
                          <div style={{ marginTop: 16, marginBottom: 14, borderTop: `1px solid ${borderDefault}`, paddingTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ display: 'inline-block', width: 4, height: 16, borderRadius: 2, backgroundColor: actionPrimary }} />
                            <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              Thông tin khác
                            </span>
                          </div>
                        </Col>

                        <Col span={24}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Vùng phủ sóng</span>}
                            name="coverage"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea placeholder="Mô tả phạm vi hoặc vùng phủ sóng của trung tâm điều hành VTS" rows={3} maxLength={2000} showCount style={textAreaStyle} />
                          </Form.Item>
                        </Col>

                        <Col span={24}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                            name="note"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea placeholder="Nhập ghi chú thêm nếu có..." rows={3} maxLength={2000} showCount style={textAreaStyle} />
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
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Loại đối tượng</span>}
                              name="geometryType"
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
                                    form.setFieldValue('symbolId', undefined);
                                    setCoordinateList([{ latitude: null, longitude: null }]);
                                  }
                                }}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Biểu tượng</span>}
                              name="symbolId"
                              style={{ marginBottom: 0 }}
                            >
                              <Select
                                placeholder="Chọn biểu tượng bản đồ"
                                allowClear
                                disabled={!geometryTypeState}
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
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Hệ quy chiếu</span>}
                              name="coordinateSystem"
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
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Quy tắc hiển thị</span>}
                              name="displayRule"
                              initialValue="Độ, phút, giây (DMS)"
                              style={{ marginBottom: 0 }}
                            >
                              <Input
                                disabled
                                style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 38 }}
                              />
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
              symbolId: form.getFieldValue('symbolId'),
            }}
            defaultGeometryType={(geometryTypeState as any) || 'POINT'}
            onChange={(val) => {
              if (isDetailMode) return;
              if (val?.coordinates) {
                const pts = parseWktToCoordinates(val.coordinates);
                if (pts.length > 0) setCoordinateList(pts);
              }
              if (val?.geometryType) {
                form.setFieldValue('geometryType', val.geometryType);
                setGeometryTypeState(val.geometryType);
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

export default VtsOperationCenterForm;
