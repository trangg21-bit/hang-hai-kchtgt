package com.hanghai.kchtg.security.totp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Rate limiter for TOTP verification attempts.
 * <p>
 * Backed by Redis in production; falls back to an in-memory ConcurrentHashMap
 * when Redis is unavailable (e.g. tests).  Default policy: 5 attempts per
 * 15 minutes, then a lockout.
 * </p>
 */
@Service
public class TotpRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(TotpRateLimiter.class);

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);
    private static final String KEY_PREFIX = "totp:attempts:";

    private final StringRedisTemplate redisTemplate;
    private final ConcurrentHashMap<String, AttemptRecord> inMemoryStore;

    public TotpRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.inMemoryStore = new ConcurrentHashMap<>();
    }

    /**
     * Records a failed TOTP verification attempt.
     *
     * @param userId the user identifier
     * @return {@code true} if the user is now locked out
     */
    public boolean recordAttempt(String userId) {
        String key = KEY_PREFIX + userId;

        if (redisTemplate != null) {
            try {
                Long count = redisTemplate.opsForValue().increment(key);
                if (count != null && count == 1L) {
                    redisTemplate.expire(key, LOCKOUT_DURATION);
                }
                if (count != null && count >= MAX_ATTEMPTS) {
                    log.warn("User {} locked out after {} failed TOTP attempts", userId, count);
                    return true;
                }
                return false;
            } catch (Exception e) {
                log.warn("Redis unavailable, falling back to in-memory rate limiter: {}", e.getMessage());
                return recordAttemptInMemory(userId);
            }
        }

        return recordAttemptInMemory(userId);
    }

    /**
     * Resets the attempt counter for a user after a successful verification.
     *
     * @param userId the user identifier
     */
    public void resetAttempts(String userId) {
        String key = KEY_PREFIX + userId;

        if (redisTemplate != null) {
            try {
                redisTemplate.delete(key);
            } catch (Exception e) {
                log.warn("Failed to reset Redis rate limiter: {}", e.getMessage());
                inMemoryStore.remove(key);
            }
        } else {
            inMemoryStore.remove(key);
        }
    }

    /**
     * Checks if the user is currently locked out.
     *
     * @param userId the user identifier
     * @return {@code true} if locked out
     */
    public boolean isLockedOut(String userId) {
        String key = KEY_PREFIX + userId;

        if (redisTemplate != null) {
            try {
                String countStr = redisTemplate.opsForValue().get(key);
                Long count = countStr != null ? Long.parseLong(countStr) : null;
                return count != null && count >= MAX_ATTEMPTS;
            } catch (Exception e) {
                log.warn("Redis unavailable, falling back to in-memory check");
                AttemptRecord record = inMemoryStore.get(key);
                return record != null && record.count >= MAX_ATTEMPTS && !record.isExpired();
            }
        }

        AttemptRecord record = inMemoryStore.get(key);
        return record != null && record.count >= MAX_ATTEMPTS && !record.isExpired();
    }

    // =========================================================================

    private boolean recordAttemptInMemory(String userId) {
        String key = KEY_PREFIX + userId;
        AttemptRecord record = inMemoryStore.compute(key, (k, r) -> {
            if (r == null) {
                return new AttemptRecord(1);
            }
            return r.increment();
        });

        if (record.count >= MAX_ATTEMPTS) {
            log.warn("User {} locked out after {} failed TOTP attempts (in-memory)", userId, record.count);
            return true;
        }
        return false;
    }

    private static class AttemptRecord {
        private final int count;
        private final long expiresAt;

        AttemptRecord(int count) {
            this.count = count;
            this.expiresAt = System.currentTimeMillis() + LOCKOUT_DURATION.toMillis();
        }

        AttemptRecord increment() {
            return new AttemptRecord(this.count + 1);
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }
}