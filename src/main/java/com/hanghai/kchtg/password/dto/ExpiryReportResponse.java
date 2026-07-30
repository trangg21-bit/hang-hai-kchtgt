package com.hanghai.kchtg.password.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response body for admin expiry report.
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ExpiryReportResponse {

    private UUID userId;
    private String username;
    private String email;
    private LocalDateTime expiresAt;
    private int daysRemaining;
    private String status;
}
