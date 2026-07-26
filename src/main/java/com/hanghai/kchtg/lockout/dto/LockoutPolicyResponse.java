package com.hanghai.kchtg.lockout.dto;

import java.util.UUID;

/**
 * Response DTO for lockout policy endpoint (F-277).
 */
public class LockoutPolicyResponse {

    private UUID id;
    private int maxFailedAttempts;
    private int lockoutDurationMinutes;
    private int windowMinutes;
    private boolean isEnabled;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public int getMaxFailedAttempts() { return maxFailedAttempts; }
    public void setMaxFailedAttempts(int maxFailedAttempts) { this.maxFailedAttempts = maxFailedAttempts; }
    public int getLockoutDurationMinutes() { return lockoutDurationMinutes; }
    public void setLockoutDurationMinutes(int lockoutDurationMinutes) { this.lockoutDurationMinutes = lockoutDurationMinutes; }
    public int getWindowMinutes() { return windowMinutes; }
    public void setWindowMinutes(int windowMinutes) { this.windowMinutes = windowMinutes; }
    public boolean isEnabled() { return isEnabled; }
    public void setEnabled(boolean enabled) { isEnabled = enabled; }
}