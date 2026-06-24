package com.hanghai.kchtg.password.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Request body for PUT /api/admin/password-policy (partial update).
 */
public class PasswordPolicyUpdateRequest {

    @Min(value = 8, message = "Độ dài tối thiểu phải từ 8")
    @Max(value = 64, message = "Độ dài tối thiểu tối đa 64")
    private Integer minLength;

    private Boolean requireUppercase;
    private Boolean requireLowercase;
    private Boolean requireDigit;
    private Boolean requireSpecialChar;
    private String specialCharSet;

    @Min(value = 1, message = "Chu kỳ tối thiểu phải từ 1")
    @Max(value = 365, message = "Chu kỳ tối đa 365 ngày")
    private Integer maxAgeDays;

    @Min(value = 0, message = "Chiều sâu lịch sử phải từ 0")
    @Max(value = 50, message = "Chiều sâu lịch sử tối đa 50")
    private Integer historyDepth;

    private Boolean blockUsernameInPassword;

    public Integer getMinLength() { return minLength; }
    public void setMinLength(Integer minLength) { this.minLength = minLength; }
    public Boolean getRequireUppercase() { return requireUppercase; }
    public void setRequireUppercase(Boolean requireUppercase) { this.requireUppercase = requireUppercase; }
    public Boolean getRequireLowercase() { return requireLowercase; }
    public void setRequireLowercase(Boolean requireLowercase) { this.requireLowercase = requireLowercase; }
    public Boolean getRequireDigit() { return requireDigit; }
    public void setRequireDigit(Boolean requireDigit) { this.requireDigit = requireDigit; }
    public Boolean getRequireSpecialChar() { return requireSpecialChar; }
    public void setRequireSpecialChar(Boolean requireSpecialChar) { this.requireSpecialChar = requireSpecialChar; }
    public String getSpecialCharSet() { return specialCharSet; }
    public void setSpecialCharSet(String specialCharSet) { this.specialCharSet = specialCharSet; }
    public Integer getMaxAgeDays() { return maxAgeDays; }
    public void setMaxAgeDays(Integer maxAgeDays) { this.maxAgeDays = maxAgeDays; }
    public Integer getHistoryDepth() { return historyDepth; }
    public void setHistoryDepth(Integer historyDepth) { this.historyDepth = historyDepth; }
    public Boolean getBlockUsernameInPassword() { return blockUsernameInPassword; }
    public void setBlockUsernameInPassword(Boolean blockUsernameInPassword) { this.blockUsernameInPassword = blockUsernameInPassword; }
}