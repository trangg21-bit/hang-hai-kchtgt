package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for POST /api/verify/request body.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyTokenRequest {

    @NotBlank(message = "Token không được để trống")
    private String token;
}
