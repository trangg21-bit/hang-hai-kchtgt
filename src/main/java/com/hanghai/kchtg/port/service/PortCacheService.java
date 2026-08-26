package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.port.dto.port.PortOptionResponse;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.PortRepository;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Long-lived directory cache used to resolve port IDs to display names.
 * Mirror of {@link com.hanghai.kchtg.orgunit.service.OrgUnitCacheService}.
 * No time-based expiry — invalidated after a successful port mutation.
 */
@Service
public class PortCacheService {

    public static final String CACHE_NAME = "portDirectory";
    private static final String DIRECTORY_KEY = "all";
    private static final String OPTIONS_KEY = "options";

    private final PortRepository portRepository;
    private final CacheManager cacheManager;

    public PortCacheService(PortRepository portRepository, CacheManager cacheManager) {
        this.portRepository = portRepository;
        this.cacheManager = cacheManager;
    }

    /**
     * Resolve the current display name from the cached port directory.
     */
    @Transactional(readOnly = true)
    public String getName(UUID portId) {
        if (portId == null) {
            return null;
        }
        return getDirectory().get(portId);
    }

    /**
     * Return the cached ID-to-portName directory. Loads once on first call.
     */
    @Transactional(readOnly = true)
    public Map<UUID, String> getDirectory() {
        Cache cache = getCache();
        return cache.get(DIRECTORY_KEY, this::loadDirectory);
    }

    /**
     * Return the cached list of port options for dropdowns.
     */
    @Transactional(readOnly = true)
    public List<PortOptionResponse> getOptions() {
        Cache cache = getCache();
        return cache.get(OPTIONS_KEY, () -> portRepository.findAllOptions());
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
        List<PortOptionResponse> ports = portRepository.findAllOptions();
        Map<UUID, String> directory = new LinkedHashMap<>();
        for (PortOptionResponse port : ports) {
            directory.put(port.getId(), port.getPortName());
        }
        return Map.copyOf(directory);
    }

    private Cache getCache() {
        return Objects.requireNonNull(
                cacheManager.getCache(CACHE_NAME),
                "Chưa cấu hình cache danh mục cảng biển: " + CACHE_NAME);
    }
}
