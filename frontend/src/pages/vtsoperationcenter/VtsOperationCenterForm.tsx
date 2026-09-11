import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
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
} from 'antd';
import {
  EnvironmentOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  BankOutlined,
} from '@ant-design/icons';
import toast from '../../components/ToastNotification';
import { focusErrorTab } from '../../utils/formValidationHelper';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import type {
  VtsOperationCenterResponse,
  CreateVtsOperationCenterRequest,
  UpdateVtsOperationCenterRequest,
  VtsOperationCenterAttachment,
} from '../../types/vtsOperationCenter';
import { ApprovalStatus, ConditionStatus, CONDITION_STATUS_OPTIONS } from '../../types/vtsSystem';
import {
  drawerTitleStyle, primaryButtonStyle, outlineButtonStyle,
  drawerTabBarStyle, drawerFormScrollStyle, DRAWER_TABLE_SCROLL_Y,
  requiredMarkStyle, spaceFormField, radiusPill, radiusMd, sidebarBg,
  fontWeightBold, fontWeightMedium, fontSizeMd, fontSizeSm, fontSizeLg,
  textSecondary, textTertiary, borderDefault,
  statusCritical, statusOperational, actionPrimary,
  readonlyInputStyle, surfaceCard, spaceSm, spaceXs,
  textAreaStyle,
} from '../../themetokenchk';
import { fmtInputNumber } from '../../utils/numFmt';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import AppDrawer from '../../components/shared/AppDrawer';

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
import LoadingSkeleton from '../../components/LoadingSkeleton';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import {
  GEOMETRY_POINT_COUNT,
  validateDmsCoordinates,
  serializeCoordinatesToWkt,
  parseWktToCoordinates,
  ddToDms,
  dmsToDd,
} from '../../utils/gisGeometry';
import VtsOperationCenterDetailContent from './VtsOperationCenterDetailContent';

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

