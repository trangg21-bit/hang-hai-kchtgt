package com.hanghai.kchtg.config;

import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import com.hanghai.kchtg.user.entity.SystemMenu;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.SystemMenuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Seeder cho Role và Permission (RBAC).
 * <p>
 * Chạy tự động khi khởi động ứng dụng (profile "local"), tạo 8 vai trò với
 * ~45 quyền hạn nếu chưa có role nào trong database.
 * </p>
 * <p>
 * Các role được định nghĩa theo authorization-rules.md:
 * ROLE_SYSTEM_ADMIN, ROLE_ADMIN, ROLE_LEADER, ROLE_SPECIALIST,
 * ROLE_PORT_OPERATOR, ROLE_PUBLIC_USER, ROLE_INTEGRATION, ROLE_SECURITY_MONITOR.
 * </p>
 */
@Component
@Order(1)
@Profile({"local", "local-h2", "prod"})
@RequiredArgsConstructor
@Slf4j
public class RolePermissionSeeder implements CommandLineRunner {

    private static final String[] ROLE_CODES = {
            "ROLE_SYSTEM_ADMIN",
            "ROLE_ADMIN",
            "ROLE_LEADER",
            "ROLE_SPECIALIST",
            "ROLE_PORT_OPERATOR",
            "ROLE_PUBLIC_USER",
            "ROLE_INTEGRATION",
            "ROLE_SECURITY_MONITOR"
    };

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final SystemMenuRepository systemMenuRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🔐 Starting role/permission seeding...");

        // If any of the known roles already exist, skip seeding entirely.
        // (Roles are only seeded once; subsequent runs do not overwrite existing data.)
        for (String roleCode : ROLE_CODES) {
            if (roleRepository.existsByCode(roleCode)) {
                log.info("⏭️ Role '{}' already exists, skipping role/permission seeding...", roleCode);
                // Still attempt to update permissions for existing roles.
                upsertMissingPermissions();
                assignSystemAdminMenus();
                return;
            }
        }

        log.info("📦 Seeding roles and permissions...");

        // 1. Build all permissions first, indexed by code.
        Map<String, Permission> permissionsByCode = new LinkedHashMap<>();

        // ---- user management ----
        seedPermission(permissionsByCode, "user", "manage", "Quản lý người dùng",
                "Tạo, sửa, xóa, khóa/mở khóa người dùng");
        seedPermission(permissionsByCode, "user", "read", "Xem người dùng",
                "Xem danh sách và chi tiết người dùng");
        seedPermission(permissionsByCode, "user", "approve", "Phê duyệt người dùng",
                "Phê duyệt tài khoản người dùng mới");

        // ---- role management ----
        seedPermission(permissionsByCode, "role", "manage", "Quản lý vai trò",
                "Tạo, sửa, xóa, gán vai trò");

        // ---- org unit management ----
        seedPermission(permissionsByCode, "orgunit", "manage", "Quản lý đơn vị",
                "Tạo, sửa, xóa đơn vị tổ chức");
        seedPermission(permissionsByCode, "orgunit", "read", "Xem đơn vị",
                "Xem danh sách và chi tiết đơn vị tổ chức");
        seedPermission(permissionsByCode, "orgunit", "approve", "Phê duyệt đơn vị",
                "Phê duyệt đơn vị tổ chức");

        // ---- group management ----
        seedPermission(permissionsByCode, "group", "manage", "Quản lý nhóm",
                "Tạo, sửa, xóa nhóm người dùng");
        seedPermission(permissionsByCode, "group", "create", "Tạo nhóm",
                "Tạo nhóm người dùng mới");
        seedPermission(permissionsByCode, "group", "edit", "Sửa nhóm",
                "Chỉnh sửa thông tin nhóm");
        seedPermission(permissionsByCode, "group", "delete", "Xóa nhóm",
                "Xóa nhóm người dùng");
        seedPermission(permissionsByCode, "group", "copy", "Sao chép nhóm",
                "Sao chép nhóm người dùng");
        seedPermission(permissionsByCode, "group", "history", "Xem lịch sử nhóm",
                "Xem lịch sử thay đổi nhóm");
        seedPermission(permissionsByCode, "group", "permission", "Phân quyền nhóm",
                "Gán vai trò cho nhóm và cấp quyền kế thừa cho thành viên");
        seedPermission(permissionsByCode, "groupmember", "manage", "Quản lý thành viên nhóm",
                "Thêm, xóa thành viên khỏi nhóm");

