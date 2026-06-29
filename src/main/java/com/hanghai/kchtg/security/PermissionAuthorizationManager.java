package com.hanghai.kchtg.security;

import com.hanghai.kchtg.user.entity.User;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Authorization bean for Spring Security @PreAuthorize expressions.
 * Usage: @PreAuthorize("@auth.check(authentication, 'resource:action')")
 */
@Component("auth")
public class PermissionAuthorizationManager {

    /**
     * Check if the authenticated user has the required permission.
     * Called by Spring Security's @PreAuthorize expression parser.
     */
    public boolean check(Authentication authentication, String requiredPermission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.User) {
            return true;
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
