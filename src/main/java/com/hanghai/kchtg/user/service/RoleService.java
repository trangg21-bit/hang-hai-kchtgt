package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.admin.entity.AdminAuditLog;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.dto.CreateRoleRequest;
import com.hanghai.kchtg.user.dto.UpdateRoleRequest;
import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import com.hanghai.kchtg.user.entity.SystemMenu;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.SystemMenuRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service quản lý vai trò (Role) trong hệ thống.
 */
@Service
@Transactional
public class RoleService {

    private static final Logger log = LoggerFactory.getLogger(RoleService.class);

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final SystemMenuRepository systemMenuRepository;
    private final UserRepository userRepository;
    private final PermissionCacheService permissionCacheService;
    private final AdminAuditLogRepository adminAuditLogRepository;

    public RoleService(RoleRepository roleRepository, PermissionRepository permissionRepository,
                       SystemMenuRepository systemMenuRepository, UserRepository userRepository,
                       PermissionCacheService permissionCacheService,
                       @Nullable AdminAuditLogRepository adminAuditLogRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.systemMenuRepository = systemMenuRepository;
        this.userRepository = userRepository;
        this.permissionCacheService = permissionCacheService;
        this.adminAuditLogRepository = adminAuditLogRepository;
    }

    private void auditLog(String action, String target, String details) {
        if (adminAuditLogRepository == null) return;
        try {
            UUID adminId = SecurityUtils.getCurrentUserId();
            String adminName = SecurityUtils.getCurrentUsername();
            if (adminId == null) {
                adminId = UUID.fromString("00000000-0000-0000-0000-000000000000");
                adminName = "SYSTEM";
            } else if (adminName == null) {
                adminName = "Unknown";
            }
            AdminAuditLog audit = AdminAuditLog.create(adminId, adminName, action, target, details, "127.0.0.1", "System");
            adminAuditLogRepository.save(audit);
        } catch (Exception e) {
            log.warn("Failed to save audit log for {}: {}", action, e.getMessage());
        }
    }

