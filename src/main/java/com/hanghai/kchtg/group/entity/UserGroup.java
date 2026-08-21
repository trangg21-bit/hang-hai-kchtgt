package com.hanghai.kchtg.group.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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
    @Size(min = 2, max = 100, message = "Tên nhóm phải từ 2 đến 100 ký tự")
    @Column(nullable = false, length = 100)
    private String name;

    /** Ma dinh danh duy nhat cua nhom (bat buoc, unique). */
    @NotBlank(message = "Mã nhóm không được để trống")
    @Size(min = 2, max = 30, message = "Mã nhóm phải từ 2 đến 30 ký tự")
    @Pattern(regexp = "^[A-Z0-9_]{2,30}$", message = "Mã nhóm chỉ gồm chữ hoa, số và dấu gạch dưới")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Mo ta chi tiet ve nhom. */
    @Column(length = 1000)
    private String description;

    /** Danh sach ma quyen (permission keys) ma nhom nay so huu. */
    @ElementCollection(fetch = FetchType.EAGER)
    @BatchSize(size = 20)
    @CollectionTable(name = "user_group_permissions", joinColumns = @JoinColumn(name = "user_group_id"))
    @Column(name = "permission", nullable = false)
    private List<String> permissions = new ArrayList<>();

    /** Đơn vị quản lý của nhóm (FK to OrgUnit). */
    @Column(name = "organization_id")
    private UUID organizationId;

    /** Trang tai: ACTIVE (hoat dong) hoăc INACTIVE (vo hieu). */
    @Enumerated(EnumType.ORDINAL)
    @Column(nullable = false)
    private GroupStatus status = GroupStatus.ACTIVE;

    public List<String> getPermissions() { return permissions; }
}
