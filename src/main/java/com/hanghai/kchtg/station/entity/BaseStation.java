package com.hanghai.kchtg.station.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Abstract base station entity with common fields shared across all station types.
 */
@MappedSuperclass
@Getter
@Setter
@Accessors(chain = true)
@SQLRestriction("deleted_at IS NULL")
public abstract class BaseStation {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    protected RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    protected UUID id;

    protected String code;
    protected String name;

    @Column(length = 1000)
    protected String description;

    protected java.util.UUID unitId;

    protected Boolean isActive;

    @Enumerated(EnumType.STRING)
    protected StationStatus status;

    @Enumerated(EnumType.STRING)
    protected ApprovalStatus approvalStatus;

    protected Integer approvalLevel;
    protected String approvedBy;
    protected LocalDateTime approvedDate;

    @Column(length = 1000)
    protected String rejectionReason;

    protected LocalDateTime createdAt;
    protected LocalDateTime updatedAt;
    protected LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
