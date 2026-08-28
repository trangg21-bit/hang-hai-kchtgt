import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  Card,
  Spin,
  Empty,
  Space,
  Tabs,
  DatePicker,
  Table,
  Pagination,
  Row,
  Col,
  Upload,
  Modal,
  Tooltip,
  Drawer,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, InboxOutlined, FileOutlined, DownloadOutlined, CloseOutlined, EnvironmentOutlined } from '@ant-design/icons';
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
import { ApprovalStatus, ConditionStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import {
  drawerTitleStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle,
  dangerButtonStyle, outlineDangerButtonStyle, drawerTabBarStyle,
  requiredMarkStyle, spaceFormField, radiusSm, radiusMd, radiusLg, radiusPill, sidebarBg,
  fontWeightBold, fontWeightMedium, spaceMd, spaceSm, fontSizeMd, fontSizeSm, fontSizeLg,
  textSecondary, textTertiary, textPrimary, borderDefault, surfaceCard, uploadHintStyle,
  statusCritical, statusAttention, statusOperational, statusDraft, actionPrimary, textAreaStyle,
  readonlyInputStyle, colors, inputStyle, selectStyle, drawerCloseBtnStyle, statusBadgeStyle,
  renderPlanStatusBadge, renderSeverityBadge,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES, getProvinceNameById, getProvinceIdByName } from '../../types/common';
import { useAuthStore } from '../../store/authStore';
import { OrgUnitTreeSelect, normalizeSearchText } from '../../components/org-unit';
import DetailTable from '../../components/shared/DetailTable';

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

const ddToDms = (dd?: number) => {
  if (dd === undefined || dd === null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60 * 100) / 100;
  return { d, m, s };
};

const dmsToDd = (d: number, m: number, s: number) => {
  return d + m / 60 + s / 3600;
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

const MOCK_ZONES = [
  { code: 'VTS-Z01', name: 'Vùng đón trả hoa tiêu Cửa Nam Triệu', conditionStatus: ConditionStatus.OPERATIONAL, status: ConditionStatus.OPERATIONAL },
  { code: 'VTS-Z02', name: 'Vùng luồng hàng hải Lạch Huyện', conditionStatus: ConditionStatus.OPERATIONAL, status: ConditionStatus.OPERATIONAL },
  { code: 'VTS-Z03', name: 'Vùng neo đậu chuyển tải Hòn Gai - Quảng Ninh', conditionStatus: ConditionStatus.OPERATIONAL, status: ConditionStatus.OPERATIONAL },
  { code: 'VTS-Z04', name: 'Vùng phao số 0 Hải Phòng', conditionStatus: ConditionStatus.MAINTENANCE, status: ConditionStatus.MAINTENANCE },
  { code: 'VTS-Z05', name: 'Vùng quay trở tàu Cảng Đình Vũ', conditionStatus: ConditionStatus.OPERATIONAL, status: ConditionStatus.OPERATIONAL },
  { code: 'VTS-Z06', name: 'Vùng kiểm soát giao thông Bạch Đằng', conditionStatus: ConditionStatus.OPERATIONAL, status: ConditionStatus.OPERATIONAL },
  { code: 'VTS-Z07', name: 'Vùng neo đậu tránh bão Vịnh Lan Hạ - Cát Bà', conditionStatus: ConditionStatus.OPERATIONAL, status: ConditionStatus.OPERATIONAL },
  { code: 'VTS-Z08', name: 'Vùng luồng hàng hải Sông Cấm', conditionStatus: ConditionStatus.OPERATIONAL, status: ConditionStatus.OPERATIONAL },
  { code: 'VTS-Z09', name: 'Vùng kiểm soát an toàn Cảng Quốc tế Lạch Huyện', conditionStatus: ConditionStatus.OPERATIONAL, status: ConditionStatus.OPERATIONAL },
];

const MOCK_RELATED_KCHT = [
  { code: 'RAD-001', name: 'Trạm Radar Đình Vũ', type: 'Trạm Radar VTS', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'RAD-002', name: 'Trạm Radar Hòn Dấu', type: 'Trạm Radar VTS', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'RAD-003', name: 'Trạm Radar Cát Bà', type: 'Trạm Radar VTS', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'RAD-004', name: 'Trạm Radar Long Sơn', type: 'Trạm Radar VTS', orgUnitName: 'Cảng vụ Hàng hải Vũng Tàu', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'AIS-001', name: 'Trạm bờ AIS Nam Triệu', type: 'Trạm AIS bờ', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'AIS-002', name: 'Trạm bờ AIS Hòn Náu', type: 'Trạm AIS bờ', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'AIS-003', name: 'Trạm bờ AIS Cần Giờ', type: 'Trạm AIS bờ', orgUnitName: 'Cảng vụ Hàng hải TP.HCM', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'CCTV-001', name: 'Hệ thống Camera giám sát luồng Lạch Huyện', type: 'Hệ thống CCTV', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'CCTV-002', name: 'Hệ thống Camera giám sát luồng sông Cấm', type: 'Hệ thống CCTV', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'CCTV-003', name: 'Hệ thống Camera giám sát Cảng Cái Mép', type: 'Hệ thống CCTV', orgUnitName: 'Cảng vụ Hàng hải Vũng Tàu', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'VHF-001', name: 'Trạm thông tin vô tuyến VHF Hàng hải Đình Vũ', type: 'Trạm vô tuyến VHF', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'VHF-002', name: 'Trạm thông tin vô tuyến VHF Kênh 16 Hòn Dấu', type: 'Trạm vô tuyến VHF', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'BCC-001', name: 'Bến cano tuần tra kiểm soát VTS Hải Phòng', type: 'Bến công vụ', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'BCC-002', name: 'Bến công vụ tuần tra VTS Vũng Tàu', type: 'Bến công vụ', orgUnitName: 'Cảng vụ Hàng hải Vũng Tàu', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'MET-001', name: 'Trạm đo khí tượng thủy văn Cửa Nam Triệu', type: 'Trạm khí tượng', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
  { code: 'MET-002', name: 'Trạm đo mực nước và hải lưu Lạch Huyện', type: 'Trạm hải văn', orgUnitName: 'Cảng vụ Hàng hải Hải Phòng', conditionStatus: ConditionStatus.OPERATIONAL },
];

const MOCK_OPERATION_PLANS = [
  { planCode: 'KHVH-2026-01', planName: 'Kế hoạch trực ban giám sát luồng 24/7 Quý I/2026', startDate: '2026-01-01', endDate: '2026-03-31', orgName: 'Trung tâm điều hành VTS Hải Phòng', status: 'Đang thực hiện' },
  { planCode: 'KHVH-2026-02', planName: 'Kế hoạch điều tiết luồng tàu trọng tải lớn Lạch Huyện', startDate: '2026-02-15', endDate: '2026-02-28', orgName: 'Phòng Quản lý tàu thuyền', status: 'Hoàn thành' },
  { planCode: 'KHVH-2026-03', planName: 'Kế hoạch kiểm tra định kỳ hệ thống radar và cảm biến', startDate: '2026-03-01', endDate: '2026-03-15', orgName: 'Đội Kỹ thuật VTS', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-04', planName: 'Kế hoạch diễn tập ứng phó sự cố mất điện lưới VTS', startDate: '2026-04-10', endDate: '2026-04-12', orgName: 'Tổ Kỹ thuật & Cảng vụ', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-05', planName: 'Kế hoạch phối hợp tuần tra cứu nạn Cửa Nam Triệu', startDate: '2026-05-01', endDate: '2026-05-31', orgName: 'Trung tâm VTS & Hải đội 1', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-06', planName: 'Kế hoạch kiểm soát mật độ tàu thuyền mùa cao điểm', startDate: '2026-06-01', endDate: '2026-06-30', orgName: 'Phòng Pháp chế & VTS', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-07', planName: 'Kế hoạch nâng cấp phần mềm điều phối tàu thuyền tự động', startDate: '2026-06-15', endDate: '2026-07-30', orgName: 'Phòng CNTT Cục Hàng hải', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-08', planName: 'Kế hoạch phối hợp điều động tàu quân sự qua luồng dân sự', startDate: '2026-08-05', endDate: '2026-08-10', orgName: 'Trung tâm điều hành VTS', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-09', planName: 'Kế hoạch giám sát luồng phục vụ thi công nạo vét', startDate: '2026-09-01', endDate: '2026-11-30', orgName: 'Ban Quản lý Dự án Hàng hải', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-10', planName: 'Kế hoạch bảo đảm an toàn hàng hải mùa bão lũ 2026', startDate: '2026-09-15', endDate: '2026-10-15', orgName: 'Cảng vụ Hàng hải Hải Phòng', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-11', planName: 'Kế hoạch kiểm tra định kỳ chứng chỉ trực ban VTS', startDate: '2026-10-01', endDate: '2026-10-15', orgName: 'Phòng Tổ chức Cán bộ', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-12', planName: 'Kế hoạch tổ chức hội nghị an toàn hàng hải phía Bắc', startDate: '2026-10-20', endDate: '2026-10-22', orgName: 'Văn phòng Cảng vụ', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-13', planName: 'Kế hoạch bảo dưỡng hệ thống máy phát dự phòng', startDate: '2026-11-01', endDate: '2026-11-05', orgName: 'Đội Cơ điện VTS', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-14', planName: 'Kế hoạch tổng kết công tác điều phối giao thông 2026', startDate: '2026-12-15', endDate: '2026-12-20', orgName: 'Ban Lãnh đạo Cảng vụ', status: 'Chưa thực hiện' },
  { planCode: 'KHVH-2026-15', planName: 'Kế hoạch trực ban cao điểm Tết Dương lịch 2027', startDate: '2026-12-25', endDate: '2027-01-05', orgName: 'Toàn thể cán bộ VTS', status: 'Chưa thực hiện' },
];

const MOCK_MAINTENANCE_PLANS = [
  { maintCode: 'BT-2026-01', maintName: 'Bảo dưỡng định kỳ hệ thống ăng-ten Radar và khối thu phát', startDate: '2026-01-10', endDate: '2026-01-15', orgName: 'Công ty CP Thiết bị Hàng hải', estimatedCost: 150000000, status: 'Hoàn thành' },
  { maintCode: 'BT-2026-02', maintName: 'Thay thế nguồn UPS dự phòng trung tâm VTS', startDate: '2026-03-05', endDate: '2026-03-08', orgName: 'Công ty Điện tử Viễn thông Hàng hải', estimatedCost: 85000000, status: 'Đang thực hiện' },
  { maintCode: 'BT-2026-03', maintName: 'Hiệu chuẩn góc quét và căn chỉnh tần số Radar trạm Hòn Dấu', startDate: '2026-05-20', endDate: '2026-05-22', orgName: 'Viện Khoa học Công nghệ GTVT', estimatedCost: 60000000, status: 'Chưa thực hiện' },
  { maintCode: 'BT-2026-04', maintName: 'Bảo trì hệ thống máy chủ xử lý dữ liệu trung tâm VTS', startDate: '2026-07-15', endDate: '2026-07-18', orgName: 'Đội CNTT & Kỹ thuật VTS', estimatedCost: 45000000, status: 'Chưa thực hiện' },
  { maintCode: 'BT-2026-05', maintName: 'Kiểm định chất lượng chống sét và tiếp địa trạm VTS', startDate: '2026-09-10', endDate: '2026-09-12', orgName: 'Trung tâm Đo lường Chất lượng', estimatedCost: 35000000, status: 'Chưa thực hiện' },
  { maintCode: 'BT-2026-06', maintName: 'Sơn chống ăn mòn và gia cố tháp Radar Đình Vũ', startDate: '2026-10-01', endDate: '2026-10-10', orgName: 'Công ty Xây lắp Hàng hải', estimatedCost: 120000000, status: 'Chưa thực hiện' },
  { maintCode: 'BT-2026-07', maintName: 'Bảo dưỡng định kỳ điều hòa phòng máy chủ', startDate: '2026-10-15', endDate: '2026-10-17', orgName: 'Công ty Cơ điện Lạnh Hải Phòng', estimatedCost: 25000000, status: 'Chưa thực hiện' },
  { maintCode: 'BT-2026-08', maintName: 'Nâng cấp dung lượng ổ cứng lưu trữ lịch sử Radar', startDate: '2026-11-01', endDate: '2026-11-03', orgName: 'Công ty Giải pháp Số Hàng hải', estimatedCost: 70000000, status: 'Chưa thực hiện' },
  { maintCode: 'BT-2026-09', maintName: 'Kiểm tra bảo dưỡng ăng-ten VHF và cáp đồng trục', startDate: '2026-11-10', endDate: '2026-11-12', orgName: 'Trung tâm Viễn thông Hàng hải', estimatedCost: 30000000, status: 'Chưa thực hiện' },
  { maintCode: 'BT-2026-10', maintName: 'Thay thế bóng phát Magnetron Radar trạm Hòn Dấu', startDate: '2026-11-20', endDate: '2026-11-22', orgName: 'Nhà cung cấp Furuno', estimatedCost: 180000000, status: 'Chưa thực hiện' },
  { maintCode: 'BT-2026-11', maintName: 'Bảo dưỡng cano công vụ kiểm soát giao thông', startDate: '2026-12-01', endDate: '2026-12-05', orgName: 'Xưởng sửa chữa tàu thuyền Cảng vụ', estimatedCost: 55000000, status: 'Chưa thực hiện' },
  { maintCode: 'BT-2026-12', maintName: 'Kiểm định thiết bị nâng hạ cầu thang tháp VTS', startDate: '2026-12-10', endDate: '2026-12-12', orgName: 'Viện An toàn Lao động', estimatedCost: 18000000, status: 'Chưa thực hiện' },
  { maintCode: 'BT-2026-13', maintName: 'Vệ sinh công nghiệp và thay lọc máy phát', startDate: '2026-12-20', endDate: '2026-12-21', orgName: 'Đội Vận hành Cơ điện', estimatedCost: 15000000, status: 'Chưa thực hiện' },
  { maintCode: 'BT-2026-14', maintName: 'Kiểm tra toàn diện an ninh mạng tường lửa VTS', startDate: '2026-12-25', endDate: '2026-12-28', orgName: 'Trung tâm An ninh mạng Quốc gia', estimatedCost: 95000000, status: 'Chưa thực hiện' },
];

const MOCK_INCIDENTS = [
  { incidentCode: 'SC-2026-001', incidentType: 'Sự cố truyền dẫn', location: 'Trạm Radar Hòn Dấu', incidentTime: '2026-02-12 08:30', severity: 'Trung bình', handleStatus: 'Đã xử lý' },
  { incidentCode: 'SC-2026-002', incidentType: 'Sự cố phần cứng', location: 'Trạm Radar Đình Vũ', incidentTime: '2026-01-24 14:15', severity: 'Nhẹ', handleStatus: 'Đã khắc phục' },
  { incidentCode: 'SC-2026-003', incidentType: 'Sự cố phần mềm', location: 'Trung tâm VTS Cửa Nam Triệu', incidentTime: '2026-03-18 19:40', severity: 'Nhẹ', handleStatus: 'Đã xử lý' },
  { incidentCode: 'SC-2026-004', incidentType: 'Sự cố nguồn điện', location: 'Trạm AIS Nam Triệu', incidentTime: '2026-04-05 02:10', severity: 'Nghiêm trọng', handleStatus: 'Đang xử lý' },
  { incidentCode: 'SC-2026-005', incidentType: 'Sự cố thiết bị phụ trợ', location: 'Trạm Camera Lạch Huyện', incidentTime: '2026-04-20 06:15', severity: 'Nhẹ', handleStatus: 'Đã xử lý' },
  { incidentCode: 'SC-2026-006', incidentType: 'Sự cố thông tin liên lạc', location: 'Trạm VHF Đình Vũ', incidentTime: '2026-05-02 11:30', severity: 'Trung bình', handleStatus: 'Đang xử lý' },
  { incidentCode: 'SC-2026-007', incidentType: 'Sự cố cảm biến', location: 'Trạm Khí tượng Cửa Cấm', incidentTime: '2026-05-15 16:45', severity: 'Nhẹ', handleStatus: 'Đã khắc phục' },
  { incidentCode: 'SC-2026-008', incidentType: 'Sự cố hệ thống CNTT', location: 'Trung tâm dữ liệu Hải Phòng', incidentTime: '2026-06-01 09:20', severity: 'Trung bình', handleStatus: 'Đã xử lý' },
  { incidentCode: 'SC-2026-009', incidentType: 'Sự cố đường dây', location: 'Cầu cảng Đình Vũ', incidentTime: '2026-06-18 15:10', severity: 'Nhẹ', handleStatus: 'Đã khắc phục' },
  { incidentCode: 'SC-2026-010', incidentType: 'Sự cố thiên tai', location: 'Trạm Cát Bà', incidentTime: '2026-07-08 22:30', severity: 'Nghiêm trọng', handleStatus: 'Đang xử lý' },
  { incidentCode: 'SC-2026-011', incidentType: 'Sự cố va chạm', location: 'Tháp VTS Nam Triệu', incidentTime: '2026-07-25 04:50', severity: 'Nhẹ', handleStatus: 'Chờ xử lý' },
  { incidentCode: 'SC-2026-012', incidentType: 'Sự cố phần mềm', location: 'Bàn trực ban VTS số 2', incidentTime: '2026-08-10 13:00', severity: 'Nhẹ', handleStatus: 'Chưa xử lý' },
];

const MOCK_ATTACHMENTS = [
  { id: 'att-1', fileName: 'Quyet_dinh_thanh_lap_he_thong_VTS_Hai_Phong.pdf', fileSize: 2457600, uploadedByName: 'Nguyễn Văn An', uploadedDate: '2026-08-25 10:20' },
  { id: 'att-2', fileName: 'So_do_vung_phu_song_radar_VTS_Cua_Nam_Trieu.dwg', fileSize: 5939200, uploadedByName: 'Trần Quốc Tuấn', uploadedDate: '2026-08-25 11:15' },
  { id: 'att-3', fileName: 'Bien_ban_nghiem_thu_he_thong_ky_thuat_VTS.docx', fileSize: 1126400, uploadedByName: 'Lê Thị Mai', uploadedDate: '2026-08-26 09:30' },
  { id: 'att-4', fileName: 'Thong_bao_hang_hai_so_142_TBHH_CVHHHP.pdf', fileSize: 870400, uploadedByName: 'Nguyễn Văn An', uploadedDate: '2026-08-26 14:00' },
  { id: 'att-5', fileName: 'Quy_trinh_van_hanh_giam_sat_luong_tau_thuyen.pdf', fileSize: 3276800, uploadedByName: 'Nguyễn Văn An', uploadedDate: '2026-08-26 15:30' },
  { id: 'att-6', fileName: 'So_do_kien_truc_mang_truyen_dan_VTS_mien_Bac.vsdx', fileSize: 4608000, uploadedByName: 'Trần Quốc Tuấn', uploadedDate: '2026-08-26 16:10' },
  { id: 'att-7', fileName: 'Giay_phep_su_dung_tan_so_vo_tuyen_dien_VTS.pdf', fileSize: 1843200, uploadedByName: 'Lê Thị Mai', uploadedDate: '2026-08-26 16:45' },
  { id: 'att-8', fileName: 'Hop_dong_bao_tri_he_thong_radar_nam_2026.pdf', fileSize: 2969600, uploadedByName: 'Nguyễn Văn An', uploadedDate: '2026-08-27 08:30' },
  { id: 'att-9', fileName: 'Ket_qua_kiem_dinh_chong_set_tiep_dia_2026.pdf', fileSize: 1003520, uploadedByName: 'Trần Quốc Tuấn', uploadedDate: '2026-08-27 09:15' },
  { id: 'att-10', fileName: 'Ke_hoach_ung_pho_su_co_an_ninh_mang_VTS.docx', fileSize: 1433600, uploadedByName: 'Lê Thị Mai', uploadedDate: '2026-08-27 10:00' },
  { id: 'att-11', fileName: 'Danh_sach_nhan_su_truc_ban_VTS_2026.xlsx', fileSize: 634880, uploadedByName: 'Nguyễn Văn An', uploadedDate: '2026-08-27 10:45' },
  { id: 'att-12', fileName: 'Bao_cao_danh_gia_hieu_qua_dieu_tiet_luong.pdf', fileSize: 4198400, uploadedByName: 'Trần Quốc Tuấn', uploadedDate: '2026-08-27 11:30' },
];

const MOCK_GPS_POINTS = [
  { id: 'gps-1', lat: 20.865139, lng: 106.683833, latD: 20, latM: 51, latS: 54.5, lngD: 106, lngM: 41, lngS: 1.8 },
  { id: 'gps-2', lat: 20.812500, lng: 106.721400, latD: 20, latM: 48, latS: 45.0, lngD: 106, lngM: 43, lngS: 17.0 },
  { id: 'gps-3', lat: 20.789100, lng: 106.754200, latD: 20, latM: 47, latS: 20.8, lngD: 106, lngM: 45, lngS: 15.1 },
  { id: 'gps-4', lat: 20.843200, lng: 106.698000, latD: 20, latM: 50, latS: 35.5, lngD: 106, lngM: 41, lngS: 52.8 },
  { id: 'gps-5', lat: 20.875400, lng: 106.654100, latD: 20, latM: 52, latS: 31.4, lngD: 106, lngM: 39, lngS: 14.8 },
  { id: 'gps-6', lat: 20.824100, lng: 106.789200, latD: 20, latM: 49, latS: 26.8, lngD: 106, lngM: 47, lngS: 21.1 },
  { id: 'gps-7', lat: 20.765400, lng: 106.812500, latD: 20, latM: 45, latS: 55.4, lngD: 106, lngM: 48, lngS: 45.0 },
  { id: 'gps-8', lat: 20.891200, lng: 106.632100, latD: 20, latM: 53, latS: 28.3, lngD: 106, lngM: 37, lngS: 55.6 },
  { id: 'gps-9', lat: 20.835600, lng: 106.741200, latD: 20, latM: 50, latS: 8.2, lngD: 106, lngM: 44, lngS: 28.3 },
  { id: 'gps-10', lat: 20.798400, lng: 106.776500, latD: 20, latM: 47, latS: 54.2, lngD: 106, lngM: 46, lngS: 35.4 },
  { id: 'gps-11', lat: 20.856700, lng: 106.678900, latD: 20, latM: 51, latS: 24.1, lngD: 106, lngM: 40, lngS: 44.0 },
  { id: 'gps-12', lat: 20.801200, lng: 106.734500, latD: 20, latM: 48, latS: 4.3, lngD: 106, lngM: 44, lngS: 4.2 },
  { id: 'gps-13', lat: 20.772300, lng: 106.823400, latD: 20, latM: 46, latS: 20.3, lngD: 106, lngM: 49, lngS: 24.2 },
  { id: 'gps-14', lat: 20.884500, lng: 106.643200, latD: 20, latM: 53, latS: 4.2, lngD: 106, lngM: 38, lngS: 35.5 },
  { id: 'gps-15', lat: 20.819800, lng: 106.765400, latD: 20, latM: 49, latS: 11.3, lngD: 106, lngM: 45, lngS: 55.4 },
];

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
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const userPermissions = (currentUser?.permissions as string[]) || [];

  const [form] = Form.useForm();
  const [record, setRecord] = useState<VtsSystemResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabKey, setTabKey] = useState<string>('general');
  const [detailTabKey, setDetailTabKey] = useState<string>('general');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('draft');

  const [organizations, setOrganizations] = useState<any[]>(propOrgUnits || []);
  const [operatingOrganizations, setOperatingOrganizations] = useState<any[]>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [rawPorts, setRawPorts] = useState<any[]>([]);
  const [zoneList, setZoneList] = useState<any[]>(MOCK_ZONES);
  const [zonePage, setZonePage] = useState(1);
  const [attachmentList, setAttachmentList] = useState<any[]>(MOCK_ATTACHMENTS);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [filePage, setFilePage] = useState(1);

  // Detail tabs pagination states
  const [detailZonePage, setDetailZonePage] = useState(1);
  const [detailRelatedPage, setDetailRelatedPage] = useState(1);
  const [detailOpPage, setDetailOpPage] = useState(1);
  const [detailMaintPage, setDetailMaintPage] = useState(1);
  const [detailIncPage, setDetailIncPage] = useState(1);
  const [detailGpsPage, setDetailGpsPage] = useState(1);
  const [detailFilesPage, setDetailFilesPage] = useState(1);

  // GIS coordinates state
  interface GpsPoint {
    id: string;
    lat?: number;
    lng?: number;
    latD?: number;
    latM?: number;
    latS?: number;
    lngD?: number;
    lngM?: number;
    lngS?: number;
  }
  const [gpsCoordList, setGpsCoordList] = useState<GpsPoint[]>(MOCK_GPS_POINTS);
  const [gpsPage, setGpsPage] = useState(1);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [approvalSectionOpen, setApprovalSectionOpen] = useState(true);

  const addGpsPoint = () => {
    setGpsCoordList((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), latD: undefined, latM: undefined, latS: undefined, lngD: undefined, lngM: undefined, lngS: undefined },
    ]);
  };

  const removeGpsPoint = (idx: number) => {
    setGpsCoordList((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateGpsField = (idx: number, field: keyof GpsPoint, val?: number | null) => {
    setGpsCoordList((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: val ?? undefined } : item));
  };

  const currentGisWkt = useMemo(() => {
    if (gpsCoordList && gpsCoordList.length > 0) {
      const pt = gpsCoordList[0];
      let lat = pt.lat;
      let lng = pt.lng;
      if (pt.latD !== undefined && pt.lngD !== undefined) {
        lat = dmsToDd(pt.latD, pt.latM, pt.latS);
        lng = dmsToDd(pt.lngD, pt.lngM, pt.lngS);
      }
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        return `POINT(${lng} ${lat})`;
      }
    }
    return undefined;
  }, [gpsCoordList]);

  const handleUploadAttachment = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File vượt quá 20MB');
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
      toast.error('Định dạng không hỗ trợ (chỉ chấp nhận PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF)');
      return false;
    }
    const newAttachment = {
      id: `temp-${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      uploadedByName: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
      uploadedDate: new Date().toISOString(),
    };
    setAttachmentList((prev) => [newAttachment, ...prev]);
    setPendingFiles((prev) => [...prev, file]);
    toast.success(`Đã thêm tệp ${file.name}`);
    return false;
  };

  const handleDeleteAttachment = (attId: string) => {
    setAttachmentList((prev) => prev.filter((a) => a.id !== attId));
    setPendingFiles((prev) => prev.filter((_, idx) => `temp-${idx}` !== attId));
    toast.success('Đã xóa tệp đính kèm');
  };

  const handleDownloadAttachment = (att: any) => {
    toast.info(`Đang tải xuống tệp: ${att.fileName}`);
  };

  // Approval Modals
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isCreateMode = propMode === 'create';
  const isEditMode = propMode === 'edit';
  const isDetailMode = propMode === 'detail';

  const canSaveAndApprove = userPermissions.includes('vts:approvec2');
  const attachmentsEditable = isCreateMode || record?.approvalStatus === ApprovalStatus.DRAFT || record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record?.approvalStatus === ApprovalStatus.REJECTED_LEVEL2;

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

  // Load record detail
  useEffect(() => {
    if (!editId || initialDataOnly) {
      if (initialData) {
        setRecord(initialData);
        populateForm(initialData);
      }
      return;
    }

    let mounted = true;
    setIsLoading(true);
    vtsSystemCRUD.getById(editId)
      .then((data) => {
        if (!mounted) return;
        setRecord(data);
        populateForm(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setFormError(err instanceof Error ? err.message : 'Không tải được dữ liệu chi tiết');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
  }, [editId, initialData, initialDataOnly]);

  const populateForm = (data: VtsSystemResponse) => {
    form.setFieldsValue({
      orgUnitId: data.orgUnitId,
      owningOrgId: data.owningOrgId || data.orgUnitId,
      operatingOrgId: data.operatingOrgId,
      portId: data.portId,
      code: data.code,
      systemName: data.systemName,
      province: data.province,
      provinceId: data.provinceId,
      address: data.address,
      operationStartDate: data.operationStartDate ? dayjs(data.operationStartDate) : undefined,
      scope: data.scope,
      maritimeNotice: data.maritimeNotice,
      conditionStatus: data.conditionStatus || ConditionStatus.OPERATIONAL,
      note: data.note,
    });
    const rawZones = (data.zones && data.zones.length > 0) ? data.zones : MOCK_ZONES;
    setZoneList(
      rawZones.map((z: any, idx: number) => ({
        ...z,
        code: z.code || `VTS-Z0${idx + 1}`,
        name: z.name || '',
        conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
        status: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
      }))
    );
    const rawAttachments = (data.attachments && data.attachments.length > 0) ? data.attachments : MOCK_ATTACHMENTS;
    setAttachmentList(rawAttachments);
    setGpsCoordList(MOCK_GPS_POINTS);
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
        province: values.province,
        provinceId: values.provinceId || (values.province ? getProvinceIdByName(values.province) : 1),
        address: values.address,
        operationStartDate: values.operationStartDate ? dayjs(values.operationStartDate).format('YYYY-MM-DD') : undefined,
        scope: values.scope,
        maritimeNotice: values.maritimeNotice,
        conditionStatus: values.conditionStatus,
        note: values.note,
        zones: zoneList.map((z: any) => ({
          code: z.code,
          name: z.name,
          conditionStatus: z.conditionStatus || z.status || ConditionStatus.OPERATIONAL,
        })),
      };

      if (isCreateMode) {
        const created = await vtsSystemCRUD.create(payload);
        if (actionTypeRef.current === 'submit' && created?.id) {
          await vtsSystemApproval.submit(created.id);
        } else if (actionTypeRef.current === 'approve' && created?.id) {
          await vtsSystemApproval.approveC2(created.id, { decision: 'APPROVED', reason: 'Lưu và duyệt trực tiếp' });
        }
        toast.success('Thêm mới thành công');
        onSuccess?.();
      } else if (editId) {
        await vtsSystemCRUD.update(editId, payload as UpdateVtsSystemRequest);
        toast.success('Cập nhật thành công');
        onSuccess?.();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalAction = async (action: 'approveC1' | 'approveC2' | 'reject' | 'delete', reasonStr?: string) => {
    if (!editId || !record) return;
    setIsSubmitting(true);
    try {
      if (action === 'approveC1') {
        await vtsSystemApproval.approveC1(editId, { decision: 'APPROVED', reason: reasonStr || 'Đã phê duyệt cấp 1' });
        toast.success('Phê duyệt cấp Cảng vụ thành công');
        onSuccess?.();
      } else if (action === 'approveC2') {
        await vtsSystemApproval.approveC2(editId, { decision: 'APPROVED', reason: reasonStr || 'Đã phê duyệt cấp 2' });
        toast.success('Phê duyệt cấp Cục thành công');
        onSuccess?.();
      } else if (action === 'reject') {
        const approvalReq: ApprovalRequest = { decision: 'REJECTED', reason: reasonStr || 'Từ chối phê duyệt' };
        if (record.approvalStatus === ApprovalStatus.PENDING_APPROVAL) {
          await vtsSystemApproval.approveC1(editId, approvalReq);
        } else {
          await vtsSystemApproval.approveC2(editId, approvalReq);
        }
        toast.success('Từ chối phê duyệt thành công');
        onSuccess?.();
      } else if (action === 'delete') {
        await vtsSystemCRUD.delete(editId);
        toast.success('Xóa thành công');
        onSuccess?.();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render Detail Mode Content ───────────────────────────────────
  const renderDetailContent = () => {
    if (!record) return null;

    const displayZones = (zoneList && zoneList.length > 0) ? zoneList : MOCK_ZONES;
    const displayRelatedKcht = ((record as any)?.relatedKchtList && (record as any)?.relatedKchtList.length > 0) ? (record as any)?.relatedKchtList : MOCK_RELATED_KCHT;
    const displayOperation = ((record as any)?.operationPlanList && (record as any)?.operationPlanList.length > 0) ? (record as any)?.operationPlanList : MOCK_OPERATION_PLANS;
    const displayMaintenance = ((record as any)?.maintenancePlanList && (record as any)?.maintenancePlanList.length > 0) ? (record as any)?.maintenancePlanList : MOCK_MAINTENANCE_PLANS;
    const displayIncident = ((record as any)?.incidentList && (record as any)?.incidentList.length > 0) ? (record as any)?.incidentList : MOCK_INCIDENTS;
    const displayGps = (gpsCoordList && gpsCoordList.length > 0) ? gpsCoordList : MOCK_GPS_POINTS;
    const displayAttachments = (attachmentList && attachmentList.length > 0) ? attachmentList : MOCK_ATTACHMENTS;

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
                <div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row"><span className="chk-detail-label">Mã hệ thống VTS</span><span className="chk-detail-value">{record.code || '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Tên hệ thống VTS</span><span className="chk-detail-value">{record.systemName || '—'}</span></div>
                    
                    <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị quản lý</span><span className="chk-detail-value">{record.orgUnitName || '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Thuộc cảng biển</span><span className="chk-detail-value">{record.portName || '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị chủ quản</span><span className="chk-detail-value">{record.owningOrgName || '—'}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị vận hành</span><span className="chk-detail-value">{record.operatingOrgName || '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm Tỉnh/TP</span><span className="chk-detail-value">{record.province || (record.provinceId ? getProvinceNameById(record.provinceId) : '—')}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Địa điểm chi tiết</span><span className="chk-detail-value">{record.address || '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Tình trạng</span><span className="chk-detail-value">{renderConditionStatusBadge(record.conditionStatus)}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Thời gian bắt đầu hoạt động</span><span className="chk-detail-value">{record.operationStartDate ? dayjs(record.operationStartDate).format('DD/MM/YYYY') : '—'}</span></div>

                    <div className="chk-detail-row"><span className="chk-detail-label">Ngày cập nhật</span><span className="chk-detail-value">{record.updatedAt ? dayjs(record.updatedAt).format('DD/MM/YYYY HH:mm:ss') : (record.createdAt ? dayjs(record.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—')}</span></div>
                    <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ cập nhật</span><span className="chk-detail-value">{record.updatedByName || record.createdByName || record.updatedBy || record.createdBy || '—'}</span></div>

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
                      <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ gửi duyệt</span><span className="chk-detail-value">{record.submittedByName || record.submittedBy || '—'}</span></div>

                      <div className="chk-detail-row"><span className="chk-detail-label">Ngày phê duyệt Cảng vụ</span><span className="chk-detail-value">{record.approvedDateLevel1 ? dayjs(record.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ phê duyệt Cảng vụ</span><span className="chk-detail-value">{record.approverLevel1Name || record.approverLevel1 || '—'}</span></div>

                      <div className="chk-detail-row"><span className="chk-detail-label">Nội dung Cảng vụ/Chi cục phê duyệt</span><span className="chk-detail-value">{record.approvalReasonLevel1 || record.rejectionReasonLevel1 || '—'}</span></div>
                      <div style={{ border: 'none' }} />

                      <div className="chk-detail-row"><span className="chk-detail-label">Ngày phê duyệt Cục</span><span className="chk-detail-value">{record.approvedDateLevel2 ? dayjs(record.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div>
                      <div className="chk-detail-row"><span className="chk-detail-label">Cán bộ phê duyệt Cục</span><span className="chk-detail-value">{record.approverLevel2Name || record.approverLevel2 || '—'}</span></div>

                      <div className="chk-detail-row"><span className="chk-detail-label">Nội dung Cục phê duyệt</span><span className="chk-detail-value">{record.approvalReasonLevel2 || record.rejectionReasonLevel2 || '—'}</span></div>
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
              label: `Danh sách vùng VTS (${displayZones.length})`,
              children: (
                <DetailTable
                  dataSource={displayZones}
                  emptyText="Chưa có dữ liệu vùng VTS"
                  rowKey={(r) => r.id || r.code || r.name}
                  columns={[
                    { title: 'STT', width: 50 },
                    { title: 'Mã vùng', dataIndex: 'code', key: 'code', width: 110, render: (v) => v || '—' },
                    {
                      title: 'Tên vùng VTS',
                      dataIndex: 'name',
                      key: 'name',
                      render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span>,
                    },
                    {
                      title: 'Tình trạng',
                      key: 'conditionStatus',
                      width: 130,
                      render: (_v, r: any) => renderConditionStatusBadge(r.conditionStatus || r.status || ConditionStatus.OPERATIONAL),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'relatedKcht',
              label: `Danh sách kết cấu hạ tầng khác thuộc hệ thống VTS (${displayRelatedKcht.length})`,
              children: (
                <DetailTable
                  dataSource={displayRelatedKcht}
                  emptyText="Chưa có kết cấu hạ tầng liên quan"
                  rowKey={(r) => r.id || r.code || r.name}
                  columns={[
                    { title: 'STT', width: 50 },
                    { title: 'Mã KCHT', dataIndex: 'code', key: 'code', width: 110, render: (v) => v || '—' },
                    {
                      title: 'Tên KCHT',
                      dataIndex: 'name',
                      key: 'name',
                      render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span>,
                    },
                    { title: 'Loại KCHT', dataIndex: 'type', key: 'type', width: 140, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                    { title: 'Đơn vị quản lý', dataIndex: 'orgUnitName', key: 'orgUnitName', width: 200, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                    {
                      title: 'Tình trạng',
                      key: 'conditionStatus',
                      width: 160,
                      render: (_v, r: any) => renderConditionStatusBadge(r.conditionStatus || ConditionStatus.OPERATIONAL),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'operation',
              label: `Thông tin vận hành khai thác (${displayOperation.length})`,
              children: (
                <DetailTable
                  dataSource={displayOperation}
                  emptyText="Chưa có thông tin vận hành khai thác"
                  rowKey={(r) => r.id || r.planCode || r.planName}
                  columns={[
                    { title: 'STT', width: 50 },
                    {
                      title: 'Mã kế hoạch',
                      dataIndex: 'planCode',
                      key: 'planCode',
                      width: 120,
                      render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span>,
                    },
                    {
                      title: 'Tên kế hoạch',
                      dataIndex: 'planName',
                      key: 'planName',
                      render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span>,
                    },
                    { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'startDate', width: 110, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
                    { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate', width: 110, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
                    { title: 'Đơn vị thực hiện', dataIndex: 'orgName', key: 'orgName', width: 180, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 160, render: (v) => renderPlanStatusBadge(v) },
                  ]}
                />
              ),
            },
            {
              key: 'maintenance',
              label: `Thông tin bảo trì (${displayMaintenance.length})`,
              children: (
                <DetailTable
                  dataSource={displayMaintenance}
                  emptyText="Chưa có thông tin bảo trì"
                  rowKey={(r) => r.id || r.maintCode || r.maintName}
                  columns={[
                    { title: 'STT', width: 50 },
                    {
                      title: 'Mã kế hoạch',
                      dataIndex: 'maintCode',
                      key: 'maintCode',
                      width: 120,
                      render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span>,
                    },
                    {
                      title: 'Tên hạng mục',
                      dataIndex: 'maintName',
                      key: 'maintName',
                      render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span>,
                    },
                    { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'startDate', width: 110, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
                    { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate', width: 110, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
                    { title: 'Đơn vị thực hiện', dataIndex: 'orgName', key: 'orgName', width: 180, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                    { title: 'Chi phí dự kiến (VNĐ)', dataIndex: 'estimatedCost', key: 'estimatedCost', width: 170, align: 'right', render: (v) => v ? Number(v).toLocaleString('vi-VN') : '—' },
                    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 160, render: (v) => renderPlanStatusBadge(v) },
                  ]}
                />
              ),
            },
            {
              key: 'incident',
              label: `Thông tin sự cố (${displayIncident.length})`,
              children: (
                <DetailTable
                  dataSource={displayIncident}
                  emptyText="Chưa có thông tin sự cố"
                  rowKey={(r) => r.id || r.incidentCode || r.incidentType}
                  columns={[
                    { title: 'STT', width: 50 },
                    {
                      title: 'Mã sự cố',
                      dataIndex: 'incidentCode',
                      key: 'incidentCode',
                      width: 120,
                      render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span>,
                    },
                    { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'incidentType', width: 170, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                    { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                    { title: 'Thời gian xảy ra', dataIndex: 'incidentTime', key: 'incidentTime', width: 150, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—' },
                    { title: 'Mức độ', dataIndex: 'severity', key: 'severity', width: 150, render: (v) => renderSeverityBadge(v) },
                    {
                      title: 'Tình trạng xử lý',
                      dataIndex: 'handleStatus',
                      key: 'handleStatus',
                      width: 160,
                      render: (v) => renderPlanStatusBadge(v),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'gis',
              label: `Thông tin vị trí (${displayGps.length})`,
              children: (
                <DetailTable
                  dataSource={displayGps}
                  emptyText="Chưa có tọa độ GPS nào"
                  headerNode={
                    <>
                      <div className="chk-detail-grid" style={{ marginBottom: 16 }}>
                        <div className="chk-detail-row"><span className="chk-detail-label">Loại đối tượng</span><span className="chk-detail-value">Đối tượng điểm</span></div>
                        <div className="chk-detail-row"><span className="chk-detail-label">Biểu tượng bản đồ</span><span className="chk-detail-value">Trạm VTS chính (VTS-SYM-01)</span></div>
                        <div className="chk-detail-row"><span className="chk-detail-label">Hệ quy chiếu</span><span className="chk-detail-value">WGS-84 (Toàn cầu)</span></div>
                        <div className="chk-detail-row"><span className="chk-detail-label">Quy tắc hiển thị</span><span className="chk-detail-value">Hiển thị theo phạm vi hoạt động</span></div>
                      </div>
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                        <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>
                          Tọa độ GPS ({displayGps.length})
                        </span>
                        <Button
                          icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                          onClick={() => setGisModalOpen(true)}
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
                      render: (_v, r) => {
                        if (r.latD !== undefined) {
                          return `${r.latD || 0}° ${r.latM || 0}' ${r.latS || 0}" N`;
                        }
                        const dms = ddToDms(r.lat);
                        return `${dms.d}° ${dms.m}' ${dms.s}" N`;
                      },
                    },
                    {
                      title: 'Kinh độ (Longitude - E)',
                      key: 'lng',
                      render: (_v, r) => {
                        if (r.lngD !== undefined) {
                          return `${r.lngD || 0}° ${r.lngM || 0}' ${r.lngS || 0}" E`;
                        }
                        const dms = ddToDms(r.lng);
                        return `${dms.d}° ${dms.m}' ${dms.s}" E`;
                      },
                    },
                  ]}
                />
              ),
            },
            {
              key: 'files',
              label: `File đính kèm (${displayAttachments.length})`,
              children: (
                <DetailTable
                  dataSource={displayAttachments}
                  emptyText="Chưa có tài liệu đính kèm"
                  rowKey={(r) => r.id || r.fileName}
                  columns={[
                    { title: 'STT', width: 50 },
                    {
                      title: 'Tên tài liệu',
                      dataIndex: 'fileName',
                      key: 'fileName',
                      render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span>,
                    },
                    { title: 'Dung lượng', dataIndex: 'fileSize', key: 'fileSize', width: 120, align: 'right', render: (v) => v ? `${(v / 1024).toFixed(1)} KB` : '—' },
                    { title: 'Người tải lên', dataIndex: 'uploadedByName', key: 'uploadedByName', width: 180, render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span> },
                    { title: 'Ngày tải lên', dataIndex: 'uploadedDate', key: 'uploadedDate', width: 135, align: 'center', render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—' },
                  ]}
                />
              ),
            },
          ]}
        />
      </div>
    );
  };

  // ── Render Actions for Detail View ───────────────────────────────
  const canApproveC1 = userPermissions.includes('vts:approvec1') && record?.approvalStatus === ApprovalStatus.PENDING_APPROVAL;
  const canApproveC2 = userPermissions.includes('vts:approvec2') && record?.approvalStatus === ApprovalStatus.APPROVED_LEVEL1;
  const isSelfApprovalC2 = Boolean(currentUser?.userId && record?.approverLevel1 === currentUser.userId);

  const detailFooter = (canApproveC1 || canApproveC2) ? (
    <div style={drawerFooterStyle}>
      {canApproveC1 && (
        <Space size={spaceSm}>
          <Button
            danger
            onClick={() => { setRejectReason(''); setRejectModalOpen(true); }}
            loading={isSubmitting}
            style={dangerButtonStyle}
          >
            Từ chối cấp Cảng vụ/Chi cục
          </Button>
          <Button
            type="primary"
            onClick={() => { setApproveLevel('c1'); setApproveModalOpen(true); }}
            loading={isSubmitting}
            style={primaryButtonStyle}
          >
            Phê duyệt cấp Cảng vụ/Chi cục
          </Button>
        </Space>
      )}
      {canApproveC2 && (
        <Tooltip title={isSelfApprovalC2 ? 'Bạn không thể tự phê duyệt hồ sơ do mình xét duyệt C1' : ''}>
          <Space size={spaceSm}>
            <Button
              danger
              disabled={isSelfApprovalC2}
              onClick={() => { setRejectReason(''); setRejectModalOpen(true); }}
              loading={isSubmitting}
              style={dangerButtonStyle}
            >
              Từ chối cấp Cục
            </Button>
            <Button
              type="primary"
              disabled={isSelfApprovalC2}
              onClick={() => { setApproveLevel('c2'); setApproveModalOpen(true); }}
              loading={isSubmitting}
              style={primaryButtonStyle}
            >
              Phê duyệt cấp Cục
            </Button>
          </Space>
        </Tooltip>
      )}
    </div>
  ) : null;

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
                    <div>
                      <Row gutter={[24, 0]}>
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
                              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                              options={operatingOrganizations.map((o) => ({ value: o.id, label: o.name }))}
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
                            name="province"
                            rules={[{ required: true, message: 'Vui lòng chọn địa điểm' }]}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              showSearch
                              placeholder="Chọn địa điểm"
                              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
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
                              format="DD/MM/YYYY"
                              placeholder="Chọn thời gian bắt đầu hoạt động"
                              style={{ ...inputStyle, width: '100%' }}
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
                  label: `Danh sách vùng VTS (${zoneList.length})`,
                  children: (
                    <div>
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                        <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                          Danh sách vùng VTS
                        </span>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setZoneList((prev) => [...prev, { id: String(Date.now() + Math.random()), code: '', name: '', conditionStatus: ConditionStatus.OPERATIONAL, status: ConditionStatus.OPERATIONAL }])}
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
                      <Table
                        size="small"
                        tableLayout="fixed"
                        pagination={zoneList.length > 10 ? {
                          current: zonePage,
                          pageSize: 10,
                          total: zoneList.length,
                          onChange: (p) => setZonePage(p),
                          showSizeChanger: false,
                          size: 'small',
                        } : false}
                        dataSource={zoneList}
                        rowKey={(r, idx) => r.id || r._key || String(idx)}
                        columns={[
                          {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            render: (_v, _r, idx) => (zonePage - 1) * 10 + idx + 1,
                          },
                          {
                            title: 'Mã vùng',
                            dataIndex: 'code',
                            width: 180,
                            render: (val, r) => (
                              <ZoneCellInput
                                value={val}
                                placeholder="Nhập mã vùng"
                                onChange={(text) => {
                                  setZoneList((prev) => prev.map((item) => (item === r || (r.id && item.id === r.id) || (r._key && item._key === r._key)) ? { ...item, code: text } : item));
                                }}
                                style={{ borderRadius: radiusPill, height: 32 }}
                              />
                            ),
                          },
                          {
                            title: 'Tên vùng VTS',
                            dataIndex: 'name',
                            render: (val, r) => (
                              <ZoneCellInput
                                value={val}
                                placeholder="Nhập tên vùng VTS"
                                onChange={(text) => {
                                  setZoneList((prev) => prev.map((item) => (item === r || (r.id && item.id === r.id) || (r._key && item._key === r._key)) ? { ...item, name: text } : item));
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
                            width: 50,
                            align: 'center',
                            render: (_v, r) => (
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => setZoneList((prev) => prev.filter((item) => !(item === r || (r.id && item.id === r.id) || (r._key && item._key === r._key))))}
                              />
                            ),
                          },
                        ]}
                        locale={{ emptyText: 'Chưa có vùng VTS nào' }}
                      />
                    </div>
                  ),
                },
                {
                  key: 'gis',
                  label: 'Thông tin vị trí',
                  children: (
                    <div>
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Loại đối tượng</span>}
                            name="geometryType"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn loại đối tượng"
                              options={[
                                { value: 'POINT', label: 'Đối tượng điểm' },
                                { value: 'LINE', label: 'Đối tượng đường' },
                                { value: 'POLYGON', label: 'Đối tượng vùng' },
                              ]}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Biểu tượng bản đồ</span>}
                            name="mapSymbolId"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn biểu tượng hiển thị"
                              allowClear
                              showSearch
                              filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                              options={[
                                { value: 'SYM-01', label: 'Trạm VTS chính (VTS-SYM-01)' },
                                { value: 'SYM-02', label: 'Đài Radar phụ trợ (RADAR-SYM-02)' },
                                { value: 'SYM-03', label: 'Vùng kiểm soát VTS (ZONE-SYM-03)' },
                              ]}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Hệ quy chiếu</span>}
                            name="coordinateSystem"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Select
                              placeholder="Chọn hệ quy chiếu"
                              options={[
                                { value: 'WGS-84', label: 'WGS-84 (Toàn cầu)' },
                                { value: 'VN-2000', label: 'VN-2000 (Việt Nam)' },
                              ]}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Quy tắc hiển thị</span>}
                            name="displayRule"
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="VD: Hiển thị mặc định" style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* GPS Coordinates Header */}
                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                        <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                          Tọa độ GPS ({gpsCoordList.length})
                        </span>
                        <Space size={8}>
                          <Button
                            icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                            onClick={() => setGisModalOpen(true)}
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
                            Chọn tọa độ trên bản đồ
                          </Button>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={addGpsPoint}
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
                            Thêm tọa độ
                          </Button>
                        </Space>
                      </div>

                      <Table
                        size="small"
                        pagination={gpsCoordList.length > 10 ? {
                          current: gpsPage,
                          pageSize: 10,
                          total: gpsCoordList.length,
                          onChange: (p) => setGpsPage(p),
                          showSizeChanger: false,
                          size: 'small',
                        } : false}
                        dataSource={gpsCoordList}
                        rowKey={(r, idx) => r.id || String(idx)}
                        columns={[
                          {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            render: (_v, _r, idx) => (gpsPage - 1) * 10 + idx + 1,
                          },
                          {
                            title: 'Vĩ độ (Latitude - N)',
                            key: 'lat',
                            render: (_v, r, idx) => {
                              const globalIdx = (gpsPage - 1) * 10 + idx;
                              return (
                                <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                  <InputNumber
                                    value={r.latD}
                                    min={0}
                                    max={90}
                                    placeholder="Độ"
                                    onChange={(v) => updateGpsField(globalIdx, 'latD', v)}
                                    style={{ flex: 1, borderRadius: '999px 0 0 999px', height: 32 }}
                                    controls={false}
                                  />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
                                  <InputNumber
                                    value={r.latM}
                                    min={0}
                                    max={59}
                                    placeholder="Phút"
                                    onChange={(v) => updateGpsField(globalIdx, 'latM', v)}
                                    style={{ flex: 1, height: 32 }}
                                    controls={false}
                                  />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
                                  <InputNumber
                                    value={r.latS}
                                    min={0}
                                    max={59.99}
                                    step={0.01}
                                    placeholder="Giây"
                                    onChange={(v) => updateGpsField(globalIdx, 'latS', v)}
                                    style={{ flex: 1.2, height: 32 }}
                                    controls={false}
                                  />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary }}>"</span>
                                </Space.Compact>
                              );
                            },
                          },
                          {
                            title: 'Kinh độ (Longitude - E)',
                            key: 'lng',
                            render: (_v, r, idx) => {
                              const globalIdx = (gpsPage - 1) * 10 + idx;
                              return (
                                <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
                                  <InputNumber
                                    value={r.lngD}
                                    min={0}
                                    max={180}
                                    placeholder="Độ"
                                    onChange={(v) => updateGpsField(globalIdx, 'lngD', v)}
                                    style={{ flex: 1, borderRadius: '999px 0 0 999px', height: 32 }}
                                    controls={false}
                                  />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
                                  <InputNumber
                                    value={r.lngM}
                                    min={0}
                                    max={59}
                                    placeholder="Phút"
                                    onChange={(v) => updateGpsField(globalIdx, 'lngM', v)}
                                    style={{ flex: 1, height: 32 }}
                                    controls={false}
                                  />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
                                  <InputNumber
                                    value={r.lngS}
                                    min={0}
                                    max={59.99}
                                    step={0.01}
                                    placeholder="Giây"
                                    onChange={(v) => updateGpsField(globalIdx, 'lngS', v)}
                                    style={{ flex: 1.2, height: 32 }}
                                    controls={false}
                                  />
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary }}>"</span>
                                </Space.Compact>
                              );
                            },
                          },
                          {
                            title: '',
                            width: 50,
                            align: 'center',
                            render: (_v, _r, idx) => (
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeGpsPoint((gpsPage - 1) * 10 + idx)}
                              />
                            ),
                          },
                        ]}
                        locale={{ emptyText: 'Chưa có tọa độ GPS nào' }}
                      />
                    </div>
                  ),
                },
                {
                  key: 'files',
                  label: `File đính kèm (${attachmentList.length})`,
                  children: (
                    <div>
                      <div style={{ marginBottom: spaceMd }}>
                        <Upload.Dragger
                          beforeUpload={(file) => {
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
                            Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤ 20MB.
                          </p>
                        </Upload.Dragger>
                      </div>

                      <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                        <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                          Danh sách tệp đính kèm ({attachmentList.length})
                        </span>
                      </div>

                      <Table
                        size="small"
                        pagination={attachmentList.length > 10 ? {
                          current: filePage,
                          pageSize: 10,
                          total: attachmentList.length,
                          onChange: (p) => setFilePage(p),
                          showSizeChanger: false,
                          size: 'small',
                        } : false}
                        dataSource={attachmentList}
                        rowKey={(r, idx) => r.id || String(idx)}
                        columns={[
                          {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            render: (_v, _r, idx) => (filePage - 1) * 10 + idx + 1,
                          },
                          {
                            title: 'Tên tài liệu',
                            dataIndex: 'fileName',
                            key: 'fileName',
                            render: (name: string, record: any) => (
                              <a
                                onClick={() => handleDownloadAttachment(record)}
                                style={{
                                  fontSize: fontSizeMd,
                                  color: actionPrimary,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  cursor: 'pointer',
                                  fontWeight: fontWeightMedium,
                                }}
                              >
                                <FileOutlined />
                                <span>{name}</span>
                              </a>
                            ),
                          },
                          {
                            title: 'Dung lượng',
                            dataIndex: 'fileSize',
                            width: 120,
                            render: (v) => v ? (v > 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(2)} MB` : `${(v / 1024).toFixed(1)} KB`) : '—',
                          },
                          {
                            title: 'Người tải lên',
                            dataIndex: 'uploadedByName',
                            width: 180,
                            render: (v) => v || '—',
                          },
                          {
                            title: 'Ngày tải lên',
                            dataIndex: 'uploadedDate',
                            width: 160,
                            render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—',
                          },
                          {
                            title: '',
                            width: 80,
                            align: 'center',
                            render: (_v, r) => (
                              <Space size={4}>
                                <Button
                                  type="text"
                                  icon={<DownloadOutlined style={{ color: actionPrimary }} />}
                                  onClick={() => handleDownloadAttachment(r)}
                                />
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteAttachment(r.id)}
                                />
                              </Space>
                            ),
                          },
                        ]}
                        locale={{ emptyText: 'Chưa có tài liệu đính kèm nào' }}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </Form>
        )}
      </Spin>

      {/* Approve / Reject Modals */}
      <Modal
        title="Từ chối phê duyệt"
        open={rejectModalOpen}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        onCancel={() => setRejectModalOpen(false)}
        onOk={() => {
          if (rejectReason.trim().length < 10) {
            toast.error('Lý do từ chối phải có ít nhất 10 ký tự');
            return;
          }
          setRejectModalOpen(false);
          void handleApprovalAction('reject', rejectReason.trim());
        }}
      >
        <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối (tối thiểu 10 ký tự):</p>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          maxLength={500}
          showCount
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối..."
          style={textAreaStyle}
        />
      </Modal>

      <Modal
        title={approveLevel === 'c1' ? 'Phê duyệt cấp Cảng vụ/Chi cục' : 'Phê duyệt cấp Cục'}
        open={approveModalOpen}
        okText="Xác nhận phê duyệt"
        cancelText="Hủy"
        onCancel={() => setApproveModalOpen(false)}
        onOk={() => {
          setApproveModalOpen(false);
          void handleApprovalAction(approveLevel === 'c1' ? 'approveC1' : 'approveC2');
        }}
      >
        <p style={{ margin: '16px 0', fontSize: fontSizeMd, color: textPrimary }}>
          Bạn có chắc chắn muốn phê duyệt hồ sơ này?
        </p>
      </Modal>

      {/* GIS Location Selector Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: sidebarBg, fontSize: fontSizeLg }}>
              {isDetailMode ? 'Xem vị trí trên bản đồ chuyên dụng' : 'Chọn vị trí & tọa độ trên bản đồ chuyên dụng'}
            </span>
          </div>
        }
        open={gisModalOpen}
        onCancel={() => setGisModalOpen(false)}
        destroyOnClose
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={
          isDetailMode ? [
            <Button key="close" type="primary" onClick={() => setGisModalOpen(false)} style={{ ...primaryButtonStyle, height: 36 }}>
              Đóng
            </Button>,
          ] : [
            <Button key="cancel" onClick={() => setGisModalOpen(false)} style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}>
              Hủy
            </Button>,
            <Button
              key="ok"
              type="primary"
              onClick={() => {
                setGisModalOpen(false);
                toast.success('Đã xác nhận vị trí từ bản đồ');
              }}
              style={{ ...primaryButtonStyle, height: 36 }}
            >
              Xác nhận tọa độ
            </Button>,
          ]
        }
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType="POINT"
            value={currentGisWkt ? { geometryType: 'POINT', coordinates: currentGisWkt } : undefined}
            disabled={isDetailMode}
            height={520}
            onChange={(val) => {
              if (isDetailMode) return;
              if (val?.coordinates) {
                const match = val.coordinates.match(/POINT\s*\(\s*([\d\.]+)\s+([\d\.]+)\s*\)/i);
                if (match) {
                  const lngVal = parseFloat(match[1]);
                  const latVal = parseFloat(match[2]);
                  const dmsLat = ddToDms(latVal);
                  const dmsLng = ddToDms(lngVal);
                  setGpsCoordList([
                    {
                      id: String(Date.now()),
                      latD: dmsLat.d,
                      latM: dmsLat.m,
                      latS: dmsLat.s,
                      lngD: dmsLng.d,
                      lngM: dmsLng.m,
                      lngS: dmsLng.s,
                    },
                  ]);
                }
              }
            }}
          />
        </div>
      </Modal>
    </Drawer>
  );
}
