package com.hanghai.kchtg.security;

import com.hanghai.kchtg.security.service.EffectivePermissionService;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

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
        return check(authentication, requiredPermissions);
    }

    /**
     * Extract the effective permissions for the given Authentication.
     */
    public Set<String> extractPermissions(Authentication authentication) {
        return effectivePermissionService.getEffectivePermissions(authentication);
    }
}
