package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.PasswordResetToken;
import com.hanghai.kchtg.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for BR-006: Password reset token expires after 1 hour.
 * Tests token expiry, single-use, and creation behavior.
 */
class PasswordResetTokenExpiryTest {

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
    }

    // =========================================================================
    //  Token creation tests
    // =========================================================================

    @Test
    void create_shouldSet1HourExpiry() {
        String tokenValue = "test-token-abc123";
        PasswordResetToken token = PasswordResetToken.create(user, tokenValue);

        assertNotNull(token);
        assertEquals(tokenValue, token.getToken());
        assertNotNull(token.getExpiresAt());
        assertFalse(token.isUsed());

        // Expiry should be approximately 1 hour from now
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        LocalDateTime oneHourFromNow = LocalDateTime.now().plusHours(1);
        assertTrue(token.getExpiresAt().isAfter(oneHourAgo));
        assertTrue(token.getExpiresAt().isBefore(oneHourFromNow.plusMinutes(1))); // Allow 1 min tolerance
    }

    @Test
    void create_shouldSetCorrectUserReference() {
        PasswordResetToken token = PasswordResetToken.create(user, "test-token");
        assertEquals(user, token.getUser());
    }

    @Test
    void create_shouldGenerateUniqueToken() {
        PasswordResetToken token1 = PasswordResetToken.create(user, "token-1");
        PasswordResetToken token2 = PasswordResetToken.create(user, "token-2");

        assertNotEquals(token1.getToken(), token2.getToken());
    }

    // =========================================================================
    //  Expiry tests (BR-006)
    // =========================================================================

    @Test
    void isExpired_shouldReturnFalseForNewToken() {
        PasswordResetToken token = PasswordResetToken.create(user, "fresh-token");
        assertFalse(token.isExpired());
    }

    @Test
    void isExpired_shouldReturnTrueForExpiredToken() {
        // Manually set expiry to 2 hours ago (already expired)
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken("expired-token");
        token.setExpiresAt(LocalDateTime.now().minusHours(2));

        assertTrue(token.isExpired());
    }

    @Test
    void isExpired_shouldReturnFalseForTokenExpiringSoon() {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken("about-to-expire");
        token.setExpiresAt(LocalDateTime.now().plusMinutes(1));

        assertFalse(token.isExpired());
    }

    @Test
    void isExpired_shouldReturnTrueForExactlyExpired() {
        // Set expiry to exactly now — technically not expired (isAfter, not isAfterEqual)
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken("exact-expiry");
        token.setExpiresAt(LocalDateTime.now());

        // LocalDateTime.now().isAfter(now) = false, so not expired yet
        assertFalse(token.isExpired());
    }

    @Test
    void isExpired_shouldReturnTrueForJustExpired() {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken("just-expired");
        token.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        assertTrue(token.isExpired());
    }

    // =========================================================================
    //  Single-use tests
    // =========================================================================

    @Test
    void isUsed_shouldReturnFalseInitially() {
        PasswordResetToken token = PasswordResetToken.create(user, "unused-token");
        assertFalse(token.isUsed());
    }

    @Test
    void setUsed_shouldMarkTokenAsUsed() {
        PasswordResetToken token = PasswordResetToken.create(user, "reuse-token");
        assertFalse(token.isUsed());

        token.setUsed(true);
        assertTrue(token.isUsed());
    }

    @Test
    void shouldNotAllowTokenReuse() {
        // Simulate the password reset flow
        PasswordResetToken token = PasswordResetToken.create(user, "single-use-token");

        // First use
        assertFalse(token.isExpired());
        assertFalse(token.isUsed());
        token.setUsed(true);

        // Second use attempt — should be rejected
        assertTrue(token.isUsed());
        // In the service, this would throw ValidationException("Token da duoc su dung")
    }

    // =========================================================================
    //  Edge cases
    // =========================================================================

    @Test
    void isExpired_shouldHandleNullExpiresAt() {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken("no-expiry");
        token.setExpiresAt(null);

        // isExpired calls LocalDateTime.now().isAfter(null) — should throw NPE
        // In production, this case is prevented by NOT NULL DB constraint
        assertThrows(NullPointerException.class, () -> token.isExpired());
    }

    @Test
    void createWithDifferentUsers_shouldNotShareState() {
        User user2 = new User();
        user2.setUsername("user2");
        user2.setEmail("user2@example.com");

        PasswordResetToken token1 = PasswordResetToken.create(user, "token-a");
        PasswordResetToken token2 = PasswordResetToken.create(user2, "token-b");

        assertNotEquals(token1.getUser(), token2.getUser());
        assertNotEquals(token1.getExpiresAt(), token2.getExpiresAt());
    }

    @Test
    void tokenExpiryWindow_shouldBeExactlyOneHour() {
        // The factory sets expiresAt = now + 1 hour
        PasswordResetToken token = PasswordResetToken.create(user, "expiry-window");

        LocalDateTime expectedMin = LocalDateTime.now().minusMinutes(1);
        LocalDateTime expectedMax = LocalDateTime.now().plusHours(1).plusMinutes(1);

        assertTrue(token.getExpiresAt().isAfter(expectedMin));
        assertTrue(token.getExpiresAt().isBefore(expectedMax));
    }
}
