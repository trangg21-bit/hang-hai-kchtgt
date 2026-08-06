package com.hanghai.kchtg.password.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;

class LegacyPasswordMigrationTest {

    private PasswordHashService passwordHashService;

    @BeforeEach
    void setUp() {
        passwordHashService = new PasswordHashService();
    }

    @Test
    @DisplayName("isBcrypt should accurately identify BCrypt hashes")
    void isBcrypt_shouldIdentifyBcryptHashes() {
        String bcryptHash = passwordHashService.hash("SecretPassword123!");
        assertTrue(passwordHashService.isBcrypt(bcryptHash));
        assertFalse(passwordHashService.isBcrypt("5f4dcc3b5aa765d61d8327deb882cf99")); // MD5
        assertFalse(passwordHashService.isBcrypt("plainTextPassword"));
        assertFalse(passwordHashService.isBcrypt(null));
    }

    @Test
    @DisplayName("verify should work with standard BCrypt hashes")
    void verify_shouldVerifyBcryptHashes() {
        String rawPass = "MySecurePass123";
        String hash = passwordHashService.hash(rawPass);

        assertTrue(passwordHashService.verify(rawPass, hash));
        assertFalse(passwordHashService.verify("WrongPass", hash));
    }

    @Test
    @DisplayName("verifyLegacy should verify MD5 hex hashes with username salt")
    void verifyLegacy_shouldVerifyMd5WithUsernameSalt() throws Exception {
        String username = "admin";
        String rawPass = "admin123";

        // Compute MD5(username.toLowerCase() + rawPass)
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest((username.toLowerCase() + rawPass).getBytes(StandardCharsets.UTF_8));
        String legacyMd5Hash = HexFormat.of().formatHex(digest);

        assertTrue(passwordHashService.verify(username, rawPass, legacyMd5Hash));
        assertFalse(passwordHashService.verify(username, "wrongPassword", legacyMd5Hash));
        assertFalse(passwordHashService.isBcrypt(legacyMd5Hash));
    }

    @Test
    @DisplayName("verifyLegacy should verify plain MD5 hex hashes without username salt")
    void verifyLegacy_shouldVerifyPlainMd5() throws Exception {
        String rawPass = "password123";

        // Compute MD5(rawPass)
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest(rawPass.getBytes(StandardCharsets.UTF_8));
        String legacyPlainMd5 = HexFormat.of().formatHex(digest);

        assertTrue(passwordHashService.verify(null, rawPass, legacyPlainMd5));
        assertTrue(passwordHashService.verify("anyuser", rawPass, legacyPlainMd5));
        assertFalse(passwordHashService.verify("anyuser", "wrong", legacyPlainMd5));
    }

    @Test
    @DisplayName("verifyLegacy should verify SHA-256 hex hashes")
    void verifyLegacy_shouldVerifySha256() throws Exception {
        String username = "user1";
        String rawPass = "Pass@2026";

        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest((username + rawPass).getBytes(StandardCharsets.UTF_8));
        String legacySha256 = HexFormat.of().formatHex(digest);

        assertTrue(passwordHashService.verify(username, rawPass, legacySha256));
        assertFalse(passwordHashService.verify(username, "wrong", legacySha256));
    }
}
