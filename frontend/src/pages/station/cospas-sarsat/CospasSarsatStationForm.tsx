import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Tabs,
  Space,
  Row,
  Col,
  Modal,
} from 'antd';
import InputNumber from '../../../components/shared/LocalizedInputNumber';
import {
  EnvironmentOutlined,
  FileTextOutlined,
  BankOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import toast from '../../../components/ToastNotification';
import { focusErrorTab } from '../../../utils/formValidationHelper';
import { cospasSarsatStationService } from '../../../services/cospasSarsatStationService';
import { organizationService } from '../../../services/organizationService';
import { symbolService } from '../../../services/symbolService';
import type {
  CoastalStationCospasSarsatResponse,
  CoastalStationCospasSarsatRequest,
} from '../../../services/station/types';
import { CONDITION_STATUS_OPTIONS } from '../../../types/vtsSystem';
import {
  drawerTitleStyle, primaryButtonStyle, outlineButtonStyle,
  drawerTabBarStyle, drawerFormScrollStyle, DRAWER_TABLE_SCROLL_Y, DRAWER_WIDTH,
  requiredMarkStyle, spaceFormField, radiusPill, sidebarBg,
  fontWeightBold, fontSizeMd, fontSizeSm, fontSizeLg,
  textTertiary, borderDefault,
  statusOperational, statusCritical, actionPrimary,
  readonlyInputStyle, inputStyle, selectStyle, spaceSm, spaceXs,
  textAreaStyle,
} from '../../../themetokenchk';
import { checkCanSaveAndApprove, isCucLevelUser } from '../../../hooks/useKchtPermissions';
import { fmtInputNumber } from '../../../utils/numFmt';
import { VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import AppDrawer from '../../../components/shared/AppDrawer';
import { useAuthStore, type AuthState } from '../../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../../store/permissionStore';
import { FormOrgUnitTreeSelect, normalizeSearchText, resolveDefaultFormOrgUnitId } from '../../../components/org-unit';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import DetailTable from '../../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../../components/shared/InfrastructureAttachmentTab';
import ServiceMultiSelect from '../../../components/shared/ServiceMultiSelect';
import GisLocationSelector from '../../../components/gis/GisLocationSelector';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import {
  GEOMETRY_POINT_COUNT,
  validateDmsCoordinates,
  serializeCoordinatesToWkt,
  parseWktToCoordinates,
  ddToDms,
  dmsToDd,
} from '../../../utils/gisGeometry';
import CospasSarsatStationDetailContent, {
  COSPAS_SERVICE_OPTIONS,
} from './CospasSarsatStationDetailContent';

export interface CospasSarsatStationFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: CoastalStationCospasSarsatResponse | null;
  mode?: 'create' | 'edit' | 'detail' | 'view';
  orgUnits?: any[];
  symbols?: any[];
  onCancel?: () => void;
  onSuccess?: () => void;
  onClose?: () => void;
  onEdit?: (record: CoastalStationCospasSarsatResponse) => void;
}

export function resolveFormProvinceId(
  provinceId?: number | string | null,
  provinceName?: string | null
): string | undefined {
  if (provinceId != null && String(provinceId).trim() !== '') {
    return String(provinceId);
  }
  if (provinceName) {
    const p = VIETNAM_PROVINCE_OPTIONS.find((opt) => opt.label.toLowerCase() === provinceName.toLowerCase());
    if (p) return String(p.value);
  }
  return undefined;
}

export function resolveCospasGeometryType(
  geometryType?: string | null,
  wkt?: string | null
): 'POINT' | 'LINE' | 'POLYGON' {
  const w = (wkt || '').toUpperCase();
  if (w.includes('POLYGON')) return 'POLYGON';
  if (w.includes('LINESTRING') || w.includes('LINE')) return 'LINE';
  const g = (geometryType || '').toUpperCase();
  if (g.includes('POLYGON') || g.includes('VÙNG')) return 'POLYGON';
  if (g.includes('LINE') || g.includes('ĐƯỜNG')) return 'LINE';
  return 'POINT';
}

export function generateStationCode(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SARSAT-${rand}`;
}

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

interface DmsPoint {
  latD: number | null;
  latM: number | null;
  latS: number | null;
  lngD: number | null;
  lngM: number | null;
  lngS: number | null;
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

  const inputRow = (
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
  );

  const messageRow = hasError ? (
    <div aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%', maxWidth: 360, margin: `${spaceXs}px auto 0 auto`, minWidth: 0, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width, textAlign: 'center' }}>
          {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minWidth: 0 }}>
      {inputRow}
      {messageRow}
    </div>
  );
};

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

export default function CospasSarsatStationForm(props: CospasSarsatStationFormProps) {
  const {
    open = false,
    editId = null,
    initialData = null,
    mode = 'create',
    orgUnits: propOrgUnits,
    symbols: propSymbols,
    onCancel,
    onSuccess,
    onClose,
    onEdit,
  } = props;

  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const [recordData, setRecordData] = useState<CoastalStationCospasSarsatResponse | null>(initialData);
  const lastLoadedKeyRef = useRef<string | null>(null);
  const lastGeometryTypeRef = useRef<string | undefined>(undefined);

  const [symbols, setSymbols] = useState<any[]>(propSymbols || []);
  const [coordinateList, setCoordinateList] = useState<DmsPoint[]>([]);
  const watchedGeometryType = Form.useWatch('geometryType', form);
  const hasCoordinates = coordinateList.some((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null));
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const clearGpsPoint = (i: number) => {
    setCoordinateList((p) => {
      const next = [...p];
      if (!next[i]) return p;
      next[i] = { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null };
      return next;
    });
    setGpsError(null);
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
    setCoordinateList((prev) => {
      const next = [...prev];
      if (next[i]) {
        next[i] = {
          ...next[i],
          [field === 'lat' ? 'latD' : 'lngD']: dVal,
          [field === 'lat' ? 'latM' : 'lngM']: mVal,
          [field === 'lat' ? 'latS' : 'lngS']: sVal,
        };
      }
      return next;
    });
    setGpsError(null);
  };

  const handleGeometryTypeChange = (val: string | undefined) => {
    form.setFieldValue('geometryType', val);
    if (!val) {
      form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined, symbolId: undefined });
      setCoordinateList([]);
      setGpsError(null);
      return;
    }
    form.setFieldsValue({
      coordinateSystem: 1,
      displayRule: 'Độ, phút, giây (DMS)',
    });
    const count = GEOMETRY_POINT_COUNT[val] ?? 1;
    setCoordinateList((prev) => {
      if (!prev || prev.length === 0) {
        return Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      }
      if (val === 'POINT' && prev.length > 1) {
        return [prev[0]];
      }
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      }
      return prev;
    });
    setGpsError(null);
  };

  useEffect(() => {
    const symId = recordData?.symbolId || (initialData as any)?.symbolId;
    if (symId && !symbols.some((s: any) => String(s.id) === String(symId))) {
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
  }, [recordData?.symbolId, initialData, symbols]);

  const isView = mode === 'detail' || mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const authStoreUser = useAuthStore((s: AuthState) => s.user);
  const user = authStoreUser || useAuthStore.getState().user;
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  // User permission level (chuẩn VTS / Inmarsat)
  const isAdmin = hasPerm('*') || hasPerm('admin:all');
  const canApproveL2 = checkCanSaveAndApprove('coastalstationcospassarsat', hasPerm, user) || (isAdmin && isCucLevelUser(user));

  // Attachments state & queues chuẩn VTS
  const initialAttachments = useMemo(() => {
    if (Array.isArray(initialData?.attachments)) return initialData.attachments;
    if (Array.isArray(initialData?.files)) return initialData.files;
    return [];
  }, [initialData]);
  const [attachments, setAttachments] = useState<any[]>(initialAttachments);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<{ id: string; fileName: string }[]>([]);

  const attachmentsEditable = isCreate ||
    recordData?.approvalStatus === 'DRAFT' ||
    recordData?.approvalStatus === 'REJECTED_LEVEL1' ||
    recordData?.approvalStatus === 'REJECTED_LEVEL2' ||
    (recordData?.approvalStatus === 'APPROVED' && canApproveL2);

  const handleUploadAttachment = async (file: File) => {
    if (!isCreate && !attachmentsEditable) {
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
    const newAttachment: any = {
      id: tempId,
      fileName: file.name,
      fileSize: file.size,
      uploadedByName: user?.fullName || user?.username || 'Cán bộ quản lý',
      uploadedBy: user?.fullName || user?.username || 'Cán bộ quản lý',
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
    if (!isCreate && !attachmentsEditable) {
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
    const localFile = pendingFiles.find((f) => (f as any)._tempId === attId || f.name === fileName || (f as any).name === fileName);
    if (localFile) {
      const url = URL.createObjectURL(localFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || localFile.name;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const targetAtt = attachments.find((a) => a.id === attId || a.fileName === fileName);
    const rawFile = (targetAtt as any)?.originFileObj || (targetAtt as any)?.file;
    if (rawFile) {
      const url = URL.createObjectURL(rawFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || rawFile.name;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (String(attId).startsWith('temp_') || String(attId).startsWith('temp-')) {
      toast.info('Tệp đính kèm mới tải lên, hãy lưu hồ sơ trước khi tải xuống từ máy chủ');
      return;
    }

    const targetId = recordData?.id || editId;
    if (!targetId) return;
    try {
      await cospasSarsatStationService.downloadAttachment(targetId, attId, fileName);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast.error('Tệp đính kèm không tồn tại trên máy chủ lưu trữ');
      } else {
        toast.error(err?.message || 'Không thể tải xuống tệp đính kèm');
      }
    }
  };

  // Chuẩn hóa danh mục đơn vị quản lý (effectiveOrgUnits)
  const [internalOrgUnits, setInternalOrgUnits] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      if (propOrgUnits && propOrgUnits.length > 0) {
        setInternalOrgUnits(propOrgUnits);
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
  }, [open, propOrgUnits]);

  const effectiveOrgUnits = useMemo(() => {
    const source = (propOrgUnits && propOrgUnits.length > 0) ? propOrgUnits : internalOrgUnits;
    const mapped = (source || []).map((o: any) => ({
      id: String(o.id),
      name: o.name || o.unitName || o.tenDonVi || 'Đơn vị',
      code: o.code || o.maDonVi,
      parentId: o.parentId ? String(o.parentId) : undefined,
    }));
    const curUnitId = recordData?.unitId || recordData?.orgUnitId || (initialData as any)?.unitId || (initialData as any)?.orgUnitId;
    const curUnitName = recordData?.orgUnitName || (recordData as any)?.unitName || (initialData as any)?.orgUnitName || (initialData as any)?.unitName;
    if (curUnitId && !mapped.some((o: any) => String(o.id) === String(curUnitId))) {
      mapped.push({
        id: String(curUnitId),
        name: (curUnitName && !/^[0-9a-fA-F-]{36}$/.test(curUnitName)) ? curUnitName : 'Đơn vị quản lý',
        code: '',
        parentId: undefined,
      });
    }
    return mapped;
  }, [propOrgUnits, internalOrgUnits, recordData, initialData]);

  // Chuẩn hóa danh mục đơn vị khai thác
  const operatingUnitOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    const seen = new Set<string>();

    if (Array.isArray(effectiveOrgUnits)) {
      effectiveOrgUnits.forEach((o: any) => {
        if (o.id && !seen.has(String(o.id))) {
          seen.add(String(o.id));
          list.push({
            value: String(o.id),
            label: o.code ? `${o.code} - ${o.name}` : o.name,
          });
        }
      });
    }

    if (Array.isArray(DEFAULT_OPERATING_ORGANIZATIONS)) {
      DEFAULT_OPERATING_ORGANIZATIONS.forEach((o) => {
        if (o.id && !seen.has(String(o.id))) {
          seen.add(String(o.id));
          list.push({
            value: String(o.id),
            label: o.code ? `${o.code} - ${o.name}` : o.name,
          });
        }
      });
    }

    const curOpId = recordData?.operatingOrgId || (initialData as any)?.operatingOrgId;
    const curOpName = (recordData as any)?.operatingOrgName || (initialData as any)?.operatingOrgName;
    if (curOpId && !seen.has(String(curOpId))) {
      seen.add(String(curOpId));
      list.push({
        value: String(curOpId),
        label: (curOpName && !/^[0-9a-fA-F-]{36}$/.test(curOpName)) ? curOpName : 'Đơn vị khai thác',
      });
    }

    return list;
  }, [effectiveOrgUnits, recordData, initialData]);

  // Load danh mục symbols nếu chưa có
  useEffect(() => {
    if (!open || (propSymbols && propSymbols.length > 0)) return;
    symbolService.getOptions().then((data) => {
      if (Array.isArray(data)) setSymbols(data);
    }).catch(() => {});
  }, [open, propSymbols]);

  const populateFormFromRecord = (rec: CoastalStationCospasSarsatResponse) => {
    const geom = resolveCospasGeometryType(rec.geometryType, rec.wktGeometry || (rec as any).coordinates);
    // Hydrate GIS atomically: the geometry effect is only for a user changing
    // the object type, never for padding coordinates that already came from WKT.
    lastGeometryTypeRef.current = geom;
    form.setFieldsValue({
      stationCode: rec.stationCode || rec.code,
      stationName: rec.stationName || rec.name,
      unitId: rec.unitId || rec.orgUnitId,
      operatingOrgId: rec.operatingOrgId,
      provinceId: resolveFormProvinceId(rec.provinceId),
      locationAddress: rec.locationAddress,
      conditionStatus: rec.conditionStatus || 'NOT_YET_OPERATIONAL',
      coverageArea: rec.coverageArea,
      services: rec.services,
      frequency: rec.frequency,
      description: rec.description || rec.note,
      geometryType: geom,
      symbolId: rec.symbolId ? String(rec.symbolId) : undefined,
      coordinateSystem: geom ? (rec.coordinateSystem === 'VN-2000' || (rec as any).coordinateSystem === 2 ? 2 : 1) : undefined,
      displayRule: geom ? (rec.displayRule || 'Độ, phút, giây (DMS)') : undefined,
    });

    // GIS Parse
    const wkt = rec.wktGeometry || (typeof (rec as any).coordinates === 'string' ? (rec as any).coordinates : '');
    if (wkt) {
      const parsed = parseWktToCoordinates(wkt);
      if (parsed.length > 0) {
        setCoordinateList(parsed.map(p => {
          const latDms = ddToDms(p.latitude);
          const lngDms = ddToDms(p.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        }));
      } else if (rec.latitude && rec.longitude) {
        const latDms = ddToDms(rec.latitude);
        const lngDms = ddToDms(rec.longitude);
        setCoordinateList([{ latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s }]);
      }
    } else if (rec.latitude && rec.longitude) {
      const latDms = ddToDms(rec.latitude);
      const lngDms = ddToDms(rec.longitude);
      setCoordinateList([{ latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s }]);
    } else {
      setCoordinateList([]);
    }

    const rawAtts = Array.isArray(rec.attachments) ? rec.attachments : (Array.isArray(rec.files) ? rec.files : []);
    setAttachments(rawAtts);
    setPendingFiles([]);
    setPendingDeletedAttachments([]);
  };

  // Load record data khi mở Drawer
  useEffect(() => {
    if (!open) {
      lastLoadedKeyRef.current = null;
      return;
    }
    const currentKey = isCreate ? 'create' : (editId || (initialData?.id ? String(initialData.id) : null));
    if (!currentKey) return;
    if (lastLoadedKeyRef.current === currentKey) return;
    lastLoadedKeyRef.current = currentKey;

    if (isCreate) {
      form.resetFields();
      const defaultUnitId = resolveDefaultFormOrgUnitId(user, effectiveOrgUnits);
      const initialCode = generateStationCode();
      form.setFieldsValue({
        stationCode: initialCode,
        conditionStatus: 'NOT_YET_OPERATIONAL',
        geometryType: undefined,
        coordinateSystem: undefined,
        displayRule: undefined,
        unitId: defaultUnitId,
      });
      cospasSarsatStationService.generateCode()
        .then((code) => {
          if (code) {
            form.setFieldsValue({ stationCode: code });
          }
        })
        .catch(() => {});
      setCoordinateList([]);
      setGpsError(null);
      setAttachments([]);
      setPendingFiles([]);
      setPendingDeletedAttachments([]);
      setRecordData(null);
      setActiveTab('info');
    } else if (editId) {
      if (initialData) {
        setRecordData(initialData);
      }
      // A list row is only a summary and can carry stale/incomplete GIS data.
      // Do not render its coordinate count before the detail endpoint responds.
      form.resetFields();
      lastGeometryTypeRef.current = undefined;
      setCoordinateList([]);
      setGpsError(null);
      setLoading(true);
      cospasSarsatStationService.getById(editId)
        .then((res) => {
          setRecordData(res);
          populateFormFromRecord(res);
        })
        .catch((err) => {
          toast.error(err.message || 'Không tải được dữ liệu đài');
        })
        .finally(() => setLoading(false));
    } else if (initialData) {
      setRecordData(initialData);
      populateFormFromRecord(initialData);
    }
  }, [open, editId, isCreate, initialData]);

  useEffect(() => {
    if (isCreate && open && effectiveOrgUnits && effectiveOrgUnits.length > 0) {
      const currentVal = form.getFieldValue('unitId');
      if (!currentVal || currentVal === '00000000-0000-0000-0000-000000000017' || currentVal === 'G17') {
        const defOrgId = resolveDefaultFormOrgUnitId(user, effectiveOrgUnits);
        if (defOrgId) {
          form.setFieldValue('unitId', defOrgId);
        }
      }
    }
  }, [isCreate, open, effectiveOrgUnits, user, form]);

  const handleClose = () => {
    onCancel?.();
    onClose?.();
  };

  const handleSave = async (action: 'DRAFT' | 'SUBMIT' | 'APPROVE' = 'DRAFT') => {
    try {
      const values = await form.validateFields();
      let wkt: string | undefined = undefined;
      let firstLat: number | undefined = undefined;
      let firstLng: number | undefined = undefined;

      const currentGeometryType = values.geometryType ?? form.getFieldValue('geometryType') ?? recordData?.geometryType;
      const currentSymbolId = values.symbolId !== undefined
        ? values.symbolId
        : (form.getFieldValue('symbolId') ?? recordData?.symbolId);

      if (currentGeometryType || coordinateList.length > 0) {
        const coordResult = validateDmsCoordinates(coordinateList, currentGeometryType);
        if (!coordResult.valid) {
          const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
          toast.error(errMsg);
          setGpsError(errMsg);
          setActiveTab('gis');
          return;
        }
        wkt = serializeCoordinatesToWkt(coordResult.validCoords, currentGeometryType || 'POINT');
        if (coordResult.validCoords.length > 0) {
          firstLat = coordResult.validCoords[0].latitude;
          firstLng = coordResult.validCoords[0].longitude;
        }
      }

      setSubmitting(true);
      setActionType(action.toLowerCase() as any);

      const payload: CoastalStationCospasSarsatRequest = {
        ...values,
        stationCode: values.stationCode?.trim(),
        stationName: values.stationName?.trim(),
        locationAddress: values.locationAddress?.trim(),
        coverageArea: values.coverageArea?.trim(),
        frequency: values.frequency?.trim(),
        description: values.description?.trim(),
        geometryType: currentGeometryType ?? null,
        symbolId: currentSymbolId ?? null,
        coordinateSystem: values.coordinateSystem === 2 ? 'VN-2000' : 'WGS-84',
        displayRule: values.displayRule || 'Độ, phút, giây (DMS)',
        latitude: firstLat,
        longitude: firstLng,
        wktGeometry: wkt,
        // API accepts WKT. Sending the DMS-derived point array here made
        // Jackson reject a valid GIS save before it could read wktGeometry.
        coordinates: wkt,
      };
      const isApprovedRecord = String(recordData?.approvalStatus || '').toUpperCase() === 'APPROVED';

      if (isCreate) {
        const created = await cospasSarsatStationService.create(payload);
        const targetId = created?.id;
        if (targetId && pendingFiles.length > 0) {
          try {
            await cospasSarsatStationService.uploadAttachments(targetId, pendingFiles);
          } catch (uploadErr) {
            console.error('Failed to upload attachments on create:', uploadErr);
            toast.warning('Đài đã được lưu nhưng một số tệp đính kèm chưa được tải lên máy chủ.');
          }
        }
        if (targetId && action === 'SUBMIT') {
          await cospasSarsatStationService.submit(targetId);
        } else if (targetId && action === 'APPROVE') {
          await cospasSarsatStationService.submit(targetId);
          await cospasSarsatStationService.approveLevel1(targetId).catch(() => undefined);
          await cospasSarsatStationService.approveLevel2(targetId);
        }
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
        toast.success(
          action === 'SUBMIT'
            ? 'Tạo mới và gửi phê duyệt đài Cospas-Sarsat thành công!'
            : action === 'APPROVE'
            ? 'Tạo mới và phê duyệt đài Cospas-Sarsat thành công!'
            : 'Lưu tạm đài Cospas-Sarsat thành công!'
        );
      } else if (editId) {
        await cospasSarsatStationService.update(editId, payload);
        if (pendingDeletedAttachments.length > 0) {
          await Promise.allSettled(
            pendingDeletedAttachments.map((att) =>
              cospasSarsatStationService.deleteAttachment(editId, att.id)
            )
          );
        }
        if (pendingFiles.length > 0) {
          await cospasSarsatStationService.uploadAttachments(editId, pendingFiles);
        }
        if (action === 'SUBMIT') {
          await cospasSarsatStationService.submit(editId);
        } else if (action === 'APPROVE' && !isApprovedRecord) {
          if (String(recordData?.approvalStatus || '').toUpperCase() === 'APPROVED_LEVEL1') {
            await cospasSarsatStationService.approveLevel2(editId);
          } else {
            await cospasSarsatStationService.submit(editId);
            await cospasSarsatStationService.approveLevel1(editId).catch(() => undefined);
            await cospasSarsatStationService.approveLevel2(editId);
          }
        }
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
        toast.success('Cập nhật đài Cospas-Sarsat thành công!');
      }

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      if (err.errorFields) {
        focusErrorTab(err.errorFields, setActiveTab);
      } else {
        toast.error(err.message || 'Lỗi khi lưu đài Cospas-Sarsat');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render Footer Buttons chuẩn VTS / LRIT
  const renderFooter = () => {
    if (isView) {
      return null;
    }

    const isApprovedRecord = String(recordData?.approvalStatus || '').toUpperCase() === 'APPROVED';

    if (isCreate) {
      return (
        <>
          <Button
            style={{ ...outlineButtonStyle, borderRadius: radiusPill, borderColor: actionPrimary, color: actionPrimary }}
            loading={submitting && actionType === 'draft'}
            onClick={() => handleSave('DRAFT')}
          >
            Lưu tạm
          </Button>
          <Button
            type="primary"
            style={{ ...primaryButtonStyle, borderRadius: radiusPill }}
            loading={submitting && actionType === 'submit'}
            onClick={() => handleSave('SUBMIT')}
          >
            Lưu và gửi phê duyệt
          </Button>
          {canApproveL2 && (
            <Button
              style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational, borderRadius: radiusPill }}
              loading={submitting && actionType === 'approve'}
              onClick={() => handleSave('APPROVE')}
            >
              Lưu và phê duyệt
            </Button>
          )}
        </>
      );
    }

    if (isEdit) {
      if (isApprovedRecord && canApproveL2) {
        return (
          <>
            <Button
              style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational, borderRadius: radiusPill }}
              loading={submitting && actionType === 'approve'}
              onClick={() => handleSave('APPROVE')}
            >
              Lưu và phê duyệt
            </Button>
          </>
        );
      }

      return (
        <>
          <Button
            style={{ ...outlineButtonStyle, borderRadius: radiusPill, borderColor: actionPrimary, color: actionPrimary }}
            loading={submitting && actionType === 'draft'}
            onClick={() => handleSave('DRAFT')}
          >
            Lưu tạm
          </Button>
          <Button
            type="primary"
            style={{ ...primaryButtonStyle, borderRadius: radiusPill }}
            loading={submitting && actionType === 'submit'}
            onClick={() => handleSave('SUBMIT')}
          >
            Lưu và gửi phê duyệt
          </Button>
          {canApproveL2 && (
            <Button
              style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational, borderRadius: radiusPill }}
              loading={submitting && actionType === 'approve'}
              onClick={() => handleSave('APPROVE')}
            >
              Lưu và phê duyệt
            </Button>
          )}
        </>
      );
    }

    return null;
  };

  const currentRecord = recordData || initialData;
  const stationDisplayName = currentRecord?.stationName || currentRecord?.name;

  return (
    <AppDrawer
      open={open}
      onClose={handleClose}
      width={DRAWER_WIDTH}
      title={
        <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
          {isView
            ? (stationDisplayName ? `Chi tiết đài Cospas-Sarsat - ${stationDisplayName}` : 'Chi tiết đài Cospas-Sarsat')
            : isEdit
            ? (stationDisplayName ? `Chỉnh sửa đài Cospas-Sarsat - ${stationDisplayName}` : 'Chỉnh sửa đài Cospas-Sarsat')
            : 'Thêm mới đài Cospas-Sarsat'}
        </span>
      }
      extra={
        isView && currentRecord && (
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              style={{ ...primaryButtonStyle, borderRadius: radiusPill }}
              onClick={() => onEdit?.(currentRecord)}
            >
              Chỉnh sửa
            </Button>
          </Space>
        )
      }
      footer={renderFooter()}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '0 24px 12px 24px', overflow: isView ? 'hidden' : undefined },
      }}
      rootClassName="cospas-sarsat-drawer-scope"
    >
      {loading && !currentRecord ? (
        <div style={{ padding: 32 }}>
          <LoadingSkeleton />
        </div>
      ) : isView && currentRecord ? (
        <CospasSarsatStationDetailContent
          id={currentRecord.id}
          initialData={currentRecord}
          orgUnits={effectiveOrgUnits}
          symbols={symbols}
          onClose={handleClose}
          onEdit={onEdit}
        />
      ) : (
        <Form form={form} layout="vertical" initialValues={{ conditionStatus: 'NOT_YET_OPERATIONAL' }}>
          <style>{`
            ${requiredMarkStyle}
            .cospas-sarsat-drawer-scope,
            .cospas-sarsat-drawer-scope .ant-drawer-content,
            .cospas-sarsat-drawer-scope .ant-tabs-tab,
            .cospas-sarsat-drawer-scope .chk-detail-label,
            .cospas-sarsat-drawer-scope .chk-detail-value,
            .cospas-sarsat-drawer-scope .ant-table,
            .cospas-sarsat-drawer-scope .ant-table-cell,
            .cospas-sarsat-drawer-scope .ant-table-thead > tr > th,
            .cospas-sarsat-drawer-scope .ant-btn,
            .cospas-sarsat-drawer-scope .ant-select,
            .cospas-sarsat-drawer-scope .ant-input,
            .cospas-sarsat-drawer-scope .ant-form-item-label > label {
              font-size: 13.5px !important;
            }
          `}</style>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            destroyInactiveTabPane={false}
            tabBarStyle={drawerTabBarStyle}
            animated={false}
            items={[
              {
                key: 'info',
                label: 'Thông tin chung',
                forceRender: true,
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

                      {/* Hàng 1: Mã đài & Tên đài */}
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã đài</span>}
                            name="stationCode"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Mã tự sinh" disabled={true} style={readonlyInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên đài</span>}
                            name="stationName"
                            rules={[
                              { required: true, message: 'Vui lòng nhập tên đài Cospas-Sarsat' },
                              { max: 255, message: 'Tên đài tối đa 255 ký tự' },
                            ]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập tên đài"
                              maxLength={255}
                              showCount
                              autoFocus
                              style={inputStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* Hàng 2: Đơn vị quản lý & Đơn vị khai thác */}
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị quản lý</span>}
                            name="unitId"
                            rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <FormOrgUnitTreeSelect
                              organizations={effectiveOrgUnits}
                              placeholder="Chọn đơn vị quản lý"
                              disabled={isEdit}
                              allowClear
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị khai thác</span>}
                            name="operatingOrgId"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn đơn vị khai thác"
                              allowClear
                              showSearch
                              filterOption={(input, option) =>
                                normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                              }
                              options={operatingUnitOptions}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* Hàng 3: Địa điểm (Tỉnh/TP) & Tình trạng */}
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm (Tỉnh/TP)</span>}
                            name="provinceId"
                            rules={[{ required: true, message: 'Vui lòng chọn Tỉnh/Thành phố' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn địa điểm"
                              allowClear
                              showSearch
                              filterOption={(input, option) =>
                                normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                              }
                              options={VIETNAM_PROVINCE_OPTIONS}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tình trạng</span>}
                            name="conditionStatus"
                            rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              options={CONDITION_STATUS_OPTIONS}
                              placeholder="Chọn tình trạng"
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* Hàng 4: Địa điểm chi tiết & Dịch vụ cung cấp */}
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                            name="locationAddress"
                            rules={[{ required: true, message: 'Vui lòng nhập địa điểm chi tiết' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập địa điểm chi tiết"
                              maxLength={500}
                              showCount
                              style={inputStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Dịch vụ cung cấp</span>}
                            name="services"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <ServiceMultiSelect
                              options={COSPAS_SERVICE_OPTIONS}
                              placeholder="Chọn các dịch vụ cung cấp"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    {/* ── Section 2: Phạm vi phủ sóng & Thông số kỹ thuật ── */}
                    <div style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <FileTextOutlined style={{ color: actionPrimary }} />
                          <span>Phạm vi phủ sóng & Thông số kỹ thuật</span>
                        </div>
                      </div>
                      <Row gutter={[24, 0]}>
                        <Col span={24}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Vùng phủ sóng</span>}
                            name="coverageArea"
                            rules={[{ max: 2000, message: 'Vùng phủ sóng không được vượt quá 2000 ký tự' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea
                              placeholder="Nhập vùng phủ sóng"
                              rows={3}
                              maxLength={2000}
                              showCount
                              style={textAreaStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tần số</span>}
                            name="frequency"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập tần số"
                              maxLength={255}
                              showCount
                              style={inputStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                            name="description"
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
                key: 'gis',
                label: `Thông tin vị trí (${coordinateList.length})`,
                forceRender: true,
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
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Loại đối tượng</span>}
                            name="geometryType"
                            required={hasCoordinates}
                            rules={hasCoordinates ? [{ required: true, message: 'Loại đối tượng là bắt buộc khi có tọa độ' }] : []}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn loại đối tượng"
                              allowClear
                              options={GEOMETRY_TYPE_OPTIONS}
                              style={selectStyle}
                              onChange={handleGeometryTypeChange}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Biểu tượng</span>}
                            name="symbolId"
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
                                label: sym.code ? `${sym.name} (${sym.code})` : (sym.name || sym.id),
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
                              labelRender={(p) => {
                                const sym = symbols.find((s: any) => String(s.id) === String(p.value));
                                return (
                                  <Space style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    {sym?.image && (
                                      <img
                                        src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                                        alt=""
                                        style={{ width: 18, height: 18, objectFit: 'contain' }}
                                      />
                                    )}
                                    <span>{p.label}</span>
                                  </Space>
                                );
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Hệ quy chiếu</span>}
                            name="coordinateSystem"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn hệ quy chiếu"
                              disabled
                              options={COORD_SYS_OPTIONS}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Quy tắc hiển thị</span>}
                            name="displayRule"
                            style={{ marginBottom: spaceFormField }}
                          >
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
                            render: (_v: any, record: any) => {
                              const isPoint = watchedGeometryType === 'POINT';
                              const minPoints = isPoint ? 1 : watchedGeometryType === 'LINE' ? 2 : 3;
                              const canDelete = coordinateList.length > minPoints;

                              if (isPoint) {
                                const hasValue =
                                  record.latD != null ||
                                  record.latM != null ||
                                  record.latS != null ||
                                  record.lngD != null ||
                                  record.lngM != null ||
                                  record.lngS != null;
                                return (
                                  <Button
                                    type="text"
                                    disabled={!hasValue}
                                    icon={<DeleteOutlined style={{ fontSize: 16, color: hasValue ? statusCritical : undefined }} />}
                                    onClick={() => clearGpsPoint(record._idx)}
                                    style={{
                                      width: 32,
                                      height: 32,
                                      padding: 0,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title={hasValue ? 'Xóa trắng giá trị tọa độ' : 'Chưa có dữ liệu'}
                                  />
                                );
                              }

                              return (
                                <Button
                                  type="text"
                                  danger={canDelete}
                                  disabled={!canDelete}
                                  icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                                  onClick={() => canDelete && removeCoordinate(record._idx)}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title={
                                    !canDelete
                                      ? watchedGeometryType === 'LINE'
                                        ? 'Đối tượng đường phải có tối thiểu 2 tọa độ'
                                        : 'Đối tượng vùng phải có tối thiểu 3 tọa độ'
                                      : 'Xóa tọa độ'
                                  }
                                />
                              );
                            },
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
                forceRender: true,
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

      {/* Modal Chọn vị trí GIS trên bản đồ */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: sidebarBg, fontSize: fontSizeLg }}>
              {isView ? 'Xem vị trí trên bản đồ chuyên dụng' : 'Chọn vị trí & tọa độ trên bản đồ chuyên dụng'}
            </span>
          </div>
        }
        open={mapModalOpen}
        onCancel={() => setMapModalOpen(false)}
        destroyOnHidden
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={
          isView ? null : [
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
            disabled={isView}
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
              if (isView) return;
              if (val?.coordinates) {
                const points = parseWktToCoordinates(val.coordinates);
                if (points.length > 0) {
                  const geom = ((val?.geometryType || watchedGeometryType || 'POINT') as string).toUpperCase();
                  const newPoints = points.map((p) => {
                    const latDms = ddToDms(p.latitude);
                    const lngDms = ddToDms(p.longitude);
                    return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
                  });

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
}
