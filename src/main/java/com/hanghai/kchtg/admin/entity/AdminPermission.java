package com.hanghai.kchtg.admin.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Phân quy?n chi ti?t cho tài kho?n admin — m?i admin du?c c?p permissions
 * theo t?ng module, cho phép ki?m soát granular access.
 */
@Entity
@Table(name = "admin_permissions")
@Getter
@Setter
@NoArgsConstructor
public class AdminPermission extends BaseEntity {

    /** ID c?a admin account du?c c?p quy?n. */
    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    /** Mă module du?c c?p quy?n (ví d?: "USER", "ROLE", "GROUP", "ORGUNIT", "ADMIN"). */
    @Column(nullable = false, length = 50)
    private String moduleId;

    /** Danh sách các permission keys (ví d?: "READ", "WRITE", "DELETE", "APPROVE"). */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "admin_permission_keys",
            joinColumns = @JoinColumn(name = "admin_permission_id"))
    @Column(name = "permission")
    private List<String> permissions = new ArrayList<>();

    /**
     * T?o m?i AdminPermission cho m?t admin và m?t module c? th?.
     */
    public static AdminPermission create(UUID adminId, String moduleId, List<String> permissions) {
        AdminPermission perm = new AdminPermission();
        perm.setAdminId(adminId);
        perm.setModuleId(moduleId);
        perm.setPermissions(permissions != null ? new ArrayList<>(permissions) : new ArrayList<>());
        return perm;
    }
}
