package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for POST /api/auth/login request body.
 * <p>
 * Extends the original {username} field with a new {identifier} field that
 * accepts email, phone, or username - giving users flexibility in how they
 * sign in.
 * </p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    /**
     * Legacy field: explicit username login.
     */
    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    /**
     * Flexible login identifier - may be username, email, or phone number.
     * When provided, takes precedence over {username}.
     */
    @Null(message = "Identifier không được sử dụng cùng lúc với username")
    @Size(min = 3, max = 150, message = "Identifier phải từ 3 đến 150 ký tự")
    private String identifier;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}