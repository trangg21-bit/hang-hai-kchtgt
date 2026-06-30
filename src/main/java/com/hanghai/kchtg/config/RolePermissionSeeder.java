package com.hanghai.kchtg.config;

import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import com.hanghai.kchtg.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
@Profile("local")
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

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🔐 Starting role/permission seeding...");

        // If any of the known roles already exist, skip seeding entirely.
        for (String roleCode : ROLE_CODES) {
            if (roleRepository.existsByCode(roleCode)) {
                log.info("⏭️ Role '{}' already exists, skipping role/permission seeding...", roleCode);
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

        // ---- admin/system settings ----
        seedPermission(permissionsByCode, "admin", "manage", "Quản trị hệ thống",
                "Cấu hình hệ thống, chính sách bảo mật");

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

        // Permissions will be saved automatically via @ManyToMany cascade when saving roles.
        log.info("📦 Prepared {} permissions for role assignment", permissionsByCode.size());

        // 2. Build roles with their permission sets.
        Map<String, List<String>> rolePermissionMap = new LinkedHashMap<>();
        rolePermissionMap.put("ROLE_SYSTEM_ADMIN", List.of(
                "user:manage", "role:manage", "orgunit:manage",
                "admin:manage", "log:manage", "map:manage", "connection:manage",
                "data:read", "data:create", "data:update", "data:approve"
        ));
        rolePermissionMap.put("ROLE_ADMIN", List.of(
                "orgunit:manage", "orgunit:read", "orgunit:approve", "group:manage", "user:read",
                "report:read", "connection:read", "data:read", "data:approve"
        ));
        rolePermissionMap.put("ROLE_LEADER", List.of(
                "orgunit:read", "data:approve", "report:read", "approve:action"
        ));
        rolePermissionMap.put("ROLE_SPECIALIST", List.of(
                "orgunit:read", "data:create", "data:update", "data:read",
                "report:read", "check:read"
        ));
        rolePermissionMap.put("ROLE_PORT_OPERATOR", List.of(
                "orgunit:read", "data:read", "data:update"
        ));
        rolePermissionMap.put("ROLE_PUBLIC_USER", List.of(
                "orgunit:read", "data:read"
        ));
        rolePermissionMap.put("ROLE_INTEGRATION", List.of(
                "data:read", "data:write", "api:share"
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

        log.info("✅ Seeded {} roles:", roles.size());
        for (Role role : roles) {
            log.info("   - {} [{}]: {} permissions", role.getCode(), role.getName(), role.getPermissions().size());
        }

        log.info("✅ Role/permission seeding completed successfully!");
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
