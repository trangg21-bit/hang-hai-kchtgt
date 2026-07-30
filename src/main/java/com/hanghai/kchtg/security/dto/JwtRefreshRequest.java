package com.hanghai.kchtg.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body cho POST /api/auth/refresh.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtRefreshRequest {

    /**
     * Refresh token string (co the lay tu body hoac tu cookie).
     */
    @NotBlank(message = "Refresh token khong duoc để trống")
    private String refreshToken;
}
