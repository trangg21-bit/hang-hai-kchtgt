package com.hanghai.kchtg.security.aspect;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.user.entity.Role;
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
 * Spring AOP Aspect phân quyền phạm vi dữ liệu theo Đơn vị (OrgUnit Data Scope).
 * <p>
 * Aspect này chặn các method được đánh dấu {@link DataScope}, trích xuất danh sách ID
 * của Đơn vị hiện tại và tất cả Đơn vị con trực thuộc, sau đó kích hoạt Hibernate
 * Global Filter {@code orgUnitFilter} cho Session truy vấn.
 * </p>
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class DataScopeAspect {

    private final UserRepository userRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    @PersistenceContext
    private final EntityManager entityManager;

    /**
     * Vai trò có quyền tra cứu toàn quốc (không bị cưỡng chế bộ lọc đơn vị).
     */
    private static final Set<String> NATIONWIDE_ROLES = Set.of(
            "ROLE_SYSTEM_ADMIN",
            "ROLE_ADMIN"
    );

    @Around("@annotation(dataScope)")
    public Object enforceDataScope(ProceedingJoinPoint joinPoint, DataScope dataScope) throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return joinPoint.proceed();
        }

        String username = auth.getName();
        User currentUser = userRepository.findByUsernameWithRelations(username).orElse(null);
        if (currentUser == null) {
            return joinPoint.proceed();
        }

        // Kiểm tra xem user có mang vai trò tra cứu toàn quốc hay không
        boolean isNationwide = currentUser.getRoles().stream()
                .map(Role::getCode)
                .anyMatch(NATIONWIDE_ROLES::contains);

        if (isNationwide) {
            // User có quyền xem toàn quốc -> Giữ nguyên bộ lọc tùy chọn
            return joinPoint.proceed();
        }

        OrgUnit userOrgUnit = currentUser.getOrgUnit();
        if (userOrgUnit == null) {
            return joinPoint.proceed();
        }

        // Thu thập toàn bộ ID của đơn vị hiện tại + toàn bộ cây đơn vị con.
        // Không chỉ lấy con trực tiếp vì tài liệu yêu cầu phạm vi theo subtree.
        UUID userOrgId = userOrgUnit.getId();
        List<UUID> allowedOrgUnitIds = collectSubtreeIds(userOrgUnit);

        // Kích hoạt Hibernate Global Filter cho Session hiện tại
        try {
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter("orgUnitFilter")
                   .setParameterList("orgUnitIds", allowedOrgUnitIds);
            log.info("[DataScopeAspect] Activated Hibernate Filter 'orgUnitFilter' for user={} with orgUnits={}",
                    username, allowedOrgUnitIds);
        } catch (Exception ex) {
            log.warn("[DataScopeAspect] Failed to enable orgUnitFilter: {}", ex.getMessage());
        }

        // Keep a user-selected orgUnitId filter. The Hibernate filter above
        // already limits the result to the user's subtree, so retaining this
        // parameter safely narrows the result further instead of disabling the
        // screen's unit filter.
        return joinPoint.proceed();
    }

    private List<UUID> collectSubtreeIds(OrgUnit userOrgUnit) {
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
