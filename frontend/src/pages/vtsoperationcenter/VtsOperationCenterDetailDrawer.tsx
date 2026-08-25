import React, { useEffect, useState, useMemo } from 'react';
import {
  Tabs,
  Space,
  Button,
  Table,
  Modal,
  Input,
  Upload,
  Popconfirm,
  Select,
  Spin,
  Empty,
} from 'antd';
import {
  FileOutlined,
  DeleteOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type {
  VtsOperationCenterResponse,
  VtsOperationCenterAttachment,
} from '../../types/vtsOperationCenter';
import type { HistoryEntry } from '../../types/radarStation';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import {
  ConditionStatus,
  CONDITION_STATUS_TAG_MAP,
  ApprovalStatus,
} from '../../types/vtsSystem';
import { getProvinceNameById } from '../../types/common';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import toast from '../../components/ToastNotification';
import { AppDrawer } from '../../components/shared/AppDrawer';
import EmptyState from '../../components/EmptyState';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import HistoryTimeline from '../../components/shared/HistoryTimeline';
import { symbolService } from '../../services/symbolService';
import {
  radiusPill,
  radiusMd,
  primaryButtonStyle,
  outlineButtonStyle,
  dangerButtonStyle,
  fontSizeMd,
  spaceSm,
  spaceMd,
  spaceLg,
  spaceFormField,
  fontWeightBold,
  fontWeightMedium,
  borderDefault,
  textPrimary,
  textSecondary,
  statusCritical,
  statusAttention,
  statusOperational,
  actionPrimary,
  sidebarBg,
} from '../../tokens';

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const renderConditionStatusBadge = (status?: ConditionStatus | string) => {
  if (!status) return '—';
  const tagInfo = CONDITION_STATUS_TAG_MAP[status as ConditionStatus];
  const label = tagInfo?.label || status;
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

const toDms = (val?: number | null) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const abs = Math.abs(val);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d - m / 60) * 3600).toFixed(2);
  return `${d}°${m}'${s}"`;
};

