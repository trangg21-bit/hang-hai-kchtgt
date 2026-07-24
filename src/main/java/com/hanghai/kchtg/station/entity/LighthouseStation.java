package com.hanghai.kchtg.station.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "lighthouse_station")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@SQLRestriction("deleted_at IS NULL")
public class LighthouseStation {
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

    @Column(name = "status", columnDefinition = "varchar(50) default 'DRAFT'")
    private String status;

    @Column(name = "approval_status", columnDefinition = "varchar(50) default 'PENDING'")
    private String approvalStatus;

    private Integer approvalLevel;
    private String approvedBy;
    private LocalDateTime approvedDate;

    @Column(length = 1000)
    private String rejectionReason;

    private String type;

    private Double lightRange;
    private String lightColor;
    private String lightCharacteristic;
    private Double range;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    @Column(name = "spatial_id")
    private UUID khongGianId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "DRAFT";
        if (approvalStatus == null) approvalStatus = "PENDING";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
