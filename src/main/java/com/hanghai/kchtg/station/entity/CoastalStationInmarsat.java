package com.hanghai.kchtg.station.entity;
import lombok.experimental.Accessors;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

/**
 * Entity for Coastal Station Inmarsat equipment and operational data.
 * Extends BaseStation for common station fields.
 */
@Entity
@Table(name = "coastal_station_inmarsat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@SQLRestriction("deleted_at IS NULL")
public class CoastalStationInmarsat extends BaseStation {

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
    @Override
    protected void onCreate() {
        super.onCreate();
        setDefaultStatus();
    }

    @PreUpdate
    @Override
    protected void onUpdate() {
        super.onUpdate();
    }

    private void setDefaultStatus() {
        this.status = StationStatus.PENDING_APPROVAL;
        this.approvalStatus = StationApprovalStatus.PENDING;
    }
}
