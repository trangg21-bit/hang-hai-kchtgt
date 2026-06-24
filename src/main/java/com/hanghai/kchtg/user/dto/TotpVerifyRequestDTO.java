package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for POST /api/auth/totp/verify request body.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TotpVerifyRequestDTO {

    private String userId;
    private String code;
}