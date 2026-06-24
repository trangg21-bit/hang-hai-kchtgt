package com.hanghai.kchtg.lockout.dto;

/**
 * Response DTO for lockout policy endpoint (F-277).
 */
public class LockoutPolicyResponse {

    private Long id;
    private int maxFailedAttempts;
    private int lockoutDurationMinutes;
    private int windowMinutes;
    private boolean isEnabled;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public int getMaxFailedAttempts() { return maxFailedAttempts; }
    public void setMaxFailedAttempts(int maxFailedAttempts) { this.maxFailedAttempts = maxFailedAttempts; }
    public int getLockoutDurationMinutes() { return lockoutDurationMinutes; }
    public void setLockoutDurationMinutes(int lockoutDurationMinutes) { this.lockoutDurationMinutes = lockoutDurationMinutes; }
    public int getWindowMinutes() { return windowMinutes; }
    public void setWindowMinutes(int windowMinutes) { this.windowMinutes = windowMinutes; }
    public boolean isEnabled() { return isEnabled; }
    public void setEnabled(boolean enabled) { isEnabled = enabled; }
}