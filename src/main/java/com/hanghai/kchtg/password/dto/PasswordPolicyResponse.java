package com.hanghai.kchtg.password.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Response DTO for password-policy endpoint (F-276).
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class PasswordPolicyResponse {

    private UUID id;
    private int minLength;
    private boolean requireUppercase;
    private boolean requireLowercase;
    private boolean requireDigit;
    private boolean requireSpecialChar;
    private String specialCharSet;
    private int maxAgeDays;
    private int historyDepth;
    private boolean blockUsernameInPassword;
    private String createdAt;
    private String updatedAt;
}
