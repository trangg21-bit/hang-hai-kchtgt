package com.hanghai.kchtg.station.entity;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.Accessors;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.entity.StationApprovalStatus;

/**
 * LRIT (Long Range Identification and Tracking) coastal station entity.
 * Manages LRIT data terminal stations used for maritime vessel tracking.
 */
@Entity
@Table(name = "coastal_station_lrit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@SQLRestriction("deleted_at IS NULL")
public class CoastalStationLRIT extends com.hanghai.kchtg.common.entity.BaseEntity {

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


    private String terminalId;
    private String imoNumber;
    private Integer reportingInterval;
    private Double antennaHeight;
    private Double powerOutput;
    private String antennaType;

    @Column(length = 1000)
    private String locationAddress;

    private String contactPerson;
    private String contactPhone;
    private String dataFormat;
    private String communicationChannel;
    private String coverageArea;

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
