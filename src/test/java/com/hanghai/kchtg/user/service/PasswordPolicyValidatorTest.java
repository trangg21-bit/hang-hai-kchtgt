package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.exception.ValidationException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PasswordPolicyValidatorTest {

    private final PasswordPolicyValidator validator = new PasswordPolicyValidator(8, 128, true, true, true, true);

    @Test
    void validate_shouldPassForStrongPassword() {
        // Meets all requirements: 12+ chars, uppercase, lowercase, digit, special char
        assertDoesNotThrow(() -> validator.validate("StrongPass!123"));
    }

    @Test
    void validate_shouldRejectNull() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate(null));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
    }

    @Test
    void validate_shouldRejectEmptyString() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate(""));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
    }

    @Test
    void validate_shouldRejectTooShort() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate("Ab1!"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("8"));
    }

    @Test
    void validate_shouldRejectMissingUppercase() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate("strongpass!123"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("chữ hoa"));
    }

    @Test
    void validate_shouldRejectMissingLowercase() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate("STRONGPASS!123"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("chữ thường"));
    }

    @Test
    void validate_shouldRejectMissingDigit() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate("StrongPass!!!"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("số"));
    }

    @Test
    void validate_shouldRejectMissingSpecialChar() {
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate("StrongPass123"));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("ký tự đặc biệt"));
    }

    @Test
    void validate_shouldRejectTooLong() {
        String longPassword = "Aa1!" + "x".repeat(128);
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate(longPassword));
        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("128"));
    }

    @Test
    void validate_shouldPassEdgeCaseExactly8Chars() {
        assertDoesNotThrow(() -> validator.validate("Ab1!Xy9a"));
    }

    @Test
    void getMinLength_shouldReturn8() {
        assertEquals(8, validator.getMinLength());
    }

    @Test
    void getMaxLength_shouldReturn128() {
        assertEquals(128, validator.getMaxLength());
    }
}