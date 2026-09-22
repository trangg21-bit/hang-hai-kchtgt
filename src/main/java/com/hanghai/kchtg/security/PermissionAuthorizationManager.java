package com.hanghai.kchtg.security;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.hanghai.kchtg.assetmovement.entity.InfraAsset;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import com.hanghai.kchtg.assetmovement.repository.InfraAssetRepository;
import com.hanghai.kchtg.security.service.EffectivePermissionService;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.repository.UserRepository;

/**
 * Authorization bean for Spring Security @PreAuthorize expressions.
 * Usage: @PreAuthorize("@auth.check(authentication, 'resource:action')")
 * <p>
 * Delegates all evaluations to {@link EffectivePermissionService}.
 * </p>
 */
@Component("auth")
public class PermissionAuthorizationManager {

    private static final Set<String> LEGACY_ROUTE_FALLBACK_RESOURCES = Set.of(
            "data", "infraasset", "specialstation", "coastalstation", "station");

    private final EffectivePermissionService effectivePermissionService;

    @Autowired(required = false)
    private InfraAssetRepository infraAssetRepository;

    @Autowired
    public PermissionAuthorizationManager(EffectivePermissionService effectivePermissionService,
                                          @Autowired(required = false) InfraAssetRepository infraAssetRepository) {
        this.effectivePermissionService = effectivePermissionService;
        this.infraAssetRepository = infraAssetRepository;
    }

    /**
     * Backward-compatible constructor for existing tests.
     */
    public PermissionAuthorizationManager(UserRepository userRepository,
                                          PermissionCacheService permissionCacheService) {
        this.effectivePermissionService = new EffectivePermissionService(userRepository, permissionCacheService);
    }

    public void setInfraAssetRepository(InfraAssetRepository infraAssetRepository) {
        this.infraAssetRepository = infraAssetRepository;
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
        if (requiredPermissions == null || requiredPermissions.length == 0) {
            return true;
        }

        List<String> normalized = Arrays.stream(requiredPermissions)
                .filter(permission -> permission != null && !permission.isBlank())
                .toList();
        List<String> historyPermissions = normalized.stream()
                .filter(permission -> "history".equals(actionOf(permission)))
                .toList();
        if (!historyPermissions.isEmpty()) {
            return historyPermissions.stream()
                    .anyMatch(permission -> effectivePermissionService.checkPermission(authentication, permission));
        }
        List<String> updatePermissions = normalized.stream()
                .filter(permission -> "update".equals(actionOf(permission)))
                .toList();
        boolean includesC2Approval = normalized.stream()
                .anyMatch(permission -> "approvec2".equals(actionOf(permission)));
        boolean includesCreateOrDelete = normalized.stream()
                .map(PermissionAuthorizationManager::actionOf)
                .anyMatch(action -> "create".equals(action) || "delete".equals(action));

        // A C2 approval right is not an update right. Legacy update routes used
        // `checkAny(update, approvec2)` so an approver could modify data without
        // the explicit update checkbox. Preserve create/delete attachment routes,
        // but for a pure update route require its concrete `:update` permission.
        if (!updatePermissions.isEmpty() && includesC2Approval && !includesCreateOrDelete) {
            return updatePermissions.stream()
                    .anyMatch(permission -> effectivePermissionService.checkPermission(authentication, permission));
        }
        String primaryPermission = normalized.stream()
                .filter(permission -> !LEGACY_ROUTE_FALLBACK_RESOURCES.contains(resourceOf(permission)))
                .findFirst()
                .orElse(null);

        // Generic legacy permissions (`data:*`, `specialstation:*`, ...) were
        // appended as fallbacks to many resource routes.  Once a concrete
        // resource is present, evaluate only that resource and its formal
        // aliases.  This makes a blank Inmarsat permission branch mean no
        // Inmarsat access, including for an administrator account.
        if (primaryPermission == null) {
            return check(authentication, requiredPermissions);
        }
        String primaryResource = resourceOf(primaryPermission);
        return normalized.stream()
                .filter(permission -> EffectivePermissionService.areEquivalentResources(
                        primaryResource, resourceOf(permission)))
                .anyMatch(permission -> effectivePermissionService.checkPermission(authentication, permission));
    }

    private static String resourceOf(String permission) {
        int separator = permission.indexOf(':');
        return (separator >= 0 ? permission.substring(0, separator) : permission).trim().toLowerCase();
    }

    private static String actionOf(String permission) {
        int separator = permission.indexOf(':');
        return (separator >= 0 ? permission.substring(separator + 1) : "read").trim().toLowerCase();
    }

    /**
     * Extract the effective permissions for the given Authentication.
     */
    public Set<String> extractPermissions(Authentication authentication) {
        return effectivePermissionService.getEffectivePermissions(authentication);
    }

    /**
     * Check approval permission (C1 or C2) for a specific infrastructure asset.
     */
    public boolean checkAssetApproval(Authentication authentication, UUID assetId, String level) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        if (effectivePermissionService.checkPermission(authentication, "*")
                || effectivePermissionService.checkPermission(authentication, "infraasset:manage")) {
            return true;
        }

        String targetAction;
        String fallbackAction = null;
        if ("c1".equalsIgnoreCase(level)) {
            targetAction = "approvec1";
        } else if ("c2".equalsIgnoreCase(level)) {
            targetAction = "approvec2";
        } else if ("rejectc1".equalsIgnoreCase(level)) {
            targetAction = "rejectc1";
            fallbackAction = "approvec1"; // approvec1 also grants reject rights
        } else if ("rejectc2".equalsIgnoreCase(level)) {
            targetAction = "rejectc2";
            fallbackAction = "approvec2"; // approvec2 also grants reject rights
        } else {
            targetAction = "approvec1";
        }

