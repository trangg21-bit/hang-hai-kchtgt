import React, { useState, useEffect, useMemo } from 'react';
import {
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  Spin,
  Space,
  Tabs,
  DatePicker,
  Row,
  Col,
  Upload,
  Modal,
  Table,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  InboxOutlined,
  FileOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { aisSystemService } from '../../services/aisSystemService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { radarStationService } from '../../services/radarStationService';
import { organizationService } from '../../services/organizationService';
import { symbolService, type Symbol as GisSymbol } from '../../services/symbolService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type {
  AisSystemResponse,
  CreateAisSystemRequest,
  AisSystemAttachment,
} from '../../types/aisSystem';
import { UNIT_OF_MEASURE_OPTIONS, UNIT_OF_MEASURE_MAP, UnitOfMeasure } from '../../types/aisSystem';
import { ApprovalStatus, ConditionStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import {
  drawerTitleStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  drawerTabBarStyle,
  drawerTabsStyle,
  drawerTabContentStyle,
  spaceFormField,
  radiusPill,
  radiusSm,
  radiusMd,
  sidebarBg,
  fontWeightBold,
  fontWeightMedium,
  spaceMd,
  spaceSm,
  spaceXs,
  spaceLg,
  fontSizeMd,
  fontSizeSm,
  textSecondary,
  textPrimary,
  textTertiary,
  borderDefault,
  surfaceCard,
  surfacePage,
  uploadHintStyle,
  statusOperational,
  statusDraft,
  statusAttention,
  statusCritical,
  actionPrimary,
  textAreaStyle,
  readonlyInputStyle,
  inputStyle,
  selectStyle,
  drawerCloseBtnStyle,
  generateTempId,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import { colors } from '../../theme';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../components/org-unit';
import { AppDrawer } from '../../components/shared/AppDrawer';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import DetailTable from '../../components/shared/DetailTable';

interface CoordinateItem {
  latitude: number | null;
  longitude: number | null;
}

export const GEOMETRY_POINT_COUNT: Record<string, number> = {
  POINT: 1,
  LINE: 2,
  POLYGON: 3,
};

const ddToDms = (dd: number | null | undefined) => {
  if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(4));
  return { d, m, s };
};

const formatDmsString = (dd: number | null | undefined) => {
  if (dd == null || isNaN(dd)) return '—';
  const { d, m, s } = ddToDms(dd);
  return `${d}°${m}'${s.toFixed(2)}"`;
};

const parseWktToCoordinates = (wkt?: string): CoordinateItem[] => {
  if (!wkt) return [];
  try {
    const upper = wkt.toUpperCase().trim();
    if (upper.startsWith('POINT')) {
      const match = upper.match(/POINT\s*\(\s*([^\s)]+)\s+([^)]+)\s*\)/i);
      if (match) {
        return [{ longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) }];
      }
    } else if (upper.startsWith('LINESTRING')) {
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
  } catch (e) {}
  return [];
};

const serializeCoordinatesToWkt = (coords: CoordinateItem[], geomType: string): string => {
  const valid = coords.filter((c) => c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude));
  if (valid.length === 0) return '';
  if (geomType === 'POINT') {
    return `POINT(${valid[0].longitude} ${valid[0].latitude})`;
  } else if (geomType === 'LINE') {
    return `LINESTRING(${valid.map((c) => `${c.longitude} ${c.latitude}`).join(', ')})`;
  } else if (geomType === 'POLYGON') {
    const pts = [...valid];
    if (pts.length >= 3) {
      if (pts[0].latitude !== pts[pts.length - 1].latitude || pts[0].longitude !== pts[pts.length - 1].longitude) {
        pts.push(pts[0]);
      }
    }
    return `POLYGON((${pts.map((c) => `${c.longitude} ${c.latitude}`).join(', ')}))`;
  }
  return `POINT(${valid[0].longitude} ${valid[0].latitude})`;
};

