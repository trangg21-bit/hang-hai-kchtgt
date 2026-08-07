package com.hanghai.kchtg.password.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Password hashing service - BCrypt wrapper with Legacy Hash Support (F-276).
 * Supports automatic detection of BCrypt and legacy MD5/SHA hashes for migrated accounts.
 */
@Service
public class PasswordHashService {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /**
     * Hash a plain-text password using BCrypt.
     */
    public String hash(String password) {
        return encoder.encode(password);
    }

    /**
     * Check if a stored hash is in BCrypt format ($2a$, $2b$, $2y$).
     */
    public boolean isBcrypt(String storedHash) {
        return storedHash != null && (storedHash.startsWith("$2a$") 
                || storedHash.startsWith("$2b$") 
                || storedHash.startsWith("$2y$"));
    }

    /**
     * Verify a plain-text password against a stored hash (BCrypt default).
     */
    public boolean verify(String password, String storedHash) {
        if (isBcrypt(storedHash)) {
            return encoder.matches(password, storedHash);
        }
        return verifyLegacy(null, password, storedHash);
    }

    /**
     * Verify a plain-text password against a stored hash with username context for legacy salt algorithms.
     */
    public boolean verify(String username, String password, String storedHash) {
        if (isBcrypt(storedHash)) {
            return encoder.matches(password, storedHash);
        }
        return verifyLegacy(username, password, storedHash);
    }

    /**
     * Verify legacy MD5 / SHA hashes from legacy system (SecurityEx format).
     */
    public boolean verifyLegacy(String username, String password, String storedHash) {
        if (storedHash == null || storedHash.isBlank() || password == null) {
            return false;
        }

        String targetHash = storedHash.trim();
        String u = username != null ? username.trim().toLowerCase() : "";

        // Try standard legacy hash combinations (MD5 & SHA-256 with/without username salt)
        String[] inputsToTest = new String[]{
                u + password,
                password,
                (username != null ? username.trim() : "") + password,
                u + ":" + password,
                password + ":" + u
        };

        for (String input : inputsToTest) {
            if (hashEquals("MD5", input, targetHash) || hashEquals("SHA-256", input, targetHash)) {
                return true;
            }
        }

        return false;
    }

    private boolean hashEquals(String algorithm, String input, String targetHash) {
        try {
            MessageDigest md = MessageDigest.getInstance(algorithm);
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            String hexLower = HexFormat.of().formatHex(digest);
            if (hexLower.equalsIgnoreCase(targetHash)) {
                return true;
            }
            String base64 = java.util.Base64.getEncoder().encodeToString(digest);
            if (base64.equals(targetHash)) {
                return true;
            }
        } catch (NoSuchAlgorithmException ignored) {
        }
        return false;
    }
}