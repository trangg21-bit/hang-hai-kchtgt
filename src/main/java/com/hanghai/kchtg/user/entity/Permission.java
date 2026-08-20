package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Permission (quyền hạn) trong hệ thống phân quyền 3 mức (RBAC 3-tier).
 */
@Entity
@Table(name = "permissions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_permission_code", columnNames = "code"),
        @UniqueConstraint(name = "uk_permission_feature_action", columnNames = { "resource", "action" })
}, indexes = {
        @Index(name = "idx_permission_code", columnList = "code"),
        @Index(name = "idx_permission_feature_action", columnList = "resource,action")
})
@Getter
@Setter
@NoArgsConstructor
@lombok.EqualsAndHashCode(of = "code", callSuper = false)
public class Permission extends BaseEntity {

    @NotBlank(message = "Mã quyền hạn không được để trống")
    @Pattern(regexp = "^[a-z][a-z0-9_]*(:[a-z][a-z0-9_]*)+$", message = "Mã quyền hạn phải theo định dạng {feature}:{action} (chữ thường, không dấu, ký tự hợp lệ)")
    @Size(max = 100, message = "Mã quyền hạn tối đa 100 ký tự")
    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @NotBlank(message = "Tên quyền hạn không được để trống")
    @Size(max = 200, message = "Tên quyền hạn tối đa 200 ký tự")
    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 500)
    private String description;

    @NotBlank(message = "Resource (feature) không được để trống")
    @Size(max = 50, message = "Resource tối đa 50 ký tự")
    @Column(nullable = false, length = 50)
    private String resource;

    @NotBlank(message = "Action không được để trống")
    @Size(max = 30, message = "Action tối đa 30 ký tự")
    @Column(nullable = false, length = 30)
    private String action;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public void setResource(String resource) { this.resource = resource; }
    public void setAction(String action) { this.action = action; }

    public String getResource() {
        if (resource != null && !resource.isEmpty()) {
            return resource;
        }
        String code = this.code;
        if (code != null && code.contains(":")) {
            return code.substring(0, code.indexOf(':'));
        }
        return code;
    }

    public String getAction() {
        if (action != null && !action.isEmpty()) {
            return action;
        }
        String code = this.code;
        if (code != null && code.contains(":")) {
            return code.substring(code.indexOf(':') + 1);
        }
        return code;
    }

    public boolean permits(String requiredResource, String requiredAction) {
        return requiredResource.equals(this.resource)
                && requiredAction.equals(this.action);
    }

    public static String createCode(String resource, String action) {
        return resource + ":" + action;
    }
}
