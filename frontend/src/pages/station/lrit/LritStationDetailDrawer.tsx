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
import type { LritStationItem } from '../../../types/lritStation';
import { lritStationService } from '../../../services/lritStationService';
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

interface LritStationDetailDrawerProps {
  open: boolean;
  stationId?: string | null;
  onClose: () => void;
  onEdit?: (station: LritStationItem) => void;
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

export const LritStationDetailDrawer: React.FC<LritStationDetailDrawerProps> = ({
  open,
  stationId,
  onClose,
  onEdit,
  onApproveC1,
  onApproveC2,
  onReject,
}) => {
  const [station, setStation] = useState<LritStationItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (open && stationId) {
      setLoading(true);
      lritStationService
        .getById(stationId)
        .then((res) => {
          setStation(res);
        })
        .catch((err) => {
          toast.error('Không thể tải thông tin chi tiết Đài LRIT');
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
          <span style={drawerTitleStyle}>Chi tiết Đài LRIT: {station.name}</span>
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
                {renderInfoRow('Mã đài LRIT', <span style={{ color: actionPrimary, fontWeight: fontWeightBold }}>{station.code}</span>)}
                {renderInfoRow('Tên đài LRIT', station.name)}
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
            label: 'Thông tin thiết bị',
            children: (
              <div>
                {renderInfoRow('Mã trạm đầu cuối (Terminal ID)', station.terminalId)}
                {renderInfoRow('Số hiệu IMO', station.imoNumber)}
                {renderInfoRow('Chu kỳ báo cáo', station.reportingInterval ? `${station.reportingInterval} phút` : '—')}
                {renderInfoRow('Chiều cao anten', station.antennaHeight ? `${station.antennaHeight} m` : '—')}
                {renderInfoRow('Công suất phát', station.powerOutput ? `${station.powerOutput} W` : '—')}
                {renderInfoRow('Loại anten', station.antennaType)}
                {renderInfoRow('Định dạng dữ liệu', station.dataFormat)}
                {renderInfoRow('Kênh truyền thông', station.communicationChannel)}
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
