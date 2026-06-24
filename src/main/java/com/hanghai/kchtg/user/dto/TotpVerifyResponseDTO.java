package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for POST /api/auth/totp/verify response body.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TotpVerifyResponseDTO {

    private boolean success;
    private String message;
    private String token;
    private String tokenType = "Bearer";
    private String username;
    private String fullName;
    private String role;
}