package com.hanghai.kchtg.admin.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Phân quyền chi tiết cho tài khoản admin - mỗi admin được cấp permissions
 * theo từng module, cho phép kiểm soát granular access.
 */
@Entity
@Table(name = "admin_permissions")
@Getter
@Setter
@NoArgsConstructor
public class AdminPermission extends BaseEntity {

    /** ID của admin account được cấp quyền. */
    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    /** Mã module được cấp quyền (ví dụ: "USER", "ROLE", "GROUP", "ORGUNIT", "ADMIN"). */
    @Column(nullable = false, length = 50)
    private String moduleId;

    /** Danh sách các permission keys (ví dụ: "READ", "WRITE", "DELETE", "APPROVE"). */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "admin_permission_keys",
            joinColumns = @JoinColumn(name = "admin_permission_id"))
    @Column(name = "permission")
    private List<String> permissions = new ArrayList<>();

    /**
     * Tạo mới AdminPermission cho một admin và một module cụ thể.
     */
    public static AdminPermission create(UUID adminId, String moduleId, List<String> permissions) {
        AdminPermission perm = new AdminPermission();
        perm.setAdminId(adminId);
        perm.setModuleId(moduleId);
        perm.setPermissions(permissions != null ? new ArrayList<>(permissions) : new ArrayList<>());
        return perm;
    }
}
