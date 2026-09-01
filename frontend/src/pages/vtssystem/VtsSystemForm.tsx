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
} from 'antd';
import { PlusOutlined, DeleteOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { focusErrorTab } from '../../utils/formValidationHelper';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { radarStationService } from '../../services/radarStationService';
import { aisSystemService } from '../../services/aisSystemService';
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
  drawerTabBarStyle, drawerStyles, drawerFormScrollStyle, spaceFormField, radiusPill, sidebarBg,
  fontWeightBold, fontWeightMedium, fontSizeMd, fontSizeSm,
  textSecondary, textTertiary, textPrimary,
  statusCritical, statusAttention, statusOperational, actionPrimary, textAreaStyle,
  readonlyInputStyle, selectStyle, drawerCloseBtnStyle, statusBadgeStyle,
  generateTempId,
  getDatePickerProps,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { OrgUnitTreeSelect, normalizeSearchText } from '../../components/org-unit';
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
};

export const ConditionStatusBadge: React.FC<{ status?: ConditionStatus | number }> = React.memo(({ status }) => {
  const normStatus = status != null ? Number(status) : ConditionStatus.OPERATIONAL;
  const label = CONDITION_STATUS_MAP[normStatus] || 'Đang hoạt động';
  const color = CONDITION_COLOR[normStatus] || statusOperational;

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

export const renderConditionStatusBadge = (status?: ConditionStatus | string) => {
  if (status == null || status === '') return <span>—</span>;
  const key = String(status);
  const label = (key === '1' || key === 'OPERATIONAL') ? 'Đang hoạt động' : (key === '2' || key === 'MAINTENANCE') ? 'Đang bảo trì' : (key === '0' || key === 'STOPPED') ? 'Dừng hoạt động' : (key === '3' || key === 'UNDER_CONSTRUCTION') ? 'Đang xây dựng' : key;
  const color = (key === '1' || key === 'OPERATIONAL') ? statusOperational : (key === '2' || key === 'MAINTENANCE') ? statusAttention : (key === '0' || key === 'STOPPED') ? statusCritical : (key === '3' || key === 'UNDER_CONSTRUCTION') ? actionPrimary : textSecondary;
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
    PENDING_APPROVAL: { label: 'Chờ Cảng vụ duyệt', color: statusAttention },
    APPROVED_LEVEL1: { label: 'Chờ Cục duyệt', color: '#0082fb' },
    APPROVED: { label: 'Đã duyệt', color: statusOperational },
    REJECTED_LEVEL1: { label: 'Từ chối (C1)', color: statusCritical },
    REJECTED_LEVEL2: { label: 'Từ chối (C2)', color: statusCritical },
    ARCHIVED: { label: 'Lưu trữ', color: textTertiary },
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

// Mock 30 bản ghi cho TAB 4: Danh sách KCHT khác thuộc VTS
const MOCK_OTHER_INFRASTRUCTURES = Array.from({ length: 30 }, (_, i) => {
  const index = i + 1;
  const pad = index < 10 ? `0${index}` : `${index}`;
  if (index % 3 === 1) {
    return {
      id: `mock-infra-vts-${index}`,
      type: 'VTS_OPERATION_CENTER',
      typeLabel: 'Trung tâm điều hành VTS',
      name: `Trung tâm Quản lý điều hành VTS Luồng Hàng hải Khu vực ${pad}`,
    };
  } else if (index % 3 === 2) {
    return {
      id: `mock-infra-radar-${index}`,
      type: 'RADAR_STATION',
      typeLabel: 'Trạm Radar VTS',
      name: `Trạm Radar cảnh giới & giám sát luồng hàng hải VTS-${pad}`,
    };
  } else {
    return {
      id: `mock-infra-ais-${index}`,
      type: 'AIS_SYSTEM',
      typeLabel: 'Trạm AIS / Hệ thống AIS',
      name: `Hệ thống Trạm AIS bờ thu phát nhận dạng tàu thuyền AIS-VTS-${pad}`,
    };
  }
});

// Mock 30 bản ghi cho TAB 5 - Sub-tab 1: Thông tin vận hành khai thác
const MOCK_OPERATION_PLANS = Array.from({ length: 30 }, (_, i) => {
  const index = i + 1;
  const pad = index < 10 ? `0${index}` : `${index}`;
  const year = 2024 + Math.floor(index / 10);
  const month = ((index - 1) % 12) + 1;
  const monthPad = month < 10 ? `0${month}` : `${month}`;
  return {
    id: `mock-op-${index}`,
    planCode: `KH-VHKT-${year}/${pad}`,
    planName: `Kế hoạch điều hành luồng hàng hải & giám sát an toàn giao thông đợt ${index}`,
    startDate: `${year}-${monthPad}-01`,
    endDate: `${year}-${monthPad}-28`,
  };
});

// Mock 30 bản ghi cho TAB 5 - Sub-tab 2: Thông tin bảo trì
const MOCK_MAINTENANCE_PLANS = Array.from({ length: 30 }, (_, i) => {
  const index = i + 1;
  const pad = index < 10 ? `0${index}` : `${index}`;
  const year = 2024 + Math.floor(index / 10);
  const month = ((index - 1) % 12) + 1;
  const monthPad = month < 10 ? `0${month}` : `${month}`;
  return {
    id: `mock-maint-${index}`,
    planCode: `KH-BT-${year}/VTS-${pad}`,
    planName: `Kế hoạch bảo dưỡng, hiệu chuẩn định kỳ hệ thống cảm biến Radar & AIS đợt ${index}`,
    startTime: `${year}-${monthPad}-05`,
    endTime: `${year}-${monthPad}-12`,
  };
});

// Mock 30 bản ghi cho TAB 5 - Sub-tab 3: Thông tin sự cố
const MOCK_INCIDENTS = Array.from({ length: 30 }, (_, i) => {
  const index = i + 1;
  const pad = index < 10 ? `0${index}` : `${index}`;
  const types = [
    'Mất kết nối đường truyền vi ba',
    'Cảnh báo suy hao tín hiệu Anten Radar',
    'Gián đoạn nguồn điện lưới khu vực trạm',
    'Lỗi đồng bộ dữ liệu vết mục tiêu AIS',
    'Cảnh báo nhiệt độ máy chủ xử lý vượt ngưỡng',
  ];
  const locations = [
    'Trạm Radar VTS Mũi Nghinh Phong',
    'Trạm Radar VTS Cần Giờ',
    'Trung tâm Quản lý điều hành VTS',
    'Trạm AIS VTS Vũng Tàu',
    'Trạm Radar VTS Cát Lái',
  ];
  const year = 2025;
  const month = ((index - 1) % 12) + 1;
  const monthPad = month < 10 ? `0${month}` : `${month}`;
  const day = ((index * 3) % 25) + 1;
  const dayPad = day < 10 ? `0${day}` : `${day}`;
  return {
    id: `mock-inc-${index}`,
    incidentCode: `SC-${year}-${pad}`,
    incidentType: types[(index - 1) % types.length],
    location: locations[(index - 1) % locations.length],
    incidentTime: `${year}-${monthPad}-${dayPad} 14:30:00`,
  };
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
  const currentUser = useAuthStore((state) => state.user);
  const userPermissions = (currentUser?.permissions as string[]) || [];
  const hasPerm = usePermissionStore((s) => s.hasPermission);

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

  const [otherInfraTypeFilter, setOtherInfraTypeFilter] = useState<string>('ALL');
  const [otherInfraList, setOtherInfraList] = useState<Array<{ id: string; type: string; typeLabel: string; name: string }>>(MOCK_OTHER_INFRASTRUCTURES);
  const [otherInfraLoaded, setOtherInfraLoaded] = useState(false);
  const [isLoadingOtherInfra, setIsLoadingOtherInfra] = useState(false);

  const [operationPlanList] = useState<any[]>(MOCK_OPERATION_PLANS);
  const [maintenancePlanList] = useState<any[]>(MOCK_MAINTENANCE_PLANS);
  const [incidentList] = useState<any[]>(MOCK_INCIDENTS);

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
        const [orgs, ports, opOrgs] = await Promise.all([
          vtsSystemCRUD.getScopedOrgUnitOptions(),
          vtsSystemCRUD.getScopedPortOptions(),
          vtsSystemCRUD.getOperatingOrganizationOptions(),
        ]);
        if (!mounted) return;
        if (orgs && orgs.length > 0) setOrganizations(orgs);
        if (ports && ports.length > 0) setRawPorts(ports);
        if (opOrgs && opOrgs.length > 0) setOperatingOrganizations(opOrgs);
      } catch (err) {
        console.warn('Failed to load lookups in VtsSystemForm', err);
      }
    };
    fetchLookups();
    return () => { mounted = false; };
  }, []);

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

  // Lazy load other infrastructure when user switches to 'otherInfra' tab in detail mode
  useEffect(() => {
    if (!editId || otherInfraLoaded) return;
    if (isDetailMode && detailTabKey === 'otherInfra') {
      setIsLoadingOtherInfra(true);
      Promise.allSettled([
        vtsOperationCenterService.search({ vtsSystemId: editId, size: 100 } as any),
        radarStationService.search({ vtsSystemId: editId, size: 100 } as any),
        aisSystemService.search({ vtsSystemId: editId, size: 100 } as any),
      ]).then((results) => {
        const combined: Array<{ id: string; type: string; typeLabel: string; name: string }> = [];

        // 1. Trung tâm điều hành VTS
        if (results[0].status === 'fulfilled' && results[0].value) {
          const res = results[0].value as any;
          const items = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.items) ? res.items : (Array.isArray(res?.data) ? res.data : []));
          items.forEach((item: any) => {
            combined.push({
              id: item.id,
              type: 'VTS_OPERATION_CENTER',
              typeLabel: 'Trung tâm điều hành VTS',
              name: item.name || item.code || '—',
            });
          });
        }

        // 2. Trạm Radar VTS
        if (results[1].status === 'fulfilled' && results[1].value) {
          const res = results[1].value as any;
          const items = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.items) ? res.items : (Array.isArray(res?.data) ? res.data : []));
          items.forEach((item: any) => {
            combined.push({
              id: item.id,
              type: 'RADAR_STATION',
              typeLabel: 'Trạm Radar VTS',
              name: item.name || item.code || '—',
            });
          });
        }

        // 3. Trạm AIS / Hệ thống AIS
        if (results[2].status === 'fulfilled' && results[2].value) {
          const res = results[2].value as any;
          const items = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.items) ? res.items : (Array.isArray(res?.data) ? res.data : []));
          items.forEach((item: any) => {
            combined.push({
              id: item.id,
              type: 'AIS_SYSTEM',
              typeLabel: 'Trạm AIS / Hệ thống AIS',
              name: item.name || item.code || '—',
            });
          });
        }

        setOtherInfraList(combined.length > 0 ? combined : MOCK_OTHER_INFRASTRUCTURES);
        setOtherInfraLoaded(true);
      }).catch(() => {
        setOtherInfraList(MOCK_OTHER_INFRASTRUCTURES);
        setOtherInfraLoaded(true);
      }).finally(() => {
        setIsLoadingOtherInfra(false);
      });
    }
  }, [editId, detailTabKey, otherInfraLoaded, isDetailMode]);

  const filteredOtherInfra = useMemo(() => {
    if (!otherInfraTypeFilter || otherInfraTypeFilter === 'ALL') return otherInfraList;
    return otherInfraList.filter((item) => item.type === otherInfraTypeFilter);
  }, [otherInfraList, otherInfraTypeFilter]);

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
      list = list.filter((p) => String(p.orgUnitId || '') === String(effectiveOrgUnitId));
    }
    return list.map((p) => ({
      value: p.id,
      label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id),
    }));
  }, [rawPorts, effectiveOrgUnitId]);

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
        provinceId: values.provinceId ? Number(values.provinceId) : undefined,
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
        addedAttachmentNames: pendingFiles.map((f) => f.name),
        removedAttachmentNames: pendingDeletedAttachments.map((a) => a.fileName),
      };

      const targetStatus =
        actionTypeRef.current === 'approve'
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.DRAFT;

      if (isCreateMode) {
        const created = await vtsSystemCRUD.create({
          ...payload,
          approvalStatus: targetStatus,
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
                      allowClear
                      showSearch
                      placeholder="Chọn loại đối tượng"
                      value={otherInfraTypeFilter === 'ALL' ? undefined : otherInfraTypeFilter}
                      onChange={(val) => setOtherInfraTypeFilter(val || 'ALL')}
                      filterOption={(input, option) =>
                        normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                      }
                      options={[
                        { value: 'VTS_OPERATION_CENTER', label: 'Trung tâm điều hành VTS' },
                        { value: 'RADAR_STATION', label: 'Trạm Radar VTS' },
                        { value: 'AIS_SYSTEM', label: 'Trạm AIS / Hệ thống AIS' },
                      ]}
                      style={{ ...selectStyle, width: 280, height: 38 }}
                    />
                  </div>
                  <DetailTable
                    scrollY="calc(100vh - 346px)"
                    dataSource={filteredOtherInfra}
                    emptyText={isLoadingOtherInfra ? 'Đang tải dữ liệu KCHT khác...' : 'Chưa có kết cấu hạ tầng khác thuộc hệ thống VTS'}
                    rowKey={(r: any) => r.id || `${r.type}-${r.name}`}
                    columns={[
                      {
                        title: 'STT',
                        width: 60,
                        align: 'center',
                        render: (_: any, __: any, index: number) => index + 1,
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
                          scrollY="calc(100vh - 346px)"
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
                          scrollY="calc(100vh - 346px)"
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
                          scrollY="calc(100vh - 346px)"
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
                        {record.approvalContentLevel1 || record.approvalReasonLevel1 || record.rejectionReasonLevel1 || '—'}
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
                        {record.approvalContentLevel2 || record.approvalReasonLevel2 || record.rejectionReasonLevel2 || record.rejectionReason || '—'}
                      </span>
                    </div>
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
      size="50%"
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
                                if (!form.getFieldValue('owningOrgId')) {
                                  form.setFieldValue('owningOrgId', val);
                                }
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
