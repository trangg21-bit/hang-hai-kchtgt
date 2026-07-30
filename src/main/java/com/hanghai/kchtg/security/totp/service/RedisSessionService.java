package com.hanghai.kchtg.security.totp.service;

import com.hanghai.kchtg.security.totp.dto.TotpEnrollSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Redis-backed session management for TOTP enrollment.
 * <p>
 * Stores enrollment sessions with a 300-second (5-minute) TTL so that
 * a user must scan the QR code and verify within a reasonable window.
 * </p>
 */
@Service
public class RedisSessionService {

    private static final Logger log = LoggerFactory.getLogger(RedisSessionService.class);

    private static final String KEY_PREFIX = "totp:enroll:";
    private static final Duration SESSION_TTL = Duration.ofSeconds(300);

    private final StringRedisTemplate redisTemplate;

    public RedisSessionService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Creates an enrollment session and stores it in Redis.
     *
     * @param userId the user identifier
     * @param session the enrollment session record
     * @return the session ID (also the Redis key suffix)
     */
    public String createSession(String userId, TotpEnrollSession session) {
        String key = KEY_PREFIX + userId;
        String sessionId = UUID.randomUUID().toString();
        session.setSessionId(sessionId);

        try {
            redisTemplate.opsForValue().set(key, session.toJson(), SESSION_TTL);
            log.debug("Created TOTP enrollment session for user {}", userId);
            return sessionId;
        } catch (Exception e) {
            log.error("Failed to store session in Redis: {}", e.getMessage());
            throw new RuntimeException("Failed to create enrollment session", e);
        }
    }

    /**
     * Retrieves an enrollment session for a user.
     *
     * @param userId the user identifier
     * @return the session record, or {@code null} if not found or expired
     */
    public TotpEnrollSession getSession(String userId) {
        String key = KEY_PREFIX + userId;

        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null) {
                return null;
            }
            return TotpEnrollSession.fromJson(json);
        } catch (Exception e) {
            log.error("Failed to retrieve session from Redis: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Deletes an enrollment session for a user (e.g. after successful verification or expiration).
     *
     * @param userId the user identifier
     */
    public void deleteSession(String userId) {
        String key = KEY_PREFIX + userId;

        try {
            redisTemplate.delete(key);
            log.debug("Deleted TOTP enrollment session for user {}", userId);
        } catch (Exception e) {
            log.error("Failed to delete session from Redis: {}", e.getMessage());
        }
    }
}
