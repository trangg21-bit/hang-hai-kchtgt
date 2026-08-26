package com.hanghai.kchtg.config;

import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.Nullable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Order(1)
@Profile({ "local", "local-h2", "prod" })
@Slf4j
public class PermissionSeeder implements CommandLineRunner {

        private final PermissionRepository permissionRepository;
        private final UserRepository userRepository;
        private final JdbcTemplate jdbcTemplate;

        public PermissionSeeder(PermissionRepository permissionRepository, UserRepository userRepository) {
                this(permissionRepository, userRepository, null);
        }

        @Autowired
        public PermissionSeeder(PermissionRepository permissionRepository, UserRepository userRepository,
                        @Nullable JdbcTemplate jdbcTemplate) {
                this.permissionRepository = permissionRepository;
                this.userRepository = userRepository;
                this.jdbcTemplate = jdbcTemplate;
        }

        @Override
        @Transactional
        public void run(String... args) {
                // SECURITY: Không reset mật khẩu admin mỗi lần khởi động — mật khẩu
                // do quản trị viên đặt và được giữ nguyên giữa các lần boot.

                Map<String, Permission> definitions = new LinkedHashMap<>();

                // 1. Quản lý tài khoản người dùng (User Account Management)
                seedPermission(definitions, "user", "manage", "Quản lý tài khoản người dùng",
                                "Toàn quyền quản lý tài khoản người dùng");
                seedPermission(definitions, "user", "read", "Xem tài khoản người dùng",
                                "Xem danh sách và chi tiết tài khoản người dùng");
                seedPermission(definitions, "user", "create", "Thêm mới tài khoản người dùng",
                                "Tạo mới tài khoản người dùng");
                seedPermission(definitions, "user", "update", "Cập nhật tài khoản người dùng",
                                "Chỉnh sửa thông tin tài khoản người dùng");
                seedPermission(definitions, "user", "lock", "Khóa / Mở khóa tài khoản người dùng",
                                "Khóa hoặc mở khóa tài khoản người dùng");
                seedPermission(definitions, "user", "approve", "Phê duyệt tài khoản người dùng",
                                "Phê duyệt hoặc từ chối yêu cầu đăng ký tài khoản người dùng");

                // 2. Quản lý cơ cấu tổ chức & đơn vị (Org Unit Management)
                seedPermission(definitions, "orgunit", "read", "Xem đơn vị", "Xem danh mục và cơ cấu tổ chức đơn vị");
                seedPermission(definitions, "orgunit", "create", "Thêm đơn vị", "Tạo mới đơn vị, phòng ban");
                seedPermission(definitions, "orgunit", "update", "Cập nhật đơn vị", "Chỉnh sửa thông tin đơn vị");
                seedPermission(definitions, "orgunit", "delete", "Xóa đơn vị", "Xóa đơn vị, phòng ban");

                // 3. Quản lý nhóm người dùng & phân quyền (User Group Management)
                seedPermission(definitions, "group", "read", "Xem nhóm", "Xem danh sách nhóm người dùng");
                seedPermission(definitions, "group", "create", "Thêm nhóm", "Tạo mới nhóm người dùng");
                seedPermission(definitions, "group", "update", "Cập nhật nhóm", "Chỉnh sửa thông tin nhóm người dùng");
                seedPermission(definitions, "group", "lock", "Khóa nhóm", "Khóa hoặc mở khóa nhóm người dùng");
                seedPermission(definitions, "group", "permission", "Phân quyền nhóm",
                                "Cấu hình cây quyền hạn cho nhóm người dùng");
                seedPermission(definitions, "groupmember", "manage", "Quản lý thành viên nhóm",
                                "Thêm, bớt thành viên trong nhóm người dùng");

                // 4. Quản trị hệ thống & Giám sát (System Administration & Security)
                seedPermission(definitions, "admin", "all", "Toàn quyền hệ thống", "Toàn quyền quản trị toàn hệ thống");
                seedPermission(definitions, "admin", "manage", "Quản trị hệ thống", "Quản trị cấu hình và phân quyền");
                seedPermission(definitions, "admin", "view", "Xem cấu hình quản trị",
                                "Xem các thông số cấu hình hệ thống");
                seedPermission(definitions, "admin", "operation", "Vận hành hệ thống",
                                "Thao tác vận hành và phê duyệt hệ thống");
                seedPermission(definitions, "log", "manage", "Quản lý nhật ký",
                                "Xem và quản lý nhật ký truy cập hệ thống");
                seedPermission(definitions, "map", "manage", "Quản trị bản đồ", "Cấu hình lớp bản đồ và ký hiệu GIS");
                seedPermission(definitions, "security", "manage", "Quản lý an ninh mạng",
                                "Quản trị an toàn thông tin và cảnh báo SIEM");
                seedPermission(definitions, "security", "monitor", "Giám sát an ninh",
                                "Giám sát luồng truy cập và sự cố an ninh");
                seedPermission(definitions, "security", "read", "Xem nhật ký an ninh",
                                "Tra cứu dữ liệu cảnh báo an ninh");

                // 5. Kết nối & Chia sẻ dữ liệu liên thông (Interconnection & Sharing)
                seedPermission(definitions, "connection", "manage", "Quản lý kết nối liên thông",
                                "Cấu hình endpoint và kết nối dịch vụ ngoài");
                seedPermission(definitions, "connection", "read", "Xem kết nối liên thông",
                                "Xem trạng thái kết nối tích hợp");
                seedPermission(definitions, "api", "share", "Chia sẻ dữ liệu API",
                                "Cấp quyền chia sẻ và khai thác API");

                // 6. Dữ liệu dùng chung, Báo cáo & Phê duyệt biểu mẫu
                seedPermission(definitions, "data", "manage", "Quản lý dữ liệu", "Quản trị toàn bộ dữ liệu nghiệp vụ");
                seedPermission(definitions, "data", "read", "Đọc dữ liệu", "Tra cứu và đọc dữ liệu nghiệp vụ");
                seedPermission(definitions, "data", "write", "Ghi dữ liệu", "Thêm mới và cập nhật dữ liệu nghiệp vụ");
                seedPermission(definitions, "data", "create", "Tạo dữ liệu", "Tạo dữ liệu dùng chung");
                seedPermission(definitions, "data", "update", "Cập nhật dữ liệu", "Sửa dữ liệu dùng chung");
                seedPermission(definitions, "data", "delete", "Xóa dữ liệu", "Xóa dữ liệu dùng chung");
                seedPermission(definitions, "data", "approve", "Phê duyệt dữ liệu", "Phê duyệt dữ liệu dùng chung");
                seedPermission(definitions, "data", "approvec1", "Phê duyệt C1 dữ liệu",
                                "Phê duyệt cấp 1 dữ liệu dùng chung");
                seedPermission(definitions, "data", "approvec2", "Phê duyệt C2 dữ liệu",
                                "Phê duyệt cấp 2 dữ liệu dùng chung");
                seedPermission(definitions, "report", "manage", "Quản lý báo cáo",
                                "Quản lý và tổng hợp báo cáo thống kê");
                seedPermission(definitions, "report", "read", "Xem báo cáo", "Tra cứu và xem báo cáo thống kê");
                seedPermission(definitions, "report", "create", "Tạo báo cáo", "Lập báo cáo thống kê mới");
                seedPermission(definitions, "report", "update", "Cập nhật báo cáo", "Chỉnh sửa báo cáo thống kê");
                seedPermission(definitions, "report", "delete", "Xóa báo cáo", "Xóa báo cáo thống kê");
                seedPermission(definitions, "check", "read", "Kiểm tra dữ liệu", "Kiểm tra tính toàn vẹn dữ liệu");
                seedPermission(definitions, "approve", "action", "Thao tác phê duyệt",
                                "Thực hiện thao tác phê duyệt nghiệp vụ");

                // 7. Văn bản pháp quy & Hồ sơ pháp lý (Legal Documents)
                seedPermission(definitions, "document", "manage", "Quản lý văn bản",
                                "Toàn quyền quản lý văn bản pháp lý");
                seedPermission(definitions, "document", "read", "Xem văn bản", "Tra cứu và tải văn bản pháp quy");
                seedPermission(definitions, "document", "create", "Thêm văn bản",
                                "Thêm mới văn bản pháp quy, đính kèm tệp");
                seedPermission(definitions, "document", "update", "Cập nhật văn bản",
                                "Chỉnh sửa thông tin văn bản pháp quy");
                seedPermission(definitions, "document", "delete", "Xóa văn bản", "Xóa văn bản pháp quy");
                seedPermission(definitions, "document", "approve", "Phê duyệt văn bản", "Phê duyệt văn bản pháp quy");

                // 7.1 Quy hoạch cảng & Điều chỉnh quy hoạch (Port Planning & Adjustments)
                seedPermission(definitions, "portplanning", "manage", "Quản lý quy hoạch bến cảng",
                                "Toàn quyền quản lý quy hoạch bến cảng");
                seedPermission(definitions, "portplanning", "read", "Xem quy hoạch bến cảng",
                                "Tra cứu và xem hồ sơ quy hoạch bến cảng");
                seedPermission(definitions, "portplanning", "create", "Thêm quy hoạch bến cảng",
                                "Tạo mới hồ sơ quy hoạch bến cảng");
                seedPermission(definitions, "portplanning", "update", "Cập nhật quy hoạch bến cảng",
                                "Chỉnh sửa hồ sơ quy hoạch bến cảng");
                seedPermission(definitions, "portplanning", "delete", "Xóa quy hoạch bến cảng",
                                "Xóa hồ sơ quy hoạch bến cảng");
                seedPermission(definitions, "portplanning", "search", "Tra cứu quy hoạch bến cảng",
                                "Tra cứu động quy hoạch bến cảng");
                seedPermission(definitions, "portplanning", "approve", "Phê duyệt quy hoạch bến cảng",
                                "Phê duyệt hồ sơ quy hoạch bến cảng");

                seedPermission(definitions, "planningadjustment", "manage", "Quản lý điều chỉnh quy hoạch",
                                "Toàn quyền quản lý điều chỉnh quy hoạch");
                seedPermission(definitions, "planningadjustment", "read", "Xem điều chỉnh quy hoạch",
                                "Tra cứu điều chỉnh quy hoạch");
                seedPermission(definitions, "planningadjustment", "create", "Thêm điều chỉnh quy hoạch",
                                "Tạo mới điều chỉnh quy hoạch");
                seedPermission(definitions, "planningadjustment", "update", "Cập nhật điều chỉnh quy hoạch",
                                "Chỉnh sửa điều chỉnh quy hoạch");
                seedPermission(definitions, "planningadjustment", "delete", "Xóa điều chỉnh quy hoạch",
                                "Xóa điều chỉnh quy hoạch");
                seedPermission(definitions, "planningadjustment", "approve", "Phê duyệt điều chỉnh quy hoạch",
                                "Phê duyệt điều chỉnh quy hoạch");

                // 7.2 Liên thông kết nối (Interconnection alias)
                seedPermission(definitions, "interconnect", "manage", "Quản lý kết nối liên thông",
                                "Toàn quyền quản lý liên thông kết nối");
                seedPermission(definitions, "interconnect", "read", "Xem liên thông kết nối",
                                "Tra cứu trạng thái và lịch sử liên thông kết nối");
                seedPermission(definitions, "interconnect", "create", "Tạo liên thông kết nối",
                                "Thêm cấu hình liên thông kết nối");
                seedPermission(definitions, "interconnect", "update", "Cập nhật liên thông kết nối",
                                "Chỉnh sửa cấu hình liên thông kết nối");
                seedPermission(definitions, "interconnect", "delete", "Xóa liên thông kết nối",
                                "Xóa cấu hình liên thông kết nối");

                // 8. Hạ tầng cảng biển & Vùng nước hàng hải (Port & Water Zone Infrastructure)
                // 8.1 Cảng biển (Port)
                seedPermission(definitions, "port", "read", "Xem cảng biển", "Tra cứu danh mục cảng biển");
                seedPermission(definitions, "port", "read:restricted", "Xem bản ghi hạn chế cảng biển",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của cảng biển");
                seedPermission(definitions, "port", "read:confidential", "Xem bản ghi mật cảng biển",
                                "Xem các bản ghi dữ liệu mức độ Mật của cảng biển");
                seedPermission(definitions, "port", "create", "Thêm cảng biển", "Tạo mới hồ sơ cảng biển");
                seedPermission(definitions, "port", "update", "Cập nhật cảng biển", "Chỉnh sửa thông tin cảng biển");
                seedPermission(definitions, "port", "delete", "Xóa cảng biển", "Xóa cảng biển khỏi hệ thống");
                seedPermission(definitions, "port", "approve", "Phê duyệt cảng biển", "Phê duyệt dữ liệu cảng biển");
                seedPermission(definitions, "port", "approvec1", "Phê duyệt C1 cảng biển",
                                "Phê duyệt cấp 1 (Chi cục/Cảng vụ) cảng biển");
                seedPermission(definitions, "port", "approvec2", "Phê duyệt C2 cảng biển",
                                "Phê duyệt cấp 2 (Cục Hàng hải) cảng biển");
                seedPermission(definitions, "port", "history", "Lịch sử phê duyệt cảng biển",
                                "Xem lịch sử thay đổi và phê duyệt cảng biển");

                // 8.2 Bến cảng (Berth)
                seedPermission(definitions, "berth", "read", "Xem bến cảng", "Tra cứu thông tin bến cảng");
                seedPermission(definitions, "berth", "read:restricted", "Xem bản ghi hạn chế bến cảng",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của bến cảng");
                seedPermission(definitions, "berth", "read:confidential", "Xem bản ghi mật bến cảng",
                                "Xem các bản ghi dữ liệu mức độ Mật của bến cảng");
                seedPermission(definitions, "berth", "create", "Thêm bến cảng", "Tạo mới hồ sơ bến cảng");
                seedPermission(definitions, "berth", "update", "Cập nhật bến cảng", "Chỉnh sửa thông tin bến cảng");
                seedPermission(definitions, "berth", "delete", "Xóa bến cảng", "Xóa bến cảng");
                seedPermission(definitions, "berth", "approve", "Phê duyệt bến cảng", "Phê duyệt dữ liệu bến cảng");
                seedPermission(definitions, "berth", "approvec1", "Phê duyệt C1 bến cảng", "Phê duyệt cấp 1 bến cảng");
                seedPermission(definitions, "berth", "approvec2", "Phê duyệt C2 bến cảng", "Phê duyệt cấp 2 bến cảng");
                seedPermission(definitions, "berth", "history", "Lịch sử phê duyệt bến cảng",
                                "Xem lịch sử thay đổi bến cảng");

                // 8.2.1 Khu neo đậu (Anchorage)
                seedPermission(definitions, "anchorage", "read", "Xem khu neo đậu",
                                "Tra cứu thông tin khu neo đậu");
                seedPermission(definitions, "anchorage", "read:restricted", "Xem bản ghi hạn chế khu neo đậu",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của khu neo đậu");
                seedPermission(definitions, "anchorage", "read:confidential", "Xem bản ghi mật khu neo đậu",
                                "Xem các bản ghi dữ liệu mức độ Mật của khu neo đậu");
                seedPermission(definitions, "anchorage", "create", "Thêm khu neo đậu",
                                "Tạo mới hồ sơ khu neo đậu");
                seedPermission(definitions, "anchorage", "update", "Cập nhật khu neo đậu",
                                "Chỉnh sửa thông tin khu neo đậu");
                seedPermission(definitions, "anchorage", "delete", "Xóa khu neo đậu", "Xóa khu neo đậu");
                seedPermission(definitions, "anchorage", "approve", "Phê duyệt khu neo đậu",
                                "Phê duyệt dữ liệu khu neo đậu");
                seedPermission(definitions, "anchorage", "approvec1", "Phê duyệt C1 khu neo đậu",
                                "Phê duyệt cấp 1 khu neo đậu");
                seedPermission(definitions, "anchorage", "approvec2", "Phê duyệt C2 khu neo đậu",
                                "Phê duyệt cấp 2 khu neo đậu");
                seedPermission(definitions, "anchorage", "history", "Lịch sử phê duyệt khu neo đậu",
                                "Xem lịch sử thay đổi khu neo đậu");

                // 8.3 Cầu cảng (Pier)
                seedPermission(definitions, "pier", "read", "Xem cầu cảng", "Tra cứu thông tin cầu cảng");
                seedPermission(definitions, "pier", "read:restricted", "Xem bản ghi hạn chế cầu cảng",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của cầu cảng");
                seedPermission(definitions, "pier", "read:confidential", "Xem bản ghi mật cầu cảng",
                                "Xem các bản ghi dữ liệu mức độ Mật của cầu cảng");
                seedPermission(definitions, "pier", "create", "Thêm cầu cảng", "Tạo mới hồ sơ cầu cảng");
                seedPermission(definitions, "pier", "update", "Cập nhật cầu cảng", "Chỉnh sửa thông tin cầu cảng");
                seedPermission(definitions, "pier", "delete", "Xóa cầu cảng", "Xóa cầu cảng");
                seedPermission(definitions, "pier", "approve", "Phê duyệt cầu cảng", "Phê duyệt dữ liệu cầu cảng");
                seedPermission(definitions, "pier", "approvec1", "Phê duyệt C1 cầu cảng", "Phê duyệt cấp 1 cầu cảng");
                seedPermission(definitions, "pier", "approvec2", "Phê duyệt C2 cầu cảng", "Phê duyệt cấp 2 cầu cảng");
                seedPermission(definitions, "pier", "history", "Lịch sử phê duyệt cầu cảng",
                                "Xem lịch sử thay đổi cầu cảng");

                // 8.4 Cảng cạn (Dry Port / ICD)
                seedPermission(definitions, "dryport", "read", "Xem cảng cạn", "Tra cứu thông tin cảng cạn");
                seedPermission(definitions, "dryport", "read:restricted", "Xem bản ghi hạn chế cảng cạn",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của cảng cạn");
                seedPermission(definitions, "dryport", "read:confidential", "Xem bản ghi mật cảng cạn",
                                "Xem các bản ghi dữ liệu mức độ Mật của cảng cạn");
                seedPermission(definitions, "dryport", "create", "Thêm cảng cạn", "Tạo mới hồ sơ cảng cạn");
                seedPermission(definitions, "dryport", "update", "Cập nhật cảng cạn", "Chỉnh sửa thông tin cảng cạn");
                seedPermission(definitions, "dryport", "delete", "Xóa cảng cạn", "Xóa cảng cạn");
                seedPermission(definitions, "dryport", "approve", "Phê duyệt cảng cạn", "Phê duyệt dữ liệu cảng cạn");
                seedPermission(definitions, "dryport", "approvec1", "Phê duyệt C1 cảng cạn",
                                "Phê duyệt cấp 1 cảng cạn");
                seedPermission(definitions, "dryport", "approvec2", "Phê duyệt C2 cảng cạn",
                                "Phê duyệt cấp 2 cảng cạn");
                seedPermission(definitions, "dryport", "history", "Lịch sử phê duyệt cảng cạn",
                                "Xem lịch sử thay đổi cảng cạn");

                // 8.5 Vùng nước hàng hải (Water Zone / Water Area)
                seedPermission(definitions, "waterzone", "read", "Xem vùng nước", "Tra cứu thông tin vùng nước");
                seedPermission(definitions, "waterzone", "create", "Thêm vùng nước", "Tạo mới hồ sơ vùng nước");
                seedPermission(definitions, "waterzone", "update", "Cập nhật vùng nước",
                                "Chỉnh sửa thông tin vùng nước");
                seedPermission(definitions, "waterzone", "delete", "Xóa vùng nước", "Xóa vùng nước");
                seedPermission(definitions, "waterzone", "approve", "Phê duyệt vùng nước",
                                "Phê duyệt dữ liệu vùng nước");
                seedPermission(definitions, "waterzone", "approvec1", "Phê duyệt C1 vùng nước",
                                "Phê duyệt cấp 1 vùng nước");
                seedPermission(definitions, "waterzone", "approvec2", "Phê duyệt C2 vùng nước",
                                "Phê duyệt cấp 2 vùng nước");
                seedPermission(definitions, "waterzone", "history", "Lịch sử phê duyệt vùng nước",
                                "Xem lịch sử thay đổi vùng nước");

                // 8.7 Hệ thống CCTV (CCTV System)
                seedPermission(definitions, "cctv", "read", "Xem hệ thống CCTV", "Tra cứu thông tin hệ thống CCTV");
                seedPermission(definitions, "cctv", "read:restricted", "Xem bản ghi hạn chế CCTV",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của hệ thống CCTV");
                seedPermission(definitions, "cctv", "read:confidential", "Xem bản ghi mật CCTV",
                                "Xem các bản ghi dữ liệu mức độ Mật của hệ thống CCTV");
                seedPermission(definitions, "cctv", "create", "Thêm hệ thống CCTV", "Tạo mới hồ sơ hệ thống CCTV");
                seedPermission(definitions, "cctv", "update", "Cập nhật hệ thống CCTV", "Chỉnh sửa thông tin hệ thống CCTV");
                seedPermission(definitions, "cctv", "delete", "Xóa hệ thống CCTV", "Xóa hệ thống CCTV khỏi hệ thống");
                seedPermission(definitions, "cctv", "approve", "Phê duyệt hệ thống CCTV", "Phê duyệt dữ liệu hệ thống CCTV");
                seedPermission(definitions, "cctv", "history", "Lịch sử phê duyệt CCTV",
                                "Xem lịch sử thay đổi và phê duyệt hệ thống CCTV");

                seedPermission(definitions, "waterarea", "read", "Xem vùng nước cảng",
                                "Tra cứu thông tin vùng nước cảng");
                seedPermission(definitions, "waterarea", "create", "Thêm vùng nước cảng",
                                "Tạo mới vùng nước cảng biển");
                seedPermission(definitions, "waterarea", "update", "Cập nhật vùng nước cảng",
                                "Chỉnh sửa vùng nước cảng biển");
                seedPermission(definitions, "waterarea", "delete", "Xóa vùng nước cảng", "Xóa vùng nước cảng biển");
                seedPermission(definitions, "waterarea", "approvec1", "Phê duyệt C1 vùng nước cảng",
                                "Phê duyệt cấp 1 vùng nước cảng");
                seedPermission(definitions, "waterarea", "approvec2", "Phê duyệt C2 vùng nước cảng",
                                "Phê duyệt cấp 2 vùng nước cảng");
                seedPermission(definitions, "waterarea", "history", "Lịch sử phê duyệt vùng nước cảng",
                                "Xem lịch sử thay đổi vùng nước cảng");

                // 8.6 Quy hoạch & Điều chỉnh quy hoạch cảng biển (Port Planning & Adjustments)
                seedPermission(definitions, "portplanning", "search", "Tìm kiếm quy hoạch cảng",
                                "Tra cứu hồ sơ quy hoạch");
                seedPermission(definitions, "portplanning", "create", "Thêm quy hoạch cảng",
                                "Lập hồ sơ quy hoạch cảng biển");
                seedPermission(definitions, "portplanning", "update", "Cập nhật quy hoạch cảng",
                                "Chỉnh sửa hồ sơ quy hoạch");
                seedPermission(definitions, "portplanning", "delete", "Xóa quy hoạch cảng", "Xóa hồ sơ quy hoạch");

                seedPermission(definitions, "planningadjustment", "create", "Thêm điều chỉnh quy hoạch",
                                "Lập hồ sơ điều chỉnh quy hoạch");
                seedPermission(definitions, "planningadjustment", "update", "Cập nhật điều chỉnh quy hoạch",
                                "Sửa hồ sơ điều chỉnh quy hoạch");
                seedPermission(definitions, "planningadjustment", "delete", "Xóa điều chỉnh quy hoạch",
                                "Xóa hồ sơ điều chỉnh quy hoạch");
                seedPermission(definitions, "planningadjustment", "approve", "Phê duyệt điều chỉnh quy hoạch",
                                "Phê duyệt hồ sơ điều chỉnh quy hoạch");

                // 9. Hạ tầng luồng hàng hải, Đê kè, Sửa chữa tàu, Radar & VTS
                // 9.1 Luồng hàng hải (Navigation Channel)
                seedPermission(definitions, "navigationchannel", "read", "Xem luồng hàng hải",
                                "Tra cứu thông tin luồng hàng hải");
                seedPermission(definitions, "navigationchannel", "read:restricted",
                                "Xem bản ghi hạn chế luồng hàng hải",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của luồng hàng hải");
                seedPermission(definitions, "navigationchannel", "read:confidential", "Xem bản ghi mật luồng hàng hải",
                                "Xem các bản ghi dữ liệu mức độ Mật của luồng hàng hải");
                seedPermission(definitions, "navigationchannel", "create", "Thêm luồng hàng hải",
                                "Tạo mới luồng hàng hải");
                seedPermission(definitions, "navigationchannel", "update", "Cập nhật luồng hàng hải",
                                "Chỉnh sửa thông tin luồng hàng hải");
                seedPermission(definitions, "navigationchannel", "delete", "Xóa luồng hàng hải", "Xóa luồng hàng hải");
                seedPermission(definitions, "navigationchannel", "approvec1", "Phê duyệt C1 luồng hàng hải",
                                "Phê duyệt cấp 1 luồng hàng hải");
                seedPermission(definitions, "navigationchannel", "approvec2", "Phê duyệt C2 luồng hàng hải",
                                "Phê duyệt cấp 2 luồng hàng hải");
                seedPermission(definitions, "navigationchannel", "history", "Lịch sử phê duyệt luồng hàng hải",
                                "Xem lịch sử thay đổi luồng hàng hải");

                // 9.2 Đê kè hàng hải (Dike & Revetment)
                seedPermission(definitions, "dikerevetment", "read", "Xem đê kè", "Tra cứu thông tin đê kè");
                seedPermission(definitions, "dikerevetment", "read:restricted", "Xem bản ghi hạn chế đê kè",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của đê kè");
                seedPermission(definitions, "dikerevetment", "read:confidential", "Xem bản ghi mật đê kè",
                                "Xem các bản ghi dữ liệu mức độ Mật của đê kè");
                seedPermission(definitions, "dikerevetment", "create", "Thêm đê kè", "Tạo mới hồ sơ đê kè");
                seedPermission(definitions, "dikerevetment", "update", "Cập nhật đê kè", "Chỉnh sửa thông tin đê kè");
                seedPermission(definitions, "dikerevetment", "delete", "Xóa đê kè", "Xóa đê kè");
                seedPermission(definitions, "dikerevetment", "approvec1", "Phê duyệt C1 đê kè",
                                "Phê duyệt cấp 1 công trình đê kè");
                seedPermission(definitions, "dikerevetment", "approvec2", "Phê duyệt C2 đê kè",
                                "Phê duyệt cấp 2 công trình đê kè");
                seedPermission(definitions, "dikerevetment", "history", "Lịch sử phê duyệt đê kè",
                                "Xem lịch sử thay đổi đê kè");

                // 9.3 Cơ sở sửa chữa đóng tàu (Ship Repair Facility)
                seedPermission(definitions, "shiprepair", "read", "Xem cơ sở sửa chữa tàu",
                                "Tra cứu thông tin cơ sở sửa chữa tàu");
                seedPermission(definitions, "shiprepair", "read:restricted", "Xem bản ghi hạn chế cơ sở sửa chữa tàu",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của cơ sở sửa chữa tàu");
                seedPermission(definitions, "shiprepair", "read:confidential", "Xem bản ghi mật cơ sở sửa chữa tàu",
                                "Xem các bản ghi dữ liệu mức độ Mật của cơ sở sửa chữa tàu");
                seedPermission(definitions, "shiprepair", "create", "Thêm cơ sở sửa chữa tàu",
                                "Tạo mới cơ sở sửa chữa tàu");
                seedPermission(definitions, "shiprepair", "update", "Cập nhật cơ sở sửa chữa tàu",
                                "Chỉnh sửa thông tin cơ sở sửa chữa tàu");
                seedPermission(definitions, "shiprepair", "delete", "Xóa cơ sở sửa chữa tàu", "Xóa cơ sở sửa chữa tàu");
                seedPermission(definitions, "shiprepair", "approvec1", "Phê duyệt C1 cơ sở sửa chữa tàu",
                                "Phê duyệt cấp 1 cơ sở sửa chữa tàu");
                seedPermission(definitions, "shiprepair", "approvec2", "Phê duyệt C2 cơ sở sửa chữa tàu",
                                "Phê duyệt cấp 2 cơ sở sửa chữa tàu");
                seedPermission(definitions, "shiprepair", "history", "Lịch sử phê duyệt cơ sở sửa chữa tàu",
                                "Xem lịch sử thay đổi cơ sở sửa chữa tàu");

                seedPermission(definitions, "shiprepairfacility", "read", "Xem cơ sở đóng sửa tàu",
                                "Tra cứu cơ sở đóng sửa tàu");
                seedPermission(definitions, "shiprepairfacility", "read:restricted",
                                "Xem bản ghi hạn chế cơ sở đóng sửa tàu",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của cơ sở đóng sửa tàu");
                seedPermission(definitions, "shiprepairfacility", "read:confidential",
                                "Xem bản ghi mật cơ sở đóng sửa tàu",
                                "Xem các bản ghi dữ liệu mức độ Mật của cơ sở đóng sửa tàu");
                seedPermission(definitions, "shiprepairfacility", "create", "Thêm cơ sở đóng sửa tàu",
                                "Tạo mới cơ sở đóng sửa tàu");
                seedPermission(definitions, "shiprepairfacility", "update", "Cập nhật cơ sở đóng sửa tàu",
                                "Chỉnh sửa cơ sở đóng sửa tàu");
                seedPermission(definitions, "shiprepairfacility", "delete", "Xóa cơ sở đóng sửa tàu",
                                "Xóa cơ sở đóng sửa tàu");
                seedPermission(definitions, "shiprepairfacility", "approvec1", "Phê duyệt C1 cơ sở đóng sửa tàu",
                                "Phê duyệt cấp 1 cơ sở đóng sửa tàu");
                seedPermission(definitions, "shiprepairfacility", "approvec2", "Phê duyệt C2 cơ sở đóng sửa tàu",
                                "Phê duyệt cấp 2 cơ sở đóng sửa tàu");
                seedPermission(definitions, "shiprepairfacility", "history", "Lịch sử phê duyệt cơ sở đóng sửa tàu",
                                "Xem lịch sử thay đổi cơ sở đóng sửa tàu");

                // 9.4 Trạm Radar hàng hải (Radar Station)
                seedPermission(definitions, "radarstation", "read", "Xem trạm radar", "Tra cứu thông tin trạm radar");
                seedPermission(definitions, "radarstation", "read:restricted", "Xem bản ghi hạn chế trạm radar",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của trạm radar");
                seedPermission(definitions, "radarstation", "read:confidential", "Xem bản ghi mật trạm radar",
                                "Xem các bản ghi dữ liệu mức độ Mật của trạm radar");
                seedPermission(definitions, "radarstation", "create", "Thêm trạm radar", "Tạo mới trạm radar");
                seedPermission(definitions, "radarstation", "update", "Cập nhật trạm radar",
                                "Chỉnh sửa thông tin trạm radar");
                seedPermission(definitions, "radarstation", "delete", "Xóa trạm radar", "Xóa trạm radar");
                seedPermission(definitions, "radarstation", "approvec1", "Phê duyệt C1 trạm radar",
                                "Phê duyệt cấp 1 trạm radar");
                seedPermission(definitions, "radarstation", "approvec2", "Phê duyệt C2 trạm radar",
                                "Phê duyệt cấp 2 trạm radar");
                seedPermission(definitions, "radarstation", "history", "Lịch sử phê duyệt trạm radar",
                                "Xem lịch sử thay đổi trạm radar");

                // 9.5 Hệ thống thông tin giám sát tàu thuyền VTS (VTS System)
                seedPermission(definitions, "vts", "read", "Xem hệ thống VTS", "Tra cứu thông tin hệ thống VTS");
                seedPermission(definitions, "vts", "read:restricted", "Xem bản ghi hạn chế VTS",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của hệ thống VTS");
                seedPermission(definitions, "vts", "read:confidential", "Xem bản ghi mật VTS",
                                "Xem các bản ghi dữ liệu mức độ Mật của hệ thống VTS");
                seedPermission(definitions, "vts", "create", "Thêm hệ thống VTS", "Tạo mới hệ thống VTS");
                seedPermission(definitions, "vts", "update", "Cập nhật hệ thống VTS",
                                "Chỉnh sửa thông tin hệ thống VTS");
                seedPermission(definitions, "vts", "delete", "Xóa hệ thống VTS", "Xóa hệ thống VTS");
                seedPermission(definitions, "vts", "approvec1", "Phê duyệt C1 hệ thống VTS",
                                "Phê duyệt cấp 1 hệ thống VTS");
                seedPermission(definitions, "vts", "approvec2", "Phê duyệt C2 hệ thống VTS",
                                "Phê duyệt cấp 2 hệ thống VTS");
                seedPermission(definitions, "vts", "history", "Lịch sử phê duyệt hệ thống VTS",
                                "Xem lịch sử thay đổi hệ thống VTS");

                // 9.6 Trung tâm điều hành VTS (VTS Operation Center)
                seedPermission(definitions, "vtsoperationcenter", "read", "Xem trung tâm điều hành VTS",
                                "Tra cứu thông tin trung tâm điều hành VTS");
                seedPermission(definitions, "vtsoperationcenter", "read:restricted", "Xem bản ghi hạn chế trung tâm VTS",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của trung tâm điều hành VTS");
                seedPermission(definitions, "vtsoperationcenter", "read:confidential", "Xem bản ghi mật trung tâm VTS",
                                "Xem các bản ghi dữ liệu mức độ Mật của trung tâm điều hành VTS");
                seedPermission(definitions, "vtsoperationcenter", "create", "Thêm trung tâm điều hành VTS",
                                "Tạo mới trung tâm điều hành VTS");
                seedPermission(definitions, "vtsoperationcenter", "update", "Cập nhật trung tâm điều hành VTS",
                                "Chỉnh sửa thông tin trung tâm điều hành VTS");
                seedPermission(definitions, "vtsoperationcenter", "delete", "Xóa trung tâm điều hành VTS",
                                "Xóa trung tâm điều hành VTS");
                seedPermission(definitions, "vtsoperationcenter", "approvec1", "Phê duyệt C1 trung tâm điều hành VTS",
                                "Phê duyệt cấp 1 trung tâm điều hành VTS");
                seedPermission(definitions, "vtsoperationcenter", "approvec2", "Phê duyệt C2 trung tâm điều hành VTS",
                                "Phê duyệt cấp 2 trung tâm điều hành VTS");
                seedPermission(definitions, "vtsoperationcenter", "history", "Lịch sử phê duyệt trung tâm điều hành VTS",
                                "Xem lịch sử thay đổi trung tâm điều hành VTS");

                // 9.7 Hệ thống trạm bờ AIS (AIS System)
                seedPermission(definitions, "aissystem", "read", "Xem hệ thống trạm bờ AIS",
                                "Tra cứu thông tin hệ thống trạm bờ AIS");
                seedPermission(definitions, "aissystem", "read:restricted", "Xem bản ghi hạn chế AIS",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của hệ thống trạm bờ AIS");
                seedPermission(definitions, "aissystem", "read:confidential", "Xem bản ghi mật AIS",
                                "Xem các bản ghi dữ liệu mức độ Mật của hệ thống trạm bờ AIS");
                seedPermission(definitions, "aissystem", "create", "Thêm hệ thống trạm bờ AIS",
                                "Tạo mới hệ thống trạm bờ AIS");
                seedPermission(definitions, "aissystem", "update", "Cập nhật hệ thống trạm bờ AIS",
                                "Chỉnh sửa thông tin hệ thống trạm bờ AIS");
                seedPermission(definitions, "aissystem", "delete", "Xóa hệ thống trạm bờ AIS",
                                "Xóa hệ thống trạm bờ AIS");
                seedPermission(definitions, "aissystem", "approvec1", "Phê duyệt C1 hệ thống trạm bờ AIS",
                                "Phê duyệt cấp 1 hệ thống trạm bờ AIS");
                seedPermission(definitions, "aissystem", "approvec2", "Phê duyệt C2 hệ thống trạm bờ AIS",
                                "Phê duyệt cấp 2 hệ thống trạm bờ AIS");
                seedPermission(definitions, "aissystem", "history", "Lịch sử phê duyệt hệ thống trạm bờ AIS",
                                "Xem lịch sử thay đổi hệ thống trạm bờ AIS");

                // 10. Trạm hải đăng, Báo hiệu, Phao tiêu & Nhà trạm ven biển (Stations & Aids
                // to Navigation)
                seedPermission(definitions, "station", "read", "Xem nhà trạm", "Tra cứu danh mục nhà trạm");
                seedPermission(definitions, "station", "read:restricted", "Xem bản ghi hạn chế nhà trạm",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của nhà trạm");
                seedPermission(definitions, "station", "read:confidential", "Xem bản ghi mật nhà trạm",
                                "Xem các bản ghi dữ liệu mức độ Mật của nhà trạm");
                seedPermission(definitions, "station", "create", "Thêm nhà trạm", "Tạo mới nhà trạm hàng hải");
                seedPermission(definitions, "station", "update", "Cập nhật nhà trạm", "Chỉnh sửa thông tin nhà trạm");
                seedPermission(definitions, "station", "delete", "Xóa nhà trạm", "Xóa nhà trạm hàng hải");
                // Nhóm quyền phê duyệt dùng cho toàn bộ endpoint /api/v1/stations/** —
                // PermissionMiddleware quy resource của các đường dẫn này về "station".
                seedPermission(definitions, "station", "approve", "Phê duyệt nhà trạm", "Phê duyệt hồ sơ nhà trạm");
                seedPermission(definitions, "station", "approvec1", "Phê duyệt C1 nhà trạm",
                                "Phê duyệt cấp 1 (Cảng vụ/Chi cục) hồ sơ nhà trạm");
                seedPermission(definitions, "station", "approvec2", "Phê duyệt C2 nhà trạm",
                                "Phê duyệt cấp 2 (Cục Hàng hải) hồ sơ nhà trạm");
                seedPermission(definitions, "station", "reject", "Từ chối nhà trạm", "Từ chối phê duyệt hồ sơ nhà trạm");

                seedPermission(definitions, "beaconstation", "read", "Xem đèn biển và nhà trạm", "Tra cứu thông tin đèn biển và nhà trạm");
                seedPermission(definitions, "beaconstation", "read:restricted", "Xem bản ghi hạn chế đèn biển và nhà trạm",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của đèn biển và nhà trạm");
                seedPermission(definitions, "beaconstation", "read:confidential", "Xem bản ghi mật đèn biển và nhà trạm",
                                "Xem các bản ghi dữ liệu mức độ Mật của đèn biển và nhà trạm");
                seedPermission(definitions, "beaconstation", "create", "Thêm đèn biển và nhà trạm", "Tạo mới đèn biển và nhà trạm");
                seedPermission(definitions, "beaconstation", "update", "Cập nhật đèn biển và nhà trạm",
                                "Chỉnh sửa thông tin đèn biển và nhà trạm");
                seedPermission(definitions, "beaconstation", "delete", "Xóa đèn biển và nhà trạm", "Xóa đèn biển và nhà trạm");
                seedPermission(definitions, "beaconstation", "approvec1", "Phê duyệt C1 đèn biển và nhà trạm",
                                "Phê duyệt cấp 1 đèn biển và nhà trạm");
                seedPermission(definitions, "beaconstation", "approvec2", "Phê duyệt C2 đèn biển và nhà trạm",
                                "Phê duyệt cấp 2 đèn biển và nhà trạm");
                seedPermission(definitions, "beaconstation", "history", "Lịch sử phê duyệt đèn biển và nhà trạm",
                                "Xem lịch sử thay đổi đèn biển và nhà trạm");

                seedPermission(definitions, "buoystation", "read", "Xem trạm phao", "Tra cứu thông tin trạm phao");
                seedPermission(definitions, "buoystation", "read:restricted", "Xem bản ghi hạn chế trạm phao",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của trạm phao");
                seedPermission(definitions, "buoystation", "read:confidential", "Xem bản ghi mật trạm phao",
                                "Xem các bản ghi dữ liệu mức độ Mật của trạm phao");
                seedPermission(definitions, "buoystation", "create", "Thêm trạm phao", "Tạo mới trạm phao");
                seedPermission(definitions, "buoystation", "update", "Cập nhật trạm phao",
                                "Chỉnh sửa thông tin trạm phao");
                seedPermission(definitions, "buoystation", "delete", "Xóa trạm phao", "Xóa trạm phao");
                seedPermission(definitions, "buoystation", "approvec1", "Phê duyệt C1 trạm phao",
                                "Phê duyệt cấp 1 trạm phao");
                seedPermission(definitions, "buoystation", "approvec2", "Phê duyệt C2 trạm phao",
                                "Phê duyệt cấp 2 trạm phao");
                seedPermission(definitions, "buoystation", "history", "Lịch sử phê duyệt trạm phao",
                                "Xem lịch sử thay đổi trạm phao");

                seedPermission(definitions, "buoy", "read", "Xem phao tiêu", "Tra cứu thông tin phao báo hiệu");
                seedPermission(definitions, "buoy", "read:restricted", "Xem bản ghi hạn chế phao tiêu",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của phao báo hiệu");
                seedPermission(definitions, "buoy", "read:confidential", "Xem bản ghi mật phao tiêu",
                                "Xem các bản ghi dữ liệu mức độ Mật của phao báo hiệu");
                seedPermission(definitions, "buoy", "create", "Thêm phao tiêu", "Tạo mới phao báo hiệu");
                seedPermission(definitions, "buoy", "update", "Cập nhật phao tiêu",
                                "Chỉnh sửa thông tin phao báo hiệu");
                seedPermission(definitions, "buoy", "delete", "Xóa phao tiêu", "Xóa phao báo hiệu");
                seedPermission(definitions, "buoy", "approvec1", "Phê duyệt C1 phao tiêu",
                                "Phê duyệt cấp 1 phao báo hiệu");
                seedPermission(definitions, "buoy", "approvec2", "Phê duyệt C2 phao tiêu",
                                "Phê duyệt cấp 2 phao báo hiệu");
                seedPermission(definitions, "buoy", "history", "Lịch sử phê duyệt phao tiêu",
                                "Xem lịch sử thay đổi phao báo hiệu");

                seedPermission(definitions, "lighthousestation", "read", "Xem trạm hải đăng",
                                "Tra cứu thông tin trạm hải đăng");
                seedPermission(definitions, "lighthousestation", "read:restricted", "Xem bản ghi hạn chế trạm hải đăng",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của trạm hải đăng");
                seedPermission(definitions, "lighthousestation", "read:confidential", "Xem bản ghi mật trạm hải đăng",
                                "Xem các bản ghi dữ liệu mức độ Mật của trạm hải đăng");
                seedPermission(definitions, "lighthousestation", "create", "Thêm trạm hải đăng",
                                "Tạo mới trạm hải đăng");
                seedPermission(definitions, "lighthousestation", "update", "Cập nhật trạm hải đăng",
                                "Chỉnh sửa thông tin trạm hải đăng");
                seedPermission(definitions, "lighthousestation", "delete", "Xóa trạm hải đăng", "Xóa trạm hải đăng");
                seedPermission(definitions, "lighthousestation", "approvec1", "Phê duyệt C1 trạm hải đăng",
                                "Phê duyệt cấp 1 trạm hải đăng");
                seedPermission(definitions, "lighthousestation", "approvec2", "Phê duyệt C2 trạm hải đăng",
                                "Phê duyệt cấp 2 trạm hải đăng");
                seedPermission(definitions, "lighthousestation", "history", "Lịch sử phê duyệt trạm hải đăng",
                                "Xem lịch sử thay đổi trạm hải đăng");

                seedPermission(definitions, "coastalstation", "read", "Xem trạm bờ", "Tra cứu trạm thông tin bờ");
                seedPermission(definitions, "coastalstation", "read:restricted", "Xem bản ghi hạn chế trạm bờ",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của trạm thông tin bờ");
                seedPermission(definitions, "coastalstation", "read:confidential", "Xem bản ghi mật trạm bờ",
                                "Xem các bản ghi dữ liệu mức độ Mật của trạm thông tin bờ");
                seedPermission(definitions, "coastalstation", "create", "Thêm trạm bờ", "Tạo mới trạm thông tin bờ");
                seedPermission(definitions, "coastalstation", "update", "Cập nhật trạm bờ",
                                "Chỉnh sửa trạm thông tin bờ");
                seedPermission(definitions, "coastalstation", "delete", "Xóa trạm bờ", "Xóa trạm thông tin bờ");
                seedPermission(definitions, "coastalstation", "approve", "Phê duyệt trạm bờ", "Phê duyệt trạm thông tin bờ");
                seedPermission(definitions, "coastalstation", "approvec1", "Phê duyệt C1 trạm bờ",
                                "Phê duyệt cấp 1 (Cảng vụ/Chi cục) trạm thông tin bờ");
                seedPermission(definitions, "coastalstation", "approvec2", "Phê duyệt C2 trạm bờ",
                                "Phê duyệt cấp 2 (Cục Hàng hải) trạm thông tin bờ");
                seedPermission(definitions, "coastalstation", "reject", "Từ chối trạm bờ",
                                "Từ chối phê duyệt trạm thông tin bờ");

                seedPermission(definitions, "specialstation", "read", "Xem trạm chuyên dùng",
                                "Tra cứu trạm chuyên dùng");
                seedPermission(definitions, "specialstation", "read:restricted", "Xem bản ghi hạn chế trạm chuyên dùng",
                                "Xem các bản ghi dữ liệu mức độ Hạn chế của trạm chuyên dùng");
                seedPermission(definitions, "specialstation", "read:confidential", "Xem bản ghi mật trạm chuyên dùng",
                                "Xem các bản ghi dữ liệu mức độ Mật của trạm chuyên dùng");
                seedPermission(definitions, "specialstation", "create", "Thêm trạm chuyên dùng",
                                "Tạo mới trạm chuyên dùng");
                seedPermission(definitions, "specialstation", "update", "Cập nhật trạm chuyên dùng",
                                "Chỉnh sửa trạm chuyên dùng");
                seedPermission(definitions, "specialstation", "delete", "Xóa trạm chuyên dùng", "Xóa trạm chuyên dùng");
                seedPermission(definitions, "specialstation", "approve", "Phê duyệt trạm chuyên dùng", "Phê duyệt trạm chuyên dùng");
                seedPermission(definitions, "specialstation", "approvec1", "Phê duyệt C1 trạm chuyên dùng", "Phê duyệt cấp 1 trạm chuyên dùng");
                seedPermission(definitions, "specialstation", "approvec2", "Phê duyệt C2 trạm chuyên dùng", "Phê duyệt cấp 2 trạm chuyên dùng");
                seedPermission(definitions, "specialstation", "reject", "Từ chối trạm chuyên dùng", "Từ chối phê duyệt trạm chuyên dùng");

                // 10.3 Đài thông tin vệ tinh Inmarsat (Coastal Station Inmarsat - M-004)
                seedPermission(definitions, "coastalstationinmarsat", "read", "Xem đài Inmarsat", "Xem danh sách và chi tiết đài Inmarsat");
                seedPermission(definitions, "coastalstationinmarsat", "create", "Thêm đài Inmarsat", "Tạo mới đài Inmarsat");
                seedPermission(definitions, "coastalstationinmarsat", "update", "Cập nhật đài Inmarsat", "Chỉnh sửa đài Inmarsat");
                seedPermission(definitions, "coastalstationinmarsat", "delete", "Xóa đài Inmarsat", "Xóa đài Inmarsat");
                seedPermission(definitions, "coastalstationinmarsat", "approve", "Phê duyệt đài Inmarsat", "Phê duyệt đài Inmarsat");
                seedPermission(definitions, "coastalstationinmarsat", "approvec1", "Phê duyệt C1 đài Inmarsat", "Phê duyệt cấp 1 (Cảng vụ/Chi cục) đài Inmarsat");
                seedPermission(definitions, "coastalstationinmarsat", "approvec2", "Phê duyệt C2 đài Inmarsat", "Phê duyệt cấp 2 (Cục Hàng hải) đài Inmarsat");
                seedPermission(definitions, "coastalstationinmarsat", "reject", "Từ chối đài Inmarsat", "Từ chối phê duyệt đài Inmarsat");

                // 10.4 Đài Cospas-Sarsat (Coastal Station Cospas-Sarsat - M-004)
                seedPermission(definitions, "coastalstationcospassarsat", "read", "Xem đài Cospas-Sarsat",
                                "Xem danh sách và chi tiết đài Cospas-Sarsat");
                seedPermission(definitions, "coastalstationcospassarsat", "create", "Thêm đài Cospas-Sarsat",
                                "Tạo mới đài Cospas-Sarsat");
                seedPermission(definitions, "coastalstationcospassarsat", "update", "Cập nhật đài Cospas-Sarsat",
                                "Chỉnh sửa đài Cospas-Sarsat");
                seedPermission(definitions, "coastalstationcospassarsat", "delete", "Xóa đài Cospas-Sarsat",
                                "Xóa đài Cospas-Sarsat");
                seedPermission(definitions, "coastalstationcospassarsat", "approve", "Phê duyệt đài Cospas-Sarsat",
                                "Phê duyệt đài Cospas-Sarsat");
                seedPermission(definitions, "coastalstationcospassarsat", "approvec1", "Phê duyệt C1 đài Cospas-Sarsat",
                                "Phê duyệt cấp 1 (Cảng vụ/Chi cục) đài Cospas-Sarsat");
                seedPermission(definitions, "coastalstationcospassarsat", "approvec2", "Phê duyệt C2 đài Cospas-Sarsat",
                                "Phê duyệt cấp 2 (Cục Hàng hải) đài Cospas-Sarsat");
                seedPermission(definitions, "coastalstationcospassarsat", "reject", "Từ chối đài Cospas-Sarsat",
                                "Từ chối phê duyệt đài Cospas-Sarsat");

                // 11. Quản lý tài sản kết cấu hạ tầng, Điều chuyển, Kiểm kê & Bảo trì (Asset
                // Management & Operations)
                seedPermission(definitions, "movementrequest", "manage", "Quản lý yêu cầu điều chuyển",
                                "Toàn quyền lập và xử lý yêu cầu điều chuyển tài sản kết cấu hạ tầng");
                seedPermission(definitions, "inventoryplan", "manage", "Quản lý kế hoạch kiểm kê",
                                "Toàn quyền lập và theo dõi kế hoạch kiểm kê tài sản");
                seedPermission(definitions, "inventoryreport", "manage", "Quản lý báo cáo kiểm kê",
                                "Toàn quyền tổng hợp và phê duyệt báo cáo kết quả kiểm kê");
                seedPermission(definitions, "inventoryasset", "manage", "Quản lý tài sản kiểm kê",
                                "Kiểm kê chi tiết hiện trạng tài sản kết cấu hạ tầng");
                seedPermission(definitions, "infraasset", "manage", "Quản lý tài sản KCHT",
                                "Quản trị danh mục và hồ sơ tài sản kết cấu hạ tầng");
                seedPermission(definitions, "assetdecrease", "manage", "Quản lý giảm tài sản",
                                "Lập và xử lý hồ sơ giảm/thanh lý tài sản");
                seedPermission(definitions, "assetincrease", "manage", "Quản lý tăng tài sản",
                                "Lập và xử lý hồ sơ tăng tài sản");
                seedPermission(definitions, "assetexploitation", "manage", "Quản lý khai thác tài sản",
                                "Quản lý phương án khai thác và cho thuê tài sản");
                seedPermission(definitions, "asset", "exploitation", "Khai thác tài sản",
                                "Khai thác tài sản kết cấu hạ tầng");
                seedPermission(definitions, "asset", "inventory", "Kiểm kê tài sản", "Kiểm kê tài sản kết cấu hạ tầng");
                seedPermission(definitions, "approvalrecord", "manage", "Quản lý hồ sơ phê duyệt",
                                "Quản lý và tra cứu hồ sơ phê duyệt");
                seedPermission(definitions, "processingrecord", "manage", "Quản lý biên bản xử lý",
                                "Lập và xử lý biên bản hiện trường");

                seedPermission(definitions, "maintenanceplan", "manage", "Quản lý kế hoạch bảo trì",
                                "Toàn quyền quản lý kế hoạch bảo trì");
                seedPermission(definitions, "maintenanceplan", "read", "Xem kế hoạch bảo trì",
                                "Tra cứu thông tin kế hoạch bảo trì");
                seedPermission(definitions, "maintenanceplan", "create", "Thêm kế hoạch bảo trì",
                                "Lập kế hoạch bảo trì tài sản");
                seedPermission(definitions, "maintenanceplan", "update", "Cập nhật kế hoạch bảo trì",
                                "Chỉnh sửa kế hoạch bảo trì");
                seedPermission(definitions, "maintenanceplan", "delete", "Xóa kế hoạch bảo trì",
                                "Xóa kế hoạch bảo trì");
                seedPermission(definitions, "maintenanceplan", "report", "Báo cáo bảo trì",
                                "Lập báo cáo thực hiện bảo trì");

                seedPermission(definitions, "operationplan", "manage", "Quản lý kế hoạch vận hành",
                                "Toàn quyền quản lý kế hoạch vận hành");
                seedPermission(definitions, "operationplan", "read", "Xem kế hoạch vận hành",
                                "Tra cứu thông tin kế hoạch vận hành");
                seedPermission(definitions, "operationplan", "create", "Thêm kế hoạch vận hành",
                                "Lập kế hoạch vận hành khai thác");
                seedPermission(definitions, "operationplan", "update", "Cập nhật kế hoạch vận hành",
                                "Chỉnh sửa kế hoạch vận hành");
                seedPermission(definitions, "operationplan", "delete", "Xóa kế hoạch vận hành",
                                "Xóa kế hoạch vận hành");

                seedPermission(definitions, "incident", "manage", "Quản lý sự cố",
                                "Toàn quyền tiếp nhận và xử lý sự cố");
                seedPermission(definitions, "incident", "create", "Báo cáo sự cố", "Ghi nhận sự cố kết cấu hạ tầng");
                seedPermission(definitions, "incident", "update", "Cập nhật sự cố", "Cập nhật thông tin sự cố");
                seedPermission(definitions, "incident", "delete", "Xóa sự cố", "Xóa hồ sơ sự cố");
                seedPermission(definitions, "incident", "progress", "Tiến độ xử lý sự cố",
                                "Cập nhật tiến độ khắc phục sự cố");

                seedPermission(definitions, "gispoint", "manage", "Quản lý điểm GIS",
                                "Toàn quyền quản trị điểm tọa độ GIS");
                seedPermission(definitions, "gispoint", "read", "Xem điểm GIS", "Tra cứu điểm tọa độ GIS");
                seedPermission(definitions, "gispoint", "create", "Thêm điểm GIS", "Tạo mới điểm tọa độ GIS");
                seedPermission(definitions, "gispoint", "update", "Cập nhật điểm GIS", "Chỉnh sửa điểm tọa độ GIS");
                seedPermission(definitions, "gispoint", "delete", "Xóa điểm GIS", "Xóa điểm tọa độ GIS");
                seedPermission(definitions, "gispoint", "approvec1", "Phê duyệt C1 điểm GIS",
                                "Phê duyệt cấp 1 điểm tọa độ GIS");
                seedPermission(definitions, "gispoint", "approvec2", "Phê duyệt C2 điểm GIS",
                                "Phê duyệt cấp 2 điểm tọa độ GIS");
                seedPermission(definitions, "gispoint", "history", "Lịch sử phê duyệt điểm GIS",
                                "Xem lịch sử thay đổi điểm tọa độ GIS");

                seedPermission(definitions, "pointobject", "read", "Xem đối tượng điểm GIS",
                                "Tra cứu đối tượng điểm GIS");
                seedPermission(definitions, "pointobject", "create", "Thêm đối tượng điểm GIS",
                                "Tạo mới đối tượng điểm GIS");
                seedPermission(definitions, "pointobject", "update", "Cập nhật đối tượng điểm GIS",
                                "Chỉnh sửa đối tượng điểm GIS");
                seedPermission(definitions, "pointobject", "delete", "Xóa đối tượng điểm GIS",
                                "Xóa đối tượng điểm GIS");
                seedPermission(definitions, "pointobject", "approvec1", "Phê duyệt C1 đối tượng điểm GIS",
                                "Phê duyệt cấp 1 đối tượng điểm GIS");
                seedPermission(definitions, "pointobject", "approvec2", "Phê duyệt C2 đối tượng điểm GIS",
                                "Phê duyệt cấp 2 đối tượng điểm GIS");
                seedPermission(definitions, "pointobject", "history", "Lịch sử phê duyệt đối tượng điểm GIS",
                                "Xem lịch sử thay đổi đối tượng điểm GIS");

                seedPermission(definitions, "gisline", "manage", "Quản lý đường GIS",
                                "Toàn quyền quản trị đường tuyến GIS");
                seedPermission(definitions, "gisline", "read", "Xem đường GIS", "Tra cứu đường tuyến GIS");
                seedPermission(definitions, "gisline", "create", "Thêm đường GIS", "Tạo mới đường tuyến GIS");
                seedPermission(definitions, "gisline", "update", "Cập nhật đường GIS", "Chỉnh sửa đường tuyến GIS");
                seedPermission(definitions, "gisline", "delete", "Xóa đường GIS", "Xóa đường tuyến GIS");
                seedPermission(definitions, "gisline", "approvec1", "Phê duyệt C1 đường GIS",
                                "Phê duyệt cấp 1 đường tuyến GIS");
                seedPermission(definitions, "gisline", "approvec2", "Phê duyệt C2 đường GIS",
                                "Phê duyệt cấp 2 đường tuyến GIS");
                seedPermission(definitions, "gisline", "history", "Lịch sử phê duyệt đường GIS",
                                "Xem lịch sử thay đổi đường tuyến GIS");

                seedPermission(definitions, "lineobject", "read", "Xem đối tượng đường GIS",
                                "Tra cứu đối tượng đường GIS");
                seedPermission(definitions, "lineobject", "create", "Thêm đối tượng đường GIS",
                                "Tạo mới đối tượng đường GIS");
                seedPermission(definitions, "lineobject", "update", "Cập nhật đối tượng đường GIS",
                                "Chỉnh sửa đối tượng đường GIS");
                seedPermission(definitions, "lineobject", "delete", "Xóa đối tượng đường GIS",
                                "Xóa đối tượng đường GIS");
                seedPermission(definitions, "lineobject", "approvec1", "Phê duyệt C1 đối tượng đường GIS",
                                "Phê duyệt cấp 1 đối tượng đường GIS");
                seedPermission(definitions, "lineobject", "approvec2", "Phê duyệt C2 đối tượng đường GIS",
                                "Phê duyệt cấp 2 đối tượng đường GIS");
                seedPermission(definitions, "lineobject", "history", "Lịch sử phê duyệt đối tượng đường GIS",
                                "Xem lịch sử thay đổi đối tượng đường GIS");

                seedPermission(definitions, "gispolygon", "manage", "Quản lý vùng GIS",
                                "Toàn quyền quản trị vùng polygon GIS");
                seedPermission(definitions, "gispolygon", "read", "Xem vùng GIS", "Tra cứu vùng polygon GIS");
                seedPermission(definitions, "gispolygon", "create", "Thêm vùng GIS", "Tạo mới vùng polygon GIS");
                seedPermission(definitions, "gispolygon", "update", "Cập nhật vùng GIS", "Chỉnh sửa vùng polygon GIS");
                seedPermission(definitions, "gispolygon", "delete", "Xóa vùng GIS", "Xóa vùng polygon GIS");
                seedPermission(definitions, "gispolygon", "approvec1", "Phê duyệt C1 vùng GIS",
                                "Phê duyệt cấp 1 vùng polygon GIS");
                seedPermission(definitions, "gispolygon", "approvec2", "Phê duyệt C2 vùng GIS",
                                "Phê duyệt cấp 2 vùng polygon GIS");
                seedPermission(definitions, "gispolygon", "history", "Lịch sử phê duyệt vùng GIS",
                                "Xem lịch sử thay đổi vùng polygon GIS");

                seedPermission(definitions, "polygonobject", "read", "Xem đối tượng vùng GIS",
                                "Tra cứu đối tượng vùng GIS");
                seedPermission(definitions, "polygonobject", "create", "Thêm đối tượng vùng GIS",
                                "Tạo mới đối tượng vùng GIS");
                seedPermission(definitions, "polygonobject", "update", "Cập nhật đối tượng vùng GIS",
                                "Chỉnh sửa đối tượng vùng GIS");
                seedPermission(definitions, "polygonobject", "delete", "Xóa đối tượng vùng GIS",
                                "Xóa đối tượng vùng GIS");
                seedPermission(definitions, "polygonobject", "approvec1", "Phê duyệt C1 đối tượng vùng GIS",
                                "Phê duyệt cấp 1 đối tượng vùng GIS");
                seedPermission(definitions, "polygonobject", "approvec2", "Phê duyệt C2 đối tượng vùng GIS",
                                "Phê duyệt cấp 2 đối tượng vùng GIS");
                seedPermission(definitions, "polygonobject", "history", "Lịch sử phê duyệt đối tượng vùng GIS",
                                "Xem lịch sử thay đổi đối tượng vùng GIS");

                int inserted = 0;
                int updated = 0;
                Map<String, Permission> existingMap = permissionRepository.findAll().stream()
                                .collect(java.util.stream.Collectors.toMap(Permission::getCode, p -> p, (a, b) -> a));
                List<Permission> toSave = new ArrayList<>();
                for (Permission definition : definitions.values()) {
                        Permission p = existingMap.get(definition.getCode());
                        if (p == null) {
                                toSave.add(definition);
                                inserted++;
                        } else {
                                if (!java.util.Objects.equals(p.getName(), definition.getName())
                                                || !java.util.Objects.equals(p.getDescription(),
                                                                definition.getDescription())) {
                                        p.setName(definition.getName());
                                        p.setDescription(definition.getDescription());
                                        toSave.add(p);
                                        updated++;
                                }
                        }
                }
                if (!toSave.isEmpty()) {
                        permissionRepository.saveAll(toSave);
                }
                // Clean up deprecated / redundant permissions safely
                if (jdbcTemplate != null) {
                        try {
                                jdbcTemplate.execute("""
                                        DO $$
                                        BEGIN
                                            IF to_regclass('public.user_permission_override') IS NOT NULL THEN
                                                DELETE FROM user_permission_override
                                                WHERE permission_code IN (
                                                    'user:edit', 'group:edit', 'user:delete', 'group:delete',
                                                    'group:manage', 'orgunit:manage', 'orgunit:approve', 'orgunit:scope_all'
                                                );
                                            END IF;

                                            IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
                                                DELETE FROM user_group_permissions
                                                WHERE permission IN (
                                                    'user:edit', 'group:edit', 'user:delete', 'group:delete',
                                                    'group:manage', 'orgunit:manage', 'orgunit:approve', 'orgunit:scope_all'
                                                );
                                            END IF;

                                            IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
                                                DELETE FROM role_permissions
                                                WHERE permission_id IN (
                                                    SELECT id
                                                    FROM permissions
                                                    WHERE code IN (
                                                        'user:edit', 'group:edit', 'user:delete', 'group:delete',
                                                        'group:manage', 'orgunit:manage', 'orgunit:approve', 'orgunit:scope_all'
                                                    )
                                                );
                                            END IF;

                                            IF to_regclass('public.permissions') IS NOT NULL THEN
                                                DELETE FROM permissions
                                                WHERE code IN (
                                                    'user:edit', 'group:edit', 'user:delete', 'group:delete',
                                                    'group:manage', 'orgunit:manage', 'orgunit:approve', 'orgunit:scope_all'
                                                );
                                            END IF;
                                        END $$;
                                        """);
                        } catch (Exception ex) {
                                log.debug("Native DB permission cleanup notice: {}", ex.getMessage());
                        }
                }

                if (inserted > 0 || updated > 0) {
                        log.info("Permissions sync complete: inserted={}, updated={}", inserted, updated);
                }
        }

        private void seedPermission(Map<String, Permission> definitions, String resource, String action, String name,
                        String description) {
                String code = resource + ":" + action;
                if (definitions.containsKey(code))
                        return;

                Permission permission = new Permission();
                permission.setCode(code);
                permission.setName(name != null ? name : code);
                permission.setDescription(description != null ? description : "Quyền hạn " + code);
                permission.setResource(resource);
                permission.setAction(action);
                definitions.put(code, permission);
        }
}
