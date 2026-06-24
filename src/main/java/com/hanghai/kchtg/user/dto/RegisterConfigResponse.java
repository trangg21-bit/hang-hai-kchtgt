package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO returned by GET /api/auth/register/config - contains registration settings and RSA public key.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterConfigResponse {

    private PasswordPolicy passwordPolicy;
    private boolean rsaEncryptionEnabled;
    private String rsaPublicKey;
    private RateLimitConfig rateLimit;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasswordPolicy {
        private int minLength;
        private int maxLength;
        private boolean requireUppercase;
        private boolean requireLowercase;
        private boolean requireDigit;
        private boolean requireSpecialChar;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RateLimitConfig {
        private int maxRequests;
        private int windowMinutes;
    }
}