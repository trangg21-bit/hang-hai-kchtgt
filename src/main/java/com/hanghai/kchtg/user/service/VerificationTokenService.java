package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.VerificationToken;
import com.hanghai.kchtg.user.repository.VerificationTokenRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for managing verification tokens.
 * <p>
 * Generates SHA-256 hashed tokens, stores them in the database with a 30-minute TTL,
 * and provides validation against the hashed value.
 * </p>
 */
@Service
public class VerificationTokenService {

    private static final Logger log = LoggerFactory.getLogger(VerificationTokenService.class);
    private static final long TOKEN_TTL_MINUTES = 30;

    private final VerificationTokenRepository tokenRepository;

    public VerificationTokenService(VerificationTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    /**
     * Generates a new verification token for the given user and email.
     *
     * @param userId   the user ID to verify
     * @param email    the email address
     * @param username display name for notification
     * @return the plain (plaintext) token to send to the user
     */
    @Transactional
    public String generateToken(UUID userId, String email, String username) {
        // Invalidate existing valid tokens for this user
        invalidateExistingTokens(userId, email);

        // Generate a random 32-byte token
        byte[] rawToken = new byte[32];
        java.security.SecureRandom secureRandom = new java.security.SecureRandom();
        secureRandom.nextBytes(rawToken);
        String plainToken = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(rawToken);

        // Hash the token with SHA-256
        String tokenHash = sha256(plainToken);

        // Create entity
        LocalDateTime now = LocalDateTime.now();
        VerificationToken entity = new VerificationToken();
        entity.setUserId(userId);
        entity.setEmail(email);
        entity.setTokenHash(tokenHash);
        entity.setExpiresAt(now.plusMinutes(TOKEN_TTL_MINUTES));
        entity.setUsed(false);

        tokenRepository.save(entity);

        log.info("Generated verification token for user={}, email={}", userId, email);
        return plainToken;
    }

    /**
     * Validates a verification token.
     *
     * @param plainToken the plaintext token from the user
     * @return true if valid and not expired/not used
     * @throws com.hanghai.kchtg.user.exception.VerificationException if token is invalid
     */
    @Transactional
    public boolean validateToken(String plainToken) {
        // Xác thực verification token.
        if (plainToken == null || plainToken.isBlank()) {
            throw new com.hanghai.kchtg.user.exception.VerificationException("Token không được để trống");
        }

        String requestedHash = sha256(plainToken);

        VerificationToken token = tokenRepository
                .findAll()
                .stream()
                .filter(t -> t.getTokenHash().equals(requestedHash))
                .filter(t -> !t.isUsed())
                .filter(t -> !t.isExpired())
                .findFirst()
                .orElse(null);

        if (token == null) {
            // Check if it was used or expired for a better error message
            throw new com.hanghai.kchtg.user.exception.VerificationException("Token không hợp lệ, đã hết hạn hoặc đã được sử dụng");
        }

        // Mark as used
        token.setUsed(true);
        tokenRepository.save(token);

        log.info("Token validated successfully for email={}", token.getEmail());
        return true;
    }

    /**
     * Finds a valid (unused, not expired) token by email.
     */
    @Transactional(readOnly = true)
    public VerificationToken findValidToken(String email) {
        return tokenRepository.findValidTokenByEmail(email, LocalDateTime.now()).orElse(null);
    }

    /**
     * Scheduled cleanup of expired tokens. Runs every hour.
     */
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public int cleanupExpiredTokens() {
        int deleted = tokenRepository.deleteExpiredTokens(LocalDateTime.now());
        if (deleted > 0) {
            log.info("Cleaned up {} expired verification tokens", deleted);
        }
        return deleted;
    }

    private void invalidateExistingTokens(UUID userId, String email) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.util.List<VerificationToken> validTokens =
                tokenRepository.findValidTokensByUserId(userId, now);
        for (VerificationToken token : validTokens) {
            token.setUsed(true);
        }
        if (!validTokens.isEmpty()) {
            tokenRepository.saveAll(validTokens);
            log.info("Invalidated {} existing tokens for user={}", validTokens.size(), userId);
        }
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}