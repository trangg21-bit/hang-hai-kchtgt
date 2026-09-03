import { useState, useEffect, useMemo, useRef } from 'react';
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
import { hanoiStationService } from '../../../services/hanoiStationService';
import type {
  HanoiStationItem,
  CreateHanoiStationRequest,
  OperationPlanItem,
  MaintenancePlanItem,
  IncidentItem,
} from '../../../types/hanoiStation';
import { HANOI_SERVICE_OPTIONS } from '../../../types/hanoiStation';
import { ConditionStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP, ApprovalStatus } from '../../../types/vtsSystem';
import {
  drawerTitleStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle,
  drawerTabBarStyle, drawerStyles, drawerFormScrollStyle, drawerGisControlBoxStyle, DRAWER_TABLE_SCROLL_Y,
  spaceFormField, radiusPill, sidebarBg,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  textPrimary, textSecondary, textTertiary, borderDefault,
  statusCritical, statusOperational, statusAttention, actionPrimary, textAreaStyle,
  readonlyInputStyle, drawerCloseBtnStyle, selectStyle, inputStyle, requiredMarkStyle,
  statusBadgeStyle, getConditionStatusColor, getConditionStatusLabel,
} from '../../../themetokenchk';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../../types/common';
import { useAuthStore } from '../../../store/authStore';
import { usePermissionStore } from '../../../store/permissionStore';
import { FormOrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../../components/org-unit';
import DetailTable from '../../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../../components/shared/InfrastructureAttachmentTab';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import ServiceMultiSelect from '../../../components/shared/ServiceMultiSelect';
import GisLocationSelector from '../../../components/gis/GisLocationSelector';
import { symbolService } from '../../../services/symbolService';
import dayjs from 'dayjs';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import { parseWktToCoordinates, serializeCoordinatesToWkt, ddToDms, dmsToDd, adjustCoordinateListForGeometry } from '../../../utils/gisGeometry';
import { focusErrorTab } from '../../../utils/formValidationHelper';

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

export interface HanoiStationFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: HanoiStationItem | null;
  mode?: 'create' | 'edit' | 'detail';
  orgUnits?: any[];
  symbolOptions?: any[];
  onClose?: () => void;
  onSuccess?: () => void;
}

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const renderConditionBadge = (status?: ConditionStatus | string | number) => {
  if (!status && status !== 0) return '—';
  const label = getConditionStatusLabel(status);
  const color = getConditionStatusColor(status);
  return (
    <span style={statusBadgeStyle(color)}>
      {label}
    </span>
  );
};

export const getOperatingOrgName = (id?: string, name?: string) => {
  if (name) return name;
  if (!id) return '—';
  const found = DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === id);
  return found ? found.name : id;
};