        // ---- document management (F-128) ----
        seedPermission(permissionsByCode, "document", "read", "Xem văn bản pháp lý",
                "Xem danh sách và chi tiết văn bản pháp lý");
        seedPermission(permissionsByCode, "document", "create", "Tạo văn bản pháp lý",
                "Tạo mới văn bản pháp lý");
        seedPermission(permissionsByCode, "document", "update", "Sửa văn bản pháp lý",
                "Chỉnh sửa văn bản pháp lý");
        seedPermission(permissionsByCode, "document", "delete", "Xóa văn bản pháp lý",
                "Xóa văn bản pháp lý");

        // ---- admin/system settings ----
        seedPermission(permissionsByCode, "admin", "manage", "Quản trị hệ thống",
                "Cấu hình hệ thống, chính sách bảo mật");
        seedPermission(permissionsByCode, "admin", "view", "Xem log hệ thống",
                "Xem nhật ký truy cập và audit log");

        // ---- log management ----
        seedPermission(permissionsByCode, "log", "manage", "Quản lý log",
                "Xem, xuất, lưu trữ audit log");

        // ---- map/chart management ----
        seedPermission(permissionsByCode, "map", "manage", "Quản lý bản đồ",
                "Tạo, sửa, xóa lớp bản đồ và overlay");

        // ---- data approval ----
        seedPermission(permissionsByCode, "data", "approve", "Phê duyệt dữ liệu",
                "Phê duyệt dữ liệu do chuyên viên trình");

        // ---- data create ----
        seedPermission(permissionsByCode, "data", "create", "Tạo dữ liệu",
                "Thêm mới dữ liệu (point, line, polygon)");

        // ---- data update ----
        seedPermission(permissionsByCode, "data", "update", "Chỉnh sửa dữ liệu",
                "Sửa dữ liệu hiện có");

        // ---- data read ----
        seedPermission(permissionsByCode, "data", "read", "Xem dữ liệu",
                "Xem danh sách và chi tiết dữ liệu");

        // ---- data write (alias for create+update, used by integration) ----
        seedPermission(permissionsByCode, "data", "write", "Viết dữ liệu",
                "Tạo và chỉnh sửa dữ liệu (tổng hợp)");

        // ---- report ----
        seedPermission(permissionsByCode, "report", "read", "Xem báo cáo",
                "Xem báo cáo và thống kê");

        // ---- check (kiểm tra, rà soát) ----
        seedPermission(permissionsByCode, "check", "read", "Xem kết quả kiểm tra",
                "Xem kết quả rà soát, kiểm tra dữ liệu");

        // ---- approve (approval action alias) ----
        seedPermission(permissionsByCode, "approve", "action", "Phê duyệt",
                "Thực hiện thao tác phê duyệt");

        // ---- connection ----
        seedPermission(permissionsByCode, "connection", "manage", "Quản lý kết nối",
                "Cấu hình và quản lý kết nối liên thông");
        seedPermission(permissionsByCode, "connection", "read", "Xem kết nối",
                "Xem thông tin kết nối liên thông");

        // ---- api sharing ----
        seedPermission(permissionsByCode, "api", "share", "Chia sẻ API",
                "Cho phép chia sẻ dữ liệu qua API");

        // ---- security monitoring ----
        seedPermission(permissionsByCode, "security", "monitor", "Giám sát an ninh",
                "Giám sát an toàn thông tin, SIEM");
        seedPermission(permissionsByCode, "security", "read", "Xem báo cáo an ninh",
                "Xem báo cáo an ninh, cảnh báo");

        // ---- M-003 entity permissions (5 entities × 7 actions) ----
        // navigationchannel
        seedPermission(permissionsByCode, "navigationchannel", "create", "Tạo luồng hàng hải",
                "Tạo mới luồng hàng hải");
        seedPermission(permissionsByCode, "navigationchannel", "read", "Xem luồng hàng hải",
                "Xem danh sách và chi tiết luồng hàng hải");
        seedPermission(permissionsByCode, "navigationchannel", "update", "Cập nhật luồng hàng hải",
                "Chỉnh sửa luồng hàng hải");
        seedPermission(permissionsByCode, "navigationchannel", "delete", "Xóa luồng hàng hải",
                "Xóa luồng hàng hải");
        seedPermission(permissionsByCode, "navigationchannel", "approvec1", "Phê duyệt C1 luồng hàng hải",
                "Phê duyệt cấp 1 luồng hàng hải");
        seedPermission(permissionsByCode, "navigationchannel", "approvec2", "Phê duyệt C2 luồng hàng hải",
                "Phê duyệt cấp 2 luồng hàng hải");
        seedPermission(permissionsByCode, "navigationchannel", "history", "Xem lịch sử luồng hàng hải",
                "Xem lịch sử thay đổi luồng hàng hải");

