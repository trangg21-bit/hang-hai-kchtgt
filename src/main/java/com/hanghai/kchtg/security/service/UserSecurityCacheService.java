package com.hanghai.kchtg.security.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Distributed cache for the data needed to authenticate a JWT request.
 * Redis failures are treated as cache misses and fall back to the database.
 */
@Service
public class UserSecurityCacheService {

    private static final Logger log = LoggerFactory.getLogger(UserSecurityCacheService.class);
    private static final String KEY_PREFIX = "user_security:v1:";
    private static final Duration TTL = Duration.ofMinutes(5);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public UserSecurityCacheService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public Optional<User> get(UUID userId) {
        if (userId == null) return Optional.empty();
        try {
            String json = redisTemplate.opsForValue().get(key(userId));
            if (json == null || json.isBlank()) return Optional.empty();
            return Optional.of(fromSnapshot(objectMapper.readValue(json, UserSecuritySnapshot.class)));
        } catch (Exception ex) {
            log.debug("User security cache read failed for {}: {}", userId, ex.getMessage());
            return Optional.empty();
        }
    }

    public void put(User user) {
        if (user == null || user.getId() == null) return;
        try {
            String json = objectMapper.writeValueAsString(UserSecuritySnapshot.from(user));
            redisTemplate.opsForValue().set(key(user.getId()), json, TTL);
        } catch (Exception ex) {
            log.debug("User security cache write failed for {}: {}", user.getId(), ex.getMessage());
        }
    }

    public void evict(UUID userId) {
        if (userId == null) return;
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            evictDirect(userId);
                        }
                    });
        } else {
            evictDirect(userId);
        }
    }

    public void evictDirect(UUID userId) {
        if (userId == null) return;
        try {
            redisTemplate.delete(key(userId));
        } catch (Exception ex) {
            log.warn("User security cache eviction failed for {}: {}", userId, ex.getMessage());
        }
    }

    private String key(UUID userId) {
        return KEY_PREFIX + userId;
    }

    private User fromSnapshot(UserSecuritySnapshot snapshot) {
        User user = new User();
        user.setId(snapshot.userId());
        user.setUsername(snapshot.username());
        user.setEmail(snapshot.email());
        user.setFullName(snapshot.fullName());
        user.setPhone(snapshot.phone());
        user.setAddress(snapshot.address());
        user.setDepartment(snapshot.department());
        user.setPosition(snapshot.position());
        user.setNote(snapshot.note());
        user.setStatus(snapshot.status());
        user.setAccountLockedUntil(snapshot.accountLockedUntil());
        user.setPermissionVersion(snapshot.permissionVersion());
        if (snapshot.orgUnitId() != null) {
            OrgUnit orgUnit = new OrgUnit();
            orgUnit.setId(snapshot.orgUnitId());
            orgUnit.setName(snapshot.orgUnitName());
            user.setOrgUnit(orgUnit);
        }
        user.setEffectivePermissionsSnapshot(snapshot.permissions());
        return user;
    }
}
