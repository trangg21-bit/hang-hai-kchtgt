package com.hanghai.kchtg.security;

import com.hanghai.kchtg.user.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;

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
        return userPermissions.contains(requiredPermission);
    }

    public Set<String> extractPermissions(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return Collections.emptySet();
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof User) {
            User user = (User) principal;
            return user.getAllPermissions();
        }
        return Collections.emptySet();
    }
}
