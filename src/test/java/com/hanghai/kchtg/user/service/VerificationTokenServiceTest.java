package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.VerificationToken;
import com.hanghai.kchtg.user.exception.VerificationException;
import com.hanghai.kchtg.user.repository.VerificationTokenRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationTokenServiceTest {

    @Mock
    private VerificationTokenRepository tokenRepository;

    @InjectMocks
    private VerificationTokenService verificationTokenService;

    private UUID testUserId;
    private String testEmail;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testEmail = "test@example.com";
    }

    @Test
    void generateToken_shouldCreateTokenAndReturnPlainToken() {
        when(tokenRepository.findValidTokensByUserId(eq(testUserId), any(LocalDateTime.class)))
                .thenReturn(List.of());
        String plainToken = verificationTokenService.generateToken(testUserId, testEmail, "Test User");
        assertNotNull(plainToken);
        assertFalse(plainToken.isBlank());
        verify(tokenRepository).save(argThat(token -> {
            assertEquals(testEmail, token.getEmail());
            assertEquals(testUserId, token.getUserId());
            assertFalse(token.isUsed());
            assertTrue(token.getExpiresAt().isAfter(LocalDateTime.now()));
            assertEquals(64, token.getTokenHash().length());
            return true;
        }));
    }

    @Test
    void generateToken_shouldInvalidateExistingTokens() {
        VerificationToken existingToken = new VerificationToken();
        existingToken.setId(UUID.randomUUID());
        existingToken.setEmail(testEmail);
        existingToken.setUserId(testUserId);
        existingToken.setTokenHash("existingHash");
        existingToken.setUsed(false);
        existingToken.setExpiresAt(LocalDateTime.now().plusMinutes(20));

        when(tokenRepository.findValidTokensByUserId(eq(testUserId), any(LocalDateTime.class)))
                .thenReturn(List.of(existingToken));

        String plainToken = verificationTokenService.generateToken(testUserId, testEmail, "Test User");
        assertNotNull(plainToken);

        verify(tokenRepository).saveAll(argThat(tokens -> {
            for (VerificationToken t : tokens) {
                if (t.getId().equals(existingToken.getId()) && t.isUsed()) return true;
            }
            return false;
        }));
    }

    @Test
    void validateToken_shouldReturnTrueForValidToken() {
        String plainToken = "testToken123";
        String expectedHash = sha256(plainToken);
        VerificationToken token = new VerificationToken();
        token.setId(UUID.randomUUID());
        token.setEmail(testEmail);
        token.setTokenHash(expectedHash);
        token.setUsed(false);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(20));

        when(tokenRepository.findAll()).thenReturn(List.of(token));

        assertTrue(verificationTokenService.validateToken(plainToken));
        assertTrue(token.isUsed());
        verify(tokenRepository).save(token);
    }

    @Test
    void validateToken_shouldThrowForInvalidToken() {
        when(tokenRepository.findAll()).thenReturn(List.of());

        VerificationException ex = assertThrows(VerificationException.class, () ->
                verificationTokenService.validateToken("nonExistentToken"));
        assertEquals("VERIFICATION_ERROR", ex.getErrorCode());
    }

    @Test
    void validateToken_shouldThrowForExpiredToken() {
        VerificationToken expiredToken = new VerificationToken();
        expiredToken.setTokenHash("someHash");
        expiredToken.setUsed(false);
        expiredToken.setExpiresAt(LocalDateTime.now().minusMinutes(10));

        when(tokenRepository.findAll()).thenReturn(List.of(expiredToken));

        VerificationException ex = assertThrows(VerificationException.class, () ->
                verificationTokenService.validateToken("someToken"));
        assertEquals("VERIFICATION_ERROR", ex.getErrorCode());
    }

    @Test
    void validateToken_shouldThrowForUsedToken() {
        VerificationToken usedToken = new VerificationToken();
        usedToken.setTokenHash("someHash");
        usedToken.setUsed(true);

        when(tokenRepository.findAll()).thenReturn(List.of(usedToken));

        VerificationException ex = assertThrows(VerificationException.class, () ->
                verificationTokenService.validateToken("someToken"));
        assertEquals("VERIFICATION_ERROR", ex.getErrorCode());
    }

    @Test
    void findValidToken_shouldReturnTokenIfExists() {
        VerificationToken token = new VerificationToken();
        token.setEmail(testEmail);
        token.setUsed(false);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(20));

        when(tokenRepository.findValidTokenByEmail(eq(testEmail), any(LocalDateTime.class)))
                .thenReturn(Optional.of(token));

        VerificationToken found = verificationTokenService.findValidToken(testEmail);
        assertNotNull(found);
        assertEquals(testEmail, found.getEmail());
    }

    @Test
    void findValidToken_shouldReturnNullIfNotFound() {
        when(tokenRepository.findValidTokenByEmail(eq(testEmail), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        assertNull(verificationTokenService.findValidToken(testEmail));
    }

    @Test
    void cleanupExpiredTokens_shouldDeleteExpired() {
        when(tokenRepository.deleteExpiredTokens(any(LocalDateTime.class))).thenReturn(5);

        int deleted = verificationTokenService.cleanupExpiredTokens();
        assertEquals(5, deleted);
    }

    private String sha256(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}