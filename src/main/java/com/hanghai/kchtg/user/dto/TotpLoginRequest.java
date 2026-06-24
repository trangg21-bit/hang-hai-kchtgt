package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * DTO cho POST /api/auth/login/totp - phase 2 (TOTP verification).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TotpLoginRequest {

    /** UUID cua nguoi dung da duoc xac thuc sinh ra o phase 1 */
    @NotNull(message = "userId không được để trống")
    private UUID userId;

    /** Code TOTP 6 so */
    @NotBlank(message = "Mã TOTP không được để trống")
    @Size(min = 6, max = 6, message = "Mã TOTP phải có 6 chữ số")
    private String totpCode;
}