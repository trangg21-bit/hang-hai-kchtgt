package com.hanghai.kchtg.user.dto;

import com.hanghai.kchtg.user.service.PermissionRoleService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response body cho việc kiểm tra quyền hạn.
 * <p>
 * Trả về kết quả đánh giá quyền hạn của user đối với một
 * resource + action cụ thể. Dùng bởi PermissionMiddleware
 * và PermissionEvaluationService để trả kết quả cho client.
 * </p>
 *
 * @see PermissionRoleService#checkPermission
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class PermissionResponse {

    /** True nếu user có quyền, false nếu không. */
    private boolean hasPermission;

    /** Resource (feature) đã được kiểm tra.
     *  Ví dụ: {@code manhien}. */
    private String resource;

    /** Action (operation) đã được kiểm tra.
     *  Ví dụ: {@code read}, {@code write}. */
    private String action;

    /** Permission code đầy đủ.
     *  Ví dụ: {@code manhien:read}. */
    private String permissionCode;

    /** Lý do từ chối (chỉ có khi hasPermission = false). */
    private String deniedReason;

    public PermissionResponse(boolean hasPermission, String resource, String action) {
        this.hasPermission = hasPermission;
        this.resource = resource;
        this.action = action;
        this.permissionCode = resource != null && action != null
            ? resource + ":" + action : null;
    }

    public static PermissionResponse granted(String resource, String action) {
        return new PermissionResponse(true, resource, action);
    }

    public static PermissionResponse denied(String resource, String action, String reason) {
        PermissionResponse resp = new PermissionResponse(false, resource, action);
        resp.setDeniedReason(reason);
        return resp;
    }
}
