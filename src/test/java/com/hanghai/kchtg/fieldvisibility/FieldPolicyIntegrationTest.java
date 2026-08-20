package com.hanghai.kchtg.fieldvisibility;

import com.hanghai.kchtg.config.CacheConfig;
import com.hanghai.kchtg.fieldvisibility.entity.FieldEffect;
import com.hanghai.kchtg.fieldvisibility.entity.FieldPolicy;
import com.hanghai.kchtg.fieldvisibility.entity.FieldSubjectType;
import com.hanghai.kchtg.fieldvisibility.entity.FieldTargetType;
import com.hanghai.kchtg.fieldvisibility.repository.FieldPolicyRepository;
import com.hanghai.kchtg.fieldvisibility.service.FieldPolicyService;
import com.hanghai.kchtg.fieldvisibility.service.FieldVisibilityService;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemUpdateRequest;
import com.hanghai.kchtg.vtssystem.service.VtsSystemService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronizationUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Integration & Behavior tests for FieldPolicy lifecycle:
 * - Cache registration (CacheConfig bean) & AFTER_COMMIT eviction on CRUD
 * - Transaction rollback safety (no eviction on rollback)
 * - Write Guard enforcement (403 on READONLY / HIDE fields during service update)
 * - Strict SystemFieldCatalog validation
 */
@ExtendWith(MockitoExtension.class)
class FieldPolicyIntegrationTest {

    @Mock
    private FieldPolicyRepository fieldPolicyRepository;

    @Mock
    private FieldVisibilityService fieldVisibilityService;

    private FieldPolicyService fieldPolicyService;

    @BeforeEach
    void setUp() {
        fieldPolicyService = new FieldPolicyService(fieldPolicyRepository, fieldVisibilityService);
        FieldVisibilityContext.clear();
    }

    @AfterEach
    void tearDown() {
        FieldVisibilityContext.clear();
    }

    @Test
    void createPolicyEvictsCacheDirectlyWhenNoTransaction() {
        FieldPolicy policy = new FieldPolicy();
        policy.setSubjectType(FieldSubjectType.PERMISSION);
        policy.setSubjectId("vts:read");
        policy.setResource("vts");
        policy.setTargetType(FieldTargetType.FIELD);
        policy.setTargetKey("updatedDate");
        policy.setEffect(FieldEffect.HIDE);

        when(fieldPolicyRepository.save(any())).thenReturn(policy);

        fieldPolicyService.create(policy);

        verify(fieldVisibilityService, times(1)).evictPolicyCache();
    }

