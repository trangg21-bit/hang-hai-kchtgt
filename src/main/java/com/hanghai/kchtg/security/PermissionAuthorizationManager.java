package com.hanghai.kchtg.security;

import java.util.UUID;

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
 * Returning AuthorizationDecision was a bug: any non-null object is truthy in SpEL,
 * causing all @PreAuthorize guards to always pass regardless of isGranted().
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
        return userPermissions.contains(requiredPermission);
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

    /**
     * Resolves the {@link User} behind the authentication principal, whether it is
     * the entity itself, a Spring Security user, or a bare username string.
     */
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

    /**
     * Returns the user's effective permissions, using Redis as a best-effort cache.
     * <p>
     * The cache is a pure optimization: any failure (Redis unavailable, miss, empty
     * result) falls back to computing permissions straight from the database, so an
     * authorization decision is never blocked or altered by cache state. The cache is
     * invalidated whenever the user's roles or a role's permissions change.
     */
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
