package com.hanghai.kchtg.password.service;

import com.hanghai.kchtg.password.entity.PasswordPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ComplexityValidator.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ComplexityValidatorTest {

    private ComplexityValidator validator;
    private PasswordPolicy defaultPolicy;

    @BeforeEach
    void setUp() {
        validator = new ComplexityValidator();
        defaultPolicy = new PasswordPolicy();
        defaultPolicy.setMinLength(12);
        defaultPolicy.setRequireUppercase(true);
        defaultPolicy.setRequireLowercase(true);
        defaultPolicy.setRequireDigit(true);
        defaultPolicy.setRequireSpecialChar(true);
    }

    // =========================================================================
    // // a a null / empty a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
    // =========================================================================

    @Test
    void validate_nullPassword_returnsOneViolation() {
        List<String> violations = validator.validate(null, defaultPolicy);
        assertEquals(1, violations.size());
    }

    @Test
    void validate_emptyPassword_returnsOneViolation() {
        List<String> violations = validator.validate("", defaultPolicy);
        assertEquals(1, violations.size());
    }

    // =========================================================================
    // // a a absolute minimum (8) a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
    // =========================================================================

    @Test
    void validate_7chars_triggersAbsoluteMinViolation() {
        String pw = "Ab1!xxx"; // 7 chars
        List<String> v = validator.validate(pw, defaultPolicy);
        assertTrue(v.stream().anyMatch(vi -> vi.contains("8")));
    }

    @Test
    void validate_8chars_noAbsoluteMinViolation() {
        String pw = "Ab1!xxxx"; // 8 chars exactly
        List<String> v = validator.validate(pw, defaultPolicy);
        assertFalse(v.stream().anyMatch(vi -> vi.contains("8")));
    }

    // =========================================================================
    // // a a policy minimum a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
    // =========================================================================

    @Test
    void validate_belowMinLength_triggersViolation() {
        defaultPolicy.setMinLength(16);
        String pw = "Ab1!xxxxxxXXXX"; // 14 chars
        List<String> v = validator.validate(pw, defaultPolicy);
        assertTrue(v.stream().anyMatch(vi -> vi.contains("16")));
    }

    @Test
    void validate_meetsMinLength_noViolation() {
        defaultPolicy.setMinLength(16);
        String pw = "Ab1!xxxxxxXXXXxx"; // 16 chars
        List<String> v = validator.validate(pw, defaultPolicy);
        assertFalse(v.stream().anyMatch(vi -> vi.contains("16")));
    }

    // =========================================================================
    // // a a uppercase a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
    // =========================================================================

    @Test
    void validate_noUppercase_whenRequired_returnsViolation() {
        String pw = "abcdefgh1!xxxx";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertTrue(v.stream().anyMatch(vi -> vi.contains("A-Z")));
    }

    @Test
    void validate_withUppercase_whenRequired_noViolation() {
        String pw = "Abcdefgh1!xxxx";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertFalse(v.stream().anyMatch(vi -> vi.contains("A-Z")));
    }

    @Test
    void validate_noUppercase_whenNotRequired_noViolation() {
        defaultPolicy.setRequireUppercase(false);
        String pw = "abcdefgh1!xxxx";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertFalse(v.stream().anyMatch(vi -> vi.contains("A-Z")));
    }

    // =========================================================================
    // // a a lowercase a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
    // =========================================================================

    @Test
    void validate_noLowercase_whenRequired_returnsViolation() {
        String pw = "ABCDEFGH1!XXXX";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertTrue(v.stream().anyMatch(vi -> vi.contains("a-z")));
    }

    @Test
    void validate_withLowercase_whenRequired_noViolation() {
        String pw = "abcdefgh1!XXXX";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertFalse(v.stream().anyMatch(vi -> vi.contains("a-z")));
    }

    @Test
    void validate_noLowercase_whenNotRequired_noViolation() {
        defaultPolicy.setRequireLowercase(false);
        String pw = "ABCDEFGH1!XXXX";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertFalse(v.stream().anyMatch(vi -> vi.contains("a-z")));
    }

    // =========================================================================
    // // a a digit a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
    // =========================================================================

    @Test
    void validate_noDigit_whenRequired_returnsViolation() {
        String pw = "Abcdefgh!xxxxx";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertTrue(v.stream().anyMatch(vi -> vi.contains("0-9")));
    }

    @Test
    void validate_withDigit_whenRequired_noViolation() {
        String pw = "Abcdefgh1xxxxx!";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertFalse(v.stream().anyMatch(vi -> vi.contains("0-9")));
    }

    @Test
    void validate_noDigit_whenNotRequired_noViolation() {
        defaultPolicy.setRequireDigit(false);
        String pw = "Abcdefgh!xxxxx";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertFalse(v.stream().anyMatch(vi -> vi.contains("0-9")));
    }

    // =========================================================================
    // // a a special char a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
    // =========================================================================

    @Test
    void validate_noSpecialChar_whenRequired_returnsViolation() {
        String pw = "Abcdefgh1xxxxx";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertTrue(v.stream().anyMatch(vi -> vi.contains("ký tự đặc biệt")));
    }

    @Test
    void validate_withSpecialChar_whenRequired_noViolation() {
        String pw = "Abcdefgh1!xxxxx";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertFalse(v.stream().anyMatch(vi -> vi.contains("ký tự đặc biệt")));
    }

    @Test
    void validate_noSpecialChar_whenNotRequired_noViolation() {
        defaultPolicy.setRequireSpecialChar(false);
        String pw = "Abcdefgh1xxxxx";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertFalse(v.stream().anyMatch(vi -> vi.contains("ký tự đặc biệt")));
    }

    // =========================================================================
    // // a a combined valid password a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
    // =========================================================================

    @Test
    void validate_validPassword_noViolations() {
        String pw = "SecureP@ss1234";
        List<String> v = validator.validate(pw, defaultPolicy);
        assertTrue(v.isEmpty());
    }

    @Test
    void validate_allRulesDisabled_anyPasswordPasses() {
        defaultPolicy.setMinLength(1);
        defaultPolicy.setRequireUppercase(false);
        defaultPolicy.setRequireLowercase(false);
        defaultPolicy.setRequireDigit(false);
        defaultPolicy.setRequireSpecialChar(false);
        List<String> v = validator.validate("abcdefgh", defaultPolicy);
        assertTrue(v.isEmpty());
    }

    // =========================================================================
    // // a a multiple violations a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
    // =========================================================================

    @Test
    void validate_weakPassword_collectsAllViolations() {
        String pw = "weak";
        List<String> v = validator.validate(pw, defaultPolicy);
        // 1. absolute min 8, 2. policy min 12, 3. uppercase, 4. lowercase (has none),
        //    5. digit (has none), 6. special char (has none)
        // "weak" = 4 chars, no uppercase, no digit, no special char. lowercase OK.
        assertTrue(v.size() >= 4, "Should have at least 4 violations but had: " + v);
    }

    @Test
    void validate_noLowercase_noDigit_noSpecial_collectsAll() {
        String pw = "ABCDEFGH1234";
        defaultPolicy.setRequireLowercase(true);
        List<String> v = validator.validate(pw, defaultPolicy);
        assertTrue(v.stream().anyMatch(vi -> vi.contains("a-z")), "Should miss lowercase");
        assertFalse(v.stream().anyMatch(vi -> vi.contains("0-9")), "Should have digit");
        assertTrue(v.stream().anyMatch(vi -> vi.contains("ký tự đặc biệt")), "Should miss special char");
    }

    // =========================================================================
    // // a a isValid convenience a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
    // =========================================================================

    @Test
    void isValid_validPassword_returnsTrue() {
        assertTrue(validator.isValid("SecureP@ss1234", defaultPolicy));
    }

    @Test
    void isValid_invalidPassword_returnsFalse() {
        assertFalse(validator.isValid("weak", defaultPolicy));
    }

    @Test
    void isValid_nullPassword_returnsFalse() {
        assertFalse(validator.isValid(null, defaultPolicy));
    }

    // =========================================================================
    // // a a various special characters a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a
    // =========================================================================

    @Test
    void validate_specialChar_variousValidSpecialChars() {
        String[] validSpecial = {"!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "-", "="};
        for (String ch : validSpecial) {
            String pw = "Abcdefgh1" + ch + "xxxx";
            if (pw.length() >= 12) {
                List<String> v = validator.validate(pw, defaultPolicy);
                assertFalse(v.stream().anyMatch(vi -> vi.contains("ký tự đặc biệt")),
                        "Special char '" + ch + "' should be valid");
            }
        }
    }
}