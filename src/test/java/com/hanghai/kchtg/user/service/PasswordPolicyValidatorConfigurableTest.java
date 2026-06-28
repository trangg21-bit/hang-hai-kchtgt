package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.exception.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for PasswordPolicyValidator with configurable policy.
 * Tests BR-002: Password policy validation (8+ chars, upper+lower+digit).
 */
class PasswordPolicyValidatorConfigurableTest {

    private PasswordPolicyValidator validator;

    @BeforeEach
    void setUp() {
        // Simulate BA spec defaults: 8 chars, upper+lower+digit required, special NOT required
        validator = new PasswordPolicyValidator(8, 128, true, true, true, false);
    }

    @Test
    void validate_shouldPassWith8CharPasswordMeetingPolicy() {
        // 8 chars, has upper, lower, digit — should PASS (no special required)
        assertDoesNotThrow(() -> validator.validate("Pass1abc"));
    }

    @Test
    void validate_shouldPassWithLongerPasswordMeetingPolicy() {
        assertDoesNotThrow(() -> validator.validate("SecurePass1"));
    }

    @Test
    void validate_shouldRejectNull() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate(null));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("khong duoc de trong"));
    }

    @Test
    void validate_shouldRejectEmptyString() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate(""));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
    }

    @Test
    void validate_shouldRejectTooShort() {
        // 7 chars — below minimum of 8
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate("Pass1ab"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("8"));
    }

    @Test
    void validate_shouldRejectMissingUppercase() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate("pass1abc"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("chữ hoa"));
    }

    @Test
    void validate_shouldRejectMissingLowercase() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate("PASS1ABC"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("chữ thường"));
    }

    @Test
    void validate_shouldRejectMissingDigit() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate("PassAbc"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("số"));
    }

    @Test
    void validate_shouldPassWithSpecialCharWhenNotRequired() {
        // Special char present but NOT required — should still PASS
        assertDoesNotThrow(() -> validator.validate("Pass!1ab"));
    }

    @Test
    void validate_shouldRejectTooLong() {
        String longPassword = "Aa1" + "x".repeat(128);
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate(longPassword));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("128"));
    }

    @Test
    void getMinLength_shouldReturn8() {
        assertEquals(8, validator.getMinLength());
    }

    @Test
    void getMaxLength_shouldReturn128() {
        assertEquals(128, validator.getMaxLength());
    }

    @Test
    void isRequireUppercase_shouldReturnTrue() {
        assertTrue(validator.isRequireUppercase());
    }

    @Test
    void isRequireSpecial_shouldReturnFalse() {
        assertFalse(validator.isRequireSpecial());
    }

    @ParameterizedTest
    @ValueSource(strings = { "Pass1abc", "Test2xyz", "Aa1Bb2Cc" })
    void validate_shouldPassEdgeCaseExactly8Chars(String password) {
        assertDoesNotThrow(() -> validator.validate(password));
    }

    // =========================================================================
    //  Tests for admin reset password (relaxed policy)
    // =========================================================================

    @Test
    void validateResetPassword_shouldPassWith8CharLetterPlusDigit() {
        // Relaxed policy: only needs letter + digit, 8+ chars
        assertDoesNotThrow(() -> validator.validateResetPassword("Pass1234"));
    }

    @Test
    void validateResetPassword_shouldPassWithNoCaseRequirement() {
        // Relaxed: no upper/lower case requirement
        assertDoesNotThrow(() -> validator.validateResetPassword("pass1234"));
    }

    @Test
    void validateResetPassword_shouldPassWithNoSpecialChar() {
        // Relaxed: no special char required
        assertDoesNotThrow(() -> validator.validateResetPassword("Password1"));
    }

    @Test
    void validateResetPassword_shouldRejectTooShort() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validateResetPassword("Pass123"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("8"));
    }

    @Test
    void validateResetPassword_shouldRejectNoLetter() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validateResetPassword("12345678"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("chu cai"));
    }

    @Test
    void validateResetPassword_shouldRejectNoDigit() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validateResetPassword("abcdefgh"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("so"));
    }

    @Test
    void validateResetPassword_shouldRejectNull() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validateResetPassword(null));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
    }

    // =========================================================================
    //  Test special-char-required policy
    // =========================================================================

    @Test
    void validateWithSpecialRequired_shouldRejectMissingSpecial() {
        PasswordPolicyValidator specialValidator = new PasswordPolicyValidator(8, 128, true, true, true, true);
        ValidationException ex = assertThrows(ValidationException.class, () -> specialValidator.validate("Pass1abc"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("ký tự đặc biệt"));
    }

    @Test
    void validateWithSpecialRequired_shouldPassWithSpecial() {
        PasswordPolicyValidator specialValidator = new PasswordPolicyValidator(8, 128, true, true, true, true);
        assertDoesNotThrow(() -> specialValidator.validate("Pass1!ab"));
    }
}
