package com.hanghai.kchtg.station.entity;
import lombok.*;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
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

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    protected UUID id;

    protected String code;
    protected String name;
    protected Double latitude;
    protected Double longitude;

    @Column(length = 1000)
    protected String description;

    protected Long unitId;

    protected Boolean isActive;

    @Enumerated(EnumType.STRING)
    protected StationStatus status;

    @Enumerated(EnumType.STRING)
    protected StationApprovalStatus approvalStatus;

    protected Integer approvalLevel;
    protected Long approvedBy;
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
