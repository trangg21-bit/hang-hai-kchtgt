package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.security.service.EffectivePermissionService;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

/**
 * Permission evaluation facade for 3-level RBAC (F-275).
 * <p>
 * Delegates all evaluations directly to {@link EffectivePermissionService}.
 * Preserves 100% backward compatibility for existing callers and test fixtures.
 * </p>
 */
@Service
public class PermissionRoleService {

    private final EffectivePermissionService effectivePermissionService;

    @Autowired
    public PermissionRoleService(EffectivePermissionService effectivePermissionService) {
        this.effectivePermissionService = effectivePermissionService;
    }

    /**
     * Backward-compatible constructor for existing tests.
     */
    public PermissionRoleService(UserRepository userRepository) {
        this.effectivePermissionService = new EffectivePermissionService(
                userRepository,
                new PermissionCacheService(null, userRepository));
    }

    /**
     * Check if a user has permission for the given resource and action.
     */
    public boolean checkPermission(UUID userId, String resource, String action) {
        return effectivePermissionService.checkPermission(userId, resource, action);
    }

    /**
     * Check a request using the already authenticated permission snapshot.
     * This avoids resolving the same user from Redis/DB a second time after
     * JwtAuthFilter has populated the SecurityContext.
     */
    public boolean checkPermission(Authentication authentication, String resource, String action) {
        return effectivePermissionService.checkPermission(authentication, resource, action);
    }

    /** Check whether the user has the direct global permission. */
    public boolean isSuperAdmin(User user) {
        return effectivePermissionService.isSuperAdmin(user);
    }

    /** Check whether the authentication holds global super-admin authority. */
    public boolean isSuperAdmin(org.springframework.security.core.Authentication authentication) {
        return effectivePermissionService.isSuperAdmin(authentication);
    }

    /**
     * OR-logic: true if the user has ANY of the specified permission codes.
     */
    public boolean checkAnyPermission(UUID userId, String... codes) {
        return effectivePermissionService.checkAnyPermission(userId, codes);
    }

    /**
     * AND-logic: true only if the user has ALL of the specified permission codes.
     */
    public boolean checkAllPermissions(UUID userId, String... codes) {
        return effectivePermissionService.checkAllPermissions(userId, codes);
    }

    /**
     * Get the set of effective permission codes for a user.
     */
    public Set<String> getUserPermissions(UUID userId) {
        return effectivePermissionService.getEffectivePermissions(userId);
    }
}
