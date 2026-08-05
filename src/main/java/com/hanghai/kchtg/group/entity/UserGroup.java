package com.hanghai.kchtg.group.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.user.entity.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Nhom nguoi dung (User Group) - dung de gom quyen va phan quyen theo nhom.
 * <p>
 * M-001 F-002: User Group Management
 * </p>
 */
@Entity
@Table(name = "user_groups")
@Getter
@Setter
@NoArgsConstructor
public class UserGroup extends BaseEntity {

    /** Ten hien thi cua nhom (bat buoc). */
    @NotBlank(message = "Tên nhóm không được để trống")
    @Size(max = 100, message = "Tên nhóm tối đa 100 ký tự")
    @Column(nullable = false, length = 100)
    private String name;

    /** Ma dinh danh duy nhat cua nhom (bat buoc, unique). */
    @NotBlank(message = "Mã nhóm không được để trống")
    @Size(max = 50, message = "Mã nhóm tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Mo ta chi tiet ve nhom. */
    @Column(length = 500)
    private String description;

    /** Loai nhom: department / project / custom (BR-012). */
    @NotNull(message = "Loại nhóm không được để trống")
    @Enumerated(EnumType.ORDINAL)
    @Column(name = "group_type", nullable = false)
    private GroupType groupType = GroupType.CUSTOM;

    /** Danh sach ma quyen (permission keys) ma nhom nay so huu. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_group_permissions", joinColumns = @JoinColumn(name = "user_group_id"))
    @Column(name = "permission", nullable = false)
    private List<String> permissions = new ArrayList<>();

    /**
     * Các vai trò được gán cho nhóm. Thành viên nhóm thừa hưởng permissions
     * từ toàn bộ vai trò này (F-002 BR-015 đến BR-017).
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "group_roles",
            joinColumns = @JoinColumn(name = "user_group_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    /** Trang tai: ACTIVE (hoat dong) hoăc INACTIVE (vo hieu). */
    @Enumerated(EnumType.ORDINAL)
    @Column(nullable = false)
    private GroupStatus status = GroupStatus.ACTIVE;

    public List<String> getPermissions() { return permissions; }
    public Set<Role> getRoles() { return roles; }
}
