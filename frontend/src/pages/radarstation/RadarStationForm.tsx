import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Modal,
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  Descriptions,
  Space,
  Spin,
  Row,
  Col,
  Breadcrumb,
  Popconfirm,
  Tabs,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, SendOutlined, UploadOutlined, FileOutlined } from '@ant-design/icons';
import toast from '../../components/ToastNotification';
import { radarStationCRUD, radarStationApproval, radarStationAttachment } from '../../services/radarStationService';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import type {
  RadarStationResponse,
  CreateRadarStationRequest,
  UpdateRadarStationRequest,
  HistoryEntry,
} from '../../types/radarStation';
import {
  CONDITION_STATUS_MAP,
  CONDITION_STATUS_OPTIONS,
  RADAR_STATION_STATUS_MAP,
  UNIT_OF_MEASURE_OPTIONS,
} from '../../types/radarStation';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import AttachmentList from '../../components/shared/AttachmentList';
import RejectionModal from '../../components/shared/RejectionModal';
import ApprovalModal from '../../components/shared/ApprovalModal';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { OrgUnitTreeSelect, type OrgUnitTreeOption } from '../../components/org-unit';
import { colors, fontWeightBold, fontSizeLg, spaceFormField, radiusLg, radiusPill, borderDefault, textTertiary, textPrimary, surfaceCard, outlineButtonStyle, primaryButtonStyle, statusBadgeStyle, statusDraft, statusAttention, statusOperational, statusCritical, statusInfo, inputStyle, selectStyle } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';

// Cỡ chữ chuẩn 13.5px cho màn trạm radar (tạo/mở chi tiết) — thay token fontSizeMd=13 của themetokenchk,
// mirror chuẩn BerthListPage để mọi text/label dùng fontSizeMd hiển thị 13.5px.
const fontSizeMd = 13.5;
const radarFormTokens = { ...themeTokenChk, fontSizeMd: 13.5 };
const formScopeFontCss = `
  .radar-form-scope .ant-table,
  .radar-form-scope .ant-table-cell,
  .radar-form-scope .ant-table-thead > tr > th,
  .radar-form-scope .ant-table-tbody > tr > td,
  .radar-form-scope .ant-input,
  .radar-form-scope .ant-input-affix-wrapper,
  .radar-form-scope .ant-select,
  .radar-form-scope .ant-select-selection-item,
  .radar-form-scope .ant-select-item-option-content,
  .radar-form-scope .ant-picker,
  .radar-form-scope .ant-picker-input > input,
  .radar-form-scope .ant-btn,
  .radar-form-scope .ant-breadcrumb,
  .radar-form-scope .ant-form-item-label > label,
  .radar-form-scope .ant-tabs-tab,
  .radar-form-scope .chk-detail-label,
  .radar-form-scope .chk-detail-value {
    font-size: 13.5px !important;
  }
`;

export interface RadarStationFormProps {
  open?: boolean;
  editId?: string | null;
  mode?: 'create' | 'edit' | 'detail';
  onCancel?: () => void;
  onSuccess?: () => void;
}

const getProvinceLabel = (provinceId?: string): string =>
  provinceId
    ? VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(provinceId))?.label || provinceId
    : '—';

// Status badge — semantic tokens (AGENTS.md: không hardcode màu), label từ RADAR_STATION_STATUS_MAP
const RADAR_STATION_STATUS_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: RADAR_STATION_STATUS_MAP.DRAFT?.label || 'Lưu tạm' },
  PROPOSED: { color: statusAttention, label: RADAR_STATION_STATUS_MAP.PROPOSED?.label || 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: statusAttention, label: RADAR_STATION_STATUS_MAP.PENDING_APPROVAL?.label || 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusInfo, label: RADAR_STATION_STATUS_MAP.APPROVED_LEVEL1?.label || 'Chờ phê duyệt cấp Cục' },
  APPROVED_LEVEL2: { color: statusOperational, label: RADAR_STATION_STATUS_MAP.APPROVED_LEVEL2?.label || 'Đã phê duyệt' },
  APPROVED: { color: statusOperational, label: RADAR_STATION_STATUS_MAP.APPROVED?.label || 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: RADAR_STATION_STATUS_MAP.REJECTED?.label || 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: statusCritical, label: RADAR_STATION_STATUS_MAP.REJECTED_LEVEL1?.label || 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: RADAR_STATION_STATUS_MAP.REJECTED_LEVEL2?.label || 'Từ chối cấp Cục' },
};

