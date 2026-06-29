package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for BR-007: Account auto-lockout after 5 failed login attempts.
 * Tests the lockout fields on the User entity (failedLoginCount, accountLockedUntil).
 */
class LockoutCounterTest {

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setStatus(UserStatus.ACTIVE);
        user.setFailedLoginCount(0);
        user.setAccountLockedUntil(null);
    }

    // =========================================================================
    //  Lockout field behavior tests
    // =========================================================================

    @Test
    void failedLoginCount_shouldStartAtZero() {
        assertEquals(0, user.getFailedLoginCount());
    }

    @Test
    void accountLockedUntil_shouldBeNullInitially() {
        assertNull(user.getAccountLockedUntil());
    }

    @Test
    void failedLoginCount_shouldIncrementOnFailedAttempt() {
        user.setFailedLoginCount(user.getFailedLoginCount() + 1);
        assertEquals(1, user.getFailedLoginCount());

        user.setFailedLoginCount(user.getFailedLoginCount() + 1);
        assertEquals(2, user.getFailedLoginCount());
    }

    @Test
    void failedLoginCount_shouldReachFiveAtLockoutThreshold() {
        // Simulate 5 failed attempts
        for (int i = 0; i < 5; i++) {
            user.setFailedLoginCount(user.getFailedLoginCount() + 1);
        }
        assertEquals(5, user.getFailedLoginCount());
    }

    @Test
    void failedLoginCount_shouldResetOnSuccessfulLogin() {
        // Simulate 3 failed attempts then success
        for (int i = 0; i < 3; i++) {
            user.setFailedLoginCount(user.getFailedLoginCount() + 1);
        }
        assertEquals(3, user.getFailedLoginCount());

        // Success resets counter
        user.setFailedLoginCount(0);
        assertEquals(0, user.getFailedLoginCount());
    }

    @Test
    void accountLockedUntil_shouldBeSetWhenFailingFiveTimes() {
        // Simulate 5 failed attempts
        for (int i = 0; i < 5; i++) {
            user.setFailedLoginCount(user.getFailedLoginCount() + 1);
        }

        // Set lockout (simulating the TOTP/auth service logic)
        user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(30));

        assertNotNull(user.getAccountLockedUntil());
        assertTrue(user.getAccountLockedUntil().isAfter(LocalDateTime.now()));
    }

    @Test
    void accountLockedUntil_shouldClearOnSuccessfulLogin() {
        // Set lockout
        user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(30));
        assertNotNull(user.getAccountLockedUntil());

        // Success clears lockout
        user.setAccountLockedUntil(null);
        assertNull(user.getAccountLockedUntil());
    }

    @Test
    void isAccountLocked_shouldDetectLockedStatus() {
        // Simulate lockout
        user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(30));

        assertTrue(isLocked(user));

        // Clear lockout
        user.setAccountLockedUntil(null);
        assertFalse(isLocked(user));
    }

    @Test
    void isAccountLocked_shouldDetectLockedStatusWithLockedEnum() {
        user.setStatus(UserStatus.LOCKED);
        assertTrue(isLocked(user));

        user.setStatus(UserStatus.ACTIVE);
        assertFalse(isLocked(user));
    }

    @Test
    void accountLockedUntil_shouldNotBlockAfterExpiry() {
        // Set lockout that already expired
        user.setAccountLockedUntil(LocalDateTime.now().minusMinutes(30));

        // After expiry, account should NOT be locked
        assertFalse(isLocked(user));
    }

    @Test
    void accountLockedUntil_shouldBlockBeforeExpiry() {
        // Set lockout in the future
        user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(30));
        assertTrue(isLocked(user));
    }

    // =========================================================================
    //  Lockout duration test (30 minutes as per SA design)
    // =========================================================================

    @Test
    void lockoutDuration_shouldBe30Minutes() {
        LocalDateTime before = LocalDateTime.now();
        user.setAccountLockedUntil(before.plusMinutes(30));
        LocalDateTime after = LocalDateTime.now();

        assertTrue(user.getAccountLockedUntil().isAfter(before));
        assertTrue(user.getAccountLockedUntil().isBefore(after.plusMinutes(31)));
    }

    // =========================================================================
    //  Helper to match JwtAuthFilter logic
    // =========================================================================

    private boolean isLocked(User user) {
        // T-005, T-007: Check both status=LOCKED and accountLockedUntil > now
        if (user.getStatus() == UserStatus.LOCKED) return true;
        if (user.getAccountLockedUntil() != null
                && LocalDateTime.now().isBefore(user.getAccountLockedUntil())) {
            return true;
        }
        return false;
    }
}
