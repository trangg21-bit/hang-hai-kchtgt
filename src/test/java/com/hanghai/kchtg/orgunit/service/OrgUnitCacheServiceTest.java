package com.hanghai.kchtg.orgunit.service;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrgUnitCacheServiceTest {

    @Mock
    private OrgUnitRepository orgUnitRepository;

    @Test
    void getNameLoadsDirectoryOnlyOnceUntilInvalidated() {
        UUID orgUnitId = UUID.randomUUID();
        when(orgUnitRepository.findAllActiveOrderByPath())
                .thenReturn(List.of(orgUnit(orgUnitId, "Cục Hàng hải Việt Nam")));
        OrgUnitCacheService service = createService();

        assertEquals("Cục Hàng hải Việt Nam", service.getName(orgUnitId));
        assertEquals("Cục Hàng hải Việt Nam", service.getName(orgUnitId));

        verify(orgUnitRepository, times(1)).findAllActiveOrderByPath();
    }

    @Test
    void evictAfterCommitKeepsOldValueUntilCommitThenReloads() {
        UUID orgUnitId = UUID.randomUUID();
        when(orgUnitRepository.findAllActiveOrderByPath())
                .thenReturn(List.of(orgUnit(orgUnitId, "Tên cũ")))
                .thenReturn(List.of(orgUnit(orgUnitId, "Tên mới")));
        OrgUnitCacheService service = createService();
        assertEquals("Tên cũ", service.getName(orgUnitId));

        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);
        try {
            service.evictAfterCommit();
            assertEquals("Tên cũ", service.getName(orgUnitId));

            TransactionSynchronizationManager.getSynchronizations()
                    .forEach(TransactionSynchronization::afterCommit);

            assertEquals("Tên mới", service.getName(orgUnitId));
        } finally {
            TransactionSynchronizationManager.setActualTransactionActive(false);
            TransactionSynchronizationManager.clearSynchronization();
        }

        verify(orgUnitRepository, times(2)).findAllActiveOrderByPath();
    }

    private OrgUnitCacheService createService() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.registerCustomCache(
                OrgUnitCacheService.CACHE_NAME,
                Caffeine.newBuilder().maximumSize(1).build());
        return new OrgUnitCacheService(orgUnitRepository, cacheManager);
    }

    private OrgUnit orgUnit(UUID id, String name) {
        OrgUnit orgUnit = new OrgUnit();
        orgUnit.setId(id);
        orgUnit.setName(name);
        return orgUnit;
    }
}
