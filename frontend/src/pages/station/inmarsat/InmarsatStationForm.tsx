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
  FileTextOutlined,
  BankOutlined,
} from '@ant-design/icons';
import toast from '../../../components/ToastNotification';
import { focusErrorTab } from '../../../utils/formValidationHelper';
import { inmarsatStationService } from '../../../services/inmarsatStationService';
import { symbolService } from '../../../services/symbolService';
import { organizationService } from '../../../services/organizationService';
import { DEFAULT_GIS_SYMBOLS } from '../../vtsoperationcenter/VtsOperationCenterForm';
import type {
  CoastalStationInmarsatResponse,
  CoastalStationInmarsatRequest,
  CoastalStationInmarsatUpdateRequest,
} from '../../../services/station/types';
import { ApprovalStatus, CONDITION_STATUS_OPTIONS } from '../../../types/vtsSystem';
import {
  drawerTitleStyle, primaryButtonStyle, outlineButtonStyle,
  drawerTabBarStyle, drawerFormScrollStyle, DRAWER_TABLE_SCROLL_Y,
  requiredMarkStyle, spaceFormField, radiusPill, sidebarBg,
  fontWeightBold, fontSizeMd, fontSizeSm, fontSizeLg,
  textTertiary, borderDefault,
  statusCritical, statusOperational, actionPrimary,
  readonlyInputStyle, inputStyle, selectStyle, spaceSm,
  spaceXs,
} from '../../../themetokenchk';
import { fmtInputNumber } from '../../../utils/numFmt';
import { VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import AppDrawer from '../../../components/shared/AppDrawer';
import { useAuthStore, type AuthState } from '../../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../../store/permissionStore';
import { FormOrgUnitTreeSelect, normalizeSearchText } from '../../../components/org-unit';
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
import InmarsatStationDetailContent, { getOperatingOrgName } from './InmarsatStationDetailContent';
export { getOperatingOrgName };

export const INMARSAT_SERVICE_OPTIONS = [
  { value: 'INMARSAT-C', label: 'INMARSAT-C — Dịch vụ dữ liệu & điện báo hàng hải' },
  { value: 'EGC', label: 'EGC — Báo gọi nhóm nâng cao (SafetyNET / FleetNET)' },
  { value: 'GMDSS', label: 'GMDSS — Hệ thống cấp cứu và an toàn hàng hải toàn cầu' },
  { value: 'SSAS', label: 'SSAS — Báo động an ninh tàu biển' },
  { value: 'LRIT', label: 'LRIT — Nhận dạng và theo dõi tầm xa' },
  { value: 'DISTRESS', label: 'DISTRESS — Phát báo nạn khẩn cấp' },
  { value: 'FLEET_BROADBAND', label: 'FleetBroadband — Thoại & Dữ liệu tốc độ cao' },
];

export interface InmarsatStationFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: CoastalStationInmarsatResponse | null;
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

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
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

export default function InmarsatStationForm({
  open = true,
  editId,
  initialData,
  mode = 'create',
  orgUnits = [],
  symbols: externalSymbols,
  onCancel,
  onSuccess,
  onClose,
}: InmarsatStationFormProps) {
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const isCreateMode = mode === 'create';
  const isEditMode = mode === 'edit';
  const isDetailMode = mode === 'detail';

  const [tabKey, setTabKey] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(editId));
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve'>('draft');

  const [record, setRecord] = useState<CoastalStationInmarsatResponse | null>(initialData || null);
  const [symbols, setSymbols] = useState<any[]>(externalSymbols || []);

  // GIS State
  const [coordinateList, setCoordinateList] = useState<DmsPoint[]>([]);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Attachments State
  const [attachments, setAttachments] = useState<any[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<Array<{ id: string; fileName: string }>>([]);

  const watchedGeometryType = Form.useWatch('geometryType', form);

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

  const hasCoordinates = coordinateList.some((c) => c.latD != null || c.latM != null || c.latS != null || c.lngD != null || c.lngM != null || c.lngS != null);
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);
  const labelProps = (label: string, required?: boolean) => ({
    label: (
      <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
        {label}
      </span>
    ),
    required,
  });

  // User permission level
  const userUnitType = currentUser?.unitType || '';
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || (currentUser as any)?.roleName === 'SUPER_ADMIN' || (currentUser as any)?.roleName === 'ADMIN';
  const isCucLevel = !userUnitType || userUnitType === 'CHUYEN_VIEN_CUC' || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CUC' || userUnitType === 'CUC_HANG_HAI' || isAdmin;
  const isCangVuLevel = userUnitType === 'CVHH' || userUnitType === 'CANG_VU';
  const canApproveL1 = (hasPerm('coastalstationinmarsat:approvec1') || hasPerm('coastalstationinmarsat:approve') || hasPerm('specialstation:approve') || hasPerm('data:approvec1') || hasPerm('data:approve')) && (isCangVuLevel || !isCucLevel);
  const canApproveL2 = (hasPerm('coastalstationinmarsat:approvec2') || hasPerm('coastalstationinmarsat:approve') || hasPerm('specialstation:approvec2') || hasPerm('specialstation:approve') || hasPerm('data:approvec2') || hasPerm('data:approve') || isAdmin || isCucLevel);

  const [internalOrgUnits, setInternalOrgUnits] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      if (orgUnits && orgUnits.length > 0) {
        setInternalOrgUnits(orgUnits);
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
  }, [open, orgUnits]);

  const effectiveOrgUnits = (orgUnits && orgUnits.length > 0) ? orgUnits : internalOrgUnits;

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

  const handleClose = onCancel || onClose || (() => {});

  // Load record details
  useEffect(() => {
    if (!open) return;

    if (isCreateMode) {
      form.resetFields();
      setCoordinateList([]);
      setAttachments([]);
      setPendingFiles([]);
      setPendingDeletedAttachments([]);
      if ((currentUser as any)?.orgUnitId) {
        form.setFieldValue('orgUnitId', String((currentUser as any).orgUnitId));
      }
      inmarsatStationService.generateCode()
        .then((res) => {
          if (res?.code) {
            form.setFieldValue('code', res.code);
          }
        })
        .catch(() => {});
      return;
    }

    const targetId = editId || initialData?.id;
    if (!targetId) return;

    setIsLoading(true);
    inmarsatStationService.getById(targetId)
      .then((data) => {
        setRecord(data);
        const pts: Array<{ latitude: number | null; longitude: number | null }> = [];
        if (data.coordinates) {
          pts.push(...parseWktToCoordinates(data.coordinates));
        } else if (data.latitude != null && data.longitude != null) {
          pts.push({ latitude: Number(data.latitude), longitude: Number(data.longitude) });
        }

        const dmsPoints: DmsPoint[] = pts.map((p) => {
          const lat = ddToDms(p.latitude);
          const lng = ddToDms(p.longitude);
          return {
            latD: lat.d, latM: lat.m, latS: lat.s,
            lngD: lng.d, lngM: lng.m, lngS: lng.s,
          };
        });
        setCoordinateList(dmsPoints);

        const orgId = data.orgUnitId || (initialData as any)?.orgUnitId;
        form.setFieldsValue({
          code: data.code || data.deviceCode,
          name: data.name || data.stationName,
          orgUnitId: orgId ? String(orgId) : undefined,
          operatingOrgId: data.operatingOrgId,
          provinceId: data.provinceId,
          conditionStatus: data.conditionStatus || data.status,
          locationDetail: data.locationDetail || data.locationAddress,
          services: data.services,
          coverageZone: data.coverageZone || data.coverageArea,
          frequency: data.frequency,
          notes: data.notes || data.description,
          geometryType: data.geometryType || data.objectType || (dmsPoints.length > 2 ? 'POLYGON' : dmsPoints.length > 1 ? 'LINE' : (dmsPoints.length === 1 ? 'POINT' : undefined)),
          symbolId: data.symbolId || data.symbol || undefined,
          coordinateSystem: (data.geometryType || dmsPoints.length > 0)
            ? (String(data.coordinateSystem) === '2' || String(data.coordinateSystem).includes('VN-2000') ? 2 : 1)
            : undefined,
          displayRule: (data.geometryType || dmsPoints.length > 0) ? (data.displayRule || 'Độ, phút, giây (DMS)') : undefined,
        });

        // Load attachments
        inmarsatStationService.getAttachments(targetId)
          .then((atts) => setAttachments(Array.isArray(atts) ? atts : []))
          .catch(() => setAttachments([]));
      })
      .catch(() => {
        toast.error('Không thể tải thông tin chi tiết Đài vệ tinh Inmarsat');
      })
      .finally(() => setIsLoading(false));
  }, [open, isCreateMode, editId, initialData, form]);

  const addGpsPoint = () => {
    if (watchedGeometryType === 'POINT' && coordinateList.length >= 1) {
      toast.warning('Đối tượng điểm chỉ có tối đa 1 tọa độ GPS');
      return;
    }
    setCoordinateList((prev) => [
      ...prev,
      { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null },
    ]);
  };

  const removeCoordinate = (index: number) => {
    setCoordinateList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGpsPoint = (index: number, type: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    setCoordinateList((prev) => {
      const next = [...prev];
      if (type === 'lat') {
        next[index] = { ...next[index], latD: d, latM: m, latS: s };
      } else {
        next[index] = { ...next[index], lngD: d, lngM: m, lngS: s };
      }
      return next;
    });
  };

  const attachmentsEditable = isCreateMode ||
    record?.approvalStatus === ApprovalStatus.DRAFT ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2 ||
    (record?.approvalStatus === ApprovalStatus.APPROVED && canApproveL2);

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

  const handleFinish = async (values: any) => {
    const act = actionTypeRef.current;
    setGpsError(null);

    // Validate GPS Coordinates
    const geomType = values.geometryType || undefined;
    const ddPoints: Array<{ latitude: number; longitude: number }> = [];
    let wktString: string | undefined;
    let mainLat: number | undefined;
    let mainLng: number | undefined;

    if (values.geometryType || coordinateList.length > 0) {
      const dmsVal = validateDmsCoordinates(coordinateList, geomType);
      if (!dmsVal.valid) {
        setGpsError(dmsVal.errorMessage || dmsVal.error || 'Tọa độ không hợp lệ');
        setTabKey('gis');
        return;
      }

      for (let i = 0; i < coordinateList.length; i++) {
        const p = coordinateList[i];
        const lat = dmsToDd(p.latD, p.latM, p.latS);
        const lng = dmsToDd(p.lngD, p.lngM, p.lngS);
        if (lat != null && lng != null) {
          ddPoints.push({ latitude: lat, longitude: lng });
        }
      }

      if (ddPoints.length > 0) {
        wktString = serializeCoordinatesToWkt(ddPoints, geomType || 'POINT');
        mainLat = ddPoints[0].latitude;
        mainLng = ddPoints[0].longitude;
      }
    }

    const payload: CoastalStationInmarsatRequest = {
      code: values.code,
      name: values.name,
      orgUnitId: values.orgUnitId,
      operatingOrgId: values.operatingOrgId,
      provinceId: values.provinceId,
      conditionStatus: values.conditionStatus,
      locationDetail: values.locationDetail,
      services: typeof values.services === 'string' ? values.services : JSON.stringify(values.services || []),
      coverageZone: values.coverageZone,
      frequency: values.frequency,
      notes: values.notes,
      geometryType: geomType,
      symbolId: values.symbolId || undefined,
      coordinateSystem: geomType ? (values.coordinateSystem || 'WGS-84') : undefined,
      displayRule: geomType ? (values.displayRule || 'Độ, phút, giây (DMS)') : undefined,
      coordinates: wktString,
      latitude: mainLat,
      longitude: mainLng,
    };

    setIsSubmitting(true);
    try {
      let savedRecord: CoastalStationInmarsatResponse;
      if (isCreateMode) {
        savedRecord = await inmarsatStationService.create(payload, act === 'approve' ? 'APPROVE' : act === 'submit' ? 'SUBMIT' : 'DRAFT');
      } else {
        const targetId = record?.id || editId!;
        savedRecord = await inmarsatStationService.update(targetId, payload as CoastalStationInmarsatUpdateRequest, act === 'approve' ? 'APPROVE' : act === 'submit' ? 'SUBMIT' : 'UPDATE');
      }

      const resultId = savedRecord?.id || record?.id || editId;

      // Handle Attachment uploads and deletes
      if (resultId) {
        if (pendingDeletedAttachments.length > 0) {
          try {
            await Promise.all(pendingDeletedAttachments.map((a) => inmarsatStationService.deleteAttachment(resultId, a.id)));
          } catch (delErr) {
            console.warn('Failed to delete attachments', delErr);
          }
        }
        if (pendingFiles.length > 0) {
          try {
            await Promise.all(pendingFiles.map((f) => inmarsatStationService.uploadAttachment(resultId, f)));
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
            await inmarsatStationService.approveL1(resultId).catch(() => {});
            await inmarsatStationService.approveL2(resultId);
            toast.success(isCreateMode ? 'Thêm mới và phê duyệt thành công' : 'Lưu và phê duyệt thành công');
          } else if (canApproveL1) {
            await inmarsatStationService.approveL1(resultId);
            toast.success('Lưu và phê duyệt thành công');
          } else {
            await inmarsatStationService.approveL1(resultId).catch(() => {});
            await inmarsatStationService.approveL2(resultId).catch(async () => {
              await inmarsatStationService.approveL1(resultId);
            });
            toast.success('Lưu và phê duyệt thành công');
          }
        } else {
          toast.success(isCreateMode ? 'Tạo mới (Lưu tạm) thành công' : 'Cập nhật thành công');
        }
      }

      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDrawer
      rootClassName="inmarsat-drawer-scope berth-drawer-scope"
      className="inmarsat-drawer-scope berth-drawer-scope"
      style={{ maxWidth: '96vw' }}
      width={isDetailMode ? (typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000) : 'min(920px, 96vw)'}
      open={Boolean(open)}
      onClose={handleClose}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '0 24px 12px 24px', overflow: isDetailMode ? 'hidden' : undefined },
      }}
      title={
        <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
          {isDetailMode
            ? (record?.name ? `Chi tiết Đài thông tin vệ tinh Inmarsat - ${record.name}` : 'Chi tiết Đài thông tin vệ tinh Inmarsat')
            : isCreateMode
              ? 'Thêm mới Đài thông tin vệ tinh Inmarsat'
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
          <InmarsatStationDetailContent
            selectedRecord={record || initialData!}
            symbols={symbols}
            attachments={attachments}
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
                    'code',
                    'name',
                    'orgUnitId',
                    'operatingOrgId',
                    'provinceId',
                    'conditionStatus',
                    'locationDetail',
                    'services',
                    'coverageZone',
                    'frequency',
                    'notes',
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
            <style>{`
              ${requiredMarkStyle}
              .inmarsat-drawer-scope,
              .inmarsat-drawer-scope .ant-drawer-content,
              .inmarsat-drawer-scope .ant-tabs-tab,
              .inmarsat-drawer-scope .chk-detail-label,
              .inmarsat-drawer-scope .chk-detail-value,
              .inmarsat-drawer-scope .ant-table,
              .inmarsat-drawer-scope .ant-table-cell,
              .inmarsat-drawer-scope .ant-table-thead > tr > th,
              .inmarsat-drawer-scope .ant-btn,
              .inmarsat-drawer-scope .ant-select,
              .inmarsat-drawer-scope .ant-input,
              .inmarsat-drawer-scope .ant-form-item-label > label,
              .berth-drawer-scope,
              .berth-drawer-scope .ant-drawer-content,
              .berth-drawer-scope .ant-tabs-tab,
              .berth-drawer-scope .chk-detail-label,
              .berth-drawer-scope .chk-detail-value,
              .berth-drawer-scope .ant-table,
              .berth-drawer-scope .ant-table-cell,
              .berth-drawer-scope .ant-table-thead > tr > th,
              .berth-drawer-scope .ant-btn,
              .berth-drawer-scope .ant-select,
              .berth-drawer-scope .ant-input,
              .berth-drawer-scope .ant-form-item-label > label {
                font-size: 13.5px !important;
              }
            `}</style>
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
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã đài</span>}
                              name="code"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Mã tự sinh" disabled={true} style={readonlyInputStyle} />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên đài</span>}
                              name="name"
                              rules={[{ required: true, message: 'Vui lòng nhập tên đài' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập tên đài" maxLength={255} showCount style={inputStyle} />
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
                                organizations={effectiveOrgUnits}
                                placeholder="Chọn đơn vị quản lý"
                                disabled={isEditMode}
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
                                filterOption={(input, option) => normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))}
                                options={DEFAULT_OPERATING_ORGANIZATIONS.map((o) => ({
                                  value: o.id,
                                  label: o.name,
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

                          <Col span={24}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                              name="locationDetail"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>

                          <Col span={24}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Dịch vụ cung cấp</span>}
                              name="services"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <ServiceMultiSelect options={INMARSAT_SERVICE_OPTIONS} />
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
                              name="coverageZone"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập vùng phủ sóng" maxLength={4000} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tần số</span>}
                              name="frequency"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập tần số" maxLength={255} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                              name="notes"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập ghi chú" maxLength={2000} showCount style={inputStyle} />
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
                              {...labelProps('Loại đối tượng', hasCoordinates)}
                              rules={hasCoordinates ? [{ required: true, message: 'Loại đối tượng là bắt buộc khi có tọa độ' }] : []}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Select
                                placeholder="Chọn loại đối tượng"
                                allowClear
                                options={GEOMETRY_TYPE_OPTIONS}
                                style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              name="symbolId"
                              {...labelProps('Biểu tượng', hasLocation)}
                              rules={hasLocation ? [{ required: true, message: 'Biểu tượng là bắt buộc khi có vị trí' }] : []}
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
                        </Row>

                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item
                              name="coordinateSystem"
                              {...labelProps('Hệ quy chiếu')}
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
                              {...labelProps('Quy tắc hiển thị')}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input
                                placeholder="Chọn quy tắc hiển thị"
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
}