    @Test
    void transactionCommitEvictsCacheAfterCommit() {
        TransactionSynchronizationManager.initSynchronization();
        try {
            FieldPolicy policy = new FieldPolicy();
            policy.setSubjectType(FieldSubjectType.PERMISSION);
            policy.setSubjectId("vts:read");
            policy.setResource("vts");
            policy.setTargetType(FieldTargetType.FIELD);
            policy.setTargetKey("updatedDate");
            policy.setEffect(FieldEffect.HIDE);

            when(fieldPolicyRepository.save(any())).thenReturn(policy);

            fieldPolicyService.create(policy);

            // Prior to commit: evictPolicyCache must NOT have been called
            verify(fieldVisibilityService, times(0)).evictPolicyCache();

            // Simulate transaction commit
            TransactionSynchronizationUtils.triggerAfterCommit();

            // After commit: evictPolicyCache is called exactly once
            verify(fieldVisibilityService, times(1)).evictPolicyCache();
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void transactionRollbackDoesNotEvictCache() {
        TransactionSynchronizationManager.initSynchronization();
        try {
            FieldPolicy policy = new FieldPolicy();
            policy.setSubjectType(FieldSubjectType.PERMISSION);
            policy.setSubjectId("vts:read");
            policy.setResource("vts");
            policy.setTargetType(FieldTargetType.FIELD);
            policy.setTargetKey("updatedDate");
            policy.setEffect(FieldEffect.HIDE);

            when(fieldPolicyRepository.save(any())).thenReturn(policy);

            fieldPolicyService.create(policy);

            // Simulate transaction rollback
            TransactionSynchronizationUtils.triggerAfterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);

            // Cache eviction must NOT be triggered on rollback
            verify(fieldVisibilityService, times(0)).evictPolicyCache();
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void updatePolicyEvictsCache() {
        UUID id = UUID.randomUUID();
        FieldPolicy existing = new FieldPolicy();
        existing.setId(id);
        existing.setResource("vts");
        existing.setTargetKey("updatedDate");

        when(fieldPolicyRepository.findById(id)).thenReturn(Optional.of(existing));
        when(fieldPolicyRepository.save(any())).thenReturn(existing);

        FieldPolicy updates = new FieldPolicy();
        updates.setSubjectType(FieldSubjectType.USER);
        updates.setSubjectId(UUID.randomUUID().toString());
        updates.setResource("vts");
        updates.setTargetType(FieldTargetType.FIELD);
        updates.setTargetKey("updatedDate");
        updates.setEffect(FieldEffect.ALLOW);
        updates.setActive(true);

        fieldPolicyService.update(id, updates);

        verify(fieldVisibilityService, times(1)).evictPolicyCache();
    }

    @Test
    void deletePolicyEvictsCache() {
        UUID id = UUID.randomUUID();
        FieldPolicy existing = new FieldPolicy();
        existing.setId(id);

        when(fieldPolicyRepository.findById(id)).thenReturn(Optional.of(existing));

        fieldPolicyService.delete(id);

        verify(fieldPolicyRepository, times(1)).delete(existing);
        verify(fieldVisibilityService, times(1)).evictPolicyCache();
    }

    @Test
    void toggleActivePolicyEvictsCache() {
        UUID id = UUID.randomUUID();
        FieldPolicy existing = new FieldPolicy();
        existing.setId(id);
        existing.setActive(true);

        when(fieldPolicyRepository.findById(id)).thenReturn(Optional.of(existing));
        when(fieldPolicyRepository.save(any())).thenReturn(existing);

        fieldPolicyService.toggleActive(id, false);

        verify(fieldVisibilityService, times(1)).evictPolicyCache();
    }

    @Test
    void writeGuardBlocksReadOnlyField() {
        FieldVisibilityContext.set(Map.of("systemName", FieldEffect.READONLY));

        VtsSystemUpdateRequest request = new VtsSystemUpdateRequest();
        request.setSystemName("New Name Attempt");

        AccessDeniedException ex = assertThrows(AccessDeniedException.class,
                () -> FieldVisibilityContext.assertWritable("systemName"));
        assertEquals("Bạn không có quyền cập nhật trường: systemName", ex.getMessage());
    }

    @Test
    void writeGuardBlocksHiddenField() {
        FieldVisibilityContext.set(Map.of("systemName", FieldEffect.HIDE));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class,
                () -> FieldVisibilityContext.assertWritable("systemName"));
        assertEquals("Bạn không có quyền cập nhật trường: systemName", ex.getMessage());
    }

    @Test
    void writeGuardAllowsAllowedOrUntouchedField() {
        FieldVisibilityContext.set(Map.of("systemName", FieldEffect.ALLOW, "note", FieldEffect.READONLY));

        assertDoesNotThrow(() -> FieldVisibilityContext.assertWritable("systemName"));
        assertDoesNotThrow(() -> FieldVisibilityContext.assertWritable("unrestrictedField"));
    }

    @Test
    void springCacheConfigBeanDirectlyRegistersFieldPoliciesCache() {
        CacheConfig config = new CacheConfig();
        CacheManager cacheManager = config.cacheManager();
        Cache cache = cacheManager.getCache("fieldPolicies");
        assertNotNull(cache, "CacheConfig bean must register 'fieldPolicies' cache in CaffeineCacheManager");
    }

    @Test
    void validatePolicyRejectsBlankTargetKey() {
        FieldPolicy policy = new FieldPolicy();
        policy.setSubjectType(FieldSubjectType.PERMISSION);
        policy.setSubjectId("vts:read");
        policy.setResource("vts");
        policy.setTargetType(FieldTargetType.FIELD);
        policy.setTargetKey("");
        policy.setEffect(FieldEffect.HIDE);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> fieldPolicyService.create(policy));
        assertEquals("Trường mục tiêu (targetKey) không được để trống",
                ex.getMessage());
    }

    @Test
    void validatePolicyAcceptsKnownFieldFromCatalog() {
        FieldPolicy policy = new FieldPolicy();
        policy.setSubjectType(FieldSubjectType.PERMISSION);
        policy.setSubjectId("vts:read");
        policy.setResource("vts");
        policy.setTargetType(FieldTargetType.FIELD);
        policy.setTargetKey("updatedDate");
        policy.setEffect(FieldEffect.HIDE);

        when(fieldPolicyRepository.save(any())).thenReturn(policy);

        assertDoesNotThrow(() -> fieldPolicyService.create(policy));
    }
}