        // dikerevetment
        seedPermission(permissionsByCode, "dikerevetment", "create", "Tạo đê kè",
                "Tạo mới đê kè");
        seedPermission(permissionsByCode, "dikerevetment", "read", "Xem đê kè",
                "Xem danh sách và chi tiết đê kè");
        seedPermission(permissionsByCode, "dikerevetment", "update", "Cập nhật đê kè",
                "Chỉnh sửa đê kè");
        seedPermission(permissionsByCode, "dikerevetment", "delete", "Xóa đê kè",
                "Xóa đê kè");
        seedPermission(permissionsByCode, "dikerevetment", "approvec1", "Phê duyệt C1 đê kè",
                "Phê duyệt cấp 1 đê kè");
        seedPermission(permissionsByCode, "dikerevetment", "approvec2", "Phê duyệt C2 đê kè",
                "Phê duyệt cấp 2 đê kè");
        seedPermission(permissionsByCode, "dikerevetment", "history", "Xem lịch sử đê kè",
                "Xem lịch sử thay đổi đê kè");

        // shiprepair
        seedPermission(permissionsByCode, "shiprepair", "create", "Tạo cơ sở sửa chữa",
                "Tạo mới cơ sở sửa chữa đóng tàu");
        seedPermission(permissionsByCode, "shiprepair", "read", "Xem cơ sở sửa chữa",
                "Xem danh sách và chi tiết cơ sở sửa chữa đóng tàu");
        seedPermission(permissionsByCode, "shiprepair", "update", "Cập nhật cơ sở sửa chữa",
                "Chỉnh sửa cơ sở sửa chữa đóng tàu");
        seedPermission(permissionsByCode, "shiprepair", "delete", "Xóa cơ sở sửa chữa",
                "Xóa cơ sở sửa chữa đóng tàu");
        seedPermission(permissionsByCode, "shiprepair", "approvec1", "Phê duyệt C1 cơ sở sửa chữa",
                "Phê duyệt cấp 1 cơ sở sửa chữa đóng tàu");
        seedPermission(permissionsByCode, "shiprepair", "approvec2", "Phê duyệt C2 cơ sở sửa chữa",
                "Phê duyệt cấp 2 cơ sở sửa chữa đóng tàu");
        seedPermission(permissionsByCode, "shiprepair", "history", "Xem lịch sử cơ sở sửa chữa",
                "Xem lịch sử thay đổi cơ sở sửa chữa đóng tàu");

        // radarstation
        seedPermission(permissionsByCode, "radarstation", "create", "Tạo trạm radar",
                "Tạo mới trạm radar");
        seedPermission(permissionsByCode, "radarstation", "read", "Xem trạm radar",
                "Xem danh sách và chi tiết trạm radar");
        seedPermission(permissionsByCode, "radarstation", "update", "Cập nhật trạm radar",
                "Chỉnh sửa trạm radar");
        seedPermission(permissionsByCode, "radarstation", "delete", "Xóa trạm radar",
                "Xóa trạm radar");
        seedPermission(permissionsByCode, "radarstation", "approvec1", "Phê duyệt C1 trạm radar",
                "Phê duyệt cấp 1 trạm radar");
        seedPermission(permissionsByCode, "radarstation", "approvec2", "Phê duyệt C2 trạm radar",
                "Phê duyệt cấp 2 trạm radar");
        seedPermission(permissionsByCode, "radarstation", "history", "Xem lịch sử trạm radar",
                "Xem lịch sử thay đổi trạm radar");

        // vts
        seedPermission(permissionsByCode, "vts", "create", "Tạo VTS",
                "Tạo mới hệ thống VTS");
        seedPermission(permissionsByCode, "vts", "read", "Xem VTS",
                "Xem danh sách và chi tiết hệ thống VTS");
        seedPermission(permissionsByCode, "vts", "update", "Cập nhật VTS",
                "Chỉnh sửa hệ thống VTS");
        seedPermission(permissionsByCode, "vts", "delete", "Xóa VTS",
                "Xóa hệ thống VTS");
        seedPermission(permissionsByCode, "vts", "approve:c1", "Phê duyệt C1 VTS",
                "Phê duyệt cấp 1 VTS");
        seedPermission(permissionsByCode, "vts", "approve:c2", "Phê duyệt C2 VTS",
                "Phê duyệt cấp 2 VTS");
        seedPermission(permissionsByCode, "vts", "history", "Xem lịch sử VTS",
                "Xem lịch sử thay đổi VTS");

        // Permissions will be saved automatically via @ManyToMany cascade when saving roles.
        log.info("📦 Prepared {} permissions for role assignment", permissionsByCode.size());

