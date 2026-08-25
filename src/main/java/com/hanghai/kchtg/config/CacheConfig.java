package com.hanghai.kchtg.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.port.service.PortCacheService;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.concurrent.TimeUnit;

/**
 * Cache configuration registering Caffeine cache manager for F-274 revocation
 * cache and F-276 policies.
 */
@Configuration
@EnableCaching
public class CacheConfig {

        @Bean
        @Primary
        public CacheManager cacheManager() {
                CaffeineCacheManager cacheManager = new CaffeineCacheManager("passwordPolicy", "jwtRevocation",
                                "kchtCounts", "fieldPolicies");
                cacheManager.setCaffeine(Caffeine.newBuilder()
                                .expireAfterWrite(10, TimeUnit.MINUTES)
                                .maximumSize(1000));
                cacheManager.registerCustomCache(
                                OrgUnitCacheService.CACHE_NAME,
                                Caffeine.newBuilder()
                                                .maximumSize(1)
                                                .build());
                cacheManager.registerCustomCache(
                                PortCacheService.CACHE_NAME,
                                Caffeine.newBuilder()
                                                .maximumSize(2)
                                                .build());
                return cacheManager;
        }
}
