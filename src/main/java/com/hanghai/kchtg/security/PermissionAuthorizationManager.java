package com.hanghai.kchtg.security;

import com.hanghai.kchtg.security.service.EffectivePermissionService;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * Authorization bean for Spring Security @PreAuthorize expressions.
 * Usage: @PreAuthorize("@auth.check(authentication, 'resource:action')")
 * <p>
 * Delegates all evaluations to {@link EffectivePermissionService}.
 * </p>
 */
@Component("auth")
public class PermissionAuthorizationManager {

    private static final Set<String> LEGACY_ROUTE_FALLBACK_RESOURCES = Set.of(
            "data", "infraasset", "specialstation", "coastalstation", "station");

    private final EffectivePermissionService effectivePermissionService;

    @Autowired
    public PermissionAuthorizationManager(EffectivePermissionService effectivePermissionService) {
        this.effectivePermissionService = effectivePermissionService;
    }

    /**
     * Backward-compatible constructor for existing tests.
     */
    public PermissionAuthorizationManager(UserRepository userRepository,
                                          PermissionCacheService permissionCacheService) {
        this.effectivePermissionService = new EffectivePermissionService(userRepository, permissionCacheService);
    }

    /**
     * Check if the authenticated user has any of the required permissions.
     * Called by Spring Security's @PreAuthorize expression parser.
     *
     * @return true if the user holds any of the required permissions, false otherwise
     */
    public boolean check(Authentication authentication, String... requiredPermissions) {
        if (requiredPermissions == null || requiredPermissions.length == 0) return true;
        for (String permission : requiredPermissions) {
            if (effectivePermissionService.checkPermission(authentication, permission)) {
                return true;
            }
        }
        return false;
    }

    public boolean checkAny(Authentication authentication, String... requiredPermissions) {
        if (requiredPermissions == null || requiredPermissions.length == 0) {
            return true;
        }

        List<String> normalized = Arrays.stream(requiredPermissions)
                .filter(permission -> permission != null && !permission.isBlank())
                .toList();
        List<String> historyPermissions = normalized.stream()
                .filter(permission -> "history".equals(actionOf(permission)))
                .toList();
        if (!historyPermissions.isEmpty()) {
            return historyPermissions.stream()
                    .anyMatch(permission -> effectivePermissionService.checkPermission(authentication, permission));
        }
        List<String> updatePermissions = normalized.stream()
                .filter(permission -> "update".equals(actionOf(permission)))
                .toList();
        boolean includesC2Approval = normalized.stream()
                .anyMatch(permission -> "approvec2".equals(actionOf(permission)));
        boolean includesCreateOrDelete = normalized.stream()
                .map(PermissionAuthorizationManager::actionOf)
                .anyMatch(action -> "create".equals(action) || "delete".equals(action));

        // A C2 approval right is not an update right. Legacy update routes used
        // `checkAny(update, approvec2)` so an approver could modify data without
        // the explicit update checkbox. Preserve create/delete attachment routes,
        // but for a pure update route require its concrete `:update` permission.
        if (!updatePermissions.isEmpty() && includesC2Approval && !includesCreateOrDelete) {
            return updatePermissions.stream()
                    .anyMatch(permission -> effectivePermissionService.checkPermission(authentication, permission));
        }
        String primaryPermission = normalized.stream()
                .filter(permission -> !LEGACY_ROUTE_FALLBACK_RESOURCES.contains(resourceOf(permission)))
                .findFirst()
                .orElse(null);

        // Generic legacy permissions (`data:*`, `specialstation:*`, ...) were
        // appended as fallbacks to many resource routes.  Once a concrete
        // resource is present, evaluate only that resource and its formal
        // aliases.  This makes a blank Inmarsat permission branch mean no
        // Inmarsat access, including for an administrator account.
        if (primaryPermission == null) {
            return check(authentication, requiredPermissions);
        }
        String primaryResource = resourceOf(primaryPermission);
        return normalized.stream()
                .filter(permission -> EffectivePermissionService.areEquivalentResources(
                        primaryResource, resourceOf(permission)))
                .anyMatch(permission -> effectivePermissionService.checkPermission(authentication, permission));
    }

    private static String resourceOf(String permission) {
        int separator = permission.indexOf(':');
        return (separator >= 0 ? permission.substring(0, separator) : permission).trim().toLowerCase();
    }

    private static String actionOf(String permission) {
        int separator = permission.indexOf(':');
        return (separator >= 0 ? permission.substring(separator + 1) : "read").trim().toLowerCase();
    }

    /**
     * Extract the effective permissions for the given Authentication.
     */
    public Set<String> extractPermissions(Authentication authentication) {
        return effectivePermissionService.getEffectivePermissions(authentication);
    }
}
