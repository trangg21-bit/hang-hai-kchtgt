package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for POST /api/auth/totp/setup response body.
 */
@Getter
@Setter
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