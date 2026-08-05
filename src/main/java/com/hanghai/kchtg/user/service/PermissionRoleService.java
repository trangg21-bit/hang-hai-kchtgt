package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.security.PermissionMiddleware;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

/**
 * Permission evaluation service for 3-level RBAC (F-275).
 * <p>
 * Provides permission-checking methods used by {@link PermissionMiddleware}
 * and other security components. Supports Super Admin bypass and wildcard matching.
 * </p>
 */
@Service
public class PermissionRoleService {

    private static final Logger log = LoggerFactory.getLogger(PermissionRoleService.class);

    private final UserRepository userRepository;

    @Value("${security.permission.super-admin-role-code:ROLE_SYSTEM_ADMIN}")
    private String superAdminRoleCode;

    public PermissionRoleService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Check if a user has permission for the given resource and action.
     * <p>
     * Super Admin bypass: if the user holds the super-admin role, return true immediately.
     * Aggregate matching: a feature-level permission like {@code resource:manage}
     * grants access to that resource so the middleware can continue to the
     * endpoint's finer-grained {@code @PreAuthorize} check.
     * Wildcard matching: a permission like {@code resource:*} grants all actions on that resource.
     * </p>
     *
     * @param userId   the user's UUID
     * @param resource the resource (feature) to check
     * @param action   the action to check
     * @return true if the user has the permission
     */
    public boolean checkPermission(UUID userId, String resource, String action) {
        if (userId == null || resource == null || action == null) {
            return false;
        }
        User user = userRepository.findByIdWithRelations(userId).orElse(null);
        if (user == null) {
            return false;
        }
        // Super Admin bypass
        if (isSuperAdmin(user)) {
            return true;
        }
        Set<String> permissions = user.getAllPermissions();
        String requiredPermission = resource + ":" + action;
        String wildcardPermission = resource + ":*";
        String aggregatePermission = resource + ":manage";
        // Keep compatibility with the legacy catalog where write was the
        // aggregate for create/update/delete operations.
        boolean legacyWritePermission = Set.of("create", "update", "delete").contains(action)
                && permissions.contains(resource + ":write");
        return permissions.contains(requiredPermission)
                || permissions.contains(wildcardPermission)
                || permissions.contains(aggregatePermission)
                || legacyWritePermission;
    }

    /**
     * Check if the user is a Super Admin by inspecting role codes.
     */
    public boolean isSuperAdmin(User user) {
        if (user == null || user.getRoles() == null) {
            return false;
        }
        return user.getRoles().stream()
                .anyMatch(role -> superAdminRoleCode.equals(role.getCode()));
    }

    /**
     * OR-logic: true if the user has ANY of the specified permission codes.
     */
    public boolean checkAnyPermission(UUID userId, String... codes) {
        if (codes == null || codes.length == 0) {
            return false;
        }
        for (String code : codes) {
            String[] parts = code.split(":", 2);
            if (parts.length == 2 && checkPermission(userId, parts[0], parts[1])) {
                return true;
            }
        }
        return false;
    }

    /**
     * AND-logic: true only if the user has ALL of the specified permission codes.
     */
    public boolean checkAllPermissions(UUID userId, String... codes) {
        if (codes == null || codes.length == 0) {
            return false;
        }
        for (String code : codes) {
            String[] parts = code.split(":", 2);
            if (parts.length != 2 || !checkPermission(userId, parts[0], parts[1])) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get the set of permission codes for a user.
     */
    public Set<String> getUserPermissions(UUID userId) {
        User user = userRepository.findByIdWithRelations(userId).orElse(null);
        if (user == null) {
            return Set.of();
        }
        return user.getAllPermissions();
    }
}
