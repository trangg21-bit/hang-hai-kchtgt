package com.hanghai.kchtg.security.service;

import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.entity.JwtSessionEntity;
import com.hanghai.kchtg.security.repository.JwtSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenRevocationCacheTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache cache;

    @Mock
    private JwtSessionRepository sessionRepository;

    private TokenValidationService validationService;

    @BeforeEach
    void setUp() {
        when(cacheManager.getCache("jwtRevocation")).thenReturn(cache);
        validationService = new TokenValidationService(jwtUtil, cacheManager, sessionRepository);
    }

    @Test
    @DisplayName("Should return true for revoked JTI from cache hit")
    void shouldReturnTrueForRevokedJtiFromCacheHit() {
        String jti = "revoked-jti-123";
        when(cache.get(jti, Boolean.class)).thenReturn(Boolean.TRUE);

        boolean result = validationService.isJtiRevoked(jti);

        assertTrue(result);
        verify(cache).get(jti, Boolean.class);
        verifyNoInteractions(sessionRepository);
    }

    @Test
    @DisplayName("Should return false for active JTI from cache hit")
    void shouldReturnFalseForActiveJtiFromCacheHit() {
        String jti = "active-jti-123";
        when(cache.get(jti, Boolean.class)).thenReturn(Boolean.FALSE);

        boolean result = validationService.isJtiRevoked(jti);

        assertFalse(result);
        verify(cache).get(jti, Boolean.class);
        verifyNoInteractions(sessionRepository);
    }

    @Test
    @DisplayName("Should check DB and cache result on cache miss (Active Session)")
    void shouldCheckDbAndCacheResultOnCacheMissActive() {
        String jti = "miss-jti-123";
        when(cache.get(jti, Boolean.class)).thenReturn(null);

        JwtSessionEntity session = new JwtSessionEntity();
        session.setSessionId(jti);
        session.setIsRevoked(false);

        when(sessionRepository.findBySessionId(jti)).thenReturn(Optional.of(session));

        boolean result = validationService.isJtiRevoked(jti);

        assertFalse(result);
        verify(cache).get(jti, Boolean.class);
        verify(sessionRepository).findBySessionId(jti);
        verify(cache).put(jti, false);
    }

    @Test
    @DisplayName("Should check DB and cache result on cache miss (Revoked Session)")
    void shouldCheckDbAndCacheResultOnCacheMissRevoked() {
        String jti = "miss-jti-456";
        when(cache.get(jti, Boolean.class)).thenReturn(null);

        JwtSessionEntity session = new JwtSessionEntity();
        session.setSessionId(jti);
        session.setIsRevoked(true);

        when(sessionRepository.findBySessionId(jti)).thenReturn(Optional.of(session));

        boolean result = validationService.isJtiRevoked(jti);

        assertTrue(result);
        verify(cache).get(jti, Boolean.class);
        verify(sessionRepository).findBySessionId(jti);
        verify(cache).put(jti, true);
    }

    @Test
    @DisplayName("Should treat missing JTI in DB as revoked on cache miss")
    void shouldTreatMissingJtiInDbAsRevoked() {
        String jti = "missing-jti-789";
        when(cache.get(jti, Boolean.class)).thenReturn(null);
        when(sessionRepository.findBySessionId(jti)).thenReturn(Optional.empty());

        boolean result = validationService.isJtiRevoked(jti);

        assertTrue(result);
        verify(cache).get(jti, Boolean.class);
        verify(sessionRepository).findBySessionId(jti);
        verify(cache).put(jti, true);
    }
}