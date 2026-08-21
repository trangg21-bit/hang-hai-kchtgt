package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for POST /api/register request body.
 * <p>
 * The password field may contain either a plaintext password or an
 * RSA-2048 encrypted ciphertext (if the client has fetched the public key).
 * </p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterAccountRequest {

    @Size(max = 100, message = "Tên đăng nhập tối đa 100 ký tự")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 512, message = "Mật khẩu từ 8 đến 512 ký tự")
    private String password;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @Size(max = 200, message = "Họ tên tối đa 200 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

}
