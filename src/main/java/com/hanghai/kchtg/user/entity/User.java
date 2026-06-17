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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Tài khoản người dùng hệ thống.
 * <p>
 * Kế thừa {@link BaseEntity} để có sẵn {@code id}, {@code createdAt}, {@code updatedAt}.
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
     * Tên đăng nhập — duy nhất, không được trống.
     */
    @Column(nullable = false, unique = true, length = 100)
    private String username;

    /**
     * Mật khẩu đã mã hoá (BCrypt).
     */
    @Column(nullable = false, length = 255)
    private String password;

    /**
     * Địa chỉ email — duy nhất, không được trống.
     */
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /**
     * Họ và tên đầy đủ.
     */
    @Column(length = 200)
    private String fullName;

    /**
     * Số điện thoại liên hệ.
     */
    @Column(length = 20)
    private String phone;

    /**
     * Vai trò của người dùng (e.g. ROLE_USER, ROLE_ADMIN).
     * Mã hoá trong JWT token.
     */
    @Column(length = 50)
    private String role;

    /**
     * Đơn vị tổ chức mà người dùng trực thuộc.
     * Many-to-One relationship with lazy loading.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_unit_id")
    private OrgUnit orgUnit;

    /**
     * Danh sách nhóm người dùng mà người dùng thuộc về.
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
     * Trạng thái tài khoản.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    /**
     * Thời điểm đăng nhập cuối cùng (có thể {@code null} nếu chưa từng đăng nhập).
     */
    @Column
    private LocalDateTime lastLoginAt;
}
