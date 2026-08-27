import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Tabs,
  Tag,
  Space,
  Button,
  Table,
  Empty,
  Popconfirm,
} from 'antd';
import {
  FileOutlined,
  DownloadOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { HanoiStationItem } from '../../../types/hanoiStation';
import { hanoiStationService } from '../../../services/hanoiStationService';
import { getProvinceNameById } from '../../../types/common';
import toast from '../../../components/ToastNotification';
import { colors } from '../../../theme';
import {
  radiusPill,
  radiusMd,
  fontSizeSm,
  fontSizeMd,
  fontWeightBold,
  fontWeightMedium,
  borderDefault,
  textPrimary,
  textSecondary,
  textTertiary,
  spaceSm,
  drawerCloseBtnStyle,
  drawerTitleStyle,
  statusCritical,
  statusAttention,
  statusOperational,
  actionPrimary,
  primaryButtonStyle,
  outlineButtonStyle,
} from '../../../tokens';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import { useAuthStore } from '../../../store/authStore';

interface HanoiStationDetailDrawerProps {
  open: boolean;
  stationId?: string | null;
  onClose: () => void;
  onEdit?: (station: HanoiStationItem) => void;
  onApproveC1?: (id: string) => void;
  onApproveC2?: (id: string) => void;
  onReject?: (id: string) => void;
}

const renderInfoRow = (label: string, value: React.ReactNode) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${borderDefault}`,
      fontSize: fontSizeMd,
    }}
  >
    <span style={{ color: textSecondary, minWidth: 180 }}>{label}:</span>
    <span style={{ color: textPrimary, fontWeight: 500, textAlign: 'right' }}>{value || '—'}</span>
  </div>
);

export const HanoiStationDetailDrawer: React.FC<HanoiStationDetailDrawerProps> = ({
  open,
  stationId,
  onClose,
  onEdit,
  onApproveC1,
  onApproveC2,
  onReject,
}) => {
  const [station, setStation] = useState<HanoiStationItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (open && stationId) {
      setLoading(true);
      hanoiStationService
        .getById(stationId)
        .then((res) => {
          setStation(res);
        })
        .catch((err) => {
          toast.error('Không thể tải thông tin chi tiết Đài TTXLTT');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, stationId]);

  if (!station) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={700}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 24 }}>
          <span style={drawerTitleStyle}>Chi tiết: {station.name}</span>
          <ApprovalStatusBadge status={station.approvalStatus ?? 0} />
        </div>
      }
      extra={
        <Space>
          {onEdit && (
            <Button
              icon={<EditOutlined />}
              style={outlineButtonStyle}
              onClick={() => onEdit(station)}
            >
              Chỉnh sửa
            </Button>
          )}
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'general',
            label: 'Thông tin chung',
            children: (
              <div>
                {renderInfoRow('Mã đài TTXLTT', <span style={{ color: actionPrimary, fontWeight: fontWeightBold }}>{station.code}</span>)}
                {renderInfoRow('Tên đài TTXLTT', station.name)}
                {renderInfoRow('Đơn vị quản lý', station.orgUnitName)}
                {renderInfoRow('Đơn vị khai thác', station.operatingOrgName)}
                {renderInfoRow('Tỉnh / Thành phố', station.provinceName || (station.provinceId ? getProvinceNameById(station.provinceId) : '—'))}
                {renderInfoRow('Địa chỉ chi tiết', station.locationAddress)}
                {renderInfoRow('Tình trạng hoạt động', station.conditionStatus === 'OPERATIONAL' ? 'Hoạt động tốt' : 'Bảo trì')}
                {renderInfoRow('Vùng phủ sóng', station.coverageArea)}
                {renderInfoRow('Dịch vụ cung cấp', station.servicesProvided)}
                {renderInfoRow('Ghi chú / Mô tả', station.description)}
              </div>
            ),
          },
          {
            key: 'equipment',
            label: 'Thông tin thiết bị & Kiểm định',
            children: (
              <div>
                {renderInfoRow('Khu vực / Cảng phục vụ', station.portName)}
                {renderInfoRow('Quận / Huyện', station.district)}
                {renderInfoRow('Phường / Xã', station.ward)}
                {renderInfoRow('Loại trang thiết bị', station.equipmentType)}
                {renderInfoRow('Tần số liên lạc', station.communicationFrequency)}
                {renderInfoRow('Số giấy phép hoạt động', station.operationalLicense)}
                {renderInfoRow('Hạn giấy phép', station.licenseExpiry)}
                {renderInfoRow('Cán bộ kiểm tra', station.inspectorName)}
                {renderInfoRow('SĐT cán bộ kiểm tra', station.inspectorPhone)}
                {renderInfoRow('Ngày kiểm định gần nhất', station.lastInspectionDate ? dayjs(station.lastInspectionDate).format('DD/MM/YYYY') : '—')}
                {renderInfoRow('Ngày kiểm định tiếp theo', station.nextInspectionDate ? dayjs(station.nextInspectionDate).format('DD/MM/YYYY') : '—')}
                {renderInfoRow('Người liên hệ', station.contactPerson)}
                {renderInfoRow('Số điện thoại liên hệ', station.contactPhone)}
              </div>
            ),
          },
          {
            key: 'location',
            label: 'Thông tin vị trí & GIS',
            children: (
              <div>
                {renderInfoRow('Loại đối tượng hình học', station.geometryType || 'POINT')}
                {renderInfoRow('Hệ tọa độ', station.coordinateSystem || 'WGS84')}
                {renderInfoRow('Vĩ độ (Lat)', station.latitude != null ? station.latitude : '—')}
                {renderInfoRow('Kinh độ (Lng)', station.longitude != null ? station.longitude : '—')}
                {renderInfoRow('Tọa độ WKT', station.coordinates)}
              </div>
            ),
          },
          {
            key: 'approval',
            label: 'Lịch sử & Phê duyệt',
            children: (
              <div>
                {renderInfoRow('Trạng thái phê duyệt', <ApprovalStatusBadge status={station.approvalStatus ?? 0} />)}
                {renderInfoRow('Người tạo', station.createdByName)}
                {renderInfoRow('Ngày tạo', station.createdAt ? dayjs(station.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—')}
                {renderInfoRow('Người cập nhật cuối', station.updatedByName)}
                {renderInfoRow('Ngày cập nhật cuối', station.updatedAt ? dayjs(station.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—')}
                {renderInfoRow('Người duyệt Vòng 1', station.approverLevel1Name)}
                {renderInfoRow('Ngày duyệt Vòng 1', station.approvedDateLevel1 ? dayjs(station.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—')}
                {renderInfoRow('Người duyệt Vòng 2', station.approverLevel2Name)}
                {renderInfoRow('Ngày duyệt Vòng 2', station.approvedDateLevel2 ? dayjs(station.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—')}
                {station.rejectionReason && renderInfoRow('Lý do từ chối', <span style={{ color: statusCritical }}>{station.rejectionReason}</span>)}
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
};
