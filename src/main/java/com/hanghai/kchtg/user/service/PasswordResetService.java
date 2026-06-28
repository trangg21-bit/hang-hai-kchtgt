package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.PasswordResetToken;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.exception.ValidationException;
import com.hanghai.kchtg.user.repository.PasswordResetTokenRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Password reset service - implements the forgot password + reset password flow.
 * <p>
 * BR-006: Token expires after 1 hour.
 * Token is single-use only (used flag).
 * </p>
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int TOKEN_LENGTH = 32; // bytes
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final PasswordPolicyValidator passwordPolicyValidator;

    public PasswordResetService(PasswordResetTokenRepository tokenRepository,
                                UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                NotificationService notificationService,
                                PasswordPolicyValidator passwordPolicyValidator) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.passwordPolicyValidator = passwordPolicyValidator;
    }

    /**
     * Request a password reset for the given email address.
     * Creates a new 1-hour-expiring token, deletes any existing unused tokens, and sends the reset email.
     *
     * @param email the user's email address
     * @throws ValidationException if user not found with that email
     */
    @Transactional
    public void requestReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Security: Don't reveal whether the email exists. Log it, but don't throw.
            log.warn("Password reset requested for non-existent email: {}", email);
            return; // Silent success to prevent email enumeration
        }

        User user = userOpt.get();

        // BR-006: Invalidate all existing unused tokens for this user
        tokenRepository.markAllUnusedAsUsedByUserId(user.getId());

        // Generate a secure random token
        String tokenValue = generateSecureToken();

        // Create new reset token with 1-hour expiry
        PasswordResetToken resetToken = PasswordResetToken.create(user, tokenValue);
        tokenRepository.save(resetToken);

        // Send password reset email (placeholder - integrates with NotificationService)
        notificationService.sendPasswordResetEmail(user.getEmail(), tokenValue);

        log.info("Password reset requested for user: {} (email={})", user.getUsername(), email);
    }

    /**
     * Reset password using the token.
     * Validates expiry (BR-006), checks single-use (used flag), and invalidates old tokens.
     *
     * @param token the reset token from the email link
     * @param newPassword the new password
     * @throws ValidationException if token is invalid, expired, or already used
     */
    @Transactional
    public void resetByToken(String token, String newPassword) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            throw new ValidationException("Token khong hop le");
        }

        PasswordResetToken resetToken = tokenOpt.get();

        // BR-006: Check token expiry (1 hour)
        if (resetToken.isExpired()) {
            throw new ValidationException("Link dat lai mat khau da het han");
        }

        // Check if already used (single-use token)
        if (resetToken.isUsed()) {
            throw new ValidationException("Token da duoc su dung");
        }

        User user = resetToken.getUser();

        // Validate new password against policy
        passwordPolicyValidator.validate(newPassword);

        // Hash the new password and save
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setFailedLoginCount(0);
        user.setAccountLockedUntil(null);
        user.setPasswordHashVersion((user.getPasswordHashVersion() != null ? user.getPasswordHashVersion() + 1 : 1));
        userRepository.save(user);

        // Mark token as used (prevents reuse)
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Password reset completed for user: {} (token={})", user.getUsername(),
                resetToken.getToken().substring(0, 8) + "...");
    }

    /**
     * Validates that a reset token is still valid (not expired, not used).
     * Used by controllers to provide user-friendly error messages.
     */
    @Transactional(readOnly = true)
    public boolean isTokenValid(String token) {
        return tokenRepository.findByToken(token).map(t -> {
            if (t.isExpired()) return false;
            if (t.isUsed()) return false;
            return true;
        }).orElse(false);
    }

    /**
     * Generates a cryptographically secure random token string.
     */
    private String generateSecureToken() {
        byte[] bytes = new byte[TOKEN_LENGTH];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64UrlEncoder.encode(bytes);
    }

    /**
     * Simple Base64 URL-safe encoder for token strings.
     */
    private static class Base64UrlEncoder {
        static String encode(byte[] bytes) {
            return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        }
    }
}