    @Transactional
    public List<Role> findAll() {
        List<Role> roles = roleRepository.findByStatusNot(RoleStatus.DELETED);

        java.util.Map<UUID, Long> countsMap = userRepository.countUsersGroupByRoleId().stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));

        for (Role role : roles) {
            role.setUserCount(countsMap.getOrDefault(role.getId(), 0L).intValue());
        }
        return roles;
    }

    @Transactional
    public Page<Role> findAll(Pageable pageable) {
        Page<Role> roles = roleRepository.findByStatusNot(RoleStatus.DELETED, pageable);

        java.util.Map<UUID, Long> countsMap = userRepository.countUsersGroupByRoleId().stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));

        for (Role role : roles) {
            role.setUserCount(countsMap.getOrDefault(role.getId(), 0L).intValue());
        }
        return roles;
    }

    @Transactional(readOnly = true)
    public Role findById(UUID id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vai trò với id: " + id));
    }

    @Transactional(readOnly = true)
    public Role findByCode(String code) {
        return roleRepository.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vai trò với mã: " + code));
    }

    @Transactional(readOnly = true)
    public List<Role> findActiveRoles() {
        return roleRepository.findByStatus(RoleStatus.ACTIVE);
    }


    private Set<SystemMenu> resolveMenuCodes(List<String> menuCodes) {
        if (menuCodes == null || menuCodes.isEmpty()) {
            return new HashSet<>();
        }
        Set<String> normalized = menuCodes.stream()
                .filter(java.util.Objects::nonNull)
                .map(String::trim)
                .filter(code -> !code.isEmpty())
                .collect(Collectors.toSet());
        if (normalized.isEmpty()) {
            return new HashSet<>();
        }
        List<SystemMenu> menus = systemMenuRepository.findAllById(normalized);
        return new HashSet<>(menus);
    }

    /**
     * Tạo mới vai trò.
     *
     * @throws IllegalArgumentException nếu code đã tồn tại
     */
    @Transactional
    public Role create(CreateRoleRequest request) {
        java.util.Optional<Role> existingOpt = roleRepository.findByCodeIncludeDeleted(request.getCode());
        if (existingOpt.isPresent()) {
            Role existingRole = existingOpt.get();
            if (existingRole.getDeletedAt() != null || existingRole.getStatus() == RoleStatus.DELETED) {
                // Restore the soft-deleted role
                existingRole.setName(request.getName());
                existingRole.setDescription(request.getDescription());
                existingRole.setMenuPermissions(resolveMenuCodes(request.getMenuCodes()));
                existingRole.setStatus(RoleStatus.ACTIVE);
                existingRole.setDeletedAt(null);
                existingRole.setDeletedBy(null);
                existingRole.setUserCount(0);

                Role saved = roleRepository.save(existingRole);
                auditLog("ROLE_CREATE", "Role-" + saved.getCode(), "Khôi phục và cập nhật vai trò " + saved.getCode());
                log.info("Restored and updated role: {} ({})", saved.getCode(), saved.getId());
                return saved;
            } else {
                throw new IllegalArgumentException("Mã vai trò đã tồn tại: " + request.getCode());
            }
        }

        Role role = new Role();
        role.setName(request.getName());
        role.setCode(request.getCode());
        role.setDescription(request.getDescription());
        role.setMenuPermissions(resolveMenuCodes(request.getMenuCodes()));
        if (request.getPermissions() != null) {
            List<Permission> perms = permissionRepository.findByCodeIn(request.getPermissions());
            role.setPermissions(new java.util.HashSet<>(perms));
        } else {
            role.setPermissions(new java.util.HashSet<>());
        }
        role.setStatus(RoleStatus.ACTIVE);
        role.setUserCount(0);

        Role saved = roleRepository.save(role);
        auditLog("ROLE_CREATE", "Role-" + saved.getCode(), "Tạo mới vai trò " + saved.getCode());
        log.info("Created role: {} ({})", saved.getCode(), saved.getId());
        return saved;
    }

    /**
     * Cập nhật vai trò.
     *
     * @throws EntityNotFoundException nếu không tìm thấy role
     * @throws IllegalArgumentException nếu code mới đã được dùng
     */
    @Transactional
    public Role update(UUID id, UpdateRoleRequest request) {
        Role role = findById(id);

        if (request.getName() != null && !java.util.Objects.equals(request.getName(), role.getName())) {
            role.setName(request.getName());
        }
        if (request.getCode() != null && !request.getCode().equals(role.getCode())) {
            if (roleRepository.existsByCodeAndIdNot(request.getCode(), id)) {
                throw new IllegalArgumentException("Mã vai trò đã tồn tại: " + request.getCode());
            }
            role.setCode(request.getCode());
        }
        if (request.getDescription() != null && !java.util.Objects.equals(request.getDescription(), role.getDescription())) {
            role.setDescription(request.getDescription());
        }
        boolean permissionsChanged = false;

        if (request.getPermissions() != null) {
            List<Permission> perms = permissionRepository.findByCodeIn(request.getPermissions());
            Set<Permission> newPerms = new java.util.HashSet<>(perms);
            if (role.getPermissions() == null) {
                role.setPermissions(newPerms);
            } else {
                role.getPermissions().retainAll(newPerms);
                role.getPermissions().addAll(newPerms);
            }
            permissionsChanged = true;
        }

        if (request.getMenuCodes() != null) {
            Set<SystemMenu> menus = resolveMenuCodes(request.getMenuCodes());
            role.getMenuPermissions().retainAll(menus);
            role.getMenuPermissions().addAll(menus);
            permissionsChanged = true;
        }

        Role saved = roleRepository.save(role);

        // JWT contains a permission snapshot used by the frontend route/menu guards.
        // Bump the version as well as clearing Redis whenever either API permissions
        // or menu permissions changes.
        if (permissionsChanged) {
            for (UUID userId : userRepository.findIdsByRoleId(saved.getId())) {
                permissionCacheService.invalidateAndIncrementVersion(userId);
            }
        }

        auditLog("ROLE_UPDATE", "Role-" + saved.getCode(), "Cập nhật thông tin/quyền cho vai trò " + saved.getCode());
        log.info("Updated role: {} ({})", saved.getCode(), saved.getId());
        return saved;
    }

    /**
     * Xóa vai trò.
     * BR-275-03: System roles cannot be deleted, set status to INACTIVE instead.
     *
     * @throws EntityNotFoundException nếu không tìm thấy role
     */
    public Role delete(UUID id) {
        Role role = findById(id);
        if (Boolean.TRUE.equals(role.getIsSystem())) {
            role.setStatus(RoleStatus.INACTIVE);
            Role saved = roleRepository.save(role);
            auditLog("ROLE_DISABLE", "Role-" + saved.getCode(), "Chuyển trạng thái vai trò hệ thống sang INACTIVE");
            log.info("System role cannot be deleted, set status to INACTIVE: {} ({})", saved.getCode(), saved.getId());
            return saved;
        }
        role.setStatus(RoleStatus.DELETED);
        role.softDelete(SecurityUtils.getCurrentUserId());
        Role saved = roleRepository.save(role);
        auditLog("ROLE_DELETE", "Role-" + saved.getCode(), "Xóa mềm vai trò " + saved.getCode());
        log.info("Soft-deleted role: {} ({})", saved.getCode(), saved.getId());
        return saved;
    }

    @Transactional
    public void updateUserCount(UUID id) {
        Role role = findById(id);
        long count = userRepository.countByRoleId(id);
        role.setUserCount((int) count);
        roleRepository.save(role);
    }
}
