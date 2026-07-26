package com.hanghai.kchtg.security;

import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Decides whether the acting user may clear a whole approval chain in one step.
 * <p>
 * The domain modules use a two-level workflow: level 1 (C1) moves a record from
 * {@code PROPOSED} to {@code UNDER_REVIEW}, and level 2 (C2) moves it to
 * {@code APPROVED}. Administrators are allowed to short-circuit that chain — a
 * single C1 approval marks both levels and lands the record on {@code APPROVED}.
 * <p>
 * The authority set deliberately mirrors the one
 * {@link PermissionAuthorizationManager#check} already treats as unrestricted, so
 * "who counts as an administrator" has a single answer across the system.
 * <p>
 * <strong>Note:</strong> auto-approval also bypasses the separation-of-duties rule
 * that normally forbids the same person from signing both C1 and C2. That is the
 * intended trade-off of granting an administrator a one-step approval.
 */
public final class AdminAutoApproval {

    /** Authorities that may approve both levels at once. */
    private static final Set<String> ADMIN_AUTHORITIES = Set.of(
            "ROLE_SYSTEM_ADMIN",
            "ROLE_SUPER_ADMIN",
            "SYSTEM_ADMIN",
            "SUPER_ADMIN");

    private AdminAutoApproval() {
    }

    /**
     * Whether the user behind the current security context may auto-approve.
     * Returns {@code false} when there is no authenticated user, so an absent
     * context never widens access.
     */
    public static boolean isAutoApprover() {
        return isAutoApprover(SecurityContextHolder.getContext().getAuthentication());
    }

    /**
     * Whether the given authentication may auto-approve.
     *
     * @param authentication the caller's authentication, may be {@code null}
     * @return {@code true} only for an authenticated administrator
     */
    public static boolean isAutoApprover(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(granted -> ADMIN_AUTHORITIES.contains(granted.getAuthority()));
    }
}
