package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.exception.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Validates passwords against the registration password policy.
 * <p>
 * Uses hardcoded defaults (since F-276 policy config entity does not exist yet):
 * <ul>
 *   <li>Minimum length: 12</li>
 *   <li>At least one uppercase letter</li>
 *   <li>At least one lowercase letter</li>
 *   <li>At least one digit</li>
 *   <li>At least one special character</li>
 * </ul>
 * </p>
 */
@Component
public class PasswordPolicyValidator {

    private static final Logger log = LoggerFactory.getLogger(PasswordPolicyValidator.class);

    // Hardcoded password policy defaults
    static final int MIN_LENGTH = 12;
    static final int MAX_LENGTH = 128;

    private static final String UPPERCASE_PATTERN = ".*[A-Z].*";
    private static final String LOWERCASE_PATTERN = ".*[a-z].*";
    private static final String DIGIT_PATTERN = ".*\\d.*";
    private static final String SPECIAL_CHAR_PATTERN = ".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*";

    /**
     * Validates the given password against the policy.
     *
     * @param password password to validate
     * @throws ValidationException if the password does not meet the policy
     */
    public void validate(String password) {
        if (password == null || password.isEmpty()) {
            throw new ValidationException("Mật khẩu không được để trống");
        }

        if (password.length() < MIN_LENGTH) {
            throw new ValidationException("Mật khẩu phải có ít nhất " + MIN_LENGTH + " ký tự",
                    "Length: " + password.length() + "/" + MIN_LENGTH);
        }

        if (password.length() > MAX_LENGTH) {
            throw new ValidationException("Mật khẩu tối đa " + MAX_LENGTH + " ký tự",
                    "Length: " + password.length() + "/" + MAX_LENGTH);
        }

        if (!password.matches(UPPERCASE_PATTERN)) {
            throw new ValidationException("Mật khẩu phải chứa ít nhất một chữ hoa (A-Z)");
        }

        if (!password.matches(LOWERCASE_PATTERN)) {
            throw new ValidationException("Mật khẩu phải chứa ít nhất một chữ thường (a-z)");
        }

        if (!password.matches(DIGIT_PATTERN)) {
            throw new ValidationException("Mật khẩu phải chứa ít nhất một số (0-9)");
        }

        if (!password.matches(SPECIAL_CHAR_PATTERN)) {
            throw new ValidationException("Mật khẩu phải chứa ít nhất một ký tự đặc biệt (!@#$%^&*...)");
        }

        log.debug("Password policy validation passed for length={}", password.length());
    }

    /**
     * Returns the minimum password length.
     */
    public int getMinLength() {
        return MIN_LENGTH;
    }

    /**
     * Returns the maximum password length.
     */
    public int getMaxLength() {
        return MAX_LENGTH;
    }
}