const parseWktToCoordinates = (wkt?: string): { longitude: number; latitude: number }[] => {
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

interface VtsOperationCenterDetailDrawerProps {
  visible: boolean;
  item: VtsOperationCenterResponse | null;
  onClose: () => void;
  onEdit?: (item: VtsOperationCenterResponse) => void;
  onRefresh?: () => void;
}

export const VtsOperationCenterDetailDrawer: React.FC<VtsOperationCenterDetailDrawerProps> = ({
  visible,
  item,
  onClose,
  onEdit,
  onRefresh,
}) => {
  const [detail, setDetail] = useState<VtsOperationCenterResponse | null>(null);
  const [attachments, setAttachments] = useState<VtsOperationCenterAttachment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [symbolMap, setSymbolMap] = useState<Map<string, { name: string; image?: string }>>(new Map());

  // Sub-infrastructure filter
  const [infraFilter, setInfraFilter] = useState<string | undefined>();

  // Approval modal states
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveC1ModalVisible, setApproveC1ModalVisible] = useState(false);
  const [approveC1Reason, setApproveC1Reason] = useState('');
  const [approveC2ModalVisible, setApproveC2ModalVisible] = useState(false);
  const [approveC2Reason, setApproveC2Reason] = useState('');

  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();

  useEffect(() => {
    if (visible) {
      symbolService.getOptions().then((res) => {
        if (Array.isArray(res)) {
          const m = new Map<string, { name: string; image?: string }>();
          res.forEach((s) => m.set(s.id, { name: s.name, image: s.image }));
          setSymbolMap(m);
        }
      }).catch(() => {});
    }
  }, [visible]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const [detailData, attList, histList] = await Promise.all([
        vtsOperationCenterService.getById(id),
        vtsOperationCenterService.listAttachments(id),
        vtsOperationCenterService.getHistory(id),
      ]);
      setDetail(detailData);
      setAttachments(attList);
      setHistory(histList);
    } catch (err: any) {
      toast.error('Không thể tải chi tiết trung tâm điều hành VTS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && item?.id) {
      loadData(item.id);
    } else {
      setDetail(null);
      setAttachments([]);
      setHistory([]);
    }
  }, [visible, item?.id]);

  const current = detail || item;

  const parsedCoords = useMemo(() => {
    return parseWktToCoordinates(current?.coordinates);
  }, [current?.coordinates]);

  if (!current) return null;

  const provinceName = current.provinceName || (current.provinceId
    ? getProvinceNameById(current.provinceId) || String(current.provinceId)
    : '—');

  // Permissions & 4-eyes checks
  const canUpdate = hasPermission('vtsoperationcenter:update');
  const canApproveC1 = hasPermission('vtsoperationcenter:approvec1');
  const canApproveC2 = hasPermission('vtsoperationcenter:approvec2');
  const isCreator = user?.id && current.createdBy === user.id;

  const showSubmit = canUpdate && (current.approvalStatus === ApprovalStatus.DRAFT || current.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || current.approvalStatus === ApprovalStatus.REJECTED_LEVEL2);
  const showApproveC1 = canApproveC1 && (current.approvalStatus === ApprovalStatus.PENDING_APPROVAL || current.approvalStatus === ApprovalStatus.PROPOSED) && !isCreator;
  const showApproveC2 = canApproveC2 && current.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 && !isCreator && current.approverLevel1 !== user?.id;
  const showReject = (showApproveC1 || showApproveC2);

  const handleSubmitApproval = async () => {
    try {
      setActionLoading(true);
      await vtsOperationCenterService.submit(current.id);
      toast.success('Gửi phê duyệt thành công');
      loadData(current.id);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveC1 = async () => {
    try {
      setActionLoading(true);
      await vtsOperationCenterService.approveC1(current.id, 'APPROVED', approveC1Reason);
      toast.success('Phê duyệt cấp 1 thành công');
      setApproveC1ModalVisible(false);
      setApproveC1Reason('');
      loadData(current.id);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveC2 = async () => {
    try {
      setActionLoading(true);
      await vtsOperationCenterService.approveC2(current.id, 'APPROVED', approveC2Reason);
      toast.success('Phê duyệt cấp 2 thành công');
      setApproveC2ModalVisible(false);
      setApproveC2Reason('');
      loadData(current.id);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      setActionLoading(true);
      await vtsOperationCenterService.reject(current.id, rejectReason.trim());
      toast.success('Đã từ chối phê duyệt');
      setRejectModalVisible(false);
      setRejectReason('');
      loadData(current.id);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      await vtsOperationCenterService.uploadAttachments(current.id, files);
      toast.success('Tải tệp đính kèm thành công');
      const attList = await vtsOperationCenterService.listAttachments(current.id);
      setAttachments(attList);
    } catch (err: any) {
      toast.error('Tải tệp đính kèm thất bại');
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    try {
      await vtsOperationCenterService.deleteAttachment(current.id, attId);
      toast.success('Xóa tệp đính kèm thành công');
      setAttachments((prev) => prev.filter((a) => a.id !== attId));
    } catch (err: any) {
      toast.error('Xóa tệp đính kèm thất bại');
    }
  };

  // Dummy / linked infrastructure list
  const subInfrastructures: any[] = [];
  const operationsList: any[] = [];
  const maintenanceList: any[] = [];
  const incidentList: any[] = [];

  // Audit calculated fields
  const isDraft = current.approvalStatus === ApprovalStatus.DRAFT;
  const isApprovedC1 = current.approvalStatus === ApprovalStatus.APPROVED_LEVEL1;
  const isApprovedC2 = current.approvalStatus === ApprovalStatus.APPROVED;
  const isRejectedC1 = current.approvalStatus === ApprovalStatus.REJECTED_LEVEL1;
  const isRejectedC2 = current.approvalStatus === ApprovalStatus.REJECTED_LEVEL2 || current.approvalStatus === ApprovalStatus.REJECTED;

  const submitHistory = history.find((h) => h.action?.toUpperCase() === 'SUBMIT' || h.status === 'PROPOSED' || h.status === 'PENDING_APPROVAL');
  const submittedDate = !isDraft && (submitHistory?.performedDate ? dayjs(submitHistory.performedDate).format('DD/MM/YYYY HH:mm:ss') : (current.updatedAt ? dayjs(current.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'));
  const submittedByName = !isDraft ? (submitHistory?.performedBy || current.createdByName || '—') : '—';

  const approvedDateC1 = (isApprovedC1 || isApprovedC2 || isRejectedC1) && current.approvedDateLevel1 ? dayjs(current.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—';
  const approverC1Name = (isApprovedC1 || isApprovedC2 || isRejectedC1) ? (current.approverLevel1Name || '—') : '—';
  const approvalContentC1 = isRejectedC1 ? (current.rejectionReason || '—') : (isApprovedC1 || isApprovedC2 ? 'Đồng ý phê duyệt' : '—');

  const approvedDateC2 = (isApprovedC2 || isRejectedC2) && current.approvedDateLevel2 ? dayjs(current.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—';
  const approverC2Name = (isApprovedC2 || isRejectedC2) ? (current.approverLevel2Name || '—') : '—';
  const approvalContentC2 = isRejectedC2 ? (current.rejectionReason || '—') : (isApprovedC2 ? 'Đồng ý phê duyệt' : '—');

  const tabItems = [
    {
      key: 'basic',
      label: 'Thông tin cơ bản',
      children: (
        <div style={{ paddingTop: 16 }}>
          <div className="detail-grid">
            {[
              ['Đơn vị quản lý', current.orgUnitName || '—'],
              ['Thuộc cảng biển', current.portName || '—'],
              ['Thuộc hệ thống VTS', current.vtsSystemName || '—'],
              ['Mã trung tâm điều hành VTS', current.code || '—'],
              ['Tên trung tâm điều hành VTS', current.name || '—'],
              ['Địa điểm (Tỉnh/TP)', provinceName],
              ['Địa điểm chi tiết', current.detailedLocation || '—'],
              ['Tình trạng', renderConditionStatusBadge(current.conditionStatus)],
            ].map(([label, value], i) => (
              <div key={i} className="detail-row">
                <span className="detail-label">{label}</span>
                <span className="detail-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'other',
      label: 'Thông tin khác',
      children: (
        <div style={{ paddingTop: 16 }}>
          <div className="detail-grid">
            <div className="detail-row detail-row--full">
              <span className="detail-label">Vùng phủ sóng</span>
              <span className="detail-value">{current.coverage || '—'}</span>
            </div>
            <div className="detail-row detail-row--full">
              <span className="detail-label">Ghi chú</span>
              <span className="detail-value">{current.note || '—'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'gis',
      label: 'Vị trí (GIS)',
      children: (
        <div style={{ paddingTop: 16 }}>
          <div className="detail-grid" style={{ marginBottom: 16 }}>
            <div className="detail-row">
              <span className="detail-label">Loại đối tượng</span>
              <span className="detail-value">
                {current.geometryType === 'POINT' ? 'Điểm' : current.geometryType === 'LINE' ? 'Đường' : current.geometryType === 'POLYGON' ? 'Vùng' : (current.geometryType || '—')}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Biểu tượng</span>
              <span className="detail-value">
                {current.symbolId && symbolMap.has(current.symbolId) ? (
                  <Space>
                    {symbolMap.get(current.symbolId)?.image && (
                      <img src={symbolMap.get(current.symbolId)?.image} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    )}
                    <span>{symbolMap.get(current.symbolId)?.name}</span>
                  </Space>
                ) : (current.symbolId || '—')}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Hệ quy chiếu</span>
              <span className="detail-value">WGS 84 / VN-2000</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Quy tắc hiển thị</span>
              <span className="detail-value">Độ, phút, giây (DMS)</span>
            </div>
          </div>

          {parsedCoords.length > 0 ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: fontWeightBold, color: sidebarBg, marginBottom: 8 }}>
                Tọa độ các điểm đỉnh:
              </div>
              <Table
                dataSource={parsedCoords.map((c, i) => ({ key: i, index: i + 1, ...c }))}
                pagination={false}
                size="middle"
                bordered
                columns={[
                  { title: 'STT', dataIndex: 'index', width: 60, align: 'center' },
                  { title: 'Kinh độ (Độ thập phân)', dataIndex: 'longitude', render: (val) => val ?? '—' },
                  { title: 'Vĩ độ (Độ thập phân)', dataIndex: 'latitude', render: (val) => val ?? '—' },
                  { title: 'Kinh độ (DMS)', dataIndex: 'longitude', render: (val) => toDms(val) },
                  { title: 'Vĩ độ (DMS)', dataIndex: 'latitude', render: (val) => toDms(val) },
                ]}
              />
            </div>
          ) : (
            <Empty description="Chưa có dữ liệu tọa độ GIS" style={{ margin: '32px 0' }} />
          )}
        </div>
      ),
    },
    {
      key: 'files',
      label: `File đính kèm (${attachments.length})`,
      children: (
        <div style={{ paddingTop: 16 }}>
          {canUpdate && (
            <div style={{ marginBottom: spaceMd }}>
              <Upload
                beforeUpload={(file) => {
                  handleFileUpload([file]);
                  return false;
                }}
                showUploadList={false}
                multiple
              >
                <Button icon={<UploadOutlined />} style={{ ...primaryButtonStyle, borderRadius: radiusPill }}>
                  Tải lên tệp mới
                </Button>
              </Upload>
            </div>
          )}
          <Table
            dataSource={attachments}
            rowKey="id"
            pagination={false}
            size="middle"
            bordered
            columns={[
              {
                title: 'Tên tệp',
                dataIndex: 'fileName',
                render: (text: string, record: VtsOperationCenterAttachment) => (
                  <Space>
                    <FileOutlined />
                    {record.filePath ? (
                      <a href={record.filePath} target="_blank" rel="noopener noreferrer">
                        {text}
                      </a>
                    ) : (
                      <span>{text}</span>
                    )}
                  </Space>
                ),
              },
              {
                title: 'Dung lượng',
                dataIndex: 'fileSize',
                width: 130,
                render: (size?: number) => (size ? `${(size / 1024).toFixed(1)} KB` : '—'),
              },
              {
                title: 'Ngày tải lên',
                dataIndex: 'uploadedDate',
                width: 170,
                render: (date?: string) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'),
              },
              ...(canUpdate
                ? [
                    {
                      title: 'Thao tác',
                      key: 'action',
                      width: 80,
                      align: 'center' as const,
                      render: (_: any, record: VtsOperationCenterAttachment) => (
                        <Popconfirm
                          title="Xóa tệp đính kèm này?"
                          onConfirm={() => handleDeleteAttachment(record.id)}
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
    {
      key: 'audit',
      label: 'Trạng thái & Kiểm toán',
      children: (
        <div style={{ paddingTop: 16 }}>
          <div className="detail-grid">
            <div className="detail-row">
              <span className="detail-label">Trạng thái</span>
              <span className="detail-value"><ApprovalStatusBadge status={current.approvalStatus} /></span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Ngày cập nhật</span>
              <span className="detail-value">{current.updatedAt ? dayjs(current.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Cán bộ cập nhật</span>
              <span className="detail-value">{current.updatedByName || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Ngày gửi phê duyệt</span>
              <span className="detail-value">{submittedDate}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Cán bộ gửi phê duyệt</span>
              <span className="detail-value">{submittedByName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
              <span className="detail-value">{approvedDateC1}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
              <span className="detail-value">{approverC1Name}</span>
            </div>
            <div className="detail-row detail-row--full">
              <span className="detail-label">Nội dung phê duyệt cấp Cảng vụ/Chi cục</span>
              <span className="detail-value">{approvalContentC1}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Ngày phê duyệt cấp Cục</span>
              <span className="detail-value">{approvedDateC2}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Cán bộ phê duyệt cấp Cục</span>
              <span className="detail-value">{approverC2Name}</span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-label">Nội dung phê duyệt cấp Cục</span>
              <span className="detail-value">{approvalContentC2}</span>
            </div>
          </div>

          {current.rejectionReason && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: `${statusCritical}10`, border: `1px solid ${statusCritical}30`, borderRadius: radiusMd }}>
              <div style={{ fontWeight: fontWeightBold, color: statusCritical, marginBottom: 4 }}>Lý do từ chối:</div>
              <div>{current.rejectionReason}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'other_kcht',
      label: 'KCHT khác thuộc TTDH VTS',
      children: (
        <div style={{ paddingTop: 16 }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Select
              placeholder="Lọc theo loại KCHT"
              allowClear
              value={infraFilter}
              onChange={setInfraFilter}
              style={{ width: 220, borderRadius: radiusPill }}
              options={[
                { value: 'AIS', label: 'Hệ thống AIS' },
                { value: 'RADAR', label: 'Trạm Radar' },
                { value: 'VHF', label: 'Trạm thông tin VHF' },
                { value: 'CCTV', label: 'Hệ thống Camera CCTV' },
              ]}
            />
          </div>
          <Table
            dataSource={subInfrastructures.filter((r) => !infraFilter || r.type === infraFilter)}
            rowKey="id"
            pagination={false}
            size="middle"
            bordered
            columns={[
              { title: 'STT', width: 60, align: 'center', render: (_: any, __: any, i: number) => i + 1 },
              { title: 'Tên kết cấu hạ tầng', dataIndex: 'name', key: 'name' },
              { title: 'Loại kết cấu hạ tầng', dataIndex: 'typeLabel', key: 'typeLabel', width: 180 },
              { title: 'Tình trạng', dataIndex: 'conditionStatus', key: 'conditionStatus', width: 140 },
            ]}
            locale={{
              emptyText: <EmptyState description="Chưa có kết cấu hạ tầng nào trực thuộc trung tâm điều hành này" />,
            }}
          />
        </div>
      ),
    },
    {
      key: 'operation',
      label: 'Thông tin vận hành khai thác',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Table
            dataSource={operationsList}
            rowKey="id"
            pagination={false}
            size="middle"
            bordered
            columns={[
              { title: 'STT', width: 60, align: 'center', render: (_: any, __: any, i: number) => i + 1 },
              { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'planCode', width: 140 },
              { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'planName' },
              { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'startDate', width: 140 },
              { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate', width: 140 },
            ]}
            locale={{
              emptyText: <Empty description="Không có dữ liệu" style={{ margin: '32px 0' }} />,
            }}
          />
        </div>
      ),
    },
    {
      key: 'maintenance',
      label: 'Thông tin bảo trì',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Table
            dataSource={maintenanceList}
            rowKey="id"
            pagination={false}
            size="middle"
            bordered
            columns={[
              { title: 'STT', width: 60, align: 'center', render: (_: any, __: any, i: number) => i + 1 },
              { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'planCode', width: 140 },
              { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'planName' },
              { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'startTime', width: 150 },
              { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'endTime', width: 150 },
            ]}
            locale={{
              emptyText: <Empty description="Không có dữ liệu" style={{ margin: '32px 0' }} />,
            }}
          />
        </div>
      ),
    },
    {
      key: 'incidents',
      label: 'Thông tin sự cố',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Table
            dataSource={incidentList}
            rowKey="id"
            pagination={false}
            size="middle"
            bordered
            columns={[
              { title: 'STT', width: 60, align: 'center', render: (_: any, __: any, i: number) => i + 1 },
              { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'incidentCode', width: 130 },
              { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'incidentType', width: 160 },
              { title: 'Địa điểm', dataIndex: 'location', key: 'location' },
              { title: 'Thời gian', dataIndex: 'time', key: 'time', width: 150 },
            ]}
            locale={{
              emptyText: <Empty description="Không có dữ liệu" style={{ margin: '32px 0' }} />,
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <AppDrawer
      title={current.name ? `Chi tiết trung tâm điều hành VTS - ${current.name}` : 'Chi tiết trung tâm điều hành VTS'}
      open={visible}
      onClose={onClose}
    >
      <style>{`
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
        .detail-row { display: flex; padding: 10px 12px; border-bottom: 1px solid ${borderDefault}; }
        .detail-row--full { grid-column: 1 / -1; }
        .detail-label { width: 230px; flex-shrink: 0; color: ${sidebarBg}; font-weight: ${fontWeightBold}; font-size: ${fontSizeMd}px; }
        .detail-label::after { content: ':'; margin-left: 2px; }
        .detail-value { color: ${textPrimary}; font-size: ${fontSizeMd}px; flex: 1; min-width: 0; overflow-wrap: anywhere; }
        .detail-value .ant-tag { margin-left: -6px !important; }
      `}</style>

      <Spin spinning={loading}>
        <Tabs
          defaultActiveKey="basic"
          tabBarStyle={{ marginBottom: 0, paddingTop: 0 }}
          items={tabItems}
        />
      </Spin>

      {/* Modal Reject */}
      <Modal
        title="Từ chối phê duyệt"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleReject}
        confirmLoading={actionLoading}
        okText="Từ chối"
        okButtonProps={{ danger: true, style: { borderRadius: radiusPill, height: 40 } }}
        cancelButtonProps={{ style: { borderRadius: radiusPill, height: 40 } }}
      >
        <div style={{ marginTop: spaceFormField, marginBottom: spaceLg }}>
          <label style={{ display: 'block', marginBottom: spaceSm, fontWeight: fontWeightMedium }}>
            Lý do từ chối <span style={{ color: '#D83A52' }}>*</span>
          </label>
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối phê duyệt..."
            maxLength={1000}
            showCount
            style={{ borderRadius: radiusMd }}
          />
        </div>
      </Modal>

      {/* Modal Approve Cảng vụ */}
      <Modal
        title="Xác nhận phê duyệt cấp Cảng vụ/Chi cục"
        open={approveC1ModalVisible}
        onCancel={() => setApproveC1ModalVisible(false)}
        onOk={handleApproveC1}
        confirmLoading={actionLoading}
        okText="Phê duyệt cấp Cảng vụ"
        okButtonProps={{ style: { ...primaryButtonStyle, borderRadius: radiusPill, height: 40, background: '#13C2C2', borderColor: '#13C2C2' } }}
        cancelButtonProps={{ style: { borderRadius: radiusPill, height: 40 } }}
      >
        <div style={{ marginTop: spaceFormField, marginBottom: spaceLg }}>
          <label style={{ display: 'block', marginBottom: spaceSm, fontWeight: fontWeightMedium }}>
            Nội dung / Ý kiến phê duyệt (không bắt buộc)
          </label>
          <Input.TextArea
            rows={3}
            value={approveC1Reason}
            onChange={(e) => setApproveC1Reason(e.target.value)}
            placeholder="Nhập ý kiến phê duyệt nếu có..."
            maxLength={1000}
            showCount
            style={{ borderRadius: radiusMd }}
          />
        </div>
      </Modal>

      {/* Modal Approve Cục */}
      <Modal
        title="Xác nhận phê duyệt cấp Cục"
        open={approveC2ModalVisible}
        onCancel={() => setApproveC2ModalVisible(false)}
        onOk={handleApproveC2}
        confirmLoading={actionLoading}
        okText="Phê duyệt cấp Cục"
        okButtonProps={{ style: { ...primaryButtonStyle, borderRadius: radiusPill, height: 40, background: '#1BAF7A', borderColor: '#1BAF7A' } }}
        cancelButtonProps={{ style: { borderRadius: radiusPill, height: 40 } }}
      >
        <div style={{ marginTop: spaceFormField, marginBottom: spaceLg }}>
          <label style={{ display: 'block', marginBottom: spaceSm, fontWeight: fontWeightMedium }}>
            Nội dung / Ý kiến phê duyệt (không bắt buộc)
          </label>
          <Input.TextArea
            rows={3}
            value={approveC2Reason}
            onChange={(e) => setApproveC2Reason(e.target.value)}
            placeholder="Nhập ý kiến phê duyệt nếu có..."
            maxLength={1000}
            showCount
            style={{ borderRadius: radiusMd }}
          />
        </div>
      </Modal>
    </AppDrawer>
  );
};
