import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Form,
  Button,
  Input,
  Select,
  Card,
  Spin,
  Empty,
  Space,
  Breadcrumb,
  Tabs,
  DatePicker,
  Table,
  Row,
  Col,
  Upload,
  Modal,
  Tooltip,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, InboxOutlined, FileOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import api from '../../services/api';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import type {
  VtsSystemResponse,
  CreateVtsSystemRequest,
  UpdateVtsSystemRequest,
  ApprovalRequest,
} from '../../types/vtsSystem';
import { ApprovalStatus, ConditionStatus, RecordSecurityLevel, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { drawerTitleStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle, requiredMarkStyle, spaceFormField, radiusPill, radiusMd, sidebarBg, fontWeightBold, fontWeightMedium, spaceMd, spaceSm, fontSizeMd, fontSizeSm, textSecondary, textTertiary, textPrimary, borderDefault, surfaceCard, uploadHintStyle, statusCritical, statusAttention, statusOperational, actionPrimary, textAreaStyle, readonlyInputStyle } from '../../tokens';
import { colors } from '../../theme';
import { VIETNAM_PROVINCES, getProvinceIdByName, getProvinceNameById } from '../../types/common';

import { useAuthStore } from '../../store/authStore';
import AttachmentList from '../../components/shared/AttachmentList';
import ApprovalModal from '../../components/shared/ApprovalModal';
import { OrgUnitTreeSelect, normalizeSearchText } from '../../components/org-unit';
import { AppDrawer } from '../../components/shared/AppDrawer';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';

export interface VtsSystemFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: VtsSystemResponse | null;
  initialDataOnly?: boolean;
  mode?: 'create' | 'edit' | 'detail';
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
        marginLeft: -6,
      }}
    >
      {label}
    </span>
  );
};

type VtsDetailCacheWindow = Window & {
  kchtDetailCache?: Record<string, VtsSystemResponse>;
};

// Deduplicate concurrent detail requests, including React StrictMode effect re-runs.
const pendingVtsDetailRequests = new Map<string, Promise<VtsSystemResponse>>();

const getVtsDetailCache = (): Record<string, VtsSystemResponse> => {
  try {
    const parentWindow = window.parent as VtsDetailCacheWindow;
    parentWindow.kchtDetailCache = parentWindow.kchtDetailCache || {};
    return parentWindow.kchtDetailCache;
  } catch {
    return {};
  }
};

const isCompleteVtsDetail = (data?: VtsSystemResponse | null): data is VtsSystemResponse =>
  Boolean(data?.id && Array.isArray(data.zones) && Array.isArray(data.attachments));

/**
 * Bỏ bản chi tiết đã cache của một hệ thống VTS.
 *
 * Mọi thao tác đổi trạng thái (gửi duyệt, phê duyệt, từ chối, xóa) — dù thực
 * hiện từ drawer chi tiết hay từ màn danh sách — đều phải gọi hàm này, nếu
 * không lần mở chi tiết kế tiếp sẽ đọc lại bản cache cũ và hiển thị sai trạng
 * thái phê duyệt.
 */
export const invalidateVtsDetailCache = (id?: string | null): void => {
  if (!id) return;
  delete getVtsDetailCache()[id];
};

/**
 * Ghép kết quả phê duyệt/từ chối vào bản ghi đang mở.
 *
 * Các endpoint approve/reject trả về bản rút gọn (`toLightResponse`): vùng VTS
 * và tệp đính kèm là mảng rỗng, tọa độ và tên người dùng là null. Gán thẳng nó
 * vào state sẽ làm drawer đang mở trống các phần đó, nên chỉ lấy đúng những
 * trường thuộc luồng phê duyệt.
 */
const applyApprovalResult = (
  current: VtsSystemResponse | null,
  updated: VtsSystemResponse | null,
): VtsSystemResponse | null => {
  if (!updated) return current;
  if (!current) return updated;
  return {
    ...current,
    approvalStatus: updated.approvalStatus,
    approverLevel1: updated.approverLevel1,
    approverLevel1Name: updated.approverLevel1Name ?? current.approverLevel1Name,
    approvedDateLevel1: updated.approvedDateLevel1,
    approvalContentLevel1: updated.approvalContentLevel1 ?? current.approvalContentLevel1,
    approverLevel2: updated.approverLevel2,
    approverLevel2Name: updated.approverLevel2Name ?? current.approverLevel2Name,
    approvedDateLevel2: updated.approvedDateLevel2,
    approvalContentLevel2: updated.approvalContentLevel2 ?? current.approvalContentLevel2,
    rejectionReason: updated.rejectionReason,
    updatedBy: updated.updatedBy,
    updatedByName: updated.updatedByName ?? current.updatedByName,
    updatedDate: updated.updatedDate,
  };
};

const loadVtsDetail = (
  id: string,
): Promise<VtsSystemResponse> => {
  const requestKey = `${id}:true:true`;
  const pending = pendingVtsDetailRequests.get(requestKey);
  if (pending) return pending;

  const request = vtsSystemCRUD.getById(id, { includeZones: true, includeAttachments: true }).then((data) => {
    if (data && isCompleteVtsDetail(data)) {
      getVtsDetailCache()[id] = data;
    }
    return data;
  }).finally(() => {
    pendingVtsDetailRequests.delete(requestKey);
  });

  pendingVtsDetailRequests.set(requestKey, request);
  return request;
};

