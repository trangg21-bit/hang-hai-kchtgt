package com.hanghai.kchtg.orgunit.service;

import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Long-lived directory cache used to resolve organisational unit IDs to display names.
 * The cache has no time-based expiry and is invalidated after a successful org-unit mutation.
 */
@Service
public class OrgUnitCacheService {

    public static final String CACHE_NAME = "orgUnitDirectory";
    private static final String DIRECTORY_KEY = "all";
    private static final String LIST_KEY = "list";

    private final OrgUnitRepository orgUnitRepository;
    private final CacheManager cacheManager;

    public OrgUnitCacheService(OrgUnitRepository orgUnitRepository, CacheManager cacheManager) {
        this.orgUnitRepository = orgUnitRepository;
        this.cacheManager = cacheManager;
    }

    /**
     * Resolve the current display name from the cached organisational unit directory.
     */
    @Transactional(readOnly = true)
    public String getName(UUID orgUnitId) {
        if (orgUnitId == null) {
            return null;
        }
        return getDirectory().get(orgUnitId);
    }

    /**
     * Return the cached ID-to-name directory. The first call loads all non-deleted units once.
     */
    @Transactional(readOnly = true)
    public Map<UUID, String> getDirectory() {
        Cache cache = getCache();
        return cache.get(DIRECTORY_KEY, this::loadDirectory);
    }

    /**
     * Invalidate only after the surrounding database transaction commits successfully.
     */
    public void evictAfterCommit() {
        if (TransactionSynchronizationManager.isActualTransactionActive()
                && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    evictNow();
                }
            });
            return;
        }
        evictNow();
    }

    public void evictNow() {
        getCache().clear();
    }

    /**
     * Return the cached full list of all active org units (no pagination).
     */
    @Transactional(readOnly = true)
    public List<OrgUnitResponse> getList() {
        Cache cache = getCache();
        return cache.get(LIST_KEY, this::loadList);
    }

    /**
     * Return all descendant org unit IDs of the target unit (including the target unit itself).
     */
    @Transactional(readOnly = true)
    public Set<UUID> getSubtreeOrgUnitIds(UUID targetUnitId) {
        if (targetUnitId == null) {
            return Collections.emptySet();
        }
        List<OrgUnitResponse> allUnits = getList();
        if (allUnits == null || allUnits.isEmpty()) {
            return Set.of(targetUnitId);
        }
        Set<UUID> result = new LinkedHashSet<>();
        result.add(targetUnitId);

        String idStr = targetUnitId.toString();
        for (OrgUnitResponse unit : allUnits) {
            if (unit.getId() == null) continue;
            if (targetUnitId.equals(unit.getId())) {
                result.add(unit.getId());
            } else if (targetUnitId.equals(unit.getParentId())) {
                result.add(unit.getId());
            } else if (unit.getPath() != null && (unit.getPath().contains("/" + idStr + "/") || unit.getPath().contains("/" + targetUnitId + "/"))) {
                result.add(unit.getId());
            }
        }

        Map<UUID, List<UUID>> childIdsByParent = new LinkedHashMap<>();
        for (OrgUnitResponse unit : allUnits) {
            if (unit != null && unit.getId() != null && unit.getParentId() != null) {
                childIdsByParent.computeIfAbsent(unit.getParentId(), k -> new ArrayList<>()).add(unit.getId());
            }
        }

        List<UUID> queue = new ArrayList<>(result);
        for (int index = 0; index < queue.size(); index++) {
            UUID currentId = queue.get(index);
            List<UUID> children = childIdsByParent.get(currentId);
            if (children != null) {
                for (UUID childId : children) {
                    if (result.add(childId)) {
                        queue.add(childId);
                    }
                }
            }
        }
        return Collections.unmodifiableSet(result);
    }

    /**
     * Build a dynamic hierarchical Predicate for JPA Criteria queries.
     * Matches targetUnitId AND all of its descendant units.
     *
     * @param root JPA Root
     * @param cb CriteriaBuilder
     * @param fieldName Entity field name (e.g. "orgUnitId", "usingOrgUnitId", "parentOrgUnitId")
     * @param targetUnitId Selected org unit ID
     * @return JPA Predicate
     */
    public Predicate subtreePredicate(
            Root<?> root,
            CriteriaBuilder cb,
            String fieldName,
            UUID targetUnitId) {
        if (targetUnitId == null) {
            return cb.conjunction();
        }
        Set<UUID> ids = getSubtreeOrgUnitIds(targetUnitId);
        if (ids == null || ids.isEmpty() || ids.size() == 1) {
            return cb.equal(root.get(fieldName), targetUnitId);
        }
        return root.get(fieldName).in(ids);
    }

    /**
     * Dynamically apply a hierarchical org-unit filter to a Predicates list if targetUnitId is not null.
     *
     * @param root JPA Root
     * @param cb CriteriaBuilder
     * @param predicates Target list of predicates
     * @param fieldName Entity field name (e.g. "orgUnitId", "usingOrgUnitId", "parentOrgUnitId")
     * @param targetUnitId Selected org unit ID
     */
    public void applySubtreePredicate(
            Root<?> root,
            CriteriaBuilder cb,
            List<Predicate> predicates,
            String fieldName,
            UUID targetUnitId) {
        if (targetUnitId != null) {
            predicates.add(subtreePredicate(root, cb, fieldName, targetUnitId));
        }
    }

    private Map<UUID, String> loadDirectory() {
        Map<UUID, String> directory = new LinkedHashMap<>();
        for (OrgUnit unit : orgUnitRepository.findAllActiveOrderByPath()) {
            directory.put(unit.getId(), unit.getName());
        }
        return Map.copyOf(directory);
    }

    private List<OrgUnitResponse> loadList() {
        return orgUnitRepository.findAllActiveOrderByPath().stream()
                .map(OrgUnitResponse::from)
                .collect(Collectors.toList());
    }

    private Cache getCache() {
        return Objects.requireNonNull(
                cacheManager.getCache(CACHE_NAME),
                "Chưa cấu hình cache danh mục đơn vị: " + CACHE_NAME);
    }
}
