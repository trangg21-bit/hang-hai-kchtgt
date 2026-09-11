/**
 * Danh mục 49 biểu mẫu báo cáo thống kê chuyên ngành hàng hải
 * theo Thông tư 48, Thông tư 67 và Nghị định 43.
 * Single source of truth cho ReportList, ReportViewer và menu điều hướng sidebar.
 */

export interface ReportTemplate {
  code: string;
  name: string;
  category: 'bcc' | 'bckcht' | 'bcdl' | 'bcpttv' | 'bcdn' | 'bctt48' | 'bccndb' | 'bcthtn';
  status: 'active' | 'proposed';
}

export const CATEGORY_MAP = {
  bcc: { label: 'Báo cáo thống kê chung', color: 'blue' },
  bckcht: { label: 'Nhóm chỉ tiêu kết cấu hạ tầng', color: 'purple' },
  bcdl: { label: 'Nhóm chỉ tiêu đo lường', color: 'cyan' },
  bcpttv: { label: 'Nhóm chỉ tiêu phương tiện và thuyền viên', color: 'orange' },
  bcdn: { label: 'Nhóm chỉ tiêu về doanh nghiệp', color: 'magenta' },
  bctt48: { label: 'Nhóm báo cáo thông tư 48/2017/TT-BGTVT', color: 'red' },
  bccndb: { label: 'Nhóm chỉ tiêu chuyên ngành bảo đảm', color: 'green' },
  bcthtn: { label: 'Báo cáo tổng hợp theo ngày', color: 'gold' },
} as const;

export type ReportCategoryKey = keyof typeof CATEGORY_MAP;

