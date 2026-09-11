import React from 'react';
import {
  // Root
  PieChartOutlined,
  // 8 Categories
  AppstoreOutlined,
  BankOutlined,
  DashboardOutlined,
  TeamOutlined,
  ShopOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  // 53 Reports
  // 1. bcc
  RiseOutlined,
  CalculatorOutlined,
  FormOutlined,
  SolutionOutlined,
  ClearOutlined,
  DollarOutlined,
  SnippetsOutlined,
  // 2. bckcht
  GatewayOutlined,
  GlobalOutlined,
  ColumnWidthOutlined,
  BranchesOutlined,
  AimOutlined,
  MergeCellsOutlined,
  PushpinOutlined,
  BulbOutlined,
  AlertOutlined,
  BellOutlined,
  RadarChartOutlined,
  WifiOutlined,
  DeploymentUnitOutlined,
  // 3. bcdl
  ImportOutlined,
  ExportOutlined,
  FlagOutlined,
  CompassOutlined,
  BarChartOutlined,
  AreaChartOutlined,
  SwapOutlined,
  DropboxOutlined,
  TableOutlined,
  // 4. bcpttv
  UserSwitchOutlined,
  CrownOutlined,
  PullRequestOutlined,
  // 5. bcdn
  BuildOutlined,
  FundProjectionScreenOutlined,
  // 6. bctt48
  ProfileOutlined,
  PartitionOutlined,
  AccountBookOutlined,
  SlidersOutlined,
  ClusterOutlined,
  // 7. bccndb
  InfoCircleOutlined,
  ApartmentOutlined,
  ToolOutlined,
  NodeIndexOutlined,
  ShareAltOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  SafetyOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  // 8. bcthtn
  CalendarOutlined,
  FieldTimeOutlined,
  HistoryOutlined,
  HourglassOutlined,
} from '@ant-design/icons';

/** Icon đại diện chuyên biệt cho 8 nhóm biểu mẫu báo cáo — không trùng lặp */
export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bcc: <AppstoreOutlined />,
  bckcht: <BankOutlined />,
  bcdl: <DashboardOutlined />,
  bcpttv: <TeamOutlined />,
  bcdn: <ShopOutlined />,
  bctt48: <BookOutlined />,
  bccndb: <SafetyCertificateOutlined />,
  bcthtn: <ScheduleOutlined />,
};

/** Icon gốc cho Tất cả báo cáo */
export const ALL_REPORTS_ICON = <PieChartOutlined />;

/**
 * Icon đặc thù riêng biệt cho từng biểu mẫu báo cáo (53 mẫu biểu) —
 * 100% độc nhất, gắn liền với ngữ cảnh chuyên ngành của từng báo cáo.
 */
export const REPORT_ICONS: Record<string, React.ReactNode> = {
  // ===== 1. bcc: Báo cáo thống kê chung (tài sản, kế toán, xử lý) =====
  'F-141': <RiseOutlined />,
  'F-142': <CalculatorOutlined />,
  'F-143': <FormOutlined />,
  'F-144': <SolutionOutlined />,
  'F-145': <ClearOutlined />,
  'F-146': <DollarOutlined />,
  'F-147': <SnippetsOutlined />,

  // ===== 2. bckcht: Nhóm chỉ tiêu kết cấu hạ tầng hàng hải =====
  'F-148': <GatewayOutlined />,
  'F-149': <GlobalOutlined />,
  'F-150': <ColumnWidthOutlined />,
  'F-151': <BranchesOutlined />,
  'F-152': <AimOutlined />,
  'F-153': <MergeCellsOutlined />,
  'F-154': <PushpinOutlined />,
  'F-155': <BulbOutlined />,
  'F-156': <AlertOutlined />,
  'F-157': <BellOutlined />,
  'F-158': <RadarChartOutlined />,
  'F-159': <WifiOutlined />,
  'F-160': <DeploymentUnitOutlined />,

  // ===== 3. bcdl: Nhóm chỉ tiêu đo lường, sản lượng tàu hàng =====
  'F-161': <ImportOutlined />,
  'F-162': <ExportOutlined />,
  'F-163': <FlagOutlined />,
  'F-164': <CompassOutlined />,
  'F-165': <BarChartOutlined />,
  'F-166': <AreaChartOutlined />,
  'F-167': <SwapOutlined />,
  'F-168': <DropboxOutlined />,
  'F-169': <TableOutlined />,

  // ===== 4. bcpttv: Nhóm chỉ tiêu phương tiện và thuyền viên =====
  'F-170': <UserSwitchOutlined />,
  'F-171': <CrownOutlined />,
  'F-172': <PullRequestOutlined />,

  // ===== 5. bcdn: Nhóm chỉ tiêu về doanh nghiệp =====
  'F-173': <BuildOutlined />,
  'F-174': <FundProjectionScreenOutlined />,

  // ===== 6. bctt48: Nhóm báo cáo Thông tư 48/2017/TT-BGTVT =====
  'F-175': <ProfileOutlined />,
  'F-176': <PartitionOutlined />,
  'F-177': <AccountBookOutlined />,
  'F-178': <SlidersOutlined />,
  'F-179': <ClusterOutlined />,

  // ===== 7. bccndb: Nhóm chỉ tiêu chuyên ngành bảo đảm & bảo trì =====
  'F-180': <InfoCircleOutlined />,
  'F-181': <ApartmentOutlined />,
  'F-182': <ToolOutlined />,
  'F-183': <NodeIndexOutlined />,
  'F-184': <ShareAltOutlined />,
  'F-185': <ThunderboltOutlined />,
  'F-186': <EyeOutlined />,
  'F-187': <SafetyOutlined />,
  'F-188': <AuditOutlined />,
  'F-189': <CheckCircleOutlined />,

  // ===== 8. bcthtn: Báo cáo tổng hợp theo ngày =====
  'F-180N': <CalendarOutlined />,
  'F-182N': <FieldTimeOutlined />,
  'F-183N': <HistoryOutlined />,
  'F-184N': <HourglassOutlined />,
};
