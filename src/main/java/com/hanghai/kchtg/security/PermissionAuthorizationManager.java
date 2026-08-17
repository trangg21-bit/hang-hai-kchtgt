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
import java.util.Locale;
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

    /** Resources ungated by business rule — any authenticated user is granted access. */
    private static final Set<String> ALWAYS_ALLOWED_RESOURCES = Set.of("port", "berth", "pier");

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

        Set<String> userPermissions = extractPermissions(authentication);
        String normalizedRequired = normalize(requiredPermission);
        if (normalizedRequired != null && ALWAYS_ALLOWED_RESOURCES.contains(resourceOf(normalizedRequired))) {
            return true;
        }
        if (userPermissions.contains("*") || userPermissions.contains("admin:all")
                || userPermissions.contains(normalizedRequired)) {
            return true;
        }

        if (normalizedRequired != null) {
            String[] parts = normalizedRequired.split(":", 2);
            String resource = parts.length == 2 ? parts[0] : null;
            String action = parts.length == 2 ? parts[1] : null;
            if (resource != null && (userPermissions.contains(resource + ":manage")
                    || userPermissions.contains(resource + ":*"))) {
                return true;
            }
            if (resource != null && Set.of(ACTION_CREATE, ACTION_UPDATE, ACTION_DELETE).contains(action)
                    && userPermissions.contains(resource + ":write")) {
                return true;
            }

            String normNoColon = normalizedRequired.replace(":approve:", ":approve");
            if (userPermissions.contains(normNoColon)) {
                return true;
            }
            String normColon = normalizedRequired.replace(":approvec1", ":approve:c1").replace(":approvec2", ":approve:c2");
            if (userPermissions.contains(normColon)) {
                return true;
            }
        }

        // Aliases for approve actions: resource:approve matches resource:approvec1 or resource:approvec2
        String approveSuffix = ":" + ACTION_APPROVE;
        if (normalizedRequired != null && normalizedRequired.endsWith(approveSuffix)) {
            String prefix = normalizedRequired.substring(0, normalizedRequired.length() - approveSuffix.length());
            if (userPermissions.contains(PermissionConstants.build(prefix, ACTION_APPROVE_C1)) 
                    || userPermissions.contains(PermissionConstants.build(prefix, ACTION_APPROVE_C2))) {
                return true;
            }
        }

        return false;
    }

    private static String resourceOf(String permission) {
        return permission.split(":", 2)[0];
    }

    private String normalize(String permission) {
        if (permission == null) return null;
        return permission.trim().toLowerCase(Locale.ROOT)
                .replace(":approve:c1", ":approvec1")
                .replace(":approve:c2", ":approvec2");
    }

    public Set<String> extractPermissions(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return Collections.emptySet();
        }

        Set<String> authorityPermissions = authentication.getAuthorities() != null
                ? authentication.getAuthorities().stream()
                        .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                        .map(this::normalize)
                        .collect(java.util.stream.Collectors.toSet())
                : Collections.emptySet();

        if (authorityPermissions.contains("*")
                || authorityPermissions.contains("admin:all")
                || authorityPermissions.contains("admin:manage")
                ) {
            Set<String> superAdminPerms = new java.util.HashSet<>(authorityPermissions);
            superAdminPerms.add("*");
            superAdminPerms.add("admin:all");
            return superAdminPerms;
        }

        User user = resolveUser(authentication.getPrincipal());
        if (user == null) {
            return authorityPermissions;
        }
        Set<String> resolved = new java.util.HashSet<>(resolvePermissions(user));
        resolved.addAll(authorityPermissions);
        return resolved;
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

        Set<String> permissions = user.getAllPermissions().stream()
                .map(this::normalize)
                .collect(java.util.stream.Collectors.toSet());

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
