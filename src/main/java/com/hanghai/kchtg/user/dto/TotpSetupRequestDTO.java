package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for POST /api/auth/totp/setup request body.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TotpSetupRequestDTO {

    private String userId;
}
