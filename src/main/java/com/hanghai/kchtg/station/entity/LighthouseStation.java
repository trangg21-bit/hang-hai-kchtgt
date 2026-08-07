package com.hanghai.kchtg.station.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "lighthouse_station")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@SQLRestriction("deleted_at IS NULL")
public class LighthouseStation extends BaseEntity {
    @Column(name = "province_id")
    private Integer provinceId;


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
    protected ApprovalStatus approvalStatus;

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    protected ApprovalLevel approvalLevel;

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


