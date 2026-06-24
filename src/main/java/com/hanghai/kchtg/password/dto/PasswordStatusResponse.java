package com.hanghai.kchtg.password.dto;

import java.time.LocalDateTime;

/**
 * Response body for GET /api/auth/my-password-status.
 */
public class PasswordStatusResponse {

    private String status;
    private int daysRemaining;
    private LocalDateTime expiresAt;
    private LocalDateTime lastChangedAt;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(int daysRemaining) { this.daysRemaining = daysRemaining; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getLastChangedAt() { return lastChangedAt; }
    public void setLastChangedAt(LocalDateTime lastChangedAt) { this.lastChangedAt = lastChangedAt; }
}