package com.hanghai.kchtg.user.dto;

import com.hanghai.kchtg.user.entity.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO tạo mới tài khoản người dùng.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 100, message = "Tên đăng nhập phải từ 3 đến 100 ký tự")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6 đến 100 ký tự")
    private String password;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 150, message = "Email không được vượt quá 150 ký tự")
    private String email;

    @Size(max = 200, message = "Họ tên không được vượt quá 200 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phone;

    /** Trạng thái khởi tạo tài khoản - bắt buộc (BR-001-19, AC-001-12/16). */
    @NotNull(message = "Vui lòng chọn trạng thái")
    private UserStatus status;

    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String address;

    @Size(max = 100, message = "Phòng ban tối đa 100 ký tự")
    private String department;

    @Size(max = 100, message = "Chức vụ tối đa 100 ký tự")
    private String position;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String note;

    /**
     * Các permission cấp trực tiếp cho tài khoản (không bắt buộc).
     *
     * Quyền được cấp sau khi tạo user thông qua thao tác "Phân quyền";
     * không còn là trường bắt buộc của form tạo tài khoản.
     */
    private List<String> permissionCodes;

    @NotNull(message = "Vui lòng chọn đơn vị trực thuộc")
    private UUID orgUnitId;

    private List<UUID> groupIds;
}
