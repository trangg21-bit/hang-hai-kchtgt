package com.hanghai.kchtg.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;

import static org.junit.jupiter.api.Assertions.*;

class CacheConfigTest {

    @Test
    @DisplayName("Should initialize Caffeine CacheManager with registered cache names")
    void shouldInitializeCaffeineCacheManager() {
        CacheConfig cacheConfig = new CacheConfig();
        CacheManager cacheManager = cacheConfig.cacheManager();

        assertNotNull(cacheManager);
        assertInstanceOf(CaffeineCacheManager.class, cacheManager);

        // Verify key caches are registered
        Cache jwtRevocationCache = cacheManager.getCache("jwtRevocation");
        assertNotNull(jwtRevocationCache);

        Cache passwordPolicyCache = cacheManager.getCache("passwordPolicy");
        assertNotNull(passwordPolicyCache);
    }
}