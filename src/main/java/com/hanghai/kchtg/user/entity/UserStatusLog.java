package com.hanghai.kchtg.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Audit log for user status changes (active/blocked/deleted).
 * Standalone entity — does NOT extend BaseEntity so that
 * {@code @SQLRestriction("deleted_at IS NULL")} does not filter audit records.
 * Rule: BR-001-07 / BR-015.
 */
@Entity
@Table(name = "user_status_log")
@Getter
@Setter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class UserStatusLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false, length = 36)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "old_status")
    private UserStatus oldStatus;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "new_status", nullable = false)
    private UserStatus newStatus;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "operator_id")
    private UUID operatorId;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;
}
