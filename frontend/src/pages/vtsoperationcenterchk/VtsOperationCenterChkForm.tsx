import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Form,
  Button,
  Input,
  Select,
  Spin,
  Space,
  Tabs,
  DatePicker,
  Row,
  Col,
  Upload,
  Modal,
  Tooltip,
  Drawer,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  FileOutlined,
  CloseOutlined,
  EditOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { portCRUD } from '../../services/portService';
import { symbolService, type Symbol as GisSymbol } from '../../services/symbolService';
import type {
  VtsOperationCenterResponse,
  CreateVtsOperationCenterRequest,
  UpdateVtsOperationCenterRequest,
  VtsOperationCenterAttachment,
} from '../../types/vtsOperationCenter';
import { ApprovalStatus, ConditionStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import {
  drawerTitleStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle,
  dangerButtonStyle, drawerTabBarStyle,
  requiredMarkStyle, spaceFormField, radiusSm, radiusMd, radiusPill, sidebarBg,
  fontWeightBold, fontWeightMedium, spaceMd, spaceSm, fontSizeMd, fontSizeSm, fontSizeLg,
  textSecondary, textTertiary, textPrimary, borderDefault, uploadHintStyle,
  statusCritical, statusAttention, statusOperational, statusDraft, actionPrimary, textAreaStyle,
  colors, inputStyle, selectStyle, drawerCloseBtnStyle, statusBadgeStyle,
  renderPlanStatusBadge, renderSeverityBadge, icons,
} from '../../themetokenchk';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { OrgUnitTreeSelect, normalizeSearchText } from '../../components/org-unit';
import DetailTable from '../../components/shared/DetailTable';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import ApprovalModal from '../../components/shared/ApprovalModal';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';

export interface VtsOperationCenterChkFormProps {
  open?: boolean;
  editId?: string | null;
  initialData?: VtsOperationCenterResponse | null;
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

const renderConditionBadge = (status?: ConditionStatus | string) => {
  if (!status) return '—';
  const label = CONDITION_STATUS_MAP[status as ConditionStatus] || status;
  const color = CONDITION_COLOR[status as ConditionStatus] || textSecondary;
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

// ── Mock Detail Tables Data ──
const MOCK_EQUIPMENTS = [
  { id: 'eq-1', code: 'TB-RADAR-01', name: 'Radar giám sát hàng hải Terma SCANTER 5202', type: 'Radar Station', status: ConditionStatus.OPERATIONAL, spec: 'Tần số X-band 9GHz, Tầm quét 24 NM' },
  { id: 'eq-2', code: 'TB-AIS-01', name: 'Trạm thu phát AIS Transas T214 Class A', type: 'AIS Base Station', status: ConditionStatus.OPERATIONAL, spec: 'Kênh 87B/88B, Công suất 12.5W' },
  { id: 'eq-3', code: 'TB-VHF-01', name: 'Hệ thống đài vô tuyến VHF Sailor 6222', type: 'VHF Radio', status: ConditionStatus.OPERATIONAL, spec: 'Kênh 16, 70 DSC, Công suất 25W' },
  { id: 'eq-4', code: 'TB-CCTV-01', name: 'Camera tầm xa hồng ngoại Axis Q6215-LE PTZ', type: 'CCTV Camera', status: ConditionStatus.OPERATIONAL, spec: 'Zoom 30x, Tầm nhìn đêm 400m' },
  { id: 'eq-5', code: 'TB-SERVER-01', name: 'Máy chủ xử lý dữ liệu VTS Dell PowerEdge R750', type: 'Server Cluster', status: ConditionStatus.OPERATIONAL, spec: 'Dual Xeon 32 Core, 128GB RAM' },
  { id: 'eq-6', code: 'TB-UPS-01', name: 'Bộ lưu điện UPS APC Symmetra PX 40kVA', type: 'Power Backup', status: ConditionStatus.OPERATIONAL, spec: 'Lưu điện liên tục 4h toàn trung tâm' },
  { id: 'eq-7', code: 'TB-METEO-01', name: 'Trạm khí tượng thủy văn tự động Vaisala WXT530', type: 'Weather Station', status: ConditionStatus.OPERATIONAL, spec: 'Đo gió, áp suất, độ ẩm, tầm nhìn' },
  { id: 'eq-8', code: 'TB-VOIP-01', name: 'Hệ thống ghi âm thoại và quản lý liên lạc VCCS', type: 'Voice Recorder', status: ConditionStatus.OPERATIONAL, spec: 'Ghi âm 32 kênh đồng thời chuẩn hàng hải' },
  { id: 'eq-9', code: 'TB-DISP-01', name: 'Bàn điều hành đa màn hình hiển thị hải đồ điện tử', type: 'Operator Console', status: ConditionStatus.OPERATIONAL, spec: '4 màn hình 4K 32 inch chuyên dụng' },
  { id: 'eq-10', code: 'TB-GEN-01', name: 'Máy phát điện dự phòng tự động Cummins 100kVA', type: 'Diesel Generator', status: ConditionStatus.OPERATIONAL, spec: 'Khởi động tự động ATS trong 10 giây' },
  { id: 'eq-11', code: 'TB-FIRE-01', name: 'Hệ thống báo cháy và chữa cháy khí sạch FM-200', type: 'Fire System', status: ConditionStatus.OPERATIONAL, spec: 'Bảo vệ phòng máy chủ trung tâm' },
  { id: 'eq-12', code: 'TB-NET-01', name: 'Hạ tầng mạng cáp quang Cisco Industrial', type: 'Network Switch', status: ConditionStatus.OPERATIONAL, spec: 'Dự phòng Ring 10Gbps kết nối trạm xa' },
];

const MOCK_OPERATIONS = [
  { id: 'op-1', planCode: 'KHVH-TT-2026-01', planName: 'Kế hoạch trực vận hành giám sát luồng hàng hải Q1/2026', startDate: '2026-01-01', endDate: '2026-03-31', orgName: 'Trung tâm VTS', status: 'Đang thực hiện' },
  { id: 'op-2', planCode: 'KHVH-TT-2026-02', planName: 'Kế hoạch diễn tập xử lý sự cố mất tín hiệu Radar', startDate: '2026-04-10', endDate: '2026-04-12', orgName: 'Phòng An toàn Hàng hải', status: 'Chưa thực hiện' },
  { id: 'op-3', planCode: 'KHVH-TT-2026-03', planName: 'Kế hoạch nâng cấp phần mềm giám sát luồng tàu VTS v3.5', startDate: '2026-05-15', endDate: '2026-05-20', orgName: 'Trung tâm CNTT', status: 'Chưa thực hiện' },
  { id: 'op-4', planCode: 'KHVH-TT-2026-04', planName: 'Kế hoạch phân luồng điều tiết tàu trọng tải lớn cập cảng', startDate: '2026-06-01', endDate: '2026-06-30', orgName: 'Đội điều hành tàu', status: 'Chưa thực hiện' },
  { id: 'op-5', planCode: 'KHVH-TT-2026-05', planName: 'Kế hoạch phối hợp tìm kiếm cứu nạn hàng hải khu vực', startDate: '2026-07-01', endDate: '2026-09-30', orgName: 'Trung tâm VTS & SAR', status: 'Chưa thực hiện' },
];

const MOCK_MAINTENANCE = [
  { id: 'mt-1', maintCode: 'BT-TT-2026-01', maintName: 'Bảo dưỡng định kỳ hệ thống máy chủ và điều hòa chính xác', startDate: '2026-02-15', endDate: '2026-02-18', orgName: 'Công ty Kỹ thuật Hàng hải', estimatedCost: 85000000, status: 'Hoàn thành' },
  { id: 'mt-2', maintCode: 'BT-TT-2026-02', maintName: 'Kiểm chuẩn và bảo trì hệ thống anten thu phát VHF/AIS', startDate: '2026-05-10', endDate: '2026-05-13', orgName: 'Viện Điện tử Viễn thông', estimatedCost: 120000000, status: 'Chưa thực hiện' },
  { id: 'mt-3', maintCode: 'BT-TT-2026-03', maintName: 'Thay thế ắc quy định kỳ cho hệ thống UPS 40kVA', startDate: '2026-08-20', endDate: '2026-08-22', orgName: 'Công ty Năng lượng APC', estimatedCost: 65000000, status: 'Chưa thực hiện' },
];

const MOCK_INCIDENTS = [
  { id: 'ic-1', incidentCode: 'SC-TT-2026-001', incidentType: 'Mất tín hiệu đường truyền', location: 'Tuyến cáp quang trạm Radar xa', incidentTime: '2026-01-15 08:30', severity: 'Trung bình', handleStatus: 'Đã xử lý' },
  { id: 'ic-2', incidentCode: 'SC-TT-2026-002', incidentType: 'Lỗi đồng bộ dữ liệu AIS', location: 'Máy chủ xử lý VTS 01', incidentTime: '2026-02-02 14:15', severity: 'Thấp', handleStatus: 'Đã xử lý' },
];

const ddToDms = (dd?: number) => {
  if (dd === undefined || dd === null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60 * 100) / 100;
  return { d, m, s };
};

const MOCK_GPS_COORDS = [
  { id: 'gps-1', longitude: 106.6838, latitude: 20.8651 },
];

export const VtsOperationCenterChkForm: React.FC<VtsOperationCenterChkFormProps> = ({
  open,
  editId,
  initialData,
  mode = 'create',
  orgUnits = [],
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [currentMode, setCurrentMode] = useState<'create' | 'edit' | 'detail'>(mode);
  const [tabKey, setTabKey] = useState<string>('general');
  const [detailTabKey, setDetailTabKey] = useState<string>('general');
  const [record, setRecord] = useState<VtsOperationCenterResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('draft');

  const [portOptions, setPortOptions] = useState<any[]>([]);
  const [vtsSystemOptions, setVtsSystemOptions] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<VtsOperationCenterAttachment[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Approval Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalSectionOpen, setApprovalSectionOpen] = useState(true);

  const currentUser = useAuthStore((s) => s.user);
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const isDetailMode = currentMode === 'detail';
  const isCreateMode = currentMode === 'create';
  const isEditMode = currentMode === 'edit';

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    if (open) {
      portCRUD.getOptions().then((res) => setPortOptions(Array.isArray(res) ? res : [])).catch(() => {});
      vtsSystemCRUD.getOptions().then((res) => setVtsSystemOptions(Array.isArray(res) ? res : [])).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setTabKey('general');
    setDetailTabKey('general');
    setApprovalSectionOpen(true);

    if (editId) {
      setIsLoading(true);
      Promise.all([
        vtsOperationCenterService.getById(editId),
        vtsOperationCenterService.listAttachments(editId).catch(() => []),
        vtsOperationCenterService.getHistory(editId).catch(() => []),
      ]).then(([res, atts, hists]) => {
        setRecord(res);
        setAttachments(atts || []);
        setHistoryList(hists || []);
        form.setFieldsValue({
          code: res.code,
          name: res.name,
          orgUnitId: res.orgUnitId,
          portId: res.portId,
          vtsSystemId: res.vtsSystemId,
          provinceId: res.provinceId,
          detailedLocation: res.detailedLocation,
          coverage: res.coverage,
          conditionStatus: res.conditionStatus || ConditionStatus.OPERATIONAL,
          note: res.note,
        });
      }).catch(() => {
        toast.error('Không thể tải chi tiết');
      }).finally(() => {
        setIsLoading(false);
      });
    } else if (isCreateMode) {
      setRecord(null);
      setAttachments([]);
      setHistoryList([]);
      form.resetFields();
      vtsOperationCenterService.generateCode().then((res) => {
        form.setFieldsValue({
          code: res.code || 'TT-VTS-AUTO',
          conditionStatus: ConditionStatus.OPERATIONAL,
        });
      }).catch(() => {
        form.setFieldsValue({
          code: 'TT-VTS-AUTO',
          conditionStatus: ConditionStatus.OPERATIONAL,
        });
      });
    }
  }, [open, editId, isCreateMode, form]);

  const selectedOrgUnitId = Form.useWatch('orgUnitId', form);
  const effectiveOrgUnitId = selectedOrgUnitId || record?.orgUnitId;

  const filteredPortOptions = useMemo(() => {
    if (!effectiveOrgUnitId) return portOptions;
    return portOptions.filter((p) => !p.orgUnitId || p.orgUnitId === effectiveOrgUnitId);
  }, [portOptions, effectiveOrgUnitId]);

  const filteredVtsSystemOptions = useMemo(() => {
    if (!effectiveOrgUnitId) return vtsSystemOptions;
    return vtsSystemOptions.filter((v) => !v.orgUnitId || v.orgUnitId === effectiveOrgUnitId);
  }, [vtsSystemOptions, effectiveOrgUnitId]);

  const handleFinish = async (values: any) => {
    const act = actionTypeRef.current;
    setIsSubmitting(true);
    try {
      const payload: CreateVtsOperationCenterRequest = {
        code: values.code?.trim(),
        name: values.name?.trim(),
        orgUnitId: values.orgUnitId,
        portId: values.portId,
        vtsSystemId: values.vtsSystemId,
        provinceId: values.provinceId,
        detailedLocation: values.detailedLocation?.trim(),
        coverage: values.coverage?.trim(),
        conditionStatus: values.conditionStatus,
        note: values.note?.trim(),
        geometryType: 'POINT',
        coordinates: 'POINT (106.6838 20.8651)',
      };

      if (isCreateMode) {
        const created = await vtsOperationCenterService.create(payload);
        if (act === 'submit' && created?.id) {
          await vtsOperationCenterService.submit(created.id);
        } else if (act === 'approve' && created?.id) {
          await vtsOperationCenterService.submit(created.id).catch(() => {});
          await vtsOperationCenterService.approveC2(created.id, 'APPROVED', 'Lưu và phê duyệt trực tiếp');
        }
        toast.success('Thêm mới thành công');
      } else if (editId) {
        await vtsOperationCenterService.update(editId, payload as UpdateVtsOperationCenterRequest);
        if (act === 'submit') {
          await vtsOperationCenterService.submit(editId);
        }
        toast.success('Cập nhật thành công');
      }
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (reason?: string) => {
    if (!editId) return;
    setIsSubmitting(true);
    try {
      if (approveLevel === 'c1') {
        await vtsOperationCenterService.approveC1(editId, 'APPROVED', reason);
        toast.success('Phê duyệt cấp 1 thành công');
      } else {
        await vtsOperationCenterService.approveC2(editId, 'APPROVED', reason);
        toast.success('Phê duyệt cấp 2 thành công');
      }
      setApproveModalOpen(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi phê duyệt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!editId || !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do');
      return;
    }
    setIsSubmitting(true);
    try {
      await vtsOperationCenterService.reject(editId, rejectReason.trim());
      toast.success('Từ chối thành công');
      setRejectModalOpen(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi từ chối');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCreator = currentUser?.id && record?.createdBy === currentUser.id;
  const canEdit = canEditApprovalRecord(record?.approvalStatus ?? ApprovalStatus.DRAFT, {
    hasPerm,
    resource: 'vtsoperationcenter',
  });

  const showSubmitBtn = hasPerm('vtsoperationcenter:update') && (
    record?.approvalStatus === ApprovalStatus.DRAFT ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 ||
    record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2
  );

  const showApproveC1Btn = hasPerm('vtsoperationcenter:approvec1') && record?.approvalStatus === ApprovalStatus.PENDING_APPROVAL && !isCreator;
  const showApproveC2Btn = hasPerm('vtsoperationcenter:approvec2') && record?.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 && !isCreator;

  // ── Render Detail View ──────────────────────────────────────────
  const renderDetailContent = () => {
    if (!record) return null;
    return (
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
              <div>
                <div className="chk-detail-grid">
                  <div className="chk-detail-row"><span className="chk-detail-label">Mã trung tâm</span><span className="chk-detail-value">{record.code || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Tên trung tâm</span><span className="chk-detail-value">{record.name || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị quản lý</span><span className="chk-detail-value">{record.orgUnitName || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Thuộc cảng biển</span><span className="chk-detail-value">{record.portName || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Thuộc hệ thống VTS</span><span className="chk-detail-value">{record.vtsSystemName || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm (Tỉnh/TP)</span><span className="chk-detail-value">{record.provinceName || getProvinceNameById(record.provinceId) || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm chi tiết</span><span className="chk-detail-value">{record.detailedLocation || '—'}</span></div>
                  <div className="chk-detail-row"><span className="chk-detail-label">Tình trạng</span><span className="chk-detail-value">{renderConditionBadge(record.conditionStatus)}</span></div>
                  <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Vùng phủ sóng</span><span className="chk-detail-value">{record.coverage || '—'}</span></div>
                  <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Ghi chú</span><span className="chk-detail-value">{record.note || '—'}</span></div>
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
                    <div className="chk-detail-row"><span className="chk-detail-label">Ngày gửi duyệt</span><span className="chk-detail-value">{record.submittedDate ? dayjs(record.submittedDate).format('DD/MM/YYYY HH:mm:ss') : (record.submittedAt ? dayjs(record.submittedAt).format('DD/MM/YYYY HH:mm:ss') : '—')}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ gửi duyệt</span><span className="chk-detail-value">{record.submittedByName || record.submittedBy || '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Ngày phê duyệt Cảng vụ</span><span className="chk-detail-value">{record.approvedDateLevel1 ? dayjs(record.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ phê duyệt Cảng vụ</span><span className="chk-detail-value">{record.approverLevel1Name || record.approverLevel1 || '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Nội dung Cảng vụ phê duyệt</span><span className="chk-detail-value">{record.approvalReasonLevel1 || record.rejectionReasonLevel1 || '—'}</span></div>
                    <div style={{ border: 'none' }} />

                    <div className="chk-detail-row"><span className="chk-detail-label">Ngày phê duyệt Cục</span><span className="chk-detail-value">{record.approvedDateLevel2 ? dayjs(record.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ phê duyệt Cục</span><span className="chk-detail-value">{record.approverLevel2Name || record.approverLevel2 || '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Nội dung Cục phê duyệt</span><span className="chk-detail-value">{record.approvalReasonLevel2 || record.rejectionReasonLevel2 || '—'}</span></div>
                    <div style={{ border: 'none' }} />

                    <div className="chk-detail-row"><span className="chk-detail-label">Trạng thái phê duyệt</span><span className="chk-detail-value"><ApprovalStatusBadge status={record.approvalStatus} /></span></div>
                    {record.rejectionReason && (
                      <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Lý do từ chối</span><span className="chk-detail-value" style={{ color: statusCritical }}>{record.rejectionReason}</span></div>
                    )}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'equipments',
            label: `Danh sách thiết bị (${MOCK_EQUIPMENTS.length})`,
            children: (
              <DetailTable
                dataSource={MOCK_EQUIPMENTS}
                rowKey="id"
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã thiết bị', dataIndex: 'code', key: 'code', width: 120, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Tên thiết bị', dataIndex: 'name', key: 'name', width: 200, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Loại thiết bị', dataIndex: 'type', key: 'type', width: 150, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Thông số kỹ thuật', dataIndex: 'spec', key: 'spec', width: 220, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Tình trạng', dataIndex: 'status', key: 'status', width: 140, render: (v) => renderConditionBadge(v) },
                ]}
              />
            ),
          },
          {
            key: 'operations',
            label: `Vận hành khai thác (${MOCK_OPERATIONS.length})`,
            children: (
              <DetailTable
                dataSource={MOCK_OPERATIONS}
                rowKey="id"
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'planCode', width: 120, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'planName', width: 200, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'startDate', width: 110, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
                  { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate', width: 110, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
                  { title: 'Đơn vị thực hiện', dataIndex: 'orgName', key: 'orgName', width: 180, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 140, render: (v) => renderPlanStatusBadge(v) },
                ]}
              />
            ),
          },
          {
            key: 'maintenance',
            label: `Thông tin bảo trì (${MOCK_MAINTENANCE.length})`,
            children: (
              <DetailTable
                dataSource={MOCK_MAINTENANCE}
                rowKey="id"
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã kế hoạch', dataIndex: 'maintCode', key: 'maintCode', width: 120, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Tên hạng mục', dataIndex: 'maintName', key: 'maintName', width: 200, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'startDate', width: 110, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
                  { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate', width: 110, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
                  { title: 'Đơn vị thực hiện', dataIndex: 'orgName', key: 'orgName', width: 180, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Chi phí dự kiến (VNĐ)', dataIndex: 'estimatedCost', key: 'estimatedCost', width: 160, align: 'right', render: (v) => v ? Number(v).toLocaleString('vi-VN') : '—' },
                  { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 130, render: (v) => renderPlanStatusBadge(v) },
                ]}
              />
            ),
          },
          {
            key: 'incidents',
            label: `Thông tin sự cố (${MOCK_INCIDENTS.length})`,
            children: (
              <DetailTable
                dataSource={MOCK_INCIDENTS}
                rowKey="id"
                columns={[
                  { title: 'STT', width: 50 },
                  { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'incidentCode', width: 120, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'incidentType', width: 170, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Địa điểm', dataIndex: 'location', key: 'location', width: 180, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                  { title: 'Thời gian xảy ra', dataIndex: 'incidentTime', key: 'incidentTime', width: 140, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—' },
                  { title: 'Mức độ', dataIndex: 'severity', key: 'severity', width: 110, render: (v) => renderSeverityBadge(v) },
                  { title: 'Tình trạng xử lý', dataIndex: 'handleStatus', key: 'handleStatus', width: 130, render: (v) => renderPlanStatusBadge(v) },
                ]}
              />
            ),
          },
          {
            key: 'gis',
            label: `Thông tin vị trí (${MOCK_GPS_COORDS.length})`,
            children: (
              <DetailTable
                dataSource={MOCK_GPS_COORDS}
                emptyText="Chưa có tọa độ GPS nào"
                headerNode={
                  <>
                    <div className="chk-detail-grid" style={{ marginBottom: 16 }}>
                      <div className="chk-detail-row"><span className="chk-detail-label">Loại đối tượng</span><span className="chk-detail-value">{record?.geometryType || 'Đối tượng điểm'}</span></div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Biểu tượng bản đồ</span><span className="chk-detail-value">{record?.symbolId ? `Biểu tượng (${record.symbolId})` : 'Trung tâm điều hành VTS (VTS-SYM-01)'}</span></div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Hệ quy chiếu</span><span className="chk-detail-value">WGS-84 (Toàn cầu)</span></div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Quy tắc hiển thị</span><span className="chk-detail-value">Hiển thị theo phạm vi hoạt động</span></div>
                    </div>
                    <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                      <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>
                        Tọa độ GPS ({MOCK_GPS_COORDS.length})
                      </span>
                      <Button
                        icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                        onClick={() => toast.info('Đang mở bản đồ GIS...')}
                        style={{
                          ...outlineButtonStyle,
                          height: 32,
                          fontSize: fontSizeSm,
                          padding: '0 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        Xem vị trí trên bản đồ
                      </Button>
                    </div>
                  </>
                }
                columns={[
                  { title: 'STT', width: 50 },
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
              <DetailTable
                dataSource={attachments}
                rowKey="id"
                columns={[
                  { title: 'STT', width: 50 },
                  {
                    title: 'Tên tài liệu',
                    dataIndex: 'fileName',
                    key: 'fileName',
                    render: (v) => (
                      <Space>
                        <FileOutlined style={{ color: actionPrimary }} />
                        <span style={{ color: actionPrimary, fontWeight: fontWeightMedium }}>{v || '—'}</span>
                      </Space>
                    ),
                  },
                  {
                    title: 'Dung lượng',
                    dataIndex: 'fileSize',
                    key: 'fileSize',
                    width: 130,
                    render: (v) => v ? `${(Number(v) / 1024).toFixed(1)} KB` : '—',
                  },
                  {
                    title: 'Người tải lên',
                    dataIndex: 'uploadedBy',
                    key: 'uploadedBy',
                    width: 180,
                    render: (v) => v || '—',
                  },
                  {
                    title: 'Ngày tải lên',
                    dataIndex: 'uploadedDate',
                    key: 'uploadedDate',
                    width: 140,
                    align: 'center',
                    render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—',
                  },
                ]}
              />
            ),
          },
        ]}
      />
    );
  };

  const detailFooter = (
    <div style={drawerFooterStyle}>
      <Button onClick={onCancel} style={outlineButtonStyle}>Đóng</Button>
      {canEdit && (
        <Button
          type="primary"
          icon={icons.edit}
          onClick={() => setCurrentMode('edit')}
          style={primaryButtonStyle}
        >
          Chỉnh sửa
        </Button>
      )}
      {showSubmitBtn && (
        <Button
          type="primary"
          icon={icons.submit}
          onClick={async () => {
            if (!editId) return;
            try {
              await vtsOperationCenterService.submit(editId);
              toast.success('Gửi duyệt thành công');
              onSuccess?.();
            } catch (e: any) {
              toast.error(e?.message || 'Lỗi gửi duyệt');
            }
          }}
          style={primaryButtonStyle}
        >
          Gửi duyệt
        </Button>
      )}
      {showApproveC1Btn && (
        <Space>
          <Button danger icon={icons.reject} onClick={() => { setRejectReason(''); setRejectModalOpen(true); }} style={dangerButtonStyle}>
            Từ chối cấp 1
          </Button>
          <Button type="primary" icon={icons.approve} onClick={() => { setApproveLevel('c1'); setApproveModalOpen(true); }} style={primaryButtonStyle}>
            Phê duyệt cấp 1
          </Button>
        </Space>
      )}
      {showApproveC2Btn && (
        <Space>
          <Button danger icon={icons.reject} onClick={() => { setRejectReason(''); setRejectModalOpen(true); }} style={dangerButtonStyle}>
            Từ chối cấp 2
          </Button>
          <Button type="primary" icon={icons.approve} onClick={() => { setApproveLevel('c2'); setApproveModalOpen(true); }} style={primaryButtonStyle}>
            Phê duyệt cấp 2
          </Button>
        </Space>
      )}
    </div>
  );

  return (
    <Drawer
      rootClassName="vtssystemchk-theme-scope"
      width="50%"
      placement="right"
      closable={false}
      open={open}
      onClose={onCancel}
      styles={{
        header: { padding: '16px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '0 24px 16px 24px' },
        footer: { padding: '16px 24px', borderTop: `1px solid ${borderDefault}`, display: 'flex', justifyContent: 'center', alignItems: 'center' },
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={drawerTitleStyle}>
            {isDetailMode
              ? (record?.name ? `Xem chi tiết — ${record.name}` : 'Xem chi tiết Trung tâm điều hành VTS')
              : isCreateMode
                ? 'Thêm mới Trung tâm điều hành VTS'
                : (record?.name ? `Chỉnh sửa — ${record.name}` : 'Chỉnh sửa Trung tâm điều hành VTS')}
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
        isDetailMode ? detailFooter : (
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
                {hasPerm('vtsoperationcenter:approvec2') && (
                  <Button
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); form.submit(); }}
                    loading={isSubmitting && actionType === 'approve'}
                    style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                  >
                    Lưu và phê duyệt
                  </Button>
                )}
                <Button onClick={onCancel} style={outlineButtonStyle}>Hủy</Button>
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
      <Spin spinning={isLoading}>
        {isDetailMode ? renderDetailContent() : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
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
                    <Row gutter={[24, 0]}>
                      <Col span={12}>
                        <Form.Item
                          label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Đơn vị quản lý</span>}
                          name="orgUnitId"
                          rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <OrgUnitTreeSelect
                            organizations={orgUnits}
                            placeholder="Chọn đơn vị quản lý"
                            allowClear
                            treeDefaultExpandAll={true}
                            listHeight={256}
                            onChange={(val) => {
                              form.setFieldsValue({ orgUnitId: val, portId: undefined, vtsSystemId: undefined });
                            }}
                            style={{ ...selectStyle, width: '100%' }}
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
                          rules={[{ required: true, message: 'Vui lòng chọn hệ thống VTS' }]}
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
                          label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Mã trung tâm điều hành</span>}
                          name="code"
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input placeholder="Mã tự sinh" disabled={true} style={inputStyle} />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tên trung tâm điều hành</span>}
                          name="name"
                          rules={[{ required: true, message: 'Vui lòng nhập tên trung tâm điều hành' }]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input placeholder="Nhập tên trung tâm điều hành..." style={inputStyle} />
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
                          label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm chi tiết</span>}
                          name="detailedLocation"
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input placeholder="Nhập địa điểm chi tiết..." style={inputStyle} />
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
                          label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Vùng phủ sóng</span>}
                          name="coverage"
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input.TextArea placeholder="Nhập phạm vi vùng phủ sóng..." rows={3} style={textAreaStyle} />
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Form.Item
                          label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Ghi chú</span>}
                          name="note"
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input.TextArea placeholder="Nhập ghi chú thêm..." rows={3} style={textAreaStyle} />
                        </Form.Item>
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: 'gis',
                  label: 'Thông tin vị trí',
                  children: (
                    <DetailTable
                      dataSource={MOCK_GPS_COORDS}
                      rowKey="id"
                      columns={[
                        { title: 'STT', width: 50 },
                        { title: 'Kinh độ (Độ thập phân)', dataIndex: 'longitude', key: 'longitude' },
                        { title: 'Vĩ độ (Độ thập phân)', dataIndex: 'latitude', key: 'latitude' },
                        { title: 'Kinh độ (DMS)', key: 'dmsLng', render: () => "106°41'1.68\"E" },
                        { title: 'Vĩ độ (DMS)', key: 'dmsLat', render: () => "20°51'54.36\"N" },
                      ]}
                    />
                  ),
                },
                {
                  key: 'files',
                  label: `File đính kèm (${attachments.length})`,
                  children: (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <Upload beforeUpload={() => false} multiple>
                          <Button icon={<UploadOutlined />} style={outlineButtonStyle}>Tải lên tài liệu</Button>
                        </Upload>
                      </div>
                      <DetailTable
                        dataSource={attachments}
                        rowKey="id"
                        columns={[
                          { title: 'STT', width: 50 },
                          { title: 'Tên tài liệu', dataIndex: 'fileName', key: 'fileName', render: (v) => <span style={{ color: actionPrimary }}>{v || '—'}</span> },
                          { title: 'Dung lượng', dataIndex: 'fileSize', key: 'fileSize', width: 130, render: (v) => v ? `${(Number(v)/1024).toFixed(1)} KB` : '—' },
                          { title: 'Người tải lên', dataIndex: 'uploadedBy', key: 'uploadedBy', width: 180, render: (v) => v || '—' },
                          { title: 'Ngày tải lên', dataIndex: 'uploadedDate', key: 'uploadedDate', width: 140, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—' },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </Form>
        )}
      </Spin>

      {/* Approval Modal */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approveLevel}
        onConfirm={handleApprove}
        onCancel={() => setApproveModalOpen(false)}
      />

      {/* Rejection Modal */}
      <Modal
        title="Từ chối phê duyệt"
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleReject}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối:</p>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối..."
          style={textAreaStyle}
        />
      </Modal>
    </Drawer>
  );
};

export default VtsOperationCenterChkForm;
