package com.hanghai.kchtg.shiprepairfacility.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
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
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
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
    @Enumerated(EnumType.ORDINAL)
    private ApprovalStatus approvalStatus;

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

    @PrePersist
    public void prePersist() {
        if (this.approvalStatus == null) {
            this.approvalStatus = ApprovalStatus.PROPOSED;
        }
        if (this.approvedLevel1 == null) {
            this.approvedLevel1 = false;
        }
        if (this.approvedLevel2 == null) {
            this.approvedLevel2 = false;
        }
    }
}
