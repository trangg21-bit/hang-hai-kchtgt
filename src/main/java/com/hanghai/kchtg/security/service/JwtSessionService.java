package com.hanghai.kchtg.security.service;

import com.hanghai.kchtg.security.entity.JwtSessionEntity;
import com.hanghai.kchtg.security.entity.JwtSessionEntity.SessionStatus;
import com.hanghai.kchtg.security.repository.JwtSessionRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Core service for JWT session management (F-274).
 */
@Service
public class JwtSessionService {

    private static final Logger log = LoggerFactory.getLogger(JwtSessionService.class);
    private static final int SALT_LENGTH = 16; // 128-bit salt

    private final JwtSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final com.hanghai.kchtg.security.JwtUtil jwtUtil;
    private final CacheManager cacheManager;
    private final SecureRandom secureRandom = new SecureRandom();

    public JwtSessionService(JwtSessionRepository sessionRepository,
                             UserRepository userRepository,
                             com.hanghai.kchtg.security.JwtUtil jwtUtil,
                             CacheManager cacheManager) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.cacheManager = cacheManager;
    }

    /**
     * Create a new JwtSession record after successful login.
     */
    public RefreshTokenPair createSession(User user, String sessionId,
                                          String refreshTokenValue,
                                          String userAgent, String ipAddress,
                                          String deviceFingerprint,
                                          LocalDateTime expiresAt) {
        String userIdStr = user.getId().toString();

        // 1. Generate salt
        byte[] saltBytes = new byte[SALT_LENGTH];
        secureRandom.nextBytes(saltBytes);
        String salt = Base64.getEncoder().encodeToString(saltBytes);

        // 2. Compute SHA-512 hash of (refreshToken + salt)
        String hash = sha512Hex(refreshTokenValue + ":" + salt);

        // 3. Determine role level
        int roleLevel = resolveRoleLevel(user.getRole());

        // 4. Build and persist session
        JwtSessionEntity session = new JwtSessionEntity();
        session.setUser(user);
        session.setUserId(userIdStr);
        session.setUsername(user.getUsername());
        session.setRoleLevel(roleLevel);
        session.setRefreshTokenHash(hash);
        session.setRefreshTokenSalt(salt);
        session.setSessionId(sessionId);
        session.setUserAgent(userAgent);
        session.setIpAddress(ipAddress);
        session.setDeviceFingerprint(deviceFingerprint);
        session.setExpiresAt(expiresAt);
        session.setLastUsedAt(LocalDateTime.now());
        session.setIsRevoked(false);
        session.setStatus(SessionStatus.ACTIVE);

        sessionRepository.save(session);

        log.info("JWT session created: userId={}, sessionId={}, expiresAt={}",
                userIdStr, sessionId, expiresAt);

        return new RefreshTokenPair(refreshTokenValue, hash);
    }

    /**
     * Find session by refresh token hash (reuse detection lookup).
     */
    public Optional<JwtSessionEntity> findByRefreshTokenHash(String hash) {
        return sessionRepository.findByRefreshTokenHash(hash);
    }

    /**
     * Find session by session ID.
     */
    public Optional<JwtSessionEntity> findBySessionId(String sessionId) {
        return sessionRepository.findBySessionId(sessionId);
    }

    /**
     * Find all active (non-revoked) sessions for a user.
     */
    public List<JwtSessionEntity> findActiveByUserId(String userId) {
        return sessionRepository.findByUserIdAndIsRevokedFalse(userId);
    }

    /**
     * Find all active (non-revoked) sessions for a User entity.
     */
    public List<JwtSessionEntity> findActiveByUserId(User user) {
        return findActiveByUserId(user.getId().toString());
    }

    /**
     * Validate a refresh token against the stored hash.
     */
    @Transactional
    public Optional<JwtSessionEntity> validateRefreshToken(String refreshTokenValue) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            log.debug("Empty refresh token provided");
            return Optional.empty();
        }

        Claims claims;
        try {
            claims = jwtUtil.validateToken(refreshTokenValue);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid refresh token signature/format: {}", e.getMessage());
            return Optional.empty();
        }

        String jti = claims.getId();
        if (jti == null) {
            log.debug("Refresh token missing JTI claim");
            return Optional.empty();
        }

        Optional<JwtSessionEntity> sessionOpt = sessionRepository.findBySessionId(jti);
        if (sessionOpt.isEmpty()) {
            log.debug("No session found in DB for JTI: {}", jti);
            return Optional.empty();
        }

        JwtSessionEntity session = sessionOpt.get();

        // Check expiration
        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Refresh token expired: sessionId={}, userId={}",
                    session.getSessionId(), session.getUserId());
            session.revoke("EXPIRED", null);
            sessionRepository.save(session);
            Cache cache = cacheManager.getCache("jwtRevocation");
            if (cache != null) {
                cache.put(jti, true);
            }
            return Optional.empty();
        }

        // Verify salted hash
        String computedHash = sha512Hex(refreshTokenValue + ":" + session.getRefreshTokenSalt());
        if (!computedHash.equals(session.getRefreshTokenHash())) {
            log.warn("Salted hash mismatch for session: {}", jti);
            return Optional.empty();
        }

        // Check revocation (reuse detection)
        if (Boolean.TRUE.equals(session.getIsRevoked())) {
            log.warn("Refresh token reuse detected: sessionId={}, userId={}. Revoking all sessions.",
                    session.getSessionId(), session.getUserId());
            revokeAllSessions(session.getUserId(), "REUSE_DETECTED");
            return Optional.empty();
        }

        // Touch lastUsedAt
        session.touch();
        sessionRepository.save(session);

        log.debug("Refresh token validated successfully: sessionId={}, userId={}",
                session.getSessionId(), session.getUserId());

        return Optional.of(session);
    }

    /**
     * Revoke a session by JTI (JWT ID).
     */
    @Transactional
    public boolean revokeSession(String jti, String userId, String reason) {
        Optional<JwtSessionEntity> sessionOpt = sessionRepository.findBySessionId(jti);

        if (sessionOpt.isEmpty()) {
            log.warn("Session not found for revocation: jti={}, userId={}", jti, userId);
            return false;
        }

        JwtSessionEntity session = sessionOpt.get();
        session.revoke(reason, userId != null ? UUID.fromString(userId) : null);
        sessionRepository.save(session);

        Cache cache = cacheManager.getCache("jwtRevocation");
        if (cache != null) {
            cache.put(jti, true);
        }

        log.info("Session revoked: sessionId={}, userId={}, reason={}",
                session.getSessionId(), session.getUserId(), reason);
        return true;
    }

    /**
     * Revoke all sessions for a user.
     */
    @Transactional
    public int revokeAllSessions(String userId, String reason) {
        List<JwtSessionEntity> activeSessions = sessionRepository.findByUserIdAndIsRevokedFalse(userId);
        int count = sessionRepository.revokeAllByUserId(userId);

        Cache cache = cacheManager.getCache("jwtRevocation");
        if (cache != null) {
            for (JwtSessionEntity session : activeSessions) {
                cache.put(session.getSessionId(), true);
            }
        }

        log.info("All sessions revoked for userId={}, reason={}, count={}", userId, reason, count);
        return count;
    }

    /**
     * Find all expired sessions that have not yet been revoked.
     */
    public List<JwtSessionEntity> findExpiredSessions() {
        return sessionRepository.findExpiredSessions(LocalDateTime.now());
    }

    /**
     * Cleanup expired sessions.
     */
    @Transactional
    public int cleanupExpired() {
        LocalDateTime now = LocalDateTime.now();
        List<JwtSessionEntity> expired = sessionRepository.findExpiredSessions(now);

        int count = 0;
        for (JwtSessionEntity session : expired) {
            session.setStatus(SessionStatus.EXPIRED);
            session.setIsRevoked(true);
            session.setRevokedAt(now);
            sessionRepository.save(session);
            count++;
        }

        if (count > 0) {
            log.info("Cleaned up {} expired JWT sessions", count);
        }

        return count;
    }

    /**
     * Compute SHA-512 hex digest of input string.
     */
    private String sha512Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-512");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-512 algorithm not available", e);
        }
    }

    /**
     * Hash a refresh token value using its stored salt from the session.
     */
    String hashRefreshToken(String refreshTokenValue) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-512");
            byte[] hash = digest.digest(refreshTokenValue.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-512 algorithm not available", e);
        }
    }

    /**
     * Convert byte array to hex string.
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /**
     * Map Spring Security role to numeric level.
     */
    private int resolveRoleLevel(String role) {
        if (role == null) return 1;
        String upper = role.toUpperCase();
        if (upper.startsWith("SUPER_ADMIN")) return 3;
        if (upper.startsWith("ADMIN"))       return 2;
        return 1;
    }

    /**
     * Pair of (plaintext refresh token, hashed version).
     */
    public record RefreshTokenPair(String token, String hash) {}
}