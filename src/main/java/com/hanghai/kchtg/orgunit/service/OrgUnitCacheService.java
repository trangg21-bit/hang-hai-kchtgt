package com.hanghai.kchtg.orgunit.service;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Long-lived directory cache used to resolve organisational unit IDs to display names.
 * The cache has no time-based expiry and is invalidated after a successful org-unit mutation.
 */
@Service
public class OrgUnitCacheService {

    public static final String CACHE_NAME = "orgUnitDirectory";
    private static final String DIRECTORY_KEY = "all";

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

    private Map<UUID, String> loadDirectory() {
        Map<UUID, String> directory = new LinkedHashMap<>();
        for (OrgUnit unit : orgUnitRepository.findAllActiveOrderByPath()) {
            directory.put(unit.getId(), unit.getName());
        }
        return Map.copyOf(directory);
    }

    private Cache getCache() {
        return Objects.requireNonNull(
                cacheManager.getCache(CACHE_NAME),
                "Chưa cấu hình cache danh mục đơn vị: " + CACHE_NAME);
    }
}