const renderConditionStatusBadge = (status?: ConditionStatus | string) => {
  if (!status) return '—';
  const label = CONDITION_STATUS_MAP[status as ConditionStatus] || status;
  const color =
    status === ConditionStatus.OPERATIONAL
      ? statusOperational
      : status === ConditionStatus.STOPPED
        ? statusCritical
        : status === ConditionStatus.MAINTENANCE
          ? statusAttention
          : actionPrimary;

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

interface AisSystemChkFormProps {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  initialData?: AisSystemResponse | null;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToEdit?: () => void;
}

export const AisSystemChkForm: React.FC<AisSystemChkFormProps> = ({
  open,
  mode,
  initialData,
  onClose,
  onSuccess,
  onSwitchToEdit,
}) => {
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const { hasPermission } = usePermissionStore();
  const canSaveAndApprove = (currentUser?.permissions || []).includes('aissystem:approvec2');

  const [activeTab, setActiveTab] = useState<string>('basic');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [auditExpanded, setAuditExpanded] = useState<boolean>(true);

  // Reference lists
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [operatingOrganizations, setOperatingOrganizations] = useState(DEFAULT_OPERATING_ORGANIZATIONS);
  const [opCenters, setOpCenters] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);
  const [radarStations, setRadarStations] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);
  const [symbols, setSymbols] = useState<GisSymbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<CoordinateItem[]>([{ latitude: null, longitude: null }]);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [attachmentList, setAttachmentList] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<AisSystemResponse | null>(null);

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const activeRecord = initialData || detailData;

  const handleUploadAttachment = async (file: File) => {
    if (!activeRecord?.id) {
      const newItem = {
        id: generateTempId(),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || file.name.split('.').pop()?.toLowerCase(),
        file,
        uploadedDate: dayjs().toISOString(),
        uploadedByName: currentUser?.fullName || currentUser?.username || 'Người dùng hiện tại',
      };
      setAttachmentList((prev) => [newItem, ...prev]);
      return;
    }

    try {
      await aisSystemService.uploadAttachment(activeRecord.id, file);
      toast.success('Tải lên tệp đính kèm thành công');
      const atts = await aisSystemService.listAttachments(activeRecord.id);
      setAttachmentList(atts || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi tải lên tệp đính kèm');
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    if (!activeRecord?.id) {
      setAttachmentList((prev) => prev.filter((a) => a.id !== attId));
      toast.success('Đã xóa tệp đính kèm');
      return;
    }
    try {
      await aisSystemService.deleteAttachment(activeRecord.id, attId);
      toast.success('Xóa tệp đính kèm thành công');
      setAttachmentList((prev) => prev.filter((a) => a.id !== attId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi xóa tệp đính kèm');
    }
  };

  const handleDownloadAttachment = async (attId: string, fileName?: string) => {
    if (!attId) return;
    if (activeRecord?.id) {
      await aisSystemService.downloadAttachment(activeRecord.id, attId, fileName);
    } else {
      const found = attachmentList.find((a) => a.id === attId);
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

  const formOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedGeom = Form.useWatch('geometryType', form) || 'POINT';

  // Cascading options with graceful fallback
  const filteredOpCenters = useMemo(() => {
    if (!formOrgUnitId) return opCenters;
    const allowedIds = resolveOrgSubtreeIds(orgUnits, formOrgUnitId);
    const filtered = opCenters.filter((c) => !c.orgUnitId || allowedIds.has(c.orgUnitId));
    return filtered.length > 0 ? filtered : opCenters;
  }, [opCenters, formOrgUnitId, orgUnits]);

  const filteredRadarStations = useMemo(() => {
    if (!formOrgUnitId) return radarStations;
    const allowedIds = resolveOrgSubtreeIds(orgUnits, formOrgUnitId);
    const filtered = radarStations.filter((r) => !r.orgUnitId || allowedIds.has(r.orgUnitId));
    return filtered.length > 0 ? filtered : radarStations;
  }, [radarStations, formOrgUnitId, orgUnits]);

  const combinedLocationOptions = useMemo(() => [
    {
      label: 'Trung tâm điều hành VTS',
      options: filteredOpCenters.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      label: 'Trạm Radar',
      options: filteredRadarStations.map((r) => ({ value: r.id, label: r.name })),
    },
  ], [filteredOpCenters, filteredRadarStations]);

  // Load dropdown lists on mount
  useEffect(() => {
    organizationService.list({ pageSize: 1000 }).then((res) => {
      if (res?.data && Array.isArray(res.data)) setOrgUnits(res.data);
    }).catch(() => {});

    vtsOperationCenterService.getOptions().then((res) => {
      if (Array.isArray(res)) setOpCenters(res.map((c) => ({ id: c.id, name: c.name, orgUnitId: c.orgUnitId })));
    }).catch(() => {});

    radarStationService.getOptions().then((res) => {
      if (Array.isArray(res)) setRadarStations(res.map((r) => ({ id: r.id, name: r.stationName || r.code || r.id, orgUnitId: r.orgUnitId })));
    }).catch(() => {});

    vtsSystemCRUD.getOperatingOrganizationOptions().then((res) => {
      if (Array.isArray(res) && res.length > 0) setOperatingOrganizations(res);
    }).catch(() => {});

    symbolService.list().then((syms) => {
      if (Array.isArray(syms)) setSymbols(syms);
    }).catch(() => {});
  }, []);

  // Initialize or fetch details when opened
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setDetailData(null);
      setExistingAttachments([]);
      setFileList([]);
      setCoordinateList([]);
      return;
    }

    setActiveTab('basic');

    if (initialData?.id) {
      setLoading(true);
      Promise.all([
        aisSystemService.getById(initialData.id),
        aisSystemService.listAttachments(initialData.id),
      ])
        .then(([full, atts]) => {
          setDetailData(full);
          setAttachmentList(atts || []);
          const initialLocId = full.vtsOperationCenterId || full.radarStationId;
          form.setFieldsValue({
            code: full.code,
            name: full.name,
            locationId: initialLocId,
            vtsOperationCenterId: full.vtsOperationCenterId,
            radarStationId: full.radarStationId,
            operatingOrgId: full.operatingOrgId,
            orgUnitId: full.orgUnitId,
            provinceId: full.provinceId,
            unitOfMeasure: full.unitOfMeasure ?? UnitOfMeasure.SET,
            quantity: full.quantity ?? 1,
            model: full.model,
            manufacturer: full.manufacturer,
            commissioningYear: full.commissioningYear ? dayjs(String(full.commissioningYear), 'YYYY') : null,
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
          setCoordinateList(parsedCoords.length > 0 ? parsedCoords : [{ latitude: null, longitude: null }]);
        })
        .catch(() => {
          toast.error('Không thể tải chi tiết hệ thống AIS');
        })
        .finally(() => setLoading(false));
    } else {
      // Create mode
      form.resetFields();
      setDetailData(null);
      setAttachmentList([]);
      setCoordinateList([{ latitude: null, longitude: null }]);
      aisSystemService.generateCode().then((res) => {
        form.setFieldsValue({
          code: res.code,
          conditionStatus: ConditionStatus.OPERATIONAL,
          unitOfMeasure: UnitOfMeasure.SET,
          quantity: 1,
          operatingOrgId: operatingOrganizations[0]?.id,
          geometryType: 'POINT',
          coordinateSystem: 'WGS 84 / VN-2000',
          displayRule: 'Độ, phút, giây (DMS)',
        });
      }).catch(() => {
        form.setFieldsValue({
          conditionStatus: ConditionStatus.OPERATIONAL,
          unitOfMeasure: UnitOfMeasure.SET,
          quantity: 1,
          operatingOrgId: operatingOrganizations[0]?.id,
          geometryType: 'POINT',
          coordinateSystem: 'WGS 84 / VN-2000',
          displayRule: 'Độ, phút, giây (DMS)',
        });
      });
    }
  }, [open, initialData, form]);

  const activeRecord = detailData || initialData;

  // GPS DMS Update Helper
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number, mVal: number, sVal: number) => {
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, dVal));
    const mClamped = Math.min(59, Math.max(0, mVal));
    const sClamped = Math.min(59.9999, Math.max(0, sVal));
    const decimal = dClamped + mClamped / 60 + sClamped / 3600;
    setCoordinateList((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field === 'lat' ? 'latitude' : 'longitude']: decimal };
      return copy;
    });
  };

  const renderDmsInput = (i: number, field: 'lat' | 'lng', record: CoordinateItem) => {
    const v = field === 'lat' ? (record.latitude ?? 0) : (record.longitude ?? 0);
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
          onChange={(x) => updateGpsPoint(i, field, x ?? 0, dms.m, dms.s)}
          style={{ flex: 1, borderRadius: radiusPill }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
        <InputNumber
          value={dms.m}
          min={0}
          max={59}
          precision={0}
          placeholder="Phút"
          controls={false}
          onChange={(x) => updateGpsPoint(i, field, dms.d, x ?? 0, dms.s)}
          style={{ flex: 1 }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
        <InputNumber
          value={dms.s}
          min={0}
          max={59.9999}
          step={0.01}
          placeholder="Giây"
          controls={false}
          onChange={(x) => updateGpsPoint(i, field, dms.d, dms.m, x ?? 0)}
          style={{ flex: 1.2, borderRadius: radiusPill }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span>
      </Space.Compact>
    );
  };

  const handleDeleteExistingAttachment = async (attId: string) => {
    if (!activeRecord?.id) return;
    try {
      await aisSystemService.deleteAttachment(activeRecord.id, attId);
      setExistingAttachments((prev) => prev.filter((a) => a.id !== attId));
      toast.success('Đã xóa tệp đính kèm');
    } catch {
      toast.error('Xóa tệp thất bại');
    }
  };

  // Submit Handler
  const handleSubmit = async (action: 'DRAFT' | 'SUBMIT' | 'APPROVE' | 'UPDATE' = 'DRAFT') => {
    try {
      const values = await form.validateFields();

      if (values.geometryType) {
        const minCount = GEOMETRY_POINT_COUNT[values.geometryType] ?? 1;
        const validCoords = coordinateList.filter(
          (c) => c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude)
        );
        if (validCoords.length < minCount) {
          const typeLabel =
            values.geometryType === 'POLYGON'
              ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ'
              : values.geometryType === 'LINE'
                ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ'
                : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ';
          toast.error(typeLabel);
          setActiveTab('location');
          return;
        }
      }

      setSubmitting(true);

      const geomType = values.geometryType || 'POINT';
      const wkt = serializeCoordinatesToWkt(coordinateList, geomType);

      const commYear = values.commissioningYear
        ? typeof values.commissioningYear === 'number'
          ? values.commissioningYear
          : values.commissioningYear.year()
        : undefined;

      const targetStatus = isEdit
        ? (activeRecord?.approvalStatus || 'APPROVED')
        : action === 'DRAFT'
          ? 'DRAFT'
          : action === 'SUBMIT'
            ? 'PENDING_APPROVAL'
            : 'APPROVED';

      const selectedLocationId = values.locationId;
      let vtsOpCenterId: string | undefined = undefined;
      let radarStId: string | undefined = undefined;

      if (selectedLocationId) {
        if (opCenters.some((c) => c.id === selectedLocationId)) {
          vtsOpCenterId = selectedLocationId;
        } else if (radarStations.some((r) => r.id === selectedLocationId)) {
          radarStId = selectedLocationId;
        } else {
          vtsOpCenterId = selectedLocationId;
        }
      }

      const payload: CreateAisSystemRequest = {
        code: values.code?.trim(),
        name: values.name?.trim(),
        vtsOperationCenterId: vtsOpCenterId,
        radarStationId: radarStId,
        operatingOrgId: values.operatingOrgId || values.orgUnitId || orgUnits[0]?.id,
        orgUnitId: values.orgUnitId,
        provinceId: values.provinceId,
        detailedLocation: values.detailedLocation?.trim(),
        unitOfMeasure: values.unitOfMeasure ?? UnitOfMeasure.SET,
        quantity: values.quantity ?? 1,
        model: values.model?.trim(),
        specifications: values.specifications?.trim(),
        manufacturer: values.manufacturer?.trim(),
        commissioningYear: commYear,
        conditionStatus: values.conditionStatus ?? ConditionStatus.OPERATIONAL,
        maintenanceInfo: values.maintenanceInfo?.trim(),
        note: values.note?.trim(),
        approvalStatus: targetStatus,
        geometryType: geomType,
        coordinates: wkt || undefined,
        symbolId: values.symbolId,
      };

      let resultId: string;
      if (isEdit && activeRecord?.id) {
        await aisSystemService.update(activeRecord.id, payload);
        resultId = activeRecord.id;
        toast.success('Cập nhật hệ thống AIS thành công');
      } else {
        const created = await aisSystemService.create(payload);
        resultId = created.id;
        toast.success(
          action === 'DRAFT'
            ? 'Đã lưu tạm hệ thống AIS'
            : action === 'SUBMIT'
              ? 'Tạo mới và gửi phê duyệt thành công'
              : 'Tạo mới và phê duyệt thành công'
        );
      }

      // Upload pending files if creating new
      if (resultId && isCreate) {
        const pendingFiles = attachmentList.map((a) => a.file).filter(Boolean);
        if (pendingFiles.length > 0) {
          try {
            await aisSystemService.uploadAttachments(resultId, pendingFiles);
          } catch {
            toast.warning('Đã lưu thông tin nhưng tải tệp đính kèm thất bại');
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submit validation error:', err);
      if (err?.errorFields) {
        const fieldNames = err.errorFields.map((f: any) => f.name.join('.')).join(', ');
        toast.error(`Vui lòng kiểm tra lại các trường: ${fieldNames}`);
      } else {
        toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu dữ liệu');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderDetailField = (label: string, value: React.ReactNode, span: number = 12) => (
    <Col span={span} key={label} style={{ marginBottom: 16 }}>
      <div style={{ fontSize: fontSizeSm, color: textSecondary, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary }}>{value || '—'}</div>
    </Col>
  );

  const titleNode = (
    <div style={drawerTitleStyle}>
      {isCreate ? 'Thêm mới Hệ thống trạm bờ AIS' : isEdit ? 'Chỉnh sửa Hệ thống trạm bờ AIS' : 'Chi tiết Hệ thống trạm bờ AIS'}
      {activeRecord?.code && (
        <span style={{ marginLeft: spaceSm, fontSize: fontSizeMd, fontWeight: 400, color: textSecondary }}>
          — {activeRecord.code}
        </span>
      )}
    </div>
  );

  return (
    <AppDrawer
      title={titleNode}
      open={open}
      onClose={onClose}
      width={780}
      extra={
        isView && hasPermission('aissystem:update') && onSwitchToEdit ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={onSwitchToEdit}
            style={{ borderRadius: radiusPill, height: 36, background: actionPrimary, borderColor: actionPrimary }}
          >
            Chỉnh sửa
          </Button>
        ) : null
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spaceSm, width: '100%' }}>
          <Button
            onClick={onClose}
            disabled={submitting}
            style={{ borderRadius: radiusPill, height: 40, padding: '0 20px', borderColor: borderDefault, color: textSecondary }}
          >
            {isView ? 'Đóng' : 'Hủy'}
          </Button>

          {isCreate && (
            <>
              <Button
                onClick={() => handleSubmit('DRAFT')}
                loading={submitting}
                style={{ borderRadius: radiusPill, height: 40, padding: '0 20px', borderColor: borderDefault, color: textPrimary }}
              >
                Lưu tạm
              </Button>
              <Button
                type="primary"
                onClick={() => handleSubmit('SUBMIT')}
                loading={submitting}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40, padding: '0 20px' }}
              >
                Lưu và gửi duyệt
              </Button>
              {canSaveAndApprove && (
                <Button
                  type="primary"
                  onClick={() => handleSubmit('APPROVE')}
                  loading={submitting}
                  style={{ borderRadius: radiusPill, height: 40, padding: '0 20px', background: statusOperational, borderColor: statusOperational }}
                >
                  Lưu và phê duyệt
                </Button>
              )}
            </>
          )}

          {isEdit && (
            <>
              <Button
                type="primary"
                onClick={() => handleSubmit('UPDATE')}
                loading={submitting}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40, padding: '0 20px' }}
              >
                Lưu thay đổi
              </Button>
              {canSaveAndApprove && activeRecord?.approvalStatus === ApprovalStatus.APPROVED && (
                <Button
                  type="primary"
                  onClick={() => handleSubmit('APPROVE')}
                  loading={submitting}
                  style={{ borderRadius: radiusPill, height: 40, padding: '0 20px', background: statusOperational, borderColor: statusOperational }}
                >
                  Lưu và phê duyệt
                </Button>
              )}
            </>
          )}
        </div>
      }
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            conditionStatus: ConditionStatus.OPERATIONAL,
            unitOfMeasure: UnitOfMeasure.SET,
            quantity: 1,
            geometryType: 'POINT',
            coordinateSystem: 'WGS 84 / VN-2000',
            displayRule: 'Độ, phút, giây (DMS)',
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={drawerTabsStyle}
            tabBarStyle={drawerTabBarStyle}
            items={[
              // ── TAB 1: THÔNG TIN CHUNG ─────────────────────────────
              {
                key: 'basic',
                label: 'Thông tin chung',
                children: (
                  <div style={drawerTabContentStyle}>
                    {isView && activeRecord ? (
                      <Row gutter={[24, 0]} style={{ marginBottom: 16 }}>
                        {renderDetailField('Đơn vị quản lý', activeRecord.orgUnitName)}
                        {renderDetailField('Thuộc TTDH VTS / Trạm Radar', activeRecord.vtsOperationCenterName || activeRecord.radarStationName)}
                        {renderDetailField('Đơn vị khai thác', activeRecord.operatingOrgName)}
                        {renderDetailField('Mã thiết bị AIS', <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{activeRecord.code}</span>)}
                        {renderDetailField('Tên thiết bị AIS', <span style={{ fontWeight: fontWeightBold }}>{activeRecord.name}</span>)}
                        {renderDetailField('Địa điểm (Tỉnh/TP)', getProvinceNameById(activeRecord.provinceId))}
                        {renderDetailField('Địa điểm chi tiết', activeRecord.detailedLocation, 24)}
                        {renderDetailField('Ghi chú', activeRecord.note, 24)}
                      </Row>
                    ) : (
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item
                            name="orgUnitId"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Đơn vị quản lý</span>}
                            rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <OrgUnitTreeSelect
                              organizations={orgUnits}
                              placeholder="Chọn đơn vị quản lý"
                              allowClear
                              treeDefaultExpandAll
                              listHeight={256}
                              onChange={() => form.setFieldValue('locationId', undefined)}
                              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="locationId"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Thuộc TTDH VTS / Trạm Radar</span>}
                            rules={[{ required: true, message: 'Vui lòng chọn TTDH VTS hoặc Trạm Radar' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn TTDH VTS hoặc Trạm Radar"
                              allowClear
                              showSearch
                              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                              options={combinedLocationOptions}
                              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="operatingOrgId"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Đơn vị khai thác</span>}
                            rules={[{ required: true, message: 'Vui lòng chọn đơn vị khai thác' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn đơn vị khai thác"
                              allowClear
                              showSearch
                              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                              options={orgUnits.map((o) => ({ value: o.id, label: o.name }))}
                              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="code"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Mã thiết bị AIS</span>}
                            rules={[
                              { required: true, message: 'Vui lòng nhập mã thiết bị' },
                              { max: 50, message: 'Mã tối đa 50 ký tự' },
                            ]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập mã thiết bị..."
                              maxLength={50}
                              style={{ borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="name"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Tên thiết bị AIS</span>}
                            rules={[
                              { required: true, message: 'Vui lòng nhập tên thiết bị' },
                              { max: 255, message: 'Tên tối đa 255 ký tự' },
                            ]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập tên thiết bị..."
                              maxLength={255}
                              style={{ borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="provinceId"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Địa điểm (Tỉnh/TP)</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn Tỉnh/Thành phố"
                              allowClear
                              showSearch
                              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                              options={VIETNAM_PROVINCE_OPTIONS}
                              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={24}>
                          <Form.Item
                            name="detailedLocation"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Địa điểm chi tiết</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập địa điểm chi tiết..."
                              maxLength={255}
                              style={{ borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={24}>
                          <Form.Item
                            name="note"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Ghi chú</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea
                              rows={3}
                              placeholder="Nhập ghi chú nếu có..."
                              maxLength={1000}
                              style={{ ...textAreaStyle, padding: '10px 16px' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}

                    {/* ── KHỐI THÔNG TIN PHÊ DUYỆT (View mode) ──────────────── */}
                    {isView && activeRecord && (
                      <div style={{ marginTop: spaceLg, border: `1px solid ${borderDefault}`, borderRadius: radiusMd, overflow: 'hidden' }}>
                        <div
                          onClick={() => setAuditExpanded(!auditExpanded)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 16px',
                            background: surfacePage,
                            cursor: 'pointer',
                            fontWeight: fontWeightBold,
                            color: colors.sidebarBg,
                            fontSize: fontSizeMd,
                            userSelect: 'none',
                          }}
                        >
                          <span>{auditExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />} Thông tin phê duyệt & Kiểm toán</span>
                          <ApprovalStatusBadge status={activeRecord.approvalStatus} />
                        </div>

                        {auditExpanded && (
                          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: spaceSm, fontSize: fontSizeMd, background: surfaceCard }}>
                            <Row gutter={[16, 8]}>
                              <Col span={12}>
                                <span style={{ color: textSecondary }}>Trạng thái phê duyệt: </span>
                                <span style={{ fontWeight: fontWeightMedium }}><ApprovalStatusBadge status={activeRecord.approvalStatus} /></span>
                              </Col>
                              <Col span={12}>
                                <span style={{ color: textSecondary }}>Ngày cập nhật: </span>
                                <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>
                                  {activeRecord.updatedAt ? dayjs(activeRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                                </span>
                              </Col>
                              <Col span={12}>
                                <span style={{ color: textSecondary }}>Cán bộ cập nhật: </span>
                                <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>
                                  {activeRecord.updatedByName || activeRecord.createdBy || 'Nguyễn Văn An'}
                                </span>
                              </Col>
                              <Col span={12}>
                                <span style={{ color: textSecondary }}>Ngày gửi duyệt: </span>
                                <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>
                                  {activeRecord.approvalStatus !== 'DRAFT' && activeRecord.updatedAt ? dayjs(activeRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                                </span>
                              </Col>
                              <Col span={12}>
                                <span style={{ color: textSecondary }}>Cán bộ duyệt Cảng vụ (C1): </span>
                                <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>
                                  {activeRecord.approverLevel1Name || '—'}
                                </span>
                              </Col>
                              <Col span={12}>
                                <span style={{ color: textSecondary }}>Ngày duyệt Cảng vụ: </span>
                                <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>
                                  {activeRecord.approvedDateLevel1 ? dayjs(activeRecord.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—'}
                                </span>
                              </Col>
                              <Col span={12}>
                                <span style={{ color: textSecondary }}>Cán bộ duyệt Cục (C2): </span>
                                <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>
                                  {activeRecord.approverLevel2Name || '—'}
                                </span>
                              </Col>
                              <Col span={12}>
                                <span style={{ color: textSecondary }}>Ngày duyệt Cục: </span>
                                <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>
                                  {activeRecord.approvedDateLevel2 ? dayjs(activeRecord.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—'}
                                </span>
                              </Col>
                              {activeRecord.rejectionReason && (
                                <Col span={24}>
                                  <div style={{ background: '#FFF1F0', border: '1px solid #FFA39E', borderRadius: radiusSm, padding: '8px 12px', marginTop: 4 }}>
                                    <span style={{ color: statusCritical, fontWeight: fontWeightBold }}>Lý do từ chối: </span>
                                    <span style={{ color: textPrimary }}>{activeRecord.rejectionReason}</span>
                                  </div>
                                </Col>
                              )}
                            </Row>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ),
              },

              // ── TAB 2: THÔNG TIN THIẾT BỊ ────────────────────────────
              {
                key: 'equipment',
                label: 'Thông tin thiết bị',
                children: (
                  <div style={drawerTabContentStyle}>
                    {isView && activeRecord ? (
                      <Row gutter={[24, 0]}>
                        {renderDetailField('Đơn vị tính', activeRecord.unitOfMeasure != null ? (UNIT_OF_MEASURE_MAP[activeRecord.unitOfMeasure] || activeRecord.unitOfMeasure) : '—')}
                        {renderDetailField('Số lượng', activeRecord.quantity ?? '—')}
                        {renderDetailField('Model thiết bị', activeRecord.model)}
                        {renderDetailField('Hãng sản xuất', activeRecord.manufacturer)}
                        {renderDetailField('Năm đưa vào sử dụng', activeRecord.commissioningYear)}
                        {renderDetailField('Tình trạng hoạt động', renderConditionStatusBadge(activeRecord.conditionStatus))}
                        {renderDetailField('Thông số kỹ thuật', activeRecord.specifications, 24)}
                        {renderDetailField('Thông tin bảo trì', activeRecord.maintenanceInfo, 24)}
                      </Row>
                    ) : (
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item
                            name="unitOfMeasure"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Đơn vị tính</span>}
                            rules={[{ required: true, message: 'Vui lòng chọn đơn vị tính' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn đơn vị tính"
                              options={UNIT_OF_MEASURE_OPTIONS}
                              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="quantity"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Số lượng</span>}
                            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber
                              min={0}
                              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                              placeholder="Nhập số lượng..."
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="model"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Model thiết bị</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập model..."
                              maxLength={100}
                              style={{ borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="manufacturer"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Hãng sản xuất</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Nhập hãng sản xuất..."
                              maxLength={100}
                              style={{ borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="commissioningYear"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Năm đưa vào sử dụng</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <DatePicker
                              picker="year"
                              placeholder="Chọn năm"
                              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="conditionStatus"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Tình trạng hoạt động</span>}
                            rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn tình trạng"
                              options={CONDITION_STATUS_OPTIONS}
                              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={24}>
                          <Form.Item
                            name="specifications"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Thông số kỹ thuật</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea
                              rows={3}
                              placeholder="Nhập thông số kỹ thuật chi tiết..."
                              maxLength={500}
                              style={{ ...textAreaStyle, padding: '10px 16px' }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={24}>
                          <Form.Item
                            name="maintenanceInfo"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Thông tin bảo trì</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea
                              rows={3}
                              placeholder="Nhập thông tin bảo trì, bảo dưỡng..."
                              maxLength={1000}
                              style={{ ...textAreaStyle, padding: '10px 16px' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  </div>
                ),
              },

              // ── TAB 3: THÔNG TIN VỊ TRÍ (GIS) ────────────────────────
              {
                key: 'location',
                label: 'Thông tin vị trí',
                children: (
                  <div style={drawerTabContentStyle}>
                    {isView && activeRecord ? (
                      <Row gutter={[24, 0]} style={{ marginBottom: 16 }}>
                        {renderDetailField('Loại đối tượng GIS', activeRecord.geometryType === 'POINT' ? 'Điểm (Point)' : activeRecord.geometryType === 'LINE' ? 'Đường (LineString)' : activeRecord.geometryType === 'POLYGON' ? 'Vùng (Polygon)' : (activeRecord.geometryType || 'Điểm (Point)'))}
                        {renderDetailField('Biểu tượng bản đồ', (() => {
                          const symId = activeRecord.symbolId;
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
                              <span>{activeRecord.symbolId ? `Biểu tượng (${activeRecord.symbolId})` : 'Hệ thống AIS'}</span>
                            </Space>
                          );
                        })())}
                        {renderDetailField('Hệ quy chiếu', 'WGS 84 (EPSG:4326) / VN-2000')}
                        {renderDetailField('Quy tắc hiển thị', 'Độ, phút, giây (DMS)')}
                      </Row>
                    ) : (
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item
                            name="geometryType"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Loại đối tượng GIS</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn loại đối tượng"
                              options={[
                                { value: 'POINT', label: 'Điểm (Point)' },
                                { value: 'LINE', label: 'Đường (LineString)' },
                                { value: 'POLYGON', label: 'Vùng (Polygon)' },
                              ]}
                              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                              onChange={(val) => {
                                form.setFieldValue('geometryType', val);
                                if (val) {
                                  form.setFieldValue('coordinateSystem', 'WGS 84 (EPSG:4326) / VN-2000');
                                  form.setFieldValue('displayRule', 'Độ, phút, giây (DMS)');
                                  const minCount = val === 'POLYGON' ? 3 : (val === 'LINE' ? 2 : 1);
                                  setCoordinateList((prev) => {
                                    if (val === 'POINT') {
                                      return prev.length > 0 ? [prev[0]] : [{ latitude: 20.8651, longitude: 106.6838 }];
                                    }
                                    if (prev.length >= minCount) return prev;
                                    const baseLat = prev[0]?.latitude ?? 20.8651;
                                    const baseLng = prev[0]?.longitude ?? 106.6838;
                                    const delta = 0.005;
                                    if (prev.length === 1 && prev[0].latitude != null && prev[0].longitude != null) {
                                      if (val === 'POLYGON') {
                                        return [
                                          prev[0],
                                          { latitude: baseLat + delta, longitude: baseLng + delta },
                                          { latitude: baseLat - delta, longitude: baseLng + delta },
                                        ];
                                      } else if (val === 'LINE') {
                                        return [
                                          prev[0],
                                          { latitude: baseLat + delta, longitude: baseLng + delta },
                                        ];
                                      }
                                    }
                                    const added = Array.from({ length: minCount - prev.length }, (_, i) => ({
                                      latitude: baseLat + (i + 1) * delta,
                                      longitude: baseLng + (i + 1) * delta,
                                    }));
                                    return [...prev, ...added];
                                  });
                                } else {
                                  form.setFieldValue('symbolId', undefined);
                                }
                              }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="symbolId"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Biểu tượng bản đồ</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn biểu tượng"
                              allowClear
                              options={symbols.map((sym) => ({
                                value: sym.id,
                                label: (
                                  <Space size={6} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    {sym.image ? (
                                      <img
                                        src={sym.image.startsWith('data:') || sym.image.startsWith('http') || sym.image.startsWith('/') ? sym.image : `data:image/png;base64,${sym.image}`}
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
                              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="coordinateSystem"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Hệ quy chiếu</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              disabled
                              defaultValue="WGS 84 (EPSG:4326) / VN-2000"
                              style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="displayRule"
                            label={<span style={{ fontWeight: fontWeightMedium, color: sidebarBg }}>Quy tắc hiển thị</span>}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              disabled
                              defaultValue="Độ, phút, giây (DMS)"
                              style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 40 }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}

                    {/* ── TỌA ĐỘ GPS / DMS ──────────────────────────────── */}
                    <div style={{ marginTop: spaceSm }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spaceSm }}>
                        <div style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
                          Tọa độ các điểm đỉnh:
                        </div>
                        <Space>
                          <Button
                            icon={<EnvironmentOutlined />}
                            onClick={() => setMapModalOpen(true)}
                            style={{ borderRadius: radiusPill, height: 36, borderColor: actionPrimary, color: actionPrimary }}
                          >
                            {isView ? 'Xem vị trí trên bản đồ' : 'Chọn vị trí trên bản đồ'}
                          </Button>
                          {!isView && (
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={() => setCoordinateList((prev) => [...prev, { latitude: null, longitude: null }])}
                              style={{ borderRadius: radiusPill, height: 36 }}
                            >
                              Thêm điểm
                            </Button>
                          )}
                        </Space>
                      </div>

                      <DetailTable
                        scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
                        dataSource={coordinateList.map((c, i) => ({ key: i, index: i + 1, ...c }))}
                        rowKey="index"
                        emptyText="Chưa có dữ liệu tọa độ"
                        columns={[
                          { title: 'STT', dataIndex: 'index', width: 50, align: 'center' },
                          {
                            title: 'Kinh độ (DMS)',
                            key: 'lng_dms',
                            width: 240,
                            render: (_: any, r: any, idx: number) => isView ? formatDmsString(r.longitude) : renderDmsInput(idx, 'lng', r),
                          },
                          {
                            title: 'Vĩ độ (DMS)',
                            key: 'lat_dms',
                            width: 240,
                            render: (_: any, r: any, idx: number) => isView ? formatDmsString(r.latitude) : renderDmsInput(idx, 'lat', r),
                          },
                          {
                            title: 'Độ thập phân',
                            key: 'decimal',
                            width: 170,
                            render: (_: any, r: any) => (
                              <span style={{ fontSize: fontSizeSm, color: textSecondary }}>
                                {r.longitude != null ? r.longitude.toFixed(6) : '—'}, {r.latitude != null ? r.latitude.toFixed(6) : '—'}
                              </span>
                            ),
                          },
                          ...(!isView && coordinateList.length > 1 ? [
                            {
                              title: '',
                              key: 'actions',
                              width: 50,
                              align: 'center' as const,
                              render: (_: any, __: any, idx: number) => (
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => setCoordinateList((prev) => prev.filter((_, i) => i !== idx))}
                                />
                              ),
                            },
                          ] : []),
                        ]}
                      />
                    </div>
                  </div>
                ),
              },

              // ── TAB 4: FILE ĐÍNH KÈM ─────────────────────────────────
              {
                key: 'attachment',
                label: `File đính kèm (${attachmentList.length})`,
                children: (
                  <InfrastructureAttachmentTab
                    attachments={attachmentList}
                    readonly={isView}
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

      {/* GIS Location Selector Modal */}
      {mapModalOpen && (
        <Modal
          title="Chọn vị trí trên bản đồ GIS"
          open={mapModalOpen}
          onCancel={() => setMapModalOpen(false)}
          width={900}
          footer={null}
          destroyOnClose
        >
          <GisLocationSelector
            geometryType={watchedGeom}
            initialCoordinates={coordinateList.filter((c) => c.latitude != null && c.longitude != null) as Array<{ latitude: number; longitude: number }>}
            onSave={(coords) => {
              if (Array.isArray(coords) && coords.length > 0) {
                setCoordinateList(coords);
              }
              setMapModalOpen(false);
            }}
            readOnly={isView}
          />
        </Modal>
      )}
    </AppDrawer>
  );
};

export default AisSystemChkForm;
