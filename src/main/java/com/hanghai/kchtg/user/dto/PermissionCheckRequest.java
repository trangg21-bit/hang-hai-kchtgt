package com.hanghai.kchtg.user.dto;

import com.hanghai.kchtg.user.entity.Permission;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body kiểm tra quyền hạn.
 * <p>
 * Gửi kèm {@code resource} (feature) và {@code action} (operation) để
 * hệ thống đánh giá người dùng có được phép thực hiện hay không.
 * Mã permission tuân thủ định dạng {@code {feature}:{action}} (BR-275-01).
 * </p>
 *
 * @see Permission
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PermissionCheckRequest {

    /** Resource (feature) cần kiểm tra quyền.
     *  Ví dụ: {@code manhien}, {@code baocao}, {@code danhmuc}. */
    @NotBlank(message = "Resource (feature) không được để trống")
    @Pattern(
        regexp = "^[a-z][a-z0-9]*$",
        message = "Resource chỉ được chứa chữ thườngng và số"
    )
    @Size(max = 50, message = "Resource tối đa 50 ký tự")
    private String resource;

    /** Action (operation) cần kiểm tra quyền.
     *  Ví dụ: {@code read}, {@code write}, {@code approve}, {@code delete}. */
    @NotBlank(message = "Action không được để trống")
    @Pattern(
        regexp = "^[a-z][a-z0-9]*$",
        message = "Action chỉ được chứa chữ thườngng và số"
    )
    @Size(max = 30, message = "Action tối đa 30 ký tự")
    private String action;

    /**
     * Tạo permission code từ resource và action.
     * Ví dụ: {@code manhien:read}.
     */
    public String getPermissionCode() {
        if (resource != null && action != null) {
            return resource + ":" + action;
        }
        return null;
    }
}
