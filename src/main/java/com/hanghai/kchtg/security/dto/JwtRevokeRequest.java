package com.hanghai.kchtg.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body cho POST /api/auth/revoke/{jti}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtRevokeRequest {

    /**
     * JWT ID (jti) cua token can thu hoi.
     */
    @NotBlank(message = "JTI khong duoc để trống")
    private String jti;
}
