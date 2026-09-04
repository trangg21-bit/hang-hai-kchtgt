package com.hanghai.kchtg.security.aspect;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.hibernate.Session;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Spring AOP Aspect phân quyền phạm vi dữ liệu theo Đơn vị (OrgUnit Data
 * Scope).
 * <p>
 * Aspect này chặn các method được đánh dấu {@link DataScope}, trích xuất danh
 * sách ID
 * của Đơn vị hiện tại và tất cả Đơn vị con trực thuộc, sau đó kích hoạt
 * Hibernate
 * Global Filter {@code orgUnitFilter} cho Session truy vấn.
 * </p>
 *
 * TODO(SECURITY): Audit every record-bearing controller/service and apply
 * record scope
 * to detail, update, delete, approve, restore, attachment, and export
 * operations;
 * entity filters are not active unless the scoped aspect/filter is actually
 * invoked.
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class DataScopeAspect {

    private final UserRepository userRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private PermissionCacheService permissionCacheService;
    @PersistenceContext
    private final EntityManager entityManager;

    @org.springframework.beans.factory.annotation.Autowired
    public void setPermissionCacheService(PermissionCacheService permissionCacheService) {
        this.permissionCacheService = permissionCacheService;
    }

    /**
     * Vai trò có quyền tra cứu toàn quốc (không bị cưỡng chế bộ lọc đơn vị).
     */
    private static final String NATIONWIDE_PERMISSION = "orgunit:scope_all";

    @Around("@annotation(dataScope)")
    public Object enforceDataScope(ProceedingJoinPoint joinPoint, DataScope dataScope) throws Throwable {
        return processDataScope(joinPoint, dataScope);
    }

    @Around("@within(dataScope) && !@annotation(com.hanghai.kchtg.security.annotation.DataScope)")
    public Object enforceDataScopeClass(ProceedingJoinPoint joinPoint, DataScope dataScope) throws Throwable {
        return processDataScope(joinPoint, dataScope);
    }

    private Object processDataScope(ProceedingJoinPoint joinPoint, DataScope dataScope) throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return joinPoint.proceed();
        }

        String username = auth.getName();
        User currentUser = auth.getPrincipal() instanceof User principalUser
                ? principalUser
                : userRepository.findByUsernameWithRelations(username).orElse(null);
        if (currentUser == null) {
            log.warn("[DataScopeAspect] User '{}' not found in database", username);
            throw new org.springframework.security.access.AccessDeniedException(
                    "Không tìm thấy thông tin người dùng thực hiện truy vấn");
        }

        Set<String> effectivePermissions = permissionCacheService == null
                ? currentUser.getAllPermissions()
                : permissionCacheService.getEffectivePermissions(currentUser);

        // Kiểm tra xem user có mang vai trò tra cứu toàn quốc hay không
        boolean isNationwide = effectivePermissions.contains(NATIONWIDE_PERMISSION)
                || effectivePermissions.contains("admin:all")
                || effectivePermissions.contains("*");

        if (isNationwide) {
            // User có quyền xem toàn quốc -> Giữ nguyên bộ lọc tùy chọn
            return joinPoint.proceed();
        }

        OrgUnit userOrgUnit = currentUser.getOrgUnit();
        List<UUID> allowedOrgUnitIds;
        if (userOrgUnit == null || userOrgUnit.getId() == null) {
            log.warn("[DataScopeAspect] User '{}' has no assigned org unit - restricting to empty scope", username);
            allowedOrgUnitIds = List.of(new UUID(0L, 0L));
        } else {
            allowedOrgUnitIds = collectSubtreeIds(userOrgUnit);
            if (allowedOrgUnitIds.isEmpty()) {
                allowedOrgUnitIds = List.of(userOrgUnit.getId());
            }
        }

        // Kích hoạt Hibernate Global Filter cho Session hiện tại
        try {
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter("orgUnitFilter")
                    .setParameterList("orgUnitIds", allowedOrgUnitIds);
            log.info("[DataScopeAspect] Activated Hibernate Filter 'orgUnitFilter' for user={} with orgUnits={}",
                    username, allowedOrgUnitIds);
        } catch (Exception ex) {
            log.warn("[DataScopeAspect] Failed to enable orgUnitFilter: {}", ex.getMessage());
            throw new org.springframework.security.access.AccessDeniedException(
                    "Không thể thiết lập bộ lọc phạm vi dữ liệu theo đơn vị");
        }

        // Keep a user-selected orgUnitId filter. The Hibernate filter above
        // already limits the result to the user's subtree, so retaining this
        // parameter safely narrows the result further instead of disabling the
        // screen's unit filter.
        return joinPoint.proceed();
    }

    private List<UUID> collectSubtreeIds(OrgUnit userOrgUnit) {
        if (userOrgUnit == null || userOrgUnit.getId() == null) {
            return List.of();
        }
        Map<UUID, List<UUID>> childIdsByParent = orgUnitCacheService.getList().stream()
                .filter(unit -> unit.getId() != null && unit.getParentId() != null)
                .collect(Collectors.groupingBy(
                        OrgUnitResponse::getParentId,
                        LinkedHashMap::new,
                        Collectors.mapping(OrgUnitResponse::getId, Collectors.toList())));

        LinkedHashSet<UUID> result = new LinkedHashSet<>();
        List<UUID> queue = new ArrayList<>();
        queue.add(userOrgUnit.getId());
        for (int index = 0; index < queue.size(); index++) {
            UUID currentId = queue.get(index);
            if (!result.add(currentId)) {
                continue;
            }
            queue.addAll(childIdsByParent.getOrDefault(currentId, List.of()));
        }
        return List.copyOf(result);
    }
}
