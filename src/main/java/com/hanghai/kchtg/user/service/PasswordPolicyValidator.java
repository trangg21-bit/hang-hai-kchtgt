package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.exception.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Validates passwords against a configurable password policy.
 * <p>
 * Configuration via {@code app.password.*} properties (matching SA design):
 * <ul>
 *   <li>min-length: 8 (default)</li>
 *   <li>require-uppercase: true</li>
 *   <li>require-lowercase: true</li>
 *   <li>require-digit: true</li>
 *   <li>require-special: false (BA spec does NOT require special char)</li>
 * </ul>
 * </p>
 * <p>
 * Admin reset password uses a relaxed policy: >= 8 chars, letter + digit, no special char required.
 * </p>
 */
@Component
public class PasswordPolicyValidator {

    private static final Logger log = LoggerFactory.getLogger(PasswordPolicyValidator.class);

    /** Minimum password length — configurable via app.password.min-length */
    private final int minLength;
    private final int maxLength;

    private final boolean requireUppercase;
    private final boolean requireLowercase;
    private final boolean requireDigit;
    private final boolean requireSpecial;

    private static final String UPPERCASE_PATTERN = ".*[A-Z].*";
    private static final String LOWERCASE_PATTERN = ".*[a-z].*";
    private static final String DIGIT_PATTERN = ".*\\d.*";
    private static final String SPECIAL_CHAR_PATTERN = ".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*";

    /**
     * Constructor with Spring Boot config injection.
     */
    public PasswordPolicyValidator(
            @Value("${app.password.min-length:8}") int minLength,
            @Value("${app.password.max-length:128}") int maxLength,
            @Value("${app.password.require-uppercase:true}") boolean requireUppercase,
            @Value("${app.password.require-lowercase:true}") boolean requireLowercase,
            @Value("${app.password.require-digit:true}") boolean requireDigit,
            @Value("${app.password.require-special:false}") boolean requireSpecial) {
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.requireUppercase = requireUppercase;
        this.requireLowercase = requireLowercase;
        this.requireDigit = requireDigit;
        this.requireSpecial = requireSpecial;
        log.info("Password policy initialized: minLength={}, requireUpper={}, requireLower={}, requireDigit={}, requireSpecial={}",
                minLength, requireUppercase, requireLowercase, requireDigit, requireSpecial);
    }

    /**
     * Validates the given password against the configured policy.
     *
     * @param password password to validate
     * @throws ValidationException if the password does not meet the policy
     */
    public void validate(String password) {
        if (password == null || password.isEmpty()) {
            throw new ValidationException("Mat khau khong duoc de trong");
        }

        if (password.length() < minLength) {
            throw new ValidationException("Mat khau phai co it nhat " + minLength + " ky tu",
                    "Length: " + password.length() + "/" + minLength);
        }

        if (password.length() > maxLength) {
            throw new ValidationException("Mat khau toi da " + maxLength + " ky tu",
                    "Length: " + password.length() + "/" + maxLength);
        }

        if (requireUppercase && !password.matches(UPPERCASE_PATTERN)) {
            throw new ValidationException("Mat khau phai chua it nhat mot chu hoa (A-Z)");
        }

        if (requireLowercase && !password.matches(LOWERCASE_PATTERN)) {
            throw new ValidationException("Mat khau phai chua it nhat mot chu thuong (a-z)");
        }

        if (requireDigit && !password.matches(DIGIT_PATTERN)) {
            throw new ValidationException("Mat khau phai chua it nhat mot so (0-9)");
        }

        if (requireSpecial && !password.matches(SPECIAL_CHAR_PATTERN)) {
            throw new ValidationException("Mat khau phai chua it nhat mot ky tu dac biet (!@#$%^&*...)");
        }

        log.debug("Password policy validation passed for length={}", password.length());
    }

    /**
     * Relaxed policy for admin-initiated password reset.
     * Only requires >= 8 chars, at least one letter and one digit.
     * No special char or case requirements.
     *
     * @param password password to validate
     * @throws ValidationException if the password does not meet the relaxed policy
     */
    public void validateResetPassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new ValidationException("Mat khau khong duoc de trong");
        }
        if (password.length() < 8) {
            throw new ValidationException("Mat khau phai co it nhat 8 ky tu");
        }
        if (password.length() > 128) {
            throw new ValidationException("Mat khau toi da 128 ky tu");
        }
        // Must contain at least one letter
        if (!password.matches(".*[a-zA-Z].*")) {
            throw new ValidationException("Mat khau phai chua it nhat mot chu cai");
        }
        // Must contain at least one digit
        if (!password.matches(".*\\d.*")) {
            throw new ValidationException("Mat khau phai chua it nhat mot so");
        }
    }

    /** Returns the minimum password length. */
    public int getMinLength() {
        return minLength;
    }

    /** Returns the maximum password length. */
    public int getMaxLength() {
        return maxLength;
    }

    /** Returns whether uppercase is required. */
    public boolean isRequireUppercase() {
        return requireUppercase;
    }

    /** Returns whether special characters are required. */
    public boolean isRequireSpecial() {
        return requireSpecial;
    }
}
