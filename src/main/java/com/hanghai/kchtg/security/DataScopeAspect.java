package com.hanghai.kchtg.security;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AOP aspect that enforces data scope filtering (F-275 3-Level RBAC & BR-275-04, BR-275-10).
 * <p>
 * Filters returned entities or verifies access based on the current user's organization hierarchy
 * and role scope.
 * <ul>
 *   <li>Super Admin / System Admin: Full access (unrestricted scope)</li>
 *   <li>Unit User: Restricted to records matching their OrgUnit (or child OrgUnits via path) or created by themselves</li>
 * </ul>
 * </p>
 */
@Aspect
@Component
@RequiredArgsConstructor
public class DataScopeAspect {

    private static final Logger log = LoggerFactory.getLogger(DataScopeAspect.class);
    private final UserRepository userRepository;

    @Around("@annotation(dataScope)")
    public Object applyDataScope(ProceedingJoinPoint joinPoint, DataScope dataScope) throws Throwable {
        log.debug("DataScope applied: orgField={}, ownerField={} on {}",
                dataScope.orgField(), dataScope.ownerField(), joinPoint.getSignature().toShortString());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || isSystemAdmin(auth)) {
            // Admin role has unrestricted access across all org units
            return joinPoint.proceed();
        }

        User currentUser = getCurrentUser(auth);
        if (currentUser == null) {
            return joinPoint.proceed();
        }

        UUID userOrgId = currentUser.getOrgUnit() != null ? currentUser.getOrgUnit().getId() : null;
        String userOrgPath = currentUser.getOrgUnit() != null ? currentUser.getOrgUnit().getPath() : null;
        UUID currentUserId = currentUser.getId();

        Object result = joinPoint.proceed();

        if (result == null) {
            return null;
        }

        if (result instanceof List<?> list) {
            return filterList(list, userOrgId, userOrgPath, currentUserId, dataScope);
        } else if (result instanceof Page<?> page) {
            List<?> filteredContent = filterList(page.getContent(), userOrgId, userOrgPath, currentUserId, dataScope);
            Pageable pageable = page.getPageable();
            return new PageImpl<>(filteredContent, pageable, filteredContent.size());
        } else {
            if (!isEntityAccessible(result, userOrgId, userOrgPath, currentUserId, dataScope)) {
                log.warn("DataScope violation: user {} tried to access entity outside org scope", currentUserId);
                throw new AccessDeniedException("Không có quyền truy cập dữ liệu thuộc đơn vị khác");
            }
            return result;
        }
    }

    private boolean isSystemAdmin(Authentication auth) {
        if (auth == null) return false;
        for (GrantedAuthority authority : auth.getAuthorities()) {
            String role = authority.getAuthority();
            if ("ROLE_SUPER_ADMIN".equals(role) || "ROLE_SYSTEM_ADMIN".equals(role) || "ROLE_ADMIN".equals(role)) {
                return true;
            }
        }
        return false;
    }

    private User getCurrentUser(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof User u) {
            return u;
        }
        String username = auth.getName();
        if (username != null && !username.isBlank()) {
            return userRepository.findByUsername(username).orElse(null);
        }
        return null;
    }

    private List<?> filterList(List<?> items, UUID userOrgId, String userOrgPath, UUID currentUserId, DataScope dataScope) {
        if (items.isEmpty()) {
            return items;
        }
        return items.stream()
                .filter(item -> isEntityAccessible(item, userOrgId, userOrgPath, currentUserId, dataScope))
                .collect(Collectors.toList());
    }

    private boolean isEntityAccessible(Object entity, UUID userOrgId, String userOrgPath, UUID currentUserId, DataScope dataScope) {
        if (entity == null) return true;

        // 1. Check record owner field (createdBy)
        Object ownerVal = getFieldValue(entity, dataScope.ownerField());
        if (ownerVal != null && currentUserId != null) {
            if (ownerVal.equals(currentUserId) || ownerVal.toString().equals(currentUserId.toString())) {
                return true;
            }
        }

        // 2. Check org unit field
        Object orgVal = getFieldValue(entity, dataScope.orgField());
        if (orgVal != null) {
            if (orgVal instanceof OrgUnit orgUnit) {
                if (userOrgId != null && userOrgId.equals(orgUnit.getId())) {
                    return true;
                }
                if (userOrgPath != null && orgUnit.getPath() != null && orgUnit.getPath().startsWith(userOrgPath)) {
                    return true;
                }
            } else if (orgVal instanceof UUID orgId) {
                if (userOrgId != null && userOrgId.equals(orgId)) {
                    return true;
                }
            } else if (orgVal instanceof String orgIdStr) {
                if (userOrgId != null && userOrgId.toString().equals(orgIdStr)) {
                    return true;
                }
            }
            return false;
        }

        // If entity has no org info, check if owner info matches or permit access if both null
        return ownerVal == null;
    }

    private Object getFieldValue(Object object, String fieldName) {
        if (object == null || fieldName == null || fieldName.isBlank()) {
            return null;
        }
        try {
            Class<?> clazz = object.getClass();
            while (clazz != null && clazz != Object.class) {
                try {
                    Field field = clazz.getDeclaredField(fieldName);
                    field.setAccessible(true);
                    return field.get(object);
                } catch (NoSuchFieldException ignored) {
                    clazz = clazz.getSuperclass();
                }
            }
        } catch (Exception e) {
            log.trace("Could not extract field {} from {}", fieldName, object.getClass().getName());
        }
        return null;
    }
}
