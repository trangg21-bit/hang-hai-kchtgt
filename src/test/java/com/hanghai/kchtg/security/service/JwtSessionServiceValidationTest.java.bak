package com.hanghai.kchtg.security.service;

import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.entity.JwtSessionEntity;
import com.hanghai.kchtg.security.repository.JwtSessionRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtSessionServiceValidationTest {

    @Mock
    private JwtSessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache cache;

    private JwtSessionService sessionService;

    @BeforeEach
    void setUp() {
        sessionService = new JwtSessionService(sessionRepository, userRepository, jwtUtil, cacheManager);
    }

    @Test
    @DisplayName("Should successfully validate a valid refresh token")
    void shouldSuccessfullyValidateValidRefreshToken() {
        String token = "valid-refresh-token";
        Claims mockClaims = mock(Claims.class);
        when(mockClaims.getId()).thenReturn("session-123");
        when(jwtUtil.validateToken(token)).thenReturn(mockClaims);

        JwtSessionEntity session = new JwtSessionEntity();
        session.setSessionId("session-123");
        session.setUserId("user-456");
        session.setIsRevoked(false);
        session.setExpiresAt(LocalDateTime.now().plusDays(1));
        session.setRefreshTokenSalt("salt123");
        session.setRefreshTokenHash(computeSaltedHash(token, "salt123"));

        when(sessionRepository.findBySessionId("session-123")).thenReturn(Optional.of(session));

        Optional<JwtSessionEntity> result = sessionService.validateRefreshToken(token);

        assertTrue(result.isPresent());
        assertEquals(session, result.get());
        verify(sessionRepository).save(session);
    }

    @Test
    @DisplayName("Should fail validation on invalid token signature")
    void shouldFailValidationOnInvalidTokenSignature() {
        String token = "invalid-token";
        when(jwtUtil.validateToken(token)).thenThrow(new JwtException("Invalid signature"));

        Optional<JwtSessionEntity> result = sessionService.validateRefreshToken(token);

        assertTrue(result.isEmpty());
        verifyNoInteractions(sessionRepository);
    }

    @Test
    @DisplayName("Should fail validation on expired session")
    void shouldFailValidationOnExpiredSession() {
        String token = "expired-token";
        Claims mockClaims = mock(Claims.class);
        when(mockClaims.getId()).thenReturn("session-expired");
        when(jwtUtil.validateToken(token)).thenReturn(mockClaims);

        JwtSessionEntity session = new JwtSessionEntity();
        session.setSessionId("session-expired");
        session.setUserId("user-456");
        session.setIsRevoked(false);
        session.setExpiresAt(LocalDateTime.now().minusMinutes(5));

        when(sessionRepository.findBySessionId("session-expired")).thenReturn(Optional.of(session));
        when(cacheManager.getCache("jwtRevocation")).thenReturn(cache);

        Optional<JwtSessionEntity> result = sessionService.validateRefreshToken(token);

        assertTrue(result.isEmpty());
        assertTrue(session.getIsRevoked());
        verify(sessionRepository).save(session);
        verify(cache).put("session-expired", true);
    }

    @Test
    @DisplayName("Should fail validation and trigger reuse detection (revoking all sessions) if token is revoked")
    void shouldFailValidationAndTriggerReuseDetection() {
        String token = "reused-token";
        Claims mockClaims = mock(Claims.class);
        when(mockClaims.getId()).thenReturn("session-reused");
        when(jwtUtil.validateToken(token)).thenReturn(mockClaims);

        JwtSessionEntity session = new JwtSessionEntity();
        session.setSessionId("session-reused");
        session.setUserId("user-456");
        session.setIsRevoked(true); // Already revoked!
        session.setExpiresAt(LocalDateTime.now().plusDays(1));
        session.setRefreshTokenSalt("salt123");
        session.setRefreshTokenHash(computeSaltedHash(token, "salt123"));

        when(sessionRepository.findBySessionId("session-reused")).thenReturn(Optional.of(session));
        when(sessionRepository.findByUserIdAndIsRevokedFalse("user-456")).thenReturn(Collections.singletonList(session));
        when(cacheManager.getCache("jwtRevocation")).thenReturn(cache);

        Optional<JwtSessionEntity> result = sessionService.validateRefreshToken(token);

        assertTrue(result.isEmpty());
        verify(sessionRepository).revokeAllByUserId("user-456");
        verify(cache).put("session-reused", true);
    }

    private String computeSaltedHash(String token, String salt) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-512");
            byte[] hashBytes = digest.digest((token + ":" + salt).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
