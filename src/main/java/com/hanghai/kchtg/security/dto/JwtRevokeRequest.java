package com.hanghai.kchtg.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body cho POST /api/auth/revoke/{jti}.
 */
@Getter
@Setter
@NoArgsConstructor
public class JwtRevokeRequest {

    /**
     * JWT ID (jti) cua token can thu hoi.
     */
    @NotBlank(message = "JTI khong duoc de trong")
    private String jti;
}