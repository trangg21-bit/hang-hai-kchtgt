package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Tài khoản người dùng hệ thống.
 * <p>
 * Kế thừa {@link BaseEntity} để có sẵn {@code id}, {@code createdAt},
 * {@code updatedAt}.
 * </p>
 */
@Entity
@Table(name = "app_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity implements java.security.Principal {

    /**
     * Tên đăng nhập - duy nhất, không được trống.
     */
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 100, message = "Tên đăng nhập từ 3 đến 100 ký tự")
    @Column(nullable = false, unique = true, length = 100)
    private String username;

    /**
     * Mật khẩu đã mã hóa (BCrypt).
     */
    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 255, message = "Mật khẩu từ 8 đến 255 ký tự")
    @Column(nullable = false, length = 255)
    private String password;

    /**
     * Địa chỉ email - duy nhất, không được trống.
     */
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /**
     * Họ và tên đầy đủ.
     */
    @Size(max = 200, message = "Họ tên tối đa 200 ký tự")
    @Column(length = 200)
    private String fullName;

    /**
     * Số điện thoại liên hệ.
     */
    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    @Column(length = 20)
    private String phone;

    /**
     * Đơn vị tổ chức mà người dùng trực thuộc.
     * Many-to-One relationship with lazy loading.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_unit_id")
    private OrgUnit orgUnit;

    /**
     * Vai trò của người dùng (M-to-N relationship via user_roles join table).
     * Mỗi user chỉ có 1 role chính theo business rule.
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    /**
     * Lấy mã của role chính (role đầu tiên trong set).
     * Chỉ có 1 role theo business rule.
     */
    public String getPrimaryRoleCode() {
        return roles.stream()
            .map(Role::getCode)
            .findFirst()
            .orElse(null);
    }

    /**
     * Lấy tất cả permissions từ tất cả roles + user_permission_override.
     */
    public Set<String> getAllPermissions() {
        Set<String> perms = new HashSet<>();
        for (Role role : roles) {
            if (role.getPermissions() != null) {
                perms.addAll(role.getPermissions().stream()
                    .map(Permission::getCode).collect(Collectors.toSet()));
            }
        }
        if (groups != null) {
            for (UserGroup group : groups) {
                if (group.getPermissions() != null) {
                    perms.addAll(group.getPermissions());
                }
            }
        }
        return perms;
    }

    /**
     * @deprecated Use {@link #getPrimaryRoleCode()} or {@link #getRoles()} instead.
     * Kept for backward compatibility with existing services.
     */
    @Deprecated(forRemoval = true)
    public String getRole() {
        return getPrimaryRoleCode();
    }

    /**
     * @deprecated Use {@link #setRoles(Set)} instead.
     * Kept for backward compatibility with existing services.
     */
    @Deprecated(forRemoval = true)
    public void setRole(String role) {
        // No-op: roles are now managed via the roles Set
    }

    /**
     * Danh sách nhóm người dùng mà người dùng thuộc về.
     * Many-to-Many relationship mapped through join table.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_group_membership", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "user_group_id"))
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

    // =========================================================================

    /**
     * PBKDF2-SHA256 hash of the TOTP secret (format: {@code "salt_hex:hash_hex"}).
     * {@code null} when TOTP is not yet configured for this user.
     */
    @Column(name = "totp_secret_hash", length = 128)
    private String totpSecretHash;

    /**
     * Whether TOTP 2FA is enabled for this user.
     */
    @Column(name = "totp_enabled")
    private Boolean totpEnabled = false;

    /**
     * The most recent TOTP code submitted for verification (used for audit / debugging).
     * 6-character numeric code, {@code null} if no code has been submitted yet.
     */
    @Column(name = "last_totp_code", length = 6)
    private String lastTotpCode;

    /**
     * Timestamp when TOTP was last successfully verified.
     */
    @Column(name = "totp_verified_at")
    private LocalDateTime totpVerifiedAt;

    /**
     * Plain-text TOTP secret (base-32) được bảo mật bằng mã hóa.
     * Chỉ tồn tại khi user đã enable TOTP.
     */
    @Column(name = "totp_secret", length = 255)
    private String totpSecret;

    // =========================================================================

    /**
     * Số lần nhập mật khẩu thất bại liên tiếp (reset = 0 sau khi thành công).
     */
    @Column(name = "failed_login_count", nullable = false)
    private int failedLoginCount = 0;

    /**
     * Số lần nhập code TOTP thất bại liên tiếp (reset = 0 sau khi thành công).
     */
    @Column(name = "failed_totp_count", nullable = false)
    private int failedTotpCount = 0;

    /**
     * Thời điểm hết hạn khóa tài khoản (null = đang không bị khóa).
     * Được set khi failedTotpCount đạt ngưỡng (5) trong 1 khoảng thời gian.
     */
    @Column(name = "account_locked_until")
    private LocalDateTime accountLockedUntil;

    // =========================================================================

    /**
     * Monotonic version for JWT invalidation (F-274 integration).
     * Incremented on every password change.
     */
    @Column(name = "password_hash_version")
    private Integer passwordHashVersion;

    /**
     * Password expiration timestamp.
     * Set at creation/last change = NOW + maxAgeDays.
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * Timestamp of last password change.
     */
    @Column(name = "last_changed_at")
    private LocalDateTime lastChangedAt;

    /**
     * Điểm số sức mạnh mật khẩu (0-100), dùng cho password strength meter.
     */
    @Column(name = "password_strength_score")
    private Integer passwordStrengthScore;

    @Override
    @jakarta.persistence.Transient
    public String getName() {
        return getUsername();
    }
}
