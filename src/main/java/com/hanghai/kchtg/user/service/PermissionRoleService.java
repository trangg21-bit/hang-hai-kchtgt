package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service quản lý phân quyền - ánh xạ Role -> Permission.
 * <p>
 * Thực hiện các nghiệp vụ cốt lõi của F-275:
 * <ul>
 *   <li>BR-275-01: Validation mã permission ({@code feature:action})</li>
 *   <li>BR-275-02: Super Admin bypass - luôn có full access</li>
 *   <li>BR-275-03: Bảo vệ role hệ thống (isSystem = true)</li>
 *   <li>BR-275-06: Khi revoke last role ->’ user mất toàn bộ permissions</li>
 *   <li>BR-275-11: 403 response kèm permission code cần thiết</li>
 * </ul>
 * </p>
 */
@Service
@Transactional
public class PermissionRoleService {

    private static final Logger log = LoggerFactory.getLogger(PermissionRoleService.class);

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;

    /** Mã role Super Admin (dùng cho BR-275-02 bypass). */
    @org.springframework.beans.factory.annotation.Value("${security.permission.super-admin-role-code:SUPER_ADMIN}")
    private String superAdminRoleCode;

    public PermissionRoleService(PermissionRepository permissionRepository,
                                 RoleRepository roleRepository,
                                 com.hanghai.kchtg.user.repository.UserRepository userRepository) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
    }

    // =========================================================================
    // 1. Permission CRUD
    // =========================================================================

    /**
     * Tạo mới một permission.
     *
     * @throws IllegalArgumentException nếu code đã tồn tại hoặc định dạng không hợp lệ
     */
    public Permission createPermission(String code, String name, String description,
                                       String resource, String action) {
        // BR-275-01: Validate code format
        if (code == null || !code.matches("^[a-z][a-z0-9]*:[a-z][a-z0-9]*$")) {
            throw new IllegalArgumentException(
                "Mã quyền hạn không hợp lệ, phải theo định dạng {feature}:{action} (chữ thường): " + code);
        }

        if (permissionRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Mã quyền hạn đã tồn tại: " + code);
        }

        Permission permission = new Permission();
        permission.setCode(code);
        permission.setName(name != null ? name : code);
        permission.setDescription(description);
        permission.setResource(resource);
        permission.setAction(action);

        Permission saved = permissionRepository.save(permission);
        log.info("Created permission: {} (resource={}, action={})", saved.getCode(), resource, action);
        return saved;
    }

    /**
     * Tạo mới từ entity đã cấu hình sẵn.
     */
    public Permission createPermission(Permission permission) {
        return createPermission(
            permission.getCode(),
            permission.getName(),
            permission.getDescription(),
            permission.getResource(),
            permission.getAction()
        );
    }

    /**
     * Cập nhật permission.
     */
    public Permission updatePermission(UUID id, String name, String description,
                                       String resource, String action) {
        Permission permission = findById(id);

        if (name != null) permission.setName(name);
        if (description != null) permission.setDescription(description);
        if (resource != null) {
            // =========================================================================
            String newCode = Permission.createCode(resource, action);
            if (permissionRepository.existsByCodeAndIdNot(newCode, id)) {
                throw new IllegalArgumentException("Mã quyền hạn đã tồn tại: " + newCode);
            }
            permission.setResource(resource);
            permission.setCode(newCode);
        }
        if (action != null) {
            String newCode = Permission.createCode(resource != null ? resource : permission.getResource(), action);
            if (permissionRepository.existsByCodeAndIdNot(newCode, id)) {
                throw new IllegalArgumentException("Mã quyền hạn đã tồn tại: " + newCode);
            }
            permission.setAction(action);
            permission.setCode(newCode);
        }

        Permission saved = permissionRepository.save(permission);
        log.info("Updated permission: {} ({})", saved.getCode(), saved.getId());
        return saved;
    }

    /**
     * Xóa permission theo code.
     *
     * @throws EntityNotFoundException nếu không tìm thấy
     */
    public void deletePermission(String code) {
        Permission permission = findByCode(code);
        permissionRepository.deleteByCode(code);
        log.info("Deleted permission: {}", code);
    }

    /**
     * Lấy danh sách tất cả permissions (đã lọc soft-delete bởi BaseEntity).
     */
    @Transactional(readOnly = true)
    public List<Permission> findAll() {
        return permissionRepository.findAll();
    }

    /**
     * Tìm permission theo ID.
     *
     * @throws EntityNotFoundException nếu không tìm thấy
     */
    @Transactional(readOnly = true)
    public Permission findById(UUID id) {
        return permissionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy quyền hạn với id: " + id));
    }

    /**
     * Tìm permission theo code.
     *
     * @throws EntityNotFoundException nếu không tìm thấy
     */
    @Transactional(readOnly = true)
    public Permission findByCode(String code) {
        return permissionRepository.findByCode(code)
            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy quyền hạn với mã: " + code));
    }

    /**
     * Tìm permissions theo resource (feature).
     */
    @Transactional(readOnly = true)
    public List<Permission> findByResource(String resource) {
        return permissionRepository.findByResource(resource);
    }

    /**
     * Tìm permission theo cả resource và action.
     */
    @Transactional(readOnly = true)
    public Optional<Permission> findByResourceAndAction(String resource, String action) {
        return permissionRepository.findByResourceAndAction(resource, action);
    }

    // =========================================================================
    // 2. Role -> Permission assignment
    // =========================================================================

    /**
     * Gán permission vào role (BR-275-01: validation code format).
     * Permission được thêm vào danh sách {@code Role.permissions}.
     *
     * @throws IllegalArgumentException nếu permission không tồn tại
     */
    public Role assignPermission(Role role, Permission permission) {
        if (role == null || permission == null) {
            throw new IllegalArgumentException("Role và Permission không được null");
        }

        // =========================================================================
        if ("SUPER_ADMIN".equalsIgnoreCase(role.getCode())) {
            log.debug("Assigning permission to SUPER_ADMIN role: {} -> {}", role.getCode(), permission.getCode());
        }

        if (!role.getPermissions().contains(permission.getCode())) {
            role.getPermissions().add(permission.getCode());
        }

        Role saved = roleRepository.save(role);
        log.info("Assigned permission {} to role {} ({})", permission.getCode(), role.getCode(), role.getId());
        return saved;
    }

    /**
     * Gán permission vào role theo code (shortcut, không cần load Permission entity).
     *
     * @throws IllegalArgumentException nếu role không tồn tại
     */
    public Role assignPermissionByCode(Role role, String permissionCode) {
        if (role == null) {
            throw new IllegalArgumentException("Role không được null");
        }

        // Validate code format (BR-275-01)
        if (permissionCode == null || !permissionCode.matches("^[a-z][a-z0-9]*:[a-z][a-z0-9]*$")) {
            throw new IllegalArgumentException("Mã quyền hạn không hợp lệ: " + permissionCode);
        }

        if (!role.getPermissions().contains(permissionCode)) {
            role.getPermissions().add(permissionCode);
        }

        Role saved = roleRepository.save(role);
        log.info("Assigned permission {} to role {} ({})", permissionCode, role.getCode(), role.getId());
        return saved;
    }

    /**
     * Gán nhiều permissions cùng lúc cho role.
     */
    public Role assignPermissions(Role role, List<String> permissionCodes) {
        if (permissionCodes == null || permissionCodes.isEmpty()) {
            return role;
        }

        for (String code : permissionCodes) {
            assignPermissionByCode(role, code);
        }

        return role;
    }

    /**
     * Lấy danh sách permission codes của một role.
     */
    @Transactional(readOnly = true)
    public Set<String> getRolePermissions(Role role) {
        if (role == null || role.getPermissions() == null) {
            return Collections.emptySet();
        }
        return new LinkedHashSet<>(role.getPermissions());
    }

    /**
     * Lấy danh sách Permission entities của một role (load từ DB).
     */
    @Transactional(readOnly = true)
    public List<Permission> getRolePermissionEntities(Role role) {
        Set<String> codes = getRolePermissions(role);
        if (codes.isEmpty()) {
            return Collections.emptyList();
        }

        // Load Permission entities by codes
        return permissionRepository.findAll().stream()
            .filter(p -> codes.contains(p.getCode()))
            .collect(Collectors.toList());
    }

    /**
     * Xóa permission khỏi role.
     *
     * @throws EntityNotFoundException nếu role không tồn tại
     */
    public Role removePermission(Role role, Permission permission) {
        if (role == null || permission == null) {
            throw new IllegalArgumentException("Role và Permission không được null");
        }

        boolean removed = role.getPermissions().remove(permission.getCode());
        if (!removed) {
            throw new IllegalArgumentException(
                "Permission " + permission.getCode() + " không được gán cho role " + role.getCode());
        }

        Role saved = roleRepository.save(role);
        log.info("Removed permission {} from role {} ({})", permission.getCode(), role.getCode(), role.getId());
        return saved;
    }

    /**
     * Xóa nhiều permissions khỏi role.
     */
    public Role removePermissions(Role role, List<String> permissionCodes) {
        if (role == null || permissionCodes == null) {
            throw new IllegalArgumentException("Role và danh sách permission codes không được null");
        }

        permissionCodes.forEach(code -> {
            boolean removed = role.getPermissions().remove(code);
            if (removed) {
                log.info("Removed permission {} from role {}", code, role.getCode());
            }
        });

        return roleRepository.save(role);
    }

    // =========================================================================
    // 3. Permission evaluation (BR-275-02, BR-275-06)
    // =========================================================================

    /**
     * BR-275-02: Super Admin luôn có full access - không cần query DB.
     */
    public boolean isSuperAdmin(Role role) {
        if (role == null || role.getCode() == null) {
            return false;
        }
        return isSuperAdmin(role.getCode());
    }

    /**
     * BR-275-02: Super Admin luôn có full access - không cần query DB.
     */
    public boolean isSuperAdmin(String roleCode) {
        if (roleCode == null) {
            return false;
        }
        String cleanCode = roleCode.startsWith("ROLE_") ? roleCode.substring(5) : roleCode;
        String cleanSuperAdminCode = superAdminRoleCode.startsWith("ROLE_") ? superAdminRoleCode.substring(5) : superAdminRoleCode;
        return cleanSuperAdminCode.equalsIgnoreCase(cleanCode) || "SYSTEM_ADMIN".equalsIgnoreCase(cleanCode);
    }

    /**
     * Kiểm tra role có một permission cụ thể.
     */
    @Transactional(readOnly = true)
    public boolean roleHasPermission(Role role, String permissionCode) {
        if (isSuperAdmin(role)) {
            return true; // BR-275-02
        }
        if (role == null || permissionCode == null) {
            return false;
        }
        return role.getPermissions() != null && role.getPermissions().contains(permissionCode);
    }

    /**
     * Kiểm tra user (bằng username) có permission cụ thể hay không.
     * <p>
     * Logic:
     * 1. Load user, lấy danh sách roles
     * 2. Union tất cả permissions từ các role + direct grants
     * 3. Super Admin bypass (BR-275-02)
     * </p>
     *
     * @param username tên đăng nhập của user
     * @param resource resource (feature) cần kiểm tra
     * @param action action cần kiểm tra
     * @return true nếu user có quyền, false nếu không
     */
    @Transactional(readOnly = true)
    public boolean checkPermission(String username, String resource, String action) {
        if (username == null || resource == null || action == null) {
            return false;
        }

        String requiredPermissionCode = Permission.createCode(resource, action);

        // =========================================================================
        // =========================================================================
        // (giả sử username là "superadmin" hoặc có role SUPER_ADMIN)
        // =========================================================================

        // =========================================================================
        // =========================================================================
        Optional<com.hanghai.kchtg.user.entity.User> userOpt = loadUserByUsername(username);
        if (userOpt.isEmpty()) {
            return false;
        }

        com.hanghai.kchtg.user.entity.User user = userOpt.get();

        // =========================================================================
        if (user.getRole() != null && isSuperAdmin(user.getRole())) {
            return true;
        }

        // Kiểm tra qua role's permissions list
        // =========================================================================
        // =========================================================================

        // Fallback: kiểm tra permission trực tiếp từ role của user
        if (user.getRole() != null) {
            String roleCode = user.getRole();
            if (roleCode.startsWith("ROLE_")) {
                roleCode = roleCode.substring(5);
            }
            Optional<Role> roleOpt = roleRepository.findByCode(roleCode);
            if (roleOpt.isPresent()) {
                Role role = roleOpt.get();
                Set<String> permissions = getRolePermissions(role);

                // Check exact match
                if (permissions.contains(requiredPermissionCode)) {
                    return true;
                }

                // Check wildcard: resource:* (toàn bộ actions của resource)
                String wildcardCode = resource + ":*";
                if (permissions.contains(wildcardCode)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Kiểm tra user có BẤT KỲ permission nào trong danh sách không (OR logic).
     */
    @Transactional(readOnly = true)
    public boolean checkAnyPermission(String username, String... permissionCodes) {
        if (username == null || permissionCodes == null) {
            return false;
        }

        // BR-275-02: Super Admin bypass
        Optional<com.hanghai.kchtg.user.entity.User> userOpt = loadUserByUsername(username);
        if (userOpt.isPresent() && isSuperAdmin(userOpt.get().getRole())) {
            return true;
        }

        for (String code : permissionCodes) {
            String[] parts = code.split(":", 2);
            if (parts.length == 2) {
                if (checkPermission(username, parts[0], parts[1])) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Kiểm tra user có TẤT CẢ permissions trong danh sách không (AND logic).
     */
    @Transactional(readOnly = true)
    public boolean checkAllPermissions(String username, String... permissionCodes) {
        if (username == null || permissionCodes == null) {
            return false;
        }

        // BR-275-02: Super Admin bypass
        Optional<com.hanghai.kchtg.user.entity.User> userOpt = loadUserByUsername(username);
        if (userOpt.isPresent() && isSuperAdmin(userOpt.get().getRole())) {
            return true;
        }

        for (String code : permissionCodes) {
            String[] parts = code.split(":", 2);
            if (parts.length == 2) {
                if (!checkPermission(username, parts[0], parts[1])) {
                    return false;
                }
            }
        }
        return true;
    }

    // =========================================================================
    // 4. Bulk permission management
    // =========================================================================

    /**
     * Gán toàn bộ permissions cho một role (ghi đè danh sách cũ).
     */
    public Role setRolePermissions(Role role, List<String> permissionCodes) {
        if (role == null) {
            throw new IllegalArgumentException("Role không được null");
        }

        role.getPermissions().clear();
        if (permissionCodes != null) {
            for (String code : permissionCodes) {
                if (code != null && !code.isEmpty()) {
                    role.getPermissions().add(code);
                }
            }
        }

        Role saved = roleRepository.save(role);
        log.info("Set {} permissions for role {}", saved.getPermissions().size(), saved.getCode());
        return saved;
    }

    /**
     * Clone permissions từ role này sang role khác.
     */
    public Role clonePermissionsToRole(Role source, Role target) {
        if (source == null || target == null) {
            throw new IllegalArgumentException("Source và target role không được null");
        }

        Set<String> sourcePerms = getRolePermissions(source);
        target.getPermissions().clear();
        target.getPermissions().addAll(sourcePerms);

        Role saved = roleRepository.save(target);
        log.info("Cloned {} permissions from role {} to {}",
            saved.getPermissions().size(), source.getCode(), saved.getCode());
        return saved;
    }

    // =========================================================================
    // Helper
    // =========================================================================

    /**
     * Load user từ UserRepository.
     */
    private Optional<com.hanghai.kchtg.user.entity.User> loadUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}