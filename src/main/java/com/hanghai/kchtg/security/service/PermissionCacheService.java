package com.hanghai.kchtg.security.service;

import java.util.UUID;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Service để cache và invalidate danh sách permissions của user trong Redis.
 * Giúp tối ưu hiệu năng cho các phép kiểm tra phân quyền (RBAC).
 */
@Service
public class PermissionCacheService {

    private static final String CACHE_KEY_PREFIX = "user_perms:";
    private static final long CACHE_TTL_MINUTES = 10;

    private final RedisTemplate<String, String> redisTemplate;
    private final UserRepository userRepository;

    public PermissionCacheService(RedisTemplate<String, String> redisTemplate, UserRepository userRepository) {
        this.redisTemplate = redisTemplate;
        this.userRepository = userRepository;
    }

    /**
     * Lưu danh sách permissions của user vào Redis.
     * @param userId ID của user (UUID)
     * @param permissions Tập hợp các permission codes
     */
    public void cachePermissions(UUID userId, Set<String> permissions) {
        String key = CACHE_KEY_PREFIX + userId;
        redisTemplate.opsForSet().add(key, permissions.toArray(new String[0]));
        redisTemplate.expire(key, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
    }

    /**
     * Lấy danh sách permissions của user từ Redis.
     * @param userId ID của user (UUID)
     * @return Tập hợp các permission codes, hoặc null nếu không có trong cache.
     */
    public Set<String> getPermissionsFromCache(UUID userId) {
        String key = CACHE_KEY_PREFIX + userId;
        return redisTemplate.opsForSet().members(key);
    }

    /**
     * Xóa (invalidate) cache permissions của user khi có thay đổi quyền.
     * @param userId ID của user (UUID)
     */
    public void invalidateCache(UUID userId) {
        String key = CACHE_KEY_PREFIX + userId;
        redisTemplate.delete(key);
    }

    /**
     * Tăng permission_version của user và invalidate cache.
     * @param userId ID của user (UUID)
     */
    public void invalidateAndIncrementVersion(UUID userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.incrementPermissionVersion();
            userRepository.save(user);
        });
        invalidateCache(userId);
    }
}