import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Form,
  Button,
  Input,
  Select,
  Spin,
  Space,
  Tabs,
  Row,
  Col,
  Modal,
  Drawer,
  Tooltip,
  DatePicker,
} from 'antd';
import { PlusOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import type {
  VtsSystemResponse,
  CreateVtsSystemRequest,
  UpdateVtsSystemRequest,
  ApprovalRequest,
} from '../../types/vtsSystem';
import { ApprovalStatus, ConditionStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import {
  drawerTitleStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle,
  dangerButtonStyle, requiredMarkStyle, inputStyle,
  drawerTabBarStyle, spaceFormField, radiusMd, radiusPill, sidebarBg,
  fontWeightBold, fontWeightMedium, spaceMd, spaceSm, fontSizeMd, fontSizeSm,
  textSecondary, textTertiary, textPrimary, borderDefault,
  statusCritical, statusAttention, statusOperational, actionPrimary, textAreaStyle,
  readonlyInputStyle, selectStyle, drawerCloseBtnStyle, statusBadgeStyle,
  generateTempId,
  getDatePickerProps,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES, VIETNAM_PROVINCE_OPTIONS, getProvinceNameById, getProvinceIdByName } from '../../types/common';
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

export interface VtsSystemChkFormProps {
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

const renderConditionStatusBadge = (status?: ConditionStatus | string) => {
  if (!status) return '—';
  const label = CONDITION_STATUS_MAP[status as ConditionStatus] || status;
  const color = CONDITION_COLOR[status as ConditionStatus] || textSecondary;

  return (
    <span style={statusBadgeStyle(color)}>
      {label}
    </span>
  );
};

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

export default function VtsSystemChkForm({
  open = true,
  editId = null,
  initialData = null,
  initialDataOnly = false,
  mode: propMode = 'create',
  orgUnits: propOrgUnits,
  onCancel,
  onSuccess,
}: VtsSystemChkFormProps) {
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
  const [operatingOrganizations] = useState<any[]>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [rawPorts, setRawPorts] = useState<any[]>([]);
  const [zoneList, setZoneList] = useState<any[]>([]);
  const [attachmentList, setAttachmentList] = useState<any[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingDeletedAttachments, setPendingDeletedAttachments] = useState<{ id: string; fileName: string }[]>([]);
  const [approvalSectionOpen, setApprovalSectionOpen] = useState(true);
  const [zonesLoaded, setZonesLoaded] = useState(false);
  const [filesLoaded, setFilesLoaded] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

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

  // Approval Modals
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const zoneBadgeCount = isCreateMode
    ? zoneList.length
    : (zonesLoaded ? zoneList.length : (record?.zoneCount ?? record?.zones?.length ?? zoneList.length));

  const fileBadgeCount = isCreateMode
    ? attachmentList.length
    : (filesLoaded ? attachmentList.length : (record?.attachmentCount ?? record?.attachments?.length ?? attachmentList.length));

  const canSaveAndApprove = userPermissions.includes('vts:approvec2');

  // Load options
  useEffect(() => {
    let mounted = true;
    const fetchLookups = async () => {
      try {
        const [orgs, ports] = await Promise.all([
          vtsSystemCRUD.getScopedOrgUnitOptions(),
          vtsSystemCRUD.getScopedPortOptions(),
        ]);
        if (!mounted) return;
        if (orgs && orgs.length > 0) setOrganizations(orgs);
        if (ports && ports.length > 0) setRawPorts(ports);
      } catch (err) {
        console.warn('Failed to load lookups in VtsSystemChkForm', err);
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
            form.setFieldsValue({ code: res.code });
          }
        })
        .catch(() => {});
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

  const populateForm = (data: VtsSystemResponse) => {
    form.setFieldsValue({
      orgUnitId: data.orgUnitId,
      owningOrgId: data.owningOrgId || data.orgUnitId,
      operatingOrgId: data.operatingOrgId,
      portId: data.portId,
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
          list.push({ value: String(o.id), label: o.name });
        }
      });
    }

    if (Array.isArray(operatingOrganizations)) {
      operatingOrganizations.forEach((o) => {
        if (o.id && o.name && !seen.has(String(o.id))) {
          seen.add(String(o.id));
          list.push({ value: String(o.id), label: o.name });
        }
      });
    }

    if (record?.operatingOrgId && !seen.has(String(record.operatingOrgId))) {
      seen.add(String(record.operatingOrgId));
      list.push({
        value: String(record.operatingOrgId),
        label: record.operatingOrgName || String(record.operatingOrgId),
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
    return r.operatingOrgId ? String(r.operatingOrgId) : '—';
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

      if (isCreateMode) {
        const created = await vtsSystemCRUD.create(payload);
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
          await vtsSystemApproval.approveC2(created.id, { decision: 'APPROVED', reason: 'Lưu và duyệt trực tiếp' });
        }
        toast.success('Thêm mới thành công');
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
                <div style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto', overflowX: 'hidden', padding: '0 8px 16px 2px', boxSizing: 'border-box' }}>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row"><span className="chk-detail-label">Mã hệ thống VTS</span><span className="chk-detail-value">{record.code || '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Tên hệ thống VTS</span><span className="chk-detail-value">{record.systemName || '—'}</span></div>
                    
                    <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị quản lý</span><span className="chk-detail-value">{record.orgUnitName || '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Thuộc cảng biển</span><span className="chk-detail-value">{record.portName || '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị chủ quản</span><span className="chk-detail-value">{record.owningOrgName || '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị vận hành</span><span className="chk-detail-value">{getOperatingOrgDisplayName(record)}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm Tỉnh/TP</span><span className="chk-detail-value">{record.province || (record.provinceId ? getProvinceNameById(record.provinceId) : '—')}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm chi tiết</span><span className="chk-detail-value">{record.address || '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Tình trạng</span><span className="chk-detail-value">{renderConditionStatusBadge(record.conditionStatus)}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Thời gian bắt đầu hoạt động</span><span className="chk-detail-value">{record.operationStartDate ? dayjs(record.operationStartDate).format('DD/MM/YYYY') : '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Ngày cập nhật</span><span className="chk-detail-value">{record.updatedDate ? dayjs(record.updatedDate).format('DD/MM/YYYY HH:mm:ss') : (record.createdDate ? dayjs(record.createdDate).format('DD/MM/YYYY HH:mm:ss') : '—')}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ cập nhật</span><span className="chk-detail-value">{record.updatedByName || record.createdByName || '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Phạm vi áp dụng</span><span className="chk-detail-value">{record.scope || '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Thông báo hàng hải</span><span className="chk-detail-value">{record.maritimeNotice || '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Ghi chú</span><span className="chk-detail-value">{record.note || '—'}</span></div>
                    <div style={{ border: 'none' }} />
                  </div>

                  {/* ── Thông tin phê duyệt (Toggle Dropdown) ── */}
                  <div style={{ marginTop: 16, marginBottom: 6 }}>
                    <button
                      type="button"
                      onClick={() => setApprovalSectionOpen(!approvalSectionOpen)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 0',
                        color: actionPrimary,
                        fontWeight: fontWeightBold,
                        fontSize: fontSizeMd,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 10, color: actionPrimary }}>{approvalSectionOpen ? '▼' : '▶'}</span>
                      <span>Thông tin phê duyệt</span>
                    </button>
                  </div>

                  {approvalSectionOpen && (
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row"><span className="chk-detail-label">Ngày gửi duyệt</span><span className="chk-detail-value">{record.submittedDate ? dayjs(record.submittedDate).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ gửi duyệt</span><span className="chk-detail-value">{record.submittedByName || record.createdByName || '—'}</span></div>

                      <div className="chk-detail-row"><span className="chk-detail-label">Ngày phê duyệt Cảng vụ</span><span className="chk-detail-value">{record.approvedDateLevel1 ? dayjs(record.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ phê duyệt Cảng vụ</span><span className="chk-detail-value">{record.approverLevel1Name || record.approverLevel1 || '—'}</span></div>

                      <div className="chk-detail-row"><span className="chk-detail-label">Nội dung Cảng vụ/Chi cục phê duyệt</span><span className="chk-detail-value">{record.approvalContentLevel1 || record.rejectionReason || '—'}</span></div>
                      <div style={{ border: 'none' }} />

                      <div className="chk-detail-row"><span className="chk-detail-label">Ngày phê duyệt Cục</span><span className="chk-detail-value">{record.approvedDateLevel2 ? dayjs(record.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ phê duyệt Cục</span><span className="chk-detail-value">{record.approverLevel2Name || record.approverLevel2 || '—'}</span></div>

                      <div className="chk-detail-row"><span className="chk-detail-label">Nội dung Cục phê duyệt</span><span className="chk-detail-value">{record.approvalContentLevel2 || record.rejectionReason || '—'}</span></div>
                      <div style={{ border: 'none' }} />

                      <div className="chk-detail-row"><span className="chk-detail-label">Trạng thái</span><span className="chk-detail-value">{renderApprovalBadge(record.approvalStatus)}</span></div>
                      <div style={{ border: 'none' }} />
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'zones',
              label: `Thông tin vùng VTS (${zoneBadgeCount})`,
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
              label: `File đính kèm (${fileBadgeCount})`,
              children: (
                <InfrastructureAttachmentTab
                  attachments={displayAttachments}
                  readonly={true}
                  isLoading={isLoadingFiles}
                  onDownload={handleDownloadAttachment}
                />
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
      styles={{
        header: { padding: '16px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '0 24px 0 24px', overflow: 'hidden' },
        ...(isDetailMode ? {} : {
          footer: { padding: '12px 24px', borderTop: `1px solid ${borderDefault}`, display: 'flex', justifyContent: 'center', alignItems: 'center' },
        }),
      }}
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
            onFinish={handleSubmitForm}
            onFinishFailed={(errorInfo) => {
              const firstErr = errorInfo?.errorFields?.[0]?.errors?.[0];
              toast.warning(firstErr || 'Vui lòng nhập đầy đủ các thông tin bắt buộc (*)');
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
                    <div style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto', overflowX: 'hidden', padding: '0 8px 16px 2px', boxSizing: 'border-box' }}>
                      <Row gutter={[24, 0]} style={{ marginLeft: 0, marginRight: 0 }}>
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
                                form.setFieldValue('owningOrgId', val);
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
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã hệ thống VTS</span>}
                            name="code"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input
                              placeholder="Mã tự sinh (VTS-xxxxxx)"
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
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                            name="address"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
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
                  label: `Thông tin vùng VTS (${zoneBadgeCount})`,
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
                  label: `File đính kèm (${fileBadgeCount})`,
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
