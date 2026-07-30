package com.hanghai.kchtg.password.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for change-password endpoint (F-276).
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ChangePasswordResponse {

    private boolean success;
    private String message;
}
