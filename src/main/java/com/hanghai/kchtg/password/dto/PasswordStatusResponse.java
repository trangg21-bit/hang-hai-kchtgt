package com.hanghai.kchtg.password.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response body for GET /api/auth/my-password-status.
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class PasswordStatusResponse {

    private String status;
    private int daysRemaining;
    private LocalDateTime expiresAt;
    private LocalDateTime lastChangedAt;
}
