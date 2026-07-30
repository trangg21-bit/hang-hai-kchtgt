package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for POST /api/auth/totp/setup response body.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TotpSetupResponseDTO {

    private String qrCodeSvg;
    private String qrCodePng;
    private String manualSecret;
    private String otpAuthUrl;
    private boolean success;
    private String message;
}
