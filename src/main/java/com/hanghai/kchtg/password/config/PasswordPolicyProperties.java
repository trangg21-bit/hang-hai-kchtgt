package com.hanghai.kchtg.password.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Externalized password policy configuration (F-276).
 * Falls back to hardcoded defaults if no DB row exists.
 */
@Configuration
@ConfigurationProperties(prefix = "app.password-policy")
public class PasswordPolicyProperties {

    private int minLength = 12;
    private boolean requireUppercase = true;
    private boolean requireLowercase = true;
    private boolean requireDigit = true;
    private boolean requireSpecialChar = true;
    private String specialCharSet = "!@#$%^&*()-_=+";
    private int maxAgeDays = 90;
    private int historyDepth = 5;
    private boolean blockUsernameInPassword = true;
    private int[] warningThresholds = {7, 3, 1};

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
    public int[] getWarningThresholds() { return warningThresholds; }
    public void setWarningThresholds(int[] warningThresholds) { this.warningThresholds = warningThresholds; }
}