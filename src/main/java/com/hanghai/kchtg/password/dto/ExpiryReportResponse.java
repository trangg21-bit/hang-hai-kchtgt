package com.hanghai.kchtg.password.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response body for admin expiry report.
 */
public class ExpiryReportResponse {

    private UUID userId;
    private String username;
    private String email;
    private LocalDateTime expiresAt;
    private int daysRemaining;
    private String status;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public int getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(int daysRemaining) { this.daysRemaining = daysRemaining; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}