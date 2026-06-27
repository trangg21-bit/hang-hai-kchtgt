package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

/**
 * Vai trò (Role) trong hệ thống - dùng để nhóm permissions và gán cho người dùng.
 */
@Entity
@Table(name = "app_roles")
@Getter
@Setter
@NoArgsConstructor
public class Role extends BaseEntity {

    /** Tên hiển thị của vai trò (ví dụ: "System Administrator", "Manager"). */
    @NotBlank(message = "Tên vai trò không được để trống")
    @Size(max = 100, message = "Tên vai trò tối đa 100 ký tự")
    @Column(nullable = false, length = 100)
    private String name;

    /** Mã vai trò duy nhất (ví dụ: "ADMIN", "MANAGER", "VIEWER"). */
    @NotBlank(message = "Mã vai trò không được để trống")
    @Size(max = 50, message = "Mã vai trò tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Mô tả chi tiết về vai trò. */
    @Column(length = 500)
    private String description;

    /** Danh sách các permission mà vai trò này sở hữu (M-to-N via role_permissions join table). */
    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.PERSIST)
    @JoinTable(name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id"))
    private Set<Permission> permissions = new HashSet<>();

    /** Trạng thái vai trò. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoleStatus status = RoleStatus.ACTIVE;

    /** Số lượng người dùng đang có vai trò này. */
    @Column(nullable = false)
    private int userCount = 0;
}
