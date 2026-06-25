package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Permission (quyền hạn) trong hệ thống phân quyền 3 mức (RBAC 3-tier).
 * <p>
 * Mã permission tuân thủ định dạng {@code {feature}:{operation}}, ví dụ:
 * {@code manhien:read}, {@code manhien:write}, {@code manhien:approve}.
 * </p>
 *
 * @see <a href="https://en.wikipedia.org/wiki/Role-based_access_control">RBAC</a>
 */
@Entity
@Table(
    name = "permissions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_permission_code", columnNames = "code"),
        @UniqueConstraint(name = "uk_permission_feature_action", columnNames = {"resource", "action"})
    },
    indexes = {
        @Index(name = "idx_permission_code", columnList = "code"),
        @Index(name = "idx_permission_feature_action", columnList = "resource,action")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class Permission extends BaseEntity {

    // =========================================================================

    /** Mã quyền hạn duy nhất, định dạng {@code feature:action}.
     *  Ví dụ: {@code manhien:read}, {@code baocao:write}, {@code danhmuc:approve}. */
    @NotBlank(message = "Mã quyền hạn không được để trống")
    @Pattern(
        regexp = "^[a-z][a-z0-9]*:[a-z][a-z0-9]*$",
        message = "Mã quyền hạn phải theo định dạng {feature}:{action} (chữ thường, không dấu, ký tự hợp lệ)"
    )
    @Size(max = 100, message = "Mã quyền hạn tối đa 100 ký tự")
    @Column(nullable = false, unique = true, length = 100)
    private String code;

    /** Tên hiển thị của quyền hạn (ví dụ: "Xem danh sách mặt hàng", "Chỉnh sửa báo cáo"). */
    @NotBlank(message = "Tên quyền hạn không được để trống")
    @Size(max = 200, message = "Tên quyền hạn tối đa 200 ký tự")
    @Column(nullable = false, length = 200)
    private String name;

    /** Mô tả chi tiết về quyền hạn này. */
    @Column(length = 500)
    private String description;

    /** Nhóm chức năng / module mà quyền này thuộc về.
     *  Ví dụ: {@code manhien}, {@code baocao}, {@code quanly}. */
    @NotBlank(message = "Resource (feature) không được để trống")
    @Size(max = 50, message = "Resource tối đa 50 ký tự")
    @Column(nullable = false, length = 50)
    private String resource;

    /** Hành động được phép trên resource.
     *  Ví dụ: {@code read}, {@code write}, {@code approve}, {@code delete}, {@code export}. */
    @NotBlank(message = "Action không được để trống")
    @Size(max = 30, message = "Action tối đa 30 ký tự")
    @Column(nullable = false, length = 30)
    private String action;

    // =========================================================================

    /** Vai trò mặc định mà permission này được gán cho (nullable).
     *  Nếu null, permission được gán tự do qua Role.permissions list. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    private Role role;

    // =========================================================================

    /**
     * Trích xuất resource (feature) từ {@link #getCode()}.
     * Ví dụ: "manhien:read" -> "manhien"
     */
    public String getResource() {
        if (resource != null && !resource.isEmpty()) {
            return resource;
        }
        // Fallback: parse from code
        String code = getCode();
        if (code != null && code.contains(":")) {
            return code.split(":")[0];
        }
        return code;
    }

    /**
     * Trích xuất action (operation) từ {@link #getCode()}.
     * Ví dụ: "manhien:read" -> "read"
     */
    public String getAction() {
        if (action != null && !action.isEmpty()) {
            return action;
        }
        // Fallback: parse from code
        String code = getCode();
        if (code != null && code.contains(":")) {
            return code.split(":")[1];
        }
        return code;
    }

    /**
     * Kiểm tra permission này cho phép action cụ thể trên resource.
     */
    public boolean permits(String requiredResource, String requiredAction) {
        return requiredResource.equals(this.resource)
                && requiredAction.equals(this.action);
    }

    /**
     * Tạo permission code từ resource và action.
     */
    public static String createCode(String resource, String action) {
        return resource + ":" + action;
    }
}