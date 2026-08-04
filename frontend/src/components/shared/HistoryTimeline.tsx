import { Timeline, Empty, Spin, Alert, Button } from 'antd';
import dayjs from 'dayjs';

interface HistoryEntry {
  id?: string | number;
  // English (new)
  status?: string;
  approver?: string;
  approvalDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  approvalLevel?: number | string;
  reason?: string;
  changedField?: string;
  previousValue?: string;
  newValue?: string;
  // Vietnamese (old — for backward compatibility)
  trangThai?: string;
  nguoiPheDuyet?: string;
  ngayPheDuyet?: string;
  lyDo?: string;
  capPheDuyet?: number | string;
}

interface HistoryTimelineProps {
  history: HistoryEntry[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  PROPOSED: 'gray',
  UNDER_REVIEW: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  CREATED: 'blue',
  UPDATED: 'cyan',
  DELETED: 'gray',
  // Beacon action types
  CREATE: 'blue',
  UPDATE: 'cyan',
  APPROVE_L1: 'orange',
  APPROVE_L2: 'magenta',
  REJECT: 'red',
  SOFT_DELETE: 'gray',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  CREATED: 'Tạo mới',
  UPDATED: 'Cập nhật',
  APPROVED: 'Phê duyệt',
  REJECTED: 'Từ chối',
  DELETED: 'Xóa mềm',
  PROPOSED: 'Chờ duyệt',
  UNDER_REVIEW: 'Đang xem xét',
};

const FIELD_LABEL_MAP: Record<string, string> = {
  // Common / VTS
  systemName: 'Tên hệ thống',
  location: 'Vị trí',
  conditionStatus: 'Tình trạng',
  responsibilityLevel: 'Mức độ phụ trách',
  source: 'Nguồn gốc',
  partner: 'Đối tác',
  orgUnitId: 'Đơn vị quản lý',
  scope: 'Phạm vi áp dụng',
  approvalStatus: 'Trạng thái phê duyệt',
  operationalStatus: 'Trạng thái hoạt động',

  // ShipRepairFacility
  facilityName: 'Tên cơ sở sửa chữa',
  facilityType: 'Loại cơ sở',
  address: 'Địa chỉ',
  phone: 'Số điện thoại',
  email: 'Email',
  capacity: 'Công suất / Năng lực',
  authority: 'Cơ quan thẩm quyền',
  provinceId: 'Tỉnh / Thành phố',

  // RadarStation
  stationName: 'Tên trạm Radar',
  stationType: 'Loại trạm',
  coverage: 'Phạm vi phủ sóng',
  emissionArea: 'Khu vực phát sóng',
  towerHeight: 'Chiều cao tháp',
  radarRange: 'Tầm Radar',
  vtsSystemId: 'Hệ thống VTS',

  // NavigationChannel
  channelCode: 'Mã luồng',
  channelName: 'Tên luồng',
  maLuong: 'Mã luồng',
  tenLuong: 'Tên luồng',
  length: 'Chiều dài',
  width: 'Chiều rộng',
  depth: 'Độ sâu',
  channelType: 'Loại luồng',

  // DikeRevetment
  dikeCode: 'Mã đê kè',
  dikeName: 'Tên đê kè',
  maDeKe: 'Mã đê kè',
  tenDeKe: 'Tên đê kè',
  dikeType: 'Loại đê kè',
  elevation: 'Cao trình',

  // Port / Berth / Pier / DryPort
  portCode: 'Mã cảng biển',
  portName: 'Tên cảng biển',
  berthCode: 'Mã bến cảng',
  berthName: 'Tên bến cảng',
  pierCode: 'Mã cầu cảng',
  pierName: 'Tên cầu cảng',
  dryPortCode: 'Mã cảng cạn',
  dryPortName: 'Tên cảng cạn',
  waterZoneCode: 'Mã vùng nước',
  waterZoneName: 'Tên vùng nước',
  waterZoneType: 'Loại vùng nước',
  area: 'Diện tích',

  // Beacon / Buoy
  beaconCode: 'Mã báo hiệu',
  beaconName: 'Tên báo hiệu',
  buoyCode: 'Mã phao',
  buoyName: 'Tên phao',
  lightCharacteristic: 'Đặc tính ánh sáng',
  color: 'Màu sắc',
};

const translateFieldText = (text?: string): string => {
  if (!text) return '';
  let result = text;
  Object.entries(FIELD_LABEL_MAP).forEach(([enKey, vnLabel]) => {
    // Replace whole word occurrences or key= pattern
    const regex = new RegExp(`\\b${enKey}\\b`, 'g');
    result = result.replace(regex, vnLabel);
  });
  return result;
};

export default function HistoryTimeline({ history, loading, error, onRetry }: HistoryTimelineProps) {
  if (loading) {
    return <Spin description="Đang tải lịch sử..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Không tải được lịch sử"
        description={error}
        showIcon
        action={
          onRetry && <Button size="small" onClick={onRetry}>
            Thử lại
          </Button>
        }
      />
    );
  }

  if (!history || history.length === 0) {
    return <Empty description="Chưa có lịch sử phê duyệt" />;
  }

  const items = history.map((entry) => {
    const status = entry.status || entry.trangThai || '';
    const approver = entry.approver || entry.approvedBy || entry.nguoiPheDuyet || '';
    const date = entry.approvalDate || entry.approvedDate || entry.ngayPheDuyet;
    const reason = entry.reason || entry.lyDo || '';

    const statusColor = STATUS_COLOR_MAP[status] || 'gray';
    const formattedDate = date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'N/A';
    const displayStatus = STATUS_LABEL_MAP[status] || status;

    const translatedChangedField = translateFieldText(entry.changedField);
    const translatedPreviousValue = translateFieldText(entry.previousValue);
    const translatedNewValue = translateFieldText(entry.newValue);

    return {
      dot: <div style={{ width: '12px', height: '12px', backgroundColor: statusColor, borderRadius: '50%' }} />,
      children: (
        <>
          <p style={{ marginBottom: '4px', fontWeight: 500 }}>
            {displayStatus} — {approver} — {formattedDate}
          </p>
          {reason && <p style={{ marginBottom: 0, color: '#666' }}>{reason}</p>}
          {translatedChangedField && <p style={{ marginBottom: 0 }}>Trường thay đổi: {translatedChangedField}</p>}
          {(translatedPreviousValue || translatedNewValue) && (
            <p style={{ marginBottom: 0 }}>
              Trước: {translatedPreviousValue || '—'} → Sau: {translatedNewValue || '—'}
            </p>
          )}
        </>
      ),
    };
  });

  return <Timeline items={items} />;
}
