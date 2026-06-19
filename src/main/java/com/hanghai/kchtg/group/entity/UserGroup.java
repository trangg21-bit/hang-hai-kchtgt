package com.hanghai.kchtg.group.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Nhom nguoi dung (User Group) — dung de gom quyen và phan quyen theo nhom.
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
    @Column(nullable = false, length = 150)
    private String name;

    /** Ma dinh danh duy nhat cua nhom (bat buoc, unique). */
    @NotBlank(message = "Mã nhóm không được để trống")
    @Size(max = 50, message = "Mã nhóm tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Mo ta chi tiet ve nhom. */
    @Column(length = 500)
    private String description;

    /** Danh sach ma quyen (permission keys) ma nhom nay so huu. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "user_group_permissions",
            joinColumns = @JoinColumn(name = "user_group_id")
    )
    @Column(name = "permission", nullable = false)
    private List<String> permissions = new ArrayList<>();

    /** Trang tai: ACTIVE (hoat dong) hoăc INACTIVE (vo hieu). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private GroupStatus status = GroupStatus.ACTIVE;
}