export const REPORT_TEMPLATES: ReportTemplate[] = [
  // bcc: Báo cáo thống kê chung
  { code: 'F-141', name: 'Báo cáo thống kê tăng giảm tài sản', category: 'bcc', status: 'proposed' },
  { code: 'F-142', name: 'Mẫu B04a/BCTC: Thuyết minh chi tiết số liệu tài sản kết cấu hạ tầng đơn vị được giao quản lý nhưng không trực tiếp khai thác, sử dụng', category: 'bcc', status: 'proposed' },
  { code: 'F-143', name: 'Mẫu số 02: Báo cáo kê khai tài sản kết cấu hạ tầng hàng hải', category: 'bcc', status: 'proposed' },
  { code: 'F-144', name: 'Mẫu số 03: Báo cáo tình hình quản lý tài sản kết cấu hạ tầng hàng hải', category: 'bcc', status: 'proposed' },
  { code: 'F-145', name: 'Mẫu số 04: Báo cáo tình hình xử lý tài sản kết cấu hạ tầng hàng hải', category: 'bcc', status: 'proposed' },
  { code: 'F-146', name: 'Mẫu số 05: Báo cáo tình hình khai thác tài sản kết cấu hạ tầng hàng hải', category: 'bcc', status: 'proposed' },
  { code: 'F-147', name: 'Mẫu số 06: Tổng hợp danh mục TS KCHTGT hàng hải đề nghị xử lý', category: 'bcc', status: 'proposed' },

  // bckcht: Nhóm chỉ tiêu kết cấu hạ tầng
  { code: 'F-148', name: 'Biểu 01-N: Năng lực thông qua cảng biển, cầu cảng, cảng bến thủy nội địa', category: 'bckcht', status: 'active' },
  { code: 'F-149', name: 'Biểu 02-N: Năng lực thông qua cảng biển', category: 'bckcht', status: 'active' },
  { code: 'F-150', name: 'Biểu 03-N: Thống kê cầu cảng', category: 'bckcht', status: 'active' },
  { code: 'F-151', name: 'Biểu 04-N: Thống kê luồng hàng hải', category: 'bckcht', status: 'active' },
  { code: 'F-152', name: 'Biểu 06-N: Thống kê vùng đón trả hoa tiêu, vùng quay trở tàu, ga tránh tàu, khu neo tránh trú bão', category: 'bckcht', status: 'active' },
  { code: 'F-153', name: 'Biểu 05-N: Thống kê khu chuyển tải, khu neo đậu', category: 'bckcht', status: 'active' },
  { code: 'F-154', name: 'Biểu 07-N: Thống kê bến phao, khu neo đậu', category: 'bckcht', status: 'active' },
  { code: 'F-155', name: 'Biểu 08-N: Thống kê hệ thống đèn biển', category: 'bckcht', status: 'active' },
  { code: 'F-156', name: 'Biểu 09-6T/N: Thống kê về hệ thống phao tiêu, báo hiệu trên luồng', category: 'bckcht', status: 'active' },
  { code: 'F-157', name: 'Biểu 10-6T/N: Thống kê phao tiêu, báo hiệu trên luồng', category: 'bckcht', status: 'active' },
  { code: 'F-158', name: 'Biểu 11-N: Thống kê về hệ thống giám sát và điều phối giao thông hàng hải (VTS)', category: 'bckcht', status: 'active' },
  { code: 'F-159', name: 'Biểu 12-N: Hệ thống các đài thông tin duyên hải', category: 'bckcht', status: 'active' },
  { code: 'F-160', name: 'Biểu 13-N: Thống kê về hệ thống đê, kè chắn sóng, chắn cát', category: 'bckcht', status: 'active' },

  // bcdl: Nhóm chỉ tiêu đo lường
  { code: 'F-161', name: 'Biểu 14-T: Báo cáo chi tiết tàu biển ra, vào cảng biển', category: 'bcdl', status: 'active' },
  { code: 'F-162', name: 'Biểu 15-T: Báo cáo chi tiết phương tiện thủy nội địa ra, vào cảng biển', category: 'bcdl', status: 'active' },
  { code: 'F-163', name: 'Biểu 16-Q: Thống kê tàu biển nước ngoài đến, rời tại khu vực cảng biển', category: 'bcdl', status: 'active' },
  { code: 'F-164', name: 'Biểu 17-Q: Thống kê tàu biển Việt Nam vận tải quốc tế tại khu vực cảng biển', category: 'bcdl', status: 'active' },
  { code: 'F-165', name: 'Biểu 12-T: Khối lượng hàng hóa, hành khách thông qua cảng', category: 'bcdl', status: 'active' },
  { code: 'F-166', name: 'Biểu 12-N: Khối lượng hàng hóa, hành khách thông qua cảng biển theo năm', category: 'bcdl', status: 'active' },
  { code: 'F-167', name: 'Biểu 13-T: Lượt tàu thuyền ra, vào cảng', category: 'bcdl', status: 'active' },
  { code: 'F-168', name: 'Biểu 14-T: Khối lượng hàng hóa thông qua cảng biển bằng đội tàu biển Việt Nam và phương tiện thủy nội địa', category: 'bcdl', status: 'active' },
  { code: 'F-169', name: 'Biểu 15-T: Khối lượng hàng hóa, lượt tàu thông qua cảng biển, bến trong khu vực quản lý', category: 'bcdl', status: 'active' },

  // bcpttv: Nhóm chỉ tiêu phương tiện và thuyền viên
  { code: 'F-170', name: 'Biểu 21-6T/N: Thống kê thuyền viên, hoa tiêu hàng hải', category: 'bcpttv', status: 'proposed' },
  { code: 'F-171', name: 'Biểu 22-6T/N: Thống kê tàu biển mang cờ quốc tịch Việt Nam', category: 'bcpttv', status: 'proposed' },
  { code: 'F-172', name: 'Biểu 28-N: Thống kê tàu thuyền hoạt động dịch vụ lai dắt', category: 'bcpttv', status: 'proposed' },

  // bcdn: Nhóm chỉ tiêu về doanh nghiệp
  { code: 'F-173', name: 'Biểu 36–N: Thống kê cơ sở đóng mới, sửa chữa, phá dỡ tàu biển', category: 'bcdn', status: 'proposed' },
  { code: 'F-174', name: 'Biểu 46-6T/N: Tổng hợp khối lượng hàng hóa thông qua cảng biển', category: 'bcdn', status: 'proposed' },

  // bctt48: Nhóm báo cáo thông tư 48/2017/TT-BGTVT
  { code: 'F-175', name: 'Biểu số 06-N: Năng lực thông qua bến cảng, cầu cảng thông tư 48/2017/TT-BGTVT', category: 'bctt48', status: 'proposed' },
  { code: 'F-176', name: 'Biểu 07-N: Năng lực thông qua cảng biển, cảng bến thủy nội địa địa phương và doanh nghiệp quản lý', category: 'bctt48', status: 'proposed' },
  { code: 'F-177', name: 'Biểu 28-T: Khối lượng hàng hóa thông qua cảng', category: 'bctt48', status: 'proposed' },
  { code: 'F-178', name: 'Biểu 29-N: Khối lượng hàng hóa thông qua cảng', category: 'bctt48', status: 'proposed' },
  { code: 'F-179', name: 'Biểu 33-N: Sản lượng dịch vụ vận tải, doanh nghiệp và các hoạt động hỗ trợ vận tải đường sắt, đường thủy nội địa, đường biển', category: 'bctt48', status: 'proposed' },

  // bccndb: Nhóm chỉ tiêu chuyên ngành bảo đảm
  { code: 'F-180', name: 'Biểu Tổng hợp thông tin chung', category: 'bccndb', status: 'proposed' },
  { code: 'F-181', name: 'Biểu Tổng hợp thông tin kết cấu hạ tầng giao thông hàng hải', category: 'bccndb', status: 'proposed' },
  { code: 'F-182', name: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải', category: 'bccndb', status: 'proposed' },
  { code: 'F-183', name: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Cầu cảng', category: 'bccndb', status: 'proposed' },
  { code: 'F-184', name: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Luồng hàng hải', category: 'bccndb', status: 'proposed' },
  { code: 'F-185', name: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Phao tiêu báo hiệu và nhà trạm quản lý vận hành', category: 'bccndb', status: 'proposed' },
  { code: 'F-186', name: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Đèn biển và nhà trạm gắn với đèn biển', category: 'bccndb', status: 'proposed' },
  { code: 'F-187', name: 'Biểu Tổng hợp thông tin bảo trì kết cấu hạ tầng giao thông hàng hải- Đê, kè', category: 'bccndb', status: 'proposed' },
  { code: 'F-188', name: 'Báo cáo kê khai, tình hình quản lý TS KCHTGT hàng hải', category: 'bccndb', status: 'proposed' },
  { code: 'F-189', name: 'Báo cáo tình hình hoạt động của báo hiệu hàng hải và công trình đê, kè', category: 'bccndb', status: 'proposed' },

  // bcthtn: Báo cáo tổng hợp theo ngày
  { code: 'F-180N', name: 'Biểu 12-T: Khối lượng hàng hóa, hành khách thông qua cảng biển theo ngày', category: 'bcthtn', status: 'proposed' },
  { code: 'F-182N', name: 'Biểu 13-T: Lượt tàu thuyền vào, rời cảng biển theo ngày', category: 'bcthtn', status: 'proposed' },
  { code: 'F-183N', name: 'Biểu 14-T: Khối lượng hàng hóa, hành khách, lượt tàu thông qua cảng biển bằng đội tàu Việt Nam theo ngày', category: 'bcthtn', status: 'proposed' },
  { code: 'F-184N', name: 'Biểu 15-T: Khối lượng hàng hóa, hành khách thông qua qua cảng biển, bến cảng, khu chuyển tải trong khu vực quản lý theo ngày', category: 'bcthtn', status: 'proposed' },
];
