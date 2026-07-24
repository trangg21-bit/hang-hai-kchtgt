package com.hanghai.kchtg.dikerevetment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "dike_revetment")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DikeRevetment {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private java.util.UUID id;

    @Column(name = "dike_revetment_type")
    @Convert(converter = DikeRevetmentTypeConverter.class)
    private DikeRevetmentType dikeRevetmentType;

    @Column(name = "location", nullable = false, length = 200)
    private String location;

    @Column(name = "dike_revetment_name", length = 255)
    private String dikeRevetmentName;

    @Column(name = "length")
    private Double length;

    @Column(name = "crest_elevation")
    private Double crestElevation;

    @Column(name = "commissioning_date")
    private LocalDate commissioningDate;

    @Column(name = "height")
    private Double height;

    @Column(name = "surface_material", length = 100)
    private String surfaceMaterial;

    @Column(name = "status", length = 100)
    private String status;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "org_unit_id")
    private UUID donViId;

    @Column(name = "approval_status", nullable = false)
    @Convert(converter = DikeRevetmentApprovalStatusConverter.class)
    private DikeRevetmentApprovalStatus approvalStatus;

    @Column(name = "is_approved_level1", nullable = false)
    @Builder.Default
    private Boolean isApprovedLevel1 = false;

    @Column(name = "approver_level1", length = 100)
    private String approverLevel1;

    @Column(name = "approved_date_level1")
    private LocalDate approvedDateLevel1;

    @Column(name = "is_approved_level2", nullable = false)
    @Builder.Default
    private Boolean isApprovedLevel2 = false;

    @Column(name = "approver_level2", length = 100)
    private String approverLevel2;

    @Column(name = "approved_date_level2")
    private LocalDate approvedDateLevel2;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "spatial_id")
    private UUID khongGianId;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by", length = 100)
    private String deletedBy;

    @OneToMany(mappedBy = "dikeRevetment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DikeRevetmentAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "dikeRevetment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DikeRevetmentApprovalHistory> approvalHistory = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
