package com.hanghai.kchtg.password.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for PasswordHashService  BCrypt hash and verify.
 *
 * Tests:
 *  - hash() returns a valid BCrypt string ($2a$ prefix)
 *  - hash() produces different salts for same input
 *  - verify() true for matching password
 *  - verify() false for wrong password
 *  - verify() false for empty/invalid hash
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PasswordHashServiceTest {

    private PasswordHashService hashService;

    @BeforeEach
    void setUp() {
        hashService = new PasswordHashService();
    }

    @Test
    void hash_returnsValidBCryptFormat() {
        String hash = hashService.hash("MyP@ssw0rd");
        assertNotNull(hash);
        assertTrue(hash.startsWith("$2a$"), "BCrypt hash should start with $2a$");
        assertTrue(hash.length() > 50, "BCrypt hash should be 60 chars (salt + hash)");
    }

    @Test
    void hash_differentCalls_produceDifferentHashes() {
        String hash1 = hashService.hash("SamePassword");
        String hash2 = hashService.hash("SamePassword");
        assertNotEquals(hash1, hash2, "BCrypt with random salt should produce different hashes for same input");
    }

    @Test
    void hash_emptyPassword_validHash() {
        // BCrypt can hash empty strings  should not throw
        String hash = hashService.hash("");
        assertNotNull(hash);
        assertTrue(hash.startsWith("$2a$"));
    }

    @Test
    void hash_longPassword_validHash() {
        String longPassword = "A".repeat(1000) + "!@#";
        String hash = hashService.hash(longPassword);
        assertNotNull(hash);
        assertTrue(hash.startsWith("$2a$"));
    }

    @Test
    void verify_correctPassword_returnsTrue() {
        String plain = "SecureP@ss1234";
        String hash = hashService.hash(plain);
        assertTrue(hashService.verify(plain, hash));
    }

    @Test
    void verify_wrongPassword_returnsFalse() {
        String hash = hashService.hash("CorrectPassword1!");
        assertFalse(hashService.verify("WrongPassword1!", hash));
    }

    @Test
    void verify_emptyPasswordAgainstHash_returnsFalse() {
        String hash = hashService.hash("SomePassword1!");
        assertFalse(hashService.verify("", hash));
    }

    @Test
    void verify_nullHash_returnsFalse() {
        assertFalse(hashService.verify("anyPassword", null));
    }

    @Test
    void verify_emptyHash_returnsFalse() {
        assertFalse(hashService.verify("anyPassword", ""));
    }

    @Test
    void verify_invalidBCryptFormat_returnsFalse() {
        // A string that doesn't look like BCrypt
        assertFalse(hashService.verify("SomePassword", "not-a-real-hash"));
    }

    @Test
    void verify_unicodePassword_validHash() {
        String unicodePw = "Mật khẩu 123!";
        String hash = hashService.hash(unicodePw);
        assertTrue(hashService.verify(unicodePw, hash));
    }

    @Test
    void hash_verify_roundTrip_manyPasswords() {
        String[] passwords = {
            "A1a!",
            "LongerPassword123!@#",
            "very/long&password(123)!@#$%^&*()",
            "",
            "UnicodeMậtKhẩu123!@"
        };
        for (String pw : passwords) {
            String hash = hashService.hash(pw);
            assertTrue(hashService.verify(pw, hash), "Round-trip failed for password: " + pw);
        }
    }
}