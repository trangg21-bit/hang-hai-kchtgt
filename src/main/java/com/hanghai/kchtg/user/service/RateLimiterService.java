package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.exception.RateLimitExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Rate limiter supporting both Redis-backed and in-memory sliding window implementations.
 */
@Service
public class RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterService.class);
    private static final String KEY_PREFIX = "lockout:attempts:";
    
    private final StringRedisTemplate redisTemplate;
    private final int maxAttempts;
    private final int windowMinutes;

    // In-memory fallback map for unit tests and local dev without Redis
    private final Map<String, List<Instant>> inMemoryAttempts = new ConcurrentHashMap<>();

    @Autowired(required = false)
    public RateLimiterService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.maxAttempts = 5;
        this.windowMinutes = 15;
    }

    public RateLimiterService(int maxAttempts, int windowMinutes) {
        this.redisTemplate = null;
        this.maxAttempts = maxAttempts;
        this.windowMinutes = windowMinutes;
    }

    /**
     * Check if the given identifier has exceeded the rate limit.
     *
     * @throws RateLimitExceededException if the limit is exceeded
     */
    public void checkLimit(String identifier) {
        if (redisTemplate != null) {
            String key = KEY_PREFIX + identifier;
            Object value = redisTemplate.opsForValue().get(key);
            int current = value != null ? Integer.parseInt(value.toString()) : 0;
            if (current >= maxAttempts) {
                Long expire = redisTemplate.getExpire(key, TimeUnit.SECONDS);
                long retryAfter = (expire != null && expire > 0) ? expire : (windowMinutes * 60L);
                throw new RateLimitExceededException("Rate limit exceeded for " + identifier, retryAfter);
            }
            increment(identifier);
        } else {
            Instant now = Instant.now();
            List<Instant> attempts = inMemoryAttempts.computeIfAbsent(identifier, k -> new ArrayList<>());
            synchronized (attempts) {
                attempts.removeIf(t -> t.isBefore(now.minusSeconds(windowMinutes * 60L)));
                if (attempts.size() >= maxAttempts) {
                    long retryAfter = 60L;
                    if (!attempts.isEmpty()) {
                        long elapsed = now.getEpochSecond() - attempts.get(0).getEpochSecond();
                        retryAfter = Math.max(1, (windowMinutes * 60L) - elapsed);
                    }
                    throw new RateLimitExceededException("Rate limit exceeded for " + identifier, retryAfter);
                }
                attempts.add(now);
            }
        }
    }

    /**
     * Count recent attempts for an identifier within the window.
     */
    public int countAttempts(String identifier) {
        if (redisTemplate != null) {
            String key = KEY_PREFIX + identifier;
            Object value = redisTemplate.opsForValue().get(key);
            return value != null ? Integer.parseInt(value.toString()) : 0;
        } else {
            Instant now = Instant.now();
            List<Instant> attempts = inMemoryAttempts.get(identifier);
            if (attempts == null) return 0;
            synchronized (attempts) {
                attempts.removeIf(t -> t.isBefore(now.minusSeconds(windowMinutes * 60L)));
                return attempts.size();
            }
        }
    }

    /**
     * Increment the attempt counter for an identifier.
     */
    public void increment(String identifier) {
        if (redisTemplate != null) {
            String key = KEY_PREFIX + identifier;
            redisTemplate.opsForValue().increment(key);
            redisTemplate.expire(key, windowMinutes, TimeUnit.MINUTES);
        } else {
            Instant now = Instant.now();
            List<Instant> attempts = inMemoryAttempts.computeIfAbsent(identifier, k -> new ArrayList<>());
            synchronized (attempts) {
                attempts.removeIf(t -> t.isBefore(now.minusSeconds(windowMinutes * 60L)));
                attempts.add(now);
            }
        }
    }

    /**
     * Reset the attempt counter for an identifier.
     */
    public void reset(String identifier) {
        if (redisTemplate != null) {
            String key = KEY_PREFIX + identifier;
            redisTemplate.delete(key);
        } else {
            inMemoryAttempts.remove(identifier);
        }
    }

    /**
     * Get remaining attempts/requests for an identifier.
     */
    public int getRemainingRequests(String identifier) {
        int current = countAttempts(identifier);
        return Math.max(0, maxAttempts - current);
    }

    public int getRemainingAttempts(String identifier) {
        return getRemainingRequests(identifier);
    }

    /**
     * Get retry after seconds for an identifier.
     */
    public long getRetryAfterSeconds(String identifier) {
        if (redisTemplate != null) {
            String key = KEY_PREFIX + identifier;
            Long expire = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            return (expire != null && expire > 0) ? expire : 0L;
        } else {
            Instant now = Instant.now();
            List<Instant> attempts = inMemoryAttempts.get(identifier);
            if (attempts == null || attempts.size() < maxAttempts) return 0L;
            synchronized (attempts) {
                attempts.removeIf(t -> t.isBefore(now.minusSeconds(windowMinutes * 60L)));
                if (attempts.size() < maxAttempts) return 0L;
                long elapsed = now.getEpochSecond() - attempts.get(0).getEpochSecond();
                return Math.max(1, (windowMinutes * 60L) - elapsed);
            }
        }
    }
}