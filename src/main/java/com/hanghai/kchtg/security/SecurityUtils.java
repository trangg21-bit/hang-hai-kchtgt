package com.hanghai.kchtg.security;

import com.hanghai.kchtg.user.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.UUID;

public class SecurityUtils {
    
    /**
     * Gets the currently authenticated user's ID.
     * Returns null if there is no authenticated user (e.g., system jobs).
     */
    public static UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User) {
            return ((User) auth.getPrincipal()).getId();
        }
        return null; // or throw an exception if required
    }
    public static String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            if (auth.getPrincipal() instanceof User) {
                return ((User) auth.getPrincipal()).getUsername();
            } else if (auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                return ((org.springframework.security.core.userdetails.UserDetails) auth.getPrincipal()).getUsername();
            } else {
                return auth.getName();
            }
        }
        return null;
    }
}
