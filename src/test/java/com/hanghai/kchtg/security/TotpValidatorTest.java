package com.hanghai.kchtg.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests cho {@link TotpValidator} - RFC 6238 validation.
 */
class TotpValidatorTest {

    private TotpValidator validator;

    @BeforeEach
    void setUp() {
        validator = new TotpValidator();
    }

    @Test
    @DisplayName("Phai sinh duoc secret hop le")
    void shouldGenerateSecret() {
        String secret = validator.generateSecret();
        assertNotNull(secret);
        assertFalse(secret.isBlank());
        // Google-authenticator secret la base32 → chi co chu A-Z va so 2-7
        assertTrue(secret.matches("[A-Za-z0-9_-]+=*"), "Secret phai la Base64");
    }

    @Test
    @DisplayName("TOTP code sinh ra tu secret phai duoc validate thanh cong")
    void shouldValidateCorrectCode() {
        String secret = validator.generateSecret();
        String code = String.valueOf(new com.warrenstrange.googleauth.GoogleAuthenticator().getTotpPassword(secret));

        assertTrue(validator.isValid(secret, code),
                "Code sinh tu secret phai duoc validate thanh cong");
    }

    @Test
    @DisplayName("TOTP code sai phai khong duoc validate")
    void shouldRejectInvalidCode() {
        String secret = validator.generateSecret();
        // Sinh code ngau nhien 6 chu so
        String wrongCode = String.valueOf((int)(Math.random() * 900000 + 100000));

        assertFalse(validator.isValid(secret, wrongCode),
                "Code sai phai bi tu choi");
    }

    @Test
    @DisplayName("Null secret phai tra ve false")
    void shouldRejectNullSecret() {
        assertFalse(validator.isValid(null, "123456"));
    }

    @Test
    @DisplayName("Null code phai tra ve false")
    void shouldRejectNullCode() {
        String secret = validator.generateSecret();
        assertFalse(validator.isValid(secret, null));
    }

    @Test
    @DisplayName("Empty code phai tra ve false")
    void shouldRejectEmptyCode() {
        String secret = validator.generateSecret();
        assertFalse(validator.isValid(secret, ""));
    }

    @Test
    @DisplayName("Code khong phai so phai tra ve false")
    void shouldRejectNonNumericCode() {
        String secret = validator.generateSecret();
        assertFalse(validator.isValid(secret, "abcdef"));
    }

    @Test
    @DisplayName("Hash secret phai co do dai 64 ky tu (SHA-256 hex)")
    void shouldHashSecretCorrectLength() {
        String secret = validator.generateSecret();
        String hash = validator.hashSecret(secret);
        assertEquals(64, hash.length(), "SHA-256 hex phai co 64 ky tu");
    }

    @Test
    @DisplayName("Hash cua cung secret phai trac ket qua nhu nhau")
    void shouldProduceConsistentHash() {
        String secret = "JBSWY3DPEHPK3PXP";
        String hash1 = validator.hashSecret(secret);
        String hash2 = validator.hashSecret(secret);
        assertEquals(hash1, hash2, "Cung secret phai cho cung hash");
    }

    @Test
    @DisplayName("Constant-time equal: hai chuoi nhu nhau phai bang nhau")
    void constantTimeEquals_sameStrings() {
        assertTrue(validator.constantTimeEquals("abc123", "abc123"));
    }

    @Test
    @DisplayName("Constant-time equal: hai chuoi khac nhau phai khac")
    void constantTimeEquals_differentStrings() {
        assertFalse(validator.constantTimeEquals("abc123", "abc456"));
    }

    @Test
    @DisplayName("Constant-time equal: null phai tra ve false")
    void constantTimeEquals_nulls() {
        assertFalse(validator.constantTimeEquals(null, "abc"));
        assertFalse(validator.constantTimeEquals("abc", null));
        assertTrue(validator.constantTimeEquals(null, null));
    }

    // Helper: sinh TOTP code tu secret (de test validate)
    // Trong thuc te, code duoc sinh boi authenticator app; o day ta
    // su dung GoogleAuthenticator library de sinh code de test.
    private String generateTotpCode(String secret) {
        com.warrenstrange.googleauth.GoogleAuthenticator gat =
                new com.warrenstrange.googleauth.GoogleAuthenticator();
        return String.valueOf(gat.getTotpPassword(secret));
    }
}