export default function RadarStationForm({ open, editId, mode, onCancel, onSuccess }: RadarStationFormProps = {}) {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const isIframe = window.self !== window.top;
  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeId;
  const isEditMode = isModalMode ? mode === 'edit' : searchParams.get('mode') === 'edit';
  const isDetailMode = isModalMode ? mode === 'detail' : Boolean(id && !isEditMode);
  const isCreateMode = isModalMode ? mode === 'create' : !id;

  const [record, setRecord] = useState<RadarStationResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | undefined>();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);

  const handleBeforeUpload = useCallback((file: any): false => {
    if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
    if (uploadedFiles.length >= 10) { toast.error('Tối đa 10 file đính kèm'); return false; }
    setUploadedFiles((p) => [...p, { uid: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, status: 'done' as const, originFileObj: file as any }]);
    return false;
  }, [uploadedFiles]);

  const removeUploadedFile = useCallback((uid: string) => {
    setUploadedFiles((p) => p.filter((f) => f.uid !== uid));
  }, []);

  // Dữ liệu dropdown
  const [orgOptions, setOrgOptions] = useState<OrgUnitTreeOption[]>([]);
  const [seaportOptions, setSeaportOptions] = useState<{ id: string; portCode?: string; portName?: string }[]>([]);
  const [vtsOptions, setVtsOptions] = useState<{ id: string; code?: string; systemName?: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        setOrgOptions(orgs || []);
      } catch (err) {
        console.error('Không tải được cây đơn vị quản lý', err);
      }
      try {
        const ports = await vtsSystemCRUD.getScopedPortOptions();
        setSeaportOptions(ports || []);
      } catch (err) {
        console.error('Không tải được danh sách cảng biển', err);
      }
      try {
        const vts = await vtsSystemCRUD.getOptions();
        setVtsOptions(
          (vts || []).map((item) => ({
            id: item.id,
            code: item.code,
            systemName: item.name,
          })),
        );
      } catch (err) {
        console.error('Không tải được danh sách hệ thống VTS', err);
      }
    })();
  }, []);

  const loadHistory = useCallback(async (stationId: string) => {
    setIsLoadingHistory(true);
    setHistoryError(undefined);
    try {
      const hist = await radarStationApproval.getHistory(stationId);
      setHistory(hist || []);
    } catch (err: unknown) {
      setHistoryError(err instanceof Error ? err.message : 'Không tải được lịch sử phê duyệt');
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const refreshAttachments = useCallback(async (stationId: string) => {
    try {
      const atts = await radarStationAttachment.list(stationId);
      setRecord((prev) => (prev ? { ...prev, attachments: atts } : prev));
    } catch (err) {
      console.error('Không tải được danh sách tài liệu đính kèm', err);
    }
  }, []);

  // Load chi tiết / điền form khi mở modal hoặc vào trang
  useEffect(() => {
    // Modal đang đóng → không tải lại dữ liệu
    if (isModalMode && !open) return;

    if (!isCreateMode && id) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = (cached || await radarStationCRUD.getById(id)) as RadarStationResponse;
          setRecord(data);
          form.setFieldsValue({
            code: data.code,
            stationName: data.stationName,
            location: data.location,
            orgUnitId: data.orgUnitId,
            seaportId: data.seaportId,
            vtsSystemId: data.vtsSystemId,
            vtsOperationCenterId: data.vtsOperationCenterId,
            operatingUnitId: data.operatingUnitId,
            provinceId: data.provinceId ? String(data.provinceId) : undefined,
            unitOfMeasure: data.unitOfMeasure,
            quantity: data.quantity,
            conditionStatus: data.conditionStatus || '1',
            towerHeight: data.towerHeight,
            radarRange: data.radarRange,
            note: data.note,
            gisLocation:
              data.longitude != null && data.latitude != null
                ? { geometryType: 'POINT', coordinates: `POINT(${data.longitude} ${data.latitude})` }
                : { geometryType: 'POINT', coordinates: '' },
          });
          if (isDetailMode) {
            void loadHistory(id);
          }
          void refreshAttachments(id);
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Không thể tải thông tin trạm radar');
        } finally {
          setIsLoading(false);
        }
      };
      void loadData();
    } else if (isCreateMode) {
      // Tạo mới: reset form + tự sinh mã radar (RADAR-{seq})
      form.resetFields();
      setRecord(null);
      setHistory([]);
      form.setFieldsValue({ conditionStatus: '1' });
      radarStationCRUD
        .generateCode()
        .then((res) => form.setFieldsValue({ code: res?.code || '' }))
        .catch((err) => console.error('Không sinh được mã trạm radar', err));
    }
  }, [open, isCreateMode, id, isDetailMode, isModalMode, form, loadHistory, refreshAttachments]);

  const handleSubmit = useCallback(async (submitMode: 'save' | 'submit' | 'approve' = 'save') => {
    try {
      const values = await form.validateFields();

      let longitude: number | undefined;
      let latitude: number | undefined;
      const gis = values.gisLocation;
      if (gis?.coordinates) {
        // GisLocationSelector xuất WKT dạng "POINT (lng lat)" — có khoảng trắng sau POINT
        const match = String(gis.coordinates).match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match) {
          longitude = parseFloat(match[1]);
          latitude = parseFloat(match[2]);
        }
      }

      const payload: CreateRadarStationRequest = {
        stationName: values.stationName?.trim(),
        location: values.location?.trim(),
        orgUnitId: values.orgUnitId || undefined,
        seaportId: values.seaportId || undefined,
        vtsSystemId: values.vtsSystemId || undefined,
        vtsOperationCenterId: values.vtsOperationCenterId || undefined,
        operatingUnitId: values.operatingUnitId || undefined,
        provinceId: values.provinceId ? String(values.provinceId) : undefined,
        unitOfMeasure: values.unitOfMeasure || undefined,
        quantity: values.quantity,
        conditionStatus: values.conditionStatus || '1',
        towerHeight: values.towerHeight,
        radarRange: values.radarRange,
        note: values.note?.trim() || undefined,
        longitude,
        latitude,
        geometryType: gis?.geometryType || 'POINT',
        coordinates: gis?.coordinates || undefined,
      };

      setIsSubmitting(true);
      if (isCreateMode) {
        const created = await radarStationCRUD.create(payload);
        const savedId = created.id || null;
        const newFiles = uploadedFiles.filter((f) => f.originFileObj).map((f) => f.originFileObj as File);
        if (savedId && newFiles.length > 0) {
          try {
            await Promise.all(newFiles.map((f) => radarStationAttachment.upload(savedId, f)));
          } catch (err) {
            console.error('Không tải lên được tài liệu đính kèm', err);
          }
        }
        if (savedId && window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[savedId] = created;
        }
        if (submitMode !== 'save' && savedId) {
          const submitted = await radarStationApproval.submitForApproval(savedId);
          if (submitMode === 'approve' && (submitted.status === 'APPROVED_LEVEL1' || submitted.approvalStatus === 'APPROVED_LEVEL1')) {
            await radarStationApproval.approveLevel2(savedId);
            toast.success('Đã phê duyệt');
          } else if (submitMode === 'approve') {
            toast.info('Đã tạo mới và gửi phê duyệt — hồ sơ đang chờ Cảng vụ/Chi cục duyệt');
          } else {
            toast.success('Đã tạo mới và gửi phê duyệt trạm radar');
          }
        } else {
          toast.success('Đã tạo mới trạm radar');
        }
      } else if (id && isEditMode) {
        const updated = await radarStationCRUD.update(id, payload as UpdateRadarStationRequest);
        const savedId = updated.id || id;
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = updated;
        }
        if (submitMode !== 'save' && savedId) {
          const submitted = await radarStationApproval.submitForApproval(savedId);
          if (submitMode === 'approve' && (submitted.status === 'APPROVED_LEVEL1' || submitted.approvalStatus === 'APPROVED_LEVEL1')) {
            await radarStationApproval.approveLevel2(savedId);
            toast.success('Đã phê duyệt');
          } else if (submitMode === 'approve') {
            toast.info('Đã cập nhật và gửi phê duyệt — hồ sơ đang chờ Cảng vụ/Chi cục duyệt');
          } else {
            toast.success('Đã cập nhật và gửi phê duyệt trạm radar');
          }
        } else {
          toast.success('Đã cập nhật trạm radar');
        }
      }

      if (isModalMode) {
        onSuccess?.();
        onCancel?.();
      } else if (isIframe) {
        window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
      } else {
        navigate('/radar-station');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        toast.error(err.message);
      }
      // Lỗi validate của AntD Form: im lặng — form tự hiển thị lỗi từng trường
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isCreateMode, isEditMode, id, isModalMode, isIframe, navigate, onCancel, onSuccess, uploadedFiles]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await radarStationCRUD.delete(id);
      toast.success('Đã xóa trạm radar');
      if (isModalMode) {
        onSuccess?.();
        onCancel?.();
      } else if (isIframe) {
        window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
      } else {
        navigate('/radar-station');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, isModalMode, isIframe, navigate, onCancel, onSuccess]);

  // ── Phê duyệt 2 cấp (C1: Cảng vụ/Chi cục → C2: Cục) qua ApprovalModal — khớp RadarStationList ──
  const openApproveModal = useCallback((level: 'c1' | 'c2' = 'c1') => {
    setApproveLevel(level);
    setApproveModalOpen(true);
  }, []);

  const closeApproveModal = useCallback(() => {
    setApproveModalOpen(false);
  }, []);

  const confirmApprove = useCallback(async () => {
    if (!id || !record) return;
    setIsSubmitting(true);
    try {
      const updated =
        approveLevel === 'c2'
          ? await radarStationApproval.approveLevel2(id)
          : await radarStationApproval.approveLevel1(id);
      if (window.parent && (window.parent as any).kchtDetailCache) {
        (window.parent as any).kchtDetailCache[id] = updated;
      }
      toast.success(approveLevel === 'c2' ? 'Đã phê duyệt cấp Cục' : 'Đã phê duyệt cấp Cảng vụ/Chi cục');
      setApproveModalOpen(false);
      setRecord(updated);
      void loadHistory(id);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, record, approveLevel, loadHistory, onSuccess]);

  const openRejectModal = useCallback((level: 'c1' | 'c2' = 'c1') => {
    setRejectLevel(level);
    setRejectModalVisible(true);
  }, []);

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!id || !record) return;
      const trimmedReason = reason.trim();
      if (trimmedReason.length < 10) {
        toast.error('Lý do từ chối phải có ít nhất 10 ký tự');
        return;
      }
      setIsSubmitting(true);
      try {
        const updated =
          rejectLevel === 'c2'
            ? await radarStationApproval.rejectLevel2(id, trimmedReason)
            : await radarStationApproval.rejectLevel1(id, trimmedReason);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = updated;
        }
        toast.success(rejectLevel === 'c2' ? 'Đã từ chối cấp Cục' : 'Đã từ chối cấp Cảng vụ/Chi cục');
        setRejectModalVisible(false);
        setRecord(updated);
        void loadHistory(id);
        onSuccess?.();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, record, rejectLevel, loadHistory, onSuccess],
  );

  const handleSubmitApproval = useCallback(async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await radarStationApproval.submitForApproval(id);
      const updated = await radarStationCRUD.getById(id);
      if (window.parent && (window.parent as any).kchtDetailCache) {
        (window.parent as any).kchtDetailCache[id] = updated;
      }
      toast.success('Đã gửi duyệt trạm radar');
      setRecord(updated);
      void loadHistory(id);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, loadHistory, onSuccess]);

  const handleUploadAttachment = useCallback(
    async (file: File) => {
      if (!id) throw new Error('Cần lưu trạm radar trước khi tải tài liệu đính kèm');
      await radarStationAttachment.upload(id, file);
      await refreshAttachments(id);
    },
    [id, refreshAttachments],
  );

  const handleDeleteAttachment = useCallback(
    async (attachmentId: string) => {
      if (!id) return;
      await radarStationAttachment.remove(id, attachmentId);
      await refreshAttachments(id);
    },
    [id, refreshAttachments],
  );

  const orgNameById = (orgUnitId?: string): string => {
    if (!orgUnitId) return '—';
    const org = orgOptions.find((o) => o.id === orgUnitId);
    return org ? (org.code ? `${org.code} - ${org.name}` : org.name) : orgUnitId;
  };

  const seaportLabelById = (seaportId?: string): string => {
    if (!seaportId) return '—';
    const port = seaportOptions.find((p) => p.id === seaportId);
    return port ? (port.portCode ? `${port.portCode} - ${port.portName || ''}` : port.portName || seaportId) : seaportId;
  };

  const vtsLabelById = (vtsId?: string): string => {
    if (!vtsId) return '—';
    const vts = vtsOptions.find((v) => v.id === vtsId);
    return vts ? (vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vtsId) : vtsId;
  };

  const title = isDetailMode ? 'Chi tiết trạm radar' : isEditMode ? 'Chỉnh sửa trạm radar' : 'Tạo trạm radar mới';

  // Trạng thái hiện tại của bản ghi (khớp RadarStationList: status || approvalStatus)
  const st = record?.status || record?.approvalStatus || '';
  const currentUserId = useAuthStore.getState().user?.userId;
  // Chỉ những trạng thái chưa duyệt xong mới được gửi duyệt (lại) từ màn Cập nhật
  const canResubmit = isEditMode && ['DRAFT', 'PROPOSED', 'REJECTED', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(st);

  // ── Nội dung chế độ xem chi tiết ────────────────────────────────────
  const renderDetailGeneralTab = () => (
    <>
      {record ? (
        <Descriptions column={2} bordered size="small" style={{ marginTop: 16 }}>
          <Descriptions.Item label="Mã trạm radar">{record.code || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tên trạm radar">{record.stationName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Đơn vị quản lý">{record.orgUnitName || orgNameById(record.orgUnitId)}</Descriptions.Item>
          <Descriptions.Item label="Cảng biển">{record.seaportName || seaportLabelById(record.seaportId)}</Descriptions.Item>
          <Descriptions.Item label="Hệ thống VTS">{record.vtsSystemName || vtsLabelById(record.vtsSystemId)}</Descriptions.Item>
          <Descriptions.Item label="Trung tâm điều hành VTS">
            {record.vtsOperationCenterName || vtsLabelById(record.vtsOperationCenterId)}
          </Descriptions.Item>
          <Descriptions.Item label="Đơn vị khai thác">{orgNameById(record.operatingUnitId)}</Descriptions.Item>
          <Descriptions.Item label="Địa điểm (Tỉnh/TP)">{getProvinceLabel(record.provinceId)}</Descriptions.Item>
          <Descriptions.Item label="Đơn vị tính">{record.unitOfMeasure || '—'}</Descriptions.Item>
          <Descriptions.Item label="Số lượng">{record.quantity != null ? record.quantity : '—'}</Descriptions.Item>
          <Descriptions.Item label="Tình trạng">
            {record.conditionStatus ? (CONDITION_STATUS_MAP[record.conditionStatus]?.label || record.conditionStatus) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Chiều cao tháp radar (m)">
            {record.towerHeight != null ? Number(record.towerHeight).toLocaleString('vi-VN') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Tầm hiệu lực radar">{record.radarRange || '—'}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {(() => {
              const s = RADAR_STATION_STATUS_STYLE_MAP[st] || { color: textTertiary, label: st || '—' };
              return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="Người tạo">{record.createdBy || '—'}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{record.createdAt ? new Date(record.createdAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
          <Descriptions.Item label="Người cập nhật cuối">{record.updatedBy || '—'}</Descriptions.Item>
          <Descriptions.Item label="Ngày cập nhật">{record.updatedAt ? new Date(record.updatedAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
          {record.rejectionReason && (
            <Descriptions.Item label="Lý do từ chối" span={2}>{record.rejectionReason}</Descriptions.Item>
          )}
        </Descriptions>
      ) : (
        <Spin spinning={isLoading}>
          <div style={{ padding: '40px 0', textAlign: 'center' }}>Đang tải thông tin trạm radar...</div>
        </Spin>
      )}
    </>
  );

  const renderDetailGisTab = () => (
    <>
      {record ? (
        <>
          <Descriptions column={2} bordered size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Kinh độ">{record.longitude != null ? Number(record.longitude).toFixed(6) : '—'}</Descriptions.Item>
            <Descriptions.Item label="Vĩ độ">{record.latitude != null ? Number(record.latitude).toFixed(6) : '—'}</Descriptions.Item>
            <Descriptions.Item label="Vị trí" span={2}>{record.location || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={2}>{record.note || '—'}</Descriptions.Item>
            <Descriptions.Item label="Tài liệu đính kèm" span={2}>
              <AttachmentList attachments={record.attachments || []} readonly />
            </Descriptions.Item>
          </Descriptions>

          {/* Nút phê duyệt 2 cấp (C1: Cảng vụ/Chi cục → C2: Cục) + Gửi duyệt + Xóa — khớp RadarStationList */}
          <Space wrap style={{ marginTop: 16, marginBottom: 8 }}>
            {['DRAFT', 'PROPOSED', 'REJECTED', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(st) && hasPerm('radarstation:update') && (
              <Popconfirm
                title="Gửi duyệt?"
                description="Sau khi gửi duyệt, trạm radar chuyển sang trạng thái chờ phê duyệt."
                okText="Gửi duyệt"
                cancelText="Hủy"
                onConfirm={handleSubmitApproval}
              >
                <Button type="primary" icon={<SendOutlined />} loading={isSubmitting}>
                  Gửi duyệt
                </Button>
              </Popconfirm>
            )}
            {st === 'PENDING_APPROVAL' && hasPerm('radarstation:approvec1') && currentUserId !== record.createdBy && (
              <Button type="primary" icon={<CheckCircleOutlined />} loading={isSubmitting} onClick={() => openApproveModal('c1')}>
                Phê duyệt cấp Cảng vụ/Chi cục
              </Button>
            )}
            {st === 'PENDING_APPROVAL' && hasPerm('radarstation:approvec1') && currentUserId !== record.createdBy && (
              <Button danger icon={<CloseCircleOutlined />} onClick={() => openRejectModal('c1')}>
                Từ chối cấp Cảng vụ/Chi cục
              </Button>
            )}
            {st === 'APPROVED_LEVEL1' && hasPerm('radarstation:approvec2') && currentUserId !== record.approverLevel1 && (
              <Button type="primary" icon={<CheckCircleOutlined />} loading={isSubmitting} onClick={() => openApproveModal('c2')}>
                Phê duyệt cấp Cục
              </Button>
            )}
            {st === 'APPROVED_LEVEL1' && hasPerm('radarstation:approvec2') && currentUserId !== record.approverLevel1 && (
              <Button danger icon={<CloseCircleOutlined />} onClick={() => openRejectModal('c2')}>
                Từ chối cấp Cục
              </Button>
            )}
            {st === 'DRAFT' && hasPerm('radarstation:delete') && (
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa trạm radar "${record.stationName || record.code}"?`}
                okText="Xóa"
                okType="danger"
                cancelText="Hủy"
                onConfirm={handleDelete}
              >
                <Button danger icon={<DeleteOutlined />} loading={isSubmitting}>
                  Xóa
                </Button>
              </Popconfirm>
            )}
          </Space>

          {/* Lịch sử phê duyệt */}
          <div style={{ marginTop: 16 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg, marginBottom: 8 }}>
              Lịch sử phê duyệt
            </div>
            <HistoryTimeline
              history={history}
              loading={isLoadingHistory}
              error={historyError}
              onRetry={() => id && void loadHistory(id)}
            />
          </div>
        </>
      ) : (
        <Spin spinning={isLoading}>
          <div style={{ padding: '40px 0', textAlign: 'center' }}>Đang tải thông tin trạm radar...</div>
        </Spin>
      )}
    </>
  );

  const renderDetail = () => (
    <Tabs
      defaultActiveKey="1"
      items={[
        {
          key: '1',
          label: 'Thông tin chung',
          children: renderDetailGeneralTab(),
        },
        {
          key: '2',
          label: 'Thông tin vị trí GIS',
          children: renderDetailGisTab(),
        },
      ]}
    />
  );

  // ── Nội dung chế độ tạo mới / chỉnh sửa ─────────────────────────────
  const renderFormGeneralTab = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={() => handleSubmit('save')}
      autoComplete="off"
      style={{ marginTop: 16, maxHeight: '62vh', overflowY: 'auto', paddingRight: 12 }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Mã trạm radar" name="code">
            <Input disabled placeholder="Tự sinh (RADAR-...)" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Tên trạm radar"
            name="stationName"
            rules={[
              { required: true, message: 'Vui lòng nhập tên trạm radar' },
              { max: 255, message: 'Tên trạm radar tối đa 255 ký tự' },
            ]}
          >
            <Input placeholder="VD: Trạm radar Hải Phòng 1" style={inputStyle} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Đơn vị quản lý" name="orgUnitId">
            <OrgUnitTreeSelect
              organizations={orgOptions}
              placeholder="Chọn đơn vị quản lý"
              allowClear
              showSearch
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Cảng biển" name="seaportId">
            <Select
              placeholder="Chọn cảng biển"
              allowClear
              showSearch
              optionFilterProp="label"
              options={seaportOptions.map((port) => ({
                value: port.id,
                label: port.portCode ? `${port.portCode} - ${port.portName || ''}` : port.portName || port.id,
              }))}
              style={selectStyle}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Hệ thống VTS" name="vtsSystemId">
            <Select
              placeholder="Chọn hệ thống VTS"
              allowClear
              showSearch
              optionFilterProp="label"
              options={vtsOptions.map((vts) => ({
                value: vts.id,
                label: vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vts.id,
              }))}
              onChange={() => form.setFieldValue('vtsOperationCenterId', undefined)}
              style={selectStyle}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Trung tâm điều hành VTS" name="vtsOperationCenterId">
            <Select
              placeholder="Chọn trung tâm điều hành VTS"
              allowClear
              showSearch
              optionFilterProp="label"
              options={vtsOptions.map((vts) => ({
                value: vts.id,
                label: vts.code ? `${vts.code} - ${vts.systemName || ''}` : vts.systemName || vts.id,
              }))}
              style={selectStyle}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Đơn vị khai thác" name="operatingUnitId">
            <OrgUnitTreeSelect
              organizations={orgOptions}
              placeholder="Chọn đơn vị khai thác"
              allowClear
              showSearch
              style={{ width: '100%', ...selectStyle }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Địa điểm (Tỉnh/Thành phố)" name="provinceId">
            <Select
              placeholder="Chọn tỉnh/thành phố"
              allowClear
              showSearch
              optionFilterProp="label"
              options={VIETNAM_PROVINCE_OPTIONS}
              style={selectStyle}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Đơn vị tính" name="unitOfMeasure">
            <Select
              placeholder="Chọn đơn vị tính"
              allowClear
              options={UNIT_OF_MEASURE_OPTIONS}
              style={selectStyle}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Số lượng"
            name="quantity"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              {
                validator: (_, value) => {
                  if (value == null || value === '') return Promise.resolve();
                  if (value > 99999) return Promise.reject(new Error('Số lượng tối đa 5 chữ số (99999)'));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              max={99999}
              step={1}
              placeholder="Nhập số lượng"
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Tình trạng"
            name="conditionStatus"
            rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
          >
            <Select placeholder="Chọn tình trạng" options={CONDITION_STATUS_OPTIONS} style={selectStyle} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Chiều cao tháp radar (m)" name="towerHeight">
            <InputNumber min={0} step={0.1} placeholder="Nhập chiều cao tháp" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Tầm hiệu lực radar" name="radarRange">
            <Input placeholder="Nhập tầm hiệu lực (tối đa 20 ký tự)" maxLength={20} style={inputStyle} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );

  const renderFormGisTab = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={() => handleSubmit('save')}
      autoComplete="off"
      style={{ marginTop: 16, maxHeight: '62vh', overflowY: 'auto', paddingRight: 12 }}
    >
      <Form.Item
        label="Vị trí"
        name="location"
        rules={[
          { required: true, message: 'Vui lòng nhập vị trí' },
          { max: 500, message: 'Vị trí tối đa 500 ký tự' },
        ]}
      >
        <Input.TextArea rows={2} placeholder="Mô tả vị trí đặt trạm radar..." style={{ borderRadius: radiusPill }} />
      </Form.Item>

      <Form.Item label="Ghi chú" name="note">
        <Input.TextArea rows={3} maxLength={2000} placeholder="Nhập ghi chú (tối đa 2000 ký tự)" showCount style={{ borderRadius: radiusPill }} />
      </Form.Item>

      <Form.Item label="Tọa độ GIS (điểm)">
        <Form.Item name="gisLocation" noStyle>
          <GisLocationSelector defaultGeometryType="POINT" disabled={isDetailMode} />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Tài liệu đính kèm" style={{ marginBottom: spaceFormField }}>
        {isEditMode && id ? (
          <AttachmentList
            attachments={record?.attachments || []}
            readonly={false}
            hasUploadEndpoint
            onUpload={handleUploadAttachment}
            onDelete={handleDeleteAttachment}
          />
        ) : (
          <div>
            <Upload beforeUpload={handleBeforeUpload} showUploadList={false} multiple>
              <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
            </Upload>
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: spaceFormField }}>
                {uploadedFiles.map((f) => (
                  <div key={f.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: `1px solid ${borderDefault}`, borderRadius: radiusPill, marginBottom: spaceFormField, fontSize: fontSizeMd }}>
                    <span style={{ color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: spaceFormField }}>
                      <FileOutlined style={{ marginRight: 8, color: textTertiary }} />{f.name}
                    </span>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeUploadedFile(f.uid)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Form.Item>
    </Form>
  );

  const renderForm = () => (
    <Tabs
      defaultActiveKey="1"
      items={[
        {
          key: '1',
          label: 'Thông tin chung',
          children: renderFormGeneralTab(),
        },
        {
          key: '2',
          label: 'Thông tin vị trí GIS',
          children: renderFormGisTab(),
        },
      ]}
    />
  );

  // ── Modal (chế độ dùng chung từ danh sách) ──────────────────────────
  if (isModalMode) {
    return (
      <ThemeTokenProvider tokens={radarFormTokens}>
      <>
        <style>{formScopeFontCss}</style>
        <Modal
          rootClassName="radar-form-scope"
          className="radar-form-scope"
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{title}</span>}
          open={open}
          onCancel={onCancel}
          destroyOnClose
          width={isDetailMode ? 900 : 760}
          maskClosable={false}
          footer={
            isDetailMode ? (
              <Button type="primary" onClick={onCancel} style={outlineButtonStyle}>
                Đóng
              </Button>
            ) : isEditMode ? (
              <>
                <Button onClick={onCancel} style={outlineButtonStyle}>Hủy</Button>
                <Button type="primary" onClick={() => handleSubmit('save')} loading={isSubmitting} style={primaryButtonStyle}>
                  Cập nhật
                </Button>
                {canResubmit && (
                  <>
                    <Button onClick={() => handleSubmit('submit')} loading={isSubmitting} style={outlineButtonStyle}>
                      Lưu và gửi phê duyệt
                    </Button>
                    {hasPerm('radarstation:approvec2') && (
                      <Button type="primary" onClick={() => handleSubmit('approve')} loading={isSubmitting} style={primaryButtonStyle}>
                        Lưu và phê duyệt
                      </Button>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Button onClick={onCancel} style={outlineButtonStyle}>Hủy</Button>
                <Button onClick={() => handleSubmit('save')} loading={isSubmitting} style={outlineButtonStyle}>
                  Lưu tạm
                </Button>
                <Button type="primary" onClick={() => handleSubmit('submit')} loading={isSubmitting} style={primaryButtonStyle}>
                  Lưu và gửi phê duyệt
                </Button>
                {hasPerm('radarstation:approvec2') && (
                  <Button type="primary" onClick={() => handleSubmit('approve')} loading={isSubmitting} style={primaryButtonStyle}>
                    Lưu và phê duyệt
                  </Button>
                )}
              </>
            )
          }
        >
          <Spin spinning={isLoading}>
            {isDetailMode ? renderDetail() : renderForm()}
          </Spin>
        </Modal>
        <RejectionModal
          visible={rejectModalVisible}
          loading={isSubmitting}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectModalVisible(false)}
        />
        <ApprovalModal
          open={approveModalOpen}
          level={approveLevel}
          loading={isSubmitting}
          onConfirm={confirmApprove}
          onCancel={closeApproveModal}
        />
      </>
      </ThemeTokenProvider>
    );
  }

  // ── Trang độc lập (route /radar-station/create | /radar-station/:id) ──
  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Quản lý trạm radar', onClick: () => navigate('/radar-station') },
    { title: isCreateMode ? 'Tạo mới' : isEditMode ? 'Chỉnh sửa' : 'Chi tiết' },
  ];

  return (
    <ThemeTokenProvider tokens={radarFormTokens}>
    <div className="radar-form-scope" style={{ padding: '24px' }}>
      <style>{formScopeFontCss}</style>
      {!isIframe && <Breadcrumb items={breadcrumbs} style={{ marginBottom: 16 }} />}
      <div style={{ background: surfaceCard, borderRadius: radiusLg, padding: '16px 24px' }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg, marginBottom: 8 }}>
          {title}
        </div>
        <Spin spinning={isLoading}>
          {isDetailMode ? renderDetail() : renderForm()}
        </Spin>
        {!isDetailMode && (
          <Space style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button style={outlineButtonStyle} onClick={isIframe ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*') : () => navigate('/radar-station')}>
              Hủy
            </Button>
            {isEditMode ? (
              <>
                <Button type="primary" style={primaryButtonStyle} onClick={() => handleSubmit('save')} loading={isSubmitting}>
                  Cập nhật
                </Button>
                {canResubmit && (
                  <>
                    <Button style={outlineButtonStyle} onClick={() => handleSubmit('submit')} loading={isSubmitting}>
                      Lưu và gửi phê duyệt
                    </Button>
                    {hasPerm('radarstation:approvec2') && (
                      <Button type="primary" style={primaryButtonStyle} onClick={() => handleSubmit('approve')} loading={isSubmitting}>
                        Lưu và phê duyệt
                      </Button>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Button style={outlineButtonStyle} onClick={() => handleSubmit('save')} loading={isSubmitting}>
                  Lưu tạm
                </Button>
                <Button type="primary" style={primaryButtonStyle} onClick={() => handleSubmit('submit')} loading={isSubmitting}>
                  Lưu và gửi phê duyệt
                </Button>
                {hasPerm('radarstation:approvec2') && (
                  <Button type="primary" style={primaryButtonStyle} onClick={() => handleSubmit('approve')} loading={isSubmitting}>
                    Lưu và phê duyệt
                  </Button>
                )}
              </>
            )}
          </Space>
        )}
      </div>
      <RejectionModal
        visible={rejectModalVisible}
        loading={isSubmitting}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectModalVisible(false)}
      />
      <ApprovalModal
        open={approveModalOpen}
        level={approveLevel}
        loading={isSubmitting}
        onConfirm={confirmApprove}
        onCancel={closeApproveModal}
      />
    </div>
    </ThemeTokenProvider>
  );
}
