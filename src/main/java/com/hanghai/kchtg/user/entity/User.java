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
     * Ten dang nhap â€” duy nhat, khong duoc trong.
     */
    @NotBlank(message = "Username khong duoc de trong")
    @Size(min = 3, max = 100, message = "Username tu 3 den 100 ky tu")
    @Column(nullable = false, unique = true, length = 100)
    private String username;

    /**
     * Mat khau da ma hoa (BCrypt).
     */
    @NotBlank(message = "Mat khau khong duoc de trong")
    @Size(min = 8, max = 255, message = "Mat khau tu 8 den 255 ky tu")
    @Column(nullable = false, length = 255)
    private String password;

    /**
     * Dia chi email â€” duy nhat, khong duoc trong.
     */
    @NotBlank(message = "Email khong duoc de trong")
    @Email(message = "Email khong hop le")
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /**
     * Ho va ten day du.
     */
    @Size(max = 200, message = "Ho ten toi da 200 ky tu")
    @Column(length = 200)
    private String fullName;

    /**
     * So dien thoai lien he.
     */
    @Size(max = 20, message = "So dien thoai toi da 20 ky tu")
    @Column(length = 20)
    private String phone;

    /**
     * Vai trĂ² cua nguoi dung (e.g. ROLE_USER, ROLE_ADMIN).
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
