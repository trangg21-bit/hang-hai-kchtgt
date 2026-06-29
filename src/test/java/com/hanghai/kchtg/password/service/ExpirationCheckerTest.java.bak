package com.hanghai.kchtg.password.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ExpirationChecker -
 computes expiration status and days remaining.
 *
 * Status enum values: ACTIVE, WARNING_T7, WARNING_T3, WARNING_T1, EXPIRED
 *
 * Tests:
 *  - null expiresAt -> ACTIVE
 *  - daysRemaining > 7 -> ACTIVE
 *  - daysRemaining <= 7 -> WARNING_T7
 *  - daysRemaining <= 3 -> WARNING_T3
 *  - daysRemaining <= 1 -> WARNING_T1
 *  - daysRemaining <= 0 -> EXPIRED
 *  - getDaysRemaining returns correct value
 *  - getDaysRemaining with null returns Integer.MAX_VALUE
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ExpirationCheckerTest {

    private ExpirationChecker checker;

    @BeforeEach
    void setUp() {
        checker = new ExpirationChecker();
    }

    // =========================================================================
    // check() status determination
    // =========================================================================

    @Test
    void check_nullExpiresAt_returnsActive() {
        LocalDateTime now = LocalDateTime.now();
        assertEquals("ACTIVE", checker.check(null, now));
    }

    @Test
    void check_expiresFarFuture_returnsActive() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(30);
        assertEquals("ACTIVE", checker.check(future, now));
    }

    @Test
    void check_expiresIn10Days_returnsActive() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(10);
        assertEquals("ACTIVE", checker.check(future, now));
    }


    @Test
    void check_expiresInExactly7Days_returnsWarningT7() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(7);
        assertEquals("WARNING_T7", checker.check(future, now));
    }

    @Test
    void check_expiresIn6Days_returnsWarningT7() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(6);
        assertEquals("WARNING_T7", checker.check(future, now));
    }

    @Test
    void check_expiresIn4Days_returnsWarningT7() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(4);
        assertEquals("WARNING_T7", checker.check(future, now));
    }

    @Test
    void check_expiresInExactly3Days_returnsWarningT3() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(3);
        assertEquals("WARNING_T3", checker.check(future, now));
    }

    @Test
    void check_expiresIn2Days_returnsWarningT3() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(2);
        assertEquals("WARNING_T3", checker.check(future, now));
    }

    @Test
    void check_expiresIn1Day_returnsWarningT1() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(1);
        assertEquals("WARNING_T1", checker.check(future, now));
    }

    @Test
    void check_expiresIn0Days_returnsExpired() {
        // expiresAt == now -> 0 days remaining
        LocalDateTime now = LocalDateTime.now();
        assertEquals("EXPIRED", checker.check(now, now));
    }

    @Test
    void check_expiredYesterday_returnsExpired() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime past = now.minusDays(1);
        assertEquals("EXPIRED", checker.check(past, now));
    }

    @Test
    void check_expiredManyDaysAgo_returnsExpired() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime past = now.minusDays(100);
        assertEquals("EXPIRED", checker.check(past, now));
    }

    // =========================================================================
    // Boundary: exactly 7.999... days - should be 7 days integer
    // =========================================================================

    @Test
    void check_boundary_exactly7Days_intDaysBetween() {
        LocalDateTime now = LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.DAYS);
        LocalDateTime future = now.plusDays(7);
        assertEquals("WARNING_T7", checker.check(future, now));
    }

    @Test
    void check_boundary_exactly8Days_isActive() {
        LocalDateTime now = LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.DAYS);
        LocalDateTime future = now.plusDays(8);
        assertEquals("ACTIVE", checker.check(future, now));
    }

    @Test
    void check_boundary_exactly3Days() {
        LocalDateTime now = LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.DAYS);
        LocalDateTime future = now.plusDays(3);
        assertEquals("WARNING_T3", checker.check(future, now));
    }

    @Test
    void check_boundary_exactly4Days_isWarningT7() {
        LocalDateTime now = LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.DAYS);
        LocalDateTime future = now.plusDays(4);
        assertEquals("WARNING_T7", checker.check(future, now));
    }

    // =========================================================================
    // getDaysRemaining()
    // =========================================================================

    @Test
    void getDaysRemaining_nullExpiresAt_returnsMaxValue() {
        LocalDateTime now = LocalDateTime.now();
        assertEquals(Integer.MAX_VALUE, checker.getDaysRemaining(null, now));
    }

    @Test
    void getDaysRemaining_futureDate_returnsPositive() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(15);
        assertEquals(15, checker.getDaysRemaining(future, now));
    }

    @Test
    void getDaysRemaining_pastDate_returnsNegative() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.minusDays(5);
        assertEquals(-5, checker.getDaysRemaining(future, now));
    }

    @Test
    void getDaysRemaining_sameDate_returnsZero() {
        LocalDateTime now = LocalDateTime.now();
        assertEquals(0, checker.getDaysRemaining(now, now));
    }

    @Test
    void getDaysRemaining_oneDayAway_returnsOne() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(1);
        assertEquals(1, checker.getDaysRemaining(future, now));
    }

    // =========================================================================
    // Integration: status matches daysRemaining
    // =========================================================================

    @Test
    void check_and_getDaysRemaining_consistency_overManyDays() {
        for (int days = -10; days <= 14; days++) {
            LocalDateTime now = LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.DAYS);
            LocalDateTime expires = now.plusDays(days);
            String status = checker.check(expires, now);
            int remaining = checker.getDaysRemaining(expires, now);

            switch (status) {
                case "EXPIRED" -> assertTrue(remaining <= 0, "Expected EXPIRED for days=" + days);
                case "WARNING_T1" -> assertEquals(1, remaining, "Expected WARNING_T1 for days=" + days);
                case "WARNING_T3" -> assertTrue(remaining >= 2 && remaining <= 3, "Expected WARNING_T3 for days=" + days);
                case "WARNING_T7" -> assertTrue(remaining >= 4 && remaining <= 7, "Expected WARNING_T7 for days=" + days);
                case "ACTIVE" -> assertTrue(remaining > 7, "Expected ACTIVE for days=" + days);
                default -> fail("Unknown status: " + status);
            }
        }
    }
}