package com.hanghai.kchtg.security.service;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Service để cache và invalidate danh sách permissions của user trong Redis.
 * Giúp tối ưu hiệu năng cho các phép kiểm tra phân quyền (RBAC).
 */
@Service
public class PermissionCacheService {

    private static final Logger log = LoggerFactory.getLogger(PermissionCacheService.class);
    private static final String CACHE_KEY_PREFIX = "user_perms:";
    private static final String EMPTY_SENTINEL = "__EMPTY_PERMS__";
    private static final long CACHE_TTL_MINUTES = 5;

    private final RedisTemplate<String, String> redisTemplate;
    private final UserRepository userRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private UserSecurityCacheService userSecurityCacheService;

    @Autowired
    public PermissionCacheService(RedisTemplate<String, String> redisTemplate,
                                   UserRepository userRepository,
                                   @org.springframework.lang.Nullable com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new com.fasterxml.jackson.databind.ObjectMapper();
    }

    public PermissionCacheService(RedisTemplate<String, String> redisTemplate, UserRepository userRepository) {
        this(redisTemplate, userRepository, new com.fasterxml.jackson.databind.ObjectMapper());
    }

    @Autowired(required = false)
    public void setUserSecurityCacheService(UserSecurityCacheService userSecurityCacheService) {
        this.userSecurityCacheService = userSecurityCacheService;
    }

    /**
     * Lưu danh sách permissions của user vào Redis bằng một lệnh SET nguyên tử kèm TTL.
     * 
     * @param userId      ID của user (UUID)
     * @param permissions Tập hợp các permission codes
     */
    public void cachePermissions(UUID userId, Set<String> permissions) {
        if (userId == null) return;
        try {
            String key = CACHE_KEY_PREFIX + userId;
            String json;
            if (permissions == null || permissions.isEmpty()) {
                json = "[]";
            } else {
                json = objectMapper.writeValueAsString(permissions);
            }
            redisTemplate.opsForValue().set(key, json, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Redis unavailable or serialization failed, skipping cache save for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Lấy danh sách permissions của user từ Redis.
     * 
     * @param userId ID của user (UUID)
     * @return Tập hợp các permission codes (có thể là rỗng), hoặc null nếu không có trong cache (cache miss).
     */
    public Set<String> getPermissionsFromCache(UUID userId) {
        if (userId == null) return null;
        try {
            String key = CACHE_KEY_PREFIX + userId;
            String json = redisTemplate.opsForValue().get(key);
            if (json == null) {
                return null;
            }
            if (json.isBlank() || "[]".equals(json.trim()) || EMPTY_SENTINEL.equals(json.trim())) {
                return java.util.Collections.emptySet();
            }
            return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<Set<String>>() {});
        } catch (Exception e) {
            log.warn("Redis unavailable or deserialization failed, skipping cache lookup for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    /**
     * Returns the effective permissions shared by all authorization consumers.
     * The User object is used as the source of truth on a cache miss; permission
     * mutation services already invalidate this Redis entry.
     */
    public Set<String> getEffectivePermissions(User user) {
        if (user == null) {
            return Set.of();
        }
        if (user.getEffectivePermissionsSnapshot() != null) {
            return user.getEffectivePermissionsSnapshot();
        }
        if (user.getId() == null) {
            return user.getAllPermissions();
        }
        Set<String> cached = getPermissionsFromCache(user.getId());
        if (cached != null) {
            return cached;
        }
        Set<String> permissions = user.getAllPermissions();
        cachePermissions(user.getId(), permissions);
        return permissions;
    }

    /**
     * Resolves the highest record classification this user may read.
     */
    public RecordSecurityLevel getMaxRecordSecurityLevel(User user) {
        return RecordSecurityLevel.maxAllowed(getEffectivePermissions(user));
    }

    /**
     * Xóa (invalidate) cache permissions của user khi có thay đổi quyền (AFTER_COMMIT).
     * 
     * @param userId ID của user (UUID)
     */
    public void invalidateCache(UUID userId) {
        if (userId == null) return;
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            doInvalidate(userId);
                        }
                    });
        } else {
            doInvalidate(userId);
        }
    }

    private void doInvalidate(UUID userId) {
        if (userSecurityCacheService != null) {
            userSecurityCacheService.evictDirect(userId);
        }
        try {
            String key = CACHE_KEY_PREFIX + userId;
            redisTemplate.delete(key);
        } catch (RuntimeException e) {
            log.warn("Redis unavailable, skipping cache invalidation for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Tăng permission_version của user và invalidate cache.
     * 
     * @param userId ID của user (UUID)
     */
    public void invalidateAndIncrementVersion(UUID userId) {
        if (userId == null) return;
        userRepository.findById(userId).ifPresent(user -> {
            user.incrementPermissionVersion();
            userRepository.save(user);
        });
        invalidateCache(userId);
    }
}
