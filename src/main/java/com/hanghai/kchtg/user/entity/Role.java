package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Vai trò (Role) trong he thong — dung de nhom permissions va gán cho nguoi dung.
 */
@Entity
@Table(name = "app_roles")
@Getter
@Setter
@NoArgsConstructor
public class Role extends BaseEntity {

    /** Ten hien thi cua vai trò (ví du: "System Administrator", "Manager"). */
    @NotBlank(message = "Tên vai trò không được để trống")
    @Size(max = 100, message = "Tên vai trò tối đa 100 ký tự")
    @Column(nullable = false, length = 100)
    private String name;

    /** Ma vai trò duy nhat (ví du: "ADMIN", "MANAGER", "VIEWER"). */
    @NotBlank(message = "Mã vai trò không được để trống")
    @Size(max = 50, message = "Mã vai trò tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Mo ta chi tiet ve vai trò. */
    @Column(length = 500)
    private String description;

    /** Danh sach các permission keys ma vai trò nay so huu. */
    @Column(columnDefinition = "TEXT")
    private List<String> permissions = new ArrayList<>();

    /** Trang tai vai trò. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoleStatus status = RoleStatus.ACTIVE;

    /** So luong nguoi dung dang có vai trò nay. */
    @Column(nullable = false)
    private int userCount = 0;
}
