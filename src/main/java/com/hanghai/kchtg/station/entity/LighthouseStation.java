package com.hanghai.kchtg.station.entity;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.SQLRestriction;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.entity.StationApprovalStatus;

@Entity
@Table(name = "lighthouse_station")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@SQLRestriction("deleted_at IS NULL")
public class LighthouseStation extends com.hanghai.kchtg.common.entity.BaseEntity {

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


    private String type;

    private Double lightRange;
    private String lightColor;
    private String lightCharacteristic;
    
    

    private Double range;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;

}


