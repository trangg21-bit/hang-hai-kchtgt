package com.hanghai.kchtg.password.service;

import com.hanghai.kchtg.password.entity.PasswordPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Validates password complexity against policy rules (F-276).
 * All violations are collected - no early return.
 */
@Component
public class ComplexityValidator {

    private static final Logger log = LoggerFactory.getLogger(ComplexityValidator.class);
    private static final int ABSOLUTE_MIN = 8;

    private static final Pattern UPPERCASE_PATTERN = Pattern.compile(".*[A-Z].*");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile(".*[a-z].*");
    private static final Pattern DIGIT_PATTERN = Pattern.compile(".*\\d.*");
    // Special char set from the policy
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*");

    /**
     * Validates a password against the given policy and returns all violations.
     *
     * @param password the password to validate
     * @param policy the active password policy
     * @return list of violation messages; empty if valid
     */
    public List<String> validate(String password, PasswordPolicy policy) {
        List<String> violations = new ArrayList<>();

        if (password == null || password.isEmpty()) {
            violations.add("Mật khẩu không được để trống");
            return violations;
        }

        // 1. Absolute minimum
        if (password.length() < ABSOLUTE_MIN) {
            violations.add("Mật khẩu quá ngắn (tối thiểu " + ABSOLUTE_MIN + " ký tự)");
        }

        // 2. Policy minimum
        if (password.length() < policy.getMinLength()) {
            violations.add("Mật khẩu phải có ít nhất " + policy.getMinLength() + " ký tự");
        }

        // 3. Uppercase
        if (policy.isRequireUppercase() && !UPPERCASE_PATTERN.matcher(password).matches()) {
            violations.add("Mật khẩu phải chứa ít nhất một chữ hoa (A-Z)");
        }

        // 4. Lowercase
        if (policy.isRequireLowercase() && !LOWERCASE_PATTERN.matcher(password).matches()) {
            violations.add("Mật khẩu phải chứa ít nhất một chữ thường (a-z)");
        }

        // 5. Digit
        if (policy.isRequireDigit() && !DIGIT_PATTERN.matcher(password).matches()) {
            violations.add("Mật khẩu phải chứa ít nhất một số (0-9)");
        }

        // 6. Special character
        if (policy.isRequireSpecialChar() && !SPECIAL_CHAR_PATTERN.matcher(password).matches()) {
            violations.add("Mật khẩu phải chứa ít nhất một ký tự đặc biệt");
        }

        // 7. Personal info (username) - skipped here since we do not have user context in Wave 1
        // This will be added in Wave 2 when we have user context

        log.debug("Password validation result: {} violations", violations.size());
        return violations;
    }

    /**
     * Quick check if password is valid.
     */
    public boolean isValid(String password, PasswordPolicy policy) {
        return validate(password, policy).isEmpty();
    }
}