import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Tabs,
  Space,
  Button,
  Empty,
} from 'antd';
import dayjs from 'dayjs';
import type {
  AisSystemResponse,
  AisSystemAttachment,
} from '../../types/aisSystem';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import { UNIT_OF_MEASURE_MAP } from '../../types/aisSystem';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { aisSystemService } from '../../services/aisSystemService';
import {
  ConditionStatus,
  CONDITION_STATUS_MAP,
  ApprovalStatus,
} from '../../types/vtsSystem';
import { getProvinceNameById } from '../../types/common';
import toast from '../../components/ToastNotification';
import { colors } from '../../theme';
import {
  radiusPill,
  radiusMd,
  fontSizeMd,
  fontWeightBold,
  fontWeightMedium,
  borderDefault,
  textPrimary,
  textSecondary,
  spaceSm,
  drawerCloseBtnStyle,
  drawerTitleStyle,
  statusCritical,
  statusAttention,
  statusOperational,
  actionPrimary,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import DetailTable from '../../components/shared/DetailTable';

interface CoordinateItem {
  latitude: number | null;
  longitude: number | null;
}

const ddToDms = (dd: number | null | undefined) => {
  if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
  return `${d}°${m}'${s}"`;
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

interface AisSystemDetailDrawerProps {
  visible: boolean;
  item: AisSystemResponse | null;
  onClose: () => void;
  onEdit?: (item: AisSystemResponse) => void;
  onRefresh?: () => void;
}

export const AisSystemDetailDrawer: React.FC<AisSystemDetailDrawerProps> = ({
  visible,
  item,
  onClose,
}) => {
  const [detail, setDetail] = useState<AisSystemResponse | null>(null);
  const [attachments, setAttachments] = useState<AisSystemAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const [detailData, attList] = await Promise.all([
        aisSystemService.getById(id),
        aisSystemService.listAttachments(id),
      ]);
      setDetail(detailData);
      setAttachments(attList || []);
    } catch (err: any) {
      toast.error('Không thể tải chi tiết hệ thống AIS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && item?.id) {
      setActiveTab('basic');
      loadData(item.id);
    } else {
      setDetail(null);
      setAttachments([]);
    }
  }, [visible, item]);

  const record = detail || item;
  const parsedCoords = parseWktToCoordinates(record?.coordinates);

  const isDraft = record?.approvalStatus === ApprovalStatus.DRAFT || record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2;
  const isApprovedL1 = record?.approvalStatus === ApprovalStatus.APPROVED_LEVEL1;
  const isApproved = record?.approvalStatus === ApprovalStatus.APPROVED;

  const isRejectedC1 = record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1;
  const isRejectedC2 = record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2;

  const submittedDate = !isDraft && record ? (record.updatedAt ? dayjs(record.updatedAt).format('DD/MM/YYYY HH:mm:ss') : (record.createdAt ? dayjs(record.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—')) : '—';
  const submittedByName = !isDraft && record ? (record.createdByName || '—') : '—';

  const approvedDateC1 = (isApprovedL1 || isApproved || isRejectedC1) && record?.approvedDateLevel1 ? dayjs(record.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—';
  const approverC1Name = (isApprovedL1 || isApproved || isRejectedC1) ? (record?.approverLevel1Name || '—') : '—';
  const approvalContentC1 = isRejectedC1 ? (record?.rejectionReason || 'Từ chối phê duyệt') : (isApprovedL1 || isApproved ? 'Đồng ý phê duyệt' : '—');

  const approvedDateC2 = (isApproved || isRejectedC2) && record?.approvedDateLevel2 ? dayjs(record.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—';
  const approverC2Name = (isApproved || isRejectedC2) ? (record?.approverLevel2Name || '—') : '—';
  const approvalContentC2 = isRejectedC2 ? (record?.rejectionReason || 'Từ chối phê duyệt') : (isApproved ? 'Đồng ý phê duyệt' : '—');

  const provinceDisplay = record?.provinceId ? (getProvinceNameById(record.provinceId) || record.provinceId) : (record?.provinceName || '—');
  const uomDisplay = record?.unitOfMeasure ? (UNIT_OF_MEASURE_MAP[record.unitOfMeasure] || record.unitOfMeasureLabel || record.unitOfMeasure) : (record?.unitOfMeasureLabel || '—');

  const tabItems = [
    {
      key: 'basic',
      label: 'Thông tin chung',
      children: (
        <div style={{ paddingTop: 16 }}>
          <div className="detail-grid">
            {/* 1. Mã thiết bị & 2. Tên thiết bị */}
            <div className="detail-row">
              <span className="detail-label">Mã thiết bị</span>
              <span className="detail-value" style={{ fontWeight: fontWeightBold }}>{record?.code || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Tên thiết bị</span>
              <span className="detail-value">{record?.name || '—'}</span>
            </div>

            {/* 3. Đơn vị quản lý & 4. Thuộc TTDH VTS / Trạm Radar */}
            <div className="detail-row">
              <span className="detail-label">Đơn vị quản lý</span>
              <span className="detail-value">{record?.orgUnitName || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Thuộc TTDH VTS / Trạm Radar</span>
              <span className="detail-value">{record?.attachedLocationName || record?.vtsOperationCenterName || record?.radarStationName || '—'}</span>
            </div>

            {/* 5. Đơn vị khai thác & 6. Địa điểm (Tỉnh/TP) */}
            <div className="detail-row">
              <span className="detail-label">Đơn vị khai thác</span>
              <span className="detail-value">{record?.operatingOrgName || DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === record?.operatingOrgId)?.name || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Địa điểm (Tỉnh/TP)</span>
              <span className="detail-value">{provinceDisplay}</span>
            </div>

            {/* 7. Địa điểm chi tiết */}
            <div className="detail-row detail-row--full">
              <span className="detail-label">Địa điểm chi tiết</span>
              <span className="detail-value">{record?.detailedLocation || '—'}</span>
            </div>

            {/* 8. Đơn vị tính & 9. Số lượng */}
            <div className="detail-row">
              <span className="detail-label">Đơn vị tính</span>
              <span className="detail-value">{uomDisplay}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Số lượng</span>
              <span className="detail-value">{record?.quantity != null ? record.quantity : '—'}</span>
            </div>

            {/* 10. Năm đưa vào sử dụng & 11. Tình trạng */}
            <div className="detail-row">
              <span className="detail-label">Năm đưa vào sử dụng</span>
              <span className="detail-value">{record?.commissioningYear || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Tình trạng</span>
              <span className="detail-value">{renderConditionStatusBadge(record?.conditionStatus)}</span>
            </div>

            {/* 12. Model */}
            <div className="detail-row detail-row--full">
              <span className="detail-label">Model</span>
              <span className="detail-value">{record?.model || '—'}</span>
            </div>

            {/* 13. Thông số kỹ thuật */}
            <div className="detail-row detail-row--full">
              <span className="detail-label">Thông số kỹ thuật</span>
              <span className="detail-value">{record?.specifications || '—'}</span>
            </div>

            {/* 14. Hãng sản xuất */}
            <div className="detail-row detail-row--full">
              <span className="detail-label">Hãng sản xuất</span>
              <span className="detail-value">{record?.manufacturer || '—'}</span>
            </div>

            {/* 15. Thông tin bảo trì */}
            <div className="detail-row detail-row--full">
              <span className="detail-label">Thông tin bảo trì</span>
              <span className="detail-value">{record?.maintenanceInfo || '—'}</span>
            </div>

            {/* 16. Ghi chú */}
            <div className="detail-row detail-row--full">
              <span className="detail-label">Ghi chú</span>
              <span className="detail-value">{record?.note || '—'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'gis',
      label: 'Vị trí (GIS)',
      children: (
        <div>
          <div className="chk-detail-grid" style={{ marginBottom: 12 }}>
            <div className="chk-detail-row">
              <span className="chk-detail-label">Loại đối tượng</span>
              <span className="chk-detail-value">
                {record?.geometryType === 'POINT' ? 'Đối tượng điểm' : record?.geometryType === 'LINE' ? 'Đối tượng đường' : record?.geometryType === 'POLYGON' ? 'Đối tượng vùng' : (record?.geometryType || 'Đối tượng điểm')}
              </span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label">Biểu tượng bản đồ</span>
              <span className="chk-detail-value">{record?.symbolId || 'Hệ thống AIS'}</span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label">Hệ quy chiếu</span>
              <span className="chk-detail-value">WGS 84 / VN-2000</span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label">Quy tắc hiển thị</span>
              <span className="chk-detail-value">Độ, phút, giây (DMS)</span>
            </div>
          </div>

          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 13, lineHeight: '32px' }}>
              Tọa độ GPS
            </span>
          </div>
          <DetailTable
            scrollY="calc(100vh - 454px)"
            dataSource={parsedCoords.map((c, i) => ({ key: i, index: i + 1, ...c }))}
            rowKey="index"
            emptyText="Chưa có dữ liệu tọa độ"
            columns={[
              { title: 'STT', dataIndex: 'index', width: 60, align: 'center' },
              { title: 'Kinh độ (Độ thập phân)', dataIndex: 'longitude', render: (val) => (val != null ? val.toFixed(6) : '—') },
              { title: 'Vĩ độ (Độ thập phân)', dataIndex: 'latitude', render: (val) => (val != null ? val.toFixed(6) : '—') },
              { title: 'Kinh độ (DMS)', dataIndex: 'longitude', render: (val) => ddToDms(val) },
              { title: 'Vĩ độ (DMS)', dataIndex: 'latitude', render: (val) => ddToDms(val) },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'attachment',
      label: 'File đính kèm',
      children: (
        <InfrastructureAttachmentTab
          attachments={attachments}
          readonly={true}
          isLoading={loading}
          onDownload={(attId, fileName) => {
            if (record?.id) {
              return aisSystemService.downloadAttachment(record.id, attId, fileName);
            }
          }}
        />
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
              <span className="detail-value"><ApprovalStatusBadge status={record?.approvalStatus} /></span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Ngày cập nhật</span>
              <span className="detail-value">{record?.updatedAt ? dayjs(record.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Cán bộ cập nhật</span>
              <span className="detail-value">{record?.updatedByName || '—'}</span>
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
            <div className="detail-row">
              <span className="detail-label">Ngày phê duyệt cấp Cục</span>
              <span className="detail-value">{approvedDateC2}</span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-label">Cán bộ phê duyệt cấp Cục</span>
              <span className="detail-value">{approverC2Name}</span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-label">Nội dung phê duyệt cấp Cảng vụ/Chi cục</span>
              <span className="detail-value">{approvalContentC1}</span>
            </div>

            <div className="detail-row detail-row--full">
              <span className="detail-label">Nội dung phê duyệt cấp Cục</span>
              <span className="detail-value">{approvalContentC2}</span>
            </div>
          </div>

          {record?.rejectionReason && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: `${statusCritical}10`, border: `1px solid ${statusCritical}30`, borderRadius: radiusMd }}>
              <div style={{ fontWeight: fontWeightBold, color: statusCritical, marginBottom: 4 }}>Lý do từ chối:</div>
              <div>{record.rejectionReason}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'operation',
      label: 'Thông tin vận hành khai thác',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Empty description="Chưa có thông tin vận hành khai thác" style={{ margin: '32px 0' }} />
        </div>
      ),
    },
    {
      key: 'maintenance',
      label: 'Thông tin bảo trì',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Empty description="Chưa có thông tin kế hoạch bảo trì" style={{ margin: '32px 0' }} />
        </div>
      ),
    },
    {
      key: 'incident',
      label: 'Thông tin sự cố',
      children: (
        <div style={{ paddingTop: 16 }}>
          <Empty description="Chưa có thông tin ghi nhận sự cố" style={{ margin: '32px 0' }} />
        </div>
      ),
    },
  ];

  return (
    <Drawer
      size={960}
      placement="right"
      open={visible}
      onClose={onClose}
      closable={false}
      extra={
        <Button
          type="text"
          aria-label="Đóng chi tiết hệ thống AIS"
          onClick={onClose}
          style={drawerCloseBtnStyle}
        >
          ✕
        </Button>
      }
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '12px 24px 24px 24px', overflowY: 'auto' },
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space size={spaceSm} style={{ alignItems: 'center' }}>
            <span style={drawerTitleStyle}>
              {record ? `Chi tiết hệ thống AIS — ${record.name || record.code}` : 'Chi tiết hệ thống AIS'}
            </span>
            {record?.approvalStatus && (
              <ApprovalStatusBadge status={record.approvalStatus} />
            )}
          </Space>
        </div>
      }
      footer={null}
    >
      <style>{`
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
        .detail-row { display: flex; padding: 10px 12px; border-bottom: 1px solid ${borderDefault}; }
        .detail-row--full { grid-column: 1 / -1; }
        .detail-label { width: 260px; flex-shrink: 0; color: ${colors.sidebarBg}; font-weight: ${fontWeightBold}; font-size: ${fontSizeMd}px; }
        .detail-label::after { content: ':'; margin-left: 2px; }
        .detail-value { color: ${textPrimary}; font-size: ${fontSizeMd}px; flex: 1; min-width: 0; overflow-wrap: anywhere; }
        .detail-value .ant-tag { margin-left: -6px !important; }
        .ant-tabs-nav { margin-bottom: 0 !important; }
      `}</style>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Drawer>
  );
};

export default AisSystemDetailDrawer;