export const renderServicesBadges = (services?: string[] | string) => {
  let list: string[] = [];
  if (Array.isArray(services)) {
    list = services;
  } else if (typeof services === 'string' && services.trim()) {
    list = services.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
  }
  if (!list || list.length === 0) return '—';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {list.map((srv) => {
        const found = HANOI_SERVICE_OPTIONS.find((o) => o.value === srv);
        const label = found ? found.value : srv;
        return (
          <span
            key={srv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: radiusPill,
              fontSize: 12,
              fontWeight: fontWeightMedium,
              background: '#eef3fb',
              border: '1px solid #c6d9f5',
              color: '#12468C',
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
};

// Sample mock data for Tab 4 (Vận hành & bảo trì)
const SAMPLE_OPERATION_PLANS: OperationPlanItem[] = [
  { id: '1', planCode: 'KH-VH-2026/01', planName: 'Kế hoạch trực vận hành xử lý thông tin thông luồng quý I/2026', startDate: '2026-01-01', endDate: '2026-03-31' },
  { id: '2', planCode: 'KH-VH-2026/02', planName: 'Kế hoạch giám sát luồng hàng hải trực canh liên tục quý II/2026', startDate: '2026-04-01', endDate: '2026-06-30' },
];

const SAMPLE_MAINTENANCE_PLANS: MaintenancePlanItem[] = [
  { id: '1', planCode: 'KH-BT-2026/01', planName: 'Bảo trì máy chủ tiếp nhận & xử lý thông tin luồng tàu', startTime: '2026-02-10', endTime: '2026-02-12' },
  { id: '2', planCode: 'KH-BT-2026/02', planName: 'Kiểm định hệ thống giám sát và thông tin duyên hải', startTime: '2026-05-15', endTime: '2026-05-18' },
];

const SAMPLE_INCIDENTS: IncidentItem[] = [
  { id: '1', incidentCode: 'SC-2026-001', incidentType: 'Nghẽn đường truyền dữ liệu thông luồng', location: 'Trạm thu phát trung tâm', incidentTime: '2026-01-18 09:30:00' },
];

export default function HanoiStationForm({
  open = true,
  editId,
  initialData,
  mode = 'create',
  orgUnits = [],
  symbolOptions = [],
  onClose,
  onSuccess,
}: HanoiStationFormProps) {
  const [form] = Form.useForm();
  const [tabKey, setTabKey] = useState('general');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [record, setRecord] = useState<HanoiStationItem | null>(initialData || null);
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('draft');

  // GIS states
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [coordinateList, setCoordinateList] = useState<Array<{ latitude: number | null; longitude: number | null }>>([]);
  const [symbols, setSymbols] = useState<any[]>(DEFAULT_GIS_SYMBOLS);
  const [geometryTypeState, setGeometryTypeState] = useState<string>('POINT');

  // Attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<Array<{ id: string; fileName: string }>>([]);

  const user = useAuthStore((s: any) => s.user);
  const hasPermission = usePermissionStore((s: any) => s.hasPermission);

  const isDetailMode = mode === 'detail';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  const isCucLevel = (user as any)?.orgUnitLevel === 1 || (user as any)?.role === 'SUPER_ADMIN';

  const canApproveL2 = hasPermission('coastalstationhaiphong:approvec2') || hasPermission('coastalstationhaiphong:approve') || hasPermission('specialstation:approvec2') || hasPermission('specialstation:approve') || hasPermission('admin:all') || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN';

  // Load symbols
  useEffect(() => {
    if (symbolOptions && symbolOptions.length > 0) {
      setSymbols(symbolOptions);
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
  }, [symbolOptions]);

  // Filter orgUnits according to user data scope
  const filteredOrgUnits = useMemo(() => {
    if (!orgUnits || orgUnits.length === 0) return [];
    const userOrgId = (user as any)?.orgUnitId;
    if (!userOrgId || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN' || isCucLevel) {
      return orgUnits;
    }
    const allowedIds = resolveOrgSubtreeIds(orgUnits, userOrgId);
    if (allowedIds.size === 0) return orgUnits;
    return orgUnits.filter((u: any) => allowedIds.has(u.id));
  }, [orgUnits, user, isCucLevel]);

  // Load record details
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setRecord(null);
      setCoordinateList([]);
      setAttachments([]);
      setPendingFiles([]);
      setPendingDeletedAttachments([]);
      setTabKey('general');
      setGeometryTypeState('POINT');
      return;
    }

    if (initialData) {
      setRecord(initialData);
      populateFormData(initialData);
    } else if (editId) {
      setLoading(true);
      hanoiStationService.getById(editId)
        .then((res) => {
          setRecord(res);
          populateFormData(res);
        })
        .catch(() => {
          toast.error('Không thể tải thông tin đài TTXLTT');
          onClose?.();
        })
        .finally(() => setLoading(false));
    } else {
      // Create mode - auto generate code
      form.resetFields();
      setGeometryTypeState('POINT');
      form.setFieldsValue({
        code: 'Đang tạo mã...',
        orgUnitId: undefined,
        operatingOrgId: undefined,
        provinceId: undefined,
        locationAddress: undefined,
        conditionStatus: ConditionStatus.OPERATIONAL,
        services: undefined,
        description: undefined,
        geometryType: 'POINT',
        symbol: undefined,
        coordinateSystem: 'WGS 84 / VN-2000',
        displayRule: 'Độ, phút, giây (DMS)',
      });
      setCoordinateList([{ latitude: null, longitude: null }]);
      setAttachments([]);
      setPendingFiles([]);
      setPendingDeletedAttachments([]);

      hanoiStationService.generateCode().then((res) => {
        if (res?.code) {
          form.setFieldValue('code', res.code);
        }
      }).catch(() => {
        form.setFieldValue('code', 'TTXLTT-0001');
      });
    }
  }, [open, editId, initialData]);

  const populateFormData = (data: HanoiStationItem) => {
    let serviceList: string[] = [];
    if (Array.isArray(data.services)) {
      serviceList = data.services;
    } else if (data.servicesProvided) {
      serviceList = data.servicesProvided.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    }

    const geom = data.geometryType || 'POINT';
    setGeometryTypeState(geom);
    form.setFieldsValue({
      orgUnitId: data.orgUnitId,
      operatingOrgId: data.operatingOrgId,
      code: data.code,
      name: data.name,
      provinceId: data.provinceId != null ? String(data.provinceId) : undefined,
      locationAddress: data.locationAddress,
      conditionStatus: data.conditionStatus || ConditionStatus.OPERATIONAL,
      services: serviceList,
      description: data.description,
      geometryType: geom,
      symbol: data.symbol || undefined,
      coordinateSystem: data.coordinateSystem || 'WGS 84 / VN-2000',
      displayRule: data.displayRule || 'Độ, phút, giây (DMS)',
    });

    let initialCoords: { latitude: number | null; longitude: number | null }[] = [];
    if (data.coordinates) {
      const coords = parseWktToCoordinates(data.coordinates);
      initialCoords = coords.map((c) => ({ latitude: c.latitude ?? null, longitude: c.longitude ?? null }));
    } else if (data.latitude != null && data.longitude != null) {
      initialCoords = [{ latitude: Number(data.latitude), longitude: Number(data.longitude) }];
    }
    setCoordinateList(adjustCoordinateListForGeometry(initialCoords, geom));

    if (data.id) {
      hanoiStationService.getAttachments(data.id)
        .then((atts) => setAttachments(atts || []))
        .catch(() => setAttachments([]));
    }
  };

  // Submit Handler
  const handleFormFinish = async (values: any) => {
    const act = actionTypeRef.current;
    try {
      setIsSubmitting(true);

      const geomType = values.geometryType || 'POINT';
      const validCoords = coordinateList.filter((p) => p.latitude != null && p.longitude != null && !isNaN(p.latitude) && !isNaN(p.longitude));
      const minPoints = geomType === 'LINE' ? 2 : (geomType === 'POLYGON' ? 3 : 1);
      if (validCoords.length > 0 && validCoords.length < minPoints) {
        toast.error(`Đối tượng kiểu ${geomType === 'LINE' ? 'đường' : 'vùng'} yêu cầu tối thiểu ${minPoints} điểm tọa độ`);
        setIsSubmitting(false);
        return;
      }

      // Chỉ dựng WKT từ các điểm ĐÃ nhập. Trước đây `|| 0` biến dòng tọa độ còn
      // trống thành (0, 0) — điểm giữa Đại Tây Dương — nên hồ sơ chưa chọn vị trí
      // vẫn bị lưu kèm một tọa độ rác.
      const wkt = serializeCoordinatesToWkt(validCoords, geomType);
      const firstPt = validCoords[0];


      const servicesArray = Array.isArray(values.services) ? values.services : [];
      const servicesString = servicesArray.join(', ');

      const payload: CreateHanoiStationRequest = {
        orgUnitId: values.orgUnitId,
        operatingOrgId: values.operatingOrgId,
        code: isCreateMode ? undefined : values.code?.trim(),
        name: values.name?.trim(),
        provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
        locationAddress: values.locationAddress?.trim(),
        conditionStatus: values.conditionStatus,
        servicesProvided: servicesString,
        services: servicesArray,
        description: values.description?.trim(),
        geometryType: geomType,
        symbol: values.symbol,
        coordinateSystem: values.coordinateSystem,
        displayRule: values.displayRule,
        coordinates: wkt || undefined,
        latitude: firstPt?.latitude != null ? firstPt.latitude : undefined,
        longitude: firstPt?.longitude != null ? firstPt.longitude : undefined,
      };

      let resultId = editId || record?.id;

      if (isCreateMode) {
        const created = await hanoiStationService.create(payload, 'DRAFT');
        resultId = created.id;

        if (resultId && pendingFiles.length > 0) {
          try {
            await Promise.all(pendingFiles.map((f) => hanoiStationService.uploadAttachment(resultId!, f)));
          } catch {
            toast.error('Lỗi khi tải tệp đính kèm');
          }
        }
      } else if (resultId) {
        await hanoiStationService.update(resultId, payload);
        if (pendingDeletedAttachments.length > 0) {
          try {
            await Promise.all(pendingDeletedAttachments.map((a) => hanoiStationService.deleteAttachment(resultId!, a.id)));
          } catch (delErr) {
            console.warn('Failed to delete some attachments on edit', delErr);
          }
        }
        if (pendingFiles.length > 0) {
          try {
            await Promise.all(pendingFiles.map((f) => hanoiStationService.uploadAttachment(resultId!, f)));
          } catch {
            toast.error('Lỗi khi tải tệp đính kèm');
          }
        }
      }
      setPendingDeletedAttachments([]);

      if (resultId) {
        if (act === 'submit') {
          await hanoiStationService.submit(resultId);
          toast.success(isCreateMode ? 'Tạo mới và gửi phê duyệt thành công' : 'Lưu và gửi phê duyệt thành công');
        } else if (act === 'approve') {
          await hanoiStationService.submit(resultId).catch(() => {});
          await hanoiStationService.approveL2(resultId);
          toast.success(isCreateMode ? 'Thêm mới và phê duyệt thành công' : 'Lưu và phê duyệt thành công');
        } else {
          toast.success(isCreateMode ? 'Tạo mới (Lưu tạm) thành công' : 'Cập nhật thành công');
        }
      }

      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu đài TTXLTT');
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
      await hanoiStationService.downloadAttachment(targetId, attId, fileName);
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  };

  // DMS helper for coordinates
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

  // ── RENDER CHI TIẾT (5 TAB THEO MA TRẬN) ──
  const renderDetailContent = () => {
    if (!record) return null;
    return (
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
                <div className="chk-detail-grid">
                  <div className="chk-detail-row"><span className="chk-detail-label">Mã đài TTXLTT</span><span className="chk-detail-value">{record.code || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Tên đài TTXLTT</span><span className="chk-detail-value">{record.name || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị quản lý</span><span className="chk-detail-value">{record.orgUnitName || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị khai thác</span><span className="chk-detail-value">{getOperatingOrgName(record.operatingOrgId, record.operatingOrgName)}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm (Tỉnh/TP)</span><span className="chk-detail-value">{record.provinceId ? getProvinceNameById(record.provinceId) : '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm chi tiết</span><span className="chk-detail-value">{record.locationAddress || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Tình trạng</span><span className="chk-detail-value">{renderConditionBadge(record.conditionStatus)}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Dịch vụ cung cấp</span><span className="chk-detail-value">{renderServicesBadges(record.services || record.servicesProvided)}</span></div>
                  <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Ghi chú / Mô tả</span><span className="chk-detail-value">{record.description || '—'}</span></div>
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
                        <span className="chk-detail-label">Biểu tượng</span>
                        <span className="chk-detail-value">
                          {(() => {
                            const symId = record?.symbol;
                            const sym = symbols.find((s) => s.id === symId || s.code === symId);
                            if (sym?.image) {
                              const imgSrc = sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`;
                              return (
                                <Space size={6} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  <img src={imgSrc} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                                  <span>{sym.name}</span>
                                </Space>
                              );
                            }
                            return sym?.name || symId || 'SYM-COASTAL';
                          })()}
                        </span>
                      </div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Hệ quy chiếu</span><span className="chk-detail-value">{record.coordinateSystem || 'WGS 84 / VN-2000'}</span></div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Quy tắc hiển thị</span><span className="chk-detail-value">{record.displayRule || 'Độ, phút, giây (DMS)'}</span></div>
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
            label: `File đính kèm (${attachments.length})`,
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
                        dataSource={SAMPLE_OPERATION_PLANS}
                        emptyText="Chưa có kế hoạch vận hành"
                        rowKey="id"
                        columns={[
                          { title: 'STT', width: 60, align: 'center', render: (_: any, __: any, index: number) => index + 1 },
                          { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'planCode', width: 240, render: (v: string) => <span style={{ color: textPrimary }}>{v || '—'}</span> },
                          { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'planName', width: 280, render: (v: string) => <span style={{ color: textPrimary }}>{v || '—'}</span> },
                          { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'startDate', width: 200, render: (v: any) => <span style={{ color: textPrimary }}>{v ? dayjs(v).format('DD/MM/YYYY') : '—'}</span> },
                          { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate', width: 200, render: (v: any) => <span style={{ color: textPrimary }}>{v ? dayjs(v).format('DD/MM/YYYY') : '—'}</span> },
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
                        dataSource={SAMPLE_MAINTENANCE_PLANS}
                        emptyText="Chưa có kế hoạch bảo trì"
                        rowKey="id"
                        columns={[
                          { title: 'STT', width: 60, align: 'center', render: (_: any, __: any, index: number) => index + 1 },
                          { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'planCode', width: 240, render: (v: string) => <span style={{ color: textPrimary }}>{v || '—'}</span> },
                          { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'planName', width: 280, render: (v: string) => <span style={{ color: textPrimary }}>{v || '—'}</span> },
                          { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'startTime', width: 200, render: (v: any) => <span style={{ color: textPrimary }}>{v ? dayjs(v).format('DD/MM/YYYY') : '—'}</span> },
                          { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'endTime', width: 200, render: (v: any) => <span style={{ color: textPrimary }}>{v ? dayjs(v).format('DD/MM/YYYY') : '—'}</span> },
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
                        dataSource={SAMPLE_INCIDENTS}
                        emptyText="Chưa có sự cố nào ghi nhận"
                        rowKey="id"
                        columns={[
                          { title: 'STT', width: 60, align: 'center', render: (_: any, __: any, index: number) => index + 1 },
                          { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'incidentCode', width: 200, render: (v: string) => <span style={{ color: textPrimary }}>{v || '—'}</span> },
                          { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'incidentType', width: 240, render: (v: string) => <span style={{ color: textPrimary }}>{v || '—'}</span> },
                          { title: 'Địa điểm', dataIndex: 'location', key: 'location', width: 260, render: (v: string) => <span style={{ color: textPrimary }}>{v || '—'}</span> },
                          { title: 'Thời gian', dataIndex: 'incidentTime', key: 'incidentTime', width: 200, render: (v: any) => <span style={{ color: textPrimary }}>{v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—'}</span> },
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
                  <div className="chk-detail-row"><span className="chk-detail-label">Trạng thái</span><span className="chk-detail-value"><ApprovalStatusBadge status={record.approvalStatus || 'DRAFT'} /></span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Ngày cập nhật</span><span className="chk-detail-value">{record.updatedAt || record.createdAt ? dayjs(record.updatedAt || record.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ cập nhật</span><span className="chk-detail-value">{record.updatedByName || record.createdByName || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Ngày gửi phê duyệt</span><span className="chk-detail-value">{record.submittedAt ? dayjs(record.submittedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ gửi phê duyệt</span><span className="chk-detail-value">{record.submittedByName || record.submittedBy || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span><span className="chk-detail-value">{record.approvedDateLevel1 ? dayjs(record.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span><span className="chk-detail-value">{record.approverLevel1Name || record.approverLevel1 || '—'}</span></div>
                  <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Nội dung phê duyệt</span><span className="chk-detail-value">{record.approvalContentLevel1 || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Ngày phê duyệt cấp Cục</span><span className="chk-detail-value">{record.approvedDateLevel2 ? dayjs(record.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ phê duyệt cấp Cục</span><span className="chk-detail-value">{record.approverLevel2Name || record.approverLevel2 || '—'}</span></div>
                  <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Nội dung phê duyệt</span><span className="chk-detail-value">{record.approvalContentLevel2 || '—'}</span></div>
                  {record.rejectionReason && (
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label" style={{ color: statusCritical }}>Lý do từ chối</span>
                      <span className="chk-detail-value" style={{ color: statusCritical }}>{record.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />
    );
  };

  // ── RENDER FORM TẠO MỚI / CHỈNH SỬA (3 TAB THEO MA TRẬN) ──
  const renderFormContent = () => {
    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormFinish}
        onFinishFailed={({ errorFields }) => {
          focusErrorTab(
            { errorFields },
            {
              general: ['code', 'name', 'orgUnitId', 'conditionStatus', 'provinceId', 'locationAddress'],
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
                  {/* Hàng 1: Mã đài & Tên đài */}
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
                          style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 40 }}
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

                  {/* Hàng 2: Đơn vị quản lý & Đơn vị khai thác */}
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
                          allowClear
                          treeDefaultExpandAll={true}
                          listHeight={256}
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
                          showSearch
                          filterOption={(input, option) =>
                            normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                          }
                          options={DEFAULT_OPERATING_ORGANIZATIONS.map((o) => ({ value: o.id, label: o.name }))}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Hàng 3: Địa điểm (Tỉnh/TP) & Địa điểm chi tiết */}
                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item
                        name="provinceId"
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm (Tỉnh/TP)</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn địa điểm (Tỉnh/TP)' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn địa điểm (Tỉnh/TP)"
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
                        name="locationAddress"
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

                  {/* Hàng 4: Tình trạng hoạt động & Dịch vụ cung cấp */}
                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item
                        name="conditionStatus"
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tình trạng</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select placeholder="Chọn tình trạng" options={CONDITION_STATUS_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="services"
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Dịch vụ cung cấp</span>}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <ServiceMultiSelect
                          placeholder="Chọn dịch vụ cung cấp"
                          options={HANOI_SERVICE_OPTIONS}
                          filterOption={(input, option) =>
                            normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Hàng 5: Ghi chú */}
                  <Row gutter={[24, 0]}>
                    <Col span={24}>
                      <Form.Item
                        name="description"
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                        style={{ marginBottom: 0 }}
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="Nhập ghi chú"
                          maxLength={2000}
                          showCount
                          style={textAreaStyle}
                        />
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
                                setCoordinateList([{ latitude: null, longitude: null }]);
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          name="symbol"
                          label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '18px' }}>Biểu tượng</span>}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            placeholder="Chọn biểu tượng bản đồ"
                            allowClear
                            disabled={!geometryTypeState}
                            options={symbols.map((sym) => ({
                              value: sym.code || sym.id,
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
    );
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
            {isCreateMode && 'Thêm mới Đài TTXLTT Hàng hải'}
            {isEditMode && (record?.name ? `Chỉnh sửa — ${record.name}` : 'Chỉnh sửa Đài TTXLTT Hàng hải')}
            {isDetailMode && (record?.name ? `Xem chi tiết — ${record.name}` : 'Xem chi tiết Đài TTXLTT Hàng hải')}
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
                {canApproveL2 && (
                  <Button
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'approve'; form.submit(); }}
                    loading={isSubmitting && actionTypeRef.current === 'approve'}
                    style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                  >
                    Lưu và phê duyệt
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button onClick={onClose} style={outlineButtonStyle}>Hủy</Button>
                <Button
                  type="primary"
                  onClick={() => { actionTypeRef.current = 'update'; form.submit(); }}
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
      <Spin spinning={loading}>
        {isDetailMode ? renderDetailContent() : renderFormContent()}
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
              // Không ép null thành 0: dòng tọa độ trống mà quy thành (0, 0) sẽ làm
              // bản đồ cắm sẵn một điểm ở vịnh Guinea dù người dùng chưa chọn gì.
              coordinates: serializeCoordinatesToWkt(coordinateList, geometryTypeState || 'POINT'),
              symbolId: form.getFieldValue('symbol'),
            }}
            defaultGeometryType={(geometryTypeState as any) || 'POINT'}
            onChange={(val) => {
              if (isDetailMode) return;
              if (val.coordinates) {
                const pts = parseWktToCoordinates(val.coordinates);
                setCoordinateList(pts.map((p) => ({ latitude: p.latitude ?? null, longitude: p.longitude ?? null })));
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
}
