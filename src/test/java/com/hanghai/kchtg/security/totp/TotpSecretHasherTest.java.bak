package com.hanghai.kchtg.security.totp;

import com.hanghai.kchtg.security.totp.util.TotpSecretHasher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link TotpSecretHasher}.
 */
class TotpSecretHasherTest {

    private final TotpSecretHasher hasher = new TotpSecretHasher();

    @Test
    @DisplayName("hash produces salt:hash format")
    void testHashFormat() {
        String hash = hasher.hash("JBSWY3DPEHPK3PXP");
        assertNotNull(hash);
        assertAll("Hash format",
                () -> assertTrue(hash.contains(":"), "Hash must contain separator"),
                () -> assertEquals(2, hash.split(":", -1).length, "Hash must have exactly 2 parts"),
                () -> assertEquals(32, hash.split(":", 2)[0].length(), "Salt must be 16 bytes hex = 32 chars"),
                () -> assertEquals(64, hash.split(":", 2)[1].length(), "Hash must be 32 bytes hex = 64 chars")
        );
    }

    @Test
    @DisplayName("hash of same secret produces different salt each time")
    void testHashUniqueSalt() {
        String hash1 = hasher.hash("JBSWY3DPEHPK3PXP");
        String hash2 = hasher.hash("JBSWY3DPEHPK3PXP");
        assertNotEquals(hash1, hash2, "Hashes must differ due to unique salt");
        // But the salt portions must differ
        assertNotEquals(hash1.split(":")[0], hash2.split(":")[0]);
    }

    @Test
    @DisplayName("verify returns true for correct secret")
    void testVerifyCorrectSecret() {
        String secret = "JBSWY3DPEHPK3PXP";
        String hash = hasher.hash(secret);
        assertTrue(hasher.verify(secret, hash), "Correct secret should verify");
    }

    @Test
    @DisplayName("verify returns false for wrong secret")
    void testVerifyWrongSecret() {
        String correct = "JBSWY3DPEHPK3PXP";
        String wrong = "GEZDGNBVGY3TQOJQ";
        String hash = hasher.hash(correct);
        assertFalse(hasher.verify(wrong, hash), "Wrong secret should not verify");
    }

    @Test
    @DisplayName("verify returns false for null hash")
    void testVerifyNullHash() {
        assertFalse(hasher.verify("JBSWY3DPEHPK3PXP", null));
    }

    @Test
    @DisplayName("verify returns false for empty hash")
    void testVerifyEmptyHash() {
        assertFalse(hasher.verify("JBSWY3DPEHPK3PXP", ""));
    }

    @Test
    @DisplayName("verify returns false for malformed hash")
    void testVerifyMalformedHash() {
        assertFalse(hasher.verify("JBSWY3DPEHPK3PXP", "not-a-valid-hash"));
    }
}