export default function VtsSystemForm({ open, editId, initialData, initialDataOnly = false, mode, onCancel, onSuccess }: VtsSystemFormProps = {}) {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  // "Lưu và phê duyệt" bỏ qua cả 2 vòng duyệt nên chỉ dành cho tài khoản cấp Cục.
  // Frontend dùng quyền duyệt cấp Cục (`vts:approvec2` — F-065 §4) làm dấu hiệu;
  // backend mới là nơi kiểm tra thật theo cấp đơn vị của tài khoản.
  const canSaveAndApprove = userPermissions.includes('vts:approvec2');

  const isIframe = window.self !== window.top;
  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeId;
  const isEditMode = isModalMode ? mode === 'edit' : searchParams.get('mode') === 'edit';
  const isDetailMode = isModalMode ? mode === 'detail' : (!!id && !isEditMode);
  const isCreateMode = isModalMode ? mode === 'create' : !id;

  const [record, setRecord] = useState<VtsSystemResponse | null>(null);

  // N09/BR-019 — tài liệu đính kèm chỉ sửa được khi hồ sơ ở "Lưu tạm" hoặc bị
  // trả về; các trạng thái còn lại (đang chờ duyệt, đã duyệt, đã xóa) bị khóa.
  const attachmentsEditable = !record?.approvalStatus
    || record.approvalStatus === ApprovalStatus.DRAFT
    || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1
    || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2;
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [operatingOrganizations, setOperatingOrganizations] = useState<Array<{ id: string; name: string; code: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [rawPorts, setRawPorts] = useState<any[]>([]);
  const [tabKey, setTabKey] = useState('general');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [zoneList, setZoneList] = useState<any[]>([]);
  const [detailSectionsLoaded, setDetailSectionsLoaded] = useState({ zones: false, attachments: false });
  const [loadingDetailSection, setLoadingDetailSection] = useState<'zones' | 'attachments' | null>(null);

  const selectedOrgUnitId = Form.useWatch('orgUnitId', form);
  const selectedOwningOrgId = Form.useWatch('owningOrgId', form);
  const effectiveOrgUnitId = selectedOrgUnitId || selectedOwningOrgId;

  const filteredPortOptions = useMemo(() => {
    if (!effectiveOrgUnitId) return [];
    return rawPorts
      .filter((port) => String(port.orgUnitId) === String(effectiveOrgUnitId))
      .map((port) => ({ value: port.id, label: port.portName || port.portCode || port.id }));
  }, [rawPorts, effectiveOrgUnitId]);

  const formInitialValues = useRef({
    conditionStatus: ConditionStatus.OPERATIONAL,
    recordSecurityLevel: RecordSecurityLevel.NORMAL,
  });
  // Thanh phê duyệt trong drawer chi tiết (F-065 §1: duyệt được từ Form chi tiết
  // hoặc menu ngữ cảnh trên danh sách).
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('draft');

  useEffect(() => {
    if (isModalMode && !open) return;
    if (!isDetailMode) {
      (async () => {
        try {
          const [scopedOrganizations, scopedPorts, operatingOrgs] = await Promise.all([
            vtsSystemCRUD.getScopedOrgUnitOptions(),
            vtsSystemCRUD.getScopedPortOptions(),
            vtsSystemCRUD.getOperatingOrganizationOptions(),
          ]);
          const allowedOrgUnitIds = new Set(scopedOrganizations.map((organization) => String(organization.id)));
          setOrganizations(scopedOrganizations);
          setOperatingOrganizations(operatingOrgs);
          setRawPorts(scopedPorts.filter((port) => port.orgUnitId && allowedOrgUnitIds.has(String(port.orgUnitId))));
        } catch (err) {
          console.error('Không thể tải danh sách đơn vị và cảng biển', err);
        }
      })();
    } else {
      setRawPorts([]);
    }
  }, [open, isDetailMode]);

  // Fetch detail data
  useEffect(() => {
    let cancelled = false;

    if (id && (isModalMode ? open : true)) {
      const loadData = async () => {
        setDetailSectionsLoaded({ zones: !isDetailMode, attachments: !isDetailMode });
        const cached = getVtsDetailCache()[id];
        const localData = initialDataOnly && isCompleteVtsDetail(initialData)
          ? initialData
          : (isCompleteVtsDetail(cached)
            ? cached
            : (isCompleteVtsDetail(initialData) ? initialData : null));

        // The list response is intentionally lightweight. Only reuse a full
        // detail response here so edit mode does not lose fields.
        setIsLoading(!localData);
        setFormError(null);
        try {
          const data = localData || await loadVtsDetail(id);
          if (cancelled) return;
          if (!data) throw new Error('Không tìm thấy dữ liệu Hệ thống VTS');
          setRecord(data);

          const provinceVal = data.province
            ? data.province
            : (data.provinceId ? getProvinceNameById(data.provinceId) : undefined);

          // Defer setFieldsValue to next frame so Form inside Drawer is mounted
          requestAnimationFrame(() => {
            form.setFieldsValue({
              systemName: data.systemName,
              location: data.address || data.province || '',
              conditionStatus: data.conditionStatus || ConditionStatus.OPERATIONAL,
              recordSecurityLevel: data.recordSecurityLevel || RecordSecurityLevel.NORMAL,
              scope: data.scope,
              note: data.note,
              orgUnitId: data.orgUnitId,
              owningOrgId: data.owningOrgId,
              operatingOrgId: data.operatingOrgId,
              portId: data.portId,
              code: data.code,
              province: provinceVal,
              provinceId: data.provinceId,
              address: data.address,
              maritimeNotice: data.maritimeNotice,
              operationStartDate: data.operationStartDate ? dayjs(data.operationStartDate) : undefined,
              spatialData: {
                geometryType: data.geometryType,
                coordinates: data.coordinates,
              }
            });
          });
          if (data.zones && data.zones.length > 0) {
            setZoneList(data.zones.map((z: any) => ({
              ...z,
              status: z.status || z.conditionStatus || ConditionStatus.OPERATIONAL,
              conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
            })));
          } else {
            setZoneList([]);
          }
          setDetailSectionsLoaded({
            zones: !isDetailMode || Array.isArray(data.zones),
            attachments: !isDetailMode || Array.isArray(data.attachments),
          });
        } catch (err) {
          setFormError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };
      loadData();
    } else if (!id && isCreateMode && (isModalMode ? open : true)) {
      form.resetFields();
      setRecord(null);
      setFormError(null);
      setPendingFiles([]);
      setZoneList([]);
      setHasChanges(false);
      setTabKey('general');
      vtsSystemCRUD.generateCode().then((res) => {
        if (!cancelled && res?.code) {
          setGeneratedCode(res.code);
          form.setFieldsValue({
            code: res.code,
            conditionStatus: ConditionStatus.OPERATIONAL,
            recordSecurityLevel: RecordSecurityLevel.NORMAL,
          });
          requestAnimationFrame(() => {
            form.setFieldsValue({
              code: res.code,
              conditionStatus: ConditionStatus.OPERATIONAL,
              recordSecurityLevel: RecordSecurityLevel.NORMAL,
            });
          });
        }
      }).catch(() => {
        requestAnimationFrame(() => {
          form.setFieldsValue({
            conditionStatus: ConditionStatus.OPERATIONAL,
            recordSecurityLevel: RecordSecurityLevel.NORMAL,
          });
        });
      });
    }
    return () => {
      cancelled = true;
    };
  }, [id, open, isCreateMode, isModalMode, isDetailMode, initialData, initialDataOnly, form]);

  const loadDetailSection = async (section: 'zones' | 'attachments') => {
    if (!isDetailMode || !id || detailSectionsLoaded[section] || loadingDetailSection === section) return;

    setLoadingDetailSection(section);
    try {
      if (section === 'zones') {
        const zones = await vtsSystemCRUD.getZones(id);
        setZoneList(zones.map((z: any) => ({
          ...z,
          status: z.status || z.conditionStatus || ConditionStatus.OPERATIONAL,
          conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
        })));
        setRecord((current) => current ? { ...current, zones } : current);
      } else {
        const attachments = await vtsSystemCRUD.getAttachments(id);
        setRecord((current) => current ? { ...current, attachments } : current);
      }
      setDetailSectionsLoaded((current) => ({ ...current, [section]: true }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải dữ liệu chi tiết');
    } finally {
      setLoadingDetailSection(null);
    }
  };

  /** Nạp lại hồ sơ từ server (đồng thời làm mới cache) sau thao tác đổi tài liệu. */
  const refreshRecordFromServer = async (recordId: string) => {
    invalidateVtsDetailCache(recordId);
    try {
      const fresh = await loadVtsDetail(recordId);
      if (fresh) setRecord(fresh);
    } catch (err) {
      console.error('Không thể nạp lại hồ sơ VTS sau khi đổi tài liệu đính kèm', err);
    }
  };

  /** Tải các tệp đang chờ lên hồ sơ; trả về tên những tệp tải lên thất bại. */
  const uploadPendingFiles = async (recordId: string): Promise<string[]> => {
    const failed: string[] = [];
    for (const file of pendingFiles) {
      try {
        await vtsSystemApproval.uploadAttachment(recordId, file);
      } catch (err) {
        console.error('Lỗi tải file lên:', file.name, err);
        failed.push(file.name);
      }
    }
    return failed;
  };

  /** Tệp đính kèm hỏng không được nuốt im lặng sau một toast "thành công". */
  const reportFailedUploads = (failed: string[]) => {
    if (failed.length === 0) return;
    toast.error(`Không tải lên được ${failed.length} tệp đính kèm: ${failed.join(', ')}`);
  };

  const handleSubmitForm = async (values: any) => {
    setIsSubmitting(true);
    try {
      const spatialData = values.spatialData;
      const currentAction = actionTypeRef.current;
      const targetApprovalStatus = isCreateMode
        ? (currentAction === 'draft'
          ? ApprovalStatus.DRAFT
          : currentAction === 'submit'
            ? ApprovalStatus.PENDING_APPROVAL
            : ApprovalStatus.APPROVED)
        : (record?.approvalStatus || ApprovalStatus.APPROVED);

      const payload: CreateVtsSystemRequest | UpdateVtsSystemRequest = {
        systemName: values.systemName,
        conditionStatus: values.conditionStatus,
        approvalStatus: targetApprovalStatus as any,
        recordSecurityLevel: values.recordSecurityLevel || RecordSecurityLevel.NORMAL,
        scope: values.scope,
        orgUnitId: values.orgUnitId || values.owningOrgId,
        owningOrgId: values.owningOrgId || values.orgUnitId,
        operatingOrgId: values.operatingOrgId,
        portId: values.portId,
        code: values.code || generatedCode || undefined,
        zones: zoneList,
        province: values.province,
        provinceId: values.provinceId || (values.province ? getProvinceIdByName(values.province) : undefined),
        address: values.address,
        maritimeNotice: values.maritimeNotice,
        operationStartDate: values.operationStartDate ? dayjs(values.operationStartDate).format('YYYY-MM-DD') : undefined,
        note: values.note,
        geometryType: spatialData?.geometryType,
        coordinates: spatialData?.coordinates,
      };

      if (isCreateMode) {
        // Tệp đính kèm chỉ sửa được khi hồ sơ còn "Lưu tạm" — hồ sơ đang chờ duyệt
        // bị khóa sửa và hồ sơ đã duyệt bị backend từ chối (N09/BR-019). Vì vậy
        // luôn tạo ở trạng thái Lưu tạm, tải tệp lên, rồi mới chuyển sang trạng
        // thái đích; làm ngược lại thì bản vừa gửi duyệt bị đưa về lại Lưu tạm.
        const res = await vtsSystemCRUD.create({
          ...(payload as CreateVtsSystemRequest),
          approvalStatus: ApprovalStatus.DRAFT,
        });
        const failedUploads = res.id ? await uploadPendingFiles(res.id) : pendingFiles.map((file) => file.name);

        if (res.id && currentAction === 'submit') {
          await vtsSystemApproval.submit(res.id);
        } else if (res.id && currentAction === 'approve') {
          await vtsSystemCRUD.update(res.id, { approvalStatus: ApprovalStatus.APPROVED } as UpdateVtsSystemRequest);
        }
        invalidateVtsDetailCache(res.id);

        setPendingFiles([]);
        setZoneList([]);
        const msg =
          currentAction === 'draft'
            ? 'Lưu tạm hệ thống VTS thành công'
            : currentAction === 'submit'
              ? 'Lưu và gửi phê duyệt thành công'
              : 'Lưu và phê duyệt thành công';
        toast.success(msg);
        reportFailedUploads(failedUploads);
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/vts-system');
        }
      } else if (id && isEditMode) {
        await vtsSystemCRUD.update(id, payload as UpdateVtsSystemRequest);
        const failedUploads = await uploadPendingFiles(id);
        setPendingFiles([]);
        invalidateVtsDetailCache(id);
        toast.success('Cập nhật thành công');
        reportFailedUploads(failedUploads);
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/vts-system');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalAction = async (
    action: 'approveC1' | 'approveC2' | 'reject' | 'delete',
    payload?: Record<string, unknown>
  ) => {
    if (!id || !record) return;

    setIsSubmitting(true);
    try {
      if (action === 'approveC1') {
        const pheDuyetData: ApprovalRequest = {
          decision: 'APPROVED',
          reason: (payload?.lyDo as string) || 'Đã phê duyệt cấp 1',
        };
        const updated = await vtsSystemApproval.approveC1(id, pheDuyetData);
        invalidateVtsDetailCache(id);
        toast.success('Phê duyệt cấp Cảng vụ thành công');
        setRecord((current) => applyApprovalResult(current, updated));
        setHasChanges(true);
        if (onSuccess) onSuccess();
      } else if (action === 'approveC2') {
        const pheDuyetData: ApprovalRequest = {
          decision: 'APPROVED',
          reason: (payload?.lyDo as string) || 'Đã phê duyệt cấp 2',
        };
        const updated = await vtsSystemApproval.approveC2(id, pheDuyetData);
        invalidateVtsDetailCache(id);
        toast.success('Phê duyệt cấp Cục thành công');
        setRecord((current) => applyApprovalResult(current, updated));
        setHasChanges(true);
        if (onSuccess) onSuccess();
      } else if (action === 'reject') {
        const pheDuyetData: ApprovalRequest = {
          decision: 'REJECTED',
          reason: (payload?.lyDo as string) || 'Từ chối phê duyệt',
        };
        let updatedRecord: VtsSystemResponse | null = null;
        if (record.approvalStatus === ApprovalStatus.PENDING_APPROVAL || (record.approvalStatus as any) === 'pending_approval') {
          updatedRecord = await vtsSystemApproval.approveC1(id, pheDuyetData);
        } else if (record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 || (record.approvalStatus as any) === 'approved_level1') {
          updatedRecord = await vtsSystemApproval.approveC2(id, pheDuyetData);
        } else {
          throw new Error('Chỉ được từ chối bản ghi đang chờ Cảng vụ duyệt (C1) hoặc chờ Cục duyệt (C2)');
        }
        // Không ghi `updatedRecord` ngược vào cache: API phê duyệt trả về bản rút
        // gọn (vùng VTS / tệp đính kèm rỗng, chưa có tọa độ) nhưng vẫn qua được
        // `isCompleteVtsDetail`, khiến lần mở chi tiết sau mất các phần đó.
        invalidateVtsDetailCache(id);

        toast.success('Từ chối phê duyệt thành công');
        setRecord((current) => applyApprovalResult(current, updatedRecord));
        setHasChanges(true);
        if (onSuccess) onSuccess();
      } else if (action === 'delete') {
        await vtsSystemCRUD.delete(id);
        invalidateVtsDetailCache(id);
        toast.success('Xóa thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/vts-system');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadAttachment = async (file: File) => {
    // N09/BR-019: hồ sơ đang chờ duyệt / đã duyệt bị khóa sửa tài liệu. Chặn ngay
    // ở đây để người dùng biết lý do thay vì chờ backend trả lỗi.
    if (!isCreateMode && !attachmentsEditable) {
      toast.error('Chỉ thay đổi được tài liệu đính kèm khi hồ sơ ở trạng thái Lưu tạm hoặc Bị trả về');
      return;
    }
    // Ngưỡng dung lượng và định dạng bám đúng ràng buộc backend, tránh trường hợp
    // giao diện cho chọn rồi server mới từ chối.
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng mỗi file không được vượt quá 10MB theo quy định');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      toast.error('Định dạng không hỗ trợ (chỉ chấp nhận PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF)');
      return;
    }
    const currentCount = isCreateMode ? pendingFiles.length : (record?.attachments?.length || 0);
    if (currentCount >= 10) {
      toast.error('Số lượng file đính kèm tối đa là 10 file theo quy định');
      return;
    }

    if (isCreateMode) {
      setPendingFiles((prev) => [...prev, file]);
      return;
    }
    if (!id) throw new Error('Cần lưu hệ thống VTS trước khi tải tài liệu lên');
    const uploaded = await vtsSystemApproval.uploadAttachment(id, file);
    setRecord((prev) => (prev ? { ...prev, attachments: [...(prev.attachments || []), uploaded] } : prev));
    // Thay đổi tài liệu sau khi đã gửi duyệt khiến backend đưa hồ sơ về "Lưu tạm"
    // (approvalRestart), nên phải nạp lại từ server thay vì cache bản sửa cục bộ.
    void refreshRecordFromServer(id);
    setHasChanges(true);
    toast.success('Tải tệp lên thành công');
  };

  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

  const handleDeleteAttachment = async (recordOrId: any) => {
    const attachmentId = typeof recordOrId === 'string' ? recordOrId : recordOrId?.id;
    if (!isCreateMode && !attachmentsEditable) {
      toast.error('Chỉ thay đổi được tài liệu đính kèm khi hồ sơ ở trạng thái Lưu tạm hoặc Bị trả về');
      return;
    }
    if (isCreateMode) {
      setPendingFiles((prev) => prev.filter((_, idx) => `temp-${idx}` !== attachmentId && idx !== recordOrId?._idx));
      return;
    }
    if (!id || !attachmentId) return;
    setDeletingAttachmentId(attachmentId);
    try {
      await vtsSystemApproval.deleteAttachment(id, attachmentId);
      setRecord((prev) => (prev
        ? { ...prev, attachments: (prev.attachments || []).filter((a) => a.id !== attachmentId) }
        : prev));
      void refreshRecordFromServer(id);
      setHasChanges(true);
      toast.success('Xóa tệp thành công');
    } catch (err: any) {
      toast.error('Lỗi khi xóa tệp đính kèm');
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);

  const handleDownloadAttachment = async (att: any) => {
    if (!att?.filePath) {
      toast.error('Không tìm thấy đường dẫn tệp');
      return;
    }
    setDownloadingAttachmentId(att.id);
    try {
      const url = att.filePath.startsWith('/api')
        ? att.filePath.replace(/^\/api/, '')
        : att.filePath;
      const resp = await api.get(url, {
        responseType: 'blob',
      });
      const contentType = typeof resp.headers?.['content-type'] === 'string'
        ? resp.headers['content-type']
        : 'application/octet-stream';
      const blob = new Blob([resp.data], {
        type: contentType,
      });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = att.fileName || 'tai-lieu';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error('Lỗi tải tệp:', err);
      toast.error('Không thể tải xuống tệp đính kèm');
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const handleCloseModal = () => {
    if (hasChanges && onSuccess) {
      onSuccess();
    } else if (onCancel) {
      onCancel();
    }
  };

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Hệ thống VTS', onClick: () => navigate('/vts-system') },
    { title: isCreateMode ? 'Tạo mới' : isEditMode ? 'Chỉnh sửa' : 'Chi tiết' },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Spin fullscreen description="Đang tải..." />
      </div>
    );
  }

  if (formError) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Empty description={formError} style={{ marginTop: '50px' }} />
          <Button onClick={() => navigate('/vts-system')} style={{ marginTop: '16px' }}>
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  // Detail/Read-only view
  if (isDetailMode) {
    // Trạng thái quyết định vòng duyệt hiện tại, theo đúng 7 trạng thái chuẩn:
    // vòng 1 mở khi "Chờ Cảng vụ duyệt", vòng 2 mở khi "Chờ Cục duyệt".
    const canApproveC1 = userPermissions.includes('vts:approvec1')
      && record?.approvalStatus === ApprovalStatus.PENDING_APPROVAL;
    const canApproveC2 = userPermissions.includes('vts:approvec2')
      && record?.approvalStatus === ApprovalStatus.APPROVED_LEVEL1;
    // BR-065-02 / 4 mắt: người đã duyệt vòng 1 không được duyệt tiếp vòng 2.
    const isSelfApprovalC2 = Boolean(currentUser?.userId && record?.approverLevel1 === currentUser.userId);
    const selfApprovalHint = isSelfApprovalC2
      ? 'Bạn không thể tự phê duyệt hồ sơ do mình xét duyệt C1'
      : '';

    const openApprove = (level: 'c1' | 'c2') => { setApproveLevel(level); setApproveModalOpen(true); };
    const openReject = () => { setRejectReason(''); setRejectModalOpen(true); };

    const approvalActionBar = (canApproveC1 || canApproveC2) ? (
      <div style={drawerFooterStyle}>
        {canApproveC1 && (
          <>
            <Button danger onClick={openReject} loading={isSubmitting}
              style={{ borderRadius: radiusPill, height: 40 }}>
              Từ chối cấp Cảng vụ
            </Button>
            <Button type="primary" onClick={() => openApprove('c1')} loading={isSubmitting}
              style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}>
              Phê duyệt cấp Cảng vụ
            </Button>
          </>
        )}
        {canApproveC2 && (
          <Tooltip title={selfApprovalHint}>
            <Space size={spaceSm}>
              <Button danger disabled={isSelfApprovalC2} onClick={openReject} loading={isSubmitting}
                style={{ borderRadius: radiusPill, height: 40 }}>
                Từ chối cấp Cục
              </Button>
              <Button type="primary" disabled={isSelfApprovalC2} onClick={() => openApprove('c2')} loading={isSubmitting}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}>
                Phê duyệt cấp Cục
              </Button>
            </Space>
          </Tooltip>
        )}
      </div>
    ) : null;

    const approvalDialogs = (
      <>
        <ApprovalModal
          visible={approveModalOpen}
          level={approveLevel}
          onConfirm={(content: string) => {
            setApproveModalOpen(false);
            void handleApprovalAction(approveLevel === 'c1' ? 'approveC1' : 'approveC2', { lyDo: content });
          }}
          onCancel={() => setApproveModalOpen(false)}
        />
        <Modal
          title="Từ chối phê duyệt"
          open={rejectModalOpen}
          okText="Từ chối"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          onCancel={() => setRejectModalOpen(false)}
          onOk={() => {
            // BR-016: lý do từ chối bắt buộc, tối thiểu 10 ký tự sau khi trim.
            if (rejectReason.trim().length < 10) {
              toast.error('Lý do từ chối phải có ít nhất 10 ký tự');
              return;
            }
            setRejectModalOpen(false);
            void handleApprovalAction('reject', { lyDo: rejectReason.trim() });
          }}
        >
          <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối (tối thiểu 10 ký tự):</p>
          <Input.TextArea rows={3} value={rejectReason} maxLength={500} showCount
            onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối..." style={textAreaStyle} />
        </Modal>
      </>
    );

    const detailContent = (
      <div style={{ paddingTop: 16 }}>
        <style>{`.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; } .detail-row { display: flex; padding: 10px 12px; border-bottom: 1px solid ${borderDefault}; } .detail-row--full { grid-column: 1 / -1; } .detail-label { width: 230px; flex-shrink: 0; color: ${colors.sidebarBg}; font-weight: ${fontWeightBold}; font-size: ${fontSizeMd}px; } .detail-label::after { content: ':'; margin-left: 2px; } .detail-value { color: ${textPrimary}; font-size: ${fontSizeMd}px; flex: 1; min-width: 0; overflow-wrap: anywhere; } .detail-value .ant-tag { margin-left: -6px !important; }`}</style>
        {record && (
          <Tabs
            defaultActiveKey="general"
            onChange={(key) => {
              if (key === 'zones' || key === 'files') {
                void loadDetailSection(key === 'zones' ? 'zones' : 'attachments');
              }
            }}
            tabBarStyle={{ marginBottom: 0, paddingTop: 0 }}
            items={[
              {
                key: 'general',
                label: 'Thông tin chung',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div className="detail-grid">
                      {[
                        ['Đơn vị quản lý', record.orgUnitName || '—'],
                        ['Đơn vị chủ quản', record.owningOrgName || '—'],
                        ['Đơn vị vận hành khai thác', record.operatingOrgName || '—'],
                        ['Thuộc cảng biển', record.portName || '—'],
                        ['Mã hệ thống VTS', record.code || '—'],
                        ['Tên hệ thống VTS', record.systemName || '—'],
                        ['Địa điểm (Tỉnh/Thành phố)', record.province || (record.provinceId ? getProvinceNameById(record.provinceId) : '—')],
                        ['Địa điểm chi tiết', record.address || '—'],
                        ['Thời gian bắt đầu hoạt động', record.operationStartDate ? dayjs(record.operationStartDate).format('DD/MM/YYYY') : '—'],
                        ['Phạm vi áp dụng', record.scope || '—'],
                        ['Thông báo hàng hải', record.maritimeNotice || '—'],
                        ['Ghi chú', record.note || '—'],
                        ['Tình trạng', renderConditionStatusBadge(record.conditionStatus)],
                        ['Trạng thái', <ApprovalStatusBadge status={record.approvalStatus} />],
                      ].map(([label, value], i) => (
                        <div key={i} className="detail-row">
                          <span className="detail-label">{label}</span>
                          <span className="detail-value">{value}</span>
                        </div>
                      ))}
                    </div>

                    {record.rejectionReason && (
                      <div style={{ marginTop: 16, padding: '12px 16px', background: `${statusCritical}10`, border: `1px solid ${statusCritical}30`, borderRadius: radiusMd }}>
                        <div style={{ fontWeight: fontWeightBold, color: statusCritical, marginBottom: 4 }}>Lý do từ chối:</div>
                        <div>{record.rejectionReason}</div>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'zones',
                label: 'Thông tin vùng VTS',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    {loadingDetailSection === 'zones' ? (
                      <Spin />
                    ) : zoneList.length === 0 ? (
                      <Empty description="Không có dữ liệu" style={{ margin: '32px 0' }} />
                    ) : (
                      <Table
                        className="list-view-table"
                        dataSource={zoneList.map((z, i) => ({ ...z, key: i, _idx: i }))}
                        pagination={false}
                        size="middle"
                        bordered
                        scroll={{ x: 600 }}
                      >
                        <Table.Column title="STT" dataIndex="_idx" key="stt" width={60} align="center" render={(val: number) => val + 1} />
                        <Table.Column title="Mã vùng VTS" dataIndex="code" key="code" render={(val) => val || '—'} />
                        <Table.Column title="Tên vùng VTS" dataIndex="name" key="name" render={(val) => val || '—'} />
                        <Table.Column title="Tình trạng" dataIndex="conditionStatus" key="conditionStatus"
                          render={(val: ConditionStatus) => renderConditionStatusBadge(val)} />
                      </Table>
                    )}
                  </div>
                ),
              },
              {
                key: 'files',
                label: 'File đính kèm',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    {loadingDetailSection === 'attachments' ? (
                      <Spin />
                    ) : (
                      <AttachmentList attachments={record?.attachments || []} readonly={true} />
                    )}
                  </div>
                ),
              },
              {
                key: 'update_log',
                label: 'Thông tin log cập nhật',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div className="detail-grid">
                      <div className="detail-row">
                        <span className="detail-label">Ngày cập nhật</span>
                        <span className="detail-value">{record.updatedDate ? dayjs(record.updatedDate).format('DD/MM/YYYY HH:mm:ss') : '—'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Cán bộ cập nhật</span>
                        <span className="detail-value">{record.updatedByName || '—'}</span>
                      </div>

                      <div className="detail-row">
                        <span className="detail-label">Ngày gửi phê duyệt</span>
                        <span className="detail-value">{(record.submittedDate || record.createdDate) ? dayjs(record.submittedDate || record.createdDate).format('DD/MM/YYYY HH:mm:ss') : '—'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Cán bộ gửi phê duyệt</span>
                        <span className="detail-value">{record.submittedByName || record.createdByName || '—'}</span>
                      </div>

                      <div className="detail-row">
                        <span className="detail-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="detail-value">{record.approvedDateLevel1 ? dayjs(record.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="detail-value">{record.approverLevel1Name || '—'}</span>
                      </div>
                      <div className="detail-row detail-row--full">
                        <span className="detail-label">Nội dung phê duyệt cấp Cảng vụ/Chi cục</span>
                        <span className="detail-value">
                          {record.approvalContentLevel1 || (record.approverLevel1 || record.approverLevel1Name ? 'Đã phê duyệt' : (record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 && !record.approverLevel2 ? record.rejectionReason : '—')) || '—'}
                        </span>
                      </div>

                      <div className="detail-row">
                        <span className="detail-label">Ngày phê duyệt cấp Cục</span>
                        <span className="detail-value">{record.approvedDateLevel2 ? dayjs(record.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Cán bộ phê duyệt cấp Cục</span>
                        <span className="detail-value">{record.approverLevel2Name || '—'}</span>
                      </div>
                      <div className="detail-row detail-row--full">
                        <span className="detail-label">Nội dung phê duyệt cấp Cục</span>
                        <span className="detail-value">
                          {record.approvalContentLevel2 || (record.approverLevel2 || record.approverLevel2Name || record.approvalStatus === ApprovalStatus.APPROVED ? 'Đã phê duyệt' : (record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2 && record.approverLevel1 ? record.rejectionReason : '—')) || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    );

    if (isModalMode) {
      return (
        <AppDrawer
          size="50%"
          title={
            <span style={drawerTitleStyle}>
              {record?.systemName ? `Xem chi tiết hệ thống VTS - ${record.systemName}` : 'Xem chi tiết hệ thống VTS'}
            </span>
          }
          open={open}
          onClose={handleCloseModal}
          footer={approvalActionBar}
        >
          <Spin spinning={isLoading}>
            <Form form={form} component={false}>
              {detailContent}
            </Form>
          </Spin>
          {approvalDialogs}
        </AppDrawer>
      );
    }

    return (
      <div style={{ padding: '24px' }}>
        <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />
        <Form form={form} component={false}>
          {detailContent}
        </Form>
        {approvalActionBar}
        {approvalDialogs}
      </div>
    );
  }

  if (isModalMode) {
    return (
      <AppDrawer
        size="50%"
        title={
          <span style={drawerTitleStyle}>
            {isCreateMode
              ? 'Thêm mới hệ thống VTS'
              : (record?.systemName ? `Chỉnh sửa — ${record.systemName}` : 'Chỉnh sửa hệ thống VTS')}
          </span>
        }
        open={open}
        onClose={handleCloseModal}
        footer={
          <div style={drawerFooterStyle}>
            {isCreateMode ? (
              <>
                <Button
                  onClick={() => {
                    actionTypeRef.current = 'draft';
                    setActionType('draft');
                    form.submit();
                  }}
                  loading={isSubmitting && actionType === 'draft'}
                  style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
                >
                  Lưu tạm
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    actionTypeRef.current = 'submit';
                    setActionType('submit');
                    form.submit();
                  }}
                  loading={isSubmitting && actionType === 'submit'}
                  style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
                >
                  Lưu và gửi phê duyệt
                </Button>
                {canSaveAndApprove && (
                  <Button
                    type="primary"
                    onClick={() => {
                      actionTypeRef.current = 'approve';
                      setActionType('approve');
                      form.submit();
                    }}
                    loading={isSubmitting && actionType === 'approve'}
                    style={{
                      ...primaryButtonStyle,
                      background: statusOperational,
                      borderColor: statusOperational,
                      borderRadius: radiusPill,
                      height: 40,
                    }}
                  >
                    Lưu và phê duyệt
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={onCancel}
                  style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    actionTypeRef.current = 'update';
                    setActionType('update');
                    form.submit();
                  }}
                  loading={isSubmitting && actionType === 'update'}
                  style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
                >
                  Cập nhật
                </Button>
              </>
            )}
          </div>
        }
        afterOpenChange={(visible) => {
          if (visible) {
            setTabKey('general');
            if (isCreateMode) {
              vtsSystemCRUD.generateCode().then((res) => {
                if (res?.code) {
                  setGeneratedCode(res.code);
                  form.setFieldsValue({
                    code: res.code,
                    conditionStatus: ConditionStatus.OPERATIONAL,
                    recordSecurityLevel: RecordSecurityLevel.NORMAL,
                  });
                }
              });
            }
          }
        }}
      >
        <Spin spinning={isLoading}>
          <style>{requiredMarkStyle}</style>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitForm}
            autoComplete="off"
            initialValues={formInitialValues.current}
          >
            <Tabs activeKey={tabKey} onChange={setTabKey} tabBarStyle={{ marginBottom: 0, paddingTop: 0 }} items={[
              {
                key: 'general', label: 'Thông tin hệ thống VTS',
                children: <div style={{ paddingTop: spaceMd }}>
                  <Row gutter={16}>
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
                          style={{ borderRadius: radiusPill, height: 40 }}
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
                          filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                          options={operatingOrganizations.map((o) => ({ value: o.id, label: o.name }))}
                          style={{ borderRadius: radiusPill, height: 40 }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
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
                          style={{ borderRadius: radiusPill, height: 40 }}
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
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên hệ thống VTS</span>}
                        name="systemName"
                        rules={[{ required: true, message: 'Vui lòng nhập tên hệ thống VTS' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Nhập tên hệ thống VTS" maxLength={255} showCount style={{ borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm (Tỉnh/TP)</span>}
                        name="province"
                        rules={[{ required: true, message: 'Vui lòng chọn địa điểm' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          showSearch
                          placeholder="Chọn địa điểm"
                          filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                          options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                          style={{ borderRadius: radiusPill, height: 40 }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                        name="address"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={{ borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thời gian bắt đầu hoạt động</span>}
                        name="operationStartDate"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <DatePicker
                          format="DD/MM/YYYY"
                          placeholder="Chọn thời gian bắt đầu hoạt động"
                          style={{ borderRadius: radiusPill, height: 40, width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Phạm vi áp dụng</span>}
                    name="scope"
                    style={{ marginBottom: spaceFormField }}
                  >
                    <Input.TextArea rows={3} placeholder="Nhập phạm vi áp dụng" showCount maxLength={2000} style={textAreaStyle} />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Thông báo hàng hải</span>}
                    name="maritimeNotice"
                    style={{ marginBottom: spaceFormField }}
                  >
                    <Input.TextArea rows={3} placeholder="Nhập thông báo hàng hải" showCount maxLength={2000} style={textAreaStyle} />
                  </Form.Item>

                  <Row gutter={16}>
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
                          style={{ borderRadius: radiusPill, height: 40 }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                        name="note"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input.TextArea rows={1} placeholder="Nhập ghi chú" showCount maxLength={2000} style={textAreaStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>,
              },
              {
                key: 'zones', label: 'Danh sách vùng VTS',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Danh sách vùng VTS</span>
                      {zoneList.length > 0 && (
                        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setZoneList((prev) => [...prev, { code: '', name: '', status: ConditionStatus.OPERATIONAL }])} style={{ borderRadius: radiusPill }}>Thêm vùng VTS</Button>
                      )}
                    </div>
                    {zoneList.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                        <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có vùng VTS nào.</span>
                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => setZoneList((prev) => [...prev, { code: '', name: '', status: ConditionStatus.OPERATIONAL }])} style={{ borderRadius: radiusPill }}>Thêm vùng VTS</Button>
                      </div>
                    ) : (
                      <Table className="list-view-table" dataSource={zoneList.map((z, i) => ({ ...z, key: i, _idx: i }))}
                        pagination={false} size="middle" bordered scroll={{ x: 600 }}>
                        <Table.Column title="STT" dataIndex="_idx" key="stt" width={60} align="center"
                          render={(val: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{val + 1}</span>}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Mã vùng VTS" key="code"
                          render={(_: any, record: any) => <Input value={record.code} onChange={(e) => { const next = [...zoneList]; next[record._idx].code = e.target.value; setZoneList(next); }} placeholder="Mã vùng" maxLength={50} showCount style={{ borderRadius: radiusPill, height: 40 }} />}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Tên vùng VTS" key="name"
                          render={(_: any, record: any) => <Input value={record.name} onChange={(e) => { const next = [...zoneList]; next[record._idx].name = e.target.value; setZoneList(next); }} placeholder="Tên vùng" maxLength={255} showCount style={{ borderRadius: radiusPill, height: 40 }} />}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="Tình trạng" key="status" width={200}
                          render={(_: any, record: any) => <Select value={record.status || record.conditionStatus || ConditionStatus.OPERATIONAL} onChange={(v) => { const next = [...zoneList]; next[record._idx].status = v; next[record._idx].conditionStatus = v; setZoneList(next); }} options={CONDITION_STATUS_OPTIONS} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                        <Table.Column title="" key="actions" width={44} align="center"
                          render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => setZoneList((prev) => prev.filter((_, idx) => idx !== record._idx))} />}
                          onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
                      </Table>
                    )}
                  </div>
                ),
              },

              {
                key: 'files', label: 'File đính kèm',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div style={{ marginBottom: spaceMd }}>
                      <Upload.Dragger
                        beforeUpload={(file) => {
                          if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
                          handleUploadAttachment(file);
                          return false;
                        }}
                        showUploadList={false}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                        multiple
                        style={{
                          background: '#fafbfc',
                          border: `1px dashed ${borderDefault}`,
                          borderRadius: radiusMd,
                          padding: '24px 16px',
                        }}
                      >
                        <p style={{ marginBottom: 8 }}>
                          <InboxOutlined style={{ fontSize: 44, color: actionPrimary }} />
                        </p>
                        <p style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: textPrimary, marginBottom: 4 }}>
                          Kéo thả tệp vào đây hoặc nhấp để chọn tệp tải lên
                        </p>
                        <p style={{ fontSize: fontSizeSm, color: textTertiary, margin: 0 }}>
                          Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.
                        </p>
                      </Upload.Dragger>
                    </div>

                    {((isCreateMode ? pendingFiles.length : (record?.attachments?.length || 0)) > 0) && (
                      <div style={{ marginBottom: spaceMd }}>
                        <div style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                          Danh sách tệp đính kèm ({isCreateMode ? pendingFiles.length : record?.attachments?.length})
                        </div>
                        <Table<any>
                          className="list-view-table"
                          dataSource={
                            isCreateMode
                              ? pendingFiles.map((f, i) => ({ id: `temp-${i}`, fileName: f.name, size: f.size, _idx: i, key: i }))
                              : (record?.attachments || []).map((f: any, i: number) => ({ ...f, _idx: i, key: f.id || i, size: f.size ?? f.fileSize }))
                          }
                          pagination={false}
                          size="middle"
                          bordered
                          scroll={{ x: 400 }}
                        >
                          <Table.Column title="STT" key="stt" width={60} align="center"
                            render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                          <Table.Column title="Tên file" key="fileName" dataIndex="fileName"
                            render={(name: string, record: any) => (
                              <a
                                style={{
                                  fontSize: fontSizeMd,
                                  color: actionPrimary,
                                  cursor: record.filePath ? 'pointer' : 'default',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: spaceSm,
                                }}
                                onClick={(e) => {
                                  if (record.filePath) {
                                    e.preventDefault();
                                    handleDownloadAttachment(record);
                                  }
                                }}
                                title={record.filePath ? 'Nhấn để tải tệp xuống' : undefined}
                              >
                                <FileOutlined style={{ color: actionPrimary }} />
                                <span>{name}</span>
                              </a>
                            )}
                            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                          <Table.Column title="Dung lượng" key="size" dataIndex="size" width={120}
                            render={(bytes: number) => {
                              if (!bytes) return '—';
                              if (bytes < 1024) return `${bytes} B`;
                              if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                              return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                            }}
                            onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                          <Table.Column title="Thao tác" key="actions" width={80} align="center"
                            render={(_: any, record: any) => (
                              <Space size="small">
                                {record.filePath && (
                                  <Button
                                    type="link"
                                    size="small"
                                    icon={<DownloadOutlined />}
                                    loading={downloadingAttachmentId === record.id}
                                    onClick={() => handleDownloadAttachment(record)}
                                    title="Tải xuống"
                                  />
                                )}
                                <Button
                                  type="link"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  loading={deletingAttachmentId === record.id}
                                  onClick={() => handleDeleteAttachment(record)}
                                  title="Xóa tệp"
                                />
                              </Space>
                            )}
                            onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
                        </Table>
                      </div>
                    )}
                    <div style={{ marginTop: spaceSm }}>
                      <span style={uploadHintStyle}>
                        Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.
                      </span>
                    </div>
                  </div>
                ),
              },
            ]} />
          </Form>
        </Spin>
      </AppDrawer>
    );
  }
  // Create/Edit form view
  return (
    <div style={isIframe ? { padding: '16px 24px', background: '#fff', minHeight: '100vh' } : { padding: '24px' }}>
      {!isIframe && <Breadcrumb items={breadcrumbs} style={{ marginBottom: '16px' }} />}
      <Card
        style={isIframe ? { border: 'none', boxShadow: 'none', padding: 0 } : { maxWidth: '800px' }}
        styles={isIframe ? { body: { padding: 0 } } : undefined}
      >
        {!isIframe && <h2>{isCreateMode ? 'Tạo mới hệ thống VTS' : 'Chỉnh sửa hệ thống VTS'}</h2>}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitForm}
          autoComplete="off"
          initialValues={formInitialValues.current}
        >
          <Form.Item
            label="Tên hệ thống"
            name="systemName"
            rules={[{ required: true, message: 'Vui lòng nhập tên hệ thống' }]}
          >
            <Input placeholder="Nhập tên hệ thống" />
          </Form.Item>

          <Form.Item
            label="Vị trí"
            name="location"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
          >
            <Input placeholder="Nhập vị trí" />
          </Form.Item>

          <Form.Item
            label="Tình trạng"
            name="conditionStatus"
          >
            <Select
              placeholder="Chọn tình trạng"
              options={CONDITION_STATUS_OPTIONS}
            />
          </Form.Item>

          <Form.Item label="Phạm vi áp dụng" name="scope">
            <Input.TextArea rows={3} placeholder="Nhập phạm vi áp dụng" style={textAreaStyle} />
          </Form.Item>

          <Form.Item
            label="Đơn vị quản lý"
            name="orgUnitId"
            rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
          >
            <OrgUnitTreeSelect
              organizations={organizations}
              placeholder="Chọn đơn vị quản lý"
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Đơn vị chủ quản"
            name="owningOrgId"
            rules={[{ required: true, message: 'Vui lòng chọn đơn vị chủ quản' }]}
          >
            <OrgUnitTreeSelect
              organizations={organizations}
              placeholder="Chọn đơn vị chủ quản"
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Đơn vị vận hành"
            name="operatingOrgId"
            rules={[{ required: true, message: 'Vui lòng chọn đơn vị vận hành' }]}
          >
            <Select
              showSearch
              allowClear
              placeholder="Chọn đơn vị vận hành"
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              options={operatingOrganizations.map((o) => ({ value: o.id, label: o.name }))}
              style={{ borderRadius: radiusPill, height: 40 }}
            />
          </Form.Item>

          <Form.Item
            label="Thuộc cảng biển"
            name="portId"
          >
            <Select
              placeholder="Chọn cảng biển"
              allowClear
              showSearch
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              options={filteredPortOptions}
            />
          </Form.Item>

          <Form.Item
            label="Mã hệ thống VTS"
            name="code"
          >
            <Input
              placeholder="Mã tự sinh (VTS-xxxxxx)"
              disabled={true}
              maxLength={50}
              style={readonlyInputStyle}
            />
          </Form.Item>

          <Form.Item
            label="Địa điểm (Tỉnh/TP)"
            name="province"
            rules={[{ required: true, message: 'Vui lòng chọn địa điểm' }]}
          >
            <Select
              showSearch
              placeholder="Chọn địa điểm"
              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
            />
          </Form.Item>

          <Form.Item
            label="Địa điểm chi tiết"
            name="address"
          >
            <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            label="Thời gian bắt đầu hoạt động"
            name="operationStartDate"
          >
            <DatePicker format="DD/MM/YYYY" placeholder="Chọn thời gian bắt đầu hoạt động" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Thông báo hàng hải"
            name="maritimeNotice"
          >
            <Input.TextArea rows={3} placeholder="Nhập thông báo hàng hải" maxLength={2000} showCount style={textAreaStyle} />
          </Form.Item>

          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Danh sách vùng VTS</span>
            {zoneList.length > 0 && (
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setZoneList((prev) => [...prev, { code: '', name: '', status: ConditionStatus.OPERATIONAL }])} style={{ borderRadius: radiusPill }}>Thêm vùng VTS</Button>
            )}
          </div>
          {zoneList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có vùng VTS nào.</span>
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => setZoneList((prev) => [...prev, { code: '', name: '', status: ConditionStatus.OPERATIONAL }])} style={{ borderRadius: radiusPill }}>Thêm vùng VTS</Button>
            </div>
          ) : (
            <Table className="list-view-table" dataSource={zoneList.map((z, i) => ({ ...z, key: i, _idx: i }))}
              pagination={false} size="middle" bordered scroll={{ x: 600 }}>
              <Table.Column title="STT" dataIndex="_idx" key="stt" width={60} align="center"
                render={(val: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{val + 1}</span>}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Mã vùng VTS" key="code"
                render={(_: any, record: any) => <Input value={record.code} onChange={(e) => { const next = [...zoneList]; next[record._idx].code = e.target.value; setZoneList(next); }} placeholder="Mã vùng" maxLength={50} showCount style={{ borderRadius: radiusPill, height: 40 }} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Tên vùng VTS" key="name"
                render={(_: any, record: any) => <Input value={record.name} onChange={(e) => { const next = [...zoneList]; next[record._idx].name = e.target.value; setZoneList(next); }} placeholder="Tên vùng" maxLength={255} showCount style={{ borderRadius: radiusPill, height: 40 }} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Tình trạng" key="status" width={200}
                render={(_: any, record: any) => <Select value={record.status || record.conditionStatus || ConditionStatus.OPERATIONAL} onChange={(v) => { const next = [...zoneList]; next[record._idx].status = v; next[record._idx].conditionStatus = v; setZoneList(next); }} options={CONDITION_STATUS_OPTIONS} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="" key="actions" width={44} align="center"
                render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => setZoneList((prev) => prev.filter((_, idx) => idx !== record._idx))} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
            </Table>
          )}

          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
            {(isCreateMode ? pendingFiles.length > 0 : record?.attachments && record.attachments.length > 0) && (
              <Upload beforeUpload={(file) => { handleUploadAttachment(file); return false; }} showUploadList={false} multiple>
                <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>Thêm file</Button>
              </Upload>
            )}
          </div>
          {((isCreateMode ? pendingFiles.length : (record?.attachments?.length || 0)) === 0) ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
              <Upload beforeUpload={(file) => { handleUploadAttachment(file); return false; }} showUploadList={false} multiple>
                <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
              </Upload>
            </div>
          ) : (
            <Table className="list-view-table" dataSource={isCreateMode ? pendingFiles.map((f, i) => ({ id: `temp-${i}`, fileName: f.name, _idx: i, key: i })) : record?.attachments?.map((f, i) => ({ ...f, _idx: i, key: i }))}
              pagination={false} size="middle" bordered scroll={{ x: 400 }} style={{ marginBottom: 24 }}>
              <Table.Column title="STT" key="stt" width={60} align="center"
                render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="Tên file" key="fileName" dataIndex="fileName"
                render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              <Table.Column title="" key="actions" width={44} align="center"
                render={(_: any, record: any) => <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteAttachment(record.id)} />}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })} />
            </Table>
          )}

          <Form.Item label="Vị trí/Hình vẽ bản đồ" name="spatialData">
            <GisLocationSelector defaultGeometryType="POINT" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
              </Button>
              <Button onClick={isIframe ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*') : () => navigate('/vts-system')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

