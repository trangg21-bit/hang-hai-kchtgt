package com.hanghai.kchtg.station.entity;
import lombok.experimental.Accessors;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

/**
 * Entity for Coastal Station Cospas-Sarsat equipment and operational data.
 * Extends BaseStation for common station fields.
 */
@Entity
@Table(name = "coastal_station_cospas_sarsat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@SQLRestriction("deleted_at IS NULL")
public class CoastalStationCospasSarsat extends BaseStation {

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
