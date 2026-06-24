package com.hanghai.kchtg.password.dto;

import java.util.UUID;

/**
 * Response DTO for password-policy endpoint (F-276).
 */
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

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public int getMinLength() { return minLength; }
    public void setMinLength(int minLength) { this.minLength = minLength; }
    public boolean isRequireUppercase() { return requireUppercase; }
    public void setRequireUppercase(boolean requireUppercase) { this.requireUppercase = requireUppercase; }
    public boolean isRequireLowercase() { return requireLowercase; }
    public void setRequireLowercase(boolean requireLowercase) { this.requireLowercase = requireLowercase; }
    public boolean isRequireDigit() { return requireDigit; }
    public void setRequireDigit(boolean requireDigit) { this.requireDigit = requireDigit; }
    public boolean isRequireSpecialChar() { return requireSpecialChar; }
    public void setRequireSpecialChar(boolean requireSpecialChar) { this.requireSpecialChar = requireSpecialChar; }
    public String getSpecialCharSet() { return specialCharSet; }
    public void setSpecialCharSet(String specialCharSet) { this.specialCharSet = specialCharSet; }
    public int getMaxAgeDays() { return maxAgeDays; }
    public void setMaxAgeDays(int maxAgeDays) { this.maxAgeDays = maxAgeDays; }
    public int getHistoryDepth() { return historyDepth; }
    public void setHistoryDepth(int historyDepth) { this.historyDepth = historyDepth; }
    public boolean isBlockUsernameInPassword() { return blockUsernameInPassword; }
    public void setBlockUsernameInPassword(boolean blockUsernameInPassword) { this.blockUsernameInPassword = blockUsernameInPassword; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}