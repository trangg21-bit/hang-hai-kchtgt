package com.hanghai.kchtg.password.service;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Computes password expiration status from expiresAt and current time.
 * Returns status enum (ACTIVE, WARNING_T7, WARNING_T3, WARNING_T1, EXPIRED).
 */
@Component
public class ExpirationChecker {

    /**
     * Computes the password status based on expiresAt and current time.
     *
     * @param expiresAt the expiration datetime (null = ACTIVE)
     * @param now       current time
     * @return PasswordStatus enum
     */
    public String check(LocalDateTime expiresAt, LocalDateTime now) {
        if (expiresAt == null) {
            return "ACTIVE";
        }

        long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(now, expiresAt);

        if (daysRemaining <= 0) {
            return "EXPIRED";
        } else if (daysRemaining <= 1) {
            return "WARNING_T1";
        } else if (daysRemaining <= 3) {
            return "WARNING_T3";
        } else if (daysRemaining <= 7) {
            return "WARNING_T7";
        } else {
            return "ACTIVE";
        }
    }

    /**
     * Returns the number of days remaining until expiration.
     * Negative if already expired.
     */
    public int getDaysRemaining(LocalDateTime expiresAt, LocalDateTime now) {
        if (expiresAt == null) {
            return Integer.MAX_VALUE;
        }
        return (int) java.time.temporal.ChronoUnit.DAYS.between(now, expiresAt);
    }
}