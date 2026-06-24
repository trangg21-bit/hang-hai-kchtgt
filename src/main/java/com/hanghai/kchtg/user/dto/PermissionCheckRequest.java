package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body kiểm tra quyền hạn.
 * <p>
 * Gửi kèm {@code resource} (feature) và {@code action} (operation) để
 * hệ thống đánh giá người dùng có được phép thực hiện hay không.
 * Mã permission tuân thủ định dạng {@code {feature}:{action}} (BR-275-01).
 * </p>
 *
 * @see com.hanghai.kchtg.user.entity.Permission
 */
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

    public PermissionCheckRequest() {
    }

    public PermissionCheckRequest(String resource, String action) {
        this.resource = resource;
        this.action = action;
    }

    public String getResource() {
        return resource;
    }

    public void setResource(String resource) {
        this.resource = resource;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

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