        // 2. Build roles with their permission sets.
        Map<String, List<String>> rolePermissionMap = new LinkedHashMap<>();
        rolePermissionMap.put("ROLE_SYSTEM_ADMIN", List.of(
                "user:manage", "role:manage", "orgunit:manage",
                "admin:manage", "log:manage", "map:manage", "connection:manage",
                "data:read", "data:create", "data:update", "data:approve",
                // M-003 all actions
                "navigationchannel:create", "navigationchannel:read", "navigationchannel:update", "navigationchannel:delete",
                "navigationchannel:approvec1", "navigationchannel:approvec2", "navigationchannel:history",
                "dikerevetment:create", "dikerevetment:read", "dikerevetment:update", "dikerevetment:delete",
                "dikerevetment:approvec1", "dikerevetment:approvec2", "dikerevetment:history",
                "shiprepair:create", "shiprepair:read", "shiprepair:update", "shiprepair:delete",
                "shiprepair:approvec1", "shiprepair:approvec2", "shiprepair:history",
                "radarstation:create", "radarstation:read", "radarstation:update", "radarstation:delete",
                "radarstation:approvec1", "radarstation:approvec2", "radarstation:history",
                "vts:create", "vts:read", "vts:update", "vts:delete",
                "vts:approve:c1", "vts:approve:c2", "vts:history"
        ));
        rolePermissionMap.put("ROLE_ADMIN", List.of(
                "orgunit:manage", "orgunit:read", "orgunit:approve", "group:manage", "user:read",
                "admin:view",
                "document:read", "document:create", "document:update", "document:delete",
                "group:create", "group:edit", "group:delete", "group:copy", "group:history", "group:permission", "groupmember:manage",
                "report:read", "connection:read", "data:read", "data:approve",
                // M-003 read + approve actions
                "navigationchannel:read", "navigationchannel:approvec1", "navigationchannel:approvec2",
                "dikerevetment:read", "dikerevetment:approvec1", "dikerevetment:approvec2",
                "shiprepair:read", "shiprepair:approvec1", "shiprepair:approvec2",
                "radarstation:read", "radarstation:approvec1", "radarstation:approvec2",
                "vts:read", "vts:approve:c1", "vts:approve:c2"
        ));
        rolePermissionMap.put("ROLE_LEADER", List.of(
                "orgunit:read", "data:approve", "report:read", "approve:action",
                "admin:view", "document:read",
                "group:manage", "group:create", "group:edit", "group:delete", "groupmember:manage",
                // M-003 read + approve actions
                "navigationchannel:read", "navigationchannel:approvec1", "navigationchannel:approvec2",
                "dikerevetment:read", "dikerevetment:approvec1", "dikerevetment:approvec2",
                "shiprepair:read", "shiprepair:approvec1", "shiprepair:approvec2",
                "radarstation:read", "radarstation:approvec1", "radarstation:approvec2",
                "vts:read", "vts:approve:c1", "vts:approve:c2"
        ));
        rolePermissionMap.put("ROLE_SPECIALIST", List.of(
                "orgunit:read", "data:create", "data:update", "data:read",
                "report:read", "check:read",
                "document:read", "document:create", "document:update",
                // M-003 create/read/update
                "navigationchannel:create", "navigationchannel:read", "navigationchannel:update",
                "dikerevetment:create", "dikerevetment:read", "dikerevetment:update",
                "shiprepair:create", "shiprepair:read", "shiprepair:update",
                "radarstation:create", "radarstation:read", "radarstation:update",
                "vts:create", "vts:read", "vts:update"
        ));
        rolePermissionMap.put("ROLE_PORT_OPERATOR", List.of(
                "orgunit:read", "data:read", "data:update",
                "document:read",
                // M-003 read only
                "navigationchannel:read", "dikerevetment:read", "shiprepair:read",
                "radarstation:read", "vts:read"
        ));
        rolePermissionMap.put("ROLE_PUBLIC_USER", List.of(
                "orgunit:read", "data:read", "document:read",
                // M-003 read only
                "navigationchannel:read", "dikerevetment:read", "shiprepair:read",
                "radarstation:read", "vts:read"
        ));
        rolePermissionMap.put("ROLE_INTEGRATION", List.of(
                "data:read", "data:write", "api:share",
                // M-003 read only
                "navigationchannel:read", "dikerevetment:read", "shiprepair:read",
                "radarstation:read", "vts:read"
        ));
        rolePermissionMap.put("ROLE_SECURITY_MONITOR", List.of(
                "security:monitor", "security:read"
        ));

