import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Form,
  Button,
  Input,
  Select,
  Spin,
  Tabs,
  Row,
  Col,
  Drawer,
  DatePicker,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { focusErrorTab } from '../../utils/formValidationHelper';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { radarStationService } from '../../services/radarStationService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import type {
  VtsSystemResponse,
  CreateVtsSystemRequest,
  UpdateVtsSystemRequest,
} from '../../types/vtsSystem';
import { ApprovalStatus, ConditionStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import {
  drawerTitleStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle,
  requiredMarkStyle, inputStyle,
  drawerTabBarStyle, drawerStyles, drawerFormScrollStyle, spaceFormField, spaceMd, radiusPill, sidebarBg,
  fontWeightBold, fontWeightMedium, fontSizeMd, fontSizeSm,
  textSecondary, textTertiary, textPrimary,
  statusCritical, statusAttention, statusOperational, actionPrimary, textAreaStyle,
  readonlyInputStyle, selectStyle, drawerCloseBtnStyle, statusBadgeStyle,
  generateTempId,
  getDatePickerProps,
  DRAWER_TABLE_SCROLL_Y,
  getConditionStatusColor,
  getConditionStatusLabel,
} from '../../themetokenchk';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import { useAuthStore, type AuthState } from '../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../components/org-unit';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';

const detailTableStyle = `
  .chk-detail-table-card .ant-table table {
    table-layout: fixed !important;
    width: 100% !important;
  }
  .chk-detail-table-card .ant-table-thead > tr > th {
    white-space: nowrap !important;
    padding: 8px 8px !important;
    height: 38px !important;
  }
  .chk-detail-table-card .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
    padding: 6px 8px !important;
    height: 35px !important;
    line-height: 22px !important;
  }
  .chk-detail-table-card .ant-table-tbody > tr.ant-table-measure-row,
  .chk-detail-table-card .ant-table-tbody > tr.ant-table-measure-row > td {
    padding: 0 !important;
    height: 0 !important;
    border: 0 !important;
    line-height: 0 !important;
    font-size: 0 !important;
  }
  .chk-form-table .ant-table-thead > tr > th {
    white-space: nowrap !important;
    background: #f1f5f9 !important;
    font-weight: 600 !important;
    color: #334155 !important;
  }
  .chk-form-table .ant-table-thead > tr > th:last-child,
  .chk-form-table .ant-table-tbody > tr > td:last-child {
    padding-right: 12px !important;
    padding-left: 6px !important;
    text-align: center !important;
    overflow: visible !important;
  }
`;

type VtsDetailCacheWindow = Window & {
  kchtDetailCache?: Record<string, VtsSystemResponse>;
};

const getVtsDetailCache = (): Record<string, VtsSystemResponse> => {
  try {
    const parentWindow = window.parent as VtsDetailCacheWindow;
    parentWindow.kchtDetailCache = parentWindow.kchtDetailCache || {};
    return parentWindow.kchtDetailCache;
  } catch {
    return {};
  }
};

export const invalidateVtsDetailCache = (id?: string | null): void => {
  if (!id) return;
  delete getVtsDetailCache()[id];
};

export interface VtsSystemFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: VtsSystemResponse | null;
  initialDataOnly?: boolean;
  mode?: 'create' | 'edit' | 'detail';
  orgUnits?: any[];
  onCancel?: () => void;
  onSuccess?: () => void;
}

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

export const ConditionStatusBadge: React.FC<{ status?: ConditionStatus | number | string }> = React.memo(({ status }) => {
  const label = getConditionStatusLabel(status);
  const color = getConditionStatusColor(status);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        background: `${color}15`,
        border: `1px solid ${color}40`,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {label}
    </span>
  );
});

