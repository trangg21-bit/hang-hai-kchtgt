package com.hanghai.kchtg.station.entity;

import java.util.UUID;
import lombok.experimental.Accessors;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.entity.StationApprovalStatus;

/**
 * Entity for Coastal Station Cospas-Sarsat equipment and operational data.
 * Extends com.hanghai.kchtg.common.entity.BaseEntity for common station fields.
 */
@Entity
@Table(name = "coastal_station_cospas_sarsat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@SQLRestriction("deleted_at IS NULL")
public class CoastalStationCospasSarsat extends com.hanghai.kchtg.common.entity.BaseEntity {

    @Column(length = 50)
    protected String code;
    
    @Column(length = 255)
    protected String name;

    @Column(length = 1000)
    protected String description;

    

    

    @Column(name = "unit_id")
    protected UUID unitId;

    @Column(name = "spatial_id")
    protected UUID spatialId;

    @Column(name = "is_active")
    protected Boolean isActive;

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    @Column(name = "status", columnDefinition = "smallint default 0")
    protected StationStatus status;

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    @Column(name = "approval_status", columnDefinition = "smallint default 0")
    protected StationApprovalStatus approvalStatus;

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    protected com.hanghai.kchtg.common.enums.ApprovalLevel approvalLevel;
    
    @Column(name = "approved_by")
    protected String approvedBy;
    
    @Column(name = "approved_date")
    protected java.time.LocalDateTime approvedDate;

    @Column(length = 1000)
    protected String rejectionReason;


    private String frequency;

    private String coverageArea;

    private String beaconProtocol;

    private String emergencyChannel;

    private String antennaType;

    @Column(length = 1000)
    private String locationAddress;

    private String contactPerson;

    private String contactPhone;

    private Double signalRange;

    private String operatingMode;

    /**
     * Initialize status on entity creation.
     */
    @PrePersist
    protected void onCreate() {
        setDefaultStatus();
    }

    @PreUpdate
    protected void onUpdate() {
    }

    private void setDefaultStatus() {
        this.status = StationStatus.PENDING_APPROVAL;
        this.approvalStatus = StationApprovalStatus.PENDING;
    }
}
