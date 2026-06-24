package com.hanghai.kchtg.security.totp.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;
import java.util.HexFormat;

/**
 * PBKDF2-SHA256 hasher for TOTP secrets.
 * <p>
 * The raw TOTP secret is hashed with a salt before storage so that a database
 * breach alone does not reveal the secret.  Output format: {@code
 * "<salt_hex>:<hash_hex>"}.
 * </p>
 */
public final class TotpSecretHasher {

    private static final Logger log = LoggerFactory.getLogger(TotpSecretHasher.class);

    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int ITERATIONS = 100_000;
    private static final int KEY_LENGTH_BITS = 256;
    private static final int SALT_BYTES = 16;

    private final SecureRandom secureRandom;

    public TotpSecretHasher() {
        this(new SecureRandom());
    }

    TotpSecretHasher(SecureRandom secureRandom) {
        this.secureRandom = secureRandom;
    }

    /**
     * Hashes a raw Base32-encoded TOTP secret.
     *
     * @param rawSecret the raw Base32 secret string
     * @return "{@code salt_hex:hash_hex}"
     */
    public String hash(String rawSecret) {
        byte[] salt = new byte[SALT_BYTES];
        secureRandom.nextBytes(salt);

        KeySpec spec = new PBEKeySpec(
                rawSecret.toCharArray(),
                salt,
                ITERATIONS,
                KEY_LENGTH_BITS
        );

        try {
            KeyGenerator dummy = KeyGenerator.getInstance("AES"); // no-op, just to trigger imports if needed
            SecretKey generatedKey = generateKey(spec);
            String saltHex = HexFormat.of().formatHex(salt);
            String hashHex = HexFormat.of().formatHex(generatedKey.getEncoded());
            log.debug("TOTP secret hashed ({} iterations, {}-byte salt)", ITERATIONS, SALT_BYTES);
            return saltHex + ":" + hashHex;
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash TOTP secret", e);
        }
    }

    /**
     * Verifies a raw secret against a stored hash.
     *
     * @param rawSecret the raw Base32 secret to verify
     * @param storedHash the stored "{@code salt_hex:hash_hex}" string
     * @return {@code true} if the secret matches
     */
    public boolean verify(String rawSecret, String storedHash) {
        if (storedHash == null || storedHash.isEmpty()) {
            log.warn("Stored hash is null or empty");
            return false;
        }
        String[] parts = storedHash.split(":", 2);
        if (parts.length != 2) {
            log.warn("Invalid stored hash format (expected salt:hash)");
            return false;
        }

        byte[] salt = HexFormat.of().parseHex(parts[0]);
        KeySpec spec = new PBEKeySpec(rawSecret.toCharArray(), salt, ITERATIONS, KEY_LENGTH_BITS);

        try {
            byte[] computedHash = generateKey(spec).getEncoded();
            byte[] expectedHash = HexFormat.of().parseHex(parts[1]);
            return ConstantTimeComparer.equals(computedHash, expectedHash);
        } catch (Exception e) {
            log.error("Failed to verify TOTP secret", e);
            return false;
        }
    }

    private SecretKey generateKey(KeySpec spec) throws Exception {
        var factory = javax.crypto.SecretKeyFactory.getInstance(ALGORITHM);
        byte[] keyBytes = factory.generateSecret(spec).getEncoded();
        return new javax.crypto.spec.SecretKeySpec(keyBytes, "PBKDF2");
    }
}