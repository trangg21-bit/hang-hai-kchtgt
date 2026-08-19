package com.hanghai.kchtg.fieldvisibility.interceptor;

import com.hanghai.kchtg.fieldvisibility.FieldVisibilityContext;
import com.hanghai.kchtg.fieldvisibility.entity.FieldEffect;
import com.hanghai.kchtg.fieldvisibility.entity.SystemFieldCatalog;
import com.hanghai.kchtg.fieldvisibility.service.FieldVisibilityService;
import com.hanghai.kchtg.user.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Resolves the hidden-field set for the current request into the
 * {@link FieldVisibilityContext} ThreadLocal. Registered in WebConfig on
 * {@code /api/**}.
 * <p>
 * Implements fail-closed security: if an error occurs resolving policies on a
 * protected resource,
 * sensitive fields from {@link SystemFieldCatalog} are hidden by default to
 * prevent data leaks.
 * Clears the ThreadLocal unconditionally in {@code afterCompletion}.
 * </p>
 */
@Component
public class FieldVisibilityInterceptor implements HandlerInterceptor {

    /** Path prefix -> feature resource mapping across all system modules. */
    private static final Map<String, String> PATH_RESOURCE_MAP = Map.ofEntries(
            // VTS System
            Map.entry("/api/v1/vts-systems", "vts"),
            Map.entry("/api/v1/vts-system", "vts"),
            Map.entry("/api/v1/he-thong-vts", "vts"),
            // Users & Groups & OrgUnits
            Map.entry("/api/v1/users", "user"),
            Map.entry("/api/users", "user"),
            Map.entry("/api/v1/groups", "group"),
            Map.entry("/api/groups", "group"),
            Map.entry("/api/v1/org-units", "orgunit"),
            Map.entry("/api/org-units", "orgunit"),
            // Ports & Maritime Infrastructure
            Map.entry("/api/v1/ports", "port"),
            Map.entry("/api/ports", "port"),
            Map.entry("/api/v1/berths", "berth"),
            Map.entry("/api/berths", "berth"),
            Map.entry("/api/v1/piers", "pier"),
            Map.entry("/api/piers", "pier"),
            Map.entry("/api/v1/dry-ports", "dryport"),
            Map.entry("/api/dry-ports", "dryport"),
            Map.entry("/api/v1/water-zones", "waterzone"),
            Map.entry("/api/water-zones", "waterzone"),
            Map.entry("/api/v1/navigation-channel", "navigationchannel"),
            Map.entry("/api/navigation-channel", "navigationchannel"),
            Map.entry("/api/v1/dike-revetment", "dikerevetment"),
            Map.entry("/api/dike-revetment", "dikerevetment"),
            Map.entry("/api/v1/ship-repair-facility", "shiprepair"),
            Map.entry("/api/ship-repair-facility", "shiprepair"),
            Map.entry("/api/v1/radar-station", "radarstation"),
            Map.entry("/api/radar-station", "radarstation"),
            // Stations & Navigational Aids
            Map.entry("/api/v1/stations", "station"),
            Map.entry("/api/v1/station-history", "station"),
            Map.entry("/api/v1/stations/haiphong", "station"),
            Map.entry("/api/v1/stations/lrit", "station"),
            Map.entry("/api/v1/stations/inmarsat", "station"),
            Map.entry("/api/v1/stations/coastal", "station"),
            Map.entry("/api/v1/stations/cospas-sarsat", "station"),
            Map.entry("/api/v1/lighthouse-station", "lighthousestation"),
            Map.entry("/api/v1/buoy-station", "buoystation"),
            Map.entry("/api/v1/beacon-lights", "beaconlight"),
            Map.entry("/api/v1/buoys", "buoy"),
            // Documents & Planning
            Map.entry("/api/v1/documents", "document"),
            Map.entry("/api/documents", "document"),
            Map.entry("/api/v1/legal-documents", "document"),
            Map.entry("/api/v1/port-planning", "portplanning"),
            Map.entry("/api/v1/planning-adjustments", "planningadjustment"),
            // Logs, Security, Maps, Reports & BCC157
            Map.entry("/api/v1/access-logs", "log"),
            Map.entry("/api/access-logs", "log"),
            Map.entry("/api/v1/logs", "log"),
            Map.entry("/api/logs", "log"),
            Map.entry("/api/siem", "security"),
            Map.entry("/api/v1/reports", "report"),
            Map.entry("/api/reports", "report"),
            Map.entry("/api/v1/bcc157", "report"),
            Map.entry("/api/bcc157", "report"),
            Map.entry("/api/v1/bao-cao-157", "report"),
            Map.entry("/api/v1/trade-flows", "tradeflow"),
            Map.entry("/api/v1/statistics", "statistics"),
            Map.entry("/api/v1/incidents", "incident"),
            Map.entry("/api/v1/connections", "connection"),
            Map.entry("/api/v1/inventory", "inventory"),
            Map.entry("/api/v1/asset-decrease", "assetdecrease"),
            Map.entry("/api/v1/asset-increase", "assetincrease"),
            Map.entry("/api/v1/s63", "gis"),
            Map.entry("/api/v1/gis", "gis"),
            Map.entry("/api/v1/map-layers", "map"),
            Map.entry("/api/map-layers", "map"),
            Map.entry("/api/map-icons", "map"),
            Map.entry("/api/symbols", "map"),
            // Integration endpoints
            Map.entry("/api/v1/vts-integrations", "integration"),
            Map.entry("/api/v1/facility-integrations", "integration"),
            Map.entry("/api/v1/communication-integrations", "integration"),
            Map.entry("/api/v1/integrations", "integration"),
            Map.entry("/api/v1/integration", "integration"),
            Map.entry("/api/interconnect", "integration"));

    private final ObjectProvider<FieldVisibilityService> fieldVisibilityServiceProvider;

    public FieldVisibilityInterceptor(ObjectProvider<FieldVisibilityService> fieldVisibilityServiceProvider) {
        this.fieldVisibilityServiceProvider = fieldVisibilityServiceProvider;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof User user)) {
                FieldVisibilityContext.clear();
                return true;
            }
            FieldVisibilityService fieldVisibilityService = fieldVisibilityServiceProvider.getIfAvailable();
            if (fieldVisibilityService == null) {
                FieldVisibilityContext.clear();
                return true;
            }
            String resource = resolveResource(request.getRequestURI());
            FieldVisibilityContext.set(fieldVisibilityService.resolve(user, resource));
        } catch (Exception ex) {
            // Fail-closed: Apply default HIDE to all sensitive fields for the protected
            // resource
            String resource = resolveResource(request.getRequestURI());
            if (resource != null) {
                Map<String, FieldEffect> fallback = new LinkedHashMap<>();
                for (SystemFieldCatalog field : SystemFieldCatalog.getSensitiveFields(resource)) {
                    fallback.put(field.getJsonProperty(), FieldEffect.HIDE);
                }
                FieldVisibilityContext.set(fallback);
            } else {
                FieldVisibilityContext.clear();
            }
        }
        return true;
    }

    @Override
    public void afterCompletion(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler,
            Exception ex) {
        FieldVisibilityContext.clear();
    }

    private String resolveResource(String uri) {
        if (uri == null || uri.isBlank()) {
            return null;
        }
        String path = uri.trim();
        for (Map.Entry<String, String> entry : PATH_RESOURCE_MAP.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }

        // Fallback: heuristic path extraction
        String clean = path;
        if (clean.startsWith("/api/v1/")) {
            clean = clean.substring("/api/v1/".length());
        } else if (clean.startsWith("/api/")) {
            clean = clean.substring("/api/".length());
        } else {
            return null;
        }

        int slash = clean.indexOf('/');
        String segment = slash > 0 ? clean.substring(0, slash) : clean;
        segment = segment.replace("-", "").replace("_", "").toLowerCase(java.util.Locale.ROOT);
        if (segment.endsWith("ies") && segment.length() > 3) {
            return segment.substring(0, segment.length() - 3) + "y";
        }
        if (segment.endsWith("es") && segment.length() > 3) {
            return segment.substring(0, segment.length() - 2);
        }
        if (segment.endsWith("s") && segment.length() > 2) {
            return segment.substring(0, segment.length() - 1);
        }
        return segment;
    }
}
