package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO cho yêu cầu đăng ký tài khoản (tự đăng ký, chờ phê duyệt).
 * <p>
 * Dùng cho endpoint POST /api/v1/users/pending.
 * </p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PendingApprovalRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 100, message = "Tên đăng nhập từ 3 đến 100 ký tự")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @Size(max = 200, message = "Họ tên tối đa 200 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 255, message = "Mật khẩu từ 8 đến 255 ký tự")
    private String password;

    @Size(max = 50, message = "Mã vai trò tối đa 50 ký tự")
    private String requestedRoleCode;
}
