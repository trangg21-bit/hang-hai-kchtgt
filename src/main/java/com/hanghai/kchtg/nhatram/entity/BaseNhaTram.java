package com.hanghai.kchtg.nhatram.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.Accessors;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

@MappedSuperclass
@Getter
@Setter
@Accessors(chain = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted_at IS NULL")
public abstract class BaseNhaTram {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String code;
    private String name;
    private Double latitude;
    private Double longitude;

    @Column(length = 1000)
    private String description;

    private java.util.UUID unitId;

    private Boolean isActive;

    @Convert(converter = NhaTramStatusConverter.class)
    private NhaTramStatus status;

    @Convert(converter = NhaTramApprovalStatusConverter.class)
    private NhaTramApprovalStatus approvalStatus;

    private Integer approvalLevel;
    private String approvedBy;
    private LocalDateTime approvedDate;

    @Column(length = 1000)
    private String rejectionReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

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

    @Column(name = "spatial_id")
    private UUID khongGianId;
}