        // 3. Create roles.
        List<Role> roles = rolePermissionMap.entrySet().stream()
                .map(entry -> {
                    String roleCode = entry.getKey();
                    List<String> permCodes = entry.getValue();

                    Role role = new Role();
                    role.setCode(roleCode);
                    role.setStatus(RoleStatus.ACTIVE);
                    role.setUserCount(0);

                    switch (roleCode) {
                        case "ROLE_SYSTEM_ADMIN" ->
                                role.setName("Quản trị hệ thống");
                        case "ROLE_ADMIN" ->
                                role.setName("Quản trị đơn vị");
                        case "ROLE_LEADER" ->
                                role.setName("Lãnh đạo");
                        case "ROLE_SPECIALIST" ->
                                role.setName("Chuyên viên");
                        case "ROLE_PORT_OPERATOR" ->
                                role.setName("Người dùng tại Cảng");
                        case "ROLE_PUBLIC_USER" ->
                                role.setName("Người dùng công cộng");
                        case "ROLE_INTEGRATION" ->
                                role.setName("Hệ thống bên ngoài (HTTT-DV, LGSP, NDXP)");
                        case "ROLE_SECURITY_MONITOR" ->
                                role.setName("Giám sát an ninh (SIEM)");
                        default ->
                                role.setName(roleCode);
                    }

                    Set<Permission> perms = new HashSet<>();
                    if ("ROLE_SYSTEM_ADMIN".equals(roleCode)) {
                        perms.addAll(permissionsByCode.values());
                    } else {
                        for (String permCode : permCodes) {
                            Permission perm = permissionsByCode.get(permCode);
                            if (perm != null) {
                                perms.add(perm);
                            } else {
                                log.warn("⚠️ Permission '{}' not found for role '{}'", permCode, roleCode);
                            }
                        }
                    }
                    role.setPermissions(perms);
                    return role;
                })
                .toList();

        roleRepository.saveAll(roles);
        assignSystemAdminMenus();

        log.info("✅ Seeded {} roles:", roles.size());
        for (Role role : roles) {
            log.info("   - {} [{}]: {} permissions", role.getCode(), role.getName(), role.getPermissions().size());
        }

