package com.hanghai.kchtg.security;

import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.security.service.UserSecurityCacheService;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PermissionCacheServiceTest {

    private StringRedisTemplate redisTemplate;
    private UserRepository userRepository;
    private UserSecurityCacheService userSecurityCacheService;
    private PermissionCacheService permissionCacheService;

    @BeforeEach
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        userRepository = mock(UserRepository.class);
        userSecurityCacheService = mock(UserSecurityCacheService.class);

        permissionCacheService = new PermissionCacheService(redisTemplate, userRepository);
        permissionCacheService.setUserSecurityCacheService(userSecurityCacheService);

        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void invalidateCache_inActiveTransaction_shouldRegisterSingleAfterCommit_andEvictDirectlyWithoutNesting() {
        UUID userId = UUID.randomUUID();

        permissionCacheService.invalidateCache(userId);

        // Before commit: nothing evicted yet
        verify(redisTemplate, never()).delete(anyString());
        verify(userSecurityCacheService, never()).evictDirect(any());

        // Simulate Spring transaction commit
        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCommit();
        }

        // After commit: both caches evicted directly once
        verify(redisTemplate, times(1)).delete("user_perms:" + userId);
        verify(userSecurityCacheService, times(1)).evictDirect(userId);
        verify(userSecurityCacheService, never()).evict(any());
    }

    @Test
    void invalidateCache_withoutActiveTransaction_shouldEvictDirectly() {
        TransactionSynchronizationManager.clearSynchronization();
        UUID userId = UUID.randomUUID();

        permissionCacheService.invalidateCache(userId);

        verify(redisTemplate, times(1)).delete("user_perms:" + userId);
        verify(userSecurityCacheService, times(1)).evictDirect(userId);
        verify(userSecurityCacheService, never()).evict(any());
    }

    @Test
    void cachePermissions_shouldSaveJsonAtomicallyWithTtl() {
        UUID userId = UUID.randomUUID();
        org.springframework.data.redis.core.ValueOperations<String, String> valueOps = mock(org.springframework.data.redis.core.ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        permissionCacheService.cachePermissions(userId, Set.of("vts:read", "vts:update"));

        verify(valueOps).set(
                eq("user_perms:" + userId),
                argThat(json -> json.contains("vts:read") && json.contains("vts:update")),
                eq(5L),
                eq(java.util.concurrent.TimeUnit.MINUTES)
        );
    }

    @Test
    void cachePermissions_whenEmpty_shouldSaveEmptyArrayAtomicallyWithTtl() {
        UUID userId = UUID.randomUUID();
        org.springframework.data.redis.core.ValueOperations<String, String> valueOps = mock(org.springframework.data.redis.core.ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        permissionCacheService.cachePermissions(userId, Set.of());

        verify(valueOps).set(
                eq("user_perms:" + userId),
                eq("[]"),
                eq(5L),
                eq(java.util.concurrent.TimeUnit.MINUTES)
        );
    }

    @Test
    void getPermissionsFromCache_shouldParseJsonIntoSet() {
        UUID userId = UUID.randomUUID();
        org.springframework.data.redis.core.ValueOperations<String, String> valueOps = mock(org.springframework.data.redis.core.ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("user_perms:" + userId)).thenReturn("[\"vts:read\",\"vts:update\"]");

        Set<String> result = permissionCacheService.getPermissionsFromCache(userId);

        assertNotNull(result);
        assertEquals(Set.of("vts:read", "vts:update"), result);
    }

    @Test
    void getPermissionsFromCache_whenEmptyArray_shouldReturnEmptySet() {
        UUID userId = UUID.randomUUID();
        org.springframework.data.redis.core.ValueOperations<String, String> valueOps = mock(org.springframework.data.redis.core.ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("user_perms:" + userId)).thenReturn("[]");

        Set<String> result = permissionCacheService.getPermissionsFromCache(userId);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getPermissionsFromCache_whenNull_shouldReturnNull() {
        UUID userId = UUID.randomUUID();
        org.springframework.data.redis.core.ValueOperations<String, String> valueOps = mock(org.springframework.data.redis.core.ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("user_perms:" + userId)).thenReturn(null);

        Set<String> result = permissionCacheService.getPermissionsFromCache(userId);

        assertNull(result);
    }
}
