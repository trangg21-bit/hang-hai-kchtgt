package com.hanghai.kchtg.user.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Notification service for account registration events.
 * <p>
 * Currently a no-op placeholder. In production this would integrate with
 * an email/SMS gateway (e.g. SMTP, VNPay, Zalo OTP, etc.).
 * </p>
 */
@Component
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    /**
     * Sends a verification email to the given address with the verification token.
     *
     * @param email recipient email
     * @param verificationToken plain token (not hashed) to embed in link
     * @param username display name
     */
    public void sendVerificationEmail(String email, String verificationToken, String username) {
        // Placeholder: in production, integrate with SMTP / email provider
        String verificationLink = "/api/verify?token=" + verificationToken;
        log.info("NOTIFICATION [VERIFY_EMAIL]: email={}, user={}, link={}", email, username, verificationLink);
        // TODO: Replace with actual email sending logic (e.g. JavaMailSender, third-party API)
    }

    /**
     * Sends a registration success notification.
     */
    public void sendRegistrationSuccess(String email, String username) {
        log.info("NOTIFICATION [REGISTER_SUCCESS]: email={}, user={}", email, username);
        // TODO: Replace with actual email sending logic
    }

    /**
     * Sends a password reset notification.
     */
    public void sendPasswordResetEmail(String email, String resetToken) {
        log.info("NOTIFICATION [PASSWORD_RESET]: email={}, tokenHash={}", email, hashToken(resetToken));
        // TODO: Replace with actual email sending logic
    }

    /**
     * Sends an SMS notification (placeholder).
     */
    public void sendSms(String phone, String message) {
        log.info("NOTIFICATION [SMS]: phone={}, message={}", phone, maskPhone(phone));
        // TODO: Replace with actual SMS gateway integration
    }

    private String hashToken(String token) {
        if (token == null) return "null";
        try {
            return java.util.Base64.getEncoder().encodeToString(
                    java.security.MessageDigest.getInstance("SHA-256").digest(token.getBytes()))
                    .substring(0, 16);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "****";
        return "****" + phone.substring(phone.length() - 4);
    }
}