export const renderConditionStatusBadge = (status?: ConditionStatus | string | number) => {
  if (status == null || status === '') return <span>—</span>;
  const label = getConditionStatusLabel(status);
  const color = getConditionStatusColor(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        border: `1px solid ${color}40`,
        borderRadius: radiusPill,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        background: `${color}15`,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

export const MaritimeNoticeView: React.FC<{ url?: string; rawValue?: string }> = React.memo(({ url, rawValue }) => {
  if (!url && !rawValue) return <span style={{ color: textTertiary }}>—</span>;
  if (!url) return <span style={{ color: textPrimary }}>{rawValue}</span>;

  return (
    <Button
      type="link"
      icon={<FileTextOutlined style={{ color: actionPrimary }} />}
      onClick={() => window.open(url, '_blank')}
      style={{
        padding: 0,
        height: 'auto',
        color: actionPrimary,
        fontWeight: fontWeightMedium,
        fontSize: fontSizeMd,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {rawValue || 'Xem thông báo hàng hải'}
    </Button>
  );
});

export const PortDisplay: React.FC<{ portId?: string; ports?: any[] }> = React.memo(({ portId, ports = [] }) => {
  const port = ports.find((p) => p.id === portId);
  const displayName = port?.portName || port?.name || portId || '—';
  return (
    <Input
      readOnly
      value={displayName}
      style={{
        ...inputStyle,
        borderRadius: radiusPill,
        height: 40,
        background: '#f8fafc',
        cursor: 'default',
        color: textPrimary,
      }}
    />
  );
});

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

const ZoneCellInput = React.memo(({
  value = '',
  placeholder,
  onChange,
  style,
}: {
  value?: string;
  placeholder?: string;
  onChange: (val: string) => void;
  style?: React.CSSProperties;
}) => {
  const [localVal, setLocalVal] = useState(value || '');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setLocalVal(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalVal(newVal);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(newVal);
    }, 200);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (localVal !== value) {
      onChange(localVal);
    }
  };

  return (
    <Input
      value={localVal}
      placeholder={placeholder}
      onChange={handleChange}
      onBlur={handleBlur}
      style={style}
    />
  );
});

export default function VtsSystemForm({
  open = true,
  editId = null,
  initialData = null,
  initialDataOnly = false,
  mode: propMode = 'create',
  orgUnits: propOrgUnits,
  onCancel,
  onSuccess,
}: VtsSystemFormProps) {
  const currentUser = useAuthStore((state: AuthState) => state.user);
  const userPermissions = (currentUser?.permissions as string[]) || [];
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const [form] = Form.useForm();
  const [record, setRecord] = useState<VtsSystemResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabKey, setTabKey] = useState<string>('general');
  const [detailTabKey, setDetailTabKey] = useState<string>('general');
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('draft');

  const [organizations, setOrganizations] = useState<any[]>(propOrgUnits || []);
  const [operatingOrganizations, setOperatingOrganizations] = useState<any[]>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [rawPorts, setRawPorts] = useState<any[]>([]);
  const [zoneList, setZoneList] = useState<any[]>([]);
  const [attachmentList, setAttachmentList] = useState<any[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<{ id: string; fileName: string }[]>([]);
  const [zonesLoaded, setZonesLoaded] = useState(false);
  const [filesLoaded, setFilesLoaded] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const [otherInfraTypeFilter, setOtherInfraTypeFilter] = useState<string>('VTS_OPERATION_CENTER');
  const [otherInfraPage, setOtherInfraPage] = useState<number>(1);
  const [otherInfraPageSize, setOtherInfraPageSize] = useState<number>(20);
  const [otherInfraTotal, setOtherInfraTotal] = useState<number>(0);
  const [otherInfraList, setOtherInfraList] = useState<Array<{ id: string; type: string; typeLabel: string; name: string }>>([]);
  const [isLoadingOtherInfra, setIsLoadingOtherInfra] = useState(false);
  const [otherInfraError, setOtherInfraError] = useState<string | null>(null);

  const [operationPlanList] = useState<any[]>([]);
  const [maintenancePlanList] = useState<any[]>([]);
  const [incidentList] = useState<any[]>([]);

  const isCreateMode = propMode === 'create';
  const isEditMode = propMode === 'edit';
  const isDetailMode = propMode === 'detail';

  const attachmentsEditable = isCreateMode ||
    record?.approvalStatus === ApprovalStatus.DRAFT ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2 ||
    (record?.approvalStatus === ApprovalStatus.APPROVED && (hasPerm('vts:approvec2') || hasPerm('vts:update')));

  const handleUploadAttachment = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File vượt quá 20MB');
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
      toast.error('Định dạng không hỗ trợ (chỉ chấp nhận PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF)');
      return false;
    }

    (file as any)._tempId = generateTempId('temp');
    setPendingFiles((prev) => [...prev, file]);
    const newAttachment = {
      id: (file as any)._tempId,
      fileName: file.name,
      fileSize: file.size,
      uploadedByName: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
      uploadedDate: new Date().toISOString(),
    };
    setAttachmentList((prev) => [...prev, newAttachment]);
    toast.success(`Đã thêm tệp ${file.name}`);
    return false;
  };

  const handleDeleteAttachment = async (attId: string) => {
    if (!isCreateMode && !attachmentsEditable) {
      toast.error('Không có quyền xóa tệp đính kèm');
      return;
    }
    const targetAtt = attachmentList.find((a) => a.id === attId);
    if (String(attId).startsWith('temp-') || pendingFiles.some((f) => (f as any)._tempId === attId)) {
      setPendingFiles((prev) => prev.filter((f) => (f as any)._tempId !== attId && f.name !== attId));
    } else if (targetAtt) {
      setPendingDeletedAttachments((prev) => [...prev, { id: attId, fileName: targetAtt.fileName }]);
    }
    setAttachmentList((prev) => prev.filter((a) => a.id !== attId));
    toast.success('Đã xóa tệp đính kèm');
  };

  const canSaveAndApprove = userPermissions.includes('vts:approvec2');

  // Load options
  useEffect(() => {
    let mounted = true;
    const fetchLookups = async () => {
      try {
        const promises: Promise<any>[] = [
          vtsSystemCRUD.getOperatingOrganizationOptions(),
          vtsSystemCRUD.getScopedPortOptions(),
        ];
        if (!propOrgUnits || propOrgUnits.length === 0) {
          promises.push(vtsSystemCRUD.getScopedOrgUnitOptions());
        }

        const results = await Promise.all(promises);
        if (!mounted) return;

        const opOrgs = results[0];
        const ports = results[1];
        if (opOrgs && opOrgs.length > 0) setOperatingOrganizations(opOrgs);
        if (ports && ports.length > 0) setRawPorts(ports);

        if (!propOrgUnits || propOrgUnits.length === 0) {
          const orgs = results[2];
          if (orgs && orgs.length > 0) setOrganizations(orgs);
        }
      } catch (err) {
        console.warn('Failed to load lookups in VtsSystemForm', err);
      }
    };
    fetchLookups();
    return () => { mounted = false; };
  }, [propOrgUnits]);

  // Load record detail or generate code on create
  useEffect(() => {
    let mounted = true;
    if (!open) return;

    if (isCreateMode) {
      form.resetFields();
      form.setFieldsValue({
        conditionStatus: ConditionStatus.OPERATIONAL,
      });
      setRecord(null);
      setZoneList([]);
      setAttachmentList([]);
      setPendingFiles([]);
      setZonesLoaded(true);
      setFilesLoaded(true);
      setTabKey('general');
      setDetailTabKey('general');
      vtsSystemCRUD.generateCode()
        .then((res) => {
          if (mounted && res?.code) {
            form.setFieldsValue({
              code: res.code,
              conditionStatus: ConditionStatus.OPERATIONAL,
            });
          }
        })
        .catch(() => {
          if (mounted) {
            form.setFieldsValue({
              conditionStatus: ConditionStatus.OPERATIONAL,
            });
          }
        });
      return () => { mounted = false; };
    }

    if (!editId || initialDataOnly) {
      if (initialData) {
        setRecord(initialData);
        populateForm(initialData);
      }
      return () => { mounted = false; };
    }

    setIsLoading(true);
    setZonesLoaded(false);
    setFilesLoaded(false);
    vtsSystemCRUD.getById(editId, { includeZones: true, includeAttachments: true })
      .then((data) => {
        if (!mounted) return;
        setRecord(data);
        populateForm(data);
        // Chi tiết đã kèm sẵn vùng VTS và tài liệu đính kèm — dùng luôn thay vì
        // để hai effect lazy-load gọi lại /zones và /attachments khi đổi tab.
        if (Array.isArray(data.zones)) {
          setZoneList(data.zones.map((z: any, idx: number) => ({
            ...z,
            code: z.code || `VTS-Z0${idx + 1}`,
            name: z.name || '',
            conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
            status: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
          })));
          setZonesLoaded(true);
        }
        if (Array.isArray(data.attachments)) {
          setAttachmentList(data.attachments);
          setFilesLoaded(true);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        toast.error(err instanceof Error ? err.message : 'Không tải được dữ liệu chi tiết');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
  }, [editId, initialData, initialDataOnly, isCreateMode, open]);

  // Lazy load zones khi người dùng chuyển sang tab zones
  useEffect(() => {
    if (!editId || zonesLoaded) return;
    const currentTab = isDetailMode ? detailTabKey : tabKey;
    if (currentTab === 'zones') {
      setIsLoadingZones(true);
      vtsSystemCRUD.getZones(editId)
        .then((zones) => {
          setZoneList(
            (zones || []).map((z: any, idx: number) => ({
              ...z,
              code: z.code || `VTS-Z0${idx + 1}`,
              name: z.name || '',
              conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
              status: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
            }))
          );
          setZonesLoaded(true);
        })
        .catch(() => {})
        .finally(() => setIsLoadingZones(false));
    }
  }, [editId, detailTabKey, tabKey, zonesLoaded, isDetailMode]);

  // Lazy load attachments khi người dùng chuyển sang tab files
  useEffect(() => {
    if (!editId || filesLoaded) return;
    const currentTab = isDetailMode ? detailTabKey : tabKey;
    if (currentTab === 'files') {
      setIsLoadingFiles(true);
      vtsSystemCRUD.getAttachments(editId)
        .then((files) => {
          setAttachmentList(files || []);
          setFilesLoaded(true);
        })
        .catch(() => {})
        .finally(() => setIsLoadingFiles(false));
    }
  }, [editId, detailTabKey, tabKey, filesLoaded, isDetailMode]);

  // Tải danh sách kết cấu hạ tầng con thuộc loại đối tượng đang chọn (phân trang 20 bản ghi)
  useEffect(() => {
    if (!editId || !isDetailMode || detailTabKey !== 'otherInfra') return;

    let cancelled = false;
    setIsLoadingOtherInfra(true);
    setOtherInfraError(null);

    const fetchOtherInfra = async () => {
      try {
        if (otherInfraTypeFilter === 'VTS_OPERATION_CENTER') {
          const res = await vtsOperationCenterService.search({
            vtsSystemId: editId,
            page: otherInfraPage,
            size: otherInfraPageSize,
          });
          if (cancelled) return;
          const items = (res.items || []).map((item: any) => ({
            id: item.id,
            type: 'VTS_OPERATION_CENTER',
            typeLabel: 'Trung tâm điều hành VTS',
            name: item.name || item.code || '—',
          }));
          setOtherInfraList(items);
          setOtherInfraTotal(res.total || items.length);
        } else if (otherInfraTypeFilter === 'RADAR_STATION') {
          const res = await radarStationService.search({
            vtsSystemId: editId,
            page: otherInfraPage,
            size: otherInfraPageSize,
          });
          if (cancelled) return;
          const items = (res.items || []).map((item: any) => ({
            id: item.id,
            type: 'RADAR_STATION',
            typeLabel: 'Trạm Radar VTS',
            name: item.stationName || item.name || item.code || '—',
          }));
          setOtherInfraList(items);
          setOtherInfraTotal(res.total || items.length);
        }
      } catch (err: any) {
        if (cancelled) return;
        setOtherInfraList([]);
        setOtherInfraTotal(0);
        setOtherInfraError('Không tải được danh sách kết cấu hạ tầng liên quan.');
      } finally {
        if (!cancelled) setIsLoadingOtherInfra(false);
      }
    };

    fetchOtherInfra();
    return () => {
      cancelled = true;
    };
  }, [editId, detailTabKey, otherInfraTypeFilter, otherInfraPage, otherInfraPageSize, isDetailMode]);

  const populateForm = (data: VtsSystemResponse) => {
    form.setFieldsValue({
      orgUnitId: data.orgUnitId ? String(data.orgUnitId) : undefined,
      owningOrgId: (data.owningOrgId || data.orgUnitId) ? String(data.owningOrgId || data.orgUnitId) : undefined,
      operatingOrgId: data.operatingOrgId ? String(data.operatingOrgId) : undefined,
      portId: data.portId ? String(data.portId) : undefined,
      code: data.code,
      systemName: data.systemName,
      provinceId: data.provinceId !== undefined && data.provinceId !== null ? String(data.provinceId) : undefined,
      address: data.address,
      operationStartDate: data.operationStartDate ? dayjs(data.operationStartDate) : undefined,
      scope: data.scope,
      maritimeNotice: data.maritimeNotice,
      conditionStatus: data.conditionStatus || ConditionStatus.OPERATIONAL,
      note: data.note,
    });

    // Ensure organizations contains orgUnitId and owningOrgId with names so TreeSelect displays name
    setOrganizations((prev) => {
      const list = [...prev];
      let changed = false;
      if (data.orgUnitId && !list.some((o) => String(o.id) === String(data.orgUnitId))) {
        list.push({
          id: String(data.orgUnitId),
          name: data.orgUnitName || 'Đơn vị quản lý',
          code: (data as any).orgUnitCode || undefined,
        });
        changed = true;
      }
      if (data.owningOrgId && !list.some((o) => String(o.id) === String(data.owningOrgId))) {
        list.push({
          id: String(data.owningOrgId),
          name: data.owningOrgName || data.orgUnitName || 'Đơn vị chủ quản',
        });
        changed = true;
      }
      return changed ? list : prev;
    });

    if (data.operatingOrgId) {
      setOperatingOrganizations((prev) => {
        if (!prev.some((o) => String(o.id) === String(data.operatingOrgId))) {
          return [
            ...prev,
            {
              id: String(data.operatingOrgId),
              name: data.operatingOrgName || (data as any).operatingUnitName || 'Đơn vị vận hành',
              code: (data as any).operatingOrgCode || '',
            },
          ];
        }
        return prev;
      });
    }

    if (data.zones && data.zones.length > 0) {
      setZoneList(
        data.zones.map((z: any, idx: number) => ({
          ...z,
          code: z.code || `VTS-Z0${idx + 1}`,
          name: z.name || '',
          conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
          status: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
        }))
      );
      setZonesLoaded(true);
    } else {
      setZoneList([]);
      setZonesLoaded(true);
    }

    if (data.attachments && data.attachments.length > 0) {
      setAttachmentList(data.attachments);
      setFilesLoaded(true);
    } else {
      setAttachmentList([]);
      setFilesLoaded(true);
    }
  };

  useEffect(() => {
    if (propOrgUnits && propOrgUnits.length > 0) {
      setOrganizations(propOrgUnits);
    }
  }, [propOrgUnits]);

  const operatingUnitOptions = useMemo(() => {
    const list: Array<{ value: string; label: string }> = [];
    const seen = new Set<string>();

    if (Array.isArray(organizations)) {
      organizations.forEach((o) => {
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
        label: record.operatingOrgName || (record as any).operatingUnitName || 'Đơn vị vận hành',
      });
    }

    return list;
  }, [organizations, operatingOrganizations, record?.operatingOrgId, record?.operatingOrgName]);

  const getOperatingOrgDisplayName = (r: VtsSystemResponse | null) => {
    if (!r) return '—';
    if (r.operatingOrgName) return r.operatingOrgName;
    if (r.operatingOrgId) {
      const foundOrg = organizations?.find((o) => String(o.id) === String(r.operatingOrgId));
      if (foundOrg?.name) return foundOrg.name;
      const foundOp = operatingOrganizations?.find((o) => String(o.id) === String(r.operatingOrgId));
      if (foundOp?.name) return foundOp.name;
    }
    return (r as any).operatingUnitName || (r.operatingOrgId ? String(r.operatingOrgId) : '—');
  };

  const selectedOrgUnitId = Form.useWatch('orgUnitId', form);
  const effectiveOrgUnitId = selectedOrgUnitId || record?.orgUnitId;

  const filteredPortOptions = useMemo(() => {
    let list = rawPorts;
    if (effectiveOrgUnitId) {
      const allowedOrgIds = resolveOrgSubtreeIds(organizations, effectiveOrgUnitId);
      list = list.filter((p) => p.orgUnitId && allowedOrgIds.has(String(p.orgUnitId)));
    }
    return list.map((p) => ({
      value: p.id,
      label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id),
    }));
  }, [rawPorts, effectiveOrgUnitId, organizations]);

  const handleSubmitForm = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload: CreateVtsSystemRequest = {
        orgUnitId: values.orgUnitId,
        owningOrgId: values.owningOrgId || values.orgUnitId,
        operatingOrgId: values.operatingOrgId,
        portId: values.portId,
        code: values.code,
        systemName: values.systemName,
        provinceId: Number(values.provinceId),
        address: values.address,
        operationStartDate: values.operationStartDate ? dayjs(values.operationStartDate).format('YYYY-MM-DD') : undefined,
        scope: values.scope,
        maritimeNotice: values.maritimeNotice,
        conditionStatus: values.conditionStatus,
        note: values.note,
        zones: zoneList.map((z: any) => ({
          id: (z.id && !String(z.id).startsWith('temp-') && !String(z.id).startsWith('zone-')) ? z.id : undefined,
          code: z.code,
          name: z.name,
          conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
        })),
      };

      if (isCreateMode) {
        const created = await vtsSystemCRUD.create({
          ...payload,
          approvalStatus: ApprovalStatus.DRAFT,
        });
        if (pendingFiles.length > 0 && created?.id) {
          try {
            await Promise.all(pendingFiles.map((file) => vtsSystemCRUD.uploadAttachment(created.id, file)));
          } catch (uploadErr) {
            console.warn('Failed to upload some pending files on create', uploadErr);
          }
        }
        if (actionTypeRef.current === 'submit' && created?.id) {
          await vtsSystemApproval.submit(created.id);
        } else if (actionTypeRef.current === 'approve' && created?.id) {
          await vtsSystemApproval.submit(created.id).catch(() => {});
          await vtsSystemApproval.approveC2(created.id, { decision: 'APPROVED', reason: 'Lưu và phê duyệt trực tiếp' });
        }
        const msg =
          actionTypeRef.current === 'draft'
            ? 'Lưu tạm hệ thống VTS thành công'
            : actionTypeRef.current === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : 'Lưu và phê duyệt thành công';
        toast.success(msg);
        onSuccess?.();
      } else if (editId) {
        await vtsSystemCRUD.update(editId, payload as UpdateVtsSystemRequest);
        if (pendingDeletedAttachments.length > 0) {
          try {
            await Promise.all(pendingDeletedAttachments.map((a) => vtsSystemCRUD.deleteAttachment(editId, a.id)));
          } catch (delErr) {
            console.warn('Failed to delete some attachments on edit', delErr);
          }
        }
        if (pendingFiles.length > 0) {
          try {
            await Promise.all(pendingFiles.map((file) => vtsSystemCRUD.uploadAttachment(editId, file)));
          } catch (uploadErr) {
            console.warn('Failed to upload some pending files on edit', uploadErr);
          }
        }
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
        toast.success('Cập nhật thành công');
        onSuccess?.();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadAttachment = async (attId?: string, fileName?: string) => {
    if (!attId) {
      toast.warning('Không tìm thấy mã tệp đính kèm');
      return;
    }
    try {
      if (editId) {
        await vtsSystemCRUD.downloadAttachment(editId, attId, fileName);
      } else {
        toast.info('Tệp đính kèm mới tải lên');
      }
    } catch {
      toast.error('Lỗi khi tải xuống tệp đính kèm');
    }
  };

  // ── Render Detail Mode Content ───────────────────────────────────
  const renderDetailContent = () => {
    if (!record) return null;

    const displayZones = zoneList || [];
    const displayAttachments = attachmentList || [];

    return (
      <div>
        <style>{detailTableStyle}</style>
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
                    {/* 1. Mã hệ thống VTS */}
                    <div className="chk-detail-row"><span className="chk-detail-label">Mã hệ thống VTS</span><span className="chk-detail-value">{record.code || '—'}</span></div>
                    {/* 2. Tên hệ thống VTS */}
                    <div className="chk-detail-row"><span className="chk-detail-label">Tên hệ thống VTS</span><span className="chk-detail-value">{record.systemName || '—'}</span></div>
                    
                    {/* 3. Đơn vị quản lý */}
                    <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị quản lý</span><span className="chk-detail-value">{record.orgUnitName || '—'}</span></div>
                    {/* 4. Đơn vị chủ quản */}
                    <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị chủ quản</span><span className="chk-detail-value">{record.owningOrgName || '—'}</span></div>

                    {/* 5. Đơn vị vận hành */}
                    <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị vận hành</span><span className="chk-detail-value">{getOperatingOrgDisplayName(record)}</span></div>
                    {/* 6. Thuộc cảng biển */}
                    <div className="chk-detail-row"><span className="chk-detail-label">Thuộc cảng biển</span><span className="chk-detail-value">{record.portName || '—'}</span></div>

                    {/* 7. Địa điểm (Tỉnh/TP) */}
                    <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm (Tỉnh/TP)</span><span className="chk-detail-value">{record.province || (record.provinceId ? getProvinceNameById(record.provinceId) : '—')}</span></div>
                    {/* 8. Địa điểm chi tiết */}
                    <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm chi tiết</span><span className="chk-detail-value">{record.address || '—'}</span></div>

                    {/* 9. Thời gian bắt đầu hoạt động */}
                    <div className="chk-detail-row"><span className="chk-detail-label">Thời gian bắt đầu hoạt động</span><span className="chk-detail-value">{record.operationStartDate ? dayjs(record.operationStartDate).format('DD/MM/YYYY') : '—'}</span></div>
                    <div style={{ border: 'none' }} />

                    {/* 10. Phạm vi áp dụng */}
                    <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Phạm vi áp dụng</span><span className="chk-detail-value">{record.scope || '—'}</span></div>

                    {/* 11. Thông báo hàng hải */}
                    <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Thông báo hàng hải</span><span className="chk-detail-value">{record.maritimeNotice || '—'}</span></div>

                    {/* 12. Tình trạng */}
                    <div className="chk-detail-row"><span className="chk-detail-label">Tình trạng</span><span className="chk-detail-value">{renderConditionStatusBadge(record.conditionStatus)}</span></div>
                    <div style={{ border: 'none' }} />

                    {/* 13. Ghi chú */}
                    <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Ghi chú</span><span className="chk-detail-value">{record.note || '—'}</span></div>
                  </div>
                </div>
              ),
            },
            {
              key: 'zones',
              label: 'Thông tin vùng VTS',
              children: (
                <DetailTable
                  scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
                  dataSource={displayZones}
                  emptyText={isLoadingZones ? "Đang tải dữ liệu vùng VTS..." : "Chưa có dữ liệu vùng VTS"}
                  rowKey={(r: any) => r.id || r.code || r.name}
                  columns={[
                    { title: 'STT', width: 60, align: 'center' },
                    { title: 'Mã vùng', dataIndex: 'code', key: 'code', width: 200, render: (v) => v || '—' },
                    {
                      title: 'Tên vùng VTS',
                      dataIndex: 'name',
                      key: 'name',
                      width: 440,
                      render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span>,
                    },
                    {
                      title: 'Tình trạng',
                      key: 'conditionStatus',
                      width: 180,
                      render: (_v, r: any) => renderConditionStatusBadge(r.conditionStatus || r.status || ConditionStatus.OPERATIONAL),
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
                  attachments={displayAttachments}
                  readonly={true}
                  isLoading={isLoadingFiles}
                  onDownload={handleDownloadAttachment}
                />
              ),
            },
            {
              key: 'otherInfra',
              label: 'Danh sách KCHT khác thuộc VTS',
              children: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 38, marginBottom: 12 }}>
                    <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, whiteSpace: 'nowrap' }}>
                      Loại đối tượng
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
                        { value: 'VTS_OPERATION_CENTER', label: 'Trung tâm điều hành VTS' },
                        { value: 'RADAR_STATION', label: 'Trạm Radar VTS' },
                      ]}
                      style={{ ...selectStyle, width: 280, height: 38 }}
                    />
                  </div>
                  {otherInfraError && <Alert type="warning" showIcon message={otherInfraError} style={{ marginBottom: spaceMd }} />}
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
                    loading={isLoadingOtherInfra}
                    emptyText={isLoadingOtherInfra ? 'Đang tải dữ liệu KCHT khác...' : 'Chưa có kết cấu hạ tầng khác thuộc hệ thống VTS'}
                    rowKey={(r: any) => r.id || `${r.type}-${r.name}`}
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
                              title: 'Mã kế hoạch vận hành khai thác',
                              dataIndex: 'planCode',
                              key: 'planCode',
                              width: 240,
                              render: (v: string, r: any) => <span style={{ color: textPrimary }}>{v || r.code || '—'}</span>,
                            },
                            {
                              title: 'Tên kế hoạch vận hành khai thác',
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
                              title: 'Ngày bắt đầu vận hành khai thác dự kiến',
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
                              title: 'Ngày kết thúc vận hành khai thác dự kiến',
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
                              title: 'Mã kế hoạch bảo trì',
                              dataIndex: 'planCode',
                              key: 'planCode',
                              width: 240,
                              render: (v: string, r: any) => <span style={{ color: textPrimary }}>{v || r.code || '—'}</span>,
                            },
                            {
                              title: 'Tên kế hoạch bảo trì',
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
                              title: 'Thời gian bắt đầu bảo trì dự kiến',
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
                              title: 'Thời gian kết thúc bảo trì dự kiến',
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
                              title: 'Địa điểm xảy ra sự cố',
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
                              title: 'Thời gian xảy ra sự cố',
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
                    {/* 30. Trạng thái phê duyệt */}
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Trạng thái phê duyệt</span>
                      <span className="chk-detail-value">{renderApprovalBadge(record.approvalStatus)}</span>
                    </div>
                    <div style={{ border: 'none' }} />

                    {/* 31. Ngày cập nhật & 32. Cán bộ cập nhật */}
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Ngày cập nhật</span>
                      <span className="chk-detail-value">
                        {record.updatedDate
                          ? dayjs(record.updatedDate).format('DD/MM/YYYY HH:mm:ss')
                          : record.createdDate
                          ? dayjs(record.createdDate).format('DD/MM/YYYY HH:mm:ss')
                          : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Cán bộ cập nhật</span>
                      <span className="chk-detail-value">{record.updatedByName || record.createdByName || '—'}</span>
                    </div>

                    {/* 33. Ngày gửi phê duyệt & 34. Cán bộ gửi phê duyệt */}
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Ngày gửi phê duyệt</span>
                      <span className="chk-detail-value">
                        {record.submittedDate ? dayjs(record.submittedDate).format('DD/MM/YYYY HH:mm:ss') : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Cán bộ gửi phê duyệt</span>
                      <span className="chk-detail-value">{record.submittedByName || record.createdByName || '—'}</span>
                    </div>

                    {/* 35. Ngày phê duyệt cấp Cảng vụ/Chi cục & 36. Cán bộ phê duyệt cấp Cảng vụ/Chi cục */}
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

                    {/* 37. Nội dung phê duyệt (Cảng vụ/Chi cục) */}
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label">Nội dung phê duyệt</span>
                      <span className="chk-detail-value">
                        {record.approvalContentLevel1 || '—'}
                      </span>
                    </div>

                    {/* 38. Ngày phê duyệt cấp Cục & 39. Cán bộ phê duyệt cấp Cục */}
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

                    {/* 40. Nội dung phê duyệt (Cục) */}
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label">Nội dung phê duyệt</span>
                      <span className="chk-detail-value">
                        {record.approvalContentLevel2 || '—'}
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
          ]}
        />
      </div>
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
              ? (record?.systemName ? `Xem chi tiết — ${record.systemName}` : 'Xem chi tiết hệ thống VTS')
              : isCreateMode
                ? 'Thêm mới hệ thống VTS'
                : (record?.systemName ? `Chỉnh sửa — ${record.systemName}` : 'Chỉnh sửa hệ thống VTS')}
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
      <style>{detailTableStyle}</style>
      <Spin spinning={isLoading}>
        {isDetailMode ? renderDetailContent() : (
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              conditionStatus: ConditionStatus.OPERATIONAL,
            }}
            onFinish={handleSubmitForm}
            onFinishFailed={(errorInfo) => {
              focusErrorTab(
                errorInfo,
                {
                  general: [
                    'code',
                    'systemName',
                    'orgUnitId',
                    'owningOrgId',
                    'operatingOrgId',
                    'portId',
                    'provinceId',
                    'address',
                    'operationStartDate',
                    'scope',
                    'maritimeNotice',
                    'conditionStatus',
                    'note',
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
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã hệ thống VTS</span>}
                            name="code"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Mã tự sinh"
                              disabled={true}
                              maxLength={50}
                              style={readonlyInputStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên hệ thống VTS</span>}
                            name="systemName"
                            rules={[{ required: true, message: 'Vui lòng nhập tên hệ thống VTS' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Nhập tên hệ thống VTS" maxLength={255} showCount style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị quản lý</span>}
                            name="orgUnitId"
                            rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <OrgUnitTreeSelect
                              organizations={organizations}
                              placeholder="Chọn đơn vị quản lý"
                              disabled={isEditMode}
                              popupMatchSelectWidth={true}
                              style={selectStyle}
                              onChange={(val) => {
                                form.setFieldValue('orgUnitId', val);
                                const curPort = form.getFieldValue('portId');
                                if (curPort && !rawPorts.some((p) => p.id === curPort && String(p.orgUnitId) === String(val))) {
                                  form.setFieldValue('portId', undefined);
                                }
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị chủ quản</span>}
                            name="owningOrgId"
                            rules={[{ required: true, message: 'Vui lòng chọn đơn vị chủ quản' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <OrgUnitTreeSelect
                              organizations={organizations}
                              placeholder="Chọn đơn vị chủ quản"
                              popupMatchSelectWidth={true}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị vận hành</span>}
                            name="operatingOrgId"
                            rules={[{ required: true, message: 'Vui lòng chọn đơn vị vận hành' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              showSearch
                              allowClear
                              placeholder="Chọn đơn vị vận hành"
                              filterOption={(input, option) => normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))}
                              options={operatingUnitOptions}
                              style={selectStyle}
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
                              placeholder={!effectiveOrgUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : 'Chọn cảng biển'}
                              disabled={!effectiveOrgUnitId}
                              allowClear
                              showSearch
                              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                              options={filteredPortOptions}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm (Tỉnh/TP)</span>}
                            name="provinceId"
                            rules={[{ required: true, message: 'Vui lòng chọn địa điểm' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              showSearch
                              allowClear
                              placeholder="Chọn địa điểm"
                              filterOption={(input, option) => normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))}
                              options={VIETNAM_PROVINCE_OPTIONS}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                            name="address"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thời gian bắt đầu hoạt động</span>}
                            name="operationStartDate"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <DatePicker
                              {...getDatePickerProps({
                                placeholder: 'Chọn thời gian bắt đầu hoạt động',
                                getPopupContainer: (trigger: HTMLElement) => trigger.parentElement || document.body,
                              })}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Phạm vi áp dụng</span>}
                            name="scope"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={3} placeholder="Nhập phạm vi áp dụng" showCount maxLength={2000} style={textAreaStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thông báo hàng hải</span>}
                            name="maritimeNotice"
                            rules={[{ required: true, message: 'Vui lòng nhập thông báo hàng hải' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input.TextArea rows={3} placeholder="Nhập thông báo hàng hải" showCount maxLength={2000} style={textAreaStyle} />
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
                              placeholder="Chọn tình trạng"
                              options={CONDITION_STATUS_OPTIONS}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                            name="note"
                            style={{ marginBottom: 0 }}
                          >
                            <Input.TextArea rows={3} placeholder="Nhập ghi chú" showCount maxLength={2000} style={textAreaStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: 'zones',
                  label: 'Thông tin vùng VTS',
                  children: (
                    <DetailTable
                      scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
                      dataSource={zoneList}
                      emptyText="Chưa có dữ liệu vùng VTS"
                      rowKey={(r: any) => r.id || r._key || r.code || r.name}
                      headerNode={
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, height: 32, boxSizing: 'border-box' }}>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setZoneList((prev) => [
                                ...prev,
                                {
                                  id: generateTempId('zone'),
                                  code: '',
                                  name: '',
                                  conditionStatus: ConditionStatus.OPERATIONAL,
                                  status: ConditionStatus.OPERATIONAL,
                                },
                              ]);
                            }}
                            style={{
                              ...primaryButtonStyle,
                              height: 32,
                              fontSize: fontSizeSm,
                              padding: '0 14px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            Thêm vùng VTS
                          </Button>
                        </div>
                      }
                      columns={[
                        {
                          title: 'STT',
                          width: 60,
                          align: 'center',
                        },
                        {
                          title: 'Mã vùng',
                          dataIndex: 'code',
                          key: 'code',
                          width: 200,
                          render: (val, r: any) => (
                            <ZoneCellInput
                              value={val}
                              placeholder="Nhập mã vùng"
                              onChange={(text) => {
                                setZoneList((prev) =>
                                  prev.map((item) =>
                                    item === r || (r.id && item.id === r.id) || (r._key && item._key === r._key)
                                      ? { ...item, code: text }
                                      : item
                                  )
                                );
                              }}
                              style={{ borderRadius: radiusPill, height: 32 }}
                            />
                          ),
                        },
                        {
                          title: 'Tên vùng VTS',
                          dataIndex: 'name',
                          key: 'name',
                          width: 440,
                          render: (val, r: any) => (
                            <ZoneCellInput
                              value={val}
                              placeholder="Nhập tên vùng VTS"
                              onChange={(text) => {
                                setZoneList((prev) =>
                                  prev.map((item) =>
                                    item === r || (r.id && item.id === r.id) || (r._key && item._key === r._key)
                                      ? { ...item, name: text }
                                      : item
                                  )
                                );
                              }}
                              style={{ borderRadius: radiusPill, height: 32 }}
                            />
                          ),
                        },
                        {
                          title: 'Tình trạng',
                          key: 'conditionStatus',
                          width: 180,
                          render: (_val, r: any) => (
                            <Select
                              value={r.conditionStatus || r.status || ConditionStatus.OPERATIONAL}
                              options={CONDITION_STATUS_OPTIONS}
                              onChange={(selVal) => {
                                setZoneList((prev) =>
                                  prev.map((item) =>
                                    item === r || (r.id && item.id === r.id) || (r._key && item._key === r._key)
                                      ? { ...item, conditionStatus: selVal, status: selVal }
                                      : item
                                  )
                                );
                              }}
                              style={{ width: '100%', borderRadius: radiusPill, height: 32 }}
                            />
                          ),
                        },
                        {
                          title: '',
                          width: 60,
                          align: 'center',
                          render: (_v, r: any) => (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                                style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => setZoneList((prev) => prev.filter((item) => !(item === r || (r.id && item.id === r.id) || (r._key && item._key === r._key))))}
                                title="Xóa vùng VTS"
                              />
                            </div>
                          ),
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
                      attachments={attachmentList}
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
    </Drawer>
  );
}
