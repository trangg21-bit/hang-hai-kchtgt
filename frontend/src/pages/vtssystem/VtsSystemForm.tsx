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
  DatePicker,
  Modal,
  Tag,
} from 'antd';
import { PlusOutlined, DeleteOutlined, FileTextOutlined, BankOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { focusErrorTab } from '../../utils/formValidationHelper';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type {
  VtsSystemResponse,
  CreateVtsSystemRequest,
  UpdateVtsSystemRequest,
} from '../../types/vtsSystem';
import { ApprovalStatus, ConditionStatus, CONDITION_STATUS_OPTIONS } from '../../types/vtsSystem';
import {
  drawerTitleStyle, primaryButtonStyle, outlineButtonStyle,
  requiredMarkStyle, inputStyle,
  drawerTabBarStyle, drawerFormScrollStyle, spaceFormField, radiusPill, sidebarBg,
  fontWeightBold, fontSizeMd, fontSizeSm,
  statusOperational, actionPrimary,
  readonlyInputStyle, selectStyle,
  generateTempId,
  getDatePickerProps,
  DRAWER_TABLE_SCROLL_Y,
  borderDefault,
} from '../../themetokenchk';
import AppDrawer from '../../components/shared/AppDrawer';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { useAuthStore, type AuthState } from '../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../components/org-unit';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import VtsSystemDetailContent from './VtsSystemDetailContent';

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



const ZoneCellInput = React.memo(({
  value = '',
  placeholder,
  onChange,
  style,
  maxLength,
  showCount,
}: {
  value?: string;
  placeholder?: string;
  onChange: (val: string) => void;
  style?: React.CSSProperties;
  maxLength?: number;
  showCount?: boolean;
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
      maxLength={maxLength}
      showCount={showCount}
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
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const [form] = Form.useForm();
  const [record, setRecord] = useState<VtsSystemResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabKey, setTabKey] = useState<string>('general');
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
  const [zoneGisModalOpen, setZoneGisModalOpen] = useState(false);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number | null>(null);
  const selectedZone = selectedZoneIndex !== null ? zoneList[selectedZoneIndex] : null;

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
      file,
      originFileObj: file,
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

  // Lazy load zones khi người dùng chuyển sang tab zones (create / edit)
  useEffect(() => {
    if (!editId || zonesLoaded || isDetailMode) return;
    if (tabKey === 'zones') {
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
  }, [editId, tabKey, zonesLoaded, isDetailMode]);

  // Lazy load attachments khi người dùng chuyển sang tab files (create / edit)
  useEffect(() => {
    if (!editId || filesLoaded || isDetailMode) return;
    if (tabKey === 'files') {
      setIsLoadingFiles(true);
      vtsSystemCRUD.getAttachments(editId)
        .then((files) => {
          setAttachmentList(files || []);
          setFilesLoaded(true);
        })
        .catch(() => {})
        .finally(() => setIsLoadingFiles(false));
    }
  }, [editId, tabKey, filesLoaded, isDetailMode]);

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
    // Validate danh sách vùng VTS trước khi submit
    for (let i = 0; i < zoneList.length; i++) {
      const z = zoneList[i];
      if (!z.code || !z.code.trim()) {
        toast.warning(`Vui lòng nhập Mã vùng cho dòng thứ ${i + 1} tại tab Thông tin vùng VTS`);
        setTabKey('zones');
        return;
      }
      if (!z.name || !z.name.trim()) {
        toast.warning(`Vui lòng nhập Tên vùng VTS cho dòng thứ ${i + 1} tại tab Thông tin vùng VTS`);
        setTabKey('zones');
        return;
      }
    }

    const seenCodes = new Set<string>();
    for (const z of zoneList) {
      const codeKey = (z.code || '').trim().toLowerCase();
      if (codeKey) {
        if (seenCodes.has(codeKey)) {
          toast.warning(`Mã vùng VTS "${z.code.trim()}" bị trùng lặp. Vui lòng kiểm tra lại.`);
          setTabKey('zones');
          return;
        }
        seenCodes.add(codeKey);
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CreateVtsSystemRequest | UpdateVtsSystemRequest = {
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
          code: z.code.trim(),
          name: z.name.trim(),
          conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
          geometryType: z.geometryType || (z.coordinates ? 'POLYGON' : undefined),
          coordinates: z.coordinates || undefined,
          spatialId: z.spatialId || undefined,
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
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
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
        const isAlreadyApproved =
          record?.approvalStatus === ApprovalStatus.APPROVED ||
          (record?.approvalStatus as string) === 'APPROVED_LEVEL2';

        if (actionTypeRef.current === 'submit') {
          await vtsSystemApproval.submit(editId);
        } else if (actionTypeRef.current === 'approve') {
          if (!isAlreadyApproved) {
            if (record?.approvalStatus === ApprovalStatus.APPROVED_LEVEL1) {
              await vtsSystemApproval.approveC2(editId, { decision: 'APPROVED', reason: 'Lưu và phê duyệt trực tiếp' });
            } else {
              await vtsSystemApproval.submit(editId);
              await vtsSystemApproval.approveC2(editId, { decision: 'APPROVED', reason: 'Lưu và phê duyệt trực tiếp' });
            }
          }
        }
        setPendingFiles([]);
        setPendingDeletedAttachments([]);
        const msg =
          actionTypeRef.current === 'draft'
            ? 'Lưu tạm thành công'
            : actionTypeRef.current === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : actionTypeRef.current === 'approve'
                ? 'Lưu và phê duyệt thành công'
                : 'Cập nhật thành công';
        toast.success(msg);
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
    // 1. Kiểm tra trong danh sách tệp chờ lưu
    const pendingFile = pendingFiles.find((f) => (f as any)._tempId === attId || f.name === fileName || (f as any).name === fileName);
    if (pendingFile) {
      const url = URL.createObjectURL(pendingFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || pendingFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    // 2. Kiểm tra trong danh sách attachment hiện tại có chứa tệp cục bộ
    const targetAtt = attachmentList.find((a) => a.id === attId || a.fileName === fileName);
    const rawFile = targetAtt?.originFileObj || targetAtt?.file;
    if (rawFile) {
      const url = URL.createObjectURL(rawFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || rawFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    // 3. Nếu là tệp mới thêm tạm thời chưa lưu máy chủ
    if (String(attId).startsWith('temp')) {
      toast.info('Tệp đính kèm mới tải lên, hãy lưu hồ sơ trước khi tải xuống từ máy chủ');
      return;
    }

    // 4. Tải từ máy chủ
    const targetId = record?.id || editId;
    if (!targetId) {
      toast.warning('Không xác định được hồ sơ VTS');
      return;
    }
    try {
      await vtsSystemCRUD.downloadAttachment(targetId, attId, fileName);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast.error('Tệp đính kèm không tồn tại trên máy chủ lưu trữ');
      } else {
        toast.error(err?.message || 'Lỗi khi tải xuống tệp đính kèm');
      }
    }
  };

  return (
    <>
      <AppDrawer
      rootClassName="vts-drawer-scope"
      className="vts-drawer-scope"
      style={isDetailMode ? { maxWidth: '96vw' } : undefined}
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
            ? (record?.systemName ? `Chi tiết hệ thống VTS - ${record.systemName}` : 'Chi tiết hệ thống VTS')
            : isCreateMode
              ? 'Thêm mới hệ thống VTS'
              : (record?.systemName ? `Chỉnh sửa thông tin — ${record.systemName}` : 'Chỉnh sửa thông tin')}
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
      <style>{detailTableStyle}</style>
      {isDetailMode ? (
        isLoading ? (
          <div style={{ padding: '16px 0' }}>
            <LoadingSkeleton rows={6} />
          </div>
        ) : (
          <VtsSystemDetailContent
            selectedRecord={record || initialData!}
            onClose={onCancel}
          />
        )
      ) : (
        <Spin spinning={isLoading}>
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
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                              name="address"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>

                      {/* ── Section 2: Phạm vi áp dụng & Thông báo hàng hải ── */}
                      <div style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <FileTextOutlined style={{ color: actionPrimary }} />
                            <span>Phạm vi áp dụng & Thông báo hàng hải</span>
                          </div>
                        </div>
                        <Row gutter={[24, 0]}>
                          <Col span={24}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Phạm vi áp dụng</span>}
                              name="scope"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập phạm vi áp dụng" showCount maxLength={2000} style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thông báo hàng hải</span>}
                              name="maritimeNotice"
                              rules={[{ required: true, message: 'Vui lòng nhập thông báo hàng hải' }]}
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập thông báo hàng hải" showCount maxLength={2000} style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                              name="note"
                              style={{ marginBottom: spaceFormField }}
                            >
                              <Input placeholder="Nhập ghi chú" showCount maxLength={2000} style={inputStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'zones',
                  label: `Thông tin vùng VTS (${zoneList.length})`,
                  children: (
                    <DetailTable
                      loading={isLoadingZones}
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
                          width: 50,
                          align: 'center',
                          render: (_v, _r, idx) => idx + 1,
                        },
                        {
                          title: 'Mã vùng',
                          dataIndex: 'code',
                          key: 'code',
                          width: 150,
                          render: (val, r: any) => (
                            <ZoneCellInput
                              value={val}
                              placeholder="Nhập mã vùng"
                              maxLength={50}
                              showCount
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
                          width: 260,
                          render: (val, r: any) => (
                            <ZoneCellInput
                              value={val}
                              placeholder="Nhập tên vùng VTS"
                              maxLength={255}
                              showCount
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
                          title: 'Tọa độ GIS',
                          key: 'coordinates',
                          width: 220,
                          render: (_val: any, r: any, idx: number) => {
                            const rawWkt = r.coordinates || '';
                            let displayInfo = 'Chưa có tọa độ';
                            let tagColor: string = 'default';
                            if (rawWkt) {
                              if (rawWkt.startsWith('POLYGON')) {
                                const count = (rawWkt.match(/,/g) || []).length + 1;
                                displayInfo = `Vùng (${count} điểm)`;
                                tagColor = 'blue';
                              } else if (rawWkt.startsWith('LINE') || rawWkt.startsWith('LINESTRING')) {
                                const count = (rawWkt.match(/,/g) || []).length + 1;
                                displayInfo = `Đường (${count} điểm)`;
                                tagColor = 'cyan';
                              } else if (rawWkt.startsWith('POINT')) {
                                displayInfo = 'Điểm tọa độ';
                                tagColor = 'green';
                              } else {
                                displayInfo = 'Đã có tọa độ';
                                tagColor = 'blue';
                              }
                            }

                            return (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                <Tag color={tagColor} style={{ marginRight: 0, borderRadius: 12, padding: '1px 8px', fontSize: fontSizeSm }}>
                                  {displayInfo}
                                </Tag>
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<EnvironmentOutlined />}
                                  style={{ padding: '0 4px', fontSize: fontSizeSm, height: 26, display: 'inline-flex', alignItems: 'center', gap: 2 }}
                                  onClick={() => {
                                    setSelectedZoneIndex(idx);
                                    setZoneGisModalOpen(true);
                                  }}
                                >
                                  {rawWkt ? 'Sửa' : 'Chọn vị trí'}
                                </Button>
                              </div>
                            );
                          },
                        },
                        {
                          title: 'Tình trạng',
                          key: 'conditionStatus',
                          width: 150,
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
                          title: 'Thao tác',
                          key: 'actions',
                          width: 70,
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
                  label: `File đính kèm (${attachmentList.length})`,
                  children: (
                    <InfrastructureAttachmentTab
                      isLoading={isLoadingFiles}
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
        </Spin>
      )}
    </AppDrawer>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span>
              Thiết lập Vị trí & Tọa độ GIS vùng VTS{selectedZone?.name ? `: ${selectedZone.name}` : selectedZone?.code ? `: [${selectedZone.code}]` : ''}
            </span>
          </div>
        }
        open={zoneGisModalOpen}
        onCancel={() => setZoneGisModalOpen(false)}
        destroyOnClose
        width="96vw"
        style={{ top: 12, maxWidth: 1600 }}
        footer={[
          selectedZone?.coordinates && (
            <Button
              key="clear"
              danger
              onClick={() => {
                if (selectedZoneIndex !== null) {
                  setZoneList((prev) =>
                    prev.map((item, i) =>
                      i === selectedZoneIndex ? { ...item, coordinates: '', geometryType: undefined } : item
                    )
                  );
                }
                setZoneGisModalOpen(false);
              }}
              style={{ float: 'left' }}
            >
              Xóa tọa độ
            </Button>
          ),
          <Button
            key="close"
            type="primary"
            onClick={() => setZoneGisModalOpen(false)}
            style={{ ...primaryButtonStyle, height: 32 }}
          >
            Xác nhận & Đóng
          </Button>,
        ]}
      >
        <div style={{ height: 520, borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType="POLYGON"
            height={520}
            value={{
              geometryType: selectedZone?.geometryType || 'POLYGON',
              coordinates: selectedZone?.coordinates || '',
            }}
            onChange={(val) => {
              if (selectedZoneIndex !== null) {
                setZoneList((prev) =>
                  prev.map((item, i) =>
                    i === selectedZoneIndex
                      ? {
                          ...item,
                          geometryType: val.geometryType || 'POLYGON',
                          coordinates: val.coordinates,
                        }
                      : item
                  )
                );
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
}
