package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Tai khoan nguoi dung he thong.
 * <p>
 * Ke thua {@link BaseEntity} de co san {@code id}, {@code createdAt}, {@code updatedAt}.
 * </p>
 */
@Entity
@Table(name = "app_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    /**
     * Ten dang nhap — duy nhat, khong duoc trong.
     */
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 100, message = "Tên đăng nhập từ 3 đến 100 ký tự")
    @Column(nullable = false, unique = true, length = 100)
    private String username;

    /**
     * Mat khau da ma hoa (BCrypt).
     */
    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 255, message = "Mật khẩu từ 8 đến 255 ký tự")
    @Column(nullable = false, length = 255)
    private String password;

    /**
     * Dia chi email — duy nhat, khong duoc trong.
     */
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /**
     * Ho va ten day du.
     */
    @Size(max = 200, message = "Họ tên tối đa 200 ký tự")
    @Column(length = 200)
    private String fullName;

    /**
     * So dien thoai lien he.
     */
    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    @Column(length = 20)
    private String phone;

    /**
     * Vai trò cua nguoi dung (e.g. ROLE_USER, ROLE_ADMIN).
     * Ma hoa trong JWT token.
     */
    @Column(length = 50)
    private String role;

    /**
     * Don vi to chuc ma nguoi dung truc thuoc.
     * Many-to-One relationship with lazy loading.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_unit_id")
    private OrgUnit orgUnit;

    /**
     * Danh sach nhom nguoi dung ma nguoi dung thuoc ve.
     * Many-to-Many relationship mapped through join table.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_group_membership",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "user_group_id")
    )
    private List<UserGroup> groups = new ArrayList<>();

    /**
     * Trang tai tai khoan.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    /**
     * Thoi diem dang nhap cuoi cung (co the {@code null} neu chua tung dang nhap).
     */
    @Column
    private LocalDateTime lastLoginAt;
}