        if (effectivePermissionService.checkPermission(authentication, "infraasset:" + targetAction)
                || (fallbackAction != null && effectivePermissionService.checkPermission(authentication, "infraasset:" + fallbackAction))) {
            return true;
        }

        String resource = resolveAssetResource(assetId);
        if (resource != null) {
            if (effectivePermissionService.checkPermission(authentication, resource + ":" + targetAction)
                    || effectivePermissionService.checkPermission(authentication, resource + ":manage")
                    || (fallbackAction != null && effectivePermissionService.checkPermission(authentication, resource + ":" + fallbackAction))) {
                return true;
            }
        } else {
            // Fallback: Nếu không phân giải được resource từ DB, kiểm tra xem user có quyền trên bất kỳ loại tài sản hạ tầng nào
            for (InfraAssetType type : InfraAssetType.values()) {
                String res = mapAssetTypeToResource(type);
                if (effectivePermissionService.checkPermission(authentication, res + ":" + targetAction)
                        || effectivePermissionService.checkPermission(authentication, res + ":manage")
                        || (fallbackAction != null && effectivePermissionService.checkPermission(authentication, res + ":" + fallbackAction))) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check action permission (submit, history, read, update, delete) for a specific infrastructure asset.
     */
    public boolean checkAssetAction(Authentication authentication, UUID assetId, String action) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        if (effectivePermissionService.checkPermission(authentication, "*")
                || effectivePermissionService.checkPermission(authentication, "infraasset:manage")) {
            return true;
        }

        String resource = resolveAssetResource(assetId);

        if ("submit".equalsIgnoreCase(action)) {
            if (effectivePermissionService.checkPermission(authentication, "infraasset:update")
                    || effectivePermissionService.checkPermission(authentication, "infraasset:create")) {
                return true;
            }
            if (resource != null) {
                return effectivePermissionService.checkPermission(authentication, resource + ":update")
                        || effectivePermissionService.checkPermission(authentication, resource + ":create")
                        || effectivePermissionService.checkPermission(authentication, resource + ":manage");
            }
            return false;
        }

        if ("history".equalsIgnoreCase(action)) {
            if (effectivePermissionService.checkPermission(authentication, "infraasset:history")
                    || effectivePermissionService.checkPermission(authentication, "infraasset:manage")) {
                return true;
            }
            if (resource != null) {
                return effectivePermissionService.checkPermission(authentication, resource + ":history")
                        || effectivePermissionService.checkPermission(authentication, resource + ":manage");
            }
            return false;
        }

        if ("read".equalsIgnoreCase(action)) {
            if (effectivePermissionService.checkPermission(authentication, "data:read")
                    || effectivePermissionService.checkPermission(authentication, "infraasset:read")) {
                return true;
            }
            if (resource != null) {
                return effectivePermissionService.checkPermission(authentication, resource + ":read")
                        || effectivePermissionService.checkPermission(authentication, resource + ":manage");
            }
            return false;
        }

        if ("update".equalsIgnoreCase(action)) {
            if (effectivePermissionService.checkPermission(authentication, "infraasset:update")) {
                return true;
            }
            if (resource != null) {
                return effectivePermissionService.checkPermission(authentication, resource + ":update")
                        || effectivePermissionService.checkPermission(authentication, resource + ":manage");
            }
            return false;
        }

        if ("delete".equalsIgnoreCase(action)) {
            if (effectivePermissionService.checkPermission(authentication, "infraasset:delete")) {
                return true;
            }
            if (resource != null) {
                return effectivePermissionService.checkPermission(authentication, resource + ":delete")
                        || effectivePermissionService.checkPermission(authentication, resource + ":manage");
            }
            return false;
        }

        if (resource != null) {
            return effectivePermissionService.checkPermission(authentication, resource + ":" + action);
        }

        // Fallback: Nếu không phân giải được resource, kiểm tra xem user có quyền action trên bất kỳ loại tài sản nào
        for (InfraAssetType type : InfraAssetType.values()) {
            String res = mapAssetTypeToResource(type);
            if (effectivePermissionService.checkPermission(authentication, res + ":" + action)
                    || effectivePermissionService.checkPermission(authentication, res + ":manage")) {
                return true;
            }
        }

        return false;
    }

    private String resolveAssetResource(UUID assetId) {
        if (assetId == null || infraAssetRepository == null) {
            return null;
        }
        try {
            return infraAssetRepository.findById(assetId)
                    .map(InfraAsset::getAssetType)
                    .map(PermissionAuthorizationManager::mapAssetTypeToResource)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    public static String mapAssetTypeToResource(InfraAssetType assetType) {
        if (assetType == null) return "infraasset";
        return switch (assetType) {
            case PORT_TERMINAL -> "berthasset";
            case ANCHORAGE -> "anchorageasset";
            case LIGHTHOUSE -> "lighthouseasset";
            case DIKE_REVETMENT -> "dikerevetmentasset";
            case TRANSFER_AREA -> "transferareaasset";
            case STORM_SHELTER -> "stormshelterasset";
            case BUOY_BERTH -> "buoyberthasset";
            case PIER -> "pierasset";
            case BUOY -> "buoyasset";
            case NAVIGATION_CHANNEL -> "channelasset";
            case DRY_PORT -> "dryportasset";
            case LRIT_STATION -> "lritasset";
            case COSPAS_SARSAT_STATION -> "cospassarsatasset";
            case TTXLTT_STATION -> "ttxlttasset";
            case TTDH_STATION -> "daittdhasset";
            case INMARSAT_STATION -> "inmarsatasset";
            case RADAR_STATION -> "radarasset";
            case AUXILIARY_EQUIPMENT -> "vtsassistasset";
        };
    }
}
