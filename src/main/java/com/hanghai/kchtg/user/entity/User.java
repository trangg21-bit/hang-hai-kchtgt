package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.group.entity.GroupStatus;
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
@org.hibernate.annotations.SQLRestriction("deleted_at IS NULL")
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
    @Column(nullable = false, length = 100)
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
    @Column(nullable = false, length = 150)
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
     * Địa chỉ liên hệ (nullable).
     */
    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    @Column(length = 255)
    private String address;

    /**
     * Phòng ban (nullable).
     */
    @Size(max = 100, message = "Phòng ban tối đa 100 ký tự")
    @Column(length = 100)
    private String department;

    /**
     * Chức vụ (nullable).
     */
    @Size(max = 100, message = "Chức vụ tối đa 100 ký tự")
    @Column(length = 100)
    private String position;

    /**
     * Ghi chú (nullable).
     */
    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    @Column(length = 500)
    private String note;

    /**
     * Đơn vị tổ chức mà người dùng trực thuộc.
     * Many-to-One relationship with lazy loading.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_unit_id")
    private OrgUnit orgUnit;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public OrgUnit getOrgUnit() { return orgUnit; }
    public void setOrgUnit(OrgUnit orgUnit) { this.orgUnit = orgUnit; }
    /**
     * Lấy hợp nhất permission cấp trực tiếp cho user và permission từ các
     * group đang hoạt động mà user đang tham gia.
     */
    public Set<String> getAllPermissions() {
        Set<String> perms = new HashSet<>();
        if (permissionOverrides != null) {
            perms.addAll(permissionOverrides.stream()
                    .filter(override -> override != null
                            && override.getDeletedAt() == null
                            && override.getPermissionCode() != null)
                    .map(o -> o.getPermissionCode().trim().toLowerCase(java.util.Locale.ROOT))
                    .filter(permission -> !permission.isBlank())
                    .collect(Collectors.toSet()));
        }
        if (groups != null) {
            groups.stream()
                    .filter(group -> group != null
                            && (group.getStatus() == null || group.getStatus() == GroupStatus.ACTIVE))
                    .flatMap(group -> group.getPermissions() == null
                            ? java.util.stream.Stream.empty()
                            : group.getPermissions().stream())
                    .filter(java.util.Objects::nonNull)
                    .map(permission -> permission.trim().toLowerCase(java.util.Locale.ROOT))
                    .filter(permission -> !permission.isBlank())
                    // Group inheritance must never provide a global bypass or
                    // an organisation-scope bypass. Those permissions may only
                    // be granted directly by the system administrator.
                    .filter(permission -> !Set.of("group:manage", "admin:all", "orgunit:scope_all", "*")
                            .contains(permission))
                    .forEach(perms::add);
        }
        return perms;
    }

    /**
     * Danh sách nhóm người dùng mà người dùng thuộc về.
     * Many-to-Many relationship mapped through join table.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @org.hibernate.annotations.BatchSize(size = 100)
    @JoinTable(name = "user_group_membership", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "user_group_id"))
    private List<UserGroup> groups = new ArrayList<>();


    /** Quyền cấp trực tiếp cho người dùng ngoài quyền kế thừa từ Group. */
    @OneToMany(mappedBy = "user", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserPermissionOverride> permissionOverrides = new ArrayList<>();

    /**
     * Trạng thái tài khoản.
     */
    @Enumerated(EnumType.ORDINAL)
    @Column(name = "status", nullable = false)
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
     * Monotonic version for permission invalidation.
     * Incremented on every role/group/override change to force JWT re-issuance.
     */
    @Column(name = "permission_version")
    private Integer permissionVersion = 0;

    /**
     * Get the current permission version.
     */
    public Integer getPermissionVersion() {
        return permissionVersion;
    }

    /**
     * Increment the permission version.
     */
    public void incrementPermissionVersion() {
        this.permissionVersion = (this.permissionVersion == null) ? 1 : this.permissionVersion + 1;
    }

    @Override
    @jakarta.persistence.Transient
    public String getName() {
        return this.username;
    }
}
