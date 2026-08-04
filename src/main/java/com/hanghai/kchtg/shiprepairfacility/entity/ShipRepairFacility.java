package com.hanghai.kchtg.shiprepairfacility.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ship_repair_facility")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipRepairFacility extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "facility_name", nullable = false, length = 255)
    private String facilityName;

    @Column(name = "address", nullable = false, length = 500)
    private String address;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "facility_type", nullable = false)
    private FacilityType facilityType;

    @Column(name = "capacity", length = 255)
    private String capacity;

    @Column(name = "authority", length = 255)
    private String authority;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "spatial_id")
    private UUID spatialId;

    @Column(name = "approval_status", nullable = false)
    @Convert(converter = ShipRepairApprovalStatusConverter.class)
    private ShipRepairApprovalStatus approvalStatus;

    @Column(name = "approved_level1", nullable = false)
    @Builder.Default
    private Boolean approvedLevel1 = false;

    @Column(name = "approver_level1")
    private UUID approverLevel1;

    @Column(name = "approved_date_level1")
    private LocalDateTime approvedDateLevel1;

    @Column(name = "approved_level2", nullable = false)
    @Builder.Default
    private Boolean approvedLevel2 = false;

    @Column(name = "approver_level2")
    private UUID approverLevel2;

    @Column(name = "approved_date_level2")
    private LocalDateTime approvedDateLevel2;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @CreatedDate
    @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_by")
    private UUID deletedBy;

    @OneToMany(mappedBy = "shipRepairFacility", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<ShipRepairFacilityAttachment> attachments = new java.util.ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.approvalStatus == null) {
            this.approvalStatus = ShipRepairApprovalStatus.PROPOSED;
        }
        if (this.approvedLevel1 == null) {
            this.approvedLevel1 = false;
        }
        if (this.approvedLevel2 == null) {
            this.approvedLevel2 = false;
        }
        if (this.isDeleted == null) {
            this.isDeleted = false;
        }
    }
}