        log.info("✅ Role/permission seeding completed successfully!");
    }

    /** Đồng bộ toàn bộ cây chức năng AUTH_MENU cho quản trị hệ thống. */
    @Transactional
    void assignSystemAdminMenus() {
        roleRepository.findByCode("ROLE_SYSTEM_ADMIN").ifPresent(role -> {
            List<SystemMenu> menus = systemMenuRepository
                    .findByAppCodeAndStatusAndHideMenuOrderByOrderNoAscMenuCodeAsc("VMD_MTIS", 1, false);
            if (!menus.isEmpty()) {
                role.setMenuPermissions(new HashSet<>(menus));
                roleRepository.save(role);
                log.info("Synchronized {} original menu permissions to ROLE_SYSTEM_ADMIN", menus.size());
            }
        });
    }

    /**
     * Upsert permissions that may have been added to the seeder after the initial
     * DB was already seeded. This runs on every startup without overwriting
     * existing permission/role data — it only creates truly missing Permission
     * records and assigns them to roles that reference them but don't yet have them.
     */
    @Transactional
    @SuppressWarnings("null")
    void upsertMissingPermissions() {
        Map<String, Permission> newPerms = new LinkedHashMap<>();

        // Re-create the same seedPermission calls to build the full permission set.
        seedPermission(newPerms, "user", "manage", "Quản lý người dùng", "Tạo, sửa, xóa, khóa/mở khóa người dùng");
        seedPermission(newPerms, "user", "read", "Xem người dùng", "Xem danh sách và chi tiết người dùng");
        seedPermission(newPerms, "user", "approve", "Phê duyệt người dùng", "Phê duyệt tài khoản người dùng mới");
        seedPermission(newPerms, "role", "manage", "Quản lý vai trò", "Tạo, sửa, xóa, gán vai trò");
        seedPermission(newPerms, "orgunit", "manage", "Quản lý đơn vị", "Tạo, sửa, xóa đơn vị tổ chức");
        seedPermission(newPerms, "orgunit", "read", "Xem đơn vị", "Xem danh sách và chi tiết đơn vị tổ chức");
        seedPermission(newPerms, "orgunit", "approve", "Phê duyệt đơn vị", "Phê duyệt đơn vị tổ chức");
        seedPermission(newPerms, "group", "manage", "Quản lý nhóm", "Tạo, sửa, xóa nhóm người dùng");
        seedPermission(newPerms, "group", "create", "Tạo nhóm", "Tạo nhóm người dùng mới");
        seedPermission(newPerms, "group", "edit", "Sửa nhóm", "Chỉnh sửa thông tin nhóm");
        seedPermission(newPerms, "group", "delete", "Xóa nhóm", "Xóa nhóm người dùng");
        seedPermission(newPerms, "group", "copy", "Sao chép nhóm", "Sao chép nhóm người dùng");
        seedPermission(newPerms, "group", "history", "Xem lịch sử nhóm", "Xem lịch sử thay đổi nhóm");
        seedPermission(newPerms, "group", "permission", "Phân quyền nhóm", "Gán vai trò cho nhóm và cấp quyền kế thừa cho thành viên");
        seedPermission(newPerms, "groupmember", "manage", "Quản lý thành viên nhóm", "Thêm, xóa thành viên khỏi nhóm");
        seedPermission(newPerms, "document", "read", "Xem văn bản pháp lý", "Xem danh sách và chi tiết văn bản pháp lý");
        seedPermission(newPerms, "document", "create", "Tạo văn bản pháp lý", "Tạo mới văn bản pháp lý");
        seedPermission(newPerms, "document", "update", "Sửa văn bản pháp lý", "Chỉnh sửa văn bản pháp lý");
        seedPermission(newPerms, "document", "delete", "Xóa văn bản pháp lý", "Xóa văn bản pháp lý");
        seedPermission(newPerms, "admin", "manage", "Quản trị hệ thống", "Cấu hình hệ thống, chính sách bảo mật");
        seedPermission(newPerms, "admin", "view", "Xem log hệ thống", "Xem nhật ký truy cập và audit log");
        seedPermission(newPerms, "log", "manage", "Quản lý log", "Xem, xuất, lưu trữ audit log");
        seedPermission(newPerms, "map", "manage", "Quản lý bản đồ", "Tạo, sửa, xóa lớp bản đồ và overlay");
        seedPermission(newPerms, "data", "approve", "Phê duyệt dữ liệu", "Phê duyệt dữ liệu do chuyên viên trình");
        seedPermission(newPerms, "data", "create", "Tạo dữ liệu", "Thêm mới dữ liệu (point, line, polygon)");
        seedPermission(newPerms, "data", "update", "Chỉnh sửa dữ liệu", "Sửa dữ liệu hiện có");
        seedPermission(newPerms, "data", "read", "Xem dữ liệu", "Xem danh sách và chi tiết dữ liệu");
        seedPermission(newPerms, "data", "write", "Viết dữ liệu", "Tạo và chỉnh sửa dữ liệu (tổng hợp)");
        seedPermission(newPerms, "report", "read", "Xem báo cáo", "Xem báo cáo và thống kê");
        seedPermission(newPerms, "check", "read", "Xem kết quả kiểm tra", "Xem kết quả rà soát, kiểm tra dữ liệu");
        seedPermission(newPerms, "approve", "action", "Phê duyệt", "Thực hiện thao tác phê duyệt");
        seedPermission(newPerms, "connection", "manage", "Quản lý kết nối", "Cấu hình và quản lý kết nối liên thông");
        seedPermission(newPerms, "connection", "read", "Xem kết nối", "Xem thông tin kết nối liên thông");
        seedPermission(newPerms, "api", "share", "Chia sẻ API", "Cho phép chia sẻ dữ liệu qua API");
        seedPermission(newPerms, "security", "monitor", "Giám sát an ninh", "Giám sát an toàn thông tin, SIEM");
        seedPermission(newPerms, "security", "read", "Xem báo cáo an ninh", "Xem báo cáo an ninh, cảnh báo");

        // M-003
        seedPermission(newPerms, "navigationchannel", "create", "Tạo luồng hàng hải", "Tạo mới luồng hàng hải");
        seedPermission(newPerms, "navigationchannel", "read", "Xem luồng hàng hải", "Xem danh sách và chi tiết luồng hàng hải");
        seedPermission(newPerms, "navigationchannel", "update", "Cập nhật luồng hàng hải", "Chỉnh sửa luồng hàng hải");
        seedPermission(newPerms, "navigationchannel", "delete", "Xóa luồng hàng hải", "Xóa luồng hàng hải");
        seedPermission(newPerms, "navigationchannel", "approvec1", "Phê duyệt C1 luồng hàng hải", "Phê duyệt cấp 1 luồng hàng hải");
        seedPermission(newPerms, "navigationchannel", "approvec2", "Phê duyệt C2 luồng hàng hải", "Phê duyệt cấp 2 luồng hàng hải");
        seedPermission(newPerms, "navigationchannel", "history", "Xem lịch sử luồng hàng hải", "Xem lịch sử thay đổi luồng hàng hải");
        seedPermission(newPerms, "dikerevetment", "create", "Tạo đê kè", "Tạo mới đê kè");
        seedPermission(newPerms, "dikerevetment", "read", "Xem đê kè", "Xem danh sách và chi tiết đê kè");
        seedPermission(newPerms, "dikerevetment", "update", "Cập nhật đê kè", "Chỉnh sửa đê kè");
        seedPermission(newPerms, "dikerevetment", "delete", "Xóa đê kè", "Xóa đê kè");
        seedPermission(newPerms, "dikerevetment", "approvec1", "Phê duyệt C1 đê kè", "Phê duyệt cấp 1 đê kè");
        seedPermission(newPerms, "dikerevetment", "approvec2", "Phê duyệt C2 đê kè", "Phê duyệt cấp 2 đê kè");
        seedPermission(newPerms, "dikerevetment", "history", "Xem lịch sử đê kè", "Xem lịch sử thay đổi đê kè");
        seedPermission(newPerms, "shiprepair", "create", "Tạo cơ sở sửa chữa", "Tạo mới cơ sở sửa chữa đóng tàu");
        seedPermission(newPerms, "shiprepair", "read", "Xem cơ sở sửa chữa", "Xem danh sách và chi tiết cơ sở sửa chữa đóng tàu");
        seedPermission(newPerms, "shiprepair", "update", "Cập nhật cơ sở sửa chữa", "Chỉnh sửa cơ sở sửa chữa đóng tàu");
        seedPermission(newPerms, "shiprepair", "delete", "Xóa cơ sở sửa chữa", "Xóa cơ sở sửa chữa đóng tàu");
        seedPermission(newPerms, "shiprepair", "approvec1", "Phê duyệt C1 cơ sở sửa chữa", "Phê duyệt cấp 1 cơ sở sửa chữa đóng tàu");
        seedPermission(newPerms, "shiprepair", "approvec2", "Phê duyệt C2 cơ sở sửa chữa", "Phê duyệt cấp 2 cơ sở sửa chữa đóng tàu");
        seedPermission(newPerms, "shiprepair", "history", "Xem lịch sử cơ sở sửa chữa", "Xem lịch sử thay đổi cơ sở sửa chữa đóng tàu");
        seedPermission(newPerms, "radarstation", "create", "Tạo trạm radar", "Tạo mới trạm radar");
        seedPermission(newPerms, "radarstation", "read", "Xem trạm radar", "Xem danh sách và chi tiết trạm radar");
        seedPermission(newPerms, "radarstation", "update", "Cập nhật trạm radar", "Chỉnh sửa trạm radar");
        seedPermission(newPerms, "radarstation", "delete", "Xóa trạm radar", "Xóa trạm radar");
        seedPermission(newPerms, "radarstation", "approvec1", "Phê duyệt C1 trạm radar", "Phê duyệt cấp 1 trạm radar");
        seedPermission(newPerms, "radarstation", "approvec2", "Phê duyệt C2 trạm radar", "Phê duyệt cấp 2 trạm radar");
        seedPermission(newPerms, "radarstation", "history", "Xem lịch sử trạm radar", "Xem lịch sử thay đổi trạm radar");
        seedPermission(newPerms, "vts", "create", "Tạo VTS", "Tạo mới hệ thống VTS");
        seedPermission(newPerms, "vts", "read", "Xem VTS", "Xem danh sách và chi tiết hệ thống VTS");
        seedPermission(newPerms, "vts", "update", "Cập nhật VTS", "Chỉnh sửa hệ thống VTS");
        seedPermission(newPerms, "vts", "delete", "Xóa VTS", "Xóa hệ thống VTS");
        seedPermission(newPerms, "vts", "approve:c1", "Phê duyệt C1 VTS", "Phê duyệt cấp 1 VTS");
        seedPermission(newPerms, "vts", "approve:c2", "Phê duyệt C2 VTS", "Phê duyệt cấp 2 VTS");
        seedPermission(newPerms, "vts", "history", "Xem lịch sử VTS", "Xem lịch sử thay đổi VTS");

        int inserted = 0;
        int updated = 0;
        Map<String, Permission> savedPerms = new LinkedHashMap<>();
        for (Permission perm : newPerms.values()) {
            var existingOpt = permissionRepository.findByCode(perm.getCode());
            if (existingOpt.isEmpty()) {
                permissionRepository.save(perm);
                savedPerms.put(perm.getCode(), perm);
                inserted++;
            } else {
                Permission existing = existingOpt.get();
                boolean changed = false;
                if (!Objects.equals(existing.getName(), perm.getName())) {
                    existing.setName(perm.getName());
                    changed = true;
                }
                if (!Objects.equals(existing.getDescription(), perm.getDescription())) {
                    existing.setDescription(perm.getDescription());
                    changed = true;
                }
                if (!Objects.equals(existing.getResource(), perm.getResource())) {
                    existing.setResource(perm.getResource());
                    changed = true;
                }
                if (!Objects.equals(existing.getAction(), perm.getAction())) {
                    existing.setAction(perm.getAction());
                    changed = true;
                }
                if (changed) {
                    existing = permissionRepository.save(existing);
                    updated++;
                }
                savedPerms.put(perm.getCode(), existing);
            }
        }
        if (inserted > 0 || updated > 0) {
            log.info("✅ Upserted permissions: {} inserted, {} updated", inserted, updated);
        }

        // Assign missing permissions to existing roles.
        Map<String, List<String>> rolePermMap = new LinkedHashMap<>();
        rolePermMap.put("ROLE_SYSTEM_ADMIN", List.of()); // gets ALL
        rolePermMap.put("ROLE_ADMIN", List.of(
            "orgunit:manage", "orgunit:read", "orgunit:approve", "group:manage", "user:read",
            "admin:view", "document:read", "document:create", "document:update", "document:delete",
            "group:create", "group:edit", "group:delete", "group:copy", "group:history", "group:permission", "groupmember:manage",
            "report:read", "connection:read", "data:read", "data:approve",
            "navigationchannel:read", "navigationchannel:approvec1", "navigationchannel:approvec2",
            "dikerevetment:read", "dikerevetment:approvec1", "dikerevetment:approvec2",
            "shiprepair:read", "shiprepair:approvec1", "shiprepair:approvec2",
            "radarstation:read", "radarstation:approvec1", "radarstation:approvec2",
            "vts:read", "vts:approve:c1", "vts:approve:c2"
        ));
        rolePermMap.put("ROLE_LEADER", List.of(
            "orgunit:read", "data:approve", "report:read", "approve:action",
            "admin:view", "document:read", "group:manage", "group:create", "group:edit", "group:delete", "groupmember:manage",
            "navigationchannel:read", "navigationchannel:approvec1", "navigationchannel:approvec2",
            "dikerevetment:read", "dikerevetment:approvec1", "dikerevetment:approvec2",
            "shiprepair:read", "shiprepair:approvec1", "shiprepair:approvec2",
            "radarstation:read", "radarstation:approvec1", "radarstation:approvec2",
            "vts:read", "vts:approve:c1", "vts:approve:c2"
        ));
        rolePermMap.put("ROLE_SPECIALIST", List.of(
            "document:read", "document:create", "document:update"
        ));
        rolePermMap.put("ROLE_PORT_OPERATOR", List.of("document:read"));
        rolePermMap.put("ROLE_PUBLIC_USER", List.of("document:read"));

        int assigned = 0;
        for (var entry : rolePermMap.entrySet()) {
            var roleOpt = roleRepository.findByCode(entry.getKey());
            if (roleOpt.isEmpty()) continue;
            Role role = roleOpt.get();
            Set<String> existingCodes = role.getPermissions().stream()
                    .map(Permission::getCode).collect(java.util.stream.Collectors.toSet());
            List<Permission> toAdd;
            if ("ROLE_SYSTEM_ADMIN".equals(entry.getKey())) {
                toAdd = savedPerms.values().stream()
                        .filter(p -> !existingCodes.contains(p.getCode())).toList();
            } else {
                toAdd = entry.getValue().stream()
                        .map(savedPerms::get)
                        .filter(Objects::nonNull)
                        .filter(p -> !existingCodes.contains(p.getCode())).toList();
            }
            if (!toAdd.isEmpty()) {
                role.getPermissions().addAll(toAdd);
                roleRepository.save(role);
                assigned += toAdd.size();
                log.info("  ➕ Added {} permission(s) to role '{}'", toAdd.size(), entry.getKey());
            }
        }
        if (assigned > 0) {
            log.info("✅ Assigned {} missing permission(s) across existing roles", assigned);
        }
    }

    /**
     * Helper: create a Permission object and store it in the map by code.
     * Skips if a permission with the same code already exists in the map.
     */
    private void seedPermission(Map<String, Permission> map, String resource, String action,
                                String name, String description) {
        String code = resource + ":" + action;
        if (map.containsKey(code)) {
            return;
        }
        Permission p = new Permission();
        p.setCode(code);
        p.setName(name);
        p.setDescription(description);
        p.setResource(resource);
        p.setAction(action);
        map.put(code, p);
    }
}
