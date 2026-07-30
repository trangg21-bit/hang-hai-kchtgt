package com.hanghai.kchtg.station.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.Accessors;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

/**
 * Entity for Coastal Station Inmarsat equipment and operational data.
 * Extends BaseEntity for common station fields.
 */
@Entity
@Table(name = "coastal_station_inmarsat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@SQLRestriction("deleted_at IS NULL")
public class CoastalStationInmarsat extends BaseEntity {
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
    protected StationApprovalStatus approvalStatus;

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    protected ApprovalLevel approvalLevel;

    @Column(name = "approved_by")
    protected String approvedBy;

    @Column(name = "approved_date")
    protected java.time.LocalDateTime approvedDate;

    @Column(length = 1000)
    protected String rejectionReason;


    private String deviceCode;

    private String modemType;

    private String frequency;

    private String coverageZone;

    private String sarCode;

    @Column(length = 1000)
    private String locationAddress;

    private String contactPerson;

    private String contactPhone;

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
