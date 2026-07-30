package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for POST /api/auth/totp/verify request body.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TotpVerifyRequestDTO {

    private String userId;
    private String code;
}
