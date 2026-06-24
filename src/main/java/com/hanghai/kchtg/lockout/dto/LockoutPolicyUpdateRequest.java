package com.hanghai.kchtg.lockout.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Request DTO for updating lockout policy (F-277).
 */
public class LockoutPolicyUpdateRequest {

    @Min(value = 1, message = "maxFailedAttempts must be between 1 and 20")
    @Max(value = 20, message = "maxFailedAttempts must be between 1 and 20")
    private int maxFailedAttempts;

    @Min(value = 5, message = "lockoutDurationMinutes must be between 5 and 1440")
    @Max(value = 1440, message = "lockoutDurationMinutes must be between 5 and 1440")
    private int lockoutDurationMinutes;

    @Min(value = 1, message = "windowMinutes must be between 1 and 60")
    @Max(value = 60, message = "windowMinutes must be between 1 and 60")
    private int windowMinutes;

    private boolean isEnabled;

    public int getMaxFailedAttempts() { return maxFailedAttempts; }
    public void setMaxFailedAttempts(int maxFailedAttempts) { this.maxFailedAttempts = maxFailedAttempts; }
    public int getLockoutDurationMinutes() { return lockoutDurationMinutes; }
    public void setLockoutDurationMinutes(int lockoutDurationMinutes) { this.lockoutDurationMinutes = lockoutDurationMinutes; }
    public int getWindowMinutes() { return windowMinutes; }
    public void setWindowMinutes(int windowMinutes) { this.windowMinutes = windowMinutes; }
    public boolean isEnabled() { return isEnabled; }
    public void setEnabled(boolean enabled) { isEnabled = enabled; }
}