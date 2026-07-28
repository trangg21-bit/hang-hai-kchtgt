package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Tracks user-role assignment details for audit and RBAC level enforcement (F-275).
 * Complements the existing M-to-N relationship on {@link User#getRoles()}.
 */
@Entity
@Table(name = "user_roles_tracking")
@Getter
@Setter
@NoArgsConstructor
public class UserRole extends BaseEntity {

    /** The user assigned this role. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The role assigned. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /** The admin who granted this role (nullable for system-seeded grants). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    /** When the role was assigned. */
    @Column(nullable = false)
    private LocalDateTime assignedAt;

    /** Optional expiration date for temporary role grants. */
    @Column
    private LocalDateTime expiresAt;

    /** True if this role was directly granted (not inherited via org/group). */
    @Column(name = "is_direct_grant", nullable = false)
    @org.hibernate.annotations.ColumnDefault("false")
    private Boolean isDirectGrant = false;
}
