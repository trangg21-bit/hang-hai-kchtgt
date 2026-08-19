package com.hanghai.kchtg.fieldvisibility.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.fieldvisibility.service.FieldVisibilityService;
import com.hanghai.kchtg.user.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;
import java.util.Map;

/**
 * UX-layer visibility endpoint (M-1004 PoC): returns the per-field effect map for the
 * current authenticated user. The Jackson strip (WO-BE-8) remains authoritative for
 * security; this map only drives the frontend UX (column hiding / form disabling).
 */
@RestController
@RequestMapping("/api/field-visibility")
public class FieldVisibilityController {

    private static final int MAX_RESOURCE_LENGTH = 100;

    private final FieldVisibilityService fieldVisibilityService;

    public FieldVisibilityController(FieldVisibilityService fieldVisibilityService) {
        this.fieldVisibilityService = fieldVisibilityService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> getVisibility(
            @RequestParam("resource") String resource) {
        // Trim user input; defensive length cap (threat-model F-06).
        String normalized = (resource == null) ? null : resource.trim().toLowerCase(Locale.ROOT);
        if (normalized != null && normalized.length() > MAX_RESOURCE_LENGTH) {
            normalized = normalized.substring(0, MAX_RESOURCE_LENGTH);
        }
        User user = currentUser();
        Map<String, String> visibility = fieldVisibilityService.getVisibilityMap(user, normalized);
        return ResponseEntity.ok(ApiResponse.success(visibility));
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User user) {
            return user;
        }
        return null;
    }
}
