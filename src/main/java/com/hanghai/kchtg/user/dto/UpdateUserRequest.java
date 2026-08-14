package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import com.hanghai.kchtg.user.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO cập nhật tài khoản người dùng - mọi trường đều tuỳ chọn,
 * chỉ cập nhật những trường được gửi (khác {@code null}).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6 đến 100 ký tự")
    private String password;

    @Email(message = "Email không đúng định dạng")
    @Size(max = 150, message = "Email không được vượt quá 150 ký tự")
    private String email;

    @Size(max = 200, message = "Họ tên không được vượt quá 200 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phone;

    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String address;

    @Size(max = 100, message = "Phòng ban tối đa 100 ký tự")
    private String department;

    @Size(max = 100, message = "Chức vụ tối đa 100 ký tự")
    private String position;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String note;

    /** Nếu khác null, thay thế toàn bộ permission trực tiếp của tài khoản. */
    private List<String> permissionCodes;

    private UUID orgUnitId;

    private List<UUID> groupIds;

    private UserStatus status;
}