const labelProps = (text: string) => ({
  label: <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

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

interface DmsPoint {
  latD: number | null;
  latM: number | null;
  latS: number | null;
  lngD: number | null;
  lngM: number | null;
  lngS: number | null;
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
  const [record, setRecord] = useState<VtsOperationCenterResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(editId));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('draft');

  const [portOptions, setPortOptions] = useState<any[]>(providedPortOptions);
  const [vtsSystemOptions, setVtsSystemOptions] = useState<any[]>(providedVtsSystemOptions);
  const [symbols, setSymbols] = useState<any[]>(providedSymbols);
  const [coordinateList, setCoordinateList] = useState<DmsPoint[]>([]);
  const watchedGeometryType = Form.useWatch('geometryType', form);
  const hasCoordinates = coordinateList.some((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null));
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<VtsOperationCenterAttachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<{ id: string; fileName: string }[]>([]);

  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);
  const userUnitType = currentUser?.unitType || '';
  const isAdmin = (currentUser as any)?.role === 'SUPER_ADMIN' || (currentUser as any)?.role === 'ADMIN' || (currentUser as any)?.roleName === 'SUPER_ADMIN' || (currentUser as any)?.roleName === 'ADMIN';
  const isCucLevel = (currentUser as any)?.orgUnitLevel === 1 || !userUnitType || userUnitType === 'CHUYEN_VIEN_CUC' || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CUC' || userUnitType === 'CUC_HANG_HAI' || isAdmin;
  const canSaveAndApprove = hasPerm('vtsoperationcenter:approvec2') || hasPerm('vts:approvec2') || hasPerm('data:approvec2') || hasPerm('data:approve') || isCucLevel;

  const isDetailMode = currentMode === 'detail';
  const isCreateMode = currentMode === 'create';
  const isEditMode = currentMode === 'edit';

  const [geometryTypeState, setGeometryTypeState] = useState<string | undefined>(undefined);

  const attachmentsEditable = isCreateMode ||
    record?.approvalStatus === ApprovalStatus.DRAFT ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2 ||
    (record?.approvalStatus === ApprovalStatus.APPROVED && canSaveAndApprove);

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
    // 1. Kiểm tra trong danh sách tệp chờ lưu
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

    // 2. Kiểm tra trong danh sách attachment hiện tại có chứa tệp cục bộ
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

    // 3. Nếu là tệp mới thêm tạm thời
    if (String(attId).startsWith('temp_') || String(attId).startsWith('temp-')) {
      toast.info('Tệp đính kèm mới tải lên, hãy lưu hồ sơ trước khi tải xuống từ máy chủ');
      return;
    }

    // 4. Tải từ máy chủ
    const targetId = record?.id || editId;
    if (!targetId) return;
    try {
      await vtsOperationCenterService.downloadAttachment(targetId, attId, fileName);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast.error('Tệp đính kèm không tồn tại trên máy chủ lưu trữ');
      } else {
        toast.error(err?.message || 'Không thể tải xuống tệp đính kèm');
      }
    }
  };

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
    setPendingFiles([]);
    setPendingDeletedAttachments([]);

    if (editId) {
      if (initialData) {
        setRecord(initialData);
        const pts = parseWktToCoordinates(initialData.coordinates);
        const geom = initialData.geometryType || undefined;
        setGeometryTypeState(geom);
        setCoordinateList(pts.map((c) => {
          const latDms = ddToDms(c.latitude);
          const lngDms = ddToDms(c.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        }));
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
          coordinateSystem: geom ? (typeof (initialData as any).coordinateSystem === 'number' ? (initialData as any).coordinateSystem : 1) : undefined,
          displayRule: geom ? ((initialData as any).displayRule || 'Độ, phút, giây (DMS)') : undefined,
        });
      }
      setIsLoading(true);
      vtsOperationCenterService.getById(editId).then((res) => {
        setRecord(res);
        setAttachments(res.attachments || []);
        const pts = parseWktToCoordinates(res.coordinates);
        const geom = res.geometryType || undefined;
        setGeometryTypeState(geom);
        setCoordinateList(pts.map((c) => {
          const latDms = ddToDms(c.latitude);
          const lngDms = ddToDms(c.longitude);
          return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
        }));
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
          coordinateSystem: geom ? (typeof (res as any).coordinateSystem === 'number' ? (res as any).coordinateSystem : 1) : undefined,
          displayRule: geom ? ((res as any).displayRule || 'Độ, phút, giây (DMS)') : undefined,
        });
      }).catch(() => {
        toast.error('Không thể tải chi tiết');
      }).finally(() => {
        setIsLoading(false);
      });
    } else if (isCreateMode) {
      setRecord(null);
      setAttachments([]);
      setCoordinateList([]);
      setGeometryTypeState(undefined);
      setGpsError(null);
      form.resetFields();
      vtsOperationCenterService.generateCode().then((res) => {
        form.setFieldsValue({
          code: res.code || 'TT-VTS-AUTO',
          conditionStatus: ConditionStatus.OPERATIONAL,
          geometryType: undefined,
          coordinateSystem: undefined,
          displayRule: undefined,
        });
      }).catch(() => {
        form.setFieldsValue({
          code: undefined,
          conditionStatus: ConditionStatus.OPERATIONAL,
          geometryType: undefined,
          coordinateSystem: undefined,
          displayRule: undefined,
        });
      });
    }
  }, [open, editId, isCreateMode, form]);

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

  useEffect(() => {
    setGeometryTypeState(watchedGeometryType);
    if (!watchedGeometryType) {
      form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined, symbolId: undefined });
      setCoordinateList([]);
      setGpsError(null);
      return;
    }
    form.setFieldsValue({
      coordinateSystem: 1,
      displayRule: 'Độ, phút, giây (DMS)',
    });
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
      let wkt: string | undefined = undefined;
      if (values.geometryType || coordinateList.length > 0) {
        const coordResult = validateDmsCoordinates(coordinateList, values.geometryType);
        if (!coordResult.valid) {
          const errMsg = coordResult.errorMessage || 'Tọa độ GPS không hợp lệ';
          toast.error(errMsg);
          setGpsError(errMsg);
          setTabKey('gis');
          setIsSubmitting(false);
          return;
        }
        wkt = serializeCoordinatesToWkt(coordResult.validCoords, values.geometryType || 'POINT');
      }

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
        geometryType: values.geometryType || undefined,
        symbolId: values.symbolId || undefined,
        coordinates: wkt || undefined,
        coordinateSystem: values.coordinateSystem || undefined,
        displayRule: values.displayRule || undefined,
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
          await vtsOperationCenterService.approveC1(created.id, 'APPROVED', 'Cấp Cục phê duyệt trực tiếp').catch(() => {});
          await vtsOperationCenterService.approveC2(created.id, 'APPROVED', 'Lưu và phê duyệt trực tiếp');
        }
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
        const createSuccessMsg =
          act === 'draft'
            ? 'Lưu tạm thành công'
            : act === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : act === 'approve'
                ? 'Lưu và phê duyệt thành công'
                : 'Thêm mới thành công';
        toast[attachmentPartialFailure ? 'warning' : 'success'](
          attachmentPartialFailure
            ? 'Đã tạo trung tâm nhưng một số tệp đính kèm chưa được tải lên'
            : createSuccessMsg,
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
        const isAlreadyApproved =
          record?.approvalStatus === ApprovalStatus.APPROVED ||
          (record?.approvalStatus as string) === 'APPROVED_LEVEL2';

        if (act === 'submit') {
          await vtsOperationCenterService.submit(editId);
        } else if (act === 'approve') {
          if (!isAlreadyApproved) {
            if (record?.approvalStatus === ApprovalStatus.APPROVED_LEVEL1) {
              await vtsOperationCenterService.approveC2(editId, 'APPROVED', 'Lưu và phê duyệt trực tiếp');
            } else {
              await vtsOperationCenterService.submit(editId);
              await vtsOperationCenterService.approveC1(editId, 'APPROVED', 'Cấp Cục phê duyệt trực tiếp').catch(() => {});
              await vtsOperationCenterService.approveC2(editId, 'APPROVED', 'Lưu và phê duyệt trực tiếp');
            }
          }
        }
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
        const editSuccessMsg =
          act === 'draft'
            ? 'Lưu tạm thành công'
            : act === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : act === 'approve'
                ? 'Lưu và phê duyệt thành công'
                : 'Cập nhật thành công';
        toast[attachmentPartialFailure ? 'warning' : 'success'](
          attachmentPartialFailure
            ? 'Đã lưu thông tin nhưng một số tệp đính kèm chưa được xử lý'
            : editSuccessMsg,
        );
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
      rootClassName="vts-drawer-scope vts-opcenter-drawer-scope berth-drawer-scope"
      className="vts-drawer-scope vts-opcenter-drawer-scope berth-drawer-scope"
      style={{ maxWidth: '96vw' }}
      width={isDetailMode ? (typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000) : 'min(920px, 96vw)'}
      open={Boolean(open)}
      onClose={onCancel || (() => {})}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '0 24px 12px 24px', overflow: isDetailMode ? 'hidden' : undefined },
      }}
      title={
        <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
          {isDetailMode
            ? (record?.name ? `Chi tiết Trung tâm điều hành VTS - ${record.name}` : 'Chi tiết Trung tâm điều hành VTS')
            : isCreateMode
              ? 'Thêm mới Trung tâm điều hành VTS'
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
                <Button
                  type="primary"
                  onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); form.submit(); }}
                  loading={isSubmitting && actionType === 'approve'}
                  style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
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
                  </>
                )}
                <Button
                  type="primary"
                  onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); form.submit(); }}
                  loading={isSubmitting && actionType === 'approve'}
                  style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                >
                  Lưu và phê duyệt
                </Button>
              </>
            )}
          </>
        )
      }
    >
      {isDetailMode ? (
        isLoading ? (
          <div style={{ padding: '16px 0' }}>
            <LoadingSkeleton rows={6} />
          </div>
        ) : (
          <VtsOperationCenterDetailContent
            selectedRecord={record || initialData!}
            symbols={symbols}
            onClose={onCancel}
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
                      {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
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
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã trung tâm điều hành VTS</span>}
                              name="code"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Mã tự sinh" disabled={true} style={readonlyInputStyle} />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên trung tâm điều hành VTS</span>}
                              name="name"
                              rules={[{ required: true, message: 'Vui lòng nhập tên trung tâm điều hành VTS' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập tên trung tâm điều hành VTS" maxLength={255} showCount style={inputStyle} />
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
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tình trạng</span>}
                              name="conditionStatus"
                              rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Select placeholder="Chọn tình trạng" options={CONDITION_STATUS_OPTIONS} style={selectStyle} />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                              name="detailedLocation"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>

                      {/* ── Section 2: Phạm vi phủ sóng & Ghi chú ── */}
                      <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <FileTextOutlined style={{ color: actionPrimary }} />
                            <span>Phạm vi phủ sóng & Ghi chú</span>
                          </div>
                        </div>
                        <Row gutter={[24, 0]}>
                          <Col span={24}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Vùng phủ sóng</span>}
                              name="coverage"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input.TextArea placeholder="Nhập vùng phủ sóng" rows={3} maxLength={4000} showCount style={textAreaStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                              name="note"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input.TextArea placeholder="Nhập ghi chú" rows={3} maxLength={2000} showCount style={textAreaStyle} />
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
                                      <span>{props.label}</span>
                                    </Space>
                                  );
                                }}
                              />
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

export default VtsOperationCenterForm;
