package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for POST /api/auth/login request body.
 * Accepts login via flexible identifier (email, phone, or username) plus password.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    /** Flexible login identifier - may be username, email, or phone number. */
    @Size(min = 3, max = 150, message = "Identifier phải từ 3 đến 150 ký tự")
    private String identifier;

    /** Legacy field: explicit username login (backward compat). */
    @Size(min = 3, max = 150, message = "Tên đăng nhập phải từ 3 đến 150 ký tự")
    private String username;

    @NotNull(message = "Mật khẩu không được để trống")
    private String password;
}
