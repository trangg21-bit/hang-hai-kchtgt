package com.hanghai.kchtg.shiprepairfacility.entity;

import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "ship_repair_facility")
@EntityListeners(AuditingEntityListener.class)
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class ShipRepairFacility extends BaseApprovableEntity {

    @Column(name = "facility_name", nullable = false, length = 255)
    private String facilityName;

    @Column(name = "address", nullable = false, length = 500)
    private String address;

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

    @Column(name = "approved_level1", nullable = false)
    @Builder.Default
    private Boolean approvedLevel1 = false;

    @Column(name = "approved_level2", nullable = false)
    @Builder.Default
    private Boolean approvedLevel2 = false;

    @PrePersist
    public void prePersist() {
        if (getApprovalStatus() == null) {
            setApprovalStatus(com.hanghai.kchtg.common.entity.ApprovalStatus.PROPOSED);
        }
        if (this.approvedLevel1 == null) {
            this.approvedLevel1 = false;
        }
        if (this.approvedLevel2 == null) {
            this.approvedLevel2 = false;
        }
    }
}
