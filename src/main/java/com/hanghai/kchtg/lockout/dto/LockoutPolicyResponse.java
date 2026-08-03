package com.hanghai.kchtg.lockout.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Response DTO for lockout policy endpoint (F-277).
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class LockoutPolicyResponse {

    private UUID id;
    private int maxFailedAttempts;
    private int lockoutDurationMinutes;
    private int windowMinutes;
    private boolean isEnabled;

}
