package com.hanghai.kchtg.orgunit.service;

import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import org.springframework.security.access.AccessDeniedException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Resolves the organisation subtree visible to the current authenticated user.
 * This is the single source of truth for organisation data scope used by the
 * organisation management APIs.
 */
@Service
@RequiredArgsConstructor
public class OrgUnitScopeService {

    private static final String SCOPE_ALL = "orgunit:scope_all";

    private final UserRepository userRepository;
    private final OrgUnitCacheService orgUnitCacheService;

    public Scope currentUserScope() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return Scope.restricted(List.of());
        }

        User currentUser = authentication.getPrincipal() instanceof User principalUser
                ? principalUser
                : userRepository.findByUsernameWithRelations(authentication.getName()).orElse(null);
        if (currentUser == null) {
            return Scope.restricted(List.of());
        }

        var permissions = currentUser.getAllPermissions();
        if (permissions.contains(SCOPE_ALL) || permissions.contains("admin:all") || permissions.contains("*")) {
            return Scope.allScope();
        }

        if (currentUser.getOrgUnit() == null || currentUser.getOrgUnit().getId() == null) {
            return Scope.restricted(List.of());
        }

        return Scope.restricted(resolveSubtreeIds(currentUser.getOrgUnit().getId()));
    }

    /**
     * Resolve an organisation and all of its descendants from the cached
     * organisation tree. Callers use this for hierarchical filters; access
     * scope is enforced separately by intersecting the result with the
     * authenticated user's scope.
     */
    public List<UUID> resolveSubtreeIds(UUID rootId) {
        if (rootId == null) {
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
        queue.add(rootId);
        for (int index = 0; index < queue.size(); index++) {
            UUID currentId = queue.get(index);
            if (result.add(currentId)) {
                queue.addAll(childIdsByParent.getOrDefault(currentId, List.of()));
            }
        }
        return List.copyOf(result);
    }

    public record Scope(boolean unrestricted, List<UUID> orgUnitIds) {
        public static Scope allScope() {
            return new Scope(true, List.of());
        }

        public static Scope restricted(List<UUID> ids) {
            return new Scope(false, List.copyOf(ids));
        }

        public boolean allows(UUID orgUnitId) {
            return unrestricted || (orgUnitId != null && orgUnitIds.contains(orgUnitId));
        }
    }

    /**
     * Assert that {@code organizationId} falls within the current user's org-unit
     * subtree.  Throws {@link AccessDeniedException} if the caller has no access.
     */
    public void requireOrganizationInScope(UUID organizationId) {
        if (!currentUserScope().allows(organizationId)) {
            throw new AccessDeniedException(
                    "Bạn không có quyền tạo hoặc thay đổi nhóm ngoài phạm vi đơn vị được phân quyền");
        }
    }
}
