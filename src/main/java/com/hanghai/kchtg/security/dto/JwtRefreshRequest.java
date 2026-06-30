package com.hanghai.kchtg.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body cho POST /api/auth/refresh.
 */
@Getter
@Setter
@NoArgsConstructor
public class JwtRefreshRequest {

    /**
     * Refresh token string (co the lay tu body hoac tu cookie).
     */
    @NotBlank(message = "Refresh token khong duoc để trống")
    private String refreshToken;
}