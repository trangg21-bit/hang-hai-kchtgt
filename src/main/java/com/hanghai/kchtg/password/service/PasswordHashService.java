package com.hanghai.kchtg.password.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Password hashing service - BCrypt wrapper (F-276).
 * Thin abstraction around BCryptPasswordEncoder for future argon2 migration.
 */
@Service
public class PasswordHashService {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /**
     * Hash a plain-text password.
     */
    public String hash(String password) {
        return encoder.encode(password);
    }

    /**
     * Verify a plain-text password against a stored hash.
     */
    public boolean verify(String password, String storedHash) {
        return encoder.matches(password, storedHash);
    }
}