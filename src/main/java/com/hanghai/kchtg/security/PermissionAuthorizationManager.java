package com.hanghai.kchtg.security;

import com.hanghai.kchtg.security.constants.PermissionConstants;
import static com.hanghai.kchtg.security.constants.PermissionConstants.*;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;

/**
 * Authorization bean for Spring Security @PreAuthorize expressions.
 * Usage: @PreAuthorize("@auth.check(authentication, 'resource:action')")
 *
 * Returns boolean so SpEL evaluates the actual grant/deny value.
 */
@Component("auth")
public class PermissionAuthorizationManager {

    private static final Logger log = LoggerFactory.getLogger(PermissionAuthorizationManager.class);

    private final UserRepository userRepository;
    private final PermissionCacheService permissionCacheService;

    public PermissionAuthorizationManager(UserRepository userRepository,
                                          PermissionCacheService permissionCacheService) {
        this.userRepository = userRepository;
        this.permissionCacheService = permissionCacheService;
    }

    /**
     * Check if the authenticated user has the required permission.
     * Called by Spring Security's @PreAuthorize expression parser.
     *
     * @return true if the user holds the required permission, false otherwise
     */
    public boolean check(Authentication authentication, String requiredPermission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        // Grant full access to system administrators
        boolean isSystemAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SYSTEM_ADMIN")
                        || a.getAuthority().equals("ROLE_SUPER_ADMIN")
                        || a.getAuthority().equals("SYSTEM_ADMIN"));
        if (isSystemAdmin) {
            return true;
        }

        Set<String> userPermissions = extractPermissions(authentication);
        if (userPermissions.contains(requiredPermission)) {
            return true;
        }

        if (requiredPermission != null) {
            String normNoColon = requiredPermission.replace(":approve:", ":approve");
            if (userPermissions.contains(normNoColon)) {
                return true;
            }
            String normColon = requiredPermission.replace(":approvec1", ":approve:c1").replace(":approvec2", ":approve:c2");
            if (userPermissions.contains(normColon)) {
                return true;
            }
        }

        // Aliases for approve actions: resource:approve matches resource:approvec1 or resource:approvec2
        String approveSuffix = ":" + ACTION_APPROVE;
        if (requiredPermission != null && requiredPermission.endsWith(approveSuffix)) {
            String prefix = requiredPermission.substring(0, requiredPermission.length() - approveSuffix.length());
            if (userPermissions.contains(PermissionConstants.build(prefix, ACTION_APPROVE_C1)) 
                    || userPermissions.contains(PermissionConstants.build(prefix, ACTION_APPROVE_C2))) {
                return true;
            }
        }

        return false;
    }

    public Set<String> extractPermissions(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return Collections.emptySet();
        }
        User user = resolveUser(authentication.getPrincipal());
        if (user == null) {
            return Collections.emptySet();
        }
        return resolvePermissions(user);
    }

    private User resolveUser(Object principal) {
        if (principal instanceof User user) {
            return user;
        }
        if (principal instanceof org.springframework.security.core.userdetails.User springUser) {
            return userRepository.findByUsernameWithRelations(springUser.getUsername()).orElse(null);
        }
        if (principal instanceof String username) {
            return userRepository.findByUsernameWithRelations(username).orElse(null);
        }
        return null;
    }

    private Set<String> resolvePermissions(User user) {
        UUID userId = user.getId();
        if (userId != null) {
            try {
                Set<String> cached = permissionCacheService.getPermissionsFromCache(userId);
                if (cached != null && !cached.isEmpty()) {
                    return cached;
                }
            } catch (RuntimeException e) {
                log.debug("Permission cache read failed for user {} - falling back to DB: {}", userId, e.getMessage());
            }
        }

        Set<String> permissions = user.getAllPermissions();

        if (userId != null && !permissions.isEmpty()) {
            try {
                permissionCacheService.cachePermissions(userId, permissions);
            } catch (RuntimeException e) {
                log.debug("Permission cache write failed for user {}: {}", userId, e.getMessage());
            }
        }
        return permissions;
    }
}
